"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface ActionCardProps {
  title: string
  icon: ReactNode
  onClick?: () => void
  variant?: "default" | "primary" | "accent"
  className?: string
}

export function ActionCard({
  title,
  icon,
  onClick,
  variant = "default",
  className,
}: ActionCardProps) {
  const variantStyles = {
    default: "bg-card hover:bg-card/80 border-border",
    primary: "bg-primary/5 hover:bg-primary/10 border-primary/20",
    accent: "bg-accent/10 hover:bg-accent/20 border-accent/30",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full min-h-[100px] p-6 rounded-2xl border-2 flex items-center gap-5 transition-all duration-200 active:scale-[0.98] text-left touch-target",
        variantStyles[variant],
        className
      )}
    >
      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-3xl shrink-0">
        {icon}
      </div>
      <span className="text-xl font-semibold text-card-foreground text-balance leading-snug">
        {title}
      </span>
    </button>
  )
}
