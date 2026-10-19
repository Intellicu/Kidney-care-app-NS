import React, { useState, useMemo, useEffect } from 'react';
import {
  Utensils, Search, Plus, Minus, Trash2, CheckCircle2, Clock,
  Droplets, Flame, Sparkles, AlertTriangle, X, ChevronRight,
  Info, ShieldCheck, Scale, ArrowRight, Mic, MicOff, Camera
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import SeverityBadge from '@/components/SeverityBadge';
import { useLanguage } from '../shared/LanguageContext';
import { useUserRole } from '../../context/UserRoleContext';
import consolidatedCatalog from '../../data/consolidated_food_catalog.json';
import { FOOD_DATABASE } from './foods.js';
import { computePrescriptionTargets } from './targets';

// Canonical Indian staples with calibrated IFCT values
const STAPLE_DEFAULTS = {
  moong: {
    id: 'moong-dal-cooked',
    name: 'Moong Dal, Cooked (मूँग दाल)',
    category: 'dal',
    unit: 'katori',
    unit_label: 'कटोरी (Katori)',
    single_unit_g: 150,
    canonical_portion: '1 katori (150g)',
    nutrition_per_100g: { calories: 85, protein_g: 5.5, sodium_mg: 35 },
    potassium: { mg_portion: 160, category: 'Medium' },
    phosphate: { mg_portion: 90, category: 'Low' },
    standard_portion_nutrients: { calories: 128, protein_g: 8.2, sodium_mg: 52, fluid_ml: 120 }
  },
  roti: {
    id: 'roti-phulka',
    name: 'Roti / Phulka (रोटी / फुल्का)',
    category: 'roti',
    unit: 'piece',
    unit_label: 'रोटी (Roti)',
    single_unit_g: 30,
    canonical_portion: '1 phulka (30g)',
    nutrition_per_100g: { calories: 280, protein_g: 9.0, sodium_mg: 15 },
    potassium: { mg_portion: 85, category: 'Low' },
    phosphate: { mg_portion: 75, category: 'Low' },
    standard_portion_nutrients: { calories: 84, protein_g: 2.7, sodium_mg: 5, fluid_ml: 0 }
  },
  rice: {
    id: 'steamed-rice',
    name: 'Steamed Rice (उबला चावल)',
    category: 'rice',
    unit: 'katori',
    unit_label: 'कटोरी (Katori)',
    single_unit_g: 150,
    canonical_portion: '1 katori (150g)',
    nutrition_per_100g: { calories: 120, protein_g: 2.5, sodium_mg: 5 },
    potassium: { mg_portion: 45, category: 'Low' },
    phosphate: { mg_portion: 50, category: 'Low' },
    standard_portion_nutrients: { calories: 180, protein_g: 3.8, sodium_mg: 8, fluid_ml: 0 }
  },
  'bottle-gourd': {
    id: 'lauki-sabzi',
    name: 'Lauki Sabzi (लौकी की सब्ज़ी)',
    category: 'sabzi',
    unit: 'katori',
    unit_label: 'कटोरी (Katori)',
    single_unit_g: 150,
    canonical_portion: '1 katori (150g)',
    nutrition_per_100g: { calories: 45, protein_g: 1.2, sodium_mg: 25 },
    potassium: { mg_portion: 95, category: 'Low' },
    phosphate: { mg_portion: 30, category: 'Low' },
    standard_portion_nutrients: { calories: 68, protein_g: 1.8, sodium_mg: 38, fluid_ml: 60 }
  },
  curd: {
    id: 'curd-dahi',
    name: 'Curd / Dahi (ताज़ा दही)',
    category: 'dairy',
    unit: 'katori',
    unit_label: 'कटोरी (Katori)',
    single_unit_g: 100,
    canonical_portion: '1 katori (100g)',
    nutrition_per_100g: { calories: 60, protein_g: 3.1, sodium_mg: 40 },
    potassium: { mg_portion: 140, category: 'Medium' },
    phosphate: { mg_portion: 95, category: 'Medium' },
    standard_portion_nutrients: { calories: 60, protein_g: 3.1, sodium_mg: 40, fluid_ml: 85 }
  },
  khichdi: {
    id: 'moong-khichdi',
    name: 'Moong Dal Khichdi (खिचड़ी)',
    category: 'rice',
    unit: 'katori',
    unit_label: 'कटोरी (Katori)',
    single_unit_g: 150,
    canonical_portion: '1 katori (150g)',
    nutrition_per_100g: { calories: 110, protein_g: 4.0, sodium_mg: 30 },
    potassium: { mg_portion: 120, category: 'Low' },
    phosphate: { mg_portion: 70, category: 'Low' },
    standard_portion_nutrients: { calories: 165, protein_g: 6.0, sodium_mg: 45, fluid_ml: 50 }
  },
  egg: {
    id: 'boiled-egg',
    name: 'Boiled Egg (उबला अंडा)',
    category: 'dairy',
    unit: 'piece',
    unit_label: 'अंडा (Egg)',
    single_unit_g: 50,
    canonical_portion: '1 whole egg (50g)',
    nutrition_per_100g: { calories: 145, protein_g: 12.6, sodium_mg: 125 },
    potassium: { mg_portion: 70, category: 'Low' },
    phosphate: { mg_portion: 100, category: 'Medium' },
    standard_portion_nutrients: { calories: 72, protein_g: 6.3, sodium_mg: 62, fluid_ml: 0 }
  },
  paneer: {
    id: 'fresh-paneer',
    name: 'Fresh Paneer (पनीर)',
    category: 'dairy',
    unit: 'piece',
    unit_label: 'टुकड़ा (Piece)',
    single_unit_g: 40,
    canonical_portion: '40g',
    nutrition_per_100g: { calories: 265, protein_g: 18.0, sodium_mg: 30 },
    potassium: { mg_portion: 60, category: 'Low' },
    phosphate: { mg_portion: 110, category: 'Medium' },
    standard_portion_nutrients: { calories: 106, protein_g: 7.2, sodium_mg: 12, fluid_ml: 0 }
  },
  poha: {
    id: 'vegetable-poha',
    name: 'Vegetable Poha (सब्ज़ी पोहा)',
    category: 'snacks',
    unit: 'katori',
    unit_label: 'कटोरी (Katori)',
    single_unit_g: 120,
    canonical_portion: '1 katori (120g)',
    nutrition_per_100g: { calories: 130, protein_g: 2.8, sodium_mg: 45 },
    potassium: { mg_portion: 110, category: 'Low' },
    phosphate: { mg_portion: 65, category: 'Low' },
    standard_portion_nutrients: { calories: 156, protein_g: 3.4, sodium_mg: 54, fluid_ml: 0 }
  },
  upma: {
    id: 'suji-upma',
    name: 'Suji Upma (सूजी उपमा)',
    category: 'snacks',
    unit: 'katori',
    unit_label: 'कटोरी (Katori)',
    single_unit_g: 150,
    canonical_portion: '1 katori (150g)',
    nutrition_per_100g: { calories: 125, protein_g: 3.2, sodium_mg: 50 },
    potassium: { mg_portion: 90, category: 'Low' },
    phosphate: { mg_portion: 55, category: 'Low' },
    standard_portion_nutrients: { calories: 188, protein_g: 4.8, sodium_mg: 75, fluid_ml: 0 }
  },
  idli: {
    id: 'steamed-idli',
    name: 'Steamed Idli (इडली)',
    category: 'snacks',
    unit: 'piece',
    unit_label: 'इडली (Idli)',
    single_unit_g: 30,
    canonical_portion: '2 pieces (60g)',
    nutrition_per_100g: { calories: 135, protein_g: 4.2, sodium_mg: 85 },
    potassium: { mg_portion: 110, category: 'Low' },
    phosphate: { mg_portion: 60, category: 'Low' },
    standard_portion_nutrients: { calories: 81, protein_g: 2.5, sodium_mg: 51, fluid_ml: 0 }
  },
  dosa: {
    id: 'plain-dosa',
    name: 'Plain Dosa (सदा डोसा)',
    category: 'snacks',
    unit: 'piece',
    unit_label: 'डोसा (Dosa)',
    single_unit_g: 80,
    canonical_portion: '1 dosa (80g)',
    nutrition_per_100g: { calories: 168, protein_g: 3.9, sodium_mg: 110 },
    potassium: { mg_portion: 114, category: 'Low' },
    phosphate: { mg_portion: 76, category: 'Low' },
    standard_portion_nutrients: { calories: 134, protein_g: 3.1, sodium_mg: 88, fluid_ml: 0 }
  },
  makhana: {
    id: 'roasted-makhana',
    name: 'Roasted Makhana (भुना मखाना)',
    category: 'snacks',
    unit: 'katori',
    unit_label: 'कटोरी (Katori)',
    single_unit_g: 25,
    canonical_portion: '1 katori (25g)',
    nutrition_per_100g: { calories: 350, protein_g: 9.7, sodium_mg: 10 },
    potassium: { mg_portion: 80, category: 'Low' },
    phosphate: { mg_portion: 60, category: 'Low' },
    standard_portion_nutrients: { calories: 88, protein_g: 2.4, sodium_mg: 3, fluid_ml: 0 }
  }
};

// Normalized raw/cooked items from FOOD_DATABASE
const normalizedFoodDatabase = (FOOD_DATABASE || []).map(f => {
  const isPiece = f.id.includes('roti') || f.id.includes('phulka') || f.id.includes('idli') || f.id.includes('dosa') || f.id.includes('egg');
  const unitLabel = isPiece ? (f.id.includes('roti') ? 'phulka' : 'piece') : 'katori';
  const portionG = f.defaultPortion?.grams || 100;
  return {
    id: f.id,
    name: f.name,
    category: f.foodGroup ? f.foodGroup.toLowerCase() : 'cereals',
    canonical_portion: f.defaultPortion?.label || `${portionG}g`,
    portion_g: portionG,
    unit: isPiece ? 'piece' : 'katori',
    unit_label: unitLabel,
    single_unit_g: portionG,
    potassium: {
      mg_portion: f.per100g?.potassium ? Math.round((f.per100g.potassium * portionG) / 100) : 120,
      category: f.potassiumCategory || 'Medium'
    },
    phosphate: {
      mg_portion: f.per100g?.phosphorus ? Math.round((f.per100g.phosphorus * portionG) / 100) : 80,
      category: 'Medium'
    },
    nutrition_per_100g: {
      calories: f.per100g?.calories || 120,
      protein_g: f.per100g?.protein || 3.0,
      sodium_mg: f.per100g?.sodium || 20
    },
    per100g: f.per100g,
    standard_portion_nutrients: {
      calories: Math.round((portionG / 100) * (f.per100g?.calories || 100)),
      protein_g: Number(((portionG / 100) * (f.per100g?.protein || 3.0)).toFixed(1)),
      sodium_mg: Math.round((portionG / 100) * (f.per100g?.sodium || 20)),
      potassium_mg: Math.round((portionG / 100) * (f.per100g?.potassium || 100)),
      phosphate_mg: Math.round((portionG / 100) * (f.per100g?.phosphorus || 80)),
      fluid_ml: f.isFluid ? portionG : 0
    },
    is_fluid: f.isFluid
  };
});

// Master merged food catalog: STAPLE_DEFAULTS + normalizedFoodDatabase + catalog
const allFoods = [
  ...Object.values(STAPLE_DEFAULTS),
  ...normalizedFoodDatabase,
  ...(consolidatedCatalog.foods || [])
];

const MEAL_SLOTS = [
  { id: 'breakfast', labelEn: 'Breakfast', labelHi: 'सुबह का नाश्ता', time: '08:00', icon: '🌅' },
  { id: 'lunch', labelEn: 'Lunch', labelHi: 'दोपहर का भोजन', time: '13:00', icon: '☀️' },
  { id: 'evening_snack', labelEn: 'Evening Snack', labelHi: 'शाम का नाश्ता', time: '17:00', icon: '🍵' },
  { id: 'dinner', labelEn: 'Dinner', labelHi: 'रात का खाना', time: '20:30', icon: '🌙' },
];

const FOOD_CATEGORIES = [
  { id: 'all', labelEn: 'All Foods', labelHi: 'सभी' },
  { id: 'roti', labelEn: 'Roti & Breads', labelHi: 'रोटी/अनाज' },
  { id: 'dal', labelEn: 'Dals & Pulses', labelHi: 'दाल' },
  { id: 'rice', labelEn: 'Rice & Khichdi', labelHi: 'चावल/खिचड़ी' },
  { id: 'sabzi', labelEn: 'Sabzi / Veggies', labelHi: 'सब्ज़ी' },
  { id: 'dairy', labelEn: 'Curd & Dairy', labelHi: 'दूध/दही' },
  { id: 'fruits', labelEn: 'Fruits', labelHi: 'फल' },
  { id: 'snacks', labelEn: 'Safe Snacks', labelHi: 'स्नैक्स' }
];

const QUICK_STAPLES = [
  { name: 'Moong Dal (मूँग दाल)', matchId: 'moong' },
  { name: 'Roti / Phulka (रोटी)', matchId: 'roti' },
  { name: 'Steamed Rice (चावल)', matchId: 'rice' },
  { name: 'Lauki Sabzi (लौकी)', matchId: 'bottle-gourd' },
  { name: 'Curd / Dahi (दही)', matchId: 'curd' },
  { name: 'Khichdi (खिचड़ी)', matchId: 'khichdi' },
  { name: 'Idli (इडली)', matchId: 'idli' },
  { name: 'Dosa (डोसा)', matchId: 'dosa' },
  { name: 'Poha (पोहा)', matchId: 'poha' },
  { name: 'Suji Upma (उपमा)', matchId: 'upma' },
  { name: 'Boiled Egg (उबला अंडा)', matchId: 'egg' },
  { name: 'Paneer (पनीर)', matchId: 'paneer' },
  { name: 'Papad (पापड़ ⚠️ High Salt)', highRisk: true, swapTo: 'Roasted Makhana (भुना मखाना)' },
  { name: 'Pickle / Achaar (अचार ⚠️)', highRisk: true, swapTo: 'Mint Coriander Chutney (धनिया पुदीना चटनी)' },
  { name: 'Potato Chips (चिप्स ⚠️)', highRisk: true, swapTo: 'Murmura Bhel (मुरमुरा भेल)' },
  { name: 'Instant Noodles (मैगी ⚠️)', highRisk: true, swapTo: 'Vegetable Poha (सब्ज़ी पोहा)' }
];

export default function AutocalcMealLogger({ onMealSaved, defaultSlot = 'lunch', patientCr }) {
  const { language } = useLanguage();
  const hi = language === 'hi';
  const { activePatientCr } = useUserRole();
  const effectiveCr = patientCr || activePatientCr || 'AIIMS/PED/2026/0412';

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState(defaultSlot);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Voice logging
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceTargetSlot, setVoiceTargetSlot] = useState(null);

  // Search & Portions
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [serverFoodResults, setServerFoodResults] = useState([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const [portionFood, setPortionFood] = useState(null);
  const [portionCount, setPortionCount] = useState(1);
  const [customGrams, setCustomGrams] = useState('');
  const [selectedMeasureName, setSelectedMeasureName] = useState('');

  // Added Foods in current meal
  const [mealItems, setMealItems] = useState([]);

  // Added Table Salt
  const [addedSaltOption, setAddedSaltOption] = useState('none'); // 'none' | 'pinch' | 'quarter_tsp' | 'half_tsp'
  const addedSaltNaMg = useMemo(() => {
    switch (addedSaltOption) {
      case 'pinch': return 200;
      case 'quarter_tsp': return 500;
      case 'half_tsp': return 1000;
      default: return 0;
    }
  }, [addedSaltOption]);

  // Fluid intake (water, beverages)
  const [directFluidMl, setDirectFluidMl] = useState(200);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // Today's meal history
  const [todayMeals, setTodayMeals] = useState([]);

  // Frequent & Recent Foods (Healthify 1-tap logging)
  const DEFAULT_RECENTS = [
    { id: 'moong', name: 'Moong Dal (मूँग दाल)' },
    { id: 'roti', name: 'Roti / Phulka (रोटी)' },
    { id: 'rice', name: 'Steamed Rice (चावल)' },
    { id: 'bottle-gourd', name: 'Lauki Sabzi (लौकी)' },
    { id: 'curd', name: 'Curd / Dahi (दही)' },
    { id: 'khichdi', name: 'Khichdi (खिचड़ी)' },
    { id: 'egg', name: 'Boiled Egg (उबला अंडा)' },
    { id: 'makhana', name: 'Roasted Makhana (मखाना)' }
  ];

  const [recentFoods, setRecentFoods] = useState(() => {
    try {
      const saved = localStorage.getItem('kc_recent_foods');
      return saved ? JSON.parse(saved) : DEFAULT_RECENTS;
    } catch {
      return DEFAULT_RECENTS;
    }
  });

  const recordRecentFood = (foodItem) => {
    if (!foodItem) return;
    setRecentFoods(prev => {
      const filtered = prev.filter(f => f.id !== foodItem.id && f.name !== foodItem.name);
      const updated = [{ id: foodItem.id, name: foodItem.name }, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('kc_recent_foods', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Fetch today's logged meals from backend or local storage
  const loadTodayMeals = async () => {
    try {
      const res = await fetch(`/api/nutrition?cr_number=${effectiveCr}&date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setTodayMeals(data || []);
        return;
      }
    } catch {
      // fallback to local storage
    }
    const cached = localStorage.getItem('kc_nutrition_logs');
    if (cached) {
      const list = JSON.parse(cached);
      setTodayMeals(list.filter(m => m.date === selectedDate));
    }
  };

  useEffect(() => {
    loadTodayMeals();
  }, [selectedDate, effectiveCr]);

  // Targets & Daily totals
  const dailyTargets = useMemo(() => {
    return computePrescriptionTargets({
      weightKg: 21.4,
      condition: 'nephrotic_relapse'
    });
  }, []);

  const dailyTotals = useMemo(() => {
    const totalCal = todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
    const totalProt = todayMeals.reduce((acc, m) => acc + (m.protein_g || 0), 0);
    const totalNa = todayMeals.reduce((acc, m) => acc + (m.sodium_mg || 0), 0);
    const totalK = todayMeals.reduce((acc, m) => acc + (m.potassium_mg || 0), 0);
    const totalFluid = todayMeals.reduce((acc, m) => acc + (m.fluid_ml || 0), 0);

    return {
      calories: totalCal,
      protein: Number(totalProt.toFixed(1)),
      sodium: Math.round(totalNa),
      potassium: Math.round(totalK),
      fluid: Math.round(totalFluid)
    };
  }, [todayMeals]);

  // Group today's meals by slot
  const mealsBySlot = useMemo(() => {
    const map = { breakfast: [], lunch: [], evening_snack: [], dinner: [] };
    for (const m of todayMeals) {
      const s = (m.meal_slot || 'lunch').toLowerCase();
      if (s.includes('break') || s.includes('morn')) map.breakfast.push(m);
      else if (s.includes('snack') || s.includes('eve')) map.evening_snack.push(m);
      else if (s.includes('din') || s.includes('night')) map.dinner.push(m);
      else map.lunch.push(m);
    }
    return map;
  }, [todayMeals]);

  // Voice logging handler
  const handleStartVoiceLogging = (targetSlot = selectedSlot) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(hi ? 'आपके ब्राउज़र में आवाज़ पहचान समर्थित नहीं है।' : 'Speech Recognition is not supported in this browser.');
      return;
    }

    setVoiceTargetSlot(targetSlot);
    setSelectedSlot(targetSlot);
    const recognition = new SpeechRecognition();
    recognition.lang = hi ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListeningVoice(true);
    setVoiceTranscript('');

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
      setIsListeningVoice(false);

      try {
        const res = await fetch('/api/nutrition/voice-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, cr_number: effectiveCr })
        });
        const data = await res.json();
        if (data.status === 'success' && data.items?.length > 0) {
          const newItems = data.items.map(it => ({
            id: `voice-${Date.now()}-${Math.random()}`,
            foodId: it.ifct_code || 'voice_item',
            name: it.dish_name,
            portionLabel: `${it.amount} ${it.unit} (${it.grams}g)`,
            grams: it.grams,
            cal: it.calories,
            prot: it.protein_g,
            na: it.sodium_mg,
            k: it.potassium_mg,
            p: it.phosphorus_mg,
            fl: it.fluid_ml || 0
          }));
          setMealItems(prev => [...prev, ...newItems]);
        }
      } catch (err) {
        console.error('Voice logging error:', err);
      }
    };

    recognition.onerror = () => setIsListeningVoice(false);
    recognition.onend = () => setIsListeningVoice(false);
    recognition.start();
  };

  // 1-Tap Quick Hydration Logging
  const handleQuickAddFluid = async (amountMl) => {
    const payload = {
      cr_number: effectiveCr,
      patient_id: 'pat_aiims_001',
      date: selectedDate,
      meal_slot: selectedSlot || 'snack',
      food_items: `Water / Safe Fluid (${amountMl} mL)`,
      sodium_level: 'Low Salt',
      fluid_ml: amountMl,
      calories: 0,
      protein_g: 0,
      sodium_mg: 0,
      potassium_mg: 0,
      phosphate_mg: 0,
      notes: 'Quick Hydration 1-Tap Log'
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
    list.unshift({ ...payload, id: Date.now() });
    localStorage.setItem('kc_nutrition_logs', JSON.stringify(list));

    await loadTodayMeals();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Debounced server search to query the 7,083 food.csv dataset
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setServerFoodResults([]);
      setIsSearchingServer(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingServer(true);
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}&limit=15`);
        if (res.ok) {
          const data = await res.json();
          const mapped = (data.foods || []).map(f => {
            const isPiece = f.description.toLowerCase().includes('apple') || f.description.toLowerCase().includes('egg') || f.description.toLowerCase().includes('bread') || f.description.toLowerCase().includes('banana') || f.description.toLowerCase().includes('orange');
            const portionG = 100;
            return {
              id: `ndb-${f.ndb_number}`,
              name: f.description,
              category: f.category ? f.category.toLowerCase() : 'corgis',
              canonical_portion: `100g`,
              portion_g: 100,
              unit: isPiece ? 'piece' : 'katori',
              unit_label: isPiece ? 'piece' : '100g',
              single_unit_g: 100,
              nutrition_per_100g: {
                calories: f.calories,
                protein_g: f.protein_g,
                sodium_mg: f.sodium_mg
              },
              per100g: {
                calories: f.calories,
                protein: f.protein_g,
                carbs: f.carbs_g,
                fat: f.fat_g,
                fiber: f.fiber_g,
                sodium: f.sodium_mg,
                potassium: f.potassium_mg,
                phosphorus: f.phosphorus_mg,
                water: f.water_g
              },
              potassium: {
                mg_portion: Math.round(f.potassium_mg),
                category: f.potassium_risk?.includes('High') ? 'High' : (f.potassium_risk?.includes('Moderate') ? 'Medium' : 'Low')
              },
              phosphate: {
                mg_portion: Math.round(f.phosphorus_mg),
                category: f.phosphorus_risk?.includes('High') ? 'High' : (f.phosphorus_risk?.includes('Moderate') ? 'Medium' : 'Low')
              },
              standard_portion_nutrients: {
                calories: Math.round(f.calories),
                protein_g: f.protein_g,
                sodium_mg: Math.round(f.sodium_mg),
                potassium_mg: Math.round(f.potassium_mg),
                phosphate_mg: Math.round(f.phosphorus_mg),
                fluid_ml: 0
              },
              renal_safety: f.renal_safety_summary,
              is_global: true
            };
          });
          setServerFoodResults(mapped);
        }
      } catch (err) {
        console.error('Server food search error:', err);
      } finally {
        setIsSearchingServer(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Autocomplete search suggestions & category filter (merges local + 7,083 global foods)
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let pool = allFoods;
    if (selectedCategory !== 'all') {
      pool = pool.filter(f => {
        const cat = (f.category || '').toLowerCase();
        const fid = f.id.toLowerCase();
        const fname = f.name.toLowerCase();
        if (selectedCategory === 'roti') return cat.includes('cereal') || fid.includes('wheat') || fid.includes('roti') || fid.includes('atta') || fid.includes('bread');
        if (selectedCategory === 'dal') return cat.includes('pulse') || cat.includes('legume') || fid.includes('dal') || fname.includes('dal') || fid.includes('moong');
        if (selectedCategory === 'rice') return fid.includes('rice') || fid.includes('khichdi') || fid.includes('poha') || fname.includes('rice');
        if (selectedCategory === 'sabzi') return cat.includes('vegetable') || fid.includes('gourd') || fid.includes('lauki') || fid.includes('sabzi') || fid.includes('potato');
        if (selectedCategory === 'dairy') return cat.includes('milk') || cat.includes('dairy') || fid.includes('curd') || fid.includes('paneer') || fid.includes('milk');
        if (selectedCategory === 'fruits') return cat.includes('fruit') || fid.includes('apple') || fid.includes('papaya') || fid.includes('guava');
        if (selectedCategory === 'snacks') return fid.includes('makhana') || fid.includes('bhel') || fid.includes('snack') || fid.includes('puffed');
        return true;
      });
    }

    const localMatches = (!q)
      ? (selectedCategory === 'all' ? [] : pool.slice(0, 12))
      : pool.filter(f =>
          f.name.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q) ||
          (f.category && f.category.toLowerCase().includes(q))
        ).slice(0, 10);

    // Merge local IFCT matches with server results from food.csv without duplicates
    const combined = [...localMatches];
    const seenNames = new Set(localMatches.map(m => m.name.toLowerCase()));

    for (const sf of serverFoodResults) {
      if (!seenNames.has(sf.name.toLowerCase())) {
        combined.push(sf);
        seenNames.add(sf.name.toLowerCase());
      }
    }

    return combined.slice(0, 20);
  }, [searchQuery, selectedCategory, serverFoodResults]);

  // Live calculation for the food in portion modal
  const modalCalculated = useMemo(() => {
    if (!portionFood) return null;
    const count = Number(portionCount) || 1;
    const singleUnitG = portionFood.single_unit_g || portionFood.portion_g || 100;
    const totalGrams = customGrams ? Number(customGrams) : Math.round(count * singleUnitG);

    const cal100 = portionFood.nutrition_per_100g?.calories ?? portionFood.per100g?.calories ?? 100;
    const prot100 = portionFood.nutrition_per_100g?.protein_g ?? portionFood.per100g?.protein ?? 2.5;
    const na100 = portionFood.nutrition_per_100g?.sodium_mg ?? portionFood.per100g?.sodium ?? 40;

    const cal = Math.round((totalGrams / 100) * cal100);
    const prot = Number(((totalGrams / 100) * prot100).toFixed(1));
    const na = Math.round((totalGrams / 100) * na100);

    const k100 = portionFood.per100g?.potassium ?? (portionFood.potassium?.mg_portion ? (portionFood.potassium.mg_portion / (portionFood.portion_g || 100)) * 100 : 120);
    const p100 = portionFood.per100g?.phosphorus ?? (portionFood.phosphate?.mg_portion ? (portionFood.phosphate.mg_portion / (portionFood.portion_g || 100)) * 100 : 80);

    const k = Math.round((totalGrams / 100) * k100);
    const p = Math.round((totalGrams / 100) * p100);

    const fl = portionFood.standard_portion_nutrients?.fluid_ml
      ? Math.round((portionFood.standard_portion_nutrients.fluid_ml / (portionFood.portion_g || 100)) * totalGrams)
      : (portionFood.is_fluid ? totalGrams : 0);

    return { grams: totalGrams, cal, prot, na, k, p, fl };
  }, [portionFood, portionCount, customGrams]);

  // Handle confirming portion from modal into current plate
  const handleConfirmPortion = () => {
    if (!portionFood || !modalCalculated) return;
    const count = Number(portionCount) || 1;
    const unitName = portionFood.unit === 'piece'
      ? (count > 1 ? 'pieces' : 'piece')
      : (portionFood.unit_label || 'katori');

    const portionLabel = selectedMeasureName || (customGrams
      ? `${customGrams}g`
      : `${count} ${unitName} (${modalCalculated.grams}g)`);

    const newItem = {
      id: `${portionFood.id}-${Date.now()}`,
      foodId: portionFood.id,
      name: portionFood.name,
      portionLabel,
      count,
      ...modalCalculated
    };

    recordRecentFood(portionFood);
    setMealItems(prev => [...prev, newItem]);
    setPortionFood(null);
    setSelectedMeasureName('');
    setSearchQuery('');
    setShowSuggestions(false);
    setCustomGrams('');
  };

  // ⚡ 1-Tap Instant Quick Log from Katori Modal
  const handleQuickLogSingleFood = async () => {
    if (!portionFood || !modalCalculated) return;
    const count = Number(portionCount) || 1;
    const unitName = portionFood.unit === 'piece'
      ? (count > 1 ? 'pieces' : 'piece')
      : (portionFood.unit_label || 'katori');

    const portionLabel = selectedMeasureName || (customGrams
      ? `${customGrams}g`
      : `${count} ${unitName} (${modalCalculated.grams}g)`);

    const payload = {
      cr_number: effectiveCr,
      patient_id: 'pat_aiims_001',
      date: selectedDate,
      meal_slot: selectedSlot,
      food_items: `${portionFood.name} (${portionLabel})`,
      sodium_level: modalCalculated.na > 600 ? 'High Salt' : (modalCalculated.na > 300 ? 'Medium Salt' : 'Low Salt'),
      fluid_ml: modalCalculated.fl || 0,
      calories: modalCalculated.cal,
      protein_g: modalCalculated.prot,
      sodium_mg: modalCalculated.na,
      potassium_mg: modalCalculated.k,
      phosphate_mg: modalCalculated.p,
      notes: `Quick Katori Log: ${portionLabel}`
    };

    try {
      await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      // Local fallback
    }

    const saved = localStorage.getItem('kc_nutrition_logs');
    const list = saved ? JSON.parse(saved) : [];
    list.unshift({ ...payload, id: Date.now() });
    localStorage.setItem('kc_nutrition_logs', JSON.stringify(list));

    recordRecentFood(portionFood);
    setPortionFood(null);
    setSelectedMeasureName('');
    setCustomGrams('');
    setPortionCount(1);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);

    await loadTodayMeals();
    if (onMealSaved) onMealSaved(payload);
  };

  // Select a staple or search result
  const handlePickFood = (foodItem) => {
    recordRecentFood(foodItem);
    setPortionFood(foodItem);
    setPortionCount(1);
    setCustomGrams('');
    setSelectedMeasureName('');
    setShowSuggestions(false);
    setSearchQuery('');
  };

  // Live totals for current meal
  const mealTotals = useMemo(() => {
    const cal = mealItems.reduce((acc, i) => acc + (i.cal || 0), 0);
    const prot = Number(mealItems.reduce((acc, i) => acc + (i.prot || 0), 0).toFixed(1));
    const foodsNa = mealItems.reduce((acc, i) => acc + (i.na || 0), 0);
    const totalNa = foodsNa + addedSaltNaMg;
    const k = mealItems.reduce((acc, i) => acc + (i.k || 0), 0);
    const p = mealItems.reduce((acc, i) => acc + (i.p || 0), 0);
    const foodsFluid = mealItems.reduce((acc, i) => acc + (i.fl || 0), 0);
    const totalFluid = foodsFluid + Number(directFluidMl || 0);

    return { cal, prot, na: totalNa, k, p, fluid: totalFluid, foodsNa };
  }, [mealItems, addedSaltNaMg, directFluidMl]);

  // Save meal log with exact autocalc numbers
  const handleSaveMeal = async () => {
    if (mealItems.length === 0) {
      alert(hi ? 'कृपया पहले भोजन और मात्रा चुनें।' : 'Please add at least one food item with portion.');
      return;
    }

    setIsSubmitting(true);
    const foodSummary = mealItems.map(i => `${i.name} (${i.portionLabel})`).join(', ');
    const fullText = addedSaltOption !== 'none'
      ? `${foodSummary} [Salt: ${addedSaltOption.replace('_', ' ')}]`
      : foodSummary;

    const payload = {
      cr_number: effectiveCr,
      patient_id: 'pat_aiims_001',
      date: selectedDate,
      meal_slot: selectedSlot,
      food_items: fullText,
      sodium_level: mealTotals.na > 600 ? 'High Salt' : (mealTotals.na > 300 ? 'Medium Salt' : 'Low Salt'),
      fluid_ml: mealTotals.fluid,
      calories: mealTotals.cal,
      protein_g: mealTotals.prot,
      sodium_mg: mealTotals.na,
      potassium_mg: mealTotals.k,
      phosphate_mg: mealTotals.p,
      notes: `Autocalc Engine: ${mealItems.length} items logged`
    };

    try {
      await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      // continue to local storage
    }

    // Save to local cache
    const saved = localStorage.getItem('kc_nutrition_logs');
    const list = saved ? JSON.parse(saved) : [];
    list.unshift({ ...payload, id: Date.now() });
    localStorage.setItem('kc_nutrition_logs', JSON.stringify(list));

    // Reset form
    setMealItems([]);
    setAddedSaltOption('none');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);

    // Reload history
    await loadTodayMeals();

    if (onMealSaved) {
      onMealSaved(payload);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* ── TODAY'S RECORDED MEAL STATUS SUMMARY BANNER ── */}
      {todayMeals.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-300 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🥗</span>
              <div>
                <h4 className="text-xs font-extrabold text-emerald-950">
                  {hi ? `आज का दैनिक स्टेटस: ${todayMeals.length} बार भोजन दर्ज` : `Today's Daily Status: ${todayMeals.length} Meals Logged`}
                </h4>
                <p className="text-[11px] text-emerald-800">
                  {dailyTotals.calories} kcal ({Math.round((dailyTotals.calories / (dailyTargets.energyKcal || 1)) * 100)}%) · {dailyTotals.protein}g Protein · {dailyTotals.sodium}mg Sodium
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-xl">
              🌟 {hi ? 'गुर्दा सुरक्षित' : 'Kidney Safe'}
            </Badge>
          </div>

          {/* Quick list of dishes logged today */}
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-emerald-200/60">
            {todayMeals.map((m, idx) => (
              <span key={m.id || idx} className="text-[10px] font-bold bg-white text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-lg shadow-2xs">
                <span className="uppercase text-[9px] text-emerald-600 mr-1">[{m.meal_slot || 'Meal'}]</span>
                <span>{m.food_items}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── HEALTHIFY-STYLE DAILY MACRO & RENAL SAFETY DASHBOARD ── */}
      <Card className="rounded-2xl border border-slate-200/90 bg-white shadow-sm p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {hi ? 'दैनिक पोषण व बाल गुर्दा लक्ष्य' : 'Daily Nutrition & Renal Target Guard'}
                </h3>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                  PRINT 2026 / ICMR
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {hi
                  ? 'सटीक कैलोरी, प्रोटीन व सोडियम निगरानी — गुर्दे पर दबाव से बचाव।'
                  : 'Calibrated pediatric energy, protein, potassium & sodium safety limits.'}
              </p>
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Healthify Calorie Meter & 3 Renal Micro Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-0.5">
          {/* Calorie Progress Ring / Bar */}
          <div className="p-3 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/60 to-orange-50/40 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-amber-950">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                {hi ? 'ऊर्जा (Calories)' : 'Energy (Calories)'}
              </span>
              <span className="font-mono text-amber-800 text-[11px]">
                {dailyTotals.calories} / {dailyTargets.energyKcal} kcal
              </span>
            </div>
            <Progress value={Math.min(100, Math.round((dailyTotals.calories / (dailyTargets.energyKcal || 1)) * 100))} className="h-2 bg-amber-100" />
            <div className="flex justify-between text-[10px] text-amber-800 font-medium">
              <span>{Math.round((dailyTotals.calories / (dailyTargets.energyKcal || 1)) * 100)}% consumed</span>
              <span>{Math.max(0, (dailyTargets.energyKcal || 1400) - dailyTotals.calories)} kcal left</span>
            </div>
          </div>

          {/* Protein Progress */}
          <div className="p-3 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {hi ? 'प्रोटीन (Protein)' : 'Protein'}
              </span>
              <span className="font-mono text-emerald-800 text-[11px]">
                {dailyTotals.protein} / {dailyTargets.proteinG} g
              </span>
            </div>
            <Progress value={Math.min(100, Math.round((dailyTotals.protein / (dailyTargets.proteinG || 1)) * 100))} className="h-2 bg-emerald-100" />
            <div className="flex justify-between text-[10px] text-emerald-800 font-medium">
              <span>{Math.round((dailyTotals.protein / (dailyTargets.proteinG || 1)) * 100)}% RDA</span>
              <span className="text-emerald-700 font-bold">100% SDI safe</span>
            </div>
          </div>

          {/* Potassium Safe Band */}
          <div className={`p-3 rounded-2xl border space-y-1.5 ${
            dailyTotals.potassium > (dailyTargets.potassiumMg || 1600) * 0.9
              ? 'border-rose-300 bg-rose-50/60'
              : (dailyTotals.potassium > (dailyTargets.potassiumMg || 1600) * 0.7
                ? 'border-amber-200 bg-amber-50/50'
                : 'border-slate-200 bg-slate-50/60')
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                {hi ? 'पोटेशियम (K)' : 'Potassium (K)'}
              </span>
              <span className="font-mono text-[11px]">
                {dailyTotals.potassium} / {dailyTargets.potassiumMg} mg
              </span>
            </div>
            <Progress
              value={Math.min(100, Math.round((dailyTotals.potassium / (dailyTargets.potassiumMg || 1)) * 100))}
              className={`h-2 ${dailyTotals.potassium > (dailyTargets.potassiumMg || 1600) * 0.9 ? 'bg-rose-100' : 'bg-teal-100'}`}
            />
            <div className="flex justify-between text-[10px] font-medium text-slate-500">
              <span className="text-teal-700 font-bold">Safe Renal Zone</span>
              <span>&lt; {dailyTargets.potassiumMg} mg limit</span>
            </div>
          </div>

          {/* Sodium Guard */}
          <div className={`p-3 rounded-2xl border space-y-1.5 ${
            dailyTotals.sodium > (dailyTargets.sodiumMg || 1200)
              ? 'border-rose-300 bg-rose-50/70'
              : 'border-slate-200 bg-slate-50/60'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span className="flex items-center gap-1">
                <span>🧂</span>
                {hi ? 'सोडियम (Na)' : 'Sodium (Na)'}
              </span>
              <span className="font-mono text-[11px]">
                {dailyTotals.sodium} / {dailyTargets.sodiumMg} mg
              </span>
            </div>
            <Progress
              value={Math.min(100, Math.round((dailyTotals.sodium / (dailyTargets.sodiumMg || 1)) * 100))}
              className={`h-2 ${dailyTotals.sodium > (dailyTargets.sodiumMg || 1200) ? 'bg-rose-100' : 'bg-slate-200'}`}
            />
            <div className="flex justify-between text-[10px] font-medium text-slate-500">
              <span>{dailyTotals.sodium > (dailyTargets.sodiumMg || 1200) ? '⚠️ Limit Exceeded' : '✓ Strict Low Salt'}</span>
              <span>&lt; {dailyTargets.sodiumMg} mg limit</span>
            </div>
          </div>
        </div>

        {/* 1-Tap Quick Hydration & Fluid Quota Bar */}
        <div className="p-3 bg-gradient-to-r from-blue-50/80 to-sky-50/60 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs">
              <Droplets className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">{hi ? 'दैनिक तरल कोटा (Hydration):' : 'Today’s Fluid Intake & Quota:'}</span>
                <span className="text-xs font-mono font-black text-blue-700">
                  {dailyTotals.fluid} / {dailyTargets.fluidLimit || 1000} mL ({Math.min(100, Math.round((dailyTotals.fluid / (dailyTargets.fluidLimit || 1000)) * 100))}%)
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {hi ? 'सूजन रोकने के लिए तरल मात्रा नियंत्रित रखें। १ स्टील ग्लास ≈ २०० mL' : 'Maintain safe fluid balance to prevent edema. 1 steel glass ≈ 200 mL'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">{hi ? 'त्वरित जोड़ें:' : 'Quick Log:'}</span>
            {[100, 150, 200].map(vol => (
              <Button
                key={vol}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleQuickAddFluid(vol)}
                className="h-7 text-xs font-bold rounded-lg border-blue-200 bg-white hover:bg-blue-600 hover:text-white text-blue-700 shadow-2xs"
              >
                +{vol} mL
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── HEALTHIFY 4-SLOT MEAL TIMELINE DASHBOARD ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-emerald-600" />
            {hi ? 'आज के ४ मुख्य भोजन समय (Meal Slots Timeline):' : 'Today’s 4 Meal Slots Timeline:'}
          </span>
          <span className="text-[11px] text-slate-500">
            {hi ? 'भोजन जोड़ने के लिए किसी भी समय पर क्लिक करें' : 'Tap any slot to log food or voice'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {MEAL_SLOTS.map(slot => {
            const slotItems = mealsBySlot[slot.id] || [];
            const slotCal = slotItems.reduce((acc, m) => acc + (m.calories || 0), 0);
            const slotProt = slotItems.reduce((acc, m) => acc + (m.protein_g || 0), 0).toFixed(1);
            const isSelected = selectedSlot === slot.id;

            return (
              <div
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-200 shadow-sm'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{slot.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-slate-800">{hi ? slot.labelHi : slot.labelEn}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-1.5">{slot.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {slotCal > 0 ? (
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-lg font-mono">
                        {slotCal} kcal · {slotProt}g P
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {hi ? 'खाली है' : 'Not logged'}
                      </span>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartVoiceLogging(slot.id);
                      }}
                      className="w-7 h-7 p-0 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700"
                      title={hi ? 'आवाज़ से दर्ज करें' : 'Voice Log to this slot'}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Logged dishes in this slot */}
                <div className="pt-2 min-h-[36px] flex flex-wrap gap-1.5 items-center">
                  {slotItems.length > 0 ? (
                    slotItems.map((m, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700 font-medium shadow-2xs">
                        <span>{m.food_items}</span>
                        <span className="text-slate-400 font-mono text-[10px]">({Math.round(m.calories)} kcal)</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      {hi ? '+ भोजन जोड़ने के लिए चुनें या बोलें' : '+ Tap to add food or speak'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CARD: ACTIVE MEAL FOOD SEARCH & INSTANT PORTION LOGGER ── */}
      <Card className="rounded-2xl border border-slate-200/90 bg-white shadow-sm p-4 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {hi
                ? `सक्रिय समय: ${MEAL_SLOTS.find(s => s.id === selectedSlot)?.labelHi || selectedSlot} में भोजन जोड़ें`
                : `Active Slot: Adding to ${MEAL_SLOTS.find(s => s.id === selectedSlot)?.labelEn || selectedSlot}`}
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => handleStartVoiceLogging(selectedSlot)}
            className={`${isListeningVoice ? 'bg-rose-600 hover:bg-rose-700 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-bold text-xs h-8 px-3 rounded-xl shadow-xs flex items-center gap-1.5`}
          >
            {isListeningVoice ? <MicOff className="w-3.5 h-3.5 animate-bounce" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isListeningVoice ? (hi ? 'सुन रहे हैं...' : 'Listening...') : (hi ? 'बोलकर जोड़ें' : 'Voice Log')}</span>
          </Button>
        </div>

        {/* Voice Listening / Heard Banner */}
        {(isListeningVoice || voiceTranscript) && (
          <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            isListeningVoice ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <div className="flex items-center gap-2 overflow-hidden">
              {isListeningVoice ? (
                <Mic className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="truncate">
                <strong>{isListeningVoice ? (hi ? 'बोलिए (उदा. "2 रोटी और एक कटोरी दाल")...' : 'Speak now (e.g., "2 roti and 1 bowl dal")...') : (hi ? 'सुना गया: ' : 'Heard: ')}</strong>
                {voiceTranscript || (hi ? 'आवाज़ रिकॉर्ड हो रही है...' : 'Listening to speech...')}
              </span>
            </div>
            {!isListeningVoice && (
              <button
                type="button"
                onClick={() => setVoiceTranscript('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Category Pills (Healthify style fast filtering) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FOOD_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setShowSuggestions(true);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {hi ? cat.labelHi : cat.labelEn}
            </button>
          ))}
        </div>

        {/* ── FREQUENTLY EATEN / RECENT FOODS ROW (HEALTHIFY 1-TAP LOGGING) ── */}
        {recentFoods && recentFoods.length > 0 && (
          <div className="pt-1 pb-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="text-amber-500">⚡</span>
                {hi ? 'अक्सर खाए जाने वाले व्यंजन (1-टैप जोड़ें):' : 'Frequently Eaten Foods (1-Tap Add):'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {hi ? 'हालिया पसंद' : 'Quick staples'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {recentFoods.map((rf, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const match = STAPLE_DEFAULTS[rf.id] || allFoods.find(f => f.id === rf.id || f.name.toLowerCase().includes(rf.id.toLowerCase()) || f.name === rf.name);
                    if (match) handlePickFood(match);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 text-xs font-bold whitespace-nowrap active:scale-95 transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <span className="text-emerald-600 font-bold">+</span>
                  <span>{rf.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── SEARCH & AUTO-SUGGEST FOOD ── */}
        <div className="relative pt-2">
          <label className="text-xs font-bold text-foreground block mb-1">
            {hi ? '१. व्यंजन खोजें या नीचे से तुरंत चुनें:' : '1. Search Food or Pick Quick Staple:'}
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder={hi ? 'उदा. दाल, रोटी, डोसा, खिचड़ी, दही, लौकी, पोहा...' : 'Type food name (e.g. Moong dal, Roti, Dosa, Idli, Rice, Curd)...'}
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="pl-9 pr-9 h-10 rounded-xl text-xs bg-muted/40 border-border focus:bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && (suggestions.length > 0 || isSearchingServer) && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl max-h-64 overflow-y-auto p-1.5 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center border-b border-border">
                <span>
                  {isSearchingServer ? 'Searching 7,083 Foods...' : `Matching Foods (${suggestions.length})`}
                </span>
                <span className="text-teal-600 font-semibold">Click to select portion</span>
              </div>
              {suggestions.map(food => (
                <div
                  key={food.id}
                  onClick={() => handlePickFood(food)}
                  className="p-2 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-foreground">{food.name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">({food.canonical_portion})</span>
                      {food.is_global && (
                        <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                          FitBook DB
                        </span>
                      )}
                      {food.renal_safety && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          food.renal_safety.includes('Safe')
                            ? 'bg-emerald-100 text-emerald-800'
                            : (food.renal_safety.includes('Restrict') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')
                        }`}>
                          {food.renal_safety}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5 font-mono">
                      <span className="text-teal-700 font-bold">{food.standard_portion_nutrients?.calories} kcal</span>
                      <span>·</span>
                      <span className="text-foreground font-semibold">{food.standard_portion_nutrients?.protein_g}g prot</span>
                      <span>·</span>
                      <span>{food.potassium?.mg_portion || 0}mg K</span>
                      <span>·</span>
                      <span>{food.standard_portion_nutrients?.sodium_mg || 0}mg Na</span>
                    </div>
                  </div>
                  <Button size="sm" className="h-7 text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-2.5 shrink-0">
                    + Portion
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Staple Chips */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] text-muted-foreground font-semibold">
            {hi ? 'त्वरित व्यंजन (मात्रा व पोषण के साथ):' : 'Quick staples (Tap to pick portion):'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_STAPLES.map(staple => (
              <button
                key={staple.name}
                type="button"
                onClick={() => {
                  if (staple.highRisk) {
                    setSwapAlert({
                      hazard: staple.name,
                      swap: staple.swapTo
                    });
                    return;
                  }
                  const found = STAPLE_DEFAULTS[staple.matchId] || allFoods.find(f =>
                    f.id.includes(staple.matchId) ||
                    f.name.toLowerCase().includes(staple.matchId)
                  );
                  if (found) {
                    handlePickFood(found);
                  }
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  staple.highRisk
                    ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100 font-bold'
                    : 'bg-muted/60 text-foreground border-border hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 font-medium'
                }`}
              >
                + {staple.name}
              </button>
            ))}
          </div>
        </div>

        {/* High Risk Snack Warning & Swap Modal */}
        {swapAlert && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <SeverityBadge severity="urgent" text="High Salt / Potassium Risk Item" size="sm" />
              <button onClick={() => setSwapAlert(null)} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-red-900 leading-relaxed">
              <strong>{swapAlert.hazard}</strong> contains excessive sodium and preservatives that can trigger relapse or swelling.
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-red-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-teal-800 uppercase font-black block">Recommended Renal Safe Swap</span>
                <span className="text-xs font-bold text-teal-900">👉 {swapAlert.swap}</span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const safeTerm = swapAlert.swap.includes('Makhana') ? 'makhana' : (swapAlert.swap.includes('Poha') ? 'poha' : 'rice');
                  const match = allFoods.find(f => f.id.includes(safeTerm) || f.name.toLowerCase().includes(safeTerm));
                  setSwapAlert(null);
                  if (match) handlePickFood(match);
                }}
                className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-2.5"
              >
                Log Swap
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── CARD: ITEMS ADDED TO MEAL WITH LIVE TOTALS ── */}
      {mealItems.length > 0 && (
        <Card className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-teal-950 border-b border-teal-200/80 pb-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              {hi ? `भोजन में शामिल व्यंजन (${mealItems.length}):` : `Foods in this Meal (${mealItems.length}):`}
            </span>
            <button
              type="button"
              onClick={() => setMealItems([])}
              className="text-[11px] text-red-600 hover:underline font-semibold"
            >
              {hi ? 'सभी हटाएं' : 'Clear all'}
            </button>
          </div>

          {/* List of food pills */}
          <div className="flex flex-wrap gap-2">
            {mealItems.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white border border-teal-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-xs"
              >
                <div>
                  <span className="font-bold text-foreground">{item.name}</span>{' '}
                  <span className="text-[11px] text-muted-foreground font-mono">({item.portionLabel})</span>
                </div>
                <div className="text-[11px] font-bold text-teal-700 font-mono">
                  {item.cal} kcal · {item.prot}g P
                </div>
                <button
                  type="button"
                  onClick={() => setMealItems(prev => prev.filter((_, i) => i !== idx))}
                  className="w-4 h-4 rounded-full bg-muted hover:bg-red-100 text-muted-foreground hover:text-red-700 flex items-center justify-center text-[10px]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* ── AUTOCALC LIVE METRICS STRIP ── */}
          <div className="pt-2 border-t border-teal-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                {hi ? 'ऑटो-कैलकुलेशन परिणाम (डेटाबेस से प्रमाणित):' : 'Autocalc Engine Meal Totals:'}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {mealTotals.cal} kcal total
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-teal-200 shadow-xs">
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Energy (ऊर्जा)</span>
                <span className="text-base font-black text-amber-700 font-mono">{mealTotals.cal}</span>
                <span className="text-[10px] text-muted-foreground block">kcal</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-teal-200 shadow-xs">
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Protein (प्रोटीन)</span>
                <span className="text-base font-black text-teal-800 font-mono">{mealTotals.prot}</span>
                <span className="text-[10px] text-muted-foreground block">g</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-teal-200 shadow-xs">
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Sodium (सोडियम)</span>
                <span className="text-base font-black text-red-700 font-mono">{mealTotals.na}</span>
                <span className="text-[10px] text-muted-foreground block">mg Na</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-teal-200 shadow-xs">
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Potassium (K)</span>
                <span className="text-base font-black text-foreground font-mono">{mealTotals.k}</span>
                <span className="text-[10px] text-muted-foreground block">mg</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── CARD: KITCHEN SALT & FLUID ACCOUNTING ── */}
      <Card className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Salt Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>🧂</span>
                {hi ? 'ऊपर से मिलाया गया नमक (Table Salt):' : 'Added Table Salt in Plate / Cooking:'}
              </label>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                +{addedSaltNaMg} mg Na
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'none', label: hi ? 'बिल्कुल नहीं' : 'No Salt', desc: '0 mg Na', safe: true },
                { id: 'pinch', label: hi ? '1 चुटकी' : '1 Pinch', desc: '+200 mg Na' },
                { id: 'quarter_tsp', label: hi ? '¼ छोटा चम्मच' : '¼ tsp', desc: '+500 mg Na' },
                { id: 'half_tsp', label: hi ? '½ छोटा चम्मच' : '½ tsp ⚠️', desc: '+1000 mg Na', risk: true }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAddedSaltOption(opt.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    addedSaltOption === opt.id
                      ? opt.risk
                        ? 'border-red-500 bg-red-50 text-red-900 font-bold ring-2 ring-red-200'
                        : 'border-teal-600 bg-teal-50 text-teal-900 font-bold ring-2 ring-teal-200'
                      : 'border-border bg-muted/30 text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[9px] text-muted-foreground font-mono">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Fluid Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                {hi ? 'तरल पदार्थ (पानी/दूध):' : 'Direct Fluid Intake (Water/Milk):'}
              </label>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {directFluidMl} mL
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[100, 150, 200, 250, 300].map(vol => (
                <button
                  key={vol}
                  type="button"
                  onClick={() => setDirectFluidMl(vol)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    directFluidMl === vol
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'border-border bg-muted/30 text-foreground hover:bg-muted'
                  }`}
                >
                  {vol}mL
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {hi ? '1 स्टील का गिलास = लगभग 200 mL' : '1 standard steel glass = ~200 mL'}
            </p>
          </div>
        </div>

        {/* Clinical Safety Check on High Salt */}
        {mealTotals.na > 600 && (
          <SeverityBadge
            severity="warning"
            text={`High sodium meal: ${mealTotals.na} mg Na exceeds single-meal safe threshold (600 mg). Consider reducing added salt.`}
            size="sm"
          />
        )}

        {/* Save Meal Button */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={handleSaveMeal}
            disabled={isSubmitting || mealItems.length === 0}
            className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>{hi ? 'सहेजा जा रहा है...' : 'Saving with Engine...'}</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{hi ? '✓ भोजन सहेजें (ऑटो-कैलकुलेशन सेव करें)' : '✓ Save Meal with Autocalc Engine'}</span>
              </>
            )}
          </Button>

          {saveSuccess && (
            <div className="mt-2 p-2.5 bg-green-50 border border-green-200 text-green-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{hi ? 'भोजन सफलतापूर्वक सहेजा गया! दैनिक लॉग अपडेट हो गया है।' : 'Meal logged successfully with exact calories, protein & minerals!'}</span>
            </div>
          )}
        </div>
      </Card>

      {/* ── CARD: TODAY'S LOGGED MEALS HISTORY ── */}
      {todayMeals.length > 0 && (
        <Card className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              {hi ? `आज के दर्ज भोजन (${todayMeals.length})` : `Logged Meals for ${selectedDate} (${todayMeals.length})`}
            </h4>
            <span className="text-[11px] font-bold text-teal-700 font-mono">
              Total: {todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0)} kcal
            </span>
          </div>

          <div className="divide-y divide-border">
            {todayMeals.map((meal, idx) => (
              <div key={meal.id || idx} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <span className="uppercase text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      {meal.meal_slot || 'Meal'}
                    </span>
                    <span>{meal.food_items}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-1 font-mono">
                    <span className="text-amber-800 font-bold">{Math.round(meal.calories || 0)} kcal</span>
                    <span>·</span>
                    <span className="text-teal-800 font-bold">{(meal.protein_g || 0).toFixed(1)}g prot</span>
                    <span>·</span>
                    <span className="text-red-800 font-bold">{Math.round(meal.sodium_mg || 0)}mg Na</span>
                    <span>·</span>
                    <span>{meal.fluid_ml || 0}mL fluid</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <Badge variant="outline" className="text-[10px]">
                    {meal.sodium_level || 'Normal'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── DIALOG: INTERACTIVE HOUSEHOLD PORTION SELECTOR MODAL ── */}
      <Dialog open={Boolean(portionFood)} onOpenChange={(open) => { if (!open) setPortionFood(null); }}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border p-5">
          {portionFood && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-800 border-teal-300 font-bold uppercase">
                    {portionFood.category || 'Renal Food Item'}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Ref: 1 {portionFood.unit === 'piece' ? 'piece' : (portionFood.unit_label || 'katori')} = {portionFood.single_unit_g || 100}g
                  </span>
                </div>
                <DialogTitle className="text-base font-bold text-foreground mt-1">
                  🍲 {portionFood.name}
                </DialogTitle>
              </DialogHeader>

              {/* Universal Household Portion Measures (Katori, Glass, Roti, Spoon) */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>{hi ? 'मात्रा चुनें (घरेलू कटोरी / गिलास / रोटी):' : 'Choose Household Portion:'}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">{hi ? 'त्वरित चयन' : 'Quick select'}</span>
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { label: hi ? 'छोटी कटोरी' : 'Small Katori', icon: '🥣', g: 100, sub: '100g' },
                    { label: hi ? 'मानक कटोरी' : 'Std Katori', icon: '🥣', g: 150, sub: '150g' },
                    { label: hi ? 'बड़ी कटोरी' : 'Big Katori', icon: '🥣', g: 200, sub: '200g' },
                    { label: hi ? 'स्टील गिलास' : 'Steel Glass', icon: '🥛', g: 200, sub: '200 mL' },
                    { label: hi ? '१ चपाती' : '1 Roti', icon: '🫓', g: 30, sub: '30g' },
                    { label: hi ? 'बड़ा चम्मच' : '1 Tbsp', icon: '🥄', g: 15, sub: '15g' }
                  ].map((m) => {
                    const isSelected = selectedMeasureName.includes(m.label) || (customGrams === String(m.g) && !selectedMeasureName);
                    return (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => {
                          setCustomGrams(String(m.g));
                          setSelectedMeasureName(`${m.label} (${m.sub})`);
                          setPortionCount(1);
                        }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-300 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="text-base leading-none mb-0.5">{m.icon}</div>
                        <div className="text-[11px] font-bold truncate leading-tight">{m.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{m.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stepper for custom quantity */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-foreground block">
                  {hi ? 'या संख्या / कटोरी बदलें:' : 'Or adjust portion count:'}
                </span>
                <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomGrams('');
                      setSelectedMeasureName('');
                      setPortionCount(prev => Math.max(0.5, Number((prev - (portionFood.unit === 'piece' ? 1 : 0.5)).toFixed(1))));
                    }}
                    className="w-10 h-10 rounded-xl bg-background border-border text-foreground font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-xl font-black text-foreground font-mono">
                      {portionCount}
                    </span>{' '}
                    <span className="text-xs text-muted-foreground">
                      {selectedMeasureName || (portionFood.unit === 'piece' ? (portionCount > 1 ? 'pieces' : 'piece') : (portionFood.unit_label || 'katori'))}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomGrams('');
                      setSelectedMeasureName('');
                      setPortionCount(prev => Number((prev + (portionFood.unit === 'piece' ? 1 : 0.5)).toFixed(1)));
                    }}
                    className="w-10 h-10 rounded-xl bg-background border-border text-foreground font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Custom Grams input (optional) */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground whitespace-nowrap">
                  {hi ? 'या ग्राम में वजन:' : 'Or weighed grams:'}
                </label>
                <Input
                  type="number"
                  placeholder={`e.g. ${modalCalculated?.grams || 100}`}
                  value={customGrams}
                  onChange={e => {
                    setCustomGrams(e.target.value);
                    setSelectedMeasureName('');
                  }}
                  className="h-8 text-xs font-mono"
                />
                <span className="text-xs text-muted-foreground">g</span>
              </div>

              {/* Autocalc Output for this Portion */}
              {modalCalculated && (
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 p-3 rounded-xl space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-teal-800 tracking-wider flex items-center justify-between">
                    <span>Engine Output: {selectedMeasureName || `${modalCalculated.grams}g`}</span>
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                    <div className="bg-white/80 p-1.5 rounded-lg border border-teal-100">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold block">Calories</span>
                      <span className="font-black text-amber-700 font-mono">{modalCalculated.cal}</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-teal-100">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold block">Protein</span>
                      <span className="font-black text-teal-800 font-mono">{modalCalculated.prot}g</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-teal-100">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold block">Sodium</span>
                      <span className="font-black text-red-700 font-mono">{modalCalculated.na}mg</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-teal-100">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold block">Potassium</span>
                      <span className="font-black text-foreground font-mono">{modalCalculated.k}mg</span>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setPortionFood(null); setSelectedMeasureName(''); }}
                  className="rounded-xl text-xs h-10 w-full sm:w-auto"
                >
                  {hi ? 'रद्द करें' : 'Cancel'}
                </Button>
                
                <Button
                  type="button"
                  onClick={handleConfirmPortion}
                  variant="secondary"
                  className="rounded-xl text-xs h-10 font-bold border border-emerald-200 text-emerald-800 hover:bg-emerald-50 flex items-center justify-center gap-1.5 flex-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{hi ? '+ थाली में जोड़ें' : '+ Add to Plate'}</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleQuickLogSingleFood}
                  className="rounded-xl text-xs h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-sm flex-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{hi ? '⚡ सीधे दर्ज करें' : '⚡ Quick Log Now'}</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
