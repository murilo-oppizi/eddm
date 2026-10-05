/**
 * Quality: a pile of seven identical postcards, a little uneven as a real pile
 * is, the top one showing its picture, its address and a check. Bring the
 * pointer near and the pile fans out into a staircase, on one spring, and the
 * same check shows on every card: scale did not break it. The slider is how
 * far apart each card can fan.
 */
const {
  Cam, fit, proj, facing, unproj, rrect, run, hull, poly, open, seg, fillet,
  clamp, rad, spring, stepS, mk, solid, put, register, pointer, disposer,
} = HL;

const N = 7, W = 74, D = 50, T = 1.6, GAP = 3.4, CX = W / 2, CY = D / 2;
// the pile's unevenness at rest: each card's nudge (x, y) and turn, in degrees
const NUDGE = [[0, 0, 0], [2, -1.5, 2.2], [-1.5, 1, -1.4], [1.5, 1.5, 1.6], [-1, -1, -2], [2, 0.5, 1], [0, 0, -0.8]];
// a check, drawn upright on screen: a along screen x, b along screen y
const TICK = fillet([[-5.2, 0.4], [-3.6, -1.2], [-1.2, 1.2], [4.4, -4.6], [6, -3], [-1.2, 4.4]], [0.8, 0.8, 0.5, 0.8, 0.8, 0.8], 3);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let MAX = value;
  const half = (N - 1) / 2;
  const C = Cam(45, 0.5, 2.12);
  fit(C, [[-half * 16, 0, 0], [W + half * 16, D, 0], [W + half * 16, 0, 0], [-half * 16, D, 0], [-half * 16, 0, N * GAP], [W, D, N * GAP]], 200, 164);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const outer = rrect(0, 0, W, D, 2.2, 4), inner = rrect(0.7, 0.7, W - 0.7, D - 0.7, 1.5, 4);

  const cards = NUDGE.map(([nx, ny, th], i) => {
    const s = solid(g);
    return {
      i, nx, ny, th, s,
      photo: mk("path", { class: "nf lo" }, s.g),
      lines: mk("path", { class: "nf lo" }, s.g),
      tick: mk("path", { class: i === N - 1 ? "nf hi" : "nf" }, s.g),
    };
  });

  /** Card i, offset by dx along x: the world point of its own (u, v) at height z. */
  const at = (c, dx) => {
    const a = rad(c.th), co = Math.cos(a), si = Math.sin(a);
    return (u, v, z) => {
      const x = u - CX, y = v - CY;
      return P(CX + c.nx + dx + x * co - y * si, CY + c.ny + x * si + y * co, z);
    };
  };
  const turnRing = (w, r, z) => r.map((q) => w(q.u, q.v, z));

  const spread = spring(0, { eps: 0.02 });
  let drawn = NaN;
  function draw() {
    const s = spread.x;
    if (s === drawn) return;
    drawn = s;
    for (const c of cards) {
      // the top of the pile moves back, the bottom forward: a staircase
      const w = at(c, (half - c.i) * s), z0 = c.i * GAP, z1 = z0 + T;
      const turned = (ring) => ring.map((q) => {
        const a = rad(c.th);
        return { ...q, nu: q.nu * Math.cos(a) - q.nv * Math.sin(a), nv: q.nu * Math.sin(a) + q.nv * Math.cos(a) };
      });
      put(c.s, {
        sil: poly(hull(turnRing(w, outer, z0).concat(turnRing(w, outer, z1)))),
        crease: open(run(turned(inner), front).map((q) => w(q.u, q.v, z1))),
      });
      const top = (pts) => poly(pts.map(([u, v]) => w(u, v, z1)));
      c.photo.setAttribute("d", top(rrect(6, 6, 30, D - 6, 2, 3).map((q) => [q.u, q.v])));
      c.lines.setAttribute("d", [[36, 12, 58], [36, 18, 52], [36, 24, 56]].map(([u0, v, u1]) => seg(w(u0, v, z1), w(u1, v, z1))).join(""));
      const tx = W - 8.5, ty = D - 13;
      c.tick.setAttribute("d", top(TICK.map(([a, b]) => [tx + (a + b) * 0.71, ty + (b - a) * 0.71])));
    }
  }
  draw();

  const B = register(stage, (dt) => { const m = stepS(spread, dt); draw(); return m; });
  bag.add(B.unregister);

  function aim(t) {
    spread.t = t;
    // a lower card's check shows once the card above has moved back past it
    read.textContent = t === 0 ? "rest" : `${t >= 12 ? N : 1} of ${N}`;
    B.wake();
  }
  bag.add(pointer(stage, {
    // nearness to the pile's middle, on the ground: the nearer, the wider the fan
    move: (p) => {
      const [x, y] = unproj(C, p[0], p[1], 0);
      const d = Math.hypot(x - CX, y - CY);
      aim(MAX * clamp(1 - (d - 28) / 60, 0, 1));
    },
    leave: () => aim(0),
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { MAX = v; }, destroy: bag.dispose };
}

hairline({
  name: "quality",
  means: "A pile of identical postcards: bring the pointer near and it fans out, and the same check shows on every card.",
  rules: [3, 4, 5, 6],
  range: [12, 14, 16],
  mount,
});
