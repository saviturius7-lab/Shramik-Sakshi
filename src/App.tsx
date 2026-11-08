import React, { useState, useEffect, useMemo } from 'react';
import { WorkLog, UserRole } from './types';
import { getStoredLogs, resetStoredLogs, saveStoredLogs, initOfflineSyncEngine } from './services/storage';
import { Header } from './components/Header';
import { NetworkSyncRibbon } from './components/NetworkSyncRibbon';
import { Sidebar } from './components/Sidebar';
import { FieldTelegraphStation } from './components/FieldTelegraphStation';
import { MetricsOverview } from './components/MetricsOverview';
import { WorkerProfile } from './components/WorkerProfile';
import { LiveMap } from './components/LiveMap';
import { LedgerTable } from './components/LedgerTable';
import { DigitalReceiptModal } from './components/DigitalReceiptModal';
import { WhatsAppSimulatorModal } from './components/WhatsAppSimulatorModal';
import { TutorialModal } from './components/TutorialModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { CheckSquare, ListFilter, UserCheck, Map, LayoutGrid, BookOpen, HardHat, ClipboardCheck, Smartphone } from 'lucide-react';

import { BoidsCanvas } from './components/BoidsCanvas';

type ActiveViewTab = 'all' | 'attendance' | 'register' | 'worker' | 'map';

const AppContent: React.FC = () => {
  const { language, t } = useLanguage();
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('worker');
  const [selectedWorker, setSelectedWorker] = useState<string>('All Workers');
  const [selectedReceiptLog, setSelectedReceiptLog] = useState<WorkLog | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [tutorialRole, setTutorialRole] = useState<'worker' | 'admin'>('worker');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('all');
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  const { isInstalled, canInstall, isAndroid, isStandalone, promptInstall } = usePWAInstall();

  const handleOpenTutorial = (role: 'worker' | 'admin' = 'worker') => {
    setTutorialRole(role);
    setIsTutorialOpen(true);
  };

  // Sync logs from backend and localStorage
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs', {
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

  useEffect(() => {
    fetchLogs();
    const cleanupSync = initOfflineSyncEngine(userRole);
    const interval = setInterval(fetchLogs, 6000);
    return () => {
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
    await fetchLogs();
    triggerToast('✓ Register synchronized with latest records.');
  };

  const handleResetData = async () => {
    if (userRole !== 'administrator') {
      triggerToast('⚠️ Only Administrators are permitted to reset data.');
      return;
    }
    try {
      const res = await fetch('/api/reset', { 
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
      const res = await fetch('/api/attendance/action', {
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

  const handleLogCreated = (newLog: WorkLog) => {
    setLogs((prev) => [newLog, ...prev]);
    triggerToast(`✓ New attendance slip #${newLog.verification_token} issued to ${newLog.phone_number}!`);
  };

  const handleQuickCheckIn = () => {
    setActiveTab('attendance');
  };

  // Derive unique workers
  const uniqueWorkers = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.phone_number) {
        set.add(log.phone_number);
      }
    });
    return Array.from(set).sort();
  }, [logs]);

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
      {/* 2D Artistic Landscape Imitation (Pink-Yellowish Sky, Endless Green Fields & Cottage) */}
      <BoidsCanvas opacity={isZenMode ? 1 : 0.96} />

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
          onOpenSimulator={() => setIsSimulatorOpen(true)}
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
            className={`px-4 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 rounded-2xl border-2 border-[#232b28] ${
              activeTab === 'map'
                ? 'bg-[#4d7c0f] text-white shadow-[3px_3px_0px_#232b28]'
                : 'comic-btn-cream text-[#232b28]'
            }`}
          >
            <Map className="w-4 h-4 text-[#bef264]" />
            <span>📍 4. {t.tabWorkMap}</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 rounded-2xl border-2 border-[#232b28] ${
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
            onOpenSimulator={() => setIsSimulatorOpen(true)}
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
              />
            )}

            {/* 2. Worker Passbook Section */}
            {(activeTab === 'all' || activeTab === 'worker') && (
              <WorkerProfile
                selectedWorker={selectedWorker}
                workerLogs={filteredLogs}
                allLogs={logs}
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

            {/* 4. Map Deployment Section */}
            {(activeTab === 'all' || activeTab === 'map') && (
              <LiveMap
                logs={filteredLogs}
                selectedWorker={selectedWorker}
                onOpenReceipt={(log) => setSelectedReceiptLog(log)}
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

      <WhatsAppSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onLogCreated={handleLogCreated}
        currentPhoneNumber={selectedWorker !== 'All Workers' ? selectedWorker : '+919876543210'}
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        initialRole={tutorialRole}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          triggerToast(`✓ Switched to ${tab} view`);
        }}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
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
