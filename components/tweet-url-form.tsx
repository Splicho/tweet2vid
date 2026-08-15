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
    <div className="flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Turn a tweet into a video
        </h1>
        <p className="text-sm text-muted-foreground">
          Paste a link to a video tweet. We&apos;ll put the text on a 1080×1080
          canvas and you can style it any way you like.
        </p>
      </div>
      <div className="flex items-end gap-2">
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
          />
        </div>
        <Button
          onClick={() => void handleSubmit()}
          disabled={loading || !url.trim()}
        >
          {loading ? <Spinner data-icon="inline-start" /> : <LinkIcon data-icon="inline-start" />}
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
