"use client";

import { useRef, useState } from "react";
import {
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
  motion,
  useSpring,
} from "motion/react";

import { SectionHeading } from "@/components/sections/section-heading";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { audiences } from "@/content/site";
import { cn } from "@/lib/utils";

// "Who it's for" as a mural: every business type pinned on one wall, as small cards (a
// tinted icon + the name), each at a slight tilt. Hovering one turns the pointer into its
// flyer; a click or tap opens its card in a dialog: its name, what EDDM does for it,
// three moments to mail (each swaps in its own flyer) and the flyer itself.

type Industry = (typeof audiences.industries)[number];
const industries = audiences.industries;

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

export function Audiences() {
  // The business whose card is open (or was last open, while it closes).
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  return (
    <MotionConfig reducedMotion="user">
      <section id="who-its-for" className="scroll-mt-20 py-20">
        <div className="container-page space-y-12">
          <SectionHeading eyebrow={audiences.eyebrow} title={audiences.title} body={audiences.body} />
          <Mural
            onOpen={(i) => {
              setActive(i);
              setOpen(true);
            }}
          />
        </div>
        <BusinessDialog industry={industries[active]} open={open} onOpenChange={setOpen} />
      </section>
    </MotionConfig>
  );
}

/* ------------------------------ The mural ------------------------------ */

// Each card's pinned-by-hand tilt and nudge: fixed per card (not random), so the wall is
// the same on every visit and on the server.
const tiltOf = (i: number) => (((i * 37) % 9) - 4) * 0.55; // -2.2° to 2.2°
const nudgeOf = (i: number) => (((i * 53) % 7) - 3) * 2.5; // -7.5px to 7.5px
/** The flyer pointer's tilt: -11° to -3° or 3° to 9°, never quite straight. */
function randomTilt() {
  const tilt = 3 + Math.random() * 7;
  return Math.random() < 0.6 ? -tilt - 1 : tilt - 1;
}

/**
 * Every business type on one wall: the same cards as before (tinted icon + name), in
 * centred rows, each pinned at a slight tilt and height. They come in one after another
 * when the wall scrolls into view. Hovering one straightens and lifts it, and with a
 * mouse the pointer becomes that business's flyer (a fresh random tilt each time); a
 * click or tap opens its card.
 */
function Mural({ onOpen }: { onOpen: (i: number) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ i: number; angle: number } | null>(null);
  const fx = useSpring(0, { stiffness: 500, damping: 40, mass: 0.4 });
  const fy = useSpring(0, { stiffness: 500, damping: 40, mass: 0.4 });
  const follow = (e: React.PointerEvent) => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r) return;
    fx.set(e.clientX - r.left);
    fy.set(e.clientY - r.top);
  };
  const enter = (i: number, e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    follow(e);
    setHover({ i, angle: randomTilt() });
  };
  const hovered = hover ? industries[hover.i] : null;

  return (
    <div
      ref={wrap}
      onPointerMove={(e) => e.pointerType === "mouse" && follow(e)}
      className="relative rounded-3xl bg-muted/60 bg-[radial-gradient(circle,var(--border)_1px,transparent_1.5px)] bg-size-[22px_22px] px-3 py-8 sm:px-10 sm:py-14"
    >
      <motion.ul
        aria-label="Kinds of business"
        className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-2 gap-y-3 sm:gap-x-4 sm:gap-y-5"
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ shown: { transition: { staggerChildren: 0.035 } } }}
      >
        {industries.map((item, i) => {
          const Icon = icons[item.icon];
          const tone = tones[item.tone];
          return (
            <motion.li
              key={item.name}
              variants={{
                hidden: { opacity: 0, y: 14, scale: 0.94 },
                shown: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
              }}
              // The nudge only from sm up: on a phone's tighter rows it would make cards overlap.
              style={{ rotate: tiltOf(i), ["--nudge" as string]: `${nudgeOf(i)}px` }}
              className="sm:translate-y-(--nudge)"
            >
              <button
                type="button"
                onClick={() => onOpen(i)}
                onPointerEnter={(e) => enter(i, e)}
                onPointerLeave={() => setHover((h) => (h?.i === i ? null : h))}
                className={cn(
                  "group flex h-11 cursor-pointer items-center gap-2.5 rounded-xl bg-card py-0 pr-3.5 pl-2 shadow-sm sm:h-14 sm:gap-3 sm:rounded-2xl sm:pr-5 sm:pl-3 outline-none transition-[rotate,translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 pointer-fine:cursor-none",
                  "hover:[rotate:calc(var(--tilt)*-1)]"
                )}
                style={{ "--tilt": `${tiltOf(i)}deg` } as React.CSSProperties}
              >
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg sm:size-9 sm:rounded-xl", tone.panel, tone.icon)}>
                  <Icon className="size-4 sm:size-5" aria-hidden />
                </span>
                <span className="font-heading text-sm font-semibold tracking-tight whitespace-nowrap sm:text-base">{item.name}</span>
              </button>
            </motion.li>
          );
        })}
      </motion.ul>

      {/* The flyer as the pointer */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="flyer"
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 z-20 w-44"
            // Just above and right of the pointer, so the card being pointed at stays visible.
            style={{ x: fx, y: fy, translateX: "-12%", translateY: "-108%" }}
            initial={{ opacity: 0, scale: 0.6, rotate: (hover?.angle ?? -6) * 1.8 }}
            animate={{ opacity: 1, scale: 1, rotate: hover?.angle ?? -6 }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
          >
            <Postcard industry={hovered} copy={hovered.moments[0]} />
            <span className="mt-1.5 block text-center text-[10px] font-semibold tracking-wide text-foreground/70 uppercase">
              Click to open
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
 * and level, on a soft panel in its color on the other. Stacked on phones. Picking a
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
                    rotate: 0,
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
                    rotate: [0, -3, 9],
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
            <figcaption className={cn("mt-5 text-center text-xs font-medium", tone.text)}>
              Example postcard
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
