"use client"

import { useApp, getTranslations, type Language } from "@/lib/app-context"
import { Globe, Volume2, VolumeX, Menu, X } from "lucide-react"
import { useState } from "react"

const languages: { code: Language; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ" },
]

interface TopHeaderBarProps {
  onMenuClick?: () => void
  showMenu?: boolean
}

export function TopHeaderBar({ onMenuClick, showMenu = true }: TopHeaderBarProps) {
  const { language, setLanguage, isVoiceEnabled, setIsVoiceEnabled } = useApp()
  const t = getTranslations(language)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)

  const currentLang = languages.find(l => l.code === language)

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled)
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 safe-top">
        <div className="flex items-center justify-between gap-3">
          {/* Menu Button */}
          {showMenu && (
            <button
              type="button"
              onClick={onMenuClick}
              className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 active:scale-95 transition-all"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          {/* App Title */}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-primary">KidneyCare</h1>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="h-11 px-3 rounded-xl bg-muted flex items-center gap-2 text-foreground hover:bg-muted/80 active:scale-95 transition-all"
            >
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{currentLang?.nativeLabel}</span>
            </button>

            {/* Language Dropdown */}
            {showLanguageDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLanguageDropdown(false)} 
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl border border-border shadow-lg z-50 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code)
                        setShowLanguageDropdown(false)
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted transition-colors ${
                        language === lang.code ? "bg-primary/10 text-primary" : "text-foreground"
                      }`}
                    >
                      <span className="font-medium">{lang.nativeLabel}</span>
                      {language === lang.code && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Voice Toggle */}
          <button
            type="button"
            onClick={toggleVoice}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
              isVoiceEnabled
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
            aria-label={isVoiceEnabled ? t.voiceOn : t.voiceOff}
          >
            {isVoiceEnabled ? (
              <Volume2 className="w-6 h-6" />
            ) : (
              <VolumeX className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>
    </>
  )
}
