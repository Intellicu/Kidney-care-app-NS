import React, { useState, useMemo } from 'react';
import {
  MapPin, Plus, Trash2, CheckCircle2, AlertTriangle, Sparkles,
  Share2, Printer, ChevronRight, Scale, Clock, HeartHandshake, Utensils
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import SeverityBadge from '@/components/SeverityBadge';
import { useLanguage } from '../shared/LanguageContext';
import { REGIONAL_TEMPLATES } from './regions';
import { FOOD_DATABASE } from './foods';
import { scaleNutrients, calculateMealTotals, evaluateAgainstTargets } from './calc';
import { computePrescriptionTargets } from './targets';

export default function MealPlanBuilder({ patientProfile, onSavePlan }) {
  const { language } = useLanguage();
  const hi = language === 'hi';

  const [selectedRegion, setSelectedRegion] = useState('north');
  const [selectedCondition, setSelectedCondition] = useState(patientProfile?.condition || 'nephrotic_relapse');
  const [weightKg, setWeightKg] = useState(patientProfile?.weightKg || 21.4);
  const [heightCm, setHeightCm] = useState(patientProfile?.heightCm || 118);

  // Targets from prescription engine
  const targets = useMemo(() => {
    return computePrescriptionTargets({
      weightKg: Number(weightKg) || 21.4,
      heightCm: Number(heightCm) || 118,
      dob: patientProfile?.dob,
      condition: selectedCondition
    });
  }, [weightKg, heightCm, selectedCondition, patientProfile]);

  // Current active plan slots and food items
  const [planSlots, setPlanSlots] = useState(() => {
    const template = REGIONAL_TEMPLATES.north;
    const slots = {};
    for (const [slotId, items] of Object.entries(template.slots)) {
      slots[slotId] = items.map(tItem => {
        const food = FOOD_DATABASE.find(f => f.id === tItem.foodId);
        const scaled = scaleNutrients(food, tItem.portionGrams);
        return {
          id: `${tItem.foodId}-${Date.now()}-${Math.random()}`,
          foodId: tItem.foodId,
          name: food ? food.name : tItem.note,
          note: tItem.note,
          portionGrams: tItem.portionGrams,
          ...scaled
        };
      });
    }
    return slots;
  });

  // Switch region template
  const handleSelectRegion = (regionKey) => {
    setSelectedRegion(regionKey);
    const template = REGIONAL_TEMPLATES[regionKey];
    if (!template) return;

    const newSlots = {};
    for (const [slotId, items] of Object.entries(template.slots)) {
      newSlots[slotId] = items.map(tItem => {
        const food = FOOD_DATABASE.find(f => f.id === tItem.foodId);
        const scaled = scaleNutrients(food, tItem.portionGrams);
        return {
          id: `${tItem.foodId}-${Date.now()}-${Math.random()}`,
          foodId: tItem.foodId,
          name: food ? food.name : tItem.note,
          note: tItem.note,
          portionGrams: tItem.portionGrams,
          ...scaled
        };
      });
    }
    setPlanSlots(newSlots);
  };

  // Add custom food to slot
  const [addingToSlot, setAddingToSlot] = useState(null);
  const [selectedFoodToAdd, setSelectedFoodToAdd] = useState(FOOD_DATABASE[0].id);
  const [gramsToAdd, setGramsToAdd] = useState('100');
  const [copyingToLog, setCopyingToLog] = useState(false);
  const [copySuccessToast, setCopySuccessToast] = useState(false);

  // 1-Tap Autofill Balanced Day (Calibrates portions to match child prescription targets)
  const handleAutofillBalancedDay = () => {
    const template = REGIONAL_TEMPLATES[selectedRegion] || REGIONAL_TEMPLATES.north;
    const targetKcal = targets.energyKcal || 1400;

    let templateKcal = 0;
    for (const items of Object.values(template.slots)) {
      for (const tItem of items) {
        const food = FOOD_DATABASE.find(f => f.id === tItem.foodId);
        if (food && food.per100g) {
          templateKcal += (food.per100g.calories || 100) * (tItem.portionGrams / 100);
        }
      }
    }
    const ratio = templateKcal > 0 ? (targetKcal / templateKcal) : 1;
    const scaleRatio = Math.max(0.85, Math.min(1.25, ratio));

    const newSlots = {};
    for (const [slotId, items] of Object.entries(template.slots)) {
      newSlots[slotId] = items.map(tItem => {
        const food = FOOD_DATABASE.find(f => f.id === tItem.foodId);
        const calibratedGrams = Math.round(tItem.portionGrams * scaleRatio);
        const scaled = scaleNutrients(food, calibratedGrams);
        return {
          id: `${tItem.foodId}-${Date.now()}-${Math.random()}`,
          foodId: tItem.foodId,
          name: food ? food.name : tItem.note,
          note: `${calibratedGrams}g portion`,
          portionGrams: calibratedGrams,
          ...scaled
        };
      });
    }
    setPlanSlots(newSlots);
  };

  // 1-Tap Copy Plan to Today's Active Food Journal
  const handleCopyPlanToMealLog = async () => {
    setCopyingToLog(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const cr = patientProfile?.cr_number || 'AIIMS/PED/2026/0412';

    try {
      for (const [slotId, items] of Object.entries(planSlots)) {
        if (!items || items.length === 0) continue;
        const foodSummary = items.map(i => `${i.name} (${i.portionGrams}g)`).join(', ');
        const slotCal = items.reduce((acc, i) => acc + (i.calories || 0), 0);
        const slotProt = Number(items.reduce((acc, i) => acc + (i.protein || 0), 0).toFixed(1));
        const slotNa = items.reduce((acc, i) => acc + (i.sodium || 0), 0);
        const slotK = items.reduce((acc, i) => acc + (i.potassium || 0), 0);
        const slotP = items.reduce((acc, i) => acc + (i.phosphorus || 0), 0);
        const slotFluid = items.reduce((acc, i) => acc + (i.fluid || 0), 0);

        const payload = {
          cr_number: cr,
          patient_id: 'pat_aiims_001',
          date: todayStr,
          meal_slot: slotId === 'evening_snack' ? 'Snack' : (slotId.charAt(0).toUpperCase() + slotId.slice(1)),
          food_items: foodSummary,
          sodium_level: slotNa > 600 ? 'High Salt' : (slotNa > 300 ? 'Medium Salt' : 'Low Salt'),
          fluid_ml: slotFluid,
          calories: slotCal,
          protein_g: slotProt,
          sodium_mg: slotNa,
          potassium_mg: slotK,
          phosphate_mg: slotP,
          notes: `Copied from Regional Diet Plan (${selectedRegion.toUpperCase()})`
        };

        try {
          await fetch('/api/nutrition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch {
          // fallback
        }

        const saved = localStorage.getItem('kc_nutrition_logs');
        const list = saved ? JSON.parse(saved) : [];
        list.unshift({ ...payload, id: Date.now() + Math.random() });
        localStorage.setItem('kc_nutrition_logs', JSON.stringify(list));
      }

      setCopySuccessToast(true);
      setTimeout(() => setCopySuccessToast(false), 4000);
    } finally {
      setCopyingToLog(false);
    }
  };

  const handleAddFoodToSlot = (slotId) => {
    const food = FOOD_DATABASE.find(f => f.id === selectedFoodToAdd);
    if (!food) return;

    const grams = Number(gramsToAdd) || 100;
    const scaled = scaleNutrients(food, grams);

    const newItem = {
      id: `${food.id}-${Date.now()}`,
      foodId: food.id,
      name: food.name,
      note: `${grams}g ${food.name}`,
      portionGrams: grams,
      ...scaled
    };

    setPlanSlots(prev => ({
      ...prev,
      [slotId]: [...(prev[slotId] || []), newItem]
    }));
    setAddingToSlot(null);
  };

  const handleRemoveItem = (slotId, itemId) => {
    setPlanSlots(prev => ({
      ...prev,
      [slotId]: prev[slotId].filter(i => i.id !== itemId)
    }));
  };

  // Autocalc Plan Totals
  const dayTotals = useMemo(() => {
    const allItems = Object.values(planSlots).flat();
    return calculateMealTotals(allItems, 0, 0);
  }, [planSlots]);

  // Evaluation against PRINT 2026 SDI targets
  const evaluation = useMemo(() => {
    return evaluateAgainstTargets(dayTotals, targets);
  }, [dayTotals, targets]);

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const lines = [
      `*AIIMS Patna - Pediatric Renal Nutrition Plan*`,
      `Child Weight: ${weightKg} kg | Condition: ${selectedCondition.replace('_', ' ').toUpperCase()}`,
      `Region: ${REGIONAL_TEMPLATES[selectedRegion]?.nameEn}`,
      `----------------------------------------`,
      `*Prescription Targets:*`,
      `• Energy: ${targets.energyKcal} kcal`,
      `• Protein: ${targets.proteinG} g`,
      `• Sodium: < ${targets.sodiumMg} mg`,
      `• Potassium: < ${targets.potassiumMg} mg`,
      `----------------------------------------`,
      `*Daily Meal Pattern:*`
    ];

    for (const [slotId, items] of Object.entries(planSlots)) {
      const slotTitle = slotId.replace('_', ' ').toUpperCase();
      lines.push(`\n*${slotTitle}:*`);
      items.forEach(i => {
        lines.push(`- ${i.name} (${i.portionGrams}g): ${i.calories} kcal, ${i.protein}g protein`);
      });
    }

    lines.push(`\n*Total:* ${dayTotals.calories} kcal | ${dayTotals.protein}g Protein | ${dayTotals.sodium}mg Na | ${dayTotals.potassium}mg K`);
    lines.push(`Dr. Swarnim - Pediatric Nephrology, AIIMS Patna`);

    const encoded = encodeURIComponent(lines.join('\n'));
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* ── CARD 1: REGION & CONDITION SELECTION ── */}
      <Card className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-3.5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  {hi ? 'क्षेत्रीय आहार योजना बिल्डर' : 'Regional Meal Plan Builder (PRINT 2026)'}
                </h3>
                <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-800 border-teal-300">
                  Auto-Adjusting
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hi
                  ? 'उत्तर, दक्षिण, पूर्व व पश्चिम भारतीय आहार पैटर्न अनुसार संतुलित बाल गुर्दा थाली।'
                  : 'Tailor regional pediatric renal diets (North, West, East, South) with exact nutrient scaling.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAutofillBalancedDay}
              className="h-9 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{hi ? '✨ स्वतः संतुलित करें' : '✨ 1-Tap Autofill'}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={copyingToLog}
              onClick={handleCopyPlanToMealLog}
              className="h-9 px-3 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{copyingToLog ? (hi ? 'कॉपी हो रहा है...' : 'Copying...') : (hi ? '📋 आज के लॉग में जोड़ें' : '📋 Copy to Food Log')}</span>
            </Button>

            <Button
              size="sm"
              onClick={handleShareWhatsApp}
              className="h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{hi ? 'व्हाट्सएप' : 'WhatsApp'}</span>
            </Button>
          </div>
        </div>

        {copySuccessToast && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{hi ? 'आहार योजना के सभी व्यंजन आज के भोजन लॉग में सफलतापूर्वक जुड़ गए!' : 'All planned meals copied to today’s food journal successfully!'}</span>
          </div>
        )}

        {/* Region Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(REGIONAL_TEMPLATES).map(([key, region]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectRegion(key)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedRegion === key
                  ? 'border-teal-600 bg-teal-50/70 text-teal-900 font-bold ring-2 ring-teal-200 shadow-xs'
                  : 'border-border bg-background text-foreground hover:bg-muted/50'
              }`}
            >
              <div className="text-xs font-bold">{hi ? region.nameHi.split(' ')[0] : region.nameEn.split(' ')[0]}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">{region.description}</div>
            </button>
          ))}
        </div>

        {/* Disease Adjustment & Vitals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-muted/30 p-2.5 rounded-xl border border-border text-xs">
          <div>
            <label className="font-bold text-foreground block mb-1">
              {hi ? 'नैदानिक स्थिति (Clinical Condition):' : 'Clinical Condition:'}
            </label>
            <select
              value={selectedCondition}
              onChange={e => setSelectedCondition(e.target.value)}
              className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium"
            >
              <option value="nephrotic_relapse">Nephrotic Relapse (Na &lt; 1200mg, 100% SDI Protein)</option>
              <option value="nephrotic_remission">Nephrotic Remission (Normal limits)</option>
              <option value="ckd_3_5">CKD Stage 3–5 (Tight K & P restrictions)</option>
              <option value="hemodialysis">Hemodialysis (120% Protein, tight fluid)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-foreground block mb-1">
              {hi ? 'वजन (Weight kg):' : 'Child Weight (kg):'}
            </label>
            <Input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={e => setWeightKg(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-foreground block mb-1">
              {hi ? 'लंबाई (Height cm):' : 'Child Height (cm):'}
            </label>
            <Input
              type="number"
              value={heightCm}
              onChange={e => setHeightCm(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>
      </Card>

      {/* ── CARD 2: REAL-TIME NUTRITIONAL TOTALS VS PRINT SDI TARGETS ── */}
      <Card className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-teal-950 border-b border-teal-200/80 pb-2">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Sparkles className="w-4 h-4 text-teal-600" />
            {hi ? 'योजना का कुल पोषण बनाम डॉक्टर लक्ष्य' : 'Plan Daily Totals vs. PRINT 2026 Target Limits:'}
          </span>
          <span className="text-[11px] font-mono text-teal-800">
            {dayTotals.calories} / {targets.energyKcal} kcal ({evaluation.calories?.pct}%)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Energy */}
          <div className="bg-white p-2.5 rounded-xl border border-teal-200">
            <div className="flex justify-between text-[11px] font-bold mb-1">
              <span className="text-muted-foreground">Energy</span>
              <span className="font-mono text-amber-800">{dayTotals.calories} / {targets.energyKcal} kcal</span>
            </div>
            <Progress value={Math.min(100, evaluation.calories?.pct || 0)} className="h-1.5" />
          </div>

          {/* Protein */}
          <div className="bg-white p-2.5 rounded-xl border border-teal-200">
            <div className="flex justify-between text-[11px] font-bold mb-1">
              <span className="text-muted-foreground">Protein</span>
              <span className="font-mono text-teal-800">{dayTotals.protein} / {targets.proteinG} g</span>
            </div>
            <Progress value={Math.min(100, evaluation.protein?.pct || 0)} className="h-1.5" />
          </div>

          {/* Sodium */}
          <div className="bg-white p-2.5 rounded-xl border border-teal-200">
            <div className="flex justify-between text-[11px] font-bold mb-1">
              <span className="text-muted-foreground">Sodium</span>
              <span className={`font-mono ${dayTotals.sodium > targets.sodiumMg ? 'text-red-700' : 'text-foreground'}`}>
                {dayTotals.sodium} / {targets.sodiumMg} mg
              </span>
            </div>
            <Progress value={Math.min(100, evaluation.sodium?.pct || 0)} className="h-1.5" />
          </div>

          {/* Potassium */}
          <div className="bg-white p-2.5 rounded-xl border border-teal-200">
            <div className="flex justify-between text-[11px] font-bold mb-1">
              <span className="text-muted-foreground">Potassium</span>
              <span className={`font-mono ${dayTotals.potassium > targets.potassiumMg ? 'text-red-700' : 'text-foreground'}`}>
                {dayTotals.potassium} / {targets.potassiumMg} mg
              </span>
            </div>
            <Progress value={Math.min(100, evaluation.potassium?.pct || 0)} className="h-1.5" />
          </div>
        </div>

        {dayTotals.sodium > targets.sodiumMg && (
          <SeverityBadge
            severity="urgent"
            text={`Sodium Ceiling Exceeded: ${dayTotals.sodium} mg Na is above prescribed limit (${targets.sodiumMg} mg). Reduce high-sodium dishes or table salt.`}
            size="sm"
          />
        )}
      </Card>

      {/* ── CARD 3: MEAL SLOTS & CUSTOM DISH ADDITIONS ── */}
      <Card className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-teal-600" />
          {hi ? 'भोजन समय अनुसार व्यंजन सूची (Meal Slots & Dishes)' : 'Meal Slots & Configured Dishes'}
        </h4>

        <div className="space-y-3">
          {Object.entries(planSlots).map(([slotId, items]) => {
            const slotName = slotId === 'breakfast' ? 'Breakfast (सुबह)'
              : (slotId === 'lunch' ? 'Lunch (दोपहर)'
              : (slotId === 'evening_snack' ? 'Evening Snack (शाम)' : 'Dinner (रात)'));

            const slotCal = items.reduce((acc, i) => acc + (i.calories || 0), 0);
            const slotProt = items.reduce((acc, i) => acc + (i.protein || 0), 0).toFixed(1);

            return (
              <div key={slotId} className="border border-border rounded-xl p-3 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground border-b border-border/80 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    {slotName} ({items.length} dishes)
                  </span>
                  <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
                    <span>{slotCal} kcal</span>
                    <span>·</span>
                    <span>{slotProt}g P</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAddingToSlot(slotId)}
                      className="h-6 px-2 text-[10px] bg-background border-border text-teal-700 font-bold rounded-lg"
                    >
                      + Add Dish
                    </Button>
                  </div>
                </div>

                {/* Items in Slot */}
                <div className="divide-y divide-border/60">
                  {items.map(item => (
                    <div key={item.id} className="py-1.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-foreground">{item.name}</span>{' '}
                        <span className="text-[11px] text-muted-foreground font-mono">({item.portionGrams}g)</span>
                        <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-2 mt-0.5">
                          <span className="text-amber-800 font-bold">{item.calories} kcal</span>
                          <span>·</span>
                          <span className="text-teal-800 font-bold">{item.protein}g prot</span>
                          <span>·</span>
                          <span>{item.sodium}mg Na</span>
                          <span>·</span>
                          <span>{item.potassium}mg K</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(slotId, item.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Inline Add Dish Dialog / Form */}
                {addingToSlot === slotId && (
                  <div className="p-2.5 bg-background border border-teal-300 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-foreground">
                      <span>Add Dish to {slotName}:</span>
                      <button onClick={() => setAddingToSlot(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <select
                          value={selectedFoodToAdd}
                          onChange={e => setSelectedFoodToAdd(e.target.value)}
                          className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium"
                        >
                          {FOOD_DATABASE.map(f => (
                            <option key={f.id} value={f.id}>{f.name} ({f.defaultPortion.label})</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          value={gramsToAdd}
                          onChange={e => setGramsToAdd(e.target.value)}
                          placeholder="Grams"
                          className="h-8 text-xs font-mono"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddFoodToSlot(slotId)}
                          className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold px-3 shrink-0"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Apply Plan CTA */}
        <Button
          type="button"
          onClick={() => {
            if (onSavePlan) onSavePlan({ slots: planSlots, totals: dayTotals, targets });
            alert(hi ? 'आहार योजना सफलतापूर्वक लागू हो गई है!' : 'Meal plan saved & applied as child active template!');
          }}
          className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{hi ? 'इस योजना को सक्रिय बच्चे के लिए सुरक्षित करें' : 'Save & Set as Active Child Meal Plan'}</span>
        </Button>
      </Card>
    </div>
  );
}
