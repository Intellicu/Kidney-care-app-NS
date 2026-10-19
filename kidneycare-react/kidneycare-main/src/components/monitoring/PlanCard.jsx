import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droplets, Activity, Weight, Pill, CalendarDays, ChevronDown, ChevronUp, Share2, Edit } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const PHASE_COLORS = {
  Active_Relapse: 'bg-red-100 text-red-700',
  Remission: 'bg-green-100 text-green-700',
  Weaning: 'bg-amber-100 text-amber-700',
  Post_Relapse: 'bg-orange-100 text-orange-700',
  Newly_Diagnosed: 'bg-blue-100 text-blue-700',
};

export default function PlanCard({ plan, patient, medications, onEdit }) {
  const [showInstructions, setShowInstructions] = useState(false);

  if (!plan) {
    return (
      <Card className="p-6 border-none text-center">
        <p className="text-gray-400 mb-4">No monitoring plan assigned yet.</p>
        <Button onClick={onEdit} className="bg-blue-500 hover:bg-blue-600">
          <Edit className="w-4 h-4 mr-2" /> Create Plan
        </Button>
      </Card>
    );
  }

  const activeMeds = medications.filter(m => plan.medication_ids?.includes(m.id));
  const daysToClinic = plan.next_clinic_date
    ? differenceInDays(new Date(plan.next_clinic_date), new Date())
    : null;

  const generateWhatsAppText = () => {
    const lines = [
      `*KidneyCare Monitoring Plan — ${patient?.name || 'Patient'}*`,
      `CR: ${patient?.cr_number || 'N/A'}  |  ${patient?.ns_classification || 'NS'}  |  Age ${patient?.dob ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 86400000)) : '?'} years`,
      ``,
      `📋 *Daily Tasks:*`,
      `🔵 Dipstick: ${plan.dipstick_frequency?.replace(/_/g, ' ')} at ${plan.dipstick_time || '07:30'}`,
      `💉 BP: ${plan.bp_frequency?.replace(/_/g, ' ')} at ${plan.bp_times?.join(', ') || '07:30'}`,
      `⚖ Weight: ${plan.weight_frequency?.replace(/_/g, ' ')} at ${plan.weight_time || '07:30'}`,
      ...activeMeds.map(m => `💊 ${m.drug_name} ${m.dose} — ${m.frequency}${plan.alternate_day ? ' (Alternate days)' : ' (Every day)'}`),
      ``,
      `🚨 *Call Dr. immediately if:*`,
      `• Protein 3+ or 4+ for 3 days in a row`,
      `• Swelling in face / feet`,
      `• Less urine than usual`,
      `• Fever above 38°C`,
      ``,
      plan.next_clinic_date ? `📅 *Next clinic:* ${format(new Date(plan.next_clinic_date), 'dd MMM yyyy')}` : '',
      ``,
      `📞 Emergency: ${plan.emergency_contact || 'Contact your clinician'}`,
      ``,
      `_Powered by KidneyCare AI · AIIMS Patna Pediatric Nephrology_`
    ].filter(Boolean).join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines);
      alert('Plan summary copied to clipboard! Paste in WhatsApp.');
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <Card className="p-4 border-none">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-gray-900">{plan.plan_name || 'Monitoring Plan'}</p>
            {plan.ns_phase && (
              <Badge className={`mt-1 ${PHASE_COLORS[plan.ns_phase] || 'bg-gray-100 text-gray-600'}`}>
                {plan.ns_phase.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={generateWhatsAppText} className="h-8 px-2 rounded-lg">
              <Share2 className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" onClick={onEdit} className="h-8 px-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white">
              <Edit className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>
        </div>

        {/* Schedule grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-blue-700">Dipstick</span>
            </div>
            <p className="text-sm font-medium text-gray-800">{plan.dipstick_frequency?.replace(/_/g, ' ')}</p>
            <p className="text-xs text-gray-500">{plan.dipstick_time || '07:30'}</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-semibold text-purple-700">Blood Pressure</span>
            </div>
            <p className="text-sm font-medium text-gray-800">{plan.bp_frequency?.replace(/_/g, ' ')}</p>
            <p className="text-xs text-gray-500">{plan.bp_times?.join(', ') || '07:30'}</p>
          </div>

          <div className="bg-green-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-500 text-base">⚖</span>
              <span className="text-xs font-semibold text-green-700">Weight</span>
            </div>
            <p className="text-sm font-medium text-gray-800">{plan.weight_frequency?.replace(/_/g, ' ')}</p>
            <p className="text-xs text-gray-500">{plan.weight_time || '07:30'}</p>
          </div>

          {plan.next_clinic_date && (
            <div className="bg-amber-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">Next Clinic</span>
              </div>
              <p className="text-sm font-medium text-gray-800">{format(new Date(plan.next_clinic_date), 'dd MMM')}</p>
              <p className="text-xs text-gray-500">{daysToClinic != null ? `${daysToClinic} days` : ''}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Medications */}
      {activeMeds.length > 0 && (
        <Card className="p-4 border-none">
          <div className="flex items-center gap-2 mb-3">
            <Pill className="w-4 h-4 text-orange-500" />
            <h4 className="font-semibold text-gray-900 text-sm">Active Medications</h4>
          </div>
          <div className="space-y-2">
            {activeMeds.map(med => (
              <div key={med.id} className="flex items-center justify-between bg-orange-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{med.drug_name}</p>
                  <p className="text-xs text-gray-500">{med.dose} · {med.frequency}</p>
                </div>
                {plan.alternate_day && <Badge className="bg-orange-100 text-orange-700 text-xs">Alt day</Badge>}
              </div>
            ))}
          </div>
          {plan.dose_schedule_note && (
            <p className="text-xs text-gray-500 mt-2 italic">{plan.dose_schedule_note}</p>
          )}
        </Card>
      )}

      {/* Symptoms to watch */}
      {plan.symptoms_to_watch?.length > 0 && (
        <Card className="p-4 border-none">
          <h4 className="font-semibold text-gray-900 text-sm mb-2">Watch for symptoms</h4>
          <div className="flex flex-wrap gap-2">
            {plan.symptoms_to_watch.map((sym, i) => (
              <Badge key={i} className="bg-red-50 text-red-700 text-xs">{sym}</Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Hindi Instructions */}
      {plan.instructions_hi && (
        <Card className="p-4 border-none">
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            <span className="font-semibold text-gray-900 text-sm">📋 निर्देश / Instructions</span>
            {showInstructions ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showInstructions && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-700 bg-amber-50 p-3 rounded-lg">{plan.instructions_hi}</p>
              {plan.instructions_en && (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg italic">{plan.instructions_en}</p>
              )}
              {plan.emergency_contact && (
                <p className="text-xs text-red-600 font-medium">🚨 Emergency: {plan.emergency_contact}</p>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}