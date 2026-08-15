"use client"

import * as React from "react"

import { AnimatePresence, motion } from "framer-motion"
import {
  ChevronDownIcon,
  DownloadIcon,
  PaletteIcon,
  PencilIcon,
  RotateCcwIcon,
  SquareRoundCornerIcon,
  TypeIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from "lucide-react"
import { HexColorInput, HexColorPicker } from "react-colorful"

import { useEditorSettings } from "@/components/editor-settings"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BACKGROUNDS, resolveTextColorForBackground, type BackgroundSettings } from "@/lib/backgrounds"
import {
  DEFAULT_ROUNDNESS,
  DEFAULT_TEXT_SETTINGS,
  DEFAULT_VOLUME,
  FONT_FAMILIES,
  FONT_WEIGHTS,
  getAvailableWeights,
  MAX_FONT_SIZE,
  MAX_ROUNDNESS,
  MAX_VOLUME,
  MIN_FONT_SIZE,
  MIN_ROUNDNESS,
  MIN_VOLUME,
} from "@/lib/editor"

function snapWeight(value: number, fontFamily: string): number {
  const available = getAvailableWeights(fontFamily)
  let best: number = available[0]
  for (const weight of available) {
    if (Math.abs(weight - value) < Math.abs(best - value)) {
      best = weight
    }
  }
  return best
}

function findPresetId(background: BackgroundSettings): string {
  const preset = BACKGROUNDS.find(
    (p) =>
      p.kind === background.kind &&
      p.colors.join(",") === background.colors.join(",")
  )
  return preset?.id ?? ""
}

export function EditToolbar() {
  const {
    textSettings,
    setTextSettings,
    backgroundSettings,
    setBackgroundSettings,
    roundness,
    setRoundness,
    volume,
    setVolume,
    setExportFormat,
    exportVideo,
    exportState,
    cancelExport,
  } = useEditorSettings()
  const [customOpen, setCustomOpen] = React.useState(false)
  const [textColorOpen, setTextColorOpen] = React.useState(false)

  const switchBackgroundKind = (kind: "solid" | "gradient") => {
    const fallback = BACKGROUNDS.find((b) => b.kind === kind) ?? BACKGROUNDS[0]
    setBackgroundSettings({ kind, colors: [...fallback.colors] })
  }

  return (
    <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-6">
      <div className="flex items-center gap-1 border border-white/10 bg-black/80 p-1.5 shadow-xl backdrop-blur-md">
        <TooltipProvider>
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white"
                    aria-label="Text settings"
                  >
                    <TypeIcon />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Text</TooltipContent>
            </Tooltip>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={12}
              className="flex max-h-[80vh] w-80 flex-col gap-6 overflow-y-auto"
            >
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold">Font family</span>
                <Select
                  value={textSettings.fontFamily}
                  onValueChange={(value) => {
                    setTextSettings({
                      ...textSettings,
                      fontFamily: value,
                      fontWeight: snapWeight(textSettings.fontWeight, value),
                    })
                  }}
                >
                  <SelectTrigger className="w-full justify-between normal-case">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {FONT_FAMILIES.map((family) => (
                        <SelectItem
                          key={family.id}
                          value={family.id}
                          className="normal-case"
                          style={{ fontFamily: family.stack }}
                        >
                          {family.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Font weight</span>
                  <span className="text-xs text-muted-foreground">
                    {FONT_WEIGHTS.find((w) => w.id === textSettings.fontWeight)
                      ?.label ?? textSettings.fontWeight}
                  </span>
                </div>
                <Slider
                  value={[textSettings.fontWeight]}
                  onValueChange={(value) => {
                    setTextSettings({
                      ...textSettings,
                      fontWeight: snapWeight(
                        value[0] ?? textSettings.fontWeight,
                        textSettings.fontFamily
                      ),
                    })
                  }}
                  min={400}
                  max={900}
                  step={10}
                  aria-label="Font weight"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Font size</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground"
                      aria-label="Reset font size"
                      onClick={() => {
                        setTextSettings({
                          ...textSettings,
                          fontSize: DEFAULT_TEXT_SETTINGS.fontSize,
                        })
                      }}
                    >
                      <RotateCcwIcon />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {textSettings.fontSize}px
                  </span>
                </div>
                <Slider
                  value={[textSettings.fontSize]}
                  onValueChange={(value) => {
                    setTextSettings({
                      ...textSettings,
                      fontSize: value[0] ?? textSettings.fontSize,
                    })
                  }}
                  min={MIN_FONT_SIZE}
                  max={MAX_FONT_SIZE}
                  step={2}
                  aria-label="Font size"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold">Text color</span>
                <div className="flex flex-wrap items-center gap-2">
                  <ToggleGroup
                    type="single"
                    value={
                      ["auto", "white", "black"].includes(textSettings.textColor)
                        ? textSettings.textColor
                        : ""
                    }
                    onValueChange={(value) => {
                      if (value) {
                        setTextSettings({ ...textSettings, textColor: value })
                        setTextColorOpen(false)
                      }
                    }}
                    variant="outline"
                    spacing={2}
                    className="flex flex-wrap"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem
                          value="auto"
                          aria-label="Automatic text color"
                          className="size-9 p-0"
                        >
                          <span
                            className="size-full"
                            style={{
                              background:
                                "linear-gradient(135deg, #ffffff 50%, #000000 50%)",
                            }}
                          />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>Automatic</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem
                          value="white"
                          aria-label="White text color"
                          className="size-9 p-0"
                        >
                          <span
                            className="size-full"
                            style={{ background: "#ffffff" }}
                          />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>White</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem
                          value="black"
                          aria-label="Black text color"
                          className="size-9 p-0"
                        >
                          <span
                            className="size-full"
                            style={{ background: "#000000" }}
                          />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>Black</TooltipContent>
                    </Tooltip>
                  </ToggleGroup>
                  <Button
                    variant={textColorOpen ? "default" : "outline"}
                    size="icon"
                    className="size-9"
                    aria-label="Custom text color"
                    aria-expanded={textColorOpen}
                    onClick={() => setTextColorOpen((open) => !open)}
                  >
                    <PencilIcon />
                  </Button>
                </div>
                <AnimatePresence initial={false}>
                  {textColorOpen && (
                    <motion.div
                      key="text-color-custom"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-4 pt-2">
                        <HexColorPicker
                          color={resolveTextColorForBackground(
                            backgroundSettings.colors,
                            textSettings.textColor
                          )}
                          onChange={(color) => {
                            setTextSettings({
                              ...textSettings,
                              textColor: color,
                            })
                          }}
                          className="w-full"
                        />
                        <HexColorInput
                          color={resolveTextColorForBackground(
                            backgroundSettings.colors,
                            textSettings.textColor
                          )}
                          onChange={(color) => {
                            setTextSettings({
                              ...textSettings,
                              textColor: color,
                            })
                          }}
                          className="h-8 w-full border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                          prefixed
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white"
                    aria-label="Background settings"
                  >
                    <PaletteIcon />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Background</TooltipContent>
            </Tooltip>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={12}
              className="flex max-h-[80vh] w-80 flex-col gap-6 overflow-y-auto"
            >
              <ToggleGroup
                type="single"
                value={backgroundSettings.kind}
                onValueChange={(value) => {
                  if (value === "solid" || value === "gradient") {
                    switchBackgroundKind(value)
                  }
                }}
                variant="outline"
                spacing={0}
                className="w-full"
              >
                <ToggleGroupItem value="solid" className="normal-case flex-1">
                  Solid color
                </ToggleGroupItem>
                <ToggleGroupItem value="gradient" className="normal-case flex-1">
                  Gradient
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold">Presets</span>
                <div className="flex flex-wrap items-center gap-2">
                  <ToggleGroup
                    type="single"
                    value={findPresetId(backgroundSettings)}
                    onValueChange={(value) => {
                      const preset = BACKGROUNDS.find((b) => b.id === value)
                      if (preset) {
                        setBackgroundSettings({
                          kind: preset.kind,
                          colors: [...preset.colors],
                        })
                        setCustomOpen(false)
                      }
                    }}
                    variant="outline"
                    spacing={2}
                    className="flex flex-wrap"
                  >
                    {BACKGROUNDS.filter(
                      (b) => b.kind === backgroundSettings.kind
                    ).map((preset) => (
                      <Tooltip key={preset.id}>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem
                            value={preset.id}
                            aria-label={preset.name}
                            className="size-9 p-0"
                          >
                            <span
                              className="size-full"
                              style={{
                                background:
                                  preset.kind === "gradient"
                                    ? `linear-gradient(135deg, ${preset.colors.join(", ")})`
                                    : preset.colors[0],
                              }}
                            />
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>{preset.name}</TooltipContent>
                      </Tooltip>
                    ))}
                  </ToggleGroup>
                  <Button
                    variant={customOpen ? "default" : "outline"}
                    size="icon"
                    className="size-9"
                    aria-label="Custom background"
                    aria-expanded={customOpen}
                    onClick={() => setCustomOpen((open) => !open)}
                  >
                    <PencilIcon />
                  </Button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {customOpen && (
                  <motion.div
                    key="custom"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-4">
                      <span className="text-xs font-semibold">Custom</span>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={backgroundSettings.kind}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-4">
                            {backgroundSettings.kind === "solid" ? (
                              <>
                                <HexColorPicker
                                  color={backgroundSettings.colors[0]}
                                  onChange={(color) => {
                                    setBackgroundSettings({
                                      kind: "solid",
                                      colors: [color],
                                    })
                                  }}
                                  className="w-full"
                                />
                                <HexColorInput
                                  color={backgroundSettings.colors[0]}
                                  onChange={(color) => {
                                    setBackgroundSettings({
                                      kind: "solid",
                                      colors: [color],
                                    })
                                  }}
                                  className="h-8 w-full border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                                  prefixed
                                />
                              </>
                            ) : (
                              <>
                                <div className="flex flex-col gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    Start
                                  </span>
                                  <HexColorPicker
                                    color={backgroundSettings.colors[0]}
                                    onChange={(color) => {
                                      setBackgroundSettings({
                                        kind: "gradient",
                                        colors: [color, backgroundSettings.colors[1]],
                                      })
                                    }}
                                    className="w-full"
                                  />
                                  <HexColorInput
                                    color={backgroundSettings.colors[0]}
                                    onChange={(color) => {
                                      setBackgroundSettings({
                                        kind: "gradient",
                                        colors: [color, backgroundSettings.colors[1]],
                                      })
                                    }}
                                    className="h-8 w-full border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                                    prefixed
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    End
                                  </span>
                                  <HexColorPicker
                                    color={backgroundSettings.colors[1]}
                                    onChange={(color) => {
                                      setBackgroundSettings({
                                        kind: "gradient",
                                        colors: [backgroundSettings.colors[0], color],
                                      })
                                    }}
                                    className="w-full"
                                  />
                                  <HexColorInput
                                    color={backgroundSettings.colors[1]}
                                    onChange={(color) => {
                                      setBackgroundSettings({
                                        kind: "gradient",
                                        colors: [backgroundSettings.colors[0], color],
                                      })
                                    }}
                                    className="h-8 w-full border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                                    prefixed
                                  />
                                </div>
                              </>
                            )}
                          </div>
                          </motion.div>
                        </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </PopoverContent>
          </Popover>

          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white"
                    aria-label="Corner roundness settings"
                  >
                    <SquareRoundCornerIcon />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Roundness</TooltipContent>
            </Tooltip>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={12}
              className="flex w-80 flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Corner roundness</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground"
                    aria-label="Reset roundness"
                    onClick={() => setRoundness(DEFAULT_ROUNDNESS)}
                  >
                    <RotateCcwIcon />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">{roundness}px</span>
              </div>
              <Slider
                value={[roundness]}
                onValueChange={(value) => {
                  setRoundness(value[0] ?? roundness)
                }}
                min={MIN_ROUNDNESS}
                max={MAX_ROUNDNESS}
                step={2}
                aria-label="Corner roundness"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white"
                    aria-label="Sound settings"
                  >
                    {volume === 0 ? <VolumeXIcon /> : <Volume2Icon />}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Sound</TooltipContent>
            </Tooltip>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={12}
              className="flex w-80 flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Volume</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground"
                    aria-label="Reset volume"
                    onClick={() => setVolume(DEFAULT_VOLUME)}
                  >
                    <RotateCcwIcon />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">{volume}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={(value) => {
                  setVolume(value[0] ?? volume)
                }}
                min={MIN_VOLUME}
                max={MAX_VOLUME}
                step={1}
                aria-label="Volume"
              />
            </PopoverContent>
          </Popover>
          <Separator orientation="vertical" className="bg-white/10" />
          {exportState.status === "rendering" ? (
            <Button
              className="w-[210px] gap-1 normal-case pr-1"
              aria-label="Cancel rendering"
              onClick={cancelExport}
            >
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="inline-flex items-center gap-1.5"
              >
                <Spinner className="size-4" />
                Rendering… {exportState.progress}%
              </motion.span>
              <Separator orientation="vertical" className="bg-white/20" />
              <span className="flex items-center px-2">
                <XIcon />
              </span>
            </Button>
          ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="gap-1 normal-case pr-1"
                aria-label="Export video"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key="export"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="inline-flex items-center gap-1.5"
                  >
                    <DownloadIcon data-icon="inline-start" />
                    Export
                  </motion.span>
                </AnimatePresence>
                <Separator orientation="vertical" className="bg-white/20" />
                <span className="flex items-center px-2">
                  <ChevronDownIcon />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="normal-case">
              <DropdownMenuLabel className="normal-case">
                Export as
              </DropdownMenuLabel>
              <DropdownMenuItem
                className="normal-case"
                onSelect={() => {
                  if (exportState.status === "rendering") return
                  setExportFormat("mp4")
                  void exportVideo("mp4")
                }}
              >
                <DownloadIcon />
                MP4
              </DropdownMenuItem>
              <DropdownMenuItem
                className="normal-case"
                onSelect={() => {
                  if (exportState.status === "rendering") return
                  setExportFormat("webm")
                  void exportVideo("webm")
                }}
              >
                <DownloadIcon />
                WebM
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </TooltipProvider>
      </div>
    </div>
  )
}
