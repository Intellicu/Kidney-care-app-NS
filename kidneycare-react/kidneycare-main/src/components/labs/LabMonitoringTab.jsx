import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';
import DrugCard from './DrugCard';
import LabResultEntry from './LabResultEntry';

export default function LabMonitoringTab({ patientId }) {
  const [showEntry, setShowEntry] = useState(false);
  const [entryMed, setEntryMed] = useState(null);
  const [entrySchedule, setEntrySchedule] = useState(null);

  const { data: medications = [], isLoading: medsLoading } = useQuery({
    queryKey: ['labMeds', patientId],
    queryFn: () => base44.entities.Medication.filter({ patient_id: patientId, active: true }),
    enabled: !!patientId
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['drugTemplates'],
    queryFn: () => base44.entities.DrugMonitoringTemplate.list()
  });

  const { data: schedules = [], isLoading: schedLoading } = useQuery({
    queryKey: ['labSchedules', patientId],
    queryFn: () => base44.entities.LabTestSchedule.filter({ patient_id: patientId }, 'due_date', 100),
    enabled: !!patientId
  });

  const { data: labResults = [] } = useQuery({
    queryKey: ['labResults', patientId],
    queryFn: () => base44.entities.LabResult.filter({ patient_id: patientId }, '-result_date', 50),
    enabled: !!patientId
  });

  const getTemplate = (drugName) => templates.find(t => t.drug_name?.toLowerCase() === drugName?.toLowerCase());
  const getSchedules = (drugName) => schedules.filter(s => s.drug_name === drugName);
  const getLastResults = (drugName) => labResults.filter(r => r.drug_name === drugName).slice(0, 3);

  const handleEnterResult = (schedule, medication) => {
    setEntryMed(medication);
    setEntrySchedule(schedule);
    setShowEntry(true);
  };

  const handleViewSchedule = (medication) => {
    // Could open a schedule modal; for now just open entry
    setEntryMed(medication);
    setEntrySchedule(null);
    setShowEntry(true);
  };

  if (medsLoading || schedLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const activeMedsWithTemplates = medications.filter(m => getTemplate(m.drug_name));
  const activeMedsNoTemplate = medications.filter(m => !getTemplate(m.drug_name));

  return (
    <div className="px-4 pt-4 pb-8">
      {/* AIIMS Header */}
      <div style={{ backgroundColor: '#1a3660' }} className="rounded-xl p-3 mb-4">
        <p className="text-white font-bold text-sm">Labs / दवा जाँच</p>
        <p className="text-white/60 text-[11px]">Drug Monitoring Schedules · IPNA 2023 / ISPN India</p>
      </div>

      {medications.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No active medications found for this patient.</p>
        </div>
      )}

      {/* Drugs with templates */}
      {activeMedsWithTemplates.map(med => (
        <DrugCard
          key={med.id}
          medication={med}
          template={getTemplate(med.drug_name)}
          schedules={getSchedules(med.drug_name)}
          lastResults={getLastResults(med.drug_name)}
          onEnterResult={handleEnterResult}
          onViewSchedule={handleViewSchedule}
        />
      ))}

      {/* Drugs without templates */}
      {activeMedsNoTemplate.map(med => (
        <DrugCard
          key={med.id}
          medication={med}
          template={null}
          schedules={[]}
          lastResults={getLastResults(med.drug_name)}
          onEnterResult={handleEnterResult}
          onViewSchedule={handleViewSchedule}
        />
      ))}

      {/* Entry dialog */}
      <Dialog open={showEntry} onOpenChange={setShowEntry}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lab Result — {entryMed?.drug_name}</DialogTitle>
          </DialogHeader>
          {entryMed && (
            <LabResultEntry
              patientId={patientId}
              medication={entryMed}
              schedule={entrySchedule}
              template={getTemplate(entryMed.drug_name)}
              onClose={() => setShowEntry(false)}
              onSaved={() => setShowEntry(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}