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

/** A flyer lying at height z: rounded, with a headline, a picture block and an offer. */
function Flyer({ cx, cy, z, rot = 0, pink, t = 2.4 }: { cx: number; cy: number; z: number; rot?: number; pink?: boolean; t?: number }) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  // A point on the flyer, from its center: a across (down-right), b down it (down-left)
  const at = (a: number, b: number): P => [cx + a * c - b * s, cy + a * s + b * c];
  const top = z + t;
  return (
    <g>
      <Block pts={roundRect(cx, cy, 64, 90, 6, rot)} h={t} z={z} pink={pink} />
      <Flat z={top} pink={pink} pts={closed([at(-24, -36), at(24, -36), at(24, -6), at(-24, -6)])} />
      <Flat z={top} width={2} pink={pink} pts={[at(-24, 6), at(14, 6)]} />
      <Flat z={top} pink={pink} pts={[at(-24, 16), at(4, 16)]} />
      <Flat z={top} pink={pink} pts={[at(-24, 30), at(-6, 30)]} />
    </g>
  );
}

/** 2014, flyering: a neat stack of flyers, the top one lifting off in pink, floating. */
function StoryFlyers() {
  const t = 2.4;
  const n = 6;
  return (
    <g transform="translate(-6 30)">
      {Array.from({ length: n }, (_, i) => (
        <Block key={i} pts={roundRect(-18 + (i % 2) * 2, 6 - (i % 3), 64, 90, 6, 0.03 * ((i % 3) - 1))} h={t} z={i * t} />
      ))}
      <Flyer cx={-18} cy={6} z={(n - 1) * t} />
      <Drop delay={0.35}>
        <Bob>
          <Flyer cx={30} cy={-34} z={44} rot={-0.18} pink />
        </Bob>
      </Drop>
    </g>
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

/** A map pin, facing you: the classic teardrop, its tip on the ground, a ring in its head. */
function Pin({ x, y, pink }: { x: number; y: number; pink?: boolean }) {
  const r = 10;
  const h = 30; // the head's center, above the tip
  const path = `M0 0C${-r * 0.55} ${-h * 0.42} ${-r} ${-h * 0.62} ${-r} ${-h}A${r} ${r} 0 1 1 ${r} ${-h}C${r} ${-h * 0.62} ${r * 0.55} ${-h * 0.42} 0 0Z`;
  return (
    <g>
      <Flat pts={closed(circle(x, y, 4, 20))} />
      <Facing x={x} y={y} path={path} details={circlePath(0, -h, 4)} pink={pink} />
    </g>
  );
}

/** Growing, 12+ countries: pins dropping onto a plate one after another, along a dashed
 *  route; the newest in pink. */
function StoryPins() {
  const pins: P[] = [
    [-50, 12],
    [-14, 44],
    [-4, -34],
    [46, -2],
  ];
  // Far to near, so nearer pins cover farther ones
  const order = pins.map((p, i) => ({ p, i })).sort((a, b) => a.p[0] + a.p[1] - (b.p[0] + b.p[1]));
  const dash = (a: P, b: P) =>
    Array.from({ length: 7 }, (_, k) => {
      const t0 = k / 7;
      const t1 = t0 + 0.5 / 7;
      return [
        [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0],
        [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1],
      ] as P[];
    });
  return (
    <g transform="translate(0 30)">
      <Block pts={roundRect(0, 4, 170, 130, 16)} h={6} />
      <g transform="translate(0 -6)">
        {pins.slice(1).flatMap((b, i) => dash(pins[i], b).map((seg, k) => <Flat key={`${i}-${k}`} z={0} pts={seg} />))}
        {order.map(({ p: [x, y], i }) => (
          <Drop key={i} delay={0.3 + i * 0.22}>
            <Pin x={x} y={y} pink={i === pins.length - 1} />
          </Drop>
        ))}
      </g>
    </g>
  );
}

/** More channels, one platform: a flyer, a letter and a parcel landing side by side on
 *  one plate; the parcel's tape in pink. */
function StoryChannels() {
  return (
    <g transform="translate(0 26)">
      <Block pts={roundRect(0, 0, 196, 92, 16)} h={6} />
      {/* The flyer */}
      <Drop delay={0.3}>
        <g transform="translate(0 0)">
          <Block pts={roundRect(-58, 2, 38, 54, 4)} h={2} z={6} />
          <Flat z={8} pts={closed([[-72, -20], [-44, -20], [-44, -4], [-72, -4]] as P[])} />
          <Flat z={8} pts={[[-72, 6], [-50, 6]]} />
          <Flat z={8} pts={[[-72, 14], [-58, 14]]} />
        </g>
      </Drop>
      {/* The letter: an envelope, its flap folded, a little stamp */}
      <Drop delay={0.5}>
        <Block pts={roundRect(-4, 4, 50, 36, 4)} h={3} z={6} />
        <Flat z={9} pts={[[-29, -14], [-4, 6], [21, -14]]} />
        <Block pts={roundRect(12, -6, 8, 9, 1.5)} h={0.8} z={9} />
      </Drop>
      {/* The parcel, taped in pink */}
      <Drop delay={0.7}>
        <Block pts={roundRect(58, 2, 40, 40, 4)} h={30} z={6} />
        <Flat z={36} pink width={2.4} pts={[[58, -18], [58, 22]]} />
        <Flat z={36} pink width={2.4} pts={[[38, 2], [78, 2]]} />
      </Drop>
    </g>
  );
}

/** Today, agents: a tablet showing a street grid and the route an agent planned, in
 *  pink, its stops along it; the agent's sparkle floating upright above. */
function StoryAgent() {
  const stops: P[] = [
    [-48, 26],
    [-48, -4],
    [-8, -4],
    [-8, 26],
    [32, 26],
    [32, -24],
  ];
  // A four-pointed sparkle, facing you, with a little one beside it
  const star = (cx: number, cy: number, r: number) =>
    `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;
  return (
    <g transform="translate(-4 24)">
      <Block pts={roundRect(0, 0, 176, 120, 16)} h={7} />
      <Flat z={7} pts={closed(roundRect(0, 0, 160, 104, 10))} />
      {/* The street grid, following the route's streets */}
      {[-34, -4, 26].map((y) => (
        <Flat key={`h${y}`} z={7} pts={[[-72, y], [72, y]]} />
      ))}
      {[-48, -8, 32].map((x) => (
        <Flat key={`v${x}`} z={7} pts={[[x, -46], [x, 46]]} />
      ))}
      {/* The route the agent planned, along the streets, and its stops */}
      <Flat z={7} pink width={2.6} pts={stops} />
      {[stops[0], stops[stops.length - 1]].map(([x, y], i) => (
        <Block key={i} pts={circle(x, y, 5, 20)} h={3} z={7} pink />
      ))}
      <Drop delay={0.5}>
        <Bob distance={5}>
          <Facing x={44} y={-30} z={46} path={star(0, 0, 16)} pink />
          <Facing x={44} y={-30} z={46} path={star(-22, -14, 7)} pink />
        </Bob>
      </Drop>
    </g>
  );
}

