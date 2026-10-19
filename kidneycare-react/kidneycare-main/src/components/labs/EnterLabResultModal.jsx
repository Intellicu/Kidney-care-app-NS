import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle, Upload, FileText, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

const STATUS_COLORS = {
  Normal: 'bg-green-50 border-green-200 text-green-800',
  Borderline: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  Abnormal_Low: 'bg-orange-50 border-orange-200 text-orange-800',
  Abnormal_High: 'bg-orange-50 border-orange-200 text-orange-800',
  Critical_Low: 'bg-red-50 border-red-300 text-red-800',
  Critical_High: 'bg-red-50 border-red-300 text-red-800',
};

function classifyResult(value, test) {
  if (!test || value === '' || value === null || value === undefined) return null;
  const v = parseFloat(value);
  if (isNaN(v)) return null;
  const { alert_threshold_critical_high: ch, alert_threshold_critical_low: cl, alert_threshold_warn_high: wh, alert_threshold_warn_low: wl } = test;
  if (ch !== null && ch !== undefined && v >= ch) return { status: 'Critical_High', label: '🔴 CRITICAL HIGH', range: `Warn high: ${wh}, Critical: ${ch}`, unit: test.result_unit };
  if (cl !== null && cl !== undefined && v <= cl) return { status: 'Critical_Low', label: '🔴 CRITICAL LOW', range: `Warn low: ${wl}, Critical: ${cl}`, unit: test.result_unit };
  if (wh !== null && wh !== undefined && v >= wh) return { status: 'Abnormal_High', label: '🟠 ABNORMAL HIGH', range: `Target: below ${wh}`, unit: test.result_unit };
  if (wl !== null && wl !== undefined && v <= wl) return { status: 'Abnormal_Low', label: '🟠 ABNORMAL LOW', range: `Target: above ${wl}`, unit: test.result_unit };
  return { status: 'Normal', label: '✅ NORMAL', range: `${wl ?? '—'} – ${wh ?? '—'} ${test.result_unit || ''}`, unit: test.result_unit };
}

export default function EnterLabResultModal({ patient, prefill, templates, onClose }) {
  const [inputMethod, setInputMethod] = useState(null); // 'photo' | 'pdf' | 'manual'
  const [drugName, setDrugName] = useState(prefill?.drug_name || '');
  const [testName, setTestName] = useState('');
  const [resultDate, setResultDate] = useState(new Date().toISOString().split('T')[0]);
  const [resultValue, setResultValue] = useState('');
  const [resultUnit, setResultUnit] = useState('');
  const [parameterName, setParameterName] = useState('');
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('Manual_Entry');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [classification, setClassification] = useState(null);

  const template = templates.find(t => t.drug_name === drugName);
  const tests = template?.blood_test_schedule || [];
  const selectedTest = tests.find(t => t.test_name === testName);

  useEffect(() => {
    if (selectedTest && resultValue !== '') {
      setClassification(classifyResult(resultValue, selectedTest));
      setResultUnit(selectedTest.result_unit || '');
      setParameterName(selectedTest.parameter_name || '');
    } else {
      setClassification(null);
    }
  }, [resultValue, selectedTest]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);
      setFileType(type === 'photo' ? 'Image_Upload' : 'PDF_Upload');
      setInputMethod('manual');
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const status = classification?.status || 'Pending_Review';
      const numValue = parseFloat(resultValue);

      // Create lab result
      const labResult = await base44.entities.LabResult.create({
        patient_id: patient.id,
        drug_name: drugName,
        test_name: testName || 'Manual Result',
        parameter_name: parameterName,
        result_date: resultDate,
        result_value: resultValue,
        result_numeric: !isNaN(numValue) ? numValue : null,
        result_unit: resultUnit,
        status,
        file_url: fileUrl || null,
        file_type: fileType,
        notes,
        test_category: selectedTest?.test_category || 'Biochemistry',
        next_due_date: selectedTest ? (() => {
          const d = new Date(resultDate);
          d.setDate(d.getDate() + (selectedTest.frequency_maintenance_days || 30));
          return d.toISOString().split('T')[0];
        })() : null,
        entered_by: patient.caregiver_name || 'Clinician',
        is_reviewed: false,
        alert_generated: false,
        template_id: template?.id || null
      });

      // Evaluate drug alert rules
      await base44.functions.invoke('evaluateDrugAlertRules', {
        patient_id: patient.id,
        lab_result_id: labResult.id
      });

      setSaving(false);
      setDone(true);
      setTimeout(onClose, 2000);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="mx-4 mt-8 bg-white rounded-2xl shadow-sm p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
        <p className="font-bold text-green-700">Result saved!</p>
        {classification && <p className="text-sm text-gray-500 mt-1">{classification.label}</p>}
      </div>
    );
  }

  // Step 1: Choose input method
  if (!inputMethod) {
    return (
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Enter Lab Result</h3>
          <button onClick={onClose} className="text-gray-400 text-sm">Cancel</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">How would you like to enter the result?</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'photo', icon: '📷', label: 'Upload Photo' },
            { id: 'pdf', icon: '📄', label: 'Upload PDF' },
            { id: 'manual', icon: '✏️', label: 'Type Manually' },
          ].map(opt => (
            <label key={opt.id} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer ${opt.id === 'manual' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              {opt.id !== 'manual' ? (
                <>
                  <input type="file" accept={opt.id === 'pdf' ? '.pdf' : 'image/*'} className="hidden" onChange={e => handleFileUpload(e, opt.id)} />
                  <span className="text-2xl mb-1">{opt.icon}</span>
                  <span className="text-xs text-gray-600 text-center">{opt.label}</span>
                </>
              ) : (
                <button onClick={() => setInputMethod('manual')} className="flex flex-col items-center">
                  <span className="text-2xl mb-1">{opt.icon}</span>
                  <span className="text-xs text-gray-600">{opt.label}</span>
                </button>
              )}
            </label>
          ))}
        </div>
        {uploading && (
          <div className="flex items-center justify-center gap-2 mt-4 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Uploading...</span>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Manual form
  return (
    <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">Enter Lab Result</h3>
        <button onClick={onClose} className="text-white/70 text-sm">Cancel</button>
      </div>
      <div className="p-4 space-y-3">
        {fileUrl && (
          <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700">
            <FileText className="w-4 h-4" />
            <span>File uploaded ✓</span>
            {fileUrl.endsWith('.pdf') ? (
              <a href={fileUrl} target="_blank" rel="noreferrer" className="underline text-xs ml-auto">View PDF</a>
            ) : (
              <a href={fileUrl} target="_blank" rel="noreferrer"><img src={fileUrl} className="w-10 h-10 object-cover rounded ml-auto" alt="lab" /></a>
            )}
          </div>
        )}

        {/* Drug selector */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Drug Being Monitored</label>
          <select value={drugName} onChange={e => { setDrugName(e.target.value); setTestName(''); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">— Select drug —</option>
            {templates.map(t => <option key={t.id} value={t.drug_name}>{t.drug_name}</option>)}
          </select>
        </div>

        {/* Test selector */}
        {tests.length > 0 && (
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Test Name</label>
            <select value={testName} onChange={e => setTestName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">— Select test —</option>
              {tests.map((t, i) => <option key={i} value={t.test_name}>{t.test_name}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Test Date</label>
            <input type="date" value={resultDate} onChange={e => setResultDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Result Value</label>
            <div className="flex gap-1">
              <Input type="number" step="0.01" value={resultValue} onChange={e => setResultValue(e.target.value)}
                className="rounded-lg flex-1" placeholder="e.g. 8.4" />
            </div>
          </div>
        </div>

        {/* Unit */}
        {selectedTest && (
          <p className="text-xs text-gray-400">Unit: {selectedTest.result_unit} — {selectedTest.why_monitored}</p>
        )}

        {/* Real-time classification */}
        {classification && (
          <div className={`rounded-xl border-2 p-3 ${STATUS_COLORS[classification.status] || 'bg-gray-50'}`}>
            <p className="font-bold text-sm">{classification.label}</p>
            <p className="text-xs mt-0.5">{classification.range}</p>
            {selectedTest?.action_if_abnormal && classification.status !== 'Normal' && (
              <p className="text-xs mt-1 opacity-80">Action: {selectedTest.action_if_abnormal}</p>
            )}
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500 block mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Any additional notes..." />
        </div>

        <Button
          onClick={handleSave}
          disabled={!drugName || !resultValue || saving}
          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Result'}
        </Button>
      </div>
    </div>
  );
}