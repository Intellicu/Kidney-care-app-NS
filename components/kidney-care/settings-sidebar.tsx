"use client"

import { useApp, getTranslations, type Language, type NephroticSyndromeCategory } from "@/lib/app-context"
import { 
  X, User, Calendar, Scale, Ruler, Stethoscope, Clock, Pill, FileText, 
  Edit3, ChevronRight, Trash2, Heart, Building, UserCircle, Save, Plus
} from "lucide-react"
import { useState, useEffect } from "react"
import { calculateAllMetrics, formatPercentile } from "@/lib/medical-calculations"

interface SettingsSidebarProps {
  isOpen: boolean
  onClose: () => void
}

type EditableField = 'name' | 'dateOfBirth' | 'sex' | 'weight' | 'height' | 'diagnosis' | 'diagnosisDate' | 'doctorName' | 'hospitalName' | 'reminderTime' | null

export function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
  const { 
    language, 
    patientProfile, 
    updatePatientProfile, 
    medications,
    removeMedication,
    setCurrentScreen 
  } = useApp()
  const t = getTranslations(language)
  
  const [editingField, setEditingField] = useState<EditableField>(null)
  const [editValue, setEditValue] = useState<string>("")
  const [showAddMedication, setShowAddMedication] = useState(false)

  // Calculate metrics whenever profile changes
  const metrics = calculateAllMetrics({
    weight: patientProfile.weight,
    height: patientProfile.height,
    age: patientProfile.age,
    sex: patientProfile.sex
  })

  const handleEdit = (field: EditableField, currentValue: string | number) => {
    setEditingField(field)
    setEditValue(String(currentValue || ''))
  }

  const handleSave = () => {
    if (!editingField) return
    
    switch (editingField) {
      case 'name':
        updatePatientProfile({ name: editValue })
        break
      case 'dateOfBirth':
        // Calculate age from DOB
        const dob = new Date(editValue)
        const today = new Date()
        let age = today.getFullYear() - dob.getFullYear()
        const monthDiff = today.getMonth() - dob.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--
        }
        updatePatientProfile({ dateOfBirth: editValue, age: Math.max(0, age) })
        break
      case 'sex':
        updatePatientProfile({ sex: editValue as 'male' | 'female' | 'other' | '' })
        break
      case 'weight':
        updatePatientProfile({ weight: Number(editValue) || 0 })
        break
      case 'height':
        updatePatientProfile({ height: Number(editValue) || 0 })
        break
      case 'diagnosis':
        updatePatientProfile({ diagnosis: editValue as NephroticSyndromeCategory })
        break
      case 'diagnosisDate':
        updatePatientProfile({ diagnosisDate: editValue })
        break
      case 'doctorName':
        updatePatientProfile({ doctorName: editValue })
        break
      case 'hospitalName':
        updatePatientProfile({ hospitalName: editValue })
        break
      case 'reminderTime':
        updatePatientProfile({ reminderTime: editValue })
        break
    }
    
    setEditingField(null)
    setEditValue("")
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValue("")
  }

  // Labels for different languages
  const labels = {
    en: {
      settings: 'Settings',
      patientProfile: 'Patient Profile',
      name: 'Name',
      age: 'Age',
      dob: 'Date of Birth',
      sex: 'Sex',
      weight: 'Weight',
      height: 'Height',
      diagnosis: 'Diagnosis',
      diagnosisDate: 'Diagnosis Date',
      doctorName: 'Doctor Name',
      hospitalName: 'Hospital',
      reminderTime: 'Daily Reminder',
      medications: 'Medications',
      quickActions: 'Quick Actions',
      viewDiary: 'View Nephrotic Diary',
      viewDiaryDesc: 'View & download health records',
      learnKidney: 'Learn About Kidney Care',
      learnKidneyDesc: 'Educational resources',
      calculatedMetrics: 'Calculated Metrics',
      bmi: 'BMI',
      bsa: 'BSA',
      weightPercentile: 'Weight Percentile',
      heightPercentile: 'Height Percentile',
      notSet: 'Not set - Tap to add',
      years: 'years',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      save: 'Save',
      cancel: 'Cancel',
      tapToEdit: 'Tap to edit',
      addMissing: 'Add missing details',
    },
    hi: {
      settings: 'सेटिंग्स',
      patientProfile: 'रोगी प्रोफ़ाइल',
      name: 'नाम',
      age: 'उम्र',
      dob: 'जन्म तिथि',
      sex: 'लिंग',
      weight: 'वजन',
      height: 'ऊंचाई',
      diagnosis: 'निदान',
      diagnosisDate: 'निदान तिथि',
      doctorName: 'डॉक्टर का नाम',
      hospitalName: 'अस्पताल',
      reminderTime: 'दैनिक रिमाइंडर',
      medications: 'दवाइयाँ',
      quickActions: 'त्वरित क्रियाएँ',
      viewDiary: 'नेफ्रोटिक डायरी देखें',
      viewDiaryDesc: 'स्वास्थ्य रिकॉर्ड देखें और डाउनलोड करें',
      learnKidney: 'किडनी केयर के बारे में सीखें',
      learnKidneyDesc: 'शैक्षिक संसाधन',
      calculatedMetrics: 'गणना किए गए मेट्रिक्स',
      bmi: 'BMI',
      bsa: 'BSA',
      weightPercentile: 'वजन प्रतिशतक',
      heightPercentile: 'ऊंचाई प्रतिशतक',
      notSet: 'सेट नहीं - जोड़ने के लिए टैप करें',
      years: 'वर्ष',
      male: 'पुरुष',
      female: 'महिला',
      other: 'अन्य',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      tapToEdit: 'संपादित करने के लिए टैप करें',
      addMissing: 'छूटी जानकारी जोड़ें',
    }
  }
  
  const l = labels[language] || labels.en

  const getSexDisplay = (sex: string) => {
    if (!sex) return l.notSet
    switch (sex) {
      case 'male': return l.male
      case 'female': return l.female
      case 'other': return l.other
      default: return sex
    }
  }

  const profileFields = [
    { 
      key: 'name' as EditableField, 
      label: l.name, 
      value: patientProfile.name || '', 
      displayValue: patientProfile.name || l.notSet,
      icon: User,
      type: 'text',
      isEmpty: !patientProfile.name
    },
    { 
      key: 'dateOfBirth' as EditableField, 
      label: l.dob, 
      value: patientProfile.dateOfBirth || '', 
      displayValue: patientProfile.dateOfBirth 
        ? new Date(patientProfile.dateOfBirth).toLocaleDateString() 
        : l.notSet,
      icon: Calendar,
      type: 'date',
      isEmpty: !patientProfile.dateOfBirth
    },
    { 
      key: 'sex' as EditableField, 
      label: l.sex, 
      value: patientProfile.sex || '', 
      displayValue: getSexDisplay(patientProfile.sex),
      icon: UserCircle,
      type: 'select',
      options: [
        { value: 'male', label: l.male },
        { value: 'female', label: l.female },
        { value: 'other', label: l.other }
      ],
      isEmpty: !patientProfile.sex
    },
    { 
      key: 'weight' as EditableField, 
      label: l.weight, 
      value: patientProfile.weight || '', 
      displayValue: patientProfile.weight > 0 ? `${patientProfile.weight} kg` : l.notSet,
      icon: Scale,
      type: 'number',
      suffix: 'kg',
      isEmpty: !patientProfile.weight || patientProfile.weight <= 0
    },
    { 
      key: 'height' as EditableField, 
      label: l.height, 
      value: patientProfile.height || '', 
      displayValue: patientProfile.height > 0 ? `${patientProfile.height} cm` : l.notSet,
      icon: Ruler,
      type: 'number',
      suffix: 'cm',
      isEmpty: !patientProfile.height || patientProfile.height <= 0
    },
    { 
      key: 'diagnosis' as EditableField, 
      label: l.diagnosis, 
      value: patientProfile.diagnosis || '', 
      displayValue: patientProfile.diagnosis || l.notSet,
      icon: Stethoscope,
      type: 'select',
      options: [
        { value: 'IFRNS', label: 'IFRNS - Infrequent Relapse' },
        { value: 'FRNS', label: 'FRNS - Frequent Relapse' },
        { value: 'SDNS', label: 'SDNS - Steroid Dependent' },
        { value: 'SRNS', label: 'SRNS - Steroid Resistant' }
      ],
      isEmpty: !patientProfile.diagnosis
    },
    { 
      key: 'diagnosisDate' as EditableField, 
      label: l.diagnosisDate, 
      value: patientProfile.diagnosisDate || '', 
      displayValue: patientProfile.diagnosisDate 
        ? new Date(patientProfile.diagnosisDate).toLocaleDateString() 
        : l.notSet,
      icon: Calendar,
      type: 'date',
      isEmpty: !patientProfile.diagnosisDate
    },
    { 
      key: 'doctorName' as EditableField, 
      label: l.doctorName, 
      value: patientProfile.doctorName || '', 
      displayValue: patientProfile.doctorName || l.notSet,
      icon: Heart,
      type: 'text',
      isEmpty: !patientProfile.doctorName
    },
    { 
      key: 'hospitalName' as EditableField, 
      label: l.hospitalName, 
      value: patientProfile.hospitalName || '', 
      displayValue: patientProfile.hospitalName || l.notSet,
      icon: Building,
      type: 'text',
      isEmpty: !patientProfile.hospitalName
    },
    { 
      key: 'reminderTime' as EditableField, 
      label: l.reminderTime, 
      value: patientProfile.reminderTime || '', 
      displayValue: patientProfile.reminderTime || l.notSet,
      icon: Clock,
      type: 'time',
      isEmpty: !patientProfile.reminderTime
    },
  ]

  // Check for missing fields
  const missingFields = profileFields.filter(f => f.isEmpty)

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-[90%] max-w-md bg-card z-50 transform transition-transform duration-300 ease-out shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full safe-top safe-bottom">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <h2 className="text-xl font-bold text-foreground">{l.settings}</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            
            {/* Missing Fields Alert */}
            {missingFields.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-medium text-amber-800 mb-2">{l.addMissing}</p>
                <p className="text-xs text-amber-600">
                  {missingFields.map(f => f.label).join(', ')}
                </p>
              </div>
            )}

            {/* Calculated Metrics Card */}
            {(patientProfile.weight > 0 && patientProfile.height > 0) && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                  {l.calculatedMetrics}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card/80 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{metrics.bmi ?? '-'}</p>
                    <p className="text-xs text-muted-foreground">{l.bmi}</p>
                    <p className="text-xs font-medium text-foreground mt-1">{metrics.bmiCategory}</p>
                  </div>
                  <div className="bg-card/80 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{metrics.bsa ?? '-'}</p>
                    <p className="text-xs text-muted-foreground">{l.bsa} (m²)</p>
                  </div>
                  {patientProfile.age > 0 && patientProfile.sex && patientProfile.sex !== 'other' && (
                    <>
                      <div className="bg-card/80 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600">
                          {formatPercentile(metrics.weightPercentile)}
                        </p>
                        <p className="text-xs text-muted-foreground">{l.weightPercentile}</p>
                      </div>
                      <div className="bg-card/80 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600">
                          {formatPercentile(metrics.heightPercentile)}
                        </p>
                        <p className="text-xs text-muted-foreground">{l.heightPercentile}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Profile Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {l.patientProfile}
              </h3>
              <div className="space-y-2">
                {profileFields.map((field) => {
                  const Icon = field.icon
                  const isEditing = editingField === field.key
                  
                  return (
                    <div 
                      key={field.key}
                      className={`bg-muted/50 rounded-xl p-4 flex items-center gap-3 ${field.isEmpty ? 'border-2 border-dashed border-amber-300' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${field.isEmpty ? 'bg-amber-100' : 'bg-primary/10'}`}>
                        <Icon className={`w-5 h-5 ${field.isEmpty ? 'text-amber-600' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{field.label}</p>
                        {isEditing ? (
                          <div className="mt-1">
                            {field.type === 'select' ? (
                              <select
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full px-3 py-2 text-base bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                              >
                                <option value="">Select...</option>
                                {field.options?.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex items-center gap-2">
                                <input
                                  type={field.type}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="flex-1 px-3 py-2 text-base bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                  autoFocus
                                />
                                {field.suffix && (
                                  <span className="text-sm text-muted-foreground">{field.suffix}</span>
                                )}
                              </div>
                            )}
                            <div className="flex gap-2 mt-2">
                              <button
                                type="button"
                                onClick={handleSave}
                                className="flex-1 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1"
                              >
                                <Save className="w-4 h-4" />
                                {l.save}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-medium bg-muted text-muted-foreground rounded-lg active:scale-95 transition-all"
                              >
                                {l.cancel}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-base font-medium truncate ${field.isEmpty ? 'text-amber-600 italic' : 'text-foreground'}`}>
                            {field.displayValue}
                          </p>
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleEdit(field.key, field.value)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 transition-all ${
                            field.isEmpty 
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                              : 'bg-background text-muted-foreground hover:text-primary'
                          }`}
                        >
                          {field.isEmpty ? <Plus className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Medications Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {l.medications} ({medications.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    setCurrentScreen("medications")
                  }}
                  className="text-sm text-primary font-medium flex items-center gap-1"
                >
                  {t.addMedication}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              {medications.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {medications.map((med) => (
                    <div 
                      key={med.id}
                      className="bg-muted/50 rounded-xl p-4 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Pill className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-foreground truncate">{med.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {med.dose} | {med.frequency}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedication(med.id)}
                        className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 active:scale-95 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground">{t.noActiveMedications}</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {l.quickActions}
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    setCurrentScreen("nephrotic-diary")
                  }}
                  className="w-full bg-muted/50 rounded-xl p-4 flex items-center gap-3 hover:bg-muted active:scale-[0.98] transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-medium text-foreground">{l.viewDiary}</p>
                    <p className="text-xs text-muted-foreground">{l.viewDiaryDesc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    setCurrentScreen("education")
                  }}
                  className="w-full bg-muted/50 rounded-xl p-4 flex items-center gap-3 hover:bg-muted active:scale-[0.98] transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-medium text-foreground">{l.learnKidney}</p>
                    <p className="text-xs text-muted-foreground">{l.learnKidneyDesc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              KidneyCare v1.0
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
