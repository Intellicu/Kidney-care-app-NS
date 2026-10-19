import React from 'react';
import { Card } from "@/components/ui/card";
import { format, subDays, isSameDay } from 'date-fns';

const TASK_COLORS = {
  done: 'bg-green-500',
  missed: 'bg-red-200',
  not_required: 'bg-gray-100',
};

function ComplianceDot({ status, title }) {
  return (
    <div
      title={title}
      className={`w-4 h-4 rounded-full border ${
        status === 'done' ? 'bg-green-500 border-green-600' :
        status === 'missed' ? 'bg-red-200 border-red-300' :
        'bg-gray-100 border-gray-200'
      }`}
    />
  );
}

export default function ComplianceGrid({ plan, dipstickResults, healthMetrics, medLogs }) {
  const last7 = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

  const getStatus = (day, taskType) => {
    if (!plan) return 'not_required';

    if (taskType === 'dipstick') {
      if (!plan.dipstick_frequency || plan.dipstick_frequency === 'As_Needed') return 'not_required';
      const found = dipstickResults.some(r => isSameDay(new Date(r.created_date), day));
      return found ? 'done' : 'missed';
    }

    if (taskType === 'bp') {
      if (!plan.bp_frequency || plan.bp_frequency === 'Not_Required') return 'not_required';
      const found = healthMetrics.some(m => m.metric_type === 'BP' && isSameDay(new Date(m.recorded_at || m.created_date), day));
      return found ? 'done' : 'missed';
    }

    if (taskType === 'weight') {
      if (!plan.weight_frequency || plan.weight_frequency === 'Not_Required') return 'not_required';
      const found = healthMetrics.some(m => m.metric_type === 'Weight' && isSameDay(new Date(m.recorded_at || m.created_date), day));
      return found ? 'done' : 'missed';
    }

    if (taskType === 'medication') {
      const found = medLogs.some(l => l.taken === true && l.scheduled_for === format(day, 'yyyy-MM-dd'));
      const notTaken = medLogs.some(l => l.taken === false && l.scheduled_for === format(day, 'yyyy-MM-dd'));
      if (found) return 'done';
      if (notTaken) return 'missed';
      return 'missed';
    }

    return 'not_required';
  };

  const taskTypes = [
    { key: 'dipstick', label: '🔵 Dipstick', color: 'text-blue-600' },
    { key: 'bp', label: '🟡 BP', color: 'text-yellow-600' },
    { key: 'weight', label: '🟣 Weight', color: 'text-purple-600' },
    { key: 'medication', label: '🟢 Medication', color: 'text-green-600' },
  ];

  const calcCompliance = (taskKey) => {
    const statuses = last7.map(d => getStatus(d, taskKey));
    const required = statuses.filter(s => s !== 'not_required');
    if (required.length === 0) return null;
    const done = required.filter(s => s === 'done').length;
    return Math.round((done / required.length) * 100);
  };

  return (
    <Card className="p-4 border-none">
      <h4 className="font-semibold text-gray-900 text-sm mb-3">Last 7 Days Compliance</h4>

      {/* Day headers */}
      <div className="grid grid-cols-8 gap-1 mb-2">
        <div className="text-xs text-gray-400" />
        {last7.map(day => (
          <div key={day.toISOString()} className="text-center">
            <p className="text-[9px] text-gray-400">{format(day, 'EEE')}</p>
            <p className="text-[10px] font-semibold text-gray-600">{format(day, 'd')}</p>
          </div>
        ))}
      </div>

      {/* Task rows */}
      {taskTypes.map(task => {
        const pct = calcCompliance(task.key);
        return (
          <div key={task.key} className="grid grid-cols-8 gap-1 mb-2 items-center">
            <div className={`text-[9px] font-medium truncate ${task.color}`}>{task.label}</div>
            {last7.map(day => (
              <div key={day.toISOString()} className="flex justify-center">
                <ComplianceDot status={getStatus(day, task.key)} title={`${task.label} on ${format(day, 'MMM d')}`} />
              </div>
            ))}
          </div>
        );
      })}

      {/* Compliance percentages */}
      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
        {taskTypes.map(task => {
          const pct = calcCompliance(task.key);
          if (pct === null) return null;
          return (
            <div key={task.key} className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1">
              <span className="text-[10px] text-gray-600">{task.label}</span>
              <span className={`text-xs font-bold ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}