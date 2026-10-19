import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2, X, Search, ShieldCheck, AlertTriangle, BookOpen, HeartPulse, Droplets, Pill, Award, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LanguageProvider, useLanguage } from '../components/shared/LanguageContext';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

function speak(text, lang = 'hi') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  u.rate = 0.88;
  window.speechSynthesis.speak(u);
}

const CATEGORIES = [
  { key: 'all', emoji: '🌟', labelHi: 'सभी', labelEn: 'All' },
  { key: 'iap_faqs', emoji: '🇮🇳', labelHi: 'IAP 10 सवाल', labelEn: 'IAP FAQs' },
  { key: 'dipstick', emoji: '🧪', labelHi: 'मूत्र जांच', labelEn: 'Dipstick Guide' },
  { key: 'medications', emoji: '💊', labelHi: 'दवाइयाँ', labelEn: 'Meds & Steroids' },
  { key: 'diet', emoji: '🥗', labelHi: 'आहार व नमक', labelEn: 'Diet & Salt' },
  { key: 'emergency', emoji: '🚨', labelHi: 'चेतावनी संकेत', labelEn: 'Red Flags' },
];

const COMPREHENSIVE_EDUCATION_DATA = [
  // ── IAP OFFICIAL 10 FAQS ──
  {
    id: 'iap-q1',
    category: 'iap_faqs',
    badge: 'IAP FAQ #1',
    title_hi: 'नेफ्रोटिक सिंड्रोम क्या है और इसके क्या कारण हैं?',
    title_en: 'What is Nephrotic Syndrome and what causes it?',
    summary_hi: 'किडनी की छलनी जैसी बनावट से प्रोटीन का रिसाव, रक्त में एल्ब्यूमिन की कमी और चेहरे-शरीर पर सूजन।',
    summary_en: 'Kidney filters leaking large amounts of protein into urine, causing low blood albumin and body swelling.',
    content_hi: `नेफ्रोटिक सिंड्रोम बचपन की सबसे आम किडनी बीमारियों में से एक है। इसमें किडनी की छलनी जैसे छिद्रों (glomeruli) से असामान्य प्रतिरक्षा प्रणाली (immunity) के कारण भारी मात्रा में प्रोटीन (एल्ब्यूमिन) पेशाब में बह जाता है।

इसके तीन मुख्य लक्षण होते हैं:
1. सूजन: सबसे पहले आंखों के आसपास (सुबह के समय अधिक) और फिर पूरे शरीर, पेट व पैरों में।
2. पेशाब में भारी प्रोटीन (3+ या 4+) और खून में एल्ब्यूमिन का स्तर 3 g/dL से कम होना।
3. खून में कोलेस्ट्रॉल का उच्च स्तर (200 mg/dL से अधिक)।

कारण:
अधिकांश बच्चों (लगभग 90%) में इसका कोई स्पष्ट बाह्य कारण नहीं होता। यह शरीर की प्रतिरक्षा प्रणाली की क्षणिक गड़बड़ी के कारण होता है, जो अक्सर सामान्य सर्दी-जुकाम या हल्के संक्रमण से ट्रिगर हो जाता है।`,
    content_en: `Nephrotic syndrome is one of the most common kidney diseases in childhood. It affects the sieve-like pores in the kidneys wherein, due to abnormalities in the body's immune system, large amounts of protein leak into the urine.

Three hallmark characteristics:
1. Swelling (Edema): Initially appears around the eyes (especially in the morning) and subsequently spreads to feet, legs, and abdomen.
2. High urine protein (graded as 3+ or 4+) with low blood albumin (less than 3 g/dL).
3. High blood cholesterol levels (greater than 200 mg/dL).

Causes:
In a majority of children, there is no identifiable cause. It is believed to be caused by an abnormality in the immune system, frequently triggered by mild viral infections like a common cold.`
  },
  {
    id: 'iap-q2',
    category: 'iap_faqs',
    badge: 'IAP FAQ #2',
    title_hi: 'लक्षण और संभावित जटिलताएं क्या हैं?',
    title_en: 'What are the symptoms and complications of Nephrotic Syndrome?',
    summary_hi: 'आंखों के चारों ओर सूजन, पेशाब में कमी, छाती व पेट में संक्रमण का खतरा और खून के थक्के।',
    summary_en: 'Periorbital swelling, reduced urine output, infection susceptibility, and risk of blood clots.',
    content_hi: `लक्षण:
• आंखों के चारों तरफ सूजन, जो बिना इलाज के पेट (पेट फूलना), अंडकोष/जननांग और पैरों तक फैल सकती है।
• पेशाब की मात्रा में कमी।
• पेट में अत्यधिक पानी भरने से सांस लेने में कठिनाई हो सकती है।

जटिलताएं (Complications):
1. गंभीर संक्रमण: चूंकि सुरक्षात्मक प्रोटीन पेशाब में निकल जाते हैं, बच्चों में फेफड़ों का संक्रमण (निमोनिया) और पेट के तरल का संक्रमण (पेरिटोनाइटिस) होने का खतरा अधिक होता है।
2. रक्त के थक्के (Thrombosis): रक्त वाहिकाओं में थक्का जमने का खतरा बढ़ जाता है।
3. निम्न रक्तचाप (Low Blood Pressure): रक्त वाहिकाओं में तरल कम होने से चक्कर या कमजोरी।

चेतावनी: यदि बच्चे को तेज बुखार, पेट में असहनीय दर्द, सिरदर्द, उल्टी, या सांस लेने में परेशानी हो तो तुरंत अस्पताल जाएं।`,
    content_en: `Symptoms:
• Swelling starting around the eyes, progressing to abdomen, feet, and scrotum/genitals.
• Reduced urine volume.
• Excessive fluid buildup in abdomen causing breathing difficulty.

Complications:
1. Infections: Loss of immunoglobulins makes children susceptible to serious infections, especially peritonitis (infection of fluid in abdomen) and pneumonia.
2. Blood clots (Thrombosis): Increased clotting tendency in kidney, brain, or limb veins.
3. Low blood pressure and dehydration despite visible body swelling.

Urgent signs: High fever, severe abdominal pain, breathlessness, vomiting, or lethargy require immediate hospital attention.`
  },
  {
    id: 'iap-q3',
    category: 'iap_faqs',
    badge: 'IAP FAQ #3',
    title_hi: 'नेफ्रोटिक सिंड्रोम में कौन-कौन से टेस्ट जरूरी हैं?',
    title_en: 'What tests should be done for a child with Nephrotic Syndrome?',
    summary_hi: 'मूत्र डिपस्टिक टेस्ट (3+/4+), सीरम एल्ब्यूमिन, कोलेस्ट्रॉल, क्रिएटिनिन, यूरिया और मोंटौक्स टेस्ट।',
    summary_en: 'Urine dipstick protein (3+/4+), serum albumin, cholesterol, creatinine, urea, and Mantoux test.',
    content_hi: `प्राथमिक जांचें:
1. मूत्र प्रोटीन परीक्षण (Urine Protein Dipstick): सुबह के पहले पेशाब में पट्टी डालकर जांच। नेफ्रोटिक सिंड्रोम में यह 3+ या 4+ आता है।
2. खून में एल्ब्यूमिन: स्तर 3 g/dL से कम होता है।
3. खून में कोलेस्ट्रॉल: 200 mg/dL से अधिक होता है।
4. किडनी कार्यप्रणाली जांच (KFT): ब्लड यूरिया और सीरम क्रिएटिनिन (यह देखने के लिए कि किडनी का सामान्य कार्य ठीक है)।
5. पूर्ण रक्त गणना (CBC) व इलेक्ट्रोलाइट्स (सोडियम, पोटेशियम, कैल्शियम)।
6. मोंटौक्स टेस्ट (Mantoux Test): स्टेरॉयड शुरू करने से पहले टीबी (तपेदिक) संक्रमण की जांच के लिए अनिवार्य है।`,
    content_en: `Essential diagnostic tests:
1. Urine Dipstick Protein: Using first morning urine. Nephrotic syndrome typically shows heavy proteinuria (3+ or 4+).
2. Serum Albumin: Low levels (<3.0 g/dL).
3. Serum Cholesterol: Elevated (>200 mg/dL).
4. Kidney Function Tests: Blood urea and serum creatinine to confirm normal filtration.
5. Complete Blood Count (CBC) and serum electrolytes (sodium, potassium, calcium).
6. Mantoux Test: Performed before starting steroid therapy to screen for latent tuberculosis.`
  },
  {
    id: 'iap-q4',
    category: 'iap_faqs',
    badge: 'IAP FAQ #4',
    title_hi: 'क्या नेफ्रोटिक सिंड्रोम के अलग-अलग प्रकार होते हैं?',
    title_en: 'Are there different types of Nephrotic Syndrome in children?',
    summary_hi: 'मिनिमल चेंज डिजीज (MCD - 90% केस, स्टेरॉयड से ठीक होने वाला) बनाम स्टेरॉयड-रेसिस्टेंट (SRNS)।',
    summary_en: 'Minimal Change Disease (MCD - 90%, steroid-responsive) vs Steroid-Resistant Nephrotic Syndrome (SRNS).',
    content_hi: `हां, बच्चों में इसके विभिन्न प्रकार होते हैं:

1. मिनिमल चेंज डिजीज (MCD):
• लगभग 90% मामलों में 2 से 6 वर्ष की आयु के बीच होता है।
• इसमें पेशाब में खून नहीं आता, बीपी सामान्य रहता है, और किडनी फंक्शन सामान्य होता है।
• यह स्टेरॉयड (प्रेडनिसोलोन) दवा से 2 से 4 हफ्तों में पूरी तरह नियंत्रित हो जाता है (Remission)। हालांकि किशोरावस्था तक इसमें दोबारा रिसाव (relapse) हो सकता है।

2. नॉन-MCD या स्टेरॉयड-रेसिस्टेंट नेफ्रोटिक सिंड्रोम (SRNS):
• यदि बीमारी 1 वर्ष से कम या 10 वर्ष से अधिक उम्र में शुरू हो।
• यदि पेशाब में लगातार खून (RBC) आए या बीपी बढ़ा हुआ हो।
• यदि प्रेडनिसोलोन दवा 4 से 6 सप्ताह तक देने पर भी प्रोटीन कम न हो।
• इन मामलों में अन्य विशेष दवाओं (जैसे टैक्रोलिमस, साइक्लोस्पोरिन) और आगे की जांच की आवश्यकता होती है।`,
    content_en: `Yes, there are distinct types:

1. Minimal Change Disease (MCD):
• Accounts for ~90% of cases in children aged 2 to 6 years.
• Characterized by no red cells in urine, normal blood pressure, and normal urea/creatinine.
• Responds well to steroids (Prednisolone) with complete disappearance of protein within 2 to 4 weeks. Most children have an excellent prognosis, though relapses may recur until adolescence.

2. Non-MCD / Steroid-Resistant Nephrotic Syndrome (SRNS):
• Onset under 1 year of age or over 10 years.
• Persistent blood in urine (microscopic hematuria) or high blood pressure.
• Urine protein fails to resolve after 4 to 6 weeks of daily steroids.
• Requires specialized evaluation, possible biopsy, and second-line immunosuppressive medications.`
  },
  {
    id: 'iap-q5',
    category: 'iap_faqs',
    badge: 'IAP FAQ #5',
    title_hi: 'क्या बच्चों में किडनी बायोप्सी की आवश्यकता होती है?',
    title_en: 'Is a kidney biopsy routinely required in children?',
    summary_hi: 'अधिकांश बच्चों में बायोप्सी की आवश्यकता नहीं होती; केवल विशेष जटिल स्थितियों में ही की जाती है।',
    summary_en: 'Routine biopsy is not needed for typical MCD; reserved only for atypical or non-responsive cases.',
    content_hi: `अधिकांश बच्चों में किडनी बायोप्सी की आवश्यकता नहीं होती!
क्योंकि आमतौर पर यह रोग मिनिमल चेंज डिजीज (MCD) होता है, जो स्टेरॉयड से पूरी तरह ठीक हो जाता है।

बायोप्सी केवल इन विशेष स्थितियों में की जाती है:
1. बीमारी 1 वर्ष से कम आयु में या 15 वर्ष से अधिक आयु में शुरू हो।
2. 4 से 6 सप्ताह नियमित स्टेरॉयड लेने के बाद भी पेशाब में प्रोटीन बंद न हो (Steroid Resistance)।
3. पेशाब में स्पष्ट खून आना या लगातार उच्च रक्तचाप (Hypertension) होना।
4. ब्लड यूरिया या क्रिएटिनिन अत्यधिक बढ़ा हुआ होना।
5. शरीर पर असामान्य दाने, जोड़ों में सूजन या ल्यूपस (SLE) का संदेह होना।
6. कुछ विशेष दूसरी लाइन की दवाएं शुरू करने से पहले।`,
    content_en: `A kidney biopsy is NOT required in the vast majority of children!
Because typical childhood nephrotic syndrome is MCD, which is expected to respond well to steroids.

A biopsy is reserved for specific atypical scenarios:
1. Age of onset <1 year or >15 years.
2. Failure to achieve remission after 4 to 6 weeks of daily prednisolone.
3. Persistent gross blood in urine or persistent hypertension.
4. Significantly elevated creatinine indicating renal failure.
5. Extra-renal features such as rash, arthritis, or low complement levels.
6. Before initiating certain long-term second-line medications.`
  },
  {
    id: 'iap-q6',
    category: 'iap_faqs',
    badge: 'IAP FAQ #6',
    title_hi: 'नेफ्रोटिक सिंड्रोम का सही इलाज कैसे किया जाता है?',
    title_en: 'How should a child with Nephrotic Syndrome be treated?',
    summary_hi: 'पहले एपिसोड में 12 सप्ताह प्रेडनिसोलोन (6 सप्ताह रोजाना + 6 सप्ताह एक दिन छोड़कर)।',
    summary_en: 'First episode: 12-week Prednisolone course (6 weeks daily followed by 6 weeks alternate-day).',
    content_hi: `1. पहला एपिसोड (First Episode):
• कुल 12 सप्ताह का प्रेडनिसोलोन (Prednisolone) कोर्स।
• पहले 6 सप्ताह: रोजाना सुबह नाश्ते के बाद पूरी खुराक।
• अगले 6 सप्ताह: एक दिन छोड़कर (Alternate Days) सुबह की खुराक।
• प्रेडनिसोलोन 5 mg, 10 mg, 20 mg की गोलियों में आती है। दवा कड़वी होती है, इसे शहद, चाशनी या ताजे जूस में मिलाकर दिया जा सकता है।

2. दोबारा रिसाव (Relapse):
• जब पेशाब में लगातार 3 दिन 3+ या 4+ प्रोटीन आए, तो डॉक्टर की सलाह से रोजाना प्रेडनिसोलोन शुरू की जाती है जब तक कि पेशाब लगातार 3 दिन Nil/Trace न हो जाए।
• इसके बाद अगले 4 सप्ताह तक एक दिन छोड़कर दवा दी जाती है।

3. बार-बार रिसाव (Frequent Relapses):
• यदि 12 महीने में 4 या अधिक बार रिलैप्स हो, तो डॉक्टर स्टेरॉयड-स्पेयरिंग दवाएं (जैसे लेवामिसोल, साइक्लोफॉस्फेमाइड, MMF) शुरू करते हैं।
• सूजन के समय बिना नमक वाला खाना (No-added salt) जरूरी है।`,
    content_en: `1. First Episode:
• 12-week standard course of Prednisolone.
• First 6 weeks: Daily morning dose after breakfast.
• Next 6 weeks: Alternate-day morning single dose.
• Prednisolone is bitter; tablets may be crushed and mixed with honey, syrup, or fruit juice.

2. Subsequent Relapses:
• When urine protein is 3+ or 4+ for 3 consecutive days, daily prednisolone is given until urine is Nil/Trace for 3 days, followed by alternate-day therapy for 4 weeks.

3. Frequent Relapsers (≥4 relapses in 12 months):
• Steroid-sparing medications (Levamisole, Cyclophosphamide, Mycophenolate Mofetil, Tacrolimus) are added under a pediatric nephrologist's supervision to prevent steroid toxicity.
• No-added-salt diet during relapse.`
  },
  {
    id: 'iap-q7',
    category: 'iap_faqs',
    badge: 'IAP FAQ #7',
    title_hi: 'दवाओं के दुष्प्रभाव और माता-पिता की क्या भूमिका है?',
    title_en: 'Side effects of medications and the parent\'s role in preventing them',
    summary_hi: 'मून फेस व भूख बढ़ना अस्थायी है। पेट की जलन रोकने के लिए दवा हमेशा भरे पेट दें।',
    summary_en: 'Temporary full cheeks and appetite increase. Give medication with breakfast to prevent gastritis.',
    content_hi: `स्टेरॉयड (प्रेडनिसोलोन) ही वह दवा है जो किडनी से प्रोटीन का रिसाव रोकती है।

अस्थायी प्रभाव (दवा बंद होने पर स्वतः ठीक हो जाते हैं):
• गालों का फूलना (मून फेस / Full cheeks)
• भूख में भारी वृद्धि और वजन बढ़ना
• हल्का चिड़चिड़ापन या मूड बदलना

माता-पिता की सावधानियां:
1. दवा हमेशा सुबह नाश्ते के बाद भरे पेट दें ताकि पेट में दर्द या गैस (गैस्ट्राइटिस) न हो।
2. अत्यधिक नमक, तली-भुनी चीजें और जंक फूड न दें।
3. संक्रमण से बचाव: बच्चे को साफ-सुथरा रखें, खाना खाने से पहले हाथ धुलवाएं, उबला/साफ पानी दें।
4. बार-बार स्टेरॉयड लेने वाले बच्चों में बीपी, लंबाई और आंखों (मोतियाबिंद/काला मोतिया) की नियमित जांच जरूरी है।
5. डॉक्टर की सलाह के बिना कभी भी स्टेरॉयड को अचानक बंद न करें!`,
    content_en: `Steroids are the only medicines that rapidly seal the kidney pores and stop protein leakage.

Temporary Effects (resolve after tapering):
• Round cheeks ("moon face"), increased appetite, and rapid weight gain.
• Mild irritability or mood changes.

Parental Action Plan:
1. Always administer steroids in the morning with a full stomach/breakfast to prevent stomach irritation.
2. Avoid junk foods, excessive salt, and oily snacks.
3. Protect against infections: hand hygiene, safe drinking water, and keeping away from individuals with colds or chickenpox.
4. Long-term monitoring: Periodic checks of blood pressure, linear height, and eye exams (to screen for cataracts/glaucoma).
5. NEVER stop steroids abruptly without medical instructions!`
  },
  {
    id: 'iap-q8',
    category: 'iap_faqs',
    badge: 'IAP FAQ #8',
    title_hi: 'आयुर्वेद, होम्योपैथी और खान-पान के सही नियम क्या हैं?',
    title_en: 'Role of alternative therapies and dietary regulations',
    summary_hi: 'आयुर्वेद/होम्योपैथी का कोई वैज्ञानिक प्रमाण नहीं है। सूजन में बिना नमक का खाना दें, प्रोटीन न रोकें।',
    summary_en: 'No scientific evidence for alternative therapies. Use no-added-salt cooking during edema; do not restrict protein.',
    content_hi: `वैकल्पिक चिकित्सा (Alternative Therapies):
नेफ्रोटिक सिंड्रोम के इलाज में होम्योपैथी, आयुर्वेद या सिद्धा के लाभ का कोई वैज्ञानिक प्रमाण नहीं है। एलोपैथिक स्टेरॉयड को रोककर केवल वैकल्पिक दवाइयां देना खतरनाक हो सकता है और बच्चे की स्थिति बिगाड़ सकता है।

खान-पान के नियम (Dietary Rules):
1. नमक का नियम: सूजन या रिलैप्स के दौरान बिना नमक का खाना (No-added-salt) दें। पापड़, अचार, नमकीन, चिप्स, पैकेटबंद सूप और प्रोसेस्ड चीज़ पूरी तरह बंद करें। रेमिसन (रोग नियंत्रण) में सामान्य कम नमक वाला भोजन दें।
2. प्रोटीन: चूंकि शरीर से प्रोटीन का रिसाव होता है, प्रोटीन युक्त आहार (अंडा, दालें, सोयाबीन, पनीर, दूध) पर्याप्त मात्रा में दें।
3. पानी (Fluid): जब तक डॉक्टर विशेष रूप से न कहें, पानी का अनावश्यक प्रतिबंध न करें।
4. फल और सब्जियां: ताजे फल और हरी सब्जियां प्रचुर मात्रा में दें।`,
    content_en: `Alternative Therapies:
There is NO robust scientific evidence supporting homeopathy, Ayurveda, or Siddha in treating nephrotic syndrome. Discontinuing prescribed medical treatment in favor of alternative drugs can lead to life-threatening relapses.

Dietary Guidelines:
1. Sodium/Salt: "No-added-salt" diet is essential during relapse and edema. Restrict pickles, papads, packaged namkeen, chips, canned foods, and processed cheese. Return to healthy home salt levels during remission.
2. Protein: Ensure adequate protein intake (eggs, dals, paneer, soy, milk) to replenish urine losses.
3. Fluids: Do not routinely restrict fluids unless specifically directed by your pediatric nephrologist for severe oliguria.
4. Fresh produce: Encourage vegetables, fruits, and whole grains for fiber and micronutrients.`
  },
  {
    id: 'iap-q9',
    category: 'iap_faqs',
    badge: 'IAP FAQ #9',
    title_hi: 'टीकाकरण कब और कैसे करवाएं? (Vaccines)',
    title_en: 'How and when should a child with Nephrotic Syndrome be vaccinated?',
    summary_hi: 'न्यूमोकोकल और चिकनपॉक्स के टीके अनिवार्य हैं। स्टेरॉयड के दौरान जीवित (Live) टीके न लगवाएं।',
    summary_en: 'Pneumococcal and Varicella vaccines are critical. Defer live vaccines while on daily steroids.',
    content_hi: `टीकाकरण बहुत महत्वपूर्ण है क्योंकि नेफ्रोटिक सिंड्रोम में बच्चों की रोग-प्रतिरोधक क्षमता कमजोर हो जाती है।

अनिवार्य विशेष टीके:
1. न्यूमोकोकल वैक्सीन (Pneumococcal Vaccine): यह फेफड़ों के संक्रमण (निमोनिया) और पेट के गंभीर संक्रमण (पेरिटोनाइटिस) से बचाता है।
2. चिकनपॉक्स वैक्सीन (Varicella Vaccine): चिकनपॉक्स इन बच्चों के लिए बहुत खतरनाक हो सकता है। यह टीका स्टेरॉयड बंद होने पर दिया जाता है।

महत्वपूर्ण नियम (Golden Rule for Live Vaccines):
• जब बच्चा रोजाना स्टेरॉयड की खुराक पर हो, तो जीवित टीके (Live Vaccines जैसे MMR, चिकनपॉक्स, ओरल पोलियो) नहीं दिए जाने चाहिए।
• जीवित टीके स्टेरॉयड बंद होने के कम से कम 1 महीने बाद ही दिए जाते हैं।
• सभी मृत टीके (Inactivated vaccines जैसे फ्लू, हेपेटाइटिस) सुरक्षित हैं।`,
    content_en: `Vaccination is critical because nephrotic children are at heightened risk of severe infections.

Essential Special Vaccines:
1. Pneumococcal Vaccine: Protects against life-threatening bacterial peritonitis and pneumonia.
2. Varicella (Chickenpox) Vaccine: Chickenpox infection can be severe in immunosuppressed children; vaccinate during stable remission.

Key Rule for Live Vaccines:
• DO NOT administer live viral vaccines (MMR, Varicella, Oral Polio) while the child is on daily high-dose steroids.
• Live vaccines should be deferred until at least 4 weeks after stopping immunosuppression.
• Inactivated/killed vaccines (Flu shot, Hepatitis B, Tetanus) are safe.`
  },
  {
    id: 'iap-q10',
    category: 'iap_faqs',
    badge: 'IAP FAQ #10',
    title_hi: 'क्या यह बीमारी पूरी तरह ठीक हो सकती है? किडनी फेल का खतरा?',
    title_en: 'Is Nephrotic Syndrome curable? What is the risk of kidney failure?',
    summary_hi: '80% बच्चे किशोरावस्था तक पूरी तरह ठीक हो जाते हैं! स्टेरॉयड का असर होने पर किडनी फेल का खतरा नहीं होता।',
    summary_en: 'Up to 80% achieve permanent cure by adolescence! No risk of kidney failure in steroid-responsive cases.',
    content_hi: `भविष्य की संभावना (Prognosis):
बच्चों और अभिभावकों के लिए सबसे बड़ी राहत की बात यह है कि स्टेरॉयड का असर दिखाने वाले बच्चों (Steroid-Sensitive) में भविष्य में किडनी फेलियर का कोई खतरा नहीं होता!

• भले ही बचपन में बार-बार रिलैप्स (दोबारा सूजन) हो, लगभग 80% बच्चे किशोरावस्था (12 से 16 वर्ष की उम्र) तक पहुंचने पर इस बीमारी से स्थायी रूप से मुक्त हो जाते हैं।
• केवल एक छोटा वर्ग (जो स्टेरॉयड का जवाब नहीं देता - Steroid Resistant) को विशेष निगरानी और उन्नत दवाओं की आवश्यकता होती है।

बाल गुर्दा विशेषज्ञ (Pediatric Nephrologist) से कब मिलें:
1. यदि 4-6 सप्ताह स्टेरॉयड देने पर भी प्रोटीन बंद न हो।
2. यदि 1 वर्ष से कम उम्र में बीमारी शुरू हो।
3. पेशाब में खून आए या बीपी नियंत्रित न हो।
4. बार-बार रिलैप्स होने पर स्टेरॉयड की जगह अन्य दवाओं की जरूरत हो।`,
    content_en: `Prognosis and Long-Term Outcome:
The most reassuring fact for parents is that children who respond well to steroids (Steroid-Sensitive Nephrotic Syndrome) have NO increased risk of permanent kidney damage or kidney failure!

• Although repeated relapses may occur during childhood, up to 80% of children outgrow the condition and achieve a permanent cure by adolescence.
• Only the small minority who fail to respond to steroids (Steroid-Resistant) carry a risk of long-term kidney dysfunction.

When to consult a Pediatric Nephrologist:
1. Steroid resistance (proteinuria persisting after 4-6 weeks of therapy).
2. Onset before 1 year or after 15 years of age.
3. Persistent blood in urine or difficult-to-control blood pressure.
4. Frequent relapses requiring steroid-sparing medications.`
  },

  // ── HOME DIPSTICK TESTING MASTERCLASS ──
  {
    id: 'guide-dipstick',
    category: 'dipstick',
    badge: 'Home Protocol',
    title_hi: 'घर पर मूत्र डिपस्टिक टेस्ट करने का सही तरीका',
    title_en: 'How to Perform Urine Dipstick Testing at Home',
    summary_hi: 'सुबह का पहला पेशाब लें, स्ट्रिप को 1 सेकंड डुबोएं, 60 सेकंड रुकें और रंग चार्ट से मिलान करें।',
    summary_en: 'Collect first morning urine, dip strip for 1 second, wait 60 seconds, and compare to color chart.',
    content_hi: `घर पर रोजाना मूत्र परीक्षण नेफ्रोटिक सिंड्रोम की निगरानी का सबसे महत्वपूर्ण हथियार है।

चरण 1: सुबह का पहला मूत्र नमूना लें (First Morning Urine)
रात भर का मूत्र सबसे अधिक गाढ़ा होता है और सबसे सटीक परिणाम देता है। एक साफ, सूखे कंटेनर में मूत्र एकत्र करें।

चरण 2: स्ट्रिप को सही तरीके से डुबोएं
• साफ हाथों से बोतल से एक स्ट्रिप निकालें और ढक्कन तुरंत बंद कर दें।
• रासायनिक पैड वाले हिस्से को मूत्र में 1 सेकंड के लिए डुबोएं और बिना देरी किए तुरंत बाहर निकालें।
• अतिरिक्त मूत्र हटाने के लिए स्ट्रिप के किनारे को कंटेनर के किनारे से पोंछें।

चरण 3: 60 सेकंड प्रतीक्षा करें और रंगों का मिलान करें
• ठीक 60 सेकंड (1 मिनट) प्रतीक्षा करें।
• स्ट्रिप के रंग की तुलना बोतल पर दिए गए रंग चार्ट से करें:
  - पीला (Yellow) = Negative / Nil (कोई प्रोटीन नहीं)
  - हल्का पीला-हरा = Trace (मामूली प्रोटीन)
  - हल्का हरा (Light Green) = 1+ (30 mg/dL)
  - मध्यम हरा = 2+ (100 mg/dL)
  - गहरा हरा = 3+ (300 mg/dL - संभावित रिलैप्स)
  - बहुत गहरा नीला-हरा = 4+ (1000 mg/dL - भारी प्रोटीन रिसाव)

चरण 4: डायरी या KidneyCare ऐप में दर्ज करें!`,
    content_en: `Daily home testing is the single most important tool for early relapse detection.

Step 1: Collect First Morning Urine
Use the very first urine passed after waking up. It is the most concentrated and provides reliable results.

Step 2: Dip and Remove Promptly
• Take one strip from the container and immediately recap the bottle tightly.
• Dip the reagent test pad into the urine specimen for 1 second and remove immediately.
• Tap the edge against the cup rim to remove excess drops.

Step 3: Wait 60 Seconds and Read Color
• Wait exactly 60 seconds before interpreting.
• Compare with the bottle color scale:
  - Yellow: Negative / Nil (No protein)
  - Light Yellow-Green: Trace
  - Light Green: 1+ (30 mg/dL)
  - Medium Green: 2+ (100 mg/dL)
  - Dark Green: 3+ (300 mg/dL - Relapse alert)
  - Very Dark Blue-Green: 4+ (1000 mg/dL - Heavy leakage)

Step 4: Record Daily in KidneyCare App!`
  },
  {
    id: 'guide-relapse-remission',
    category: 'dipstick',
    badge: 'Clinical Rules',
    title_hi: 'रेमिसन (सुधार) और रिलैप्स (बीमारी लौटना) की पहचान',
    title_en: 'Recognizing Remission and Relapse at Home',
    summary_hi: 'लगातार 3 दिन Negative = रेमिसन। लगातार 3 दिन 3+ या 4+ = रिलैप्स।',
    summary_en: '3 consecutive days Negative = Remission. 3 consecutive days 3+ or 4+ = Relapse.',
    content_hi: `डॉक्टर के अनुसार बीमारी की स्थिति को ऐसे समझें:

1. रेमिसन (Remission - बीमारी पर पूर्ण नियंत्रण):
जब पेशाब का टेस्ट लगातार 3 दिनों तक 'Negative' या 'Trace' आए, चेहरे व पैरों की सूजन पूरी तरह गायब हो जाए, तो इसे रेमिसन कहा जाता है।

2. रिलैप्स (Relapse - प्रोटीन का दोबारा रिसाव):
जब पेशाब का टेस्ट लगातार 3 दिनों तक '3+' या '4+' आए, तो इसे रिलैप्स माना जाता है। 
अक्सर यह सर्दी, खांसी या बुखार के बाद होता है।

क्या करें जब रिलैप्स हो?
• घबराएं नहीं! यह इस बीमारी का सामान्य हिस्सा है।
• तुरंत अपने डॉक्टर द्वारा बताए गए रिलैप्स प्रोटोकॉल का पालन करें या एम्स पटना हेल्पलाइन पर संपर्क करें।
• खाने में नमक तुरंत बंद (No-added salt) कर दें।`,
    content_en: `How clinicians define disease activity:

1. Complete Remission:
Urine protein is Negative or Trace for 3 consecutive days, swelling is completely resolved, and child is at dry baseline weight.

2. Relapse:
Urine protein returns to 3+ or 4+ for 3 consecutive days. Commonly triggered by viral colds, ear infections, or gastroenteritis.

What to do during a relapse?
• Stay calm; relapses are an anticipated part of childhood nephrotic syndrome.
• Notify your pediatrician or follow your written action plan to restart daily prednisolone.
• Immediately institute a strict no-added-salt diet.`
  },

  // ── MEDICATIONS & STEROIDS (BC CHILDREN'S HOSPITAL RULES) ──
  {
    id: 'guide-steroid-admin',
    category: 'medications',
    badge: 'BC Children\'s Rules',
    title_hi: 'प्रेडनिसोलोन (Prednisolone) देने के 5 सुनहरे नियम',
    title_en: '5 Golden Rules for Giving Prednisolone Safely',
    summary_hi: 'हमेशा सुबह नाश्ते के बाद दें, कभी भी पूरी खुराक अचानक बंद न करें, कड़वाहट कम करने के तरीके।',
    summary_en: 'Always give in morning with breakfast, never stop abruptly, tips for managing bitter taste.',
    content_hi: `ब्रिटिश कोलंबिया चिल्ड्रन्स हॉस्पिटल और एम्स पटना द्वारा अनुमोदित नियम:

नियम 1: हमेशा सुबह के समय दें (8 से 9 बजे के बीच)
शरीर का प्राकृतिक कोर्टिसोल हार्मोन सुबह चरम पर होता है। सुबह दवा देने से शरीर की प्राकृतिक ग्रंथि (Adrenal gland) पर कम से कम प्रभाव पड़ता है और नींद में खलल नहीं पड़ता।

नियम 2: हमेशा भरे पेट (नाश्ते के बाद) दें
खाली पेट स्टेरॉयड देने से पेट में जलन, दर्द या अल्सर (Gastritis) हो सकता है। इसे दूध या भारी नाश्ते के बाद दें।

नियम 3: कड़वाहट को दूर करने के तरीके
प्रेडनिसोलोन कड़वी होती है। 
• गोली को थोड़े से शहद, चॉकलेट सिरप, गाढ़े मैंगो शेक या जैम में मिलाकर दें।
• दवा को पूरे गिलास दूध या बड़े कटोरे भोजन में न घोलें, क्योंकि यदि बच्चा पूरा नहीं खाएगा तो खुराक अधूरी रह जाएगी।

नियम 4: कभी भी अचानक दवा बंद न करें
लंबे समय से चल रही स्टेरॉयड को अचानक बंद करने से शरीर में एड्रेनल क्राइसिस (गंभीर कमजोरी, बीपी गिरना) हो सकता है। हमेशा डॉक्टर के बताए अनुसार धीरे-धीरे खुराक घटाएं (Tapering)।

नियम 5: उल्टी होने पर क्या करें?
यदि दवा देने के 15 मिनट के भीतर बच्चा पूरी उल्टी कर दे, तो खुराक दोबारा दें। यदि 30 मिनट से अधिक समय बीत चुका हो, तो दोबारा न दें।`,
    content_en: `Standard guidelines from BC Children's Hospital and AIIMS Patna:

Rule 1: Always Administer in the Morning (8–9 AM)
Body's endogenous cortisol naturally peaks in the morning. Morning dosing minimizes adrenal suppression and avoids nighttime sleep disruption.

Rule 2: Always Give with or Immediately After Food
Never give steroids on an empty stomach. Always administer after a wholesome breakfast or with milk to prevent gastritis.

Rule 3: Masking the Bitter Taste
• Crush tablets and mix into a single teaspoon of chocolate syrup, honey, jam, or sweet yogurt.
• Do not dilute into a full glass of milk or large meal; if the child does not finish the meal, the dose is under-delivered.

Rule 4: Never Stop Abruptly
Sudden cessation after weeks of therapy triggers adrenal insufficiency (collapse, severe hypotension). Always taper according to the medical schedule.

Rule 5: What to do if the child vomits?
If full vomiting occurs within 15 minutes of ingestion, repeat the full dose. If more than 30 minutes have elapsed, do not re-dose.`
  },

  // ── DIET & SODIUM RULES ──
  {
    id: 'guide-diet-salt',
    category: 'diet',
    badge: 'Nutrition Guide',
    title_hi: 'कम नमक वाला आहार (No-Added-Salt) और क्या खिलाएं?',
    title_en: 'No-Added-Salt Diet and What to Feed Your Child',
    summary_hi: 'नमक रोकने से सूजन काबू में रहती है। पैकेटबंद नमकीन बंद करें, दाल, पनीर व फल भरपूर दें।',
    summary_en: 'Salt restriction prevents swelling. Cut processed namkeen; provide lentils, paneer, and fruits.',
    content_hi: `नमक शरीर में पानी को रोकता है। जब किडनी से प्रोटीन बहता है, तो नमक खाने से सारा पानी ऊतकों में जमा होकर भारी सूजन पैदा करता है।

सूजन व रिलैप्स में इन चीजों से सख्त परहेज करें:
❌ टेबल सॉल्ट (ऊपर से नमक छिड़कना)
❌ चिप्स, कुरकुरे, पैकेटबंद नमकीन, भुजिया
❌ पापड़, आचार, चटनी
❌ बाजार के बिस्कुट, केक, पैटीज
❌ डिब्बाबंद सूप, नूडल्स और पिज्जा

क्या खिलाएं (स्वस्थ विकल्प):
✅ घर का बना बिना नमक/अल्प नमक का भोजन
✅ दालें (मूंग, मसूर, अरहर), राजमा, छोले
✅ उबला अंडा (सफेदी), घर का ताजा पनीर
✅ ताजे मौसमी फल (सेब, पपीता, अमरूद)
✅ घर की बनी ताजी रोटी, चावल, दलिया, पोहा
✅ स्वाद के लिए नींबू का रस, जीरा पाउडर, धनिया या हरी मिर्च का उपयोग करें।`,
    content_en: `Sodium retains water. During proteinuria, dietary salt rapidly shifts fluid into body tissues, worsening severe swelling.

Foods to strictly avoid during relapse and swelling:
❌ Added table salt at the table
❌ Packaged chips, namkeen, bhujia, instant noodles
❌ Pickles, papads, canned sauces, commercial ketchup
❌ Bakery snacks, processed cheese, processed meats

Healthy choices to encourage:
✅ Home-cooked meals prepared with minimal/no salt
✅ High-protein dals (moong, masoor), legumes, paneer, and egg whites
✅ Fresh seasonal fruits (apple, papaya, guava)
✅ Fresh chapatis, rice, plain poha, and vegetable khichdi
✅ Flavor enhancers: lemon juice, roasted cumin, coriander, amchur (dry mango powder).`
  },

  // ── EMERGENCY RED FLAGS ──
  {
    id: 'guide-emergency-redflags',
    category: 'emergency',
    badge: 'Emergency Alert',
    title_hi: 'आपातकालीन चेतावनी संकेत: डॉक्टर से तुरंत कब संपर्क करें?',
    title_en: 'Emergency Red Flags: When to Contact the Doctor Immediately',
    summary_hi: '+1 किलो वजन बढ़ना, तेज बुखार + पेट दर्द (पेरिटोनाइटिस), सांस फूलना या 8 घंटे पेशाब न होना।',
    summary_en: '+1 kg weight spike, high fever + severe abdominal pain, breathlessness, or 8h without urine.',
    content_hi: `इन 5 स्थितियों में बिना देर किए तुरंत अस्पताल या एम्स पटना आपातकालीन सेवा (0612-2451070) पर संपर्क करें:

1. अचानक वजन में 1 किलो या अधिक की वृद्धि (+1 kg Rule):
यदि 24 से 48 घंटे में बच्चे का वजन 1 किलो से अधिक बढ़ जाए, तो यह तेजी से तरल जमाव (Fluid Overload) का संकेत है।

2. तेज बुखार के साथ गंभीर पेट दर्द (Peritonitis):
नेफ्रोटिक सिंड्रोम में पेट के तरल में जीवाणु संक्रमण (पेरिटोनाइटिस) का खतरा रहता है। यह एक जानलेवा आपात स्थिति है।

3. सांस लेने में भारी कठिनाई:
यदि बच्चे की सांस तेज चल रही हो, पसलियां धंस रही हों या छाती में पानी भरने का संदेह हो।

4. 8 घंटे से अधिक समय तक पेशाब न आना:
यह गंभीर निर्जलीकरण या एक्यूट किडनी इंजरी का संकेत हो सकता है।

5. अत्यधिक सुस्ती, बेहोशी या दौरे पड़ना:
रक्तचाप या इलेक्ट्रोलाइट्स में तीव्र असंतुलन का लक्षण।`,
    content_en: `Seek immediate emergency medical attention or call AIIMS Patna helpline (0612-2451070) for any of these 5 red flags:

1. Weight Gain >1 kg in 24–48 Hours (+1 kg Rule):
Indicates rapid fluid retention and dangerous fluid overload.

2. High Fever Accompanied by Severe Abdominal Pain:
Hallmark of spontaneous bacterial peritonitis (infection of peritoneal fluid), requiring urgent IV antibiotics.

3. Significant Shortness of Breath or Chest Distress:
Fluid may have accumulated around the lungs (pleural effusion) or severe pulmonary complications.

4. No Urine Output for More Than 8 Hours:
Danger sign of acute kidney hypoperfusion or urinary retention.

5. Extreme Lethargy, Severe Headache, Vomiting, or Seizures:
Possible cerebral thrombosis, severe hypertension, or electrolyte collapse.`
  }
];

function ArticleDetailModal({ article, lang, onClose }) {
  const hi = lang === 'hi';
  const title = hi ? article.title_hi : article.title_en;
  const content = hi ? article.content_hi : article.content_en;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[88vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-xs mb-2 border-indigo-200">
                {article.badge || 'KidneyCare Guide'}
              </Badge>
              <h2 className="text-lg font-extrabold text-foreground leading-snug">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Audio read-aloud button */}
          <button
            onClick={() => speak(content, lang)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-2xl py-3 mb-5 shadow-md active:scale-98 transition-transform cursor-pointer"
          >
            <Volume2 className="w-5 h-5 text-white animate-pulse" />
            <span>{hi ? 'आवाज़ में सुनें (Audio Play)' : 'Listen Aloud (Audio)'}</span>
          </button>

          {/* Article Text Content */}
          <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm sm:text-base whitespace-pre-line space-y-3 font-normal">
            {content}
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {hi ? 'IAP व एम्स पटना दिशानिर्देश' : 'IAP & AIIMS Patna Guidelines'}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold bg-muted hover:bg-muted/80 rounded-xl text-foreground transition-colors"
            >
              {hi ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EducationContent() {
  const { language, changeLanguage } = useLanguage();
  const hi = language === 'hi';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: dbContent = [] } = useQuery({
    queryKey: ['educationalContent'],
    queryFn: () => base44.entities.EducationalContent.filter({ published: true })
  });

  // Merge default rich content with any dynamically published DB items
  const combinedContent = [
    ...COMPREHENSIVE_EDUCATION_DATA,
    ...dbContent.map(db => ({
      id: db.id,
      category: db.category || 'all',
      badge: db.badge || 'Article',
      title_hi: db.title_hi || db.title_en,
      title_en: db.title_en,
      summary_hi: db.content_hi ? db.content_hi.slice(0, 100) + '...' : '',
      summary_en: db.content_en ? db.content_en.slice(0, 100) + '...' : '',
      content_hi: db.content_hi || db.content_en,
      content_en: db.content_en,
    }))
  ];

  const filteredContent = combinedContent.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() ||
      item.title_hi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content_hi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content_en.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* ── TOP HEADER (MOVED SLIGHTLY LOWER FOR NOTCH) ── */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 px-4 pt-7 pb-5 text-white shadow-lg sticky top-0 z-40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link to="/">
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                title="Back to Home"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div>
              <h1 className="text-base font-extrabold flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-200" />
                <span>{hi ? 'अभिभावक गाइड एवं शिक्षा' : 'Parent Knowledge Hub'}</span>
              </h1>
              <p className="text-indigo-200 text-xs">
                {hi ? 'IAP व एम्स पटना नेफ्रोलॉजी गाइड' : 'IAP 10 FAQs & Nephrology Handbooks'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => changeLanguage(hi ? 'en' : 'hi')}
            className="text-xs font-bold border border-white/40 text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer"
          >
            {hi ? '🇬🇧 English' : '🇮🇳 हिंदी'}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mt-2">
          <Search className="w-4 h-4 text-white/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={hi ? 'खोजें: पेशाब जांच, प्रेडनिसोलोन, नमक, रिलैप्स...' : 'Search: dipstick, prednisolone, salt, relapse...'}
            className="w-full bg-white/15 text-white placeholder-white/60 text-xs rounded-2xl pl-10 pr-4 py-2.5 outline-none border border-white/20 focus:bg-white/25 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* ── NOTEBOOKLM VISUAL INFOGRAPHIC CALLOUT ── */}
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 rounded-3xl border border-amber-200 dark:border-amber-800 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                {hi ? 'भारतीय बाल चिकित्सा अकादमी (IAP) आधिकारिक निर्देश' : 'Official IAP Pediatric Nephrology Guidelines'}
              </h3>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              {hi
                ? 'नेफ्रोटिक सिंड्रोम से पीड़ित बच्चों के माता-पिता के लिए 10 सबसे महत्वपूर्ण प्रश्नोत्तर, घर पर स्ट्रिप जांच, स्टेरॉयड के नियम व आपातकालीन चेतावनी संकेत।'
                : 'Complete 10 clinical FAQs, home dipstick grading protocol, steroid tapering rules, and +1kg emergency warning signs.'}
            </p>
          </div>
        </div>

        {/* ── CATEGORY HORIZONTAL FILTER CHIPS ── */}
        <div className="overflow-x-auto pb-1 scrollbar-none flex gap-2">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none scale-102'
                    : 'bg-white dark:bg-gray-800 text-muted-foreground border border-border hover:bg-muted/50'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{hi ? cat.labelHi : cat.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* ── ARTICLES / FAQS LIST ── */}
        <div className="space-y-3">
          {filteredContent.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-border">
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-xs font-bold text-foreground">
                {hi ? 'कोई जानकारी नहीं मिली' : 'No articles found'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {hi ? 'कृपया दूसरा कीवर्ड खोजें' : 'Try searching another keyword'}
              </p>
            </div>
          ) : (
            filteredContent.map((item, idx) => {
              const title = hi ? item.title_hi : item.title_en;
              const summary = hi ? item.summary_hi : item.summary_en;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <div
                    onClick={() => setSelectedArticle(item)}
                    className="bg-white dark:bg-gray-800 rounded-3xl border border-border p-4 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99] group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <Badge variant="outline" className="text-[10px] bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 font-bold">
                        {item.badge}
                      </Badge>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          speak(hi ? item.content_hi : item.content_en, language);
                        }}
                        className="w-8 h-8 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-700 flex items-center justify-center transition-colors active:scale-95"
                        title={hi ? 'आवाज़ में सुनें' : 'Listen'}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-extrabold text-foreground text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {summary}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      <span>{hi ? 'विस्तार से पढ़ें' : 'Read full guide'}</span>
                      <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedArticle && (
          <ArticleDetailModal
            article={selectedArticle}
            lang={language}
            onClose={() => setSelectedArticle(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Education() {
  return (
    <LanguageProvider>
      <EducationContent />
    </LanguageProvider>
  );
}