"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { IconArrowRight, IconMinus, IconPlus, IconVolume, IconVolumeOff } from "@tabler/icons-react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import { OppiziSymbol } from "@/components/site/logo";
import { Slider } from "@/components/ui/slider";
import { pricing } from "@/content/site";
import { playKey, prepareSounds, setSoundsOn, soundsOn } from "@/lib/key-sounds";
import { cn } from "@/lib/utils";

// The "EDDM price meter": a flat, product-like object (after the postage meters post
// offices use to price mail) instead of a form. A light screen shows the estimate in
// rolling digits and a level meter; a fader with − / + sets the homes; five keycaps
// pick the postcard size (the chosen one stays pressed, its shape and name pink); a big key asks
// for the quote. The first time it's on screen the fader glides up to 15,000 once.
// It tilts a little toward the pointer, and its keys clack
// (Cream switch samples; the speaker grille turns the sound off).

type Size = (typeof pricing.sizes)[number];
const { min, max, step, initial } = pricing.homes;
const HOMES_PER_SEGMENT = 1000;
const SEGMENTS = max / HOMES_PER_SEGMENT;
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
const clamp = (n: number) => Math.min(max, Math.max(min, n));

// A keycap: white (dark in dark mode), lit from above, with a hard shadow under it that shrinks when pressed.
const keycap =
  "bg-card text-card-foreground shadow-[0_3px_0_rgb(0_0_0/0.22),inset_0_1px_0_rgb(255_255_255/0.9)] transition-[translate,box-shadow] duration-100 active:translate-y-[2px] active:shadow-[0_1px_0_rgb(0_0_0/0.22)] outline-none focus-visible:ring-3 focus-visible:ring-white/70";
const pressed = "translate-y-[2px] shadow-[0_1px_0_rgb(0_0_0/0.22),inset_0_1px_0_rgb(255_255_255/0.9)]";
const lift = "hover:-translate-y-px hover:shadow-[0_4px_0_rgb(0_0_0/0.22),inset_0_1px_0_rgb(255_255_255/0.9)]";

// The sound switch, shared by every meter on the page and remembered in the browser.
const soundListeners = new Set<() => void>();
const subscribeSound = (cb: () => void) => {
  soundListeners.add(cb);
  return () => soundListeners.delete(cb);
};
const toggleSound = () => {
  setSoundsOn(!soundsOn());
  soundListeners.forEach((cb) => cb());
};

export function PriceMeter() {
  const [sizeName, setSizeName] = useState<string>(pricing.initialSize);
  const [homes, setHomes] = useState<number>(initial);
  const size = pricing.sizes.find((s) => s.name === sizeName) ?? pricing.sizes[1];
  const total = totalFor(size, homes);
  const perPiece = `$${(total / homes).toFixed(2)}`;
  const reduce = useReducedMotion();

  // One glide from the minimum up to the starting count, the first time it's seen.
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
  const set = (value: number) => {
    sweep.current?.stop();
    setHomes(clamp(value));
  };

  const sound = useSyncExternalStore(subscribeSound, soundsOn, () => true);

  // Tilt toward the pointer (anywhere on screen, gently); the floor glow shifts the other way.
  const tiltX = useSpring(0, { stiffness: 140, damping: 18, mass: 0.6 });
  const tiltY = useSpring(0, { stiffness: 140, damping: 18, mass: 0.6 });
  const glowX = useTransform(tiltY, (v) => v * -3);
  const onScreen = useInView(root, { amount: 0.2 });
  useEffect(() => {
    if (reduce || !onScreen || !window.matchMedia("(pointer: fine)").matches) return;
    const clampUnit = (n: number) => Math.max(-1, Math.min(1, n));
    const onMove = (e: PointerEvent) => {
      const r = root.current?.getBoundingClientRect();
      if (!r) return;
      const dx = clampUnit((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2));
      const dy = clampUnit((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2));
      tiltY.set(dx * 8);
      tiltX.set(dy * -6);
    };
    const onLeave = () => {
      tiltX.set(0);
      tiltY.set(0);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      onLeave();
    };
  }, [reduce, onScreen, tiltX, tiltY]);

  // Keys play when pressed (click-in only); keyboard use plays the press too.
  const viaPointer = useRef(false);
  const pressKey = (sound: "press" | "space" | "enter") => {
    viaPointer.current = true;
    playKey(sound, { gain: sound === "enter" ? 0.6 : 0.5 });
  };

  return (
    <div className="relative mx-auto w-full max-w-[540px]">
      {/* Soft pink glow on the "table" under the device */}
      <motion.div aria-hidden style={{ x: glowX }} className="absolute inset-x-10 -bottom-8 h-16 rounded-full bg-primary/30 blur-3xl" />

      <motion.div
        ref={root}
        style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1200 }}
        onPointerEnter={() => prepareSounds()}
        onFocus={() => prepareSounds()}
        className="relative rounded-[30px] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_78%,white),var(--primary)_55%)] p-6 shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_-5px_0_rgb(0_0_0/0.14),0_30px_60px_-24px_color-mix(in_oklab,var(--primary)_70%,black)]"
      >
        <Screw className="top-3.5 left-3.5" />
        <Screw className="top-3.5 right-3.5" />
        <Screw className="bottom-3.5 left-3.5" />
        <Screw className="right-3.5 bottom-3.5" />

        {/* Top plate: the maker's mark and a speaker grille */}
        <div className="flex items-center justify-between px-2 pt-1 pb-3 text-white">
          <span className="flex items-center gap-2 text-xs font-semibold tracking-wide">
            <OppiziSymbol cropped className="h-3 w-auto" />
            EDDM price meter
          </span>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label="Key sounds"
            title={sound ? "Key sounds on" : "Key sounds off"}
            className="flex cursor-pointer items-center gap-2 rounded-md p-1 text-white/80 outline-none hover:text-white focus-visible:ring-3 focus-visible:ring-white/70"
          >
            {sound ? <IconVolume className="size-3.5" /> : <IconVolumeOff className="size-3.5" />}
            <span aria-hidden className="grid grid-cols-8 gap-1">
              {Array.from({ length: 16 }, (_, i) => (
                <span key={i} className={cn("size-1 rounded-full transition-colors", sound ? "bg-black/20" : "bg-black/10")} />
              ))}
            </span>
          </button>
        </div>

        {/* The screen */}
        <div className="rounded-2xl bg-card p-5 shadow-[inset_0_2px_8px_rgb(0_0_0/0.14)] ring-1 ring-black/10">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Estimate</p>
              <p className="mt-1 font-heading text-4xl font-bold tracking-tight sm:text-5xl" aria-hidden>
                <RollingNumber value={usd(total)} />
              </p>
              <p className="sr-only" aria-live="polite">
                {usd(total)} for {fmt(homes)} homes with a {size.name} postcard, {perPiece} per piece.
              </p>
            </div>
            <div aria-hidden className="shrink-0 space-y-0.5 text-right text-sm tabular-nums">
              <p className="font-semibold">{perPiece} each</p>
              <p className="text-muted-foreground">{fmt(homes)} homes</p>
              <p className="text-muted-foreground">{size.name} postcard</p>
            </div>
          </div>
          {/* Level meter: one segment per 1,000 homes, the current one a little taller */}
          <div aria-hidden className="mt-5 flex h-4 items-end gap-0.5 sm:gap-[3px]">
            {Array.from({ length: SEGMENTS }, (_, i) => {
              const value = min + i * HOMES_PER_SEGMENT;
              const on = value <= homes;
              const head = on && value + HOMES_PER_SEGMENT > homes;
              return (
                <span
                  key={i}
                  className={cn(
                    "flex-1 rounded-[2px] transition-[background-color,height] duration-200",
                    on ? "bg-primary" : "bg-muted-foreground/15",
                    head ? "h-4" : "h-2.5"
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* Homes: − / fader / + */}
        <div className="mt-5 px-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="1,000 fewer homes"
              onPointerDown={() => pressKey("space")}
              onClick={(e) => {
                if (e.detail === 0) playKey("space");
                set(homes - step);
              }}
              className={cn(keycap, lift, "grid size-10 shrink-0 place-items-center rounded-xl")}
            >
              <IconMinus className="size-4" />
            </button>
            <Slider
              getAriaLabel={() => "Homes to reach"}
              value={homes}
              min={min}
              max={max}
              step={step}
              largeStep={5000}
              onValueChange={(v) => {
                set(v);
                playKey("tick", { gain: 0.22, pitch: 0.85 + (0.35 * (v - min)) / (max - min) });
              }}
              getAriaValueText={(_, v: number) => `${fmt(v)} homes`}
              className={cn(
                "[&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-track]]:bg-black/20 [&_[data-slot=slider-track]]:shadow-[inset_0_1px_2px_rgb(0_0_0/0.25)]",
                "[&_[data-slot=slider-range]]:bg-white/85",
                "[&_[data-slot=slider-thumb]]:h-7 [&_[data-slot=slider-thumb]]:w-10 [&_[data-slot=slider-thumb]]:rounded-lg [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:shadow-[0_3px_0_rgb(0_0_0/0.22)] [&_[data-slot=slider-thumb]]:ring-white/50",
                // Grip lines on the fader cap
                "[&_[data-slot=slider-thumb]]:[background:repeating-linear-gradient(90deg,rgb(0_0_0/0.18)_0_1.5px,transparent_1.5px_4px)_center/10px_12px_no-repeat,white]"
              )}
            />
            <button
              type="button"
              aria-label="1,000 more homes"
              onPointerDown={() => pressKey("space")}
              onClick={(e) => {
                if (e.detail === 0) playKey("space");
                set(homes + step);
              }}
              className={cn(keycap, lift, "grid size-10 shrink-0 place-items-center rounded-xl")}
            >
              <IconPlus className="size-4" />
            </button>
          </div>
          <div aria-hidden className="mt-1.5 flex justify-between px-[3.25rem] text-[10px] font-semibold tracking-wider text-white/75 uppercase tabular-nums">
            <span>{fmt(min)}</span>
            <span>Homes</span>
            <span>{fmt(max)}</span>
          </div>
        </div>

        {/* Postcard size keys */}
        <fieldset className="mt-5 px-1">
          <legend className="sr-only">Postcard size</legend>
          <div className="grid grid-cols-5 gap-1.5 max-[360px]:grid-cols-3 max-[360px]:gap-2 sm:gap-2">
            {pricing.sizes.map((s) => {
              const on = s.name === sizeName;
              return (
                <label
                  key={s.name}
                  className="cursor-pointer"
                  onPointerDown={() => pressKey("press")}
                >
                  <input
                    type="radio"
                    name="size"
                    value={s.name}
                    checked={on}
                    onChange={() => {
                      sweep.current?.stop();
                      setSizeName(s.name);
                      if (!viaPointer.current) playKey("press"); // arrow keys
                      viaPointer.current = false;
                    }}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      keycap,
                      "relative flex h-full flex-col items-center gap-1.5 rounded-xl px-1 pt-3 pb-2 text-center peer-focus-visible:ring-3",
                      on ? pressed : lift
                    )}
                  >
                    <SizeGlyph size={s} active={on} />
                    <span className={cn("block text-[10px] leading-tight font-semibold tracking-tight transition-colors sm:text-[11px] sm:tracking-normal", on && "text-primary")}>
                      {s.name}
                    </span>
                    <span className="hidden text-[10px] leading-tight whitespace-nowrap text-muted-foreground sm:block">
                      {s.dims}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          <p aria-hidden className="mt-1.5 text-center text-[10px] font-semibold tracking-wider text-white/75 uppercase">
            Postcard size<span className="hidden sm:inline"> · inches</span>
          </p>
        </fieldset>

        {/* The big key */}
        <Link
          href="/contact"
          onPointerDown={() => pressKey("enter")}
          className={cn(keycap, lift, "group mt-5 flex h-14 items-center justify-center gap-2 rounded-2xl font-semibold text-primary")}
        >
          {pricing.cta}{" "}
          <IconArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
        </Link>

      </motion.div>
    </div>
  );
}


function Screw({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute size-2 rounded-full bg-black/15 shadow-[inset_0_1px_1px_rgb(0_0_0/0.3)] after:absolute after:inset-x-0.5 after:top-1/2 after:h-px after:-translate-y-1/2 after:rotate-45 after:bg-white/40",
        className
      )}
    />
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
    <span aria-hidden className="flex h-6 items-end">
      <span
        className={cn(
          "block rounded-[2px] border-[1.5px] transition-colors",
          active ? "border-primary bg-primary/15" : "border-muted-foreground/40 bg-muted"
        )}
        style={{ width: `${(size.w / largest) * 30}px`, height: `${(size.h / largest) * 30}px` }}
      />
    </span>
  );
}
