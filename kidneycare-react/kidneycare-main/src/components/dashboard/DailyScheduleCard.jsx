import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Circle, Clock, Settings, Sparkles, Plus, 
  ChevronRight, ArrowRight, Bell, Calendar, Info, Check, RotateCcw
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Link } from 'react-router-dom';

export default function DailyScheduleCard({ crNumber = "AIIMS/PED/2026/0412", hi = false, onProgressChange }) {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [editingTasks, setEditingTasks] = useState([]);
  const [savingCustom, setSavingCustom] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/daily-schedule?cr_number=${encodeURIComponent(crNumber)}`);
      if (res.ok) {
        const json = await res.json();
        setScheduleData(json);
        setEditingTasks(json.tasks || []);
        if (onProgressChange) {
          onProgressChange(json.percent_completed, json.kidney_buddy, json.tasks);
        }
      }
    } catch (e) {
      console.error('Failed to fetch daily schedule:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [crNumber]);

  const handleToggleTask = async (taskId) => {
    try {
      setTogglingId(taskId);
      const res = await fetch('/api/daily-schedule/toggle-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cr_number: crNumber, task_id: taskId })
      });
      if (res.ok) {
        const json = await res.json();
        // Optimistically update
        setScheduleData(prev => {
          if (!prev) return prev;
          const updated = prev.tasks.map(t => t.id === taskId ? { ...t, is_completed: json.is_completed, completed_at: json.time } : t);
          const enabledTasks = updated.filter(t => t.enabled !== false);
          const comp = enabledTasks.filter(t => t.is_completed).length;
          const pct = Math.round((comp / Math.max(1, enabledTasks.length)) * 100);
          if (pct === 100) setShowCelebration(true);
          if (onProgressChange) onProgressChange(pct, prev.kidney_buddy, updated);
          return {
            ...prev,
            tasks: updated,
            completed_count: comp,
            percent_completed: pct
          };
        });
      }
    } catch (e) {
      console.error('Failed to toggle task:', e);
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveCustomSchedule = async () => {
    try {
      setSavingCustom(true);
      const res = await fetch('/api/daily-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cr_number: crNumber, tasks: editingTasks })
      });
      if (res.ok) {
        setShowCustomizer(false);
        await fetchSchedule();
      }
    } catch (e) {
      console.error('Failed to save custom schedule:', e);
    } finally {
      setSavingCustom(false);
    }
  };

  if (loading && !scheduleData) {
    return (
      <Card className="p-4 bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-900 rounded-3xl animate-pulse">
        <div className="h-6 bg-indigo-100 rounded w-1/3 mb-3"></div>
        <div className="space-y-2">
          <div className="h-14 bg-gray-100 rounded-2xl"></div>
          <div className="h-14 bg-gray-100 rounded-2xl"></div>
          <div className="h-14 bg-gray-100 rounded-2xl"></div>
        </div>
      </Card>
    );
  }

  if (!scheduleData) return null;

  const { tasks = [], completed_count = 0, total_count = 1, percent_completed = 0 } = scheduleData;
  const enabledTasks = tasks.filter(t => t.enabled !== false);

  return (
    <Card className="overflow-hidden border border-indigo-100 dark:border-indigo-900/60 shadow-md bg-white dark:bg-gray-900 rounded-3xl">
      {/* Header Bar */}
      <div className="p-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-800 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg shadow-inner">
              <span>🌟</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  {hi ? 'दैनिक रूटीन' : 'DAILY CLINICAL ROUTINE'}
                </span>
                <span className="text-[11px] text-indigo-200">
                  {scheduleData.date}
                </span>
              </div>
              <h3 className="text-base font-extrabold mt-0.5">
                {hi ? 'आरव का सुपरहीरो किडनी शेड्यूल' : "Aarav's Daily Kidney Schedule"}
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingTasks(tasks);
              setShowCustomizer(true);
            }}
            className="flex items-center gap-1.5 text-xs font-bold bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-xl border border-white/20 transition-all active:scale-95"
            title={hi ? "रूटीन बदलें" : "Customise Daily Schedule"}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{hi ? 'कस्टमाइज़' : 'Customise'}</span>
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="mt-3 pt-2.5 border-t border-white/15">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span>{completed_count} {hi ? 'काम पूरे हुए' : 'completed'} ({total_count} {hi ? 'में से' : 'total'})</span>
            <span className="text-amber-300 font-extrabold">{percent_completed}%</span>
          </div>
          <div className="w-full h-2.5 bg-black/25 rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent_completed}%` }}
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Task Timeline List */}
      <div className="p-3.5 space-y-2">
        {enabledTasks.map((task) => {
          const isDone = task.is_completed;
          const isToggling = togglingId === task.id;

          return (
            <motion.div
              key={task.id}
              layout
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isDone 
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm hover:border-indigo-200'
              }`}
            >
              {/* Task Left: Checkbox + Mascot & Labels */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  onClick={() => handleToggleTask(task.id)}
                  disabled={isToggling}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                    isDone 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'border-2 border-gray-300 dark:border-gray-600 hover:border-emerald-500 text-transparent'
                  }`}
                  title={isDone ? "Mark as not done" : "Mark as done"}
                >
                  <Check className="w-4 h-4" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      {task.time}
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {task.cartoon}
                    </span>
                  </div>

                  <h4 className={`text-xs font-bold mt-1 leading-snug truncate ${
                    isDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {hi ? task.label_hi : task.label_en}
                  </h4>

                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {task.clinical_reason}
                  </p>
                </div>
              </div>

              {/* Task Right: Action Link */}
              <div className="shrink-0">
                {task.target_screen ? (
                  <Link
                    to={task.target_screen}
                    className="h-8 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold flex items-center gap-1 transition-colors active:scale-95"
                  >
                    <span>{hi ? 'खोलें' : 'Open'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Routine Customiser Dialog */}
      <Dialog open={showCustomizer} onOpenChange={setShowCustomizer}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-gray-900 dark:text-white border-b pb-3">
              <Settings className="w-5 h-5 text-indigo-600" />
              <span>{hi ? 'दैनिक रूटीन कस्टमाइज़ करें' : 'Customise Daily Clinical Routine'}</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-gray-500 mb-3">
            {hi
              ? 'यह रूटीन हर दिन अपने आप चलेगा। आप समय बदल सकते हैं या काम चालू/बंद कर सकते हैं:'
              : 'This schedule runs automatically every single day. Toggle tasks on/off and adjust times to match your child’s waking and school hours:'}
          </p>

          <div className="space-y-2.5">
            {editingTasks.map((t, idx) => (
              <div key={t.id} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={t.enabled !== false}
                    onChange={(e) => {
                      const updated = [...editingTasks];
                      updated[idx].enabled = e.target.checked;
                      setEditingTasks(updated);
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                        {hi ? t.label_hi : t.label_en}
                      </p>
                      {t.category === 'fluid' && (
                        <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-200">
                          💧 {hi ? 'तरल कोटा' : 'Fluid Quota'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">{t.cartoon}</p>
                  </div>
                </div>

                {/* Time picker */}
                <input
                  type="time"
                  value={t.time || "08:00"}
                  onChange={(e) => {
                    const updated = [...editingTasks];
                    updated[idx].time = e.target.value;
                    setEditingTasks(updated);
                  }}
                  className="text-xs font-bold border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 rounded-lg w-24"
                />
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4 pt-3 border-t flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomizer(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCustomSchedule}
              disabled={savingCustom}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl px-4"
            >
              {savingCustom ? 'Saving...' : (hi ? 'सेव करें (हमेशा के लिए)' : 'Save Schedule')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
