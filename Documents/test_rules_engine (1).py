import rules_engine as re_
from rules_engine import sdi, adjust_targets, infancy_sdi, potassium_flags, sodium_targets, intake_summary, label_check
import json

def close(a, b, tol=0.01):
    return abs(a - b) <= tol

def test_spec_examples():
    # Spec section 2: 6-year-old girl, energy 64 to 90 kcal/kg/day, protein 0.85 to 0.95 g/kg/day (16 to 22 g/day)
    r = sdi(6, "female", 20)
    assert r["energy_kcal_per_kg"] == [64, 90], r
    assert r["protein_g_per_kg"] == [0.85, 0.95]
    assert r["protein_g_per_day_reference"] == [16, 22]
    # 10-year-old boy, energy 55 to 69 kcal/kg/day, protein 26 to 40 g/day
    r = sdi(10, "male", 30)
    assert r["energy_kcal_per_kg"] == [55, 69], r
    assert r["protein_g_per_day_reference"] == [26, 40]

def test_age_bounds_cover_all_years():
    for age in range(2, 18):
        for sex in ("male", "female"):
            sdi(age, sex, 25)

def test_infancy():
    r = infancy_sdi(0, 3.0)
    assert r["energy_kcal_per_kg"] == [93, 107]
    r = infancy_sdi(7, 8.0)
    assert r["energy_kcal_per_kg"] == [72, 82]

def test_pd_adjustment_adds_protein_and_counts_dextrose():
    base = sdi(4, "male", 16)  # energy 67 to 93 kcal/kg
    adj = adjust_targets(base, on_dialysis="PD", dialysate_glucose_kcal_per_kg=8.0, weight_kg=16)
    assert close(adj["protein_g_per_kg"][0], 0.85 + 0.15)
    assert close(adj["protein_g_per_kg"][1], 0.95 + 0.3)
    assert close(adj["energy_kcal_per_kg_oral"][0], 67 - 8)
    assert close(adj["energy_kcal_per_kg_oral"][1], 93 - 8)

def test_hd_adjustment():
    base = sdi(12, "female", 35)
    adj = adjust_targets(base, on_dialysis="HD", weight_kg=35)
    assert close(adj["protein_g_per_kg"][0], base["protein_g_per_kg"][0] + 0.1)

def test_poor_growth_uses_upper_energy():
    base = sdi(6, "female", 20)
    adj = adjust_targets(base, poor_growth=True)
    assert adj["energy_kcal_per_kg_total"][0] == 90

def test_ckd23_note():
    adj = adjust_targets(sdi(8, "male", 25), ckd_stage=3)
    assert any("no routine protein restriction" in n for n in adj["notes"])

def test_potassium_thresholds():
    assert "Hyperkalaemia" in potassium_flags(5.4, 8)[0]
    assert "reference range" in potassium_flags(4.5, 8)[0]
    assert "Hyperkalaemia" not in potassium_flags(5.5, 0.5)[0]  # infant threshold 5.7
    assert "no dietary potassium restriction" in potassium_flags(None, 8)[0]

def test_sodium_cdrr():
    assert sodium_targets(2)["cdrr_salt_g_per_day"] == 3.0
    assert sodium_targets(16)["cdrr_sodium_g_per_day"] == 2.3

def test_label_thresholds():
    assert label_check(0) == "salt-free"
    assert label_check(30) == "very low sodium"
    assert label_check(120) == "low sodium"
    assert label_check(400) == "not low sodium"

def test_intake_summary_keeps_sources_separate():
    db = json.load(open("food_table.json"))
    s = intake_summary([{"food": "idli", "portions": 2}], db)
    k = s["totals_mg_by_nutrient_and_source"]["potassium"]
    assert len(k) >= 2, k  # general and South guides kept separate
    assert s["totals_mg_by_nutrient_and_source"]["phosphate"]  # phosphate guide present

if __name__ == "__main__":
    import sys
    failed = 0
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn(); print("PASS", name)
            except Exception as e:
                failed += 1; print("FAIL", name, repr(e))
    sys.exit(1 if failed else 0)
