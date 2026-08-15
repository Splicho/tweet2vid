const EMOJI_REGEX = /\p{Extended_Pictographic}/u

export interface TextSegment {
  text: string
  isEmoji: boolean
}

export function splitGraphemes(text: string): TextSegment[] {
  const segmenter = new Intl.Segmenter(undefined, {
    granularity: "grapheme",
  })
  const segments: TextSegment[] = []
  for (const segment of segmenter.segment(text)) {
    const value = segment.segment
    segments.push({ text: value, isEmoji: EMOJI_REGEX.test(value) })
  }
  return segments
}

export function emojiToHex(segment: string): string {
  const parts: string[] = []
  for (const char of segment) {
    const code = char.codePointAt(0)
    if (code === undefined || code === 0xfe0f) continue
    parts.push(code.toString(16))
  }
  return parts.join("-")
}

const TWEMOJI_URL = (hex: string) =>
  `https://cdn.jsdelivr.net/gh/jdecked/twemoji@14.0.2/assets/svg/${hex}.svg`

const loadedImages = new Map<string, HTMLImageElement>()
const pendingImages = new Map<string, Promise<void>>()

function loadTwemojiImage(segment: string): void {
  const hex = emojiToHex(segment)
  if (loadedImages.has(hex) || pendingImages.has(hex)) return

  const promise = new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => {
      loadedImages.set(hex, img)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = TWEMOJI_URL(hex)
  })
  pendingImages.set(hex, promise)
}

export function getLoadedTwemoji(segment: string): HTMLImageElement | undefined {
  return loadedImages.get(emojiToHex(segment))
}

export function ensureTwemojiLoaded(segment: string): void {
  if (getLoadedTwemoji(segment)) return
  loadTwemojiImage(segment)
}

export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number
): number {
  let width = 0
  for (const segment of splitGraphemes(text)) {
    width += segment.isEmoji
      ? fontSize
      : ctx.measureText(segment.text).width
  }
  return width
}
