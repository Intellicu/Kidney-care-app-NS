import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const STATUS_COLORS = {
  Overdue: 'text-red-600',
  Due_Today: 'text-amber-600',
  Upcoming: 'text-green-600',
  Completed: 'text-gray-500',
};

const STATUS_BG = {
  Overdue: '🔴',
  Due_Today: '🟡',
  Upcoming: '🟢',
  Completed: '✓',
};

export default function DrugCard({ medication, template, schedules, lastResults, onEnterResult, onViewSchedule }) {
  const [showStop, setShowStop] = useState(false);

  const isCyc = medication.drug_name === 'Cyclophosphamide';
  const isRituximab = medication.drug_name === 'Rituximab';

  // Sort schedules by due_date
  const sortedSchedules = [...(schedules || [])].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const upcomingTests = sortedSchedules.filter(s => s.status !== 'Completed' && s.status !== 'Skipped').slice(0, 4);

  const getTestStatus = (schedule) => {
    const now = new Date();
    const due = new Date(schedule.due_date);
    const diffDays = differenceInDays(due, now);
    if (schedule.status === 'Completed') return 'Completed';
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due_Today';
    if (diffDays <= 3) return 'Due_Today';
    return 'Upcoming';
  };

  return (
    <Card className="border-none overflow-hidden mb-3">
      {/* Drug header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-gray-900">💊 {medication.drug_name} {medication.dose}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {template?.drug_class?.replace(/_/g, ' ')} · {medication.frequency}
            </p>
          </div>
          <Badge className={template ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}>
            {template ? 'Protocol active' : 'No template'}
          </Badge>
        </div>
      </div>

      {/* Cyclophosphamide warning */}
      {isCyc && (
        <div className="bg-yellow-50 border-b border-yellow-100 p-3">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">⚠ Cyclophosphamide: Weekly CBC mandatory. Cumulative dose tracking active.</p>
          </div>
        </div>
      )}

      {/* Rituximab info */}
      {isRituximab && (
        <div className="bg-purple-50 border-b border-purple-100 p-3">
          <p className="text-xs text-purple-800 font-medium">💉 Post-infusion monitoring: CD19 B-cell count monthly. No live vaccines until B-cell reconstitution + 6 months.</p>
        </div>
      )}

      {/* Upcoming tests */}
      {upcomingTests.length > 0 && (
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Next tests due:</p>
          <div className="space-y-2">
            {upcomingTests.map((s, i) => {
              const status = getTestStatus(s);
              const diffDays = differenceInDays(new Date(s.due_date), new Date());
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-base shrink-0">{STATUS_BG[status]}</span>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${STATUS_COLORS[status]}`}>{s.test_name}</p>
                      <p className="text-xs text-gray-400">
                        {status === 'Overdue'
                          ? `OVERDUE ${Math.abs(diffDays)} days`
                          : status === 'Due_Today' ? 'Due today'
                          : `Due ${format(new Date(s.due_date), 'd MMM')}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={status === 'Overdue' ? 'destructive' : 'outline'}
                    className="h-7 px-2 text-xs rounded-lg shrink-0"
                    onClick={() => onEnterResult(s, medication)}
                  >
                    Enter
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Last results summary */}
      {lastResults?.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 mb-1">Last result:</p>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${
              lastResults[0].status === 'Normal' ? 'bg-green-100 text-green-700' :
              lastResults[0].status?.includes('Critical') ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {lastResults[0].test_name}: {lastResults[0].result_value} {lastResults[0].result_unit || ''} — {lastResults[0].status}
            </Badge>
            <span className="text-xs text-gray-400">{format(new Date(lastResults[0].result_date), 'd MMM')}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onViewSchedule(medication)} className="flex-1 h-8 text-xs rounded-lg">
          View Schedule
        </Button>
        <Button size="sm" onClick={() => onEnterResult(null, medication)} className="flex-1 h-8 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 text-white">
          Enter Result
        </Button>
      </div>

      {/* Emergency stop */}
      {template?.emergency_stop_criteria?.length > 0 && (
        <div className="border-t border-gray-100">
          <button
            className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-red-50"
            onClick={() => setShowStop(!showStop)}
          >
            <span className="text-xs font-medium text-red-600">🛑 When to STOP drug immediately</span>
            {showStop ? <ChevronUp className="w-3.5 h-3.5 text-red-400" /> : <ChevronDown className="w-3.5 h-3.5 text-red-400" />}
          </button>
          {showStop && (
            <div className="px-4 pb-3 border border-red-100 mx-3 mb-3 rounded-lg bg-red-50">
              <ul className="space-y-1 mt-2">
                {template.emergency_stop_criteria.map((c, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-500 mt-2 italic">Contact Dr. immediately if any of these occur.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}