"use client";

import { useRef, useState } from "react";
import {
  IconBarbell,
  IconHomeDollar,
  IconMapPins,
  IconQrcode,
  IconScissors,
  IconShoppingBag,
  IconTool,
  IconToolsKitchen2,
  type TablerIcon,
} from "@tabler/icons-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

import { NeighborhoodMap } from "@/components/sections/neighborhood-map";
import { SectionHeading } from "@/components/sections/section-heading";
import { audiences } from "@/content/site";
import { cn } from "@/lib/utils";

// "Who it's for": a sticky map of one city (left) glides to each industry's neighborhood
// as its row scrolls through the middle of the screen (right): its pin pops in and its
// route traces, with its postcard floating over the corner. The last row, "Your business",
// zooms out to the whole city, which then folds up into its own postcard with the call to
// action (see neighborhood-map.tsx). On phones the
// map sits above a swipeable row of industries and follows the one in view. Rows are
// clickable everywhere: they scroll into place and move the map.

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
  neutral: { panel: "bg-muted", text: "text-foreground", icon: "text-foreground" },
};

/** The list: every industry, then "Your business" (the city view). */
const rows = [
  ...audiences.industries.map((industry) => ({
    name: industry.name,
    body: industry.body,
    Icon: icons[industry.icon],
    tone: tones[industry.tone],
  })),
  { name: audiences.overview.name, body: audiences.overview.body, Icon: IconMapPins, tone: tones.neutral },
];

export function Audiences() {
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState(() => new Set([0]));
  const show = (i: number) => {
    setActive(i);
    setSeen((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  };
  const desktop = () => window.matchMedia("(min-width: 64rem)").matches;
  // While a clicked row scrolls into place, the rows it passes don't take over the map.
  const lock = useRef({ on: false, timer: 0 });
  const locked = () => lock.current.on;

  // Phones: the slide that's snapped into view picks the neighborhood.
  const rail = useRef<HTMLOListElement>(null);
  const onRailScroll = () => {
    const el = rail.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first || desktop() || locked()) return;
    const stride = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
    const i = Math.min(rows.length - 1, Math.max(0, Math.round(el.scrollLeft / stride)));
    if (i !== active) show(i);
  };

  // A click shows that row's neighborhood right away and brings the row into place:
  // to the middle of the screen on desktop, snapped to the start of the carousel on phones.
  const choose = (i: number, row: HTMLElement) => {
    show(i);
    window.clearTimeout(lock.current.timer);
    lock.current.on = true;
    lock.current.timer = window.setTimeout(() => (lock.current.on = false), 1200);
    row.scrollIntoView(
      desktop() ? { block: "center", behavior: "smooth" } : { inline: "start", block: "nearest", behavior: "smooth" }
    );
  };

  const map = (
    <NeighborhoodMap active={active} seen={seen}>
      <FloatingPostcard industry={audiences.industries[active] ?? null} index={active} />
    </NeighborhoodMap>
  );

  return (
    <MotionConfig reducedMotion="user">
      <section id="who-its-for" className="scroll-mt-20 py-20">
        <div className="container-page space-y-12">
          <SectionHeading eyebrow={audiences.eyebrow} title={audiences.title} body={audiences.body} />

          <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            {/* The map: sticky beside the list on desktop, above the carousel on phones
                (with room below for the postcard's overhang). */}
            <div className="pb-10 lg:pb-0">
              <div className="lg:sticky lg:top-[calc(50vh-15rem)]">{map}</div>
            </div>

            {/* Phones: a swipeable carousel, one industry per slide.
                Desktop: a tall list that scrolls past the sticky map. */}
            <ol
              ref={rail}
              onScroll={onRailScroll}
              className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:block lg:snap-none lg:overflow-visible lg:px-0 lg:py-[18vh] [&::-webkit-scrollbar]:hidden">
              {rows.map((row, i) => (
                <motion.li
                  key={row.name}
                  // Desktop: becomes active while it crosses the middle band of the screen.
                  onViewportEnter={() => desktop() && !locked() && show(i)}
                  viewport={{ margin: "-45% 0px -45% 0px" }}
                  className="flex w-[85%] shrink-0 snap-start flex-col sm:w-[60%] lg:block lg:w-auto lg:py-10"
                >
                  <Row {...row} active={i === active} onChoose={(el) => choose(i, el)} />
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

/** A row of the list. The whole card is clickable (its name is the button, stretched
 *  over the card), and the chosen one is lit while the others dim. */
function Row({
  name,
  body,
  Icon,
  tone,
  active,
  onChoose,
}: (typeof rows)[number] & { active: boolean; onChoose: (row: HTMLElement) => void }) {
  return (
    <div
      className={cn(
        "relative flex flex-1 gap-4 rounded-xl border bg-card p-5 transition-all duration-500 has-[button:focus-visible]:ring-3 has-[button:focus-visible]:ring-ring/50 lg:-m-4 lg:border-transparent lg:bg-transparent lg:p-4",
        !active && "opacity-50 hover:opacity-80 lg:opacity-40"
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
        <h3 className="text-lg font-semibold">
          <button
            type="button"
            aria-pressed={active}
            onClick={(e) => onChoose(e.currentTarget.closest("li") ?? e.currentTarget)}
            className="cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {name}
          </button>
        </h3>
        <p className="mt-1 text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

/** The active industry's postcard, floating over the map's corner like the cards over
 *  the hero's map: dealt in when the industry changes, then drifting gently. */
function FloatingPostcard({ industry, index }: { industry: Industry | null; index: number }) {
  return (
    <div className="pointer-events-none absolute -right-3 -bottom-10 w-[46%] sm:-right-6">
      <AnimatePresence initial={false}>
        {industry && (
          <motion.div
            key={index}
            className="absolute inset-x-0 bottom-0"
            initial={{ opacity: 0, y: 30, rotate: -8 }}
            animate={{ opacity: 1, y: 0, rotate: -3, transition: { type: "spring", stiffness: 220, damping: 24, delay: 0.3 } }}
            exit={{ opacity: 0, y: -16, rotate: 2, transition: { duration: 0.25 } }}
          >
            <div className="animate-[float-y_6s_ease-in-out_infinite] [--float-distance:6px] motion-reduce:animate-none">
              <Postcard industry={industry} elevated />
            </div>
          </motion.div>
        )}
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
