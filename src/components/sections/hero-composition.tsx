"use client";

import {
  IconCalendar,
  IconCircleDashed,
  IconMapPin,
  IconPlus,
  IconRoute,
  IconSparkles,
  IconX,
  type TablerIcon,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { MotionConfig, motion } from "motion/react";

import { DotOrb } from "@/components/sections/dot-orb";
import { IllustratedMap, ROUTE_CENTER } from "@/components/sections/illustrated-map";
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

type Mode = "route" | "area" | "ai";
/** The AI option: idle (not chosen), loading (cards "thinking"), done (optimized). */
type AiState = "idle" | "loading" | "done";

// Placeholder numbers throughout; every cost = homes × $0.31 (pricing in site.ts).
const data = {
  label: {
    route: { title: "Route 11211-C014", homes: "512 homes" },
    area: { title: "0.3 mi radius", homes: "1,126 homes" },
    ai: { title: "AI pick · 14 routes", homes: "7,380 homes" },
  },
  routes: {
    base: [
      { place: "Williamsburg, NY 11211", routes: "17", homes: "8,746", cost: "$ 2,711.26" },
      { place: "Park Slope, NY 11215", routes: "12", homes: "6,204", cost: "$ 1,923.24" },
    ],
    // The AI tightens Williamsburg and swaps Park Slope for nearby Greenpoint.
    ai: [
      { place: "Williamsburg, NY 11211", routes: "14", homes: "7,380", cost: "$ 2,287.80" },
      { place: "Greenpoint, NY 11222", routes: "9", homes: "4,960", cost: "$ 1,537.60" },
    ],
  },
  audience: {
    base: ["Age 35–54", "Income $60K–115K", "Homeowners"],
    ai: ["Age 25–44", "Income $75K–150K", "Families"],
  },
};

// Status lines while the AI works, shown with the same shimmer as the AI planning section.
const AI_STEPS = ["Analyzing routes in Williamsburg", "Matching your audience", "Optimizing for cost"];
const AI_STEP_MS = 900;

export function HeroComposition() {
  const [mode, setMode] = useState<Mode>("route");
  const [ai, setAi] = useState<AiState>("idle");
  const [step, setStep] = useState(0);

  const choose = (m: Mode) => {
    setMode(m);
    setStep(0);
    // Choosing AI (again) runs the optimization; Route/Area show the original cards.
    setAi(m === "ai" ? "loading" : "idle");
  };

  // Walk through the AI status lines, then reveal the optimized cards.
  useEffect(() => {
    if (ai !== "loading") return;
    const timer = setTimeout(
      () => (step < AI_STEPS.length - 1 ? setStep((n) => n + 1) : setAi("done")),
      AI_STEP_MS
    );
    return () => clearTimeout(timer);
  }, [ai, step]);

  const loading = ai === "loading";
  const optimized = ai === "done";

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
          <p className="sr-only" aria-live="polite">
            {loading ? "Optimizing with AI…" : optimized ? "AI optimized: 14 routes and 7,380 homes in Williamsburg, plus Greenpoint." : ""}
          </p>
          <div className="absolute inset-0" style={scaled}>
            <Piece x={70} y={20} w={400} delay={0}>
              {/* The map (with its toolbar, pin and route label) is the anchor: it only
                  fades in and never moves. The two cards float over it. */}
              <RouteMap mode={mode} ai={ai} onChoose={choose} />
            </Piece>
            <Piece x={340} y={96} w={300} delay={0.15} float={{ distance: 8, duration: 6, offset: 1.2 }}>
              <AiFrame active={loading}>
                <SelectedRoutesCard ai={ai} step={step} />
              </AiFrame>
            </Piece>
            <Piece x={0} y={338} w={330} delay={0.3} float={{ distance: 7, duration: 7, offset: 2.4 }}>
              <AiFrame active={loading}>
                <AudienceCard ai={ai} />
              </AiFrame>
            </Piece>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

/** Positions a piece and fades it in once. With `float`, it also slides in and then
 *  drifts gently up and down forever; without it, it stays perfectly still. */
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
  float?: { distance: number; duration: number; offset?: number };
  children: React.ReactNode;
}) {
  return (
    // The fade-in is plain CSS so it plays as soon as the page paints; a JS-driven
    // one would keep the cards at opacity 0 until the scripts load (seconds on slow networks).
    <div
      className={cn(
        "absolute animate-in fill-mode-both fade-in animation-duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none",
        float && "slide-in-from-bottom-4"
      )}
      style={
        {
          left: px(x),
          top: px(y),
          width: px(w),
          "--tw-animation-delay": `${delay}s`,
        } as React.CSSProperties
      }
    >
      {float ? (
        // Separate element so the float and the fade-in don't fight over `transform`.
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
      ) : (
        children
      )}
    </div>
  );
}

/** While `active`, a pink-to-indigo arc circles the card, with a soft halo behind it. */
function AiFrame({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className={cn(
          "absolute -inset-0.5 rounded-[calc(var(--radius)*1.4+2px)] ai-glow opacity-0 blur-md transition-opacity duration-500",
          active && "opacity-50"
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute -inset-0.5 rounded-[calc(var(--radius)*1.4+2px)] ai-glow opacity-0 transition-opacity duration-500",
          active && "opacity-100"
        )}
      />
      <div className="relative">{children}</div>
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

/** Text that turns into a pulsing skeleton bar while loading, keeping its exact size. */
function Skel({ loading, className, children }: { loading: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-sm transition-[color,background-color] duration-500",
        loading && "animate-pulse bg-muted text-transparent",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Shimmering "working" line, like the agent steps in the AI planning section. */
function Thinking({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium">
      <IconSparkles className="size-4 shrink-0 animate-pulse text-brand" />
      <span className="animate-shimmer text-shimmer motion-reduce:animate-none">{children}…</span>
    </span>
  );
}

function AiBadge() {
  return (
    <span className="flex items-center gap-1 rounded-md bg-brand-subtle px-1.5 py-0.5 text-xs font-medium text-brand-subtle-foreground animate-in fade-in zoom-in-90 animation-duration-500">
      <IconSparkles className="size-3.5" /> AI optimized
    </span>
  );
}

const modes: { mode: Mode; label: string; Icon: TablerIcon }[] = [
  { mode: "route", label: "Route", Icon: IconRoute },
  { mode: "area", label: "Area", Icon: IconCircleDashed },
  { mode: "ai", label: "AI", Icon: IconSparkles },
];

function RouteMap({ mode, ai, onChoose }: { mode: Mode; ai: AiState; onChoose: (m: Mode) => void }) {
  const label = data.label[mode];
  const loading = ai === "loading";

  return (
    <Card className="relative h-110 overflow-hidden">
      {/* AI works on routes, so the map keeps showing the route outline in that mode. */}
      <IllustratedMap mode={mode === "area" ? "area" : "route"} thinking={loading} />

      <div className="pointer-events-none absolute inset-0 p-4">
        {/* Decorative overlays; the pin sits on the selection's centre. */}
        <div aria-hidden>
          <Pin x={ROUTE_CENTER.x} y={ROUTE_CENTER.y} />
          {/* Route label. While the AI works it becomes the "Oppizi AI" card with the dot
              orb, then turns back into the label with the AI's pick. */}
          <div className="absolute top-32 left-7 rounded-lg border bg-card shadow-md">
            {loading ? (
              <div
                key="thinking"
                className="flex items-center gap-2 py-1.5 pr-3 pl-2 animate-in fade-in zoom-in-95 animation-duration-300"
              >
                <DotOrb className="size-9 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Oppizi AI</p>
                  <p className="text-sm font-medium">
                    <span className="animate-shimmer text-shimmer motion-reduce:animate-none">
                      Finding the best routes…
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div key={mode} className="px-3 py-2 animate-in fade-in animation-duration-300">
                <p className="text-xs text-muted-foreground">{label.title}</p>
                <p className="text-sm font-semibold text-foreground">{label.homes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Toolbar, as in the Campaign Builder map — the one interactive bit of the hero. */}
        <div
          role="group"
          aria-label="Map selection mode"
          className="pointer-events-auto relative flex w-fit overflow-hidden rounded-md border border-input bg-background shadow-xs"
        >
          {modes.map(({ mode: m, label: text, Icon }) => {
            const on = mode === m;
            return (
              <button
                key={m}
                type="button"
                aria-pressed={on}
                onClick={() => onChoose(m)}
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-1.5 px-3 text-sm font-medium text-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
                  on && m === "ai" && "bg-brand-subtle text-brand-subtle-foreground",
                  on && m !== "ai" && "bg-muted",
                  !on && "hover:bg-muted/50"
                )}
              >
                <Icon className={cn("size-4.5", m === "ai" && "text-brand")} /> {text}
              </button>
            );
          })}
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
function SelectedRoutesCard({ ai, step }: { ai: AiState; step: number }) {
  const loading = ai === "loading";
  const routes = ai === "done" ? data.routes.ai : data.routes.base;
  return (
    <Card decorative className="flex flex-col gap-3 p-4">
      {/* Fixed-height header row, so switching title / status / badge never shifts the card. */}
      <div className="flex h-6 items-center justify-between gap-2">
        {loading ? (
          <Thinking>{AI_STEPS[step]}</Thinking>
        ) : (
          <p className="text-sm font-medium text-foreground">Selected routes</p>
        )}
        {ai === "done" && <AiBadge />}
      </div>
      <div className="flex flex-col gap-2">
        {routes.map((route, i) => (
          <div key={i} className="flex flex-col gap-5 rounded-lg border bg-background p-4">
            <p className="flex items-center gap-1 text-sm font-medium text-foreground">
              <IconMapPin className={cn("size-4.5 transition-colors duration-500", loading && "text-transparent")} />
              <Skel loading={loading}>{route.place}</Skel>
            </p>
            <dl className="flex gap-5">
              <Stat label="Routes" value={route.routes} loading={loading} />
              <Stat label="Residencies" value={route.homes} loading={loading} />
              <Stat label="Costs" value={route.cost} loading={loading} />
            </dl>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Stat({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground tabular-nums">
        <Skel loading={loading}>{value}</Skel>
      </dd>
    </div>
  );
}

function AudienceCard({ ai }: { ai: AiState }) {
  const loading = ai === "loading";
  const filters = ai === "done" ? data.audience.ai : data.audience.base;
  return (
    <Card decorative className="flex flex-col gap-3 p-5">
      <div className="flex h-6 items-center justify-between gap-2">
        {loading ? (
          <Thinking>Refining your audience</Thinking>
        ) : (
          <p className="text-sm font-medium text-foreground">Audience</p>
        )}
        {ai === "done" ? (
          <AiBadge />
        ) : (
          !loading && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconCalendar className="size-3.5" /> Delivers in 2–5 days
            </p>
          )
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter, i) => (
          <span
            key={i}
            className={cn(
              "flex h-8 items-center gap-1 rounded-lg py-1 pr-2 pl-3 text-xs font-medium transition-[color,background-color] duration-500",
              loading ? "animate-pulse bg-muted text-transparent" : "bg-foreground text-background"
            )}
          >
            {filter}
            <IconX className="size-4" />
          </span>
        ))}
        <span className="flex h-8 items-center gap-1 rounded-lg border border-dashed py-1 pr-2 pl-3 text-xs font-medium text-muted-foreground">
          Add filter
          <IconPlus className="size-4" />
        </span>
      </div>
    </Card>
  );
}
