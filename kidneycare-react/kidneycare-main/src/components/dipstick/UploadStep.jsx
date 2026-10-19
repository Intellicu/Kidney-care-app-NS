import React, { useState } from 'react';
import { Camera, Upload, CheckCircle, Loader2, X, AlertTriangle, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '../shared/ThemeContext';
import { useLanguage } from '../shared/LanguageContext';

const PROTEIN_LEVELS = [
  { level: 'Negative', color: '#facc15', desc: 'Negative – No protein', descHi: 'नकारात्मक – कोई प्रोटीन नहीं' },
  { level: 'Trace', color: '#a3e635', desc: 'Trace – Very small amount', descHi: 'ट्रेस – बहुत कम मात्रा' },
  { level: '1+', color: '#4ade80', desc: '1+ Mild protein', descHi: '1+ हल्का प्रोटीन' },
  { level: '2+', color: '#2dd4bf', desc: '2+ Moderate protein', descHi: '2+ मध्यम प्रोटीन' },
  { level: '3+', color: '#60a5fa', desc: '3+ High protein', descHi: '3+ अधिक प्रोटीन' },
  { level: '4+', color: '#a78bfa', desc: '4+ Very high protein', descHi: '4+ बहुत अधिक प्रोटीन' },
];

export default function UploadStep({ onComplete, patientId }) {
  const { isDark } = useTheme();
  const { language } = useLanguage();
  const lang = language;

  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [saving, setSaving] = useState(false);

  const bg = isDark ? 'bg-gray-950' : 'bg-gray-50';
  const card = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const heading = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-gray-400' : 'text-gray-500';

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (type === 'before') {
      setBeforeImage(file_url);
    } else {
      setAfterImage(file_url);
      // Attempt AI analysis of the dipstick image
      setAnalyzing(true);
      setAnalysisError(false);
      setAiSuggested(false);
      try {
        const result = await base44.functions.invoke('analyzeDipstickImage', { image_url: file_url });
        if (result?.protein_level) {
          setSelectedLevel(result.protein_level);
          setAiSuggested(true);
        } else {
          setAnalysisError(true);
        }
      } catch {
        setAnalysisError(true);
      } finally {
        setAnalyzing(false);
      }
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!afterImage || !selectedLevel) return;
    setSaving(true);

    const result = await base44.entities.DipstickResult.create({
      patient_id: patientId,
      image_before_url: beforeImage || null,
      image_after_url: afterImage,
      protein_level: selectedLevel,
      confidence: 1.0,
      file_type: 'Image_Upload',
      alert_triggered: ['2+', '3+', '4+'].includes(selectedLevel)
    });

    // Evaluate 3-consecutive-day alert
    try {
      await base44.functions.invoke('evaluateAlertRules', { patient_id: patientId, trigger: 'DipstickResult' });
    } catch (e) { /* non-blocking */ }

    // WhatsApp share if abnormal
    if (['2+', '3+', '4+'].includes(selectedLevel) && patientId) {
      try {
        const patients = await base44.entities.Patient.filter({ id: patientId });
        const patient = patients[0];
        if (patient?.caregiver_whatsapp) {
          const msg = lang === 'hi'
            ? `KidneyCare अलर्ट: ${patient.name} की डिपस्टिक जाँच का परिणाम *${selectedLevel}* है। कृपया अपने डॉक्टर से संपर्क करें।`
            : `KidneyCare Alert: Dipstick result for ${patient.name} is *${selectedLevel}*. Please contact your clinician.`;
          await base44.functions.invoke('whatsappWebhook', { type: 'send_alert', to: patient.caregiver_whatsapp, message: msg, image_url: afterImage });
        }
      } catch (e) { /* non-blocking */ }
    }

    setSaving(false);
    onComplete(result);
  };

  const canSubmit = !!afterImage && !!selectedLevel && !saving && !uploading;

  const ImageUploadBox = ({ type, image, label, optional }) => (
    <div className="flex-1">
      <div className="flex items-center gap-1 mb-1">
        <p className={`text-xs font-medium ${heading}`}>{label}</p>
        {optional && <span className={`text-xs ${sub}`}>({lang === 'hi' ? 'वैकल्पिक' : 'optional'})</span>}
      </div>
      <label className="block cursor-pointer">
        <input type="file" accept="image/*" capture="camera" className="hidden" onChange={e => handleUpload(e, type)} />
        <div className={`rounded-xl border-2 border-dashed h-28 flex flex-col items-center justify-center transition-all ${image ? 'border-green-400 p-0 overflow-hidden' : isDark ? 'border-gray-700 hover:border-cyan-600' : 'border-gray-300 hover:border-cyan-400'}`}>
          {image ? (
            <div className="relative w-full h-full">
              <img src={image} alt={label} className="w-full h-full object-cover rounded-xl" />
              <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <button onClick={e => { e.preventDefault(); type === 'before' ? setBeforeImage(null) : setAfterImage(null); }}
                className="absolute top-1.5 left-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ) : (
            <>
              <Camera className={`w-7 h-7 mb-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-xs ${sub}`}>{lang === 'hi' ? 'टैप करें' : 'Tap to capture'}</p>
            </>
          )}
        </div>
      </label>
    </div>
  );

  return (
    <div className={`min-h-screen ${bg} px-4 py-5 pb-24`}>
      <div className="max-w-2xl mx-auto">
      <h2 className={`text-lg font-bold mb-1 ${heading}`}>
        {lang === 'hi' ? 'डिपस्टिक फोटो व परिणाम' : 'Dipstick Photo & Result'}
      </h2>
      <p className={`text-sm mb-4 ${sub}`}>
        {lang === 'hi' ? 'जाँच के बाद की फोटो ज़रूरी है। पहले की फोटो वैकल्पिक है।' : 'After-dip photo is required. Before photo is optional.'}
      </p>

      {/* Image uploads */}
      <div className="flex gap-3 mb-5">
        <ImageUploadBox type="before" image={beforeImage}
          label={lang === 'hi' ? 'डुबोने से पहले' : 'Before Dipping'} optional={true} />
        <ImageUploadBox type="after" image={afterImage}
          label={lang === 'hi' ? 'डुबोने के बाद ⭐' : 'After Dipping ⭐'} optional={false} />
      </div>

      {uploading && (
        <div className={`flex items-center justify-center gap-2 py-2 mb-4 ${sub}`}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{lang === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...'}</span>
        </div>
      )}

      {analyzing && (
        <div className={`flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border ${isDark ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span className="text-sm">{lang === 'hi' ? 'AI स्ट्रिप विश्लेषण कर रहा है...' : 'AI is analysing the strip…'}</span>
        </div>
      )}

      {analysisError && (
        <div className={`flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border ${isDark ? 'bg-amber-900/20 border-amber-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">
            {lang === 'hi'
              ? 'AI स्ट्रिप नहीं पढ़ पाया। कृपया नीचे परिणाम चुनें।'
              : 'AI could not read the strip. Please select the result manually below.'}
          </span>
        </div>
      )}

      {aiSuggested && !analysisError && (
        <div className={`flex items-center gap-2 px-4 py-3 mb-4 rounded-xl border ${isDark ? 'bg-emerald-900/20 border-emerald-700 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">
            {lang === 'hi'
              ? 'AI ने परिणाम सुझाया है। जाँच कर लें और ज़रूरत हो तो बदलें।'
              : 'AI suggested a result. Please verify and correct if needed.'}
          </span>
        </div>
      )}

      {/* Manual protein level selection */}
      <div className={`rounded-2xl border p-4 mb-5 ${card}`}>
        <p className={`text-sm font-semibold mb-1 ${heading}`}>
          {lang === 'hi' ? 'आपको कौन सा रंग दिखा?' : 'Select the colour you see on the protein pad'}
        </p>
        <p className={`text-xs mb-3 ${sub}`}>
          {lang === 'hi' ? 'बोतल पर दिए रंग चार्ट से मिलाएँ' : 'Compare to the colour chart on the bottle'}
        </p>
        <div className="space-y-2">
          {PROTEIN_LEVELS.map(p => (
            <button key={p.level} onClick={() => setSelectedLevel(p.level)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${selectedLevel === p.level ? 'border-cyan-500 bg-cyan-500/10' : isDark ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50'}`}>
              <div className="w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: p.color }} />
              <div className="flex-1 text-left">
                <p className={`text-sm font-semibold ${heading}`}>{p.level}</p>
                <p className={`text-xs ${sub}`}>{lang === 'hi' ? p.descHi : p.desc}</p>
              </div>
              {selectedLevel === p.level && <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={!canSubmit}
        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all ${canSubmit ? 'bg-cyan-500 text-black hover:bg-cyan-400' : isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-200 text-gray-400'} ${saving ? 'opacity-70' : ''}`}>
        {saving ? (
          <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{lang === 'hi' ? 'सेव हो रहा है...' : 'Saving...'}</span>
        ) : (
          lang === 'hi' ? 'परिणाम सेव करें' : 'Save Result'
        )}
      </button>

      {!afterImage && (
        <p className={`text-xs text-center mt-2 ${sub}`}>
          {lang === 'hi' ? '* जाँच के बाद की फोटो ज़रूरी है' : '* After-dip photo is required'}
        </p>
      )}
      </div>
    </div>
  );
}