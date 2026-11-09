import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck, CheckCircle2, Phone, Briefcase, IndianRupee, MapPin, AlertCircle, QrCode, Printer, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { RegisteredLabour } from '../types';
import { registerLabourerInApp } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';
import { speakText, stopSpeaking } from '../utils/speech';

interface LabourRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkerRegistered: (worker: RegisteredLabour) => void;
  defaultPhone?: string;
}

const TRADES = [
  { id: 'helper', label: 'Helper / General Labor (मजदूर / हेल्पर)', defaultWage: 600 },
  { id: 'mason', label: 'Mason (राजमिस्त्री)', defaultWage: 750 },
  { id: 'carpenter', label: 'Carpenter / Shuttering (बढ़ई / शटरिंग)', defaultWage: 700 },
  { id: 'barbender', label: 'Bar Bender / Steel Fixer (सरिया मिस्त्री)', defaultWage: 750 },
  { id: 'painter', label: 'Painter (पेंटर / सफेदी)', defaultWage: 650 },
  { id: 'electrician', label: 'Electrician (इलेक्ट्रीशियन / बिजली)', defaultWage: 800 },
  { id: 'plumber', label: 'Plumber (प्लम्बर / नलसाज)', defaultWage: 750 },
  { id: 'loader', label: 'Loader / Material Handler (लोडर / हम्माल)', defaultWage: 600 },
  { id: 'welder', label: 'Welder / Fabricator (वेल्डर)', defaultWage: 750 },
  { id: 'driver', label: 'Driver / Equipment Operator (ड्राइवर)', defaultWage: 850 },
];

const DEFAULT_SITES = [
  'Peenya Industrial Area, Bengaluru',
  'Azadpur Mandi Wholesale Hub, North Delhi',
  'Dharavi Redevelopment Sector 5, Mumbai',
  'Sanathnagar Industrial Hub, Hyderabad',
  'Guindy Industrial Estate, Chennai',
  'Willingdon Cargo Dock, Kochi',
];

export const LabourRegistrationModal: React.FC<LabourRegistrationModalProps> = ({
  isOpen,
  onClose,
  onWorkerRegistered,
  defaultPhone = '',
}) => {
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone || '+91');
  const [trade, setTrade] = useState('Helper / General Labor (मजदूर / हेल्पर)');
  const [dailyWage, setDailyWage] = useState<number>(600);
  const [worksite, setWorksite] = useState(DEFAULT_SITES[0]);
  const [customSite, setCustomSite] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [aadhaarLastFour, setAadhaarLastFour] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredCard, setRegisteredCard] = useState<RegisteredLabour | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isOpen) return null;

  const handleTradeChange = (newTradeLabel: string) => {
    setTrade(newTradeLabel);
    const matched = TRADES.find((t) => t.label === newTradeLabel);
    if (matched) {
      setDailyWage(matched.defaultWage);
    }
  };

  const handleSpeakGuidance = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    const guide = language === 'hi'
      ? 'नया मजदूर पंजीकरण। अपना पूरा नाम, फोन नंबर, काम की श्रेणी और दैनिक मजदूरी भरें। पंजीकरण के बाद आपको आधिकारिक श्रमिक पहचान पत्र मिलेगा।'
      : 'New Labour Registration. Fill your full name, phone number, trade skill, and daily wage. You will immediately receive your official Shramik Identity Card.';

    setIsSpeaking(true);
    speakText(
      guide,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Worker full name is required (मजदूर का नाम आवश्यक है).');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number with country code (e.g. +919876543210).');
      return;
    }

    setIsSubmitting(true);
    try {
      const siteFinal = customSite.trim() ? customSite.trim() : worksite;
      const worker = await registerLabourerInApp({
        name: name.trim(),
        phoneNumber: cleanPhone,
        trade,
        dailyWage: Number(dailyWage) || 600,
        worksite: siteFinal,
        emergencyContact: emergencyContact.trim() || undefined,
        aadhaarLastFour: aadhaarLastFour.trim() || undefined,
      });

      setRegisteredCard(worker);
      onWorkerRegistered(worker);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register labourer. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setName('');
    setPhoneNumber('+91');
    setRegisteredCard(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121915]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#fffdfa] border-3 border-[#232b28] rounded-2xl w-full max-w-2xl shadow-[6px_6px_0px_#232b28] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Scalloped Top Trim */}
        <div className="roof-scallops-green" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[#232b28]/15 bg-[#faf8f0] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#1b4332] text-white flex items-center justify-center shrink-0 border-2 border-[#232b28] shadow-[2px_2px_0px_#232b28]">
              <UserPlus className="w-6 h-6 text-[#c29437]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#1b4332] text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase">
                  BOCW FORM 1 &bull; REGISTRATION DESK
                </span>
                <span className="text-xs font-black text-[#2e7d32]">
                  ✓ 100% IN-APP &bull; NO EXTERNAL APPS NEEDED
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#232b28] tracking-tight mt-0.5">
                👷 Register Labour (नया मजदूर पंजीकरण)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSpeakGuidance}
              className={`p-2 rounded-xl border-2 border-[#232b28] text-xs font-black flex items-center gap-1 cursor-pointer shadow-[2px_2px_0px_#232b28] active:scale-95 transition-all ${
                isSpeaking ? 'bg-[#ef4444] text-white animate-pulse' : 'bg-[#fef3c7] hover:bg-[#fde68a] text-[#19231f]'
              }`}
              title="Voice Instructions"
            >
              <Volume2 className="w-4 h-4 text-[#1b4332]" />
            </button>
            <button
              onClick={handleResetAndClose}
              className="p-1.5 rounded-xl border-2 border-[#232b28] hover:bg-[#fedbe6] text-[#232b28] cursor-pointer shadow-[2px_2px_0px_#232b28] active:scale-95"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
          {registeredCard ? (
            /* Success State: Official Labour Card Issued */
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 bg-[#d8f1e9] border-2 border-[#1b4332] rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-[#1b4332] shrink-0" />
                <div>
                  <h3 className="text-base font-black text-[#1b4332]">
                    🎉 Labour Registered Successfully! (मजदूर पंजीकरण सफल)
                  </h3>
                  <p className="text-xs text-[#2b4c3e] font-bold">
                    Official Shramik Labour Card generated. The worker can now immediately Sign In (ड्यूटी शुरू) and mark attendance in this app.
                  </p>
                </div>
              </div>

              {/* Physical Official Labour Card Mockup */}
              <div className="border-3 border-[#232b28] rounded-2xl p-5 bg-gradient-to-br from-[#fffdfa] via-[#fcfbf7] to-[#f4ede0] shadow-[4px_4px_0px_#232b28] relative overflow-hidden">
                <div className="absolute top-2 right-2 rubber-stamp-verified text-[10px] rotate-[-5deg]">
                  ✓ REGISTERED
                </div>

                <div className="flex items-start justify-between border-b-2 border-[#232b28]/20 pb-3 mb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#1b4332] tracking-wider block">
                      GOVERNMENT OF BHARAT &bull; BOCW LABOUR ENROLMENT
                    </span>
                    <h4 className="text-lg font-black text-[#232b28]">
                      {registeredCard.name}
                    </h4>
                    <span className="text-xs font-mono font-bold text-[#1e7587]">
                      Card ID: {registeredCard.id}
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border-2 border-[#232b28] shadow-sm">
                    <QRCodeSVG
                      value={JSON.stringify({
                        id: registeredCard.id,
                        name: registeredCard.name,
                        phone: registeredCard.phoneNumber,
                        wage: registeredCard.dailyWage,
                        registeredAt: registeredCard.registeredAt,
                      })}
                      size={64}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-white/80 p-2 rounded-lg border border-[#232b28]/20">
                    <span className="text-[10px] text-[#55694a] block font-bold">Mobile Phone</span>
                    <span className="font-mono font-black text-[#232b28]">{registeredCard.phoneNumber}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-[#232b28]/20">
                    <span className="text-[10px] text-[#55694a] block font-bold">Trade / Skill</span>
                    <span className="font-black text-[#1b4332]">{registeredCard.trade}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-[#232b28]/20">
                    <span className="text-[10px] text-[#55694a] block font-bold">Daily Wage</span>
                    <span className="font-black text-[#2e7d32]">₹{registeredCard.dailyWage}.00 / Day</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-[#232b28]/20 col-span-2 sm:col-span-3">
                    <span className="text-[10px] text-[#55694a] block font-bold">Primary Worksite</span>
                    <span className="font-bold text-[#232b28]">📍 {registeredCard.worksite}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-dashed border-[#232b28]/20 flex items-center justify-between text-[11px] text-[#55694a] font-bold">
                  <span>Enrolled: {new Date(registeredCard.registeredAt).toLocaleDateString()}</span>
                  <span>Sec 63 BSA &bull; Rule 26 Form V</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleResetAndClose();
                  }}
                  className="comic-btn-emerald flex-1 py-3 px-4 text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_#232b28] active:scale-95"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>START WORKING NOW (ड्यूटी शुरू करें)</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="comic-btn-cream py-3 px-4 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#232b28] active:scale-95"
                >
                  <Printer className="w-4 h-4 text-[#1b4332]" />
                  <span>Print Labour Card</span>
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-[#fee2e2] border-2 border-[#ef4444] rounded-xl text-xs font-bold text-[#991b1b] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 1: Personal Details */}
              <div className="comic-inset rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-[#232b28]">
                  <span className="flex items-center gap-1.5 uppercase tracking-wide">
                    <UserPlus className="w-4 h-4 text-[#1e7587]" />
                    1. Worker Identity &amp; Phone (मजदूर का नाम और फोन):
                  </span>
                  <span className="bg-[#fedbe6] px-2 py-0.5 rounded border border-[#232b28] font-mono text-[10px]">
                    Step 1
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#232b28] mb-1">
                      Full Name (पूरा नाम) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rameshwar Yadav"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border-2 border-[#232b28] rounded-xl font-bold text-sm text-[#232b28] focus:outline-none shadow-[2px_2px_0px_#232b28]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#232b28] mb-1">
                      Mobile Number (मोबाइल फोन) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+919876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border-2 border-[#232b28] rounded-xl font-mono font-bold text-sm text-[#232b28] focus:outline-none shadow-[2px_2px_0px_#232b28]"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Trade Skill & Daily Wage */}
              <div className="comic-inset rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-[#232b28]">
                  <span className="flex items-center gap-1.5 uppercase tracking-wide">
                    <Briefcase className="w-4 h-4 text-[#38a169]" />
                    2. Trade Skill &amp; Agreed Daily Wage (काम और दैनिक मजदूरी):
                  </span>
                  <span className="bg-[#d8f1e9] px-2 py-0.5 rounded border border-[#232b28] font-mono text-[10px]">
                    Step 2
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#232b28] mb-1">
                      Skill / Category (काम का प्रकार)
                    </label>
                    <select
                      value={trade}
                      onChange={(e) => handleTradeChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border-2 border-[#232b28] rounded-xl font-bold text-xs sm:text-sm text-[#232b28] focus:outline-none shadow-[2px_2px_0px_#232b28] cursor-pointer"
                    >
                      {TRADES.map((t) => (
                        <option key={t.id} value={t.label}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#232b28] mb-1">
                      Agreed Daily Wage Rate (दैनिक मजदूरी दर ₹)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={300}
                        max={5000}
                        step={50}
                        value={dailyWage}
                        onChange={(e) => setDailyWage(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border-2 border-[#232b28] rounded-xl font-mono font-bold text-sm text-[#232b28] focus:outline-none shadow-[2px_2px_0px_#232b28]"
                      />
                      <div className="flex gap-1 shrink-0">
                        {[600, 750, 800].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setDailyWage(rate)}
                            className={`px-2 py-1.5 rounded-lg border border-[#232b28] text-[11px] font-black cursor-pointer ${
                              dailyWage === rate ? 'bg-[#1b4332] text-white' : 'bg-white text-[#232b28] hover:bg-[#d8f1e9]'
                            }`}
                          >
                            ₹{rate}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Worksite Location */}
              <div className="comic-inset rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-[#232b28]">
                  <span className="flex items-center gap-1.5 uppercase tracking-wide">
                    <MapPin className="w-4 h-4 text-[#e8638b]" />
                    3. Worksite / Construction Project (कार्यस्थल):
                  </span>
                  <span className="bg-[#fef3c7] px-2 py-0.5 rounded border border-[#232b28] font-mono text-[10px]">
                    Step 3
                  </span>
                </div>

                <div className="space-y-2">
                  <select
                    value={worksite}
                    onChange={(e) => {
                      setWorksite(e.target.value);
                      setCustomSite('');
                    }}
                    className="w-full px-3 py-2 bg-white border-2 border-[#232b28] rounded-xl font-bold text-xs sm:text-sm text-[#232b28] focus:outline-none shadow-[2px_2px_0px_#232b28] cursor-pointer"
                  >
                    {DEFAULT_SITES.map((site) => (
                      <option key={site} value={site}>
                        📍 {site}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Or enter custom site/yard name (वैकल्पिक अन्य साइट)"
                    value={customSite}
                    onChange={(e) => setCustomSite(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#232b28]/40 rounded-xl text-xs text-[#232b28] placeholder-[#7d8f78] focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional: Emergency & ID Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-xs font-bold text-[#55694a] mb-1">
                    Emergency Family Contact (आपातकालीन नंबर)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +919876500000"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#232b28]/40 rounded-xl font-mono text-xs text-[#232b28] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#55694a] mb-1">
                    Aadhaar Last 4 Digits (आधार अंतिम 4 अंक)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 4821"
                    value={aadhaarLastFour}
                    onChange={(e) => setAadhaarLastFour(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-white border border-[#232b28]/40 rounded-xl font-mono text-xs text-[#232b28] focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="comic-btn-emerald w-full py-3.5 px-6 text-sm sm:text-base font-black flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_#232b28] hover:shadow-[4px_4px_0px_#232b28] active:translate-y-0.5"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>
                    {isSubmitting ? 'REGISTERING...' : '✅ REGISTER WORKER & ISSUE SHRAMIK CARD (पंजीकरण करें)'}
                  </span>
                </button>
                <p className="text-[11px] text-center text-[#55694a] mt-2 font-bold">
                  ✓ Protected under BOCW Act 1996 &bull; Form V Muster Roll &bull; Sec 63 BSA Digital Certificate
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabourRegistrationModal;
