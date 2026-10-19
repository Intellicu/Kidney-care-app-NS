import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Pill, Clock, CheckCircle, X, Camera, Loader2, CalendarDays } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LanguageProvider, useLanguage } from '../components/shared/LanguageContext';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import MedAdherenceCalendar from '../components/medications/MedAdherenceCalendar';
import PrescriptionOCR from '../components/medications/PrescriptionOCR';
import SteroidTaperCalendar from '../components/medications/SteroidTaperCalendar';

const PEDIATRIC_NEPHRO_SUGGESTIONS = [
  {
    name: 'Prednisolone (Omnacortil / Wysolone)',
    nameHi: 'प्रेडनिसोलोन (ओम्नाकोर्टिल)',
    dose: '10mg',
    commonDoses: ['5mg', '10mg', '15mg', '20mg', '30mg', '40mg'],
    schedule: 'morning',
    frequency: 'Once daily',
    icon: '💊',
    tag: 'Steroid'
  },
  {
    name: 'Shelcal / Cal + Vit D3',
    nameHi: 'शेल्कैल (कैल्शियम + D3)',
    dose: '500mg',
    commonDoses: ['250mg', '500mg', '5mL Syrup'],
    schedule: 'afternoon',
    frequency: 'Once daily',
    icon: '🦴',
    tag: 'Bone Guard'
  },
  {
    name: 'Enalapril (Envas)',
    nameHi: 'एनालाप्रिल (एनवास)',
    dose: '2.5mg',
    commonDoses: ['1.25mg', '2.5mg', '5mg'],
    schedule: 'night',
    frequency: 'Once daily',
    icon: '🫀',
    tag: 'Kidney Guard'
  },
  {
    name: 'Lasix / Furosemide',
    nameHi: 'लैसिक्स (फ्यूरोसेमाइड)',
    dose: '10mg',
    commonDoses: ['10mg', '20mg', '40mg'],
    schedule: 'morning',
    frequency: 'As needed',
    icon: '💧',
    tag: 'Diuretic / Edema'
  },
  {
    name: 'Levamisole',
    nameHi: 'लेवामिसोल',
    dose: '50mg',
    commonDoses: ['50mg', '75mg', '100mg'],
    schedule: 'morning',
    frequency: 'Alternate days',
    icon: '🛡️',
    tag: 'Alternate-Day'
  },
  {
    name: 'Mycophenolate Mofetil (MMF / Cellcept)',
    nameHi: 'एमएमएफ / सेलसेप्ट',
    dose: '250mg',
    commonDoses: ['250mg', '360mg', '500mg'],
    schedule: 'morning',
    frequency: 'Twice daily',
    icon: '🔬',
    tag: 'Immunosuppressant'
  },
  {
    name: 'Pantoprazole / Pan-20',
    nameHi: 'पेंटोप्राजोल (पैन-20)',
    dose: '20mg',
    commonDoses: ['20mg', '40mg'],
    schedule: 'morning',
    frequency: 'Once daily',
    icon: '🥣',
    tag: 'Stomach Guard'
  }
];

function MedicationsContent() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [newMed, setNewMed] = useState({
    drug_name: '',
    dose: '',
    schedule: 'morning',
    frequency: 'Once daily'
  });
  const [uploading, setUploading] = useState(false);

  const { data: patient } = useQuery({
    queryKey: ['currentPatient'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const patients = await base44.entities.Patient.filter({ created_by: user.email });
      return patients[0];
    }
  });

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ['medications', patient?.id],
    queryFn: () => patient 
      ? base44.entities.Medication.filter({ patient_id: patient.id, active: true })
      : [],
    enabled: !!patient
  });

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['medicationLogs', patient?.id],
    queryFn: () => patient 
      ? base44.entities.MedicationLog.filter({ 
          patient_id: patient.id, 
          scheduled_for: format(new Date(), 'yyyy-MM-dd')
        })
      : [],
    enabled: !!patient
  });

  // All logs for 28-day calendar
  const { data: allLogs = [] } = useQuery({
    queryKey: ['allMedLogs28', patient?.id],
    queryFn: () => base44.entities.MedicationLog.filter({ patient_id: patient.id }, 'scheduled_for', 200),
    enabled: !!patient,
    select: d => d.filter(l => l.scheduled_for && new Date(l.scheduled_for) >= subDays(new Date(), 27))
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!patient) return;
      await base44.entities.Medication.create({
        ...newMed,
        patient_id: patient.id,
        active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medications']);
      setShowAdd(false);
      setNewMed({ drug_name: '', dose: '', schedule: 'morning', frequency: 'Once daily' });
    }
  });

  const markTakenMutation = useMutation({
    mutationFn: async (medicationId) => {
      if (!patient) return;
      await base44.entities.MedicationLog.create({
        patient_id: patient.id,
        medication_id: medicationId,
        taken: true,
        taken_at: new Date().toISOString(),
        scheduled_for: format(new Date(), 'yyyy-MM-dd')
      });
      await base44.entities.Medication.update(medicationId, {
        last_taken: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medications']);
      queryClient.invalidateQueries(['medicationLogs']);
    }
  });

  const handleImageUpload = async (e, medId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Medication.update(medId, { image_url: file_url });
    queryClient.invalidateQueries(['medications']);
    setUploading(false);
  };

  const isTakenToday = (medId) => {
    return todayLogs.some(log => log.medication_id === medId && log.taken);
  };

  const scheduleLabels = {
    morning: language === 'hi' ? 'सुबह' : 'Morning',
    afternoon: language === 'hi' ? 'दोपहर' : 'Afternoon',
    evening: language === 'hi' ? 'शाम' : 'Evening',
    night: language === 'hi' ? 'रात' : 'Night'
  };

  const handleOCRExtracted = async (meds) => {
    for (const med of meds) {
      await base44.entities.Medication.create({ ...med, patient_id: patient.id, active: true });
    }
    queryClient.invalidateQueries(['medications']);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/TodaysTasks">
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/20">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">{language === 'hi' ? 'दवाएँ' : 'Medications'}</h1>
              <p className="text-blue-100 text-xs">{format(new Date(), 'EEEE, d MMM yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCalendar(v => !v)} className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30">
              <CalendarDays className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-xl bg-white flex items-center justify-center hover:bg-blue-50">
              <Plus className="w-5 h-5 text-blue-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto space-y-4">

        {/* Prescription OCR */}
        <PrescriptionOCR onMedicationsExtracted={handleOCRExtracted} hi={language === 'hi'} />

        {/* Adherence Calendar toggle */}
        {showCalendar && (
          <MedAdherenceCalendar medications={medications} medLogs={allLogs} hi={language === 'hi'} />
        )}

        {/* AI Steroid Taper Calendar & Alternate-Day Smart Alarm */}
        <SteroidTaperCalendar 
          crNumber={patient?.cr_number || "AIIMS/PED/2026/0412"} 
          hi={language === 'hi'} 
          onLogged={() => {
            queryClient.invalidateQueries(['medicationLogs']);
          }}
        />

        {/* Today's medications */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
            {language === 'hi' ? 'आज की दवाएँ' : "Today's Medications"} — {format(new Date(), 'MMMM d')}
          </h3>

          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></div>
          ) : medications.length === 0 ? (
            <Card className="p-8 text-center bg-orange-50 dark:bg-orange-900/20 border-none">
              <Pill className="w-12 h-12 text-orange-300 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{language === 'hi' ? 'कोई दवा नहीं जोड़ी गई' : 'No medications added yet'}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {medications.map((med, idx) => (
                <motion.div key={med.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <Card className={`p-4 border-none shadow-sm ${isTakenToday(med.id) ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800'}`}>
                    <div className="flex items-start gap-3">
                      {med.image_url ? (
                        <img src={med.image_url} alt={med.drug_name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      ) : (
                        <label className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors shrink-0">
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, med.id)} />
                          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : <Camera className="w-5 h-5 text-gray-400" />}
                        </label>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{med.drug_name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{med.dose}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{scheduleLabels[med.schedule]} · {med.frequency}</span>
                        </div>
                      </div>
                      {isTakenToday(med.id) ? (
                        <div className="flex items-center gap-1 text-green-600 bg-green-100 dark:bg-green-800/40 px-3 py-1.5 rounded-full shrink-0">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">{t('taken')}</span>
                        </div>
                      ) : (
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 rounded-xl px-4 shrink-0"
                          onClick={() => markTakenMutation.mutate(med.id)} disabled={markTakenMutation.isPending}>
                          {markTakenMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'hi' ? 'दे दी ✓' : 'Taken ✓')}
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Medication Dialog with Manual Clinical Suggestions */}
      <Dialog open={showAdd} onOpenChange={(open) => {
        setShowAdd(open);
        if (!open) setSelectedSuggestion(null);
      }}>
        <DialogContent className="max-w-md mx-auto rounded-3xl p-5 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-gray-900 dark:text-white border-b pb-2">
              <Pill className="w-5 h-5 text-blue-600" />
              <span>{t('add_medication')}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            {/* ── AIIMS PEDIATRIC NEPHROLOGY SUGGESTION CHIPS ── */}
            <div className="space-y-1.5 bg-blue-50/70 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-200/80 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-1">
                  <span>💡</span>
                  {language === 'hi' ? 'एम्स नेफ्रोलॉजी दवा सुझाव (1-टैप भरें):' : 'Pediatric Nephrology Quick Suggestions:'}
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">1-Tap Fill</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PEDIATRIC_NEPHRO_SUGGESTIONS.map((sugg) => {
                  const isSelected = newMed.drug_name === sugg.name;
                  return (
                    <button
                      key={sugg.name}
                      type="button"
                      onClick={() => {
                        setSelectedSuggestion(sugg);
                        setNewMed({
                          drug_name: sugg.name,
                          dose: sugg.dose,
                          schedule: sugg.schedule,
                          frequency: sugg.frequency
                        });
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                          : 'bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-200 border border-blue-200 dark:border-blue-700 hover:bg-blue-100/60'
                      }`}
                    >
                      <span>{sugg.icon}</span>
                      <span>{language === 'hi' ? sugg.nameHi : sugg.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Dose Modifier Chips if a suggestion is selected */}
            {selectedSuggestion && selectedSuggestion.commonDoses && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'hi' ? 'खुराक चुनें (Dose):' : 'Select Dose:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSuggestion.commonDoses.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setNewMed(prev => ({ ...prev, dose: d }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                        newMed.dose === d
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Editable Drug Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{t('drug_name')}</Label>
              <Input
                value={newMed.drug_name}
                onChange={(e) => setNewMed({ ...newMed, drug_name: e.target.value })}
                placeholder="e.g., Prednisolone (Omnacortil)"
                className="h-11 rounded-xl text-xs font-bold"
              />
            </div>
            
            {/* Editable Dose */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{t('dose')}</Label>
              <Input
                value={newMed.dose}
                onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
                placeholder="e.g., 10mg / 5mL"
                className="h-11 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            {/* Schedule & Frequency */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{t('schedule')}</Label>
                <Select
                  value={newMed.schedule}
                  onValueChange={(value) => setNewMed({ ...newMed, schedule: value })}
                >
                  <SelectTrigger className="h-11 rounded-xl text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">{scheduleLabels.morning}</SelectItem>
                    <SelectItem value="afternoon">{scheduleLabels.afternoon}</SelectItem>
                    <SelectItem value="evening">{scheduleLabels.evening}</SelectItem>
                    <SelectItem value="night">{scheduleLabels.night}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{t('frequency')}</Label>
                <Select
                  value={newMed.frequency}
                  onValueChange={(value) => setNewMed({ ...newMed, frequency: value })}
                >
                  <SelectTrigger className="h-11 rounded-xl text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Once daily">{language === 'hi' ? 'दिन में 1 बार (1x/day)' : 'Once daily'}</SelectItem>
                    <SelectItem value="Twice daily">{language === 'hi' ? 'दिन में 2 बार (2x/day)' : 'Twice daily'}</SelectItem>
                    <SelectItem value="Three times daily">{language === 'hi' ? 'दिन में 3 बार (3x/day)' : 'Three times daily'}</SelectItem>
                    <SelectItem value="Alternate days">{language === 'hi' ? 'एक दिन छोड़कर (Alternate days)' : 'Alternate days'}</SelectItem>
                    <SelectItem value="As needed">{language === 'hi' ? 'ज़रूरत पड़ने पर (SOS)' : 'As needed'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={() => addMutation.mutate()}
              disabled={!newMed.drug_name || !newMed.dose || addMutation.isPending}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md mt-2"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `✓ ${t('save')} Medication`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Medications() {
  return (
    <LanguageProvider>
      <MedicationsContent />
    </LanguageProvider>
  );
}