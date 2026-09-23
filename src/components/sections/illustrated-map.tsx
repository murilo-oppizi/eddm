// Hand-drawn, stylised street map for the hero composition — a Brooklyn-like grid
// with the selection (a carrier route, or a radius) highlighted. Drawn from scratch (not traced from map data),
// so it needs no attribution or tile licence, and it's inline SVG: nothing to download,
// sharp at any size.
//
// Coordinates are the map card's design pixels (400×440 by default; see `width`). Everything street-related
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
const COLS = 11; // blocks each side of centre — enough to cover the widest card when rotated
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
function toMap(i: number, j: number) {
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

const toPoints = (steps: [number, number][]) =>
  steps.map(([i, j]) => `${i * AVENUE_GAP},${j * STREET_GAP}`).join(" ");
const routePoints = toPoints(ROUTE_STEPS);
const aiRoutePoints = toPoints(AI_ROUTE_STEPS);

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

      <g transform={`translate(${ROUTE_CENTER.x} ${ROUTE_CENTER.y}) rotate(${GRID_ANGLE})`}>
        {blocks.map(({ x, y, park }) => (
          <rect
            key={`${x},${y}`}
            x={x + STREET_W / 2 + (isMajorAvenue(x / AVENUE_GAP) ? 1.5 : 0)}
            y={y + STREET_W / 2}
            width={AVENUE_GAP - STREET_W - (isMajorAvenue(x / AVENUE_GAP) ? 1.5 : 0)}
            height={STREET_GAP - STREET_W}
            rx="1.5"
            className={park ? "fill-success-subtle" : "fill-subtle/70"}
          />
        ))}

        {/* A diagonal like Broadway, cutting across the grid */}
        <line x1={-420} y1={260} x2={420} y2={-120} className="stroke-card" strokeWidth="8" />

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
      </g>

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
