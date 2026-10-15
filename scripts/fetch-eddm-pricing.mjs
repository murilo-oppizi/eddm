// Fetches Oppizi's EDDM price table from the platform (the Developer API's "EDDM cost quote",
// POST /ai/calculators/eddm) and writes it to src/content/eddm-pricing.json, which the price
// meter and the site's example prices read. The platform prices in tiers: the per-piece price
// is the one of the largest tier at or below the volume, and the total is that times the volume.
//
// Run it when the platform's table changes (its tableVersion goes up):
//   OPPIZI_ADMIN_KEY=<id>.<secret> node scripts/fetch-eddm-pricing.mjs
// The key is read from the environment only. Never write it into this repo: it's public.
import { writeFileSync } from "node:fs";

const KEY = process.env.OPPIZI_ADMIN_KEY;
const BASE = process.env.DEVELOPER_API_BASE ?? "https://developer-api.oppizi.com";
if (!KEY) {
  console.error("Set OPPIZI_ADMIN_KEY (the Developer API key) to run this.");
  process.exit(1);
}
const headers = { "x-oppizi-admin-key": KEY, "content-type": "application/json" };

async function call(path, body) {
  const res = await fetch(BASE + path, body ? { method: "POST", headers, body: JSON.stringify(body) } : { headers });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return (await res.json()).data;
}
const quote = (format, volume) => call("/ai/calculators/eddm", { format, volume, includeProviders: false });

const options = await call("/ai/calculators/eddm/options");
const formats = options.formats.map((f) => f.key);

// The API names a quote's tier but doesn't list them, so find where tiers start: every 500
// pieces up to 30,000, then every 5,000 up to the table's maximum.
const probes = [];
for (let v = options.minVolume; v <= 30000; v += 500) probes.push(v);
for (let v = 35000; v <= options.maxVolume; v += 5000) probes.push(v);
const starts = new Set();
for (const v of probes) starts.add((await quote(formats[0], v)).tierApplied.key);
const tiers = [...starts].sort((a, b) => a - b);

// Every format's per-piece price at every tier start
const perUnit = {};
for (const f of formats) perUnit[f] = await Promise.all(tiers.map(async (t) => (await quote(f, t)).perUnitPrice));

const table = {
  source: `${BASE}/ai/calculators/eddm`,
  country: options.country,
  currency: options.currency,
  tableVersion: options.tableVersion,
  updatedAt: options.updatedAt,
  fetchedAt: new Date().toISOString().slice(0, 10),
  minVolume: options.minVolume,
  maxVolume: options.maxVolume,
  formats: options.formats,
  tiers,
  perUnit,
};
writeFileSync(new URL("../src/content/eddm-pricing.json", import.meta.url), JSON.stringify(table, null, 2) + "\n");
console.log(`Wrote table v${table.tableVersion} (${table.updatedAt}): ${tiers.length} tiers × ${formats.length} formats`);
