export interface TextSettings {
  fontFamily: string
  fontWeight: number
  fontSize: number
}

export const FONT_FAMILIES = [
  { id: "Inter", label: "Inter", stack: "Inter, sans-serif" },
  { id: "Manrope", label: "Manrope", stack: "Manrope, sans-serif" },
  { id: "Space Grotesk", label: "Space Grotesk", stack: '"Space Grotesk", sans-serif' },
  { id: "Oswald", label: "Oswald", stack: "Oswald, sans-serif" },
  { id: "Montserrat", label: "Montserrat", stack: "Montserrat, sans-serif" },
  { id: "Poppins", label: "Poppins", stack: "Poppins, sans-serif" },
  { id: "Roboto", label: "Roboto", stack: "Roboto, sans-serif" },
  { id: "Nunito", label: "Nunito", stack: "Nunito, sans-serif" },
  { id: "Barlow", label: "Barlow", stack: "Barlow, sans-serif" },
  { id: "Sora", label: "Sora", stack: "Sora, sans-serif" },
  { id: "Josefin Sans", label: "Josefin Sans", stack: '"Josefin Sans", sans-serif' },
  { id: "DM Sans", label: "DM Sans", stack: '"DM Sans", sans-serif' },
  { id: "Lora", label: "Lora", stack: "Lora, serif" },
  { id: "Playfair Display", label: "Playfair Display", stack: '"Playfair Display", serif' },
  { id: "Cormorant Garamond", label: "Cormorant Garamond", stack: '"Cormorant Garamond", serif' },
  { id: "Roboto Slab", label: "Roboto Slab", stack: '"Roboto Slab", serif' },
  { id: "Caveat", label: "Caveat", stack: "Caveat, cursive" },
  { id: "Dancing Script", label: "Dancing Script", stack: '"Dancing Script", cursive' },
  { id: "JetBrains Mono", label: "JetBrains Mono", stack: '"JetBrains Mono", monospace' },
  { id: "Roboto Mono", label: "Roboto Mono", stack: '"Roboto Mono", monospace' },
] as const

export const FONT_WEIGHTS = [
  { id: 400, label: "Regular" },
  { id: 500, label: "Medium" },
  { id: 600, label: "SemiBold" },
  { id: 700, label: "Bold" },
  { id: 900, label: "Black" },
] as const

const WEIGHTS_STANDARD = [400, 500, 600, 700]
const WEIGHTS_WITH_BLACK = [400, 500, 600, 700, 900]

export const FONT_FAMILY_WEIGHTS: Record<string, number[]> = {
  Inter: WEIGHTS_WITH_BLACK,
  Montserrat: WEIGHTS_WITH_BLACK,
  Poppins: WEIGHTS_WITH_BLACK,
  Roboto: WEIGHTS_WITH_BLACK,
  Nunito: WEIGHTS_WITH_BLACK,
  Barlow: WEIGHTS_WITH_BLACK,
  "DM Sans": WEIGHTS_WITH_BLACK,
  "Playfair Display": WEIGHTS_WITH_BLACK,
  "Roboto Slab": WEIGHTS_WITH_BLACK,
}

export function getAvailableWeights(fontFamily: string): number[] {
  return FONT_FAMILY_WEIGHTS[fontFamily] ?? WEIGHTS_STANDARD
}

export const DEFAULT_TEXT_SETTINGS: TextSettings = {
  fontFamily: "Inter",
  fontWeight: 600,
  fontSize: 46,
}

export const MIN_FONT_SIZE = 28
export const MAX_FONT_SIZE = 64

export function isTextSettings(value: unknown): value is TextSettings {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return (
    FONT_FAMILIES.some((f) => f.id === v.fontFamily) &&
    FONT_WEIGHTS.some((w) => w.id === v.fontWeight) &&
    typeof v.fontSize === "number" &&
    v.fontSize >= MIN_FONT_SIZE &&
    v.fontSize <= MAX_FONT_SIZE
  )
}
