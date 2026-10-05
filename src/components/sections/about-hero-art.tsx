"use client";

import { IconCircleCheck, IconQrcode, IconSparkles } from "@tabler/icons-react";
import { motion } from "motion/react";

import { Postcard } from "@/components/sections/audiences";
import { audiences } from "@/content/site";
import { cn } from "@/lib/utils";

// The About hero's picture: what Oppizi does, in the words of the line beside it ("plan,
// create and track"). Real postcards from "Who it's for", fanned out (create), with the
// plan and the results floating around them as small product chips: an agent's route
// plan, the homes reached, the QR scans coming in. The cards fan out once on coming
// into view; the chips pop in after them, then drift gently.

const ease = [0.22, 1, 0.36, 1] as const;
const card = (icon: string) => audiences.industries.find((i) => i.icon === icon) ?? audiences.industries[0];
const front = card("restaurant");
const left = card("gym");
const right = card("realEstate");

/** A white chip, the product's own look: an icon tile, a label, a value. */
function Chip({
  icon,
  label,
  value,
  className,
  delay,
  drift,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
  delay: number;
  drift: number;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay, ease }}
      className={cn("absolute z-20", className)}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 5, delay: drift, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center gap-3 rounded-2xl bg-card p-3 pr-4 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_14px_32px_-12px_rgb(0_0_0/0.28)] ring-1 ring-border"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand">{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] leading-tight font-medium text-muted-foreground">{label}</p>
          <p className="text-sm leading-tight font-semibold whitespace-nowrap">{value}</p>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function AboutHeroArt() {
  return (
    <div className="relative mx-auto aspect-[6/5] w-full max-w-[480px]">
      {/* A soft pool of brand light behind the cards */}
      <div
        aria-hidden
        className="absolute inset-[-10%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_10%,transparent),transparent)]"
      />

      {/* Create: three postcards fanned out, the front one a little crooked */}
      <div className="absolute inset-x-[8%] top-[20%]">
        {[
          { industry: left, rotate: -9, x: "-14%", y: "-10%", delay: 0.15 },
          { industry: right, rotate: 8, x: "14%", y: "-12%", delay: 0.15 },
        ].map((c) => (
          <motion.div
            key={c.industry.icon}
            aria-hidden
            initial={{ opacity: 0, rotate: -2, x: 0, y: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, rotate: c.rotate, x: c.x, y: c.y, scale: 0.9 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: c.delay, ease }}
            className="absolute inset-x-0 top-0"
          >
            <Postcard industry={c.industry} />
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -6 }}
          whileInView={{ opacity: 1, y: 0, rotate: -2 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease }}
          className="relative z-10"
        >
          <Postcard industry={front} />
        </motion.div>
      </div>

      {/* Plan, reach, track: the product around the cards */}
      <Chip
        icon={<IconSparkles className="size-[18px]" aria-hidden />}
        label="AI agent planned"
        value="6 routes · Williamsburg"
        className="top-[2%] left-[-2%]"
        delay={0.55}
        drift={0}
      />
      <Chip
        icon={<IconCircleCheck className="size-[18px]" aria-hidden />}
        label="Delivered to"
        value="4,820 homes"
        className="top-[14%] right-[-4%]"
        delay={0.7}
        drift={1.4}
      />
      <Chip
        icon={<IconQrcode className="size-[18px]" aria-hidden />}
        label="QR scans this week"
        value="212 · +18%"
        className="right-[-4%] bottom-[-2%]"
        delay={0.85}
        drift={2.6}
      >
        <span aria-hidden className="ml-1 flex h-7 items-end gap-[3px]">
          {[35, 55, 42, 70, 58, 100].map((h, i) => (
            <motion.span
              key={i}
              initial={{ scaleY: 0.2 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1 + i * 0.06, ease }}
              style={{ height: `${h}%` }}
              className={cn("w-1.5 origin-bottom rounded-full", i === 5 ? "bg-primary" : "bg-muted-foreground/25")}
            />
          ))}
        </span>
      </Chip>
    </div>
  );
}
