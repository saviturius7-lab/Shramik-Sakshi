import React, { useMemo, useState } from 'react';
import {
  WorkLog,
  RegisteredLabour,
  RetentionHoldRecord,
  SiteComplianceSummary,
  UserRole,
} from '../types';
import { computeSiteComplianceSummaries } from '../services/enterpriseCompliance';
import { formatISTDateTime, isEstoppelActive, getPeerQuorumCount } from '../services/storage';
import {
  Building2,
  ShieldAlert,
  FileSpreadsheet,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Scale,
  Search,
  CheckSquare,
} from 'lucide-react';
import { CourtEvidenceCertificateModal } from './CourtEvidenceCertificateModal';

interface EnterpriseComplianceConsoleProps {
  logs: WorkLog[];
  workers: RegisteredLabour[];
  holds: RetentionHoldRecord[];
  userRole: UserRole;
  onSwitchRole?: (role: UserRole) => void;
  onToggleRetentionHold: (siteKey: string, contractorName: string, hold: boolean) => Promise<void>;
  onBulkAcknowledgeSite: (attendanceIds: string[], siteName: string) => Promise<void>;
  onAttendanceAction: (id: string, action: 'acknowledge' | 'dispute') => Promise<void>;
  onOpenReceipt: (log: WorkLog) => void;
}

type ComplianceFilter = 'all' | 'flagged' | 'held' | 'clean';

export const EnterpriseComplianceConsole: React.FC<EnterpriseComplianceConsoleProps> = ({
  logs,
  workers,
  holds,
  userRole,
  onSwitchRole,
  onToggleRetentionHold,
  onBulkAcknowledgeSite,
  onAttendanceAction,
  onOpenReceipt,
}) => {
  const [filterMode, setFilterMode] = useState<ComplianceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSiteKey, setExpandedSiteKey] = useState<string | null>(null);
  const [busySiteKey, setBusySiteKey] = useState<string | null>(null);
  const [courtExhibitLog, setCourtExhibitLog] = useState<WorkLog | null>(null);

  const canModifyCompliance = userRole === 'employer' || userRole === 'administrator';

  const siteSummaries = useMemo(
    () => computeSiteComplianceSummaries(logs, workers, holds),
    [logs, workers, holds]
  );

  const filteredSummaries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return siteSummaries.filter((s) => {
      if (filterMode === 'flagged' && s.anomalyFlags.length === 0 && s.pendingCount === 0) return false;
      if (filterMode === 'held' && !s.retentionHeld) return false;
      if (filterMode === 'clean' && (s.anomalyFlags.length > 0 || s.formVReadinessPct < 80)) return false;
      if (!q) return true;
      return (
        s.siteName.toLowerCase().includes(q) ||
        s.contractorName.toLowerCase().includes(q)
      );
    });
  }, [siteSummaries, filterMode, searchQuery]);

  // Top-level Principal Employer Liability Totals
  const totals = useMemo(() => {
    const totalLiability = siteSummaries.reduce((sum, s) => sum + s.jointLiabilityINR, 0);
    const totalGross = siteSummaries.reduce((sum, s) => sum + s.grossWagesINR, 0);
    const totalLogsCount = siteSummaries.reduce((sum, s) => sum + s.totalLogs, 0);
    const totalEstoppel = siteSummaries.reduce((sum, s) => sum + s.estoppelLockedCount, 0);
    const flaggedSites = siteSummaries.filter((s) => s.anomalyFlags.length > 0).length;
    const weightedReadiness =
      totalLogsCount > 0
        ? Math.round(
            siteSummaries.reduce((sum, s) => sum + s.formVReadinessPct * s.totalLogs, 0) /
              totalLogsCount
          )
        : 100;
    return {
      totalLiability,
      totalGross,
      totalEstoppel,
      flaggedSites,
      weightedReadiness,
      siteCount: siteSummaries.length,
    };
  }, [siteSummaries]);

  const handleExportFormVCsv = () => {
    const headers = [
      'Worksite',
      'Sub-Contractor',
      'Workers',
      'Muster Entries',
      'Form V Readiness (%)',
      'Estoppel Locked',
      'Gross Wages (INR)',
      'Paid Wages (INR)',
      'Joint Liability Exposure (INR)',
      'Retention Hold Active',
      'Audit Flags',
    ];
    const rows = filteredSummaries.map((s) => [
      `"${s.siteName.replace(/"/g, '""')}"`,
      `"${s.contractorName.replace(/"/g, '""')}"`,
      s.uniqueWorkers,
      s.totalLogs,
      s.formVReadinessPct,
      s.estoppelLockedCount,
      s.grossWagesINR,
      s.paidWagesINR,
      s.jointLiabilityINR,
      s.retentionHeld ? 'HELD' : 'CLEAR',
      `"${s.anomalyFlags.join('; ') || 'None'}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bocw_principal_employer_audit_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSiteHoldToggle = async (site: SiteComplianceSummary) => {
    setBusySiteKey(site.siteKey);
    try {
      await onToggleRetentionHold(site.siteKey, site.contractorName, !site.retentionHeld);
    } finally {
      setBusySiteKey(null);
    }
  };

  const handleBulkConfirmClean = async (site: SiteComplianceSummary) => {
    const cleanPendingIds = site.logs
      .filter((l) => {
        const isPending =
          l.verification_status !== 'attendance_acknowledged' &&
          l.verification_status !== 'attendance_disputed' &&
          l.status !== 'verified' &&
          l.status !== 'disputed';
        const hasCoords = l.latitude !== null && l.longitude !== null;
        return isPending && hasCoords && !l.mock_location_detected;
      })
      .map((l) => l.id);

    if (cleanPendingIds.length === 0) return;
    setBusySiteKey(site.siteKey);
    try {
      await onBulkAcknowledgeSite(cleanPendingIds, site.siteName);
    } finally {
      setBusySiteKey(null);
    }
  };

  return (
    <section className="civic-card p-4 sm:p-6 bg-[#fffdfa] space-y-5">
      {/* Masthead Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-[#1c2421]/15 pb-4">
        <div>
          <div className="text-xs font-mono font-bold text-[#1b4332] uppercase tracking-wider mb-1">
            Principal Employer Compliance · BOCW Act 1996 &amp; Code on Wages 2019
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#19231f] flex items-center gap-2 tracking-tight">
            <Building2 className="w-5 h-5 text-[#1b4332] shrink-0" />
            <span>Enterprise EPC &amp; Sub-Contractor Liability Console</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#3d4a44] mt-1 font-medium">
            Audit contractor muster rolls, isolate ghost-worker GPS anomalies, and gate sub-contractor retention payouts before statutory liability accrues.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {!canModifyCompliance && onSwitchRole && (
            <button
              type="button"
              onClick={() => onSwitchRole('employer')}
              className="civic-btn-brass px-3 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Enable Employer Audit Controls</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleExportFormVCsv}
            className="civic-btn-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Form V Audit (.csv)</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-[#1c2421]/25 rounded-md p-3.5 bg-[#fcfbf7]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#3d4a44]">
            Joint Wage Exposure
          </div>
          <div className="text-2xl font-black text-[#9b2226] font-mono tabular-nums mt-1">
            ₹{totals.totalLiability.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#3d4a44] font-medium mt-1">
            Of ₹{totals.totalGross.toLocaleString('en-IN')} gross muster
          </div>
        </div>

        <div className="border border-[#1c2421]/25 rounded-md p-3.5 bg-[#fcfbf7]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#3d4a44]">
            Form V Readiness
          </div>
          <div className="text-2xl font-black text-[#1b4332] font-mono tabular-nums mt-1">
            {totals.weightedReadiness}%
          </div>
          <div className="text-[11px] text-[#3d4a44] font-medium mt-1">
            Across {totals.siteCount} active worksites
          </div>
        </div>

        <div className="border border-[#1c2421]/25 rounded-md p-3.5 bg-[#fcfbf7]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#3d4a44]">
            Sec 121 Estoppel Sealed
          </div>
          <div className="text-2xl font-black text-[#1e7587] font-mono tabular-nums mt-1">
            {totals.totalEstoppel} Shifts
          </div>
          <div className="text-[11px] text-[#3d4a44] font-medium mt-1">
            2h dispute window elapsed
          </div>
        </div>

        <div className="border border-[#1c2421]/25 rounded-md p-3.5 bg-[#fcfbf7]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#3d4a44]">
            Sites With Exceptions
          </div>
          <div className="text-2xl font-black text-[#8c6721] font-mono tabular-nums mt-1">
            {totals.flaggedSites} / {totals.siteCount}
          </div>
          <div className="text-[11px] text-[#3d4a44] font-medium mt-1">
            GPS, quorum, or dispute flags
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f7f3e8] border border-[#1c2421]/20 rounded-md p-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            { id: 'all', label: 'All Sites' },
            { id: 'flagged', label: 'Action Required' },
            { id: 'held', label: 'Retention Held' },
            { id: 'clean', label: 'Audit Clean' },
          ] as Array<{ id: ComplianceFilter; label: string }>).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer whitespace-nowrap transition-colors ${
                filterMode === tab.id
                  ? 'bg-[#1b4332] text-white'
                  : 'bg-white text-[#19231f] border border-[#1c2421]/25 hover:bg-[#ede8d8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3d4a44]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter site or sub-contractor..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#1c2421]/30 rounded text-xs font-semibold text-[#19231f] focus:outline-none focus:border-[#1b4332]"
          />
        </div>
      </div>

      {/* Contractor & Site Audit Table */}
      <div className="overflow-x-auto border border-[#1c2421]/25 rounded-md">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#1b4332] text-white text-[11px] uppercase tracking-wider font-mono">
              <th className="p-3">Worksite &amp; Sub-Contractor</th>
              <th className="p-3 text-right">Form V</th>
              <th className="p-3">Audit Exceptions</th>
              <th className="p-3 text-right">Unpaid Exposure</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c2421]/15 bg-white">
            {filteredSummaries.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-xs text-[#3d4a44] font-semibold">
                  No contractor worksites match the current compliance filter.
                </td>
              </tr>
            ) : (
              filteredSummaries.map((site) => {
                const isExpanded = expandedSiteKey === site.siteKey;
                const isBusy = busySiteKey === site.siteKey;
                const cleanPendingCount = site.logs.filter(
                  (l) =>
                    l.verification_status !== 'attendance_acknowledged' &&
                    l.verification_status !== 'attendance_disputed' &&
                    l.status !== 'verified' &&
                    l.status !== 'disputed' &&
                    l.latitude !== null &&
                    !l.mock_location_detected
                ).length;

                return (
                  <React.Fragment key={site.siteKey}>
                    <tr className="hover:bg-[#fcfbf7] transition-colors align-top">
                      <td className="p-3">
                        <div className="font-black text-[#19231f]">{site.siteName}</div>
                        <div className="text-xs text-[#3d4a44] font-semibold mt-0.5">
                          {site.contractorName} · {site.uniqueWorkers} workers · {site.totalLogs} logs
                        </div>
                      </td>

                      <td className="p-3 text-right font-mono tabular-nums">
                        <div
                          className={`font-black ${
                            site.formVReadinessPct >= 80
                              ? 'text-[#1b4332]'
                              : site.formVReadinessPct >= 50
                              ? 'text-[#8c6721]'
                              : 'text-[#9b2226]'
                          }`}
                        >
                          {site.formVReadinessPct}%
                        </div>
                        <div className="text-[11px] text-[#3d4a44]">
                          {site.verifiedCount} ok / {site.pendingCount} open
                        </div>
                      </td>

                      <td className="p-3">
                        {site.anomalyFlags.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1b4332]">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Clean Muster Telemetry</span>
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {site.anomalyFlags.slice(0, 2).map((flag) => (
                              <div
                                key={flag}
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#9b2226] mr-3"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{flag}</span>
                              </div>
                            ))}
                            {site.anomalyFlags.length > 2 && (
                              <div className="text-[11px] text-[#8c6721] font-semibold">
                                +{site.anomalyFlags.length - 2} additional exception(s)
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono tabular-nums">
                        <div
                          className={`font-black ${
                            site.jointLiabilityINR > 0 ? 'text-[#9b2226]' : 'text-[#1b4332]'
                          }`}
                        >
                          ₹{site.jointLiabilityINR.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-[#3d4a44]">
                          {site.retentionHeld
                            ? `Hold Active · ₹${site.recommendedHoldbackINR.toLocaleString('en-IN')}`
                            : site.recommendedHoldbackINR > 0
                            ? `Rec. Hold ₹${site.recommendedHoldbackINR.toLocaleString('en-IN')}`
                            : 'Settled'}
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {cleanPendingCount > 0 && (
                            <button
                              type="button"
                              disabled={!canModifyCompliance || isBusy}
                              onClick={() => handleBulkConfirmClean(site)}
                              className="px-2.5 py-1.5 text-xs font-bold rounded border border-[#1b4332] bg-[#e8f5e9] text-[#1b4332] hover:bg-[#d1fae5] disabled:opacity-45 cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                              title={
                                canModifyCompliance
                                  ? 'Confirm all clean geotagged logs at this site'
                                  : 'Switch to Contractor or Inspector role to bulk approve'
                              }
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Confirm {cleanPendingCount}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={!canModifyCompliance || isBusy}
                            onClick={() => handleSiteHoldToggle(site)}
                            className={`px-2.5 py-1.5 text-xs font-bold rounded border cursor-pointer whitespace-nowrap inline-flex items-center gap-1 disabled:opacity-45 ${
                              site.retentionHeld
                                ? 'border-[#9b2226] bg-[#9b2226] text-white hover:bg-[#ae2012]'
                                : 'border-[#1c2421] bg-[#f7f3e8] text-[#19231f] hover:bg-[#ede5cf]'
                            }`}
                            title={
                              canModifyCompliance
                                ? 'Hold or release contractor retention payout'
                                : 'Switch to Contractor or Inspector role to toggle retention holds'
                            }
                          >
                            {site.retentionHeld ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Release Hold</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5 text-[#9b2226]" />
                                <span>Hold Retention</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSiteKey(isExpanded ? null : site.siteKey)
                            }
                            className="px-2.5 py-1.5 text-xs font-bold rounded border border-[#1c2421]/40 bg-white hover:bg-[#f4ede0] text-[#19231f] cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                          >
                            <span>Inspect</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-[#fcfbf7]">
                        <td colSpan={5} className="p-3 sm:p-4 border-t border-[#1c2421]/15">
                          <div className="text-xs font-bold uppercase tracking-wider text-[#1b4332] mb-2">
                            Site Muster Roll Audit Trail · {site.siteName}
                          </div>
                          <div className="space-y-2">
                            {site.logs.map((log) => {
                              const estoppel = isEstoppelActive(log);
                              const quorum = getPeerQuorumCount(log, logs);
                              const acc = log.gps_accuracy_meters ?? 8;
                              const isAck =
                                log.verification_status === 'attendance_acknowledged' ||
                                log.status === 'verified';
                              const isDisputed =
                                log.verification_status === 'attendance_disputed' ||
                                log.status === 'disputed';
                              return (
                                <div
                                  key={log.id}
                                  className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2.5 bg-white border border-[#1c2421]/20 rounded text-xs"
                                >
                                  <div className="min-w-0">
                                    <div className="font-bold text-[#19231f] flex flex-wrap items-center gap-2">
                                      <span className="font-mono text-[#1e7587]">
                                        #{log.verification_token}
                                      </span>
                                      <span>·</span>
                                      <span>{log.worker_name || log.phone_number}</span>
                                      <span>·</span>
                                      <span className="font-mono text-[#3d4a44]">
                                        {formatISTDateTime(log.created_at)}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-[#3d4a44] mt-0.5 font-mono tabular-nums">
                                      GPS ±{acc}m · Peer Quorum: {quorum} · Estoppel:{' '}
                                      {estoppel ? 'Locked' : 'Active 2h Window'} · Wage ₹
                                      {(log.actual_wage_earned ?? log.estimated_wage ?? 600).toFixed(0)}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                    {canModifyCompliance && !isAck && !isDisputed && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => onAttendanceAction(log.id, 'acknowledge')}
                                          className="px-2 py-1 text-[11px] font-bold rounded bg-[#1b4332] text-white cursor-pointer"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => onAttendanceAction(log.id, 'dispute')}
                                          className="px-2 py-1 text-[11px] font-bold rounded bg-[#9b2226] text-white cursor-pointer"
                                        >
                                          Dispute
                                        </button>
                                      </>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => onOpenReceipt(log)}
                                      className="px-2 py-1 text-[11px] font-bold rounded border border-[#1c2421]/30 bg-[#f7f3e8] text-[#19231f] cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <FileText className="w-3 h-3" />
                                      <span>Slip</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCourtExhibitLog(log)}
                                      className="px-2 py-1 text-[11px] font-bold rounded border border-[#8c6721] bg-[#fff9e6] text-[#8c6721] cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Scale className="w-3 h-3" />
                                      <span>Sec 63 BSA</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {courtExhibitLog && (
        <CourtEvidenceCertificateModal
          log={courtExhibitLog}
          onClose={() => setCourtExhibitLog(null)}
        />
      )}
    </section>
  );
};

export default EnterpriseComplianceConsole;
