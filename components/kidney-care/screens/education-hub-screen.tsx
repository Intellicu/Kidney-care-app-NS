"use client"

import { useState, useCallback } from "react"
import { useApp, getTranslations } from "@/lib/app-context"
import { FloatingAssistant } from "../floating-assistant"
import {
  ChevronLeft,
  Volume2,
  VolumeX,
  Search,
  Heart,
  TestTube,
  Utensils,
  AlertTriangle,
  Pill,
  Activity,
  MessageCircle,
  X,
  Send,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Dumbbell,
  Brain,
  Stethoscope,
  Droplets,
} from "lucide-react"

const voiceLanguageMap: Record<string, string> = {
  en: "en-IN", hi: "hi-IN", bn: "bn-IN", ta: "ta-IN", pa: "pa-IN",
}

// Literacy levels
type LiteracyLevel = "simple" | "standard" | "detailed"

// Education content organized by category
interface EducationArticle {
  id: string
  category: string
  icon: typeof Heart
  color: string
  title: { en: string; hi: string }
  content: Record<LiteracyLevel, { en: string; hi: string }>
}

const articles: EducationArticle[] = [
  {
    id: "what-is-ns",
    category: "basics",
    icon: Heart,
    color: "text-rose-600 bg-rose-100",
    title: { en: "What is Nephrotic Syndrome?", hi: "नेफ्रोटिक सिंड्रोम क्या है?" },
    content: {
      simple: {
        en: "Your child's kidneys are leaking protein into urine. This causes swelling in the face and body. Medicine (prednisolone) stops the leak. Most children get completely well.",
        hi: "आपके बच्चे के गुर्दे पेशाब में प्रोटीन छोड़ रहे हैं। इससे चेहरे और शरीर में सूजन होती है। दवा (प्रेडनिसोलोन) रिसाव रोकती है। अधिकांश बच्चे पूरी तरह ठीक हो जाते हैं।",
      },
      standard: {
        en: "Nephrotic syndrome is a kidney condition where tiny filters become leaky, allowing protein (albumin) to spill into urine. This causes the blood protein to drop, leading to fluid leaking into tissues causing swelling (oedema). In 90% of children aged 2-6, this is 'minimal change' type with no permanent kidney damage. With prednisolone treatment, the protein leak stops. The disease is NOT caused by infection or diet.",
        hi: "नेफ्रोटिक सिंड्रोम गुर्दे की एक स्थिति है जिसमें छोटे फिल्टर लीक हो जाते हैं, जिससे प्रोटीन (एल्ब्यूमिन) पेशाब में आने लगता है। इससे रक्त प्रोटीन गिरता है और शरीर में सूजन होती है। 2-6 वर्ष के 90% बच्चों में यह 'मिनिमल चेंज' प्रकार है। प्रेडनिसोलोन उपचार से प्रोटीन रिसाव बंद होता है।",
      },
      detailed: {
        en: "Nephrotic syndrome is characterized by heavy proteinuria (>40 mg/m2/hr or urine protein/creatinine ratio >2), hypoalbuminemia (<2.5 g/dL), hyperlipidemia, and edema. In children, 90% have minimal change disease (MCD). The glomerular basement membrane becomes permeable to albumin due to podocyte foot process effacement. Treatment protocol: 2 mg/kg/day prednisolone (max 60mg) for 6 weeks daily, then 1.5 mg/kg alternate days for 6 weeks, with gradual taper. 85-90% achieve remission within 4 weeks of steroid therapy.",
        hi: "नेफ्रोटिक सिंड्रोम भारी प्रोटीनमेह (>40 mg/m2/hr), हाइपोएल्ब्यूमिनीमिया (<2.5 g/dL), हाइपरलिपिडिमिया और एडिमा द्वारा विशेषता है। बच्चों में 90% मिनिमल चेंज डिजीज (MCD) होती है। उपचार: 6 सप्ताह दैनिक प्रेडनिसोलोन 2 mg/kg/day, फिर 6 सप्ताह वैकल्पिक दिन 1.5 mg/kg। 85-90% बच्चे 4 सप्ताह में रिमिशन प्राप्त करते हैं।",
      },
    },
  },
  {
    id: "urine-test-guide",
    category: "testing",
    icon: TestTube,
    color: "text-amber-600 bg-amber-100",
    title: { en: "How to Do Urine Dipstick Test", hi: "मूत्र डिपस्टिक परीक्षण कैसे करें" },
    content: {
      simple: {
        en: "Use morning urine. Dip strip for 1 second. Wait 60 seconds. Match color with chart on bottle. Negative = good. 3+ for 3 days = tell doctor.",
        hi: "सुबह का पेशाब उपयोग करें। पट्टी 1 सेकंड डुबोएं। 60 सेकंड प्रतीक्षा करें। बोतल के चार्ट से रंग मिलाएं। नकारात्मक = अच्छा। 3 दिन 3+ = डॉक्टर को बताएं।",
      },
      standard: {
        en: "Always use FIRST MORNING urine for accuracy.\n\n1. Check dipstick expiry date\n2. Collect fresh urine in clean container\n3. Remove one strip, close bottle tightly\n4. Dip strip briefly (1 second)\n5. Wipe edge on container\n6. Wait exactly 60 seconds (use timer)\n7. Compare protein pad color to bottle chart\n\nResults: Negative/Trace = Good. 1+/2+ = Monitor, not relapse. 3+/4+ for 3 consecutive days = RELAPSE, contact doctor.",
        hi: "सटीकता के लिए हमेशा सुबह का पहला मूत्र उपयोग करें।\n\n1. डिपस्टिक की समाप्ति तिथि जांचें\n2. साफ बर्तन में ताज़ा मूत्र इकट्ठा करें\n3. एक पट्टी निकालें, बोतल बंद करें\n4. 1 सेकंड डुबोएं\n5. किनारा पोंछें\n6. ठीक 60 सेकंड प्रतीक्षा करें\n7. प्रोटीन पैड का रंग चार्ट से मिलाएं\n\nपरिणाम: नकारात्मक/ट्रेस = अच्छा। 1+/2+ = निगरानी। 3+/4+ लगातार 3 दिन = रिलैप्स, डॉक्टर से मिलें।",
      },
      detailed: {
        en: "Urine dipstick methodology: Urine protein is detected by the protein error of indicators principle (tetrabromo phenol blue). The test is most sensitive to albumin.\n\nQuality control: Store strips in original container at room temperature. Do not use expired strips. First morning void is preferred.\n\nInterpretation:\n- Negative: <10 mg/dL\n- Trace: 15-30 mg/dL\n- 1+ (30 mg/dL): Clinically abnormal but not nephrotic range\n- 2+ (100 mg/dL): Moderate, monitor\n- 3+ (300 mg/dL): Nephrotic range - active disease\n- 4+ (>2000 mg/dL): Very heavy proteinuria\n\nRelapse definition: 3+ or 4+ for 3 consecutive days after prior remission. Remission: Negative or trace for 3 consecutive days.",
        hi: "मूत्र डिपस्टिक पद्धति: प्रोटीन का पता इंडिकेटर त्रुटि सिद्धांत से होता है। परीक्षण एल्ब्यूमिन के प्रति सबसे संवेदनशील है।\n\nव्याख्या:\n- नकारात्मक: <10 mg/dL\n- ट्रेस: 15-30 mg/dL\n- 1+ (30 mg/dL): असामान्य लेकिन नेफ्रोटिक नहीं\n- 2+ (100 mg/dL): मध्यम\n- 3+ (300 mg/dL): नेफ्रोटिक रेंज\n- 4+ (>2000 mg/dL): बहुत भारी\n\nरिलैप्स: 3+ या 4+ लगातार 3 दिन।",
      },
    },
  },
  {
    id: "diet-guide",
    category: "lifestyle",
    icon: Utensils,
    color: "text-emerald-600 bg-emerald-100",
    title: { en: "Diet & Nutrition Guide", hi: "आहार और पोषण गाइड" },
    content: {
      simple: {
        en: "When swollen: Less salt, normal food. When well: Normal food, no restrictions. On steroids: Less sugar and oily food. DO NOT give extra protein thinking it helps - it does not.",
        hi: "सूजन होने पर: कम नमक, सामान्य खाना। ठीक होने पर: सामान्य खाना। स्टेरॉयड पर: कम चीनी और तेल। अतिरिक्त प्रोटीन देने की जरूरत नहीं।",
      },
      standard: {
        en: "During Relapse:\n- RESTRICT SALT - no extra salt, avoid chips, pickles, fast food\n- Normal protein - dal, chana, soybean, eggs, milk\n- Limit fluids only if doctor advises\n\nDuring Remission:\n- Normal nutritious diet, no restrictions\n- Resume usual salt\n\nOn Steroids:\n- Limit sugary foods, fried foods, ice cream\n- Encourage fruits, vegetables, exercise\n- Vitamin D supplements may be needed\n- Weight gain is a side effect that reverses\n\nDO NOT give high-protein diet to replace lost protein - this is a common misconception and can worsen swelling due to high salt content.",
        hi: "रिलैप्स के दौरान:\n- नमक कम - अतिरिक्त नमक नहीं, चिप्स, अचार, फास्ट फूड से बचें\n- सामान्य प्रोटीन - दाल, चना, सोयाबीन, अंडे, दूध\n\nरिमिशन में:\n- सामान्य पौष्टिक आहार, कोई प्रतिबंध नहीं\n\nस्टेरॉयड पर:\n- मीठे, तले हुए खाद्य पदार्थ सीमित करें\n- फल, सब्जियां, व्यायाम को प्रोत्साहित करें\n\nखोए प्रोटीन की भरपाई के लिए अतिरिक्त प्रोटीन आहार न दें।",
      },
      detailed: {
        en: "Nutritional management in nephrotic syndrome:\n\nProtein: Normal intake (1-1.5 g/kg/day). High-protein diets are contraindicated as they increase glomerular hyperfiltration and are poorly tolerated.\n\nSodium: Restrict to 1-2 mEq/kg/day during active disease. No-added-salt diet during relapse.\n\nFat: Dyslipidemia is common - limit saturated fats. Statins may be needed for persistent hyperlipidemia.\n\nCalcium/Vitamin D: Supplement during prolonged steroid use to prevent osteoporosis.\n\nCaloric intake: Monitor closely on steroids - increased appetite is universal. Focus on nutrient-dense foods.\n\nFluid: Restrict only in severe edema with hyponatremia.",
        hi: "नेफ्रोटिक सिंड्रोम में पोषण प्रबंधन:\n\nप्रोटीन: सामान्य सेवन (1-1.5 g/kg/day)। उच्च प्रोटीन आहार वर्जित है।\n\nसोडियम: सक्रिय रोग में 1-2 mEq/kg/day तक सीमित।\n\nवसा: डिस्लिपिडेमिया आम है - संतृप्त वसा सीमित करें।\n\nकैल्शियम/विटामिन D: लंबे स्टेरॉयड उपयोग में पूरक दें।",
      },
    },
  },
  {
    id: "exercise-stress",
    category: "lifestyle",
    icon: Dumbbell,
    color: "text-indigo-600 bg-indigo-100",
    title: { en: "Exercise & Stress Management", hi: "व्यायाम और तनाव प्रबंधन" },
    content: {
      simple: {
        en: "When feeling well, your child should play and exercise normally. Avoid contact sports during swelling. Keep your child happy - stress can affect health.",
        hi: "जब ठीक हो, बच्चा सामान्य रूप से खेले और व्यायाम करे। सूजन के दौरान संपर्क खेलों से बचें। बच्चे को खुश रखें।",
      },
      standard: {
        en: "Exercise During Remission:\n- Normal physical activity is encouraged\n- Swimming, cycling, running are all fine\n- Regular activity helps counter steroid weight gain\n- Aim for 30-60 minutes of moderate activity daily\n\nDuring Relapse:\n- Light activity is okay\n- Avoid vigorous exercise\n- Rest when swelling is severe\n\nStress Management:\n- Emotional stress may trigger relapses\n- Maintain normal school and social life during remission\n- Do not over-restrict the child\n- Support groups can help families cope\n- Talk openly about the condition",
        hi: "रिमिशन में व्यायाम:\n- सामान्य शारीरिक गतिविधि को प्रोत्साहित करें\n- तैराकी, साइकिलिंग, दौड़ सब ठीक है\n- नियमित गतिविधि स्टेरॉयड वजन बढ़ने से लड़ने में मदद करती है\n\nरिलैप्स के दौरान:\n- हल्की गतिविधि ठीक है\n- कठोर व्यायाम से बचें\n\nतनाव प्रबंधन:\n- भावनात्मक तनाव रिलैप्स को ट्रिगर कर सकता है\n- रिमिशन में सामान्य स्कूल और सामाजिक जीवन बनाए रखें\n- बच्चे पर अत्यधिक प्रतिबंध न लगाएं",
      },
      detailed: {
        en: "Physical activity and nephrotic syndrome:\n\nEvidence supports moderate aerobic exercise during remission for improved cardiovascular health and counteracting steroid-induced metabolic effects.\n\nDuring active disease, limit to light activities. Severe edema may require bed rest.\n\nPsychosocial impact:\n- Children with NS have higher rates of anxiety and behavioral issues\n- Steroid-induced mood changes are drug effects, not discipline problems\n- Normal schooling during remission is essential\n- Avoiding over-protection is key to psychological well-being\n- Consider psychological support for frequent relapsers",
        hi: "शारीरिक गतिविधि और नेफ्रोटिक सिंड्रोम:\n\nरिमिशन में मध्यम एरोबिक व्यायाम हृदय स्वास्थ्य के लिए सहायक है।\n\nसक्रिय रोग में हल्की गतिविधि तक सीमित रहें।\n\nमनोसामाजिक प्रभाव:\n- NS वाले बच्चों में चिंता अधिक होती है\n- स्टेरॉयड मूड परिवर्तन दवा का प्रभाव है\n- रिमिशन में सामान्य स्कूली शिक्षा आवश्यक है",
      },
    },
  },
  {
    id: "red-flags",
    category: "emergency",
    icon: AlertTriangle,
    color: "text-red-600 bg-red-100",
    title: { en: "Red Flags - When to Go to Hospital", hi: "खतरे के संकेत - अस्पताल कब जाएं" },
    content: {
      simple: {
        en: "GO TO HOSPITAL if: Protein 3+ for 3 days. Severe stomach pain. Difficulty breathing. Very less urine. Cold hands/feet. Chickenpox contact while on steroids. STOP Lasix/Enalapril if child has diarrhea.",
        hi: "अस्पताल जाएं अगर: 3 दिन 3+ प्रोटीन। गंभीर पेट दर्द। सांस लेने में तकलीफ। बहुत कम पेशाब। ठंडे हाथ-पैर। स्टेरॉयड पर चिकनपॉक्स संपर्क। दस्त हों तो Lasix/Enalapril बंद करें।",
      },
      standard: {
        en: "GO TO HOSPITAL IMMEDIATELY:\n\n1. Relapse Signs: Protein 3+/4+ for 3 days, rapid swelling, weight gain >2kg/week\n\n2. Dangerous Symptoms:\n- Severe abdominal pain with vomiting/fever (peritonitis risk)\n- Headache, vomiting, drowsiness (high BP)\n- Difficulty breathing\n- Cold hands and feet\n- Red painful skin patches (cellulitis)\n- Very little/no urine\n\n3. Infection Risk:\n- Chickenpox/measles exposure while on steroids\n- High fever not responding to treatment\n\n4. Medication Emergency:\n- If diarrhea/vomiting: STOP Lasix and Enalapril immediately (dehydration can injure kidneys)\n- NEVER stop steroids suddenly (adrenal crisis risk)",
        hi: "तुरंत अस्पताल जाएं:\n\n1. रिलैप्स: 3 दिन 3+/4+, तेज सूजन, सप्ताह में >2kg वजन\n\n2. खतरनाक लक्षण:\n- उल्टी/बुखार के साथ गंभीर पेट दर्द\n- सिरदर्द, उल्टी, उनींदापन\n- सांस लेने में कठिनाई\n- ठंडे हाथ-पैर\n\n3. संक्रमण:\n- स्टेरॉयड पर चिकनपॉक्स/खसरा संपर्क\n\n4. दवा आपातकाल:\n- दस्त/उल्टी: Lasix और Enalapril तुरंत बंद\n- स्टेरॉयड कभी अचानक बंद न करें",
      },
      detailed: {
        en: "Emergency presentations in nephrotic syndrome:\n\nPeritonitis: Abdominal pain, fever, vomiting in a relapsing child. Common organism: Streptococcus pneumoniae. Requires IV antibiotics.\n\nHypertensive emergency: Headache, vomiting, seizures. Check BP immediately. May need IV labetalol or nicardipine.\n\nThromboembolic events: Limb pain/swelling, chest pain, dyspnea. NS is a hypercoagulable state. May require anticoagulation.\n\nAcute kidney injury: Oliguria/anuria, often due to hypovolemia from aggressive diuresis or diarrhea. STOP diuretics and ACE inhibitors. IV albumin may be needed.\n\nVaccine-preventable infections: Live vaccines contraindicated on immunosuppression. Ensure varicella vaccination before starting treatment if possible.",
        hi: "नेफ्रोटिक सिंड्रोम में आपातकालीन प्रस्तुतियां:\n\nपेरिटोनाइटिस: पेट दर्द, बुखार, उल्टी। IV एंटीबायोटिक्स आवश्यक।\n\nउच्च रक्तचाप आपातकाल: सिरदर्द, उल्टी, दौरे। तुरंत BP जांचें।\n\nथ्रोम्बोम्बोलिक घटनाएं: अंग दर्द/सूजन। NS हाइपरकोएगुलेबल स्थिति है।\n\nतीव्र गुर्दे की चोट: ऑलिग्युरिया/एन्यूरिया। मूत्रवर्धक और ACE इनहिबिटर बंद करें।",
      },
    },
  },
  {
    id: "understanding-results",
    category: "testing",
    icon: Stethoscope,
    color: "text-blue-600 bg-blue-100",
    title: { en: "Understanding Your Test Results", hi: "अपने परीक्षण परिणाम समझें" },
    content: {
      simple: {
        en: "Urine test: Negative = no protein (good). 3+/4+ for 3 days = relapse (tell doctor). BP: Doctor will tell you if it is normal for your child's age.",
        hi: "मूत्र परीक्षण: नकारात्मक = कोई प्रोटीन नहीं (अच्छा)। 3 दिन 3+/4+ = रिलैप्स (डॉक्टर को बताएं)। BP: डॉक्टर बताएंगे कि बच्चे की उम्र के लिए सामान्य है या नहीं।",
      },
      standard: {
        en: "Urine Dipstick Results:\n- Negative: No protein - NORMAL, child is well\n- Trace: Very small amount - usually normal\n- 1+: Mild - abnormal but not relapse. Common after infections\n- 2+: Moderate - monitor closely but not yet relapse\n- 3+: Heavy (~300 mg/dL) - NEPHROTIC RANGE. If 3 consecutive days = RELAPSE\n- 4+: Very heavy (>2000 mg/dL) - contact doctor immediately\n\nBlood Pressure:\n- Normal: Below 90th percentile for age, sex, and height\n- Elevated: Between 90th-95th percentile\n- Stage 1 HTN: At or above 95th percentile\n- Stage 2 HTN: Very high - needs urgent treatment\n\nYour child's BP is compared to normal values for their exact age and sex.",
        hi: "मूत्र डिपस्टिक परिणाम:\n- नकारात्मक: कोई प्रोटीन नहीं - सामान्य\n- ट्रेस: बहुत कम - सामान्यतः ठीक\n- 1+: हल्का - असामान्य लेकिन रिलैप्स नहीं\n- 2+: मध्यम - निगरानी करें\n- 3+: भारी (~300 mg/dL) - नेफ्रोटिक रेंज। 3 दिन = रिलैप्स\n- 4+: बहुत भारी - तुरंत डॉक्टर\n\nरक्तचाप:\n- सामान्य: उम्र के 90वीं प्रतिशतक से नीचे\n- बढ़ा हुआ: 90वीं-95वीं प्रतिशतक\n- स्टेज 1: 95वीं प्रतिशतक पर या ऊपर\n- स्टेज 2: बहुत उच्च - तत्काल उपचार",
      },
      detailed: {
        en: "Detailed interpretation guide:\n\nUrine protein quantification:\n- Spot urine protein/creatinine ratio (UPCR) >2 mg/mg confirms nephrotic range\n- 24hr urine protein >40 mg/m2/hr is gold standard\n- Dipstick correlates: Trace ~15-30, 1+ ~30, 2+ ~100, 3+ ~300, 4+ >2000 mg/dL\n\nBP Classification (AAP 2017):\n- Normal: <90th percentile AND <120/80\n- Elevated: >=90th to <95th percentile OR 120/80 to <95th\n- Stage 1 HTN: >=95th to <95th+12 OR 130/80-139/89\n- Stage 2 HTN: >=95th+12 OR >=140/90\n\nFor >=13 years, adult thresholds apply:\n- Normal <120/<80, Elevated 120-129/<80, Stage 1 130-139/80-89, Stage 2 >=140/>=90",
        hi: "विस्तृत व्याख्या:\n\nमूत्र प्रोटीन मात्रा:\n- UPCR >2 mg/mg नेफ्रोटिक रेंज की पुष्टि करता है\n- 24hr मूत्र प्रोटीन >40 mg/m2/hr स्वर्ण मानक है\n\nBP वर्गीकरण (AAP 2017):\n- सामान्य: <90वीं प्रतिशतक\n- बढ़ा: >=90वीं से <95वीं\n- स्टेज 1: >=95वीं से <95वीं+12\n- स्टेज 2: >=95वीं+12 या >=140/90",
      },
    },
  },
  {
    id: "medications-guide",
    category: "treatment",
    icon: Pill,
    color: "text-purple-600 bg-purple-100",
    title: { en: "Medications & Steroids", hi: "दवाइयाँ और स्टेरॉयड" },
    content: {
      simple: {
        en: "Prednisolone is the main medicine. NEVER stop it suddenly. Give with milk. Side effects (round face, appetite) go away when medicine reduces. If child vomits within 30 minutes, give dose again.",
        hi: "प्रेडनिसोलोन मुख्य दवा है। कभी अचानक बंद न करें। दूध के साथ दें। दुष्प्रभाव (गोल चेहरा, भूख) दवा कम होने पर जाते हैं। 30 मिनट में उल्टी हो तो खुराक दोहराएं।",
      },
      standard: {
        en: "Prednisolone:\n- Primary treatment, stops protein leak in 90% of children\n- NEVER stop suddenly (causes adrenal crisis)\n- If child vomits within 30 minutes, repeat the dose\n- Give with milk/food to protect stomach\n- Use honey/sugar to mask bitter taste\n\nSide effects (reduce when dose lowers):\n- Round 'moon' face, increased appetite\n- Weight gain, mood changes (irritability)\n- These are drug effects, NOT discipline problems\n\nOther medicines:\n- Penicillin: Prevent infections during relapse\n- Ranitidine: Protect stomach\n- Diuretics (Lasix): Reduce swelling - STOP if diarrhea/vomiting\n- Levamisole: For frequent relapsers\n\nVaccines: AVOID live vaccines on steroids (oral polio, MMR, chickenpox)",
        hi: "प्रेडनिसोलोन:\n- मुख्य उपचार, 90% बच्चों में प्रोटीन रिसाव रोकता है\n- कभी अचानक बंद न करें\n- 30 मिनट में उल्टी हो तो खुराक दोहराएं\n- दूध/भोजन के साथ दें\n\nदुष्प्रभाव:\n- गोल चेहरा, बढ़ी भूख, वजन बढ़ना, मूड बदलना\n- ये दवा प्रभाव हैं, अनुशासन समस्या नहीं\n\nअन्य दवाएं:\n- Lasix: सूजन कम करें - दस्त/उल्टी पर बंद\n\nटीके: स्टेरॉयड पर जीवित टीके से बचें",
      },
      detailed: {
        en: "Pharmacotherapy of nephrotic syndrome:\n\nFirst episode: Prednisolone 2mg/kg/day (max 60mg) for 6 weeks, then 1.5mg/kg alternate day (max 40mg) for 6 weeks. Modified AIIMS protocol may use 3+3+3 month regimen.\n\nRelapse treatment: Daily prednisolone until protein-free for 3 days, then alternate day for 4 weeks.\n\nFrequent relapsers (>2 relapses in 6 months or >4 in 12 months):\n- Levamisole 2.5mg/kg alternate days\n- Cyclophosphamide 2mg/kg/day for 8-12 weeks\n- Mycophenolate mofetil (MMF)\n- Tacrolimus (calcineurin inhibitor)\n- Rituximab for SDNS/FRNS\n\nSteroid-resistant: Cyclosporine or tacrolimus first-line. Biopsy recommended.",
        hi: "नेफ्रोटिक सिंड्रोम की फार्माकोथेरेपी:\n\nपहला एपिसोड: प्रेडनिसोलोन 2mg/kg/day (अधिकतम 60mg) 6 सप्ताह, फिर 1.5mg/kg वैकल्पिक दिन 6 सप्ताह।\n\nबार-बार रिलैप्स (6 महीने में >2 या 12 महीने में >4):\n- लेवामिसोल 2.5mg/kg\n- साइक्लोफॉस्फामाइड 2mg/kg/day 8-12 सप्ताह\n- माइकोफेनोलेट, टैक्रोलिमस, रिटक्सिमैब",
      },
    },
  },
  {
    id: "relapse-remission",
    category: "basics",
    icon: Activity,
    color: "text-blue-600 bg-blue-100",
    title: { en: "Relapse & Remission", hi: "रिलैप्स और रिमिशन" },
    content: {
      simple: {
        en: "Remission = Urine shows no protein for 3 days (good!). Relapse = Protein 3+ for 3 days (needs medicine). 1+ or 2+ for a few days is NOT relapse. Most children are cured after some years.",
        hi: "रिमिशन = 3 दिन पेशाब में प्रोटीन नहीं (अच्छा!)। रिलैप्स = 3 दिन 3+ प्रोटीन (दवा चाहिए)। कुछ दिन 1+/2+ रिलैप्स नहीं है। अधिकांश बच्चे कुछ वर्षों बाद ठीक हो जाते हैं।",
      },
      standard: {
        en: "Remission: Urine shows nil/trace protein for 3 consecutive days. Resume normal diet, activity, schooling.\n\nRelapse: Protein 3+/4+ for 3 consecutive days. Swelling may return. Contact doctor to restart treatment.\n\nNOT a relapse: 1+/2+ for a few days after infection is normal.\n\nTriggers: Minor infections, sometimes no obvious cause.\n\nFrequency: Varies. >3 relapses/year may need additional medicines.\n\nThe 4-Day Rule: Test daily. A single high reading may be from illness. Only 3 consecutive days of 3+/4+ = relapse.\n\nLong-term: For steroid-responsive children, NO risk of kidney failure. Most are completely cured after several years.",
        hi: "रिमिशन: लगातार 3 दिन नकारात्मक/ट्रेस = रिमिशन। सामान्य जीवन फिर से शुरू करें।\n\nरिलैप्स: लगातार 3 दिन 3+/4+। इलाज शुरू करें।\n\nरिलैप्स नहीं: संक्रमण के बाद कुछ दिन 1+/2+ सामान्य है।\n\nदीर्घकालिक: स्टेरॉयड-प्रतिक्रियाशील बच्चों में गुर्दे की विफलता का कोई खतरा नहीं। अधिकांश पूरी तरह ठीक होते हैं।",
      },
      detailed: {
        en: "Definitions (ISPN/AIIMS protocol):\n- Remission: Dipstick negative/trace for 3 consecutive days\n- Relapse: Dipstick 3+/4+ for 3 consecutive days after prior remission\n- Frequent relapser (FRNS): >=2 relapses in first 6 months or >=4 in any 12 months\n- Steroid dependent (SDNS): 2 consecutive relapses during taper or within 14 days of stopping\n- Steroid resistant (SRNS): No remission after 4 weeks of daily steroids\n\nNatural history: SSNS (steroid-sensitive NS) has excellent prognosis. 60-70% will relapse but most eventually stop relapsing. No progression to CKD in SSNS. SRNS requires biopsy and has variable prognosis depending on histology.",
        hi: "परिभाषाएं (ISPN/AIIMS प्रोटोकॉल):\n- रिमिशन: 3 दिन नकारात्मक/ट्रेस\n- रिलैप्स: पूर्व रिमिशन के बाद 3 दिन 3+/4+\n- FRNS: 6 महीने में >=2 या 12 महीने में >=4 रिलैप्स\n- SDNS: टेपर के दौरान या रोकने के 14 दिन में 2 रिलैप्स\n- SRNS: 4 सप्ताह दैनिक स्टेरॉयड के बाद रिमिशन नहीं\n\nSSNS का उत्कृष्ट पूर्वानुमान है। CKD में प्रगति नहीं।",
      },
    },
  },
]

// FAQ data for chatbot
const faqs = [
  { q: "Can my child go to school?", qHi: "क्या मेरा बच्चा स्कूल जा सकता है?", a: "Yes! During remission, your child should attend school normally. Only during active relapse with significant swelling should they rest at home.", aHi: "हाँ! रिमिशन में बच्चा सामान्य रूप से स्कूल जाए। केवल गंभीर सूजन वाले रिलैप्स में घर पर आराम करें।" },
  { q: "Is nephrotic syndrome contagious?", qHi: "क्या नेफ्रोटिक सिंड्रोम संक्रामक है?", a: "No, nephrotic syndrome is NOT contagious. It cannot spread from one person to another. It is an immune system issue.", aHi: "नहीं, नेफ्रोटिक सिंड्रोम संक्रामक नहीं है। यह एक प्रतिरक्षा प्रणाली की समस्या है।" },
  { q: "Will my child need steroids forever?", qHi: "क्या मेरे बच्चे को हमेशा स्टेरॉयड चाहिए?", a: "No. Most children with steroid-sensitive nephrotic syndrome eventually stop relapsing. Many are completely cured by their teenage years.", aHi: "नहीं। अधिकांश बच्चे अंततः रिलैप्स बंद कर देते हैं। कई किशोरावस्था तक पूरी तरह ठीक हो जाते हैं।" },
  { q: "What if my child vomits the medicine?", qHi: "अगर बच्चा दवा उल्टी कर दे?", a: "If your child vomits within 30 minutes of taking prednisolone, repeat the full dose. If after 30 minutes, do not repeat.", aHi: "अगर 30 मिनट के भीतर उल्टी हो, पूरी खुराक दोहराएं। 30 मिनट बाद हो तो न दोहराएं।" },
  { q: "Can my child get vaccinated?", qHi: "क्या बच्चे को टीका लग सकता है?", a: "AVOID live vaccines (oral polio, MMR, chickenpox) while on steroids or immunosuppressive drugs. Inactivated vaccines are safe but may be less effective.", aHi: "स्टेरॉयड या इम्यूनोसप्रेसिव दवाओं पर जीवित टीके (पोलियो, MMR, चिकनपॉक्स) से बचें। निष्क्रिय टीके सुरक्षित हैं।" },
  { q: "Why is my child gaining weight on steroids?", qHi: "स्टेरॉयड से बच्चे का वजन क्यों बढ़ रहा है?", a: "Increased appetite and weight gain are common steroid side effects. This is temporary and reverses when the dose is reduced. Limit sugary/fried foods and encourage physical activity.", aHi: "भूख बढ़ना और वजन बढ़ना स्टेरॉयड के सामान्य दुष्प्रभाव हैं। खुराक कम होने पर ठीक होते हैं। मीठे/तले भोजन सीमित करें और व्यायाम करें।" },
]

// Category groups
const categories = [
  { id: "basics", label: { en: "Basics", hi: "मूल बातें" }, icon: BookOpen },
  { id: "testing", label: { en: "Testing", hi: "परीक्षण" }, icon: TestTube },
  { id: "treatment", label: { en: "Treatment", hi: "उपचार" }, icon: Pill },
  { id: "lifestyle", label: { en: "Lifestyle", hi: "जीवनशैली" }, icon: Dumbbell },
  { id: "emergency", label: { en: "Emergency", hi: "आपातकाल" }, icon: AlertTriangle },
]

export function EducationHubScreen() {
  const { language, setCurrentScreen, isVoiceEnabled } = useApp()
  const t = getTranslations(language)
  const isEn = language === "en" || !["hi", "bn", "ta", "pa"].includes(language)

  const [selectedArticle, setSelectedArticle] = useState<EducationArticle | null>(null)
  const [literacyLevel, setLiteracyLevel] = useState<LiteracyLevel>("standard")
  const [searchQuery, setSearchQuery] = useState("")
  const [showChatbot, setShowChatbot] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // TTS
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined") return
    window.speechSynthesis?.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = voiceLanguageMap[language] || "en-IN"
    utterance.rate = 0.85
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis?.speak(utterance)
  }, [language])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // Filtered articles
  const filteredArticles = articles.filter((a) => {
    const matchesSearch = searchQuery === "" ||
      a.title.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title.hi.includes(searchQuery)
    const matchesCategory = !selectedCategory || a.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-card safe-top">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => setCurrentScreen("dashboard")}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {isEn ? "Education Hub" : "शिक्षा केंद्र"}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowChatbot(!showChatbot)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              showChatbot ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEn ? "Search topics..." : "विषय खोजें..."}
            className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-4">
        {/* Chatbot Section */}
        {showChatbot && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="bg-primary/5 px-4 py-3 flex items-center justify-between border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                {isEn ? "Ask a Question" : "सवाल पूछें"}
              </h3>
              <button type="button" onClick={() => setShowChatbot(false)} className="text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-border rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{isEn ? faq.q : faq.qHi}</span>
                    {expandedFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  </button>
                  {expandedFaq === i && (
                    <div className="px-4 pb-3 border-t border-border pt-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">{isEn ? faq.a : faq.aHi}</p>
                      <button
                        type="button"
                        onClick={() => speak(isEn ? faq.a : faq.aHi)}
                        className="mt-2 flex items-center gap-1 text-xs text-primary font-medium"
                      >
                        <Volume2 className="w-3 h-3" />
                        {isEn ? "Listen" : "सुनें"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Literacy Level Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{isEn ? "Level:" : "स्तर:"}</span>
          {(["simple", "standard", "detailed"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setLiteracyLevel(level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                literacyLevel === level
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {level === "simple" ? (isEn ? "Simple" : "सरल") :
               level === "standard" ? (isEn ? "Standard" : "मानक") :
               (isEn ? "Detailed" : "विस्तृत")}
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              !selectedCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {isEn ? "All" : "सभी"}
          </button>
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-all ${
                  selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                {isEn ? cat.label.en : cat.label.hi}
              </button>
            )
          })}
        </div>

        {/* Articles */}
        {selectedArticle ? (
          /* Article Detail View */
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <button
                type="button"
                onClick={() => { setSelectedArticle(null); stopSpeaking() }}
                className="flex items-center gap-2 text-sm text-primary mb-3"
              >
                <ChevronLeft className="w-4 h-4" />
                {isEn ? "Back to topics" : "विषयों पर वापस"}
              </button>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${selectedArticle.color} flex items-center justify-center`}>
                  <selectedArticle.icon className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  {isEn ? selectedArticle.title.en : selectedArticle.title.hi}
                </h2>
              </div>
            </div>

            {/* Voice narration button */}
            <div className="px-5 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking()
                  } else {
                    const content = selectedArticle.content[literacyLevel]
                    speak(isEn ? content.en : content.hi)
                  }
                }}
                className={`w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl ${
                  isSpeaking
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary"
                } transition-colors`}
              >
                {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                <span className="font-semibold">
                  {isSpeaking
                    ? (isEn ? "Stop Narration" : "कथन रोकें")
                    : (isEn ? "Listen to this article" : "यह लेख सुनें")}
                </span>
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="bg-muted rounded-2xl p-5">
                <p className="text-base text-foreground leading-relaxed whitespace-pre-line">
                  {isEn
                    ? selectedArticle.content[literacyLevel].en
                    : selectedArticle.content[literacyLevel].hi}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Article Grid */
          <div className="space-y-3">
            {filteredArticles.map((article) => {
              const Icon = article.icon
              return (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => setSelectedArticle(article)}
                  className="w-full bg-card rounded-xl p-4 border border-border flex items-center gap-4 hover:border-primary/30 active:scale-[0.99] transition-all text-left"
                >
                  <div className={`w-12 h-12 rounded-xl ${article.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">
                      {isEn ? article.title.en : article.title.hi}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{article.category}</p>
                  </div>
                  <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              )
            })}

            {filteredArticles.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isEn ? "No articles found" : "कोई लेख नहीं मिला"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <FloatingAssistant />
    </div>
  )
}
