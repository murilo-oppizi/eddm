"use client";

import { useSyncExternalStore } from "react";

import { PrintedStamp } from "@/components/sections/printed-stamp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getStamp,
  STAMP_SPOT_ID,
  STAMP_TILT,
  subscribeStamp,
} from "@/lib/quote-stamp";

// Front-end only: the form doesn't submit anywhere yet — backend devs will wire it up
// in onSubmit. Until then it only validates, instead of reloading the page.
// The card is also where the price meter's printed stamp lands: on its top-right corner,
// like a stamp on an envelope.
export function Cta() {
  const stamp = useSyncExternalStore(subscribeStamp, getStamp, () => null);
  return (
    <section id="get-started" className="scroll-mt-20 pb-20">
      <div className="container-page">
        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-14 text-brand-foreground sm:px-12">
            {/* A soft light in the top-right corner: the same glow as a 256px circle at 20%
                blurred by 40px, drawn as a gradient instead. iPhone Safari clips blurred
                elements inside rounded, clipped boxes at hard edges, leaving bands of light. */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at calc(100% - 64px) 64px, ${[
                  [20, 0],
                  [19.5, 48],
                  [16.8, 88],
                  [10, 128],
                  [3.2, 168],
                  [0.5, 208],
                  [0, 240],
                ]
                  .map(([a, d]) => `color-mix(in oklab, var(--background) ${a}%, transparent) ${d}px`)
                  .join(", ")})`,
              }}
              aria-hidden
            />
            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Ready to reach every door?
                </h2>
                <p className="text-lg opacity-80">
                  Enter a ZIP code to see how many homes you can reach and what
                  it would cost.
                </p>
              </div>
              <form
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="flex-1 space-y-2">
                  <Label htmlFor="zip" className="text-brand-foreground">
                    ZIP code
                  </Label>
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
          {/* The stamp's spot, half over the card's top edge (smaller on phones). Always
            there, empty, so the meter knows where to fly the stamp. */}
          <div
            id={STAMP_SPOT_ID}
            aria-hidden
            className="pointer-events-none absolute -top-11 right-4 z-10 h-[120px] w-[168px] origin-top-right scale-80 sm:-top-13 sm:right-12 sm:scale-100"
          >
            {stamp && (
              <div
                className="drop-shadow-[0_4px_6px_rgb(0_0_0/0.2)]"
                style={{ rotate: `${STAMP_TILT}deg` }}
              >
                <PrintedStamp {...stamp} />
              </div>
            )}
          </div>
          <p role="status" className="sr-only">
            {stamp &&
              `Your estimate: ${stamp.total} for ${stamp.homes} homes with a ${stamp.size} postcard.`}
          </p>
        </div>
      </div>
    </section>
  );
}
