import Link from "next/link";
import { IconArrowRight, IconCircleCheck } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeroComposition } from "@/components/sections/hero-composition";
import { hero, site } from "@/content/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container-page grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Badge variant="secondary">{hero.eyebrow}</Badge>
          <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">{hero.title}</h1>
          <p className="max-w-xl text-lg text-muted-foreground">{hero.body}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {hero.checks.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm font-medium">
                <IconCircleCheck className="size-4 text-brand" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button size="xl" nativeButton={false} render={<Link href={site.primaryCta.href} />}>
              {site.primaryCta.label}
              <IconArrowRight data-icon="inline-end" />
            </Button>
            <Button size="xl" variant="outline" nativeButton={false} render={<Link href={site.secondaryCta.href} />}>
              {site.secondaryCta.label}
            </Button>
          </div>
        </div>

        <HeroComposition />
      </div>
    </section>
  );
}
