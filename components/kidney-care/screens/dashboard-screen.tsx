"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useApp, getTranslations } from "@/lib/app-context"
import { FloatingAssistant } from "../floating-assistant"
import { TopHeaderBar } from "../top-header-bar"
import { PullToRefresh } from "../pull-to-refresh"
import { SettingsSidebar } from "../settings-sidebar"
import { calculateAllMetrics, formatPercentile, getPercentileColor, getBPCategoryColor } from "@/lib/medical-calculations"
import { analyzeRelapseStatus, generateAlerts } from "@/lib/relapse-detection"
import { calculateComplianceMetrics } from "@/lib/compliance-tracking"
import {
  HeartPulse,
  TestTube,
  Pill,
  ClipboardList,
  BookOpen,
  Sun,
  Moon,
  Sunset,
  Volume2,
  User,
  Activity,
  FileText,
  Play,
  Calendar,
  Scale,
  Ruler,
  Heart,
  TrendingUp,
  Edit3,
  ChevronRight,
  Stethoscope,
  Target,
  BarChart3,
} from "lucide-react"
import { AssistantAvatar } from "../assistant-avatar"
import { AlertBanner } from "../alert-banner"
import { RelapseStatusCard } from "../relapse-status-card"

// Voice language mapping
const voiceLanguageMap: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  pa: "pa-IN",
}

export function DashboardScreen() {
  const { 
    language, 
    setCurrentScreen, 
    patientProfile, 
    isVoiceEnabled, 
    medications, 
    dailyCheckIns,
    healthData,
    updatePatientProfile,
    urineTests,
    symptomEntries,
    refreshData,
  } = useApp()
  const t = getTranslations(language)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showWeightUpdate, setShowWeightUpdate] = useState(false)
  const [newWeight, setNewWeight] = useState("")

  // Check if daily check-in is done today
  const today = new Date().toISOString().split('T')[0]
  const todayCheckIn = dailyCheckIns.find(c => c.date === today)
  const hasDoneCheckInToday = todayCheckIn?.urineTestCompleted || todayCheckIn?.medicationCheckCompleted

  // Relapse detection and alerts
  const relapseStatus = analyzeRelapseStatus(urineTests)
  const clinicalAlerts = generateAlerts(urineTests, symptomEntries, healthData, dailyCheckIns.length, 30)
  const compliance = calculateComplianceMetrics(dailyCheckIns, urineTests, medications, 30)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  // Get latest BP from health data
  const latestHealthData = healthData.length > 0 ? healthData[healthData.length - 1] : null

  // Calculate all metrics
  const metrics = calculateAllMetrics({
    weight: patientProfile.weight,
    height: patientProfile.height,
    age: patientProfile.age,
    sex: patientProfile.sex,
    systolicBP: latestHealthData?.bp?.systolic,
    diastolicBP: latestHealthData?.bp?.diastolic
  })

  // Text-to-speech function
  const speak = useCallback((text: string) => {
    if (!isVoiceEnabled || typeof window === "undefined") return
    
    window.speechSynthesis?.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = voiceLanguageMap[language] || "en-IN"
    utterance.rate = 0.85
    utterance.pitch = 1
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    window.speechSynthesis?.speak(utterance)
  }, [isVoiceEnabled, language])

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) {
      return { text: t.greeting, icon: Sun }
    }
    if (hour < 17) {
      return {
        text:
          language === "en"
            ? "Good afternoon"
            : language === "hi"
              ? "नमस्ते"
              : language === "bn"
                ? "শুভ দুপুর"
                : language === "ta"
                  ? "மதிய வணக்கம்"
                  : "ਸ਼ੁਭ ਦੁਪਹਿਰ",
        icon: Sunset,
      }
    }
    return {
      text:
        language === "en"
          ? "Good evening"
          : language === "hi"
            ? "शुभ संध्या"
            : language === "bn"
              ? "শুভ সন্ধ্যা"
              : language === "ta"
                ? "மாலை வணக்கம்"
                : "ਸ਼ੁਭ ਸ਼ਾਮ",
      icon: Moon,
    }
  }

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  // Labels
  const labels = {
    en: {
      quickActions: 'Quick Actions',
      vitals: 'Your Vitals',
      bmi: 'BMI',
      bsa: 'BSA',
      weight: 'Weight',
      height: 'Height',
      bp: 'Blood Pressure',
      weightPct: 'Weight %ile',
      heightPct: 'Height %ile',
      updateWeight: 'Update Weight',
      save: 'Save',
      cancel: 'Cancel',
      kg: 'kg',
      cm: 'cm',
      viewAll: 'View All',
      startDailyCheck: 'Start Daily Health Check',
      dailyCheckComplete: 'Daily Check Complete',
      tapToDoAnother: 'Tap to do another check',
      urineTestMedsSymptoms: 'Urine test, medicines & symptoms',
      healthDiary: 'Health Diary',
      enterHealthData: 'Enter Health Data',
      weightBPOutput: 'Weight, BP, urine output',
      learn: 'Learn',
      learnAboutKidney: 'Learn about kidney care',
      needHelp: 'Need help? Tap to talk to me!',
      tapToListen: 'Tap to listen',
      years: 'yrs',
    },
    hi: {
      quickActions: 'त्वरित क्रियाएँ',
      vitals: 'आपके वाइटल्स',
      bmi: 'BMI',
      bsa: 'BSA',
      weight: 'वजन',
      height: 'ऊंचाई',
      bp: 'रक्तचाप',
      weightPct: 'वजन %ile',
      heightPct: 'ऊंचाई %ile',
      updateWeight: 'वजन अपडेट करें',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      kg: 'किलो',
      cm: 'सेमी',
      viewAll: 'सभी देखें',
      startDailyCheck: 'दैनिक स्वास्थ्य जांच शुरू करें',
      dailyCheckComplete: 'दैनिक जांच पूर्ण',
      tapToDoAnother: 'फिर से जांच करने के लिए टैप करें',
      urineTestMedsSymptoms: 'मूत्र परीक्षण, दवाइयाँ और लक्षण',
      healthDiary: 'स्वास्थ्य डायरी',
      enterHealthData: 'स्वास्थ्य डेटा दर्ज करें',
      weightBPOutput: 'वजन, BP, मूत्र उत्पादन',
      learn: 'सीखें',
      learnAboutKidney: 'किडनी केयर के बारे में सीखें',
      needHelp: 'मदद चाहिए? मुझसे बात करने के लिए टैप करें!',
      tapToListen: 'सुनने के लिए टैप करें',
      years: 'वर्ष',
    }
  }

  const l = labels[language] || labels.en

  // Handle weight update
  const handleWeightUpdate = () => {
    const weight = parseFloat(newWeight)
    if (weight > 0) {
      updatePatientProfile({ weight })
      setShowWeightUpdate(false)
      setNewWeight("")
      if (isVoiceEnabled) {
        speak(language === 'en' ? `Weight updated to ${weight} kg` : `वजन ${weight} किलो अपडेट किया गया`)
      }
    }
  }

  // Speak greeting on mount if voice enabled
  useEffect(() => {
    if (isVoiceEnabled && patientProfile.name) {
      const timer = setTimeout(() => {
        const name = patientProfile.name.split(' ')[0]
        const msg = language === "en"
          ? `${greeting.text} ${name}. ${hasDoneCheckInToday ? "Your daily check is complete." : "Time for your daily health check."}`
          : `${greeting.text} ${name}। ${hasDoneCheckInToday ? "आपकी दैनिक जांच पूरी हो गई है।" : "आपकी दैनिक स्वास्थ्य जांच का समय है।"}`
        speak(msg)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const todayStr = new Date().toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", {
    weekday: "short", day: "numeric", month: "short"
  })

  const urineTestDoneToday = todayCheckIn?.urineTestCompleted
  const medsDoneToday = todayCheckIn?.medicationCheckCompleted
  const lastTest = urineTests.length > 0 ? urineTests[urineTests.length - 1] : null
  const daysSinceLastTest = lastTest
    ? Math.floor((Date.now() - new Date(lastTest.date).getTime()) / 86400000)
    : null

  return (
  <PullToRefresh onRefresh={refreshData} className="min-h-screen">
  <div className="min-h-screen flex flex-col bg-background">
  {/* Top Header Bar */}
  <TopHeaderBar onMenuClick={() => setShowSidebar(true)} />

  {/* Settings Sidebar */}
  <SettingsSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />

  {/* Weight Update Modal */}
  {showWeightUpdate && (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-5">
      <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          {l.updateWeight}
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="number"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder={String(patientProfile.weight || '')}
            className="flex-1 px-4 py-3 text-xl text-center font-bold bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <span className="text-lg text-muted-foreground font-medium">{l.kg}</span>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setShowWeightUpdate(false); setNewWeight("") }}
            className="flex-1 py-3 text-base font-medium bg-muted text-muted-foreground rounded-xl active:scale-95 transition-all"
          >
            {l.cancel}
          </button>
          <button
            type="button"
            onClick={handleWeightUpdate}
            className="flex-1 py-3 text-base font-medium bg-primary text-primary-foreground rounded-xl active:scale-95 transition-all"
          >
            {l.save}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Content */}
  <div className="flex-1 flex flex-col pb-24 safe-bottom overflow-y-auto">

    {/* ── HERO CARD ── */}
    <div className="px-4 pt-3 pb-2">
      <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-[oklch(0.44_0.22_275)] to-[oklch(0.35_0.20_300)] p-5 card-shadow">
        {/* Greeting row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GreetingIcon className="w-4 h-4 text-white/70" />
              <p className="text-sm text-white/70 font-medium">{greeting.text} · {todayStr}</p>
            </div>
            <h1 className="text-3xl font-extrabold text-white leading-tight">
              {patientProfile.name ? patientProfile.name.split(' ')[0] : 'Hello'}
            </h1>
            {patientProfile.diagnosis && (
              <p className="text-sm text-white/60 mt-0.5">{patientProfile.diagnosis}</p>
            )}
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
            <HeartPulse className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Status chips row */}
        <div className="flex gap-2 flex-wrap">
          {/* Remission status */}
          {urineTests.length > 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              relapseStatus.currentPhase === 'remission'
                ? 'bg-emerald-400/25 text-emerald-100'
                : relapseStatus.currentPhase === 'relapse'
                ? 'bg-rose-400/25 text-rose-100'
                : 'bg-white/15 text-white/80'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                relapseStatus.currentPhase === 'remission' ? 'bg-emerald-300' :
                relapseStatus.currentPhase === 'relapse' ? 'bg-rose-300' : 'bg-white/60'
              }`} />
              {relapseStatus.currentPhase === 'remission'
                ? (language === 'hi' ? 'रोग-मुक्त' : 'Remission')
                : relapseStatus.currentPhase === 'relapse'
                ? (language === 'hi' ? 'दोबारा बीमारी' : 'Relapse')
                : (language === 'hi' ? 'निगरानी में' : 'Monitoring')}
            </div>
          )}
          {/* Compliance */}
          {compliance.overallScore > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white/80 text-xs font-semibold">
              <Target className="w-3 h-3" />
              {compliance.overallScore}% {language === 'hi' ? 'अनुपालन' : 'Compliant'}
            </div>
          )}
          {/* Last test */}
          {daysSinceLastTest !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white/80 text-xs font-semibold">
              <TestTube className="w-3 h-3" />
              {daysSinceLastTest === 0
                ? (language === 'hi' ? 'आज जांच' : 'Tested today')
                : `${daysSinceLastTest}d ${language === 'hi' ? 'पहले' : 'ago'}`}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ── CLINICAL ALERTS ── */}
    {clinicalAlerts.length > 0 && (
      <div className="px-4 mb-1">
        <AlertBanner
          alerts={clinicalAlerts.map(a => ({ ...a, dismissed: dismissedAlerts.has(a.id) }))}
          language={language}
          onDismiss={(id) => setDismissedAlerts(prev => new Set([...prev, id]))}
        />
      </div>
    )}

    {/* ── TODAY'S TASKS ── */}
    <div className="px-4 mt-3 mb-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
          {language === 'hi' ? 'आज के काम' : "Today's Tasks"}
        </h2>
        <button
          type="button"
          onClick={() => setCurrentScreen("daily-health-log")}
          className="text-xs font-semibold text-primary flex items-center gap-0.5"
        >
          {language === 'hi' ? 'सभी देखें' : 'View all'}
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {/* Urine Test */}
        <button
          type="button"
          onClick={() => { if (isVoiceEnabled) speak(t.doUrineTest); setCurrentScreen("urine-test") }}
          className={`rounded-2xl p-3 border-2 text-left flex flex-col gap-2 active:scale-[0.97] transition-all card-shadow ${
            urineTestDoneToday
              ? 'bg-amber-50 border-amber-200'
              : 'card-amber border-amber-200'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <TestTube className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-900 leading-tight">
              {language === 'hi' ? 'मूत्र जांच' : 'Urine Test'}
            </p>
            <p className="text-[10px] text-amber-700 mt-0.5 font-medium">
              {urineTestDoneToday ? '✓ Done' : 'Pending'}
            </p>
          </div>
        </button>

        {/* Medications */}
        <button
          type="button"
          onClick={() => { if (isVoiceEnabled) speak(t.checkMedicines); setCurrentScreen("medications") }}
          className={`rounded-2xl p-3 border-2 text-left flex flex-col gap-2 active:scale-[0.97] transition-all card-shadow ${
            medsDoneToday
              ? 'bg-teal-50 border-teal-200'
              : 'card-teal border-teal-200'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <Pill className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <p className="text-xs font-bold text-teal-900 leading-tight">
              {language === 'hi' ? 'दवाइयाँ' : 'Medicines'}
            </p>
            <p className="text-[10px] text-teal-700 mt-0.5 font-medium">
              {medsDoneToday ? '✓ Done' : medications.length > 0 ? `${medications.length} meds` : 'Pending'}
            </p>
          </div>
        </button>

        {/* Symptoms */}
        <button
          type="button"
          onClick={() => { if (isVoiceEnabled) speak(t.howAreYouFeeling); setCurrentScreen("symptom-check") }}
          className="card-rose border-2 border-rose-200 rounded-2xl p-3 text-left flex flex-col gap-2 active:scale-[0.97] transition-all card-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-rose-700" />
          </div>
          <div>
            <p className="text-xs font-bold text-rose-900 leading-tight">
              {language === 'hi' ? 'लक्षण' : 'Symptoms'}
            </p>
            <p className="text-[10px] text-rose-700 mt-0.5 font-medium">How do you feel?</p>
          </div>
        </button>
      </div>
    </div>

    {/* ── VITALS STRIP ── */}
    {(patientProfile.weight > 0 || patientProfile.height > 0) && (
      <div className="px-4 mb-3">
        <div className="bg-card rounded-2xl border border-border p-3 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              {l.vitals}
            </h3>
            {latestHealthData?.bp && (
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500" />
                <span className="text-xs font-bold text-foreground">
                  {latestHealthData.bp.systolic}/{latestHealthData.bp.diastolic}
                </span>
                {metrics.bpCategory !== '-' && (
                  <span className={`text-[10px] font-semibold ml-1 ${getBPCategoryColor(metrics.bpCategory)}`}>
                    {metrics.bpCategory}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowWeightUpdate(true)}
              className="flex-1 bg-muted/60 rounded-xl py-2.5 text-center hover:bg-muted transition-colors"
            >
              <p className="text-base font-extrabold text-foreground">{patientProfile.weight || '-'}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{l.kg}</p>
            </button>
            <div className="flex-1 bg-muted/60 rounded-xl py-2.5 text-center">
              <p className="text-base font-extrabold text-foreground">{patientProfile.height || '-'}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{l.cm}</p>
            </div>
            <div className="flex-1 bg-muted/60 rounded-xl py-2.5 text-center">
              <p className="text-base font-extrabold text-foreground">{metrics.bmi ?? '-'}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{l.bmi}</p>
            </div>
            <div className="flex-1 bg-muted/60 rounded-xl py-2.5 text-center">
              <p className="text-base font-extrabold text-foreground">{metrics.bsa ?? '-'}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{l.bsa}</p>
            </div>
          </div>
          {patientProfile.age > 0 && patientProfile.sex && patientProfile.sex !== 'other' && (
            <div className="flex gap-2 mt-2">
              <div className="flex-1 flex items-center justify-between px-2 py-1.5 bg-muted/40 rounded-lg">
                <span className="text-[10px] text-muted-foreground">{l.weightPct}</span>
                <span className={`text-xs font-bold ${getPercentileColor(metrics.weightPercentile)}`}>
                  {formatPercentile(metrics.weightPercentile)}
                </span>
              </div>
              <div className="flex-1 flex items-center justify-between px-2 py-1.5 bg-muted/40 rounded-lg">
                <span className="text-[10px] text-muted-foreground">{l.heightPct}</span>
                <span className={`text-xs font-bold ${getPercentileColor(metrics.heightPercentile)}`}>
                  {formatPercentile(metrics.heightPercentile)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* ── RELAPSE STATUS ── */}
    {urineTests.length > 0 && (
      <div className="px-4 mb-3">
        <RelapseStatusCard relapseStatus={relapseStatus} language={language} />
      </div>
    )}

    {/* ── QUICK ACTIONS GRID ── */}
    <div className="px-4 mb-3">
      <h2 className="text-xs font-bold text-foreground uppercase tracking-widest mb-2">
        {l.quickActions}
      </h2>
      <div className="grid grid-cols-4 gap-2">
        <ActionTile
          icon={TrendingUp} iconColor="text-indigo-600" bg="bg-indigo-100"
          label={language === 'hi' ? 'रुझान' : 'Trends'}
          onClick={() => { if (isVoiceEnabled) speak(language === "en" ? "Health Trend" : "स्वास्थ्य रुझान"); setCurrentScreen("health-trend") }}
        />
        <ActionTile
          icon={Target} iconColor="text-sky-600" bg="bg-sky-100"
          label={language === 'hi' ? 'अनुपालन' : 'Compliance'}
          badge={compliance.overallScore > 0 ? `${compliance.overallScore}%` : undefined}
          onClick={() => { if (isVoiceEnabled) speak(language === "en" ? "Compliance" : "अनुपालन"); setCurrentScreen("compliance") }}
        />
        <ActionTile
          icon={BarChart3} iconColor="text-violet-600" bg="bg-violet-100"
          label={language === 'hi' ? 'विश्लेषण' : 'Analytics'}
          onClick={() => { if (isVoiceEnabled) speak(language === "en" ? "Analytics" : "विश्लेषण"); setCurrentScreen("patient-analytics") }}
        />
        <ActionTile
          icon={Calendar} iconColor="text-orange-600" bg="bg-orange-100"
          label={language === 'hi' ? 'कैलेंडर' : 'Calendar'}
          onClick={() => { if (isVoiceEnabled) speak(language === "en" ? "Adherence Calendar" : "कैलेंडर"); setCurrentScreen("adherence-calendar") }}
        />
        <ActionTile
          icon={ClipboardList} iconColor="text-rose-600" bg="bg-rose-100"
          label={language === 'hi' ? 'डेटा' : 'Health Data'}
          onClick={() => { if (isVoiceEnabled) speak(t.enterHealthData); setCurrentScreen("health-data") }}
        />
        <ActionTile
          icon={BookOpen} iconColor="text-emerald-600" bg="bg-emerald-100"
          label={language === 'hi' ? 'सीखें' : 'Learn'}
          onClick={() => { if (isVoiceEnabled) speak(t.education); setCurrentScreen("education-hub") }}
        />
        <ActionTile
          icon={Stethoscope} iconColor="text-teal-600" bg="bg-teal-100"
          label={language === 'hi' ? 'डॉक्टर' : 'For Doctor'}
          onClick={() => { if (isVoiceEnabled) speak(language === "en" ? "Clinician Dashboard" : "चिकित्सक डैशबोर्ड"); setCurrentScreen("clinician-dashboard") }}
        />
        <ActionTile
          icon={FileText} iconColor="text-amber-600" bg="bg-amber-100"
          label={language === 'hi' ? 'रिपोर्ट' : 'Reports'}
          onClick={() => { if (isVoiceEnabled) speak(language === "en" ? "Patient Analytics" : "रिपोर्ट"); setCurrentScreen("patient-analytics") }}
        />
      </div>
    </div>

    {/* ── DAILY LOG CTA ── */}
    <div className="px-4 mb-3">
      <button
        type="button"
        onClick={() => {
          if (isVoiceEnabled) speak(language === "en" ? "Starting your daily health check" : "आपकी दैनिक स्वास्थ्य जांच शुरू हो रही है")
          setCurrentScreen("daily-health-log")
        }}
        className={`w-full rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98] card-shadow ${
          hasDoneCheckInToday
            ? "bg-emerald-50 border-2 border-emerald-200"
            : "bg-gradient-to-r from-primary to-[oklch(0.42_0.22_275)] shadow-lg"
        }`}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          hasDoneCheckInToday ? "bg-emerald-100" : "bg-white/20"
        }`}>
          {hasDoneCheckInToday
            ? <Calendar className="w-6 h-6 text-emerald-600" />
            : <Play className="w-6 h-6 text-primary-foreground" />}
        </div>
        <div className="flex-1 text-left">
          <p className={`text-base font-bold ${hasDoneCheckInToday ? "text-emerald-900" : "text-primary-foreground"}`}>
            {hasDoneCheckInToday ? l.dailyCheckComplete : l.startDailyCheck}
          </p>
          <p className={`text-xs ${hasDoneCheckInToday ? "text-emerald-700" : "text-primary-foreground/75"}`}>
            {hasDoneCheckInToday ? l.tapToDoAnother : l.urineTestMedsSymptoms}
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 ${hasDoneCheckInToday ? "text-emerald-500" : "text-primary-foreground/60"}`} />
      </button>
    </div>

    {/* ── ASSISTANT BUBBLE ── */}
    <div className="px-4 mb-2">
      <button
        type="button"
        onClick={() => speak(language === "en" ? "I am your KidneyCare assistant. How can I help you today?" : "मैं आपका किडनीकेयर सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?")}
        className="w-full flex items-center gap-3 bg-card rounded-2xl p-4 border border-border card-shadow hover:border-primary/40 transition-all active:scale-[0.99]"
      >
        <AssistantAvatar size="sm" />
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-card-foreground">{l.needHelp}</p>
          <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            {l.tapToListen}
          </p>
        </div>
        <Volume2 className="w-5 h-5 text-muted-foreground" />
      </button>
    </div>

  </div>

  {/* Floating assistant */}
  <FloatingAssistant />
  </div>
  </PullToRefresh>
  )
}

function ActionTile({
  icon: Icon,
  iconColor,
  bg,
  label,
  badge,
  onClick,
}: {
  icon: React.ElementType
  iconColor: string
  bg: string
  label: string
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-card rounded-2xl p-3 border border-border flex flex-col items-center gap-2 active:scale-[0.96] transition-all card-shadow hover:border-primary/20 relative"
    >
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-[10px] font-bold text-foreground text-center leading-tight">{label}</p>
      {badge && (
        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">
          {badge}
        </span>
      )}
    </button>
  )
}
