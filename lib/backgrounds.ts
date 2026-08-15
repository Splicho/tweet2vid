export interface BackgroundPreset {
  id: string
  name: string
  kind: "solid" | "gradient"
  colors: [string, ...string[]]
  dark: boolean
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

export function resolveTextColor(
  backgroundId: string,
  textColor: "auto" | "white" | "black"
): string {
  if (textColor === "white") return "#ffffff"
  if (textColor === "black") return "#0f1419"
  return getBackground(backgroundId).dark ? "#ffffff" : "#0f1419"
}
