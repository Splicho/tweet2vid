"use client"

import {
  ChevronDownIcon,
  DownloadIcon,
  PaletteIcon,
  RotateCcwIcon,
  SquareRoundCornerIcon,
  TypeIcon,
  Volume2Icon,
} from "lucide-react"

import { useEditorSettings } from "@/components/editor-settings"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DEFAULT_TEXT_SETTINGS,
  FONT_FAMILIES,
  FONT_WEIGHTS,
  getAvailableWeights,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
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

export function EditToolbar() {
  const { textSettings, setTextSettings } = useEditorSettings()

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
              className="flex w-80 flex-col gap-6"
            >
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold">
                  Font family
                </span>
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
                  <span className="text-xs font-semibold">
                    Font weight
                  </span>
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
                    <span className="text-xs font-semibold">
                      Font size
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                      </TooltipTrigger>
                      <TooltipContent>Reset</TooltipContent>
                    </Tooltip>
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
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                aria-label="Background settings"
              >
                <PaletteIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Background</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                aria-label="Corner roundness settings"
              >
                <SquareRoundCornerIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Roundness</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                aria-label="Sound settings"
              >
                <Volume2Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sound</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="bg-white/10" />
          <Button className="gap-1 normal-case pr-1" aria-label="Export video">
            <DownloadIcon data-icon="inline-start" />
            Export
            <Separator orientation="vertical" className="bg-white/20" />
            <span className="flex items-center px-2">
              <ChevronDownIcon />
            </span>
          </Button>
        </TooltipProvider>
      </div>
    </div>
  )
}
