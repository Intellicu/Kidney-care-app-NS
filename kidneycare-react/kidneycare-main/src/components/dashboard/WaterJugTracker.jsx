import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Plus, AlertCircle, CheckCircle2, Info, GlassWater, Clock, Sparkles } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WaterJugTracker({ crNumber = "AIIMS/PED/2026/0412", hi = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [customMl, setCustomMl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const fetchFluidQuota = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/fluid-quota?cr_number=${encodeURIComponent(crNumber)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Error fetching fluid quota:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFluidQuota();
  }, [crNumber]);

  const handleLogFluid = async (amountMl, type = 'Water') => {
    try {
      setLogging(true);
      const res = await fetch('/api/fluid-quota/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cr_number: crNumber,
          amount_ml: amountMl,
          fluid_type: type,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
      });
      if (res.ok) {
        await fetchFluidQuota();
        setShowCustomInput(false);
        setCustomMl('');
      }
    } catch (e) {
      console.error('Error logging fluid:', e);
    } finally {
      setLogging(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900 shadow-sm animate-pulse">
        <div className="h-6 bg-blue-100 dark:bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="h-44 bg-blue-50 dark:bg-gray-800 rounded-2xl"></div>
      </Card>
    );
  }

  if (!data) return null;

  const {
    target_quota_ml,
    total_drank_ml,
    remaining_ml,
    percent_used,
    status,
    today_logs = [],
    holliday_segar_maintenance_ml,
    nephrotic_restricted_ml
  } = data;

  const isExceeded = percent_used >= 100;
  const isWarning = percent_used >= 80 && !isExceeded;

  // Water level animation fill height (capped at 100% visually)
  const fillHeightPercent = Math.min(100, Math.max(8, percent_used));

  return (
    <Card className="overflow-hidden border border-cyan-200 dark:border-cyan-900/60 shadow-md bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Droplets className="w-6 h-6 text-cyan-100" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                {hi ? 'दैनिक तरल कोटा' : 'Daily Fluid Quota'}
              </span>
              <h3 className="text-base font-extrabold mt-0.5">
                {hi ? 'चिह्नित पानी का जग (Fluid Tracker)' : 'Marked Water Jug Tracker'}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold shadow-sm ${
              isExceeded
                ? 'bg-rose-500 text-white animate-pulse'
                : isWarning
                ? 'bg-amber-400 text-amber-950 font-black'
                : 'bg-emerald-500 text-white'
            }`}>
              {isExceeded ? (hi ? 'कोटा पूरा ⚠️' : 'Limit Exceeded ⚠️') : isWarning ? (hi ? 'कोटा समाप्त होने वाला' : 'Near Limit') : (hi ? 'सुरक्षित सीमा' : 'Within Limit')}
            </span>
          </div>
        </div>

        {/* Clinical formula notice */}
        <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between text-[11px] text-cyan-100">
          <span>{hi ? 'हॉलिडे-सेगर सीमित कोटा:' : 'Restricted Renal Quota:'} <strong>{target_quota_ml} mL/day</strong></span>
          <span>{hi ? 'शेष:' : 'Remaining:'} <strong className="text-white text-xs">{remaining_ml} mL</strong></span>
        </div>
      </div>

      <div className="p-4">
        {/* Jug + Stats Visualization */}
        <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
          {/* Visual SVG Marked Jug */}
          <div className="relative w-36 h-48 flex items-center justify-center shrink-0">
            {/* Jug Outline & Handle */}
            <svg viewBox="0 0 120 160" className="w-full h-full drop-shadow-md">
              <defs>
                {/* Water Linear Gradient */}
                <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isExceeded ? '#f43f5e' : isWarning ? '#f59e0b' : '#38bdf8'} />
                  <stop offset="100%" stopColor={isExceeded ? '#be123c' : isWarning ? '#d97706' : '#0284c7'} />
                </linearGradient>
                <clipPath id="jugClip">
                  <path d="M 25,20 L 95,20 C 95,20 100,25 98,40 L 92,145 C 90,152 82,155 60,155 C 38,155 30,152 28,145 L 22,40 C 20,25 25,20 25,20 Z" />
                </clipPath>
              </defs>

              {/* Jug Glass Body Background */}
              <path
                d="M 25,20 L 95,20 C 95,20 100,25 98,40 L 92,145 C 90,152 82,155 60,155 C 38,155 30,152 28,145 L 22,40 C 20,25 25,20 25,20 Z"
                fill="#f0f9ff"
                stroke="#0284c7"
                strokeWidth="2.5"
                opacity="0.85"
              />

              {/* Handle */}
              <path
                d="M 96,45 C 114,50 114,115 93,125"
                fill="none"
                stroke="#0284c7"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Water Fill Layer */}
              <g clipPath="url(#jugClip)">
                <rect
                  x="10"
                  y={160 - (1.35 * fillHeightPercent)}
                  width="100"
                  height="160"
                  fill="url(#waterGrad)"
                  opacity="0.88"
                />
                {/* Wave surface line */}
                <line
                  x1="10"
                  y1={160 - (1.35 * fillHeightPercent)}
                  x2="110"
                  y2={160 - (1.35 * fillHeightPercent)}
                  stroke="#ffffff"
                  strokeWidth="2"
                  opacity="0.8"
                />
              </g>

              {/* Calibration Measurement Ticks */}
              {/* 1000 mL */}
              <line x1="30" y1="35" x2="45" y2="35" stroke="#0369a1" strokeWidth="1.5" />
              <text x="48" y="38" fontSize="8" fill="#0369a1" fontWeight="bold">1000 mL</text>

              {/* 750 mL */}
              <line x1="32" y1="65" x2="44" y2="65" stroke="#0369a1" strokeWidth="1.2" />
              <text x="47" y="68" fontSize="8" fill="#0369a1" fontWeight="bold">750 mL</text>

              {/* 500 mL */}
              <line x1="34" y1="95" x2="44" y2="95" stroke="#0369a1" strokeWidth="1.2" />
              <text x="47" y="98" fontSize="8" fill="#0369a1" fontWeight="bold">500 mL</text>

              {/* 250 mL */}
              <line x1="36" y1="125" x2="44" y2="125" stroke="#0369a1" strokeWidth="1.2" />
              <text x="47" y="128" fontSize="8" fill="#0369a1" fontWeight="bold">250 mL</text>
            </svg>

            {/* Percentage badge on top of jug */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none drop-shadow">
              <span className="text-xl font-black text-slate-900 bg-white/80 dark:bg-gray-900/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-gray-700">
                {percent_used}%
              </span>
            </div>
          </div>

          {/* Intake Stats & Summary */}
          <div className="flex-1 w-full space-y-3">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-sky-50 dark:bg-sky-950/40 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900">
                <p className="text-[10px] text-gray-500 uppercase font-bold">{hi ? 'आज पिया गया' : 'Drank Today'}</p>
                <p className="text-xl font-extrabold text-sky-700 dark:text-sky-300 mt-0.5">{total_drank_ml} <span className="text-xs font-normal">mL</span></p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900">
                <p className="text-[10px] text-gray-500 uppercase font-bold">{hi ? 'दैनिक सीमा' : 'Daily Limit'}</p>
                <p className="text-xl font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">{target_quota_ml} <span className="text-xs font-normal">mL</span></p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-semibold text-gray-600 dark:text-gray-400">
                <span>{hi ? 'कोटा प्रगति' : 'Quota Progress'}</span>
                <span>{total_drank_ml} / {target_quota_ml} mL</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-200 dark:border-gray-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, percent_used)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* Quick 1-Tap Log Buttons */}
            <div>
              <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                <GlassWater className="w-3.5 h-3.5 text-cyan-600" />
                {hi ? '1-टैप में पानी / तरल दर्ज करें:' : '1-Tap Quick Fluid Log:'}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { ml: 100, label: '+100 mL', desc: 'Small cup' },
                  { ml: 150, label: '+150 mL', desc: '1 Cup' },
                  { ml: 200, label: '+200 mL', desc: '1 Glass' },
                  { ml: 250, label: '+250 mL', desc: '1 Mug' }
                ].map(item => (
                  <Button
                    key={item.ml}
                    size="sm"
                    variant="outline"
                    disabled={logging}
                    onClick={() => handleLogFluid(item.ml)}
                    className="h-10 text-xs font-bold border-cyan-200 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 rounded-xl flex flex-col items-center justify-center py-1 active:scale-95 transition-transform"
                  >
                    <span className="leading-tight">{item.label}</span>
                    <span className="text-[9px] font-normal opacity-70 leading-tight">{item.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Input Toggle */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="text-xs text-cyan-700 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {hi ? 'अन्य मात्रा दर्ज करें (कस्टम mL)' : 'Log Custom Amount (mL)'}
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <input
                type="number"
                placeholder="mL (e.g. 120)"
                value={customMl}
                onChange={e => setCustomMl(e.target.value)}
                className="h-8 w-28 text-xs px-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
              <Button
                size="sm"
                onClick={() => {
                  const val = parseInt(customMl);
                  if (val > 0) handleLogFluid(val);
                }}
                disabled={!customMl || logging}
                className="h-8 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg px-3"
              >
                {hi ? 'दर्ज करें' : 'Log'}
              </Button>
              <button
                onClick={() => setShowCustomInput(false)}
                className="text-xs text-gray-400 hover:text-gray-600 ml-1"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Today's Entries Count */}
          <span className="text-[11px] text-gray-500">
            {today_logs.length} {hi ? 'बार दर्ज' : 'entries today'}
          </span>
        </div>

        {/* Recent logs chips */}
        {today_logs.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400 font-semibold">{hi ? 'आज की प्रविष्टियाँ:' : 'Today:'}</span>
            {today_logs.slice(-4).map((l, i) => (
              <span key={i} className="text-[10px] bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 opacity-60" />
                {l.time}: <strong>{l.amount_ml}mL</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Clinical Guidance Footnote */}
      <div className="px-4 py-2 bg-sky-50/70 dark:bg-sky-950/30 border-t border-sky-100 dark:border-sky-900/30 flex items-center gap-2 text-[11px] text-sky-800 dark:text-sky-300">
        <Info className="w-3.5 h-3.5 shrink-0 text-sky-600" />
        <span>
          {hi
            ? 'सलाह: सुबह 1 लीटर के जग में पूरा दिन का पानी मापकर रख लें। दिनभर केवल उसी जग से पानी दें ताकि अधिक पानी न जाए।'
            : 'Clinical Tip: Fill a marked 1-litre water jug every morning. Give fluids only from this jug to prevent fluid overload & edema.'}
        </span>
      </div>
    </Card>
  );
}
