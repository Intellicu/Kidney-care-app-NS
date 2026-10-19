"""Meal-level nutrient calculation for the KidneyCare nutrition module.

Input: meal entries (date, slot, food, amount, unit). Output: per-entry, per-meal and
per-day totals for energy, protein, fat, carbohydrate, fibre, water, calcium,
phosphorus (with an absorbable range), potassium, sodium, iron and fluid, compared with
a clinician-entered prescription.

Design rules (from the KidneyCare Nutrition Module Spec v4, sections 3, 4 and 13):
- Never guess a food: ambiguous or unknown names stop with suggestions.
- Never treat a missing value as zero: missing values are counted and reported.
- Every non-analysed value (derived or proxy) is listed in the report.
- No potassium leaching factor is applied unless one is approved in config.json.
- Flags describe the position against the prescription; they do not prescribe.
"""
from __future__ import annotations

import csv
import difflib
import json
import sqlite3
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB = ROOT / "data" / "kidneycare_foods.sqlite"
DEFAULT_CONFIG = ROOT / "data" / "config.json"

NUTRIENTS = [
    "energy_kcal", "protein_g", "fat_g", "carb_g", "fibre_g", "water_g",
    "calcium_mg", "phosphorus_mg", "potassium_mg", "sodium_mg", "iron_mg",
]
LABELS = {
    "energy_kcal": ("Energy", "kcal"), "protein_g": ("Protein", "g"),
    "fat_g": ("Fat", "g"), "carb_g": ("Carbohydrate", "g"), "fibre_g": ("Fibre", "g"),
    "water_g": ("Water in food", "g"), "calcium_mg": ("Calcium", "mg"),
    "phosphorus_mg": ("Phosphorus", "mg"), "potassium_mg": ("Potassium", "mg"),
    "sodium_mg": ("Sodium", "mg"), "iron_mg": ("Iron", "mg"), "fluid_ml": ("Fluid", "mL"),
}
UNIT_ALIASES = {
    "g": "g", "gm": "g", "gram": "g", "grams": "g", "kg": "kg",
    "ml": "ml", "l": "l", "litre": "l", "liter": "l",
    "tsp": "tsp", "teaspoon": "tsp", "tbsp": "tbsp", "tablespoon": "tbsp",
    "piece": "piece", "pieces": "piece", "pc": "piece", "nos": "piece",
    "serving": "serving", "servings": "serving", "batch": "batch",
    "pinch": "pinch", "cup": "cup",
    "katori_large": "katori_large", "katori_medium": "katori_medium",
    "katori_small": "katori_small", "katori_small_155": "katori_small_155",
    "glass_small": "glass_small",
}
SLOT_ORDER = ["early morning", "breakfast", "mid-morning", "lunch", "evening",
              "dinner", "bedtime", "feed", "snack"]


class FoodLookupError(ValueError):
    """Raised when a food cannot be matched to exactly one database entry."""


class UnitError(ValueError):
    """Raised when an amount cannot be converted to grams safely."""


@dataclass
class EntryResult:
    date: str
    slot: str
    query: str
    food_id: str
    food_name: str
    amount: float
    unit: str
    grams: float
    fluid_ml: float
    nutrients: dict
    missing: list
    p_absorbable: tuple
    warnings: list = field(default_factory=list)
    provenance: list = field(default_factory=list)


class FoodDB:
    def __init__(self, db_path: Path = DEFAULT_DB):
        if not Path(db_path).exists():
            raise FileNotFoundError(
                f"{db_path} not found. Run: python -m kcnutrition.cli build-db")
        self.con = sqlite3.connect(db_path)
        self.con.row_factory = sqlite3.Row
        self.foods = {r["food_id"]: dict(r) for r in self.con.execute("SELECT * FROM food")}
        self.recipes = {r["recipe_id"]: dict(r) for r in self.con.execute("SELECT * FROM recipe")}
        self.values = defaultdict(dict)
        for r in self.con.execute("SELECT * FROM nutrient_value"):
            self.values[r["food_id"]][r["nutrient"]] = (r["value_per_100g"], r["derivation"])
        # Name tiers, checked in order: official names, then aliases, then IFCT local names.
        self.names = defaultdict(set)
        self.tiers = {"primary": defaultdict(set), "alias": defaultdict(set),
                      "local": defaultdict(set)}
        self.name_notes = {}
        tier_of = {"ifct_name": "primary", "custom_name": "primary", "recipe_name": "primary",
                   "alias": "alias", "ifct_local": "local"}
        for r in self.con.execute("SELECT * FROM food_name"):
            key = _norm(r["name"])
            self.names[key].add(r["food_id"])
            self.tiers[tier_of.get(r["kind"], "local")][key].add(r["food_id"])
            if r["note"]:
                self.name_notes[(key, r["food_id"])] = r["note"]
        self.measures = defaultdict(dict)
        for r in self.con.execute("SELECT * FROM household_measure"):
            self.measures[r["food_id"]][r["unit"]] = dict(r)
        self.ingredients = defaultdict(list)
        for r in self.con.execute("SELECT * FROM recipe_ingredient"):
            self.ingredients[r["recipe_id"]].append(dict(r))

    def display_name(self, item_id: str) -> str:
        if item_id in self.foods:
            return self.foods[item_id]["name"]
        return self.recipes[item_id]["name"]

    def resolve(self, query: str) -> str:
        q = _norm(query)
        if not q:
            raise FoodLookupError("Empty food name.")
        for candidate in (query.strip(), f"IFCT:{query.strip().upper()}"):
            if candidate in self.foods or candidate in self.recipes:
                return candidate
        ids = set()
        for tier in ("primary", "alias", "local"):
            ids = self.tiers[tier].get(q, set())
            if ids:
                break
        if len(ids) == 1:
            return next(iter(ids))
        if len(ids) > 1:
            options = "; ".join(f"{i} = {self.display_name(i)}" for i in sorted(ids))
            raise FoodLookupError(f"'{query}' matches more than one food: {options}. "
                                  "Enter the code instead.")
        raise FoodLookupError(f"'{query}' not found. Suggestions: "
                              + ("; ".join(self.search(query, 6)) or "none"))

    def search(self, query: str, n: int = 10) -> list:
        q = _norm(query)
        hits = []
        for name, ids in self.names.items():
            if q and q in name:
                hits.extend((i, name) for i in ids)
        if len(hits) < n:
            for name in difflib.get_close_matches(q, list(self.names), n=n, cutoff=0.6):
                hits.extend((i, name) for i in self.names[name])
        seen, out = set(), []
        for item_id, _ in hits:
            if item_id not in seen:
                seen.add(item_id)
                out.append(f"{item_id} = {self.display_name(item_id)}")
            if len(out) >= n:
                break
        return out


def _norm(text: str) -> str:
    return " ".join((text or "").lower().replace(",", " ").split())


class Engine:
    def __init__(self, db: FoodDB | None = None, config_path: Path = DEFAULT_CONFIG):
        self.db = db or FoodDB()
        self.config = json.loads(Path(config_path).read_text(encoding="utf-8"))

    # ---- conversion -------------------------------------------------------------
    def to_grams(self, food_id: str, amount: float, unit: str):
        """Return (grams, warnings) for a single food. Raises UnitError if unsafe."""
        food = self.db.foods[food_id]
        density = food["density_g_per_ml"]
        warnings = []
        if unit == "g":
            return amount, warnings
        if unit == "kg":
            return amount * 1000, warnings
        if unit in ("ml", "l"):
            ml = amount * (1000 if unit == "l" else 1)
            if density:
                return ml * density, warnings
            raise UnitError(f"{food['name']} is not a liquid in the database; enter grams.")
        specific = self.db.measures.get(food_id, {}).get(unit)
        if specific and specific["grams"]:
            return amount * specific["grams"], warnings
        generic = self.db.measures.get(None, {}).get(unit)
        if generic and generic["ml"] and density:
            return amount * generic["ml"] * density, warnings
        if generic and generic["grams"] and unit in ("tsp", "tbsp"):
            warnings.append(f"Generic {unit} ({generic['grams']:g} g) used for {food['name']}; "
                            "weigh once to calibrate.")
            return amount * generic["grams"], warnings
        if generic and generic["ml"]:
            raise UnitError(f"No gram weight for a {unit} of {food['name']}. A {unit} is "
                            f"{generic['ml']:g} mL by volume, but grams depend on the food. "
                            "Weigh the portion and enter grams.")
        raise UnitError(f"Unit '{unit}' cannot be used for {food['name']}; enter grams.")

    # ---- per-item nutrient profile ---------------------------------------------------
    def _food_nutrients(self, food_id: str, grams: float, leached: bool):
        vals = self.db.values[food_id]
        food = self.db.foods[food_id]
        out, missing, prov, warnings = {}, [], [], []
        by_derivation = defaultdict(list)
        for n in NUTRIENTS:
            v, der = vals.get(n, (None, None))
            if v is None:
                out[n] = None
                missing.append(n)
                continue
            out[n] = v * grams / 100
            if der and der != "analysed":
                by_derivation[der].append(n)
        for der, ns in by_derivation.items():
            which = "all values" if len(ns) == len(NUTRIENTS) - len(missing) else \
                ", ".join(LABELS[n][0].lower() for n in ns)
            prov.append(f"{food_id} {food['name']}: {which} {der}")
        if leached and out.get("potassium_mg") is not None:
            factor = self._leach_factor(food_id)
            if factor is None:
                warnings.append(f"{food['name']} marked as leached, but no approved leaching "
                                "factor exists; potassium shown unleached.")
            else:
                out["potassium_mg"] *= factor
                prov.append(f"{food_id} {food['name']}: potassium x{factor} leaching factor")
        p = out.get("phosphorus_mg")
        p_abs = self._p_absorbable(p, food["p_class"]) if p is not None else (None, None)
        fluid = grams / food["density_g_per_ml"] if food["is_fluid"] else 0.0
        return out, missing, prov, warnings, p_abs, fluid

    def _leach_factor(self, food_id: str):
        cfg = self.config.get("potassium_leaching", {})
        if not cfg.get("approved_by"):
            return None
        return cfg.get("factors", {}).get(food_id)

    def _p_absorbable(self, p_mg: float, p_class: str):
        if p_class not in ("animal", "plant", "additive"):
            return (0.0, 0.0) if p_mg == 0 else (None, None)
        lows, highs = [], []
        for key, sets in self.config["phosphorus_absorption"].items():
            if key.startswith("_"):
                continue
            lo, hi = sets[p_class]
            lows.append(lo)
            highs.append(hi)
        return (p_mg * min(lows), p_mg * max(highs))

    # ---- entries ------------------------------------------------------------------
    def compute_entry(self, entry: dict) -> EntryResult:
        query = str(entry["food"]).strip()
        item_id = self.db.resolve(query)
        amount = float(entry["amount"])
        if amount < 0:
            raise UnitError("Amount cannot be negative.")
        raw_unit = str(entry.get("unit", "g")).strip().lower()
        unit = UNIT_ALIASES.get(raw_unit)
        if unit is None:
            if "katori" in raw_unit or raw_unit in ("bowl", "glass"):
                raise UnitError(f"'{raw_unit}' is ambiguous. Use katori_large (360 mL), "
                                "katori_medium (200 mL), katori_small_155 (155 mL), "
                                "katori_small (115 mL) or glass_small (100 mL).")
            raise UnitError(f"Unknown unit '{raw_unit}'.")
        leached = str(entry.get("leached", "")).strip().lower() in ("y", "yes", "true", "1")
        date = str(entry.get("date", "")).strip()
        slot = str(entry.get("slot", "")).strip().lower()

        if item_id in self.db.recipes:
            return self._compute_recipe(item_id, query, amount, unit, leached, date, slot)

        grams, warnings = self.to_grams(item_id, amount, unit)
        nut, missing, prov, w2, p_abs, fluid = self._food_nutrients(item_id, grams, leached)
        food = self.db.foods[item_id]
        if food["state"] == "raw" and food["food_group"] not in (
                "Fruits", "Milk and Milk Products", "Nuts and Oil Seeds",
                "Edible Oils and Fats", "Sugars", "Miscellaneous Foods"):
            warnings.append(f"IFCT values for {food['name']} are for the raw food; enter the "
                            "raw weight, or log the cooked dish as a recipe.")
        note = self.db.name_notes.get((_norm(query), item_id))
        if note:
            warnings.append(f"{query}: {note}")
        return EntryResult(date, slot, query, item_id, food["name"], amount, unit, grams,
                           fluid, nut, missing, p_abs, warnings + w2, prov)

    def _compute_recipe(self, rid, query, amount, unit, leached, date, slot):
        recipe = self.db.recipes[rid]
        batch = {n: 0.0 for n in NUTRIENTS}
        batch_missing, prov, warnings = set(), [], []
        p_lo = p_hi = 0.0
        p_unknown = False
        raw_total = 0.0
        for ing in self.db.ingredients[rid]:
            nut, missing, pv, w, p_abs, _ = self._food_nutrients(ing["food_id"], ing["raw_g"], leached)
            raw_total += ing["raw_g"]
            for n in NUTRIENTS:
                if nut[n] is None:
                    batch_missing.add(n)
                else:
                    batch[n] += nut[n]
            prov.extend(pv)
            warnings.extend(w)
            if p_abs[0] is None:
                p_unknown = True
            else:
                p_lo += p_abs[0]
                p_hi += p_abs[1]
        servings = recipe["servings"] or 1
        cooked = recipe["batch_cooked_g"]
        if unit == "serving":
            fraction = amount / servings
        elif unit == "batch":
            fraction = amount
        elif unit in ("g", "kg"):
            grams_eaten = amount * (1000 if unit == "kg" else 1)
            if not cooked:
                raise UnitError(f"{recipe['name']} has no weighed cooked batch; log it in "
                                "servings, or add batch_cooked_g to the recipe.")
            fraction = grams_eaten / cooked
        elif unit == "ml" and recipe["is_fluid"]:
            fraction = amount / (cooked or raw_total)
        else:
            raise UnitError(f"Log {recipe['name']} in servings, batch or grams.")
        grams = fraction * (cooked or raw_total)
        nut = {n: (None if n in batch_missing else batch[n] * fraction) for n in NUTRIENTS}
        p_abs = (None, None) if p_unknown else (p_lo * fraction, p_hi * fraction)
        fluid = grams if recipe["is_fluid"] else 0.0
        if recipe["status"] != "course recipe":
            warnings.append(f"{recipe['name']}: recipe status is '{recipe['status']}'.")
        prov.append(f"{rid}: recipe ({recipe['source']})")
        if batch_missing:
            warnings.append(f"{recipe['name']}: some ingredients lack values for "
                            + ", ".join(LABELS[n][0] for n in sorted(batch_missing)))
        return EntryResult(date, slot, query, rid, recipe["name"], amount, unit, grams, fluid,
                           nut, sorted(batch_missing), p_abs, warnings, prov)

    # ---- aggregation ------------------------------------------------------------------
    def compute(self, entries: list, child: dict | None = None) -> dict:
        results, errors = [], []
        for i, e in enumerate(entries, start=1):
            try:
                results.append(self.compute_entry(e))
            except (FoodLookupError, UnitError, ValueError, KeyError) as exc:
                errors.append({"row": i, "entry": e, "error": str(exc)})
        days = defaultdict(list)
        for r in results:
            days[r.date].append(r)
        day_out = {}
        for date, rows in sorted(days.items()):
            meals = defaultdict(list)
            for r in rows:
                meals[r.slot].append(r)
            meal_totals = {slot: _sum(rs) for slot, rs in sorted(
                meals.items(), key=lambda kv: _slot_rank(kv[0]))}
            total = _sum(rows)
            day_out[date] = {"meals": meal_totals, "total": total,
                             "per_kg": _per_kg(total, child),
                             "assessment": _assess(total, child) if child else {}}
        return {"child": child, "entries": [r.__dict__ for r in results],
                "errors": errors, "days": day_out}


def _slot_rank(slot: str) -> int:
    return SLOT_ORDER.index(slot) if slot in SLOT_ORDER else len(SLOT_ORDER)


def _sum(rows: list) -> dict:
    total = {n: 0.0 for n in NUTRIENTS}
    missing = defaultdict(int)
    p_lo = p_hi = 0.0
    p_incomplete = 0
    fluid = 0.0
    for r in rows:
        for n in NUTRIENTS:
            v = r.nutrients.get(n)
            if v is None:
                missing[n] += 1
            else:
                total[n] += v
        if r.p_absorbable[0] is None:
            p_incomplete += 1
        else:
            p_lo += r.p_absorbable[0]
            p_hi += r.p_absorbable[1]
        fluid += r.fluid_ml
    total["fluid_ml"] = fluid
    total["phosphorus_absorbable_mg"] = [p_lo, p_hi]
    total["missing_counts"] = dict(missing)
    total["p_absorbable_incomplete"] = p_incomplete
    total["n_entries"] = len(rows)
    return total


def _per_kg(total: dict, child: dict | None) -> dict:
    if not child or not child.get("weight_kg"):
        return {}
    w = float(child["weight_kg"])
    return {"energy_kcal_per_kg": total["energy_kcal"] / w,
            "protein_g_per_kg": total["protein_g"] / w,
            "fluid_ml_per_kg": total["fluid_ml"] / w}


def _assess(total: dict, child: dict) -> dict:
    """Compare totals with the prescription. Limits use 'per_kg': [lo, hi] or min/max."""
    out = {}
    weight = child.get("weight_kg")
    for nutrient, lim in (child.get("limits") or {}).items():
        if nutrient not in total:
            continue
        value = total[nutrient]
        lo = hi = None
        basis = "per day"
        if "per_kg" in lim and weight:
            lo, hi = (float(x) * float(weight) if x is not None else None for x in lim["per_kg"])
            basis = f"{lim['per_kg'][0]}-{lim['per_kg'][1]} per kg x {weight} kg"
        else:
            lo, hi = lim.get("min"), lim.get("max")
        if lo is None and hi is None:
            continue
        if lo is not None and value < lo:
            status = "below range"
        elif hi is not None and value > hi:
            status = "above range"
        else:
            status = "within range"
        n_missing = total["missing_counts"].get(nutrient, 0)
        if n_missing:
            status += f" (incomplete: {n_missing} entr{'y' if n_missing == 1 else 'ies'} without a value)"
        out[nutrient] = {"value": value, "min": lo, "max": hi, "basis": basis,
                         "status": status, "source": lim.get("source", "")}
    return out


def read_meals_csv(path: Path) -> list:
    with open(path, newline="", encoding="utf-8-sig") as fh:
        return [row for row in csv.DictReader(fh) if any((v or "").strip() for v in row.values())]
