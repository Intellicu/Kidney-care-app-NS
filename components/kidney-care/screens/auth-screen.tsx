"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Heart, Loader2, Mail, Lock, UserPlus, LogIn } from "lucide-react"

interface AuthScreenProps {
  onAuthSuccess: () => void
  onGuestMode?: () => void
  language: string
}

const t = {
  en: {
    welcome: "Welcome to KidneyCare",
    subtitle: "Track, monitor, and manage kidney health",
    login: "Log In",
    signup: "Sign Up",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    loggingIn: "Logging in...",
    signingUp: "Creating account...",
    orContinue: "or continue as guest",
    guestMode: "Continue as Guest",
    guestNote: "Your data will only be stored on this device",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters",
    signupSuccess: "Check your email to confirm your account",
    emailRequired: "Email is required",
  },
  hi: {
    welcome: "KidneyCare में आपका स्वागत है",
    subtitle: "किडनी स्वास्थ्य को ट्रैक, मॉनिटर और प्रबंधित करें",
    login: "लॉग इन",
    signup: "साइन अप",
    email: "ईमेल",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    forgotPassword: "पासवर्ड भूल गए?",
    noAccount: "खाता नहीं है?",
    hasAccount: "पहले से खाता है?",
    loggingIn: "लॉग इन हो रहा है...",
    signingUp: "खाता बनाया जा रहा है...",
    orContinue: "या अतिथि के रूप में जारी रखें",
    guestMode: "अतिथि के रूप में जारी रखें",
    guestNote: "आपका डेटा केवल इस डिवाइस पर संग्रहीत होगा",
    passwordMismatch: "पासवर्ड मेल नहीं खाते",
    passwordTooShort: "पासवर्ड कम से कम 6 अक्षर का होना चाहिए",
    signupSuccess: "अपना खाता पुष्टि करने के लिए अपना ईमेल जांचें",
    emailRequired: "ईमेल आवश्यक है",
  },
}

export function AuthScreen({ onAuthSuccess, onGuestMode, language }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const lang = (language === "hi" ? "hi" : "en") as keyof typeof t
  const l = t[lang]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim()) {
      setError(l.emailRequired)
      return
    }
    if (password.length < 6) {
      setError(l.passwordTooShort)
      return
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError(l.passwordMismatch)
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (authError) throw authError
        onAuthSuccess()
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
              `${window.location.origin}`,
          },
        })
        if (authError) throw authError
        setSuccess(l.signupSuccess)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{l.welcome}</h1>
          <p className="text-sm text-muted-foreground">{l.subtitle}</p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={l.email}
              autoComplete="email"
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={l.password}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full h-12 pl-11 pr-11 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground select-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {mode === "signup" && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={l.confirmPassword}
                autoComplete="new-password"
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 select-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {mode === "login" ? l.loggingIn : l.signingUp}
              </>
            ) : (
              <>
                {mode === "login" ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {mode === "login" ? l.login : l.signup}
              </>
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login")
              setError(null)
              setSuccess(null)
            }}
            className="text-sm text-primary font-medium select-none"
          >
            {mode === "login" ? l.noAccount : l.hasAccount}{" "}
            <span className="underline">{mode === "login" ? l.signup : l.login}</span>
          </button>
        </div>

        {/* Guest mode divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">{l.orContinue}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          type="button"
          onClick={onGuestMode || onAuthSuccess}
          className="w-full h-12 rounded-xl border border-border bg-card text-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted active:scale-[0.98] transition-all select-none"
        >
          {l.guestMode}
        </button>
        <p className="text-xs text-center text-muted-foreground">{l.guestNote}</p>
      </div>
    </div>
  )
}
