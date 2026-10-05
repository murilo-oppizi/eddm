/**
 * Scans: a board of fifteen bars, one per mail route, on a rounded plinth. At
 * rest they stand as a week of results, rising to the right, the tallest
 * bright. The pointer is projected onto the ground, and each bar takes its
 * height from its distance to it, on its own spring: the routes near it are
 * read out. The slider is the radius, in rows.
 */
const {
  Cam, fit, prism, proj, rings, unproj, spring, stepS, clamp, facing,
  mk, pointer, put, register, disposer, solid,
} = HL;

const NX = 5, NY = 3, CELL = 22, FOOT = 15, HMAX = 66, PB = 5;
const EX = NX * CELL, EY = NY * CELL;

const falloff = (u) => (u <= 0 ? 1 : u <= 0.45 ? 1 - (u / 0.45) * 0.6 : u <= 1 ? 0.4 - ((u - 0.45) / 0.55) * 0.28 : 0.12);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 2.1);
  fit(C, [[-8, -8, -PB], [EX + 8, EY + 8, -PB], [EX + 8, -8, -PB], [-8, EY + 8, -PB], [EX, 0, HMAX], [0, EY, HMAX]], 200, 170);
  const P = proj(C), front = facing(C);
  let R = value * CELL, over = null;

  const g = mk("g", {}, svg), bars = [];
  const [pr, pi] = rings(-8, -8, EX + 8, EY + 8, 10, 2.2);
  put(solid(g), prism(P, front, pr, pi, -PB, 0));
  // Back to front: by ascending i + j from the far corner.
  for (let s = 0; s <= NX + NY - 2; s++) for (let i = 0; i < NX; i++) {
    const j = s - i;
    if (j < 0 || j >= NY) continue;
    // rest: the results of a week, climbing to the right, a dip in the middle
    const h0 = 10 + i * 9 + (j === 1 ? 6 : 0) - (i === 2 ? 8 : 0);
    const x0 = i * CELL + (CELL - FOOT) / 2, y0 = j * CELL + (CELL - FOOT) / 2;
    const [ring, inner] = rings(x0, y0, x0 + FOOT, y0 + FOOT, 3.2, 1.1);
    bars.push({ i, j, h0, ring, inner, sp: spring(h0, { eps: 0.04 }), el: solid(g), drawn: NaN });
  }
  const top = bars.reduce((a, b) => (b.h0 > a.h0 ? b : a));
  let lit = top;

  function draw(b) {
    const h = Math.max(1, b.sp.x);
    if (h === b.drawn) return;
    b.drawn = h;
    put(b.el, prism(P, front, b.ring, b.inner, 0, h));
  }
  const B = register(stage, (dt) => {
    let m = false;
    for (const b of bars) { if (stepS(b.sp, dt)) m = true; draw(b); }
    return m;
  });
  bag.add(B.unregister);

  function light(b) {
    if (b === lit) return;
    lit.el.sil.classList.remove("hi");
    lit = b;
    lit.el.sil.classList.add("hi");
  }
  light(top); top.el.sil.classList.add("hi");

  function retarget() {
    for (const b of bars) {
      if (!over) { b.sp.t = b.h0; continue; }
      const dx = (b.i + 0.5) * CELL - over[0], dy = (b.j + 0.5) * CELL - over[1];
      b.sp.t = HMAX * falloff(Math.hypot(dx, dy) / R);
    }
    if (over) {
      const i = clamp(Math.floor(over[0] / CELL), 0, NX - 1), j = clamp(Math.floor(over[1] / CELL), 0, NY - 1);
      light(bars.find((b) => b.i === i && b.j === j));
      read.textContent = `route ${j * NX + i + 1}`;
    } else { light(top); read.textContent = "rest"; }
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { over = unproj(C, p[0], p[1], 0); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { R = v * CELL; if (over) retarget(); }, destroy: bag.dispose };
}

hairline({
  name: "scans",
  means: "Fifteen routes as bars on a board: the routes near the pointer rise, so you read where the scans came from.",
  rules: [1, 3, 5, 9],
  range: [1, 1.8, 3],
  mount,
});
