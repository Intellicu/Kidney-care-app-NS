import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday } from 'date-fns';
import {
  Loader2, CheckCircle, ChevronRight, Calendar, Droplets,
  Activity, Scale, Pill, AlertTriangle, Play, Sun, Moon, Heart, Bell, X, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import VoiceLogModal from '../components/tasks/VoiceLogModal';
import TaskEntryModal from '../components/tasks/TaskEntryModal';
import { useTheme } from '../components/shared/ThemeContext';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export default function TodaysTasks() {
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [taskEntry, setTaskEntry] = useState(null);
  const [showReminder, setShowReminder] = useState(false);
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTimeNum = now.getHours() * 60 + now.getMinutes();
  const { isDark, toggleTheme } = useTheme();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['myPatient'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const patients = await base44.entities.Patient.filter({ created_by: user.email });
      return patients.find(p => p.onboarding_complete) || patients[0];
    }
  });

  const { data: plan } = useQuery({
    queryKey: ['myPlan', patient?.id],
    queryFn: () => base44.entities.MonitoringPlan.filter({ patient_id: patient.id, is_active: true }),
    enabled: !!patient?.id,
    select: d => d[0]
  });

  const { data: todayDipstick = [] } = useQuery({
    queryKey: ['todayDipstick', patient?.id],
    queryFn: () => base44.entities.DipstickResult.filter({ patient_id: patient.id }, '-created_date', 5),
    enabled: !!patient?.id,
    select: d => d.filter(r => isToday(new Date(r.created_date)))
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

  // Build tasks early so hooks below are never conditional
  const tasks = [];
  if (plan) {
    const dipstickTimes = plan.dipstick_frequency === 'Twice_Daily'
      ? [plan.dipstick_time || '07:30', '19:00'] : [plan.dipstick_time || '07:30'];
    dipstickTimes.forEach((t, i) => {
      const [h, m] = t.split(':').map(Number);
      tasks.push({ id: `d${i}`, type: 'dipstick', time: t, timeNum: h * 60 + m, label: 'Urine Test', sublabel: i === 0 ? 'Morning urine' : 'Evening urine', done: todayDipstick.length > i, resultLabel: todayDipstick[i]?.protein_level, icon: Droplets, color: 'blue' });
    });
    if (plan.bp_frequency && plan.bp_frequency !== 'Not_Required') {
      const bpTimes = plan.bp_times?.length ? plan.bp_times : ['07:30'];
      const todayBP = todayMetrics.filter(m => m.metric_type === 'BP');
      bpTimes.forEach((t, i) => {
        const [h, m] = t.split(':').map(Number);
        tasks.push({ id: `bp${i}`, type: 'bp', time: t, timeNum: h * 60 + m, label: 'Blood Pressure', sublabel: i === 0 ? 'Morning BP' : 'Evening BP', done: todayBP.length > i, resultLabel: todayBP[i] ? `${todayBP[i].value}/${todayBP[i].value_secondary}` : null, icon: Activity, color: 'rose', taskType: 'BP' });
      });
    }
    if (plan.weight_frequency && plan.weight_frequency !== 'Not_Required') {
      const todayWeight = todayMetrics.find(m => m.metric_type === 'Weight');
      const wt = plan.weight_time || '07:30';
      const [h, m] = wt.split(':').map(Number);
      tasks.push({ id: 'wt', type: 'weight', time: wt, timeNum: h * 60 + m, label: 'Weight', sublabel: 'Measure in kg', done: !!todayWeight, resultLabel: todayWeight ? `${todayWeight.value} kg` : null, icon: Scale, color: 'amber', taskType: 'Weight' });
    }
    medications.forEach(med => {
      const log = todayMedLogs.find(l => l.medication_id === med.id);
      const t = med.schedule || '08:00';
      const [h, m] = t.split(':').map(Number);
      tasks.push({ id: `med_${med.id}`, type: 'medication', time: t, timeNum: h * 60 + m, label: med.drug_name, sublabel: `${med.dose} · ${med.frequency}`, done: log?.taken === true, missed: log?.taken === false, resultLabel: log?.taken ? 'Taken ✓' : log?.taken === false ? 'Missed' : null, icon: Pill, color: 'green', medication: med });
    });
  }
  tasks.sort((a, b) => a.timeNum - b.timeNum);
  const doneTasks = tasks.filter(t => t.done);

  // Reminder banner effect — must be before any early return
  useEffect(() => {
    if (tasks.length > 0 && doneTasks.length < tasks.length) {
      const dismissed = localStorage.getItem(`checkin_dismissed_${today}`);
      if (!dismissed) setShowReminder(true);
    }
  }, [tasks.length, doneTasks.length, today]);

  const dismissReminder = () => {
    localStorage.setItem(`checkin_dismissed_${today}`, '1');
    setShowReminder(false);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (!patient) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-8 text-center">
      <p className="text-gray-500 dark:text-gray-400 mb-4">No patient profile found.</p>
      <Link to="/Onboarding" className="bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl">Set up Profile</Link>
    </div>
  );

  const overdue = tasks.filter(t => !t.done && !t.missed && t.timeNum < currentTimeNum - 30);
  const upcoming = tasks.filter(t => !t.done && !t.missed && t.timeNum >= currentTimeNum - 30);
  const missed = tasks.filter(t => t.missed);
  const compliancePct = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  const nextClinicDays = plan?.next_clinic_date ? Math.ceil((new Date(plan.next_clinic_date) - now) / 86400000) : null;

  const handleTaskTap = (task) => {
    if (task.done) return;
    if (task.type === 'dipstick') window.location.href = '/DipstickTest';
    else setTaskEntry(task);
  };

  const iconColors = { blue: 'text-blue-500', rose: 'text-rose-500', amber: 'text-amber-500', green: 'text-green-500' };
  const bgColors = { blue: 'bg-blue-50 dark:bg-blue-900/20', rose: 'bg-rose-50 dark:bg-rose-900/20', amber: 'bg-amber-50 dark:bg-amber-900/20', green: 'bg-green-50 dark:bg-green-900/20' };

  const TaskCard = ({ task, isOverdue }) => {
    const Icon = task.icon;
    return (
      <button onClick={() => handleTaskTap(task)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-2 text-left border transition-all shadow-sm
          ${task.done ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'
            : isOverdue ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
            : `bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700`}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
          ${task.done ? 'bg-green-100 dark:bg-green-800/40' : isOverdue ? 'bg-red-100 dark:bg-red-800/40' : bgColors[task.color]}`}>
          {task.done ? <CheckCircle className="w-5 h-5 text-green-500" />
            : task.missed ? <AlertTriangle className="w-5 h-5 text-red-400" />
            : <Icon className={`w-5 h-5 ${isOverdue ? 'text-red-500' : iconColors[task.color]}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm ${task.done ? 'text-green-700 dark:text-green-400' : isOverdue ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>
              {task.label}
            </span>
            {task.resultLabel && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.done ? 'bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-300'}`}>
                {task.resultLabel}
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
            {task.time} · {task.sublabel}{isOverdue && !task.done ? ' — Overdue' : ''}
          </p>
        </div>
        {!task.done && !task.missed && <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 pb-24">
      {/* Header — mirrors Dashboard's DashboardHeader style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-b-3xl px-5 pt-6 pb-8 text-white"
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm">{getGreeting()}</p>
              <h1 className="text-xl font-bold">{patient?.name || 'Patient'}</h1>
            </div>
          </div>
          {/* Dark/light toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-white" />}
          </button>
        </div>

        {/* Progress strip */}
        {tasks.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/70 text-sm">Today's Progress</p>
              <span className="text-white font-bold text-sm">{doneTasks.length}/{tasks.length}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white rounded-full h-2 transition-all duration-500" style={{ width: `${compliancePct}%` }} />
            </div>
          </div>
        )}
      </motion.div>

      <div className="px-4 pt-4 space-y-4 max-w-xl mx-auto w-full">
        {/* Daily check-in reminder banner */}
        {showReminder && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-2xl px-4 py-3"
          >
            <Bell className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                {now.getHours() < 12 ? 'Good morning! 🌅' : now.getHours() < 17 ? 'Afternoon reminder 🌤' : 'Evening reminder 🌙'}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-300">
                {tasks.length - doneTasks.length} task{tasks.length - doneTasks.length !== 1 ? 's' : ''} remaining today — don't forget your check-in!
              </p>
            </div>
            <button onClick={dismissReminder} className="text-amber-400 hover:text-amber-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Start CTA */}
        {upcoming.length > 0 && (
          <button
            onClick={() => upcoming[0]?.type === 'dipstick' ? window.location.href = '/DipstickTest' : setTaskEntry(upcoming[0])}
            className="w-full flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-left shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 dark:text-white font-semibold text-sm">Start Next Task</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">{upcoming[0]?.label} · {upcoming[0]?.time}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        )}

        {/* Task lists */}
        {tasks.length > 0 ? (
          <div className="space-y-4">
            {doneTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">✓ Completed ({doneTasks.length})</p>
                {doneTasks.map(t => <TaskCard key={t.id} task={t} isOverdue={false} />)}
              </div>
            )}
            {overdue.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">⚠ Overdue</p>
                {overdue.map(t => <TaskCard key={t.id} task={t} isOverdue={true} />)}
              </div>
            )}
            {missed.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">✗ Missed</p>
                {missed.map(t => <TaskCard key={t.id} task={t} isOverdue={false} />)}
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">⏱ Upcoming</p>
                {upcoming.map(t => <TaskCard key={t.id} task={t} isOverdue={false} />)}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No monitoring plan configured yet.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Your clinician will set up your daily tasks.</p>
          </div>
        )}

        {/* Next clinic */}
        {plan?.next_clinic_date && (
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
            <Calendar className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-gray-900 dark:text-white text-sm font-semibold">Next Clinic Visit</p>
              <p className="text-blue-600 dark:text-blue-400 text-sm">{format(new Date(plan.next_clinic_date), 'dd MMM yyyy')}
                {nextClinicDays !== null && <span className="text-gray-400 ml-2">({nextClinicDays}d away)</span>}
              </p>
              {plan.emergency_contact && <p className="text-xs text-gray-400 mt-0.5">📞 {plan.emergency_contact}</p>}
            </div>
          </div>
        )}

        {/* Watch-for symptoms */}
        {plan?.symptoms_to_watch?.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl p-4">
            <p className="text-amber-700 dark:text-amber-300 font-semibold text-sm mb-2">⚠ Watch For These Symptoms</p>
            <div className="flex flex-wrap gap-1.5">
              {plan.symptoms_to_watch.map((s, i) => (
                <span key={i} className="text-xs bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: '▶', label: 'Check-in', to: '/DailyCheckin' },
              { icon: '🧪', label: 'Urine Test', to: '/DipstickTest' },
              { icon: '💊', label: 'Medicines', to: '/Medications' },
              { icon: '❤️', label: 'Symptoms', to: '/SymptomChecker' },
              { icon: '📈', label: 'Trends', to: '/HealthMetrics' },
              { icon: '🥗', label: 'Diet', to: '/DailyLog' },
              { icon: '📏', label: 'Growth', to: '/GrowthTracking' },
              { icon: '📅', label: 'Appts.', to: '/Appointments' },
              { icon: '📚', label: 'Learn', to: '/Education' },
              { icon: '📋', label: 'Report', to: '/MonthlyReport' },
              { icon: '📔', label: 'Daily Log', to: '/DailyLog' },
              { icon: '🏥', label: 'Records', to: '/HealthRecords' },
            ].map((a, i) => (
              <Link key={i} to={a.to}
                className="flex flex-col items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-3 hover:shadow-sm transition-shadow">
                <span className="text-2xl">{a.icon}</span>
                <span className="text-gray-500 dark:text-gray-400 text-xs text-center leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Voice assistant */}
        <button onClick={() => setShowVoiceModal(true)}
          className="w-full flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-left shadow-sm">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
            <span className="text-lg">🎙</span>
          </div>
          <div>
            <p className="text-gray-900 dark:text-white text-sm font-semibold">Need help? Tap to talk</p>
            <p className="text-blue-500 text-xs">Voice assistant</p>
          </div>
        </button>
      </div>

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
    </div>
  );
}