/**
 * Diagnostic Agent Module
 * 
 * Interprets BP records and urine dipstick measurements for pediatric
 * nephrotic syndrome patients based on standard clinical guidelines.
 * 
 * BP Classification: AAP 2017 Clinical Practice Guideline (Flynn et al.)
 * - Normotensive: < 90th percentile
 * - Elevated BP: >= 90th to < 95th percentile OR 120/80 to < 95th (whichever lower)
 * - Stage 1 HTN: >= 95th to < 95th + 12 mmHg OR 130/80 to 139/89 (whichever lower)
 * - Stage 2 HTN: >= 95th + 12 mmHg OR >= 140/90 (whichever lower)
 * 
 * For adolescents >= 13 years (simplified adult-aligned thresholds):
 * - Normal: < 120/< 80
 * - Elevated: 120/< 80 to 129/< 80
 * - Stage 1 HTN: 130/80 to 139/89
 * - Stage 2 HTN: >= 140/90
 * 
 * Urine Dipstick Classification: AIIMS/ISPN protocols
 * - Nephrotic Range Proteinuria: 3+ or 4+
 * - Relapse: 3+ or 4+ for 3 consecutive days (after prior remission)
 * - Remission: Negative or trace for 3 consecutive days
 * - Clinically Significant/Abnormal: >= 1+
 */

import type { UrineTestResult, HealthData, PatientProfile } from "./app-context"

// ============================================================================
// BP CLASSIFICATION
// ============================================================================

export type BPCategory = 
  | "normotensive" 
  | "elevated" 
  | "stage1-htn" 
  | "stage2-htn" 
  | "unknown"

export interface BPClassification {
  category: BPCategory
  label: string
  labelHi: string
  description: string
  descriptionHi: string
  systolicPercentile: number | null
  diastolicPercentile: number | null
  severity: "normal" | "warning" | "danger" | "critical"
  recommendation: string
  recommendationHi: string
  color: string
  bgColor: string
}

// AAP 2017 Normative BP Tables (50th height percentile)
// 50th percentile BP values by age and sex
const BP_50TH: Record<string, { systolic: number[]; diastolic: number[] }> = {
  male: {
    // Index 0 unused, indices 1-18 correspond to ages 1-18
    systolic: [0, 85, 87, 88, 90, 91, 93, 94, 95, 97, 99, 101, 104, 106, 109, 111, 114, 117, 120],
    diastolic: [0, 40, 42, 44, 46, 48, 50, 52, 53, 54, 55, 56, 58, 60, 62, 64, 66, 68, 70],
  },
  female: {
    systolic: [0, 85, 87, 88, 89, 90, 92, 93, 94, 96, 98, 100, 102, 104, 106, 107, 108, 109, 110],
    diastolic: [0, 42, 44, 46, 48, 50, 52, 53, 54, 55, 56, 58, 60, 62, 63, 64, 65, 66, 67],
  },
}

// 90th percentile BP values
const BP_90TH: Record<string, { systolic: number[]; diastolic: number[] }> = {
  male: {
    systolic: [0, 98, 100, 101, 103, 105, 106, 108, 109, 111, 113, 115, 118, 121, 124, 127, 130, 133, 136],
    diastolic: [0, 52, 54, 56, 58, 60, 62, 64, 65, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84],
  },
  female: {
    systolic: [0, 99, 100, 101, 103, 104, 106, 107, 109, 111, 113, 115, 117, 119, 120, 121, 122, 123, 124],
    diastolic: [0, 54, 56, 58, 60, 62, 64, 65, 66, 68, 70, 72, 74, 76, 77, 78, 79, 80, 81],
  },
}

// 95th percentile BP values
const BP_95TH: Record<string, { systolic: number[]; diastolic: number[] }> = {
  male: {
    systolic: [0, 101, 103, 104, 106, 108, 110, 111, 113, 115, 117, 119, 122, 126, 128, 131, 134, 136, 140],
    diastolic: [0, 54, 56, 58, 60, 63, 65, 67, 68, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87],
  },
  female: {
    systolic: [0, 102, 103, 105, 106, 108, 110, 111, 113, 115, 117, 119, 121, 123, 124, 125, 126, 127, 128],
    diastolic: [0, 57, 59, 60, 63, 65, 67, 68, 69, 71, 73, 75, 77, 79, 80, 81, 82, 83, 84],
  },
}

// Standard normal CDF for percentile calculation
function normalCDF(z: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const sign = z < 0 ? -1 : 1
  const absZ = Math.abs(z) / Math.sqrt(2)
  const t = 1.0 / (1.0 + p * absZ)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ)
  return 0.5 * (1.0 + sign * y)
}

function calculatePercentile(value: number, p50: number, p90: number): number {
  const sd = (p90 - p50) / 1.28
  if (sd <= 0) return 50
  const z = (value - p50) / sd
  return Math.max(1, Math.min(99, Math.round(normalCDF(z) * 100)))
}

/**
 * Classify a child's BP reading according to AAP 2017 guidelines
 */
export function classifyBP(
  systolic: number,
  diastolic: number,
  age: number,
  sex: "male" | "female" | "other" | "",
  height?: number
): BPClassification {
  // Handle invalid inputs
  if (!systolic || !diastolic || systolic <= 0 || diastolic <= 0 || age < 1 || !sex || sex === "other") {
    return {
      category: "unknown",
      label: "Insufficient Data",
      labelHi: "अपर्याप्त डेटा",
      description: "Cannot classify BP. Age, sex, and valid BP readings are required.",
      descriptionHi: "BP वर्गीकृत नहीं किया जा सकता। उम्र, लिंग और मान्य BP रीडिंग आवश्यक है।",
      systolicPercentile: null,
      diastolicPercentile: null,
      severity: "normal",
      recommendation: "Enter complete patient data for BP classification.",
      recommendationHi: "BP वर्गीकरण के लिए पूर्ण रोगी डेटा दर्ज करें।",
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    }
  }

  const sexKey = sex === "male" ? "male" : "female"
  const ageIdx = Math.min(Math.max(Math.floor(age), 1), 18)

  // For adolescents >= 13 years: use simplified adult-aligned thresholds
  if (age >= 13) {
    const sys50 = BP_50TH[sexKey].systolic[ageIdx]
    const sys90 = BP_90TH[sexKey].systolic[ageIdx]
    const dia50 = BP_50TH[sexKey].diastolic[ageIdx]
    const dia90 = BP_90TH[sexKey].diastolic[ageIdx]

    const sysPercentile = calculatePercentile(systolic, sys50, sys90)
    const diaPercentile = calculatePercentile(diastolic, dia50, dia90)

    // Adult-aligned thresholds for >= 13
    if (systolic >= 140 || diastolic >= 90) {
      return {
        category: "stage2-htn",
        label: "Stage 2 Hypertension",
        labelHi: "स्टेज 2 उच्च रक्तचाप",
        description: `BP ${systolic}/${diastolic} mmHg is >= 140/90. This is Stage 2 Hypertension.`,
        descriptionHi: `BP ${systolic}/${diastolic} mmHg >= 140/90 है। यह स्टेज 2 उच्च रक्तचाप है।`,
        systolicPercentile: sysPercentile,
        diastolicPercentile: diaPercentile,
        severity: "critical",
        recommendation: "Immediate evaluation required. Consider pharmacologic treatment. Perform echocardiography to assess for target organ damage.",
        recommendationHi: "तुरंत मूल्यांकन आवश्यक। दवा उपचार पर विचार करें। लक्ष्य अंग क्षति के लिए इकोकार्डियोग्राफी करें।",
        color: "text-red-700",
        bgColor: "bg-red-50",
      }
    }
    if (systolic >= 130 || diastolic >= 80) {
      return {
        category: "stage1-htn",
        label: "Stage 1 Hypertension",
        labelHi: "स्टेज 1 उच्च रक्तचाप",
        description: `BP ${systolic}/${diastolic} mmHg is 130/80-139/89. This is Stage 1 Hypertension.`,
        descriptionHi: `BP ${systolic}/${diastolic} mmHg 130/80-139/89 रेंज में है। यह स्टेज 1 उच्च रक्तचाप है।`,
        systolicPercentile: sysPercentile,
        diastolicPercentile: diaPercentile,
        severity: "danger",
        recommendation: "Lifestyle modifications recommended. Recheck in 1-2 weeks. If persistent, consider ABPM and pharmacologic therapy.",
        recommendationHi: "जीवनशैली में बदलाव की सिफारिश। 1-2 सप्ताह में दोबारा जांचें। लगातार बना रहने पर ABPM और दवा चिकित्सा पर विचार करें।",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
      }
    }
    if (systolic >= 120 && diastolic < 80) {
      return {
        category: "elevated",
        label: "Elevated Blood Pressure",
        labelHi: "बढ़ा हुआ रक्तचाप",
        description: `BP ${systolic}/${diastolic} mmHg is 120-129/<80. This is Elevated BP (previously called pre-hypertension).`,
        descriptionHi: `BP ${systolic}/${diastolic} mmHg 120-129/<80 रेंज में है। यह बढ़ा हुआ BP है (पहले प्री-हाइपरटेंशन कहा जाता था)।`,
        systolicPercentile: sysPercentile,
        diastolicPercentile: diaPercentile,
        severity: "warning",
        recommendation: "Implement lifestyle modifications: DASH diet, physical activity 3-5 days/week for 30-60 min. Recheck in 6 months.",
        recommendationHi: "जीवनशैली में बदलाव लागू करें: DASH आहार, 3-5 दिन/सप्ताह 30-60 मिनट शारीरिक गतिविधि। 6 महीने में दोबारा जांचें।",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
      }
    }
    // Normal
    return {
      category: "normotensive",
      label: "Normotensive",
      labelHi: "सामान्य रक्तचाप",
      description: `BP ${systolic}/${diastolic} mmHg is < 120/80. This is normal.`,
      descriptionHi: `BP ${systolic}/${diastolic} mmHg < 120/80 है। यह सामान्य है।`,
      systolicPercentile: sysPercentile,
      diastolicPercentile: diaPercentile,
      severity: "normal",
      recommendation: "BP is within normal limits. Continue annual screening.",
      recommendationHi: "BP सामान्य सीमा में है। वार्षिक जांच जारी रखें।",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
    }
  }

  // For children < 13 years: use percentile-based classification
  const sys50 = BP_50TH[sexKey].systolic[ageIdx]
  const sys90 = BP_90TH[sexKey].systolic[ageIdx]
  const sys95 = BP_95TH[sexKey].systolic[ageIdx]
  const dia50 = BP_50TH[sexKey].diastolic[ageIdx]
  const dia90 = BP_90TH[sexKey].diastolic[ageIdx]
  const dia95 = BP_95TH[sexKey].diastolic[ageIdx]

  const sysPercentile = calculatePercentile(systolic, sys50, sys90)
  const diaPercentile = calculatePercentile(diastolic, dia50, dia90)

  // Stage 2: >= 95th + 12 mmHg OR >= 140/90 (whichever is lower)
  const stage2SysThreshold = Math.min(sys95 + 12, 140)
  const stage2DiaThreshold = Math.min(dia95 + 12, 90)

  if (systolic >= stage2SysThreshold || diastolic >= stage2DiaThreshold) {
    return {
      category: "stage2-htn",
      label: "Stage 2 Hypertension",
      labelHi: "स्टेज 2 उच्च रक्तचाप",
      description: `BP ${systolic}/${diastolic} mmHg exceeds 95th percentile + 12 mmHg (thresholds: ${stage2SysThreshold}/${stage2DiaThreshold}). This is Stage 2 Hypertension.`,
      descriptionHi: `BP ${systolic}/${diastolic} mmHg 95वीं प्रतिशतक + 12 mmHg (सीमा: ${stage2SysThreshold}/${stage2DiaThreshold}) से अधिक है। यह स्टेज 2 उच्च रक्तचाप है।`,
      systolicPercentile: sysPercentile,
      diastolicPercentile: diaPercentile,
      severity: "critical",
      recommendation: "Urgent evaluation required. Refer to pediatric nephrologist/cardiologist. Initiate pharmacologic treatment. Echocardiography recommended.",
      recommendationHi: "तत्काल मूल्यांकन आवश्यक। बाल रोग नेफ्रोलॉजिस्ट/कार्डियोलॉजिस्ट को रेफर करें। दवा उपचार शुरू करें। इकोकार्डियोग्राफी अनुशंसित।",
      color: "text-red-700",
      bgColor: "bg-red-50",
    }
  }

  // Stage 1: >= 95th to < 95th + 12 OR 130/80 to 139/89 (whichever is lower)
  const stage1SysLower = Math.min(sys95, 130)
  const stage1DiaLower = Math.min(dia95, 80)

  if (systolic >= stage1SysLower || diastolic >= stage1DiaLower) {
    return {
      category: "stage1-htn",
      label: "Stage 1 Hypertension",
      labelHi: "स्टेज 1 उच्च रक्तचाप",
      description: `BP ${systolic}/${diastolic} mmHg is at or above 95th percentile (${sys95}/${dia95} mmHg). This is Stage 1 Hypertension.`,
      descriptionHi: `BP ${systolic}/${diastolic} mmHg 95वीं प्रतिशतक (${sys95}/${dia95} mmHg) पर या उससे ऊपर है। यह स्टेज 1 उच्च रक्तचाप है।`,
      systolicPercentile: sysPercentile,
      diastolicPercentile: diaPercentile,
      severity: "danger",
      recommendation: "Recheck BP on 3 separate occasions. If confirmed, implement lifestyle changes. Consider ABPM. If persistent, consider pharmacologic therapy.",
      recommendationHi: "3 अलग-अलग अवसरों पर BP दोबारा जांचें। पुष्टि होने पर जीवनशैली में बदलाव करें। ABPM पर विचार करें।",
      color: "text-orange-700",
      bgColor: "bg-orange-50",
    }
  }

  // Elevated: >= 90th to < 95th OR 120/80 to < 95th (whichever is lower)
  const elevatedSysLower = Math.min(sys90, 120)
  const elevatedDiaLower = Math.min(dia90, 80)

  if (systolic >= elevatedSysLower || diastolic >= elevatedDiaLower) {
    return {
      category: "elevated",
      label: "Elevated Blood Pressure",
      labelHi: "बढ़ा हुआ रक्तचाप",
      description: `BP ${systolic}/${diastolic} mmHg is between 90th and 95th percentile (90th: ${sys90}/${dia90}, 95th: ${sys95}/${dia95}). This is Elevated BP.`,
      descriptionHi: `BP ${systolic}/${diastolic} mmHg 90वीं और 95वीं प्रतिशतक के बीच है। यह बढ़ा हुआ BP है।`,
      systolicPercentile: sysPercentile,
      diastolicPercentile: diaPercentile,
      severity: "warning",
      recommendation: "Lifestyle counselling: DASH diet, regular exercise. Recheck in 6 months. If elevated for 1+ year, perform ABPM.",
      recommendationHi: "जीवनशैली परामर्श: DASH आहार, नियमित व्यायाम। 6 महीने में दोबारा जांचें। 1+ वर्ष से बढ़ा हुआ हो तो ABPM करें।",
      color: "text-amber-700",
      bgColor: "bg-amber-50",
    }
  }

  // Normotensive: < 90th percentile
  return {
    category: "normotensive",
    label: "Normotensive",
    labelHi: "सामान्य रक्तचाप",
    description: `BP ${systolic}/${diastolic} mmHg is below 90th percentile (${sys90}/${dia90}). This is normal.`,
    descriptionHi: `BP ${systolic}/${diastolic} mmHg 90वीं प्रतिशतक (${sys90}/${dia90}) से नीचे है। यह सामान्य है।`,
    systolicPercentile: sysPercentile,
    diastolicPercentile: diaPercentile,
    severity: "normal",
    recommendation: "BP is within normal limits. Continue monitoring as part of regular nephrotic syndrome follow-up.",
    recommendationHi: "BP सामान्य सीमा में है। नेफ्रोटिक सिंड्रोम फॉलो-अप के हिस्से के रूप में निगरानी जारी रखें।",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
  }
}

// ============================================================================
// URINE DIPSTICK CLASSIFICATION
// ============================================================================

export type ProteinuriaCategory =
  | "normal"
  | "trace"
  | "mild"
  | "moderate"
  | "nephrotic-range"
  | "very-heavy"

export interface DipstickClassification {
  category: ProteinuriaCategory
  label: string
  labelHi: string
  description: string
  descriptionHi: string
  approximateProtein: string
  severity: "normal" | "info" | "warning" | "danger" | "critical"
  isNephroticRange: boolean
  recommendation: string
  recommendationHi: string
  color: string
  bgColor: string
}

/**
 * Classify a single urine dipstick reading
 */
export function classifyDipstick(
  result: "negative" | "trace" | "1+" | "2+" | "3+" | "4+" | null | undefined
): DipstickClassification {
  if (!result || result === "negative") {
    return {
      category: "normal",
      label: "Negative",
      labelHi: "नकारात्मक",
      description: "No protein detected in urine. This is a normal finding.",
      descriptionHi: "मूत्र में कोई प्रोटीन नहीं पाया गया। यह सामान्य है।",
      approximateProtein: "< 10 mg/dL",
      severity: "normal",
      isNephroticRange: false,
      recommendation: "Normal result. Continue daily monitoring.",
      recommendationHi: "सामान्य परिणाम। दैनिक निगरानी जारी रखें।",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
    }
  }

  switch (result) {
    case "trace":
      return {
        category: "trace",
        label: "Trace",
        labelHi: "ट्रेस",
        description: "Trace amount of protein. Generally not clinically significant in isolation.",
        descriptionHi: "बहुत कम मात्रा में प्रोटीन। अकेले में आमतौर पर चिकित्सकीय रूप से महत्वपूर्ण नहीं।",
        approximateProtein: "15-30 mg/dL",
        severity: "normal",
        isNephroticRange: false,
        recommendation: "Considered normal. Continue monitoring. If trace persists, discuss with doctor at next visit.",
        recommendationHi: "सामान्य माना जाता है। निगरानी जारी रखें। लगातार बना रहे तो अगली विजिट में डॉक्टर से चर्चा करें।",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
      }
    case "1+":
      return {
        category: "mild",
        label: "1+ (Mild Proteinuria)",
        labelHi: "1+ (हल्का प्रोटीनमेह)",
        description: "Mild proteinuria. Clinically abnormal (>= 1+ is significant). However, 1+ for a few days after infection is common and often resolves.",
        descriptionHi: "हल्का प्रोटीनमेह। चिकित्सकीय रूप से असामान्य (>= 1+ महत्वपूर्ण)। हालांकि, संक्रमण के बाद कुछ दिनों तक 1+ सामान्य है।",
        approximateProtein: "~30 mg/dL",
        severity: "info",
        isNephroticRange: false,
        recommendation: "Monitor daily. This is NOT a relapse. If persists for > 5-7 days or rises to 3+, contact doctor.",
        recommendationHi: "रोज़ निगरानी करें। यह रिलैप्स नहीं है। 5-7 दिनों से अधिक बना रहे या 3+ तक बढ़े तो डॉक्टर से संपर्क करें।",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
      }
    case "2+":
      return {
        category: "moderate",
        label: "2+ (Moderate Proteinuria)",
        labelHi: "2+ (मध्यम प्रोटीनमेह)",
        description: "Moderate proteinuria. Clinically significant but not yet nephrotic range. May follow infection and resolve spontaneously.",
        descriptionHi: "मध्यम प्रोटीनमेह। चिकित्सकीय रूप से महत्वपूर्ण लेकिन अभी नेफ्रोटिक रेंज में नहीं। संक्रमण के बाद हो सकता है।",
        approximateProtein: "~100 mg/dL",
        severity: "warning",
        isNephroticRange: false,
        recommendation: "Monitor closely. Not yet relapse. If rises to 3+ or persists > 1 week, contact doctor. No treatment change needed yet.",
        recommendationHi: "ध्यान से निगरानी करें। अभी रिलैप्स नहीं। 3+ तक बढ़े या 1 सप्ताह से अधिक बना रहे तो डॉक्टर से संपर्क करें।",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
      }
    case "3+":
      return {
        category: "nephrotic-range",
        label: "3+ (Nephrotic Range)",
        labelHi: "3+ (नेफ्रोटिक रेंज)",
        description: "Nephrotic range proteinuria (~300 mg/dL). This indicates active disease. If 3+ for 3 consecutive days, this confirms RELAPSE.",
        descriptionHi: "नेफ्रोटिक रेंज प्रोटीनमेह (~300 mg/dL)। यह सक्रिय रोग का संकेत है। लगातार 3 दिन 3+ होने पर रिलैप्स की पुष्टि होती है।",
        approximateProtein: "~300 mg/dL",
        severity: "danger",
        isNephroticRange: true,
        recommendation: "IMPORTANT: Test again tomorrow. If 3+ for 3 consecutive days = RELAPSE. Contact doctor to restart prednisolone treatment.",
        recommendationHi: "महत्वपूर्ण: कल फिर परीक्षण करें। लगातार 3 दिन 3+ = रिलैप्स। प्रेडनिसोलोन उपचार पुनः शुरू करने के लिए डॉक्टर से संपर्क करें।",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
      }
    case "4+":
      return {
        category: "very-heavy",
        label: "4+ (Very Heavy Proteinuria)",
        labelHi: "4+ (बहुत भारी प्रोटीनमेह)",
        description: "Very heavy proteinuria (> 2000 mg/dL). This is well into nephrotic range and indicates very active disease.",
        descriptionHi: "बहुत भारी प्रोटीनमेह (> 2000 mg/dL)। यह नेफ्रोटिक रेंज में है और बहुत सक्रिय रोग का संकेत है।",
        approximateProtein: "> 2000 mg/dL",
        severity: "critical",
        isNephroticRange: true,
        recommendation: "Contact doctor immediately. Very heavy protein loss. If 3 consecutive days of 3+/4+ = confirmed RELAPSE. Start treatment promptly.",
        recommendationHi: "तुरंत डॉक्टर से संपर्क करें। बहुत भारी प्रोटीन हानि। लगातार 3 दिन 3+/4+ = पुष्टि रिलैप्स। तुरंत उपचार शुरू करें।",
        color: "text-red-700",
        bgColor: "bg-red-50",
      }
    default:
      return {
        category: "normal",
        label: "Unknown",
        labelHi: "अज्ञात",
        description: "Unable to classify this result.",
        descriptionHi: "इस परिणाम को वर्गीकृत करने में असमर्थ।",
        approximateProtein: "-",
        severity: "normal",
        isNephroticRange: false,
        recommendation: "Retest with a fresh sample.",
        recommendationHi: "ताज़ा नमूने से दोबारा परीक्षण करें।",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
      }
  }
}

// ============================================================================
// DISEASE STATE ANALYSIS
// ============================================================================

export type DiseaseState = "remission" | "relapse" | "approaching-relapse" | "approaching-remission" | "monitoring" | "unknown"

export interface DiseaseStateAnalysis {
  state: DiseaseState
  label: string
  labelHi: string
  description: string
  descriptionHi: string
  consecutivePositiveDays: number
  consecutiveNegativeDays: number
  latestDipstick: DipstickClassification | null
  latestBP: BPClassification | null
  severity: "normal" | "warning" | "danger" | "critical"
  color: string
  bgColor: string
}

/**
 * Analyze complete disease state combining urine tests, BP, and patient profile
 */
export function analyzeDiseaseState(
  urineTests: UrineTestResult[],
  healthData: HealthData[],
  profile: PatientProfile
): DiseaseStateAnalysis {
  // Latest dipstick
  const sortedTests = [...urineTests].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const latestTest = sortedTests.length > 0 ? sortedTests[sortedTests.length - 1] : null
  const latestDipstick = latestTest ? classifyDipstick(latestTest.result) : null

  // Latest BP
  const sortedHealth = [...healthData]
    .filter((h) => h.bp)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const latestBPData = sortedHealth.length > 0 ? sortedHealth[sortedHealth.length - 1] : null
  const latestBP = latestBPData?.bp
    ? classifyBP(latestBPData.bp.systolic, latestBPData.bp.diastolic, profile.age, profile.sex, profile.height)
    : null

  // Calculate consecutive days
  let consecutivePositive = 0
  let consecutiveNegative = 0

  for (let i = sortedTests.length - 1; i >= 0; i--) {
    const result = sortedTests[i].result
    const severity = { negative: 0, trace: 1, "1+": 2, "2+": 3, "3+": 4, "4+": 5 }[result] ?? 0
    if (severity >= 4) {
      // 3+ or 4+
      if (consecutiveNegative === 0 && consecutivePositive >= 0) {
        consecutivePositive++
      } else {
        break
      }
    } else if (severity <= 1) {
      // negative or trace
      if (consecutivePositive === 0 && consecutiveNegative >= 0) {
        consecutiveNegative++
      } else {
        break
      }
    } else {
      break // 1+ or 2+ breaks the streak
    }
  }

  // Determine disease state
  let state: DiseaseState = "unknown"
  let severity: DiseaseStateAnalysis["severity"] = "normal"

  if (sortedTests.length === 0) {
    state = "unknown"
  } else if (consecutivePositive >= 3) {
    state = "relapse"
    severity = "critical"
  } else if (consecutivePositive === 2) {
    state = "approaching-relapse"
    severity = "danger"
  } else if (consecutiveNegative >= 3) {
    state = "remission"
    severity = "normal"
  } else if (consecutiveNegative === 2) {
    state = "approaching-remission"
    severity = "normal"
  } else {
    state = "monitoring"
    severity = "warning"
  }

  const labels: Record<DiseaseState, { en: string; hi: string }> = {
    remission: { en: "In Remission", hi: "रिमिशन में" },
    relapse: { en: "Relapse Confirmed", hi: "रिलैप्स की पुष्टि" },
    "approaching-relapse": { en: "Approaching Relapse", hi: "रिलैप्स की ओर" },
    "approaching-remission": { en: "Approaching Remission", hi: "रिमिशन की ओर" },
    monitoring: { en: "Active Monitoring", hi: "सक्रिय निगरानी" },
    unknown: { en: "No Data", hi: "कोई डेटा नहीं" },
  }

  const descriptions: Record<DiseaseState, { en: string; hi: string }> = {
    remission: {
      en: `Protein negative/trace for ${consecutiveNegative} consecutive days. Child is in remission.`,
      hi: `प्रोटीन ${consecutiveNegative} लगातार दिनों से नकारात्मक/ट्रेस। बच्चा रिमिशन में है।`,
    },
    relapse: {
      en: `Protein 3+/4+ for ${consecutivePositive} consecutive days. This is a confirmed relapse. Contact doctor immediately.`,
      hi: `प्रोटीन ${consecutivePositive} लगातार दिनों से 3+/4+। यह पुष्टि रिलैप्स है। तुरंत डॉक्टर से संपर्क करें।`,
    },
    "approaching-relapse": {
      en: `Protein 3+/4+ for 2 consecutive days. One more day confirms relapse. Monitor very carefully.`,
      hi: `प्रोटीन 2 लगातार दिनों से 3+/4+। एक और दिन रिलैप्स की पुष्टि करेगा। बहुत ध्यान से निगरानी करें।`,
    },
    "approaching-remission": {
      en: `Protein negative/trace for 2 consecutive days. One more day confirms remission!`,
      hi: `प्रोटीन 2 लगातार दिनों से नकारात्मक/ट्रेस। एक और दिन रिमिशन की पुष्टि करेगा!`,
    },
    monitoring: {
      en: `Protein levels are being monitored. Continue daily testing.`,
      hi: `प्रोटीन स्तर की निगरानी की जा रही है। दैनिक परीक्षण जारी रखें।`,
    },
    unknown: {
      en: `No urine test data available. Please start daily testing.`,
      hi: `कोई मूत्र परीक्षण डेटा उपलब्ध नहीं। कृपया दैनिक परीक्षण शुरू करें।`,
    },
  }

  const colorMap: Record<DiseaseState, { color: string; bgColor: string }> = {
    remission: { color: "text-emerald-700", bgColor: "bg-emerald-50" },
    relapse: { color: "text-red-700", bgColor: "bg-red-50" },
    "approaching-relapse": { color: "text-orange-700", bgColor: "bg-orange-50" },
    "approaching-remission": { color: "text-blue-700", bgColor: "bg-blue-50" },
    monitoring: { color: "text-amber-700", bgColor: "bg-amber-50" },
    unknown: { color: "text-muted-foreground", bgColor: "bg-muted" },
  }

  return {
    state,
    label: labels[state].en,
    labelHi: labels[state].hi,
    description: descriptions[state].en,
    descriptionHi: descriptions[state].hi,
    consecutivePositiveDays: consecutivePositive,
    consecutiveNegativeDays: consecutiveNegative,
    latestDipstick,
    latestBP,
    severity,
    color: colorMap[state].color,
    bgColor: colorMap[state].bgColor,
  }
}

// ============================================================================
// PREDICTIVE ANALYTICS
// ============================================================================

export interface PredictiveInsights {
  relapseRiskScore: number // 0-100
  relapseRiskLevel: "low" | "moderate" | "high" | "very-high"
  bpTrend: "stable" | "rising" | "falling" | "insufficient-data"
  proteinTrend: "improving" | "worsening" | "stable" | "insufficient-data"
  adherenceImpact: string
  adherenceImpactHi: string
  predictedOutcome: string
  predictedOutcomeHi: string
  factors: Array<{ factor: string; factorHi: string; impact: "positive" | "negative" | "neutral" }>
}

/**
 * Generate predictive analytics based on historical patient data
 */
export function generatePredictiveInsights(
  urineTests: UrineTestResult[],
  healthData: HealthData[],
  profile: PatientProfile,
  complianceScore: number
): PredictiveInsights {
  const proteinSeverity: Record<string, number> = {
    negative: 0, trace: 1, "1+": 2, "2+": 3, "3+": 4, "4+": 5,
  }

  // Calculate protein trend
  const sortedTests = [...urineTests].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  let proteinTrend: PredictiveInsights["proteinTrend"] = "insufficient-data"
  if (sortedTests.length >= 5) {
    const recent = sortedTests.slice(-5)
    const values = recent.map((t) => proteinSeverity[t.result] ?? 0)
    const firstHalf = values.slice(0, Math.ceil(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    if (secondAvg < firstAvg - 0.5) proteinTrend = "improving"
    else if (secondAvg > firstAvg + 0.5) proteinTrend = "worsening"
    else proteinTrend = "stable"
  }

  // Calculate BP trend
  const bpReadings = healthData.filter((h) => h.bp).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  let bpTrend: PredictiveInsights["bpTrend"] = "insufficient-data"
  if (bpReadings.length >= 3) {
    const recentBP = bpReadings.slice(-5)
    const firstHalfBP = recentBP.slice(0, Math.ceil(recentBP.length / 2))
    const secondHalfBP = recentBP.slice(Math.floor(recentBP.length / 2))
    const firstAvgSys = firstHalfBP.reduce((a, b) => a + (b.bp?.systolic ?? 0), 0) / firstHalfBP.length
    const secondAvgSys = secondHalfBP.reduce((a, b) => a + (b.bp?.systolic ?? 0), 0) / secondHalfBP.length
    if (secondAvgSys > firstAvgSys + 3) bpTrend = "rising"
    else if (secondAvgSys < firstAvgSys - 3) bpTrend = "falling"
    else bpTrend = "stable"
  }

  // Calculate relapse risk score (0-100)
  let riskScore = 20 // Base risk

  // Diagnosis-based risk
  const diagnosisRisk: Record<string, number> = {
    IFRNS: -5,
    FRNS: 15,
    SDNS: 20,
    SRNS: 25,
  }
  riskScore += diagnosisRisk[profile.diagnosis] ?? 0

  // Recent protein levels
  if (sortedTests.length >= 3) {
    const last3 = sortedTests.slice(-3)
    const avgProtein = last3.reduce((a, b) => a + (proteinSeverity[b.result] ?? 0), 0) / 3
    riskScore += avgProtein * 8
  }

  // Protein trend
  if (proteinTrend === "worsening") riskScore += 15
  else if (proteinTrend === "improving") riskScore -= 10

  // Compliance impact
  if (complianceScore < 50) riskScore += 10
  else if (complianceScore > 80) riskScore -= 5

  // BP impact
  if (bpTrend === "rising") riskScore += 5

  riskScore = Math.max(0, Math.min(100, Math.round(riskScore)))

  const riskLevel: PredictiveInsights["relapseRiskLevel"] =
    riskScore >= 75 ? "very-high" :
    riskScore >= 50 ? "high" :
    riskScore >= 25 ? "moderate" : "low"

  // Build factors
  const factors: PredictiveInsights["factors"] = []

  if (profile.diagnosis === "FRNS" || profile.diagnosis === "SDNS") {
    factors.push({
      factor: `${profile.diagnosis} diagnosis - higher relapse frequency expected`,
      factorHi: `${profile.diagnosis} निदान - अधिक रिलैप्स आवृत्ति अपेक्षित`,
      impact: "negative",
    })
  }
  if (proteinTrend === "worsening") {
    factors.push({
      factor: "Protein levels trending upward",
      factorHi: "प्रोटीन स्तर ऊपर की ओर बढ़ रहा है",
      impact: "negative",
    })
  } else if (proteinTrend === "improving") {
    factors.push({
      factor: "Protein levels trending downward",
      factorHi: "प्रोटीन स्तर नीचे की ओर जा रहा है",
      impact: "positive",
    })
  }
  if (complianceScore >= 80) {
    factors.push({
      factor: `Good compliance (${complianceScore}%) - medications taken regularly`,
      factorHi: `अच्छा अनुपालन (${complianceScore}%) - दवाइयाँ नियमित ली जा रही हैं`,
      impact: "positive",
    })
  } else if (complianceScore < 50) {
    factors.push({
      factor: `Low compliance (${complianceScore}%) - missed medications increase risk`,
      factorHi: `कम अनुपालन (${complianceScore}%) - छूटी दवाइयाँ जोखिम बढ़ाती हैं`,
      impact: "negative",
    })
  }
  if (bpTrend === "rising") {
    factors.push({
      factor: "Blood pressure trending upward",
      factorHi: "रक्तचाप ऊपर की ओर बढ़ रहा है",
      impact: "negative",
    })
  }

  // Adherence impact
  const adherenceImpact = complianceScore >= 80
    ? "Good medication adherence is helping maintain disease control."
    : complianceScore >= 50
      ? "Moderate adherence. Improving consistency may reduce relapse risk."
      : "Low adherence significantly increases risk. Focus on daily medication routine."

  const adherenceImpactHi = complianceScore >= 80
    ? "अच्छा दवा अनुपालन रोग नियंत्रण बनाए रखने में मदद कर रहा है।"
    : complianceScore >= 50
      ? "मध्यम अनुपालन। निरंतरता सुधारने से रिलैप्स का जोखिम कम हो सकता है।"
      : "कम अनुपालन से जोखिम काफी बढ़ जाता है। दैनिक दवा दिनचर्या पर ध्यान दें।"

  // Predicted outcome
  const predictedOutcome = riskLevel === "low"
    ? "Based on current trends, continued remission is likely. Keep up the good work!"
    : riskLevel === "moderate"
      ? "Moderate risk detected. Continue careful monitoring and medication adherence."
      : riskLevel === "high"
        ? "Elevated risk of relapse. Ensure daily testing and strict medication adherence. Contact doctor if protein rises."
        : "Very high risk. Immediate attention needed. Contact your doctor today."

  const predictedOutcomeHi = riskLevel === "low"
    ? "वर्तमान रुझानों के आधार पर, रिमिशन जारी रहने की संभावना है। अच्छा काम जारी रखें!"
    : riskLevel === "moderate"
      ? "मध्यम जोखिम पाया गया। सावधानीपूर्वक निगरानी और दवा अनुपालन जारी रखें।"
      : riskLevel === "high"
        ? "रिलैप्स का बढ़ा हुआ जोखिम। दैनिक परीक्षण और सख्त दवा अनुपालन सुनिश्चित करें।"
        : "बहुत अधिक जोखिम। तुरंत ध्यान देने की जरूरत। आज ही डॉक्टर से संपर्क करें।"

  return {
    relapseRiskScore: riskScore,
    relapseRiskLevel: riskLevel,
    bpTrend,
    proteinTrend,
    adherenceImpact,
    adherenceImpactHi,
    predictedOutcome,
    predictedOutcomeHi,
    factors,
  }
}
