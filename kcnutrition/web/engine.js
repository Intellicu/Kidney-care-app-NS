// KidneyCare diet calculator engine (browser and Node). Mirrors kcnutrition/engine.py.
// DATA is injected by export_web.py. Personal use only: IFCT 2017 values (c) ICMR-NIN.
(function (root) {
  "use strict";
  const LABELS = {
    energy_kcal: ["Energy", "kcal"], protein_g: ["Protein", "g"], fat_g: ["Fat", "g"],
    carb_g: ["Carbohydrate", "g"], fibre_g: ["Fibre", "g"], water_g: ["Water in food", "g"],
    calcium_mg: ["Calcium", "mg"], phosphorus_mg: ["Phosphorus", "mg"],
    potassium_mg: ["Potassium", "mg"], sodium_mg: ["Sodium", "mg"], iron_mg: ["Iron", "mg"],
    fluid_ml: ["Fluid", "mL"],
  };
  const SLOT_ORDER = ["early morning", "breakfast", "mid-morning", "lunch", "evening",
    "dinner", "bedtime", "feed", "snack"];

  function norm(t) { return String(t || "").toLowerCase().replace(/,/g, " ").split(/\s+/).filter(Boolean).join(" "); }

  function make(DATA) {
    const N = DATA.nutrients;
    const isRecipe = id => Object.prototype.hasOwnProperty.call(DATA.recipes, id);
    const isFood = id => Object.prototype.hasOwnProperty.call(DATA.foods, id);
    const nameOf = id => isFood(id) ? DATA.foods[id].n : DATA.recipes[id].n;

    function resolve(query) {
      const raw = String(query || "").trim();
      if (!raw) throw new Error("Empty food name.");
      for (const c of [raw, "IFCT:" + raw.toUpperCase()]) if (isFood(c) || isRecipe(c)) return c;
      const q = norm(raw);
      const e = DATA.names[q];
      let ids = [];
      if (e) for (const tier of ["p", "a", "l"]) { if (e[tier] && e[tier].length) { ids = e[tier]; break; } }
      if (ids.length === 1) return ids[0];
      if (ids.length > 1) throw new Error(`'${raw}' matches more than one food: ` +
        ids.map(i => `${i} = ${nameOf(i)}`).join("; ") + ". Pick one.");
      throw new Error(`'${raw}' not found. Try: ` + (search(raw, 6).map(i => `${i} = ${nameOf(i)}`).join("; ") || "none"));
    }

    function search(query, n) {
      const q = norm(query);
      if (!q) return [];
      const words = q.split(" ");
      const scored = new Map();
      for (const [name, e] of Object.entries(DATA.names)) {
        if (!words.every(w => name.includes(w))) continue;
        const score = (name === q ? 0 : name.startsWith(q) ? 1 : 2) + name.length / 1000;
        for (const tier of ["p", "a", "l"]) for (const id of (e[tier] || [])) {
          const s = score + (tier === "p" ? 0 : tier === "a" ? 0.1 : 0.5);
          if (!scored.has(id) || scored.get(id) > s) scored.set(id, s);
        }
      }
      return [...scored.entries()].sort((a, b) => a[1] - b[1]).slice(0, n || 12).map(x => x[0]);
    }

    function units(id) {
      if (isRecipe(id)) {
        const r = DATA.recipes[id];
        const u = ["serving", "batch"];
        if (r.batch) u.push("g");
        if (r.fl) u.push("ml");
        return u;
      }
      const f = DATA.foods[id];
      const u = ["g"];
      if (f.d) u.push("ml");
      const spec = DATA.measures[id] || {};
      for (const k of Object.keys(spec)) if (!u.includes(k)) u.push(k);
      for (const [k, m] of Object.entries(DATA.measures["_"])) {
        if (u.includes(k)) continue;
        if ((m.ml && f.d) || ((k === "tsp" || k === "tbsp") && m.g)) u.push(k);
      }
      return u;
    }

    function toGrams(id, amount, unit) {
      const f = DATA.foods[id];
      const warnings = [];
      if (unit === "g") return [amount, warnings];
      if (unit === "kg") return [amount * 1000, warnings];
      if (unit === "ml" || unit === "l") {
        const ml = amount * (unit === "l" ? 1000 : 1);
        if (f.d) return [ml * f.d, warnings];
        throw new Error(`${f.n} is not a liquid in the database; enter grams.`);
      }
      const spec = (DATA.measures[id] || {})[unit];
      if (spec && spec.g) return [amount * spec.g, warnings];
      const gen = DATA.measures["_"][unit];
      if (gen && gen.ml && f.d) return [amount * gen.ml * f.d, warnings];
      if (gen && gen.g && (unit === "tsp" || unit === "tbsp")) {
        warnings.push(`Generic ${unit} (${gen.g} g) used for ${f.n}; weigh once to calibrate.`);
        return [amount * gen.g, warnings];
      }
      if (gen && gen.ml) throw new Error(`No gram weight for a ${unit} of ${f.n}. A ${unit} is ${gen.ml} mL by volume, but grams depend on the food. Weigh the portion and enter grams.`);
      throw new Error(`Unit '${unit}' cannot be used for ${f.n}; enter grams.`);
    }

    function pRange(p, cls) {
      if (!["animal", "plant", "additive"].includes(cls)) return p === 0 ? [0, 0] : [null, null];
      let lo = Infinity, hi = -Infinity;
      for (const set of Object.values(DATA.p_absorption)) { lo = Math.min(lo, set[cls][0]); hi = Math.max(hi, set[cls][1]); }
      return [p * lo, p * hi];
    }

    function computeEntry(entry) {
      const id = entry.food_id || resolve(entry.food);
      const amount = Number(entry.amount);
      if (!(amount >= 0)) throw new Error("Enter a valid amount.");
      const unit = String(entry.unit || "g").toLowerCase();
      const leached = !!entry.leached && String(entry.leached).toLowerCase() !== "no";
      const base = { date: entry.date || "", slot: String(entry.slot || "").toLowerCase(), food_id: id, food_name: nameOf(id), amount, unit };
      if (isRecipe(id)) {
        const r = DATA.recipes[id];
        let fraction;
        if (unit === "serving") fraction = amount / (r.servings || 1);
        else if (unit === "batch") fraction = amount;
        else if (unit === "g" || unit === "kg") {
          if (!r.batch) throw new Error(`${r.n} has no weighed cooked batch; log it in servings.`);
          fraction = amount * (unit === "kg" ? 1000 : 1) / r.batch;
        } else if (unit === "ml" && r.fl) fraction = amount / (r.batch || r.raw_total);
        else throw new Error(`Log ${r.n} in servings, batch or grams.`);
        const grams = fraction * (r.batch || r.raw_total);
        const nutrients = {};
        N.forEach((n, i) => { nutrients[n] = r.missing.includes(n) ? null : r.v[i] * fraction; });
        const warnings = r.warnings.slice();
        if (leached) warnings.push(`${r.n} marked as leached, but no approved leaching factor exists; potassium shown unleached.`);
        return Object.assign(base, { grams, fluid_ml: r.fl ? grams : 0, nutrients,
          p_absorbable: r.p_unknown ? [null, null] : [r.p_lo * fraction, r.p_hi * fraction],
          warnings, provenance: r.provenance });
      }
      const f = DATA.foods[id];
      const [grams, warnings] = toGrams(id, amount, unit);
      const nutrients = {};
      N.forEach((n, i) => { nutrients[n] = f.v[i] === null ? null : f.v[i] * grams / 100; });
      if (f.st === "raw" && !DATA.no_raw_warning_groups.includes(f.g))
        warnings.push(`IFCT values for ${f.n} are for the raw food; enter the raw weight, or log the cooked dish as a recipe.`);
      if (leached) warnings.push(`${f.n} marked as leached, but no approved leaching factor exists; potassium shown unleached.`);
      const p = nutrients.phosphorus_mg;
      return Object.assign(base, { grams, fluid_ml: f.fl ? grams / f.d : 0, nutrients,
        p_absorbable: p === null ? [null, null] : pRange(p, f.pc), warnings,
        provenance: f.der ? [`${id} ${f.n}: ${f.der}`] : [] });
    }

    function sum(rows) {
      const t = {}; N.forEach(n => { t[n] = 0; });
      const missing = {}; let lo = 0, hi = 0, pInc = 0, fluid = 0;
      for (const r of rows) {
        for (const n of N) { const v = r.nutrients[n]; if (v === null || v === undefined) missing[n] = (missing[n] || 0) + 1; else t[n] += v; }
        if (r.p_absorbable[0] === null) pInc++; else { lo += r.p_absorbable[0]; hi += r.p_absorbable[1]; }
        fluid += r.fluid_ml;
      }
      t.fluid_ml = fluid; t.phosphorus_absorbable_mg = [lo, hi]; t.missing_counts = missing;
      t.p_absorbable_incomplete = pInc; t.n_entries = rows.length;
      return t;
    }

    function assess(total, child) {
      const out = {};
      const w = Number(child && child.weight_kg);
      for (const [n, lim] of Object.entries((child && child.limits) || {})) {
        if (!(n in total)) continue;
        let lo = null, hi = null, basis = "per day";
        if (lim.per_kg && w) {
          lo = lim.per_kg[0] == null ? null : lim.per_kg[0] * w;
          hi = lim.per_kg[1] == null ? null : lim.per_kg[1] * w;
          basis = `${lim.per_kg[0]}-${lim.per_kg[1]} per kg x ${w} kg`;
        } else { lo = lim.min == null ? null : lim.min; hi = lim.max == null ? null : lim.max; }
        if (lo === null && hi === null) continue;
        const v = total[n];
        let status = lo !== null && v < lo ? "below range" : hi !== null && v > hi ? "above range" : "within range";
        const m = total.missing_counts[n] || 0;
        if (m) status += ` (incomplete: ${m} entr${m === 1 ? "y" : "ies"} without a value)`;
        out[n] = { value: v, min: lo, max: hi, basis, status, source: lim.source || "" };
      }
      return out;
    }

    function compute(entries, child) {
      const results = [], errors = [];
      entries.forEach((e, i) => { try { results.push(computeEntry(e)); } catch (err) { errors.push({ row: i + 1, entry: e, error: err.message }); } });
      const byDay = {};
      for (const r of results) (byDay[r.date] = byDay[r.date] || []).push(r);
      const days = {};
      for (const date of Object.keys(byDay).sort()) {
        const rows = byDay[date];
        const meals = {};
        for (const r of rows) (meals[r.slot] = meals[r.slot] || []).push(r);
        const rank = s => SLOT_ORDER.includes(s) ? SLOT_ORDER.indexOf(s) : SLOT_ORDER.length;
        const mealTotals = {};
        Object.keys(meals).sort((a, b) => rank(a) - rank(b)).forEach(s => { mealTotals[s] = sum(meals[s]); });
        const total = sum(rows);
        const w = Number(child && child.weight_kg);
        days[date] = { meals: mealTotals, total,
          per_kg: w ? { energy_kcal_per_kg: total.energy_kcal / w, protein_g_per_kg: total.protein_g / w, fluid_ml_per_kg: total.fluid_ml / w } : {},
          assessment: child ? assess(total, child) : {} };
      }
      return { child, entries: results, errors, days };
    }

    return { resolve, search, units, toGrams, computeEntry, compute, nameOf, LABELS, isRecipe };
  }

  const api = { make, norm, LABELS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.KCEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
