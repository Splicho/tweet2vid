import type { Metadata } from "next"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { TweetUrlForm } from "@/components/tweet-url-form"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "tweet2vid — Turn tweets into videos",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "tweet2vid — Turn tweets into videos",
    description: SITE_DESCRIPTION,
  },
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: SITE_NAME,
            url: SITE_URL,
            description: SITE_DESCRIPTION,
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            featureList: [
              "Paste any X (Twitter) video tweet URL",
              "Customize text, fonts, colors, and background",
              "Export as MP4 or WebM",
              "No sign-up required",
            ],
          }),
        }}
      />
      <div className="flex min-h-svh flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center p-6">
          <TweetUrlForm />
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
