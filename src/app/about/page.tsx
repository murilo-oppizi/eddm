import type { Metadata } from "next";
import { IconChartBar, IconMailOpened, IconShieldCheck, IconSparkles, type TablerIcon } from "@tabler/icons-react";

import { Cta } from "@/components/sections/cta";
import { SectionHeading } from "@/components/sections/section-heading";
import { TrustRow } from "@/components/sections/trust-row";
import { about } from "@/content/site";

export const metadata: Metadata = { title: "About", description: about.description };

const icons: Record<(typeof about.values)[number]["icon"], TablerIcon> = {
  sparkles: IconSparkles,
  mail: IconMailOpened,
  chart: IconChartBar,
  shield: IconShieldCheck,
};

export default function AboutPage() {
  return (
    <>
      <section className="py-20">
        <div className="container-page">
          <SectionHeading level={1} eyebrow={about.eyebrow} title={about.title} body={about.body} />
        </div>
      </section>

      {/* The story, with the key facts beside it */}
      <section className="pb-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-16">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold sm:text-3xl">{about.story.title}</h2>
            {about.story.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-lg text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border shadow-sm">
            {about.facts.map((fact) => (
              <div key={fact.label} className="flex flex-col-reverse gap-1 bg-card p-6">
                <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                <dd className="font-heading text-2xl font-bold tracking-tight">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <TrustRow />

      <section className="border-y bg-muted/40 py-20">
        <div className="container-page space-y-12">
          <SectionHeading title={about.valuesTitle} body={about.valuesBody} />
          <ul className="grid gap-6 sm:grid-cols-2">
            {about.values.map((value) => {
              const Icon = icons[value.icon];
              return (
                <li key={value.title} className="flex gap-4 rounded-2xl border bg-card p-6">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{value.title}</h3>
                    <p className="mt-1 text-muted-foreground">{value.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Same closer as the homepage: check an area, or start a campaign */}
      <div className="pt-20">
        <Cta />
      </div>
    </>
  );
}
