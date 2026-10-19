"use client"

import { useApp, getTranslations, type Medication } from "@/lib/app-context"
import {
  ChevronLeft,
  Volume2,
  Check,
  Plus,
  Pill,
  CheckCircle2,
  X,
  Mic,
} from "lucide-react"
import { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"

// Web Speech API types (browser built-in)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionAPI extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionAPI
    webkitSpeechRecognition: new () => SpeechRecognitionAPI
  }
}

const voiceLanguageMap: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  pa: "pa-IN",
}

export function MedicationCheckScreen() {
  const {
    language,
    setCurrentScreen,
    medications,
    toggleMedicationTakenYesterday,
    addMedication,
    isVoiceEnabled,
    patientProfile,
  } = useApp()
  const t = getTranslations(language)

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [newMedName, setNewMedName] = useState("")
  const [newMedDose, setNewMedDose] = useState("")
  const [isListening, setIsListening] = useState(false)

  const activeMedications = medications.filter(m => m.isActive)
  const today = new Date().toISOString().split('T')[0]
  const isTakenToday = (med: Medication) => med.takenDate === today && !!med.takenYesterday
  const takenCount = activeMedications.filter(isTakenToday).length

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

  useEffect(() => {
    if (isVoiceEnabled) {
      const greeting = patientProfile.name
        ? `${patientProfile.name.split(' ')[0]}, ${t.didYouTakeMedicines}`
        : t.didYouTakeMedicines
      speak(greeting)
    }
  }, [])

  const handleToggleMedication = (id: string, name: string) => {
    const med = medications.find(m => m.id === id)
    toggleMedicationTakenYesterday(id)
    if (isVoiceEnabled) {
      if (med && isTakenToday(med)) {
        speak(language === "hi" ? `${name} हटाया गया` : `${name} unmarked`)
      } else {
        speak(language === "hi" ? `${name} लिया गया` : `${name} taken`)
      }
    }
  }

  const handleAddExtraMedicine = () => {
    if (newMedName && newMedDose) {
      addMedication({
        id: `extra-${Date.now()}`,
        name: newMedName,
        dose: newMedDose,
        frequency: "asNeeded",
        route: "oral",
        startDate: new Date().toISOString().split("T")[0],
        takenToday: false,
        takenYesterday: true,
        takenDate: today,
        isActive: true,
        isCustom: true,
      })
      setNewMedName("")
      setNewMedDose("")
      setShowAddModal(false)
      if (isVoiceEnabled) {
        speak(language === "hi" ? `${newMedName} जोड़ा गया` : `${newMedName} added`)
      }
    }
  }

  const startVoiceInput = useCallback((field: "name" | "dose") => {
    if (typeof window === "undefined") return

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      alert("Voice input not supported in this browser")
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = voiceLanguageMap[language] || "en-IN"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0].transcript
      if (field === "name") {
        setNewMedName(result)
      } else {
        setNewMedDose(result)
      }
    }

    recognition.start()
  }, [language])

  const handleDone = () => {
    setShowSuccess(true)
    if (isVoiceEnabled) {
      speak(t.greatJob)
    }
    setTimeout(() => {
      setCurrentScreen("dashboard")
    }, 2000)
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="w-20 h-20 rounded-3xl bg-green-100 flex items-center justify-center mb-5 animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
          {t.allDone}
        </h1>
        <p className="text-base text-muted-foreground text-center">
          {t.greatJob}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
        <button
          type="button"
          onClick={() => setCurrentScreen("dashboard")}
          className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">{t.medicationReminder}</h1>
          <p className="text-sm text-muted-foreground">{t.didYouTakeMedicines}</p>
        </div>
        <button
          type="button"
          onClick={() => speak(t.markTakenMedicines)}
          className={cn(
            "w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all",
            isSpeaking
              ? "border-primary bg-primary text-primary-foreground"
              : "border-primary/30 text-primary"
          )}
        >
          <Volume2 className={cn("w-5 h-5", isSpeaking && "animate-pulse")} />
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-foreground">
            {takenCount} / {activeMedications.length} {language === "hi" ? "दवाइयाँ ली गईं" : "medicines taken"}
          </span>
          <span className="text-sm font-bold text-primary">
            {activeMedications.length > 0 ? Math.round((takenCount / activeMedications.length) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div
            className="bg-emerald-500 h-2.5 rounded-full transition-all"
            style={{
              width: `${activeMedications.length > 0 ? (takenCount / activeMedications.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Medication List */}
      <div className="flex-1 px-5 py-3 space-y-2 overflow-y-auto">
        {activeMedications.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-base text-muted-foreground">{t.noActiveMedications}</p>
          </div>
        ) : (
          activeMedications.map((med) => (
            <button
              key={med.id}
              type="button"
              onClick={() => handleToggleMedication(med.id, med.name)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all min-h-[64px]",
                isTakenToday(med)
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                  isTakenToday(med)
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isTakenToday(med) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Pill className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-bold text-card-foreground">{med.name}</p>
                <p className="text-xs text-muted-foreground">
                  {med.dose} · {med.frequency === "onceDaily" ? t.onceDaily :
                               med.frequency === "twiceDaily" ? t.twiceDaily :
                               med.frequency === "thriceDaily" ? t.thriceDaily :
                               med.frequency === "alternateDays" ? t.alternateDays :
                               med.frequency}
                </p>
              </div>
              {isTakenToday(med) && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              )}
            </button>
          ))
        )}
      </div>

      {/* Add Extra Medicine + Done */}
      <div className="px-5 pb-5 pt-2 space-y-2">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-primary/50 text-primary font-semibold text-sm"
        >
          <Plus className="w-5 h-5" />
          {t.addExtraMedicine}
        </button>
        <button
          type="button"
          onClick={handleDone}
          className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base"
        >
          {t.done}
        </button>
      </div>

      {/* Add Extra Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-lg bg-background rounded-t-3xl p-6 animate-slide-up safe-bottom">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {t.addExtraMedicine}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Medicine Name */}
            <div className="mb-4">
              <label className="text-lg font-semibold text-foreground mb-2 block">
                {t.medicationName}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder={t.typeHere}
                  className="flex-1 min-h-[60px] px-5 py-3 text-xl border-2 border-border rounded-2xl bg-card"
                />
                <button
                  type="button"
                  onClick={() => startVoiceInput("name")}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <Mic className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Dosage */}
            <div className="mb-6">
              <label className="text-lg font-semibold text-foreground mb-2 block">
                {t.dosage}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMedDose}
                  onChange={(e) => setNewMedDose(e.target.value)}
                  placeholder={t.dosagePlaceholder}
                  className="flex-1 min-h-[60px] px-5 py-3 text-xl border-2 border-border rounded-2xl bg-card"
                />
                <button
                  type="button"
                  onClick={() => startVoiceInput("dose")}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <Mic className="w-6 h-6" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddExtraMedicine}
              disabled={!newMedName || !newMedDose}
              className={cn(
                "w-full py-5 rounded-2xl font-bold text-xl transition-all",
                newMedName && newMedDose
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {t.addMedication}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
