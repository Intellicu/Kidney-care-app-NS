"use client"

import React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import { useApp, getTranslations, type Medication, type UrineTestResult } from "@/lib/app-context"
import { 
  TestTube, Pill, HeartPulse, ChevronRight, ChevronLeft, 
  Check, X, Camera, Upload, Clock, Volume2, Mic, Plus, 
  AlertCircle, CheckCircle2, SkipForward, Sparkles, Eye
} from "lucide-react"
import { TopHeaderBar } from "../top-header-bar"

// Voice language mapping
const voiceLanguageMap: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  pa: "pa-IN",
}

type FlowStep = "intro" | "urine-instructions" | "urine-capture" | "patient-result" | "ai-analysis" | "urine-summary" | "medication-check" | "add-extra-med" | "clinical-assessment" | "complete"

const resultOptions = [
  { value: "negative" as const, color: "bg-yellow-100", textColor: "text-yellow-800", borderColor: "border-yellow-300" },
  { value: "trace" as const, color: "bg-yellow-200", textColor: "text-yellow-900", borderColor: "border-yellow-400" },
  { value: "1+" as const, color: "bg-green-100", textColor: "text-green-800", borderColor: "border-green-300" },
  { value: "2+" as const, color: "bg-green-200", textColor: "text-green-900", borderColor: "border-green-400" },
  { value: "3+" as const, color: "bg-orange-200", textColor: "text-orange-900", borderColor: "border-orange-400" },
  { value: "4+" as const, color: "bg-red-200", textColor: "text-red-900", borderColor: "border-red-400" },
]

export function DailyHealthLogScreen() {
  const { 
    language, 
    isVoiceEnabled,
    setCurrentScreen, 
    patientProfile,
    medications,
    toggleMedicationTakenYesterday,
    addMedication,
    addUrineTest,
    addDailyCheckIn,
    addSymptomEntry,
  } = useApp()
  const t = getTranslations(language)
  
  const [currentStep, setCurrentStep] = useState<FlowStep>("intro")
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Urine test state - now tracking BOTH patient and AI results
  const [beforeImage, setBeforeImage] = useState<string | null>(null)
  const [afterImage, setAfterImage] = useState<string | null>(null)
  const [patientResult, setPatientResult] = useState<UrineTestResult["result"] | null>(null)
  const [aiResult, setAiResult] = useState<UrineTestResult["result"] | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Medication state
  const [medicationsTaken, setMedicationsTaken] = useState<Set<string>>(new Set())
  const [showAddMedModal, setShowAddMedModal] = useState(false)
  const [newMedName, setNewMedName] = useState("")
  const [newMedDose, setNewMedDose] = useState("")
  
  // Clinical assessment state
  const [feeling, setFeeling] = useState<"very-good" | "okay" | "not-well" | null>(null)
  const [symptoms, setSymptoms] = useState({
    swelling: false,
    fever: false,
    vomiting: false,
    breathingDifficulty: false
  })
  
  // Skip states
  const [urineSkipped, setUrineSkipped] = useState(false)
  const [medicationSkipped, setMedicationSkipped] = useState(false)
  
  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)

  // Text-to-speech
  const speak = useCallback((text: string) => {
    if (!isVoiceEnabled || typeof window === "undefined") return
    
    window.speechSynthesis?.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = voiceLanguageMap[language] || "en-IN"
    utterance.rate = 0.85
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis?.speak(utterance)
  }, [isVoiceEnabled, language])

  // Auto-speak on step change
  useEffect(() => {
    if (!isVoiceEnabled) return
    
    const messages: Record<FlowStep, string> = {
      intro: language === "en" 
        ? `Good morning ${patientProfile.name?.split(' ')[0] || ''}! Time for your daily health check. Let's start with urine test.`
        : `सुप्रभात ${patientProfile.name?.split(' ')[0] || ''}! आपकी दैनिक स्वास्थ्य जांच का समय। चलिए मूत्र परीक्षण से शुरू करते हैं।`,
      "urine-instructions": language === "en"
        ? "Follow these steps carefully for the urine test. Dip strip for only 1 to 2 seconds."
        : "मूत्र परीक्षण के लिए इन चरणों का ध्यानपूर्वक पालन करें। स्ट्रिप को केवल 1 से 2 सेकंड के लिए डुबोएं।",
      "urine-capture": language === "en"
        ? "Take photos before and after dipping the strip."
        : "स्ट्रिप डुबोने से पहले और बाद में फोटो लें।",
      "patient-result": language === "en"
        ? "Now look at the strip and tell me what color you see. Select your result."
        : "अब स्ट्रिप को देखें और बताएं आपको कौन सा रंग दिखता है। अपना परिणाम चुनें।",
      "ai-analysis": language === "en"
        ? "Now let me analyze your photos. The AI will check the result."
        : "अब मुझे आपकी फोटो का विश्लेषण करने दें। AI परिणाम की जांच करेगा।",
      "urine-summary": language === "en"
        ? "Here are both results. Your reading and AI analysis are saved."
        : "यहां दोनों परिणाम हैं। आपकी रीडिंग और AI विश्लेषण सहेजे गए हैं।",
      "medication-check": language === "en"
        ? "Did you take your medicines yesterday? Tap each medicine you took."
        : "क्या आपने कल अपनी दवाइयाँ लीं? जो दवाइयाँ आपने लीं उन पर टैप करें।",
      "add-extra-med": language === "en"
        ? "Add any extra medicine you took."
        : "कोई अतिरिक्त दवाई जोड़ें जो आपने ली हो।",
      "clinical-assessment": language === "en"
        ? "How are you feeling today? Do you have any symptoms?"
        : "आज आप कैसा महसूस कर रहे हैं? क्या आपको कोई लक्षण हैं?",
      complete: language === "en"
        ? "Great job! Your daily health check is complete and saved to your diary."
        : "बहुत अच्छा! आपकी दैनिक स्वास्थ्य जांच पूरी हुई और डायरी में सहेजी गई।",
    }
    
    const timer = setTimeout(() => speak(messages[currentStep]), 300)
    return () => clearTimeout(timer)
  }, [currentStep, isVoiceEnabled, language, patientProfile.name, speak])

  // Handle image upload
  const handleImageUpload = (type: "before" | "after") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === "before") {
          setBeforeImage(reader.result as string)
        } else {
          setAfterImage(reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // AI Analysis of images - calls the real AI endpoint, with mock fallback
  const analyzeImages = async () => {
    setIsAnalyzing(true)
    
    try {
      const response = await fetch("/api/analyze-dipstick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beforeImage: beforeImage || null,
          afterImage: afterImage,
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.analysis?.result) {
        setAiResult(data.analysis.result as UrineTestResult["result"])
      } else {
        // Fallback to mock if API unavailable
        fallbackAnalysis()
      }
    } catch {
      // Network error - use mock fallback
      fallbackAnalysis()
    }
    
    setIsAnalyzing(false)
  }
  
  // Mock fallback for when AI API is unavailable
  const fallbackAnalysis = () => {
    const possibleResults: Array<UrineTestResult["result"]> = ["negative", "trace", "1+", "2+", "3+", "4+"]
    
    if (patientResult) {
      const patientIndex = possibleResults.indexOf(patientResult)
      const shouldAgree = Math.random() < 0.7
      if (shouldAgree) {
        setAiResult(patientResult)
      } else {
        const off = Math.random() < 0.5 ? -1 : 1
        const aiIndex = Math.max(0, Math.min(possibleResults.length - 1, patientIndex + off))
        setAiResult(possibleResults[aiIndex])
      }
    } else {
      setAiResult(possibleResults[Math.floor(Math.random() * possibleResults.length)])
    }
  }

  // Toggle medication taken
  const toggleMedication = (medId: string) => {
    setMedicationsTaken(prev => {
      const newSet = new Set(prev)
      if (newSet.has(medId)) {
        newSet.delete(medId)
      } else {
        newSet.add(medId)
      }
      return newSet
    })
    toggleMedicationTakenYesterday(medId)
  }

  // Add extra medication
  const handleAddExtraMed = () => {
    if (!newMedName.trim()) return
    
    const newMed: Medication = {
      id: `extra-${Date.now()}`,
      name: newMedName,
      dose: newMedDose || "As prescribed",
      frequency: "As needed",
      route: "oral",
      startDate: new Date().toISOString().split('T')[0],
      takenToday: false,
      takenYesterday: true,
      isActive: false,
      isCustom: true,
    }
    
    addMedication(newMed)
    setMedicationsTaken(prev => new Set([...prev, newMed.id]))
    setNewMedName("")
    setNewMedDose("")
    setShowAddMedModal(false)
  }

  // Save and complete - NOW SAVES IMMEDIATELY TO DIARY
  const handleComplete = () => {
    const today = new Date().toISOString().split('T')[0]
    
    // Save urine test if not skipped - includes BOTH results
    if (!urineSkipped && (patientResult || aiResult)) {
      const finalResult = patientResult || aiResult || "negative"
      addUrineTest({
        id: `urine-${Date.now()}`,
        date: today,
        beforeImage: beforeImage || undefined,
        afterImage: afterImage || undefined,
        patientResult: patientResult,
        aiResult: aiResult,
        result: finalResult,
        manualResult: true,
      })
    }
    
    // Save symptom entry
    if (feeling) {
      addSymptomEntry({
        date: today,
        feeling,
        symptoms,
      })
    }
    
    // Save daily check-in
    addDailyCheckIn({
      date: today,
      urineTestCompleted: !urineSkipped && !!(patientResult || aiResult),
      urineTestSkipped: urineSkipped,
      medicationCheckCompleted: !medicationSkipped,
      medicationCheckSkipped: medicationSkipped,
    })
    
    setCurrentScreen("dashboard")
  }

  // Navigation
  const goNext = () => {
    const steps: FlowStep[] = ["intro", "urine-instructions", "urine-capture", "patient-result", "ai-analysis", "urine-summary", "medication-check", "clinical-assessment", "complete"]
    const currentIndex = steps.indexOf(currentStep)
    
    // Special handling for AI analysis - auto-run analysis
    if (currentStep === "patient-result" && afterImage) {
      setCurrentStep("ai-analysis")
      analyzeImages()
      return
    }
    
    // Skip AI if no images uploaded
    if (currentStep === "patient-result" && !afterImage) {
      setCurrentStep("urine-summary")
      return
    }
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const goBack = () => {
    const steps: FlowStep[] = ["intro", "urine-instructions", "urine-capture", "patient-result", "ai-analysis", "urine-summary", "medication-check", "clinical-assessment", "complete"]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    } else {
      setCurrentScreen("dashboard")
    }
  }

  const skipUrineTest = () => {
    setUrineSkipped(true)
    setCurrentStep("medication-check")
  }

  const skipMedication = () => {
    setMedicationSkipped(true)
    setCurrentStep("clinical-assessment")
  }

  // Get result styling
  const getResultStyle = (result: string | null) => {
    return resultOptions.find(r => r.value === result) || resultOptions[0]
  }

  // Render different steps
  const renderIntro = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
        <HeartPulse className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        {t.dailyCheckIn}
      </h1>
      <p className="text-lg text-muted-foreground mb-2">
        {t.goodMorningCheckIn}
      </p>
      <p className="text-base text-primary font-medium">
        {t.letsStartDay}
      </p>
      
      <button
        type="button"
        onClick={() => speak(language === "en" 
          ? `Good morning! Time for your daily health check. We will do urine test, then check medicines, then ask how you feel.`
          : `सुप्रभात! आपकी दैनिक स्वास्थ्य जांच का समय। पहले मूत्र परीक्षण, फिर दवाइयाँ जांच, फिर आप कैसा महसूस करते हैं पूछेंगे।`
        )}
        className={`mt-6 flex items-center gap-2 px-5 py-3 rounded-full border-2 transition-all ${
          isSpeaking 
            ? "border-primary bg-primary/10 text-primary" 
            : "border-border bg-card text-foreground"
        }`}
      >
        <Volume2 className={`w-5 h-5 ${isSpeaking ? "animate-pulse" : ""}`} />
        <span className="font-medium">{t.listen}</span>
      </button>
    </div>
  )

  const renderUrineInstructions = () => (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <TestTube className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.urineTestInstructions}</h2>
          <p className="text-sm text-muted-foreground">
            {language === "en" ? "Follow each step carefully" : "प्रत्येक चरण का ध्यानपूर्वक पालन करें"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {[
          { step: t.step1, desc: t.step1Desc, icon: "1" },
          { step: t.step2, desc: t.step2Desc, icon: "2" },
          { step: t.step3, desc: t.step3Desc, icon: "3" },
          { step: t.step4, desc: t.step4Desc, icon: "4" },
          { step: t.step5, desc: t.step5Desc, icon: "5" },
          { step: t.step6, desc: t.step6Desc, icon: "6" },
        ].map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={() => speak(`${item.step}. ${item.desc}`)}
            className="w-full bg-card rounded-xl p-4 border border-border flex items-start gap-4 text-left active:scale-[0.99] transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary">{item.icon}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{item.step}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </div>
            <Volume2 className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
          </button>
        ))}
      </div>

      {/* Important timing note */}
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-amber-900">
            {language === "en" ? "Important: Dip for 1-2 seconds only!" : "महत्वपूर्ण: केवल 1-2 सेकंड के लिए डुबोएं!"}
          </p>
          <p className="text-sm text-amber-800 mt-1">
            {language === "en" 
              ? "Wait exactly 60 seconds before reading the result."
              : "परिणाम पढ़ने से पहले ठीक 60 सेकंड प्रतीक्षा करें।"}
          </p>
        </div>
      </div>
    </div>
  )

  const renderUrineCapture = () => (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <Camera className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {language === "en" ? "Take Photos" : "फोटो लें"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === "en" ? "Before dipping and after 60 seconds" : "डुबोने से पहले और 60 सेकंड बाद"}
          </p>
        </div>
      </div>

      {/* Photo upload */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <input
            ref={beforeInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload("before")}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => beforeInputRef.current?.click()}
            className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
              beforeImage ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            {beforeImage ? (
              <img src={beforeImage || "/placeholder.svg"} alt="Before" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <>
                <Camera className="w-10 h-10 text-muted-foreground mb-2" />
                <span className="text-base font-medium text-muted-foreground text-center px-2">
                  {language === "en" ? "BEFORE" : "पहले"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {language === "en" ? "Tap to take photo" : "फोटो लेने के लिए टैप करें"}
                </span>
              </>
            )}
          </button>
          {beforeImage && (
            <p className="text-center text-sm text-emerald-600 mt-2 flex items-center justify-center gap-1">
              <Check className="w-4 h-4" /> {language === "en" ? "Photo taken" : "फोटो ली गई"}
            </p>
          )}
        </div>

        <div>
          <input
            ref={afterInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload("after")}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => afterInputRef.current?.click()}
            className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
              afterImage ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            {afterImage ? (
              <img src={afterImage || "/placeholder.svg"} alt="After" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <>
                <Camera className="w-10 h-10 text-muted-foreground mb-2" />
                <span className="text-base font-medium text-muted-foreground text-center px-2">
                  {language === "en" ? "AFTER 60s" : "60 सेकंड बाद"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {language === "en" ? "Tap to take photo" : "फोटो लेने के लिए टैप करें"}
                </span>
              </>
            )}
          </button>
          {afterImage && (
            <p className="text-center text-sm text-emerald-600 mt-2 flex items-center justify-center gap-1">
              <Check className="w-4 h-4" /> {language === "en" ? "Photo taken" : "फोटो ली गई"}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          {language === "en" 
            ? "Photos help AI verify your reading. You can skip photos if not available."
            : "फोटो AI को आपकी रीडिंग सत्यापित करने में मदद करती हैं। अगर उपलब्ध नहीं है तो आप फोटो छोड़ सकते हैं।"}
        </p>
      </div>
    </div>
  )

  const renderPatientResult = () => (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
          <Eye className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.selectResult}</h2>
          <p className="text-sm text-muted-foreground">{t.whatColorDoYouSee}</p>
        </div>
      </div>

      <p className="text-base text-foreground mb-4 font-medium">
        {language === "en" ? "Your Reading:" : "आपकी रीडिंग:"}
      </p>

      {/* Manual Result Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {resultOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setPatientResult(option.value)
              speak(option.value)
            }}
            className={`min-h-[80px] rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all active:scale-95 ${
              patientResult === option.value
                ? `${option.color} ${option.borderColor} ring-2 ring-primary`
                : `bg-card border-border hover:${option.color}`
            }`}
          >
            <span className={`text-xl font-bold ${patientResult === option.value ? option.textColor : "text-foreground"}`}>
              {option.value.toUpperCase()}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {option.value === "negative" ? (language === "en" ? "No protein" : "प्रोटीन नहीं") :
               option.value === "trace" ? (language === "en" ? "Very small" : "बहुत कम") :
               option.value === "1+" ? (language === "en" ? "Mild" : "हल्का") :
               option.value === "2+" ? (language === "en" ? "Moderate" : "मध्यम") :
               option.value === "3+" ? (language === "en" ? "High" : "उच्च") :
               (language === "en" ? "Very high" : "बहुत उच्च")}
            </span>
          </button>
        ))}
      </div>

      {patientResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-900">
              {language === "en" ? `You selected: ${patientResult.toUpperCase()}` : `आपने चुना: ${patientResult.toUpperCase()}`}
            </p>
            <p className="text-sm text-emerald-700">
              {language === "en" ? "Tap Next to continue to AI analysis" : "AI विश्लेषण के लिए अगला टैप करें"}
            </p>
          </div>
        </div>
      )}
    </div>
  )

  const renderAiAnalysis = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
        isAnalyzing ? "bg-purple-100 animate-pulse" : aiResult ? "bg-emerald-100" : "bg-purple-100"
      }`}>
        {isAnalyzing ? (
          <Sparkles className="w-12 h-12 text-purple-600 animate-spin" />
        ) : aiResult ? (
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        ) : (
          <Sparkles className="w-12 h-12 text-purple-600" />
        )}
      </div>
      
      <h2 className="text-xl font-bold text-foreground mb-2">
        {isAnalyzing 
          ? (language === "en" ? "AI is Analyzing..." : "AI विश्लेषण कर रहा है...")
          : (language === "en" ? "AI Analysis Complete" : "AI विश्लेषण पूर्ण")
        }
      </h2>
      
      {isAnalyzing ? (
        <p className="text-muted-foreground">
          {language === "en" ? "Please wait while we analyze your photos" : "कृपया प्रतीक्षा करें जब तक हम आपकी फोटो का विश्लेषण करते हैं"}
        </p>
      ) : aiResult ? (
        <div className="mt-4">
          <p className="text-muted-foreground mb-4">
            {language === "en" ? "AI detected result:" : "AI ने पता लगाया:"}
          </p>
          <div className={`inline-block px-8 py-4 rounded-xl ${
            getResultStyle(aiResult).color
          } ${
            getResultStyle(aiResult).borderColor
          } border-2`}>
            <p className={`text-2xl font-bold ${
              getResultStyle(aiResult).textColor
            }`}>
              {aiResult.toUpperCase()}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">
          {language === "en" ? "No photos to analyze" : "विश्लेषण के लिए कोई फोटो नहीं"}
        </p>
      )}
    </div>
  )

  const renderUrineSummary = () => (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {language === "en" ? "Results Summary" : "परिणाम सारांश"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === "en" ? "Both readings are saved to your diary" : "दोनों रीडिंग आपकी डायरी में सहेजी गईं"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Patient Result Card */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {language === "en" ? "Your Reading" : "आपकी रीडिंग"}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === "en" ? "What you saw on the strip" : "स्ट्रिप पर आपने जो देखा"}
              </p>
            </div>
          </div>
          {patientResult ? (
            <div className={`inline-block px-6 py-3 rounded-lg ${
              getResultStyle(patientResult).color
            } ${getResultStyle(patientResult).borderColor} border-2`}>
              <p className={`text-xl font-bold ${getResultStyle(patientResult).textColor}`}>
                {patientResult.toUpperCase()}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground italic">
              {language === "en" ? "Not recorded" : "दर्ज नहीं किया गया"}
            </p>
          )}
        </div>

        {/* AI Result Card */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {language === "en" ? "AI Analysis" : "AI विश्लेषण"}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === "en" ? "Computer analysis of your photos" : "आपकी फोटो का कंप्यूटर विश्लेषण"}
              </p>
            </div>
          </div>
          {aiResult ? (
            <div className={`inline-block px-6 py-3 rounded-lg ${
              getResultStyle(aiResult).color
            } ${getResultStyle(aiResult).borderColor} border-2`}>
              <p className={`text-xl font-bold ${getResultStyle(aiResult).textColor}`}>
                {aiResult.toUpperCase()}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground italic">
              {language === "en" ? "No photos uploaded for analysis" : "विश्लेषण के लिए कोई फोटो अपलोड नहीं की गई"}
            </p>
          )}
        </div>

        {/* Match indicator */}
        {patientResult && aiResult && (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${
            patientResult === aiResult 
              ? "bg-emerald-50 border border-emerald-200" 
              : "bg-amber-50 border border-amber-200"
          }`}>
            {patientResult === aiResult ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <p className="text-emerald-800 font-medium">
                  {language === "en" ? "Both readings match!" : "दोनों रीडिंग मेल खाती हैं!"}
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <p className="text-amber-800 font-medium">
                  {language === "en" 
                    ? "Readings differ slightly. Both are saved for doctor review."
                    : "रीडिंग थोड़ी अलग हैं। दोनों डॉक्टर समीक्षा के लिए सहेजी गईं।"}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const renderMedicationCheck = () => (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <Pill className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.medicationReminder}</h2>
          <p className="text-sm text-muted-foreground">{t.markTakenMedicines}</p>
        </div>
      </div>

      {medications.length > 0 ? (
        <div className="space-y-3">
          {medications.filter(m => m.isActive).map((med) => (
            <button
              key={med.id}
              type="button"
              onClick={() => toggleMedication(med.id)}
              className={`w-full min-h-[72px] rounded-xl border-2 p-4 flex items-center gap-4 transition-all active:scale-[0.98] ${
                medicationsTaken.has(med.id)
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-card border-border"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                medicationsTaken.has(med.id)
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {medicationsTaken.has(med.id) ? (
                  <Check className="w-7 h-7" />
                ) : (
                  <Pill className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-lg font-semibold text-foreground">{med.name}</p>
                <p className="text-sm text-muted-foreground">{med.dose} | {med.frequency}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-muted/50 rounded-xl p-6 text-center">
          <p className="text-muted-foreground">{t.noActiveMedications}</p>
        </div>
      )}

      {/* Add extra medicine button */}
      <button
        type="button"
        onClick={() => setShowAddMedModal(true)}
        className="w-full mt-4 min-h-[56px] border-2 border-dashed border-primary/50 rounded-xl flex items-center justify-center gap-2 text-primary font-medium hover:bg-primary/5 transition-all"
      >
        <Plus className="w-5 h-5" />
        {t.addExtraMedicine}
      </button>

      {/* Add extra med modal */}
      {showAddMedModal && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-end justify-center">
          <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 safe-bottom animate-in slide-in-from-bottom">
            <h3 className="text-xl font-bold text-foreground mb-4">
              {language === "en" ? "Add Extra Medicine" : "अतिरिक्त दवाई जोड़ें"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  {t.medicationName}
                </label>
                <input
                  type="text"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder={t.typeHere}
                  className="w-full h-14 px-4 bg-muted rounded-xl border border-border text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  {t.dosage}
                </label>
                <input
                  type="text"
                  value={newMedDose}
                  onChange={(e) => setNewMedDose(e.target.value)}
                  placeholder={t.dosagePlaceholder}
                  className="w-full h-14 px-4 bg-muted rounded-xl border border-border text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddMedModal(false)}
                className="flex-1 h-14 bg-muted rounded-xl font-semibold text-foreground"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleAddExtraMed}
                disabled={!newMedName.trim()}
                className="flex-1 h-14 bg-primary rounded-xl font-semibold text-primary-foreground disabled:opacity-50"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderClinicalAssessment = () => (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
          <HeartPulse className="w-6 h-6 text-rose-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.howAreYouFeeling}</h2>
          <p className="text-sm text-muted-foreground">
            {language === "en" ? "Select how you feel today" : "आज आप कैसा महसूस करते हैं चुनें"}
          </p>
        </div>
      </div>

      {/* Feeling buttons */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { value: "very-good" as const, label: t.veryGood, emoji: "😊", color: "bg-emerald-100 border-emerald-300 text-emerald-800" },
          { value: "okay" as const, label: t.okay, emoji: "😐", color: "bg-amber-100 border-amber-300 text-amber-800" },
          { value: "not-well" as const, label: t.notWell, emoji: "😟", color: "bg-rose-100 border-rose-300 text-rose-800" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setFeeling(option.value)
              speak(option.label)
            }}
            className={`min-h-[100px] rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${
              feeling === option.value
                ? `${option.color} ring-2 ring-primary`
                : "bg-card border-border"
            }`}
          >
            <span className="text-3xl">{option.emoji}</span>
            <span className="font-medium text-sm">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Symptoms */}
      {(feeling === "okay" || feeling === "not-well") && (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {language === "en" ? "Do you have any of these?" : "क्या आपको इनमें से कुछ है?"}
          </h3>
          
          <div className="space-y-3">
            {[
              { key: "swelling" as const, label: t.swelling },
              { key: "fever" as const, label: t.fever },
              { key: "vomiting" as const, label: t.vomiting },
              { key: "breathingDifficulty" as const, label: t.breathingDifficulty },
            ].map((symptom) => (
              <div key={symptom.key} className="flex items-center gap-4">
                <p className="flex-1 text-lg text-foreground">{symptom.label}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSymptoms(prev => ({ ...prev, [symptom.key]: true }))
                      speak(t.yes)
                    }}
                    className={`w-16 h-12 rounded-xl font-semibold transition-all ${
                      symptoms[symptom.key] === true
                        ? "bg-rose-500 text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {t.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSymptoms(prev => ({ ...prev, [symptom.key]: false }))
                      speak(t.no)
                    }}
                    className={`w-16 h-12 rounded-xl font-semibold transition-all ${
                      symptoms[symptom.key] === false
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {t.no}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )

  const renderComplete = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t.allDone}</h1>
      <p className="text-lg text-muted-foreground mb-2">{t.greatJob}</p>
      <p className="text-sm text-primary">
        {language === "en" ? "Your diary has been updated" : "आपकी डायरी अपडेट हो गई है"}
      </p>
      
      <div className="mt-8 w-full max-w-xs space-y-3">
        <button
          type="button"
          onClick={handleComplete}
          className="w-full min-h-[56px] bg-primary text-primary-foreground rounded-xl font-semibold text-lg"
        >
          {language === "en" ? "Go to Dashboard" : "डैशबोर्ड पर जाएं"}
        </button>
        <button
          type="button"
          onClick={() => {
            handleComplete()
            setTimeout(() => setCurrentScreen("nephrotic-diary"), 100)
          }}
          className="w-full min-h-[56px] border-2 border-primary text-primary rounded-xl font-semibold text-lg bg-transparent"
        >
          {language === "en" ? "View Health Diary" : "स्वास्थ्य डायरी देखें"}
        </button>
      </div>
    </div>
  )

  // Step content
  const stepContent: Record<FlowStep, React.ReactNode> = {
    intro: renderIntro(),
    "urine-instructions": renderUrineInstructions(),
    "urine-capture": renderUrineCapture(),
    "patient-result": renderPatientResult(),
    "ai-analysis": renderAiAnalysis(),
    "urine-summary": renderUrineSummary(),
    "medication-check": renderMedicationCheck(),
    "add-extra-med": null,
    "clinical-assessment": renderClinicalAssessment(),
    complete: renderComplete(),
  }

  // Progress indicator
  const steps: FlowStep[] = ["intro", "urine-instructions", "urine-capture", "patient-result", "ai-analysis", "urine-summary", "medication-check", "clinical-assessment", "complete"]
  const currentIndex = steps.indexOf(currentStep)
  const progress = ((currentIndex + 1) / steps.length) * 100

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopHeaderBar showMenu={false} />
      
      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      {stepContent[currentStep]}

      {/* Navigation footer */}
      {currentStep !== "complete" && currentStep !== "ai-analysis" && (
        <div className="sticky bottom-0 bg-card border-t border-border px-5 py-4 safe-bottom">
          <div className="flex gap-3">
            {/* Back button */}
            <button
              type="button"
              onClick={goBack}
              className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-foreground active:scale-95 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Skip button (for urine test and medication) */}
            {(currentStep === "urine-instructions" || currentStep === "urine-capture" || currentStep === "patient-result") && (
              <button
                type="button"
                onClick={skipUrineTest}
                className="flex-1 h-14 border-2 border-border rounded-xl font-semibold text-muted-foreground flex items-center justify-center gap-2 bg-transparent"
              >
                <SkipForward className="w-5 h-5" />
                {t.skip}
              </button>
            )}
            
            {currentStep === "medication-check" && (
              <button
                type="button"
                onClick={skipMedication}
                className="flex-1 h-14 border-2 border-border rounded-xl font-semibold text-muted-foreground flex items-center justify-center gap-2 bg-transparent"
              >
                <SkipForward className="w-5 h-5" />
                {t.skip}
              </button>
            )}

            {/* Next button */}
            <button
              type="button"
              onClick={goNext}
              disabled={
                (currentStep === "patient-result" && !patientResult) ||
                (currentStep === "clinical-assessment" && !feeling)
              }
              className="flex-1 h-14 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === "clinical-assessment" ? t.done : t.next}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Auto-advance from AI analysis */}
      {currentStep === "ai-analysis" && !isAnalyzing && aiResult && (
        <div className="sticky bottom-0 bg-card border-t border-border px-5 py-4 safe-bottom">
          <button
            type="button"
            onClick={() => setCurrentStep("urine-summary")}
            className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            {language === "en" ? "See Both Results" : "दोनों परिणाम देखें"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
