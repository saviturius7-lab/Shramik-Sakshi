import React, { useState, useEffect, useMemo } from 'react';
import {
  WorkLog,
  UserRole,
  RegisteredLabour,
  RetentionHoldRecord,
  SiteDeploymentOffer,
} from './types';
import { 
  getStoredLogs, resetStoredLogs, saveStoredLogs, initOfflineSyncEngine, 
  getActiveShiftForWorker, getStoredLabourers, fetchAllLabourers 
} from './services/storage';
import {
  getStoredRetentionHolds,
  saveStoredRetentionHolds,
  getStoredSiteOffers,
  saveStoredSiteOffers,
} from './services/enterpriseCompliance';
import { Header } from './components/Header';
import { NetworkSyncRibbon } from './components/NetworkSyncRibbon';
import { Sidebar } from './components/Sidebar';
import { FieldTelegraphStation } from './components/FieldTelegraphStation';
import { MetricsOverview } from './components/MetricsOverview';
import { WorkerProfile } from './components/WorkerProfile';
import { LiveMap } from './components/LiveMap';
import { LedgerTable } from './components/LedgerTable';
import { EnterpriseComplianceConsole } from './components/EnterpriseComplianceConsole';
import { WorkforceTalentBench } from './components/WorkforceTalentBench';
import { DigitalReceiptModal } from './components/DigitalReceiptModal';
import { LabourRegistrationModal } from './components/LabourRegistrationModal';
import { TutorialModal } from './components/TutorialModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { fetchWithAuth, obtainAuthSession } from './services/auth';
import { CheckSquare, ListFilter, UserCheck, Map, LayoutGrid, Building2, Award, HardHat, ClipboardCheck, Smartphone } from 'lucide-react';

import { BoidsCanvas } from './components/BoidsCanvas';

type ActiveViewTab = 'all' | 'attendance' | 'register' | 'worker' | 'map' | 'compliance' | 'talent';

const AppContent: React.FC = () => {
  const { language, t } = useLanguage();
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [workersRegistry, setWorkersRegistry] = useState<RegisteredLabour[]>(() => getStoredLabourers());
  const [retentionHolds, setRetentionHolds] = useState<RetentionHoldRecord[]>(() => getStoredRetentionHolds());
  const [siteOffers, setSiteOffers] = useState<SiteDeploymentOffer[]>(() => getStoredSiteOffers());
  const [userRole, setUserRole] = useState<UserRole>('worker');
  const [selectedWorker, setSelectedWorker] = useState<string>('All Workers');
  const [selectedReceiptLog, setSelectedReceiptLog] = useState<WorkLog | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);

  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [tutorialRole, setTutorialRole] = useState<'worker' | 'admin'>('worker');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('all');
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  const { isInstalled, canInstall, isAndroid, promptInstall } = usePWAInstall();

  const handleOpenTutorial = (role: 'worker' | 'admin' = 'worker') => {
    setTutorialRole(role);
    setIsTutorialOpen(true);
  };

  // Sync logs, workers, compliance holds, and recruitment offers
  const fetchLogs = async () => {
    try {
      const res = await fetchWithAuth('/api/logs', {
        headers: {
          'x-user-role': userRole,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
          saveStoredLogs(data.logs);
          return;
        }
      }
    } catch {
      // Fallback to client storage
    }
    const local = getStoredLogs();
    setLogs(local);
  };

  const fetchEnterpriseState = async () => {
    try {
      const [workersList, holdsRes, offersRes] = await Promise.all([
        fetchAllLabourers(),
        fetchWithAuth('/api/compliance/holds').catch(() => null),
        fetchWithAuth('/api/recruitment/offers').catch(() => null),
      ]);
      setWorkersRegistry(workersList);
      if (holdsRes && holdsRes.ok) {
        const holdsData = await holdsRes.json();
        if (Array.isArray(holdsData.holds)) {
          setRetentionHolds(holdsData.holds);
          saveStoredRetentionHolds(holdsData.holds);
        }
      }
      if (offersRes && offersRes.ok) {
        const offersData = await offersRes.json();
        if (Array.isArray(offersData.offers)) {
          setSiteOffers(offersData.offers);
          saveStoredSiteOffers(offersData.offers);
        }
      }
    } catch {
      // Offline fallback already loaded in initial state
    }
  };

  useEffect(() => {
    let active = true;
    obtainAuthSession(userRole)
      .then(() => {
        if (!active) return;
        fetchLogs();
        fetchEnterpriseState();
      })
      .catch(() => {
        fetchLogs();
      });
    const cleanupSync = initOfflineSyncEngine(userRole);
    const interval = setInterval(fetchLogs, 6000);
    return () => {
      active = false;
      cleanupSync();
      clearInterval(interval);
    };
  }, [userRole]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleRefresh = async () => {
    await Promise.all([fetchLogs(), fetchEnterpriseState()]);
    triggerToast('✓ Register synchronized with latest records.');
  };

  const handleResetData = async () => {
    if (userRole !== 'administrator') {
      triggerToast('⚠️ Only Administrators are permitted to reset data.');
      return;
    }
    try {
      const res = await fetchWithAuth('/api/reset', { 
        method: 'POST',
        headers: {
          'x-user-role': userRole,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        triggerToast(`Reset failed: ${errData.error || 'Unauthorized'}`);
        return;
      }
    } catch {
      // Ignored
    }
    const fresh = resetStoredLogs();
    setLogs(fresh);
    setSelectedWorker('All Workers');
    triggerToast('✓ Records reset to sample data.');
  };

  const handleAttendanceAction = async (id: string, action: 'acknowledge' | 'dispute') => {
    try {
      const res = await fetchWithAuth('/api/attendance/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
        },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        triggerToast(action === 'acknowledge' ? '✓ Attendance acknowledged by supervisor' : '⚠️ Attendance flagged as disputed');
        await fetchLogs();
      } else {
        triggerToast(`Notice: ${data.error || 'Action failed'}`);
      }
    } catch {
      triggerToast('Network error updating record');
    }
  };

  const handleToggleRetentionHold = async (siteKey: string, contractorName: string, held: boolean) => {
    const optimistic: RetentionHoldRecord = {
      siteKey,
      contractorName,
      held,
      updatedAt: new Date().toISOString(),
      updatedByRole: userRole,
    };
    try {
      await obtainAuthSession(userRole);
      const res = await fetchWithAuth('/api/compliance/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': userRole },
        body: JSON.stringify({ siteKey, contractorName, held }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.holds)) {
          setRetentionHolds(data.holds);
          saveStoredRetentionHolds(data.holds);
          triggerToast(held ? `Retention hold placed for ${contractorName}` : `Retention hold released for ${contractorName}`);
          return;
        }
      }
    } catch {}
    const next = [optimistic, ...retentionHolds.filter((h) => h.siteKey !== siteKey)];
    setRetentionHolds(next);
    saveStoredRetentionHolds(next);
    triggerToast(held ? `Retention hold placed for ${contractorName}` : `Retention hold released for ${contractorName}`);
  };

  const handleBulkAcknowledgeSite = async (attendanceIds: string[], siteName: string) => {
    try {
      await obtainAuthSession(userRole);
      const res = await fetchWithAuth('/api/compliance/bulk-acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': userRole },
        body: JSON.stringify({ attendanceIds }),
      });
      if (res.ok) {
        triggerToast(`✓ Confirmed ${attendanceIds.length} clean muster slips at ${siteName}`);
        await fetchLogs();
        return;
      }
    } catch {}
    const idSet = new Set(attendanceIds);
    const updated = logs.map((l) =>
      idSet.has(l.id)
        ? { ...l, verification_status: 'attendance_acknowledged' as const, status: 'verified' as const, estoppel_active: true }
        : l
    );
    setLogs(updated);
    saveStoredLogs(updated);
    triggerToast(`✓ Confirmed ${attendanceIds.length} clean muster slips at ${siteName}`);
  };

  const handleCreateSiteOffer = async (offerData: {
    workerPhone: string;
    workerName: string;
    trade: string;
    employerName: string;
    projectSite: string;
    offeredDailyWage: number;
    durationDays: number;
    startDate: string;
  }) => {
    try {
      await obtainAuthSession(userRole);
      const res = await fetchWithAuth('/api/recruitment/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': userRole },
        body: JSON.stringify(offerData),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.offers)) {
          setSiteOffers(data.offers);
          saveStoredSiteOffers(data.offers);
          triggerToast(`✓ Deployment offer sent to ${offerData.workerName} (₹${offerData.offeredDailyWage}/day)`);
          return;
        }
      }
    } catch {}
    const fallbackOffer: SiteDeploymentOffer = {
      id: `OFFER-2026-${Math.floor(100 + Math.random() * 900)}`,
      ...offerData,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const next = [fallbackOffer, ...siteOffers];
    setSiteOffers(next);
    saveStoredSiteOffers(next);
    triggerToast(`✓ Deployment offer saved for ${offerData.workerName}`);
  };

  const handleRespondSiteOffer = async (offerId: string, status: 'accepted' | 'declined') => {
    try {
      const res = await fetchWithAuth(`/api/recruitment/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.offers)) {
          setSiteOffers(data.offers);
          saveStoredSiteOffers(data.offers);
          triggerToast(status === 'accepted' ? '✓ Site deployment offer accepted' : 'Offer declined');
          return;
        }
      }
    } catch {}
    const next = siteOffers.map((o) => (o.id === offerId ? { ...o, status } : o));
    setSiteOffers(next);
    saveStoredSiteOffers(next);
    triggerToast(status === 'accepted' ? '✓ Site deployment offer accepted' : 'Offer declined');
  };

  const handleLogCreated = (newLog: WorkLog) => {
    setLogs((prev) => [newLog, ...prev]);
    triggerToast(`✓ New attendance slip #${newLog.verification_token} issued to ${newLog.phone_number}!`);
  };

  const handleQuickCheckIn = () => {
    setActiveTab('attendance');
  };

  // Derive unique workers (combining registered labourers & attendance logs)
  const uniqueWorkers = useMemo(() => {
    const set = new Set<string>();
    workersRegistry.forEach((l) => {
      if (l.phoneNumber) set.add(l.phoneNumber);
    });
    logs.forEach((log) => {
      if (log.phone_number) {
        set.add(log.phone_number);
      }
    });
    return Array.from(set).sort();
  }, [logs, workersRegistry]);

  // Active shift for currently selected worker
  const activeShiftLog = useMemo(() => {
    if (selectedWorker === 'All Workers') return null;
    return getActiveShiftForWorker(selectedWorker, logs);
  }, [selectedWorker, logs]);

  // Filter logs for selected worker
  const filteredLogs = useMemo(() => {
    if (selectedWorker === 'All Workers') {
      return logs;
    }
    return logs.filter((l) => l.phone_number === selectedWorker);
  }, [logs, selectedWorker]);


  const activeLaborersCount = uniqueWorkers.length;
  // Unique workdays (not raw count of multiple punch pins on same day)
  const totalManDays = useMemo(() => {
    return new Set(filteredLogs.map((l) => (l.date || l.created_at || '').slice(0, 10))).size;
  }, [filteredLogs]);

  // Outstanding / earned wages based on actual wage earned
  const securedCapital = useMemo(() => {
    return filteredLogs.reduce(
      (acc, curr) => acc + (Number(curr.actual_wage_earned ?? curr.estimated_wage) || 600),
      0
    );
  }, [filteredLogs]);

  return (
    <div className="min-h-screen relative font-sans flex flex-col selection:bg-[#c29437] selection:text-[#19231f]">
      {/* 2D Artistic Landscape with Craig Reynolds Flying Bird Flock Boids */}
      <BoidsCanvas opacity={isZenMode ? 1 : 0.96} flockSize={38} />

      {/* Floating Quick Zen Controls when in atmospheric sky view */}
      {isZenMode && (
        <div className="fixed top-4 left-4 z-50 bg-[#fffdfa]/95 backdrop-blur-xs border-2 border-[#1c2421] rounded-2xl p-2 sm:p-2.5 shadow-[4px_4px_0px_#1c2421] flex items-center gap-2 animate-fade-in no-print">
          <button
            onClick={() => setIsZenMode(false)}
            className="civic-btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <span>📜 Restore Ledger</span>
          </button>
          <button
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('shramik-scatter-flock', {
                  detail: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.22 },
                })
              );
            }}
            className="civic-btn-brass px-3 py-1.5 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <span>🪶 Scatter Flock</span>
          </button>
          <span className="text-[11px] font-bold text-[#1b4332] hidden sm:inline pl-1 border-l border-[#1c2421]/20">
            Click anywhere on the sky to send wind waves
          </span>
        </div>
      )}

      {/* Whimsical Comic Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#fffef9] text-[#232b28] px-4 py-3 border-[2.5px] border-[#232b28] rounded-[225px_15px_255px_15px/15px_255px_15px_225px] shadow-[4px_4px_0px_#232b28] text-sm font-black flex items-center gap-2.5 animate-bounce font-sans">
          <span className="w-2.5 h-2.5 rounded-full bg-[#38a169]"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div
        className={`relative z-10 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col transition-all duration-500 ${
          isZenMode ? 'opacity-15 hover:opacity-100 pointer-events-none hover:pointer-events-auto' : 'opacity-100'
        }`}
      >
        {/* Real-time Network & Background Sync Status Ribbon */}
        <NetworkSyncRibbon userRole={userRole} onSyncCompleted={fetchLogs} />

        {/* Authoritative Civic Muster Command Header */}
        <Header
          onOpenRegisterLabour={() => setIsRegisterModalOpen(true)}
          onRefresh={handleRefresh}
          onOpenTutorial={handleOpenTutorial}
          onPrintPassbook={() => {
            setActiveTab('worker');
            setTimeout(() => window.print(), 300);
          }}
          userRole={userRole}
          onSwitchRole={setUserRole}
          isZenMode={isZenMode}
          onToggleZenMode={() => setIsZenMode(!isZenMode)}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          isAppInstalled={isInstalled}
          activeShiftWorker={activeShiftLog ? selectedWorker : null}
        />


        {/* Civic Muster Roll Summary Cards */}
        <MetricsOverview
          activeLaborers={selectedWorker === 'All Workers' ? activeLaborersCount : 1}
          totalDays={totalManDays}
          totalCapital={securedCapital}
        />

        {/* Large, Simple, Numbered Navigation Tabs for Easy Touch & Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 rounded-2xl border-2 border-[#232b28] ${
              activeTab === 'attendance'
                ? 'bg-[#1b4332] text-white shadow-[3px_3px_0px_#232b28]'
                : 'comic-btn-cream text-[#232b28]'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-[#4ade80]" />
            <span>✍️ 1. {t.tabMarkAttendance}</span>
          </button>

          <button
            onClick={() => setActiveTab('worker')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 rounded-2xl border-2 border-[#232b28] ${
              activeTab === 'worker'
                ? 'bg-[#b45309] text-white shadow-[3px_3px_0px_#232b28]'
                : 'comic-btn-cream text-[#232b28]'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#fde047]" />
            <span>💰 2. {t.tabWorkerPassbook}</span>
          </button>

          <button
            onClick={() => setActiveTab('register')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 rounded-2xl border-2 border-[#232b28] ${
              activeTab === 'register'
                ? 'bg-[#1e7587] text-white shadow-[3px_3px_0px_#232b28]'
                : 'comic-btn-cream text-[#232b28]'
            }`}
          >
            <ListFilter className="w-4 h-4 text-[#38bdf8]" />
            <span>📋 3. {t.tabAttendanceList}</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer active:scale-95 rounded-2xl border-2 border-[#232b28] ${
              activeTab === 'map'
                ? 'bg-[#4d7c0f] text-white shadow-[3px_3px_0px_#232b28]'
                : 'comic-btn-cream text-[#232b28]'
            }`}
          >
            <Map className="w-4 h-4 text-[#bef264]" />
            <span>📍 4. {t.tabWorkMap}</span>
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer active:scale-95 rounded-2xl border-2 border-[#232b28] ${
              activeTab === 'compliance'
                ? 'bg-[#19231f] text-white shadow-[3px_3px_0px_#232b28]'
                : 'comic-btn-cream text-[#232b28]'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#c29437]" />
            <span>🏢 5. {t.tabComplianceConsole}</span>
          </button>

          <button
            onClick={() => setActiveTab('talent')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer active:scale-95 rounded-2xl border-2 border-[#232b28] ${
              activeTab === 'talent'
                ? 'bg-[#8c6721] text-white shadow-[3px_3px_0px_#232b28]'
                : 'comic-btn-cream text-[#232b28]'
            }`}
          >
            <Award className="w-4 h-4 text-[#fde047]" />
            <span>🪪 6. {t.tabTalentBench}</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer active:scale-95 rounded-2xl border-2 border-[#232b28] ${
              activeTab === 'all'
                ? 'bg-[#374151] text-white shadow-[3px_3px_0px_#232b28]'
                : 'comic-btn-cream text-[#232b28]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>🏠 {t.tabAllInOne}</span>
          </button>
        </div>

        {/* Layout: Sidebar + Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start flex-1">
          {/* Controls Sidebar */}
          <Sidebar
            workers={uniqueWorkers}
            selectedWorker={selectedWorker}
            onSelectWorker={(worker) => {
              setSelectedWorker(worker);
              if (worker !== 'All Workers' && activeTab === 'all') {
                setActiveTab('worker');
              }
            }}
            onOpenRegisterLabour={() => setIsRegisterModalOpen(true)}
            onQuickCheckIn={handleQuickCheckIn}
            onResetData={handleResetData}
            onOpenTutorial={handleOpenTutorial}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
            isAppInstalled={isInstalled}
          />

          {/* Main Workspace Section based on Active Tab */}
          <main className="flex-1 w-full min-w-0 space-y-6">
            {/* 1. Mark Attendance Section */}
            {(activeTab === 'all' || activeTab === 'attendance') && (
              <FieldTelegraphStation
                onLogReceived={handleLogCreated}
                onRefreshLedger={fetchLogs}
                onOpenReceipt={(log) => setSelectedReceiptLog(log)}
                selectedWorker={selectedWorker}
                workers={uniqueWorkers}
                userRole={userRole}
                onOpenLabourRegistration={() => setIsRegisterModalOpen(true)}
                activeShiftLog={activeShiftLog}
                onCheckOutShift={(checkedOutLog) => {
                  setLogs((prev) => prev.map((l) => (l.id === checkedOutLog.id ? checkedOutLog : l)));
                  setSelectedReceiptLog(checkedOutLog);
                  triggerToast(`✓ Shift completed! ${checkedOutLog.hours_worked}h recorded. Wage sealed.`);
                }}
              />
            )}

            {/* 2. Worker Passbook Section */}
            {(activeTab === 'all' || activeTab === 'worker') && (
              <WorkerProfile
                selectedWorker={selectedWorker}
                workerLogs={filteredLogs}
                allLogs={logs}
                workers={workersRegistry}
                offers={siteOffers}
                onRespondOffer={handleRespondSiteOffer}
                onOpenReceipt={(log) => setSelectedReceiptLog(log)}
              />
            )}

            {/* 3. Daily Attendance Register Table */}
            {(activeTab === 'all' || activeTab === 'register') && (
              <LedgerTable
                logs={filteredLogs}
                onOpenReceipt={(log) => setSelectedReceiptLog(log)}
                userRole={userRole}
                onAttendanceAction={handleAttendanceAction}
              />
            )}

            {/* 4. Fluid GIS Map Deployment Section */}
            {(activeTab === 'all' || activeTab === 'map') && (
              <LiveMap
                logs={filteredLogs}
                selectedWorker={selectedWorker}
                onOpenReceipt={(log) => setSelectedReceiptLog(log)}
              />
            )}

            {/* 5. Pivot 1: Enterprise EPC & Principal Employer Compliance Console */}
            {(activeTab === 'all' || activeTab === 'compliance') && (
              <EnterpriseComplianceConsole
                logs={logs}
                workers={workersRegistry}
                holds={retentionHolds}
                userRole={userRole}
                onSwitchRole={setUserRole}
                onToggleRetentionHold={handleToggleRetentionHold}
                onBulkAcknowledgeSite={handleBulkAcknowledgeSite}
                onAttendanceAction={handleAttendanceAction}
                onOpenReceipt={(log) => setSelectedReceiptLog(log)}
              />
            )}

            {/* 6. Pivot 3: Verified Workforce Bench & Skill/Credit Credentials */}
            {(activeTab === 'all' || activeTab === 'talent') && (
              <WorkforceTalentBench
                logs={logs}
                workers={workersRegistry}
                offers={siteOffers}
                userRole={userRole}
                onSwitchRole={setUserRole}
                onCreateOffer={handleCreateSiteOffer}
                onRespondOffer={handleRespondSiteOffer}
                onSelectWorkerPassbook={(phone) => {
                  setSelectedWorker(phone);
                  setActiveTab('worker');
                }}
              />
            )}
          </main>
        </div>

        {/* Official Civic Footer */}
        <footer className="mt-12 py-3 px-4 bg-[#f4ede0] border border-[#1b4332]/40 rounded shadow-sm text-center text-xs sm:text-sm font-mono font-bold text-[#19231f] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>{t.footerActTitle}</strong>
          </div>
          <div className="text-[#1b4332] font-mono font-bold">
            {t.footerNodeNote}
          </div>
        </footer>
      </div>

      {/* Floating Quick Field Guide Launcher in bottom-right corner */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 no-print">
        <button
          onClick={() => handleOpenTutorial('worker')}
          className="civic-btn-primary px-3 sm:px-3.5 py-2 text-xs font-bold shadow-[2px_2px_0px_#1c2421] flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="Open Worker Walkthrough"
        >
          <HardHat className="w-3.5 h-3.5 text-[#c29437]" />
          <span>{language === 'hi' ? 'मजदूर गाइड' : 
                 language === 'kn' ? 'ಕಾರ್ಮಿಕ ಗೈಡ್' : 
                 language === 'te' ? 'కార్మిక గైడ్' : 
                 language === 'ta' ? 'தொழிலாளர்' : 
                 language === 'ml' ? 'തൊഴിലാളി' : 
                 'Worker Guide'}</span>
        </button>
        <button
          onClick={() => handleOpenTutorial('admin')}
          className="civic-btn-brass px-3 sm:px-3.5 py-2 text-xs font-bold shadow-[2px_2px_0px_#1c2421] flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="Open Admin & Supervisor Walkthrough"
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'ठेकेदार गाइड' : 
                 language === 'kn' ? 'ಮೇಲ್ವಿಚಾರಕ' : 
                 language === 'te' ? 'సూపర్‌వైజర్' : 
                 language === 'ta' ? 'மேற்பார்வையாளர்' : 
                 language === 'ml' ? 'സൂപ്പർവൈസർ' : 
                 'Admin Guide'}</span>
        </button>
      </div>

      {/* Mobile Floating Android Install Banner */}
      {!isInstalled && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-sm bg-[#1b4332] text-white p-3 rounded-2xl border-3 border-[#1c2421] shadow-[5px_5px_0px_#1c2421] flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#c29437] text-[#19231f] flex items-center justify-center font-black shrink-0 border border-[#1c2421]">
              <Smartphone className="w-5 h-5 text-[#19231f]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black tracking-wide truncate">
                {language === 'hi' ? '📲 फोन में ऐप डाउनलोड करें' : '📲 Download Android App'}
              </div>
              <div className="text-[11px] text-[#e0ede5] font-bold truncate">
                {language === 'hi' ? 'बिना इंटरनेट काम करेगी • 0 MB' : 'Offline ready • 0 MB space'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="px-3 py-1.5 bg-[#2e7d32] hover:bg-[#236b27] text-white text-xs font-black rounded-xl border border-white/60 shadow-xs shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            {language === 'hi' ? 'इंस्टॉल' : 'Install'}
          </button>
        </div>
      )}

      {/* Modals */}
      <DigitalReceiptModal
        log={selectedReceiptLog}
        onClose={() => setSelectedReceiptLog(null)}
      />

      <LabourRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onWorkerRegistered={(worker) => {
          setSelectedWorker(worker.phoneNumber);
          setActiveTab('attendance');
          triggerToast(`✓ Labour ${worker.name} registered! Shramik Card ${worker.id} issued.`);
          fetchLogs();
          fetchEnterpriseState();
        }}
        defaultPhone={selectedWorker !== 'All Workers' ? selectedWorker : ''}
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        initialRole={tutorialRole}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          triggerToast(`✓ Switched to ${tab} view`);
        }}
        onOpenRegisterLabour={() => setIsRegisterModalOpen(true)}
      />

      <AndroidInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        canInstall={canInstall}
        isInstalled={isInstalled}
        isAndroid={isAndroid}
        onTriggerInstall={promptInstall}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
