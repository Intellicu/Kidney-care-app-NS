# KidneyCare Nutrition Module: Spec v4

As of 15 Oct 2026. Built from the full rn4kids PRINT course (Modules 0 to 8), the Indian renal food guides linked from the PRINT resources page, the ICMR-NIN Dietary Guidelines for Indians 2024 (full uploaded copy read, pages 1 to 148), and the Kidney Care AI project documents. Machine-readable targets are in `nutrition_targets.json`. Food values are in `indian_renal_food_tables.csv`. Clinician sign-off is required before any value is used for care.

Change from v3: ICMR-NIN 2024 details added (sections 3, 4, 6, 8 and 13), with a conflict register in section 13. The ICMR text is cited, not reproduced.

## 1. Scope (v1)

The module records what a child eats, compares it with age-, sex- and condition-specific targets, and produces an Indian meal plan that fits those targets. It is paediatric only, matching the project's scope decision. The adult diabetic extension is named as a later translation, not costed.

Users: caregivers log meals at home in Hindi or Bhojpuri. Clinicians review a summary and the prescription.

Populations: nephrotic syndrome (the validated cohort), CKD stages 2 to 5, and children on PD or HD. Post-transplant rules are deferred to v2.

The ICMR-NIN 2024 guidelines are the reference for healthy Indian children and adolescents. They are not the treatment target for any child in this module. Section 13 sets out how the two are reconciled.

## 2. Energy and protein targets

Start from the PRINT Suggested Dietary Intake (SDI) for the child's age and sex. The energy SDI is the 50th centile range. The protein SDI meets the needs of 97.5% of children.

Examples: a 6-year-old girl has energy 64 to 90 kcal/kg/day and protein 0.85 to 0.95 g/kg/day (16 to 22 g/day). A 10-year-old boy has energy 55 to 69 kcal/kg/day and protein 26 to 40 g/day. Full tables are in the JSON.

Reference only: ICMR-NIN Table 1.6 gives healthy-child energy and protein for Indian children (for example about 1110 kcal and 38 g protein at 1 to 3 years, and about 1370 kcal and 46 g at 4 to 6 years). These protein figures are two to three times the PRINT SDI for a child of similar age, so they cannot be used as CKD protein targets. See section 13, conflict C1.

Adjustments:
- Poor growth: aim for the upper end of the energy range.
- CKD stages 2 to 3: no routine protein restriction.
- CKD stages 4 to 5, not on dialysis: keep age-appropriate protein.
- Persistently high urea: check total intake, hydration, catabolism and dialysis adequacy first. Only then consider the lower end of protein.
- Dialysis: add 0.15 to 0.3 g/kg/day on PD and 0.1 g/kg/day on HD. PD protein losses run from 0.28 g/kg/day in infants to 0.1 g/kg/day in adolescents, so the top of the add-on range suits younger children (Polderman et al. 2026). Count PD dextrose energy at about 7 to 9 kcal/kg/day per the 2026 paper; the course gives 7 to 10. Use the paper value in the rules engine pending clinician sign-off, and record the source with the value.
- Energy: where feeding is poor, the 2026 paper also advises the upper end of the energy SDI, and uses height age rather than chronological age for poor linear growth.
- Protein quality: ICMR-NIN advises a cereal to pulse ratio of about 3:1 to improve protein quality, and recommends against protein supplements because of the risk to bone and kidney. The second point agrees with this module, which does not add protein powders in any population (section 13, row C7).

## 3. Condition rules

Nephrotic syndrome: relapse is urine protein 3+ or UPCR of 2 mg/mg or more. Remission is nil or trace protein for 3 days, with oedema gone and weight back at dry weight. In relapse, use no-added-salt cooking, favour complex carbohydrate, and do not restrict fluid automatically. Fat is limited only after age 2. In remission, return to a normal sodium diet.

Potassium: restrict only with measured hyperkalaemia on trend (5.3 mmol/L or more in children). Check non-dietary causes first, including ACE inhibitors, ARBs, spironolactone, NSAIDs, constipation and acidosis. The main hidden sources are salt substitutes, potassium additives and coconut water. ICMR-NIN also says tender coconut water should be avoided in hyperkalaemia, which agrees with this rule. The Indian potassium guide treats high-potassium foods as a reference, not a blacklist. Adjust portions and leaching rather than cutting staples by default.

The 2026 paper sets out the same approach as a stepwise order (Polderman et al.). First correct non-dietary causes. Second, restrict foods with potassium additives. Third, replace high-potassium foods of low nutritional value. Fourth, do not routinely exclude fruit, vegetables or whole grains, since they carry fibre and nutrients. Fifth, limit animal protein while still meeting protein needs. A potassium binder such as sodium zirconium cyclosilicate is the last option where diet cannot achieve control or cannot be kept up.

ICMR-NIN's healthy-diet targets (400 g vegetables and 100 g fruit a day, and a 3,800 mg potassium intake at 5 g salt) conflict with a potassium restriction. They must not be applied as a floor. See section 13, conflicts C2 and C3.

Fibre: the PRNT fibre SDI is 8.3 to 14.2 g per 1000 kcal (Polderman et al. 2026). Children with CKD often fall short, so the meal engine should prefer plant-based, fibre-rich staples within the potassium and phosphate limits. Where potassium or phosphate limits conflict with fibre, the paper says to keep energy and protein adequate first, and to accept a fibre shortfall over a restriction that causes malnutrition. ICMR-NIN's emphasis on whole grains (at least half of cereals, and one-third in the elderly) raises phosphate and potassium as well as fibre. See section 13, conflict C4.

Calcium: the PRNT total calcium target is 100 to 200% of the SDI, counting breast milk, formula, food and calcium-based medicines. When phosphate is restricted, the meal engine must still meet calcium using non-dairy sources such as plant milks, calcium-set tofu and fortified cereals, with supplements or high-calcium dialysate where needed. ICMR-NIN gives children 850 to 1050 mg calcium a day, mainly from milk and dairy. Milk also brings phosphate and potassium, so the engine must check calcium against both limits. See section 13, conflict C5.

Phosphate bioavailability (Polderman et al. 2026): additives up to 100%, animal sources 40 to 60%, plant sources 20 to 40%. The course gives 90 to 100% for additives, 40 to 70% for animal sources and 20 to 50% for plant sources. The two sources differ, so the engine must store which one each value came from. Phosphate-binder doses are taken with food or formula, and whey-dominant or renal formulas have lower phosphate content.

Ultra-processed food (UPF): ICMR-NIN defines UPFs (Table 15.2 in its guideline 15) and asks people to avoid them and HFSS foods (high fat, sugar or salt). This matches the CKD rule. Processed and ultra-processed foods account for about 80% of sodium intake in Western countries (Polderman et al. 2026). The engine should flag UPF-heavy meals for sodium, phosphate and potassium additives, and it should keep salt substitutes off the list. ICMR-NIN's label guidance does not cover phosphate or potassium additives. The engine must check ingredient lists for these itself (section 8).

Phosphate: restrict additives before protein. Additive phosphate is 90 to 100% absorbed, animal phosphate 40 to 70%, and plant phosphate 20 to 50%. Targets are processed meats, colas, instant noodles, processed cheese, packaged namkeen, bakery and canned sweets. ICMR-NIN also lists sugar-sweetened and carbonated drinks, fruit juice, jam, sauces and biscuits as foods to limit, which overlaps. Swaps include buttermilk, paneer, home-cooked poha or khichdi, and roasted chana or makhana. Calcium carbonate with meals is first-line; sevelamer and lanthanum are non-calcium options.

Sodium: children aged 1 to 3 years have a chronic disease risk reduction target of 1.2 g sodium (3.0 g salt) per day. This rises to 2.3 g (5.5 g salt) at 14 to 18 years. Restrict in hypertension, albuminuria, oedema and PD fluid overload. Increase in renal sodium wasting or hypotension. Do not estimate intake from serum or urinary sodium. Label thresholds are 140 mg or less per serving for low, 35 mg or less for very low, and 5 mg or less for salt-free.

ICMR-NIN's general limit is 5 g salt (2,000 to 2,300 mg sodium) a day. The guideline gives this for the general population and does not set an age-specific paediatric value, so it is an upper bound here. Children's targets above take priority. ICMR-NIN also says sodium-to-potassium ratio matters as much as sodium alone, and that salt should be cut early, before taste is acquired. Pink, rock and black salts are sodium chloride with trace minerals, and ICMR-NIN says they should be limited just like white salt. Salt substitutes (potassium chloride) are listed in section 3 under potassium.

Dialysis: on HD, restrict fluid and sodium to control interdialytic weight gain, and restrict potassium as needed. On PD, fluid is more flexible and potassium is not routinely restricted. Give water-soluble vitamins after dialysis starts. Use IV iron with ESA on HD. Escalate to enteral feeding early in infants. Reserve IDPN for persistent malnutrition.

Fluid: ICMR-NIN's default is about 2 litres of water a day for adults, and it says to drink more in heat and with vigorous activity. These are healthy-person defaults. They must not be applied to children on HD, children with oedema or hypertension, or children with oliguria. Fluid targets come from the clinician's prescription, and the engine shows them as a limit, not a goal. Fruit juice and carbonated drinks should be avoided, and tender coconut water is avoided in hyperkalaemia. Lemon water and buttermilk are the ICMR-NIN alternatives to sugary drinks, and both need a potassium check (buttermilk is also a dairy source of phosphate).

Growth and obesity: use weight-for-height (WHO) at ages 2 to 5 and BMI-for-age above age 5. Overweight is above +1 SD (BMI) or +2 SD (weight-for-height). Obesity is above +2 SD (BMI) or +3 SD (weight-for-height). Approach by improving diet quality, not aggressive restriction. No anti-obesity drugs in CKD 2 to 5D.

ICMR-NIN also gives children 60 minutes a day of moderate to vigorous activity (guideline 10). Activity is a second lever alongside diet for children with obesity, and the engine should prompt for it. ICMR-NIN's weight-loss advice (a deficit of 500 to 750 kcal a day, and not below 1000 kcal a day) is written for adults and is not used here. Children's targets come from section 2. ICMR-NIN's Asian BMI cut-offs (overweight from 23 kg/m², obesity above 27.5 kg/m²) are also adult values.

Infants: breastfeed on demand. Start complementary foods at about 6 months. Fortify feeds rather than diluting them when fluid is restricted. Expressed breast milk can be fortified with infant formula powder from the usual 13% (67 kcal/100 mL) up to 20% (100 kcal/100 mL). A whey-dominant formula is preferred because it is lower in phosphate and potassium (Polderman et al. 2026). ICMR-NIN also advises no salt, sugar, honey or water before 6 months, and no added sugar under 2 years. Both agree with this module. Complementary foods for infants are in section 6.

Enteral feeding: the 2026 paper advises starting tube feeding early when the weight centile falls or oral intake stays inadequate. An NG tube can bridge to a gastrostomy. For children on PD, plan the gastrostomy carefully, given the peritonitis risk and the need for antibiotic prophylaxis. The engine should flag these triggers to the clinician rather than decide them. Breast milk has 58 mg potassium per 100 mL, whey formula 69 mg, and cow's milk about 150 mg. Never use cow's milk as a substitute.

Illness feeding: ICMR-NIN advises continuing feeds during and after illness, and using ORS for diarrhoea. Standard ORS contains potassium and sodium, so in CKD, ORS and any electrolyte solution must be checked against the prescription before use (section 13, row C8).

## 4. Food table

The module needs a food table with potassium, phosphorus, protein, energy, sodium, fluid and household portions. The starting point is `indian_renal_food_tables.csv`, which has three sources:

- Potassium, general Indian guide (May 2023): 116 foods, with category, portion, mg per portion and mg per 100 g.
- Potassium, North Indian guide (June 2023): about 115 foods, without categories.
- Phosphate, Indian renal food guide (Feb 2026): about 110 foods, with High (100 mg or more per portion) or Lower categories.

Two further potassium guides were uploaded and are now in the CSV, as the West and Central Indian guide (August 2023, 109 foods) and the South Indian guide (August 2024, 207 foods, grouped by state: Andhra Pradesh, Kerala, Karnataka and Tamil Nadu). Both are PRNT and Vitaflo products. Their categories are derived from the printed mg bands, because the colour coding does not survive in the text layer. The West and Central guide uses Hindi, Marathi and Gujarati names, and the South guide uses regional-language names with an English column. The total is now 643 rows across five sources.

The guides disagree on some values and categories. For example, sambar is 201 mg K per bowl in the general guide and 68 mg in the phosphate guide's portion data, which is a different preparation. The engine must store the source with every value and must not merge sources silently. Use item-level IFCT 2017 values as the reference once the table is built (IFCT is linked from the PRINT resources page).

ICMR-NIN's Annexure IV groups foods by food group (cereals and millets, pulses, GLVs, vegetables, roots and tubers, fruits, nuts, meat and fish, and milk products), and its Annexure II gives raw-weight measures for common Indian foods. Use these as the grouping and portion reference for the engine's food table, and keep the PRINT values for nutrient content. ICMR-NIN's Table 1.3 to 1.5 nutrient values per 100 g do not include potassium or phosphate, so they cannot replace the PRINT guides.

Household measures (ICMR-NIN Annexure I): katori C6 360 mL, C7 200 mL, C8 155 mL and C9 115 mL; cup 200 mL; tablespoon 15 g; teaspoon 5 g. The engine converts grams into these household units for caregivers, and must show the portion weight alongside any measure.

None of the three Indian guides gives leaching instructions. The course describes double-boiling tubers and pulses, but the Indian guides do not confirm this per food. ICMR-NIN advises the opposite for pulses and grains (section 13, conflict C6). Leaching advice needs a dietitian's sign-off before the app shows it.

## 5. Intake capture

Methods: 24-hour recall for children aged 4 to 10 through a caregiver interview, a 3-day diary, a food frequency questionnaire, and app logging. Start with a 24-hour recall in week one, then a 3-day diary monthly. Caregivers should log in Hindi or Bhojpuri, by photo or voice.

Misreporting prompts: ask about snacks, drinks, festival days, weekends and school lunches. Under-reporting of large portions and over-reporting of small ones is common.

Symptom screen at each entry: anorexia, nausea, vomiting, early satiety, dysgeusia, abdominal pain, constipation or diarrhoea, reflux, oral ulcers, and food aversion. A positive screen flags the clinician.

Fluid: milk, soups, ice cream, IV fluid, urine output, dialysis ultrafiltration, and interdialytic weight gain.

Measurement: caregivers estimate in household units (section 4). ICMR-NIN notes that home measures vary a lot and recommends standard katori and spoon sizes, so the app should show a photo guide for each unit.

## 6. Meal engine

Templates: vegetarian and non-vegetarian Indian meals across the 10 ICMR food groups. Aim for at least 5 to 7 groups a day, which is ICMR-NIN's guideline 1 target. Adjust by condition: leached tubers for hyperkalaemia, low-phosphate protein for hyperphosphataemia, and no-added-salt cooking for oedema or hypertension.

ICMR-NIN food-group quantities (reference only, guideline 6 and Table 1.6): about 400 g vegetables (including 100 g green leafy vegetables) and 100 g fruit a day, 250 to 300 g of cereals and millets for children aged 7 and over, 350 to 400 mL of milk, 10 to 20 g of nuts, and 20 to 30 g of oil. Ceilings from section 3 override these. Where a child's potassium or phosphate ceiling is lower than the ICMR quantity, the engine reduces the portion and shows the reason, rather than dropping the food group.

Tubers: ICMR-NIN says potatoes, yams, colocasia and cassava should be restricted in the diet, and that carrot, radish, beetroot, knol-khol and turnip are better choices. This supports the potassium rules in section 3, and the engine should follow it as a default for all children.

Infant complementary feeding (ICMR-NIN guideline 4): complementary food supplies about 230 kcal a day at 6 to 8 months and about 385 kcal at 9 to 12 months, on top of breast milk. Minimum meal frequency is 2 a day at 6 to 8 months, 3 a day at 9 to 24 months, and 4 a day for non-breastfed children aged 6 to 24 months. Minimum dietary diversity is 5 of 8 groups. ICMR-NIN's age-specific diet charts (Annexure II) show raw-weight portions for 6 to 8 months, 9 to 12 months and 1 to 3 years. These charts use pulses, egg, nuts, fish and green leafy vegetables, so the engine must check each item against the child's potassium and phosphate limits before using a chart. Infant ARF (amylase-rich food, from 250 g of cereals soaked, germinated, dried, roasted and ground) is an ICMR-NIN preparation. The engine may offer it as a calorie-dense option for infants with poor intake, but only as a clinician-approved item, because it is grain-based and its potassium and phosphate content has not been measured.

Homemade feed: the course's rice-moong feed (rice flour 20 g, moong dal flour 10 g, sugar 10 g, oil 5 g, water 150 mL) gives about 170 kcal and 4 to 5 g protein. Recalculate for each child.

Output: energy in kcal/day and kcal/kg/day; protein in g/day and g/kg/day; sodium in mg/day; potassium and phosphate instructions with reasons; calcium in mg/day; fluid in mL/day; fibre in g/day; micronutrients. Convert each number into household portions.

Micronutrient screening: ICMR-NIN's current-scenario tables (CNNS 2019 data) report anaemia in 23 to 41% of children and adolescents, iron deficiency in 17 to 32%, vitamin D deficiency in 14 to 24%, and zinc deficiency in 17 to 32%. CKD children are at similar or higher risk of anaemia and vitamin D deficiency. The engine should prompt for haemoglobin, iron studies and vitamin D at baseline, and should not infer deficiency from diet alone.

## 7. Link to the monitoring platform

The project's platform records weight, BP and dipstick protein, and its alert logic uses a 7% weight gain above dry weight, and BP above the 95th centile. The nutrition module adds intake data to the same caregiver app, in the same language, and feeds it into the same dataset. This makes three additions possible:

- Diet as a covariate in the relapse predictor (sodium and energy intake against relapse timing).
- A sodium-intake flag in the oedema pathway, alongside the 7% weight alert.
- Diet-adherence measures, reported alongside the platform's existing adherence outcome.

Scheduling and prompts use the platform's WhatsApp and SMS layer, not the app alone.

Physical activity (ICMR-NIN guideline 10) is captured as a single weekly measure, so that activity and intake can be read together in the obesity pathway.

## 8. Data, privacy and interoperability

DPDP Act 2023 applies throughout. Diet data is personal health data, so it needs the same consent, pseudonymisation, and access controls as the rest of the platform. The consent forms in the IEC submission must cover nutrition logging before any data is collected.

Interoperability: diet records map to FHIR R4 for the ABDM integration the project is preparing. The nutrition-related FHIR resources (for example NutritionIntake and NutritionOrder) need a mapping check before build.

Labels: the ICMR-NIN label guidance (guideline 17) covers energy, sugar, fat, sodium, fibre, RDA percentage and claims. Its claims list includes 'low fat', 'sugar-free', 'real fruit', 'natural' and 'made with whole grain', and it warns that fortification does not make an ultra-processed food healthy. Ingredient checks in the app need two additions the ICMR text does not cover: potassium additives and salt substitutes (potassium chloride), and phosphate additives (listed as phosphoric acid, sodium or potassium phosphate, or E338 to E452 in the ingredient list). These checks are the engine's responsibility and need a regulatory check of the list before release.

Computation stays on the server. The project's concept note keeps interpretation server-side so the device remains a relay, which limits the regulatory burden to the component that computes. A diet-prescribing rules engine may itself be medical-device software. Check the CDSCO classification with the regulatory consultant before release, not after.

## 9. Validation plan

Follow the project's Statistical Validation Guide. Report every metric with a bootstrapped 95% CI:
- Agreement: for the food-table values, compare against a dietitian's reference recall.
- Clinical: for the prescription, measure adherence and the change in intake and in growth velocity against the prior period. Use decision curve analysis to show whether the nutrition advice changes outcomes.
- Subgroups: stratify by age band, disease group (NS, CKD, dialysis), and literacy level, following the guide's fairness reporting.

Test the module against the course's model cases (Module 8) and the ten common pitfalls before any clinical pilot. Add a test for each conflict in section 13, so the rules engine shows which rule won and why.

Report the work under TRIPOD+AI or STARD-AI, whichever the manuscript type requires, consistent with the project's existing reporting plan.

## 10. Framing and IP

Keep the project's framing consistent: all IP resides with Dr. Swarnim, and Aminobots is a technical development partner under NDA with no ownership. The course content is copyrighted. Use it as a reference for the rules, and do not copy its text or tables into the app. The Indian food guides are published PRINT resources, and the ICMR-NIN Dietary Guidelines for Indians 2024 is a government publication. Cite both rather than reproducing them. Use ICMR-NIN's numbers as reference values with page or guideline citations, and do not copy its tables, figures or verbatim text into the app.

## 11. Open questions and gaps

- Resolved: the South Indian and West/Central Indian potassium guides are now in the CSV from the uploaded PDFs. Check the South guide's Karnataka section, which has garbled Kannada names in the text layer; the English names and values are used.
- Resolved: the ICMR-NIN 2024 guidelines were read in full (pages 1 to 148). Their paediatric and adult values are sorted in section 13.
- Source conflicts to resolve: the 2026 paper and the course disagree on phosphate bioavailability (animal 40 to 60% vs 40 to 70%, plant 20 to 40% vs 20 to 50%) and on dialysate glucose energy (7 to 9 vs 7 to 10 kcal/kg/day). Both are kept with their source.
- ICMR-NIN conflicts (section 13) need a clinician decision before the engine can show a combined target: protein (C1), potassium from vegetables (C2, C3), whole grains and phosphate (C4), calcium from milk (C5), leaching (C6), and paediatric sodium (C7).
- Calcium and phosphate SDI by age from the 2026 paper are not in the text layer. They appear in a table image and need checking before use.
- Declared interest: Vitaflo, a nutrition company, has funded PRNT meetings, and it is also a partner on the Indian food guides. The 2026 paper's authors state that Vitaflo did not influence its content. Note this in any citation or validation report.
- The protein SDI table from ICMR-NIN (course Module 0) and the renal supplement composition tables (Module 3) did not extract as text. Verify from source.
- The course quotes 2.5 g/day salt for hypertension, which looks like an adult figure. Confirm the paediatric value from the PRNT sodium paper.
- The primary PRINT energy and protein paper (PMC6968982) was not opened directly, because of a verification challenge. The values come from the course. Check them against the paper.
- Leaching instructions for Indian foods need dietitian sign-off.
- Does sprouting or fermenting grains (which ICMR-NIN promotes) change phytate-bound phosphate absorption enough to matter? Not established in the text; needs a dietitian's review before the engine uses it.
- Who signs off the targets, and under what clinical governance?
- Does the nutrition module need its own IEC amendment, or can it sit under the existing study?

## 12. Sources

- rn4kids PRINT course, Modules 0 to 8, read in Chrome, 14 Oct 2026.
- rn4kids PRINT resources page (https://www.rn4kids.org/resources/), which links the food guides below.
- Indian Renal Food Guide, Potassium (May 2023): https://www.rn4kids.org/wp-content/uploads/2026/09/Indian-Renal-food-Guide-POTASSIUM-May-2023.pdf
- Indian Renal Food Guide, Potassium, North Indian diet (June 2023): https://www.rn4kids.org/wp-content/uploads/2026/09/North-India-Renal-food-Guide-POTASSIUM-June-2023.pdf
- Indian Renal Food Guide, Phosphate (Feb 2026): https://www.rn4kids.org/wp-content/uploads/2026/09/Indian-Renal-Food-Guide-Phosphate-Feb-2026.pdf
- IFCT 2017, NIN-ICMR: https://www.nin.res.in/IFCT_concisecopy.html (linked, not opened).
- ICMR-NIN, Dietary Guidelines for Indians 2024 (revised). Full copy uploaded as ICMR_diet.pdf and read in full (pages 1 to 148). Guidelines 1 to 17, Figures 1.2, 9.1, 9.2, 16.1, 16.2, Tables 1.6, 10.1, 15.1, 15.2, 16.1, 16.2, 17.1, Annexures I to IV, pp. 1 to 128. Earlier citation: https://agritech.tnau.ac.in/nutrition/pdf/DGI_07th_May_2024_fin.pdf (Table 1.6 excerpt).
- ICMR-NIN current-scenario data cited in the Dietary Guidelines (CNNS 2019 and NFHS-5), as reproduced in the uploaded copy, pp. 4 to 5.
- Polderman N, Shaw V et al. Ten tips on how to optimize nutrition in children with CKD or on dialysis. Clin Kidney J 2026;19(4):sfag046 (open access, CC BY-NC 4.0). Uploaded PDF.
- PRNT with Vitaflo. Food guide for managing potassium intake, West and Central Indian diet (Aug 2023). Uploaded PDF.
- PRNT with Vitaflo. Food guide for managing potassium intake, South Indian diet (Aug 2024). Uploaded PDF.
- Shaw V et al. Energy and protein requirements for children with CKD stages 2-5 and on dialysis. Pediatr Nephrol 2020. Cited via the course.
- Desloovere A et al. Potassium in children with CKD. Pediatr Nephrol 2021. Cited via the course.
- PRNT. Sodium intake in children with CKD. Pediatr Nephrol 2021. Cited via the course.
- Stabouli S et al. Obesity and metabolic syndrome in children with CKD. Pediatr Nephrol 2022. Cited via the course.
- Kidney Care AI project documents: the Paediatric CKD Concept Note Summary, the IoT BP vs ABPM concept, the ANRF pre-proposal, the APIIC progress report, the CR1916619677 protocol, and the Statistical Validation Guide.

## 13. ICMR-NIN 2024 integration and conflict register

Scope of this section: ICMR-NIN describes a healthy diet for the general population. It is used here for food-group structure, portion references, food safety, labelling, infant feeding and household measures. Where it gives a numeric target that conflicts with a CKD rule, the CKD rule wins for any child in this module, and the conflict is logged below for clinician decision.

Use of ICMR-NIN in the engine, by guideline:
- Guideline 1 (food groups, 5 to 7 groups a day): used for meal templates (section 6).
- Guideline 2 (pre-conception, pregnancy, lactation): out of paediatric scope, except for adolescent girls, where it is a later check.
- Guideline 3 and 4 (breastfeeding, complementary feeding, ARF, minimum dietary diversity and frequency): used for infant rules (sections 3 and 6).
- Guideline 5 (calcium, illness feeding, WHO growth references for ages 2 to 5): used for calcium reference, illness feeding and growth charts.
- Guideline 6 (vegetables, fruit, tubers): used for portion references and the tuber default (section 6), with the potassium ceilings overriding.
- Guideline 7 (fats and oils, visible fat 20 to 30 g a day for adults): used for oil portions.
- Guideline 8 (protein, RDA 0.83 g/kg/day for adults, no protein supplements): used for the supplement rule only. Protein targets stay with section 2.
- Guideline 9 and 10 (BMI, obesity, physical activity): used for the activity prompt; BMI cut-offs are adult values.
- Guideline 11 (salt, 5 g a day general limit, sodium to potassium ratio): used for the general upper bound (section 3).
- Guideline 12 and 13 (food safety, cooking methods): used for food safety and cooking advice, subject to conflict C6.
- Guideline 14 (water, tender coconut water, fruit juices, tea and coffee): used for fluid and beverage rules (section 3).
- Guideline 15 (HFSS and UPF, Table 15.2 classification): used for the UPF flag (section 3).
- Guideline 16 (elderly, 60 years and over): out of paediatric scope.
- Guideline 17 (food labels, claims): used for label checks (section 8).
- Annexures I and II (household measures, raw-weight charts for infants, children and adults): used for portions (sections 4 and 6).
- Annexure III (glycaemic carbohydrate and GI/GL of common Indian foods): reference only, for the adult diabetic extension. Not used in v1.
- Annexure IV (food groups by item): used for food grouping.

Conflict register:

- C1 Protein. Table 1.6 gives 46 g a day at 4 to 6 years, and 59 g at 7 to 9 years. The PRINT SDI for similar children is about 16 to 22 g a day for a 6-year-old girl. The gap is two- to three-fold, and the ICMR-NIN text does not show how its figures were derived. Decision: CKD rule (PRINT SDI) applies. Check the ICMR figures against the ICMR-NIN RDA source before any use. Owner: clinician and dietitian.

- C2 Vegetables and fruit. ICMR-NIN advises about 400 g vegetables and 100 g fruit a day. Many of these foods are high in potassium. Decision: the target is replaced by the potassium ceiling for any child with hyperkalaemia or a potassium-restricted prescription. Otherwise the ICMR target applies, with the portion adjusted by leaching and choice, not by dropping the group (section 3).

- C3 Potassium target. ICMR-NIN's sodium text (guideline 11) gives about 3,800 mg potassium a day as the level that balances 5 g of salt. This is an adult figure for a general population and is higher than the potassium limit for many CKD children. Decision: not used. The CKD potassium rule in section 3 applies.

- C4 Whole grains and phosphate. ICMR-NIN asks for at least half of cereals as whole grains, and for pulses in a 3:1 cereal to pulse ratio. Whole grains and pulses carry phosphate (mostly plant phosphate, 20 to 50% absorbed) and potassium, and the fibre target conflicts with the potassium and phosphate limits. Decision: whole grains are kept where the phosphate and potassium ceilings allow. Fibre is accepted at a lower level where needed, following the 2026 paper (section 3).

- C5 Calcium from milk. ICMR-NIN gives children 850 to 1050 mg calcium a day and advises 350 to 400 mL of milk. Milk brings phosphate and potassium, and cow's milk has about 150 mg potassium per 100 mL. Decision: calcium target is met first from non-dairy sources where phosphate is restricted. Milk volume is capped by the phosphate and potassium ceilings, and the clinician decides on calcium supplements or binders (section 3).

- C6 Cooking water and leaching. ICMR-NIN advises cooking pulses and grains with just enough water and not draining it, to keep minerals and folate. It also advises against repeated washing of grains and pulses, and against soaking cut vegetables. Leaching for potassium needs the water to be discarded. Decision: ICMR-NIN's cooking advice applies to healthy children. For potassium-restricted children, leaching is shown only after dietitian sign-off, with the trade-off stated (section 4).

- C7 Paediatric sodium. ICMR-NIN gives 5 g of salt a day as a general limit and does not set an age-specific sodium value for children. Decision: the paediatric values in section 3 apply, and the general limit is only an upper bound.

- C8 ORS and electrolyte drinks. ICMR-NIN advises ORS for diarrhoea. Standard ORS contains potassium and sodium. Decision: in CKD children, ORS is checked against the prescription and the clinician advises on the type (section 3).

- C9 Baking soda and sodium. ICMR-NIN advises against baking soda when cooking pulses and vegetables, because it adds sodium. This agrees with the no-added-salt rule. No conflict; logged for the cooking templates.

- C10 Milk and protein quality. ICMR-NIN says 250 mL of milk adds essential amino acids to the diet, and that milk is not a source of iron. The CKD rule limits milk for phosphate and potassium. Decision: milk volume follows section 3 and the clinician decides. No protein powders are used (section 2).

Agreement points (no action needed beyond what is in the spec):
- Avoid UPF and HFSS foods, and avoid sugary drinks and fruit juice.
- Avoid protein supplements.
- Avoid tender coconut water in hyperkalaemia.
- No salt or sugar before 1 year, and no added sugar under 2 years.
- Limit tubers such as potato, yam, colocasia and cassava, and prefer root vegetables such as carrot and beetroot.
- Avoid repeated heating of cooking oil.
- Use pressure or steam cooking in preference to deep frying.
- Use WHO growth references for ages 2 to 5.
