"use client";

import { motion, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

// Line drawings of raised objects, seen from above at an angle (isometric), after
// Tailark's illustrations: flat shapes on the ground, pushed up into solid blocks, drawn
// in thin grey lines on white with one detail in the brand pink, every corner rounded.
// Each shape is a list of points on the ground; `Block` raises it, drawing only the faces
// that face you, nearest last, so nearer faces hide farther ones. The lines trace
// themselves in once, when the picture comes into view; on hover (of the card around it)
// the object lifts a little.

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

// Solid, not see-through: the grey the ink at 30% makes on the white card, so where two
// lines cross (or one runs over another) they don't add up darker.
const line =
  "fill-none stroke-[color-mix(in_srgb,var(--foreground)_30%,var(--card))] [stroke-linejoin:round] [stroke-linecap:round]";
const accent = "fill-none stroke-primary [stroke-linejoin:round] [stroke-linecap:round]";

function Stroke({ path, pink, width = 1 }: { path: string; pink?: boolean; width?: number }) {
  return <motion.path d={path} variants={drawIn} className={pink ? accent : line} strokeWidth={width} vectorEffect="non-scaling-stroke" />;
}
function Face({ path }: { path: string }) {
  return <motion.path d={path} variants={fadeIn} className="fill-card" />;
}

/**
 * A flat shape raised into a block: `pts` around its outline (either way round), from
 * `z` up to `z + h`. Corners sharper than ~25° get an upright edge; rounded ones don't.
 */
function Block({ pts, h, z = 0, pink = false }: { pts: P[]; h: number; z?: number; pink?: boolean }) {
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
    return Math.abs(((t2 - t1 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
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

/**
 * An upright shape, drawn as (x, z), pushed out toward you along y from y0 to y1: for
 * things whose outline is in a wall, like a door or a letter plate, so the corners you
 * see can be rounded. The face at y1 looks down-left at you; of the edges around it,
 * only those facing you (the top, the right) are drawn.
 */
function WallBlock({ profile, y0, y1, pink }: { profile: P[]; y0: number; y1: number; pink?: boolean }) {
  const n = profile.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [a1, b1] = profile[i];
    const [a2, b2] = profile[(i + 1) % n];
    area += a1 * b2 - a2 * b1;
  }
  const sign = area > 0 ? 1 : -1;
  // A side faces you when its outward normal (in x and z) points toward you: x + z > 0
  const faces = profile.map((a, i) => {
    const b = profile[(i + 1) % n];
    const nx = (b[1] - a[1]) * sign;
    const nz = -(b[0] - a[0]) * sign;
    return nx + nz > 1e-6;
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
  const at = (y: number, [x, z]: P) => iso([x, y], z);
  const sides = profile
    .map((a, i) => ({ a, b: profile[(i + 1) % n], i }))
    .filter(({ i }) => faces[i])
    .sort((p, q) => p.a[0] + p.a[1] + p.b[0] + p.b[1] - (q.a[0] + q.a[1] + q.b[0] + q.b[1]));
  return (
    <g>
      {sides.map(({ a, b, i }) => (
        <g key={i}>
          <Face path={d([at(y0, a), at(y0, b), at(y1, b), at(y1, a)], true)} />
          <Stroke path={d([at(y0, a), at(y0, b)])} pink={pink} />
          {edge(i) && <Stroke path={d([at(y0, a), at(y1, a)])} pink={pink} />}
          {edge((i + 1) % n) && <Stroke path={d([at(y0, b), at(y1, b)])} pink={pink} />}
        </g>
      ))}
      <Face path={d(profile.map((p) => at(y1, p)), true)} />
      <Stroke path={d(profile.map((p) => at(y1, p)), true)} pink={pink} />
    </g>
  );
}

/** Lines drawn flat on a surface at height z (address lines, a check mark…). */
function Flat({ pts, z = 0, pink, width }: { pts: P[]; z?: number; pink?: boolean; width?: number }) {
  return <Stroke path={d(pts.map((p) => iso(p, z)))} pink={pink} width={width} />;
}

/** Lines drawn on an upright face that looks down-left (a fixed y): points as (x, z). */
function Wall({ pts, y, pink, width }: { pts: [number, number][]; y: number; pink?: boolean; width?: number }) {
  return <Stroke path={d(pts.map(([x, z]) => iso([x, y], z)))} pink={pink} width={width} />;
}

/* ------------------------------- The shapes ------------------------------ */

/** A rounded rectangle: on the ground (x, y), turned by `rot`, or upright as (x, z). */
const roundRect = (cx: number, cy: number, w: number, dd: number, r: number, rot = 0, steps = 6): P[] => {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const out: P[] = [];
  const corners: [number, number, number][] = [
    [w / 2 - r, -dd / 2 + r, -Math.PI / 2],
    [w / 2 - r, dd / 2 - r, 0],
    [-w / 2 + r, dd / 2 - r, Math.PI / 2],
    [-w / 2 + r, -dd / 2 + r, Math.PI],
  ];
  for (const [x, y, a0] of corners)
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (i / steps) * (Math.PI / 2);
      const px = x + r * Math.cos(a);
      const py = y + r * Math.sin(a);
      out.push([cx + px * c - py * s, cy + px * s + py * c]);
    }
  return out;
};

const closed = <T,>(pts: T[]): T[] => [...pts, pts[0]];

const circle = (cx: number, cy: number, r: number, steps = 48): P[] =>
  Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)] as P;
  });

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

/** A check mark lying on a card around `c`: drawn along the card (x across, -y up), then
 *  turned by `turn` radians on the card's surface. */
const check = ([cx, cy]: P, turn: number): P[] => {
  const cs = Math.cos(turn);
  const sn = Math.sin(turn);
  return (
    [
      [-7, 0],
      [-2, 5],
      [9, -7],
    ] as P[]
  ).map(([x, y]) => [cx + x * cs - y * sn, cy + x * sn + y * cs]);
};
const CHECK_TURN = -0.4; // radians: enough to read as a check, still lying on the card

/* ------------------------------ The pictures ----------------------------- */

export type IsoArtName = "agents" | "attention" | "scans" | "quality";

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
        {name === "agents" && <Keycap />}
        {name === "attention" && <MailSlot />}
        {name === "scans" && <Bars />}
        {name === "quality" && <Pile />}
      </g>
    </motion.svg>
  );
}

/** Agents: one big rounded key on a plate, a pink sparkle on its top. */
function Keycap() {
  return (
    <g>
      <Block pts={roundRect(0, 0, 128, 128, 14)} h={6} />
      <Block pts={roundRect(0, 0, 84, 84, 14)} h={20} z={6} />
      <Flat z={26} pts={closed(roundRect(0, 0, 66, 66, 10))} />
      <Flat z={26} pink width={1.6} pts={closed(sparkle(0, 0, 22))} />
    </g>
  );
}

/** Attention: one postcard, pushed halfway through a door's mail slot; its stamp in pink. */
function MailSlot() {
  const face = 4; // the door's front face (it looks down-left)
  const plate = face + 3;
  const knob = closed(circle(0, 0, 4, 20)).map(([a, b]) => [52 + a, -6 + b] as [number, number]);
  return (
    <g transform="translate(0 4)">
      {/* The door, close up: its boards, and the knob below the slot */}
      <WallBlock profile={roundRect(0, 14, 150, 92, 10)} y0={-4} y1={face} />
      {[-25, 25].map((x) => (
        <Wall key={x} y={face} pts={[[x, -32], [x, 6]]} />
      ))}
      <Wall y={face} pts={knob} />
      {/* The letter plate, raised off the door, with its rounded opening */}
      <WallBlock profile={roundRect(0, 22, 72, 20, 6)} y0={face} y1={plate} />
      <Wall y={plate} pts={closed(roundRect(0, 21.5, 54, 7, 3.5))} />
      {/* One postcard, halfway out of the opening */}
      <Block pts={roundRect(0, plate + 19, 44, 38, 4)} h={2} z={20} />
      <Block pts={roundRect(13, plate + 29, 9, 11, 1.5)} h={0.8} z={22} pink />
      <Flat z={22} pts={[[-16, plate + 18], [2, plate + 18]]} />
      <Flat z={22} pts={[[-16, plate + 26], [-4, plate + 26]]} />
      <Flat z={22} pts={[[-16, plate + 33], [-8, plate + 33]]} />
    </g>
  );
}

/** Measurable: three bars on a plate, rising; the tallest outlined in pink. */
function Bars() {
  const bars: [number, number][] = [
    [-42, 22],
    [0, 38],
    [42, 60],
  ];
  return (
    <g>
      <Block pts={roundRect(0, 0, 150, 56, 10)} h={6} />
      {bars.map(([x, h], i) => (
        <Block key={x} pts={roundRect(x, 0, 28, 28, 6)} h={h} z={6} pink={i === bars.length - 1} />
      ))}
    </g>
  );
}

/**
 * Quality at scale: a pile of identical postcards, a little uneven like a real stack,
 * the top one with its address and a round pink seal of approval printed on it.
 */
function Pile() {
  const t = 2.4; // one card's thickness
  // Twelve cards, each a touch off square, like a real pile
  const tilts = [0.06, -0.04, 0.03, -0.05, 0.04, -0.02, 0.05, -0.03, 0.02, -0.04, 0.02, 0];
  const shifts: P[] = [[-3, 2], [2, -2], [-2, -1], [3, 2], [-1, 2], [2, 0], [-2, 1], [1, -2], [-1, 1], [2, 1], [-1, -1], [0, 0]];
  const top = tilts.length * t;
  const seal: P = [26, -10];
  const ring = (r: number) => closed(circle(seal[0], seal[1], r, 36));
  return (
    <g transform="translate(0 16)">
      {tilts.map((a, i) => (
        <Block key={i} pts={roundRect(shifts[i][0], shifts[i][1], 112, 74, 6, a)} h={t} z={i * t} />
      ))}
      {/* The address on the top card */}
      <Flat z={top} width={2} pts={[[-44, -24], [-12, -24]]} />
      <Flat z={top} pts={[[-44, -14], [-22, -14]]} />
      <Flat z={top} pts={[[-44, 12], [-8, 12]]} />
      <Flat z={top} pts={[[-44, 20], [-16, 20]]} />
      <Flat z={top} pts={[[-44, 28], [-24, 28]]} />
      {/* The seal: two rings and a check, printed on the card (in its plane, so it tilts
          with the card like the address), the check turned a little on the paper the
          way a stamp lands, so it still reads as a check from this angle */}
      <Flat z={top} pink width={1.6} pts={ring(18)} />
      <Flat z={top} pink pts={ring(14)} />
      <Flat z={top} pink width={2.4} pts={check(seal, CHECK_TURN)} />
    </g>
  );
}
