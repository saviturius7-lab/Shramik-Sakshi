import { SupportedLanguage } from '../types';

export interface TranslationDictionary {
  // Header
  gazetteDocNo: string;
  commandDeskSubtitle: string;
  verificationAct: string;
  appTitle: string;
  immutableLedgerBadge: string;
  appDescription: string;
  syncRegisterBtn: string;
  telexConsoleBtn: string;
  wireStatus: string;
  joinCodeLabel: string;
  statutoryWageLabel: string;
  evidenceLabel: string;
  languageSelectLabel: string;

  // Field Telegraph Station / Attendance Card
  teletypeStationTitle: string;
  teletypeStationSubtitle: string;
  preAiBadge: string;
  step1Title: string;
  step1Desc: string;
  scanWithCamera: string;
  openWhatsappWeb: string;
  nodeNumberLabel: string;
  step2Title: string;
  command1: string;
  command1Desc: string;
  command2: string;
  command2Desc: string;
  command3: string;
  command3Desc: string;
  command4: string;
  command4Desc: string;
  command5: string;
  command5Desc: string;
  command6: string;
  command6Desc: string;
  step3Title: string;
  testWebhookPost: string;
  testPinBtn: string;
  testHisaabBtn: string;
  testDisputeBtn: string;
  copiedLabel: string;

  // Sidebar
  dossierSection: string;
  commandControls: string;
  workerDossierSelect: string;
  allLaborersOption: string;
  enrolledCount: string;
  dispatchGpsPinBtn: string;
  regulationInstructions: string;
  urgentStamp: string;
  instStep1: string;
  instStep2: string;
  instStep3: string;
  connectLiveWhatsapp: string;
  directWorkerChatLabel: string;
  chatBtn: string;
  resetArchivedBtn: string;

  // Metrics
  tab1Title: string;
  tab1Badge: string;
  tab1Desc: string;
  tab1Foot: string;
  tab2Title: string;
  tab2Badge: string;
  tab2Desc: string;
  tab2Foot: string;
  tab3Title: string;
  tab3Badge: string;
  tab3Desc: string;
  tab3Foot: string;

  // Worker Profile
  workerProfileNotice: string;
  individualDossierBadge: string;
  verifiedBadge: string;
  laborerDossierTitle: string;
  dossierSubtitle: string;
  exportAuditBtn: string;
  verifiedDays: string;
  entitledCapital: string;
  mandatedRate: string;
  legalStanding: string;
  immutableStanding: string;
  timelineTitle: string;
  consecutivePeriods: string;
  timelineNote: string;
  individualSlipsTitle: string;
  receiptSlipBtn: string;

  // Live Map
  mapChartTitle: string;
  surveyPlotBadge: string;
  mapChartSubtitle: string;
  plottedStationsCount: string;
  activePinLabel: string;
  surveyScaleLabel: string;
  gpsProtocolActive: string;
  selectedLabel: string;
  viewVoucherBtn: string;

  // Ledger Table
  musterScheduleTitle: string;
  officialRegisterBadge: string;
  ledgerSubtitle: string;
  filterPlaceholder: string;
  oldestBtn: string;
  newestBtn: string;
  exportCsvBtn: string;
  thDocketToken: string;
  thDateTime: string;
  thWorkerPhone: string;
  thGpsCoords: string;
  thLocationSite: string;
  thWageInr: string;
  thStanding: string;
  thSlip: string;
  emptyLedgerText: string;

  // Receipt Modal
  receiptModalHeader: string;
  dailyWageProofTitle: string;
  satelliteSystemNote: string;
  sealSatyameva: string;
  sealImmutable: string;
  receiptDocketToken: string;
  receiptWorkerPhone: string;
  receiptDateTime: string;
  receiptGpsCoords: string;
  receiptSatelliteVerified: string;
  receiptFieldSite: string;
  receiptStatutoryWage: string;
  legalProtectionNoticeTitle: string;
  legalProtectionNoticeBody: string;
  officerSignatureLabel: string;
  sealAffixedLabel: string;
  copyTranscriptBtn: string;
  printBtn: string;
  dismissBtn: string;

  // Telex Modal
  telexTerminalTitle: string;
  deterministicStamp: string;
  musterLineId: string;
  telegraphTranscriptHeader: string;
  transmitterWorker: string;
  expertEngine: string;
  satelliteGpsBroadcast: string;
  macroMenu: string;
  macroHisaab: string;
  macroShikayat: string;
  macroRate: string;
  macroHelp: string;
  broadcastPinBtn: string;
  typeCommandPlaceholder: string;
  sendBtn: string;

  // Footer
  footerActTitle: string;
  footerNodeNote: string;

  // View Navigation Tabs
  tabAllInOne: string;
  tabMarkAttendance: string;
  tabAttendanceList: string;
  tabWorkerPassbook: string;
  tabWorkMap: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    // Header
    gazetteDocNo: "WORKER WAGE PASSBOOK",
    commandDeskSubtitle: "Daily Wage & Attendance Tracker for Every Laborer",
    verificationAct: "Daily Minimum Wage: ₹600",
    appTitle: "SHRAMIK SAKSHI • LABOUR REGISTER",
    immutableLedgerBadge: "100% PROTECTED",
    appDescription: "Every worker deserves their full wage. Mark daily work here with 1 tap, get an official wage slip, and check total money earned without paperwork.",
    syncRegisterBtn: "Refresh Register",
    telexConsoleBtn: "Full Terminal",
    wireStatus: "Status: System Online & Ready",
    joinCodeLabel: "Rate: ₹600.00 / Day",
    statutoryWageLabel: "Daily Wage: ₹600.00",
    evidenceLabel: "Official Proof of Work",
    languageSelectLabel: "Language",

    // Station
    teletypeStationTitle: "Mark Today's Attendance (हाजिरी लगाएं)",
    teletypeStationSubtitle: "Fast 1-Tap Attendance & Daily Wage Slip Generator",
    preAiBadge: "100% RELIABLE • NO ERRORS",
    step1Title: "1. Select Worker & Place",
    step1Desc: "Enter phone number and choose work location:",
    scanWithCamera: "Location Ready",
    openWhatsappWeb: "Mark Attendance",
    nodeNumberLabel: "Daily Rate: ₹600.00",
    step2Title: "Quick Helpful Buttons",
    command1: "1. 📌 Mark Today's Work",
    command1Desc: "Saves attendance & locks ₹600",
    command2: '2. 📊 Hisaab (हिसाब)',
    command2Desc: "See days worked & total money",
    command3: '3. 🚨 Complaint (शिकायत)',
    command3Desc: "Report wage theft or unpaid money",
    command4: '4. 📜 Wage Rule (नियम)',
    command4Desc: "Government minimum wage rules",
    command5: '5. 📞 Free Help (मदद)',
    command5Desc: "Union and legal help numbers",
    command6: '6. 📍 Work Site (साइट)',
    command6Desc: "Change work location",
    step3Title: "Live Message Tape",
    testWebhookPost: "Quick Test:",
    testPinBtn: "Mark Work",
    testHisaabBtn: "Check Hisaab",
    testDisputeBtn: "File Complaint",
    copiedLabel: "Copied!",

    // Sidebar
    dossierSection: "WORKER LIST",
    commandControls: "Controls & Search",
    workerDossierSelect: "Select Worker:",
    allLaborersOption: "All Workers (Show All)",
    enrolledCount: "WORKERS",
    dispatchGpsPinBtn: "📌 MARK ATTENDANCE (₹600)",
    regulationInstructions: "HOW IT WORKS (सरल नियम):",
    urgentStamp: "IMPORTANT",
    instStep1: "Pick your phone number or enter a new one.",
    instStep2: "Choose your job location from the list or use GPS.",
    instStep3: "Tap 'Mark Attendance' to immediately get your ₹600 slip.",
    connectLiveWhatsapp: "Open Full Terminal",
    directWorkerChatLabel: "Search Worker by Mobile Number:",
    chatBtn: "Search",
    resetArchivedBtn: "Reset to Sample Records",

    // Metrics
    tab1Title: "ACTIVE WORKERS",
    tab1Badge: "ENROLLED",
    tab1Desc: "Workers registered in this book",
    tab1Foot: "✓ Verified with location",
    tab2Title: "DAYS WORKED",
    tab2Badge: "RECORDED",
    tab2Desc: "Total workdays logged on record",
    tab2Foot: "Rate: ₹600.00 Per Day",
    tab3Title: "TOTAL MONEY EARNED",
    tab3Badge: "GUARANTEED",
    tab3Desc: "Total wage money earned by workers",
    tab3Foot: "✓ Legally protected against wage theft",

    // Worker Profile
    workerProfileNotice: "Select any worker from the list below to see their work days, money earned, and official wage slips.",
    individualDossierBadge: "WORKER PASSBOOK",
    verifiedBadge: "VERIFIED RECORD",
    laborerDossierTitle: "Worker Record:",
    dossierSubtitle: "Official attendance and wage record",
    exportAuditBtn: "Download Record (.txt)",
    verifiedDays: "Days Worked",
    entitledCapital: "Total Money Earned",
    mandatedRate: "Wage Rate / Day",
    legalStanding: "Record Status",
    immutableStanding: "GUARANTEED (पक्का)",
    timelineTitle: "Work Days Calendar",
    consecutivePeriods: "Days",
    timelineNote: "Click any day bar to view and print the official wage slip.",
    individualSlipsTitle: "Daily Wage Slips:",
    receiptSlipBtn: "View Slip",

    // Live Map
    mapChartTitle: "Work Locations Map",
    surveyPlotBadge: "MAP",
    mapChartSubtitle: "Locations where workers punched their attendance",
    plottedStationsCount: "Locations Marked",
    activePinLabel: "Work Place",
    surveyScaleLabel: "GPS Location",
    gpsProtocolActive: "Live GPS",
    selectedLabel: "Selected Worker",
    viewVoucherBtn: "View Slip",

    // Ledger Table
    musterScheduleTitle: "Daily Attendance Register",
    officialRegisterBadge: "OFFICIAL LIST",
    ledgerSubtitle: "Complete list of every workday and wage slip",
    filterPlaceholder: "Type phone number or work place to search...",
    oldestBtn: "Oldest First",
    newestBtn: "Newest First",
    exportCsvBtn: "Download Excel / CSV",
    thDocketToken: "Slip No.",
    thDateTime: "Date & Time",
    thWorkerPhone: "Worker Phone",
    thGpsCoords: "Location GPS",
    thLocationSite: "Work Place",
    thWageInr: "Daily Wage",
    thStanding: "Status",
    thSlip: "Slip",
    emptyLedgerText: "No attendance slips recorded yet.",

    // Receipt Modal
    receiptModalHeader: "GOVERNMENT OF INDIA • LABOUR PROTECTION",
    dailyWageProofTitle: "OFFICIAL DAILY WAGE SLIP (काम की पक्की रसीद)",
    satelliteSystemNote: "Legal proof of daily attendance and ₹600.00 wage entitlement",
    sealSatyameva: "Official Seal",
    sealImmutable: "Cannot Be Denied",
    receiptDocketToken: "Slip Number",
    receiptWorkerPhone: "Worker Phone Number",
    receiptDateTime: "Date & Time",
    receiptGpsCoords: "Work Place GPS",
    receiptSatelliteVerified: "Verified Location",
    receiptFieldSite: "Work Site Description",
    receiptStatutoryWage: "Today's Wage",
    legalProtectionNoticeTitle: "Legal Guarantee Notice",
    legalProtectionNoticeBody: "This slip is legal proof that you worked today. If any contractor refuses or cuts your ₹600 wage, show this slip to the union, labour officer, or legal aid center.",
    officerSignatureLabel: "Witness Signature",
    sealAffixedLabel: "Official Stamp",
    copyTranscriptBtn: "Copy Slip Details",
    printBtn: "Print Slip (प्रिंट करें)",
    dismissBtn: "Close (बंद करें)",

    // Telex Modal
    telexTerminalTitle: "Field Telegraph Desk",
    deterministicStamp: "100% RELIABLE",
    musterLineId: "Worker Mobile Number",
    telegraphTranscriptHeader: "OFFICIAL ATTENDANCE LOG",
    transmitterWorker: "Worker (कामगार)",
    expertEngine: "Shramik Sakshi Desk",
    satelliteGpsBroadcast: "GPS Location Marked:",
    macroMenu: "0. Menu (मेनू)",
    macroHisaab: "2. Hisaab (हिसाब)",
    macroShikayat: "3. Complaint (शिकायत)",
    macroRate: "4. Rate (नियम)",
    macroHelp: "5. Help (मदद)",
    broadcastPinBtn: "Mark Work",
    typeCommandPlaceholder: "Type: '2' for Hisaab, '3' for Complaint...",
    sendBtn: "Send",

    // Footer
    footerActTitle: "SHRAMIK SAKSHI • DAILY WAGE PASSBOOK FOR UNORGANIZED LABOR",
    footerNodeNote: "[ OFFICIAL REGISTER • 100% DISPUTE PROOF ]",

    tabAllInOne: "All in One",
    tabMarkAttendance: "Mark Attendance",
    tabAttendanceList: "Attendance Register",
    tabWorkerPassbook: "Worker Passbook",
    tabWorkMap: "Work Map",
  },

  hi: {
    // Hindi
    gazetteDocNo: "मजदूर खाता पुस्तिका",
    commandDeskSubtitle: "हर मजदूर के लिए सरल हाजिरी और कमाई का रजिस्टर",
    verificationAct: "सरकारी न्यूनतम मजदूरी: ₹600 / दिन",
    appTitle: "श्रमिक साक्षी • मजदूर खाता",
    immutableLedgerBadge: "100% पक्का व सुरक्षित",
    appDescription: "हर मजदूर को उसकी पूरी मजदूरी मिलनी चाहिए। 1 क्लिक में हाजिरी लगाएं, पक्की सरकारी पर्ची पाएं और अपनी कुल कमाई देखें बिना किसी कागजी झंझट के।",
    syncRegisterBtn: "रजिस्टर ताज़ा करें",
    telexConsoleBtn: "पूरा टर्मिनल",
    wireStatus: "स्थिति: चालू और तैयार",
    joinCodeLabel: "मजदूरी दर: ₹600 / दिन",
    statutoryWageLabel: "रोजाना मजदूरी: ₹600",
    evidenceLabel: "काम का पक्का कानूनी सबूत",
    languageSelectLabel: "भाषा",

    teletypeStationTitle: "आज की हाजिरी लगाएं (Mark Attendance)",
    teletypeStationSubtitle: "1 बटन दबाकर काम की हाजिरी दर्ज करें और पक्की पर्ची पाएं",
    preAiBadge: "100% भरोसेमंद • बिना किसी गलती के",
    step1Title: "1. अपना फोन नंबर व काम की जगह चुनें",
    step1Desc: "फोन नंबर डालें और काम की जगह चुनें:",
    scanWithCamera: "लोकेशन तैयार",
    openWhatsappWeb: "हाजिरी लगाएं",
    nodeNumberLabel: "सरकारी दर: ₹600.00 / दिन",
    step2Title: "जरूरी बटन (काम की जानकारी)",
    command1: "1. 📌 हाजिरी लगाएं (Punch Work)",
    command1Desc: "हाजिरी दर्ज कर ₹600 पक्का करें",
    command2: '2. 📊 हिसाब देखें (Hisaab)',
    command2Desc: "कुल दिन और कुल कमाई देखें",
    command3: '3. 🚨 शिकायत करें (Shikayat)',
    command3Desc: "मजदूरी काटने या न मिलने की शिकायत",
    command4: '4. 📜 मजदूरी नियम (Rate)',
    command4Desc: "सरकारी नियम व अधिकार जानें",
    command5: '5. 📞 मुफ्त कानूनी मदद (Help)',
    command5Desc: "यूनियन और कानूनी हेल्पलाइन",
    command6: '6. 📍 काम की जगह (Site)',
    command6Desc: "काम की जगह बदलें",
    step3Title: "लाइव मैसेज टेप",
    testWebhookPost: "तुरंत टेस्ट करें:",
    testPinBtn: "हाजिरी",
    testHisaabBtn: "हिसाब",
    testDisputeBtn: "शिकायत",
    copiedLabel: "कॉपी हो गया!",

    dossierSection: "मजदूरों की सूची",
    commandControls: "खोजें व देखें",
    workerDossierSelect: "मजदूर चुनें:",
    allLaborersOption: "सभी मजदूर (सबका देखें)",
    enrolledCount: "मजदूर",
    dispatchGpsPinBtn: "📌 हाजिरी दर्ज करें (₹600)",
    regulationInstructions: "काम कैसे करता है (सरल नियम):",
    urgentStamp: "जरूरी",
    instStep1: "अपना फोन नंबर चुनें या नया नंबर डालें।",
    instStep2: "काम की जगह चुनें या मोबाइल का GPS चालू करें।",
    instStep3: "'हाजिरी लगाएं' दबाएं और तुरंत अपनी ₹600 की पर्ची पाएं।",
    connectLiveWhatsapp: "टर्मिनल खोलें",
    directWorkerChatLabel: "फोन नंबर से मजदूर खोजें:",
    chatBtn: "खोजें",
    resetArchivedBtn: "शुरुआती रिकॉर्ड पर लाएं",

    tab1Title: "कुल मजदूर",
    tab1Badge: "पंजीकृत",
    tab1Desc: "रजिस्टर में दर्ज कामगार",
    tab1Foot: "✓ लोकेशन से सत्यापित",
    tab2Title: "काम के कुल दिन",
    tab2Badge: "दर्ज",
    tab2Desc: "मजदूरों द्वारा पूरे किए गए कार्य दिवस",
    tab2Foot: "दर: ₹600.00 प्रतिदिन",
    tab3Title: "कुल कमाई (रुपये)",
    tab3Badge: "पक्की गारंटी",
    tab3Desc: "सभी दिनों की कुल कमाई का हिसाब",
    tab3Foot: "✓ मजदूरी चोरी से 100% सुरक्षित",

    workerProfileNotice: "नीचे दी गई सूची में से किसी भी मजदूर को चुनकर उनके काम के दिन, कमाई और पर्चियां देखें।",
    individualDossierBadge: "मजदूर पासबुक",
    verifiedBadge: "सत्यापित रिकॉर्ड",
    laborerDossierTitle: "मजदूर का खाता:",
    dossierSubtitle: "हाजिरी और मजदूरी का पक्का रिकॉर्ड",
    exportAuditBtn: "रिकॉर्ड डाउनलोड करें (.txt)",
    verifiedDays: "काम के दिन",
    entitledCapital: "कुल कमाई",
    mandatedRate: "दैनिक दर",
    legalStanding: "दर्जा",
    immutableStanding: "पक्का (गारंटीशुदा)",
    timelineTitle: "काम के दिनों का कैलेंडर",
    consecutivePeriods: "दिन",
    timelineNote: "किसी भी दिन की पर्ची देखने व प्रिंट करने के लिए उस दिन पर क्लिक करें।",
    individualSlipsTitle: "रोजाना की मजदूरी पर्चियां:",
    receiptSlipBtn: "पर्ची देखें",

    mapChartTitle: "काम की जगहों का नक्शा",
    surveyPlotBadge: "नक्शा",
    mapChartSubtitle: "जहां-जहां मजदूरों ने अपनी हाजिरी लगाई है",
    plottedStationsCount: "दर्ज जगहें",
    activePinLabel: "काम की जगह",
    surveyScaleLabel: "सत्यापित जीपीएस",
    gpsProtocolActive: "चालू सैटेलाइट",
    selectedLabel: "चुना हुआ मजदूर",
    viewVoucherBtn: "पर्ची देखें",

    musterScheduleTitle: "दैनिक हाजिरी रजिस्टर",
    officialRegisterBadge: "सरकारी सूची",
    ledgerSubtitle: "हर मजदूर की रोजाना हाजिरी और पर्ची का पूरा रिकॉर्ड",
    filterPlaceholder: "फोन नंबर या जगह का नाम लिखकर खोजें...",
    oldestBtn: "पहले का पहले",
    newestBtn: "नया पहले",
    exportCsvBtn: "एक्सेल / सीएसवी डाउनलोड करें",
    thDocketToken: "पर्ची नंबर",
    thDateTime: "तारीख व समय",
    thWorkerPhone: "मजदूर का फोन",
    thGpsCoords: "लोकेशन जीपीएस",
    thLocationSite: "काम की जगह",
    thWageInr: "दैनिक मजदूरी",
    thStanding: "दर्जा",
    thSlip: "पर्ची",
    emptyLedgerText: "अभी तक कोई हाजिरी दर्ज नहीं है।",

    receiptModalHeader: "भारत सरकार • श्रम अधिकार सुरक्षा",
    dailyWageProofTitle: "दैनिक मजदूरी पक्की पर्ची (OFFICIAL WAGE SLIP)",
    satelliteSystemNote: "काम की कानूनी हाजिरी और ₹600.00 मजदूरी का पक्का अधिकार",
    sealSatyameva: "सत्यमेव जयते",
    sealImmutable: "काटा नहीं जा सकता",
    receiptDocketToken: "पर्ची संख्या",
    receiptWorkerPhone: "मजदूर का फोन नंबर",
    receiptDateTime: "तारीख और समय",
    receiptGpsCoords: "काम की जगह का जीपीएस",
    receiptSatelliteVerified: "सत्यापित लोकेशन",
    receiptFieldSite: "काम की जगह का विवरण",
    receiptStatutoryWage: "आज की मजदूरी",
    legalProtectionNoticeTitle: "कानूनी सुरक्षा गारंटी",
    legalProtectionNoticeBody: "यह पर्ची इस बात का कानूनी सबूत है कि आपने आज काम किया है। यदि कोई ठेकेदार या मालिक आपकी ₹600 मजदूरी काटने या देने से मना करे, तो यह पर्ची तुरंत लेबर कोर्ट या यूनियन कार्यालय में दिखाएं।",
    officerSignatureLabel: "गवाह के हस्ताक्षर",
    sealAffixedLabel: "आधिकारिक मुहर",
    copyTranscriptBtn: "पर्ची की जानकारी कॉपी करें",
    printBtn: "पर्ची प्रिंट करें",
    dismissBtn: "बंद करें",

    telexTerminalTitle: "टेलीग्राफ हाजिरी डेस्क",
    deterministicStamp: "100% भरोसेमंद",
    musterLineId: "मजदूर का मोबाइल नंबर",
    telegraphTranscriptHeader: "आधिकारिक हाजिरी रिकॉर्ड",
    transmitterWorker: "मजदूर (कामगार)",
    expertEngine: "श्रमिक साक्षी प्रणाली",
    satelliteGpsBroadcast: "लोकेशन दर्ज हुई:",
    macroMenu: "0. मेनू (Menu)",
    macroHisaab: "2. हिसाब (Hisaab)",
    macroShikayat: "3. शिकायत (Complaint)",
    macroRate: "4. नियम (Rate)",
    macroHelp: "5. मदद (Help)",
    broadcastPinBtn: "हाजिरी लगाएं",
    typeCommandPlaceholder: "लिखें: हिसाब के लिए '2', शिकायत के लिए '3'...",
    sendBtn: "भेजें",

    footerActTitle: "श्रमिक साक्षी • असंगठित कामगारों के लिए दैनिक मजदूरी सुरक्षा पासबुक",
    footerNodeNote: "[ आधिकारिक रजिस्टर • 100% पक्का रिकॉर्ड ]",

    tabAllInOne: "सब कुछ (All)",
    tabMarkAttendance: "हाजिरी लगाएं (Mark Attendance)",
    tabAttendanceList: "हाजिरी रजिस्टर (Register)",
    tabWorkerPassbook: "मजदूर पासबुक (Passbook)",
    tabWorkMap: "काम का नक्शा (Map)",
  },

  kn: {
    // Kannada
    gazetteDocNo: "ಕಾರ್ಮಿಕ ವೇತನ ಪಾಸ್‌ಬುಕ್",
    commandDeskSubtitle: "ಪ್ರತಿಯೊಬ್ಬ ಕಾರ್ಮಿಕರಿಗೂ ದಿನದ ಹಾಜರಾತಿ ಮತ್ತು ಗಳಿಕೆಯ ಸುಲಭ ಪುಸ್ತಕ",
    verificationAct: "ದೈನಂದಿನ ಕನಿಷ್ಠ ವೇತನ: ₹600 / ದಿನ",
    appTitle: "ಶ್ರಮಿಕ್ ಸಾಕ್ಷಿ • ಕಾರ್ಮಿಕ ಖಾತೆ",
    immutableLedgerBadge: "100% ಸುರಕ್ಷಿತ",
    appDescription: "ಪ್ರತಿಯೊಬ್ಬ ಕಾರ್ಮಿಕನಿಗೂ ಪೂರ್ಣ ಕೂಲಿ ಸಿಗಬೇಕು. 1 ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಹಾಜರಾತಿ ಹಾಕಿ, ಪಕ್ಕಾ ರಸೀದಿ ಪಡೆಯಿರಿ ಮತ್ತು ನಿಮ್ಮ ಒಟ್ಟು ಗಳಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    syncRegisterBtn: "ರಿಜಿಸ್ಟರ್ ನವೀಕರಿಸಿ",
    telexConsoleBtn: "ಪೂರ್ಣ ಟರ್ಮಿನಲ್",
    wireStatus: "ಸ್ಥಿತಿ: ಸಕ್ರಿಯವಾಗಿದೆ ಮತ್ತು ಸಿದ್ಧವಾಗಿದೆ",
    joinCodeLabel: "ದರ: ₹600.00 / ದಿನ",
    statutoryWageLabel: "ದೈನಂದಿನ ಕೂಲಿ: ₹600.00",
    evidenceLabel: "ಕೆಲಸದ ಅಧಿಕೃತ ಪುರಾವೆ",
    languageSelectLabel: "ಭಾಷೆ",

    teletypeStationTitle: "ಇಂದಿನ ಹಾಜರಾತಿ ಹಾಕಿ (Mark Attendance)",
    teletypeStationSubtitle: "1 ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಹಾಜರಾತಿ ದಾಖಲಿಸಿ ಮತ್ತು ಅಧಿಕೃತ ಕೂಲಿ ರಸೀದಿ ಪಡೆಯಿರಿ",
    preAiBadge: "100% ನಂಬಿಕಸ್ಥ • ಯಾವುದೇ ದೋಷವಿಲ್ಲ",
    step1Title: "1. ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ",
    step1Desc: "ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ ಮತ್ತು ಕೆಲಸದ ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ:",
    scanWithCamera: "ಸ್ಥಳ ಸಿದ್ಧವಾಗಿದೆ",
    openWhatsappWeb: "ಹಾಜರಾತಿ ಹಾಕಿ",
    nodeNumberLabel: "ಸರ್ಕಾರಿ ದರ: ₹600.00 / ದಿನ",
    step2Title: "ಸುಲಭ ಬಟನ್‌ಗಳು",
    command1: "1. 📌 ಹಾಜರಾತಿ ಹಾಕಿ",
    command1Desc: "ಹಾಜರಾತಿ ದಾಖಲಿಸಿ ₹600 ಖಚಿತಪಡಿಸಿ",
    command2: '2. 📊 ಲೆಕ್ಕ (Hisaab)',
    command2Desc: "ಕೆಲಸದ ದಿನಗಳು ಮತ್ತು ಒಟ್ಟು ಹಣ ನೋಡಿ",
    command3: '3. 🚨 ದೂರು (Complaint)',
    command3Desc: "ಕೂಲಿ ಕಡಿತ ಅಥವಾ ತಡವಾದರೆ ದೂರು ನೀಡಿ",
    command4: '4. 📜 ನಿಯಮಗಳು (Rate)',
    command4Desc: "ಕನಿಷ್ಠ ವೇತನದ ಸರ್ಕಾರಿ ನಿಯಮಗಳು",
    command5: '5. 📞 ಉಚಿತ ಸಹಾಯ (Help)',
    command5Desc: "ಕಾರ್ಮಿಕ ಸಹಾಯವಾಣಿ ಸಂಖ್ಯೆಗಳು",
    command6: '6. 📍 ಸ್ಥಳ (Site)',
    command6Desc: "ಕೆಲಸದ ಸ್ಥಳ ಬದಲಾಯಿಸಿ",
    step3Title: "ಲೈವ್ ಮೆಸೇಜ್ ಟೇಪ್",
    testWebhookPost: "ಪರೀಕ್ಷಿಸಿ:",
    testPinBtn: "ಹಾಜರಾತಿ",
    testHisaabBtn: "ಲೆಕ್ಕ ನೋಡಿ",
    testDisputeBtn: "ದೂರು ನೀಡಿ",
    copiedLabel: "ನಕಲಿಸಲಾಗಿದೆ!",

    dossierSection: "ಕಾರ್ಮಿಕರ ಪಟ್ಟಿ",
    commandControls: "ಹುಡುಕಿ ಮತ್ತು ವೀಕ್ಷಿಸಿ",
    workerDossierSelect: "ಕಾರ್ಮಿಕರನ್ನು ಆಯ್ಕೆಮಾಡಿ:",
    allLaborersOption: "ಎಲ್ಲಾ ಕಾರ್ಮಿಕರು (ಎಲ್ಲರ ವಿವರ)",
    enrolledCount: "ಕಾರ್ಮಿಕರು",
    dispatchGpsPinBtn: "📌 ಹಾಜರಾತಿ ಹಾಕಿ (₹600)",
    regulationInstructions: "ಬಳಸುವುದು ಹೇಗೆ (ಸುಲಭ ನಿಯಮಗಳು):",
    urgentStamp: "ಮುಖ್ಯ ಮಾಹಿತಿ",
    instStep1: "ನಿಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಹೊಸ ಸಂಖ್ಯೆ ಹಾಕಿ.",
    instStep2: "ಕೆಲಸದ ಸ್ಥಳವನ್ನು ಆರಿಸಿ ಅಥವಾ GPS ಆನ್ ಮಾಡಿ.",
    instStep3: "'ಹಾಜರಾತಿ ಹಾಕಿ' ಒತ್ತಿ ಮತ್ತು ತಕ್ಷಣ ₹600 ರಸೀದಿ ಪಡೆಯಿರಿ.",
    connectLiveWhatsapp: "ಟರ್ಮಿನಲ್ ತೆರೆಯಿರಿ",
    directWorkerChatLabel: "ಫೋನ್ ಸಂಖ್ಯೆಯಿಂದ ಕಾರ್ಮಿಕರನ್ನು ಹುಡುಕಿ:",
    chatBtn: "ಹುಡುಕಿ",
    resetArchivedBtn: "ಮಾದರಿ ದಾಖಲೆಗಳಿಗೆ ಮರುಹೊಂದಿಸಿ",

    tab1Title: "ನೋಂದಾಯಿತ ಕಾರ್ಮಿಕರು",
    tab1Badge: "ಸಕ್ರಿಯ",
    tab1Desc: "ಖಾತೆಯಲ್ಲಿರುವ ಕಾರ್ಮಿಕರು",
    tab1Foot: "✓ ಜಿಪಿಎಸ್ ಸ್ಥಳದಿಂದ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    tab2Title: "ಕೆಲಸ ಮಾಡಿದ ದಿನಗಳು",
    tab2Badge: "ದಾಖಲಾಗಿದೆ",
    tab2Desc: "ಒಟ್ಟು ಕೆಲಸದ ದಿನಗಳು",
    tab2Foot: "ದರ: ದಿನಕ್ಕೆ ₹600.00",
    tab3Title: "ಒಟ್ಟು ಗಳಿಸಿದ ಕೂಲಿ",
    tab3Badge: "ಖಾತರಿ",
    tab3Desc: "ಎಲ್ಲಾ ದಿನಗಳ ಒಟ್ಟು ಕೂಲಿ ಹಣ",
    tab3Foot: "✓ ಕೂಲಿ ಕಳ್ಳತನದ ವಿರುದ್ಧ ಸಂಪೂರ್ಣ ರಕ್ಷಣೆ",

    workerProfileNotice: "ಯಾವುದೇ ಕಾರ್ಮಿಕರ ಕೆಲಸದ ದಿನಗಳು, ಗಳಿಕೆ ಮತ್ತು ರಸೀದಿಗಳನ್ನು ನೋಡಲು ಕೆಳಗಿನ ಪಟ್ಟಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ.",
    individualDossierBadge: "ಕಾರ್ಮಿಕ ಪಾಸ್‌ಬುಕ್",
    verifiedBadge: "ಪರಿಶೀಲಿತ ದಾಖಲೆ",
    laborerDossierTitle: "ಕಾರ್ಮಿಕರ ಖಾತೆ:",
    dossierSubtitle: "ಹಾಜರಾತಿ ಮತ್ತು ಕೂಲಿಯ ಅಧಿಕೃತ ದಾಖಲೆ",
    exportAuditBtn: "ದಾಖಲೆ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (.txt)",
    verifiedDays: "ಕೆಲಸ ಮಾಡಿದ ದಿನಗಳು",
    entitledCapital: "ಒಟ್ಟು ಗಳಿಕೆ",
    mandatedRate: "ದೈನಂದಿನ ಕೂಲಿ ದರ",
    legalStanding: "ಸ್ಥಿತಿ",
    immutableStanding: "ಖಾತರಿಪಡಿಸಲಾಗಿದೆ (ಪಕ್ಕಾ)",
    timelineTitle: "ಕೆಲಸದ ದಿನಗಳ ಕ್ಯಾಲೆಂಡರ್",
    consecutivePeriods: "ದಿನಗಳು",
    timelineNote: "ಅಧಿಕೃತ ರಸೀದಿ ನೋಡಲು ಮತ್ತು ಪ್ರಿಂಟ್ ಮಾಡಲು ಯಾವುದೇ ದಿನದ ಪಟ್ಟಿಯ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ.",
    individualSlipsTitle: "ದೈನಂದಿನ ಕೂಲಿ ರಸೀದಿಗಳು:",
    receiptSlipBtn: "ರಸೀದಿ ನೋಡಿ",

    mapChartTitle: "ಕೆಲಸದ ಸ್ಥಳಗಳ ನಕ್ಷೆ",
    surveyPlotBadge: "ನಕ್ಷೆ",
    mapChartSubtitle: "ಕಾರ್ಮಿಕರು ಹಾಜರಾತಿ ಹಾಕಿದ ಸ್ಥಳಗಳು",
    plottedStationsCount: "ದಾಖಲಾದ ಸ್ಥಳಗಳು",
    activePinLabel: "ಕೆಲಸದ ಸ್ಥಳ",
    surveyScaleLabel: "ಪರಿಶೀಲಿತ ಜಿಪಿಎಸ್",
    gpsProtocolActive: "ಲೈವ್ ಜಿಪಿಎಸ್",
    selectedLabel: "ಆಯ್ಕೆಮಾಡಿದ ಕಾರ್ಮಿಕ",
    viewVoucherBtn: "ರಸೀದಿ ನೋಡಿ",

    musterScheduleTitle: "ದೈನಂದಿನ ಹಾಜರಾತಿ ರಿಜಿಸ್ಟರ್",
    officialRegisterBadge: "ಅಧಿಕೃತ ಪಟ್ಟಿ",
    ledgerSubtitle: "ಪ್ರತಿಯೊಬ್ಬ ಕಾರ್ಮಿಕರ ಹಾಜರಾತಿ ಮತ್ತು ಕೂಲಿ ರಸೀದಿಗಳ ವಿವರ",
    filterPlaceholder: "ಫೋನ್ ಸಂಖ್ಯೆ ಅಥವಾ ಸ್ಥಳದ ಹೆಸರು ಹಾಕಿ ಹುಡುಕಿ...",
    oldestBtn: "ಹಳೆಯದು ಮೊದಲು",
    newestBtn: "ಹೊಸತು ಮೊದಲು",
    exportCsvBtn: "ಎಕ್ಸೆಲ್ / ಸಿಎಸ್‌ವಿ ಡೌನ್‌ಲೋಡ್",
    thDocketToken: "ರಸೀದಿ ಸಂಖ್ಯೆ",
    thDateTime: "ದಿನಾಂಕ ಮತ್ತು ಸಮಯ",
    thWorkerPhone: "ಕಾರ್ಮಿಕರ ಮೊಬೈಲ್",
    thGpsCoords: "ಸ್ಥಳ ಜಿಪಿಎಸ್",
    thLocationSite: "ಕೆಲಸದ ಸ್ಥಳ",
    thWageInr: "ದೈನಂದಿನ ಕೂಲಿ",
    thStanding: "ಸ್ಥಿತಿ",
    thSlip: "ರಸೀದಿ",
    emptyLedgerText: "ಇನ್ನೂ ಯಾವುದೇ ಹಾಜರಾತಿ ದಾಖಲಾಗಿಲ್ಲ.",

    receiptModalHeader: "ಭಾರತ ಸರ್ಕಾರ • ಕಾರ್ಮಿಕ ಹಕ್ಕುಗಳ ರಕ್ಷಣೆ",
    dailyWageProofTitle: "ಅಧಿಕೃತ ಕೂಲಿ ರಸೀದಿ (OFFICIAL WAGE SLIP)",
    satelliteSystemNote: "ಕೆಲಸ ಮಾಡಿದ ದಿನದ ಕಾನೂನುಬದ್ಧ ಪುರಾವೆ ಮತ್ತು ₹600.00 ಕೂಲಿಯ ಹಕ್ಕು",
    sealSatyameva: "ಸತ್ಯಮೇವ ಜಯತೆ",
    sealImmutable: "ತಿರಸ್ಕರಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ",
    receiptDocketToken: "ರಸೀದಿ ಸಂಖ್ಯೆ",
    receiptWorkerPhone: "ಕಾರ್ಮಿಕರ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    receiptDateTime: "ದಿನಾಂಕ ಮತ್ತು ಸಮಯ",
    receiptGpsCoords: "ಕೆಲಸದ ಸ್ಥಳದ ಜಿಪಿಎಸ್",
    receiptSatelliteVerified: "ಪರಿಶೀಲಿತ ಸ್ಥಳ",
    receiptFieldSite: "ಕೆಲಸದ ಸ್ಥಳದ ವಿವರ",
    receiptStatutoryWage: "ಇಂದಿನ ಕೂಲಿ",
    legalProtectionNoticeTitle: "ಕಾನೂನು ಸುರಕ್ಷತಾ ಖಾತರಿ",
    legalProtectionNoticeBody: "ನೀವು ಇಂದು ಕೆಲಸ ಮಾಡಿದ್ದೀರಿ ಎಂಬುದಕ್ಕೆ ಈ ರಸೀದಿಯು ಕಾನೂನುಬದ್ಧ ಪುರಾವೆಯಾಗಿದೆ. ಗುತ್ತಿಗೆದಾರರು ₹600 ಕೂಲಿ ನೀಡಲು ನಿರಾಕರಿಸಿದರೆ ಅಥವಾ ಕಡಿತಗೊಳಿಸಿದರೆ, ತಕ್ಷಣ ಇದನ್ನು ಲೇಬರ್ ಕೋರ್ಟ್ ಅಥವಾ ಯೂನಿಯನ್‌ಗೆ ತೋರಿಸಿ.",
    officerSignatureLabel: "ಸಾಕ್ಷಿದಾರರ ಸಹಿ",
    sealAffixedLabel: "ಅಧಿಕೃತ ಮುದ್ರೆ",
    copyTranscriptBtn: "ವಿವರಗಳನ್ನು ನಕಲಿಸಿ",
    printBtn: "ರಸೀದಿ ಮುದ್ರಿಸಿ (Print)",
    dismissBtn: "ಮುಚ್ಚಿ (Close)",

    telexTerminalTitle: "ಫೀಲ್ಡ್ ಟೆಲಿಗ್ರಾಫ್ ಡೆಸ್ಕ್",
    deterministicStamp: "100% ನಂಬಿಕಸ್ಥ",
    musterLineId: "ಕಾರ್ಮಿಕರ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    telegraphTranscriptHeader: "ಅಧಿಕೃತ ಹಾಜರಾತಿ ಲಾಗ್",
    transmitterWorker: "ಕಾರ್ಮಿಕ",
    expertEngine: "ಶ್ರಮಿಕ್ ಸಾಕ್ಷಿ ವ್ಯವಸ್ಥೆ",
    satelliteGpsBroadcast: "ಸ್ಥಳ ದಾಖಲಾಗಿದೆ:",
    macroMenu: "0. ಮೆನು (Menu)",
    macroHisaab: "2. ಲೆಕ್ಕ (Hisaab)",
    macroShikayat: "3. ದೂರು (Complaint)",
    macroRate: "4. ನಿಯಮ (Rate)",
    macroHelp: "5. ಸಹಾಯ (Help)",
    broadcastPinBtn: "ಹಾಜರಾತಿ ಹಾಕಿ",
    typeCommandPlaceholder: "ಲೆಕ್ಕಕ್ಕಾಗಿ '2', ದೂರಿಗೆ '3' ಟೈಪ್ ಮಾಡಿ...",
    sendBtn: "ಕಳುಹಿಸಿ",

    footerActTitle: "ಶ್ರಮಿಕ್ ಸಾಕ್ಷಿ • ಅಸಂಘಟಿತ ಕಾರ್ಮಿಕರಿಗಾಗಿ ದೈನಂದಿನ ಕೂಲಿ ರಕ್ಷಣೆ ಪಾಸ್‌ಬುಕ್",
    footerNodeNote: "[ ಅಧಿಕೃತ ರಿಜಿಸ್ಟರ್ • 100% ಪಕ್ಕಾ ದಾಖಲೆ ]",

    tabAllInOne: "ಎಲ್ಲವೂ (All)",
    tabMarkAttendance: "ಹಾಜರಾತಿ ಹಾಕಿ (Mark Attendance)",
    tabAttendanceList: "ಹಾಜರಾತಿ ಪಟ್ಟಿ (Register)",
    tabWorkerPassbook: "ಕಾರ್ಮಿಕ ಪಾಸ್‌ಬುಕ್ (Passbook)",
    tabWorkMap: "ಕೆಲಸದ ನಕ್ಷೆ (Map)",
  },

  te: {
    // Telugu
    gazetteDocNo: "కార్మిక వేతన పాస్‌బుక్",
    commandDeskSubtitle: "ప్రతి కార్మికుడికి రోజువారీ హాజరు మరియు సంపాదన పుస్తకం",
    verificationAct: "రోజువారీ కనీస వేతనం: ₹600 / రోజు",
    appTitle: "శ్రమిక్ సాక్షి • కార్మిక ఖాతా",
    immutableLedgerBadge: "100% సురక్షితం",
    appDescription: "ప్రతి కార్మికుడికి పూర్తి వేతనం అందాలి. 1 క్లిక్‌తో హాజరు వేయండి, అధికారిక రసీదు పొందండి మరియు మీ సంపాదనను సులభంగా తెలుసుకోండి.",
    syncRegisterBtn: "రిజిస్టర్ రీఫ్రెష్ చేయండి",
    telexConsoleBtn: "పూర్తి టెర్మినల్",
    wireStatus: "స్థితి: ఆన్‌లైన్ & సిద్ధంగా ఉంది",
    joinCodeLabel: "రేటు: ₹600.00 / రోజు",
    statutoryWageLabel: "రోజువారీ వేతనం: ₹600.00",
    evidenceLabel: "పని యొక్క అధికారిక రుజువు",
    languageSelectLabel: "భాష",

    teletypeStationTitle: "నేటి హాజరు వేయండి (Mark Attendance)",
    teletypeStationSubtitle: "ఒక్క ట్యాప్‌తో హాజరు నమోదు చేయండి & అధికారిక రసీదు పొందండి",
    preAiBadge: "100% నమ్మకమైనది • లోపం లేనిది",
    step1Title: "1. ఫోన్ నంబర్ మరియు పని స్థలం ఎంచుకోండి",
    step1Desc: "ఫోన్ నంబర్ నమోదు చేసి పని స్థలాన్ని ఎంచుకోండి:",
    scanWithCamera: "లొకేషన్ సిద్ధం",
    openWhatsappWeb: "హాజరు వేయండి",
    nodeNumberLabel: "ప్రభుత్వ రేటు: ₹600.00 / రోజు",
    step2Title: "సులభమైన బటన్లు",
    command1: "1. 📌 హాజరు వేయండి",
    command1Desc: "హాజరు నమోదు చేసి ₹600 లాక్ చేయండి",
    command2: '2. 📊 లెక్క (Hisaab)',
    command2Desc: "పని చేసిన రోజులు & మొత్తం డబ్బు చూడండి",
    command3: '3. 🚨 ఫిర్యాదు (Complaint)',
    command3Desc: "వేతనం చెల్లించకపోతే ఫిర్యాదు చేయండి",
    command4: '4. 📜 వేతన నియమాలు (Rate)',
    command4Desc: "కనీస వేతన చట్టపరమైన నియమాలు",
    command5: '5. 📞 ఉచిత సహాయం (Help)',
    command5Desc: "కార్మిక హెల్ప్‌లైన్ నంబర్లు",
    command6: '6. 📍 పని ప్రదేశం (Site)',
    command6Desc: "పని స్థలాన్ని మార్చండి",
    step3Title: "లైవ్ మెసేజ్ టేప్",
    testWebhookPost: "పరీక్షించండి:",
    testPinBtn: "హాజరు",
    testHisaabBtn: "లెక్క చూడండి",
    testDisputeBtn: "ఫిర్యాదు చేయండి",
    copiedLabel: "కాపీ చేయబడింది!",

    dossierSection: "కార్మికుల జాబితా",
    commandControls: "శోధించండి & నియంత్రించండి",
    workerDossierSelect: "కార్మికుడిని ఎంచుకోండి:",
    allLaborersOption: "అందరూ కార్మికులు (అందరి వివరాలు)",
    enrolledCount: "కార్మికులు",
    dispatchGpsPinBtn: "📌 హాజరు నమోదు చేయండి (₹600)",
    regulationInstructions: "ఎలా ఉపయోగించాలి (సులభ నియమాలు):",
    urgentStamp: "ముఖ్యమైనది",
    instStep1: "మీ ఫోన్ నంబర్‌ను ఎంచుకోండి లేదా కొత్త నంబర్ నమోదు చేయండి.",
    instStep2: "పని స్థలాన్ని ఎంచుకోండి లేదా GPS ఆన్ చేయండి.",
    instStep3: "'హాజరు వేయండి' నొక్కండి మరియు వెంటనే ₹600 రసీదు పొందండి.",
    connectLiveWhatsapp: "టెర్మినల్ తెరవండి",
    directWorkerChatLabel: "ఫోన్ నంబర్ ద్వారా కార్మికుడిని వెతకండి:",
    chatBtn: "వెతకండి",
    resetArchivedBtn: "నమూనా రికార్డులకు రీసెట్ చేయండి",

    tab1Title: "నమోదైన కార్మికులు",
    tab1Badge: "యాక్టివ్",
    tab1Desc: "రిజిస్టర్‌లో నమోదైన కార్మికులు",
    tab1Foot: "✓ జీపీఎస్ లొకేషన్ ద్వారా ధృవీకరించబడింది",
    tab2Title: "పని చేసిన రోజులు",
    tab2Badge: "నమోదైనవి",
    tab2Desc: "పూర్తి చేసిన పని దినాల సంఖ్య",
    tab2Foot: "రేటు: రోజుకు ₹600.00",
    tab3Title: "మొత్తం సంపాదించిన డబ్బు",
    tab3Badge: "హామీ ఇవ్వబడింది",
    tab3Desc: "కార్మికులు సంపాదించిన మొత్తం వేతనం",
    tab3Foot: "✓ వేతన దోపిడీకి వ్యతిరేకంగా పూర్తి రక్షణ",

    workerProfileNotice: "ఏ కార్మికుడి పని రోజులు, సంపాదన మరియు రసీదులను చూడాలన్నా క్రింది జాబితా నుండి ఎంచుకోండి.",
    individualDossierBadge: "కార్మిక పాస్‌బుక్",
    verifiedBadge: "ధృవీకరించిన రికార్డు",
    laborerDossierTitle: "కార్మికుడి ఖాతా:",
    dossierSubtitle: "హాజరు మరియు వేతనాల అధికారిక రికార్డు",
    exportAuditBtn: "రికార్డు డౌన్‌లోడ్ చేయండి (.txt)",
    verifiedDays: "పని చేసిన రోజులు",
    entitledCapital: "మొత్తం సంపాదన",
    mandatedRate: "రోజువారీ రేటు",
    legalStanding: "హోదా",
    immutableStanding: "ఖచ్చితమైనది (పక్కా)",
    timelineTitle: "పని చేసిన రోజుల క్యాలెండర్",
    consecutivePeriods: "రోజులు",
    timelineNote: "రసీదు చూడటానికి మరియు ప్రింట్ చేయడానికి ఏ రోజు బార్ పైనైనా క్లిక్ చేయండి.",
    individualSlipsTitle: "రోజువారీ వేతన రసీదులు:",
    receiptSlipBtn: "రసీదు చూడండి",

    mapChartTitle: "పని స్థలాల మ్యాప్",
    surveyPlotBadge: "మ్యాప్",
    mapChartSubtitle: "కార్మికులు హాజరు వేసిన ప్రదేశాలు",
    plottedStationsCount: "నమోదైన ప్రదేశాలు",
    activePinLabel: "పని ప్రదేశం",
    surveyScaleLabel: "ధృవీకరించిన జీపీఎస్",
    gpsProtocolActive: "లైవ్ జీపీఎస్",
    selectedLabel: "ఎంపిక చేసిన కార్మికుడు",
    viewVoucherBtn: "రసీదు చూడండి",

    musterScheduleTitle: "రోజువారీ హాజరు రిజిస్టర్",
    officialRegisterBadge: "అధికారిక జాబితా",
    ledgerSubtitle: "ప్రతి కార్మికుడి హాజరు మరియు రసీదుల పూర్తి వివరాలు",
    filterPlaceholder: "ఫోన్ నంబర్ లేదా స్థలం పేరుతో వెతకండి...",
    oldestBtn: "పాతవి మొదట",
    newestBtn: "కొత్తవి మొదట",
    exportCsvBtn: "ఎక్సెల్ / సీఎస్వీ డౌన్‌లోడ్",
    thDocketToken: "రసీదు నంబర్",
    thDateTime: "తేదీ & సమయం",
    thWorkerPhone: "కార్మికుడి ఫోన్",
    thGpsCoords: "లొకేషన్ జీపీఎస్",
    thLocationSite: "పని ప్రదేశం",
    thWageInr: "రోజువారీ వేతనం",
    thStanding: "హోదా",
    thSlip: "రసీదు",
    emptyLedgerText: "ఇంకా ఎటువంటి హాజరు నమోదు కాలేదు.",

    receiptModalHeader: "భారత ప్రభుత్వం • కార్మిక హక్కుల రక్షణ",
    dailyWageProofTitle: "అధికారిక వేతన రసీదు (OFFICIAL WAGE SLIP)",
    satelliteSystemNote: "పని చేసిన రోజుకు చట్టపరమైన రుజువు మరియు ₹600.00 వేతన హక్కు",
    sealSatyameva: "సత్యమేవ జయతే",
    sealImmutable: "తిరస్కరించలేనిది",
    receiptDocketToken: "రసీదు సంఖ్య",
    receiptWorkerPhone: "కార్మికుడి ఫోన్ నంబర్",
    receiptDateTime: "తేదీ మరియు సమయం",
    receiptGpsCoords: "పని ప్రదేశం జీపీఎస్",
    receiptSatelliteVerified: "ధృవీకరించిన లొకేషన్",
    receiptFieldSite: "పని ప్రదేశం వివరాలు",
    receiptStatutoryWage: "నేటి వేతనం",
    legalProtectionNoticeTitle: "చట్టపరమైన రక్షణ హామీ",
    legalProtectionNoticeBody: "మీరు ఈ రోజు పనిచేశారని చెప్పడానికి ఈ రసీదు చట్టపరమైన రుజువు. కాంట్రాక్టర్ మీ ₹600 వేతనాన్ని ఇవ్వడానికి నిరాకరిస్తే, వెంటనే దీన్ని కార్మిక న్యాయస్థానం లేదా యూనియన్‌కు చూపించండి.",
    officerSignatureLabel: "సాక్షి సంతకం",
    sealAffixedLabel: "అధికారిక ముద్ర",
    copyTranscriptBtn: "వివరాలను కాపీ చేయండి",
    printBtn: "రసీదు ప్రింట్ చేయండి",
    dismissBtn: "మూసివేయండి",

    telexTerminalTitle: "ఫీల్డ్ టెలిగ్రాఫ్ డెస్క్",
    deterministicStamp: "100% నమ్మకమైనది",
    musterLineId: "కార్మికుడి మొబైల్ నంబర్",
    telegraphTranscriptHeader: "అధికారిక హాజరు రికార్డు",
    transmitterWorker: "కార్మికుడు",
    expertEngine: "శ్రమిక్ సాక్షి వ్యవస్థ",
    satelliteGpsBroadcast: "లొకేషన్ నమోదైంది:",
    macroMenu: "0. మెనూ (Menu)",
    macroHisaab: "2. లెక్క (Hisaab)",
    macroShikayat: "3. ఫిర్యాదు (Complaint)",
    macroRate: "4. నియమాలు (Rate)",
    macroHelp: "5. సహాయం (Help)",
    broadcastPinBtn: "హాజరు వేయండి",
    typeCommandPlaceholder: "లెక్క కోసం '2', ఫిర్యాదు కోసం '3' టైప్ చేయండి...",
    sendBtn: "పంపండి",

    footerActTitle: "శ్రమిక్ సాక్షి • అసంఘటిత కార్మికుల రోజువారీ వేతన రక్షణ పాస్‌బుక్",
    footerNodeNote: "[ అధికారిక రిజిస్టర్ • 100% పక్కా రికార్డు ]",

    tabAllInOne: "అన్నీ (All)",
    tabMarkAttendance: "హాజరు నమోదు (Mark Attendance)",
    tabAttendanceList: "హాజరు పట్టిక (Register)",
    tabWorkerPassbook: "కార్మికుల పాస్‌ಬುక్ (Passbook)",
    tabWorkMap: "పని మ్యాప్ (Map)",
  },

  ta: {
    // Tamil
    gazetteDocNo: "தொழிலாளர் கூலி பாஸ்புக்",
    commandDeskSubtitle: "ஒவ்வொரு தொழிலாளிக்கும் தினசரி வருகை மற்றும் சம்பளப் புத்தகம்",
    verificationAct: "தினசரி குறைந்தபட்ச கூலி: ₹600 / நாள்",
    appTitle: "ஷ்ரமிக் சாக்ஷி • தொழிலாளர் கணக்கு",
    immutableLedgerBadge: "100% பாதுகாப்பானது",
    appDescription: "ஒவ்வொரு தொழிலாளிக்கும் முழு கூலி கிடைக்க வேண்டும். 1 கிளிக்கில் வருகை பதிவு செய்து, அதிகாரப்பூர்வ ரசீதைப் பெறுங்கள் மற்றும் உங்கள் மொத்த வருமானத்தை எளிதாகப் பாருங்கள்.",
    syncRegisterBtn: "பதிவேட்டை புதுப்பிக்கவும்",
    telexConsoleBtn: "முழு டெர்மினல்",
    wireStatus: "நிலை: ஆன்லைன் & தயார்",
    joinCodeLabel: "கூலி: ₹600.00 / நாள்",
    statutoryWageLabel: "தினசரி கூலி: ₹600.00",
    evidenceLabel: "வேலையின் அதிகாரப்பூர்வ சான்று",
    languageSelectLabel: "மொழி",

    teletypeStationTitle: "இன்றைய வருகையைப் பதிவு செய்க (Mark Attendance)",
    teletypeStationSubtitle: "1 கிளிக்கில் வருகையைப் பதிவு செய்து அதிகாரப்பூர்வ கூலி ரசீதைப் பெறுங்கள்",
    preAiBadge: "100% நம்பகமானது • தவறுகளற்றது",
    step1Title: "1. தொலைபேசி எண் மற்றும் வேலை இடத்தை தேர்வு செய்யவும்",
    step1Desc: "தொலைபேசி எண்ணை உள்ளிட்டு வேலை இடத்தை தேர்வு செய்யவும்:",
    scanWithCamera: "இடம் தயார்",
    openWhatsappWeb: "வருகை பதிவு செய்க",
    nodeNumberLabel: "அரசு கூலி: ₹600.00 / நாள்",
    step2Title: "எளிய முக்கிய பொத்தான்கள்",
    command1: "1. 📌 வருகை பதிவு செய்க",
    command1Desc: "வருகையைப் பதிவு செய்து ₹600 உறுதி செய்க",
    command2: '2. 📊 கணக்கு (Hisaab)',
    command2Desc: "வேலை செய்த நாட்கள் மற்றும் மொத்த பணம்",
    command3: '3. 🚨 புகார் (Complaint)',
    command3Desc: "கூலி தரவில்லை என்றால் புகார் செய்க",
    command4: '4. 📜 கூலி விதிகள் (Rate)',
    command4Desc: "குறைந்தபட்ச கூலி சட்ட விதிகள்",
    command5: '5. 📞 இலவச உதவி (Help)',
    command5Desc: "தொழிலாளர் உதவி எண்கள்",
    command6: '6. 📍 வேலை இடம் (Site)',
    command6Desc: "வேலை இடத்தை மாற்றவும்",
    step3Title: "நேரடி செய்தி பதிவு",
    testWebhookPost: "சோதிக்கவும்:",
    testPinBtn: "வருகை",
    testHisaabBtn: "கணக்கு பார்க்க",
    testDisputeBtn: "புகார் செய்ய",
    copiedLabel: "நகலெடுக்கப்பட்டது!",

    dossierSection: "தொழிலாளர்கள் பட்டியல்",
    commandControls: "தேடல் மற்றும் கட்டுப்பாடு",
    workerDossierSelect: "தொழிலாளியை தேர்வு செய்க:",
    allLaborersOption: "அனைத்து தொழிலாளர்கள் (அனைத்து விவரம்)",
    enrolledCount: "தொழிலாளர்கள்",
    dispatchGpsPinBtn: "📌 வருகை பதிவு செய்க (₹600)",
    regulationInstructions: "பயன்படுத்துவது எப்படி (எளிய விதிகள்):",
    urgentStamp: "முக்கியமானது",
    instStep1: "உங்கள் தொலைபேசி எண்ணை தேர்வு செய்க அல்லது புதிய எண்ணை உள்ளிடவும்.",
    instStep2: "பட்டியலில் இருந்து வேலை இடத்தை தேர்வு செய்க அல்லது GPS இயக்கவும்.",
    instStep3: "'வருகை பதிவு செய்க' அழுத்தி உடனே ₹600 ரசீதைப் பெறவும்.",
    connectLiveWhatsapp: "டெர்மினலைத் திறக்கவும்",
    directWorkerChatLabel: "தொலைபேசி எண் மூலம் தொழிலாளியைத் தேடுக:",
    chatBtn: "தேடுக",
    resetArchivedBtn: "மாதிரி பதிவுகளுக்கு மீட்டமைக்கவும்",

    tab1Title: "பதிவுசெய்த தொழிலாளர்கள்",
    tab1Badge: "செயலில்",
    tab1Desc: "பதிவேட்டில் உள்ள தொழிலாளர்கள்",
    tab1Foot: "✓ ஜிபிஎஸ் இடம் மூலம் சரிபார்க்கப்பட்டது",
    tab2Title: "வேலை செய்த நாட்கள்",
    tab2Badge: "பதிவானது",
    tab2Desc: "முழுமையாக வேலை செய்த நாட்கள்",
    tab2Foot: "விகிதம்: ஒரு நாளைக்கு ₹600.00",
    tab3Title: "மொத்த சம்பாதித்த பணம்",
    tab3Badge: "உறுதியானது",
    tab3Desc: "தொழிலாளர்கள் சம்பாதித்த மொத்த கூலி",
    tab3Foot: "✓ கூலி திருட்டுக்கு எதிராக முழு சட்டப் பாதுகாப்பு",

    workerProfileNotice: "எந்தவொரு தொழிலாளியின் வேலை நாட்கள், வருமானம் மற்றும் ரசீதுகளைப் பார்க்க கீழே உள்ள பட்டியலில் இருந்து தேர்வு செய்யவும்.",
    individualDossierBadge: "தொழிலாளர் பாஸ்புக்",
    verifiedBadge: "சரிபார்க்கப்பட்ட பதிவு",
    laborerDossierTitle: "தொழிலாளர் கணக்கு:",
    dossierSubtitle: "வருகை மற்றும் ஊதியத்தின் அதிகாரப்பூர்வ பதிவு",
    exportAuditBtn: "பதிவை பதிவிறக்கவும் (.txt)",
    verifiedDays: "வேலை செய்த நாட்கள்",
    entitledCapital: "மொத்த வருமானம்",
    mandatedRate: "தினசரி கூலி",
    legalStanding: "நிலை",
    immutableStanding: "உறுதியானது (பக்கா)",
    timelineTitle: "வேலை நாட்களின் காலண்டர்",
    consecutivePeriods: "நாட்கள்",
    timelineNote: "அதிகாரப்பூர்வ ரசீதைப் பார்க்க மற்றும் அச்சிட எந்தவொரு நாள் பட்டியிலும் கிளிக் செய்யவும்.",
    individualSlipsTitle: "தினசரி கூலி ரசீதுகள்:",
    receiptSlipBtn: "ரசீதை பார்க்க",

    mapChartTitle: "வேலை இடங்களின் வரைபடம்",
    surveyPlotBadge: "வரைபடம்",
    mapChartSubtitle: "தொழிலாளர்கள் வருகை பதிவு செய்த இடங்கள்",
    plottedStationsCount: "பதிவான இடங்கள்",
    activePinLabel: "வேலை இடம்",
    surveyScaleLabel: "சரிபார்க்கப்பட்ட ஜிபிஎஸ்",
    gpsProtocolActive: "நேரடி ஜிபிஎஸ்",
    selectedLabel: "தேர்வுசெய்த தொழிலாளி",
    viewVoucherBtn: "ரசீதை பார்க்க",

    musterScheduleTitle: "தினசரி வருகை பதிவேடு",
    officialRegisterBadge: "அதிகாரப்பூர்வ பட்டியல்",
    ledgerSubtitle: "ஒவ்வொரு தொழிலாளியின் வருகை மற்றும் ரசீதுகளின் முழு விவரம்",
    filterPlaceholder: "தொலைபேசி எண் அல்லது இடத்தின் பெயரை உள்ளிட்டு தேடவும்...",
    oldestBtn: "பழையது முதலில்",
    newestBtn: "புதியது முதலில்",
    exportCsvBtn: "எக்செல் / சிஎஸ்வி பதிவிறக்கம்",
    thDocketToken: "ரசீது எண்",
    thDateTime: "தேதி & நேரம்",
    thWorkerPhone: "தொழிலாளர் போன்",
    thGpsCoords: "ஜிபிஎஸ் இடம்",
    thLocationSite: "வேலை இடம்",
    thWageInr: "தினசரி கூலி",
    thStanding: "நிலை",
    thSlip: "ரசீது",
    emptyLedgerText: "இதுவரை எந்த வருகையும் பதிவாகவில்லை.",

    receiptModalHeader: "இந்திய அரசு • தொழிலாளர் உரிமைப் பாதுகாப்பு",
    dailyWageProofTitle: "அதிகாரப்பூர்வ கூலி ரசீது (OFFICIAL WAGE SLIP)",
    satelliteSystemNote: "வேலை செய்த நாளுக்கான சட்டப்பூர்வ சான்று மற்றும் ₹600.00 கூலி உரிமை",
    sealSatyameva: "வாய்மையே வெல்லும்",
    sealImmutable: "மறுக்க முடியாது",
    receiptDocketToken: "ரசீது எண்",
    receiptWorkerPhone: "தொழிலாளர் தொலைபேசி எண்",
    receiptDateTime: "தேதி மற்றும் நேரம்",
    receiptGpsCoords: "வேலை இடத்தின் ஜிபிஎஸ்",
    receiptSatelliteVerified: "சரிபார்க்கப்பட்ட இடம்",
    receiptFieldSite: "வேலை இடத்தின் விவரம்",
    receiptStatutoryWage: "இன்றைய கூலி",
    legalProtectionNoticeTitle: "சட்டப் பாதுகாப்பு உத்தரவாதம்",
    legalProtectionNoticeBody: "நீங்கள் இன்று வேலை செய்தீர்கள் என்பதற்கு இந்த ரசீது சட்டப்பூர்வ சான்றாகும். ஒப்பந்ததாரர் உங்கள் ₹600 கூலியைத் தர மறுத்தால் அல்லது பிடித்தம் செய்தால், இதை உடனடியாக தொழிலாளர் நீதிமன்றம் அல்லது தொழிற்சங்கத்தில் காண்பிக்கவும்.",
    officerSignatureLabel: "சாட்சி கையொப்பம்",
    sealAffixedLabel: "அதிகாரப்பூர்வ முத்திரை",
    copyTranscriptBtn: "விவரங்களை நகலெடு",
    printBtn: "ரசீதை அச்சிடு (Print)",
    dismissBtn: "மூடு (Close)",

    telexTerminalTitle: "பீல்ட் டெலிகிராப் டெஸ்க்",
    deterministicStamp: "100% நம்பகமானது",
    musterLineId: "தொழிலாளர் தொலைபேசி எண்",
    telegraphTranscriptHeader: "அதிகாரப்பூர்வ வருகை பதிவு",
    transmitterWorker: "தொழிலாளி",
    expertEngine: "ஷ்ரமிக் சாக்ஷி அமைப்பு",
    satelliteGpsBroadcast: "இடம் பதிவானது:",
    macroMenu: "0. மெனு (Menu)",
    macroHisaab: "2. கணக்கு (Hisaab)",
    macroShikayat: "3. புகார் (Complaint)",
    macroRate: "4. விதிகள் (Rate)",
    macroHelp: "5. உதவி (Help)",
    broadcastPinBtn: "வருகை பதிவு செய்க",
    typeCommandPlaceholder: "கணக்குக்கு '2', புகாருக்கு '3' என உள்ளிடவும்...",
    sendBtn: "அனுப்பு",

    footerActTitle: "ஷ்ரமிக் சாக்ஷி • அமைப்புசாரா தொழிலாளர்களுக்கான தினசரி கூலிப் பாதுகாப்பு பாஸ்புக்",
    footerNodeNote: "[ அதிகாரப்பூர்வ பதிவேடு • 100% பக்கா பதிவு ]",

    tabAllInOne: "அனைத்தும் (All)",
    tabMarkAttendance: "வருகை பதிவு (Mark Attendance)",
    tabAttendanceList: "வருகை பட்டியல் (Register)",
    tabWorkerPassbook: "தொழிலாளர் பாஸ்புக் (Passbook)",
    tabWorkMap: "வேலை வரைபடம் (Map)",
  },

  ml: {
    // Malayalam
    gazetteDocNo: "തൊഴിലാളി വേതന പാസ്ബുക്ക്",
    commandDeskSubtitle: "ഓരോ തൊഴിലാളിക്കും ദൈനംദിന ഹാജരും വരുമാനവും രേഖപ്പെടുത്തുന്ന പുസ്തകം",
    verificationAct: "ദിവസേനയുള്ള കുറഞ്ഞ വേതനം: ₹600 / ദിവസം",
    appTitle: "ശ്രമിക് സാക്ഷി • തൊഴിലാളി അക്കൗണ്ട്",
    immutableLedgerBadge: "100% സുരക്ഷിതം",
    appDescription: "ഓരോ തൊഴിലാളിക്കും അർഹമായ മുഴുവൻ വേതനവും ലഭിക്കണം. 1 ക്ലിക്കിലൂടെ ഹാജർ രേഖപ്പെടുത്തുക, ഔദ്യോഗിക വേതന രസീത് നേടുക, ആകെ വരുമാനം പരിശോധിക്കുക.",
    syncRegisterBtn: "രജിസ്റ്റർ പുതുക്കുക",
    telexConsoleBtn: "പൂർണ്ണ ടെർമിനൽ",
    wireStatus: "നില: ഓൺലൈൻ & സജ്ജം",
    joinCodeLabel: "നിരക്ക്: ₹600.00 / ദിവസം",
    statutoryWageLabel: "ദിവസക്കൂലി: ₹600.00",
    evidenceLabel: "ജോലിയുടെ ഔദ്യോഗിക തെളിവ്",
    languageSelectLabel: "ഭാഷ",

    teletypeStationTitle: "ഇന്നത്തെ ഹാജർ രേഖപ്പെടുത്തുക (Mark Attendance)",
    teletypeStationSubtitle: "ഒരൊറ്റ ക്ലിക്കിൽ ഹാജർ രേഖപ്പെടുത്തി ഔദ്യോഗിക കൂലി രസീത് നേടുക",
    preAiBadge: "100% വിശ്വസനീയം • തെറ്റുകളില്ലാത്തത്",
    step1Title: "1. ഫോൺ നമ്പറും ജോലി സ്ഥലവും തിരഞ്ഞെടുക്കുക",
    step1Desc: "ഫോൺ നമ്പർ നൽകി ജോലി ചെയ്യുന്ന സ്ഥലം തിരഞ്ഞെടുക്കുക:",
    scanWithCamera: "ലൊക്കേഷൻ തയ്യാർ",
    openWhatsappWeb: "ഹാജർ രേഖപ്പെടുത്തുക",
    nodeNumberLabel: "സർക്കാർ നിരക്ക്: ₹600.00 / ദിവസം",
    step2Title: "എളുപ്പമുള്ള ബട്ടണുകൾ",
    command1: "1. 📌 ഹാജർ രേഖപ്പെടുത്തുക",
    command1Desc: "ഹാജർ രേഖപ്പെടുത്തി ₹600 ഉറപ്പാക്കുക",
    command2: '2. 📊 കണക്ക് (Hisaab)',
    command2Desc: "ജോലി ചെയ്ത ദിവസങ്ങളും ആകെ വരുമാനവും",
    command3: '3. 🚨 പരാതി (Complaint)',
    command3Desc: "കൂലി തടഞ്ഞുവെച്ചാൽ പരാതി നൽകുക",
    command4: '4. 📜 വേതന നിയമങ്ങൾ (Rate)',
    command4Desc: "കുറഞ്ഞ വേതന നിയമ വിവരങ്ങൾ",
    command5: '5. 📞 സൗജന്യ സഹായം (Help)',
    command5Desc: "തൊഴിലാളി ഹെൽപ്പ്‌ലൈൻ നമ്പറുകൾ",
    command6: '6. 📍 ജോലി സ്ഥലം (Site)',
    command6Desc: "ജോലി സ്ഥലം മാറ്റുക",
    step3Title: "തത്സമയ സന്ദേശ ടേപ്പ്",
    testWebhookPost: "പരിശോധിക്കുക:",
    testPinBtn: "ഹാജർ",
    testHisaabBtn: "കണക്ക് നോക്കുക",
    testDisputeBtn: "പരാതി നൽകുക",
    copiedLabel: "പകർത്തി!",

    dossierSection: "തൊഴിലാളികളുടെ പട്ടിക",
    commandControls: "തിരയലും നിയന്ത്രണവും",
    workerDossierSelect: "തൊഴിലാളിയെ തിരഞ്ഞെടുക്കുക:",
    allLaborersOption: "എല്ലാ തൊഴിലാളികളും (മുഴുവൻ വിവരങ്ങൾ)",
    enrolledCount: "തൊഴിലാളികൾ",
    dispatchGpsPinBtn: "📌 ഹാജർ രേഖപ്പെടുത്തുക (₹600)",
    regulationInstructions: "എങ്ങനെ ഉപയോഗിക്കാം (ലളിതമായ നിയമങ്ങൾ):",
    urgentStamp: "പ്രധാനം",
    instStep1: "നിങ്ങളുടെ ഫോൺ നമ്പർ തിരഞ്ഞെടുക്കുക അല്ലെങ്കിൽ പുതിയ നമ്പർ നൽകുക.",
    instStep2: "ജോലി സ്ഥലം തിരഞ്ഞെടുക്കുക അല്ലെങ്കിൽ GPS ഓണാക്കുക.",
    instStep3: "'ഹാജർ രേഖപ്പെടുത്തുക' അമർത്തി ഉടൻ ₹600 രസീത് നേടുക.",
    connectLiveWhatsapp: "ടെർമിനൽ തുറക്കുക",
    directWorkerChatLabel: "ഫോൺ നമ്പർ വഴി തൊഴിലാളിയെ തിരയുക:",
    chatBtn: "തിരയുക",
    resetArchivedBtn: "സാമ്പിൾ രേഖകളിലേക്ക് പുനഃസ്ഥാപിക്കുക",

    tab1Title: "രജിസ്റ്റർ ചെയ്ത തൊഴിലാളികൾ",
    tab1Badge: "സജീവം",
    tab1Desc: "രജിസ്റ്ററിലുള്ള തൊഴിലാളികൾ",
    tab1Foot: "✓ ജിപിഎസ് ലൊക്കേഷൻ വഴി സ്ഥിരീകരിച്ചു",
    tab2Title: "ജോലി ചെയ്ത ദിവസങ്ങൾ",
    tab2Badge: "രേഖപ്പെടുത്തി",
    tab2Desc: "പൂർത്തിയാക്കിയ ജോലി ദിനങ്ങൾ",
    tab2Foot: "നിരക്ക്: ദിവസേന ₹600.00",
    tab3Title: "ആകെ സമ്പാദിച്ച തുക",
    tab3Badge: "ഗ്യാരന്റി",
    tab3Desc: "തൊഴിലാളികൾ സമ്പാദിച്ച ആകെ വേതനം",
    tab3Foot: "✓ വേതന മോഷണത്തിനെതിരെ പൂർണ്ണ നിയമ പരിരക്ഷ",

    workerProfileNotice: "ഏതെങ്കിലും തൊഴിലാളിയുടെ ജോലി ദിവസങ്ങൾ, വരുമാനം, രസീതുകൾ എന്നിവ കാണാൻ താഴെയുള്ള പട്ടികയിൽ നിന്ന് തിരഞ്ഞെടുക്കുക.",
    individualDossierBadge: "തൊഴിലാളി പാസ്ബുക്ക്",
    verifiedBadge: "സ്ഥിരീകരിച്ച രേഖ",
    laborerDossierTitle: "തൊഴിലാളി അക്കൗണ്ട്:",
    dossierSubtitle: "ഹാജരും വേതനവും സംബന്ധിച്ച ഔദ്യോഗിക രേഖ",
    exportAuditBtn: "രേഖ ഡൗൺലോഡ് ചെയ്യുക (.txt)",
    verifiedDays: "ജോലി ചെയ്ത ദിവസങ്ങൾ",
    entitledCapital: "ആകെ വരുമാനം",
    mandatedRate: "ദിവസക്കൂലി",
    legalStanding: "പദവി",
    immutableStanding: "ഗ്യാരന്റി (പക്കാ)",
    timelineTitle: "ജോലി ദിവസങ്ങളുടെ കലണ്ടർ",
    consecutivePeriods: "ദിവസങ്ങൾ",
    timelineNote: "ഔദ്യോഗിക രസീത് കാണാനും അച്ചടിക്കാനും ഏതെങ്കിലും ദിവസ ബാറിൽ ക്ലിക്കുചെയ്യുക.",
    individualSlipsTitle: "ദൈനംദിന വേതന രസീതുകൾ:",
    receiptSlipBtn: "രസീത് കാണുക",

    mapChartTitle: "ജോലി സ്ഥലങ്ങളുടെ ഭൂപടം",
    surveyPlotBadge: "ഭൂപടം",
    mapChartSubtitle: "തൊഴിലാളികൾ ഹാജർ രേഖപ്പെടുത്തിയ സ്ഥലങ്ങൾ",
    plottedStationsCount: "രേഖപ്പെടുത്തിയ സ്ഥലങ്ങൾ",
    activePinLabel: "ജോലി സ്ഥലം",
    surveyScaleLabel: "സ്ഥിരീകരിച്ച ജിപിഎസ്",
    gpsProtocolActive: "ലൈവ് ജിപിഎസ്",
    selectedLabel: "തിരഞ്ഞെടുത്ത തൊഴിലാളി",
    viewVoucherBtn: "രസീത് കാണുക",

    musterScheduleTitle: "ദൈനംദിന ഹാജർ രജിസ്റ്റർ",
    officialRegisterBadge: "ഔദ്യോഗിക പട്ടിക",
    ledgerSubtitle: "ഓരോ തൊഴിലാളിയുടെയും ഹാജരും വേതന രസീതുകളും അടങ്ങിയ പൂർണ്ണ വിവരങ്ങൾ",
    filterPlaceholder: "ഫോൺ നമ്പറോ സ്ഥലപ്പേരോ നൽകി തിരയുക...",
    oldestBtn: "പഴയത് ആദ്യം",
    newestBtn: "പുതിയത് ആദ്യം",
    exportCsvBtn: "എക്സൽ / സിഎസ്വി ഡൗൺലോഡ്",
    thDocketToken: "രസീത് നമ്പർ",
    thDateTime: "തീയതിയും സമയവും",
    thWorkerPhone: "തൊഴിലാളിയുടെ ഫോൺ",
    thGpsCoords: "ലൊക്കേഷൻ ജിപിഎസ്",
    thLocationSite: "ജോലി സ്ഥലം",
    thWageInr: "ദിവസക്കൂലി",
    thStanding: "പദവി",
    thSlip: "രസീത്",
    emptyLedgerText: "ഇതുവരെ ഹാജർ രേഖപ്പെടുത്തിയിട്ടില്ല.",

    receiptModalHeader: "ഭാരത സർക്കാർ • തൊഴിലാളി അവകാശ സംരക്ഷണം",
    dailyWageProofTitle: "ഔദ്യോഗിക വേതന രസീത് (OFFICIAL WAGE SLIP)",
    satelliteSystemNote: "ജോലി ചെയ്ത ദിവസത്തെ നിയമപരമായ തെളിവും ₹600.00 വേതനാവകാശവും",
    sealSatyameva: "സത്യമേവ ജയതേ",
    sealImmutable: "തള്ളിക്കളയാനാവില്ല",
    receiptDocketToken: "രസീത് നമ്പർ",
    receiptWorkerPhone: "തൊഴിലാളിയുടെ ഫോൺ നമ്പർ",
    receiptDateTime: "തീയതിയും സമയവും",
    receiptGpsCoords: "ജോലി സ്ഥലത്തെ ജിപിഎസ്",
    receiptSatelliteVerified: "സ്ഥിരീകരിച്ച സ്ഥലം",
    receiptFieldSite: "ജോലി സ്ഥലത്തിന്റെ വിവരണം",
    receiptStatutoryWage: "ഇന്നത്തെ വേതനം",
    legalProtectionNoticeTitle: "നിയമപരമായ സുരക്ഷാ ഉറപ്പ്",
    legalProtectionNoticeBody: "നിങ്ങൾ ഇന്ന് ജോലി ചെയ്തു എന്നതിനുള്ള നിയമപരമായ തെളിവാണ് ഈ രസീത്. കരാറുകാരൻ നിങ്ങളുടെ ₹600 വേതനം നൽകാതിരിക്കുകയോ കുറയ്ക്കുകയോ ചെയ്താൽ, ഉടൻ ഇത് ലേബർ കോടതിയിലോ യൂണിയനിലോ കാണിക്കുക.",
    officerSignatureLabel: "സാക്ഷി ഒപ്പ്",
    sealAffixedLabel: "ഔദ്യോഗിക മുദ്ര",
    copyTranscriptBtn: "വിവരങ്ങൾ പകർത്തുക",
    printBtn: "രസീത് അച്ചടിക്കുക (Print)",
    dismissBtn: "അടയ്ക്കുക (Close)",

    telexTerminalTitle: "ഫീൽഡ് ടെലിഗ്രാഫ് ഡെസ്ക്",
    deterministicStamp: "100% വിശ്വസനീയം",
    musterLineId: "തൊഴിലാളിയുടെ മൊബൈൽ നമ്പർ",
    telegraphTranscriptHeader: "ഔദ്യോഗിക ഹാജർ രേഖ",
    transmitterWorker: "തൊഴിലാളി",
    expertEngine: "ശ്രമിക് സാക്ഷി സംവിധാനം",
    satelliteGpsBroadcast: "സ്ഥലം രേഖപ്പെടുത്തി:",
    macroMenu: "0. മെനു (Menu)",
    macroHisaab: "2. കണക്ക് (Hisaab)",
    macroShikayat: "3. പരാതി (Complaint)",
    macroRate: "4. നിരക്ക് (Rate)",
    macroHelp: "5. സഹായം (Help)",
    broadcastPinBtn: "ഹാജർ രേഖപ്പെടുത്തുക",
    typeCommandPlaceholder: "കണക്കിന് '2', പരാതിക്ക് '3' എന്ന് ടൈപ്പ് ചെയ്യുക...",
    sendBtn: "അയക്കുക",

    footerActTitle: "ശ്രമിക് സാക്ഷി • അസംഘടിത തൊഴിലാളികൾക്കുള്ള ദൈനംദിന വേതന സംരക്ഷണ പാസ്ബുക്ക്",
    footerNodeNote: "[ ഔദ്യോഗിക രജിസ്റ്റർ • 100% ഉറപ്പുള്ള രേഖ ]",

    tabAllInOne: "എല്ലാം (All)",
    tabMarkAttendance: "ഹാജർ രേഖപ്പെടുത്തുക (Mark Attendance)",
    tabAttendanceList: "ഹാജർ പട്ടിക (Register)",
    tabWorkerPassbook: "തൊഴിലാളി പാസ്ബുക്ക് (Passbook)",
    tabWorkMap: "ജോലി ഭൂപടം (Map)",
  },
};
