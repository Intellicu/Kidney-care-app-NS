"use client"

import { useApp, getTranslations } from "@/lib/app-context"
import { Home, BookHeart, Bot, Settings, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type TabId = "home" | "diary" | "assistant" | "settings"

interface BottomNavBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  hasAlerts?: boolean
}

export function BottomNavBar({ activeTab, onTabChange, hasAlerts = false }: BottomNavBarProps) {
  const { language } = useApp()
  const t = getTranslations(language)

  const tabs: { id: TabId; label: string; labelHi: string; icon: typeof Home; badge?: boolean }[] = [
    { id: "home", label: "Home", labelHi: "होम", icon: Home },
    { id: "diary", label: "Diary", labelHi: "डायरी", icon: BookHeart },
    { id: "assistant", label: "AI Help", labelHi: "AI सहायक", icon: Bot, badge: hasAlerts },
    { id: "settings", label: "Settings", labelHi: "सेटिंग्स", icon: Settings },
  ]

  const isEn = language === "en"

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 dark:bg-card/90 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="max-w-lg mx-auto flex items-stretch">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={isEn ? tab.label : tab.labelHi}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 pt-2.5 transition-colors select-none relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-destructive border-2 border-card" />
                )}
                {isActive && tab.id === "assistant" && (
                  <Sparkles className="absolute -top-1 -right-2 w-3 h-3 text-primary animate-pulse" />
                )}
              </div>
              <span className={cn(
                "text-[10px] leading-tight font-medium",
                isActive && "font-semibold"
              )}>
                {isEn ? tab.label : tab.labelHi}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
