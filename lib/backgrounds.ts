export interface BackgroundPreset {
  id: string
  name: string
  kind: "solid" | "gradient"
  colors: [string, ...string[]]
  dark: boolean
}

export interface BackgroundSettings {
  kind: "solid" | "gradient"
  colors: string[]
}

export const DEFAULT_BACKGROUND: BackgroundSettings = {
  kind: "solid",
  colors: ["#000000"],
}

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function isBackgroundSettings(value: unknown): value is BackgroundSettings {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  if (v.kind !== "solid" && v.kind !== "gradient") return false
  if (!Array.isArray(v.colors)) return false
  const expected = v.kind === "solid" ? 1 : 2
  if (v.colors.length !== expected) return false
  return v.colors.every((c) => typeof c === "string" && HEX_RE.test(c))
}

export const BACKGROUNDS: BackgroundPreset[] = [
  { id: "black", name: "Black", kind: "solid", colors: ["#000000"], dark: true },
  { id: "white", name: "White", kind: "solid", colors: ["#ffffff"], dark: false },
  { id: "blue", name: "Blue", kind: "solid", colors: ["#1d9bf0"], dark: true },
  { id: "navy", name: "Navy", kind: "solid", colors: ["#0f172a"], dark: true },
  { id: "cream", name: "Cream", kind: "solid", colors: ["#f6f1e7"], dark: false },
  {
    id: "sunset",
    name: "Sunset",
    kind: "gradient",
    colors: ["#ff9a9e", "#fad0c4"],
    dark: true,
  },
  {
    id: "ocean",
    name: "Ocean",
    kind: "gradient",
    colors: ["#2193b0", "#6dd5ed"],
    dark: true,
  },
  {
    id: "aurora",
    name: "Aurora",
    kind: "gradient",
    colors: ["#8e2de2", "#4a00e0"],
    dark: true,
  },
  {
    id: "peach",
    name: "Peach",
    kind: "gradient",
    colors: ["#f7971e", "#ffd200"],
    dark: true,
  },
  {
    id: "forest",
    name: "Forest",
    kind: "gradient",
    colors: ["#134e5e", "#71b280"],
    dark: true,
  },
  {
    id: "sky",
    name: "Sky",
    kind: "gradient",
    colors: ["#a1c4fd", "#c2e9fb"],
    dark: false,
  },
]

export function getBackground(id: string): BackgroundPreset {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0]
}

export function relativeLuminance(hex: string): number {
  const raw = hex.replace("#", "")
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const channel = (value: number) =>
    value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function resolveTextColorForBackground(
  colors: string[],
  textColor: string
): string {
  if (textColor === "white") return "#ffffff"
  if (textColor === "black") return "#000000"
  if (textColor !== "auto") return textColor
  const luminance =
    colors.reduce((sum, color) => sum + relativeLuminance(color), 0) /
    colors.length
  return luminance < 0.5 ? "#ffffff" : "#000000"
}
