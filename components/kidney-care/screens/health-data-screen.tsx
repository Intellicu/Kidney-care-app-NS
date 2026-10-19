"use client"

import { useApp, getTranslations, type HealthData } from "@/lib/app-context"
import { LargeButton } from "../large-button"
import { AssistantBubble } from "../assistant-bubble"
import { AssistantAvatar } from "../assistant-avatar"
import {
  ChevronLeft,
  Scale,
  Heart,
  Droplets,
  GlassWater,
  Check,
  X,
} from "lucide-react"
import { useState } from "react"
import { FloatingAssistant } from "../floating-assistant"

type MetricType = "weight" | "bp" | "urine" | "fluid"

interface NumericInputModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (value: string) => void
  title: string
  unit: string
  placeholder: string
  isBP?: boolean
}

function NumericInputModal({
  isOpen,
  onClose,
  onSave,
  title,
  unit,
  placeholder,
  isBP = false,
}: NumericInputModalProps) {
  const [value, setValue] = useState("")
  const [bpSystolic, setBpSystolic] = useState("")
  const [bpDiastolic, setBpDiastolic] = useState("")

  if (!isOpen) return null

  const handleSave = () => {
    if (isBP) {
      onSave(`${bpSystolic}/${bpDiastolic}`)
    } else {
      onSave(value)
    }
    setValue("")
    setBpSystolic("")
    setBpDiastolic("")
  }

  const handleNumberClick = (num: string) => {
    if (isBP) {
      if (bpSystolic.length < 3) {
        setBpSystolic((prev) => prev + num)
      } else if (bpDiastolic.length < 3) {
        setBpDiastolic((prev) => prev + num)
      }
    } else {
      setValue((prev) => prev + num)
    }
  }

  const handleDelete = () => {
    if (isBP) {
      if (bpDiastolic.length > 0) {
        setBpDiastolic((prev) => prev.slice(0, -1))
      } else if (bpSystolic.length > 0) {
        setBpSystolic((prev) => prev.slice(0, -1))
      }
    } else {
      setValue((prev) => prev.slice(0, -1))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom duration-300 safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-card-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center touch-target"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Value display */}
        <div className="bg-muted rounded-2xl p-6 mb-6 text-center">
          {isBP ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-bold text-card-foreground">
                {bpSystolic || "---"}
              </span>
              <span className="text-3xl text-muted-foreground">/</span>
              <span className="text-4xl font-bold text-card-foreground">
                {bpDiastolic || "---"}
              </span>
              <span className="text-xl text-muted-foreground ml-2">{unit}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-5xl font-bold text-card-foreground">
                {value || placeholder}
              </span>
              <span className="text-2xl text-muted-foreground">{unit}</span>
            </div>
          )}
        </div>

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"].map(
            (key) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  key === "del" ? handleDelete() : handleNumberClick(key)
                }
                className={`h-16 rounded-xl font-bold text-2xl flex items-center justify-center transition-colors touch-target ${
                  key === "del"
                    ? "bg-destructive/20 text-destructive"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {key === "del" ? <ChevronLeft className="w-6 h-6" /> : key}
              </button>
            )
          )}
        </div>

        {/* Save button */}
        <LargeButton
          onClick={handleSave}
          variant="primary"
          disabled={isBP ? !bpSystolic || !bpDiastolic : !value}
        >
          <Check className="w-6 h-6" />
          Save
        </LargeButton>
      </div>
    </div>
  )
}

export function HealthDataScreen() {
  const { language, setCurrentScreen, addHealthData } = useApp()
  const t = getTranslations(language)

  const [activeMetric, setActiveMetric] = useState<MetricType | null>(null)
  const [data, setData] = useState<{
    weight?: string
    bp?: string
    urine?: string
    fluid?: string
  }>({})

  const metrics: {
    type: MetricType
    title: string
    icon: typeof Scale
    unit: string
    placeholder: string
    isBP?: boolean
  }[] = [
    { type: "weight", title: t.weight, icon: Scale, unit: "kg", placeholder: "0" },
    {
      type: "bp",
      title: t.bloodPressure,
      icon: Heart,
      unit: "mmHg",
      placeholder: "120/80",
      isBP: true,
    },
    {
      type: "urine",
      title: t.urineAmount,
      icon: Droplets,
      unit: "mL",
      placeholder: "0",
    },
    {
      type: "fluid",
      title: t.fluidIntake,
      icon: GlassWater,
      unit: "mL",
      placeholder: "0",
    },
  ]

  const handleSave = (type: MetricType, value: string) => {
    setData((prev) => ({ ...prev, [type]: value }))
    setActiveMetric(null)
  }

  const handleSubmitAll = () => {
    const healthEntry: HealthData = {
      date: new Date().toISOString(),
      weight: data.weight ? parseFloat(data.weight) : undefined,
      bp: data.bp
        ? {
            systolic: parseInt(data.bp.split("/")[0]),
            diastolic: parseInt(data.bp.split("/")[1]),
          }
        : undefined,
      urineAmount: data.urine ? parseFloat(data.urine) : undefined,
      fluidIntake: data.fluid ? parseFloat(data.fluid) : undefined,
    }
    addHealthData(healthEntry)
    setCurrentScreen("dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 pb-24 safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => setCurrentScreen("dashboard")}
          className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors touch-target"
          aria-label={t.back}
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      </div>

      {/* Assistant prompt */}
      <div className="mb-8 flex items-start gap-4">
        <AssistantAvatar size="sm" />
        <AssistantBubble className="flex-1">
          <p className="text-lg">
            {language === "en"
              ? "Please enter your health data for today"
              : language === "hi"
                ? "कृपया आज का स्वास्थ्य डेटा दर्ज करें"
                : language === "bn"
                  ? "অনুগ্রহ করে আজকের স্বাস্থ্য তথ্য প্রবেশ করান"
                  : language === "ta"
                    ? "இன்றைய சுகாதார தரவை உள்ளிடுங்கள்"
                    : "ਕਿਰਪਾ ਕਰਕੇ ਅੱਜ ਦਾ ਸਿਹਤ ਡਾਟਾ ਦਰਜ ਕਰੋ"}
          </p>
        </AssistantBubble>
      </div>

      {/* Metric cards */}
      <div className="flex-1 space-y-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          const hasValue = data[metric.type]

          return (
            <button
              key={metric.type}
              type="button"
              onClick={() => setActiveMetric(metric.type)}
              className={`w-full p-5 rounded-2xl border-2 flex items-center gap-5 transition-all duration-200 touch-target ${
                hasValue
                  ? "border-success bg-success/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div
                className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0 ${
                  hasValue ? "bg-success/20 text-success" : "bg-primary/10 text-primary"
                }`}
              >
                <Icon className="w-8 h-8" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-lg font-semibold text-card-foreground">
                  {metric.title}
                </p>
                {hasValue ? (
                  <p className="text-xl font-bold text-success">
                    {data[metric.type]} {metric.unit}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    {language === "en" ? "Tap to enter" : "Tap to enter"}
                  </p>
                )}
              </div>
              {hasValue && (
                <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                  <Check className="w-5 h-5 text-success-foreground" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Save all button */}
      <div className="mt-8">
        <LargeButton
          onClick={handleSubmitAll}
          variant="primary"
          disabled={!Object.keys(data).length}
        >
          {t.save}
        </LargeButton>
      </div>

      {/* Numeric input modal */}
      {activeMetric && (
        <NumericInputModal
          isOpen={true}
          onClose={() => setActiveMetric(null)}
          onSave={(value) => handleSave(activeMetric, value)}
          title={metrics.find((m) => m.type === activeMetric)?.title || ""}
          unit={metrics.find((m) => m.type === activeMetric)?.unit || ""}
          placeholder={metrics.find((m) => m.type === activeMetric)?.placeholder || "0"}
          isBP={activeMetric === "bp"}
        />
      )}

      <FloatingAssistant />
    </div>
  )
}
