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

import { AVENUE_GAP, STREET_GAP, StreetGrid, toMap, toPoints } from "@/components/sections/illustrated-map";
import { audiences } from "@/content/site";
import { cn } from "@/lib/utils";

// "Who it's for" as one city: every kind of business has its own neighborhood on the same
// hand-drawn streets as the hero. Picking one glides the camera there, drops its pin in
// its color, traces the EDDM routes it would mail, and lights up the homes they reach in
// a wave from the pin. Businesses already visited stay behind as small dots. Its postcard
// floats in the corner, like the cards over the hero's map.

type Industry = (typeof audiences.industries)[number];
type Step = [number, number];

/** The camera's window, in map units. The card keeps this aspect. */
const VIEW = { w: 440, h: 360 };
/** Where the business sits in the window (fractions), leaving the corner for the postcard. */
const FOCUS = { x: 0.4, y: 0.5 };
const glide = [0.65, 0, 0.35, 1] as const;

/**
 * Each business: where it is (grid block), its routes (street-following outlines, in grid
 * units from that block), and the reach shown on its label. Placeholder numbers.
 */
const scenes: { at: Step; routes: Step[][]; reach: string }[] = [
  // Café: its own blocks plus two small routes either side — delivery distance.
  {
    at: [0, 0],
    routes: [
      [[-1, -2], [2, -2], [2, 3], [-1, 3]],
      [[2, -1], [3, -1], [3, 2], [2, 2]],
      [[-2, 0], [-1, 0], [-1, 3], [-2, 3]],
    ],
    reach: "3 routes · 1,284 homes",
  },
  // Realtor: one big farm area that follows the streets.
  {
    at: [6, -10],
    routes: [[[-2, -3], [1, -3], [1, -2], [2, -2], [2, 3], [0, 3], [0, 4], [-2, 4]]],
    reach: "1 route · 846 homes",
  },
  // Salon: two routes side by side.
  {
    at: [-6, 9],
    routes: [
      [[-1, -2], [1, -2], [1, 2], [-1, 2]],
      [[1, -1], [3, -1], [3, 2], [1, 2]],
    ],
    reach: "2 routes · 1,012 homes",
  },
  // Home services: three routes of homeowners.
  {
    at: [8, 8],
    routes: [
      [[-2, -3], [0, -3], [0, 0], [-2, 0]],
      [[0, -2], [2, -2], [2, 3], [0, 3]],
      [[-2, 1], [0, 1], [0, 4], [-2, 4]],
    ],
    reach: "3 routes · 1,530 homes",
  },
  // Gym: a wide block of the neighborhood around the new location.
  {
    at: [-8, -8],
    routes: [[[-1, -3], [2, -3], [2, 3], [-1, 3]]],
    reach: "1 route · 972 homes",
  },
  // Store: a stepped route toward the main street.
  {
    at: [2, 18],
    routes: [[[-2, -2], [0, -2], [0, -1], [2, -1], [2, 2], [1, 2], [1, 3], [-2, 3]]],
    reach: "1 route · 1,106 homes",
  },
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
  brand: { fill: "fill-brand", soft: "fill-brand/15", stroke: "stroke-brand", text: "text-brand" },
  info: { fill: "fill-info", soft: "fill-info/15", stroke: "stroke-info", text: "text-info" },
  success: { fill: "fill-success", soft: "fill-success/15", stroke: "stroke-success", text: "text-success" },
  warning: { fill: "fill-warning", soft: "fill-warning/15", stroke: "stroke-warning", text: "text-warning" },
  ai: { fill: "fill-ai", soft: "fill-ai/15", stroke: "stroke-ai", text: "text-ai" },
};

/** Ray casting: is (x, y) inside the polygon? Grid units. */
function inside([x, y]: Step, poly: Step[]) {
  let hit = false;
  for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
    const [xa, ya] = poly[a];
    const [xb, yb] = poly[b];
    if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) hit = !hit;
  }
  return hit;
}

/** The homes a scene reaches: three dots along each block inside its routes, each with
 *  its distance from the business (for the wave). In grid units from the scene's origin. */
function homesOf(routes: Step[][]) {
  const blocks = new Map<string, Step>();
  for (const poly of routes) {
    const is = poly.map(([i]) => i);
    const js = poly.map(([, j]) => j);
    for (let i = Math.min(...is); i < Math.max(...is); i++)
      for (let j = Math.min(...js); j < Math.max(...js); j++)
        if (inside([i + 0.5, j + 0.5], poly)) blocks.set(`${i},${j}`, [i, j]);
  }
  return [...blocks.values()].flatMap(([i, j]) =>
    [0.22, 0.5, 0.78].map((f) => ({ i: i + f, j: j + 0.5, d: Math.hypot(i + f - 0.5, (j + 0.5 - 0.5) * 0.45) }))
  );
}
const homes = scenes.map((s) => homesOf(s.routes));

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
            {/* The active scene: its routes trace along the streets, then fill; its homes
                light up in a wave from the business. Swapped as a whole. */}
            <AnimatePresence>
              <motion.g
                key={active}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
              >
                {scene.routes.map((poly, r) => (
                  <motion.path
                    key={r}
                    d={`M${toPoints(poly.map((p) => shift(p, scene.at))).replaceAll(" ", " L")} Z`}
                    className={cn(tone.soft, tone.stroke)}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, fillOpacity: 0 }}
                    animate={{ pathLength: 1, fillOpacity: 1 }}
                    transition={{
                      pathLength: { delay: 0.75 + r * 0.15, duration: 0.7, ease: "easeInOut" },
                      fillOpacity: { delay: 1.2 + r * 0.15, duration: 0.5 },
                    }}
                  />
                ))}
                {homes[active].map((h, k) => (
                  <circle
                    key={k}
                    cx={(h.i + scene.at[0]) * AVENUE_GAP}
                    cy={(h.j + scene.at[1]) * STREET_GAP}
                    r="2.2"
                    className={cn(
                      tone.fill,
                      "origin-center transform-fill animate-in fade-in zoom-in-0 animation-duration-300 motion-reduce:animate-none"
                    )}
                    // Fill mode inline: as a class, cn() would drop it as a clash with the fill color.
                    style={{ animationDelay: `${1.25 + h.d * 0.12}s`, animationFillMode: "both" }}
                  />
                ))}
              </motion.g>
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
                r="4.5"
                strokeWidth="2"
                className={cn(paint[audiences.industries[n].tone].fill, "stroke-card")}
              />
            );
          })}

          {/* The business: a pin in its color that drops onto its block. */}
          <AnimatePresence>
            <Pin key={active} at={toMap(scene.at[0] + 0.5, scene.at[1] + 0.5)} Icon={Icon} tone={tone} />
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

/** A map pin in the business's color with its icon, dropping in with a little squash. */
function Pin({ at, Icon, tone }: { at: { x: number; y: number }; Icon: TablerIcon; tone: (typeof paint)[keyof typeof paint] }) {
  return (
    <g transform={`translate(${at.x} ${at.y}) scale(1.35)`}>
      {/* Its shadow on the street, which firms up as the pin lands */}
      <motion.ellipse
        rx="7"
        ry="2.5"
        className="fill-foreground/20"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.55, duration: 0.35 }}
      />
      <motion.g
        style={{ originX: 0.5, originY: 1 }}
        initial={{ y: -26, opacity: 0, scaleX: 1, scaleY: 1 }}
        animate={{ y: [-26, 0, 0, 0], opacity: 1, scaleX: [1, 1, 1.14, 1], scaleY: [1, 1, 0.84, 1] }}
        exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.25 } }}
        transition={{ delay: 0.5, duration: 0.55, times: [0, 0.55, 0.75, 1], ease: "easeOut", opacity: { delay: 0.5, duration: 0.15 } }}
      >
        {/* Teardrop, tip at 0,0 */}
        <path
          d="M0 0 C -2 -6, -11 -11, -11 -20 A 11 11 0 1 1 11 -20 C 11 -11, 2 -6, 0 0 Z"
          className={cn(tone.fill, "stroke-card")}
          strokeWidth="2"
        />
        <circle cy="-20" r="7.5" className="fill-card" />
        <Icon x={-5} y={-25} width={10} height={10} strokeWidth={2.4} className={tone.text} />
      </motion.g>
    </g>
  );
}
