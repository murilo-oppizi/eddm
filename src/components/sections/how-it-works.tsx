"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconCheck,
  IconCircleCheck,
  IconLayoutGrid,
  IconMailFast,
  IconPrinter,
  IconQrcode,
  IconTruckDelivery,
  IconUpload,
} from "@tabler/icons-react";
import {
  MotionConfig,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

import { IllustratedMap } from "@/components/sections/illustrated-map";
import { SectionHeading } from "@/components/sections/section-heading";
import { steps } from "@/content/site";
import { cn } from "@/lib/utils";

// "How it works" as a journey from map to mailbox, told sideways. On desktop the
// section pins and scrolling moves four step cards horizontally, while a timeline on
// top fills from step to step. Phones get a vertical timeline whose line fills as you
// scroll. With reduced motion, a still grid.

const N = steps.length;

export function HowItWorks() {
  const reduceMotion = useReducedMotion();
  return (
    <MotionConfig reducedMotion="user">
      <section id="how-it-works" className="scroll-mt-20 border-y bg-muted/40 py-20">
        {/* On desktop the heading lives inside the pinned area instead (see PinnedJourney). */}
        <div className={cn("container-page", !reduceMotion && "lg:hidden")}>
          <Heading />
        </div>
        {reduceMotion ? (
          <StillGrid />
        ) : (
          <>
            <PinnedJourney />
            <VerticalTimeline />
          </>
        )}
      </section>
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

/** Left/right inset that lines the strip up with .container-page (72rem, 1.5rem gutters). */
const GUTTER = "max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem))";

/* ------------------------------ Desktop (lg+) ------------------------------ */

function PinnedJourney() {
  const outer = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const [distance, setDistance] = useState(0);
  const [active, setActive] = useState(0);

  // How far the track must travel so its last card ends flush with the container.
  useEffect(() => {
    const measure = () => {
      if (!viewport.current || !track.current) return;
      setDistance(Math.max(0, track.current.scrollWidth - viewport.current.clientWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (track.current) observer.observe(track.current);
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);

  // 0 → 1 while the pinned area scrolls past.
  const { scrollYProgress } = useScroll({ target: outer, offset: ["start start", "end end"] });
  // Hold the first card for a moment and settle on the last one before un-pinning.
  const travel = useTransform(scrollYProgress, [0.08, 0.92], [0, 1], { clamp: true });
  const x = useTransform(travel, (t) => -t * distance);
  useMotionValueEvent(travel, "change", (t) => setActive(Math.min(N - 1, Math.round(t * (N - 1)))));

  return (
    // ~70vh of scrolling per step. Hidden below lg, where the vertical timeline takes over.
    <div ref={outer} className="relative -mt-20 hidden lg:block" style={{ height: `${N * 70}vh` }}>
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col justify-center gap-8 overflow-hidden [@media(max-height:820px)]:gap-6">
        {/* Short laptop screens get tighter spacing and shorter visuals so it all fits. */}
        <div className="container-page space-y-8 [@media(max-height:820px)]:space-y-6">
          <Heading />
          <Timeline progress={travel} active={active} />
        </div>
        {/* Full-bleed strip: cards run to the screen edge but start and end in line
            with the page container. */}
        <div ref={viewport} className="overflow-hidden">
          <motion.ol
            ref={track}
            style={{ x, paddingLeft: GUTTER, paddingRight: GUTTER }}
            className="flex w-max gap-6"
          >
            {steps.map((step, i) => (
              <li
                key={step.title}
                className={cn(
                  "w-[min(34rem,58vw)] shrink-0 transition-opacity duration-500",
                  i !== active && "opacity-45"
                )}
              >
                <StepCard index={i} active={i === active} />
              </li>
            ))}
          </motion.ol>
        </div>
      </div>
    </div>
  );
}

/** Four numbered nodes joined by a line that fills as you scroll. */
function Timeline({ progress, active }: { progress: MotionValue<number>; active: number }) {
  return (
    <div className="relative mx-auto max-w-4xl" aria-hidden>
      <div className="absolute top-4 right-[12.5%] left-[12.5%] h-0.5 rounded-full bg-border">
        <motion.div className="h-full origin-left rounded-full bg-primary" style={{ scaleX: progress }} />
      </div>
      <ol className="relative grid grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex flex-col items-center gap-2 text-center">
            <StepNode index={i} active={active} />
            <span
              className={cn(
                "text-sm font-medium transition-colors duration-500",
                i === active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.title}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Numbered circle: filled once reached, a check once passed. */
function StepNode({ index, active, className }: { index: number; active: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 place-items-center rounded-full border-2 font-heading text-sm font-bold transition-colors duration-500",
        index <= active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground",
        className
      )}
    >
      {index < active ? <IconCheck className="size-4" /> : index + 1}
    </span>
  );
}

/* ------------------------------ Phones & tablets ------------------------------ */

function VerticalTimeline() {
  const list = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: list, offset: ["start 65%", "end 65%"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => setActive(Math.min(N - 1, Math.floor(p * N))));

  return (
    <div className="container-page mt-12 lg:hidden">
      <ol ref={list} className="relative space-y-8 pl-12">
        {/* The line behind the nodes, filling as you scroll */}
        <div aria-hidden className="absolute top-4 bottom-4 left-4 w-0.5 -translate-x-1/2 rounded-full bg-border">
          <motion.div className="h-full w-full origin-top rounded-full bg-primary" style={{ scaleY: scrollYProgress }} />
        </div>
        {steps.map((step, i) => (
          <li key={step.title} className="relative">
            <StepNode index={i} active={active} className="absolute top-0 -left-12" />
            <StepCard index={i} active={i <= active} />
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
  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div aria-hidden className="relative h-56 overflow-hidden border-b bg-muted/60 lg:[@media(max-height:820px)]:h-48">
        {index === 0 && <RoutesVisual active={active} />}
        {index === 1 && <DesignVisual active={active} />}
        {index === 2 && <DeliveryVisual active={active} />}
        {index === 3 && <ResultsVisual active={active} />}
      </div>
      <div className="p-6 lg:[@media(max-height:820px)]:p-5">
        {numbered && <p className="mb-1 text-sm font-semibold text-brand">Step {index + 1}</p>}
        <h3 className="text-lg font-semibold">{step.title}</h3>
        <p className="mt-1 text-muted-foreground">{step.body}</p>
      </div>
    </article>
  );
}

/** Small card floating over a visual; slides in when its step becomes active. */
function Chip({ active, className, children }: { active: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "absolute rounded-lg border bg-card px-3 py-2 text-sm shadow-md transition-all duration-500",
        active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

// The visuals use illustrative numbers.
function RoutesVisual({ active }: { active: boolean }) {
  return (
    <>
      <IllustratedMap mode="route" cover />
      <Chip active={active} className="top-4 left-4">
        <p className="text-xs text-muted-foreground">3 routes selected</p>
        <p className="font-semibold">1,540 homes</p>
      </Chip>
    </>
  );
}

function DesignVisual({ active }: { active: boolean }) {
  return (
    <div className="flex h-full items-center justify-center gap-4 p-5">
      {/* Start from a template, or upload your own */}
      <div className="flex flex-col gap-2">
        {[IconLayoutGrid, IconUpload].map((Icon, i) => (
          <span key={i} className="grid size-11 place-items-center rounded-lg border bg-card text-muted-foreground">
            <Icon className="size-5" />
          </span>
        ))}
      </div>
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
      <Chip active={active} className="right-4 bottom-4 flex items-center gap-1.5 font-medium">
        <IconCircleCheck className="size-4 text-success" /> USPS size check passed
      </Chip>
    </div>
  );
}

const delivery = [
  { label: "Printed", when: "Tue", Icon: IconPrinter },
  { label: "Bundled", when: "Wed", Icon: IconMailFast },
  { label: "At the post office", when: "Thu", Icon: IconTruckDelivery },
  { label: "Delivered", when: "Fri–Mon", Icon: IconCheck },
];

function DeliveryVisual({ active }: { active: boolean }) {
  // Stages tick off one after another while the step is active.
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setTicks((n) => n + 1), 450);
    return () => {
      clearInterval(timer);
      setTicks(0); // replay from the start next time the step comes back
    };
  }, [active]);
  const reached = active ? Math.min(ticks, delivery.length - 1) : 0;

  return (
    <div className="flex h-full items-center px-8">
      <ol className="w-full space-y-2">
        {delivery.map(({ label, when, Icon }, i) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-3 rounded-lg border bg-card px-3 py-1.5 text-sm transition-all duration-500",
              i > reached && "opacity-50",
              i === reached && "ring-2 ring-primary/30"
            )}
          >
            <span
              className={cn(
                "grid size-7 place-items-center rounded-md transition-colors duration-500",
                i < reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {i < reached ? <IconCheck className="size-4" /> : <Icon className="size-4" />}
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

function ResultsVisual({ active }: { active: boolean }) {
  const max = Math.max(...results.map((r) => r.scans));
  const total = results.reduce((sum, r) => sum + r.scans, 0);
  return (
    <div className="flex h-full flex-col justify-center gap-4 px-8">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">Scans by neighborhood</p>
        <p className="font-heading text-2xl font-bold tabular-nums">{total}</p>
      </div>
      <ul className="space-y-3">
        {results.map((r, i) => (
          <li key={r.area} className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{r.area}</span>
              <span className="tabular-nums">{r.scans}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-card">
              <div
                className="h-full origin-left rounded-full bg-primary transition-transform duration-700 ease-out"
                style={{ transform: `scaleX(${active ? r.scans / max : 0})`, transitionDelay: `${i * 120}ms` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
