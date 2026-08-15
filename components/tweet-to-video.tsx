"use client"

import * as React from "react"
import { DownloadIcon, LinkIcon } from "lucide-react"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { BACKGROUNDS } from "@/lib/backgrounds"
import { CANVAS_SIZE, drawFrame } from "@/lib/renderer"
import { fetchTweet, type TweetMedia } from "@/lib/tweet"

type TextColor = "auto" | "white" | "black"
type ExportFormat = "webm" | "mp4"

export function TweetToVideo() {
  const [url, setUrl] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [tweet, setTweet] = React.useState<TweetMedia | null>(null)
  const [videoSrc, setVideoSrc] = React.useState("")
  const [roundness, setRoundness] = React.useState(28)
  const [backgroundId, setBackgroundId] = React.useState(BACKGROUNDS[0].id)
  const [textColor, setTextColor] = React.useState<TextColor>("auto")
  const [exportFormat, setExportFormat] = React.useState<ExportFormat | null>(null)

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const exporting = exportFormat !== null

  const settings = React.useMemo(
    () => ({ backgroundId, roundness, textColor }),
    [backgroundId, roundness, textColor]
  )

  const handleFetch = async () => {
    if (!url.trim() || loading) return
    setLoading(true)
    try {
      const result = await fetchTweet(url)
      setTweet(result)
      setVideoSrc(
        `/api/video?url=${encodeURIComponent(result.videoUrl)}`
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch the tweet.")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    const render = () => {
      drawFrame(ctx, videoRef.current, tweet?.text ?? "", settings)
      raf = requestAnimationFrame(render)
    }
    render()
    return () => cancelAnimationFrame(raf)
  }, [tweet, settings])

  const handleDownload = async (format: ExportFormat) => {
    if (!tweet || exporting) return

    setExportFormat(format)
    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tweetId: tweet.id,
          text: tweet.text,
          videoUrl: tweet.videoUrl,
          backgroundId,
          roundness,
          textColor,
          format,
        }),
      })

      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(json?.error ?? "Rendering failed.")
      }

      const blob = await response.blob()
      downloadBlob(blob, `tweet-${tweet.id}.${format}`)
      toast.success(`Video exported as ${format.toUpperCase()}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.")
    } finally {
      setExportFormat(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tweet to video
        </h1>
        <p className="text-sm text-muted-foreground">
          Paste a link to a video tweet and export it as a square video with
          the tweet text on top.
        </p>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleFetch()
            }}
            placeholder="https://x.com/user/status/1234567890"
            aria-label="Tweet URL"
            disabled={exporting}
          />
        </div>
        <Button onClick={() => void handleFetch()} disabled={loading || exporting || !url.trim()}>
          {loading ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <LinkIcon data-icon="inline-start" />
          )}
          {loading ? "Loading…" : "Load tweet"}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-none border bg-muted/20">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="block aspect-square w-full"
            />
          </div>
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            muted
            loop
            autoPlay
            onLoadedData={(event) => {
              void event.currentTarget.play().catch(() => {})
            }}
            className="hidden"
            onError={() => {
              if (videoSrc) {
                toast.error("Could not load the video from X.")
              }
            }}
          />
          {tweet && (
            <p className="text-xs text-muted-foreground">
              Preview only — the exported video renders at 1080×1080.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Style</CardTitle>
              <CardDescription>Customize the canvas.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Corner roundness</span>
                  <span className="text-xs text-muted-foreground">{roundness}px</span>
                </div>
                <Slider
                  value={[roundness]}
                  onValueChange={(value) => setRoundness(value[0] ?? 0)}
                  min={0}
                  max={80}
                  step={2}
                  disabled={exporting}
                  aria-label="Corner roundness"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium">Background</span>
                <ToggleGroup
                  type="single"
                  value={backgroundId}
                  onValueChange={(value) => {
                    if (value) setBackgroundId(value)
                  }}
                  variant="outline"
                  spacing={2}
                  className="flex flex-wrap"
                >
                  {BACKGROUNDS.map((background) => (
                    <ToggleGroupItem
                      key={background.id}
                      value={background.id}
                      title={background.name}
                      aria-label={background.name}
                      disabled={exporting}
                      className="size-9 p-1"
                    >
                      <span
                        className="size-full rounded-full ring-1 ring-foreground/10"
                        style={{
                          background:
                            background.kind === "gradient"
                              ? `linear-gradient(135deg, ${background.colors.join(", ")})`
                              : background.colors[0],
                        }}
                      />
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium">Text color</span>
                <ToggleGroup
                  type="single"
                  value={textColor}
                  onValueChange={(value) => {
                    if (value) setTextColor(value as TextColor)
                  }}
                  variant="outline"
                  spacing={0}
                >
                  <ToggleGroupItem value="auto" disabled={exporting}>Auto</ToggleGroupItem>
                  <ToggleGroupItem value="white" disabled={exporting}>White</ToggleGroupItem>
                  <ToggleGroupItem value="black" disabled={exporting}>Black</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={!tweet || !videoSrc || exporting}
                    className="w-full"
                  >
                    {exporting ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <DownloadIcon data-icon="inline-start" />
                    )}
                    {exporting ? "Rendering…" : "Download video"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={() => void handleDownload("mp4")}>
                      MP4 — best compatibility
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void handleDownload("webm")}>
                      WebM — faster export
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {exporting && (
                <p className="text-xs text-muted-foreground">
                  Rendering on the server — this can take a minute for long
                  videos.
                </p>
              )}
              {!tweet && (
                <p className="text-xs text-muted-foreground">
                  Load a tweet to enable downloads.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const anchor = document.createElement("a")
  anchor.href = URL.createObjectURL(blob)
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(anchor.href), 10_000)
}
