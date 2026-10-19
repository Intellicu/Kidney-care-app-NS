/**
 * Compliance Tracking Module
 * 
 * Tracks patient adherence to:
 * 1. Daily urine testing
 * 2. Medication intake
 * 3. Daily check-in completion
 * 
 * Generates compliance metrics and streak tracking
 */

import type { DailyCheckIn, Medication, UrineTestResult } from "./app-context"

export interface ComplianceMetrics {
  // Overall compliance
  overallScore: number // 0-100
  overallGrade: "excellent" | "good" | "fair" | "poor"

  // Urine testing compliance
  urineTestCompliance: {
    completedDays: number
    totalDays: number
    percentage: number
    currentStreak: number
    longestStreak: number
    missedDays: string[]
  }

  // Medication compliance
  medicationCompliance: {
    completedDays: number
    totalDays: number
    percentage: number
    currentStreak: number
    longestStreak: number
  }

  // Check-in completion
  checkInCompliance: {
    completedDays: number
    totalDays: number
    percentage: number
  }

  // Weekly breakdown
  weeklyBreakdown: Array<{
    weekStart: string
    urineTests: number
    medChecks: number
    totalDays: number
    score: number
  }>

  // Calendar heatmap data (last 90 days)
  calendarData: Array<{
    date: string
    urineTest: boolean
    medication: boolean
    checkIn: boolean
    level: 0 | 1 | 2 | 3 // 0=none, 1=partial, 2=most, 3=all
  }>
}

/**
 * Get all dates in a range
 */
function getDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0])
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

/**
 * Calculate streak (consecutive days) from most recent
 */
function calculateStreak(completedDates: Set<string>, allDates: string[]): {
  currentStreak: number
  longestStreak: number
} {
  // Current streak - work backwards from today
  let currentStreak = 0
  for (let i = allDates.length - 1; i >= 0; i--) {
    if (completedDates.has(allDates[i])) {
      currentStreak++
    } else {
      break
    }
  }

  // Longest streak
  let longestStreak = 0
  let tempStreak = 0
  for (const date of allDates) {
    if (completedDates.has(date)) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  return { currentStreak, longestStreak }
}

/**
 * Calculate comprehensive compliance metrics
 */
export function calculateComplianceMetrics(
  dailyCheckIns: DailyCheckIn[],
  urineTests: UrineTestResult[],
  medications: Medication[],
  daysToAnalyze: number = 30
): ComplianceMetrics {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - daysToAnalyze + 1)

  const allDates = getDateRange(startDate, today)
  const totalDays = allDates.length

  // Build lookup sets
  const urineTestDates = new Set(
    urineTests.map((t) => t.date.split("T")[0])
  )
  const checkInDates = new Set(dailyCheckIns.map((c) => c.date))
  const medCompletedDates = new Set(
    dailyCheckIns
      .filter((c) => c.medicationCheckCompleted)
      .map((c) => c.date)
  )
  const urineCompletedDates = new Set(
    dailyCheckIns
      .filter((c) => c.urineTestCompleted)
      .map((c) => c.date)
  )

  // Merge actual test dates with check-in confirmed dates
  const allUrineCompletedDates = new Set([
    ...urineTestDates,
    ...urineCompletedDates,
  ])

  // Urine test compliance
  const urineCompleted = allDates.filter((d) =>
    allUrineCompletedDates.has(d)
  ).length
  const missedUrineDays = allDates.filter(
    (d) => !allUrineCompletedDates.has(d)
  )
  const urineStreaks = calculateStreak(allUrineCompletedDates, allDates)

  // Medication compliance
  const medCompleted = allDates.filter((d) =>
    medCompletedDates.has(d)
  ).length
  const medStreaks = calculateStreak(medCompletedDates, allDates)

  // Check-in compliance
  const checkInCompleted = allDates.filter((d) =>
    checkInDates.has(d)
  ).length

  // Percentages
  const urinePercentage =
    totalDays > 0 ? Math.round((urineCompleted / totalDays) * 100) : 0
  const medPercentage =
    totalDays > 0 ? Math.round((medCompleted / totalDays) * 100) : 0
  const checkInPercentage =
    totalDays > 0 ? Math.round((checkInCompleted / totalDays) * 100) : 0

  // Overall score (weighted: urine 40%, meds 40%, check-in 20%)
  const overallScore = Math.round(
    urinePercentage * 0.4 + medPercentage * 0.4 + checkInPercentage * 0.2
  )

  const overallGrade: ComplianceMetrics["overallGrade"] =
    overallScore >= 85
      ? "excellent"
      : overallScore >= 70
        ? "good"
        : overallScore >= 50
          ? "fair"
          : "poor"

  // Weekly breakdown
  const weeklyBreakdown: ComplianceMetrics["weeklyBreakdown"] = []
  for (let i = 0; i < Math.ceil(totalDays / 7); i++) {
    const weekStartIdx = i * 7
    const weekDates = allDates.slice(weekStartIdx, weekStartIdx + 7)
    const weekUrineTests = weekDates.filter((d) =>
      allUrineCompletedDates.has(d)
    ).length
    const weekMedChecks = weekDates.filter((d) =>
      medCompletedDates.has(d)
    ).length
    const weekScore = Math.round(
      ((weekUrineTests + weekMedChecks) / (weekDates.length * 2)) * 100
    )

    weeklyBreakdown.push({
      weekStart: weekDates[0],
      urineTests: weekUrineTests,
      medChecks: weekMedChecks,
      totalDays: weekDates.length,
      score: weekScore,
    })
  }

  // Calendar heatmap data (last 90 days)
  const calendarStartDate = new Date(today)
  calendarStartDate.setDate(calendarStartDate.getDate() - 89)
  const calendarDates = getDateRange(calendarStartDate, today)

  const calendarData: ComplianceMetrics["calendarData"] = calendarDates.map(
    (date) => {
      const hasUrine = allUrineCompletedDates.has(date)
      const hasMed = medCompletedDates.has(date)
      const hasCheckIn = checkInDates.has(date)
      const count = [hasUrine, hasMed, hasCheckIn].filter(Boolean).length
      const level: 0 | 1 | 2 | 3 = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3

      return { date, urineTest: hasUrine, medication: hasMed, checkIn: hasCheckIn, level }
    }
  )

  return {
    overallScore,
    overallGrade,
    urineTestCompliance: {
      completedDays: urineCompleted,
      totalDays,
      percentage: urinePercentage,
      currentStreak: urineStreaks.currentStreak,
      longestStreak: urineStreaks.longestStreak,
      missedDays: missedUrineDays.slice(-7), // Last 7 missed days
    },
    medicationCompliance: {
      completedDays: medCompleted,
      totalDays,
      percentage: medPercentage,
      currentStreak: medStreaks.currentStreak,
      longestStreak: medStreaks.longestStreak,
    },
    checkInCompliance: {
      completedDays: checkInCompleted,
      totalDays,
      percentage: checkInPercentage,
    },
    weeklyBreakdown,
    calendarData,
  }
}

/**
 * Get grade label with color
 */
export function getGradeInfo(
  grade: ComplianceMetrics["overallGrade"],
  language: string
): { label: string; color: string; bgColor: string } {
  const isEn = language === "en"

  switch (grade) {
    case "excellent":
      return {
        label: isEn ? "Excellent" : "उत्कृष्ट",
        color: "text-emerald-700",
        bgColor: "bg-emerald-100",
      }
    case "good":
      return {
        label: isEn ? "Good" : "अच्छा",
        color: "text-blue-700",
        bgColor: "bg-blue-100",
      }
    case "fair":
      return {
        label: isEn ? "Fair" : "ठीक",
        color: "text-amber-700",
        bgColor: "bg-amber-100",
      }
    case "poor":
      return {
        label: isEn ? "Needs Improvement" : "सुधार ज़रूरी",
        color: "text-red-700",
        bgColor: "bg-red-100",
      }
  }
}
