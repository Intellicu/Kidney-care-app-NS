import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const NS_PHASE_PRESETS = {
  Active_Relapse: { dipstick_frequency: 'Twice_Daily', bp_frequency: 'Twice_Daily', weight_frequency: 'Daily', symptom_log_frequency: 'Daily' },
  Remission: { dipstick_frequency: 'Daily', bp_frequency: 'Once_Daily', weight_frequency: 'Every_Other_Day', symptom_log_frequency: 'Daily' },
  Weaning: { dipstick_frequency: 'Daily', bp_frequency: 'Twice_Daily', weight_frequency: 'Daily', symptom_log_frequency: 'Daily' },
  Post_Relapse: { dipstick_frequency: 'Daily', bp_frequency: 'Once_Daily', weight_frequency: 'Daily', symptom_log_frequency: 'Daily' },
  Newly_Diagnosed: { dipstick_frequency: 'Daily', bp_frequency: 'Once_Daily', weight_frequency: 'Daily', symptom_log_frequency: 'Daily' },
};

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-none overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </Card>
  );
}

function FieldRow({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function PlanEditor({ plan, patient, medications, alertRules, onSave, onCancel }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [form, setForm] = useState({
    plan_name: plan?.plan_name || `${patient?.ns_classification || 'NS'} Monitoring Plan`,
    ns_phase: plan?.ns_phase || 'Remission',
    start_date: plan?.start_date || today,
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
    prednisolone_dose_mg: plan?.prednisolone_dose_mg || patient?.current_prednisolone_dose_mg || '',
    alternate_day: plan?.alternate_day || patient?.alternate_day_steroid || false,
    dose_schedule_note: plan?.dose_schedule_note || 'Give after breakfast with milk',
    symptom_log_frequency: plan?.symptom_log_frequency || 'Daily',
    symptoms_to_watch: plan?.symptoms_to_watch || ['सूजन', 'बुखार', 'कम पेशाब', 'सिरदर्द'],
    active_rule_ids: plan?.active_rule_ids || alertRules.map(r => r.id),
    next_clinic_date: plan?.next_clinic_date || '',
    follow_up_interval_weeks: plan?.follow_up_interval_weeks || 4,
    follow_up_notes: plan?.follow_up_notes || '',
    instructions_hi: plan?.instructions_hi || '',
    instructions_en: plan?.instructions_en || '',
    emergency_contact: plan?.emergency_contact || 'Dr. Swarnim — AIIMS Patna Pediatric Nephrology',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handlePhaseChange = (phase) => {
    const preset = NS_PHASE_PRESETS[phase] || {};
    setForm(prev => ({ ...prev, ns_phase: phase, ...preset }));
  };

  const toggleMed = (medId) => {
    set('medication_ids', form.medication_ids.includes(medId)
      ? form.medication_ids.filter(id => id !== medId)
      : [...form.medication_ids, medId]);
  };

  const toggleRule = (ruleId) => {
    set('active_rule_ids', form.active_rule_ids.includes(ruleId)
      ? form.active_rule_ids.filter(id => id !== ruleId)
      : [...form.active_rule_ids, ruleId]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      let savedPlan;
      if (plan?.id) {
        await base44.entities.MonitoringPlan.update(plan.id, { ...form, clinician_id: user.id });
        savedPlan = { ...plan, ...form, id: plan.id };
      } else {
        savedPlan = await base44.entities.MonitoringPlan.create({
          ...form,
          patient_id: patient.id,
          clinician_id: user.id,
          is_active: true,
        });
      }

      // Sync prednisolone dose back to patient
      if (form.prednisolone_dose_mg) {
        await base44.entities.Patient.update(patient.id, {
          current_prednisolone_dose_mg: parseFloat(form.prednisolone_dose_mg),
          alternate_day_steroid: form.alternate_day,
        });
      }

      // Regenerate reminders
      await base44.functions.invoke('generateReminders', {
        patient_id: patient.id,
        plan_id: savedPlan.id
      });

      return savedPlan;
    },
    onSuccess: (savedPlan) => {
      queryClient.invalidateQueries(['monitoringPlan']);
      queryClient.invalidateQueries(['patient']);
      onSave(savedPlan);
    }
  });

  const bpTimesStr = form.bp_times.join(', ');

  return (
    <div className="space-y-3 pb-24">
      <Section title="1. NS Phase & Plan Name" defaultOpen>
        <FieldRow label="Plan Name">
          <Input value={form.plan_name} onChange={e => set('plan_name', e.target.value)} className="h-9 rounded-lg" />
        </FieldRow>
        <FieldRow label="NS Phase">
          <Select value={form.ns_phase} onValueChange={handlePhaseChange}>
            <SelectTrigger className="h-9 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Active_Relapse', 'Remission', 'Weaning', 'Post_Relapse', 'Newly_Diagnosed'].map(p => (
                <SelectItem key={p} value={p}>{p.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
        <div className="grid grid-cols-2 gap-2">
          <FieldRow label="Start Date">
            <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="h-9 rounded-lg" />
          </FieldRow>
          <FieldRow label="Review Date">
            <Input type="date" value={form.review_date} onChange={e => set('review_date', e.target.value)} className="h-9 rounded-lg" />
          </FieldRow>
        </div>
      </Section>

      <Section title="2. Dipstick Schedule">
        <FieldRow label="Frequency">
          <Select value={form.dipstick_frequency} onValueChange={v => set('dipstick_frequency', v)}>
            <SelectTrigger className="h-9 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Daily', 'Twice_Daily', 'Every_Other_Day', 'Weekly', 'As_Needed'].map(f => (
                <SelectItem key={f} value={f}>{f.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Time (HH:MM)">
          <Input type="time" value={form.dipstick_time} onChange={e => set('dipstick_time', e.target.value)} className="h-9 rounded-lg" />
        </FieldRow>
        <FieldRow label="Notes">
          <Input value={form.dipstick_notes} onChange={e => set('dipstick_notes', e.target.value)} placeholder="e.g. First morning urine only" className="h-9 rounded-lg" />
        </FieldRow>
      </Section>

      <Section title="3. BP & Weight Schedule">
        <FieldRow label="BP Frequency">
          <Select value={form.bp_frequency} onValueChange={v => set('bp_frequency', v)}>
            <SelectTrigger className="h-9 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Twice_Daily', 'Once_Daily', 'Every_Other_Day', 'Weekly', 'Not_Required'].map(f => (
                <SelectItem key={f} value={f}>{f.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="BP Times (comma-separated, HH:MM)">
          <Input
            value={bpTimesStr}
            onChange={e => set('bp_times', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="07:30, 19:30"
            className="h-9 rounded-lg"
          />
        </FieldRow>
        <FieldRow label="Weight Frequency">
          <Select value={form.weight_frequency} onValueChange={v => set('weight_frequency', v)}>
            <SelectTrigger className="h-9 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Daily', 'Every_Other_Day', 'Twice_Weekly', 'Weekly', 'Not_Required'].map(f => (
                <SelectItem key={f} value={f}>{f.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Weight Time">
          <Input type="time" value={form.weight_time} onChange={e => set('weight_time', e.target.value)} className="h-9 rounded-lg" />
        </FieldRow>
      </Section>

      <Section title="4. Medications">
        <FieldRow label="Prednisolone Dose (mg)">
          <Input
            type="number"
            value={form.prednisolone_dose_mg}
            onChange={e => set('prednisolone_dose_mg', e.target.value)}
            placeholder="e.g. 20"
            className="h-9 rounded-lg"
          />
        </FieldRow>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="alt_day"
            checked={form.alternate_day}
            onChange={e => set('alternate_day', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="alt_day" className="text-sm text-gray-700">Alternate day dosing</label>
        </div>
        <FieldRow label="Dose note">
          <Input value={form.dose_schedule_note} onChange={e => set('dose_schedule_note', e.target.value)} className="h-9 rounded-lg" placeholder="e.g. Give after breakfast with milk" />
        </FieldRow>
        <p className="text-xs font-medium text-gray-600">Active medications included in plan:</p>
        {medications.map(med => (
          <div key={med.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
            <input
              type="checkbox"
              checked={form.medication_ids.includes(med.id)}
              onChange={() => toggleMed(med.id)}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">{med.drug_name}</span>
              <span className="text-xs text-gray-500 ml-2">{med.dose} · {med.frequency}</span>
            </div>
          </div>
        ))}
      </Section>

      <Section title="5. Alert Rules">
        <p className="text-xs text-gray-500 mb-2">All rules enabled by default. Toggle to disable per patient.</p>
        {alertRules.map(rule => (
          <div key={rule.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{rule.rule_name}</p>
              <p className="text-xs text-gray-400">{rule.evaluation_trigger} · {rule.severity}</p>
            </div>
            <button
              onClick={() => toggleRule(rule.id)}
              className={`ml-2 w-10 h-5 rounded-full transition-colors ${
                form.active_rule_ids.includes(rule.id) ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${
                form.active_rule_ids.includes(rule.id) ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        ))}
      </Section>

      <Section title="6. Clinic & Instructions">
        <div className="grid grid-cols-2 gap-2">
          <FieldRow label="Next Clinic Date">
            <Input type="date" value={form.next_clinic_date} onChange={e => set('next_clinic_date', e.target.value)} className="h-9 rounded-lg" />
          </FieldRow>
          <FieldRow label="Follow-up Interval (weeks)">
            <Input type="number" value={form.follow_up_interval_weeks} onChange={e => set('follow_up_interval_weeks', e.target.value)} className="h-9 rounded-lg" />
          </FieldRow>
        </div>
        <FieldRow label="Emergency Contact">
          <Input value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} className="h-9 rounded-lg" />
        </FieldRow>
        <FieldRow label="Instructions (Hindi)">
          <Textarea value={form.instructions_hi} onChange={e => set('instructions_hi', e.target.value)} className="rounded-lg min-h-20 text-sm" />
        </FieldRow>
        <FieldRow label="Instructions (English)">
          <Textarea value={form.instructions_en} onChange={e => set('instructions_en', e.target.value)} className="rounded-lg min-h-20 text-sm" />
        </FieldRow>
      </Section>

      <div className="flex gap-3 px-0">
        <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl h-11">Cancel</Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex-1 rounded-xl h-11 bg-blue-500 hover:bg-blue-600"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Plan
        </Button>
      </div>
    </div>
  );
}