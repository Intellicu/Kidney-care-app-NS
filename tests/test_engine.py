"""Checks for the KidneyCare nutrition engine. Run: python -m unittest discover tests"""
import csv
import unittest
from pathlib import Path

from kcnutrition import db_build
from kcnutrition.engine import Engine, FoodDB, FoodLookupError, UnitError

ROOT = Path(__file__).resolve().parent.parent
IFCT = {r["code"]: r for r in csv.DictReader(open(ROOT / "data/raw/ifct2017_compositions.csv"))}


class EngineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        db_build.build()
        cls.eng = Engine(FoodDB())

    def entry(self, food, amount, unit="g", **kw):
        return self.eng.compute_entry({"food": food, "amount": amount, "unit": unit, **kw})

    def test_ifct_scaling_matches_source_row(self):
        r = self.entry("IFCT:B010", 50)
        src = IFCT["B010"]
        self.assertAlmostEqual(r.nutrients["energy_kcal"], float(src["enerc"]) / 4.184 * 0.5, 6)
        self.assertAlmostEqual(r.nutrients["potassium_mg"], float(src["k"]) * 1000 * 0.5, 6)
        self.assertAlmostEqual(r.nutrients["phosphorus_mg"], float(src["p"]) * 1000 * 0.5, 6)
        self.assertAlmostEqual(r.nutrients["sodium_mg"], float(src["na"]) * 1000 * 0.5, 6)

    def test_course_feed_close_to_published(self):
        # Course: about 170 kcal and 4 to 5 g protein.
        r = self.entry("rice moong feed", 1, "serving")
        self.assertTrue(150 <= r.nutrients["energy_kcal"] <= 200, r.nutrients["energy_kcal"])
        self.assertTrue(3.5 <= r.nutrients["protein_g"] <= 5.0, r.nutrients["protein_g"])
        self.assertAlmostEqual(r.fluid_ml, 195)

    def test_milk_ml_uses_density_and_counts_fluid(self):
        r = self.entry("cow milk", 100, "ml")
        self.assertAlmostEqual(r.grams, 103)
        self.assertAlmostEqual(r.fluid_ml, 100)

    def test_salt_sodium(self):
        r = self.entry("salt", 1, "tsp")
        self.assertAlmostEqual(r.nutrients["sodium_mg"], 5 * 393.4, 3)

    def test_oil_energy_derived_and_flagged(self):
        r = self.entry("ghee", 10)
        self.assertAlmostEqual(r.nutrients["energy_kcal"], 10 * 37 / 4.184, 3)
        self.assertTrue(any("derived" in p for p in r.provenance))

    def test_food_specific_measure_beats_generic(self):
        self.assertAlmostEqual(self.entry("atta", 3, "tsp").grams, 9.99)
        self.assertAlmostEqual(self.entry("mustard oil", 1, "tbsp").grams, 10)

    def test_generic_teaspoon_warns(self):
        r = self.entry("IFCT:G026", 1, "tsp")  # fenugreek seeds, no specific measure
        self.assertEqual(r.grams, 5)
        self.assertTrue(any("Generic tsp" in w for w in r.warnings))

    def test_katori_of_solid_without_weight_refused(self):
        with self.assertRaises(UnitError):
            self.entry("rice", 1, "katori_small")
        with self.assertRaises(UnitError):
            self.entry("rice", 1, "katori")

    def test_ambiguous_and_unknown_names_refused(self):
        with self.assertRaises(FoodLookupError):
            self.entry("milk", 100, "ml")
        with self.assertRaises(FoodLookupError):
            self.entry("pizza", 100)

    def test_alias_beats_local_name(self):
        self.assertEqual(self.entry("palak", 20).food_id, "IFCT:C033")

    def test_leaching_not_applied_without_approval(self):
        plain = self.entry("IFCT:F006", 100)
        leached = self.entry("IFCT:F006", 100, leached="yes")
        self.assertEqual(plain.nutrients["potassium_mg"], leached.nutrients["potassium_mg"])
        self.assertTrue(any("no approved leaching" in w for w in leached.warnings))

    def test_absorbable_phosphorus_range(self):
        r = self.entry("IFCT:B010", 100)  # plant
        p = r.nutrients["phosphorus_mg"]
        self.assertAlmostEqual(r.p_absorbable[0], p * 0.2)
        self.assertAlmostEqual(r.p_absorbable[1], p * 0.5)
        r = self.entry("cow milk", 100, "ml")  # animal
        p = r.nutrients["phosphorus_mg"]
        self.assertAlmostEqual(r.p_absorbable[1], p * 0.7)

    def test_recipe_grams_need_batch_weight(self):
        with self.assertRaises(UnitError):
            self.entry("roti", 30)
        r = self.entry("moong dal cooked", 600)  # whole pot
        self.assertAlmostEqual(r.nutrients["protein_g"], float(IFCT["B010"]["protcnt"]), 6)

    def test_missing_values_not_zero(self):
        vals = self.eng.db.values["IFCT:A019"]
        saved = vals["potassium_mg"]
        vals["potassium_mg"] = (None, "analysed")  # simulate a food with no K value
        try:
            res = self.eng.compute([{"food": "IFCT:A019", "amount": 100, "unit": "g",
                                     "date": "d", "slot": "lunch"}],
                                   {"weight_kg": 20, "limits": {"potassium_mg": {"max": 1000}}})
        finally:
            vals["potassium_mg"] = saved
        day = res["days"]["d"]
        self.assertEqual(day["total"]["missing_counts"]["potassium_mg"], 1)
        self.assertIn("incomplete", day["assessment"]["potassium_mg"]["status"])

    def test_prescription_per_kg(self):
        res = self.eng.compute([{"food": "atta", "amount": 100, "unit": "g", "date": "d", "slot": "lunch"}],
                               {"weight_kg": 20, "limits": {"protein_g": {"per_kg": [0.85, 0.95]}}})
        a = res["days"]["d"]["assessment"]["protein_g"]
        self.assertAlmostEqual(a["min"], 17)
        self.assertAlmostEqual(a["max"], 19)
        self.assertEqual(a["status"], "below range")


if __name__ == "__main__":
    unittest.main()
