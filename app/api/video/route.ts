import type { NextRequest } from "next/server"

const VIDEO_HOSTS = ["video.twimg.com", "pbs.twimg.com", "fxtwitter.com"]

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) {
    return Response.json({ error: "Missing url parameter." }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return Response.json({ error: "Invalid url parameter." }, { status: 400 })
  }

  if (!VIDEO_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))) {
    return Response.json(
      { error: "Only X media hosts are allowed." },
      { status: 400 }
    )
  }

  const range = request.headers.get("range")

  let upstream: Response
  try {
    upstream = await fetch(parsed, {
      headers: {
        ...(range ? { Range: range } : {}),
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      },
      cache: "no-store",
    })
  } catch {
    return Response.json(
      { error: "Could not fetch the video from X." },
      { status: 502 }
    )
  }

  if (!upstream.ok && upstream.status !== 206) {
    return Response.json(
      { error: `Video fetch failed (${upstream.status}).` },
      { status: 502 }
    )
  }

  if (!upstream.body) {
    return Response.json({ error: "Empty video response." }, { status: 502 })
  }

  const headers = new Headers()
  const contentType = upstream.headers.get("content-type")
  if (contentType) headers.set("content-type", contentType)
  const contentRange = upstream.headers.get("content-range")
  if (contentRange) headers.set("content-range", contentRange)
  const contentLength = upstream.headers.get("content-length")
  if (contentLength) headers.set("content-length", contentLength)
  headers.set("accept-ranges", "bytes")
  headers.set("cache-control", "no-store")

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  })
}
