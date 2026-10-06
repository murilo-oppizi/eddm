/**
 * Countries: a plaza of flags on a podium of three steps, one flag for each
 * country Oppizi works in, a step for each stage of its growth: Australia and
 * New Zealand on the low front step, where it began; Europe's eight on the
 * middle one; the Americas' four on the high back step. The poles stand taller
 * toward the back, and the United States, the newest home, is bright. The
 * pointer is put on the steps, and the poles near it grow taller, each on its
 * own spring, raising their flags; the nearest is bright and named. The slider
 * is the reach.
 *
 * Built on Terrain's pattern: a field, springs, a falloff by distance; the
 * steps stand at different heights, so the pointer is put on each pole's own
 * step to find how near it is.
 */
const {
  Cam, fit, proj, facing, unproj, prism, rings, circ, poly, seg,
  spring, stepS, mk, solid, put, register, pointer, disposer,
} = HL;

const W = 176, D = 30, FW = 16, FH = 11, GROW = 26, PB = 4;
// the steps, back to front: [height, countries as [name, height of pole at rest]]
const STEPS = [
  [18, [["united states", 30], ["canada", 26], ["brazil", 24], ["argentina", 21]]],
  [11, [["united kingdom", 24], ["france", 22], ["germany", 25], ["spain", 20], ["portugal", 18], ["netherlands", 21], ["belgium", 19], ["poland", 23]]],
  [4, [["australia", 20], ["new zealand", 17]]],
];

const falloff = (u) => (u <= 0.4 ? 1 - (u / 0.4) * 0.65 : u <= 1 ? 0.35 - ((u - 0.4) / 0.6) * 0.3 : 0.05);
const shift = (ring, x, y) => ring.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value;
  const C = Cam(45, 0.5, 1.46);
  fit(C, [[-6, -6, -PB], [W + 6, 3 * D + 6, -PB], [W + 6, -6, -PB], [-6, 3 * D + 6, -PB], [0, D / 2, 18 + 30 + GROW + 2], [W - 10, D / 2, 18 + 30 + 2]], 200, 172);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const poles = [];
  const [br, bi] = rings(-6, -6, W + 6, 3 * D + 6, 8, 2);
  put(solid(g), prism(P, front, br, bi, -PB, 0));

  STEPS.forEach(([h, list], s) => {
    // the step itself, then its poles, far (left) to near (right)
    // tight corners, so the three read as one podium on its base
    const [r, i] = rings(0, s * D, W, (s + 1) * D, 1.6, 1.2);
    put(solid(g), prism(P, front, r, i, 0, h));
    const gap = W / list.length;
    list.forEach(([name, h0], k) => {
      const x = gap * (k + 0.5) - FW / 2, y = s * D + D / 2;
      const foot = solid(g);
      put(foot, prism(P, front, shift(circ(2.8, 16), x, y), shift(circ(2, 16), x, y), h, h + 1.2));
      poles.push({ name, x, y, base: h + 1.2, h0, sp: spring(h0, { eps: 0.03 }), pole: solid(g), ball: mk("path", {}, g), flag: mk("path", { class: "sil" }, g), stripe: mk("path", { class: "nf lo" }, g), drawn: NaN });
    });
  });

  /** A flag hanging from the pole's top, in the upright plane through it, with a gentle wave. */
  function flagAt(p, top) {
    const wave = (u) => Math.sin((u / FW) * Math.PI * 1.4) * 1.1;
    const pts = [];
    for (let u = 0; u <= FW; u += 1) pts.push(P(p.x + u, p.y, top - 1 + wave(u)));
    for (let u = FW; u >= 0; u -= 1) pts.push(P(p.x + u, p.y, top - 1 - FH + wave(u)));
    const mid = [];
    for (let u = 0; u <= FW; u += 1) mid.push(P(p.x + u, p.y, top - 1 - FH / 2 + wave(u)));
    return [poly(pts), mid];
  }
  function draw(p) {
    const len = p.sp.x;
    if (len === p.drawn) return;
    p.drawn = len;
    const top = p.base + len;
    put(p.pole, prism(P, front, shift(circ(0.9, 12), p.x, p.y), shift(circ(0.5, 12), p.x, p.y), p.base, top));
    const [bx, by] = P(p.x, p.y, top + 1.4);
    p.ball.setAttribute("d", `M${bx - 1.6} ${by}a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0`);
    const [d, mid] = flagAt(p, top);
    p.flag.setAttribute("d", d);
    p.stripe.setAttribute("d", seg(mid[1], mid[Math.floor(mid.length / 2)]) + seg(mid[Math.floor(mid.length / 2) + 1], mid[mid.length - 2]));
  }
  poles.forEach(draw);

  const B = register(stage, (dt) => {
    let m = false;
    for (const p of poles) { if (stepS(p.sp, dt)) m = true; draw(p); }
    return m;
  });
  bag.add(B.unregister);

  const home = poles[0];
  let lit = null;
  function light(p) {
    if (p === lit) return;
    if (lit) lit.flag.classList.remove("hi");
    lit = p;
    lit.flag.classList.add("hi");
  }
  light(home);

  function aim(pt) {
    if (!pt) {
      for (const p of poles) p.sp.t = p.h0;
      light(home);
      read.textContent = "rest";
    } else {
      let near = poles[0], best = Infinity;
      for (const p of poles) {
        // the pointer, put on this pole's own step
        const [x, y] = unproj(C, pt[0], pt[1], p.base);
        const d = Math.hypot(x - p.x, y - p.y);
        p.sp.t = p.h0 + GROW * falloff(d / R);
        if (d < best) { best = d; near = p; }
      }
      light(near);
      read.textContent = near.name;
    }
    B.wake();
  }
  bag.add(pointer(stage, { move: aim, leave: () => aim(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { R = v; }, destroy: bag.dispose };
}

hairline({
  name: "countries",
  means: "A podium of flags, a step for each stage of growth: the poles near the pointer grow taller, and the nearest is named.",
  rules: [1, 3, 5, 9],
  range: [30, 50, 75],
  mount,
});
