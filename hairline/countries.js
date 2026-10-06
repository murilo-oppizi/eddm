/**
 * Countries: the world as a field of pillars on a rounded plinth, one pillar
 * per patch of land, the cities Oppizi works in standing taller: the Americas,
 * Europe, Sydney and Auckland. At rest Sydney, where it began, is the tallest
 * and bright, with a 3 × 3 dot mark on its lid. The pointer is put on the
 * ground and the land near it rises, the cities most, each on its own spring;
 * the nearest city takes the bright stroke and the mark, and is read out. The
 * slider is the reach, in cells.
 *
 * Built on Terrain's pattern: a continuous field, springs, a falloff by
 * distance, and a hit test on the ground plane, which never moves.
 */
const {
  Cam, fit, prism, proj, rings, rrect, unproj, spring, stepS, facing,
  flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

// the land, row by row from the north (Arctic left out), from the site's world map
const LAND = [
  "#.#####.#.......##############",
  "...#######....##############..",
  "....#####.....#############...",
  "....####......###.########....",
  ".....##......#############....",
  "........##...#######..........",
  "........###.....###.....##....",
  "........####....###.......##..",
  "........###.....##.......####.",
  "........##.................#.#",
  "........#.....................",
  "........#.....................",
];
// [name, column, row, height at rest]
const CITIES = [
  ["toronto", 7, 2, 13], ["new york", 8, 2, 17], ["são paulo", 10, 8, 12], ["buenos aires", 9, 9, 9],
  ["london", 14, 1, 15], ["berlin", 16, 1, 11], ["paris", 15, 2, 12], ["lisbon", 14, 2, 9],
  ["sydney", 28, 8, 24], ["auckland", 29, 9, 10],
];
const NX = LAND[0].length, NY = LAND.length, CELL = 9, FOOT = 4.2, HMAX = 34, PB = 4;
// The map lies with north away from you and east to the right: column i and row j sit on a
// lattice turned 45° on the ground, so its columns run across the screen and its rows up it,
// while every pillar is still a square seen corner-on. Rows are twice as far apart as
// columns, so the 2:1 view shows every cell square.
const at = (i, j) => {
  const a = (i - (NX - 1) / 2) * CELL, c = (j - (NY - 1) / 2) * CELL * 2;
  return [(a + c) / 2, (c - a) / 2];
};
/** The board: a rounded rectangle on the lattice, turned with it. */
const board = (m, r) => {
  const hx = ((NX - 1) / 2) * CELL + m, hc = ((NY - 1) / 2) * CELL * 2 + m;
  return rrect(-hx, -hc, hx, hc, r, 8).map((q) => ({
    u: (q.u + q.v) / 2, v: (q.v - q.u) / 2, nu: (q.nu + q.nv) * Math.SQRT1_2, nv: (q.nv - q.nu) * Math.SQRT1_2,
  }));
};

/** The share of the rise at u reaches from the pointer: 1 → .3 at 40% → .06 at the edge and beyond. */
const falloff = (u) => (u <= 0.4 ? 1 - (u / 0.4) * 0.7 : u <= 1 ? 0.3 - ((u - 0.4) / 0.6) * 0.24 : 0.06);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.62);
  const corners = [[0, 0], [NX - 1, 0], [0, NY - 1], [NX - 1, NY - 1]].map(([i, j]) => at(i, j));
  fit(C, corners.map(([x, y]) => [x * 1.12, y * 1.12, -PB]).concat([[...at(28, 8), HMAX + 24], [...at(14, 0), HMAX + 16]]), 200, 168);
  const P = proj(C), front = facing(C);
  let R = value * CELL, over = null;

  const g = mk("g", {}, svg), cols = [];
  put(solid(g), prism(P, front, board(7, 7), board(5.4, 5.4), -PB, 0));
  // a dim dot on every patch of sea, so the land reads as land
  const sea = mk("g", {}, g);
  // far to near: row by row from the north, which is painting back to front on this lattice
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const [x, y] = at(i, j);
    if (LAND[j][i] !== "#") {
      place(flatDot(sea, C, 0.5, "dot off"), P(x, y, 0));
      continue;
    }
    const city = CITIES.find((c) => c[1] === i && c[2] === j);
    const h0 = city ? city[3] : 2.2 + ((i * 7 + j * 3) % 5) * 0.5;
    const [ring, inner] = rings(x - FOOT / 2, y - FOOT / 2, x + FOOT / 2, y + FOOT / 2, 1.2, 0.5);
    cols.push({ i, j, x, y, city, h0, ring, inner, sp: spring(h0, { eps: 0.04 }), el: solid(g), drawn: NaN });
  }

  // the mark: a 3 × 3 of dots riding the lit city's lid, just after it in the paint order
  const mark = mk("g", {}, g), md = [];
  for (let k = 0; k < 9; k++) md.push(flatDot(mark, C, 0.45, k === 4 ? "dot" : "dot m"));
  const home = cols.find((c) => c.city && c.city[0] === "sydney");
  let lit = null, want = home;

  function drawMark() {
    if (want !== lit) {
      if (lit) lit.el.sil.classList.remove("hi");
      lit = want;
      lit.el.sil.classList.add("hi");
      lit.el.g.after(mark);
    }
    const h = lit.sp.x;
    md.forEach((el, k) => place(el, P(lit.x + ((k % 3) - 1) * 1.05, lit.y + (Math.floor(k / 3) - 1) * 1.05, h)));
  }
  function drawCol(c) {
    const h = Math.max(0.6, c.sp.x);
    if (h === c.drawn) return;
    c.drawn = h;
    put(c.el, prism(P, front, c.ring, c.inner, 0, h));
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const c of cols) { if (stepS(c.sp, dt)) m = true; drawCol(c); }
    drawMark();
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    let near = home, best = Infinity;
    for (const c of cols) {
      if (!over) { c.sp.t = c.h0; continue; }
      const d = Math.hypot(c.x - over[0], c.y - over[1]);
      // the land rises with nearness; a city rises from its own height
      c.sp.t = (c.city ? c.h0 : 1.5) + (c.city ? HMAX * 0.8 : HMAX * 0.65) * falloff(d / R);
      if (c.city && d < best) { best = d; near = c; }
    }
    want = near;
    read.textContent = over ? near.city[0] : "rest";
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
  name: "countries",
  means: "The world as a field of pillars, the cities Oppizi works in standing tall: the land near the pointer rises, and the nearest city is named.",
  rules: [1, 3, 5, 9],
  range: [3, 5, 7.5],
  mount,
});
