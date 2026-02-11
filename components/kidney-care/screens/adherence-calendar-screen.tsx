"use client"

import { useState, useMemo } from "react"
import { useApp, getTranslations } from "@/lib/app-context"
import { calculateComplianceMetrics, getGradeInfo } from "@/lib/compliance-tracking"
import { FloatingAssistant } from "../floating-assistant"
import {
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Flame,
  Target,
  Pill,
  TestTube,
  Calendar,
  Award,
  TrendingUp,
} from "lucide-react"

export function AdherenceCalendarScreen() {
  const {
    language,
    setCurrentScreen,
    dailyCheckIns,
    urineTests,
    medications,
  } = useApp()
  const isEn = language === "en" || !["hi", "bn", "ta", "pa"].includes(language)

  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // Compliance metrics
  const compliance = useMemo(
    () => calculateComplianceMetrics(dailyCheckIns, urineTests, medications, 30),
    [dailyCheckIns, urineTests, medications]
  )

  const compliance90 = useMemo(
    () => calculateComplianceMetrics(dailyCheckIns, urineTests, medications, 90),
    [dailyCheckIns, urineTests, medications]
  )

  const gradeInfo = getGradeInfo(compliance.overallGrade, language)

  // Build calendar data
  const calendarDays = useMemo(() => {
    const year = viewMonth.year
    const month = viewMonth.month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay() // 0=Sun

    // Build lookup sets
    const urineTestDates = new Set(urineTests.map((t) => t.date.split("T")[0]))
    const checkInDates = new Set(dailyCheckIns.map((c) => c.date))
    const medDates = new Set(
      dailyCheckIns.filter((c) => c.medicationCheckCompleted).map((c) => c.date)
    )
    const urineDone = new Set(
      dailyCheckIns.filter((c) => c.urineTestCompleted).map((c) => c.date)
    )

    const days: Array<{
      date: string
      day: number
      isCurrentMonth: boolean
      hasUrineTest: boolean
      hasMedCheck: boolean
      hasCheckIn: boolean
      isFuture: boolean
      isToday: boolean
      level: 0 | 1 | 2 | 3
    }> = []

    const today = new Date().toISOString().split("T")[0]

    // Padding days
    for (let i = 0; i < startPadding; i++) {
      const prevDate = new Date(year, month, -startPadding + i + 1)
      const dateStr = prevDate.toISOString().split("T")[0]
      days.push({
        date: dateStr,
        day: prevDate.getDate(),
        isCurrentMonth: false,
        hasUrineTest: false,
        hasMedCheck: false,
        hasCheckIn: false,
        isFuture: dateStr > today,
        isToday: dateStr === today,
        level: 0,
      })
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = new Date(year, month, d).toISOString().split("T")[0]
      const hasUrine = urineTestDates.has(dateStr) || urineDone.has(dateStr)
      const hasMed = medDates.has(dateStr)
      const hasCI = checkInDates.has(dateStr)
      const count = [hasUrine, hasMed, hasCI].filter(Boolean).length
      const level: 0 | 1 | 2 | 3 = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3

      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        hasUrineTest: hasUrine,
        hasMedCheck: hasMed,
        hasCheckIn: hasCI,
        isFuture: dateStr > today,
        isToday: dateStr === today,
        level,
      })
    }

    return days
  }, [viewMonth, urineTests, dailyCheckIns])

  const monthNames = isEn
    ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    : ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"]

  const dayNames = isEn
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"]

  const navigateMonth = (delta: number) => {
    setViewMonth((prev) => {
      let newMonth = prev.month + delta
      let newYear = prev.year
      if (newMonth < 0) { newMonth = 11; newYear-- }
      if (newMonth > 11) { newMonth = 0; newYear++ }
      return { year: newYear, month: newMonth }
    })
  }

  const getLevelColor = (level: number, isFuture: boolean, isToday: boolean) => {
    if (isFuture) return "bg-muted/30"
    if (isToday) {
      if (level === 0) return "bg-primary/20 ring-2 ring-primary"
      if (level === 1) return "bg-amber-200 ring-2 ring-primary"
      if (level === 2) return "bg-emerald-200 ring-2 ring-primary"
      return "bg-emerald-400 ring-2 ring-primary"
    }
    if (level === 0) return "bg-muted/50"
    if (level === 1) return "bg-amber-200"
    if (level === 2) return "bg-emerald-200"
    return "bg-emerald-400"
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-card safe-top">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentScreen("dashboard")}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {isEn ? "Adherence Calendar" : "अनुपालन कैलेंडर"}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-4">
        {/* Score & Streak Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Target className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{compliance.overallScore}%</p>
            <p className="text-[10px] text-muted-foreground">{isEn ? "Score" : "स्कोर"}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${gradeInfo.color} ${gradeInfo.bgColor}`}>
              {gradeInfo.label}
            </span>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{compliance.urineTestCompliance.currentStreak}</p>
            <p className="text-[10px] text-muted-foreground">{isEn ? "Current Streak" : "वर्तमान स्ट्रीक"}</p>
            <p className="text-[10px] text-muted-foreground">
              {isEn ? `Best: ${compliance.urineTestCompliance.longestStreak}` : `सर्वश्रेष्ठ: ${compliance.urineTestCompliance.longestStreak}`}
            </p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{compliance.medicationCompliance.currentStreak}</p>
            <p className="text-[10px] text-muted-foreground">{isEn ? "Med Streak" : "दवा स्ट्रीक"}</p>
            <p className="text-[10px] text-muted-foreground">
              {isEn ? `Best: ${compliance.medicationCompliance.longestStreak}` : `सर्वश्रेष्ठ: ${compliance.medicationCompliance.longestStreak}`}
            </p>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button type="button" onClick={() => navigateMonth(-1)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-foreground">
              {monthNames[viewMonth.month]} {viewMonth.year}
            </h3>
            <button type="button" onClick={() => navigateMonth(1)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0 px-2 pt-2">
            {dayNames.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 px-2 pb-3">
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative ${
                  day.isCurrentMonth ? getLevelColor(day.level, day.isFuture, day.isToday) : "opacity-30"
                }`}
              >
                <span className={`text-xs font-medium ${
                  day.isToday ? "text-primary font-bold" : day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {day.day}
                </span>
                {day.isCurrentMonth && !day.isFuture && day.level > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {day.hasUrineTest && <div className="w-1 h-1 rounded-full bg-amber-600" />}
                    {day.hasMedCheck && <div className="w-1 h-1 rounded-full bg-emerald-600" />}
                    {day.hasCheckIn && <div className="w-1 h-1 rounded-full bg-blue-600" />}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="px-4 py-3 border-t border-border flex flex-wrap gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-600" />{isEn ? "Urine Test" : "मूत्र परीक्षण"}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" />{isEn ? "Medication" : "दवाई"}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600" />{isEn ? "Check-in" : "चेक-इन"}</span>
          </div>
        </div>

        {/* Compliance Breakdown */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {isEn ? "30-Day Breakdown" : "30-दिन विवरण"}
          </h3>
          <div className="space-y-3">
            {/* Urine Testing */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <TestTube className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-foreground">{isEn ? "Urine Testing" : "मूत्र परीक्षण"}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{compliance.urineTestCompliance.percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-amber-500 transition-all"
                  style={{ width: `${compliance.urineTestCompliance.percentage}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {compliance.urineTestCompliance.completedDays}/{compliance.urineTestCompliance.totalDays} {isEn ? "days" : "दिन"}
              </p>
            </div>

            {/* Medication */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-foreground">{isEn ? "Medication" : "दवाई"}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{compliance.medicationCompliance.percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${compliance.medicationCompliance.percentage}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {compliance.medicationCompliance.completedDays}/{compliance.medicationCompliance.totalDays} {isEn ? "days" : "दिन"}
              </p>
            </div>

            {/* Check-in */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-foreground">{isEn ? "Daily Check-in" : "दैनिक चेक-इन"}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{compliance.checkInCompliance.percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${compliance.checkInCompliance.percentage}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {compliance.checkInCompliance.completedDays}/{compliance.checkInCompliance.totalDays} {isEn ? "days" : "दिन"}
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {isEn ? "Weekly Scores" : "साप्ताहिक स्कोर"}
          </h3>
          <div className="flex items-end gap-2 h-24">
            {compliance.weeklyBreakdown.map((week, i) => {
              const height = Math.max(week.score, 5)
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className={`w-full rounded-t transition-all ${
                      week.score >= 80 ? "bg-emerald-400" :
                      week.score >= 50 ? "bg-amber-400" : "bg-red-400"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[9px] text-muted-foreground mt-1">
                    {isEn ? `W${i + 1}` : `स${i + 1}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <FloatingAssistant />
    </div>
  )
}
