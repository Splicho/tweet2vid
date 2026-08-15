import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

export const alt = "tweet2vid — Turn tweets into videos"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "logo.svg")).then(
    (buffer) => `data:image/svg+xml;base64,${buffer.toString("base64")}`
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #17203a 60%, #24315c 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            width={96}
            height={96}
            style={{ borderRadius: 22 }}
            alt=""
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              color: "white",
            }}
          >
            <div
              style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2 }}
            >
              tweet2vid
            </div>
            <div style={{ fontSize: 32, color: "#aab6e0" }}>
              Turn tweets into videos
            </div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
