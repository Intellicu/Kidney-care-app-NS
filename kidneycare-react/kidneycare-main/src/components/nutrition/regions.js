/**
 * KidneyCare Nutrition Engine - Regional Meal Templates (regions.js)
 * Covers North, West, East, and South Indian pediatric renal meal patterns.
 */

export const REGIONAL_TEMPLATES = {
  north: {
    id: 'north',
    nameEn: 'North India (उत्तर भारत)',
    nameHi: 'उत्तर भारत (बिहार / यूपी / दिल्ली / पंजाब)',
    description: 'Wheat, roti, yellow moong dal, seasonal gourds, curd & makhana.',
    staples: ['Roti / Phulka', 'Moong Dal', 'Steamed Rice', 'Lauki / Turai', 'Curd', 'Roasted Makhana'],
    slots: {
      breakfast: [
        { foodId: 'cereal-daliya', portionGrams: 35, note: 'Milk Daliya / Porridge (1 katori)' },
        { foodId: 'dairy-cow-milk', portionGrams: 155, note: 'Warm boiled milk (1 glass)' }
      ],
      lunch: [
        { foodId: 'cereal-wheat-atta', portionGrams: 50, note: '2 Phulkas (50g atta)' },
        { foodId: 'pulse-moong-dal', portionGrams: 30, note: 'Yellow Moong Dal (1 katori cooked)' },
        { foodId: 'veg-lauki', portionGrams: 120, note: 'Lauki Sabzi (1 katori cooked)' },
        { foodId: 'dairy-curd', portionGrams: 100, note: 'Fresh Dahi (1 small katori)' }
      ],
      evening_snack: [
        { foodId: 'pulse-makhana', portionGrams: 15, note: 'Roasted Makhana (1 katori)' },
        { foodId: 'fruit-apple', portionGrams: 80, note: 'Apple slices' }
      ],
      dinner: [
        { foodId: 'cereal-wheat-atta', portionGrams: 50, note: '2 Phulkas (50g atta)' },
        { foodId: 'cereal-rice-raw', portionGrams: 30, note: 'Steamed Rice (½ katori)' },
        { foodId: 'pulse-masoor-dal', portionGrams: 25, note: 'Masoor Dal (1 katori)' },
        { foodId: 'veg-turai', portionGrams: 100, note: 'Ridge Gourd / Turai Sabzi' }
      ]
    }
  },

  south: {
    id: 'south',
    nameEn: 'South India (दक्षिण भारत)',
    nameHi: 'दक्षिण भारत (तमिलनाडु / कर्नाटक / केरल / आंध्र)',
    description: 'Steamed idli, dosa, dilute sambar, cabbage poriyal, buttermilk & aval.',
    staples: ['Steamed Idli', 'Plain Dosa', 'Steamed Rice', 'Poriyal', 'Curd / Buttermilk', 'Poha'],
    slots: {
      breakfast: [
        { foodId: 'cereal-idli', portionGrams: 60, note: '2 Steamed Idlis (60g)' },
        { foodId: 'veg-tomato', portionGrams: 30, note: 'Mild Tomato Chutney' }
      ],
      lunch: [
        { foodId: 'cereal-rice-raw', portionGrams: 60, note: 'Steamed Ponni Rice (1 large katori)' },
        { foodId: 'pulse-arhar-dal', portionGrams: 20, note: 'Dilute Vegetable Sambar (lauki/carrot)' },
        { foodId: 'veg-cabbage', portionGrams: 100, note: 'Cabbage Poriyal (mild tadka)' },
        { foodId: 'dairy-curd', portionGrams: 100, note: 'Curd / Moru (1 katori)' }
      ],
      evening_snack: [
        { foodId: 'cereal-poha', portionGrams: 30, note: 'Roasted Aval / Poha with curry leaves' },
        { foodId: 'fruit-guava', portionGrams: 80, note: 'Fresh Guava' }
      ],
      dinner: [
        { foodId: 'cereal-dosa', portionGrams: 80, note: '1 Plain Dosa (80g)' },
        { foodId: 'pulse-moong-dal', portionGrams: 25, note: 'Lauki Kootu (moong dal base)' },
        { foodId: 'dairy-curd', portionGrams: 80, note: 'Dilute Buttermilk' }
      ]
    }
  },

  east: {
    id: 'east',
    nameEn: 'East India (पूर्वी भारत)',
    nameHi: 'पूर्वी भारत (बिहार / बंगाल / ओडिशा / असम)',
    description: 'Rice, sattu, yellow dal, parwal sabzi, rohu fish (if non-veg) & murmura.',
    staples: ['Steamed Rice', 'Roti', 'Moong Dal', 'Parwal / Jhinga', 'Sattu', 'Murmura Bhel'],
    slots: {
      breakfast: [
        { foodId: 'cereal-suji', portionGrams: 40, note: 'Suji Upma with mild vegetables' },
        { foodId: 'dairy-cow-milk', portionGrams: 155, note: 'Boiled cow milk (1 glass)' }
      ],
      lunch: [
        { foodId: 'cereal-rice-raw', portionGrams: 60, note: 'Steamed Rice (1 katori)' },
        { foodId: 'pulse-moong-dal', portionGrams: 30, note: 'Moong Dal (1 katori)' },
        { foodId: 'veg-parwal', portionGrams: 100, note: 'Parwal Sabzi (1 katori cooked)' },
        { foodId: 'dairy-curd', portionGrams: 80, note: 'Homemade Dahi' }
      ],
      evening_snack: [
        { foodId: 'cereal-murmura', portionGrams: 25, note: 'Murmura Bhel with diced cucumber' },
        { foodId: 'fruit-papaya', portionGrams: 80, note: 'Papaya slice' }
      ],
      dinner: [
        { foodId: 'cereal-wheat-atta', portionGrams: 50, note: '2 Phulkas (50g atta)' },
        { foodId: 'cereal-rice-raw', portionGrams: 30, note: 'Steamed Rice (½ katori)' },
        { foodId: 'veg-lauki', portionGrams: 100, note: 'Lauki Chana Dal preparation' }
      ]
    }
  },

  west: {
    id: 'west',
    nameEn: 'West India (पश्चिम भारत)',
    nameHi: 'पश्चिम भारत (महाराष्ट्र / गुजरात / राजस्थान)',
    description: 'Poha, khichdi, bhindi sabzi, roasted khakhra & mild curd.',
    staples: ['Poha', 'Phulka', 'Gujarati Dal', 'Bhindi', 'Khichdi', 'Khakhra'],
    slots: {
      breakfast: [
        { foodId: 'cereal-poha', portionGrams: 40, note: 'Vegetable Poha with roasted peanuts (1 katori)' },
        { foodId: 'dairy-cow-milk', portionGrams: 155, note: '1 glass milk' }
      ],
      lunch: [
        { foodId: 'cereal-wheat-atta', portionGrams: 50, note: '2 Phulkas (50g atta)' },
        { foodId: 'pulse-arhar-dal', portionGrams: 25, note: 'Mild Dal (1 katori)' },
        { foodId: 'veg-bhindi', portionGrams: 100, note: 'Bhindi Sabzi (1 katori cooked)' },
        { foodId: 'dairy-curd', portionGrams: 80, note: 'Fresh Dahi' }
      ],
      evening_snack: [
        { foodId: 'cereal-murmura', portionGrams: 25, note: 'Roasted Kurmura / Khakhra' },
        { foodId: 'fruit-apple', portionGrams: 80, note: 'Apple' }
      ],
      dinner: [
        { foodId: 'cereal-khichdi', portionGrams: 150, note: 'Moong Dal Khichdi (1 katori)' },
        { foodId: 'veg-turai', portionGrams: 80, note: 'Turai Sabzi' },
        { foodId: 'dairy-curd', portionGrams: 100, note: 'Light Buttermilk / Kadhi' }
      ]
    }
  }
};
