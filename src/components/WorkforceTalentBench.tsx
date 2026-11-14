import React, { useMemo, useState } from 'react';
import {
  WorkLog,
  RegisteredLabour,
  WorkerSkillCredential,
  SiteDeploymentOffer,
  UserRole,
} from '../types';
import { computeWorkerCredentials } from '../services/enterpriseCompliance';
import {
  Award,
  Briefcase,
  CheckCircle2,
  CreditCard,
  MapPin,
  QrCode,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  X,
  Unlock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface WorkforceTalentBenchProps {
  logs: WorkLog[];
  workers: RegisteredLabour[];
  offers: SiteDeploymentOffer[];
  userRole: UserRole;
  onSwitchRole?: (role: UserRole) => void;
  onCreateOffer: (offer: {
    workerPhone: string;
    workerName: string;
    trade: string;
    employerName: string;
    projectSite: string;
    offeredDailyWage: number;
    durationDays: number;
    startDate: string;
  }) => Promise<void>;
  onRespondOffer: (offerId: string, status: 'accepted' | 'declined') => Promise<void>;
  onSelectWorkerPassbook?: (phone: string) => void;
}

export const WorkforceTalentBench: React.FC<WorkforceTalentBenchProps> = ({
  logs,
  workers,
  offers,
  userRole,
  onSwitchRole,
  onCreateOffer,
  onRespondOffer,
  onSelectWorkerPassbook,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeFilter, setTradeFilter] = useState<string>('ALL');
  const [minVerifiedDays, setMinVerifiedDays] = useState<number>(0);

  const [passportWorker, setPassportWorker] = useState<WorkerSkillCredential | null>(null);
  const [recruitTarget, setRecruitTarget] = useState<WorkerSkillCredential | null>(null);

  // Recruitment Offer Form State
  const [employerName, setEmployerName] = useState('Deccan Infrastructure EPC');
  const [projectSite, setProjectSite] = useState('Peenya Metro Corridor Phase III, Bengaluru');
  const [offeredWage, setOfferedWage] = useState<number>(750);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  const canRecruit = userRole === 'employer' || userRole === 'administrator';

  const credentials = useMemo(
    () => computeWorkerCredentials(workers, logs),
    [workers, logs]
  );

  const availableTrades = useMemo(() => {
    const set = new Set<string>();
    credentials.forEach((c) => {
      if (c.trade) set.add(c.trade);
    });
    return Array.from(set).sort();
  }, [credentials]);

  const filteredCredentials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return credentials.filter((c) => {
      if (tradeFilter !== 'ALL' && c.trade !== tradeFilter) return false;
      if (c.verifiedDays < minVerifiedDays) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phoneNumber.toLowerCase().includes(q) ||
        c.trade.toLowerCase().includes(q) ||
        c.worksite.toLowerCase().includes(q)
      );
    });
  }, [credentials, tradeFilter, minVerifiedDays, searchQuery]);

  const totals = useMemo(() => {
    const verifiedPool = credentials.filter((c) => c.verifiedDays >= 1).length;
    const insuranceReady = credentials.filter((c) => c.insuranceEligible).length;
    const totalCreditCapacity = credentials.reduce((s, c) => s + c.microCreditLimitINR, 0);
    const pendingOffers = offers.filter((o) => o.status === 'pending').length;
    return { verifiedPool, insuranceReady, totalCreditCapacity, pendingOffers };
  }, [credentials, offers]);

  const openRecruitModal = (cred: WorkerSkillCredential) => {
    setRecruitTarget(cred);
    setOfferedWage(Math.max(cred.dailyWage + 50, 650));
    setProjectSite(cred.worksite);
  };

  const handleDispatchOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruitTarget) return;
    setIsSubmittingOffer(true);
    try {
      await onCreateOffer({
        workerPhone: recruitTarget.phoneNumber,
        workerName: recruitTarget.name,
        trade: recruitTarget.trade,
        employerName: employerName.trim() || 'Principal Contractor',
        projectSite: projectSite.trim() || recruitTarget.worksite,
        offeredDailyWage: Number(offeredWage) || recruitTarget.dailyWage,
        durationDays: Number(durationDays) || 30,
        startDate,
      });
      setRecruitTarget(null);
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  return (
    <section className="civic-card p-4 sm:p-6 bg-[#fffdfa] space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-[#1c2421]/15 pb-4">
        <div>
          <div className="text-xs font-mono font-bold text-[#8c6721] uppercase tracking-wider mb-1">
            Verified Labor Supply &amp; Portable Skill Credentials · Shramik Credit Passport
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#19231f] flex items-center gap-2 tracking-tight">
            <Award className="w-5 h-5 text-[#8c6721] shrink-0" />
            <span>Verified Workforce Bench &amp; Skill Credentials</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#3d4a44] mt-1 font-medium">
            Discover workers backed by tamper-evident Section 63 BSA attendance history, inspect portable skill credentials, and dispatch verified site deployment offers.
          </p>
        </div>

        {!canRecruit && onSwitchRole && (
          <button
            type="button"
            onClick={() => onSwitchRole('employer')}
            className="civic-btn-brass px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Switch to Employer Mode to Recruit</span>
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-[#1c2421]/25 rounded-md p-3.5 bg-[#fcfbf7]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#3d4a44]">
            Verified Talent Pool
          </div>
          <div className="text-2xl font-black text-[#1b4332] font-mono tabular-nums mt-1">
            {totals.verifiedPool} / {credentials.length}
          </div>
          <div className="text-[11px] text-[#3d4a44] font-medium mt-1">
            Workers with GPS-sealed days
          </div>
        </div>

        <div className="border border-[#1c2421]/25 rounded-md p-3.5 bg-[#fcfbf7]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#3d4a44]">
            Micro-Credit Capacity
          </div>
          <div className="text-2xl font-black text-[#8c6721] font-mono tabular-nums mt-1">
            ₹{totals.totalCreditCapacity.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#3d4a44] font-medium mt-1">
            Underwritten by verified days
          </div>
        </div>

        <div className="border border-[#1c2421]/25 rounded-md p-3.5 bg-[#fcfbf7]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#3d4a44]">
            Insurance Pre-Qualified
          </div>
          <div className="text-2xl font-black text-[#1e7587] font-mono tabular-nums mt-1">
            {totals.insuranceReady} Workers
          </div>
          <div className="text-[11px] text-[#3d4a44] font-medium mt-1">
            Zero disputes &amp; ≤25m GPS
          </div>
        </div>

        <div className="border border-[#1c2421]/25 rounded-md p-3.5 bg-[#fcfbf7]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#3d4a44]">
            Active Site Offers
          </div>
          <div className="text-2xl font-black text-[#19231f] font-mono tabular-nums mt-1">
            {offers.length} ({totals.pendingOffers} Open)
          </div>
          <div className="text-[11px] text-[#3d4a44] font-medium mt-1">
            Direct EPC-to-worker contracts
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#f7f3e8] border border-[#1c2421]/20 rounded-md p-3">
        <div className="md:col-span-5 relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3d4a44]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, trade, or hub..."
            className="w-full pl-8 pr-3 py-2 bg-white border border-[#1c2421]/30 rounded text-xs font-semibold text-[#19231f] focus:outline-none focus:border-[#1b4332]"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#1c2421]/30 rounded text-xs font-bold text-[#19231f] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Skilled Trades</option>
            {availableTrades.map((trade) => (
              <option key={trade} value={trade}>
                {trade}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={minVerifiedDays}
            onChange={(e) => setMinVerifiedDays(Number(e.target.value))}
            className="w-full px-3 py-2 bg-white border border-[#1c2421]/30 rounded text-xs font-bold text-[#19231f] focus:outline-none cursor-pointer"
          >
            <option value={0}>Any Experience Level</option>
            <option value={1}>1+ Verified Days</option>
            <option value={2}>2+ Verified Days</option>
            <option value={5}>5+ Verified Days</option>
          </select>
        </div>
      </div>

      {/* Verified Workers Table */}
      <div className="overflow-x-auto border border-[#1c2421]/25 rounded-md">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#1b4332] text-white text-[11px] uppercase tracking-wider font-mono">
              <th className="p-3">Worker &amp; Trade</th>
              <th className="p-3">Credential Tier</th>
              <th className="p-3 text-right">Verified Work</th>
              <th className="p-3 text-right">Credit Limit</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c2421]/15 bg-white">
            {filteredCredentials.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-xs text-[#3d4a44] font-semibold">
                  No verified workers match your selected trade or experience criteria.
                </td>
              </tr>
            ) : (
              filteredCredentials.map((cred) => (
                <tr key={cred.phoneNumber} className="hover:bg-[#fcfbf7] transition-colors align-top">
                  <td className="p-3">
                    <div className="font-black text-[#19231f]">
                      {cred.name}{' '}
                      {cred.aadhaarLastFour && (
                        <span className="font-mono text-[11px] font-semibold text-[#3d4a44]">
                          (UIDAI •••• {cred.aadhaarLastFour})
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-[#1e7587] mt-0.5">{cred.trade}</div>
                    <div className="text-[11px] text-[#3d4a44] mt-0.5 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>
                        {cred.worksite} · <span className="font-mono">{cred.phoneNumber}</span>
                      </span>
                    </div>
                  </td>

                  <td className="p-3">
                    <div
                      className={`font-black text-xs ${
                        cred.tier === 'Master Artisan'
                          ? 'text-[#1b4332]'
                          : cred.tier === 'Verified Skilled'
                          ? 'text-[#1e7587]'
                          : cred.tier === 'Certified Active'
                          ? 'text-[#8c6721]'
                          : 'text-[#3d4a44]'
                      }`}
                    >
                      {cred.tier}
                    </div>
                    <div className="text-[11px] font-mono text-[#3d4a44] mt-0.5">
                      {cred.credentialHash}
                    </div>
                    <div className="text-[11px] text-[#3d4a44] mt-0.5">
                      {cred.insuranceEligible ? 'Insurance Eligible' : `BOCW ${cred.bocwDaysProgressPct}% of 90d`}
                    </div>
                  </td>

                  <td className="p-3 text-right font-mono tabular-nums">
                    <div className="font-black text-[#19231f]">
                      {cred.verifiedDays} days ({cred.totalLoggedHours}h)
                    </div>
                    <div className="text-[11px] text-[#1b4332] font-bold">
                      {cred.verifiedRatioPct}% verified ·{' '}
                      {cred.avgGpsAccuracyM !== null ? `±${cred.avgGpsAccuracyM}m GPS` : 'No GPS yet'}
                    </div>
                  </td>

                  <td className="p-3 text-right font-mono tabular-nums">
                    <div className="font-black text-[#8c6721]">
                      ₹{cred.microCreditLimitINR.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-[#3d4a44]">
                      Rate ₹{cred.dailyWage}/day
                    </div>
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setPassportWorker(cred)}
                        className="px-2.5 py-1.5 text-xs font-bold rounded border border-[#1c2421]/40 bg-white hover:bg-[#f4ede0] text-[#19231f] cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#1b4332]" />
                        <span>Passport</span>
                      </button>

                      {onSelectWorkerPassbook && (
                        <button
                          type="button"
                          onClick={() => onSelectWorkerPassbook(cred.phoneNumber)}
                          className="px-2.5 py-1.5 text-xs font-bold rounded border border-[#1c2421]/40 bg-[#f7f3e8] hover:bg-[#ede5cf] text-[#19231f] cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-[#1e7587]" />
                          <span>Passbook</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={!canRecruit}
                        onClick={() => openRecruitModal(cred)}
                        className="civic-btn-primary px-2.5 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap inline-flex items-center gap-1 disabled:opacity-45"
                        title={
                          canRecruit
                            ? 'Send verified site deployment offer'
                            : 'Switch to Employer or Inspector role to send offers'
                        }
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Offer</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Site Deployment Offers Ledger */}
      <div className="border border-[#1c2421]/25 rounded-md bg-[#fcfbf7] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-[#1c2421]/15 pb-2">
          <h3 className="text-sm font-black text-[#19231f] flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#1b4332]" />
            <span>Direct Site Deployment Offers ({offers.length})</span>
          </h3>
          <span className="text-xs text-[#3d4a44] font-semibold">
            Zero-middleman contractor hiring backed by Skill Passports
          </span>
        </div>

        {offers.length === 0 ? (
          <div className="text-xs text-[#3d4a44] py-4 text-center font-medium">
            No active deployment offers yet. Click &ldquo;Send Offer&rdquo; next to any verified worker above.
          </div>
        ) : (
          <div className="divide-y divide-[#1c2421]/15">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-black text-[#19231f]">
                    {offer.workerName} · {offer.trade}
                  </div>
                  <div className="text-[#3d4a44] font-medium mt-0.5">
                    Offered by <strong className="text-[#19231f]">{offer.employerName}</strong> at{' '}
                    {offer.projectSite} · Start {offer.startDate} ({offer.durationDays} days)
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-black text-[#1b4332] tabular-nums">
                    ₹{offer.offeredDailyWage}/day
                  </span>

                  {offer.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onRespondOffer(offer.id, 'accepted')}
                        className="px-2.5 py-1 text-[11px] font-bold rounded bg-[#1b4332] text-white cursor-pointer whitespace-nowrap"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => onRespondOffer(offer.id, 'declined')}
                        className="px-2.5 py-1 text-[11px] font-bold rounded border border-[#9b2226] text-[#9b2226] bg-white cursor-pointer whitespace-nowrap"
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

      {/* Verifiable Skill & Credit Passport Modal */}
      {passportWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c2421]/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white max-w-lg w-full p-5 sm:p-6 rounded-md border-2 border-[#1c2421] shadow-2xl relative my-auto">
            <button
              type="button"
              onClick={() => setPassportWorker(null)}
              className="absolute top-3.5 right-3.5 p-1 rounded border border-[#1c2421]/30 hover:bg-[#f4ede0] cursor-pointer"
              aria-label="Close passport modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-[#1c2421]/20 pb-3 mb-4">
              <div className="text-[11px] font-mono font-bold text-[#1b4332] uppercase tracking-wider">
                Verifiable Shramik Skill &amp; Credit Credential
              </div>
              <h3 className="text-xl font-black text-[#19231f] mt-0.5">{passportWorker.name}</h3>
              <div className="text-xs font-bold text-[#3d4a44]">
                {passportWorker.trade} · {passportWorker.workerId} · {passportWorker.phoneNumber}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="col-span-2 space-y-2 text-xs">
                <div className="p-2.5 bg-[#fcfbf7] border border-[#1c2421]/20 rounded">
                  <div className="text-[11px] text-[#3d4a44] font-bold">Credential Tier</div>
                  <div className="text-sm font-black text-[#1b4332]">{passportWorker.tier}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono tabular-nums">
                  <div className="p-2 bg-[#fcfbf7] border border-[#1c2421]/20 rounded">
                    <div className="text-[10px] text-[#3d4a44] font-sans font-bold">Verified Days</div>
                    <div className="font-black text-[#19231f]">{passportWorker.verifiedDays} d</div>
                  </div>
                  <div className="p-2 bg-[#fcfbf7] border border-[#1c2421]/20 rounded">
                    <div className="text-[10px] text-[#3d4a44] font-sans font-bold">Verified Rate</div>
                    <div className="font-black text-[#1b4332]">{passportWorker.verifiedRatioPct}%</div>
                  </div>
                  <div className="p-2 bg-[#fcfbf7] border border-[#1c2421]/20 rounded">
                    <div className="text-[10px] text-[#3d4a44] font-sans font-bold">Peer Witnesses</div>
                    <div className="font-black text-[#19231f]">{passportWorker.peerCorroboratedCount}</div>
                  </div>
                  <div className="p-2 bg-[#fcfbf7] border border-[#1c2421]/20 rounded">
                    <div className="text-[10px] text-[#3d4a44] font-sans font-bold">Avg GNSS Fix</div>
                    <div className="font-black text-[#1e7587]">
                      {passportWorker.avgGpsAccuracyM !== null
                        ? `±${passportWorker.avgGpsAccuracyM}m`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-2 border border-[#1c2421]/25 rounded bg-[#fcfbf7]">
                <QRCodeSVG
                  value={JSON.stringify({
                    doc: 'SHRAMIK_SKILL_PASSPORT_V1',
                    id: passportWorker.workerId,
                    phone: passportWorker.phoneNumber,
                    tier: passportWorker.tier,
                    days: passportWorker.verifiedDays,
                    creditINR: passportWorker.microCreditLimitINR,
                    hash: passportWorker.credentialHash,
                  })}
                  size={104}
                  level="M"
                />
                <span className="text-[9px] font-mono text-[#3d4a44] mt-1.5 text-center">
                  {passportWorker.credentialHash}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#f7f3e8] border border-[#8c6721]/40 rounded text-xs space-y-1 mb-4">
              <div className="font-black text-[#8c6721] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>
                  Micro-Credit Pre-Qualification: ₹
                  {passportWorker.microCreditLimitINR.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-[#3d4a44] font-medium">
                Computed deterministically from {passportWorker.verifiedDays} verified shifts × ₹
                {passportWorker.dailyWage} daily rate with {passportWorker.disputedCount} disputes.
              </div>
              <div className="text-[#1b4332] font-bold flex items-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  BOCW 90-Day Welfare Threshold Progress: {passportWorker.bocwDaysProgressPct}% (
                  {passportWorker.verifiedDays}/90 days)
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPassportWorker(null)}
                className="civic-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Site Deployment Offer Modal */}
      {recruitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c2421]/70 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleDispatchOffer}
            className="bg-white max-w-md w-full p-5 sm:p-6 rounded-md border-2 border-[#1c2421] shadow-2xl relative my-auto space-y-4"
          >
            <button
              type="button"
              onClick={() => setRecruitTarget(null)}
              className="absolute top-3.5 right-3.5 p-1 rounded border border-[#1c2421]/30 hover:bg-[#f4ede0] cursor-pointer"
              aria-label="Close offer modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="text-[11px] font-mono font-bold text-[#1b4332] uppercase tracking-wider">
                Direct Site Deployment Offer
              </div>
              <h3 className="text-lg font-black text-[#19231f] mt-0.5">
                Recruit {recruitTarget.name}
              </h3>
              <p className="text-xs text-[#3d4a44] font-semibold">
                {recruitTarget.trade} · {recruitTarget.verifiedDays} verified days ·{' '}
                {recruitTarget.tier}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#19231f] mb-1">
                  Principal Employer / EPC Company
                </label>
                <input
                  type="text"
                  required
                  value={employerName}
                  onChange={(e) => setEmployerName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#1c2421]/40 rounded font-semibold text-[#19231f]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#19231f] mb-1">Project Worksite</label>
                <input
                  type="text"
                  required
                  value={projectSite}
                  onChange={(e) => setProjectSite(e.target.value)}
                  className="w-full px-3 py-2 border border-[#1c2421]/40 rounded font-semibold text-[#19231f]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#19231f] mb-1">Daily Wage (₹)</label>
                  <input
                    type="number"
                    min={200}
                    max={25000}
                    required
                    value={offeredWage}
                    onChange={(e) => setOfferedWage(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-[#1c2421]/40 rounded font-mono font-bold text-[#19231f]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#19231f] mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-[#1c2421]/40 rounded font-mono font-bold text-[#19231f]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#19231f] mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-2 border border-[#1c2421]/40 rounded font-mono font-bold text-[#19231f]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1c2421]/15">
              <button
                type="button"
                onClick={() => setRecruitTarget(null)}
                className="civic-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingOffer}
                className="civic-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmittingOffer ? 'Dispatching...' : 'Dispatch Offer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default WorkforceTalentBench;
