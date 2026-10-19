"use client"

import { useApp, getTranslations } from "@/lib/app-context"
import { LargeButton } from "../large-button"
import { FloatingAssistant } from "../floating-assistant"
import {
  ChevronLeft,
  Volume2,
  Play,
  Heart,
  TestTube,
  Utensils,
  AlertTriangle,
  X,
  Pill,
  Activity,
} from "lucide-react"
import { useState } from "react"

interface EducationTopic {
  id: string
  titleKey: "whatIsKidneyDisease" | "howToDoUrineTest" | "foodToEat" | "whenToGoHospital" | "medications" | "relapseRemission"
  icon: typeof Heart
  color: string
  content: {
    en: string
    hi: string
    bn: string
    ta: string
    pa: string
  }
}

const topics: EducationTopic[] = [
  {
    id: "kidney-disease",
    titleKey: "whatIsKidneyDisease",
    icon: Heart,
    color: "text-destructive bg-destructive/10",
    content: {
      en: "What is Nephrotic Syndrome?\n\nNephrotic syndrome is a kidney condition where the tiny filters in the kidneys (glomeruli) become 'leaky,' allowing large amounts of protein (albumin) to spill into the urine. This is called proteinuria.\n\nNormally, albumin acts like a sponge, holding water inside blood vessels. When too much protein is lost in the urine, the blood protein level drops. Without enough of this 'sponge effect,' fluid leaks into the body tissues, causing swelling (oedema) around the eyes, face, feet, ankles, and abdomen.\n\nIn about 90% of children aged 2-6, this is 'minimal change' nephrotic syndrome, meaning the kidneys show no permanent damage. With correct treatment (prednisolone), the protein leak stops.\n\nThe disease is NOT caused by infection, diet, or family lifestyle. It is not contagious. With proper management, most children are completely cured after several years.",
      hi: "नेफ्रोटिक सिंड्रोम क्या है?\n\nनेफ्रोटिक सिंड्रोम गुर्दे की एक स्थिति है जिसमें गुर्दे के छोटे फिल्टर (ग्लोमेरुली) 'लीक' हो जाते हैं, जिससे बड़ी मात्रा में प्रोटीन (एल्ब्यूमिन) पेशाब में आने लगता है। इसे प्रोटीनमेह कहते हैं।\n\nसामान्य रूप से, एल्ब्यूमिन एक स्पंज की तरह काम करता है, जो रक्त वाहिकाओं के अंदर पानी रखता है। जब पेशाब में बहुत अधिक प्रोटीन नष्ट हो जाता है, तो रक्त प्रोटीन का स्तर गिर जाता है। पर्याप्त 'स्पंज प्रभाव' के बिना, तरल पदार्थ शरीर के ऊतकों में रिसने लगता है, जिससे आंखों, चेहरे, पैरों और पेट के आसपास सूजन (एडिमा) होती है।\n\n2-6 वर्ष की आयु के लगभग 90% बच्चों में, यह 'मिनिमल चेंज' नेफ्रोटिक सिंड्रोम होता है, जिसका अर्थ है कि गुर्दे को कोई स्थायी क्षति नहीं होती। सही उपचार (प्रेडनिसोलोन) से प्रोटीन का रिसाव बंद हो जाता है।\n\nयह बीमारी संक्रमण, आहार या पारिवारिक जीवनशैली के कारण नहीं होती। यह संक्रामक नहीं है। उचित प्रबंधन से, अधिकांश बच्चे कई वर्षों बाद पूरी तरह ठीक हो जाते हैं।",
      bn: "নেফ্রোটিক সিন্ড্রোম কী?\n\nনেফ্রোটিক সিন্ড্রোম হল কিডনির একটি অবস্থা যেখানে কিডনির ক্ষুদ্র ফিল্টার (গ্লোমেরুলি) 'ছিদ্রযুক্ত' হয়ে যায়, ফলে প্রচুর পরিমাণে প্রোটিন (অ্যালবুমিন) মূত্রে বেরিয়ে যায়।\n\nসঠিক চিকিৎসায় (প্রেডনিসোলোন) প্রোটিনের ক্ষরণ বন্ধ হয়। ৯০% শিশুর ক্ষেত্রে কিডনির কোনো স্থায়ী ক্ষতি হয় না।",
      ta: "நெஃப்ரோடிக் சிண்ட்ரோம் என்றால் என்ன?\n\nநெஃப்ரோடிக் சிண்ட்ரோம் என்பது சிறுநீரக நிலை ஆகும், இதில் சிறுநீரகங்களின் சிறிய வடிகட்டிகள் (குளோமெருலி) 'கசிவு' ஆகி, அதிக அளவு புரதம் (அல்புமின்) சிறுநீரில் வெளியேறும்.\n\nசரியான சிகிச்சையுடன் (ப்ரெட்னிசோலோன்) புரத கசிவு நிறுத்தப்படும்.",
      pa: "ਨੈਫਰੋਟਿਕ ਸਿੰਡਰੋਮ ਕੀ ਹੈ?\n\nਨੈਫਰੋਟਿਕ ਸਿੰਡਰੋਮ ਗੁਰਦੇ ਦੀ ਇੱਕ ਸਥਿਤੀ ਹੈ ਜਿਸ ਵਿੱਚ ਗੁਰਦੇ ਦੇ ਛੋਟੇ ਫਿਲਟਰ (ਗਲੋਮੇਰੁਲੀ) 'ਲੀਕ' ਹੋ ਜਾਂਦੇ ਹਨ।\n\nਸਹੀ ਇਲਾਜ ਨਾਲ ਜ਼ਿਆਦਾਤਰ ਬੱਚੇ ਪੂਰੀ ਤਰ੍ਹਾਂ ਠੀਕ ਹੋ ਜਾਂਦੇ ਹਨ।",
    },
  },
  {
    id: "urine-test",
    titleKey: "howToDoUrineTest",
    icon: TestTube,
    color: "text-primary bg-primary/10",
    content: {
      en: "How to Test Urine at Home (Dipstick Method)\n\nAlways use the FIRST MORNING urine - it is the most concentrated and gives the most accurate reading.\n\nSteps:\n1. Check the expiry date on the dipstick bottle\n2. Collect fresh urine in a clean, dry container\n3. Remove ONE strip from the bottle and close the lid tightly\n4. Dip the strip briefly (1 second) into the urine\n5. Remove the strip and wipe the edge on the container rim\n6. Wait exactly 60 seconds (use a timer)\n7. Compare the protein pad color to the chart on the bottle\n\nReading Results:\n- Nil (Yellow): No protein - GOOD\n- Trace: Very small amount - usually OK\n- 1+ (Light green): Mild proteinuria - monitor\n- 2+ (Green): Moderate - monitor closely, not yet relapse\n- 3+ (Dark green): Heavy - if 3 days in a row, this is RELAPSE\n- 4+ (Darkest green): Very heavy - contact doctor\n\nIMPORTANT: 1+ or 2+ for a few days after an infection is normal and may go away on its own. Do NOT panic. Only 3+ or 4+ for 3 consecutive days means a relapse.\n\nRecord every result in this app daily!",
      hi: "घर पर मूत्र परीक्षण कैसे करें (डिपस्टिक विधि)\n\nहमेशा सुबह का पहला मूत्र उपयोग करें - यह सबसे गाढ़ा होता है और सबसे सटीक रीडिंग देता है।\n\nचरण:\n1. डिपस्टिक बोतल पर समाप्ति तिथि जांचें\n2. साफ, सूखे बर्तन में ताज़ा मूत्र इकट्ठा करें\n3. बोतल से एक पट्टी निकालें और ढक्कन कसकर बंद करें\n4. पट्टी को 1 सेकंड के लिए मूत्र में डुबोएं\n5. पट्टी निकालें और किनारा पोंछें\n6. ठीक 60 सेकंड प्रतीक्षा करें (टाइमर का उपयोग करें)\n7. बोतल पर दिए चार्ट से प्रोटीन पैड के रंग की तुलना करें\n\nपरिणाम पढ़ना:\n- शून्य (पीला): कोई प्रोटीन नहीं - अच्छा\n- ट्रेस: बहुत कम - आमतौर पर ठीक\n- 1+ (हल्का हरा): हल्का प्रोटीनमेह - निगरानी करें\n- 2+ (हरा): मध्यम - करीब से निगरानी, अभी रिलैप्स नहीं\n- 3+ (गहरा हरा): भारी - लगातार 3 दिन हो तो रिलैप्स\n- 4+ (सबसे गहरा हरा): बहुत भारी - डॉक्टर से संपर्क करें\n\nमहत्वपूर्ण: संक्रमण के बाद कुछ दिन 1+ या 2+ सामान्य है। घबराएं नहीं। केवल 3+ या 4+ लगातार 3 दिनों तक रिलैप्स है।\n\nहर परिणाम रोज़ इस ऐप में दर्ज करें!",
      bn: "বাড়িতে মূত্র পরীক্ষা কীভাবে করবেন\n\nসবসময় সকালের প্রথম মূত্র ব্যবহার করুন - এটি সবচেয়ে ঘনীভূত।\n\nপদক্ষেপ:\n1. ডিপস্টিক বোতলের মেয়াদ পরীক্ষা করুন\n2. পরিষ্কার পাত্রে তাজা মূত্র সংগ্রহ করুন\n3. 1 সেকেন্ড ডুবান\n4. 60 সেকেন্ড অপেক্ষা করুন\n5. বোতলের চার্টের সাথে তুলনা করুন\n\nগুরুত্বপূর্ণ: শুধুমাত্র 3+ বা 4+ পরপর 3 দিন মানে রিল্যাপস।",
      ta: "வீட்டில் சிறுநீர் பரிசோதனை எப்படி செய்வது\n\nகாலை முதல் சிறுநீரை எப்போதும் பயன்படுத்தவும்.\n\nபடிகள்:\n1. காலாவதி தேதியை சரிபாருங்கள்\n2. சுத்தமான பாத்திரத்தில் சேகரிக்கவும்\n3. 1 வினாடி நனைக்கவும்\n4. 60 வினாடிகள் காத்திருங்கள்\n5. சார்ட்டுடன் ஒப்பிடுங்கள்\n\nமுக்கியம்: 3+ அல்லது 4+ தொடர்ந்து 3 நாட்கள் மட்டுமே மறுபிறப்பு.",
      pa: "ਘਰ ਵਿੱਚ ਪਿਸ਼ਾਬ ਟੈਸਟ ਕਿਵੇਂ ਕਰੀਏ\n\nਹਮੇਸ਼ਾ ਸਵੇਰੇ ਦਾ ਪਹਿਲਾ ਪਿਸ਼ਾਬ ਵਰਤੋ।\n\nਕਦਮ:\n1. ਮਿਆਦ ਦੀ ਤਾਰੀਖ ਚੈੱਕ ਕਰੋ\n2. ਸਾਫ਼ ਬਰਤਨ ਵਿੱਚ ਇਕੱਠਾ ਕਰੋ\n3. 1 ਸਕਿੰਟ ਡੁਬੋ\n4. 60 ਸਕਿੰਟ ਉਡੀਕ ਕਰੋ\n5. ਚਾਰਟ ਨਾਲ ਤੁਲਨਾ ਕਰੋ\n\nਮਹੱਤਵਪੂਰਨ: ਸਿਰਫ਼ 3+ ਜਾਂ 4+ ਲਗਾਤਾਰ 3 ਦਿਨ ਰਿਲੈਪਸ ਹੈ।",
    },
  },
  {
    id: "food",
    titleKey: "foodToEat",
    icon: Utensils,
    color: "text-success bg-success/10",
    content: {
      en: "Diet for Nephrotic Syndrome\n\nDuring Relapse (when swollen):\n- RESTRICT SALT: Do not add extra salt to food. Avoid processed foods, chips, pickles, and fast food. Salt worsens swelling by pulling more fluid into tissues.\n- Normal protein: Give a diet with enough proteins - milk, dal, chana, soyabean, eggs, meat and fish. Extra protein while passing large amounts in urine.\n- Limit fluids ONLY if doctor advises\n\nDuring Remission (no swelling):\n- Normal, nutritious diet - no restrictions needed!\n- Resume usual salt intake\n- Your child should eat as a normal child\n\nWhile on Steroids (Prednisolone):\n- Children tend to eat MORE when on steroids\n- Limit sugary foods, butter, oil, fried foods, ice cream\n- Encourage fruits, vegetables, and physical activity\n- Vitamin D supplements may be needed for prolonged steroid use\n- Weight gain is a side effect - it will reduce when steroids are lowered\n\nIMPORTANT: Do NOT give a high-protein diet thinking it will replace lost protein. This is a common misconception. High-protein diets are poorly tolerated and contain high salt that worsens swelling.",
      hi: "नेफ्रोटिक सिंड्रोम के लिए आहार\n\nरिलैप्स के दौरान (जब सूजन हो):\n- नमक सीमित करें: भोजन में अतिरिक्त नमक न डालें। प्रोसेस्ड फूड, चिप्स, अचार और फास्ट फूड से बचें।\n- सामान्य प्रोटीन: पर्याप्त प्रोटीन वाला आहार दें - दूध, दाल, चना, सोयाबीन, अंडे, मांस और मछली।\n- तरल पदार्थ सीमित करें केवल डॉक्टर की सलाह पर\n\nरिमिशन के दौरान (कोई सूजन नहीं):\n- सामान्य, पौष्टिक आहार - कोई प्रतिबंध नहीं!\n- सामान्य नमक सेवन फिर से शुरू करें\n\nस्टेरॉयड (प्रेडनिसोलोन) लेते समय:\n- बच्चे अधिक खाते हैं\n- मीठे खाद्य पदार्थ, मक्खन, तेल, तले हुए भोजन सीमित करें\n- फल, सब्जियां और शारीरिक गतिविधि को प्रोत्साहित करें\n- विटामिन D सप्लीमेंट की आवश्यकता हो सकती है\n\nमहत्वपूर्ण: खोए हुए प्रोटीन की भरपाई के लिए उच्च प्रोटीन आहार न दें। यह एक आम गलतफहमी है।",
      bn: "ডায়েট পরামর্শ\n\nরিল্যাপসের সময়: লবণ সীমিত করুন। প্রোটিন স্বাভাবিক রাখুন।\nরেমিশনে: স্বাভাবিক খাবার খান।\nস্টেরয়েড নেওয়ার সময়: চিনি ও তেল কম খান।",
      ta: "உணவு ஆலோசனை\n\nமறுபிறப்பின் போது: உப்பு குறைக்கவும்.\nதணிவின் போது: சாதாரண உணவு.\nஸ்டீராய்டு எடுக்கும் போது: சர்க்கரை குறைக்கவும்.",
      pa: "ਖੁਰਾਕ ਸਲਾਹ\n\nਰਿਲੈਪਸ ਦੌਰਾਨ: ਲੂਣ ਘਟਾਓ।\nਰਿਮਿਸ਼ਨ ਦੌਰਾਨ: ਆਮ ਖੁਰਾਕ।\nਸਟੀਰੌਇਡ ਲੈਂਦੇ ਸਮੇਂ: ਮਿੱਠਾ ਘਟਾਓ।",
    },
  },
  {
    id: "hospital",
    titleKey: "whenToGoHospital",
    icon: AlertTriangle,
    color: "text-warning bg-warning/10",
    content: {
      en: "Red Flags - Go to Hospital IMMEDIATELY if:\n\n1. RELAPSE SIGNS:\n   - Protein 3+ or 4+ for 3 consecutive days\n   - Rapidly increasing swelling (face, legs, abdomen)\n   - Weight gain of more than 2-3 kg in a week\n\n2. DANGEROUS SYMPTOMS:\n   - Severe abdominal pain with vomiting, diarrhea, and fever (could be peritonitis)\n   - Headache, vomiting, and drowsiness (could be high blood pressure)\n   - Difficulty breathing or rapid breathing\n   - Cold hands and feet (poor circulation)\n   - Red, painful skin patches (cellulitis)\n   - Very little or no urine output\n\n3. INFECTION RISKS:\n   - Exposure to chickenpox or measles while on steroids\n   - High fever that does not respond to basic treatment\n   - Any serious illness while on immunosuppressive drugs\n\n4. MEDICATION EMERGENCIES:\n   - If your child has diarrhea or vomiting: STOP diuretics (Lasix) and ACE inhibitors (Enalapril) immediately. Continuing these while dehydrated can injure the kidneys.\n   - Never stop steroids suddenly - this can cause a dangerous adrenal crisis.\n\nIMPORTANT: Treat relapses early. Once the child develops gross swelling with fluid in the abdomen, management becomes much more difficult and serious complications may occur.",
      hi: "खतरे के संकेत - तुरंत अस्पताल जाएं अगर:\n\n1. रिलैप्स के संकेत:\n   - लगातार 3 दिनों तक प्रोटीन 3+ या 4+\n   - तेजी से बढ़ती सूजन (चेहरा, पैर, पेट)\n   - एक हफ्ते में 2-3 किलो से अधिक वजन बढ़ना\n\n2. खतरनाक लक्षण:\n   - उल्टी, दस्त और बुखार के साथ गंभीर पेट दर्द (पेरिटोनाइटिस हो सकता है)\n   - सिरदर्द, उल्टी और उनींदापन (उच्च रक्तचाप हो सकता है)\n   - सांस लेने में कठिनाई या तेज सांस\n   - ठंडे हाथ-पैर (खराब रक्त प्रवाह)\n   - लाल, दर्दनाक त्वचा (सेल्युलाइटिस)\n   - बहुत कम या कोई पेशाब नहीं\n\n3. संक्रमण का खतरा:\n   - स्टेरॉयड लेते समय चिकनपॉक्स या खसरे का संपर्क\n   - तेज बुखार जो इलाज से न उतरे\n\n4. दवा की आपातकालीन स्थिति:\n   - दस्त या उल्टी होने पर: मूत्रवर्धक (लेसिक्स) और एसीई अवरोधक (एनालाप्रिल) तुरंत बंद करें।\n   - स्टेरॉयड कभी अचानक बंद न करें।\n\nमहत्वपूर्ण: रिलैप्स का जल्दी इलाज करें।",
      bn: "লাল পতাকা - এখনই হাসপাতালে যান:\n\n- পরপর 3 দিন 3+ বা 4+ প্রোটিন\n- দ্রুত বাড়তে থাকা ফোলা\n- পেটে ব্যথা, বমি, জ্বর\n- শ্বাস নিতে সমস্যা\n- চিকেনপক্স এক্সপোজার\n- ডায়রিয়া হলে Lasix বন্ধ করুন",
      ta: "அபாய அறிகுறிகள்:\n\n- தொடர்ந்து 3 நாட்கள் 3+ அல்லது 4+ புரதம்\n- வேகமாக அதிகரிக்கும் வீக்கம்\n- வயிற்றுவலி, வாந்தி, காய்ச்சல்\n- சுவாசிக்க சிரமம்\n- வயிற்றுப்போக்கு ஏற்பட்டால் Lasix நிறுத்துங்கள்",
      pa: "ਖ਼ਤਰੇ ਦੇ ਸੰਕੇਤ:\n\n- ਲਗਾਤਾਰ 3 ਦਿਨ 3+ ਜਾਂ 4+ ਪ੍ਰੋਟੀਨ\n- ਤੇਜ਼ੀ ਨਾਲ ਵਧਦੀ ਸੋਜ\n- ਪੇਟ ਦਰਦ, ਉਲਟੀ, ਬੁਖ਼ਾਰ\n- ਸਾਹ ਲੈਣ ਵਿੱਚ ਮੁਸ਼ਕਲ\n- ਦਸਤ ਹੋਣ ਤੇ Lasix ਬੰਦ ਕਰੋ",
    },
  },
  {
    id: "medications",
    titleKey: "medications",
    icon: Pill,
    color: "text-purple-600 bg-purple-100",
    content: {
      en: "Understanding Medications\n\nPrednisolone (Steroids):\nPrednisolone is the primary treatment. It stops the protein leak in 90% of children.\n\n- NEVER stop steroids suddenly - this is dangerous and can cause an adrenal crisis\n- If your child vomits within 30 minutes of taking the dose, repeat the dose\n- If a dose is missed, contact your doctor\n- Give the tablets with milk or food to protect the stomach\n- Use honey, sugar, or jam to mask the bitter taste\n\nDosing schedule:\n- Initial treatment: Daily doses for about 2 weeks until urine becomes protein-free\n- Then alternate day doses for 4-6 weeks, then stopped\n- During minor infections: doctor may increase to daily for 5-7 days\n\nCommon Side Effects (these reduce when dose is lowered):\n- Rounded 'moon' face and increased appetite\n- Weight gain and mood changes (irritability, overactivity)\n- These are drug effects, NOT discipline problems\n- Increased hair growth, acne in older children\n- High blood pressure (monitor regularly)\n\nOther Medications:\n- Penicillin: To prevent serious infections during relapse\n- Ranitidine: To prevent stomach upset from steroids\n- Aspirin: To prevent blood clots (thrombosis)\n- Diuretics (Lasix): To reduce swelling - STOP if diarrhea or vomiting occurs\n- Levamisole, Cyclophosphamide: For frequent relapsers (>3 relapses/year)\n\nVaccinations:\n- AVOID live vaccines (oral polio, MMR, chickenpox) while on steroids\n- Inactive vaccines are safe but may be less effective\n- Always inform your doctor before any vaccination",
      hi: "दवाओं को समझना\n\nप्रेडनिसोलोन (स्टेरॉयड):\nप्रेडनिसोलोन मुख्य उपचार है। यह 90% बच्चों में प्रोटीन रिसाव बंद करता है।\n\n- स्टेरॉयड कभी अचानक बंद न करें - यह खतरनाक है\n- अगर बच्चा दवा लेने के 30 मिनट के भीतर उल्टी करे, तो खुराक दोहराएं\n- खुराक छूट जाए तो डॉक्टर से संपर्क करें\n- गोलियां दूध या भोजन के साथ दें\n- कड़वे स्वाद को छुपाने के लिए शहद या चीनी उपयोग करें\n\nसामान्य दुष्प्रभाव (खुराक कम होने पर कम होते हैं):\n- गोल 'चांद' चेहरा और बढ़ी भूख\n- वजन बढ़ना और मूड में बदलाव\n- ये दवा के प्रभाव हैं, अनुशासन की समस्या नहीं\n\nअन्य दवाएं:\n- पेनिसिलिन: संक्रमण रोकने के लिए\n- रैनिटिडाइन: पेट की सुरक्षा के लिए\n- मूत्रवर्धक (लेसिक्स): सूजन कम करने के लिए - दस्त/उल्टी होने पर बंद करें\n\nटीकाकरण:\n- स्टेरॉयड लेते समय जीवित टीके (पोलियो, MMR, चिकनपॉक्स) से बचें\n- किसी भी टीकाकरण से पहले डॉक्टर को बताएं",
      bn: "ওষুধ বোঝা\n\nপ্রেডনিসোলোন হল প্রধান চিকিৎসা। কখনো হঠাৎ বন্ধ করবেন না।\n\nপার্শ্বপ্রতিক্রিয়া: গোল মুখ, বেশি ক্ষুধা, মেজাজ পরিবর্তন।\nটিকা: স্টেরয়েড নেওয়ার সময় জীবিত টিকা এড়িয়ে চলুন।",
      ta: "மருந்துகளை புரிந்துகொள்ளுதல்\n\nப்ரெட்னிசோலோன் முதன்மை சிகிச்சை. திடீரென நிறுத்த வேண்டாம்.\n\nபக்க விளைவுகள்: வட்ட முகம், அதிக பசி.\nதடுப்பூசி: ஸ்டீராய்டு நேரத்தில் நேரடி தடுப்பூசிகள் தவிர்க்கவும்.",
      pa: "ਦਵਾਈਆਂ ਸਮਝਣਾ\n\nਪ੍ਰੈਡਨੀਸੋਲੋਨ ਮੁੱਖ ਇਲਾਜ ਹੈ। ਕਦੇ ਅਚਾਨਕ ਬੰਦ ਨਾ ਕਰੋ।\n\nਮਾੜੇ ਪ੍ਰਭਾਵ: ਗੋਲ ਚਿਹਰਾ, ਵੱਧ ਭੁੱਖ।\nਟੀਕਾਕਰਣ: ਸਟੀਰੌਇਡ ਲੈਂਦੇ ਸਮੇਂ ਲਾਈਵ ਟੀਕਿਆਂ ਤੋਂ ਬਚੋ।",
    },
  },
  {
    id: "relapse-remission",
    titleKey: "relapseRemission",
    icon: Activity,
    color: "text-blue-600 bg-blue-100",
    content: {
      en: "Understanding Relapse & Remission\n\nRemission:\nWhen the urine shows 'nil' or 'trace' protein for 3 consecutive days, your child is in REMISSION. This is great news! Resume normal diet, activity, and schooling. Your child should be treated as a normal child.\n\nRelapse:\nA relapse occurs when the nephrotic syndrome becomes active again. Protein in urine goes to 3+ or 4+ for 3 consecutive days, and swelling may return.\n\nIMPORTANT - What is NOT a relapse:\nAfter a cold, fever, or minor infection, urine may show 1+ or 2+ for a few days. This is normal and usually resolves on its own. No treatment change is needed for this mild proteinuria.\n\nWhat triggers a relapse?\n- Often follows a minor infection (cold, sore throat, diarrhea)\n- Sometimes occurs without obvious trigger\n- Each relapse is treated with prednisolone\n\nFrequency of relapses:\n- Some children may not relapse for months or years\n- Some children get one or more relapses per year\n- If more than 3 relapses in one year, the doctor may consider additional medications (levamisole, cyclophosphamide)\n\nThe 4-Day Rule for parents:\nTest urine every morning. A single positive reading may be just a spike due to illness. Only when 3+ or 4+ persists for 3 consecutive days should you contact your doctor to restart treatment.\n\nLong-term outlook:\nFor children who respond to steroids, there is NO risk of kidney failure. Most children are completely cured after several years. They grow up to be normal, healthy adults who can lead perfectly normal lives.",
      hi: "रिलैप्स और रिमिशन को समझना\n\nरिमिशन (छूट):\nजब मूत्र लगातार 3 दिनों तक 'शून्य' या 'ट्रेस' प्रोटीन दिखाता है, तो आपका बच्चा रिमिशन में है। यह अच्छी खबर है! सामान्य आहार, गतिविधि और स्कूल फिर से शुरू करें।\n\nरिलैप्स:\nरिलैप्स तब होता है जब नेफ्रोटिक सिंड्रोम फिर से सक्रिय हो जाता है। लगातार 3 दिनों तक मूत्र में प्रोटीन 3+ या 4+ होता है।\n\nमहत्वपूर्ण - यह रिलैप्स नहीं है:\nसर्दी, बुखार या छोटे संक्रमण के बाद मूत्र कुछ दिनों तक 1+ या 2+ दिखा सकता है। यह सामान्य है और अपने आप ठीक हो जाता है।\n\nरिलैप्स को क्या ट्रिगर करता है?\n- अक्सर छोटे संक्रमण के बाद\n- कभी-कभी बिना किसी स्पष्ट कारण के\n- हर रिलैप्स का इलाज प्रेडनिसोलोन से किया जाता है\n\nमाता-पिता के लिए नियम:\nहर सुबह मूत्र जांच करें। एक सकारात्मक रीडिंग बीमारी के कारण हो सकती है। केवल जब 3+ या 4+ लगातार 3 दिन रहे, तब डॉक्टर से संपर्क करें।\n\nदीर्घकालिक दृष्टिकोण:\nस्टेरॉयड से प्रतिक्रिया करने वाले बच्चों में गुर्दे की विफलता का कोई खतरा नहीं है। अधिकांश बच्चे पूरी तरह ठीक हो जाते हैं।",
      bn: "রিল্যাপস ও রেমিশন বোঝা\n\nরেমিশন: পরপর 3 দিন 'শূন্য' বা 'ট্রেস' প্রোটিন = রেমিশন।\nরিল্যাপস: পরপর 3 দিন 3+ বা 4+ প্রোটিন = রিল্যাপস।\n\n1+ বা 2+ কিছু দিনের জন্য রিল্যাপস নয়।\nস্টেরয়েড সাড়া দেয় এমন শিশুদের কিডনি বিকল হওয়ার ঝুঁকি নেই।",
      ta: "மறுபிறப்பு & தணிவு புரிதல்\n\nதணிவு: தொடர்ந்து 3 நாட்கள் 'பூஜ்யம்' அல்லது 'ட்ரேஸ்' = தணிவு.\nமறுபிறப்பு: தொடர்ந்து 3 நாட்கள் 3+ அல்லது 4+ = மறுபிறப்பு.\n\nஸ்டீராய்டுக்கு பதிலளிக்கும் குழந்தைகளுக்கு சிறுநீரக செயலிழப்பு அபாயம் இல்லை.",
      pa: "ਰਿਲੈਪਸ ਅਤੇ ਰਿਮਿਸ਼ਨ ਸਮਝਣਾ\n\nਰਿਮਿਸ਼ਨ: ਲਗਾਤਾਰ 3 ਦਿਨ 'ਜ਼ੀਰੋ' ਜਾਂ 'ਟ੍ਰੇਸ' = ਰਿਮਿਸ਼ਨ।\nਰਿਲੈਪਸ: ਲਗਾਤਾਰ 3 ਦਿਨ 3+ ਜਾਂ 4+ = ਰਿਲੈਪਸ।\n\n1+ ਜਾਂ 2+ ਕੁਝ ਦਿਨਾਂ ਲਈ ਰਿਲੈਪਸ ਨਹੀਂ ਹੈ।",
    },
  },
]

interface TopicModalProps {
  isOpen: boolean
  onClose: () => void
  topic: EducationTopic | null
  language: "en" | "hi" | "bn" | "ta" | "pa"
}

function TopicModal({ isOpen, onClose, topic, language }: TopicModalProps) {
  const t = getTranslations(language)

  if (!isOpen || !topic) return null

  const Icon = topic.icon

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${topic.color} flex items-center justify-center`}>
              <Icon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-card-foreground">
              {t[topic.titleKey]}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center touch-target"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Video/Image placeholder */}
          <div className="aspect-video bg-muted rounded-2xl mb-6 flex items-center justify-center">
            <button
              type="button"
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors touch-target"
            >
              <Play className="w-10 h-10 text-primary ml-1" />
            </button>
          </div>

          {/* Audio button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-primary/10 text-primary mb-6 touch-target"
          >
            <Volume2 className="w-6 h-6" />
            <span className="text-lg font-semibold">
              {language === "en"
                ? "Listen to this"
                : language === "hi"
                  ? "इसे सुनें"
                  : "Listen"}
            </span>
          </button>

          {/* Text content */}
          <div className="bg-muted rounded-2xl p-5">
            <p className="text-lg text-card-foreground leading-relaxed whitespace-pre-line">
              {topic.content[language]}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border shrink-0">
          <LargeButton onClick={onClose} variant="primary">
            {language === "en" ? "Got it!" : language === "hi" ? "समझ गया!" : "OK!"}
          </LargeButton>
        </div>
      </div>
    </div>
  )
}

export function EducationScreen() {
  const { language, setCurrentScreen } = useApp()
  const t = getTranslations(language)

  const [selectedTopic, setSelectedTopic] = useState<EducationTopic | null>(null)

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 pb-24 safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => setCurrentScreen("dashboard")}
          className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors touch-target"
          aria-label={t.back}
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <h1 className="text-2xl font-bold text-foreground ml-4">{t.education}</h1>
      </div>

      {/* Topics grid */}
      <div className="grid grid-cols-2 gap-4">
        {topics.map((topic) => {
          const Icon = topic.icon

          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => setSelectedTopic(topic)}
              className="bg-card rounded-2xl p-5 border border-border flex flex-col items-center text-center hover:border-primary/50 transition-colors touch-target min-h-[160px]"
            >
              <div
                className={`w-16 h-16 rounded-xl ${topic.color} flex items-center justify-center mb-4`}
              >
                <Icon className="w-8 h-8" />
              </div>
              <span className="text-lg font-semibold text-card-foreground leading-tight text-balance">
                {t[topic.titleKey]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Topic modal */}
      <TopicModal
        isOpen={selectedTopic !== null}
        onClose={() => setSelectedTopic(null)}
        topic={selectedTopic}
        language={language}
      />

      <FloatingAssistant />
    </div>
  )
}
