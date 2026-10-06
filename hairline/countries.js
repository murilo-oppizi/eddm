/**
 * Growing: a bar chart on a rounded plinth, six years from the first running
 * away to the right, each bar taller than the last. At rest the whole chart is grown and today's bar is bright. The
 * pointer is time: the bars up to the year under it stand grown, the years
 * after it fall back to stubs, each on its own spring, so moving left to right
 * grows the chart again; the year at the pointer is bright. A year is picked
 * by what you see: a bar's outline where it is headed, then its outline grown,
 * nearest first, then the slot on the plinth under the pointer; nothing
 * outside the chart picks anything. The slider is the tallest bar.
 */
const {
  Cam, fit, proj, facing, unproj, prism, rings, rrect, ringAt, hull, clamp, seg,
  spring, stepS, mk, solid, put, register, pointer, disposer,
} = HL;

const N = 6, SP = 26, FOOT = 15, STUB = 2.5, PB = 5;
// the years run away from you to the right (along -y), so the chart climbs up the screen
const EY = N * SP, X0 = -12, X1 = 22;
const yAt = (i) => -(i + 0.5) * SP;
// the share of the tallest bar each year reaches: growth that gathers pace
const SHARE = Array.from({ length: N }, (_, i) => 0.14 + 0.86 * Math.pow(i / (N - 1), 1.7));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let HMAX = value;
  const C = Cam(45, 0.5, 1.62);
  fit(C, [[X0, 8, -PB], [X1, -EY - 8, -PB], [X1, 8, -PB], [X0, -EY - 8, -PB], [5, yAt(N - 1), 76], [5, yAt(0), 20]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the plinth, a baseline and a tick under each year
  // a large round: its corners built with more steps, so they don't show facets
  const pr = rrect(X0, -EY - 8, X1, 8, 8, 12), pi = rrect(X0 + 2.2, -EY - 5.8, X1 - 2.2, 5.8, 5.8, 12);
  put(solid(g), prism(P, front, pr, pi, -PB, 0));
  mk("path", { d: seg(P(X1 - 6, 0, 0), P(X1 - 6, -EY, 0)) + Array.from({ length: N }, (_, i) => seg(P(X1 - 6, yAt(i), 0), P(X1 - 3, yAt(i), 0))).join(""), class: "nf lo" }, g);

  // the bars: today's is the farthest, so they're made from the last year back to the first
  const bars = SHARE.map((share, i) => {
    const cy = yAt(i), x0 = 5 - FOOT / 2, y0 = cy - FOOT / 2;
    const [ring, inner] = rings(x0, y0, x0 + FOOT, y0 + FOOT, 3, 1.1);
    return { i, cy, share, ring, inner, sp: spring(share * HMAX, { eps: 0.03 }), drawn: NaN };
  });
  for (let i = N - 1; i >= 0; i--) bars[i].el = solid(g);
  function draw() {
    for (const b of bars) {
      const h = Math.max(STUB, b.sp.x);
      if (h !== b.drawn) { b.drawn = h; put(b.el, prism(P, front, b.ring, b.inner, 0, h)); }
    }
  }
  draw();

  const B = register(stage, (dt) => {
    let m = false;
    for (const b of bars) if (stepS(b.sp, dt)) m = true;
    draw();
    return m;
  });
  bag.add(B.unregister);

  let lit = null;
  function light(i) {
    // the chosen bar is bright all over: its outline, and its top's inner edge, which is dim
    // otherwise (the two classes can't both be on it: the dim one would win)
    if (lit !== null) { bars[lit].el.sil.classList.remove("hi"); bars[lit].el.cr.classList.replace("hi", "lo"); }
    lit = i;
    bars[i].el.sil.classList.add("hi");
    bars[i].el.cr.classList.replace("lo", "hi");
  }
  light(N - 1);

  const inside = ([x, y], pts) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const outline = (b, h) => hull(ringAt(P, b.ring, 0).concat(ringAt(P, b.ring, Math.max(STUB, h))));
  const plinth = hull(ringAt(P, pr, -PB).concat(ringAt(P, pr, 0)));
  /** The year under the pointer, by what is drawn there (nearest first), or null. */
  function hit(pt) {
    for (const b of bars) if (inside(pt, outline(b, b.sp.t))) return b.i;
    for (const b of bars) if (inside(pt, outline(b, b.share * HMAX))) return b.i;
    if (inside(pt, plinth)) return clamp(Math.floor(-unproj(C, pt[0], pt[1], 0)[1] / SP), 0, N - 1);
    return null;
  }
  function aim(i) {
    for (const b of bars) b.sp.t = i === null || b.i <= i ? b.share * HMAX : STUB;
    light(i === null ? N - 1 : i);
    read.textContent = i === null ? "rest" : `year ${i + 1}`;
    B.wake();
  }
  bag.add(pointer(stage, {
    // the year under the pointer, read off the ground, which never moves
    move: (p) => aim(hit(p)),
    leave: () => aim(null),
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { HMAX = v; for (const b of bars) if (b.sp.t > STUB) b.sp.t = b.share * HMAX; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "countries",
  means: "A bar chart of six years, growing: the pointer is time, and the years after it fall back until you move on.",
  rules: [1, 3, 5, 9],
  range: [52, 66, 76],
  mount,
});
