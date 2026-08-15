"use client"

import * as React from "react"

import { DEFAULT_BACKGROUND, type BackgroundSettings } from "@/lib/backgrounds"
import {
  DEFAULT_ROUNDNESS,
  DEFAULT_TEXT_SETTINGS,
  DEFAULT_VOLUME,
  type TextSettings,
} from "@/lib/editor"

export type ExportFormat = "mp4" | "webm"

export type ExportHandler = (format: ExportFormat) => Promise<void>

export type CancelExportHandler = () => void

export interface ExportState {
  status: "idle" | "rendering" | "done" | "error"
  progress: number
}

const IDLE_EXPORT_STATE: ExportState = { status: "idle", progress: 0 }

interface EditorSettingsContextValue {
  textSettings: TextSettings
  setTextSettings: (settings: TextSettings) => void
  backgroundSettings: BackgroundSettings
  setBackgroundSettings: (settings: BackgroundSettings) => void
  roundness: number
  setRoundness: (value: number) => void
  volume: number
  setVolume: (value: number) => void
  exportFormat: ExportFormat
  setExportFormat: (format: ExportFormat) => void
  exportVideo: (format: ExportFormat) => Promise<void>
  registerExportHandler: (handler: ExportHandler | null) => void
  registerCancelExportHandler: (handler: CancelExportHandler | null) => void
  cancelExport: () => void
  exportState: ExportState
  setExportState: (state: ExportState) => void
}

const EditorSettingsContext =
  React.createContext<EditorSettingsContextValue | null>(null)

export function EditorSettingsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [textSettings, setTextSettings] =
    React.useState<TextSettings>(DEFAULT_TEXT_SETTINGS)
  const [backgroundSettings, setBackgroundSettings] =
    React.useState<BackgroundSettings>(DEFAULT_BACKGROUND)
  const [roundness, setRoundness] = React.useState(DEFAULT_ROUNDNESS)
  const [volume, setVolume] = React.useState(DEFAULT_VOLUME)
  const [exportFormat, setExportFormat] =
    React.useState<ExportFormat>("mp4")
  const [exportState, setExportState] =
    React.useState<ExportState>(IDLE_EXPORT_STATE)
  const exportHandlerRef = React.useRef<ExportHandler | null>(null)
  const cancelExportHandlerRef = React.useRef<CancelExportHandler | null>(null)

  const registerExportHandler = React.useCallback(
    (handler: ExportHandler | null) => {
      exportHandlerRef.current = handler
    },
    []
  )

  const registerCancelExportHandler = React.useCallback(
    (handler: CancelExportHandler | null) => {
      cancelExportHandlerRef.current = handler
    },
    []
  )

  const exportVideo = React.useCallback(
    async (format: ExportFormat) => {
      const handler = exportHandlerRef.current
      if (!handler) return
      await handler(format)
    },
    []
  )

  const cancelExport = React.useCallback(() => {
    cancelExportHandlerRef.current?.()
  }, [])

  const value = React.useMemo(
    () => ({
      textSettings,
      setTextSettings,
      backgroundSettings,
      setBackgroundSettings,
      roundness,
      setRoundness,
      volume,
      setVolume,
      exportFormat,
      setExportFormat,
      exportVideo,
      registerExportHandler,
      registerCancelExportHandler,
      cancelExport,
      exportState,
      setExportState,
    }),
    [
      textSettings,
      backgroundSettings,
      roundness,
      volume,
      exportFormat,
      exportVideo,
      registerExportHandler,
      registerCancelExportHandler,
      cancelExport,
      exportState,
    ]
  )

  return (
    <EditorSettingsContext.Provider value={value}>
      {children}
    </EditorSettingsContext.Provider>
  )
}

export function useEditorSettings(): EditorSettingsContextValue {
  const context = React.useContext(EditorSettingsContext)
  if (!context) {
    throw new Error(
      "useEditorSettings must be used within an EditorSettingsProvider"
    )
  }
  return context
}
