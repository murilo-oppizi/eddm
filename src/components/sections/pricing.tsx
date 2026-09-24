import { IconCheck } from "@tabler/icons-react";

import { PriceCalculator } from "@/components/sections/price-calculator";
import { SectionHeading } from "@/components/sections/section-heading";
import { pricing } from "@/content/site";

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-y bg-muted/40 py-20">
      <div className="container-page space-y-12">
        <SectionHeading eyebrow={pricing.eyebrow} title={pricing.title} body={pricing.body} />

        <div className="mx-auto max-w-5xl space-y-10">
          <PriceCalculator />

          {/* What every price includes: an even grid, so the items line up */}
          <div className="space-y-6">
            <ul className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
              {pricing.included.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <IconCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-center text-sm text-muted-foreground">{pricing.noFees}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
