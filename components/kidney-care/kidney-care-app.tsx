"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { AppProvider, useApp } from "@/lib/app-context"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

// Screens
import { LanguageSelectionScreen } from "./screens/language-selection-screen"
import { ConsentScreen } from "./screens/consent-screen"
import { IntroductionScreen } from "./screens/introduction-screen"
import { PatientOnboardingScreen } from "./screens/patient-onboarding-screen"
import { DashboardScreen } from "./screens/dashboard-screen"
import { SymptomCheckScreen } from "./screens/symptom-check-screen"
import { UrineTestScreen } from "./screens/urine-test-screen"
import { MedicationsScreen } from "./screens/medications-screen"
import { MedicationCheckScreen } from "./screens/medication-check-screen"
import { HealthDataScreen } from "./screens/health-data-screen"
import { EducationScreen } from "./screens/education-screen"
import { DailyHealthLogScreen } from "./screens/daily-health-log-screen"
import { NephroticDiaryScreen } from "./screens/nephrotic-diary-screen"
import { HealthTrendScreen } from "./screens/health-trend-screen"
import { ComplianceScreen } from "./screens/compliance-screen"
import { ClinicianDashboardScreen } from "./screens/clinician-dashboard-screen"
import { PatientAnalyticsScreen } from "./screens/patient-analytics-screen"
import { EducationHubScreen } from "./screens/education-hub-screen"
import { AdherenceCalendarScreen } from "./screens/adherence-calendar-screen"
import { AuthScreen } from "./screens/auth-screen"
import { SettingsScreen } from "./screens/settings-screen"

// Components
import { BottomNavBar } from "./bottom-nav-bar"

type TabId = "home" | "diary" | "assistant" | "settings"

// Screens that are part of the onboarding flow (no bottom nav)
const ONBOARDING_SCREENS = new Set([
  "language-selection", "consent", "introduction", "patient-onboarding",
])

// Map tabs to default screens
const TAB_DEFAULT_SCREENS: Record<TabId, string> = {
  home: "dashboard",
  diary: "nephrotic-diary",
  assistant: "education-hub",
  settings: "settings",
}

function AppContent() {
  const { currentScreen, setCurrentScreen, isLoaded } = useApp()
  const [activeTab, setActiveTab] = useState<TabId>("home")

  // Per-tab history stacks for independent navigation
  const tabHistory = useRef<Record<TabId, string[]>>({
    home: ["dashboard"],
    diary: ["nephrotic-diary"],
    assistant: ["education-hub"],
    settings: ["settings"],
  })

  // Show spinner while loading saved state from Supabase
  if (!isLoaded) {
    return (
      <main className="max-w-lg mx-auto bg-background min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  const isOnboarding = ONBOARDING_SCREENS.has(currentScreen)
  const showBottomNav = !isOnboarding

  // Sync currentScreen changes into the active tab's history
  useEffect(() => {
    if (isOnboarding) return
    const history = tabHistory.current[activeTab]
    if (history[history.length - 1] !== currentScreen) {
      history.push(currentScreen)
    }
  }, [currentScreen, activeTab, isOnboarding])

  const handleTabChange = useCallback((tab: TabId) => {
    if (tab === activeTab) {
      // Tap same tab = go to root of that tab
      tabHistory.current[tab] = [TAB_DEFAULT_SCREENS[tab]]
      setCurrentScreen(TAB_DEFAULT_SCREENS[tab])
    } else {
      setActiveTab(tab)
      const history = tabHistory.current[tab]
      setCurrentScreen(history[history.length - 1] || TAB_DEFAULT_SCREENS[tab])
    }
  }, [activeTab, setCurrentScreen])

  const screens: Record<string, React.ReactNode> = {
    "language-selection": <LanguageSelectionScreen />,
    consent: <ConsentScreen />,
    introduction: <IntroductionScreen />,
    "patient-onboarding": <PatientOnboardingScreen />,
    dashboard: <DashboardScreen />,
    "symptom-check": <SymptomCheckScreen />,
    "urine-test": <UrineTestScreen />,
    medications: <MedicationsScreen />,
    "medication-check": <MedicationCheckScreen />,
    "health-data": <HealthDataScreen />,
    education: <EducationScreen />,
    "daily-health-log": <DailyHealthLogScreen />,
    "nephrotic-diary": <NephroticDiaryScreen />,
    "health-trend": <HealthTrendScreen />,
    compliance: <ComplianceScreen />,
    "clinician-dashboard": <ClinicianDashboardScreen />,
    "patient-analytics": <PatientAnalyticsScreen />,
    "education-hub": <EducationHubScreen />,
    "adherence-calendar": <AdherenceCalendarScreen />,
    settings: <SettingsScreen />,
    auth: <AuthScreen onAuthSuccess={() => setCurrentScreen("dashboard")} onGuestMode={() => setCurrentScreen("dashboard")} language="en" />,
  }

  return (
    <main className="max-w-lg mx-auto bg-background min-h-screen relative">
      <div className={showBottomNav ? "pb-nav-safe" : ""}>
        {screens[currentScreen] || <LanguageSelectionScreen />}
      </div>
      {showBottomNav && (
        <BottomNavBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}
    </main>
  )
}

/** Initializes dark mode from localStorage or system preference */
function initTheme() {
  if (typeof window === "undefined") return
  const stored = localStorage.getItem("kidney-care-theme")
  const root = document.documentElement
  if (stored === "dark") {
    root.classList.add("dark")
  } else if (stored === "light") {
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

export function KidneyCareApp() {
  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    initTheme()

    // Listen to system preference changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const stored = localStorage.getItem("kidney-care-theme")
      if (!stored || stored === "system") {
        document.documentElement.classList.toggle("dark", mq.matches)
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthChecked(true)
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (!authChecked) {
    // Loading spinner while checking auth
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user && !isGuest) {
    return (
      <AuthScreen
        onAuthSuccess={() => {
          // Re-check auth — if they logged in, user will be set via onAuthStateChange
          // If guest mode (no session), just set the guest flag
          const supabase = createClient()
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
              setUser(session.user)
            } else {
              setIsGuest(true)
            }
          }).catch(() => {
            setIsGuest(true)
          })
        }}
        onGuestMode={() => setIsGuest(true)}
        language="en"
      />
    )
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
