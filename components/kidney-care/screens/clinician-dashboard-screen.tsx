"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { useApp, getTranslations } from "@/lib/app-context"
import { analyzeRelapseStatus, generateAlerts, getStatusSummary } from "@/lib/relapse-detection"
import { calculateComplianceMetrics, getGradeInfo } from "@/lib/compliance-tracking"
import { calculateAllMetrics, formatPercentile, getPercentileColor } from "@/lib/medical-calculations"
import { TopHeaderBar } from "../top-header-bar"
import {
  ChevronLeft,
  User,
  TestTube,
  Pill,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Scale,
  Ruler,
  Eye,
  Sparkles,
  Clock,
  Target,
  BarChart3,
  Stethoscope,
  Delete,
} from "lucide-react"

export function ClinicianDashboardScreen() {
  const {
    language,
    setCurrentScreen,
    patientProfile,
    urineTests,
    medications,
    symptomEntries,
    dailyCheckIns,
    healthData,
  } = useApp()
  const t = getTranslations(language)
  const [activeTab, setActiveTab] = useState<"overview" | "labs" | "meds" | "timeline">("overview")

  const isEn = language === "en" || !["hi", "bn", "ta", "pa"].includes(language)

  // PIN gate state
  const [pinState, setPinState] = useState<'loading' | 'create' | 'confirm' | 'enter' | 'unlocked'>('loading')
  const [pinInput, setPinInput] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinError, setPinError] = useState('')
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('clinicianPin') : null
    setPinState(stored ? 'enter' : 'create')
  }, [])

  const resetLockTimer = useCallback(() => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
    lockTimerRef.current = setTimeout(() => {
      setPinState('enter')
      setPinInput('')
      setPinError('')
    }, 30000)
  }, [])

  useEffect(() => {
    if (pinState === 'unlocked') resetLockTimer()
    return () => { if (lockTimerRef.current) clearTimeout(lockTimerRef.current) }
  }, [pinState, resetLockTimer])

  const handlePinKey = useCallback((key: string) => {
    if (key === 'back') {
      setPinInput(prev => prev.slice(0, -1))
      setPinError('')
      return
    }

    const next = pinInput + key

    if (pinState === 'create') {
      setPinInput(next)
      if (next.length === 4) {
        setPinConfirm(next)
        setPinInput('')
        setPinError('')
        setPinState('confirm')
      }
    } else if (pinState === 'confirm') {
      setPinInput(next)
      if (next.length === 4) {
        if (next === pinConfirm) {
          localStorage.setItem('clinicianPin', next)
          setPinInput('')
          setPinError('')
          setPinState('unlocked')
        } else {
          setPinInput('')
          setPinError(isEn ? 'PINs do not match. Try again.' : 'PIN मेल नहीं खाता। पुनः प्रयास करें।')
          setPinState('create')
          setPinConfirm('')
        }
      }
    } else if (pinState === 'enter') {
      setPinInput(next)
      if (next.length === 4) {
        const stored = localStorage.getItem('clinicianPin')
        if (next === stored) {
          setPinInput('')
          setPinError('')
          setPinState('unlocked')
        } else {
          setPinInput('')
          setPinError(isEn ? 'Incorrect PIN. Please try again.' : 'गलत PIN। पुनः प्रयास करें।')
        }
      }
    }
  }, [pinInput, pinState, pinConfirm, isEn])

  const renderPinGate = () => {
    const title =
      pinState === 'create'
        ? (isEn ? 'Set Clinician PIN' : 'क्लीनिशियन PIN सेट करें')
        : pinState === 'confirm'
        ? (isEn ? 'Confirm PIN' : 'PIN की पुष्टि करें')
        : (isEn ? 'Enter PIN' : 'PIN दर्ज करें')

    const subtitle =
      pinState === 'create'
        ? (isEn ? 'Choose a 4-digit PIN to protect this dashboard' : 'डैशबोर्ड सुरक्षित करने के लिए 4-अंकीय PIN चुनें')
        : pinState === 'confirm'
        ? (isEn ? 'Enter the same PIN again to confirm' : 'पुष्टि के लिए वही PIN दोबारा दर्ज करें')
        : (isEn ? 'Enter your PIN to access the dashboard' : 'डैशबोर्ड एक्सेस करने के लिए PIN दर्ज करें')

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-xs">
          {/* Back button */}
          <button
            type="button"
            onClick={() => setCurrentScreen("dashboard")}
            className="mb-8 w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Icon + Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>

          {/* PIN dots */}
          <div className="flex justify-center gap-4 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all ${
                  i < pinInput.length ? 'bg-primary' : 'bg-muted border-2 border-border'
                }`}
              />
            ))}
          </div>

          {/* Error */}
          {pinError && (
            <p className="text-sm text-red-600 text-center mb-4">{pinError}</p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {['1','2','3','4','5','6','7','8','9'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => handlePinKey(k)}
                style={{ width: '72px', height: '72px' }}
                className="mx-auto rounded-2xl bg-card border border-border flex items-center justify-center text-2xl font-bold text-foreground active:bg-muted transition-colors"
              >
                {k}
              </button>
            ))}
            {/* Bottom row: empty, 0, backspace */}
            <div style={{ width: '72px', height: '72px' }} className="mx-auto" />
            <button
              type="button"
              onClick={() => handlePinKey('0')}
              style={{ width: '72px', height: '72px' }}
              className="mx-auto rounded-2xl bg-card border border-border flex items-center justify-center text-2xl font-bold text-foreground active:bg-muted transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handlePinKey('back')}
              style={{ width: '72px', height: '72px' }}
              className="mx-auto rounded-2xl bg-muted flex items-center justify-center active:bg-border transition-colors"
            >
              <Delete className="w-6 h-6 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Calculate all clinical data
  const relapseStatus = useMemo(() => analyzeRelapseStatus(urineTests), [urineTests])
  const statusSummary = getStatusSummary(relapseStatus, language)

  const alerts = useMemo(
    () =>
      generateAlerts(
        urineTests,
        symptomEntries,
        healthData,
        dailyCheckIns.length,
        30
      ),
    [urineTests, symptomEntries, healthData, dailyCheckIns]
  )

  const compliance = useMemo(
    () => calculateComplianceMetrics(dailyCheckIns, urineTests, medications, 30),
    [dailyCheckIns, urineTests, medications]
  )

  const gradeInfo = getGradeInfo(compliance.overallGrade, language)

  const latestHealthData = healthData.length > 0 ? healthData[healthData.length - 1] : null
  const vitals = calculateAllMetrics({
    weight: patientProfile.weight,
    height: patientProfile.height,
    age: patientProfile.age,
    sex: patientProfile.sex,
    systolicBP: latestHealthData?.bp?.systolic,
    diastolicBP: latestHealthData?.bp?.diastolic,
  })

  // Recent tests (last 14)
  const recentTests = useMemo(() => {
    return [...urineTests]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 14)
  }, [urineTests])

  // Active medications
  const activeMeds = medications.filter((m) => m.isActive)

  // Generate clinical summary CSV for export
  const generateReport = () => {
    const lines = [
      "CLINICAL REPORT - KidneyCare",
      "===========================",
      "",
      `Patient: ${patientProfile.name}`,
      `Age: ${patientProfile.age} years | Sex: ${patientProfile.sex}`,
      `Diagnosis: ${patientProfile.diagnosis}`,
      `Diagnosis Date: ${patientProfile.diagnosisDate || "N/A"}`,
      `Doctor: ${patientProfile.doctorName || "N/A"}`,
      `Hospital: ${patientProfile.hospitalName || "N/A"}`,
      "",
      "ANTHROPOMETRICS",
      `Weight: ${patientProfile.weight} kg (${formatPercentile(vitals.weightPercentile)} percentile)`,
      `Height: ${patientProfile.height} cm (${formatPercentile(vitals.heightPercentile)} percentile)`,
      `BMI: ${vitals.bmi ?? "N/A"} (${vitals.bmiCategory})`,
      `BSA: ${vitals.bsa ?? "N/A"} m2`,
      latestHealthData?.bp
        ? `BP: ${latestHealthData.bp.systolic}/${latestHealthData.bp.diastolic} (${vitals.bpCategory})`
        : "BP: N/A",
      "",
      "DISEASE STATUS",
      `Current Status: ${relapseStatus.status.toUpperCase()}`,
      `Consecutive Positive Days: ${relapseStatus.consecutivePositiveDays}`,
      `Consecutive Negative Days: ${relapseStatus.consecutiveNegativeDays}`,
      `Total Relapses: ${relapseStatus.relapseCount}`,
      `Trend: ${relapseStatus.trend}`,
      `Last Test: ${relapseStatus.lastTestDate || "N/A"} (${relapseStatus.daysSinceLastTest} days ago)`,
      "",
      "COMPLIANCE (Last 30 Days)",
      `Overall Score: ${compliance.overallScore}% (${compliance.overallGrade})`,
      `Urine Testing: ${compliance.urineTestCompliance.percentage}% (${compliance.urineTestCompliance.completedDays}/${compliance.urineTestCompliance.totalDays} days)`,
      `Medication: ${compliance.medicationCompliance.percentage}% (${compliance.medicationCompliance.completedDays}/${compliance.medicationCompliance.totalDays} days)`,
      `Current Urine Test Streak: ${compliance.urineTestCompliance.currentStreak} days`,
      "",
      "ACTIVE ALERTS",
      ...alerts.map((a) => `[${a.severity.toUpperCase()}] ${a.title}: ${a.message}`),
      "",
      "MEDICATIONS",
      ...activeMeds.map(
        (m) => `- ${m.name} ${m.dose} (${m.frequency}, ${m.route})`
      ),
      "",
      "URINE TEST HISTORY (Last 14)",
      "Date, Patient Reading, AI Reading, Final Result",
      ...recentTests.map(
        (t) =>
          `${t.date}, ${t.patientResult || "-"}, ${t.aiResult || "-"}, ${t.result}`
      ),
      "",
      `Report generated: ${new Date().toLocaleString()}`,
    ]

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `clinical-report-${patientProfile.name?.replace(/\s+/g, "-") || "patient"}-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Result color helper
  const getResultColor = (result: string | null | undefined) => {
    switch (result) {
      case "negative": return "bg-yellow-100 text-yellow-800"
      case "trace": return "bg-yellow-200 text-yellow-900"
      case "1+": return "bg-green-100 text-green-800"
      case "2+": return "bg-green-200 text-green-900"
      case "3+": return "bg-orange-200 text-orange-900"
      case "4+": return "bg-red-200 text-red-900"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const trendIcons = {
    improving: TrendingDown,
    worsening: TrendingUp,
    stable: Minus,
    unknown: Activity,
  }
  const TrendIcon = trendIcons[relapseStatus.trend]

  // PIN gate early returns
  if (pinState === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-background" />
  }
  if (pinState !== 'unlocked') {
    return renderPinGate()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" onPointerDown={resetLockTimer}>
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
              <Stethoscope className="w-5 h-5 text-primary" />
              {isEn ? "Clinician Dashboard" : "चिकित्सक डैशबोर्ड"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {patientProfile.name} | {patientProfile.diagnosis}
            </p>
          </div>
          <button
            type="button"
            onClick={generateReport}
            className="h-10 px-3 rounded-xl bg-primary text-primary-foreground flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isEn ? "Export" : "निर्यात"}
            </span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {[
            { id: "overview", label: isEn ? "Overview" : "अवलोकन", icon: BarChart3 },
            { id: "labs", label: isEn ? "Lab Data" : "लैब डेटा", icon: TestTube },
            { id: "meds", label: isEn ? "Meds" : "दवाइयाँ", icon: Pill },
            { id: "timeline", label: isEn ? "Timeline" : "समयरेखा", icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-4">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            {/* Active Alerts */}
            {alerts.filter((a) => a.severity === "critical" || a.severity === "warning").length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isEn ? "Active Alerts" : "सक्रिय अलर्ट"}
                </h3>
                {alerts
                  .filter((a) => a.severity === "critical" || a.severity === "warning")
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className={`rounded-xl p-3 border-2 flex items-start gap-3 ${
                        alert.severity === "critical"
                          ? "bg-red-50 border-red-300"
                          : "bg-amber-50 border-amber-300"
                      }`}
                    >
                      <AlertTriangle
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          alert.severity === "critical"
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}
                      />
                      <div>
                        <p
                          className={`font-bold text-sm ${
                            alert.severity === "critical"
                              ? "text-red-900"
                              : "text-amber-900"
                          }`}
                        >
                          {isEn ? alert.title : alert.titleHi}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            alert.severity === "critical"
                              ? "text-red-800"
                              : "text-amber-800"
                          }`}
                        >
                          {isEn ? alert.message : alert.messageHi}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Disease Status + Compliance Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Disease Status */}
              <div
                className={`rounded-xl p-4 border ${
                  relapseStatus.status === "relapse"
                    ? "border-red-300 bg-red-50"
                    : relapseStatus.status === "remission"
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  {relapseStatus.status === "relapse" ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : relapseStatus.status === "remission" ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Activity className="w-4 h-4 text-amber-600" />
                  )}
                  <span className="text-xs font-semibold text-muted-foreground">
                    {isEn ? "Status" : "स्थिति"}
                  </span>
                </div>
                <p className={`text-lg font-bold ${statusSummary.color}`}>
                  {statusSummary.label}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendIcon className={`w-3.5 h-3.5 ${
                    relapseStatus.trend === "improving" ? "text-emerald-600"
                    : relapseStatus.trend === "worsening" ? "text-red-600"
                    : "text-blue-600"
                  }`} />
                  <span className="text-xs text-muted-foreground capitalize">
                    {relapseStatus.trend}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {relapseStatus.relapseCount} {isEn ? "total relapses" : "कुल रिलैप्स"}
                </p>
              </div>

              {/* Compliance */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {isEn ? "Compliance" : "अनुपालन"}
                  </span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {compliance.overallScore}%
                </p>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${gradeInfo.color} ${gradeInfo.bgColor}`}
                >
                  {gradeInfo.label}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {isEn ? "Streak:" : "स्ट्रीक:"}{" "}
                  {compliance.urineTestCompliance.currentStreak}d
                </p>
              </div>
            </div>

            {/* Vitals Summary */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isEn ? "Anthropometrics" : "शारीरिक माप"}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <Scale className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">
                    {patientProfile.weight || "-"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">kg</p>
                  {vitals.weightPercentile !== null && (
                    <p className={`text-[10px] font-medium ${getPercentileColor(vitals.weightPercentile)}`}>
                      {formatPercentile(vitals.weightPercentile)}
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <Ruler className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">
                    {patientProfile.height || "-"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">cm</p>
                  {vitals.heightPercentile !== null && (
                    <p className={`text-[10px] font-medium ${getPercentileColor(vitals.heightPercentile)}`}>
                      {formatPercentile(vitals.heightPercentile)}
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <Activity className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">
                    {vitals.bmi ?? "-"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">BMI</p>
                  <p className="text-[10px] text-muted-foreground">
                    {vitals.bmiCategory !== "-" ? vitals.bmiCategory : ""}
                  </p>
                </div>
                <div className="text-center">
                  <User className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">
                    {vitals.bsa ?? "-"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">BSA m2</p>
                </div>
              </div>
              {latestHealthData?.bp && (
                <div className="mt-3 flex items-center justify-between bg-muted/50 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span className="text-xs text-muted-foreground">BP</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {latestHealthData.bp.systolic}/{latestHealthData.bp.diastolic}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({vitals.bpCategory})
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Recent Protein Results */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isEn ? "Recent Protein Results" : "हाल के प्रोटीन परिणाम"}
              </h3>
              {recentTests.length > 0 ? (
                <div className="space-y-2">
                  {recentTests.slice(0, 7).map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-foreground">
                          {new Date(test.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.patientResult && (
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-purple-500" />
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getResultColor(test.patientResult)}`}
                            >
                              {test.patientResult.toUpperCase()}
                            </span>
                          </div>
                        )}
                        {test.aiResult && (
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getResultColor(test.aiResult)}`}
                            >
                              {test.aiResult.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${getResultColor(test.result)}`}
                        >
                          {test.result.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isEn ? "No test data yet" : "अभी तक कोई परीक्षण डेटा नहीं"}
                </p>
              )}
            </div>
          </>
        )}

        {/* LABS TAB */}
        {activeTab === "labs" && (
          <>
            {/* Protein Level Chart */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <TestTube className="w-4 h-4 text-amber-500" />
                {isEn ? "Protein Level History" : "प्रोटीन स्तर इतिहास"}
              </h3>
              {recentTests.length > 0 ? (
                <>
                  <div className="flex items-end gap-1 h-40 overflow-x-auto pb-6">
                    {[...recentTests].reverse().map((test, i) => {
                      const resultValues: Record<string, number> = {
                        negative: 0, trace: 1, "1+": 2, "2+": 3, "3+": 4, "4+": 5,
                      }
                      const val = resultValues[test.result] ?? 0
                      const height = `${((val + 1) / 6) * 100}%`
                      const colors = [
                        "bg-yellow-400", "bg-yellow-500", "bg-green-400",
                        "bg-green-500", "bg-orange-400", "bg-red-500",
                      ]

                      return (
                        <div
                          key={i}
                          className="flex flex-col items-center flex-shrink-0"
                          style={{ width: "28px" }}
                        >
                          <div className="h-28 flex items-end">
                            <div
                              className={`w-5 rounded-t ${colors[val]}`}
                              style={{ height }}
                              title={`${test.date}: ${test.result}`}
                            />
                          </div>
                          <span className="text-[8px] text-muted-foreground mt-1 rotate-45 origin-left">
                            {new Date(test.date).getDate()}/{new Date(test.date).getMonth() + 1}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {/* 2+ threshold line indicator */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <div className="flex-1 border-t-2 border-dashed border-red-300" />
                    <span className="text-red-500 font-medium">
                      {isEn ? "Relapse threshold (3+)" : "रिलैप्स सीमा (3+)"}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {isEn ? "No lab data available" : "कोई लैब डेटा उपलब्ध नहीं"}
                </p>
              )}
            </div>

            {/* Full test history */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 bg-muted/50 border-b border-border">
                <h3 className="text-xs font-semibold text-foreground uppercase">
                  {isEn ? "Complete Test Log" : "पूर्ण परीक्षण लॉग"}
                </h3>
              </div>
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {recentTests.map((test) => (
                  <div key={test.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(test.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${getResultColor(test.result)}`}
                      >
                        {test.result.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-purple-500" />
                        <span className="text-muted-foreground">Patient:</span>
                        <span className="font-medium text-foreground">
                          {test.patientResult?.toUpperCase() || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        <span className="text-muted-foreground">AI:</span>
                        <span className="font-medium text-foreground">
                          {test.aiResult?.toUpperCase() || "-"}
                        </span>
                      </div>
                      {test.manualResult && (
                        <span className="text-muted-foreground italic">Manual</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* MEDS TAB */}
        {activeTab === "meds" && (
          <>
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-500" />
                {isEn ? "Active Medications" : "सक्रिय दवाइयाँ"} ({activeMeds.length})
              </h3>
              {activeMeds.length > 0 ? (
                <div className="space-y-3">
                  {activeMeds.map((med) => (
                    <div
                      key={med.id}
                      className="bg-muted/50 rounded-lg p-3 border border-border"
                    >
                      <p className="font-bold text-sm text-foreground">{med.name}</p>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{med.dose}</span>
                        <span>{med.frequency}</span>
                        <span>{med.route}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isEn ? "Since:" : "से:"} {med.startDate || "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isEn ? "No active medications" : "कोई सक्रिय दवाई नहीं"}
                </p>
              )}
            </div>

            {/* Medication compliance */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isEn ? "Medication Compliance (30 days)" : "दवाई अनुपालन (30 दिन)"}
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg width={64} height={64} className="-rotate-90">
                    <circle cx={32} cy={32} r={26} fill="none" stroke="currentColor" strokeWidth={6} className="text-muted/30" />
                    <circle
                      cx={32}
                      cy={32}
                      r={26}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={6}
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={
                        2 * Math.PI * 26 -
                        (compliance.medicationCompliance.percentage / 100) *
                          2 *
                          Math.PI *
                          26
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-foreground">
                      {compliance.medicationCompliance.percentage}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {compliance.medicationCompliance.completedDays}/{compliance.medicationCompliance.totalDays}{" "}
                    {isEn ? "days completed" : "दिन पूरे"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isEn ? "Current streak:" : "वर्तमान स्ट्रीक:"}{" "}
                    {compliance.medicationCompliance.currentStreak} {isEn ? "days" : "दिन"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isEn ? "Recent Activity" : "हाल की गतिविधि"}
            </h3>

            {/* Build combined timeline */}
            {(() => {
              type TimelineEntry = {
                date: string
                type: string
                description: string
                icon: typeof TestTube
                color: string
              }

              const timeline: TimelineEntry[] = []

              // Urine tests
              urineTests.forEach((test) => {
                timeline.push({
                  date: test.date,
                  type: "urine",
                  description: `${isEn ? "Protein" : "प्रोटीन"}: ${test.result.toUpperCase()}${test.patientResult && test.aiResult ? ` (${isEn ? "Patient" : "रोगी"}: ${test.patientResult}, AI: ${test.aiResult})` : ""}`,
                  icon: TestTube,
                  color: "text-amber-500 bg-amber-100",
                })
              })

              // Symptom entries
              symptomEntries.forEach((entry) => {
                const symptoms = []
                if (entry.symptoms.swelling) symptoms.push(isEn ? "Swelling" : "सूजन")
                if (entry.symptoms.fever) symptoms.push(isEn ? "Fever" : "बुखार")
                if (entry.symptoms.vomiting) symptoms.push(isEn ? "Vomiting" : "उलटी")
                if (entry.symptoms.breathingDifficulty) symptoms.push(isEn ? "Breathing" : "सांस")

                timeline.push({
                  date: entry.date,
                  type: "symptom",
                  description: `${isEn ? "Feeling" : "महसूस"}: ${entry.feeling}${symptoms.length > 0 ? ` | ${symptoms.join(", ")}` : ""}`,
                  icon: Heart,
                  color: "text-rose-500 bg-rose-100",
                })
              })

              // Sort by date (newest first)
              timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

              return timeline.slice(0, 20).map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${entry.color}`}>
                      <entry.icon className="w-4 h-4" />
                    </div>
                    {i < timeline.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-foreground">{entry.description}</p>
                  </div>
                </div>
              ))
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
