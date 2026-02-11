"use client"

import { useState } from "react"
import {
  AlertTriangle,
  X,
  Phone,
  ChevronRight,
  ShieldCheck,
  Info,
  Bell,
  AlertCircle,
} from "lucide-react"
import type { ClinicalAlert, AlertSeverity } from "@/lib/relapse-detection"

interface AlertBannerProps {
  alerts: ClinicalAlert[]
  language: string
  onDismiss: (id: string) => void
  onContactDoctor?: () => void
}

const severityConfig: Record<
  AlertSeverity,
  {
    bg: string
    border: string
    text: string
    iconColor: string
    icon: typeof AlertTriangle
  }
> = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-900",
    iconColor: "text-red-600",
    icon: AlertTriangle,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-900",
    iconColor: "text-amber-600",
    icon: AlertCircle,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-900",
    iconColor: "text-blue-600",
    icon: Info,
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-900",
    iconColor: "text-emerald-600",
    icon: ShieldCheck,
  },
}

export function AlertBanner({
  alerts,
  language,
  onDismiss,
  onContactDoctor,
}: AlertBannerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const activeAlerts = alerts.filter((a) => !a.dismissed)

  if (activeAlerts.length === 0) return null

  const isEn = language === "en"

  return (
    <div className="space-y-2">
      {activeAlerts.map((alert) => {
        const config = severityConfig[alert.severity]
        const Icon = config.icon
        const isExpanded = expandedId === alert.id

        return (
          <div
            key={alert.id}
            className={`rounded-xl border-2 ${config.bg} ${config.border} overflow-hidden transition-all`}
          >
            {/* Header */}
            <button
              type="button"
              onClick={() =>
                setExpandedId(isExpanded ? null : alert.id)
              }
              className="w-full flex items-center gap-3 p-3"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}
              >
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className={`font-bold text-sm ${config.text}`}>
                  {isEn ? alert.title : alert.titleHi}
                </p>
                {!isExpanded && (
                  <p
                    className={`text-xs ${config.text} opacity-80 truncate`}
                  >
                    {isEn ? alert.message : alert.messageHi}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {alert.severity === "critical" && (
                  <Bell
                    className={`w-4 h-4 ${config.iconColor} animate-pulse`}
                  />
                )}
                <ChevronRight
                  className={`w-4 h-4 ${config.iconColor} transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-3">
                <p className={`text-sm ${config.text} leading-relaxed`}>
                  {isEn ? alert.message : alert.messageHi}
                </p>

                <div className="flex gap-2">
                  {alert.contactDoctor && onContactDoctor && (
                    <button
                      type="button"
                      onClick={onContactDoctor}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 text-red-50 font-semibold text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      {isEn ? "Call Doctor" : "डॉक्टर को कॉल करें"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDismiss(alert.id)}
                    className={`flex items-center justify-center gap-1 py-2.5 px-4 rounded-lg border ${config.border} ${config.text} text-sm font-medium ${
                      alert.contactDoctor ? "" : "flex-1"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    {isEn ? "Dismiss" : "खारिज करें"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
