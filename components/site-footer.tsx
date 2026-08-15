import { SITE_NAME } from "@/lib/site"

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-label="X"
      role="img"
      fill="currentColor"
      className={className}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

export function SiteFooter() {
  return (
    <footer>
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Not affiliated with
          <XLogo className="size-3.5" />
        </p>
      </div>
    </footer>
  )
}
