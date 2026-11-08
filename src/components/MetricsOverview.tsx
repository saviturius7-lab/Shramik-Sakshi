import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Users, Calendar, Banknote, ShieldCheck, Volume2, CheckCircle2 } from 'lucide-react';
import { speakText, stopSpeaking } from '../utils/speech';

interface MetricsOverviewProps {
  activeLaborers: number;
  totalDays: number;
  totalCapital: number;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  activeLaborers,
  totalDays,
  totalCapital,
}) => {
  const { language, t } = useLanguage();
  const [activeSpeechCard, setActiveSpeechCard] = useState<string | null>(null);

  const speakCard = (cardKey: string, text: string) => {
    if (activeSpeechCard === cardKey) {
      stopSpeaking();
      setActiveSpeechCard(null);
      return;
    }
    setActiveSpeechCard(cardKey);
    speakText(
      text,
      language,
      () => setActiveSpeechCard(cardKey),
      () => setActiveSpeechCard(null)
    );
  };

  return (
    <div className="mb-6">
      {/* 3 Simple, Clear Metric Cards with Voice Read-Aloud */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Registered Workers */}
        <div className="comic-card p-4 sm:p-5 flex flex-col justify-between group bg-[#fffef9]">
          <div className="flex items-center justify-between gap-2 border-b-2 border-[#232b28]/15 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#1e7587] text-white border-2 border-[#232b28] shadow-[1px_1px_0px_#232b28]">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase text-[#232b28] tracking-wider">
                {t.tab1Title}
              </span>
            </div>
            <button
              onClick={() =>
                speakCard(
                  'workers',
                  language === 'hi'
                    ? `रजिस्टर में कुल ${activeLaborers} मजदूर दर्ज हैं।`
                    : `There are ${activeLaborers} registered workers in this ledger.`
                )
              }
              className="p-1.5 rounded-lg border border-[#232b28] bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0369a1] text-xs font-bold cursor-pointer"
              title="Listen to this count"
              aria-label="Listen to worker count"
            >
              <Volume2 className={`w-3.5 h-3.5 ${activeSpeechCard === 'workers' ? 'text-red-500 animate-bounce' : ''}`} />
            </button>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-[#232b28] my-1 font-mono tabular-nums tracking-tight">
            {String(activeLaborers).padStart(2, '0')}
          </div>

          <div className="text-xs text-[#55694a] font-bold leading-relaxed">
            {t.tab1Desc}
          </div>

          <div className="mt-3 pt-2 border-t-2 border-dashed border-[#232b28]/20 text-xs font-black text-[#1e7587] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1e7587]" />
              <span>{t.tab1Foot}</span>
            </span>
          </div>
        </div>

        {/* Metric 2: Total Workdays Logged */}
        <div className="comic-card p-4 sm:p-5 flex flex-col justify-between group bg-[#fffef9]">
          <div className="flex items-center justify-between gap-2 border-b-2 border-[#232b28]/15 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#38a169] text-white border-2 border-[#232b28] shadow-[1px_1px_0px_#232b28]">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase text-[#232b28] tracking-wider">
                {t.tab2Title}
              </span>
            </div>
            <button
              onClick={() =>
                speakCard(
                  'days',
                  language === 'hi'
                    ? `कुल काम के दिन ${totalDays} हैं। हर दिन की दर 600 रुपये है।`
                    : `Total workdays logged are ${totalDays}. Daily wage rate is 600 rupees.`
                )
              }
              className="p-1.5 rounded-lg border border-[#232b28] bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#15803d] text-xs font-bold cursor-pointer"
              title="Listen to days worked"
              aria-label="Listen to days worked"
            >
              <Volume2 className={`w-3.5 h-3.5 ${activeSpeechCard === 'days' ? 'text-red-500 animate-bounce' : ''}`} />
            </button>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-[#232b28] my-1 font-mono tabular-nums tracking-tight">
            {String(totalDays).padStart(3, '0')} Days
          </div>

          <div className="text-xs text-[#55694a] font-bold leading-relaxed">
            {t.tab2Desc}
          </div>

          <div className="mt-3 pt-2 border-t-2 border-dashed border-[#232b28]/20 text-xs font-black text-[#38a169] flex items-center justify-between">
            <span>{t.tab2Foot}</span>
          </div>
        </div>

        {/* Metric 3: Total Money Earned */}
        <div className="comic-card p-4 sm:p-5 flex flex-col justify-between group bg-[#fffef9]">
          <div className="flex items-center justify-between gap-2 border-b-2 border-[#232b28]/15 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#d97706] text-white border-2 border-[#232b28] shadow-[1px_1px_0px_#232b28]">
                <Banknote className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase text-[#232b28] tracking-wider">
                {t.tab3Title}
              </span>
            </div>
            <button
              onClick={() =>
                speakCard(
                  'money',
                  language === 'hi'
                    ? `मजदूरों की कुल कमाई ${totalCapital} रुपये है। यह मजदूरी कानूनन सुरक्षित है।`
                    : `Total money earned is ${totalCapital} rupees. Legally protected against wage cuts.`
                )
              }
              className="p-1.5 rounded-lg border border-[#232b28] bg-[#fffbeb] hover:bg-[#fef3c7] text-[#b45309] text-xs font-bold cursor-pointer"
              title="Listen to total money earned"
              aria-label="Listen to total money"
            >
              <Volume2 className={`w-3.5 h-3.5 ${activeSpeechCard === 'money' ? 'text-red-500 animate-bounce' : ''}`} />
            </button>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-[#232b28] my-1 font-mono tabular-nums tracking-tight text-[#1b4332]">
            ₹{totalCapital.toLocaleString('en-IN')}
          </div>

          <div className="text-xs text-[#55694a] font-bold leading-relaxed">
            {t.tab3Desc}
          </div>

          <div className="mt-3 pt-2 border-t-2 border-dashed border-[#232b28]/20 text-xs font-black text-[#d97706] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1b4332]" />
              <span>{t.tab3Foot}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsOverview;
