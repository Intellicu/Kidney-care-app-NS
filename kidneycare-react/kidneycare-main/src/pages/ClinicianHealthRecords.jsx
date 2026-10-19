import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, FileText, Upload, Loader2, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ClinicianHealthRecords() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get('patient_id');

  const [newRecord, setNewRecord] = useState({
    record_type: 'Progress Note',
    title: '',
    description: '',
    visit_date: new Date().toISOString().split('T')[0],
    medications: [],
    attachments: []
  });

  const [medInput, setMedInput] = useState({ name: '', dosage: '', frequency: '' });

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => base44.entities.Patient.filter({ id: patientId }),
    select: (data) => data[0],
    enabled: !!patientId
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: records = [] } = useQuery({
    queryKey: ['healthRecords', patientId],
    queryFn: () => base44.entities.HealthRecord.filter({ patient_id: patientId }, '-created_date'),
    enabled: !!patientId
  });

  const addRecordMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.HealthRecord.create({
        ...newRecord,
        patient_id: patientId,
        clinician_id: user?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['healthRecords']);
      setShowAdd(false);
      setNewRecord({
        record_type: 'Progress Note',
        title: '',
        description: '',
        visit_date: new Date().toISOString().split('T')[0],
        medications: [],
        attachments: []
      });
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewRecord({
        ...newRecord,
        attachments: [...(newRecord.attachments || []), file_url]
      });
    } catch (error) {
      console.error('Upload error:', error);
    }
    setUploading(false);
  };

  const addMedication = () => {
    if (!medInput.name) return;
    setNewRecord({
      ...newRecord,
      medications: [...(newRecord.medications || []), medInput]
    });
    setMedInput({ name: '', dosage: '', frequency: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-indigo-600 px-4 py-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl(`PatientDetail?id=${patientId}`)}>
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/20">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Health Records</h1>
          </div>
          <Button
            size="icon"
            className="rounded-full bg-white/20 hover:bg-white/30"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-indigo-100 text-sm">
          {patient?.name} • {records.length} records
        </p>
      </div>

      <div className="px-4 py-6 space-y-3">
        {records.map((record, idx) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="p-4 bg-white border-none">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{record.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{record.record_type}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(record.visit_date || record.created_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add Record Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg mx-auto rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Health Record</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Record Type</Label>
              <Select
                value={newRecord.record_type}
                onValueChange={(value) => setNewRecord({ ...newRecord, record_type: value })}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medical History">Medical History</SelectItem>
                  <SelectItem value="Diagnosis">Diagnosis</SelectItem>
                  <SelectItem value="Treatment Plan">Treatment Plan</SelectItem>
                  <SelectItem value="Lab Result">Lab Result</SelectItem>
                  <SelectItem value="Prescription">Prescription</SelectItem>
                  <SelectItem value="Progress Note">Progress Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newRecord.title}
                onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                placeholder="e.g., Follow-up consultation"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Visit Date</Label>
              <Input
                type="date"
                value={newRecord.visit_date}
                onChange={(e) => setNewRecord({ ...newRecord, visit_date: e.target.value })}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newRecord.description}
                onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                placeholder="Detailed notes..."
                className="rounded-xl"
                rows={4}
              />
            </div>

            {/* Medications */}
            <div className="space-y-2">
              <Label>Medications</Label>
              <div className="space-y-2">
                {newRecord.medications?.map((med, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                    <span className="flex-1 text-sm">{med.name} - {med.dosage} ({med.frequency})</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setNewRecord({
                        ...newRecord,
                        medications: newRecord.medications.filter((_, i) => i !== idx)
                      })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Drug name"
                  value={medInput.name}
                  onChange={(e) => setMedInput({ ...medInput, name: e.target.value })}
                  className="h-10 rounded-lg"
                />
                <Input
                  placeholder="Dosage"
                  value={medInput.dosage}
                  onChange={(e) => setMedInput({ ...medInput, dosage: e.target.value })}
                  className="h-10 rounded-lg w-24"
                />
                <Input
                  placeholder="Frequency"
                  value={medInput.frequency}
                  onChange={(e) => setMedInput({ ...medInput, frequency: e.target.value })}
                  className="h-10 rounded-lg w-28"
                />
                <Button size="sm" onClick={addMedication} className="rounded-lg">
                  Add
                </Button>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label>Attachments</Label>
              <input
                type="file"
                id="attachment"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="attachment"
                className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">Upload file</span>
                  </>
                )}
              </label>
              {newRecord.attachments?.length > 0 && (
                <p className="text-xs text-gray-500">{newRecord.attachments.length} file(s) uploaded</p>
              )}
            </div>

            <Button
              onClick={() => addRecordMutation.mutate()}
              disabled={!newRecord.title || addRecordMutation.isPending}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              {addRecordMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Save Record'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}