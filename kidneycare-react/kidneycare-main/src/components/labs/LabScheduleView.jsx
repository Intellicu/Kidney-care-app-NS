import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { ChevronLeft, CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_ICONS = {
  Completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  Overdue: <AlertTriangle className="w-4 h-4 text-red-500" />,
  Due_Today: <Clock className="w-4 h-4 text-amber-500" />,
  Upcoming: <Calendar className="w-4 h-4 text-blue-400" />,
};

const STATUS_BADGE = {
  Completed: 'bg-green-50 text-green-700',
  Overdue: 'bg-red-50 text-red-700',
  Due_Today: 'bg-amber-50 text-amber-700',
  Upcoming: 'bg-blue-50 text-blue-700',
};

export default function LabScheduleView({ patient, drugName, schedules, onBack, onEnterResult }) {
  const today = new Date();

  // Group by month
  const byMonth = {};
  [...schedules].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).forEach(s => {
    const key = format(new Date(s.due_date), 'MMMM yyyy');
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(s);
  });

  if (schedules.length === 0) {
    return (
      <div className="mx-4 mt-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
          <p>No scheduled tests for {drugName}</p>
          <p className="text-xs mt-1">Tests will appear when a monitoring plan is active</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4 pb-8">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to Drug Cards
      </button>

      <div className="bg-indigo-600 rounded-t-2xl px-4 py-3">
        <p className="text-white font-bold">{drugName} — Test Schedule</p>
        <p className="text-white/60 text-xs">{patient.name}</p>
      </div>

      <div className="bg-white rounded-b-2xl shadow-sm">
        {Object.entries(byMonth).map(([month, items]) => (
          <div key={month}>
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{month}</p>
            </div>
            {items.map((item, idx) => {
              const daysDiff = differenceInDays(new Date(item.due_date), today);
              const status = item.status || (daysDiff < 0 ? 'Overdue' : daysDiff === 0 ? 'Due_Today' : 'Upcoming');
              return (
                <div key={idx} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                  {STATUS_ICONS[status] || <Calendar className="w-4 h-4 text-gray-400" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.test_name}</p>
                    <p className="text-xs text-gray-400">
                      {status === 'Completed' ? `Done: ${item.last_result_date ? format(new Date(item.last_result_date), 'dd MMM') : '--'}` :
                       status === 'Overdue' ? `Was due: ${format(new Date(item.due_date), 'dd MMM')} (${Math.abs(daysDiff)}d overdue)` :
                       `Due: ${format(new Date(item.due_date), 'dd MMM yyyy')}`}
                    </p>
                    {item.last_result_value && (
                      <p className="text-xs text-gray-400">Last: {item.last_result_value} — {item.last_result_status}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>
                    {status.replace(/_/g, ' ')}
                  </span>
                  {status !== 'Completed' && (
                    <Button
                      size="sm"
                      className="h-7 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 shrink-0"
                      onClick={() => onEnterResult({ ...item, schedule_id: item.id })}
                    >
                      Enter
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}