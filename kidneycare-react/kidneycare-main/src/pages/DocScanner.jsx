import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, FileText, CheckCircle2, RotateCw, Sparkles,
  ArrowLeft, Eye, Calendar, User, Clock, ShieldCheck, Download, Trash2, AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { useLanguage } from '../components/shared/LanguageContext';

const CATEGORIES = [
  { id: 'Lab Result', labelEn: '🧪 Lab Report (UPCR / Labs)', labelHi: '🧪 लैब रिपोर्ट (UPCR / रक्त-मूत्र जाँच)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'Prescription', labelEn: '💊 Prescription / Rx Slip', labelHi: '💊 डॉक्टर का पर्चा (Rx)', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'Dipstick Test', labelEn: '📋 Dipstick Test Strip', labelHi: '📋 मूत्र जांच स्ट्रिप फोटो', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'Medical History', labelEn: '🏥 Discharge / Clinical Notes', labelHi: '🏥 डिस्चार्ज सारांश / नोट्स', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'Clinical Photo', labelEn: '🩺 Clinical Photo (Edema)', labelHi: '🩺 सूजन या चेहरे की फोटो', color: 'bg-pink-100 text-pink-800 border-pink-300' }
];

export default function DocScanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlCr = searchParams.get('cr');
  const queryClient = useQueryClient();
  const { language, changeLanguage } = useLanguage();
  const hi = language === 'hi';

  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'file'
  const [capturedImage, setCapturedImage] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) | 'user' (front)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Lab Result');
  const [notes, setNotes] = useState('');
  const [crNumber, setCrNumber] = useState(urlCr || 'AIIMS/PED/2026/0412');
  const [selectedPatientId, setSelectedPatientId] = useState('pat_aiims_001');
  const [timestamp, setTimestamp] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [isConfidential, setIsConfidential] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load patients
  const { data: patients = [] } = useQuery({
    queryKey: ['patientsList'],
    queryFn: () => base44.entities.Patient.list()
  });

  // Load recent documents for selected patient
  const { data: recentDocs = [], refetch: refetchDocs } = useQuery({
    queryKey: ['patientDocs', selectedPatientId],
    queryFn: () => base44.entities.HealthRecord.filter({ patient_id: selectedPatientId })
  });

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access issue:', err);
      setCameraError('Camera access not granted or not available on this device. You can still upload report files directly.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (activeTab === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, facingMode, capturedImage]);

  // Snap photo from camera
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    setRotation(0);
    stopCamera();

    // Auto fill title if empty
    if (!title) {
      setTitle(`${category} - ${format(new Date(), 'dd MMM yyyy')}`);
    }
  };

  // Handle File Upload (PDF / Image)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setTitle(cleanName || `${category} - ${format(new Date(), 'dd MMM yyyy')}`);
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCapturedImage(ev.target.result);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    } else {
      // PDF or document
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCapturedImage(file_url);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setSaveSuccess(false);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Submit and Save
  const handleSaveDocument = async () => {
    if (!capturedImage) {
      alert('Please capture or upload a document photo first.');
      return;
    }
    setIsSaving(true);

    try {
      const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];

      const recordPayload = {
        patient_id: selectedPatientId,
        cr_number: crNumber || activePatient?.cr_number || '2024098273',
        record_type: category,
        title: title || `${category} - ${format(new Date(), 'dd MMM yyyy')}`,
        description: notes || `Patient document scanned and archived on ${format(new Date(), 'PPP pp')}.`,
        attachments: [capturedImage],
        visit_date: timestamp.split('T')[0],
        created_date: new Date(timestamp).toISOString(),
        confidential: isConfidential,
        clinician_id: 'doc_aiims_001',
        tag: 'Patient Document Scanner'
      };

      await base44.entities.HealthRecord.create(recordPayload);

      queryClient.invalidateQueries(['patientDocs']);
      queryClient.invalidateQueries(['healthRecords']);
      refetchDocs();

      setIsSaving(false);
      setSaveSuccess(true);
    } catch (err) {
      console.error('Failed to save document:', err);
      setIsSaving(false);
      alert('Error saving document. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/HealthRecords">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-slate-600 hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {hi ? 'दस्तावेज़ एवं पर्चा स्कैनर' : 'Patient Document Scanner'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {hi ? 'एम्स पटना बाल गुर्दा रोग विभाग' : 'AIIMS Patna Pediatric Nephrology'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => changeLanguage(hi ? 'en' : 'hi')}
            className="text-xs h-7 px-2 font-bold bg-indigo-50 text-indigo-700 border-indigo-200 cursor-pointer"
          >
            {hi ? '🇬🇧 English' : '🇮🇳 हिंदी'}
          </Button>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs">
            CR: {crNumber}
          </Badge>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-5">
        {/* Success Banner */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Document Successfully Archived!</h4>
                  <p className="text-xs text-emerald-700">Tagged to CR {crNumber} with timestamp.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs bg-white text-emerald-800 border-emerald-300" onClick={handleRetake}>
                  Scan Another
                </Button>
                <Link to="/HealthRecords">
                  <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                    View Archive
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Capture / Upload Area */}
        <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-2xl bg-white">
          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setCapturedImage(null); }} className="w-full">
            <div className="p-3 bg-slate-100/80 border-b border-slate-200">
              <TabsList className="grid grid-cols-2 w-full bg-slate-200/80 p-1 rounded-xl">
                <TabsTrigger value="camera" className="rounded-lg font-medium text-xs py-1.5 flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Camera className="w-3.5 h-3.5" />
                  {hi ? 'लाइव कैमरा स्कैनर' : 'Live Camera Scanner'}
                </TabsTrigger>
                <TabsTrigger value="file" className="rounded-lg font-medium text-xs py-1.5 flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  {hi ? 'फ़ाइल / PDF अपलोड' : 'Upload PDF / File'}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB: CAMERA */}
            <TabsContent value="camera" className="p-0 m-0">
              {!capturedImage ? (
                <div className="relative bg-black aspect-[4/3] flex items-center justify-center overflow-hidden">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Document alignment overlay */}
                      <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                        <div className="text-[11px] text-white/90 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm self-start">
                          {hi ? 'दस्तावेज़ को फ्रेम में रखें' : 'Align document within frame'}
                        </div>
                        <div className="text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm self-center">
                          {hi ? 'अच्छी रोशनी में स्थिर रखें' : 'Hold steady in good light'}
                        </div>
                      </div>
                      {/* Floating Camera Controls */}
                      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6 z-20">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                          onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                          title={hi ? 'कैमरा बदलें' : 'Switch Camera'}
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                        <button
                          type="button"
                          onClick={captureSnapshot}
                          className="w-16 h-16 rounded-full bg-white p-1 border-4 border-blue-500 shadow-xl active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                            <Camera className="w-6 h-6" />
                          </div>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 text-white space-y-3">
                      <Camera className="w-12 h-12 text-slate-400 mx-auto" />
                      {cameraError ? (
                        <p className="text-xs text-amber-300 max-w-xs">{cameraError}</p>
                      ) : (
                        <p className="text-xs text-slate-300">{hi ? 'कैमरा लोड हो रहा है...' : 'Initializing high-resolution camera...'}</p>
                      )}
                      <Button size="sm" onClick={startCamera} className="bg-blue-600 hover:bg-blue-700 text-xs">
                        {hi ? 'कैमरा चालू करें' : 'Start Camera'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </TabsContent>

            {/* TAB: FILE UPLOAD */}
            <TabsContent value="file" className="p-4 m-0">
              {!capturedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-colors space-y-3"
                >
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {hi ? 'रिपोर्ट या पर्चा अपलोड करें' : 'Upload Report or Prescription'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {hi ? 'PDF, JPG, PNG, WEBP (अधिकतम 25MB)' : 'Supports PDF, JPG, PNG, WEBP files up to 25MB'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs pointer-events-none">
                    {hi ? 'डिवाइस से फ़ाइल चुनें' : 'Select File from Device'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              ) : null}
            </TabsContent>
          </Tabs>

          {/* Captured Preview & Adjustment Controls */}
          {capturedImage && (
            <div className="p-4 bg-slate-900 flex flex-col items-center justify-center space-y-3">
              <div className="relative max-h-72 w-full flex items-center justify-center overflow-hidden rounded-xl bg-black">
                {capturedImage.startsWith('data:application/pdf') || capturedImage.endsWith('.pdf') ? (
                  <div className="p-8 text-center text-white space-y-2">
                    <FileText className="w-16 h-16 text-red-400 mx-auto" />
                    <p className="text-sm font-medium">PDF Document Attached</p>
                  </div>
                ) : (
                  <img
                    src={capturedImage}
                    alt="Captured Scan"
                    style={{ transform: `rotate(${rotation}deg)` }}
                    className="max-h-72 max-w-full object-contain rounded-lg transition-transform duration-200"
                  />
                )}
              </div>
              <div className="flex items-center gap-3 w-full justify-between px-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs h-8 gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Rotate 90°
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRetake}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/40 text-xs h-8 gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Retake Photo
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Tagging & Patient Metadata Card */}
        <Card className="p-5 border border-slate-200 shadow-sm rounded-2xl bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Patient & Clinical Tagging
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">AIIMS Patna Schema</span>
          </div>

          {/* Patient Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Patient</Label>
              <select
                value={selectedPatientId}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value);
                  const p = patients.find(x => x.id === e.target.value);
                  if (p?.cr_number) setCrNumber(p.cr_number);
                }}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.cr_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">CR Number (Hospital ID)</Label>
              <Input
                type="text"
                value={crNumber}
                onChange={(e) => setCrNumber(e.target.value)}
                placeholder="2024098273"
                className="h-9 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">
              {hi ? 'दस्तावेज़ की श्रेणी (Category)' : 'Document Category'}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id);
                    if (!title || CATEGORIES.some(c => title.startsWith(c.id))) {
                      setTitle(`${cat.id} - ${format(new Date(), 'dd MMM yyyy')}`);
                    }
                  }}
                  className={`text-left text-xs px-3 py-2 rounded-xl border transition-all font-medium ${
                    category === cat.id
                      ? `${cat.color} font-bold ring-2 ring-blue-500/20`
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {hi ? cat.labelHi : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Timestamp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                {hi ? 'दस्तावेज़ का नाम (Title)' : 'Document Title'}
              </Label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={hi ? 'उदा. स्पॉट UPCR लैब रिपोर्ट' : 'e.g. Spot UPCR Lab Report'}
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                {hi ? 'समय (Timestamp)' : 'Timestamp'}
              </Label>
              <Input
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Doctor / Clinical Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              {hi ? 'डॉक्टर / क्लिनिकल नोट्स (विवरण)' : 'Doctor / Clinician Notes'}
            </Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={hi ? 'दवाइयों के नाम, डॉक्टर की सलाह या जांच के परिणाम यहाँ लिखें...' : 'e.g. In remission, urine albumin negative, steroid tapering continued.'}
              className="text-xs resize-none"
            />
          </div>

          {/* Save Button */}
          <Button
            type="button"
            disabled={!capturedImage || isSaving}
            onClick={handleSaveDocument}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {hi ? 'दस्तावेज़ सेव हो रहा है...' : 'Archiving Document...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {hi ? `दस्तावेज़ सेव करें (${crNumber})` : `Save & Tag to Patient (${crNumber})`}
              </>
            )}
          </Button>
        </Card>

        {/* Patient Document History */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              Recent Scanned Documents for CR {crNumber}
            </h3>
            <Link to="/HealthRecords" className="text-xs font-medium text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {recentDocs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 bg-white rounded-xl border border-dashed border-slate-200">
                No documents scanned yet for this patient.
              </p>
            ) : (
              recentDocs.slice(0, 4).map((doc) => (
                <Card
                  key={doc.id}
                  onClick={() => setPreviewDoc(doc)}
                  className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {doc.attachments?.[0] ? (
                        <img src={doc.attachments[0]} alt="thumb" className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{doc.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                          {doc.record_type}
                        </Badge>
                        <span className="text-[10px] text-slate-400">
                          {format(new Date(doc.visit_date || doc.created_date), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-md mx-auto rounded-2xl bg-white max-h-[85vh] overflow-y-auto">
          {previewDoc && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs font-semibold bg-blue-50 text-blue-700">
                    {previewDoc.record_type}
                  </Badge>
                  <span className="text-xs text-slate-500 font-mono">CR: {previewDoc.cr_number || crNumber}</span>
                </div>
                <DialogTitle className="text-base font-bold text-slate-900">{previewDoc.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {previewDoc.attachments?.[0] && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center p-2">
                    <img
                      src={previewDoc.attachments[0]}
                      alt="Full Doc"
                      className="max-h-80 max-w-full object-contain rounded"
                    />
                  </div>
                )}
                {previewDoc.description && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <h5 className="text-xs font-semibold text-slate-700 mb-1">Clinical Notes</h5>
                    <p className="text-xs text-slate-600 whitespace-pre-line">{previewDoc.description}</p>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Archived: {format(new Date(previewDoc.created_date || Date.now()), 'PPP pp')}</span>
                  {previewDoc.attachments?.[0] && (
                    <a
                      href={previewDoc.attachments[0]}
                      download={previewDoc.title || 'document'}
                      className="flex items-center gap-1 text-blue-600 font-medium hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
