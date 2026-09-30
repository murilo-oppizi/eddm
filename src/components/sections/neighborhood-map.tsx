"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconBarbell,
  IconHomeDollar,
  IconScissors,
  IconShoppingBag,
  IconTool,
  IconToolsKitchen2,
  type TablerIcon,
} from "@tabler/icons-react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";

import { StreetGrid, toMap, toPoints } from "@/components/sections/illustrated-map";
import { Button } from "@/components/ui/button";
import { audiences, site } from "@/content/site";
import { playKey } from "@/lib/key-sounds";
import { cn } from "@/lib/utils";

// "Who it's for" as one city: every kind of business has its own neighborhood on the same
// hand-drawn streets as the hero, close enough that each glide passes the last one.
// Picking one glides the camera there; its pin (the hero's dot, in its color) pops in with
// one soft ripple, and the EDDM route it would mail traces along the streets. Kept light
// on purpose, like mapcn's markers and routes: a dot with a white ring and a halo, a fine
// outline over a pale fill. Businesses already visited stay behind as small dots. The last
// step (`active` = the number of businesses) zooms out to the whole city, every business
// as pins (no routes), around an empty spot in the middle: a dashed pink "?" pin, "Your
// business?". After a beat it's claimed (solid pink), and then the map folds up like paper
// (in half, then in half again) and flips over into that business's postcard, which gets
// its EDDM postage stamped on and carries the call to action.

type Industry = (typeof audiences.industries)[number];
type Tone = Industry["tone"] | "brand"; // brand pink: "Your business"
type Step = [number, number];

/** The camera's window at street level, in map units. The card keeps this aspect. */
const VIEW = { w: 440, h: 360 };
/** Where the business sits in the window (fractions), leaving the corner for the postcard. */
const FOCUS = { x: 0.4, y: 0.5 };
const glide = [0.65, 0, 0.35, 1] as const;

/**
 * Each business: its block, the one route it mails (a street-following outline in grid
 * units from that block, about the size of the hero's), its neighborhood and the reach on
 * its label. Placeholder numbers; Brooklyn names, like the hero's Williamsburg.
 */
const scenes: { at: Step; route: Step[]; name: string; reach: string; nameBelow?: boolean }[] = [
  { at: [-2, 1], name: "WILLIAMSBURG", route: [[-1, -2], [1, -2], [1, -1], [2, -1], [2, 2], [0, 2], [0, 3], [-1, 3]], reach: "1 route · 548 homes" },
  { at: [5, -7], name: "GREENPOINT", route: [[-1, -3], [1, -3], [1, 3], [0, 3], [0, 4], [-1, 4]], reach: "1 route · 612 homes" },
  // Its name goes below its route: above, it would sit on Williamsburg's.
  { at: [-4, 7], name: "FORT GREENE", nameBelow: true, route: [[0, -2], [2, -2], [2, 1], [1, 1], [1, 3], [-1, 3], [-1, -1], [0, -1]], reach: "1 route · 486 homes" },
  { at: [5, 6], name: "BUSHWICK", route: [[-1, -3], [1, -3], [1, -2], [2, -2], [2, 3], [-1, 3]], reach: "1 route · 734 homes" },
  { at: [-5, -6], name: "DUMBO", route: [[-1, -2], [2, -2], [2, 1], [1, 1], [1, 2], [-1, 2]], reach: "1 route · 529 homes" },
  { at: [0, 13], name: "BED-STUY", route: [[0, -3], [1, -3], [1, -1], [2, -1], [2, 2], [1, 2], [1, 3], [-1, 3], [-1, 0], [0, 0]], reach: "1 route · 657 homes" },
];
const OVERVIEW = scenes.length;

/** "Your business": the empty spot at the heart of the city view, in the middle of the
 *  six businesses (the camera frames the city around it). */
const YOU = { at: [0, 0] as Step };
/** When the spot is claimed, and so when the fold can start (ms into the city view). */
const CLAIM_AT = 1800;

const icons: Record<Industry["icon"], TablerIcon> = {
  restaurant: IconToolsKitchen2,
  realEstate: IconHomeDollar,
  salon: IconScissors,
  homeServices: IconTool,
  gym: IconBarbell,
  retail: IconShoppingBag,
};

// SVG paint per tone (written out in full so Tailwind generates each class).
const paint: Record<Tone, { fill: string; soft: string; stroke: string; text: string }> = {
  brand: { fill: "fill-brand", soft: "fill-brand/10", stroke: "stroke-brand", text: "text-brand" },
  info: { fill: "fill-info", soft: "fill-info/10", stroke: "stroke-info", text: "text-info" },
  success: { fill: "fill-success", soft: "fill-success/10", stroke: "stroke-success", text: "text-success" },
  warning: { fill: "fill-warning", soft: "fill-warning/10", stroke: "stroke-warning", text: "text-warning" },
  ai: { fill: "fill-ai", soft: "fill-ai/10", stroke: "stroke-ai", text: "text-ai" },
  neutral: { fill: "fill-foreground", soft: "fill-foreground/8", stroke: "stroke-foreground", text: "text-foreground" },
  cyan: {
    fill: "fill-(--ds-tw-cyan-600)",
    soft: "fill-(--ds-tw-cyan-600)/10",
    stroke: "stroke-(--ds-tw-cyan-600)",
    text: "text-(--ds-tw-cyan-600)",
  },
};
const toneOf = (n: number) => paint[audiences.industries[n].tone];

const pinAt = (n: number) => toMap(scenes[n].at[0] + 0.5, scenes[n].at[1] + 0.5);
/** Grid units from a scene's origin → the rotated group's coordinates. */
const shift = ([i, j]: Step, [di, dj]: Step): Step => [i + di, j + dj];
const routePath = (n: number) =>
  `M${toPoints(scenes[n].route.map((p) => shift(p, scenes[n].at))).replaceAll(" ", " L")} Z`;

/** The whole city: centred on "Your business", wide enough for every pin (with room for
 *  their halos and tags), at the card's aspect. */
const CITY = (() => {
  const c = toMap(YOU.at[0] + 0.5, YOU.at[1] + 0.5);
  const pins = scenes.map((_, n) => pinAt(n));
  const pad = 60;
  const halfW = Math.max(...pins.map((p) => Math.abs(p.x - c.x))) + pad;
  const halfH = Math.max(...pins.map((p) => Math.abs(p.y - c.y))) + pad;
  const w = Math.max(halfW * 2, (halfH * 2 * VIEW.w) / VIEW.h);
  return { x: c.x - w / 2, y: c.y - (w * VIEW.h) / VIEW.w / 2, w };
})();
/** How far out the city view is, relative to street level. */
const ZOOM = CITY.w / VIEW.w;

/** Where the camera looks: at a business (its pin at FOCUS), or the whole city. */
function viewFor(n: number) {
  if (n === OVERVIEW) return CITY;
  const p = pinAt(n);
  return { x: p.x - VIEW.w * FOCUS.x, y: p.y - VIEW.h * FOCUS.y, w: VIEW.w };
}

export function NeighborhoodMap({
  active,
  seen,
  instant = false,
  children,
}: {
  /** A business's index, or the number of businesses for the whole city. */
  active: number;
  /** Show it finished, without the entrance (the page is being scrolled fast). */
  instant?: boolean;
  /** Businesses already visited: their pins stay on as small dots. */
  seen: Set<number>;
  /** Floats over the map: the postcard, or the city view's call to action. */
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const city = active === OVERVIEW;
  const start = viewFor(active);
  const vx = useMotionValue(start.x);
  const vy = useMotionValue(start.y);
  const vw = useMotionValue(start.w);
  const viewBox = useTransform(() => `${vx.get()} ${vy.get()} ${vw.get()} ${(vw.get() * VIEW.h) / VIEW.w}`);

  // Glide to the chosen neighborhood or out to the city (jump with reduced motion, or
  // when the page is flying past).
  useEffect(() => {
    const to = viewFor(active);
    if (reduce || instant) {
      vx.set(to.x);
      vy.set(to.y);
      vw.set(to.w);
      return;
    }
    // Quick, so a business is readable almost as soon as its row arrives: the motion is a
    // flourish, not something to wait for.
    const opts = { duration: active === OVERVIEW ? 1 : 0.6, ease: glide };
    const anims = [animate(vx, to.x, opts), animate(vy, to.y, opts), animate(vw, to.w, opts)];
    return () => anims.forEach((a) => a.stop());
  }, [active, reduce, instant, vx, vy, vw]);

  const industry = city ? null : audiences.industries[active];
  // The finale's fold: once it starts, the paper pieces stand in for the map card.
  const [fold, setFold] = useState(0);
  const folded = city && fold > 0;

  return (
    <div className="relative">
      <div
        aria-hidden
        className={cn("relative overflow-hidden rounded-xl border bg-card shadow-lg", folded && "invisible")}
        style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}
      >
        <MapArt active={active} seen={seen} viewBox={viewBox} instant={instant} />

        {/* A business's reach, as a label in the hero's style (the city view has its call
            to action instead). */}
        {/* Labels cross-fade (they overlap), so a new one never waits for the last to leave. */}
        <AnimatePresence>
          {industry && (
            <ReachLabel key={active} industry={industry} reach={scenes[active].reach} instant={instant} />
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {city && (
          <FoldFinale
            key="fold"
            map={<MapArt active={active} seen={seen} viewBox={viewBox} still />}
            reduce={!!reduce}
            onStage={setFold}
          />
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}

/** The map itself, framed by the camera's `viewBox`. `still` skips the entrance
 *  animations: the folding paper shows copies of the map as it already is. */
function MapArt({
  active,
  seen,
  viewBox,
  still = false,
  instant = false,
}: {
  active: number;
  seen: Set<number>;
  viewBox: MotionValue<string>;
  still?: boolean;
  instant?: boolean;
}) {
  const city = active === OVERVIEW;
  const shown = city ? scenes.map((_, n) => n) : [active];
  return (
  <motion.svg viewBox={viewBox} className="absolute inset-0 size-full">
    <rect x={-3000} y={-3000} width={6000} height={6000} className="fill-card" />
    <StreetGrid>
      {/* The active business's route: a fine outline that traces along the streets, then
          takes a pale fill. (The city view shows pins only.) */}
      <AnimatePresence initial={!still}>
        {(city ? [] : shown).map((n, k) => (
          <motion.path
            key={`${city ? "city" : "one"}-${n}`}
            d={routePath(n)}
            className={cn(toneOf(n).soft, toneOf(n).stroke)}
            // Thicker in the city view, so it reads about the same on screen.
            strokeWidth={city ? 2 * ZOOM * 0.75 : 2}
            strokeOpacity="0.85"
            strokeLinejoin="round"
            initial={instant ? false : { pathLength: 0, fillOpacity: 0, opacity: 1 }}
            animate={{ pathLength: 1, fillOpacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{
              pathLength: { delay: (city ? 0.4 : 0.3) + k * 0.08, duration: 0.5, ease: "easeInOut" },
              fillOpacity: { delay: (city ? 0.7 : 0.55) + k * 0.08, duration: 0.35 },
            }}
          />
        ))}
      </AnimatePresence>
    </StreetGrid>

    {/* Neighborhood names above each route, like the hero's "WILLIAMSBURG" (hidden
        in the city view, where they'd be too small to read). */}
    {scenes.map((s) => {
      const p = toMap(s.at[0] + 0.5, s.at[1] + (s.nameBelow ? 4.6 : -4.2));
      return (
        <text
          key={s.name}
          x={p.x}
          y={p.y}
          textAnchor="middle"
          className={cn(
            "fill-muted-foreground text-[9px] font-semibold tracking-[0.25em] transition-opacity duration-500",
            city ? "opacity-0" : "opacity-100"
          )}
        >
          {s.name}
        </text>
      );
    })}

    {/* Businesses visited so far stay as small dots in their color. */}
    {!city &&
      scenes.map((_, n) => {
        if (n === active || !seen.has(n)) return null;
        const p = pinAt(n);
        return <circle key={n} cx={p.x} cy={p.y} r="4" strokeWidth="2" className={cn(toneOf(n).fill, "stroke-card")} />;
      })}

    {/* Pins: the active business's, or every one in the city view (scaled up so they
        stay about the same size on screen). */}
    <AnimatePresence initial={!still}>
      {shown.map((n, k) => (
        <Pin
          key={`${city ? "city" : "one"}-${n}`}
          at={pinAt(n)}
          tone={toneOf(n)}
          size={city ? ZOOM * 0.8 : 1}
          delay={city ? 0.35 + k * 0.08 : 0.2}
          instant={instant}
        />
      ))}
    </AnimatePresence>

    {/* "Your business?": the empty spot, claimed after a beat (already claimed in the
        folding copies, or when flung past). Remounts, so it starts empty each visit. */}
    {city && <YourSpot claimed={still || instant} />}
  </motion.svg>
  );
}

/**
 * "Your business" on the city map: first a dashed pink "?" pin, pulsing gently, tagged
 * "Your business?"; then, at CLAIM_AT, a solid pink pin in the others' style (with their
 * ripple), tagged "Your business".
 */
function YourSpot({ claimed: start }: { claimed: boolean }) {
  const [claimed, setClaimed] = useState(start);
  useEffect(() => {
    if (start) return;
    const t = window.setTimeout(() => setClaimed(true), CLAIM_AT);
    return () => clearTimeout(t);
  }, [start]);
  const at = toMap(YOU.at[0] + 0.5, YOU.at[1] + 0.5);
  // A size up from the other pins, with a tag big enough to read in the zoomed-out view.
  const size = ZOOM * 1.05;
  return (
    <>
      {claimed ? (
        <Pin at={at} tone={paint.brand} size={size} delay={0} instant={start} />
      ) : (
        <motion.g
          transform={`translate(${at.x} ${at.y}) scale(${size})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          <motion.circle
            r="15"
            className="fill-brand"
            animate={{ opacity: [0.06, 0.2, 0.06], scale: [0.85, 1.1, 0.85] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle r="7.5" className="fill-card stroke-brand" strokeWidth="1.6" strokeDasharray="3 2.4" />
          <text y="3.2" textAnchor="middle" className="fill-brand text-[9px] font-bold">
            ?
          </text>
        </motion.g>
      )}
      {/* The tag under the pin, arriving with it */}
      <motion.g
        transform={`translate(${at.x} ${at.y + 17 * size}) scale(${size})`}
        initial={start ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        <rect x="-33" y="-7.5" width="66" height="15" rx="7.5" className={claimed ? "fill-brand" : "fill-card stroke-brand/40"} strokeWidth="1" />
        <text
          y="2.6"
          textAnchor="middle"
          className={cn("text-[7.5px] font-semibold", claimed ? "fill-primary-foreground" : "fill-brand")}
        >
          {claimed ? "Your business" : "Your business?"}
        </text>
      </motion.g>
    </>
  );
}

/** The business and how many homes its route reaches, in the corner. */
function ReachLabel({ industry, reach, instant }: { industry: Industry; reach: string; instant: boolean }) {
  const Icon = icons[industry.icon];
  return (
    <motion.div
      initial={instant ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.3 } }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="absolute top-3 left-3 flex items-center gap-2 rounded-lg border bg-card py-1.5 pr-3 pl-2 shadow-md sm:top-4 sm:left-4 sm:gap-2.5 sm:py-2 sm:pr-3.5 sm:pl-2.5"
    >
      <span className={cn("grid size-6 place-items-center rounded-md bg-muted sm:size-7", paint[industry.tone].text)}>
        <Icon className="size-3.5 sm:size-4" />
      </span>
      <span>
        <span className="block text-[11px] text-muted-foreground sm:text-xs">{industry.postcard.business}</span>
        <span className="block text-xs font-semibold sm:text-sm">{reach}</span>
      </span>
    </motion.div>
  );
}

// The fold, in ms after the city view appears: a beat after the spot is claimed, two
// folds, then the flip into the postcard.
const FOLD = 0.5; // s per fold
const STAGES = [CLAIM_AT + 900, CLAIM_AT + 1450, CLAIM_AT + 2000, CLAIM_AT + 2280];
// Warm paper, a touch darker toward one corner, for the back of the folded map.
const paper = "border bg-[linear-gradient(155deg,var(--card)_35%,color-mix(in_oklab,var(--card)_92%,var(--foreground)))]";
const face = "absolute inset-0 [backface-visibility:hidden]";

/**
 * The finale: over the city view, the map folds in half (left over right), in half again
 * (top down), and the folded square flips over into the "Your business" postcard. Leaving
 * it fades the postcard away and the map comes back.
 */
function FoldFinale({ map, reduce, onStage }: { map: React.ReactNode; reduce: boolean; onStage: (n: number) => void }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const go = (n: number) => {
      setStage(n);
      onStage(n);
    };
    const timers = reduce ? [window.setTimeout(() => go(4), 0)] : STAGES.map((t, k) => window.setTimeout(() => go(k + 1), t));
    return () => {
      timers.forEach(clearTimeout);
      onStage(0);
    };
  }, [reduce, onStage]);

  // A flap's two faces: shade deepens toward the fold, then lifts as it lands.
  const shade = (back: boolean) => (
    <motion.span
      className="absolute inset-0 rounded-[inherit] bg-foreground"
      initial={{ opacity: back ? 0.14 : 0 }}
      animate={{ opacity: back ? 0 : 0.14 }}
      transition={{ duration: FOLD / 2, delay: back ? FOLD / 2 : 0, ease: back ? "easeOut" : "easeIn" }}
    />
  );

  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0, transition: { duration: 0.3 } }}>
      {/* 1. Left half folds over the right, showing the map's plain back. */}
      {stage === 1 && (
        <div aria-hidden className="absolute inset-0 [perspective:1400px]">
          <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden rounded-r-xl border bg-card shadow-lg">
            <div className="absolute inset-y-0 right-0 w-[200%]">{map}</div>
          </div>
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 [transform-style:preserve-3d]"
            style={{ originX: 1 }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: 180 }}
            transition={{ duration: FOLD, ease: "easeInOut" }}
          >
            <div className={cn(face, "overflow-hidden rounded-l-xl border bg-card")}>
              <div className="absolute inset-y-0 left-0 w-[200%]">{map}</div>
              {shade(false)}
            </div>
            <div className={cn(face, "rounded-l-xl [transform:rotateY(180deg)]", paper)}>{shade(true)}</div>
          </motion.div>
        </div>
      )}

      {/* 2. The folded half folds again, top down. */}
      {stage === 2 && (
        <div aria-hidden className="absolute inset-y-0 right-0 w-1/2 [perspective:1400px]">
          <div className={cn("absolute inset-x-0 bottom-0 h-1/2 rounded-br-xl shadow-lg", paper)} />
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2 [transform-style:preserve-3d]"
            style={{ originY: 1 }}
            initial={{ rotateX: 0 }}
            animate={{ rotateX: -180 }}
            transition={{ duration: FOLD, ease: "easeInOut" }}
          >
            <div className={cn(face, "rounded-tr-xl", paper)}>{shade(false)}</div>
            <div className={cn(face, "rounded-br-xl [transform:rotateX(180deg)]", paper)}>{shade(true)}</div>
          </motion.div>
        </div>
      )}

      {/* 3. The folded square turns edge-on… */}
      {stage === 3 && (
        <div aria-hidden className="absolute right-0 bottom-0 h-1/2 w-1/2 [perspective:1400px]">
          <motion.div
            className={cn("absolute inset-0 rounded-xl shadow-lg", paper)}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: 90 }}
            transition={{ duration: 0.28, ease: "easeIn" }}
          />
        </div>
      )}

      {/* 4. …and comes round as the postcard, growing to the middle as it turns. The
          start lines it up with the folded square (quarter size, bottom-right corner). */}
      {stage === 4 && (
        <div className="absolute inset-0 grid place-items-center [perspective:1400px]">
          <motion.div
            className="w-[88%]"
            initial={{ x: "28.4%", y: "33.5%", scaleX: 0.568, scaleY: 0.669, rotateY: -90 }}
            animate={{ x: 0, y: 0, scaleX: 1, scaleY: 1, rotateY: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <CityPostcard />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

/** The back of "Your business"'s postcard: the message and the call to action on the left;
 *  the EDDM postage (stamped on as it lands) and the address on the right. */
function CityPostcard() {
  const { cta } = audiences.overview;
  return (
    <div className="@container grid aspect-[9/6.25] grid-cols-[1.35fr_1fr] overflow-hidden rounded-xl border bg-card shadow-xl">
      <div className="flex flex-col justify-between p-[5.5cqw]">
        <p className="flex items-center gap-[1.6cqw] text-[2.6cqw] font-semibold tracking-[0.18em] text-brand uppercase">
          <span aria-hidden className="size-[2.2cqw] rounded-full bg-brand ring-[0.7cqw] ring-brand/20" />
          {audiences.overview.name}
        </p>
        <div>
          <p className="font-heading text-[4.9cqw] leading-[1.1] font-bold tracking-tight text-balance">{cta.title}</p>
          <p className="mt-[1.5cqw] text-[3.6cqw] text-muted-foreground">{cta.body}</p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href={site.primaryCta.href} />}
          className="w-fit max-sm:h-8 max-sm:px-3 max-sm:text-xs"
        >
          {site.primaryCta.label} <IconArrowRight className="size-4" aria-hidden />
        </Button>
      </div>

      <div aria-hidden className="flex flex-col justify-between border-l border-dashed p-[4.5cqw]">
        <motion.div
          className="ml-auto w-[78%] border border-foreground/70 px-[1.5cqw] py-[1.2cqw] text-center text-[1.9cqw] leading-tight font-semibold tracking-wide text-foreground/80 uppercase"
          initial={{ opacity: 0, scale: 1.6, rotate: -9 }}
          animate={{ opacity: 1, scale: 1, rotate: -3 }}
          transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.55 }}
          onAnimationStart={() => window.setTimeout(() => playKey("press", { gain: 0.5, pitch: 0.8 }), 650)}
        >
          PRSRT STD
          <br />
          ECRWSS
          <br />
          U.S. Postage Paid
          <br />
          EDDM Retail
        </motion.div>
        <div className="space-y-[1.5cqw]">
          <p className="text-[2.6cqw] font-semibold tracking-wide text-foreground/80 uppercase">Local Postal Customer</p>
          <div className="h-[1.2cqw] w-[85%] rounded-full bg-muted" />
          <div className="h-[1.2cqw] w-[60%] rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

/** A business: the hero's dot pin in its color (white ring, soft shadow). It pops in and
 *  sends out one soft ripple, then keeps a faint halo. `size` scales it (the city view). */
function Pin({
  at,
  tone,
  size,
  delay,
  instant,
}: {
  at: { x: number; y: number };
  tone: (typeof paint)[Tone];
  size: number;
  delay: number;
  /** Already landed: no pop, no ripple. */
  instant: boolean;
}) {
  return (
    <motion.g transform={`translate(${at.x} ${at.y}) scale(${size})`} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      <motion.circle
        r="15"
        className={tone.fill}
        initial={instant ? false : { opacity: 0, scale: 0.4 }}
        animate={{ opacity: 0.14, scale: 1 }}
        transition={{ delay: delay + 0.15, duration: 0.45, ease: "easeOut" }}
      />
      <motion.circle
        r="7"
        fill="none"
        className={tone.stroke}
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 1 }}
        animate={instant ? { opacity: 0 } : { opacity: [0, 0.6, 0], scale: [1, 1, 4.2] }}
        transition={{ delay: delay + 0.1, duration: 0.9, times: [0, 0.1, 1], ease: "easeOut" }}
      />
      <motion.circle
        r="6"
        strokeWidth="3"
        className={cn(tone.fill, "stroke-card drop-shadow-[0_1px_2px_rgb(0_0_0/0.3)]")}
        initial={instant ? false : { scale: 0 }}
        animate={{ scale: instant ? 1 : [0, 1.2, 1] }}
        transition={{ delay, duration: 0.35, times: [0, 0.6, 1], ease: "easeOut" }}
      />
    </motion.g>
  );
}
