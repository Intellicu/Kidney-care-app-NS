"use client"

import { useApp, type Language } from "@/lib/app-context"
import { Volume2, Check, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCallback, useState } from "react"

const languages: { code: Language; name: string; nativeName: string; voiceLang: string }[] = [
  { code: "en", name: "English", nativeName: "English", voiceLang: "en-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", voiceLang: "hi-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", voiceLang: "bn-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", voiceLang: "ta-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", voiceLang: "pa-IN" },
]

export function LanguageSelectionScreen() {
  const { language, setLanguage, setCurrentScreen, isVoiceEnabled, setIsVoiceEnabled } = useApp()
  const [selectedLang, setSelectedLang] = useState<Language>(language)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = useCallback((text: string, lang: string) => {
    if (typeof window === "undefined") return
    window.speechSynthesis?.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.85
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    window.speechSynthesis?.speak(utterance)
  }, [])

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLang(lang)
    setLanguage(lang)
    
    const langInfo = languages.find(l => l.code === lang)
    if (langInfo && isVoiceEnabled) {
      const messages: Record<Language, string> = {
        en: "You selected English",
        hi: "आपने हिंदी चुनी",
        bn: "আপনি বাংলা নির্বাচন করেছেন",
        ta: "நீங்கள் தமிழ் தேர்ந்தெடுத்தீர்கள்",
        pa: "ਤੁਸੀਂ ਪੰਜਾਬੀ ਚੁਣੀ",
      }
      speak(messages[lang], langInfo.voiceLang)
    }
  }

  const handleContinue = () => {
    setCurrentScreen("consent")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Globe className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Select Your Language
        </h1>
        <p className="text-xl text-muted-foreground">
          अपनी भाषा चुनें
        </p>
      </div>

      {/* Voice Toggle */}
      <div className="px-6 mb-6">
        <button
          type="button"
          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
          className={cn(
            "w-full flex items-center justify-center gap-3 py-4 rounded-2xl transition-all min-h-[64px]",
            isVoiceEnabled
              ? "bg-gradient-to-r from-violet-500 to-primary text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Volume2 className={cn("w-6 h-6", isSpeaking && "animate-pulse")} />
          <span className="text-xl font-semibold">
            {isVoiceEnabled ? "Voice Assistant ON" : "Voice Assistant OFF"}
          </span>
        </button>
        <p className="text-center text-muted-foreground mt-2 text-lg">
          {isVoiceEnabled ? "Tap a language to hear it" : "Turn on to hear languages"}
        </p>
      </div>

      {/* Language Options */}
      <div className="flex-1 px-6 space-y-4">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleLanguageSelect(lang.code)}
            className={cn(
              "w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all min-h-[80px]",
              selectedLang === lang.code
                ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
            )}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold transition-all",
                  selectedLang === lang.code
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {lang.nativeName.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-card-foreground">
                  {lang.nativeName}
                </p>
                <p className="text-lg text-muted-foreground">{lang.name}</p>
              </div>
            </div>
            {selectedLang === lang.code && (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-6 h-6 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Continue Button */}
      <div className="p-6">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-5 px-8 rounded-2xl bg-primary text-primary-foreground font-bold text-2xl shadow-lg hover:bg-primary/90 transition-all min-h-[72px] active:scale-[0.98]"
        >
          {selectedLang === "hi" ? "जारी रखें" : 
           selectedLang === "bn" ? "চালিয়ে যান" :
           selectedLang === "ta" ? "தொடரவும்" :
           selectedLang === "pa" ? "ਜਾਰੀ ਰੱਖੋ" :
           "Continue"}
        </button>
      </div>
    </div>
  )
}
