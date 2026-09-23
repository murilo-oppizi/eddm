"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useScroll, useTransform } from "motion/react";

/**
 * 0 → 1 as the visitor scrolls past `ref`. Starts at 0 on page load even when the
 * element is already on screen (desktop hero), and only once it comes into view on
 * mobile, where hero visuals sit below the headline. Finishes after ~70% of the
 * element's height so the end state is still visible before the header covers it.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>) {
  const { scrollY } = useScroll();
  const range = useRef({ start: 0, length: 420 });

  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const start = Math.max(0, top + rect.height / 2 - window.innerHeight * 0.6);
      range.current = { start, length: Math.max(220, rect.height * 0.7) };
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [ref]);

  return useTransform(scrollY, (y) => {
    const { start, length } = range.current;
    return Math.min(1, Math.max(0, (y - start) / length));
  });
}
