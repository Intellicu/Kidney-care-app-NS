import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Mic, MicOff, Loader2, CheckCircle, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VoiceLogModal({ patient, onClose }) {
  const [step, setStep] = useState('idle'); // idle | recording | processing | done | error
  const [transcript, setTranscript] = useState('');
  const [extracted, setExtracted] = useState(null);
  const [written, setWritten] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(blob);
      };
      mediaRef.current = recorder;
      recorder.start();
      setStep('recording');
    } catch (e) {
      setErrorMsg('Microphone access denied. Please allow microphone and try again.');
      setStep('error');
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state === 'recording') {
      mediaRef.current.stop();
      setStep('processing');
    }
  };

  const processAudio = async (blob) => {
    try {
      setStep('processing');
      // Upload audio file
      const file = new File([blob], 'voice_log.webm', { type: 'audio/webm' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Call voiceTranscribeLog function
      const res = await base44.functions.invoke('voiceTranscribeLog', {
        audio_url: file_url,
        patient_id: patient.id,
        session_data: { channel: 'InApp', language: patient.language_preference || 'hi' }
      });

      setTranscript(res.data?.transcript || '');
      setExtracted(res.data?.extracted || {});
      setWritten(res.data?.records_written || []);
      setStep('done');
    } catch (e) {
      setErrorMsg(e.message || 'Processing failed. Please try again.');
      setStep('error');
    }
  };

  const renderExtracted = () => {
    if (!extracted) return null;
    const items = [];
    if (extracted.dipstick?.found) items.push(`🔵 Dipstick: ${extracted.dipstick.protein_level}`);
    if (extracted.blood_pressure?.found) items.push(`💉 BP: ${extracted.blood_pressure.systolic}/${extracted.blood_pressure.diastolic}`);
    if (extracted.weight?.found) items.push(`⚖ Weight: ${extracted.weight.value_kg} kg`);
    if (extracted.medication?.found) items.push(`💊 Medication: ${extracted.medication.taken ? 'Taken' : 'Not taken'} — ${extracted.medication.drug_name || ''}`);
    if (extracted.symptoms?.found) items.push(`🤒 Symptoms: ${extracted.symptoms.list?.join(', ')}`);
    return items;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">🎤 Voice Log</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'idle' && (
          <div className="text-center py-6">
            <p className="text-gray-600 text-sm mb-2">बोलकर अपना daily log करें</p>
            <p className="text-gray-400 text-xs mb-6">
              e.g. "Dipstick negative आया। दवा दे दी। वज़न 18 किलो है।"
            </p>
            <button
              onClick={startRecording}
              className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center mx-auto shadow-lg transition-all"
            >
              <Mic className="w-10 h-10 text-white" />
            </button>
            <p className="text-gray-400 text-sm mt-4">Tap to start recording</p>
          </div>
        )}

        {step === 'recording' && (
          <div className="text-center py-6">
            <p className="text-red-600 font-semibold mb-2 animate-pulse">🔴 Recording...</p>
            <p className="text-gray-500 text-sm mb-6">बोलें... Speak now</p>
            <button
              onClick={stopRecording}
              className="w-24 h-24 rounded-full bg-gray-800 hover:bg-gray-900 flex items-center justify-center mx-auto shadow-lg animate-pulse"
            >
              <MicOff className="w-10 h-10 text-white" />
            </button>
            <p className="text-gray-400 text-sm mt-4">Tap to stop</p>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-10">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Processing voice note...</p>
            <p className="text-gray-400 text-sm mt-1">Transcribing and saving your data</p>
          </div>
        )}

        {step === 'done' && (
          <div className="py-2">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <p className="font-semibold text-green-700">Logged successfully!</p>
            </div>

            {transcript && (
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Transcript</p>
                <p className="text-sm text-gray-700 italic">"{transcript}"</p>
              </div>
            )}

            {renderExtracted()?.length > 0 && (
              <div className="space-y-1 mb-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Data Saved</p>
                {renderExtracted().map((item, i) => (
                  <div key={i} className="bg-green-50 rounded-lg px-3 py-2 text-sm text-green-800">{item}</div>
                ))}
              </div>
            )}

            {written.length === 0 && (
              <div className="bg-amber-50 rounded-xl p-3 mb-4">
                <p className="text-sm text-amber-700">
                  No health data detected. Try saying something like "dipstick negative आया" or "दवा दे दी".
                </p>
              </div>
            )}

            <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12">
              Done
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="py-4">
            <div className="bg-red-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('idle')} className="flex-1 rounded-xl">
                Try Again
              </Button>
              <Button onClick={onClose} className="flex-1 rounded-xl">Close</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}