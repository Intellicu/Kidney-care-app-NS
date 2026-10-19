"""Text (Markdown) and FHIR R5 NutritionIntake output for engine results."""
from __future__ import annotations

from .engine import LABELS, NUTRIENTS

SHOW = ["energy_kcal", "protein_g", "sodium_mg", "potassium_mg", "phosphorus_mg",
        "calcium_mg", "fibre_g", "fluid_ml"]


def _fmt(v, nutrient=None):
    if v is None:
        return "n/a"
    if nutrient in ("protein_g", "fibre_g", "fat_g", "carb_g", "iron_mg"):
        return f"{v:.1f}"
    return f"{v:.0f}"


def markdown(result: dict) -> str:
    child = result.get("child") or {}
    lines = ["# Dietary composition report", ""]
    if child:
        lines.append(f"Child: {child.get('child_id', '')}; age {child.get('age_years', '')} y; "
                     f"sex {child.get('sex', '')}; weight {child.get('weight_kg', '')} kg; "
                     f"{child.get('condition', '')}")
        lines.append("")
    lines.append("Personal use. Values are estimates from IFCT 2017 (raw foods) and local "
                 "entries; clinician sign-off is required before use in care.")
    lines.append("")
    header = "| Meal | " + " | ".join(f"{LABELS[n][0]} ({LABELS[n][1]})" for n in SHOW) + " |"
    sep = "|" + "---|" * (len(SHOW) + 1)
    for date, day in result["days"].items():
        lines += [f"## {date or 'Undated'}", "", header, sep]
        for slot, t in day["meals"].items():
            lines.append(f"| {slot or '-'} | " + " | ".join(_fmt(t[n], n) for n in SHOW) + " |")
        t = day["total"]
        lines.append("| **Day total** | " + " | ".join(f"**{_fmt(t[n], n)}**" for n in SHOW) + " |")
        lo, hi = t["phosphorus_absorbable_mg"]
        lines += ["", f"Estimated absorbable phosphorus: {lo:.0f} to {hi:.0f} mg "
                  "(range across the Polderman 2026 and PRINT course tiers"
                  + (f"; {t['p_absorbable_incomplete']} entries without a value" if t["p_absorbable_incomplete"] else "")
                  + ")."]
        pk = day.get("per_kg") or {}
        if pk:
            lines.append(f"Per kg: energy {pk['energy_kcal_per_kg']:.0f} kcal/kg; protein "
                         f"{pk['protein_g_per_kg']:.2f} g/kg; fluid {pk['fluid_ml_per_kg']:.0f} mL/kg.")
        if day.get("assessment"):
            lines += ["", "| Against prescription | Value | Range | Status | Source |", "|---|---|---|---|---|"]
            for n, a in day["assessment"].items():
                rng = f"{_fmt(a['min'], n) if a['min'] is not None else '-'} to {_fmt(a['max'], n) if a['max'] is not None else '-'}"
                lines.append(f"| {LABELS.get(n, (n, ''))[0]} | {_fmt(a['value'], n)} {LABELS.get(n, ('', ''))[1]} | "
                             f"{rng} | {a['status']} | {a['source']} |")
        missing = {k: v for k, v in t["missing_counts"].items() if v}
        if missing:
            lines += ["", "Missing values (not counted as zero): "
                      + "; ".join(f"{LABELS[k][0]} in {v} entr{'y' if v == 1 else 'ies'}" for k, v in missing.items())]
        lines.append("")

    lines += ["## Entries", "", "| Date | Meal | Food | Amount | Grams | Energy | Protein | Na | K | P |",
              "|---|---|---|---|---|---|---|---|---|---|"]
    for e in result["entries"]:
        n = e["nutrients"]
        lines.append(f"| {e['date']} | {e['slot']} | {e['food_name']} ({e['food_id']}) | "
                     f"{e['amount']:g} {e['unit']} | {e['grams']:.0f} | {_fmt(n['energy_kcal'])} | "
                     f"{_fmt(n['protein_g'], 'protein_g')} | {_fmt(n['sodium_mg'])} | "
                     f"{_fmt(n['potassium_mg'])} | {_fmt(n['phosphorus_mg'])} |")
    warnings = sorted({w for e in result["entries"] for w in e["warnings"]})
    prov = sorted({p for e in result["entries"] for p in e["provenance"]})
    if result["errors"]:
        lines += ["", "## Entries not calculated", ""]
        lines += [f"- Row {x['row']} ({x['entry'].get('food', '')}): {x['error']}" for x in result["errors"]]
    if warnings:
        lines += ["", "## Warnings", ""] + [f"- {w}" for w in warnings]
    if prov:
        lines += ["", "## Values that are not IFCT-analysed", ""] + [f"- {p}" for p in prov]
    lines += ["", "Sources: IFCT 2017 (ICMR-NIN, Hyderabad), via github.com/ifct2017/compositions; "
              "household measures from ICMR-NIN Dietary Guidelines for Indians 2024, Annexures I and II."]
    return "\n".join(lines) + "\n"


def fhir_bundle(result: dict) -> dict:
    """One FHIR R5 NutritionIntake per meal (trial-use resource), in a collection Bundle."""
    child = result.get("child") or {}
    subject = {"reference": f"Patient/{child.get('child_id', 'unknown')}"}
    by_meal = {}
    for e in result["entries"]:
        by_meal.setdefault((e["date"], e["slot"]), []).append(e)
    entries = []
    for (date, slot), rows in by_meal.items():
        totals = {n: sum(r["nutrients"][n] for r in rows if r["nutrients"][n] is not None)
                  for n in NUTRIENTS}
        entries.append({"resource": {
            "resourceType": "NutritionIntake",
            "status": "completed",
            "subject": subject,
            "occurrenceDateTime": date,
            "code": {"text": slot},
            "consumedItem": [{
                "type": {"text": "food"},
                "nutritionProduct": {"concept": {"text": r["food_name"],
                                                 "coding": [{"system": "urn:kidneycare:food-id",
                                                             "code": r["food_id"]}]}},
                "amount": {"value": round(r["grams"], 1), "unit": "g"},
            } for r in rows],
            "ingredientLabel": [{
                "nutrient": {"concept": {"text": LABELS[n][0]}},
                "amount": {"value": round(v, 1), "unit": LABELS[n][1]},
            } for n, v in totals.items()],
        }})
    return {"resourceType": "Bundle", "type": "collection", "entry": entries}
