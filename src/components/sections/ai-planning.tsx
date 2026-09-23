"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  CalendarIcon,
  CalendarRangeIcon,
  MapPinIcon,
  PaletteIcon,
  ReceiptIcon,
  RotateCcwIcon,
  RouteIcon,
  SparklesIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { SectionHeading } from "@/components/sections/section-heading";
import { aiPlanning } from "@/content/site";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  route: RouteIcon,
  users: UsersIcon,
  calendar: CalendarIcon,
  receipt: ReceiptIcon,
  pin: MapPinIcon,
  planning: CalendarRangeIcon,
  palette: PaletteIcon,
};

// Demo timeline: the brief types itself, the button "presses", the agent thinks, then
// the plan builds up line by line. Until the page has hydrated (and for visitors who
// prefer reduced motion) everything renders in its finished state, so the full text is
// always in the page for search engines and screen readers.
type Phase = "idle" | "typing" | "pressing" | "thinking" | "answering" | "done";

const TYPE_MS = 22; // per character
const ROW_MS = 280; // between plan lines
const ANSWER_ROWS = aiPlanning.plan.length + 1; // plan lines + the creative check

const noop = () => () => {};

/** false during SSR and hydration, true afterwards — without a setState-in-effect. */
function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

export function AiPlanning() {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const animated = hydrated && reduceMotion === false;

  const [state, setPhase] = useState<Phase>("idle");
  const [typedCount, setTyped] = useState(0);
  const [rowCount, setRows] = useState(0);

  // What's on screen: the live timeline when animating, otherwise the finished plan.
  const phase: Phase = animated ? state : "done";
  const typed = animated ? typedCount : aiPlanning.brief.length;
  const rows = animated ? rowCount : ANSWER_ROWS;

  const play = () => {
    setTyped(0);
    setRows(0);
    setPhase("typing");
  };

  // Drive the timeline.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (phase === "typing") {
      timer =
        typed < aiPlanning.brief.length
          ? setTimeout(() => setTyped((n) => n + 1), TYPE_MS)
          : setTimeout(() => setPhase("pressing"), 400);
    } else if (phase === "pressing") {
      timer = setTimeout(() => setPhase("thinking"), 250);
    } else if (phase === "thinking") {
      timer = setTimeout(() => setPhase("answering"), 900);
    } else if (phase === "answering") {
      timer =
        rows < ANSWER_ROWS
          ? setTimeout(() => setRows((n) => n + 1), ROW_MS)
          : setTimeout(() => setPhase("done"), 0);
    }
    return () => clearTimeout(timer);
  }, [phase, typed, rows]);

  const showAnswer = phase === "answering" || phase === "done";
  const rowVisible = (i: number) =>
    phase === "done" || (showAnswer && i < rows);

  return (
    <section id="ai" className="scroll-mt-20 py-20">
      <div className="container-page space-y-12">
        <SectionHeading
          eyebrow={aiPlanning.eyebrow}
          title={aiPlanning.title}
          body={aiPlanning.body}
        />

        {/* Starts the demo the first time the cards are mostly on screen. */}
        <motion.div
          onViewportEnter={() => animated && state === "idle" && play()}
          viewport={{ once: true, amount: 0.45 }}
          className="grid items-start gap-6 lg:grid-cols-[1fr_1.25fr]"
        >
          {/* 1 · The brief */}
          <div className="rounded-2xl bg-muted/60 p-6">
            <p className="text-xs font-medium text-muted-foreground">
              1 · You write
            </p>
            <div className="mt-3 min-h-28 rounded-lg border bg-card p-4 text-base leading-relaxed">
              <span className="sr-only">{aiPlanning.brief}</span>
              <span aria-hidden>
                {aiPlanning.brief.slice(0, typed)}
                {phase === "typing" && (
                  <span className="ml-px inline-block h-[1.1em] w-0.5 translate-y-[0.2em] animate-pulse bg-foreground" />
                )}
              </span>
            </div>
            <div className="mt-3 flex justify-end">
              <span
                aria-hidden
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-transform duration-150",
                  phase === "pressing" && "scale-95",
                )}
              >
                <SparklesIcon className="size-4" /> {aiPlanning.button}
              </span>
            </div>
          </div>

          {/* 2 · The agent's plan */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex h-6 items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                2 · Agent answers
              </p>
              {/* Status lives in the header row so the card never changes height. */}
              {phase === "thinking" && (
                <p
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  aria-hidden
                >
                  <SparklesIcon className="size-3.5 animate-pulse text-brand" />{" "}
                  Planning your campaign…
                </p>
              )}
              {phase === "done" && animated && (
                <button
                  type="button"
                  onClick={play}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcwIcon className="size-3.5" aria-hidden /> Replay
                </button>
              )}
            </div>

            <div className="relative">
              {/* Placeholder lines until the answer arrives; they pulse while the agent "thinks". */}
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 mt-4 space-y-3 transition-opacity duration-300",
                  showAnswer ? "opacity-0" : "opacity-100",
                  phase === "thinking" && "animate-pulse",
                )}
              >
                {aiPlanning.plan.map((row) => (
                  <div key={row.label} className="flex h-8 items-center gap-3">
                    <span className="size-8 rounded-lg bg-muted" />
                    <span className="h-2.5 w-24 rounded-full bg-muted" />
                    <span className="ml-auto h-2.5 w-32 rounded-full bg-muted" />
                  </div>
                ))}
                <div className="mt-4 flex gap-2 border-t pt-4">
                  <span className="h-6 w-40 rounded-md bg-muted" />
                  <span className="h-6 w-32 rounded-md bg-muted" />
                </div>
              </div>

              <dl className="mt-4 space-y-3">
                {aiPlanning.plan.map((row, i) => {
                  const Icon = icons[row.icon];
                  return (
                    <Reveal
                      key={row.label}
                      visible={rowVisible(i)}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-subtle text-brand">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <dt className="flex-1 text-muted-foreground">
                        {row.label}
                      </dt>
                      <dd className="text-right font-medium">{row.value}</dd>
                    </Reveal>
                  );
                })}
              </dl>

              <Reveal
                visible={rowVisible(aiPlanning.plan.length)}
                className="mt-4 border-t pt-4"
              >
                <p className="text-sm text-muted-foreground">Creative check</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {aiPlanning.tips.map((tip) => (
                    <li
                      key={tip}
                      className="rounded-md bg-brand-subtle px-2.5 py-1 text-xs font-medium text-brand-subtle-foreground"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </motion.div>

        <ul className="grid gap-4 md:grid-cols-3">
          {aiPlanning.capabilities.map((cap) => {
            const Icon = icons[cap.icon];
            return (
              <li key={cap.title} className="rounded-xl border bg-card p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-brand-subtle text-brand">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{cap.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{cap.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Fades and lifts a line in. Hidden lines keep their space, so the card never jumps. */
function Reveal({
  visible,
  className,
  children,
}: {
  visible: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "transition-[opacity,translate] duration-500 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
