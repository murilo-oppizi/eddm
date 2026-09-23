import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Logo, type LogoVariant } from "@/components/site/logo";

export const metadata: Metadata = { title: "Logo options" };

// Temporary comparison page for picking the header lockup. Delete once one is chosen.
const options: { variant: LogoVariant; name: string; note: string }[] = [
  { variant: "tile", name: "A · Tile", note: "The symbol on a pink tile, EDDM stacked over “powered by Oppizi”. Closest to today’s header." },
  { variant: "inline", name: "B · Inline", note: "The bare pink symbol with EDDM and the endorsement on one line, split by a hairline. Lightest and widest." },
  { variant: "endorsed", name: "C · Endorsed", note: "EDDM leads as a wordmark; the Oppizi symbol lives in the “powered by” line, as the endorser." },
];

function HeaderMock({ variant }: { variant: LogoVariant }) {
  return (
    <div className="flex h-16 items-center justify-between gap-6 border-b bg-background px-6 text-foreground">
      <Logo variant={variant} />
      <div className="hidden items-center gap-2 sm:flex">
        <Button variant="outline" size="lg">Log in</Button>
        <Button size="lg">Start a campaign</Button>
      </div>
    </div>
  );
}

export default function LogosPage() {
  return (
    <div className="container-page space-y-12 py-16">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Logo options</h1>
        <p className="text-muted-foreground">Three lockups for the header, each shown in the header in light and dark mode.</p>
      </header>
      {options.map(({ variant, name, note }) => (
        <section key={variant} className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{name}</h2>
            <p className="text-sm text-muted-foreground">{note}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border">
              <HeaderMock variant={variant} />
            </div>
            <div data-theme="dark" className="overflow-hidden rounded-xl border">
              <HeaderMock variant={variant} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
