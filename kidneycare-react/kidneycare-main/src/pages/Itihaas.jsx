import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Upload, FileText, Activity, Droplets, Pill, Scale, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { Link } from 'react-router-dom';
import ProteinLevelBadge from '../components/shared/ProteinLevelBadge';

const TYPE_CONFIG = {
  DipstickResult: { label: 'Dipstick', emoji: '🧪', color: 'bg-blue-50 border-blue-100', dot: 'bg-blue-500' },
  HealthMetric:   { label: 'Vitals',   emoji: '❤️', color: 'bg-rose-50 border-rose-100',  dot: 'bg-rose-500' },
  MedicationLog:  { label: 'Meds',     emoji: '💊', color: 'bg-green-50 border-green-100', dot: 'bg-green-500' },
  HealthRecord:   { label: 'Record',   emoji: '📄', color: 'bg-purple-50 border-purple-100',dot: 'bg-purple-500' },
  Alert:          { label: 'Alert',    emoji: '🔔', color: 'bg-amber-50 border-amber-100',  dot: 'bg-amber-500' },
};

function groupByDate(items) {
  const groups = {};
  for (const item of items) {
    const d = new Date(item.date);
    let label;
    if (isToday(d))          label = 'Today';
    else if (isYesterday(d)) label = 'Yesterday';
    else if (isThisWeek(d))  label = format(d, 'EEEE');
    else if (isThisMonth(d)) label = format(d, 'dd MMM');
    else                     label = format(d, 'MMM yyyy');
    (groups[label] = groups[label] || []).push(item);
  }
  return groups;
}

function TimelineItem({ item }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.HealthRecord;

  return (
    <div className="flex gap-3">
      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${cfg.dot} shrink-0 mt-1.5 ring-2 ring-white`} />
        <div className="w-px flex-1 bg-gray-200 mt-1" />
      </div>

      {/* Card */}
      <div className={`flex-1 mb-3 rounded-2xl border px-3 py-3 ${cfg.color}`}>
        <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">{cfg.emoji}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
              <p className="text-xs text-gray-400">{format(new Date(item.date), 'h:mm a')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {item.badge && <span className="text-xs font-bold px-2 py-0.5 bg-white rounded-full border border-gray-200">{item.badge}</span>}
            {item.details && (expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />)}
          </div>
        </div>

        {expanded && item.details && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{item.details}</p>
            {item.file_url && (
              <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-600 font-medium underline">
                <FileText className="w-3 h-3" /> View document
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Itihaas() {
  const [filter, setFilter] = useState('All');
  const urlParams = new URLSearchParams(window.location.search);
  const patientIdParam = urlParams.get('id');

  const getPatientId = async () => {
    if (patientIdParam) return patientIdParam;
    const user = await base44.auth.me();
    const pts = await base44.entities.Patient.filter({ created_by: user.email });
    return pts.find(p => p.onboarding_complete)?.id || pts[0]?.id;
  };

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['itihaas', patientIdParam],
    queryFn: async () => {
      const pid = await getPatientId();
      if (!pid) return [];

      const [dipstick, metrics, medlogs, records, alerts] = await Promise.all([
        base44.entities.DipstickResult.filter({ patient_id: pid }, '-created_date', 60),
        base44.entities.HealthMetric.filter({ patient_id: pid }, '-created_date', 60),
        base44.entities.MedicationLog.filter({ patient_id: pid }, '-created_date', 60),
        base44.entities.HealthRecord.filter({ patient_id: pid }, '-created_date', 30),
        base44.entities.Alert.filter({ patient_id: pid }, '-created_date', 30),
      ]);

      const items = [
        ...dipstick.map(r => ({
          id: r.id, type: 'DipstickResult', date: r.created_date,
          title: `Urine Test — ${r.protein_level || '?'}`,
          badge: r.protein_level,
          details: `Confidence: ${Math.round((r.confidence || 1) * 100)}%${r.clinician_notes ? '\n' + r.clinician_notes : ''}`,
        })),
        ...metrics.map(m => ({
          id: m.id, type: 'HealthMetric', date: m.recorded_at || m.created_date,
          title: `${m.metric_type}: ${m.value}${m.value_secondary ? '/' + m.value_secondary : ''} ${m.unit || ''}`,
          badge: m.severity,
          details: m.notes || null,
        })),
        ...medlogs.map(l => ({
          id: l.id, type: 'MedicationLog', date: l.created_date,
          title: `Medication — ${l.taken ? '✅ Taken' : '❌ Missed'}`,
          badge: l.taken ? 'Taken' : 'Missed',
          details: `Scheduled: ${l.scheduled_for}${l.notes ? '\n' + l.notes : ''}`,
        })),
        ...records.map(r => ({
          id: r.id, type: 'HealthRecord', date: r.created_date,
          title: r.title, badge: r.record_type,
          details: r.description,
          file_url: r.attachments?.[0],
        })),
        ...alerts.map(a => ({
          id: a.id, type: 'Alert', date: a.created_date,
          title: a.alert_type, badge: a.severity,
          details: a.message_hi || a.message,
        })),
      ];

      return items.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
  });

  const FILTERS = ['All', 'DipstickResult', 'HealthMetric', 'MedicationLog', 'HealthRecord', 'Alert'];
  const FILTER_LABELS = { All: '📋 All', DipstickResult: '🧪 Tests', HealthMetric: '❤️ Vitals', MedicationLog: '💊 Meds', HealthRecord: '📄 Records', Alert: '🔔 Alerts' };

  const filtered = filter === 'All' ? allItems : allItems.filter(i => i.type === filter);
  const groups = groupByDate(filtered);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 pt-4 pb-3 text-white sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Link to={patientIdParam ? `/PatientDetail?id=${patientIdParam}` : '/'}>
            <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          </Link>
          <div>
            <h1 className="font-bold text-base">📜 Itihaas — History</h1>
            <p className="text-indigo-200 text-xs">Complete health timeline</p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${filter === f ? 'bg-white text-indigo-700' : 'bg-white/20 text-white'}`}>
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-400" /></div>
        ) : Object.keys(groups).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No records found</p>
          </div>
        ) : (
          Object.entries(groups).map(([label, items]) => (
            <div key={label} className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 sticky top-0 bg-gray-50 py-1">{label}</p>
              {items.map(item => <TimelineItem key={item.id} item={item} />)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}