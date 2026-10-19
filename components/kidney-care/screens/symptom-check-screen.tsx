"use client"

import { useApp, getTranslations, type SymptomEntry } from "@/lib/app-context"
import { LargeButton } from "../large-button"
import { AssistantBubble } from "../assistant-bubble"
import { AssistantAvatar } from "../assistant-avatar"
import { ChevronLeft, Camera, Check } from "lucide-react"
import { useState } from "react"
import { CameraUpload } from "../camera-upload"

type Feeling = "very-good" | "okay" | "not-well"
type Step = "feeling" | "swelling" | "fever" | "vomiting" | "breathing" | "done"

const feelingEmojis: Record<Feeling, string> = {
  "very-good": ":-)",
  okay: ":-|",
  "not-well": ":-(",
}

export function SymptomCheckScreen() {
  const { language, setCurrentScreen, addSymptomEntry } = useApp()
  const t = getTranslations(language)

  const [step, setStep] = useState<Step>("feeling")
  const [feeling, setFeeling] = useState<Feeling | null>(null)
  const [symptoms, setSymptoms] = useState({
    swelling: false,
    fever: false,
    vomiting: false,
    breathingDifficulty: false,
  })
  const [symptomPhotos, setSymptomPhotos] = useState<Record<string, string>>({})

  const handleFeelingSelect = (selected: Feeling) => {
    setFeeling(selected)
    if (selected === "very-good") {
      // Skip symptom questions if feeling very good
      saveAndFinish(selected, {
        swelling: false,
        fever: false,
        vomiting: false,
        breathingDifficulty: false,
      })
    } else {
      setStep("swelling")
    }
  }

  const handleSymptomAnswer = (symptom: keyof typeof symptoms, value: boolean) => {
    setSymptoms((prev) => ({ ...prev, [symptom]: value }))

    const nextStep: Record<Step, Step> = {
      feeling: "swelling",
      swelling: "fever",
      fever: "vomiting",
      vomiting: "breathing",
      breathing: "done",
      done: "done",
    }

    if (step === "breathing") {
      saveAndFinish(feeling!, { ...symptoms, breathingDifficulty: value })
    } else {
      setStep(nextStep[step])
    }
  }

  const saveAndFinish = (
    finalFeeling: Feeling,
    finalSymptoms: typeof symptoms
  ) => {
    const entry: SymptomEntry = {
      date: new Date().toISOString(),
      feeling: finalFeeling,
      symptoms: finalSymptoms,
    }
    addSymptomEntry(entry)
    setStep("done")
  }

  const renderFeelingStep = () => (
    <div className="flex-1 flex flex-col">
      <div className="mb-8 flex items-start gap-4">
        <AssistantAvatar size="md" />
        <AssistantBubble className="flex-1">
          <p className="text-xl font-medium">{t.howAreYouFeeling}</p>
        </AssistantBubble>
      </div>

      <div className="space-y-4">
        {(["very-good", "okay", "not-well"] as Feeling[]).map((option) => (
          <LargeButton
            key={option}
            onClick={() => handleFeelingSelect(option)}
            variant={
              option === "very-good"
                ? "success"
                : option === "okay"
                  ? "warning"
                  : "destructive"
            }
            icon={
              <span className="text-3xl font-mono">{feelingEmojis[option]}</span>
            }
          >
            {option === "very-good"
              ? t.veryGood
              : option === "okay"
                ? t.okay
                : t.notWell}
          </LargeButton>
        ))}
      </div>
    </div>
  )

  const renderSymptomQuestion = (
    question: string,
    symptomKey: keyof typeof symptoms,
    showCamera = false
  ) => (
    <div className="flex-1 flex flex-col">
      <div className="mb-8 flex items-start gap-4">
        <AssistantAvatar size="md" />
        <AssistantBubble className="flex-1">
          <p className="text-xl font-medium">{question}</p>
        </AssistantBubble>
      </div>

      {showCamera && (
        <div className="mb-6">
          <CameraUpload
            label={
              language === "en"
                ? "Take photo (optional)"
                : language === "hi"
                  ? "फोटो लें (वैकल्पिक)"
                  : "Take photo"
            }
            onImageCapture={(url) =>
              setSymptomPhotos((prev) => ({ ...prev, [symptomKey]: url }))
            }
            imageUrl={symptomPhotos[symptomKey]}
          />
        </div>
      )}

      <div className="space-y-4 mt-auto">
        <LargeButton
          onClick={() => handleSymptomAnswer(symptomKey, true)}
          variant="destructive"
        >
          {t.yes}
        </LargeButton>
        <LargeButton
          onClick={() => handleSymptomAnswer(symptomKey, false)}
          variant="success"
        >
          {t.no}
        </LargeButton>
      </div>
    </div>
  )

  const renderDoneStep = () => (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6">
        <Check className="w-12 h-12 text-success" />
      </div>

      <AssistantBubble className="mb-8 text-center">
        <p className="text-xl font-medium">
          {language === "en"
            ? "Thank you! Your symptoms have been recorded."
            : language === "hi"
              ? "धन्यवाद! आपके लक्षण दर्ज कर लिए गए हैं।"
              : language === "bn"
                ? "ধন্যবাদ! আপনার লক্ষণ রেকর্ড করা হয়েছে।"
                : language === "ta"
                  ? "நன்றி! உங்கள் அறிகுறிகள் பதிவு செய்யப்பட்டுள்ளன."
                  : "ਧੰਨਵਾਦ! ਤੁਹਾਡੇ ਲੱਛਣ ਦਰਜ ਕੀਤੇ ਗਏ ਹਨ।"}
        </p>
      </AssistantBubble>

      <LargeButton onClick={() => setCurrentScreen("dashboard")} variant="primary">
        {t.back}
      </LargeButton>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          type="button"
          onClick={() => {
            if (step === "feeling") {
              setCurrentScreen("dashboard")
            } else {
              const prevSteps: Record<Step, Step> = {
                feeling: "feeling",
                swelling: "feeling",
                fever: "swelling",
                vomiting: "fever",
                breathing: "vomiting",
                done: "done",
              }
              setStep(prevSteps[step])
            }
          }}
          className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors touch-target"
          aria-label={t.back}
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      </div>

      {/* Progress indicator */}
      {step !== "done" && (
        <div className="flex gap-2 mb-8">
          {["feeling", "swelling", "fever", "vomiting", "breathing"].map(
            (s, i) => {
              const steps = ["feeling", "swelling", "fever", "vomiting", "breathing"]
              const currentIndex = steps.indexOf(step)
              return (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    i <= currentIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              )
            }
          )}
        </div>
      )}

      {/* Content based on step */}
      {step === "feeling" && renderFeelingStep()}
      {step === "swelling" && renderSymptomQuestion(t.swelling, "swelling", true)}
      {step === "fever" && renderSymptomQuestion(t.fever, "fever")}
      {step === "vomiting" && renderSymptomQuestion(t.vomiting, "vomiting")}
      {step === "breathing" &&
        renderSymptomQuestion(t.breathingDifficulty, "breathingDifficulty")}
      {step === "done" && renderDoneStep()}
    </div>
  )
}
