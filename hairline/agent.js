/**
 * Agent: an AI chip on a circuit board. The package has six pins down each
 * side and a corner dot, the die on it carries a sparkle, and eight traces run
 * from its pins across the board to the tasks it handles. At rest the sparkle
 * is bright, a pulse waits at each pin, and each task's part stands low. Point
 * at a task: the agent sends a pulse down every trace, out from the one pointed
 * at, staggered by distance round the chip, and each task's part rises as its
 * pulse arrives; that trace and its part go bright, and it is named. Point at
 * the chip itself and it sets them all off, in a sweep round it, the sparkle
 * staying bright. The pads are hit where
 * they lie; they never move. The slider is the stagger, in ms.
 */
const {
  Cam, fit, proj, facing, unproj, prism, rings, rrect, circ, poly, open,
  tween, tset, tval, tdone, flatDot, place, mk, solid, put, register, pointer, disposer,
} = HL;

const BX = 164, BY = 124, CX = BX / 2, CY = BY / 2, PK = 22, PB = 5, PH = 7, DH = 4;
// the traces, clockwise from the north-west: [task, points from the pin out to its pad]
const TRACES = [
  ["routes", [[CX - 9, CY - PK - 6], [CX - 9, CY - PK - 14], [CX - 17, CY - PK - 22], [CX - 42, CY - PK - 22]]],
  ["audience", [[CX + 9, CY - PK - 6], [CX + 9, CY - PK - 14], [CX + 17, CY - PK - 22], [CX + 42, CY - PK - 22]]],
  ["budget", [[CX + PK + 6, CY - 9], [CX + PK + 14, CY - 9], [CX + PK + 24, CY - 19], [CX + PK + 46, CY - 19]]],
  ["design", [[CX + PK + 6, CY + 9], [CX + PK + 14, CY + 9], [CX + PK + 24, CY + 19], [CX + PK + 46, CY + 19]]],
  ["print", [[CX + 9, CY + PK + 6], [CX + 9, CY + PK + 14], [CX + 17, CY + PK + 22], [CX + 42, CY + PK + 22]]],
  ["launch", [[CX - 9, CY + PK + 6], [CX - 9, CY + PK + 14], [CX - 17, CY + PK + 22], [CX - 42, CY + PK + 22]]],
  ["scans", [[CX - PK - 6, CY + 9], [CX - PK - 14, CY + 9], [CX - PK - 24, CY + 19], [CX - PK - 46, CY + 19]]],
  ["report", [[CX - PK - 6, CY - 9], [CX - PK - 14, CY - 9], [CX - PK - 24, CY - 19], [CX - PK - 46, CY - 19]]],
];
const N = TRACES.length;
const LOW = [5, 2, 7, 3, 4, 2, 6, 3], UP = 14, TOP = 26, LIFT = 6;
const shift = (ring, x, y) => ring.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));

/** The point t (0 → 1) of the way along a polyline, by length. */
function along(pts, t) {
  const L = [];
  let total = 0;
  for (let k = 1; k < pts.length; k++) { L.push(Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1])); total += L[k - 1]; }
  let d = t * total;
  for (let k = 0; k < L.length; k++) {
    if (d <= L[k] || k === L.length - 1) { const f = Math.min(1, d / L[k]); return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f]; }
    d -= L[k];
  }
  return pts[pts.length - 1];
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;
  const C = Cam(45, 0.5, 1.56);
  fit(C, [[0, 0, -PB], [BX, BY, -PB], [BX, 0, -PB], [0, BY, -PB], [CX - 12, CY - 12, PH + DH], [CX + 42, CY - PK - 22, TOP + 2], [CX - PK - 46, CY - 19, TOP + 2], [CX - 12, CY - 12, PH + DH + LIFT]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const flat = (ring, z) => poly(ring.map((q) => P(q.u, q.v, z)));

  // the board, with a few small parts soldered on
  // a large round: its corners built with more steps, so they don't show facets
  const br = rrect(0, 0, BX, BY, 9, 12), bi = rrect(2.2, 2.2, BX - 2.2, BY - 2.2, 6.8, 12);
  put(solid(g), prism(P, front, br, bi, -PB, 0));
  const trace = TRACES.map(([, pts]) => mk("path", { d: open(pts.map(([x, y]) => P(x, y, 0))), class: "nf" }, g));
  const pads = TRACES.map(([, pts]) => {
    const [x, y] = pts[pts.length - 1];
    mk("path", { d: flat(rrect(x - 4, y - 4, x + 4, y + 4, 4, 4), 0), class: "nf" }, g);
    return [x, y];
  });
  for (const [x, y] of [[CX - 64, CY - 50], [CX + 64, CY - 50], [CX - 64, CY + 50], [CX + 64, CY + 50]]) {
    const [r, i] = rings(x - 5, y - 3, x + 5, y + 3, 1.2, 0.6);
    put(solid(g), prism(P, front, r, i, 0, 3));
  }

  // each task's part and pulse: behind the chip or in front of it, so the package covers the right ones
  const farG = mk("g", {}, g);

  // the pins, far to near, then the package, its corner dot, and the die with its sparkle
  const pins = [];
  for (let k = 0; k < 6; k++) {
    const o = -15 + k * 6;
    pins.push([CX + o - 1.5, CY - PK - 6, CX + o + 1.5, CY - PK], [CX - PK - 6, CY + o - 1.5, CX - PK, CY + o + 1.5]);
  }
  for (const [x0, y0, x1, y1] of pins) { const [r, i] = rings(x0, y0, x1, y1, 0.6, 0.3); put(solid(g), prism(P, front, r, i, 0, 1.8)); }
  const [pr, pi] = rings(CX - PK, CY - PK, CX + PK, CY + PK, 4, 1.4);
  put(solid(g), prism(P, front, pr, pi, 0.4, PH));
  const near = [];
  for (let k = 0; k < 6; k++) {
    const o = -15 + k * 6;
    near.push([CX + o - 1.5, CY + PK, CX + o + 1.5, CY + PK + 6], [CX + PK, CY + o - 1.5, CX + PK + 6, CY + o + 1.5]);
  }
  for (const [x0, y0, x1, y1] of near) { const [r, i] = rings(x0, y0, x1, y1, 0.6, 0.3); put(solid(g), prism(P, front, r, i, 0, 1.8)); }
  place(flatDot(g, C, 1.1, "dot m"), P(CX - PK + 6, CY - PK + 6, PH));
  // the die lifts off the package while the agent works
  const [dr, di] = rings(CX - 12, CY - 12, CX + 12, CY + 12, 3, 1);
  const die = solid(g), lift = tween(0);
  const star = [];
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * Math.PI * 2, e = (t) => Math.sign(t) * Math.abs(t) ** 2.6;
    const u = 8.5 * e(Math.cos(a)), v = 8.5 * e(Math.sin(a));
    // turned 45° on the die, so on screen its points face up, down, left and right
    star.push([CX + (u - v) * 0.7071, CY + (u + v) * 0.7071]);
  }
  const spark = mk("path", { class: "nf" }, die.g);
  let dieAt = NaN;
  const drawDie = (z) => {
    if (z === dieAt) return;
    dieAt = z;
    put(die, prism(P, front, dr, di, PH + z * 0.4, PH + DH + z));
    spark.setAttribute("d", poly(star.map(([x, y]) => P(x, y, PH + DH + z))));
  };
  drawDie(0);
  const nearG = mk("g", {}, g);
  const side = (k) => (pads[k][0] + pads[k][1] < CX + CY ? farG : nearG);

  // a pulse on each trace, waiting at its pin, and the task's part on its pad
  const pulses = TRACES.map((_, k) => {
    const [x, y] = pads[k], grp = side(k);
    return { el: flatDot(grp, C, 1.4, "dot off"), t: tween(0), part: solid(grp), h: tween(LOW[k]), x, y, drawn: NaN };
  });
  // far to near within each group
  pulses.slice().sort((a, b) => a.x + a.y - (b.x + b.y)).forEach((p) => p.part.g.parentNode.appendChild(p.part.g));
  const B = register(stage, (_dt, now) => {
    let moving = !tdone(lift, now);
    drawDie(tval(lift, now));
    pulses.forEach((p, k) => {
      place(p.el, P(...along(TRACES[k][1], tval(p.t, now)), 0));
      const h = tval(p.h, now);
      if (h !== p.drawn) { p.drawn = h; put(p.part, prism(P, front, shift(circ(3.8, 20), p.x, p.y), shift(circ(2.8, 20), p.x, p.y), 0, h)); }
      if (!tdone(p.t, now) || !tdone(p.h, now)) moving = true;
    });
    return moving;
  });
  bag.add(B.unregister);

  // a = a trace, CORE = the chip itself, -1 = nothing
  const CORE = N;
  let act = -2;
  function choose(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    pulses.forEach((p, k) => {
      const d = from < 0 ? 0 : from === CORE ? k * 0.6 : Math.min(Math.abs(k - from), N - Math.abs(k - from));
      tset(p.t, a < 0 ? 0 : 1, now, d * stag);
      // the part rises once its pulse has arrived; on the way back it settles at once
      tset(p.h, a < 0 ? LOW[k] : k === a ? TOP : UP, now, a < 0 ? 0 : d * stag + 420);
      p.el.setAttribute("class", a < 0 ? "dot off" : k === a ? "dot" : "dot m");
      trace[k].classList.toggle("hi", k === a);
      p.part.sil.classList.toggle("hi", k === a);
    });
    spark.classList.toggle("hi", a < 0 || a === CORE);
    die.sil.classList.toggle("hi", a === CORE);
    tset(lift, a < 0 ? 0 : LIFT, now, 0);
    read.textContent = a < 0 ? "rest" : a === CORE ? "agent" : TRACES[a][0];
    B.wake();
  }
  choose(-1);

  const hit = ([sx, sy]) => {
    // the chip, where its die rests: its top's plane, over the package
    const [cx, cy] = unproj(C, sx, sy, PH + DH);
    if (Math.abs(cx - CX) <= PK + 2 && Math.abs(cy - CY) <= PK + 2) return CORE;
    const [x, y] = unproj(C, sx, sy, 0);
    let best = -1, bd = 22;
    pads.forEach(([px, py], k) => { const d = Math.hypot(x - px, y - py); if (d < bd) { bd = d; best = k; } });
    return best;
  };
  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { stag = v; }, destroy: bag.dispose };
}

hairline({
  name: "agent",
  means: "An AI chip on a circuit board: point at a task and a pulse runs down every trace, and each task rises as it arrives.",
  rules: [1, 2, 4, 10],
  range: [20, 60, 110],
  mount,
});
