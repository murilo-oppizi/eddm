/**
 * Growing: a bar chart on a rounded plinth, six years from the first running
 * away to the right, each bar taller than the last, a trend line floating over
 * their tops. At rest the whole chart is grown and today's bar is bright. The
 * pointer is time: the bars up to the year under it stand grown, the years
 * after it fall back to stubs, each on its own spring, so moving left to right
 * grows the chart again; the year at the pointer is bright. The slider is the
 * tallest bar.
 */
const {
  Cam, fit, proj, facing, unproj, prism, rings, clamp, open, seg,
  spring, stepS, mk, solid, put, register, pointer, disposer,
} = HL;

const N = 6, SP = 26, FOOT = 15, STUB = 2.5, PB = 5, LIFT = 7;
// the years run away from you to the right (along -y), so the chart climbs up the screen
const EY = N * SP, X0 = -12, X1 = 22;
const yAt = (i) => -(i + 0.5) * SP;
// the share of the tallest bar each year reaches: growth that gathers pace
const SHARE = Array.from({ length: N }, (_, i) => 0.14 + 0.86 * Math.pow(i / (N - 1), 1.7));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let HMAX = value;
  const C = Cam(45, 0.5, 1.62);
  fit(C, [[X0, 8, -PB], [X1, -EY - 8, -PB], [X1, 8, -PB], [X0, -EY - 8, -PB], [5, yAt(N - 1), 76 + LIFT], [5, yAt(0), 20]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the plinth, a baseline and a tick under each year
  const [pr, pi] = rings(X0, -EY - 8, X1, 8, 8, 2.2);
  put(solid(g), prism(P, front, pr, pi, -PB, 0));
  mk("path", { d: seg(P(X1 - 6, 0, 0), P(X1 - 6, -EY, 0)) + Array.from({ length: N }, (_, i) => seg(P(X1 - 6, yAt(i), 0), P(X1 - 3, yAt(i), 0))).join(""), class: "nf lo" }, g);

  // the bars: today's is the farthest, so they're made from the last year back to the first
  const bars = SHARE.map((share, i) => {
    const cy = yAt(i), x0 = 5 - FOOT / 2, y0 = cy - FOOT / 2;
    const [ring, inner] = rings(x0, y0, x0 + FOOT, y0 + FOOT, 3, 1.1);
    return { i, cy, share, ring, inner, sp: spring(share * HMAX, { eps: 0.03 }), drawn: NaN };
  });
  for (let i = N - 1; i >= 0; i--) bars[i].el = solid(g);
  // the trend line, floating a little over the bars so it clears each taller one, a dashed
  // guide down to each top
  const guides = mk("path", { class: "nf dash" }, g);
  const line = mk("path", { class: "nf" }, g);

  function draw() {
    let moved = false;
    for (const b of bars) {
      const h = Math.max(STUB, b.sp.x);
      if (h !== b.drawn) { b.drawn = h; put(b.el, prism(P, front, b.ring, b.inner, 0, h)); moved = true; }
    }
    if (!moved && line.getAttribute("d")) return;
    const tops = bars.map((b) => P(5, b.cy, Math.max(STUB, b.sp.x)));
    const pts = bars.map((b) => P(5, b.cy, Math.max(STUB, b.sp.x) + LIFT));
    guides.setAttribute("d", pts.map((p, i) => seg(p, tops[i])).join(""));
    line.setAttribute("d", open(pts));
  }
  draw();

  const B = register(stage, (dt) => {
    let m = false;
    for (const b of bars) if (stepS(b.sp, dt)) m = true;
    draw();
    return m;
  });
  bag.add(B.unregister);

  let lit = null;
  function light(i) {
    if (lit !== null) bars[lit].el.sil.classList.remove("hi");
    lit = i;
    bars[i].el.sil.classList.add("hi");
  }
  light(N - 1);

  function aim(i) {
    for (const b of bars) b.sp.t = i === null || b.i <= i ? b.share * HMAX : STUB;
    light(i === null ? N - 1 : i);
    read.textContent = i === null ? "rest" : `year ${i + 1}`;
    B.wake();
  }
  bag.add(pointer(stage, {
    // the year under the pointer, read off the ground, which never moves
    move: (p) => aim(clamp(Math.floor(-unproj(C, p[0], p[1], 0)[1] / SP), 0, N - 1)),
    leave: () => aim(null),
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { HMAX = v; for (const b of bars) if (b.sp.t > STUB) b.sp.t = b.share * HMAX; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "countries",
  means: "A bar chart of six years, growing: the pointer is time, and the years after it fall back until you move on.",
  rules: [1, 3, 5, 9],
  range: [52, 66, 76],
  mount,
});
