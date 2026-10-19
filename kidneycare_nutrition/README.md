# KidneyCare nutrition engine (personal-use prototype, v0.1, 16 Oct 2026)

Calculates dietary composition from meal entries (date, meal, food, amount, unit) and checks the day against a child's prescription. Implements the rules in *KidneyCare Nutrition Module Spec v4* (sections 3, 4, 6 and 13).

Personal, non-commercial use only. IFCT 2017 values are (c) ICMR-National Institute of Nutrition, Hyderabad. Written NIN permission is needed before this database is used in any product or shared. Clinician sign-off is needed before any output is used for care.

## What is in it

| Part | File | Notes |
|---|---|---|
| Food database | `data/kidneycare_foods.sqlite` | 548 foods: 542 IFCT 2017 raw foods, plus salt, sugar, water and 3 proxies (rice flour, curd, buttermilk). One row per food per nutrient, each with a derivation tag. |
| Seed files | `data/seed/*.csv`, `recipes.json` | Custom foods, Hindi and common-name aliases, household measures (ICMR-NIN DGI 2024 Annexures I and II), recipes. |
| Settings | `data/config.json` | Phosphorus absorption tiers (Polderman 2026 and PRINT course). Potassium leaching factors are empty until a dietitian approves them. |
| Engine | `kcnutrition/engine.py` | Food matching, unit conversion, per-entry, per-meal and per-day totals, prescription check. |
| Reports | `kcnutrition/report.py` | Markdown report and a FHIR R5 NutritionIntake bundle. |
| Family app | `out/kidneycare_nutrition_app.html` | Caregiver screens (Today, Log, Foods, Report), PIN-locked clinician screen, 6-step onboarding (language, user, doctor's code, kitchen, household measures, consent and reminders), meal photos with photo tips, packet-label check. Hindi and English. |
| Browser calculator | `out/kidneycare_diet_calculator.html` | Single file, works offline. Same calculation as the Python engine (checked by `tests/parity_test.js`). |

Nutrients: energy, protein, fat, carbohydrate, fibre, water, calcium, phosphorus (with an absorbable range), potassium, sodium, iron, and fluid.

## Use

```
python -m kcnutrition.cli build-db                 # rebuild the database after editing seed files
python -m kcnutrition.cli search "arhar"           # find a food and its code
python -m kcnutrition.cli calc examples/meals_example.csv --child examples/child_example.json \
    --md out/report.md --json out/result.json --fhir out/fhir.json
python -m kcnutrition.export_web                   # rebuild the browser calculator
python -m unittest discover tests                  # 15 checks
node tests/parity_test.js                          # browser engine = Python engine
```

Meal log CSV columns: `date, slot, food, amount, unit, leached`. Food can be an IFCT code (`A019`), an IFCT name, a Hindi or common alias (`atta`, `moong dal`, `doodh`), or a recipe name. Units: `g, kg, ml, l, tsp, tbsp, piece, pinch, cup, glass_small, katori_large, katori_medium, katori_small_155, katori_small, serving, batch`.

## Safety rules built in

- Ambiguous or unknown foods are rejected with suggestions (for example `milk` asks cow or buffalo).
- A katori of a solid food is rejected unless a food-specific gram weight exists. Volume does not give grams.
- Missing nutrient values are counted and reported, never treated as zero.
- IFCT values are for raw foods. The engine warns when a raw cereal, pulse or vegetable is logged directly; cooked dishes should be logged as recipes with weighed batches.
- Leached entries are reported unleached until a leaching factor is approved in `config.json` (conflict C6 in the spec).
- Every derived or proxy value is listed in the report.

## Known gaps

- No cooked-dish values. Recipes need the raw ingredients and the cooked batch weight from each household. The roti and moong dal recipes are examples only.
- Curd, buttermilk and rice flour are proxies. Sattu, litti and other Bihari foods are not yet in the database.
- The course rice-moong feed calculates at 189 kcal and 4.0 g protein against the course's "about 170 kcal, 4 to 5 g". The difference comes from the rice-flour proxy and the sugar energy factor.
- PRNT Indian potassium and phosphate guides are not loaded (Vitaflo permission needed); they should be used to cross-check values.
- IFCT yield and retention factors in the source repository were compiled by its maintainer from mixed sources and are not used.
- No PRINT SDI table is loaded. Targets come from the child's prescription file.

## Sources

- Longvah T et al. Indian Food Composition Tables 2017. ICMR-NIN, Hyderabad. Machine-readable transcription: github.com/ifct2017/compositions (commit b65621d, code AGPL-3.0).
- ICMR-NIN Expert Committee. Dietary Guidelines for Indians 2024, Annexures I and II.
- Polderman N, Shaw V et al. Clin Kidney J 2026;19(4):sfag046.
- rn4kids PRINT course (homemade feed recipe; phosphorus absorption tiers).
