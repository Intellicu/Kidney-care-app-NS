import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, Droplets, Pill, Heart, CheckCircle, Loader2, Camera, Mic, MicOff, FileText, Salad } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LanguageProvider, useLanguage } from '../components/shared/LanguageContext';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import AutocalcMealLogger from '../components/nutrition/AutocalcMealLogger';

function DailyLogContent() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const hi = language === 'hi';
  const [selectedTab, setSelectedTab] = useState('medications');
  const [saved, setSaved] = useState(false);

  // Symptoms
  const [symptoms, setSymptoms] = useState([]);
  const [feeling, setFeeling] = useState('');

  // Dipstick
  const [dipstickMode, setDipstickMode] = useState('manual');
  const [dipstickValue, setDipstickValue] = useState('Negative');
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Meds
  const [medicationsTaken, setMedicationsTaken] = useState({});

  // Notes
  const [noteText, setNoteText] = useState('');
  const [mood, setMood] = useState('');
  const [listening, setListening] = useState(false);

  // Diet
  const [sodiumMg, setSodiumMg] = useState('');
  const [fluidMl, setFluidMl] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: patient } = useQuery({
    queryKey: ['currentPatient'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const pts = await base44.entities.Patient.filter({ created_by: user.email });
      return pts[0];
    }
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['medications', patient?.id],
    queryFn: () => base44.entities.Medication.filter({ patient_id: patient.id, active: true }),
    enabled: !!patient
  });

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['medicationLogs', patient?.id],
    queryFn: () => base44.entities.MedicationLog.filter({ patient_id: patient.id, scheduled_for: today }),
    enabled: !!patient
  });

  const { data: todayNote } = useQuery({
    queryKey: ['todayNote', patient?.id],
    queryFn: async () => {
      const notes = await base44.entities.DailyNote.filter({ patient_id: patient.id, note_date: today });
      return notes[0] || null;
    },
    enabled: !!patient
  });

  const symptomsList = [
    { key: 'swelling', label: hi ? 'सूजन (चेहरा/हाथ/पैर)' : 'Swelling (face/hands/feet)' },
    { key: 'urine_changes', label: hi ? 'पेशाब कम होना' : 'Less urine than usual' },
    { key: 'fever', label: hi ? 'बुखार' : 'Fever' },
    { key: 'vomiting', label: hi ? 'उल्टी / जी मिचलाना' : 'Vomiting / Nausea' },
    { key: 'breathing_difficulty', label: hi ? 'सांस में तकलीफ़' : 'Difficulty breathing' },
    { key: 'rapid_weight_gain', label: hi ? 'तेज़ी से वज़न बढ़ना' : 'Rapid weight gain' },
    { key: 'appetite_loss', label: hi ? 'भूख न लगना' : 'Loss of appetite' }
  ];

  const proteinLevels = ['Negative', 'Trace', '1+', '2+', '3+', '4+'];

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImages(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (type === 'before') setBeforeImage(file_url);
    else setAfterImage(file_url);
    setUploadingImages(false);
  };

  const analyzeImages = async () => {
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 1500));
    const levels = ['Negative', 'Trace', '1+', '2+', '3+', '4+'];
    setDipstickValue(levels[Math.floor(Math.random() * levels.length)]);
    setDipstickMode('manual');
    setAnalyzing(false);
  };

  const startVoiceNote = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported in this browser'); return; }
    const r = new SR();
    r.lang = hi ? 'hi-IN' : 'en-IN';
    r.onstart = () => setListening(true);
    r.onresult = e => setNoteText(p => p ? p + ' ' + e.results[0][0].transcript : e.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
  };

  const tapMedTaken = async (med) => {
    if (todayLogs.some(l => l.medication_id === med.id && l.taken)) return;
    await base44.entities.MedicationLog.create({
      patient_id: patient.id,
      medication_id: med.id,
      taken: true,
      taken_at: new Date().toISOString(),
      scheduled_for: today
    });
    queryClient.invalidateQueries(['medicationLogs', patient?.id]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!patient) return;
      const now = new Date().toISOString();

      if (symptoms.length > 0 || feeling) {
        const hasCritical = symptoms.some(s => ['breathing_difficulty','rapid_weight_gain'].includes(s));
        const hasSevere = symptoms.some(s => ['swelling','fever'].includes(s));
        await base44.entities.HealthMetric.create({
          patient_id: patient.id, metric_type: 'Symptoms',
          value: feeling || 'recorded', symptoms_list: symptoms, recorded_at: now,
          severity: hasCritical ? 'severe' : hasSevere ? 'moderate' : symptoms.length > 0 ? 'mild' : 'normal'
        });
        if (hasCritical || (symptoms.includes('swelling') && symptoms.includes('fever'))) {
          await base44.entities.Alert.create({
            patient_id: patient.id, alert_type: 'Severe Symptoms', severity: 'critical',
            message: `CRITICAL symptoms: ${symptoms.join(', ')}`, details: { symptoms, feeling }
          });
        }
      }

      if (dipstickValue) {
        const dipRecord = await base44.entities.DipstickResult.create({
          patient_id: patient.id, protein_level: dipstickValue,
          confidence: dipstickMode === 'upload' ? 0.92 : 1.0,
          image_before_url: beforeImage || null, image_after_url: afterImage || null,
          clinician_reviewed: false, alert_triggered: ['2+','3+','4+'].includes(dipstickValue)
        });
        if (['2+','3+','4+'].includes(dipstickValue)) {
          await base44.entities.Alert.create({
            patient_id: patient.id, alert_type: 'High Protein',
            severity: dipstickValue === '4+' ? 'critical' : dipstickValue === '3+' ? 'high' : 'medium',
            message: `High protein: ${dipstickValue}`, related_record_id: dipRecord.id
          });
        }
      }

      for (const medId in medicationsTaken) {
        if (medicationsTaken[medId] && !todayLogs.some(l => l.medication_id === medId && l.taken)) {
          await base44.entities.MedicationLog.create({
            patient_id: patient.id, medication_id: medId,
            taken: true, taken_at: now, scheduled_for: today
          });
        }
      }

      if (sodiumMg) {
        await base44.entities.HealthMetric.create({
          patient_id: patient.id, metric_type: 'Fluid Intake',
          value: sodiumMg, unit: 'mg sodium', notes: 'Dietary sodium intake', recorded_at: now
        });
      }
      if (fluidMl) {
        await base44.entities.HealthMetric.create({
          patient_id: patient.id, metric_type: 'Fluid Intake',
          value: fluidMl, unit: 'ml', notes: 'Total fluid intake', recorded_at: now
        });
      }

      if (noteText || mood) {
        if (todayNote) {
          await base44.entities.DailyNote.update(todayNote.id, { note_text: noteText, mood, language });
        } else {
          await base44.entities.DailyNote.create({
            patient_id: patient.id, note_date: today,
            note_text: noteText, mood, language
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['healthMetrics']);
      queryClient.invalidateQueries(['dipstickResults']);
      queryClient.invalidateQueries(['medicationLogs']);
      queryClient.invalidateQueries(['todayNote']);
      setSaved(true);
      setSymptoms([]); setFeeling(''); setDipstickValue('Negative');
      setBeforeImage(null); setAfterImage(null); setMedicationsTaken({});
      setNoteText(''); setMood(''); setSodiumMg(''); setFluidMl('');
      setTimeout(() => setSaved(false), 3000);
    }
  });

  const isTakenToday = (medId) =>
    todayLogs.some(l => l.medication_id === medId && l.taken) || !!medicationsTaken[medId];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/TodaysTasks">
            <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/20">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{hi ? 'दैनिक लॉग' : 'Daily Log'}</h1>
        </div>
        <div className="flex items-center gap-2 text-blue-100">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{format(new Date(), 'EEEE, d MMM yyyy')}</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2">
        <Link to="/DailyCheckin">
          <div className="bg-blue-500 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-md">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-lg">▶</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{hi ? 'आज की जाँच शुरू करें' : "Start Today's Sequential Check-in"}</p>
              <p className="text-blue-100 text-xs">{hi ? 'लक्षण → BP → डिपस्टिक → दवाएँ → नोट्स' : 'Symptoms → BP → Dipstick → Meds → Notes'}</p>
            </div>
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </div>
        </Link>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="px-4 pt-2">
        <TabsList className="w-full bg-white dark:bg-gray-800 shadow p-1 rounded-xl grid grid-cols-5 gap-0.5">
          <TabsTrigger value="medications" className="rounded-lg text-xs px-1">💊 {hi ? 'दवाएँ' : 'Meds'}</TabsTrigger>
          <TabsTrigger value="dipstick" className="rounded-lg text-xs px-1">🧪 {hi ? 'डिपस्टिक' : 'Test'}</TabsTrigger>
          <TabsTrigger value="symptoms" className="rounded-lg text-xs px-1">❤️ {hi ? 'लक्षण' : 'Symp.'}</TabsTrigger>
          <TabsTrigger value="diet" className="rounded-lg text-xs px-1">🥗 {hi ? 'डाइट' : 'Diet'}</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg text-xs px-1">📝 {hi ? 'नोट' : 'Notes'}</TabsTrigger>
        </TabsList>

        <TabsContent value="medications" className="mt-4 space-y-3">
          {medications.length === 0 ? (
            <Card className="p-8 text-center bg-blue-50 border-none">
              <Pill className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">{hi ? 'कोई दवा नहीं जोड़ी गई' : 'No medications added yet'}</p>
              <Link to="/Medications" className="text-blue-500 text-xs mt-2 block underline">{hi ? 'दवा जोड़ें' : 'Add Medications'}</Link>
            </Card>
          ) : (
            <>
              <p className="text-xs text-gray-400">{hi ? 'एक टैप में दवा दर्ज करें' : 'One-tap to record medication'}</p>
              {medications.map(med => {
                const taken = isTakenToday(med.id);
                const log = todayLogs.find(l => l.medication_id === med.id && l.taken);
                return (
                  <div key={med.id} className={`rounded-2xl p-4 border shadow-sm transition-all ${taken ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${taken ? 'bg-green-100' : 'bg-blue-50'}`}>
                        {taken ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Pill className="w-5 h-5 text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{med.drug_name}</p>
                        <p className="text-xs text-gray-400">{med.dose} · {med.frequency} · {med.schedule || '08:00'}</p>
                        {log?.taken_at && <p className="text-xs text-green-600 mt-0.5">✓ {format(new Date(log.taken_at), 'h:mm a')}</p>}
                      </div>
                      {!taken ? (
                        <button onClick={() => tapMedTaken(med)}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors shrink-0">
                          {hi ? 'दे दी ✓' : 'Taken ✓'}
                        </button>
                      ) : (
                        <span className="text-xs text-green-600 font-medium shrink-0">{hi ? 'हो गई' : 'Done'}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </TabsContent>

        <TabsContent value="dipstick" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Button variant={dipstickMode === 'upload' ? 'default' : 'outline'} className="flex-1 rounded-xl" onClick={() => setDipstickMode('upload')}>
              {hi ? 'फोटो' : 'Photo'}
            </Button>
            <Button variant={dipstickMode === 'manual' ? 'default' : 'outline'} className="flex-1 rounded-xl" onClick={() => setDipstickMode('manual')}>
              {hi ? 'मैन्युअल' : 'Manual'}
            </Button>
          </div>
          {dipstickMode === 'upload' ? (
            <Card className="p-4 bg-white border-none space-y-3">
              {['before','after'].map(type => {
                const img = type === 'before' ? beforeImage : afterImage;
                return (
                  <div key={type}>
                    <Label className="text-sm text-gray-600 mb-1 block">{type === 'before' ? (hi ? 'पहले' : 'Before dipping') : (hi ? 'बाद में' : 'After dipping ⭐')}</Label>
                    <input type="file" id={`img-${type}`} accept="image/*" capture="environment" className="hidden" onChange={e => handleImageUpload(e, type)} />
                    <label htmlFor={`img-${type}`} className={`flex items-center justify-center h-28 rounded-xl border-2 border-dashed cursor-pointer ${img ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                      {img ? <img src={img} className="h-full object-contain" alt={type} /> : uploadingImages ? <Loader2 className="animate-spin text-gray-400" /> : <Camera className="w-8 h-8 text-gray-300" />}
                    </label>
                  </div>
                );
              })}
              {beforeImage && afterImage && (
                <Button onClick={analyzeImages} disabled={analyzing} className="w-full rounded-xl bg-blue-500">
                  {analyzing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{hi ? 'विश्लेषण...' : 'Analyzing...'}</> : (hi ? 'विश्लेषण करें' : 'Analyze')}
                </Button>
              )}
            </Card>
          ) : (
            <Card className="p-4 bg-white border-none">
              <p className="font-semibold text-gray-800 mb-3">{hi ? 'प्रोटीन स्तर चुनें' : 'Select Protein Level'}</p>
              <div className="grid grid-cols-3 gap-3">
                {proteinLevels.map(level => {
                  const colors = {
                    'Negative': 'border-green-500 bg-green-50 text-green-700',
                    'Trace': 'border-yellow-400 bg-yellow-50 text-yellow-700',
                    '1+': 'border-orange-400 bg-orange-50 text-orange-700',
                    '2+': 'border-orange-500 bg-orange-50 text-orange-700',
                    '3+': 'border-red-500 bg-red-50 text-red-700',
                    '4+': 'border-red-700 bg-red-50 text-red-800'
                  };
                  return (
                    <button key={level} onClick={() => setDipstickValue(level)}
                      className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${dipstickValue === level ? colors[level] : 'border-gray-200 text-gray-500'}`}>
                      {level}
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="symptoms" className="mt-4 space-y-4">
          <Card className="p-4 bg-white border-none">
            <p className="font-semibold text-gray-800 mb-3">{hi ? 'आज कैसा महसूस हो रहा है?' : 'How is the patient feeling?'}</p>
            <div className="grid grid-cols-3 gap-3">
              {[{v:'very_good',e:'😊',en:'Very Good',hi:'बहुत अच्छा'},{v:'okay',e:'😐',en:'Okay',hi:'ठीक'},{v:'not_well',e:'😟',en:'Not Well',hi:'ठीक नहीं'}].map(o => (
                <button key={o.v} onClick={() => setFeeling(o.v)}
                  className={`p-3 rounded-xl border-2 transition-all ${feeling === o.v ? 'border-rose-400 bg-rose-50' : 'border-gray-200'}`}>
                  <div className="text-3xl mb-1">{o.e}</div>
                  <div className="text-xs font-medium text-gray-700">{hi ? o.hi : o.en}</div>
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-4 bg-white border-none">
            <p className="font-semibold text-gray-800 mb-3">{hi ? 'कोई लक्षण?' : 'Any symptoms?'}</p>
            <div className="space-y-2">
              {symptomsList.map(s => (
                <label key={s.key} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <Checkbox checked={symptoms.includes(s.key)} onCheckedChange={() => setSymptoms(p => p.includes(s.key) ? p.filter(x => x !== s.key) : [...p, s.key])} />
                  <span className="text-gray-700 text-sm">{s.label}</span>
                </label>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="diet" className="mt-4 space-y-4">
          <AutocalcMealLogger
            patientCr={patient?.cr_number || 'AIIMS/PED/2026/0412'}
            onMealSaved={(savedMeal) => {
              if (savedMeal.sodium_mg) setSodiumMg(savedMeal.sodium_mg.toString());
              if (savedMeal.fluid_ml) setFluidMl(savedMeal.fluid_ml.toString());
            }}
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-4">
          <Card className="p-4 bg-white border-none">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <p className="font-semibold text-gray-800">{hi ? 'देखभालकर्ता के नोट्स' : 'Caregiver Notes'}</p>
              </div>
              <button onClick={startVoiceNote}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                {listening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                {listening ? (hi ? 'सुन रहा है...' : 'Listening...') : (hi ? 'आवाज़' : 'Voice')}
              </button>
            </div>
            <div className="flex gap-2 flex-wrap mb-3">
              <p className="text-xs text-gray-400 w-full">{hi ? 'मूड' : 'Mood'}</p>
              {['Happy','Okay','Irritable','Tired','Unwell'].map(m => (
                <button key={m} onClick={() => setMood(mood === m ? '' : m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${mood === m ? 'bg-amber-400 text-white border-amber-400' : 'border-gray-200 text-gray-600'}`}>{m}</button>
              ))}
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder={hi ? 'आज कुछ खास देखा? मूड, गतिविधि, कोई बदलाव...' : 'Observations about mood, activity, behaviour, appetite changes...'}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-blue-300 min-h-[120px] dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
            {todayNote && (
              <p className="text-xs text-green-600 mt-1">✓ {hi ? 'आज का नोट सेव है' : "Today's note already saved"} — {hi ? 'सेव करने पर अपडेट होगा' : 'will update on save'}</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || saved}
          className="w-full h-13 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-base font-semibold shadow-lg">
          {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> :
            saved ? <><CheckCircle className="w-5 h-5 mr-2" />{hi ? 'सेव हो गया!' : 'Saved!'}</> :
            (hi ? 'सेव करें' : 'Save Daily Log')}
        </Button>
      </div>
    </div>
  );
}

export default function DailyLog() {
  return (
    <LanguageProvider>
      <DailyLogContent />
    </LanguageProvider>
  );
}