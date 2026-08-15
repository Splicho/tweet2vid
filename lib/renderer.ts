import { getBackground, resolveTextColor as resolveTextColorFor } from "./backgrounds"
import type { TextSettings } from "./editor"

export const CANVAS_SIZE = 1080

export interface RenderSettings extends TextSettings {
  backgroundId: string
  roundness: number
  textColor: "auto" | "white" | "black"
}

const PAD = 64
const GAP = 44
const MAX_TEXT_RATIO = 0.34
const MIN_FONT = 24
const LINE_HEIGHT = 1.32
const FONT_STACK =
  'Inter, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

export function resolveTextColor(
  settings: RenderSettings
): string {
  return resolveTextColorFor(settings.backgroundId, settings.textColor)
}

function buildFont(
  fontSize: number,
  settings: RenderSettings,
  fallbackStack: string
): string {
  const family = settings.fontFamily.includes(" ")
    ? `"${settings.fontFamily}"`
    : settings.fontFamily
  return `${settings.fontWeight} ${fontSize}px ${family}, ${fallbackStack}`
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
  size: number = CANVAS_SIZE,
  fontStack: string = FONT_STACK,
  settings: RenderSettings
): Layout {
  const maxWidth = size - PAD * 2
  const maxTextHeight = size * MAX_TEXT_RATIO

  let fontSize = settings.fontSize
  let lines: string[] = []
  let lineHeight = 0

  while (fontSize >= MIN_FONT) {
    ctx.font = buildFont(fontSize, settings, fontStack)
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

    const pieces: Array<{ text: string; newWord: boolean }> = []
    for (const word of words) {
      const chunks = breakWord(word, ctx, maxWidth)
      chunks.forEach((chunk, index) => {
        pieces.push({ text: chunk, newWord: index === 0 })
      })
    }

    let line = pieces[0].text
    for (let i = 1; i < pieces.length; i++) {
      const candidate =
        line + (pieces[i].newWord ? " " : "") + pieces[i].text
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate
      } else {
        lines.push(line)
        line = pieces[i].text
      }
    }
    lines.push(line)
  }
  return lines
}

function breakWord(
  word: string,
  ctx: CanvasRenderingContext2D,
  maxWidth: number
): string[] {
  if (ctx.measureText(word).width <= maxWidth) return [word]

  const chunks: string[] = []
  let current = ""
  for (const char of word) {
    const candidate = current + char
    if (current && ctx.measureText(candidate).width > maxWidth) {
      chunks.push(current)
      current = char
    } else {
      current = candidate
    }
  }
  if (current) chunks.push(current)
  return chunks
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement | null,
  text: string,
  settings: RenderSettings,
  size: number = CANVAS_SIZE,
  fontStack: string = FONT_STACK
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

  const layout = computeLayout(text, ctx, size, fontStack, settings)

  ctx.fillStyle = resolveTextColor(settings)
  ctx.textBaseline = "top"
  ctx.font = buildFont(layout.fontSize, settings, fontStack)
  const sample = ctx.measureText("dp")
  const contentArea =
    sample.actualBoundingBoxAscent + sample.actualBoundingBoxDescent
  const halfLeading = Math.max(0, (layout.lineHeight - contentArea) / 2)
  layout.lines.forEach((line, i) => {
    ctx.fillText(line, PAD, PAD + i * layout.lineHeight + halfLeading)
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
