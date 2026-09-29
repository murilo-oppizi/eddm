"use client";

import { useEffect } from "react";
import {
  IconBarbell,
  IconHomeDollar,
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
// hand-drawn streets as the hero. Picking one glides the camera there; its pin (the
// hero's dot, in its color) pops in with one soft ripple, and the EDDM route it would mail
// traces along the streets. Kept light on purpose, like mapcn's markers and routes: a
// dot with a white ring and a halo, a fine outline over a pale fill. Businesses already
// visited stay behind as small dots. Its postcard floats in the corner, like the cards
// over the hero's map.

type Industry = (typeof audiences.industries)[number];
type Step = [number, number];

/** The camera's window, in map units. The card keeps this aspect. */
const VIEW = { w: 440, h: 360 };
/** Where the business sits in the window (fractions), leaving the corner for the postcard. */
const FOCUS = { x: 0.4, y: 0.5 };
const glide = [0.65, 0, 0.35, 1] as const;

/**
 * Each business: its block, the one route it mails (a street-following outline in grid
 * units from that block, about the size of the hero's), and the reach on its label.
 * Placeholder numbers.
 */
const scenes: { at: Step; route: Step[]; reach: string }[] = [
  { at: [0, 0], route: [[-1, -2], [1, -2], [1, -1], [2, -1], [2, 2], [0, 2], [0, 3], [-1, 3]], reach: "1 route · 548 homes" },
  { at: [6, -10], route: [[-1, -3], [1, -3], [1, 3], [0, 3], [0, 4], [-1, 4]], reach: "1 route · 612 homes" },
  { at: [-6, 9], route: [[0, -2], [2, -2], [2, 1], [1, 1], [1, 3], [-1, 3], [-1, -1], [0, -1]], reach: "1 route · 486 homes" },
  { at: [8, 8], route: [[-1, -3], [1, -3], [1, -2], [2, -2], [2, 3], [-1, 3]], reach: "1 route · 734 homes" },
  { at: [-8, -8], route: [[-1, -2], [2, -2], [2, 1], [1, 1], [1, 2], [-1, 2]], reach: "1 route · 529 homes" },
  { at: [2, 18], route: [[0, -3], [1, -3], [1, -1], [2, -1], [2, 2], [1, 2], [1, 3], [-1, 3], [-1, 0], [0, 0]], reach: "1 route · 657 homes" },
];

const icons: Record<Industry["icon"], TablerIcon> = {
  restaurant: IconToolsKitchen2,
  realEstate: IconHomeDollar,
  salon: IconScissors,
  homeServices: IconTool,
  gym: IconBarbell,
  retail: IconShoppingBag,
};

// SVG paint per tone (written out in full so Tailwind generates each class).
const paint: Record<Industry["tone"], { fill: string; soft: string; stroke: string; text: string }> = {
  brand: { fill: "fill-brand", soft: "fill-brand/10", stroke: "stroke-brand", text: "text-brand" },
  info: { fill: "fill-info", soft: "fill-info/10", stroke: "stroke-info", text: "text-info" },
  success: { fill: "fill-success", soft: "fill-success/10", stroke: "stroke-success", text: "text-success" },
  warning: { fill: "fill-warning", soft: "fill-warning/10", stroke: "stroke-warning", text: "text-warning" },
  ai: { fill: "fill-ai", soft: "fill-ai/10", stroke: "stroke-ai", text: "text-ai" },
};

/** Where the camera looks to put scene `n`'s business at FOCUS. */
function viewFor(n: number) {
  const [i, j] = scenes[n].at;
  const p = toMap(i + 0.5, j + 0.5);
  return { x: p.x - VIEW.w * FOCUS.x, y: p.y - VIEW.h * FOCUS.y };
}

/** Grid units from a scene's origin → the rotated group's coordinates. */
const shift = ([i, j]: Step, [di, dj]: Step): Step => [i + di, j + dj];

export function NeighborhoodMap({
  active,
  seen,
  children,
}: {
  active: number;
  /** Scenes already visited: their pins stay on as small dots. */
  seen: Set<number>;
  /** Floats over the map's corner (the postcard). */
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const start = viewFor(active);
  const vx = useMotionValue(start.x);
  const vy = useMotionValue(start.y);
  const viewBox = useTransform(() => `${vx.get()} ${vy.get()} ${VIEW.w} ${VIEW.h}`);

  // Glide to the chosen neighborhood (jump there with reduced motion).
  useEffect(() => {
    const to = viewFor(active);
    if (reduce) {
      vx.set(to.x);
      vy.set(to.y);
      return;
    }
    const opts = { duration: 1.1, ease: glide };
    const ax = animate(vx, to.x, opts);
    const ay = animate(vy, to.y, opts);
    return () => {
      ax.stop();
      ay.stop();
    };
  }, [active, reduce, vx, vy]);

  const industry = audiences.industries[active];
  const scene = scenes[active];
  const Icon = icons[industry.icon];
  const tone = paint[industry.tone];

  return (
    <div className="relative" aria-hidden>
      <div className="relative overflow-hidden rounded-xl border bg-card shadow-lg" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
        <motion.svg viewBox={viewBox} className="absolute inset-0 size-full">
          <rect x={-2000} y={-2000} width={4000} height={4000} className="fill-card" />
          <StreetGrid>
            {/* The active business's route: a fine outline that traces along the streets,
                then a pale fill. Swapped as a whole. */}
            <AnimatePresence>
              <motion.path
                key={active}
                d={`M${toPoints(scene.route.map((p) => shift(p, scene.at))).replaceAll(" ", " L")} Z`}
                className={cn(tone.soft, tone.stroke)}
                strokeWidth="2"
                strokeOpacity="0.85"
                strokeLinejoin="round"
                initial={{ pathLength: 0, fillOpacity: 0, opacity: 1 }}
                animate={{ pathLength: 1, fillOpacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                transition={{
                  pathLength: { delay: 0.8, duration: 0.8, ease: "easeInOut" },
                  fillOpacity: { delay: 1.3, duration: 0.5 },
                }}
              />
            </AnimatePresence>
          </StreetGrid>

          {/* Every business visited so far stays as a small dot in its color. */}
          {scenes.map((s, n) => {
            if (n === active || !seen.has(n)) return null;
            const p = toMap(s.at[0] + 0.5, s.at[1] + 0.5);
            return (
              <circle
                key={n}
                cx={p.x}
                cy={p.y}
                r="4"
                strokeWidth="2"
                className={cn(paint[audiences.industries[n].tone].fill, "stroke-card")}
              />
            );
          })}

          {/* The business: a pin in its color that drops onto its block. */}
          <AnimatePresence>
            <Pin key={active} at={toMap(scene.at[0] + 0.5, scene.at[1] + 0.5)} tone={tone} />
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
            <span className={cn("grid size-6 place-items-center rounded-md bg-muted sm:size-7", tone.text)}>
              <Icon className="size-3.5 sm:size-4" />
            </span>
            <span>
              <span className="block text-[11px] text-muted-foreground sm:text-xs">{industry.postcard.business}</span>
              <span className="block text-xs font-semibold sm:text-sm">{scene.reach}</span>
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      {children}
    </div>
  );
}

/** The business: the hero's dot pin in its color (white ring, soft shadow). It pops in
 *  and sends out one soft ripple, then keeps a faint halo. */
function Pin({ at, tone }: { at: { x: number; y: number }; tone: (typeof paint)[keyof typeof paint] }) {
  return (
    <motion.g transform={`translate(${at.x} ${at.y})`} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      <motion.circle
        r="15"
        className={tone.fill}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 0.14, scale: 1 }}
        transition={{ delay: 0.75, duration: 0.6, ease: "easeOut" }}
      />
      <motion.circle
        r="7"
        fill="none"
        className={tone.stroke}
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: [0, 0.6, 0], scale: [1, 1, 4.2] }}
        transition={{ delay: 0.7, duration: 1.1, times: [0, 0.1, 1], ease: "easeOut" }}
      />
      <motion.circle
        r="6"
        strokeWidth="3"
        className={cn(tone.fill, "stroke-card drop-shadow-[0_1px_2px_rgb(0_0_0/0.3)]")}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ delay: 0.6, duration: 0.45, times: [0, 0.6, 1], ease: "easeOut" }}
      />
    </motion.g>
  );
}
