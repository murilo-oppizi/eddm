/**
 * Agents: a small keypad on a rounded plate. Three keys at the back, one for
 * each piece of legwork (routes, audience, cost), and one wide key in front
 * with a sparkle on it: the agent. Point at a small key and it goes down. Point
 * at the agent key and it goes down, then the three go down after it, one by
 * one, spreading out from it: the agent presses them for you. The slider is
 * that stagger, in ms.
 */
const {
  Cam, fit, proj, facing, unproj, rrect, ringAt, run, hull, poly, open,
  tween, tset, tval, tdone, mk, solid, put, register, pointer, disposer,
} = HL;

const CELL = 30, TRAVEL = 6.5, UP = 7, KH = 13, B = 2.4;
const X0 = -8, X1 = 3 * CELL + 8, Y0 = -8, Y1 = 2 * CELL + 8, PH = 7;
const NAMES = ["routes", "audience", "cost", "agent"];
// back row: three small keys; front row: the agent key, as wide as the three
const FOOT = [0, 1, 2].map((i) => [i * CELL + 3, 3, i * CELL + CELL - 3, CELL - 3]).concat([[3, CELL + 3, 3 * CELL - 3, 2 * CELL - 3]]);

/** A keycap: its foot, a top drawn in by 3 and nudged back, and the crease 1.6 inside the top. */
function cap([x0, y0, x1, y1]) {
  return {
    foot: rrect(x0, y0, x1, y1, 4, 6),
    top: rrect(x0 + 3, y0 + 2.4, x1 - 3, y1 - 3.6, 3, 6),
    inner: rrect(x0 + 3 + B * 0.7, y0 + 2.4 + B * 0.7, x1 - 3 - B * 0.7, y1 - 3.6 - B * 0.7, 2, 6),
  };
}

/** A four-pointed sparkle lying on the agent key's top, its sides curving in. */
function sparkle(cx, cy, r) {
  const pts = [], e = (t) => Math.sign(t) * Math.pow(Math.abs(t), 2.6);
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * Math.PI * 2;
    // turned 45° on the key, so on screen its points face up, down, left and right
    const u = r * e(Math.cos(a)), v = r * e(Math.sin(a));
    pts.push([cx + (u - v) * 0.7071, cy + (u + v) * 0.7071]);
  }
  return pts;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;
  const C = Cam(45, 0.5, 2.25);
  fit(C, [[X0, Y0, -PH], [X1, Y1, -PH], [X1, Y0, -PH], [X0, Y1, -PH], [X0, Y0, UP + KH], [X1, Y0, UP + KH]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const plate = rrect(X0, Y0, X1, Y1, 9, 8), plateIn = rrect(X0 + 2, Y0 + 2, X1 - 2, Y1 - 2, 7, 8);
  put(solid(g), {
    sil: poly(hull(ringAt(P, plate, -PH).concat(ringAt(P, plate, 0)))),
    crease: open(ringAt(P, run(plateIn, front), 0)),
  });
  // the wells the keys stand in, dim, on the plate
  for (const f of FOOT) mk("path", { d: poly(ringAt(P, rrect(f[0] - 1.5, f[1] - 1.5, f[2] + 1.5, f[3] + 1.5, 5, 6), 0)), class: "nf lo" }, g);

  const keys = FOOT.map((f, i) => {
    const s = solid(g);
    return { i, ...cap(f), f, s, z: tween(0), drawn: NaN, mark: i === 3 ? mk("path", { class: "nf" }, s.g) : null };
  });
  const spark = sparkle((FOOT[3][0] + FOOT[3][2]) / 2, (FOOT[3][1] + FOOT[3][3]) / 2 - 0.6, 8);

  function draw(k, now) {
    const down = tval(k.z, now);
    if (down === k.drawn) return;
    k.drawn = down;
    const z0 = UP - down, z1 = z0 + KH;
    put(k.s, {
      sil: poly(hull(ringAt(P, k.foot, z0).concat(ringAt(P, k.top, z1)))),
      crease: open(ringAt(P, run(k.inner, front), z1)),
    });
    if (k.mark) k.mark.setAttribute("d", poly(spark.map(([x, y]) => P(x, y, z1))));
  }

  const L = register(stage, (_dt, now) => {
    let moving = false;
    for (const k of keys) { draw(k, now); if (!tdone(k.z, now)) moving = true; }
    return moving;
  });
  bag.add(L.unregister);

  // the key whose resting top holds the pointer: all four tops share one plane
  const hit = ([sx, sy]) => {
    const [x, y] = unproj(C, sx, sy, UP + KH);
    return keys.findIndex(({ f }) => x >= f[0] - 1.5 && x <= f[2] + 1.5 && y >= f[1] - 1.5 && y <= f[3] + 1.5);
  };

  let act = -1;
  function lightOn(a) {
    keys.forEach((k, i) => k.s.sil.classList.toggle("hi", a < 0 ? false : i === a));
    keys[3].mark.classList.toggle("hi", a < 0 || a === 3);
  }
  function choose(a) {
    if (a === act) return;
    act = a;
    const now = performance.now();
    keys.forEach((k, i) => {
      // the agent key presses the three, staggered out from its middle key
      const down = a === i || (a === 3 && i < 3);
      tset(k.z, down ? TRAVEL : 0, now, a === 3 && i < 3 ? stag * (2 + Math.abs(i - 1)) : 0);
    });
    lightOn(a);
    read.textContent = a < 0 ? "rest" : NAMES[a];
    L.wake();
  }
  lightOn(-1);

  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { stag = v; }, destroy: bag.dispose };
}

hairline({
  name: "agents",
  means: "A keypad with an agent key: press it and the three keys of legwork go down after it, one by one.",
  rules: [1, 2, 5, 9],
  range: [30, 60, 110],
  mount,
});
