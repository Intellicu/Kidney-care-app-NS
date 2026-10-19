import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, QrCode, Plus, UserPlus, Stethoscope,
  Activity, Calendar, FileText, Camera, ArrowRight,
  CheckCircle2, AlertTriangle, Clock, RefreshCw, X,
  Phone, MapPin, ChevronRight, Droplets, HeartPulse,
  Scale, ShieldAlert, Sparkles, Send, Eye, FileUp,
  Utensils, Share2, Copy, Printer
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useUserRole } from '../context/UserRoleContext';

export default function OPDWorkstation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { role, setRole, activePatientCr, setActivePatientCr } = useUserRole();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('visit'); // 'visit' | 'history' | 'documents'

  // Enrollment Modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    cr_number: '',
    patient_name: '',
    guardian_name: '',
    age: '',
    gender: 'Male',
    phone: '',
    address: 'Patna, Bihar',
    diagnosis: 'Steroid Sensitive Nephrotic Syndrome (SSNS)',
    baseline_weight: '20.0',
    baseline_height: '110.0',
    blood_group: 'B+',
    status: 'Relapse Watch'
  });

  // Barcode / QR Scanner Modal
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerManualInput, setScannerManualInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // New OPD Visit Form State
  const [visitDate, setVisitDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [visitWeight, setVisitWeight] = useState('');
  const [visitHeight, setVisitHeight] = useState('');
  const [visitBpSys, setVisitBpSys] = useState('');
  const [visitBpDia, setVisitBpDia] = useState('');
  const [visitPulse, setVisitPulse] = useState('80');
  const [visitEdema, setVisitEdema] = useState('None');
  const [visitProtein, setVisitProtein] = useState('Nil');
  const [visitSteroid, setVisitSteroid] = useState('');
  const [visitOtherMeds, setVisitOtherMeds] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitFollowup, setVisitFollowup] = useState('');
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  const [saveVisitSuccess, setSaveVisitSuccess] = useState(false);

  // Quick Document Upload Modal within OPD file
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [docCategory, setDocCategory] = useState('lab_report');
  const [docTitle, setDocTitle] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Renal Nutrition & Prescription Plan State
  const [nutritionCondition, setNutritionCondition] = useState('ns_relapse');
  const [isPotassiumRestricted, setIsPotassiumRestricted] = useState(false);
  const [isPhosphateRestricted, setIsPhosphateRestricted] = useState(false);
  const [isLeachingSignedOff, setIsLeachingSignedOff] = useState(false);
  const [customFluidLimit, setCustomFluidLimit] = useState('');
  const [codeCopiedToast, setCodeCopiedToast] = useState(false);

  // Fetch all enrolled OPD patients
  const { data: patientsList = [], refetch: refetchPatients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['opdPatients', searchTerm],
    queryFn: async () => {
      try {
        const url = searchTerm 
          ? `/api/patients?search=${encodeURIComponent(searchTerm)}`
          : '/api/patients';
        const res = await fetch(url);
        if (res.ok) return await res.json();
      } catch (e) {
        console.error('Failed to fetch patients:', e);
      }
      return [];
    }
  });

  // Fetch active patient full record (including visits & documents)
  const activeCr = selectedPatient?.cr_number || activePatientCr;
  const { data: activePatientData, refetch: refetchActivePatient } = useQuery({
    queryKey: ['patientDetail', activeCr],
    queryFn: async () => {
      if (!activeCr) return null;
      try {
        const res = await fetch(`/api/patients/${encodeURIComponent(activeCr)}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.error('Failed to fetch patient detail:', e);
      }
      return null;
    },
    enabled: !!activeCr
  });

  // Fetch documents for active patient
  const { data: patientDocs = [], refetch: refetchDocs } = useQuery({
    queryKey: ['patientDocs', activeCr],
    queryFn: async () => {
      if (!activeCr) return [];
      try {
        const res = await fetch(`/api/documents?cr_number=${encodeURIComponent(activeCr)}`);
        if (res.ok) return await res.json();
      } catch (e) {}
      return [];
    },
    enabled: !!activeCr
  });

  // Keep selectedPatient in sync
  useEffect(() => {
    if (activePatientData) {
      setSelectedPatient(activePatientData);
      setVisitWeight(activePatientData.baseline_weight || '');
      setVisitHeight(activePatientData.baseline_height || '');
      setVisitSteroid(activePatientData.status === 'Relapse Watch' ? 'Prednisolone 20 mg OD' : 'Prednisolone 15 mg Alt Days');
      setVisitOtherMeds('Calcium + Vitamin D3');
    }
  }, [activePatientData]);

  // Camera Barcode Scanner Lifecycle
  useEffect(() => {
    if (showScannerModal && cameraActive) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn('Camera access error:', err);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [showScannerModal, cameraActive]);

  const handleBarcodeScanned = (scannedCr) => {
    const cleanCr = scannedCr.trim();
    if (!cleanCr) return;
    setActivePatientCr(cleanCr);
    setShowScannerModal(false);
    setCameraActive(false);

    // Check if patient exists in patientsList
    const existing = patientsList.find(p => p.cr_number.toLowerCase() === cleanCr.toLowerCase());
    if (existing) {
      setSelectedPatient(existing);
    } else {
      // Auto open enrollment with pre-filled CR
      setNewPatient(prev => ({ ...prev, cr_number: cleanCr }));
      setShowEnrollModal(true);
    }
  };

  // Submit New OPD Visit
  const handleSaveVisit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setIsSavingVisit(true);
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(selectedPatient.cr_number)}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_date: visitDate,
          doctor_name: 'Dr. Swarnim',
          weight: parseFloat(visitWeight) || 0,
          height: parseFloat(visitHeight) || 0,
          bp_systolic: parseInt(visitBpSys) || 0,
          bp_diastolic: parseInt(visitBpDia) || 0,
          pulse: parseInt(visitPulse) || 0,
          edema_grade: visitEdema,
          urine_protein: visitProtein,
          steroid_dose: visitSteroid,
          other_meds: visitOtherMeds,
          clinical_notes: visitNotes,
          next_followup: visitFollowup,
          diagnosis_status: visitProtein in ['Nil', 'Trace'] && visitEdema === 'None' ? 'Remission' : 'Relapse Watch'
        })
      });
      if (res.ok) {
        setSaveVisitSuccess(true);
        refetchActivePatient();
        refetchPatients();
        setTimeout(() => {
          setSaveVisitSuccess(false);
          setActiveTab('history');
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving visit:', err);
    } finally {
      setIsSavingVisit(false);
    }
  };

  // Submit Patient Enrollment
  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      });
      if (res.ok) {
        const enrolled = await res.json();
        setShowEnrollModal(false);
        setActivePatientCr(enrolled.cr_number);
        refetchPatients();
        // Reset form
        setNewPatient({
          cr_number: '',
          patient_name: '',
          guardian_name: '',
          age: '',
          gender: 'Male',
          phone: '',
          address: 'Patna, Bihar',
          diagnosis: 'Steroid Sensitive Nephrotic Syndrome (SSNS)',
          baseline_weight: '20.0',
          baseline_height: '110.0',
          blood_group: 'B+',
          status: 'Relapse Watch'
        });
      }
    } catch (err) {
      console.error('Enrollment error:', err);
    }
  };

  // Upload Document for this patient
  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !docFile) return;
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('cr_number', selectedPatient.cr_number);
      formData.append('category', docCategory);
      formData.append('title', docTitle || `${docCategory} for ${selectedPatient.patient_name}`);
      formData.append('doctor_notes', docNotes);
      formData.append('uploaded_by', 'Dr. Swarnim (OPD)');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setShowDocUploadModal(false);
        setDocFile(null);
        setDocTitle('');
        setDocNotes('');
        refetchDocs();
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Clinician & OPD Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white px-4 pt-5 pb-6 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                Doctor / OPD Staff Mode
              </span>
              <span className="text-xs text-blue-200">AIIMS Patna</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
              Pediatric Nephrology OPD Workstation
            </h1>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Rapid Barcode Queue · Patient Enrollment · Clinical Encounters & Subsequent Visits
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-white/20 text-xs px-2.5 py-1">
              AIIMS OPD Live
            </Badge>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-2 mt-4">
          <div className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10">
            <p className="text-xl sm:text-2xl font-black">{patientsList.length}</p>
            <p className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">Enrolled Patients</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10">
            <p className="text-xl sm:text-2xl font-black">
              {patientsList.reduce((acc, p) => acc + (p.visit_count || 0), 0)}
            </p>
            <p className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">Total Encounters</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10">
            <p className="text-xl sm:text-2xl font-black text-amber-300">
              {patientsList.filter(p => p.status === 'Relapse Watch').length}
            </p>
            <p className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">Relapse Watch</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10">
            <p className="text-xl sm:text-2xl font-black text-emerald-300">
              {patientsList.filter(p => p.status === 'Remission').length}
            </p>
            <p className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">In Remission</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-4 space-y-4">
        {/* Action Bar: Search, Barcode Scanner, & Enroll Patient */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by CR Number, Child Name, Phone, or Diagnosis..."
              className="pl-9 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm focus:bg-white"
            />
          </div>

          {/* Rapid Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setShowScannerModal(true);
                setCameraActive(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-4 rounded-xl shadow-sm flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Barcode / QR</span>
            </Button>

            <Button
              onClick={() => setShowEnrollModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-4 rounded-xl shadow-sm flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Patient</span>
            </Button>
          </div>
        </div>

        {/* OPD Patient Queue List (Chips / Quick Select) */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              OPD Patient Queue ({patientsList.length})
            </span>
            {selectedPatient && (
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                Clear Selection (Next Patient) ❯
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {patientsList.map((p) => {
              const isSelected = selectedPatient?.cr_number === p.cr_number;
              const isRelapse = p.status === 'Relapse Watch';
              return (
                <button
                  key={p.cr_number}
                  onClick={() => {
                    setSelectedPatient(p);
                    setActivePatientCr(p.cr_number);
                  }}
                  className={`flex-shrink-0 text-left p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 shadow-sm ring-1 ring-blue-600'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900">{p.patient_name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 font-bold ${
                        isRelapse
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {p.status || 'Active'}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.cr_number}</p>
                  <p className="text-[10px] text-slate-600 truncate max-w-[140px] mt-0.5">{p.diagnosis}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Patient File & Encounter Workstation */}
        {selectedPatient ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Patient Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500 text-white text-[10px] font-mono font-bold">
                    {selectedPatient.cr_number}
                  </span>
                  <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
                    {selectedPatient.status || 'Relapse Watch'}
                  </Badge>
                  <span className="text-xs text-slate-300 font-medium">
                    Blood: {selectedPatient.blood_group || 'B+'}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black mt-1">
                  {selectedPatient.patient_name}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                  <span>Age: <strong>{selectedPatient.age}</strong></span>
                  <span>Guardian: <strong>{selectedPatient.guardian_name}</strong></span>
                  <span>Phone: <strong>{selectedPatient.phone}</strong></span>
                  <span>Baseline: <strong>{selectedPatient.baseline_weight} kg / {selectedPatient.baseline_height} cm</strong></span>
                </div>
                <p className="text-xs text-blue-200 mt-1 font-medium">
                  Diagnosis: {selectedPatient.diagnosis}
                </p>
              </div>

              {/* Quick OPD Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => window.open(`/api/reports/opd-summary-pdf?cr_number=${encodeURIComponent(selectedPatient.cr_number)}`, '_blank')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  1-Click OPD PDF
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowDocUploadModal(true)}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold"
                >
                  <FileUp className="w-3.5 h-3.5 mr-1" />
                  Attach Lab / Slip
                </Button>
                <Link
                  to="/NutritionHub"
                  onClick={() => {
                    setRole('clinician');
                    localStorage.setItem('kc_user_role', 'clinician');
                  }}
                  className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  <Utensils className="w-3.5 h-3.5 mr-1" />
                  PRINT Nutrition Hub
                </Link>
                <Link
                  to={`/DocScanner?cr=${encodeURIComponent(selectedPatient.cr_number)}`}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5 mr-1" />
                  Live Camera Scanner
                </Link>
              </div>
            </div>

            {/* Navigation Tabs within Patient File */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
              <TabsList className="bg-slate-100 p-1 rounded-xl grid grid-cols-4">
                <TabsTrigger value="visit" className="rounded-lg text-xs font-bold">
                  <Stethoscope className="w-3.5 h-3.5 mr-1" />
                  Visit
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Timeline ({activePatientData?.visits?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="documents" className="rounded-lg text-xs font-bold">
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Docs ({patientDocs.length})
                </TabsTrigger>
                <TabsTrigger value="nutrition" className="rounded-lg text-xs font-bold text-emerald-800 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Utensils className="w-3.5 h-3.5 mr-1" />
                  Nutrition Plan
                </TabsTrigger>
              </TabsList>

              {/* ── TAB 1: RECORD TODAY'S OPD VISIT ── */}
              <TabsContent value="visit" className="mt-4">
                <form onSubmit={handleSaveVisit} className="space-y-4">
                  {saveVisitSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      OPD Visit successfully recorded and stored in patient history!
                    </div>
                  )}

                  {/* Vitals row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-blue-600" /> Weight (kg)
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={visitWeight}
                        onChange={(e) => setVisitWeight(e.target.value)}
                        placeholder="e.g. 21.4"
                        className="mt-1 h-10 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Height (cm)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={visitHeight}
                        onChange={(e) => setVisitHeight(e.target.value)}
                        placeholder="e.g. 118"
                        className="mt-1 h-10 bg-white"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <HeartPulse className="w-3.5 h-3.5 text-red-600" /> BP Systolic / Diastolic
                      </Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          placeholder="Sys (104)"
                          value={visitBpSys}
                          onChange={(e) => setVisitBpSys(e.target.value)}
                          className="h-10 bg-white text-center font-mono font-bold"
                          required
                        />
                        <span className="text-slate-400">/</span>
                        <Input
                          type="number"
                          placeholder="Dia (66)"
                          value={visitBpDia}
                          onChange={(e) => setVisitBpDia(e.target.value)}
                          className="h-10 bg-white text-center font-mono font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Pulse (bpm)</Label>
                      <Input
                        type="number"
                        value={visitPulse}
                        onChange={(e) => setVisitPulse(e.target.value)}
                        placeholder="80"
                        className="mt-1 h-10 bg-white"
                      />
                    </div>
                  </div>

                  {/* Clinical Findings: Edema & Dipstick */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                      <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                        <Droplets className="w-4 h-4 text-blue-600" />
                        Clinical Edema Grading
                      </Label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {['None', 'Mild 1+', 'Mod 2+', 'Sev 3+', 'Anasarca 4+'].map((grade) => (
                          <button
                            type="button"
                            key={grade}
                            onClick={() => setVisitEdema(grade)}
                            className={`py-2 px-1 rounded-lg text-[11px] font-bold border transition-all ${
                              visitEdema === grade
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {grade}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                      <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                        <Activity className="w-4 h-4 text-indigo-600" />
                        Spot Urine Dipstick Protein
                      </Label>
                      <div className="grid grid-cols-6 gap-1">
                        {['Nil', 'Trace', '1+', '2+', '3+', '4+'].map((prot) => (
                          <button
                            type="button"
                            key={prot}
                            onClick={() => setVisitProtein(prot)}
                            className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${
                              visitProtein === prot
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {prot}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Prescription & Adjustments */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Steroid / Prednisolone Regimen</Label>
                      <Input
                        value={visitSteroid}
                        onChange={(e) => setVisitSteroid(e.target.value)}
                        placeholder="e.g. Prednisolone 20 mg OD alternate day"
                        className="mt-1 h-10 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Concomitant Medications</Label>
                      <Input
                        value={visitOtherMeds}
                        onChange={(e) => setVisitOtherMeds(e.target.value)}
                        placeholder="e.g. Tacrolimus 1mg BD, Calcium + Vit D"
                        className="mt-1 h-10 bg-white"
                      />
                    </div>
                  </div>

                  {/* Notes & Next Follow-up */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700">Doctor's Clinical Notes / Plan</Label>
                      <Input
                        value={visitNotes}
                        onChange={(e) => setVisitNotes(e.target.value)}
                        placeholder="Clinical impression, dietary trigger discussion, lab investigations ordered..."
                        className="mt-1 h-10 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" /> Next OPD Date
                      </Label>
                      <Input
                        type="date"
                        value={visitFollowup}
                        onChange={(e) => setVisitFollowup(e.target.value)}
                        className="mt-1 h-10 bg-white"
                      />
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      Signing Doctor: <strong>Dr. Swarnim</strong>
                    </span>
                    <Button
                      type="submit"
                      disabled={isSavingVisit}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-11 rounded-xl shadow-md"
                    >
                      {isSavingVisit ? 'Saving OPD Visit...' : '✓ Save OPD Encounter Record'}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* ── TAB 2: SUBSEQUENT VISITS CHRONOLOGICAL TIMELINE ── */}
              <TabsContent value="history" className="mt-4">
                <div className="space-y-3">
                  {(!activePatientData?.visits || activePatientData.visits.length === 0) ? (
                    <div className="p-8 text-center text-slate-400">
                      <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-semibold">No visits recorded yet for this patient</p>
                      <p className="text-xs mt-1">Use the "Record Today's Visit" tab to log the initial clinical encounter.</p>
                    </div>
                  ) : (
                    activePatientData.visits.map((v, idx) => (
                      <div
                        key={v.id || idx}
                        className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white text-xs font-bold font-mono">
                              Visit #{activePatientData.visits.length - idx}
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              {v.visit_date} {v.visit_time && `· ${v.visit_time}`}
                            </span>
                            <span className="text-xs text-slate-500">by {v.doctor_name || 'Dr. Swarnim'}</span>
                          </div>
                          <Badge
                            className={`text-[10px] font-bold ${
                              v.urine_protein in ['Nil', 'Trace'] && v.edema_grade === 'None'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {v.diagnosis_status || 'Clinical Record'}
                          </Badge>
                        </div>

                        {/* Vitals summary badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-200/70 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Weight</span>
                            <span className="font-bold text-slate-800">{v.weight ? `${v.weight} kg` : '—'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
                            <span className="font-bold text-slate-800">{v.bp_systolic ? `${v.bp_systolic}/${v.bp_diastolic}` : '—'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Edema Grade</span>
                            <span className="font-bold text-slate-800">{v.edema_grade || 'None'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Urine Dipstick</span>
                            <span className="font-bold text-slate-800">{v.urine_protein || 'Nil'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Next Follow-up</span>
                            <span className="font-bold text-blue-700">{v.next_followup || 'As scheduled'}</span>
                          </div>
                        </div>

                        {/* Steroid & Notes */}
                        {(v.steroid_dose || v.clinical_notes) && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-xs text-slate-700 space-y-1">
                            {v.steroid_dose && (
                              <p><strong>Steroid Regimen:</strong> {v.steroid_dose}</p>
                            )}
                            {v.clinical_notes && (
                              <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                                <strong>Doctor's Notes:</strong> {v.clinical_notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* ── TAB 3: SCANNED DOCUMENTS & DIPSTICK STRIPS ── */}
              <TabsContent value="documents" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">
                      Stored records tagged to CR {selectedPatient.cr_number}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setShowDocUploadModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Document
                    </Button>
                  </div>

                  {patientDocs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-semibold">No scanned documents yet for this CR number</p>
                      <p className="text-xs mt-1">Use the Doc Scanner or upload lab reports, dipstick snapshots, and slips.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {patientDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 hover:border-blue-300 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            {doc.category === 'dipstick' ? (
                              <Droplets className="w-6 h-6" />
                            ) : (
                              <FileText className="w-6 h-6" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{doc.title}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{doc.category} · {doc.timestamp}</p>
                            {doc.test_result_tag && (
                              <Badge variant="outline" className="text-[9px] mt-1 bg-white font-bold">
                                {doc.test_result_tag}
                              </Badge>
                            )}
                            {doc.doctor_notes && (
                              <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                                {doc.doctor_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── TAB 4: RENAL NUTRITION & CLINICAL PRESCRIPTION PLAN ── */}
              <TabsContent value="nutrition" className="mt-4">
                {(() => {
                  const childAge = parseFloat(selectedPatient.age) || 7;
                  const childGender = selectedPatient.gender || 'Male';
                  const currentWt = parseFloat(visitWeight) || parseFloat(selectedPatient.baseline_weight) || 21.4;
                  
                  // PRINT SDI (Polderman 2026 / 50th centile)
                  let energyPerKg = childAge <= 6 ? [67, 93] : childAge <= 8 ? [60, 77] : [55, 69];
                  let proteinPerKg = [0.90, 0.95];
                  let sodiumCeilingMg = nutritionCondition === 'ns_relapse' ? 1200 : 1700;
                  let fluidCeilingMl = customFluidLimit ? parseFloat(customFluidLimit) : Math.round(currentWt * 50);

                  const dailyEnergy = [Math.round(currentWt * energyPerKg[0]), Math.round(currentWt * energyPerKg[1])];
                  const dailyProtein = [Math.round(currentWt * proteinPerKg[0]), Math.round(currentWt * proteinPerKg[1])];

                  const planCode = `KCPLAN-${childAge}Y-${childGender === 'Male' ? 'M' : 'F'}-WT${currentWt}-EL${dailyEnergy[0]}-EH${dailyEnergy[1]}-NA${sodiumCeilingMg}-FL${fluidCeilingMl}${isPotassiumRestricted ? '-K_RESTRICT' : ''}${isPhosphateRestricted ? '-P_RESTRICT' : ''}${isLeachingSignedOff ? '-LEACH_OK' : ''}`;

                  const shareText = `KidneyCare Paediatric Nutrition Plan (AIIMS Patna)\nPatient: ${selectedPatient.patient_name} (CR: ${selectedPatient.cr_number})\nPrescribed Doctor Code: ${planCode}\n\nPrescribed Daily Targets:\n• Energy SDI: ${dailyEnergy[0]} - ${dailyEnergy[1]} kcal/day (50th centile)\n• Safe Protein SDI: ${dailyProtein[0]} - ${dailyProtein[1]} g/day (97.5% safe tier)\n• Sodium Ceiling: < ${sodiumCeilingMg} mg Na/day (~${(sodiumCeilingMg / 400).toFixed(1)}g salt / 1/2 tsp)\n• Fluid Allowance: < ${fluidCeilingMl} mL/day\n• Leaching Sign-Off: ${isLeachingSignedOff ? 'Approved by Dietitian' : 'Restricted (Needs Sign-Off)'}\n\nCaregiver Instructions: Open your KidneyCare app and tap "Doctor's Plan Code" to lock targets.`;

                  return (
                    <div className="space-y-4">
                      {/* Active Patient Nutrition Prescription Banner */}
                      <div className="p-4 bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white rounded-2xl border border-emerald-500/30 shadow-md space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🥗</span>
                              <h3 className="text-sm font-black text-emerald-300">
                                Renal Nutrition Prescription: {selectedPatient.patient_name}
                              </h3>
                              <Badge className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0">
                                Age {childAge}y · {currentWt} kg
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">
                              Computed via PRINT 2026 Suggested Dietary Intake (SDI) &amp; ICMR-NIN CDRR Standards
                            </p>
                          </div>

                          <Link
                            to="/NutritionHub"
                            onClick={() => {
                              setRole('clinician');
                              localStorage.setItem('kc_user_role', 'clinician');
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Launch 643 Food Hub</span>
                          </Link>
                        </div>

                        {/* Calculated Live Targets Strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                            <span className="text-[10px] text-emerald-200 block font-semibold uppercase">Energy SDI (50th)</span>
                            <span className="text-base font-black text-amber-300">{dailyEnergy[0]} – {dailyEnergy[1]}</span>
                            <span className="text-[10px] text-slate-300 block">kcal/day</span>
                          </div>
                          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                            <span className="text-[10px] text-emerald-200 block font-semibold uppercase">Safe Protein SDI</span>
                            <span className="text-base font-black text-white">{dailyProtein[0]} – {dailyProtein[1]}</span>
                            <span className="text-[10px] text-slate-300 block">g/day (97.5% safe)</span>
                          </div>
                          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                            <span className="text-[10px] text-emerald-200 block font-semibold uppercase">Sodium Ceiling</span>
                            <span className="text-base font-black text-red-300">&lt; {sodiumCeilingMg} mg</span>
                            <span className="text-[10px] text-slate-300 block">Na/day (~{(sodiumCeilingMg / 400).toFixed(1)}g salt)</span>
                          </div>
                          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                            <span className="text-[10px] text-emerald-200 block font-semibold uppercase">Fluid Allowance</span>
                            <span className="text-base font-black text-blue-300">&lt; {fluidCeilingMl} mL</span>
                            <span className="text-[10px] text-slate-300 block">total fluid/day</span>
                          </div>
                        </div>

                        {/* Generated Plan Code Display */}
                        <div className="bg-black/50 border border-white/15 p-3 rounded-xl flex items-center justify-between gap-2 font-mono text-xs">
                          <span className="text-emerald-400 font-bold truncate">
                            {planCode}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(planCode);
                                setCodeCopiedToast(true);
                                setTimeout(() => setCodeCopiedToast(false), 2000);
                              }}
                              className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{codeCopiedToast ? 'Copied!' : 'Copy'}</span>
                            </button>
                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-sans font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Clinical Condition & Restrictions Control Form */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                          <span>⚙️</span> Clinical Condition &amp; Electrolyte Restrictions
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <Label className="text-xs font-bold text-slate-700">Patient Phase / Disease Cohort</Label>
                            <select
                              value={nutritionCondition}
                              onChange={(e) => setNutritionCondition(e.target.value)}
                              className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-semibold bg-slate-50 text-slate-900"
                            >
                              <option value="ns_relapse">Nephrotic Syndrome — Acute Relapse Watch (Strict &lt; 1,200 mg Na)</option>
                              <option value="ns_remission">Nephrotic Syndrome — Remission (Normal CDRR)</option>
                              <option value="ckd_2_3">CKD Stages 2–3 (Pre-dialysis)</option>
                              <option value="ckd_4_5">CKD Stages 4–5 (Non-dialysis)</option>
                              <option value="pd">Peritoneal Dialysis (PD — Protein loss + Dextrose)</option>
                              <option value="hd">Hemodialysis (HD — Strict fluid &amp; potassium control)</option>
                            </select>
                          </div>

                          <div>
                            <Label className="text-xs font-bold text-slate-700">Custom Fluid Limit (mL/day)</Label>
                            <Input
                              type="number"
                              value={customFluidLimit}
                              onChange={(e) => setCustomFluidLimit(e.target.value)}
                              placeholder={`Default: ${Math.round(currentWt * 50)} mL`}
                              className="mt-1 h-9 bg-slate-50 text-xs font-bold"
                            />
                          </div>
                        </div>

                        {/* Restriction Checkboxes */}
                        <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs text-slate-800">
                          <label className="flex items-center gap-2 cursor-pointer font-medium">
                            <input
                              type="checkbox"
                              checked={isPotassiumRestricted}
                              onChange={(e) => setIsPotassiumRestricted(e.target.checked)}
                              className="w-4 h-4 rounded text-emerald-600"
                            />
                            <span>
                              <strong>Restrict Dietary Potassium</strong> (Active when serial serum K ≥ 5.3 mmol/L; turns high-K food badges red)
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer font-medium">
                            <input
                              type="checkbox"
                              checked={isPhosphateRestricted}
                              onChange={(e) => setIsPhosphateRestricted(e.target.checked)}
                              className="w-4 h-4 rounded text-emerald-600"
                            />
                            <span>
                              <strong>Restrict Inorganic Phosphate Additives</strong> (Focus on INS 338–452 before limiting natural dals)
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer font-medium p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                            <input
                              type="checkbox"
                              checked={isLeachingSignedOff}
                              onChange={(e) => setIsLeachingSignedOff(e.target.checked)}
                              className="w-4 h-4 rounded text-amber-600"
                            />
                            <span className="text-amber-900">
                              <strong>Registered Renal Dietitian Sign-off for Leaching (Conflict C6)</strong> — Confirms water-soluble vitamin supplementation is initiated before recommending double-boil leaching to caregiver.
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <QrCode className="w-12 h-12 mx-auto text-blue-600 mb-3 opacity-60 animate-pulse" />
            <h3 className="text-base font-bold text-slate-800">No Patient Selected</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Scan the patient's OPD card barcode / QR code, search by CR number, or select a patient from the queue above to open their clinical encounter.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                onClick={() => {
                  setShowScannerModal(true);
                  setCameraActive(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                <QrCode className="w-4 h-4 mr-1.5" /> Scan Barcode
              </Button>
              <Button
                onClick={() => setShowEnrollModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                <UserPlus className="w-4 h-4 mr-1.5" /> Enroll New Patient
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL 1: ENROLL NEW PATIENT ── */}
      <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
        <DialogContent className="max-w-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Enroll New Patient (AIIMS OPD)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEnrollSubmit} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-semibold">CR Number / Barcode</Label>
                <Input
                  value={newPatient.cr_number}
                  onChange={(e) => setNewPatient({ ...newPatient, cr_number: e.target.value })}
                  placeholder="Leave blank to auto-generate"
                  className="mt-1 h-9 font-mono text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Child Full Name</Label>
                <Input
                  value={newPatient.patient_name}
                  onChange={(e) => setNewPatient({ ...newPatient, patient_name: e.target.value })}
                  placeholder="e.g. Aarav Kumar"
                  className="mt-1 h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <Label className="text-xs font-semibold">Age</Label>
                <Input
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                  placeholder="e.g. 7 Years"
                  className="mt-1 h-9 text-xs"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Gender</Label>
                <select
                  value={newPatient.gender}
                  onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                  className="w-full mt-1 h-9 px-2 rounded-md border border-slate-200 text-xs bg-white"
                >
                  <option value="Male">Male / पुरुष</option>
                  <option value="Female">Female / महिला</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Blood Group</Label>
                <select
                  value={newPatient.blood_group}
                  onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}
                  className="w-full mt-1 h-9 px-2 rounded-md border border-slate-200 text-xs bg-white"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-semibold">Guardian / Parent Name</Label>
                <Input
                  value={newPatient.guardian_name}
                  onChange={(e) => setNewPatient({ ...newPatient, guardian_name: e.target.value })}
                  placeholder="Parent name"
                  className="mt-1 h-9 text-xs"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Guardian Mobile (for SMS Alert)</Label>
                <Input
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="mt-1 h-9 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Diagnosis / Nephrotic Classification</Label>
              <select
                value={newPatient.diagnosis}
                onChange={(e) => setNewPatient({ ...newPatient, diagnosis: e.target.value })}
                className="w-full mt-1 h-9 px-2 rounded-md border border-slate-200 text-xs bg-white"
              >
                <option value="Steroid Sensitive Nephrotic Syndrome (SSNS)">Steroid Sensitive Nephrotic Syndrome (SSNS)</option>
                <option value="Frequent Relapsing Nephrotic Syndrome (FRNS)">Frequent Relapsing Nephrotic Syndrome (FRNS)</option>
                <option value="Steroid Dependent Nephrotic Syndrome (SDNS)">Steroid Dependent Nephrotic Syndrome (SDNS)</option>
                <option value="Steroid Resistant Nephrotic Syndrome (SRNS)">Steroid Resistant Nephrotic Syndrome (SRNS)</option>
                <option value="First Episode Nephrotic Syndrome">First Episode Nephrotic Syndrome</option>
                <option value="Congenital / Infantile Nephrotic Syndrome">Congenital / Infantile Nephrotic Syndrome</option>
                <option value="CKD Stage 2-3">CKD Stage 2-3</option>
                <option value="CKD Stage 4-5">CKD Stage 4-5</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-semibold">Baseline Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newPatient.baseline_weight}
                  onChange={(e) => setNewPatient({ ...newPatient, baseline_weight: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Baseline Height (cm)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={newPatient.baseline_height}
                  onChange={(e) => setNewPatient({ ...newPatient, baseline_height: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="mt-4 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setShowEnrollModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                ✓ Enroll Patient in OPD
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 2: LIVE CAMERA BARCODE & QR SCANNER ── */}
      <Dialog open={showScannerModal} onOpenChange={(open) => {
        setShowScannerModal(open);
        setCameraActive(open);
      }}>
        <DialogContent className="max-w-md p-5 text-center">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600" />
              Scan Patient Barcode / QR Code
            </DialogTitle>
          </DialogHeader>

          <div className="mt-3">
            {cameraActive ? (
              <div className="relative w-full h-56 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border-2 border-indigo-500 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Scanning overlay frame */}
                <div className="absolute inset-8 border-2 border-dashed border-emerald-400 rounded-lg pointer-events-none animate-pulse" />
                <div className="absolute bottom-2 inset-x-0 text-center">
                  <span className="px-3 py-1 bg-black/70 text-white text-[10px] font-mono rounded-full">
                    Align barcode inside frame
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                Camera inactive
              </div>
            )}

            {/* Quick barcode simulation buttons for standard OPD cards */}
            <div className="mt-3">
              <p className="text-[11px] text-slate-500 font-semibold mb-1.5">
                Quick-scan sample AIIMS OPD cards:
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {['AIIMS/PED/2026/0412', 'AIIMS/PED/2026/0154', 'AIIMS/PED/2026/0289', 'AIIMS/PED/2026/0501'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleBarcodeScanned(code)}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[10px] font-mono border border-slate-200 transition-colors"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Barcode / CR Input */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <Input
                value={scannerManualInput}
                onChange={(e) => setScannerManualInput(e.target.value)}
                placeholder="Or type CR number manually..."
                className="h-10 text-xs font-mono"
              />
              <Button
                onClick={() => handleBarcodeScanned(scannerManualInput)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-4 text-xs"
              >
                Open
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 3: QUICK DOCUMENT ATTACHMENT ── */}
      <Dialog open={showDocUploadModal} onOpenChange={setShowDocUploadModal}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileUp className="w-5 h-5 text-blue-600" />
              Attach Document for {selectedPatient?.patient_name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUploadDoc} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs font-semibold">Document Category</Label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="w-full mt-1 h-9 px-2 rounded-md border border-slate-200 text-xs bg-white"
              >
                <option value="lab_report">Lab Report (UPCR, Renal Profile, Electrolytes)</option>
                <option value="dipstick">Urine Dipstick Strip Snapshot</option>
                <option value="prescription">AIIMS OPD Prescription / Discharge Slip</option>
                <option value="clinical_photo">Clinical Photo (Edema, Rash)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Document Title</Label>
              <Input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Spot UPCR Lab Report"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Select File or Photo</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setDocFile(e.target.files[0])}
                className="mt-1 h-9 text-xs"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Doctor's Notes (Optional)</Label>
              <Input
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                placeholder="e.g. Confirms persistent 2.4 UPCR"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <DialogFooter className="mt-4 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setShowDocUploadModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isUploadingDoc} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                {isUploadingDoc ? 'Uploading...' : '✓ Upload to Patient Record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
