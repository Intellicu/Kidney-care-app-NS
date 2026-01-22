"use client"

import { cn } from "@/lib/utils"

interface AssistantAvatarProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function AssistantAvatar({ size = "md", className }: AssistantAvatarProps) {
  const sizeStyles = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
    xl: "w-36 h-36",
  }

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg",
        sizeStyles[size],
        className
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-[70%] h-[70%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Friendly robot/assistant face */}
        <circle cx="50" cy="50" r="45" fill="white" fillOpacity="0.9" />
        {/* Eyes */}
        <circle cx="35" cy="42" r="8" fill="currentColor" className="text-primary" />
        <circle cx="65" cy="42" r="8" fill="currentColor" className="text-primary" />
        <circle cx="37" cy="40" r="3" fill="white" />
        <circle cx="67" cy="40" r="3" fill="white" />
        {/* Smile */}
        <path
          d="M 30 60 Q 50 80 70 60"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          className="text-primary"
        />
        {/* Stethoscope hint */}
        <circle cx="50" cy="85" r="6" fill="currentColor" className="text-accent" />
        <path
          d="M 44 85 Q 30 70 30 55"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          className="text-accent"
        />
        <path
          d="M 56 85 Q 70 70 70 55"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          className="text-accent"
        />
      </svg>
    </div>
  )
}
