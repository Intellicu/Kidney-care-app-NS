import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, CheckCircle2, AlertTriangle, ShieldCheck, 
  ChevronRight, Sparkles, Pill, Info, ArrowDownRight, Bell, Check
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SteroidTaperCalendar({ crNumber = "AIIMS/PED/2026/0412", hi = false, onLogged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/steroid-schedule?cr_number=${encodeURIComponent(crNumber)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch steroid schedule:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [crNumber]);

  const handleMarkTaken = async (dayDate, dose) => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/steroid-schedule/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cr_number: crNumber,
          date: dayDate,
          dose_given_mg: dose,
          status: 'taken'
        })
      });
      if (res.ok) {
        await fetchSchedule();
        if (onLogged) onLogged();
      }
    } catch (e) {
      console.error("Failed to log steroid dose:", e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 border-indigo-100 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/50 to-white dark:from-gray-900 dark:to-gray-800 shadow-sm animate-pulse">
        <div className="h-6 bg-indigo-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
        <div className="h-16 bg-indigo-100 dark:bg-gray-800 rounded-xl mb-3"></div>
        <div className="grid grid-cols-7 gap-1 h-32 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
      </Card>
    );
  }

  if (!data || !data.today) return null;

  const { today, calendar_days, next_milestone, taper_milestones, medicine_name, current_dose_mg, phase_name } = data;
  const isOnDay = today.is_on_day;
  const isTaken = today.status === 'Taken';

  return (
    <Card className="overflow-hidden border border-amber-200/80 dark:border-amber-900/60 shadow-md bg-white dark:bg-gray-900">
      {/* Smart Alarm Header Banner */}
      <div className={`p-4 transition-colors ${
        isOnDay 
          ? (isTaken 
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white' 
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white animate-gradient')
          : 'bg-gradient-to-r from-slate-600 via-teal-700 to-cyan-800 text-white'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              {isOnDay ? (
                isTaken ? <ShieldCheck className="w-6 h-6 text-emerald-100" /> : <Bell className="w-6 h-6 text-amber-100 animate-bounce" />
              ) : (
                <Sparkles className="w-6 h-6 text-cyan-200" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold bg-white/25 px-2 py-0.5 rounded-full">
                  {isOnDay ? (hi ? 'आज दवा का दिन' : 'STEROID DAY') : (hi ? 'आज छुट्टी का दिन' : 'OFF DAY')}
                </span>
                <span className="text-xs opacity-90">{today.date}</span>
              </div>
              <h3 className="text-lg font-extrabold mt-0.5 leading-tight">
                {isOnDay 
                  ? (hi ? `${medicine_name} (${today.dose_mg} mg) देने का समय` : `Today is ${medicine_name} Day (${today.dose_mg} mg)`)
                  : (hi ? `आज ${medicine_name} नहीं देना है` : `Rest Day: No ${medicine_name} Today`)}
              </h3>
            </div>
          </div>

          {/* Quick status pill */}
          <div className="text-right shrink-0">
            {isOnDay && isTaken && (
              <span className="inline-flex items-center gap-1 bg-white text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-full shadow-sm">
                <Check className="w-3.5 h-3.5" /> {hi ? 'ले ली गई' : 'Taken'}
              </span>
            )}
            {isOnDay && !isTaken && (
              <span className="inline-flex items-center gap-1 bg-white text-amber-900 font-bold text-xs px-2.5 py-1 rounded-full shadow-sm">
                <Clock className="w-3.5 h-3.5" /> {hi ? 'बाकी है' : 'Due Now'}
              </span>
            )}
            {!isOnDay && (
              <span className="inline-flex items-center gap-1 bg-white/25 text-white font-medium text-xs px-2.5 py-1 rounded-full">
                🌿 {hi ? 'विश्राम' : 'Rest'}
              </span>
            )}
          </div>
        </div>

        {/* Action / Detail Section */}
        <div className="mt-3.5 bg-black/15 backdrop-blur-sm rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs leading-relaxed text-white/95">
            {isOnDay ? (
              hi ? today.instruction_hi : today.instruction_en
            ) : (
              hi ? "अगली खुराक कल सुबह दी जाएगी। अन्य नियमित दवाएं (कैल्शियम, बीपी) सामान्य रूप से चालू रखें।"
                 : `Next alternate morning dose is scheduled tomorrow. Continue calcium/vitamin D and BP meds as usual.`
            )}
          </div>

          {isOnDay && (
            <div className="w-full sm:w-auto shrink-0">
              {isTaken ? (
                <div className="text-xs bg-emerald-500/40 text-emerald-100 font-medium px-3 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  {hi ? `सुबह दी गई (${today.taken_at || 'दर्ज'})` : `Given this morning (${today.taken_at || 'logged'})`}
                </div>
              ) : (
                <Button 
                  onClick={() => handleMarkTaken(today.date, today.dose_mg)} 
                  disabled={submitting}
                  className="w-full sm:w-auto bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs h-9 px-4 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-transform"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> {hi ? 'दर्ज कर रहे हैं...' : 'Logging...'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {hi ? `✓ आज की खुराक दी गई (${today.tablets_count} गोली)` : `✓ Mark Taken (${today.tablets_count} tabs)`}
                    </span>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Taper Countdown & Next Milestone Banner */}
      {next_milestone && (
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900/40 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-1.5 font-medium">
            <ArrowDownRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              {hi ? 'अगला टेपर बदलाव:' : 'Next Step-Down:'}{' '}
              <strong className="font-bold underline">{next_milestone.next_dose_mg} mg</strong>{' '}
              {hi ? `${next_milestone.next_step_date} से` : `on ${next_milestone.next_step_date}`}
            </span>
          </div>
          <span className="font-bold bg-amber-200/70 dark:bg-amber-900/80 px-2 py-0.5 rounded text-[11px]">
            {hi ? `${next_milestone.days_remaining} दिन शेष` : `${next_milestone.days_remaining} days left`}
          </span>
        </div>
      )}

      {/* 30-Day Alternate-Day Calendar Grid */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {hi ? 'अक्टूबर 2026: एक-दिन छोड़ स्टेरॉयड कैलेंडर' : 'October 2026: Alternate-Day Calendar'}
            </h4>
          </div>
          <button 
            onClick={() => setShowFullPlan(!showFullPlan)} 
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5"
          >
            {showFullPlan ? (hi ? 'कैलेंडर देखें' : 'Show Calendar') : (hi ? 'पूरा टेपर प्लान' : 'Taper Roadmap')}
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showFullPlan ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-gray-500 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            {hi ? 'ली गई' : 'Taken'}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-600 inline-block"></span>
            {hi ? 'आज की खुराक (Due)' : 'Today (Due)'}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-indigo-100 border border-indigo-400 inline-block"></span>
            {hi ? 'आगामी स्टेरॉयड दिन' : 'Upcoming Dose'}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 inline-block"></span>
            {hi ? 'छुट्टी (Off Day)' : 'Off Day'}
          </span>
        </div>

        {!showFullPlan ? (
          <div>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-gray-400 dark:text-gray-500 mb-1">
              <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendar_days.map((d) => {
                const isSelected = selectedDay && selectedDay.date === d.date;
                let bgClass = "bg-gray-100/70 dark:bg-gray-800 text-gray-400 border-transparent";
                let badge = null;

                if (d.is_today) {
                  bgClass = d.status === 'Taken'
                    ? "bg-emerald-100 dark:bg-emerald-900/40 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-black shadow-md ring-2 ring-emerald-300"
                    : "bg-amber-100 dark:bg-amber-900/50 border-2 border-amber-500 text-amber-950 dark:text-amber-100 font-black shadow-md ring-2 ring-amber-300 animate-pulse";
                } else if (d.status === 'Taken') {
                  bgClass = "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold";
                  badge = <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />;
                } else if (d.status === 'Missed') {
                  bgClass = "bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium";
                  badge = <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />;
                } else if (d.is_on_day && d.status === 'Upcoming') {
                  bgClass = "bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold";
                } else if (!d.is_on_day) {
                  bgClass = "bg-slate-50 dark:bg-gray-800/40 text-gray-400 dark:text-gray-600 border border-dashed border-gray-200 dark:border-gray-800";
                }

                return (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDay(d)}
                    className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between transition-all hover:scale-105 ${bgClass} ${
                      isSelected ? 'ring-2 ring-indigo-500 scale-105' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between w-full px-0.5">
                      <span className="text-[11px] leading-none">{d.day}</span>
                      {badge}
                    </div>
                    {d.is_on_day ? (
                      <span className="text-[9px] font-bold leading-none bg-indigo-600 text-white dark:bg-indigo-500 px-1 py-0.5 rounded">
                        {d.dose_mg}m
                      </span>
                    ) : (
                      <span className="text-[8px] leading-none opacity-60">off</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Details Popover */}
            {selectedDay && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200">
                    {selectedDay.date} ({selectedDay.weekday})
                  </span>
                  <span className="font-semibold text-gray-600 dark:text-gray-300">
                    Status: <strong className="text-indigo-700 dark:text-indigo-400">{selectedDay.status}</strong>
                  </span>
                </div>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {selectedDay.is_on_day
                    ? `Prescription: ${selectedDay.dose_mg} mg Prednisolone (${selectedDay.tablets} tablets of 5mg) in morning with breakfast.`
                    : 'Off Day: No steroid dose scheduled.'}
                </p>
                {selectedDay.is_on_day && selectedDay.status !== 'Taken' && (
                  <Button
                    size="sm"
                    onClick={() => handleMarkTaken(selectedDay.date, selectedDay.dose_mg)}
                    disabled={submitting}
                    className="mt-2 text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                  >
                    {hi ? 'इस तारीख को दिया गया चिह्नित करें' : 'Mark as Given for this day'}
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        ) : (
          /* Full Taper Ladder / Roadmap */
          <div className="space-y-2 mt-2">
            <p className="text-xs text-gray-500 mb-2">
              {hi 
                ? 'एम्स पटना बाल गुर्दा चिकित्सा प्रोटोकॉल के अनुसार स्टेप्ड टेपर योजना:'
                : 'AIIMS Patna Pediatric Nephrology Guideline Stepped Taper Plan:'}
            </p>
            {taper_milestones.map((m, idx) => (
              <div 
                key={idx} 
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  m.status === 'Active'
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 text-amber-950 dark:text-amber-100 font-bold shadow-sm'
                    : m.status === 'Completed'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                    : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 text-gray-500'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold">{m.phase}</span>
                    <span className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                      m.status === 'Active' ? 'bg-amber-200 text-amber-900' :
                      m.status === 'Completed' ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {m.frequency} · {m.start_date || 'Start'} to {m.end_date} ({m.duration_weeks ? `${m.duration_weeks} wks` : 'End'})
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold">{m.dose_mg} mg</span>
                  <p className="text-[10px] opacity-75">{m.dose_mg > 0 ? `${m.dose_mg / 5} tabs` : 'None'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety Notice Footer */}
      <div className="px-4 py-2 bg-rose-50/70 dark:bg-rose-950/30 border-t border-rose-100 dark:border-rose-900/30 flex items-center gap-2 text-[11px] text-rose-800 dark:text-rose-300">
        <Info className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
        <span>
          {hi 
            ? 'महत्वपूर्ण: स्टेरॉयड को कभी भी डॉक्टर की सलाह के बिना अचानक बंद न करें (Adrenal Crisis का खतरा)।'
            : 'Caution: Never stop steroids abruptly without consulting your AIIMS pediatric nephrologist.'}
        </span>
      </div>
    </Card>
  );
}
