import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Loader2, Printer, FileText, Droplets, Pill, Activity, ChevronLeft, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const PROTEIN_COLORS = {
  'Negative': '#16a34a', 'Trace': '#84cc16',
  '1+': '#f59e0b', '2+': '#f97316', '3+': '#ef4444', '4+': '#991b1b',
};
const PROTEIN_SCORE = { 'Negative': 0, 'Trace': 0.5, '1+': 1, '2+': 2, '3+': 3, '4+': 4 };

export default function MonthlyReport() {
  const reportRef = useRef();
  const [lang, setLang] = useState('en');
  const hi = lang === 'hi';

  const urlParams = new URLSearchParams(window.location.search);
  const patientIdParam = urlParams.get('patient_id');

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['reportPatient', patientIdParam],
    queryFn: async () => {
      if (patientIdParam) {
        const pts = await base44.entities.Patient.filter({ id: patientIdParam });
        return pts[0];
      }
      const user = await base44.auth.me();
      const pts = await base44.entities.Patient.filter({ created_by: user.email });
      return pts[0];
    }
  });

  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  const { data: dipstickResults = [], isLoading: d1 } = useQuery({
    queryKey: ['report-dipstick', patient?.id],
    queryFn: () => base44.entities.DipstickResult.filter({ patient_id: patient.id }, 'created_date', 120),
    enabled: !!patient?.id,
    select: d => d.filter(r => new Date(r.created_date) >= new Date(thirtyDaysAgo))
  });

  const { data: healthMetrics = [], isLoading: d2 } = useQuery({
    queryKey: ['report-metrics', patient?.id],
    queryFn: () => base44.entities.HealthMetric.filter({ patient_id: patient.id }, 'recorded_at', 200),
    enabled: !!patient?.id,
    select: d => d.filter(m => new Date(m.recorded_at || m.created_date) >= new Date(thirtyDaysAgo))
  });

  const { data: medLogs = [], isLoading: d3 } = useQuery({
    queryKey: ['report-medlogs', patient?.id],
    queryFn: () => base44.entities.MedicationLog.filter({ patient_id: patient.id }, 'scheduled_for', 200),
    enabled: !!patient?.id,
    select: d => d.filter(m => m.scheduled_for && new Date(m.scheduled_for) >= new Date(thirtyDaysAgo))
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['report-meds', patient?.id],
    queryFn: () => base44.entities.Medication.filter({ patient_id: patient.id, active: true }),
    enabled: !!patient?.id
  });

  const { data: dailyNotes = [] } = useQuery({
    queryKey: ['report-notes', patient?.id],
    queryFn: () => base44.entities.DailyNote.filter({ patient_id: patient.id }, 'note_date', 60),
    enabled: !!patient?.id,
    select: d => d.filter(n => new Date(n.note_date) >= new Date(thirtyDaysAgo))
  });

  const isLoading = patientLoading || d1 || d2 || d3;

  // Diet metrics
  const sodiumMetrics = healthMetrics.filter(m => m.unit === 'mg sodium');
  const avgSodium = sodiumMetrics.length > 0
    ? Math.round(sodiumMetrics.reduce((s, m) => s + parseFloat(m.value || 0), 0) / sodiumMetrics.length)
    : null;
  const fluidMetrics = healthMetrics.filter(m => m.metric_type === 'Fluid Intake' && m.unit === 'ml');
  const avgFluid = fluidMetrics.length > 0
    ? Math.round(fluidMetrics.reduce((s, m) => s + parseFloat(m.value || 0), 0) / fluidMetrics.length)
    : null;

  // Stats
  const bpMetrics = healthMetrics.filter(m => m.metric_type === 'BP');
  const weightMetrics = healthMetrics.filter(m => m.metric_type === 'Weight');

  const totalDipstick = dipstickResults.length;
  const abnormalDipstick = dipstickResults.filter(r => ['1+','2+','3+','4+'].includes(r.protein_level)).length;
  const takenLogs = medLogs.filter(m => m.taken).length;
  const totalLogs = medLogs.length;
  const medCompliance = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : null;

  const avgBPSys = bpMetrics.length > 0 ? Math.round(bpMetrics.reduce((s, m) => s + parseFloat(m.value || 0), 0) / bpMetrics.length) : null;
  const avgBPDia = bpMetrics.length > 0 ? Math.round(bpMetrics.reduce((s, m) => s + parseFloat(m.value_secondary || 0), 0) / bpMetrics.length) : null;

  const lastWeight = weightMetrics.sort((a, b) => new Date(b.recorded_at || b.created_date) - new Date(a.recorded_at || a.created_date))[0];

  // Calendar grid
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calDays = eachDayOfInterval({ start: subDays(today, 29), end: today });

  const handlePrint = () => window.print();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Controls - hidden when printing */}
      <div className="print:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/DailyLog">
            <Button variant="ghost" size="icon"><ChevronLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <p className="font-bold text-gray-900">{hi ? 'मासिक सारांश रिपोर्ट' : 'Monthly Summary Report'}</p>
            <p className="text-xs text-gray-500">{hi ? 'पिछले 30 दिन' : 'Last 30 Days'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
            className="text-xs border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50"
          >
            {hi ? 'EN' : 'हिं'}
          </button>
          <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4" />
            {hi ? 'प्रिंट / PDF' : 'Print / PDF'}
          </Button>
        </div>
      </div>

      {/* Printable Report */}
      <div ref={reportRef} className="max-w-3xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none my-4 print:my-0">
        {/* Report Header */}
        <div style={{ background: '#1a3660' }} className="px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-blue-200 uppercase tracking-widest mb-1">AIIMS Patna — KidneyCare</p>
              <h1 className="text-xl font-bold">
                {hi ? 'नेफ्रोटिक डायरी — मासिक सारांश' : 'Nephrotic Syndrome Monthly Summary'}
              </h1>
              <p className="text-blue-200 text-sm mt-1">
                {hi ? 'पिछले 30 दिन' : 'Last 30 Days'} · {format(subDays(today, 29), 'dd MMM')} – {format(today, 'dd MMM yyyy')}
              </p>
            </div>
            <div className="text-right text-sm text-blue-200">
              <p>{hi ? 'रिपोर्ट तिथि' : 'Report Date'}: {format(today, 'dd/MM/yyyy')}</p>
              <p className="mt-1 text-xs">{hi ? 'क्लिनिक समीक्षा के लिए' : 'For Clinician Review'}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Patient Info */}
          <section className="border rounded-xl p-4 bg-gray-50">
            <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider border-b pb-2">
              {hi ? 'मरीज़ की जानकारी' : 'Patient Information'}
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">{hi ? 'नाम' : 'Name'}:</span> <span className="font-semibold text-gray-900">{patient?.name || '—'}</span></div>
              <div><span className="text-gray-500">CR No:</span> <span className="font-semibold text-gray-900">{patient?.cr_number || '—'}</span></div>
              <div><span className="text-gray-500">{hi ? 'जन्म तिथि' : 'DOB'}:</span> <span className="text-gray-800">{patient?.dob ? format(new Date(patient.dob), 'dd/MM/yyyy') : '—'}</span></div>
              <div><span className="text-gray-500">{hi ? 'निदान' : 'Diagnosis'}:</span> <span className="text-gray-800">{patient?.diagnosis || patient?.ns_classification || '—'}</span></div>
              <div><span className="text-gray-500">{hi ? 'देखभाल करने वाले' : 'Caregiver'}:</span> <span className="text-gray-800">{patient?.caregiver_name || '—'}</span></div>
              <div><span className="text-gray-500">{hi ? 'फोन' : 'Phone'}:</span> <span className="text-gray-800">{patient?.phone || '—'}</span></div>
            </div>
          </section>

          {/* Summary Stats */}
          <section>
            <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">{hi ? 'मुख्य सारांश' : 'Summary Statistics'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: hi ? 'डिपस्टिक टेस्ट' : 'Dipstick Tests', value: totalDipstick, sub: `${abnormalDipstick} ${hi ? 'असामान्य' : 'abnormal'}`, color: '#2563eb' },
                { label: hi ? 'दवा अनुपालन' : 'Medication Compliance', value: medCompliance !== null ? `${medCompliance}%` : '—', sub: `${takenLogs}/${totalLogs} ${hi ? 'खुराक' : 'doses'}`, color: medCompliance >= 80 ? '#16a34a' : '#ef4444' },
                { label: hi ? 'औसत रक्तचाप' : 'Avg Blood Pressure', value: avgBPSys && avgBPDia ? `${avgBPSys}/${avgBPDia}` : '—', sub: `${bpMetrics.length} ${hi ? 'रीडिंग' : 'readings'}`, color: '#7c3aed' },
                { label: hi ? 'अंतिम वज़न' : 'Last Weight', value: lastWeight ? `${lastWeight.value} kg` : '—', sub: lastWeight ? format(new Date(lastWeight.recorded_at || lastWeight.created_date), 'dd MMM') : '—', color: '#d97706' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl border p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Dipstick Results Table */}
          <section>
            <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              {hi ? 'डिपस्टिक परिणाम (पिछले 30 दिन)' : 'Dipstick Results (Last 30 Days)'}
            </h2>
            {dipstickResults.length === 0 ? (
              <p className="text-gray-400 text-sm italic">{hi ? 'कोई रिकॉर्ड नहीं' : 'No records in this period'}</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-700">{hi ? 'तारीख' : 'Date'}</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-700">{hi ? 'प्रोटीन' : 'Protein'}</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-700">{hi ? 'विधि' : 'Method'}</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-700">{hi ? 'समीक्षा' : 'Reviewed'}</th>
                  </tr>
                </thead>
                <tbody>
                  {dipstickResults.slice().reverse().map((r, i) => (
                    <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-200 px-3 py-2 text-gray-800">{format(new Date(r.created_date), 'dd/MM/yyyy')}</td>
                      <td className="border border-gray-200 px-3 py-2">
                        <span className="font-bold px-2 py-0.5 rounded text-white text-xs" style={{ background: PROTEIN_COLORS[r.protein_level] || '#6b7280' }}>
                          {r.protein_level}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-600">
                        {r.image_after_url ? (hi ? 'फोटो' : 'Photo') : (hi ? 'मैनुअल' : 'Manual')}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-600">
                        {r.clinician_reviewed ? (hi ? 'हाँ ✓' : 'Yes ✓') : (hi ? 'नहीं' : 'No')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* BP Table */}
          {bpMetrics.length > 0 && (
            <section>
              <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                {hi ? 'रक्तचाप रीडिंग' : 'Blood Pressure Readings'}
              </h2>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-700">{hi ? 'तारीख' : 'Date'}</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-700">{hi ? 'सिस्टोलिक' : 'Systolic'}</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-700">{hi ? 'डायस्टोलिक' : 'Diastolic'}</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-gray-700">{hi ? 'स्थिति' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {bpMetrics.slice(-15).reverse().map((m, i) => {
                    const sys = parseFloat(m.value);
                    const dia = parseFloat(m.value_secondary);
                    const high = sys > 130 || dia > 85;
                    return (
                      <tr key={m.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-200 px-3 py-2 text-gray-800">{format(new Date(m.recorded_at || m.created_date), 'dd/MM/yyyy')}</td>
                        <td className="border border-gray-200 px-3 py-2 text-gray-800">{m.value} mmHg</td>
                        <td className="border border-gray-200 px-3 py-2 text-gray-800">{m.value_secondary} mmHg</td>
                        <td className="border border-gray-200 px-3 py-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${high ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {high ? (hi ? 'उच्च' : 'High') : (hi ? 'सामान्य' : 'Normal')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}

          {/* Medication Adherence */}
          <section>
            <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
              <Pill className="w-4 h-4 text-green-600" />
              {hi ? 'दवा अनुपालन' : 'Medication Adherence'}
            </h2>
            {medications.length === 0 ? (
              <p className="text-gray-400 text-sm italic">{hi ? 'कोई दवा नहीं' : 'No medications on record'}</p>
            ) : (
              <div className="space-y-3">
                {medications.map(med => {
                  const medSpecificLogs = medLogs.filter(l => l.medication_id === med.id);
                  const taken = medSpecificLogs.filter(l => l.taken).length;
                  const total = medSpecificLogs.length;
                  const pct = total > 0 ? Math.round((taken / total) * 100) : null;
                  return (
                    <div key={med.id} className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{med.drug_name}</p>
                        <p className="text-xs text-gray-500">{med.dose} · {med.frequency}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm" style={{ color: pct >= 80 ? '#16a34a' : '#ef4444' }}>
                          {pct !== null ? `${pct}%` : '—'}
                        </p>
                        <p className="text-xs text-gray-400">{taken}/{total} {hi ? 'खुराक' : 'doses'}</p>
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${pct || 0}%`, background: pct >= 80 ? '#16a34a' : '#ef4444' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 30-Day Calendar Strip */}
          <section>
            <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">
              {hi ? '30-दिन निगरानी कैलेंडर' : '30-Day Monitoring Calendar'}
            </h2>
            <div className="flex flex-wrap gap-1">
              {calDays.map(day => {
                const dip = dipstickResults.find(r => isSameDay(new Date(r.created_date), day));
                const logs = medLogs.filter(m => m.scheduled_for && isSameDay(new Date(m.scheduled_for), day));
                const medOk = logs.length > 0 && logs.every(l => l.taken);
                return (
                  <div key={day.toISOString()} className="flex flex-col items-center gap-0.5 w-7">
                    <span className="text-[9px] text-gray-400">{format(day, 'd')}</span>
                    <div className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ background: dip ? (PROTEIN_COLORS[dip.protein_level] || '#9ca3af') : '#e5e7eb' }}
                      title={dip?.protein_level || 'No data'}
                    />
                    <div className="w-3 h-1.5 rounded"
                      style={{ background: logs.length === 0 ? '#e5e7eb' : medOk ? '#16a34a' : '#ef4444' }}
                      title={medOk ? 'Meds taken' : 'Meds missed'}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-2 text-[10px] text-gray-500 flex-wrap">
              <span>{hi ? 'ऊपर: प्रोटीन' : 'Top: Protein level'}</span>
              <span>{hi ? 'नीचे: दवा (हरा=ली, लाल=नहीं ली)' : 'Bottom: Meds (green=taken, red=missed)'}</span>
            </div>
          </section>

          {/* Diet Summary */}
          {(avgSodium || avgFluid) && (
            <section>
              <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                🥗 {hi ? 'आहार निगरानी (औसत)' : 'Dietary Monitoring (Averages)'}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {avgSodium && (
                  <div className="border rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">🧂 {hi ? 'औसत सोडियम' : 'Avg Sodium'}</p>
                    <p className="text-xl font-bold" style={{ color: avgSodium > 2000 ? '#ef4444' : '#16a34a' }}>{avgSodium}</p>
                    <p className="text-xs text-gray-400">mg/day</p>
                  </div>
                )}
                {avgFluid && (
                  <div className="border rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">💧 {hi ? 'औसत तरल' : 'Avg Fluid'}</p>
                    <p className="text-xl font-bold text-blue-600">{avgFluid}</p>
                    <p className="text-xs text-gray-400">mL/day</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Caregiver Daily Notes */}
          {dailyNotes.length > 0 && (
            <section>
              <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                📝 {hi ? 'देखभालकर्ता के दैनिक नोट्स' : 'Caregiver Daily Notes'}
              </h2>
              <div className="space-y-2">
                {dailyNotes.filter(n => n.note_text || n.mood).slice(-15).map((note, i) => (
                  <div key={note.id || i} className="border rounded-xl p-3 bg-amber-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">{format(new Date(note.note_date), 'dd MMM yyyy')}</span>
                      {note.mood && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">{note.mood}</span>}
                    </div>
                    {note.note_text && <p className="text-xs text-gray-700 leading-relaxed">{note.note_text}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Clinician Notes section */}
          <section className="border-2 border-dashed border-gray-300 rounded-xl p-4">
            <h2 className="font-bold text-gray-700 mb-2 text-sm">
              {hi ? 'चिकित्सक नोट्स (नियुक्ति के दौरान भरें)' : 'Clinician Notes (To be filled at appointment)'}
            </h2>
            <div className="space-y-2">
              {[
                hi ? 'परीक्षण के निष्कर्ष:' : 'Examination Findings:',
                hi ? 'उपचार परिवर्तन:' : 'Treatment Changes:',
                hi ? 'अगली नियुक्ति:' : 'Next Appointment:',
              ].map((label, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                  <div className="border-b border-gray-200 h-6 mt-1" />
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 border-t pt-4">
            <p>KidneyCare AI · AIIMS Patna · {hi ? 'यह रिपोर्ट स्वचालित रूप से तैयार की गई है' : 'Auto-generated report'} · {format(today, 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:my-0 { margin: 0 !important; }
          .print\\:max-w-none { max-width: none !important; }
        }
      `}</style>
    </div>
  );
}