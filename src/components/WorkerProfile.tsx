import React, { useMemo, useState } from 'react';
import { WorkLog, RegisteredLabour, SiteDeploymentOffer } from '../types';
import { formatISTDateTime, generateAuditText, calculateWorkerSummary, getStoredLabourers } from '../services/storage';
import { computeWorkerCredentials } from '../services/enterpriseCompliance';
import { Download, MapPin, FileText, Calendar, Printer, ShieldCheck, X, Volume2, Award, CreditCard, Briefcase } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../context/LanguageContext';
import { speakText, stopSpeaking } from '../utils/speech';

interface WorkerProfileProps {
  selectedWorker: string;
  workerLogs: WorkLog[];
  allLogs: WorkLog[];
  workers?: RegisteredLabour[];
  offers?: SiteDeploymentOffer[];
  onRespondOffer?: (offerId: string, status: 'accepted' | 'declined') => Promise<void>;
  onOpenReceipt: (log: WorkLog) => void;
}

export const WorkerProfile: React.FC<WorkerProfileProps> = ({
  selectedWorker,
  workerLogs,
  allLogs,
  workers,
  offers = [],
  onRespondOffer,
  onOpenReceipt,
}) => {
  const { language, t } = useLanguage();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isSpeakingSummary, setIsSpeakingSummary] = useState(false);

  const workerCredential = useMemo(() => {
    if (selectedWorker === 'All Workers') return null;
    const registry = workers && workers.length > 0 ? workers : getStoredLabourers();
    const allCreds = computeWorkerCredentials(registry, allLogs);
    return allCreds.find((c) => c.phoneNumber === selectedWorker) || null;
  }, [selectedWorker, workers, allLogs]);

  const workerOffers = useMemo(() => {
    if (selectedWorker === 'All Workers') return [];
    return offers.filter((o) => o.workerPhone === selectedWorker);
  }, [offers, selectedWorker]);

  if (selectedWorker === 'All Workers') {
    return (
      <div className="comic-card p-4 sm:p-5 mb-6 text-sm text-[#19231f] flex items-center gap-3 bg-[#fffef9]">
        <span className="bg-[#1b4332] text-white text-xs font-black shrink-0 px-2.5 py-1 rounded-lg">
          👉 TIP
        </span>
        <span className="font-bold text-[#3d4a44]">
          {t.workerProfileNotice}
        </span>
      </div>
    );
  }

  const sortedLogs = [...workerLogs].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const summary = calculateWorkerSummary(selectedWorker, workerLogs);

  const handleSpeakSummary = () => {
    if (isSpeakingSummary) {
      stopSpeaking();
      setIsSpeakingSummary(false);
      return;
    }

    let speech = '';
    if (language === 'hi') {
      speech = `मजदूर खाता। फोन नंबर ${selectedWorker}। कुल काम के दिन ${summary.totalDays}। कुल कमाई ${summary.totalEarnings} रुपये है। बकाया मजदूरी ${summary.outstandingAmount} रुपये है। यह खाता सरकारी नियम से सुरक्षित है।`;
    } else {
      speech = `Worker passbook for ${selectedWorker}. Total work days: ${summary.totalDays}. Total wages earned: ${summary.totalEarnings} rupees. Outstanding due: ${summary.outstandingAmount} rupees. All records are legally protected.`;
    }

    setIsSpeakingSummary(true);
    speakText(
      speech,
      language,
      () => setIsSpeakingSummary(true),
      () => setIsSpeakingSummary(false)
    );
  };

  const handleDownloadAudit = () => {
    const auditText = generateAuditText(selectedWorker, allLogs);
    const blob = new Blob([auditText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedWorker.replace(/\D/g, '')}_wage_record.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintPassbook = () => {
    window.print();
  };

  // QR verification payload for the entire passbook
  const passbookQrPayload = JSON.stringify({
    doc: 'SHRAMIK_PRAMAAN_PATRA',
    v: '1.0',
    worker: selectedWorker,
    days: summary.totalDays,
    earned: summary.totalEarnings,
    outstanding: summary.outstandingAmount,
    timestamp: Date.now(),
    sec: '65B',
  });

  return (
    <div className="comic-card p-4 sm:p-6 mb-6 overflow-hidden bg-[#fffdfa]">
      {/* Scalloped Pink Roof */}
      <div className="roof-scallops-pink -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4" />

      {/* Passbook Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-2 border-[#232b28]/15 pb-3.5 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="bg-[#1b4332] text-white text-xs font-black px-2.5 py-1 rounded-lg tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#c29437]" />
              <span>{t.individualDossierBadge}</span>
            </span>
            <span className="rubber-stamp-verified text-[11px]">
              ✓ VERIFIED WORKER PASSBOOK
            </span>
            <span className="bg-[#ede8d8] text-[#1b4332] text-xs font-black px-2 py-0.5 rounded-lg border border-[#1b4332]/30 inline-flex items-center gap-1">
              ✓ STATUTORY MUSTER ROLL RECORD
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#19231f] flex flex-wrap items-center gap-2 tracking-tight">
            <span>{t.laborerDossierTitle}</span>
            <span className="bg-[#f4ede0] px-3 py-1 rounded-xl border-2 border-[#1c2421] text-[#1b4332] font-mono font-black text-lg sm:text-xl">
              {selectedWorker}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#3d4a44] mt-1 font-bold">
            Official passbook under Government Minimum Wage &amp; Labour Protection Acts.
          </p>
        </div>

        {/* Header Actions: Voice Read-Aloud + Print Passbook */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSpeakSummary}
            className={`px-3 py-2 text-xs font-black rounded-xl border-2 border-[#232b28] flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#232b28] active:scale-95 transition-all ${
              isSpeakingSummary ? 'bg-[#ef4444] text-white animate-pulse' : 'bg-[#fef3c7] hover:bg-[#fde68a] text-[#19231f]'
            }`}
            title="Listen to total money and days"
            aria-label="Listen to summary"
          >
            <Volume2 className="w-4 h-4 text-[#1b4332]" />
            <span>{isSpeakingSummary ? 'Stop (रोकें)' : '🔊 Listen (हिसाब सुनें)'}</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="civic-btn-primary px-3 py-2 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
            title="Print 1-Page Passbook (₹2 CSC Printout)"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Print Passbook (₹2 CSC)</span>
          </button>

          <button
            onClick={handleDownloadAudit}
            className="civic-btn-secondary px-3 py-2 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#1b4332]" />
            <span>Download .txt</span>
          </button>
        </div>
      </div>

      {/* 4 Simple Ledger Metric Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="comic-inset rounded-xl p-3.5 bg-white">
          <span className="text-xs font-black text-[#55694a] block uppercase tracking-wider">
            📅 Total Days Worked
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#19231f] mt-1 block font-mono">
            {summary.totalDays} Days
          </span>
        </div>

        <div className="comic-inset rounded-xl p-3.5 bg-[#f0fdf4]">
          <span className="text-xs font-black text-[#15803d] block uppercase tracking-wider">
            💰 Total Money Earned
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#15803d] mt-1 block font-mono">
            ₹{summary.totalEarnings.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="comic-inset rounded-xl p-3.5 bg-white">
          <span className="text-xs font-black text-[#55694a] block uppercase tracking-wider">
            💵 Wages Paid Out
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#19231f] mt-1 block font-mono">
            ₹{summary.totalPaid.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="comic-inset rounded-xl p-3.5 bg-[#fffbeb]">
          <span className="text-xs font-black text-[#b45309] block uppercase tracking-wider">
            ⏳ Balance To Collect
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#b45309] mt-1 block font-mono">
            ₹{summary.outstandingAmount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Pivot 3: Portable Skill Credential & Micro-Credit Strip */}
      {workerCredential && (
        <div className="border border-[#1c2421]/25 rounded-md p-3.5 sm:p-4 bg-[#fcfbf7] mb-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1c2421]/15 pb-2.5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#8c6721] shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-[#19231f]">
                Verifiable Skill &amp; Micro-Credit Passport
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-[#1b4332]">
              {workerCredential.tier} · {workerCredential.credentialHash}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
            <div>
              <span className="font-sans text-[11px] font-bold text-[#3d4a44] block">Trade &amp; Rate</span>
              <span className="font-sans font-black text-[#19231f]">{workerCredential.trade}</span>
            </div>
            <div>
              <span className="font-sans text-[11px] font-bold text-[#3d4a44] block">Verified Track Record</span>
              <span className="font-black text-[#1b4332]">
                {workerCredential.verifiedRatioPct}% ({workerCredential.totalLoggedHours}h)
              </span>
            </div>
            <div>
              <span className="font-sans text-[11px] font-bold text-[#3d4a44] block">Micro-Credit Limit</span>
              <span className="font-black text-[#8c6721] inline-flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                ₹{workerCredential.microCreditLimitINR.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="font-sans text-[11px] font-bold text-[#3d4a44] block">BOCW 90d Welfare</span>
              <span className="font-black text-[#1e7587]">
                {workerCredential.bocwDaysProgressPct}% ({workerCredential.verifiedDays}/90d)
              </span>
            </div>
          </div>

          {workerOffers.length > 0 && (
            <div className="pt-2.5 border-t border-dashed border-[#1c2421]/20 space-y-2">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#1b4332] flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Direct Employer Job Offers ({workerOffers.length})</span>
              </div>
              {workerOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-[#1c2421]/20 rounded p-2.5 text-xs"
                >
                  <div>
                    <span className="font-black text-[#19231f]">{offer.employerName}</span> ·{' '}
                    <span className="text-[#3d4a44] font-semibold">
                      {offer.projectSite} ({offer.durationDays}d from {offer.startDate})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-black text-[#1b4332]">
                      ₹{offer.offeredDailyWage}/day
                    </span>
                    {offer.status === 'pending' && onRespondOffer ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onRespondOffer(offer.id, 'accepted')}
                          className="px-2.5 py-1 text-[11px] font-bold rounded bg-[#1b4332] text-white cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => onRespondOffer(offer.id, 'declined')}
                          className="px-2.5 py-1 text-[11px] font-bold rounded border border-[#9b2226] text-[#9b2226] bg-white cursor-pointer"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <span
                        className={`text-[11px] font-black uppercase ${
                          offer.status === 'accepted' ? 'text-[#1b4332]' : 'text-[#9b2226]'
                        }`}
                      >
                        {offer.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Visual Work Days Timeline */}
      <div className="vellum-sheet p-4 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-[#1c2421]/15 pb-2">
          <span className="text-xs font-bold text-[#19231f] flex items-center gap-2 uppercase tracking-wide">
            <Calendar className="w-4 h-4 text-[#1b4332]" />
            <span>Certified Workdays Progression</span>
          </span>
          <span className="text-xs font-bold text-[#1b4332] font-mono">
            {sortedLogs.length} Entries Logged
          </span>
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="h-24 flex items-end gap-2 pt-2 px-1 pb-1 border-b border-[#1c2421]/20 min-w-[280px]">
            {sortedLogs.map((log, idx) => {
              const heightPercent = Math.min(100, Math.round(((idx + 1) / Math.max(sortedLogs.length, 1)) * 100));
              const cumulativeWage = sortedLogs.slice(0, idx + 1).reduce(
                (sum, l) => sum + (Number(l.actual_wage_earned ?? l.agreed_wage ?? l.estimated_wage) || 600),
                0
              );
              return (
                <div
                  key={log.id}
                  className="flex-1 min-w-[38px] max-w-[56px] flex flex-col items-center cursor-pointer group"
                  onClick={() => onOpenReceipt(log)}
                  title={`Day ${idx + 1}: ₹${cumulativeWage} - View Sec 63 BSA slip`}
                >
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-[#1b4332] group-hover:bg-[#2d6a4f] transition-colors rounded-t flex items-center justify-center border border-[#1c2421]"
                  >
                    <span className="text-[9px] font-mono font-bold text-white select-none">
                      ₹{cumulativeWage}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#3d4a44] mt-1 whitespace-nowrap group-hover:text-[#1b4332]">
                    Day {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Workday Muster Log Entries */}
      <div>
        <h4 className="text-xs font-black text-[#19231f] uppercase mb-2 tracking-wider">
          Certified Attendance Slips (Section 65B Admissible)
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
          {sortedLogs.slice().reverse().map((log, index) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded bg-white border border-[#1c2421]/25 text-xs gap-2 hover:border-[#1b4332] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono font-bold text-[#1b4332] text-xs bg-[#e8f5e9] px-2 py-0.5 rounded border border-[#1b4332]/30 shrink-0">
                  #{sortedLogs.length - index}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-[#19231f] font-mono">
                    {formatISTDateTime(log.created_at)}
                  </div>
                  <div className="text-[11px] text-[#3d4a44] flex items-center gap-1 truncate font-medium">
                    <MapPin className="w-3 h-3 text-[#1b4332] shrink-0" />
                    <span className="truncate">
                      {log.location_name || (log.latitude && log.longitude ? `${log.latitude.toFixed(6)}°, ${log.longitude.toFixed(6)}°` : 'Work Site')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#1c2421]/15">
                <span className="font-black text-sm text-[#1b4332] font-mono">
                  ₹{log.estimated_wage.toFixed(2)}
                </span>
                <button
                  onClick={() => onOpenReceipt(log)}
                  className="civic-btn-secondary px-2.5 py-1 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#1b4332]" />
                  <span>Verify Slip</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------------------------------------
          1-PAGE PRINTABLE "SHRAMIK PRAMAAN-PATRA" (CSC ₹2 PRINTABLE PASSBOOK MODAL)
      -------------------------------------------------------------------------------- */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1c2421]/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white max-w-2xl w-full p-6 sm:p-8 rounded-lg shadow-2xl relative printable-passbook my-auto border-2 border-[#1c2421]">
            {/* Close Button (hidden during print) */}
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded hover:bg-[#f4ede0] text-[#19231f] no-print cursor-pointer border border-[#1c2421]/30"
              aria-label="Close Print Preview"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Passbook Masthead */}
            <div className="text-center pb-4 mb-4 border-b-2 border-[#1c2421]">
              <div className="text-xs font-black uppercase text-[#1b4332] tracking-widest mb-1">
                MINISTRY OF LABOUR &amp; EMPLOYMENT · STATE BOCW WELFARE BOARD
              </div>
              <h2 className="text-2xl font-black text-[#19231f] tracking-tight">
                श्रमिक प्रमाण-पत्र • SHRAMIK PRAMAAN-PATRA
              </h2>
              <div className="text-xs font-bold text-[#3d4a44] mt-0.5">
                Official Civic Wage Passbook &amp; Evidentiary Record Under Section 65B Indian Evidence Act
              </div>
            </div>

            {/* Worker Identification & Photograph Grid */}
            <div className="grid grid-cols-4 gap-4 p-3 bg-[#fbf8ef] border border-[#1c2421] rounded mb-4">
              <div className="col-span-3 space-y-1.5 text-xs">
                <div className="flex">
                  <span className="w-32 font-bold text-[#3d4a44]">Worker Mobile:</span>
                  <span className="font-mono font-black text-sm">{selectedWorker}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold text-[#3d4a44]">Statutory Category:</span>
                  <span className="font-bold">Unorganized Construction &amp; Transit Labor</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold text-[#3d4a44]">Statutory Rate:</span>
                  <span className="font-bold">
                    ₹{sortedLogs[0]?.agreed_wage || sortedLogs[0]?.actual_wage_earned || 600}.00 / 8-Hour Shift (Circular 2026/MW-IV)
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold text-[#3d4a44]">Issuing Authority:</span>
                  <span className="font-bold text-[#1b4332]">Shramik Sakshi Protected Civic Registry</span>
                </div>
              </div>

              {/* Photo Box for CSC affixing */}
              <div className="border border-dashed border-[#1c2421] flex flex-col items-center justify-center p-2 text-center bg-white text-[9px] text-[#3d4a44]">
                <div className="w-12 h-12 bg-[#f4ede0] mb-1 flex items-center justify-center font-bold text-base">
                  👤
                </div>
                <span>Affix CSC Attested Photo</span>
              </div>
            </div>

            {/* Cumulative Financial Summary Table */}
            <table className="w-full text-xs border-collapse border border-[#1c2421] mb-4">
              <thead>
                <tr className="bg-[#1b4332] text-white">
                  <th className="border border-[#1c2421] p-2 text-left">Verified Workdays</th>
                  <th className="border border-[#1c2421] p-2 text-left">Gross Earned Wages</th>
                  <th className="border border-[#1c2421] p-2 text-left">Amount Disbursed</th>
                  <th className="border border-[#1c2421] p-2 text-left bg-[#8c6721]">Outstanding Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-mono font-bold text-sm bg-white">
                  <td className="border border-[#1c2421] p-2">{summary.totalDays} Workdays</td>
                  <td className="border border-[#1c2421] p-2">₹{summary.totalEarnings.toFixed(2)}</td>
                  <td className="border border-[#1c2421] p-2">₹{summary.totalPaid.toFixed(2)}</td>
                  <td className="border border-[#1c2421] p-2 text-[#9b2226] font-black">
                    ₹{summary.outstandingAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Tabular Muster Log (First 10 entries) */}
            <div className="mb-4">
              <div className="text-[11px] font-black uppercase text-[#1c2421] mb-1">
                Recent Certified Muster Slips:
              </div>
              <table className="w-full text-[10px] border-collapse border border-[#1c2421]">
                <thead>
                  <tr className="bg-[#f4ede0] font-bold">
                    <th className="border border-[#1c2421] p-1 text-left">#</th>
                    <th className="border border-[#1c2421] p-1 text-left">Date (IST)</th>
                    <th className="border border-[#1c2421] p-1 text-left">Worksite Location</th>
                    <th className="border border-[#1c2421] p-1 text-left">Token Slip</th>
                    <th className="border border-[#1c2421] p-1 text-right">Rate</th>
                    <th className="border border-[#1c2421] p-1 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLogs.slice(-8).map((l, idx) => (
                    <tr key={l.id} className="font-mono">
                      <td className="border border-[#1c2421] p-1">{idx + 1}</td>
                      <td className="border border-[#1c2421] p-1">{formatISTDateTime(l.created_at)}</td>
                      <td className="border border-[#1c2421] p-1 truncate max-w-[150px] font-sans">
                        {l.location_name || 'Site Coordinates'}
                      </td>
                      <td className="border border-[#1c2421] p-1 font-bold text-[#1b4332]">{l.verification_token}</td>
                      <td className="border border-[#1c2421] p-1 text-right">₹{l.estimated_wage}</td>
                      <td className="border border-[#1c2421] p-1 text-center font-sans font-bold">
                        {l.verification_status === 'attendance_acknowledged' ? '✓ Verified' : '⏳ Logged'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Attestation & CSC Signature Strip */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-[#1c2421] text-[10px] items-end">
              <div>
                <QRCodeSVG value={passbookQrPayload} size={72} level="M" />
                <div className="font-mono mt-1 text-[8px] text-[#3d4a44]">
                  SEC 65B QR SIGNATURE
                </div>
              </div>

              <div className="text-center pb-2 border-b border-dashed border-[#1c2421]">
                <div className="h-8" />
                <span className="font-bold text-[#3d4a44]">Labor Welfare Inspector / CSC Officer Seal</span>
              </div>

              <div className="text-center pb-2 border-b border-dashed border-[#1c2421]">
                <div className="h-8" />
                <span className="font-bold text-[#3d4a44]">Registered Worker Thumb / Signature</span>
              </div>
            </div>

            {/* Modal Controls (Hidden during printing) */}
            <div className="mt-6 pt-3 border-t border-[#1c2421]/20 flex items-center justify-between no-print">
              <span className="text-xs text-[#3d4a44] font-medium">
                Standard ₹2 CSC printout: formatted strictly for single-page A4 printing.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPassbook}
                  className="civic-btn-primary px-4 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Send to Printer (A4)</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="civic-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerProfile;
