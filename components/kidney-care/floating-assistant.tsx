"use client"

import { cn } from "@/lib/utils"
import { HelpCircle, MessageCircle, RefreshCw, X, Volume2, Phone, AlertTriangle, TrendingUp, Pill, TestTube, Sparkles } from "lucide-react"
import { useState, useCallback, useMemo } from "react"
import { AssistantAvatar } from "./assistant-avatar"
import { useApp, getTranslations } from "@/lib/app-context"
import { analyzeRelapseStatus, generateAlerts } from "@/lib/relapse-detection"
import { calculateComplianceMetrics } from "@/lib/compliance-tracking"

// Voice language mapping
const voiceLanguageMap: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  pa: "pa-IN",
}

interface FloatingAssistantProps {
  className?: string
}

export function FloatingAssistant({ className }: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeView, setActiveView] = useState<"menu" | "insights">("menu")
  const {
    language,
    isVoiceEnabled,
    urineTests,
    healthData,
    symptomEntries,
    dailyCheckIns,
    medications,
    patientProfile,
    setCurrentScreen,
  } = useApp()
  const t = getTranslations(language)
  const isEn = language === "en" || !["hi", "bn", "ta", "pa"].includes(language)

  // Proactive health analysis
  const relapseStatus = useMemo(() => analyzeRelapseStatus(urineTests), [urineTests])
  const alerts = useMemo(
    () => generateAlerts(urineTests, symptomEntries, healthData, dailyCheckIns.length, 30),
    [urineTests, symptomEntries, healthData, dailyCheckIns]
  )
  const compliance = useMemo(
    () => calculateComplianceMetrics(dailyCheckIns, urineTests, medications, 7),
    [dailyCheckIns, urineTests, medications]
  )

  // Generate proactive insights
  const insights = useMemo(() => {
    const tips: Array<{ icon: typeof AlertTriangle; color: string; message: string; severity: "info" | "warning" | "critical" }> = []

    // Relapse warning
    if (relapseStatus.status === "relapse") {
      tips.push({
        icon: AlertTriangle,
        color: "text-red-600 bg-red-100",
        message: isEn
          ? `Relapse detected! Protein has been 3+ or higher for ${relapseStatus.consecutivePositiveDays} days. Contact your doctor immediately to restart prednisolone.`
          : `रिलैप्स! प्रोटीन ${relapseStatus.consecutivePositiveDays} दिनों से 3+ या अधिक है। प्रेडनिसोलोन शुरू करने के लिए तुरंत डॉक्टर से मिलें।`,
        severity: "critical",
      })
    } else if (relapseStatus.consecutivePositiveDays === 2) {
      tips.push({
        icon: AlertTriangle,
        color: "text-orange-600 bg-orange-100",
        message: isEn
          ? "Protein has been 3+ for 2 days. If it continues tomorrow, this confirms a relapse. Prepare to contact your doctor."
          : "प्रोटीन 2 दिनों से 3+ है। अगर कल भी एसा रहा तो रिलैप्स है। डॉक्टर से संपर्क की तैयारी रखें।",
        severity: "warning",
      })
    }

    // Compliance tips
    if (compliance.urineTestCompliance.percentage < 50) {
      tips.push({
        icon: TestTube,
        color: "text-amber-600 bg-amber-100",
        message: isEn
          ? "You have missed several urine tests this week. Daily testing helps detect relapses early. Test every morning with first urine."
          : "इस सप्ताह कई मूत्र परीक्षण छूट गए। दैनिक परीक्षण रिलैप्स जल्दी पकड़ने में मदद करता है। हर सुबह पहले मूत्र से परीक्षण करें।",
        severity: "info",
      })
    }

    if (compliance.medicationCompliance.percentage < 70) {
      tips.push({
        icon: Pill,
        color: "text-emerald-600 bg-emerald-100",
        message: isEn
          ? "Some medications were missed this week. Never stop steroids suddenly - this can cause a dangerous adrenal crisis. Set a daily reminder to stay on track."
          : "इस सप्ताह कुछ दवाइंआं छूट गईं। स्टेरॉयड कभी अचानक बंद न करें। ट्रैक पर रहने के लिए दैनिक रिमाइंडर सेट करें।",
        severity: "warning",
      })
    }

    // Weight trend analysis
    const recentWeights = healthData
      .filter((h) => h.weight)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7)

    if (recentWeights.length >= 2) {
      const latest = recentWeights[0].weight!
      const earlier = recentWeights[recentWeights.length - 1].weight!
      const gain = latest - earlier
      if (gain > 2) {
        tips.push({
          icon: TrendingUp,
          color: "text-orange-600 bg-orange-100",
          message: isEn
            ? `Weight has increased by ${gain.toFixed(1)} kg recently. Rapid weight gain with swelling may indicate a relapse. Monitor closely and restrict salt intake.`
            : `हाल ही में वजन ${gain.toFixed(1)} किलो बढ़ा है। सूजन के साथ तेज वजन बढ़ना रिलैप्स का संकेत हो सकता है। नमक कम करें।`,
          severity: "warning",
        })
      }
    }

    // Remission encouragement
    if (relapseStatus.status === "remission" && relapseStatus.consecutiveNegativeDays >= 7) {
      tips.push({
        icon: Sparkles,
        color: "text-emerald-600 bg-emerald-100",
        message: isEn
          ? `Great job! Your child has been in remission for ${relapseStatus.consecutiveNegativeDays} days. Continue daily testing and normal diet. Keep up the good work!`
          : `बहुत अच्छा! आपका बच्चा ${relapseStatus.consecutiveNegativeDays} दिनों से रिमिशन में है। दैनिक परीक्षण और सामान्य आहार जारी रखें!`,
        severity: "info",
      })
    }

    // BP tip if recent high readings
    const recentBP = healthData
      .filter((h) => h.bp)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)

    const highBPCount = recentBP.filter(
      (h) => h.bp && (h.bp.systolic > 130 || h.bp.diastolic > 85)
    ).length

    if (highBPCount >= 2) {
      tips.push({
        icon: AlertTriangle,
        color: "text-red-600 bg-red-100",
        message: isEn
          ? "Recent blood pressure readings have been high. This is common during relapse. Inform your doctor. If accompanied by headache or vomiting, go to hospital immediately."
          : "हाल के रक्तचाप की रीडिंग अधिक रही हैं। डॉक्टर को बताएं। सिरदर्द या उल्टी हो तो तुरंत अस्पताल जाएं।",
        severity: "warning",
      })
    }

    // Symptom-based tips
    const recentSymptoms = symptomEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)

    const hasRecentSwelling = recentSymptoms.some((s) => s.symptoms.swelling)
    if (hasRecentSwelling && relapseStatus.status !== "relapse") {
      tips.push({
        icon: AlertTriangle,
        color: "text-amber-600 bg-amber-100",
        message: isEn
          ? "Swelling has been reported recently. While your urine test does not yet show relapse, monitor protein levels closely. Restrict salt and ensure daily testing."
          : "हाल ही में सूजन की रिपोर्ट हुई है। मूत्र परीक्षण अभी रिलैप्स नहीं दिखाता, लेकिन प्रोटीन की निगरानी करें। नमक कम करें।",
        severity: "info",
      })
    }

    // If no issues, add a general tip
    if (tips.length === 0) {
      tips.push({
        icon: Sparkles,
        color: "text-primary bg-primary/10",
        message: isEn
          ? "Everything looks stable! Remember to test urine every morning with first morning sample, and take all prescribed medications on time."
          : "सब कुछ स्थिर दिखता है! हर सुबह पहले मूत्र नमूने से परीक्षण करना और सभी निर्धारित दवाइंआं समय पर लेना याद रखें।",
        severity: "info",
      })
    }

    return tips
  }, [isEn, relapseStatus, compliance, healthData, symptomEntries])

  const hasUrgentInsights = insights.some((i) => i.severity === "critical" || i.severity === "warning")

  // Text-to-speech function
  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined") return

      window.speechSynthesis?.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = voiceLanguageMap[language] || "en-IN"
      utterance.rate = 0.85
      utterance.pitch = 1

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis?.speak(utterance)
    },
    [language]
  )

  const handleOptionClick = (option: string) => {
    let message = ""

    switch (option) {
      case "ask":
        message = isEn
          ? "You can ask me any question about your health. Just tap the microphone button and speak."
          : "आप मुझसे अपने स्वास्थ्य के बारे में कोई भी सवाल पूछ सकते हैं।"
        break
      case "repeat":
        message = isEn
          ? "I will repeat the last instruction for you."
          : "मैं आपके लिए पिछला निर्देश दोहराऊंगा।"
        break
      case "help":
        message = isEn
          ? "I am here to help you. This app helps you track your kidney health. You can check how you feel, do urine tests, track your medicines, and learn about kidney care."
          : "मैं आपकी मदद के लिए यहाँ हूं। यह एप आपकी किडनी स्वास्थ्य को ट्रैक करने में मदद करता है।"
        break
      case "call":
        if (patientProfile.doctorPhone) {
          speak(isEn ? "Calling your doctor now." : "डॉक्टर को कॉल कर रहे हैं।")
          setIsOpen(false)
          window.location.href = `tel:${patientProfile.doctorPhone}`
        } else {
          speak(
            isEn
              ? "No doctor phone number saved. Please add it in Settings."
              : "डॉक्टर का नंबर नहीं मिला। कृपया सेटिंग्स में जोड़ें।"
          )
          setIsOpen(false)
        }
        return
      case "insights":
        setActiveView("insights")
        if (insights.length > 0) {
          speak(insights[0].message)
        }
        return
      case "analytics":
        setCurrentScreen("patient-analytics")
        setIsOpen(false)
        return
    }

    speak(message)
    setIsOpen(false)
  }

  const options = [
    {
      icon: Sparkles,
      label: isEn ? "Health Insights" : "स्वास्थ्य जानकारी",
      action: "insights",
      color: hasUrgentInsights ? "text-orange-600" : "text-primary",
      bg: hasUrgentInsights ? "bg-orange-100" : "bg-primary/10",
      badge: hasUrgentInsights ? insights.filter((i) => i.severity !== "info").length : 0,
    },
    {
      icon: MessageCircle,
      label: t.askQuestion,
      action: "ask",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: TrendingUp,
      label: isEn ? "View Analytics" : "विश्लेषण देखें",
      action: "analytics",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      icon: RefreshCw,
      label: t.repeatInstruction,
      action: "repeat",
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      icon: HelpCircle,
      label: t.helpMe,
      action: "help",
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      icon: Phone,
      label: isEn ? "Call Doctor" : "डॉक्टर को कॉल करें",
      action: "call",
      color: "text-rose-600",
      bg: "bg-rose-100",
    },
  ]

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Options menu / Insights panel */}
      {isOpen && (
        <div className="absolute bottom-24 right-0 w-80 bg-card rounded-3xl shadow-2xl border-2 border-border overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 max-h-[70vh] flex flex-col">
          {activeView === "menu" ? (
            <>
              <div className="p-4 bg-primary/5 border-b border-border">
                <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-primary" />
                  {isEn ? "How can I help?" : "मैं कैसे मदद कर सकता हूं?"}
                </p>
                {hasUrgentInsights && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {isEn
                      ? `${insights.filter((i) => i.severity !== "info").length} health alert(s) need attention`
                      : `${insights.filter((i) => i.severity !== "info").length} स्वास्थ्य अलर्ट ध्यान चाहिए`}
                  </p>
                )}
              </div>
              <div className="overflow-y-auto">
                {options.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleOptionClick(option.action)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted transition-colors text-left border-b border-border last:border-b-0 active:scale-[0.98]"
                  >
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center relative", option.bg)}>
                      <option.icon className={cn("w-5 h-5", option.color)} />
                      {"badge" in option && (option as { badge?: number }).badge ? (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {(option as { badge?: number }).badge}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-base font-medium text-card-foreground">{option.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-primary/5 border-b border-border flex items-center justify-between">
                <p className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {isEn ? "Health Insights" : "स्वास्थ्य जानकारी"}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView("menu")}
                  className="text-xs text-primary font-medium"
                >
                  {isEn ? "Back" : "वापस"}
                </button>
              </div>
              <div className="overflow-y-auto p-4 space-y-3">
                {insights.map((insight, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (isVoiceEnabled) speak(insight.message)
                    }}
                    className="w-full text-left bg-muted/50 rounded-xl p-3 border border-border hover:border-primary/30 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", insight.color)}>
                        <insight.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed">{insight.message}</p>
                        {isVoiceEnabled && (
                          <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                            <Volume2 className="w-3 h-3" />
                            {isEn ? "Tap to listen" : "सुनने के लिए टैप करें"}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => {
          if (!isOpen) setActiveView("menu")
          setIsOpen(!isOpen)
          if (!isOpen && isVoiceEnabled) {
            speak(isEn ? "How can I help you?" : "मैं आपकी कैसे मदद कर सकता हूं?")
          }
        }}
        className={cn(
          "relative w-20 h-20 rounded-full shadow-2xl transition-all duration-300 active:scale-95",
          isOpen ? "bg-muted scale-110" : "bg-transparent",
          isSpeaking && "ring-4 ring-primary/50"
        )}
        aria-label={isOpen ? "Close assistant menu" : "Open assistant menu"}
      >
        {isOpen ? (
          <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
            <X className="w-8 h-8 text-muted-foreground" />
          </div>
        ) : (
          <AssistantAvatar size="md" className="w-full h-full" />
        )}

        {/* Pulse animation when closed */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            {hasUrgentInsights ? (
              <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-md">
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
              </span>
            ) : (
              <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">?</span>
              </span>
            )}
          </>
        )}
      </button>
    </div>
  )
}
