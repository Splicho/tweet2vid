import type { NextRequest } from "next/server"

export interface TweetMedia {
  id: string
  text: string
  videoUrl: string
  width: number | null
  height: number | null
  durationMs: number | null
}

interface XApiMedia {
  type: string
  media_key: string
  url?: string
  width?: number
  height?: number
  duration_ms?: number
  variants?: Array<{
    content_type: string
    bit_rate?: number
    url: string
  }>
}

interface FxTwitterResponse {
  code: number
  message: string
  tweet?: {
    id: string
    text: string
    media?: {
      videos?: Array<{
        url: string
        width?: number
        height?: number
        duration?: number
      }>
    }
  }
}

export async function POST(request: NextRequest) {
  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { username, id } = extractParts(body.url ?? "")
  if (!id) {
    return Response.json(
      { error: "Could not find a tweet ID in that URL." },
      { status: 400 }
    )
  }

  if (process.env.X_BEARER_TOKEN) {
    const xResult = await tryXApi(id)
    if (xResult.ok) {
      return Response.json(xResult.data)
    }
  }

  if (!username) {
    return Response.json(
      { error: "Paste the full tweet URL (with the @username in it)." },
      { status: 400 }
    )
  }

  const fxResult = await tryFxTwitter(username, id)
  if (fxResult.ok) {
    return Response.json(fxResult.data)
  }

  return Response.json(
    { error: fxResult.error },
    { status: fxResult.status }
  )
}

function extractParts(input: string): { username: string | null; id: string | null } {
  const match = input.match(
    /(?:x|twitter)\.com\/([^/?]+)\/status\/(\d+)/i
  )
  if (match) {
    return { username: match[1], id: match[2] }
  }
  if (/^\d{15,20}$/.test(input.trim())) {
    return { username: null, id: input.trim() }
  }
  return { username: null, id: null }
}

async function tryXApi(id: string): Promise<
  { ok: true; data: TweetMedia } | { ok: false }
> {
  const apiUrl =
    "https://api.x.com/2/tweets/" +
    id +
    "?tweet.fields=text&expansions=attachments.media_keys&media.fields=type,url,variants,width,height,duration_ms"

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.X_BEARER_TOKEN}`,
        "User-Agent": "tweet2vid/1.0",
      },
      cache: "no-store",
    })

    if (!response.ok) return { ok: false }

    const json = (await response.json()) as {
      data?: {
        id: string
        text: string
        attachments?: { media_keys?: string[] }
      }
      includes?: { media?: XApiMedia[] }
    }

    if (!json.data) return { ok: false }

    const mediaKeys = json.data.attachments?.media_keys ?? []
    const media = (json.includes?.media ?? []).filter((m) =>
      mediaKeys.includes(m.media_key)
    )

    const video = media.find(
      (m) => m.type === "video" || m.type === "animated_gif"
    )
    if (!video) return { ok: false }

    const mp4Variants = (video.variants ?? [])
      .filter((v) => v.content_type === "video/mp4")
      .sort((a, b) => (b.bit_rate ?? 0) - (a.bit_rate ?? 0))

    if (mp4Variants.length === 0) return { ok: false }

    return {
      ok: true,
      data: {
        id: json.data.id,
        text: json.data.text,
        videoUrl: mp4Variants[0].url,
        width: video.width ?? null,
        height: video.height ?? null,
        durationMs: video.duration_ms ?? null,
      },
    }
  } catch {
    return { ok: false }
  }
}

async function tryFxTwitter(
  username: string,
  id: string
): Promise<
  { ok: true; data: TweetMedia } | { ok: false; error: string; status: number }
> {
  const apiUrl = `https://api.fxtwitter.com/${username}/status/${id}`

  let json: FxTwitterResponse
  try {
    const response = await fetch(apiUrl, {
      headers: { "User-Agent": "tweet2vid/1.0" },
      cache: "no-store",
    })
    json = (await response.json()) as FxTwitterResponse
  } catch {
    return {
      ok: false,
      error: "Could not reach the tweet API. Check your network connection.",
      status: 502,
    }
  }

  if (!json.tweet) {
    const notFound = json.code === 404
    return {
      ok: false,
      error: notFound
        ? "Tweet not found. It may have been deleted or is private."
        : json.message || "Could not fetch the tweet.",
      status: notFound ? 404 : 502,
    }
  }

  const video = json.tweet.media?.videos?.[0]
  if (!video) {
    return {
      ok: false,
      error: "This tweet has no video or GIF attached.",
      status: 400,
    }
  }

  return {
    ok: true,
    data: {
      id: json.tweet.id,
      text: json.tweet.text,
      videoUrl: video.url,
      width: video.width ?? null,
      height: video.height ?? null,
      durationMs: video.duration ? Math.round(video.duration * 1000) : null,
    },
  }
}
