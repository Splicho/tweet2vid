export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} tweet2vid
        </p>
        <p className="text-xs text-muted-foreground">
          Not affiliated with X
        </p>
      </div>
    </footer>
  )
}
