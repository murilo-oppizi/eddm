"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

// The "fade-in-blur" text reveal (as in Motion Primitives' Text Effect and Magic UI's
// Blur Fade): word by word, each comes in from blurred, faint and a little low to sharp,
// once, when the text comes into view. Reduced motion: a plain fade, no blur or movement.

const STAGGER = 0.045; // seconds between words

const word: Variants = {
  hidden: { opacity: 0, filter: "blur(10px)", y: "0.25em" },
  shown: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const still: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.4 } },
};

/** How long a string takes to reveal (to chain several, e.g. a sentence in parts). */
export const blurTextDuration = (text: string) => text.split(/\s+/).filter(Boolean).length * STAGGER;

export function BlurText({
  children,
  as = "span",
  delay = 0,
  className,
}: {
  children: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const words = children.split(/\s+/).filter(Boolean);
  return (
    <Tag
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.6 }}
      transition={{ staggerChildren: STAGGER, delayChildren: delay }}
      className={className}
    >
      {words.map((w, i) => (
        <span key={i}>
          <motion.span variants={reduce ? still : word} className="inline-block">
            {w}
          </motion.span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </Tag>
  );
}

/** The same reveal for a whole block (a card, a paragraph, a photo): blurred to sharp. */
export const blurIn = {
  initial: { opacity: 0, filter: "blur(8px)", y: 14 },
  whileInView: { opacity: 1, filter: "blur(0px)", y: 0 },
};
