"use client"

import * as React from "react"

import {
  DEFAULT_TEXT_SETTINGS,
  type TextSettings,
} from "@/lib/editor"

interface EditorSettingsContextValue {
  textSettings: TextSettings
  setTextSettings: (settings: TextSettings) => void
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

  const value = React.useMemo(
    () => ({ textSettings, setTextSettings }),
    [textSettings]
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
