"use client"

import { useApp, getTranslations } from "@/lib/app-context"
import { LargeButton } from "../large-button"
import { Volume2, ChevronLeft, Shield, Check, Lock, Eye, Trash2 } from "lucide-react"
import { useState } from "react"

const dataItems = {
  en: [
    {
      icon: "📋",
      title: "Health Data",
      desc: "Urine protein results, weight, blood pressure, symptoms, medication records",
    },
    {
      icon: "📷",
      title: "Urine Strip Photos",
      desc: "Images of the dipstick strip you photograph for AI analysis",
    },
    {
      icon: "👤",
      title: "Personal Details",
      desc: "Your name, date of birth, and your doctor's contact information",
    },
  ],
  hi: [
    {
      icon: "📋",
      title: "स्वास्थ्य डेटा",
      desc: "मूत्र प्रोटीन परिणाम, वजन, रक्तचाप, लक्षण, दवाई रिकॉर्ड",
    },
    {
      icon: "📷",
      title: "मूत्र पट्टी की फोटो",
      desc: "AI विश्लेषण के लिए आपके द्वारा ली गई डिपस्टिक स्ट्रिप की तस्वीरें",
    },
    {
      icon: "👤",
      title: "व्यक्तिगत विवरण",
      desc: "आपका नाम, जन्म तिथि और आपके डॉक्टर की संपर्क जानकारी",
    },
  ],
}

const rights = {
  en: [
    { icon: Eye, label: "View all data we hold about you" },
    { icon: Trash2, label: "Delete your data at any time from Settings" },
    { icon: Lock, label: "Withdraw this consent without affecting past care" },
  ],
  hi: [
    { icon: Eye, label: "हमारे पास आपका सारा डेटा देखें" },
    { icon: Trash2, label: "सेटिंग्स से कभी भी अपना डेटा हटाएं" },
    { icon: Lock, label: "पिछली देखभाल को प्रभावित किए बिना सहमति वापस लें" },
  ],
}

export function ConsentScreen() {
  const { language, setCurrentScreen, setHasConsented } = useApp()
  const t = getTranslations(language)
  const isHi = language === "hi"

  const [consentHealth, setConsentHealth] = useState(false)
  const [consentShare, setConsentShare] = useState(false)
  const [consentAI, setConsentAI] = useState(false)

  const allConsented = consentHealth && consentShare && consentAI

  const handleContinue = () => {
    if (allConsented) {
      setHasConsented(true)
      setCurrentScreen("introduction")
    }
  }

  const items = dataItems[isHi ? "hi" : "en"]
  const userRights = rights[isHi ? "hi" : "en"]

  return (
    <div className="min-h-screen flex flex-col px-5 py-6 safe-top safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => setCurrentScreen("language-selection")}
          className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-foreground touch-target"
          aria-label={t.back}
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="w-7 h-7 text-primary" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground mb-1">
        {isHi ? "डेटा सुरक्षा सहमति" : "Data Protection Consent"}
      </h1>
      <p className="text-base text-muted-foreground mb-5">
        {isHi
          ? "भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के अनुसार"
          : "Under the Digital Personal Data Protection Act, 2023 (India)"}
      </p>

      {/* Who processes your data */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <p className="text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
          {isHi ? "डेटा प्रबंधक" : "Data Fiduciary"}
        </p>
        <p className="text-base text-foreground font-medium">IntelliCU Health Technologies Pvt. Ltd.</p>
        <p className="text-sm text-muted-foreground">contact@intellicu.in</p>
      </div>

      {/* Data collected */}
      <p className="text-base font-semibold text-foreground mb-2">
        {isHi ? "हम क्या डेटा इकट्ठा करते हैं:" : "Data we collect:"}
      </p>
      <div className="space-y-2 mb-5">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
            <span className="text-xl">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Your rights */}
      <p className="text-base font-semibold text-foreground mb-2">
        {isHi ? "आपके अधिकार:" : "Your rights:"}
      </p>
      <div className="space-y-2 mb-5">
        {userRights.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <r.icon className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-sm text-foreground">{r.label}</p>
          </div>
        ))}
      </div>

      {/* Three consent checkboxes */}
      <div className="space-y-3 mb-6">
        <ConsentRow
          checked={consentHealth}
          onToggle={() => setConsentHealth(!consentHealth)}
          label={
            isHi
              ? "मैं अपना स्वास्थ्य डेटा इस ऐप में संग्रहीत करने के लिए सहमत हूं"
              : "I consent to my health data being stored in this app"
          }
        />
        <ConsentRow
          checked={consentShare}
          onToggle={() => setConsentShare(!consentShare)}
          label={
            isHi
              ? "मैं अपने डेटा को अपने डॉक्टर के साथ साझा करने के लिए सहमत हूं"
              : "I consent to sharing my data with my treating doctor"
          }
        />
        <ConsentRow
          checked={consentAI}
          onToggle={() => setConsentAI(!consentAI)}
          label={
            isHi
              ? "मैं पट्टी विश्लेषण के लिए AI का उपयोग करने के लिए सहमत हूं"
              : "I consent to AI analysis of urine strip photos for protein detection"
          }
        />
      </div>

      <LargeButton
        onClick={handleContinue}
        variant={allConsented ? "primary" : "secondary"}
        disabled={!allConsented}
      >
        {t.iUnderstand}
      </LargeButton>
    </div>
  )
}

function ConsentRow({
  checked,
  onToggle,
  label,
}: {
  checked: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-start gap-4 p-4 rounded-2xl border-2 border-border bg-card text-left touch-target"
    >
      <div
        className={`w-7 h-7 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-colors mt-0.5 ${
          checked ? "bg-primary border-primary" : "border-muted-foreground"
        }`}
      >
        {checked && <Check className="w-4 h-4 text-primary-foreground" />}
      </div>
      <span className="text-base text-card-foreground leading-snug">{label}</span>
    </button>
  )
}
