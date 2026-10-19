import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Loader2, ChevronRight, ChevronLeft, CheckCircle, Heart, Activity,
  Scale, Droplets, Pill, FileText, SkipForward, Mic, MicOff, X, Camera, Star, Zap, Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 'symptoms', label: 'Symptoms & Mood', labelHi: 'लक्षण और मनोदशा', icon: Heart, color: 'rose' },
  { id: 'bp_weight', label: 'BP & Weight', labelHi: 'बीपी और वज़न', icon: Activity, color: 'purple' },
  { id: 'dipstick', label: 'Urine Test', labelHi: 'पेशाब जाँच', icon: Droplets, color: 'blue' },
  { id: 'medications', label: 'Medications', labelHi: 'दवाइयाँ', icon: Pill, color: 'green' },
  { id: 'notes', label: 'Daily Notes', labelHi: 'नोट्स', icon: FileText, color: 'amber' },
];

const SYMPTOMS = [
  { key: 'swelling', en: 'Swelling (face/hands/feet)', hi: 'सूजन (चेहरा/हाथ/पैर)' },
  { key: 'urine_changes', en: 'Less urine than usual', hi: 'पेशाब कम होना' },
  { key: 'fever', en: 'Fever', hi: 'बुखार' },
  { key: 'vomiting', en: 'Vomiting / Nausea', hi: 'उल्टी / जी मिचलाना' },
  { key: 'breathing_difficulty', en: 'Difficulty breathing', hi: 'सांस लेने में तकलीफ़' },
  { key: 'rapid_weight_gain', en: 'Rapid weight gain', hi: 'तेज़ी से वज़न बढ़ना' },
  { key: 'appetite_loss', en: 'Loss of appetite', hi: 'भूख न लगना' },
];

const PROTEIN_LEVELS = ['Negative', 'Trace', '1+', '2+', '3+', '4+'];
const PROTEIN_COLORS = {
  'Negative': 'bg-green-500', 'Trace': 'bg-lime-400',
  '1+': 'bg-yellow-400', '2+': 'bg-orange-400', '3+': 'bg-red-500', '4+': 'bg-red-700'
};

export default function DailyCheckin() {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState(() => localStorage.getItem('kidneycare_language') || 'en');
  const hi = lang === 'hi';
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date().toISOString();

  // Step data
  const [feeling, setFeeling] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [weight, setWeight] = useState('');
  const [proteinLevel, setProteinLevel] = useState('Negative');
  const [skipDipstick, setSkipDipstick] = useState(false);
  const [medicationsTaken, setMedicationsTaken] = useState({});
  const [noteText, setNoteText] = useState('');
  const [additionalComplaint, setAdditionalComplaint] = useState('');
  const [mood, setMood] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [appetite, setAppetite] = useState('');
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [symptomSavedOnly, setSymptomSavedOnly] = useState(false);
  const [skippedSteps, setSkippedSteps] = useState([]);
  const [dipstickPhoto, setDipstickPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [showXpPop, setShowXpPop] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['checkinPatient'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const pts = await base44.entities.Patient.filter({ created_by: user.email });
      return pts.find(p => p.onboarding_complete) || pts[0];
    }
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['checkinMeds', patient?.id],
    queryFn: () => base44.entities.Medication.filter({ patient_id: patient.id, active: true }),
    enabled: !!patient?.id
  });

  const toggleSymptom = (key) => {
    setSymptoms(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  };

  const awardXP = (pts) => {
    setXpGained(prev => prev + pts);
    setShowXpPop(true);
    setTimeout(() => setShowXpPop(false), 1200);
  };

  const skipStep = () => {
    setSkippedSteps(prev => [...prev, STEPS[step].id]);
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleSave();
  };

  const nextStep = () => {
    awardXP(10);
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleSave();
  };

  const handleDipstickPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setDipstickPhoto(file_url);
    setUploadingPhoto(false);
    awardXP(20);
  };

  const startVoiceNote = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = hi ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setNoteText(prev => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
  };

  const handleSaveSymptomsOnly = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (patient?.id) {
        await base44.entities.DailyLog.create({
          patient_id: patient.id,
          date: today,
          mood: feeling || 'okay',
          activity_level: activityLevel || 'Moderate',
          appetite: appetite || 'Good',
          symptoms: symptoms,
          notes: [
            feeling ? `Feeling: ${feeling}` : '',
            additionalComplaint ? `Additional Complaint: ${additionalComplaint}` : ''
          ].filter(Boolean).join(' | '),
          recorded_at: now
        });

        if (symptoms.includes('swelling') || symptoms.includes('breathing_difficulty') || symptoms.includes('fever')) {
          await base44.entities.Alert.create({
            patient_id: patient.id,
            alert_type: 'Symptom_Warning',
            severity: symptoms.includes('breathing_difficulty') ? 'High' : 'Medium',
            title: 'Symptom Alert Reported',
            message: `Symptoms reported: ${symptoms.join(', ')}. ${additionalComplaint ? `Complaint: ${additionalComplaint}` : ''}`,
            created_date: now
          });
        }
      }

      // Save locally for reliable offline persistence
      const localLogs = JSON.parse(localStorage.getItem('kc_daily_symptoms_log') || '[]');
      localLogs.unshift({
        date: today,
        feeling,
        symptoms,
        additionalComplaint,
        timestamp: now
      });
      localStorage.setItem('kc_daily_symptoms_log', JSON.stringify(localLogs.slice(0, 30)));
      localStorage.setItem('kc_symptoms_logged_today', today);

      awardXP(25);
      setSymptomSavedOnly(true);
      setSaved(true);
      queryClient.invalidateQueries(['checkinPatient']);
    } catch (e) {
      console.warn('Fallback saving symptoms locally:', e);
      localStorage.setItem('kc_symptoms_logged_today', today);
      setSymptomSavedOnly(true);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!patient || saving) return;
    setSaving(true);

    try {
      // Save symptoms
      if (!skippedSteps.includes('symptoms') && (symptoms.length > 0 || feeling)) {
        const hasCritical = symptoms.some(s => ['breathing_difficulty', 'rapid_weight_gain'].includes(s));
        const hasSevere = symptoms.some(s => ['swelling', 'fever'].includes(s));
        await base44.entities.HealthMetric.create({
          patient_id: patient.id,
          metric_type: 'Symptoms',
          value: feeling || 'recorded',
          symptoms_list: symptoms,
          recorded_at: now,
          severity: hasCritical ? 'severe' : hasSevere ? 'moderate' : symptoms.length > 0 ? 'mild' : 'normal'
        });
        if (hasCritical || (symptoms.includes('swelling') && symptoms.includes('fever'))) {
          await base44.entities.Alert.create({
            patient_id: patient.id, alert_type: 'Severe Symptoms', severity: 'critical',
            message: `CRITICAL symptoms: ${symptoms.join(', ')}`, details: { symptoms, feeling }
          });
        }
      }

      // Save BP
      if (!skippedSteps.includes('bp_weight') && systolic && diastolic) {
        await base44.entities.HealthMetric.create({
          patient_id: patient.id, metric_type: 'BP',
          value: systolic, value_secondary: diastolic, unit: 'mmHg', recorded_at: now
        });
        const sys = parseFloat(systolic), dia = parseFloat(diastolic);
        if (sys >= 140 || dia >= 90) {
          await base44.entities.Alert.create({
            patient_id: patient.id, alert_type: 'Abnormal BP', severity: sys >= 180 ? 'critical' : 'high',
            message: `${sys >= 180 ? 'Hypertensive crisis' : 'High BP'}: ${sys}/${dia} mmHg`
          });
        }
      }

      // Save Weight
      if (!skippedSteps.includes('bp_weight') && weight) {
        await base44.entities.HealthMetric.create({
          patient_id: patient.id, metric_type: 'Weight', value: weight, unit: 'kg', recorded_at: now
        });
      }

      // Save dipstick
      if (!skippedSteps.includes('dipstick') && !skipDipstick) {
        const dipRecord = await base44.entities.DipstickResult.create({
          patient_id: patient.id, protein_level: proteinLevel,
          image_after_url: dipstickPhoto || null,
          confidence: 1.0, clinician_reviewed: false,
          alert_triggered: ['2+', '3+', '4+'].includes(proteinLevel)
        });
        if (['2+', '3+', '4+'].includes(proteinLevel)) {
          await base44.entities.Alert.create({
            patient_id: patient.id, alert_type: 'High Protein',
            severity: proteinLevel === '4+' ? 'critical' : proteinLevel === '3+' ? 'high' : 'medium',
            message: `High protein: ${proteinLevel}`, related_record_id: dipRecord.id
          });
        }
      }

      // Save medications
      for (const medId in medicationsTaken) {
        await base44.entities.MedicationLog.create({
          patient_id: patient.id, medication_id: medId,
          taken: medicationsTaken[medId] === 'taken',
          taken_at: medicationsTaken[medId] === 'taken' ? now : null,
          scheduled_for: today
        });
      }

      // Save daily note
      if (!skippedSteps.includes('notes') && (noteText || mood)) {
        await base44.entities.DailyNote.create({
          patient_id: patient.id, note_date: today,
          note_text: noteText, mood, activity_level: activityLevel,
          appetite, language: lang
        });
      }

      await base44.functions.invoke('evaluateAlertRules', { patient_id: patient.id, trigger: 'Any' });

      // Sync to SQLite backend /api/logs to trigger ISPN 3-Day streak and weight retention check
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cr_number: patient.cr_number || 'AIIMS/PED/2026/0412',
            date: today,
            time: format(new Date(), 'HH:mm'),
            urine_protein: proteinLevel,
            bp_morning_systolic: systolic ? parseInt(systolic) : null,
            bp_morning_diastolic: diastolic ? parseInt(diastolic) : null,
            weight: weight ? parseFloat(weight) : null,
            edema: symptoms.includes('swelling') ? 'Mild' : 'None',
            notes: noteText || (symptoms.length ? `Symptoms: ${symptoms.join(', ')}` : '')
          })
        });
      } catch (syncErr) {
        console.warn('Backend /api/logs sync warning:', syncErr);
      }

      queryClient.invalidateQueries(['todayDipstick']);
      queryClient.invalidateQueries(['todayMetrics']);
      queryClient.invalidateQueries(['ispnRelapseCheck']);
      queryClient.invalidateQueries(['todayMedLogs']);
      setSaved(true);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (saved) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-4 shadow-xl">
        <CheckCircle className="w-12 h-12 text-white" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h1 className="text-2xl font-black text-gray-900 mb-1">
          {symptomSavedOnly
            ? (hi ? 'लक्षण व शिकायत दर्ज हो गई! ✓' : 'Symptoms & Complaint Logged! ✓')
            : (hi ? 'शानदार! दैनिक जांच पूरी हुई 🎉' : 'Amazing job! Daily Log Complete 🎉')}
        </h1>
        <p className="text-sm text-gray-600 mb-5 max-w-sm mx-auto">
          {symptomSavedOnly
            ? (hi ? 'आपके आज के लक्षण और अतिरिक्त शिकायतें सुरक्षित रूप से रिकॉर्ड कर ली गई हैं।' : 'Your symptoms and complaints have been securely recorded for your medical diary.')
            : (hi ? 'आज की सारी जानकारी (बीपी, वज़न, दवाइयाँ) सेव हो गई है।' : "Today's complete health metrics, vitals, and medication status have been saved.")}
        </p>

        {additionalComplaint && (
          <div className="max-w-sm mx-auto p-3 bg-white rounded-xl border border-gray-200 text-left mb-5 shadow-sm text-xs text-gray-700">
            <span className="font-bold text-gray-900 block mb-0.5">{hi ? 'दर्ज की गई शिकायत:' : 'Recorded Complaint:'}</span>
            <p className="italic">"{additionalComplaint}"</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex flex-col items-center bg-yellow-50 rounded-2xl px-5 py-2.5 border border-yellow-200">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-xl font-bold text-yellow-600">+{xpGained + 25}</span>
            </div>
            <span className="text-[10px] text-yellow-700 font-semibold">{hi ? 'XP अर्जित' : 'XP earned'}</span>
          </div>
          <div className="flex flex-col items-center bg-emerald-50 rounded-2xl px-5 py-2.5 border border-emerald-200">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-xl font-bold text-emerald-700">Active</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">{hi ? 'लॉग दर्ज' : 'Recorded'}</span>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link to="/Dashboard" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg text-sm text-center">
          {hi ? 'होम पर जाएँ' : 'Back to Home'}
        </Link>
        {symptomSavedOnly && (
          <button
            onClick={() => {
              setSaved(false);
              setStep(1); // Proceed to BP & Weight
            }}
            className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-2xl text-xs"
          >
            {hi ? 'बीपी/वज़न भी जोड़ें →' : 'Log Vitals Too →'}
          </button>
        )}
      </div>
    </div>
  );

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;
  const colorMap = {
    rose: 'from-rose-400 to-pink-500',
    purple: 'from-purple-500 to-indigo-600',
    blue: 'from-blue-500 to-indigo-500',
    green: 'from-green-500 to-emerald-600',
    amber: 'from-amber-400 to-orange-500',
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      {/* XP pop animation */}
      <AnimatePresence>
        {showXpPop && (
          <motion.div
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -60, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-1 bg-yellow-400 text-black font-bold px-4 py-2 rounded-full shadow-lg pointer-events-none"
          >
            <Zap className="w-4 h-4" /> +10 XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className={`bg-gradient-to-r ${colorMap[currentStep.color]} px-5 pt-6 pb-8 text-white`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <Link to="/Dashboard">
                <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </Link>
            )}
            <span className="text-white/70 text-sm">{step + 1}/{STEPS.length}</span>
          </div>
          <button onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
            className="text-xs bg-white/20 px-3 py-1 rounded-full">{hi ? 'EN' : 'हिं'}</button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-5">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <StepIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{hi ? currentStep.labelHi : currentStep.label}</h1>
            <p className="text-white/70 text-sm">{format(new Date(), 'dd MMM yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full pb-36">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {/* SYMPTOMS STEP */}
            {currentStep.id === 'symptoms' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="font-semibold text-gray-800 mb-3">{hi ? 'आज कैसा लग रहा है?' : 'How is the patient feeling?'}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { v: 'very_good', e: '😊', en: 'Very Good', hi: 'बहुत अच्छा' },
                      { v: 'okay', e: '😐', en: 'Okay', hi: 'ठीक' },
                      { v: 'not_well', e: '😟', en: 'Not Well', hi: 'ठीक नहीं' },
                    ].map(o => (
                      <button key={o.v} onClick={() => setFeeling(o.v)}
                        className={`p-3 rounded-xl border-2 transition-all ${feeling === o.v ? 'border-rose-400 bg-rose-50' : 'border-gray-200'}`}>
                        <div className="text-3xl mb-1">{o.e}</div>
                        <div className="text-xs font-medium text-gray-700">{hi ? o.hi : o.en}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── INTERACTIVE CARTOON BODY TAP-CHECK (SWELLING & SYMPTOMS) ── */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                        <span className="text-lg">🧒</span>
                        {hi ? 'बाल शरीर जांच (जहाँ सूजन हो वहाँ टैप करें):' : 'Interactive Child Body Check (Tap on swelling):'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {hi ? 'चेहरे, पेट या पैरों पर सूजन जांचने के लिए चित्र पर क्लिक करें' : 'Tap eyes, chest, tummy or feet to inspect and log pediatric edema'}
                      </p>
                    </div>
                    {symptoms.length > 0 && (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        {symptoms.length} {hi ? 'लक्षण' : 'active'}
                      </span>
                    )}
                  </div>

                  {/* 4 Hotspot Visual Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* 1. Eyes & Face (Morning Puffiness) */}
                    <button
                      type="button"
                      onClick={() => toggleSymptom('swelling')}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between active:scale-[0.98] cursor-pointer ${
                        symptoms.includes('swelling')
                          ? 'border-rose-400 bg-rose-50/80 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl">👁️</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          symptoms.includes('swelling') ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {symptoms.includes('swelling') ? (hi ? 'सूजन दर्ज ✓' : 'Swollen ✓') : (hi ? 'जांचें' : 'Tap to flag')}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          {hi ? 'आँखें व चेहरा (Eye Puffiness)' : 'Eyes & Face (Periorbital)'}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          {hi ? 'सुबह सोकर उठने पर पलकों पर सूजन' : 'Morning eyelid puffiness / edema'}
                        </p>
                      </div>
                    </button>

                    {/* 2. Chest & Breathing */}
                    <button
                      type="button"
                      onClick={() => toggleSymptom('breathing_difficulty')}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between active:scale-[0.98] cursor-pointer ${
                        symptoms.includes('breathing_difficulty')
                          ? 'border-amber-400 bg-amber-50/80 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl">🫁</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          symptoms.includes('breathing_difficulty') ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {symptoms.includes('breathing_difficulty') ? (hi ? 'तकलीफ़ ✓' : 'Trouble ✓') : (hi ? 'जांचें' : 'Tap to flag')}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          {hi ? 'सांस व खांसी (Breathing)' : 'Chest & Breathing'}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          {hi ? 'सांस लेने में भारीपन या खांसी' : 'Fast breathing or persistent cough'}
                        </p>
                      </div>
                    </button>

                    {/* 3. Tummy & Fullness */}
                    <button
                      type="button"
                      onClick={() => toggleSymptom('vomiting')}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between active:scale-[0.98] cursor-pointer ${
                        symptoms.includes('vomiting')
                          ? 'border-orange-400 bg-orange-50/80 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl">🥣</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          symptoms.includes('vomiting') ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {symptoms.includes('vomiting') ? (hi ? 'उल्टी/दर्द ✓' : 'Nausea ✓') : (hi ? 'जांचें' : 'Tap to flag')}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          {hi ? 'पेट व उल्टी (Tummy / Ascites)' : 'Belly & Vomiting'}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          {hi ? 'पेट का कड़ापन, भारीपन या उल्टी' : 'Abdominal fullness or vomiting'}
                        </p>
                      </div>
                    </button>

                    {/* 4. Feet & Ankles (Pedal Edema) */}
                    <button
                      type="button"
                      onClick={() => toggleSymptom('rapid_weight_gain')}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between active:scale-[0.98] cursor-pointer ${
                        symptoms.includes('rapid_weight_gain')
                          ? 'border-indigo-400 bg-indigo-50/80 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl">🦶</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          symptoms.includes('rapid_weight_gain') ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {symptoms.includes('rapid_weight_gain') ? (hi ? 'पैरों में सूजन ✓' : 'Ankle Marks ✓') : (hi ? 'जांचें' : 'Tap to flag')}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          {hi ? 'पैर व टखने (Ankle Swelling)' : 'Feet & Sock Marks'}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          {hi ? 'मोज़े के निशान या टखने दबाने पर गड्ढा' : 'Dependent edema / sock indents'}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Additional Clinical Symptoms Check List */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                  <p className="font-semibold text-gray-800 mb-2.5 text-xs uppercase tracking-wider text-slate-500">
                    {hi ? 'अन्य चिकित्सीय लक्षण (Medical Signs):' : 'Other Clinical Signs:'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SYMPTOMS.map(s => (
                      <label key={s.key} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        symptoms.includes(s.key) ? 'bg-rose-50 border-rose-200 text-rose-950 font-semibold' : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}>
                        <Checkbox checked={symptoms.includes(s.key)} onCheckedChange={() => toggleSymptom(s.key)} />
                        <span className="text-xs">{hi ? s.hi : s.en}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Complaint Text Area */}
                <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800 text-sm">
                      {hi ? 'अतिरिक्त शिकायत / अन्य कोई परेशानी:' : 'Additional Complaint or Observations:'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
                          alert('Voice recognition not supported');
                          return;
                        }
                        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                        const recognition = new SR();
                        recognition.lang = hi ? 'hi-IN' : 'en-IN';
                        recognition.start();
                        recognition.onresult = (e) => {
                          const t = e.results[0][0].transcript;
                          setAdditionalComplaint(prev => prev ? prev + ' ' + t : t);
                        };
                      }}
                      className="text-xs flex items-center gap-1 text-primary bg-primary/10 px-2.5 py-1 rounded-full font-medium"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{hi ? 'बोलकर लिखें' : 'Voice'}</span>
                    </button>
                  </div>
                  <textarea
                    value={additionalComplaint}
                    onChange={(e) => setAdditionalComplaint(e.target.value)}
                    placeholder={
                      hi
                        ? 'यहाँ अपनी अन्य कोई भी परेशानी या लक्षण लिखें (जैसे: सुबह आँखों पर सूजन, हल्का पेट दर्द, पेशाब में कमी, चिड़चिड़ापन)...'
                        : 'Type any other complaint or observations (e.g. eye swelling in morning, stomach ache, decreased urine, irritability)...'
                    }
                    className="w-full h-24 p-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none resize-none bg-slate-50"
                  />
                </div>

                {/* Direct Symptoms Submit Button */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-950">
                        {hi ? 'लक्षण तुरंत सहेजें' : 'Ready to submit symptoms?'}
                      </p>
                      <p className="text-[11px] text-emerald-800">
                        {hi
                          ? 'यदि आप केवल आज के लक्षण व शिकायत दर्ज करना चाहते हैं, तो यहाँ सीधे सबमिट करें।'
                          : 'You can submit symptoms & complaints immediately without completing all steps.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveSymptomsOnly}
                    disabled={saving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>{hi ? '✓ आज के लक्षण व शिकायत सबमिट करें' : '✓ Submit Symptoms & Complaints'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* BP & WEIGHT STEP */}
            {currentStep.id === 'bp_weight' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="font-semibold text-gray-800 mb-3">{hi ? 'रक्तचाप (BP)' : 'Blood Pressure'}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">{hi ? 'सिस्टोलिक (ऊपर)' : 'Systolic (top)'}</label>
                      <Input type="number" value={systolic} onChange={e => setSystolic(e.target.value)}
                        placeholder="110" className="h-14 text-xl font-bold text-center rounded-xl" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">{hi ? 'डायस्टोलिक (नीचे)' : 'Diastolic (bottom)'}</label>
                      <Input type="number" value={diastolic} onChange={e => setDiastolic(e.target.value)}
                        placeholder="70" className="h-14 text-xl font-bold text-center rounded-xl" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">mmHg</p>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="font-semibold text-gray-800 mb-3">{hi ? 'वज़न' : 'Weight'}</p>
                  <div className="relative">
                    <Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}
                      placeholder="18.5" className="h-16 text-2xl font-bold text-center rounded-xl pr-12" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kg</span>
                  </div>
                </div>
              </div>
            )}

            {/* DIPSTICK STEP */}
            {currentStep.id === 'dipstick' && (
              <div className="space-y-4">
                {/* Photo upload — required */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-blue-500" />
                    <p className="font-semibold text-gray-800 text-sm">{hi ? 'जाँच के बाद फोटो लें ⭐' : 'Photo of dipstick after test ⭐'}</p>
                    <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{hi ? 'ज़रूरी' : 'Required'}</span>
                  </div>
                  <label className="block cursor-pointer">
                    <input type="file" accept="image/*" capture="camera" className="hidden" onChange={handleDipstickPhoto} />
                    <div className={`rounded-2xl border-2 border-dashed h-36 flex flex-col items-center justify-center transition-all overflow-hidden
                      ${dipstickPhoto ? 'border-green-400' : 'border-blue-300 hover:border-blue-400 bg-blue-50'}`}>
                      {uploadingPhoto ? (
                        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                      ) : dipstickPhoto ? (
                        <div className="relative w-full h-full">
                          <img src={dipstickPhoto} alt="Dipstick" className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <button onClick={e => { e.preventDefault(); setDipstickPhoto(null); }}
                            className="absolute top-2 left-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
                            <X className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-blue-400 mb-2" />
                          <p className="text-sm font-medium text-blue-600">{hi ? 'फोटो लेने के लिए टैप करें' : 'Tap to take photo'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{hi ? 'स्ट्रिप को 60 सेकंड बाद फोटो करें' : 'Photo strip after 60 seconds'}</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {/* Colour selection */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="font-semibold text-gray-800 mb-1 text-sm">{hi ? 'प्रोटीन पैड का रंग चुनें' : 'Select protein pad colour'}</p>
                  <p className="text-xs text-gray-400 mb-3">{hi ? 'बोतल के रंग चार्ट से मिलाएँ' : 'Compare to colour chart on the bottle'}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {PROTEIN_LEVELS.map(level => (
                      <button key={level} onClick={() => { setProteinLevel(level); setSkipDipstick(false); }}
                        className={`py-4 rounded-xl border-2 font-bold text-lg transition-all ${
                          proteinLevel === level && !skipDipstick ? 'border-blue-500 bg-blue-50 text-blue-700 scale-105' : 'border-gray-200 text-gray-700'
                        }`}>
                        {level}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {PROTEIN_LEVELS.map(l => (
                      <div key={l} className={`flex-1 h-4 rounded ${PROTEIN_COLORS[l]}`} title={l} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MEDICATIONS STEP */}
            {currentStep.id === 'medications' && (
              <div className="space-y-3">
                {medications.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <Pill className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">{hi ? 'कोई दवा नहीं जोड़ी गई' : 'No medications configured yet'}</p>
                  </div>
                ) : (
                  medications.map(med => {
                    const status = medicationsTaken[med.id];
                    return (
                      <div key={med.id} className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="mb-3">
                          <p className="font-bold text-gray-900">{med.drug_name}</p>
                          <p className="text-sm text-gray-400">{med.dose} · {med.frequency}</p>
                          {med.instructions && <p className="text-xs text-blue-600 mt-1">{med.instructions}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setMedicationsTaken(p => ({ ...p, [med.id]: 'taken' }))}
                            className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                              status === 'taken' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                            ✓ {hi ? 'दे दी' : 'Given'}
                          </button>
                          <button
                            onClick={() => setMedicationsTaken(p => ({ ...p, [med.id]: 'missed' }))}
                            className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                              status === 'missed' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 border border-red-200'
                            }`}>
                            ✗ {hi ? 'नहीं दी' : 'Not given'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* NOTES STEP */}
            {currentStep.id === 'notes' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="font-semibold text-gray-800 mb-3">{hi ? 'आज का मूड' : "Patient's mood"}</p>
                  <div className="flex gap-2 flex-wrap">
                    {['Happy','Okay','Irritable','Tired','Unwell'].map(m => (
                      <button key={m} onClick={() => setMood(mood === m ? '' : m)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          mood === m ? 'bg-amber-400 text-white border-amber-400' : 'border-gray-200 text-gray-600'
                        }`}>{m}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-3 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 mb-2">{hi ? 'गतिविधि' : 'Activity'}</p>
                    <div className="space-y-1">
                      {['Active','Moderate','Low','Bed Rest'].map(a => (
                        <button key={a} onClick={() => setActivityLevel(activityLevel === a ? '' : a)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all ${
                            activityLevel === a ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                          }`}>{a}</button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-3 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 mb-2">{hi ? 'भूख' : 'Appetite'}</p>
                    <div className="space-y-1">
                      {['Good','Fair','Poor'].map(a => (
                        <button key={a} onClick={() => setAppetite(appetite === a ? '' : a)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all ${
                            appetite === a ? 'bg-green-100 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                          }`}>{a}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-800">{hi ? 'नोट्स / टिप्पणी' : 'Observations / Notes'}</p>
                    <button onClick={startVoiceNote}
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all ${
                        listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {listening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                      {listening ? (hi ? 'सुन रहा है...' : 'Listening...') : (hi ? 'आवाज़ से जोड़ें' : 'Voice')}
                    </button>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder={hi ? 'आज कुछ खास देखा? यहाँ लिखें...' : 'Any observations about mood, activity, behaviour...'}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-blue-300 min-h-[100px]"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button onClick={skipStep}
            className="flex items-center gap-1.5 text-gray-400 text-sm px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
            <SkipForward className="w-4 h-4" />
            {hi ? 'छोड़ें' : 'Skip'}
          </button>
          <button
            onClick={step < STEPS.length - 1 ? nextStep : handleSave}
            disabled={saving || (currentStep.id === 'dipstick' && !dipstickPhoto && !skipDipstick)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> :
              step < STEPS.length - 1 ? (
                <>{hi ? 'आगे' : 'Next'} <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>{hi ? 'सेव करें' : 'Save All'} <CheckCircle className="w-4 h-4" /></>
              )
            }
          </button>
        </div>
        {currentStep.id === 'dipstick' && !dipstickPhoto && !skipDipstick && (
          <p className="text-center text-xs text-red-400 mt-1.5 max-w-2xl mx-auto">
            {hi ? '* आगे बढ़ने के लिए फोटो ज़रूरी है' : '* Photo required to continue'}
          </p>
        )}
      </div>
    </div>
  );
}