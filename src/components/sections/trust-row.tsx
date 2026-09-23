"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useInView, useMotionValue, useReducedMotion } from "motion/react";

import { trust } from "@/content/site";
import { cn } from "@/lib/utils";

/** Logos are drawn at this share of their SVG's natural size — their viewBoxes are already balanced against each other.
 *  Shown at 80%: close to the stats' near-black but a step quieter; full strength on hover. */
const LOGO_SCALE = 0.72;

/** One full loop of the strip at normal speed. */
const LOOP_SECONDS = 45;
/** How quickly the speed eases toward its target (hover, or settling after a fling). */
const EASE_MS = 450;
/** Cap on the glide speed after a flick, in px/s. */
const MAX_FLING = 2500;

export function TrustRow() {
  return (
    <section aria-label="Our clients" className="border-t py-12">
      <div className="container-page space-y-10">
        <p className="text-center text-sm font-medium text-muted-foreground">{trust.label}</p>

        <LogoMarquee />

        <dl className="grid grid-cols-2 gap-y-8 border-t pt-10 md:grid-cols-4 md:divide-x">
          {trust.stats.map((stat) => (
            <div key={stat.label} className="px-4 text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-heading text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
                {stat.value}
              </dd>
              <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/**
 * Endless logo strip. It drifts left, eases to half speed while hovered, and can be
 * dragged either way — let go with a flick and it glides, then settles back to its
 * drift. Fades out at both edges; a static wrapped row for visitors who prefer reduced
 * motion. Driven frame by frame (a CSS animation can only play or pause).
 */
function LogoMarquee() {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  // The strip only moves while it's on screen; off screen it would just burn frames.
  const onScreen = useInView(rootRef);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const half = useRef(0); // width of one copy of the list = one loop
  const speed = useRef(0); // px/s; positive moves left. Starts at 0 and eases in.
  const hovered = useRef(false);
  const drag = useRef<{ startX: number; startValue: number; lastX: number; lastT: number; velocity: number } | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => (half.current = el.scrollWidth / 2);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /** Keep x within one loop, so the strip repeats seamlessly in both directions. */
  const wrap = (value: number) => {
    const h = half.current;
    return h ? (((value % h) - h) % h) : value;
  };

  // Our own frame loop, so it can stop completely while the strip is off screen (a
  // running loop keeps the browser drawing frames even when nothing changes).
  useEffect(() => {
    if (reduceMotion !== false || !onScreen) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(now - last, 100); // no jump after the tab was in the background
      last = now;
      if (!drag.current && half.current) {
        const base = half.current / LOOP_SECONDS;
        const target = hovered.current ? base / 2 : base;
        speed.current += (target - speed.current) * Math.min(1, delta / EASE_MS);
        x.set(wrap(x.get() - (speed.current * delta) / 1000));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, onScreen, x]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion !== false) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    drag.current = { startX: e.clientX, startValue: x.get(), lastX: e.clientX, lastT: now, velocity: 0 };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const now = performance.now();
    if (now > d.lastT) d.velocity = ((e.clientX - d.lastX) / (now - d.lastT)) * 1000;
    d.lastX = e.clientX;
    d.lastT = now;
    x.set(wrap(d.startValue + e.clientX - d.startX));
  };
  const onPointerEnd = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    // Glide on in the flick's direction (none if the pointer was held still), then ease back.
    const velocity = performance.now() - d.lastT > 100 ? 0 : d.velocity;
    speed.current = Math.max(-MAX_FLING, Math.min(MAX_FLING, -velocity));
  };

  return (
    <div
      ref={rootRef}
      onPointerEnter={(e) => e.pointerType === "mouse" && (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      // pan-y: vertical swipes still scroll the page on touch screens.
      className="relative touch-pan-y overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] motion-reduce:[mask-image:none]"
    >
      <motion.div ref={trackRef} style={{ x }} className="flex w-max motion-reduce:w-full">
        <LogoList />
        {/* Second copy makes the loop seamless; hidden from assistive tech and when static. */}
        <LogoList aria-hidden className="motion-reduce:hidden" />
      </motion.div>
    </div>
  );
}

function LogoList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn(
        "flex shrink-0 items-center gap-14 pr-14 motion-reduce:w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-8 motion-reduce:pr-0 sm:gap-20 sm:pr-20 sm:motion-reduce:pr-0",
        className
      )}
      {...props}
    >
      {trust.clients.map((client) => (
        <li key={client.name} className="shrink-0">
          <Image
            src={client.src}
            alt={props["aria-hidden"] ? "" : client.name}
            width={client.width}
            height={client.height}
            unoptimized
            // Tiny SVGs that slide in from off-screen; lazy loading would make them pop in.
            loading="eager"
            draggable={false}
            className="opacity-80 transition-opacity duration-300 hover:opacity-100"
            style={{ width: client.width * LOGO_SCALE, height: "auto" }}
          />
        </li>
      ))}
    </ul>
  );
}
