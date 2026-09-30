"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconArrowsMaximize,
  IconBarbell,
  IconCalendarEvent,
  IconChevronDown,
  IconHomeDollar,
  IconMapPin,
  IconQrcode,
  IconScissors,
  IconShoppingBag,
  IconTag,
  IconTool,
  IconToolsKitchen2,
  type TablerIcon,
} from "@tabler/icons-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

import { SectionHeading } from "@/components/sections/section-heading";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { audiences, site } from "@/content/site";
import { cn } from "@/lib/utils";

// "Who it's for" as expanding panels (after Square's industry panels): one tall panel per
// kind of business. The open one takes most of the width, tinted in its color, and is
// about use cases: three moments to mail, as a slim rail with a highlight that glides to
// the one you point at, and a scene beside it (who gets it, when, the offer) that slides
// in from the side you moved toward; a small example mailer that opens large in a
// dialog; and a way in. The rest fold down to slim spines
// (icon + sideways name). Desktop: hover or click a spine to open it. Phones: the same
// panels stacked, one open at a time.

type Industry = (typeof audiences.industries)[number];

const icons: Record<Industry["icon"], TablerIcon> = {
  restaurant: IconToolsKitchen2,
  realEstate: IconHomeDollar,
  salon: IconScissors,
  homeServices: IconTool,
  gym: IconBarbell,
  retail: IconShoppingBag,
};

// Each industry's tint from the Oppizi tokens (cyan from the design system's scale).
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
};

/** How long the pointer rests on a spine before it opens (so sweeping across doesn't
 *  flick through every panel). */
const HOVER_INTENT = 120;

export function Audiences() {
  const [open, setOpen] = useState(0);
  const intent = useRef(0);
  const hover = (i: number) => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    window.clearTimeout(intent.current);
    intent.current = window.setTimeout(() => setOpen(i), HOVER_INTENT);
  };
  const unhover = () => window.clearTimeout(intent.current);

  return (
    <MotionConfig reducedMotion="user">
    <section id="who-its-for" className="scroll-mt-20 py-20">
      <div className="container-page space-y-12">
        <SectionHeading eyebrow={audiences.eyebrow} title={audiences.title} body={audiences.body} />

        {/* Desktop: side by side. A size container, so an open panel's contents can be laid
            out at its final width from the start (and never reflow while it widens). */}
        <div className="@container/panels hidden h-[27rem] gap-3 lg:flex" onPointerLeave={unhover}>
          {audiences.industries.map((industry, i) => (
            <WidePanel
              key={industry.name}
              industry={industry}
              open={i === open}
              onOpen={() => setOpen(i)}
              onHover={() => hover(i)}
            />
          ))}
        </div>

        {/* Phones and tablets: stacked */}
        <div className="space-y-3 lg:hidden">
          {audiences.industries.map((industry, i) => (
            <StackedPanel key={industry.name} industry={industry} open={i === open} onOpen={() => setOpen(i)} />
          ))}
        </div>
      </div>
    </section>
    </MotionConfig>
  );
}

/**
 * Desktop panel. Open: most of the row's width (8 shares of 13, after the five 0.75rem
 * gaps), in its tint, with the use cases. Closed: a slim spine with the icon on top and
 * the name running up it. The width eases between the two; the contents fade in once
 * there's room.
 */
function WidePanel({
  industry,
  open,
  onOpen,
  onHover,
}: {
  industry: Industry;
  open: boolean;
  onOpen: () => void;
  onHover: () => void;
}) {
  const Icon = icons[industry.icon];
  const tone = tones[industry.tone];
  return (
    <div
      onPointerEnter={onHover}
      className={cn(
        "relative min-w-0 overflow-hidden rounded-3xl transition-[flex-grow,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        open ? tone.panel : "bg-muted/60 hover:bg-muted"
      )}
      style={{ flexGrow: open ? 8 : 1, flexBasis: 0 }}
    >
      {/* The spine: the whole closed panel is its button. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`who-${industry.icon}`}
        onClick={onOpen}
        onFocus={onOpen}
        className={cn(
          "absolute inset-0 flex cursor-pointer flex-col items-center justify-between py-6 outline-none transition-opacity duration-300 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
          open ? "pointer-events-none opacity-0" : "opacity-100"
        )}
      >
        <span className={cn("grid size-11 place-items-center rounded-xl bg-card shadow-sm", tone.icon)}>
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="rotate-180 font-heading text-lg font-semibold tracking-tight whitespace-nowrap text-foreground [writing-mode:vertical-rl]">
          {industry.name}
        </span>
      </button>

      {/* The use cases, at the open width */}
      <div
        id={`who-${industry.icon}`}
        aria-hidden={!open}
        className={cn(
          "absolute inset-y-0 left-0 flex w-[calc((100cqw-3.75rem)*8/13)] flex-col p-8 transition-opacity motion-reduce:transition-none",
          open ? "opacity-100 delay-200 duration-500" : "pointer-events-none opacity-0 duration-150"
        )}
      >
        <div className="flex items-center gap-4 pr-40">
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl bg-card shadow-sm", tone.icon)}>
            <Icon className="size-5" aria-hidden />
          </span>
          <h3 className="font-heading text-2xl leading-tight font-bold tracking-tight">{industry.name}</h3>
        </div>
        <ExampleMailer industry={industry} tabIndex={open ? undefined : -1} className="absolute top-6 right-7 w-32" />

        <Moments industry={industry} open={open} wide className="mt-8" />

        <div className="mt-auto pt-5">
          <Link
            href={site.primaryCta.href}
            tabIndex={open ? undefined : -1}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline",
              tone.text
            )}
          >
            {site.primaryCta.label} <IconArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Phone and tablet panel: a row with the icon and name that opens (height easing open)
 * to the same use cases. One open at a time.
 */
function StackedPanel({ industry, open, onOpen }: { industry: Industry; open: boolean; onOpen: () => void }) {
  const Icon = icons[industry.icon];
  const tone = tones[industry.tone];
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl transition-colors duration-500 motion-reduce:transition-none",
        open ? tone.panel : "bg-muted/60"
      )}
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`who-m-${industry.icon}`}
          onClick={onOpen}
          className="flex w-full cursor-pointer items-center gap-4 p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
        >
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-card shadow-sm", tone.icon)}>
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="flex-1 font-heading text-lg font-semibold tracking-tight">{industry.name}</span>
          <IconChevronDown
            aria-hidden
            className={cn("size-5 text-muted-foreground transition-transform duration-300", open && "rotate-180")}
          />
        </button>
      </h3>
      <div
        id={`who-m-${industry.icon}`}
        className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden" inert={!open}>
          <div className="px-4 pb-6">
            <Moments industry={industry} open={open} />
            <div className="mt-6 flex items-end justify-between gap-4">
              <Link
                href={site.primaryCta.href}
                className={cn("mb-1 inline-flex items-center gap-1.5 text-sm font-semibold", tone.text)}
              >
                {site.primaryCta.label} <IconArrowRight className="size-4" aria-hidden />
              </Link>
              <ExampleMailer industry={industry} className="w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
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

/**
 * The postcard, small and tilted, as an example of what they mail. Clicking it (it
 * straightens on hover) opens it large in a dialog over a dark, blurred page.
 */
function ExampleMailer({
  industry,
  tabIndex,
  className,
}: {
  industry: Industry;
  tabIndex?: number;
  className?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        tabIndex={tabIndex}
        aria-label={`See the example mailer for ${industry.name.toLowerCase()}`}
        className={cn(
          "group block cursor-pointer rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        <span
          aria-hidden
          className="block rotate-[4deg] transition-transform duration-300 ease-out group-hover:rotate-0 group-hover:scale-105"
        >
          <Postcard industry={industry} />
        </span>
        <span className="mt-2 flex items-center justify-center gap-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase group-hover:text-foreground">
          Example mailer <IconArrowsMaximize className="size-3" aria-hidden />
        </span>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="sr-only">Example mailer: {industry.postcard.business}</DialogTitle>
        <Postcard industry={industry} />
        <p className="mt-4 text-center text-sm text-white/80">
          An example {industry.name.toLowerCase()} postcard, 9″ × 6.25″
        </p>
      </DialogContent>
    </Dialog>
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
