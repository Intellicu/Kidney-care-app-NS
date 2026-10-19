import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    app_name: "KidneyCare",
    next: "Next", back: "Back", save: "Save", cancel: "Cancel",
    submit: "Submit", loading: "Loading...", error: "Error", success: "Success", today: "Today",

    // Onboarding
    select_language: "Select Your Language",
    language_en: "English", language_hi: "हिंदी (Hindi)",
    consent_title: "Data Consent",
    consent_text: "I agree to share my health data with my clinician for monitoring and care.",
    consent_required: "Please agree to continue",
    profile_title: "Patient Profile",
    patient_name: "Patient Name", caregiver_name: "Caregiver Name",
    date_of_birth: "Date of Birth", gender: "Sex", phone: "Phone / WhatsApp",
    diagnosis: "Diagnosis", upload_prescription: "Upload Prescription (optional)",
    assistant_intro: "I am your KidneyCare Assistant. I will help you every day.",
    go_to_dashboard: "Go to Home",

    // Dashboard
    todays_status: "Today's Status", protein_level: "Protein Level",
    symptoms: "Symptoms", medications_due: "Medicines Due",
    urine_test: "Urine Protein Test", symptom_checker: "Symptom Check",
    health_metrics: "Health Data", medications: "Medicines", education: "Learn",
    no_test_today: "No test recorded today", take_test: "Do Urine Test",
    good_morning: "Good morning", good_afternoon: "Good afternoon", good_evening: "Good evening",

    // Dipstick
    dipstick_instructions_title: "How to Do the Urine Test",
    step1_title: "Step 1: Prepare", step1_desc: "Take one strip from the bottle. Seal it tightly right away.",
    step2_title: "Step 2: Collect", step2_desc: "Collect fresh midstream urine in a clean container.",
    step3_title: "Step 3: Dip", step3_desc: "Dip ALL coloured pads into urine for 1–2 seconds only.",
    step4_title: "Step 4: Remove", step4_desc: "Remove strip. Run the edge along the container rim to remove extra urine.",
    step5_title: "Step 5: Wait", step5_desc: "Hold the strip flat. Wait exactly 60 seconds.",
    step6_title: "Step 6: Read", step6_desc: "Compare the protein pad colour to the chart on the bottle within 60 seconds.",
    start_test: "Start Test",
    upload_before: "Before Dipping (Optional)",
    upload_after: "After Dipping (Required ⭐)",
    analyzing: "Saving...", result: "Result", confidence: "Confidence",
    save_result: "Save Result", retake_photo: "Image unclear. Please retake.",
    high_protein_alert: "Protein detected. Please contact your doctor.",
    select_colour: "Select the colour you see on the protein pad",
    colour_chart: "Compare to colour chart on the bottle",

    // Symptoms
    how_feeling: "How are you feeling today?",
    very_good: "Very Good", okay: "Okay", not_well: "Not Well",
    select_symptoms: "Select symptoms you have right now:",
    swelling: "Swelling (face, hands, feet)",
    urine_changes: "Less urine than usual",
    fever: "Fever", vomiting: "Vomiting / nausea",
    breathing_difficulty: "Difficulty breathing",
    rapid_weight_gain: "Rapid weight gain (>0.5 kg/day)",
    appetite_loss: "No appetite / not eating",
    submit_symptoms: "Submit",
    severe_symptoms_alert: "These symptoms need urgent attention. Please contact your doctor immediately.",

    // Health Metrics
    enter_health_data: "Enter today's health readings.",
    blood_pressure: "Blood Pressure", systolic: "Systolic (upper)",
    diastolic: "Diastolic (lower)", weight: "Weight (kg)",
    urine_output: "Urine output (mL)", fluid_intake: "Fluid intake (mL)", temperature: "Temperature (°C)",

    // Medications
    add_medication: "Add Medicine", drug_name: "Drug Name", dose: "Dose",
    schedule: "Time", frequency: "Frequency", taken: "Taken", not_taken: "Not Taken",
    mark_taken: "Mark as Taken", upload_medicine_photo: "Upload medicine photo",
    adherence_warning: "You have missed doses this week. Try to take medicines on time.",

    // Clinician
    clinician_dashboard: "Clinician Dashboard", assigned_patients: "Patients",
    alerts_panel: "Alerts", patient_timeline: "Patient Timeline",
    view_details: "View Details", send_message: "Send Message", acknowledge: "Acknowledge",

    // Reminders
    reminders: "Reminders", add_reminder: "Add Reminder", reminder_time: "Reminder Time",
    language_toggle: "Language", theme_toggle: "Appearance",

    // Daily Log
    daily_log: "Daily Log", upload_images: "Upload Photos",
    before_dipping: "Before Dipping", after_dipping: "After Dipping", manual_entry: "Enter Manually",

    // Appointments
    appointments: "Appointments", book_appointment: "Book Appointment",
    upcoming: "Upcoming", past: "Past",

    // Health Records
    health_records: "Health Records", medical_history: "Medical History",

    // Gender
    male: "Male", female: "Female", other: "Other",

    // Education
    what_is_ns: "What is Nephrotic Syndrome?",
    ns_desc: "Nephrotic syndrome is a kidney disorder where the kidney filters (glomeruli) leak large amounts of protein into the urine. Protein normally stays in the blood — when it leaks out, it causes swelling (oedema), low blood albumin, and high cholesterol.",
    signs_relapse: "Signs of a Relapse",
    relapse_desc: "A relapse means the disease has come back. Watch for: foamy urine, swelling around the eyes in the morning, or reduced urine volume. Do a urine test for 3 days if you suspect a relapse.",
    diet_tips: "Diet Tips",
    diet_desc: "Reduce salt in food. Do not add extra salt at the table. Avoid packaged snacks and fast food. Eat fresh fruits, vegetables, and home-cooked food. Drink water as advised by your doctor.",
    medicine_tips: "About Your Medicines",
    medicine_desc: "Take prednisolone every morning with food. Never stop steroids suddenly — always ask your doctor before changing the dose. Other medicines like Levamisole or Tacrolimus must be taken exactly as prescribed.",
    emergency_signs: "Emergency Warning Signs",
    emergency_desc: "Go to the hospital right away if: severe swelling of the face or body, very little or no urine for 8+ hours, high fever with chills, difficulty breathing, or extreme tiredness.",
    whatsapp_share: "Share via WhatsApp",
  },
  hi: {
    app_name: "KidneyCare",
    next: "आगे", back: "वापस", save: "सेव करें", cancel: "रद्द करें",
    submit: "जमा करें", loading: "लोड हो रहा है...", error: "त्रुटि", success: "सफल", today: "आज",

    // Onboarding
    select_language: "अपनी भाषा चुनें",
    language_en: "English", language_hi: "हिंदी",
    consent_title: "सहमति",
    consent_text: "मैं अपना स्वास्थ्य डेटा अपने डॉक्टर के साथ देखभाल के लिए साझा करने के लिए सहमत हूँ।",
    consent_required: "जारी रखने के लिए सहमति दें",
    profile_title: "मरीज़ की जानकारी",
    patient_name: "मरीज़ का नाम", caregiver_name: "देखभालकर्ता का नाम",
    date_of_birth: "जन्म तिथि", gender: "लिंग", phone: "फ़ोन / WhatsApp",
    diagnosis: "निदान", upload_prescription: "पर्चा अपलोड करें (वैकल्पिक)",
    assistant_intro: "मैं आपकी KidneyCare सहायक हूँ। मैं हर दिन आपकी मदद करूँगी।",
    go_to_dashboard: "होम पर जाएँ",

    // Dashboard
    todays_status: "आज की स्थिति", protein_level: "प्रोटीन स्तर",
    symptoms: "लक्षण", medications_due: "दवाएँ बाकी",
    urine_test: "पेशाब प्रोटीन जाँच", symptom_checker: "लक्षण जाँच",
    health_metrics: "स्वास्थ्य जानकारी", medications: "दवाइयाँ", education: "जानें",
    no_test_today: "आज कोई जाँच नहीं हुई", take_test: "जाँच करें",
    good_morning: "सुप्रभात", good_afternoon: "नमस्ते", good_evening: "शुभ संध्या",

    // Dipstick
    dipstick_instructions_title: "पेशाब जाँच कैसे करें",
    step1_title: "चरण 1: तैयारी", step1_desc: "बोतल से एक स्ट्रिप निकालें और बोतल तुरंत बंद करें।",
    step2_title: "चरण 2: पेशाब लें", step2_desc: "साफ़ बर्तन में ताज़ा बीच की धार का पेशाब लें।",
    step3_title: "चरण 3: डुबोएँ", step3_desc: "स्ट्रिप के सभी रंगीन हिस्सों को केवल 1–2 सेकंड के लिए पेशाब में डुबोएँ।",
    step4_title: "चरण 4: निकालें", step4_desc: "स्ट्रिप निकालें और बर्तन के किनारे से अतिरिक्त पेशाब हटाएँ।",
    step5_title: "चरण 5: प्रतीक्षा करें", step5_desc: "स्ट्रिप को सपाट रखें। ठीक 60 सेकंड तक रुकें।",
    step6_title: "चरण 6: पढ़ें", step6_desc: "60 सेकंड के अंदर प्रोटीन पैड का रंग बोतल के चार्ट से मिलाएँ।",
    start_test: "जाँच शुरू करें",
    upload_before: "डुबोने से पहले की फोटो (वैकल्पिक)",
    upload_after: "डुबोने के बाद की फोटो (ज़रूरी ⭐)",
    analyzing: "सेव हो रहा है...", result: "परिणाम", confidence: "सटीकता",
    save_result: "परिणाम सेव करें", retake_photo: "फोटो स्पष्ट नहीं है। कृपया फिर से लें।",
    high_protein_alert: "प्रोटीन मिला है। कृपया अपने डॉक्टर से संपर्क करें।",
    select_colour: "आपको प्रोटीन पैड पर कौन सा रंग दिखा?",
    colour_chart: "बोतल पर दिए रंग चार्ट से मिलाएँ",

    // Symptoms
    how_feeling: "आज आप कैसा महसूस कर रहे हैं?",
    very_good: "बहुत अच्छा", okay: "ठीक", not_well: "अच्छा नहीं",
    select_symptoms: "अभी जो लक्षण हों उन्हें चुनें:",
    swelling: "सूजन (चेहरा, हाथ, पैर)",
    urine_changes: "पेशाब सामान्य से कम",
    fever: "बुखार", vomiting: "उल्टी / जी मिचलाना",
    breathing_difficulty: "सांस लेने में तकलीफ़",
    rapid_weight_gain: "तेज़ी से वज़न बढ़ना (>0.5 किग्रा/दिन)",
    appetite_loss: "भूख न लगना",
    submit_symptoms: "जमा करें",
    severe_symptoms_alert: "ये लक्षण गंभीर हैं। कृपया तुरंत अपने डॉक्टर से मिलें।",

    // Health Metrics
    enter_health_data: "आज की स्वास्थ्य जानकारी दर्ज करें।",
    blood_pressure: "रक्तचाप (ब्लड प्रेशर)", systolic: "सिस्टोलिक (ऊपर वाला)",
    diastolic: "डायस्टोलिक (नीचे वाला)", weight: "वज़न (किग्रा)",
    urine_output: "पेशाब की मात्रा (मिली)", fluid_intake: "पानी / तरल पदार्थ (मिली)", temperature: "तापमान (°C)",

    // Medications
    add_medication: "दवा जोड़ें", drug_name: "दवा का नाम", dose: "खुराक",
    schedule: "समय", frequency: "कितनी बार", taken: "ले ली", not_taken: "नहीं ली",
    mark_taken: "ली गई चिह्नित करें", upload_medicine_photo: "दवा की फोटो अपलोड करें",
    adherence_warning: "इस हफ़्ते आपने कुछ दवाएँ छोड़ी हैं। समय पर लेने की कोशिश करें।",

    // Clinician
    clinician_dashboard: "चिकित्सक डैशबोर्ड", assigned_patients: "मरीज़",
    alerts_panel: "अलर्ट", patient_timeline: "मरीज़ टाइमलाइन",
    view_details: "विवरण देखें", send_message: "संदेश भेजें", acknowledge: "स्वीकार करें",

    // Reminders
    reminders: "रिमाइंडर", add_reminder: "रिमाइंडर जोड़ें", reminder_time: "समय",
    language_toggle: "भाषा", theme_toggle: "थीम (डार्क/लाइट)",

    // Daily Log
    daily_log: "दैनिक लॉग", upload_images: "फोटो अपलोड करें",
    before_dipping: "डुबोने से पहले", after_dipping: "डुबोने के बाद", manual_entry: "मैन्युअल दर्ज करें",

    // Appointments
    appointments: "अपॉइंटमेंट", book_appointment: "अपॉइंटमेंट बुक करें",
    upcoming: "आगामी", past: "पिछले",

    // Health Records
    health_records: "स्वास्थ्य रिकॉर्ड", medical_history: "चिकित्सा इतिहास",

    // Gender
    male: "पुरुष", female: "महिला", other: "अन्य",

    // Education
    what_is_ns: "नेफ्रोटिक सिंड्रोम क्या है?",
    ns_desc: "नेफ्रोटिक सिंड्रोम एक किडनी की बीमारी है जिसमें किडनी के फ़िल्टर (ग्लोमेरुली) पेशाब में बड़ी मात्रा में प्रोटीन लीक करते हैं। प्रोटीन खून में रहना चाहिए — जब यह लीक होता है तो सूजन, कम एल्ब्युमिन और कोलेस्ट्रॉल बढ़ने की समस्या होती है।",
    signs_relapse: "दोबारा बीमारी के लक्षण (रिलैप्स)",
    relapse_desc: "रिलैप्स यानी बीमारी वापस आना। इन संकेतों पर नज़र रखें: पेशाब में झाग, सुबह आँखों के आसपास सूजन, या पेशाब कम होना। शक होने पर 3 दिन लगातार पेशाब की जाँच करें।",
    diet_tips: "खान-पान की सलाह",
    diet_desc: "खाने में नमक कम करें। खाने के ऊपर से नमक न डालें। पैकेट बंद स्नैक्स और बाहर का खाना न खाएँ। ताज़े फल, सब्ज़ियाँ और घर का बना खाना खाएँ। डॉक्टर की सलाह के अनुसार पानी पीएँ।",
    medicine_tips: "आपकी दवाओं के बारे में",
    medicine_desc: "प्रेडनिसोलोन हर सुबह खाने के साथ लें। स्टेरॉयड अचानक कभी बंद न करें — खुराक बदलने से पहले हमेशा डॉक्टर से पूछें। Levamisole या Tacrolimus जैसी दवाएँ ठीक उसी तरह लें जैसा डॉक्टर ने बताया है।",
    emergency_signs: "आपातकालीन चेतावनी के संकेत",
    emergency_desc: "तुरंत अस्पताल जाएँ अगर: चेहरे या शरीर में बहुत ज़्यादा सूजन हो, 8+ घंटे पेशाब बहुत कम या बिल्कुल न हो, तेज़ बुखार के साथ ठंड लगे, सांस लेने में बहुत तकलीफ़ हो, या बहुत ज़्यादा कमज़ोरी हो।",
    whatsapp_share: "WhatsApp पर भेजें",
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('kidneycare_language') || 'en');

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('kidneycare_language', lang);
  };

  const t = (key) => translations[language]?.[key] || translations['en']?.[key] || key;

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}

export default LanguageContext;