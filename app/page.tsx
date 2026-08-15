import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { TweetUrlForm } from "@/components/tweet-url-form"

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center p-6">
        <TweetUrlForm />
      </main>
      <SiteFooter />
    </div>
  )
}
