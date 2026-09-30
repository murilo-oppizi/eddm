"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconArrowsMaximize,
  IconBarbell,
  IconBuildingBank,
  IconCalendarEvent,
  IconCarGarage,
  IconDental,
  IconHammer,
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
// drag or a swipe; the one in the middle is chosen. Beside it (below on phones), the
// chosen business, tinted in its color, with its mailing plan: three moments to mail laid
// out like a timetable (who gets it, when, the offer), all visible at once. Hovering that
// card turns the pointer into its flyer; a click opens the flyer large.

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

          <div className="grid gap-4 lg:min-h-[27rem] lg:grid-cols-[21rem_1fr] lg:gap-6">
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
      className="relative h-64 cursor-grab touch-none overflow-hidden rounded-3xl bg-muted/60 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing lg:h-auto [mask-image:linear-gradient(transparent,black_22%,black_78%,transparent)] [perspective:900px]"
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
 * The chosen business, tinted in its color: its name and its mailing plan.
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

  const overControl = (t: EventTarget | null) => (t as HTMLElement | null)?.closest("button, a");
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
      <div className="flex items-start gap-4 sm:items-center">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl bg-card shadow-sm", tone.icon)}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-2xl leading-tight font-bold tracking-tight">{industry.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{industry.body}</p>
        </div>
        {/* Mouse: a hint that the card holds a flyer. Touch screens and keyboards: the
            flyer behind a button. */}
        <span aria-hidden className="hidden shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground pointer-fine:flex">
          <IconArrowsMaximize className="size-3.5" /> Hover for an example mailer
        </span>
        <button
          type="button"
          onClick={() => setFlyer(true)}
          className="hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-xs font-medium shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:inline-flex pointer-fine:sr-only pointer-fine:focus-visible:not-sr-only"
        >
          Example mailer <IconArrowsMaximize className="size-3.5" aria-hidden />
        </button>
      </div>

      <MailingPlan industry={industry} className="mt-7" />

      <button
        type="button"
        onClick={() => setFlyer(true)}
        className="mt-5 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-xs font-medium shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:hidden"
      >
        See example mailer <IconArrowsMaximize className="size-3.5" aria-hidden />
      </button>

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
 * The mailing plan: three moments to mail, laid out like a timetable, all at once. On a
 * wide card: a header row (who gets it, when, the offer, each with its icon) over three
 * rows, each a numbered moment and its three answers, with dashed rules between them.
 * On a narrow one: each moment on its own, its answers stacked with small labels.
 * Static on purpose: easy to scan, nothing to click.
 */
function MailingPlan({ industry, className }: { industry: Industry; className?: string }) {
  const tone = tones[industry.tone];
  const cols = "@lg:grid @lg:grid-cols-[1.15fr_1fr_1fr_1fr] @lg:gap-5";
  return (
    <div className={cn("@container", className)}>
      <div className="rounded-2xl bg-card/85 px-5 shadow-xs">
        {/* Header (wide only) */}
        <div aria-hidden className={cn("hidden border-b py-3.5", cols)}>
          <p className={cn("text-xs font-semibold tracking-wider uppercase", tone.text)}>3 moments to mail</p>
          {FACTS.map(({ key, label, Icon }) => (
            <p key={key} className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <Icon className={cn("size-3.5", tone.icon)} /> {label}
            </p>
          ))}
        </div>
        <p className={cn("pt-4 text-xs font-semibold tracking-wider uppercase @lg:hidden", tone.text)}>3 moments to mail</p>

        <ol className="divide-y divide-dashed divide-foreground/12">
          {industry.moments.map((moment, i) => (
            <li key={moment.title} className={cn("py-4", cols)}>
              <div className="flex items-baseline gap-2.5">
                <span className={cn("font-heading text-sm font-bold tabular-nums", tone.icon)}>0{i + 1}</span>
                <h4 className="font-heading text-base leading-snug font-semibold tracking-tight">{moment.title}</h4>
              </div>
              <dl className="mt-2.5 grid gap-1.5 pl-7 @lg:contents">
                {FACTS.map(({ key, label, Icon }) => (
                  <div key={key} className="flex items-start gap-2 @lg:block">
                    <dt className="shrink-0 @lg:sr-only">
                      <Icon className={cn("mt-0.5 size-3.5", tone.icon)} aria-hidden />
                      <span className="sr-only">{label}</span>
                    </dt>
                    <dd className="text-sm leading-snug text-muted-foreground @lg:text-foreground/80">{moment[key]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>
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
