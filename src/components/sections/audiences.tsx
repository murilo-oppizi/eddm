"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconBarbell,
  IconHomeDollar,
  IconQrcode,
  IconScissors,
  IconShoppingBag,
  IconTool,
  IconToolsKitchen2,
  type TablerIcon,
} from "@tabler/icons-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

import { SectionHeading } from "@/components/sections/section-heading";
import { audiences, site } from "@/content/site";
import { cn } from "@/lib/utils";

// "Who it's for" as a neighborhood street: one storefront per kind of business, drawn
// flat like the rest of the site, each with an awning striped in its color, a sign with
// its name and a blue mail collection box at the curb. Picking a shop (click or tap)
// brings it forward and pops a postcard out of its mailbox; below the street, that
// business's details and postcard. Phones: the street scrolls sideways, like walking
// down the block.

type Industry = (typeof audiences.industries)[number];

const icons: Record<Industry["icon"], TablerIcon> = {
  restaurant: IconToolsKitchen2,
  realEstate: IconHomeDollar,
  salon: IconScissors,
  homeServices: IconTool,
  gym: IconBarbell,
  retail: IconShoppingBag,
};

// Each industry's tint from the Oppizi tokens (cyan from the design system's scale), plus
// its solid color as a CSS value, for the awning stripes and the sign.
const tones: Record<Industry["tone"], { panel: string; text: string; icon: string; solid: string }> = {
  info: { panel: "bg-info-subtle", text: "text-info-subtle-foreground", icon: "text-info", solid: "var(--ds-status-info-solid)" },
  success: { panel: "bg-success-subtle", text: "text-success-subtle-foreground", icon: "text-success", solid: "var(--ds-status-success-solid)" },
  warning: { panel: "bg-warning-subtle", text: "text-warning-subtle-foreground", icon: "text-warning", solid: "var(--ds-status-warning-solid)" },
  ai: { panel: "bg-ai-subtle", text: "text-ai-subtle-foreground", icon: "text-ai", solid: "var(--ds-status-ai-solid)" },
  neutral: { panel: "bg-muted", text: "text-foreground", icon: "text-foreground", solid: "var(--foreground)" },
  cyan: {
    panel: "bg-(--ds-tw-cyan-50) dark:bg-(--ds-tw-cyan-950)",
    text: "text-(--ds-tw-cyan-800) dark:text-(--ds-tw-cyan-200)",
    icon: "text-(--ds-tw-cyan-600)",
    solid: "var(--ds-tw-cyan-600)",
  },
};

/** Each shop's building height (px), so the street has an uneven, real skyline. */
const HEIGHTS = [212, 244, 204, 232, 252, 218];

export function Audiences() {
  const [active, setActive] = useState(0);
  const street = useRef<HTMLDivElement>(null);
  const industry = audiences.industries[active];

  const choose = (i: number, shop: HTMLElement) => {
    setActive(i);
    // Phones: bring the chosen shop to the middle of the scrolling street.
    const el = street.current;
    if (el && el.scrollWidth > el.clientWidth) {
      el.scrollTo({ left: shop.offsetLeft + shop.offsetWidth / 2 - el.clientWidth / 2, behavior: "smooth" });
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <section id="who-its-for" className="scroll-mt-20 py-20">
        <div className="container-page space-y-12">
          <SectionHeading eyebrow={audiences.eyebrow} title={audiences.title} body={audiences.body} />

          {/* The street: shops standing on a sidewalk, a road in front. Scrolls sideways
              when it doesn't fit (phones), edge to edge. */}
          <div
            ref={street}
            className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
            <div className="relative min-w-[52rem] lg:min-w-0">
              <ul className="relative z-10 grid grid-cols-6 items-end px-2" aria-label="Kinds of business">
                {audiences.industries.map((shop, i) => (
                  <li key={shop.name} className="flex justify-center">
                    <Shop industry={shop} index={i} active={i === active} onChoose={(el) => choose(i, el)} />
                  </li>
                ))}
              </ul>
              {/* Sidewalk, curb and road */}
              <div aria-hidden className="h-5 rounded-t-sm bg-muted" />
              <div aria-hidden className="h-1.5 bg-border" />
              <div aria-hidden className="relative h-12 rounded-b-2xl bg-subtle">
                <div className="absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,var(--card)_0_28px,transparent_28px_52px)]" />
              </div>
            </div>
          </div>

          {/* The chosen business */}
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={industry.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Details industry={industry} />
              </motion.div>
            </AnimatePresence>
            <div className="relative mx-auto w-full max-w-md">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={industry.name}
                  initial={{ opacity: 0, y: 40, rotate: -8 }}
                  animate={{ opacity: 1, y: 0, rotate: -2 }}
                  exit={{ opacity: 0, y: -20, rotate: 3, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 220, damping: 24 }}
                >
                  <Postcard industry={industry} elevated />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

/**
 * A storefront: a flat building with a cornice, its sign, a striped awning in its color,
 * a shop window with its icon and a door; a blue collection box at the curb. The chosen
 * one lights up (its window glows in its color, its sign fills) and a postcard pops out
 * of its mailbox; the others fade back.
 */
function Shop({
  industry,
  index,
  active,
  onChoose,
}: {
  industry: Industry;
  index: number;
  active: boolean;
  onChoose: (shop: HTMLElement) => void;
}) {
  const Icon = icons[industry.icon];
  const tone = tones[industry.tone];
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={industry.name}
      onClick={(e) => onChoose(e.currentTarget.closest("li") ?? e.currentTarget)}
      className="group relative flex w-full cursor-pointer items-end justify-center gap-1.5 rounded-t-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      style={{ "--tone": tone.solid } as React.CSSProperties}
    >
      {/* The building */}
      <span
        className={cn(
          "relative flex w-[82%] flex-col items-center overflow-hidden rounded-t-xl border border-b-0 bg-card transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          active ? "shadow-lg" : "opacity-55 shadow-sm group-hover:opacity-90"
        )}
        style={{ height: HEIGHTS[index] }}
      >
        {/* Cornice */}
        <span className="h-3 w-full bg-muted" />
        {/* Sign */}
        <span
          className={cn(
            "mt-4 max-w-[88%] truncate rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors duration-300 sm:px-2.5 sm:text-[11px]",
            active ? "border-transparent bg-(--tone) text-white" : "border-(--tone)/40 bg-card text-(--tone)"
          )}
        >
          {industry.postcard.business}
        </span>
        {/* Upstairs windows */}
        <span className="mt-4 flex gap-2">
          <span className="h-5 w-6 rounded-sm bg-muted" />
          <span className="h-5 w-6 rounded-sm bg-muted" />
        </span>
        {/* Ground floor: the awning over the shop window and the door */}
        <span className="absolute inset-x-0 bottom-0 flex h-[46%] flex-col">
          <span className="h-5 w-full rounded-b-md bg-[repeating-linear-gradient(90deg,var(--tone)_0_12px,var(--card)_12px_24px)] shadow-sm" />
          <span className="flex flex-1 items-end gap-2 px-3">
            <span
              className={cn(
                "mb-3 grid h-[70%] flex-1 place-items-center rounded-md transition-colors duration-500",
                active ? tone.panel : "bg-muted"
              )}
            >
              <Icon className={cn("size-6", tone.icon)} aria-hidden />
            </span>
            <span className="h-[82%] w-[28%] rounded-t-md border border-b-0 bg-muted" />
          </span>
        </span>
      </span>

      {/* The collection box at the curb (a domed blue box on two short legs, with its
          slot), a postcard popping out of it when chosen */}
      <span aria-hidden className="relative h-11 w-6 shrink-0">
        <AnimatePresence>
          {active && (
            <motion.span
              key="card"
              className="absolute bottom-7 left-1/2 block h-5 w-8 -translate-x-1/2 overflow-hidden rounded-[3px] border bg-card shadow-md"
              initial={{ y: 14, opacity: 0, rotate: 0 }}
              animate={{ y: -14, opacity: 1, rotate: -14 }}
              exit={{ y: 10, opacity: 0, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.2 }}
            >
              <span className="absolute inset-y-0 left-0 w-3 bg-(--tone)/50" />
              <span className="absolute top-1 right-1 size-1.5 rounded-[1px] border border-foreground/40" />
            </motion.span>
          )}
        </AnimatePresence>
        <span className="absolute inset-x-0 bottom-1.5 h-8 rounded-t-full bg-info" />
        <span className="absolute inset-x-1 bottom-6 h-1 rounded-full bg-foreground/40" />
        <span className="absolute bottom-0 left-1 h-2 w-1 rounded-b-sm bg-info" />
        <span className="absolute right-1 bottom-0 h-2 w-1 rounded-b-sm bg-info" />
      </span>
    </button>
  );
}

/** The chosen business: name, what EDDM does for it, typical campaigns and a way in. */
function Details({ industry }: { industry: Industry }) {
  const Icon = icons[industry.icon];
  const tone = tones[industry.tone];
  return (
    <div>
      <span className={cn("grid size-11 place-items-center rounded-xl", tone.panel, tone.icon)}>
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-5 font-heading text-3xl font-bold tracking-tight">{industry.name}</h3>
      <p className="mt-3 max-w-md text-lg text-muted-foreground">{industry.body}</p>
      <ul className="mt-6 flex flex-wrap gap-2" aria-label="Typical campaigns">
        {industry.ideas.map((idea) => (
          <li key={idea} className={cn("rounded-full px-3 py-1 text-sm font-medium", tone.panel, tone.text)}>
            {idea}
          </li>
        ))}
      </ul>
      <Link
        href={site.primaryCta.href}
        className={cn("mt-8 inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline", tone.text)}
      >
        {site.primaryCta.label} <IconArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

/** A 9″ × 6.25″ EDDM postcard: the offer on the left, postage and addressing on the right. */
function Postcard({ industry, elevated }: { industry: Industry; elevated?: boolean }) {
  const Icon = icons[industry.icon];
  const tone = tones[industry.tone];
  const card = industry.postcard;
  return (
    <div
      aria-hidden
      className={cn(
        "@container grid aspect-[9/6.25] grid-cols-[1.4fr_1fr] overflow-hidden rounded-xl border bg-card",
        elevated ? "shadow-xl" : "shadow-sm"
      )}
    >
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
