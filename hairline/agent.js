/**
 * Agent: a gantry, like a plotter's, over a board of twelve trays of postcards
 * stacked to different heights: the agent's work, placed for you. A bridge
 * rides two rails, a carriage rides the bridge, and a gripper on a rod holds a
 * postcard. Point at a tray: the gripper lifts, the gantry runs over it on the
 * 700ms curve, and lowers the card onto the stack, which goes bright. At rest
 * it holds a card over the tallest stack. The trays are hit where they rest;
 * they never move. The slider is the pause before the card goes down, in ms.
 */
const {
  Cam, fit, proj, facing, unproj, prism, rings, rrect, circ, poly, seg,
  tween, tset, tval, tdone, mk, solid, put, register, pointer, disposer,
} = HL;

const NXC = 4, NYC = 3, CELL = 26, EX = NXC * CELL, EY = NYC * CELL, M = 9, H = 56, PB = 5;
const STACK = [[4, 9, 3, 6], [7, 2, 13, 5], [3, 6, 4, 8]];
const REST = [2, 1];
const UP = H - 18;
const shift = (ring, x, y) => ring.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let pause = value;
  const C = Cam(45, 0.5, 1.62);
  fit(C, [[-M, -M, -PB], [EX + M, EY + M, -PB], [EX + M, -M, -PB], [-M, EY + M, -PB], [-M, -M, H + 12], [EX + M, -M, H + 12]], 200, 162);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const post = (x, y) => put(solid(g), prism(P, front, shift(circ(2.8, 16), x, y), shift(circ(2, 16), x, y), 0, H));
  const rail = (y) => { const [r, i] = rings(-M - 3, y - 2.6, EX + M + 3, y + 2.6, 2.2, 0.8); put(solid(g), prism(P, front, r, i, H, H + 4)); };

  // the board, the far post and rail, then the stacks far to near, then the side posts
  const [br, bi] = rings(-M - 4, -M - 4, EX + M + 4, EY + M + 4, 8, 2);
  put(solid(g), prism(P, front, br, bi, -PB, 0));
  post(-M, -M);
  rail(-M);
  const cells = [];
  for (let s = 0; s <= NXC + NYC - 2; s++) for (let i = 0; i < NXC; i++) {
    const j = s - i;
    if (j < 0 || j >= NYC) continue;
    const cx = (i + 0.5) * CELL, cy = (j + 0.5) * CELL, h = STACK[j][i];
    mk("path", { d: poly(rrect(cx - 11.5, cy - 9.5, cx + 11.5, cy + 9.5, 3, 4).map((q) => P(q.u, q.v, 0))), class: "nf lo" }, g);
    const st = solid(g), [r, ri] = rings(cx - 9, cy - 6.5, cx + 9, cy + 6.5, 1.4, 0.6);
    put(st, prism(P, front, r, ri, 0, h));
    // the top card's print: a picture and two lines
    mk("path", { d: poly(rrect(cx - 7, cy - 4.5, cx - 1, cy + 4.5, 0.6, 2).map((q) => P(q.u, q.v, h))) + seg(P(cx + 1, cy - 2.5, h), P(cx + 7, cy - 2.5, h)) + seg(P(cx + 1, cy + 0.5, h), P(cx + 5, cy + 0.5, h)), class: "nf lo" }, st.g);
    cells.push({ i, j, cx, cy, h, st });
  }
  post(EX + M, -M);
  post(-M, EY + M);

  // what moves: the card, the gripper and its rod; then the near post and rail, the bridge, the carriage
  const card = solid(g), grip = solid(g), rod = mk("path", { class: "nf" }, g);
  post(EX + M, EY + M);
  rail(EY + M);
  const bridge = solid(g), carriage = solid(g);

  const home = cells.find((c) => c.i === REST[0] && c.j === REST[1]);
  const tx = tween(home.cx), ty = tween(home.cy), tz = tween(home.h + 1.2);
  let drawn = "";
  function draw(now) {
    const x = tval(tx, now), y = tval(ty, now), z = tval(tz, now), key = x + "," + y + "," + z;
    if (key === drawn) return;
    drawn = key;
    const [cr, ci] = rings(x - 8, y - 5.5, x + 8, y + 5.5, 1.2, 0.5);
    put(card, prism(P, front, cr, ci, z, z + 1.2));
    put(grip, prism(P, front, shift(circ(3.6, 16), x, y), shift(circ(2.6, 16), x, y), z + 1.2, z + 6));
    rod.setAttribute("d", seg(P(x, y, z + 6), P(x, y, H + 2)));
    const [bR, bI] = rings(x - 3.4, -M - 5, x + 3.4, EY + M + 5, 2.6, 0.9);
    put(bridge, prism(P, front, bR, bI, H + 4, H + 9));
    const [kR, kI] = rings(x - 6.5, y - 6.5, x + 6.5, y + 6.5, 3, 1);
    put(carriage, prism(P, front, kR, kI, H + 1, H + 12));
  }

  // lift, run over, and only once the run has landed, lower the card
  let lower = null;
  const B = register(stage, (_dt, now) => {
    if (lower && tdone(tx, now) && tdone(ty, now)) { tset(tz, lower.h + 1.2, now, pause); lower = null; }
    draw(now);
    return lower !== null || !tdone(tx, now) || !tdone(ty, now) || !tdone(tz, now);
  });
  bag.add(B.unregister);

  let act = null;
  function choose(c) {
    const to = c || home;
    if (to === act) return;
    act = to;
    const now = performance.now();
    tset(tz, UP, now, 0);
    tset(tx, to.cx, now, 220);
    tset(ty, to.cy, now, 220);
    lower = to;
    for (const k of cells) k.st.sil.classList.toggle("hi", k === to);
    read.textContent = c ? `tray ${"ABCD"[c.i]}${c.j + 1}` : "rest";
    B.wake();
  }
  choose(null);

  const hit = ([sx, sy]) => {
    const [x, y] = unproj(C, sx, sy, 0);
    if (x < 0 || x > EX || y < 0 || y > EY) return null;
    return cells.find((c) => Math.abs(x - c.cx) <= CELL / 2 && Math.abs(y - c.cy) <= CELL / 2) || null;
  };
  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { pause = v; }, destroy: bag.dispose };
}

hairline({
  name: "agent",
  means: "A gantry over twelve trays of postcards: point at a tray and it runs over and lowers a card onto it.",
  rules: [1, 5, 6, 8],
  range: [0, 120, 320],
  mount,
});
