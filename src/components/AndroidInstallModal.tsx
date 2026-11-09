import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  DownloadCloud, 
  CheckCircle2, 
  Share2, 
  MoreVertical, 
  PlusSquare, 
  Volume2, 
  VolumeX, 
  QrCode, 
  ShieldCheck, 
  WifiOff, 
  Zap, 
  ExternalLink,
  Copy,
  Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../context/LanguageContext';
import { speakText, stopSpeaking } from '../utils/speech';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  canInstall: boolean;
  isInstalled: boolean;
  isAndroid: boolean;
  onTriggerInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  canInstall,
  isInstalled,
  isAndroid,
  onTriggerInstall,
}) => {
  const { language } = useLanguage();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success' | 'manual'>('idle');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://shramiksakshi.gov';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleInstallClick = async () => {
    setInstallStatus('installing');
    const result = await onTriggerInstall();
    if (result === 'accepted') {
      setInstallStatus('success');
    } else {
      setInstallStatus('manual');
    }
  };

  const handlePlayVoice = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    let speechText = '';
    if (language === 'hi') {
      speechText = 'श्रमिक साक्षी ऐप को अपने फोन में डाउनलोड करने के लिए, नीचे दिए गए बड़े हरे बटन "फोन में ऐप इंस्टॉल करें" को दबाएं। अगर आपका फोन पूछे, तो इंस्टॉल पर क्लिक करें। यह ऐप बिना इंटरनेट के भी आपके मोबाइल में काम करेगा।';
    } else if (language === 'kn') {
      speechText = 'ಶ್ರಮಿಕ್ ಸಾಕ್ಷಿ ಆ್ಯಪ್ ಅನ್ನು ನಿಮ್ಮ ಫೋನ್‌ಗೆ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಲು, ಕೆಳಗಿನ ಹಸಿರು ಬಟನ್ ಒತ್ತಿರಿ. ಇದು ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆಯೂ ನಿಮ್ಮ ಮೊಬೈಲ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ.';
    } else if (language === 'te') {
      speechText = 'శ్రమిక్ సాక్షి యాప్‌ను మీ ఫోన్‌లో డౌన్‌లోడ్ చేసుకోవడానికి, దిగువన ఉన్న ఆకుపచ్చ బటన్‌ను నొక్కండి. ఇది ఇంటర్నెట్ లేకుండా కూడా మీ మొబైల్‌లో పనిచేస్తుంది.';
    } else if (language === 'ta') {
      speechText = 'ஷ்ரமிக் சாக்ஷி செயலியை உங்கள் மொபைலில் பதிவிறக்கம் செய்ய, கீழே உள்ள பச்சை பொத்தானை அழுத்தவும். இது இணையம் இல்லாமலும் வேலை செய்யும்.';
    } else if (language === 'ml') {
      speechText = 'ശ്രമിക് സാക്ഷി ആപ്പ് നിങ്ങളുടെ ഫോണിൽ ഡൗൺലോഡ് ചെയ്യാൻ പച്ച ബട്ടൺ അമർത്തുക. ഇന്റർനെറ്റ് ഇല്ലാതെയും ഇത് പ്രവർത്തിക്കും.';
    } else {
      speechText = 'To install the Shramik Sakshi app on your Android phone, tap the big green install button. Once installed, it works offline without internet on your phone home screen.';
    }

    setIsPlayingAudio(true);
    speakText(
      speechText,
      language,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#141d1a]/85 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-[#fffdfa] rounded-2xl border-4 border-[#1c2421] shadow-[8px_8px_0px_#1c2421] overflow-hidden my-6 transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
      >
        {/* Top Scalloped Archival Trim */}
        <div className="roof-scallops-gold -mx-1 -mt-1 mb-2" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b-2 border-[#1c2421]/20 flex items-start justify-between bg-[#f4faee]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1b4332] text-white flex items-center justify-center border-2 border-[#1c2421] shadow-[2px_2px_0px_#1c2421] shrink-0">
              <Smartphone className="w-7 h-7 text-[#c29437]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider bg-[#1b4332] text-white px-2 py-0.5 rounded border border-[#1c2421]">
                  Official Android App
                </span>
                <span className="text-xs font-black text-[#2e7d32]">
                  ✓ Free • 0 MB Play Store Free
                </span>
              </div>
              <h2 id="install-modal-title" className="text-lg sm:text-xl font-black text-[#19231f] tracking-tight mt-0.5">
                Download &amp; Install on Phone (ऐप डाउनलोड करें)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Audio Voice Guide Button */}
            <button
              onClick={handlePlayVoice}
              className={`p-2 rounded-xl border-2 border-[#1c2421] cursor-pointer shadow-[2px_2px_0px_#1c2421] transition-all active:scale-95 ${
                isPlayingAudio ? 'bg-[#ef4444] text-white animate-pulse' : 'bg-[#fef3c7] hover:bg-[#fde68a] text-[#19231f]'
              }`}
              title="Listen to instructions in your language"
              aria-label="Voice guide"
            >
              {isPlayingAudio ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-[#1b4332]" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white hover:bg-[#fae1dd] text-[#19231f] border-2 border-[#1c2421] shadow-[2px_2px_0px_#1c2421] cursor-pointer active:scale-95 transition-all"
              aria-label="Close install modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Audio instruction banner */}
          <div className="flex items-center justify-between gap-3 bg-[#fef3c7] border-2 border-[#1c2421] rounded-xl p-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#19231f]">
              <Volume2 className="w-4 h-4 text-[#1b4332] shrink-0" />
              <span>
                {language === 'hi' 
                  ? 'आवाज से सुनने के लिए ऊपर दिए गए पीले स्पीकर बटन 🔊 को दबाएं।' 
                  : 'Tap the yellow speaker button 🔊 above to hear spoken instructions.'}
              </span>
            </div>
            <button
              onClick={handlePlayVoice}
              className="text-xs bg-[#1b4332] text-white px-2.5 py-1 rounded-lg font-black border border-[#1c2421] cursor-pointer hover:bg-[#235842] shrink-0"
            >
              {isPlayingAudio ? 'Stop' : 'Play 🔊'}
            </button>
          </div>

          {/* Already installed state */}
          {isInstalled && (
            <div className="bg-[#eaf4ea] border-3 border-[#2e7d32] rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-[#2e7d32] shrink-0" />
              <div>
                <h3 className="text-sm font-black text-[#19231f]">
                  ✓ App is already installed on this device!
                </h3>
                <p className="text-xs text-[#2e7d32] font-bold mt-0.5">
                  You can open Shramik Sakshi anytime directly from your phone home screen, even without internet.
                </p>
              </div>
            </div>
          )}

          {/* Primary 1-Tap Install Button */}
          {!isInstalled && (
            <div className="bg-[#f0f9f3] border-3 border-[#1b4332] rounded-2xl p-4 sm:p-5 text-center space-y-3 shadow-[4px_4px_0px_#1c2421]">
              <div className="inline-flex items-center gap-2 bg-[#1b4332] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#c29437]" />
                <span>Instant Android Installation</span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-[#19231f]">
                {language === 'hi' 
                  ? 'अपने फोन की होम स्क्रीन पर जोड़ें' 
                  : 'Install Shramik App to Your Phone Home Screen'}
              </h3>

              <p className="text-xs sm:text-sm text-[#3d4a44] font-bold max-w-md mx-auto">
                {language === 'hi'
                  ? 'एक क्लिक में ऐप डाउनलोड करें। यह बिना इंटरनेट के भी काम करती है और आपकी दैनिक मजदूरी और हाजिरी का पक्का रिकॉर्ड सुरक्षित रखती है।'
                  : 'One-tap direct download. Opens like an official app, saves records offline, and generates Section 63 BSA certified daily wage slips.'}
              </p>

              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-4 bg-[#2e7d32] hover:bg-[#236b27] text-white text-base sm:text-lg font-black rounded-xl border-3 border-[#1c2421] shadow-[4px_4px_0px_#1c2421] cursor-pointer active:scale-95 transition-transform"
              >
                <DownloadCloud className="w-6 h-6 text-[#c29437] animate-bounce" />
                <span>📲 INSTALL ON ANDROID (फोन में ऐप इंस्टॉल करें)</span>
              </button>

              <div className="flex items-center justify-center gap-4 text-xs font-black text-[#1b4332] pt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <WifiOff className="w-3.5 h-3.5" /> 100% Offline Ready
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Opens Instantly
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Legal Wage Proof
                </span>
              </div>
            </div>
          )}

          {/* Simple 3-Step Visual Guide for Chrome on Android */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#19231f] uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#1b4332]" />
              <span>
                {language === 'hi' 
                  ? 'यदि बटन काम न करे: 3 आसान कदम (Chrome ब्राउज़र में)' 
                  : 'If Direct Button is Inactive: 3 Simple Steps on Android Chrome'}
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Step 1 */}
              <div className="bg-[#fcfbf7] border-2 border-[#1c2421] rounded-xl p-3 relative shadow-[2px_2px_0px_#1c2421]">
                <div className="w-6 h-6 rounded-full bg-[#1b4332] text-white text-xs font-black flex items-center justify-center mb-2">
                  1
                </div>
                <div className="flex items-center gap-1.5 font-black text-xs text-[#19231f] mb-1">
                  <MoreVertical className="w-4 h-4 text-[#1b4332]" />
                  <span>Tap 3 Dots (⋮)</span>
                </div>
                <p className="text-[11px] text-[#3d4a44] font-bold leading-tight">
                  {language === 'hi'
                    ? 'फोन स्क्रीन के सबसे ऊपर दाएं कोने में 3 बिंदु (⋮) दबाएं।'
                    : 'Tap the three vertical dots (⋮) in the top-right corner of Chrome.'}
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-[#fcfbf7] border-2 border-[#1c2421] rounded-xl p-3 relative shadow-[2px_2px_0px_#1c2421]">
                <div className="w-6 h-6 rounded-full bg-[#1b4332] text-white text-xs font-black flex items-center justify-center mb-2">
                  2
                </div>
                <div className="flex items-center gap-1.5 font-black text-xs text-[#19231f] mb-1">
                  <DownloadCloud className="w-4 h-4 text-[#1b4332]" />
                  <span>Tap "Install app"</span>
                </div>
                <p className="text-[11px] text-[#3d4a44] font-bold leading-tight">
                  {language === 'hi'
                    ? '"ऐप इंस्टॉल करें" या "होम स्क्रीन में जोड़ें" विकल्प पर दबाएं।'
                    : 'Choose "Install app" or "Add to Home screen" from the menu.'}
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-[#fcfbf7] border-2 border-[#1c2421] rounded-xl p-3 relative shadow-[2px_2px_0px_#1c2421]">
                <div className="w-6 h-6 rounded-full bg-[#1b4332] text-white text-xs font-black flex items-center justify-center mb-2">
                  3
                </div>
                <div className="flex items-center gap-1.5 font-black text-xs text-[#19231f] mb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#2e7d32]" />
                  <span>Tap "Install"</span>
                </div>
                <p className="text-[11px] text-[#3d4a44] font-bold leading-tight">
                  {language === 'hi'
                    ? '"इंस्टॉल करें" दबाएं। श्रमिक साक्षी का लोगो फोन स्क्रीन पर आ जाएगा!'
                    : 'Confirm "Install". The Hardhat icon 🛠️ will appear on your phone!'}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop to Mobile QR Code Transfer */}
          <div className="bg-[#fff8ea] border-2 border-[#1c2421] rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2.5 rounded-xl border-2 border-[#1c2421] shadow-[2px_2px_0px_#1c2421] shrink-0">
              <QRCodeSVG
                value={currentUrl}
                size={110}
                bgColor="#ffffff"
                fgColor="#1b4332"
                level="M"
              />
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="text-[11px] font-black uppercase tracking-wider bg-[#c29437] text-[#19231f] px-2 py-0.5 rounded border border-[#1c2421] inline-block">
                Scan with Phone Camera (कैमरे से स्कैन करें)
              </span>
              <h5 className="text-xs sm:text-sm font-black text-[#19231f]">
                {language === 'hi' 
                  ? 'कंप्यूटर से मोबाइल पर इंस्टॉल करें' 
                  : 'Open on your Android Phone Instantly'}
              </h5>
              <p className="text-xs text-[#3d4a44] font-bold leading-relaxed">
                {language === 'hi'
                  ? 'अपने फोन का कैमरा या Google Lens खोलकर इस कोड को स्कैन करें। फोन में तुरंत ऐप खुल जाएगी।'
                  : 'Point your Android phone camera or Google Lens at this QR code to open and install the app on your phone.'}
              </p>
              <div className="pt-1 flex items-center gap-2 justify-center sm:justify-start">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1 bg-white hover:bg-[#d8f1e9] text-[#19231f] border border-[#1c2421] rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5 text-[#1b4332]" />
                  <span>{copiedLink ? '✓ Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Technical Specifications Accordion / Footer Info */}
          <div className="bg-[#f0f4ea] border border-[#1b4332]/40 rounded-xl p-3 text-xs text-[#232b28] space-y-1">
            <div className="font-black text-[#1b4332] uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#1b4332]" />
              <span>Official Manifest &amp; WebAPK Specifications</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] font-bold">
              <div>
                <span className="text-[#3d4a44] block">Platform:</span>
                <span className="text-[#19231f]">Android WebAPK</span>
              </div>
              <div>
                <span className="text-[#3d4a44] block">Display:</span>
                <span className="text-[#19231f]">Standalone Fullscreen</span>
              </div>
              <div>
                <span className="text-[#3d4a44] block">Storage:</span>
                <span className="text-[#19231f]">IndexedDB WAL</span>
              </div>
              <div>
                <span className="text-[#3d4a44] block">Status:</span>
                <span className="text-[#2e7d32]">Service Worker Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#fcfbf7] border-t-2 border-[#1c2421]/20 flex items-center justify-between">
          <div className="text-xs font-black text-[#1b4332] flex items-center gap-1">
            <span>🛠️ Shramik Sakshi</span>
            <span className="text-[#1c2421]/30">·</span>
            <span>Version 2.4.0 (PWA)</span>
          </div>
          <button
            onClick={onClose}
            className="civic-btn-secondary px-4 py-1.5 text-xs font-black cursor-pointer active:scale-95"
          >
            Close (बंद करें)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AndroidInstallModal;
