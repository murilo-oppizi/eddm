"use client"

// shadcn's Slider (base-nova, Base UI), single thumb. A bigger thumb than the default so
// it's easy to grab on touch screens.

import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "cn"

function Slider({
  className,
  getAriaLabel,
  getAriaValueText,
  ...props
}: SliderPrimitive.Root.Props<number> &
  Pick<SliderPrimitive.Thumb.Props, "getAriaLabel" | "getAriaValueText">) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      thumbAlignment="edge"
      className={cn("w-full", className)}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex h-6 w-full touch-none items-center select-none data-disabled:opacity-50">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted select-none"
        >
          <SliderPrimitive.Indicator data-slot="slider-range" className="h-full bg-primary select-none" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          getAriaLabel={getAriaLabel}
          getAriaValueText={getAriaValueText}
          className="relative block size-5 shrink-0 cursor-grab rounded-full border-2 border-primary bg-background shadow-sm ring-ring/40 transition-[box-shadow] select-none after:absolute after:-inset-3 hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden active:cursor-grabbing active:ring-4 data-dragging:cursor-grabbing"
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
