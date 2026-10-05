"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

// A dotted globe (WebGL, drawn by cobe: MIT, ~5KB) in the site's colors: grey land dots
// on white, a pink pin in every country Oppizi works in, and pink routes flying out from
// the Brooklyn headquarters to each of them. It turns slowly on its own; drag to spin it;
// `focus` turns it to face a place (the country under the pointer in the list beside it).
// Paused off screen; still, facing the Atlantic, for visitors who prefer reduced motion.

export type Place = { id: string; lat: number; lng: number };

const PINK: [number, number, number] = [239 / 255, 43 / 255, 85 / 255]; // --ds-action-primary
const TILT = 0.3; // the globe's resting tilt (radians), north toward the viewer
const SPIN = 0.0025; // radians a frame, when nothing's in focus

/** The globe's angles (phi round, theta tilt) that put a place in the middle of it. */
const facing = (lat: number, lng: number) => ({
  phi: Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2),
  theta: (lat * Math.PI) / 180,
});

/** The shortest way round from one angle to another. */
const towards = (from: number, to: number) => {
  const d = (to - from) % (2 * Math.PI);
  return d > Math.PI ? d - 2 * Math.PI : d < -Math.PI ? d + 2 * Math.PI : d;
};

export function Globe({
  places,
  hub,
  focus,
  lift = 0,
  className,
}: {
  places: Place[];
  /** Where the routes fly out from */
  hub: Place;
  /** The place to turn to, if any */
  focus: string | null;
  /** How far above the middle (radians) a place in focus sits: for a globe whose lower
   *  half is out of view, so the place lands where it can be seen */
  lift?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const focusRef = useRef(focus);
  const redraw = useRef<() => void>(() => {});
  useEffect(() => {
    focusRef.current = focus;
    redraw.current(); // with reduced motion there's no loop, so turn to it at once
  }, [focus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let size = canvas.offsetWidth;

    // The view: starts on the Atlantic, between the Americas and Europe
    const start = facing(30, -35);
    let phi = start.phi;
    let theta = TILT;
    let drag: { x: number; phi: number } | null = null;
    let momentum = 0;
    // The tilt that shows a place in focus: a little toward the resting tilt, then raised
    const aim = (t: number) => Math.min(1, Math.max(-1.2, t * 0.75 + TILT * 0.25 - lift));

    const markers = () =>
      places.map((p) => ({
        location: [p.lat, p.lng] as [number, number],
        size: p.id === focusRef.current ? 0.09 : p.id === hub.id ? 0.07 : 0.045,
      }));

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi,
      theta,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 0.6, // light mode: higher is darker; above 1 the dots go black
      mapBaseBrightness: 0,
      baseColor: [0.98, 0.98, 1],
      markerColor: PINK,
      glowColor: [1, 0.93, 0.95],
      markers: markers(),
      arcs: places
        .filter((p) => p.id !== hub.id)
        .map((p) => ({ from: [hub.lat, hub.lng] as [number, number], to: [p.lat, p.lng] as [number, number] })),
      arcColor: PINK,
      arcWidth: 0.45,
      arcHeight: 0.25,
      markerElevation: 0.01,
      opacity: 0.9,
    });

    let frame = 0;
    let onScreen = true;
    const draw = () => {
      const target = places.find((p) => p.id === focusRef.current);
      if (drag) {
        // following the pointer (see below)
      } else if (target) {
        const f = facing(target.lat, target.lng);
        phi += towards(phi, f.phi) * 0.08;
        theta += (aim(f.theta) - theta) * 0.08;
      } else {
        phi += SPIN + momentum;
        momentum *= 0.95;
        theta += (TILT - theta) * 0.04;
      }
      globe.update({ phi, theta, markers: markers() });
      if (!still && onScreen) frame = requestAnimationFrame(draw);
    };
    draw();
    redraw.current = () => {
      if (!still) return;
      const target = places.find((p) => p.id === focusRef.current);
      if (target) {
        const f = facing(target.lat, target.lng);
        phi = f.phi;
        theta = aim(f.theta);
      }
      draw();
    };

    // Off screen, stop drawing; back on screen, carry on.
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (onScreen && !still) frame = requestAnimationFrame(draw);
    });
    seen.observe(canvas);

    const resize = new ResizeObserver(() => {
      size = canvas.offsetWidth;
      globe.update({ width: size * dpr, height: size * dpr });
      if (still) draw();
    });
    resize.observe(canvas);

    // Drag to spin; let go with a flick and it glides on.
    let lastX = 0;
    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, phi };
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      phi = drag.phi + ((e.clientX - drag.x) / size) * Math.PI;
      momentum = ((e.clientX - lastX) / size) * Math.PI * 0.5;
      lastX = e.clientX;
      if (still) draw();
    };
    const up = () => {
      drag = null;
      canvas.style.cursor = "";
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);

    // Fade in once it has drawn its first frame
    requestAnimationFrame(() => (canvas.style.opacity = "1"));

    return () => {
      redraw.current = () => {};
      cancelAnimationFrame(frame);
      seen.disconnect();
      resize.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      globe.destroy();
    };
  }, [places, hub, lift]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`aspect-square w-full cursor-grab touch-pan-y opacity-0 transition-opacity duration-700 ${className ?? ""}`}
    />
  );
}
