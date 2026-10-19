"use client"

import { useApp, getTranslations } from "@/lib/app-context"
import { LargeButton } from "../large-button"
import { AssistantAvatar } from "../assistant-avatar"
import { AssistantBubble } from "../assistant-bubble"

export function IntroductionScreen() {
  const { language, setCurrentScreen, setHasCompletedOnboarding } = useApp()
  const t = getTranslations(language)

  const handleStart = () => {
    setHasCompletedOnboarding(true)
    setCurrentScreen("patient-onboarding")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8 safe-top safe-bottom bg-gradient-to-b from-primary/5 to-background">
      {/* Assistant Avatar */}
      <div className="mb-8 animate-in zoom-in duration-500">
        <AssistantAvatar size="xl" />
      </div>

      {/* Speech bubbles */}
      <div className="w-full max-w-md space-y-4 mb-12">
        <div className="animate-in slide-in-from-left duration-500 delay-300">
          <AssistantBubble>
            <p className="font-semibold">{t.assistantIntro1}</p>
          </AssistantBubble>
        </div>

        <div className="animate-in slide-in-from-left duration-500 delay-500 ml-4">
          <AssistantBubble>
            <p>{t.assistantIntro2}</p>
          </AssistantBubble>
        </div>
      </div>

      {/* Start button */}
      <div className="w-full max-w-md animate-in slide-in-from-bottom duration-500 delay-700">
        <LargeButton onClick={handleStart} variant="primary">
          {t.start}
        </LargeButton>
      </div>
    </div>
  )
}
