import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { subDays } from 'date-fns';
import PlanCard from './PlanCard';
import ComplianceGrid from './ComplianceGrid';
import PlanEditor from './PlanEditor';

export default function MonitoringPlanTab({ patientId, patient, medications }) {
  const [editMode, setEditMode] = useState(false);
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading: planLoading } = useQuery({
    queryKey: ['monitoringPlan', patientId],
    queryFn: () => base44.entities.MonitoringPlan.filter({ patient_id: patientId, is_active: true }),
    enabled: !!patientId
  });
  const plan = plans[0] || null;

  const { data: alertRules = [] } = useQuery({
    queryKey: ['alertRules'],
    queryFn: () => base44.entities.AlertRule.filter({ enabled: true })
  });

  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  const { data: dipstickResults = [] } = useQuery({
    queryKey: ['compDipstick', patientId],
    queryFn: () => base44.entities.DipstickResult.filter({ patient_id: patientId }, '-created_date', 30),
    enabled: !!patientId,
    select: d => d.filter(r => new Date(r.created_date) >= new Date(thirtyDaysAgo))
  });

  const { data: healthMetrics = [] } = useQuery({
    queryKey: ['compMetrics', patientId],
    queryFn: () => base44.entities.HealthMetric.filter({ patient_id: patientId }, '-created_date', 100),
    enabled: !!patientId,
    select: d => d.filter(m => new Date(m.recorded_at || m.created_date) >= new Date(thirtyDaysAgo))
  });

  const { data: medLogs = [] } = useQuery({
    queryKey: ['compMedLogs', patientId],
    queryFn: () => base44.entities.MedicationLog.filter({ patient_id: patientId }, '-scheduled_for', 50),
    enabled: !!patientId,
    select: d => d.filter(m => m.scheduled_for && new Date(m.scheduled_for) >= new Date(thirtyDaysAgo))
  });

  if (planLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (editMode) {
    return (
      <div className="px-4 pt-4">
        <PlanEditor
          plan={plan}
          patient={patient}
          medications={medications}
          alertRules={alertRules}
          onSave={(saved) => {
            queryClient.invalidateQueries(['monitoringPlan', patientId]);
            setEditMode(false);
          }}
          onCancel={() => setEditMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-8">
      {/* AIIMS Header */}
      <div style={{ backgroundColor: '#1a3660' }} className="rounded-xl p-3 mb-4">
        <p className="text-white font-bold text-sm">Monitoring Plan / योजना</p>
        <p className="text-white/60 text-[11px]">AIIMS Patna · Personalised Schedule</p>
      </div>

      {/* Plan Card */}
      <div className="mb-4">
        <PlanCard
          plan={plan}
          patient={patient}
          medications={medications.filter(m => plan?.medication_ids?.includes(m.id))}
          onEdit={() => setEditMode(true)}
        />
      </div>

      {/* Compliance Grid */}
      {plan && (
        <ComplianceGrid
          plan={plan}
          dipstickResults={dipstickResults}
          healthMetrics={healthMetrics}
          medLogs={medLogs}
        />
      )}
    </div>
  );
}