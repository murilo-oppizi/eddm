// Hand-drawn, stylised street map for the hero composition — a Brooklyn-like grid
// with the selection (a carrier route, or a radius) highlighted. Drawn from scratch (not traced from map data),
// so it needs no attribution or tile licence, and it's inline SVG: nothing to download,
// sharp at any size.
//
// Coordinates are the map card's design pixels (400×440 by default; see `width`). Everything street-related
// lives in one group rotated like Williamsburg's grid, centred on the route, so the
// route outline can sit exactly on street centrelines.

import { useId } from "react";

import { cn } from "@/lib/utils";

const W = 400;
const H = 440;
export const MAP_H = H;
/** Route centre in the card — the composition's pin sits here. */
export const ROUTE_CENTER = { x: 170, y: 238 };

const GRID_ANGLE = -28; // degrees, roughly Williamsburg's street grid
export const AVENUE_GAP = 44; // centreline to centreline
export const STREET_GAP = 20;
const STREET_W = 4;
// Blocks each side of centre: enough for the widest card, and for the "Who it's for"
// map, which pans across several neighborhoods. (It's one pattern-filled rect, so size is free.)
const COLS = 18;
const ROWS = 40;

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

/**
 * The AI's pick: a different set of blocks around the same pin — it drops the thin
 * top and bottom tails and takes a wider stretch in the middle, still on street
 * centrelines.
 */
const AI_ROUTE_STEPS: [number, number][] = [
  [-2, -1], [-1, -1], [-1, -2], [1, -2], [1, -1], [2, -1], [2, 1], [1, 1], [1, 2], [-1, 2], [-1, 1], [-2, 1],
];

/**
 * Three separate routes ranked by the AI (the "Find routes" answer), left to right
 * across the map, in grid units like ROUTE_STEPS. The middle one is the best match.
 */
const RANKED_ROUTES: [number, number][][] = [
  [[1, 0], [3, 0], [3, 4], [2, 4], [2, 5], [1, 5]],
  [[-2, -3], [0, -3], [0, 1], [-1, 1], [-1, 0], [-2, 0]],
  [[4, 3], [6, 3], [6, 6], [5, 6], [5, 7], [4, 7]],
];

/** Where a point in grid units lands on the map (the grid is rotated around ROUTE_CENTER). */
export function toMap(i: number, j: number) {
  const a = (GRID_ANGLE * Math.PI) / 180;
  const u = i * AVENUE_GAP;
  const v = j * STREET_GAP;
  return { x: ROUTE_CENTER.x + u * Math.cos(a) - v * Math.sin(a), y: ROUTE_CENTER.y + u * Math.sin(a) + v * Math.cos(a) };
}

/** The middle of a route's bounding box, in grid units. */
function middleOf(steps: [number, number][]) {
  const is = steps.map(([i]) => i);
  const js = steps.map(([, j]) => j);
  return toMap((Math.min(...is) + Math.max(...is)) / 2, (Math.min(...js) + Math.max(...js)) / 2);
}

/** The middle of the ranked routes, for framing a view around them. */
export const RANKED_FOCUS = (() => {
  const pts = RANKED_ROUTES.flat().map(([i, j]) => toMap(i, j));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
})();

export const toPoints = (steps: [number, number][]) =>
  steps.map(([i, j]) => `${i * AVENUE_GAP},${j * STREET_GAP}`).join(" ");
const routePoints = toPoints(ROUTE_STEPS);
const aiRoutePoints = toPoints(AI_ROUTE_STEPS);

const selectionClass =
  "fill-primary/20 stroke-primary transition-[opacity,scale] duration-300 ease-out transform-fill origin-center motion-reduce:transition-none";

/** A block's rectangle, for the block whose top-left street corner is at avenue i, street j. */
function blockAt(i: number, j: number) {
  const major = isMajorAvenue(i) ? 1.5 : 0; // wide avenues eat a little into the block
  return {
    x: i * AVENUE_GAP + STREET_W / 2 + major,
    y: j * STREET_GAP + STREET_W / 2,
    width: AVENUE_GAP - STREET_W - major,
    height: STREET_GAP - STREET_W,
  };
}

// The blocks repeat every three avenues (one of them wide), so they're drawn as one SVG
// pattern tile instead of ~800 separate rectangles per map. Parks are drawn on top.
const TILE = { w: 3 * AVENUE_GAP, h: STREET_GAP };
const tileBlocks = [0, 1, 2].map((i) => blockAt(i, 0));
const GRID = { x: -COLS * AVENUE_GAP, y: -ROWS * STREET_GAP, w: 2 * COLS * AVENUE_GAP, h: 2 * ROWS * STREET_GAP };
const parks = [...PARK].map((key) => {
  const [i, j] = key.split(",").map(Number);
  return blockAt(i, j);
});

/**
 * The streets themselves: blocks, parks and a Broadway-like diagonal, in a group rotated
 * like the grid. `children` draw inside that group, in grid units × gaps (avenue i,
 * street j is at i × AVENUE_GAP, j × STREET_GAP), so overlays can sit on the streets.
 */
export function StreetGrid({ children }: { children?: React.ReactNode }) {
  const blocksId = `${useId()}blocks`;
  return (
    <g transform={`translate(${ROUTE_CENTER.x} ${ROUTE_CENTER.y}) rotate(${GRID_ANGLE})`}>
      {/* The pattern tile starts on a wide avenue (i = 0), so it lines up with the grid. */}
      <defs>
        <pattern id={blocksId} width={TILE.w} height={TILE.h} patternUnits="userSpaceOnUse">
          {tileBlocks.map((b) => (
            <rect key={b.x} {...b} rx="1.5" className="fill-subtle/70" />
          ))}
        </pattern>
      </defs>
      <rect {...{ x: GRID.x, y: GRID.y, width: GRID.w, height: GRID.h }} fill={`url(#${blocksId})`} />
      {parks.map((b) => (
        <rect key={`${b.x},${b.y}`} {...b} rx="1.5" className="fill-success-subtle" />
      ))}

      {/* A diagonal like Broadway, cutting across the grid */}
      <line x1={-840} y1={450} x2={840} y2={-310} className="stroke-card" strokeWidth="8" />
      {children}
    </g>
  );
}

export type SelectionMode = "route" | "area";

/** Radius of the "Area" selection, sized to cover about the same ground as the route. */
const AREA_RADIUS = 74;

/** `thinking`: the selection breathes while the AI is working on it.
 *  `optimized`: show the AI's route instead of the original one. */
export function IllustratedMap({
  mode,
  thinking = false,
  optimized = false,
  cover = false,
  width = W,
  ranked,
  label = "WILLIAMSBURG",
  view,
}: {
  mode: SelectionMode;
  thinking?: boolean;
  optimized?: boolean;
  /** Fill the box and crop the edges (like object-fit: cover) instead of letterboxing. */
  cover?: boolean;
  /** Design width of the map. Wider maps show more streets to the right; the route
   *  and pin stay put, since they're positioned from the left. */
  width?: number;
  /** Show the AI's ranked routes (with a match pill each) instead of the selection.
   *  Each fades in when `visible`. */
  ranked?: { match: string; visible: boolean }[];
  /** The neighborhood name on the map; null for none. */
  label?: string | null;
  /** Show this window of the map (in map units) instead of 0,0 → width × 440. */
  view?: { x: number; y: number; w: number; h: number };
}) {
  const route = mode === "route";
  return (
    <svg
      viewBox={view ? `${view.x} ${view.y} ${view.w} ${view.h}` : `0 0 ${width} ${H}`}
      preserveAspectRatio={cover ? "xMidYMid slice" : undefined}
      className="absolute inset-0 size-full"
      aria-hidden
    >
      {/* Streets are the background; blocks are drawn on top with gaps between them. */}
      <rect
        x={view?.x ?? 0}
        y={view?.y ?? 0}
        width={view?.w ?? width}
        height={view?.h ?? H}
        className="fill-card"
      />

      <StreetGrid>
        {/* The AI's ranked routes, in order */}
        {ranked?.map((r, i) => (
          <polygon
            key={i}
            points={toPoints(RANKED_ROUTES[i])}
            className={cn(selectionClass, "duration-500", r.visible ? "opacity-100" : "scale-90 opacity-0")}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ))}

        {/* The selection: a street-following route (original or the AI's pick), or a
            radius around the pin. All stay mounted and cross-fade, so switching is smooth. */}
        {!ranked && (
          <>
            <polygon
              points={routePoints}
              className={cn(
                selectionClass,
                route && !optimized ? (thinking ? "animate-pulse" : "opacity-100") : "scale-90 opacity-0"
              )}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <polygon
              points={aiRoutePoints}
              className={cn(selectionClass, "duration-500", route && optimized ? "opacity-100" : "scale-90 opacity-0")}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle
              r={AREA_RADIUS}
              className={cn(selectionClass, mode === "area" ? (thinking ? "animate-pulse" : "opacity-100") : "scale-75 opacity-0")}
              strokeWidth="2.5"
              strokeDasharray="7 5"
            />
          </>
        )}
      </StreetGrid>

      {/* Match pills on the ranked routes, drawn upright over the rotated grid */}
      {ranked?.map((r, i) => {
        const { x, y } = middleOf(RANKED_ROUTES[i]);
        return (
          <g
            key={i}
            className={cn("transition-opacity duration-500 motion-reduce:transition-none", r.visible ? "opacity-100" : "opacity-0")}
          >
            <rect x={x - 22} y={y - 12} width="44" height="24" rx="12" className="fill-primary" />
            <text x={x} y={y + 4.5} textAnchor="middle" className="fill-primary-foreground text-[13px] font-semibold">
              {r.match}
            </text>
          </g>
        );
      })}

      {/* Kept clear of the toolbar, the route label and the Selected routes card. */}
      {label && (
        <text x="150" y="104" textAnchor="middle" className="fill-muted-foreground text-[10px] font-semibold tracking-[0.25em]">
          {label}
        </text>
      )}
    </svg>
  );
}
