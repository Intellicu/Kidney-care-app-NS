"use client"

import { useState, useMemo } from "react"
import { useApp, getTranslations } from "@/lib/app-context"
import { TopHeaderBar } from "../top-header-bar"
import {
  ChevronLeft,
  Download,
  Share2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  TestTube,
  Pill,
  Scale,
  Heart,
  Droplets,
  Filter,
  ChevronDown,
  Info,
  Eye,
  Sparkles,
} from "lucide-react"

// Result value mapping for charts
const resultValues: Record<string, number> = {
  'negative': 0,
  'trace': 1,
  '1+': 2,
  '2+': 3,
  '3+': 4,
  '4+': 5,
}

const resultLabels = ['NEG', 'TR', '1+', '2+', '3+', '4+']
const resultColors = [
  'bg-yellow-400', // negative
  'bg-yellow-500', // trace  
  'bg-green-400', // 1+
  'bg-green-500', // 2+
  'bg-orange-400', // 3+
  'bg-red-500', // 4+
]

export function HealthTrendScreen() {
  const {
    language,
    setCurrentScreen,
    patientProfile,
    urineTests,
    medications,
    symptomEntries,
    dailyCheckIns,
    healthData,
  } = useApp()
  const t = getTranslations(language)

  const [filterDays, setFilterDays] = useState(14)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState<'protein' | 'weight' | 'meds'>('protein')

  // Labels
  const labels = {
    en: {
      healthTrend: 'Health Trend',
      proteinTrend: 'Protein Trend',
      weightTrend: 'Weight Trend',
      medsTrend: 'Medications',
      days: 'days',
      download: 'Download',
      share: 'Share',
      noData: 'No data yet',
      startTracking: 'Complete daily health checks to see trends',
      yourReading: 'Your Reading',
      aiAnalysis: 'AI Analysis',
      average: 'Average',
      highest: 'Highest',
      lowest: 'Lowest',
      trend: 'Trend',
      improving: 'Improving',
      stable: 'Stable',
      worsening: 'Needs attention',
      proteinLevel: 'Protein Level',
      weight: 'Weight',
      compliance: 'Compliance',
      taken: 'taken',
      kg: 'kg',
      lastDays: 'Last',
      viewDiary: 'View Full Diary',
    },
    hi: {
      healthTrend: 'स्वास्थ्य रुझान',
      proteinTrend: 'प्रोटीन रुझान',
      weightTrend: 'वजन रुझान',
      medsTrend: 'दवाइयाँ',
      days: 'दिन',
      download: 'डाउनलोड',
      share: 'भेजें',
      noData: 'अभी तक कोई डेटा नहीं',
      startTracking: 'रुझान देखने के लिए दैनिक स्वास्थ्य जांच पूरी करें',
      yourReading: 'आपकी रीडिंग',
      aiAnalysis: 'AI विश्लेषण',
      average: 'औसत',
      highest: 'उच्चतम',
      lowest: 'न्यूनतम',
      trend: 'रुझान',
      improving: 'सुधार हो रहा है',
      stable: 'स्थिर',
      worsening: 'ध्यान दें',
      proteinLevel: 'प्रोटीन स्तर',
      weight: 'वजन',
      compliance: 'अनुपालन',
      taken: 'ली गई',
      kg: 'किलो',
      lastDays: 'पिछले',
      viewDiary: 'पूरी डायरी देखें',
    }
  }
  const l = labels[language] || labels.en

  // Get filtered data
  const getFilteredData = useMemo(() => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - filterDays)
    const cutoffStr = cutoffDate.toISOString().split('T')[0]

    return {
      urineTests: urineTests.filter(t => t.date >= cutoffStr).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      healthData: healthData.filter(h => h.date >= cutoffStr).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      dailyCheckIns: dailyCheckIns.filter(c => c.date >= cutoffStr),
    }
  }, [filterDays, urineTests, healthData, dailyCheckIns])

  // Calculate statistics for protein
  const proteinStats = useMemo(() => {
    const tests = getFilteredData.urineTests
    if (tests.length === 0) return null

    const patientValues = tests.filter(t => t.patientResult).map(t => resultValues[t.patientResult!] || 0)
    const aiValues = tests.filter(t => t.aiResult).map(t => resultValues[t.aiResult!] || 0)
    const allValues = [...patientValues, ...aiValues]

    if (allValues.length === 0) return null

    const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length
    const max = Math.max(...allValues)
    const min = Math.min(...allValues)

    // Calculate trend (compare first half to second half)
    const mid = Math.floor(allValues.length / 2)
    const firstHalf = allValues.slice(0, mid)
    const secondHalf = allValues.slice(mid)
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0
    
    let trend: 'improving' | 'stable' | 'worsening' = 'stable'
    if (secondAvg < firstAvg - 0.5) trend = 'improving'
    else if (secondAvg > firstAvg + 0.5) trend = 'worsening'

    return { avg, max, min, trend, count: tests.length }
  }, [getFilteredData.urineTests])

  // Calculate weight stats
  const weightStats = useMemo(() => {
    const data = getFilteredData.healthData.filter(h => h.weight)
    if (data.length === 0) return null

    const weights = data.map(h => h.weight!)
    const avg = weights.reduce((a, b) => a + b, 0) / weights.length
    const max = Math.max(...weights)
    const min = Math.min(...weights)

    return { avg: avg.toFixed(1), max, min, count: data.length }
  }, [getFilteredData.healthData])

  // Calculate medication compliance
  const medCompliance = useMemo(() => {
    const checkIns = getFilteredData.dailyCheckIns.filter(c => c.medicationCheckCompleted)
    const totalDays = filterDays
    const completedDays = checkIns.length
    const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
    return { completedDays, totalDays, percentage }
  }, [getFilteredData.dailyCheckIns, filterDays])

  // Generate CSV for download
  const generateCSV = () => {
    const headers = [
      "Date",
      "Patient Protein Reading",
      "AI Protein Analysis",
      "Weight (kg)",
      "BP Systolic",
      "BP Diastolic",
      "Feeling",
      "Medications Completed"
    ]

    const allDates = new Set<string>()
    getFilteredData.urineTests.forEach(t => allDates.add(t.date))
    getFilteredData.healthData.forEach(h => allDates.add(h.date))
    getFilteredData.dailyCheckIns.forEach(c => allDates.add(c.date))

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const rows = sortedDates.map(date => {
      const urine = getFilteredData.urineTests.find(t => t.date === date)
      const health = getFilteredData.healthData.find(h => h.date === date)
      const checkIn = getFilteredData.dailyCheckIns.find(c => c.date === date)
      const symptom = symptomEntries.find(s => s.date === date)

      return [
        date,
        urine?.patientResult || "-",
        urine?.aiResult || "-",
        health?.weight || "-",
        health?.bp?.systolic || "-",
        health?.bp?.diastolic || "-",
        symptom?.feeling || "-",
        checkIn?.medicationCheckCompleted ? "Yes" : "No"
      ]
    })

    const csvContent = [
      `Patient: ${patientProfile.name}`,
      `Diagnosis: ${patientProfile.diagnosis}`,
      `Period: Last ${filterDays} days`,
      `Generated: ${new Date().toLocaleDateString()}`,
      "",
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    return csvContent
  }

  const handleDownload = () => {
    const csv = generateCSV()
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `health-trend-${patientProfile.name?.replace(/\s+/g, "-") || "patient"}-${filterDays}days.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    const csv = generateCSV()
    
    if (navigator.share) {
      try {
        const blob = new Blob([csv], { type: "text/csv" })
        const file = new File([blob], `health-trend-${filterDays}days.csv`, { type: "text/csv" })
        
        await navigator.share({
          title: `${patientProfile.name}'s Health Trend`,
          text: language === "en" 
            ? `Health trend for last ${filterDays} days`
            : `पिछले ${filterDays} दिनों का स्वास्थ्य रुझान`,
          files: [file],
        })
      } catch {
        handleDownload()
      }
    } else {
      handleDownload()
    }
  }

  // Format date for chart labels
  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getDate()}/${date.getMonth() + 1}`
  }

  // Get trend icon and color
  const getTrendInfo = (trend: 'improving' | 'stable' | 'worsening') => {
    switch (trend) {
      case 'improving':
        return { icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-100', label: l.improving }
      case 'worsening':
        return { icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-100', label: l.worsening }
      default:
        return { icon: Minus, color: 'text-blue-600', bg: 'bg-blue-100', label: l.stable }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopHeaderBar showMenu={false} />

      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => setCurrentScreen("dashboard")}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{l.healthTrend}</h1>
            <p className="text-sm text-muted-foreground">
              {patientProfile.name} | {l.lastDays} {filterDays} {l.days}
            </p>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex gap-2">
          {/* Filter dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="h-10 px-3 rounded-xl bg-muted flex items-center gap-2 text-foreground"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">{filterDays} {l.days}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showFilterDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)} />
                <div className="absolute left-0 top-full mt-2 w-32 bg-card rounded-xl border border-border shadow-lg z-50 overflow-hidden">
                  {[7, 14, 30, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setFilterDays(days)
                        setShowFilterDropdown(false)
                      }}
                      className={`w-full px-4 py-3 text-left text-sm ${
                        filterDays === days ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {days} {l.days}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="h-10 px-3 rounded-xl bg-primary/10 text-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">{l.download}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="h-10 px-3 rounded-xl bg-primary text-primary-foreground flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">{l.share}</span>
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex gap-2">
          {[
            { id: 'protein', icon: TestTube, label: l.proteinTrend },
            { id: 'weight', icon: Scale, label: l.weightTrend },
            { id: 'meds', icon: Pill, label: l.medsTrend },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24">
        {/* Protein Trend Tab */}
        {activeTab === 'protein' && (
          <div className="space-y-4">
            {getFilteredData.urineTests.length > 0 ? (
              <>
                {/* Stats cards */}
                {proteinStats && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Trend card */}
                    <div className={`rounded-xl p-4 ${getTrendInfo(proteinStats.trend).bg}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {(() => {
                          const TrendIcon = getTrendInfo(proteinStats.trend).icon
                          return <TrendIcon className={`w-5 h-5 ${getTrendInfo(proteinStats.trend).color}`} />
                        })()}
                        <span className="text-sm font-medium text-muted-foreground">{l.trend}</span>
                      </div>
                      <p className={`text-lg font-bold ${getTrendInfo(proteinStats.trend).color}`}>
                        {getTrendInfo(proteinStats.trend).label}
                      </p>
                    </div>

                    {/* Average card */}
                    <div className="bg-card rounded-xl p-4 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <TestTube className="w-5 h-5 text-amber-500" />
                        <span className="text-sm font-medium text-muted-foreground">{l.average}</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {resultLabels[Math.round(proteinStats.avg)] || '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">{proteinStats.count} tests</p>
                    </div>
                  </div>
                )}

                {/* Chart */}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    {l.proteinLevel}
                  </h3>

                  {/* Simple bar chart */}
                  <div className="relative h-48 mb-4">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-muted-foreground">
                      {resultLabels.slice().reverse().map((label, i) => (
                        <span key={i}>{label}</span>
                      ))}
                    </div>

                    {/* Chart area */}
                    <div className="ml-10 h-full flex items-end gap-1 overflow-x-auto pb-6">
                      {getFilteredData.urineTests.map((test, index) => {
                        const patientVal = test.patientResult ? resultValues[test.patientResult] : null
                        const aiVal = test.aiResult ? resultValues[test.aiResult] : null
                        const maxVal = 5
                        
                        return (
                          <div key={index} className="flex flex-col items-center flex-shrink-0" style={{ width: '40px' }}>
                            <div className="h-36 flex items-end gap-0.5">
                              {/* Patient reading bar */}
                              {patientVal !== null && (
                                <div
                                  className={`w-3 rounded-t ${resultColors[patientVal]} opacity-80`}
                                  style={{ height: `${((patientVal + 1) / (maxVal + 1)) * 100}%` }}
                                  title={`${l.yourReading}: ${test.patientResult}`}
                                />
                              )}
                              {/* AI reading bar */}
                              {aiVal !== null && (
                                <div
                                  className={`w-3 rounded-t ${resultColors[aiVal]}`}
                                  style={{ height: `${((aiVal + 1) / (maxVal + 1)) * 100}%` }}
                                  title={`${l.aiAnalysis}: ${test.aiResult}`}
                                />
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 rotate-45 origin-left">
                              {formatDateShort(test.date)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-muted-foreground">{l.yourReading}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">{l.aiAnalysis}</span>
                    </div>
                  </div>
                </div>

                {/* Daily breakdown */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 bg-muted/50 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Daily Records</h3>
                  </div>
                  <div className="divide-y divide-border max-h-64 overflow-y-auto">
                    {getFilteredData.urineTests.slice().reverse().map((test, index) => (
                      <div key={index} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{formatDateShort(test.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {test.patientResult && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${resultColors[resultValues[test.patientResult]]} text-white`}>
                              {test.patientResult.toUpperCase()}
                            </span>
                          )}
                          {test.aiResult && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${resultColors[resultValues[test.aiResult]]} text-white border-2 border-white`}>
                              AI: {test.aiResult.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <TestTube className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{l.noData}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{l.startTracking}</p>
              </div>
            )}
          </div>
        )}

        {/* Weight Trend Tab */}
        {activeTab === 'weight' && (
          <div className="space-y-4">
            {getFilteredData.healthData.filter(h => h.weight).length > 0 ? (
              <>
                {/* Stats cards */}
                {weightStats && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <Scale className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{l.average}</p>
                      <p className="text-lg font-bold text-blue-700">{weightStats.avg} {l.kg}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <TrendingDown className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{l.lowest}</p>
                      <p className="text-lg font-bold text-emerald-700">{weightStats.min} {l.kg}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                      <TrendingUp className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{l.highest}</p>
                      <p className="text-lg font-bold text-rose-700">{weightStats.max} {l.kg}</p>
                    </div>
                  </div>
                )}

                {/* Simple line chart representation */}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-primary" />
                    {l.weight} ({l.kg})
                  </h3>

                  <div className="h-40 flex items-end gap-2 overflow-x-auto pb-6">
                    {getFilteredData.healthData.filter(h => h.weight).map((data, index, arr) => {
                      const weights = arr.map(d => d.weight!)
                      const min = Math.min(...weights)
                      const max = Math.max(...weights)
                      const range = max - min || 1
                      const heightPercent = ((data.weight! - min) / range) * 70 + 30

                      return (
                        <div key={index} className="flex flex-col items-center flex-shrink-0" style={{ width: '50px' }}>
                          <div className="h-32 flex items-end">
                            <div
                              className="w-6 rounded-t bg-gradient-to-t from-blue-500 to-blue-300"
                              style={{ height: `${heightPercent}%` }}
                            >
                              <div className="text-[10px] text-white font-bold text-center pt-1">
                                {data.weight}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {formatDateShort(data.date)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Scale className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{l.noData}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{l.startTracking}</p>
              </div>
            )}
          </div>
        )}

        {/* Medications Tab */}
        {activeTab === 'meds' && (
          <div className="space-y-4">
            {/* Compliance card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Pill className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900">{l.compliance}</h3>
                    <p className="text-sm text-emerald-700">
                      {medCompliance.completedDays}/{medCompliance.totalDays} {l.days}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-emerald-600">{medCompliance.percentage}%</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-4 bg-emerald-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${medCompliance.percentage}%` }}
                />
              </div>
            </div>

            {/* Medications list */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 bg-muted/50 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">
                  {language === 'en' ? 'Your Medications' : 'आपकी दवाइयाँ'} ({medications.filter(m => m.isActive).length})
                </h3>
              </div>
              <div className="divide-y divide-border">
                {medications.filter(m => m.isActive).map((med) => (
                  <div key={med.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{med.name}</p>
                      <p className="text-xs text-muted-foreground">{med.dose} - {med.frequency}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      med.takenToday ? 'bg-emerald-100' : 'bg-muted'
                    }`}>
                      {med.takenToday ? (
                        <Pill className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Pill className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}

                {medications.filter(m => m.isActive).length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Pill className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'en' ? 'No medications added' : 'कोई दवाई नहीं जोड़ी गई'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Full Diary button */}
        <button
          type="button"
          onClick={() => setCurrentScreen("nephrotic-diary")}
          className="w-full mt-4 py-4 rounded-xl bg-muted text-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
        >
          <Calendar className="w-5 h-5" />
          {l.viewDiary}
        </button>
      </div>
    </div>
  )
}
