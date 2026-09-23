"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  IconArrowUp,
  IconBan,
  IconCalendar,
  IconChartBar,
  IconCheck,
  IconCircle,
  IconFlask,
  IconLoader2,
  IconPaperclip,
  IconReceipt,
  IconRocket,
  IconRotate,
  IconRoute,
  IconSparkles,
  IconTrendingUp,
  IconUserSearch,
  IconUsers,
  type TablerIcon,
} from "@tabler/icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/sections/section-heading";
import { aiPlanning } from "@/content/site";
import { cn } from "@/lib/utils";

const icons: Record<string, TablerIcon> = {
  route: IconRoute,
  users: IconUsers,
  calendar: IconCalendar,
  receipt: IconReceipt,
  ban: IconBan,
  trending: IconTrendingUp,
  flask: IconFlask,
  rocket: IconRocket,
  userSearch: IconUserSearch,
  chart: IconChartBar,
};

type Scenario = (typeof aiPlanning.scenarios)[number];
type Choice = Extract<Scenario, { choice: unknown }>["choice"];

/** The options the agent offers, for examples that stop for the visitor to pick. */
const choiceOf = (s: Scenario): Choice | undefined => ("choice" in s ? s.choice : undefined);
const recommendedOf = (c: Choice) => Math.max(0, c.options.findIndex((o) => o.recommended));
/** The plan to show: the example's own, or the one for the option picked. */
const planOf = (s: Scenario, picked: number | null) => {
  const c = choiceOf(s);
  if (c) return c.options[picked ?? recommendedOf(c)].plan;
  return "plan" in s ? s.plan : [];
};

// One card that changes in place, like an AI composer: the brief types itself into the
// prompt box, gets submitted, the agent works through its steps, and the box becomes
// the agent's plan. Some examples stop halfway for the visitor to pick between the
// options the agent offers; their pick shows as their reply, then the plan follows. Until the page has hydrated (and for visitors who prefer reduced
// motion) the card shows the finished plan, so the full text is always in the page.
type Phase =
  | "composing"
  | "typing"
  | "submitting"
  | "working"
  | "choosing"
  | "answering"
  | "done";

// 1.5× the original pacing (agent steps a bit longer), so each stage can be read (≈ 10s).
const TYPE_MS = 30; // per character
const PAUSE_MS = 525; // after the brief is typed
const SUBMIT_MS = 450; // the button press
const STEP_MS = 1100; // per agent step — slower than the rest so each step can be read
const ROW_MS = 330; // between answer lines
const STEPS = 4; // every example has four agent steps…
const ROWS = 4 + 1; // …and four plan lines, plus the "Run again" button

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
  const [picked, setPicked] = useState<number | null>(null);

  const scenario = aiPlanning.scenarios[scenarioIndex];
  // What's on screen: the live demo when animating, otherwise the finished plan.
  const phase: Phase = animated ? state : "done";
  const typed = animated ? typedCount : scenario.brief.length;
  const step = animated ? stepCount : STEPS;
  const rows = animated ? rowCount : ROWS;
  const choice = choiceOf(scenario);
  const pick = animated ? picked : choice ? recommendedOf(choice) : null;

  const play = (index: number) => {
    setScenario(index);
    setTyped(0);
    setStep(0);
    setRows(0);
    setPicked(null);
    setPhase("typing");
  };

  const choose = (index: number) => {
    setPicked(index);
    setRows(0);
    setPhase("answering");
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
      // Examples with options wait for the visitor's pick (see choose).
      else next(() => setPhase(choice ? "choosing" : "answering"), 300);
    } else if (state === "answering") {
      if (rowCount < ROWS) next(() => setRows((n) => n + 1), ROW_MS);
      else next(() => setPhase("done"), 0);
    }
    return () => clearTimeout(timer);
  }, [animated, state, typedCount, stepCount, rowCount, scenario.brief.length, choice]);

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
          {/* Three equal tabs (icon over label) on phones; one pill row from md up, with the area from lg. */}
          <div className="flex justify-center">
            <div
              role="group"
              aria-label="Example briefs"
              className="grid w-full grid-cols-3 gap-1 rounded-lg border bg-muted/60 p-1 md:inline-flex md:w-auto"
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
                      "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-center text-xs leading-tight font-medium transition-all md:whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:flex-row md:gap-2 md:px-4 md:text-sm",
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
                    <span className="hidden font-normal text-muted-foreground lg:inline">
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
              {choice && pick !== null && `${choice.prompt} Picked: ${choice.options[pick].title}. `}
              Suggested plan:{" "}
              {planOf(scenario, pick)
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
            className="overflow-hidden rounded-2xl border bg-card shadow-lg"
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
                  picked={pick ?? (choice ? recommendedOf(choice) : null)}
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
                        picked={pick}
                        onChoose={animated ? choose : undefined}
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
      </div>
    </section>
  );
}

/** The prompt box: text on top, toolbar with an attach button and submit below. */
function Composer({ phase, text }: { phase: Phase; text: string }) {
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
        <span className="grid size-9 place-items-center rounded-lg border text-muted-foreground">
          <IconPaperclip className="size-4" />
        </span>
        <span
          className={cn(
            "grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground transition-[opacity,scale] duration-150",
            empty && "opacity-40",
            phase === "submitting" && "scale-90",
          )}
        >
          <IconArrowUp className="size-5" />
        </span>
      </div>
    </div>
  );
}

/** The agent's reply, which replaces the prompt box once the brief is sent. */
function Response({
  scenario,
  phase,
  step,
  rows,
  picked,
  onChoose,
  onRunAgain,
}: {
  scenario: Scenario;
  phase: Phase;
  step: number;
  rows: number;
  /** The option the visitor picked, for examples that offer a choice. */
  picked: number | null;
  onChoose?: (index: number) => void;
  onRunAgain?: () => void;
}) {
  const working = phase === "working";
  const choosing = phase === "choosing";
  const visible = (i: number) =>
    phase === "done" || (phase === "answering" && i < rows);
  const steps = scenario.steps;
  const choice = choiceOf(scenario);
  const plan = planOf(scenario, picked);

  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      {/* The brief, collapsed to a summary line */}
      {/* Padding on the wrapper: on the clamped element itself it would reveal the hidden line. */}
      <div aria-hidden className="rounded-xl bg-muted/70 px-4 py-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {scenario.brief}
        </p>
      </div>

      {/* The visitor's pick, as their reply */}
      {choice && picked !== null && !working && !choosing && (
        <div aria-hidden className="mt-3 flex justify-end">
          <p className="flex items-center gap-1.5 rounded-xl bg-brand-subtle px-4 py-2 text-sm font-medium text-brand-subtle-foreground">
            <IconCheck className="size-4" /> {choice.options[picked].title}
          </p>
        </div>
      )}

      {/* Agent status: the current step while working, the question while it waits for a
          pick, then a one-line summary */}
      <div aria-hidden className="mt-5 flex items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <IconSparkles className="size-3.5" />
        </span>
        {working ? (
          <span className="animate-shimmer text-sm font-medium text-shimmer motion-reduce:animate-none">
            {steps[Math.min(step, steps.length - 1)]}…
          </span>
        ) : choosing && choice ? (
          <span className="text-sm font-medium">{choice.prompt}</span>
        ) : (
          <span className="text-sm font-medium">
            {scenario.summary}{" "}
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
                <IconCheck className="size-4 text-brand" />
              ) : i === step ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconCircle className="size-4" />
              )}
              {label}
            </li>
          ))}
        </ul>
      ) : choosing && choice ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:pl-9.5">
          {choice.options.map((option, i) => (
            <motion.button
              key={option.title}
              type="button"
              onClick={() => onChoose?.(i)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex cursor-pointer flex-col items-start gap-1 rounded-xl border bg-card p-4 text-left transition-colors outline-none hover:border-primary/40 hover:bg-brand-subtle/40 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-semibold">{option.title}</span>
                {option.recommended && (
                  <span className="rounded-md bg-brand-subtle px-1.5 py-0.5 text-[11px] leading-none font-medium text-brand">
                    Recommended
                  </span>
                )}
              </span>
              <span className="text-sm text-muted-foreground">{option.detail}</span>
              <span className="mt-1 text-xs font-medium text-foreground/80 tabular-nums">{option.meta}</span>
            </motion.button>
          ))}
        </div>
      ) : (
        <>
          <dl aria-hidden className="mt-4 divide-y rounded-xl border">
            {plan.map((row, i) => {
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
              visible={visible(plan.length)}
              className="mt-auto flex justify-center pt-6"
            >
              <Button
                variant="outline"
                size="lg"
                onClick={onRunAgain}
              >
                <IconRotate data-icon="inline-start" /> Run again
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
