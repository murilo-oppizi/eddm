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
  | "quality-shield"
  | "quality-stamp"
  | "quality-units"
  | "quality-pallet"
  | "quality-level"
  // after the icons on oppizi.com's About page
  | "attention-eye"
  | "quality-network"
  // round 4
  | "attention-mat"
  | "attention-door"
  | "quality-printer"
  | "quality-mailboxes"
  // round 5
  | "attention-slot"
  | "quality-street"
  // round 6
  | "quality-pile"
  | "quality-pile-stamp";

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
        {name === "quality-stamp" && <RubberStamp />}
        {name === "quality-units" && <Units />}
        {name === "quality-pallet" && <Pallet />}
        {name === "quality-level" && <Level />}
        {name === "attention-eye" && <Eye />}
        {name === "quality-network" && <Network />}
        {name === "attention-mat" && <Doormat />}
        {name === "attention-door" && <Door />}
        {name === "quality-printer" && <Printer />}
        {name === "quality-mailboxes" && <Mailboxes />}
        {name === "attention-slot" && <MailSlot />}
        {name === "quality-street" && <Street />}
        {name === "quality-pile" && <Pile />}
        {name === "quality-pile-stamp" && <Pile withStamp />}
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

const circle = (cx: number, cy: number, r: number, steps = 48): P[] =>
  Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)] as P;
  });

/** Quality: a rubber stamp, its handle up, beside the pink check it just printed. */
function RubberStamp() {
  // The stamp a little right of center, its print on the ground to its left
  const [sx, sy] = onScreen(0, 0, 22, -4);
  const [ix, iy] = onScreen(0, 0, -62, -22);
  return (
    <g>
      {/* The print on the ground: a rounded square with a check in it */}
      <Flat pink width={1.6} pts={closed(roundRect(ix, iy, 46, 46, 8))} />
      <Flat pink width={2.6} pts={[onScreen(ix, iy, -11, 0), onScreen(ix, iy, -3, -7), onScreen(ix, iy, 12, 8)]} />
      {/* The stamp: rubber, block, neck, handle and knob */}
      <Block pts={roundRect(sx, sy, 58, 58, 6)} h={4} z={0} />
      <Block pts={roundRect(sx, sy, 64, 64, 6)} h={12} z={4} />
      <Block pts={roundRect(sx, sy, 30, 30, 4)} h={8} z={16} />
      <Block pts={circle(sx, sy, 13)} h={30} z={24} />
      <Block pts={circle(sx, sy, 18)} h={10} z={54} />
    </g>
  );
}

/** Quality at any scale: one cube, a 2×2×2 block, a 3×3×3 block, all of the same unit. */
function Units() {
  // A little bigger than the first draft, so it holds its own beside the other three
  const u = 15;
  const groups: { n: number; at: P; pink?: boolean }[] = [
    { n: 1, at: onScreen(0, 0, -86, 10), pink: true },
    { n: 2, at: onScreen(0, 0, -42, 6) },
    { n: 3, at: onScreen(0, 0, 32, 2) },
  ];
  const cubes: { x: number; y: number; z: number; pink?: boolean }[] = [];
  for (const { n, at, pink } of groups)
    for (let k = 0; k < n; k++)
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          cubes.push({ x: at[0] + (i - (n - 1) / 2) * u, y: at[1] + (j - (n - 1) / 2) * u, z: k * u, pink });
  // Far to near, bottom to top
  cubes.sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z);
  return (
    <g>
      {cubes.map((c, i) => (
        <Block key={i} pts={rect(c.x, c.y, u, u)} h={u} z={c.z} pink={c.pink} />
      ))}
    </g>
  );
}

/** Quality at scale: a pallet of identical boxes, one sealed with pink tape. */
function Pallet() {
  const b = 40;
  const h = 26;
  const boxes: { x: number; y: number; z: number }[] = [];
  for (let k = 0; k < 2; k++)
    for (const x of [-b / 2 - 1, b / 2 + 1]) for (const y of [-b / 2 - 1, b / 2 + 1]) boxes.push({ x, y, z: 10 + k * h });
  boxes.sort((p, q) => p.x + p.y - (q.x + q.y) || p.z - q.z);
  const last = boxes[boxes.length - 1];
  return (
    <g>
      {/* The pallet: three runners under a deck */}
      {[-30, 0, 30].map((y) => (
        <Block key={y} pts={rect(0, y, 92, 12)} h={5} />
      ))}
      <Block pts={rect(0, 0, 92, 92)} h={5} z={5} />
      {boxes.map((p, i) => (
        <g key={i}>
          <Block pts={rect(p.x, p.y, b, b)} h={h} z={p.z} />
          {p === last ? (
            <Flat z={p.z + h} pink width={2.4} pts={[[p.x - b / 2, p.y], [p.x + b / 2, p.y]]} />
          ) : (
            <Flat z={p.z + h} pts={[[p.x - b / 2, p.y], [p.x + b / 2, p.y]]} />
          )}
        </g>
      ))}
    </g>
  );
}

/** Quality, measured: a spirit level, its bubble centered in pink. */
function Level() {
  return (
    <g>
      <Block pts={rect(0, 0, 170, 26)} h={16} />
      {/* The vial window and its bubble */}
      <Flat z={16} pts={closed(roundRect(0, 0, 44, 12, 6))} />
      <Flat z={16} pts={[[-8, -6], [-8, 6]]} />
      <Flat z={16} pts={[[8, -6], [8, 6]]} />
      <Flat z={16} pink width={1.8} pts={closed(roundRect(0, 0, 12, 7, 3.5))} />
      {/* Two small windows near the ends */}
      <Flat z={16} pts={closed(roundRect(-62, 0, 16, 10, 4))} />
      <Flat z={16} pts={closed(roundRect(62, 0, 16, 10, 4))} />
    </g>
  );
}

/** Attention (oppizi.com's eye icon): an eye floating above a plate, its iris rising
 *  from it and the pupil in pink. The eye is laid out along the screen, so it reads as
 *  an eye. */
function Eye() {
  const W = 50;
  const H = 36;
  const lift = 26;
  const almond: P[] = [
    ...Array.from({ length: 25 }, (_, i) => {
      const r = -W + (i / 24) * 2 * W;
      return onScreen(0, 0, r, H * (1 - (r / W) ** 2));
    }),
    ...Array.from({ length: 23 }, (_, i) => {
      const r = W - ((i + 1) / 24) * 2 * W;
      return onScreen(0, 0, r, -H * (1 - (r / W) ** 2));
    }),
  ];
  return (
    <g>
      <Block pts={roundRect(0, 0, 120, 120, 14)} h={6} />
      {/* Where the eye would rest, faintly, on the plate */}
      <Flat z={6} pts={closed(almond.map(([x, y]) => [x * 0.8, y * 0.8] as P))} />
      <Block pts={almond} h={7} z={lift} />
      <Block pts={circle(0, 0, 18)} h={6} z={lift + 7} />
      <Flat z={lift + 13} pink width={1.8} pts={closed(circle(0, 0, 8))} />
    </g>
  );
}

/** Quality at scale (oppizi.com's network icon): a pink hub cube and four cubes around
 *  it, each joined to the hub by a beam. No base. */
function Network() {
  const nodes = [onScreen(0, 0, -50, 30), onScreen(0, 0, 50, 30), onScreen(0, 0, -50, -30), onScreen(0, 0, 50, -30)];
  const hub = 30;
  const cube = 22;
  // A beam from the hub's face to the node's, at mid height
  const beam = ([x, y]: P) => {
    const len = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    const from = hub / 2;
    const to = len - cube / 2;
    const mid = (from + to) / 2;
    return { at: [Math.cos(a) * mid, Math.sin(a) * mid] as P, pts: rect(Math.cos(a) * mid, Math.sin(a) * mid, to - from + 4, 7, a) };
  };
  type Piece = { at: P; el: React.ReactNode };
  const pieces: Piece[] = [
    { at: [0, 0], el: <Block pts={rect(0, 0, hub, hub)} h={hub} pink /> },
    ...nodes.map((p) => ({ at: p, el: <Block pts={rect(p[0], p[1], cube, cube)} h={cube} /> })),
    ...nodes.map((p) => {
      const b = beam(p);
      return { at: b.at, el: <Block pts={b.pts} h={7} z={8} /> };
    }),
  ];
  // Far to near, so nearer pieces cover farther ones
  pieces.sort((a, b) => a.at[0] + a.at[1] - (b.at[0] + b.at[1]));
  return (
    <g>
      {pieces.map((p, i) => (
        <g key={i}>{p.el}</g>
      ))}
    </g>
  );
}

/* -------------------------------- Round 4 -------------------------------- */

/** Lines drawn on an upright face that looks down-left (a fixed y): points as (x, z). */
function Wall({ pts, y, pink, width }: { pts: [number, number][]; y: number; pink?: boolean; width?: number }) {
  return <Stroke path={d(pts.map(([x, z]) => iso([x, y], z)))} pink={pink} width={width} />;
}
const wallRect = (x0: number, x1: number, z0: number, z1: number): [number, number][] => [
  [x0, z0],
  [x1, z0],
  [x1, z1],
  [x0, z1],
  [x0, z0],
];

/** Text printed flat on the ground (or a surface at height z), running down-right. */
function GroundText({ x, y, z = 0, size, children }: { x: number; y: number; z?: number; size: number; children: string }) {
  const [tx, ty] = iso([x, y], z);
  return (
    <motion.text
      variants={fadeIn}
      transform={`matrix(${COS} 0.5 ${-COS} 0.5 ${tx} ${ty})`}
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-foreground/30 font-semibold tracking-[0.25em]"
      style={{ fontSize: size }}
    >
      {children}
    </motion.text>
  );
}

/** Attention, at the door: a postcard landed on a WELCOME mat, its stamp in pink. */
function Doormat() {
  return (
    <g>
      <Block pts={roundRect(0, 0, 150, 92, 10)} h={4} />
      <Flat z={4} pts={closed(roundRect(0, 0, 136, 78, 7))} />
      <GroundText x={6} y={30} z={4} size={12}>
        WELCOME
      </GroundText>
      <Block pts={rect(-10, -16, 72, 48, 0.22)} h={2.5} z={4} />
      <Block pts={rect(6, -32, 14, 16, 0.22)} h={1} z={6.5} pink />
      <Flat z={6.5} pts={[[-38, -30], [-12, -24]]} />
      <Flat z={6.5} pts={[[-40, -20], [-22, -16]]} />
    </g>
  );
}

/** Attention, at the door: a front door on its step, a postcard poking out of the mail
 *  slot in pink. */
function Door() {
  const face = 0; // the door's front face (it looks down-left)
  return (
    <g>
      <Block pts={rect(0, 14, 96, 44)} h={5} />
      <Block pts={rect(0, -4, 64, 8)} h={82} z={5} />
      {/* Panels, the slot, the knob */}
      <Wall y={face} pts={wallRect(-22, 22, 52, 78)} />
      <Wall y={face} pts={wallRect(-22, 22, 12, 30)} />
      <Wall y={face} pts={wallRect(-14, 14, 38, 43)} />
      <Wall y={face} pts={Array.from({ length: 17 }, (_, i) => {
        const t = (i / 16) * Math.PI * 2;
        return [24 + 3 * Math.cos(t), 33 + 3 * Math.sin(t)] as [number, number];
      })} />
      {/* The postcard, half through the slot */}
      <Block pts={[[-11, face], [11, face], [11, face + 22], [-11, face + 22]]} h={2} z={40} pink />
    </g>
  );
}

/** Quality at scale: a printer and its output, a stack of identical cards, the top one
 *  checked in pink. */
function Printer() {
  const sheets = 7;
  return (
    <g>
      <Block pts={roundRect(-14, -12, 92, 70, 6)} h={30} />
      {/* The paper going in at the back, the slot it comes out of */}
      <Block pts={rect(-24, -46, 60, 4, 0)} h={14} z={30} />
      <Flat z={30} pts={closed(roundRect(-14, -12, 70, 48, 4))} />
      {/* The stack, in front */}
      {Array.from({ length: sheets }, (_, i) => (
        <Block key={i} pts={rect(42, 36, 58, 40)} h={2.4} z={i * 2.4} />
      ))}
      <Flat z={sheets * 2.4} pink width={2.4} pts={[onScreen(42, 36, -9, 0), onScreen(42, 36, -2, -6), onScreen(42, 36, 11, 7)]} />
    </g>
  );
}

/** Quality at scale: a street of identical mailboxes on posts, every flag up in pink. */
function Mailboxes() {
  const xs = [-72, -24, 24, 72];
  return (
    // Down a little, to sit in the middle of the card like the others
    <g transform="translate(0 20)">
      {xs.map((x) => (
        <g key={x}>
          <Block pts={rect(x, 0, 5, 5)} h={34} />
          <Block pts={roundRect(x, 0, 16, 30, 4)} h={16} z={34} />
          {/* The flag, up */}
          <Block pts={rect(x + 9.5, -6, 2, 4)} h={22} z={36} pink />
          <Block pts={rect(x + 9.5, -9, 2, 8)} h={7} z={51} pink />
        </g>
      ))}
    </g>
  );
}

/* -------------------------------- Round 5 -------------------------------- */

type YZ = [number, number];

/**
 * A shape drawn upright, as (y, z), pushed out along x from x0 to x1: for things whose
 * outline is in a wall, not the ground, like a mailbox's rounded top. The end at x1 faces
 * you; of its long sides, only those that face you are drawn.
 */
function SideBlock({ profile, x0, x1, pink }: { profile: YZ[]; x0: number; x1: number; pink?: boolean }) {
  const n = profile.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [a1, b1] = profile[i];
    const [a2, b2] = profile[(i + 1) % n];
    area += a1 * b2 - a2 * b1;
  }
  const sign = area > 0 ? 1 : -1;
  // A long side faces you when its outward normal points toward you: (+y) + (+z) > 0
  const faces = profile.map((a, i) => {
    const b = profile[(i + 1) % n];
    const ny = (b[1] - a[1]) * sign;
    const nz = -(b[0] - a[0]) * sign;
    return ny + nz > 1e-6;
  });
  const turn = (i: number) => {
    const a = profile[(i - 1 + n) % n];
    const b = profile[i];
    const c = profile[(i + 1) % n];
    const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const t2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    return Math.abs(((t2 - t1 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
  };
  const edge = (i: number) => {
    const before = faces[(i - 1 + n) % n];
    const after = faces[i];
    return before !== after || (before && after && turn(i) > 0.45);
  };
  const at = (x: number, [y, z]: YZ) => iso([x, y], z);
  const sides = profile
    .map((a, i) => ({ a, b: profile[(i + 1) % n], i }))
    .filter(({ i }) => faces[i])
    .sort((p, q) => p.a[0] + p.a[1] + p.b[0] + p.b[1] - (q.a[0] + q.a[1] + q.b[0] + q.b[1]));
  return (
    <g>
      {sides.map(({ a, b, i }) => (
        <g key={i}>
          <Face path={d([at(x0, a), at(x0, b), at(x1, b), at(x1, a)], true)} />
          <Stroke path={d([at(x0, a), at(x0, b)])} pink={pink} />
          {edge(i) && <Stroke path={d([at(x0, a), at(x1, a)])} pink={pink} />}
          {edge((i + 1) % n) && <Stroke path={d([at(x0, b), at(x1, b)])} pink={pink} />}
        </g>
      ))}
      <Face path={d(profile.map((p) => at(x1, p)), true)} />
      <Stroke path={d(profile.map((p) => at(x1, p)), true)} pink={pink} />
    </g>
  );
}

/** Lines drawn on an upright face that looks down-right (a fixed x): points as (y, z). */
function WallX({ pts, x, pink, width }: { pts: YZ[]; x: number; pink?: boolean; width?: number }) {
  return <Stroke path={d(pts.map(([y, z]) => iso([x, y], z)))} pink={pink} width={width} />;
}

/** A mailbox's outline, seen from its door: a flat bottom, straight sides, a round top. */
const mailboxProfile = (w: number, h: number, steps = 14): YZ[] => {
  const r = w / 2;
  return [
    [-r, 0],
    [r, 0],
    [r, h],
    ...Array.from({ length: steps - 1 }, (_, i) => {
      const t = ((i + 1) / steps) * Math.PI;
      return [r * Math.cos(t), h + r * Math.sin(t)] as YZ;
    }),
    [-r, h],
  ];
};

/** Attention: one postcard, pushed halfway through a door's mail slot; its stamp in pink. */
function MailSlot() {
  const face = 4; // the door's front face (it looks down-left)
  const plate = face + 3;
  const knob = Array.from({ length: 17 }, (_, i) => {
    const t = (i / 16) * Math.PI * 2;
    return [52 + 4 * Math.cos(t), -6 + 4 * Math.sin(t)] as [number, number];
  });
  return (
    <g transform="translate(0 4)">
      {/* The door, close up: its boards, and the knob below the slot */}
      <Block pts={rect(0, 0, 150, 8)} h={92} z={-32} />
      {[-25, 25].map((x) => (
        <Wall key={x} y={face} pts={[[x, -32], [x, 6]]} />
      ))}
      <Wall y={face} pts={knob} />
      {/* The letter plate, raised off the door, with its opening */}
      <Block pts={rect(0, face + 1.5, 72, 3)} h={20} z={12} />
      <Wall y={plate} pts={wallRect(-27, 27, 18, 25)} />
      {/* One postcard, halfway out of the opening */}
      <Block pts={[[-22, plate], [22, plate], [22, plate + 38], [-22, plate + 38]]} h={2} z={20} />
      <Block pts={rect(13, plate + 29, 9, 11)} h={0.8} z={22} pink />
      <Flat z={22} pts={[[-16, plate + 18], [2, plate + 18]]} />
      <Flat z={22} pts={[[-16, plate + 26], [-4, plate + 26]]} />
      <Flat z={22} pts={[[-16, plate + 33], [-8, plate + 33]]} />
    </g>
  );
}

/** Quality at scale: a street of identical rural mailboxes on a sidewalk, every flag up
 *  in pink. Each has a rounded top, a door facing you and a post. */
function Street() {
  const ys = [-66, -22, 22, 66];
  const L = 34; // a mailbox's length, along x
  const W = 18;
  const base = 30; // the post's height
  return (
    <g transform="translate(0 24)">
      <Block pts={rect(0, 0, 44, 190)} h={3} />
      {ys.map((y) => {
        const prof = mailboxProfile(W, 10).map(([py, pz]) => [y + py, base + 3 + pz] as YZ);
        const door = mailboxProfile(W - 6, 10).map(([py, pz]) => [y + py, base + 6 + pz] as YZ);
        return (
          <g key={y}>
            <Block pts={rect(0, y, 6, 6)} h={base} z={3} />
            <Block pts={rect(0, y, 12, 14)} h={2} z={base + 1} />
            <SideBlock profile={prof} x0={-L / 2} x1={L / 2} />
            <WallX x={L / 2} pts={[...door, door[0]]} />
            {/* The flag, up, on the side that faces you */}
            <Block pts={rect(-L / 2 + 8, y + W / 2 + 1, 2.4, 2)} h={22} z={base + 8} pink />
            <Block pts={rect(-L / 2 + 13, y + W / 2 + 1, 10, 2)} h={7} z={base + 23} pink />
          </g>
        );
      })}
    </g>
  );
}

/* -------------------------------- Round 6 -------------------------------- */

/**
 * Quality at scale: a pile of identical postcards, a little uneven like a real stack,
 * the top one with its address and a round pink seal of approval printed on it. With
 * `withStamp`, the rubber stamp that printed it is lifted just above the pile.
 */
function Pile({ withStamp = false }: { withStamp?: boolean }) {
  const t = 2.4; // one card's thickness
  // Twelve cards, each a touch off square, like a real pile
  const tilts = [0.06, -0.04, 0.03, -0.05, 0.04, -0.02, 0.05, -0.03, 0.02, -0.04, 0.02, 0];
  const shifts: P[] = [[-3, 2], [2, -2], [-2, -1], [3, 2], [-1, 2], [2, 0], [-2, 1], [1, -2], [-1, 1], [2, 1], [-1, -1], [0, 0]];
  const top = tilts.length * t;
  const seal: P = [26, -10];
  const ring = (r: number) => closed(circle(seal[0], seal[1], r, 36));
  return (
    <g transform={withStamp ? "translate(0 26)" : "translate(0 16)"}>
      {tilts.map((a, i) => (
        <Block key={i} pts={rect(shifts[i][0], shifts[i][1], 112, 74, a)} h={t} z={i * t} />
      ))}
      {/* The address on the top card */}
      <Flat z={top} width={2} pts={[[-44, -24], [-12, -24]]} />
      <Flat z={top} pts={[[-44, -14], [-22, -14]]} />
      <Flat z={top} pts={[[-44, 12], [-8, 12]]} />
      <Flat z={top} pts={[[-44, 20], [-16, 20]]} />
      <Flat z={top} pts={[[-44, 28], [-24, 28]]} />
      {/* The seal: two rings and a check */}
      <Flat z={top} pink width={1.6} pts={ring(18)} />
      <Flat z={top} pink pts={ring(14)} />
      <Flat
        z={top}
        pink
        width={2.4}
        pts={[onScreen(seal[0], seal[1], -6, 0), onScreen(seal[0], seal[1], -1.5, -4.5), onScreen(seal[0], seal[1], 7, 4.5)]}
      />
      {withStamp && <LiftedStamp at={onScreen(seal[0], seal[1], 30, 18)} z={top + 14} />}
    </g>
  );
}

/** The rubber stamp from round 3, lifted off the ground to height z. */
function LiftedStamp({ at: [sx, sy], z }: { at: P; z: number }) {
  return (
    <g>
      <Block pts={roundRect(sx, sy, 40, 40, 5)} h={3} z={z} />
      <Block pts={roundRect(sx, sy, 44, 44, 5)} h={9} z={z + 3} />
      <Block pts={roundRect(sx, sy, 20, 20, 3)} h={6} z={z + 12} />
      <Block pts={circle(sx, sy, 9)} h={20} z={z + 18} />
      <Block pts={circle(sx, sy, 12.5)} h={7} z={z + 38} />
    </g>
  );
}

