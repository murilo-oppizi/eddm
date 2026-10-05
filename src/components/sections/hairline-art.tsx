"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

// The About page's line drawings, made with Hairline (github.com/lucasmarkes/hairline): an
// isometric object in one thin stroke that answers the pointer, its one bright line in the
// brand pink. The figures live in hairline/*.js and are bundled, with Hairline's engine, by
// scripts/build-hairline.mjs; the engine is loaded only in the browser, when one is shown.

export type HairlineName = "agents" | "attention" | "scans" | "quality" | "flyers" | "countries" | "channels" | "agent";

type Figure = {
  range: [number, number, number];
  mount: (host: { stage: HTMLElement; svg: SVGSVGElement; read: { textContent: string } }, value: number) => { destroy: () => void };
};

export function HairlineArt({ name, label, className }: { name: HairlineName; label?: string; className?: string }) {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    let gone = false, svg: SVGSVGElement | undefined, handle: { destroy: () => void } | undefined;
    import("./hairline.generated.js").then(({ HL, figures }) => {
      if (gone || !el) return;
      HL.inject(document);
      const figure = (figures as Record<string, Figure>)[name];
      svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, el) as SVGSVGElement;
      // the figure names what's under the pointer here; the page has its own words for it
      handle = figure.mount({ stage: el, svg, read: { textContent: "" } }, figure.range[1]);
    });
    return () => {
      gone = true;
      handle?.destroy();
      svg?.remove();
    };
  }, [name]);

  return <div ref={stage} data-hairline={name} role="img" aria-label={label} className={cn("w-full", className)} />;
}
