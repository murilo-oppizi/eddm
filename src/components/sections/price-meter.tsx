"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { IconArrowRight, IconMinus, IconPlus, IconVolume, IconVolumeOff } from "@tabler/icons-react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import { PrintedStamp } from "@/components/sections/printed-stamp";
import { OppiziSymbol } from "@/components/site/logo";
import { Kbd } from "@/components/ui/kbd";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { pricing } from "@/content/site";
import { playKey, prepareSounds, setSoundsOn, soundsOn } from "@/lib/key-sounds";
import { placeStamp, STAMP_H, STAMP_SPOT_ID, STAMP_TILT, STAMP_W, type Stamp } from "@/lib/quote-stamp";
import { cn } from "@/lib/utils";

// The "EDDM price meter": a flat, product-like object (after the postage meters post
// offices use to price mail) instead of a form. A light screen shows the estimate in
// rolling digits and a level meter; a fader with − / + sets the homes; five keycaps
// pick the postcard size (the chosen one shows its shape and name in pink); a big key asks
// for the quote. The first time it's on screen the fader glides up to 15,000 once.
// It tilts a little toward the pointer, and its keys clack
// (Cream switch samples; the speaker grille turns the sound off). Asking for the quote
// prints a postage stamp with the estimate out of a slot at the bottom; it then floats
// along as the page glides down to the "Ready to reach every door?" card, and lands on it.

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

// The stamp feeds out in three steps, like a meter's printer, and rests a beat before it
// takes off. FEED_STEPS are when each step starts (seconds), for the ticks.
const FEED = 0.7;
const FEED_STEPS = [0, 0.21, 0.42];
const TAKE_OFF = 1050; // ms after the press
const glide = [0.65, 0, 0.35, 1] as const;

type Flight = { stamp: Stamp; left: number; top: number; x: number; y: number; scale: number; duration: number };

// Keycaps: off-white (the design system's gray-100, dark in dark mode) so a crisp white
// highlight shows along the top edge, like a real keycap catching the light; a hairline
// edge and soft drop over our deeper "travel" shadow. Pressed keys sink 2px, shrink a
// hair and lose some highlight.
const keycap =
  "bg-[var(--ds-tw-gray-100)] text-card-foreground dark:bg-card shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_1px_rgb(0_0_0/0.1),0_3px_0_rgb(0_0_0/0.2),inset_0_3px_0_rgb(255_255_255/1)] dark:shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_1px_rgb(0_0_0/0.1),0_3px_0_rgb(0_0_0/0.2),inset_0_3px_0_rgb(255_255_255/0.12)] transition-[translate,scale,box-shadow] duration-100 active:translate-y-[2px] active:scale-[0.98] active:shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_0_rgb(0_0_0/0.2),inset_0_1px_0_rgb(255_255_255/0.5)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const pressed =
  "translate-y-[2px] scale-[0.98] shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_0_rgb(0_0_0/0.2),inset_0_1px_0_rgb(255_255_255/0.5)]";
const lift =
  "hover:-translate-y-px hover:shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_2px_2px_rgb(0_0_0/0.1),0_4px_0_rgb(0_0_0/0.2),inset_0_3px_0_rgb(255_255_255/1)]";

// A debossed plate on the device body: darker, pressed in, with a light lower edge.
const plate =
  "inline-flex h-7 items-center rounded-full bg-black/20 text-white shadow-[inset_0_1px_2px_rgb(0_0_0/0.3),0_1px_0_rgb(255_255_255/0.3)]";

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

  // Your own keyboard works the meter while it's mostly on screen: ← → or − + for the
  // homes (hold to repeat), 1–5 for the postcard size. The matching key presses and
  // clicks. Ignored while typing in a field or with modifier keys.
  const [held, setHeld] = useState<string | null>(null);
  const mostlyOnScreen = useInView(root, { amount: 0.5 });
  useEffect(() => {
    if (!mostlyOnScreen) return;
    const onDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Typing in a text field (not the meter's own radio keys or fader).
      const typing =
        t?.isContentEditable ||
        t?.tagName === "TEXTAREA" ||
        t?.tagName === "SELECT" ||
        (t instanceof HTMLInputElement && !["radio", "checkbox", "range", "button", "submit"].includes(t.type));
      if (typing) return;
      const k = e.key;
      // A focused control inside the meter already handles the arrows (the fader steps,
      // the size keys move between sizes); digits and − / + still work.
      const arrow = k === "ArrowLeft" || k === "ArrowRight";
      if (arrow && t && t !== document.body && root.current?.contains(t)) return;
      const key =
        k === "ArrowLeft" || k === "-" || k === "_" ? "minus"
        : k === "ArrowRight" || k === "+" || k === "=" ? "plus"
        : /^[1-5]$/.test(k) ? pricing.sizes[Number(k) - 1].name
        : null;
      if (!key) return;
      e.preventDefault();
      setHeld(key);
      sweep.current?.stop();
      if (key === "minus" || key === "plus") {
        playKey("space");
        setHomes((h) => clamp(h + (key === "plus" ? step : -step)));
      } else if (!e.repeat) {
        playKey("press");
        setSizeName(key);
      }
    };
    const onUp = () => setHeld(null);
    document.addEventListener("keydown", onDown);
    document.addEventListener("keyup", onUp);
    return () => {
      document.removeEventListener("keydown", onDown);
      document.removeEventListener("keyup", onUp);
    };
  }, [mostlyOnScreen]);

  // The quote key prints the stamp, which then flies (in a fixed layer above the page)
  // to its spot on the "Ready to reach every door?" card while the page glides there.
  // Scrolling or typing mid-flight lands it at once. Reduced motion skips the show:
  // the stamp is simply on the card when the page jumps there.
  const [printing, setPrinting] = useState<Stamp | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const glideAnim = useRef<ReturnType<typeof animate> | null>(null);
  const landRef = useRef<() => void>(() => {});
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      glideAnim.current?.stop();
      landRef.current();
    },
    []
  );

  const cardScroll = (spot: HTMLElement) => {
    // Center the card (with the stamp's overhang) in the view, as far as the page allows.
    const card = (spot.parentElement ?? spot).getBoundingClientRect();
    const overhang = STAMP_H / 2;
    const ideal = window.scrollY + card.top - overhang - (window.innerHeight - card.height - overhang) / 2;
    return Math.max(0, Math.min(ideal, document.documentElement.scrollHeight - window.innerHeight));
  };

  const takeOff = (stamp: Stamp) => {
    const from = feedRef.current?.getBoundingClientRect();
    const spot = document.getElementById(STAMP_SPOT_ID);
    setPrinting(null);
    if (!from || !spot) return placeStamp(stamp);
    const endScroll = cardScroll(spot);
    const delta = endScroll - window.scrollY;
    const to = spot.getBoundingClientRect(); // unrotated; the tilt is on the stamp inside
    const cx = from.left + from.width / 2;
    const cy = from.top + from.height / 2;
    const duration = Math.min(1.6, 0.9 + Math.abs(delta) / 3000);
    setFlight({
      stamp,
      left: cx - STAMP_W / 2,
      top: cy - STAMP_H / 2,
      x: to.left + to.width / 2 - cx,
      y: to.top + to.height / 2 - delta - cy,
      scale: to.width / STAMP_W,
      duration,
    });

    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      glideAnim.current?.stop();
      ["wheel", "touchstart", "keydown"].forEach((t) => window.removeEventListener(t, land));
      placeStamp(stamp);
      setFlight(null);
      playKey("press", { gain: 0.55, pitch: 0.8 });
    };
    landRef.current = land;
    ["wheel", "touchstart", "keydown"].forEach((t) => window.addEventListener(t, land, { passive: true }));
    glideAnim.current = animate(window.scrollY, endScroll, {
      duration,
      ease: glide,
      onUpdate: (v) => window.scrollTo({ top: v, behavior: "instant" }),
    });
  };

  const printQuote = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.detail === 0) playKey("enter", { gain: 0.6 }); // Enter key
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // new tab
    e.preventDefault();
    if (printing || flight) return;
    sweep.current?.stop();
    const stamp: Stamp = {
      total: usd(total),
      homes: fmt(homes),
      size: size.name,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase(),
    };
    const spot = document.getElementById(STAMP_SPOT_ID);
    if (reduce) {
      placeStamp(stamp);
      if (spot) window.scrollTo({ top: cardScroll(spot), behavior: "instant" });
      return;
    }
    setPrinting(stamp);
    timers.current = [
      ...FEED_STEPS.map((t) => window.setTimeout(() => playKey("tick", { gain: 0.35, pitch: 0.75 }), t * 1000 + 60)),
      window.setTimeout(() => takeOff(stamp), TAKE_OFF),
    ];
  };

  // Keys play when pressed (click-in only); keyboard use plays the press too.
  const viaPointer = useRef(false);
  const pressKey = (sound: "press" | "space" | "enter") => {
    viaPointer.current = true;
    playKey(sound, { gain: sound === "enter" ? 0.6 : 0.5 });
  };

  return (
    <TooltipProvider delay={300}>
      <div className="relative mx-auto w-full max-w-[540px]">
        {/* Soft pink glow on the "table" under the device */}
        <motion.div aria-hidden style={{ x: glowX }} className="absolute inset-x-10 -bottom-8 h-16 rounded-full bg-primary/30 blur-3xl" />

        <motion.div
          ref={root}
          style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1200 }}
          onPointerEnter={() => prepareSounds()}
          onFocus={() => prepareSounds()}
          className="relative rounded-[30px] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_86%,white),var(--primary)_55%)] p-6 shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_-5px_0_rgb(0_0_0/0.14),0_30px_60px_-24px_color-mix(in_oklab,var(--primary)_70%,black)]"
        >
          <Screw className="top-3.5 left-3.5" />
          <Screw className="top-3.5 right-3.5" />
          <Screw className="bottom-3.5 left-3.5" />
          <Screw className="right-3.5 bottom-3.5" />

          {/* The printer: a slot along the bottom edge, and the stamp that feeds out of it.
              The stamp sits behind the slot's lip, so it looks like it comes from inside. */}
          <div aria-hidden className="pointer-events-none absolute top-[calc(100%-4px)] left-1/2 z-10 -translate-x-1/2 overflow-hidden px-5 pb-5">
            {printing && (
              <motion.div
                ref={feedRef}
                initial={{ y: "-100%" }}
                animate={{ y: ["-100%", "-68%", "-68%", "-36%", "-36%", "-4%", "-4%", "0%"] }}
                transition={{ duration: FEED, times: [0, 0.14, 0.3, 0.44, 0.6, 0.74, 0.86, 1], ease: "easeOut" }}
                className="drop-shadow-[0_4px_6px_rgb(0_0_0/0.18)]"
              >
                <PrintedStamp {...printing} />
              </motion.div>
            )}
          </div>
          <span aria-hidden className="absolute bottom-0 left-1/2 z-20 h-[5px] w-[196px] -translate-x-1/2 rounded-t-[4px] bg-black/35 shadow-[inset_0_-2px_2px_rgb(0_0_0/0.35)]" />

          {/* Top plate: the maker's nameplate and the speaker, both debossed into the body
              (a darker, inset plate with a light lower edge), so white reads clearly */}
          <div className="flex items-center justify-between pb-4">
            <span className={cn(plate, "gap-2 px-3 text-xs font-semibold tracking-wide")}>
              <OppiziSymbol cropped className="h-3 w-auto" />
              EDDM Price Meter
            </span>
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={sound}
              aria-label="Key sounds"
              title={sound ? "Key sounds on" : "Key sounds off"}
              className={cn(
                plate,
                "cursor-pointer gap-2 px-2.5 outline-none transition-colors hover:bg-black/25 focus-visible:ring-3 focus-visible:ring-ring/50"
              )}
            >
              {sound ? <IconVolume className="size-3.5" /> : <IconVolumeOff className="size-3.5 opacity-70" />}
              <span aria-hidden className="grid grid-cols-6 gap-[3px]">
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={i} className={cn("size-[3px] rounded-full transition-colors", sound ? "bg-white/70" : "bg-white/30")} />
                ))}
              </span>
            </button>
          </div>

          {/* The screen */}
          <div className="rounded-2xl bg-card p-5 shadow-[inset_0_2px_8px_rgb(0_0_0/0.14)] ring-1 ring-black/10">
            {/* The two figures: what it costs, and how many homes it reaches */}
            <p className="sr-only" aria-live="polite">
              {usd(total)} for {fmt(homes)} homes with a {size.name} postcard, {perPiece} per piece.
            </p>
            {/* Labels share a line, and so do the figures (bottoms aligned) */}
            <div aria-hidden className="grid grid-cols-[1fr_auto] items-end gap-x-4 gap-y-1">
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Estimate</p>
              <p className="text-right text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Homes</p>
              {/* Same size and weight, so the two read as a pair */}
              <p className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                <RollingNumber value={usd(total)} />
              </p>
              <p className="text-right font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                <RollingNumber value={fmt(homes)} />
              </p>
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
            <div aria-hidden className="mt-2 flex justify-between text-[11px] text-muted-foreground tabular-nums">
              <span>{fmt(min)}</span>
              <span>{fmt(max)}</span>
            </div>
            {/* The details behind the estimate */}
            <div aria-hidden className="mt-4 flex justify-between gap-4 border-t border-dashed pt-3 text-sm">
              <span>
                <span className="font-semibold tabular-nums">{perPiece}</span>
                <span className="text-muted-foreground"> each, all-in</span>
              </span>
              <span className="text-muted-foreground">
                {size.name}
                <span className="hidden sm:inline"> · {size.dims} in</span>
              </span>
            </div>
          </div>

          {/* Homes: − / fader / + */}
          <div className="mt-5 px-1">
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger
                  aria-label="1,000 fewer homes"
                  aria-keyshortcuts="ArrowLeft"
                  onPointerDown={() => pressKey("space")}
                  onClick={(e) => {
                    if (e.detail === 0) playKey("space");
                    set(homes - step);
                  }}
                  className={cn(keycap, held === "minus" ? pressed : lift, "grid size-10 shrink-0 place-items-center rounded-xl")}
              >
                  <IconMinus className="size-4" />
                </TooltipTrigger>
                <TooltipContent>
                  1,000 fewer homes <Kbd>←</Kbd>
                </TooltipContent>
              </Tooltip>
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
              <Tooltip>
                <TooltipTrigger
                  aria-label="1,000 more homes"
                  aria-keyshortcuts="ArrowRight"
                  onPointerDown={() => pressKey("space")}
                  onClick={(e) => {
                    if (e.detail === 0) playKey("space");
                    set(homes + step);
                  }}
                  className={cn(keycap, held === "plus" ? pressed : lift, "grid size-10 shrink-0 place-items-center rounded-xl")}
              >
                  <IconPlus className="size-4" />
                </TooltipTrigger>
                <TooltipContent>
                  1,000 more homes <Kbd>→</Kbd>
                </TooltipContent>
              </Tooltip>
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
                        "relative flex h-full flex-col items-center gap-1.5 rounded-xl px-1 pt-3 pb-2 text-center peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                        held === s.name ? pressed : lift
                      )}
                    >
                      <SizeGlyph size={s} active={on} />
                      <span className={cn("block text-[10px] leading-tight font-semibold tracking-tight transition-colors sm:text-[11px] sm:tracking-normal", on && "text-primary")}>
                        {s.name}
                      </span>
                      <span className="hidden text-[10px] leading-tight whitespace-nowrap text-muted-foreground sm:block">
                        {s.dims} in
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* The big key */}
          <Link
            href="/#get-started"
            onPointerDown={() => pressKey("enter")}
            onClick={printQuote}
            className={cn(keycap, lift, "group mt-5 flex h-14 items-center justify-center gap-2 rounded-2xl font-semibold text-primary")}
          >
            {pricing.cta}{" "}
            <IconArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </Link>

        </motion.div>
      </div>

      {/* The stamp in flight: fixed above the page, so it stays in view while the page
          glides down. It lifts (bigger, softer shadow), turns, and presses down on landing. */}
      {flight &&
        createPortal(
          <motion.div
            aria-hidden
            className="pointer-events-none fixed z-[60]"
            style={{ left: flight.left, top: flight.top, width: STAMP_W, height: STAMP_H }}
            initial={{ x: 0, y: 0, scale: 1, rotate: 0 }}
            animate={{
              x: flight.x,
              y: flight.y,
              scale: [1, Math.max(1, flight.scale) * 1.1, flight.scale * 0.96, flight.scale],
              rotate: [0, -4, STAMP_TILT + 1, STAMP_TILT],
              filter: [
                "drop-shadow(0 4px 6px rgb(0 0 0 / 0.18))",
                "drop-shadow(0 20px 22px rgb(0 0 0 / 0.22))",
                "drop-shadow(0 3px 4px rgb(0 0 0 / 0.22))",
                "drop-shadow(0 4px 6px rgb(0 0 0 / 0.2))",
              ],
            }}
            transition={{
              duration: flight.duration,
              times: [0, 0.45, 0.88, 1],
              ease: "easeInOut",
              // The path follows the page's glide, so the two move as one.
              x: { duration: flight.duration, ease: glide },
              y: { duration: flight.duration, ease: glide },
            }}
            onAnimationComplete={() => landRef.current()}
          >
            <PrintedStamp {...flight.stamp} />
          </motion.div>,
          document.body
        )}
    </TooltipProvider>
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
