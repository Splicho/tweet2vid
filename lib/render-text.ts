import fs from "node:fs/promises"
import path from "node:path"

import satori from "satori"
import { Resvg } from "@resvg/resvg-js"

import { getBackground, resolveTextColor } from "./backgrounds"

export const CANVAS_SIZE = 1080
const PAD = 64
const GAP = 44
const MAX_TEXT_RATIO = 0.34
const MIN_FONT = 24
const MAX_FONT = 46
const LINE_HEIGHT = 1.32

export interface RenderTextOptions {
  text: string
  backgroundId: string
  textColor: "auto" | "white" | "black"
}

export interface RenderTextResult {
  png: Buffer
  videoRect: { x: number; y: number; w: number; h: number }
}

let fontCache: Buffer | null = null

async function loadFont(): Promise<Buffer> {
  if (!fontCache) {
    fontCache = await fs.readFile(
      path.join(process.cwd(), "public", "fonts", "inter-600.woff")
    )
  }
  return fontCache
}

type VNode = {
  type: string
  props: Record<string, unknown>
}

function textBlock(
  text: string,
  fontSize: number,
  color: string
): VNode {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: CANVAS_SIZE - PAD * 2,
        fontSize,
        fontWeight: 600,
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

function backgroundStyle(backgroundId: string): Record<string, unknown> {
  const background = getBackground(backgroundId)
  if (background.kind === "solid") {
    return { backgroundColor: background.colors[0] }
  }
  return {
    backgroundImage: `linear-gradient(135deg, ${background.colors.join(", ")})`,
  }
}

async function renderSvg(node: VNode, width: number): Promise<{ svg: string; height: number }> {
  const font = await loadFont()
  const svg = await satori(node as never, {
    width,
    fonts: [
      {
        name: "Inter",
        data: font,
        weight: 600,
        style: "normal",
      },
    ],
    embedFont: true,
    loadAdditionalAsset: (languageCode: string, segment: string) => {
      if (languageCode === "emoji") {
        return Promise.resolve(
          `https://cdn.jsdelivr.net/twitter/twemoji@14.0.2/assets/svg/${segment}.svg`
        )
      }
      return Promise.resolve("")
    },
  })

  const heightMatch = svg.match(/height="([\d.]+)"/)
  return { svg, height: heightMatch ? Number(heightMatch[1]) : 0 }
}

export async function renderTextPng(
  options: RenderTextOptions
): Promise<RenderTextResult> {
  const color = resolveTextColor(options.backgroundId, options.textColor)
  const maxTextHeight = CANVAS_SIZE * MAX_TEXT_RATIO

  let fontSize = MAX_FONT
  let textHeight = Infinity
  while (fontSize >= MIN_FONT) {
    const { height } = await renderSvg(
      textBlock(options.text, fontSize, color),
      CANVAS_SIZE - PAD * 2
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
        ...backgroundStyle(options.backgroundId),
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
            fontWeight: 600,
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

  const { svg } = await renderSvg(frame, CANVAS_SIZE)
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: CANVAS_SIZE },
    font: { loadSystemFonts: false },
  })

  return { png: resvg.render().asPng(), videoRect }
}
