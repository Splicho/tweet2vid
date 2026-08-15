import { execFile } from "node:child_process"
import { createReadStream } from "node:fs"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { Readable } from "node:stream"
import { promisify } from "node:util"

import ffmpegPath from "ffmpeg-static"
import type { NextRequest } from "next/server"

import { BACKGROUNDS } from "@/lib/backgrounds"
import { renderTextPng } from "@/lib/render-text"

const execFileAsync = promisify(execFile)

const VIDEO_HOSTS = ["video.twimg.com", "pbs.twimg.com", "fxtwitter.com"]

interface RenderBody {
  tweetId?: string
  text?: string
  videoUrl?: string
  backgroundId?: string
  roundness?: number
  textColor?: "auto" | "white" | "black"
  format?: "mp4" | "webm"
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
  const backgroundId = BACKGROUNDS.some((b) => b.id === body.backgroundId)
    ? body.backgroundId!
    : BACKGROUNDS[0].id
  const roundness = Math.min(100, Math.max(0, Number(body.roundness) || 0))
  const textColor =
    body.textColor === "white" || body.textColor === "black"
      ? body.textColor
      : "auto"

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

  try {
    const videoResponse = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      },
      cache: "no-store",
    })
    if (!videoResponse.ok) {
      return Response.json(
        { error: `Could not download the video (${videoResponse.status}).` },
        { status: 502 }
      )
    }
    await fs.writeFile(
      videoPath,
      Buffer.from(await videoResponse.arrayBuffer())
    )

    const { png, videoRect } = await renderTextPng({
      text,
      backgroundId,
      textColor,
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
      "-shortest",
      outputPath,
    ]

    await execFileAsync(ffmpegPath, args, {
      timeout: 10 * 60_000,
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
    })

    const stat = await fs.stat(outputPath)
    const stream = createReadStream(outputPath)
    stream.on("close", () => {
      void fs.rm(workDir, { recursive: true, force: true }).catch(() => {})
    })

    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "content-type": format === "mp4" ? "video/mp4" : "video/webm",
        "content-disposition": `attachment; filename="tweet-${tweetId}.${format}"`,
        "content-length": String(stat.size),
        "cache-control": "no-store",
      },
    })
  } catch (error) {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {})
    console.error("Render failed:", error)
    return Response.json(
      { error: "Rendering failed on the server. See server logs." },
      { status: 500 }
    )
  }
}
