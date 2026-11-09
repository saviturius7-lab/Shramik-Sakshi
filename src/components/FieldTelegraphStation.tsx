import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Send, CheckCircle2, FileText, Phone, Building2, HelpCircle, 
  AlertTriangle, Printer, Sparkles, Volume2, VolumeX, LogIn, LogOut, 
  Clock, UserPlus, ShieldCheck 
} from 'lucide-react';
import { WorkLog } from '../types';
import { 
  formatISTDateTime, processTelegraphTransmission, saveOfflinePendingSubmission, 
  recordCheckOutForLog, getStoredLabourers 
} from '../services/storage';
import { appendOfflineWal } from '../services/offlineWal';
import { fetchWithAuth } from '../services/auth';
import { useLanguage } from '../context/LanguageContext';
import { speakText, stopSpeaking } from '../utils/speech';

interface FieldTelegraphStationProps {
  onLogReceived: (log: WorkLog) => void;
  onRefreshLedger: () => void;
  onOpenReceipt: (log: WorkLog) => void;
  selectedWorker: string;
  workers: string[];
  userRole?: string;
  onOpenLabourRegistration?: () => void;
  activeShiftLog?: WorkLog | null;
  onCheckOutShift?: (log: WorkLog) => void;
}

interface MessageTapeEntry {
  id: string;
  sender: 'WORKER' | 'DESK';
  text: string;
  timestamp: string;
  isPunch?: boolean;
  log?: WorkLog;
}

const POPULAR_HUBS = [
  { name: 'Peenya Industrial Area, Bengaluru (ಬೆಂಗಳೂರು)', lat: 13.0312, lng: 77.5165 },
  { name: 'Sanathnagar Industrial Hub, Hyderabad (హైదరాబాద్)', lat: 17.4578, lng: 78.4412 },
  { name: 'Guindy Industrial Estate, Chennai (சென்னை)', lat: 13.0067, lng: 80.2025 },
  { name: 'Willingdon Cargo Dock, Kochi (കൊച്ചി)', lat: 9.9482, lng: 76.2731 },
  { name: 'Azadpur Mandi Yard, North Delhi (दिल्ली)', lat: 28.7172, lng: 77.1678 },
  { name: 'Dharavi Sector 5, Mumbai (मुंबई)', lat: 19.0428, lng: 72.8521 },
];

export const FieldTelegraphStation: React.FC<FieldTelegraphStationProps> = ({
  onLogReceived,
  onRefreshLedger,
  onOpenReceipt,
  selectedWorker,
  workers,
  userRole = 'worker',
  onOpenLabourRegistration,
  activeShiftLog,
  onCheckOutShift,
}) => {
  const [workerPhone, setWorkerPhone] = useState<string>(() => {
    return selectedWorker !== 'All Workers' ? selectedWorker : '+919876543210';
  });

  const [dailyWage, setDailyWage] = useState<number>(() => {
    const labourers = getStoredLabourers();
    const phone = selectedWorker !== 'All Workers' ? selectedWorker : '+919876543210';
    const found = labourers.find(l => l.phoneNumber === phone);
    return found?.dailyWage || 600;
  });

  useEffect(() => {
    if (selectedWorker !== 'All Workers') {
      setWorkerPhone(selectedWorker);
      const labourers = getStoredLabourers();
      const found = labourers.find(l => l.phoneNumber === selectedWorker);
      if (found?.dailyWage) {
        setDailyWage(found.dailyWage);
      }
    }
  }, [selectedWorker]);

  const [selectedHubIdx, setSelectedHubIdx] = useState(0);
  const [customText, setCustomText] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSlip, setLastSlip] = useState<WorkLog | null>(null);

  // Live timer for active shift duration
  const [elapsedDuration, setElapsedDuration] = useState<{ hours: number; minutes: number }>({ hours: 0, minutes: 0 });

  useEffect(() => {
    if (!activeShiftLog) {
      setElapsedDuration({ hours: 0, minutes: 0 });
      return;
    }

    const updateDuration = () => {
      const startTime = new Date(activeShiftLog.check_in_time || activeShiftLog.created_at).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - startTime);
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      setElapsedDuration({
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
      });
    };

    updateDuration();
    const interval = setInterval(updateDuration, 15000);
    return () => clearInterval(interval);
  }, [activeShiftLog]);

  const [messages, setMessages] = useState<MessageTapeEntry[]>([
    {
      id: 'init_welcome',
      sender: 'DESK',
      text: 
        "🛠️ SHRAMIK SAKSHI • DAILY WORK & WAGE DESK\n" +
        "--------------------------------------------------\n" +
        "• Tap 'Sign In (ड्यूटी शुरू)' when arriving on site to lock ₹600.\n" +
        "• Tap 'Sign Off (छुट्टी दर्ज करें)' when leaving to seal shift hours.\n" +
        "• Tap 'Check Hisaab' to view passbook days & earnings.\n" +
        "• Tap 'File Complaint' if a contractor refuses your wage.",
      timestamp: formatISTDateTime(),
    },
  ]);

  const tapeEndRef = useRef<HTMLDivElement>(null);

  // Telegraph Web Audio Relay Chirp
  const playTelegraphChirp = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // Audio autoplay gracefully handled
    }
  };

  useEffect(() => {
    tapeEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (body: string, lat?: number, lng?: number, locationName?: string) => {
    if (!workerPhone.trim()) {
      alert('Please enter or select a worker phone number.');
      return;
    }

    playTelegraphChirp();
    setIsSubmitting(true);

    const userEntry: MessageTapeEntry = {
      id: `u_${Date.now()}`,
      sender: 'WORKER',
      text: body || `Marked Work at ${locationName}`,
      timestamp: formatISTDateTime(),
      isPunch: lat !== undefined,
    };

    setMessages((prev) => [...prev, userEntry]);
    setCustomText('');

    // Local finite state parser
    const localResult = processTelegraphTransmission(
      workerPhone,
      body,
      lat,
      lng,
      locationName
    );

    if (localResult.newLog) {
      localResult.newLog.agreed_wage = dailyWage;
      localResult.newLog.actual_wage_earned = dailyWage;
      localResult.newLog.estimated_wage = dailyWage;
      onLogReceived(localResult.newLog);
      userEntry.log = localResult.newLog;
      setLastSlip(localResult.newLog);
    }

    // Server persistence with automatic offline buffering
    try {
      if (!navigator.onLine) {
        throw new Error('Device is offline');
      }
      const res = await fetchWithAuth('/api/dispatch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': userRole,
          'x-worker-phone': workerPhone,
        },
        body: JSON.stringify({
          phone: workerPhone,
          body,
          latitude: lat,
          longitude: lng,
          siteName: locationName,
          agreedWage: dailyWage,
        }),
      });
      if (!res.ok) {
        throw new Error(`Dispatch error status ${res.status}`);
      }
      onRefreshLedger();
    } catch {
      // Offline mode or network disruption: save to IndexedDB queue & cryptographic WAL
      if (localResult.newLog) {
        await saveOfflinePendingSubmission(localResult.newLog);
        await appendOfflineWal('CHECK_IN', workerPhone, {
          locationName,
          latitude: lat,
          longitude: lng,
          rawMessage: body,
          estimatedWage: dailyWage,
        });
      }
    }

    setTimeout(() => {
      setIsSubmitting(false);
      const deskEntry: MessageTapeEntry = {
        id: `d_${Date.now()}`,
        sender: 'DESK',
        text: localResult.reply,
        timestamp: formatISTDateTime(),
        log: localResult.newLog,
      };

      setMessages((prev) => [...prev, deskEntry]);
    }, 250);
  };

  const handlePunchAttendance = () => {
    const hub = POPULAR_HUBS[selectedHubIdx];
    handleSendMessage(`Shift Sign-In: ${hub.name}`, hub.lat, hub.lng, hub.name);
  };

  const handleSignOffShift = async () => {
    if (!activeShiftLog && !selectedWorker) return;
    setIsSubmitting(true);
    playTelegraphChirp();

    const targetId = activeShiftLog ? activeShiftLog.id : undefined;

    try {
      const res = await fetchWithAuth('/api/attendance/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
          'x-worker-phone': workerPhone,
        },
        body: JSON.stringify({
          attendanceId: targetId,
          phoneNumber: workerPhone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.log) {
          onCheckOutShift?.(data.log);
          setLastSlip(data.log);
          onRefreshLedger();
          const deskEntry: MessageTapeEntry = {
            id: `d_${Date.now()}`,
            sender: 'DESK',
            text: `🔴 SHIFT EGRESS & SIGN-OFF SEALED!\n----------------------------------------\nWorker: ${workerPhone}\nDuration: ${data.log.hours_worked} hrs\nStatus: ${data.log.shift_status?.toUpperCase()}\nEarned Wage: ₹${data.log.actual_wage_earned}\nSlip Token: ${data.log.verification_token}\nOfficial Slip issued & recorded in muster roll.`,
            timestamp: formatISTDateTime(),
            log: data.log,
          };
          setMessages((prev) => [...prev, deskEntry]);
        }
      } else {
        if (targetId) {
          const { updatedLog } = recordCheckOutForLog(targetId);
          if (updatedLog) {
            onCheckOutShift?.(updatedLog);
            setLastSlip(updatedLog);
            onRefreshLedger();
          }
        }
      }
    } catch {
      if (targetId) {
        const { updatedLog } = recordCheckOutForLog(targetId);
        if (updatedLog) {
          onCheckOutShift?.(updatedLog);
          setLastSlip(updatedLog);
          onRefreshLedger();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseDeviceGps = () => {
    if (!navigator.geolocation) {
      alert('Device GPS not available. Using selected city site.');
      handlePunchAttendance();
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        handleSendMessage(
          `Shift Sign-In: Live GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          latitude,
          longitude,
          'Live Device Location'
        );
      },
      (err) => {
        setIsLocating(false);
        alert(`Could not get GPS location (${err.message}). Using selected site.`);
        handlePunchAttendance();
      },
      { timeout: 7000 }
    );
  };

  const [isSpeakingGuide, setIsSpeakingGuide] = useState(false);

  const handleToggleGuideAudio = () => {
    if (isSpeakingGuide) {
      stopSpeaking();
      setIsSpeakingGuide(false);
      return;
    }

    let guideText = '';
    if (activeShiftLog) {
      guideText = `आपकी ड्यूटी चालू है। काम खत्म होने पर लाल रंग का छुट्टी दर्ज करें बटन दबाएं। आपका समय और मजदूरी सुरक्षित हो जाएगी।`;
    } else {
      guideText = 'पहला कदम: अपना फोन नंबर चुनें। दूसरा कदम: काम की जगह चुनें। तीसरा कदम: बड़ा हरा बटन दबाकर ड्यूटी शुरू करें। आपकी आज की हाजिरी तुरंत दर्ज होगी और 600 रुपये की पक्की पर्ची बन जाएगी।';
    }

    setIsSpeakingGuide(true);
    speakText(
      guideText,
      'hi',
      () => setIsSpeakingGuide(true),
      () => setIsSpeakingGuide(false)
    );
  };

  return (
    <div className="comic-card rounded-2xl p-4 sm:p-6 mb-6 overflow-hidden bg-[#fffdfa]">
      {/* Scalloped Roof Trim */}
      <div className="roof-scallops-green -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4" />

      {/* Station Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-2 border-[#232b28]/15 pb-3.5 mb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-[#232b28] flex items-center gap-2">
              <span>✍️ Mark Attendance &amp; Shifts (हाजिरी और ड्यूटी)</span>
            </h2>
            <button
              onClick={handleToggleGuideAudio}
              className={`px-3 py-1 rounded-xl border-2 border-[#232b28] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#232b28] active:scale-95 transition-all ${
                isSpeakingGuide ? 'bg-[#ef4444] text-white animate-pulse' : 'bg-[#fef3c7] hover:bg-[#fde68a] text-[#19231f]'
              }`}
              title="Listen to voice instructions"
              aria-label="Listen to voice instructions"
            >
              <Volume2 className="w-4 h-4 text-[#1b4332]" />
              <span>{isSpeakingGuide ? 'Stop Voice (रोकें)' : '🔊 Listen Steps (बोलकर समझें)'}</span>
            </button>
            {onOpenLabourRegistration && (
              <button
                onClick={onOpenLabourRegistration}
                className="px-3 py-1 rounded-xl border-2 border-[#232b28] text-xs font-black flex items-center gap-1.5 cursor-pointer bg-[#d8f1e9] hover:bg-[#bbf0df] text-[#1b4332] shadow-[2px_2px_0px_#232b28] active:scale-95 transition-all"
                title="Register a new labourer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Register New Labour (नया मजदूर जोड़ें)</span>
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#4d5e46] mt-1 font-bold">
            Sign In when starting work, Sign Off when finishing. Certified in-app contemporaneous muster records under Section 63 BSA.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-black text-[#1b4332] bg-[#d8f1e9] px-3.5 py-1.5 rounded-xl border-2 border-[#232b28] shadow-[2px_2px_0px_#232b28]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1b4332] animate-ping" />
          <span>Protected Agreed Rate: ₹{dailyWage}.00 / Day (तय मजदूरी दर)</span>
        </div>
      </div>

      {/* Main 2-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Shift In/Out & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Active Shift Status Banner (If Worker is on duty) */}
          {activeShiftLog && (
            <div className="p-4 bg-gradient-to-r from-[#ecfdf5] to-[#d1fae5] border-3 border-[#059669] rounded-2xl shadow-[4px_4px_0px_#065f46] animate-in fade-in">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#10b981] animate-ping inline-block" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#065f46] bg-white px-2.5 py-0.5 rounded-lg border border-[#059669]">
                    🟢 SHIFT IN PROGRESS (ड्यूटी चालू है)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#065f46]">
                    Started: {formatISTDateTime(activeShiftLog.check_in_time || activeShiftLog.created_at).slice(11, 16)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-3 text-xs">
                <div className="bg-white/90 p-2.5 rounded-xl border border-[#059669]/30">
                  <span className="text-[10px] text-[#065f46] font-bold block flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Elapsed Time
                  </span>
                  <span className="text-base font-black text-[#065f46] font-mono">
                    {elapsedDuration.hours}h {elapsedDuration.minutes}m
                  </span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-xl border border-[#059669]/30">
                  <span className="text-[10px] text-[#065f46] font-bold block">Accrued Wage</span>
                  <span className="text-base font-black text-[#15803d]">
                    {elapsedDuration.hours < 4 
                      ? `₹${(dailyWage * 0.5).toFixed(0)} (Half-Day)` 
                      : elapsedDuration.hours > 8.5 
                      ? `₹${(dailyWage + (elapsedDuration.hours - 8.0) * (dailyWage / 8.0) * 2).toFixed(0)} (OT 2x)` 
                      : `₹${dailyWage} (Full Day)`}
                  </span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-xl border border-[#059669]/30 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-[#065f46] font-bold block">Current Site</span>
                  <span className="font-bold text-[#1f2937] truncate block">
                    📍 {activeShiftLog.location_name || 'Active Worksite'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOffShift}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl font-black text-sm sm:text-base border-2 border-[#1c2421] shadow-[3px_3px_0px_#1c2421] flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
              >
                <LogOut className="w-5 h-5 text-white" />
                <span>🔴 SIGN OFF / COMPLETE SHIFT (ड्यूटी समाप्त / छुट्टी दर्ज करें)</span>
              </button>
            </div>
          )}

          {/* Step 1: Worker Phone */}
          <div className="comic-inset rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-black text-[#232b28] flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#1e7587]" />
                1. Worker Phone Number (मजदूर का फोन नंबर):
              </label>
              <span className="text-xs text-[#232b28] font-black bg-[#fedbe6] px-2 py-0.5 rounded border-2 border-[#232b28]">
                Step 1
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
              <input
                type="text"
                value={workerPhone}
                onChange={(e) => setWorkerPhone(e.target.value)}
                placeholder="+91..."
                className="w-full px-3 py-2 bg-white border-2 border-[#232b28] rounded-xl font-mono font-bold text-sm text-[#232b28] focus:outline-none shadow-[2px_2px_0px_#232b28]"
              />

              <select
                value={workerPhone}
                onChange={(e) => {
                  const newPhone = e.target.value;
                  setWorkerPhone(newPhone);
                  const labourers = getStoredLabourers();
                  const found = labourers.find((l) => l.phoneNumber === newPhone);
                  if (found?.dailyWage) setDailyWage(found.dailyWage);
                }}
                className="w-full px-2.5 py-2 bg-white border-2 border-[#232b28] rounded-xl font-bold text-xs sm:text-sm text-[#232b28] focus:outline-none shadow-[2px_2px_0px_#232b28] cursor-pointer"
              >
                <option value={workerPhone}>{workerPhone} (Active)</option>
                {workers.filter((w) => w !== workerPhone).map((phone) => (
                  <option key={phone} value={phone} className="bg-white text-[#232b28]">
                    {phone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: Work Location */}
          <div className="comic-inset rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-black text-[#232b28] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#38a169]" />
                2. Work Location (काम की जगह):
              </label>
              <span className="text-xs text-[#232b28] font-black bg-[#d8f1e9] px-2 py-0.5 rounded border-2 border-[#232b28]">
                Step 2
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
              <select
                value={selectedHubIdx}
                onChange={(e) => setSelectedHubIdx(Number(e.target.value))}
                className="flex-1 px-3 py-2 bg-white border-2 border-[#232b28] rounded-xl font-black text-xs sm:text-sm text-[#232b28] focus:outline-none shadow-[2px_2px_0px_#232b28] cursor-pointer"
              >
                {POPULAR_HUBS.map((hub, idx) => (
                  <option key={hub.name} value={idx} className="bg-white text-[#232b28]">
                    📍 {hub.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleUseDeviceGps}
                disabled={isLocating || isSubmitting}
                className="comic-btn-cream px-4 py-2 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
              >
                <MapPin className={`w-4 h-4 ${isLocating ? 'animate-bounce text-[#e8638b]' : 'text-[#e8638b]'}`} />
                <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
              </button>
            </div>
          </div>

          {/* Dynamic Agreed Wage Rate Selector */}
          <div className="comic-inset rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-black text-[#232b28] flex items-center gap-2">
                <span>💰 3. Agreed Daily Wage Rate (तय दिहाड़ी दर):</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-black text-[#1b4332]">₹</span>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="50"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(Math.max(100, Number(e.target.value) || 600))}
                  className="w-24 px-2 py-1 bg-white border-2 border-[#232b28] rounded-xl text-sm font-black font-mono text-[#1b4332] shadow-[2px_2px_0px_#232b28] text-center"
                />
                <span className="text-xs font-bold text-[#4d5e46]">/ shift</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-bold text-[#4d5e46]">Quick rates:</span>
              {[500, 600, 750, 850, 1000].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setDailyWage(rate)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono border-2 transition-all cursor-pointer ${
                    dailyWage === rate
                      ? 'bg-[#1b4332] text-white border-[#232b28] shadow-[2px_2px_0px_#232b28]'
                      : 'bg-white text-[#19231f] border-[#232b28]/30 hover:border-[#232b28]'
                  }`}
                >
                  ₹{rate}
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Tactile Shift Sign-In & Attendance Buttons */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handlePunchAttendance}
                disabled={isSubmitting}
                className="comic-btn-emerald flex-1 py-4 px-5 text-sm sm:text-base font-black tracking-wide flex items-center justify-center gap-2.5 cursor-pointer shadow-[3px_3px_0px_#232b28] hover:shadow-[4px_4px_0px_#232b28] active:translate-y-0.5"
              >
                <LogIn className="w-6 h-6 text-white shrink-0" />
                <span>🟢 SIGN IN / START SHIFT • ₹{dailyWage} (ड्यूटी शुरू करें)</span>
              </button>

              {activeShiftLog && (
                <button
                  type="button"
                  onClick={handleSignOffShift}
                  disabled={isSubmitting}
                  className="py-4 px-5 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl font-black text-sm sm:text-base border-2 border-[#1c2421] shadow-[3px_3px_0px_#1c2421] flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 shrink-0"
                >
                  <LogOut className="w-5 h-5 text-white" />
                  <span>🔴 SIGN OFF (छुट्टी दर्ज करें)</span>
                </button>
              )}
            </div>
            <p className="text-xs text-center text-[#2e7d32] font-black">
              ✓ All-in-one: Records start time, GPS coordinates, and issues tamper-evident muster slip.
            </p>
          </div>

          {/* Instant Slip Banner when slip was just generated */}
          {lastSlip && (
            <div className="p-3.5 bg-[#dcfce7] border-2 border-[#166534] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🎉</span>
                <div>
                  <div className="text-xs sm:text-sm font-black text-[#166534]">
                    Work Recorded! Today's ₹{lastSlip.actual_wage_earned || dailyWage} Slip is Ready.
                  </div>
                  <div className="text-xs font-mono font-bold text-[#15803d]">
                    Slip Number: #{lastSlip.verification_token} ({lastSlip.shift_status || 'verified'})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenReceipt(lastSlip)}
                className="comic-btn-pink px-4 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <FileText className="w-4 h-4" />
                <span>Open &amp; Print Slip (पर्ची देखें)</span>
              </button>
            </div>
          )}

          {/* Quick Helpful In-App Services */}
          <div className="pt-1">
            <span className="text-xs font-black text-[#232b28] block mb-2 uppercase tracking-wider">
              In-App Labour Welfare Tools:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleSendMessage('Hisaab')}
                disabled={isSubmitting}
                className="comic-btn-cream p-3 rounded-xl text-left flex flex-col justify-between cursor-pointer active:scale-95 group"
              >
                <span className="text-[#1e7587] text-sm font-black">📊 Check Hisaab</span>
                <span className="text-[11px] text-[#55694a] mt-1 font-semibold">Total Days &amp; Pay</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage('Shikayat')}
                disabled={isSubmitting}
                className="comic-btn-cream p-3 rounded-xl text-left flex flex-col justify-between cursor-pointer active:scale-95 group"
              >
                <span className="text-[#e8638b] text-sm font-black">🚨 File Complaint</span>
                <span className="text-[11px] text-[#55694a] mt-1 font-semibold">Report Unpaid Wage</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage('Rate')}
                disabled={isSubmitting}
                className="comic-btn-cream p-3 rounded-xl text-left flex flex-col justify-between cursor-pointer active:scale-95 group"
              >
                <span className="text-[#38a169] text-sm font-black">📜 Wage Rules</span>
                <span className="text-[11px] text-[#55694a] mt-1 font-semibold">₹600 Legal Rate</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage('Help')}
                disabled={isSubmitting}
                className="comic-btn-cream p-3 rounded-xl text-left flex flex-col justify-between cursor-pointer active:scale-95 group"
              >
                <span className="text-[#d97706] text-sm font-black">📞 Free Help</span>
                <span className="text-[11px] text-[#55694a] mt-1 font-semibold">Labour Helpline</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Work Slip & Message Output (5 cols) */}
        <div className="lg:col-span-5 comic-inset rounded-2xl p-4 flex flex-col justify-between h-[510px] bg-[#fcf8ec]">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-[#232b28]/20 pb-2.5 mb-2.5">
            <span className="text-xs font-black text-[#232b28] flex items-center gap-2 uppercase tracking-wide">
              <Printer className="w-4 h-4 text-[#1e7587]" />
              Official Attendance Log &amp; Slip
            </span>
            <span className="text-[11px] font-black text-[#232b28] bg-[#d8f1e9] px-2.5 py-0.5 rounded-full border border-[#232b28]">
              ● IN-APP REGISTER
            </span>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs sm:text-sm scrollbar-thin">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-3.5 rounded-2xl border-2 border-[#232b28] leading-relaxed shadow-[2px_2px_0px_#232b28] transition-all ${
                  m.sender === 'WORKER'
                    ? 'bg-[#fedbe6] text-[#232b28]'
                    : 'bg-[#ffffff] text-[#232b28]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-black border-b border-[#232b28]/20 pb-1 mb-2 text-[#4d5e46]">
                  <span className="font-mono">
                    {m.sender === 'WORKER' ? `Worker: ${workerPhone}` : 'Shramik Sakshi Desk'}
                  </span>
                  <span className="font-mono text-[#1e7587]">{m.timestamp.slice(11, 19)}</span>
                </div>

                <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed font-semibold">
                  {m.text}
                </div>

                {/* Instant View Slip Button */}
                {m.log && (
                  <div className="mt-3 pt-2.5 border-t-2 border-dashed border-[#232b28]/30 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-black text-[#1e7587]">
                      Slip: {m.log.verification_token}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenReceipt(m.log!)}
                      className="comic-btn-pink px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>VIEW OFFICIAL SLIP (पर्ची देखें)</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={tapeEndRef} />
          </div>

          {/* Quick command input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customText.trim()) handleSendMessage(customText.trim());
            }}
            className="mt-3 pt-2.5 border-t-2 border-[#232b28]/20 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Type: 'Hisaab' or '2' for wage passbook..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 bg-white border-2 border-[#232b28] rounded-xl text-xs sm:text-sm text-[#232b28] placeholder-[#7d8f78] focus:outline-none shadow-[2px_2px_0px_#232b28]"
            />
            <button
              type="submit"
              disabled={isSubmitting || !customText.trim()}
              className="comic-btn-teal px-4 py-2 text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>SEND</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FieldTelegraphStation;
