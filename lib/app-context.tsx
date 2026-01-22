"use client"

import { createContext, useContext, useState, type ReactNode } from 'react'

export type Language = 'en' | 'hi' | 'bn' | 'ta' | 'pa'

export type NephroticSyndromeCategory = 'IFRNS' | 'FRNS' | 'SDNS' | 'SRNS' | ''

export interface PatientProfile {
  name: string
  dateOfBirth: string
  age: number
  sex: 'male' | 'female' | 'other' | ''
  weight: number
  height: number
  diagnosis: NephroticSyndromeCategory
  diagnosisDate: string
  doctorName: string
  hospitalName: string
  reminderTime: string
}

export interface HealthData {
  weight?: number
  bp?: { systolic: number; diastolic: number }
  urineAmount?: number
  fluidIntake?: number
  date: string
}

export interface Medication {
  id: string
  name: string
  dose: string
  frequency: string
  route: string
  startDate: string
  prescriptionImage?: string
  takenToday: boolean
  takenYesterday?: boolean
  reminderTime?: string
  isActive: boolean
  isCustom?: boolean
}

export interface SymptomEntry {
  date: string
  feeling: 'very-good' | 'okay' | 'not-well'
  symptoms: {
    swelling: boolean
    fever: boolean
    vomiting: boolean
    breathingDifficulty: boolean
  }
}

export interface UrineTestResult {
  id: string
  date: string
  beforeImage?: string
  afterImage?: string
  patientResult: 'negative' | 'trace' | '1+' | '2+' | '3+' | '4+' | null
  aiResult: 'negative' | 'trace' | '1+' | '2+' | '3+' | '4+' | null
  result: 'negative' | 'trace' | '1+' | '2+' | '3+' | '4+' // Final result (patient or AI)
  manualResult?: boolean
}

export interface DailyCheckIn {
  date: string
  urineTestCompleted: boolean
  urineTestSkipped: boolean
  medicationCheckCompleted: boolean
  medicationCheckSkipped: boolean
  extraMedicines?: Medication[]
}

interface AppState {
  language: Language
  setLanguage: (lang: Language) => void
  hasConsented: boolean
  setHasConsented: (val: boolean) => void
  hasCompletedOnboarding: boolean
  setHasCompletedOnboarding: (val: boolean) => void
  hasCompletedPatientProfile: boolean
  setHasCompletedPatientProfile: (val: boolean) => void
  patientProfile: PatientProfile
  setPatientProfile: (profile: PatientProfile) => void
  updatePatientProfile: (updates: Partial<PatientProfile>) => void
  currentScreen: string
  setCurrentScreen: (screen: string) => void
  healthData: HealthData[]
  addHealthData: (data: HealthData) => void
  medications: Medication[]
  setMedications: (meds: Medication[]) => void
  addMedication: (med: Medication) => void
  updateMedication: (id: string, updates: Partial<Medication>) => void
  removeMedication: (id: string) => void
  toggleMedicationTaken: (id: string) => void
  toggleMedicationTakenYesterday: (id: string) => void
  symptomEntries: SymptomEntry[]
  addSymptomEntry: (entry: SymptomEntry) => void
  urineTests: UrineTestResult[]
  addUrineTest: (test: UrineTestResult) => void
  dailyCheckIns: DailyCheckIn[]
  addDailyCheckIn: (checkIn: DailyCheckIn) => void
  updateDailyCheckIn: (date: string, updates: Partial<DailyCheckIn>) => void
  getTodayCheckIn: () => DailyCheckIn | undefined
  isVoiceEnabled: boolean
  setIsVoiceEnabled: (val: boolean) => void
  showDailyCheckIn: boolean
  setShowDailyCheckIn: (val: boolean) => void
}

const translations = {
  en: {
    // Language Selection
    selectLanguage: 'Select Your Language',
    tapToSelect: 'Tap your preferred language',
    english: 'English',
    hindi: 'Hindi',
    bengali: 'Bengali',
    tamil: 'Tamil',
    punjabi: 'Punjabi',
    
    // Common
    welcome: 'Welcome to KidneyCare',
    chooseLanguage: 'Please choose your language',
    continue: 'Continue',
    consent: 'I agree to share my health data with my doctor',
    iUnderstand: 'I Understand, Continue',
    greeting: 'Good morning',
    howAreYouFeeling: 'How are you feeling today?',
    doUrineTest: 'Do urine test',
    checkMedicines: 'Check medicines',
    enterHealthData: "Enter today's health data",
    veryGood: 'Very Good',
    okay: 'Okay',
    notWell: 'Not Well',
    yes: 'Yes',
    no: 'No',
    swelling: 'Do you have swelling?',
    fever: 'Do you have fever?',
    vomiting: 'Are you vomiting?',
    breathingDifficulty: 'Difficulty breathing?',
    startTest: 'Start Test',
    uploadBefore: 'Upload photo BEFORE dipping',
    uploadAfter: 'Upload photo AFTER dipping',
    analyze: 'Analyze Photos',
    saveResult: 'Save result',
    sendToDoctor: 'Send to doctor',
    weight: 'Weight',
    bloodPressure: 'Blood Pressure',
    urineAmount: 'Urine Amount',
    fluidIntake: 'Fluid Intake',
    askQuestion: 'Ask a question',
    repeatInstruction: 'Repeat last instruction',
    helpMe: 'Help me',
    assistantIntro1: 'Hello! I am your KidneyCare Assistant.',
    assistantIntro2: 'I will help you every day.',
    start: 'Start',
    takenToday: 'Taken today',
    takenYesterday: 'Taken yesterday',
    setReminder: 'Set Reminder',
    education: 'Learn',
    whatIsKidneyDisease: 'What is kidney disease?',
    howToDoUrineTest: 'How to do urine test',
    foodToEat: 'Food to eat',
    whenToGoHospital: 'When to go to hospital',
    instructions: 'Instructions',
    checkExpiry: 'Check expiry date on bottle',
    useFreshUrine: 'Collect fresh midstream urine in a clean container',
    dipStrip: 'Dip all pads into urine for 1-2 seconds only',
    removeExcess: 'Remove strip and run edge along container to remove excess',
    holdHorizontal: 'Hold strip horizontally to prevent colors mixing',
    waitTime: 'Wait exactly 60 seconds',
    compareColors: 'Compare pad color to chart on bottle',
    dryEdge: 'Dry one edge',
    negative: 'Negative',
    trace: 'Trace',
    resultExplanation: 'This shows protein level in your urine',
    back: 'Back',
    next: 'Next',
    save: 'Save',
    cancel: 'Cancel',
    skip: 'Skip',
    done: 'Done',
    
    // Patient onboarding
    welcomeProfile: 'Welcome!',
    letsSetupProfile: "Let's set up your health profile",
    listen: 'Listen',
    voiceOn: 'Voice On',
    voiceOff: 'Voice Off',
    tapToSpeak: 'Tap microphone to speak',
    whatIsYourName: 'What is your name?',
    enterFullName: 'Enter your full name',
    typeName: 'Type your name...',
    typeHere: 'Type here...',
    whenWereYouBorn: 'When were you born?',
    selectDOB: 'Select your date of birth',
    whatIsYourWeight: 'What is your weight?',
    enterWeightKg: 'Enter your weight in kilograms',
    weightKg: 'Weight (kg)',
    whatIsYourHeight: 'What is your height?',
    enterHeightCm: 'Enter your height in centimeters',
    heightCm: 'Height (cm)',
    whatIsYourSex: 'What is your sex?',
    selectSex: 'Select your sex',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    whatIsYourDiagnosis: 'What is your diagnosis?',
    selectNSType: 'Select your Nephrotic Syndrome type',
    ifrns: 'IFRNS - Infrequent Relapse',
    frns: 'FRNS - Frequent Relapse',
    sdns: 'SDNS - Steroid Dependent',
    srns: 'SRNS - Steroid Resistant',
    medicationManagement: 'Your Medications',
    manageYourMedications: 'Add your prescribed medications',
    activeMedications: 'Active Medications',
    medicationsYouAreTaking: 'Medications you are currently taking',
    noActiveMedications: 'No medications added yet',
    addMedicationsToTrack: 'Add your medications to track daily',
    addFirstMedication: 'Add First Medication',
    addMedication: 'Add Medication',
    addNewMedication: 'Add New Medication',
    addMedicationToTreatment: 'Add a medication to your treatment plan',
    uploadPrescription: 'Upload Prescription (Optional)',
    uploadPrescriptionPhoto: 'Upload a photo of your prescription',
    chooseImage: 'Choose Image',
    takePhoto: 'Take Photo',
    medicationDetails: 'Medication Details',
    medicationName: 'Medication Name',
    selectMedication: 'Select or type medication name',
    dosage: 'Dosage',
    dosagePlaceholder: 'e.g., 20mg, 500mg',
    frequency: 'How often?',
    selectFrequency: 'Select frequency',
    route: 'How to take?',
    selectRoute: 'Select route',
    startDate: 'Start Date',
    finishSetup: 'Finish Setup',
    onceDaily: 'Once a day',
    twiceDaily: 'Twice a day',
    thriceDaily: 'Three times a day',
    alternateDays: 'Alternate days',
    weekly: 'Once a week',
    asNeeded: 'As needed',
    otherFrequency: 'Other (type)',
    oral: 'Oral (mouth)',
    injection: 'Injection',
    topical: 'On skin',
    otherRoute: 'Other',
    
    // Reminder setup
    setDailyReminder: 'Set Daily Reminder',
    whenToRemind: 'When should we remind you daily?',
    reminderHelp: 'We will remind you to do urine test and take medicines',
    selectTime: 'Select Time',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    
    // Daily check-in
    dailyCheckIn: 'Daily Health Check',
    goodMorningCheckIn: 'Good morning! Time for your daily check',
    letsStartDay: "Let's start with your urine test",
    urineTestReminder: 'Urine Test Time',
    medicationReminder: 'Medication Check',
    didYouTakeMedicines: 'Did you take your medicines yesterday?',
    markTakenMedicines: 'Tap each medicine you took yesterday',
    addExtraMedicine: 'Add any other medicine taken',
    allDone: 'All Done!',
    greatJob: 'Great job completing your daily check!',
    
    // Urine test flow
    urineTestInstructions: 'How to Do the Urine Test',
    step1: 'Step 1: Prepare',
    step1Desc: 'Take one strip from bottle. Keep bottle sealed tightly.',
    step2: 'Step 2: Collect',
    step2Desc: 'Collect fresh urine in a clean container. Use midstream.',
    step3: 'Step 3: Dip',
    step3Desc: 'Dip ALL colored pads into urine for 1-2 seconds only.',
    step4: 'Step 4: Remove',
    step4Desc: 'Remove strip. Run edge along container rim to remove extra urine.',
    step5: 'Step 5: Wait',
    step5Desc: 'Hold strip flat (horizontal). Wait exactly 60 seconds.',
    step6: 'Step 6: Read',
    step6Desc: 'Compare protein pad color to chart on bottle within 60 seconds.',
    
    // Manual result selection
    selectResult: 'Select Your Result',
    whatColorDoYouSee: 'What color do you see on the protein pad?',
    tapToSelect: 'Tap the matching result',
    orUploadPhotos: 'Or upload photos for analysis',
    
    // Results
    resultNegative: 'Negative - No protein',
    resultTrace: 'Trace - Very small amount',
    result1Plus: '1+ Mild protein',
    result2Plus: '2+ Moderate protein',
    result3Plus: '3+ High protein',
    result4Plus: '4+ Very high protein',
    
    kg: 'kg',
    cm: 'cm',
    
    commonMedications: [
      'Prednisolone',
      'Tacrolimus',
      'Cyclosporine',
      'Mycophenolate',
      'Rituximab',
      'Levamisole',
      'ACE Inhibitor',
      'ARB',
      'Furosemide',
      'Atorvastatin',
      'Calcium',
      'Vitamin D',
      'Other'
    ],
  },
  hi: {
    // Language Selection
    selectLanguage: 'अपनी भाषा चुनें',
    tapToSelect: 'अपनी पसंदीदा भाषा पर टैप करें',
    english: 'अंग्रेज़ी',
    hindi: 'हिंदी',
    bengali: 'बंगाली',
    tamil: 'तमिल',
    punjabi: 'पंजाबी',
    
    // Common
    welcome: 'किडनीकेयर में आपका स्वागत है',
    chooseLanguage: 'कृपया अपनी भाषा चुनें',
    continue: 'जारी रखें',
    consent: 'मैं अपने डॉक्टर के साथ अपना स्वास्थ्य डेटा साझा करने के लिए सहमत हूं',
    iUnderstand: 'मैं समझता/समझती हूं, जारी रखें',
    greeting: 'सुप्रभात',
    howAreYouFeeling: 'आज आप कैसा महसूस कर रहे हैं?',
    doUrineTest: 'मूत्र परीक्षण करें',
    checkMedicines: 'दवाइयाँ जाँचें',
    enterHealthData: 'आज का स्वास्थ्य डेटा दर्ज करें',
    veryGood: 'बहुत अच्छा',
    okay: 'ठीक है',
    notWell: 'अच्छा नहीं',
    yes: 'हाँ',
    no: 'नहीं',
    swelling: 'क्या आपको सूजन है?',
    fever: 'क्या आपको बुखार है?',
    vomiting: 'क्या आपको उल्टी हो रही है?',
    breathingDifficulty: 'सांस लेने में तकलीफ?',
    startTest: 'परीक्षण शुरू करें',
    uploadBefore: 'डुबोने से पहले फोटो अपलोड करें',
    uploadAfter: 'डुबोने के बाद फोटो अपलोड करें',
    analyze: 'फोटो का विश्लेषण करें',
    saveResult: 'परिणाम सहेजें',
    sendToDoctor: 'डॉक्टर को भेजें',
    weight: 'वजन',
    bloodPressure: 'रक्तचाप',
    urineAmount: 'मूत्र की मात्रा',
    fluidIntake: 'पानी की मात्रा',
    askQuestion: 'सवाल पूछें',
    repeatInstruction: 'पिछला निर्देश दोहराएं',
    helpMe: 'मदद करें',
    assistantIntro1: 'नमस्ते! मैं आपका किडनीकेयर सहायक हूं।',
    assistantIntro2: 'मैं हर दिन आपकी मदद करूंगा।',
    start: 'शुरू करें',
    takenToday: 'आज ली गई',
    takenYesterday: 'कल ली गई',
    setReminder: 'रिमाइंडर सेट करें',
    education: 'सीखें',
    whatIsKidneyDisease: 'किडनी की बीमारी क्या है?',
    howToDoUrineTest: 'मूत्र परीक्षण कैसे करें',
    foodToEat: 'खाने के लिए भोजन',
    whenToGoHospital: 'अस्पताल कब जाएं',
    instructions: 'निर्देश',
    checkExpiry: 'बोतल पर समाप्ति तिथि जांचें',
    useFreshUrine: 'साफ बर्तन में ताजा मिडस्ट्रीम मूत्र इकट्ठा करें',
    dipStrip: 'सभी पैड को मूत्र में केवल 1-2 सेकंड के लिए डुबोएं',
    removeExcess: 'स्ट्रिप निकालें और अतिरिक्त मूत्र हटाने के लिए किनारे को बर्तन पर चलाएं',
    holdHorizontal: 'रंग मिलने से रोकने के लिए स्ट्रिप को समतल पकड़ें',
    waitTime: 'ठीक 60 सेकंड प्रतीक्षा करें',
    compareColors: '60 सेकंड के भीतर पैड का रंग बोतल के चार्ट से मिलाएं',
    dryEdge: 'एक किनारा सुखाएं',
    negative: 'नकारात्मक',
    trace: 'ट्रेस',
    resultExplanation: 'यह आपके मूत्र में प्रोटीन का स्तर दिखाता है',
    back: 'पीछे',
    next: 'अगला',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    skip: 'छोड़ें',
    done: 'हो गया',
    
    // Patient onboarding
    welcomeProfile: 'स्वागत है!',
    letsSetupProfile: 'आइए आपकी स्वास्थ्य प्रोफ़ाइल सेट करें',
    listen: 'सुनें',
    voiceOn: 'आवाज़ चालू',
    voiceOff: 'आवाज़ बंद',
    tapToSpeak: 'बोलने के लिए माइक्रोफोन पर टैप करें',
    whatIsYourName: 'आपका नाम क्या है?',
    enterFullName: 'अपना पूरा नाम दर्ज करें',
    typeName: 'अपना नाम लिखें...',
    typeHere: 'यहाँ लिखें...',
    whenWereYouBorn: 'आपका जन्म कब हुआ?',
    selectDOB: 'अपनी जन्म तिथि चुनें',
    whatIsYourWeight: 'आपका वजन कितना है?',
    enterWeightKg: 'अपना वजन किलोग्राम में दर्ज करें',
    weightKg: 'वजन (किलो)',
    whatIsYourHeight: 'आपकी ऊंचाई कितनी है?',
    enterHeightCm: 'अपनी ऊंचाई सेंटीमीटर में दर्ज करें',
    heightCm: 'ऊंचाई (सेमी)',
    whatIsYourSex: 'आपका लिंग क्या है?',
    selectSex: 'अपना लिंग चुनें',
    male: 'पुरुष',
    female: 'महिला',
    other: 'अन्य',
    whatIsYourDiagnosis: 'आपका निदान क्या है?',
    selectNSType: 'अपना नेफ्रोटिक सिंड्रोम प्रकार चुनें',
    ifrns: 'IFRNS - कम बार रिलैप्स',
    frns: 'FRNS - बार-बार रिलैप्स',
    sdns: 'SDNS - स्टेरॉयड निर्भर',
    srns: 'SRNS - स्टेरॉयड प्रतिरोधी',
    medicationManagement: 'आपकी दवाइयाँ',
    manageYourMedications: 'अपनी निर्धारित दवाइयाँ जोड़ें',
    activeMedications: 'सक्रिय दवाइयाँ',
    medicationsYouAreTaking: 'वर्तमान में आप जो दवाइयाँ ले रहे हैं',
    noActiveMedications: 'अभी तक कोई दवाई नहीं जोड़ी गई',
    addMedicationsToTrack: 'रोज़ाना ट्रैक करने के लिए अपनी दवाइयाँ जोड़ें',
    addFirstMedication: 'पहली दवाई जोड़ें',
    addMedication: 'दवाई जोड़ें',
    addNewMedication: 'नई दवाई जोड़ें',
    addMedicationToTreatment: 'अपने उपचार योजना में दवाई जोड़ें',
    uploadPrescription: 'प्रिस्क्रिप्शन अपलोड करें (वैकल्पिक)',
    uploadPrescriptionPhoto: 'अपने प्रिस्क्रिप्शन की फोटो अपलोड करें',
    chooseImage: 'छवि चुनें',
    takePhoto: 'फोटो लें',
    medicationDetails: 'दवाई विवरण',
    medicationName: 'दवाई का नाम',
    selectMedication: 'दवाई का नाम चुनें या लिखें',
    dosage: 'खुराक',
    dosagePlaceholder: 'जैसे, 20mg, 500mg',
    frequency: 'कितनी बार?',
    selectFrequency: 'आवृत्ति चुनें',
    route: 'कैसे लें?',
    selectRoute: 'मार्ग चुनें',
    startDate: 'शुरू तिथि',
    finishSetup: 'सेटअप पूरा करें',
    onceDaily: 'दिन में एक बार',
    twiceDaily: 'दिन में दो बार',
    thriceDaily: 'दिन में तीन बार',
    alternateDays: 'एक दिन छोड़कर',
    weekly: 'सप्ताह में एक बार',
    asNeeded: 'जरूरत के अनुसार',
    otherFrequency: 'अन्य (लिखें)',
    oral: 'मुँह से',
    injection: 'इंजेक्शन',
    topical: 'त्वचा पर',
    otherRoute: 'अन्य',
    
    // Reminder setup
    setDailyReminder: 'दैनिक रिमाइंडर सेट करें',
    whenToRemind: 'हमें आपको रोज़ कब याद दिलाना चाहिए?',
    reminderHelp: 'हम आपको मूत्र परीक्षण और दवाइयाँ लेने की याद दिलाएंगे',
    selectTime: 'समय चुनें',
    morning: 'सुबह',
    afternoon: 'दोपहर',
    evening: 'शाम',
    
    // Daily check-in
    dailyCheckIn: 'दैनिक स्वास्थ्य जांच',
    goodMorningCheckIn: 'सुप्रभात! आपकी दैनिक जांच का समय',
    letsStartDay: 'चलिए मूत्र परीक्षण से शुरू करते हैं',
    urineTestReminder: 'मूत्र परीक्षण का समय',
    medicationReminder: 'दवाई जांच',
    didYouTakeMedicines: 'क्या आपने कल अपनी दवाइयाँ लीं?',
    markTakenMedicines: 'जो दवाइयाँ आपने कल लीं उन पर टैप करें',
    addExtraMedicine: 'कोई अन्य दवाई जोड़ें जो ली हो',
    allDone: 'सब हो गया!',
    greatJob: 'बहुत अच्छा! आपकी दैनिक जांच पूरी हुई!',
    
    // Urine test flow
    urineTestInstructions: 'मूत्र परीक्षण कैसे करें',
    step1: 'चरण 1: तैयारी',
    step1Desc: 'बोतल से एक स्ट्रिप निकालें। बोतल को कसकर बंद रखें।',
    step2: 'चरण 2: इकट्ठा करें',
    step2Desc: 'साफ बर्तन में ताजा मूत्र इकट्ठा करें। मिडस्ट्रीम का उपयोग करें।',
    step3: 'चरण 3: डुबोएं',
    step3Desc: 'सभी रंगीन पैड को मूत्र में केवल 1-2 सेकंड के लिए डुबोएं।',
    step4: 'चरण 4: निकालें',
    step4Desc: 'स्ट्रिप निकालें। अतिरिक्त मूत्र हटाने के लिए किनारे को बर्तन पर चलाएं।',
    step5: 'चरण 5: प्रतीक्षा करें',
    step5Desc: 'स्ट्रिप को समतल (क्षैतिज) पकड़ें। ठीक 60 सेकंड प्रतीक्षा करें।',
    step6: 'चरण 6: पढ़ें',
    step6Desc: '60 सेकंड के भीतर प्रोटीन पैड का रंग बोतल के चार्ट से मिलाएं।',
    
    // Manual result selection
    selectResult: 'अपना परिणाम चुनें',
    whatColorDoYouSee: 'प्रोटीन पैड पर आपको कौन सा रंग दिखता है?',
    orUploadPhotos: 'या विश्लेषण के लिए फोटो अपलोड करें',
    
    // Results
    resultNegative: 'नकारात्मक - कोई प्रोटीन नहीं',
    resultTrace: 'ट्रेस - बहुत कम मात्रा',
    result1Plus: '1+ हल्का प्रोटीन',
    result2Plus: '2+ मध्यम प्रोटीन',
    result3Plus: '3+ उच्च प्रोटीन',
    result4Plus: '4+ बहुत उच्च प्रोटीन',
    
    kg: 'किलो',
    cm: 'सेमी',
    
    commonMedications: [
      'प्रेडनिसोलोन',
      'टैक्रोलिमस',
      'साइक्लोस्पोरिन',
      'माइकोफेनोलेट',
      'रिटक्सिमैब',
      'लेवामिसोल',
      'ACE इनहिबिटर',
      'ARB',
      'फ्यूरोसेमाइड',
      'एटोरवास्टेटिन',
      'कैल्शियम',
      'विटामिन D',
      'अन्य'
    ],
  },
  bn: {
    selectLanguage: 'আপনার ভাষা নির্বাচন করুন',
    tapToSelect: 'আপনার পছন্দের ভাষায় ট্যাপ করুন',
    english: 'ইংরেজি',
    hindi: 'হিন্দি',
    bengali: 'বাংলা',
    tamil: 'তামিল',
    punjabi: 'পাঞ্জাবি',
    welcome: 'কিডনিকেয়ারে স্বাগতম',
    chooseLanguage: 'অনুগ্রহ করে আপনার ভাষা নির্বাচন করুন',
    continue: 'চালিয়ে যান',
    consent: 'আমি আমার ডাক্তারের সাথে আমার স্বাস্থ্য তথ্য ভাগ করতে সম্মত',
    iUnderstand: 'আমি বুঝেছি, চালিয়ে যান',
    greeting: 'সুপ্রভাত',
    howAreYouFeeling: 'আজ আপনি কেমন অনুভব করছেন?',
    doUrineTest: 'মূত্র পরীক্ষা করুন',
    checkMedicines: 'ওষুধ পরীক্ষা করুন',
    enterHealthData: 'আজকের স্বাস্থ্য তথ্য প্রবেশ করান',
    veryGood: 'খুব ভালো',
    okay: 'ঠিক আছে',
    notWell: 'ভালো নেই',
    yes: 'হ্যাঁ',
    no: 'না',
    swelling: 'আপনার কি ফোলাভাব আছে?',
    fever: 'আপনার কি জ্বর আছে?',
    vomiting: 'আপনার কি বমি হচ্ছে?',
    breathingDifficulty: 'শ্বাস নিতে কষ্ট?',
    startTest: 'পরীক্ষা শুরু করুন',
    uploadBefore: 'ডুবানোর আগে ছবি আপলোড করুন',
    uploadAfter: 'ডুবানোর পরে ছবি আপলোড করুন',
    analyze: 'ছবি বিশ্লেষণ করুন',
    saveResult: 'ফলাফল সংরক্ষণ করুন',
    sendToDoctor: 'ডাক্তারের কাছে পাঠান',
    weight: 'ওজন',
    bloodPressure: 'রক্তচাপ',
    urineAmount: 'মূত্রের পরিমাণ',
    fluidIntake: 'পানির পরিমাণ',
    askQuestion: 'প্রশ্ন জিজ্ঞাসা করুন',
    repeatInstruction: 'শেষ নির্দেশ পুনরাবৃত্তি করুন',
    helpMe: 'সাহায্য করুন',
    assistantIntro1: 'হ্যালো! আমি আপনার কিডনিকেয়ার সহকারী।',
    assistantIntro2: 'আমি প্রতিদিন আপনাকে সাহায্য করব।',
    start: 'শুরু করুন',
    takenToday: 'আজ নেওয়া হয়েছে',
    takenYesterday: 'কাল নেওয়া হয়েছে',
    setReminder: 'রিমাইন্ডার সেট করুন',
    education: 'শিখুন',
    whatIsKidneyDisease: 'কিডনি রোগ কী?',
    howToDoUrineTest: 'মূত্র পরীক্ষা কীভাবে করবেন',
    foodToEat: 'খাবার',
    whenToGoHospital: 'কখন হাসপাতালে যাবেন',
    instructions: 'নির্দেশাবলী',
    checkExpiry: 'বোতলে মেয়াদ শেষের তারিখ পরীক্ষা করুন',
    useFreshUrine: 'পরিষ্কার পাত্রে তাজা মিডস্ট্রিম মূত্র সংগ্রহ করুন',
    dipStrip: 'সব প্যাড মূত্রে শুধুমাত্র ১-২ সেকেন্ড ডুবান',
    removeExcess: 'স্ট্রিপ সরান এবং অতিরিক্ত মূত্র সরাতে পাত্রের কিনারায় চালান',
    holdHorizontal: 'রং মেশা রোধে স্ট্রিপ সমতল ধরুন',
    waitTime: 'ঠিক ৬০ সেকেন্ড অপেক্ষা করুন',
    compareColors: '৬০ সেকেন্ডের মধ্যে প্যাডের রং বোতলের চার্টের সাথে তুলনা করুন',
    dryEdge: 'একটি প্রান্ত শুকান',
    negative: 'নেতিবাচক',
    trace: 'ট্রেস',
    resultExplanation: 'এটি আপনার মূত্রে প্রোটিনের মাত্রা দেখায়',
    back: 'পেছনে',
    next: 'পরবর্তী',
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    skip: 'এড়িয়ে যান',
    done: 'হয়ে গেছে',
    welcomeProfile: 'স্বাগতম!',
    letsSetupProfile: 'আসুন আপনার স্বাস্থ্য প্রোফাইল সেট আপ করি',
    listen: 'শুনুন',
    voiceOn: 'ভয়েস চালু',
    voiceOff: 'ভয়েস বন্ধ',
    tapToSpeak: 'কথা বলতে মাইক্রোফোনে ট্যাপ করুন',
    whatIsYourName: 'আপনার নাম কী?',
    enterFullName: 'আপনার পুরো নাম লিখুন',
    typeName: 'আপনার নাম লিখুন...',
    typeHere: 'এখানে লিখুন...',
    whenWereYouBorn: 'আপনি কবে জন্মগ্রহণ করেছিলেন?',
    selectDOB: 'আপনার জন্ম তারিখ নির্বাচন করুন',
    whatIsYourWeight: 'আপনার ওজন কত?',
    enterWeightKg: 'আপনার ওজন কিলোগ্রামে লিখুন',
    weightKg: 'ওজন (কেজি)',
    whatIsYourHeight: 'আপনার উচ্চতা কত?',
    enterHeightCm: 'আপনার উচ্চতা সেন্টিমিটারে লিখুন',
    heightCm: 'উচ্চতা (সেমি)',
    whatIsYourSex: 'আপনার লিঙ্গ কী?',
    selectSex: 'আপনার লিঙ্গ নির্বাচন করুন',
    male: 'পুরুষ',
    female: 'মহিলা',
    other: 'অন্যান্য',
    whatIsYourDiagnosis: 'আপনার রোগ নির্ণয় কী?',
    selectNSType: 'আপনার নেফ্রোটিক সিনড্রোম প্রকার নির্বাচন করুন',
    ifrns: 'IFRNS - কম রিল্যাপস',
    frns: 'FRNS - ঘন ঘন রিল্যাপস',
    sdns: 'SDNS - স্টেরয়েড নির্ভর',
    srns: 'SRNS - স্টেরয়েড প্রতিরোধী',
    medicationManagement: 'আপনার ওষুধ',
    manageYourMedications: 'আপনার নির্ধারিত ওষুধ যোগ করুন',
    activeMedications: 'সক্রিয় ওষুধ',
    medicationsYouAreTaking: 'আপনি বর্তমানে যে ওষুধ নিচ্ছেন',
    noActiveMedications: 'এখনো কোনো ওষুধ যোগ হয়নি',
    addMedicationsToTrack: 'প্রতিদিন ট্র্যাক করতে আপনার ওষুধ যোগ করুন',
    addFirstMedication: 'প্রথম ওষুধ যোগ করুন',
    addMedication: 'ওষুধ যোগ করুন',
    addNewMedication: 'নতুন ওষুধ যোগ করুন',
    addMedicationToTreatment: 'আপনার চিকিৎসা পরিকল্পনায় একটি ওষুধ যোগ করুন',
    uploadPrescription: 'প্রেসক্রিপশন আপলোড করুন (ঐচ্ছিক)',
    uploadPrescriptionPhoto: 'আপনার প্রেসক্রিপশনের একটি ছবি আপলোড করুন',
    chooseImage: 'ছবি নির্বাচন করুন',
    takePhoto: 'ছবি তুলুন',
    medicationDetails: 'ওষুধের বিবরণ',
    medicationName: 'ওষুধের নাম',
    selectMedication: 'ওষুধের নাম নির্বাচন করুন বা লিখুন',
    dosage: 'ডোজ',
    dosagePlaceholder: 'যেমন, 20mg, 500mg',
    frequency: 'কতবার?',
    selectFrequency: 'ফ্রিকোয়েন্সি নির্বাচন করুন',
    route: 'কীভাবে নেবেন?',
    selectRoute: 'রুট নির্বাচন করুন',
    startDate: 'শুরুর তারিখ',
    finishSetup: 'সেটআপ শেষ করুন',
    onceDaily: 'দিনে একবার',
    twiceDaily: 'দিনে দুইবার',
    thriceDaily: 'দিনে তিনবার',
    alternateDays: 'একদিন পর পর',
    weekly: 'সপ্তাহে একবার',
    asNeeded: 'প্রয়োজন অনুযায়ী',
    otherFrequency: 'অন্যান্য (লিখুন)',
    oral: 'মুখে',
    injection: 'ইনজেকশন',
    topical: 'ত্বকে',
    otherRoute: 'অন্যান্য',
    setDailyReminder: 'দৈনিক রিমাইন্ডার সেট করুন',
    whenToRemind: 'আমরা আপনাকে প্রতিদিন কখন মনে করিয়ে দেব?',
    reminderHelp: 'আমরা আপনাকে মূত্র পরীক্ষা এবং ওষুধ নেওয়ার কথা মনে করিয়ে দেব',
    selectTime: 'সময় নির্বাচন করুন',
    morning: 'সকাল',
    afternoon: 'দুপুর',
    evening: 'সন্ধ্যা',
    dailyCheckIn: 'দৈনিক স্বাস্থ্য পরীক্ষা',
    goodMorningCheckIn: 'সুপ্রভাত! আপনার দৈনিক পরীক্ষার সময়',
    letsStartDay: 'চলুন আপনার মূত্র পরীক্ষা দিয়ে শুরু করি',
    urineTestReminder: 'মূত্র পরীক্ষার সময়',
    medicationReminder: 'ওষুধ পরীক্ষা',
    didYouTakeMedicines: 'আপনি কি গতকাল আপনার ওষুধ নিয়েছিলেন?',
    markTakenMedicines: 'গতকাল যে ওষুধ নিয়েছিলেন প্রতিটিতে ট্যাপ করুন',
    addExtraMedicine: 'অন্য কোনো ওষুধ যোগ করুন যা নিয়েছেন',
    allDone: 'সব হয়ে গেছে!',
    greatJob: 'দারুণ! আপনার দৈনিক পরীক্ষা সম্পন্ন হয়েছে!',
    urineTestInstructions: 'মূত্র পরীক্ষা কীভাবে করবেন',
    step1: 'ধাপ ১: প্রস্তুতি',
    step1Desc: 'বোতল থেকে একটি স্ট্রিপ নিন। বোতল শক্ত করে বন্ধ রাখুন।',
    step2: 'ধাপ ২: সংগ্রহ করুন',
    step2Desc: 'পরিষ্কার পাত্রে তাজা মূত্র সংগ্রহ করুন। মিডস্ট্রিম ব্যবহার করুন।',
    step3: 'ধাপ ৩: ডুবান',
    step3Desc: 'সব রঙিন প্যাড মূত্রে শুধুমাত্র ১-২ সেকেন্ড ডুবান।',
    step4: 'ধাপ ৪: সরান',
    step4Desc: 'স্ট্রিপ সরান। অতিরিক্ত মূত্র সরাতে কিনারা পাত্রের রিমে চালান।',
    step5: 'ধাপ ৫: অপেক্ষা করুন',
    step5Desc: 'স্ট্রিপ সমতল (অনুভূমিক) ধরুন। ঠিক ৬০ সেকেন্ড অপেক্ষা করুন।',
    step6: 'ধাপ ৬: পড়ুন',
    step6Desc: '৬০ সেকেন্ডের মধ্যে প্রোটিন প্যাডের রং বোতলের চার্টের সাথে তুলনা করুন।',
    selectResult: 'আপনার ফলাফল নির্বাচন করুন',
    whatColorDoYouSee: 'প্রোটিন প্যাডে আপনি কোন রং দেখছেন?',
    orUploadPhotos: 'অথবা বিশ্লেষণের জন্য ছবি আপলোড করুন',
    resultNegative: 'নেতিবাচক - কোনো প্রোটিন নেই',
    resultTrace: 'ট্রেস - খুব অল্প পরিমাণ',
    result1Plus: '১+ হালকা প্রোটিন',
    result2Plus: '২+ মাঝারি প্রোটিন',
    result3Plus: '৩+ উচ্চ প্রোটিন',
    result4Plus: '৪+ অত্যন্ত উচ্চ প্রোটিন',
    kg: 'কেজি',
    cm: 'সেমি',
    commonMedications: [
      'প্রেডনিসোলোন',
      'ট্যাক্রোলিমাস',
      'সাইক্লোস্পোরিন',
      'মাইকোফেনোলেট',
      'রিটুক্সিমাব',
      'লেভামিসোল',
      'ACE ইনহিবিটর',
      'ARB',
      'ফুরোসেমাইড',
      'এটোরভাস্ট্যাটিন',
      'ক্যালসিয়াম',
      'ভিটামিন D',
      'অন্যান্য'
    ],
  },
  ta: {
    selectLanguage: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    tapToSelect: 'உங்கள் விருப்பமான மொழியில் தட்டவும்',
    english: 'ஆங்கிலம்',
    hindi: 'இந்தி',
    bengali: 'வங்காளம்',
    tamil: 'தமிழ்',
    punjabi: 'பஞ்சாபி',
    welcome: 'KidneyCare-க்கு வரவேற்கிறோம்',
    chooseLanguage: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    continue: 'தொடரவும்',
    consent: 'என் மருத்துவரிடம் என் சுகாதாரத் தரவைப் பகிர்ந்து கொள்ள ஒப்புக்கொள்கிறேன்',
    iUnderstand: 'புரிந்தது, தொடரவும்',
    greeting: 'காலை வணக்கம்',
    howAreYouFeeling: 'இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?',
    doUrineTest: 'சிறுநீர் பரிசோதனை செய்யுங்கள்',
    checkMedicines: 'மருந்துகளை சரிபாருங்கள்',
    enterHealthData: 'இன்றைய சுகாதார தரவை உள்ளிடுங்கள்',
    veryGood: 'மிகவும் நல்லது',
    okay: 'சரி',
    notWell: 'நன்றாக இல்லை',
    yes: 'ஆம்',
    no: 'இல்லை',
    swelling: 'உங்களுக்கு வீக்கம் உள்ளதா?',
    fever: 'உங்களுக்கு காய்ச்சல் உள்ளதா?',
    vomiting: 'நீங்கள் வாந்தி எடுக்கிறீர்களா?',
    breathingDifficulty: 'சுவாசிப்பதில் சிரமம்?',
    startTest: 'பரிசோதனையைத் தொடங்குங்கள்',
    uploadBefore: 'நனைப்பதற்கு முன் புகைப்படம் பதிவேற்றுங்கள்',
    uploadAfter: 'நனைத்த பின் புகைப்படம் பதிவேற்றுங்கள்',
    analyze: 'புகைப்படங்களை பகுப்பாய்வு செய்யுங்கள்',
    saveResult: 'முடிவை சேமிக்கவும்',
    sendToDoctor: 'மருத்துவருக்கு அனுப்புங்கள்',
    weight: 'எடை',
    bloodPressure: 'இரத்த அழுத்தம்',
    urineAmount: 'சிறுநீர் அளவு',
    fluidIntake: 'திரவ உட்கொள்ளல்',
    askQuestion: 'கேள்வி கேளுங்கள்',
    repeatInstruction: 'கடைசி அறிவுறுத்தலை மீண்டும் சொல்லுங்கள்',
    helpMe: 'உதவுங்கள்',
    assistantIntro1: 'வணக்கம்! நான் உங்கள் KidneyCare உதவியாளர்.',
    assistantIntro2: 'நான் தினமும் உங்களுக்கு உதவுவேன்.',
    start: 'தொடங்கு',
    takenToday: 'இன்று எடுத்தது',
    takenYesterday: 'நேற்று எடுத்தது',
    setReminder: 'நினைவூட்டல் அமைக்கவும்',
    education: 'கற்றுக்கொள்',
    whatIsKidneyDisease: 'சிறுநீரக நோய் என்றால் என்ன?',
    howToDoUrineTest: 'சிறுநீர் பரிசோதனை எப்படி செய்வது',
    foodToEat: 'சாப்பிட வேண்டிய உணவு',
    whenToGoHospital: 'எப்போது மருத்துவமனைக்குச் செல்ல வேண்டும்',
    instructions: 'வழிமுறைகள்',
    checkExpiry: 'பாட்டிலில் காலாவதி தேதியை சரிபாருங்கள்',
    useFreshUrine: 'சுத்தமான பாத்திரத்தில் புதிய மிட்ஸ்ட்ரீம் சிறுநீரை சேகரிக்கவும்',
    dipStrip: 'அனைத்து பேட்களையும் சிறுநீரில் 1-2 வினாடிகள் மட்டுமே நனைக்கவும்',
    negative: 'எதிர்மறை',
    trace: 'தடயம்',
    resultExplanation: 'இது உங்கள் சிறுநீரில் புரத அளவைக் காட்டுகிறது',
    back: 'பின்னால்',
    next: 'அடுத்து',
    save: 'சேமி',
    cancel: 'ரத்து',
    skip: 'தவிர்க்கவும்',
    done: 'முடிந்தது',
    welcomeProfile: 'வரவேற்கிறோம்!',
    letsSetupProfile: 'உங்கள் சுகாதார சுயவிவரத்தை அமைப்போம்',
    listen: 'கேளுங்கள்',
    voiceOn: 'குரல் இயக்கம்',
    voiceOff: 'குரல் நிறுத்தம்',
    tapToSpeak: 'பேச மைக்ரோஃபோனில் தட்டவும்',
    whatIsYourName: 'உங்கள் பெயர் என்ன?',
    enterFullName: 'உங்கள் முழு பெயரை உள்ளிடுங்கள்',
    typeName: 'உங்கள் பெயரை தட்டச்சு செய்யுங்கள்...',
    typeHere: 'இங்கே தட்டச்சு செய்யுங்கள்...',
    whenWereYouBorn: 'நீங்கள் எப்போது பிறந்தீர்கள்?',
    selectDOB: 'உங்கள் பிறந்த தேதியைத் தேர்ந்தெடுக்கவும்',
    whatIsYourWeight: 'உங்கள் எடை என்ன?',
    enterWeightKg: 'உங்கள் எடையை கிலோகிராமில் உள்ளிடுங்கள்',
    weightKg: 'எடை (கிலோ)',
    whatIsYourHeight: 'உங்கள் உயரம் என்ன?',
    enterHeightCm: 'உங்கள் உயரத்தை சென்டிமீட்டரில் உள்ளிடுங்கள்',
    heightCm: 'உயரம் (செமீ)',
    whatIsYourSex: 'உங்கள் பாலினம் என்ன?',
    selectSex: 'உங்கள் பாலினத்தைத் தேர்ந்தெடுக்கவும்',
    male: 'ஆண்',
    female: 'பெண்',
    other: 'மற்றவை',
    whatIsYourDiagnosis: 'உங்கள் நோய் கண்டறிதல் என்ன?',
    selectNSType: 'உங்கள் நெஃப்ரோட்டிக் சிண்ட்ரோம் வகையைத் தேர்ந்தெடுக்கவும்',
    ifrns: 'IFRNS - குறைந்த மறுபிறப்பு',
    frns: 'FRNS - அடிக்கடி மறுபிறப்பு',
    sdns: 'SDNS - ஸ்டீராய்டு சார்ந்த',
    srns: 'SRNS - ஸ்டீராய்டு எதிர்ப்பு',
    medicationManagement: 'உங்கள் மருந்துகள்',
    manageYourMedications: 'உங்கள் பரிந்துரைக்கப்பட்ட மருந்துகளை சேர்க்கவும்',
    activeMedications: 'செயலில் உள்ள மருந்துகள்',
    medicationsYouAreTaking: 'நீங்கள் தற்போது எடுத்துக்கொள்ளும் மருந்துகள்',
    noActiveMedications: 'இன்னும் மருந்துகள் சேர்க்கப்படவில்லை',
    addMedicationsToTrack: 'தினசரி கண்காணிக்க உங்கள் மருந்துகளை சேர்க்கவும்',
    addFirstMedication: 'முதல் மருந்தை சேர்க்கவும்',
    addMedication: 'மருந்து சேர்க்கவும்',
    addNewMedication: 'புதிய மருந்து சேர்க்கவும்',
    addMedicationToTreatment: 'உங்கள் சிகிச்சை திட்டத்தில் ஒரு மருந்தை சேர்க்கவும்',
    uploadPrescription: 'மருந்துச்சீட்டை பதிவேற்றவும் (விருப்பத்தேர்வு)',
    uploadPrescriptionPhoto: 'உங்கள் மருந்துச்சீட்டின் புகைப்படத்தை பதிவேற்றவும்',
    chooseImage: 'படத்தைத் தேர்ந்தெடுக்கவும்',
    takePhoto: 'புகைப்படம் எடுங்கள்',
    medicationDetails: 'மருந்து விவரங்கள்',
    medicationName: 'மருந்தின் பெயர்',
    selectMedication: 'மருந்தின் பெயரைத் தேர்ந்தெடுக்கவும் அல்லது தட்டச்சு செய்யவும்',
    dosage: 'அளவு',
    dosagePlaceholder: 'எ.கா., 20mg, 500mg',
    frequency: 'எத்தனை முறை?',
    selectFrequency: 'அதிர்வெண்ணைத் தேர்ந்தெடுக்கவும்',
    route: 'எப்படி எடுப்பது?',
    selectRoute: 'வழியைத் தேர்ந்தெடுக்கவும்',
    startDate: 'தொடக்க தேதி',
    finishSetup: 'அமைப்பை முடிக்கவும்',
    onceDaily: 'நாளொன்றுக்கு ஒரு முறை',
    twiceDaily: 'நாளொன்றுக்கு இரண்டு முறை',
    thriceDaily: 'நாளொன்றுக்கு மூன்று முறை',
    alternateDays: 'ஒரு நாள் விட்டு ஒரு நாள்',
    weekly: 'வாரத்திற்கு ஒரு முறை',
    asNeeded: 'தேவைப்படும்போது',
    otherFrequency: 'மற்றவை (தட்டச்சு)',
    oral: 'வாய்வழி',
    injection: 'ஊசி',
    topical: 'தோலில்',
    otherRoute: 'மற்றவை',
    setDailyReminder: 'தினசரி நினைவூட்டலை அமைக்கவும்',
    whenToRemind: 'தினமும் எப்போது உங்களுக்கு நினைவூட்ட வேண்டும்?',
    reminderHelp: 'சிறுநீர் பரிசோதனை மற்றும் மருந்து எடுக்க நினைவூட்டுவோம்',
    selectTime: 'நேரத்தைத் தேர்ந்தெடுக்கவும்',
    morning: 'காலை',
    afternoon: 'மதியம்',
    evening: 'மாலை',
    dailyCheckIn: 'தினசரி சுகாதார சோதனை',
    goodMorningCheckIn: 'காலை வணக்கம்! உங்கள் தினசரி சோதனை நேரம்',
    letsStartDay: 'உங்கள் சிறுநீர் பரிசோதனையுடன் தொடங்குவோம்',
    urineTestReminder: 'சிறுநீர் பரிசோதனை நேரம்',
    medicationReminder: 'மருந்து சோதனை',
    didYouTakeMedicines: 'நேற்று உங்கள் மருந்துகளை எடுத்தீர்களா?',
    markTakenMedicines: 'நேற்று எடுத்த ஒவ்வொரு மருந்தையும் தட்டவும்',
    addExtraMedicine: 'எடுத்த வேறு மருந்தைச் சேர்க்கவும்',
    allDone: 'எல்லாம் முடிந்தது!',
    greatJob: 'நல்லது! உங்கள் தினசரி சோதனை முடிந்தது!',
    urineTestInstructions: 'சிறுநீர் பரிசோதனை எப்படி செய்வது',
    step1: 'படி 1: தயாரிப்பு',
    step1Desc: 'பாட்டிலிலிருந்து ஒரு ஸ்ட்ரிப் எடுங்கள். பாட்டிலை இறுக்கமாக மூடி வைக்கவும்.',
    step2: 'படி 2: சேகரிக்கவும்',
    step2Desc: 'சுத்தமான பாத்திரத்தில் புதிய சிறுநீரை சேகரிக்கவும். மிட்ஸ்ட்ரீமைப் பயன்படுத்தவும்.',
    step3: 'படி 3: நனைக்கவும்',
    step3Desc: 'அனைத்து வண்ண பேட்களையும் சிறுநீரில் 1-2 வினாடிகள் மட்டுமே நனைக்கவும்.',
    step4: 'படி 4: அகற்றவும்',
    step4Desc: 'ஸ்ட்ரிப்பை அகற்றவும். அதிகப்படியான சிறுநீரை அகற்ற விளிம்பை பாத்திரத்தில் ஓட்டவும்.',
    step5: 'படி 5: காத்திருங்கள்',
    step5Desc: 'ஸ்ட்ரிப்பை தட்டையாக (கிடைமட்டமாக) பிடிக்கவும். சரியாக 60 வினாடிகள் காத்திருங்கள்.',
    step6: 'படி 6: படிக்கவும்',
    step6Desc: '60 வினாடிகளுக்குள் புரதப் பேட் நிறத்தை பாட்டிலில் உள்ள சார்ட்டுடன் ஒப்பிடவும்.',
    selectResult: 'உங்கள் முடிவைத் தேர்ந்தெடுக்கவும்',
    whatColorDoYouSee: 'புரதப் பேடில் என்ன நிறம் பார்க்கிறீர்கள்?',
    orUploadPhotos: 'அல்லது பகுப்பாய்வுக்கு புகைப்படங்களை பதிவேற்றவும்',
    resultNegative: 'எதிர்மறை - புரதம் இல்லை',
    resultTrace: 'தடயம் - மிகக் குறைந்த அளவு',
    result1Plus: '1+ இலேசான புரதம்',
    result2Plus: '2+ மிதமான புரதம்',
    result3Plus: '3+ உயர் புரதம்',
    result4Plus: '4+ மிக உயர் புரதம்',
    kg: 'கிலோ',
    cm: 'செமீ',
    commonMedications: [
      'பிரெட்னிசோலோன்',
      'டாக்ரோலிமஸ்',
      'சைக்ளோஸ்போரின்',
      'மைக்கோஃபெனோலேட்',
      'ரிடக்சிமாப்',
      'லெவாமிசோல்',
      'ACE இன்ஹிபிட்டர்',
      'ARB',
      'ஃபுரோசெமைட்',
      'அட்டோர்வாஸ்டாடின்',
      'கால்சியம்',
      'வைட்டமின் D',
      'மற்றவை'
    ],
  },
  pa: {
    selectLanguage: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',
    tapToSelect: 'ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਤੇ ਟੈਪ ਕਰੋ',
    english: 'ਅੰਗਰੇਜ਼ੀ',
    hindi: 'ਹਿੰਦੀ',
    bengali: 'ਬੰਗਾਲੀ',
    tamil: 'ਤਾਮਿਲ',
    punjabi: 'ਪੰਜਾਬੀ',
    welcome: 'ਕਿਡਨੀਕੇਅਰ ਵਿੱਚ ਸਵਾਗਤ ਹੈ',
    chooseLanguage: 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',
    continue: 'ਜਾਰੀ ਰੱਖੋ',
    consent: 'ਮੈਂ ਆਪਣੇ ਡਾਕਟਰ ਨਾਲ ਆਪਣਾ ਸਿਹਤ ਡੇਟਾ ਸਾਂਝਾ ਕਰਨ ਲਈ ਸਹਿਮਤ ਹਾਂ',
    iUnderstand: 'ਮੈਂ ਸਮਝਦਾ/ਸਮਝਦੀ ਹਾਂ, ਜਾਰੀ ਰੱਖੋ',
    greeting: 'ਸ਼ੁਭ ਸਵੇਰ',
    howAreYouFeeling: 'ਅੱਜ ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?',
    doUrineTest: 'ਪਿਸ਼ਾਬ ਦੀ ਜਾਂਚ ਕਰੋ',
    checkMedicines: 'ਦਵਾਈਆਂ ਦੀ ਜਾਂਚ ਕਰੋ',
    enterHealthData: 'ਅੱਜ ਦਾ ਸਿਹਤ ਡੇਟਾ ਦਰਜ ਕਰੋ',
    veryGood: 'ਬਹੁਤ ਵਧੀਆ',
    okay: 'ਠੀਕ ਹੈ',
    notWell: 'ਠੀਕ ਨਹੀਂ',
    yes: 'ਹਾਂ',
    no: 'ਨਹੀਂ',
    swelling: 'ਕੀ ਤੁਹਾਨੂੰ ਸੋਜ ਹੈ?',
    fever: 'ਕੀ ਤੁਹਾਨੂੰ ਬੁਖਾਰ ਹੈ?',
    vomiting: 'ਕੀ ਤੁਹਾਨੂੰ ਉਲਟੀ ਹੋ ਰਹੀ ਹੈ?',
    breathingDifficulty: 'ਸਾਹ ਲੈਣ ਵਿੱਚ ਮੁਸ਼ਕਲ?',
    startTest: 'ਜਾਂਚ ਸ਼ੁਰੂ ਕਰੋ',
    uploadBefore: 'ਡੁਬੋਣ ਤੋਂ ਪਹਿਲਾਂ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ',
    uploadAfter: 'ਡੁਬੋਣ ਤੋਂ ਬਾਅਦ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ',
    analyze: 'ਫੋਟੋ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ',
    saveResult: 'ਨਤੀਜਾ ਸੁਰੱਖਿਅਤ ਕਰੋ',
    sendToDoctor: 'ਡਾਕਟਰ ਨੂੰ ਭੇਜੋ',
    weight: 'ਭਾਰ',
    bloodPressure: 'ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ',
    urineAmount: 'ਪਿਸ਼ਾਬ ਦੀ ਮਾਤਰਾ',
    fluidIntake: 'ਪਾਣੀ ਦੀ ਮਾਤਰਾ',
    askQuestion: 'ਸਵਾਲ ਪੁੱਛੋ',
    repeatInstruction: 'ਆਖਰੀ ਹਦਾਇਤ ਦੁਹਰਾਓ',
    helpMe: 'ਮਦਦ ਕਰੋ',
    assistantIntro1: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਕਿਡਨੀਕੇਅਰ ਸਹਾਇਕ ਹਾਂ।',
    assistantIntro2: 'ਮੈਂ ਹਰ ਰੋਜ਼ ਤੁਹਾਡੀ ਮਦਦ ਕਰਾਂਗਾ।',
    start: 'ਸ਼ੁਰੂ ਕਰੋ',
    takenToday: 'ਅੱਜ ਲਈ ਗਈ',
    takenYesterday: 'ਕੱਲ੍ਹ ਲਈ ਗਈ',
    setReminder: 'ਰਿਮਾਈਂਡਰ ਸੈੱਟ ਕਰੋ',
    education: 'ਸਿੱਖੋ',
    whatIsKidneyDisease: 'ਗੁਰਦੇ ਦੀ ਬਿਮਾਰੀ ਕੀ ਹੈ?',
    howToDoUrineTest: 'ਪਿਸ਼ਾਬ ਦੀ ਜਾਂਚ ਕਿਵੇਂ ਕਰਨੀ ਹੈ',
    foodToEat: 'ਖਾਣ ਲਈ ਭੋਜਨ',
    whenToGoHospital: 'ਹਸਪਤਾਲ ਕਦੋਂ ਜਾਣਾ ਹੈ',
    instructions: 'ਹਦਾਇਤਾਂ',
    checkExpiry: 'ਬੋਤਲ ਤੇ ਮਿਆਦ ਦੀ ਤਾਰੀਖ ਦੇਖੋ',
    useFreshUrine: 'ਸਾਫ਼ ਭਾਂਡੇ ਵਿੱਚ ਤਾਜ਼ਾ ਮਿਡਸਟ੍ਰੀਮ ਪਿਸ਼ਾਬ ਇਕੱਠਾ ਕਰੋ',
    dipStrip: 'ਸਾਰੇ ਪੈਡਾਂ ਨੂੰ ਪਿਸ਼ਾਬ ਵਿੱਚ ਸਿਰਫ਼ 1-2 ਸਕਿੰਟ ਲਈ ਡੁਬੋਓ',
    negative: 'ਨਕਾਰਾਤਮਕ',
    trace: 'ਟ੍ਰੇਸ',
    resultExplanation: 'ਇਹ ਤੁਹਾਡੇ ਪਿਸ਼ਾਬ ਵਿੱਚ ਪ੍ਰੋਟੀਨ ਦਾ ਪੱਧਰ ਦਿਖਾਉਂਦਾ ਹੈ',
    back: 'ਪਿੱਛੇ',
    next: 'ਅੱਗੇ',
    save: 'ਸੁਰੱਖਿਅਤ ਕਰੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    skip: 'ਛੱਡੋ',
    done: 'ਹੋ ਗਿਆ',
    welcomeProfile: 'ਸਵਾਗਤ ਹੈ!',
    letsSetupProfile: 'ਆਓ ਤੁਹਾਡੀ ਸਿਹਤ ਪ੍ਰੋਫਾਈਲ ਸੈੱਟ ਕਰੀਏ',
    listen: 'ਸੁਣੋ',
    voiceOn: 'ਅਵਾਜ਼ ਚਾਲੂ',
    voiceOff: 'ਅਵਾਜ਼ ਬੰਦ',
    tapToSpeak: 'ਬੋਲਣ ਲਈ ਮਾਈਕ੍ਰੋਫੋਨ ਤੇ ਟੈਪ ਕਰੋ',
    whatIsYourName: 'ਤੁਹਾਡਾ ਨਾਮ ਕੀ ਹੈ?',
    enterFullName: 'ਆਪਣਾ ਪੂਰਾ ਨਾਮ ਦਰਜ ਕਰੋ',
    typeName: 'ਆਪਣਾ ਨਾਮ ਲਿਖੋ...',
    typeHere: 'ਇੱਥੇ ਲਿਖੋ...',
    whenWereYouBorn: 'ਤੁਸੀਂ ਕਦੋਂ ਪੈਦਾ ਹੋਏ?',
    selectDOB: 'ਆਪਣੀ ਜਨਮ ਮਿਤੀ ਚੁਣੋ',
    whatIsYourWeight: 'ਤੁਹਾਡਾ ਭਾਰ ਕਿੰਨਾ ਹੈ?',
    enterWeightKg: 'ਆਪਣਾ ਭਾਰ ਕਿਲੋਗ੍ਰਾਮ ਵਿੱਚ ਦਰਜ ਕਰੋ',
    weightKg: 'ਭਾਰ (ਕਿਲੋ)',
    whatIsYourHeight: 'ਤੁਹਾਡੀ ਉਚਾਈ ਕਿੰਨੀ ਹੈ?',
    enterHeightCm: 'ਆਪਣੀ ਉਚਾਈ ਸੈਂਟੀਮੀਟਰ ਵਿੱਚ ਦਰਜ ਕਰੋ',
    heightCm: 'ਉਚਾਈ (ਸੈਮੀ)',
    whatIsYourSex: 'ਤੁਹਾਡਾ ਲਿੰਗ ਕੀ ਹੈ?',
    selectSex: 'ਆਪਣਾ ਲਿੰਗ ਚੁਣੋ',
    male: 'ਪੁਰਸ਼',
    female: 'ਔਰਤ',
    other: 'ਹੋਰ',
    whatIsYourDiagnosis: 'ਤੁਹਾਡਾ ਨਿਦਾਨ ਕੀ ਹੈ?',
    selectNSType: 'ਆਪਣੀ ਨੈਫ੍ਰੋਟਿਕ ਸਿੰਡਰੋਮ ਕਿਸਮ ਚੁਣੋ',
    ifrns: 'IFRNS - ਘੱਟ ਵਾਰ ਰਿਲੈਪਸ',
    frns: 'FRNS - ਵਾਰ-ਵਾਰ ਰਿਲੈਪਸ',
    sdns: 'SDNS - ਸਟੀਰੌਇਡ ਨਿਰਭਰ',
    srns: 'SRNS - ਸਟੀਰੌਇਡ ਪ੍ਰਤੀਰੋਧੀ',
    medicationManagement: 'ਤੁਹਾਡੀਆਂ ਦਵਾਈਆਂ',
    manageYourMedications: 'ਆਪਣੀਆਂ ਤਜਵੀਜ਼ ਕੀਤੀਆਂ ਦਵਾਈਆਂ ਸ਼ਾਮਲ ਕਰੋ',
    activeMedications: 'ਸਰਗਰਮ ਦਵਾਈਆਂ',
    medicationsYouAreTaking: 'ਜੋ ਦਵਾਈਆਂ ਤੁਸੀਂ ਹੁਣ ਲੈ ਰਹੇ ਹੋ',
    noActiveMedications: 'ਅਜੇ ਕੋਈ ਦਵਾਈ ਸ਼ਾਮਲ ਨਹੀਂ ਕੀਤੀ',
    addMedicationsToTrack: 'ਰੋਜ਼ਾਨਾ ਟ੍ਰੈਕ ਕਰਨ ਲਈ ਆਪਣੀਆਂ ਦਵਾਈਆਂ ਸ਼ਾਮਲ ਕਰੋ',
    addFirstMedication: 'ਪਹਿਲੀ ਦਵਾਈ ਸ਼ਾਮਲ ਕਰੋ',
    addMedication: 'ਦਵਾਈ ਸ਼ਾਮਲ ਕਰੋ',
    addNewMedication: 'ਨਵੀਂ ਦਵਾਈ ਸ਼ਾਮਲ ਕਰੋ',
    addMedicationToTreatment: 'ਆਪਣੀ ਇਲਾਜ ਯੋਜਨਾ ਵਿੱਚ ਦਵਾਈ ਸ਼ਾਮਲ ਕਰੋ',
    uploadPrescription: 'ਪਰਚੀ ਅਪਲੋਡ ਕਰੋ (ਵਿਕਲਪਿਕ)',
    uploadPrescriptionPhoto: 'ਆਪਣੀ ਪਰਚੀ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ',
    chooseImage: 'ਫੋਟੋ ਚੁਣੋ',
    takePhoto: 'ਫੋਟੋ ਲਓ',
    medicationDetails: 'ਦਵਾਈ ਵੇਰਵੇ',
    medicationName: 'ਦਵਾਈ ਦਾ ਨਾਮ',
    selectMedication: 'ਦਵਾਈ ਦਾ ਨਾਮ ਚੁਣੋ ਜਾਂ ਲਿਖੋ',
    dosage: 'ਖੁਰਾਕ',
    dosagePlaceholder: 'ਜਿਵੇਂ, 20mg, 500mg',
    frequency: 'ਕਿੰਨੀ ਵਾਰ?',
    selectFrequency: 'ਆਵਿਰਤੀ ਚੁਣੋ',
    route: 'ਕਿਵੇਂ ਲੈਣੀ ਹੈ?',
    selectRoute: 'ਰਸਤਾ ਚੁਣੋ',
    startDate: 'ਸ਼ੁਰੂ ਮਿਤੀ',
    finishSetup: 'ਸੈੱਟਅੱਪ ਪੂਰਾ ਕਰੋ',
    onceDaily: 'ਦਿਨ ਵਿੱਚ ਇੱਕ ਵਾਰ',
    twiceDaily: 'ਦਿਨ ਵਿੱਚ ਦੋ ਵਾਰ',
    thriceDaily: 'ਦਿਨ ਵਿੱਚ ਤਿੰਨ ਵਾਰ',
    alternateDays: 'ਇੱਕ ਦਿਨ ਛੱਡ ਕੇ',
    weekly: 'ਹਫ਼ਤੇ ਵਿੱਚ ਇੱਕ ਵਾਰ',
    asNeeded: 'ਲੋੜ ਅਨੁਸਾਰ',
    otherFrequency: 'ਹੋਰ (ਲਿਖੋ)',
    oral: 'ਮੂੰਹ ਰਾਹੀਂ',
    injection: 'ਇੰਜੈਕਸ਼ਨ',
    topical: 'ਚਮੜੀ ਤੇ',
    otherRoute: 'ਹੋਰ',
    setDailyReminder: 'ਰੋਜ਼ਾਨਾ ਰਿਮਾਈਂਡਰ ਸੈੱਟ ਕਰੋ',
    whenToRemind: 'ਅਸੀਂ ਤੁਹਾਨੂੰ ਰੋਜ਼ ਕਦੋਂ ਯਾਦ ਦਿਵਾਈਏ?',
    reminderHelp: 'ਅਸੀਂ ਤੁਹਾਨੂੰ ਪਿਸ਼ਾਬ ਜਾਂਚ ਅਤੇ ਦਵਾਈਆਂ ਲੈਣ ਦੀ ਯਾਦ ਦਿਵਾਵਾਂਗੇ',
    selectTime: 'ਸਮਾਂ ਚੁਣੋ',
    morning: 'ਸਵੇਰ',
    afternoon: 'ਦੁਪਹਿਰ',
    evening: 'ਸ਼ਾਮ',
    dailyCheckIn: 'ਰੋਜ਼ਾਨਾ ਸਿਹਤ ਜਾਂਚ',
    goodMorningCheckIn: 'ਸ਼ੁਭ ਸਵੇਰ! ਤੁਹਾਡੀ ਰੋਜ਼ਾਨਾ ਜਾਂਚ ਦਾ ਸਮਾਂ',
    letsStartDay: 'ਆਓ ਪਿਸ਼ਾਬ ਦੀ ਜਾਂਚ ਨਾਲ ਸ਼ੁਰੂ ਕਰੀਏ',
    urineTestReminder: 'ਪਿਸ਼ਾਬ ਜਾਂਚ ਦਾ ਸਮਾਂ',
    medicationReminder: 'ਦਵਾਈ ਜਾਂਚ',
    didYouTakeMedicines: 'ਕੀ ਤੁਸੀਂ ਕੱਲ੍ਹ ਆਪਣੀਆਂ ਦਵਾਈਆਂ ਲਈਆਂ?',
    markTakenMedicines: 'ਕੱਲ੍ਹ ਜੋ ਦਵਾਈਆਂ ਲਈਆਂ ਹਰ ਇੱਕ ਤੇ ਟੈਪ ਕਰੋ',
    addExtraMedicine: 'ਕੋਈ ਹੋਰ ਦਵਾਈ ਜੋ ਲਈ ਹੋਵੇ ਸ਼ਾਮਲ ਕਰੋ',
    allDone: 'ਸਭ ਹੋ ਗਿਆ!',
    greatJob: 'ਬਹੁਤ ਵਧੀਆ! ਤੁਹਾਡੀ ਰੋਜ਼ਾਨਾ ਜਾਂਚ ਪੂਰੀ ਹੋਈ!',
    urineTestInstructions: 'ਪਿਸ਼ਾਬ ਜਾਂਚ ਕਿਵੇਂ ਕਰਨੀ ਹੈ',
    step1: 'ਕਦਮ 1: ਤਿਆਰੀ',
    step1Desc: 'ਬੋਤਲ ਵਿੱਚੋਂ ਇੱਕ ਸਟ੍ਰਿਪ ਲਓ। ਬੋਤਲ ਨੂੰ ਕੱਸ ਕੇ ਬੰਦ ਰੱਖੋ।',
    step2: 'ਕਦਮ 2: ਇਕੱਠਾ ਕਰੋ',
    step2Desc: 'ਸਾਫ਼ ਭਾਂਡੇ ਵਿੱਚ ਤਾਜ਼ਾ ਪਿਸ਼ਾਬ ਇਕੱਠਾ ਕਰੋ। ਮਿਡਸਟ੍ਰੀਮ ਵਰਤੋ।',
    step3: 'ਕਦਮ 3: ਡੁਬੋਓ',
    step3Desc: 'ਸਾਰੇ ਰੰਗੀਨ ਪੈਡਾਂ ਨੂੰ ਪਿਸ਼ਾਬ ਵਿੱਚ ਸਿਰਫ਼ 1-2 ਸਕਿੰਟ ਲਈ ਡੁਬੋਓ।',
    step4: 'ਕਦਮ 4: ਬਾਹਰ ਕੱਢੋ',
    step4Desc: 'ਸਟ੍ਰਿਪ ਬਾਹਰ ਕੱਢੋ। ਵਾਧੂ ਪਿਸ਼ਾਬ ਹਟਾਉਣ ਲਈ ਕਿਨਾਰੇ ਨੂੰ ਭਾਂਡੇ ਦੀ ਕੰਧ ਤੇ ਲਗਾਓ।',
    step5: 'ਕਦਮ 5: ਉਡੀਕ ਕਰੋ',
    step5Desc: 'ਸਟ੍ਰਿਪ ਨੂੰ ਸਮਤਲ (ਖਿਤਿਜੀ) ਫੜੋ। ਬਿਲਕੁਲ 60 ਸਕਿੰਟ ਉਡੀਕ ਕਰੋ।',
    step6: 'ਕਦਮ 6: ਪੜ੍ਹੋ',
    step6Desc: '60 ਸਕਿੰਟਾਂ ਦੇ ਅੰਦਰ ਪ੍ਰੋਟੀਨ ਪੈਡ ਦੇ ਰੰਗ ਨੂੰ ਬੋਤਲ ਦੇ ਚਾਰਟ ਨਾਲ ਮਿਲਾਓ।',
    selectResult: 'ਆਪਣਾ ਨਤੀਜਾ ਚੁਣੋ',
    whatColorDoYouSee: 'ਪ੍ਰੋਟੀਨ ਪੈਡ ਤੇ ਤੁਹਾਨੂੰ ਕਿਹੜਾ ਰੰਗ ਦਿਖਾਈ ਦਿੰਦਾ ਹੈ?',
    orUploadPhotos: 'ਜਾਂ ਵਿਸ਼ਲੇਸ਼ਣ ਲਈ ਫੋਟੋਆਂ ਅਪਲੋਡ ਕਰੋ',
    resultNegative: 'ਨਕਾਰਾਤਮਕ - ਕੋਈ ਪ੍ਰੋਟੀਨ ਨਹੀਂ',
    resultTrace: 'ਟ੍ਰੇਸ - ਬਹੁਤ ਘੱਟ ਮਾਤਰਾ',
    result1Plus: '1+ ਹਲਕਾ ਪ੍ਰੋਟੀਨ',
    result2Plus: '2+ ਦਰਮਿਆਨਾ ਪ੍ਰੋਟੀਨ',
    result3Plus: '3+ ਉੱਚਾ ਪ੍ਰੋਟੀਨ',
    result4Plus: '4+ ਬਹੁਤ ਉੱਚਾ ਪ੍ਰੋਟੀਨ',
    kg: 'ਕਿਲੋ',
    cm: 'ਸੈਮੀ',
    commonMedications: [
      'ਪ੍ਰੈਡਨੀਸੋਲੋਨ',
      'ਟੈਕਰੋਲਿਮਸ',
      'ਸਾਈਕਲੋਸਪੋਰਿਨ',
      'ਮਾਈਕੋਫੀਨੋਲੇਟ',
      'ਰਿਟਕਸੀਮੈਬ',
      'ਲੈਵਾਮਿਸੋਲ',
      'ACE ਇਨਹਿਬਿਟਰ',
      'ARB',
      'ਫਿਊਰੋਸੇਮਾਈਡ',
      'ਅਟੋਰਵੈਸਟੈਟਿਨ',
      'ਕੈਲਸ਼ੀਅਮ',
      'ਵਿਟਾਮਿਨ D',
      'ਹੋਰ'
    ],
  },
}

export function getTranslations(language: Language) {
  return translations[language] || translations.en
}

const AppContext = createContext<AppState | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  const [hasConsented, setHasConsented] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [hasCompletedPatientProfile, setHasCompletedPatientProfile] = useState(false)
  const [currentScreen, setCurrentScreen] = useState('language-selection')
  const [healthData, setHealthData] = useState<HealthData[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>([])
  const [urineTests, setUrineTests] = useState<UrineTestResult[]>([])
  const [dailyCheckIns, setDailyCheckIns] = useState<DailyCheckIn[]>([])
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false)
  
  const [patientProfile, setPatientProfile] = useState<PatientProfile>({
    name: '',
    dateOfBirth: '',
    age: 0,
    sex: '',
    weight: 0,
    height: 0,
    diagnosis: '',
    diagnosisDate: '',
    doctorName: '',
    hospitalName: '',
    reminderTime: '08:00',
  })

  const updatePatientProfile = (updates: Partial<PatientProfile>) => {
    setPatientProfile(prev => ({ ...prev, ...updates }))
  }

  const addHealthData = (data: HealthData) => {
    setHealthData(prev => [...prev, data])
  }

  const addMedication = (med: Medication) => {
    setMedications(prev => [...prev, med])
  }

  const updateMedication = (id: string, updates: Partial<Medication>) => {
    setMedications(prev => 
      prev.map(med => med.id === id ? { ...med, ...updates } : med)
    )
  }

  const removeMedication = (id: string) => {
    setMedications(prev => prev.filter(med => med.id !== id))
  }

  const toggleMedicationTaken = (id: string) => {
    setMedications(prev =>
      prev.map(med => med.id === id ? { ...med, takenToday: !med.takenToday } : med)
    )
  }

  const toggleMedicationTakenYesterday = (id: string) => {
    setMedications(prev =>
      prev.map(med => med.id === id ? { ...med, takenYesterday: !med.takenYesterday } : med)
    )
  }

  const addSymptomEntry = (entry: SymptomEntry) => {
    setSymptomEntries(prev => [...prev, entry])
  }

  const addUrineTest = (test: UrineTestResult) => {
    setUrineTests(prev => [...prev, test])
  }

  const addDailyCheckIn = (checkIn: DailyCheckIn) => {
    setDailyCheckIns(prev => [...prev, checkIn])
  }

  const updateDailyCheckIn = (date: string, updates: Partial<DailyCheckIn>) => {
    setDailyCheckIns(prev =>
      prev.map(c => c.date === date ? { ...c, ...updates } : c)
    )
  }

  const getTodayCheckIn = () => {
    const today = new Date().toISOString().split('T')[0]
    return dailyCheckIns.find(c => c.date === today)
  }

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      hasConsented,
      setHasConsented,
      hasCompletedOnboarding,
      setHasCompletedOnboarding,
      hasCompletedPatientProfile,
      setHasCompletedPatientProfile,
      patientProfile,
      setPatientProfile,
      updatePatientProfile,
      currentScreen,
      setCurrentScreen,
      healthData,
      addHealthData,
      medications,
      setMedications,
      addMedication,
      updateMedication,
      removeMedication,
      toggleMedicationTaken,
      toggleMedicationTakenYesterday,
      symptomEntries,
      addSymptomEntry,
      urineTests,
      addUrineTest,
      dailyCheckIns,
      addDailyCheckIn,
      updateDailyCheckIn,
      getTodayCheckIn,
      isVoiceEnabled,
      setIsVoiceEnabled,
      showDailyCheckIn,
      setShowDailyCheckIn,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
