"use client";

import { motion, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

// Line drawings of raised objects, seen from above at an angle (isometric), after
// Tailark's illustrations: flat shapes on the ground, pushed up into solid blocks, drawn
// in thin grey lines on white with one detail in the brand pink. Each shape is a list of
// points on the ground; `Block` raises it, drawing only the faces that face you, nearest
// last, so nearer faces hide farther ones. The lines trace themselves in once, when the
// picture comes into view; on hover (of the card around it) the object lifts a little.

type P = [number, number]; // a point on the ground: x runs down-right, y down-left

const COS = Math.cos(Math.PI / 6);
/** A ground point at height z, to the screen. */
const iso = ([x, y]: P, z = 0): P => [(x - y) * COS, (x + y) * 0.5 - z];
const d = (pts: P[], close = false) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join("") + (close ? "Z" : "");

const ease = [0.22, 1, 0.36, 1] as const;
const drawIn: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  shown: { pathLength: 1, opacity: 1, transition: { pathLength: { duration: 1.2, ease }, opacity: { duration: 0.2 } } },
};
const fadeIn: Variants = { hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 0.6 } } };

const line = "fill-none stroke-foreground/30 [stroke-linejoin:round] [stroke-linecap:round]";
const accent = "fill-none stroke-primary [stroke-linejoin:round] [stroke-linecap:round]";

function Stroke({ path, pink, width = 1 }: { path: string; pink?: boolean; width?: number }) {
  return <motion.path d={path} variants={drawIn} className={pink ? accent : line} strokeWidth={width} vectorEffect="non-scaling-stroke" />;
}
function Face({ path }: { path: string }) {
  return <motion.path d={path} variants={fadeIn} className="fill-card" />;
}

/**
 * A flat shape raised into a block: `pts` around its outline (either way round), from
 * `z` up to `z + h`. Corners sharper than ~25° get an upright edge; curves don't.
 */
export function Block({ pts, h, z = 0, pink = false }: { pts: P[]; h: number; z?: number; pink?: boolean }) {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  const sign = area > 0 ? 1 : -1;
  // A side faces you when its outward normal points down the screen (+x and +y).
  const faces = pts.map((a, i) => {
    const b = pts[(i + 1) % n];
    const nx = (b[1] - a[1]) * sign;
    const ny = -(b[0] - a[0]) * sign;
    return nx + ny > 1e-6;
  });
  const turn = (i: number) => {
    const a = pts[(i - 1 + n) % n];
    const b = pts[i];
    const c = pts[(i + 1) % n];
    const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const t2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    const dt = Math.abs(((t2 - t1 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
    return dt;
  };
  // An upright edge where the outline turns from facing you to not (the silhouette), and
  // at sharp corners between two faces that face you.
  const upright = (i: number) => {
    const before = faces[(i - 1 + n) % n];
    const after = faces[i];
    return before !== after || (before && after && turn(i) > 0.45);
  };
  const sides = pts
    .map((a, i) => ({ a, b: pts[(i + 1) % n], i }))
    .filter(({ i }) => faces[i])
    .sort((p, q) => p.a[0] + p.a[1] + p.b[0] + p.b[1] - (q.a[0] + q.a[1] + q.b[0] + q.b[1]));

  return (
    <g>
      {sides.map(({ a, b, i }) => (
        <g key={i}>
          <Face path={d([iso(a, z), iso(b, z), iso(b, z + h), iso(a, z + h)], true)} />
          <Stroke path={d([iso(a, z), iso(b, z)])} pink={pink} />
          {upright(i) && <Stroke path={d([iso(a, z), iso(a, z + h)])} pink={pink} />}
          {upright((i + 1) % n) && <Stroke path={d([iso(b, z), iso(b, z + h)])} pink={pink} />}
        </g>
      ))}
      <Face path={d(pts.map((p) => iso(p, z + h)), true)} />
      <Stroke path={d(pts.map((p) => iso(p, z + h)), true)} pink={pink} />
    </g>
  );
}

/** Lines drawn flat on a surface at height z (address lines, a check mark…). */
export function Flat({ pts, z = 0, pink, width }: { pts: P[]; z?: number; pink?: boolean; width?: number }) {
  return <Stroke path={d(pts.map((p) => iso(p, z)))} pink={pink} width={width} />;
}

/* ------------------------------- The shapes ------------------------------ */

const rect = (cx: number, cy: number, w: number, dd: number, rot = 0): P[] => {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return (
    [
      [-w / 2, -dd / 2],
      [w / 2, -dd / 2],
      [w / 2, dd / 2],
      [-w / 2, dd / 2],
    ] as P[]
  ).map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
};

/** A four-pointed sparkle, its sides curving in (an astroid, softened), turned 45° so
 *  its points face up, down, left and right on screen. */
const sparkle = (cx: number, cy: number, r: number, k = 3.2, steps = 96): P[] =>
  Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const a = r * Math.sign(c) * Math.abs(c) ** k;
    const b = r * Math.sign(s) * Math.abs(s) ** k;
    return [cx + (a - b) / Math.SQRT2, cy + (a + b) / Math.SQRT2] as P;
  });

/** A shield lying down, its point toward the lower right. u runs across it, v from its
 *  top edge (v = -44) to its point (v = 60). */
const shieldAt = (u: number, v: number): P => [v, u];
const shield = (): P[] => {
  const W = 46;
  // Straight sides to v = 6, then a curve into the point
  const half = (v: number) => (v <= 6 ? W : W * Math.cos(((v - 6) / 54) * (Math.PI / 2)) ** 0.8);
  const vs = Array.from({ length: 25 }, (_, i) => -44 + (i / 24) * 104);
  return [
    shieldAt(-W, -44),
    shieldAt(0, -38),
    shieldAt(W, -44),
    ...vs.slice(1, -1).map((v) => shieldAt(half(v), v)),
    shieldAt(0, 60),
    ...vs.slice(1, -1).reverse().map((v) => shieldAt(-half(v), v)),
  ];
};

/** A ground point `r` to the right of and `u` above (on screen) a ground point cx, cy. */
const onScreen = (cx: number, cy: number, r: number, u: number): P => [
  cx + (r - u) / Math.SQRT2,
  cy + (-r - u) / Math.SQRT2,
];

/* ------------------------------ The pictures ----------------------------- */

export type IsoArtName =
  | "agents"
  | "postcard"
  | "scans"
  | "shield"
  // v2 candidates
  | "agents-chip"
  | "agents-key"
  | "agents-layers"
  | "quality-homes"
  | "quality-shield";

/** One picture: the object (which lifts on hover of a `group` around it) over a soft shadow. */
export function IsoArt({ name, className }: { name: IsoArtName; className?: string }) {
  return (
    <motion.svg
      aria-hidden
      viewBox="-120 -92 240 156"
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.6 }}
      className={cn("overflow-visible", className)}
    >
      <defs>
        <radialGradient id={`iso-shadow-${name}`}>
          <stop offset="0%" stopColor="black" stopOpacity="0.09" />
          <stop offset="100%" stopColor="black" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        cx="0"
        cy="22"
        rx="92"
        ry="26"
        fill={`url(#iso-shadow-${name})`}
        className="origin-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-box:fill-box] group-hover:scale-90"
      />
      <g className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5">
        {name === "agents" && <Agents />}
        {name === "postcard" && <Postcard />}
        {name === "scans" && <Scans />}
        {name === "shield" && <Shield />}
        {name === "agents-chip" && <Chip />}
        {name === "agents-key" && <Key />}
        {name === "agents-layers" && <Layers />}
        {name === "quality-homes" && <Homes />}
        {name === "quality-shield" && <ShieldV2 />}
      </g>
    </motion.svg>
  );
}

/** Agents: a big sparkle, raised, with a small pink one floating beside it. */
function Agents() {
  return (
    <g>
      <Block pts={sparkle(0, 0, 66)} h={16} />
      <Block pts={sparkle(...onScreen(0, 0, 66, 26), 18)} h={5} z={28} pink />
    </g>
  );
}

/** Attention: two postcards stacked, the top one stamped in pink, its address in lines. */
function Postcard() {
  const top = 7;
  return (
    <g>
      <Block pts={rect(-4, 4, 120, 80, -0.16)} h={3.5} />
      <Block pts={rect(2, -2, 120, 80)} h={3.5} z={3.5} />
      {/* The stamp, its cancellation waves running off it */}
      <Block pts={rect(42, -22, 22, 26)} h={1.5} z={top} pink />
      {[-30, -24].map((y) => (
        <Flat key={y} z={top} pts={Array.from({ length: 9 }, (_, i) => [8 + i * 4, y + (i % 2 ? 2 : -2)] as P)} />
      ))}
      {/* The headline and the address */}
      <Flat z={top} width={2.2} pts={[[-48, -26], [-10, -26]]} />
      <Flat z={top} pts={[[-48, -16], [-22, -16]]} />
      <Flat z={top} pts={[[-48, 14], [-6, 14]]} />
      <Flat z={top} pts={[[-48, 22], [-14, 22]]} />
      <Flat z={top} pts={[[-48, 30], [-20, 30]]} />
    </g>
  );
}

/** Measurable: three bars on a plate, rising; the tallest outlined in pink. */
function Scans() {
  const bars: [number, number][] = [
    [-42, 22],
    [0, 38],
    [42, 60],
  ];
  return (
    <g>
      <Block pts={rect(0, 0, 150, 56)} h={6} />
      {bars.map(([x, h], i) => (
        <Block key={x} pts={rect(x, 0, 28, 28)} h={h} z={6} pink={i === bars.length - 1} />
      ))}
    </g>
  );
}

/** Quality: a shield, raised, a check mark cut into its top in pink. */
function Shield() {
  const h = 16;
  return (
    <g>
      <Block pts={shield()} h={h} />
      {/* The check, set out along the screen's right and up, so it reads as a check */}
      <Flat z={h} pink width={2.5} pts={[onScreen(4, 0, -16, 2), onScreen(4, 0, -5, -8), onScreen(4, 0, 17, 14)]} />
    </g>
  );
}

/* ----------------------------- v2 candidates ----------------------------- */

const closed = (pts: P[]): P[] => [...pts, pts[0]];

/** A rounded rectangle on the ground (corners sampled, so it raises cleanly). */
const roundRect = (cx: number, cy: number, w: number, dd: number, r: number, steps = 6): P[] => {
  const out: P[] = [];
  const corners: [number, number, number][] = [
    [cx + w / 2 - r, cy - dd / 2 + r, -Math.PI / 2],
    [cx + w / 2 - r, cy + dd / 2 - r, 0],
    [cx - w / 2 + r, cy + dd / 2 - r, Math.PI / 2],
    [cx - w / 2 + r, cy - dd / 2 + r, Math.PI],
  ];
  for (const [x, y, a0] of corners)
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (i / steps) * (Math.PI / 2);
      out.push([x + r * Math.cos(a), y + r * Math.sin(a)]);
    }
  return out;
};

/** Agents, as a chip: a square body on pins, a pink sparkle printed on top. */
function Chip() {
  const S = 74;
  const z = 4;
  const h = 10;
  const pins = [-24, -8, 8, 24];
  // Pins on the far sides first (the body hides most of them), the near sides last
  const far = [
    ...pins.map((t) => rect(t, -S / 2 - 6, 6, 12)),
    ...pins.map((t) => rect(-S / 2 - 6, t, 12, 6)),
  ];
  const near = [
    ...pins.map((t) => rect(t, S / 2 + 6, 6, 12)),
    ...pins.map((t) => rect(S / 2 + 6, t, 12, 6)),
  ];
  return (
    <g>
      {far.map((p, i) => (
        <Block key={`f${i}`} pts={p} h={2} z={0} />
      ))}
      <Block pts={roundRect(0, 0, S, S, 6)} h={h} z={z} />
      {/* An inset square on top, and the sparkle in it */}
      <Flat z={z + h} pts={closed(roundRect(0, 0, S - 22, S - 22, 4))} />
      <Flat z={z + h} pink width={1.6} pts={closed(sparkle(0, 0, 20))} />
      {near.map((p, i) => (
        <Block key={`n${i}`} pts={p} h={2} z={0} />
      ))}
    </g>
  );
}

/** Agents, as a keycap: one big rounded key on a plate, a pink sparkle on its top. */
function Key() {
  return (
    <g>
      <Block pts={roundRect(0, 0, 128, 128, 14)} h={6} />
      <Block pts={roundRect(0, 0, 84, 84, 14)} h={20} z={6} />
      <Flat z={26} pts={closed(roundRect(0, 0, 66, 66, 10))} />
      <Flat z={26} pink width={1.6} pts={closed(sparkle(0, 0, 22))} />
    </g>
  );
}

/** Agents, as a stack of layers (the agents' work, piled up): the top one sparkles. */
function Layers() {
  return (
    <g>
      {[0, 16, 32].map((z, i) => (
        <g key={z}>
          <Block pts={roundRect(0, 0, 92, 92, 10)} h={4} z={z} />
          {i < 2 && <Flat z={z + 4} pts={[[-28, -14], [10, -14]]} />}
        </g>
      ))}
      <Flat z={36} pink width={1.6} pts={closed(sparkle(0, 0, 22))} />
    </g>
  );
}

const iso3 = (x: number, y: number, z: number) => iso([x, y], z);

/** A little house: a box with a pitched roof, its ridge running down-right. */
function House({ cx, cy, z = 0, w = 24, dd = 18, h = 12, r = 8, pink }: { cx: number; cy: number; z?: number; w?: number; dd?: number; h?: number; r?: number; pink?: boolean }) {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - dd / 2;
  const y1 = cy + dd / 2;
  const faces: P[][] = [
    // the far roof slope, the end wall with its gable, the long wall, the near slope
    [iso3(x0, y0, z + h), iso3(x1, y0, z + h), iso3(x1, cy, z + h + r), iso3(x0, cy, z + h + r)],
    [iso3(x1, y0, z), iso3(x1, y1, z), iso3(x1, y1, z + h), iso3(x1, cy, z + h + r), iso3(x1, y0, z + h)],
    [iso3(x0, y1, z), iso3(x1, y1, z), iso3(x1, y1, z + h), iso3(x0, y1, z + h)],
    [iso3(x0, y1, z + h), iso3(x1, y1, z + h), iso3(x1, cy, z + h + r), iso3(x0, cy, z + h + r)],
  ];
  return (
    <g>
      {faces.map((f, i) => (
        <g key={i}>
          <Face path={d(f, true)} />
          <Stroke path={d(f, true)} pink={pink} />
        </g>
      ))}
    </g>
  );
}

/** Quality at scale: a neighborhood of identical homes on a block, the nearest in pink. */
function Homes() {
  const step = 36;
  const homes = [-1, 0, 1].flatMap((i) => [-1, 0, 1].map((j) => [i * step, j * step] as P));
  homes.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  return (
    <g>
      <Block pts={roundRect(0, 0, 132, 132, 10)} h={5} />
      {homes.map(([x, y], i) => (
        <House key={`${x},${y}`} cx={x} cy={y} z={5} pink={i === homes.length - 1} />
      ))}
    </g>
  );
}

/** Quality, a cleaner shield: a raised rim around a lower face, the check raised in pink. */
function ShieldV2() {
  const outline = shield();
  const inner = outline.map(([x, y]) => [x * 0.78 + 3, y * 0.78] as P);
  const check = [onScreen(4, 0, -16, 2), onScreen(4, 0, -5, -8), onScreen(4, 0, 17, 14)];
  return (
    <g>
      <Block pts={outline} h={14} />
      <Flat z={14} pts={closed(inner)} />
      <Flat z={14} pink width={3} pts={check} />
    </g>
  );
}

