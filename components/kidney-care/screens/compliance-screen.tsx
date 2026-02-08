"use client"

import { useMemo } from "react"
import { useApp, getTranslations } from "@/lib/app-context"
import { calculateComplianceMetrics, getGradeInfo } from "@/lib/compliance-tracking"
import { TopHeaderBar } from "../top-header-bar"
import {
  ChevronLeft,
  TestTube,
  Pill,
  Award,
  Flame,
  Target,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react"

export function ComplianceScreen() {
  const {
    language,
    setCurrentScreen,
    dailyCheckIns,
    urineTests,
    medications,
  } = useApp()
  const t = getTranslations(language)
  const isEn = language === "en" || !["hi", "bn", "ta", "pa"].includes(language)

  const metrics = useMemo(
    () => calculateComplianceMetrics(dailyCheckIns, urineTests, medications, 30),
    [dailyCheckIns, urineTests, medications]
  )

  const gradeInfo = getGradeInfo(metrics.overallGrade, language)

  // Labels
  const l = {
    title: isEn ? "Compliance Tracker" : "अनुपालन ट्रैकर",
    overallScore: isEn ? "Overall Score" : "कुल स्कोर",
    urineTests: isEn ? "Urine Tests" : "मूत्र परीक्षण",
    medications: isEn ? "Medications" : "दवाइयाँ",
    dailyChecks: isEn ? "Daily Checks" : "दैनिक जांच",
    currentStreak: isEn ? "Current Streak" : "वर्तमान स्ट्रीक",
    longestStreak: isEn ? "Longest Streak" : "सबसे लंबा स्ट्रीक",
    days: isEn ? "days" : "दिन",
    last30: isEn ? "Last 30 Days" : "पिछले 30 दिन",
    weeklyProgress: isEn ? "Weekly Progress" : "साप्ताहिक प्रगति",
    activityCalendar: isEn ? "Activity Calendar" : "गतिविधि कैलेंडर",
    completedOf: isEn ? "of" : "में से",
    week: isEn ? "Week" : "सप्ताह",
  }

  // Circular progress ring component
  const ProgressRing = ({
    percentage,
    size = 120,
    strokeWidth = 10,
    color,
    children,
  }: {
    percentage: number
    size?: number
    strokeWidth?: number
    color: string
    children: React.ReactNode
  }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopHeaderBar showMenu={false} />

      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentScreen("dashboard")}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{l.title}</h1>
            <p className="text-sm text-muted-foreground">{l.last30}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-4">
        {/* Overall Score Card */}
        <div className="bg-card rounded-2xl p-6 border border-border flex flex-col items-center">
          <ProgressRing
            percentage={metrics.overallScore}
            size={140}
            strokeWidth={12}
            color={
              metrics.overallScore >= 85
                ? "#10b981"
                : metrics.overallScore >= 70
                  ? "#3b82f6"
                  : metrics.overallScore >= 50
                    ? "#f59e0b"
                    : "#ef4444"
            }
          >
            <p className="text-3xl font-bold text-foreground">
              {metrics.overallScore}
            </p>
            <p className="text-xs text-muted-foreground">{l.overallScore}</p>
          </ProgressRing>

          <div className="mt-4 flex items-center gap-2">
            <Award className={`w-5 h-5 ${gradeInfo.color}`} />
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold ${gradeInfo.color} ${gradeInfo.bgColor}`}
            >
              {gradeInfo.label}
            </span>
          </div>
        </div>

        {/* Compliance Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {/* Urine Test */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <TestTube className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {l.urineTests}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {metrics.urineTestCompliance.percentage}%
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.urineTestCompliance.completedDays} {l.completedOf}{" "}
              {metrics.urineTestCompliance.totalDays} {l.days}
            </p>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all"
                style={{
                  width: `${metrics.urineTestCompliance.percentage}%`,
                }}
              />
            </div>
          </div>

          {/* Medication */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Pill className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {l.medications}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {metrics.medicationCompliance.percentage}%
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.medicationCompliance.completedDays} {l.completedOf}{" "}
              {metrics.medicationCompliance.totalDays} {l.days}
            </p>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{
                  width: `${metrics.medicationCompliance.percentage}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Streaks */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            {l.currentStreak}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <TestTube className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-xl font-bold text-foreground">
                  {metrics.urineTestCompliance.currentStreak}
                </p>
                <p className="text-xs text-muted-foreground">
                  {l.urineTests} ({l.longestStreak}:{" "}
                  {metrics.urineTestCompliance.longestStreak})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Pill className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xl font-bold text-foreground">
                  {metrics.medicationCompliance.currentStreak}
                </p>
                <p className="text-xs text-muted-foreground">
                  {l.medications} ({l.longestStreak}:{" "}
                  {metrics.medicationCompliance.longestStreak})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            {l.weeklyProgress}
          </h3>
          <div className="space-y-3">
            {metrics.weeklyBreakdown.map((week, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-14 flex-shrink-0">
                  {l.week} {index + 1}
                </span>
                <div className="flex-1 bg-muted rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      week.score >= 85
                        ? "bg-emerald-500"
                        : week.score >= 50
                          ? "bg-amber-500"
                          : "bg-red-400"
                    }`}
                    style={{ width: `${Math.max(week.score, 3)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground w-10 text-right">
                  {week.score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Heatmap */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            {l.activityCalendar}
          </h3>
          <div className="grid grid-cols-7 gap-1">
            {metrics.calendarData.slice(-28).map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.urineTest ? "Urine " : ""}${day.medication ? "Meds " : ""}${day.checkIn ? "Check-in" : ""}`}
                className={`aspect-square rounded-sm flex items-center justify-center ${
                  day.level === 0
                    ? "bg-muted"
                    : day.level === 1
                      ? "bg-emerald-200"
                      : day.level === 2
                        ? "bg-emerald-400"
                        : "bg-emerald-600"
                }`}
              >
                {day.level === 3 ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-50" />
                ) : day.level === 0 ? (
                  <XCircle className="w-3 h-3 text-muted-foreground/30" />
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <span>{isEn ? "None" : "कोई नहीं"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-emerald-200" />
              <span>{isEn ? "Some" : "कुछ"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-emerald-400" />
              <span>{isEn ? "Most" : "ज़्यादा"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-emerald-600" />
              <span>{isEn ? "All" : "सभी"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
