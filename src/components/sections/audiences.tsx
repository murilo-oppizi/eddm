"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconArrowsMaximize,
  IconBarbell,
  IconBuildingBank,
  IconCarGarage,
  IconDental,
  IconHammer,
  IconHeartHandshake,
  IconHomeDollar,
  IconPaw,
  IconPlant2,
  IconQrcode,
  IconScissors,
  IconSchool,
  IconShoppingBag,
  IconTicket,
  IconTool,
  IconToolsKitchen2,
  IconTruckDelivery,
  type TablerIcon,
} from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  type MotionValue,
} from "motion/react";

import { SectionHeading } from "@/components/sections/section-heading";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { audiences } from "@/content/site";
import { playKey } from "@/lib/key-sounds";
import { cn } from "@/lib/utils";

// "Who it's for" as a picker wheel, like the iPhone's date picker: an endless drum of
// business types (horizontal cards: icon + name) that you spin with the mouse wheel, a
// drag or a swipe; the one in the middle is chosen. Over the wheel the pointer becomes the
// flyer of the business under it. Clicking (or tapping) the chosen one opens its card in a
// dialog: its name, what EDDM does for it, three moments to mail and its flyer.

type Industry = (typeof audiences.industries)[number];
const industries = audiences.industries;
const N = industries.length;

const icons: Record<Industry["icon"], TablerIcon> = {
  restaurant: IconToolsKitchen2,
  realEstate: IconHomeDollar,
  salon: IconScissors,
  homeServices: IconTool,
  gym: IconBarbell,
  retail: IconShoppingBag,
  dental: IconDental,
  autoRepair: IconCarGarage,
  pets: IconPaw,
  landscaping: IconPlant2,
  school: IconSchool,
  community: IconHeartHandshake,
  events: IconTicket,
  delivery: IconTruckDelivery,
  builders: IconHammer,
  finance: IconBuildingBank,
};

// Each industry's tint: Oppizi's status tokens, and colors from the design system's
// scales for the rest (written out in full so Tailwind generates each class).
const tones: Record<Industry["tone"], { panel: string; text: string; icon: string }> = {
  info: { panel: "bg-info-subtle", text: "text-info-subtle-foreground", icon: "text-info" },
  success: { panel: "bg-success-subtle", text: "text-success-subtle-foreground", icon: "text-success" },
  warning: { panel: "bg-warning-subtle", text: "text-warning-subtle-foreground", icon: "text-warning" },
  ai: { panel: "bg-ai-subtle", text: "text-ai-subtle-foreground", icon: "text-ai" },
  neutral: { panel: "bg-muted", text: "text-foreground", icon: "text-foreground" },
  cyan: {
    panel: "bg-(--ds-tw-cyan-50) dark:bg-(--ds-tw-cyan-950)",
    text: "text-(--ds-tw-cyan-800) dark:text-(--ds-tw-cyan-200)",
    icon: "text-(--ds-tw-cyan-600)",
  },
  sky: {
    panel: "bg-(--ds-tw-sky-50) dark:bg-(--ds-tw-sky-950)",
    text: "text-(--ds-tw-sky-800) dark:text-(--ds-tw-sky-200)",
    icon: "text-(--ds-tw-sky-600)",
  },
  orange: {
    panel: "bg-(--ds-tw-orange-50) dark:bg-(--ds-tw-orange-950)",
    text: "text-(--ds-tw-orange-800) dark:text-(--ds-tw-orange-200)",
    icon: "text-(--ds-tw-orange-600)",
  },
  rose: {
    panel: "bg-(--ds-tw-rose-50) dark:bg-(--ds-tw-rose-950)",
    text: "text-(--ds-tw-rose-800) dark:text-(--ds-tw-rose-200)",
    icon: "text-(--ds-tw-rose-600)",
  },
  lime: {
    panel: "bg-(--ds-tw-lime-50) dark:bg-(--ds-tw-lime-950)",
    text: "text-(--ds-tw-lime-800) dark:text-(--ds-tw-lime-200)",
    icon: "text-(--ds-tw-lime-700)",
  },
  indigo: {
    panel: "bg-(--ds-tw-indigo-50) dark:bg-(--ds-tw-indigo-950)",
    text: "text-(--ds-tw-indigo-800) dark:text-(--ds-tw-indigo-200)",
    icon: "text-(--ds-tw-indigo-600)",
  },
  teal: {
    panel: "bg-(--ds-tw-teal-50) dark:bg-(--ds-tw-teal-950)",
    text: "text-(--ds-tw-teal-800) dark:text-(--ds-tw-teal-200)",
    icon: "text-(--ds-tw-teal-600)",
  },
  fuchsia: {
    panel: "bg-(--ds-tw-fuchsia-50) dark:bg-(--ds-tw-fuchsia-950)",
    text: "text-(--ds-tw-fuchsia-800) dark:text-(--ds-tw-fuchsia-200)",
    icon: "text-(--ds-tw-fuchsia-600)",
  },
  violet: {
    panel: "bg-(--ds-tw-violet-50) dark:bg-(--ds-tw-violet-950)",
    text: "text-(--ds-tw-violet-800) dark:text-(--ds-tw-violet-200)",
    icon: "text-(--ds-tw-violet-600)",
  },
  amber: {
    panel: "bg-(--ds-tw-amber-50) dark:bg-(--ds-tw-amber-950)",
    text: "text-(--ds-tw-amber-800) dark:text-(--ds-tw-amber-200)",
    icon: "text-(--ds-tw-amber-600)",
  },
  emerald: {
    panel: "bg-(--ds-tw-emerald-50) dark:bg-(--ds-tw-emerald-950)",
    text: "text-(--ds-tw-emerald-800) dark:text-(--ds-tw-emerald-200)",
    icon: "text-(--ds-tw-emerald-600)",
  },
};

const mod = (n: number) => ((n % N) + N) % N;
const snap = { type: "spring", stiffness: 260, damping: 30 } as const;

export function Audiences() {
  // The wheel's position, in rows (fractional while it moves); the chosen business is
  // the row nearest the middle.
  const position = useMotionValue(0);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(position, "change", (p) => {
    const i = mod(Math.round(p));
    if (i !== active) {
      setActive(i);
      playKey("tick", { gain: 0.16, pitch: 1.25 }); // a detent, if the meter's sounds are on
    }
  });

  return (
    <MotionConfig reducedMotion="user">
      <section id="who-its-for" className="scroll-mt-20 py-20">
        <div className="container-page space-y-10">
          <SectionHeading eyebrow={audiences.eyebrow} title={audiences.title} body={audiences.body} />
          <div className="mx-auto max-w-xl">
            <Wheel position={position} onOpen={() => setOpen(true)} />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <span className="pointer-coarse:hidden">Spin to find your business, then click it to see its plan.</span>
              <span className="hidden pointer-coarse:inline">Swipe to find your business, then tap it to see its plan.</span>
            </p>
          </div>
        </div>
        <BusinessDialog industry={industries[active]} open={open} onOpenChange={setOpen} />
      </section>
    </MotionConfig>
  );
}

/* ------------------------------ The wheel ------------------------------ */

const ROW = 64; // px between rows
const STEP = 20; // degrees each row turns away from the middle
const RADIUS = ROW / ((STEP * Math.PI) / 180); // the drum's radius, so rows sit ROW apart
const REACH = 4; // rows drawn on each side of the middle

/**
 * An endless drum of business cards. Spin it with the mouse wheel (while the pointer is on
 * it), a drag or a swipe (with momentum) or the arrow keys; click a card to bring it to
 * the middle, or the middle one (or Enter) to open it. Rows curve away above and below
 * and fade. With a mouse, the pointer is the flyer of the business under it.
 */
function Wheel({ position, onOpen }: { position: MotionValue<number>; onOpen: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  useMotionValueEvent(position, "change", setP);
  const moving = useRef<ReturnType<typeof animate> | null>(null);
  const settle = useRef(0);

  const goTo = (target: number, velocity = 0) => {
    moving.current?.stop();
    moving.current = animate(position, target, { ...snap, velocity });
  };
  /** Rows from the middle to the point at clientY. */
  const rowsFromMiddle = (clientY: number) => {
    const r = el.current?.getBoundingClientRect();
    return r ? (clientY - (r.top + r.height / 2)) / ROW : 0;
  };

  // The mouse wheel spins it (and settles on a row once it stops). Not passive, so the
  // page doesn't scroll while you spin it.
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      moving.current?.stop();
      position.set(position.get() + e.deltaY / ROW / 1.6);
      window.clearTimeout(settle.current);
      settle.current = window.setTimeout(() => goTo(Math.round(position.get())), 120);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
    // goTo only reads refs and the stable motion value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  // The flyer pointer (mouse only): follows the pointer and shows the business under it,
  // at a fresh random tilt each time that business changes, whether the pointer moved or
  // the wheel spun under it.
  const [hover, setHover] = useState<{ row: number; business: number; angle: number } | null>(null);
  const tilted = (row: number, business: number) =>
    setHover((h) => {
      if (h && h.row === row && h.business === business) return h;
      if (h && h.business === business) return { ...h, row };
      // -11° to -3° or 3° to 9°: never quite straight
      const tilt = 3 + Math.random() * 7;
      return { row, business, angle: Math.random() < 0.6 ? -tilt - 1 : tilt - 1 };
    });
  useMotionValueEvent(position, "change", (v) => {
    if (hover) tilted(hover.row, mod(Math.round(v) + hover.row));
  });
  const fx = useSpring(0, { stiffness: 500, damping: 40, mass: 0.4 });
  const fy = useSpring(0, { stiffness: 500, damping: 40, mass: 0.4 });
  const wrap = useRef<HTMLDivElement>(null);
  const trackFlyer = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = wrap.current?.getBoundingClientRect();
    if (!r) return;
    fx.set(e.clientX - r.left);
    fy.set(e.clientY - r.top);
    const row = Math.round(rowsFromMiddle(e.clientY));
    tilted(row, mod(Math.round(position.get()) + row));
  };

  // Dragging: follows the finger or mouse; on release it coasts with the flick's speed and
  // lands on a row. A press without movement is a click on the card under it.
  const drag = useRef<{ y: number; from: number; t: number; v: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    moving.current?.stop();
    drag.current = { y: e.clientY, from: position.get(), t: performance.now(), v: 0, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    trackFlyer(e);
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (Math.abs(dy) > 4) d.moved = true;
    const next = d.from - dy / ROW;
    const now = performance.now();
    d.v = ((next - position.get()) / Math.max(1, now - d.t)) * 1000; // rows per second
    d.t = now;
    position.set(next);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) {
      // A click: open the chosen one, or bring the one under the pointer to the middle.
      const rows = Math.round(rowsFromMiddle(e.clientY));
      if (rows === 0 && Math.abs(position.get() - Math.round(position.get())) < 0.2) onOpen();
      else goTo(Math.round(position.get()) + rows);
      return;
    }
    goTo(Math.round(position.get() + d.v * 0.18), d.v);
  };

  const base = Math.round(p);
  const slots = Array.from({ length: REACH * 2 + 1 }, (_, k) => base - REACH + k);
  const hovered = hover ? industries[hover.business] : null;

  return (
    <div ref={wrap} className="relative">
      <div
        ref={el}
        role="listbox"
        tabIndex={0}
        aria-label="Kinds of business. Enter opens the chosen one."
        aria-activedescendant={`wheel-${mod(base)}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
            return;
          }
          const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
          if (!step) return;
          e.preventDefault();
          goTo(Math.round(position.get()) + step);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => setHover(null)}
        className={cn(
          "relative h-80 touch-none overflow-hidden rounded-3xl bg-muted/60 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-[26rem] [mask-image:linear-gradient(transparent,black_22%,black_78%,transparent)] [perspective:900px]",
          hover ? "cursor-none" : "cursor-grab active:cursor-grabbing"
        )}
      >
        {/* The window the chosen card sits in */}
        <span aria-hidden className="absolute inset-x-3 top-1/2 h-15 -translate-y-1/2 rounded-2xl bg-foreground/[0.04]" />
        {slots.map((v) => {
          const d = v - p; // rows from the middle
          const angle = d * STEP;
          if (Math.abs(angle) >= 90) return null;
          const i = mod(v);
          const item = industries[i];
          const Icon = icons[item.icon];
          const tone = tones[item.tone];
          const chosen = Math.abs(d) < 0.5;
          return (
            <div
              key={v}
              id={chosen ? `wheel-${i}` : undefined}
              role="option"
              aria-selected={chosen}
              className="absolute inset-x-5 top-1/2 flex h-14 items-center gap-3 rounded-2xl bg-card px-3 shadow-sm will-change-transform"
              style={{
                transform: `translateY(calc(-50% + ${RADIUS * Math.sin((angle * Math.PI) / 180)}px)) rotateX(${-angle}deg)`,
                opacity: Math.cos((angle * Math.PI) / 180) ** 1.6,
                boxShadow: chosen ? "0 6px 20px -8px rgb(0 0 0 / 0.25)" : undefined,
              }}
            >
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", tone.panel, tone.icon)}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className={cn("truncate font-heading font-semibold tracking-tight", chosen ? "text-foreground" : "text-muted-foreground")}>
                {item.name}
              </span>
              {chosen && (
                <IconArrowsMaximize className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
            </div>
          );
        })}
      </div>

      {/* The flyer as the pointer: outside the wheel, so its fade and clip don't cut it */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 z-20 w-44"
            style={{ x: fx, y: fy, translateX: "-50%", translateY: "-50%" }}
            initial={{ opacity: 0, scale: 0.6, rotate: (hover?.angle ?? -6) * 1.8 }}
            animate={{ opacity: 1, scale: 1, rotate: hover?.angle ?? -6 }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
          >
            <Postcard industry={hovered} />
            <span className="mt-1.5 block text-center text-[10px] font-semibold tracking-wide text-foreground/70 uppercase">
              {hover?.row === 0 ? "Click to open" : "Click to choose"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------------------- The business card ---------------------------- */

/**
 * The chosen business, in a dialog over the blurred page: a white card with its name,
 * what EDDM does for it and its three moments to mail on one side, and its flyer, large
 * and tilted, on a soft panel in its color on the other. Stacked on phones. Picking a
 * moment swaps the flyer for that moment's: the old one pulls back, then shoots off to the
 * right with a motion blur; the new one flies in from the left and lands with a bounce.
 */
function BusinessDialog({
  industry,
  open,
  onOpenChange,
}: {
  industry: Industry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const Icon = icons[industry.icon];
  const tone = tones[industry.tone];
  // The chosen moment: back to the first once the card has closed, and for each business.
  const [chosen, setChosen] = useState({ key: "", i: 0 });
  const k = industry.name;
  const current = chosen.key === k ? chosen.i : 0;
  const moment = industry.moments[current];
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(isOpen) => !isOpen && setChosen({ key: "", i: 0 })}
    >
      <DialogContent className="max-w-4xl">
        <div
          className={cn(
            "grid max-h-[calc(100svh-3rem)] gap-8 overflow-y-auto rounded-3xl border bg-card p-6 shadow-2xl sm:p-8 md:grid-cols-[1fr_1.2fr] md:items-stretch md:gap-8"
          )}
        >
          <div className="md:py-2 md:pl-2">
            <span className={cn("grid size-12 place-items-center rounded-2xl", tone.panel, tone.icon)}>
              <Icon className="size-6" aria-hidden />
            </span>
            <DialogTitle className="mt-5 text-3xl leading-tight font-bold tracking-tight">{industry.name}</DialogTitle>
            <p className="mt-3 text-muted-foreground">{industry.body}</p>

            <p className={cn("mt-8 text-xs font-semibold tracking-wider uppercase", tone.text)}>3 moments to mail</p>
            <ol className="mt-3 divide-y divide-dashed divide-border border-y border-dashed border-border">
              {industry.moments.map((m, i) => {
                const on = i === current;
                return (
                  <li key={m.title} className="py-1">
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setChosen({ key: k, i })}
                      className={cn(
                        "group -mx-3 flex w-[calc(100%+1.5rem)] cursor-pointer items-baseline gap-4 rounded-xl px-3 py-2.5 text-left outline-none transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/50",
                        on && tone.panel
                      )}
                    >
                      <span
                        className={cn(
                          "font-heading text-sm font-bold tabular-nums transition-colors",
                          on ? tone.icon : "text-muted-foreground/60"
                        )}
                      >
                        0{i + 1}
                      </span>
                      <span
                        className={cn(
                          "flex-1 font-heading text-lg leading-snug font-semibold tracking-tight transition-colors",
                          on ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {m.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <figure className={cn("flex flex-col justify-center overflow-hidden rounded-2xl px-6 py-8 sm:px-10", tone.panel)}>
            {/* The flyer: sent off and replaced whenever the moment changes */}
            <div className="grid">
              <AnimatePresence initial={false}>
                <motion.div
                  key={current}
                  className="drop-shadow-sm [grid-area:1/1]"
                  initial={{ x: "-135%", rotate: -7, opacity: 0, filter: "blur(6px)" }}
                  animate={{
                    x: 0,
                    rotate: 2,
                    opacity: 1,
                    filter: "blur(0px)",
                    transition: {
                      x: { type: "spring", stiffness: 150, damping: 13, mass: 0.9, delay: 0.32 },
                      rotate: { type: "spring", stiffness: 140, damping: 9, delay: 0.32 },
                      opacity: { duration: 0.2, delay: 0.32 },
                      filter: { duration: 0.35, delay: 0.38 },
                    },
                  }}
                  exit={{
                    // A wind-up (a small pull back and lift), then off to the right, blurring.
                    x: ["0%", "-7%", "140%"],
                    y: ["0%", "-2%", "-4%"],
                    rotate: [2, -3, 9],
                    scale: [1, 1.03, 0.94],
                    opacity: [1, 1, 0],
                    filter: ["blur(0px)", "blur(0px)", "blur(6px)"],
                    transition: { duration: 0.62, times: [0, 0.32, 1], ease: ["easeOut", [0.6, 0, 0.9, 0.4]] },
                  }}
                >
                  <Postcard industry={industry} copy={moment} />
                </motion.div>
              </AnimatePresence>
            </div>
            <figcaption className={cn("mt-5 text-center text-xs font-medium", tone.text)} aria-live="polite">
              Example postcard · {moment.title} · 9″ × 6.25″
            </figcaption>
          </figure>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** A 9″ × 6.25″ EDDM postcard: the offer on the left, postage and addressing on the right. */
function Postcard({ industry, copy }: { industry: Industry; copy?: { headline: string; offer: string } }) {
  const Icon = icons[industry.icon];
  const tone = tones[industry.tone];
  const card = { ...industry.postcard, ...copy };
  return (
    <div className="@container grid aspect-[9/6.25] grid-cols-[1.4fr_1fr] overflow-hidden rounded-lg border bg-card shadow-md">
      {/* Front: the offer */}
      <div className={cn("flex flex-col justify-between p-[6cqw]", tone.panel)}>
        <div className="flex items-center gap-[2cqw]">
          <span className={cn("grid size-[8cqw] place-items-center rounded-lg bg-card", tone.icon)}>
            <Icon className="size-[5cqw]" />
          </span>
          <span className={cn("text-[3.4cqw] font-semibold", tone.text)}>{card.business}</span>
        </div>
        <div>
          <p className="font-heading text-[6.4cqw] leading-[1.05] font-bold tracking-tight text-balance text-foreground">
            {card.headline}
          </p>
          <p className="mt-[2cqw] text-[3.2cqw] text-muted-foreground">{card.offer}</p>
        </div>
        <p className={cn("flex items-center gap-[1.5cqw] text-[2.8cqw] font-medium", tone.text)}>
          <IconQrcode className="size-[4.5cqw]" /> {card.cta}
        </p>
      </div>

      {/* Back half: USPS EDDM postage and addressing */}
      <div className="flex flex-col justify-between border-l border-dashed p-[5cqw]">
        <div className="ml-auto w-[72%] border border-foreground/70 px-[1.5cqw] py-[1.2cqw] text-center text-[1.9cqw] leading-tight font-semibold tracking-wide text-foreground/80 uppercase">
          PRSRT STD
          <br />
          ECRWSS
          <br />
          U.S. Postage Paid
          <br />
          EDDM Retail
        </div>
        <div className="space-y-[1.5cqw]">
          <p className="text-[2.6cqw] font-semibold tracking-wide text-foreground/80 uppercase">
            Local Postal Customer
          </p>
          <div className="h-[1.2cqw] w-[85%] rounded-full bg-muted" />
          <div className="h-[1.2cqw] w-[60%] rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
