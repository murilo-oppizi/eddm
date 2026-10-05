"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";

import { flags } from "@/components/sections/flags";
import map from "@/content/world-map.json";
import { cn } from "@/lib/utils";

// A flat dotted world map (the dots drawn ahead of time by scripts/generate-world-map.mjs)
// with a small pink dot in every country Oppizi works in. One dot at a time grows into a
// round flag, right where the dot is, with the country's name under it: the one in
// `focus` (pointed at in the list beside it), otherwise it tours them all on its own,
// every couple of seconds, starting at the Brooklyn headquarters. Reduced motion: it
// stays on the headquarters unless one is pointed at.

const PINS: Record<string, number[]> = map.pins;
const TOUR_MS = 2200;

export function WorldMap({
  order,
  hub,
  focus,
  names,
  className,
}: {
  /** The countries, in the order the pin tours them */
  order: string[];
  /** The headquarters: where the tour starts (its name says HQ) */
  hub: string;
  focus: string | null;
  names: Record<string, string>;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const onScreen = useInView(root, { amount: 0.4 });
  const [tour, setTour] = useState(0);

  useEffect(() => {
    if (reduce || focus || !onScreen) return;
    const t = setInterval(() => setTour((i) => (i + 1) % order.length), TOUR_MS);
    return () => clearInterval(t);
  }, [reduce, focus, onScreen, order.length]);

  const shown = focus ?? (reduce ? hub : order[tour]);
  // Near the map's sides, the name hangs inward so it stays inside the tile
  const side = PINS[shown][0] / map.width;
  const nameAlign = side > 0.85 ? "-translate-x-[85%]" : side < 0.15 ? "-translate-x-[15%]" : "-translate-x-1/2";
  const at = (id: string) => {
    const [x, y] = PINS[id];
    return { left: `${(x / map.width) * 100}%`, top: `${(y / map.height) * 100}%` };
  };

  return (
    <div ref={root} className={cn("relative", className)} style={{ aspectRatio: `${map.width} / ${map.height}` }}>
      {/* The land: one dot per cell */}
      <svg aria-hidden viewBox={`0 0 ${map.width} ${map.height}`} className="absolute inset-0 size-full">
        <g className="fill-muted-foreground/35">
          {map.points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={0.22} />
          ))}
        </g>
      </svg>

      {/* Every market: a small pink dot */}
      {order.map((id) => (
        <span
          key={id}
          aria-hidden
          style={at(id)}
          className="absolute size-2 -translate-1/2 rounded-full bg-primary ring-2 ring-card"
        />
      ))}

      {/* The one in view: its dot grows into a round flag, centered on the same spot, with
          a soft pink ring pulsing out of it and the name under it */}
      <AnimatePresence mode="wait">
        <motion.div
          key={shown}
          aria-hidden
          style={at(shown)}
          className="absolute"
          exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.18 } }}
        >
          <motion.span
            className="absolute -translate-1/2 rounded-full bg-primary/25"
            initial={{ width: 8, height: 8, opacity: 0 }}
            animate={{ width: [8, 56], height: [8, 56], opacity: [0.8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
          />
          <motion.span
            className="absolute grid size-8 -translate-1/2 place-items-center overflow-hidden rounded-full bg-card shadow-[0_4px_12px_-2px_rgb(0_0_0/0.3)] ring-2 ring-card"
            initial={{ scale: 0.25 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 20 }}
          >
            <Flag id={shown} className="size-full" />
          </motion.span>
          <motion.span
            className={cn(
              "absolute top-5 left-0 rounded-full bg-card/90 px-2 py-0.5 text-xs font-semibold whitespace-nowrap shadow-sm ring-1 ring-border backdrop-blur-sm",
              nameAlign
            )}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {shown === hub ? `${names[shown]} · HQ` : names[shown]}
          </motion.span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** A country's flag, square (crop it round with its container). */
export function Flag({ id, className }: { id: string; className?: string }) {
  const Svg = flags[id];
  return Svg ? <Svg aria-hidden className={className} /> : null;
}
