# Technical invention disclosure: KidneyCare AI smartphone dipstick reader

**Prepared for:** Patent counsel, as an input to a provisional patent
application. **This is not a patent application and contains no claims.** It is a technical description
and a prior-art positioning note, written so that a registered patent agent or attorney can decide what,
if anything, to claim, and in what form. Counsel must draft the specification language and all claims;
nothing below should be filed as written.

**Prepared:** 17 October 2026 · **Source for all technical detail:** PNEP manuscript v14
(`PNEP_Revised_Manuscript_v14_ALLCHANGES.docx`), confirmed by the PI as the correct version. An earlier
internal draft described a different architecture (YOLO + SAM + ResNet-18); that architecture is **not
used** for any technical content here.

---

## 1. Field

Automated interpretation of a urine reagent test strip (dipstick) from a photograph taken on an
unmodified consumer smartphone, for grading urine protein in paediatric nephrotic syndrome.

## 2. Background

Home urine dipstick monitoring is standard of care in childhood nephrotic syndrome under Indian Society
of Pediatric Nephrology (ISPN) guidelines, with treatment escalation at a reading of 3+ or above on the
protein pad for three or more consecutive early-morning specimens. Caregiver visual reading of the pad
against a printed colour chart is subjective; reported inter-observer error ranges from 15% to 55%, and
reported dipstick sensitivity for proteinuria ranges from 63% to 97% depending on strip brand. In
under-resourced regions, imprecise home reading contributes to children presenting late, in complicated
relapse, after travelling long distances to a tertiary centre. No system in the prior art identified to
date (Section 6) has been designed or validated for this population and this strip brand.

## 3. Summary of the technical approach

A two-stage, on-device pipeline that takes a single smartphone photograph of a dipstick and returns one
of three clinically meaningful protein categories, with a confidence-based abstention mechanism:

**Stage 1 — Pad localisation.** A YOLOv8n object detector (fine-tuned from COCO-pretrained weights) is
trained for the single-class task of localising the protein reagent pad in the frame. The highest-
confidence bounding box is cropped with a 30% interior shrink on each side, retaining only the central
pad region. Training: approximately 200 annotated images, 60 epochs, batch size 8, image size 640×640,
on CPU (~14 minutes wall-clock).

**Stage 2 — Colour-feature classification.** From the cropped pad region, nine hand-crafted colour
features are extracted: three normalised RGB ratios (each channel mean divided by total intensity), the
peak and mean values of the HSV hue histogram, mean HSV saturation, mean CIE LAB a* and b* chromaticity,
and a binary flag for hue ordering. These nine features feed a LightGBM gradient-boosted multiclass
classifier (150 estimators, maximum depth 4, learning rate 0.05, values fixed from development
experience; no formal hyperparameter search was performed), which assigns one of three categories:
Negative/Trace, 1+/2+, or 3+/4+, aligned to the ISPN clinical action zones.

**Confidence-abstention mechanism.** The classifier's maximum posterior class probability is compared
against an operating threshold (0.70 in the reported configuration). A prediction below threshold is
withheld and flagged "Uncertain" rather than assigning a potentially erroneous category, prompting a
repeat test.

**Deployment footprint.** The finalised pipeline is 6.5 MB, runs on standard smartphone CPUs without
cloud connectivity or GPU acceleration, and returns a result in under one second.

## 4. Development and validation data (as reported in manuscript v14)

- 487 dipstick images acquired from 274 children (May 2025–April 2026); 453 retained after 34
  predefined quality exclusions.
- Training corpus: 400 images from 221 children (May 2025–March 2026).
- Held-out test set: 53 images from 53 different children, collected in April 2026 after the training
  corpus was closed; no child contributed to both sets; sets separated by both calendar date and patient
  identity.
- Reference standard: majority opinion of three blinded observers (consultant paediatric nephrologist,
  paediatric resident, trained clinical research coordinator), with the senior paediatric nephrologist
  adjudicating three-way disagreement.
- Reported performance on the held-out set: pad detection mAP@0.5 = 0.995; three-class agreement 94.34%
  (50/53); unweighted Cohen's κ = 0.911; quadratic-weighted κ = 0.953 (95% CI 0.886–1.000); at the ISPN
  ≥3+ relapse-action threshold, sensitivity 95.8% (79.8–99.3), specificity 93.1% (78.0–98.1).
- Strip used throughout: Urisign urine reagent strips (per manuscript v14, §2.2). **The strip identity
  should be re-confirmed against the current protocol before filing**, since an earlier internal draft
  of this project referenced a different brand for a related activity.
- Ethics: AIIMS Patna IEC, ref. AIIMS/Pat/IEC/2023/1158.

## 5. Candidate technical features for counsel's novelty assessment

Listed as features of the implemented system, not as an assertion of novelty — that determination is
counsel's.

1. The specific nine-feature colour descriptor set (three normalised RGB ratios, HSV hue peak and mean,
   HSV saturation mean, LAB a* and b* chromaticity, hue-ordering flag) as classifier input, in place of
   either raw pixel classification or a small set of generic RGB ratios.
2. The two-stage detect-then-classify architecture at the stated model size and latency, operating fully
   offline on consumer Android hardware with no calibration card or reference patch in the frame.
3. The confidence-abstention mechanism at a tuned operating threshold, coupled to a defined caregiver
   action (repeat test) rather than a forced classification.
4. The specific mapping of the three output categories to the ISPN three-consecutive-day relapse-action
   protocol.
5. The training/validation design: temporal and patient-identity separation of training and test data
   from a single-centre home- and clinic-sourced image corpus with no calibration aid, under
   uncontrolled ambient lighting.

## 6. Closest prior art identified to date

This is the landscape currently in the project's prior-art register. Status markers reflect what has
been directly verified (claims read, record opened) versus what rests on a title/abstract/search-result
match only; treat the latter as a lead for counsel's own search, not a settled fact.

| Record | What it covers | Verification status |
|---|---|---|
| **US10068329B2** and family (**US9972077B2**, **US10559081B2**, **WO2015173801A1**, **EP3143378A4**; Healthy.io) | Smartphone capture of a dipstick, colour-corrected against grey and reference colour patches in the frame | Family relationship confirmed by fresh search 14 Oct 2026 (USPTO continuation text); claim text not read; legal status not independently verified; **no Indian family member found** |
| **US9311520** | Colour-change quantification in an "automatically calibrated environment" for biological analytes | Surfaced in search; claims not read; status unverified |
| **WO2018194525A1** (Yeditepe University) | Training an ML model on urine strip images | Recorded status: ceased (Google Patents) |
| **US20210208081A1** (Vivosens) | Urine strip photographed, matched to a user profile, recommendation returned | Recorded status: abandoned; no longitudinal tracking in claim 1 |
| **UrApp** (Wang et al., 2019, PMID 31146731) | Camera read of a urine test strip on iOS, plus urine-protein trend analysis and relapse/remission alerts | Weighted κ 0.91 vs benchtop analyser, 88 adult/paediatric samples; no Indian or Indian-strip validation |
| **Xu et al. 2024** (PMID 38228897, *Anal Bioanal Chem*) | Label-free, machine-learning multi-urinalysis segmentation platform, multi-brand | Published paper; not read in full |
| **Kim et al. 2025** (*Ann Lab Med*) | KNN classifier on 2,612 strip images for mobile-phone urine reading | Published paper; not read in full |
| PMID 38391989, PMID 32801288, PMID 30288519, PMID 36863867, PMID 40288875, PMID 33590941, PMID 37027837, PMID 30999886, PMID 40017920 | Various smartphone/point-of-care colorimetric urinalysis and dipstick-enhancement approaches | Retrieved by keyword search; abstracts only |

No record identified to date combines: (a) this specific nine-feature colour descriptor set, (b) no
in-frame calibration card, (c) validation on Indian-sourced, caregiver-captured images of this strip
brand, under the stated model-size and latency constraints. This is the current state of a limited
search, not a clearance.

## 7. Disclosure timeline (for filing-date strategy — counsel to assess)

| Event | Date | What it shows | Status |
|---|---|---|---|
| PNEP manuscript v14 | 2026 | Full reader pipeline described in Section 3 above | Under confidential peer review (PI-stated, 14 Oct 2026). Becomes public on acceptance, preprint, or publication. |
| BFI Medical College Incubation Cohort 1 selection | 2026 | Selection of KidneyCare AI as a venture | No method shown (PI-stated). |
| GITAM University MoU | 2026 | Academic partnership | Progress report states signed; PI describes it as being framed. No method described (PI-stated). |
| "brag-benchtop" concept image | 2026 | Device concept render, not the reader method | Not posted publicly (PI-stated). |
| BFI Innovation Catalyst and SwasthyaTech Synapse (IHFC) applications | 2026 | Related funding applications for IoT home monitoring and UPCR dipstick study phases | Submitted; under evaluation. Confidentiality terms not confirmed. |
| APIIC Ignition Grant progress report (sanction APIIC/IG-1.0/25-26/2) | to 30 Sep 2026 | App development status | Sent to the funder; not public |

**No patent has been filed to date.** A provisional was planned for "the next phase" of the Ignition
grant (Rs 15,000 budgeted). Manuscript v14 is the nearest forcing event: whatever journal timeline
applies, the reader pipeline becomes public on that date, and filing strategy should work backward from
it.

## 8. Open items for counsel, not for me to resolve

1. Whether the five candidate features in Section 5 clear novelty and inventive step, including under
   the software-per-se exclusion in Section 3(k) of the Indian Patents Act, and whether a system claim
   (app + method, or app + a registration-only physical holder) is the stronger vehicle than a method
   claim alone.
2. Full claim-text review of US10068329B2 and its confirmed family members, and of US9311520, before any
   calibration-adjacent feature is added to this device.
3. A proper classification-based prior art search (candidate CPC classes, unverified: G16H 50/20,
   G06T 7/90, G01N 33/493) beyond the keyword search summarised in Section 6.
4. Whether confidential peer review of manuscript v14 counts as non-disclosure in the relevant
   jurisdiction, and the latest safe filing date relative to its publication timeline.
5. Inventorship (PI, laboratory co-investigator, Aminobots Technologies as technology partner, project
   interns) and ownership, against the AIIMS Patna IP policy, the APIIC/iTBI terms, and the Aminobots
   agreement — none of which has been reviewed to date per the project's own patent search brief.
6. Confidentiality terms of the BFI Innovation Catalyst and SwasthyaTech Synapse applications, and
   whether either requires disclosure coordination before a provisional is filed.
7. Confirmation of the strip brand used for the 487-image dataset (Section 4), since this determines the
   scope of any brand-specific claim language.

---

*This document was prepared from the project's manuscript, grant drafts and prior-art searches. Every
verification-status marker in Section 6 reflects what has actually been checked; unmarked or
"unverified" items are leads, not findings. It is not legal advice, not a freedom-to-operate opinion, and
not a substitute for a registered patent agent's own search and drafting.*
