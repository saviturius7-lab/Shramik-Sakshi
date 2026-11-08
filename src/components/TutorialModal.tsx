import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  HardHat, 
  ClipboardCheck, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ShieldCheck, 
  Lightbulb, 
  ArrowRight,
  Stamp,
  Coins,
  MapPin,
  Clock,
  Radio,
  Sunrise,
  Sunset,
  Scale,
  BookOpen,
  FileCheck2,
  PhoneCall,
  Play,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { TUTORIAL_DATA, TutorialRole, TutorialStep } from '../i18n/tutorialData';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: TutorialRole;
  onNavigateTab: (tab: 'all' | 'attendance' | 'register' | 'worker' | 'map') => void;
  onOpenSimulator?: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'worker',
  onNavigateTab,
  onOpenSimulator,
}) => {
  const { language } = useLanguage();
  const [role, setRole] = useState<TutorialRole>(initialRole);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [guideMode, setGuideMode] = useState<'pictorial' | 'detailed'>('pictorial');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sync role when modal opens or initialRole changes
  useEffect(() => {
    if (isOpen) {
      setRole(initialRole);
      setCurrentStepIndex(0);
      setIsPlayingAudio(false);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen, initialRole]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  // Retrieve current language tutorial data, fallback to English
  const currentLangData = TUTORIAL_DATA[language] || TUTORIAL_DATA.en;
  const currentRoleData = currentLangData[role];
  const steps: TutorialStep[] = currentRoleData.steps;
  const currentStep = steps[currentStepIndex] || steps[0];

  const handleNext = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSelectStep = (idx: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    setCurrentStepIndex(idx);
  };

  const handleActionClick = (step: TutorialStep) => {
    handleClose();
    if (step.actionTab === 'simulator' && onOpenSimulator) {
      onOpenSimulator();
    } else if (step.actionTab && step.actionTab !== 'simulator') {
      onNavigateTab(step.actionTab);
    }
  };

  const toggleAudio = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        window.speechSynthesis.cancel();
        // Prefer empathetic voiceScript specialized for comprehension
        const scriptToRead = currentStep.voiceScript 
          ? `${currentStep.title}. ${currentStep.voiceScript} ${currentStep.tip}`
          : `${currentStep.title}. ${currentStep.description}. ${currentStep.tip}`;

        const utterance = new SpeechSynthesisUtterance(scriptToRead);
        utteranceRef.current = utterance;
        
        // Select matching language voice if available
        const langCodeMap: Record<string, string> = {
          en: 'en-IN',
          hi: 'hi-IN',
          kn: 'kn-IN',
          te: 'te-IN',
          ta: 'ta-IN',
          ml: 'ml-IN',
        };
        utterance.lang = langCodeMap[language] || 'en-US';
        // 0.88x rate ensures clear, calm, slow articulation for unorganized laborers
        utterance.rate = 0.88;
        utterance.pitch = 1.0;

        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);

        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    } else {
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  // Stop speech when modal closes
  const handleClose = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    onClose();
  };

  // Color mapping helpers
  const getColorStyles = (color?: string) => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-[#e8f7ee]',
          border: 'border-[#2d6a4f]',
          badge: 'bg-[#2d6a4f] text-white',
          accentText: 'text-[#2d6a4f]',
          cardGlow: 'shadow-[4px_4px_0px_#2d6a4f]',
          bannerBg: 'bg-[#d8f3dc]',
        };
      case 'red':
        return {
          bg: 'bg-[#fdf0ed]',
          border: 'border-[#c92a2a]',
          badge: 'bg-[#c92a2a] text-white',
          accentText: 'text-[#c92a2a]',
          cardGlow: 'shadow-[4px_4px_0px_#c92a2a]',
          bannerBg: 'bg-[#ffe3e3]',
        };
      case 'gold':
        return {
          bg: 'bg-[#fef9e7]',
          border: 'border-[#b87c24]',
          badge: 'bg-[#b87c24] text-white',
          accentText: 'text-[#8c5912]',
          cardGlow: 'shadow-[4px_4px_0px_#b87c24]',
          bannerBg: 'bg-[#fef3c7]',
        };
      case 'blue':
        return {
          bg: 'bg-[#eef8fc]',
          border: 'border-[#1e7587]',
          badge: 'bg-[#1e7587] text-white',
          accentText: 'text-[#1e7587]',
          cardGlow: 'shadow-[4px_4px_0px_#1e7587]',
          bannerBg: 'bg-[#ccebf0]',
        };
      case 'purple':
        return {
          bg: 'bg-[#fbf2fa]',
          border: 'border-[#792e7c]',
          badge: 'bg-[#792e7c] text-white',
          accentText: 'text-[#792e7c]',
          cardGlow: 'shadow-[4px_4px_0px_#792e7c]',
          bannerBg: 'bg-[#f3d9f3]',
        };
      default:
        return {
          bg: 'bg-[#faf5e8]',
          border: 'border-[#232b28]',
          badge: 'bg-[#1b4332] text-white',
          accentText: 'text-[#1b4332]',
          cardGlow: 'shadow-[4px_4px_0px_#232b28]',
          bannerBg: 'bg-[#eae3d2]',
        };
    }
  };

  const colorStyles = getColorStyles(currentStep.colorCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#232b28]/70 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-[#fffef9] border-[3px] border-[#1c2421] rounded-2xl shadow-[8px_8px_0px_#1c2421] overflow-hidden my-auto max-h-[95vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-modal-title"
      >
        {/* Top Brass Civic Trim */}
        <div className="h-2.5 telegraph-strip border-b-2 border-[#1c2421] shrink-0" />

        {/* Modal Top Bar */}
        <div className="p-3.5 sm:p-5 bg-[#faf5e8] border-b-2 border-[#1c2421] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#1b4332] text-white border-2 border-[#1c2421] rounded-xl shadow-[2px_2px_0px_#1c2421]">
              <Sparkles className="w-5 h-5 text-[#f6d365]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="tutorial-modal-title" className="text-base sm:text-xl font-black text-[#1c2421] tracking-tight">
                  {language === 'hi' ? 'श्रमिक साथी - सम्पूर्ण सचित्र फील्ड गाइड' : 
                   language === 'kn' ? 'ಶ್ರಮಿಕ್ ಸಾಕ್ಷಿ - ಸಂಪೂರ್ಣ ಸಚಿತ್ರ ಮಾರ್ಗದರ್ಶಿ' : 
                   language === 'te' ? 'శ్రామిక్ సాక్షి - చిత్రరూప ఫీల్డ్ గైడ్' : 
                   language === 'ta' ? 'ஷ்ராமிக் சாக்ஷி - முழு விளக்கப்பட வழிகாட்டி' : 
                   language === 'ml' ? 'ശ്രമിക് സാക്ഷി - ചിത്രങ്ങളോടെ ഫീൽഡ് ഗൈഡ്' : 
                   'Worker Companion - Pictorial Field Guide'}
                </h2>
                <span className="rubber-stamp-verified text-[9px] px-1.5 py-0.5 hidden sm:inline-block">
                  ALL LITERACY LEVELS
                </span>
              </div>
              <p className="text-xs text-[#3d5a45] font-bold mt-0.5">
                {language === 'hi' ? 'पढ़ना-लिखना न जानने पर भी अपना पूरा ₹600 मेहनताना सुरक्षित करें' :
                 language === 'kn' ? 'ಓದಲು-ಬರೆಯಲು ಬಾರದಿದ್ದರೂ ನಿಮ್ಮ ಸಂಪೂರ್ಣ ₹600 ದಿನಗೂಲಿಯನ್ನು ಭದ್ರಪಡಿಸಿಕೊಳ್ಳಿ' :
                 language === 'te' ? 'చదవడం రాయడం రాకపోయినా మీ పూర్తి ₹600 వేతనాన్ని సురక్షితం చేసుకోండి' :
                 language === 'ta' ? 'படிக்கத் தெரியாவிட்டாலும் உங்கள் முழு ₹600 கூலியைப் பாதுகாத்துக் கொள்ளுங்கள்' :
                 language === 'ml' ? 'എഴുത്തും വായനയും അറിയില്ലെങ്കിലും നിങ്ങളുടെ മുഴുവൻ ₹600 കൂലിയും സംരക്ഷിക്കുക' :
                 'Zero paperwork. Color-coded steps & voice narration for every daily wage worker.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Read-Aloud Voice Button */}
            <button
              onClick={toggleAudio}
              className={`px-3 py-1.5 rounded-xl border-2 border-[#1c2421] text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#1c2421] transition-all cursor-pointer ${
                isPlayingAudio 
                  ? 'bg-[#c92a2a] text-white animate-pulse' 
                  : 'bg-[#fefdfa] text-[#1c2421] hover:bg-[#f2eada]'
              }`}
              title="Listen to spoken instructions in your language"
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4 text-white" />
                  <span className="font-bold">
                    {language === 'hi' ? 'बोलना बंद करें ⏹️' : 'Stop Speaking ⏹️'}
                  </span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-[#1b4332]" />
                  <span className="font-bold">
                    {language === 'hi' ? 'आवाज़ में सुनें 🔊' : 
                     language === 'kn' ? 'ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ 🔊' : 
                     language === 'te' ? 'వాయిస్ వినండి 🔊' : 
                     language === 'ta' ? 'குரலில் கேளுங்கள் 🔊' : 
                     language === 'ml' ? 'ശബ്ദത്തിൽ കേൾക്കൂ 🔊' : 
                     'Listen Aloud 🔊'}
                  </span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-[#fde4d7] hover:bg-[#fcd0bd] border-2 border-[#1c2421] flex items-center justify-center text-[#1c2421] shadow-[2px_2px_0px_#1c2421] cursor-pointer transition-transform active:scale-95"
              aria-label="Close tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Header: Role Selectors & View Mode Toggle */}
        <div className="px-3 sm:px-6 py-3 bg-[#fdfbf6] border-b-2 border-dashed border-[#1c2421]/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Dual Role Selector Tabs: Worker vs Admin */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRole('worker');
                setCurrentStepIndex(0);
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  setIsPlayingAudio(false);
                }
              }}
              className={`px-3 py-1.5 text-xs sm:text-sm font-black flex items-center gap-2 rounded-xl border-2 border-[#1c2421] transition-all cursor-pointer ${
                role === 'worker'
                  ? 'bg-[#1b4332] text-white shadow-[3px_3px_0px_#1c2421]'
                  : 'bg-[#faf5e8] text-[#1c2421] hover:bg-[#f4ecda] shadow-[1px_1px_0px_#1c2421]'
              }`}
            >
              <HardHat className="w-4 h-4 text-[#f6d365]" />
              <span>{currentLangData.worker.roleTitle}</span>
            </button>

            <button
              onClick={() => {
                setRole('admin');
                setCurrentStepIndex(0);
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  setIsPlayingAudio(false);
                }
              }}
              className={`px-3 py-1.5 text-xs sm:text-sm font-black flex items-center gap-2 rounded-xl border-2 border-[#1c2421] transition-all cursor-pointer ${
                role === 'admin'
                  ? 'bg-[#1e7587] text-white shadow-[3px_3px_0px_#1c2421]'
                  : 'bg-[#faf5e8] text-[#1c2421] hover:bg-[#f4ecda] shadow-[1px_1px_0px_#1c2421]'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>{currentLangData.admin.roleTitle}</span>
            </button>
          </div>

          {/* Guide Mode Toggle: Pictorial Cards vs Detailed Text */}
          <div className="flex items-center gap-1 bg-[#ede8d8] p-1 rounded-xl border border-[#1c2421]">
            <button
              onClick={() => setGuideMode('pictorial')}
              className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                guideMode === 'pictorial' 
                  ? 'bg-white text-[#1c2421] shadow-xs' 
                  : 'text-[#5d6a62] hover:text-[#1c2421]'
              }`}
            >
              {language === 'hi' ? '🎨 सचित्र रूप (Visual Cards)' : '🎨 Pictorial Mode'}
            </button>
            <button
              onClick={() => setGuideMode('detailed')}
              className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                guideMode === 'detailed' 
                  ? 'bg-white text-[#1c2421] shadow-xs' 
                  : 'text-[#5d6a62] hover:text-[#1c2421]'
              }`}
            >
              {language === 'hi' ? '📜 विस्तृत विवरण (Detailed)' : '📜 Detailed Guide'}
            </button>
          </div>
        </div>

        {/* 5-Step Visual Quick Strip (Color Coded Life-Cycle for Workers) */}
        <div className="px-3 sm:px-6 py-2.5 bg-[#faf6ed] border-b-2 border-[#1c2421] overflow-x-auto shrink-0">
          <div className="flex items-center gap-2 min-w-max">
            {steps.map((s, idx) => {
              const isSelected = currentStepIndex === idx;
              const isPassed = currentStepIndex > idx;
              
              // Step specific badges and colors
              let stepLabel = `Step ${s.stepNumber}`;
              let stepIcon = <Clock className="w-3.5 h-3.5" />;
              
              if (s.pictorialIcon === 'morning_in') {
                stepLabel = language === 'hi' ? '१. सुबह काम शुरू 🟢' : '1. Morning IN 🟢';
                stepIcon = <Sunrise className="w-3.5 h-3.5 text-[#2d6a4f]" />;
              } else if (s.pictorialIcon === 'evening_out') {
                stepLabel = language === 'hi' ? '२. शाम काम खत्म 🔴' : '2. Evening OUT 🔴';
                stepIcon = <Sunset className="w-3.5 h-3.5 text-[#c92a2a]" />;
              } else if (s.pictorialIcon === 'slip_stamp') {
                stepLabel = language === 'hi' ? '३. सरकारी रसीद 📜' : '3. Legal Slip 📜';
                stepIcon = <Stamp className="w-3.5 h-3.5 text-[#b87c24]" />;
              } else if (s.pictorialIcon === 'passbook') {
                stepLabel = language === 'hi' ? '४. मेरी पासबुक 📖' : '4. Passbook 📖';
                stepIcon = <BookOpen className="w-3.5 h-3.5 text-[#1e7587]" />;
              } else if (s.pictorialIcon === 'dispute_scale') {
                stepLabel = language === 'hi' ? '५. हक की रक्षा ⚖️' : '5. Dispute Help ⚖️';
                stepIcon = <Scale className="w-3.5 h-3.5 text-[#792e7c]" />;
              }

              return (
                <button
                  key={s.stepNumber}
                  onClick={() => handleSelectStep(idx)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? `${colorStyles.badge} border-[#1c2421] shadow-[2px_2px_0px_#1c2421] scale-102`
                      : isPassed
                      ? 'bg-[#e2f0d9] text-[#2d6a4f] border-[#2d6a4f]/50'
                      : 'bg-white text-[#4a554f] border-[#1c2421]/30 hover:bg-[#f5efe3]'
                  }`}
                >
                  {stepIcon}
                  <span>{stepLabel}</span>
                  {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-[#fffef9]">
          {/* Main Step Card */}
          <div className={`p-4 sm:p-6 rounded-2xl border-[2.5px] ${colorStyles.border} ${colorStyles.bg} ${colorStyles.cardGlow} transition-all`}>
            
            {/* Step Header Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className={`text-xs font-black px-3 py-1 rounded-xl border-2 border-[#1c2421] ${colorStyles.badge} shadow-[2px_2px_0px_#1c2421]`}>
                {currentStep.badge}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#1b4332] bg-white px-2.5 py-1 rounded-lg border border-[#1c2421]/30 shadow-xs">
                  {role === 'worker' ? '🛡️ Sec 63 BSA Tamper-Proof' : '📋 Form V Muster Ready'}
                </span>
                <span className="text-xs font-mono font-black text-[#1c2421] bg-[#ede8d8] px-2 py-0.5 rounded border border-[#1c2421]/40">
                  {currentStepIndex + 1} / {steps.length}
                </span>
              </div>
            </div>

            {/* Step Headline & Subtitle */}
            <h3 className="text-xl sm:text-2xl font-black text-[#1c2421] tracking-tight">
              {currentStep.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#4a554f] font-semibold mt-1">
              {currentStep.subtitle}
            </p>

            {/* Pictorial / Visual Graphic Presentation */}
            {guideMode === 'pictorial' ? (
              <div className="my-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                
                {/* Left Visual Illustration Card (Designed for Zero Literacy Comprehension) */}
                <div className="md:col-span-5 bg-white rounded-2xl border-2 border-[#1c2421] p-4 flex flex-col items-center justify-center text-center shadow-[3px_3px_0px_#1c2421]">
                  
                  {/* Step 1: Morning Check-In Visual */}
                  {currentStep.pictorialIcon === 'morning_in' && (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-24 h-24 rounded-full bg-[#d8f3dc] border-[3px] border-[#2d6a4f] flex items-center justify-center mb-3 shadow-[2px_2px_0px_#2d6a4f] relative">
                        <Sunrise className="w-12 h-12 text-[#2d6a4f]" />
                        <span className="absolute -bottom-2 bg-[#2d6a4f] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white">
                          8:30 AM
                        </span>
                      </div>
                      <div className="w-full bg-[#2d6a4f] text-white text-sm font-black py-2.5 px-3 rounded-xl border-2 border-[#1c2421] shadow-[2px_2px_0px_#1c2421] flex items-center justify-center gap-2">
                        <span className="text-base">🟢</span>
                        <span>{language === 'hi' ? 'बड़ा हरा बटन दबाएं (IN)' : 'TAP GREEN BUTTON (IN)'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-[#2d6a4f] mt-2">
                        {language === 'hi' ? 'साइट पर कदम रखते ही आगमन दर्ज करें' : 'Locks your morning arrival instantly'}
                      </p>
                    </div>
                  )}

                  {/* Step 2: Evening Check-Out Visual */}
                  {currentStep.pictorialIcon === 'evening_out' && (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-24 h-24 rounded-full bg-[#ffe3e3] border-[3px] border-[#c92a2a] flex items-center justify-center mb-3 shadow-[2px_2px_0px_#c92a2a] relative">
                        <Sunset className="w-12 h-12 text-[#c92a2a]" />
                        <span className="absolute -bottom-2 bg-[#c92a2a] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white">
                          5:00 PM
                        </span>
                      </div>
                      <div className="w-full bg-[#c92a2a] text-white text-sm font-black py-2.5 px-3 rounded-xl border-2 border-[#1c2421] shadow-[2px_2px_0px_#1c2421] flex items-center justify-center gap-2">
                        <span className="text-base">🔴</span>
                        <span>{language === 'hi' ? 'लाल बटन दबाएं (OUT)' : 'TAP RED BUTTON (OUT)'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-[#c92a2a] mt-2">
                        {language === 'hi' ? 'पूरे 8 घंटे का काम साबित - मुकर नहीं सकते' : 'Defeats punch-and-run claims'}
                      </p>
                    </div>
                  )}

                  {/* Step 3: Legal Token / Receipt Slip Visual */}
                  {currentStep.pictorialIcon === 'slip_stamp' && (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-24 h-24 rounded-2xl bg-[#fef3c7] border-[3px] border-[#b87c24] flex items-center justify-center mb-3 shadow-[2px_2px_0px_#b87c24] relative">
                        <Stamp className="w-12 h-12 text-[#b87c24]" />
                        <span className="absolute -bottom-2 bg-[#b87c24] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white font-mono">
                          SHP-89F1
                        </span>
                      </div>
                      <div className="w-full bg-[#b87c24] text-white text-sm font-black py-2 px-3 rounded-xl border-2 border-[#1c2421] shadow-[2px_2px_0px_#1c2421] flex items-center justify-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-white" />
                        <span>{language === 'hi' ? 'सरकारी डिजिटल रसीद' : 'LEGAL EVIDENCE SLIP'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-[#8c5912] mt-2">
                        {language === 'hi' ? '2 घंटे में आपत्ति न होने पर कानूनी स्वीकृति' : 'Sec 121 Estoppel + 63 BSA Proof'}
                      </p>
                    </div>
                  )}

                  {/* Step 4: Worker Passbook Visual */}
                  {currentStep.pictorialIcon === 'passbook' && (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-24 h-24 rounded-2xl bg-[#ccebf0] border-[3px] border-[#1e7587] flex items-center justify-center mb-3 shadow-[2px_2px_0px_#1e7587] relative">
                        <BookOpen className="w-12 h-12 text-[#1e7587]" />
                        <span className="absolute -bottom-2 bg-[#1e7587] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white">
                          ₹3,600 OWED
                        </span>
                      </div>
                      <div className="w-full bg-[#1e7587] text-white text-sm font-black py-2 px-3 rounded-xl border-2 border-[#1c2421] shadow-[2px_2px_0px_#1c2421] flex items-center justify-center gap-1.5">
                        <Coins className="w-4 h-4 text-[#f6d365]" />
                        <span>{language === 'hi' ? 'मेरी पासबुक (हिसाब)' : 'MY WAGE PASSBOOK'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-[#1e7587] mt-2">
                        {language === 'hi' ? 'शुक्रवार को पैसे लेते समय बकाया देखें' : 'Know exact days worked & balance'}
                      </p>
                    </div>
                  )}

                  {/* Step 5: Dispute Resolution Visual */}
                  {currentStep.pictorialIcon === 'dispute_scale' && (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-24 h-24 rounded-2xl bg-[#f3d9f3] border-[3px] border-[#792e7c] flex items-center justify-center mb-3 shadow-[2px_2px_0px_#792e7c] relative">
                        <Scale className="w-12 h-12 text-[#792e7c]" />
                        <span className="absolute -bottom-2 bg-[#792e7c] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white font-mono">
                          CASE SS-4819
                        </span>
                      </div>
                      <div className="w-full bg-[#792e7c] text-white text-sm font-black py-2 px-3 rounded-xl border-2 border-[#1c2421] shadow-[2px_2px_0px_#1c2421] flex items-center justify-center gap-1.5">
                        <PhoneCall className="w-4 h-4 text-[#f6d365]" />
                        <span>{language === 'hi' ? 'हेल्पलाइन: 14434 (मुफ्त)' : 'HELPLINE: 14434 (FREE)'}</span>
                      </div>
                      <p className="text-[11px] font-bold text-[#792e7c] mt-2">
                        {language === 'hi' ? 'ठेकेदार पैसे काटे तो तुरंत सरकारी शिकायत' : 'Direct complaint to Labor Officers'}
                      </p>
                    </div>
                  )}

                  {/* Supervisor Step Fallbacks */}
                  {!currentStep.pictorialIcon && (
                    <div className="w-full flex flex-col items-center py-2">
                      <div className="w-20 h-20 rounded-2xl bg-[#faf5e8] border-2 border-[#1c2421] flex items-center justify-center mb-2">
                        <Radio className="w-10 h-10 text-[#1e7587]" />
                      </div>
                      <span className="text-xs font-black text-[#1c2421]">
                        MUSTER VERIFIED
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Explanation Column */}
                <div className="md:col-span-7 flex flex-col justify-between">
                  <div className="bg-white/80 p-4 rounded-xl border-2 border-[#1c2421]/20">
                    <p className="text-xs sm:text-sm text-[#1c2421] leading-relaxed font-semibold">
                      {currentStep.description}
                    </p>

                    {/* Highlights bullet list */}
                    <div className="mt-3 pt-3 border-t border-dashed border-[#1c2421]/20">
                      <div className="text-[11px] font-black uppercase text-[#1c2421] tracking-wider mb-2">
                        {language === 'hi' ? 'मुख्य बातें:' : 'Key Protections:'}
                      </div>
                      <ul className="space-y-1.5">
                        {currentStep.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-bold text-[#1c2421]">
                            <span className="w-2 h-2 rounded-full bg-[#1b4332] shrink-0 mt-1" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Spoken Narration Quote Card */}
                  {currentStep.voiceScript && (
                    <div className="mt-3 p-3 rounded-xl bg-[#fff8eb] border-2 border-[#b87c24]/50 flex items-start gap-2.5">
                      <button
                        onClick={toggleAudio}
                        className="p-1.5 rounded-lg bg-[#b87c24] text-white shrink-0 hover:bg-[#8c5912] cursor-pointer transition-all"
                        title="Replay this voice instruction"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-black text-[#8c5912] uppercase tracking-wide">
                          {language === 'hi' ? 'आवाज़ में निर्देश:' : 'Spoken Explanation:'}
                        </div>
                        <p className="text-xs text-[#523d1c] font-medium italic mt-0.5">
                          "{currentStep.voiceScript}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* Detailed Text Mode (For educated kin, labor organizers, union leaders) */
              <div className="my-4 space-y-4">
                <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-[#1c2421]/25 leading-relaxed text-xs sm:text-sm text-[#1c2421]">
                  <p className="font-medium text-base mb-3 text-[#1b4332]">
                    {currentStep.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {currentStep.highlights.map((h, i) => (
                      <div key={i} className="p-3 bg-[#faf6ed] rounded-lg border border-[#1c2421]/20 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] shrink-0 mt-0.5" />
                        <span className="text-xs font-bold text-[#1c2421]">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Practical Field Tip Box */}
            <div className="p-3 bg-[#fff9e6] border-2 border-dashed border-[#b87c24] rounded-xl flex items-start gap-2.5 text-xs text-[#78350f] font-semibold mt-3">
              <Lightbulb className="w-4 h-4 text-[#b87c24] shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-[#8c5912] mr-1.5">
                  {language === 'hi' ? 'पक्की सलाह:' : 'Field Tip:'}
                </span>
                <span>{currentStep.tip}</span>
              </div>
            </div>

            {/* Interactive "Try Feature Now" Button */}
            {currentStep.actionLabel && (
              <div className="mt-4 pt-3 border-t-2 border-[#1c2421]/15 flex items-center justify-between">
                <span className="text-xs text-[#3d5a45] font-bold hidden sm:inline">
                  {language === 'hi' ? 'अभी खुद करके देखें:' : 'Try this feature live:'}
                </span>
                <button
                  onClick={() => handleActionClick(currentStep)}
                  className="comic-btn-cream text-xs sm:text-sm font-black px-4 py-2 flex items-center gap-2 cursor-pointer active:scale-95 ml-auto shadow-[2px_2px_0px_#1c2421]"
                >
                  <span>{currentStep.actionLabel}</span>
                  <ArrowRight className="w-4 h-4 text-[#1b4332]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Navigation */}
        <div className="p-3.5 sm:p-5 bg-[#faf5e8] border-t-2 border-[#1c2421] flex items-center justify-between gap-3 shrink-0">
          {/* Previous Step Button */}
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className={`px-4 py-2 text-xs sm:text-sm font-black flex items-center gap-1.5 rounded-xl border-2 border-[#1c2421] shadow-[2px_2px_0px_#1c2421] transition-all cursor-pointer ${
              currentStepIndex === 0 
                ? 'opacity-40 cursor-not-allowed bg-gray-200 text-gray-500 shadow-none' 
                : 'comic-btn-cream'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>
              {language === 'hi' ? 'पिछला' : 
               language === 'kn' ? 'ಹಿಂದಿನದು' : 
               language === 'te' ? 'మునుపటి' : 
               language === 'ta' ? 'முந்தைய' : 
               language === 'ml' ? 'മുമ്പത്തേത്' : 
               'Previous'}
            </span>
          </button>

          {/* Middle Indicator */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full border border-[#1c2421] transition-all ${
                  currentStepIndex === i ? 'bg-[#1b4332] w-6' : 'bg-white'
                }`}
              />
            ))}
          </div>

          {/* Next / Finish Button */}
          <button
            onClick={handleNext}
            className={`px-5 py-2 text-xs sm:text-sm font-black flex items-center gap-1.5 rounded-xl border-2 border-[#1c2421] shadow-[3px_3px_0px_#1c2421] transition-all cursor-pointer active:scale-95 ${
              role === 'worker' ? 'comic-btn-emerald' : 'comic-btn-teal'
            }`}
          >
            <span>
              {currentStepIndex < steps.length - 1 
                ? (language === 'hi' ? 'अगला चरण →' : 
                   language === 'kn' ? 'ಮುಂದಿನ ಹಂತ →' : 
                   language === 'te' ? 'తదుపరి దశ →' : 
                   language === 'ta' ? 'அடுத்த படி →' : 
                   language === 'ml' ? 'അടുത്ത ഘട്ടം →' : 
                   'Next Step →')
                : (language === 'hi' ? 'समझ गए! काम शुरू करें ✓' : 
                   language === 'kn' ? 'ಅರ್ಥವಾಯಿತು! ಕೆಲಸ ಪ್ರಾರಂಭಿಸಿ ✓' : 
                   language === 'te' ? 'అర్థమైంది! పని ప్రారంభించండి ✓' : 
                   language === 'ta' ? 'புரிந்தது! வேலையைத் தொடங்குங்கள் ✓' : 
                   language === 'ml' ? 'മനസ്സിലായി! ജോലി ആരംഭിക്കുക ✓' : 
                   'Got it! Start Working ✓')}
            </span>
            {currentStepIndex < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
