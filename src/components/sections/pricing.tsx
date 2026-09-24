import Link from "next/link";
import { IconCheck } from "@tabler/icons-react";

import { PriceMeter } from "@/components/sections/price-meter";
import { SectionHeading } from "@/components/sections/section-heading";
import { pricing } from "@/content/site";

// Text on the left, the price meter on the right (stacked on phones).
export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 overflow-hidden border-y bg-muted/40 py-20 lg:py-28">
      <div className="container-page grid items-center gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div className="space-y-8">
          <SectionHeading
            eyebrow={pricing.eyebrow}
            title={pricing.title}
            body={pricing.body}
            className="mx-0 max-w-md text-left"
          />

          <ul className="space-y-3 text-sm">
            {pricing.included.map((item) => (
              <li key={item} className="flex gap-2.5">
                <IconCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {item}
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t pt-6 text-sm text-muted-foreground">
            <p>{pricing.noFees}</p>
            <p>
              {pricing.more}{" "}
              <Link href="/contact" className="font-medium text-foreground underline-offset-4 hover:underline">
                Talk to us
              </Link>
            </p>
            <p className="max-w-md text-xs leading-relaxed">{pricing.note}</p>
          </div>
        </div>

        <PriceMeter />
      </div>
    </section>
  );
}
