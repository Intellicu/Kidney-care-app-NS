import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, Stethoscope, Smartphone, Download, ArrowRight,
  TestTube, ShieldCheck, HeartPulse, QrCode, FileText,
  Utensils, CheckCircle2, ChevronRight, Activity, Bell,
  Sparkles, Building2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../context/UserRoleContext';
import { useLanguage } from '../components/shared/LanguageContext';

export default function AppPortal() {
  const navigate = useNavigate();
  const { setRole } = useUserRole();
  const { language, changeLanguage } = useLanguage();
  const hi = language === 'hi';

  const handleSelectApp = (selectedRole, destination) => {
    setRole(selectedRole);
    localStorage.setItem('kidneycare_selected_app', selectedRole);
    navigate(destination);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top AIIMS Patna Header */}
      <div className="max-w-4xl mx-auto w-full pt-4 pb-6 text-center relative">
        <div className="absolute right-0 top-3">
          <Button
            size="sm"
            onClick={() => changeLanguage(hi ? 'en' : 'hi')}
            className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold rounded-xl cursor-pointer"
          >
            {hi ? '🇬🇧 English' : '🇮🇳 हिंदी'}
          </Button>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-3">
          <Building2 className="w-3.5 h-3.5" />
          <span>{hi ? 'एम्स पटना · बाल गुर्दा रोग विभाग' : 'AIIMS Patna · Division of Pediatric Nephrology'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
          {hi ? 'किडनीकेयर एआई सुइट' : 'KidneyCare AI Suite'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl mx-auto">
          {hi
            ? 'एम्स पटना बाल गुर्दा विभाग के तीन समर्पित एप्लिकेशन। अपनी आवश्यकता अनुसार ऐप चुनें या डाउनलोड करें।'
            : 'Three dedicated clinical applications from AIIMS Patna Pediatric Nephrology. Choose your app or download the APK below.'}
        </p>
      </div>

      {/* Three Dedicated App Cards Grid */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-5 my-auto">
        {/* ── APP 1: PATIENTS & CAREGIVERS APP ── */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-800/90 rounded-3xl border border-slate-700/80 p-5 flex flex-col justify-between shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="w-13 h-13 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-2xl font-bold shadow-inner">
                👨‍👩‍👧
              </div>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5">
                {hi ? 'अभिभावक ऐप' : 'Caregiver App'}
              </Badge>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white group-hover:text-blue-400 transition-colors">
              {hi ? 'मरीज़ एवं अभिभावक ऐप' : 'Patient & Caregiver App'}
            </h2>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              {hi
                ? 'नेफ्रोटिक सिंड्रोम और सीकेडी बच्चों के दैनिक घरेलू स्वास्थ्य की निगरानी हेतु।'
                : 'For children with Nephrotic Syndrome / CKD and their families at home.'}
            </p>

            {/* Feature Checklist */}
            <div className="mt-4 space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <TestTube className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? 'मूत्र टेस्ट:' : 'Dipstick Test:'}</strong>{' '}
                  {hi ? 'कैमरा स्ट्रिप व AI प्रोटीन रीडिंग।' : 'Live camera strip & AI protein reading.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? 'दैनिक योजना व वाइटल्स:' : 'Daily Plan & Vitals:'}</strong>{' '}
                  {hi ? 'वजन, बीपी, दवाइयाँ व शिकायतें।' : 'Morning weight, BP, meds & complaints.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? 'दस्तावेज़ स्कैनर:' : 'Doc Scanner:'}</strong>{' '}
                  {hi ? 'पर्चे व लैब रिपोर्ट आर्काइव।' : 'Scan prescriptions & lab reports.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? 'IAP गाइड:' : 'IAP Parent Guide:'}</strong>{' '}
                  {hi ? '10 आधिकारिक प्रश्नोत्तर व ऑडियो।' : '10 clinical FAQs & bilingual audio.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Utensils className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? 'किडनी आहार व पोषण:' : 'Renal Diet & Portions:'}</strong>{' '}
                  {hi ? 'कटोरी व मात्रा अनुसार भोजन लॉग, डॉक्टर कोड व सुरक्षित विकल्प।' : 'Portion-based logging, doctor code sync & smart swaps.'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 pt-4 border-t border-slate-700/60 space-y-2">
            <Button
              onClick={() => handleSelectApp('caregiver', '/Dashboard')}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 text-xs flex items-center justify-center gap-2 group-active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>{hi ? 'मरीज़ ऐप शुरू करें' : 'Launch Patient App'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <a
              href="/KidneyCare-Caregiver.apk"
              download="KidneyCare-Caregiver.apk"
              className="w-full h-9 bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>{hi ? 'मरीज़ APK डाउनलोड करें' : 'Download Patient APK'}</span>
            </a>
          </div>
        </motion.div>

        {/* ── APP 2: STANDALONE NUTRITION & RENAL DIET APP ── */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-800/90 rounded-3xl border border-emerald-500/40 p-5 flex flex-col justify-between shadow-xl relative overflow-hidden group ring-1 ring-emerald-500/30"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="w-13 h-13 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl font-bold shadow-inner">
                🥗
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5">
                {hi ? 'स्वतंत्र पोषण ऐप' : 'Nutrition App'}
              </Badge>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white group-hover:text-emerald-400 transition-colors">
              {hi ? 'किडनीकेयर पोषण ऐप' : 'KidneyCare Nutrition App'}
            </h2>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              {hi
                ? 'PRINT पाठ्यक्रम व ICMR मानकों पर आधारित संपूर्ण बाल गुर्दा आहार व पोषण ऐप।'
                : 'Dedicated renal nutrition app built on PRINT course & ICMR-NIN guidelines.'}
            </p>

            {/* Feature Checklist */}
            <div className="mt-4 space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Utensils className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? '643 भारतीय व्यंजन:' : '643 Renal Foods:'}</strong>{' '}
                  {hi ? 'उत्तर, दक्षिण, पश्चिम के खाद्य पदार्थ।' : 'North, South, West/Central, K & P tables.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Camera className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? 'थाली व प्लेट कैमरा:' : 'AI Plate Scanner:'}</strong>{' '}
                  {hi ? 'भोजन फोटो से नमक व पोषक तत्वों का आकलन।' : 'Instant meal photo detection & sodium audit.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? 'PRINT SDI कैलकुलेटर:' : 'PRINT SDI Engine:'}</strong>{' '}
                  {hi ? '17 आयु वर्ग, डायलिसिस व विकास एडजस्टमेंट।' : '17 age brackets, dialysis & growth scaling.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? 'लीचिंग विधि:' : '4-Step Leaching:'}</strong>{' '}
                  {hi ? 'सब्जियों से पोटेशियम निकालने की गाइड।' : 'Potassium removal protocol & conflicts.'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 pt-4 border-t border-slate-700/60 space-y-2">
            <Button
              onClick={() => handleSelectApp('nutrition', '/NutritionHub')}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 text-xs flex items-center justify-center gap-2 group-active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>{hi ? 'पोषण ऐप शुरू करें' : 'Launch Nutrition App'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <a
              href="/kidneycare_nutrition_app.html"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-8 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>📱</span>
              <span>{hi ? '6-स्टेप स्टैंडअलोन वेब ऐप (सेटअप)' : '6-Step Standalone Web App'}</span>
            </a>

            <a
              href="/KidneyCare-Nutrition.apk"
              download="KidneyCare-Nutrition.apk"
              className="w-full h-9 bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{hi ? 'पोषण APK डाउनलोड करें' : 'Download Nutrition APK'}</span>
            </a>
          </div>
        </motion.div>

        {/* ── APP 3: DOCTORS & OPD STAFF APP ── */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-800/90 rounded-3xl border border-indigo-500/30 p-5 flex flex-col justify-between shadow-xl relative overflow-hidden group ring-1 ring-indigo-500/20"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="w-13 h-13 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-2xl font-bold shadow-inner">
                👨‍⚕️
              </div>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5">
                {hi ? 'डॉक्टर / ओपीडी' : 'Doctor / OPD'}
              </Badge>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white group-hover:text-indigo-400 transition-colors">
              {hi ? 'डॉक्टर एवं ओपीडी कार्यस्थल' : 'Doctor & OPD Workstation'}
            </h2>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              {hi
                ? 'डॉ. स्वर्णिम व एम्स ओपीडी स्टाफ हेतु उच्च क्षमता क्लिनिकल एनकाउंटर।'
                : 'For Dr. Swarnim, Pediatric Nephrologists, and AIIMS OPD nursing staff.'}
            </p>

            {/* Feature Checklist */}
            <div className="mt-4 space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <QrCode className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? 'बारकोड स्कैनर:' : 'Barcode Scanner:'}</strong>{' '}
                  {hi ? 'मरीज़ ओपीडी कार्ड <1 सेकंड में स्कैन।' : 'Instant scan of patient OPD cards.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? 'पंजीकरण:' : '1-Click Registration:'}</strong>{' '}
                  {hi ? 'निदान, प्रारंभिक वाइटल्स व ब्लड ग्रुप।' : 'Fast registration with baseline vitals.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? 'विज़िट टाइमलाइन:' : 'Visits Timeline:'}</strong>{' '}
                  {hi ? 'सूजन ग्रेड, बीपी व स्टेरॉयड बदलाव।' : 'Record edema, BP & steroid doses.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Utensils className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? 'PRINT पोषण प्रिस्क्रिप्शन:' : 'PRINT Nutrition Plan:'}</strong>{' '}
                  {hi ? 'SDI मानक, डॉक्टर कोड व व्हाट्सएप शेयरिंग।' : 'PRINT SDI engine, WhatsApp plan code & C1-C10 rules.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{hi ? 'स्वचालित अलर्ट:' : 'Automated Alerts:'}</strong>{' '}
                  {hi ? '3+ रिलैप्स पर अभिभावक को संदेश।' : 'SMS/WhatsApp alert on 3+ relapse.'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 pt-4 border-t border-slate-700/60 space-y-2">
            <Button
              onClick={() => handleSelectApp('clinician', '/OPDWorkstation')}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 text-xs flex items-center justify-center gap-2 group-active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>{hi ? 'क्लिनिशियन ऐप खोलें' : 'Launch Clinician Workstation'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <a
              href="/KidneyCare-Clinician.apk"
              download="KidneyCare-Clinician.apk"
              className="w-full h-9 bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>{hi ? 'क्लिनिशियन APK डाउनलोड करें' : 'Download Clinician APK'}</span>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="max-w-4xl mx-auto w-full text-center py-4 border-t border-slate-800 text-[11px] text-slate-500">
        KidneyCare AI — AIIMS Patna Pediatric Nephrology Research Project · Principal Investigator: Dr. Swarnim
      </div>
    </div>
  );
}
