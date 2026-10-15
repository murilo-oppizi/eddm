import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const list = window.matchMedia(QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

/**
 * Whether the visitor asked for less motion. Unlike motion's useReducedMotion, it says
 * false on the server and while the page hydrates, so a component that renders something
 * different for reduced motion doesn't disagree with the HTML the server sent (a
 * hydration error); React then re-renders it with the visitor's real setting, and again
 * if they change it.
 */
export function useReducedMotionSafe() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
