"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";

import { useScrollProgress } from "@/hooks/use-scroll-progress";

// A street of houses on one carrier route. Scrolling draws the route and walks a
// postcard to every front door — the whole EDDM pitch in one picture.

const W = 600;
const H = 380;
const GROUND = 290; // house bases sit on this line
const ROUTE_Y = 330; // the carrier walks along the street here
const DOOR_W = 18;
const DOOR_H = 30;

type House = {
  x: number;
  w: number;
  h: number;
  roof: "gable" | "flat" | "shed";
  roofH: number;
  door: number; // door's left edge, relative to x
  windows: number[]; // window left edges, relative to x
  chimney?: boolean;
};

const houses: House[] = [
  { x: 24, w: 74, h: 92, roof: "gable", roofH: 40, door: 12, windows: [44], chimney: true },
  { x: 116, w: 92, h: 70, roof: "flat", roofH: 0, door: 60, windows: [12, 34] },
  { x: 230, w: 66, h: 108, roof: "gable", roofH: 48, door: 24, windows: [24] },
  { x: 316, w: 90, h: 80, roof: "shed", roofH: 30, door: 16, windows: [48, 68] },
  { x: 426, w: 70, h: 96, roof: "gable", roofH: 36, door: 40, windows: [12], chimney: true },
  { x: 516, w: 62, h: 84, roof: "flat", roofH: 0, door: 22, windows: [] },
];

const doorCenter = (h: House) => h.x + h.door + DOOR_W / 2;

// Route: along the street, up to each door step, and back down.
const routePoints: [number, number][] = [[8, ROUTE_Y]];
for (const h of houses) {
  const cx = doorCenter(h);
  routePoints.push([cx, ROUTE_Y], [cx, GROUND + 4], [cx, ROUTE_Y]);
}
routePoints.push([W - 24, ROUTE_Y]);

// Straight segments only, so lengths are exact without measuring the DOM.
const cumulative = routePoints.map((_, i) =>
  routePoints
    .slice(1, i + 1)
    .reduce((sum, [x, y], j) => sum + Math.hypot(x - routePoints[j][0], y - routePoints[j][1]), 0)
);
const routeLength = cumulative[cumulative.length - 1];
const routeD = routePoints.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
// Progress (0–1) at which the postcard reaches each door: the 2nd, 5th, 8th… points.
const doorThresholds = houses.map((_, i) => cumulative[2 + i * 3] / routeLength);

function pointAt(progress: number): [number, number] {
  const target = progress * routeLength;
  for (let i = 1; i < routePoints.length; i++) {
    if (cumulative[i] >= target) {
      const segment = cumulative[i] - cumulative[i - 1] || 1;
      const t = (target - cumulative[i - 1]) / segment;
      const [ax, ay] = routePoints[i - 1];
      const [bx, by] = routePoints[i];
      return [ax + (bx - ax) * t, ay + (by - ay) * t];
    }
  }
  return routePoints[routePoints.length - 1];
}

export function HeroStreet() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const scrolled = useScrollProgress(ref);
  const finished = useMotionValue(1);
  // Respect "reduce motion": show every door already delivered.
  const progress = reduceMotion ? finished : scrolled;

  const markerX = useTransform(progress, (p) => pointAt(p)[0]);
  const markerY = useTransform(progress, (p) => pointAt(p)[1]);
  const delivered = useTransform(progress, (p) =>
    String(doorThresholds.filter((t) => p >= t).length)
  );
  const status = useTransform<number, string>(progress, (p) =>
    p <= 0.01 ? "Scroll to deliver ↓" : p >= 1 ? "Every door reached ✓" : "Delivering…"
  );

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl border bg-canvas"
    >
      <RouteCard progress={progress} delivered={delivered} status={status} />

      <svg viewBox={`0 0 ${W} ${H}`} className="-mt-[14%] block w-full sm:mt-0" role="img" aria-label="A postcard being delivered to every door on a street">
        <Backdrop progress={progress} />

        {/* Street */}
        <rect x="0" y={GROUND} width={W} height="8" className="fill-muted" />
        <line x1="0" x2={W} y1={GROUND + 8} y2={GROUND + 8} className="stroke-border" strokeWidth="2" />

        {houses.map((h, i) => (
          <HouseShape key={i} house={h} progress={progress} threshold={doorThresholds[i]} />
        ))}

        {/* Route: faint full path, then the walked part in brand pink */}
        <path d={routeD} fill="none" className="stroke-muted-foreground/40" strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" />
        <motion.path
          d={routeD}
          fill="none"
          className="stroke-primary"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pathLength: progress }}
        />

        {/* The postcard */}
        <motion.g style={{ x: markerX, y: markerY }}>
          <g transform="translate(-13 -9)">
            <rect width="26" height="18" rx="2" className="fill-card stroke-foreground" strokeWidth="2" />
            <rect x="17" y="4" width="5" height="6" className="fill-primary" />
            <line x1="5" x2="13" y1="7" y2="7" className="stroke-foreground" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="5" x2="11" y1="11" y2="11" className="stroke-foreground" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </motion.g>
      </svg>
    </div>
  );
}

function RouteCard({
  progress,
  delivered,
  status,
}: {
  progress: MotionValue<number>;
  delivered: MotionValue<string>;
  status: MotionValue<string>;
}) {
  return (
    // Floats over the sky on wider screens; on phones it sits above the street (the SVG's empty sky
    // tucks under it via a negative margin) so it never covers a house.
    <div className="relative z-10 m-3 mb-0 rounded-lg border bg-card p-3 shadow-sm sm:absolute sm:top-4 sm:right-4 sm:m-0 sm:w-52">
      <p className="text-xs text-muted-foreground">Carrier route C012</p>
      <p className="mt-1 text-sm font-semibold">
        <motion.span className="tabular-nums">{delivered}</motion.span> of {houses.length} doors reached
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div className="h-full origin-left rounded-full bg-primary" style={{ scaleX: progress }} />
      </div>
      <motion.p className="mt-2 text-xs text-muted-foreground" aria-hidden>
        {status}
      </motion.p>
    </div>
  );
}

// Houses on the next street over — gives depth, and drifts slightly for parallax.
function Backdrop({ progress }: { progress: MotionValue<number> }) {
  const y = useTransform(progress, [0, 1], [0, -8]);
  return (
    <motion.g style={{ y }} className="fill-subtle" aria-hidden>
      <rect x="60" y="178" width="60" height="112" />
      <polygon points="54,178 90,150 126,178" />
      <circle cx="222" cy="232" r="26" />
      <rect x="219" y="250" width="6" height="40" />
      <rect x="290" y="170" width="52" height="120" />
      <rect x="400" y="190" width="70" height="100" />
      <polygon points="396,190 435,158 474,190" />
      <circle cx="510" cy="222" r="30" />
      <rect x="507" y="246" width="6" height="44" />
    </motion.g>
  );
}

function HouseShape({
  house: h,
  progress,
  threshold,
}: {
  house: House;
  progress: MotionValue<number>;
  threshold: number;
}) {
  const top = GROUND - h.h;
  const doorX = h.x + h.door;
  const doorY = GROUND - DOOR_H;
  const cx = doorCenter(h);

  // 0 → 1 just as the postcard arrives at this door, with a small overshoot on the badge.
  const arrived = useTransform(progress, [threshold - 0.004, threshold + 0.02], [0, 1]);
  const badgeScale = useTransform(progress, [threshold - 0.004, threshold + 0.015, threshold + 0.03], [0, 1.25, 1]);

  const stroke = { strokeWidth: 2, strokeLinejoin: "round" as const };

  return (
    <g>
      {h.chimney && <rect x={h.x + h.w - 22} y={top - h.roofH + 6} width="10" height={h.roofH} className="fill-card stroke-foreground" {...stroke} />}

      <rect x={h.x} y={top} width={h.w} height={h.h} className="fill-card stroke-foreground" {...stroke} />

      {h.roof === "gable" && (
        <polygon points={`${h.x - 6},${top} ${h.x + h.w / 2},${top - h.roofH} ${h.x + h.w + 6},${top}`} className="fill-muted stroke-foreground" {...stroke} />
      )}
      {h.roof === "shed" && (
        <polygon points={`${h.x - 6},${top} ${h.x - 6},${top - h.roofH} ${h.x + h.w + 6},${top - 6} ${h.x + h.w + 6},${top}`} className="fill-muted stroke-foreground" {...stroke} />
      )}
      {h.roof === "flat" && <rect x={h.x - 4} y={top - 8} width={h.w + 8} height="8" className="fill-muted stroke-foreground" {...stroke} />}

      {h.windows.map((wx) => (
        <rect key={wx} x={h.x + wx} y={top + 16} width="16" height="16" className="fill-secondary stroke-foreground" {...stroke} />
      ))}

      {/* Door, which fills with pink and gets a letter in the slot on delivery */}
      <rect x={doorX} y={doorY} width={DOOR_W} height={DOOR_H} className="fill-card stroke-foreground" {...stroke} />
      <motion.rect x={doorX + 1} y={doorY + 1} width={DOOR_W - 2} height={DOOR_H - 2} className="fill-brand-subtle" style={{ opacity: arrived }} />
      <rect x={doorX + 4} y={doorY + 12} width={DOOR_W - 8} height="3" rx="1" className="fill-foreground" />
      <motion.rect
        x={doorX + 4}
        y={doorY + 7}
        width={DOOR_W - 8}
        height="7"
        className="fill-primary"
        style={{ opacity: arrived }}
      />

      {/* Check badge */}
      <motion.g style={{ scale: badgeScale, x: cx + 12, y: doorY - 4 }}>
        <circle r="8" className="fill-primary" />
        <path d="M-3.5 0 L-1 2.5 L3.5 -2.5" fill="none" className="stroke-primary-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
    </g>
  );
}
