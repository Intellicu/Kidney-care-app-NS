// AAP 2017 paediatric BP lookup (simplified percentile table)
// Source: Flynn et al., Pediatrics 2017;140(3):e20171904
// Returns the 95th percentile BP thresholds for age/sex/height-percentile
// For non-clinical apps: we use the 50th height percentile thresholds as a
// conservative reference, since height percentile is often unavailable.

const AAP_THRESHOLDS = {
  // [age]: { male: [sys95, dia95], female: [sys95, dia95] }
  1:  { male: [98, 54],  female: [98, 54] },
  2:  { male: [101, 58], female: [100, 57] },
  3:  { male: [104, 63], female: [103, 62] },
  4:  { male: [106, 66], female: [104, 65] },
  5:  { male: [108, 68], female: [106, 68] },
  6:  { male: [109, 70], female: [107, 69] },
  7:  { male: [110, 71], female: [109, 71] },
  8:  { male: [111, 72], female: [110, 72] },
  9:  { male: [113, 73], female: [111, 73] },
  10: { male: [114, 74], female: [112, 74] },
  11: { male: [116, 75], female: [114, 75] },
  12: { male: [119, 75], female: [116, 75] },
  13: { male: [121, 76], female: [117, 76] },
  14: { male: [124, 77], female: [119, 77] },
  15: { male: [126, 77], female: [120, 77] },
  16: { male: [129, 78], female: [120, 78] },
  17: { male: [130, 78], female: [121, 78] },
};

/**
 * Classify blood pressure per AAP 2017 guidelines.
 * @param {number} systolic
 * @param {number} diastolic
 * @param {number} ageYears - patient age in years
 * @param {'male'|'female'|'other'|string} sex
 * @returns {{ category: string, color: string }}
 */
export function classifyBP(systolic, diastolic, ageYears, sex) {
  if (!systolic || !diastolic || !ageYears) {
    return { category: '-', color: 'text-gray-400' };
  }

  const age = Math.max(1, Math.min(17, Math.round(ageYears)));
  const sexKey = sex === 'female' ? 'female' : 'male';
  const thresholds = AAP_THRESHOLDS[age]?.[sexKey];

  if (!thresholds) {
    return { category: '-', color: 'text-gray-400' };
  }

  const [sys95, dia95] = thresholds;
  const sys90 = sys95 - 5;
  const dia90 = dia95 - 5;

  // Stage 2 HTN: ≥95th+12 mmHg (approximately)
  if (systolic >= sys95 + 12 || diastolic >= dia95 + 12) {
    return { category: 'Stage 2 HTN', color: 'text-red-600' };
  }
  // Stage 1 HTN: ≥95th percentile
  if (systolic >= sys95 || diastolic >= dia95) {
    return { category: 'Stage 1 HTN', color: 'text-orange-600' };
  }
  // Elevated BP: ≥90th percentile
  if (systolic >= sys90 || diastolic >= dia90) {
    return { category: 'Elevated BP', color: 'text-amber-500' };
  }
  return { category: 'Normal', color: 'text-emerald-600' };
}

/**
 * Compute BMI from weight (kg) and height (cm).
 * @param {number} weightKg
 * @param {number} heightCm
 * @returns {number|null}
 */
export function computeBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  return parseFloat((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));
}

/**
 * Compute Mosteller BSA from weight (kg) and height (cm).
 * @param {number} weightKg
 * @param {number} heightCm
 * @returns {number|null}
 */
export function computeBSA(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  return parseFloat(Math.sqrt((weightKg * heightCm) / 3600).toFixed(2));
}
