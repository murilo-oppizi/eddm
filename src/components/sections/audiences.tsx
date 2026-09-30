"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconArrowsMaximize,
  IconBarbell,
  IconCalendarEvent,
  IconCarGarage,
  IconDental,
  IconHeartHandshake,
  IconHomeDollar,
  IconMapPin,
  IconPaw,
  IconPlant2,
  IconQrcode,
  IconScissors,
  IconSchool,
  IconShoppingBag,
  IconTag,
  IconTool,
  IconToolsKitchen2,
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
import { audiences, site } from "@/content/site";
import { playKey } from "@/lib/key-sounds";
import { cn } from "@/lib/utils";

// "Who it's for" as a picker wheel, like the iPhone's date picker: an endless drum of
// business types (horizontal cards: icon + name) that you spin with the mouse wheel, a
// drag or a swipe; the one in the middle is chosen. Beside it (below on phones), the
// chosen business, tinted in its color: three moments to mail (a rail with a gliding
// highlight, and a scene with who gets it, when and the offer) and a way in. Hovering
// that card turns the pointer into its flyer; a click opens the flyer large.

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
};

const mod = (n: number) => ((n % N) + N) % N;
const snap = { type: "spring", stiffness: 260, damping: 30 } as const;

export function Audiences() {
  // The wheel's position, in rows (fractional while it moves); the chosen business is
  // the row nearest the middle.
  const position = useMotionValue(0);
  const [active, setActive] = useState(0);
  useMotionValueEvent(position, "change", (p) => {
    const i = mod(Math.round(p));
    if (i !== active) {
      setActive(i);
      playKey("tick", { gain: 0.16, pitch: 1.25 }); // a detent, if the meter's sounds are on
    }
  });
  const industry = industries[active];

  return (
    <MotionConfig reducedMotion="user">
      <section id="who-its-for" className="scroll-mt-20 py-20">
        <div className="container-page space-y-12">
          <SectionHeading eyebrow={audiences.eyebrow} title={audiences.title} body={audiences.body} />

          <div className="grid gap-4 lg:h-[27rem] lg:grid-cols-[21rem_1fr] lg:gap-6">
            <Wheel position={position} />
            <Showcase key={industry.name} industry={industry} />
          </div>
        </div>
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
 * it), a drag or a swipe (with momentum), the arrow keys, or click a card to bring it to
 * the middle. Rows curve away above and below and fade; the middle one is the choice.
 */
function Wheel({ position }: { position: MotionValue<number> }) {
  const el = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  useMotionValueEvent(position, "change", setP);
  const moving = useRef<ReturnType<typeof animate> | null>(null);
  const settle = useRef(0);

  const goTo = (target: number, velocity = 0) => {
    moving.current?.stop();
    moving.current = animate(position, target, { ...snap, velocity });
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

  // Dragging: follows the finger or mouse; on release it coasts with the flick's speed and
  // lands on a row. A press without movement counts as a click on the card under it.
  const drag = useRef<{ y: number; from: number; t: number; v: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    moving.current?.stop();
    drag.current = { y: e.clientY, from: position.get(), t: performance.now(), v: 0, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
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
      // A click: bring the card under the pointer to the middle.
      const r = el.current?.getBoundingClientRect();
      if (r) goTo(Math.round(position.get() + (e.clientY - (r.top + r.height / 2)) / ROW));
      return;
    }
    goTo(Math.round(position.get() + d.v * 0.18), d.v);
  };

  const base = Math.round(p);
  const slots = Array.from({ length: REACH * 2 + 1 }, (_, k) => base - REACH + k);

  return (
    <div
      ref={el}
      role="listbox"
      tabIndex={0}
      aria-label="Kinds of business"
      aria-activedescendant={`wheel-${mod(base)}`}
      onKeyDown={(e) => {
        const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        goTo(Math.round(position.get()) + step);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative h-64 cursor-grab touch-none overflow-hidden rounded-3xl bg-muted/60 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing lg:h-full [mask-image:linear-gradient(transparent,black_22%,black_78%,transparent)] [perspective:900px]"
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
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------- The chosen one ---------------------------- */

/**
 * The chosen business, tinted in its color: its name, three moments to mail and a way in.
 * With a mouse, hovering the card turns the pointer into its flyer (except over the
 * moments and links, which keep the normal pointer), and a click opens the flyer large.
 * Phones get a small "See example mailer" button instead.
 */
function Showcase({ industry }: { industry: Industry }) {
  const Icon = icons[industry.icon];
  const tone = tones[industry.tone];
  const [flyer, setFlyer] = useState(false); // dialog open
  const [hovering, setHovering] = useState(false);
  const x = useSpring(0, { stiffness: 500, damping: 40, mass: 0.4 });
  const y = useSpring(0, { stiffness: 500, damping: 40, mass: 0.4 });
  const card = useRef<HTMLDivElement>(null);

  const overControl = (t: EventTarget | null) => (t as HTMLElement | null)?.closest("button, a, [role=tab], [role=tabpanel]");
  const track = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = card.current?.getBoundingClientRect();
    if (!r) return;
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
    setHovering(!overControl(e.target));
  };

  return (
    <motion.div
      ref={card}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      onPointerMove={track}
      onPointerLeave={() => setHovering(false)}
      onClick={(e) => {
        if (!overControl(e.target) && window.matchMedia("(pointer: fine)").matches) setFlyer(true);
      }}
      className={cn(
        "relative flex min-h-full flex-col overflow-hidden rounded-3xl p-6 transition-colors duration-500 sm:p-8",
        tone.panel,
        hovering && "cursor-none"
      )}
    >
      <div className="flex items-center gap-4">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl bg-card shadow-sm", tone.icon)}>
          <Icon className="size-5" aria-hidden />
        </span>
        <h3 className="font-heading text-2xl leading-tight font-bold tracking-tight">{industry.name}</h3>
      </div>

      <Moments industry={industry} open wide className="mt-7 hidden lg:block" />
      <Moments industry={industry} open className="mt-6 lg:hidden" />

      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
        <Link
          href={site.primaryCta.href}
          className={cn("inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline", tone.text)}
        >
          {site.primaryCta.label} <IconArrowRight className="size-4" aria-hidden />
        </Link>
        {/* Touch screens (and keyboards): the flyer behind a button */}
        <button
          type="button"
          onClick={() => setFlyer(true)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-xs font-medium shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 pointer-fine:sr-only pointer-fine:focus-visible:not-sr-only"
        >
          See example mailer <IconArrowsMaximize className="size-3.5" aria-hidden />
        </button>
      </div>

      {/* The flyer as the pointer */}
      <AnimatePresence>
        {hovering && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 z-10 w-40"
            style={{ x, y, translateX: "-50%", translateY: "-50%" }}
            initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: -6 }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
          >
            <Postcard industry={industry} />
            <span className="mt-1.5 block text-center text-[10px] font-semibold tracking-wide text-foreground/70 uppercase">
              Click to open
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={flyer} onOpenChange={setFlyer}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="sr-only">Example mailer: {industry.postcard.business}</DialogTitle>
          <Postcard industry={industry} />
          <p className="mt-4 text-center text-sm text-white/80">
            An example {industry.name.toLowerCase()} postcard, 9″ × 6.25″
          </p>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

const FACTS = [
  { key: "who", label: "Who gets it", Icon: IconMapPin },
  { key: "when", label: "When", Icon: IconCalendarEvent },
  { key: "offer", label: "The offer", Icon: IconTag },
] as const;

/**
 * Three moments to mail. A rail of the three (number + name) with a white pill that
 * glides behind the chosen one (hover on desktop, tap anywhere); beside it on desktop and
 * below it on phones, the scene: the moment and its three facts, which slide and un-blur
 * in from the side you moved toward, one after another. `wide`: rail beside the scene.
 */
function Moments({ industry, open, wide, className }: { industry: Industry; open: boolean; wide?: boolean; className?: string }) {
  const tone = tones[industry.tone];
  // The chosen moment, and which way we moved to it (for the slide).
  const [[current, direction], setCurrent] = useState<[number, number]>([0, 0]);
  const choose = (n: number) => n !== current && setCurrent([n, n > current ? 1 : -1]);
  const pointerFine = () => window.matchMedia("(pointer: fine)").matches;
  const moment = industry.moments[current];
  const id = `${industry.icon}-${wide ? "w" : "m"}`;

  return (
    <div className={className}>
      <p className={cn("text-xs font-semibold tracking-wider uppercase", tone.text)}>3 moments to mail</p>
      <div className={cn("mt-3 gap-3", wide ? "grid grid-cols-[11rem_1fr]" : "space-y-3")}>
        {/* The rail */}
        <div
          role="tablist"
          aria-label="Moments to mail"
          className={cn(wide ? "flex flex-col gap-1 py-1" : "grid grid-cols-3 gap-1 rounded-2xl bg-card/50 p-1")}
        >
          {industry.moments.map((m, n) => {
            const on = n === current;
            return (
              <button
                key={m.title}
                type="button"
                role="tab"
                id={`moment-${id}-${n}`}
                aria-selected={on}
                aria-controls={`moment-${id}-panel`}
                tabIndex={open ? (on ? 0 : -1) : -1}
                onPointerEnter={() => wide && pointerFine() && choose(n)}
                onClick={() => choose(n)}
                onKeyDown={(e) => {
                  const step = e.key === (wide ? "ArrowDown" : "ArrowRight") ? 1 : e.key === (wide ? "ArrowUp" : "ArrowLeft") ? -1 : 0;
                  if (!step) return;
                  e.preventDefault();
                  const next = (n + step + industry.moments.length) % industry.moments.length;
                  choose(next);
                  document.getElementById(`moment-${id}-${next}`)?.focus();
                }}
                className={cn(
                  "relative flex cursor-pointer items-center gap-2.5 rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  wide ? "px-3.5 py-3" : "flex-col gap-1 px-2 py-2.5 text-center"
                )}
              >
                {on && (
                  <motion.span
                    layoutId={`moment-pill-${id}`}
                    className="absolute inset-0 rounded-xl bg-card shadow-sm"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span
                  className={cn(
                    "relative font-heading text-xs font-bold tabular-nums transition-colors",
                    on ? tone.icon : "text-muted-foreground/70"
                  )}
                >
                  0{n + 1}
                </span>
                <span
                  className={cn(
                    "relative text-sm leading-tight font-semibold transition-colors",
                    on ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {m.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* The scene */}
        <div
          role="tabpanel"
          id={`moment-${id}-panel`}
          aria-labelledby={`moment-${id}-${current}`}
          className="relative overflow-hidden rounded-2xl bg-card/85 p-5 shadow-xs"
        >
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 28, filter: "blur(6px)" }),
                center: { opacity: 1, x: 0, filter: "blur(0px)", transition: { staggerChildren: 0.05 } },
                exit: (d: number) => ({ opacity: 0, x: d * -28, filter: "blur(6px)", transition: { duration: 0.2 } }),
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <h4 className="font-heading text-xl leading-tight font-bold tracking-tight">{moment.title}</h4>
              <dl className="mt-4 space-y-3">
                {FACTS.map(({ key, label, Icon }) => (
                  <motion.div
                    key={key}
                    className="flex items-center gap-3"
                    variants={{
                      enter: { opacity: 0, y: 6 },
                      center: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
                    }}
                  >
                    <dt className={cn("grid size-8 shrink-0 place-items-center rounded-lg", tone.panel, tone.icon)}>
                      <Icon className="size-4" aria-hidden />
                      <span className="sr-only">{label}</span>
                    </dt>
                    <dd>
                      <span aria-hidden className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        {label}
                      </span>
                      <span className="block text-sm font-medium">{moment[key]}</span>
                    </dd>
                  </motion.div>
                ))}
              </dl>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/** A 9″ × 6.25″ EDDM postcard: the offer on the left, postage and addressing on the right. */
function Postcard({ industry }: { industry: Industry }) {
  const Icon = icons[industry.icon];
  const tone = tones[industry.tone];
  const card = industry.postcard;
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
