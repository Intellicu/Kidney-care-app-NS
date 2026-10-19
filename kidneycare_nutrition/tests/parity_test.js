// Parity check: the browser engine must give the same totals as the Python engine.
// Run after: python -m kcnutrition.export_web && python -m kcnutrition.cli calc examples/meals_example.csv --child examples/child_example.json --json out/result.json
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const { make } = require(path.join(root, "kcnutrition/web/engine.js"));
const data = JSON.parse(fs.readFileSync(path.join(root, "out/web_data.json"), "utf8"));
const py = JSON.parse(fs.readFileSync(path.join(root, "out/result.json"), "utf8"));
const E = make(data);

const lines = fs.readFileSync(path.join(root, "examples/meals_example.csv"), "utf8").trim().split(/\r?\n/);
const hdr = lines.shift().split(",");
const entries = lines.map(l => { const v = l.split(","); const o = {}; hdr.forEach((k, i) => o[k] = v[i]); return o; });
const js = E.compute(entries, py.child);

let fails = 0;
for (const [date, day] of Object.entries(py.days)) {
  const jd = js.days[date];
  for (const k of [...data.nutrients, "fluid_ml"]) {
    const a = day.total[k], b = jd.total[k];
    if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(a))) { fails++; console.log(`MISMATCH ${date} ${k}: py=${a} js=${b}`); }
  }
  const [pl, ph] = day.total.phosphorus_absorbable_mg, [jl, jh] = jd.total.phosphorus_absorbable_mg;
  if (Math.abs(pl - jl) > 1e-6 || Math.abs(ph - jh) > 1e-6) { fails++; console.log("MISMATCH absorbable P"); }
  for (const [n, a] of Object.entries(day.assessment)) if (a.status !== jd.assessment[n].status) { fails++; console.log(`MISMATCH status ${n}`); }
}
if (py.errors.length !== js.errors.length) { fails++; console.log(`MISMATCH errors py=${py.errors.length} js=${js.errors.length}`); }
console.log(fails ? `${fails} mismatches` : `Parity OK: ${js.entries.length} entries, ${js.errors.length} rejected, totals identical`);
process.exit(fails ? 1 : 0);
