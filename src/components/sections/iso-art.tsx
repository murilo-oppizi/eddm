"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

// Line drawings of raised objects, seen from above at an angle (isometric), after
// Tailark's illustrations: flat shapes on the ground, pushed up into solid blocks, drawn
// in thin grey lines on white with one detail in the brand pink, every corner rounded.
// Each shape is a list of points on the ground; `Block` raises it, drawing only the faces
// that face you, nearest last, so nearer faces hide farther ones. The lines trace
// themselves in once, when the picture comes into view; on hover (of the card around it)
// the object lifts a little, and its one moving part answers: the key goes down, the
// postcard comes out of the slot, the bars rise, the pile fans out.

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

/** Lines drawn on an upright face that looks down-right (a fixed x): points as (y, z). */
function WallX({ pts, x, pink, width }: { pts: [number, number][]; x: number; pink?: boolean; width?: number }) {
  return <Stroke path={d(pts.map(([y, z]) => iso([x, y], z)))} pink={pink} width={width} />;
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

/** How far the pointer's hover has played, 0 (away) to 1 (on it), on a spring: the
 *  pictures read it to move their one part. */
const Hot = createContext(0);

/** Hover of the card around the picture (the nearest `.group`, else the picture's own
 *  box), as a springy 0 → 1. Under reduced motion it jumps. */
function useHot(ref: React.RefObject<SVGSVGElement | null>) {
  const [t, setT] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    const host = ref.current?.closest(".group") ?? ref.current?.parentElement;
    if (!host) return;
    let now = 0;
    let ctl: ReturnType<typeof animate> | undefined;
    const go = (to: number) => {
      ctl?.stop();
      if (reduce) {
        now = to;
        setT(to);
        return;
      }
      ctl = animate(now, to, {
        type: "spring",
        stiffness: 220,
        damping: 22,
        onUpdate: (v) => {
          now = v;
          setT(v);
        },
      });
    };
    const on = () => go(1);
    const off = () => go(0);
    host.addEventListener("pointerenter", on);
    host.addEventListener("pointerleave", off);
    return () => {
      ctl?.stop();
      host.removeEventListener("pointerenter", on);
      host.removeEventListener("pointerleave", off);
    };
  }, [ref, reduce]);
  return t;
}

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
  const ref = useRef<SVGSVGElement>(null);
  const hot = useHot(ref);
  return (
    <motion.svg
      ref={ref}
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
        <Hot.Provider value={hot}>
        {name === "agents" && <Keycap />}
        {name === "attention" && <MailSlot />}
        {name === "scans" && <Bars />}
        {name === "quality" && <Pile />}
        {name === "story-flyers" && <StoryFlyers />}
        {name === "story-pins" && <StoryPins />}
        {name === "story-channels" && <StoryChannels />}
        {name === "story-agent" && <StoryAgent />}
        </Hot.Provider>
      </g>
    </motion.svg>
  );
}

/** Agents: one big rounded key on a plate, a pink sparkle on its top; on hover it goes down. */
function Keycap() {
  const top = 26 - 7 * useContext(Hot);
  return (
    <g>
      <Block pts={roundRect(0, 0, 128, 128, 14)} h={6} />
      <Block pts={roundRect(0, 0, 84, 84, 14)} h={top - 6} z={6} />
      <Flat z={top} pts={closed(roundRect(0, 0, 66, 66, 10))} />
      <Flat z={top} pink width={1.6} pts={closed(sparkle(0, 0, 22))} />
    </g>
  );
}

/** Attention: one postcard, pushed halfway through a door's mail slot; its stamp in pink.
 *  On hover it comes out a little further, toward you. */
function MailSlot() {
  const face = 4; // the door's front face (it looks down-left)
  const plate = face + 3;
  const out = 12 * useContext(Hot); // how much more of the card shows
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
      <Block pts={roundRect(0, plate + 19 + out / 2, 44, 38 + out, 4)} h={2} z={20} />
      <Block pts={roundRect(13, plate + 29 + out, 9, 11, 1.5)} h={0.8} z={22} pink />
      <Flat z={22} pts={[[-16, plate + 18 + out], [2, plate + 18 + out]]} />
      <Flat z={22} pts={[[-16, plate + 26 + out], [-4, plate + 26 + out]]} />
      <Flat z={22} pts={[[-16, plate + 33 + out], [-8, plate + 33 + out]]} />
    </g>
  );
}

/** Measurable: three bars on a plate, rising; the tallest outlined in pink. On hover the
 *  results come in: each bar grows, the shorter ones more, one after another. */
function Bars() {
  const t = useContext(Hot);
  const grow = (i: number, by: number) => by * Math.max(0, Math.min(1.15, t * 1.3 - i * 0.15));
  const bars: [number, number][] = [
    [-42, 22 + grow(0, 14)],
    [0, 38 + grow(1, 11)],
    [42, 60 + grow(2, 8)],
  ];
  return (
    <g>
      <Block pts={roundRect(0, 0, 150, 56, 10)} h={6} />
      {/* An inset edge around the plate, and a tick under each bar (like an axis) */}
      <Flat z={6} pts={closed(roundRect(0, 0, 138, 44, 6))} />
      {bars.map(([x], i) => (
        <Flat key={i} z={6} pts={[[x - 6, 19], [x + 6, 19]]} />
      ))}
      {bars.map(([x, h], i) => (
        <g key={i}>
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
 * the top one with its address and a round pink seal of approval printed on it. On hover
 * the pile fans out a little, each card sliding back from the one under it.
 */
function Pile() {
  const fan = useContext(Hot);
  const t = 2.4; // one card's thickness
  // Twelve cards, each a touch off square, like a real pile
  const tilts = [0.06, -0.04, 0.03, -0.05, 0.04, -0.02, 0.05, -0.03, 0.02, -0.04, 0.02, 0];
  const shifts: P[] = [[-3, 2], [2, -2], [-2, -1], [3, 2], [-1, 2], [2, 0], [-2, 1], [1, -2], [-1, 1], [2, 1], [-1, -1], [0, 0]];
  const top = tilts.length * t;
  // Card i's slide: back and to the left, more the higher it is; the top card's print goes with it
  const slide = (i: number): P => [-1.6 * i * fan, -0.8 * i * fan];
  const [ox, oy] = slide(tilts.length - 1);
  const seal: P = [26 + ox, -10 + oy];
  const ring = (r: number) => closed(circle(seal[0], seal[1], r, 36));
  const on = (pts: P[]): P[] => pts.map(([x, y]) => [x + ox, y + oy]);
  return (
    <g transform="translate(0 16)">
      {tilts.map((a, i) => (
        <Block key={i} pts={roundRect(shifts[i][0] + slide(i)[0], shifts[i][1] + slide(i)[1], 112, 74, 6, a)} h={t} z={i * t} />
      ))}
      {/* The address on the top card */}
      <Flat z={top} width={2} pts={on([[-44, -24], [-12, -24]])} />
      <Flat z={top} pts={on([[-44, -14], [-22, -14]])} />
      <Flat z={top} pts={on([[-44, 12], [-8, 12]])} />
      <Flat z={top} pts={on([[-44, 20], [-16, 20]])} />
      <Flat z={top} pts={on([[-44, 28], [-24, 28]])} />
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
 * The stand a story scene stands on, a different one for each, in its shape and in what
 * it does: a piece of sidewalk, its paving joints, the flyers are dealt out on, a
 * two-step octagonal plinth, a belt whose rails
 * roll (the channels), a disc with an orbit circling it (the agent). The scene sits on
 * top, a little smaller, so the four read as a set without being the same.
 */
type StandKind = "paving" | "steps" | "belt" | "orbit";

/** Dashes that keep moving along a path (CSS, so it doesn't fight the draw-in). */
function Marching({ path, speed = 1.2 }: { path: string; speed?: number }) {
  return (
    <motion.path
      d={path}
      variants={fadeIn}
      className={line}
      strokeWidth={0.85}
      strokeDasharray="4 6"
      style={{ animation: `march ${speed}s linear infinite` }}
    />
  );
}

/** A regular octagon on the ground, flat sides along the ground's axes. */
const octagon = (r: number): P[] =>
  Array.from({ length: 8 }, (_, i) => {
    const t = (i / 8) * Math.PI * 2 + Math.PI / 8;
    return [r * Math.cos(t), r * Math.sin(t)] as P;
  });

function Stand({ kind, children, x = 0 }: { kind: StandKind; children: React.ReactNode; x?: number }) {
  let base: React.ReactNode = null;
  let lift = 6; // the height the scene stands at
  if (kind === "paving") {
    // Six paving slabs in one block: the joints between them, pressed into its top
    base = (
      <g>
        <Block pts={roundRect(0, 0, 164, 118, 8)} h={8} />
        <Flat z={8} pts={[[-27, -59], [-27, 59]]} />
        <Flat z={8} pts={[[27, -59], [27, 59]]} />
        <Flat z={8} pts={[[-82, 0], [82, 0]]} />
      </g>
    );
    lift = 8;
  } else if (kind === "steps") {
    base = (
      <g>
        <Block pts={octagon(98)} h={5} />
        <Block pts={octagon(84)} h={5} z={5} />
      </g>
    );
    lift = 10;
  } else if (kind === "belt") {
    // A belt along the row of things on it, two rails rolling
    const rot = -Math.PI / 4;
    const u: P = [Math.cos(rot), Math.sin(rot)];
    const v: P = [-u[1], u[0]];
    const rail = (k: number) => d([-92, 92].map((t) => iso([u[0] * t + v[0] * k, u[1] * t + v[1] * k], 8)));
    base = (
      <g>
        <Block pts={roundRect(0, 0, 210, 76, 30, rot, 16)} h={8} />
        <Marching path={rail(-30)} speed={0.9} />
        <Marching path={rail(30)} speed={0.9} />
      </g>
    );
    lift = 8;
  } else {
    const orbit = closed(circle(0, 0, 96, 96));
    base = (
      <g>
        <Marching path={d(orbit.map((p) => iso(p)))} speed={1.4} />
        <Block pts={circle(0, 0, 84, 72)} h={6} />
        <Flat z={6} pts={closed(circle(0, 0, 76, 72))} />
      </g>
    );
  }
  return (
    <g transform="translate(0 4) scale(0.86)">
      {base}
      <g transform={`translate(${x} ${-lift})`}>{children}</g>
    </g>
  );
}

/** 2014, flyering: flyers dealt out on the sidewalk, fanned from their near edge like a hand
 *  of cards, the top one straight and in pink; on hover the fan opens a little wider. */
function StoryFlyers() {
  const open = 1 + 0.45 * useContext(Hot);
  const n = 5;
  const w = 62;
  const l = 88;
  const pivot: P = [-6, 30]; // where the sheets' near edges meet
  const k = l / 2 - 8; // from that point to a sheet's center
  return (
    <Stand kind="paving">
      {Array.from({ length: n }, (_, i) => {
        // the top one sits straight; those under it fan out to one side
        const rot = (n - 1 - i) * 0.26 * open;
        return (
          <Drop key={i} delay={0.25 + i * 0.12}>
            <Paper cx={pivot[0] + k * Math.sin(rot)} cy={pivot[1] - k * Math.cos(rot)} z={i * 1.6} w={w} l={l} rot={rot} pink={i === n - 1} />
          </Drop>
        );
      })}
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
 *  head; it stands at x, y at height z, its ring on the ground, the pin `lift` above it. */
function Pin({ x, y, z = 0, lift = 0, pink }: { x: number; y: number; z?: number; lift?: number; pink?: boolean }) {
  const r = 9;
  const h = 19; // the head's center, above the tip
  const path = `M0 0C${-r * 0.35} ${-h * 0.35} ${-r} ${-h * 0.55} ${-r} ${-h}A${r} ${r} 0 1 1 ${r} ${-h}C${r} ${-h * 0.55} ${r * 0.35} ${-h * 0.35} 0 0Z`;
  return (
    <g>
      <Flat z={z} pts={closed(circle(x, y, 3.5, 20))} />
      <Facing x={x} y={y} z={z + lift} path={path} details={circlePath(0, -h, 3.6)} pink={pink} />
    </g>
  );
}

/** A point on the globe, on screen: its axis tilted, its north pole a little toward you,
 *  turned by `turn`; and whether it is on the side facing you. */
const GLOBE = { cx: 0, cy: -30, r: 44, tilt: -0.38, lean: 0.2 };
const onGlobe = (lat: number, lon: number, turn: number): [P, boolean] => {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180 + turn;
  const x0 = Math.cos(la) * Math.sin(lo);
  const y0 = Math.sin(la);
  const z0 = Math.cos(la) * Math.cos(lo);
  const y1 = y0 * Math.cos(GLOBE.lean) - z0 * Math.sin(GLOBE.lean);
  const z1 = y0 * Math.sin(GLOBE.lean) + z0 * Math.cos(GLOBE.lean);
  const x2 = x0 * Math.cos(GLOBE.tilt) - y1 * Math.sin(GLOBE.tilt);
  const y2 = x0 * Math.sin(GLOBE.tilt) + y1 * Math.cos(GLOBE.tilt);
  return [[GLOBE.cx + GLOBE.r * x2, GLOBE.cy - GLOBE.r * y2], z1 > 0];
};
/** A line on the globe's surface, only where it faces you: one path of its visible runs. */
const globeLine = (pts: [number, number][], turn: number) => {
  let out = "";
  let run: P[] = [];
  const flush = () => {
    if (run.length > 1) out += d(run);
    run = [];
  };
  for (const [lat, lon] of pts) {
    const [p, front] = onGlobe(lat, lon, turn);
    if (front) run.push(p);
    else flush();
  }
  flush();
  return out;
};

/** Growing, 12+ countries: a desk globe, its lines of latitude and longitude, pins dropping
 *  onto it one after another: New York, São Paulo, London, the newest in pink. On
 *  hover the globe turns a little. */
function StoryPins() {
  const turn = 0.5 + 0.4 * useContext(Hot);
  const { cx, cy, r, tilt } = GLOBE;
  const steps = (a: number, b: number, n = 48) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
  const grid =
    [-50, -25, 0, 25, 50].map((lat) => globeLine(steps(-180, 180, 96).map((lon) => [lat, lon] as [number, number]), turn)).join("") +
    steps(0, 150, 5).map((lon) => globeLine(steps(-90, 90).map((lat) => [lat, lon] as [number, number]).concat(steps(90, -90).map((lat) => [lat, lon + 180] as [number, number])), turn)).join("");
  // The frame: a half ring round the globe's west side, pole to pole, and a knob at each
  const north: P = [-Math.sin(tilt), -Math.cos(tilt)];
  const ring = (rr: number) => steps(0, Math.PI).map((t) => {
    const a = Math.atan2(north[1], north[0]) - t;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)] as P;
  });
  const band = d([...ring(r + 5), ...ring(r + 8.5).reverse()], true);
  const south: P = [cx - north[0] * (r + 7), cy - north[1] * (r + 7)];
  const knob = (p: P) => circlePath(p[0], p[1], 3);
  const pins: [number, number][] = [
    [40.7, -74], // New York
    [-23.5, -46.6], // São Paulo
    [51.5, 0], // London
  ];
  const pin = (s = 0.8) =>
    `M0 0C${-9 * s * 0.35} ${-19 * s * 0.35} ${-9 * s} ${-19 * s * 0.55} ${-9 * s} ${-19 * s}A${9 * s} ${9 * s} 0 1 1 ${9 * s} ${-19 * s}C${9 * s} ${-19 * s * 0.55} ${9 * s * 0.35} ${-19 * s * 0.35} 0 0Z`;
  return (
    <g transform="translate(0 4)">
      {/* The foot, under the frame's lower end, and the stem up to it */}
      <g transform={`translate(${south[0].toFixed(2)} ${(south[1] + 22).toFixed(2)})`}>
        <Block pts={circle(0, 0, 30, 64)} h={6} />
        <Flat z={6} pts={closed(circle(0, 0, 22, 64))} />
        <Block pts={circle(0, 0, 4, 24)} h={18} z={6} />
      </g>
      <Face path={band} />
      <Stroke path={band} />
      {/* The globe: a ball, its lines, the pins */}
      <Face path={circlePath(cx, cy, r)} />
      <Stroke path={grid} />
      <Stroke path={circlePath(cx, cy, r)} />
      {[south, [cx + north[0] * (r + 7), cy + north[1] * (r + 7)] as P].map((p, i) => (
        <g key={i}>
          <Face path={knob(p)} />
          <Stroke path={knob(p)} />
        </g>
      ))}
      {pins.map(([lat, lon], i) => {
        const [[x, y], front] = onGlobe(lat, lon, turn);
        if (!front) return null;
        return (
          <Drop key={i} delay={0.4 + i * 0.22}>
            <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
              <Face path={pin()} />
              <Stroke path={pin()} pink={i === pins.length - 1} />
              <Stroke path={circlePath(0, -19 * 0.8, 3)} pink={i === pins.length - 1} />
            </g>
          </Drop>
        );
      })}
    </g>
  );
}

/** More channels, one platform: a flyer, a letter and a parcel landing in a row, one
 *  after another; the parcel's tape in pink. */
function StoryChannels() {
  // Their centers, placed in a row across the picture
  const flyer: P = [-42, 30];
  const env: P = [-2, 6];
  const box = { cx: 28, cy: -28, w: 40, d: 36, h: 32 };
  const ew = 44;
  const ed = 30;
  return (
    <Stand kind="belt">
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
      {/* The parcel: a shipping box, sharp-cornered; a band of pink tape over the top and
          down the front, a shipping label with a barcode on its side */}
      <Drop delay={0.7}>
        <Block pts={roundRect(box.cx, box.cy, box.w, box.d, 1.2)} h={box.h} />
        <Block pts={roundRect(box.cx, box.cy, 8, box.d, 0.4)} h={0.6} z={box.h} pink />
        <Wall
          y={box.cy + box.d / 2}
          pink
          pts={[
            [box.cx - 4, box.h],
            [box.cx - 4, box.h - 13],
            [box.cx + 4, box.h - 13],
            [box.cx + 4, box.h],
          ]}
        />
        {(() => {
          const x = box.cx + box.w / 2;
          const y0 = box.cy - 12;
          const y1 = box.cy + 10;
          return (
            <g>
              <WallX x={x} pts={[[y0, 7], [y1, 7], [y1, 22], [y0, 22], [y0, 7]]} />
              <WallX x={x} width={1.6} pts={[[y0 + 4, 18.5], [y0 + 14, 18.5]]} />
              <WallX x={x} pts={[[y0 + 4, 15], [y0 + 11, 15]]} />
              {[0, 2, 3, 5, 7, 8, 10, 12, 13].map((k) => (
                <WallX key={k} x={x} pts={[[y0 + 4 + k, 9.5], [y0 + 4 + k, 12.5]]} />
              ))}
            </g>
          );
        })()}
      </Drop>
    </Stand>
  );
}

/** Today, agents: an AI agent at work. A key with a pink sparkle in the middle, joined by
 *  dashed lines to what it handles (where to mail, the postcard, the results), pink dots
 *  running out along the lines, again and again. */
function StoryAgent() {
  const hub = 21; // half the key's base
  const keyTop = 18 - 5 * useContext(Hot); // on hover the key goes down, like the Agents card's
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
    <Stand kind="orbit">
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
      <Block pts={roundRect(0, 0, 30, 30, 8)} h={keyTop - 5} z={5} />
      <Flat z={keyTop} pink width={1.6} pts={closed(sparkle(0, 0, 9.5))} />
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
