import { createReadStream } from "node:fs"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { Readable } from "node:stream"
import { randomUUID } from "node:crypto"
import { spawn } from "node:child_process"

import ffmpegPath from "ffmpeg-static"
import type { NextRequest } from "next/server"

import {
  DEFAULT_BACKGROUND,
  isBackgroundSettings,
} from "@/lib/backgrounds"
import {
  DEFAULT_TEXT_SETTINGS,
  DEFAULT_VOLUME,
  FONT_FAMILIES,
  FONT_WEIGHTS,
  isTextColor,
  MAX_FONT_SIZE,
  MAX_VOLUME,
  MIN_FONT_SIZE,
  MIN_VOLUME,
} from "@/lib/editor"
import { renderTextPng } from "@/lib/render-text"

const VIDEO_HOSTS = ["video.twimg.com", "pbs.twimg.com", "fxtwitter.com"]

type ChildProcess = ReturnType<typeof spawn>

interface RenderJob {
  status: "rendering" | "done" | "error" | "cancelled"
  progress: number
  error?: string
  outputPath?: string
  workDir: string
  format: "mp4" | "webm"
  tweetId: string
  child?: ChildProcess
}

const jobs = new Map<string, RenderJob>()

interface RenderBody {
  tweetId?: string
  text?: string
  videoUrl?: string
  background?: unknown
  roundness?: number
  textColor?: string
  volume?: number
  durationMs?: number
  fontFamily?: string
  fontWeight?: number
  fontSize?: number
  format?: "mp4" | "webm"
}

function parseProgressLine(
  line: string,
  durationMs: number | null,
  job: RenderJob
) {
  const usMatch = line.match(/^out_time_us=(\d+)/)
  if (usMatch && durationMs && durationMs > 0) {
    const seconds = Number(usMatch[1]) / 1_000_000
    job.progress = Math.min(
      99,
      Math.max(0, Math.round((seconds / (durationMs / 1000)) * 100))
    )
  }
  if (line.trim() === "progress=end") {
    job.progress = 100
  }
}

function scheduleJobCleanup(jobId: string, ms: number) {
  setTimeout(() => {
    const job = jobs.get(jobId)
    if (job) {
      void fs.rm(job.workDir, { recursive: true, force: true }).catch(() => {})
      jobs.delete(jobId)
    }
  }, ms).unref()
}

export async function POST(request: NextRequest) {
  let body: RenderBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  const videoUrl = body.videoUrl
  if (!videoUrl) {
    return Response.json({ error: "Missing videoUrl." }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(videoUrl)
  } catch {
    return Response.json({ error: "Invalid videoUrl." }, { status: 400 })
  }
  if (!VIDEO_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))) {
    return Response.json(
      { error: "Only X media hosts are allowed." },
      { status: 400 }
    )
  }

  const text = (body.text ?? "").slice(0, 5000)
  const tweetId = body.tweetId ?? "video"
  const format = body.format === "webm" ? "webm" : "mp4"
  const background = isBackgroundSettings(body.background)
    ? body.background
    : DEFAULT_BACKGROUND
  const roundness = Math.min(100, Math.max(0, Number(body.roundness) || 0))
  const textColor = isTextColor(body.textColor)
    ? body.textColor
    : DEFAULT_TEXT_SETTINGS.textColor
  const fontFamily = FONT_FAMILIES.some((f) => f.id === body.fontFamily)
    ? body.fontFamily!
    : DEFAULT_TEXT_SETTINGS.fontFamily
  const fontWeight = FONT_WEIGHTS.some((w) => w.id === body.fontWeight)
    ? body.fontWeight!
    : DEFAULT_TEXT_SETTINGS.fontWeight
  const fontSize = Math.min(
    MAX_FONT_SIZE,
    Math.max(MIN_FONT_SIZE, Number(body.fontSize) || DEFAULT_TEXT_SETTINGS.fontSize)
  )
  const volume = Math.min(
    MAX_VOLUME,
    Math.max(MIN_VOLUME, Number(body.volume) ?? DEFAULT_VOLUME)
  )
  const durationMs =
    Number.isFinite(Number(body.durationMs)) && Number(body.durationMs) > 0
      ? Number(body.durationMs)
      : null

  if (!ffmpegPath) {
    return Response.json(
      { error: "ffmpeg binary is not available on this server." },
      { status: 500 }
    )
  }

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "tweet2vid-"))
  const videoPath = path.join(workDir, "video.mp4")
  const backgroundPath = path.join(workDir, "background.png")
  const outputPath = path.join(workDir, `output.${format}`)
  const jobId = randomUUID()

  const job: RenderJob = {
    status: "rendering",
    progress: 0,
    workDir,
    format,
    tweetId,
  }
  jobs.set(jobId, job)

  try {
    const videoResponse = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      },
      cache: "no-store",
    })
    if (!videoResponse.ok) {
      job.status = "error"
      job.error = `Could not download the video (${videoResponse.status}).`
      return Response.json({ jobId, status: "error", error: job.error }, { status: 502 })
    }
    await fs.writeFile(
      videoPath,
      Buffer.from(await videoResponse.arrayBuffer())
    )

    const { png, videoRect } = await renderTextPng({
      text,
      background,
      textColor,
      fontFamily,
      fontWeight,
      fontSize,
    })
    await fs.writeFile(backgroundPath, png)

    const w = Math.round(videoRect.w)
    const h = Math.round(videoRect.h)
    const r = Math.min(roundness, Math.min(w, h) / 2 - 1)

    const filterComplex = [
      `[1:v]scale=${w}:${h}:force_original_aspect_ratio=increase`,
      `crop=${w}:${h}`,
      "format=rgba",
      `geq=lum='p(X,Y)':a='if(gt(abs(W/2-X),W/2-${r})*gt(abs(H/2-Y),H/2-${r}),if(lte(hypot(abs(W/2-X)-W/2+${r},abs(H/2-Y)-H/2+${r}),${r}),255,0),255)'[v2]`,
      `[0:v][v2]overlay=${videoRect.x}:${videoRect.y}:format=auto[vout]`,
    ].join(",")

    const args = [
      "-y",
      "-loop", "1",
      "-i", backgroundPath,
      "-i", videoPath,
      "-filter_complex", filterComplex,
      "-map", "[vout]",
      "-map", "1:a?",
      "-c:v", format === "mp4" ? "libx264" : "libvpx-vp9",
      ...(format === "mp4"
        ? ["-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart"]
        : ["-crf", "32", "-b:v", "0", "-deadline", "realtime", "-cpu-used", "8", "-pix_fmt", "yuv420p", "-c:a", "libopus", "-b:a", "128k", "-f", "webm"]),
      "-r", "30",
      ...(volume < MAX_VOLUME
        ? ["-af", `volume=${(volume / 100).toFixed(3)}`]
        : []),
      "-shortest",
      "-progress", "pipe:1",
      "-nostats",
      outputPath,
    ]

    const ffmpeg = spawn(ffmpegPath, args, { windowsHide: true })
    job.child = ffmpeg
    let buffer = ""
    ffmpeg.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8")
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ""
      for (const line of lines) {
        parseProgressLine(line, durationMs, job)
      }
    })
    ffmpeg.on("error", () => {
      job.status = "error"
      job.error = "Rendering failed on the server."
    })
    ffmpeg.on("close", (code) => {
      if (job.status === "cancelled") {
        return
      }
      if (code === 0) {
        job.status = "done"
        job.progress = 100
        job.outputPath = outputPath
      } else {
        job.status = "error"
        job.error = "Rendering failed on the server."
      }
    })
    scheduleJobCleanup(jobId, 15 * 60_000)

    return Response.json({ jobId, status: "rendering", progress: 0 })
  } catch (error) {
    job.status = "error"
    job.error = "Rendering failed on the server."
    console.error("Render failed:", error)
    return Response.json(
      { jobId, status: "error", error: "Rendering failed on the server." },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const jobId = searchParams.get("jobId")
  const action = searchParams.get("action")

  if (!jobId) {
    return Response.json({ error: "Missing jobId." }, { status: 400 })
  }

  const job = jobs.get(jobId)
  if (!job) {
    return Response.json({ error: "Job not found." }, { status: 404 })
  }

  if (action === "cancel") {
    job.status = "cancelled"
    job.child?.kill("SIGTERM")
    return Response.json({ jobId, status: "cancelled" })
  }

  if (action === "download") {
    if (job.status !== "done" || !job.outputPath) {
      return Response.json(
        { error: "Render is not ready yet." },
        { status: 409 }
      )
    }

    let stat
    try {
      stat = await fs.stat(job.outputPath)
    } catch {
      return Response.json({ error: "Output file is missing." }, { status: 404 })
    }

    const stream = createReadStream(job.outputPath)
    stream.on("close", () => {
      void fs.rm(job.workDir, { recursive: true, force: true }).catch(() => {})
      jobs.delete(jobId)
    })

    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "content-type": job.format === "mp4" ? "video/mp4" : "video/webm",
        "content-disposition": `attachment; filename="tweet2vid.com.${job.tweetId}.${job.format}"`,
        "content-length": String(stat.size),
        "cache-control": "no-store",
      },
    })
  }

  return Response.json({
    jobId,
    status: job.status,
    progress: job.progress,
    error: job.error,
  })
}
