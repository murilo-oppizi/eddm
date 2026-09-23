"use client";

import { useState } from "react";
import {
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
import { audiences } from "@/content/site";
import { cn } from "@/lib/utils";

// "Who it's for": a sticky postcard (left) swaps to each industry's mailer as its row
// scrolls through the middle of the screen (right) — every EDDM customer ends up with a
// postcard, so we show theirs. On phones each row carries its own postcard instead.

type Industry = (typeof audiences.industries)[number];

const icons: Record<Industry["icon"], TablerIcon> = {
  restaurant: IconToolsKitchen2,
  realEstate: IconHomeDollar,
  salon: IconScissors,
  homeServices: IconTool,
  gym: IconBarbell,
  retail: IconShoppingBag,
};

// Each industry's mailer gets its own tint from the Oppizi tokens.
const tones: Record<Industry["tone"], { panel: string; text: string; icon: string }> = {
  brand: { panel: "bg-brand-subtle", text: "text-brand-subtle-foreground", icon: "text-brand" },
  info: { panel: "bg-info-subtle", text: "text-info-subtle-foreground", icon: "text-info" },
  success: { panel: "bg-success-subtle", text: "text-success-subtle-foreground", icon: "text-success" },
  warning: { panel: "bg-warning-subtle", text: "text-warning-subtle-foreground", icon: "text-warning" },
  ai: { panel: "bg-ai-subtle", text: "text-ai-subtle-foreground", icon: "text-ai" },
};

export function Audiences() {
  const [active, setActive] = useState(0);

  return (
    <MotionConfig reducedMotion="user">
      <section id="who-its-for" className="scroll-mt-20 py-20">
        <div className="container-page space-y-12">
          <SectionHeading eyebrow={audiences.eyebrow} title={audiences.title} body={audiences.body} />

          <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            {/* Sticky postcard pile (desktop) */}
            <div className="hidden lg:block">
              <div className="sticky top-[calc(50vh-11rem)]">
                <PostcardPile industry={audiences.industries[active]} index={active} />
              </div>
            </div>

            {/* Phones: a swipeable carousel, one industry + postcard per slide.
                Desktop: a tall list that scrolls past the sticky postcard. */}
            <ol className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:block lg:snap-none lg:overflow-visible lg:px-0 lg:py-[18vh] [&::-webkit-scrollbar]:hidden">
              {audiences.industries.map((industry, i) => (
                <motion.li
                  key={industry.name}
                  // Becomes active while it crosses the middle band of the screen.
                  onViewportEnter={() => setActive(i)}
                  viewport={{ margin: "-45% 0px -45% 0px" }}
                  className="flex w-[85%] shrink-0 snap-start flex-col sm:w-[60%] lg:block lg:w-auto lg:py-10"
                >
                  <IndustryRow industry={industry} active={i === active} />
                  {/* Phones: the postcard sits with its row; rows stretch so postcards line up. */}
                  <div className="mt-5 lg:hidden">
                    <Postcard industry={industry} />
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

function IndustryRow({ industry, active }: { industry: Industry; active: boolean }) {
  const Icon = icons[industry.icon];
  const tone = tones[industry.tone];
  return (
    <div
      className={cn(
        "flex flex-1 gap-4 rounded-xl border bg-card p-5 transition-all duration-500 lg:border-transparent lg:bg-transparent lg:p-0",
        !active && "lg:opacity-40"
      )}
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-lg transition-colors duration-500",
          tone.panel,
          tone.icon,
          !active && "lg:bg-muted lg:text-muted-foreground"
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <h3 className="text-lg font-semibold">{industry.name}</h3>
        <p className="mt-1 text-muted-foreground">{industry.body}</p>
      </div>
    </div>
  );
}

/** The active postcard, dealt on top of two blank cards so it reads as a pile of mail. */
function PostcardPile({ industry, index }: { industry: Industry; index: number }) {
  return (
    <div className="relative mx-auto w-full max-w-xl" aria-hidden>
      <div className="absolute inset-0 translate-x-3 translate-y-4 rotate-[4deg] rounded-xl border bg-card shadow-sm" />
      <div className="absolute inset-0 -translate-x-2 translate-y-2 rotate-[-5deg] rounded-xl border bg-card shadow-sm" />
      {/* Holds the pile's size while cards swap, so nothing below jumps. */}
      <div className="invisible">
        <Postcard industry={industry} />
      </div>
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0, y: 40, rotate: -8 }}
          animate={{ opacity: 1, y: 0, rotate: -1.5 }}
          exit={{ opacity: 0, y: -24, rotate: 4, transition: { duration: 0.3 } }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
        >
          <Postcard industry={industry} elevated />
        </motion.div>
      </AnimatePresence>
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
