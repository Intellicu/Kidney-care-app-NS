/**
 * KidneyCare Nutrition Engine - Targets & Prescriptions (targets.js)
 * Implements PRINT 2026 Suggested Dietary Intake (SDI) and ICMR-NIN 2024 DGI.
 */

// 17 age brackets with baseline PRINT SDI reference values
export const PRINT_SDI_REFERENCE = [
  { bracket: '0-6m', ageMinMonths: 0, ageMaxMonths: 6, kcalPerKg: 108, proteinGPerKg: 1.52, sodiumMg: 280, potassiumMg: 400, phosphateMg: 250 },
  { bracket: '7-12m', ageMinMonths: 7, ageMaxMonths: 12, kcalPerKg: 98, proteinGPerKg: 1.20, sodiumMg: 350, potassiumMg: 700, phosphateMg: 350 },
  { bracket: '1-3y', ageMinMonths: 13, ageMaxMonths: 36, kcalPerKg: 85, proteinGPerKg: 1.05, sodiumMg: 800, potassiumMg: 1100, phosphateMg: 460 },
  { bracket: '4-6y', ageMinMonths: 37, ageMaxMonths: 72, kcalPerKg: 75, proteinGPerKg: 0.95, sodiumMg: 1000, potassiumMg: 1400, phosphateMg: 500 },
  { bracket: '7-9y', ageMinMonths: 73, ageMaxMonths: 108, kcalPerKg: 65, proteinGPerKg: 0.90, sodiumMg: 1200, potassiumMg: 1600, phosphateMg: 600 },
  { bracket: '10-12y Boys', ageMinMonths: 109, ageMaxMonths: 144, kcalPerKg: 55, proteinGPerKg: 0.88, sodiumMg: 1400, potassiumMg: 1900, phosphateMg: 750 },
  { bracket: '10-12y Girls', ageMinMonths: 109, ageMaxMonths: 144, kcalPerKg: 50, proteinGPerKg: 0.88, sodiumMg: 1400, potassiumMg: 1900, phosphateMg: 750 },
  { bracket: '13-15y Boys', ageMinMonths: 145, ageMaxMonths: 180, kcalPerKg: 45, proteinGPerKg: 0.85, sodiumMg: 1500, potassiumMg: 2200, phosphateMg: 850 },
  { bracket: '13-15y Girls', ageMinMonths: 145, ageMaxMonths: 180, kcalPerKg: 40, proteinGPerKg: 0.85, sodiumMg: 1500, potassiumMg: 2000, phosphateMg: 800 },
  { bracket: '16-18y Boys', ageMinMonths: 181, ageMaxMonths: 216, kcalPerKg: 40, proteinGPerKg: 0.82, sodiumMg: 1500, potassiumMg: 2400, phosphateMg: 900 },
  { bracket: '16-18y Girls', ageMinMonths: 181, ageMaxMonths: 216, kcalPerKg: 35, proteinGPerKg: 0.82, sodiumMg: 1500, potassiumMg: 2000, phosphateMg: 800 }
];

/**
 * Calculates exact age in months from date of birth string (yyyy-mm-dd).
 */
export function calculateAgeMonths(dobString) {
  if (!dobString) return 84; // default 7 years
  const dob = new Date(dobString);
  const now = new Date();
  const diffYears = now.getFullYear() - dob.getFullYear();
  const diffMonths = now.getMonth() - dob.getMonth();
  return Math.max(1, diffYears * 12 + diffMonths);
}

/**
 * Computes patient-specific dietary prescription targets based on age, weight, and condition.
 */
export function computePrescriptionTargets({
  weightKg = 21.4,
  heightCm = 118,
  dob = null,
  condition = 'nephrotic_relapse', // 'nephrotic_relapse' | 'nephrotic_remission' | 'ckd_3_5' | 'hemodialysis'
  kRestriction = false,
  phosphateRestriction = false,
  fluidRestriction = false
}) {
  const ageMonths = calculateAgeMonths(dob);

  // Match bracket
  let ref = PRINT_SDI_REFERENCE.find(
    r => ageMonths >= r.ageMinMonths && ageMonths <= r.ageMaxMonths
  ) || PRINT_SDI_REFERENCE[4]; // default 7-9y

  // Baseline energy & protein
  const baseKcal = Math.round(weightKg * ref.kcalPerKg);
  let proteinFactor = ref.proteinGPerKg;

  // Disease condition adjustments
  let sodiumCeiling = ref.sodiumMg;
  let fluidLimit = Math.round(weightKg * 55); // ~55 mL/kg baseline

  if (condition === 'nephrotic_relapse') {
    // Single reconciled sodium ceiling in relapse (< 1,200 mg Na/day)
    sodiumCeiling = Math.min(sodiumCeiling, 1200);
    proteinFactor = ref.proteinGPerKg; // Normal SDI (100%), do NOT restrict or overfeed
    fluidLimit = Math.min(fluidLimit, 1200);
  } else if (condition === 'hemodialysis') {
    // HD needs 115-120% protein to replace dialysate losses
    proteinFactor = ref.proteinGPerKg * 1.20;
    sodiumCeiling = 1500;
    fluidLimit = 800; // restricted in oliguria
  } else if (condition === 'ckd_3_5') {
    // 100% SDI protein, tight phosphate & potassium
    proteinFactor = ref.proteinGPerKg;
    sodiumCeiling = 1200;
  }

  const targetProteinG = Number((weightKg * proteinFactor).toFixed(1));

  // Potassium & Phosphate adjustments
  let potassiumCeiling = ref.potassiumMg;
  if (kRestriction || condition === 'hemodialysis') {
    potassiumCeiling = Math.round(ref.potassiumMg * 0.70); // ~30% restriction
  }

  let phosphateCeiling = ref.phosphateMg;
  if (phosphateRestriction || condition === 'hemodialysis' || condition === 'ckd_3_5') {
    phosphateCeiling = Math.round(ref.phosphateMg * 0.75); // ~25% restriction
  }

  if (fluidRestriction) {
    fluidLimit = Math.min(fluidLimit, 1000);
  }

  return {
    bracket: ref.bracket,
    weightKg,
    heightCm,
    condition,
    energyKcal: baseKcal,
    proteinG: targetProteinG,
    sodiumMg: sodiumCeiling,
    potassiumMg: potassiumCeiling,
    phosphateMg: phosphateCeiling,
    fluidMl: fluidLimit,
    leachingApproved: false // Gated behind dietitian sign-off
  };
}
