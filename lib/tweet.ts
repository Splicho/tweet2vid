export interface TweetMedia {
  id: string
  text: string
  videoUrl: string
  width: number | null
  height: number | null
  durationMs: number | null
}

export async function fetchTweet(url: string): Promise<TweetMedia> {
  const response = await fetch("/api/tweet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  })

  const json = (await response.json()) as TweetMedia & { error?: string }

  if (!response.ok) {
    throw new Error(json.error ?? "Failed to fetch the tweet.")
  }

  return json
}
