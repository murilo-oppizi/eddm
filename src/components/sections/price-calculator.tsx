"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconHomeFilled } from "@tabler/icons-react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { pricing } from "@/content/site";
import { cn } from "@/lib/utils";

// Pick a postcard size and drag how many homes to reach; the estimate beside it updates
// as you go, and a grid of houses (one per 1,000 homes) fills in. The first time it's on
// screen, the slider sweeps up to the starting count once, to show that it moves.

type Size = (typeof pricing.sizes)[number];
const { min, max, step, initial } = pricing.homes;
const HOMES_PER_HOUSE = 1000;
const ease = [0.22, 1, 0.36, 1] as const;

/** Oppizi's calculator total at the anchor counts, straight lines in between. */
function totalFor(size: Size, homes: number) {
  const { anchors } = pricing;
  for (let k = 0; k < anchors.length - 1; k++) {
    if (homes <= anchors[k + 1]) {
      const f = (homes - anchors[k]) / (anchors[k + 1] - anchors[k]);
      return Math.round(size.totals[k] + f * (size.totals[k + 1] - size.totals[k]));
    }
  }
  return size.totals[size.totals.length - 1];
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function PriceCalculator() {
  const [sizeName, setSizeName] = useState<string>(pricing.initialSize);
  const [homes, setHomes] = useState<number>(initial);
  const size = pricing.sizes.find((s) => s.name === sizeName) ?? pricing.sizes[1];
  const total = totalFor(size, homes);
  const perPiece = `$${(total / homes).toFixed(2)}`; // e.g. $0.47

  // The total glides to each new value instead of jumping.
  const shown = useMotionValue(total);
  const shownText = useTransform(shown, usd);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return shown.set(total);
    const controls = animate(shown, total, { duration: 0.35, ease });
    return () => controls.stop();
  }, [total, reduce, shown]);

  // One sweep from the minimum up to the starting count, the first time it's seen.
  const root = useRef<HTMLDivElement>(null);
  const seen = useInView(root, { once: true, amount: 0.5 });
  const sweep = useRef<ReturnType<typeof animate> | null>(null);
  useEffect(() => {
    if (!seen || reduce) return;
    sweep.current = animate(min, initial, {
      duration: 1.2,
      ease,
      onUpdate: (v) => setHomes(Math.round(v / step) * step),
    });
    return () => sweep.current?.stop();
  }, [seen, reduce]);
  const stopSweep = () => sweep.current?.stop();

  const houses = max / HOMES_PER_HOUSE;
  const lit = Math.round(homes / HOMES_PER_HOUSE);

  return (
    <div
      ref={root}
      className="grid overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-[1.25fr_1fr]"
    >
      {/* Your campaign */}
      <div className="flex flex-col gap-10 p-6 sm:p-8 lg:p-10">
        <fieldset>
          <legend className="text-sm font-medium">
            Postcard size <span className="font-normal text-muted-foreground">(inches)</span>
          </legend>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {pricing.sizes.map((s) => (
              <label key={s.name} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="size"
                  value={s.name}
                  checked={s.name === sizeName}
                  onChange={() => {
                    stopSweep();
                    setSizeName(s.name);
                  }}
                  className="peer sr-only"
                />
                <span className="flex h-full flex-col gap-3 rounded-xl border bg-card px-3 pt-3.5 pb-3 transition-colors peer-checked:border-primary peer-checked:bg-brand-subtle/40 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:bg-muted/50">
                  <SizeGlyph size={s} active={s.name === sizeName} />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium">{s.name}</span>
                    <span className="block text-xs whitespace-nowrap text-muted-foreground">{s.dims}</span>
                  </span>
                </span>
                {"bestSeller" in s && s.bestSeller && (
                  <span className="absolute -top-2 right-2.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none font-semibold text-primary-foreground">
                    Best seller
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm font-medium">Homes to reach</p>
            <p className="font-heading text-2xl font-bold tracking-tight tabular-nums">
              {homes.toLocaleString("en-US")}
            </p>
          </div>
          <Slider
            className="mt-4"
            getAriaLabel={() => "Homes to reach"}
            value={homes}
            min={min}
            max={max}
            step={step}
            largeStep={5000}
            onValueChange={(v) => {
              stopSweep();
              setHomes(v);
            }}
            getAriaValueText={(_, v: number) => `${v.toLocaleString("en-US")} homes`}
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{min.toLocaleString("en-US")}</span>
            <span>{max.toLocaleString("en-US")}</span>
          </div>
        </div>

        <p className="mt-auto text-sm text-muted-foreground">
          {pricing.more}{" "}
          <Link href="/contact" className="font-medium text-foreground underline-offset-4 hover:underline">
            Talk to us
          </Link>
        </p>
      </div>

      {/* The estimate: a soft tint inside the card, not a dark block */}
      <div className="flex flex-col gap-8 border-t bg-muted/50 p-6 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
        <div>
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Your estimate</p>
          <motion.p className="mt-3 font-heading text-5xl font-bold tracking-tight tabular-nums" aria-hidden>
            {shownText}
          </motion.p>
          <p className="sr-only" aria-live="polite">
            {usd(total)} for {homes.toLocaleString("en-US")} homes, {perPiece} per piece.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{perPiece}</span> per piece · all-in
          </p>
        </div>

        {/* One house per 1,000 homes */}
        <div aria-hidden>
          <div className="grid w-fit grid-cols-10 gap-x-2 gap-y-1.5">
            {Array.from({ length: houses }, (_, i) => (
              <IconHomeFilled
                key={i}
                className={cn(
                  "size-4.5 transition-colors duration-300",
                  i < lit ? "text-primary" : "text-muted-foreground/20"
                )}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Each house is 1,000 homes</p>
        </div>

        <div className="mt-auto space-y-3">
          <Button size="xl" className="w-full" nativeButton={false} render={<Link href="/contact" />}>
            {pricing.cta} <IconArrowRight data-icon="inline-end" />
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">{pricing.note}</p>
        </div>
      </div>
    </div>
  );
}

/** The postcard's shape at its real proportions, all drawn on the same scale. */
function SizeGlyph({ size, active }: { size: Size; active: boolean }) {
  const largest = 15; // inches, the Oversized card's width
  return (
    <span aria-hidden className="flex h-8 items-end">
      <span
        className={cn(
          "block rounded-[3px] border-[1.5px] transition-colors",
          active ? "border-primary bg-primary/15" : "border-muted-foreground/40 bg-muted"
        )}
        style={{ width: `${(size.w / largest) * 40}px`, height: `${(size.h / largest) * 40}px` }}
      />
    </span>
  );
}
