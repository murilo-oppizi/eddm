import {
  ChartColumnIcon,
  MapIcon,
  PrinterIcon,
  SparklesIcon,
  TruckIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { SectionHeading } from "@/components/sections/section-heading";
import { features } from "@/content/site";

const icons: Record<(typeof features)[number]["icon"], LucideIcon> = {
  map: MapIcon,
  users: UsersIcon,
  printer: PrinterIcon,
  truck: TruckIcon,
  chart: ChartColumnIcon,
  sparkles: SparklesIcon,
};

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-20">
      <div className="container-page space-y-12">
        <SectionHeading
          eyebrow="Why EDDM"
          title="Local marketing without the mailing list"
          body="Everything you need to reach a neighborhood, in one place."
        />
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = icons[feature.icon];
            return (
              <div key={feature.title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-muted-foreground">{feature.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
