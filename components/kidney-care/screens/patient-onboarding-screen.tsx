"use client"

import React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { useApp, getTranslations, type NephroticSyndromeCategory } from "@/lib/app-context"
import { LargeButton } from "../large-button"
import {
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Scale,
  Ruler,
  Stethoscope,
  Pill,
  Heart,
  Mic,
  MicOff,
  Upload,
  Plus,
  X,
  Check,
  Camera,
  Clock,
  Bell,
} from "lucide-react"
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

type OnboardingStep =
  | "welcome"
  | "name"
  | "dob"
  | "weight"
  | "height"
  | "sex"
  | "diagnosis"
  | "medications"
  | "reminder"

const TOTAL_STEPS = 9

const voiceLanguageMap: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  pa: "pa-IN",
}

interface StepIconProps {
  icon: React.ReactNode
  color: string
  bgColor: string
  pulse?: boolean
}

function StepIcon({ icon, color, bgColor, pulse }: StepIconProps) {
  return (
    <div
      className={cn(
        "w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 transition-transform duration-300",
        bgColor,
        pulse && "animate-pulse"
      )}
    >
      <div className={cn("w-14 h-14", color)}>{icon}</div>
    </div>
  )
}

interface ProgressDotsProps {
  currentStep: number
  totalSteps: number
}

function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            "w-3 h-3 rounded-full transition-all duration-500",
            i < currentStep
              ? "bg-primary scale-100"
              : i === currentStep
                ? "bg-primary scale-125 ring-4 ring-primary/30"
                : "bg-muted"
          )}
        />
      ))}
    </div>
  )
}

interface ListenButtonProps {
  onClick: () => void
  label: string
  isPlaying?: boolean
}

function ListenButton({ onClick, label, isPlaying }: ListenButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 transition-all duration-300 min-h-[52px]",
        isPlaying
          ? "border-primary bg-primary text-primary-foreground scale-105"
          : "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
      )}
    >
      <Volume2 className={cn("w-6 h-6", isPlaying && "animate-pulse")} />
      <span className="text-lg font-semibold">{label}</span>
    </button>
  )
}

interface VoiceMicButtonProps {
  isListening: boolean
  onToggle: () => void
}

function VoiceMicButton({ isListening, onToggle }: VoiceMicButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
        isListening
          ? "bg-red-500 text-white animate-pulse scale-110"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      )}
    >
      <Mic className="w-7 h-7" />
    </button>
  )
}

export function PatientOnboardingScreen() {
  const {
    language,
    patientProfile,
    updatePatientProfile,
    setCurrentScreen,
    setHasCompletedPatientProfile,
    medications,
    addMedication,
    removeMedication,
    isVoiceEnabled,
    setIsVoiceEnabled,
  } = useApp()
  const t = getTranslations(language)

  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")
  const [showMedicationModal, setShowMedicationModal] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showCustomFrequency, setShowCustomFrequency] = useState(false)
  const [customFrequency, setCustomFrequency] = useState("")
  const [showOtherMedInput, setShowOtherMedInput] = useState(false)
  const [customMedName, setCustomMedName] = useState("")
  const [newMedication, setNewMedication] = useState({
    name: "",
    dose: "",
    frequency: "",
    route: "",
    startDate: "",
    prescriptionImage: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const stepOrder: OnboardingStep[] = [
    "welcome",
    "name",
    "dob",
    "weight",
    "height",
    "sex",
    "diagnosis",
    "medications",
    "reminder",
  ]

  const currentStepIndex = stepOrder.indexOf(currentStep)

  const speak = useCallback(
    (text: string) => {
      if (!isVoiceEnabled || typeof window === "undefined") return

      window.speechSynthesis?.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = voiceLanguageMap[language] || "en-IN"
      utterance.rate = 0.85
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis?.speak(utterance)
    },
    [isVoiceEnabled, language]
  )

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel()
      setIsSpeaking(false)
    }
  }, [])

  const getStepInstruction = useCallback(() => {
    switch (currentStep) {
      case "welcome":
        return `${t.welcomeProfile}. ${t.letsSetupProfile}`
      case "name":
        return `${t.whatIsYourName}. ${t.enterFullName}`
      case "dob":
        return `${t.whenWereYouBorn}. ${t.selectDOB}`
      case "weight":
        return `${t.whatIsYourWeight}. ${t.enterWeightKg}`
      case "height":
        return `${t.whatIsYourHeight}. ${t.enterHeightCm}`
      case "sex":
        return `${t.whatIsYourSex}. ${t.selectSex}`
      case "diagnosis":
        return `${t.whatIsYourDiagnosis}. ${t.selectNSType}`
      case "medications":
        return `${t.medicationManagement}. ${t.manageYourMedications}`
      case "reminder":
        return `${t.setDailyReminder}. ${t.whenToRemind}`
      default:
        return ""
    }
  }, [currentStep, t])

  useEffect(() => {
    if (isVoiceEnabled) {
      const timer = setTimeout(() => {
        speak(getStepInstruction())
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentStep, isVoiceEnabled, speak, getStepInstruction])

  const startVoiceInput = useCallback(
    (field: "name" | "weight" | "height" | "dose" | "medName" | "customFreq") => {
      if (typeof window === "undefined") return

      const SpeechRecognitionAPI =
        (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
        (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition

      if (!SpeechRecognitionAPI) {
        alert("Voice input is not supported in this browser")
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
          updatePatientProfile({ name: result })
        } else if (field === "weight") {
          const num = parseFloat(result.replace(/[^\d.]/g, ""))
          if (!isNaN(num)) updatePatientProfile({ weight: num })
        } else if (field === "height") {
          const num = parseFloat(result.replace(/[^\d.]/g, ""))
          if (!isNaN(num)) updatePatientProfile({ height: num })
        } else if (field === "dose") {
          setNewMedication((prev) => ({ ...prev, dose: result }))
        } else if (field === "medName") {
          setCustomMedName(result)
        } else if (field === "customFreq") {
          setCustomFrequency(result)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    },
    [language, updatePatientProfile]
  )

  const stopVoiceInput = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const goToNextStep = useCallback(() => {
    stopSpeaking()
    const nextIndex = currentStepIndex + 1
    if (nextIndex < stepOrder.length) {
      setCurrentStep(stepOrder[nextIndex])
    }
  }, [currentStepIndex, stepOrder, stopSpeaking])

  const goToPreviousStep = useCallback(() => {
    stopSpeaking()
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(stepOrder[prevIndex])
    }
  }, [currentStepIndex, stepOrder, stopSpeaking])

  const handleFinish = () => {
    stopSpeaking()
    setHasCompletedPatientProfile(true)
    setCurrentScreen("dashboard")
  }

  const handleAddMedication = () => {
    const medName = showOtherMedInput ? customMedName : newMedication.name
    const freq = showCustomFrequency ? customFrequency : newMedication.frequency
    
    if (medName && newMedication.dose) {
      addMedication({
        id: Date.now().toString(),
        name: medName,
        dose: newMedication.dose,
        frequency: freq || "onceDaily",
        route: newMedication.route || "oral",
        startDate: newMedication.startDate || new Date().toISOString().split("T")[0],
        prescriptionImage: newMedication.prescriptionImage,
        takenToday: false,
        isActive: true,
        isCustom: showOtherMedInput,
      })
      setNewMedication({
        name: "",
        dose: "",
        frequency: "",
        route: "",
        startDate: "",
        prescriptionImage: "",
      })
      setCustomMedName("")
      setCustomFrequency("")
      setShowOtherMedInput(false)
      setShowCustomFrequency(false)
      setShowMedicationModal(false)
      if (isVoiceEnabled) {
        speak(language === "hi" ? `${medName} जोड़ा गया` : `${medName} added`)
      }
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewMedication((prev) => ({
          ...prev,
          prescriptionImage: reader.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const calculateAge = (dob: string) => {
    if (!dob) return 0
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const commonMeds = [
    "Prednisolone",
    "Tacrolimus",
    "Cyclosporine",
    "Mycophenolate",
    "Rituximab",
    "Levamisole",
    "ACE Inhibitor",
    "ARB",
    "Furosemide",
    "Atorvastatin",
    "Calcium",
    "Vitamin D",
  ]

  const frequencies = [
    { value: "onceDaily", label: t.onceDaily },
    { value: "twiceDaily", label: t.twiceDaily },
    { value: "thriceDaily", label: t.thriceDaily },
    { value: "alternateDays", label: t.alternateDays },
    { value: "weekly", label: t.weekly },
    { value: "asNeeded", label: t.asNeeded },
    { value: "other", label: t.otherFrequency },
  ]

  const routes = [
    { value: "oral", label: t.oral },
    { value: "injection", label: t.injection },
    { value: "topical", label: t.topical },
    { value: "other", label: t.otherRoute },
  ]

  const renderStepContent = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
            <StepIcon
              icon={<Heart className="w-full h-full" />}
              color="text-primary"
              bgColor="bg-primary/10"
              pulse={isSpeaking}
            />
            <h1 className="text-4xl font-bold text-foreground mb-4 text-center text-balance">
              {t.welcomeProfile}
            </h1>
            <p className="text-2xl text-muted-foreground text-center mb-8 leading-relaxed">
              {t.letsSetupProfile}
            </p>
            <ListenButton
              label={t.listen}
              onClick={() => speak(getStepInstruction())}
              isPlaying={isSpeaking}
            />
          </div>
        )

      case "name":
        return (
          <div className="flex-1 flex flex-col items-center px-6 py-6">
            <StepIcon
              icon={<User className="w-full h-full" />}
              color="text-emerald-500"
              bgColor="bg-emerald-50"
              pulse={isSpeaking}
            />
            <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
              {t.whatIsYourName}
            </h1>
            <p className="text-xl text-muted-foreground text-center mb-4">
              {t.enterFullName}
            </p>
            <ListenButton
              label={t.listen}
              onClick={() => speak(getStepInstruction())}
              isPlaying={isSpeaking}
            />
            <div className="w-full mt-6">
              <div className="relative flex items-center gap-3">
                <input
                  type="text"
                  value={patientProfile.name}
                  onChange={(e) => updatePatientProfile({ name: e.target.value })}
                  placeholder={t.typeName}
                  className="flex-1 min-h-[64px] px-6 py-4 text-xl border-2 border-border rounded-2xl bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                />
                <VoiceMicButton
                  isListening={isListening}
                  onToggle={isListening ? stopVoiceInput : () => startVoiceInput("name")}
                />
              </div>
              <p className="text-center text-muted-foreground mt-3">{t.tapToSpeak}</p>
              {patientProfile.name && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl flex items-center gap-3">
                  <Check className="w-6 h-6 text-emerald-600" />
                  <span className="text-lg text-emerald-800 font-medium">
                    {patientProfile.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )

      case "dob":
        return (
          <div className="flex-1 flex flex-col items-center px-6 py-6">
            <StepIcon
              icon={<Calendar className="w-full h-full" />}
              color="text-violet-500"
              bgColor="bg-violet-50"
              pulse={isSpeaking}
            />
            <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
              {t.whenWereYouBorn}
            </h1>
            <p className="text-xl text-muted-foreground text-center mb-4">
              {t.selectDOB}
            </p>
            <ListenButton
              label={t.listen}
              onClick={() => speak(getStepInstruction())}
              isPlaying={isSpeaking}
            />
            <div className="w-full mt-6">
              <input
                type="date"
                value={patientProfile.dateOfBirth}
                onChange={(e) => {
                  const dob = e.target.value
                  const age = calculateAge(dob)
                  updatePatientProfile({ dateOfBirth: dob, age })
                  if (isVoiceEnabled && age > 0) {
                    speak(`${age} ${language === "en" ? "years old" : "साल"}`)
                  }
                }}
                className="w-full min-h-[64px] px-6 py-4 text-xl border-2 border-border rounded-2xl bg-card text-card-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
              />
              {patientProfile.age > 0 && (
                <div className="mt-4 p-4 bg-violet-50 rounded-xl flex items-center justify-center gap-3">
                  <span className="text-3xl font-bold text-violet-700">
                    {patientProfile.age}
                  </span>
                  <span className="text-xl text-violet-600">
                    {language === "en" ? "years old" : "साल"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )

      case "weight":
        return (
          <div className="flex-1 flex flex-col items-center px-6 py-6">
            <StepIcon
              icon={<Scale className="w-full h-full" />}
              color="text-amber-500"
              bgColor="bg-amber-50"
              pulse={isSpeaking}
            />
            <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
              {t.whatIsYourWeight}
            </h1>
            <p className="text-xl text-muted-foreground text-center mb-4">
              {t.enterWeightKg}
            </p>
            <ListenButton
              label={t.listen}
              onClick={() => speak(getStepInstruction())}
              isPlaying={isSpeaking}
            />
            <div className="w-full mt-6">
              <div className="relative flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={patientProfile.weight || ""}
                    onChange={(e) =>
                      updatePatientProfile({ weight: Number(e.target.value) })
                    }
                    placeholder={t.weightKg}
                    className="w-full min-h-[64px] px-6 py-4 text-2xl font-semibold border-2 border-border rounded-2xl bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 pr-20"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl text-muted-foreground font-medium">
                    {t.kg}
                  </span>
                </div>
                <VoiceMicButton
                  isListening={isListening}
                  onToggle={isListening ? stopVoiceInput : () => startVoiceInput("weight")}
                />
              </div>
              <p className="text-center text-muted-foreground mt-3">{t.tapToSpeak}</p>
            </div>
          </div>
        )

      case "height":
        return (
          <div className="flex-1 flex flex-col items-center px-6 py-6">
            <StepIcon
              icon={<Ruler className="w-full h-full" />}
              color="text-teal-500"
              bgColor="bg-teal-50"
              pulse={isSpeaking}
            />
            <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
              {t.whatIsYourHeight}
            </h1>
            <p className="text-xl text-muted-foreground text-center mb-4">
              {t.enterHeightCm}
            </p>
            <ListenButton
              label={t.listen}
              onClick={() => speak(getStepInstruction())}
              isPlaying={isSpeaking}
            />
            <div className="w-full mt-6">
              <div className="relative flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={patientProfile.height || ""}
                    onChange={(e) =>
                      updatePatientProfile({ height: Number(e.target.value) })
                    }
                    placeholder={t.heightCm}
                    className="w-full min-h-[64px] px-6 py-4 text-2xl font-semibold border-2 border-border rounded-2xl bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 pr-20"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl text-muted-foreground font-medium">
                    {t.cm}
                  </span>
                </div>
                <VoiceMicButton
                  isListening={isListening}
                  onToggle={isListening ? stopVoiceInput : () => startVoiceInput("height")}
                />
              </div>
              <p className="text-center text-muted-foreground mt-3">{t.tapToSpeak}</p>
            </div>
          </div>
        )

      case "sex":
        return (
          <div className="flex-1 flex flex-col items-center px-6 py-6">
            <StepIcon
              icon={<User className="w-full h-full" />}
              color="text-pink-500"
              bgColor="bg-pink-50"
              pulse={isSpeaking}
            />
            <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
              {t.whatIsYourSex}
            </h1>
            <p className="text-xl text-muted-foreground text-center mb-4">
              {t.selectSex}
            </p>
            <ListenButton
              label={t.listen}
              onClick={() => speak(getStepInstruction())}
              isPlaying={isSpeaking}
            />
            <div className="w-full mt-6 space-y-3">
              {(["male", "female", "other"] as const).map((sex) => (
                <button
                  key={sex}
                  type="button"
                  onClick={() => {
                    updatePatientProfile({ sex })
                    if (isVoiceEnabled) speak(t[sex])
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all min-h-[72px]",
                    patientProfile.sex === sex
                      ? "border-primary bg-primary/5 scale-[1.02]"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      patientProfile.sex === sex
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <User className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-semibold text-card-foreground">
                    {t[sex]}
                  </span>
                  {patientProfile.sex === sex && (
                    <Check className="w-6 h-6 text-primary ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )

      case "diagnosis":
        return (
          <div className="flex-1 flex flex-col items-center px-6 py-6">
            <StepIcon
              icon={<Stethoscope className="w-full h-full" />}
              color="text-red-500"
              bgColor="bg-red-50"
              pulse={isSpeaking}
            />
            <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
              {t.whatIsYourDiagnosis}
            </h1>
            <p className="text-xl text-muted-foreground text-center mb-4">
              {t.selectNSType}
            </p>
            <ListenButton
              label={t.listen}
              onClick={() => speak(getStepInstruction())}
              isPlaying={isSpeaking}
            />
            <div className="w-full mt-6 space-y-3">
              {(["IFRNS", "FRNS", "SDNS", "SRNS"] as NephroticSyndromeCategory[]).map(
                (diagnosis) => (
                  <button
                    key={diagnosis}
                    type="button"
                    onClick={() => {
                      updatePatientProfile({ diagnosis })
                      const label =
                        diagnosis === "IFRNS"
                          ? t.ifrns
                          : diagnosis === "FRNS"
                            ? t.frns
                            : diagnosis === "SDNS"
                              ? t.sdns
                              : t.srns
                      if (isVoiceEnabled) speak(label)
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all min-h-[72px]",
                      patientProfile.diagnosis === diagnosis
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <span className="text-lg font-semibold text-card-foreground">
                      {diagnosis === "IFRNS"
                        ? t.ifrns
                        : diagnosis === "FRNS"
                          ? t.frns
                          : diagnosis === "SDNS"
                            ? t.sdns
                            : t.srns}
                    </span>
                    {patientProfile.diagnosis === diagnosis && (
                      <Check className="w-6 h-6 text-primary ml-auto" />
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        )

      case "medications":
        return (
          <div className="flex-1 flex flex-col px-6 py-6">
            <div className="text-center mb-4">
              <StepIcon
                icon={<Pill className="w-full h-full" />}
                color="text-blue-500"
                bgColor="bg-blue-50"
                pulse={isSpeaking}
              />
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t.medicationManagement}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t.manageYourMedications}
              </p>
            </div>
            <ListenButton
              label={t.listen}
              onClick={() => speak(getStepInstruction())}
              isPlaying={isSpeaking}
            />

            {/* Medication List */}
            <div className="flex-1 mt-4 space-y-3 overflow-y-auto">
              {medications.length === 0 ? (
                <div className="text-center py-8">
                  <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-lg text-muted-foreground">{t.noActiveMedications}</p>
                </div>
              ) : (
                medications.map((med) => (
                  <div
                    key={med.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Pill className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-card-foreground">
                        {med.name}
                      </p>
                      <p className="text-muted-foreground">
                        {med.dose} - {
                          med.frequency === "onceDaily" ? t.onceDaily :
                          med.frequency === "twiceDaily" ? t.twiceDaily :
                          med.frequency === "thriceDaily" ? t.thriceDaily :
                          med.frequency === "alternateDays" ? t.alternateDays :
                          med.frequency === "weekly" ? t.weekly :
                          med.frequency === "asNeeded" ? t.asNeeded :
                          med.frequency
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedication(med.id)}
                      className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Medication Button */}
            <button
              type="button"
              onClick={() => setShowMedicationModal(true)}
              className="w-full py-5 mt-4 rounded-2xl border-2 border-dashed border-primary/50 text-primary font-semibold text-xl flex items-center justify-center gap-3"
            >
              <Plus className="w-6 h-6" />
              {t.addMedication}
            </button>
          </div>
        )

      case "reminder":
        return (
          <div className="flex-1 flex flex-col items-center px-6 py-6">
            <StepIcon
              icon={<Bell className="w-full h-full" />}
              color="text-orange-500"
              bgColor="bg-orange-50"
              pulse={isSpeaking}
            />
            <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
              {t.setDailyReminder}
            </h1>
            <p className="text-xl text-muted-foreground text-center mb-4">
              {t.whenToRemind}
            </p>
            <p className="text-lg text-muted-foreground text-center mb-6">
              {t.reminderHelp}
            </p>
            <ListenButton
              label={t.listen}
              onClick={() => speak(getStepInstruction())}
              isPlaying={isSpeaking}
            />
            
            <div className="w-full mt-6">
              <input
                type="time"
                value={patientProfile.reminderTime}
                onChange={(e) => updatePatientProfile({ reminderTime: e.target.value })}
                className="w-full min-h-[80px] px-6 py-4 text-3xl font-bold text-center border-2 border-border rounded-2xl bg-card text-card-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
              />
              
              {/* Quick Time Options */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { time: "07:00", label: t.morning, icon: "🌅" },
                  { time: "13:00", label: t.afternoon, icon: "☀️" },
                  { time: "19:00", label: t.evening, icon: "🌆" },
                ].map((option) => (
                  <button
                    key={option.time}
                    type="button"
                    onClick={() => {
                      updatePatientProfile({ reminderTime: option.time })
                      if (isVoiceEnabled) speak(option.label)
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                      patientProfile.reminderTime === option.time
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.time}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top safe-bottom">
      {/* Progress */}
      <ProgressDots currentStep={currentStepIndex} totalSteps={TOTAL_STEPS} />

      {/* Content */}
      {renderStepContent()}

      {/* Voice Toggle */}
      <button
        type="button"
        onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
        className={cn(
          "fixed bottom-28 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-300",
          isVoiceEnabled
            ? "bg-gradient-to-r from-violet-500 to-primary text-white"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        <span className="font-semibold">{isVoiceEnabled ? t.voiceOn : t.voiceOff}</span>
      </button>

      {/* Navigation */}
      <div className="p-6 flex gap-4">
        {currentStepIndex > 0 && (
          <button
            type="button"
            onClick={goToPreviousStep}
            className="flex-1 py-5 px-6 rounded-2xl bg-secondary text-secondary-foreground font-bold text-xl flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-6 h-6" />
            {t.back}
          </button>
        )}
        <button
          type="button"
          onClick={currentStepIndex === TOTAL_STEPS - 1 ? handleFinish : goToNextStep}
          className="flex-1 py-5 px-6 rounded-2xl bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center gap-2"
        >
          {currentStepIndex === TOTAL_STEPS - 1 ? t.finishSetup : t.next}
          {currentStepIndex < TOTAL_STEPS - 1 && <ChevronRight className="w-6 h-6" />}
        </button>
      </div>

      {/* Add Medication Modal */}
      {showMedicationModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-lg bg-background rounded-t-3xl max-h-[90vh] overflow-y-auto safe-bottom">
            <div className="sticky top-0 bg-background p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">{t.addNewMedication}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowMedicationModal(false)
                  setShowOtherMedInput(false)
                  setShowCustomFrequency(false)
                }}
                className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Prescription Upload */}
              <div className="border-2 border-dashed border-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t.uploadPrescription}
                </h3>
                <p className="text-muted-foreground mb-4">{t.uploadPrescriptionPhoto}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-4 rounded-xl border-2 border-border flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    {t.chooseImage}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.setAttribute("capture", "environment")
                        fileInputRef.current.click()
                      }
                    }}
                    className="flex-1 py-4 rounded-xl border-2 border-border flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    {t.takePhoto}
                  </button>
                </div>
                {newMedication.prescriptionImage && (
                  <div className="mt-4 relative">
                    <img
                      src={newMedication.prescriptionImage || "/placeholder.svg"}
                      alt="Prescription"
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNewMedication((prev) => ({ ...prev, prescriptionImage: "" }))
                      }
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Medication Name */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t.medicationName}
                </h3>
                {showOtherMedInput ? (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={customMedName}
                      onChange={(e) => setCustomMedName(e.target.value)}
                      placeholder={t.typeHere}
                      className="flex-1 min-h-[56px] px-5 py-3 text-lg border-2 border-border rounded-xl bg-card"
                    />
                    <VoiceMicButton
                      isListening={isListening}
                      onToggle={isListening ? stopVoiceInput : () => startVoiceInput("medName")}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {commonMeds.map((med) => (
                      <button
                        key={med}
                        type="button"
                        onClick={() => {
                          setNewMedication((prev) => ({ ...prev, name: med }))
                          if (isVoiceEnabled) speak(med)
                        }}
                        className={cn(
                          "py-4 px-4 rounded-xl border-2 text-left transition-all",
                          newMedication.name === med
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-primary/50"
                        )}
                      >
                        <span className="font-medium">{med}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowOtherMedInput(true)}
                      className="py-4 px-4 rounded-xl border-2 border-dashed border-primary/50 text-primary flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      {t.otherRoute}
                    </button>
                  </div>
                )}
              </div>

              {/* Dosage */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{t.dosage}</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMedication.dose}
                    onChange={(e) =>
                      setNewMedication((prev) => ({ ...prev, dose: e.target.value }))
                    }
                    placeholder={t.dosagePlaceholder}
                    className="flex-1 min-h-[56px] px-5 py-3 text-lg border-2 border-border rounded-xl bg-card"
                  />
                  <VoiceMicButton
                    isListening={isListening}
                    onToggle={isListening ? stopVoiceInput : () => startVoiceInput("dose")}
                  />
                </div>
              </div>

              {/* Frequency */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{t.frequency}</h3>
                {showCustomFrequency ? (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={customFrequency}
                      onChange={(e) => setCustomFrequency(e.target.value)}
                      placeholder={t.typeHere}
                      className="flex-1 min-h-[56px] px-5 py-3 text-lg border-2 border-border rounded-xl bg-card"
                    />
                    <VoiceMicButton
                      isListening={isListening}
                      onToggle={isListening ? stopVoiceInput : () => startVoiceInput("customFreq")}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {frequencies.map((freq) => (
                      <button
                        key={freq.value}
                        type="button"
                        onClick={() => {
                          if (freq.value === "other") {
                            setShowCustomFrequency(true)
                          } else {
                            setNewMedication((prev) => ({ ...prev, frequency: freq.value }))
                            if (isVoiceEnabled) speak(freq.label)
                          }
                        }}
                        className={cn(
                          "py-4 px-4 rounded-xl border-2 text-left transition-all",
                          newMedication.frequency === freq.value
                            ? "border-primary bg-primary/5"
                            : freq.value === "other"
                              ? "border-dashed border-primary/50 text-primary"
                              : "border-border bg-card hover:border-primary/50"
                        )}
                      >
                        <span className="font-medium">{freq.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Route */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{t.route}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {routes.map((route) => (
                    <button
                      key={route.value}
                      type="button"
                      onClick={() => {
                        setNewMedication((prev) => ({ ...prev, route: route.value }))
                        if (isVoiceEnabled) speak(route.label)
                      }}
                      className={cn(
                        "py-4 px-4 rounded-xl border-2 text-left transition-all",
                        newMedication.route === route.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <span className="font-medium">{route.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={handleAddMedication}
                disabled={!(showOtherMedInput ? customMedName : newMedication.name) || !newMedication.dose}
                className={cn(
                  "w-full py-5 rounded-2xl font-bold text-xl transition-all",
                  (showOtherMedInput ? customMedName : newMedication.name) && newMedication.dose
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {t.addMedication}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
