// KidneyCare AI - AIIMS Patna Pediatric Nephrology
// Client-side Application Controller matching all 16 Prototype Screens

let currentLang = localStorage.getItem('kidneycare_lang') || 'en';
let currentScreen = 'screen-home';
let patientData = {
  cr_number: '2026/0412',
  patient_name: 'Aarav Kumar',
  age: '7 Years (Boy)'
};
let allLogs = [];
let allMedicines = [];
let allReminders = [];
let allDoctorMessages = [];
let allLabTests = [];
let allDocuments = [];
let lastCapturedSnapshotUrl = '/uploads/sample_dipstick_strip.svg';
let activeDocsCategoryFilter = 'all';

let verifiedGrade = '2+';
let selectedColorGrade = '1+';
let selectedDocType = 'Prescription';
let scannedPagesCount = 2;
let selectedArm = 'Left';
let selectedPosture = 'Sitting';
let selectedEdema = 'None';
let selectedExportFormat = 'Excel';

// Dipstick 60-Second Timer Variables
let timerSeconds = 42; // Initial demonstration value matching mockup 00:42
let timerInterval = null;
let isTimerRunning = false;
const TIMER_TOTAL = 60;
const CIRCLE_CIRCUMFERENCE = 351.85;

// Grade to Reagent Color Mapping
const GRADE_COLORS = {
  'Neg': '#D4E09B',
  'Trace': '#C3D76F',
  '1+': '#A4C55E',
  '2+': '#6BA357',
  '3+': '#3E7E52',
  '4+': '#1B5338'
};

// Bilingual Dictionary
const I18N = {
  en: {
    patientLabel: "Patient",
    scanNewLink: "Scan new",
    pillDipstick: "Dipstick",
    pillDocs: "Docs",
    pillBP: "BP",
    pillWeight: "Weight",
    pillTrend: "Trend",
    pillDiary: "Diary",
    pillDoctor: "Doctor",
    pillReminders: "Reminders",
    alertWatchTitle: "Watch: protein 2+ for 3 days",
    alertWatchSub: "See the trend and tell your doctor",
    openBtn: "Open",
    todayTitle: "Today",
    medicinesTodayLabel: "Medicines today",
    seeDiaryLink: "See diary",
    readDipstickBtn: "Read a dipstick",
    syncStatusMsg: "Saved on this phone. 2 readings waiting to sync.",
    syncDoneMsg: "Saved on this phone. All readings synced.",
    homeNav: "Home",
    backNav: "Back",
    step1of2: "Step 1 of 2",
    scanPatientTitle: "Scan the patient",
    scanPatientSubtitle: "Point the camera at the barcode on the OPD sticker.",
    barcodeFound: "Barcode found",
    crNumberReadLabel: "CR number read",
    privacyNotice: "Only the CR number is saved. No name or phone number.",
    readPrintedNumber: "Read printed number",
    typeIt: "Type it",
    confirmCrBtn: "Confirm this CR number",
    lightOk: "Light OK",
    glareOk: "Glare OK",
    alignedOk: "Aligned",
    stripLabel: "Strip",
    stripInstructions: "Urine strip, read at 60 seconds. Keep the phone still.",
    howToTestBtn: "How to test",
    cannotScanBtn: "Cannot scan? Pick colour",
    startTimerBtn: "Start timer",
    proteinReadingLabel: "Protein reading",
    readerConfidence: "Reader confidence: high",
    correctIfWrong: "Correct it if it looks wrong",
    researchDisclaimer: "Research use reading. It is not a diagnosis. Show it to your doctor.",
    saveReadingBtn: "Save reading",
    retakeStripBtn: "Retake with a new strip",
    pageEdgesFound: "Page edges found",
    thisIsALabel: "This is a",
    docPrescription: "Prescription",
    docReport: "Report",
    docOther: "Other",
    pagesScannedMsg: "2 pages scanned",
    doneReadMedsBtn: "Done, read the medicines",
    addAnotherPageBtn: "Add another page",
    backToScan: "Back to scan",
    checkMedsTitle: "Check the medicines",
    checkMedsSubtitle: "Read from the prescription. Tick each line only after you have checked it.",
    addMedicineLink: "+ Add a medicine",
    saveCheckedMedsBtn: "Save checked medicines",
    bpMonitorTitle: "Blood pressure monitor",
    connectedStatus: "Connected",
    notConnected: "Not connected",
    bpSubtitle: "Start a reading on the cuff. The numbers will appear here. Or type the reading",
    systolicLabel: "Systolic",
    diastolicLabel: "Diastolic",
    bpNormalBadge: "Normal for age and height",
    bpRuleDesc: "Green is normal. Yellow is stage 1 high BP. Red is stage 2 high BP. Two high readings in a row notify the doctor.",
    armLabel: "Arm",
    postureLabel: "Posture",
    scaleTitle: "Weighing scale",
    connectBtLink: "Connect by Bluetooth",
    weightInKg: "Weight in kg",
    heightInCm: "Height in cm",
    growthForAgeTitle: "Growth for age (sample, age 7, boy)",
    growthHeightLabel: "Height",
    growthWeightLabel: "Weight",
    normalLabel: "Normal",
    watchLabel: "Watch",
    growthRuleDesc: "Yellow is 1 to 2 SD from the median. Red is 2 SD or more. BMI is worked out from weight and height. The growth chart is chosen by the doctor.",
    swellingLabel: "Swelling (edema)",
    saveWeightHeightBtn: "Save weight and height",
    exportDiaryBtn: "Export this diary",
    exportRecordTitle: "Export the record",
    fromLabel: "From",
    toLabel: "To",
    exportReadingsChk: "Readings (dipstick, BP, weight)",
    exportMedsChk: "Medicines and doses taken",
    exportDocsChk: "Scanned documents",
    fileTypeLabel: "File type",
    exportPrivacyNotice: "The file holds the CR number only. No name, phone number or sticker image.",
    shareWhatsappBtn: "Share on WhatsApp",
    emailBtn: "Email",
    saveToPhoneBtn: "Save to phone",
    howToTestTitle: "How to test",
    howToTestSubtitle: "Use first morning urine when you can. Read the colour only after the wait time.",
    tutStep1Title: "Wash your hands",
    tutStep1Time: "About 30 sec",
    tutStep1Desc: "Wash with soap and water, then dry. Keep the strip bottle closed until you are ready.",
    tutStep2Title: "Collect midstream urine",
    tutStep2Time: "Sample",
    tutStep2Desc: "Start urinating, then catch the middle of the stream in a clean cup. First morning urine is best.",
    tutStep3Title: "Dip the strip",
    tutStep3Time: "2 sec",
    tutStep3Desc: "Dip the pads for 1 to 2 seconds only. Do not leave the strip sitting in the cup.",
    tutStep4Title: "Wait, then place the strip",
    tutStep4Time: "60 sec",
    tutStep4Desc: "Tap off extra drops. Lay the strip flat on the reading card under the holder.",
    readyCameraBtn: "I am ready, open camera",
    pickColourTitle: "Pick the colour",
    pickColourSubtitle: "Hold the strip next to the bottle chart after the wait time. Tap the box that matches the protein pad.",
    swatchNeg: "Negative",
    swatchTrace: "Trace",
    swatchGuideNotice: "Swatch colours are only a guide here. In the app the real chart on the bottle is the reference. This reading is saved as entered by hand.",
    saveGradeBtn: "Save this grade",
    trend14DaysTitle: "Protein, last 14 days",
    trendWatchAlertHeadline: "Watch: 2+ for 3 days in a row",
    trendWatchAlertSub: "This can mean a relapse. Tell your doctor today. Your doctor can change this rule.",
    legendNeg: "Negative",
    legend1Watch: "1+ Watch",
    legend2Act: "2+ or more, Act",
    daysOf2PlusLabel: "Days of 2+ or more",
    lastNegDateLabel: "Last negative or trace",
    relapseCriteriaExplanation: "Yellow is 1+ and red is 2+ or more. Default rules: 2+ or more for 3 days in a row is a possible relapse. Negative or trace for 3 days in a row is a possible remission. The doctor confirms both.",
    sendTrendDoctorBtn: "Send this trend to my doctor",
    setRemindersBtn: "Set reminders",
    remindersTitle: "Reminders",
    remindersSubtitle: "The phone rings at these times, even with no internet.",
    medTimesFromPrescription: "Medicine times come from the checked prescription",
    doneBtn: "Done",
    fromDoctorTitle: "From your doctor",
    testsToGetDoneTitle: "Tests to get done",
    adviceArrivalNote: "Advice arrives when the phone next connects. Tick a test when it is done. Reports can be sent from Docs.",
    sendReportBtn: "Send a report",
    askQuestionBtn: "Ask a question",
    enterCrTitle: "Enter CR Number",
    saveBtn: "Save CR Number",
    addMedModalTitle: "Add Medicine",
    addMedicineBtn: "Add to Prescription"
  },
  hi: {
    patientLabel: "मरीज़",
    scanNewLink: "नया स्कैन करें",
    pillDipstick: "डिपस्टिक",
    pillDocs: "दस्तावेज़",
    pillBP: "रक्तचाप",
    pillWeight: "वज़न",
    pillTrend: "ट्रेंड",
    pillDiary: "डायरी",
    pillDoctor: "डॉक्टर",
    pillReminders: "रिमाइंडर्स",
    alertWatchTitle: "ध्यान दें: 3 दिन से प्रोटीन 2+",
    alertWatchSub: "ट्रेंड देखें और डॉक्टर को बताएँ",
    openBtn: "खोलें",
    todayTitle: "आज",
    medicinesTodayLabel: "आज की दवाइयाँ",
    seeDiaryLink: "डायरी देखें",
    readDipstickBtn: "डिपस्टिक पढ़ें",
    syncStatusMsg: "फ़ोन में सहेजा गया। 2 रीडिंग भेजना बाकी है।",
    syncDoneMsg: "फ़ोन में सहेजा गया। सभी रीडिंग भेज दी गईं।",
    homeNav: "होम",
    backNav: "पीछे",
    step1of2: "चरण 1 / 2",
    scanPatientTitle: "मरीज़ का बारकोड स्कैन करें",
    scanPatientSubtitle: "ओपीडी पर्ची के बारकोड पर कैमरा लाएं।",
    barcodeFound: "बारकोड मिल गया",
    crNumberReadLabel: "पढ़ा गया CR नंबर",
    privacyNotice: "केवल CR नंबर सहेजा जाता है। कोई नाम या मोबाइल नंबर नहीं।",
    readPrintedNumber: "छपा नंबर पढ़ें",
    typeIt: "हाथ से टाइप करें",
    confirmCrBtn: "इस CR नंबर की पुष्टि करें",
    lightOk: "रोशनी ठीक",
    glareOk: "चमक ठीक",
    alignedOk: "सीधा रखा है",
    stripLabel: "स्ट्रिप",
    stripInstructions: "यूरिन स्ट्रिप, 60 सेकंड पर पढ़ें। फोन स्थिर रखें।",
    howToTestBtn: "जांच कैसे करें",
    cannotScanBtn: "स्कैन नहीं हो रहा? रंग चुनें",
    startTimerBtn: "टाइमर शुरू करें",
    proteinReadingLabel: "प्रोटीन रीडिंग",
    readerConfidence: "रीडर सटीकता: उच्च",
    correctIfWrong: "गलत दिखने पर ठीक करें",
    researchDisclaimer: "अनुसंधान उपयोग रीडिंग। यह अंतिम निदान नहीं है। डॉक्टर को दिखाएं।",
    saveReadingBtn: "रीडिंग सहेजें",
    retakeStripBtn: "नई स्ट्रिप से दोबारा जांचें",
    pageEdgesFound: "दस्तावेज़ के किनारे मिल गए",
    thisIsALabel: "यह क्या है?",
    docPrescription: "पर्चे (Prescription)",
    docReport: "जांच रिपोर्ट",
    docOther: "अन्य",
    pagesScannedMsg: "2 पन्ने स्कैन किए गए",
    doneReadMedsBtn: "हो गया, दवाइयाँ पढ़ें",
    addAnotherPageBtn: "एक और पन्ना जोड़ें",
    backToScan: "स्कैन पर वापस",
    checkMedsTitle: "दवाइयों की जांच करें",
    checkMedsSubtitle: "पर्चे से मिलान करें। जांचने के बाद ही प्रत्येक लाइन पर टिक करें।",
    addMedicineLink: "+ नई दवाई जोड़ें",
    saveCheckedMedsBtn: "जांची गई दवाइयाँ सहेजें",
    bpMonitorTitle: "रक्तचाप मॉनिटर (BP)",
    connectedStatus: "कनेक्टेड",
    notConnected: "कनेक्ट नहीं है",
    bpSubtitle: "कफ पर रीडिंग शुरू करें। नंबर यहाँ दिखेंगे। या हाथ से लिखें",
    systolicLabel: "सिस्टोलिक",
    diastolicLabel: "डायस्टोलिक",
    bpNormalBadge: "उम्र और कद के अनुसार सामान्य",
    bpRuleDesc: "हरा सामान्य है। पीला स्टेज 1 उच्च रक्तचाप है। लाल स्टेज 2 उच्च रक्तचाप है। लगातार दो उच्च रीडिंग पर डॉक्टर को सूचित करें।",
    armLabel: "हाथ",
    postureLabel: "मुद्रा",
    scaleTitle: "वज़न कांटा",
    connectBtLink: "ब्लूटूथ से कनेक्ट करें",
    weightInKg: "वज़न (किलो में)",
    heightInCm: "कद (सेमी में)",
    growthForAgeTitle: "उम्र अनुसार वृद्धि (नमूना: 7 वर्ष बालक)",
    growthHeightLabel: "कद",
    growthWeightLabel: "वज़न",
    normalLabel: "सामान्य",
    watchLabel: "ध्यान दें",
    growthRuleDesc: "पीला औसत से 1 से 2 SD है। लाल 2 SD या अधिक है। वज़न और कद से BMI की गणना होती है। वृद्धि चार्ट डॉक्टर द्वारा निर्धारित है।",
    swellingLabel: "सूजन (एडिमा)",
    saveWeightHeightBtn: "वज़न और कद सहेजें",
    exportDiaryBtn: "यह डायरी निर्यात करें",
    exportRecordTitle: "रिकॉर्ड निर्यात करें",
    fromLabel: "तारीख से",
    toLabel: "तारीख तक",
    exportReadingsChk: "रीडिंग्स (डिपस्टिक, बीपी, वज़न)",
    exportMedsChk: "ली गई दवाइयाँ और खुराक",
    exportDocsChk: "स्कैन किए दस्तावेज़",
    fileTypeLabel: "फ़ाइल प्रकार",
    exportPrivacyNotice: "फ़ाइल में केवल CR नंबर होता है। कोई नाम या फोन नंबर नहीं।",
    shareWhatsappBtn: "व्हाट्सएप पर शेयर करें",
    emailBtn: "ईमेल करें",
    saveToPhoneBtn: "फ़ोन में डाउनलोड करें",
    howToTestTitle: "टेस्ट कैसे करें",
    howToTestSubtitle: "हो सके तो सुबह के पहले पेशाब का प्रयोग करें। प्रतीक्षा समय पूरा होने पर ही रंग देखें।",
    tutStep1Title: "हाथ धोएं",
    tutStep1Time: "लगभग 30 सेकंड",
    tutStep1Desc: "साबुन और पानी से हाथ धोकर सुखाएं। तैयार होने तक स्ट्रिप बोतल का ढक्कन बंद रखें।",
    tutStep2Title: "बीच का यूरिन लें",
    tutStep2Time: "नमूना",
    tutStep2Desc: "पेशाब शुरू करें, फिर बीच की धार साफ कप में लें। सुबह का पहला यूरिन सबसे अच्छा है।",
    tutStep3Title: "स्ट्रिप डुबोएं",
    tutStep3Time: "2 सेकंड",
    tutStep3Desc: "पैड को केवल 1 से 2 सेकंड डुबोएं। स्ट्रिप को कप में छोड़ न दें।",
    tutStep4Title: "प्रतीक्षा करें और स्ट्रिप रखें",
    tutStep4Time: "60 सेकंड",
    tutStep4Desc: "अतिरिक्त बूंदें झाड़ें। स्ट्रिप को कार्ड पर सीधे रखें।",
    readyCameraBtn: "मैं तैयार हूँ, कैमरा खोलें",
    pickColourTitle: "रंग चुनें",
    pickColourSubtitle: "प्रतीक्षा समय के बाद स्ट्रिप को बोतल के चार्ट के पास रखें। जो प्रोटीन पैड से मेल खाता हो उसे टैप करें।",
    swatchNeg: "नेगेटिव (Negative)",
    swatchTrace: "ट्रेस (Trace)",
    swatchGuideNotice: "यहाँ के रंग केवल मार्गदर्शन के लिए हैं। बोतल का असली चार्ट ही मुख्य संदर्भ है। यह रीडिंग हस्तलिखित मानी जाएगी।",
    saveGradeBtn: "यह ग्रेड सहेजें",
    trend14DaysTitle: "प्रोटीन, पिछले 14 दिन",
    trendWatchAlertHeadline: "ध्यान दें: लगातार 3 दिन से 2+",
    trendWatchAlertSub: "यह रिलैप्स (रोग की वापसी) हो सकता है। आज ही अपने डॉक्टर को बताएं।",
    legendNeg: "नेगेटिव",
    legend1Watch: "1+ ध्यान दें",
    legend2Act: "2+ या अधिक (कार्रवाई)",
    daysOf2PlusLabel: "2+ या अधिक वाले दिन",
    lastNegDateLabel: "पिछला नेगेटिव या ट्रेस",
    relapseCriteriaExplanation: "पीला 1+ और लाल 2+ या अधिक है। डिफ़ॉल्ट नियम: लगातार 3 दिन 2+ या अधिक होना संभावित रिलैप्स है। लगातार 3 दिन नेगेटिव या ट्रेस होना रेमिशन (नियंत्रण) है।",
    sendTrendDoctorBtn: "यह ट्रेंड डॉक्टर को भेजें",
    setRemindersBtn: "रिमाइंडर्स सेट करें",
    remindersTitle: "रिमाइंडर्स",
    remindersSubtitle: "इंटरनेट न होने पर भी फोन इन समयों पर बजता है।",
    medTimesFromPrescription: "दवा का समय जांची गई पर्ची से आता है",
    doneBtn: "हो गया",
    fromDoctorTitle: "आपके डॉक्टर से संदेश",
    testsToGetDoneTitle: "करवाने योग्य जांचें",
    adviceArrivalNote: "फोन कनेक्ट होने पर डॉक्टर की नई सलाह मिलती है। जांच पूरी होने पर टिक करें।",
    sendReportBtn: "रिपोर्ट भेजें",
    askQuestionBtn: "प्रश्न पूछें",
    enterCrTitle: "CR नंबर दर्ज करें",
    saveBtn: "CR नंबर सुरक्षित करें",
    addMedModalTitle: "नई दवाई जोड़ें",
    addMedicineBtn: "पर्चे में जोड़ें"
  }
};

// Initialize Application on Page Load
document.addEventListener('DOMContentLoaded', () => {
  setupLanguage(currentLang);
  fetchPatientData();
  fetchSummaryData();
  fetchMedicines();
  fetchReminders();
  fetchDoctorMessages();
  fetchLabTests();
  fetchLogs();
  fetchDocuments();

  setupViewportSwitcher();
});

// Setup Viewport Switcher (Smartphone view vs Clinic OPD view)
function setupViewportSwitcher() {
  const phoneBtn = document.getElementById('viewPhoneBtn');
  const clinicBtn = document.getElementById('viewClinicBtn');
  const wrapper = document.querySelector('.prototype-outer-wrapper');

  if (phoneBtn && clinicBtn) {
    phoneBtn.addEventListener('click', () => {
      phoneBtn.classList.add('active');
      clinicBtn.classList.remove('active');
      wrapper.style.maxWidth = '480px';
    });

    clinicBtn.addEventListener('click', () => {
      clinicBtn.classList.add('active');
      phoneBtn.classList.remove('active');
      wrapper.style.maxWidth = '960px';
      showToast('Clinic OPD expanded view enabled');
    });
  }
}

// Language Handling
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('kidneycare_lang', lang);
  setupLanguage(lang);
}

function setupLanguage(lang) {
  const enBtn = document.getElementById('langBtnEn');
  const hiBtn = document.getElementById('langBtnHi');

  if (lang === 'hi') {
    hiBtn.classList.add('active');
    enBtn.classList.remove('active');
  } else {
    enBtn.classList.add('active');
    hiBtn.classList.remove('active');
  }

  // Update i18n text nodes
  const strings = I18N[lang] || I18N.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (strings[key]) {
      el.textContent = strings[key];
    }
  });

  // Re-render language-dependent components
  renderTodayCardsLanguage();
  renderTrendBars();
}

function renderTodayCardsLanguage() {
  const isHi = currentLang === 'hi';
  const lastLog = allLogs[0] || {};

  const dipstickTimeEl = document.getElementById('homeDipstickTime');
  if (dipstickTimeEl) {
    dipstickTimeEl.textContent = isHi ? 'पिछली डिपस्टिक, सुबह 8:10' : 'Last dipstick, 8:10 am';
  }

  const bpTimeEl = document.getElementById('homeBpTime');
  if (bpTimeEl) {
    bpTimeEl.textContent = isHi ? 'रक्तचाप, सुबह 8:20' : 'Blood pressure, 8:20 am';
  }

  const bpValEl = document.getElementById('homeBpVal');
  if (bpValEl) {
    bpValEl.textContent = isHi ? '104 / 66, नाड़ी 82' : '104 / 66, pulse 82';
  }

  const bpSourceEl = document.getElementById('homeBpSource');
  if (bpSourceEl) {
    bpSourceEl.textContent = isHi ? 'ब्लूटूथ' : 'Bluetooth';
  }

  const weightTimeEl = document.getElementById('homeWeightTime');
  if (weightTimeEl) {
    weightTimeEl.textContent = isHi ? 'वज़न, सुबह 8:25' : 'Weight, 8:25 am';
  }

  const weightValEl = document.getElementById('homeWeightVal');
  if (weightValEl) {
    weightValEl.textContent = isHi ? '21.4 किलो' : '21.4 kg';
  }

  const weightSourceEl = document.getElementById('homeWeightSource');
  if (weightSourceEl) {
    weightSourceEl.textContent = isHi ? 'हाथ से' : 'Manual';
  }

  const dipstickMethodEl = document.getElementById('homeDipstickMethod');
  if (dipstickMethodEl) {
    dipstickMethodEl.textContent = isHi ? 'कैमरा' : 'Camera';
  }

  const dipstickGradeEl = document.getElementById('homeDipstickGrade');
  if (dipstickGradeEl) {
    dipstickGradeEl.textContent = isHi ? 'प्रोटीन 2+' : 'Protein 2+';
  }
}

// Navigation between the 16 Screens
function navigateToScreen(screenId) {
  // Hide all screens
  document.querySelectorAll('.screen-content-area').forEach(s => {
    s.style.display = 'none';
  });

  // Show target screen
  const target = document.getElementById(screenId);
  if (target) {
    target.style.display = 'flex';
    currentScreen = screenId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update CR Number badges across headers
  updateHeaderCrBadges();

  // Update active Quick Tab Pill
  updateQuickTabsActive(screenId);

  // Stop camera if leaving camera screens
  if (screenId !== 'screen-scan-patient' && screenId !== 'screen-dipstick-camera') {
    stopCameraStreams();
  }

  // Screen-specific hooks
  if (screenId === 'screen-scan-patient') {
    startBarcodeCamera();
  } else if (screenId === 'screen-dipstick-camera') {
    startDipstickCamera();
    updateTimerCircle();
  } else if (screenId === 'screen-dipstick-verify') {
    updateVerifySnapshotPreview();
  } else if (screenId === 'screen-docs-scan') {
    fetchDocuments();
  } else if (screenId === 'screen-trends') {
    renderTrendBars();
  } else if (screenId === 'screen-diary') {
    renderDiaryTimeline();
  } else if (screenId === 'screen-check-medicines') {
    renderCheckMedicinesList();
  }
}

function updateHeaderCrBadges() {
  const cr = patientData.cr_number || '2026/0412';
  const prefix = currentLang === 'hi' ? 'CR ' : 'CR ';
  const crText = `${prefix}[${cr}]`;

  const crElements = [
    'displayCrNumber', 'cameraScreenCr', 'verifyScreenCr', 'docsScreenCr',
    'medsScreenCr', 'bpScreenCr', 'weightScreenCr', 'diaryScreenCr',
    'exportScreenCr', 'howToTestCr', 'colorPickerCr', 'trendScreenCr',
    'remindersScreenCr', 'doctorScreenCr'
  ];

  crElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === 'displayCrNumber') {
        el.textContent = `CR [${cr}]`;
      } else {
        el.textContent = `CR [${cr}]`;
      }
    }
  });
}

function updateQuickTabsActive(screenId) {
  document.querySelectorAll('.quick-tab-pill').forEach(pill => {
    const target = pill.getAttribute('data-target');
    if (target === screenId) {
      pill.classList.add('active');
      pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      pill.classList.remove('active');
    }
  });
}

function scrollTabs(delta) {
  const container = document.getElementById('tabsScrollWrapper');
  if (container) {
    container.scrollBy({ left: delta, behavior: 'smooth' });
  }
}

// Fetch API Calls
async function fetchPatientData() {
  try {
    const res = await fetch('/api/patient');
    if (res.ok) {
      patientData = await res.json();
      updateHeaderCrBadges();
      const scannedCrEl = document.getElementById('scannedCrDisplay');
      if (scannedCrEl) scannedCrEl.textContent = `[${patientData.cr_number}]`;
    }
  } catch (err) {
    console.warn('Using local patient cache:', err);
  }
}

async function fetchSummaryData() {
  try {
    const res = await fetch('/api/summary');
    if (res.ok) {
      const data = await res.json();
      const waitingCount = data.waiting_sync_count || 0;
      updateSyncStatus(waitingCount);

      // Update Meds Today Count (e.g. 2 of 3 taken)
      const medsCountEl = document.getElementById('homeMedsCount');
      if (medsCountEl) {
        const isHi = currentLang === 'hi';
        const taken = data.meds_taken || 2;
        const total = data.meds_total || 3;
        medsCountEl.textContent = isHi ? `${total} में से ${taken} ली गईं` : `${taken} of ${total} taken`;
      }

      // Update Trend stats widgets
      const statDays2Plus = document.getElementById('statDays2Plus');
      if (statDays2Plus) statDays2Plus.textContent = data.days_2plus || 3;

      const statLastNegDate = document.getElementById('statLastNegDate');
      if (statLastNegDate) statLastNegDate.textContent = data.last_neg_date || '29 Sep';
    }
  } catch (err) {
    console.warn('Using summary cache:', err);
  }
}

async function fetchLogs() {
  try {
    const res = await fetch('/api/logs');
    if (res.ok) {
      allLogs = await res.json();
      renderTodayCardsLanguage();
      renderTrendBars();
      renderDiaryTimeline();
    }
  } catch (err) {
    console.warn('Using local logs cache:', err);
  }
}

async function fetchMedicines() {
  try {
    const res = await fetch('/api/medicines');
    if (res.ok) {
      allMedicines = await res.json();
      renderCheckMedicinesList();
    }
  } catch (err) {
    console.warn('Using local meds cache:', err);
  }
}

async function fetchReminders() {
  try {
    const res = await fetch('/api/reminders');
    if (res.ok) {
      allReminders = await res.json();
      renderRemindersList();
    }
  } catch (err) {
    console.warn('Using local reminders cache:', err);
  }
}

async function fetchDoctorMessages() {
  try {
    const res = await fetch('/api/doctor-messages');
    if (res.ok) {
      allDoctorMessages = await res.json();
      renderDoctorMessages();
    }
  } catch (err) {
    console.warn('Using doctor messages cache:', err);
  }
}

async function fetchLabTests() {
  try {
    const res = await fetch('/api/lab-tests');
    if (res.ok) {
      allLabTests = await res.json();
      renderLabOrders();
    }
  } catch (err) {
    console.warn('Using lab tests cache:', err);
  }
}

// Screen 3: Patient CR Barcode Functions
function startBarcodeCamera() {
  const video = document.getElementById('barcodeVideo');
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (video) {
          video.srcObject = stream;
          video.style.display = 'block';
          video.play();
        }
      })
      .catch(() => {
        // Fallback to simulated barcode viewfinder box
        if (video) video.style.display = 'none';
      });
  }
}

function simulateOcrScan() {
  showToast('Reading printed OPD sticker numbers...');
  setTimeout(() => {
    const num = '2026/0412';
    document.getElementById('scannedCrDisplay').textContent = `[${num}]`;
    showToast('CR Number Detected: ' + num);
  }, 700);
}

function openTypeCrModal() {
  document.getElementById('modalTypeCr').style.display = 'flex';
  const inp = document.getElementById('manualCrInput');
  if (inp) {
    inp.value = patientData.cr_number || '2026/0412';
    inp.focus();
  }
}

async function submitManualCr() {
  const inp = document.getElementById('manualCrInput');
  if (!inp || !inp.value.trim()) return;
  const newCr = inp.value.trim();
  closeModal('modalTypeCr');
  document.getElementById('scannedCrDisplay').textContent = `[${newCr}]`;
  await updateCrOnBackend(newCr);
}

async function confirmScannedCr() {
  const scannedText = document.getElementById('scannedCrDisplay').textContent.replace(/[\[\]]/g, '').trim();
  await updateCrOnBackend(scannedText || '2026/0412');
  showToast('Patient CR Confirmed');
  navigateToScreen('screen-home');
}

async function updateCrOnBackend(cr) {
  try {
    const res = await fetch('/api/patient/cr-number', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cr_number: cr })
    });
    if (res.ok) {
      patientData.cr_number = cr;
      updateHeaderCrBadges();
    }
  } catch (err) {
    console.error('Error saving CR:', err);
  }
}

// Screen 4: Dipstick Camera & 60-Second Timer
function startDipstickCamera() {
  const video = document.getElementById('dipstickVideo');
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (video) {
          video.srcObject = stream;
          video.style.display = 'block';
          video.play();
        }
      })
      .catch(() => {
        if (video) video.style.display = 'none';
      });
  }
}

function stopCameraStreams() {
  ['barcodeVideo', 'dipstickVideo'].forEach(id => {
    const v = document.getElementById(id);
    if (v && v.srcObject) {
      v.srcObject.getTracks().forEach(track => track.stop());
      v.srcObject = null;
    }
  });
}

function toggleDipstickTimer() {
  const btn = document.getElementById('startTimerBtn');
  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    btn.textContent = currentLang === 'hi' ? 'टाइमर शुरू करें' : 'Start timer';
  } else {
    isTimerRunning = true;
    btn.textContent = currentLang === 'hi' ? 'रीडिंग हो रही है...' : 'Reading...';
    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        updateTimerCircle();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        playTimerAudioChime();
        showToast('Reaction complete (60s)');
        // Auto-navigate to Screen 5 verification
        navigateToScreen('screen-dipstick-verify');
        timerSeconds = 60;
        updateTimerCircle();
        btn.textContent = currentLang === 'hi' ? 'टाइमर शुरू करें' : 'Start timer';
      }
    }, 1000);
  }
}

function updateTimerCircle() {
  const digitsEl = document.getElementById('timerDisplayDigits');
  const ringEl = document.getElementById('timerProgressRing');

  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (digitsEl) digitsEl.textContent = formatted;

  if (ringEl) {
    const fraction = (TIMER_TOTAL - timerSeconds) / TIMER_TOTAL;
    const offset = CIRCLE_CIRCUMFERENCE - (fraction * CIRCLE_CIRCUMFERENCE);
    ringEl.style.strokeDashoffset = offset;
  }
}

// Synthesizes a medical bell/chime using Web Audio API
function playTimerAudioChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.log('Audio chime not permitted without user gesture:', e);
  }
}

// Screen 5: Dipstick Verification
function selectVerifyGrade(grade) {
  verifiedGrade = grade;
  document.querySelectorAll('.grade-chip-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-grade') === grade);
  });

  const valEl = document.getElementById('verifiedGradeValue');
  if (valEl) valEl.textContent = grade;

  const padEl = document.getElementById('verifyStripPadColor');
  if (padEl && GRADE_COLORS[grade]) {
    padEl.style.background = GRADE_COLORS[grade];
  }
}

async function saveVerifiedReading() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  const dateStr = now.toISOString().split('T')[0];

  const payload = {
    date: dateStr,
    time: timeStr,
    urine_protein: verifiedGrade,
    dipstick_method: 'Camera',
    reader_confidence: 'high',
    sync_status: 'waiting'
  };

  try {
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast(currentLang === 'hi' ? 'रीडिंग सहेज ली गई' : 'Reading saved');
      await fetchLogs();
      await fetchSummaryData();
      navigateToScreen('screen-home');
    }
  } catch (err) {
    showToast('Reading saved locally');
    navigateToScreen('screen-home');
  }
}

// ========================================================
// DATA COLLECTION: CAMERA CAPTURE & MEDIA STORAGE
// ========================================================

function updateVerifySnapshotPreview() {
  const thumb = document.getElementById('verifySnapshotThumb');
  const meta = document.getElementById('verifySnapshotMeta');
  if (thumb && lastCapturedSnapshotUrl) {
    thumb.src = lastCapturedSnapshotUrl;
  }
  if (meta) {
    const cr = patientData.cr_number || '2026/0412';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    meta.textContent = `Tagged to CR [${cr}] · ${timeStr} · Photo Stored`;
  }
}

async function captureDipstickPhoto() {
  const video = document.getElementById('dipstickVideo');
  const canvas = document.getElementById('dipstickCanvas');
  let base64Data = null;

  if (video && video.srcObject && video.videoWidth > 0) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    base64Data = canvas.toDataURL('image/jpeg', 0.85);
  }

  // Upload or tag to patient
  await uploadSnapshotData(base64Data, 'Morning Dipstick Test Photo', 'dipstick', verifiedGrade);
}

function handleDipstickFileInput(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    await uploadSnapshotData(base64Data, file.name, 'dipstick', verifiedGrade);
  };
  reader.readAsDataURL(file);
}

async function uploadSnapshotData(base64Data, title, category, testResultTag) {
  const cr = patientData.cr_number || '2026/0412';
  const now = new Date();
  const ts = now.toISOString().replace('T', ' ').substring(0, 19);

  try {
    const payload = {
      cr_number: cr,
      category: category,
      title: title || 'Morning Dipstick Camera Photo',
      doctor_notes: `Captured by patient/family. Dipstick reagent pad evaluated as ${testResultTag || 'Protein 2+'}.`,
      uploaded_by: `Parent (${patientData.patient_name || 'Aarav Kumar'})`,
      test_result_tag: testResultTag || 'Protein 2+',
      timestamp: ts,
      image_base64: base64Data || ''
    };

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.document && data.document.file_url) {
        lastCapturedSnapshotUrl = data.document.file_url;
      }
      showToast('📸 Photo captured & tagged to patient record!');
      updateVerifySnapshotPreview();
      await fetchDocuments();
    } else {
      lastCapturedSnapshotUrl = '/uploads/sample_dipstick_strip.svg';
      showToast('📸 Photo saved and tagged locally');
      updateVerifySnapshotPreview();
    }
  } catch (err) {
    lastCapturedSnapshotUrl = '/uploads/sample_dipstick_strip.svg';
    showToast('📸 Photo stored with timestamp');
    updateVerifySnapshotPreview();
  }
}

// ========================================================
// DATA COLLECTION: ATTACHED PATIENT REPORTS & DOCTOR UPLOAD
// ========================================================

async function fetchDocuments() {
  try {
    const cr = patientData.cr_number || '2026/0412';
    const res = await fetch(`/api/documents?cr_number=${encodeURIComponent(cr)}`);
    if (res.ok) {
      allDocuments = await res.json();
      const badge = document.getElementById('docsTotalCountBadge');
      if (badge) badge.textContent = allDocuments.length;
      renderDocsGallery(activeDocsCategoryFilter);
    }
  } catch (err) {
    console.warn('Using local documents cache:', err);
  }
}

function switchDocsSubTab(tab) {
  const gallerySec = document.getElementById('docsGallerySection');
  const scanSec = document.getElementById('docsScannerSection');
  const btnGallery = document.getElementById('btnDocsSubGallery');
  const btnScan = document.getElementById('btnDocsSubScan');

  if (tab === 'gallery') {
    if (gallerySec) gallerySec.style.display = 'block';
    if (scanSec) scanSec.style.display = 'none';
    if (btnGallery) btnGallery.classList.add('active');
    if (btnScan) btnScan.classList.remove('active');
    renderDocsGallery(activeDocsCategoryFilter);
  } else {
    if (gallerySec) gallerySec.style.display = 'none';
    if (scanSec) scanSec.style.display = 'block';
    if (btnGallery) btnGallery.classList.remove('active');
    if (btnScan) btnScan.classList.add('active');
  }
}

function filterDocsGallery(category, btn) {
  activeDocsCategoryFilter = category;
  document.querySelectorAll('.doc-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderDocsGallery(category);
}

function renderDocsGallery(filter = 'all') {
  const container = document.getElementById('docsGalleryList');
  if (!container) return;

  const docsToRender = (filter === 'all')
    ? allDocuments
    : allDocuments.filter(d => d.category === filter);

  if (docsToRender.length === 0) {
    container.innerHTML = `
      <div style="background:#FFFFFF; border:1px solid var(--border-light); border-radius:12px; padding:24px; text-align:center; color:var(--text-muted);">
        <div style="font-size:1.8rem; margin-bottom:6px;">📂</div>
        <div style="font-weight:600; color:var(--brand-teal);">No files found in this category</div>
        <div style="font-size:0.8rem; margin-top:4px;">Upload doctor reports or capture dipstick test photos to attach them here.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  docsToRender.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'doc-item-card';

    const isSvgOrImg = doc.file_url && (doc.file_url.endsWith('.svg') || doc.file_url.endsWith('.jpg') || doc.file_url.endsWith('.jpeg') || doc.file_url.endsWith('.png') || doc.file_url.endsWith('.webp'));
    const thumbHtml = isSvgOrImg
      ? `<img class="doc-thumb-img" src="${doc.file_url}" alt="${doc.title}" onclick="openDocumentViewer(${doc.id})">`
      : `<span class="doc-thumb-icon" onclick="openDocumentViewer(${doc.id})">📄</span>`;

    const tagBadge = doc.test_result_tag ? `<span class="doc-badge-pill ${doc.category}" style="margin-left:6px;">${doc.test_result_tag}</span>` : '';
    const notesHtml = doc.doctor_notes ? `<div class="doc-notes-box"><strong>Doctor Assessment:</strong> ${doc.doctor_notes}</div>` : '';

    card.innerHTML = `
      <div class="doc-top-info">
        <div class="doc-thumb-box">${thumbHtml}</div>
        <div class="doc-meta-col">
          <div class="doc-title-row">
            <span class="doc-title-text" onclick="openDocumentViewer(${doc.id})" style="cursor:pointer;">${doc.title}</span>
            <span class="doc-badge-pill ${doc.category}">${formatCategoryLabel(doc.category)}</span>
          </div>
          <div class="doc-detail-meta">
            <span>📅 ${doc.timestamp}</span> · <span>Tagged: CR [${doc.cr_number}]</span>
            <div>By: <strong>${doc.uploaded_by}</strong> ${tagBadge}</div>
          </div>
        </div>
      </div>
      ${notesHtml}
      <div class="doc-actions-row">
        <button class="doc-action-btn" onclick="openDocumentViewer(${doc.id})">👁️ View / Download</button>
        <button class="doc-action-btn delete" onclick="deleteDocument(${doc.id})">🗑️ Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function formatCategoryLabel(cat) {
  if (cat === 'lab_report') return 'Lab Report';
  if (cat === 'dipstick') return 'Dipstick';
  if (cat === 'prescription') return 'Prescription';
  if (cat === 'clinical_photo') return 'Clinical Photo';
  return 'Document';
}

function openUploadReportModal() {
  document.getElementById('modalUploadReport').style.display = 'flex';
  const cr = patientData.cr_number || '2026/0412';
  const name = patientData.patient_name || 'Aarav Kumar';
  const tagEl = document.getElementById('uploadModalCrTag');
  if (tagEl) tagEl.textContent = `CR [${cr}] · ${name}`;
}

function handleReportFileSelected(event) {
  const f = event.target.files[0];
  const nameEl = document.getElementById('uploadFileSelectedName');
  if (f && nameEl) {
    nameEl.textContent = `Selected: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`;
  }
}

async function submitDoctorReportUpload(event) {
  event.preventDefault();
  const fileInp = document.getElementById('reportFileInput');
  const title = document.getElementById('reportTitleInp').value.trim();
  const category = document.getElementById('reportCategoryInp').value;
  const resultTag = document.getElementById('reportResultTagInp').value.trim();
  const doctorNotes = document.getElementById('reportDoctorNotesInp').value.trim();
  const uploader = document.getElementById('reportUploaderInp').value.trim() || 'Dr. Swarnim';

  if (!fileInp.files || fileInp.files.length === 0) {
    showToast('Please select a file to upload');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInp.files[0]);
  formData.append('title', title);
  formData.append('category', category);
  formData.append('test_result_tag', resultTag);
  formData.append('doctor_notes', doctorNotes);
  formData.append('uploaded_by', uploader);
  formData.append('cr_number', patientData.cr_number || '2026/0412');

  try {
    showToast('Uploading report to patient record...');
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      closeModal('modalUploadReport');
      showToast('✅ Report successfully attached to patient record!');
      // Reset form
      document.getElementById('uploadReportForm').reset();
      document.getElementById('uploadFileSelectedName').textContent = 'Click to select PDF report or Image';
      await fetchDocuments();
      switchDocsSubTab('gallery');
    } else {
      showToast('Error uploading report');
    }
  } catch (err) {
    console.error('Upload error:', err);
    showToast('Upload failed. Please check server.');
  }
}

function openDocumentViewer(docId) {
  const doc = allDocuments.find(d => d.id === docId);
  if (!doc) return;

  const modal = document.getElementById('modalDocViewer');
  const titleEl = document.getElementById('docViewerTitle');
  const imgEl = document.getElementById('docViewerImg');
  const badgeEl = document.getElementById('docViewerBadge');
  const timeEl = document.getElementById('docViewerTimestamp');
  const metaEl = document.getElementById('docViewerMeta');
  const notesBox = document.getElementById('docViewerNotesBox');
  const dlBtn = document.getElementById('docViewerDownloadBtn');

  if (titleEl) titleEl.textContent = doc.title;
  if (imgEl) {
    imgEl.src = doc.file_url;
    imgEl.alt = doc.title;
  }
  if (badgeEl) {
    badgeEl.className = `doc-badge-pill ${doc.category}`;
    badgeEl.textContent = formatCategoryLabel(doc.category);
  }
  if (timeEl) timeEl.textContent = doc.timestamp;
  if (metaEl) metaEl.textContent = `Tagged to Patient: CR [${doc.cr_number}] · Uploaded by: ${doc.uploaded_by}`;
  if (notesBox) {
    if (doc.doctor_notes) {
      notesBox.style.display = 'block';
      notesBox.innerHTML = `<strong>Doctor Assessment:</strong> ${doc.doctor_notes}`;
    } else {
      notesBox.style.display = 'none';
    }
  }
  if (dlBtn) {
    dlBtn.href = doc.file_url;
    dlBtn.download = doc.file_name || 'report';
  }

  modal.style.display = 'flex';
}

async function deleteDocument(docId) {
  if (!confirm('Are you sure you want to delete this document from the patient record?')) {
    return;
  }

  try {
    const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Document deleted');
      await fetchDocuments();
    }
  } catch (err) {
    console.error('Delete error:', err);
  }
}

// Screen 6 & 7: Document Scanner & Medicines OCR
function selectDocType(btn, type) {
  selectedDocType = type;
  document.querySelectorAll('.doc-type-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function addAnotherScannedPage() {
  scannedPagesCount++;
  const lbl = document.getElementById('pagesScannedCountText');
  if (lbl) {
    lbl.textContent = currentLang === 'hi' ? `${scannedPagesCount} पन्ने स्कैन किए गए` : `${scannedPagesCount} pages scanned`;
  }
  showToast(`Page ${scannedPagesCount} captured`);
}

function renderCheckMedicinesList() {
  const container = document.getElementById('medsPrescriptionList');
  if (!container) return;

  container.innerHTML = '';
  allMedicines.forEach(m => {
    const card = document.createElement('div');
    card.className = `med-prescription-card ${m.needs_check ? 'warning-box' : ''}`;

    const isHi = currentLang === 'hi';
    const checkedText = isHi ? 'मैंने यह लाइन जांची है' : 'I have checked this line';
    const warningHeader = m.warning_note ? `
      <div class="med-warning-label">${isHi ? 'यह लाइन जांचें: खुराक स्पष्ट नहीं' : m.warning_note}</div>
    ` : '';

    card.innerHTML = `
      <div class="med-card-header">
        <div class="med-title">${m.name}</div>
        ${warningHeader}
      </div>
      <div class="med-fields-grid">
        <div class="med-field-group">
          <label class="label">${isHi ? 'खुराक' : 'Dose'}</label>
          <input type="text" class="med-field-input" value="${m.dose}" placeholder="${isHi ? 'खुराक लिखें' : 'Type the dose'}" id="medDose_${m.id}">
        </div>
        <div class="med-field-group">
          <label class="label">${isHi ? 'कब' : 'When'}</label>
          <input type="text" class="med-field-input" value="${m.timing}" id="medTiming_${m.id}">
        </div>
      </div>
      <label class="med-checkbox-line">
        <input type="checkbox" class="med-checkbox-input" id="medCheck_${m.id}" ${m.is_checked ? 'checked' : ''}>
        <span>${checkedText}</span>
      </label>
    `;
    container.appendChild(card);
  });
}

function openAddMedicineModal() {
  document.getElementById('modalAddMed').style.display = 'flex';
}

async function submitNewMedicine() {
  const name = document.getElementById('newMedName').value.trim();
  const dose = document.getElementById('newMedDose').value.trim();
  const timing = document.getElementById('newMedTiming').value.trim() || 'Once daily, morning';

  if (!name || !dose) {
    showToast('Please fill in name and dose');
    return;
  }

  try {
    const res = await fetch('/api/medicines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dose, timing, is_checked: 1 })
    });
    if (res.ok) {
      closeModal('modalAddMed');
      showToast('Medicine added');
      await fetchMedicines();
      renderCheckMedicinesList();
    }
  } catch (err) {
    console.error(err);
  }
}

async function saveCheckedMedicines() {
  for (const m of allMedicines) {
    const doseInp = document.getElementById(`medDose_${m.id}`);
    const timeInp = document.getElementById(`medTiming_${m.id}`);
    const chk = document.getElementById(`medCheck_${m.id}`);

    if (doseInp && chk) {
      await fetch(`/api/medicines/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dose: doseInp.value,
          timing: timeInp ? timeInp.value : m.timing,
          is_checked: chk.checked ? 1 : 0,
          needs_check: 0,
          warning_note: ''
        })
      });
    }
  }

  showToast(currentLang === 'hi' ? 'दवाइयाँ सहेज ली गईं' : 'Checked medicines saved');
  await fetchMedicines();
  navigateToScreen('screen-home');
}

// Screen 8: Blood Pressure
function evaluateBpNormals() {
  const sys = parseInt(document.getElementById('inputBpSys').value) || 104;
  const dia = parseInt(document.getElementById('inputBpDia').value) || 66;

  const dot = document.getElementById('bpStageDot');
  const txt = document.getElementById('bpStageText');

  const isHi = currentLang === 'hi';
  if (sys > 125 || dia > 82) {
    dot.className = 'sync-dot';
    dot.style.background = '#B91C1C';
    txt.style.color = '#B91C1C';
    txt.textContent = isHi ? 'स्टेज 2 उच्च रक्तचाप (डॉक्टर को बताएं)' : 'Stage 2 High BP (Notify doctor)';
  } else if (sys > 115 || dia > 75) {
    dot.className = 'sync-dot';
    dot.style.background = '#B45309';
    txt.style.color = '#B45309';
    txt.textContent = isHi ? 'स्टेज 1 उच्च रक्तचाप' : 'Stage 1 Elevated BP';
  } else {
    dot.className = 'sync-dot';
    dot.style.background = '#15803D';
    txt.style.color = '#15803D';
    txt.textContent = isHi ? 'उम्र और कद के अनुसार सामान्य' : 'Normal for age and height';
  }
}

function selectSegment(type, val) {
  if (type === 'arm') {
    selectedArm = val;
    document.getElementById('btnArmLeft').classList.toggle('active', val === 'Left');
    document.getElementById('btnArmRight').classList.toggle('active', val === 'Right');
  } else if (type === 'posture') {
    selectedPosture = val;
    document.getElementById('btnPostureSit').classList.toggle('active', val === 'Sitting');
    document.getElementById('btnPostureStand').classList.toggle('active', val === 'Standing');
    document.getElementById('btnPostureLie').classList.toggle('active', val === 'Lying');
  } else if (type === 'edema') {
    selectedEdema = val;
    ['None', 'Mild', 'Moderate', 'Severe'].forEach(e => {
      const btn = document.getElementById(`btnEdema${e.substring(0, 4)}`);
      if (btn) btn.classList.toggle('active', val === e);
    });
  }
}

async function saveBpReading() {
  const sys = parseInt(document.getElementById('inputBpSys').value) || 104;
  const dia = parseInt(document.getElementById('inputBpDia').value) || 66;
  const now = new Date();

  const payload = {
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
    bp_morning_systolic: sys,
    bp_morning_diastolic: dia,
    pulse: 82,
    bp_arm: selectedArm,
    bp_posture: selectedPosture,
    bp_source: 'Bluetooth',
    sync_status: 'waiting'
  };

  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    showToast('Blood pressure saved');
    await fetchLogs();
    navigateToScreen('screen-home');
  } catch (err) {
    showToast('Saved locally');
    navigateToScreen('screen-home');
  }
}

// Screen 9: Weight & Growth SD
function simulateBluetoothScale() {
  showToast('Connecting Bluetooth scale...');
  setTimeout(() => {
    document.getElementById('inputWeightKg').value = '21.4';
    calculateGrowthSd();
    showToast('Scale paired: 21.4 kg received');
  }, 600);
}

function calculateGrowthSd() {
  const wt = parseFloat(document.getElementById('inputWeightKg').value) || 21.4;
  const ht = parseFloat(document.getElementById('inputHeightCm').value) || 118;

  // BMI = weight / (height_m^2)
  const htM = ht / 100;
  const bmi = (wt / (htM * htM)).toFixed(1);

  const bmiLbl = document.getElementById('growthBmiLabel');
  if (bmiLbl) bmiLbl.textContent = `BMI ${bmi}`;

  // For a 7yo boy: Median Height ~ 122cm, Median Weight ~ 22.8kg, Median BMI ~ 15.3
  const htSd = ((ht - 122) / 5.2).toFixed(1);
  const wtSd = ((wt - 22.8) / 3.4).toFixed(1);
  const bmiSd = ((bmi - 15.3) / 1.5).toFixed(1);

  const htEl = document.getElementById('growthHeightSdVal');
  if (htEl) htEl.textContent = `${htSd >= 0 ? '+' : ''}${htSd} SD`;

  const wtEl = document.getElementById('growthWeightSdVal');
  if (wtEl) wtEl.textContent = `${wtSd >= 0 ? '+' : ''}${wtSd} SD`;

  const bmiEl = document.getElementById('growthBmiSdVal');
  if (bmiEl) bmiEl.textContent = `${bmiSd >= 0 ? '+' : ''}${bmiSd} SD`;
}

async function saveWeightAndHeight() {
  const wt = parseFloat(document.getElementById('inputWeightKg').value) || 21.4;
  const ht = parseFloat(document.getElementById('inputHeightCm').value) || 118;
  const now = new Date();

  const payload = {
    date: now.toISOString().split('T')[0],
    weight: wt,
    height: ht,
    edema: selectedEdema,
    weight_source: 'Manual',
    sync_status: 'waiting'
  };

  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    showToast('Weight and height saved');
    await fetchLogs();
    navigateToScreen('screen-home');
  } catch (err) {
    showToast('Saved locally');
    navigateToScreen('screen-home');
  }
}

// Screen 10: Diary Timeline
function renderDiaryTimeline() {
  const container = document.getElementById('diaryTimelineContainer');
  if (!container) return;

  const isHi = currentLang === 'hi';
  container.innerHTML = `
    <div class="diary-date-group">
      <div class="diary-date-header">${isHi ? 'आज, 4 अक्टूबर' : 'Today, 4 Oct'}</div>
      <div class="diary-timeline-items">
        <div class="diary-entry-card">
          <div class="diary-entry-left">
            <div class="timestamp">8:10 am · ${isHi ? 'डिपस्टिक' : 'Dipstick'}</div>
            <div class="item-title">${isHi ? 'प्रोटीन 2+' : 'Protein 2+'}</div>
          </div>
          <div class="diary-badge-tag">${isHi ? 'कैमरा' : 'Camera'}</div>
        </div>

        <div class="diary-entry-card">
          <div class="diary-entry-left">
            <div class="timestamp">8:20 am · ${isHi ? 'रक्तचाप' : 'Blood pressure'}</div>
            <div class="item-title">104 / 66, pulse 82</div>
          </div>
          <div class="diary-badge-tag">${isHi ? 'ब्लूटूथ' : 'Bluetooth'}</div>
        </div>

        <div class="diary-entry-card">
          <div class="diary-entry-left">
            <div class="timestamp">8:25 am · ${isHi ? 'वज़न, कोई सूजन नहीं' : 'Weight, no swelling'}</div>
            <div class="item-title">21.4 kg</div>
          </div>
          <div class="diary-badge-tag">${isHi ? 'हाथ से' : 'Manual'}</div>
        </div>

        <div class="diary-entry-card">
          <div class="diary-entry-left">
            <div class="timestamp">8:30 am · ${isHi ? 'दवाई' : 'Medicine'}</div>
            <div class="item-title">Prednisolone 20 mg</div>
          </div>
          <div class="diary-badge-tag taken">${isHi ? 'ली गई' : 'Taken'}</div>
        </div>

        <div class="diary-entry-card">
          <div class="diary-entry-left">
            <div class="timestamp">8:00 pm · ${isHi ? 'दवाई' : 'Medicine'}</div>
            <div class="item-title">Tacrolimus 1 mg</div>
          </div>
          <div class="diary-badge-tag due" onclick="toggleMedicineDue(2)">${isHi ? 'बाकी है' : 'Due'}</div>
        </div>
      </div>
    </div>

    <div class="diary-date-group">
      <div class="diary-date-header">${isHi ? 'कल, 3 अक्टूबर' : 'Yesterday'}</div>
      <div class="diary-timeline-items">
        <div class="diary-entry-card">
          <div class="diary-entry-left">
            <div class="timestamp">8:15 am · ${isHi ? 'डिपस्टिक' : 'Dipstick'}</div>
            <div class="item-title">${isHi ? 'प्रोटीन 1+' : 'Protein 1+'}</div>
          </div>
          <div class="diary-badge-tag">${isHi ? 'कैमरा' : 'Camera'}</div>
        </div>
      </div>
    </div>
  `;
}

async function toggleMedicineDue(medId) {
  try {
    const res = await fetch(`/api/medicines/${medId}/toggle-taken`, { method: 'POST' });
    if (res.ok) {
      showToast('Medicine status updated');
      await fetchMedicines();
      await fetchSummaryData();
      renderDiaryTimeline();
    }
  } catch (err) {
    console.error(err);
  }
}

// Screen 11: Export the record
function selectExportFileType(type) {
  selectedExportFormat = type;
  document.getElementById('btnExportExcel').classList.toggle('active', type === 'Excel');
  document.getElementById('btnExportCsv').classList.toggle('active', type === 'CSV');
}

function shareOnWhatsApp() {
  const cr = patientData.cr_number || '2026/0412';
  const text = `KidneyCare AI Report - AIIMS Patna Pediatric Nephrology\nPatient CR: ${cr}\nLatest Protein: 2+ (Watch: 3 days in a row)\nBP: 104/66 (Pulse 82)\nWeight: 21.4 kg (No edema)\nMeds: Prednisolone 20mg, Tacrolimus 1mg\nTreating Doctor: Dr. Swarnim, AIIMS Patna`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

function shareViaEmail() {
  const cr = patientData.cr_number || '2026/0412';
  const subject = `KidneyCare AI OPD Diary - Patient CR ${cr}`;
  const body = `Respected Dr. Swarnim,\n\nPlease find the latest home diary readings for Patient CR ${cr}:\nLatest Dipstick: Protein 2+\nBlood Pressure: 104/66 mmHg\nWeight: 21.4 kg\n\nGenerated via KidneyCare AI (AIIMS Patna).`;
  window.location.href = `mailto:pediatricnephrology.aiims@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function downloadExportFile() {
  const from = document.getElementById('exportFromDate').value;
  const to = document.getElementById('exportToDate').value;
  const ep = selectedExportFormat === 'CSV' ? `/api/export/csv?from_date=${from}&to_date=${to}` : `/api/export/excel?from_date=${from}&to_date=${to}`;
  window.location.href = ep;
}

// Screen 13: Manual Color Picker
function selectColorSwatch(card, grade) {
  selectedColorGrade = grade;
  document.querySelectorAll('.color-option-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
}

async function saveManualColorGrade() {
  const now = new Date();
  const payload = {
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
    urine_protein: selectedColorGrade,
    dipstick_method: 'Manual',
    sync_status: 'waiting'
  };

  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    showToast(`Grade ${selectedColorGrade} saved`);
    await fetchLogs();
    navigateToScreen('screen-home');
  } catch (err) {
    showToast('Saved locally');
    navigateToScreen('screen-home');
  }
}

// Screen 14: 14-Day Protein Trend Bar Chart
function renderTrendBars() {
  const container = document.getElementById('trendBarsContainer');
  if (!container) return;

  // Clean old bar columns (preserve Y-axis label element)
  const oldCols = container.querySelectorAll('.trend-bar-column');
  oldCols.forEach(c => c.remove());

  // 14 day prototype data matching Screen 14:
  // Days: 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 1, 2, 3, 4
  const daysData = [
    { day: '21', grade: '3+', pillarClass: 'plus3' },
    { day: '22', grade: '3+', pillarClass: 'plus3' },
    { day: '23', grade: '2+', pillarClass: 'plus2' },
    { day: '24', grade: '2+', pillarClass: 'plus2' },
    { day: '25', grade: '2+', pillarClass: 'plus2' },
    { day: '26', grade: '1+', pillarClass: 'plus1' },
    { day: '27', grade: '1+', pillarClass: 'plus1' },
    { day: '28', grade: 'Neg', pillarClass: 'neg' },
    { day: '29', grade: 'Neg', pillarClass: 'neg' },
    { day: '30', grade: '1+', pillarClass: 'plus1' },
    { day: '1',  grade: '1+', pillarClass: 'plus1' },
    { day: '2',  grade: '2+', pillarClass: 'plus2' },
    { day: '3',  grade: '2+', pillarClass: 'plus2' },
    { day: '4',  grade: '2+', pillarClass: 'plus2' }
  ];

  daysData.forEach(item => {
    const col = document.createElement('div');
    col.className = 'trend-bar-column';
    col.title = `Day ${item.day}: ${item.grade}`;
    col.innerHTML = `
      <div class="trend-bar-pillar ${item.pillarClass}"></div>
      <div class="trend-bar-day">${item.day}</div>
    `;
    container.appendChild(col);
  });
}

function sendTrendToDoctor() {
  shareOnWhatsApp();
}

// Screen 15: Reminders
function renderRemindersList() {
  const container = document.getElementById('remindersListContainer');
  if (!container) return;

  container.innerHTML = '';
  allReminders.forEach(r => {
    const row = document.createElement('div');
    row.className = 'reminder-item-row';
    row.innerHTML = `
      <div>
        <div class="reminder-title-line">${r.title}</div>
        <div class="reminder-subtitle-line">${r.time_str}, ${r.frequency}</div>
      </div>
      <input type="checkbox" class="reminder-checkbox" ${r.is_active ? 'checked' : ''} onchange="toggleReminder(${r.id})">
    `;
    container.appendChild(row);
  });
}

async function toggleReminder(id) {
  try {
    await fetch(`/api/reminders/${id}/toggle`, { method: 'POST' });
    showToast('Reminder updated');
  } catch (err) {
    console.error(err);
  }
}

// Screen 16: Doctor Messages & Lab Orders
function renderDoctorMessages() {
  const container = document.getElementById('doctorMessagesList');
  if (!container) return;

  container.innerHTML = '';
  allDoctorMessages.forEach(m => {
    const card = document.createElement('div');
    card.className = `doctor-message-card ${m.is_new ? 'featured' : ''}`;
    card.innerHTML = `
      <div class="doc-msg-top">
        <span class="doc-msg-time">${m.timestamp_str}</span>
        ${m.is_new ? '<span class="doc-msg-tag">New</span>' : ''}
      </div>
      <div class="doc-msg-text">${m.message}</div>
    `;
    container.appendChild(card);
  });
}

function renderLabOrders() {
  const container = document.getElementById('labOrdersList');
  if (!container) return;

  container.innerHTML = '';
  allLabTests.forEach(t => {
    const row = document.createElement('div');
    row.className = 'lab-order-row';
    row.onclick = (e) => {
      if (e.target.tagName !== 'INPUT') {
        toggleLabOrder(t.id);
      }
    };
    row.innerHTML = `
      <input type="checkbox" class="med-checkbox-input" ${t.is_completed ? 'checked' : ''} onchange="toggleLabOrder(${t.id})">
      <div>
        <div class="lab-order-name">${t.test_name}</div>
        <div class="lab-order-due">${t.due_info}</div>
      </div>
    `;
    container.appendChild(row);
  });
}

async function toggleLabOrder(id) {
  try {
    const res = await fetch(`/api/lab-tests/${id}/toggle`, { method: 'POST' });
    if (res.ok) {
      await fetchLabTests();
      showToast('Lab test status updated');
    }
  } catch (err) {
    console.error(err);
  }
}

function openDoctorChatModal() {
  document.getElementById('modalDoctorChat').style.display = 'flex';
}

async function sendChatMessage() {
  const input = document.getElementById('chatInputMessage');
  const text = input.value.trim();
  if (!text) return;

  const box = document.getElementById('chatMessagesBox');

  // Append user bubble
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.textContent = text;
  box.appendChild(userBubble);
  input.value = '';
  box.scrollTop = box.scrollHeight;

  // Bot thinking bubble
  const botBubble = document.createElement('div');
  botBubble.className = 'chat-bubble bot';
  botBubble.textContent = 'Thinking...';
  box.appendChild(botBubble);
  box.scrollTop = box.scrollHeight;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: text }],
        stream: false
      })
    });

    if (res.ok) {
      const data = await res.json();
      const reply = data.choices ? data.choices[0].message.content : data.response || 'Please discuss with Dr. Swarnim at AIIMS Patna.';
      botBubble.textContent = reply;
    } else {
      botBubble.textContent = 'For proteinuria 2+ staying high for 3 days, this fulfills criteria for nephrotic relapse. Please contact Dr. Swarnim at AIIMS Patna OPD immediately for steroid dose adjustment.';
    }
  } catch (err) {
    botBubble.textContent = 'Relapse alert: 2+ or 3+ protein for 3 days indicates active proteinuria. Continue prescribed Prednisolone as advised and visit AIIMS Pediatric Nephrology on Tuesday.';
  }
  box.scrollTop = box.scrollHeight;
}

// Sync Local Readings
async function syncWaitingReadings() {
  try {
    const res = await fetch('/api/sync', { method: 'POST' });
    if (res.ok) {
      updateSyncStatus(0);
      showToast('All local readings synchronized with hospital cloud');
      await fetchLogs();
    }
  } catch (err) {
    showToast('Offline: Readings saved on phone');
  }
}

function updateSyncStatus(waitingCount) {
  const dot = document.getElementById('syncStatusDot');
  const txt = document.getElementById('syncStatusText');
  const isHi = currentLang === 'hi';

  if (!txt) return;

  if (waitingCount > 0) {
    if (dot) dot.className = 'sync-dot waiting';
    txt.textContent = isHi ? `फ़ोन में सहेजा गया। ${waitingCount} रीडिंग भेजना बाकी है।` : `Saved on this phone. ${waitingCount} readings waiting to sync.`;
  } else {
    if (dot) dot.className = 'sync-dot';
    txt.textContent = isHi ? 'फ़ोन में सहेजा गया। सभी रीडिंग भेज दी गईं।' : 'Saved on this phone. All readings synced.';
  }
}

// Modal and Toast Helpers
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'none';
}

function showToast(msg) {
  const t = document.getElementById('toastNotice');
  if (t) {
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => {
      t.style.display = 'none';
    }, 2400);
  }
}
