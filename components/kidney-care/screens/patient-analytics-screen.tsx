"use client"

import { useState, useMemo } from "react"
import { useApp, getTranslations } from "@/lib/app-context"
import { analyzeDiseaseState, classifyBP, classifyDipstick, generatePredictiveInsights } from "@/lib/diagnostic-agent"
import { calculateComplianceMetrics } from "@/lib/compliance-tracking"
import { TopHeaderBar } from "../top-header-bar"
import { FloatingAssistant } from "../floating-assistant"
import {
  ChevronLeft,
  Activity,
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ShieldCheck,
  TestTube,
  BarChart3,
  Calendar,
  Target,
  ArrowUp,
  ArrowDown,
  Gauge,
  Sparkles,
  Filter,
} from "lucide-react"

export function PatientAnalyticsScreen() {
  const {
    language,
    setCurrentScreen,
    patientProfile,
    urineTests,
    healthData,
    medications,
    dailyCheckIns,
    symptomEntries,
  } = useApp()
  const t = getTranslations(language)
  const isEn = language === "en" || !["hi", "bn", "ta", "pa"].includes(language)

  const [activeTab, setActiveTab] = useState<"overview" | "bp" | "protein" | "predict">("overview")
  const [timeRange, setTimeRange] = useState<7 | 14 | 30 | 90>(30)

  // Disease state analysis
  const diseaseState = useMemo(
    () => analyzeDiseaseState(urineTests, healthData, patientProfile),
    [urineTests, healthData, patientProfile]
  )

  // Compliance metrics
  const compliance = useMemo(
    () => calculateComplianceMetrics(dailyCheckIns, urineTests, medications, timeRange),
    [dailyCheckIns, urineTests, medications, timeRange]
  )

  // Predictive insights
  const predictions = useMemo(
    () => generatePredictiveInsights(urineTests, healthData, patientProfile, compliance.overallScore),
    [urineTests, healthData, patientProfile, compliance.overallScore]
  )

  // Filtered data by time range
  const filteredTests = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - timeRange)
    return urineTests
      .filter((t) => new Date(t.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [urineTests, timeRange])

  const filteredBP = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - timeRange)
    return healthData
      .filter((h) => h.bp && new Date(h.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [healthData, timeRange])

  // Protein severity mapping for chart
  const proteinValue: Record<string, number> = {
    negative: 0, trace: 1, "1+": 2, "2+": 3, "3+": 4, "4+": 5,
  }

  const getProteinBarColor = (result: string) => {
    const v = proteinValue[result] ?? 0
    if (v <= 1) return "bg-emerald-400"
    if (v === 2) return "bg-blue-400"
    if (v === 3) return "bg-amber-400"
    if (v === 4) return "bg-orange-500"
    return "bg-red-500"
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "text-emerald-700 bg-emerald-50 border-emerald-200"
      case "moderate": return "text-amber-700 bg-amber-50 border-amber-200"
      case "high": return "text-orange-700 bg-orange-50 border-orange-200"
      case "very-high": return "text-red-700 bg-red-50 border-red-200"
      default: return "text-muted-foreground bg-muted border-border"
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopHeaderBar showMenu={false} />

      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => setCurrentScreen("dashboard")}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {isEn ? "Health Analytics" : "स्वास्थ्य विश्लेषण"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {patientProfile.name} | {patientProfile.diagnosis}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {[
            { id: "overview", label: isEn ? "Overview" : "अवलोकन" },
            { id: "bp", label: isEn ? "BP" : "BP" },
            { id: "protein", label: isEn ? "Protein" : "प्रोटीन" },
            { id: "predict", label: isEn ? "Predict" : "भविष्यवाणी" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="px-5 py-3 flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {[7, 14, 30, 90].map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => setTimeRange(days as typeof timeRange)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeRange === days
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {days}{isEn ? "d" : "दिन"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-4">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            {/* Disease State Card */}
            <div className={`rounded-2xl p-4 border-2 ${diseaseState.bgColor} ${diseaseState.color.replace("text-", "border-").replace("700", "200")}`}>
              <div className="flex items-center gap-3 mb-2">
                {diseaseState.state === "relapse" ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : diseaseState.state === "remission" ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <Activity className="w-6 h-6" />
                )}
                <h2 className="text-lg font-bold">
                  {isEn ? diseaseState.label : diseaseState.labelHi}
                </h2>
              </div>
              <p className="text-sm opacity-90">
                {isEn ? diseaseState.description : diseaseState.descriptionHi}
              </p>
            </div>

            {/* Latest Readings Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Latest Dipstick */}
              {diseaseState.latestDipstick && (
                <div className={`rounded-xl p-3 border ${diseaseState.latestDipstick.bgColor} ${diseaseState.latestDipstick.color.replace("text-", "border-").replace("700", "200")}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <TestTube className="w-4 h-4" />
                    <span className="text-xs font-semibold">{isEn ? "Latest Dipstick" : "नवीनतम डिपस्टिक"}</span>
                  </div>
                  <p className="text-lg font-bold">
                    {isEn ? diseaseState.latestDipstick.label : diseaseState.latestDipstick.labelHi}
                  </p>
                  <p className="text-[10px] opacity-75">{diseaseState.latestDipstick.approximateProtein}</p>
                </div>
              )}

              {/* Latest BP */}
              {diseaseState.latestBP && (
                <div className={`rounded-xl p-3 border ${diseaseState.latestBP.bgColor} ${diseaseState.latestBP.color.replace("text-", "border-").replace("700", "200")}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Heart className="w-4 h-4" />
                    <span className="text-xs font-semibold">{isEn ? "Latest BP" : "नवीनतम BP"}</span>
                  </div>
                  <p className="text-lg font-bold">
                    {isEn ? diseaseState.latestBP.label : diseaseState.latestBP.labelHi}
                  </p>
                  <p className="text-[10px] opacity-75">
                    {isEn ? "Sys" : "सिस"}: {diseaseState.latestBP.systolicPercentile ?? "-"}%ile | {isEn ? "Dia" : "डाय"}: {diseaseState.latestBP.diastolicPercentile ?? "-"}%ile
                  </p>
                </div>
              )}
            </div>

            {/* Risk Score */}
            <div className={`rounded-2xl p-4 border-2 ${getRiskColor(predictions.relapseRiskLevel)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  <span className="text-sm font-bold">{isEn ? "Relapse Risk Score" : "रिलैप्स जोखिम स्कोर"}</span>
                </div>
                <span className="text-2xl font-bold">{predictions.relapseRiskScore}%</span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all ${
                    predictions.relapseRiskLevel === "low" ? "bg-emerald-500" :
                    predictions.relapseRiskLevel === "moderate" ? "bg-amber-500" :
                    predictions.relapseRiskLevel === "high" ? "bg-orange-500" : "bg-red-500"
                  }`}
                  style={{ width: `${predictions.relapseRiskScore}%` }}
                />
              </div>
              <p className="text-xs opacity-80">
                {isEn ? predictions.predictedOutcome : predictions.predictedOutcomeHi}
              </p>
            </div>

            {/* Trends Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-xl p-3 border border-border">
                <span className="text-xs text-muted-foreground">{isEn ? "Protein Trend" : "प्रोटीन रुझान"}</span>
                <div className="flex items-center gap-2 mt-1">
                  {predictions.proteinTrend === "improving" ? (
                    <TrendingDown className="w-5 h-5 text-emerald-500" />
                  ) : predictions.proteinTrend === "worsening" ? (
                    <TrendingUp className="w-5 h-5 text-red-500" />
                  ) : (
                    <Minus className="w-5 h-5 text-blue-500" />
                  )}
                  <span className="text-sm font-bold text-foreground capitalize">
                    {predictions.proteinTrend === "insufficient-data" ? (isEn ? "Need more data" : "अधिक डेटा चाहिए") : predictions.proteinTrend}
                  </span>
                </div>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border">
                <span className="text-xs text-muted-foreground">{isEn ? "BP Trend" : "BP रुझान"}</span>
                <div className="flex items-center gap-2 mt-1">
                  {predictions.bpTrend === "falling" ? (
                    <ArrowDown className="w-5 h-5 text-emerald-500" />
                  ) : predictions.bpTrend === "rising" ? (
                    <ArrowUp className="w-5 h-5 text-red-500" />
                  ) : (
                    <Minus className="w-5 h-5 text-blue-500" />
                  )}
                  <span className="text-sm font-bold text-foreground capitalize">
                    {predictions.bpTrend === "insufficient-data" ? (isEn ? "Need more data" : "अधिक डेटा चाहिए") : predictions.bpTrend}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* BP TAB */}
        {activeTab === "bp" && (
          <>
            {/* BP Classification */}
            {diseaseState.latestBP && (
              <div className={`rounded-2xl p-4 border-2 ${diseaseState.latestBP.bgColor} ${diseaseState.latestBP.color.replace("text-", "border-").replace("700", "200")}`}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  {isEn ? "BP Classification (AAP 2017)" : "BP वर्गीकरण (AAP 2017)"}
                </h3>
                <p className="text-xl font-bold mb-1">
                  {isEn ? diseaseState.latestBP.label : diseaseState.latestBP.labelHi}
                </p>
                <p className="text-sm opacity-90 mb-3">
                  {isEn ? diseaseState.latestBP.description : diseaseState.latestBP.descriptionHi}
                </p>
                <div className="bg-white/50 rounded-xl p-3">
                  <p className="text-xs font-semibold mb-1">{isEn ? "Recommendation:" : "सिफारिश:"}</p>
                  <p className="text-xs opacity-80">
                    {isEn ? diseaseState.latestBP.recommendation : diseaseState.latestBP.recommendationHi}
                  </p>
                </div>
              </div>
            )}

            {/* BP History Chart */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isEn ? "BP History" : "BP इतिहास"} ({filteredBP.length} {isEn ? "readings" : "रीडिंग"})
              </h3>
              {filteredBP.length > 0 ? (
                <div className="space-y-2">
                  {filteredBP.map((entry, i) => {
                    const bp = entry.bp!
                    const classification = classifyBP(bp.systolic, bp.diastolic, patientProfile.age, patientProfile.sex, patientProfile.height)
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-foreground">
                            {new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{bp.systolic}/{bp.diastolic}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${classification.bgColor} ${classification.color}`}>
                            {isEn ? classification.label.split(" ").slice(0, 2).join(" ") : classification.labelHi}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isEn ? "No BP data in this period" : "इस अवधि में कोई BP डेटा नहीं"}
                </p>
              )}
            </div>

            {/* BP Nomogram Reference */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isEn ? "BP Thresholds for This Patient" : "इस रोगी के लिए BP सीमाएं"}
              </h3>
              {patientProfile.age >= 1 && patientProfile.sex && patientProfile.sex !== "other" ? (
                <div className="space-y-2">
                  {(() => {
                    const sexKey = patientProfile.sex === "male" ? "male" : "female"
                    const ageIdx = Math.min(Math.max(Math.floor(patientProfile.age), 1), 18)
                    const sys90 = [0, 98, 100, 101, 103, 105, 106, 108, 109, 111, 113, 115, 118, 121, 124, 127, 130, 133, 136]
                    const dia90 = [0, 52, 54, 56, 58, 60, 62, 64, 65, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84]
                    const sys95 = [0, 101, 103, 104, 106, 108, 110, 111, 113, 115, 117, 119, 122, 126, 128, 131, 134, 136, 140]
                    const dia95 = [0, 54, 56, 58, 60, 63, 65, 67, 68, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87]
                    const rows = [
                      { label: isEn ? "Normal" : "सामान्य", sys: `< ${sexKey === "male" ? sys90[ageIdx] : sys90[ageIdx]}`, dia: `< ${sexKey === "male" ? dia90[ageIdx] : dia90[ageIdx]}`, color: "bg-emerald-50 text-emerald-700" },
                      { label: isEn ? "Elevated" : "बढ़ा हुआ", sys: `${sexKey === "male" ? sys90[ageIdx] : sys90[ageIdx]}-${sexKey === "male" ? (sys95[ageIdx] - 1) : (sys95[ageIdx] - 1)}`, dia: `${sexKey === "male" ? dia90[ageIdx] : dia90[ageIdx]}-${sexKey === "male" ? (dia95[ageIdx] - 1) : (dia95[ageIdx] - 1)}`, color: "bg-amber-50 text-amber-700" },
                      { label: isEn ? "Stage 1 HTN" : "स्टेज 1", sys: `${sexKey === "male" ? sys95[ageIdx] : sys95[ageIdx]}-${sexKey === "male" ? (sys95[ageIdx] + 11) : (sys95[ageIdx] + 11)}`, dia: `${sexKey === "male" ? dia95[ageIdx] : dia95[ageIdx]}-${sexKey === "male" ? (dia95[ageIdx] + 11) : (dia95[ageIdx] + 11)}`, color: "bg-orange-50 text-orange-700" },
                      { label: isEn ? "Stage 2 HTN" : "स्टेज 2", sys: `>= ${Math.min(sexKey === "male" ? sys95[ageIdx] + 12 : sys95[ageIdx] + 12, 140)}`, dia: `>= ${Math.min(sexKey === "male" ? dia95[ageIdx] + 12 : dia95[ageIdx] + 12, 90)}`, color: "bg-red-50 text-red-700" },
                    ]
                    return (
                      <>
                        <div className="text-xs text-muted-foreground mb-2">
                          {isEn ? `Age: ${patientProfile.age}y | Sex: ${patientProfile.sex}` : `उम्र: ${patientProfile.age}वर्ष | लिंग: ${patientProfile.sex === "male" ? "पुरुष" : "महिला"}`}
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-[10px] font-semibold text-muted-foreground mb-1">
                          <span>{isEn ? "Category" : "श्रेणी"}</span>
                          <span className="text-center">SBP</span>
                          <span className="text-center">DBP</span>
                        </div>
                        {rows.map((row) => (
                          <div key={row.label} className={`grid grid-cols-3 gap-1 rounded-lg p-2 text-xs font-medium ${row.color}`}>
                            <span>{row.label}</span>
                            <span className="text-center">{row.sys}</span>
                            <span className="text-center">{row.dia}</span>
                          </div>
                        ))}
                      </>
                    )
                  })()}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{isEn ? "Age and sex required for thresholds" : "सीमाओं के लिए उम्र और लिंग आवश्यक"}</p>
              )}
            </div>
          </>
        )}

        {/* PROTEIN TAB */}
        {activeTab === "protein" && (
          <>
            {/* Latest Result Classification */}
            {diseaseState.latestDipstick && (
              <div className={`rounded-2xl p-4 border-2 ${diseaseState.latestDipstick.bgColor} ${diseaseState.latestDipstick.color.replace("text-", "border-").replace("700", "200")}`}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <TestTube className="w-4 h-4" />
                  {isEn ? "Latest Dipstick Classification" : "नवीनतम डिपस्टिक वर्गीकरण"}
                </h3>
                <p className="text-xl font-bold mb-1">
                  {isEn ? diseaseState.latestDipstick.label : diseaseState.latestDipstick.labelHi}
                </p>
                <p className="text-sm opacity-90 mb-2">
                  {isEn ? diseaseState.latestDipstick.description : diseaseState.latestDipstick.descriptionHi}
                </p>
                <div className="bg-white/50 rounded-xl p-3 mb-2">
                  <p className="text-xs font-semibold mb-1">{isEn ? "Approximate Protein:" : "अनुमानित प्रोटीन:"}</p>
                  <p className="text-sm font-bold">{diseaseState.latestDipstick.approximateProtein}</p>
                </div>
                <div className="bg-white/50 rounded-xl p-3">
                  <p className="text-xs font-semibold mb-1">{isEn ? "Recommendation:" : "सिफारिश:"}</p>
                  <p className="text-xs opacity-80">
                    {isEn ? diseaseState.latestDipstick.recommendation : diseaseState.latestDipstick.recommendationHi}
                  </p>
                </div>
              </div>
            )}

            {/* Protein History Chart (simple bar chart) */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isEn ? "Protein Trend" : "प्रोटीन रुझान"} ({filteredTests.length} {isEn ? "tests" : "परीक्षण"})
              </h3>
              {filteredTests.length > 0 ? (
                <>
                  {/* Simple bar visualization */}
                  <div className="flex items-end gap-1 h-32 mb-3">
                    {filteredTests.slice(-30).map((test, i) => {
                      const height = ((proteinValue[test.result] ?? 0) / 5) * 100
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" title={`${test.date}: ${test.result}`}>
                          <div
                            className={`w-full rounded-t ${getProteinBarColor(test.result)} min-h-[4px]`}
                            style={{ height: `${Math.max(height, 5)}%` }}
                          />
                        </div>
                      )
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400" />{isEn ? "Neg/Trace" : "नकारात्मक/ट्रेस"}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-400" />1+</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400" />2+</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-orange-500" />3+</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500" />4+</span>
                  </div>
                  {/* 3+ threshold line note */}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {isEn
                      ? "Relapse threshold: 3+ or 4+ for 3 consecutive days"
                      : "रिलैप्स सीमा: लगातार 3 दिन 3+ या 4+"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isEn ? "No protein data in this period" : "इस अवधि में कोई प्रोटीन डेटा नहीं"}
                </p>
              )}
            </div>

            {/* Consecutive day counts */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-xl p-3 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{diseaseState.consecutivePositiveDays}</p>
                <p className="text-xs text-muted-foreground">{isEn ? "Consecutive 3+/4+ days" : "लगातार 3+/4+ दिन"}</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{diseaseState.consecutiveNegativeDays}</p>
                <p className="text-xs text-muted-foreground">{isEn ? "Consecutive Neg/Trace days" : "लगातार नकारात्मक/ट्रेस दिन"}</p>
              </div>
            </div>

            {/* Dipstick Reference */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isEn ? "Dipstick Reference Guide" : "डिपस्टिक संदर्भ गाइड"}
              </h3>
              {(["negative", "trace", "1+", "2+", "3+", "4+"] as const).map((result) => {
                const cls = classifyDipstick(result)
                return (
                  <div key={result} className={`flex items-center justify-between py-2 border-b border-border last:border-0`}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${cls.bgColor} ${cls.color}`}>{result}</span>
                      <span className="text-xs text-muted-foreground">{cls.approximateProtein}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {cls.isNephroticRange ? (isEn ? "Nephrotic" : "नेफ्रोटिक") : (isEn ? cls.category : cls.labelHi)}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* PREDICT TAB */}
        {activeTab === "predict" && (
          <>
            {/* Risk Score */}
            <div className={`rounded-2xl p-5 border-2 ${getRiskColor(predictions.relapseRiskLevel)}`}>
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-6 h-6" />
                <div>
                  <h3 className="text-sm font-bold">{isEn ? "AI-Powered Relapse Risk" : "AI संचालित रिलैप्स जोखिम"}</h3>
                  <p className="text-xs opacity-75">{isEn ? "Based on your health history" : "आपके स्वास्थ्य इतिहास पर आधारित"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="text-4xl font-bold">{predictions.relapseRiskScore}%</div>
                <div className="flex-1">
                  <div className="w-full bg-white/50 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        predictions.relapseRiskLevel === "low" ? "bg-emerald-500" :
                        predictions.relapseRiskLevel === "moderate" ? "bg-amber-500" :
                        predictions.relapseRiskLevel === "high" ? "bg-orange-500" : "bg-red-500"
                      }`}
                      style={{ width: `${predictions.relapseRiskScore}%` }}
                    />
                  </div>
                  <p className="text-xs mt-1 capitalize font-medium">
                    {predictions.relapseRiskLevel.replace("-", " ")} {isEn ? "Risk" : "जोखिम"}
                  </p>
                </div>
              </div>
              <p className="text-sm">
                {isEn ? predictions.predictedOutcome : predictions.predictedOutcomeHi}
              </p>
            </div>

            {/* Contributing Factors */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isEn ? "Contributing Factors" : "योगदान करने वाले कारक"}
              </h3>
              {predictions.factors.length > 0 ? (
                <div className="space-y-2">
                  {predictions.factors.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        f.impact === "positive" ? "bg-emerald-100" :
                        f.impact === "negative" ? "bg-red-100" : "bg-muted"
                      }`}>
                        {f.impact === "positive" ? (
                          <TrendingDown className="w-3 h-3 text-emerald-600" />
                        ) : f.impact === "negative" ? (
                          <TrendingUp className="w-3 h-3 text-red-600" />
                        ) : (
                          <Minus className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-foreground">{isEn ? f.factor : f.factorHi}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isEn ? "Not enough data for factor analysis yet." : "अभी कारक विश्लेषण के लिए पर्याप्त डेटा नहीं।"}
                </p>
              )}
            </div>

            {/* Adherence Impact */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {isEn ? "Adherence Impact" : "अनुपालन प्रभाव"}
              </h3>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-lg font-bold text-foreground">{compliance.overallScore}%</span>
                <span className="text-xs text-muted-foreground">{isEn ? "compliance score" : "अनुपालन स्कोर"}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isEn ? predictions.adherenceImpact : predictions.adherenceImpactHi}
              </p>
            </div>
          </>
        )}
      </div>

      <FloatingAssistant />
    </div>
  )
}
