/**
 * Countries: a globe built of fifteen thin slices of latitude on a stand, like
 * a contour model, and a pin standing out of it for the city of every country
 * Oppizi works in. At rest it faces the Atlantic, the Americas and Europe in
 * view, the pins short, London's bright. Move the pointer across and the globe
 * turns with it, on a spring, the pins riding round; the pins near the pointer
 * stand out further, each on its own spring, and the nearest is bright and
 * named. A pin round the back is not drawn. The slider is the pins' reach.
 */
const {
  Cam, fit, proj, facing, prism, circ, clamp, seg,
  spring, stepS, mk, solid, put, register, pointer, disposer,
} = HL;

const R = 54, BANDS = 15, GAP = 0.9, FOOT = 7, STEM = 9, TURN = 2.2, SWING = 0.9, SHORT = 6, LONG = 34;
const CITIES = [
  ["new york", 40.7, -73.9], ["toronto", 43.7, -79.4], ["são paulo", -23.5, -46.6], ["buenos aires", -34.6, -58.4],
  ["london", 51.5, -0.1], ["paris", 48.9, 2.4], ["berlin", 52.5, 13.4], ["madrid", 40.4, -3.7], ["lisbon", 38.7, -9.1],
  ["amsterdam", 52.4, 4.9], ["brussels", 50.9, 4.4], ["warsaw", 52.2, 21], ["sydney", -33.9, 151.2], ["auckland", -36.8, 174.8],
];
const rad = (d) => (d * Math.PI) / 180;
const edge = (k) => -90 + (180 / BANDS) * k;
const Z0 = FOOT + STEM, CZ = Z0 + R;
// toward you: the camera's azimuth 45°, elevation 30°
const VIEW = [0.612, 0.612, 0.5];
const falloff = (u) => (u <= 0.4 ? 1 - (u / 0.4) * 0.6 : u <= 1 ? 0.4 - ((u - 0.4) / 0.6) * 0.4 : 0);
const circlePath = ([x, y], r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let REACH = value;
  const C = Cam(45, 0.5, 1.6);
  fit(C, [[-R, -R, CZ], [R, R, CZ], [R, -R, CZ], [-R, R, CZ], [0, 0, CZ + R + LONG + 8], [0, 0, 0], [24, 24, 0]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the stand, then the slices south to north, each painted after the one under it
  put(solid(g), prism(P, front, circ(24, 40), circ(22.4, 40), 0, FOOT));
  mk("path", { d: seg(P(0, 0, FOOT), P(0, 0, Z0)), class: "nf" }, g);
  for (let k = 0; k < BANDS; k++) {
    const a = edge(k), b = edge(k + 1), r = Math.max(2.5, R * Math.cos(rad((a + b) / 2)));
    const lo = CZ + R * Math.sin(rad(a)) + GAP / 2, hi = CZ + R * Math.sin(rad(b)) - GAP / 2;
    put(solid(g), prism(P, front, circ(r, 56), circ(Math.max(0.3, r - 1.4), 56), lo, hi));
  }

  // the pins, over the globe: a stem out of its surface and a round head
  const pins = CITIES.map(([name, lat, lon]) => {
    const grp = mk("g", {}, g);
    return { name, lat: rad(lat), lon: rad(lon), grp, stem: mk("path", { class: "nf" }, grp), head: mk("path", {}, grp), sp: spring(SHORT, { eps: 0.02 }) };
  });
  const rot = spring(TURN, { eps: 0.0005 });

  /** Where a pin stands with the globe turned by t: its foot and tip on screen, and whether it faces you. */
  const at = (p, t, len) => {
    const th = p.lon + t, n = [Math.cos(p.lat) * Math.cos(th), Math.cos(p.lat) * Math.sin(th), Math.sin(p.lat)];
    // a marker stands upright from its city, as isometric pins do
    const x = n[0] * R, y = n[1] * R, z = CZ + n[2] * R;
    return { foot: P(x, y, z), tip: P(x, y, z + len), seen: n[0] * VIEW[0] + n[1] * VIEW[1] + n[2] * VIEW[2] > 0.08 };
  };
  let drawn = "";
  function draw() {
    const key = rot.x + pins.map((p) => p.sp.x).join();
    if (key === drawn) return;
    drawn = key;
    // far to near, so a nearer pin's head covers a farther one's
    const order = pins.map((p) => ({ p, q: at(p, rot.x, p.sp.x) })).sort((a, b) => a.q.foot[1] - b.q.foot[1]);
    for (const { p, q } of order) {
      if (q.seen) g.appendChild(p.grp);
      // a pin round the back is taken out of the drawing, and put back when it comes round
      else if (p.grp.isConnected) p.grp.remove();
      p.stem.setAttribute("d", seg(q.foot, q.tip));
      p.head.setAttribute("d", circlePath([q.tip[0], q.tip[1] - 3.2], 3.4));
    }
  }
  draw();

  const B = register(stage, (dt) => {
    let m = stepS(rot, dt);
    for (const p of pins) if (stepS(p.sp, dt)) m = true;
    draw();
    return m;
  });
  bag.add(B.unregister);

  let lit = null;
  function light(p) {
    if (p === lit) return;
    if (lit) { lit.head.classList.remove("hi"); lit.stem.classList.remove("hi"); }
    lit = p;
    lit.head.classList.add("hi");
    lit.stem.classList.add("hi");
  }
  const home = pins.find((p) => p.name === "london");
  light(home);

  const [left] = P(-R, R, CZ), [right] = P(R, -R, CZ);
  bag.add(pointer(stage, {
    move: ([sx, sy]) => {
      rot.t = TURN + (0.5 - clamp((sx - left) / (right - left), 0, 1)) * 2 * SWING;
      // judged where the turn is headed, never where it is on screen
      let best = null, bd = Infinity;
      for (const p of pins) {
        const q = at(p, rot.t, SHORT), d = Math.hypot(q.foot[0] - sx, q.foot[1] - sy);
        p.sp.t = q.seen ? SHORT + (LONG - SHORT) * falloff(d / REACH) : SHORT;
        if (q.seen && d < bd) { bd = d; best = p; }
      }
      if (best) { light(best); read.textContent = best.name; }
      B.wake();
    },
    leave: () => {
      rot.t = TURN;
      for (const p of pins) p.sp.t = SHORT;
      light(home);
      read.textContent = "rest";
      B.wake();
    },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { REACH = v; }, destroy: bag.dispose };
}

hairline({
  name: "countries",
  means: "A globe of thin slices with a pin for every market: the pointer turns it, and the pins near it stand out.",
  rules: [1, 3, 5, 9],
  range: [60, 95, 140],
  mount,
});
