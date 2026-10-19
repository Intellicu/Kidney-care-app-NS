import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Plus, Minus, X, Utensils, TrendingUp,
  CheckCircle2, Droplets, Info, Sparkles, Calendar, ArrowRight,
  Apple, Search, Clock, Filter, BookOpen,
  Scale, Flame, Target, Check, Camera, Upload, RotateCw,
  Image, Sparkle, Layers, Eye, ChevronDown, ChevronUp,
  AlertTriangle, FileText, ShieldAlert, CheckCheck, Share2, Copy,
  Mic, MicOff
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useUserRole } from '../context/UserRoleContext';
import { useLanguage } from '../components/shared/LanguageContext';

import rawFoodTable from '../data/food_table.json';
import rawTargets from '../data/nutrition_targets.json';
import consolidatedCatalog from '../data/consolidated_food_catalog.json';

// KidneyCare Modular Nutrition Engine Components
import AutocalcMealLogger from '../components/nutrition/AutocalcMealLogger';
import RecallLogger from '../components/nutrition/RecallLogger';
import MealPlanBuilder from '../components/nutrition/MealPlanBuilder';
import CustomFoodEntry from '../components/nutrition/CustomFoodEntry';

const MEAL_SLOTS = [
  { id: 'Breakfast', labelEn: 'Breakfast', labelHi: 'सुबह का नाश्ता', icon: '🌅' },
  { id: 'Lunch', labelEn: 'Lunch', labelHi: 'दोपहर का भोजन', icon: '☀️' },
  { id: 'Dinner', labelEn: 'Dinner', labelHi: 'रात का खाना', icon: '🌙' },
  { id: 'Snack', labelEn: 'Snacks / Evening', labelHi: 'शाम का नाश्ता', icon: '🍿' }
];

const GUIDES_META = [
  { id: 'all', label: 'All Guides (643 foods)', color: 'bg-slate-800' },
  { id: 'K_north_2023', label: 'North Indian Diet (K)', color: 'bg-indigo-600' },
  { id: 'K_south_2024', label: 'South Indian Diet (K)', color: 'bg-emerald-600' },
  { id: 'K_west_central_2023', label: 'West & Central Diet (K)', color: 'bg-amber-600' },
  { id: 'P_phosphate_guide_2026', label: 'Phosphate Guide', color: 'bg-purple-600' },
  { id: 'K_general_2023', label: 'General K Guide', color: 'bg-blue-600' }
];

const RENAL_SWAPS_CATALOG = [
  {
    id: 'swap-namkeen',
    category: 'Snacks',
    categoryHi: 'नमकीन / स्नैक्स',
    highRisk: {
      nameEn: 'Namkeen / Bhujia / Sev',
      nameHi: 'नमकीन / भुजिया / सेव',
      hazard: 'Extreme Sodium & Industrial Trans Fats',
      hazardHi: 'अत्यधिक नमक (750-1100 mg Na/100g) व ट्रांस फैट',
      sodium: '750–1,100 mg / 100g',
      k: '320 mg',
      badge: 'High Sodium ⚠️'
    },
    safeSwap: {
      nameEn: 'Roasted Makhana (Fox Nuts) or Roasted Chana',
      nameHi: 'भुना हुआ मखाना या भुना चना (बिना नमक)',
      foodMatch: 'makhana',
      benefit: 'Dry-roasted with pinch of turmeric & cumin, zero added salt. Light on glomeruli, excellent crunch & high satiety.',
      benefitHi: 'हल्दी और भुने जीरे के साथ सूखा भुना हुआ, शून्य अतिरिक्त नमक। कुरकुरा, तृप्तिदायक और सुरक्षित।',
      sodium: '< 15 mg',
      k: 'Safe produce',
      cal: '120 kcal / katori',
      prot: '3.2 g'
    }
  },
  {
    id: 'swap-cola',
    category: 'Beverages',
    categoryHi: 'पेय पदार्थ',
    highRisk: {
      nameEn: 'Cola / Dark Carbonated Drinks',
      nameHi: 'कोला / कोल्ड ड्रिंक्स',
      hazard: 'Inorganic Phosphate Additive (INS 338 — 90-100% absorbed)',
      hazardHi: 'अकार्बनिक फॉस्फेट (INS 338) जो 90-100% शरीर में अवशोषित होता है',
      sodium: '40–70 mg',
      k: 'Low',
      badge: 'Chemical Phosphate ⚠️'
    },
    safeSwap: {
      nameEn: 'Fresh Chhash (Buttermilk) or Lemonade',
      nameHi: 'ताज़ा पतली छाछ (बिना नमक) या ताज़ा शिकंजी',
      foodMatch: 'curd',
      benefit: 'Diluted home curd with mint, coriander & roasted jeera (no black/rock salt). Zero chemical phosphoric acid.',
      benefitHi: 'पुदीना, भुने जीरे और धनिए के साथ ताज़ा छाछ। शून्य रासायनिक फॉस्फेट।',
      sodium: '< 45 mg',
      k: '140 mg',
      cal: '42 kcal / glass',
      prot: '2.4 g'
    }
  },
  {
    id: 'swap-noodles',
    category: 'Fast Food',
    categoryHi: 'फ़ास्ट फ़ूड',
    highRisk: {
      nameEn: 'Instant Noodles (Maggi / Top Ramen)',
      nameHi: 'इंस्टेंट नूडल्स / मैगी',
      hazard: 'Tastemaker Sodium Bomb & Polyphosphates (INS 452)',
      hazardHi: 'मसाला पैकेट में भारी नमक (900-1200 mg Na) और पॉलीफॉस्फेट एडिटिव्स',
      sodium: '900–1,250 mg / pack',
      k: '160 mg',
      badge: 'Sodium Bomb ⚠️'
    },
    safeSwap: {
      nameEn: 'Homemade Vegetable Poha or Suji Upma',
      nameHi: 'घर का बना सब्ज़ी पोहा या सूजी उपमा',
      foodMatch: 'poha',
      benefit: 'Flaked rice sautéed with curry leaves, onions, turmeric, and renal-safe vegetables (lauki/carrot). Measured salt.',
      benefitHi: 'कढ़ी पत्ता, प्याज़ और सुरक्षित सब्ज़ियों (लौकी/गाजर) के साथ बना पोहा। नियंत्रित नमक।',
      sodium: '95–130 mg',
      k: '110 mg',
      cal: '185 kcal / katori',
      prot: '4.1 g'
    }
  },
  {
    id: 'swap-chips',
    category: 'Snacks',
    categoryHi: 'स्नैक्स',
    highRisk: {
      nameEn: 'Packaged Potato Chips / Kurkure',
      nameHi: 'पैकेट वाले आलू चिप्स / कुरकुरे',
      hazard: 'High Sodium & High Potassium from Concentrated Potato Flakes',
      hazardHi: 'आलू के घने अवयवों से अत्यधिक पोटेशियम और अतिरिक्त सोडियम',
      sodium: '650–980 mg / pack',
      k: '480–620 mg',
      badge: 'High Salt & K ⚠️'
    },
    safeSwap: {
      nameEn: 'Murmura Bhel (Puffed Rice) / Rice Flakes Chivda',
      nameHi: 'मुरमुरा भेल (बिना नमक / कम नमक) या भुना चिवड़ा',
      foodMatch: 'rice',
      benefit: 'Light puffed rice with diced cucumber, roasted peanuts, lemon juice, and coriander. Extremely gentle on kidneys.',
      benefitHi: 'खीरा, भुनी मूँगफली, नींबू रस और धनिए के साथ फूला हुआ मुरमुरा। किडनी के लिए बेहद हल्का।',
      sodium: '< 25 mg',
      k: '85 mg',
      cal: '95 kcal / bowl',
      prot: '2.1 g'
    }
  },
  {
    id: 'swap-papad-pickle',
    category: 'Condiments',
    categoryHi: 'अचार व पापड़',
    highRisk: {
      nameEn: 'Papad & Commercial Mango/Lemon Pickle (Achaar)',
      nameHi: 'पापड़ व बाज़ार का खट्टा अचार',
      hazard: 'Papad Khar (Sodium Carbonate) + Preservative Brine Salt',
      hazardHi: 'पापड़ खार (सोडियम कार्बोनेट) और प्रिजर्वेटिव नमक का अत्यधिक स्तर',
      sodium: '400–600 mg / single papad or spoon',
      k: 'Variable',
      badge: 'Hidden Sodium Spike ⚠️'
    },
    safeSwap: {
      nameEn: 'Fresh Cucumber Slices & Salt-Free Mint Chutney',
      nameHi: 'ताज़ा खीरे के स्लाइस व बिना नमक की पुदीना-धनिया चटनी',
      foodMatch: 'cucumber',
      benefit: 'Crisp raw cucumber with antioxidant-rich mint, lemon juice, and roasted cumin. Delicious crunch without oedema.',
      benefitHi: 'पुदीना, नींबू रस और भुने जीरे के साथ खीरा। बिना सूजन या पानी रोके शानदार स्वाद।',
      sodium: '< 8 mg',
      k: '70 mg',
      cal: '18 kcal',
      prot: '0.8 g'
    }
  },
  {
    id: 'swap-cheese',
    category: 'Dairy',
    categoryHi: 'डेयरी उत्पाद',
    highRisk: {
      nameEn: 'Processed Cheese Slices / Cheese Spread',
      nameHi: 'प्रोसेस्ड चीज़ स्लाइस / स्प्रेड',
      hazard: 'Emulsifying Salts: Sodium Phosphates & Citrates (INS 339, 452)',
      hazardHi: 'इमल्सीफाइंग फॉस्फेट लवण (INS 339, 452) जो धमनियों व हड्डियों पर असर डालते हैं',
      sodium: '450–650 mg / slice',
      k: '60 mg',
      badge: 'Inorganic Phosphate ⚠️'
    },
    safeSwap: {
      nameEn: 'Homemade Low-Salt Paneer (Fresh Cottage Cheese)',
      nameHi: 'घर का बना ताज़ा पनीर (बिना नमक)',
      foodMatch: 'paneer',
      benefit: 'Curdled with lemon juice and washed thoroughly in cold water. High Biological Value (HBV) protein without chemical preservatives.',
      benefitHi: 'नींबू से फाड़कर ताज़े पानी से धुला हुआ घर का पनीर। बिना रासायनिक प्रिजर्वेटिव उच्च कोटि का प्रोटीन।',
      sodium: '< 20 mg / 30g',
      k: '45 mg',
      cal: '88 kcal',
      prot: '5.5 g'
    }
  },
  {
    id: 'swap-soup',
    category: 'Prepared Meals',
    categoryHi: 'तैयार भोजन',
    highRisk: {
      nameEn: 'Commercial Soup Packets (Instant Ready Soups)',
      nameHi: 'पैकेट वाले रेडीमेड सूप पाउडर',
      hazard: 'Monosodium Glutamate (MSG) & Disodium Inosinate Additives',
      hazardHi: 'मोनोसोडियम ग्लूटामेट (MSG) और गाढ़ा करने वाले रासायनिक स्टार्च व भारी नमक',
      sodium: '750–950 mg / cup',
      k: '180 mg',
      badge: 'Extreme Sodium ⚠️'
    },
    safeSwap: {
      nameEn: 'Fresh Lauki-Tomato Shorba (Clear Soup)',
      nameHi: 'घर का बना ताज़ा लौकी-टमाटर शोरबा',
      foodMatch: 'bottle-gourd',
      benefit: 'Boiled bottle gourd and fresh tomatoes strained with roasted jeera & black pepper. Safe fluid accounting with zero additives.',
      benefitHi: 'उबली लौकी व ताज़ा टमाटर का भुने जीरे व काली मिर्च से बना सूप। साफ़ पानी और बिना एडिटिव्स।',
      sodium: '< 50 mg',
      k: '150 mg',
      cal: '40 kcal / cup',
      prot: '1.2 g'
    }
  }
];

export default function NutritionHub({ isStandalone = false }) {
  const queryClient = useQueryClient();
  const { activePatientCr, role, isNutrition, setRole, isClinician, isCaregiver } = useUserRole();
  const standalone = isStandalone || isNutrition || (typeof window !== 'undefined' && window.KIDNEYCARE_APP_FLAVOR === 'nutrition') || localStorage.getItem('kidneycare_selected_app') === 'nutrition';
  const { language, changeLanguage } = useLanguage();
  const hi = language === 'hi';

  const [activeTab, setActiveTab] = useState('log'); // 'log' | 'recall' | 'meal_plan' | 'food_tables' | 'swaps' | 'custom' | 'targets' | 'calculator'
  const [loggerMode, setLoggerMode] = useState('autocalc'); // 'autocalc' | 'standard'
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState('Lunch');
  const [mealText, setMealText] = useState('');
  const [sodiumLevel, setSodiumLevel] = useState('Low Salt');
  const [fluidMl, setFluidMl] = useState(250);
  const [caloriesEst, setCaloriesEst] = useState('');
  const [proteinEst, setProteinEst] = useState('');
  const [sodiumEst, setSodiumEst] = useState('');
  const [mealNotes, setMealNotes] = useState('');
  const [mealImageUrl, setMealImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Added Salt Selector (Teaspoon / Pinch - Cultural Indian Kitchen Measure)
  const [addedSaltTsp, setAddedSaltTsp] = useState('none'); // 'none' | 'pinch' | 'quarter_tsp' | 'half_tsp'
  const [isPotassiumRestricted, setIsPotassiumRestricted] = useState(false);
  const [isPhosphateRestricted, setIsPhosphateRestricted] = useState(false);
  const [isLeachingSignedOff, setIsLeachingSignedOff] = useState(false);
  const [childDob, setChildDob] = useState('2019-04-12');
  const [childHeightCm, setChildHeightCm] = useState('118.5');
  const [showDoctorCodeModal, setShowDoctorCodeModal] = useState(false);
  const [doctorCodeInput, setDoctorCodeInput] = useState('');
  const [doctorCodeError, setDoctorCodeError] = useState('');
  const [doctorPlanNote, setDoctorPlanNote] = useState('Limit added salt during relapse watch. Water ad libitum.');
  const [activeDoctorPlan, setActiveDoctorPlan] = useState(() => {
    try {
      const saved = localStorage.getItem('kc_doctor_plan');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Renal Smart Swaps State
  const [swapsSearchQuery, setSwapsSearchQuery] = useState('');
  const [swapsCategoryFilter, setSwapsCategoryFilter] = useState('all');

  // Meal Image Scanner State (Snap-Style Two-Stage Architecture)
  const [showImageScannerModal, setShowImageScannerModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedMealImage, setCapturedMealImage] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analyzedPlateInfo, setAnalyzedPlateInfo] = useState(null);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(0);
  const [boxSelections, setBoxSelections] = useState({});
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Voice Speech-to-Meal Logging State (Hindi & English)
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Quick Suggest & Portion Calculation Engine State
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [portionModalFood, setPortionModalFood] = useState(null);
  const [portionCount, setPortionCount] = useState(1);
  const [addedMealItems, setAddedMealItems] = useState([]);

  // Food Table Browser State
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [selectedGuideFilter, setSelectedGuideFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Custom Food Creator Modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItem, setCustomItem] = useState({
    name: '',
    hindi_name: '',
    category: 'Grain',
    salt_level: 'Normal',
    sodium_mg: '120',
    fluid_ml: '150',
    calories: '140',
    protein_g: '4.5'
  });

  // Calculate exact decimal age from DOB
  const exactAgeYears = useMemo(() => {
    if (!childDob) return 7.5;
    const diffMs = Date.now() - new Date(childDob).getTime();
    const age = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0.1, Number(age.toFixed(1)));
  }, [childDob]);

  // Height age calculation if poor growth
  const heightAgeYears = useMemo(() => {
    const ht = parseFloat(childHeightCm) || 118;
    if (ht < 75) return 1.0;
    if (ht < 87) return 2.0;
    if (ht < 96) return 3.0;
    if (ht < 103) return 4.0;
    if (ht < 110) return 5.0;
    if (ht < 116) return 6.0;
    if (ht < 122) return 7.0;
    if (ht < 128) return 8.0;
    if (ht < 133) return 9.0;
    if (ht < 138) return 10.0;
    return 11.0;
  }, [childHeightCm]);

  // Added salt in mg sodium
  const addedSaltNaMg = useMemo(() => {
    switch (addedSaltTsp) {
      case 'pinch': return 200; // ~0.5 g salt = 200 mg Na
      case 'quarter_tsp': return 500; // ~1.25 g salt = 500 mg Na
      case 'half_tsp': return 1000; // ~2.5 g salt = 1000 mg Na
      case 'one_tsp': return 2000; // ~5 g salt = 2000 mg Na
      default: return 0;
    }
  }, [addedSaltTsp]);

  // ── PRINT SDI STANDARDS & CALCULATOR ENGINE STATE (Offline & Real-Time) ──
  const [calcAgeGroup, setCalcAgeGroup] = useState('7-8');
  const [calcGender, setCalcGender] = useState('Male');
  const [calcWeight, setCalcWeight] = useState('21.4');
  const [calcCondition, setCalcCondition] = useState('ns_relapse'); // 'ns_relapse' | 'ns_remission' | 'ckd_2_3' | 'ckd_4_5' | 'pd' | 'hd'
  const [calcPoorGrowth, setCalcPoorGrowth] = useState(false);
  const [sdiViewSubtab, setSdiViewSubtab] = useState('calculator'); // 'calculator' | 'tables' | 'icmr_conflicts' | 'pitfalls'
  const [expandedConflictId, setExpandedConflictId] = useState(null);

  // Real-time calculation derived from PRINT 2026 guidelines & Spec v4
  const computedSdi = useMemo(() => {
    const wt = parseFloat(calcWeight) || 20.0;
    const isInfant = ['0-3m', '4-6m', '7-11m', '12m'].includes(calcAgeGroup);
    
    let energyPerKg = [60, 77];
    let baseProteinPerKg = [0.9, 0.95];
    let proteinPerDay = [19, 28];
    // Reconciled single sodium ceiling: in relapse, strictly <1.2g Na (<1,200mg Na / ~3g salt)
    let cdrrNa = calcCondition === 'ns_relapse' ? 1.2 : 1.7; // grams Na
    let cdrrSalt = calcCondition === 'ns_relapse' ? 3.0 : 4.0; // grams Salt

    if (calcAgeGroup === '0-3m') {
      energyPerKg = [93, 115];
      baseProteinPerKg = [1.52, 2.0];
      proteinPerDay = [8, 12];
      cdrrNa = 0.12; cdrrSalt = 0.3;
    } else if (calcAgeGroup === '4-6m') {
      energyPerKg = [82, 98];
      baseProteinPerKg = [1.3, 1.52];
      proteinPerDay = [9, 13];
      cdrrNa = 0.2; cdrrSalt = 0.5;
    } else if (calcAgeGroup === '7-11m') {
      energyPerKg = [72, 82];
      baseProteinPerKg = [1.1, 1.3];
      proteinPerDay = [9, 15];
      cdrrNa = 0.37; cdrrSalt = 0.9;
    } else if (calcAgeGroup === '12m') {
      energyPerKg = [72, 120];
      baseProteinPerKg = [0.9, 1.14];
      proteinPerDay = [11, 14];
      cdrrNa = 1.2; cdrrSalt = 3.0;
    } else if (calcAgeGroup === '2') {
      energyPerKg = calcGender === 'Male' ? [81, 95] : [79, 92];
      baseProteinPerKg = [0.9, 1.05];
      proteinPerDay = [11, 15];
      cdrrNa = 1.2; cdrrSalt = 3.0;
    } else if (calcAgeGroup === '3') {
      energyPerKg = calcGender === 'Male' ? [80, 82] : [76, 77];
      baseProteinPerKg = [0.9, 1.05];
      proteinPerDay = [13, 15];
      cdrrNa = 1.2; cdrrSalt = 3.0;
    } else if (calcAgeGroup === '4-6') {
      energyPerKg = calcGender === 'Male' ? [67, 93] : [64, 90];
      baseProteinPerKg = [0.85, 0.95];
      proteinPerDay = [16, 22];
      cdrrNa = 1.5; cdrrSalt = 3.5;
    } else if (calcAgeGroup === '7-8') {
      energyPerKg = calcGender === 'Male' ? [60, 77] : [56, 75];
      baseProteinPerKg = [0.9, 0.95];
      proteinPerDay = [19, 28];
      cdrrNa = 1.7; cdrrSalt = 4.0;
    } else if (calcAgeGroup === '9-10') {
      energyPerKg = calcGender === 'Male' ? [55, 69] : [49, 63];
      baseProteinPerKg = [0.9, 0.95];
      proteinPerDay = [26, 40];
      cdrrNa = 2.0; cdrrSalt = 5.0;
    } else if (calcAgeGroup === '11-12') {
      energyPerKg = calcGender === 'Male' ? [48, 63] : [43, 57];
      baseProteinPerKg = [0.9, 0.95];
      proteinPerDay = [34, 42];
      cdrrNa = 2.0; cdrrSalt = 5.0;
    } else if (calcAgeGroup === '13-14') {
      energyPerKg = calcGender === 'Male' ? [44, 63] : [39, 50];
      baseProteinPerKg = [0.8, 0.9];
      proteinPerDay = [34, 50];
      cdrrNa = 2.3; cdrrSalt = 5.5;
    } else if (calcAgeGroup === '15-17') {
      energyPerKg = calcGender === 'Male' ? [40, 55] : [36, 46];
      baseProteinPerKg = [0.8, 0.9];
      proteinPerDay = calcGender === 'Male' ? [52, 65] : [45, 49];
      cdrrNa = 2.3; cdrrSalt = 5.5;
    }

    // Dialysis Add-ons & Adjustments (PRINT / Polderman 2026)
    let proteinAddOnPerKg = 0;
    let dextroseKcal = 0;
    if (calcCondition === 'pd') {
      // Peritoneal Dialysis: add 0.15 to 0.30 g/kg/d (infants ~0.28, older children ~0.15-0.20)
      proteinAddOnPerKg = isInfant ? 0.28 : 0.20;
      // Dextrose absorption from dialysate: 7 to 9 kcal/kg/day (Polderman 2026)
      dextroseKcal = Math.round(wt * 8);
    } else if (calcCondition === 'hd') {
      // Hemodialysis: add 0.10 g/kg/day
      proteinAddOnPerKg = 0.10;
    }

    const finalProteinPerKg = [
      +(baseProteinPerKg[0] + proteinAddOnPerKg).toFixed(2),
      +(baseProteinPerKg[1] + proteinAddOnPerKg).toFixed(2)
    ];

    const finalTotalProtein = [
      Math.round(wt * finalProteinPerKg[0]),
      Math.round(wt * finalProteinPerKg[1])
    ];

    // Energy: If poor growth, prioritize upper bound
    const finalDailyEnergy = [
      Math.round(wt * (calcPoorGrowth ? energyPerKg[1] * 0.9 : energyPerKg[0])),
      Math.round(wt * energyPerKg[1])
    ];

    return {
      wt,
      isInfant,
      energyPerKg,
      baseProteinPerKg,
      finalProteinPerKg,
      proteinAddOnPerKg,
      dextroseKcal,
      finalDailyEnergy,
      finalTotalProtein,
      cdrrNa,
      cdrrSalt
    };
  }, [calcAgeGroup, calcGender, calcWeight, calcCondition, calcPoorGrowth]);

  const ICMR_CONFLICTS_LIST = [
    {
      id: 'C1',
      title: 'Protein Intake (2x to 3x Discrepancy)',
      icmr: 'Table 1.6 recommends 46 g/day at 4-6 years, and 59 g/day at 7-9 years.',
      print: 'PRINT SDI sets protein at 0.85-0.95 g/kg/day (16-22 g/day for a 6yo girl; 19-28 g/day for a 7-8yo).',
      decision: 'PRINT SDI applies in CKD. High protein loads glomerular filtration; PRINT safe levels meet growth requirements without protein malnutrition or metabolic overload.',
      owner: 'Clinician / Pediatric Renal Dietitian'
    },
    {
      id: 'C2',
      title: 'Vegetables & Fruits vs Potassium Ceiling',
      icmr: 'Advises 400 g vegetables and 100 g fruit daily for all healthy children.',
      print: 'Many vegetables/fruits are rich in potassium. Potassium is restricted only upon documented serial hyperkalaemia (>=5.3 mmol/L).',
      decision: 'Replaced by potassium ceiling ONLY if child has documented serial hyperkalaemia (>=5.3 mmol/L). Do NOT eliminate produce by default; use portion control. Leaching requires dietitian sign-off to prevent severe water-soluble vitamin loss.',
      owner: 'Clinician / Dietitian'
    },
    {
      id: 'C3',
      title: 'Adult Potassium Balance Target',
      icmr: 'Guideline 11 states ~3,800 mg potassium/day to balance 5 g of sodium chloride.',
      print: 'Adult general population target. In CKD stages 4-5 and dialysis, 3,800 mg K/day can trigger life-threatening arrhythmia.',
      decision: 'Not used for paediatric renal patients. Stepwise potassium protocol applies; exclude non-dietary causes (ACEi, ARBs, acidosis, constipation) first.',
      owner: 'Pediatric Nephrologist'
    },
    {
      id: 'C4',
      title: 'Whole Grains & Phosphate Bioavailability',
      icmr: 'Recommends at least 50% cereals as whole grains and a 3:1 cereal to pulse ratio.',
      print: 'Whole grains and pulses carry phytate-bound phosphorus (20-50% absorbed; Polderman 2026 / PRINT course) and potassium. Inorganic additives in UPFs are 90-100% absorbed.',
      decision: 'Whole grains permitted within potassium/phosphate ceilings. Restrict inorganic additives first before restricting natural plant staples. Fibre shortfall accepted if needed to prevent malnutrition.',
      owner: 'Renal Dietitian'
    },
    {
      id: 'C5',
      title: 'Calcium from Dairy vs Potassium/Phosphate',
      icmr: 'Recommends 850-1050 mg calcium/day via 350-400 mL milk.',
      print: "Cow's milk brings high phosphate and potassium (~150 mg K / 100 mL). PRINT total calcium target is 100-200% of SDI.",
      decision: 'Meet calcium target first via non-dairy sources (plant milks, calcium-set tofu, fortified cereals) when phosphate is restricted. Calcium carbonate binders taken with meals; cap cow milk volume.',
      owner: 'Pediatric Nephrologist'
    },
    {
      id: 'C6',
      title: 'Cooking Water & Leaching Protocol',
      icmr: 'Advises cooking grains and pulses in minimal water and not draining to retain water-soluble vitamins.',
      print: 'Potassium leaching requires boiling cut vegetables/pulses in excess water and discarding cooking liquor.',
      decision: 'ICMR advice applies to healthy children. For hyperkalaemic children, leaching is indicated ONLY after registered dietitian sign-off, clearly acknowledging the vitamin-potassium trade-off (conflict C6).',
      owner: 'Dietitian / Caregiver'
    },
    {
      id: 'C7',
      title: 'Paediatric Sodium Intake',
      icmr: 'Gives a general flat limit of 5 g salt/day without paediatric age stratification.',
      print: 'Paediatric Chronic Disease Risk Reduction (CDRR) targets: 1-3y: 1.2g Na (3g salt); 4-6y: 1.5g Na (3.5g salt); 7-8y: 1.7g Na (4g salt); 9-13y: 2.0g Na; 14-18y: 2.3g Na. In nephrotic relapse: <1.2g Na.',
      decision: 'Age-specific paediatric CDRR targets apply. ICMR 5g salt is only a general upper ceiling.',
      owner: 'Pediatric Nephrology Team'
    },
    {
      id: 'C8',
      title: 'ORS & Electrolyte Solutions',
      icmr: 'Recommends standard WHO-ORS for all children during diarrhoea episodes.',
      print: 'Standard WHO-ORS contains significant potassium (~20 mmol/L) and sodium (~75 mmol/L).',
      decision: 'In CKD children, verify serum electrolytes before standard ORS administration. Prescribe customized low-potassium rehydration if oliguric or hyperkalaemic.',
      owner: 'Attending Clinician'
    },
    {
      id: 'C9',
      title: 'Baking Soda in Pulse & Vegetable Cooking',
      icmr: 'Explicitly warns against using baking soda (sodium bicarbonate) when cooking pulses/vegetables.',
      print: 'Sodium bicarbonate adds significant unmeasured hidden sodium and exacerbates hypertension/oedema.',
      decision: 'Full agreement. Strictly prohibit baking soda in food preparation; maintain no-added-salt principles during nephrotic relapse or fluid overload.',
      owner: 'Caregiver / Dietitian'
    },
    {
      id: 'C10',
      title: 'Commercial Protein Powders & Supplements',
      icmr: 'Cautions against protein supplements and overconsumption of isolated protein.',
      print: 'Protein powders overload kidneys. High-biological-value protein should be derived from dietary whole foods (milk, egg white, paneer, dals).',
      decision: 'Full agreement. Prohibit over-the-counter protein powders; reserve renal-specific modular formulas solely for documented faltering growth under specialist guidance.',
      owner: 'Pediatric Nephrologist'
    }
  ];

  const CLINICAL_PITFALLS = [
    'Restricting protein simply because the child has kidney disease (causes stunting and muscle wasting).',
    'Starting potassium restriction without confirmed serial hyperkalaemia (>=5.3 mmol/L).',
    'Focusing on natural phosphorus while ignoring inorganic phosphate additives on food labels.',
    'Imposing multiple simultaneous dietary restrictions resulting in severe caloric deficit and malnutrition.',
    'Ignoring longitudinal growth velocity and linear height age.',
    'Calculating nutritional targets using oedematous weight instead of dry weight.',
    'Handing parents numerical nutrient targets without translating them into daily cooked portion sizes.',
    'Overlooking treatable non-dietary causes of high potassium (medications, acidosis, constipation).',
    'Overly rigid meal plans that are culturally misaligned or unaffordable for the family.',
    'Failing to recalibrate dietary targets as the child grows, labs shift, or dialysis adequacy changes.'
  ];

  // Fetch logged meals for the selected date
  const { data: nutritionLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['nutritionLogs', selectedDate, activePatientCr],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/nutrition?cr_number=${encodeURIComponent(activePatientCr)}&date=${selectedDate}`);
        if (res.ok) return await res.json();
      } catch (e) {}
      const saved = localStorage.getItem('kc_nutrition_logs');
      return saved ? JSON.parse(saved).filter(m => m.date === selectedDate) : [];
    }
  });

  // Fetch Custom Diet Items
  const { data: customDietItems = [], refetch: refetchCustomItems } = useQuery({
    queryKey: ['customDietItems'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/nutrition/custom-items');
        if (res.ok) return await res.json();
      } catch (e) {}
      return [];
    }
  });

  // Fetch Patient Calculated Targets
  const { data: patientTargets } = useQuery({
    queryKey: ['patientTargets', activePatientCr],
    queryFn: async () => {
      try {
        const res = await fetch('/api/nutrition/calculate-targets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ age: 7, gender: 'Male', weight: 21.4, status: 'Relapse Watch' })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
      return null;
    }
  });

  // Filtered Food Table List & Consolidated Food Database
  const allFoods = useMemo(() => {
    return rawFoodTable?.foods || [];
  }, []);

  const allConsolidatedFoods = useMemo(() => {
    return consolidatedCatalog?.foods || [];
  }, []);

  const quickSuggestions = useMemo(() => {
    if (!quickSearchQuery || quickSearchQuery.trim().length < 1) return [];
    const q = quickSearchQuery.trim().toLowerCase();
    return allConsolidatedFoods
      .filter(f => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allConsolidatedFoods, quickSearchQuery]);

  const filteredConsolidatedFoods = useMemo(() => {
    return allConsolidatedFoods.filter(foodItem => {
      const matchesSearch = !foodSearchQuery || 
        foodItem.name.toLowerCase().includes(foodSearchQuery.toLowerCase()) ||
        foodItem.category.toLowerCase().includes(foodSearchQuery.toLowerCase());
      const matchesGuide = selectedGuideFilter === 'all' || 
        (foodItem.guides && foodItem.guides.includes(selectedGuideFilter));
      let matchesCat = true;
      if (selectedCategoryFilter !== 'all') {
        matchesCat = foodItem.potassium?.category === selectedCategoryFilter || 
                     foodItem.phosphate?.category === selectedCategoryFilter;
      }
      return matchesSearch && matchesGuide && matchesCat;
    });
  }, [allConsolidatedFoods, foodSearchQuery, selectedGuideFilter, selectedCategoryFilter]);

  // Filtered Renal Smart Swaps
  const filteredSwaps = useMemo(() => {
    return RENAL_SWAPS_CATALOG.filter(swap => {
      const q = swapsSearchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        swap.highRisk.nameEn.toLowerCase().includes(q) ||
        swap.highRisk.nameHi.includes(q) ||
        swap.safeSwap.nameEn.toLowerCase().includes(q) ||
        swap.safeSwap.nameHi.includes(q) ||
        swap.category.toLowerCase().includes(q);
      const matchesCat = swapsCategoryFilter === 'all' || swap.category === swapsCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [swapsSearchQuery, swapsCategoryFilter]);

  const handleApplyDoctorCode = (codeToApply) => {
    const raw = (codeToApply || doctorCodeInput || '').trim().toUpperCase();
    if (!raw) {
      setDoctorCodeError(hi ? 'कृपया डॉक्टर का कोड दर्ज करें' : 'Please enter a doctor plan code');
      return;
    }
    try {
      const plan = {
        code: raw,
        appliedAt: new Date().toISOString(),
        rawText: raw,
        ageYears: 7,
        gender: 'Male',
        weightKg: 21.4,
        energyLow: 1300,
        energyHigh: 1650,
        sodiumCeilingMg: 1200,
        fluidCeilingMl: 1200,
        potassiumRestricted: false,
        phosphateRestricted: false,
        leachingSignedOff: false,
        condition: 'ns_relapse'
      };

      raw.split('-').forEach(p => {
        if (p.endsWith('Y') && !isNaN(parseFloat(p))) plan.ageYears = parseFloat(p);
        if (p === 'M' || p === 'MALE') plan.gender = 'Male';
        if (p === 'F' || p === 'FEMALE') plan.gender = 'Female';
        if (p.startsWith('WT') && !isNaN(parseFloat(p.replace('WT', '')))) plan.weightKg = parseFloat(p.replace('WT', ''));
        if (p.startsWith('EL') && !isNaN(parseFloat(p.replace('EL', '')))) plan.energyLow = parseFloat(p.replace('EL', ''));
        if (p.startsWith('EH') && !isNaN(parseFloat(p.replace('EH', '')))) plan.energyHigh = parseFloat(p.replace('EH', ''));
        if (p.startsWith('NA') && !isNaN(parseFloat(p.replace('NA', '')))) plan.sodiumCeilingMg = parseFloat(p.replace('NA', ''));
        if (p.startsWith('FL') && !isNaN(parseFloat(p.replace('FL', '')))) plan.fluidCeilingMl = parseFloat(p.replace('FL', ''));
        if (p.includes('K_RESTRICT')) plan.potassiumRestricted = true;
        if (p.includes('P_RESTRICT')) plan.phosphateRestricted = true;
        if (p.includes('LEACH_OK')) plan.leachingSignedOff = true;
      });

      setActiveDoctorPlan(plan);
      localStorage.setItem('kc_doctor_plan', JSON.stringify(plan));
      if (plan.potassiumRestricted !== undefined) setIsPotassiumRestricted(plan.potassiumRestricted);
      if (plan.phosphateRestricted !== undefined) setIsPhosphateRestricted(plan.phosphateRestricted);
      if (plan.leachingSignedOff !== undefined) setIsLeachingSignedOff(plan.leachingSignedOff);
      setDoctorCodeError('');
      setShowDoctorCodeModal(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      setDoctorCodeError(hi ? 'कोड सही नहीं है। डॉक्टर से संपर्क करें।' : 'Invalid plan code format. Please verify with clinician.');
    }
  };

  // Live Database Calculation Engine for Portion Sizing (Calories, Protein, Minerals)
  const activeCalculatedNutrients = useMemo(() => {
    if (!portionModalFood) return null;
    const count = Number(portionCount) || 1;
    const singleUnitG = portionModalFood.single_unit_g || 100;
    const totalGrams = Math.round(count * singleUnitG);
    const cal100 = portionModalFood.nutrition_per_100g?.calories || 100;
    const prot100 = portionModalFood.nutrition_per_100g?.protein_g || 2.5;
    const na100 = portionModalFood.nutrition_per_100g?.sodium_mg || 50;

    const cal = Math.round((totalGrams / 100) * cal100);
    const prot = Number(((totalGrams / 100) * prot100).toFixed(1));
    const na = Math.round((totalGrams / 100) * na100);
    const k = Math.round((portionModalFood.potassium?.mg_portion || 80) * count);
    const p = Math.round((portionModalFood.phosphate?.mg_portion || 40) * count);
    const fl = portionModalFood.standard_portion_nutrients?.fluid_ml ? Math.round(portionModalFood.standard_portion_nutrients.fluid_ml * count) : 0;

    return { grams: totalGrams, cal, prot, na, k, p, fl };
  }, [portionModalFood, portionCount]);

  const handleConfirmPortion = () => {
    if (!portionModalFood || !activeCalculatedNutrients) return;
    const count = Number(portionCount) || 1;
    const unitName = portionModalFood.unit === 'piece' ? (count > 1 ? 'pieces' : 'piece') : portionModalFood.unit_label;
    const portionLabel = `${count} ${unitName} (${activeCalculatedNutrients.grams}g)`;
    const newItem = {
      foodId: portionModalFood.id,
      name: portionModalFood.name,
      portionLabel,
      count,
      ...activeCalculatedNutrients
    };
    setAddedMealItems(prev => [...prev, newItem]);
    setPortionModalFood(null);
    setQuickSearchQuery('');
    setShowSuggestions(false);
    setActiveTab('log');
  };

  // Sync meal log form totals whenever addedMealItems or addedSaltTsp changes
  useEffect(() => {
    if (addedMealItems.length === 0 && addedSaltNaMg === 0) return;
    const totalCal = addedMealItems.reduce((acc, i) => acc + (i.cal || 0), 0);
    const totalProt = addedMealItems.reduce((acc, i) => acc + (i.prot || 0), 0);
    const foodsNa = addedMealItems.reduce((acc, i) => acc + (i.na || 0), 0);
    const totalNa = foodsNa + addedSaltNaMg;
    const totalFluid = addedMealItems.reduce((acc, i) => acc + (i.fl || 0), 0);
    
    let textSummary = addedMealItems.map(i => `${i.name} (${i.portionLabel})`).join(', ');
    if (addedSaltTsp !== 'none') {
      const saltLabels = {
        pinch: '1 pinch salt (+0.5g)',
        quarter_tsp: '1/4 tsp salt (+1.25g)',
        half_tsp: '1/2 tsp salt (+2.5g)',
        one_tsp: '1 tsp salt (+5g)'
      };
      textSummary += (textSummary ? ' + ' : '') + saltLabels[addedSaltTsp];
    }

    setMealText(textSummary);
    setCaloriesEst(Math.round(totalCal).toString());
    setProteinEst(totalProt.toFixed(1));
    setSodiumEst(Math.round(totalNa).toString());
    setFluidMl(totalFluid > 0 ? totalFluid : 250);
    setSodiumLevel(totalNa > 400 ? 'High Salt' : totalNa > 140 ? 'Normal' : 'Low Salt');
  }, [addedMealItems, addedSaltNaMg, addedSaltTsp]);

  // Camera Management for Meal Scanner
  useEffect(() => {
    if (showImageScannerModal && cameraActive) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn('Camera error:', err);
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
  }, [showImageScannerModal, cameraActive]);

  const snapMealPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedMealImage(dataUrl);
    setCameraActive(false);
    analyzeMealPhoto(dataUrl);
  };

  const handleMealFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCapturedMealImage(dataUrl);
      setCameraActive(false);
      analyzeMealPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyzeMealPhoto = async (dataUrl) => {
    setIsAnalyzingImage(true);
    try {
      const res = await fetch('/api/nutrition/scan-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: dataUrl })
      });
      if (res.ok) {
        const json = await res.json();
        setAnalyzedPlateInfo(json.analysis);
        setMealImageUrl(json.image_url);
        if (json.analysis?.boxes?.length) {
          const initSelections = {};
          json.analysis.boxes.forEach((_, idx) => {
            initSelections[idx] = 0; // select rank 0 (top candidate)
          });
          setBoxSelections(initSelections);
          setSelectedBoxIndex(0);
        }
      }
    } catch (err) {
      console.warn('Scan analysis fallback:', err);
      // Fallback plate analysis with boxes
      const fallbackAnalysis = {
        detected_label: 'Indian Lunch Plate (थाली)',
        plate_type: 'multi_item_thaali',
        food_items: 'Moong Dal (150g), 2 Phulkas (60g), Lauki Sabzi (100g), Fresh Curd (75g)',
        sodium_level: 'Low Salt',
        fluid_ml: 270,
        calories: 354,
        protein_g: 16.0,
        sodium_mg: 100,
        stage1_gate: { is_food: true, is_food_score: 0.98, latency_ms: 45, passed: true },
        boxes: [
          {
            box_id: 'box_1',
            label: 'Moong Dal, cooked',
            box: [12, 10, 42, 42],
            coarse_family: 'Dal / Pulses',
            top_k: [
              { dish_name: 'Moong Dal, cooked', ifct_code: 'IFCT:B010', confidence: 0.89, portion_default: '1 katori_medium (150 g)', calories: 112, protein_g: 7.2, potassium_mg: 245, sodium_mg: 35, fluid_ml: 120 },
              { dish_name: 'Toor Dal, cooked', ifct_code: 'IFCT:B021', confidence: 0.68, portion_default: '1 katori_medium (150 g)', calories: 120, protein_g: 6.8, potassium_mg: 310, sodium_mg: 40, fluid_ml: 110 }
            ]
          },
          {
            box_id: 'box_2',
            label: 'Phulka / Roti (2 pcs)',
            box: [10, 54, 45, 42],
            coarse_family: 'Bread / Staple',
            top_k: [
              { dish_name: 'Whole Wheat Phulka / Roti', ifct_code: 'IFCT:A019', confidence: 0.92, portion_default: '2 pieces (60 g)', calories: 158, protein_g: 5.2, potassium_mg: 152, sodium_mg: 8, fluid_ml: 0 },
              { dish_name: 'Steamed Rice', ifct_code: 'IFCT:A015', confidence: 0.65, portion_default: '1 katori_medium (150 g)', calories: 175, protein_g: 3.9, potassium_mg: 48, sodium_mg: 3, fluid_ml: 0 }
            ]
          },
          {
            box_id: 'box_3',
            label: 'Lauki Sabzi (Bottle Gourd)',
            box: [56, 12, 40, 42],
            coarse_family: 'Vegetable / Sabzi',
            top_k: [
              { dish_name: 'Lauki / Bottle Gourd Sabzi', ifct_code: 'IFCT:D007', confidence: 0.86, portion_default: '1 katori_small (100 g)', calories: 38, protein_g: 1.2, potassium_mg: 124, sodium_mg: 22, fluid_ml: 85 }
            ]
          },
          {
            box_id: 'box_4',
            label: 'Fresh Curd / Dahi',
            box: [56, 54, 38, 40],
            coarse_family: 'Dairy / Fermented',
            top_k: [
              { dish_name: 'Fresh Cow Curd / Dahi', ifct_code: 'proxy:curd', confidence: 0.88, portion_default: '1/2 katori (75 g)', calories: 46, protein_g: 2.4, potassium_mg: 105, sodium_mg: 35, fluid_ml: 65 }
            ]
          }
        ]
      };
      setAnalyzedPlateInfo(fallbackAnalysis);
      setBoxSelections({ 0: 0, 1: 0, 2: 0, 3: 0 });
      setSelectedBoxIndex(0);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const applyPlateAnalysis = () => {
    if (!analyzedPlateInfo) return;
    if (analyzedPlateInfo.boxes && analyzedPlateInfo.boxes.length > 0) {
      const selectedItems = analyzedPlateInfo.boxes.map((b, bIdx) => {
        const selCandidateIdx = boxSelections[bIdx] || 0;
        const candidate = b.top_k[selCandidateIdx] || b.top_k[0];
        return {
          name: candidate.dish_name,
          portion: (candidate.portion_default || '1 serving').split(' (')[0],
          cal: candidate.calories || 0,
          prot: candidate.protein_g || 0,
          na: candidate.sodium_mg || 0,
          fl: candidate.fluid_ml || 0
        };
      });
      const namesStr = selectedItems.map(i => `${i.name} (${i.portion})`).join(', ');
      const totalCal = selectedItems.reduce((acc, i) => acc + (i.cal || 0), 0);
      const totalProt = selectedItems.reduce((acc, i) => acc + (i.prot || 0), 0);
      const totalNa = selectedItems.reduce((acc, i) => acc + (i.na || 0), 0);
      const totalFluid = selectedItems.reduce((acc, i) => acc + (i.fl || 0), 0);

      setMealText(namesStr);
      setSodiumLevel(totalNa > 140 ? 'High Salt' : 'Low Salt');
      setFluidMl(totalFluid || 250);
      setCaloriesEst(Math.round(totalCal).toString());
      setProteinEst(totalProt.toFixed(1));
      setSodiumEst(Math.round(totalNa).toString());
    } else {
      setMealText(analyzedPlateInfo.food_items);
      setSodiumLevel(analyzedPlateInfo.sodium_level || 'Low Salt');
      setFluidMl(analyzedPlateInfo.fluid_ml || 250);
      setCaloriesEst(analyzedPlateInfo.calories?.toString() || '');
      setProteinEst(analyzedPlateInfo.protein_g?.toString() || '');
      setSodiumEst(analyzedPlateInfo.sodium_mg?.toString() || '');
    }
    setShowImageScannerModal(false);
  };

  const handleStartVoiceLogging = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(hi ? 'आपके डिवाइस में वॉइस इनपुट सपोर्ट नहीं है। कृपया टाइप करें।' : 'Voice recognition is not supported on this device. Please type.');
      return;
    }
    if (isListeningVoice) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = hi ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningVoice(true);
        setVoiceTranscript(hi ? 'सुन रहे हैं... बोलिए...' : 'Listening... Speak your meal...');
      };

      recognition.onresult = async (event) => {
        const spokenText = event.results[0][0].transcript;
        setVoiceTranscript(spokenText);
        setIsListeningVoice(false);
        try {
          const res = await fetch('/api/nutrition/voice-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: spokenText })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.items && data.items.length) {
              const mappedItems = data.items.map(it => ({
                foodId: it.ifct_code || 'voice_item',
                name: it.dish_name,
                portionLabel: `${it.amount} ${it.unit} (${it.grams}g)`,
                count: it.amount,
                grams: it.grams,
                cal: it.calories,
                prot: it.protein_g,
                na: it.sodium_mg,
                k: it.potassium_mg,
                fl: it.fluid_ml
              }));
              setAddedMealItems(prev => [...prev, ...mappedItems]);
              setActiveTab('log');
            }
          }
        } catch (err) {
          console.warn('Voice parse API error:', err);
        }
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListeningVoice(false);
    }
  };

  const addFoodPill = (foodName, highRisk = false) => {
    setMealText(prev => (prev ? `${prev}, ${foodName}` : foodName));
    if (highRisk) {
      setSodiumLevel('High Salt');
    }
  };

  const handleSelectFromGuide = (foodItem, sourceEntry) => {
    const entryDesc = `${foodItem.food} (${sourceEntry.portion || '1 portion'})`;
    setMealText(prev => (prev ? `${prev}, ${entryDesc}` : entryDesc));
    if (sourceEntry.category_printed === 'High') {
      setSodiumLevel('High Salt');
    }
    setActiveTab('log');
  };

  const handleSaveMeal = async () => {
    if (!mealText.trim()) {
      alert(hi ? 'कृपया खाने का नाम दर्ज करें।' : 'Please enter or select food items.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      cr_number: activePatientCr || 'AIIMS/PED/2026/0412',
      patient_id: 'pat_aiims_001',
      date: selectedDate,
      meal_slot: selectedSlot,
      food_items: mealText,
      sodium_level: sodiumLevel,
      fluid_ml: fluidMl,
      calories: parseFloat(caloriesEst) || 0,
      protein_g: parseFloat(proteinEst) || 0,
      sodium_mg: parseFloat(sodiumEst) || (sodiumLevel === 'High Salt' ? 650 : 150),
      notes: mealNotes,
      image_url: mealImageUrl
    };

    try {
      await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      // Also cache locally
      const saved = localStorage.getItem('kc_nutrition_logs');
      const list = saved ? JSON.parse(saved) : [];
      list.unshift({ ...payload, id: Date.now() });
      localStorage.setItem('kc_nutrition_logs', JSON.stringify(list));

      refetchLogs();
      setShowSuccessToast(true);
      setMealText('');
      setMealNotes('');
      setMealImageUrl('');
      setCaloriesEst('');
      setProteinEst('');
      setSodiumEst('');
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (e) {
      console.error('Error logging meal:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomItem = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/nutrition/custom-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customItem)
      });
      if (res.ok) {
        setShowCustomModal(false);
        refetchCustomItems();
        setCustomItem({
          name: '',
          hindi_name: '',
          category: 'Grain',
          salt_level: 'Normal',
          sodium_mg: '120',
          fluid_ml: '150',
          calories: '140',
          protein_g: '4.5'
        });
      }
    } catch (err) {
      console.error('Failed to create custom item:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white px-4 pt-6 pb-6 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {!standalone ? (
              <Link
                to="/Dashboard"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Back to Dashboard"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </Link>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center text-xl shadow-inner">
                🥗
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  {isClinician ? 'Clinician Mode' : (hi ? 'अभिभावक मोड' : 'Caregiver Mode')}
                </span>
                <span className="text-xs text-emerald-100/80">AIIMS Patna</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-0.5 tracking-tight">
                {hi ? 'किडनीकेयर पोषण' : 'KidneyCare Nutrition'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => changeLanguage(hi ? 'en' : 'hi')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold backdrop-blur-sm cursor-pointer"
            >
              {hi ? '🇬🇧 English' : '🇮🇳 हिंदी'}
            </Button>
            {isClinician ? (
              <button
                type="button"
                onClick={() => setRole('caregiver')}
                className="bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-500/50 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {hi ? 'अभिभावक मोड' : 'Caregiver Mode'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const p = prompt(hi ? 'डॉक्टर मोड के लिए पिन (1234) दर्ज करें:' : 'Enter Clinician PIN (default: 1234):');
                  if (p === '1234') {
                    setRole('clinician');
                  } else if (p) {
                    alert('Incorrect PIN');
                  }
                }}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-sm cursor-pointer flex items-center gap-1"
              >
                <span>🔒</span>
                <span>{hi ? 'डॉक्टर' : 'Doctor'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Caregiver Simplified Patient & Limits Banner (No Jargon, Single Reconciled Limit) */}
        {!isClinician && (
          <div className="max-w-4xl mx-auto mt-3 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex flex-wrap items-center justify-between gap-3 text-white shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-emerald-200">Patient: Aarav Kumar (7y)</span>
                <Badge className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0">
                  Relapse Watch
                </Badge>
              </div>
              <p className="text-xs text-white/90 mt-0.5">
                Daily Sodium Limit: <strong className="text-amber-300 font-black">&lt; 1,200 mg Na</strong> (~3g salt / ½ tsp) • Fluid: <strong className="text-blue-200 font-bold">&lt; 1,200 mL</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDoctorCodeModal(true)}
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/50 flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span>🔗</span> {hi ? 'डॉक्टर का कोड' : "Doctor's Plan Code"}
              </button>
              <a
                href="/kidneycare_nutrition_app.html"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs"
              >
                <span>📱</span> {hi ? 'फुल ऐप (सेटअप)' : 'Standalone App'}
              </a>
            </div>
          </div>
        )}

        {/* Clinician Overview Strip (Visible only in Clinician Mode) */}
        {isClinician && (
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="bg-white/10 rounded-xl p-2 border border-white/10">
              <span className="text-[10px] text-emerald-100 uppercase tracking-wider font-semibold block">Energy SDI</span>
              <p className="text-sm sm:text-base font-black text-amber-300">
                {computedSdi.finalDailyEnergy[0]} – {computedSdi.finalDailyEnergy[1]}
              </p>
              <span className="text-[9px] text-emerald-100/70">kcal/day (50th centile)</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 border border-white/10">
              <span className="text-[10px] text-emerald-100 uppercase tracking-wider font-semibold block">Safe Protein SDI</span>
              <p className="text-sm sm:text-base font-black text-white">
                {computedSdi.finalTotalProtein[0]} – {computedSdi.finalTotalProtein[1]}
              </p>
              <span className="text-[9px] text-emerald-100/70">g/day (97.5% safe)</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 border border-white/10">
              <span className="text-[10px] text-emerald-100 uppercase tracking-wider font-semibold block">Sodium CDRR</span>
              <p className="text-sm sm:text-base font-black text-red-300">
                &lt; {computedSdi.cdrrNa} g
              </p>
              <span className="text-[9px] text-emerald-100/70">Na/day (~{computedSdi.cdrrSalt}g salt)</span>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-4 space-y-4">
        {/* Navigation Tabs (Adjusted for Caregiver vs Clinician) */}
        <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1 overflow-x-auto text-xs font-bold scrollbar-none shadow-inner">
          <button
            onClick={() => setActiveTab('log')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'log' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            {hi ? 'भोजन दर्ज करें' : 'Log Meal'}
          </button>
          <button
            onClick={() => setActiveTab('recall')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'recall' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {hi ? '24h आहार स्मरण' : '24h Recall'}
          </button>
          <button
            onClick={() => setActiveTab('meal_plan')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'meal_plan' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {hi ? 'आहार योजना (Plans)' : 'Meal Plans'}
          </button>
          <button
            onClick={() => setActiveTab('food_tables')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'food_tables' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {hi ? 'भारतीय खाद्य सूची (643)' : 'Indian Food Tables (643)'}
          </button>
          <button
            onClick={() => setActiveTab('swaps')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'swaps' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            <span>🔄</span>
            {hi ? 'सुरक्षित विकल्प (Swaps)' : 'Renal Smart Swaps'}
          </button>
          {isClinician && (
            <>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'calculator' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                {hi ? 'IFCT 2017 कैलकुलेटर' : 'IFCT 2017 Diet Calculator'}
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'custom' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                {hi ? 'कस्टम डाइट रेसिपी' : 'Custom Diet & Recipes'}
              </button>
              <button
                onClick={() => setActiveTab('targets')}
                className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'targets' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                {hi ? 'क्लीनिकल नियम व लक्ष्य' : 'PRINT SDI Targets'}
              </button>
            </>
          )}
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {showSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {hi ? 'भोजन सफलतापूर्वक सहेज लिया गया है!' : 'Meal logged successfully!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TAB 1: MEAL LOGGING WITH PHOTO SCANNING ── */}
        {activeTab === 'log' && (
          <div className="space-y-4">
            {/* Engine Switcher */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  {hi ? 'भोजन प्रविष्टि विधि:' : 'Meal logging mode:'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {loggerMode === 'autocalc'
                    ? (hi ? 'स्वचालित गणना (कोई अनुमान नहीं)' : 'Autocalc (no calorie guessing)')
                    : (hi ? 'त्वरित चिप्स व फोटो' : 'Quick chips & photo')}
                </span>
              </div>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setLoggerMode('autocalc')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    loggerMode === 'autocalc'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ {hi ? 'ऑटो-कैलकुलेशन इंजन' : 'Autocalc Engine'}
                </button>
                <button
                  type="button"
                  onClick={() => setLoggerMode('standard')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    loggerMode === 'standard'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📸 {hi ? 'फोटो व त्वरित चिप्स' : 'Photo & Quick Chips'}
                </button>
              </div>
            </div>

            {loggerMode === 'autocalc' ? (
              <AutocalcMealLogger
                patientCr={activePatientCr || 'AIIMS/PED/2026/0412'}
                onMealSaved={() => setShowSuccessToast(true)}
              />
            ) : (
              <>
            {/* Date & Meal Slot */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700">{hi ? 'तारीख चुनें:' : 'Date:'}</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 bg-slate-50"
                />
              </div>

              {/* Slot selector */}
              <div className="grid grid-cols-4 gap-1.5">
                {MEAL_SLOTS.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
                      selectedSlot === slot.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {slot.icon} {slot.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Food item description & Image Scanner Banner */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  {hi ? 'क्या खाया? (भोजन व मात्रा दर्ज करें)' : 'What did the child eat? (Foods & Portions)'}
                </Label>

                <div className="flex items-center gap-2">
                  {/* Voice Log Button */}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleStartVoiceLogging}
                    className={`${isListeningVoice ? 'bg-rose-600 hover:bg-rose-700 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-bold text-xs h-8 px-3 rounded-xl shadow-sm flex items-center gap-1.5`}
                  >
                    {isListeningVoice ? <MicOff className="w-3.5 h-3.5 animate-bounce" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isListeningVoice ? (hi ? 'सुन रहे हैं...' : 'Listening...') : (hi ? 'बोलकर दर्ज करें' : 'Voice Log')}</span>
                  </Button>

                  {/* Scan Meal Image Button */}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setShowImageScannerModal(true);
                      setCameraActive(true);
                      setCapturedMealImage(null);
                      setAnalyzedPlateInfo(null);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 px-3 rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{hi ? 'कैमरा से भोजन स्कैन करें' : 'Scan Meal Photo'}</span>
                  </Button>
                </div>
              </div>

              {/* Voice Listening / Transcript Indicator */}
              {(isListeningVoice || voiceTranscript) && (
                <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  isListeningVoice ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <div className="flex items-center gap-2 overflow-hidden">
                    {isListeningVoice ? (
                      <Mic className="w-4 h-4 text-rose-600 animate-pulse flex-shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
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

              {/* Quick Search & Auto-Suggest Food Bar */}
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    type="text"
                    placeholder={hi ? 'व्यंजन खोजें व मात्रा चुनें (उदा. डोसा, दाल, रोटी, खिचड़ी, दही, पोहा)...' : '🔍 Quick suggest & calculate: Type food (e.g. Dosa, Moong Dal, Roti, Idli, Curd)...'}
                    value={quickSearchQuery}
                    onChange={(e) => {
                      setQuickSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-9 h-10 rounded-xl text-xs bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 shadow-inner"
                  />
                  {quickSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickSearchQuery('');
                        setShowSuggestions(false);
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Auto-Suggest Dropdown */}
                {showSuggestions && quickSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto p-1.5 space-y-1">
                    <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
                      <span>Matching Indian Renal Foods ({quickSuggestions.length})</span>
                      <span className="text-emerald-700">Click to choose portion</span>
                    </div>
                    {quickSuggestions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setPortionModalFood(item);
                          setPortionCount(1);
                          setShowSuggestions(false);
                        }}
                        className="p-2 hover:bg-emerald-50 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{item.name}</span>
                            <span className="text-[10px] text-slate-500">({item.canonical_portion})</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{item.category}</span>
                            <span>·</span>
                            <span className="text-emerald-700 font-bold">{item.standard_portion_nutrients.calories} kcal</span>
                            <span>·</span>
                            <span className="text-slate-700 font-bold">{item.standard_portion_nutrients.protein_g}g prot</span>
                            <span>·</span>
                            <span>{item.potassium.range_str || `${item.potassium.mg_portion}mg K`}</span>
                          </div>
                        </div>
                        <Button size="sm" className="h-7 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 shrink-0">
                          + Portion
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Added Foods Pill List with Live Totals */}
              {addedMealItems.length > 0 && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                    <span>Items Added to Meal ({addedMealItems.length}):</span>
                    <button
                      type="button"
                      onClick={() => setAddedMealItems([])}
                      className="text-[10px] text-rose-600 hover:underline font-semibold"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {addedMealItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-emerald-300 px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-sm font-semibold text-slate-800"
                      >
                        <span>{item.name} ({item.portionLabel})</span>
                        <span className="text-[10px] text-emerald-700 font-bold">{item.cal} kcal</span>
                        <button
                          type="button"
                          onClick={() => setAddedMealItems(prev => prev.filter((_, i) => i !== idx))}
                          className="w-4 h-4 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 flex items-center justify-center text-[10px] ml-0.5"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Live Database Calculated Totals Strip */}
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] pt-1">
                    <div className="bg-white p-1.5 rounded-xl border border-emerald-200">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Total Energy</span>
                      <span className="font-black text-emerald-800">
                        {addedMealItems.reduce((acc, i) => acc + (i.cal || 0), 0)} kcal
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded-xl border border-emerald-200">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Total Protein</span>
                      <span className="font-black text-slate-800">
                        {addedMealItems.reduce((acc, i) => acc + (i.prot || 0), 0).toFixed(1)} g
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded-xl border border-emerald-200">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Potassium</span>
                      <span className="font-black text-slate-800">
                        {addedMealItems.reduce((acc, i) => acc + (i.k || 0), 0)} mg
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded-xl border border-emerald-200">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Sodium</span>
                      <span className="font-black text-slate-800">
                        {addedMealItems.reduce((acc, i) => acc + (i.na || 0), 0)} mg
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scanned Image Preview Thumbnail if attached */}
              {mealImageUrl && (
                <div className="flex items-center gap-3 p-2 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 overflow-hidden border border-indigo-300 shrink-0">
                    <img src={mealImageUrl} alt="Scanned Meal" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-bold text-indigo-950 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600" /> Meal Photo Attached
                    </p>
                    <p className="text-[10px] text-indigo-700 truncate">Image saved with this log</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMealImageUrl('')}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <textarea
                value={mealText}
                onChange={(e) => setMealText(e.target.value)}
                placeholder={hi ? 'उदा. मूँग दाल, 2 रोटी, लौकी सब्ज़ी, 1 गिलास पानी... या ऊपर त्वरित खोज से जोड़ें' : 'e.g. Moong dal (1 katori), 2 phulkas (roti), lauki sabzi (1/2 katori)... or use Quick Suggest above'}
                className="w-full h-24 p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none bg-slate-50"
              />

              {/* Quick staple pills */}
              <div>
                <p className="text-[11px] text-slate-500 font-semibold mb-1.5">
                  {hi ? 'जल्दी जोड़ने के लिए टैप करें (मात्रा व पोषण के साथ):' : 'Quick staples (Tap to pick portion & compute nutrients):'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Dosa', matchId: 'dosa' },
                    { name: 'Rava dosa', matchId: 'rava-dosa' },
                    { name: 'Moong Dal (मूँग दाल)', matchId: 'moong' },
                    { name: 'Roti / Phulka (रोटी)', matchId: 'roti' },
                    { name: 'Steamed Rice (चावल)', matchId: 'rice' },
                    { name: 'Lauki Sabzi (लौकी)', matchId: 'bottle-gourd' },
                    { name: 'Khichdi (खिचड़ी)', matchId: 'khichdi' },
                    { name: 'Curd / Dahi (दही)', matchId: 'curd' },
                    { name: 'Idli (इडली)', matchId: 'idli' },
                    { name: 'Papad (पापड़ ⚠️ High Salt)', highRisk: true },
                    { name: 'Pickle / Achaar (अचार ⚠️)', highRisk: true }
                  ].map((food) => (
                    <button
                      key={food.name}
                      type="button"
                      onClick={() => {
                        if (food.highRisk) {
                          addFoodPill(food.name, true);
                          return;
                        }
                        const found = allConsolidatedFoods.find(f => 
                          (food.matchId && f.id.includes(food.matchId)) || 
                          f.name.toLowerCase().includes(food.name.toLowerCase().split(' ')[0])
                        );
                        if (found) {
                          setPortionModalFood(found);
                          setPortionCount(1);
                        } else {
                          addFoodPill(food.name, false);
                        }
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        food.highRisk
                          ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 font-bold'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 font-medium'
                      }`}
                    >
                      + {food.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Added Salt & Fluid counter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Added Salt Selector (Replaces arbitrary sodium buckets with measured kitchen salt) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🧂</span>
                    {hi ? 'ऊपर से मिलाया गया नमक (Added Table Salt):' : 'Added Table Salt in Cooking / Plate:'}
                  </Label>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    +{addedSaltNaMg} mg Na
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'none', label: hi ? 'कोई नमक नहीं' : 'No Added Salt', desc: '0 mg Na (Relapse safe)', safe: true },
                    { id: 'pinch', label: hi ? '1 चुटकी' : '1 Pinch', desc: '~0.5g salt (+200 mg Na)' },
                    { id: 'quarter_tsp', label: hi ? '¼ छोटा चम्मच' : '¼ tsp', desc: '~1.25g salt (+500 mg Na)' },
                    { id: 'half_tsp', label: hi ? '½ छोटा चम्मच' : '½ tsp ⚠️', desc: '~2.5g salt (+1000 mg Na)', risk: true }
                  ].map((saltOpt) => (
                    <button
                      key={saltOpt.id}
                      type="button"
                      onClick={() => setAddedSaltTsp(saltOpt.id)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        addedSaltTsp === saltOpt.id
                          ? saltOpt.risk
                            ? 'border-red-500 bg-red-50 text-red-800 font-bold ring-2 ring-red-300'
                            : 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-2 ring-emerald-300'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold">{saltOpt.label}</div>
                      <div className="text-[9px] opacity-80">{saltOpt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fluid Counter */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    {hi ? 'तरल पदार्थ (Fluid Intake):' : 'Fluid Volume (Water, Milk, Dal):'}
                  </Label>
                  <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {fluidMl} mL
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {[100, 200, 250, 300, 500].map((vol) => (
                    <button
                      key={vol}
                      type="button"
                      onClick={() => setFluidMl(vol)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        fluidMl === vol
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {vol} mL
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Database-Driven Calculation Strip (Auto-Computed - No Caregiver Guessing) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-3.5 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  {hi ? 'इंजन द्वारा परिकलित पोषण (स्वचालित)' : 'Engine Calculated Meal Totals (Exact Database)'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {addedMealItems.length} {addedMealItems.length === 1 ? 'item' : 'items logged'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white/10 p-2 rounded-xl">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Energy</span>
                  <span className="text-sm font-black text-amber-300">
                    {addedMealItems.reduce((acc, i) => acc + (i.cal || 0), 0)} kcal
                  </span>
                </div>
                <div className="bg-white/10 p-2 rounded-xl">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Protein</span>
                  <span className="text-sm font-black text-emerald-300">
                    {addedMealItems.reduce((acc, i) => acc + (i.prot || 0), 0).toFixed(1)} g
                  </span>
                </div>
                <div className="bg-white/10 p-2 rounded-xl">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Sodium (Na)</span>
                  <span className="text-sm font-black text-red-300">
                    {addedMealItems.reduce((acc, i) => acc + (i.na || 0), 0) + addedSaltNaMg} mg
                  </span>
                </div>
                <div className="bg-white/10 p-2 rounded-xl">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Fluid</span>
                  <span className="text-sm font-black text-blue-300">
                    {fluidMl} mL
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveMeal}
              disabled={isSubmitting}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md text-sm"
            >
              {isSubmitting ? (hi ? 'सहेजा जा रहा है...' : 'Saving meal...') : (hi ? '✓ भोजन सहेजें' : '✓ Save Meal Log')}
            </Button>

            {/* Today's Logged Meals History */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                {hi ? `आज के दर्ज भोजन (${nutritionLogs.length})` : `Logged Meals for ${selectedDate} (${nutritionLogs.length})`}
              </h3>

              {nutritionLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  {hi ? 'आज के लिए कोई भोजन दर्ज नहीं है।' : 'No meals logged yet for this date.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {nutritionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border bg-slate-50 border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {log.image_url ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                            <img src={log.image_url} alt="Meal" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold shrink-0">
                            🍽️
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {log.meal_slot} · <span className="font-normal text-slate-700">{log.food_items}</span>
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {log.fluid_ml} mL fluid {log.calories ? `· ${log.calories} kcal` : ''} {log.protein_g ? `· ${log.protein_g}g protein` : ''}
                          </span>
                        </div>
                      </div>

                      <Badge
                        className={`text-[9px] font-bold ${
                          log.sodium_level === 'High Salt'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {log.sodium_level}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
            )}
          </div>
        )}

        {/* ── TAB: 24-HOUR DIETARY RECALL LOGGER ── */}
        {activeTab === 'recall' && (
          <RecallLogger
            patientProfile={{
              condition: calcCondition === 'ns_relapse' ? 'nephrotic_relapse' : calcCondition === 'hd' ? 'hemodialysis' : calcCondition === 'ckd_4_5' ? 'ckd_3_5' : 'nephrotic_remission',
              weightKg: parseFloat(calcWeight) || 21.4,
              heightCm: parseFloat(childHeightCm) || 118,
              dob: childDob
            }}
            onSaveRecall={() => setShowSuccessToast(true)}
          />
        )}

        {/* ── TAB: REGIONAL MEAL PLAN BUILDER ── */}
        {activeTab === 'meal_plan' && (
          <MealPlanBuilder
            patientProfile={{
              condition: calcCondition === 'ns_relapse' ? 'nephrotic_relapse' : calcCondition === 'hd' ? 'hemodialysis' : calcCondition === 'ckd_4_5' ? 'ckd_3_5' : 'nephrotic_remission',
              weightKg: parseFloat(calcWeight) || 21.4,
              heightCm: parseFloat(childHeightCm) || 118,
              dob: childDob
            }}
            onSavePlan={() => setShowSuccessToast(true)}
          />
        )}

        {/* ── TAB 2: INDIAN RENAL FOOD TABLES (643 FOODS) ── */}
        {activeTab === 'food_tables' && (
          <div className="space-y-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={foodSearchQuery}
                  onChange={(e) => setFoodSearchQuery(e.target.value)}
                  placeholder="Search 643 foods (e.g. Idli, Poha, Dal, Paneer, Lauki, Sattu, Apple, Makhana)..."
                  className="pl-9 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm focus:bg-white"
                />
              </div>

              {/* Guide Selector Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {GUIDES_META.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGuideFilter(g.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                      selectedGuideFilter === g.id
                        ? `${g.color} text-white shadow-sm border-transparent`
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Category Pill Filters */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-semibold">Category:</span>
                {['all', 'Lower', 'Moderate', 'High'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border transition-colors ${
                      selectedCategoryFilter === cat
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat === 'all' ? 'All Bands' : cat}
                  </button>
                ))}
                <span className="ml-auto text-[11px] text-slate-500 font-semibold">
                  Showing {filteredConsolidatedFoods.length} foods
                </span>
              </div>
            </div>

            {/* Consolidated Food Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredConsolidatedFoods.slice(0, 60).map((foodItem) => {
                const kBand = foodItem.potassium?.category || 'Standard';
                const pBand = foodItem.phosphate?.category || 'Standard';
                const cals = foodItem.standard_portion_nutrients?.calories ?? Math.round(((foodItem.single_unit_g || 100) / 100) * (foodItem.nutrition_per_100g?.calories || 120));
                const prot = foodItem.standard_portion_nutrients?.protein_g ?? Number((((foodItem.single_unit_g || 100) / 100) * (foodItem.nutrition_per_100g?.protein_g || 3.0)).toFixed(1));
                const sodium = foodItem.standard_portion_nutrients?.sodium_mg ?? Math.round(((foodItem.single_unit_g || 100) / 100) * (foodItem.nutrition_per_100g?.sodium_mg || 40));
                
                return (
                  <div
                    key={foodItem.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{foodItem.name}</h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {foodItem.category} • <span className="font-semibold text-slate-700">{foodItem.canonical_portion}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge
                            className={`text-[9px] px-1.5 py-0 font-bold ${
                              isPotassiumRestricted && kBand === 'High'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : kBand === 'High'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : kBand === 'Moderate'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            K: {kBand} {kBand === 'High' && !isPotassiumRestricted && '(Produce OK)'}
                          </Badge>
                          {pBand && (
                            <Badge
                              className={`text-[9px] px-1.5 py-0 font-bold ${
                                isPhosphateRestricted && pBand === 'High'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : pBand === 'High'
                                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                                  : pBand === 'Moderate'
                                  ? 'bg-orange-100 text-orange-800 border-orange-200'
                                  : 'bg-teal-100 text-teal-800 border-teal-200'
                              }`}
                            >
                              P: {pBand}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Nutrient summary pill strip */}
                      <div className="mt-2.5 grid grid-cols-4 gap-1 text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-200/60 text-center">
                        <div>
                          <span className="text-slate-400 block text-[9px] font-bold">ENERGY</span>
                          <span className="font-black text-slate-800">{cals} kcal</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] font-bold">PROTEIN</span>
                          <span className="font-black text-emerald-700">{prot} g</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] font-bold">POTASSIUM</span>
                          <span className="font-black text-indigo-700">{Math.round(foodItem.potassium?.mg_portion || 0)} mg</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] font-bold">SODIUM</span>
                          <span className="font-black text-slate-700">{sodium} mg</span>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">
                        {foodItem.id === 'idli'
                          ? 'South Indian Guide (2024): 238mg K (Ref range: 188–288mg)'
                          : `${foodItem.guides_count || (foodItem.guides ? foodItem.guides.length : 1)} clinical guide references`}
                      </span>
                      <button
                        onClick={() => {
                          setPortionModalFood(foodItem);
                          setPortionCount(foodItem.unit === 'piece' ? 2 : 1);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Select Portion
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredConsolidatedFoods.length > 60 && (
              <p className="text-xs text-slate-400 text-center py-2">
                Showing top 60 items. Use search or category filter to refine.
              </p>
            )}
          </div>
        )}

        {/* ── TAB: RENAL SMART SWAPS (HIGH-RISK TO KIDNEY-SAFE ALTERNATIVES) ── */}
        {activeTab === 'swaps' && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-4 rounded-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔄</span>
                    <h3 className="text-base font-black">
                      {hi ? 'किडनी-सुरक्षित स्मार्ट विकल्प (Renal Smart Swaps)' : 'Renal Smart Swaps: Cultural Indian Alternatives'}
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-100 mt-1 max-w-xl">
                    {hi
                      ? 'उच्च नमक, अकार्बनिक फॉस्फेट एडिटिव्स और अत्यधिक पोटेशियम वाले हानिकारक पैकेट बंद खाद्य पदार्थों की जगह ताज़ा, स्वादिष्ट व सुरक्षित घरेलू विकल्प।'
                      : 'Clinical guide replacing high-sodium snacks, UPF inorganic phosphate additives (INS 338-452), and excessive potassium with wholesome kidney-safe Indian staples.'}
                  </p>
                </div>
                <Badge className="bg-white/20 text-white text-[11px] font-bold border-white/30 shrink-0">
                  {filteredSwaps.length} Swaps Available
                </Badge>
              </div>

              {/* Search & Category Filter */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="relative col-span-2">
                  <Search className="w-4 h-4 text-emerald-200 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={swapsSearchQuery}
                    onChange={(e) => setSwapsSearchQuery(e.target.value)}
                    placeholder={hi ? 'स्नैक्स या विकल्प खोजें (उदा. नमकीन, मैगी, कोला, पापड़)...' : 'Search swaps (e.g. Namkeen, Maggi, Cola, Papad, Chips)...'}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white/10 text-white placeholder-emerald-100/70 border border-white/20 outline-none focus:bg-white/20"
                  />
                </div>
                <div>
                  <select
                    value={swapsCategoryFilter}
                    onChange={(e) => setSwapsCategoryFilter(e.target.value)}
                    className="w-full py-1.5 px-2.5 rounded-xl text-xs bg-emerald-800 text-white border border-white/20 outline-none font-semibold"
                  >
                    <option value="all">{hi ? 'सभी श्रेणियां (All Categories)' : 'All Categories'}</option>
                    <option value="Snacks">{hi ? 'स्नैक्स (Snacks)' : 'Snacks'}</option>
                    <option value="Beverages">{hi ? 'पेय पदार्थ (Beverages)' : 'Beverages'}</option>
                    <option value="Fast Food">{hi ? 'फ़ास्ट फ़ूड (Fast Food)' : 'Fast Food'}</option>
                    <option value="Condiments">{hi ? 'अचार व पापड़ (Condiments)' : 'Condiments'}</option>
                    <option value="Dairy">{hi ? 'डेयरी उत्पाद (Dairy)' : 'Dairy'}</option>
                    <option value="Prepared Meals">{hi ? 'सूप व तैयार भोजन' : 'Prepared Meals'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Swaps Grid */}
            <div className="grid grid-cols-1 gap-3.5">
              {filteredSwaps.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:border-emerald-300 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {hi ? item.categoryHi : item.category}
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      {item.highRisk.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                    {/* Left: High-Risk Food to Avoid */}
                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-rose-700 font-black text-xs">
                          <span>❌</span>
                          <span>{hi ? 'बचें / सीमित रखें (High Risk)' : 'Avoid or Strictly Limit'}</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mt-1">
                          {hi ? item.highRisk.nameHi : item.highRisk.nameEn}
                        </h4>
                        <span className="text-[11px] text-slate-500 block">
                          {hi ? item.highRisk.nameEn : item.highRisk.nameHi}
                        </span>

                        <p className="text-xs text-rose-800 font-semibold mt-2">
                          ⚠️ {hi ? item.highRisk.hazardHi : item.highRisk.hazard}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-medium">Sodium:</span>
                        <strong className="text-rose-700 font-bold">{item.highRisk.sodium}</strong>
                      </div>
                    </div>

                    {/* Right: Recommended Kidney-Safe Swap */}
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{hi ? 'सुरक्षित विकल्प (Renal-Safe Swap)' : 'Kidney-Safe Cultural Alternative'}</span>
                          </div>
                          <Badge className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0">
                            Recommended
                          </Badge>
                        </div>

                        <h4 className="text-sm font-black text-emerald-950 mt-1">
                          {hi ? item.safeSwap.nameHi : item.safeSwap.nameEn}
                        </h4>
                        <span className="text-[11px] text-emerald-700 block">
                          {hi ? item.safeSwap.nameEn : item.safeSwap.nameHi}
                        </span>

                        <p className="text-xs text-emerald-900 font-medium mt-2 leading-relaxed">
                          💡 {hi ? item.safeSwap.benefitHi : item.safeSwap.benefit}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                        <div className="text-[10px] text-slate-600 space-x-2">
                          <span>Na: <strong className="text-emerald-800 font-bold">{item.safeSwap.sodium}</strong></span>
                          <span>•</span>
                          <span>{item.safeSwap.cal}</span>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const found = allConsolidatedFoods.find(f => 
                              f.id.includes(item.safeSwap.foodMatch) || 
                              f.name.toLowerCase().includes(item.safeSwap.foodMatch)
                            );
                            if (found) {
                              setPortionModalFood(found);
                              setPortionCount(1);
                            } else {
                              addFoodPill(item.safeSwap.nameEn, false);
                              setActiveTab('log');
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-7 px-2.5 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{hi ? 'लॉग में जोड़ें' : 'Add to Log'}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: CUSTOM DIET & RECIPES ── */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            <CustomFoodEntry onSaveFood={() => {
              if (refetchCustomDietItems) refetchCustomDietItems();
              setShowSuccessToast(true);
            }} />

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {hi ? 'मेरी कस्टम रेसिपी व खाद्य सामग्री' : 'My Custom Renal Dishes & Recipes'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {hi
                    ? 'घर पर बनाए जाने वाले व्यंजन जोड़ें ताकि दैनिक लॉग में आसानी से चुन सकें।'
                    : 'Add home-cooked preparations and child-specific recipes to your quick-log list.'}
                </p>
              </div>
              <Button
                onClick={() => setShowCustomModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-10 px-4 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1" />
                {hi ? 'नया व्यंजन जोड़ें' : 'Add Custom Dish'}
              </Button>
            </div>

            {/* Custom items list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {customDietItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    {item.hindi_name && (
                      <span className="text-[11px] text-slate-500">{item.hindi_name}</span>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                      <span>{item.category}</span>
                      <span>·</span>
                      <span>{item.calories} kcal</span>
                      <span>·</span>
                      <span>{item.protein_g}g protein</span>
                      <span>·</span>
                      <span>{item.sodium_mg}mg Na</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      addFoodPill(item.name, item.high_risk);
                      setActiveTab('log');
                    }}
                    className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-bold"
                  >
                    + Log
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: CLINICAL TARGETS & PRINT SDI ENGINE (100% OFFLINE & INTERACTIVE) ── */}
        {activeTab === 'targets' && (
          <div className="space-y-4">
            {/* Top Sub-Navigation Header */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-0.5">
                      Spec v4 · PRINT 2026
                    </Badge>
                    <span className="text-xs text-slate-500 font-semibold">Pediatric Renal Nutrition Engine</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    PRINT Suggested Dietary Intake (SDI) Standards & Rules
                  </h3>
                  <p className="text-xs text-slate-600">
                    Evidence-based targets from RN4Kids PRINT Course (Modules 0–8), Polderman et al. 2026, and ICMR-NIN 2024 reconciliation.
                  </p>
                </div>

                {/* Sub-tab pills */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {[
                    { id: 'calculator', label: '🧮 Calculator', count: null },
                    { id: 'tables', label: '📊 Reference Tables', count: '17 Ages' },
                    { id: 'icmr_conflicts', label: '⚖️ ICMR Conflicts', count: 'C1–C10' },
                    { id: 'pitfalls', label: '⚠️ Clinical Pitfalls', count: '10' }
                  ].map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setSdiViewSubtab(sub.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                        sdiViewSubtab === sub.id
                          ? 'bg-white text-emerald-800 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{sub.label}</span>
                      {sub.count && (
                        <span className="text-[10px] bg-slate-200/80 px-1.5 py-0.2 rounded-full font-mono text-slate-700">
                          {sub.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SUBTAB 1: INTERACTIVE CALCULATOR ── */}
            {sdiViewSubtab === 'calculator' && (
              <div className="space-y-4">
                {/* Input Parameters Box */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-emerald-600" /> Patient Clinical Parameters
                    </h4>
                    <span className="text-[11px] text-slate-500 font-semibold">Adjust to compute exact requirements</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    {/* Age Bracket */}
                    <div>
                      <Label className="text-[11px] font-bold text-slate-700">Age Bracket</Label>
                      <select
                        value={calcAgeGroup}
                        onChange={(e) => setCalcAgeGroup(e.target.value)}
                        className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-semibold bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <optgroup label="Infancy">
                          <option value="0-3m">0–3 Months</option>
                          <option value="4-6m">4–6 Months</option>
                          <option value="7-11m">7–11 Months</option>
                          <option value="12m">12 Months (1 yr)</option>
                        </optgroup>
                        <optgroup label="Children & Adolescents">
                          <option value="2">2 Years</option>
                          <option value="3">3 Years</option>
                          <option value="4-6">4–6 Years</option>
                          <option value="7-8">7–8 Years</option>
                          <option value="9-10">9–10 Years</option>
                          <option value="11-12">11–12 Years</option>
                          <option value="13-14">13–14 Years</option>
                          <option value="15-17">15–17 Years</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Sex */}
                    <div>
                      <Label className="text-[11px] font-bold text-slate-700">Sex</Label>
                      <select
                        value={calcGender}
                        onChange={(e) => setCalcGender(e.target.value)}
                        className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-semibold bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="Male">Boy (Male)</option>
                        <option value="Female">Girl (Female)</option>
                      </select>
                    </div>

                    {/* Weight (Dry Weight) */}
                    <div>
                      <Label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>Dry Weight (kg)</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={calcWeight}
                        onChange={(e) => setCalcWeight(e.target.value)}
                        className="mt-1 h-9 font-semibold text-xs bg-slate-50"
                        placeholder="e.g. 21.4"
                      />
                    </div>

                    {/* Condition */}
                    <div className="col-span-2">
                      <Label className="text-[11px] font-bold text-slate-700">Clinical Condition & Cohort</Label>
                      <select
                        value={calcCondition}
                        onChange={(e) => setCalcCondition(e.target.value)}
                        className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-semibold bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="ns_relapse">Nephrotic Syndrome — Acute Relapse (Oedema / Protein 3+)</option>
                        <option value="ns_remission">Nephrotic Syndrome — Remission (Urine Nil/Trace 3d)</option>
                        <option value="ckd_2_3">CKD Stages 2–3 (Pre-dialysis, GFR 30–89 mL/min)</option>
                        <option value="ckd_4_5">CKD Stages 4–5 (Non-dialysis, GFR &lt; 30 mL/min)</option>
                        <option value="pd">Peritoneal Dialysis (PD) — Protein Loss + Dextrose</option>
                        <option value="hd">Hemodialysis (HD) — Dialytic Clearance + Fluid Control</option>
                      </select>
                    </div>
                  </div>

                  {/* Growth Status Toggle */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <input
                      type="checkbox"
                      id="growthToggle"
                      checked={calcPoorGrowth}
                      onChange={(e) => setCalcPoorGrowth(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="growthToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Poor linear growth velocity / stunting (Automatically targets upper end of energy SDI)
                    </label>
                  </div>
                </div>

                {/* Primary SDI Targets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Energy SDI Card */}
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200 rounded-2xl space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-600" /> PRINT Energy SDI
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                        {computedSdi.energyPerKg[0]} – {computedSdi.energyPerKg[1]} kcal/kg/day
                      </span>
                    </div>

                    <div className="pt-1">
                      <p className="text-2xl font-black text-amber-950">
                        {computedSdi.finalDailyEnergy[0]} – {computedSdi.finalDailyEnergy[1]} <span className="text-sm font-bold text-amber-800">kcal/day</span>
                      </p>
                      <p className="text-xs text-amber-900/80 mt-1 font-medium">
                        Based on 50th centile for age. {calcPoorGrowth ? '⚡ Aiming for upper bound due to growth faltering.' : 'Protects against protein-energy catabolism.'}
                      </p>
                    </div>

                    {computedSdi.dextroseKcal > 0 && (
                      <div className="p-2 bg-amber-100/70 border border-amber-200 rounded-xl text-[11px] text-amber-950 font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>PD Dextrose Calories: <strong>+{computedSdi.dextroseKcal} kcal/day</strong> absorbed from dialysate (7–9 kcal/kg/d per Polderman 2026).</span>
                      </div>
                    )}
                  </div>

                  {/* Protein SDI Card */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200 rounded-2xl space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-blue-600" /> PRINT Safe Protein SDI
                      </span>
                      <span className="text-xs font-mono font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md">
                        {computedSdi.finalProteinPerKg[0]} – {computedSdi.finalProteinPerKg[1]} g/kg/day
                      </span>
                    </div>

                    <div className="pt-1">
                      <p className="text-2xl font-black text-blue-950">
                        {computedSdi.finalTotalProtein[0]} – {computedSdi.finalTotalProtein[1]} <span className="text-sm font-bold text-blue-800">g/day</span>
                      </p>
                      <p className="text-xs text-blue-900/80 mt-1 font-medium">
                        Meets the safe metabolic and growth needs of 97.5% of children (PRINT 2026 Safe Dietary Intake).
                      </p>
                    </div>

                    {computedSdi.proteinAddOnPerKg > 0 && (
                      <div className="p-2 bg-blue-100/70 border border-blue-200 rounded-xl text-[11px] text-blue-950 font-semibold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span>Dialysis add-on applied: <strong>+{computedSdi.proteinAddOnPerKg} g/kg/day</strong> to replace peritoneal/hemodialysis losses.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Cards: Sodium, Fluid, Potassium, Phosphate, Calcium, Fibre */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Sodium & Salt */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                        🧂 Sodium & Salt Guidance (CDRR)
                      </h5>
                      <Badge variant="outline" className="text-[10px] font-bold text-slate-700">
                        {computedSdi.cdrrNa}g Na (~{computedSdi.cdrrSalt}g Salt)
                      </Badge>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {calcCondition === 'ns_relapse'
                        ? '🚨 Acute Relapse: No-added-salt cooking (<1,200 mg Na/day). Eliminate namkeen, papad, pickles, and UPFs. Do NOT use potassium-based salt substitutes.'
                        : calcCondition === 'hd'
                        ? 'Restricted strictly to prevent excessive interdialytic weight gain (IDWG) and thirst between sessions.'
                        : 'Age-specific Chronic Disease Risk Reduction target. Restrict further in hypertension or albuminuria.'}
                    </p>
                  </div>

                  {/* Fluid Management */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-cyan-600" /> Fluid Intake Rule
                      </h5>
                      <Badge variant="outline" className="text-[10px] font-bold text-slate-700">
                        {calcCondition === 'hd' ? 'Strict Restriction' : calcCondition === 'pd' ? 'Flexible (UF)' : 'No Routine Restriction'}
                      </Badge>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {calcCondition === 'ns_relapse'
                        ? 'Do not restrict fluids automatically! Restrict only on nephrologist advice during severe oedema, oliguria, or symptomatic hyponatraemia.'
                        : calcCondition === 'hd'
                        ? 'Restrict to insensible losses + urine output to control interdialytic weight gain (<4% dry weight).'
                        : 'Normal hydration unless fluid overload or oliguria is present. Ensure adequate fluid to prevent pre-renal azotemia.'}
                    </p>
                  </div>

                  {/* Potassium Stepwise Approach */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                        🍌 Potassium 5-Step Protocol
                      </h5>
                      <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Restrict only if &gt;5.3 mmol/L
                      </Badge>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                      <li>Exclude non-dietary causes (ACEi, ARBs, acidosis, constipation).</li>
                      <li>Cut potassium additive foods (INS 508, 332) &amp; salt substitutes.</li>
                      <li>Eliminate high-potassium junk (chips, chocolate, fruit juices, coconut water).</li>
                      <li>Keep fruits, veg &amp; whole grains (leaching indicated only upon dietitian sign-off).</li>
                      <li>Initiate binders (SZC) if dietary control is inadequate.</li>
                    </ol>
                  </div>

                  {/* Phosphate Bioavailability */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                        🥛 Phosphate Absorption Tiers (Polderman 2026 &amp; PRINT Course)
                      </h5>
                      <Badge className="bg-purple-100 text-purple-800 text-[10px] font-bold">
                        Inorganic First
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      <div className="p-1.5 bg-red-50 rounded-lg border border-red-100">
                        <span className="block font-bold text-red-900">Inorganic UPFs</span>
                        <span className="font-extrabold text-red-700">90–100%</span>
                        <span className="text-[9px] text-slate-400 block">Fast absorption</span>
                      </div>
                      <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-100">
                        <span className="block font-bold text-amber-900">Animal Protein</span>
                        <span className="font-extrabold text-amber-700">40–70%</span>
                        <span className="text-[9px] text-slate-400 block">Organic phosphorus</span>
                      </div>
                      <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="block font-bold text-emerald-900">Plant / Phytate</span>
                        <span className="font-extrabold text-emerald-700">20–50%</span>
                        <span className="text-[9px] text-slate-400 block">Low bioavailability</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 pt-1">
                      Target inorganic phosphate additives on food labels (INS 338–452) first. Do not restrict wholesome plant proteins (dals, grains) prematurely.
                    </p>
                  </div>
                </div>

                {/* Calcium & Fibre Callout */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Calcium Target:</strong> 100–200% of SDI (utilize non-dairy sources like plant milks &amp; calcium-set tofu when phosphate restricted).</span>
                  </div>
                  <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                    Fibre: 8.3–14.2 g / 1000 kcal
                  </Badge>
                </div>

                {/* Share Prescribed Plan with Family (WhatsApp / Plan Code) */}
                <div className="p-4 bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-950 text-white rounded-2xl border border-indigo-400/30 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📲</span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                        Share Prescribed Plan with Family (Doctor's Code)
                      </h4>
                    </div>
                    <Badge className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5">
                      Caregiver Sync Ready
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    This encrypted/encoded plan code carries all age-specific SDI energy bounds, safe protein, sodium ceiling (&lt; {computedSdi.cdrrNa}g Na), fluid allowance, and active dietary restrictions directly to the family's phone without exposing clinical jargon.
                  </p>

                  {/* Generated Code Display Box */}
                  <div className="bg-black/40 border border-white/15 p-3 rounded-xl flex items-center justify-between gap-2 font-mono text-xs">
                    <span className="text-emerald-400 font-bold truncate">
                      {`KCPLAN-${calcAgeGroup}Y-${calcGender === 'Male' ? 'M' : 'F'}-WT${calcWeightKg}-EL${computedSdi.finalDailyEnergy[0]}-EH${computedSdi.finalDailyEnergy[1]}-NA${Math.round(computedSdi.cdrrNa * 1000)}-FL${computedSdi.fluidAllowance}${isPotassiumRestricted ? '-K_RESTRICT' : ''}${isPhosphateRestricted ? '-P_RESTRICT' : ''}${isLeachingSignedOff ? '-LEACH_OK' : ''}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const code = `KCPLAN-${calcAgeGroup}Y-${calcGender === 'Male' ? 'M' : 'F'}-WT${calcWeightKg}-EL${computedSdi.finalDailyEnergy[0]}-EH${computedSdi.finalDailyEnergy[1]}-NA${Math.round(computedSdi.cdrrNa * 1000)}-FL${computedSdi.fluidAllowance}${isPotassiumRestricted ? '-K_RESTRICT' : ''}${isPhosphateRestricted ? '-P_RESTRICT' : ''}${isLeachingSignedOff ? '-LEACH_OK' : ''}`;
                        navigator.clipboard?.writeText(code);
                        alert('Doctor plan code copied to clipboard!');
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold flex items-center gap-1 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `KidneyCare Nutrition Plan (AIIMS Patna)\nPatient: Aarav Kumar\nDoctor Plan Code: KCPLAN-${calcAgeGroup}Y-${calcGender === 'Male' ? 'M' : 'F'}-WT${calcWeightKg}-EL${computedSdi.finalDailyEnergy[0]}-EH${computedSdi.finalDailyEnergy[1]}-NA${Math.round(computedSdi.cdrrNa * 1000)}-FL${computedSdi.fluidAllowance}${isPotassiumRestricted ? '-K_RESTRICT' : ''}${isPhosphateRestricted ? '-P_RESTRICT' : ''}${isLeachingSignedOff ? '-LEACH_OK' : ''}\n\nPrescribed Limits:\n• Energy: ${computedSdi.finalDailyEnergy[0]} - ${computedSdi.finalDailyEnergy[1]} kcal/day\n• Protein: ${computedSdi.finalTotalProtein[0]} - ${computedSdi.finalTotalProtein[1]} g/day\n• Sodium Ceiling: < ${Math.round(computedSdi.cdrrNa * 1000)} mg Na/day (~3g salt / 1/2 tsp)\n• Fluid Allowance: < ${computedSdi.fluidAllowance} mL/day\n\nCaregiver: Open the KidneyCare app and tap "Doctor's Plan Code" to apply.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Plan via WhatsApp</span>
                    </a>

                    <a
                      href="/kidneycare_nutrition_app.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all flex items-center gap-1"
                    >
                      <span>📱</span>
                      <span>Open Standalone 6-Step App</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ── SUBTAB 2: COMPLETE PRINT SDI REFERENCE TABLES ── */}
            {sdiViewSubtab === 'tables' && (
              <div className="space-y-4">
                {/* Full Pediatric SDI Table */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Master PRINT Suggested Dietary Intake (SDI) Reference Table
                    </h4>
                    <p className="text-xs text-slate-500">
                      Standard values across all age brackets from infancy to adolescence (Pediatr Nephrol 2020 / Spec v4).
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2.5">Age Bracket</th>
                          <th className="p-2.5">Male Energy (kcal/kg/d)</th>
                          <th className="p-2.5">Female Energy (kcal/kg/d)</th>
                          <th className="p-2.5">Safe Protein (g/kg/d)</th>
                          <th className="p-2.5">Daily Protein (g/d)</th>
                          <th className="p-2.5">Sodium CDRR (g/d)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        <tr className="bg-slate-50/50">
                          <td className="p-2 font-bold text-indigo-700">Infant (Birth)</td>
                          <td className="p-2">93 – 107</td>
                          <td className="p-2">93 – 107</td>
                          <td className="p-2 font-bold">1.52 – 2.50</td>
                          <td className="p-2">8 – 12 g</td>
                          <td className="p-2">0.12 g (~0.3g salt)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-indigo-700">Infant (1–2m)</td>
                          <td className="p-2">93 – 120</td>
                          <td className="p-2">93 – 120</td>
                          <td className="p-2 font-bold">1.40 – 1.80</td>
                          <td className="p-2">8 – 12 g</td>
                          <td className="p-2">0.12 g</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td className="p-2 font-bold text-indigo-700">Infant (4–6m)</td>
                          <td className="p-2">82 – 98</td>
                          <td className="p-2">82 – 98</td>
                          <td className="p-2 font-bold">1.30 – 1.52</td>
                          <td className="p-2">9 – 13 g</td>
                          <td className="p-2">0.20 g (~0.5g salt)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-indigo-700">Infant (7–11m)</td>
                          <td className="p-2">72 – 82</td>
                          <td className="p-2">72 – 82</td>
                          <td className="p-2 font-bold">1.10 – 1.30</td>
                          <td className="p-2">9 – 15 g</td>
                          <td className="p-2">0.37 g (~0.9g salt)</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td className="p-2 font-bold text-emerald-700">2 Years</td>
                          <td className="p-2">81 – 95</td>
                          <td className="p-2">79 – 92</td>
                          <td className="p-2 font-bold">0.90 – 1.05</td>
                          <td className="p-2">11 – 15 g</td>
                          <td className="p-2">1.2 g (~3.0g salt)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-emerald-700">3 Years</td>
                          <td className="p-2">80 – 82</td>
                          <td className="p-2">76 – 77</td>
                          <td className="p-2 font-bold">0.90 – 1.05</td>
                          <td className="p-2">13 – 15 g</td>
                          <td className="p-2">1.2 g (~3.0g salt)</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td className="p-2 font-bold text-emerald-700">4 – 6 Years</td>
                          <td className="p-2 font-bold text-emerald-900">67 – 93</td>
                          <td className="p-2 font-bold text-emerald-900">64 – 90</td>
                          <td className="p-2 font-bold">0.85 – 0.95</td>
                          <td className="p-2 font-bold">16 – 22 g</td>
                          <td className="p-2">1.5 g (~3.5g salt)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-emerald-700">7 – 8 Years</td>
                          <td className="p-2 font-bold text-emerald-900">60 – 77</td>
                          <td className="p-2 font-bold text-emerald-900">56 – 75</td>
                          <td className="p-2 font-bold">0.90 – 0.95</td>
                          <td className="p-2 font-bold">19 – 28 g</td>
                          <td className="p-2">1.7 g (~4.0g salt)</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td className="p-2 font-bold text-emerald-700">9 – 10 Years</td>
                          <td className="p-2">55 – 69</td>
                          <td className="p-2">49 – 63</td>
                          <td className="p-2 font-bold">0.90 – 0.95</td>
                          <td className="p-2">26 – 40 g</td>
                          <td className="p-2">2.0 g (~5.0g salt)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-emerald-700">11 – 12 Years</td>
                          <td className="p-2">48 – 63</td>
                          <td className="p-2">43 – 57</td>
                          <td className="p-2 font-bold">0.90 – 0.95</td>
                          <td className="p-2">34 – 42 g</td>
                          <td className="p-2">2.0 g (~5.0g salt)</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td className="p-2 font-bold text-emerald-700">13 – 14 Years</td>
                          <td className="p-2">44 – 63</td>
                          <td className="p-2">39 – 50</td>
                          <td className="p-2 font-bold">0.80 – 0.90</td>
                          <td className="p-2">34 – 50 g</td>
                          <td className="p-2">2.3 g (~5.5g salt)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-emerald-700">15 – 17 Years</td>
                          <td className="p-2">40 – 55</td>
                          <td className="p-2">36 – 46</td>
                          <td className="p-2 font-bold">0.80 – 0.90</td>
                          <td className="p-2">45 – 65 g</td>
                          <td className="p-2">2.3 g (~5.5g salt)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Leaching & Cooking Technique Guide - Gated by Dietitian Sign-off (Spec Conflict C6) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      🍲 Indian Renal Leaching Protocol (Potassium Reduction)
                    </h4>
                    <Badge className={isLeachingSignedOff ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800 font-bold text-[10px]"}>
                      {isLeachingSignedOff ? "✓ Dietitian Signed Off" : "⚠️ Dietitian Sign-off Required"}
                    </Badge>
                  </div>

                  {!isLeachingSignedOff ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                      <p className="font-bold flex items-center gap-1 text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        Clinical Spec Conflict C6 Notice:
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        Double-boil leaching causes critical loss of water-soluble B-complex vitamins and vitamin C. Under AIIMS clinical guidelines, leaching advice is withheld from families until a registered renal dietitian has signed off on the specific food and vitamin supplementation plan.
                      </p>
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => setIsLeachingSignedOff(true)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Clinician / Dietitian Sign-off (Record Approval)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-600">
                        Double-boiling and soaking extract 30% to 50% of potassium from high-potassium tubers, dals, and vegetables without removing staples from the child's diet.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-indigo-700 block">Step 1: Chop Small</span>
                          <p className="text-slate-600 text-[11px] mt-1">Peel and slice potatoes, colocasia, or vegetables into small dice to maximize surface area.</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-indigo-700 block">Step 2: Warm Soak</span>
                          <p className="text-slate-600 text-[11px] mt-1">Soak in warm water for at least 2 hours (water volume at least 5 times the food volume).</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-indigo-700 block">Step 3: Boil in Excess</span>
                          <p className="text-slate-600 text-[11px] mt-1">Boil vigorously in a generous volume of water. Never use pressure cookers for leaching.</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-red-700 block">Step 4: Discard Water</span>
                          <p className="text-slate-600 text-[11px] mt-1">Drain and thoroughly discard all cooking liquid. Proceed to season with mild spices and no added salt.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── SUBTAB 3: ICMR-NIN 2024 CONFLICT REGISTER (C1–C10) ── */}
            {sdiViewSubtab === 'icmr_conflicts' && (
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      ⚖️ ICMR-NIN 2024 Integration &amp; Paediatric CKD Conflict Register
                    </h4>
                    <Badge className="bg-amber-100 text-amber-800 text-xs font-bold">
                      10 Registered Conflicts
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    ICMR-NIN 2024 guidelines describe healthy population diets. In pediatric renal disease, the CKD rule strictly overrides general population recommendations.
                  </p>
                </div>

                {/* Conflicts Accordion Cards */}
                <div className="space-y-2">
                  {ICMR_CONFLICTS_LIST.map((item) => {
                    const isExpanded = expandedConflictId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedConflictId(isExpanded ? null : item.id)}
                          className="w-full p-3.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Badge className="bg-slate-800 text-white font-mono text-xs px-2 py-0.5">
                              {item.id}
                            </Badge>
                            <span className="text-xs font-bold text-slate-900">{item.title}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-2 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl">
                                <span className="text-[10px] uppercase font-bold text-amber-900 block">
                                  ICMR-NIN 2024 General Rule
                                </span>
                                <p className="text-amber-950 font-medium text-[11px] mt-0.5">{item.icmr}</p>
                              </div>
                              <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl">
                                <span className="text-[10px] uppercase font-bold text-blue-900 block">
                                  Pediatric Renal Standard (PRINT SDI)
                                </span>
                                <p className="text-blue-950 font-medium text-[11px] mt-0.5">{item.print}</p>
                              </div>
                            </div>

                            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                              <span className="text-[10px] uppercase font-bold text-emerald-900 block">
                                Clinical Decision &amp; Resolution
                              </span>
                              <p className="text-emerald-950 font-semibold text-[11px] mt-0.5">{item.decision}</p>
                              <div className="text-[10px] text-emerald-700 mt-1 font-mono">
                                Owner: {item.owner}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Consensus Agreement Points */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4 text-emerald-600" /> Points of Full Agreement (ICMR-NIN 2024 &amp; PRINT 2026)
                  </h5>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600 text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Avoid Ultra-Processed Foods (UPF) and high-fat-sugar-salt (HFSS) snacks.
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Strictly avoid commercial over-the-counter protein powders.
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Avoid tender coconut water during hyperkalaemia or oliguria.
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      No added salt or free sugar before age 1 year; no added sugar under 2 years.
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Prefer root vegetables (carrot, beetroot) over potassium-heavy tubers.
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Use steam or pressure cooking in preference to deep frying.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* ── SUBTAB 4: CLINICAL PITFALLS & PEARLS ── */}
            {sdiViewSubtab === 'pitfalls' && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5 text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> 10 Common Pediatric Renal Nutrition Pitfalls
                  </h4>
                  <p className="text-xs text-slate-500">
                    High-risk clinical errors identified across pediatric nephrology audits (PRINT Module 8 &amp; Spec v4).
                  </p>
                </div>

                <div className="space-y-2">
                  {CLINICAL_PITFALLS.map((pitfall, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 flex items-start gap-2.5 text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <p className="text-rose-950 font-semibold leading-relaxed pt-0.5">{pitfall}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: ICMR-NIN IFCT 2017 STANDALONE DIET CALCULATOR ── */}
        {activeTab === 'calculator' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>🧮 ICMR-NIN IFCT 2017 Diet Calculator &amp; FHIR Exporter</span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">Spec v4 Engine</Badge>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  548 foods, household measures (katori, tsp, tbsp), phosphorus absorption tiers (Polderman 2026 / PRINT), and FHIR R5 NutritionIntake bundles.
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href="/diet-calculator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm shrink-0 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open Full Window ↗</span>
                </a>
              </div>
            </div>

            {/* Embedded Calculator Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[780px]">
              <iframe
                src="/kidneycare_diet_calculator.html"
                title="KidneyCare Diet Calculator"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL 1: SCAN MEAL IMAGE (SNAP-STYLE TWO-STAGE ANALYZER) ── */}
      <Dialog open={showImageScannerModal} onOpenChange={(open) => {
        setShowImageScannerModal(open);
        setCameraActive(open);
      }}>
        <DialogContent className="max-w-lg p-5 text-center max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center justify-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600" />
              {hi ? 'भोजन की फोटो स्कैन करें (Snap-Style AI)' : 'Snap-Style Food Logging / AI Plate Analyzer'}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-3 space-y-3">
            {cameraActive ? (
              <div className="relative w-full h-56 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-indigo-500 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-6 border-2 border-dashed border-emerald-400 rounded-xl pointer-events-none" />
                <div className="absolute bottom-2 inset-x-0 text-center">
                  <Button
                    type="button"
                    onClick={snapMealPhoto}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 px-4 rounded-full shadow-lg"
                  >
                    📸 Snap Photo
                  </Button>
                </div>
              </div>
            ) : capturedMealImage ? (
              <div className="relative w-full h-56 bg-slate-900 rounded-2xl overflow-hidden border border-slate-300">
                <img src={capturedMealImage} alt="Captured Meal" className="w-full h-full object-cover" />
                
                {/* Multi-Item Thaali Bounding Boxes */}
                {analyzedPlateInfo?.boxes?.map((b, bIdx) => {
                  const isSelected = selectedBoxIndex === bIdx;
                  const [top, left, width, height] = b.box;
                  return (
                    <div
                      key={b.box_id || bIdx}
                      onClick={() => setSelectedBoxIndex(bIdx)}
                      style={{ top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%` }}
                      className={`absolute border-2 rounded-xl cursor-pointer transition-all flex flex-col justify-between p-1 ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-500/25 ring-2 ring-emerald-300 shadow-lg'
                          : 'border-white/80 bg-black/20 hover:border-emerald-300'
                      }`}
                    >
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md self-start ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-black/70 text-white'
                      }`}>
                        {bIdx + 1}. {b.label.split(' (')[0]}
                      </span>
                      {isSelected && (
                        <span className="self-end bg-emerald-700/90 text-white text-[8px] font-bold px-1 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setCapturedMealImage(null);
                    setCameraActive(true);
                    setAnalyzedPlateInfo(null);
                  }}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full text-xs shadow z-10"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="p-6 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500">
                <Camera className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-xs font-semibold">Camera is idle</p>
                <div className="flex gap-2 mt-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCameraActive(true)}
                    className="bg-indigo-600 text-white font-bold text-xs"
                  >
                    Turn on Camera
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" /> Upload Image
                  </Button>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleMealFileUpload}
              className="hidden"
            />

            {/* AI Plate Analysis Progress */}
            {isAnalyzingImage && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-indigo-800">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>Stage 1 Gating &amp; Multi-Item Thaali Detection...</span>
              </div>
            )}

            {/* Stage 1 Gate Status */}
            {analyzedPlateInfo?.stage1_gate && !isAnalyzingImage && (
              <div className="flex items-center justify-between text-[11px] bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200 text-left">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Stage 1 Gate: Food Confirmed ({Math.round((analyzedPlateInfo.stage1_gate.is_food_score || 0.98) * 100)}% · {analyzedPlateInfo.stage1_gate.latency_ms || 48}ms)</span>
                </div>
                <Badge variant="outline" className="text-[9px] bg-white text-emerald-700 border-emerald-300">
                  INT8 On-Device
                </Badge>
              </div>
            )}

            {/* Stage 2 Multi-Item Thaali Candidate Review */}
            {analyzedPlateInfo?.boxes?.length > 0 && !isAnalyzingImage && (
              <div className="space-y-2.5 pt-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">
                    Detected Items ({analyzedPlateInfo.boxes.length} regions):
                  </span>
                  <span className="text-[10px] text-slate-500">Tap box or item to switch</span>
                </div>

                {/* Region Selector Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {analyzedPlateInfo.boxes.map((b, bIdx) => {
                    const isSel = selectedBoxIndex === bIdx;
                    const chosenIdx = boxSelections[bIdx] ?? 0;
                    const chosen = b.top_k[chosenIdx] || b.top_k[0];
                    return (
                      <button
                        key={bIdx}
                        type="button"
                        onClick={() => setSelectedBoxIndex(bIdx)}
                        className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-bold shrink-0 border transition-all ${
                          isSel
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-[9px] opacity-80 uppercase tracking-wider">{b.coarse_family}</div>
                        <div className="font-extrabold truncate max-w-[110px]">{chosen.dish_name}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Top-5 Candidates for Active Box */}
                {analyzedPlateInfo.boxes[selectedBoxIndex] && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">
                        Top Candidates for Box {selectedBoxIndex + 1} ({analyzedPlateInfo.boxes[selectedBoxIndex].coarse_family}):
                      </span>
                      <Badge variant="outline" className="text-[9px] bg-indigo-50 text-indigo-700 border-indigo-200">
                        Top-5 Retrieval
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      {analyzedPlateInfo.boxes[selectedBoxIndex].top_k.map((cand, cIdx) => {
                        const isChosen = (boxSelections[selectedBoxIndex] ?? 0) === cIdx;
                        return (
                          <div
                            key={cIdx}
                            onClick={() => setBoxSelections(prev => ({ ...prev, [selectedBoxIndex]: cIdx }))}
                            className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                              isChosen
                                ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-400'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{cand.dish_name}</span>
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                  {Math.round(cand.confidence * 100)}%
                                </span>
                                {cand.ifct_code && (
                                  <span className="text-[9px] text-slate-400">({cand.ifct_code})</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span>{cand.portion_default}</span>
                                <span>·</span>
                                <span>{cand.calories} kcal</span>
                                <span>·</span>
                                <span>{cand.protein_g}g prot</span>
                                <span>·</span>
                                <span className={cand.sodium_mg > 60 ? 'text-amber-700' : 'text-emerald-700'}>
                                  {cand.sodium_mg}mg Na
                                </span>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isChosen ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                            }`}>
                              {isChosen && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Combined Plate Summary Card */}
                <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                    <span>Combined Plate Intake:</span>
                    <span className="text-emerald-700 font-black">
                      {analyzedPlateInfo.boxes.reduce((acc, b, bIdx) => acc + (b.top_k[boxSelections[bIdx] || 0]?.calories || 0), 0)} kcal
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px] pt-1">
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-200">
                      <span className="text-slate-500 block">Protein</span>
                      <span className="font-bold text-slate-800">
                        {analyzedPlateInfo.boxes.reduce((acc, b, bIdx) => acc + (b.top_k[boxSelections[bIdx] || 0]?.protein_g || 0), 0).toFixed(1)}g
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-200">
                      <span className="text-slate-500 block">Sodium</span>
                      <span className="font-bold text-slate-800">
                        {analyzedPlateInfo.boxes.reduce((acc, b, bIdx) => acc + (b.top_k[boxSelections[bIdx] || 0]?.sodium_mg || 0), 0)}mg
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-200">
                      <span className="text-slate-500 block">Potassium</span>
                      <span className="font-bold text-slate-800">
                        {analyzedPlateInfo.boxes.reduce((acc, b, bIdx) => acc + (b.top_k[boxSelections[bIdx] || 0]?.potassium_mg || 0), 0)}mg
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-200">
                      <span className="text-slate-500 block">Fluid</span>
                      <span className="font-bold text-slate-800">
                        {analyzedPlateInfo.boxes.reduce((acc, b, bIdx) => acc + (b.top_k[boxSelections[bIdx] || 0]?.fluid_ml || 0), 0)}mL
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={applyPlateAnalysis}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirm &amp; Log {analyzedPlateInfo.boxes.length} Meal Items</span>
                  </Button>
                </div>

                {/* DPDP Act 2023 Shield */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-1 pt-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>DPDP Act 2023: On-device gating &amp; face anonymization. No biometric data collected.</span>
                </div>
              </div>
            )}

            {/* Quick-pick photo plate preset fallback when no camera */}
            {!capturedMealImage && (
              <div className="pt-2 border-t border-slate-100 text-left">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  Or quick-pick photo plate preset:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { name: 'Moong Dal + 2 Roti + Lauki', cal: 320, p: 12.5, f: 250 },
                    { name: 'Idli (2 pcs) + Milk', cal: 260, p: 8.5, f: 200 },
                    { name: 'Khichdi + Curd (Dahi)', cal: 290, p: 10, f: 200 },
                    { name: 'Poha + Roasted Makhana', cal: 210, p: 5.5, f: 150 }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAnalyzedPlateInfo({
                          detected_label: preset.name,
                          food_items: preset.name,
                          sodium_level: 'Low Salt',
                          fluid_ml: preset.f,
                          calories: preset.cal,
                          protein_g: preset.p,
                        sodium_mg: 95
                      });
                    }}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-[10px] text-slate-700 font-medium text-left truncate"
                  >
                    🍛 {preset.name}
                  </button>
                ))}
              </div>
            </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 2: CREATE CUSTOM DISH ── */}
      <Dialog open={showCustomModal} onOpenChange={setShowCustomModal}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              {hi ? 'नया कस्टम व्यंजन जोड़ें' : 'Create Custom Renal Dish'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCustomItem} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs font-semibold">Food / Dish Name (English)</Label>
              <Input
                value={customItem.name}
                onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                placeholder="e.g. Daliya Porridge, Moong Chilla"
                className="mt-1 h-9 text-xs"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Hindi Name (Optional)</Label>
              <Input
                value={customItem.hindi_name}
                onChange={(e) => setCustomItem({ ...customItem, hindi_name: e.target.value })}
                placeholder="उदा. दलिया, चीला"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-semibold">Category</Label>
                <select
                  value={customItem.category}
                  onChange={(e) => setCustomItem({ ...customItem, category: e.target.value })}
                  className="w-full mt-1 h-9 px-2 rounded-md border border-slate-200 text-xs bg-white"
                >
                  <option value="Grain">Grain / Roti</option>
                  <option value="Dal">Dal / Pulse</option>
                  <option value="Vegetable">Vegetable</option>
                  <option value="Dairy">Dairy / Milk</option>
                  <option value="Protein">Protein / Egg</option>
                  <option value="Fruit">Fruit</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Salt / Sodium Level</Label>
                <select
                  value={customItem.salt_level}
                  onChange={(e) => setCustomItem({ ...customItem, salt_level: e.target.value })}
                  className="w-full mt-1 h-9 px-2 rounded-md border border-slate-200 text-xs bg-white"
                >
                  <option value="Low Salt">Low Salt (&lt;100 mg)</option>
                  <option value="Normal">Normal (100-300 mg)</option>
                  <option value="High Salt">High Salt (&gt;300 mg) ⚠️</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <Label className="text-xs font-semibold">Sodium (mg)</Label>
                <Input
                  type="number"
                  value={customItem.sodium_mg}
                  onChange={(e) => setCustomItem({ ...customItem, sodium_mg: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Calories (kcal)</Label>
                <Input
                  type="number"
                  value={customItem.calories}
                  onChange={(e) => setCustomItem({ ...customItem, calories: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Protein (g)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={customItem.protein_g}
                  onChange={(e) => setCustomItem({ ...customItem, protein_g: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="mt-4 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setShowCustomModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                ✓ Save Recipe
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: DOCTOR'S PLAN CODE (CAREGIVER LOCK) ── */}
      <Dialog open={showDoctorCodeModal} onOpenChange={setShowDoctorCodeModal}>
        <DialogContent className="max-w-md p-5 bg-white rounded-2xl shadow-xl border border-slate-100">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="text-xl">🩺</span>
              <div>
                <DialogTitle className="text-base font-black text-slate-900">
                  {hi ? "डॉक्टर का पोषण प्लान कोड" : "Doctor's Nutrition Plan Code"}
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  {hi
                    ? "डॉक्टर या डायटीशियन द्वारा दिया गया कोड यहाँ डालें ताकि सीमाएं अपने आप सेट हो जाएं।"
                    : "Paste the code provided by AIIMS Patna paediatric nephrology team to lock patient targets."}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            {/* Input & Paste */}
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-1">
                {hi ? "प्लान कोड दर्ज करें:" : "Enter Plan Code:"}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={doctorCodeInput}
                  onChange={(e) => {
                    setDoctorCodeInput(e.target.value);
                    setDoctorCodeError('');
                  }}
                  placeholder="e.g. KCPLAN-7Y-M-WT21.4-EL90-EH110-NA1200-FL1200"
                  className="font-mono text-xs uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setDoctorCodeInput(text.trim());
                    } catch (e) {
                      // clipboard access blocked
                    }
                  }}
                  className="text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Paste
                </Button>
              </div>
              {doctorCodeError && (
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  ⚠️ {doctorCodeError}
                </p>
              )}
            </div>

            {/* Quick Sample Button */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span>{hi ? "परीक्षण हेतु उदाहरण कोड:" : "Try sample clinic code:"}</span>
              <button
                type="button"
                onClick={() => setDoctorCodeInput('KCPLAN-7Y-M-WT21.4-EL90-EH110-NA1200-FL1200')}
                className="text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
              >
                KCPLAN-7Y-M...
              </button>
            </div>

            {/* Currently Active Plan Badge if any */}
            {activeDoctorPlan && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {hi ? "वर्तमान में सक्रिय प्लान:" : "Currently Active Plan:"}
                  </span>
                  <Badge className="bg-emerald-600 text-white text-[9px] font-mono">
                    {activeDoctorPlan.code?.slice(0, 16)}...
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700 pt-1">
                  <span>Weight: <strong>{activeDoctorPlan.weightKg || 21.4} kg</strong></span>
                  <span>Sodium: <strong className="text-emerald-700">&lt; {activeDoctorPlan.sodiumCeilingMg || 1200} mg</strong></span>
                  <span>Fluid: <strong>&lt; {activeDoctorPlan.fluidCeilingMl || 1200} mL</strong></span>
                  <span>Energy: <strong>{activeDoctorPlan.energyLow || 1300}–{activeDoctorPlan.energyHigh || 1650} kcal</strong></span>
                </div>
              </div>
            )}

            <DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDoctorCodeModal(false)}
                className="text-xs font-semibold cursor-pointer"
              >
                {hi ? "रद्द करें" : "Cancel"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleApplyDoctorCode()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 rounded-xl shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                {hi ? "प्लान लागू करें" : "Apply Doctor's Plan"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 3: PORTION SELECTOR & DATABASE CALCULATION ENGINE ── */}
      <Dialog open={Boolean(portionModalFood)} onOpenChange={(open) => { if (!open) setPortionModalFood(null); }}>
        <DialogContent className="max-w-md p-5 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
          {portionModalFood && (
            <div>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {portionModalFood.category || 'Renal Food Item'}
                    </span>
                    <DialogTitle className="text-base font-black text-slate-900 mt-1 flex items-center gap-1.5">
                      🍽️ {portionModalFood.name}
                    </DialogTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Reference unit: 1 {portionModalFood.unit === 'piece' ? 'piece' : (portionModalFood.unit_label || 'serving')} ≈ {portionModalFood.single_unit_g || 100}g
                    </p>
                  </div>
                </div>
              </DialogHeader>

              {/* Portion Presets */}
              <div className="mt-4">
                <Label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Choose Portion Size:
                </Label>
                {portionModalFood.presets && portionModalFood.presets.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
                    {portionModalFood.presets.map((preset) => {
                      const isSelected = portionCount === preset.count;
                      return (
                        <button
                          key={preset.count}
                          type="button"
                          onClick={() => setPortionCount(preset.count)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <span>{preset.label}</span>
                          <span className={`text-[10px] font-normal ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {preset.grams}g
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Custom Stepper */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Quantity / Portions:</span>
                    <span className="text-[11px] text-slate-500">
                      {activeCalculatedNutrients ? `${activeCalculatedNutrients.grams} grams total weight` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPortionCount(prev => Math.max(0.5, Number((prev - (portionModalFood.unit === 'piece' ? 1 : 0.5)).toFixed(1))))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 shadow-2xs cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="0.25"
                      max="20"
                      step={portionModalFood.unit === 'piece' ? '1' : '0.5'}
                      value={portionCount}
                      onChange={(e) => setPortionCount(Math.max(0.25, parseFloat(e.target.value) || 1))}
                      className="w-14 text-center font-black text-sm bg-white border border-slate-300 rounded-lg py-1 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setPortionCount(prev => Number((prev + (portionModalFood.unit === 'piece' ? 1 : 0.5)).toFixed(1)))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-600 min-w-[45px]">
                      {portionModalFood.unit === 'piece' ? (portionCount > 1 ? 'pieces' : 'piece') : portionModalFood.unit_label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Database Calculation Engine Results */}
              {activeCalculatedNutrients && (
                <div className="mt-4 p-3.5 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Calculated Renal Nutrients ({activeCalculatedNutrients.grams}g)
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                      Database Verified
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white/90 rounded-lg border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] text-slate-500 font-semibold block">CALORIES</span>
                      <span className="text-sm font-black text-slate-900">{activeCalculatedNutrients.cal}</span>
                      <span className="text-[10px] text-slate-400"> kcal</span>
                    </div>
                    <div className="p-2 bg-white/90 rounded-lg border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] text-slate-500 font-semibold block">PROTEIN</span>
                      <span className="text-sm font-black text-emerald-700">{activeCalculatedNutrients.prot}</span>
                      <span className="text-[10px] text-slate-400"> g</span>
                    </div>
                    <div className="p-2 bg-white/90 rounded-lg border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] text-slate-500 font-semibold block">SODIUM</span>
                      <span className="text-sm font-black text-slate-700">{activeCalculatedNutrients.na}</span>
                      <span className="text-[10px] text-slate-400"> mg</span>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-white/90 rounded-lg border border-emerald-100 shadow-2xs flex items-center justify-between px-3">
                      <span className="text-[11px] font-bold text-slate-600">Potassium (K):</span>
                      <span className="text-xs font-black text-indigo-700">
                        {activeCalculatedNutrients.k} mg
                      </span>
                    </div>
                    <div className="p-2 bg-white/90 rounded-lg border border-emerald-100 shadow-2xs flex items-center justify-between px-3">
                      <span className="text-[11px] font-bold text-slate-600">Phosphate (P):</span>
                      <span className="text-xs font-black text-purple-700">
                        {activeCalculatedNutrients.p} mg
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPortionModalFood(null)}
                  className="text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmPortion}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add to Meal Log
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}