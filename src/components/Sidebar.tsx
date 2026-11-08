import React, { useState } from 'react';
import { Users, Radio, MapPin, RotateCcw, Search, CheckCircle, BookOpen, HardHat, ClipboardCheck, Volume2, VolumeX, Smartphone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { speakText, stopSpeaking } from '../utils/speech';

interface SidebarProps {
  workers: string[];
  selectedWorker: string;
  onSelectWorker: (worker: string) => void;
  onOpenSimulator: () => void;
  onQuickCheckIn: () => void;
  onResetData: () => void;
  onOpenTutorial: (role?: 'worker' | 'admin') => void;
  onOpenInstallModal?: () => void;
  isAppInstalled?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  workers,
  selectedWorker,
  onSelectWorker,
  onOpenSimulator,
  onQuickCheckIn,
  onResetData,
  onOpenTutorial,
  onOpenInstallModal,
  isAppInstalled = false,
}) => {
  const { language, t } = useLanguage();
  const [directPhone, setDirectPhone] = useState('');

  const handleDirectLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPhone.trim()) return;
    onSelectWorker(directPhone.trim());
  };

  const [isSpeakingSteps, setIsSpeakingSteps] = useState(false);

  const handleSpeakSteps = () => {
    if (isSpeakingSteps) {
      stopSpeaking();
      setIsSpeakingSteps(false);
      return;
    }
    const text = language === 'hi'
      ? 'सरल नियम: 1. अपना फोन नंबर चुनें। 2. काम की जगह चुनें। 3. हाजिरी लगाएं बटन दबाएं और तुरंत 600 रुपये की सरकारी पर्ची पाएं।'
      : 'Simple steps: 1. Choose your phone number. 2. Choose your job location. 3. Tap Mark Attendance to immediately get your 600 rupee slip.';
    setIsSpeakingSteps(true);
    speakText(
      text,
      language,
      () => setIsSpeakingSteps(true),
      () => setIsSpeakingSteps(false)
    );
  };

  return (
    <aside className="w-full lg:w-72 shrink-0 comic-card p-4 sm:p-5 space-y-4 no-print overflow-hidden bg-[#fffdfa]">
      {/* Scalloped Gold Trim */}
      <div className="roof-scallops-gold -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 mb-3" />

      {/* Sidebar Header */}
      <div className="border-b-2 border-[#232b28]/15 pb-2.5">
        <h2 className="text-sm font-black text-[#19231f] uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-[#1b4332] shrink-0" />
          <span>{t.dossierSection}</span>
        </h2>
        <p className="text-xs text-[#3d4a44] mt-0.5 font-bold">
          Pick a worker to view days and wage slips
        </p>
      </div>

      {/* Select Worker Filter */}
      <div className="bg-[#fcfbf7] border-2 border-[#1c2421]/30 rounded-xl p-3">
        <label className="block text-xs font-black text-[#19231f] mb-2 flex items-center justify-between">
          <span>{t.workerDossierSelect}</span>
          <span className="text-xs bg-white text-[#1b4332] px-2 py-0.5 rounded-lg font-mono font-black border border-[#1c2421]/40">
            {workers.length} {t.enrolledCount}
          </span>
        </label>
        <select
          value={selectedWorker}
          onChange={(e) => onSelectWorker(e.target.value)}
          className="w-full px-3 py-2 bg-white border-2 border-[#1c2421] rounded-xl text-xs sm:text-sm font-black text-[#19231f] focus:outline-none cursor-pointer shadow-sm"
        >
          <option value="All Workers" className="bg-white text-[#19231f]">{t.allLaborersOption}</option>
          {workers.map((phone) => (
            <option key={phone} value={phone} className="bg-white text-[#19231f]">
              {phone}
            </option>
          ))}
        </select>
      </div>

      {/* Primary Action Buttons with Tactile Feel */}
      <div className="space-y-2.5">
        <button
          onClick={onQuickCheckIn}
          className="civic-btn-primary w-full inline-flex items-center justify-center gap-2 px-3.5 py-3 text-xs sm:text-sm cursor-pointer active:scale-95 font-black shadow-md"
        >
          <MapPin className="w-4 h-4 text-[#c29437] shrink-0" />
          <span>📌 {t.dispatchGpsPinBtn}</span>
        </button>

        <button
          onClick={onOpenSimulator}
          className="civic-btn-secondary w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm cursor-pointer active:scale-95 font-black"
        >
          <Radio className="w-4 h-4 text-[#1b4332] shrink-0" />
          <span>💬 Open Phone / WhatsApp Simulator</span>
        </button>

        {onOpenInstallModal && (
          <button
            onClick={onOpenInstallModal}
            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm cursor-pointer active:scale-95 font-black bg-[#2e7d32] hover:bg-[#236b27] text-white rounded-xl border-2 border-[#1c2421] shadow-[2px_2px_0px_#1c2421]"
          >
            <Smartphone className="w-4 h-4 text-[#c29437] shrink-0" />
            <span>{isAppInstalled ? '✓ App on Phone' : '📲 Install Android App (ऐप डाउनलोड)'}</span>
          </button>
        )}
      </div>

      {/* Simple Rules Box with Audio Listen */}
      <div className="bg-[#f0f4ea] border-2 border-[#1b4332]/30 rounded-xl p-3.5 text-xs text-[#19231f]">
        <div className="font-black text-[#1b4332] text-xs uppercase mb-2 flex items-center justify-between tracking-wide">
          <span>{t.regulationInstructions}</span>
          <button
            type="button"
            onClick={handleSpeakSteps}
            className="p-1 rounded bg-white hover:bg-[#d8f1e9] border border-[#1b4332] text-[#1b4332] cursor-pointer"
            title="Listen to steps"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#2d3a33] leading-relaxed font-bold">
          <li>{t.instStep1}</li>
          <li>{t.instStep2}</li>
          <li>{t.instStep3}</li>
        </ol>
      </div>

      {/* Direct Search by Phone */}
      <form onSubmit={handleDirectLookup} className="pt-2 border-t border-[#1c2421]/20">
        <label className="block text-xs font-black text-[#1b4332] mb-1.5">
          {t.directWorkerChatLabel}
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="+91..."
            value={directPhone}
            onChange={(e) => setDirectPhone(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 bg-white border-2 border-[#1c2421] rounded-xl text-xs sm:text-sm font-mono font-bold text-[#19231f] placeholder-[#7d8f78] focus:outline-none"
          />
          <button
            type="submit"
            className="civic-btn-secondary px-3.5 py-2 text-xs font-black shrink-0 flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Search className="w-3.5 h-3.5 text-[#1b4332]" />
            <span>{t.chatBtn}</span>
          </button>
        </div>
      </form>

      {/* Reset Records */}
      <div className="pt-2 border-t border-dashed border-[#1c2421]/20">
        <button
          onClick={onResetData}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs text-[#3d4a44] hover:text-[#9b2226] font-bold transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>{t.resetArchivedBtn}</span>
        </button>
      </div>
    </aside>
  );
};
