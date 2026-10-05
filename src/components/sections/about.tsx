"use client";

import { useId, useState } from "react";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconBuildingSkyscraper,
  IconBuildingStore,
  IconMapPin,
  IconMapPins,
  IconPrinter,
  IconQrcode,
  IconWalk,
  IconWorld,
} from "@tabler/icons-react";
import { MotionConfig, motion } from "motion/react";

import { DotOrb } from "@/components/sections/dot-orb";
import { Globe, type Place } from "@/components/sections/globe";
import { Button } from "@/components/ui/button";
import { about } from "@/content/site";
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

/** The page's opening: Oppizi's line, and a postmark with what a decade of mail adds up to. */
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

          <Reveal delay={0.15} className="mx-auto w-full max-w-[300px] sm:max-w-[440px]">
            <Postmark />
          </Reveal>
        </div>
      </section>
    </MotionConfig>
  );
}

/**
 * A round postmark, the kind a post office stamps on every piece: Oppizi's story around
 * the ring (turning slowly), what it adds up to in the middle, and wavy cancellation
 * lines running off to one side. A soft card of light behind it.
 */
function Postmark() {
  const { hero } = about;
  const id = useId();
  const ring = `${id}-ring`;
  return (
    <div className="relative aspect-square">
      {/* A soft pool of brand light behind (a gradient, not a blur: iPhone Safari) */}
      <div
        aria-hidden
        className="absolute inset-[-12%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_16%,transparent),transparent)]"
      />
      {/* The cancellation waves, behind the stamp, running a little way off to the left */}
      <svg aria-hidden viewBox="0 0 400 400" className="absolute inset-0 size-full overflow-visible text-brand/25">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.path
            key={i}
            d={`M -50 ${150 + i * 24} q 22 -12 44 0 t 44 0 t 44 0 t 44 0`}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.4 + i * 0.08, ease }}
          />
        ))}
      </svg>

      {/* The stamp itself */}
      <div className="absolute inset-[8%] rounded-full bg-card shadow-[0_1px_2px_rgb(0_0_0/0.06),0_30px_60px_-30px_color-mix(in_oklab,var(--primary)_45%,black)] ring-1 ring-border">
        <svg viewBox="0 0 320 320" className="size-full text-brand" role="img" aria-label={`${hero.postmarkValue} ${hero.postmarkLabel}, since 2014`}>
          <defs>
            <path id={ring} d="M 160 160 m -128 0 a 128 128 0 1 1 256 0 a 128 128 0 1 1 -256 0" />
          </defs>
          {/* Two rings, like the edge of an ink stamp */}
          <circle cx="160" cy="160" r="150" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="160" cy="160" r="108" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 5" opacity="0.6" />
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 60, ease: "linear", repeat: Infinity }}
            style={{ transformOrigin: "160px 160px" }}
          >
            <text className="fill-current text-[15px] font-semibold tracking-[0.2em]">
              {/* Once round, spaced to meet itself exactly (2πr) */}
              <textPath href={`#${ring}`} startOffset="0" textLength={2 * Math.PI * 128 - 4} lengthAdjust="spacing">
                {hero.postmark}
              </textPath>
            </text>
          </motion.g>
          <text x="160" y="160" textAnchor="middle" className="fill-foreground font-heading text-[54px] font-bold tracking-tight">
            {hero.postmarkValue}
          </text>
          <text x="160" y="190" textAnchor="middle" className="fill-muted-foreground text-[14px] font-medium">
            {hero.postmarkLabel}
          </text>
          <text x="160" y="226" textAnchor="middle" className="fill-current text-[11px] font-semibold tracking-[0.3em]">
            2014 — TODAY
          </text>
        </svg>
      </div>
    </div>
  );
}

/* --------------------------------- Story -------------------------------- */

/**
 * The story as a mail route: four stops on a dashed line, each a card. Across on
 * desktops (the line draws itself from stop to stop), down on phones.
 */
export function AboutStory() {
  const { story } = about;
  return (
    <MotionConfig reducedMotion="user">
      <section className="py-20 lg:py-28">
        <div className="container-page space-y-14">
          <Reveal className="mx-auto max-w-2xl space-y-3 text-center">
            <Eyebrow>{story.eyebrow}</Eyebrow>
            <h2 className="text-3xl font-bold text-balance sm:text-4xl">{story.title}</h2>
          </Reveal>

          <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-6">
            {/* The route: a dashed line from the first stop to the last, which fills in pink
                from stop to stop (across on desktops; on phones, a dashed line down). The last
                stop's center is 3/4 of the row plus 3/4 of a 24px gap from the first's. */}
            <div aria-hidden className="absolute top-[21px] left-[22px] hidden h-0.5 w-[calc(75%+18px)] bg-[repeating-linear-gradient(90deg,var(--border)_0_6px,transparent_6px_12px)] lg:block">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 1 }}
                transition={{ duration: 1.6, delay: 0.2, ease: "easeInOut" }}
                className="h-full origin-left bg-primary"
              />
            </div>

            {story.stops.map((stop, i) => {
              const last = i === story.stops.length - 1;
              return (
                <motion.li
                  key={stop.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.35, ease }}
                  className="relative flex gap-5 lg:flex-col lg:gap-6"
                >
                  {/* On phones, a dashed line down to the next stop (the 40px gap between them) */}
                  {!last && (
                    <span aria-hidden className="absolute top-11 -bottom-10 left-[21px] w-0.5 bg-[repeating-linear-gradient(180deg,var(--border)_0_6px,transparent_6px_12px)] lg:hidden" />
                  )}
                  {/* The stop: a ring on the route, filled at the last (where we are now) */}
                  <span
                    className={cn(
                      "relative z-10 grid size-11 shrink-0 place-items-center rounded-full border-2 bg-background text-xs font-bold tabular-nums",
                      last ? "border-primary bg-primary text-primary-foreground" : "border-primary text-brand"
                    )}
                  >
                    {last ? <IconMapPin className="size-4" aria-hidden /> : String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      <span className="text-brand">{stop.when}</span> · {stop.where}
                    </p>
                    <h3 className="text-lg font-semibold">{stop.title}</h3>
                    <p className="text-muted-foreground text-pretty">{stop.body}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
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

/** The four beliefs, each with a small live picture of it. */
export function AboutValues() {
  return (
    <MotionConfig reducedMotion="user">
      <section className="py-20 lg:py-28">
        <div className="container-page space-y-12">
          <Reveal className="mx-auto max-w-2xl space-y-3 text-center">
            <Eyebrow>{about.valuesEyebrow}</Eyebrow>
            <h2 className="text-3xl font-bold text-balance sm:text-4xl">{about.valuesTitle}</h2>
          </Reveal>
          <ul className="grid gap-5 sm:grid-cols-2">
            {about.values.map((value, i) => (
              <motion.li
                key={value.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: (i % 2) * 0.12, ease }}
                className="group flex flex-col overflow-hidden rounded-3xl border bg-card"
              >
                <div className="relative h-44 overflow-hidden border-b bg-muted/40">
                  <ValueArt art={value.art} />
                </div>
                <div className="space-y-2 p-6 sm:p-7">
                  <p className="text-xs font-semibold tracking-wider text-brand tabular-nums">0{i + 1}</p>
                  <h3 className="text-xl font-semibold">{value.title}</h3>
                  <p className="text-muted-foreground text-pretty">{value.body}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>
    </MotionConfig>
  );
}

function ValueArt({ art }: { art: (typeof about.values)[number]["art"] }) {
  if (art === "agents") {
    // The site's own "AI is thinking" orb
    return (
      <div className="absolute inset-0 grid place-items-center">
        <DotOrb className="size-36" />
      </div>
    );
  }
  if (art === "attention") {
    // A postcard picked up off the mat: lifts and turns a little on hover
    return (
      <div className="absolute inset-0 grid place-items-center">
        <div className="absolute h-24 w-40 -rotate-6 rounded-lg border bg-card/70 shadow-sm" />
        <div className="relative flex h-24 w-40 rotate-3 flex-col justify-between rounded-lg border bg-card p-3 shadow-[0_12px_24px_-12px_rgb(0_0_0/0.3)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2 group-hover:rotate-0">
          <div className="flex items-start justify-between">
            <span className="h-2 w-14 rounded-full bg-foreground/80" />
            <span className="stamp-perforated size-7 bg-brand/20">
              <span className="block size-full bg-brand" />
            </span>
          </div>
          <div className="space-y-1.5">
            <span className="block h-1.5 w-20 rounded-full bg-muted-foreground/30" />
            <span className="block h-1.5 w-14 rounded-full bg-muted-foreground/30" />
          </div>
        </div>
      </div>
    );
  }
  if (art === "measurable") {
    // Scans by route, rising as it comes into view; a QR mark for where they come from
    const bars = [38, 62, 46, 84, 70, 96, 58];
    return (
      <div className="absolute inset-x-8 top-8 bottom-6 flex items-end gap-2.5">
        <span className="absolute top-0 left-0 grid size-8 place-items-center rounded-lg border bg-card text-brand">
          <IconQrcode className="size-4" aria-hidden />
        </span>
        {bars.map((h, i) => (
          <motion.span
            key={i}
            initial={{ scaleY: 0.15 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.8, delay: 0.2 + i * 0.07, ease }}
            style={{ height: `${h}%` }}
            className={cn("flex-1 origin-bottom rounded-t-md", i === 5 ? "bg-brand" : "bg-brand/25")}
          />
        ))}
      </div>
    );
  }
  // Scale: a city of homes, lighting up in a wave, every one the same
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="grid grid-cols-12 gap-2">
        {Array.from({ length: 48 }, (_, i) => {
          const col = i % 12;
          const row = Math.floor(i / 12);
          return (
            <motion.span
              key={i}
              initial={{ backgroundColor: "var(--muted)" }}
              whileInView={{ backgroundColor: "var(--primary)" }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.3, delay: 0.2 + (col + row) * 0.05 }}
              className="size-3.5 rounded-[4px]"
            />
          );
        })}
      </div>
    </div>
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
 * Where Oppizi works, as a bento grid: a big tile with the globe rising out of its bottom
 * edge, the headquarters, the markets (pointing at one turns the globe to it), and the
 * network in three small tiles. Stacked on phones.
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
            {/* The globe, half out of view, rising from the tile's bottom edge */}
            <Tile className="relative min-h-[440px] overflow-hidden sm:min-h-[560px] lg:col-span-2 lg:row-span-2">
              <TileHead icon={<IconWorld className="size-5" />} title={world.reach.title} body={world.reach.body} />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(60%_70%_at_50%_100%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent)]"
              />
              <div className="absolute top-[30%] left-1/2 w-[125%] max-w-[760px] -translate-x-1/2 sm:top-[24%] sm:w-[100%]">
                <Globe places={places} hub={hub} focus={focus} lift={0.5} />
              </div>
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
                              "h-7 cursor-pointer rounded-lg border bg-card px-2 text-xs font-bold tracking-wide transition-colors outline-none hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50",
                              focus === code
                                ? "border-primary bg-primary text-primary-foreground"
                                : code === hub.id
                                  ? "border-primary/40 bg-brand-subtle/60 text-brand"
                                  : "text-muted-foreground"
                            )}
                          >
                            {code}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {/* Which one is in focus, spelled out */}
              <p aria-live="polite" className="mt-3 h-5 text-sm font-medium text-brand">
                {focus && countryNames[focus]}
              </p>
            </Tile>

            {/* The network */}
            {world.network.map((n, i) => {
              const Icon = networkIcons[n.icon];
              return (
                <Tile key={n.label} delay={0.08 * i}>
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-subtle text-brand">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <p className="mt-6 font-heading text-4xl font-bold tracking-tight tabular-nums">{n.value}</p>
                  <p className="mt-1 font-semibold">{n.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">{n.body}</p>
                </Tile>
              );
            })}
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

// Monogram colors, from the design system's palette, one per person in turn.
const monograms = [
  "bg-[var(--ds-tw-rose-100)] text-[var(--ds-tw-rose-700)]",
  "bg-[var(--ds-tw-indigo-100)] text-[var(--ds-tw-indigo-700)]",
  "bg-[var(--ds-tw-amber-100)] text-[var(--ds-tw-amber-700)]",
  "bg-[var(--ds-tw-teal-100)] text-[var(--ds-tw-teal-700)]",
  "bg-[var(--ds-tw-sky-100)] text-[var(--ds-tw-sky-700)]",
  "bg-[var(--ds-tw-fuchsia-100)] text-[var(--ds-tw-fuchsia-700)]",
];

const initials = (name: string) =>
  name
    .split(" ")
    .filter((w) => /^\p{Lu}/u.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

/** The leadership team: monograms (no photos yet), names and roles. */
export function AboutTeam() {
  const { team } = about;
  return (
    <MotionConfig reducedMotion="user">
      <section className="border-y bg-muted/40 py-20 lg:py-28">
        <div className="container-page space-y-12">
          <Reveal className="mx-auto max-w-2xl space-y-3 text-center">
            <Eyebrow>{team.eyebrow}</Eyebrow>
            <h2 className="text-3xl font-bold text-balance sm:text-4xl">{team.title}</h2>
          </Reveal>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {team.people.map((person, i) => (
              <motion.li
                key={person.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease }}
                className="flex flex-col items-start gap-4 rounded-2xl border bg-card p-5 transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center"
              >
                <span
                  aria-hidden
                  className={cn("grid size-12 shrink-0 place-items-center rounded-full font-heading text-base font-bold", monograms[i % monograms.length])}
                >
                  {initials(person.name)}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{person.name}</p>
                  <p className="text-sm text-muted-foreground">{person.role}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>
    </MotionConfig>
  );
}

/* -------------------------------- Results ------------------------------- */

/** Three case-study numbers, under the client logos. */
export function AboutResults() {
  const { results } = about;
  return (
    <MotionConfig reducedMotion="user">
      <section className="pb-20">
        <div className="container-page space-y-8">
          <Reveal>
            <h2 className="text-center text-2xl font-bold text-balance sm:text-3xl">{results.title}</h2>
          </Reveal>
          <ul className="grid gap-4 md:grid-cols-3">
            {results.items.map((item, i) => (
              <motion.li
                key={item.brand}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className="rounded-2xl border bg-card p-6"
              >
                <p className="text-sm font-semibold">{item.brand}</p>
                <p className="mt-3 font-heading text-5xl font-bold tracking-tight text-brand tabular-nums">{item.value}</p>
                <p className="mt-1 text-muted-foreground">{item.label}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>
    </MotionConfig>
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
