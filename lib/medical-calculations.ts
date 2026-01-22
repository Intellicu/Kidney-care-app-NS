"use client"

// Medical calculations based on standard guidelines
// BMI: WHO standards
// BSA: Mosteller formula (commonly used in pediatrics)
// BP Percentiles: AAP 2017 guidelines
// Growth Percentiles: IAP Growth Charts 2015

export interface PatientVitals {
  weight: number // kg
  height: number // cm
  age: number // years
  sex: 'male' | 'female' | 'other' | ''
  systolicBP?: number
  diastolicBP?: number
}

export interface CalculatedMetrics {
  bmi: number | null
  bmiCategory: string
  bmiPercentile: number | null
  bsa: number | null
  weightPercentile: number | null
  heightPercentile: number | null
  bpSystolicPercentile: number | null
  bpDiastolicPercentile: number | null
  bpCategory: string
}

// Calculate BMI
export function calculateBMI(weight: number, height: number): number | null {
  if (weight <= 0 || height <= 0) return null
  const heightInMeters = height / 100
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10
}

// BMI Category for children (based on WHO standards)
export function getBMICategory(bmi: number | null, age: number): string {
  if (bmi === null) return '-'
  
  // For children, use age-adjusted cutoffs
  if (age < 18) {
    // Simplified pediatric BMI categories
    if (age < 5) {
      if (bmi < 14) return 'Underweight'
      if (bmi < 17) return 'Normal'
      if (bmi < 18) return 'Overweight'
      return 'Obese'
    } else if (age < 10) {
      if (bmi < 14) return 'Underweight'
      if (bmi < 18) return 'Normal'
      if (bmi < 21) return 'Overweight'
      return 'Obese'
    } else {
      if (bmi < 16) return 'Underweight'
      if (bmi < 23) return 'Normal'
      if (bmi < 27) return 'Overweight'
      return 'Obese'
    }
  }
  
  // Adult BMI categories (WHO)
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

// Calculate BSA using Mosteller formula (commonly used in pediatrics)
// BSA (m²) = √((height (cm) × weight (kg)) / 3600)
export function calculateBSA(weight: number, height: number): number | null {
  if (weight <= 0 || height <= 0) return null
  return Math.round(Math.sqrt((height * weight) / 3600) * 100) / 100
}

// IAP Growth Charts 2015 - Weight percentile (simplified lookup)
// Returns approximate percentile based on Indian pediatric data
export function getWeightPercentile(weight: number, age: number, sex: 'male' | 'female' | 'other' | ''): number | null {
  if (weight <= 0 || age < 0 || !sex || sex === 'other') return null
  
  // IAP median weights for boys and girls by age (simplified)
  const medianWeights: Record<string, number[]> = {
    male: [3.3, 10.2, 12.3, 14.3, 16.3, 18.3, 20.5, 22.9, 25.6, 28.6, 32.0, 35.6, 39.8, 45.0, 50.8, 56.0, 60.0, 63.0, 65.0],
    female: [3.2, 9.5, 11.8, 13.9, 15.9, 17.9, 20.0, 22.4, 25.0, 28.2, 32.0, 36.9, 41.5, 46.0, 49.5, 52.0, 54.0, 55.0, 56.0]
  }
  
  // SD values (approximate)
  const sdValues: Record<string, number> = { male: 3.5, female: 3.2 }
  
  const ageIndex = Math.min(Math.floor(age), 18)
  const sexKey = sex === 'male' ? 'male' : 'female'
  const median = medianWeights[sexKey][ageIndex]
  const sd = sdValues[sexKey]
  
  // Calculate Z-score and convert to percentile
  const zScore = (weight - median) / sd
  const percentile = Math.round(normalCDF(zScore) * 100)
  
  return Math.max(1, Math.min(99, percentile))
}

// IAP Growth Charts 2015 - Height percentile (simplified lookup)
export function getHeightPercentile(height: number, age: number, sex: 'male' | 'female' | 'other' | ''): number | null {
  if (height <= 0 || age < 0 || !sex || sex === 'other') return null
  
  // IAP median heights for boys and girls by age (simplified)
  const medianHeights: Record<string, number[]> = {
    male: [50, 76, 87, 96, 103, 110, 116, 122, 128, 133, 138, 143, 149, 156, 163, 169, 173, 175, 176],
    female: [49, 74, 86, 95, 102, 109, 115, 121, 127, 133, 139, 145, 152, 157, 160, 162, 163, 164, 164]
  }
  
  const sdValues: Record<string, number> = { male: 6, female: 5.5 }
  
  const ageIndex = Math.min(Math.floor(age), 18)
  const sexKey = sex === 'male' ? 'male' : 'female'
  const median = medianHeights[sexKey][ageIndex]
  const sd = sdValues[sexKey]
  
  const zScore = (height - median) / sd
  const percentile = Math.round(normalCDF(zScore) * 100)
  
  return Math.max(1, Math.min(99, percentile))
}

// AAP 2017 BP Guidelines - simplified percentile calculation
// For children aged 1-17 years
export function getBPPercentile(
  systolic: number, 
  diastolic: number, 
  age: number, 
  sex: 'male' | 'female' | 'other' | '',
  height: number
): { systolicPercentile: number | null; diastolicPercentile: number | null; category: string } {
  if (systolic <= 0 || diastolic <= 0 || age < 1 || !sex || sex === 'other') {
    return { systolicPercentile: null, diastolicPercentile: null, category: '-' }
  }
  
  // Simplified AAP 2017 BP thresholds based on age
  // 50th percentile values for height at 50th percentile
  const bp50th: Record<string, { systolic: number[], diastolic: number[] }> = {
    male: {
      systolic: [0, 85, 87, 88, 90, 91, 93, 94, 95, 97, 99, 101, 104, 106, 109, 111, 114, 117, 120],
      diastolic: [0, 40, 42, 44, 46, 48, 50, 52, 53, 54, 55, 56, 58, 60, 62, 64, 66, 68, 70]
    },
    female: {
      systolic: [0, 85, 87, 88, 89, 90, 92, 93, 94, 96, 98, 100, 102, 104, 106, 107, 108, 109, 110],
      diastolic: [0, 42, 44, 46, 48, 50, 52, 53, 54, 55, 56, 58, 60, 62, 63, 64, 65, 66, 67]
    }
  }
  
  // 90th percentile values
  const bp90th: Record<string, { systolic: number[], diastolic: number[] }> = {
    male: {
      systolic: [0, 98, 100, 101, 103, 105, 106, 108, 109, 111, 113, 115, 118, 121, 124, 127, 130, 133, 136],
      diastolic: [0, 52, 54, 56, 58, 60, 62, 64, 65, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84]
    },
    female: {
      systolic: [0, 99, 100, 101, 103, 104, 106, 107, 109, 111, 113, 115, 117, 119, 120, 121, 122, 123, 124],
      diastolic: [0, 54, 56, 58, 60, 62, 64, 65, 66, 68, 70, 72, 74, 76, 77, 78, 79, 80, 81]
    }
  }
  
  const ageIndex = Math.min(Math.max(Math.floor(age), 1), 18)
  const sexKey = sex === 'male' ? 'male' : 'female'
  
  const sys50 = bp50th[sexKey].systolic[ageIndex]
  const sys90 = bp90th[sexKey].systolic[ageIndex]
  const dia50 = bp50th[sexKey].diastolic[ageIndex]
  const dia90 = bp90th[sexKey].diastolic[ageIndex]
  
  // Calculate approximate percentiles
  const sysSD = (sys90 - sys50) / 1.28 // 90th percentile is ~1.28 SD above mean
  const diaSD = (dia90 - dia50) / 1.28
  
  const sysZ = (systolic - sys50) / sysSD
  const diaZ = (diastolic - dia50) / diaSD
  
  const systolicPercentile = Math.max(1, Math.min(99, Math.round(normalCDF(sysZ) * 100)))
  const diastolicPercentile = Math.max(1, Math.min(99, Math.round(normalCDF(diaZ) * 100)))
  
  // Determine BP category based on AAP 2017
  let category = 'Normal'
  const maxPercentile = Math.max(systolicPercentile, diastolicPercentile)
  
  if (age >= 13) {
    // Adolescent criteria
    if (systolic >= 130 || diastolic >= 80) {
      category = 'Stage 2 Hypertension'
    } else if (systolic >= 120 || diastolic >= 80) {
      category = 'Elevated'
    }
  } else {
    // Pediatric criteria
    if (maxPercentile >= 95) {
      if (systolic >= sys90 + 12 || diastolic >= dia90 + 12) {
        category = 'Stage 2 Hypertension'
      } else {
        category = 'Stage 1 Hypertension'
      }
    } else if (maxPercentile >= 90) {
      category = 'Elevated'
    }
  }
  
  return { systolicPercentile, diastolicPercentile, category }
}

// Standard normal cumulative distribution function
function normalCDF(z: number): number {
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911
  
  const sign = z < 0 ? -1 : 1
  z = Math.abs(z) / Math.sqrt(2)
  
  const t = 1.0 / (1.0 + p * z)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z)
  
  return 0.5 * (1.0 + sign * y)
}

// Get BMI percentile for children based on WHO/CDC charts
export function getBMIPercentile(bmi: number | null, age: number, sex: 'male' | 'female' | 'other' | ''): number | null {
  if (bmi === null || age < 2 || !sex || sex === 'other') return null
  
  // Simplified BMI 50th percentile values by age
  const bmi50th: Record<string, number[]> = {
    male: [0, 0, 16.4, 15.8, 15.5, 15.3, 15.3, 15.4, 15.6, 15.9, 16.3, 16.9, 17.5, 18.2, 18.9, 19.7, 20.5, 21.2, 22.0],
    female: [0, 0, 16.0, 15.5, 15.2, 15.0, 15.0, 15.2, 15.5, 15.9, 16.5, 17.2, 18.0, 18.8, 19.5, 20.1, 20.5, 20.9, 21.2]
  }
  
  const sdValues: Record<string, number> = { male: 2.0, female: 2.2 }
  
  const ageIndex = Math.min(Math.max(Math.floor(age), 2), 18)
  const sexKey = sex === 'male' ? 'male' : 'female'
  const median = bmi50th[sexKey][ageIndex]
  const sd = sdValues[sexKey]
  
  const zScore = (bmi - median) / sd
  const percentile = Math.round(normalCDF(zScore) * 100)
  
  return Math.max(1, Math.min(99, percentile))
}

// Main function to calculate all metrics
export function calculateAllMetrics(vitals: PatientVitals): CalculatedMetrics {
  const bmi = calculateBMI(vitals.weight, vitals.height)
  const bmiCategory = getBMICategory(bmi, vitals.age)
  const bmiPercentile = getBMIPercentile(bmi, vitals.age, vitals.sex)
  const bsa = calculateBSA(vitals.weight, vitals.height)
  const weightPercentile = getWeightPercentile(vitals.weight, vitals.age, vitals.sex)
  const heightPercentile = getHeightPercentile(vitals.height, vitals.age, vitals.sex)
  
  let bpSystolicPercentile: number | null = null
  let bpDiastolicPercentile: number | null = null
  let bpCategory = '-'
  
  if (vitals.systolicBP && vitals.diastolicBP) {
    const bpResult = getBPPercentile(
      vitals.systolicBP, 
      vitals.diastolicBP, 
      vitals.age, 
      vitals.sex,
      vitals.height
    )
    bpSystolicPercentile = bpResult.systolicPercentile
    bpDiastolicPercentile = bpResult.diastolicPercentile
    bpCategory = bpResult.category
  }
  
  return {
    bmi,
    bmiCategory,
    bmiPercentile,
    bsa,
    weightPercentile,
    heightPercentile,
    bpSystolicPercentile,
    bpDiastolicPercentile,
    bpCategory
  }
}

// Format percentile for display
export function formatPercentile(percentile: number | null): string {
  if (percentile === null) return '-'
  
  const suffix = percentile === 1 ? 'st' :
                 percentile === 2 ? 'nd' :
                 percentile === 3 ? 'rd' :
                 percentile % 10 === 1 && percentile !== 11 ? 'st' :
                 percentile % 10 === 2 && percentile !== 12 ? 'nd' :
                 percentile % 10 === 3 && percentile !== 13 ? 'rd' : 'th'
  
  return `${percentile}${suffix}`
}

// Get color coding for percentile
export function getPercentileColor(percentile: number | null): string {
  if (percentile === null) return 'text-muted-foreground'
  if (percentile < 5) return 'text-red-600'
  if (percentile < 15) return 'text-amber-600'
  if (percentile <= 85) return 'text-emerald-600'
  if (percentile <= 95) return 'text-amber-600'
  return 'text-red-600'
}

// Get BP category color
export function getBPCategoryColor(category: string): string {
  switch (category) {
    case 'Normal': return 'text-emerald-600'
    case 'Elevated': return 'text-amber-600'
    case 'Stage 1 Hypertension': return 'text-orange-600'
    case 'Stage 2 Hypertension': return 'text-red-600'
    default: return 'text-muted-foreground'
  }
}
