"use client"

import { useApp, getTranslations } from "@/lib/app-context"
import { LargeButton } from "../large-button"
import { Volume2, ChevronLeft, Shield, Check } from "lucide-react"
import { useState } from "react"

export function ConsentScreen() {
  const { language, setCurrentScreen, setHasConsented } = useApp()
  const t = getTranslations(language)
  const [agreed, setAgreed] = useState(false)

  const handleContinue = () => {
    if (agreed) {
      setHasConsented(true)
      setCurrentScreen("introduction")
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          type="button"
          onClick={() => setCurrentScreen("language-selection")}
          className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors touch-target"
          aria-label={t.back}
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <button
          type="button"
          className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors touch-target"
          aria-label="Listen to consent"
        >
          <Volume2 className="w-7 h-7" />
        </button>
      </div>

      {/* Shield icon */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mb-8">
          <Shield className="w-14 h-14 text-primary" />
        </div>

        {/* Consent text - very simple */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm mb-8 w-full">
          <p className="text-xl text-card-foreground leading-relaxed text-center">
            {t.consent}
          </p>
        </div>

        {/* Checkbox */}
        <button
          type="button"
          onClick={() => setAgreed(!agreed)}
          className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 border-border bg-card hover:bg-muted/50 transition-colors touch-target"
        >
          <div
            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
              agreed
                ? "bg-primary border-primary"
                : "border-muted-foreground bg-transparent"
            }`}
          >
            {agreed && <Check className="w-5 h-5 text-primary-foreground" />}
          </div>
          <span className="text-xl font-medium text-card-foreground">
            {language === "en"
              ? "I agree"
              : language === "hi"
                ? "मैं सहमत हूं"
                : language === "bn"
                  ? "আমি সম্মত"
                  : language === "ta"
                    ? "நான் ஒப்புக்கொள்கிறேன்"
                    : "ਮੈਂ ਸਹਿਮਤ ਹਾਂ"}
          </span>
        </button>
      </div>

      {/* Continue button */}
      <div className="mt-8">
        <LargeButton
          onClick={handleContinue}
          variant={agreed ? "primary" : "secondary"}
          disabled={!agreed}
        >
          {t.iUnderstand}
        </LargeButton>
      </div>
    </div>
  )
}
