"use client"

import {
  ChevronDownIcon,
  DownloadIcon,
  PaletteIcon,
  SquareRoundCornerIcon,
  TypeIcon,
  Volume2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const TOOL_BUTTONS = [
  { label: "Text", icon: TypeIcon },
  { label: "Background", icon: PaletteIcon },
  { label: "Roundness", icon: SquareRoundCornerIcon },
  { label: "Sound", icon: Volume2Icon },
]

export function EditToolbar() {
  return (
    <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-6">
      <div className="flex items-center gap-1 border border-white/10 bg-black/80 p-1.5 shadow-xl backdrop-blur-md">
        <TooltipProvider>
          {TOOL_BUTTONS.map(({ label, icon: Icon }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white"
                  aria-label={label}
                >
                  <Icon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
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
