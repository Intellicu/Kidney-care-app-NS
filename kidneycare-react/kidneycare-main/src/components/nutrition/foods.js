/**
 * KidneyCare Nutrition Engine - Food Database (~90 IFCT-anchored items)
 * Sourced from ICMR-NIN IFCT 2017 & Dietary Guidelines for Indians 2024.
 * Nutrients per 100g raw edible portion.
 */

export const FOOD_DATABASE = [
  // ── CEREALS & GRAINS ──
  {
    id: 'cereal-wheat-atta',
    name: 'Wheat Flour / Atta (गेहूँ का आटा)',
    foodGroup: 'Cereals',
    per100g: { calories: 320, protein: 10.6, fat: 1.7, carbs: 64.9, fiber: 11.2, sodium: 8.0, potassium: 284, phosphorus: 315, water: 12.2 },
    defaultPortion: { label: '1 medium phulka (25g atta)', grams: 25 },
    portionOptions: [
      { label: '1 thin phulka (20g atta)', grams: 20 },
      { label: '1 medium phulka (25g atta)', grams: 25 },
      { label: '1 thick roti / paratha (35g atta)', grams: 35 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: false
  },
  {
    id: 'cereal-rice-raw',
    name: 'Rice, raw milled (चावल)',
    foodGroup: 'Cereals',
    per100g: { calories: 353, protein: 7.9, fat: 0.5, carbs: 78.2, fiber: 2.8, sodium: 5.0, potassium: 92, phosphorus: 140, water: 11.8 },
    defaultPortion: { label: '1 katori cooked rice (150g = ~50g raw)', grams: 50 },
    portionOptions: [
      { label: '½ katori cooked (75g = 25g raw)', grams: 25 },
      { label: '1 katori cooked (150g = 50g raw)', grams: 50 },
      { label: '1.5 katori cooked (225g = 75g raw)', grams: 75 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'cereal-poha',
    name: 'Poha / Beaten Rice (पोहा / चिउड़ा)',
    foodGroup: 'Cereals',
    per100g: { calories: 346, protein: 6.7, fat: 1.1, carbs: 77.1, fiber: 2.0, sodium: 7.0, potassium: 110, phosphorus: 145, water: 12.2 },
    defaultPortion: { label: '1 katori cooked (120g = ~40g dry)', grams: 40 },
    portionOptions: [
      { label: '½ katori (60g = 20g dry)', grams: 20 },
      { label: '1 katori (120g = 40g dry)', grams: 40 },
      { label: '1.5 katori (180g = 60g dry)', grams: 60 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'cereal-suji',
    name: 'Semolina / Suji / Rava (सूजी)',
    foodGroup: 'Cereals',
    per100g: { calories: 334, protein: 10.4, fat: 0.8, carbs: 70.8, fiber: 3.5, sodium: 6.0, potassium: 125, phosphorus: 130, water: 13.5 },
    defaultPortion: { label: '1 katori upma / halwa (150g = ~40g dry)', grams: 40 },
    portionOptions: [
      { label: '½ katori (75g = 20g dry)', grams: 20 },
      { label: '1 katori (150g = 40g dry)', grams: 40 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'cereal-murmura',
    name: 'Puffed Rice / Murmura (मुरमुरा)',
    foodGroup: 'Cereals',
    per100g: { calories: 325, protein: 6.5, fat: 0.1, carbs: 73.6, fiber: 1.5, sodium: 12.0, potassium: 85, phosphorus: 115, water: 14.5 },
    defaultPortion: { label: '1 small bowl (25g dry)', grams: 25 },
    portionOptions: [
      { label: '1 small bowl (25g)', grams: 25 },
      { label: '1 medium bowl (40g)', grams: 40 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'cereal-idli',
    name: 'Idli, steamed (इडली)',
    foodGroup: 'Cereals',
    per100g: { calories: 135, protein: 4.2, fat: 0.4, carbs: 28.5, fiber: 1.4, sodium: 85.0, potassium: 188, phosphorus: 120, water: 65.0 },
    defaultPortion: { label: '2 medium idlis (60g)', grams: 60 },
    portionOptions: [
      { label: '1 idli (30g)', grams: 30 },
      { label: '2 idlis (60g)', grams: 60 },
      { label: '3 idlis (90g)', grams: 90 },
      { label: '4 idlis (120g)', grams: 120 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: false
  },
  {
    id: 'cereal-dosa',
    name: 'Plain Dosa (सदा डोसा)',
    foodGroup: 'Cereals',
    per100g: { calories: 168, protein: 3.9, fat: 3.7, carbs: 29.8, fiber: 1.2, sodium: 110.0, potassium: 142, phosphorus: 95, water: 60.0 },
    defaultPortion: { label: '1 medium dosa (80g)', grams: 80 },
    portionOptions: [
      { label: '1 small dosa (50g)', grams: 50 },
      { label: '1 medium dosa (80g)', grams: 80 },
      { label: '1 large dosa (120g)', grams: 120 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: false
  },
  {
    id: 'cereal-khichdi',
    name: 'Moong Dal Khichdi, cooked (खिचड़ी)',
    foodGroup: 'Cereals',
    per100g: { calories: 118, protein: 3.8, fat: 2.1, carbs: 20.9, fiber: 1.8, sodium: 95.0, potassium: 145, phosphorus: 78, water: 71.0 },
    defaultPortion: { label: '1 standard katori (150g)', grams: 150 },
    portionOptions: [
      { label: '½ katori (75g)', grams: 75 },
      { label: '1 katori (150g)', grams: 150 },
      { label: '1.5 katori (225g)', grams: 225 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: false
  },
  {
    id: 'cereal-daliya',
    name: 'Wheat Broken / Daliya (दलिया)',
    foodGroup: 'Cereals',
    per100g: { calories: 318, protein: 9.8, fat: 1.4, carbs: 66.5, fiber: 8.5, sodium: 9.0, potassium: 240, phosphorus: 260, water: 12.5 },
    defaultPortion: { label: '1 katori cooked (150g = ~35g dry)', grams: 35 },
    portionOptions: [
      { label: '½ katori (18g dry)', grams: 18 },
      { label: '1 katori (35g dry)', grams: 35 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: false
  },
  {
    id: 'cereal-cornflakes',
    name: 'Cornflakes (कॉर्नफ्लेक्स)',
    foodGroup: 'Cereals',
    per100g: { calories: 365, protein: 7.2, fat: 0.8, carbs: 82.0, fiber: 2.5, sodium: 680.0, potassium: 120, phosphorus: 75, water: 4.5 },
    defaultPortion: { label: '1 bowl (30g)', grams: 30 },
    portionOptions: [
      { label: '1 small cup (20g)', grams: 20 },
      { label: '1 standard bowl (30g)', grams: 30 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },

  // ── PULSES & LEGUMES ──
  {
    id: 'pulse-moong-dal',
    name: 'Moong Dal, split yellow (मूँग दाल)',
    foodGroup: 'Pulses',
    per100g: { calories: 334, protein: 24.5, fat: 1.2, carbs: 56.3, fiber: 8.2, sodium: 18.0, potassium: 843, phosphorus: 326, water: 9.8 },
    defaultPortion: { label: '1 katori cooked dal (150g = ~30g raw)', grams: 30 },
    portionOptions: [
      { label: '½ katori (75g = 15g raw)', grams: 15 },
      { label: '1 katori (150g = 30g raw)', grams: 30 },
      { label: '1.5 katori (225g = 45g raw)', grams: 45 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: true
  },
  {
    id: 'pulse-arhar-dal',
    name: 'Red Gram / Arhar / Tur Dal (अरहर दाल)',
    foodGroup: 'Pulses',
    per100g: { calories: 330, protein: 22.3, fat: 1.5, carbs: 57.6, fiber: 9.1, sodium: 15.0, potassium: 1105, phosphorus: 310, water: 10.0 },
    defaultPortion: { label: '1 katori cooked dal (150g = ~30g raw)', grams: 30 },
    portionOptions: [
      { label: '½ katori (15g raw)', grams: 15 },
      { label: '1 katori (30g raw)', grams: 30 }
    ],
    pClass: 'plant', potassiumCategory: 'High', isFluid: true
  },
  {
    id: 'pulse-masoor-dal',
    name: 'Lentil / Masoor Dal (मसूर दाल)',
    foodGroup: 'Pulses',
    per100g: { calories: 322, protein: 24.4, fat: 0.7, carbs: 54.5, fiber: 7.9, sodium: 12.0, potassium: 780, phosphorus: 295, water: 10.5 },
    defaultPortion: { label: '1 katori cooked dal (150g = ~30g raw)', grams: 30 },
    portionOptions: [
      { label: '½ katori (15g raw)', grams: 15 },
      { label: '1 katori (30g raw)', grams: 30 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: true
  },
  {
    id: 'pulse-chana-dal',
    name: 'Bengal Gram / Chana Dal (चना दाल)',
    foodGroup: 'Pulses',
    per100g: { calories: 328, protein: 20.8, fat: 5.6, carbs: 48.6, fiber: 15.2, sodium: 22.0, potassium: 720, phosphorus: 340, water: 9.8 },
    defaultPortion: { label: '1 katori cooked dal (150g = ~30g raw)', grams: 30 },
    portionOptions: [
      { label: '½ katori (15g raw)', grams: 15 },
      { label: '1 katori (30g raw)', grams: 30 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: true
  },
  {
    id: 'pulse-roasted-chana',
    name: 'Roasted Bengal Gram / Bhuna Chana (भुना चना)',
    foodGroup: 'Pulses',
    per100g: { calories: 369, protein: 22.5, fat: 5.2, carbs: 58.1, fiber: 10.8, sodium: 28.0, potassium: 650, phosphorus: 310, water: 6.5 },
    defaultPortion: { label: '1 handful (30g)', grams: 30 },
    portionOptions: [
      { label: '1 small handful (15g)', grams: 15 },
      { label: '1 standard handful (30g)', grams: 30 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: false
  },
  {
    id: 'pulse-sattu',
    name: 'Sattu, roasted gram flour (सत्तू)',
    foodGroup: 'Pulses',
    per100g: { calories: 365, protein: 23.0, fat: 5.0, carbs: 57.0, fiber: 11.5, sodium: 25.0, potassium: 680, phosphorus: 330, water: 6.0 },
    defaultPortion: { label: '2 tablespoons (25g)', grams: 25 },
    portionOptions: [
      { label: '1 tablespoon (12g)', grams: 12 },
      { label: '2 tablespoons (25g)', grams: 25 },
      { label: '3 tablespoons (38g)', grams: 38 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: false
  },
  {
    id: 'pulse-makhana',
    name: 'Foxnuts / Makhana, roasted (मखाना)',
    foodGroup: 'Snacks',
    per100g: { calories: 347, protein: 9.7, fat: 0.1, carbs: 76.9, fiber: 7.6, sodium: 18.0, potassium: 120, phosphorus: 140, water: 8.5 },
    defaultPortion: { label: '1 katori roasted (15g)', grams: 15 },
    portionOptions: [
      { label: '1 small bowl (10g)', grams: 10 },
      { label: '1 katori (15g)', grams: 15 },
      { label: '1 large bowl (25g)', grams: 25 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },

  // ── RENAL-SAFE VEGETABLES (LOW-TO-MODERATE POTASSIUM) ──
  {
    id: 'veg-lauki',
    name: 'Bottle Gourd / Lauki / Ghiya (लौकी)',
    foodGroup: 'Vegetables',
    per100g: { calories: 14, protein: 0.6, fat: 0.1, carbs: 2.5, fiber: 0.6, sodium: 8.0, potassium: 87, phosphorus: 16, water: 96.1 },
    defaultPortion: { label: '1 katori cooked sabzi (150g = ~120g raw)', grams: 120 },
    portionOptions: [
      { label: '½ katori (60g raw)', grams: 60 },
      { label: '1 katori (120g raw)', grams: 120 },
      { label: '1.5 katori (180g raw)', grams: 180 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'veg-turai',
    name: 'Ridge Gourd / Turai / Torai (तुरई)',
    foodGroup: 'Vegetables',
    per100g: { calories: 17, protein: 0.5, fat: 0.1, carbs: 3.4, fiber: 0.8, sodium: 6.0, potassium: 98, phosphorus: 21, water: 95.2 },
    defaultPortion: { label: '1 katori cooked sabzi (120g raw)', grams: 120 },
    portionOptions: [
      { label: '½ katori (60g raw)', grams: 60 },
      { label: '1 katori (120g raw)', grams: 120 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'veg-tinda',
    name: 'Apple Gourd / Tinda (टिंडा)',
    foodGroup: 'Vegetables',
    per100g: { calories: 21, protein: 1.4, fat: 0.2, carbs: 3.4, fiber: 1.0, sodium: 7.0, potassium: 110, phosphorus: 24, water: 93.5 },
    defaultPortion: { label: '1 katori cooked sabzi (120g raw)', grams: 120 },
    portionOptions: [
      { label: '½ katori (60g raw)', grams: 60 },
      { label: '1 katori (120g raw)', grams: 120 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'veg-cabbage',
    name: 'Cabbage, green (पत्ता गोभी)',
    foodGroup: 'Vegetables',
    per100g: { calories: 27, protein: 1.8, fat: 0.1, carbs: 4.6, fiber: 2.8, sodium: 14.0, potassium: 170, phosphorus: 44, water: 91.9 },
    defaultPortion: { label: '1 katori cooked (100g raw)', grams: 100 },
    portionOptions: [
      { label: '½ katori (50g raw)', grams: 50 },
      { label: '1 katori (100g raw)', grams: 100 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'veg-cauliflower',
    name: 'Cauliflower (फूलगोभी)',
    foodGroup: 'Vegetables',
    per100g: { calories: 25, protein: 2.0, fat: 0.3, carbs: 3.5, fiber: 2.5, sodium: 21.0, potassium: 210, phosphorus: 48, water: 90.8 },
    defaultPortion: { label: '1 katori cooked (100g raw)', grams: 100 },
    portionOptions: [
      { label: '½ katori (50g raw)', grams: 50 },
      { label: '1 katori (100g raw)', grams: 100 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: false
  },
  {
    id: 'veg-cucumber',
    name: 'Cucumber / Kheera (खीरा)',
    foodGroup: 'Vegetables',
    per100g: { calories: 15, protein: 0.6, fat: 0.1, carbs: 2.5, fiber: 0.7, sodium: 4.0, potassium: 140, phosphorus: 24, water: 96.0 },
    defaultPortion: { label: '1 small cucumber (80g)', grams: 80 },
    portionOptions: [
      { label: '4-5 slices (40g)', grams: 40 },
      { label: '1 small cucumber (80g)', grams: 80 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'veg-bhindi',
    name: 'Ladies Finger / Bhindi / Okra (भिंडी)',
    foodGroup: 'Vegetables',
    per100g: { calories: 35, protein: 1.9, fat: 0.2, carbs: 6.4, fiber: 3.6, sodium: 6.0, potassium: 249, phosphorus: 56, water: 89.6 },
    defaultPortion: { label: '1 katori cooked (100g raw)', grams: 100 },
    portionOptions: [
      { label: '½ katori (50g raw)', grams: 50 },
      { label: '1 katori (100g raw)', grams: 100 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: false
  },
  {
    id: 'veg-carrot',
    name: 'Carrot, red / orange (गाजर)',
    foodGroup: 'Vegetables',
    per100g: { calories: 38, protein: 0.9, fat: 0.2, carbs: 8.1, fiber: 2.8, sodium: 35.0, potassium: 240, phosphorus: 30, water: 88.0 },
    defaultPortion: { label: '1 small carrot (60g)', grams: 60 },
    portionOptions: [
      { label: '½ small carrot (30g)', grams: 30 },
      { label: '1 small carrot (60g)', grams: 60 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: false
  },
  {
    id: 'veg-onion',
    name: 'Onion (प्याज़)',
    foodGroup: 'Vegetables',
    per100g: { calories: 40, protein: 1.2, fat: 0.1, carbs: 8.5, fiber: 1.7, sodium: 5.0, potassium: 157, phosphorus: 29, water: 89.0 },
    defaultPortion: { label: '½ medium onion (30g)', grams: 30 },
    portionOptions: [
      { label: '½ medium onion (30g)', grams: 30 },
      { label: '1 medium onion (60g)', grams: 60 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'veg-parwal',
    name: 'Pointed Gourd / Parwal / Potala (परवल)',
    foodGroup: 'Vegetables',
    per100g: { calories: 20, protein: 2.0, fat: 0.3, carbs: 2.2, fiber: 3.0, sodium: 4.0, potassium: 120, phosphorus: 40, water: 92.0 },
    defaultPortion: { label: '1 katori cooked (100g raw)', grams: 100 },
    portionOptions: [
      { label: '½ katori (50g raw)', grams: 50 },
      { label: '1 katori (100g raw)', grams: 100 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },

  // ── HIGH POTASSIUM VEGETABLES (CAUTION / LEACHING REQUIRED) ──
  {
    id: 'veg-potato',
    name: 'Potato, unpeeled/boiled (आलू ⚠️ High K)',
    foodGroup: 'Vegetables',
    per100g: { calories: 97, protein: 1.6, fat: 0.1, carbs: 22.7, fiber: 1.7, sodium: 11.0, potassium: 421, phosphorus: 40, water: 74.7 },
    defaultPortion: { label: '1 small potato (60g)', grams: 60 },
    portionOptions: [
      { label: '½ small potato (30g)', grams: 30 },
      { label: '1 small potato (60g)', grams: 60 }
    ],
    pClass: 'plant', potassiumCategory: 'High', isFluid: false
  },
  {
    id: 'veg-tomato',
    name: 'Tomato, red ripe (टमाटर)',
    foodGroup: 'Vegetables',
    per100g: { calories: 20, protein: 0.9, fat: 0.2, carbs: 3.6, fiber: 1.2, sodium: 12.0, potassium: 237, phosphorus: 24, water: 94.0 },
    defaultPortion: { label: '½ medium tomato in cooking (40g)', grams: 40 },
    portionOptions: [
      { label: '½ medium tomato (40g)', grams: 40 },
      { label: '1 medium tomato (80g)', grams: 80 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: false
  },
  {
    id: 'veg-spinach',
    name: 'Spinach / Palak (पालक ⚠️ High K)',
    foodGroup: 'Vegetables',
    per100g: { calories: 26, protein: 2.0, fat: 0.7, carbs: 2.9, fiber: 2.5, sodium: 58.0, potassium: 558, phosphorus: 49, water: 92.1 },
    defaultPortion: { label: '1 katori cooked (80g raw)', grams: 80 },
    portionOptions: [
      { label: '½ katori (40g raw)', grams: 40 },
      { label: '1 katori (80g raw)', grams: 80 }
    ],
    pClass: 'plant', potassiumCategory: 'High', isFluid: false
  },

  // ── FRUITS ──
  {
    id: 'fruit-apple',
    name: 'Apple (सेब)',
    foodGroup: 'Fruits',
    per100g: { calories: 59, protein: 0.3, fat: 0.2, carbs: 13.8, fiber: 2.4, sodium: 1.0, potassium: 107, phosphorus: 11, water: 84.4 },
    defaultPortion: { label: '1 small apple (100g)', grams: 100 },
    portionOptions: [
      { label: '½ small apple (50g)', grams: 50 },
      { label: '1 small apple (100g)', grams: 100 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'fruit-guava',
    name: 'Guava, white flesh (अमरूद)',
    foodGroup: 'Fruits',
    per100g: { calories: 51, protein: 0.9, fat: 0.3, carbs: 11.2, fiber: 5.2, sodium: 3.0, potassium: 180, phosphorus: 22, water: 85.0 },
    defaultPortion: { label: '1 medium guava (100g)', grams: 100 },
    portionOptions: [
      { label: '½ guava (50g)', grams: 50 },
      { label: '1 guava (100g)', grams: 100 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'fruit-papaya',
    name: 'Papaya, ripe (पपीता)',
    foodGroup: 'Fruits',
    per100g: { calories: 32, protein: 0.6, fat: 0.1, carbs: 7.2, fiber: 1.7, sodium: 6.0, potassium: 234, phosphorus: 14, water: 89.6 },
    defaultPortion: { label: '1 small slice (80g)', grams: 80 },
    portionOptions: [
      { label: '1 small slice (80g)', grams: 80 },
      { label: '1 cup cubes (140g)', grams: 140 }
    ],
    pClass: 'plant', potassiumCategory: 'Medium', isFluid: false
  },
  {
    id: 'fruit-banana',
    name: 'Banana, ripe (केला ⚠️ High K)',
    foodGroup: 'Fruits',
    per100g: { calories: 116, protein: 1.2, fat: 0.3, carbs: 27.2, fiber: 2.6, sodium: 1.0, potassium: 358, phosphorus: 26, water: 70.1 },
    defaultPortion: { label: '1 small banana (80g)', grams: 80 },
    portionOptions: [
      { label: '½ banana (40g)', grams: 40 },
      { label: '1 small banana (80g)', grams: 80 }
    ],
    pClass: 'plant', potassiumCategory: 'High', isFluid: false
  },

  // ── DAIRY & EGGS (HIGH BIOLOGICAL VALUE PROTEIN) ──
  {
    id: 'dairy-cow-milk',
    name: 'Cow Milk, boiled (गाय का दूध)',
    foodGroup: 'Dairy',
    per100g: { calories: 67, protein: 3.2, fat: 4.1, carbs: 4.4, fiber: 0, sodium: 49.0, potassium: 140, phosphorus: 92, water: 87.5 },
    defaultPortion: { label: '1 cup / glass (150 mL = 155g)', grams: 155 },
    portionOptions: [
      { label: '½ cup (75 mL)', grams: 77 },
      { label: '1 cup (150 mL)', grams: 155 },
      { label: '1 glass (200 mL)', grams: 206 }
    ],
    pClass: 'animal', potassiumCategory: 'Low', isFluid: true
  },
  {
    id: 'dairy-curd',
    name: 'Curd / Dahi, homemade cow milk (दही)',
    foodGroup: 'Dairy',
    per100g: { calories: 60, protein: 3.1, fat: 3.5, carbs: 4.0, fiber: 0, sodium: 40.0, potassium: 130, phosphorus: 88, water: 88.0 },
    defaultPortion: { label: '1 small katori (100g)', grams: 100 },
    portionOptions: [
      { label: '½ katori (50g)', grams: 50 },
      { label: '1 katori (100g)', grams: 100 }
    ],
    pClass: 'animal', potassiumCategory: 'Low', isFluid: true
  },
  {
    id: 'dairy-paneer',
    name: 'Paneer / Cottage Cheese (पनीर)',
    foodGroup: 'Dairy',
    per100g: { calories: 265, protein: 18.3, fat: 20.8, carbs: 1.2, fiber: 0, sodium: 25.0, potassium: 85, phosphorus: 260, water: 54.0 },
    defaultPortion: { label: '2 medium cubes (40g)', grams: 40 },
    portionOptions: [
      { label: '1 cube (20g)', grams: 20 },
      { label: '2 cubes (40g)', grams: 40 },
      { label: '3 cubes (60g)', grams: 60 }
    ],
    pClass: 'animal', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'dairy-egg-white',
    name: 'Egg White, boiled (अंडे का सफेद भाग)',
    foodGroup: 'Poultry',
    per100g: { calories: 52, protein: 10.9, fat: 0.2, carbs: 0.7, fiber: 0, sodium: 166.0, potassium: 163, phosphorus: 15, water: 87.6 },
    defaultPortion: { label: '1 egg white (33g)', grams: 33 },
    portionOptions: [
      { label: '1 egg white (33g)', grams: 33 },
      { label: '2 egg whites (66g)', grams: 66 }
    ],
    pClass: 'animal', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'dairy-egg-whole',
    name: 'Egg, whole boiled (उबला अंडा)',
    foodGroup: 'Poultry',
    per100g: { calories: 155, protein: 12.6, fat: 10.6, carbs: 1.1, fiber: 0, sodium: 124.0, potassium: 126, phosphorus: 198, water: 75.1 },
    defaultPortion: { label: '1 whole egg (50g)', grams: 50 },
    portionOptions: [
      { label: '½ egg (25g)', grams: 25 },
      { label: '1 whole egg (50g)', grams: 50 }
    ],
    pClass: 'animal', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'meat-fish-rohu',
    name: 'Rohu Fish, fresh water (रोहू मछली)',
    foodGroup: 'Fish',
    per100g: { calories: 97, protein: 19.8, fat: 1.3, carbs: 0, fiber: 0, sodium: 62.0, potassium: 280, phosphorus: 210, water: 76.5 },
    defaultPortion: { label: '1 piece curry fish (60g)', grams: 60 },
    portionOptions: [
      { label: '1 piece (60g)', grams: 60 },
      { label: '2 pieces (120g)', grams: 120 }
    ],
    pClass: 'animal', potassiumCategory: 'Medium', isFluid: false
  },
  {
    id: 'meat-chicken',
    name: 'Chicken Breast, boneless skinless (चिकन)',
    foodGroup: 'Poultry',
    per100g: { calories: 119, protein: 22.3, fat: 2.6, carbs: 0, fiber: 0, sodium: 58.0, potassium: 256, phosphorus: 190, water: 74.0 },
    defaultPortion: { label: '2 small pieces curry (60g)', grams: 60 },
    portionOptions: [
      { label: '1 piece (30g)', grams: 30 },
      { label: '2 pieces (60g)', grams: 60 }
    ],
    pClass: 'animal', potassiumCategory: 'Medium', isFluid: false
  },

  // ── OILS & FATS ──
  {
    id: 'fat-mustard-oil',
    name: 'Mustard Oil (सरसों का तेल)',
    foodGroup: 'Fats',
    per100g: { calories: 884, protein: 0, fat: 100, carbs: 0, fiber: 0, sodium: 0, potassium: 0, phosphorus: 0, water: 0 },
    defaultPortion: { label: '1 teaspoon (5g)', grams: 5 },
    portionOptions: [
      { label: '½ tsp (2.5g)', grams: 2.5 },
      { label: '1 tsp (5g)', grams: 5 },
      { label: '1 tbsp (15g)', grams: 15 }
    ],
    pClass: 'plant', potassiumCategory: 'Low', isFluid: false
  },
  {
    id: 'fat-ghee',
    name: 'Desi Ghee (शुद्ध घी)',
    foodGroup: 'Fats',
    per100g: { calories: 900, protein: 0, fat: 99.5, carbs: 0, fiber: 0, sodium: 0, potassium: 0, phosphorus: 0, water: 0.5 },
    defaultPortion: { label: '1 teaspoon (5g)', grams: 5 },
    portionOptions: [
      { label: '½ tsp (2.5g)', grams: 2.5 },
      { label: '1 tsp (5g)', grams: 5 }
    ],
    pClass: 'animal', potassiumCategory: 'Low', isFluid: false
  }
];
