"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { IconArrowRight, IconMinus, IconPlus, IconVolume, IconVolumeOff } from "@tabler/icons-react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";

import { PrintedStamp } from "@/components/sections/printed-stamp";
import { OppiziSymbol } from "@/components/site/logo";
import { Slider } from "@/components/ui/slider";
import { pricing } from "@/content/site";
import { playKey, prepareSounds, setSoundsOn, soundsOn } from "@/lib/key-sounds";
import { placeStamp, STAMP_H, STAMP_SPOT_ID, STAMP_TILT, STAMP_W, type Stamp } from "@/lib/quote-stamp";
import { cn } from "@/lib/utils";

// The "EDDM price meter": a flat, product-like object (after the postage meters post
// offices use to price mail) instead of a form, drawn the way Apple would (no screws or
// plates, corners that nest inside each other) with liquid glass parts: the pink body
// catches the light like glass (rims along its edges, a sheen), and its keys are small
// frosted panes over it, each with a rim of light. A white screen shows the estimate in rolling digits; a slider with − / +
// sets the homes; a segmented control picks the postcard size; a big key asks for the
// quote. The first time it's on screen the fader glides up to 15,000 once.
// It rests still, like an object on a desk, and its keys clack (Cream switch samples;
// the speaker grille turns the sound off). Asking for the quote
// prints a postage stamp with the estimate out of a slot at the bottom; it then floats
// along as the page glides down to the "Ready to reach every door?" card, and lands on it.

type Size = (typeof pricing.sizes)[number];
const { min, max, step, initial } = pricing.homes;
const NOTCH_EVERY = 5000; // the slider ticks a little firmer at each of these
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
const TAKE_OFF = 1050; // ms after printing starts
const MAKE_ROOM = 0.45; // s to glide the page up when the stamp would print off screen
const glide = [0.65, 0, 0.35, 1] as const;

type Flight = { stamp: Stamp; left: number; top: number; x: number; y: number; scale: number; duration: number };

// Keys: − / + are white frosted glass like the quote key (a rim of light, no shadow),
// with pink signs. The chosen size sits on a whiter pane that slides between segments
// (like iOS's segmented control). Keys dip a little when pressed; "pressed" is the same
// dip, for keys pressed from your own keyboard.
const glassKey =
  "bg-white/90 text-primary backdrop-blur-md shadow-[inset_0_1px_0_rgb(255_255_255/1),inset_0_-1px_0_rgb(255_255_255/0.5)] transition-[background-color,scale] duration-150 hover:bg-white active:scale-[0.96] outline-none focus-visible:ring-3 focus-visible:ring-white/60";
const pressed = "scale-[0.96]";

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
  const pillId = useId(); // the chosen size's pill, unique per meter on the page

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
  const busy = useRef(false); // from the press until the stamp lands
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
    if (!from || !spot) {
      busy.current = false;
      return placeStamp(stamp);
    }
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
      busy.current = false;
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
    if (busy.current) return;
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
    busy.current = true;
    // If the stamp would print below the window, first glide the page up just enough
    // to see it come out (with a little breathing room), then print.
    const device = root.current?.getBoundingClientRect();
    const short = device ? device.bottom + STAMP_H + 32 - window.innerHeight : 0;
    const lead = short > 0 ? MAKE_ROOM : 0;
    if (short > 0) {
      glideAnim.current = animate(window.scrollY, window.scrollY + short, {
        duration: MAKE_ROOM,
        ease,
        onUpdate: (v) => window.scrollTo({ top: v, behavior: "instant" }),
      });
    }
    timers.current = [
      window.setTimeout(() => setPrinting(stamp), lead * 1000),
      ...FEED_STEPS.map((t) =>
        window.setTimeout(() => playKey("tick", { gain: 0.35, pitch: 0.75 }), (lead + t) * 1000 + 60)
      ),
      window.setTimeout(() => takeOff(stamp), lead * 1000 + TAKE_OFF),
    ];
  };

  // Keys play when pressed (click-in only); keyboard use plays the press too.
  const viaPointer = useRef(false);
  const pressKey = (sound: "press" | "space" | "enter") => {
    viaPointer.current = true;
    playKey(sound, { gain: sound === "enter" ? 0.6 : 0.5 });
  };

  return (
    <>
      <div className="relative mx-auto w-full max-w-[540px]">
        {/* Soft pink glow on the "table" under the device */}
        <div aria-hidden className="absolute inset-x-10 -bottom-8 h-16 rounded-full bg-primary/30 blur-3xl" />

        <motion.div
          ref={root}
          onPointerEnter={() => prepareSounds()}
          onFocus={() => prepareSounds()}
          // Corners nest: the body's 36px radius minus its 20px padding is the screen's 16px.
          // Pink, lit like glass: a bright rim along the top edge, a fainter one along the
          // bottom, a soft inner glow, and a sheen across the top-left.
          className="relative rounded-[36px] bg-primary p-5 shadow-[inset_0_1.5px_0_rgb(255_255_255/0.55),inset_0_-1px_0_rgb(255_255_255/0.25),inset_0_0_0_1px_rgb(255_255_255/0.18),inset_0_0_36px_rgb(255_255_255/0.12),0_2px_4px_rgb(0_0_0/0.06),0_40px_80px_-32px_color-mix(in_oklab,var(--primary)_65%,black)]"
        >
          {/* A sheen across the top-left, where the light hits the glass */}
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(135deg,rgb(255_255_255/0.28),transparent_40%)]" />

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
          <span aria-hidden className="absolute bottom-0 left-1/2 z-20 h-1 w-[196px] -translate-x-1/2 rounded-t-full bg-black/25" />

          {/* Top row: the name, printed straight on the body, and the speaker, a patch of
              tiny holes (it turns the key sounds on and off) */}
          <div className="flex h-7 items-center justify-between px-2 pb-4 box-content">
            <span className="relative inline-flex items-center gap-2 text-xs font-medium tracking-wide text-white/85">
              <OppiziSymbol cropped className="h-2.5 w-auto" />
              EDDM Price Meter
            </span>
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={sound}
              aria-label="Key sounds"
              title={sound ? "Key sounds on" : "Key sounds off"}
              className="group relative inline-flex cursor-pointer items-center gap-2.5 rounded-full px-1.5 py-1 text-white/85 outline-none transition-colors hover:text-white focus-visible:ring-3 focus-visible:ring-white/60"
            >
              {sound ? <IconVolume className="size-3.5" /> : <IconVolumeOff className="size-3.5 opacity-60" />}
              <span aria-hidden className="grid grid-cols-8 gap-[3px]">
                {Array.from({ length: 24 }, (_, i) => (
                  <span key={i} className="size-[2.5px] rounded-full bg-black/30" />
                ))}
              </span>
            </button>
          </div>

          {/* The screen: white, flush, one hero number (the price); the homes and the price
              per piece quietly under it */}
          <div className="relative rounded-2xl bg-white/90 px-5 pt-4 pb-5 text-neutral-950 backdrop-blur-xl shadow-[inset_0_1px_0_rgb(255_255_255/1),inset_0_0_0_1px_rgb(255_255_255/0.5),0_1px_2px_rgb(0_0_0/0.05),0_8px_20px_-10px_rgb(0_0_0/0.18)]">
            <p className="sr-only" aria-live="polite">
              {usd(total)} for {fmt(homes)} homes with a {size.name} postcard, {perPiece} per piece.
            </p>
            <div aria-hidden>
              <p className="text-xs font-medium text-neutral-500">Estimate</p>
              <p className="mt-1 font-heading text-5xl font-semibold tracking-tighter sm:text-6xl">
                <RollingNumber value={usd(total)} />
              </p>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5 text-sm text-neutral-500">
                <span className="font-medium leading-none text-neutral-950">
                  <RollingNumber value={fmt(homes)} /> homes
                </span>
                <span>·</span>
                <span>
                  <span className="tabular-nums">{perPiece}</span> each, all-in
                </span>
              </p>
            </div>
          </div>

          {/* Homes: − / slider / + */}
          <div className="mt-5 px-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="1,000 fewer homes"
                aria-keyshortcuts="ArrowLeft"
                onPointerDown={() => pressKey("space")}
                onClick={(e) => {
                  if (e.detail === 0) playKey("space");
                  set(homes - step);
                }}
                className={cn(glassKey, held === "minus" && pressed, "grid size-10 shrink-0 place-items-center rounded-full")}
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
                  // Passing a notch clicks a little firmer.
                  playKey("tick", { gain: v % NOTCH_EVERY === 0 ? 0.4 : 0.22, pitch: 0.85 + (0.35 * (v - min)) / (max - min) });
                }}
                getAriaValueText={(_, v: number) => `${fmt(v)} homes`}
                // iOS 26-style: a thin groove filled white, and a round white knob that turns
                // to clear, bigger glass while it's dragged
                className={cn(
                  "[&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:bg-black/20 [&_[data-slot=slider-track]]:shadow-[inset_0_1px_1px_rgb(0_0_0/0.15),0_1px_0_rgb(255_255_255/0.25)]",
                  "[&_[data-slot=slider-range]]:bg-white",
                  "[&_[data-slot=slider-thumb]]:size-7 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:bg-white/90 [&_[data-slot=slider-thumb]]:backdrop-blur-md [&_[data-slot=slider-thumb]]:ring-white/40",
                  "[&_[data-slot=slider-thumb]]:shadow-[inset_0_1px_0_rgb(255_255_255/1),inset_0_-1px_0_rgb(255_255_255/0.4),inset_0_0_0_1px_rgb(255_255_255/0.4),0_1px_2px_rgb(0_0_0/0.1),0_6px_14px_-4px_rgb(0_0_0/0.25)]",
                  "[&_[data-slot=slider-thumb]]:transition-[scale,background-color,box-shadow] [&_[data-slot=slider-thumb]]:duration-200 [&_[data-slot=slider-thumb][data-dragging]]:scale-[1.35] [&_[data-slot=slider-thumb][data-dragging]]:bg-white/25"
                )}
              />
              <button
                type="button"
                aria-label="1,000 more homes"
                aria-keyshortcuts="ArrowRight"
                onPointerDown={() => pressKey("space")}
                onClick={(e) => {
                  if (e.detail === 0) playKey("space");
                  set(homes + step);
                }}
                className={cn(glassKey, held === "plus" && pressed, "grid size-10 shrink-0 place-items-center rounded-full")}
              >
                <IconPlus className="size-4" />
              </button>
            </div>
          </div>

          {/* Postcard size keys */}
          <fieldset className="mt-5">
            <legend className="sr-only">Postcard size</legend>
            {/* One recessed track, 16px corners; segments inside are 4px in, so 12px */}
            <div className="grid grid-cols-5 gap-1 rounded-2xl bg-black/10 p-1 shadow-[inset_0_1px_2px_rgb(0_0_0/0.12),0_1px_0_rgb(255_255_255/0.22)] max-[360px]:grid-cols-3">
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
                        "relative flex h-full flex-col items-center gap-1.5 rounded-xl px-1 pt-3 pb-2 text-center transition-[background-color,scale] duration-150 active:scale-[0.96] peer-focus-visible:ring-3 peer-focus-visible:ring-white/60",
                        !on && "hover:bg-white/10",
                        held === s.name && pressed
                      )}
                    >
                      {on && (
                        <motion.span
                          layoutId={`${pillId}-size`}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                          className="absolute inset-0 rounded-xl bg-white/90 backdrop-blur-md shadow-[inset_0_1px_0_rgb(255_255_255/1),inset_0_-1px_0_rgb(255_255_255/0.5),0_1px_2px_rgb(0_0_0/0.1),0_6px_14px_-6px_rgb(0_0_0/0.3)]"
                        />
                      )}
                      <SizeGlyph size={s} active={on} />
                      <span className={cn("relative block text-[10px] leading-tight font-semibold tracking-tight transition-colors sm:text-[11px] sm:tracking-normal", on ? "text-neutral-950" : "text-white")}>
                        {s.name}
                      </span>
                      <span className={cn("relative hidden text-[10px] leading-tight whitespace-nowrap transition-colors sm:block", on ? "text-neutral-500" : "text-white/70")}>
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
            // White frosted glass with a rim of light (no shadow under it), the pink text
            // the call to act
            className="group relative mt-5 flex h-14 items-center justify-center gap-2 rounded-2xl bg-white/90 font-semibold text-primary backdrop-blur-md shadow-[inset_0_1px_0_rgb(255_255_255/1),inset_0_-1px_0_rgb(255_255_255/0.5)] transition-[scale,background-color] duration-150 outline-none hover:bg-white focus-visible:ring-3 focus-visible:ring-white/60 active:scale-[0.98]"
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
    </>
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

/**
 * The postcard as a line icon, in the manner of Lucide and Tabler (fine 1px strokes,
 * round caps and corners): the card at its real proportions, all on one scale (2px an
 * inch), with a stamp in the corner and address lines, as many as fit. Strokes stay 1px
 * at every size, so the small cards stay as crisp as the big one.
 */
function SizeGlyph({ size, active }: { size: Size; active: boolean }) {
  const w = size.w * 2;
  const h = size.h * 2;
  const stamp = Math.min(4, h * 0.3);
  const lines = h >= 12 ? [h - 6.25, h - 3.25] : [h - 3.25];
  return (
    <span aria-hidden className="relative flex h-6 items-end">
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("transition-colors duration-200", active ? "text-primary" : "text-white/80")}
      >
        <rect x={0.5} y={0.5} width={w - 1} height={h - 1} rx={2} />
        <rect x={w - 2.75 - stamp} y={2.75} width={stamp} height={stamp} rx={0.75} fill="currentColor" stroke="none" />
        {lines.map((y, i) => (
          <path key={y} d={`M3 ${y}H${i === lines.length - 1 ? w * 0.55 : w * 0.4}`} />
        ))}
      </svg>
    </span>
  );
}
