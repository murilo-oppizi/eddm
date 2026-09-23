"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowUpIcon,
  CalendarIcon,
  CalendarRangeIcon,
  CheckIcon,
  CircleIcon,
  LoaderCircleIcon,
  MapPinIcon,
  PaletteIcon,
  PaperclipIcon,
  ReceiptIcon,
  RotateCcwIcon,
  RouteIcon,
  SparklesIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/sections/section-heading";
import { aiPlanning, site } from "@/content/site";
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

// One card that changes in place, like an AI composer: the brief types itself into the
// prompt box, gets submitted, the agent works through its steps, and the box becomes
// the agent's plan. Until the page has hydrated (and for visitors who prefer reduced
// motion) the card shows the finished plan, so the full text is always in the page.
type Phase = "composing" | "typing" | "submitting" | "working" | "answering" | "done";

const TYPE_MS = 20; // per character
const STEP_MS = 550; // per agent step
const ROW_MS = 220; // between answer lines
const STEPS = aiPlanning.steps.length;
const ROWS = aiPlanning.scenarios[0].plan.length + 2; // plan lines + tips + actions

/** Shared by the prompt box and the reply (≈ the finished plan's height), so swapping
 *  between them doesn't push the rest of the page around. */
const CARD_MIN_H = "min-h-80 sm:min-h-[27.5rem]";

const noop = () => () => {};
/** false during SSR and hydration, true afterwards. */
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

export function AiPlanning() {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion();
  const animated = hydrated && reduceMotion === false;

  const [scenarioIndex, setScenario] = useState(0);
  const [state, setPhase] = useState<Phase>("composing");
  const [typedCount, setTyped] = useState(0);
  const [stepCount, setStep] = useState(0);
  const [rowCount, setRows] = useState(0);

  const scenario = aiPlanning.scenarios[scenarioIndex];
  // What's on screen: the live demo when animating, otherwise the finished plan.
  const phase: Phase = animated ? state : "done";
  const typed = animated ? typedCount : scenario.brief.length;
  const step = animated ? stepCount : STEPS;
  const rows = animated ? rowCount : ROWS;

  const play = (index: number) => {
    setScenario(index);
    setTyped(0);
    setStep(0);
    setRows(0);
    setPhase("typing");
  };

  // Drive the timeline (all state changes happen in timer callbacks).
  useEffect(() => {
    if (!animated) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const next = (fn: () => void, ms: number) => (timer = setTimeout(fn, ms));
    if (state === "typing") {
      if (typedCount < scenario.brief.length) next(() => setTyped((n) => n + 1), TYPE_MS);
      else next(() => setPhase("submitting"), 350);
    } else if (state === "submitting") {
      next(() => setPhase("working"), 300);
    } else if (state === "working") {
      if (stepCount < STEPS) next(() => setStep((n) => n + 1), STEP_MS);
      else next(() => setPhase("answering"), 200);
    } else if (state === "answering") {
      if (rowCount < ROWS) next(() => setRows((n) => n + 1), ROW_MS);
      else next(() => setPhase("done"), 0);
    }
    return () => clearTimeout(timer);
  }, [animated, state, typedCount, stepCount, rowCount, scenario.brief.length]);

  const composing = phase === "composing" || phase === "typing" || phase === "submitting";

  return (
    <section id="ai" className="scroll-mt-20 py-20">
      <div className="container-page space-y-12">
        <SectionHeading eyebrow={aiPlanning.eyebrow} title={aiPlanning.title} body={aiPlanning.body} />

        <div className="mx-auto max-w-3xl">
          {/* What the card shows, for screen readers (the card itself is visual). */}
          <div className="sr-only" aria-live="polite">
            <p>Example brief: {scenario.brief}</p>
            <p>
              Suggested plan: {scenario.plan.map((row) => `${row.label}: ${row.value}`).join(". ")}.
              Creative tips: {scenario.tips.join(", ")}.
            </p>
          </div>

          <motion.div
            layout
            transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
            // Starts the demo the first time the card is mostly on screen.
            onViewportEnter={() => animated && state === "composing" && typedCount === 0 && play(0)}
            viewport={{ once: true, amount: 0.5 }}
            className="overflow-hidden rounded-3xl border bg-card shadow-lg"
          >
            <AnimatePresence mode="wait" initial={false}>
              {composing ? (
                <motion.div
                  key="composer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Composer phase={phase} text={scenario.brief.slice(0, typed)} zip={scenario.zip} />
                </motion.div>
              ) : (
                <motion.div
                  key="response"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Response
                    scenario={scenario}
                    phase={phase}
                    step={step}
                    rows={rows}
                    onNewBrief={
                      animated
                        ? () => {
                            setTyped(0);
                            setPhase("composing");
                          }
                        : undefined
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Example prompts, like the suggestion chips under AI composers. */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Try an example:</span>
            {aiPlanning.scenarios.map((s, i) => (
              <button
                key={s.chip}
                type="button"
                aria-pressed={i === scenarioIndex}
                onClick={() => (animated ? play(i) : setScenario(i))}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  i === scenarioIndex
                    ? "border-primary/30 bg-brand-subtle text-brand-subtle-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                )}
              >
                {s.chip}
              </button>
            ))}
          </div>
        </div>

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

/** The prompt box: text on top, toolbar with context chips and a round submit below. */
function Composer({ phase, text, zip }: { phase: Phase; text: string; zip: string }) {
  const empty = text.length === 0;
  return (
    <div aria-hidden className={cn("flex flex-col gap-4 p-5 sm:p-6", CARD_MIN_H)}>
      <p className={cn("flex-1 text-lg leading-relaxed", empty && "text-muted-foreground")}>
        {empty && phase === "composing" ? aiPlanning.placeholder : text}
        {phase === "typing" && (
          <span className="ml-0.5 inline-block h-[1.1em] w-0.5 translate-y-[0.2em] animate-pulse bg-primary" />
        )}
      </p>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full border text-muted-foreground">
            <PaperclipIcon className="size-4" />
          </span>
          <span
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm text-muted-foreground transition-opacity duration-300",
              empty ? "opacity-0" : "opacity-100"
            )}
          >
            <MapPinIcon className="size-4 text-brand" /> ZIP {zip}
          </span>
        </div>
        <span
          className={cn(
            "grid size-10 place-items-center rounded-full bg-primary text-primary-foreground transition-[opacity,scale] duration-150",
            empty && "opacity-40",
            phase === "submitting" && "scale-90"
          )}
        >
          <ArrowUpIcon className="size-5" />
        </span>
      </div>
    </div>
  );
}

type Scenario = (typeof aiPlanning.scenarios)[number];

/** The agent's reply, which replaces the prompt box once the brief is sent. */
function Response({
  scenario,
  phase,
  step,
  rows,
  onNewBrief,
}: {
  scenario: Scenario;
  phase: Phase;
  step: number;
  rows: number;
  onNewBrief?: () => void;
}) {
  const working = phase === "working";
  const visible = (i: number) => phase === "done" || (phase === "answering" && i < rows);
  const steps = aiPlanning.steps.map((s) => s.replace("{zip}", scenario.zip));

  return (
    <div className={cn("flex flex-col p-5 sm:p-6", CARD_MIN_H)}>
      {/* The brief, collapsed to a summary line */}
      {/* Padding on the wrapper: on the clamped element itself it would reveal the hidden line. */}
      <div aria-hidden className="rounded-2xl bg-muted/70 px-4 py-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">{scenario.brief}</p>
      </div>

      {/* Agent status: the current step while working, then a one-line summary */}
      <div aria-hidden className="mt-5 flex items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <SparklesIcon className="size-3.5" />
        </span>
        {working ? (
          <span className="animate-shimmer text-sm font-medium text-shimmer motion-reduce:animate-none">
            {steps[Math.min(step, steps.length - 1)]}…
          </span>
        ) : (
          <span className="text-sm font-medium">
            Plan ready <span className="font-normal text-muted-foreground">· {steps.length} steps</span>
          </span>
        )}
      </div>

      {working ? (
        <ul aria-hidden className="mt-4 space-y-2.5 pl-9.5 text-sm">
          {steps.map((label, i) => (
            <li
              key={label}
              className={cn(
                "flex items-center gap-2",
                i > step ? "text-muted-foreground/50" : "text-muted-foreground"
              )}
            >
              {i < step ? (
                <CheckIcon className="size-4 text-brand" />
              ) : i === step ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <CircleIcon className="size-4" />
              )}
              {label}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <dl aria-hidden className="mt-4 divide-y rounded-2xl border">
            {scenario.plan.map((row, i) => {
              const Icon = icons[row.icon];
              return (
                <Reveal key={row.label} visible={visible(i)} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <Icon className="size-4 shrink-0 text-brand" />
                  <dt className="flex-1 text-muted-foreground">{row.label}</dt>
                  <dd className="text-right font-medium">{row.value}</dd>
                </Reveal>
              );
            })}
          </dl>

          <Reveal
            visible={visible(scenario.plan.length)}
            className="mt-4 flex flex-wrap items-center gap-2"
            aria-hidden
          >
            <span className="text-sm text-muted-foreground">Creative check:</span>
            {scenario.tips.map((tip) => (
              <span
                key={tip}
                className="rounded-full bg-brand-subtle px-2.5 py-1 text-xs font-medium text-brand-subtle-foreground"
              >
                {tip}
              </span>
            ))}
          </Reveal>

          <Reveal visible={visible(scenario.plan.length + 1)} className="mt-auto flex flex-wrap gap-2 pt-6">
            <Button size="lg" nativeButton={false} render={<Link href={site.primaryCta.href} />}>
              Launch this campaign
            </Button>
            {onNewBrief && (
              <Button size="lg" variant="ghost" onClick={onNewBrief}>
                <RotateCcwIcon data-icon="inline-start" /> New brief
              </Button>
            )}
          </Reveal>
        </>
      )}
    </div>
  );
}

/** Fades and lifts a line in. Hidden lines keep their space, so the card never jumps. */
function Reveal({
  visible,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { visible: boolean }) {
  return (
    <div
      className={cn(
        "transition-[opacity,translate] duration-500 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
