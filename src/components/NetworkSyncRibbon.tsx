import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Zap, Database, Cpu } from 'lucide-react';
import { subscribeToSyncState, drainOfflineSyncQueue, SyncState } from '../services/storage';
import { syncWalDeltaBatch, getPendingWalRecords, WalRecord } from '../services/offlineWal';

interface NetworkSyncRibbonProps {
  userRole?: string;
  onSyncCompleted?: () => void;
}

export const NetworkSyncRibbon: React.FC<NetworkSyncRibbonProps> = ({ 
  userRole = 'worker',
  onSyncCompleted,
}) => {
  const [syncState, setSyncState] = useState<SyncState>({
    status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online',
    pendingCount: 0,
  });
  const [walPendingCount, setWalPendingCount] = useState<number>(0);
  const [isDraining, setIsDraining] = useState(false);
  const [queueMetrics, setQueueMetrics] = useState<{ queueDepth: number; processed: number }>({ queueDepth: 0, processed: 0 });

  const refreshWalCount = async () => {
    try {
      const records = await getPendingWalRecords();
      setWalPendingCount(records.length);
    } catch {
      setWalPendingCount(0);
    }
  };

  const fetchIngressMetrics = async () => {
    try {
      const res = await fetch('/api/ingress/metrics');
      if (res.ok) {
        const data = await res.json();
        setQueueMetrics({
          queueDepth: data.currentQueueDepth || 0,
          processed: data.metrics?.totalProcessed || 0,
        });
      }
    } catch {}
  };

  useEffect(() => {
    const unsubscribe = subscribeToSyncState((state) => {
      setSyncState(state);
    });
    refreshWalCount();
    fetchIngressMetrics();

    const interval = setInterval(() => {
      refreshWalCount();
      fetchIngressMetrics();
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    setIsDraining(true);
    // Flush both standard queue and cryptographic WAL deltas
    const walResult = await syncWalDeltaBatch();
    const queueResult = await drainOfflineSyncQueue(userRole);
    await refreshWalCount();
    await fetchIngressMetrics();
    setIsDraining(false);

    if ((walResult.synced > 0 || queueResult.syncedCount > 0) && onSyncCompleted) {
      onSyncCompleted();
    }
  };

  const { status, pendingCount, lastSyncedAt } = syncState;
  const totalPending = pendingCount + walPendingCount;

  return (
    <div className="w-full mb-4">
      {/* 1. Offline Mode Notice */}
      {status === 'offline' && (
        <div className="bg-[#fef3c7] border-2 border-[#1e2522] rounded-2xl p-3 shadow-[3px_3px_0px_#1e2522] flex flex-col sm:flex-row items-center justify-between gap-2.5 transition-all animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#f59e0b] border-2 border-[#1e2522] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#1e2522]">
              <WifiOff className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-[#1e2522] flex items-center gap-2 flex-wrap">
                <span>🟡 No Internet Right Now — Don't Worry!</span>
                {totalPending > 0 && (
                  <span className="bg-[#b45309] text-white px-2 py-0.5 text-xs font-black rounded-lg border border-[#1e2522]">
                    {totalPending} Attendance Slip{totalPending > 1 ? 's' : ''} Stored Safely on Phone
                  </span>
                )}
              </div>
              <p className="text-xs text-[#78350f] font-bold mt-0.5">
                Your attendance and wage records are completely safe on this device. They will be sent to the government server as soon as internet connects.
              </p>
            </div>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isDraining}
            className="comic-btn-cream px-3.5 py-2 text-xs font-black shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            title="Try sending saved records now"
          >
            <RefreshCw className={`w-4 h-4 text-[#1e7587] ${isDraining ? 'animate-spin' : ''}`} />
            <span>{isDraining ? 'Saving now...' : '🔄 Send Saved Work Now'}</span>
          </button>
        </div>
      )}

      {/* 2. Actively Syncing State */}
      {status === 'syncing' && (
        <div className="bg-[#e0f2fe] border-2 border-[#1e2522] rounded-2xl p-3 shadow-[3px_3px_0px_#1e2522] flex items-center justify-between gap-2 transition-all">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-[#0284c7] animate-spin shrink-0" />
            <span className="text-xs sm:text-sm font-black text-[#0369a1]">
              Saving {totalPending} work record{totalPending > 1 ? 's' : ''} to server... Please wait a moment.
            </span>
          </div>
          <span className="text-xs font-bold text-[#0284c7]">
            Saving...
          </span>
        </div>
      )}

      {/* 3. Synced Success or Normal Connected Bar */}
      {(status === 'synced' || status === 'online') && (
        <div className="bg-[#f2ede4] border-2 border-[#1e2522] rounded-2xl px-4 py-2 shadow-[2px_2px_0px_#1e2522] flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#1e2522]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-3 h-3 rounded-full bg-[#1e724c] border border-[#1e2522] shrink-0" />
            <span className="font-extrabold text-[#1e2522] tracking-wide flex items-center gap-1.5">
              <span>🟢 Internet Connected</span>
              <span className="bg-[#1b4332] text-white text-[10px] px-2 py-0.5 rounded font-bold">
                ✓ ALL WORK SAVED &amp; SAFE
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {totalPending > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isDraining}
                className="bg-[#dcfce7] text-[#15803d] border border-[#1e2522] px-2.5 py-1 rounded text-xs font-black cursor-pointer hover:bg-[#bbf7d0]"
              >
                Send {totalPending} Saved Slips Now
              </button>
            )}
            {lastSyncedAt && (
              <span className="font-mono text-xs text-[#42544a]">
                Last checked: {lastSyncedAt}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
