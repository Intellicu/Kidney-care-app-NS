import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star, Volume2, ShieldCheck, Heart } from 'lucide-react';

export default function KidneyBuddy({ 
  mood = 'hero', 
  speech = "Good morning Aarav! Let's do our superhero kidney routine!",
  speechHi = "सुप्रभात आरव! आइए मिलकर आज का रूटीन पूरा करते हैं!",
  hi = false,
  percent = 0,
  onSpeechClick
}) {
  const displaySpeech = hi ? speechHi : speech;

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(displaySpeech);
    u.lang = hi ? 'hi-IN' : 'en-IN';
    u.rate = 0.9;
    u.pitch = 1.1; // friendly cheerful pitch
    window.speechSynthesis.speak(u);
    if (onSpeechClick) onSpeechClick();
  };

  return (
    <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-0.5 rounded-3xl shadow-md">
      <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50/60 dark:from-gray-900 dark:to-gray-800 rounded-[22px] p-3.5 flex items-center gap-3.5">
        {/* Animated Cartoon Kidney Superhero Character */}
        <div className="relative shrink-0">
          <motion.div
            animate={{ 
              y: [0, -4, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3, 
              ease: "easeInOut" 
            }}
            className="w-16 h-16 relative flex items-center justify-center cursor-pointer select-none"
            onClick={handleSpeak}
            title={hi ? "चिंटू से बात करने के लिए टैप करें" : "Tap to listen to Chintu!"}
          >
            {/* SVG Cartoon Kidney Mascot */}
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
              {/* Superhero Cape */}
              <path
                d="M 30,35 Q 10,70 15,85 Q 35,78 45,70 Z"
                fill="#e11d48"
                opacity="0.9"
              />
              <path
                d="M 70,35 Q 90,70 85,85 Q 65,78 55,70 Z"
                fill="#be123c"
                opacity="0.9"
              />

              {/* Kidney Bean Body (Friendly Bean with Natural Hilum Notch) */}
              <path
                d="M 35,20 C 18,22 15,50 25,75 C 32,92 68,95 78,80 C 88,65 85,35 68,22 C 55,12 45,18 35,20 Z"
                fill="url(#kidneyBeanGrad)"
                stroke="#c2410c"
                strokeWidth="2.5"
              />

              {/* Big Expressive Cartoon Eyes */}
              {/* Left Eye */}
              <ellipse cx="42" cy="42" rx="6" ry="8" fill="#ffffff" />
              <circle cx="43" cy="42" r="3.5" fill="#1e293b" />
              <circle cx="44.5" cy="40.5" r="1.2" fill="#ffffff" />

              {/* Right Eye */}
              <ellipse cx="62" cy="42" rx="6" ry="8" fill="#ffffff" />
              <circle cx="61" cy="42" r="3.5" fill="#1e293b" />
              <circle cx="62.5" cy="40.5" r="1.2" fill="#ffffff" />

              {/* Rosy Cheeks */}
              <circle cx="33" cy="52" r="4.5" fill="#fda4af" opacity="0.8" />
              <circle cx="69" cy="52" r="4.5" fill="#fda4af" opacity="0.8" />

              {/* Big Cheerful Smile */}
              {mood === 'cheering' ? (
                <path d="M 43,53 Q 52,65 61,53 Z" fill="#e11d48" stroke="#9f1239" strokeWidth="1.5" />
              ) : (
                <path d="M 44,53 Q 52,62 60,53" fill="none" stroke="#9a3412" strokeWidth="2.5" strokeLinecap="round" />
              )}

              {/* Cute Stethoscope or Hero Star Badge */}
              <circle cx="52" cy="72" r="5" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
              <polygon points="52,69 53,71 55,71 53.5,72.5 54,75 52,73.5 50,75 50.5,72.5 49,71 51,71" fill="#ffffff" />

              {/* Gradients */}
              <defs>
                <linearGradient id="kidneyBeanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="60%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#c2410c" />
                </linearGradient>
              </defs>
            </svg>

            {/* Sparkle badge */}
            <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 p-1 rounded-full shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-950 animate-spin" />
            </div>
          </motion.div>
        </div>

        {/* Speech Bubble */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1">
              <span>🦸‍♂️</span> {hi ? 'चिंटू (किडनी सुपरहीरो)' : 'Chintu the Kidney Buddy'}
            </span>
            <button
              onClick={handleSpeak}
              className="text-[10px] font-bold text-amber-800 bg-amber-200/70 hover:bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
            >
              <Volume2 className="w-3 h-3 text-amber-700 dark:text-amber-300" />
              <span>{hi ? 'बोलें' : 'Listen'}</span>
            </button>
          </div>

          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug">
            "{displaySpeech}"
          </p>

          {/* Quick routine cheer bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-amber-200/60 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
              />
            </div>
            <span className="text-[10px] font-extrabold text-amber-900 dark:text-amber-300 shrink-0">
              {percent}% {hi ? 'पूरा' : 'Done'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
