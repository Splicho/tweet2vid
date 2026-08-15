"use client"

import * as React from "react"

import { AnimatePresence, motion } from "framer-motion"
import { PauseIcon, PlayIcon } from "lucide-react"
import { toast } from "sonner"

import { useEditorSettings } from "@/components/editor-settings"
import { resolveTextColor } from "@/lib/backgrounds"
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

  const { textSettings } = useEditorSettings()

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  const settings = React.useMemo(
    () => ({
      backgroundId: "black",
      roundness: 28,
      textColor: "auto" as const,
      ...textSettings,
    }),
    [textSettings]
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
      void video.play().catch(() => {})
    } else {
      video.pause()
    }
  }

  const textColor = resolveTextColor(settings.backgroundId, settings.textColor)

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
            boxShadow: editing
              ? "inset 0 0 0 1px rgba(255, 255, 255, 0.3)"
              : undefined,
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
        muted
        loop
        autoPlay
        onLoadedData={(event) => {
          void event.currentTarget.play().catch(() => {})
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
