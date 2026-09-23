import Link from "next/link";
import { CheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/sections/section-heading";
import { pricing, site } from "@/content/site";
import { cn } from "@/lib/utils";

// Largest size's long and short sides, in inches — every postcard is drawn relative to
// these, so the sizes are to scale with each other.
const MAX_LONG = Math.max(...pricing.sizes.map((s) => Math.max(s.w, s.h)));
const MAX_SHORT = Math.max(...pricing.sizes.map((s) => Math.min(s.w, s.h)));

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-y bg-muted/40 py-20">
      <div className="container-page space-y-12">
        <SectionHeading
          eyebrow="Pricing"
          title="One all-in price per piece"
          body="Printing, postage and delivery included. Pay only for the homes you reach."
        />

        <div className="space-y-6">
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
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sizes, full width so the to-scale drawings can be big enough to compare */}
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <h3 className="text-xl font-semibold">Pick your postcard size</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Five USPS EDDM sizes, shown to scale. Your exact price depends on size and quantity.
            </p>
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
              {pricing.sizes.map((size) => (
                <PostcardSize key={size.name} {...size} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function PostcardSize({
  name,
  w,
  h,
  bestSeller,
}: {
  name: string;
  w: number;
  h: number;
  bestSeller?: boolean;
}) {
  const long = Math.max(w, h);
  const short = Math.min(w, h);
  return (
    <li className="flex flex-col gap-3">
      {/* Every cell shares the largest size's proportions, so shapes line up at the
          bottom and stay to scale with each other. */}
      <div className="relative w-full" style={{ aspectRatio: `${MAX_LONG} / ${MAX_SHORT}` }}>
        <div
          aria-hidden
          className={cn(
            "absolute bottom-0 left-0 rounded-[3px] border-2 shadow-xs",
            bestSeller ? "border-primary bg-brand-subtle" : "border-border bg-background"
          )}
          style={{ width: `${(long / MAX_LONG) * 100}%`, height: `${(short / MAX_SHORT) * 100}%` }}
        >
          {bestSeller && (
            <Badge className="absolute bottom-[10%] left-[8%] h-5 px-1.5 text-[10px]">Best seller</Badge>
          )}
          {/* Stamp corner, so it reads as a postcard */}
          <span
            className={cn(
              "absolute top-[8%] right-[6%] aspect-square w-[14%] max-w-3 rounded-[2px]",
              bestSeller ? "bg-primary" : "bg-subtle"
            )}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {w}″ × {h}″
        </p>
      </div>
    </li>
  );
}
