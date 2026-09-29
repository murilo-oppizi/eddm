"use client";

import { useEffect } from "react";
import {
  IconBarbell,
  IconHomeDollar,
  IconMapPins,
  IconScissors,
  IconShoppingBag,
  IconTool,
  IconToolsKitchen2,
  type TablerIcon,
} from "@tabler/icons-react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

import { StreetGrid, toMap, toPoints } from "@/components/sections/illustrated-map";
import { audiences } from "@/content/site";
import { cn } from "@/lib/utils";

// "Who it's for" as one city: every kind of business has its own neighborhood on the same
// hand-drawn streets as the hero, close enough that each glide passes the last one.
// Picking one glides the camera there; its pin (the hero's dot, in its color) pops in with
// one soft ripple, and the EDDM route it would mail traces along the streets. Kept light
// on purpose, like mapcn's markers and routes: a dot with a white ring and a halo, a fine
// outline over a pale fill. Businesses already visited stay behind as small dots. The last
// step (`active` = the number of businesses) zooms out to the whole city, every business
// and route at once.

type Industry = (typeof audiences.industries)[number];
type Tone = Industry["tone"];
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
const scenes: { at: Step; route: Step[]; name: string; reach: string }[] = [
  { at: [0, 0], name: "WILLIAMSBURG", route: [[-1, -2], [1, -2], [1, -1], [2, -1], [2, 2], [0, 2], [0, 3], [-1, 3]], reach: "1 route · 548 homes" },
  { at: [5, -7], name: "GREENPOINT", route: [[-1, -3], [1, -3], [1, 3], [0, 3], [0, 4], [-1, 4]], reach: "1 route · 612 homes" },
  { at: [-4, 7], name: "FORT GREENE", route: [[0, -2], [2, -2], [2, 1], [1, 1], [1, 3], [-1, 3], [-1, -1], [0, -1]], reach: "1 route · 486 homes" },
  { at: [5, 6], name: "BUSHWICK", route: [[-1, -3], [1, -3], [1, -2], [2, -2], [2, 3], [-1, 3]], reach: "1 route · 734 homes" },
  { at: [-5, -6], name: "DUMBO", route: [[-1, -2], [2, -2], [2, 1], [1, 1], [1, 2], [-1, 2]], reach: "1 route · 529 homes" },
  { at: [0, 13], name: "BED-STUY", route: [[0, -3], [1, -3], [1, -1], [2, -1], [2, 2], [1, 2], [1, 3], [-1, 3], [-1, 0], [0, 0]], reach: "1 route · 657 homes" },
];
const OVERVIEW = scenes.length;

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
};
const toneOf = (n: number) => paint[audiences.industries[n].tone];

const pinAt = (n: number) => toMap(scenes[n].at[0] + 0.5, scenes[n].at[1] + 0.5);
/** Grid units from a scene's origin → the rotated group's coordinates. */
const shift = ([i, j]: Step, [di, dj]: Step): Step => [i + di, j + dj];
const routePath = (n: number) =>
  `M${toPoints(scenes[n].route.map((p) => shift(p, scenes[n].at))).replaceAll(" ", " L")} Z`;

/** The whole city: every route in view, with a margin, at the card's aspect. */
const CITY = (() => {
  const pts = scenes.flatMap((s) => s.route.map(([i, j]) => toMap(i + s.at[0], j + s.at[1])));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const pad = 36;
  const top = 110; // extra room on top for the label in the corner (it takes more of a phone card)
  const bw = Math.max(...xs) - Math.min(...xs) + pad * 2;
  const bh = Math.max(...ys) - Math.min(...ys) + pad + top;
  const w = Math.max(bw, (bh * VIEW.w) / VIEW.h);
  // A touch left of centre, so the top routes clear the label's right edge too.
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2 - w * 0.05;
  const cy = (Math.min(...ys) - top + Math.max(...ys) + pad) / 2;
  return { x: cx - w / 2, y: cy - (w * VIEW.h) / VIEW.w / 2, w };
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
  children,
}: {
  /** A business's index, or the number of businesses for the whole city. */
  active: number;
  /** Businesses already visited: their pins stay on as small dots. */
  seen: Set<number>;
  /** Floats over the map's corner (the postcard). */
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const city = active === OVERVIEW;
  const start = viewFor(active);
  const vx = useMotionValue(start.x);
  const vy = useMotionValue(start.y);
  const vw = useMotionValue(start.w);
  const viewBox = useTransform(() => `${vx.get()} ${vy.get()} ${vw.get()} ${(vw.get() * VIEW.h) / VIEW.w}`);

  // Glide to the chosen neighborhood or out to the city (jump with reduced motion).
  useEffect(() => {
    const to = viewFor(active);
    if (reduce) {
      vx.set(to.x);
      vy.set(to.y);
      vw.set(to.w);
      return;
    }
    const opts = { duration: active === OVERVIEW ? 1.4 : 1.1, ease: glide };
    const anims = [animate(vx, to.x, opts), animate(vy, to.y, opts), animate(vw, to.w, opts)];
    return () => anims.forEach((a) => a.stop());
  }, [active, reduce, vx, vy, vw]);

  const industry = city ? null : audiences.industries[active];
  const Icon = industry ? icons[industry.icon] : IconMapPins;
  const shown = city ? scenes.map((_, n) => n) : [active];

  return (
    <div className="relative" aria-hidden>
      <div className="relative overflow-hidden rounded-xl border bg-card shadow-lg" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
        <motion.svg viewBox={viewBox} className="absolute inset-0 size-full">
          <rect x={-3000} y={-3000} width={6000} height={6000} className="fill-card" />
          <StreetGrid>
            {/* Routes: the active business's, or every one in the city view. Each traces
                along the streets as a fine outline, then takes a pale fill. */}
            <AnimatePresence>
              {shown.map((n, k) => (
                <motion.path
                  key={`${city ? "city" : "one"}-${n}`}
                  d={routePath(n)}
                  className={cn(toneOf(n).soft, toneOf(n).stroke)}
                  // Thicker in the city view, so it reads about the same on screen.
                  strokeWidth={city ? 2 * ZOOM * 0.75 : 2}
                  strokeOpacity="0.85"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, fillOpacity: 0, opacity: 1 }}
                  animate={{ pathLength: 1, fillOpacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  transition={{
                    pathLength: { delay: (city ? 1 : 0.8) + k * 0.12, duration: 0.8, ease: "easeInOut" },
                    fillOpacity: { delay: (city ? 1.5 : 1.3) + k * 0.12, duration: 0.5 },
                  }}
                />
              ))}
            </AnimatePresence>
          </StreetGrid>

          {/* Neighborhood names above each route, like the hero's "WILLIAMSBURG" (hidden
              in the city view, where they'd be too small to read). */}
          {scenes.map((s) => {
            const p = toMap(s.at[0] + 0.5, s.at[1] - 4.2);
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
          <AnimatePresence>
            {shown.map((n, k) => (
              <Pin
                key={`${city ? "city" : "one"}-${n}`}
                at={pinAt(n)}
                tone={toneOf(n)}
                size={city ? ZOOM * 0.8 : 1}
                delay={city ? 0.9 + k * 0.12 : 0.6}
              />
            ))}
          </AnimatePresence>
        </motion.svg>

        {/* The reach, as a label in the hero's style */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 1.1, duration: 0.4 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="absolute top-3 left-3 flex items-center gap-2 rounded-lg border bg-card py-1.5 pr-3 pl-2 shadow-md sm:top-4 sm:left-4 sm:gap-2.5 sm:py-2 sm:pr-3.5 sm:pl-2.5"
          >
            <span
              className={cn(
                "grid size-6 place-items-center rounded-md bg-muted sm:size-7",
                industry ? paint[industry.tone].text : "text-foreground"
              )}
            >
              <Icon className="size-3.5 sm:size-4" />
            </span>
            <span>
              <span className="block text-[11px] text-muted-foreground sm:text-xs">
                {industry ? industry.postcard.business : "Brooklyn, NY"}
              </span>
              <span className="block text-xs font-semibold sm:text-sm">
                {industry ? scenes[active].reach : audiences.overview.reach}
              </span>
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      {children}
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
}: {
  at: { x: number; y: number };
  tone: (typeof paint)[Tone];
  size: number;
  delay: number;
}) {
  return (
    <motion.g transform={`translate(${at.x} ${at.y}) scale(${size})`} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      <motion.circle
        r="15"
        className={tone.fill}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 0.14, scale: 1 }}
        transition={{ delay: delay + 0.15, duration: 0.6, ease: "easeOut" }}
      />
      <motion.circle
        r="7"
        fill="none"
        className={tone.stroke}
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: [0, 0.6, 0], scale: [1, 1, 4.2] }}
        transition={{ delay: delay + 0.1, duration: 1.1, times: [0, 0.1, 1], ease: "easeOut" }}
      />
      <motion.circle
        r="6"
        strokeWidth="3"
        className={cn(tone.fill, "stroke-card drop-shadow-[0_1px_2px_rgb(0_0_0/0.3)]")}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ delay, duration: 0.45, times: [0, 0.6, 1], ease: "easeOut" }}
      />
    </motion.g>
  );
}
