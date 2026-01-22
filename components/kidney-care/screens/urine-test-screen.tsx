"use client"

import { useApp, getTranslations, type UrineTestResult } from "@/lib/app-context"
import { LargeButton } from "../large-button"
import { CameraUpload } from "../camera-upload"
import {
  ChevronLeft,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Send,
  Save,
  Clock,
  Droplets,
  Hand,
  Eye,
  Camera,
} from "lucide-react"
import { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"

type Step = "instructions" | "manual-result" | "capture" | "result"
type Result = "negative" | "trace" | "1+" | "2+" | "3+" | "4+"

const resultColors: Record<Result, { bg: string; text: string; border: string; color: string }> = {
  negative: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-400",
    color: "#FEF3C7",
  },
  trace: {
    bg: "bg-lime-50",
    text: "text-lime-700",
    border: "border-lime-400",
    color: "#ECFCCB",
  },
  "1+": {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-400",
    color: "#DCFCE7",
  },
  "2+": {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-400",
    color: "#CCFBF1",
  },
  "3+": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-400",
    color: "#DBEAFE",
  },
  "4+": {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-400",
    color: "#E0E7FF",
  },
}

const voiceLanguageMap: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  pa: "pa-IN",
}

export function UrineTestScreen() {
  const { language, setCurrentScreen, addUrineTest, isVoiceEnabled, setShowDailyCheckIn } = useApp()
  const t = getTranslations(language)

  const [step, setStep] = useState<Step>("instructions")
  const [currentInstruction, setCurrentInstruction] = useState(0)
  const [beforeImage, setBeforeImage] = useState("")
  const [afterImage, setAfterImage] = useState("")
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)
  const [finalResult, setFinalResult] = useState<Result | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  const instructions = [
    {
      icon: <Droplets className="w-10 h-10" />,
      title: t.step1,
      desc: t.step1Desc,
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: <Droplets className="w-10 h-10" />,
      title: t.step2,
      desc: t.step2Desc,
      color: "bg-amber-100 text-amber-600",
    },
    {
      icon: <Clock className="w-10 h-10" />,
      title: t.step3,
      desc: t.step3Desc,
      color: "bg-red-100 text-red-600",
    },
    {
      icon: <Hand className="w-10 h-10" />,
      title: t.step4,
      desc: t.step4Desc,
      color: "bg-green-100 text-green-600",
    },
    {
      icon: <Clock className="w-10 h-10" />,
      title: t.step5,
      desc: t.step5Desc,
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: <Eye className="w-10 h-10" />,
      title: t.step6,
      desc: t.step6Desc,
      color: "bg-teal-100 text-teal-600",
    },
  ]

  const results: { value: Result; label: string; color: string }[] = [
    { value: "negative", label: t.resultNegative, color: "#FDE68A" },
    { value: "trace", label: t.resultTrace, color: "#BEF264" },
    { value: "1+", label: t.result1Plus, color: "#86EFAC" },
    { value: "2+", label: t.result2Plus, color: "#5EEAD4" },
    { value: "3+", label: t.result3Plus, color: "#7DD3FC" },
    { value: "4+", label: t.result4Plus, color: "#A5B4FC" },
  ]

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (timerActive && timer < 60) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev >= 59) {
            setTimerActive(false)
            if (isVoiceEnabled) {
              speak(language === "hi" ? "60 सेकंड पूरे। अब रंग देखें।" : "60 seconds complete. Now check the color.")
            }
            return 60
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive, timer, isVoiceEnabled, language])

  const speak = useCallback(
    (text: string) => {
      if (!isVoiceEnabled || typeof window === "undefined") return
      window.speechSynthesis?.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = voiceLanguageMap[language] || "en-IN"
      utterance.rate = 0.85
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis?.speak(utterance)
    },
    [isVoiceEnabled, language]
  )

  const handleNextInstruction = () => {
    if (currentInstruction < instructions.length - 1) {
      setCurrentInstruction((prev) => prev + 1)
      if (isVoiceEnabled) {
        speak(instructions[currentInstruction + 1].desc)
      }
    } else {
      setStep("manual-result")
      if (isVoiceEnabled) {
        speak(t.whatColorDoYouSee)
      }
    }
  }

  const handlePrevInstruction = () => {
    if (currentInstruction > 0) {
      setCurrentInstruction((prev) => prev - 1)
    }
  }

  const startTimer = () => {
    setTimer(0)
    setTimerActive(true)
    if (isVoiceEnabled) {
      speak(language === "hi" ? "टाइमर शुरू। 60 सेकंड।" : "Timer started. 60 seconds.")
    }
  }

  const handleResultSelect = (result: Result) => {
    setSelectedResult(result)
    if (isVoiceEnabled) {
      const resultLabel = results.find((r) => r.value === result)?.label || result
      speak(resultLabel)
    }
  }

  const handleAnalyze = () => {
    if (!beforeImage || !afterImage) return

    setIsAnalyzing(true)
    // Simulate analysis
    setTimeout(() => {
      const mockResults: Result[] = ["negative", "trace", "1+", "2+", "3+", "4+"]
      const mockResult = mockResults[Math.floor(Math.random() * mockResults.length)]
      setFinalResult(mockResult)
      setIsAnalyzing(false)
      setStep("result")
      if (isVoiceEnabled) {
        const resultLabel = results.find((r) => r.value === mockResult)?.label || mockResult
        speak(resultLabel)
      }
    }, 2000)
  }

  const handleManualConfirm = () => {
    if (!selectedResult) return
    setFinalResult(selectedResult)
    setStep("result")
  }

  const handleSave = () => {
    if (!finalResult) return

    const testEntry: UrineTestResult = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      beforeImage,
      afterImage,
      result: finalResult,
      manualResult: !beforeImage && !afterImage,
    }
    addUrineTest(testEntry)
    
    // Go to medication check after saving
    setShowDailyCheckIn(true)
    setCurrentScreen("medication-check")
  }

  const handleBack = () => {
    if (step === "instructions") {
      if (currentInstruction > 0) {
        handlePrevInstruction()
      } else {
        setCurrentScreen("dashboard")
      }
    } else if (step === "manual-result") {
      setStep("instructions")
    } else if (step === "capture") {
      setStep("manual-result")
    } else {
      setStep("manual-result")
    }
  }

  const renderInstructions = () => {
    const instruction = instructions[currentInstruction]
    const isTimerStep = currentInstruction === 4

    return (
      <div className="flex-1 flex flex-col">
        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {instructions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full transition-all",
                i <= currentInstruction ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Instruction Card */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div
            className={cn(
              "w-28 h-28 rounded-full flex items-center justify-center mb-8",
              instruction.color
            )}
          >
            {instruction.icon}
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-4 text-center">
            {instruction.title}
          </h2>

          <p className="text-xl text-muted-foreground text-center mb-8 leading-relaxed max-w-md">
            {instruction.desc}
          </p>

          {/* Listen Button */}
          <button
            type="button"
            onClick={() => speak(instruction.desc)}
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-full border-2 transition-all mb-8",
              isSpeaking
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary/30 text-primary bg-primary/5"
            )}
          >
            <Volume2 className={cn("w-6 h-6", isSpeaking && "animate-pulse")} />
            <span className="text-lg font-semibold">{t.listen}</span>
          </button>

          {/* Timer for Step 5 */}
          {isTimerStep && (
            <div className="w-full max-w-sm mb-8">
              <div className="bg-card border-2 border-border rounded-2xl p-6 text-center">
                <div className="text-6xl font-bold text-primary mb-4">
                  {timer}s
                </div>
                <div className="w-full bg-muted rounded-full h-4 mb-4">
                  <div
                    className="bg-primary h-4 rounded-full transition-all"
                    style={{ width: `${(timer / 60) * 100}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={startTimer}
                  disabled={timerActive}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold text-xl transition-all",
                    timerActive
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {timerActive
                    ? language === "hi"
                      ? "चल रहा है..."
                      : "Running..."
                    : language === "hi"
                      ? "टाइमर शुरू करें"
                      : "Start 60s Timer"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="p-6 space-y-4">
          <button
            type="button"
            onClick={handleNextInstruction}
            className="w-full py-5 rounded-2xl bg-primary text-primary-foreground font-bold text-xl"
          >
            {currentInstruction < instructions.length - 1 ? t.next : t.done}
          </button>
        </div>
      </div>
    )
  }

  const renderManualResult = () => (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t.selectResult}</h2>
        <p className="text-lg text-muted-foreground">{t.whatColorDoYouSee}</p>
      </div>

      {/* Listen Button */}
      <button
        type="button"
        onClick={() => speak(t.whatColorDoYouSee)}
        className={cn(
          "mx-auto flex items-center gap-3 px-6 py-3 rounded-full border-2 transition-all mb-6",
          isSpeaking
            ? "border-primary bg-primary text-primary-foreground"
            : "border-primary/30 text-primary bg-primary/5"
        )}
      >
        <Volume2 className={cn("w-6 h-6", isSpeaking && "animate-pulse")} />
        <span className="text-lg font-semibold">{t.listen}</span>
      </button>

      {/* Result Options */}
      <div className="flex-1 px-4 space-y-3 overflow-y-auto">
        {results.map((result) => (
          <button
            key={result.value}
            type="button"
            onClick={() => handleResultSelect(result.value)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all min-h-[72px]",
              selectedResult === result.value
                ? "border-primary bg-primary/5 scale-[1.02] shadow-lg"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <div
              className="w-14 h-14 rounded-xl flex-shrink-0"
              style={{ backgroundColor: result.color }}
            />
            <div className="flex-1 text-left">
              <p className="text-xl font-bold text-card-foreground">{result.value}</p>
              <p className="text-base text-muted-foreground">{result.label}</p>
            </div>
            {selectedResult === result.value && (
              <CheckCircle2 className="w-8 h-8 text-primary flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Or Upload Photos */}
      <div className="px-6 py-4">
        <div className="text-center mb-4">
          <p className="text-muted-foreground">{t.orUploadPhotos}</p>
        </div>
        <button
          type="button"
          onClick={() => setStep("capture")}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/50 text-primary font-semibold text-lg flex items-center justify-center gap-3"
        >
          <Camera className="w-6 h-6" />
          {language === "hi" ? "फोटो से विश्लेषण करें" : "Analyze from Photos"}
        </button>
      </div>

      {/* Confirm Button */}
      <div className="p-6">
        <button
          type="button"
          onClick={handleManualConfirm}
          disabled={!selectedResult}
          className={cn(
            "w-full py-5 rounded-2xl font-bold text-xl transition-all",
            selectedResult
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {language === "hi" ? "परिणाम सहेजें" : "Confirm Result"}
        </button>
      </div>
    </div>
  )

  const renderCapture = () => (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {language === "hi" ? "फोटो लें" : "Take Photos"}
        </h2>
        <p className="text-lg text-muted-foreground">
          {language === "hi"
            ? "डुबोने से पहले और बाद की फोटो लें"
            : "Take photos before and after dipping"}
        </p>
      </div>

      <div className="flex-1 px-6 space-y-6">
        <CameraUpload
          label={t.uploadBefore}
          onImageCapture={setBeforeImage}
          imageUrl={beforeImage}
        />
        <CameraUpload
          label={t.uploadAfter}
          onImageCapture={setAfterImage}
          imageUrl={afterImage}
        />
      </div>

      <div className="p-6">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!beforeImage || !afterImage || isAnalyzing}
          className={cn(
            "w-full py-5 rounded-2xl font-bold text-xl transition-all",
            beforeImage && afterImage && !isAnalyzing
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {language === "hi" ? "विश्लेषण हो रहा है..." : "Analyzing..."}
            </span>
          ) : (
            t.analyze
          )}
        </button>
      </div>
    </div>
  )

  const renderResult = () => {
    if (!finalResult) return null

    const colors = resultColors[finalResult]
    const isNegative = finalResult === "negative"
    const resultInfo = results.find((r) => r.value === finalResult)

    return (
      <div className="flex-1 flex flex-col items-center px-6">
        {/* Result Icon */}
        <div
          className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center mb-6",
            colors.bg
          )}
        >
          {isNegative ? (
            <CheckCircle2 className={cn("w-16 h-16", colors.text)} />
          ) : (
            <AlertCircle className={cn("w-16 h-16", colors.text)} />
          )}
        </div>

        {/* Result Card */}
        <div
          className={cn(
            "w-full p-8 rounded-3xl border-4 mb-6",
            colors.border,
            colors.bg
          )}
        >
          <p className="text-center text-5xl font-bold text-foreground mb-4">
            {finalResult.toUpperCase()}
          </p>
          <p className="text-center text-xl text-muted-foreground">
            {resultInfo?.label}
          </p>
        </div>

        {/* Explanation */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 w-full">
          <p className="text-lg text-center text-card-foreground">
            {isNegative
              ? language === "hi"
                ? "अच्छी खबर! आपके मूत्र में कोई प्रोटीन नहीं पाया गया।"
                : "Good news! No protein detected in your urine."
              : language === "hi"
                ? "प्रोटीन पाया गया। कृपया अपने डॉक्टर से संपर्क करें।"
                : "Protein detected. Please consult your doctor."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-4 mt-auto pb-6">
          <LargeButton onClick={handleSave} variant="primary" icon={<Save />}>
            {t.saveResult}
          </LargeButton>
          <LargeButton variant="outline" icon={<Send />}>
            {t.sendToDoctor}
          </LargeButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4">
        <button
          type="button"
          onClick={handleBack}
          className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-foreground"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <h1 className="text-2xl font-bold text-foreground flex-1">
          {t.urineTestInstructions}
        </h1>
      </div>

      {/* Content */}
      {step === "instructions" && renderInstructions()}
      {step === "manual-result" && renderManualResult()}
      {step === "capture" && renderCapture()}
      {step === "result" && renderResult()}
    </div>
  )
}
