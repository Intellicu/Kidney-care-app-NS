/**
 * KidneyCare Nutrition Engine - Scaling & Nutrient Calculations (calc.js)
 * Implements ICMR-NIN & PRINT 2026 calculation standards.
 */

// Table salt: 1g NaCl = ~393 mg Sodium (Na)
export const MG_NA_PER_GRAM_SALT = 393;

// Phosphorus absorption tiers (Polderman 2026 & PRINT course)
export const PHOSPHORUS_ABSORPTION_TIERS = {
  plant: { min: 0.20, max: 0.50, label: 'Plant (20–50%)' },
  mixed: { min: 0.40, max: 0.70, label: 'Mixed / Processed (40–70%)' },
  animal: { min: 0.90, max: 1.00, label: 'Animal (90–100%)' }
};

/**
 * Scales nutrients for a food item given gram weight.
 */
export function scaleNutrients(food, grams) {
  if (!food || !food.per100g || grams <= 0) {
    return {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
      sodium: 0,
      potassium: 0,
      phosphorus: 0,
      absorbablePhosphorusMin: 0,
      absorbablePhosphorusMax: 0,
      water: 0,
      fluid: 0
    };
  }

  const factor = grams / 100.0;
  const p100 = food.per100g;

  const totalP = (p100.phosphorus || 0) * factor;
  const tier = PHOSPHORUS_ABSORPTION_TIERS[food.pClass] || PHOSPHORUS_ABSORPTION_TIERS.plant;

  return {
    grams,
    calories: Math.round((p100.calories || 0) * factor),
    protein: Number(((p100.protein || 0) * factor).toFixed(1)),
    fat: Number(((p100.fat || 0) * factor).toFixed(1)),
    carbs: Number(((p100.carbs || 0) * factor).toFixed(1)),
    fiber: Number(((p100.fiber || 0) * factor).toFixed(1)),
    sodium: Math.round((p100.sodium || 0) * factor),
    potassium: Math.round((p100.potassium || 0) * factor),
    phosphorus: Math.round(totalP),
    absorbablePhosphorusMin: Math.round(totalP * tier.min),
    absorbablePhosphorusMax: Math.round(totalP * tier.max),
    water: Math.round((p100.water || 0) * factor),
    fluid: food.isFluid ? Math.round(grams) : 0
  };
}

/**
 * Aggregates a list of meal items with added salt and direct fluid.
 */
export function calculateMealTotals(items = [], addedSaltGrams = 0, directFluidMl = 0) {
  const totals = items.reduce(
    (acc, item) => {
      acc.calories += item.calories || 0;
      acc.protein += item.protein || 0;
      acc.fat += item.fat || 0;
      acc.carbs += item.carbs || 0;
      acc.fiber += item.fiber || 0;
      acc.foodSodium += item.sodium || 0;
      acc.potassium += item.potassium || 0;
      acc.phosphorus += item.phosphorus || 0;
      acc.absorbablePhosphorusMin += item.absorbablePhosphorusMin || 0;
      acc.absorbablePhosphorusMax += item.absorbablePhosphorusMax || 0;
      acc.water += item.water || 0;
      acc.fluid += item.fluid || 0;
      return acc;
    },
    {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
      foodSodium: 0,
      potassium: 0,
      phosphorus: 0,
      absorbablePhosphorusMin: 0,
      absorbablePhosphorusMax: 0,
      water: 0,
      fluid: 0
    }
  );

  const addedSaltSodiumMg = Math.round(addedSaltGrams * MG_NA_PER_GRAM_SALT);
  const totalSodium = totals.foodSodium + addedSaltSodiumMg;
  const totalFluid = totals.fluid + Number(directFluidMl || 0);

  return {
    calories: Math.round(totals.calories),
    protein: Number(totals.protein.toFixed(1)),
    fat: Number(totals.fat.toFixed(1)),
    carbs: Number(totals.carbs.toFixed(1)),
    fiber: Number(totals.fiber.toFixed(1)),
    foodSodium: totals.foodSodium,
    addedSaltSodiumMg,
    sodium: totalSodium,
    potassium: Math.round(totals.potassium),
    phosphorus: Math.round(totals.phosphorus),
    absorbablePhosphorusRange: `${totals.absorbablePhosphorusMin}–${totals.absorbablePhosphorusMax} mg`,
    water: totals.water,
    fluid: totalFluid
  };
}

/**
 * Evaluates day totals against target prescription limits.
 */
export function evaluateAgainstTargets(actual, targets) {
  if (!targets) return {};

  const evaluateField = (val, maxLimit, isCeiling = true) => {
    if (!maxLimit) return { pct: 0, status: 'normal' };
    const pct = Math.round((val / maxLimit) * 100);
    let status = 'normal';
    if (isCeiling) {
      if (pct > 100) status = 'over';
      else if (pct >= 85) status = 'near';
      else status = 'within';
    } else {
      // Floor (e.g. calories, protein requirement)
      if (pct < 80) status = 'under';
      else if (pct <= 110) status = 'within';
      else status = 'over';
    }
    return { val, target: maxLimit, pct, status };
  };

  return {
    calories: evaluateField(actual.calories, targets.energyKcal, false),
    protein: evaluateField(actual.protein, targets.proteinG, false),
    sodium: evaluateField(actual.sodium, targets.sodiumMg, true),
    potassium: evaluateField(actual.potassium, targets.potassiumMg, true),
    phosphorus: evaluateField(actual.phosphorus, targets.phosphateMg, true),
    fluid: evaluateField(actual.fluid, targets.fluidMl, true)
  };
}
