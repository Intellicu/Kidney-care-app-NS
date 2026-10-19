import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { subDays } from 'date-fns';
import { Loader2, FileText, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import DiaryStatCards from './DiaryStatCards';
import ProteinChart from './ProteinChart';
import BPChart from './BPChart';
import MedComplianceCalendar from './MedComplianceCalendar';
import MonthlyCalendarView from './MonthlyCalendarView';
import DiaryTable from './DiaryTable';

export default function NephroticDiary({ patientId }) {
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  const { data: dipstickResults = [], isLoading: d1 } = useQuery({
    queryKey: ['diary-dipstick', patientId],
    queryFn: () => base44.entities.DipstickResult.filter({ patient_id: patientId }, 'created_date', 90),
    enabled: !!patientId,
    select: data => data.filter(r => new Date(r.created_date) >= new Date(thirtyDaysAgo))
  });

  const { data: healthMetrics = [], isLoading: d2 } = useQuery({
    queryKey: ['diary-metrics', patientId],
    queryFn: () => base44.entities.HealthMetric.filter({ patient_id: patientId }, 'recorded_at', 200),
    enabled: !!patientId,
    select: data => data.filter(m =>
      ['BP', 'Weight', 'Symptoms'].includes(m.metric_type) &&
      new Date(m.recorded_at || m.created_date) >= new Date(thirtyDaysAgo)
    )
  });

  const { data: medLogs = [], isLoading: d3 } = useQuery({
    queryKey: ['diary-medlogs', patientId],
    queryFn: () => base44.entities.MedicationLog.filter({ patient_id: patientId }, 'scheduled_for', 200),
    enabled: !!patientId,
    select: data => data.filter(m =>
      m.scheduled_for && new Date(m.scheduled_for) >= new Date(thirtyDaysAgo)
    )
  });

  if (d1 || d2 || d3) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* AIIMS Patna Header */}
      <div style={{ backgroundColor: '#1a3660' }} className="px-4 py-3 mb-4 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm">नेफ्रोटिक डायरी / Nephrotic Diary</p>
          <p className="text-white/60 text-[11px]">AIIMS Patna • पिछले 30 दिन / Last 30 days</p>
        </div>
        <Link
          to={`/MonthlyReport?patient_id=${patientId}`}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          Print Report
        </Link>
      </div>

      {/* Section 1: Stat Cards */}
      <DiaryStatCards dipstickResults={dipstickResults} medLogs={medLogs} />

      {/* Section 2: Charts */}
      <div className="mb-1 px-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          ट्रेंड चार्ट / Trend Charts — 30 Days
        </p>
      </div>
      <ProteinChart dipstickResults={dipstickResults} />
      <BPChart healthMetrics={healthMetrics} />

      {/* Section: Visual Calendar */}
      <div className="mb-1 px-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          कैलेंडर दृश्य / Calendar View
        </p>
      </div>
      <div className="px-4">
        <MonthlyCalendarView dipstickResults={dipstickResults} medLogs={medLogs} />
      </div>

      <MedComplianceCalendar medLogs={medLogs} />

      {/* Section 3: Daily Table */}
      <div className="px-4 mb-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          दैनिक लॉग / Daily Log Table
        </p>
      </div>
      <DiaryTable
        dipstickResults={dipstickResults}
        healthMetrics={healthMetrics}
        medLogs={medLogs}
      />
    </div>
  );
}