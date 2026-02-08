"use client"

import React from "react"

import { AppProvider, useApp } from "@/lib/app-context"
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

function AppContent() {
  const { currentScreen } = useApp()

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
    "compliance": <ComplianceScreen />,
    "clinician-dashboard": <ClinicianDashboardScreen />,
  }

  return (
    <main className="max-w-lg mx-auto bg-background min-h-screen">
      {screens[currentScreen] || <LanguageSelectionScreen />}
    </main>
  )
}

export function KidneyCareApp() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
