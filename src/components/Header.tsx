import React, { useState } from 'react';
import { RefreshCw, Globe, ShieldCheck, Printer, Volume2, VolumeX, CheckCircle2, Smartphone, DownloadCloud, UserPlus, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage, UserRole } from '../types';
import { speakText, stopSpeaking } from '../utils/speech';

interface HeaderProps {
  onOpenRegisterLabour?: () => void;
  onRefresh: () => void;
  onOpenTutorial: (role?: 'worker' | 'admin') => void;
  onPrintPassbook?: () => void;
  userRole?: UserRole;
  onSwitchRole?: (role: UserRole) => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  onOpenInstallModal?: () => void;
  isAppInstalled?: boolean;
  activeShiftWorker?: string | null;
}


const LANGUAGES: Array<{ code: SupportedLanguage; label: string; native: string }> = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
];

export const Header: React.FC<HeaderProps> = ({ 
  onOpenRegisterLabour, 
  onRefresh, 
  onOpenTutorial,
  onPrintPassbook,
  userRole = 'worker',
  onSwitchRole,
  isZenMode = false,
  onToggleZenMode,
  onOpenInstallModal,
  isAppInstalled = false,
  activeShiftWorker,
}) => {

  const { language, setLanguage, t } = useLanguage();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handlePrint = () => {
    if (onPrintPassbook) {
      onPrintPassbook();
    } else {
      window.print();
    }
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    let audioText = '';
    if (language === 'hi') {
      audioText = 'श्रमिक साक्षी में आपका स्वागत है। यह आपका काम और मजदूरी का पक्का खाता है। आज का काम दर्ज करने और 600 रुपये की सरकारी पर्ची पाने के लिए बड़ा हरा बटन दबाएं। अपनी कुल कमाई देखने के लिए हिसाब बटन दबाएं।';
    } else if (language === 'kn') {
      audioText = 'ಶ್ರಮಿಕ್ ಸಾಕ್ಷಿಗೆ ಸುಸ್ವಾಗತ. ಇದು ನಿಮ್ಮ ದೈನಂದಿನ ಕೆಲಸ ಮತ್ತು ಕೂಲಿಯ ಅಧಿಕೃತ ಪುಸ್ತಕ. ಇಂದಿನ ಕೆಲಸವನ್ನು ದಾಖಲಿಸಲು ಮತ್ತು 600 ರೂಪಾಯಿ ರಸೀದಿ ಪಡೆಯಲು ದೊಡ್ಡ ಹಸಿರು ಬಟನ್ ಒತ್ತಿ.';
    } else if (language === 'te') {
      audioText = 'శ్రమిక్ సాక్షికి స్వాగతం. ఇది మీ రోజువారీ పని మరియు వేతన పుస్తకం. నేటి పనిని నమోదు చేయడానికి మరియు 600 రూపాయల రసీదు పొందడానికి పెద్ద ఆకుపచ్చ బటన్ నొక్కండి.';
    } else if (language === 'ta') {
      audioText = 'ஷ்ரமிக் சாக்ஷிக்கு வரவேற்கிறோம். இது உங்கள் தினசரி வேலை மற்றும் கூலி புத்தகம். இன்றைய வருகையை பதிவு செய்ய பெரிய பச்சை பொத்தானை அழுத்தவும்.';
    } else if (language === 'ml') {
      audioText = 'ശ്രമിക് സാക്ഷിയിലേക്ക് സ്വാഗതം. ഇത് നിങ്ങളുടെ ദൈനംദിന ജോലിയും വേതനവും രേഖപ്പെടുത്തുന്ന പുസ്തകം. ഇന്നത്തെ ജോലി രേഖപ്പെടുത്താൻ വലിയ പച്ച ബട്ടൺ അമർത്തുക.';
    } else {
      audioText = 'Welcome to Shramik Sakshi, your daily work and wage book. Tap the big green button to mark your work today and get an official 600 rupee slip so your contractor cannot deny your wage.';
    }

    setIsPlayingAudio(true);
    speakText(
      audioText,
      language,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  return (
    <header className="mb-6 comic-card p-4 sm:p-5 overflow-hidden relative bg-[#fffdfa]/95 backdrop-blur-xs">
      {/* Scalloped Trim across Header */}
      <div className="roof-scallops-pink -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 mb-3" />

      {/* Top Regulatory Identity Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 mb-4 border-b-2 border-[#232b28]/15 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Official Registry Badge */}
          <span className="bg-[#1b4332] text-white text-[11px] font-black px-2.5 py-1 rounded-lg tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#232b28] border border-[#232b28]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#c29437]" />
            <span>SHRAMIK SAKSHI • DAILY WORK &amp; WAGE BOOK</span>
          </span>
          <span className="text-xs text-[#2e7d32] font-black tracking-tight flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2e7d32]" />
            <span>CERTIFIED CONTEMPORANEOUS WORK &amp; WAGE RECORD UNDER SECTION 63 BSA</span>
          </span>
        </div>

        {/* Top Controls: Voice Read-Aloud, Role Switcher & Language Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Voice Read-Aloud Button for Illiterate and Low-Literacy Workers */}
          <button
            onClick={handleToggleAudio}
            className={`px-3 py-1.5 rounded-xl border-2 border-[#232b28] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#232b28] transition-all active:scale-95 ${
              isPlayingAudio
                ? 'bg-[#ef4444] text-white animate-pulse'
                : 'bg-[#fef3c7] hover:bg-[#fde68a] text-[#19231f]'
            }`}
            title="Listen to voice instructions"
            aria-label="Listen to voice guide"
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-4 h-4 text-white" />
                <span>Stop Voice (रोकें)</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#1b4332]" />
                <span>🔊 Listen (बोलकर सुनें)</span>
              </>
            )}
          </button>

          {/* Role Switcher */}
          {onSwitchRole && (
            <div className="flex items-center gap-1 bg-[#fef3c7] px-2 py-1 rounded-xl border-2 border-[#232b28] shadow-[2px_2px_0px_#232b28]">
              <span className="text-[10px] font-black text-[#232b28] uppercase tracking-wide">Who:</span>
              <select
                value={userRole}
                onChange={(e) => onSwitchRole(e.target.value as UserRole)}
                className="bg-white text-[#19231f] text-xs font-black border border-[#232b28] rounded-lg px-2 py-0.5 cursor-pointer focus:outline-none"
                aria-label="Switch User Role"
              >
                <option value="worker">👷 Worker (कामगार)</option>
                <option value="employer">🏢 Contractor (ठेकेदार)</option>
                <option value="administrator">🛡️ Inspector (अधिकारी)</option>
              </select>
            </div>
          )}

          {/* Language Selector with Native Glyphs */}
          <div className="flex items-center gap-1 bg-[#d8f1e9] px-2 py-1 rounded-xl border-2 border-[#232b28] shadow-[2px_2px_0px_#232b28]">
            <Globe className="w-3.5 h-3.5 text-[#1b4332] shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="bg-white text-[#19231f] text-xs font-black border border-[#232b28] rounded-lg px-2 py-0.5 cursor-pointer focus:outline-none"
              aria-label="Select Language"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.native} ({lang.label})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Title & Action Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#19231f] tracking-tight">
              {t.appTitle}
            </h1>
            <span className="rubber-stamp-verified text-[10px]">
              ✓ LEGAL WAGE SLIP GUARANTEED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#3d4a44] mt-1 leading-relaxed max-w-3xl font-bold">
            {t.appDescription || "Your official daily work and wage record. Tap 1 button to mark today's work, get a paper wage slip, and protect your ₹600 daily pay."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Quick Print Passbook for CSC cyber cafes (₹2 printouts) */}
          <button
            onClick={handlePrint}
            className="civic-btn-secondary px-3 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            title="Print Official Shramik Passbook (₹2 CSC Printout)"
          >
            <Printer className="w-4 h-4 text-[#1b4332]" />
            <span>Print Passbook (₹2 CSC)</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={onRefresh}
            className="civic-btn-secondary px-3 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            title="Refresh records"
          >
            <RefreshCw className="w-4 h-4 text-[#1b4332]" />
            <span>Refresh</span>
          </button>

          {/* Android App Download & Install Button */}
          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="bg-[#2e7d32] hover:bg-[#236b27] text-white px-3.5 py-2 text-xs font-black rounded-xl border-2 border-[#1c2421] shadow-[2px_2px_0px_#1c2421] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              title="Install official Android App on phone"
            >
              <Smartphone className="w-4 h-4 text-[#c29437]" />
              <span>{isAppInstalled ? '✓ App on Phone' : '📲 Download App (ऐप डाउनलोड)'}</span>
            </button>
          )}

          {/* Register Labour Button */}
          {onOpenRegisterLabour && (
            <button
              onClick={onOpenRegisterLabour}
              className="civic-btn-primary px-3.5 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#1c2421] active:scale-95"
              title="Register new worker in this app"
            >
              <UserPlus className="w-4 h-4 text-[#c29437]" />
              <span>👷 Register Labour (मजदूर पंजीकरण)</span>
            </button>
          )}
        </div>
      </div>

      {/* Reassuring Plain Status Indicator */}
      <div className="mt-3 pt-2.5 border-t border-dashed border-[#1c2421]/20 flex flex-wrap items-center justify-between gap-2 text-xs text-[#3d4a44]">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full inline-block ${activeShiftWorker ? 'bg-[#059669] animate-ping' : 'bg-[#1b4332] animate-pulse'}`} />
          <span className="font-black text-[#19231f]">
            {activeShiftWorker
              ? `🟢 ACTIVE SHIFT: ${activeShiftWorker} IS CURRENTLY ON DUTY`
              : 'ALL-IN-ONE SHRAMIK LEDGER: REGISTRATION, ATTENDANCE, SLIPS & HISAAB'}
          </span>
        </div>
        <div className="flex items-center gap-3 font-bold text-xs text-[#2e7d32]">
          <span>✓ GPS Location Verified</span>
          <span className="text-[#1c2421]/30">·</span>
          <span>✓ Agreed Daily Wage Rate Protected</span>
          <span className="text-[#1c2421]/30">·</span>
          <span>✓ Section 63 BSA Evidentiary Slips</span>
        </div>
      </div>

    </header>
  );
};

export default Header;

