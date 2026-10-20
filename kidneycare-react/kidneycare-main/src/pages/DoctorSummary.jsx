import React, { useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, isAfter } from 'date-fns';
import { ChevronLeft, Share2, Loader2, Phone, Printer, FileDown, Eye, X, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LanguageProvider, useLanguage } from '../components/shared/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PROTEIN_COLOR = {
  'Negative': 'text-green-600', 'Trace': 'text-yellow-600',
  '1+': 'text-orange-500', '2+': 'text-orange-600',
  '3+': 'text-red-600', '4+': 'text-red-700'
};

const SEV_DOT = { critical: '🔴', high: '🟠', medium: '🟡', low: '⚪' };

function SummaryContent() {
  const { language } = useLanguage();
  const hi = language === 'hi';
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get('id');
  const printRef = useRef(null);

  const { data: patient, isLoading: loadingPt } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      if (patientId) {
        const pts = await base44.entities.Patient.filter({ id: patientId });
        return pts[0];
      }
      const user = await base44.auth.me();
      const pts = await base44.entities.Patient.filter({ created_by: user.email });
      return pts.find(p => p.onboarding_complete) || pts[0];
    }
  });

  const pid = patient?.id;
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();

  const { data: dipstick7 = [] } = useQuery({
    queryKey: ['ds7', pid], enabled: !!pid,
    queryFn: () => base44.entities.DipstickResult.filter({ patient_id: pid }, '-created_date', 10),
    select: d => d.filter(r => isAfter(new Date(r.created_date), new Date(sevenDaysAgo))).slice(0, 7).reverse()
  });

  const { data: metrics7 = [] } = useQuery({
    queryKey: ['m7', pid], enabled: !!pid,
    queryFn: () => base44.entities.HealthMetric.filter({ patient_id: pid }, '-created_date', 30),
    select: d => d.filter(m => isAfter(new Date(m.recorded_at || m.created_date), new Date(sevenDaysAgo)))
  });

  const { data: medLogs7 = [] } = useQuery({
    queryKey: ['ml7', pid], enabled: !!pid,
    queryFn: () => base44.entities.MedicationLog.filter({ patient_id: pid }, '-created_date', 20),
    select: d => d.filter(l => isAfter(new Date(l.scheduled_for || l.created_date), new Date(sevenDaysAgo))).slice(0, 7)
  });

  const { data: activeAlerts = [] } = useQuery({
    queryKey: ['alerts7', pid], enabled: !!pid,
    queryFn: () => base44.entities.Alert.filter({ patient_id: pid, acknowledged: false }, '-created_date', 10)
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['meds', pid], enabled: !!pid,
    queryFn: () => base44.entities.Medication.filter({ patient_id: pid, active: true })
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appts', pid], enabled: !!pid,
    queryFn: () => base44.entities.Appointment.filter({ patient_id: pid, status: 'Scheduled' }, 'appointment_date', 3)
  });

  const weights = metrics7.filter(m => m.metric_type === 'Weight').map(m => parseFloat(m.value)).filter(Boolean);
  const bpEntries = metrics7.filter(m => m.metric_type === 'BP');
  const lastBP = bpEntries[0];
  const nextAppt = appointments[0];

  const calculateAge = (dob) => {
    if (!dob) return '--';
    return new Date().getFullYear() - new Date(dob).getFullYear();
  };

  const handleShare = () => {
    const text = `KidneyCare AIIMS Patna — Patient Summary\n${patient?.name} | ${calculateAge(patient?.dob)}y | ${patient?.ns_classification || ''}\nGenerated: ${format(new Date(), 'dd MMM yyyy HH:mm')}\n\nLast 7 days dipstick: ${dipstick7.map(d => d.protein_level).join(' / ')}\nActive alerts: ${activeAlerts.length}\nNext appointment: ${nextAppt ? format(new Date(nextAppt.appointment_date), 'dd MMM yyyy') : 'None'}\n\nSent via KidneyCare app`;
    if (navigator.share) {
      navigator.share({ title: 'KidneyCare Summary', text });
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard'));
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`KidneyCare AIIMS Patna — Patient Summary\n${patient?.name} | ${calculateAge(patient?.dob)}y | ${patient?.ns_classification || ''}\n\nLast 7 days protein: ${dipstick7.map(d => d.protein_level).join(' / ') || 'No data'}\nActive alerts: ${activeAlerts.length}\nNext visit: ${nextAppt ? format(new Date(nextAppt.appointment_date), 'dd MMM yyyy') : 'Not scheduled'}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loadingPt || !patient) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>;
  }

  const [showDossierModal, setShowDossierModal] = React.useState(false);

  const { data: opdData } = useQuery({
    queryKey: ['opdSummaryData', patient?.cr_number],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/reports/opd-summary-data?cr_number=${encodeURIComponent(patient?.cr_number || 'AIIMS/PED/2026/0412')}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.error('Error fetching opd summary data:', e);
      }
      return null;
    }
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link to={patientId ? `/PatientDetail?id=${patientId}` : '/'}>
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900 text-sm">{hi ? 'Doctor को दिखाएँ' : 'Show to Doctor'}</h1>
          <p className="text-xs text-gray-400">{hi ? 'यह स्क्रीन Doctor को दिखाएँ' : 'Show this screen to your doctor'}</p>
        </div>
        <button 
          onClick={() => window.open(`/api/reports/opd-summary-pdf?cr_number=${encodeURIComponent(patient?.cr_number || 'AIIMS/PED/2026/0412')}`, '_blank')}
          title="Print AIIMS OPD Summary PDF"
          className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
        >
          <Printer className="w-4 h-4 text-blue-700" />
        </button>
        <button onClick={handleShare} className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
          <Share2 className="w-4 h-4 text-blue-600" />
        </button>
      </div>

      <div className="px-4 py-4 max-w-xl mx-auto space-y-3" ref={printRef}>
        {/* 1-Click AIIMS OPD Summary (Print / PDF) Card */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-800 rounded-2xl p-4 text-white shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                <Printer className="w-5 h-5 text-blue-100" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-wide">
                  {hi ? 'एम्स पटना ओपीडी सारांश रिपोर्ट' : 'AIIMS Patna OPD Summary Report'}
                </h3>
                <p className="text-[11px] text-blue-100">
                  {hi ? 'पीडियाट्रिक नेफ्रोलॉजी 1-क्लिक प्रिंटेबल डॉसियर' : 'Official Pediatric Nephrology Clinical Dossier'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              1-Click PDF
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => window.open(`/api/reports/opd-summary-pdf?cr_number=${encodeURIComponent(patient?.cr_number || 'AIIMS/PED/2026/0412')}`, '_blank')}
              className="flex items-center justify-center gap-1.5 bg-white text-blue-900 font-bold rounded-xl py-2.5 px-3 text-xs shadow-md hover:bg-blue-50 active:scale-95 transition-transform"
            >
              <FileDown className="w-4 h-4 text-blue-700" />
              <span>{hi ? 'प्रिंट / सेव PDF' : 'Print / Save PDF'}</span>
            </button>
            <button
              onClick={() => setShowDossierModal(true)}
              className="flex items-center justify-center gap-1.5 bg-blue-600/70 hover:bg-blue-600 border border-blue-300/40 text-white font-semibold rounded-xl py-2.5 px-3 text-xs active:scale-95 transition-transform"
            >
              <Eye className="w-4 h-4 text-blue-100" />
              <span>{hi ? 'डॉसियर देखें' : 'View Full Dossier'}</span>
            </button>
          </div>
        </div>

        {/* Identity card */}
        <div className="bg-indigo-600 rounded-2xl px-4 py-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-indigo-200 font-medium mb-0.5">KidneyCare — AIIMS Patna</p>
              <h2 className="text-lg font-bold">{patient.name}</h2>
              <p className="text-indigo-200 text-sm mt-0.5">
                {calculateAge(patient.dob)}y · {patient.gender} · {patient.ns_classification || 'NS'}
              </p>
              {patient.cr_number && (
                <p className="text-indigo-300 text-xs mt-0.5">CR: {patient.cr_number}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-indigo-300 text-[10px]">Generated</p>
              <p className="text-white text-xs font-medium">{format(new Date(), 'dd MMM yyyy')}</p>
              <p className="text-indigo-200 text-xs">{format(new Date(), 'HH:mm')}</p>
            </div>
          </div>
        </div>

        {/* Last 7 days */}
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{hi ? 'पिछले 7 दिन' : 'Last 7 Days'}</p>

          {/* Protein row */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1.5">🧪 {hi ? 'प्रोटीन (पेशाब)' : 'Protein (urine)'}</p>
            <div className="flex gap-1.5 flex-wrap">
              {dipstick7.length > 0 ? dipstick7.map((d, i) => (
                <span key={i} className={`text-sm font-bold px-2 py-0.5 rounded-lg bg-gray-50 ${PROTEIN_COLOR[d.protein_level] || 'text-gray-600'}`}>
                  {d.protein_level}
                </span>
              )) : <span className="text-xs text-gray-400">No data</span>}
            </div>
          </div>

          {/* Weight row */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">⚖️ {hi ? 'वज़न' : 'Weight'}</p>
            {weights.length >= 2 ? (
              <p className="text-sm font-semibold text-gray-800">
                {weights[0]} → {weights[weights.length - 1]} kg
                <span className={`ml-2 text-xs font-bold ${weights[weights.length-1] - weights[0] > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                  ({weights[weights.length-1] - weights[0] > 0 ? '+' : ''}{(weights[weights.length-1] - weights[0]).toFixed(1)} kg)
                </span>
              </p>
            ) : weights.length === 1 ? (
              <p className="text-sm font-semibold text-gray-800">{weights[0]} kg</p>
            ) : (
              <p className="text-xs text-gray-400">Not recorded</p>
            )}
          </div>

          {/* BP row */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">🩺 {hi ? 'BP (आखिरी)' : 'BP (last)'}</p>
            {lastBP ? (
              <p className="text-sm font-semibold text-gray-800">{lastBP.value}/{lastBP.value_secondary} mmHg</p>
            ) : (
              <p className="text-xs text-gray-400">Not recorded</p>
            )}
          </div>

          {/* Medication row */}
          <div>
            <p className="text-xs text-gray-500 mb-1">💊 {hi ? 'दवा (7 दिन)' : 'Medication (7 days)'}</p>
            <div className="flex gap-1 flex-wrap">
              {medLogs7.length > 0 ? medLogs7.map((l, i) => (
                <span key={i} className={`text-sm ${l.taken ? 'text-green-600' : 'text-red-500'}`}>
                  {l.taken ? '✓' : '✗'}
                </span>
              )) : <span className="text-xs text-gray-400">No data</span>}
              {medLogs7.filter(l => !l.taken).length > 0 && (
                <span className="text-xs text-red-500 ml-1">({medLogs7.filter(l => !l.taken).length} missed)</span>
              )}
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{hi ? 'सक्रिय अलर्ट' : 'Active Alerts'}</p>
            <div className="space-y-1.5">
              {activeAlerts.map(a => (
                <div key={a.id} className="flex items-start gap-2 text-sm">
                  <span>{SEV_DOT[a.severity] || '⚪'}</span>
                  <span className="text-gray-700">{a.message_hi || a.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Medications */}
        {medications.length > 0 && (
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{hi ? 'वर्तमान दवाइयाँ' : 'Current Medications'}</p>
            <div className="space-y-1.5">
              {medications.map(m => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{m.drug_name}</span>
                  <span className="text-gray-500 text-xs">{m.dose} · {m.frequency}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Appointment */}
        {nextAppt && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">{hi ? 'अगली अपॉइंटमेंट' : 'Next Appointment'}</p>
            <p className="text-sm font-bold text-blue-800">
              {nextAppt.appointment_date ? (() => {
                try {
                  const d = new Date(nextAppt.appointment_date);
                  return isNaN(d.getTime()) ? nextAppt.appointment_date : format(d, 'EEEE, dd MMM yyyy');
                } catch {
                  return nextAppt.appointment_date;
                }
              })() : 'Scheduled Visit'}
            </p>
            {nextAppt.appointment_time && <p className="text-xs text-blue-600">{nextAppt.appointment_time} · {nextAppt.type || 'In-Person'}</p>}
            {nextAppt.reason && <p className="text-xs text-blue-500 mt-0.5">{nextAppt.reason}</p>}
          </div>
        )}

        {/* Caregiver instruction */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-center">
          <p className="text-amber-800 text-sm font-semibold">
            {hi ? '📱 यह स्क्रीन Doctor को दिखाएँ' : '📱 Show this screen to your doctor'}
          </p>
          <p className="text-amber-600 text-xs mt-0.5">
            {hi ? 'Doctor के पास जाने पर app खोलें और यह page दिखाएँ' : 'Open the app when you visit and show this page'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pb-6">
          <button
            onClick={() => window.open(`/api/reports/opd-summary-pdf?cr_number=${encodeURIComponent(patient?.cr_number || 'AIIMS/PED/2026/0412')}`, '_blank')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white font-bold rounded-2xl py-3.5 px-4 text-sm shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
          >
            <Printer className="w-4 h-4 text-blue-200" />
            <span>{hi ? '📥 1-क्लिक एम्स ओपीडी सारांश रिपोर्ट (Print / PDF)' : '📥 1-Click AIIMS OPD Summary Report (Print / PDF)'}</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold rounded-2xl py-3 text-sm"
            >
              <Share2 className="w-4 h-4" />
              {hi ? 'Share करें' : 'Share'}
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 bg-green-500 text-white font-semibold rounded-2xl py-3 text-sm"
            >
              <Phone className="w-4 h-4" />
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Full 30-Day Clinical Dossier Modal */}
      <Dialog open={showDossierModal} onOpenChange={setShowDossierModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base font-bold text-gray-900 border-b pb-3">
              <span className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-700" />
                {hi ? 'एम्स पटना बाल गुर्दा क्लिनिकल डॉसियर' : 'AIIMS Patna Pediatric Renal Clinical Dossier'}
              </span>
              <button
                onClick={() => window.open(`/api/reports/opd-summary-pdf?cr_number=${encodeURIComponent(patient?.cr_number || 'AIIMS/PED/2026/0412')}`, '_blank')}
                className="text-xs bg-blue-700 hover:bg-blue-800 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5" />
                {hi ? 'Print / PDF' : 'Print / PDF'}
              </button>
            </DialogTitle>
          </DialogHeader>

          {opdData ? (
            <div className="space-y-4 pt-2 text-xs">
              {/* Patient Banner */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-blue-900 text-sm">{opdData.patient?.patient_name}</h4>
                  <p className="text-gray-600">CR: <strong>{opdData.cr_number}</strong> · Age: {opdData.patient?.age} · {opdData.patient?.gender}</p>
                  <p className="text-blue-800 font-semibold">{opdData.patient?.diagnosis}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-blue-200/80 text-blue-950 font-bold px-2 py-0.5 rounded">
                    BSA: {opdData.bsa_m2} m²
                  </span>
                  <p className="text-[11px] text-gray-500 mt-1">Wt: {opdData.patient?.baseline_weight} kg</p>
                </div>
              </div>

              {/* ISPN Status */}
              <div className={`p-3 rounded-xl border ${opdData.relapse_assessment?.ispn_relapse_met ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span>ISPN Guideline Clinical Impression:</span>
                  <span>Streak: {opdData.relapse_assessment?.ispn_streak_days} days</span>
                </div>
                <p className="text-xs">{opdData.relapse_assessment?.impression}</p>
              </div>

              {/* Steroids */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950">
                <h5 className="font-extrabold text-xs mb-1">Steroid Protocol & Adherence:</h5>
                <p>Prescription: <strong>{opdData.steroid_protocol?.schedule?.current_dose_mg} mg Prednisolone ({opdData.steroid_protocol?.schedule?.frequency})</strong></p>
                <p className="mt-1 font-semibold text-emerald-700">30-Day Confirmed Adherence: {opdData.steroid_protocol?.adherence_percent}%</p>
              </div>

              {/* 30-Day Monitoring Matrix */}
              <div>
                <h5 className="font-extrabold text-gray-800 text-xs mb-2">Recent Monitoring Log Entries ({opdData.daily_logs_30d?.length || 0} entries):</h5>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-2 border-b">Date</th>
                        <th className="p-2 border-b text-center">Protein</th>
                        <th className="p-2 border-b text-center">Edema</th>
                        <th className="p-2 border-b text-center">Weight</th>
                        <th className="p-2 border-b text-center">BP</th>
                        <th className="p-2 border-b">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(opdData.daily_logs_30d || []).slice(0, 14).map((l, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2 font-medium">{l.date}</td>
                          <td className="p-2 text-center font-bold text-blue-700">{l.urine_protein}</td>
                          <td className="p-2 text-center">{l.edema}</td>
                          <td className="p-2 text-center">{l.weight} kg</td>
                          <td className="p-2 text-center">{l.bp_morning_systolic ? `${l.bp_morning_systolic}/${l.bp_morning_diastolic}` : '-'}</td>
                          <td className="p-2 text-gray-500 text-[10px]">{l.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              Loading clinical dossier...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DoctorSummary() {
  return (
    <LanguageProvider>
      <SummaryContent />
    </LanguageProvider>
  );
}