import React from 'react';
import { format, subDays, isSameDay } from 'date-fns';

export default function MedComplianceCalendar({ medLogs }) {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));

  const taken = medLogs.filter(m => m.taken).length;
  const total = medLogs.length;
  const pct = total > 0 ? Math.round((taken / total) * 100) : null;

  const getStatus = (day) => {
    const logsForDay = medLogs.filter(m =>
      m.scheduled_for && isSameDay(new Date(m.scheduled_for), day)
    );
    if (logsForDay.length === 0) return 'none';
    const anyTaken = logsForDay.some(m => m.taken);
    const allTaken = logsForDay.every(m => m.taken);
    if (allTaken) return 'taken';
    if (anyTaken) return 'partial';
    return 'missed';
  };

  const colors = {
    taken: '#16a34a',
    partial: '#f59e0b',
    missed: '#ef4444',
    none: '#e5e7eb',
  };

  return (
    <div className="bg-white rounded-2xl p-4 mx-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">
          दवा अनुपालन / Medication Compliance
        </h3>
        {pct !== null && (
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
            {taken}/{total} — {pct}%
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="flex flex-wrap gap-1">
        {days.map((day, i) => {
          const status = getStatus(day);
          return (
            <div
              key={i}
              title={`${format(day, 'd MMM')}: ${status}`}
              style={{ width: 20, height: 20, backgroundColor: colors[status], borderRadius: 4 }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#16a34a' }} /> ली गई / Taken</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#ef4444' }} /> नहीं ली / Missed</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#e5e7eb' }} /> डेटा नहीं / No data</span>
      </div>

      {pct !== null && (
        <div className="mt-3 bg-gray-100 rounded-full h-2">
          <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}