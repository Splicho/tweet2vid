import fs from "node:fs/promises"
import path from "node:path"

import satori, { type Font as SatoriFont } from "satori"
import { Resvg } from "@resvg/resvg-js"

import {
  type BackgroundSettings,
  resolveTextColorForBackground,
} from "./backgrounds"
import { DEFAULT_TEXT_SETTINGS } from "./editor"

export const CANVAS_SIZE = 1080
const PAD = 64
const GAP = 44
const MAX_TEXT_RATIO = 0.34
const MIN_FONT = 24
const LINE_HEIGHT = 1.32

export interface RenderTextOptions {
  text: string
  background: BackgroundSettings
  textColor: string
  fontFamily?: string
  fontWeight?: number
  fontSize?: number
}

export interface RenderTextResult {
  png: Buffer
  videoRect: { x: number; y: number; w: number; h: number }
}

const FONT_FILES: Array<{ family: string; weight: SatoriFont["weight"]; file: string }> = [
  { family: "Inter", weight: 400, file: "inter-400.woff" },
  { family: "Inter", weight: 500, file: "inter-500.woff" },
  { family: "Inter", weight: 600, file: "inter-600.woff" },
  { family: "Inter", weight: 700, file: "inter-700.woff" },
  { family: "Inter", weight: 900, file: "inter-900.woff" },
  { family: "Manrope", weight: 400, file: "manrope-400.woff" },
  { family: "Manrope", weight: 500, file: "manrope-500.woff" },
  { family: "Manrope", weight: 600, file: "manrope-600.woff" },
  { family: "Manrope", weight: 700, file: "manrope-700.woff" },
  { family: "Space Grotesk", weight: 400, file: "space-grotesk-400.woff" },
  { family: "Space Grotesk", weight: 500, file: "space-grotesk-500.woff" },
  { family: "Space Grotesk", weight: 600, file: "space-grotesk-600.woff" },
  { family: "Space Grotesk", weight: 700, file: "space-grotesk-700.woff" },
  { family: "Oswald", weight: 400, file: "oswald-400.woff" },
  { family: "Oswald", weight: 500, file: "oswald-500.woff" },
  { family: "Oswald", weight: 600, file: "oswald-600.woff" },
  { family: "Oswald", weight: 700, file: "oswald-700.woff" },
  { family: "Montserrat", weight: 400, file: "montserrat-400.woff" },
  { family: "Montserrat", weight: 500, file: "montserrat-500.woff" },
  { family: "Montserrat", weight: 600, file: "montserrat-600.woff" },
  { family: "Montserrat", weight: 700, file: "montserrat-700.woff" },
  { family: "Montserrat", weight: 900, file: "montserrat-900.woff" },
  { family: "Poppins", weight: 400, file: "poppins-400.woff" },
  { family: "Poppins", weight: 500, file: "poppins-500.woff" },
  { family: "Poppins", weight: 600, file: "poppins-600.woff" },
  { family: "Poppins", weight: 700, file: "poppins-700.woff" },
  { family: "Poppins", weight: 900, file: "poppins-900.woff" },
  { family: "Roboto", weight: 400, file: "roboto-400.woff" },
  { family: "Roboto", weight: 500, file: "roboto-500.woff" },
  { family: "Roboto", weight: 600, file: "roboto-600.woff" },
  { family: "Roboto", weight: 700, file: "roboto-700.woff" },
  { family: "Roboto", weight: 900, file: "roboto-900.woff" },
  { family: "Nunito", weight: 400, file: "nunito-400.woff" },
  { family: "Nunito", weight: 500, file: "nunito-500.woff" },
  { family: "Nunito", weight: 600, file: "nunito-600.woff" },
  { family: "Nunito", weight: 700, file: "nunito-700.woff" },
  { family: "Nunito", weight: 900, file: "nunito-900.woff" },
  { family: "Barlow", weight: 400, file: "barlow-400.woff" },
  { family: "Barlow", weight: 500, file: "barlow-500.woff" },
  { family: "Barlow", weight: 600, file: "barlow-600.woff" },
  { family: "Barlow", weight: 700, file: "barlow-700.woff" },
  { family: "Barlow", weight: 900, file: "barlow-900.woff" },
  { family: "Sora", weight: 400, file: "sora-400.woff" },
  { family: "Sora", weight: 500, file: "sora-500.woff" },
  { family: "Sora", weight: 600, file: "sora-600.woff" },
  { family: "Sora", weight: 700, file: "sora-700.woff" },
  { family: "Josefin Sans", weight: 400, file: "josefin-sans-400.woff" },
  { family: "Josefin Sans", weight: 500, file: "josefin-sans-500.woff" },
  { family: "Josefin Sans", weight: 600, file: "josefin-sans-600.woff" },
  { family: "Josefin Sans", weight: 700, file: "josefin-sans-700.woff" },
  { family: "DM Sans", weight: 400, file: "dm-sans-400.woff" },
  { family: "DM Sans", weight: 500, file: "dm-sans-500.woff" },
  { family: "DM Sans", weight: 600, file: "dm-sans-600.woff" },
  { family: "DM Sans", weight: 700, file: "dm-sans-700.woff" },
  { family: "DM Sans", weight: 900, file: "dm-sans-900.woff" },
  { family: "Lora", weight: 400, file: "lora-400.woff" },
  { family: "Lora", weight: 500, file: "lora-500.woff" },
  { family: "Lora", weight: 600, file: "lora-600.woff" },
  { family: "Lora", weight: 700, file: "lora-700.woff" },
  { family: "Playfair Display", weight: 400, file: "playfair-display-400.woff" },
  { family: "Playfair Display", weight: 500, file: "playfair-display-500.woff" },
  { family: "Playfair Display", weight: 600, file: "playfair-display-600.woff" },
  { family: "Playfair Display", weight: 700, file: "playfair-display-700.woff" },
  { family: "Playfair Display", weight: 900, file: "playfair-display-900.woff" },
  { family: "Cormorant Garamond", weight: 400, file: "cormorant-garamond-400.woff" },
  { family: "Cormorant Garamond", weight: 500, file: "cormorant-garamond-500.woff" },
  { family: "Cormorant Garamond", weight: 600, file: "cormorant-garamond-600.woff" },
  { family: "Cormorant Garamond", weight: 700, file: "cormorant-garamond-700.woff" },
  { family: "Roboto Slab", weight: 400, file: "roboto-slab-400.woff" },
  { family: "Roboto Slab", weight: 500, file: "roboto-slab-500.woff" },
  { family: "Roboto Slab", weight: 600, file: "roboto-slab-600.woff" },
  { family: "Roboto Slab", weight: 700, file: "roboto-slab-700.woff" },
  { family: "Roboto Slab", weight: 900, file: "roboto-slab-900.woff" },
  { family: "Caveat", weight: 400, file: "caveat-400.woff" },
  { family: "Caveat", weight: 500, file: "caveat-500.woff" },
  { family: "Caveat", weight: 600, file: "caveat-600.woff" },
  { family: "Caveat", weight: 700, file: "caveat-700.woff" },
  { family: "Dancing Script", weight: 400, file: "dancing-script-400.woff" },
  { family: "Dancing Script", weight: 500, file: "dancing-script-500.woff" },
  { family: "Dancing Script", weight: 600, file: "dancing-script-600.woff" },
  { family: "Dancing Script", weight: 700, file: "dancing-script-700.woff" },
  { family: "JetBrains Mono", weight: 400, file: "jetbrains-mono-400.woff" },
  { family: "JetBrains Mono", weight: 500, file: "jetbrains-mono-500.woff" },
  { family: "JetBrains Mono", weight: 600, file: "jetbrains-mono-600.woff" },
  { family: "JetBrains Mono", weight: 700, file: "jetbrains-mono-700.woff" },
  { family: "Roboto Mono", weight: 400, file: "roboto-mono-400.woff" },
  { family: "Roboto Mono", weight: 500, file: "roboto-mono-500.woff" },
  { family: "Roboto Mono", weight: 600, file: "roboto-mono-600.woff" },
  { family: "Roboto Mono", weight: 700, file: "roboto-mono-700.woff" },
]

interface LoadedFont {
  name: string
  data: Buffer
  weight: SatoriFont["weight"]
  style: "normal"
}

let fontCache: LoadedFont[] | null = null

async function loadFonts(): Promise<LoadedFont[]> {
  if (!fontCache) {
    fontCache = await Promise.all(
      FONT_FILES.map(async (font) => ({
        name: font.family,
        data: await fs.readFile(
          path.join(process.cwd(), "public", "fonts", font.file)
        ),
        weight: font.weight,
        style: "normal" as const,
      }))
    )
  }
  return fontCache
}

type VNode = {
  type: string
  props: Record<string, unknown>
}

interface ResolvedFontOptions {
  fontFamily: string
  fontWeight: number
  fontSize: number
}

function resolveFontOptions(
  options: RenderTextOptions
): ResolvedFontOptions {
  return {
    fontFamily: options.fontFamily ?? DEFAULT_TEXT_SETTINGS.fontFamily,
    fontWeight: options.fontWeight ?? DEFAULT_TEXT_SETTINGS.fontWeight,
    fontSize: options.fontSize ?? DEFAULT_TEXT_SETTINGS.fontSize,
  }
}

function textBlock(
  text: string,
  fontSize: number,
  color: string,
  fonts: ResolvedFontOptions
): VNode {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: CANVAS_SIZE - PAD * 2,
        fontSize,
        fontWeight: fonts.fontWeight,
        fontFamily: fonts.fontFamily,
        lineHeight: LINE_HEIGHT,
        color,
        wordBreak: "break-word",
      },
      children: text.split("\n").map((line) => ({
        type: "div",
        props: { children: line },
      })),
    },
  }
}

function backgroundStyle(
  background: BackgroundSettings
): Record<string, unknown> {
  if (background.kind === "solid") {
    return { backgroundColor: background.colors[0] }
  }
  return {
    backgroundImage: `linear-gradient(135deg, ${background.colors.join(", ")})`,
  }
}

function emojiToTwemojiPath(segment: string): string {
  const parts: string[] = []
  for (const char of segment) {
    const code = char.codePointAt(0)
    if (code === undefined || code === 0xfe0f) continue
    parts.push(code.toString(16))
  }
  return parts.join("-")
}

const twemojiCache = new Map<string, string>()

async function loadEmojiPng(segment: string): Promise<string> {
  const hex = emojiToTwemojiPath(segment)
  const cached = twemojiCache.get(hex)
  if (cached) return cached

  const url = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@14.0.2/assets/svg/${hex}.svg`
  const response = await fetch(url)
  if (!response.ok) return ""

  const svg = await response.text()
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 36 } })
  const png = resvg.render().asPng()
  const dataUri = `data:image/png;base64,${Buffer.from(png).toString("base64")}`
  twemojiCache.set(hex, dataUri)
  return dataUri
}

async function renderSvg(
  node: VNode,
  width: number,
  fonts: LoadedFont[]
): Promise<{ svg: string; height: number }> {
  const svg = await satori(node as never, {
    width,
    fonts,
    embedFont: true,
    loadAdditionalAsset: async (languageCode: string, segment: string) => {
      if (languageCode === "emoji") {
        return loadEmojiPng(segment)
      }
      return ""
    },
  })

  const heightMatch = svg.match(/height="([\d.]+)"/)
  return { svg, height: heightMatch ? Number(heightMatch[1]) : 0 }
}

export async function renderTextPng(
  options: RenderTextOptions
): Promise<RenderTextResult> {
  const fonts = await loadFonts()
  const fontOptions = resolveFontOptions(options)
  const color = resolveTextColorForBackground(
    options.background.colors,
    options.textColor
  )
  const maxTextHeight = CANVAS_SIZE * MAX_TEXT_RATIO

  let fontSize = fontOptions.fontSize
  let textHeight = Infinity
  while (fontSize >= MIN_FONT) {
    const { height } = await renderSvg(
      textBlock(options.text, fontSize, color, fontOptions),
      CANVAS_SIZE - PAD * 2,
      fonts
    )
    textHeight = height
    if (textHeight <= maxTextHeight) break
    fontSize -= 2
  }

  textHeight = Math.min(textHeight, maxTextHeight)

  const videoRect = {
    x: PAD,
    y: PAD + textHeight + GAP,
    w: CANVAS_SIZE - PAD * 2,
    h: CANVAS_SIZE - PAD - (PAD + textHeight + GAP),
  }
  if (videoRect.h < 300) {
    videoRect.h = 300
    videoRect.y = CANVAS_SIZE - PAD - 300
  }

  const frame: VNode = {
    type: "div",
    props: {
      style: {
        display: "flex",
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        ...backgroundStyle(options.background),
      },
      children: {
        type: "div",
        props: {
          style: {
            display: "flex",
            position: "absolute",
            left: PAD,
            top: PAD,
            width: CANVAS_SIZE - PAD * 2,
            fontSize,
            fontWeight: fontOptions.fontWeight,
            fontFamily: fontOptions.fontFamily,
            lineHeight: LINE_HEIGHT,
            color,
            wordBreak: "break-word",
          },
          children: options.text.split("\n").map((line) => ({
            type: "div",
            props: { children: line },
          })),
        },
      },
    },
  }

  const { svg } = await renderSvg(frame, CANVAS_SIZE, fonts)
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: CANVAS_SIZE },
    font: { loadSystemFonts: false },
  })

  return { png: resvg.render().asPng(), videoRect }
}
