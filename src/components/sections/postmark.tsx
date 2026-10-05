"use client";

import { useId } from "react";
import { motion } from "motion/react";

import { OPPIZI_SYMBOL_PATHS } from "@/components/site/logo";
import { about } from "@/content/site";

// The About hero's picture: a pink postage stamp (306M+ pieces delivered, a street of
// doors) postmarked in dark ink with today's date, the way real mail is cancelled: a
// round date stamp (place around the top, a line around the bottom, the date stacked in
// the middle) and its wavy "killer" lines running across the stamp. After the postmarks
// on Dribbble and real circular date stamps: ink, not an object (no fill, no shadow),
// a little crooked and worn. It lands once, on coming into view: the stamp settles, the
// postmark thumps down, the waves run out across the stamp.

const W = 440;
const H = 380;
const ease = [0.22, 1, 0.36, 1] as const;

// The stamp: its box and its tilt
const S = { x: 40, y: 44, w: 196, h: 256, tilt: -4 };
const SC = { x: S.x + S.w / 2, y: S.y + S.h / 2 };
// The postmark: its center, rings and tilt
const C = { x: 312, y: 226, r: 86, inner: 67, tilt: -11 };

/** The perforations: a hole every `gap` along each edge, centered on it. */
function holes(r: number, gap: number) {
  const out: [number, number][] = [];
  const nx = Math.round(S.w / gap);
  const ny = Math.round(S.h / gap);
  for (let i = 0; i <= nx; i++) {
    const x = S.x + (i * S.w) / nx;
    out.push([x, S.y], [x, S.y + S.h]);
  }
  for (let j = 1; j < ny; j++) {
    const y = S.y + (j * S.h) / ny;
    out.push([S.x, y], [S.x + S.w, y]);
  }
  return out.map(([x, y]) => ({ x, y, r }));
}

/** A row of little houses, each with its door, along the stamp's foot. */
function Street({ x0, y, n, w }: { x0: number; y: number; n: number; w: number }) {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">
      <path d={`M${x0 - 8} ${y}H${x0 + n * w + 8 - 6}`} />
      {Array.from({ length: n }, (_, i) => {
        const x = x0 + i * w;
        const bw = w - 6;
        const bh = i % 2 ? 44 : 56;
        return (
          <g key={i}>
            <path d={`M${x} ${y}V${y - bh}L${x + bw / 2} ${y - bh - 14}L${x + bw} ${y - bh}V${y}`} />
            <path d={`M${x + bw / 2 - 4} ${y}V${y - 13}H${x + bw / 2 + 4}V${y}`} />
            <path d={`M${x + 6} ${y - bh + 10}h7v7h-7z M${x + bw - 13} ${y - bh + 10}h7v7h-7z`} />
          </g>
        );
      })}
    </g>
  );
}

export function Postmark() {
  const { hero } = about;
  const id = useId().replace(/:/g, "");
  const mask = `${id}-perf`;
  const ink = `${id}-ink`;
  const top = `${id}-top`;
  const bottom = `${id}-bottom`;
  const paper = `${id}-paper`;

  // Postmarked today (the build's date until the page wakes up, then the visitor's)
  const today = new Date();
  const month = today.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = String(today.getDate()).padStart(2, "0");
  const year = String(today.getFullYear());

  const ri = (C.inner + C.r) / 2; // the text runs between the two rings
  return (
    <svg
      viewBox={`10 22 ${W - 14} ${H - 52}`} // trimmed to the drawing, so it sits centered
      role="img"
      aria-label={`A stamp: ${hero.stampValue} ${hero.stampLabel}. Postmarked ${hero.postmarkTop}, ${hero.postmarkBottom}.`}
      className="h-auto w-full overflow-visible"
    >
      <defs>
        {/* Perforated edge: the stamp's paper, less a row of round holes */}
        <mask id={mask} maskUnits="userSpaceOnUse">
          <rect x={S.x - 10} y={S.y - 10} width={S.w + 20} height={S.h + 20} fill="black" />
          <rect x={S.x} y={S.y} width={S.w} height={S.h} fill="white" />
          {holes(5.2, 15).map((h, i) => (
            <circle key={i} cx={h.x} cy={h.y} r={h.r} fill="black" />
          ))}
        </mask>
        {/* Ink: edges a touch rough, and worn through in patches, like a real hand stamp */}
        <filter id={ink} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="1" seed="7" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="0.9" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="3" result="blot" />
          <feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3 0 0 0 2.6" result="wear" />
          <feComposite in="rough" in2="wear" operator="in" />
        </filter>
        <filter id={paper} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000" floodOpacity="0.12" />
          <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000" floodOpacity="0.12" />
        </filter>
        {/* The text arcs: over the top, left to right; under the bottom, left to right */}
        <path id={top} d={`M ${C.x - ri + 4} ${C.y} A ${ri - 4} ${ri - 4} 0 0 1 ${C.x + ri - 4} ${C.y}`} />
        <path id={bottom} d={`M ${C.x - C.r + 6} ${C.y} A ${C.r - 6} ${C.r - 6} 0 0 0 ${C.x + C.r - 6} ${C.y}`} />
      </defs>

      {/* The stamp settles, and gives a little when the postmark lands on it */}
      <motion.g
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: [14, 0, 0, 1.5, 0] }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.3, times: [0, 0.45, 0.66, 0.74, 1], ease, opacity: { duration: 0.5 } }}
      >
        <g transform={`rotate(${S.tilt} ${SC.x} ${SC.y})`}>
          <g filter={`url(#${paper})`}>
            <rect x={S.x} y={S.y} width={S.w} height={S.h} className="fill-card" mask={`url(#${mask})`} />
          </g>
          {/* The printed design, a little inside the paper */}
          <rect
            x={S.x + 13}
            y={S.y + 13}
            width={S.w - 26}
            height={S.h - 26}
            rx={3}
            className="fill-[color-mix(in_oklab,var(--primary)_10%,var(--card))] stroke-primary"
            strokeWidth={1.4}
          />
          <text x={S.x + 26} y={S.y + 60} className="fill-foreground font-heading text-[36px] font-bold tracking-tight">
            {hero.stampValue}
          </text>
          <text x={S.x + 28} y={S.y + 78} className="fill-primary text-[9.5px] font-semibold tracking-[0.18em]">
            {hero.stampLabel.toUpperCase()}
          </text>
          <g transform={`translate(${S.x + S.w - 50} ${S.y + S.h - 50}) scale(1.25)`} className="fill-primary">
            {OPPIZI_SYMBOL_PATHS.map((d) => (
              <path key={d} d={d} fillRule="evenodd" />
            ))}
          </g>
          <g className="text-primary">
            <Street x0={S.x + 30} y={S.y + S.h - 62} n={4} w={35} />
          </g>
        </g>
      </motion.g>

      {/* The postmark: thumps down a beat later, a little crooked, in worn dark ink */}
      <motion.g
        initial={{ opacity: 0, scale: 1.3 }}
        whileInView={{ opacity: [0, 1, 1], scale: [1.3, 0.96, 1] }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.45, delay: 0.55, times: [0, 0.6, 1], ease: "easeOut" }}
        style={{ transformOrigin: `${C.x}px ${C.y}px`, transformBox: "view-box" }}
        className="text-[color-mix(in_srgb,var(--foreground)_82%,var(--card))]"
      >
        <g transform={`rotate(${C.tilt} ${C.x} ${C.y})`} filter={`url(#${ink})`}>
          <circle cx={C.x} cy={C.y} r={C.r} fill="none" stroke="currentColor" strokeWidth={4} />
          <circle cx={C.x} cy={C.y} r={C.inner} fill="none" stroke="currentColor" strokeWidth={1.6} />
          <text className="fill-current text-[12.5px] font-bold tracking-[0.16em]">
            <textPath href={`#${top}`} startOffset="50%" textAnchor="middle">
              {hero.postmarkTop}
            </textPath>
          </text>
          <text className="fill-current text-[11px] font-bold tracking-[0.2em]">
            <textPath href={`#${bottom}`} startOffset="50%" textAnchor="middle">
              {hero.postmarkBottom}
            </textPath>
          </text>
          {/* Stars at the sides, between the two lines of text */}
          {[-1, 1].map((s) => (
            <text key={s} x={C.x + s * ri} y={C.y + 4} textAnchor="middle" className="fill-current text-[11px]">
              ★
            </text>
          ))}
          {/* The date, stacked */}
          <text
            x={C.x}
            y={C.y - 6}
            textAnchor="middle"
            suppressHydrationWarning
            className="fill-current font-heading text-[19px] font-bold tracking-[0.08em]"
          >
            {month} {day}
          </text>
          <path d={`M${C.x - 30} ${C.y + 3}H${C.x + 30}`} stroke="currentColor" strokeWidth={1.2} />
          <text
            x={C.x}
            y={C.y + 28}
            textAnchor="middle"
            suppressHydrationWarning
            className="fill-current font-heading text-[23px] font-bold tracking-[0.06em]"
          >
            {year}
          </text>
          {/* The killer: wavy lines from the ring out across the stamp */}
          {[-2, -1, 0, 1, 2].map((k, i) => {
            const y = C.y + k * 17;
            const x0 = C.x - Math.sqrt(C.r * C.r - (k * 17) ** 2) - 8;
            const waves = 5; // full waves, each `len` long, running left
            const len = 34;
            const d = `M${x0} ${y} q ${-len / 4} -6 ${-len / 2} 0` + ` t ${-len / 2} 0`.repeat(waves * 2 - 1);
            return (
              <motion.path
                key={k}
                d={d}
                fill="none"
                stroke="currentColor"
                strokeWidth={3.2}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, delay: 0.85 + i * 0.05, ease }}
              />
            );
          })}
        </g>
      </motion.g>
    </svg>
  );
}
