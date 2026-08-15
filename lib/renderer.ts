import { getBackground, resolveTextColor as resolveTextColorFor } from "./backgrounds"

export const CANVAS_SIZE = 1080

export interface RenderSettings {
  backgroundId: string
  roundness: number
  textColor: "auto" | "white" | "black"
}

const PAD = 64
const GAP = 44
const MAX_TEXT_RATIO = 0.34
const MIN_FONT = 24
const MAX_FONT = 46
const LINE_HEIGHT = 1.32
const FONT_STACK =
  'Inter, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

export function resolveTextColor(
  settings: RenderSettings
): string {
  return resolveTextColorFor(settings.backgroundId, settings.textColor)
}

interface Layout {
  fontSize: number
  lines: string[]
  lineHeight: number
  textHeight: number
  videoRect: { x: number; y: number; w: number; h: number }
}

export function computeLayout(
  text: string,
  ctx: CanvasRenderingContext2D,
  size: number = CANVAS_SIZE
): Layout {
  const maxWidth = size - PAD * 2
  const maxTextHeight = size * MAX_TEXT_RATIO

  let fontSize = MAX_FONT
  let lines: string[] = []
  let lineHeight = 0

  while (fontSize >= MIN_FONT) {
    ctx.font = `600 ${fontSize}px ${FONT_STACK}`
    lineHeight = Math.round(fontSize * LINE_HEIGHT)
    lines = wrapText(text, ctx, maxWidth)
    if (lines.length * lineHeight <= maxTextHeight) break
    fontSize -= 2
  }

  const maxLines = Math.max(1, Math.floor(maxTextHeight / lineHeight))
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines)
    const last = lines[maxLines - 1]
    const trimmed = last.replace(/\s+$/u, "").slice(0, -1)
    lines[maxLines - 1] = `${trimmed}…`
  }

  const textHeight = lines.length * lineHeight
  const videoTop = PAD + textHeight + GAP
  const videoRect = {
    x: PAD,
    y: videoTop,
    w: size - PAD * 2,
    h: size - PAD - videoTop,
  }

  return { fontSize, lines, lineHeight, textHeight, videoRect }
}

function wrapText(
  text: string,
  ctx: CanvasRenderingContext2D,
  maxWidth: number
): string[] {
  const lines: string[] = []
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      lines.push("")
      continue
    }
    let line = words[0]
    for (let i = 1; i < words.length; i++) {
      const candidate = `${line} ${words[i]}`
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate
      } else {
        lines.push(line)
        line = words[i]
      }
    }
    lines.push(line)
  }
  return lines
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement | null,
  text: string,
  settings: RenderSettings,
  size: number = CANVAS_SIZE
) {
  const background = getBackground(settings.backgroundId)

  if (background.kind === "solid") {
    ctx.fillStyle = background.colors[0]
    ctx.fillRect(0, 0, size, size)
  } else {
    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, background.colors[0])
    gradient.addColorStop(1, background.colors[1] ?? background.colors[0])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }

  const layout = computeLayout(text, ctx, size)

  ctx.fillStyle = resolveTextColor(settings)
  ctx.textBaseline = "top"
  ctx.font = `600 ${layout.fontSize}px ${FONT_STACK}`
  layout.lines.forEach((line, i) => {
    ctx.fillText(line, PAD, PAD + i * layout.lineHeight)
  })

  const { x, y, w, h } = layout.videoRect

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, settings.roundness)
  ctx.clip()

  const hasFrame = video && video.readyState >= 2 && video.videoWidth > 0
  if (hasFrame) {
    const scale = Math.max(w / video.videoWidth, h / video.videoHeight)
    const drawW = video.videoWidth * scale
    const drawH = video.videoHeight * scale
    const drawX = x + (w - drawW) / 2
    const drawY = y + (h - drawH) / 2
    ctx.drawImage(video, drawX, drawY, drawW, drawH)
  } else {
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)"
    ctx.fillRect(x, y, w, h)
  }
  ctx.restore()
}
