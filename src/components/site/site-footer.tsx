import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/site/logo";
import { site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">{site.description}</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-normal">Product</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-normal">Company</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            {/* The parent brand (the styleguide is an internal page, so it isn't linked here) */}
            <li><a href="https://oppizi.com/us/en/" className="hover:text-foreground">Explore Oppizi</a></li>
          </ul>
        </div>
      </div>
      <Separator />
      <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted-foreground">
        {/* The US legal entity, per oppizi.com's imprint. Who owns the site, how the mail is
            delivered, and whose trademark EDDM is. */}
        <p>© {new Date().getFullYear()} Oppizi US Inc. All rights reserved.</p>
        <p className="max-w-3xl text-pretty">
          eddm.com is owned and operated by Oppizi US Inc. Every Door Direct Mail is one of the channels Oppizi
          offers, delivered through the United States Postal Service. EDDM® and Every Door Direct Mail® are
          registered trademarks of the United States Postal Service.
        </p>
      </div>
    </footer>
  );
}
