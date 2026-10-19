"""Export the food database into a single-file browser calculator (personal use).

  python -m kcnutrition.export_web            -> out/kidneycare_diet_calculator.html
                                                 out/web_data.json (for the Node parity test)

Recipe totals are precomputed with the Python engine so both front ends share one recipe
calculation.
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from .engine import NUTRIENTS, Engine, FoodDB, LABELS

ROOT = Path(__file__).resolve().parent.parent
WEB = Path(__file__).resolve().parent / "web"
OUT = ROOT / "out"
NO_RAW_WARNING = ["Fruits", "Milk and Milk Products", "Nuts and Oil Seeds",
                  "Edible Oils and Fats", "Sugars", "Miscellaneous Foods"]


def build_data(eng: Engine) -> dict:
    db = eng.db
    hindi = {}
    for r in db.con.execute("SELECT food_id, name FROM food_name WHERE lang='Hindi'"):
        hindi.setdefault(r["food_id"], r["name"])
    foods = {}
    for fid, f in db.foods.items():
        vals = db.values[fid]
        v = [None if vals.get(n, (None,))[0] is None else round(vals[n][0], 5) for n in NUTRIENTS]
        by_der = defaultdict(list)
        for n in NUTRIENTS:
            val, der = vals.get(n, (None, None))
            if val is not None and der and der != "analysed":
                by_der[der].append(n)
        n_present = sum(1 for x in v if x is not None)
        der_text = "; ".join(
            ("all values " if len(ns) == n_present else ", ".join(LABELS[n][0].lower() for n in ns) + " ") + der
            for der, ns in by_der.items())
        foods[fid] = {"n": f["name"], "g": f["food_group"], "pc": f["p_class"],
                      "fl": bool(f["is_fluid"]), "d": f["density_g_per_ml"], "st": f["state"],
                      "v": v, "der": der_text or None, "note": f["note"],
                      "h": hindi.get(fid)}
    names = {}
    for tier_key, tier in (("p", "primary"), ("a", "alias"), ("l", "local")):
        for name, ids in db.tiers[tier].items():
            names.setdefault(name, {})[tier_key] = sorted(ids)
    measures = {"_": {}}
    for fid, units in db.measures.items():
        key = fid if fid else "_"
        for unit, m in units.items():
            measures.setdefault(key, {})[unit] = {"g": m["grams"], "ml": m["ml"], "src": m["source"],
                                                  "note": m["note"]}
    recipes = {}
    for rid, r in db.recipes.items():
        res = eng._compute_recipe(rid, rid, 1, "batch", False, "", "")
        p_lo, p_hi = res.p_absorbable
        recipes[rid] = {"n": r["name"], "status": r["status"], "servings": r["servings"],
                        "batch": r["batch_cooked_g"], "fl": bool(r["is_fluid"]),
                        "raw_total": res.grams, "v": [res.nutrients[n] or 0 for n in NUTRIENTS],
                        "missing": res.missing, "p_lo": p_lo or 0, "p_hi": p_hi or 0,
                        "p_unknown": p_lo is None, "warnings": res.warnings,
                        "provenance": res.provenance,
                        "ingredients": [f"{i['raw_g']:g} g {db.display_name(i['food_id'])}"
                                        for i in db.ingredients[rid]]}
    p_abs = {k: v for k, v in eng.config["phosphorus_absorption"].items() if not k.startswith("_")}
    return {"nutrients": NUTRIENTS, "foods": foods, "names": names, "measures": measures,
            "recipes": recipes, "p_absorption": p_abs, "no_raw_warning_groups": NO_RAW_WARNING}


def main():
    OUT.mkdir(exist_ok=True)
    data = build_data(Engine(FoodDB()))
    (OUT / "web_data.json").write_text(json.dumps(data), encoding="utf-8")
    html = (WEB / "template.html").read_text(encoding="utf-8")
    html = html.replace("/*__ENGINE__*/", (WEB / "engine.js").read_text(encoding="utf-8"))
    html = html.replace("/*__DATA__*/", "window.KC_DATA = " + json.dumps(data, separators=(",", ":")) + ";")
    path = OUT / "kidneycare_diet_calculator.html"
    path.write_text(html, encoding="utf-8")
    print(f"Wrote {path} ({path.stat().st_size // 1024} KB)")
    app = (WEB / "app_template.html").read_text(encoding="utf-8")
    app = app.replace("/*__ENGINE__*/", (WEB / "engine.js").read_text(encoding="utf-8"))
    app = app.replace("/*__DATA__*/", "window.KC_DATA = " + json.dumps(data, separators=(",", ":")) + ";")
    app_path = OUT / "kidneycare_nutrition_app.html"
    app_path.write_text(app, encoding="utf-8")
    print(f"Wrote {app_path} ({app_path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
