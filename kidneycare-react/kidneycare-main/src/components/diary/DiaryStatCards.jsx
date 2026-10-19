import React from 'react';
import { AlertTriangle } from 'lucide-react';

const PROTEIN_NUM = { 'Negative': 0, 'Trace': 0.5, '1+': 1, '2+': 2, '3+': 3, '4+': 4 };

export default function DiaryStatCards({ dipstickResults, medLogs }) {
  const negativeDays = dipstickResults.filter(r => ['Negative', 'Trace'].includes(r.protein_level)).length;
  const alertDays = dipstickResults.filter(r => PROTEIN_NUM[r.protein_level] >= 2).length;
  const relapseDays = dipstickResults.filter(r => (r.relapse_day_count || 0) >= 3).length;
  const totalMeds = medLogs.length;
  const takenMeds = medLogs.filter(m => m.taken).length;
  const compliance = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : null;

  const possibleRelapse = dipstickResults.some(r => (r.relapse_day_count || 0) >= 3);

  const cards = [
    { label: 'Negative Days', labelHi: 'नेगेटिव दिन', value: negativeDays, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', val: 'text-green-800' },
    { label: 'Alert Days (2+)', labelHi: 'अलर्ट दिन', value: alertDays, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', val: 'text-amber-800' },
    { label: 'Relapse Days', labelHi: 'रिलैप्स दिन', value: relapseDays, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', val: 'text-red-800' },
    { label: 'Med Compliance', labelHi: 'दवा अनुपालन', value: compliance !== null ? `${compliance}%` : '--', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', val: 'text-blue-800' },
  ];

  return (
    <div className="px-4 mb-4">
      {possibleRelapse && (
        <div className="flex items-center gap-2 bg-red-600 text-white rounded-xl px-4 py-3 mb-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium leading-tight">
            🚨 रिलैप्स संभव — डॉक्टर से मिलें / Possible Relapse — Contact Doctor
          </p>
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        {cards.map(c => (
          <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-2 text-center`}>
            <p className={`text-xl font-bold ${c.val}`}>{c.value}</p>
            <p className={`text-[9px] font-semibold ${c.text} leading-tight`}>{c.labelHi}</p>
            <p className={`text-[9px] ${c.text} opacity-70 leading-tight`}>{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}