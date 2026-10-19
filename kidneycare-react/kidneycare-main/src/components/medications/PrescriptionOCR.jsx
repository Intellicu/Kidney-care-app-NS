import React, { useState } from 'react';
import { Camera, Loader2, CheckCircle, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function PrescriptionOCR({ onMedicationsExtracted, hi }) {
  const [step, setStep] = useState('idle'); // idle | uploading | extracting | confirm
  const [extracted, setExtracted] = useState([]);
  const [selected, setSelected] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStep('uploading');
    setPreviewUrl(URL.createObjectURL(file));

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setStep('extracting');

    // Use LLM to extract medications from prescription image
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a medical OCR assistant. Extract all medications from this prescription image. Return a JSON array of objects with fields: drug_name (string), dose (string, e.g. "5mg"), frequency (one of: "Once daily","Twice daily","Three times daily","As needed"), schedule (one of: "morning","evening","night","afternoon"). Only return valid JSON array, no other text. If no medications found, return [].`,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            drug_name: { type: 'string' },
            dose: { type: 'string' },
            frequency: { type: 'string' },
            schedule: { type: 'string' },
          }
        }
      }
    });

    let meds = [];
    try {
      meds = Array.isArray(result) ? result : (typeof result === 'string' ? JSON.parse(result) : []);
    } catch {}

    setExtracted(meds);
    const sel = {};
    meds.forEach((_, i) => { sel[i] = true; });
    setSelected(sel);
    setStep('confirm');
  };

  const handleConfirm = () => {
    const chosen = extracted.filter((_, i) => selected[i]);
    onMedicationsExtracted(chosen);
    setStep('idle');
    setExtracted([]);
    setPreviewUrl(null);
  };

  if (step === 'idle') {
    return (
      <div>
        <input type="file" id="rx-upload" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
        <label htmlFor="rx-upload">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <FileText className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{hi ? 'पर्ची अपलोड करें (OCR)' : 'Upload Prescription (OCR)'}</p>
              <p className="text-xs text-blue-500">{hi ? 'दवाएँ स्वचालित रूप से निकाली जाएंगी' : 'Medications extracted automatically'}</p>
            </div>
          </div>
        </label>
      </div>
    );
  }

  if (step === 'uploading' || step === 'extracting') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {step === 'uploading' ? (hi ? 'अपलोड हो रहा है...' : 'Uploading...') : (hi ? 'OCR से दवाएँ निकाली जा रही हैं...' : 'Extracting medications with AI...')}
        </p>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm">
            {hi ? 'निकाली गई दवाएँ — पुष्टि करें' : 'Extracted Medications — Confirm'}
          </p>
          <button onClick={() => { setStep('idle'); setExtracted([]); }} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {extracted.length === 0 ? (
          <p className="text-sm text-gray-500">{hi ? 'कोई दवा नहीं मिली' : 'No medications found in image'}</p>
        ) : (
          <div className="space-y-2">
            {extracted.map((med, i) => (
              <label key={i} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all ${selected[i] ? 'bg-white dark:bg-gray-800 border-blue-300 shadow-sm' : 'bg-gray-50 dark:bg-gray-700 border-transparent opacity-60'}`}>
                <input type="checkbox" checked={!!selected[i]} onChange={() => setSelected(p => ({ ...p, [i]: !p[i] }))} className="mt-0.5 accent-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{med.drug_name}</p>
                  <p className="text-xs text-gray-500">{med.dose} · {med.frequency} · {med.schedule}</p>
                </div>
                {selected[i] && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
              </label>
            ))}
          </div>
        )}

        {extracted.length > 0 && (
          <Button onClick={handleConfirm} className="w-full h-11 rounded-xl bg-blue-500 hover:bg-blue-600">
            {hi ? 'चुनी हुई दवाएँ जोड़ें' : `Add ${Object.values(selected).filter(Boolean).length} Selected Medication(s)`}
          </Button>
        )}
      </div>
    );
  }

  return null;
}