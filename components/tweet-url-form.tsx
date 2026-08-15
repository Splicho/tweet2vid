"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LinkIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { fetchTweet, type TweetMedia } from "@/lib/tweet"

export function TweetUrlForm() {
  const router = useRouter()
  const [url, setUrl] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async () => {
    if (!url.trim() || loading) return
    setLoading(true)
    try {
      const tweet = await fetchTweet(url)
      cacheTweet(tweet, url)
      router.push(`/${tweet.id}/edit`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch the tweet.")
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-3 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Turn a tweet into a video
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          No sign-up, no watermarks. Paste a tweet, customize the look, and
          download your video in seconds.
        </p>
      </div>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleSubmit()
            }}
            placeholder="https://x.com/user/status/1234567890"
            aria-label="Tweet URL"
            disabled={loading}
            autoFocus
            className="h-14 px-5 text-base"
          />
        </div>
        <Button
          onClick={() => void handleSubmit()}
          disabled={loading || !url.trim()}
          className="h-14 px-8 text-base"
        >
          {loading ? <Spinner data-icon="inline-start" /> : <LinkIcon data-icon="inline-start" className="size-5" />}
          {loading ? "Loading…" : "Load tweet"}
        </Button>
      </div>
    </div>
  )
}

export interface CachedTweet {
  tweet: TweetMedia
  url: string
}

export function cacheTweet(tweet: TweetMedia, url: string) {
  try {
    sessionStorage.setItem(
      `tweet2vid:${tweet.id}`,
      JSON.stringify({ tweet, url } satisfies CachedTweet)
    )
  } catch {
    // Storage can be unavailable in private mode; navigation still works.
  }
}

export function getCachedTweet(tweetId: string): CachedTweet | null {
  try {
    const raw = sessionStorage.getItem(`tweet2vid:${tweetId}`)
    if (!raw) return null
    return JSON.parse(raw) as CachedTweet
  } catch {
    return null
  }
}
