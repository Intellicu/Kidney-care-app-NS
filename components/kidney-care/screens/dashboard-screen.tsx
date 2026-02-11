"use client"

import { useState, useCallback, useEffect } from "react"
import { useApp, getTranslations } from "@/lib/app-context"
import { FloatingAssistant } from "../floating-assistant"
import { TopHeaderBar } from "../top-header-bar"
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/10">
      {/* Top Header Bar */}
      <TopHeaderBar onMenuClick={() => setShowSidebar(true)} />
      
      {/* Settings Sidebar */}
      <SettingsSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />

      {/* Content */}
      <div className="flex-1 flex flex-col pb-24 safe-bottom">
        {/* Header with greeting */}
        <div className="px-5 pt-4 pb-4 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <GreetingIcon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {greeting.text}{patientProfile.name ? `, ${patientProfile.name.split(' ')[0]}` : ''}!
                </h1>
                <p className="text-base text-muted-foreground">KidneyCare</p>
              </div>
            </div>
          </div>

          {/* Patient Info Card */}
          {patientProfile.name && (
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-foreground truncate">{patientProfile.name}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {patientProfile.age > 0 && <span>{patientProfile.age} {l.years}</span>}
                    {patientProfile.diagnosis && (
                      <>
                        <span>|</span>
                        <span className="font-medium text-primary">{patientProfile.diagnosis}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vitals Card - Auto-calculated */}
        {(patientProfile.weight > 0 || patientProfile.height > 0) && (
          <div className="px-5 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {l.vitals}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSidebar(true)}
                  className="text-xs text-blue-600 font-medium flex items-center gap-1"
                >
                  {l.viewAll}
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-3">
                {/* Weight */}
                <button
                  type="button"
                  onClick={() => setShowWeightUpdate(true)}
                  className="bg-white/80 rounded-xl p-3 text-center hover:bg-white transition-colors relative group"
                >
                  <Scale className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{patientProfile.weight || '-'}</p>
                  <p className="text-[10px] text-muted-foreground">{l.kg}</p>
                  <Edit3 className="w-3 h-3 text-blue-400 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                
                {/* Height */}
                <div className="bg-white/80 rounded-xl p-3 text-center">
                  <Ruler className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{patientProfile.height || '-'}</p>
                  <p className="text-[10px] text-muted-foreground">{l.cm}</p>
                </div>
                
                {/* BMI */}
                <div className="bg-white/80 rounded-xl p-3 text-center">
                  <Activity className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{metrics.bmi ?? '-'}</p>
                  <p className="text-[10px] text-muted-foreground">{l.bmi}</p>
                </div>
                
                {/* BSA */}
                <div className="bg-white/80 rounded-xl p-3 text-center">
                  <User className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{metrics.bsa ?? '-'}</p>
                  <p className="text-[10px] text-muted-foreground">{l.bsa}</p>
                </div>
              </div>

              {/* Percentiles row - only show if we have age and sex */}
              {patientProfile.age > 0 && patientProfile.sex && patientProfile.sex !== 'other' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/60 rounded-lg p-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{l.weightPct}</span>
                    <span className={`text-sm font-bold ${getPercentileColor(metrics.weightPercentile)}`}>
                      {formatPercentile(metrics.weightPercentile)}
                    </span>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{l.heightPct}</span>
                    <span className={`text-sm font-bold ${getPercentileColor(metrics.heightPercentile)}`}>
                      {formatPercentile(metrics.heightPercentile)}
                    </span>
                  </div>
                </div>
              )}

              {/* BP Row - if available */}
              {latestHealthData?.bp && (
                <div className="mt-2 bg-white/60 rounded-lg p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span className="text-xs text-muted-foreground">{l.bp}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-foreground">
                      {latestHealthData.bp.systolic}/{latestHealthData.bp.diastolic}
                    </span>
                    {metrics.bpCategory !== '-' && (
                      <span className={`text-xs ml-2 ${getBPCategoryColor(metrics.bpCategory)}`}>
                        ({metrics.bpCategory})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clinical Alerts */}
        {clinicalAlerts.length > 0 && (
          <div className="px-5 mb-4">
            <AlertBanner
              alerts={clinicalAlerts.map(a => ({
                ...a,
                dismissed: dismissedAlerts.has(a.id),
              }))}
              language={language}
              onDismiss={(id) => setDismissedAlerts(prev => new Set([...prev, id]))}
            />
          </div>
        )}

        {/* Relapse Status Card */}
        {urineTests.length > 0 && (
          <div className="px-5 mb-4">
            <RelapseStatusCard relapseStatus={relapseStatus} language={language} />
          </div>
        )}

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
                  onClick={() => {
                    setShowWeightUpdate(false)
                    setNewWeight("")
                  }}
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

        {/* Daily Health Log CTA - Primary Action */}
        <div className="px-5 mb-4">
          <button
            type="button"
            onClick={() => {
              if (isVoiceEnabled) {
                speak(language === "en" 
                  ? "Starting your daily health check"
                  : "आपकी दैनिक स्वास्थ्य जांच शुरू हो रही है"
                )
              }
              setCurrentScreen("daily-health-log")
            }}
            className={`w-full rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.98] ${
              hasDoneCheckInToday
                ? "bg-emerald-50 border-2 border-emerald-200"
                : "bg-gradient-to-r from-primary to-primary/80 shadow-lg"
            }`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              hasDoneCheckInToday 
                ? "bg-emerald-100" 
                : "bg-white/20"
            }`}>
              {hasDoneCheckInToday ? (
                <Calendar className="w-7 h-7 text-emerald-600" />
              ) : (
                <Play className="w-7 h-7 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className={`text-xl font-bold ${hasDoneCheckInToday ? "text-emerald-900" : "text-primary-foreground"}`}>
                {hasDoneCheckInToday ? l.dailyCheckComplete : l.startDailyCheck}
              </p>
              <p className={`text-sm ${hasDoneCheckInToday ? "text-emerald-700" : "text-primary-foreground/80"}`}>
                {hasDoneCheckInToday ? l.tapToDoAnother : l.urineTestMedsSymptoms}
              </p>
            </div>
            <Activity className={`w-6 h-6 ${hasDoneCheckInToday ? "text-emerald-600" : "text-primary-foreground/60"}`} />
          </button>
        </div>

        {/* Quick Actions Grid */}
        <div className="px-5 mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {l.quickActions}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                if (isVoiceEnabled) speak(t.doUrineTest)
                setCurrentScreen("urine-test")
              }}
              className="bg-card rounded-xl p-4 border border-border flex flex-col items-center gap-3 hover:border-primary/30 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <TestTube className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-sm font-medium text-foreground text-center">{t.doUrineTest}</p>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isVoiceEnabled) speak(t.checkMedicines)
                setCurrentScreen("medications")
              }}
              className="bg-card rounded-xl p-4 border border-border flex flex-col items-center gap-3 hover:border-primary/30 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Pill className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-foreground text-center">
                {t.checkMedicines}
                {medications.length > 0 && (
                  <span className="block text-xs text-muted-foreground">({medications.length})</span>
                )}
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isVoiceEnabled) speak(t.howAreYouFeeling)
                setCurrentScreen("symptom-check")
              }}
              className="bg-card rounded-xl p-4 border border-border flex flex-col items-center gap-3 hover:border-primary/30 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                <HeartPulse className="w-6 h-6 text-rose-600" />
              </div>
              <p className="text-sm font-medium text-foreground text-center">{t.howAreYouFeeling}</p>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isVoiceEnabled) speak(language === "en" ? "Health Trend" : "स्वास्थ्य रुझान")
                setCurrentScreen("health-trend")
              }}
              className="bg-card rounded-xl p-4 border border-border flex flex-col items-center gap-3 hover:border-primary/30 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-foreground text-center">
                {language === "en" ? "Health Trend" : "स्वास्थ्य रुझान"}
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isVoiceEnabled) speak(language === "en" ? "Compliance Tracker" : "अनुपालन ट्रैकर")
                setCurrentScreen("compliance")
              }}
              className="bg-card rounded-xl p-4 border border-border flex flex-col items-center gap-3 hover:border-primary/30 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-foreground text-center">
                {language === "en" ? "Compliance" : "अनुपालन"}
                {compliance.overallScore > 0 && (
                  <span className="block text-xs text-muted-foreground">({compliance.overallScore}%)</span>
                )}
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isVoiceEnabled) speak(language === "en" ? "Clinician Dashboard" : "चिकित्सक डैशबोर्ड")
                setCurrentScreen("clinician-dashboard")
              }}
              className="bg-card rounded-xl p-4 border border-border flex flex-col items-center gap-3 hover:border-primary/30 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-teal-600" />
              </div>
              <p className="text-sm font-medium text-foreground text-center">
                {language === "en" ? "For Doctor" : "डॉक्टर के लिए"}
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isVoiceEnabled) speak(language === "en" ? "Health Analytics" : "स्वास्थ्य विश्लेषण")
                setCurrentScreen("patient-analytics")
              }}
              className="bg-card rounded-xl p-4 border border-border flex flex-col items-center gap-3 hover:border-primary/30 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-foreground text-center">
                {language === "en" ? "Analytics" : "विश्लेषण"}
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isVoiceEnabled) speak(language === "en" ? "Adherence Calendar" : "अनुपालन कैलेंडर")
                setCurrentScreen("adherence-calendar")
              }}
              className="bg-card rounded-xl p-4 border border-border flex flex-col items-center gap-3 hover:border-primary/30 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-foreground text-center">
                {language === "en" ? "Calendar" : "कैलेंडर"}
              </p>
            </button>
          </div>
        </div>

        {/* Other actions */}
        <div className="px-5 space-y-3">
          <button
            type="button"
            onClick={() => {
              if (isVoiceEnabled) speak(t.enterHealthData)
              setCurrentScreen("health-data")
            }}
            className="w-full min-h-[72px] p-4 rounded-xl border border-border bg-card flex items-center gap-4 hover:border-primary/30 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-lg font-semibold text-foreground">{l.enterHealthData}</p>
              <p className="text-sm text-muted-foreground">{l.weightBPOutput}</p>
            </div>
            <Activity className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (isVoiceEnabled) speak(t.education)
              setCurrentScreen("education-hub")
            }}
            className="w-full min-h-[72px] p-4 rounded-xl border border-border bg-card flex items-center gap-4 hover:border-primary/30 active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-lg font-semibold text-foreground">{l.learn}</p>
              <p className="text-sm text-muted-foreground">{l.learnAboutKidney}</p>
            </div>
            <Activity className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Quick assistant bubble */}
        <div className="px-5 mt-4">
          <button
            type="button"
            onClick={() => {
              const msg = language === "en"
                ? "I am your KidneyCare assistant. How can I help you today?"
                : "मैं आपका किडनीकेयर सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?"
              speak(msg)
            }}
            className="w-full flex items-start gap-4 bg-card rounded-2xl p-4 border border-border shadow-sm hover:border-primary/30 transition-all active:scale-[0.99]"
          >
            <AssistantAvatar size="sm" />
            <div className="flex-1 text-left">
              <p className="text-lg text-card-foreground leading-relaxed">{l.needHelp}</p>
              <p className="text-sm text-primary mt-1 flex items-center gap-1">
                <Volume2 className="w-4 h-4" />
                {l.tapToListen}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Floating assistant */}
      <FloatingAssistant />
    </div>
  )
}
