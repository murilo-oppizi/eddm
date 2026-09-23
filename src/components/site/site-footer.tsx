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
          <h4 className="text-sm font-semibold">Product</h4>
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
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="#" className="hover:text-foreground">About</Link></li>
            <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
            <li><Link href="/styleguide" className="hover:text-foreground">Styleguide</Link></li>
          </ul>
        </div>
      </div>
      <Separator />
      <div className="container-page flex flex-col justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
        <p>EDDM® and Every Door Direct Mail® are trademarks of the United States Postal Service.</p>
      </div>
    </footer>
  );
}
