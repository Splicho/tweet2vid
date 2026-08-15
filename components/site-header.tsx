import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="tweet2vid" className="size-6 rounded-none" />
          <span className="text-sm font-semibold tracking-tight">
            tweet2vid
          </span>
        </Link>
      </div>
    </header>
  )
}
