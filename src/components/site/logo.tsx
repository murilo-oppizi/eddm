import Link from "next/link";

import { site } from "@/content/site";
import { cn } from "@/lib/utils";

/** The Oppizi symbol's two shapes, in a 24×24 box (Figma: Oppizi Component Library ›
 *  Oppizi Symbol). Also used by the generated app icon and share image. */
export const OPPIZI_SYMBOL_PATHS = [
  "M10.8188 11.6186C10.8188 11.6186 10.8723 15.0633 7.88166 15.2156C4.89152 15.3669 3.02171 12.5812 3.02171 12.5812C3.02171 12.5812 10.4452 11.8725 10.8188 11.6186Z",
  "M20.9345 7.5C20.9345 7.5 14.0739 7.84188 11.0589 7.5C11.0589 7.5 13.4504 14.1624 8.92805 16.0978C8.92805 16.0978 11.631 16.4403 13.9703 16.0978C16.3091 15.7559 21.5071 14.4472 20.9345 7.5Z",
];

/**
 * The Oppizi symbol, drawn in currentColor. `cropped` trims the 24×24 icon box to the
 * artwork, for use next to text.
 */
export function OppiziSymbol({ className, cropped = false }: { className?: string; cropped?: boolean }) {
  return (
    <svg viewBox={cropped ? "2.6 7.1 18.8 9.6" : "0 0 24 24"} fill="currentColor" aria-hidden className={className}>
      {OPPIZI_SYMBOL_PATHS.map((d) => (
        <path key={d} fillRule="evenodd" clipRule="evenodd" d={d} />
      ))}
    </svg>
  );
}

/** EDDM, powered by Oppizi: the pink symbol, "EDDM", a hairline, then the endorsement. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${site.name}, powered by Oppizi — home`}
      className={cn("flex items-center gap-2 font-heading", className)}
    >
      <OppiziSymbol cropped className="h-4 w-auto text-brand" />
      <span className="text-xl leading-none font-bold tracking-tight">{site.name}</span>
      <span aria-hidden className="h-4 w-px bg-border" />
      <span className="text-xs leading-none font-medium text-brand">powered by Oppizi</span>
    </Link>
  );
}
