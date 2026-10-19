import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock, Plus, Trash2, Edit3, Check, RotateCcw, AlertTriangle,
  Copy, Save, Calendar, CheckCircle2, FileText, ChevronDown, ChevronUp,
  Flame, Droplets, Info, Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import SeverityBadge from '@/components/SeverityBadge';
import { useLanguage } from '../shared/LanguageContext';
import { FOOD_DATABASE } from './foods';
import { scaleNutrients, calculateMealTotals, evaluateAgainstTargets, MG_NA_PER_GRAM_SALT } from './calc';
import { computePrescriptionTargets } from './targets';

// 6 clinical meal slots for a 24-hour dietary recall
const RECALL_SLOTS = [
  { id: 'breakfast', labelEn: 'Breakfast', labelHi: 'सुबह का नाश्ता', time: '08:00 AM' },
  { id: 'mid_morning', labelEn: 'Mid-Morning', labelHi: 'दोपहर पूर्व अल्पाहार', time: '11:00 AM' },
  { id: 'lunch', labelEn: 'Lunch', labelHi: 'दोपहर का भोजन', time: '01:30 PM' },
  { id: 'evening', labelEn: 'Evening Snack', labelHi: 'शाम का नाश्ता', time: '05:00 PM' },
  { id: 'dinner', labelEn: 'Dinner', labelHi: 'रात का खाना', time: '08:30 PM' },
  { id: 'bedtime', labelEn: 'Bedtime', labelHi: 'सोने से पहले', time: '10:00 PM' }
];

export default function RecallLogger({ patientProfile, onSaveRecall }) {
  const { language } = useLanguage();
  const hi = language === 'hi';

  const [recallDate, setRecallDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });

  const [patientCondition, setPatientCondition] = useState(patientProfile?.condition || 'nephrotic_relapse');
  const [weightKg, setWeightKg] = useState(patientProfile?.weightKg || 21.4);
  const [heightCm, setHeightCm] = useState(patientProfile?.heightCm || 118);

  // Targets from prescription engine
  const targets = useMemo(() => {
    return computePrescriptionTargets({
      weightKg: Number(weightKg) || 21.4,
      heightCm: Number(heightCm) || 118,
      dob: patientProfile?.dob,
      condition: patientCondition
    });
  }, [weightKg, heightCm, patientCondition, patientProfile]);

  // Custom foods loaded from storage
  const [customFoods, setCustomFoods] = useState([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kidneycare_custom_foods');
      if (stored) {
        setCustomFoods(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load custom foods', e);
    }
  }, []);

  // Combined food list
  const allFoods = useMemo(() => {
    return [...FOOD_DATABASE, ...customFoods];
  }, [customFoods]);

  // Recall entries organized by slot
  const [slotsData, setSlotsData] = useState(() => {
    // Initial sample 24-hour recall
    return {
      breakfast: [
        {
          id: 'b-1',
          foodId: 'f-poha',
          name: 'Poha with vegetables',
          portionName: '1 small katori (100g)',
          portionGrams: 100,
          calories: 145,
          protein: 2.8,
          sodium: 25,
          potassium: 165,
          phosphorus: 75,
          fluid: 0,
          isManualOverride: false
        },
        {
          id: 'b-2',
          foodId: 'f-cow-milk',
          name: 'Cow milk (toned)',
          portionName: '1 small cup (100 ml)',
          portionGrams: 100,
          calories: 61,
          protein: 3.2,
          sodium: 48,
          potassium: 150,
          phosphorus: 95,
          fluid: 100,
          isManualOverride: false
        }
      ],
      mid_morning: [
        {
          id: 'mm-1',
          foodId: 'f-apple',
          name: 'Apple with peel',
          portionName: '1 small apple (100g)',
          portionGrams: 100,
          calories: 52,
          protein: 0.3,
          sodium: 2,
          potassium: 107,
          phosphorus: 11,
          fluid: 0,
          isManualOverride: false
        }
      ],
      lunch: [
        {
          id: 'l-1',
          foodId: 'f-roti-wheat',
          name: 'Roti (phulka, no ghee)',
          portionName: '1 medium roti (30g)',
          portionGrams: 30,
          calories: 96,
          protein: 3.6,
          sodium: 6,
          potassium: 108,
          phosphorus: 84,
          fluid: 0,
          isManualOverride: false
        },
        {
          id: 'l-2',
          foodId: 'f-boiled-rice',
          name: 'Steamed white rice',
          portionName: '1 medium katori (150g)',
          portionGrams: 150,
          calories: 195,
          protein: 4.1,
          sodium: 5,
          potassium: 42,
          phosphorus: 57,
          fluid: 0,
          isManualOverride: false
        },
        {
          id: 'l-3',
          foodId: 'f-lauki-cooked',
          name: 'Cooked lauki sabzi',
          portionName: '1 medium katori (150g)',
          portionGrams: 150,
          calories: 45,
          protein: 0.8,
          sodium: 12,
          potassium: 110,
          phosphorus: 25,
          fluid: 0,
          isManualOverride: false
        }
      ],
      evening: [
        {
          id: 'e-1',
          foodId: 'f-roasted-makhana',
          name: 'Roasted makhana',
          portionName: '1 medium katori (30g)',
          portionGrams: 30,
          calories: 105,
          protein: 2.9,
          sodium: 8,
          potassium: 150,
          phosphorus: 66,
          fluid: 0,
          isManualOverride: false
        }
      ],
      dinner: [
        {
          id: 'd-1',
          foodId: 'f-roti-wheat',
          name: 'Roti (phulka, no ghee)',
          portionName: '2 medium rotis (60g)',
          portionGrams: 60,
          calories: 192,
          protein: 7.2,
          sodium: 12,
          potassium: 216,
          phosphorus: 168,
          fluid: 0,
          isManualOverride: false
        },
        {
          id: 'd-2',
          foodId: 'f-yellow-moong-cooked',
          name: 'Yellow moong dal (cooked)',
          portionName: '1 medium katori (150g)',
          portionGrams: 150,
          calories: 140,
          protein: 7.8,
          sodium: 18,
          potassium: 245,
          phosphorus: 125,
          fluid: 0,
          isManualOverride: false
        }
      ],
      bedtime: []
    };
  });

  // Added salt in grams for entire day
  const [addedSaltGrams, setAddedSaltGrams] = useState(1.5); // ~1.5g salt = ~590 mg Na
  const [directFluidMl, setDirectFluidMl] = useState(400); // 400 ml direct water intake
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Modal states for adding dish
  const [activeSlotModal, setActiveSlotModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [selectedPortionGrams, setSelectedPortionGrams] = useState(100);
  const [portionLabel, setPortionLabel] = useState('100g');

  // Modal states for manual override
  const [editingItem, setEditingItem] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    calories: 0,
    protein: 0,
    sodium: 0,
    potassium: 0,
    phosphorus: 0,
    fluid: 0
  });

  // Calculate day totals
  const dayTotals = useMemo(() => {
    const allItems = [];
    Object.values(slotsData).forEach(slotItems => {
      slotItems.forEach(item => allItems.push(item));
    });
    return calculateMealTotals(allItems, addedSaltGrams, directFluidMl);
  }, [slotsData, addedSaltGrams, directFluidMl]);

  // Target evaluations
  const evaluations = useMemo(() => {
    return evaluateAgainstTargets(dayTotals, targets);
  }, [dayTotals, targets]);

  // Calculate overall adherence percentage
  const adherence = useMemo(() => {
    let score = 100;
    // Sodium penalty
    if (evaluations.sodium?.status === 'over') score -= 30;
    else if (evaluations.sodium?.status === 'near') score -= 15;

    // Potassium penalty
    if (evaluations.potassium?.status === 'over') score -= 25;

    // Protein penalty
    if (evaluations.protein?.status === 'under') score -= 20;

    // Energy penalty
    if (evaluations.calories?.status === 'under') score -= 15;

    return Math.max(20, Math.min(100, score));
  }, [evaluations]);

  // Open Add Food modal
  const handleOpenAddFood = (slotId) => {
    setActiveSlotModal(slotId);
    setSearchQuery('');
    setSelectedFoodId(allFoods[0]?.id || '');
    setSelectedPortionGrams(allFoods[0]?.portions?.[0]?.grams || 100);
    setPortionLabel(allFoods[0]?.portions?.[0]?.label || '100g');
  };

  // Add food to slot
  const handleConfirmAddFood = () => {
    if (!activeSlotModal || !selectedFoodId) return;
    const food = allFoods.find(f => f.id === selectedFoodId);
    if (!food) return;

    const scaled = scaleNutrients(food, selectedPortionGrams);
    const newItem = {
      id: `${food.id}-${Date.now()}`,
      foodId: food.id,
      name: food.name,
      portionName: portionLabel,
      portionGrams: selectedPortionGrams,
      ...scaled,
      isManualOverride: false
    };

    setSlotsData(prev => ({
      ...prev,
      [activeSlotModal]: [...(prev[activeSlotModal] || []), newItem]
    }));

    setActiveSlotModal(null);
  };

  // Remove dish from slot
  const handleRemoveDish = (slotId, itemId) => {
    setSlotsData(prev => ({
      ...prev,
      [slotId]: prev[slotId].filter(item => item.id !== itemId)
    }));
  };

  // Open manual override modal
  const handleStartOverride = (slotId, item) => {
    setEditingItem({ slotId, item });
    setOverrideForm({
      calories: item.calories || 0,
      protein: item.protein || 0,
      sodium: item.sodium || 0,
      potassium: item.potassium || 0,
      phosphorus: item.phosphorus || 0,
      fluid: item.fluid || 0
    });
  };

  // Save manual override
  const handleSaveOverride = () => {
    if (!editingItem) return;
    const { slotId, item } = editingItem;

    setSlotsData(prev => ({
      ...prev,
      [slotId]: prev[slotId].map(i => {
        if (i.id === item.id) {
          return {
            ...i,
            calories: Number(overrideForm.calories) || 0,
            protein: Number(overrideForm.protein) || 0,
            sodium: Number(overrideForm.sodium) || 0,
            potassium: Number(overrideForm.potassium) || 0,
            phosphorus: Number(overrideForm.phosphorus) || 0,
            fluid: Number(overrideForm.fluid) || 0,
            isManualOverride: true
          };
        }
        return i;
      })
    }));

    setEditingItem(null);
  };

  // Reset override to standard formula
  const handleResetOverride = () => {
    if (!editingItem) return;
    const { slotId, item } = editingItem;
    const food = allFoods.find(f => f.id === item.foodId);
    if (!food) return;

    const standard = scaleNutrients(food, item.portionGrams);
    setSlotsData(prev => ({
      ...prev,
      [slotId]: prev[slotId].map(i => {
        if (i.id === item.id) {
          return {
            ...i,
            ...standard,
            isManualOverride: false
          };
        }
        return i;
      })
    }));

    setEditingItem(null);
  };

  // Copy diet summary text
  const handleCopySummary = () => {
    const lines = [
      `24-HOUR DIETARY RECALL ASSESSMENT (PRINT 2026 SDI)`,
      `Date: ${recallDate}`,
      `Condition: ${patientCondition.replace('_', ' ').toUpperCase()}`,
      `Child Weight: ${weightKg} kg | Height: ${heightCm} cm`,
      `---------------------------------------`,
      `• Energy: ${dayTotals.calories} / ${targets.energyKcal} kcal (${evaluations.calories?.pct}%)`,
      `• Protein: ${dayTotals.protein} / ${targets.proteinG} g (${evaluations.protein?.pct}%)`,
      `• Sodium: ${dayTotals.sodium} / ${targets.sodiumMg} mg (${evaluations.sodium?.pct}%) [Food: ${dayTotals.foodSodium} mg + Salt: ${dayTotals.addedSaltSodiumMg} mg]`,
      `• Potassium: ${dayTotals.potassium} / ${targets.potassiumMg} mg (${evaluations.potassium?.pct}%)`,
      `• Phosphate: ${dayTotals.phosphorus} / ${targets.phosphateMg} mg (${evaluations.phosphorus?.pct}%)`,
      `• Fluid: ${dayTotals.fluid} / ${targets.fluidMl} mL (${evaluations.fluid?.pct}%)`,
      `---------------------------------------`,
      `Overall Adherence Score: ${adherence}%`,
      clinicalNotes ? `Dietitian Notes: ${clinicalNotes}` : ''
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  // Save recall to storage and backend
  const handleSaveRecall = async () => {
    setSaveStatus('saving');
    const recallPayload = {
      date: recallDate,
      condition: patientCondition,
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      targets,
      totals: dayTotals,
      slots: slotsData,
      addedSaltGrams,
      directFluidMl,
      adherence,
      clinicalNotes,
      savedAt: new Date().toISOString()
    };

    try {
      // 1. Save to local storage
      const historyKey = 'kidneycare_recall_history';
      const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
      existing.unshift(recallPayload);
      localStorage.setItem(historyKey, JSON.stringify(existing.slice(0, 30)));

      // 2. Post to backend if active
      await fetch('/api/nutrition/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recallPayload)
      }).catch(err => console.log('Offline/local mode recall saved', err));

      setSaveStatus('success');
      if (onSaveRecall) onSaveRecall(recallPayload);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Error saving recall', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Filtered food choices for modal
  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return allFoods.slice(0, 15);
    const q = searchQuery.toLowerCase();
    return allFoods.filter(f =>
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.hindiName && f.hindiName.includes(q)) ||
      (f.category && f.category.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [allFoods, searchQuery]);

  return (
    <div className="space-y-4 text-foreground">
      {/* HEADER CONTROLS */}
      <Card className="p-4 bg-card border-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-teal" />
              {hi ? '24 घंटे का आहार स्मरण (24h Dietary Recall)' : '24-hour dietary recall logger'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hi
                ? 'PRINT 2026 SDI मानकों के अनुसार रोगी के वास्तविक आहार का मूल्यांकन व मैन्युअल सुधार'
                : 'Portion-scaled intake with manual clinician overrides vs. PRINT 2026 SDI targets'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="date"
                value={recallDate}
                onChange={e => setRecallDate(e.target.value)}
                className="text-xs bg-transparent border-0 focus:outline-none text-foreground font-medium"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              className="text-xs h-8 border-border"
            >
              {copyFeedback ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-severity-info-text mr-1" />
                  {hi ? 'कॉपी हो गया' : 'Copied'}
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  {hi ? 'सारांश कॉपी करें' : 'Copy summary'}
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={handleSaveRecall}
              disabled={saveStatus === 'saving'}
              className="text-xs h-8 bg-brand-teal text-white hover:bg-brand-teal/90"
            >
              {saveStatus === 'saving' ? (
                'Saving...'
              ) : saveStatus === 'success' ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {hi ? 'सहेजा गया' : 'Saved'}
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {hi ? 'रिकॉल सुरक्षित करें' : 'Save recall'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* CLINICAL PARAMETERS BAR */}
        <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground block">{hi ? 'रोग स्थिति' : 'Condition'}:</span>
            <select
              value={patientCondition}
              onChange={e => setPatientCondition(e.target.value)}
              className="mt-1 w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground font-medium"
            >
              <option value="nephrotic_relapse">Nephrotic Relapse (&lt;1200 mg Na)</option>
              <option value="nephrotic_remission">Nephrotic Remission</option>
              <option value="ckd_3_5">CKD Stage 3-5 (Tight P/K)</option>
              <option value="hemodialysis">Hemodialysis (120% Prot)</option>
            </select>
          </div>

          <div>
            <span className="text-muted-foreground block">{hi ? 'वज़न (किग्रा)' : 'Weight (kg)'}:</span>
            <input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={e => setWeightKg(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground font-medium"
            />
          </div>

          <div>
            <span className="text-muted-foreground block">{hi ? 'लंबाई (सेमी)' : 'Height (cm)'}:</span>
            <input
              type="number"
              value={heightCm}
              onChange={e => setHeightCm(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground font-medium"
            />
          </div>

          <div>
            <span className="text-muted-foreground block">{hi ? 'आयु वर्ग (SDI)' : 'SDI bracket'}:</span>
            <div className="mt-1 font-semibold text-brand-teal py-1">
              {targets.bracket}
            </div>
          </div>
        </div>
      </Card>

      {/* INSTANT NUTRITION TALLY VS PRINT 2026 PRESCRIPTION */}
      <Card className="p-4 bg-card border-border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {hi ? 'दैनिक पोषक तत्व मिलान (PRINT 2026 Tally)' : 'Daily nutrient tally vs. prescription'}
            </h3>
            <SeverityBadge
              severity={
                evaluations.sodium?.status === 'over'
                  ? 'urgent'
                  : evaluations.potassium?.status === 'over'
                  ? 'urgent'
                  : evaluations.protein?.status === 'under'
                  ? 'warning'
                  : 'info'
              }
              label={
                evaluations.sodium?.status === 'over'
                  ? hi ? 'नमक सीमा पार' : 'Sodium exceeded'
                  : evaluations.potassium?.status === 'over'
                  ? hi ? 'पोटैशियम सीमा पार' : 'Potassium exceeded'
                  : evaluations.protein?.status === 'under'
                  ? hi ? 'प्रोटीन की कमी' : 'Low protein'
                  : hi ? 'स्वीकार्य सीमा में' : 'Within target'
              }
            />
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground mr-1.5">{hi ? 'अनुपालन दर' : 'Adherence'}:</span>
            <span className={`text-xs font-bold ${adherence >= 80 ? 'text-severity-info-text' : adherence >= 65 ? 'text-severity-warning-text' : 'text-severity-urgent-text'}`}>
              {adherence}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
          {/* ENERGY */}
          <div className="p-2.5 rounded-lg border border-border bg-background space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{hi ? 'ऊर्जा' : 'Energy'}</span>
              <span className="font-semibold text-foreground">{dayTotals.calories} kcal</span>
            </div>
            <Progress value={Math.min(100, evaluations.calories?.pct || 0)} className="h-1.5" />
            <div className="text-[11px] text-muted-foreground flex justify-between">
              <span>{targets.energyKcal} kcal</span>
              <span className={evaluations.calories?.status === 'under' ? 'text-severity-warning-text' : 'text-severity-info-text'}>
                {evaluations.calories?.pct}%
              </span>
            </div>
          </div>

          {/* PROTEIN */}
          <div className="p-2.5 rounded-lg border border-border bg-background space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{hi ? 'प्रोटीन' : 'Protein'}</span>
              <span className="font-semibold text-foreground">{dayTotals.protein} g</span>
            </div>
            <Progress value={Math.min(100, evaluations.protein?.pct || 0)} className="h-1.5" />
            <div className="text-[11px] text-muted-foreground flex justify-between">
              <span>{targets.proteinG} g</span>
              <span className={evaluations.protein?.status === 'under' ? 'text-severity-warning-text font-medium' : 'text-severity-info-text'}>
                {evaluations.protein?.pct}%
              </span>
            </div>
          </div>

          {/* SODIUM */}
          <div className="p-2.5 rounded-lg border border-border bg-background space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{hi ? 'सोडियम' : 'Sodium'}</span>
              <span className="font-semibold text-foreground">{dayTotals.sodium} mg</span>
            </div>
            <Progress
              value={Math.min(100, evaluations.sodium?.pct || 0)}
              className={`h-1.5 ${evaluations.sodium?.status === 'over' ? '[&>div]:bg-severity-urgent-text' : ''}`}
            />
            <div className="text-[11px] text-muted-foreground flex justify-between">
              <span>&lt;{targets.sodiumMg} mg</span>
              <span className={evaluations.sodium?.status === 'over' ? 'text-severity-urgent-text font-bold' : 'text-muted-foreground'}>
                {evaluations.sodium?.pct}%
              </span>
            </div>
          </div>

          {/* POTASSIUM */}
          <div className="p-2.5 rounded-lg border border-border bg-background space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{hi ? 'पोटैशियम' : 'Potassium'}</span>
              <span className="font-semibold text-foreground">{dayTotals.potassium} mg</span>
            </div>
            <Progress
              value={Math.min(100, evaluations.potassium?.pct || 0)}
              className={`h-1.5 ${evaluations.potassium?.status === 'over' ? '[&>div]:bg-severity-urgent-text' : ''}`}
            />
            <div className="text-[11px] text-muted-foreground flex justify-between">
              <span>&lt;{targets.potassiumMg} mg</span>
              <span className={evaluations.potassium?.status === 'over' ? 'text-severity-urgent-text font-bold' : 'text-muted-foreground'}>
                {evaluations.potassium?.pct}%
              </span>
            </div>
          </div>

          {/* PHOSPHATE */}
          <div className="p-2.5 rounded-lg border border-border bg-background space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{hi ? 'फॉस्फोरस' : 'Phosphate'}</span>
              <span className="font-semibold text-foreground">{dayTotals.phosphorus} mg</span>
            </div>
            <Progress value={Math.min(100, evaluations.phosphorus?.pct || 0)} className="h-1.5" />
            <div className="text-[11px] text-muted-foreground flex justify-between">
              <span>&lt;{targets.phosphateMg} mg</span>
              <span className="text-muted-foreground">{evaluations.phosphorus?.pct}%</span>
            </div>
          </div>

          {/* FLUID */}
          <div className="p-2.5 rounded-lg border border-border bg-background space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{hi ? 'तरल पदार्थ' : 'Fluid'}</span>
              <span className="font-semibold text-foreground">{dayTotals.fluid} mL</span>
            </div>
            <Progress value={Math.min(100, evaluations.fluid?.pct || 0)} className="h-1.5" />
            <div className="text-[11px] text-muted-foreground flex justify-between">
              <span>&lt;{targets.fluidMl} mL</span>
              <span className="text-muted-foreground">{evaluations.fluid?.pct}%</span>
            </div>
          </div>
        </div>

        {/* ADDED SALT & WATER CALIBRATION */}
        <div className="mt-3 pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{hi ? 'ऊपर से डाला नमक' : 'Added table salt'}:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={addedSaltGrams}
                  onChange={e => setAddedSaltGrams(parseFloat(e.target.value) || 0)}
                  className="w-14 bg-background border border-border rounded px-1.5 py-1 text-center font-bold"
                />
                <span className="text-muted-foreground">g (~{Math.round(addedSaltGrams * MG_NA_PER_GRAM_SALT)} mg Na)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{hi ? 'सीधा पानी' : 'Direct water'}:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="50"
                  min="0"
                  max="3000"
                  value={directFluidMl}
                  onChange={e => setDirectFluidMl(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-background border border-border rounded px-1.5 py-1 text-center font-bold"
                />
                <span className="text-muted-foreground">mL</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-right">
            {hi ? 'खाद्य पदार्थों से सोडियम' : 'Food Na'}: {dayTotals.foodSodium} mg + {hi ? 'नमक से' : 'Salt'}: {dayTotals.addedSaltSodiumMg} mg
          </p>
        </div>
      </Card>

      {/* MEAL SLOTS ACCORDION / CARDS */}
      <div className="space-y-3">
        {RECALL_SLOTS.map(slot => {
          const items = slotsData[slot.id] || [];
          const slotCalories = items.reduce((sum, i) => sum + (i.calories || 0), 0);
          const slotProtein = items.reduce((sum, i) => sum + (i.protein || 0), 0).toFixed(1);
          const slotSodium = items.reduce((sum, i) => sum + (i.sodium || 0), 0);
          const slotPotassium = items.reduce((sum, i) => sum + (i.potassium || 0), 0);

          return (
            <Card key={slot.id} className="p-3.5 bg-card border-border shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-teal" />
                  <span className="text-sm font-semibold text-foreground">
                    {hi ? slot.labelHi : slot.labelEn}
                  </span>
                  <span className="text-[11px] text-muted-foreground">({slot.time})</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-2 mr-1">
                    <span>{slotCalories} kcal</span>
                    <span>•</span>
                    <span>{slotProtein}g prot</span>
                    <span>•</span>
                    <span>{slotSodium}mg Na</span>
                    <span>•</span>
                    <span>{slotPotassium}mg K</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAddFood(slot.id)}
                    className="h-7 text-xs border-dashed border-border"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 text-brand-teal" />
                    {hi ? 'भोजन जोड़ें' : 'Add food'}
                  </Button>
                </div>
              </div>

              {/* LIST OF DISHES IN SLOT */}
              {items.length === 0 ? (
                <div className="py-2.5 px-3 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                  {hi ? 'इस समय का कोई भोजन दर्ज नहीं है' : 'No food logged for this meal slot'}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-background border border-border text-xs gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground truncate">{item.name}</span>
                          <span className="text-[11px] text-muted-foreground">({item.portionName})</span>
                          {item.isManualOverride && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40">
                              Manual override
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>{item.calories} kcal</span>
                          <span>•</span>
                          <span>{item.protein}g prot</span>
                          <span>•</span>
                          <span>{item.sodium}mg Na</span>
                          <span>•</span>
                          <span>{item.potassium}mg K</span>
                          <span>•</span>
                          <span>{item.phosphorus}mg P</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartOverride(slot.id, item)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-brand-teal"
                          title="Manually edit nutrients"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDish(slot.id, item.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-severity-urgent-text"
                          title="Remove dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* CLINICAL ASSESSMENT & DIETITIAN NOTES */}
      <Card className="p-4 bg-card border-border shadow-sm space-y-2">
        <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-brand-teal" />
          {hi ? 'क्लिनिकल आहार टिप्पणी व परामर्श' : 'Clinical dietary assessment notes'}
        </Label>
        <textarea
          rows={3}
          value={clinicalNotes}
          onChange={e => setClinicalNotes(e.target.value)}
          placeholder={hi ? 'माता-पिता द्वारा नमक का अनुपालन, तले हुए स्नैक्स या गैर-मानक तेल/मसाले की टिप्पणी लिखें...' : 'Record parent compliance, non-standard home preparation, salt adherence, or dietary advice given...'}
          className="w-full text-xs p-2.5 rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-brand-teal text-foreground"
        />
      </Card>

      {/* MODAL 1: ADD FOOD TO SLOT */}
      {activeSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-foreground">
                {hi ? 'भोजन चुनें' : 'Select food for recall'} ({activeSlotModal.replace('_', ' ')})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSlotModal(null)}
                className="h-7 w-7 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-2">
              <Input
                type="text"
                placeholder={hi ? 'भोजन खोजें (उदा. Poha, Roti, Dal)...' : 'Search foods (e.g., Poha, Roti, Dal)...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="text-xs"
              />

              <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {filteredFoods.map(food => (
                  <div
                    key={food.id}
                    onClick={() => {
                      setSelectedFoodId(food.id);
                      if (food.portions && food.portions.length > 0) {
                        setSelectedPortionGrams(food.portions[0].grams);
                        setPortionLabel(food.portions[0].label);
                      }
                    }}
                    className={`p-2 text-xs cursor-pointer flex justify-between items-center ${selectedFoodId === food.id ? 'bg-brand-teal/10 font-semibold text-brand-teal' : 'hover:bg-muted/50'}`}
                  >
                    <div>
                      <div>{food.name}</div>
                      <div className="text-[10px] text-muted-foreground">{food.hindiName || food.category}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right">
                      {food.per100g.calories} kcal / 100g
                    </div>
                  </div>
                ))}
              </div>

              {/* PORTION SELECTION */}
              {selectedFoodId && (
                <div className="pt-2 border-t border-border space-y-2">
                  <Label className="text-xs">{hi ? 'माप / भाग' : 'Portion measure'}</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {allFoods.find(f => f.id === selectedFoodId)?.portions?.map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setSelectedPortionGrams(p.grams);
                          setPortionLabel(p.label);
                        }}
                        className={`text-xs p-2 rounded-lg border text-left cursor-pointer ${selectedPortionGrams === p.grams ? 'border-brand-teal bg-brand-teal/5 text-brand-teal font-medium' : 'border-border bg-background'}`}
                      >
                        <div className="font-medium truncate">{p.label}</div>
                        <div className="text-[10px] text-muted-foreground">{p.grams}g</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">{hi ? 'या ग्राम में दर्ज करें' : 'Or enter grams'}:</span>
                    <input
                      type="number"
                      value={selectedPortionGrams}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setSelectedPortionGrams(val);
                        setPortionLabel(`${val}g`);
                      }}
                      className="w-20 bg-background border border-border rounded px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSlotModal(null)}
                className="text-xs"
              >
                {hi ? 'रद्द करें' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAddFood}
                disabled={!selectedFoodId}
                className="text-xs bg-brand-teal text-white hover:bg-brand-teal/90"
              >
                {hi ? 'जोड़ें' : 'Add to recall'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL NUTRIENT OVERRIDE */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-sm w-full p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {hi ? 'पोषक तत्व मैन्युअल सुधार' : 'Manual nutrient override'}
                </h3>
                <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                  {editingItem.item.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingItem(null)}
                className="h-7 w-7 p-0"
              >
                ✕
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              {hi
                ? 'यदि घर में गैर-मानक तेल, अधिक नमक या विशेष सामग्री का उपयोग हुआ है, तो मान यहां बदलें:'
                : 'Adjust calculated values if non-standard home recipe, extra fat, or salt was used:'}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <Label className="text-[11px]">{hi ? 'ऊर्जा (kcal)' : 'Calories (kcal)'}</Label>
                <Input
                  type="number"
                  value={overrideForm.calories}
                  onChange={e => setOverrideForm(prev => ({ ...prev, calories: e.target.value }))}
                  className="h-7 text-xs"
                />
              </div>

              <div>
                <Label className="text-[11px]">{hi ? 'प्रोटीन (g)' : 'Protein (g)'}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={overrideForm.protein}
                  onChange={e => setOverrideForm(prev => ({ ...prev, protein: e.target.value }))}
                  className="h-7 text-xs"
                />
              </div>

              <div>
                <Label className="text-[11px]">{hi ? 'सोडियम (mg)' : 'Sodium (mg)'}</Label>
                <Input
                  type="number"
                  value={overrideForm.sodium}
                  onChange={e => setOverrideForm(prev => ({ ...prev, sodium: e.target.value }))}
                  className="h-7 text-xs"
                />
              </div>

              <div>
                <Label className="text-[11px]">{hi ? 'पोटैशियम (mg)' : 'Potassium (mg)'}</Label>
                <Input
                  type="number"
                  value={overrideForm.potassium}
                  onChange={e => setOverrideForm(prev => ({ ...prev, potassium: e.target.value }))}
                  className="h-7 text-xs"
                />
              </div>

              <div>
                <Label className="text-[11px]">{hi ? 'फॉस्फोरस (mg)' : 'Phosphate (mg)'}</Label>
                <Input
                  type="number"
                  value={overrideForm.phosphorus}
                  onChange={e => setOverrideForm(prev => ({ ...prev, phosphorus: e.target.value }))}
                  className="h-7 text-xs"
                />
              </div>

              <div>
                <Label className="text-[11px]">{hi ? 'तरल (mL)' : 'Fluid (mL)'}</Label>
                <Input
                  type="number"
                  value={overrideForm.fluid}
                  onChange={e => setOverrideForm(prev => ({ ...prev, fluid: e.target.value }))}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetOverride}
                className="text-xs text-muted-foreground hover:text-foreground h-8"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                {hi ? 'रीसेट' : 'Reset standard'}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                  className="text-xs h-8"
                >
                  {hi ? 'रद्द' : 'Cancel'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveOverride}
                  className="text-xs h-8 bg-brand-teal text-white hover:bg-brand-teal/90"
                >
                  {hi ? 'लागू करें' : 'Apply'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
