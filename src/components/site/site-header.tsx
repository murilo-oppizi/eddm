"use client";

import Link from "next/link";
import { IconMenu2 } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/site/logo";
import { site } from "@/content/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {site.nav.map((item) => (
            <Button key={item.href} variant="ghost" nativeButton={false} render={<Link href={item.href} />}>
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="outline" size="lg" nativeButton={false} render={<Link href="#" />}>
            Log in
          </Button>
          <Button size="lg" nativeButton={false} render={<Link href={site.primaryCta.href} />}>
            {site.primaryCta.label}
          </Button>
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" />}>
            <IconMenu2 />
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {site.nav.map((item) => (
                <SheetClose
                  key={item.href}
                  nativeButton={false}
                  render={<Link href={item.href} className="rounded-lg px-3 py-2 text-base hover:bg-muted" />}
                >
                  {item.label}
                </SheetClose>
              ))}
              <Button className="mt-4" size="lg" nativeButton={false} render={<Link href={site.primaryCta.href} />}>
                {site.primaryCta.label}
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
