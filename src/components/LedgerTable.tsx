import React, { useState } from 'react';
import { WorkLog } from '../types';
import { formatISTDateTime } from '../services/storage';
import { Search, Download, MapPin, ArrowUpDown, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface LedgerTableProps {
  logs: WorkLog[];
  onOpenReceipt: (log: WorkLog) => void;
  userRole?: string;
  onAttendanceAction?: (id: string, action: 'acknowledge' | 'dispute') => void;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({ 
  logs, 
  onOpenReceipt,
  userRole = 'worker',
  onAttendanceAction,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredLogs = logs
    .filter((log) => {
      const term = searchTerm.toLowerCase();
      return (
        log.phone_number.toLowerCase().includes(term) ||
        (log.raw_message && log.raw_message.toLowerCase().includes(term)) ||
        (log.location_name && log.location_name.toLowerCase().includes(term)) ||
        (log.verification_token && log.verification_token.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortAsc ? timeA - timeB : timeB - timeA;
    });

  const exportCSV = () => {
    const headers = [
      'Slip Number',
      'Date & Time (IST)',
      'Worker Phone',
      'Work Place',
      'Daily Wage (INR)',
      'Verification Status',
      'Is Demo'
    ];

    const rows = filteredLogs.map((log) => [
      log.verification_token,
      `"${formatISTDateTime(log.created_at)}"`,
      `"${log.phone_number}"`,
      `"${(log.location_name || log.raw_message || '').replace(/"/g, '""')}"`,
      log.actual_wage_earned ?? log.estimated_wage ?? 600,
      log.verification_status || log.status,
      log.is_demo ? 'YES' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_register_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="comic-card rounded-2xl p-4 sm:p-6 shadow-md overflow-hidden bg-[#fffdfa]">
      {/* Scalloped Roof Trim */}
      <div className="roof-scallops -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5 border-b-2 border-[#232b28]/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="bg-[#1e7587] text-white border-2 border-[#232b28] text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-[1px_1px_0px_#232b28]">
              {t.officialRegisterBadge}
            </span>
            <span className="text-xs font-mono font-black text-[#2f855a]">
              {filteredLogs.length} Records
            </span>
            {(userRole === 'employer' || userRole === 'administrator') && (
              <span className="bg-[#fef5dc] text-[#d97706] border-2 border-[#232b28] text-[10px] font-black px-2 py-0.5 rounded-full">
                Supervisor Mode: Review & Confirm Attendance
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#232b28]">
            {t.musterScheduleTitle}
          </h3>
          <p className="text-xs sm:text-sm text-[#55694a] mt-0.5 font-semibold">
            {t.ledgerSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1e7587]" />
            <input
              type="text"
              placeholder={t.filterPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#232b28] rounded-xl text-xs sm:text-sm font-bold text-[#232b28] placeholder-[#7d8f78] focus:outline-none shadow-[2px_2px_0px_#232b28]"
            />
          </div>

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="comic-btn-cream inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black cursor-pointer active:scale-95"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#1e7587]" />
            <span>{sortAsc ? t.oldestBtn : t.newestBtn}</span>
          </button>

          <button
            onClick={exportCSV}
            className="comic-btn-teal inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>{t.exportCsvBtn}</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto comic-inset rounded-2xl bg-white">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-[#d8f1e9] text-[#232b28] font-black border-b-2 border-[#232b28] text-xs uppercase tracking-wider">
              <th className="py-3.5 px-3.5 whitespace-nowrap">📄 Slip No.</th>
              <th className="py-3.5 px-3.5 whitespace-nowrap">📅 Date &amp; Time</th>
              <th className="py-3.5 px-3.5 whitespace-nowrap">📱 Worker Phone</th>
              <th className="py-3.5 px-3.5 whitespace-nowrap">📍 Work Place</th>
              <th className="py-3.5 px-3.5 text-right whitespace-nowrap">💰 Daily Wage</th>
              <th className="py-3.5 px-3.5 text-center whitespace-nowrap">Status (स्थिति)</th>
              <th className="py-3.5 px-3.5 text-center whitespace-nowrap">Open Slip</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#232b28]/10 text-[#232b28]">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm font-bold text-[#55694a]">
                  {t.emptyLedgerText}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const status = log.verification_status || log.status;
                const isPending = status === 'location_submitted' || status === 'pending';

                return (
                  <tr key={log.id} className="hover:bg-[#f4efe6] transition-colors duration-150 font-bold group">
                    <td className="py-3.5 px-3.5 font-mono font-black text-[#1f5f61] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>#{log.verification_token}</span>
                        {log.is_demo && (
                          <span className="text-[9px] bg-[#fbbf24] text-[#78350f] border border-[#1c2320] px-1 rounded font-black">
                            SAMPLE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 whitespace-nowrap text-xs text-[#55694a] font-mono">
                      {formatISTDateTime(log.created_at)}
                    </td>
                    <td className="py-3.5 px-3.5 font-bold font-mono whitespace-nowrap text-[#1c2320]">
                      {log.phone_number}
                    </td>
                    <td className="py-3.5 px-3.5 min-w-[160px] max-w-xs text-[#1c2320] leading-snug">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#1e724c] shrink-0" />
                        <span className="line-clamp-2">
                          {log.location_name || log.raw_message}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-black text-[#1e724c] font-mono text-sm sm:text-base whitespace-nowrap">
                      ₹{(log.actual_wage_earned ?? log.estimated_wage ?? 600).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                      {status === 'attendance_acknowledged' && (
                        <span className="stamp-acknowledged text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ✓ Confirmed (पक्का)
                        </span>
                      )}
                      {status === 'location_matched' && (
                        <span className="stamp-acknowledged text-[11px] !bg-[#e0f2fe] !text-[#0369a1] !border-[#0369a1]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ✓ At Site (साइट पर)
                        </span>
                      )}
                      {status === 'location_submitted' && (
                        <span className="stamp-submitted text-[11px]">
                          ⏳ Saved (दर्ज हुआ)
                        </span>
                      )}
                      {status === 'attendance_disputed' && (
                        <span className="stamp-disputed text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          ⚠️ Disputed (विवाद)
                        </span>
                      )}
                      {!['attendance_acknowledged', 'location_matched', 'location_submitted', 'attendance_disputed'].includes(status) && (
                        <span className="stamp-submitted text-[11px]">
                          {status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Employer Acknowledgement / Dispute buttons */}
                        {(userRole === 'employer' || userRole === 'administrator') && isPending && onAttendanceAction && (
                          <>
                            <button
                              onClick={() => onAttendanceAction(log.id, 'acknowledge')}
                              className="comic-btn-emerald px-2 py-1 text-xs font-black cursor-pointer"
                              title="Acknowledge Attendance"
                            >
                              ✓ Confirm
                            </button>
                            <button
                              onClick={() => onAttendanceAction(log.id, 'dispute')}
                              className="comic-btn-pink px-2 py-1 text-xs font-black cursor-pointer"
                              title="Dispute Attendance"
                            >
                              ✗ Dispute
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onOpenReceipt(log)}
                          className="comic-btn-pink px-3 py-1.5 text-xs font-black cursor-pointer active:scale-95 flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Slip</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
