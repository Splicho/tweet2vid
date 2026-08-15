"use client"

import * as React from "react"

import { AnimatePresence, motion } from "framer-motion"
import { PauseIcon, PlayIcon } from "lucide-react"
import { toast } from "sonner"

import {
  useEditorSettings,
  type ExportFormat,
  type ExportState,
} from "@/components/editor-settings"
import { resolveTextColorForBackground } from "@/lib/backgrounds"
import { CANVAS_SIZE, computeLayout, drawFrame } from "@/lib/renderer"
import type { TweetMedia } from "@/lib/tweet"

const PAD = 64

export function TweetToVideo({
  initialTweet,
}: {
  initialTweet: TweetMedia
}) {
  const [text, setText] = React.useState(initialTweet.text)
  const [hovering, setHovering] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [hoveringVideo, setHoveringVideo] = React.useState(false)
  const [playing, setPlaying] = React.useState(false)
  const [videoSrc] = React.useState(
    () => `/api/video?url=${encodeURIComponent(initialTweet.videoUrl)}`
  )

  const {
    textSettings,
    backgroundSettings,
    roundness,
    volume,
    registerExportHandler,
    registerCancelExportHandler,
    setExportState,
  } = useEditorSettings()

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = React.useState(false)
  const activeJobRef = React.useRef<string | null>(null)

  const settings = React.useMemo(
    () => ({
      background: backgroundSettings,
      roundness,
      ...textSettings,
    }),
    [textSettings, backgroundSettings, roundness]
  )

  const editing = hovering || focused

  const measureCtx = React.useMemo(() => {
    if (typeof document === "undefined") return null
    const canvas = document.createElement("canvas")
    return canvas.getContext("2d")
  }, [])

  const fontStack = React.useMemo(() => {
    if (typeof document === "undefined") return undefined
    return getComputedStyle(document.body).fontFamily
  }, [])

  const layout = React.useMemo(
    () =>
      measureCtx
        ? computeLayout(text, measureCtx, CANVAS_SIZE, fontStack, settings)
        : null,
    [measureCtx, text, fontStack, settings]
  )

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    const render = () => {
      drawFrame(ctx, videoRef.current, text, settings, CANVAS_SIZE, fontStack)
      raf = requestAnimationFrame(render)
    }
    render()
    return () => cancelAnimationFrame(raf)
  }, [text, settings, fontStack])

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      setMuted(false)
      void video.play().catch(() => {})
    } else {
      video.pause()
    }
  }

  React.useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.volume = volume / 100
    }
  }, [volume])

  const textColor = resolveTextColorForBackground(
    backgroundSettings.colors,
    settings.textColor
  )

  const handleExport = React.useCallback(
    async (format: ExportFormat) => {
      const setState = (state: ExportState) => setExportState(state)
      try {
        setState({ status: "rendering", progress: 0 })
        const response = await fetch("/api/render", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            tweetId: initialTweet.id,
            text,
            videoUrl: initialTweet.videoUrl,
            background: backgroundSettings,
            roundness,
            textColor: textSettings.textColor,
            volume,
            durationMs: initialTweet.durationMs,
            fontFamily: textSettings.fontFamily,
            fontWeight: textSettings.fontWeight,
            fontSize: textSettings.fontSize,
            format,
          }),
        })

        let jobId: string
        try {
          const data = (await response.json()) as {
            jobId?: string
            error?: string
          }
          if (!response.ok || !data.jobId) {
            throw new Error(data.error ?? "Export failed.")
          }
          jobId = data.jobId
        } catch {
          throw new Error("Export failed.")
        }
        activeJobRef.current = jobId

        let lastProgress = 0
        while (true) {
          if (activeJobRef.current !== jobId) {
            return
          }
          const progressResponse = await fetch(
            `/api/render?action=progress&jobId=${encodeURIComponent(jobId)}`
          )
          const progressData = (await progressResponse.json()) as {
            status?: ExportState["status"]
            progress?: number
            error?: string
          }
          if (!progressResponse.ok) {
            throw new Error(progressData.error ?? "Export failed.")
          }

          const progress = Math.round(progressData.progress ?? 0)
          if (progress !== lastProgress) {
            lastProgress = progress
            setState({ status: "rendering", progress })
          }

          if (progressData.status === "error") {
            throw new Error(progressData.error ?? "Export failed.")
          }
          if (progressData.status === "done") {
            break
          }
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
        activeJobRef.current = null

        const downloadResponse = await fetch(
          `/api/render?action=download&jobId=${encodeURIComponent(jobId)}`
        )
        if (!downloadResponse.ok) {
          throw new Error("Could not download the rendered video.")
        }
        const blob = await downloadResponse.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `tweet2vid.com.${initialTweet.id}.${format}`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        setState({ status: "done", progress: 100 })
        toast.success("Export complete.")
      } catch (error) {
        setState({ status: "error", progress: 0 })
        toast.error(
          error instanceof Error ? error.message : "Export failed."
        )
      } finally {
        if (activeJobRef.current) {
          activeJobRef.current = null
        }
      }
    },
    [
      initialTweet.id,
      initialTweet.videoUrl,
      initialTweet.durationMs,
      text,
      backgroundSettings,
      roundness,
      textSettings,
      volume,
      setExportState,
    ]
  )

  const handleCancelExport = React.useCallback(() => {
    const jobId = activeJobRef.current
    if (!jobId) return
    activeJobRef.current = null
    void fetch(`/api/render?action=cancel&jobId=${encodeURIComponent(jobId)}`)
      .catch(() => {})
    setExportState({ status: "idle", progress: 0 })
    toast.info("Rendering cancelled.")
  }, [setExportState])

  React.useEffect(() => {
    registerExportHandler(handleExport)
    registerCancelExportHandler(handleCancelExport)
    return () => {
      registerExportHandler(null)
      registerCancelExportHandler(null)
    }
  }, [handleExport, handleCancelExport, registerExportHandler, registerCancelExportHandler])

  return (
    <div className="relative w-full" style={{ containerType: "inline-size" }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="block aspect-square w-full"
      />
      {layout && (
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Tweet text"
          spellCheck={false}
          className="absolute z-10 resize-none overflow-hidden border-0 bg-black/40 p-0 outline-none transition-opacity duration-150"
          style={{
            left: `${(PAD / CANVAS_SIZE) * 100}%`,
            top: `${(PAD / CANVAS_SIZE) * 100}%`,
            width: `${((CANVAS_SIZE - PAD * 2) / CANVAS_SIZE) * 100}%`,
            height: `${(layout.textHeight / CANVAS_SIZE) * 100}%`,
            fontSize: `${layout.fontSize / 10.8}cqw`,
            lineHeight: `${layout.lineHeight / 10.8}cqw`,
            color: "transparent",
            caretColor: textColor,
            fontWeight: textSettings.fontWeight,
            fontFamily: `${textSettings.fontFamily}, ${fontStack}`,
            opacity: editing ? 1 : 0,
          }}
        />
      )}
      {layout && (
        <div
          className="absolute z-10 flex cursor-pointer items-center justify-center"
          style={{
            left: `${(layout.videoRect.x / CANVAS_SIZE) * 100}%`,
            top: `${(layout.videoRect.y / CANVAS_SIZE) * 100}%`,
            width: `${(layout.videoRect.w / CANVAS_SIZE) * 100}%`,
            height: `${(layout.videoRect.h / CANVAS_SIZE) * 100}%`,
          }}
          onMouseEnter={() => setHoveringVideo(true)}
          onMouseLeave={() => setHoveringVideo(false)}
          onClick={togglePlayback}
        >
          <AnimatePresence>
            {hoveringVideo && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex size-20 items-center justify-center rounded-full shadow-2xl"
                style={{
                  background:
                    "linear-gradient(180deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 55%, black) 100%)",
                }}
                aria-label={playing ? "Pause video" : "Play video"}
              >
                {playing ? (
                  <PauseIcon className="size-8 text-white" />
                ) : (
                  <PlayIcon className="size-8 translate-x-0.5 text-white" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        muted={muted}
        loop
        autoPlay
        onLoadedData={(event) => {
          const video = event.currentTarget
          video.volume = volume / 100
          void video.play().catch(() => {
            if (muted) return
            setMuted(true)
            video.muted = true
            void video.play().catch(() => {})
          })
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="hidden"
        onError={() => {
          if (videoSrc) {
            toast.error("Could not load the video from X.")
          }
        }}
      />
    </div>
  )
}
