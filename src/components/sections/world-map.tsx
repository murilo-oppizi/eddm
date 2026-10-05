"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";

import { OppiziSymbol } from "@/components/site/logo";
import map from "@/content/world-map.json";
import { cn } from "@/lib/utils";

// A flat dotted world map (the dots drawn ahead of time by scripts/generate-world-map.mjs)
// with a small pink dot in every country Oppizi works in. One big pin stands over a
// country at a time: the one in `focus` (pointed at in the list beside it), otherwise it
// tours them all on its own, every couple of seconds, starting at the Brooklyn
// headquarters. Reduced motion: the pin stays on the headquarters unless one is pointed at.

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
  /** The headquarters: where the tour starts, and its pin shows the Oppizi mark */
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

      {/* Every market: a small pink dot (the one with the pin over it, a ring) */}
      {order.map((id) => (
        <span
          key={id}
          aria-hidden
          style={at(id)}
          className={cn(
            "absolute size-2 -translate-1/2 rounded-full bg-primary ring-2 ring-card transition-transform duration-300",
            id === shown && "scale-150"
          )}
        />
      ))}

      {/* The big pin: drops onto the country, its name under it */}
      <AnimatePresence>
        <motion.div
          key={shown}
          aria-hidden
          style={at(shown)}
          className="absolute"
          initial={{ opacity: 0, y: -14, scale: 0.6 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          {/* The teardrop's point sits on the country */}
          <div className="absolute bottom-1 left-0 -translate-x-1/2">
            <div className="relative grid size-11 place-items-center rounded-full rounded-br-none bg-card shadow-[0_6px_16px_-4px_rgb(0_0_0/0.3),0_0_0_1px_rgb(0_0_0/0.05)] [rotate:45deg]">
              <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground [rotate:-45deg]">
                {shown === hub ? (
                  <OppiziSymbol cropped className="h-2.5 w-auto" />
                ) : (
                  <span className="text-[11px] font-bold tracking-wide">{shown}</span>
                )}
              </span>
            </div>
          </div>
          <span className={cn("absolute top-2 left-0 rounded-full", nameAlign, "bg-card/90 px-2 py-0.5 text-xs font-semibold whitespace-nowrap shadow-sm ring-1 ring-border backdrop-blur-sm")}>
            {shown === hub ? `${names[shown]} · HQ` : names[shown]}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
