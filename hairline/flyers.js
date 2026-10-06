/**
 * Flyers: a street team's crate of seven printed flyers, leaning back in it, each
 * with its picture, headline and text. At rest they all lean back alike, none
 * chosen. The flyer under the pointer stands up and
 * lifts out of the crate; the ones in front lean forward and the ones behind
 * lean back, staggered outwards from it. The slider is the stagger, in ms.
 *
 * Built on Riffle's pattern: tweens, a stagger by distance, and a hit test on
 * static bands along the flyers' resting top edges.
 */
const {
  Cam, clamp, facing, fillet, fit, hull, open, poly, proj, rad, ringAt, rrect, run, seg,
  tdone, tset, tval, tween, disposer, mk, pointer, reflect, register,
} = HL;

const N = 7, W = 62, H = 74, G = 12, TK = 1.2;
const REST = -14, BACK = -26, FWD = 18, LIFT = 22;
const X0 = -6, X1 = W + 6, Y0 = -10, Y1 = (N - 1) * G + 10, WH = 27, WR = 6, WT = 2.4;

const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());

/** The crate: `far` is painted before the flyers, `near` after them; each entry is [d, class]. */
function crate(P, front, outer, inner) {
  const far = [
    [poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), "sil"],
    [poly(ringAt(P, inner, WH)), "nf"],
    [open(ringAt(P, run(inner, (q) => !front(q)), 2.5)), "nf lo"],
  ];
  const iF = LR(ringAt(P, run(inner, front), WH)), oT = LR(ringAt(P, run(outer, front), WH)), oB = LR(ringAt(P, run(outer, front), 0));
  const onFront = (ring) => ring.map((q) => P(q.u, Y1, q.v)), onSide = (ring) => ring.map((q) => P(X1, q.u, q.v));
  const near = [
    [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), "fo"],
    [open(oT), "nf lo"],
    [open(iF), "nf"],
    [open([oT[0], ...oB, oT[oT.length - 1]]), "nf sil"],
    // the crate's slats, and a hand hole in each end
    [open(LR(ringAt(P, run(outer, front), 9))), "nf lo"],
    [poly(onSide(rrect((Y0 + Y1) / 2 - 10, 13, (Y0 + Y1) / 2 + 10, 19, 3, 5))), "nf"],
    [poly(onFront(rrect((X0 + X1) / 2 - 9, 13, (X0 + X1) / 2 + 9, 19, 3, 5))), "nf"],
  ];
  return { far, near };
}

/** Flyer i leaning th degrees and lifted: its paper, and what's printed on its face. */
function pose(P, i, th, lift) {
  const yb = i * G, s = Math.sin(rad(th)), c = Math.cos(rad(th));
  const w = (u, v) => P(u, yb + v * s, v * c + lift + 3);
  const wb = (u, v) => P(u, yb + v * s - TK * c, v * c + TK * s + lift + 3);
  const sheet = fillet([[0, 0], [W, 0], [W, H], [0, H]], [1.6, 1.6, 1.6, 1.6]);
  const pic = [[6, H - 6], [W - 6, H - 6], [W - 6, H - 38], [6, H - 38]];
  const sun = [];
  for (let k = 0; k < 16; k++) sun.push(w(W - 15 + 3.6 * Math.cos(k * 0.3927), H - 13 + 3.6 * Math.sin(k * 0.3927)));
  return {
    back: poly(sheet.map((p) => wb(p[0], p[1]))),
    face: poly(sheet.map((p) => w(p[0], p[1]))),
    pic: poly(pic.map((p) => w(p[0], p[1]))) + open([[6, H - 30], [18, H - 21], [27, H - 28], [37, H - 19], [W - 6, H - 33]].map((p) => w(p[0], p[1]))) + poly(sun),
    head: seg(w(6, H - 46), w(W - 18, H - 46)),
    text: [53, 59, 65].map((v, k) => seg(w(6, H - v), w(W - 6 - k * 10, H - v))).join(""),
  };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;
  const C = Cam(45, 0.5, 1.66);
  fit(C, [[X0, Y0, 0], [X1, Y1, -10], [X1, Y0, 0], [X0, Y1, 0], [X0, Y0, H + 3], [X1, Y0, H + LIFT + 3]], 200, 166);
  const P = proj(C), front = facing(C);
  const outer = rrect(X0, Y0, X1, Y1, WR, 6), inner = rrect(X0 + WT, Y0 + WT, X1 - WT, Y1 - WT, WR - WT, 6);
  const paths = crate(P, front, outer, inner);

  const g = mk("g", {}, svg);
  reflect(svg, g, P, front, outer, 0, 16);
  for (const [d, cls] of paths.far) mk("path", { d, class: cls }, g);

  const fl = [];
  for (let i = 0; i < N; i++) {
    const grp = mk("g", {}, g);
    const rest = [REST, 0];
    fl.push({
      rest, back: mk("path", { class: "lo" }, grp), face: mk("path", { class: "sil" }, grp),
      pic: mk("path", { class: "nf lo" }, grp), head: mk("path", { class: "nf" }, grp), text: mk("path", { class: "nf lo" }, grp),
      a: tween(rest[0]), z: tween(rest[1]),
    });
  }
  for (const [d, cls] of paths.near) mk("path", { d, class: cls }, g);

  // hit bands: oblique strips along the RESTING top edges; they never move, and nothing draws them
  const top = (i) => P(W / 2, i * G + H * Math.sin(rad(REST)), H * Math.cos(rad(REST)));
  const c0 = top(0), c1 = top(1), dd = [c1[0] - c0[0], c1[1] - c0[1]];
  const px0 = P(0, 0, 0), px1 = P(1, 0, 0), ex = [px1[0] - px0[0], px1[1] - px0[1]];
  const HALF = W / 2 + 6, det = dd[0] * ex[1] - dd[1] * ex[0];
  function hit([x, y]) {
    const qx = x - c0[0], qy = y - c0[1];
    const s = (qx * ex[1] - qy * ex[0]) / det, r = (dd[0] * qy - dd[1] * qx) / det;
    if (Math.abs(r) > HALF || s < -0.5 || s > N + 1) return -1;
    return clamp(Math.round(s), 0, N - 1);
  }

  const drawn = fl.map(() => "");
  function draw(i, th, lift) {
    const key = th + "," + lift;
    if (key === drawn[i]) return;
    drawn[i] = key;
    const f = fl[i], q = pose(P, i, th, lift);
    f.back.setAttribute("d", q.back);
    f.face.setAttribute("d", q.face);
    f.pic.setAttribute("d", q.pic);
    f.head.setAttribute("d", q.head);
    f.text.setAttribute("d", q.text);
  }
  const B = register(stage, (_dt, now) => {
    let moving = false;
    fl.forEach((f, i) => { draw(i, tval(f.a, now), tval(f.z, now)); if (!tdone(f.a, now) || !tdone(f.z, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 0);
    act = a;
    fl.forEach((f, i) => {
      const delay = Math.abs(i - from) * stag;
      const th = a < 0 ? f.rest[0] : i < a ? BACK : i > a ? FWD : 0;
      tset(f.a, th, now, delay); tset(f.z, a < 0 ? f.rest[1] : a === i ? LIFT : 0, now, delay);
      const lit = i === a;
      f.face.classList.toggle("hi", lit); f.head.classList.toggle("hi", lit);
    });
    read.textContent = a < 0 ? "rest" : `flyer ${String(a + 1).padStart(2, "0")}`;
    B.wake();
  }
  setActive(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { stag = v; }, destroy: bag.dispose };
}

hairline({
  name: "flyers",
  means: "A crate of printed flyers: the one under the pointer stands up to be handed out, and the rest lean away in turn.",
  rules: [1, 2, 5, 6],
  range: [0, 40, 90],
  mount,
});
