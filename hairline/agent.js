/**
 * Agent: a sorting arm on a round plinth, a postcard in its gripper, and three
 * trays in an arc in front of it: plan, launch, measure. At rest the arm
 * holds the card over the middle tray, which is bright. Point at a tray and
 * the arm lifts the card, swings over it on the 700ms curve, and lowers it in;
 * the tray goes bright. The trays are hit where they rest, and never move.
 * The slider is the pause before the card goes down, in ms.
 */
const {
  Cam, fit, proj, facing, unproj, prism, rings, rrect, circ, ringAt, run, hull, poly, open, seg,
  tween, tset, tval, tdone, mk, solid, put, register, pointer, disposer,
} = HL;

const RA = 52, TS = 13, TH = 10, WT = 2, BOOM = 52, ZB = 50, UP = 34, DOWN = 15, FRONT = Math.PI / 4;
const NAMES = ["plan", "launch", "measure"];
// the arc swings off to one side, so the boom is never end-on to you and always reads as an arm
const AT = [FRONT + 1.35, FRONT + 0.5, FRONT - 0.35];
const PC = [22 * Math.cos(FRONT + 0.5), 22 * Math.sin(FRONT + 0.5)], PR = 78;
const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());
const turn = (ring, a, dx = 0, dy = 0) => {
  const c = Math.cos(a), s = Math.sin(a);
  return ring.map((q) => ({ u: dx + q.u * c - q.v * s, v: dy + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c }));
};

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let pause = value;
  const C = Cam(45, 0.5, 1.62);
  fit(C, [[PC[0] - PR, PC[1], -6], [PC[0] + PR, PC[1], -6], [PC[0], PC[1] + PR, -6], [PC[0], PC[1] - PR, -6], [0, 0, ZB + 6], [BOOM * Math.cos(AT[0]), BOOM * Math.sin(AT[0]), ZB + 6]], 200, 164);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the plinth, the arm's foot and column
  const disc = (r, n = 48) => turn(circ(r, n), 0, PC[0], PC[1]);
  put(solid(g), prism(P, front, disc(PR), disc(PR - 2.2), -6, 0));
  put(solid(g), prism(P, front, circ(16, 32), circ(14.4, 32), 0, 5));
  put(solid(g), prism(P, front, circ(6.5, 24), circ(5.3, 24), 5, ZB - 2));

  // the trays, far to near, each painted as a tray is: body and rim, a card lying in it, then its near wall
  const trays = AT.map((a, i) => ({ i, a, x: RA * Math.cos(a), y: RA * Math.sin(a) })).sort((p, q) => p.x + p.y - (q.x + q.y));
  for (const t of trays) {
    const [outer, inner] = rings(t.x - TS, t.y - TS, t.x + TS, t.y + TS, 6, WT);
    t.body = mk("path", { d: poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, TH)))), class: "sil" }, g);
    t.rim = mk("path", { d: poly(ringAt(P, inner, TH)), class: "nf" }, g);
    mk("path", { d: poly(ringAt(P, rrect(t.x - 8, t.y - 6, t.x + 8, t.y + 6, 1, 3), 3)), class: "nf lo" }, g);
    const iF = LR(ringAt(P, run(inner, front), TH)), oT = LR(ringAt(P, run(outer, front), TH)), oB = LR(ringAt(P, run(outer, front), 0));
    mk("path", { d: poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), class: "fo" }, g);
    mk("path", { d: open(iF), class: "nf" }, g);
    t.near = mk("path", { d: open([oT[0], ...oB, oT[oT.length - 1]]), class: "nf sil" }, g);
  }

  // the arm: a hub on the column, the boom, a rod down to the gripper, and the card it holds
  const hub = solid(g), card = solid(g), rod = mk("path", { class: "nf" }, g), grip = solid(g), boom = solid(g);
  put(hub, prism(P, front, circ(9, 24), circ(7.6, 24), ZB - 2, ZB + 4));

  const swing = tween(AT[1]), drop = tween(DOWN);
  let drawn = "";
  function draw(now) {
    const a = tval(swing, now), z = tval(drop, now), key = a + "," + z;
    if (key === drawn) return;
    drawn = key;
    const ex = BOOM * Math.cos(a), ey = BOOM * Math.sin(a);
    const [br, bi] = rings(-6, -5, BOOM + 6, 5, 5, 1.4);
    put(boom, prism(P, front, turn(br, a), turn(bi, a), ZB, ZB + 5));
    rod.setAttribute("d", seg(P(ex, ey, ZB), P(ex, ey, z + 6)));
    put(grip, prism(P, front, turn(circ(4.4, 16), 0, ex, ey), turn(circ(3.4, 16), 0, ex, ey), z + 1.2, z + 6));
    const [cr, ci] = rings(-9, -6.5, 9, 6.5, 1.4, 0.6);
    put(card, prism(P, front, turn(cr, a, ex, ey), turn(ci, a, ex, ey), z, z + 1.2));
  }

  // lift, swing while it is up, and only once the swing has landed, lower it in
  let lower = false;
  const B = register(stage, (_dt, now) => {
    if (lower && tdone(swing, now)) { lower = false; tset(drop, DOWN, now, pause); }
    draw(now);
    return lower || !tdone(swing, now) || !tdone(drop, now);
  });
  bag.add(B.unregister);

  let act = -2;
  function light(i) { for (const t of trays) for (const el of [t.body, t.near]) el.classList.toggle("hi", t.i === i); }
  function choose(i) {
    if (i === act) return;
    const now = performance.now(), to = i < 0 ? 1 : i;
    act = i;
    if (Math.abs(tval(swing, now) - AT[to]) > 0.01) {
      tset(drop, UP, now, 0);
      tset(swing, AT[to], now, 220);
      lower = true;
    }
    light(to);
    read.textContent = i < 0 ? "rest" : NAMES[i];
    B.wake();
  }
  light(1);

  const hit = ([sx, sy]) => {
    const [x, y] = unproj(C, sx, sy, TH);
    const t = trays.find((q) => Math.abs(x - q.x) <= TS + 4 && Math.abs(y - q.y) <= TS + 4);
    return t ? t.i : -1;
  };
  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { pause = v; }, destroy: bag.dispose };
}

hairline({
  name: "agent",
  means: "An agent's sorting arm: point at a tray and it swings the postcard over and lowers it in.",
  rules: [1, 5, 6, 8],
  range: [0, 120, 320],
  mount,
});
