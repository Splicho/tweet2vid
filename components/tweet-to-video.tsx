"use client"

import * as React from "react"

import { toast } from "sonner"

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
  const [videoSrc] = React.useState(
    () => `/api/video?url=${encodeURIComponent(initialTweet.videoUrl)}`
  )

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  const settings = React.useMemo(
    () => ({ backgroundId: "black", roundness: 28, textColor: "auto" as const }),
    []
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
      measureCtx ? computeLayout(text, measureCtx, CANVAS_SIZE, fontStack) : null,
    [measureCtx, text, fontStack]
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
            fontWeight: 600,
            fontFamily: "inherit",
            opacity: editing ? 1 : 0,
            boxShadow: editing
              ? "inset 0 0 0 1px rgba(255, 255, 255, 0.3)"
              : undefined,
          }}
        />
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
