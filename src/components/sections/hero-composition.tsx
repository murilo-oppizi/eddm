"use client";

import {
  CalendarIcon,
  CircleDashedIcon,
  MapPinIcon,
  PlusIcon,
  RouteIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { MotionConfig, motion } from "motion/react";

import {
  IllustratedMap,
  ROUTE_CENTER,
  type SelectionMode,
} from "@/components/sections/illustrated-map";
import { cn } from "@/lib/utils";

// Hero visual built from Campaign Builder pieces (Figma: "Campaign Builder
// Standardization" › Every Door Direct Mail). One map with a highlighted carrier
// route, plus the two decisions that matter — who you're reaching and what it costs.
// Laid out on a 640×500 design canvas, so values are design pixels.
const CANVAS = { w: 640, h: 500 };

/** `n` design pixels as a length that scales with the composition's width. */
const px = (n: number) => `calc(${n} * 100cqw / ${CANVAS.w})`;

// Scaling is pure CSS so the composition renders with the page, before any JS runs:
// the wrapper is a size container, and Tailwind's spacing, text and radius scales are
// re-pointed at container units, so every utility inside (p-5, text-sm, rounded-xl…)
// shrinks in proportion.
const scaled = {
  "--spacing": px(4),
  "--text-xs": px(12),
  "--text-sm": px(14),
  "--text-3xl": px(30),
  "--radius": px(10),
} as React.CSSProperties;

export function HeroComposition() {
  return (
    // "user": honour the OS reduce-motion setting by skipping movement (floats, pulse
    // growth) while keeping the same markup on server and client.
    <MotionConfig reducedMotion="user">
      {/* One wrapper, so the composition and its credit stay in the same grid cell. */}
      <div className="w-full">
        <div
          className="@container relative mx-auto w-full max-w-[640px] select-none"
          style={{ aspectRatio: `${CANVAS.w} / ${CANVAS.h}` }}
        >
          <p className="sr-only">
            The EDDM campaign builder: a map with a highlighted carrier route,
            audience filters, and selected routes with household counts and costs.
          </p>
          <div className="absolute inset-0" style={scaled}>
            <Piece
              x={70}
              y={20}
              w={400}
              delay={0}
              float={{ distance: 4, duration: 8 }}
            >
              <RouteMap />
            </Piece>
            <Piece
              x={340}
              y={96}
              w={300}
              delay={0.15}
              float={{ distance: 8, duration: 6, offset: 1.2 }}
            >
              <SelectedRoutesCard />
            </Piece>
            <Piece
              x={0}
              y={338}
              w={330}
              delay={0.3}
              float={{ distance: 7, duration: 7, offset: 2.4 }}
            >
              <AudienceCard />
            </Piece>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

/** Positions a piece, fades it in once, then lets it drift gently up and down forever. */
function Piece({
  x,
  y,
  w,
  delay,
  float,
  children,
}: {
  x: number;
  y: number;
  w: number;
  delay: number;
  float: { distance: number; duration: number; offset?: number };
  children: React.ReactNode;
}) {
  return (
    // The fade-in is plain CSS so it plays as soon as the page paints; a JS-driven
    // one would keep the cards at opacity 0 until the scripts load (seconds on slow networks).
    <div
      className="absolute animate-in fill-mode-both fade-in slide-in-from-bottom-4 animation-duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none"
      style={
        {
          left: px(x),
          top: px(y),
          width: px(w),
          "--tw-animation-delay": `${delay}s`,
        } as React.CSSProperties
      }
    >
      {/* Separate element so the float and the fade-in don't fight over `transform`. */}
      <motion.div
        animate={{ y: [0, -float.distance, 0] }}
        transition={{
          duration: float.duration,
          delay: delay + 0.6 + (float.offset ?? 0),
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function Card({
  className,
  decorative,
  children,
}: {
  className?: string;
  /** Hide from assistive tech; the sr-only description covers what it shows. */
  decorative?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden={decorative || undefined}
      className={cn("rounded-xl border bg-card shadow-lg", className)}
    >
      {children}
    </div>
  );
}

// What the map label says for each selection mode (placeholder numbers).
const selectionLabel: Record<SelectionMode, { title: string; homes: string }> = {
  route: { title: "Route 11211-C014", homes: "512 homes" },
  area: { title: "0.3 mi radius", homes: "1,126 homes" },
};

const modes: { mode: SelectionMode; label: string; Icon: typeof RouteIcon }[] = [
  { mode: "route", label: "Route", Icon: RouteIcon },
  { mode: "area", label: "Area", Icon: CircleDashedIcon },
];

function RouteMap() {
  const [mode, setMode] = useState<SelectionMode>("route");
  const label = selectionLabel[mode];

  return (
    <Card className="relative h-110 overflow-hidden">
      <IllustratedMap mode={mode} />

      <div className="pointer-events-none absolute inset-0 p-4">
        {/* Decorative overlays; the pin sits on the selection's centre. */}
        <div aria-hidden>
          <Pin x={ROUTE_CENTER.x} y={ROUTE_CENTER.y} />
          <div className="absolute top-32 left-7 rounded-lg border bg-card px-3 py-2 shadow-md">
            <p className="text-xs text-muted-foreground">{label.title}</p>
            <p className="text-sm font-semibold text-foreground">{label.homes}</p>
          </div>
        </div>

        {/* Toolbar, as in the Campaign Builder map — the one interactive bit of the hero. */}
        <div
          role="group"
          aria-label="Map selection mode"
          className="pointer-events-auto relative flex w-fit overflow-hidden rounded-md border border-input bg-background shadow-xs"
        >
          {modes.map(({ mode: m, label: text, Icon }) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "flex h-9 cursor-pointer items-center gap-1.5 px-3 text-sm font-medium text-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
                mode === m ? "bg-muted" : "hover:bg-muted/50"
              )}
            >
              <Icon className="size-4.5" /> {text}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Pin({ x, y }: { x: number; y: number }) {
  return (
    <span
      className="absolute block size-4 rounded-full border-background bg-primary shadow-md"
      style={{ left: px(x - 8), top: px(y - 8), borderWidth: px(3) }}
    />
  );
}

// "Selected routes" panel from the Campaign Builder (Figma node 2522:48598), minus
// the delete buttons — nothing is removable in a hero picture.
const selectedRoutes = [
  // Costs = homes × pricing.perPiece ($0.31) from src/content/site.ts.
  { place: "Williamsburg, NY 11211", routes: "17", homes: "8,746", cost: "$ 2,711.26" },
  { place: "Park Slope, NY 11215", routes: "12", homes: "6,204", cost: "$ 1,923.24" },
];

function SelectedRoutesCard() {
  return (
    <Card decorative className="flex flex-col gap-3 p-4">
      <p className="text-sm font-medium text-foreground">Selected routes</p>
      <div className="flex flex-col gap-2">
        {selectedRoutes.map((route) => (
          <div
            key={route.place}
            className="flex flex-col gap-5 rounded-lg border bg-background p-4"
          >
            <p className="flex items-center gap-1 text-sm font-medium text-foreground">
              <MapPinIcon className="size-4.5" /> {route.place}
            </p>
            <dl className="flex gap-5">
              <Stat label="Routes" value={route.routes} />
              <Stat label="Residencies" value={route.homes} />
              <Stat label="Costs" value={route.cost} />
            </dl>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function AudienceCard() {
  const active = ["Age 35–54", "Income $60K–115K", "Homeowners"];
  return (
    <Card decorative className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Audience</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarIcon className="size-3.5" /> Delivers in 2–5 days
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {active.map((filter) => (
          <span
            key={filter}
            className="flex h-8 items-center gap-1 rounded-lg bg-foreground py-1 pr-2 pl-3 text-xs font-medium text-background"
          >
            {filter}
            <XIcon className="size-4" />
          </span>
        ))}
        <span className="flex h-8 items-center gap-1 rounded-lg border border-dashed py-1 pr-2 pl-3 text-xs font-medium text-muted-foreground">
          Add filter
          <PlusIcon className="size-4" />
        </span>
      </div>
    </Card>
  );
}
