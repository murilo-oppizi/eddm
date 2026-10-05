// Draws the About page's dotted world map once, ahead of time, into
// src/content/world-map.json (the dot positions, and a pin spot per country), so the
// site ships ~30KB of dots instead of a world-shapes library. Uses dotted-map (MIT).
// Run again after changing the countries: node scripts/generate-world-map.mjs
// The countries mirror about.world.regions in src/content/site.ts: [code, lat, lng].
import fs from "node:fs";
import DottedMap from "dotted-map";

const countries = [
  ["US", 40.68, -73.94], ["CA", 43.65, -79.38], ["BR", -23.55, -46.63], ["AR", -34.6, -58.38],
  ["GB", 51.51, -0.13], ["FR", 48.86, 2.35], ["DE", 52.52, 13.4], ["ES", 40.42, -3.7],
  ["PT", 38.72, -9.14], ["NL", 52.37, 4.9], ["BE", 50.85, 4.35], ["PL", 52.23, 21.01],
  ["AU", -33.87, 151.21], ["NZ", -36.85, 174.76],
];

const map = new DottedMap({ height: 56, grid: "diagonal" });
const round = (n) => +n.toFixed(2);
const pins = Object.fromEntries(
  countries.map(([id, lat, lng]) => {
    const p = map.getPin({ lat, lng });
    return [id, [round(p.x), round(p.y)]];
  })
);
const points = map.getPoints();
const out = {
  width: round(Math.max(...points.map((p) => p.x)) + 1),
  height: round(Math.max(...points.map((p) => p.y)) + 1),
  points: points.map((p) => [round(p.x), round(p.y)]),
  pins,
};
fs.writeFileSync(new URL("../src/content/world-map.json", import.meta.url), JSON.stringify(out));
console.log(`${out.points.length} dots, ${countries.length} pins`);
