import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, isToday, isSameDay } from 'date-fns';
import { Edit2, Share2, Droplets, Activity, Scale, Pill, ChevronDown, ChevronUp, Loader2, Plus, Utensils, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import MonitoringPlanForm from './MonitoringPlanForm';

const PHASE_COLORS = {
  Active_Relapse: 'bg-red-100 text-red-700 border-red-200',
  Remission: 'bg-green-100 text-green-700 border-green-200',
  Weaning: 'bg-amber-100 text-amber-700 border-amber-200',
  Post_Relapse: 'bg-orange-100 text-orange-700 border-orange-200',
  Newly_Diagnosed: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function MonitoringPlanTab({ patient, medications }) {
  const [showForm, setShowForm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plan', patient.id],
    queryFn: () => base44.entities.MonitoringPlan.filter({ patient_id: patient.id, is_active: true }),
    select: data => data[0]
  });

  // 7-day compliance data
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();
  const { data: recentDipstick = [] } = useQuery({
    queryKey: ['planDipstick7', patient.id],
    queryFn: () => base44.entities.DipstickResult.filter({ patient_id: patient.id }, '-created_date', 30),
    select: d => d.filter(r => new Date(r.created_date) > new Date(sevenDaysAgo))
  });
  const { data: recentMetrics = [] } = useQuery({
    queryKey: ['planMetrics7', patient.id],
    queryFn: () => base44.entities.HealthMetric.filter({ patient_id: patient.id }, '-created_date', 50),
    select: d => d.filter(m => new Date(m.recorded_at || m.created_date) > new Date(sevenDaysAgo))
  });
  const { data: recentMedLogs = [] } = useQuery({
    queryKey: ['planMedLogs7', patient.id],
    queryFn: () => base44.entities.MedicationLog.filter({ patient_id: patient.id }, '-scheduled_for', 30),
    select: d => d.filter(m => new Date(m.scheduled_for) > new Date(sevenDaysAgo))
  });

  const generateShareText = () => {
    if (!plan || !patient) return '';
    const age = patient.dob ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 86400000)) : 7;
    const med = medications[0];
    const wt = parseFloat(patient.weight_kg) || 21.4;
    const planCode = `KCPLAN-${age}Y-${patient.gender === 'Female' ? 'F' : 'M'}-WT${wt}-EL1300-EH1650-NA1200-FL1200`;

    return `*KidneyCare Monitoring Plan — ${patient.name}*
CR: ${patient.cr_number || 'N/A'}  |  ${patient.ns_classification || 'NS'}  |  Age ${age} years

📋 *Daily Tasks:*
🔵 Dipstick: ${plan.dipstick_frequency || 'Daily'} at ${plan.dipstick_time || '07:30'}
💉 BP: ${plan.bp_frequency || 'Daily'} at ${(plan.bp_times || ['07:30']).join(', ')}
⚖ Weight: ${plan.weight_frequency || 'Daily'} at ${plan.weight_time || '07:30'}
${med ? `💊 ${med.drug_name} ${med.dose} — ${med.frequency}\n   ${plan.alternate_day ? 'Alternate days' : 'Every day'}` : ''}

🥗 *Renal Nutrition Plan (PRINT 2026):*
• Doctor Plan Code: ${planCode}
• Sodium Ceiling: < 1,200 mg Na/day (~3g salt / 1/2 tsp)
• Fluid Limit: < 1,200 mL/day (acute relapse watch)
• Tap "Doctor's Plan Code" in KidneyCare app to lock.

🚨 *Call Dr. immediately if:*
• Protein 3+ or 4+ for 3 days in a row
• Swelling in face / feet
• Less urine than usual
• Fever above 38°C

📅 *Next clinic:* ${plan.next_clinic_date ? format(new Date(plan.next_clinic_date), 'dd MMM yyyy') : 'Not scheduled'}

📞 Emergency: ${plan.emergency_contact || 'Contact clinician'}

_Powered by KidneyCare AI · AIIMS Patna Pediatric Nephrology_`;
  };

  const handleShare = () => {
    const text = generateShareText();
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  if (showForm) {
    return (
      <MonitoringPlanForm
        patient={patient}
        plan={plan}
        medications={medications}
        onSaved={() => {
          setShowForm(false);
          queryClient.invalidateQueries(['plan', patient.id]);
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  // Build 7-day grid
  const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

  const calcCompliance = (type) => {
    let done = 0;
    days.forEach(day => {
      if (type === 'dipstick') {
        if (recentDipstick.some(r => isSameDay(new Date(r.created_date), day))) done++;
      } else if (type === 'bp') {
        if (recentMetrics.some(m => m.metric_type === 'BP' && isSameDay(new Date(m.recorded_at || m.created_date), day))) done++;
      } else if (type === 'medication') {
        if (recentMedLogs.some(l => l.taken && isSameDay(new Date(l.scheduled_for), day))) done++;
      }
    });
    return Math.round((done / 7) * 100);
  };

  return (
    <div className="pb-8">
      {/* Panel A: Plan Card */}
      {plan ? (
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div style={{ backgroundColor: '#1a3660' }} className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">{plan.plan_name || 'Monitoring Plan'}</p>
              {plan.ns_phase && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${PHASE_COLORS[plan.ns_phase] || 'bg-white/20 text-white'}`}>
                  {plan.ns_phase.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleShare} className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-white text-xs font-medium flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5" />
                {shareCopied ? 'Copied!' : 'Share'}
              </button>
              <button onClick={() => setShowForm(true)} className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-white text-xs font-medium flex items-center gap-1">
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Schedule rows */}
            {[
              { icon: Droplets, label: 'Dipstick', value: `${plan.dipstick_frequency || '--'} at ${plan.dipstick_time || '07:30'}`, note: plan.dipstick_notes, color: 'text-blue-500' },
              { icon: Activity, label: 'BP', value: `${plan.bp_frequency || '--'} at ${(plan.bp_times || []).join(', ')}`, note: plan.bp_notes, color: 'text-amber-500' },
              { icon: Scale, label: 'Weight', value: `${plan.weight_frequency || '--'} at ${plan.weight_time || '07:30'}`, color: 'text-purple-500' },
            ].map(row => (
              <div key={row.label} className="flex items-start gap-3">
                <row.icon className={`w-4 h-4 ${row.color} mt-0.5 shrink-0`} />
                <div className="flex-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{row.label}</span>
                  <p className="text-sm text-gray-800">{row.value}</p>
                  {row.note && <p className="text-xs text-gray-400 italic">{row.note}</p>}
                </div>
              </div>
            ))}

            {/* Medications */}
            {medications.length > 0 && (
              <div className="flex items-start gap-3">
                <Pill className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Medications</span>
                  {medications.map(m => (
                    <div key={m.id} className="text-sm text-gray-800">
                      {m.drug_name} {m.dose} — {m.frequency}
                      {plan.alternate_day && <span className="text-xs text-orange-500 ml-1">(Alternate days)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Symptoms to watch */}
            {plan.symptoms_to_watch?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Watch for</p>
                <div className="flex flex-wrap gap-1">
                  {plan.symptoms_to_watch.map((s, i) => (
                    <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Next clinic */}
            {plan.next_clinic_date && (
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-indigo-600">📅 Next Clinic</p>
                <p className="text-sm text-indigo-800">{format(new Date(plan.next_clinic_date), 'dd MMM yyyy')}</p>
                <p className="text-xs text-indigo-400">{Math.ceil((new Date(plan.next_clinic_date) - new Date()) / 86400000)} days away</p>
              </div>
            )}

            {/* Hindi instructions expandable */}
            {plan.instructions_hi && (
              <div>
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase"
                >
                  देखभाल निर्देश {showInstructions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showInstructions && (
                  <div className="mt-2 bg-blue-50 rounded-xl p-3">
                    <p className="text-sm text-blue-900">{plan.instructions_hi}</p>
                    {plan.instructions_en && <p className="text-xs text-blue-600 mt-1 italic">{plan.instructions_en}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Renal Nutrition Targets Card */}
            {(() => {
              const ageVal = patient.dob ? Math.max(1, Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 86400000))) : 7;
              const wt = parseFloat(patient.weight_kg) || 21.4;
              const energyLow = Math.round(wt * (ageVal <= 6 ? 67 : ageVal <= 8 ? 60 : 55));
              const energyHigh = Math.round(wt * (ageVal <= 6 ? 93 : ageVal <= 8 ? 77 : 69));
              const planCode = `KCPLAN-${ageVal}Y-${patient.gender === 'Female' ? 'F' : 'M'}-WT${wt}-EL${energyLow}-EH${energyHigh}-NA1200-FL1200`;

              return (
                <div className="mt-3 p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                      Renal Nutrition Plan (PRINT 2026)
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[9px] font-bold">
                      &lt; 1,200 mg Na
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                      <span className="text-[9px] text-gray-400 block font-bold">ENERGY</span>
                      <span className="font-bold text-emerald-800">{energyLow}–{energyHigh}</span>
                      <span className="text-[9px] text-gray-400"> kcal</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                      <span className="text-[9px] text-gray-400 block font-bold">PROTEIN</span>
                      <span className="font-bold text-gray-800">{Math.round(wt * 0.9)}–{Math.round(wt * 0.95)}g</span>
                      <span className="text-[9px] text-gray-400"> safe tier</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                      <span className="text-[9px] text-gray-400 block font-bold">FLUID</span>
                      <span className="font-bold text-blue-700">&lt; 1,200</span>
                      <span className="text-[9px] text-gray-400"> mL</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-[10px] text-emerald-700 font-bold truncate max-w-[170px]">
                      {planCode}
                    </span>
                    <Link
                      to="/NutritionHub"
                      className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                    >
                      <span>Open Hub</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-gray-400 mb-4">No monitoring plan yet</p>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Create Plan
          </Button>
        </div>
      )}

      {/* Panel B: 7-Day Compliance */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">7-Day Compliance</p>
        <div className="grid grid-cols-7 gap-1 mb-3">
          {days.map((day, di) => {
            const hasDip = recentDipstick.some(r => isSameDay(new Date(r.created_date), day));
            const hasBP = recentMetrics.some(m => m.metric_type === 'BP' && isSameDay(new Date(m.recorded_at || m.created_date), day));
            const hasWt = recentMetrics.some(m => m.metric_type === 'Weight' && isSameDay(new Date(m.recorded_at || m.created_date), day));
            const hasMed = recentMedLogs.some(l => l.taken && isSameDay(new Date(l.scheduled_for), day));
            return (
              <div key={di} className={`rounded-lg p-1.5 text-center ${isToday(day) ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'}`}>
                <p className="text-[10px] text-gray-400 font-medium">{format(day, 'EEE')}</p>
                <p className="text-[10px] text-gray-500 mb-1">{format(day, 'd')}</p>
                <div className="flex flex-col items-center gap-0.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${hasDip ? 'bg-blue-500' : 'border border-gray-300'}`} title="Dipstick" />
                  <div className={`w-2.5 h-2.5 rounded-full ${hasBP ? 'bg-amber-400' : 'border border-gray-300'}`} title="BP" />
                  <div className={`w-2.5 h-2.5 rounded-full ${hasWt ? 'bg-purple-500' : 'border border-gray-300'}`} title="Weight" />
                  <div className={`w-2.5 h-2.5 rounded-full ${hasMed ? 'bg-green-500' : 'border border-gray-300'}`} title="Medication" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: '🔵 Dipstick', pct: calcCompliance('dipstick') },
            { label: '🟡 BP', pct: calcCompliance('bp') },
            { label: '🟣 Weight', pct: recentMetrics.filter(m => m.metric_type === 'Weight').length > 0 ? Math.round(recentMetrics.filter(m => m.metric_type === 'Weight').length / 7 * 100) : 0 },
            { label: '🟢 Medication', pct: calcCompliance('medication') },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1.5">
              <span className="text-gray-600">{item.label}</span>
              <span className={`font-bold ${item.pct >= 80 ? 'text-green-600' : item.pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {item.pct}%
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Dipstick</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> BP</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Weight</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Med</span>
        </div>
      </div>
    </div>
  );
}