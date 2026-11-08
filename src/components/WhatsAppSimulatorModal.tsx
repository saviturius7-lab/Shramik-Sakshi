import React, { useState, useRef, useEffect } from 'react';
import { WorkLog, ChatMessage } from '../types';
import { processIncomingWhatsAppMessage, formatISTDateTime, saveOfflinePendingSubmission } from '../services/storage';
import { X, Send, MapPin, Volume2, VolumeX, Mic, CheckCheck, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface WhatsAppSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogCreated: (newLog: WorkLog) => void;
  currentPhoneNumber: string;
}

const PRESET_SITES = [
  { name: 'Peenya Industrial Line 12, Bengaluru (Bengaluru/ಕನ್ನಡ)', lat: 13.0312, lng: 77.5165 },
  { name: 'Sanathnagar Industrial Hub, Hyderabad (Hyderabad/తెలుగు)', lat: 17.4578, lng: 78.4412 },
  { name: 'Guindy Estate Sector 4, Chennai (Chennai/தமிழ்)', lat: 13.0067, lng: 80.2025 },
  { name: 'Willingdon Island Cargo Dock, Kochi (Kochi/മലയാളം)', lat: 9.9482, lng: 76.2731 },
  { name: 'Azadpur Mandi Yard Gate 3, Delhi', lat: 28.7172, lng: 77.1678 },
  { name: 'Dharavi Transit Camp Site 4, Mumbai', lat: 19.0428, lng: 72.8521 },
];

export const WhatsAppSimulatorModal: React.FC<WhatsAppSimulatorModalProps> = ({
  isOpen,
  onClose,
  onLogCreated,
  currentPhoneNumber,
}) => {
  const { language, t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState(currentPhoneNumber || '+919876543210');
  const [inputText, setInputText] = useState('');
  const [selectedSiteIndex, setSelectedSiteIndex] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'bot',
      text: 
        "🛠️ *SHRAMIK SAKSHI • DAILY WORK & WAGE HELPER* 🛠️\n" +
        "------------------------------------------\n" +
        "Namaste! This is your daily work & wage helper.\n\n" +
        "• Tap *Mark Work (₹600)* to save today's attendance.\n" +
        "• Tap *Hisaab* to see total days & money earned.\n" +
        "• Tap *Complaint* if any contractor cuts your wage.\n" +
        "• Tap the speaker 🔊 anytime to listen to this message.",
      timestamp: formatISTDateTime(),
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  // Vernacular Text-to-Speech Engine
  const speakMessage = (text: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown stars/bullets for clean audio narration
    const cleanText = text.replace(/[*_~`#=-]/g, ' ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Map language code to BCP 47
    const langMap: Record<string, string> = {
      hi: 'hi-IN',
      kn: 'kn-IN',
      te: 'te-IN',
      ta: 'ta-IN',
      ml: 'ml-IN',
      en: 'en-IN',
    };
    utterance.lang = langMap[language] || 'hi-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (body: string, lat?: number, lng?: number, locationName?: string) => {
    if (!body && !lat) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: body,
      timestamp: formatISTDateTime(),
      isLocationPin: lat !== undefined,
      latitude: lat,
      longitude: lng,
      locationName,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    setTimeout(async () => {
      const { reply, newLog } = processIncomingWhatsAppMessage(
        phoneNumber,
        body,
        lat,
        lng,
        locationName
      );

      const botMsgId = `bot_${Date.now()}`;
      const botMsg: ChatMessage = {
        id: botMsgId,
        sender: 'bot',
        text: reply,
        timestamp: formatISTDateTime(),
      };

      setMessages((prev) => [...prev, botMsg]);

      if (newLog) {
        onLogCreated(newLog);
      }

      // Auto-narrate response for voice accessibility
      speakMessage(reply, botMsgId);

      // Dispatch to backend API
      try {
        if (!navigator.onLine) {
          throw new Error('Offline');
        }
        await fetch('/api/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phoneNumber,
            body: body || 'Location Pin',
            latitude: lat,
            longitude: lng,
            locationName,
          }),
        });
      } catch {
        if (newLog) {
          await saveOfflinePendingSubmission(newLog);
        }
      }
    }, 300);
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
  };

  const handleSendPresetLocation = () => {
    const site = PRESET_SITES[selectedSiteIndex];
    sendMessage(`Location Pin: ${site.name}`, site.lat, site.lng, site.name);
  };

  const handleSendBrowserGPS = () => {
    if (!navigator.geolocation) {
      handleSendPresetLocation();
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        sendMessage(
          `Location Pin: Live Field Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          latitude,
          longitude,
          'Verified GPS Broadcast Pin'
        );
      },
      (err) => {
        setIsLocating(false);
        handleSendPresetLocation();
      },
      { timeout: 8000 }
    );
  };

  const handleSimulateVoicePunch = () => {
    setIsRecordingVoice(true);
    setTimeout(() => {
      setIsRecordingVoice(false);
      const site = PRESET_SITES[selectedSiteIndex];
      sendMessage(
        `🎙️ [Voice Punch] "हाजिरी लगाओ, मैं ${site.name.split(',')[0]} पर काम कर रहा हूँ"`,
        site.lat,
        site.lng,
        site.name
      );
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1c2421]/65 backdrop-blur-xs font-sans">
      <div className="civic-card max-w-lg w-full overflow-hidden shadow-2xl flex flex-col h-[700px] max-h-[94vh] bg-white rounded-lg">
        {/* Official WhatsApp Web / Field Header */}
        <div className="bg-[#075e54] p-3 text-white flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#128c7e] border border-white/20 flex items-center justify-center text-white shrink-0 font-bold">
              🏛️
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5 leading-tight truncate">
                <span>Shramik Sakshi Civic Desk</span>
                <span className="text-[10px] text-[#25d366]">●</span>
              </div>
              <div className="text-[10px] text-white/80 font-mono truncate mt-0.5">
                Official BOCW Automated Ingress · Verified Wire
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
            aria-label="Close Chat Window"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Worker Phone Dial Bar */}
        <div className="bg-[#f0f2f5] border-b border-[#1c2421]/15 px-3 py-1.5 text-xs flex items-center justify-between gap-2 text-[#19231f]">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[10px] font-bold text-[#3d4a44] uppercase tracking-wide">Worker SIM:</span>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="px-2 py-0.5 rounded bg-white border border-[#1c2421]/30 text-xs font-mono font-bold text-[#19231f] focus:outline-none flex-1 max-w-[160px]"
              placeholder="+91..."
            />
          </div>
          <span className="text-[10px] bg-[#e8f5e9] text-[#1b4332] font-bold px-2 py-0.5 rounded border border-[#1b4332]/30 shrink-0">
            SEC 65B READY
          </span>
        </div>

        {/* Chat Stream (Parchment background with authentic bubbles) */}
        <div 
          className="flex-1 overflow-y-auto p-3.5 space-y-3"
          style={{ backgroundColor: '#efeae2', backgroundImage: 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        >
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed shadow-xs relative ${
                    isBot 
                      ? 'bg-white text-[#19231f] rounded-tl-none border border-[#1c2421]/10' 
                      : 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none border border-[#25d366]/30'
                  }`}
                >
                  {/* Vernacular Voice Note Audio Playback Button for Bot Messages */}
                  {isBot && (
                    <div className="mb-2 pb-1.5 border-b border-[#1c2421]/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => speakMessage(msg.text, msg.id)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0f2f5] hover:bg-[#e8f5e9] text-[#1b4332] text-[11px] font-bold border border-[#1c2421]/20 cursor-pointer transition-colors"
                        title="Listen to this message in your chosen language"
                      >
                        {speakingMessageId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-[#9b2226] animate-pulse" />
                            <span>रोके (Stop Audio)</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[#1b4332]" />
                            <span>सुनिए / ಆಲಿಸಿ (Play Voice Note)</span>
                          </>
                        )}
                      </button>
                      <span className="text-[9px] font-mono text-[#3d4a44]">IVR 14434</span>
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {msg.text}
                  </div>

                  {/* Timestamp & double ticks */}
                  <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-[#667781] font-mono">
                    <span>{msg.timestamp.slice(-8)}</span>
                    {!isBot && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* WhatsApp Native Interactive Quick-Reply Buttons */}
        <div className="bg-[#f0f2f5] p-2 border-t border-[#1c2421]/15 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 min-w-max">
            <span className="text-[10px] font-black uppercase text-[#3d4a44] mr-1">Quick Action:</span>
            
            <button
              onClick={() => handleSendBrowserGPS()}
              disabled={isLocating}
              className="px-2.5 py-1 bg-white hover:bg-[#d9fdd3] text-[#111b21] rounded-full border border-[#1c2421]/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <MapPin className="w-3 h-3 text-[#1b4332]" />
              <span>{isLocating ? 'Locating...' : '📍 Send GPS Pin'}</span>
            </button>

            <button
              onClick={() => sendMessage('2')}
              className="px-2.5 py-1 bg-white hover:bg-[#d9fdd3] text-[#111b21] rounded-full border border-[#1c2421]/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <span>📊 Hisaab (Passbook)</span>
            </button>

            <button
              onClick={() => sendMessage('3')}
              className="px-2.5 py-1 bg-white hover:bg-[#ffebee] text-[#9b2226] rounded-full border border-[#9b2226]/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <span>🚨 File Dispute</span>
            </button>

            <button
              onClick={() => sendMessage('4')}
              className="px-2.5 py-1 bg-white hover:bg-[#d9fdd3] text-[#111b21] rounded-full border border-[#1c2421]/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <span>📜 Minimum Wage</span>
            </button>

            <button
              onClick={() => sendMessage('5')}
              className="px-2.5 py-1 bg-white hover:bg-[#d9fdd3] text-[#111b21] rounded-full border border-[#1c2421]/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <span>📞 Helplines</span>
            </button>
          </div>
        </div>

        {/* Input Bar with Voice Punch */}
        <div className="bg-[#f0f2f5] p-2.5 border-t border-[#1c2421]/15 flex items-center gap-2">
          {/* Worksite Preset Selector */}
          <select
            value={selectedSiteIndex}
            onChange={(e) => setSelectedSiteIndex(Number(e.target.value))}
            className="text-xs bg-white border border-[#1c2421]/30 rounded px-2 py-1.5 font-medium max-w-[140px] truncate focus:outline-none"
            aria-label="Select Worksite Location"
          >
            {PRESET_SITES.map((site, idx) => (
              <option key={idx} value={idx}>
                {site.name.split(',')[0]}
              </option>
            ))}
          </select>

          {/* Text Input */}
          <form onSubmit={handleSendText} className="flex-1 flex items-center gap-1.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or reply 1, 2, 3..."
              className="flex-1 bg-white border border-[#1c2421]/30 rounded-lg px-3 py-1.5 text-xs text-[#19231f] focus:outline-none focus:ring-1 focus:ring-[#075e54]"
            />
            
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-8 h-8 rounded-full bg-[#075e54] disabled:opacity-40 text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors hover:bg-[#128c7e]"
              aria-label="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Voice Punch Simulator Button */}
          <button
            onClick={handleSimulateVoicePunch}
            disabled={isRecordingVoice}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
              isRecordingVoice
                ? 'bg-[#9b2226] text-white animate-pulse'
                : 'bg-[#1b4332] text-white hover:bg-[#2d6a4f]'
            }`}
            title="Simulate speaking attendance in vernacular voice note"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isRecordingVoice ? 'Listening...' : 'Voice Punch'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSimulatorModal;
