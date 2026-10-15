import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { site } from "@/content/site";
import { isPreview } from "@/lib/asset";

// Inter for body text, buttons and labels (`font-sans`, as the Oppizi design system
// specifies); Geist for titles and headings (`font-heading`, see globals.css).
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-display",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // The live domain, so share images and links resolve to absolute URLs.
  metadataBase: new URL("https://eddm.com"),
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  // How links look when shared; the image is app/opengraph-image.tsx.
  openGraph: {
    title: site.title,
    type: "website",
    // EDDM is USPS's trademark, run by Oppizi: "powered by", never "EDDM by Oppizi"
    siteName: "EDDM® powered by Oppizi",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  // The GitHub Pages preview is public but not the real site: keep it out of search.
  ...(isPreview && { robots: { index: false, follow: false } }),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
