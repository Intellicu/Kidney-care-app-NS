"use client"

import { useState } from "react"
import { useApp, getTranslations } from "@/lib/app-context"
import { 
  ChevronLeft, Download, Share2, Calendar, TestTube, Pill, 
  HeartPulse, FileSpreadsheet, Filter, ChevronDown, CheckCircle2,
  XCircle, AlertCircle, Eye, Sparkles
} from "lucide-react"
import { TopHeaderBar } from "../top-header-bar"
import { PullToRefresh } from "../pull-to-refresh"

export function NephroticDiaryScreen() {
  const { 
    language, 
    setCurrentScreen,
    patientProfile,
    urineTests,
    medications,
    symptomEntries,
    dailyCheckIns,
    healthData,
    refreshData,
  } = useApp()
  const t = getTranslations(language)
  
  const [filterDays, setFilterDays] = useState(30)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Get filtered data based on days
  const getFilteredData = () => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - filterDays)
    const cutoffStr = cutoffDate.toISOString().split('T')[0]
    
    return {
      urineTests: urineTests.filter(t => t.date >= cutoffStr),
      symptomEntries: symptomEntries.filter(s => s.date >= cutoffStr),
      dailyCheckIns: dailyCheckIns.filter(c => c.date >= cutoffStr),
      healthData: healthData.filter(h => h.date >= cutoffStr),
    }
  }

  const filtered = getFilteredData()

  // Generate Excel/CSV content - NOW INCLUDES BOTH PATIENT AND AI RESULTS
  const generateCSV = () => {
    const headers = [
      "Date",
      "Patient Reading",
      "AI Analysis",
      "Final Result",
      "Feeling",
      "Swelling",
      "Fever",
      "Vomiting",
      "Breathing Difficulty",
      "Medications Taken",
      "Weight (kg)",
      "BP",
      "Notes"
    ]

    // Create a map of all dates
    const allDates = new Set<string>()
    filtered.urineTests.forEach(t => allDates.add(t.date))
    filtered.symptomEntries.forEach(s => allDates.add(s.date))
    filtered.dailyCheckIns.forEach(c => allDates.add(c.date))
    filtered.healthData.forEach(h => allDates.add(h.date))

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const rows = sortedDates.map(date => {
      const urineTest = filtered.urineTests.find(t => t.date === date)
      const symptom = filtered.symptomEntries.find(s => s.date === date)
      const health = filtered.healthData.find(h => h.date === date)

      const medsTaken = medications.filter(m => m.takenYesterday).map(m => m.name).join("; ")

      return [
        date,
        urineTest?.patientResult || "-",
        urineTest?.aiResult || "-",
        urineTest?.result || "-",
        symptom?.feeling || "-",
        symptom?.symptoms.swelling ? "Yes" : "No",
        symptom?.symptoms.fever ? "Yes" : "No",
        symptom?.symptoms.vomiting ? "Yes" : "No",
        symptom?.symptoms.breathingDifficulty ? "Yes" : "No",
        medsTaken || "-",
        health?.weight || "-",
        health?.bp ? `${health.bp.systolic}/${health.bp.diastolic}` : "-",
        ""
      ]
    })

    const csvContent = [
      `Patient: ${patientProfile.name}`,
      `Diagnosis: ${patientProfile.diagnosis}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      "",
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    return csvContent
  }

  // Download as CSV
  const handleDownload = () => {
    const csv = generateCSV()
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `nephrotic-diary-${patientProfile.name?.replace(/\s+/g, "-") || "patient"}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Share functionality
  const handleShare = async () => {
    const csv = generateCSV()
    
    if (navigator.share) {
      try {
        const blob = new Blob([csv], { type: "text/csv" })
        const file = new File([blob], `nephrotic-diary-${new Date().toISOString().split('T')[0]}.csv`, { type: "text/csv" })
        
        await navigator.share({
          title: `${patientProfile.name}'s Nephrotic Diary`,
          text: language === "en" 
            ? "Health records from KidneyCare app"
            : "किडनीकेयर ऐप से स्वास्थ्य रिकॉर्ड",
          files: [file],
        })
      } catch {
        // Fallback to download
        handleDownload()
      }
    } else {
      handleDownload()
    }
  }

  // Get result color
  const getResultColor = (result: string | null | undefined) => {
    switch (result) {
      case "negative": return "bg-yellow-100 text-yellow-800"
      case "trace": return "bg-yellow-200 text-yellow-900"
      case "1+": return "bg-green-100 text-green-800"
      case "2+": return "bg-green-200 text-green-900"
      case "3+": return "bg-orange-200 text-orange-900"
      case "4+": return "bg-red-200 text-red-900"
      default: return "bg-muted text-muted-foreground"
    }
  }

  // Get feeling icon
  const getFeelingIcon = (feeling: string) => {
    switch (feeling) {
      case "very-good": return { emoji: "😊", color: "text-emerald-600" }
      case "okay": return { emoji: "😐", color: "text-amber-600" }
      case "not-well": return { emoji: "😟", color: "text-rose-600" }
      default: return { emoji: "-", color: "text-muted-foreground" }
    }
  }

  // Combine all data by date - NOW INCLUDES BOTH RESULTS
  const getDiaryEntries = () => {
    const entries: Array<{
      date: string
      patientResult?: string | null
      aiResult?: string | null
      finalResult?: string
      feeling?: string
      symptoms?: { swelling: boolean; fever: boolean; vomiting: boolean; breathingDifficulty: boolean }
      medicationsTaken?: number
      totalMedications?: number
      weight?: number
      completed: boolean
      skipped: boolean
    }> = []

    const allDates = new Set<string>()
    filtered.urineTests.forEach(t => allDates.add(t.date))
    filtered.symptomEntries.forEach(s => allDates.add(s.date))
    filtered.dailyCheckIns.forEach(c => allDates.add(c.date))

    Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).forEach(date => {
      const urineTest = filtered.urineTests.find(t => t.date === date)
      const symptom = filtered.symptomEntries.find(s => s.date === date)
      const checkIn = filtered.dailyCheckIns.find(c => c.date === date)
      const health = filtered.healthData.find(h => h.date === date)

      entries.push({
        date,
        patientResult: urineTest?.patientResult,
        aiResult: urineTest?.aiResult,
        finalResult: urineTest?.result,
        feeling: symptom?.feeling,
        symptoms: symptom?.symptoms,
        medicationsTaken: medications.filter(m => m.takenYesterday).length,
        totalMedications: medications.filter(m => m.isActive).length,
        weight: health?.weight,
        completed: checkIn?.urineTestCompleted || checkIn?.medicationCheckCompleted || false,
        skipped: checkIn?.urineTestSkipped || checkIn?.medicationCheckSkipped || false,
      })
    })

    return entries
  }

  const diaryEntries = getDiaryEntries()

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === today.toISOString().split('T')[0]) {
      return language === "en" ? "Today" : "आज"
    }
    if (dateStr === yesterday.toISOString().split('T')[0]) {
      return language === "en" ? "Yesterday" : "कल"
    }
    
    return date.toLocaleDateString(language === "en" ? "en-IN" : "hi-IN", {
      day: "numeric",
      month: "short",
    })
  }

  return (
  <PullToRefresh onRefresh={refreshData} className="min-h-screen">
  <div className="min-h-screen flex flex-col bg-background">
  <TopHeaderBar showMenu={false} />
      
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => setCurrentScreen("dashboard")}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {language === "en" ? "Nephrotic Diary" : "नेफ्रोटिक डायरी"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {patientProfile.name} | {patientProfile.diagnosis}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {/* Filter dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="h-11 px-4 rounded-xl bg-muted flex items-center gap-2 text-foreground"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">
                {filterDays} {language === "en" ? "days" : "दिन"}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showFilterDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)} />
                <div className="absolute left-0 top-full mt-2 w-36 bg-card rounded-xl border border-border shadow-lg z-50 overflow-hidden">
                  {[7, 14, 30, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setFilterDays(days)
                        setShowFilterDropdown(false)
                      }}
                      className={`w-full px-4 py-3 text-left text-sm ${
                        filterDays === days ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {days} {language === "en" ? "days" : "दिन"}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            className="h-11 px-4 rounded-xl bg-primary/10 text-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">
              {language === "en" ? "Excel" : "एक्सेल"}
            </span>
          </button>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="h-11 px-4 rounded-xl bg-primary text-primary-foreground flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {language === "en" ? "Share" : "भेजें"}
            </span>
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="px-5 py-4 grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-2">
            <TestTube className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">{filtered.urineTests.length}</p>
          <p className="text-xs text-muted-foreground">
            {language === "en" ? "Urine Tests" : "मूत्र परीक्षण"}
          </p>
        </div>
        
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-2">
            <Pill className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {filtered.dailyCheckIns.filter(c => c.medicationCheckCompleted).length}
          </p>
          <p className="text-xs text-muted-foreground">
            {language === "en" ? "Med Checks" : "दवाई जांच"}
          </p>
        </div>
        
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center mx-auto mb-2">
            <HeartPulse className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-foreground">{filtered.symptomEntries.length}</p>
          <p className="text-xs text-muted-foreground">
            {language === "en" ? "Assessments" : "आकलन"}
          </p>
        </div>
      </div>

      {/* Diary entries */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {language === "en" ? "Health Log" : "स्वास्थ्य लॉग"}
        </h2>

        {diaryEntries.length > 0 ? (
          <div className="space-y-3">
            {diaryEntries.map((entry, index) => {
              const feelingInfo = getFeelingIcon(entry.feeling || "")
              
              return (
                <div 
                  key={index}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  {/* Date header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{formatDate(entry.date)}</span>
                      <span className="text-sm text-muted-foreground">{entry.date}</span>
                    </div>
                    {entry.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : entry.skipped ? (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Entry details - NOW SHOWS BOTH RESULTS */}
                  <div className="p-4">
                    {/* Urine Test Results - Both Patient and AI */}
                    {(entry.patientResult || entry.aiResult) && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                          {language === "en" ? "Urine Protein Test" : "मूत्र प्रोटीन परीक्षण"}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Patient Reading */}
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <Eye className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {language === "en" ? "Your Reading" : "आपकी रीडिंग"}
                              </p>
                              {entry.patientResult ? (
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getResultColor(entry.patientResult)}`}>
                                  {entry.patientResult.toUpperCase()}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </div>

                          {/* AI Analysis */}
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {language === "en" ? "AI Analysis" : "AI विश्लेषण"}
                              </p>
                              {entry.aiResult ? (
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getResultColor(entry.aiResult)}`}>
                                  {entry.aiResult.toUpperCase()}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Match indicator */}
                        {entry.patientResult && entry.aiResult && (
                          <div className={`mt-2 text-xs px-2 py-1 rounded ${
                            entry.patientResult === entry.aiResult
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {entry.patientResult === entry.aiResult
                              ? (language === "en" ? "Readings match" : "रीडिंग मेल खाती हैं")
                              : (language === "en" ? "Readings differ" : "रीडिंग अलग हैं")
                            }
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {/* Feeling */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">{feelingInfo.emoji}</span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {language === "en" ? "Feeling" : "महसूस"}
                          </p>
                          <p className={`text-sm font-medium ${feelingInfo.color}`}>
                            {entry.feeling 
                              ? (entry.feeling === "very-good" ? t.veryGood : entry.feeling === "okay" ? t.okay : t.notWell)
                              : "-"
                            }
                          </p>
                        </div>
                      </div>

                      {/* Medications */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Pill className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {language === "en" ? "Medicines" : "दवाइयाँ"}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {entry.medicationsTaken !== undefined 
                              ? `${entry.medicationsTaken}/${entry.totalMedications}`
                              : "-"
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Symptoms indicator */}
                    {entry.symptoms && (entry.symptoms.swelling || entry.symptoms.fever || entry.symptoms.vomiting || entry.symptoms.breathingDifficulty) && (
                      <div className="mt-3 flex items-center gap-3 pt-3 border-t border-border">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {language === "en" ? "Symptoms" : "लक्षण"}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {[
                              entry.symptoms.swelling && (language === "en" ? "Swelling" : "सूजन"),
                              entry.symptoms.fever && (language === "en" ? "Fever" : "बुखार"),
                              entry.symptoms.vomiting && (language === "en" ? "Vomiting" : "उल्टी"),
                              entry.symptoms.breathingDifficulty && (language === "en" ? "Breathing" : "सांस"),
                            ].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              {language === "en" ? "No Records Yet" : "अभी तक कोई रिकॉर्ड नहीं"}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === "en" 
                ? "Complete your daily health checks to see records here"
                : "यहां रिकॉर्ड देखने के लिए अपनी दैनिक स्वास्थ्य जांच पूरी करें"
              }
            </p>
            <button
              type="button"
              onClick={() => setCurrentScreen("daily-health-log")}
              className="mt-4 px-6 h-12 bg-primary text-primary-foreground rounded-xl font-semibold"
            >
              {language === "en" ? "Start Daily Check" : "दैनिक जांच शुरू करें"}
            </button>
          </div>
        )}
      </div>
    </div>
  </PullToRefresh>
  )
}
