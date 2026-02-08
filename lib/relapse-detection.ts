/**
 * Relapse / Remission Detection Engine
 * 
 * Based on ISPN (Indian Society of Pediatric Nephrology) guidelines:
 * - RELAPSE: Urine protein ≥ 2+ (or ≥ 100mg/dL) for 3 consecutive days
 * - REMISSION: Urine protein negative or trace for 3 consecutive days
 * 
 * Additional alert thresholds:
 * - WARNING: Urine protein ≥ 2+ for 2 consecutive days (early warning)
 * - CLINICAL ALERT: Symptoms (edema, weight gain >2%) alongside rising protein
 */

import type { UrineTestResult, SymptomEntry, HealthData } from "./app-context"

export type AlertSeverity = "info" | "warning" | "critical" | "success"

export type AlertType =
  | "relapse-detected"
  | "relapse-warning"
  | "remission-detected"
  | "remission-approaching"
  | "missed-test"
  | "weight-gain-alert"
  | "symptom-alert"
  | "compliance-low"

export interface ClinicalAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  titleHi: string
  message: string
  messageHi: string
  date: string
  dismissed: boolean
  actionRequired: boolean
  contactDoctor: boolean
  data?: Record<string, unknown>
}

export interface RelapseStatus {
  status: "remission" | "relapse" | "active-monitoring" | "unknown"
  consecutivePositiveDays: number
  consecutiveNegativeDays: number
  lastTestDate: string | null
  daysSinceLastTest: number
  trend: "improving" | "worsening" | "stable" | "unknown"
  relapseCount: number
  lastRelapseDate: string | null
  lastRemissionDate: string | null
}

// Protein level severity mapping
const proteinSeverity: Record<string, number> = {
  negative: 0,
  trace: 1,
  "1+": 2,
  "2+": 3,
  "3+": 4,
  "4+": 5,
}

/**
 * Get sorted urine tests by date (most recent last)
 */
function getSortedTests(tests: UrineTestResult[]): UrineTestResult[] {
  return [...tests].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

/**
 * Check if a result is clinically positive (≥ 2+)
 */
function isPositive(result: string | null | undefined): boolean {
  if (!result) return false
  return (proteinSeverity[result] ?? 0) >= 3 // 2+ or higher
}

/**
 * Check if a result indicates remission (negative or trace)
 */
function isNegativeOrTrace(result: string | null | undefined): boolean {
  if (!result) return false
  return (proteinSeverity[result] ?? 0) <= 1
}

/**
 * Get consecutive days count for a condition from most recent tests
 */
function getConsecutiveDays(
  tests: UrineTestResult[],
  conditionFn: (result: string) => boolean
): number {
  const sorted = getSortedTests(tests)
  let count = 0

  // Work backwards from most recent
  for (let i = sorted.length - 1; i >= 0; i--) {
    const result = sorted[i].result
    if (conditionFn(result)) {
      count++
    } else {
      break
    }
  }

  return count
}

/**
 * Count total relapses in test history
 * A relapse is defined as 3+ consecutive days of ≥2+ following a period of remission
 */
function countRelapses(tests: UrineTestResult[]): {
  count: number
  lastRelapseDate: string | null
  lastRemissionDate: string | null
} {
  const sorted = getSortedTests(tests)
  let relapseCount = 0
  let lastRelapseDate: string | null = null
  let lastRemissionDate: string | null = null
  let consecutivePositive = 0
  let consecutiveNegative = 0
  let inRemission = false

  for (const test of sorted) {
    if (isPositive(test.result)) {
      consecutivePositive++
      consecutiveNegative = 0

      if (consecutivePositive >= 3 && inRemission) {
        relapseCount++
        lastRelapseDate = test.date
        inRemission = false
      }
    } else if (isNegativeOrTrace(test.result)) {
      consecutiveNegative++
      consecutivePositive = 0

      if (consecutiveNegative >= 3) {
        inRemission = true
        lastRemissionDate = test.date
      }
    } else {
      // Reset for ambiguous results like 1+
      consecutivePositive = 0
      consecutiveNegative = 0
    }
  }

  return { count: relapseCount, lastRelapseDate, lastRemissionDate }
}

/**
 * Calculate trend from recent tests
 */
function calculateTrend(
  tests: UrineTestResult[]
): "improving" | "worsening" | "stable" | "unknown" {
  const sorted = getSortedTests(tests)
  if (sorted.length < 3) return "unknown"

  const recent = sorted.slice(-5) // Last 5 tests
  const values = recent.map((t) => proteinSeverity[t.result] ?? 0)

  const firstHalf = values.slice(0, Math.ceil(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))

  const firstAvg =
    firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg =
    secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

  if (secondAvg < firstAvg - 0.5) return "improving"
  if (secondAvg > firstAvg + 0.5) return "worsening"
  return "stable"
}

/**
 * Main function: Analyze patient data and generate relapse status + alerts
 */
export function analyzeRelapseStatus(
  urineTests: UrineTestResult[]
): RelapseStatus {
  if (urineTests.length === 0) {
    return {
      status: "unknown",
      consecutivePositiveDays: 0,
      consecutiveNegativeDays: 0,
      lastTestDate: null,
      daysSinceLastTest: -1,
      trend: "unknown",
      relapseCount: 0,
      lastRelapseDate: null,
      lastRemissionDate: null,
    }
  }

  const sorted = getSortedTests(urineTests)
  const lastTest = sorted[sorted.length - 1]
  const lastTestDate = lastTest.date

  const today = new Date()
  const lastDate = new Date(lastTestDate)
  const daysSinceLastTest = Math.floor(
    (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  const consecutivePositiveDays = getConsecutiveDays(urineTests, isPositive)
  const consecutiveNegativeDays = getConsecutiveDays(
    urineTests,
    isNegativeOrTrace
  )
  const trend = calculateTrend(urineTests)
  const { count: relapseCount, lastRelapseDate, lastRemissionDate } =
    countRelapses(urineTests)

  let status: RelapseStatus["status"] = "active-monitoring"

  if (consecutivePositiveDays >= 3) {
    status = "relapse"
  } else if (consecutiveNegativeDays >= 3) {
    status = "remission"
  }

  return {
    status,
    consecutivePositiveDays,
    consecutiveNegativeDays,
    lastTestDate,
    daysSinceLastTest,
    trend,
    relapseCount,
    lastRelapseDate,
    lastRemissionDate,
  }
}

/**
 * Generate clinical alerts based on all patient data
 */
export function generateAlerts(
  urineTests: UrineTestResult[],
  symptomEntries: SymptomEntry[],
  healthData: HealthData[],
  dailyCheckInsCount: number,
  totalExpectedDays: number
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = []
  const relapseStatus = analyzeRelapseStatus(urineTests)
  const today = new Date().toISOString().split("T")[0]

  // 1. RELAPSE DETECTED (Critical)
  if (relapseStatus.consecutivePositiveDays >= 3) {
    alerts.push({
      id: `relapse-${today}`,
      type: "relapse-detected",
      severity: "critical",
      title: "Relapse Detected",
      titleHi: "रिलैप्स का पता चला",
      message: `Protein has been 2+ or higher for ${relapseStatus.consecutivePositiveDays} consecutive days. Please contact your doctor immediately.`,
      messageHi: `प्रोटीन लगातार ${relapseStatus.consecutivePositiveDays} दिनों से 2+ या अधिक है। कृपया तुरंत अपने डॉक्टर से संपर्क करें।`,
      date: today,
      dismissed: false,
      actionRequired: true,
      contactDoctor: true,
      data: {
        consecutiveDays: relapseStatus.consecutivePositiveDays,
        relapseCount: relapseStatus.relapseCount,
      },
    })
  }

  // 2. RELAPSE WARNING (Warning) - 2 consecutive positive days
  if (
    relapseStatus.consecutivePositiveDays === 2
  ) {
    alerts.push({
      id: `relapse-warning-${today}`,
      type: "relapse-warning",
      severity: "warning",
      title: "Rising Protein Levels",
      titleHi: "प्रोटीन का स्तर बढ़ रहा है",
      message:
        "Protein has been 2+ or higher for 2 days. If it continues tomorrow, this indicates a relapse. Monitor carefully.",
      messageHi:
        "प्रोटीन 2 दिनों से 2+ या अधिक है। अगर कल भी ऐसा रहा तो यह रिलैप्स है। ध्यान से निगरानी करें।",
      date: today,
      dismissed: false,
      actionRequired: true,
      contactDoctor: false,
      data: {
        consecutiveDays: 2,
      },
    })
  }

  // 3. REMISSION DETECTED (Success)
  if (relapseStatus.consecutiveNegativeDays >= 3 && relapseStatus.status === "remission") {
    alerts.push({
      id: `remission-${today}`,
      type: "remission-detected",
      severity: "success",
      title: "Remission Achieved",
      titleHi: "छूट (रिमिशन) प्राप्त",
      message: `Protein has been negative/trace for ${relapseStatus.consecutiveNegativeDays} consecutive days. Great progress! Continue monitoring daily.`,
      messageHi: `प्रोटीन लगातार ${relapseStatus.consecutiveNegativeDays} दिनों से नकारात्मक/ट्रेस है। बहुत अच्छी प्रगति! रोज़ निगरानी जारी रखें।`,
      date: today,
      dismissed: false,
      actionRequired: false,
      contactDoctor: false,
      data: {
        consecutiveDays: relapseStatus.consecutiveNegativeDays,
      },
    })
  }

  // 4. REMISSION APPROACHING (Info)
  if (relapseStatus.consecutiveNegativeDays === 2) {
    alerts.push({
      id: `remission-approaching-${today}`,
      type: "remission-approaching",
      severity: "info",
      title: "Almost in Remission",
      titleHi: "लगभग रिमिशन में",
      message:
        "Protein has been negative/trace for 2 days. One more day and remission is confirmed!",
      messageHi:
        "प्रोटीन 2 दिनों से नकारात्मक/ट्रेस है। एक और दिन और रिमिशन की पुष्टि हो जाएगी!",
      date: today,
      dismissed: false,
      actionRequired: false,
      contactDoctor: false,
    })
  }

  // 5. MISSED TEST (Warning) - No test for 2+ days
  if (relapseStatus.daysSinceLastTest >= 2) {
    alerts.push({
      id: `missed-test-${today}`,
      type: "missed-test",
      severity: "warning",
      title: "Urine Test Overdue",
      titleHi: "मूत्र परीक्षण बकाया",
      message: `You haven't done a urine test in ${relapseStatus.daysSinceLastTest} days. Daily testing is important for early detection.`,
      messageHi: `आपने ${relapseStatus.daysSinceLastTest} दिनों से मूत्र परीक्षण नहीं किया। शीघ्र पता लगाने के लिए दैनिक परीक्षण महत्वपूर्ण है।`,
      date: today,
      dismissed: false,
      actionRequired: true,
      contactDoctor: false,
    })
  }

  // 6. WEIGHT GAIN ALERT - >2% increase in recent measurements
  if (healthData.length >= 2) {
    const sortedHealth = [...healthData]
      .filter((h) => h.weight)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (sortedHealth.length >= 2) {
      const recent = sortedHealth[sortedHealth.length - 1]
      const previous = sortedHealth[sortedHealth.length - 2]
      if (recent.weight && previous.weight) {
        const percentChange =
          ((recent.weight - previous.weight) / previous.weight) * 100
        if (percentChange > 2) {
          alerts.push({
            id: `weight-gain-${today}`,
            type: "weight-gain-alert",
            severity: "warning",
            title: "Significant Weight Gain",
            titleHi: "महत्वपूर्ण वजन बढ़ा",
            message: `Weight increased by ${percentChange.toFixed(1)}% (${previous.weight}kg to ${recent.weight}kg). This may indicate fluid retention. Monitor closely.`,
            messageHi: `वजन ${percentChange.toFixed(1)}% बढ़ा (${previous.weight}kg से ${recent.weight}kg)। यह द्रव प्रतिधारण का संकेत हो सकता है।`,
            date: today,
            dismissed: false,
            actionRequired: true,
            contactDoctor: percentChange > 5,
            data: { percentChange, previousWeight: previous.weight, currentWeight: recent.weight },
          })
        }
      }
    }
  }

  // 7. SYMPTOM ALERT - Concerning symptoms with positive protein
  const recentSymptoms = symptomEntries.filter((s) => {
    const daysAgo = Math.floor(
      (new Date().getTime() - new Date(s.date).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    return daysAgo <= 2
  })

  const hasEdema = recentSymptoms.some((s) => s.symptoms.swelling)
  const hasBreathingIssue = recentSymptoms.some(
    (s) => s.symptoms.breathingDifficulty
  )

  if (
    (hasEdema || hasBreathingIssue) &&
    relapseStatus.consecutivePositiveDays >= 1
  ) {
    alerts.push({
      id: `symptom-alert-${today}`,
      type: "symptom-alert",
      severity: hasBreathingIssue ? "critical" : "warning",
      title: hasBreathingIssue
        ? "Urgent: Breathing Difficulty"
        : "Swelling with Protein",
      titleHi: hasBreathingIssue
        ? "तत्काल: सांस लेने में कठिनाई"
        : "प्रोटीन के साथ सूजन",
      message: hasBreathingIssue
        ? "Breathing difficulty with positive protein is serious. Go to hospital immediately."
        : "Swelling along with protein in urine. Watch for worsening symptoms.",
      messageHi: hasBreathingIssue
        ? "प्रोटीन के साथ सांस लेने में कठिनाई गंभीर है। तुरंत अस्पताल जाएं।"
        : "मूत्र में प्रोटीन के साथ सूजन। बिगड़ते लक्षणों पर नज़र रखें।",
      date: today,
      dismissed: false,
      actionRequired: true,
      contactDoctor: true,
    })
  }

  // 8. LOW COMPLIANCE (Info)
  if (totalExpectedDays >= 7) {
    const complianceRate =
      totalExpectedDays > 0
        ? (dailyCheckInsCount / totalExpectedDays) * 100
        : 100
    if (complianceRate < 60) {
      alerts.push({
        id: `compliance-low-${today}`,
        type: "compliance-low",
        severity: "info",
        title: "Improve Testing Frequency",
        titleHi: "परीक्षण आवृत्ति में सुधार करें",
        message: `You've completed ${dailyCheckInsCount} of ${totalExpectedDays} expected daily checks (${Math.round(complianceRate)}%). Try to test every day.`,
        messageHi: `आपने ${totalExpectedDays} में से ${dailyCheckInsCount} दैनिक जांच पूरी की (${Math.round(complianceRate)}%)। हर दिन जांच करने का प्रयास करें।`,
        date: today,
        dismissed: false,
        actionRequired: false,
        contactDoctor: false,
      })
    }
  }

  // Sort: critical first, then warning, then info, then success
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    success: 3,
  }
  alerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  )

  return alerts
}

/**
 * Get a summary string for the relapse status
 */
export function getStatusSummary(
  status: RelapseStatus,
  language: "en" | "hi" | string
): { label: string; color: string; bgColor: string } {
  const isEn = language === "en"

  switch (status.status) {
    case "relapse":
      return {
        label: isEn ? "Relapse" : "रिलैप्स",
        color: "text-red-700",
        bgColor: "bg-red-100",
      }
    case "remission":
      return {
        label: isEn ? "Remission" : "रिमिशन",
        color: "text-emerald-700",
        bgColor: "bg-emerald-100",
      }
    case "active-monitoring":
      return {
        label: isEn ? "Monitoring" : "निगरानी",
        color: "text-amber-700",
        bgColor: "bg-amber-100",
      }
    default:
      return {
        label: isEn ? "No Data" : "कोई डेटा नहीं",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
      }
  }
}
