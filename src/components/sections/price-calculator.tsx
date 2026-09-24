"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconHomeFilled } from "@tabler/icons-react";
import { animate, useInView, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { pricing } from "@/content/site";
import { cn } from "@/lib/utils";

// The estimate leads, in big rolling digits; the postcard sizes sit beside it. Below,
// the slider is a street: one house per 1,000 homes stands along the track, lined up
// with the handle, and lights up as you drag. Stops under it show the price at each
// milestone (click one to jump there). The first time it's on screen the handle sweeps
// up to 15,000 once, lighting the street as it goes.

type Size = (typeof pricing.sizes)[number];
const { min, max, step, initial } = pricing.homes;
const HOMES_PER_HOUSE = 1000;
const HOUSES = max / HOMES_PER_HOUSE;
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
const fmt = (n: number) => n.toLocaleString("en-US");

/** Where a value sits along the track, matching the handle (it stays inside the track,
 *  so positions run from one thumb-radius in to one thumb-radius from the end). */
const THUMB_RADIUS = 10; // px, the Slider's size-5 thumb
const along = (value: number) =>
  `calc(${THUMB_RADIUS}px + ${(value - min) / (max - min)} * (100% - ${2 * THUMB_RADIUS}px))`;

export function PriceCalculator() {
  const [sizeName, setSizeName] = useState<string>(pricing.initialSize);
  const [homes, setHomes] = useState<number>(initial);
  const size = pricing.sizes.find((s) => s.name === sizeName) ?? pricing.sizes[1];
  const total = totalFor(size, homes);
  const perPiece = `$${(total / homes).toFixed(2)}`; // e.g. $0.47
  const reduce = useReducedMotion();

  // One sweep from the minimum up to the starting count, the first time it's seen.
  const root = useRef<HTMLDivElement>(null);
  const seen = useInView(root, { once: true, amount: 0.5 });
  const sweep = useRef<ReturnType<typeof animate> | null>(null);
  useEffect(() => {
    if (!seen || reduce) return;
    sweep.current = animate(min, initial, {
      duration: 1.4,
      ease,
      onUpdate: (v) => setHomes(Math.round(v / step) * step),
    });
    return () => sweep.current?.stop();
  }, [seen, reduce]);
  const stopSweep = () => sweep.current?.stop();
  const pick = (value: number) => {
    stopSweep();
    setHomes(value);
  };

  return (
    <div ref={root} className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8 lg:p-10">
      {/* The estimate, and the postcard sizes beside it */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Your estimate</p>
          <p className="mt-3 font-heading text-5xl font-bold tracking-tight sm:text-6xl" aria-hidden>
            <RollingNumber value={usd(total)} />
          </p>
          <p className="sr-only" aria-live="polite">
            {usd(total)} for {fmt(homes)} homes with a {size.name} postcard, {perPiece} per piece.
          </p>
          <p className="mt-3 text-muted-foreground" aria-hidden>
            <span className="font-medium text-foreground">{fmt(homes)} homes</span> ·{" "}
            <span className="font-medium text-foreground">{perPiece}</span> per piece, all-in
          </p>
        </div>

        <fieldset className="shrink-0">
          <legend className="text-sm font-medium">
            Postcard size <span className="font-normal text-muted-foreground">(inches)</span>
          </legend>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
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
                <span className="flex h-full flex-col items-center gap-2 rounded-xl border bg-card px-2 pt-3 pb-2.5 text-center transition-colors peer-checked:border-primary peer-checked:bg-brand-subtle/40 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:bg-muted/50 sm:w-20">
                  <SizeGlyph size={s} active={s.name === sizeName} />
                  <span>
                    <span className="block text-xs font-medium">{s.name}</span>
                    <span className="block text-[11px] whitespace-nowrap text-muted-foreground">{s.dims}</span>
                  </span>
                </span>
                {"bestSeller" in s && s.bestSeller && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none font-semibold whitespace-nowrap text-primary-foreground">
                    Best seller
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* The street: houses along the track, then the slider, then its stops */}
      <div className="mt-12">
        <div aria-hidden className="relative h-6">
          {Array.from({ length: HOUSES }, (_, i) => {
            const value = min + i * HOMES_PER_HOUSE;
            const on = value <= homes;
            return (
              <IconHomeFilled
                key={i}
                className={cn(
                  "absolute bottom-0 size-2.5 -translate-x-1/2 transition-[color,scale] duration-300 sm:size-4 lg:size-5",
                  on ? "scale-100 text-primary" : "scale-90 text-muted-foreground/20"
                )}
                style={{ left: along(value) }}
              />
            );
          })}
        </div>

        <Slider
          className="mt-2"
          getAriaLabel={() => "Homes to reach"}
          value={homes}
          min={min}
          max={max}
          step={step}
          largeStep={5000}
          onValueChange={pick}
          getAriaValueText={(_, v: number) => `${fmt(v)} homes`}
        />

        {/* Stops: the price at each milestone for the chosen size; click to jump there */}
        <div className="relative mt-3 h-10">
          {pricing.anchors.map((value, k) => {
            const first = k === 0;
            const last = k === pricing.anchors.length - 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => pick(value)}
                className={cn(
                  "absolute top-0 flex-col rounded-md px-1 text-xs leading-tight tabular-nums transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                  first ? "-ml-1 text-left" : last ? "-mr-1 -translate-x-full text-right" : "-translate-x-1/2 text-center",
                  // On phones only the ends and the starting count fit.
                  first || last || value === initial ? "flex" : "hidden sm:flex",
                  value === homes ? "text-foreground" : "text-muted-foreground"
                )}
                style={{ left: first ? 0 : last ? "100%" : along(value) }}
              >
                <span>{fmt(value)}</span>
                <span className="font-medium">{usd(totalFor(size, value))}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Next step */}
      <div className="mt-10 flex flex-col gap-6 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">
            {pricing.more}{" "}
            <Link href="/contact" className="font-medium text-foreground underline-offset-4 hover:underline">
              Talk to us
            </Link>
          </p>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{pricing.note}</p>
        </div>
        <Button size="xl" className="shrink-0" nativeButton={false} render={<Link href="/contact" />}>
          {pricing.cta} <IconArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}

/**
 * A number whose digits roll like an odometer when it changes. Digits are keyed from
 * the right, so adding a thousands digit doesn't make the others jump.
 */
function RollingNumber({ value }: { value: string }) {
  const chars = [...value];
  return (
    <span className="inline-flex tabular-nums">
      {chars.map((c, i) => {
        const fromRight = chars.length - i;
        if (!/\d/.test(c)) return <span key={`s${fromRight}`}>{c}</span>;
        const d = Number(c);
        return (
          <span key={`d${fromRight}`} className="relative inline-block h-[1em] overflow-hidden leading-none">
            <span
              className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ transform: `translateY(${-d * 10}%)` }}
            >
              {"0123456789".split("").map((n) => (
                <span key={n} className="h-[1em] leading-none">
                  {n}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** The postcard's shape at its real proportions, all drawn on the same scale. */
function SizeGlyph({ size, active }: { size: Size; active: boolean }) {
  const largest = 15; // inches, the Oversized card's width
  return (
    <span aria-hidden className="flex h-7 items-end">
      <span
        className={cn(
          "block rounded-[3px] border-[1.5px] transition-colors",
          active ? "border-primary bg-primary/15" : "border-muted-foreground/40 bg-muted"
        )}
        style={{ width: `${(size.w / largest) * 34}px`, height: `${(size.h / largest) * 34}px` }}
      />
    </span>
  );
}
