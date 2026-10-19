"""KidneyCare nutrition rules engine.

Computes age- and sex-specific targets, condition adjustments, and flags for a
day's intake. It does not generate meal plans (that is spec section 6, not built
yet). All values come from nutrition_targets.json and keep their source.
Clinician sign-off is required before any output is used for care.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(HERE, "nutrition_targets.json"), encoding="utf-8") as f:
    T = json.load(f)


def _age_bounds(s):
    """'4-6' -> (4, 6); 2 -> (2, 2)."""
    if isinstance(s, int):
        return s, s
    a, b = s.split("-")
    return int(a), int(b)


def sdi(age_years, sex, weight_kg):
    """Energy and protein SDI for a child aged 2 to 17 years.

    sex: 'male' or 'female'. Returns ranges and the absolute g/day protein.
    Source: PRINT SDI (Shaw et al. 2020), via nutrition_targets.json.
    """
    if sex not in ("male", "female"):
        raise ValueError("sex must be 'male' or 'female'")
    if not 2 <= age_years <= 17.99:
        raise ValueError("use infancy_sdi for under 2 years")
    for row in T["energy_protein_SDI"]["child_2_to_17y"]:
        lo, hi = _age_bounds(row["age_years"])
        if lo <= age_years <= hi:
            e = row[f"energy_{sex}"]
            p_kg = row["protein_kg"]
            return {
                "source": "PRINT SDI, Shaw et al. 2020 (course Module 2)",
                "energy_kcal_per_kg": e,
                "energy_kcal_per_day": [round(e[0] * weight_kg), round(e[1] * weight_kg)],
                "protein_g_per_kg": p_kg,
                "protein_g_per_day_reference": row.get(f"protein_day_{sex}", row.get("protein_day")),
                "protein_g_per_day_weight_based": [round(p_kg[0] * weight_kg, 1), round(p_kg[1] * weight_kg, 1)],
            }
    raise ValueError(f"no SDI row for age {age_years}")


def infancy_sdi(age_months, weight_kg):
    """Energy and protein SDI for birth to 12 months."""
    for row in T["energy_protein_SDI"]["infancy_birth_to_12m"]:
        m = re.match(r"(\d+)", row["age"])
        lo = 0 if row["age"] == "birth" else int(m.group(1))
        hi = lo
        mm = re.search(r"-(\d+)", row["age"])
        if mm:
            hi = int(mm.group(1))
        if lo <= age_months <= hi:
            e, p_kg = row["energy"], row["protein_kg"]
            return {
                "source": "PRINT SDI, Shaw et al. 2020 (course Module 2)",
                "energy_kcal_per_kg": e,
                "energy_kcal_per_day": [round(e[0] * weight_kg), round(e[1] * weight_kg)],
                "protein_g_per_kg": p_kg,
                "protein_g_per_day_reference": row["protein_day"],
                "protein_g_per_day_weight_based": [round(p_kg[0] * weight_kg, 1), round(p_kg[1] * weight_kg, 1)],
            }
    raise ValueError(f"no infancy row for age {age_months} months")


def adjust_targets(base, *, ckd_stage=None, on_dialysis=None, dialysate_glucose_kcal_per_kg=None,
                   poor_growth=False, weight_kg=None):
    """Apply condition adjustments to a base SDI.

    on_dialysis: None, 'PD' or 'HD'.
    dialysate_glucose_kcal_per_kg: PD dextrose energy counted toward total energy.
      Default is the 2026 paper midpoint (8 kcal/kg/day). Course range is 7 to 10.
    Returns the adjusted ranges and a list of notes with their sources.
    """
    notes = []
    e_lo, e_hi = base["energy_kcal_per_kg"]
    p_lo, p_hi = base["protein_g_per_kg"]
    if poor_growth:
        e_lo = e_hi
        notes.append("Poor growth: energy set to the upper end of the SDI (PRINT, Polderman et al. 2026).")
    if on_dialysis == "PD":
        add = T["dialysis"]["PD"]["extra_protein_g_per_kg"]
        p_lo, p_hi = p_lo + add[0], p_hi + add[1]
        notes.append(f"PD: protein add-on {add[0]} to {add[1]} g/kg/day (PRINT). PD losses 0.28 g/kg/day in infants to 0.1 in adolescents (Polderman et al. 2026).")
        dg = dialysate_glucose_kcal_per_kg if dialysate_glucose_kcal_per_kg is not None else 8.0
        notes.append(f"PD: dextrose energy {dg} kcal/kg/day counted toward total energy (Polderman et al. 2026 range 7 to 9; course 7 to 10).")
        e_lo_adj = max(0.0, e_lo - dg)
        e_hi_adj = max(0.0, e_hi - dg)
        notes.append(f"Oral energy target after dextrose: {round(e_lo_adj,1)} to {round(e_hi_adj,1)} kcal/kg/day.")
        oral_e = (round(e_lo_adj, 1), round(e_hi_adj, 1))
    elif on_dialysis == "HD":
        add = T["dialysis"]["HD"]["extra_protein_g_per_kg"]
        p_lo, p_hi = p_lo + add[0], p_hi + add[1]
        notes.append("HD: protein add-on 0.1 g/kg/day (PRINT). Fluid and sodium restricted for interdialytic weight gain.")
        oral_e = (e_lo, e_hi)
    else:
        oral_e = (e_lo, e_hi)
    if ckd_stage in (2, 3):
        notes.append("CKD 2-3: no routine protein restriction (PRINT).")
    if ckd_stage in (4, 5) and on_dialysis is None:
        notes.append("CKD 4-5 not on dialysis: keep age-appropriate protein; restrict only if urea remains high after other causes are excluded.")
    w = weight_kg
    out = {
        "energy_kcal_per_kg_total": [e_lo, e_hi],
        "energy_kcal_per_kg_oral": list(oral_e),
        "protein_g_per_kg": [round(p_lo, 2), round(p_hi, 2)],
        "notes": notes,
    }
    if w:
        out["energy_kcal_per_day_oral"] = [round(oral_e[0] * w), round(oral_e[1] * w)]
        out["protein_g_per_day"] = [round(p_lo * w, 1), round(p_hi * w, 1)]
    return out


def sodium_targets(age_years):
    """Chronic disease risk reduction target for sodium and salt, by age band."""
    bands = [("1-3y", 1, 3), ("4-6y", 4, 6), ("7-8y", 7, 8), ("9-13y", 9, 13), ("14-18y", 14, 18)]
    for key, lo, hi in bands:
        if lo <= age_years <= hi:
            return {
                "source": "PRNT sodium recommendations (course Module 6)",
                "cdrr_sodium_g_per_day": T["sodium"]["CDRR_g_per_day_sodium"][key],
                "cdrr_salt_g_per_day": T["sodium"]["CDRR_g_per_day_salt"][key],
                "band": key,
            }
    return None


def potassium_flags(serum_k_mmol_per_l, age_years):
    """Serum potassium interpretation. Restrict only on measured, persistent hyperkalaemia."""
    ref = T["potassium"]["serum_reference_mmol_per_L"]
    if age_years < 1:
        thr = ref["hyperkalaemia_threshold_infants"]
        lo, hi = ref["infants_1y"]
    else:
        thr = ref["hyperkalaemia_threshold_children"]
        lo, hi = ref["children_adolescents"]
    flags = []
    if serum_k_mmol_per_l is None:
        flags.append("No serum potassium: no dietary potassium restriction should be set.")
    else:
        if serum_k_mmol_per_l >= thr:
            flags.append(f"Hyperkalaemia (>= {thr} mmol/L). Confirm on trend and exclude non-dietary causes first.")
        elif serum_k_mmol_per_l < lo:
            flags.append("Hypokalaemia: correct before any dietary change.")
        else:
            flags.append("Serum potassium in reference range: no potassium restriction indicated.")
    flags.append("Hidden sources to check: salt substitutes, potassium additives (INS 508, 332, 340, 202, 501), coconut water.")
    return flags


def food_lookup(food_db, name):
    """Find a food by id or name (case-insensitive). Returns the record or None."""
    key = name.lower().strip()
    for f in food_db["foods"]:
        if f["id"] == key or f["food"].lower() == key:
            return f
    return None


def intake_summary(items, food_db):
    """Sum potassium and phosphate for a day's intake, per source guide.

    items: list of {"food": name, "portions": n, "source": guide_id (optional)}.
    Totals are kept per guide and never merged across guides.
    """
    totals = {}
    missing = []
    for it in items:
        rec = food_lookup(food_db, it["food"])
        if rec is None:
            missing.append(it["food"])
            continue
        n = it.get("portions", 1)
        for guide, entries in rec["sources"].items():
            if "source" in it and it["source"] != guide:
                continue
            e = entries[0]  # first printed portion for this guide
            nutrient = e["nutrient"]
            key = (guide, nutrient)
            totals[key] = totals.get(key, 0) + e["mg_per_portion"] * n
    out = {}
    for (guide, nutrient), mg in totals.items():
        out.setdefault(nutrient, {})[guide] = round(mg, 1)
    return {"totals_mg_by_nutrient_and_source": out, "unmatched_foods": missing}


def label_check(label_mg):
    """Sodium, potassium or phosphate label-term check per serving, using the course thresholds."""
    t = T["sodium"]["label_thresholds_mg"]
    if label_mg <= t["salt_free"]:
        return "salt-free"
    if label_mg <= t["very_low"]:
        return "very low sodium"
    if label_mg <= t["low"]:
        return "low sodium"
    return "not low sodium"
