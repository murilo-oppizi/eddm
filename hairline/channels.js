/**
 * Channels: one carousel, like a baggage belt, an open loop round a sunken
 * floor, and the three channels riding it: letters, parcels and stacks of flyers, always
 * going round. Hovering slows the belt, on a spring, so one can be read; the
 * one nearest the pointer takes the bright stroke and is named. At rest the
 * one passing the front is bright. The slider is the belt's speed.
 *
 * Built on Slow's pattern: an ambient loop that keeps moving, and a spring on
 * its rate that the pointer pulls down.
 */
const {
  Cam, fit, proj, facing, unproj, prism, rrect, run, poly, open, seg,
  spring, stepS, mk, solid, put, register, pointer, disposer,
} = HL;

const A = 42, RC = 27, BAND = 12, N = 6, PB = 6, SINK = 2;
const NAMES = ["mail", "inserts", "flyers"];
const LOOP = 4 * A + 2 * Math.PI * RC;
const stadium = (half) => rrect(-A - half, -half, A + half, half, half, 14);

/** The belt's middle line at s along it: [x, y, heading]. */
function along(s) {
  s = ((s % LOOP) + LOOP) % LOOP;
  const arc = Math.PI * RC;
  if (s < 2 * A) return [-A + s, -RC, 0];
  s -= 2 * A;
  if (s < arc) { const t = -Math.PI / 2 + s / RC; return [A + RC * Math.cos(t), RC * Math.sin(t), t + Math.PI / 2]; }
  s -= arc;
  if (s < 2 * A) return [A - s, RC, Math.PI];
  s -= 2 * A;
  const t = Math.PI / 2 + s / RC;
  return [-A + RC * Math.cos(t), RC * Math.sin(t), t + Math.PI / 2];
}
/** A ring turned by a and moved to (x, y); its normals turn with it. */
const place2 = (ring, a, x, y) => {
  const c = Math.cos(a), s = Math.sin(a);
  return ring.map((q) => ({ u: x + q.u * c - q.v * s, v: y + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c }));
};

// each kind of thing, in its own frame (x along the belt): its solids, and its marks as [x, y, z] polylines
const KINDS = [
  { // a letter: its flap and its stamp
    parts: [[rrect(-11, -7.5, 11, 7.5, 1.4, 3), 0, 1.6]],
    marks: [[[-10, -6.5, 1.6], [0, 1, 1.6], [10, -6.5, 1.6]], [[5, 2.5, 1.6], [9, 2.5, 1.6], [9, 6, 1.6], [5, 6, 1.6], [5, 2.5, 1.6]]],
  },
  { // a parcel, taped
    parts: [[rrect(-9, -8, 9, 8, 2.4, 4), 0, 14]],
    marks: [[[-9, -1.6, 14], [9, -1.6, 14]], [[-9, 1.6, 14], [9, 1.6, 14]]],
  },
  { // three flyers, a little uneven, the top one printed
    parts: [[rrect(-8.6, -11, 8.6, 11, 1, 3), 0, 1], [rrect(-8, -11.4, 9.2, 10.6, 1, 3), 1.6, 2.6], [rrect(-8.4, -10.8, 8.8, 11.2, 1, 3), 3.2, 4.2]],
    marks: [[[-6, -8.4, 4.2], [6.4, -8.4, 4.2], [6.4, 0, 4.2], [-6, 0, 4.2], [-6, -8.4, 4.2]], [[-6, 4, 4.2], [5, 4, 4.2]], [[-6, 7.4, 4.2], [2, 7.4, 4.2]]],
  },
];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let speed = value;
  const C = Cam(45, 0.5, 1.98);
  const OUT = RC + BAND;
  fit(C, [[-A - OUT, -OUT, -PB], [A + OUT, OUT, -PB], [A + OUT, -OUT, -PB], [-A - OUT, OUT, -PB], [0, -RC, 16]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the base, the floor sunk inside the loop, the belt's two edges and its moving slats, then the things
  put(solid(g), prism(P, front, stadium(OUT + 3), stadium(OUT + 1), -PB, 0));
  mk("path", { d: poly(stadium(OUT).map((q) => P(q.u, q.v, 0))), class: "nf lo" }, g);
  const slats = mk("path", { class: "nf lo" }, g);
  // the floor: the belt's inner edge, its wall down into the floor, and an inset on the floor
  const inner = stadium(RC - BAND);
  mk("path", { d: poly(inner.map((q) => P(q.u, q.v, 0))), class: "nf" }, g);
  mk("path", { d: open(run(inner, (q) => !front(q)).map((q) => P(q.u, q.v, -SINK))), class: "nf lo" }, g);
  mk("path", { d: poly(stadium(RC - BAND - 5).map((q) => P(q.u, q.v, -SINK))), class: "nf lo" }, g);
  const things = mk("g", {}, g);

  const items = Array.from({ length: N }, (_, i) => {
    const kind = KINDS[i % 3], grp = mk("g", {}, things);
    return { i, kind, name: NAMES[i % 3], grp, solids: kind.parts.map(() => solid(grp)), mk: mk("path", { class: "nf lo" }, grp) };
  });

  const rate = spring(1, { eps: 0.002 });
  let pos = 0, over = null, lit = null, order = "";
  function draw() {
    const sl = [];
    for (let k = 0; k < 44; k++) {
      const [x, y, a] = along(pos + (k * LOOP) / 44), nx = -Math.sin(a), ny = Math.cos(a);
      sl.push(seg(P(x - nx * (BAND - 1), y - ny * (BAND - 1), 0), P(x + nx * (BAND - 1), y + ny * (BAND - 1), 0)));
    }
    slats.setAttribute("d", sl.join(""));
    for (const it of items) {
      const [x, y, a] = along(pos + (it.i * LOOP) / N);
      it.x = x; it.y = y;
      it.kind.parts.forEach(([ring, z0, z1], k) => put(it.solids[k], prism(P, front, place2(ring, a, x, y), place2(ring, a, x, y), z0, z1)));
      it.solids.forEach((sd) => sd.cr.setAttribute("d", ""));
      const c = Math.cos(a), s = Math.sin(a);
      it.mk.setAttribute("d", it.kind.marks.map((l) => open(l.map(([u, v, z]) => P(x + u * c - v * s, y + u * s + v * c, z)))).join(""));
    }
    // far to near: move the groups only when the order changes
    const sorted = items.slice().sort((p, q) => p.x + p.y - (q.x + q.y)), key = sorted.map((it) => it.i).join();
    if (key !== order) { order = key; for (const it of sorted) things.appendChild(it.grp); }
    // the bright one: nearest the pointer, or the one passing the front
    const [tx, ty] = over || [RC * 0.71 + A * 0.3, RC * 0.71];
    let best = items[0];
    for (const it of items) if (Math.hypot(it.x - tx, it.y - ty) < Math.hypot(best.x - tx, best.y - ty)) best = it;
    if (best !== lit) {
      if (lit) lit.solids[lit.solids.length - 1].sil.classList.remove("hi");
      lit = best;
      lit.solids[lit.solids.length - 1].sil.classList.add("hi");
    }
    read.textContent = over ? lit.name : "rest";
  }
  draw();

  // ambient: the belt always runs, while the figure is on screen
  const B = register(stage, (dt) => {
    stepS(rate, dt);
    pos += rate.x * speed * dt;
    draw();
    return true;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => { over = unproj(C, p[0], p[1], 0); rate.t = 0.12; B.wake(); },
    leave: () => { over = null; rate.t = 1; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { speed = v; }, destroy: bag.dispose };
}

hairline({
  name: "channels",
  means: "Letters, parcels and flyers riding one carousel: hovering slows the belt so you can read one.",
  rules: [4, 6, 7, 8],
  range: [10, 18, 30],
  mount,
});
