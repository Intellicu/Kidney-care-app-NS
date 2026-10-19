import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Mic, Globe, Shield, User, Pill, Bell, Check, Plus, X, Sun, Moon, ChevronRight, ChevronLeft, Stethoscope, Camera, Loader2, Phone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '../components/shared/ThemeContext';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', letter: 'E' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', letter: 'ह' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', letter: 'ব' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', letter: 'த' },
];

const DRUG_OPTIONS = [
  'Prednisolone', 'Tacrolimus', 'Cyclosporine', 'Mycophenolate',
  'Rituximab', 'Levamisole', 'ACE Inhibitor', 'Furosemide',
  'Atorvastatin', 'Calcium', 'Vitamin D', 'Other'
];

const FREQ_OPTIONS = ['Once a day', 'Twice a day', 'Three times a day', 'Alternate days', 'Once a week'];

const DIAGNOSIS_OPTIONS = [
  { value: 'SSNS', label: 'SSNS', sub: 'Steroid Sensitive' },
  { value: 'FRNS', label: 'FRNS', sub: 'Frequent Relapse' },
  { value: 'SDNS', label: 'SDNS', sub: 'Steroid Dependent' },
  { value: 'SRNS', label: 'SRNS', sub: 'Steroid Resistant' },
];

const STEPS = [
  { id: 'language', icon: Globe, title: 'Choose Language', titleHi: 'भाषा चुनें', emoji: '🌐' },
  { id: 'consent', icon: Shield, title: 'Your Privacy', titleHi: 'आपकी गोपनीयता', emoji: '🔒' },
  { id: 'profile', icon: User, title: 'Patient Info', titleHi: 'मरीज़ की जानकारी', emoji: '👤' },
  { id: 'diagnosis', icon: Stethoscope, title: 'Diagnosis', titleHi: 'निदान', emoji: '🩺' },
  { id: 'doctor', icon: Phone, title: "Doctor's Contact", titleHi: 'डॉक्टर की जानकारी', emoji: '👨‍⚕️' },
  { id: 'medications', icon: Pill, title: 'Medications', titleHi: 'दवाइयाँ', emoji: '💊' },
  { id: 'reminder', icon: Bell, title: 'Daily Reminder', titleHi: 'दैनिक अनुस्मारक', emoji: '⏰' },
];

export default function Onboarding() {
  const { isDark, toggleTheme } = useTheme();
  const [role, setRole] = useState(null); // null = picker, 'patient' | 'clinician'
  const [lang, setLang] = useState(() => localStorage.getItem('kidneycare_language') || 'en');
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [listening, setListening] = useState(false);
  const [profile, setProfile] = useState({
    name: '', caregiver_name: '', phone: '',
    dob: '', gender: '', weight: '', height: '',
    ns_classification: '',
    consent_health_data: false,
    consent_share_clinician: false,
    consent_ai_analysis: false,
    language_preference: 'en', daily_checkin_time: '08:00',
    doctor_name: '', doctor_phone: ''
  });
  const [medications, setMedications] = useState([]);
  const [newMed, setNewMed] = useState({ drug_name: '', dose: '', frequency: 'Once a day' });
  const [medPhotoUrl, setMedPhotoUrl] = useState('');
  const [uploadingMedPhoto, setUploadingMedPhoto] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const recRef = useRef(null);
  const hi = lang === 'hi';

  const bg = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const inp = isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const sub = isDark ? 'text-gray-400' : 'text-gray-500';
  const chip = (active) => active
    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 font-semibold'
    : isDark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-200 text-gray-600 hover:border-gray-400';

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const canContinue = () => {
    if (currentStep.id === 'consent') {
      return profile.consent_health_data && profile.consent_share_clinician && profile.consent_ai_analysis;
    }
    return true;
  };

  const goNext = () => { setDirection(1); setStep(s => Math.min(s + 1, STEPS.length - 1)); };
  const goPrev = () => { setDirection(-1); setStep(s => Math.max(s - 1, 0)); };

  const listenField = (field) => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = hi ? 'hi-IN' : 'en-US';
    rec.onstart = () => setListening(field);
    rec.onresult = (e) => { setProfile(p => ({ ...p, [field]: e.results[0][0].transcript })); setListening(false); };
    rec.onerror = rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
  };

  const handleLangChange = (code) => {
    setLang(code);
    setProfile(p => ({ ...p, language_preference: code }));
    localStorage.setItem('kidneycare_language', code);
  };

  const handleMedPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingMedPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setMedPhotoUrl(file_url);
    setUploadingMedPhoto(false);
  };

  const addMed = () => {
    if (!newMed.drug_name || !newMed.dose) return;
    setMedications(prev => [...prev, { ...newMed, image_url: medPhotoUrl || undefined }]);
    setNewMed({ drug_name: '', dose: '', frequency: 'Once a day' });
    setMedPhotoUrl('');
    setShowMedForm(false);
  };

  const handleFinish = async () => {
    setLoading(true);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) { base44.auth.redirectToLogin(window.location.href); return; }
    const patient = await base44.entities.Patient.create({
      name: profile.name || 'Patient',
      caregiver_name: profile.caregiver_name,
      phone: profile.phone || 'unknown',
      dob: profile.dob,
      gender: profile.gender,
      height_cm: parseFloat(profile.height) || undefined,
      weight_kg: parseFloat(profile.weight) || undefined,
      ns_classification: profile.ns_classification || 'Unknown',
      consent_provided: profile.consent_health_data && profile.consent_share_clinician && profile.consent_ai_analysis,
      language_preference: lang,
      daily_checkin_time: profile.daily_checkin_time,
      doctor_name: profile.doctor_name || undefined,
      doctor_phone: profile.doctor_phone || undefined,
      onboarding_complete: true,
      user_role: 'patient'
    });
    for (const med of medications) {
      await base44.entities.Medication.create({ ...med, patient_id: patient.id, active: true });
    }
    window.location.href = '/Dashboard';
  };

  const VoiceBtn = ({ field }) => (
    <button onClick={() => listenField(field)}
      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${listening === field ? 'bg-red-500 animate-pulse' : isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
      <Mic className={`w-4 h-4 ${listening === field ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-500'}`} />
    </button>
  );

  const TextField = ({ field, placeholder, type = 'text' }) => (
    <div className="flex items-center gap-2">
      <input type={type} value={profile[field] || ''}
        onChange={e => setProfile(p => ({ ...p, [field]: e.target.value }))}
        placeholder={placeholder}
        className={`flex-1 border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${inp}`}
        style={type === 'date' ? { colorScheme: isDark ? 'dark' : 'light' } : {}} />
      <VoiceBtn field={field} />
    </div>
  );

  const slideVariants = {
    enter: (d) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'language':
        return (
          <div className="space-y-3">
            <p className={`text-sm text-center mb-4 ${sub}`}>Select your preferred language</p>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => handleLangChange(l.code)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${chip(lang === l.code)}`}>
                  <span className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center font-bold text-cyan-600">{l.letter}</span>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{l.native}</p>
                    <p className={`text-xs ${sub}`}>{l.name}</p>
                  </div>
                  {lang === l.code && <Check className="w-4 h-4 text-cyan-500 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        );

      case 'consent': {
        const consentItems = [
          {
            key: 'consent_health_data',
            en: "I consent to my child's health data (urine test results, medications, symptoms) being stored securely in this app.",
            hi: 'मैं अपने बच्चे का स्वास्थ्य डेटा (पेशाब जाँच, दवाइयाँ, लक्षण) इस ऐप में सुरक्षित रखने के लिए सहमत हूँ।',
          },
          {
            key: 'consent_share_clinician',
            en: 'I consent to this health data being shared with our treating clinician at AIIMS Patna for monitoring and care decisions.',
            hi: 'मैं इस डेटा को AIIMS Patna के डॉक्टर के साथ देखभाल के लिए साझा करने के लिए सहमत हूँ।',
          },
          {
            key: 'consent_ai_analysis',
            en: 'I consent to anonymised photographs of the dipstick being analysed by AI to read the protein level.',
            hi: 'मैं पेशाब जाँच की गुमनाम फोटो को AI द्वारा प्रोटीन स्तर जाँचने के लिए सहमत हूँ।',
          },
        ];
        return (
          <div className="space-y-4">
            <div className={`rounded-2xl p-4 border ${isDark ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                {hi ? 'डेटा संरक्षक' : 'Data Fiduciary'}
              </p>
              <p className={`text-sm font-semibold ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>
                IntelliCU Health Technologies Pvt. Ltd.
              </p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>contact@intellicu.in</p>
              <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                {hi
                  ? 'यह ऐप DPDP Act 2023 के अनुसार संचालित है। आपका डेटा बिना सहमति के कभी साझा नहीं किया जाएगा।'
                  : 'This app operates under the DPDP Act 2023. Your data is never shared without consent.'}
              </p>
            </div>
            {consentItems.map(item => (
              <button key={item.key}
                onClick={() => setProfile(p => ({ ...p, [item.key]: !p[item.key] }))}
                className={`w-full flex items-start gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all ${profile[item.key] ? 'border-cyan-500 bg-cyan-500/10' : isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${profile[item.key] ? 'border-cyan-500 bg-cyan-500' : isDark ? 'border-gray-600' : 'border-gray-400'}`}>
                  {profile[item.key] && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-sm leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {hi ? item.hi : item.en}
                </span>
              </button>
            ))}
            {!(profile.consent_health_data && profile.consent_share_clinician && profile.consent_ai_analysis) && (
              <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {hi ? 'आगे बढ़ने के लिए तीनों से सहमत हों' : 'Please agree to all three to continue'}
              </p>
            )}
          </div>
        );
      }

      case 'profile':
        return (
          <div className="space-y-3">
            <TextField field="name" placeholder={hi ? 'मरीज़ का पूरा नाम' : 'Patient full name'} />
            <TextField field="caregiver_name" placeholder={hi ? 'देखभालकर्ता का नाम (वैकल्पिक)' : 'Caregiver name (optional)'} />
            <TextField field="phone" placeholder={hi ? 'फ़ोन / WhatsApp' : 'Phone / WhatsApp'} type="tel" />
            <div className="flex gap-2">
              <div className="flex-1">
                <p className={`text-xs mb-1.5 ${sub}`}>{hi ? 'जन्म तिथि' : 'Date of Birth'}</p>
                <input type="date" value={profile.dob} onChange={e => setProfile(p => ({ ...p, dob: e.target.value }))}
                  className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 ${inp}`}
                  style={{ colorScheme: isDark ? 'dark' : 'light' }} />
              </div>
              <div className="flex-1">
                <p className={`text-xs mb-1.5 ${sub}`}>{hi ? 'लिंग' : 'Sex'}</p>
                <div className="flex gap-1.5">
                  {[['M', 'Male'], ['F', 'Female'], ['O', 'Other']].map(([k, v]) => (
                    <button key={k} onClick={() => setProfile(p => ({ ...p, gender: v }))}
                      className={`flex-1 py-3 rounded-2xl border text-sm font-semibold transition-all ${chip(profile.gender === v)}`}>{k}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <input value={profile.weight} onChange={e => setProfile(p => ({ ...p, weight: e.target.value }))}
                placeholder={hi ? 'वज़न (kg)' : 'Weight (kg)'} type="number"
                className={`flex-1 border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 ${inp}`} />
              <input value={profile.height} onChange={e => setProfile(p => ({ ...p, height: e.target.value }))}
                placeholder={hi ? 'ऊँचाई (cm)' : 'Height (cm)'} type="number"
                className={`flex-1 border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 ${inp}`} />
            </div>
          </div>
        );

      case 'diagnosis':
        return (
          <div className="space-y-3">
            <p className={`text-sm text-center mb-2 ${sub}`}>{hi ? 'अपना निदान चुनें (वैकल्पिक)' : 'Select your diagnosis (optional)'}</p>
            <div className="grid grid-cols-2 gap-3">
              {DIAGNOSIS_OPTIONS.map(d => (
                <button key={d.value} onClick={() => setProfile(p => ({ ...p, ns_classification: p.ns_classification === d.value ? '' : d.value }))}
                  className={`p-4 rounded-2xl border text-left transition-all ${chip(profile.ns_classification === d.value)}`}>
                  <p className="font-bold text-base">{d.label}</p>
                  <p className={`text-xs mt-0.5 ${sub}`}>{d.sub}</p>
                  {profile.ns_classification === d.value && <Check className="w-4 h-4 text-cyan-500 mt-2" />}
                </button>
              ))}
            </div>
          </div>
        );

      case 'doctor':
        return (
          <div className="space-y-4">
            <p className={`text-sm text-center mb-2 ${sub}`}>
              {hi ? 'डॉक्टर की जानकारी दर्ज करें (वैकल्पिक)' : 'Enter your doctor\'s contact (optional)'}
            </p>
            <div className={`rounded-2xl p-4 border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-indigo-50 border-indigo-100'}`}>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-indigo-700'}`}>
                {hi
                  ? 'डॉक्टर का नाम और नंबर जोड़ने से आप SOS बटन का उपयोग करके सीधे संपर्क कर सकते हैं।'
                  : "Adding your doctor's details lets you reach them directly via the SOS button."}
              </p>
            </div>
            <div>
              <p className={`text-xs mb-1.5 ${sub}`}>{hi ? 'डॉक्टर का नाम' : "Doctor's name"}</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={profile.doctor_name}
                  onChange={e => setProfile(p => ({ ...p, doctor_name: e.target.value }))}
                  placeholder={hi ? 'जैसे: Dr. Sanjay Sharma' : 'e.g. Dr. Sanjay Sharma'}
                  className={`flex-1 border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${inp}`}
                />
                <VoiceBtn field="doctor_name" />
              </div>
            </div>
            <div>
              <p className={`text-xs mb-1.5 ${sub}`}>{hi ? 'डॉक्टर का फोन / WhatsApp' : "Doctor's phone / WhatsApp"}</p>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={profile.doctor_phone}
                  onChange={e => setProfile(p => ({ ...p, doctor_phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className={`flex-1 border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${inp}`}
                />
                <VoiceBtn field="doctor_phone" />
              </div>
            </div>
          </div>
        );

      case 'medications':
        return (
          <div className="space-y-3">
            {medications.length === 0 && !showMedForm && (
              <p className={`text-sm text-center py-4 ${sub}`}>{hi ? 'कोई दवा नहीं जोड़ी गई' : 'No medications added yet'}</p>
            )}
            {medications.map((m, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                {m.image_url ? (
                  <img src={m.image_url} alt={m.drug_name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <Pill className="w-4 h-4 text-cyan-500 shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.drug_name}</p>
                  <p className={`text-xs ${sub}`}>{m.dose} · {m.frequency}</p>
                </div>
                <button onClick={() => setMedications(prev => prev.filter((_, j) => j !== i))}>
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}

            {showMedForm ? (
              <div className={`rounded-2xl border p-4 space-y-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* Prescription / Bottle photo scan */}
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${sub}`}>
                    📷 {hi ? 'दवा की बोतल / पर्चे की फोटो (वैकल्पिक)' : 'Scan bottle / prescription photo (optional)'}
                  </p>
                  <label className="block cursor-pointer">
                    <input type="file" accept="image/*" capture="camera" className="hidden" onChange={handleMedPhoto} />
                    <div className={`rounded-xl border-2 border-dashed h-24 flex items-center justify-center transition-all overflow-hidden
                      ${medPhotoUrl ? 'border-green-400' : isDark ? 'border-gray-600 hover:border-cyan-700' : 'border-gray-300 hover:border-cyan-400 bg-gray-50'}`}>
                      {uploadingMedPhoto ? (
                        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                      ) : medPhotoUrl ? (
                        <div className="relative w-full h-full">
                          <img src={medPhotoUrl} alt="Med" className="w-full h-full object-cover rounded-xl" />
                          <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <button onClick={e => { e.preventDefault(); setMedPhotoUrl(''); }}
                            className="absolute top-1 left-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Camera className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                          <p className={`text-xs ${sub}`}>{hi ? 'टैप करें' : 'Tap to scan'}</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                <p className={`text-xs font-semibold uppercase tracking-wide ${sub}`}>{hi ? 'दवा का नाम' : 'Drug Name'}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {DRUG_OPTIONS.map(d => (
                    <button key={d} onClick={() => setNewMed(m => ({ ...m, drug_name: d }))}
                      className={`py-2 px-2 rounded-xl border text-xs transition-all ${chip(newMed.drug_name === d)}`}>{d}</button>
                  ))}
                </div>
                {newMed.drug_name === 'Other' && (
                  <input value={newMed.customName || ''} onChange={e => setNewMed(m => ({ ...m, drug_name: e.target.value }))}
                    placeholder={hi ? 'दवा का नाम लिखें' : 'Enter drug name'}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 ${inp}`} />
                )}
                <input value={newMed.dose} onChange={e => setNewMed(m => ({ ...m, dose: e.target.value }))}
                  placeholder={hi ? 'खुराक (जैसे 20mg)' : 'Dose (e.g. 20mg)'}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 ${inp}`} />
                <div className="flex flex-wrap gap-1.5">
                  {FREQ_OPTIONS.map(f => (
                    <button key={f} onClick={() => setNewMed(m => ({ ...m, frequency: f }))}
                      className={`py-1.5 px-3 rounded-xl border text-xs transition-all ${chip(newMed.frequency === f)}`}>{f}</button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setShowMedForm(false); setMedPhotoUrl(''); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm border ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                    {hi ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button onClick={addMed} disabled={!newMed.drug_name || !newMed.dose}
                    className="flex-1 py-2.5 rounded-xl text-sm bg-cyan-500 text-black font-bold disabled:opacity-40">
                    {hi ? 'जोड़ें' : 'Add'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowMedForm(true)}
                className={`w-full py-3.5 rounded-2xl border-2 border-dashed text-sm flex items-center justify-center gap-2 transition-all ${isDark ? 'border-cyan-800 text-cyan-400 hover:bg-cyan-500/10' : 'border-cyan-400 text-cyan-600 hover:bg-cyan-50'}`}>
                <Plus className="w-4 h-4" />{hi ? '+ दवा जोड़ें' : '+ Add Medication'}
              </button>
            )}
          </div>
        );

      case 'reminder':
        return (
          <div className="space-y-4">
            <p className={`text-sm text-center ${sub}`}>{hi ? 'रोज़ाना जाँच का समय चुनें' : 'When should we remind you daily?'}</p>
            <input type="time" value={profile.daily_checkin_time}
              onChange={e => setProfile(p => ({ ...p, daily_checkin_time: e.target.value }))}
              className={`w-full border rounded-2xl px-4 py-4 text-2xl font-bold text-center focus:outline-none focus:border-cyan-500 ${inp}`}
              style={{ colorScheme: isDark ? 'dark' : 'light' }} />
            <div className="grid grid-cols-3 gap-3">
              {[{ label: hi ? 'सुबह' : 'Morning', emoji: '🌅', t: '07:00' },
                { label: hi ? 'दोपहर' : 'Afternoon', emoji: '☀️', t: '13:00' },
                { label: hi ? 'शाम' : 'Evening', emoji: '🌆', t: '19:00' }].map(s => (
                <button key={s.t} onClick={() => setProfile(p => ({ ...p, daily_checkin_time: s.t }))}
                  className={`flex flex-col items-center py-4 rounded-2xl border transition-all ${chip(profile.daily_checkin_time === s.t)}`}>
                  <span className="text-2xl mb-1">{s.emoji}</span>
                  <span className="text-sm font-semibold">{s.label}</span>
                  <span className={`text-xs ${sub}`}>{s.t}</span>
                </button>
              ))}
            </div>
          </div>
        );

      default: return null;
    }
  };

  // Role picker screen shown before onboarding steps
  if (!role) {
    return (
      <div className={`min-h-screen w-full ${bg} flex flex-col items-center justify-center px-6`} style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="w-16 h-16 bg-cyan-500/10 rounded-3xl flex items-center justify-center mb-4">
          <span className="text-4xl">🫘</span>
        </div>
        <h1 className={`text-2xl font-bold mb-1 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>KidneyCare</h1>
        <p className={`text-sm mb-8 text-center ${sub}`}>AIIMS Patna — Nephrotic Syndrome</p>
        <p className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>I am a...</p>
        <div className="w-full max-w-sm space-y-3">
          <button onClick={() => setRole('patient')}
            className="w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all">
            <span className="text-3xl">👨‍👩‍👧</span>
            <div className="text-left">
              <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{hi ? 'माता-पिता / देखभालकर्ता' : 'Parent / Caregiver'}</p>
              <p className={`text-xs ${sub}`}>{hi ? 'मरीज़ की देखभाल करने वाले' : 'Managing a child with NS'}</p>
            </div>
          </button>
          <button onClick={() => { window.location.href = '/ClinicianDashboard'; }}
            className="w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all">
            <span className="text-3xl">🩺</span>
            <div className="text-left">
              <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{hi ? 'डॉक्टर / क्लिनिशियन' : 'Doctor / Clinician'}</p>
              <p className={`text-xs ${sub}`}>{hi ? 'AIIMS Patna — पीडियाट्रिक नेफ्रोलॉजी' : 'AIIMS Patna — Pediatric Nephrology'}</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full ${bg} flex flex-col`} style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top bar */}
      <div className={`sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button onClick={goPrev} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <p className={`text-xs font-medium ${sub}`}>{hi ? 'चरण' : 'Step'} {step + 1} / {STEPS.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-600'}`}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {!isLast && currentStep.id !== 'consent' && (
            <button onClick={goNext} className={`text-xs px-3 py-1.5 rounded-full border ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
              {hi ? 'छोड़ें' : 'Skip'}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className={`h-1 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div className="h-1 bg-cyan-500 transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      {/* Step header */}
      <div className={`px-6 pt-8 pb-4 text-center`}>
        <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border-2 border-cyan-500/20 flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">{currentStep.emoji}</span>
        </div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {hi ? currentStep.titleHi : currentStep.title}
        </h2>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className={`fixed bottom-0 left-0 right-0 px-4 py-4 border-t ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-2xl mx-auto flex gap-3">
          {!isLast ? (
            <>
              {currentStep.id !== 'consent' && (
                <button onClick={goNext}
                  className={`px-5 py-3.5 rounded-2xl text-sm border ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                  {hi ? 'छोड़ें' : 'Skip'}
                </button>
              )}
              <button onClick={goNext} disabled={!canContinue()}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-cyan-500 text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                {hi ? 'आगे' : 'Continue'} <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button onClick={handleFinish} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-cyan-500 text-black font-bold text-sm disabled:opacity-50">
              {loading ? (hi ? 'सेव हो रहा है...' : 'Saving...') : (<>{hi ? 'सेटअप पूरा करें' : 'Finish Setup'} <Check className="w-4 h-4" /></>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}