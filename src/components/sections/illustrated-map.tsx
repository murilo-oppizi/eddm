// Hand-drawn, stylised street map for the hero composition — a Brooklyn-like grid
// with the selection (a carrier route, or a radius) highlighted. Drawn from scratch (not traced from map data),
// so it needs no attribution or tile licence, and it's inline SVG: nothing to download,
// sharp at any size.
//
// Coordinates are the map card's design pixels (400×440). Everything street-related
// lives in one group rotated like Williamsburg's grid, centred on the route, so the
// route outline can sit exactly on street centrelines.

import { cn } from "@/lib/utils";

const W = 400;
const H = 440;
/** Route centre in the card — the composition's pin sits here. */
export const ROUTE_CENTER = { x: 170, y: 238 };

const GRID_ANGLE = -28; // degrees, roughly Williamsburg's street grid
const AVENUE_GAP = 44; // centreline to centreline
const STREET_GAP = 20;
const STREET_W = 4;
const COLS = 10; // blocks each side of centre — enough to cover the card when rotated
const ROWS = 19;

/** Every third avenue is a wide one, like Bedford or Driggs. */
const isMajorAvenue = (i: number) => i % 3 === 0;

/** Blocks drawn as park instead of buildings. [col, row] of each block's top-left corner. */
// Picked to land in the visible area left of the route.
const PARK = new Set(["-3,-2", "-3,-1", "-3,0", "-3,1"]);

/**
 * The route: a stepped outline along street centrelines, in grid units
 * (avenues across, streets down) around the centre — the way real carrier routes
 * follow the streets rather than cutting across blocks. Symmetric around 0,0 so its
 * centre lands on ROUTE_CENTER, under the pin.
 */
const ROUTE_STEPS: [number, number][] = [
  [-1, -2], [0, -2], [0, -3], [1, -3], [1, 2], [0, 2], [0, 3], [-1, 3],
];

const routePoints = ROUTE_STEPS.map(([i, j]) => `${i * AVENUE_GAP},${j * STREET_GAP}`).join(" ");

const selectionClass =
  "fill-primary/20 stroke-primary transition-[opacity,scale] duration-300 ease-out transform-fill origin-center motion-reduce:transition-none";

const blocks: { x: number; y: number; park: boolean }[] = [];
for (let i = -COLS; i < COLS; i++) {
  for (let j = -ROWS; j < ROWS; j++) {
    blocks.push({ x: i * AVENUE_GAP, y: j * STREET_GAP, park: PARK.has(`${i},${j}`) });
  }
}

export type SelectionMode = "route" | "area";

/** Radius of the "Area" selection, sized to cover about the same ground as the route. */
const AREA_RADIUS = 74;

/** `thinking`: the selection breathes while the AI is working on it. */
export function IllustratedMap({ mode, thinking = false }: { mode: SelectionMode; thinking?: boolean }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden>
      {/* Streets are the background; blocks are drawn on top with gaps between them. */}
      <rect width={W} height={H} className="fill-card" />

      <g transform={`translate(${ROUTE_CENTER.x} ${ROUTE_CENTER.y}) rotate(${GRID_ANGLE})`}>
        {blocks.map(({ x, y, park }) => (
          <rect
            key={`${x},${y}`}
            x={x + STREET_W / 2 + (isMajorAvenue(x / AVENUE_GAP) ? 1.5 : 0)}
            y={y + STREET_W / 2}
            width={AVENUE_GAP - STREET_W - (isMajorAvenue(x / AVENUE_GAP) ? 1.5 : 0)}
            height={STREET_GAP - STREET_W}
            rx="1.5"
            className={park ? "fill-success-subtle" : "fill-subtle"}
          />
        ))}

        {/* A diagonal like Broadway, cutting across the grid */}
        <line x1={-420} y1={260} x2={420} y2={-120} className="stroke-card" strokeWidth="8" />

        {/* The selection: a street-following route, or a radius around the pin. Both stay
            mounted and cross-fade, so switching modes is smooth. */}
        <polygon
          points={routePoints}
          className={cn(selectionClass, mode === "route" ? (thinking ? "animate-pulse" : "opacity-100") : "scale-90 opacity-0")}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle
          r={AREA_RADIUS}
          className={cn(selectionClass, mode === "area" ? "opacity-100" : "scale-75 opacity-0")}
          strokeWidth="2.5"
          strokeDasharray="7 5"
        />
      </g>

      {/* Kept clear of the toolbar, the route label and the Selected routes card. */}
      <text x="150" y="104" textAnchor="middle" className="fill-muted-foreground text-[10px] font-semibold tracking-[0.25em]">
        WILLIAMSBURG
      </text>
    </svg>
  );
}
