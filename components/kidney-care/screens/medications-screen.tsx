"use client"

import { useApp, getTranslations } from "@/lib/app-context"
import { LargeButton } from "../large-button"
import { AssistantBubble } from "../assistant-bubble"
import { AssistantAvatar } from "../assistant-avatar"
import { FloatingAssistant } from "../floating-assistant"
import {
  ChevronLeft,
  Check,
  Pill,
  Bell,
  Clock,
  X,
  Volume2,
  Plus,
} from "lucide-react"
import { useState, useCallback, useEffect } from "react"

// Voice language mapping
const voiceLanguageMap: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  pa: "pa-IN",
}

interface ReminderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (time: string) => void
  medicineName: string
  language: string
}

function ReminderModal({ isOpen, onClose, onSave, medicineName, language }: ReminderModalProps) {
  const [hour, setHour] = useState("08")
  const [minute, setMinute] = useState("00")
  const [period, setPeriod] = useState<"AM" | "PM">("AM")

  if (!isOpen) return null

  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  )
  const minutes = ["00", "15", "30", "45"]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-card-foreground">
            {language === "en" ? "Set Reminder" : "रिमाइंडर सेट करें"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        <p className="text-lg text-muted-foreground mb-6">
          {language === "en" ? "Reminder for" : "रिमाइंडर के लिए"}{" "}
          <span className="font-bold text-card-foreground">{medicineName}</span>
        </p>

        {/* Time picker - simplified for low literacy */}
        <div className="flex items-center justify-center gap-6 mb-8">
          {/* Hour */}
          <div className="flex flex-col items-center">
            <select
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="w-24 h-20 text-4xl font-bold text-center bg-muted rounded-2xl border-0 text-card-foreground"
            >
              {hours.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="text-base text-muted-foreground mt-2">
              {language === "en" ? "Hour" : "घंटा"}
            </span>
          </div>

          <span className="text-4xl font-bold text-card-foreground">:</span>

          {/* Minute */}
          <div className="flex flex-col items-center">
            <select
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className="w-24 h-20 text-4xl font-bold text-center bg-muted rounded-2xl border-0 text-card-foreground"
            >
              {minutes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span className="text-base text-muted-foreground mt-2">
              {language === "en" ? "Min" : "मिनट"}
            </span>
          </div>

          {/* AM/PM */}
          <div className="flex flex-col gap-3">
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
                  period === p
                    ? "bg-primary text-primary-foreground scale-105"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <LargeButton
          onClick={() => onSave(`${hour}:${minute} ${period}`)}
          variant="primary"
          className="text-xl py-5"
        >
          <Bell className="w-6 h-6 mr-2" />
          {language === "en" ? "Set Reminder" : "रिमाइंडर सेट करें"}
        </LargeButton>
      </div>
    </div>
  )
}

export function MedicationsScreen() {
  const { language, setCurrentScreen, medications, toggleMedicationTaken, isVoiceEnabled } = useApp()
  const t = getTranslations(language)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const [reminderModal, setReminderModal] = useState<{
    isOpen: boolean
    medicineId: string
    medicineName: string
  }>({
    isOpen: false,
    medicineId: "",
    medicineName: "",
  })

  const [reminders, setReminders] = useState<Record<string, string>>({})

  // Text-to-speech function
  const speak = useCallback((text: string) => {
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
  }, [language])

  // Speak instructions on mount
  useEffect(() => {
    if (isVoiceEnabled) {
      const timer = setTimeout(() => {
        const msg = language === "en"
          ? "Check off the medicines you have taken today. Tap on each medicine to mark it as taken."
          : "आज जो दवाइयाँ आपने ली हैं उन पर टिक करें। प्रत्येक दवाई पर टैप करें।"
        speak(msg)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleSetReminder = (time: string) => {
    setReminders((prev) => ({
      ...prev,
      [reminderModal.medicineId]: time,
    }))
    setReminderModal({ isOpen: false, medicineId: "", medicineName: "" })
    if (isVoiceEnabled) {
      speak(language === "en" ? `Reminder set for ${time}` : `रिमाइंडर ${time} के लिए सेट किया गया`)
    }
  }

  const handleMedicationToggle = (medId: string, medName: string, currentlyTaken: boolean) => {
    toggleMedicationTaken(medId)
    if (isVoiceEnabled) {
      const msg = currentlyTaken
        ? language === "en" ? `${medName} unmarked` : `${medName} अनमार्क किया`
        : language === "en" ? `${medName} taken. Good job!` : `${medName} ली गई। बहुत अच्छा!`
      speak(msg)
    }
  }

  const allTaken = medications.every((m) => m.takenToday)
  const takenCount = medications.filter((m) => m.takenToday).length

  return (
    <div className="min-h-screen flex flex-col pb-32 safe-top safe-bottom bg-gradient-to-b from-background to-muted/10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentScreen("dashboard")}
            className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
            aria-label={t.back}
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">{t.checkMedicines}</h1>
            <p className="text-sm text-muted-foreground">
              {takenCount}/{medications.length} {language === "en" ? "taken" : "ली गई"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => speak(language === "en" 
              ? "Tap on each medicine to mark it as taken. Green means you have taken it."
              : "प्रत्येक दवाई पर टैप करें। हरा मतलब आपने ले ली है।"
            )}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isSpeaking 
                ? "bg-primary text-primary-foreground animate-pulse" 
                : "bg-primary/10 text-primary"
            }`}
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 py-4">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${medications.length > 0 ? (takenCount / medications.length) * 100 : 0}%` }}
          />
        </div>
        {allTaken && medications.length > 0 && (
          <div className="mt-3 p-4 bg-emerald-50 rounded-2xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-emerald-800">
                {language === "en" ? "All medicines taken!" : "सभी दवाइयाँ ली गईं!"}
              </p>
              <p className="text-sm text-emerald-600">
                {language === "en" ? "Great job today!" : "आज बहुत अच्छा!"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Assistant */}
      <div className="px-5 mb-4">
        <button
          type="button"
          onClick={() => {
            const msg = allTaken
              ? language === "en" ? "Great! You have taken all your medicines today!" : "बहुत अच्छा! आपने आज सभी दवाइयाँ ले ली हैं!"
              : language === "en" ? "Tap on each medicine card to mark it as taken" : "प्रत्येक दवाई कार्ड पर टैप करें"
            speak(msg)
          }}
          className="w-full flex items-start gap-4 bg-card rounded-2xl p-4 border border-border shadow-sm active:scale-[0.99]"
        >
          <AssistantAvatar size="sm" />
          <div className="flex-1 text-left">
            <p className="text-lg text-card-foreground leading-relaxed">
              {allTaken
                ? language === "en"
                  ? "Great! You've taken all your medicines today!"
                  : "बहुत अच्छा! आपने आज सभी दवाइयाँ ले ली हैं!"
                : language === "en"
                  ? "Tap on each medicine to mark as taken"
                  : "दवाई पर टैप करें"}
            </p>
            <p className="text-sm text-primary mt-1 flex items-center gap-1">
              <Volume2 className="w-4 h-4" />
              {language === "en" ? "Tap to listen" : "सुनने के लिए टैप करें"}
            </p>
          </div>
        </button>
      </div>

      {/* Medication list */}
      <div className="flex-1 px-5 space-y-4">
        {medications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <Pill className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-xl font-semibold text-foreground mb-2">
              {language === "en" ? "No medicines added" : "कोई दवाई नहीं जोड़ी गई"}
            </p>
            <p className="text-lg text-muted-foreground text-center mb-6">
              {language === "en" 
                ? "Add your medicines to track them" 
                : "अपनी दवाइयों को ट्रैक करने के लिए जोड़ें"}
            </p>
            <LargeButton
              onClick={() => setCurrentScreen("patient-onboarding")}
              fullWidth={false}
              className="px-8"
            >
              <Plus className="w-5 h-5 mr-2" />
              {language === "en" ? "Add Medicines" : "दवाइयाँ जोड़ें"}
            </LargeButton>
          </div>
        ) : (
          medications.map((med) => (
            <div
              key={med.id}
              className={`bg-card rounded-2xl border-3 overflow-hidden transition-all duration-300 ${
                med.takenToday 
                  ? "border-emerald-500 bg-emerald-50/50" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Main card content */}
              <button
                type="button"
                onClick={() => handleMedicationToggle(med.id, med.name, med.takenToday)}
                className="w-full p-5 flex items-center gap-5 text-left active:scale-[0.98] transition-transform"
              >
                {/* Checkbox */}
                <div
                  className={`w-14 h-14 rounded-2xl border-3 flex items-center justify-center shrink-0 transition-all duration-300 ${
                    med.takenToday
                      ? "bg-emerald-500 border-emerald-500 scale-110"
                      : "border-muted-foreground bg-transparent"
                  }`}
                >
                  {med.takenToday && (
                    <Check className="w-8 h-8 text-white" />
                  )}
                </div>

                {/* Medicine info */}
                <div className="flex-1">
                  <p
                    className={`text-2xl font-bold transition-all ${
                      med.takenToday
                        ? "text-emerald-700 line-through"
                        : "text-card-foreground"
                    }`}
                  >
                    {med.name}
                  </p>
                  <p className="text-lg text-muted-foreground mt-1">{med.dose}</p>
                  {reminders[med.id] && (
                    <p className="text-base text-primary flex items-center gap-2 mt-2">
                      <Clock className="w-5 h-5" />
                      {reminders[med.id]}
                    </p>
                  )}
                </div>

                {/* Pill icon */}
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                    med.takenToday ? "bg-emerald-100" : "bg-primary/10"
                  }`}
                >
                  <Pill
                    className={`w-8 h-8 ${
                      med.takenToday ? "text-emerald-600" : "text-primary"
                    }`}
                  />
                </div>
              </button>

              {/* Reminder button */}
              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={() =>
                    setReminderModal({
                      isOpen: true,
                      medicineId: med.id,
                      medicineName: med.name,
                    })
                  }
                  className="w-full py-4 px-5 rounded-2xl bg-muted flex items-center justify-center gap-3 text-muted-foreground hover:bg-muted/80 transition-colors min-h-[56px]"
                >
                  <Bell className="w-6 h-6" />
                  <span className="font-semibold text-lg">{t.setReminder}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Done button */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-4 bg-gradient-to-t from-background via-background to-transparent">
        <LargeButton
          onClick={() => {
            if (allTaken && isVoiceEnabled) {
              speak(language === "en" ? "All medicines taken! Good job!" : "सभी दवाइयाँ ली गईं! बहुत अच्छा!")
            }
            setCurrentScreen("dashboard")
          }}
          variant={allTaken ? "success" : "primary"}
          className="text-xl py-5"
        >
          {allTaken ? (
            <>
              <Check className="w-6 h-6 mr-2" />
              {language === "en" ? "All Done!" : "सब हो गया!"}
            </>
          ) : (
            <>
              <ChevronLeft className="w-6 h-6 mr-2" />
              {t.back}
            </>
          )}
        </LargeButton>
      </div>

      {/* Reminder modal */}
      <ReminderModal
        isOpen={reminderModal.isOpen}
        onClose={() =>
          setReminderModal({ isOpen: false, medicineId: "", medicineName: "" })
        }
        onSave={handleSetReminder}
        medicineName={reminderModal.medicineName}
        language={language}
      />

      <FloatingAssistant />
    </div>
  )
}
