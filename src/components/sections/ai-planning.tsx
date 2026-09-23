"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowUpIcon,
  CalendarIcon,
  CalendarRangeIcon,
  CheckIcon,
  CircleIcon,
  CoffeeIcon,
  DumbbellIcon,
  LoaderCircleIcon,
  MapPinIcon,
  PaletteIcon,
  PaperclipIcon,
  ReceiptIcon,
  RotateCcwIcon,
  RouteIcon,
  SparklesIcon,
  UsersIcon,
  UtensilsCrossedIcon,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
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
  coffee: CoffeeIcon,
  dumbbell: DumbbellIcon,
  utensils: UtensilsCrossedIcon,
};

// One card that changes in place, like an AI composer: the brief types itself into the
// prompt box, gets submitted, the agent works through its steps, and the box becomes
// the agent's plan. Until the page has hydrated (and for visitors who prefer reduced
// motion) the card shows the finished plan, so the full text is always in the page.
type Phase =
  "composing" | "typing" | "submitting" | "working" | "answering" | "done";

// 1.5× the original pacing, so each stage can be read (≈ 9s end to end).
const TYPE_MS = 30; // per character
const PAUSE_MS = 525; // after the brief is typed
const SUBMIT_MS = 450; // the button press
const STEP_MS = 825; // per agent step
const ROW_MS = 330; // between answer lines
const STEPS = aiPlanning.steps.length;
const ROWS = aiPlanning.scenarios[0].plan.length + 1; // plan lines + the "Run again" button

const noop = () => () => {};
/** false during SSR and hydration, true afterwards. */
const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

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
      if (typedCount < scenario.brief.length)
        next(() => setTyped((n) => n + 1), TYPE_MS);
      else next(() => setPhase("submitting"), PAUSE_MS);
    } else if (state === "submitting") {
      next(() => setPhase("working"), SUBMIT_MS);
    } else if (state === "working") {
      if (stepCount < STEPS) next(() => setStep((n) => n + 1), STEP_MS);
      else next(() => setPhase("answering"), 300);
    } else if (state === "answering") {
      if (rowCount < ROWS) next(() => setRows((n) => n + 1), ROW_MS);
      else next(() => setPhase("done"), 0);
    }
    return () => clearTimeout(timer);
  }, [animated, state, typedCount, stepCount, rowCount, scenario.brief.length]);

  const composing =
    phase === "composing" || phase === "typing" || phase === "submitting";

  return (
    <section id="ai" className="scroll-mt-20 py-20">
      <div className="container-page space-y-12">
        <div className="space-y-8">
          <SectionHeading
            eyebrow={aiPlanning.eyebrow}
            title={aiPlanning.title}
            body={aiPlanning.body}
          />

          {/* Example briefs as a segmented control, like the suggestion chips of AI composers. */}
          {/* Three equal tabs (icon over label) on phones; one pill row from sm up. */}
          <div className="flex justify-center">
            <div
              role="group"
              aria-label="Example briefs"
              className="grid w-full grid-cols-3 gap-1 rounded-2xl border bg-muted/60 p-1 sm:inline-flex sm:w-auto sm:rounded-full"
            >
              {aiPlanning.scenarios.map((s, i) => {
                const Icon = icons[s.icon];
                const active = i === scenarioIndex;
                return (
                  <button
                    key={s.chip}
                    type="button"
                    aria-pressed={active}
                    onClick={() => (animated ? play(i) : setScenario(i))}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:text-sm",
                      active
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn("size-4", active && "text-brand")}
                      aria-hidden
                    />
                    {s.chip}
                    <span className="hidden font-normal text-muted-foreground sm:inline">
                      · {s.area}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          {/* What the card shows, for screen readers (the card itself is visual). */}
          <div className="sr-only" aria-live="polite">
            <p>Example brief: {scenario.brief}</p>
            <p>
              Suggested plan:{" "}
              {scenario.plan
                .map((row) => `${row.label}: ${row.value}`)
                .join(". ")}
              .
            </p>
          </div>

          <motion.div
            layout
            transition={{
              layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
            }}
            // Starts the demo the first time the card is mostly on screen.
            onViewportEnter={() =>
              animated && state === "composing" && typedCount === 0 && play(0)
            }
            viewport={{ once: true, amount: 0.5 }}
            className="overflow-hidden rounded-3xl border bg-card shadow-lg"
          >
            {/* The card is exactly as tall as the finished plan: an invisible copy of it sits in
                the same grid cell as the live view, whatever the screen size or example. */}
            <div className="grid">
              <div aria-hidden className="invisible [grid-area:1/1]">
                <Response
                  scenario={scenario}
                  phase="done"
                  step={STEPS}
                  rows={ROWS}
                  onRunAgain={animated ? () => {} : undefined}
                />
              </div>
              <div className="[grid-area:1/1]">
                <AnimatePresence mode="wait" initial={false}>
                  {composing ? (
                    <motion.div
                      key="composer"
                      className="h-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Composer
                        phase={phase}
                        text={scenario.brief.slice(0, typed)}
                        zip={scenario.zip}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="response"
                      className="h-full"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45 }}
                    >
                      <Response
                        scenario={scenario}
                        phase={phase}
                        step={step}
                        rows={rows}
                        onRunAgain={
                          animated ? () => play(scenarioIndex) : undefined
                        }
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
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
function Composer({
  phase,
  text,
  zip,
}: {
  phase: Phase;
  text: string;
  zip: string;
}) {
  const empty = text.length === 0;
  return (
    <div aria-hidden className="flex h-full flex-col gap-4 p-5 sm:p-6">
      <p
        className={cn(
          "flex-1 text-lg leading-relaxed",
          empty && "text-muted-foreground",
        )}
      >
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
              empty ? "opacity-0" : "opacity-100",
            )}
          >
            <MapPinIcon className="size-4 text-brand" /> ZIP {zip}
          </span>
        </div>
        <span
          className={cn(
            "grid size-10 place-items-center rounded-full bg-primary text-primary-foreground transition-[opacity,scale] duration-150",
            empty && "opacity-40",
            phase === "submitting" && "scale-90",
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
  onRunAgain,
}: {
  scenario: Scenario;
  phase: Phase;
  step: number;
  rows: number;
  onRunAgain?: () => void;
}) {
  const working = phase === "working";
  const visible = (i: number) =>
    phase === "done" || (phase === "answering" && i < rows);
  const steps = aiPlanning.steps.map((s) => s.replace("{zip}", scenario.zip));

  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      {/* The brief, collapsed to a summary line */}
      {/* Padding on the wrapper: on the clamped element itself it would reveal the hidden line. */}
      <div aria-hidden className="rounded-2xl bg-muted/70 px-4 py-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {scenario.brief}
        </p>
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
            Plan ready{" "}
            <span className="font-normal text-muted-foreground">
              · {steps.length} steps
            </span>
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
                i > step ? "text-muted-foreground/50" : "text-muted-foreground",
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
                <Reveal
                  key={row.label}
                  visible={visible(i)}
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                >
                  <Icon className="size-4 shrink-0 text-brand" />
                  <dt className="flex-1 text-muted-foreground">{row.label}</dt>
                  <dd className="text-right font-medium">{row.value}</dd>
                </Reveal>
              );
            })}
          </dl>

          {onRunAgain && (
            <Reveal
              visible={visible(scenario.plan.length)}
              className="mt-auto flex justify-center pt-6"
            >
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-4"
                onClick={onRunAgain}
              >
                <RotateCcwIcon data-icon="inline-start" /> Run again
              </Button>
            </Reveal>
          )}
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
        "transition-[opacity,translate] duration-750 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
