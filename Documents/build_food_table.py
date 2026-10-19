"""Build food_table.json from indian_renal_food_tables.csv.

Each record keeps its source guide, so a value is never merged across guides.
Values are per printed portion and per 100 g, as given by the guide.
"""
import csv, json, re, sys, unicodedata
from collections import OrderedDict

SRC = sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/outputs/indian_renal_food_tables.csv"
OUT = sys.argv[2] if len(sys.argv) > 2 else "food_table.json"

GUIDES = {
    "K_general_2023": {"nutrient": "potassium", "title": "Indian Renal Food Guide, Potassium (general)", "date": "May 2023"},
    "K_north_2023": {"nutrient": "potassium", "title": "Indian Renal Food Guide, Potassium (North Indian diet)", "date": "June 2023"},
    "K_west_central_2023": {"nutrient": "potassium", "title": "Food guide for managing potassium intake, West and Central Indian diet", "date": "Aug 2023"},
    "K_south_2024": {"nutrient": "potassium", "title": "Food guide for managing potassium intake, South Indian diet", "date": "Aug 2024"},
    "P_phosphate_guide_2026": {"nutrient": "phosphate", "title": "Indian Renal Food Guide, Phosphate", "date": "Feb 2026"},
}

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def to_float(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None

def portion_grams(portion):
    m = re.match(r"\s*(\d+(?:\.\d+)?)\s*g", portion or "")
    return float(m.group(1)) if m else None

records = OrderedDict()
issues = []
with open(SRC, newline="", encoding="utf-8") as f:
    for i, r in enumerate(csv.DictReader(f), start=2):
        guide = r["guide"]
        if guide not in GUIDES:
            issues.append((i, "unknown guide", guide))
            continue
        mg_p, mg_100 = to_float(r["mg_per_portion"]), to_float(r["mg_per_100g"])
        if mg_p is None or mg_100 is None:
            issues.append((i, "missing value", r["food"]))
            continue
        cat = r["category"] or None
        if cat == "Low":
            cat = "Lower"
        key = slug(r["food"])
        rec = records.setdefault(key, {"food": r["food"], "id": key, "sources": {}})
        g = GUIDES[guide]
        rec["sources"].setdefault(guide, []).append({
            "nutrient": r["nutrient"] if "nutrient" in r else g["nutrient"],
            "guide_title": g["title"],
            "guide_date": g["date"],
            "portion": r["portion"],
            "portion_g": portion_grams(r["portion"]),
            "mg_per_portion": mg_p,
            "mg_per_100g": mg_100,
            "category_printed": cat,
            "notes": r["notes"] or None,
        })

out = {
    "_meta": {
        "built_from": SRC.split("/")[-1],
        "record_count": len(records),
        "row_count": sum(len(v) for rec in records.values() for v in rec["sources"].values()),
        "guides": GUIDES,
        "rules": [
            "Values are never averaged across guides. Each source keeps its own values.",
            "Category bands for West/Central and South guides are derived from printed mg bands and are flagged in notes.",
            "Clinician sign-off required before use in care.",
        ],
        "issues": issues,
    },
    "foods": list(records.values()),
}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print("foods:", len(records), "rows:", out["_meta"]["row_count"], "issues:", len(issues))
