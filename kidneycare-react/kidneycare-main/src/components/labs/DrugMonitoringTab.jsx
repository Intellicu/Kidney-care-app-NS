import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { Loader2, AlertTriangle, ChevronDown, ChevronUp, FlaskConical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EnterLabResultModal from './EnterLabResultModal';
import LabScheduleView from './LabScheduleView';

export default function DrugMonitoringTab({ patient, medications }) {
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [enterResult, setEnterResult] = useState(null);
  const [viewSchedule, setViewSchedule] = useState(null);
  const [expandedStops, setExpandedStops] = useState({});
  const today = new Date();

  const { data: templates = [], isLoading: tmplLoading } = useQuery({
    queryKey: ['drugTemplates'],
    queryFn: () => base44.entities.DrugMonitoringTemplate.filter({ is_active: true })
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['labSchedules', patient.id],
    queryFn: () => base44.entities.LabTestSchedule.filter({ patient_id: patient.id })
  });

  const { data: labResults = [] } = useQuery({
    queryKey: ['labResults', patient.id],
    queryFn: () => base44.entities.LabResult.filter({ patient_id: patient.id }, '-result_date', 50)
  });

  if (tmplLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  const getTemplate = (drugName) => templates.find(t => t.drug_name === drugName);

  const getScheduleStatus = (drugName, testName) => {
    const sch = schedules.find(s => s.drug_name === drugName && s.test_name === testName);
    if (!sch) return null;
    const daysDiff = differenceInDays(new Date(sch.due_date), today);
    return { ...sch, daysDiff };
  };

  const getLastResult = (drugName, testName) => {
    return labResults.find(r => r.drug_name === drugName && r.test_name === testName);
  };

  const hasCyclophosphamide = medications.some(m => m.drug_name === 'Cyclophosphamide');
  const hasRituximab = medications.some(m => m.drug_name === 'Rituximab');

  const cycLogs = labResults.filter(r => r.drug_name === 'Cyclophosphamide');
  const cycCumDose = cycLogs.reduce((sum, r) => sum + (r.result_numeric || 0), 0);

  if (viewSchedule) {
    return (
      <LabScheduleView
        patient={patient}
        drugName={viewSchedule}
        schedules={schedules.filter(s => s.drug_name === viewSchedule)}
        onBack={() => setViewSchedule(null)}
        onEnterResult={(item) => { setViewSchedule(null); setEnterResult(item); }}
      />
    );
  }

  if (enterResult !== null) {
    return (
      <EnterLabResultModal
        patient={patient}
        prefill={enterResult}
        templates={templates}
        onClose={() => setEnterResult(null)}
      />
    );
  }

  return (
    <div className="pb-8">
      {/* Special warning banners */}
      {hasCyclophosphamide && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">⚠ CYCLOPHOSPHAMIDE PATIENT</p>
              <p className="text-xs text-amber-700 mt-0.5">Weekly CBC mandatory. Cumulative dose tracker below.</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-amber-700 mb-1">
              <span>Cumulative dose</span>
              <span className="font-bold">{cycCumDose} mg / 168 mg/kg limit</span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2">
              <div className="bg-amber-600 rounded-full h-2" style={{ width: `${Math.min((cycCumDose / 168) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {hasRituximab && (
        <div className="mx-4 mt-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
          <p className="font-semibold text-purple-800 text-sm">💉 RITUXIMAB — Post-infusion monitoring</p>
          <p className="text-xs text-purple-600 mt-1">NO LIVE VACCINES until CD19 reconstituted + 6 months</p>
        </div>
      )}

      {/* Drug cards */}
      {medications.length === 0 && (
        <div className="mx-4 mt-8 text-center text-gray-400 py-8">No active medications found.</div>
      )}

      {medications.map(med => {
        const tmpl = getTemplate(med.drug_name);
        const tests = tmpl?.blood_test_schedule || [];

        return (
          <div key={med.id} className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Drug header */}
            <div className="bg-indigo-600 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">💊 {med.drug_name} {med.dose}</p>
                  <p className="text-white/60 text-xs">{tmpl?.drug_class || 'Drug'}</p>
                </div>
                {tmpl && <Badge className="bg-white/20 text-white text-xs">Template ✓</Badge>}
              </div>
            </div>

            <div className="p-4">
              {/* Next tests due */}
              {tests.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Next Tests Due</p>
                  {tests.slice(0, 4).map((test, ti) => {
                    const sch = getScheduleStatus(med.drug_name, test.test_name);
                    const lastRes = getLastResult(med.drug_name, test.test_name);
                    const daysDiff = sch?.daysDiff;
                    let statusColor = 'text-green-600 bg-green-50';
                    let statusText = sch ? `Due in ${daysDiff} days` : 'Not scheduled';
                    if (daysDiff !== undefined) {
                      if (daysDiff < 0) { statusColor = 'text-red-600 bg-red-50'; statusText = `OVERDUE ${Math.abs(daysDiff)} days`; }
                      else if (daysDiff <= 3) { statusColor = 'text-amber-600 bg-amber-50'; statusText = `Due in ${daysDiff} days`; }
                    }
                    return (
                      <div key={ti} className={`flex items-center justify-between px-3 py-2 rounded-lg mb-1 ${statusColor}`}>
                        <div>
                          <span className="text-xs font-medium">{test.test_name}</span>
                          {lastRes && <span className="text-xs ml-2 opacity-70">Last: {lastRes.result_value} {lastRes.result_unit}</span>}
                        </div>
                        <span className="text-xs font-bold">{statusText}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-lg text-xs h-8"
                  onClick={() => setViewSchedule(med.drug_name)}
                >
                  View Schedule
                </Button>
                <Button
                  size="sm"
                  className="flex-1 rounded-lg text-xs h-8 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setEnterResult({ drug_name: med.drug_name, template: tmpl })}
                >
                  <Plus className="w-3 h-3 mr-1" /> Enter Result
                </Button>
              </div>

              {/* Emergency stop criteria */}
              {tmpl?.emergency_stop_criteria?.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setExpandedStops(p => ({ ...p, [med.id]: !p[med.id] }))}
                    className="flex items-center gap-1 text-xs text-red-600 font-semibold"
                  >
                    🛑 When to STOP immediately
                    {expandedStops[med.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {expandedStops[med.id] && (
                    <div className="mt-2 border border-red-200 rounded-xl p-3 bg-red-50">
                      <p className="text-xs text-red-600 mb-2 font-medium">Contact Dr. Swarnim immediately if any of these occur:</p>
                      <ul className="space-y-1">
                        {tmpl.emergency_stop_criteria.map((c, ci) => (
                          <li key={ci} className="text-xs text-red-700 flex items-start gap-1">
                            <span className="text-red-400 mt-0.5">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Quick add result button */}
      <div className="mx-4 mt-4">
        <Button
          variant="outline"
          className="w-full rounded-xl h-12 border-dashed"
          onClick={() => setEnterResult({})}
        >
          <Plus className="w-4 h-4 mr-2" /> Enter Lab Result
        </Button>
      </div>
    </div>
  );
}