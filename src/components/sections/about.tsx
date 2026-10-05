"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconBuildingSkyscraper,
  IconBuildingStore,
  IconChevronLeft,
  IconChevronRight,
  IconMapPin,
  IconMapPins,
  IconPrinter,
  IconSparkles,
  IconWalk,
  IconNews,
  IconStack2,
  IconWorld,
} from "@tabler/icons-react";
import { AnimatePresence, MotionConfig, motion, useInView, useReducedMotion } from "motion/react";

import { type Place } from "@/components/sections/globe";
import { IsoArt } from "@/components/sections/iso-art";
import { AboutHeroArt } from "@/components/sections/about-hero-art";
import { Flag, WorldMap } from "@/components/sections/world-map";
import { Button } from "@/components/ui/button";
import { about } from "@/content/site";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";

// The About page's sections. One visual language with the rest of the site: white cards
// with hairline borders, the brand pink used sparingly, and the postal motifs (stamps,
// postmarks, routes) that run through EDDM. Everything fades up once as it comes into
// view; nothing is tied to the scroll position. Reduced motion: no movement at all.

const ease = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts its children in, once, when they come into view. */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm font-semibold tracking-wider text-brand uppercase", className)}>{children}</p>
  );
}

/* --------------------------------- Hero --------------------------------- */

/** The page's opening: Oppizi's line, and what it does: postcards, planned and tracked. */
export function AboutHero() {
  const { hero } = about;
  return (
    <MotionConfig reducedMotion="user">
      <section className="overflow-x-clip py-16 sm:py-24">
        <div className="container-page grid items-center gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
          <Reveal className="space-y-6">
            <Eyebrow>{hero.eyebrow}</Eyebrow>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl sm:leading-[1.05]">
              {hero.title}
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">{hero.body}</p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button size="xl" render={<a href={hero.primary.href} />} nativeButton={false} className="group">
                {hero.primary.label}
                <IconArrowRight className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
              </Button>
              <Button size="xl" variant="outline" render={<a href={hero.secondary.href} />} nativeButton={false}>
                {hero.secondary.label}
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="mx-auto w-full max-w-[340px] sm:max-w-[480px]">
            <AboutHeroArt />
          </Reveal>
        </div>
      </section>
    </MotionConfig>
  );
}

/* --------------------------------- Story -------------------------------- */

/**
 * The story as a stepper: four moments along a line, each with its icon, the line filling
 * in pink toward the next; below, the moment's scene, drawn in the same raised line style
 * as "What drives us" (it draws itself in, and moves a little), beside its title and
 * line. It moves on by itself every few seconds while on screen; pointing at it holds
 * it, picking a moment jumps there and ends the tour.
 */
const STORY_MS = 4500;
const storyIcons = [IconNews, IconWorld, IconStack2, IconSparkles];
const storyArt = ["story-flyers", "story-pins", "story-channels", "story-agent"] as const;

export function AboutStory() {
  const { story } = about;
  const n = story.stops.length;
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const [held, setHeld] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const onScreen = useInView(root, { amount: 0.5 });
  const reduce = useReducedMotion();
  const touring = onScreen && !touched && !held && !reduce;

  useEffect(() => {
    if (!touring) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % n), STORY_MS);
    return () => clearTimeout(t);
  }, [touring, active, n]);

  const stop = story.stops[active];
  const pick = (i: number) => {
    setTouched(true);
    setActive(i);
  };

  return (
    <MotionConfig reducedMotion="user">
      <section className="py-20 lg:py-28">
        <div className="container-page space-y-12">
          <Reveal className="mx-auto max-w-2xl space-y-3 text-center">
            <Eyebrow>{story.eyebrow}</Eyebrow>
            <h2 className="text-3xl font-bold text-balance sm:text-4xl">{story.title}</h2>
          </Reveal>

          <Reveal>
            <div
              ref={root}
              onPointerEnter={() => setHeld(true)}
              onPointerLeave={() => setHeld(false)}
              className="space-y-6 rounded-3xl bg-muted/50 px-4 pt-8 pb-6 sm:px-10 sm:pt-10 sm:pb-8 lg:px-14"
            >
              {/* The stepper: an icon per moment on a line that fills toward the next */}
              <div role="tablist" aria-label={story.title} className="relative grid grid-cols-4">
                <div aria-hidden className="absolute inset-x-[12.5%] top-[23px] h-0.5 bg-border sm:top-[27px]">
                  <motion.div
                    className="h-full origin-left bg-primary"
                    initial={false}
                    animate={{ scaleX: (active + (touring && active < n - 1 ? 1 : 0)) / (n - 1) }}
                    transition={
                      touring && active < n - 1 ? { duration: STORY_MS / 1000, ease: "linear" } : { duration: 0.5, ease }
                    }
                  />
                </div>
                {story.stops.map((s, i) => {
                  const Icon = storyIcons[i];
                  const on = i === active;
                  const done = i < active;
                  return (
                    <button
                      key={s.title}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => pick(i)}
                      className="group flex cursor-pointer flex-col items-center gap-3 px-1 text-center outline-none"
                    >
                      <span
                        className={cn(
                          "relative z-10 grid size-12 place-items-center rounded-full border-2 transition-[background-color,border-color,color,scale] duration-300 group-focus-visible:ring-3 group-focus-visible:ring-ring/50 sm:size-14",
                          on
                            ? "scale-110 border-primary bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_var(--primary)]"
                            : done
                              ? "border-primary bg-card text-brand"
                              : "border-border bg-card text-muted-foreground group-hover:border-primary/50 group-hover:text-brand"
                        )}
                      >
                        <Icon className="size-5 sm:size-6" aria-hidden />
                      </span>
                      <span>
                        <span className={cn("block text-xs font-semibold tracking-wider uppercase transition-colors", on ? "text-brand" : "text-muted-foreground")}>
                          {s.when}
                        </span>
                        <span className={cn("mt-0.5 hidden text-sm font-medium transition-colors lg:block", on ? "text-foreground" : "text-muted-foreground")}>
                          {s.title}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* The moment: its scene, drawn in, beside its words */}
              <div role="tabpanel" aria-live="polite" className="grid items-center md:grid-cols-[1.1fr_1fr] md:gap-10">
                <div className="grid h-64 place-items-center md:h-96">
                  <IsoArt key={active} name={storyArt[active]} className="w-full max-w-[460px]" />
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease }}
                    className="flex flex-col justify-center gap-3 px-2 pb-4 text-center md:px-0 md:pb-0 md:text-left"
                  >
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase tabular-nums">
                      <span className="text-brand">{stop.when}</span> · {stop.unit}
                    </p>
                    <h3 className="text-2xl font-semibold text-balance sm:text-3xl">{stop.title}</h3>
                    <p className="text-lg text-pretty text-muted-foreground">{stop.body}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </MotionConfig>
  );
}

/* -------------------------------- Mission ------------------------------- */

/** The mission, as one big sentence, its key words in pink with a marker stroke under them. */
export function AboutMission() {
  const { mission } = about;
  return (
    <MotionConfig reducedMotion="user">
      <section className="border-y bg-muted/40 py-20 lg:py-28">
        <Reveal className="container-page max-w-4xl space-y-6 text-center">
          <Eyebrow>{mission.eyebrow}</Eyebrow>
          <p className="font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.12]">
            {mission.before}{" "}
            {/* A marker stroke under the words, swept in once; it wraps with them on phones */}
            <motion.span
              initial={{ backgroundSize: "0% 0.16em" }}
              whileInView={{ backgroundSize: "100% 0.16em" }}
              viewport={{ once: true, amount: 1 }}
              transition={{ duration: 0.9, delay: 0.4, ease }}
              className="bg-[linear-gradient(color-mix(in_oklab,var(--primary)_35%,transparent),color-mix(in_oklab,var(--primary)_35%,transparent))] bg-[position:0_92%] bg-no-repeat box-decoration-clone text-brand"
            >
              {mission.highlight}
            </motion.span>{" "}
            {mission.after}
          </p>
        </Reveal>
      </section>
    </MotionConfig>
  );
}

/* -------------------------------- Values -------------------------------- */

/**
 * The four beliefs as cards, after Tailark's: a line drawing of a raised object in calm
 * space (it traces itself in, and lifts on hover), then the title and a sentence.
 */
export function AboutValues() {
  return (
    <MotionConfig reducedMotion="user">
      <section className="py-20 lg:py-28">
        <div className="container-page space-y-12">
          <Reveal className="mx-auto max-w-2xl space-y-3 text-center">
            <Eyebrow>{about.valuesEyebrow}</Eyebrow>
            <h2 className="text-3xl font-bold text-balance sm:text-4xl">{about.valuesTitle}</h2>
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {about.values.map((value, i) => (
              <motion.li
                key={value.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.08, ease }}
                className="group flex flex-col rounded-3xl border bg-card p-6 transition-shadow duration-500 hover:shadow-[0_20px_40px_-28px_rgb(0_0_0/0.3)]"
              >
                <div className="grid h-44 place-items-center">
                  <IsoArt name={value.art} className="w-full max-w-[240px]" />
                </div>
                <h3 className="mt-6 font-semibold text-balance">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">{value.body}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>
    </MotionConfig>
  );
}

/* --------------------------------- World -------------------------------- */

// Every country's pin, and the headquarters the routes fly out from (Brooklyn: the US pin)
const places: Place[] = about.world.regions.flatMap((r) =>
  r.countries.map(([id, , lat, lng]) => ({ id, lat, lng }))
);
const hub = places.find((p) => p.id === "US") ?? places[0];
const countryNames: Record<string, string> = Object.fromEntries(
  about.world.regions.flatMap((r) => r.countries.map(([id, name]) => [id, name] as const))
);

/**
 * Where Oppizi works, as a bento grid: a big tile with a dotted world map and the
 * network's numbers along its foot, beside the headquarters and the markets (pointing at
 * one moves the map's flag to it). Stacked on phones.
 */
export function AboutWorld() {
  const { world } = about;
  const [focus, setFocus] = useState<string | null>(null);
  return (
    <MotionConfig reducedMotion="user">
      <section className="py-20 lg:py-28">
        <div className="container-page space-y-12">
          <Reveal className="mx-auto max-w-2xl space-y-3 text-center">
            <Eyebrow>{world.eyebrow}</Eyebrow>
            <h2 className="text-3xl font-bold text-balance sm:text-4xl">{world.title}</h2>
            <p className="text-lg text-pretty text-muted-foreground">{world.body}</p>
          </Reveal>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* The world map, every market on it, a pin touring them */}
            <Tile className="relative overflow-hidden lg:col-span-2 lg:row-span-2">
              <TileHead icon={<IconWorld className="size-5" />} title={world.reach.title} body={world.reach.body} />
              <div className="my-auto py-6 sm:px-4">
                <WorldMap order={places.map((p) => p.id)} hub={hub.id} focus={focus} names={countryNames} />
              </div>

              {/* The network, as a strip along the foot of the card */}
              <dl className="-mx-6 -mb-6 grid grid-cols-3 divide-x border-t sm:-mx-7 sm:-mb-7">
                {world.network.map((n) => {
                  const Icon = networkIcons[n.icon];
                  return (
                    <div key={n.label} className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:gap-3 sm:px-6 sm:py-5">
                      <Icon className="size-5 shrink-0 text-brand" aria-hidden />
                      <div className="flex flex-col-reverse">
                        <dt className="text-xs leading-snug text-muted-foreground sm:text-sm">{n.label}</dt>
                        <dd className="font-heading text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{n.value}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </Tile>

            {/* The headquarters, as an address label */}
            <Tile delay={0.08}>
              <TileHead icon={<IconBuildingSkyscraper className="size-5" />} title={world.hq.label} />
              <div className="mt-auto rounded-2xl border border-dashed bg-muted/40 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-brand uppercase">
                  <IconMapPin className="size-3.5" aria-hidden /> {world.hq.place}
                </p>
                <p className="mt-2 font-medium">Oppizi US Inc</p>
                <p className="text-sm text-muted-foreground">{world.hq.address}</p>
              </div>
            </Tile>

            {/* The markets: pointing at one turns the globe to it */}
            <Tile delay={0.16}>
              <TileHead icon={<IconMapPins className="size-5" />} title={world.countriesTitle} body={world.countriesBody} />
              <div className="mt-auto space-y-3">
                {world.regions.map((region) => (
                  <div key={region.name} className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground">{region.name}</p>
                    <ul className="flex flex-wrap gap-1">
                      {region.countries.map(([code, name]) => (
                        <li key={code}>
                          <button
                            type="button"
                            title={name}
                            aria-label={`Show ${name} on the globe`}
                            onPointerEnter={() => setFocus(code)}
                            onPointerLeave={() => setFocus(null)}
                            onFocus={() => setFocus(code)}
                            onBlur={() => setFocus(null)}
                            onClick={() => setFocus(code)}
                            className={cn(
                              "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border bg-card pr-2 pl-1.5 text-xs font-bold tracking-wide transition-colors outline-none hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50",
                              focus === code
                                ? "border-primary bg-brand-subtle text-brand"
                                : "text-muted-foreground"
                            )}
                          >
                            <span className="size-3.5 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
                              <Flag id={code} className="size-full" />
                            </span>
                            {code}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {/* Which one is in focus, for screen readers (the map shows its name) */}
              <p aria-live="polite" className="sr-only">
                {focus && countryNames[focus]}
              </p>
            </Tile>

          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

const networkIcons = { walk: IconWalk, store: IconBuildingStore, printer: IconPrinter } as const;

/** One tile of the bento: a white card that fades up into view. */
function Tile({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease }}
      className={cn("flex flex-col rounded-3xl border bg-card p-6 sm:p-7", className)}
    >
      {children}
    </motion.div>
  );
}

/** A tile's icon, title and line. */
function TileHead({ icon, title, body }: { icon: React.ReactNode; title: string; body?: string }) {
  return (
    <div className="relative z-10 mb-6 space-y-2">
      <span aria-hidden className="text-brand">
        {icon}
      </span>
      <h3 className="pt-2 text-lg font-semibold">{title}</h3>
      {body && <p className="max-w-sm text-muted-foreground text-pretty">{body}</p>}
    </div>
  );
}

/* ---------------------------------- Team -------------------------------- */

/**
 * The leadership team as a row of tall portrait cards, after apple.com's product
 * carousels: it runs off the right edge of the page and scrolls sideways (swipe, trackpad,
 * or the arrows), snapping to each card. The name and role sit over the bottom of each
 * photo; the photo eases in a little on hover.
 */
export function AboutTeam() {
  const { team } = about;
  const row = useRef<HTMLUListElement>(null);
  const [ends, setEnds] = useState({ start: true, end: false });
  const update = () => {
    const el = row.current;
    if (!el) return;
    setEnds({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  };
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  // One card (and its gap) per press
  const step = (dir: 1 | -1) => {
    const el = row.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 16), behavior: "smooth" });
  };

  return (
    <MotionConfig reducedMotion="user">
      <section className="overflow-x-clip border-y bg-muted/40 py-20 lg:py-28">
        <div className="container-page flex items-end justify-between gap-6">
          <Reveal className="space-y-3">
            <Eyebrow>{team.eyebrow}</Eyebrow>
            <h2 className="text-3xl font-bold text-balance sm:text-4xl">{team.title}</h2>
          </Reveal>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <CarouselButton label="Previous" disabled={ends.start} onClick={() => step(-1)}>
              <IconChevronLeft className="size-5" />
            </CarouselButton>
            <CarouselButton label="Next" disabled={ends.end} onClick={() => step(1)}>
              <IconChevronRight className="size-5" />
            </CarouselButton>
          </div>
        </div>

        {/* The row starts in line with the page's content and runs to the window's edge */}
        <ul
          ref={row}
          onScroll={update}
          aria-label={team.title}
          // The inset matches container-page (1rem, 1.5rem from 640px; 72rem wide at most);
          // a little room above and below so the cards' shadows aren't cut off
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-[var(--inset)] pt-2 pb-6 [--gutter:1rem] [--inset:max(var(--gutter),calc((100%-72rem)/2+var(--gutter)))] [scroll-padding-inline:var(--inset)] [scrollbar-width:none] sm:[--gutter:1.5rem] [&::-webkit-scrollbar]:hidden"
        >
          {team.people.map((person, i) => (
            <motion.li
              key={person.name}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: Math.min(i, 4) * 0.08, ease }}
              className="group relative aspect-[4/5] w-60 shrink-0 snap-start overflow-hidden rounded-3xl bg-card shadow-[0_1px_2px_rgb(0_0_0/0.06),0_20px_40px_-24px_rgb(0_0_0/0.35)] ring-1 ring-black/5 sm:w-72"
            >
              <Image
                src={asset(`/team/${person.photo}.webp`)}
                alt={person.name}
                fill
                sizes="(min-width: 640px) 288px, 240px"
                className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              />
              {/* A dark wash at the foot of the photo, for the name */}
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-xs font-semibold tracking-wider text-white/75 uppercase">{person.role}</p>
                <p className="mt-1 font-heading text-xl font-semibold tracking-tight">{person.name}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </section>
    </MotionConfig>
  );
}

function CarouselButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 cursor-pointer place-items-center rounded-full border bg-card text-foreground shadow-sm transition-[background-color,opacity,scale] outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-card"
    >
      {children}
    </button>
  );
}

/* ---------------------------------- Life -------------------------------- */

/** Careers: a dark card, the one on the page, with the two ways to join. */
export function AboutLife() {
  const { life } = about;
  return (
    <MotionConfig reducedMotion="user">
      <section className="py-20">
        <div className="container-page">
          <Reveal className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-14 text-background sm:px-12 sm:py-16">
            {/* A faint grid of routes across the card */}
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.06)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_80%_20%,black,transparent_70%)]"
            />
            <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
              <div className="space-y-5">
                <p className="text-sm font-semibold tracking-wider text-[var(--ds-tw-rose-300)] uppercase">{life.eyebrow}</p>
                <h2 className="max-w-xl text-3xl font-bold text-balance sm:text-4xl">{life.title}</h2>
                <ul className="space-y-1.5 text-lg text-background/70">
                  {life.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <ul className="flex flex-wrap gap-2 pt-2">
                  {life.tags.map((tag) => (
                    <li key={tag} className="rounded-full border border-background/20 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <Button
                  size="xl"
                  render={<a href={life.primary.href} />}
                  nativeButton={false}
                  className="group bg-background text-foreground hover:bg-background/90"
                >
                  {life.primary.label}
                  <IconArrowUpRight className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                </Button>
                <a
                  href={life.secondary.href}
                  className="inline-flex h-11 items-center gap-1.5 px-1 text-sm font-medium text-background/80 underline-offset-4 hover:text-background hover:underline"
                >
                  {life.secondary.label}
                  <IconArrowUpRight className="size-4" aria-hidden />
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </MotionConfig>
  );
}
