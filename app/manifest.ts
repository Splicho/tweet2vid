import type { MetadataRoute } from "next"

import { SITE_NAME } from "@/lib/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "tweet2vid",
    description:
      "Turn any X (Twitter) video tweet into a styled, downloadable video.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  }
}
