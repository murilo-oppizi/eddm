import { IconCheck } from "@tabler/icons-react";

import { PriceCalculator } from "@/components/sections/price-calculator";
import { SectionHeading } from "@/components/sections/section-heading";
import { pricing } from "@/content/site";

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-y bg-muted/40 py-20">
      <div className="container-page space-y-12">
        <SectionHeading eyebrow={pricing.eyebrow} title={pricing.title} body={pricing.body} />

        <div className="mx-auto max-w-5xl space-y-8">
          <PriceCalculator />

          {/* What every price includes */}
          <div className="space-y-3 text-center">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {pricing.included.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <IconCheck className="size-4 shrink-0 text-brand" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">{pricing.noFees}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
