"""Build the KidneyCare food database (SQLite) from IFCT 2017 plus local seed files.

Personal, non-commercial use. IFCT 2017 values are (c) ICMR-National Institute of
Nutrition, Hyderabad; written NIN permission is needed before this database is used
in any product or shared. Values were taken from the ifct2017/compositions
repository (machine-readable transcription of the IFCT 2017 book).

One row per food per source is kept. Missing values stay NULL (never zero), and every
value carries a derivation tag: analysed, derived:..., or proxy:....
"""
from __future__ import annotations

import csv
import json
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW_IFCT = ROOT / "data" / "raw" / "ifct2017_compositions.csv"
SEED = ROOT / "data" / "seed"
DB_PATH = ROOT / "data" / "kidneycare_foods.sqlite"

NUTRIENTS = [
    "energy_kcal", "protein_g", "fat_g", "carb_g", "fibre_g", "water_g",
    "calcium_mg", "phosphorus_mg", "potassium_mg", "sodium_mg", "iron_mg",
]

# IFCT column -> (nutrient, multiplier). IFCT minerals are in g/100 g; energy in kJ.
IFCT_MAP = {
    "enerc": ("energy_kcal", 1 / 4.184),
    "protcnt": ("protein_g", 1.0),
    "fatce": ("fat_g", 1.0),
    "choavldf": ("carb_g", 1.0),
    "fibtg": ("fibre_g", 1.0),
    "water": ("water_g", 1.0),
    "ca": ("calcium_mg", 1000.0),
    "p": ("phosphorus_mg", 1000.0),
    "k": ("potassium_mg", 1000.0),
    "na": ("sodium_mg", 1000.0),
    "fe": ("iron_mg", 1000.0),
}

ANIMAL_GROUPS = {
    "Animal Meat", "Poultry", "Egg and Egg Products", "Milk and Milk Products",
    "Marine Fish", "Fresh Water Fish and Shellfish", "Marine Shellfish", "Marine Mollusks",
}
FLUID_CODES = {"L001": 1.03, "L002": 1.03, "K001": 1.0, "K002": 1.0, "I002": 1.0, "E033": 1.0}

SCHEMA = """
CREATE TABLE source (
  source_id TEXT PRIMARY KEY, name TEXT, citation TEXT, licence TEXT, note TEXT);
CREATE TABLE food (
  food_id TEXT PRIMARY KEY, source_id TEXT, source_code TEXT, name TEXT,
  food_group TEXT, p_class TEXT, is_fluid INTEGER, density_g_per_ml REAL,
  state TEXT, derivation TEXT, note TEXT);
CREATE TABLE food_name (food_id TEXT, name TEXT, lang TEXT, kind TEXT, note TEXT);
CREATE TABLE nutrient_value (
  food_id TEXT, nutrient TEXT, value_per_100g REAL, sd REAL, derivation TEXT,
  PRIMARY KEY (food_id, nutrient));
CREATE TABLE household_measure (
  food_id TEXT, unit TEXT, grams REAL, ml REAL, source TEXT, note TEXT);
CREATE TABLE recipe (
  recipe_id TEXT PRIMARY KEY, name TEXT, status TEXT, source TEXT, servings REAL,
  batch_cooked_g REAL, is_fluid INTEGER);
CREATE TABLE recipe_ingredient (recipe_id TEXT, food_id TEXT, raw_g REAL, note TEXT);
CREATE INDEX idx_food_name ON food_name(name);
"""

LANG_CODES = {
    "A": "Assamese", "B": "Bengali", "E": "English", "G": "Gujarati", "H": "Hindi",
    "Kan": "Kannada", "Kash": "Kashmiri", "Kh": "Khasi", "Kon": "Konkani",
    "Mal": "Malayalam", "M": "Manipuri", "Mar": "Marathi", "N": "Nepali", "O": "Odia",
    "P": "Punjabi", "S": "Sanskrit", "Tam": "Tamil", "Tel": "Telugu", "U": "Urdu",
}


def _num(text: str):
    text = (text or "").strip()
    if text == "":
        return None
    try:
        return float(text)
    except ValueError:
        return None


def parse_local_names(lang_field: str):
    """Split IFCT local-name text such as 'H. Atta; Tam. Maavu, Godumai' into (lang, name)."""
    out = []
    for part in (lang_field or "").split(";"):
        part = part.strip().rstrip(".")
        m = re.match(r"^([A-Za-z]+)\.\s*(.+)$", part)
        if not m:
            continue
        lang = LANG_CODES.get(m.group(1), m.group(1))
        for name in m.group(2).split(","):
            name = re.sub(r"\(.*?\)", "", name).strip()
            if len(name) >= 3:
                out.append((lang, name))
    return out


def build(db_path: Path = DB_PATH) -> Path:
    if db_path.exists():
        db_path.unlink()
    con = sqlite3.connect(db_path)
    con.executescript(SCHEMA)
    con.executemany("INSERT INTO source VALUES (?,?,?,?,?)", [
        ("IFCT2017", "Indian Food Composition Tables 2017",
         "Longvah T, Ananthan R, Bhaskarachary K, Venkaiah K. IFCT 2017. NIN-ICMR, Hyderabad.",
         "(c) ICMR-NIN. Personal use with acknowledgement; written NIN permission needed for any product.",
         "Transcribed values from github.com/ifct2017/compositions (code AGPL-3.0). Raw foods only."),
        ("CUSTOM", "KidneyCare local entries",
         "Stoichiometry, IFCT energy factors, or proxies of IFCT foods (see derivation per value).",
         "Own work.", "Proxies must be replaced by analysed values when available."),
        ("ICMR_DGI_2024", "ICMR-NIN Dietary Guidelines for Indians 2024",
         "ICMR-NIN Expert Committee. Dietary Guidelines for Indians. Hyderabad, 2024.",
         "(c) ICMR-NIN.", "Household measures (Annexures I and II)."),
    ])

    # IFCT foods
    ifct = {}
    with open(RAW_IFCT, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            code = row["code"].strip()
            fid = f"IFCT:{code}"
            group = row["grup"].strip()
            p_class = "animal" if group in ANIMAL_GROUPS else "plant"
            density = FLUID_CODES.get(code)
            con.execute("INSERT INTO food VALUES (?,?,?,?,?,?,?,?,?,?,?)", (
                fid, "IFCT2017", code, row["name"].strip(), group, p_class,
                1 if density else 0, density, "raw", "analysed", None))
            con.execute("INSERT INTO food_name VALUES (?,?,?,?,?)",
                        (fid, row["name"].strip(), "English", "ifct_name", None))
            for lang, name in parse_local_names(row.get("lang", "")):
                con.execute("INSERT INTO food_name VALUES (?,?,?,?,?)",
                            (fid, name, lang, "ifct_local", None))
            values = {}
            for col, (nutrient, mult) in IFCT_MAP.items():
                v = _num(row.get(col))
                sd = _num(row.get(f"{col}_e"))
                values[nutrient] = (None if v is None else v * mult,
                                    None if sd is None else sd * mult, "analysed")
            # IFCT gives no energy for oils and fats (enerc = 0); derive from fat.
            e, _, _ = values["energy_kcal"]
            fat = values["fat_g"][0]
            if (e is None or e == 0) and fat and fat > 0:
                values["energy_kcal"] = (fat * 37 / 4.184, None,
                                         "derived:fat x 37 kJ/g (IFCT energy factor)")
            for nutrient, (v, sd, der) in values.items():
                con.execute("INSERT INTO nutrient_value VALUES (?,?,?,?,?)",
                            (fid, nutrient, v, sd, der))
            ifct[fid] = values

    # Custom foods (some are proxies of IFCT foods)
    with open(SEED / "custom_foods.csv", newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            fid = row["food_id"]
            density = _num(row["density_g_per_ml"])
            con.execute("INSERT INTO food VALUES (?,?,?,?,?,?,?,?,?,?,?)", (
                fid, "CUSTOM", fid.split(":", 1)[1], row["name"], row["food_group"],
                row["p_class"], int(row["is_fluid"] or 0), density, "as eaten",
                row["derivation"], row["note"]))
            con.execute("INSERT INTO food_name VALUES (?,?,?,?,?)",
                        (fid, row["name"], "English", "custom_name", None))
            proxy = row["proxy_of"].strip()
            scale = _num(row["proxy_scale"]) or 1.0
            for nutrient in NUTRIENTS:
                if proxy:
                    base = ifct[proxy][nutrient][0]
                    if base is None:
                        v = None
                    elif nutrient == "water_g":
                        v = base * scale + 100 * (1 - scale)
                    else:
                        v = base * scale
                    der = row["derivation"]
                else:
                    v = _num(row[nutrient])
                    der = row["derivation"]
                con.execute("INSERT INTO nutrient_value VALUES (?,?,?,?,?)",
                            (fid, nutrient, v, None, der))

    with open(SEED / "aliases.csv", newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            con.execute("INSERT INTO food_name VALUES (?,?,?,?,?)",
                        (row["food_id"], row["alias"], "alias", "alias", row["note"] or None))

    with open(SEED / "household_measures.csv", newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            con.execute("INSERT INTO household_measure VALUES (?,?,?,?,?,?)", (
                row["food_id"] or None, row["unit"], _num(row["grams"]), _num(row["ml"]),
                row["source"], row["note"] or None))

    recipes = json.loads((SEED / "recipes.json").read_text(encoding="utf-8"))["recipes"]
    for r in recipes:
        con.execute("INSERT INTO recipe VALUES (?,?,?,?,?,?,?)", (
            r["recipe_id"], r["name"], r["status"], r["source"], r["servings"],
            r["batch_cooked_g"], 1 if r.get("is_fluid") else 0))
        con.execute("INSERT INTO food_name VALUES (?,?,?,?,?)",
                    (r["recipe_id"], r["name"], "English", "recipe_name", None))
        for a in r.get("aliases", []):
            con.execute("INSERT INTO food_name VALUES (?,?,?,?,?)",
                        (r["recipe_id"], a, "alias", "alias", None))
        for ing in r["ingredients"]:
            con.execute("INSERT INTO recipe_ingredient VALUES (?,?,?,?)",
                        (r["recipe_id"], ing["food"], ing["g"], ing.get("note")))

    con.commit()
    con.close()
    return db_path


if __name__ == "__main__":
    path = build(Path(sys.argv[1]) if len(sys.argv) > 1 else DB_PATH)
    con = sqlite3.connect(path)
    n_food = con.execute("SELECT COUNT(*) FROM food").fetchone()[0]
    n_names = con.execute("SELECT COUNT(*) FROM food_name").fetchone()[0]
    n_rec = con.execute("SELECT COUNT(*) FROM recipe").fetchone()[0]
    print(f"Built {path}: {n_food} foods, {n_names} names, {n_rec} recipes")
