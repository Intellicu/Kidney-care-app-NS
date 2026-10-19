# KidneyCare Nutrition Module: Spec v3

As of 14 Oct 2026. Built from the full rn4kids PRINT course (Modules 0 to 8), the Indian renal food guides linked from the PRINT resources page, the ICMR-NIN 2024 guidelines, and the Kidney Care AI project documents. Machine-readable targets are in `nutrition_targets.json`. Food values are in `indian_renal_food_tables.csv`. Clinician sign-off is required before any value is used for care.

## 1. Scope (v1)

The module records what a child eats, compares it with age-, sex- and condition-specific targets, and produces an Indian meal plan that fits those targets. It is paediatric only, matching the project's scope decision. The adult diabetic extension is named as a later translation, not costed.

Users: caregivers log meals at home in Hindi or Bhojpuri. Clinicians review a summary and the prescription.

Populations: nephrotic syndrome (the validated cohort), CKD stages 2 to 5, and children on PD or HD. Post-transplant rules are deferred to v2.

## 2. Energy and protein targets

Start from the PRINT Suggested Dietary Intake (SDI) for the child's age and sex. The energy SDI is the 50th centile range. The protein SDI meets the needs of 97.5% of children.

Examples: a 6-year-old girl has energy 64 to 90 kcal/kg/day and protein 0.85 to 0.95 g/kg/day (16 to 22 g/day). A 10-year-old boy has energy 55 to 69 kcal/kg/day and protein 26 to 40 g/day. Full tables are in the JSON.

Adjustments:
- Poor growth: aim for the upper end of the energy range.
- CKD stages 2 to 3: no routine protein restriction.
- CKD stages 4 to 5, not on dialysis: keep age-appropriate protein.
- Persistently high urea: check total intake, hydration, catabolism and dialysis adequacy first. Only then consider the lower end of protein.
- Dialysis: add 0.15 to 0.3 g/kg/day on PD and 0.1 g/kg/day on HD. PD protein losses run from 0.28 g/kg/day in infants to 0.1 g/kg/day in adolescents, so the top of the add-on range suits younger children (Polderman et al. 2026). Count PD dextrose energy at about 7 to 9 kcal/kg/day per the 2026 paper; the course gives 7 to 10. Use the paper value in the rules engine pending clinician sign-off, and record the source with the value.
- Energy: where feeding is poor, the 2026 paper also advises the upper end of the energy SDI, and uses height age rather than chronological age for poor linear growth.

## 3. Condition rules

Nephrotic syndrome: relapse is urine protein 3+ or UPCR of 2 mg/mg or more. Remission is nil or trace protein for 3 days, with oedema gone and weight back at dry weight. In relapse, use no-added-salt cooking, favour complex carbohydrate, and do not restrict fluid automatically. Fat is limited only after age 2. In remission, return to a normal sodium diet.

Potassium: restrict only with measured hyperkalaemia on trend (5.3 mmol/L or more in children). Check non-dietary causes first, including ACE inhibitors, ARBs, spironolactone, NSAIDs, constipation and acidosis. The main hidden sources are salt substitutes, potassium additives and coconut water. The Indian potassium guide treats high-potassium foods as a reference, not a blacklist. Adjust portions and leaching rather than cutting staples by default.

The 2026 paper sets out the same approach as a stepwise order (Polderman et al.). First correct non-dietary causes. Second, restrict foods with potassium additives. Third, replace high-potassium foods of low nutritional value. Fourth, do not routinely exclude fruit, vegetables or whole grains, since they carry fibre and nutrients. Fifth, limit animal protein while still meeting protein needs. A potassium binder such as sodium zirconium cyclosilicate is the last option where diet cannot achieve control or cannot be kept up.

Fibre: the PRNT fibre SDI is 8.3 to 14.2 g per 1000 kcal (Polderman et al. 2026). Children with CKD often fall short, so the meal engine should prefer plant-based, fibre-rich staples within the potassium and phosphate limits. Where potassium or phosphate limits conflict with fibre, the paper says to keep energy and protein adequate first, and to accept a fibre shortfall over a restriction that causes malnutrition.

Calcium: the PRNT total calcium target is 100 to 200% of the SDI, counting breast milk, formula, food and calcium-based medicines. When phosphate is restricted, the meal engine must still meet calcium using non-dairy sources such as plant milks, calcium-set tofu and fortified cereals, with supplements or high-calcium dialysate where needed.

Phosphate bioavailability (Polderman et al. 2026): additives up to 100%, animal sources 40 to 60%, plant sources 20 to 40%. The course gives 90 to 100% for additives, 40 to 70% for animal sources and 20 to 50% for plant sources. The two sources differ, so the engine must store which one each value came from. Phosphate-binder doses are taken with food or formula, and whey-dominant or renal formulas have lower phosphate content.

Ultra-processed food: processed and ultra-processed foods account for about 80% of sodium intake in Western countries (Polderman et al. 2026). The engine should flag UPF-heavy meals for sodium, phosphate and potassium additives, and it should keep salt substitutes off the list.

Phosphate: restrict additives before protein. Additive phosphate is 90 to 100% absorbed, animal phosphate 40 to 70%, and plant phosphate 20 to 50%. Targets are processed meats, colas, instant noodles, processed cheese, packaged namkeen, bakery and canned sweets. Swaps include buttermilk, paneer, home-cooked poha or khichdi, and roasted chana or makhana. Calcium carbonate with meals is first-line; sevelamer and lanthanum are non-calcium options.

Sodium: children aged 1 to 3 years have a chronic disease risk reduction target of 1.2 g sodium (3.0 g salt) per day. This rises to 2.3 g (5.5 g salt) at 14 to 18 years. Restrict in hypertension, albuminuria, oedema and PD fluid overload. Increase in renal sodium wasting or hypotension. Do not estimate intake from serum or urinary sodium. Label thresholds are 140 mg or less per serving for low, 35 mg or less for very low, and 5 mg or less for salt-free.

Dialysis: on HD, restrict fluid and sodium to control interdialytic weight gain, and restrict potassium as needed. On PD, fluid is more flexible and potassium is not routinely restricted. Give water-soluble vitamins after dialysis starts. Use IV iron with ESA on HD. Escalate to enteral feeding early in infants. Reserve IDPN for persistent malnutrition.

Growth and obesity: use weight-for-height (WHO) at ages 2 to 5 and BMI-for-age above age 5. Overweight is above +1 SD (BMI) or +2 SD (weight-for-height). Obesity is above +2 SD (BMI) or +3 SD (weight-for-height). Approach by improving diet quality, not aggressive restriction. No anti-obesity drugs in CKD 2 to 5D.

Infants: breastfeed on demand. Start complementary foods at about 6 months. Fortify feeds rather than diluting them when fluid is restricted. Expressed breast milk can be fortified with infant formula powder from the usual 13% (67 kcal/100 mL) up to 20% (100 kcal/100 mL). A whey-dominant formula is preferred because it is lower in phosphate and potassium (Polderman et al. 2026).

Enteral feeding: the 2026 paper advises starting tube feeding early when the weight centile falls or oral intake stays inadequate. An NG tube can bridge to a gastrostomy. For children on PD, plan the gastrostomy carefully, given the peritonitis risk and the need for antibiotic prophylaxis. The engine should flag these triggers to the clinician rather than decide them. Breast milk has 58 mg potassium per 100 mL, whey formula 69 mg, and cow's milk about 150 mg. Never use cow's milk as a substitute.

## 4. Food table

The module needs a food table with potassium, phosphorus, protein, energy, sodium, fluid and household portions. The starting point is `indian_renal_food_tables.csv`, which has three sources:

- Potassium, general Indian guide (May 2023): 116 foods, with category, portion, mg per portion and mg per 100 g.
- Potassium, North Indian guide (June 2023): about 115 foods, without categories.
- Phosphate, Indian renal food guide (Feb 2026): about 110 foods, with High (100 mg or more per portion) or Lower categories.

Two further potassium guides were uploaded and are now in the CSV, as the West and Central Indian guide (August 2023, 109 foods) and the South Indian guide (August 2024, 207 foods, grouped by state: Andhra Pradesh, Kerala, Karnataka and Tamil Nadu). Both are PRNT and Vitaflo products. Their categories are derived from the printed mg bands, because the colour coding does not survive in the text layer. The West and Central guide uses Hindi, Marathi and Gujarati names, and the South guide uses regional-language names with an English column. The total is now 643 rows across five sources.

The guides disagree on some values and categories. For example, sambar is 201 mg K per bowl in the general guide and 68 mg in the phosphate guide's portion data, which is a different preparation. The engine must store the source with every value and must not merge sources silently. Use item-level IFCT 2017 values as the reference once the table is built (IFCT is linked from the PRINT resources page).

None of the three Indian guides gives leaching instructions. The course describes double-boiling tubers and pulses, but the Indian guides do not confirm this per food. Leaching advice needs a dietitian's sign-off before the app shows it.

## 5. Intake capture

Methods: 24-hour recall for children aged 4 to 10 through a caregiver interview, a 3-day diary, a food frequency questionnaire, and app logging. Start with a 24-hour recall in week one, then a 3-day diary monthly. Caregivers should log in Hindi or Bhojpuri, by photo or voice.

Misreporting prompts: ask about snacks, drinks, festival days, weekends and school lunches. Under-reporting of large portions and over-reporting of small ones is common.

Symptom screen at each entry: anorexia, nausea, vomiting, early satiety, dysgeusia, abdominal pain, constipation or diarrhoea, reflux, oral ulcers, and food aversion. A positive screen flags the clinician.

Fluid: milk, soups, ice cream, IV fluid, urine output, dialysis ultrafiltration, and interdialytic weight gain.

## 6. Meal engine

Templates: vegetarian and non-vegetarian Indian meals across the 10 ICMR food groups. Aim for at least 5 to 7 groups a day. Adjust by condition: leached tubers for hyperkalaemia, low-phosphate protein for hyperphosphataemia, and no-added-salt cooking for oedema or hypertension.

Homemade feed: the course's rice-moong feed (rice flour 20 g, moong dal flour 10 g, sugar 10 g, oil 5 g, water 150 mL) gives about 170 kcal and 4 to 5 g protein. Recalculate for each child.

Output: energy in kcal/day and kcal/kg/day; protein in g/day and g/kg/day; sodium in mg/day; potassium and phosphate instructions with reasons; calcium in mg/day; fluid in mL/day; fibre in g/day; micronutrients. Convert each number into household portions.

## 7. Link to the monitoring platform

The project's platform records weight, BP and dipstick protein, and its alert logic uses a 7% weight gain above dry weight, and BP above the 95th centile. The nutrition module adds intake data to the same caregiver app, in the same language, and feeds it into the same dataset. This makes three additions possible:

- Diet as a covariate in the relapse predictor (sodium and energy intake against relapse timing).
- A sodium-intake flag in the oedema pathway, alongside the 7% weight alert.
- Diet-adherence measures, reported alongside the platform's existing adherence outcome.

Scheduling and prompts use the platform's WhatsApp and SMS layer, not the app alone.

## 8. Data, privacy and interoperability

DPDP Act 2023 applies throughout. Diet data is personal health data, so it needs the same consent, pseudonymisation, and access controls as the rest of the platform. The consent forms in the IEC submission must cover nutrition logging before any data is collected.

Interoperability: diet records map to FHIR R4 for the ABDM integration the project is preparing. The nutrition-related FHIR resources (for example NutritionIntake and NutritionOrder) need a mapping check before build.

Computation stays on the server. The project's concept note keeps interpretation server-side so the device remains a relay, which limits the regulatory burden to the component that computes. A diet-prescribing rules engine may itself be medical-device software. Check the CDSCO classification with the regulatory consultant before release, not after.

## 9. Validation plan

Follow the project's Statistical Validation Guide. Report every metric with a bootstrapped 95% CI:
- Agreement: for the food-table values, compare against a dietitian's reference recall.
- Clinical: for the prescription, measure adherence and the change in intake and in growth velocity against the prior period. Use decision curve analysis to show whether the nutrition advice changes outcomes.
- Subgroups: stratify by age band, disease group (NS, CKD, dialysis), and literacy level, following the guide's fairness reporting.

Test the module against the course's model cases (Module 8) and the ten common pitfalls before any clinical pilot.

Report the work under TRIPOD+AI or STARD-AI, whichever the manuscript type requires, consistent with the project's existing reporting plan.

## 10. Framing and IP

Keep the project's framing consistent: all IP resides with Dr. Swarnim, and Aminobots is a technical development partner under NDA with no ownership. The course content is copyrighted. Use it as a reference for the rules, and do not copy its text or tables into the app. The Indian food guides are published PRINT resources, so cite them rather than reproducing them.

## 11. Open questions and gaps

- Resolved: the South Indian and West/Central Indian potassium guides are now in the CSV from the uploaded PDFs. Check the South guide's Karnataka section, which has garbled Kannada names in the text layer; the English names and values are used.
- Source conflicts to resolve: the 2026 paper and the course disagree on phosphate bioavailability (animal 40 to 60% vs 40 to 70%, plant 20 to 40% vs 20 to 50%) and on dialysate glucose energy (7 to 9 vs 7 to 10 kcal/kg/day). Both are kept with their source.
- Calcium and phosphate SDI by age from the 2026 paper are not in the text layer. They appear in a table image and need checking before use.
- Declared interest: Vitaflo, a nutrition company, has funded PRNT meetings, and it is also a partner on the Indian food guides. The 2026 paper's authors state that Vitaflo did not influence its content. Note this in any citation or validation report.
- The protein SDI table from ICMR-NIN (course Module 0) and the renal supplement composition tables (Module 3) did not extract as text. Verify from source.
- The course quotes 2.5 g/day salt for hypertension, which looks like an adult figure. Confirm the paediatric value from the PRNT sodium paper.
- The primary PRINT energy and protein paper (PMC6968982) was not opened directly, because of a verification challenge. The values come from the course. Check them against the paper.
- Leaching instructions for Indian foods need dietitian sign-off.
- Who signs off the targets, and under what clinical governance?
- Does the nutrition module need its own IEC amendment, or can it sit under the existing study?

## 12. Sources

- rn4kids PRINT course, Modules 0 to 8, read in Chrome, 14 Oct 2026.
- rn4kids PRINT resources page (https://www.rn4kids.org/resources/), which links the food guides below.
- Indian Renal Food Guide, Potassium (May 2023): https://www.rn4kids.org/wp-content/uploads/2026/09/Indian-Renal-food-Guide-POTASSIUM-May-2023.pdf
- Indian Renal Food Guide, Potassium, North Indian diet (June 2023): https://www.rn4kids.org/wp-content/uploads/2026/09/North-India-Renal-food-Guide-POTASSIUM-June-2023.pdf
- Indian Renal Food Guide, Phosphate (Feb 2026): https://www.rn4kids.org/wp-content/uploads/2026/09/Indian-Renal-Food-Guide-Phosphate-Feb-2026.pdf
- IFCT 2017, NIN-ICMR: https://www.nin.res.in/IFCT_concisecopy.html (linked, not opened).
- ICMR-NIN Dietary Guidelines for Indians 2024: https://agritech.tnau.ac.in/nutrition/pdf/DGI_07th_May_2024_fin.pdf (Table 1.6 excerpt).
- Polderman N, Shaw V et al. Ten tips on how to optimize nutrition in children with CKD or on dialysis. Clin Kidney J 2026;19(4):sfag046 (open access, CC BY-NC 4.0). Uploaded PDF.
- PRNT with Vitaflo. Food guide for managing potassium intake, West and Central Indian diet (Aug 2023). Uploaded PDF.
- PRNT with Vitaflo. Food guide for managing potassium intake, South Indian diet (Aug 2024). Uploaded PDF.
- Shaw V et al. Energy and protein requirements for children with CKD stages 2-5 and on dialysis. Pediatr Nephrol 2020. Cited via the course.
- Desloovere A et al. Potassium in children with CKD. Pediatr Nephrol 2021. Cited via the course.
- PRNT. Sodium intake in children with CKD. Pediatr Nephrol 2021. Cited via the course.
- Stabouli S et al. Obesity and metabolic syndrome in children with CKD. Pediatr Nephrol 2022. Cited via the course.
- Kidney Care AI project documents: the Paediatric CKD Concept Note Summary, the IoT BP vs ABPM concept, the ANRF pre-proposal, the APIIC progress report, the CR1916619677 protocol, and the Statistical Validation Guide.
