import React, { useState } from 'react';
import { format, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { Droplets, Pill, ChevronLeft, ChevronRight } from 'lucide-react';

const PROTEIN_COLORS = {
  'Negative': '#16a34a',
  'Trace': '#84cc16',
  '1+': '#f59e0b',
  '2+': '#f97316',
  '3+': '#ef4444',
  '4+': '#7f1d1d',
};

export default function MonthlyCalendarView({ dipstickResults = [], medLogs = [], language = 'en' }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  const refDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
  const monthStart = startOfMonth(refDate);
  const monthEnd = endOfMonth(refDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start so calendar starts on Sunday
  const startPad = getDay(monthStart);
  const blanks = Array(startPad).fill(null);

  const getDipForDay = (day) =>
    dipstickResults.filter(r => isSameDay(new Date(r.created_date), day));

  const getMedStatusForDay = (day) => {
    const logs = medLogs.filter(m => m.scheduled_for && isSameDay(new Date(m.scheduled_for), day));
    if (!logs.length) return null;
    const takenCount = logs.filter(m => m.taken).length;
    if (takenCount === logs.length) return 'all';
    if (takenCount > 0) return 'partial';
    return 'missed';
  };

  const hi = language === 'hi';
  const weekDays = hi
    ? ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setMonthOffset(o => o + 1)} className="p-1 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="text-center">
          <p className="font-bold text-gray-900 text-sm">{format(refDate, 'MMMM yyyy')}</p>
          <p className="text-[10px] text-gray-400">{hi ? 'मासिक निगरानी / Monthly Monitoring' : 'Monthly Monitoring Calendar'}</p>
        </div>
        <button onClick={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={monthOffset === 0} className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const dips = getDipForDay(day);
          const medStatus = getMedStatusForDay(day);
          const isToday = isSameDay(day, today);
          const isFuture = day > today;
          const topDip = dips[0];

          return (
            <div key={day.toISOString()}
              className={`relative rounded-lg p-1 min-h-[48px] flex flex-col items-center gap-0.5 ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : isFuture ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}
            >
              <span className={`text-[11px] font-semibold ${isToday ? 'text-blue-700' : isFuture ? 'text-gray-300' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </span>

              {/* Dipstick dot */}
              {topDip ? (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: PROTEIN_COLORS[topDip.protein_level] || '#6b7280' }}
                  title={`Protein: ${topDip.protein_level}`}
                >
                  <Droplets className="w-2.5 h-2.5 text-white" />
                </div>
              ) : !isFuture && (
                <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                  <Droplets className="w-2.5 h-2.5 text-gray-400" />
                </div>
              )}

              {/* Med dot */}
              {medStatus && (
                <div className={`w-3 h-3 rounded-full ${medStatus === 'all' ? 'bg-green-500' : medStatus === 'partial' ? 'bg-yellow-400' : 'bg-red-400'}`}
                  title={`Meds: ${medStatus}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">{hi ? 'प्रोटीन / Protein' : 'Protein Level'}</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {Object.entries(PROTEIN_COLORS).map(([level, color]) => (
            <span key={level} className="flex items-center gap-1 text-[10px] text-gray-600">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
              {level}
            </span>
          ))}
        </div>
        <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">{hi ? 'दवा / Medication' : 'Medication'}</p>
        <div className="flex gap-3 text-[10px] text-gray-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />{hi ? 'ली गई' : 'All taken'}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />{hi ? 'आंशिक' : 'Partial'}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" />{hi ? 'नहीं ली' : 'Missed'}</span>
        </div>
      </div>
    </div>
  );
}