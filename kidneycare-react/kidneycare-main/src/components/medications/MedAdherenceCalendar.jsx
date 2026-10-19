import React from 'react';
import { format, subDays, isSameDay, eachDayOfInterval } from 'date-fns';

export default function MedAdherenceCalendar({ medications, medLogs, hi }) {
  const days = eachDayOfInterval({ start: subDays(new Date(), 27), end: new Date() });

  const getDayStatus = (day) => {
    const logsForDay = medLogs.filter(l => l.scheduled_for && isSameDay(new Date(l.scheduled_for), day));
    if (logsForDay.length === 0) return 'none';
    const allTaken = logsForDay.every(l => l.taken);
    const anyMissed = logsForDay.some(l => l.taken === false);
    if (allTaken) return 'taken';
    if (anyMissed) return 'missed';
    return 'partial';
  };

  const statusConfig = {
    none: { bg: 'bg-gray-100 dark:bg-gray-700', label: '' },
    taken: { bg: 'bg-green-400', label: '✓' },
    missed: { bg: 'bg-red-400', label: '✗' },
    partial: { bg: 'bg-amber-400', label: '~' },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-gray-800 dark:text-white text-sm">
          💊 {hi ? '28-दिन अनुपालन कैलेंडर' : '28-Day Adherence Calendar'}
        </p>
        <div className="flex gap-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" />{hi ? 'ली' : 'Taken'}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />{hi ? 'नहीं ली' : 'Missed'}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />{hi ? 'आंशिक' : 'Partial'}</span>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-gray-400 font-medium">{d}</div>
        ))}
      </div>

      {/* Leading empty cells */}
      {(() => {
        const firstDow = days[0].getDay(); // 0=Sun
        const cells = [];
        for (let i = 0; i < firstDow; i++) {
          cells.push(<div key={`empty-${i}`} />);
        }
        for (const day of days) {
          const status = getDayStatus(day);
          const cfg = statusConfig[status];
          const isToday = isSameDay(day, new Date());
          cells.push(
            <div key={day.toISOString()} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-gray-400">{format(day, 'd')}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white
                ${cfg.bg} ${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}>
                {cfg.label}
              </div>
            </div>
          );
        }
        return <div className="grid grid-cols-7 gap-1">{cells}</div>;
      })()}

      {/* Per-medication compliance */}
      {medications.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{hi ? 'दवा के अनुसार अनुपालन' : 'Per-Medication Compliance'}</p>
          {medications.map(med => {
            const logs = medLogs.filter(l => l.medication_id === med.id);
            const taken = logs.filter(l => l.taken).length;
            const total = logs.length;
            const pct = total > 0 ? Math.round((taken / total) * 100) : null;
            return (
              <div key={med.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{med.drug_name}</p>
                  <p className="text-[10px] text-gray-400">{med.dose}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-20 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct || 0}%`, background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <span className="text-xs font-bold w-8 text-right" style={{ color: pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626' }}>
                    {pct !== null ? `${pct}%` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}