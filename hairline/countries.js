/**
 * Countries: a paper map folded in four, a dashed route across it from Sydney
 * out to the rest of the world, and a marker over each city it reached. At
 * rest the markers float at uneven heights, Sydney's the highest and bright.
 * The pointer is put on the map, and each marker rises with its nearness to
 * it, on its own spring; the nearest goes bright and is read out. The slider
 * is the reach, in map units.
 */
const {
  Cam, fit, proj, unproj, fillet, poly, open, clamp, lerp, spring, stepS,
  mk, flatDot, place, register, pointer, disposer,
} = HL;

const PW = 35, MD = 84, F = 8, H = 7, LIFT = 22, TK = 1.4;
const FOLDS = [0, F, 0, F, 0];
const CITIES = [
  ["sydney", 124, 62, 12], ["new york", 20, 30, 3], ["são paulo", 40, 64, 0],
  ["lisbon", 58, 42, 6], ["london", 64, 16, 1], ["berlin", 92, 24, 8],
];
const ROUTE = [0, 5, 4, 3, 1, 2];

/** The map's height at x: four panels, folded up and down. */
const zAt = (x) => {
  const k = clamp(Math.floor(x / PW), 0, 3), t = (x - k * PW) / PW;
  return lerp(FOLDS[k], FOLDS[k + 1], t);
};

const falloff = (u) => (u <= 0.4 ? 1 - u * 0.75 : u <= 1 ? 0.7 - ((u - 0.4) / 0.6) * 0.62 : 0.08);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value;
  const C = Cam(45, 0.5, 1.86);
  fit(C, [[0, 0, -TK], [4 * PW, MD, -TK], [4 * PW, 0, 0], [0, MD, 0], [124, 62, H + 8 + LIFT], [20, 30, H + 8 + LIFT]], 200, 160);
  const P = proj(C), S = (x, y, dz = 0) => P(x, y, zAt(x) + dz);
  const g = mk("g", {}, svg);

  // the panels, far to near: each its underside first (the paper's thickness), then its face
  for (let k = 0; k < 4; k++) {
    const x0 = k * PW, x1 = x0 + PW, z0 = FOLDS[k], z1 = FOLDS[k + 1];
    const quad = (dz) => [P(x0, 0, z0 + dz), P(x1, 0, z1 + dz), P(x1, MD, z1 + dz), P(x0, MD, z0 + dz)];
    // only the map's own four corners are rounded; the folds stay creased
    const r = [k === 0 ? 4 : 0.4, k === 3 ? 4 : 0.4, k === 3 ? 4 : 0.4, k === 0 ? 4 : 0.4];
    mk("path", { d: poly(fillet(quad(-TK), r)), class: "lo" }, g);
    mk("path", { d: poly(fillet(quad(0), r)), class: "sil" }, g);
  }
  // what's printed on it: a coastline and two roads, following the folds
  const line = (fn, n = 48) => open(Array.from({ length: n + 1 }, (_, i) => fn(i / n)));
  mk("path", { d: line((t) => S(4 + t * 132, 50 + 12 * Math.sin(t * 9) + 6 * Math.sin(t * 23))) + line((t) => S(4 + t * 132, 8 + t * 20)) + line((t) => S(70 + 4 * Math.sin(t * 6), 4 + t * 76)), class: "nf lo" }, g);
  // the route, city to city
  const pts = [];
  ROUTE.slice(1).forEach((b, i) => {
    const [, ax, ay] = CITIES[ROUTE[i]], [, bx, by] = CITIES[b];
    for (let s = 0; s <= 16; s++) pts.push(S(lerp(ax, bx, s / 16), lerp(ay, by, s / 16), 0.2));
  });
  mk("path", { d: open(pts), class: "nf dash" }, g);

  // the markers, far to near
  const marks = CITIES.map(([name, x, y, h0], i) => ({ i, name, x, y, h0, sp: spring(h0, { eps: 0.03 }), drawn: NaN }))
    .sort((a, b) => a.x + a.y - (b.x + b.y))
    .map((m) => {
      m.foot = flatDot(g, C, 1.6, "dot off");
      place(m.foot, S(m.x, m.y));
      m.stem = mk("path", { class: "nf lo" }, g);
      m.head = mk("path", {}, g);
      m.hole = mk("path", { class: "nf" }, g);
      return m;
    });

  /** A marker facing you: a round head drawn to a point, in screen units, its point at [px, py]. */
  function drop(px, py) {
    const r = 8.5, cy = py - r * 2.1, a = Math.acos(r / (r * 2.1)), pts = [[px, py]];
    for (let s = 0; s <= 24; s++) {
      const t = Math.PI / 2 + a + (s / 24) * (2 * Math.PI - 2 * a);
      pts.push([px + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
    const hole = [];
    for (let s = 0; s < 16; s++) hole.push([px + 3.2 * Math.cos(s * 0.3927), cy + 3.2 * Math.sin(s * 0.3927)]);
    return [poly(fillet(pts, pts.map((_, k) => (k === 0 ? 1.2 : 0)))), poly(hole)];
  }
  function draw(m) {
    const h = m.sp.x;
    if (h === m.drawn) return;
    m.drawn = h;
    const [px, py] = S(m.x, m.y, H + h), [fx, fy] = S(m.x, m.y);
    const [head, hole] = drop(px, py);
    m.head.setAttribute("d", head);
    m.hole.setAttribute("d", hole);
    m.stem.setAttribute("d", open([[fx, fy], [px, py]]));
  }
  marks.forEach(draw);

  const B = register(stage, (dt) => {
    let moving = false;
    for (const m of marks) { if (stepS(m.sp, dt)) moving = true; draw(m); }
    return moving;
  });
  bag.add(B.unregister);

  let lit = null;
  function light(m) {
    if (m === lit) return;
    if (lit) { lit.head.classList.remove("hi"); lit.foot.setAttribute("class", "dot off"); }
    lit = m;
    lit.head.classList.add("hi");
    lit.foot.setAttribute("class", "dot m");
  }
  const sydney = marks.find((m) => m.i === 0);
  light(sydney);

  function aim(at) {
    if (!at) {
      for (const m of marks) m.sp.t = m.h0;
      light(sydney);
      read.textContent = "rest";
    } else {
      let near = marks[0], best = Infinity;
      for (const m of marks) {
        const d = Math.hypot(m.x - at[0], m.y - at[1]);
        m.sp.t = LIFT * falloff(d / R);
        if (d < best) { best = d; near = m; }
      }
      light(near);
      read.textContent = near.name;
    }
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => aim(unproj(C, p[0], p[1], F / 2)), leave: () => aim(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { R = v; }, destroy: bag.dispose };
}

hairline({
  name: "countries",
  means: "A folded map with a marker on every city the route reached: the markers near the pointer rise, and the nearest is named.",
  rules: [1, 3, 5, 10],
  range: [24, 40, 60],
  mount,
});
