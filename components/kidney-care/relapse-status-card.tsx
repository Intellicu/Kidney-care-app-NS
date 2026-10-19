"use client"

import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
} from "lucide-react"
import type { RelapseStatus } from "@/lib/relapse-detection"
import { getStatusSummary } from "@/lib/relapse-detection"

interface RelapseStatusCardProps {
  relapseStatus: RelapseStatus
  language: string
}

const trendIcons = {
  improving: TrendingDown,
  worsening: TrendingUp,
  stable: Minus,
  unknown: HelpCircle,
}

const trendLabels = {
  improving: { en: "Improving", hi: "सुधार हो रहा है" },
  worsening: { en: "Worsening", hi: "बिगड़ रहा है" },
  stable: { en: "Stable", hi: "स्थिर" },
  unknown: { en: "Unknown", hi: "अज्ञात" },
}

const trendColors = {
  improving: "text-emerald-600",
  worsening: "text-red-600",
  stable: "text-blue-600",
  unknown: "text-muted-foreground",
}

const statusIcons = {
  remission: ShieldCheck,
  relapse: AlertTriangle,
  "active-monitoring": Activity,
  unknown: HelpCircle,
}

export function RelapseStatusCard({
  relapseStatus,
  language,
}: RelapseStatusCardProps) {
  const isEn = language === "en" || !["hi", "bn", "ta", "pa"].includes(language)
  const summary = getStatusSummary(relapseStatus, language)
  const StatusIcon = statusIcons[relapseStatus.status]
  const TrendIcon = trendIcons[relapseStatus.trend]
  const trendLabel =
    trendLabels[relapseStatus.trend][isEn ? "en" : "hi"]

  return (
    <div
      className={`rounded-2xl p-4 border ${
        relapseStatus.status === "relapse"
          ? "border-red-300 bg-red-50"
          : relapseStatus.status === "remission"
            ? "border-emerald-300 bg-emerald-50"
            : "border-border bg-card"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${summary.color}`} />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            {isEn ? "Disease Status" : "रोग स्थिति"}
          </h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${summary.color} ${summary.bgColor}`}
        >
          {summary.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {/* Consecutive days indicator */}
        <div className="bg-background/60 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {relapseStatus.status === "relapse"
              ? relapseStatus.consecutivePositiveDays
              : relapseStatus.consecutiveNegativeDays}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            {relapseStatus.status === "relapse"
              ? isEn
                ? "Days 3+"
                : "दिन 3+"
              : isEn
                ? "Days Clear"
                : "दिन स्वच्छ"}
          </p>
        </div>

        {/* Trend */}
        <div className="bg-background/60 rounded-xl p-3 text-center">
          <TrendIcon
            className={`w-6 h-6 mx-auto mb-1 ${trendColors[relapseStatus.trend]}`}
          />
          <p className="text-[10px] text-muted-foreground leading-tight">
            {trendLabel}
          </p>
        </div>

        {/* Total relapses */}
        <div className="bg-background/60 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {relapseStatus.relapseCount}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            {isEn ? "Relapses" : "रिलैप्स"}
          </p>
        </div>
      </div>

      {/* Last test info */}
      {relapseStatus.lastTestDate && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>
            {isEn ? "Last test:" : "अंतिम जांच:"}{" "}
            {relapseStatus.daysSinceLastTest === 0
              ? isEn
                ? "Today"
                : "आज"
              : relapseStatus.daysSinceLastTest === 1
                ? isEn
                  ? "Yesterday"
                  : "कल"
                : `${relapseStatus.daysSinceLastTest} ${isEn ? "days ago" : "दिन पहले"}`}
          </span>
        </div>
      )}
    </div>
  )
}
