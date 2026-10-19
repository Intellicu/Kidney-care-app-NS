import React, { useState } from 'react';
import {
  ChevronLeft, User, Calendar, Phone, Activity, Droplets,
  Pill, MessageSquare, AlertTriangle, TrendingUp, Send, Loader2,
  CheckCircle, FileText, Ruler, Scale, BookOpen, QrCode,
  Utensils, Share2, Copy
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, differenceInMonths } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import ProteinLevelBadge from '../components/shared/ProteinLevelBadge';
import PatientQRDialog from '../components/shared/PatientQRDialog';
import PatientTimeline from '../components/timeline/PatientTimeline';
import NephroticDiary from '../components/diary/NephroticDiary';
import MonitoringPlanTab from '../components/plan/MonitoringPlanTab';
import DrugMonitoringTab from '../components/labs/DrugMonitoringTab';

const TABS = [
  { id: 'itihaas',  label: '📜 Itihaas' },
  { id: 'diary',    label: '📓 Diary' },
  { id: 'journal',  label: '📝 Journal' },
  { id: 'growth',   label: '📈 Growth' },
  { id: 'plan',     label: '📋 Plan' },
  { id: 'nutrition', label: '🥗 Nutrition' },
  { id: 'labs',     label: '🧪 Labs' },
  { id: 'overview', label: '🔍 Overview' },
  { id: 'tests',    label: '💧 Tests' },
  { id: 'alerts',   label: '🔔 Alerts' },
];

const PROTEIN_MAP = { 'Negative': 0, 'Trace': 0.5, '1+': 1, '2+': 2, '3+': 3, '4+': 4 };
const SEV_COLOR = { critical: 'bg-red-50 border-red-200 text-red-700', high: 'bg-orange-50 border-orange-200 text-orange-700', medium: 'bg-yellow-50 border-yellow-200 text-yellow-700', low: 'bg-gray-50 border-gray-200 text-gray-600' };

// IAP height boys P3/P50/P97
const IAP_HT_BOYS = { 60:[101,110,119],72:[106,116,125],84:[112,122,132],96:[117,128,138],108:[121,133,145],120:[126,139,152],132:[131,145,159],144:[136,152,168],156:[143,161,177],168:[151,170,188],180:[158,178,195] };
const IAP_HT_GIRLS = { 60:[100,109,118],72:[105,115,125],84:[110,121,132],96:[115,127,140],108:[120,133,147],120:[125,139,154],132:[130,146,162],144:[135,153,172],156:[141,161,181],168:[147,167,187],180:[151,170,188] };

function getNearestAge(months, table) {
  return Object.keys(table).map(Number).sort((a,b)=>Math.abs(a-months)-Math.abs(b-months))[0];
}

function GrowthTab({ patient, healthMetrics }) {
  const ageMonths = patient?.dob ? differenceInMonths(new Date(), new Date(patient.dob)) : null;
  const gender = patient?.gender;
  const htTable = gender === 'Female' ? IAP_HT_GIRLS : IAP_HT_BOYS;
  const nearestAge = ageMonths ? getNearestAge(ageMonths, htTable) : null;
  const refs = nearestAge ? htTable[nearestAge] : null;

  const weightData = healthMetrics
    .filter(m => m.metric_type === 'Weight')
    .sort((a, b) => new Date(a.recorded_at || a.created_date) - new Date(b.recorded_at || b.created_date))
    .map(m => ({
      date: format(new Date(m.recorded_at || m.created_date), 'MMM d'),
      weight: parseFloat(m.value) || 0,
    }));

  const heightData = healthMetrics
    .filter(m => m.metric_type === 'Weight' && m.notes?.includes('height:'))
    .sort((a, b) => new Date(a.recorded_at || a.created_date) - new Date(b.recorded_at || b.created_date))
    .map(m => {
      const h = parseFloat(m.notes.match(/height:(\d+\.?\d*)/)?.[1] || 0);
      const w = parseFloat(m.value) || 0;
      const bmi = h > 0 ? (w / ((h/100)**2)).toFixed(1) : null;
      return {
        date: format(new Date(m.recorded_at || m.created_date), 'MMM d'),
        height: h,
        bmi: parseFloat(bmi),
      };
    });

  const latestW = weightData[weightData.length - 1];
  const latestH = heightData[heightData.length - 1];
  const bmi = latestH?.bmi;

  return (
    <div className="space-y-3 pt-3">
      {/* Stat pills */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Height', value: latestH ? `${latestH.height}cm` : '—', color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Weight', value: latestW ? `${latestW.weight}kg` : '—', color: 'text-blue-600 bg-blue-50' },
          { label: 'BMI', value: bmi || '—', color: bmi > 25 || bmi < 14 ? 'text-amber-600 bg-amber-50' : 'text-gray-700 bg-gray-100' },
          { label: 'Age', value: ageMonths ? `${Math.floor(ageMonths/12)}y${ageMonths%12}m` : '—', color: 'text-purple-600 bg-purple-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-2.5 text-center ${s.color}`}>
            <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
            <p className="font-bold text-sm">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Weight chart */}
      {weightData.length > 0 ? (
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Weight (kg)</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={weightData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-center text-gray-400 text-sm py-6">No weight data recorded yet</p>
      )}

      {/* Height chart with IAP percentile bands */}
      {heightData.length > 0 && (
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Height (cm) — IAP Percentiles</p>
            {refs && <span className="text-[10px] text-gray-400">P3={refs[0]} P50={refs[1]} P97={refs[2]}</span>}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={heightData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              {refs && <>
                <ReferenceLine y={refs[0]} stroke="#fca5a5" strokeDasharray="4 3" label={{ value: 'P3', fontSize: 8, fill: '#ef4444' }} />
                <ReferenceLine y={refs[1]} stroke="#86efac" strokeDasharray="4 3" label={{ value: 'P50', fontSize: 8, fill: '#16a34a' }} />
                <ReferenceLine y={refs[2]} stroke="#fca5a5" strokeDasharray="4 3" label={{ value: 'P97', fontSize: 8, fill: '#ef4444' }} />
              </>}
              <Line type="monotone" dataKey="height" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {heightData.length === 0 && weightData.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          <TrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          No growth measurements recorded. Add height+weight via the Growth Tracker.
        </div>
      )}

      <Link to="/GrowthTracking" className="block">
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-emerald-700 text-sm font-medium">
          <span>Open full Growth Tracker</span>
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </div>
      </Link>
    </div>
  );
}

function JournalTab({ patientId }) {
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['patientDailyNotes', patientId],
    queryFn: () => base44.entities.DailyNote.filter({ patient_id: patientId }, '-note_date', 30),
    enabled: !!patientId
  });

  const moodEmoji = { Happy: '😊', Okay: '😐', Irritable: '😤', Tired: '😴', Unwell: '🤒' };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>;

  if (notes.length === 0) return (
    <div className="text-center py-12 text-gray-400 text-sm">
      <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
      No caregiver journal entries yet.
      <p className="mt-1 text-xs">Caregivers add notes in Daily Log → Notes tab.</p>
    </div>
  );

  return (
    <div className="space-y-2 pt-3">
      {notes.map(note => (
        <div key={note.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-50">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-gray-500">
              {format(new Date(note.note_date), 'EEE, MMM d yyyy')}
            </p>
            <div className="flex items-center gap-1.5">
              {note.mood && (
                <span className="text-base">{moodEmoji[note.mood] || '😐'}</span>
              )}
              {note.mood && (
                <span className="text-[10px] text-gray-400">{note.mood}</span>
              )}
            </div>
          </div>
          {note.note_text ? (
            <p className="text-sm text-gray-700 leading-relaxed">{note.note_text}</p>
          ) : (
            <p className="text-xs text-gray-400 italic">No text note</p>
          )}
          {note.activity_level && (
            <div className="flex gap-2 mt-1.5">
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Activity: {note.activity_level}</span>
              {note.appetite && <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Appetite: {note.appetite}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PatientDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('itihaas');
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const patients = await base44.entities.Patient.filter({ id: patientId });
      return patients[0];
    },
    enabled: !!patientId
  });

  const { data: dipstickResults = [] } = useQuery({
    queryKey: ['patientDipstick', patientId],
    queryFn: () => base44.entities.DipstickResult.filter({ patient_id: patientId }, '-created_date', 30),
    enabled: !!patientId
  });

  const { data: healthMetrics = [] } = useQuery({
    queryKey: ['patientMetrics', patientId],
    queryFn: () => base44.entities.HealthMetric.filter({ patient_id: patientId }, '-created_date', 50),
    enabled: !!patientId
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['patientMedications', patientId],
    queryFn: () => base44.entities.Medication.filter({ patient_id: patientId, active: true }),
    enabled: !!patientId
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['patientAlerts', patientId],
    queryFn: () => base44.entities.Alert.filter({ patient_id: patientId }, '-created_date', 20),
    enabled: !!patientId
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId) => {
      const user = await base44.auth.me();
      await base44.entities.Alert.update(alertId, {
        acknowledged: true,
        acknowledged_by: user.email,
        acknowledged_at: new Date().toISOString()
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['patientAlerts'])
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      await base44.entities.ClinicianMessage.create({
        patient_id: patientId,
        clinician_id: user.id,
        message,
        direction: 'to_patient'
      });
    },
    onSuccess: () => {
      setMessageSent(true);
      setTimeout(() => { setShowMessageDialog(false); setMessage(''); setMessageSent(false); }, 2000);
    }
  });

  const calculateAge = (dob) => {
    if (!dob) return '--';
    return new Date().getFullYear() - new Date(dob).getFullYear();
  };

  const chartData = dipstickResults.slice(0, 14).reverse().map(r => ({
    date: format(new Date(r.created_date), 'MMM d'),
    protein: PROTEIN_MAP[r.protein_level] || 0,
    level: r.protein_level
  }));

  const unackAlerts = alerts.filter(a => !a.acknowledged).length;

  if (isLoading || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Compact header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 pt-4 pb-3 text-white shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Link to="/ClinicianDashboard">
            <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          </Link>
          <span className="text-sm font-medium opacity-80">Patient Details</span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setShowQRDialog(true)}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              <QrCode className="w-3 h-3" /> QR
            </button>
            <button
              onClick={() => setShowMessageDialog(true)}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              <MessageSquare className="w-3 h-3" /> Message
            </button>
            <Link
              to={`/DoctorSummary?id=${patientId}`}
              className="flex items-center gap-1.5 bg-white text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full"
            >
              <FileText className="w-3 h-3" /> Summary
            </Link>
          </div>
        </div>

        {/* Patient identity row */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold shrink-0">
            {patient.name?.[0]?.toUpperCase() || 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold leading-tight">{patient.name}</h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              <span className="text-white/70 text-xs">{calculateAge(patient.dob)}y · {patient.gender}</span>
              {patient.ns_classification && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{patient.ns_classification}</span>
              )}
              {patient.cr_number && (
                <span className="text-[10px] text-white/60">{patient.cr_number}</span>
              )}
            </div>
          </div>
          {unackAlerts > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shrink-0">
              {unackAlerts} alert{unackAlerts > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Quick stat chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5 scrollbar-none">
          {[
            { label: 'Phone', val: patient.phone || '—' },
            { label: 'Caregiver', val: patient.caregiver_name || '—' },
            { label: 'Language', val: patient.language_preference?.toUpperCase() || '—' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-lg px-2.5 py-1.5 shrink-0">
              <p className="text-[9px] text-white/60 uppercase">{s.label}</p>
              <p className="text-xs text-white font-medium">{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal scrollable tab bar */}
      <div className="bg-white border-b border-gray-100 px-3 shrink-0">
        <div className="flex overflow-x-auto scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1 whitespace-nowrap px-3 py-3 text-xs font-semibold transition-colors shrink-0 ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.id === 'alerts' && unackAlerts > 0 && (
                <span className="w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{unackAlerts}</span>
              )}
              {tab.id === 'journal' && (
                <span className="w-4 h-4 bg-amber-400 text-white text-[9px] rounded-full flex items-center justify-center">!</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {activeTab === 'itihaas' && (
          <PatientTimeline patientId={patientId} />
        )}

        {activeTab === 'diary' && (
          <div className="-mx-4">
            <NephroticDiary patientId={patientId} />
          </div>
        )}

        {activeTab === 'journal' && (
          <JournalTab patientId={patientId} />
        )}

        {activeTab === 'growth' && (
          <GrowthTab patient={patient} healthMetrics={healthMetrics} />
        )}

        {activeTab === 'plan' && (
          <div className="-mx-4">
            <MonitoringPlanTab patient={patient} medications={medications} />
          </div>
        )}

        {activeTab === 'labs' && (
          <div className="-mx-4">
            <DrugMonitoringTab patient={patient} medications={medications} />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-3 pt-3">
            {/* Protein chart */}
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                <p className="text-xs font-semibold text-gray-700">Protein Trend (14 days)</p>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 4]} tick={{ fontSize: 9 }} />
                    <Tooltip content={({ payload }) => payload?.[0] ? (
                      <div className="bg-white p-2 shadow rounded-lg border text-xs font-medium">{payload[0].payload.level}</div>
                    ) : null} />
                    <Line type="monotone" dataKey="protein" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-6 text-sm">No test data</p>
              )}
            </div>

            {/* Medications */}
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <Pill className="w-4 h-4 text-orange-500" />
                <p className="text-xs font-semibold text-gray-700">Active Medications</p>
              </div>
              {medications.length > 0 ? (
                <div className="space-y-1.5">
                  {medications.map(med => (
                    <div key={med.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">{med.drug_name}</p>
                      <p className="text-xs text-gray-500">{med.dose} · {med.frequency}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">No medications</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-2 pt-3">
            {dipstickResults.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No dipstick results</p>
            )}
            {dipstickResults.map(result => (
              <div key={result.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">{format(new Date(result.created_date), 'MMM d, h:mm a')}</p>
                  <div className="mt-1"><ProteinLevelBadge level={result.protein_level} showDescription /></div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Confidence</p>
                  <p className="text-sm font-bold text-gray-800">{Math.round((result.confidence || 1) * 100)}%</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-2 pt-3">
            {alerts.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No alerts</p>
            )}
            {alerts.map(alert => {
              const sev = alert.severity || 'low';
              const sevCls = SEV_COLOR[sev] || SEV_COLOR.low;
              return (
                <div key={alert.id} className={`rounded-2xl px-4 py-3 border shadow-sm ${alert.acknowledged ? 'bg-gray-50 border-gray-100 opacity-60' : sevCls}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={alert.acknowledged ? 'secondary' : 'destructive'} className="text-[10px]">
                          {alert.alert_type}
                        </Badge>
                        <span className="text-[10px] uppercase font-bold opacity-70">{sev}</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-snug">{alert.message_hi || alert.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{format(new Date(alert.created_date), 'MMM d, h:mm a')}</p>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeMutation.mutate(alert.id)}
                        disabled={acknowledgeMutation.isPending}
                        className="shrink-0 text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg font-medium hover:bg-gray-50"
                      >
                        Ack
                      </button>
                    )}
                    {alert.acknowledged && <CheckCircle className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── NUTRITION & PRINT SDI PRESCRIPTION TAB ── */}
        {activeTab === 'nutrition' && (
          <div className="space-y-4 pt-3">
            {(() => {
              const ageYears = patient?.dob ? Math.max(1, Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 86400000))) : 7;
              const gender = patient?.gender || 'Male';
              const latestWeightMetric = healthMetrics?.find(m => m.metric_type === 'Weight');
              const wt = parseFloat(latestWeightMetric?.value) || parseFloat(patient?.weight_kg) || 21.4;

              const energyLow = Math.round(wt * (ageYears <= 6 ? 67 : ageYears <= 8 ? 60 : 55));
              const energyHigh = Math.round(wt * (ageYears <= 6 ? 93 : ageYears <= 8 ? 77 : 69));
              const protLow = Math.round(wt * 0.90);
              const protHigh = Math.round(wt * 0.95);
              const sodiumLimit = 1200;
              const fluidLimit = Math.round(wt * 50);

              const planCode = `KCPLAN-${ageYears}Y-${gender === 'Female' ? 'F' : 'M'}-WT${wt}-EL${energyLow}-EH${energyHigh}-NA${sodiumLimit}-FL${fluidLimit}`;
              const shareMsg = `KidneyCare Nutrition Plan (AIIMS Patna)\nPatient: ${patient?.name || 'Child'}\nDoctor Plan Code: ${planCode}\n\nPrescribed Limits:\n• Energy: ${energyLow} - ${energyHigh} kcal/day (50th centile)\n• Protein: ${protLow} - ${protHigh} g/day (97.5% safe tier)\n• Sodium Ceiling: < ${sodiumLimit} mg Na/day (~3g salt / 1/2 tsp)\n• Fluid: < ${fluidLimit} mL/day\n\nCaregiver: Paste this code in your KidneyCare app.`;

              return (
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl border border-emerald-600/40 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                          PRINT 2026 Suggested Dietary Intake (SDI)
                        </span>
                        <h4 className="text-sm font-black text-white mt-0.5">
                          Renal Targets: {patient?.name || 'Patient'}
                        </h4>
                      </div>
                      <Badge className="bg-emerald-500 text-slate-950 font-black text-[10px]">
                        {wt} kg · {ageYears}y
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-white/10 p-2 rounded-xl">
                        <span className="text-[9px] text-emerald-200 block uppercase font-bold">Energy SDI</span>
                        <span className="font-black text-amber-300 text-sm">{energyLow}–{energyHigh}</span>
                        <span className="text-[9px] text-slate-300 block">kcal/day</span>
                      </div>
                      <div className="bg-white/10 p-2 rounded-xl">
                        <span className="text-[9px] text-emerald-200 block uppercase font-bold">Safe Protein</span>
                        <span className="font-black text-white text-sm">{protLow}–{protHigh}</span>
                        <span className="text-[9px] text-slate-300 block">g/day</span>
                      </div>
                      <div className="bg-white/10 p-2 rounded-xl">
                        <span className="text-[9px] text-emerald-200 block uppercase font-bold">Sodium Ceiling</span>
                        <span className="font-black text-red-300 text-sm">&lt; {sodiumLimit}</span>
                        <span className="text-[9px] text-slate-300 block">mg Na (~3g salt)</span>
                      </div>
                      <div className="bg-white/10 p-2 rounded-xl">
                        <span className="text-[9px] text-emerald-200 block uppercase font-bold">Fluid Allowance</span>
                        <span className="font-black text-blue-300 text-sm">&lt; {fluidLimit}</span>
                        <span className="text-[9px] text-slate-300 block">mL/day</span>
                      </div>
                    </div>

                    {/* Plan Code & Share Box */}
                    <div className="bg-black/40 border border-white/15 p-2.5 rounded-xl flex items-center justify-between gap-2 font-mono text-xs">
                      <span className="text-emerald-300 font-bold truncate">
                        {planCode}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(planCode);
                            alert('Plan code copied to clipboard!');
                          }}
                          className="bg-white/15 hover:bg-white/25 text-white px-2 py-1 rounded-lg text-[10px] font-sans font-semibold flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">
                        Open Full Pediatric Nutrition Hub
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        643 Indian renal food tables, ICMR conflicts (C1–C10), and IFCT 2017 calculator.
                      </p>
                    </div>
                    <Link
                      to="/NutritionHub"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Launch Hub</span>
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Metrics tab (inside overview scroll) */}
        {activeTab === 'metrics' && (
          <div className="space-y-3 pt-3">
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-2">Recent Entries</p>
              <div className="space-y-1.5">
                {healthMetrics.slice(0, 12).map(metric => (
                  <div key={metric.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{metric.metric_type}</p>
                      <p className="text-[10px] text-gray-400">{format(new Date(metric.recorded_at || metric.created_date), 'MMM d, h:mm a')}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {metric.value}{metric.value_secondary ? `/${metric.value_secondary}` : ''} {metric.unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Dialog */}
      <PatientQRDialog patient={patient} open={showQRDialog} onOpenChange={setShowQRDialog} />

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Message to {patient.name}</DialogTitle>
          </DialogHeader>
          {messageSent ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium text-gray-900">Sent!</p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Clinical advice or note..." className="min-h-28 rounded-xl text-sm" />
              <Button onClick={() => sendMessageMutation.mutate()} disabled={!message.trim() || sendMessageMutation.isPending} className="w-full h-11 rounded-xl bg-blue-500 hover:bg-blue-600">
                {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Send</>}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}