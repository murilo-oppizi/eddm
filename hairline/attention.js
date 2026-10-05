/**
 * Attention: a front door on its step, a letter plate in it, and one postcard
 * half out of the slot. The pointer is put on the plane of the slot: bring it
 * toward you and the card follows it out, into your hand; take it back to the
 * door and the card goes in. One card, nothing else bright. The slider is how
 * far the card can come out.
 */
const {
  Cam, fit, proj, unproj, facing, prism, rings, rrect, circ, ringAt, run, hull, poly, open, seg,
  clamp, spring, stepS, mk, solid, put, register, pointer, disposer,
} = HL;

const DW = 84, DH = 116, DT = 3, SZ = 63, CW = 48, IN = 5, REST = 14;
const WX = 24, WT = 6, WH = DH + 16, X0 = -WX - 4, X1 = DW + WX + 4, Y0 = -WT - 6, Y1 = 46, PH = 6;

/** An upright slab, drawn as (x, z) and pushed out along y from y0 to y1: its silhouette, and the crease inside its front face. */
function slab(P, ring, inner, y0, y1) {
  const at = (r, y) => r.map((q) => P(q.u, y, q.v));
  return {
    sil: poly(hull(at(ring, y0).concat(at(ring, y1)))),
    crease: open(at(run(inner, (q) => q.nu > 0.05 || q.nv > 0.05), y1)),
  };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let L = value;
  const C = Cam(45, 0.5, 1.62);
  fit(C, [[X0, Y0, -PH], [X1, Y1, -PH], [X1, Y0, -PH], [X0, Y1, -PH], [-WX, -WT, WH], [DW + WX, -WT, WH], [DW / 2, DT + 58, SZ]], 200, 162);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the step, a piece of the front wall on it, and the door set in the wall
  const [st, sti] = rings(X0, Y0, X1, Y1, 10, 2);
  put(solid(g), prism(P, front, st, sti, -PH, 0));
  put(solid(g), slab(P, rrect(-WX, 0, DW + WX, WH, 6, 6), rrect(-WX + 1.6, 1.6, DW + WX - 1.6, WH - 1.6, 4.4, 6), -WT, 0));
  put(solid(g), slab(P, rrect(0, 0, DW, DH, 5, 6), rrect(1.6, 1.6, DW - 1.6, DH - 1.6, 3.4, 6), 0, DT));
  const onDoor = (r, y = DT) => poly(r.map((q) => P(q.u, y, q.v)));
  // two panels let into it, above and below the plate
  mk("path", { d: onDoor(rrect(12, 82, DW - 12, DH - 12, 4, 5)), class: "nf lo" }, g);
  mk("path", { d: onDoor(rrect(12, 12, DW - 12, 44, 4, 5)), class: "nf lo" }, g);
  // the knob, a short round boss
  const knob = circ(4.2, 16).map((q) => ({ ...q, u: q.u + DW - 6, v: q.v + 40 }));
  put(solid(g), slab(P, knob, knob, DT, DT + 5));
  // the letter plate, standing proud of the door, and its slot
  const PX0 = DW / 2 - 31, PX1 = DW / 2 + 31;
  put(solid(g), slab(P, rrect(PX0, SZ - 9, PX1, SZ + 9, 4, 6), rrect(PX0 + 1.2, SZ - 7.8, PX1 - 1.2, SZ + 7.8, 2.8, 6), DT, DT + 2));
  mk("path", { d: onDoor(rrect(PX0 + 4, SZ - 2, PX1 - 4, SZ + 2, 2, 4), DT + 2), class: "nf" }, g);

  // the card: from the slot's face out to y, thin, with its stamp and two address lines
  const card = solid(g);
  card.sil.classList.add("hi");
  const stamp = mk("path", { class: "nf" }, card.g), lines = mk("path", { class: "nf lo" }, card.g);
  const cx0 = DW / 2 - CW / 2, cx1 = DW / 2 + CW / 2, y0 = DT + 2;
  const out = spring(REST, { eps: 0.02 });
  let drawn = NaN;
  function draw() {
    const o = out.x;
    if (o === drawn) return;
    drawn = o;
    const [r, ri] = rings(cx0, y0 - 2, cx1, y0 + o, 1.6, 0.6);
    put(card, prism(P, front, r, ri, SZ - 0.5, SZ + 0.5));
    const e = y0 + o, top = (pts) => poly(pts.map(([x, y]) => P(x, y, SZ + 0.5)));
    stamp.setAttribute("d", o > 11 ? top(rrect(cx1 - 9, e - 9, cx1 - 3, e - 3, 1, 2).map((q) => [q.u, q.v])) : "");
    lines.setAttribute("d", [10, 7].filter((k) => o > k + 1).map((k) => seg(P(cx0 + 5, e - k, SZ + 0.5), P(cx0 + 20, e - k, SZ + 0.5))).join(""));
  }
  draw();

  const B = register(stage, (dt) => { const m = stepS(out, dt); draw(); return m; });
  bag.add(B.unregister);

  const say = (t) => (t >= L * 0.85 ? "in hand" : t <= IN + 2 ? "in the slot" : "half out");
  function aim(t) {
    out.t = t;
    read.textContent = t === REST ? "rest" : say(t);
    B.wake();
  }
  bag.add(pointer(stage, {
    // where the pointer sits on the slot's plane, measured out from the plate
    move: (p) => aim(clamp(unproj(C, p[0], p[1], SZ)[1] - y0, IN, L)),
    leave: () => aim(REST),
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { L = v; }, destroy: bag.dispose };
}

hairline({
  name: "attention",
  means: "One postcard in a door's letter plate: bring the pointer toward you and it comes out of the slot, into your hand.",
  rules: [1, 3, 4, 5],
  range: [40, 50, 60],
  mount,
});
