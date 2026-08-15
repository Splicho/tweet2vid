import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js", "ffmpeg-static", "satori"],
}

export default nextConfig
