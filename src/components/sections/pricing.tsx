import Link from "next/link";
import { CheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { plans, site } from "@/content/site";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-y bg-muted/40 py-20">
      <div className="container-page space-y-12">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing, printing and postage included"
          body="Pay per postcard. No setup fees, no contracts."
        />
        <div className="grid items-start gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(plan.highlighted && "ring-2 ring-brand lg:-mt-4 lg:pb-8")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.highlighted && <Badge>Most popular</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="font-heading text-4xl font-bold">{plan.price}</span>{" "}
                  <span className="text-sm text-muted-foreground">{plan.unit}</span>
                </div>
                <ul className="space-y-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckIcon className="size-4 text-brand" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  size="lg"
                  className="h-10 w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  nativeButton={false}
                  render={<Link href={site.primaryCta.href} />}
                >
                  {plan.price === "Custom" ? "Talk to sales" : "Get started"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
