"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface LargeButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "outline" | "success" | "warning" | "destructive"
  icon?: ReactNode
  className?: string
  disabled?: boolean
  fullWidth?: boolean
  type?: "button" | "submit"
}

export function LargeButton({
  children,
  onClick,
  variant = "primary",
  icon,
  className,
  disabled,
  fullWidth = true,
  type = "button",
}: LargeButtonProps) {
  const baseStyles =
    "min-h-[56px] px-6 py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] touch-target"

  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary/10",
    success: "bg-success text-success-foreground hover:bg-success/90 shadow-lg shadow-success/20",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variantStyles[variant],
        fullWidth && "w-full",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      <span className="text-balance">{children}</span>
    </button>
  )
}
