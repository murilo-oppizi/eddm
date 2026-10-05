/**
 * Flyers: a flyer holder, five flyers standing up out of it at uneven
 * heights, the tallest bright. The flyer under the pointer comes up out of
 * the holder to be handed out; its neighbours rise a little after it,
 * spreading out from it. The slider is that stagger, in ms.
 *
 * Built as Riffle's tray is: the holder's far half is painted before the
 * flyers, its near wall after them, so they stand inside it.
 */
const {
  Cam, fit, proj, facing, rrect, ringAt, run, hull, poly, open, seg,
  tween, tset, tval, tdone, mk, solid, put, register, pointer, disposer,
} = HL;

const BW = 72, BD = 30, BH = 26, WT = 2.2, N = 5, FW = 52, FH = 62, FZ = 6, LIFT = 22;
const REST = [8, 20, 3, 14, 9];
const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;
  const C = Cam(45, 0.5, 2.3);
  fit(C, [[0, 0, 0], [BW, BD, 0], [BW, 0, 0], [0, BD, 0], [0, 0, FZ + FH + 20 + LIFT], [BW, BD, FZ + FH + 20 + LIFT]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  const outer = rrect(0, 0, BW, BD, 9, 6), inner = rrect(WT, WT, BW - WT, BD - WT, 9 - WT, 6);
  // far half: the body and the opening's rim
  mk("path", { d: poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, BH)))), class: "sil" }, g);
  mk("path", { d: poly(ringAt(P, inner, BH)), class: "nf" }, g);

  const fl = REST.map((r, i) => {
    const y = 6 + i * 4.6, grp = mk("g", {}, g);
    return {
      y, r, back: mk("path", { class: "lo" }, grp), face: mk("path", { class: "sil" }, grp),
      art: mk("path", { class: "nf lo" }, grp), z: tween(r), drawn: NaN,
    };
  });

  // near half: the front wall, from the rim's near edge down to the foot
  const iF = LR(ringAt(P, run(inner, front), BH)), oT = LR(ringAt(P, run(outer, front), BH)), oB = LR(ringAt(P, run(outer, front), 0));
  mk("path", { d: poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), class: "fo" }, g);
  mk("path", { d: open(iF), class: "nf" }, g);
  mk("path", { d: open([oT[0], ...oB, oT[oT.length - 1]]), class: "nf sil" }, g);

  const x0 = (BW - FW) / 2, x1 = x0 + FW;
  function draw(f, now) {
    const lift = tval(f.z, now);
    if (lift === f.drawn) return;
    f.drawn = lift;
    const at = (y) => (pts) => pts.map(([x, z]) => P(x, y, FZ + z + lift));
    const sheet = rrect(x0, 0, x1, FH, 1.4, 3).map((q) => [q.u, q.v]);
    f.back.setAttribute("d", poly(at(f.y - 0.8)(sheet)));
    f.face.setAttribute("d", poly(at(f.y)(sheet)));
    // what's printed on it: a picture (hills under a sun), a headline and two lines of text
    const w = at(f.y), sun = [];
    for (let k = 0; k < 16; k++) sun.push([x1 - 12 + 3.2 * Math.cos(k * 0.3927), FH - 10 + 3.2 * Math.sin(k * 0.3927)]);
    f.art.setAttribute("d", poly(w(rrect(x0 + 5, FH - 30, x1 - 5, FH - 5, 0.8, 2).map((q) => [q.u, q.v])))
      + open(w([[x0 + 5, FH - 24], [x0 + 16, FH - 15], [x0 + 23, FH - 21], [x0 + 33, FH - 12], [x1 - 5, FH - 25]]))
      + poly(w(sun))
      + seg(...w([[x0 + 5, FH - 37], [x1 - 14, FH - 37]]))
      + [43, 48].map((z, k) => seg(...w([[x0 + 5, FH - z], [x1 - 5 - k * 12, FH - z]]))).join(""));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const f of fl) { draw(f, now); if (!tdone(f.z, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  // a single row: the flyer whose resting middle is nearest the pointer's x, over the holder
  const mid = fl.map((f) => P(BW / 2, f.y, FZ + FH / 2 + f.r)[0]);
  const top = REST.indexOf(Math.max(...REST));
  const hit = ([sx, sy]) => {
    const lo = P(0, BD, 0)[0], hi = P(BW, 0, 0)[0];
    if (sx < lo || sx > hi || sy > P(BW, BD, 0)[1]) return -1;
    let best = 0;
    mid.forEach((m, i) => { if (Math.abs(m - sx) < Math.abs(mid[best] - sx)) best = i; });
    return best;
  };

  let act = -2;
  function choose(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    fl.forEach((f, i) => {
      const d = Math.abs(i - from);
      tset(f.z, a < 0 ? f.r : i === a ? f.r + LIFT : f.r + Math.max(0, 7 - d * 3), now, d * stag);
      f.face.classList.toggle("hi", a < 0 ? i === top : i === a);
    });
    read.textContent = a < 0 ? "rest" : `flyer ${a + 1}`;
    B.wake();
  }
  choose(-1);

  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { stag = v; }, destroy: bag.dispose };
}

hairline({
  name: "flyers",
  means: "A holder of flyers: the one under the pointer comes up to be handed out, and its neighbours follow.",
  rules: [1, 2, 5, 6],
  range: [20, 45, 80],
  mount,
});
