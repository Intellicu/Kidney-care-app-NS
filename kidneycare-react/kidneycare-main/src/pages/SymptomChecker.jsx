import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle, AlertTriangle, Loader2, Phone, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LanguageProvider, useLanguage } from '../components/shared/LanguageContext';
import { Link } from 'react-router-dom';

// Symptoms with severity weights for triage
const SYMPTOMS = [
  { id: 'breathing_difficulty', hi: '😮‍💨 सांस लेने में तकलीफ', en: '😮‍💨 Difficulty breathing', weight: 8, severe: true },
  { id: 'rapid_weight_gain',   hi: '⚖️ तेज़ी से वज़न बढ़ना',   en: '⚖️ Rapid weight gain',    weight: 7, severe: true },
  { id: 'swelling',            hi: '🫧 सूजन (चेहरा/पैर/हाथ)', en: '🫧 Swelling (face/legs)',  weight: 6, severe: true },
  { id: 'fever',               hi: '🌡️ बुखार',                 en: '🌡️ Fever',                weight: 5, severe: true },
  { id: 'urine_very_low',      hi: '💧 पेशाब बहुत कम (8+ घंटे)', en: '💧 Very little urine 8+hrs', weight: 8, severe: true },
  { id: 'vomiting',            hi: '🤢 उल्टी / जी मिचलाना',  en: '🤢 Vomiting / nausea',    weight: 4, severe: false },
  { id: 'urine_changes',       hi: '🫗 पेशाब में झाग या लाल', en: '🫗 Foamy or red urine',   weight: 5, severe: false },
  { id: 'appetite_loss',       hi: '🍽️ भूख न लगना',           en: '🍽️ Loss of appetite',     weight: 3, severe: false },
  { id: 'headache',            hi: '🤕 सिरदर्द',              en: '🤕 Headache',              weight: 3, severe: false },
  { id: 'irritable',           hi: '😤 बहुत चिड़चिड़ापन',    en: '😤 Very irritable',        weight: 2, severe: false },
];

function getTriageLevel(score) {
  if (score >= 15) return 'emergency';
  if (score >= 9)  return 'urgent';
  if (score >= 4)  return 'watch';
  return 'home';
}

const TRIAGE = {
  emergency: {
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    border: 'border-red-200',
    emoji: '🚨',
    hi: 'EMERGENCY: अभी अस्पताल जाएँ',
    en: 'EMERGENCY: Go to hospital NOW',
    actionHi: 'अभी Call करें — 112',
    actionEn: 'Call now — 112',
    callNumber: '112',
  },
  urgent: {
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    border: 'border-orange-200',
    emoji: '⚠️',
    hi: 'आज डॉक्टर को दिखाएँ',
    en: 'See doctor today',
    actionHi: 'Doctor को WhatsApp करें',
    actionEn: 'WhatsApp your doctor',
    callNumber: null,
  },
  watch: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    border: 'border-yellow-200',
    emoji: '👁️',
    hi: 'नज़र रखें। कल डॉक्टर को बताएँ।',
    en: 'Monitor. Tell doctor tomorrow.',
    actionHi: null,
    actionEn: null,
    callNumber: null,
  },
  home: {
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    border: 'border-green-200',
    emoji: '🏠',
    hi: 'घर पर आराम करें। Test जारी रखें।',
    en: 'Rest at home. Keep testing.',
    actionHi: null,
    actionEn: null,
    callNumber: null,
  },
};

function PreHospitalCard({ hi, patientPhone }) {
  const steps = hi ? [
    'आज का dipstick result screenshot लें',
    'पिछले 7 दिन की strip photos',
    'आज की दवा दी या नहीं — note करें',
    'वज़न note करें',
    'सूजन कब से है — note करें',
  ] : [
    'Screenshot today\'s dipstick result',
    'Last 7 days strip photos',
    'Note if today\'s medicine was given',
    'Note current weight',
    'Note since when swelling started',
  ];

  const waMsg = encodeURIComponent(hi
    ? 'नमस्ते, मेरे बच्चे की स्थिति के बारे में बताना था। KidneyCare app से रिपोर्ट भेज रहा/रही हूँ।'
    : 'Hello, I need to share an update about my child\'s condition from KidneyCare.');

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mt-4">
      <p className="font-semibold text-gray-800 text-sm mb-3">
        📋 {hi ? 'Doctor के पास जाने से पहले:' : 'Before going to the doctor:'}
      </p>
      <ul className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            {s}
          </li>
        ))}
      </ul>
      <a
        href={`https://wa.me/?text=${waMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 bg-green-500 text-white font-semibold rounded-xl py-3 w-full text-sm"
      >
        <MessageSquare className="w-4 h-4" />
        {hi ? 'Doctor को WhatsApp करें' : 'WhatsApp your doctor'}
      </a>
    </div>
  );
}

function SymptomCheckerContent() {
  const { language } = useLanguage();
  const hi = language === 'hi';
  const [selected, setSelected] = useState([]);
  const [step, setStep] = useState('select'); // 'select' | 'result'
  const [saving, setSaving] = useState(false);

  const { data: patient } = useQuery({
    queryKey: ['currentPatient'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const patients = await base44.entities.Patient.filter({ created_by: user.email });
      return patients[0];
    }
  });

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const score = SYMPTOMS.filter(s => selected.includes(s.id)).reduce((sum, s) => sum + s.weight, 0);
  const triageLevel = getTriageLevel(score);
  const triage = TRIAGE[triageLevel];

  const handleSubmit = async () => {
    setSaving(true);
    const severity = triageLevel === 'emergency' ? 'severe' : triageLevel === 'urgent' ? 'moderate' : selected.length > 0 ? 'mild' : 'normal';
    if (patient) {
      await base44.entities.HealthMetric.create({
        patient_id: patient.id,
        metric_type: 'Symptoms',
        value: triageLevel,
        symptoms_list: selected,
        severity,
        recorded_at: new Date().toISOString()
      });
      if (triageLevel === 'emergency' || triageLevel === 'urgent') {
        await base44.entities.Alert.create({
          patient_id: patient.id,
          alert_type: 'Severe Symptoms',
          severity: triageLevel === 'emergency' ? 'critical' : 'high',
          message: `Symptoms reported: ${selected.join(', ')} (score: ${score})`,
          alert_color: triageLevel === 'emergency' ? 'red' : 'orange',
          details: { symptoms: selected, triage_score: score, triage_level: triageLevel }
        });
      }
    }
    setSaving(false);
    setStep('result');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <Link to="/">
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </Link>
        <div>
          <h1 className="font-bold text-gray-900">{hi ? 'लक्षण जाँच' : 'Symptom Check'}</h1>
          <p className="text-xs text-gray-400">{hi ? 'आज के लक्षण चुनें' : 'Select today\'s symptoms'}</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-5">
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              {/* Live triage indicator */}
              {selected.length > 0 && (
                <div className={`${triage.bgColor} ${triage.border} border rounded-2xl px-4 py-3 mb-4 flex items-center gap-3`}>
                  <span className="text-2xl">{triage.emoji}</span>
                  <p className={`font-semibold text-sm ${triage.textColor}`}>
                    {hi ? triage.hi : triage.en}
                  </p>
                </div>
              )}

              <p className="text-sm font-semibold text-gray-500 mb-3">
                {hi ? 'आज जो भी तकलीफ हो उसे चुनें:' : 'Select all symptoms present today:'}
              </p>

              <div className="space-y-2">
                {SYMPTOMS.map((symptom) => {
                  const active = selected.includes(symptom.id);
                  return (
                    <button
                      key={symptom.id}
                      onClick={() => toggle(symptom.id)}
                      className={`w-full flex items-center gap-3 rounded-2xl px-4 py-4 border-2 text-left transition-all ${
                        active
                          ? symptom.severe ? 'bg-red-50 border-red-400' : 'bg-blue-50 border-blue-400'
                          : 'bg-white border-gray-100'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        active ? (symptom.severe ? 'bg-red-500 border-red-500' : 'bg-blue-500 border-blue-500') : 'border-gray-300'
                      }`}>
                        {active && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`font-medium text-sm flex-1 ${active ? 'text-gray-900' : 'text-gray-600'}`}>
                        {hi ? symptom.hi : symptom.en}
                      </span>
                      {symptom.severe && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium shrink-0">
                          {hi ? 'गंभीर' : 'Serious'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="mt-5 w-full h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-base flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (hi ? 'जमा करें' : 'Submit')}
              </button>

              {selected.length === 0 && (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="mt-2 w-full py-3 text-sm text-gray-400 underline"
                >
                  {hi ? 'कोई तकलीफ नहीं' : 'No symptoms today'}
                </button>
              )}
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className={`w-28 h-28 ${triage.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl`}>
                <span className="text-5xl">{triage.emoji}</span>
              </div>
              <h2 className={`text-xl font-bold mb-2 ${triage.textColor}`}>
                {hi ? triage.hi : triage.en}
              </h2>
              {score > 0 && (
                <p className="text-sm text-gray-500 mb-4">
                  {hi ? `लक्षण गंभीरता: ${score}` : `Symptom severity score: ${score}`}
                </p>
              )}

              {/* Emergency action */}
              {triage.callNumber && (
                <a href={`tel:${triage.callNumber}`}
                  className="flex items-center justify-center gap-2 bg-red-500 text-white font-bold rounded-2xl py-4 w-full mb-3 text-base">
                  <Phone className="w-5 h-5" />
                  {hi ? triage.actionHi : triage.actionEn}
                </a>
              )}

              {/* Pre-hospital checklist for urgent/emergency */}
              {(triageLevel === 'emergency' || triageLevel === 'urgent') && (
                <PreHospitalCard hi={hi} patientPhone={patient?.caregiver_phone} />
              )}

              <Link to="/" className="mt-5 block text-sm text-blue-500 underline">
                {hi ? 'होम पर जाएँ' : 'Go to Home'}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function SymptomChecker() {
  return (
    <LanguageProvider>
      <SymptomCheckerContent />
    </LanguageProvider>
  );
}