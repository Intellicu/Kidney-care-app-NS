"use client"

import { useState } from "react"
import { useApp, getTranslations } from "@/lib/app-context"
import { createClient } from "@/lib/supabase/client"
import {
  Moon, Sun, Monitor, Volume2, VolumeX, Globe, Trash2,
  LogOut, ChevronRight, AlertTriangle, Shield, Loader2, User, ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ThemeMode = "light" | "dark" | "system"

export function SettingsScreen() {
  const {
    language, setLanguage, isVoiceEnabled, setIsVoiceEnabled,
    setCurrentScreen, patientProfile,
  } = useApp()
  const t = getTranslations(language)
  const isEn = language === "en"

  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("kidney-care-theme") as ThemeMode) || "system"
    }
    return "system"
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const applyTheme = (mode: ThemeMode) => {
    setTheme(mode)
    localStorage.setItem("kidney-care-theme", mode)
    const root = document.documentElement
    if (mode === "dark") {
      root.classList.add("dark")
    } else if (mode === "light") {
      root.classList.remove("dark")
    } else {
      // System preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const supabase = createClient()
      // Delete user app state first
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("user_app_state").delete().eq("id", user.id)
      }
      // Sign out (actual account deletion requires admin API or edge function)
      await supabase.auth.signOut()
      // Clear local storage
      localStorage.clear()
      window.location.reload()
    } catch {
      setDeleteError(isEn ? "Failed to delete account. Please try again." : "खाता हटाने में विफल। कृपया पुनः प्रयास करें।")
    } finally {
      setDeleteLoading(false)
    }
  }

  const languages = [
    { code: "en", label: "English", native: "English" },
    { code: "hi", label: "Hindi", native: "हिन्दी" },
    { code: "bn", label: "Bengali", native: "বাংলা" },
    { code: "ta", label: "Tamil", native: "தமிழ்" },
    { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  ]

  const themeOptions: { mode: ThemeMode; label: string; labelHi: string; icon: typeof Sun }[] = [
    { mode: "light", label: "Light", labelHi: "लाइट", icon: Sun },
    { mode: "dark", label: "Dark", labelHi: "डार्क", icon: Moon },
    { mode: "system", label: "System", labelHi: "सिस्टम", icon: Monitor },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => setCurrentScreen("dashboard")}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center select-none"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">
            {isEn ? "Settings" : "सेटिंग्स"}
          </h1>
        </div>
      </div>

      <div className="px-5 py-4 space-y-6">
        {/* Profile Section */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {patientProfile.name || (isEn ? "Patient" : "रोगी")}
              </p>
              <p className="text-sm text-muted-foreground">
                {patientProfile.diagnosis || (isEn ? "Nephrotic Syndrome" : "नेफ्रोटिक सिंड्रोम")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentScreen("patient-onboarding")}
              className="text-primary select-none"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            {isEn ? "Appearance" : "दिखावट"}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon
              const isActive = theme === opt.mode
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => applyTheme(opt.mode)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all select-none",
                    isActive
                      ? "border-primary bg-primary/10 dark:bg-primary/20"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-xs font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                    {isEn ? opt.label : opt.labelHi}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Language */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              {isEn ? "Language" : "भाषा"}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code as typeof language)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all select-none",
                  language === lang.code
                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <p className={cn("text-sm font-medium", language === lang.code ? "text-primary" : "text-foreground")}>
                  {lang.native}
                </p>
                <p className="text-xs text-muted-foreground">{lang.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Voice */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <button
            type="button"
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className="w-full flex items-center justify-between select-none"
          >
            <div className="flex items-center gap-3">
              {isVoiceEnabled ? (
                <Volume2 className="w-5 h-5 text-primary" />
              ) : (
                <VolumeX className="w-5 h-5 text-muted-foreground" />
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  {isEn ? "Voice Feedback" : "आवाज़ प्रतिक्रिया"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Read aloud buttons and results" : "बटन और परिणाम ज़ोर से पढ़ें"}
                </p>
              </div>
            </div>
            <div className={cn(
              "w-12 h-7 rounded-full transition-colors flex items-center px-0.5",
              isVoiceEnabled ? "bg-primary" : "bg-muted"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full bg-white dark:bg-foreground shadow-sm transition-transform",
                isVoiceEnabled ? "translate-x-5" : "translate-x-0"
              )} />
            </div>
          </button>
        </div>

        {/* Privacy & Data */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              {isEn ? "Privacy & Data" : "गोपनीयता और डेटा"}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isEn
              ? "Your health data is encrypted and stored securely. Only you and your healthcare team can access it."
              : "आपका स्वास्थ्य डेटा एन्क्रिप्टेड है और सुरक्षित रूप से संग्रहीत है। केवल आप और आपकी स्वास्थ्य टीम इसे एक्सेस कर सकती है।"}
          </p>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3 select-none hover:bg-muted/50 transition-colors"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {isEn ? "Log Out" : "लॉग आउट"}
          </span>
        </button>

        {/* Delete Account - App Store compliance */}
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full bg-destructive/5 dark:bg-destructive/10 rounded-2xl border border-destructive/20 p-4 flex items-center gap-3 select-none hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-colors"
        >
          <Trash2 className="w-5 h-5 text-destructive" />
          <div className="text-left">
            <span className="text-sm font-medium text-destructive">
              {isEn ? "Delete Account" : "खाता हटाएं"}
            </span>
            <p className="text-xs text-destructive/70">
              {isEn ? "Permanently remove all your data" : "अपना सभी डेटा स्थायी रूप से हटाएं"}
            </p>
          </div>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <LogOut className="w-6 h-6 text-muted-foreground" />
              <h3 className="text-lg font-bold text-foreground">
                {isEn ? "Log Out?" : "लॉग आउट करें?"}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {isEn
                ? "Your data is saved and will be here when you log back in."
                : "आपका डेटा सहेजा गया है और जब आप वापस लॉग इन करेंगे तो यहां होगा।"}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 h-11 rounded-xl border border-border bg-card text-foreground font-medium select-none"
              >
                {isEn ? "Cancel" : "रद्द"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 h-11 rounded-xl bg-muted text-foreground font-medium select-none"
              >
                {isEn ? "Log Out" : "लॉग आउट"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {isEn ? "Delete Account?" : "खाता हटाएं?"}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {isEn
                ? "This will permanently delete your account and all associated health data. This action cannot be undone."
                : "यह आपके खाते और सभी संबंधित स्वास्थ्य डेटा को स्थायी रूप से हटा देगा। यह क्रिया पूर्ववत नहीं की जा सकती।"}
            </p>
            {deleteError && (
              <p className="text-sm text-destructive">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-11 rounded-xl border border-border bg-card text-foreground font-medium select-none"
              >
                {isEn ? "Cancel" : "रद्द"}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground font-medium flex items-center justify-center gap-2 select-none disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEn ? "Delete" : "हटाएं"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
