import Link from "next/link";
import { IconCheck } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/sections/section-heading";
import { pricing, site } from "@/content/site";

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-y bg-muted/40 py-20">
      <div className="container-page space-y-12">
        <SectionHeading
          eyebrow="Pricing"
          title="One all-in price per piece"
          body="Printing, postage and delivery included. Pay only for the homes you reach."
        />

        {/* Price + what's included, side by side from md up */}
        <div className="grid gap-8 rounded-2xl border bg-card p-6 sm:p-8 md:grid-cols-[1fr_1.2fr] md:gap-12">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Starting from</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="font-heading text-5xl font-bold tracking-tight tabular-nums">
                  {pricing.perPiece}
                </span>
                <span className="text-muted-foreground">per piece, all-in</span>
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Reach {pricing.example.homes} homes for about{" "}
                <span className="font-medium text-foreground">{pricing.example.total}</span>.
              </p>
            </div>
            <div className="mt-auto space-y-3">
              <p className="text-sm text-muted-foreground">{pricing.noFees}</p>
              <Button size="xl" className="w-full sm:w-auto" nativeButton={false} render={<Link href={site.primaryCta.href} />}>
                Get your exact price
              </Button>
            </div>
          </div>

          <div className="border-t pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-12">
            <p className="text-sm font-medium">Everything included</p>
            <ul className="mt-4 space-y-3 text-sm">
              {pricing.included.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <IconCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
