// The stamp the price meter prints, shared with the "Ready to reach every door?" card,
// where it lands. Lives for the visit (until a reload).

export type Stamp = { total: string; homes: string; size: string; date: string };

/** The stamp's printed size in px. Its perforation needs multiples of 12. */
export const STAMP_W = 168;
export const STAMP_H = 120;
/** How far the stamp sits tilted once it's on the card. */
export const STAMP_TILT = 5;
/** The element on the card the stamp flies to. */
export const STAMP_SPOT_ID = "quote-stamp-spot";

let current: Stamp | null = null;
const listeners = new Set<() => void>();

export const getStamp = () => current;
export const subscribeStamp = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
export function placeStamp(stamp: Stamp) {
  current = stamp;
  listeners.forEach((cb) => cb());
}
