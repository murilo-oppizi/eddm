"use client";

import { useSyncExternalStore } from "react";
import { IconArrowRight } from "@tabler/icons-react";

import { PrintedStamp } from "@/components/sections/printed-stamp";
import { Button } from "@/components/ui/button";
import { cta } from "@/content/site";
import {
  getStamp,
  STAMP_SPOT_ID,
  STAMP_TILT,
  subscribeStamp,
} from "@/lib/quote-stamp";

// The closing card: the title, one line on what happens, and one button straight into
// making a campaign. The card is also where the price meter's printed stamp lands: on its top-right corner,
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
            {/* Text across most of the card (the line in two lines on desktop), the button
                right under it; the top-right stays clear for the stamp */}
            <div className="relative flex max-w-3xl flex-col items-start gap-8">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold sm:text-4xl">{cta.title}</h2>
                <p className="text-lg text-pretty opacity-80">{cta.body}</p>
              </div>
              <div className="w-full sm:w-auto">
                <Button
                  size="xl"
                  render={<a href={cta.button.href} />}
                  nativeButton={false}
                  className="group w-full bg-background text-foreground hover:bg-background/90 sm:w-auto"
                >
                  {cta.button.label}
                  <IconArrowRight className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                </Button>
              </div>
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
