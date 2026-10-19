import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TaskEntryModal({ task, patient, onClose }) {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  const saveBP = async () => {
    if (!systolic || !diastolic) return;
    setSaving(true);
    await base44.entities.HealthMetric.create({
      patient_id: patient.id,
      metric_type: 'BP',
      value: systolic,
      value_secondary: diastolic,
      unit: 'mmHg',
      recorded_at: now
    });
    await base44.functions.invoke('evaluateAlertRules', { patient_id: patient.id, trigger: 'HealthMetric' });
    setSaving(false);
    setDone(true);
    setTimeout(onClose, 1500);
  };

  const saveWeight = async () => {
    if (!weight) return;
    setSaving(true);
    await base44.entities.HealthMetric.create({
      patient_id: patient.id,
      metric_type: 'Weight',
      value: weight,
      unit: 'kg',
      recorded_at: now
    });
    await base44.functions.invoke('evaluateAlertRules', { patient_id: patient.id, trigger: 'HealthMetric' });
    setSaving(false);
    setDone(true);
    setTimeout(onClose, 1500);
  };

  const saveMedication = async (taken) => {
    setSaving(true);
    await base44.entities.MedicationLog.create({
      patient_id: patient.id,
      medication_id: task.medication.id,
      taken,
      taken_at: taken ? now : null,
      scheduled_for: today
    });
    await base44.functions.invoke('evaluateAlertRules', { patient_id: patient.id, trigger: 'MedicationLog' });
    setSaving(false);
    setDone(true);
    setTimeout(onClose, 1500);
  };

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
          <p className="font-bold text-gray-900">Saved!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold">{task.label}</h2>
            <p className="text-sm text-gray-400">{task.time}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {task.type === 'bp' && (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">BP नापें / Enter Blood Pressure</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Systolic (ऊपर)</label>
                <Input
                  type="number"
                  value={systolic}
                  onChange={e => setSystolic(e.target.value)}
                  placeholder="e.g. 110"
                  className="text-2xl font-bold h-16 text-center rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Diastolic (नीचे)</label>
                <Input
                  type="number"
                  value={diastolic}
                  onChange={e => setDiastolic(e.target.value)}
                  placeholder="e.g. 70"
                  className="text-2xl font-bold h-16 text-center rounded-xl"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">mmHg</p>
            <Button
              onClick={saveBP}
              disabled={!systolic || !diastolic || saving}
              className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-lg font-semibold"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save BP'}
            </Button>
          </div>
        )}

        {task.type === 'weight' && (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">वज़न लें / Enter Weight</p>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Weight in kg</label>
              <Input
                type="number"
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="e.g. 18.5"
                className="text-3xl font-bold h-20 text-center rounded-xl"
              />
            </div>
            <p className="text-xs text-gray-400 text-center">kilograms (किलोग्राम)</p>
            <Button
              onClick={saveWeight}
              disabled={!weight || saving}
              className="w-full h-14 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-lg font-semibold"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Weight'}
            </Button>
          </div>
        )}

        {task.type === 'medication' && task.medication && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{task.medication.drug_name}</p>
              <p className="text-lg text-gray-600">{task.medication.dose}</p>
              <p className="text-sm text-gray-400">{task.medication.frequency}</p>
              {task.medication.instructions && (
                <p className="text-xs text-blue-600 mt-2">{task.medication.instructions}</p>
              )}
            </div>
            <Button
              onClick={() => saveMedication(true)}
              disabled={saving}
              className="w-full h-16 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xl font-bold"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : '✓ दे दी / Given'}
            </Button>
            <Button
              variant="outline"
              onClick={() => saveMedication(false)}
              disabled={saving}
              className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
            >
              ✗ नहीं दी / Not given
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}