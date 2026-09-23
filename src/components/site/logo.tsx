import Link from "next/link";

import { site } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * The Oppizi symbol (Figma: Oppizi Component Library › Oppizi Symbol), drawn in
 * currentColor. `cropped` trims the 24×24 icon box to the artwork, for use next to text.
 */
export function OppiziSymbol({ className, cropped = false }: { className?: string; cropped?: boolean }) {
  return (
    <svg viewBox={cropped ? "2.6 7.1 18.8 9.6" : "0 0 24 24"} fill="currentColor" aria-hidden className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.8188 11.6186C10.8188 11.6186 10.8723 15.0633 7.88166 15.2156C4.89152 15.3669 3.02171 12.5812 3.02171 12.5812C3.02171 12.5812 10.4452 11.8725 10.8188 11.6186Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.9345 7.5C20.9345 7.5 14.0739 7.84188 11.0589 7.5C11.0589 7.5 13.4504 14.1624 8.92805 16.0978C8.92805 16.0978 11.631 16.4403 13.9703 16.0978C16.3091 15.7559 21.5071 14.4472 20.9345 7.5Z"
      />
    </svg>
  );
}

export type LogoVariant = "tile" | "inline" | "endorsed";

/**
 * EDDM, powered by Oppizi. Three lockups to choose from (compare them at /logos):
 * - tile: the symbol on a pink tile, "EDDM" stacked over "powered by Oppizi"
 * - inline: the bare pink symbol, "EDDM" | "powered by Oppizi" on one line
 * - endorsed: "EDDM" leads on its own; the symbol sits in the "powered by" line
 */
export function Logo({ variant = "tile", className }: { variant?: LogoVariant; className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${site.name}, powered by Oppizi — home`}
      className={cn("flex items-center font-heading", className)}
    >
      {variant === "tile" && (
        <span className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-brand text-brand-foreground">
            <OppiziSymbol className="size-7" />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-lg leading-none font-bold tracking-tight">{site.name}</span>
            <span className="text-[11px] leading-none font-medium text-brand">powered by Oppizi</span>
          </span>
        </span>
      )}

      {variant === "inline" && (
        <span className="flex items-center gap-2">
          <OppiziSymbol cropped className="h-4 w-auto text-brand" />
          <span className="text-xl leading-none font-bold tracking-tight">{site.name}</span>
          <span aria-hidden className="h-4 w-px bg-border" />
          <span className="text-xs leading-none font-medium text-brand">powered by Oppizi</span>
        </span>
      )}

      {variant === "endorsed" && (
        <span className="flex flex-col gap-1">
          <span className="text-2xl leading-none font-extrabold tracking-tight">{site.name}</span>
          <span className="flex items-center gap-1 text-[11px] leading-none font-medium text-brand">
            powered by
            <OppiziSymbol cropped className="h-2 w-auto text-brand" />
            <span className="font-semibold">Oppizi</span>
          </span>
        </span>
      )}
    </Link>
  );
}
