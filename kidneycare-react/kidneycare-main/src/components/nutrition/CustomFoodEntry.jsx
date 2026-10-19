import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, BookOpen, Utensils } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import SeverityBadge from '@/components/SeverityBadge';
import { useLanguage } from '../shared/LanguageContext';

export default function CustomFoodEntry({ onFoodCreated }) {
  const { language } = useLanguage();
  const hi = language === 'hi';

  const [name, setName] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [foodGroup, setFoodGroup] = useState('Vegetables');
  const [pClass, setPClass] = useState('plant'); // 'plant' | 'animal' | 'mixed'
  const [isFluid, setIsFluid] = useState(false);

  // Per 100g Nutrients
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [potassium, setPotassium] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [water, setWater] = useState('');

  // Default portion
  const [portionLabel, setPortionLabel] = useState('1 standard katori');
  const [portionGrams, setPortionGrams] = useState('100');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [customList, setCustomList] = useState([]);

  // Load custom foods from local storage
  const loadCustomFoods = () => {
    try {
      const stored = localStorage.getItem('kc_custom_foods');
      if (stored) {
        setCustomList(JSON.parse(stored));
      }
    } catch {
      setCustomList([]);
    }
  };

  useEffect(() => {
    loadCustomFoods();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg(hi ? 'कृपया खाद्य पदार्थ का नाम दर्ज करें।' : 'Please enter food name.');
      return;
    }

    const calNum = parseFloat(calories) || 0;
    const protNum = parseFloat(protein) || 0;
    const naNum = parseFloat(sodium) || 0;
    const kNum = parseFloat(potassium) || 0;
    const pNum = parseFloat(phosphorus) || 0;
    const waterNum = parseFloat(water) || 0;
    const gramsNum = parseFloat(portionGrams) || 100;

    const newFood = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      nameHi: nameHi.trim() || name.trim(),
      foodGroup,
      pClass,
      isFluid,
      per100g: {
        calories: calNum,
        protein: protNum,
        fat: parseFloat(fat) || 0,
        carbs: parseFloat(carbs) || 0,
        fiber: parseFloat(fiber) || 0,
        sodium: naNum,
        potassium: kNum,
        phosphorus: pNum,
        water: waterNum
      },
      defaultPortion: {
        label: portionLabel || '1 serving',
        grams: gramsNum
      },
      portionOptions: [
        { label: portionLabel || '1 serving', grams: gramsNum }
      ],
      potassiumCategory: kNum > 250 ? 'High' : (kNum > 100 ? 'Medium' : 'Low')
    };

    setIsSaving(true);
    try {
      // Post to backend API if available
      await fetch('/api/nutrition/custom-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFood.name,
          hindi_name: newFood.nameHi,
          category: foodGroup,
          salt_level: naNum > 400 ? 'High' : 'Normal',
          sodium_mg: naNum,
          fluid_ml: isFluid ? gramsNum : 0,
          calories: calNum,
          protein_g: protNum,
          created_by: 'Caregiver'
        })
      });
    } catch {
      // Continue locally
    }

    // Save to local storage
    const updated = [newFood, ...customList];
    setCustomList(updated);
    localStorage.setItem('kc_custom_foods', JSON.stringify(updated));

    setIsSaving(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);

    // Reset form
    setName('');
    setNameHi('');
    setCalories('');
    setProtein('');
    setFat('');
    setCarbs('');
    setFiber('');
    setSodium('');
    setPotassium('');
    setPhosphorus('');
    setWater('');

    if (onFoodCreated) {
      onFoodCreated(newFood);
    }
  };

  const handleDelete = (id) => {
    const filtered = customList.filter(f => f.id !== id);
    setCustomList(filtered);
    localStorage.setItem('kc_custom_foods', JSON.stringify(filtered));
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  {hi ? 'नया खाद्य पदार्थ जोड़ें (मैनुअल न्यूट्रिशन एंट्री)' : 'Custom Food Entry (Per 100g Lab Values)'}
                </h3>
                <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-800 border-teal-300">
                  Custom DB
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hi
                  ? 'स्थानीय या विशेष व्यंजनों के प्रति 100g पोषक तत्व दर्ज करें।'
                  : 'Enter exact 100g composition for traditional or commercial foods.'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          {errorMsg && (
            <SeverityBadge severity="urgent" text={errorMsg} size="sm" />
          )}

          {/* Name & Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                {hi ? 'व्यंजन का नाम (English):' : 'Food Name (English):'} *
              </label>
              <Input
                type="text"
                placeholder="e.g. Sattu Paratha"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                {hi ? 'हिंदी नाम:' : 'Hindi Name:'}
              </label>
              <Input
                type="text"
                placeholder="उदा. सत्तू पराठा"
                value={nameHi}
                onChange={e => setNameHi(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                {hi ? 'खाद्य समूह (Food Group):' : 'Food Group:'}
              </label>
              <select
                value={foodGroup}
                onChange={e => setFoodGroup(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none"
              >
                <option value="Cereals">Cereals & Millets</option>
                <option value="Pulses">Pulses & Legumes</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Dairy">Milk & Dairy</option>
                <option value="Poultry">Egg & Poultry</option>
                <option value="Fish">Fish & Seafood</option>
                <option value="Snacks">Snacks & Savouries</option>
                <option value="Condiments">Condiments & Spices</option>
                <option value="Fats">Oils & Fats</option>
              </select>
            </div>
          </div>

          {/* Classification: Protein Source & Fluid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-muted/30 p-2.5 rounded-xl border border-border">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                {hi ? 'प्रोटीन व फॉस्फेट अवशोषण वर्ग:' : 'Phosphorus Bioavailability Tier:'}
              </label>
              <select
                value={pClass}
                onChange={e => setPClass(e.target.value)}
                className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium"
              >
                <option value="plant">Plant Source (20–50% absorbable - gentle on kidneys)</option>
                <option value="mixed">Mixed / Recipe (40–70% absorbable)</option>
                <option value="animal">Animal Source (90–100% absorbable)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-4 sm:pt-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFluid}
                  onChange={e => setIsFluid(e.target.checked)}
                  className="rounded border-border text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span>{hi ? 'यह तरल पदार्थ (Fluid/Soup/Juice) है' : 'Counts toward daily fluid volume limit'}</span>
              </label>
            </div>
          </div>

          {/* Per 100g Nutrients Grid */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>{hi ? 'प्रति 100 ग्राम पोषण मान (Nutrients per 100g raw / prepared):' : 'Nutrient Values per 100g:'}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Energy (kcal) *</span>
                <Input
                  type="number"
                  placeholder="e.g. 240"
                  value={calories}
                  onChange={e => setCalories(e.target.value)}
                  required
                  className="h-8 font-mono text-xs mt-0.5"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Protein (g) *</span>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 7.5"
                  value={protein}
                  onChange={e => setProtein(e.target.value)}
                  required
                  className="h-8 font-mono text-xs mt-0.5"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Sodium (mg Na) *</span>
                <Input
                  type="number"
                  placeholder="e.g. 85"
                  value={sodium}
                  onChange={e => setSodium(e.target.value)}
                  required
                  className="h-8 font-mono text-xs mt-0.5"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Potassium (mg K) *</span>
                <Input
                  type="number"
                  placeholder="e.g. 180"
                  value={potassium}
                  onChange={e => setPotassium(e.target.value)}
                  required
                  className="h-8 font-mono text-xs mt-0.5"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Phosphorus (mg P)</span>
                <Input
                  type="number"
                  placeholder="e.g. 120"
                  value={phosphorus}
                  onChange={e => setPhosphorus(e.target.value)}
                  className="h-8 font-mono text-xs mt-0.5"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Water / Moisture (g)</span>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 65.0"
                  value={water}
                  onChange={e => setWater(e.target.value)}
                  className="h-8 font-mono text-xs mt-0.5"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Fat (g)</span>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 4.0"
                  value={fat}
                  onChange={e => setFat(e.target.value)}
                  className="h-8 font-mono text-xs mt-0.5"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Dietary Fiber (g)</span>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.5"
                  value={fiber}
                  onChange={e => setFiber(e.target.value)}
                  className="h-8 font-mono text-xs mt-0.5"
                />
              </div>
            </div>
          </div>

          {/* Household Portion Calibration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                {hi ? 'घरेलू माप का नाम (Portion Label):' : 'Household Portion Unit Name:'}
              </label>
              <Input
                type="text"
                placeholder="e.g. 1 standard katori / 1 medium roti"
                value={portionLabel}
                onChange={e => setPortionLabel(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                {hi ? '१ हिस्से का वजन (Weight in grams):' : 'Weight for 1 Portion (grams):'}
              </label>
              <Input
                type="number"
                placeholder="e.g. 100"
                value={portionGrams}
                onChange={e => setPortionGrams(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isSaving ? (hi ? 'सहेजा जा रहा है...' : 'Saving...') : (hi ? 'डेटाबेस में सुरक्षित करें' : 'Save Food to Database')}</span>
          </Button>

          {successMsg && (
            <div className="p-2.5 bg-green-50 border border-green-200 text-green-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{hi ? 'नया व्यंजन सफलतापूर्वक डेटाबेस में जोड़ा गया!' : 'Custom food added successfully!'}</span>
            </div>
          )}
        </form>
      </Card>

      {/* ── SAVED CUSTOM FOODS LIST ── */}
      {customList.length > 0 && (
        <Card className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              {hi ? `दर्ज कस्टम खाद्य पदार्थ (${customList.length})` : `Custom Food Items (${customList.length})`}
            </h4>
          </div>

          <div className="divide-y divide-border">
            {customList.map(item => (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">{item.name}</span>
                    {item.nameHi && <span className="text-[11px] text-muted-foreground font-medium">({item.nameHi})</span>}
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      {item.foodGroup}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5 font-mono">
                    <span className="text-amber-800 font-bold">{item.per100g.calories} kcal/100g</span>
                    <span>·</span>
                    <span className="text-teal-800 font-bold">{item.per100g.protein}g prot</span>
                    <span>·</span>
                    <span className="text-red-800 font-bold">{item.per100g.sodium}mg Na</span>
                    <span>·</span>
                    <span>{item.per100g.potassium}mg K</span>
                    <span>·</span>
                    <span>{item.defaultPortion.label} ({item.defaultPortion.grams}g)</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
