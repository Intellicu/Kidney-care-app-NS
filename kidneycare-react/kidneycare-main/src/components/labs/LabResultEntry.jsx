import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Pencil, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const classifyResult = (value, templateTest) => {
  if (!templateTest || value == null || isNaN(value)) return null;
  const v = parseFloat(value);
  const { alert_threshold_critical_high: ch, alert_threshold_critical_low: cl, alert_threshold_warn_high: wh, alert_threshold_warn_low: wl } = templateTest;

  if (ch != null && v >= ch) return { status: 'Critical_High', label: '🔴 CRITICAL HIGH', color: 'bg-red-100 text-red-700 border-red-200' };
  if (cl != null && v <= cl) return { status: 'Critical_Low', label: '🔴 CRITICAL LOW', color: 'bg-red-100 text-red-700 border-red-200' };
  if (wh != null && v >= wh) return { status: 'Abnormal_High', label: '🟠 HIGH', color: 'bg-orange-100 text-orange-700 border-orange-200' };
  if (wl != null && v <= wl) return { status: 'Abnormal_Low', label: '🟠 LOW', color: 'bg-orange-100 text-orange-700 border-orange-200' };
  return { status: 'Normal', label: '🟢 Normal', color: 'bg-green-100 text-green-700 border-green-200' };
};

export default function LabResultEntry({ patientId, medication, schedule, template, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState('method'); // method | form | done
  const [method, setMethod] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const availableTests = template?.blood_test_schedule || [];
  const preselectedTest = schedule ? availableTests.find(t => t.test_name === schedule.test_name) : null;

  const [form, setForm] = useState({
    drug_name: medication?.drug_name || '',
    test_name: schedule?.test_name || '',
    test_category: schedule?.test_category || preselectedTest?.test_category || '',
    parameter_name: preselectedTest?.parameter_name || '',
    result_date: format(new Date(), 'yyyy-MM-dd'),
    result_value: '',
    result_numeric: '',
    result_unit: preselectedTest?.result_unit || '',
    file_type: 'Manual_Entry',
    notes: '',
    file_url: '',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const selectedTestTemplate = availableTests.find(t => t.test_name === form.test_name);
  const classification = form.result_numeric ? classifyResult(form.result_numeric, selectedTestTemplate) : null;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url);
    set('file_url', file_url);
    set('file_type', file.type === 'application/pdf' ? 'PDF_Upload' : 'Image_Upload');
    setUploading(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      // Calc next due date
      const nextDue = selectedTestTemplate?.frequency_maintenance_days
        ? new Date(new Date(form.result_date).getTime() + selectedTestTemplate.frequency_maintenance_days * 86400000).toISOString().split('T')[0]
        : null;

      const labResult = await base44.entities.LabResult.create({
        patient_id: patientId,
        drug_name: form.drug_name,
        test_name: form.test_name,
        test_category: form.test_category || selectedTestTemplate?.test_category,
        parameter_name: form.parameter_name || selectedTestTemplate?.parameter_name,
        result_date: form.result_date,
        result_value: form.result_value,
        result_numeric: form.result_numeric ? parseFloat(form.result_numeric) : null,
        result_unit: form.result_unit || selectedTestTemplate?.result_unit,
        file_type: form.file_type,
        file_url: form.file_url || null,
        notes: form.notes,
        status: classification?.status || 'Pending_Review',
        next_due_date: nextDue,
        entered_by: user.email,
        medication_id: medication?.id,
        is_reviewed: false,
        alert_generated: false,
      });

      // Update LabTestSchedule if opened from a schedule
      if (schedule?.id) {
        await base44.entities.LabTestSchedule.update(schedule.id, {
          status: 'Completed',
          last_result_id: labResult.id,
          last_result_value: form.result_value,
          last_result_status: classification?.status || 'Pending_Review',
          last_result_date: form.result_date,
        });

        // Create next schedule
        if (nextDue && selectedTestTemplate) {
          await base44.entities.LabTestSchedule.create({
            patient_id: patientId,
            drug_name: form.drug_name,
            test_name: form.test_name,
            test_category: selectedTestTemplate.test_category,
            due_date: nextDue,
            frequency_days: selectedTestTemplate.frequency_maintenance_days,
            status: 'Upcoming',
            phase: 'Maintenance',
            medication_id: medication?.id,
          });
        }
      }

      // Evaluate drug alert rules
      await base44.functions.invoke('evaluateDrugAlertRules', {
        patient_id: patientId,
        lab_result_id: labResult.id
      });

      return labResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['labResults', patientId]);
      queryClient.invalidateQueries(['labSchedules', patientId]);
      setStep('done');
      setTimeout(onSaved, 2000);
    }
  });

  if (step === 'done') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
        <p className="font-semibold text-gray-900">Result saved!</p>
        {classification && (
          <Badge className={`mt-2 ${classification.color}`}>{classification.label}</Badge>
        )}
      </div>
    );
  }

  if (step === 'method') {
    return (
      <div className="space-y-3">
        <p className="font-semibold text-gray-900 mb-4">Enter Lab Result — {medication?.drug_name}</p>
        {[
          { id: 'photo', icon: Upload, label: 'Upload Lab Report Photo', desc: 'Take a photo of the report' },
          { id: 'pdf', icon: FileText, label: 'Upload PDF', desc: 'Upload a PDF lab report' },
          { id: 'manual', icon: Pencil, label: 'Type in manually', desc: 'Enter numbers directly' },
        ].map(opt => (
          <button
            key={opt.id}
            className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors text-left"
            onClick={() => { setMethod(opt.id); setStep('form'); if (opt.id !== 'manual') set('file_type', opt.id === 'pdf' ? 'PDF_Upload' : 'Image_Upload'); }}
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <opt.icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-semibold text-gray-900">Enter Result — {medication?.drug_name}</p>

      {/* File upload if not manual */}
      {(method === 'photo' || method === 'pdf') && (
        <div>
          <label className="block w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-100">
            <input type="file" accept={method === 'pdf' ? '.pdf' : 'image/*'} className="hidden" onChange={handleFileUpload} />
            {uploading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /> :
              fileUrl ? <p className="text-green-600 text-sm">✅ File uploaded</p> :
              <p className="text-gray-500 text-sm">{method === 'pdf' ? '📄 Tap to upload PDF' : '📷 Tap to upload photo'}</p>}
          </label>
          {fileUrl && method === 'photo' && <img src={fileUrl} className="w-full h-32 object-contain rounded-lg mt-2 bg-gray-50" />}
          {fileUrl && method === 'pdf' && (
            <a href={fileUrl} target="_blank" className="text-xs text-blue-500 underline block mt-1">View uploaded PDF</a>
          )}
        </div>
      )}

      {/* Drug */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Drug being monitored</label>
        <Input value={form.drug_name} onChange={e => set('drug_name', e.target.value)} className="h-9 rounded-lg" />
      </div>

      {/* Test name */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Test Name</label>
        <Select value={form.test_name} onValueChange={v => {
          set('test_name', v);
          const t = availableTests.find(x => x.test_name === v);
          if (t) {
            set('test_category', t.test_category);
            set('parameter_name', t.parameter_name || '');
            set('result_unit', t.result_unit || '');
          }
        }}>
          <SelectTrigger className="h-9 rounded-lg"><SelectValue placeholder="Select test..." /></SelectTrigger>
          <SelectContent>
            {availableTests.map((t, i) => (
              <SelectItem key={i} value={t.test_name}>{t.test_name} ({t.test_category})</SelectItem>
            ))}
            <SelectItem value="__custom">Other (type below)</SelectItem>
          </SelectContent>
        </Select>
        {form.test_name === '__custom' && (
          <Input className="mt-1 h-9 rounded-lg" placeholder="Test name" onChange={e => set('test_name', e.target.value)} />
        )}
      </div>

      {/* Date */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Test Date</label>
        <Input type="date" value={form.result_date} onChange={e => set('result_date', e.target.value)} className="h-9 rounded-lg" />
      </div>

      {/* Result value */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Result Value</label>
        <div className="flex gap-2">
          <Input value={form.result_value} onChange={e => { set('result_value', e.target.value); set('result_numeric', e.target.value); }} placeholder="e.g. 8.4" className="h-9 rounded-lg flex-1" />
          <Input value={form.result_unit} onChange={e => set('result_unit', e.target.value)} placeholder="unit" className="h-9 rounded-lg w-20" />
        </div>
      </div>

      {/* Instant classification */}
      {classification && (
        <Card className={`p-3 border ${classification.color}`}>
          <p className="font-bold text-sm">{classification.label}</p>
          {selectedTestTemplate && (
            <p className="text-xs mt-1">
              {selectedTestTemplate.alert_threshold_warn_low != null && selectedTestTemplate.alert_threshold_warn_high != null &&
                `Target range: ${selectedTestTemplate.alert_threshold_warn_low}–${selectedTestTemplate.alert_threshold_warn_high} ${form.result_unit}`}
            </p>
          )}
          {selectedTestTemplate?.action_if_abnormal && classification.status !== 'Normal' && (
            <p className="text-xs mt-1 font-medium">Action: {selectedTestTemplate.action_if_abnormal}</p>
          )}
        </Card>
      )}

      {/* Notes */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Notes (optional)</label>
        <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="rounded-lg min-h-16 text-sm" placeholder="Any additional notes..." />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-11">Cancel</Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.test_name || !form.result_date}
          className="flex-1 rounded-xl h-11 bg-blue-500 hover:bg-blue-600"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Result
        </Button>
      </div>
    </div>
  );
}