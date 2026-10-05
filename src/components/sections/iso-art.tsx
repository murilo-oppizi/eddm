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
  // Widths are in the drawing's own units, not screen pixels: the draw-in animation
  // measures the line in those units, and a screen-pixel width (non-scaling-stroke)
  // makes Chrome stop each line short of its end, leaving gaps when the drawing is
  // shown larger than its viewBox.
  return <motion.path d={path} variants={drawIn} className={pink ? accent : line} strokeWidth={width * 0.85} />;
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
  // All the surfaces first (the sides that face you, then the top), as one white shape,
  // so no surface paints over another's edge; then every line on top, each run of
  // facing sides as one continuous line, so the outlines join up.
  const sideFaces = pts
    .map((a, i) => ({ a, b: pts[(i + 1) % n], i }))
    .filter(({ i }) => faces[i])
    .map(({ a, b }) => d([iso(a, z), iso(b, z), iso(b, z + h), iso(a, z + h)], true))
    .join("");
  const runs: number[][] = [];
  const start = faces.findIndex((f, i) => f && !faces[(i - 1 + n) % n]);
  if (start >= 0) {
    let run: number[] | null = null;
    for (let k = 0; k < n; k++) {
      const i = (start + k) % n;
      if (faces[i]) {
        if (!run) run = [i];
        run.push((i + 1) % n);
      } else if (run) {
        runs.push(run);
        run = null;
      }
    }
    if (run) runs.push(run);
  } else if (faces.every(Boolean)) {
    runs.push([...pts.keys(), 0]);
  }
  const uprights = pts.map((_, i) => i).filter((i) => upright(i));
  const top = d(pts.map((p) => iso(p, z + h)), true);

  return (
    <g>
      <Face path={sideFaces + top} />
      {runs.map((r, k) => (
        <Stroke key={`r${k}`} path={d(r.map((i) => iso(pts[i], z)))} pink={pink} />
      ))}
      {uprights.map((i) => (
        <Stroke key={`u${i}`} path={d([iso(pts[i], z), iso(pts[i], z + h)])} pink={pink} />
      ))}
      <Stroke path={top} pink={pink} />
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
  const sideFaces = profile
    .map((a, i) => ({ a, b: profile[(i + 1) % n], i }))
    .filter(({ i }) => faces[i])
    .map(({ a, b }) => d([at(y0, a), at(y0, b), at(y1, b), at(y1, a)], true))
    .join("");
  const front = d(profile.map((p) => at(y1, p)), true);
  return (
    <g>
      <Face path={sideFaces + front} />
      {profile.map((a, i) => (faces[i] ? <Stroke key={`s${i}`} path={d([at(y0, a), at(y0, profile[(i + 1) % n])])} pink={pink} /> : null))}
      {profile.map((a, i) => (edge(i) ? <Stroke key={`e${i}`} path={d([at(y0, a), at(y1, a)])} pink={pink} /> : null))}
      <Stroke path={front} pink={pink} />
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

/**
 * A check mark as a solid shape (a thick tick, outlined, as isometric icon sets draw it)
 * lying on a card around `c`: drawn along the card (x across, +y down the card), then
 * turned by `turn` radians on the card's surface. Its two edges show the perspective.
 */
const checkShape = ([cx, cy]: P, turn: number, scale = 0.85): P[] => {
  const t = 1.9 * scale;
  const A: P = [-9.5 * scale, -1 * scale];
  const B: P = [-3 * scale, 5.5 * scale];
  const C: P = [10.5 * scale, -8.5 * scale];
  const unit = ([x, y]: P): P => {
    const l = Math.hypot(x, y);
    return [x / l, y / l];
  };
  const left = ([x, y]: P): P => [y, -x];
  const n1 = left(unit([B[0] - A[0], B[1] - A[1]]));
  const n2 = left(unit([C[0] - B[0], C[1] - B[1]]));
  // The joint at B, mitred, on both sides
  const m = unit([n1[0] + n2[0], n1[1] + n2[1]]);
  const k = t / (m[0] * n1[0] + m[1] * n1[1]);
  const pts: P[] = [
    [A[0] + n1[0] * t, A[1] + n1[1] * t],
    [B[0] + m[0] * k, B[1] + m[1] * k],
    [C[0] + n2[0] * t, C[1] + n2[1] * t],
    [C[0] - n2[0] * t, C[1] - n2[1] * t],
    [B[0] - m[0] * k, B[1] - m[1] * k],
    [A[0] - n1[0] * t, A[1] - n1[1] * t],
  ];
  const cs = Math.cos(turn);
  const sn = Math.sin(turn);
  const turned = pts.map(([x, y]) => [x * cs - y * sn, x * sn + y * cs] as P);
  // Centered on c: the middle of its bounds, not the corner it was drawn from
  const xs = turned.map((p) => p[0]);
  const ys = turned.map((p) => p[1]);
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const my = (Math.min(...ys) + Math.max(...ys)) / 2;
  return turned.map(([x, y]) => [cx + x - mx, cy + y - my]);
};
const CHECK_TURN = -0.38; // radians: along the card it reads as an "L"; turned a little, as a check

/* ------------------------------ The pictures ----------------------------- */

export type IsoArtName =
  | "agents"
  | "attention"
  | "scans"
  | "quality"
  // the story's scenes
  | "story-flyers"
  | "story-pins"
  | "story-channels"
  | "story-agent";

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
        {name === "story-flyers" && <StoryFlyers />}
        {name === "story-pins" && <StoryPins />}
        {name === "story-channels" && <StoryChannels />}
        {name === "story-agent" && <StoryAgent />}
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
      {/* An inset edge around the plate, and a tick under each bar (like an axis) */}
      <Flat z={6} pts={closed(roundRect(0, 0, 138, 44, 6))} />
      {bars.map(([x]) => (
        <Flat key={x} z={6} pts={[[x - 6, 19], [x + 6, 19]]} />
      ))}
      {bars.map(([x, h], i) => (
        <g key={x}>
          <Block pts={roundRect(x, 0, 28, 28, 6)} h={h} z={6} pink={i === bars.length - 1} />
          {/* An inset on each bar's top, like the keycap's */}
          <Flat z={6 + h} pink={i === bars.length - 1} pts={closed(roundRect(x, 0, 16, 16, 4))} />
        </g>
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
      {/* The seal: two rings printed on the card, and a check lying on it as a small solid
          tick, aligned to the card like the address (as isometric icon sets draw it) */}
      <Flat z={top} pink width={1.6} pts={ring(18)} />
      <Flat z={top} pink pts={ring(14)} />
      <Block pts={checkShape(seal, CHECK_TURN)} h={1.4} z={top} pink />
    </g>
  );
}

/* ------------------------------ The story's scenes ------------------------------ */

/** Drops its contents in from above, `delay` seconds after the picture comes into view. */
function Drop({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <motion.g
      variants={{
        hidden: { y: -26, opacity: 0 },
        shown: { y: 0, opacity: 1, transition: { delay, type: "spring", stiffness: 260, damping: 18 } },
      }}
    >
      {children}
    </motion.g>
  );
}

/** A gentle, endless bob (CSS, so it doesn't interrupt the drawing-in). */
function Bob({ children, distance = 6 }: { children: React.ReactNode; distance?: number }) {
  return (
    <g
      className="animate-[float-y_3.6s_ease-in-out_infinite] motion-reduce:animate-none"
      style={{ "--float-distance": `${distance}px` } as React.CSSProperties}
    >
      {children}
    </g>
  );
}

/** A sheet of paper at height z: a flyer or a postcard, sharp-cornered, thin, with a
 *  picture (hills and a sun) and lines of text, so it reads as print, not a screen.
 *  `w` × `l` on the ground, `rot` turned on the ground. */
function Paper({
  cx,
  cy,
  z,
  w = 60,
  l = 84,
  rot = 0,
  pink,
}: {
  cx: number;
  cy: number;
  z: number;
  w?: number;
  l?: number;
  rot?: number;
  pink?: boolean;
}) {
  const t = 1.4;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  // A point on the sheet from its center: a across it (down-right), b along it (down-left)
  const at = (a: number, b: number): P => [cx + a * c - b * s, cy + a * s + b * c];
  const top = z + t;
  const pw = w / 2 - 6; // the picture's half width
  const py0 = -l / 2 + 6;
  const py1 = py0 + l * 0.42;
  const sun = at(pw * 0.45, py0 + (py1 - py0) * 0.3);
  return (
    <g>
      <Block pts={roundRect(cx, cy, w, l, 1.5, rot)} h={t} z={z} pink={pink} />
      <Flat z={top} pink={pink} pts={closed([at(-pw, py0), at(pw, py0), at(pw, py1), at(-pw, py1)])} />
      {/* Hills and a sun in the picture */}
      <Flat
        z={top}
        pink={pink}
        pts={[at(-pw, py1 - 4), at(-pw * 0.35, py0 + (py1 - py0) * 0.45), at(pw * 0.1, py1 - 10), at(pw * 0.5, py0 + (py1 - py0) * 0.6), at(pw, py1 - 6)]}
      />
      <Flat z={top} pink={pink} pts={closed(circle(sun[0], sun[1], 3.2, 16))} />
      {/* The headline and the text */}
      <Flat z={top} width={2} pink={pink} pts={[at(-pw, py1 + 9), at(pw * 0.55, py1 + 9)]} />
      <Flat z={top} pink={pink} pts={[at(-pw, py1 + 17), at(pw * 0.2, py1 + 17)]} />
      <Flat z={top} pink={pink} pts={[at(-pw, py1 + 24), at(-pw * 0.2, py1 + 24)]} />
    </g>
  );
}

/**
 * The stand every story scene stands on: a round base (round, so it can't read as a
 * phone), the scene a little smaller on top of it, so the four sit as one set.
 */
const STAND_R = 88;
const STAND_H = 6;
function Stand({ children, x = 0 }: { children: React.ReactNode; x?: number }) {
  return (
    <g transform="translate(0 4) scale(0.86)">
      <Block pts={circle(0, 0, STAND_R, 72)} h={STAND_H} />
      <Flat z={STAND_H} pts={closed(circle(0, 0, STAND_R - 9, 72))} />
      <g transform={`translate(${x} ${-STAND_H})`}>{children}</g>
    </g>
  );
}

/** 2014, flyering: a stack of printed flyers, the top one lifting off in pink, floating. */
function StoryFlyers() {
  const t = 1.4;
  const n = 7;
  return (
    <Stand x={-6}>
      {Array.from({ length: n - 1 }, (_, i) => (
        <Block key={i} pts={roundRect(-18 + (i % 2) * 1.5, 6 - (i % 3), 60, 84, 1.5, 0.025 * ((i % 3) - 1))} h={t} z={i * t} />
      ))}
      <Paper cx={-18} cy={6} z={(n - 1) * t} />
      <Drop delay={0.35}>
        <Bob>
          <Paper cx={30} cy={-34} z={44} rot={-0.18} pink />
        </Bob>
      </Drop>
    </Stand>
  );
}

/**
 * A flat shape that faces you (not laid in the scene's perspective), standing on the
 * ground point x, y at height z: how isometric illustrations draw markers and icons.
 * `path` is in screen units, its anchor at 0,0.
 */
function Facing({ x, y, z = 0, path, details, pink }: { x: number; y: number; z?: number; path: string; details?: string; pink?: boolean }) {
  const [sx, sy] = iso([x, y], z);
  return (
    <g transform={`translate(${sx.toFixed(2)} ${sy.toFixed(2)})`}>
      <Face path={path} />
      <Stroke path={path} pink={pink} />
      {details && <Stroke path={details} pink={pink} />}
    </g>
  );
}

const circlePath = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

/** A map pin, facing you: a round head on a short point (not too tall), a ring in its
 *  head; it stands at x, y at height z. */
function Pin({ x, y, z = 0, pink }: { x: number; y: number; z?: number; pink?: boolean }) {
  const r = 9;
  const h = 19; // the head's center, above the tip
  const path = `M0 0C${-r * 0.35} ${-h * 0.35} ${-r} ${-h * 0.55} ${-r} ${-h}A${r} ${r} 0 1 1 ${r} ${-h}C${r} ${-h * 0.55} ${r * 0.35} ${-h * 0.35} 0 0Z`;
  return (
    <g>
      <Flat z={z} pts={closed(circle(x, y, 3.5, 20))} />
      <Facing x={x} y={y} z={z} path={path} details={circlePath(0, -h, 3.6)} pink={pink} />
    </g>
  );
}

/** Growing, 12+ countries: a folded paper map (four panels, zigzag), pins dropping onto
 *  it one after another along a dashed route; the newest in pink. */
function StoryPins() {
  const xs = [-62, -31, 0, 31, 62]; // the folds, across the map
  const zs = [0, 9, 0, 9, 0];
  const Y = 42; // half the map's depth
  const zAt = (x: number) => {
    const i = Math.max(0, Math.min(xs.length - 2, xs.findIndex((v, k) => x >= v && x <= xs[k + 1])));
    const f = (x - xs[i]) / (xs[i + 1] - xs[i]);
    return zs[i] + (zs[i + 1] - zs[i]) * Math.max(0, Math.min(1, f));
  };
  const onMap = (pts: P[]) => d(pts.map(([x, y]) => iso([x, y], zAt(x))));
  // A line across the map that follows its folds
  const across = (pts: P[]) => {
    const out: P[] = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const [a, b] = [pts[k], pts[k + 1]];
      out.push(a);
      for (const fx of xs) if ((fx - a[0]) * (fx - b[0]) < 0) out.push([fx, a[1] + ((b[1] - a[1]) * (fx - a[0])) / (b[0] - a[0])]);
    }
    out.push(pts[pts.length - 1]);
    return out.sort((p, q) => p[0] - q[0]);
  };
  const pins: P[] = [
    [-48, 15],
    [-16, -22],
    [18, 18],
    [46, -12],
  ];
  const dashes = pins.slice(1).flatMap((b, i) => {
    const a = pins[i];
    return Array.from({ length: 6 }, (_, k) => {
      const t0 = k / 6;
      const t1 = t0 + 0.5 / 6;
      return [
        [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0],
        [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1],
      ] as P[];
    });
  });
  return (
    <Stand>
      {/* The panels, far to near */}
      {xs.slice(0, -1).map((x0, i) => {
        const x1 = xs[i + 1];
        const panel = d([iso([x0, -Y], zs[i]), iso([x1, -Y], zs[i + 1]), iso([x1, Y], zs[i + 1]), iso([x0, Y], zs[i])], true);
        return (
          <g key={i}>
            <Face path={panel} />
            <Stroke path={panel} />
          </g>
        );
      })}
      {/* Roads and a river, printed on the map */}
      <Stroke path={onMap(across([[-62, 28], [62, 25]]))} />
      <Stroke path={onMap(across([[-62, -32], [-8, -7], [62, -30]]))} />
      <Stroke path={onMap(across([[-62, -5], [-25, 3], [16, -3], [62, 7]]))} />
      {dashes.map((seg, k) => (
        <Stroke key={k} path={onMap(seg)} />
      ))}
      {pins.map(([x, y], i) => (
        <Drop key={i} delay={0.3 + i * 0.22}>
          <Pin x={x} y={y} z={zAt(x)} pink={i === pins.length - 1} />
        </Drop>
      ))}
    </Stand>
  );
}

/** More channels, one platform: a flyer, a letter and a parcel landing in a row, one
 *  after another; the parcel's tape in pink. */
function StoryChannels() {
  // Their centers, placed in a row across the picture
  const flyer: P = [-42, 30];
  const env: P = [-2, 6];
  const box = { cx: 28, cy: -28, w: 42, d: 42, h: 30 };
  const ew = 44;
  const ed = 30;
  return (
    <Stand>
      <Drop delay={0.3}>
        <Paper cx={flyer[0]} cy={flyer[1]} z={0} w={34} l={48} rot={0.05} />
      </Drop>
      {/* The letter: an envelope, its flap folded to a point in the middle */}
      <Drop delay={0.5}>
        <Block pts={roundRect(env[0], env[1], ew, ed, 2.5)} h={2.5} />
        <Flat
          z={2.5}
          pts={[
            [env[0] - ew / 2 + 2.5, env[1] - ed / 2 + 2.5],
            [env[0], env[1] + 2],
            [env[0] + ew / 2 - 2.5, env[1] - ed / 2 + 2.5],
          ]}
        />
      </Drop>
      {/* The parcel: one band of pink tape over the top and down the near side */}
      <Drop delay={0.7}>
        <Block pts={roundRect(box.cx, box.cy, box.w, box.d, 3)} h={box.h} />
        <Flat z={box.h} pink width={3} pts={[[box.cx, box.cy - box.d / 2 + 1], [box.cx, box.cy + box.d / 2]]} />
        <Wall y={box.cy + box.d / 2} pink width={3} pts={[[box.cx, box.h], [box.cx, 1]]} />
      </Drop>
    </Stand>
  );
}

/** Today, agents: an AI agent at work. A key with a pink sparkle in the middle, joined by
 *  dashed lines to what it handles (where to mail, the postcard, the results), pink dots
 *  running out along the lines, again and again. */
function StoryAgent() {
  const hub = 21; // half the key's base
  // Where to mail (left), the postcard (far right), the results (near right)
  const targets: P[] = [
    [-50, 40],
    [6, -56],
    [58, -3],
  ];
  // Each line, from the key's edge to just short of the thing it reaches
  const lines = targets.map(([x, y]) => {
    const len = Math.hypot(x, y);
    const u: P = [x / len, y / len];
    const from: P = [u[0] * (hub + 4), u[1] * (hub + 4)];
    const to: P = [x - u[0] * 16, y - u[1] * 16];
    return { from, to };
  });
  return (
    <Stand>
      {/* The dashed lines on the ground */}
      {lines.map(({ from, to }, i) =>
        Array.from({ length: 6 }, (_, k) => {
          const t0 = k / 6;
          const t1 = t0 + 0.5 / 6;
          return (
            <Flat
              key={`${i}-${k}`}
              pts={[
                [from[0] + (to[0] - from[0]) * t0, from[1] + (to[1] - from[1]) * t0],
                [from[0] + (to[0] - from[0]) * t1, from[1] + (to[1] - from[1]) * t1],
              ]}
            />
          );
        })
      )}
      {/* What the agent handles: a postcard (far), a pin (left), results (near) */}
      <Drop delay={0.5}>
        <Paper cx={targets[1][0]} cy={targets[1][1]} z={0} w={30} l={42} rot={0.1} />
      </Drop>
      <Drop delay={0.6}>
        <Pin x={targets[0][0]} y={targets[0][1]} />
      </Drop>
      {/* The agent: a raised key, a pink sparkle on it */}
      <Block pts={roundRect(0, 0, hub * 2, hub * 2, 10)} h={5} />
      <Block pts={roundRect(0, 0, 30, 30, 8)} h={13} z={5} />
      <Flat z={18} pink width={1.6} pts={closed(sparkle(0, 0, 9.5))} />
      <Drop delay={0.7}>
        <g>
          {[
            [-8, 8],
            [0, 14],
            [8, 22],
          ].map(([dx, h], i) => (
            <Block key={i} pts={roundRect(targets[2][0] + dx, targets[2][1] - dx, 7, 7, 1.5)} h={h} />
          ))}
        </g>
      </Drop>
      {/* The agent at work: pink dots running out along each line */}
      {lines.map(({ from, to }, i) => {
        const a = iso(from);
        const b = iso(to);
        return (
          <motion.circle
            key={i}
            r={2.6}
            className="fill-primary"
            initial={false}
            animate={{ cx: [a[0], b[0]], cy: [a[1], b[1]], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, delay: 1 + i * 0.5, repeat: Infinity, repeatDelay: 0.4, ease: "easeInOut" }}
          />
        );
      })}
    </Stand>
  );
}
