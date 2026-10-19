import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isToday, format } from 'date-fns';
import { LanguageProvider, useLanguage } from '../components/shared/LanguageContext';
import { useTheme } from '../components/shared/ThemeContext';
import VoiceLogModal from '../components/tasks/VoiceLogModal';
import TaskEntryModal from '../components/tasks/TaskEntryModal';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { classifyBP, computeBMI, computeBSA } from '../utils/bpUtils';
import {
  Loader2, CheckCircle, ChevronRight, Calendar, Droplets, Activity,
  Scale, Pill, AlertTriangle, Sun, Moon, Bell, X, Flame, Mic, Phone,
  HeartPulse, TestTube, TrendingUp, BookOpen, Target, BarChart3,
  Stethoscope, FileText, Heart, WifiOff, Camera, Utensils, QrCode, Settings, Bot,
  Bluetooth, Zap
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import WaterJugTracker from '../components/dashboard/WaterJugTracker';
import KidneyBuddy from '../components/shared/KidneyBuddy';
import DailyScheduleCard from '../components/dashboard/DailyScheduleCard';
import BleDeviceSyncModal from '../components/devices/BleDeviceSyncModal';

const getGreeting = (lang) => {
  const h = new Date().getHours();
  if (lang === 'hi') {
    if (h < 12) return 'सुप्रभात';
    if (h < 17) return 'नमस्ते';
    return 'शुभ संध्या';
  }
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

function speak(text, lang = 'hi') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  u.rate = 0.88;
  window.speechSynthesis.speak(u);
}

function ActionTile({ icon: Icon, iconBg, iconColor, label, to, onClick, badge }) {
  const inner = (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-2 active:scale-95 transition-all shadow-sm hover:shadow-md relative">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200 text-center leading-tight">{label}</p>
      {badge && (
        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-indigo-700 bg-indigo-100 rounded-full px-1.5 py-0.5 leading-none">
          {badge}
        </span>
      )}
    </div>
  );

  if (to) return <Link to={to}>{inner}</Link>;
  return <button type="button" onClick={onClick} className="block">{inner}</button>;
}

function DashboardContent() {
  const { language, changeLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const hi = language === 'hi';
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTimeNum = now.getHours() * 60 + now.getMinutes();

  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [taskEntry, setTaskEntry] = useState(null);
  const [showReminder, setShowReminder] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  // Kidney Buddy & Daily Schedule State
  const [buddySpeech, setBuddySpeech] = useState(null);
  const [scheduleProgress, setScheduleProgress] = useState(0);
  const [scheduleTasks, setScheduleTasks] = useState([]);

  // Bluetooth Device Pairing Modal State
  const [bleModalOpen, setBleModalOpen] = useState(false);
  const [bleInitialMode, setBleInitialMode] = useState('bp');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['myPatient'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const patients = await base44.entities.Patient.filter({ created_by: user.email });
      if (!patients?.length) return null;
      return patients.find(p => p.onboarding_complete) || patients[0];
    }
  });

  // Patient profile ready locally

  const { data: riskTier } = useQuery({
    queryKey: ['myRiskTier', patient?.id],
    queryFn: () => base44.entities.PatientRiskTier.filter({ patient_id: patient.id }, '-created_date', 1),
    enabled: !!patient?.id,
    select: d => d?.[0]
  });

  const { data: plan } = useQuery({
    queryKey: ['myPlan', patient?.id],
    queryFn: () => base44.entities.MonitoringPlan?.filter({ patient_id: patient.id, is_active: true }),
    enabled: !!patient?.id,
    select: d => d?.[0]
  });

  const { data: todayDipstick = [] } = useQuery({
    queryKey: ['todayDipstick', patient?.id],
    queryFn: () => base44.entities.DipstickResult.filter({ patient_id: patient.id }, '-created_date', 5),
    enabled: !!patient?.id,
    select: d => d.filter(r => isToday(new Date(r.created_date)))
  });

  const { data: recentDipstick = [] } = useQuery({
    queryKey: ['recentDipstick', patient?.id],
    queryFn: () => base44.entities.DipstickResult.filter({ patient_id: patient.id }, '-created_date', 30),
    enabled: !!patient?.id,
  });

  const { data: todayMetrics = [] } = useQuery({
    queryKey: ['todayMetrics', patient?.id],
    queryFn: () => base44.entities.HealthMetric.filter({ patient_id: patient.id }, '-created_date', 20),
    enabled: !!patient?.id,
    select: d => d.filter(m => isToday(new Date(m.recorded_at || m.created_date)))
  });

  const { data: todayMedLogs = [] } = useQuery({
    queryKey: ['todayMedLogs', patient?.id],
    queryFn: () => base44.entities.MedicationLog.filter({ patient_id: patient.id, scheduled_for: today }),
    enabled: !!patient?.id
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['myMeds', patient?.id],
    queryFn: () => base44.entities.Medication.filter({ patient_id: patient.id, active: true }),
    enabled: !!patient?.id
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['myAlerts', patient?.id],
    queryFn: () => base44.entities.Alert.filter({ patient_id: patient.id, acknowledged: false }),
    enabled: !!patient?.id
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['myAppointments', patient?.id],
    queryFn: () => base44.entities.Appointment.filter({ patient_id: patient.id, status: 'Scheduled' }, 'appointment_date', 5),
    enabled: !!patient?.id
  });

  const { data: ispnRelapseCheck } = useQuery({
    queryKey: ['ispnRelapseCheck', patient?.cr_number],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/relapse-check?cr_number=${encodeURIComponent(patient?.cr_number || 'AIIMS/PED/2026/0412')}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.error('Relapse check error:', e);
      }
      return null;
    },
    refetchInterval: 30000
  });

  const { data: todayNutritionLogs = [] } = useQuery({
    queryKey: ['todayNutritionLogs', patient?.cr_number],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/nutrition?cr_number=${encodeURIComponent(patient?.cr_number || 'AIIMS/PED/2026/0412')}&date=${today}`);
        if (res.ok) return await res.json();
      } catch {}
      const cached = localStorage.getItem('kc_nutrition_logs');
      if (cached) {
        try {
          return JSON.parse(cached).filter(m => m.date === today);
        } catch {}
      }
      return [];
    },
    refetchInterval: 15000
  });

  const { data: todayFluidQuota } = useQuery({
    queryKey: ['todayFluidQuota', patient?.cr_number],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/fluid-quota?cr_number=${encodeURIComponent(patient?.cr_number || 'AIIMS/PED/2026/0412')}`);
        if (res.ok) return await res.json();
      } catch {}
      return null;
    },
    refetchInterval: 15000
  });

  // Derived state
  const urineTestDoneToday = todayDipstick.length > 0;
  const medsDoneToday = todayMedLogs.some(l => l.taken === true);
  const totalCaloriesToday = todayNutritionLogs.reduce((acc, m) => acc + (m.calories || 0), 0);
  const totalTakenMedsToday = todayMedLogs.filter(l => l.taken).length;

  // Conditional Fluid Quota: Show WaterJugTracker only if fluid monitoring is especially selected in daily routine
  const isFluidMonitoringSelected = scheduleTasks.length > 0
    ? scheduleTasks.some(t => t.category === 'fluid' && t.enabled !== false)
    : true;
  const lastBP = todayMetrics.find(m => m.metric_type === 'BP');
  const latestWeight = todayMetrics.find(m => m.metric_type === 'Weight');
  const bmi = computeBMI(patient?.weight_kg || latestWeight?.value, patient?.height_cm);
  const bsa = computeBSA(patient?.weight_kg || latestWeight?.value, patient?.height_cm);
  const bpCategory = lastBP
    ? classifyBP(lastBP.value, lastBP.value_secondary, patient?.age, patient?.gender)
    : null;

  // Relapse streak: count consecutive days with protein ≥1+ (BUG-007 fix)
  const computeRelapseStreak = () => {
    if (!recentDipstick.length) return { streak: 0, phase: 'unknown' };
    const sorted = [...recentDipstick].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const abnormal = ['1+', '2+', '3+', '4+'];
    let streak = 0;
    let prevDate = null;
    for (const r of sorted) {
      const d = r.created_date?.split('T')[0];
      if (prevDate && prevDate !== d) {
        // If there's a gap (missed day), streak resets — BUG-007
        const diff = Math.round((new Date(prevDate) - new Date(d)) / 86400000);
        if (diff > 1) break;
      }
      if (abnormal.includes(r.protein_level)) {
        streak++;
        prevDate = d;
      } else {
        break;
      }
    }
    const isRelapse = streak >= 3;
    const isRemission = sorted[0] && !abnormal.includes(sorted[0].protein_level);
    return {
      streak,
      phase: isRelapse ? 'relapse' : isRemission ? 'remission' : 'monitoring',
    };
  };
  const relapseInfo = computeRelapseStreak();

  // Build tasks from plan
  const tasks = [];
  if (plan) {
    const dipstickTimes = plan.dipstick_frequency === 'Twice_Daily'
      ? [plan.dipstick_time || '07:30', '19:00'] : [plan.dipstick_time || '07:30'];
    dipstickTimes.forEach((t, i) => {
      const [h, m] = t.split(':').map(Number);
      tasks.push({ id: `d${i}`, type: 'dipstick', time: t, timeNum: h * 60 + m, label: hi ? 'पेशाब जाँच' : 'Urine Test', sublabel: i === 0 ? (hi ? 'सुबह' : 'Morning') : (hi ? 'शाम' : 'Evening'), done: todayDipstick.length > i, resultLabel: todayDipstick[i]?.protein_level, icon: Droplets, color: 'blue' });
    });
    if (plan.bp_frequency && plan.bp_frequency !== 'Not_Required') {
      const bpTimes = plan.bp_times?.length ? plan.bp_times : ['07:30'];
      const todayBP = todayMetrics.filter(m => m.metric_type === 'BP');
      bpTimes.forEach((t, i) => {
        const [h, m] = t.split(':').map(Number);
        tasks.push({ id: `bp${i}`, type: 'bp', time: t, timeNum: h * 60 + m, label: hi ? 'ब्लड प्रेशर' : 'Blood Pressure', sublabel: hi ? 'मापें' : 'Measure', done: todayBP.length > i, resultLabel: todayBP[i] ? `${todayBP[i].value}/${todayBP[i].value_secondary}` : null, icon: Activity, color: 'rose', taskType: 'BP' });
      });
    }
    if (plan.weight_frequency && plan.weight_frequency !== 'Not_Required') {
      const todayWeight = todayMetrics.find(m => m.metric_type === 'Weight');
      const wt = plan.weight_time || '07:30';
      const [h, m] = wt.split(':').map(Number);
      tasks.push({ id: 'wt', type: 'weight', time: wt, timeNum: h * 60 + m, label: hi ? 'वज़न' : 'Weight', sublabel: hi ? 'किलोग्राम में' : 'In kg', done: !!todayWeight, resultLabel: todayWeight ? `${todayWeight.value} kg` : null, icon: Scale, color: 'amber', taskType: 'Weight' });
    }
    medications.forEach(med => {
      const log = todayMedLogs.find(l => l.medication_id === med.id);
      const t = med.schedule || '08:00';
      const [h, m] = t.split(':').map(Number);
      tasks.push({ id: `med_${med.id}`, type: 'medication', time: t, timeNum: h * 60 + m, label: med.drug_name, sublabel: `${med.dose} · ${med.frequency}`, done: log?.taken === true, missed: log?.taken === false, resultLabel: log?.taken ? (hi ? 'ली गई ✓' : 'Taken ✓') : log?.taken === false ? (hi ? 'छूट गई' : 'Missed') : null, icon: Pill, color: 'green', medication: med });
    });
    tasks.sort((a, b) => a.timeNum - b.timeNum);
  }

  const doneTasks = tasks.filter(t => t.done);
  const compliancePct = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  const nextClinicDays = plan?.next_clinic_date ? Math.ceil((new Date(plan.next_clinic_date) - now) / 86400000) : null;

  useEffect(() => {
    if (tasks.length > 0 && doneTasks.length < tasks.length) {
      const dismissed = localStorage.getItem(`checkin_dismissed_${today}`);
      if (!dismissed) setShowReminder(true);
    }
  }, [tasks.length, doneTasks.length]);

  const dismissReminder = () => {
    localStorage.setItem(`checkin_dismissed_${today}`, '1');
    setShowReminder(false);
  };

  const handleTaskTap = (task) => {
    if (task.done) return;
    if (task.type === 'dipstick') window.location.hash = '#/DipstickTest';
    else setTaskEntry(task);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const patientFirstName = patient?.name?.split(' ')[0] || 'Hello';
  const todayStr = format(now, 'EEE, d MMM');

  return (
    <div className="min-h-screen w-full bg-background pb-28">

      {/* ── TOP HEADER (MOVED SLIGHTLY LOWER FOR NOTCH CLEARANCE & THUMB REACH) ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-border px-4 pt-7 pb-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div>
          <p className="text-xs text-muted-foreground">{getGreeting(language)}</p>
          <h1 className="text-base font-bold text-foreground">{patient?.name || 'KidneyCare'}</h1>
        </div>
        <div className="flex gap-2 items-center">
          {/* Quick Hindi / English Toggle Button */}
          <button
            type="button"
            onClick={() => changeLanguage(language === 'hi' ? 'en' : 'hi')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="भाषा बदलें / Change Language"
          >
            <span>{language === 'hi' ? '🇮🇳 हिंदी' : '🇬🇧 English'}</span>
          </button>

          {/* Voice Log Trigger in Header */}
          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className="w-9 h-9 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center transition-colors active:scale-95"
            title={hi ? 'आवाज़ में बोलकर दर्ज करें' : 'Voice Log'}
          >
            <Mic className="w-4 h-4 text-indigo-700" />
          </button>

          {/* Hindi Voice Speaker Button for low-literacy caregivers */}
          <button
            type="button"
            onClick={() => {
              const textToSpeak = language === 'hi'
                ? `नमस्ते, आज ${patientFirstName || 'मरीज़'} की स्थिति: ${relapseInfo.phase === 'remission' ? 'रोग-मुक्त' : relapseInfo.phase === 'relapse' ? 'दोबारा बीमारी' : 'सामान्य'}। ${urineTestDoneToday ? 'आज का मूत्र टेस्ट हो चुका है।' : 'कृपया सुबह का मूत्र प्रोटीन टेस्ट करें।'}`
                : `Hello, today's status for ${patientFirstName || 'patient'} is ${relapseInfo.phase === 'remission' ? 'Remission' : 'Monitoring'}. ${urineTestDoneToday ? 'Urine test completed.' : 'Please perform morning dipstick test.'}`;
              speak(textToSpeak, language);
            }}
            className="w-9 h-9 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center transition-colors active:scale-95"
            title={language === 'hi' ? 'आवाज़ में स्थिति सुनें' : 'Listen Status'}
          >
            <span className="text-sm">🔊</span>
          </button>

          {alerts.filter(a => !dismissedAlerts.has(a.id)).length > 0 && (
            <div className="relative">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                <Bell className="w-4 h-4 text-red-500" />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold text-white">
                {alerts.filter(a => !dismissedAlerts.has(a.id)).length}
              </span>
            </div>
          )}
          <button onClick={toggleTheme} className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
            {isDark ? <Sun className="w-4 h-4 text-foreground" /> : <Moon className="w-4 h-4 text-foreground" />}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full">

        {/* ── HERO CARD ── */}
        <div className="px-4 pt-4 pb-2">
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900 p-5 shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40">
            {/* Greeting row */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-indigo-200 font-medium mb-0.5">{getGreeting(language)} · {todayStr}</p>
                <h2 className="text-3xl font-extrabold text-white leading-tight">{patientFirstName}</h2>
                {patient?.ns_classification && (
                  <p className="text-sm text-indigo-300 mt-0.5">{patient.ns_classification}</p>
                )}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                <HeartPulse className="w-7 h-7 text-white" />
              </div>
            </div>

            {/* Status chips */}
            <div className="flex gap-2 flex-wrap">
              {recentDipstick.length > 0 && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  relapseInfo.phase === 'remission'
                    ? 'bg-emerald-400/25 text-emerald-100'
                    : relapseInfo.phase === 'relapse'
                    ? 'bg-rose-400/25 text-rose-100'
                    : 'bg-white/15 text-white/80'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    relapseInfo.phase === 'remission' ? 'bg-emerald-300' :
                    relapseInfo.phase === 'relapse' ? 'bg-rose-300' : 'bg-white/60'
                  }`} />
                  {relapseInfo.phase === 'remission'
                    ? (hi ? 'रोग-मुक्त' : 'Remission')
                    : relapseInfo.phase === 'relapse'
                    ? (hi ? `दोबारा बीमारी (${relapseInfo.streak}d)` : `Relapse (${relapseInfo.streak}d)`)
                    : (hi ? 'निगरानी में' : 'Monitoring')}
                </div>
              )}
              {compliancePct > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white/80 text-xs font-semibold">
                  <Target className="w-3 h-3" />
                  {compliancePct}% {hi ? 'अनुपालन' : 'Compliant'}
                </div>
              )}
              {todayDipstick.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white/80 text-xs font-semibold">
                  <TestTube className="w-3 h-3" />
                  {hi ? 'आज जांच ✓' : 'Tested today ✓'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── ISPN 3-DAY RELAPSE STREAK & WEIGHT RETENTION DETECTOR ── */}
        {ispnRelapseCheck && (ispnRelapseCheck.ispn_relapse_criteria_met || ispnRelapseCheck.consecutive_3plus_days >= 2) && (
          <div className="px-4 mb-3">
            <div className={`rounded-2xl p-4 border shadow-md flex items-start gap-3.5 ${
              ispnRelapseCheck.ispn_relapse_criteria_met
                ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/60 dark:border-rose-900 text-rose-950 dark:text-rose-100'
                : 'bg-amber-50 border-amber-300 dark:bg-amber-950/60 dark:border-amber-900 text-amber-950 dark:text-amber-100'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                ispnRelapseCheck.ispn_relapse_criteria_met ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-500 text-white'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-200/90 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-2 py-0.5 rounded-full">
                    {ispnRelapseCheck.ispn_relapse_criteria_met ? 'ISPN Relapse Criteria Met' : 'Relapse Warning Streak'}
                  </span>
                  <span className="text-xs font-extrabold">
                    Streak: {ispnRelapseCheck.consecutive_3plus_days} Days (≥3+)
                  </span>
                </div>
                <h4 className="text-sm font-bold mt-1">
                  {hi
                    ? 'मूत्र प्रोटीन ≥3+ लगातार 3 दिनों से दर्ज हो रहा है!'
                    : 'Urine Protein ≥3+ Detected for Consecutive Days!'}
                </h4>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {hi
                    ? 'एम्स पटना गाइडलाइन: स्टेरॉयड खुद से न बढ़ाएं। बच्चे को बुखार/खांसी की जांच करें और तुरंत पीडियाट्रिक नेफ्रोलॉजी ओपीडी से संपर्क करें।'
                    : 'AIIMS Protocol: Do NOT alter or increase steroids without doctor evaluation. Rule out infection and consult AIIMS Pediatric Nephrology.'}
                </p>
                {ispnRelapseCheck.weight_delta_48h > 0.4 && (
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-1.5 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" />
                    Fluid Retention Warning: 48h weight gain +{ispnRelapseCheck.weight_delta_48h} kg
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Link
                    to="/DoctorSummary"
                    className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl shadow-sm inline-flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {hi ? 'डॉक्टर रिपोर्ट' : 'Doctor Report'}
                  </Link>
                  <a
                    href="tel:+916122451070"
                    className="text-xs font-bold bg-white dark:bg-gray-800 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 px-3.5 py-1.5 rounded-xl shadow-sm inline-flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Phone className="w-3.5 h-3.5 text-rose-600" />
                    {hi ? 'एम्स हेल्पलाइन' : 'AIIMS Helpline'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CLINICAL ALERTS ── */}
        {alerts.filter(a => !dismissedAlerts.has(a.id)).length > 0 && (
          <div className="px-4 mb-1 space-y-2">
            {alerts.filter(a => !dismissedAlerts.has(a.id)).slice(0, 3).map(alert => (
              <div key={alert.id} className={`rounded-xl border-2 px-3 py-2.5 flex items-center gap-3 ${
                alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                alert.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                'bg-amber-50 border-amber-200'
              }`}>
                <AlertTriangle className={`w-5 h-5 shrink-0 ${
                  alert.severity === 'critical' ? 'text-red-500' :
                  alert.severity === 'high' ? 'text-orange-500' : 'text-amber-500'
                }`} />
                <p className="flex-1 text-sm font-medium text-gray-800 leading-tight">{alert.message}</p>
                <button onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}
                  className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── KIDNEY BUDDY PEDIATRIC CARTOON MASCOT ── */}
        <div className="px-4 mb-3">
          <KidneyBuddy
            mood={scheduleProgress >= 100 ? "celebration" : scheduleProgress >= 50 ? "hero" : "cheer"}
            speech={buddySpeech?.speech_en || "Good morning Aarav! Let's follow our superhero kidney routine today!"}
            speechHi={buddySpeech?.speech_hi || "सुप्रभात आरव! आइए मिलकर आज का रूटीन पूरा करते हैं!"}
            hi={hi}
            percent={scheduleProgress}
          />
        </div>

        {/* ── CUSTOMISABLE DAILY MONITORING SCHEDULE (TIMELINE & ROUTINE) ── */}
        <div className="px-4 mb-3">
          <DailyScheduleCard
            crNumber={patient?.cr_number || 'AIIMS/PED/2026/0412'}
            hi={hi}
            onProgressChange={(pct, buddy, tasks) => {
              setScheduleProgress(pct);
              if (buddy) setBuddySpeech(buddy);
              if (tasks) setScheduleTasks(tasks);
            }}
          />
        </div>

        {/* ── TODAY'S CLINICAL STATUS SUMMARY DISPLAY ── */}
        <div className="px-4 mb-3">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-200/90 dark:border-slate-700/80 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <span>📊</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {hi ? 'आज की दैनिक स्वास्थ्य स्थिति' : "Today's Clinical Status Summary"}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {format(now, 'EEEE, d MMMM yyyy')} · {scheduleProgress}% {hi ? 'रूटीन पूर्ण' : 'routine done'}
                  </p>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  todayDipstick[0]?.protein_level && ['3+', '4+'].includes(todayDipstick[0].protein_level)
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : todayDipstick[0]?.protein_level && ['Nil', 'Negative', 'Trace'].includes(todayDipstick[0].protein_level)
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                {todayDipstick[0]?.protein_level
                  ? (['Nil', 'Negative', 'Trace'].includes(todayDipstick[0].protein_level) ? (hi ? '🟢 रोग-मुक्त (Remission)' : '🟢 Normal (Remission)') : `⚠️ Protein ${todayDipstick[0].protein_level}`)
                  : (hi ? '⏳ जांच प्रतीक्षित' : '⏳ Test Pending')}
              </Badge>
            </div>

            {/* 4 Key Indicators Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* 1. Urine Protein / Dipstick */}
              <Link
                to="/DipstickTest"
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/70 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-500" />
                    {hi ? 'पेशाब प्रोटीन' : 'Urine Test'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">{todayDipstick.length > 0 ? '✓ Done' : 'Pending'}</span>
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                    {todayDipstick[0]?.protein_level || (hi ? 'जांच बाकी' : 'Not tested')}
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    {todayDipstick.length > 0 ? '✓' : '+ Test'}
                  </span>
                </div>
              </Link>

              {/* 2. Fluid Intake vs Quota */}
              <Link
                to="/DailyLog"
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/70 hover:border-teal-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-teal-500" />
                    {hi ? 'तरल सेवन' : 'Fluid Intake'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {todayFluidQuota ? `${Math.round(((todayFluidQuota.consumed_ml || 0) / (todayFluidQuota.daily_limit_ml || 1000)) * 100)}%` : 'Active'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                    {todayFluidQuota?.consumed_ml || 0} / {todayFluidQuota?.daily_limit_ml || 1000} <span className="text-[10px] font-normal text-slate-400">mL</span>
                  </span>
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">+ Log</span>
                </div>
              </Link>

              {/* 3. Nutrition & Meals Logged */}
              <Link
                to="/NutritionHub"
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/70 hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Utensils className="w-3 h-3 text-emerald-500" />
                    {hi ? 'दैनिक आहार' : 'Nutrition'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {todayNutritionLogs.length} {hi ? 'भोजन' : 'meals'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                    {totalCaloriesToday} <span className="text-[10px] font-normal text-slate-400">kcal</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {todayNutritionLogs.length > 0 ? '✓ Safe' : '+ Log'}
                  </span>
                </div>
              </Link>

              {/* 4. Medications Taken */}
              <Link
                to="/Medications"
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/70 hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Pill className="w-3 h-3 text-indigo-500" />
                    {hi ? 'दवाइयाँ' : 'Medications'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {totalTakenMedsToday}/{medications.length}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                    {totalTakenMedsToday === medications.length && medications.length > 0
                      ? (hi ? 'सभी ली गईं ✓' : 'All Taken ✓')
                      : `${totalTakenMedsToday} of ${medications.length}`}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {totalTakenMedsToday === medications.length && medications.length > 0 ? '✓' : 'Pending'}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── HIGHLIGHTED CLINICAL MODULES: DOC SCANNER & NUTRITION HUB ── */}
        <div className="px-4 mb-3 grid grid-cols-2 gap-2.5">
          {/* Patient Doc Scanner Card */}
          <Link
            to="/DocScanner"
            className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50/80 rounded-2xl border border-blue-200/80 text-left flex flex-col justify-between shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Camera className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="text-[10px] bg-white text-blue-700 font-bold border-blue-200">
                {hi ? 'कैमरा' : 'AI Scan'}
              </Badge>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {hi ? 'दस्तावेज़ स्कैनर' : 'Doc Scanner'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                {hi ? 'पर्चे व जांच रिपोर्ट स्कैन करें' : 'Scan strips, labs & slips'}
              </p>
            </div>
          </Link>

          {/* Nutrition & Diet Hub Card */}
          <Link
            to="/NutritionHub"
            className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50/80 rounded-2xl border border-emerald-200/80 text-left flex flex-col justify-between shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Utensils className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="text-[10px] bg-white text-emerald-700 font-bold border-emerald-200">
                {hi ? 'डाइट पोषण' : 'PRINT Diet'}
              </Badge>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                {hi ? 'आहार एवं पोषण' : 'Nutrition Hub'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                {hi ? '643 भारतीय व्यंजन व थाली स्कैनर' : '643 Indian renal foods & meal scanner'}
              </p>
            </div>
          </Link>
        </div>

        {/* ── MARKED WATER JUG / FLUID QUOTA TRACKER (SHOWN ONLY IF FLUID MONITORING IS SELECTED IN DAILY ROUTINE) ── */}
        {isFluidMonitoringSelected && (
          <div className="px-4 mb-3">
            <WaterJugTracker crNumber={patient?.cr_number || 'AIIMS/PED/2026/0412'} hi={hi} />
          </div>
        )}

        {/* ── COMPACT MEDICATION STATUS + VITALS ROW ── */}
        <div className="px-4 mt-3 mb-3 grid grid-cols-2 gap-2">
          {/* Medication Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-foreground uppercase tracking-widest flex items-center gap-1">
                <Pill className="w-3 h-3 text-teal-500" />
                {hi ? 'दवाइयाँ' : 'Medications'}
              </h3>
              <Link to="/Medications" className="text-[10px] text-primary font-semibold">
                {hi ? 'सभी' : 'All'}
              </Link>
            </div>
            {medications.length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-2">{hi ? 'कोई दवा नहीं' : 'No meds'}</p>
            ) : (
              <div className="space-y-1.5">
                {medications.slice(0, 3).map(med => {
                  const log = todayMedLogs.find(l => l.medication_id === med.id);
                  const taken = log?.taken === true;
                  const missed = log?.taken === false;
                  return (
                    <div key={med.id} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${taken ? 'bg-green-500' : missed ? 'bg-red-500' : 'bg-gray-300'}`} />
                      <p className="text-[11px] font-medium text-foreground truncate flex-1">{med.drug_name}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        taken ? 'bg-green-100 text-green-700' : missed ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {taken ? '✓' : missed ? '✗' : '—'}
                      </span>
                    </div>
                  );
                })}
                {medications.length > 3 && (
                  <p className="text-[10px] text-muted-foreground text-center pt-0.5">+{medications.length - 3} more</p>
                )}
              </div>
            )}
          </div>

          {/* Vitals + Progress Card with Bluetooth BLE Auto-Sync */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-foreground uppercase tracking-widest flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                {hi ? 'वाइटल्स' : 'Vitals'}
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setBleInitialMode('bp');
                    setBleModalOpen(true);
                  }}
                  className="px-1.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[9px] font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors"
                  title={hi ? 'ब्लूटूथ बीपी/स्केल सिंक' : 'Bluetooth BLE Sync'}
                >
                  <Bluetooth className="w-2.5 h-2.5" />
                  BLE
                </button>
                {tasks.length > 0 && (
                  <span className="text-[10px] font-bold text-primary">{doneTasks.length}/{tasks.length}</span>
                )}
              </div>
            </div>
            {tasks.length > 0 && (
              <div className="w-full bg-muted rounded-full h-1.5 mb-2">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full h-1.5 transition-all duration-500"
                  style={{ width: `${compliancePct}%` }} />
              </div>
            )}
            <div className="flex gap-1.5">
              {lastBP && (
                <div className="flex-1 bg-muted/60 rounded-lg py-1.5 text-center">
                  <p className="text-xs font-extrabold text-foreground">{lastBP.value}/{lastBP.value_secondary}</p>
                  <p className="text-[9px] text-muted-foreground font-medium">BP</p>
                </div>
              )}
              {patient?.weight_kg && (
                <div className="flex-1 bg-muted/60 rounded-lg py-1.5 text-center">
                  <p className="text-xs font-extrabold text-foreground">{patient.weight_kg}</p>
                  <p className="text-[9px] text-muted-foreground font-medium">{hi ? 'किलो' : 'kg'}</p>
                </div>
              )}
              {patient?.height_cm && (
                <div className="flex-1 bg-muted/60 rounded-lg py-1.5 text-center">
                  <p className="text-xs font-extrabold text-foreground">{patient.height_cm}</p>
                  <p className="text-[9px] text-muted-foreground font-medium">cm</p>
                </div>
              )}
              {!lastBP && !patient?.weight_kg && !patient?.height_cm && (
                <p className="text-[11px] text-muted-foreground text-center py-2 w-full">{hi ? 'कोई डेटा नहीं' : 'No data'}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── UPCOMING APPOINTMENTS ── */}
        {appointments.length > 0 && (
          <div className="px-4 mb-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-foreground uppercase tracking-widest flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-orange-500" />
                  {hi ? 'अगली विज़िट' : 'Upcoming Appts'}
                </h3>
                <Link to="/Appointments" className="text-[10px] text-primary font-semibold">
                  {hi ? 'सभी' : 'All'}
                </Link>
              </div>
              <div className="space-y-1.5">
                {appointments.slice(0, 2).map(apt => {
                  const aptDate = new Date(apt.appointment_date);
                  const daysAway = Math.ceil((aptDate - now) / 86400000);
                  return (
                    <div key={apt.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex flex-col items-center justify-center shrink-0">
                        <p className="text-[9px] font-bold text-orange-600 leading-none">{format(aptDate, 'MMM').toUpperCase()}</p>
                        <p className="text-sm font-extrabold text-orange-700 leading-none">{format(aptDate, 'd')}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground truncate">{apt.reason || apt.type || 'Appointment'}</p>
                        <p className="text-[10px] text-muted-foreground">{apt.appointment_time} · {apt.type}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        daysAway <= 1 ? 'bg-red-100 text-red-700' : daysAway <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {daysAway === 0 ? (hi ? 'आज' : 'Today') : daysAway === 1 ? (hi ? 'कल' : 'Tomorrow') : `${daysAway}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── REMINDER BANNER ── */}
        {showReminder && (
          <div className="px-4 mb-3">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <Bell className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">{hi ? 'आज के काम बाकी हैं' : 'Pending tasks today'}</p>
                <p className="text-xs text-amber-600">{tasks.length - doneTasks.length} {hi ? 'काम बाकी' : 'remaining'}</p>
              </div>
              <button onClick={dismissReminder} className="text-amber-400"><X className="w-4 h-4" /></button>
            </motion.div>
          </div>
        )}

        {/* ── CONSOLIDATED 6-CARD QUICK ACTIONS (NON-REPETITIVE) ── */}
        <div className="px-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">
              {hi ? 'त्वरित क्रियाएँ' : 'Quick Actions'}
            </h2>
            <span className="text-[10px] text-muted-foreground font-medium">
              {hi ? 'सभी महत्वपूर्ण टूल्स' : 'Essential tools'}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {/* 1. Patient QR Digital Card */}
            <ActionTile
              icon={QrCode}
              iconBg="bg-purple-100 dark:bg-purple-950/60"
              iconColor="text-purple-600 dark:text-purple-400"
              label={hi ? 'QR कार्ड' : 'QR Card'}
              to="/PatientQR"
            />
            {/* 2. Growth Tracking */}
            <ActionTile
              icon={Scale}
              iconBg="bg-amber-100 dark:bg-amber-950/60"
              iconColor="text-amber-600 dark:text-amber-400"
              label={hi ? 'विकास' : 'Growth'}
              to="/GrowthTracking"
            />
            {/* 3. Trends & History (Itihaas) */}
            <ActionTile
              icon={TrendingUp}
              iconBg="bg-sky-100 dark:bg-sky-950/60"
              iconColor="text-sky-600 dark:text-sky-400"
              label={hi ? 'ट्रेंड्स / इतिहास' : 'Trends'}
              to="/Itihaas"
            />
            {/* 4. Monthly Nephro Report */}
            <ActionTile
              icon={BarChart3}
              iconBg="bg-violet-100 dark:bg-violet-950/60"
              iconColor="text-violet-600 dark:text-violet-400"
              label={hi ? 'मासिक रिपोर्ट' : 'Report'}
              to="/MonthlyReport"
            />
            {/* 5. Appointments */}
            <ActionTile
              icon={Calendar}
              iconBg="bg-orange-100 dark:bg-orange-950/60"
              iconColor="text-orange-600 dark:text-orange-400"
              label={hi ? 'अपॉइंटमेंट' : 'Appt'}
              to="/Appointments"
            />
            {/* 6. Education / IAP FAQs */}
            <ActionTile
              icon={BookOpen}
              iconBg="bg-emerald-100 dark:bg-emerald-950/60"
              iconColor="text-emerald-600 dark:text-emerald-400"
              label={hi ? 'सीखें (गाइड)' : 'Learn (IAP)'}
              to="/Education"
            />
          </div>
        </div>

        {/* ── CLEAN EMERGENCY CARD (INLINE, NO EXTRA BOTTOM RIBBON) ── */}
        <div className="px-4 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🚨</span>
              <div>
                <p className="text-xs font-bold text-red-950">
                  {hi ? 'आपातकालीन सहायता' : 'Emergency Assistance'}
                </p>
                <p className="text-[10px] text-red-700">
                  {hi ? 'एम्स पटना बाल गुर्दा विभाग 24x7 हेल्पलाइन' : 'AIIMS Patna Pediatric Nephrology 24x7'}
                </p>
              </div>
            </div>
            <a
              href="tel:06122451070"
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span>{hi ? 'कॉल करें' : 'Call AIIMS'}</span>
            </a>
          </div>
        </div>

      </div>

      {/* ── LOWER-LEFT FLOATING NEPHROBOT BUTTON ── */}
      <Link
        to="/NephroBot"
        className="fixed bottom-20 left-4 z-40 flex items-center gap-2 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 text-white px-3.5 py-2.5 rounded-2xl shadow-2xl hover:shadow-teal-500/30 border-2 border-white dark:border-gray-800 active:scale-95 transition-all group"
        title={hi ? 'NephroBot AI गुर्दा सहायक' : 'NephroBot AI Assistant'}
      >
        <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="text-left pr-1">
          <p className="text-[11px] font-bold leading-tight flex items-center gap-1.5">
            NephroBot
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          </p>
          <p className="text-[9px] text-teal-100 font-medium">
            {hi ? 'AI गुर्दा सहायक' : 'AI Assistant'}
          </p>
        </div>
      </Link>



      {showVoiceModal && (
        <VoiceLogModal patient={patient} onClose={() => {
          setShowVoiceModal(false);
          queryClient.invalidateQueries(['todayDipstick', patient?.id]);
          queryClient.invalidateQueries(['todayMetrics', patient?.id]);
          queryClient.invalidateQueries(['todayMedLogs', patient?.id]);
        }} />
      )}
      {taskEntry && (
        <TaskEntryModal task={taskEntry} patient={patient} onClose={() => {
          setTaskEntry(null);
          queryClient.invalidateQueries(['todayMetrics', patient?.id]);
          queryClient.invalidateQueries(['todayMedLogs', patient?.id]);
        }} />
      )}

      {/* Bluetooth BLE Auto-Reading Modal */}
      <BleDeviceSyncModal
        isOpen={bleModalOpen}
        initialMode={bleInitialMode}
        language={language}
        onClose={() => setBleModalOpen(false)}
        onReadingCaptured={async (reading) => {
          if (!patient?.id) return;
          const nowIso = new Date().toISOString();
          try {
            if (reading.type === 'BP') {
              await base44.entities.HealthMetric.create({
                patient_id: patient.id,
                metric_type: 'BP',
                value: String(reading.systolic),
                value_secondary: String(reading.diastolic),
                unit: 'mmHg',
                recorded_at: nowIso
              });
            } else if (reading.type === 'Weight') {
              await base44.entities.HealthMetric.create({
                patient_id: patient.id,
                metric_type: 'Weight',
                value: String(reading.weight),
                unit: 'kg',
                recorded_at: nowIso
              });
            }
            queryClient.invalidateQueries(['todayMetrics', patient?.id]);
            queryClient.invalidateQueries(['healthMetrics', patient?.id]);
          } catch (e) {
            console.error('Error auto-saving BLE reading:', e);
          }
        }}
      />

    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}