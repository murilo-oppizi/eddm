import { OppiziSymbol } from "@/components/site/logo";
import type { Stamp } from "@/lib/quote-stamp";

/**
 * The stamp the price meter prints: perforated paper with the estimate in pink "meter ink",
 * the classic wavy cancellation lines and the day it was printed.
 */
export function PrintedStamp({ total, homes, size, date }: Stamp) {
  return (
    <div className="stamp-perforated h-[120px] w-[168px] bg-white">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[2px] border border-primary/60 px-2.5 pt-2 pb-1.5 text-primary">
        <span className="flex items-center gap-1 text-[8px] leading-none font-bold tracking-[0.12em] uppercase">
          <OppiziSymbol cropped className="h-[7px] w-auto" />
          EDDM · Estimate
        </span>
        {/* Cancellation waves, behind the figure */}
        <svg viewBox="0 0 60 30" className="absolute top-[26px] -right-1 w-[70px] opacity-35" fill="none" stroke="currentColor" strokeWidth="1.4">
          {[4, 11, 18, 25].map((y) => (
            <path key={y} d={`M0 ${y} q 7.5 -4 15 0 t 15 0 t 15 0 t 15 0`} />
          ))}
        </svg>
        <p className="relative mt-auto font-heading text-[26px] leading-none font-bold tracking-tight tabular-nums">{total}</p>
        <p className="relative mt-1 text-[10px] leading-none font-semibold">
          {homes} homes · {size}
        </p>
        <p className="mt-2 border-t border-dashed border-primary/40 pt-1 text-[7.5px] leading-none font-semibold tracking-[0.12em] opacity-80">
          {date}
        </p>
      </div>
    </div>
  );
}
