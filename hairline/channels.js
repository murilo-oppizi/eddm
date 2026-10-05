/**
 * Channels: one round platform carrying the three: a letter (direct mail), a
 * parcel (package inserts) and a small stack of flyers. At rest the parcel is
 * in front and bright. Point where a channel sits at rest and the platform
 * turns it to the front, on the 700ms curve, and lifts it a little. The hit
 * areas are the three resting sectors, which never turn. The slider is the
 * lift.
 */
const {
  Cam, fit, proj, facing, unproj, prism, rrect, circ, poly, open, seg,
  tween, tset, tval, tdone, mk, solid, put, register, pointer, disposer,
} = HL;

const R = 56, RB = 60, RI = 31, FRONT = Math.PI / 4, TAU = Math.PI * 2;
const NAMES = ["inserts", "mail", "flyers"];
const AT = [FRONT, FRONT + TAU / 3, FRONT - TAU / 3];

/** A ring turned by a about the origin, then moved by (dx, dy): its normals turn with it. */
const turn = (ring, a, dx = 0, dy = 0) => {
  const c = Math.cos(a), s = Math.sin(a);
  return ring.map((q) => ({ u: dx + q.u * c - q.v * s, v: dy + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c }));
};
const local = (ring) => ring.map((q) => [q.u, q.v]);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let LIFT = value;
  const C = Cam(45, 0.5, 2.3);
  fit(C, [[-RB, -RB, -14], [RB, RB, -14], [RB, -RB, -14], [-RB, RB, -14], [0, -RB, 34], [-RB, 0, 34]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the base, which stays, and the platform on it, which turns: both round, so they are drawn once
  put(solid(g), prism(P, front, circ(RB, 48), circ(RB - 2, 48), -14, -8));
  put(solid(g), prism(P, front, circ(R, 48), circ(R - 2.2, 48), -8, 0));
  mk("path", { d: poly(circ(R - 12, 48).map((q) => P(q.u, q.v, 0))), class: "nf lo" }, g);

  // each channel: its shapes in its own frame (x along the platform's radius), and how to draw them
  const items = [
    { // a parcel, taped
      parts: [{ ring: rrect(-15, -12, 15, 12, 3.4, 5), inner: rrect(-13.4, -10.4, 13.4, 10.4, 2, 5), z0: 0, z1: 20 }],
      marks: (w) => seg(w(-15, -2.6, 20), w(15, -2.6, 20)) + seg(w(-15, 2.6, 20), w(15, 2.6, 20)),
    },
    { // a letter, its flap and its stamp
      parts: [{ ring: rrect(-18, -13, 18, 13, 1.8, 3), inner: rrect(-17.4, -12.4, 17.4, 12.4, 1.2, 3), z0: 0, z1: 1.8 }],
      marks: (w) => open([w(-17, -12, 1.8), w(0, 1.5, 1.8), w(17, -12, 1.8)]) + poly(local(rrect(10, 4, 16, 10.5, 0.8, 2)).map(([x, y]) => w(x, y, 1.8))),
    },
    { // three flyers, a little uneven, the top one printed
      parts: [0, 1, 2].map((k) => ({ ring: turn(rrect(-13, -17, 13, 17, 1.2, 3), (k - 1) * 0.09, k * 0.8, -k * 0.6), inner: null, z0: k * 2.4, z1: k * 2.4 + 1 })),
      marks: (w) => poly(local(turn(rrect(-9, -13, 9, 1, 0.8, 2), 0.09, 1.6, -1.2)).map(([x, y]) => w(x, y, 5.8)))
        + seg(w(-7, 6, 5.8), w(10, 6, 5.8)) + seg(w(-7, 10, 5.8), w(6, 10, 5.8)),
    },
  ].map((it, i) => {
    const grp = mk("g", {}, g);
    return { ...it, i, grp, solids: it.parts.map(() => solid(grp)), mk: mk("path", { class: "nf lo" }, grp), z: tween(0) };
  });

  const rot = tween(0);
  let drawn = NaN, order = "";
  function draw(now) {
    const a = tval(rot, now), lifts = items.map((it) => tval(it.z, now)), key = a + "," + lifts.join();
    if (key === drawn) return;
    drawn = key;
    for (const it of items) {
      const th = AT[it.i] + a, cx = RI * Math.cos(th), cy = RI * Math.sin(th), lift = lifts[it.i];
      it.parts.forEach((p, k) => {
        // each keeps its own heading as the platform turns: square to the room when in front
        const ring = turn(p.ring, th - FRONT, cx, cy), inner = turn(p.inner || p.ring, th - FRONT, cx, cy);
        put(it.solids[k], prism(P, front, ring, inner, p.z0 + lift, p.z1 + lift));
        if (!p.inner) it.solids[k].cr.setAttribute("d", "");
      });
      const c = Math.cos(th - FRONT), s = Math.sin(th - FRONT);
      it.mk.setAttribute("d", it.marks((x, y, z) => P(cx + x * c - y * s, cy + x * s + y * c, z + lift)));
      it.depth = cx + cy;
    }
    // far to near: move the groups only when the order changes
    const sorted = items.slice().sort((p, q) => p.depth - q.depth), k = sorted.map((it) => it.i).join();
    if (k !== order) { order = k; sorted.forEach((it) => g.appendChild(it.grp)); }
  }

  const B = register(stage, (_dt, now) => {
    draw(now);
    return !tdone(rot, now) || items.some((it) => !tdone(it.z, now));
  });
  bag.add(B.unregister);

  let act = -2, aim = 0;
  const topSolid = (it) => it.solids[it.solids.length - 1];
  function choose(a) {
    if (a === act) return;
    act = a;
    const now = performance.now(), want = a < 0 ? 0 : FRONT - AT[a];
    // the shortest way round, from where it is headed now
    let t = want;
    while (t - aim > Math.PI) t -= TAU;
    while (aim - t > Math.PI) t += TAU;
    aim = t;
    tset(rot, t, now, 0);
    items.forEach((it) => {
      tset(it.z, it.i === a ? LIFT : 0, now, 0);
      topSolid(it).sil.classList.toggle("hi", a < 0 ? it.i === 0 : it.i === a);
    });
    read.textContent = a < 0 ? "rest" : NAMES[a];
    B.wake();
  }
  choose(-1);

  // the sector the pointer is in, around the platform's middle, by where each channel sits at rest
  const hit = ([sx, sy]) => {
    const [x, y] = unproj(C, sx, sy, 0);
    if (Math.hypot(x, y) > RB + 16) return -1;
    let best = 0, bd = Infinity;
    AT.forEach((t, i) => {
      const d = Math.abs(Math.atan2(Math.sin(Math.atan2(y, x) - t), Math.cos(Math.atan2(y, x) - t)));
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };

  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { LIFT = v; }, destroy: bag.dispose };
}

hairline({
  name: "channels",
  means: "Three channels on one platform: point where one sits and the platform turns it to the front.",
  rules: [1, 6, 8, 9],
  range: [0, 6, 12],
  mount,
});
