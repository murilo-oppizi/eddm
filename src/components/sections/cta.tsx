"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Front-end only: the form doesn't submit anywhere yet — backend devs will wire it up
// in onSubmit. Until then it only validates, instead of reloading the page.
export function Cta() {
  return (
    <section id="get-started" className="scroll-mt-20 pb-20">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-14 text-brand-foreground sm:px-12">
          <div className="absolute -top-16 -right-16 size-64 rounded-full bg-background/20 blur-2xl" aria-hidden />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold sm:text-4xl">Ready to reach every door?</h2>
              <p className="text-lg opacity-80">
                Enter a ZIP code to see how many homes you can reach and what it would cost.
              </p>
            </div>
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="zip" className="text-brand-foreground">ZIP code</Label>
                <Input
                  id="zip"
                  name="zip"
                  required
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  pattern="[0-9]{5}"
                  title="A 5-digit US ZIP code"
                  placeholder="e.g. 90210"
                  className="h-11 border-transparent bg-background text-base text-foreground"
                />
              </div>
              <Button
                type="submit"
                size="xl"
                className="bg-background text-foreground hover:bg-background/90"
              >
                Check my area
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
