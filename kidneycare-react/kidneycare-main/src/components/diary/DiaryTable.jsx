import React from 'react';
import { format, subDays, isSameDay } from 'date-fns';

const PROTEIN_NUM = { 'Negative': 0, 'Trace': 0.5, '1+': 1, '2+': 2, '3+': 3, '4+': 4 };

const rowBg = (level) => {
  const n = PROTEIN_NUM[level] ?? -1;
  if (n >= 3) return 'bg-red-50';
  if (n >= 2) return 'bg-amber-50';
  return '';
};

const ProteinCell = ({ level }) => {
  const n = PROTEIN_NUM[level] ?? -1;
  const color = n <= 0.5 ? 'text-green-700' : n <= 1 ? 'text-amber-700' : n <= 2 ? 'text-orange-700' : 'text-red-700';
  return <span className={`font-semibold ${color}`}>{level || '—'}</span>;
};

export default function DiaryTable({ dipstickResults, healthMetrics, medLogs }) {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));

  const getDipstick = (day) =>
    dipstickResults.find(r => isSameDay(new Date(r.created_date), day));

  const getBP = (day) =>
    healthMetrics.find(m =>
      m.metric_type === 'BP' && isSameDay(new Date(m.recorded_at || m.created_date), day)
    );

  const getWeight = (day) =>
    healthMetrics.find(m =>
      m.metric_type === 'Weight' && isSameDay(new Date(m.recorded_at || m.created_date), day)
    );

  const getSymptoms = (day) =>
    healthMetrics.find(m =>
      m.metric_type === 'Symptoms' && isSameDay(new Date(m.recorded_at || m.created_date), day)
    );

  const getMedStatus = (day) => {
    const logs = medLogs.filter(m =>
      m.scheduled_for && isSameDay(new Date(m.scheduled_for), day)
    );
    if (!logs.length) return null;
    const taken = logs.filter(l => l.taken).length;
    return `${taken}/${logs.length}`;
  };

  const hasAnyData = (day) => {
    return getDipstick(day) || getBP(day) || getWeight(day) || getSymptoms(day) || getMedStatus(day);
  };

  const filledDays = days.filter(hasAnyData);

  return (
    <div className="mx-4 mb-8">
      <h3 className="font-semibold text-gray-900 text-sm mb-3">
        दैनिक डायरी / Daily Diary Table
      </h3>
      <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-100">
        <table className="min-w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: '#1a3660' }}>
              {['तारीख\nDate', 'प्रोटीन\nProtein', 'BP\n(mmHg)', 'वज़न\nWt(kg)', 'दवा\nDose', 'लक्षण\nSymptoms', 'स्थिति\nStatus'].map((h, i) => (
                <th key={i} className="text-white font-semibold px-2 py-2 text-center whitespace-pre-line text-[10px] leading-tight min-w-[60px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filledDays.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  कोई डेटा नहीं / No data available
                </td>
              </tr>
            ) : filledDays.map((day, i) => {
              const dipstick = getDipstick(day);
              const bp = getBP(day);
              const weight = getWeight(day);
              const symptoms = getSymptoms(day);
              const medStatus = getMedStatus(day);
              const level = dipstick?.protein_level;
              const relapseDays = dipstick?.relapse_day_count;

              return (
                <tr key={i} className={`${rowBg(level)} ${i % 2 === 0 ? '' : 'bg-gray-50'} border-b border-gray-100`}>
                  <td className="px-2 py-2 text-center font-medium text-gray-700 whitespace-nowrap">
                    {format(day, 'd MMM')}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {dipstick ? <ProteinCell level={level} /> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-700 whitespace-nowrap">
                    {bp ? `${bp.value}${bp.value_secondary ? '/' + bp.value_secondary : ''}` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-700">
                    {weight ? `${weight.value}` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-700">
                    {medStatus || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-600 max-w-[80px]">
                    {symptoms?.symptoms_list?.length > 0
                      ? <span className="truncate block" title={symptoms.symptoms_list.join(', ')}>{symptoms.symptoms_list.slice(0, 1).join(', ')}{symptoms.symptoms_list.length > 1 ? '…' : ''}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-2 py-2 text-center">
                    {relapseDays >= 3 ? (
                      <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-semibold">रिलैप्स</span>
                    ) : level && PROTEIN_NUM[level] >= 2 ? (
                      <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-semibold">Alert</span>
                    ) : level ? (
                      <span className="text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-semibold">OK</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}