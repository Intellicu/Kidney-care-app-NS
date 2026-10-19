import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const PHASE_DEFAULTS = {
  Active_Relapse: { dipstick_frequency: 'Twice_Daily', bp_frequency: 'Twice_Daily', weight_frequency: 'Daily' },
  Remission: { dipstick_frequency: 'Daily', bp_frequency: 'Once_Daily', weight_frequency: 'Every_Other_Day' },
  Weaning: { dipstick_frequency: 'Daily', bp_frequency: 'Twice_Daily', weight_frequency: 'Daily' },
  Post_Relapse: { dipstick_frequency: 'Daily', bp_frequency: 'Once_Daily', weight_frequency: 'Daily' },
  Newly_Diagnosed: { dipstick_frequency: 'Daily', bp_frequency: 'Twice_Daily', weight_frequency: 'Daily' },
};

const Section = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl mb-3">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="font-semibold text-sm text-gray-800">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
};

const Select = ({ label, value, onChange, options }) => (
  <div>
    {label && <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">{label}</label>}
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">— Select —</option>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
);

export default function MonitoringPlanForm({ patient, plan, medications, onSaved, onCancel }) {
  const [form, setForm] = useState({
    plan_name: plan?.plan_name || `${patient.ns_classification || 'NS'} Monitoring`,
    ns_phase: plan?.ns_phase || '',
    start_date: plan?.start_date || new Date().toISOString().split('T')[0],
    review_date: plan?.review_date || '',
    dipstick_frequency: plan?.dipstick_frequency || 'Daily',
    dipstick_time: plan?.dipstick_time || '07:30',
    dipstick_notes: plan?.dipstick_notes || '',
    bp_frequency: plan?.bp_frequency || 'Once_Daily',
    bp_times: plan?.bp_times || ['07:30'],
    bp_notes: plan?.bp_notes || '',
    weight_frequency: plan?.weight_frequency || 'Every_Other_Day',
    weight_time: plan?.weight_time || '07:30',
    medication_ids: plan?.medication_ids || medications.map(m => m.id),
    prednisolone_dose_mg: plan?.prednisolone_dose_mg || patient.current_prednisolone_dose_mg || '',
    alternate_day: plan?.alternate_day ?? (patient.alternate_day_steroid || false),
    dose_schedule_note: plan?.dose_schedule_note || '',
    symptom_log_frequency: plan?.symptom_log_frequency || 'Daily',
    symptoms_to_watch: plan?.symptoms_to_watch || ['सूजन', 'बुखार', 'कम पेशाब', 'सिरदर्द'],
    next_clinic_date: plan?.next_clinic_date || '',
    follow_up_interval_weeks: plan?.follow_up_interval_weeks || 4,
    follow_up_notes: plan?.follow_up_notes || '',
    instructions_hi: plan?.instructions_hi || '',
    instructions_en: plan?.instructions_en || '',
    emergency_contact: plan?.emergency_contact || 'Dr. Swarnim — AIIMS Patna Pediatric Nephrology',
  });

  const { data: allRules = [] } = useQuery({
    queryKey: ['alertRules'],
    queryFn: () => base44.entities.AlertRule.list()
  });

  const [activeRuleIds, setActiveRuleIds] = useState(
    plan?.active_rule_ids || []
  );

  // Init active rule IDs if not set
  React.useEffect(() => {
    if (allRules.length > 0 && activeRuleIds.length === 0) {
      setActiveRuleIds(allRules.map(r => r.id));
    }
  }, [allRules]);

  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }));

  const handlePhaseChange = (phase) => {
    const defaults = PHASE_DEFAULTS[phase] || {};
    setForm(f => ({ ...f, ns_phase: phase, ...defaults }));
  };

  const saving = false;
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      const payload = {
        ...form,
        patient_id: patient.id,
        clinician_id: user.id,
        is_active: true,
        active_rule_ids: activeRuleIds
      };

      let savedPlan;
      if (plan?.id) {
        savedPlan = await base44.entities.MonitoringPlan.update(plan.id, payload);
      } else {
        savedPlan = await base44.entities.MonitoringPlan.create(payload);
      }

      // Sync patient dose
      if (form.prednisolone_dose_mg) {
        await base44.entities.Patient.update(patient.id, {
          current_prednisolone_dose_mg: parseFloat(form.prednisolone_dose_mg),
          alternate_day_steroid: form.alternate_day
        });
      }

      // Regenerate reminders
      await base44.functions.invoke('generateReminders', {
        patient_id: patient.id,
        plan_id: savedPlan.id || plan?.id
      });

      onSaved();
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
  };

  const toggleRule = (ruleId) => {
    setActiveRuleIds(prev =>
      prev.includes(ruleId) ? prev.filter(id => id !== ruleId) : [...prev, ruleId]
    );
  };

  const severityBadge = { low: 'bg-blue-100 text-blue-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };

  return (
    <div className="px-4 pb-24 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">{plan ? 'Edit Plan' : 'New Plan'}</h2>
        <Button variant="outline" size="sm" onClick={onCancel} className="rounded-lg">Cancel</Button>
      </div>

      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Plan Name</label>
        <Input value={form.plan_name} onChange={e => set('plan_name')(e.target.value)} className="mb-3 rounded-xl" />
      </div>

      {/* Section 1: NS Phase */}
      <Section title="1. NS Phase" defaultOpen={true}>
        <Select
          label="Phase"
          value={form.ns_phase}
          onChange={handlePhaseChange}
          options={['Active_Relapse', 'Remission', 'Weaning', 'Post_Relapse', 'Newly_Diagnosed'].map(v => ({ value: v, label: v.replace(/_/g, ' ') }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Start Date</label>
            <input type="date" value={form.start_date} onChange={e => set('start_date')(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Review Date</label>
            <input type="date" value={form.review_date} onChange={e => set('review_date')(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </Section>

      {/* Section 2: Dipstick */}
      <Section title="2. Dipstick Schedule">
        <Select label="Frequency" value={form.dipstick_frequency} onChange={set('dipstick_frequency')}
          options={['Daily', 'Twice_Daily', 'Every_Other_Day', 'Weekly', 'As_Needed'].map(v => ({ value: v, label: v.replace(/_/g, ' ') }))} />
        <div>
          <label className="text-xs text-gray-500 block mb-1">Time</label>
          <input type="time" value={form.dipstick_time} onChange={e => set('dipstick_time')(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Notes</label>
          <input value={form.dipstick_notes} onChange={e => set('dipstick_notes')(e.target.value)} placeholder="e.g. First morning urine only" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </Section>

      {/* Section 3: BP & Weight */}
      <Section title="3. BP & Weight Schedule">
        <Select label="BP Frequency" value={form.bp_frequency} onChange={set('bp_frequency')}
          options={['Twice_Daily', 'Once_Daily', 'Every_Other_Day', 'Weekly', 'Not_Required'].map(v => ({ value: v, label: v.replace(/_/g, ' ') }))} />
        <div>
          <label className="text-xs text-gray-500 block mb-1">BP Time(s) — comma separated</label>
          <input value={form.bp_times.join(', ')} onChange={e => set('bp_times')(e.target.value.split(',').map(s => s.trim()))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <Select label="Weight Frequency" value={form.weight_frequency} onChange={set('weight_frequency')}
          options={['Daily', 'Every_Other_Day', 'Twice_Weekly', 'Weekly', 'Not_Required'].map(v => ({ value: v, label: v.replace(/_/g, ' ') }))} />
        <div>
          <label className="text-xs text-gray-500 block mb-1">Weight Time</label>
          <input type="time" value={form.weight_time} onChange={e => set('weight_time')(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </Section>

      {/* Section 4: Medications */}
      <Section title="4. Medications">
        {medications.length === 0 && <p className="text-sm text-gray-400">No active medications</p>}
        {medications.map(med => (
          <div key={med.id} className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">{med.drug_name} {med.dose}</p>
                <p className="text-xs text-gray-400">{med.frequency} • {med.schedule}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Prednisolone dose (mg)</label>
            <Input type="number" value={form.prednisolone_dose_mg} onChange={e => set('prednisolone_dose_mg')(e.target.value)} className="rounded-lg" />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <Switch checked={form.alternate_day} onCheckedChange={set('alternate_day')} />
            <label className="text-sm text-gray-600">Alternate day</label>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Dose note</label>
          <input value={form.dose_schedule_note} onChange={e => set('dose_schedule_note')(e.target.value)} placeholder="e.g. Give after breakfast with milk" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </Section>

      {/* Section 5: Alert Rules */}
      <Section title="5. Alert Rules">
        <p className="text-xs text-gray-400 mb-2">Toggle rules on/off for this patient</p>
        {allRules.map(rule => (
          <div key={rule.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-xs font-semibold text-gray-700 truncate">{rule.rule_name}</p>
              <div className="flex gap-1 mt-0.5">
                <span className="text-[10px] text-gray-400">{rule.evaluation_trigger}</span>
                <span className={`text-[10px] px-1.5 rounded-full ${severityBadge[rule.severity] || 'bg-gray-100 text-gray-600'}`}>{rule.severity}</span>
              </div>
            </div>
            <Switch
              checked={activeRuleIds.includes(rule.id)}
              onCheckedChange={() => toggleRule(rule.id)}
            />
          </div>
        ))}
      </Section>

      {/* Follow-up & Instructions */}
      <Section title="6. Follow-up & Instructions">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Next Clinic Date</label>
            <input type="date" value={form.next_clinic_date} onChange={e => set('next_clinic_date')(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Follow-up (weeks)</label>
            <Input type="number" value={form.follow_up_interval_weeks} onChange={e => set('follow_up_interval_weeks')(e.target.value)} className="rounded-lg" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Hindi Instructions (for caregiver)</label>
          <textarea value={form.instructions_hi} onChange={e => set('instructions_hi')(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="रोज़ सुबह पेशाब की strip करें..." />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">English Instructions</label>
          <textarea value={form.instructions_en} onChange={e => set('instructions_en')(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Emergency Contact</label>
          <Input value={form.emergency_contact} onChange={e => set('emergency_contact')(e.target.value)} className="rounded-lg" />
        </div>
      </Section>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold"
      >
        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Plan & Regenerate Reminders</>}
      </Button>
    </div>
  );
}