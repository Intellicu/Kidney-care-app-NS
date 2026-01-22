"use client"

import { cn } from "@/lib/utils"
import { HelpCircle, MessageCircle, RefreshCw, X, Volume2, Phone } from "lucide-react"
import { useState, useCallback } from "react"
import { AssistantAvatar } from "./assistant-avatar"
import { useApp, getTranslations } from "@/lib/app-context"

// Voice language mapping
const voiceLanguageMap: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  pa: "pa-IN",
}

interface FloatingAssistantProps {
  className?: string
}

export function FloatingAssistant({ className }: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const { language, isVoiceEnabled } = useApp()
  const t = getTranslations(language)

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

  const handleOptionClick = (option: string) => {
    let message = ""
    
    switch (option) {
      case "ask":
        message = language === "en" 
          ? "You can ask me any question about your health. Just tap the microphone button and speak."
          : "आप मुझसे अपने स्वास्थ्य के बारे में कोई भी सवाल पूछ सकते हैं। बस माइक्रोफोन बटन पर टैप करें और बोलें।"
        break
      case "repeat":
        message = language === "en"
          ? "I will repeat the last instruction for you."
          : "मैं आपके लिए पिछला निर्देश दोहराऊंगा।"
        break
      case "help":
        message = language === "en"
          ? "I am here to help you. This app helps you track your kidney health. You can check how you feel, do urine tests, track your medicines, and learn about kidney care."
          : "मैं आपकी मदद के लिए यहाँ हूं। यह ऐप आपकी किडनी स्वास्थ्य को ट्रैक करने में मदद करता है। आप जांच कर सकते हैं कि आप कैसा महसूस करते हैं, मूत्र परीक्षण कर सकते हैं, अपनी दवाइयों को ट्रैक कर सकते हैं, और किडनी देखभाल के बारे में सीख सकते हैं।"
        break
      case "call":
        message = language === "en"
          ? "Calling your doctor. Please wait."
          : "आपके डॉक्टर को कॉल कर रहा है। कृपया प्रतीक्षा करें।"
        break
    }
    
    speak(message)
    setIsOpen(false)
  }

  const options = [
    { 
      icon: MessageCircle, 
      label: t.askQuestion,
      action: "ask",
      color: "text-primary",
      bg: "bg-primary/10"
    },
    { 
      icon: RefreshCw, 
      label: t.repeatInstruction,
      action: "repeat",
      color: "text-amber-600",
      bg: "bg-amber-100"
    },
    { 
      icon: HelpCircle, 
      label: t.helpMe,
      action: "help",
      color: "text-emerald-600",
      bg: "bg-emerald-100"
    },
    { 
      icon: Phone, 
      label: language === "en" ? "Call Doctor" : "डॉक्टर को कॉल करें",
      action: "call",
      color: "text-rose-600",
      bg: "bg-rose-100"
    },
  ]

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Options menu */}
      {isOpen && (
        <div className="absolute bottom-24 right-0 w-72 bg-card rounded-3xl shadow-2xl border-2 border-border overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="p-4 bg-primary/5 border-b border-border">
            <p className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              {language === "en" ? "How can I help?" : "मैं कैसे मदद कर सकता हूं?"}
            </p>
          </div>
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleOptionClick(option.action)}
              className="w-full flex items-center gap-4 px-5 py-5 hover:bg-muted transition-colors text-left border-b border-border last:border-b-0 active:scale-[0.98]"
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", option.bg)}>
                <option.icon className={cn("w-6 h-6", option.color)} />
              </div>
              <span className="text-xl font-medium text-card-foreground">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen && isVoiceEnabled) {
            speak(language === "en" ? "How can I help you?" : "मैं आपकी कैसे मदद कर सकता हूं?")
          }
        }}
        className={cn(
          "relative w-20 h-20 rounded-full shadow-2xl transition-all duration-300 active:scale-95",
          isOpen ? "bg-muted scale-110" : "bg-transparent",
          isSpeaking && "ring-4 ring-primary/50"
        )}
        aria-label={isOpen ? "Close assistant menu" : "Open assistant menu"}
      >
        {isOpen ? (
          <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
            <X className="w-8 h-8 text-muted-foreground" />
          </div>
        ) : (
          <AssistantAvatar size="md" className="w-full h-full" />
        )}
        
        {/* Pulse animation when closed */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">?</span>
            </span>
          </>
        )}
      </button>
    </div>
  )
}
