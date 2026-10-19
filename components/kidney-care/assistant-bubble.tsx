"use client"

import { cn } from "@/lib/utils"
import { Volume2 } from "lucide-react"
import type { ReactNode } from "react"

interface AssistantBubbleProps {
  children: ReactNode
  showSpeaker?: boolean
  className?: string
}

export function AssistantBubble({
  children,
  showSpeaker = true,
  className,
}: AssistantBubbleProps) {
  return (
    <div
      className={cn(
        "relative bg-card rounded-2xl rounded-bl-md p-5 shadow-lg border border-border max-w-[90%]",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 text-lg text-card-foreground leading-relaxed">
          {children}
        </div>
        {showSpeaker && (
          <button
            type="button"
            className="shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors touch-target"
            aria-label="Listen to message"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  )
}
