"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EditToolbar } from "@/components/edit-toolbar"
import { EditorSettingsProvider } from "@/components/editor-settings"
import { TweetToVideo } from "@/components/tweet-to-video"
import { getCachedTweet } from "@/components/tweet-url-form"

function useIsMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export default function EditPage() {
  const params = useParams<{ tweetId: string }>()
  const mounted = useIsMounted()

  const cached = React.useMemo(() => {
    if (!mounted || !params?.tweetId) return null
    return getCachedTweet(params.tweetId)
  }, [mounted, params])

  return (
    <div className="relative min-h-screen w-full bg-black">
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "#000000",
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px, 20px 20px, 20px 20px",
          backgroundPosition: "0 0, 0 0, 0 0",
        }}
      />

      {!mounted ? null : !cached ? (
        <main className="dark relative z-10 flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-sm text-white/60">
            We couldn&apos;t find this tweet in your browser. Load it from the
            home page first.
          </p>
          <Button asChild>
            <Link href="/">
              <ArrowLeftIcon data-icon="inline-start" />
              Back to home
            </Link>
          </Button>
        </main>
      ) : (
        <EditorSettingsProvider>
          <main className="dark relative z-10 flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-[min(84vh,900px)]">
              <TweetToVideo initialTweet={cached.tweet} />
            </div>
            <EditToolbar />
          </main>
        </EditorSettingsProvider>
      )}
    </div>
  )
}
