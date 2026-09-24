"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  IconCheck,
  IconCircleCheck,
  IconChartBar,
  IconMapPin,
  IconPencil,
  IconMailFast,
  IconPrinter,
  IconQrcode,
  IconTruckDelivery,
  type TablerIcon,
} from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from "motion/react";

import { IllustratedMap } from "@/components/sections/illustrated-map";
import { SectionHeading } from "@/components/sections/section-heading";
import { steps } from "@/content/site";
import { cn } from "@/lib/utils";

// "How it works" as the mail's journey from map to mailbox. On desktop the section
// pins: a marker travels a dashed mail route past four stops as you scroll (its icon
// changes with each step: pin, pencil, truck, chart), and one
// stage card below cross-fades to each step's text and visual. Phones get a vertical
// timeline whose line fills as you scroll. With reduced motion, a still grid.

const N = steps.length;

/**
 * Which steps' visuals have already played. A visual plays once, the first time its
 * step is reached, then stays finished — scrolling on, or back up to it, doesn't rewind
 * it. All of them reset once you scroll back above the section, so coming down again
 * replays them.
 */
const SeenSteps = createContext<{ has: (i: number) => boolean; add: (i: number) => void }>({
  has: () => false,
  add: () => {},
});

export function HowItWorks() {
  const reduceMotion = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(0); // bitmask of step indices
  // While you're above the section, nothing counts as seen (a visual can still report
  // itself active for a moment after you scroll away).
  const above = useRef(false);
  const add = useCallback((i: number) => {
    if (!above.current) setSeen((m) => m | (1 << i));
  }, []);
  const seenSteps = useMemo(() => ({ has: (i: number) => (seen & (1 << i)) !== 0, add }), [seen, add]);

  // 0 while the section is still entirely below the screen, i.e. you're above it.
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    above.current = p <= 0;
    if (above.current) setSeen(0);
  });

  return (
    <MotionConfig reducedMotion="user">
      <SeenSteps.Provider value={seenSteps}>
      <section ref={section} id="how-it-works" className="scroll-mt-20 border-y bg-muted/40 py-20">
        {/* On desktop the heading lives inside the pinned area instead (see PinnedStage). */}
        <div className={cn("container-page", !reduceMotion && "lg:hidden")}>
          <Heading />
        </div>
        {reduceMotion ? (
          <StillGrid />
        ) : (
          <>
            <PinnedStage />
            <VerticalTimeline />
          </>
        )}
      </section>
      </SeenSteps.Provider>
    </MotionConfig>
  );
}

function Heading() {
  return (
    <SectionHeading
      eyebrow="How it works"
      title="From map to mailbox in four steps"
      body="We handle printing and USPS delivery for you."
    />
  );
}

/* ------------------------------ Desktop (lg+) ------------------------------ */

// Stops sit at the centre of four equal columns, so they line up with their labels.
const stopAt = (i: number) => (i + 0.5) / N;

function PinnedStage() {
  const outer = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  const { scrollYProgress } = useScroll({ target: outer, offset: ["start start", "end end"] });
  // Marker position along the route, 0 (first stop) → 1 (last stop): moves smoothly with
  // the scroll, and reaches the last stop a little early so step 4 has time on screen.
  const route = useTransform(scrollYProgress, [0.05, 0.8], [0, 1], { clamp: true });
  // Card, counter, stops and marker icon all switch when the marker arrives at a stop.
  useMotionValueEvent(route, "change", (r) => setStep(Math.floor(r * (N - 1) + 0.001)));

  return (
    // ~75vh of scrolling per step. Hidden below lg, where the vertical timeline takes over.
    <div ref={outer} className="relative -mt-20 hidden lg:block" style={{ height: `${N * 75}vh` }}>
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col justify-center overflow-hidden">
        {/* Short laptop screens get tighter spacing and a shorter stage so it all fits. */}
        <div className="container-page space-y-8 [@media(max-height:820px)]:space-y-6">
          <Heading />
          <RouteRail progress={route} current={step} />
          <Stage active={step} />
        </div>
      </div>
    </div>
  );
}

/**
 * A dashed mail route with four stops. A postcard marker travels along it with the
 * scroll, the route fills in behind it, and each stop lights up as it's passed.
 */
function RouteRail({ progress, current }: { progress: MotionValue<number>; current: number }) {
  const first = stopAt(0);
  const span = stopAt(N - 1) - first;
  // The marker moves continuously from the first stop to the last.
  const left = useTransform(progress, (t) => `${(first + t * span) * 100}%`);

  return (
    <div className="relative mx-auto max-w-4xl" aria-hidden>
      <div className="relative h-10">
        {/* Route: dashed ahead, solid pink behind the marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 border-t-2 border-dashed border-border"
          style={{ left: `${first * 100}%`, right: `${first * 100}%` }}
        />
        <motion.div
          className="absolute top-1/2 h-0.5 origin-left -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${first * 100}%`, width: `${span * 100}%`, scaleX: progress }}
        />
        {/* Stops */}
        {steps.map((step, i) => (
          <span
            key={step.title}
            className={cn(
              "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors duration-500",
              i <= current ? "border-primary bg-primary" : "border-border bg-background"
            )}
            style={{ left: `${stopAt(i) * 100}%` }}
          />
        ))}
        {/* The postcard, travelling the route */}
        <motion.span
          className="absolute top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"
          style={{ left }}
        >
          <MarkerIcon step={current} className="size-5" />
        </motion.span>
      </div>
      <ol className="mt-3 grid grid-cols-4 text-center">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className={cn(
              "text-sm font-medium transition-colors duration-500",
              i === current ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {step.title}
          </li>
        ))}
      </ol>
    </div>
  );
}

const ease = [0.22, 1, 0.36, 1] as const;

/** One card that stays put while its text and visual cross-fade from step to step. */
function Stage({ active }: { active: number }) {
  const step = steps[active];
  // The first step is on screen before you scroll to it, so its visual waits until it's seen.
  const visual = useRef<HTMLDivElement>(null);
  const inView = useInView(visual, { amount: 0.6 });
  return (
    // Same width as the route above it, so the card lines up with the rail. Text and
    // visual split it in half.
    <div className="mx-auto grid max-w-4xl grid-cols-2 overflow-hidden rounded-2xl border bg-card shadow-lg">
      <div className="flex flex-col justify-center gap-6 p-10 [@media(max-height:820px)]:p-8">
        {/* Rolling step counter */}
        <p className="flex items-center gap-1 font-heading text-sm leading-5 font-semibold text-muted-foreground tabular-nums">
          <span className="relative block h-5 w-5 overflow-hidden text-brand">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={active}
                className="absolute inset-0"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.4, ease }}
              >
                {String(active + 1).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
          </span>
          / {String(N).padStart(2, "0")}
        </p>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease }}
          >
            <h3 className="font-heading text-2xl font-bold tracking-tight">{step.title}</h3>
            <p className="mt-2 text-muted-foreground">{step.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div ref={visual} aria-hidden className="relative h-80 overflow-hidden border-l bg-muted/60 [@media(max-height:820px)]:h-64">
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease }}
          >
            <StepVisual index={active} active={inView} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** The route marker's icon shows what the mail is going through at each stop. */
const markerIcons: TablerIcon[] = [IconMapPin, IconPencil, IconTruckDelivery, IconChartBar];

function MarkerIcon({ step, className }: { step: number; className?: string }) {
  const Icon = markerIcons[Math.min(Math.max(step, 0), markerIcons.length - 1)];
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={step}
        className="grid place-items-center"
        initial={{ scale: 0.4, rotate: -45, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.4, rotate: 45, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 24 }}
      >
        <Icon className={className} />
      </motion.span>
    </AnimatePresence>
  );
}

/* ------------------------------ Phones & tablets ------------------------------ */

/** Where each stop sits: the vertical centre of its card's visual (design px from the card top). */
const STOP_OFFSET = 112;

/**
 * The same mail route as on desktop, running down the left: a postcard marker rides a
 * dashed line at a fixed point on screen as you scroll, the route fills in behind it,
 * and each stop (and its card) lights up once the postcard reaches it.
 */
function VerticalTimeline() {
  const list = useRef<HTMLOListElement>(null);
  const [stops, setStops] = useState<number[]>([]);
  // The first stop is where the postcard starts, so it (and its card) is lit from the start.
  const [reached, setReached] = useState(0);

  // Stop positions (px from the list top), re-measured when the layout changes.
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () =>
      setStops([...el.querySelectorAll<HTMLElement>(":scope > li")].map((li) => li.offsetTop + STOP_OFFSET));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The marker follows a line 60% down the screen, held between the first and last stop.
  const { scrollYProgress } = useScroll({ target: list, offset: ["start 60%", "end 60%"] });
  const first = stops[0] ?? 0;
  const last = stops[N - 1] ?? 0;
  const y = useTransform(scrollYProgress, (p) => {
    const height = list.current?.offsetHeight ?? 0;
    return Math.min(last, Math.max(first, p * height));
  });
  const fill = useTransform(y, (v) => (last > first ? (v - first) / (last - first) : 0));
  useMotionValueEvent(y, "change", (v) => setReached(Math.max(0, stops.filter((stop) => v >= stop - 1).length - 1)));

  return (
    <div className="container-page mt-12 lg:hidden">
      <ol ref={list} className="relative space-y-8 pl-12">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-4">
          {/* Route: dashed, solid pink behind the marker */}
          <div
            className="absolute -translate-x-1/2 border-l-2 border-dashed border-border"
            style={{ top: first, height: Math.max(0, last - first) }}
          />
          <motion.div
            className="absolute w-0.5 origin-top -translate-x-1/2 rounded-full bg-primary"
            style={{ top: first, height: Math.max(0, last - first), scaleY: fill }}
          />
          {stops.map((top, i) => (
            <span
              key={i}
              className={cn(
                "absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors duration-500",
                i <= reached ? "border-primary bg-primary" : "border-border bg-background"
              )}
              style={{ top }}
            />
          ))}
          {/* The postcard, travelling the route */}
          <motion.span
            className="absolute top-0 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"
            style={{ y }}
          >
            <MarkerIcon step={reached} className="size-4.5" />
          </motion.span>
        </div>
        {steps.map((step, i) => (
          <li key={step.title}>
            <StepCard index={i} active={i <= reached} />
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------ Reduced motion ------------------------------ */

function StillGrid() {
  return (
    <div className="container-page mt-12">
      <ol className="grid gap-6 md:grid-cols-2">
        {steps.map((step, i) => (
          <li key={step.title}>
            <StepCard index={i} active numbered />
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------ Step cards ------------------------------ */

/** `numbered`: show a "Step N" label — only needed where no timeline numbers the steps. */
function StepCard({ index, active, numbered = false }: { index: number; active: boolean; numbered?: boolean }) {
  const step = steps[index];
  // Visuals play once they're on screen (and replay when you come back to them).
  const reduce = useReducedMotion();
  const visual = useRef<HTMLDivElement>(null);
  const inView = useInView(visual, { amount: 0.6 });
  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div ref={visual} aria-hidden className="relative h-56 overflow-hidden border-b bg-muted/60 lg:[@media(max-height:820px)]:h-48">
        <StepVisual index={index} active={active && (reduce || inView)} />
      </div>
      <div className="p-6 lg:[@media(max-height:820px)]:p-5">
        {numbered && <p className="mb-1 text-sm font-semibold text-brand">Step {index + 1}</p>}
        <h3 className="text-lg font-semibold">{step.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
      </div>
    </article>
  );
}

/** Visuals that should appear finished straight away, with no entrance. */
const Instant = createContext(false);

/** True when a visual should skip its entrance: already seen, or reduced motion. */
function useInstant() {
  const reduce = useReducedMotion();
  return useContext(Instant) || !!reduce;
}

function StepVisual({ index, active }: { index: number; active: boolean }) {
  const { has, add } = useContext(SeenSteps);
  // Seen before this visual mounted (e.g. scrolling back up to its step): show it finished.
  const [seenAtMount] = useState(() => has(index));
  // Once played it stays played, even when its step is left or it scrolls out of view.
  const played = active || has(index);
  useEffect(() => {
    if (active) add(index);
  }, [active, index, add]);

  const Visual = [RoutesVisual, DesignVisual, DeliveryVisual, ResultsVisual][index];
  return (
    <Instant.Provider value={seenAtMount}>
      <Visual active={played} />
    </Instant.Provider>
  );
}

/* ------------------------------ Step visuals ------------------------------ */

// The visuals sit ready; only the detail that tells the step's story animates, and
// quickly (all done in under a second), so it's seen even when scrolling fast. Each
// plays when its step becomes active (the desktop stage remounts it per step; the phone
// timeline flips `active` as you scroll) and rewinds when it's left. Children pick up
// the "off" → "on" variants from the visual's root. Once played they stay finished
// (see SeenSteps); with reduced motion they render finished.

/** Motion props for a visual's root: play the entrance while `active`. */
function usePlay(active: boolean) {
  const instant = useInstant();
  return { initial: instant ? false : "off", animate: active ? "on" : "off" } as const;
}

/** Fade up into place, after `custom` seconds. */
const rise: Variants = {
  off: { opacity: 0, y: 8 },
  on: (delay: number = 0) => ({ opacity: 1, y: 0, transition: { delay, duration: 0.35, ease } }),
};

/** Pop in with a little spring, after `custom` seconds. */
const pop: Variants = {
  off: { opacity: 0, scale: 0.5 },
  on: (delay: number = 0) => ({ opacity: 1, scale: 1, transition: { delay, type: "spring", stiffness: 500, damping: 22 } }),
};

/** A number that counts up from 0 while `active`. */
function CountUp({ to, active, delay = 0, duration = 0.6 }: { to: number; active: boolean; delay?: number; duration?: number }) {
  const reduce = useInstant();
  const value = useMotionValue(0);
  const text = useTransform(value, (v) => Math.round(v).toLocaleString("en-US"));
  useEffect(() => {
    if (!active) return value.set(0);
    if (reduce) return value.set(to);
    const controls = animate(value, to, { delay, duration, ease });
    return () => controls.stop();
  }, [active, to, delay, duration, reduce, value]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

/** Small card floating over a visual; rises in `delay` seconds after the step appears. */
function Chip({ delay = 0.15, className, children }: { delay?: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      custom={delay}
      variants={rise}
      className={cn("absolute rounded-lg border bg-card px-3 py-2 text-sm shadow-md", className)}
    >
      {children}
    </motion.div>
  );
}

// The visuals use illustrative numbers.

/** The route is already picked; the selection card rises in with its count. */
function RoutesVisual({ active }: { active: boolean }) {
  return (
    <motion.div className="absolute inset-0" {...usePlay(active)}>
      <IllustratedMap mode="route" cover />
      {/* Top right: the map's neighborhood label sits top left. On the smallest phones
          it tucks a little closer to the corner to stay clear of the label. */}
      <Chip className="top-4 right-4 max-[380px]:top-3 max-[380px]:right-3">
        <p className="text-xs text-muted-foreground">3 routes selected</p>
        <p className="font-semibold">
          <CountUp to={1540} active={active} delay={0.2} /> homes
        </p>
      </Chip>
    </motion.div>
  );
}

/** The postcard is ready; the USPS check comes in and ticks. */
function DesignVisual({ active }: { active: boolean }) {
  return (
    // On short screens the postcard sits at the top, so the USPS check chip fits below it.
    <motion.div
      className="flex h-full items-center justify-center p-5 lg:[@media(max-height:820px)]:items-start"
      {...usePlay(active)}
    >
      {/* The postcard */}
      {/* Sized to always fit its box: by width on phones, by height on desktop. */}
      <div className="relative aspect-[9/6.25] w-full max-w-60 min-w-0 rounded-lg border bg-card p-4 shadow-md lg:h-full lg:max-h-44 lg:w-auto lg:max-w-none">
        <div className="flex h-full w-[58%] flex-col justify-between rounded-md bg-brand-subtle p-3">
          <span className="h-2 w-14 rounded-full bg-primary/60" />
          <p className="font-heading text-base leading-tight font-bold">Grand opening Saturday</p>
          <IconQrcode className="size-5 text-brand" />
        </div>
        <div className="absolute top-4 right-4 w-12 border border-foreground/60 py-0.5 text-center text-[7px] leading-tight font-semibold text-foreground/70">
          ECRWSS
          <br />
          EDDM
        </div>
      </div>
      <Chip className="right-4 bottom-4 flex items-center gap-1.5 font-medium">
        <motion.span custom={0.35} variants={pop}>
          <IconCircleCheck className="size-4 text-success" />
        </motion.span>
        USPS size check passed
      </Chip>
    </motion.div>
  );
}

const delivery = [
  { label: "Printed", when: "Tue", Icon: IconPrinter },
  { label: "Bundled", when: "Wed", Icon: IconMailFast },
  { label: "At the post office", when: "Thu", Icon: IconTruckDelivery },
  { label: "Delivered", when: "Fri–Mon", Icon: IconCheck },
];

const TICK_MS = 220;

/** Each stage ticks off in turn, the last one ("Delivered") included. */
function DeliveryVisual({ active }: { active: boolean }) {
  const reduce = useInstant();
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    if (!active || reduce) return;
    let ticked = 0;
    const timer = setInterval(() => {
      ticked += 1;
      setTicks(ticked);
      if (ticked >= delivery.length) clearInterval(timer); // all checked: stop ticking
    }, TICK_MS);
    return () => {
      clearInterval(timer);
      setTicks(0); // replay from the start next time the step comes back
    };
  }, [active, reduce]);
  // How many stages are checked off; the next one is in progress.
  const done = !active ? 0 : reduce ? delivery.length : ticks;

  return (
    <div className="flex h-full items-center px-8">
      <ol className="w-full space-y-2">
        {delivery.map(({ label, when, Icon }, i) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-3 rounded-lg border bg-card px-3 py-1.5 text-sm transition-all duration-300",
              i > done && "opacity-50",
              i === done && "ring-2 ring-primary/30"
            )}
          >
            <span
              className={cn(
                "grid size-7 place-items-center rounded-md transition-colors duration-300",
                i < done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {i < done ? <IconCheck className="size-4" /> : <Icon className="size-4" />}
            </span>
            <span className="flex-1 font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">{when}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const results = [
  { area: "Williamsburg", scans: 128 },
  { area: "Greenpoint", scans: 94 },
  { area: "Bushwick", scans: 61 },
];

/** The total counts up while each neighborhood's bar grows in turn, its number keeping pace. */
function ResultsVisual({ active }: { active: boolean }) {
  const max = Math.max(...results.map((r) => r.scans));
  const total = results.reduce((sum, r) => sum + r.scans, 0);
  const barDelay = (i: number) => 0.1 + i * 0.08;
  return (
    <motion.div className="flex h-full flex-col justify-center gap-4 px-8" {...usePlay(active)}>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">Scans by neighborhood</p>
        <p className="font-heading text-2xl font-bold tracking-tight">
          <CountUp to={total} active={active} delay={0.1} duration={0.75} />
        </p>
      </div>
      <ul className="space-y-3">
        {results.map((r, i) => (
          <li key={r.area} className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{r.area}</span>
              <CountUp to={r.scans} active={active} delay={barDelay(i)} />
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-card">
              <motion.div
                className="h-full origin-left rounded-full bg-primary"
                variants={{
                  off: { scaleX: 0 },
                  on: { scaleX: r.scans / max, transition: { delay: barDelay(i), duration: 0.6, ease } },
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
