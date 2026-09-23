"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  IconArrowUp,
  IconBan,
  IconCalendar,
  IconCheck,
  IconCircle,
  IconFlask,
  IconLoader2,
  IconMapSearch,
  IconPaperclip,
  IconReceipt,
  IconRocket,
  IconRoute,
  IconSparkles,
  IconTrendingUp,
  IconUsers,
  type TablerIcon,
} from "@tabler/icons-react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";

import { IllustratedMap, RANKED_FOCUS } from "@/components/sections/illustrated-map";
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
  mapSearch: IconMapSearch,
};

type Scenario = (typeof aiPlanning.scenarios)[number];
type Choice = Extract<Scenario, { choice: unknown }>["choice"];

/** The options the agent offers, for examples that stop for the visitor to pick. */
const choiceOf = (s: Scenario): Choice | undefined => ("choice" in s ? s.choice : undefined);
const recommendedOf = (c: Choice) => Math.max(0, c.options.findIndex((o) => o.recommended));
type RouteMap = Extract<Scenario, { map: unknown }>["map"];
/** Examples answered on a map (ranked routes) instead of a plan list. */
const mapOf = (s: Scenario): RouteMap | undefined => ("map" in s ? s.map : undefined);

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
const ROWS = 4; // …and four answer lines (plan rows, or the map and its three routes)

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

  // Once you're back above the section (it's entirely below the screen), rewind to the
  // empty prompt box, so coming down again replays the selected example. Scrolling on
  // past it leaves the demo running.
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (p > 0 || state === "composing") return;
    setTyped(0);
    setStep(0);
    setRows(0);
    setPicked(null);
    setPhase("composing");
  });

  const composing =
    phase === "composing" || phase === "typing" || phase === "submitting";

  return (
    <section ref={section} id="ai" className="scroll-mt-20 py-20">
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
              {mapOf(scenario)
                ? `${scenario.summary}, ${mapOf(scenario)?.homes}. ${mapOf(scenario)?.caption}: ${mapOf(scenario)?.matches.join(", ")}.`
                : `Suggested plan: ${planOf(scenario, pick)
                    .map((row) => `${row.label}: ${row.value}`)
                    .join(". ")}.`}
            </p>
          </div>

          <motion.div
            layout
            transition={{
              layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
            }}
            // Plays the selected example when the card is mostly on screen — the first
            // time, and again after you've scrolled back above the section (see above).
            onViewportEnter={() =>
              animated && state === "composing" && play(scenarioIndex)
            }
            viewport={{ amount: 0.5 }}
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
}: {
  scenario: Scenario;
  phase: Phase;
  step: number;
  rows: number;
  /** The option the visitor picked, for examples that offer a choice. */
  picked: number | null;
  onChoose?: (index: number) => void;
}) {
  const working = phase === "working";
  const choosing = phase === "choosing";
  const visible = (i: number) =>
    phase === "done" || (phase === "answering" && i < rows);
  const steps = scenario.steps;
  const choice = choiceOf(scenario);
  const plan = planOf(scenario, picked);
  const map = mapOf(scenario);

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
              · {map ? map.homes : `${steps.length} steps`}
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
          {map ? (
            <RoutesAnswer map={map} visible={visible} />
          ) : (
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
                  {/* The label stays on one line; a long value wraps instead. */}
                  <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
                  <dd className="flex-1 text-right font-medium">{row.value}</dd>
                </Reveal>
              );
            })}
          </dl>
          )}
        </>
      )}
    </div>
  );
}

/**
 * The "Find routes" answer: the ranked routes on a map, each fading in with its match
 * score. The view is framed around them, closer in on narrow cards so they stay legible.
 */
function RoutesAnswer({ map, visible }: { map: RouteMap; visible: (line: number) => boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 640, h: 208 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  // Pixels per map unit.
  const zoom = Math.min(1.1, Math.max(0.7, size.w / 560));
  const w = size.w / zoom;
  const h = size.h / zoom;

  return (
    <Reveal aria-hidden visible={visible(0)} className="mt-4">
      <div ref={box} className="relative h-52 overflow-hidden rounded-xl border">
        <IllustratedMap
          mode="route"
          cover
          label={null}
          view={{ x: RANKED_FOCUS.x - w / 2, y: RANKED_FOCUS.y - h / 2, w, h }}
          ranked={map.matches.map((match, i) => ({ match, visible: visible(i + 1) }))}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{map.caption}</p>
    </Reveal>
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
