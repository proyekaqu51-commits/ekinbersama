import React, { useEffect, useState } from 'react';
import {
  Menu,
  Calendar,
  School,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle2,
  Clock,
  Trash2,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { UserSession, TeacherProfile } from '../../types';
import { IndexedDbService, OfflineSyncStatus } from '../../services/indexedDbService';
import { StorageService } from '../../services/storageService';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface HeaderProps {
  session: UserSession;
  title: string;
  subtitle: string;
  onToggleSidebar: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onToggleSidebar,
  showToast
}) => {
  const [syncStatus, setSyncStatus] = useState<OfflineSyncStatus>(() =>
    IndexedDbService.getSyncStatus()
  );
  const [showSyncPopover, setShowSyncPopover] = useState(false);
  const [confirmResetFresh, setConfirmResetFresh] = useState(false);
  const [isResettingFresh, setIsResettingFresh] = useState(false);

  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => StorageService.getTeachers());
  const [activeTeacherId, setActiveTeacherId] = useState<string>(() => StorageService.getActiveTeacherId());
  const [activeTeacher, setActiveTeacher] = useState<TeacherProfile>(() => StorageService.getActiveTeacher());

  useEffect(() => {
    const handleTeacherChanged = () => {
      setTeachers(StorageService.getTeachers());
      setActiveTeacherId(StorageService.getActiveTeacherId());
      setActiveTeacher(StorageService.getActiveTeacher());
    };
    window.addEventListener('lms-teacher-changed', handleTeacherChanged);
    return () => window.removeEventListener('lms-teacher-changed', handleTeacherChanged);
  }, []);

  const handleHeaderTeacherSwitch = (newId: string) => {
    StorageService.setActiveTeacherId(newId);
    setActiveTeacherId(newId);
    const prof = StorageService.getActiveTeacher();
    setActiveTeacher(prof);
    if (showToast) {
      showToast(`Beralih ke: ${prof.fullName} (${prof.schoolName})`, 'success');
    }
  };

  useEffect(() => {
    const unsubscribe = IndexedDbService.subscribeSyncStatus(status => {
      setSyncStatus(status);
    });
    IndexedDbService.refreshCounts().catch(() => {});
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    if (!syncStatus.isOnline) {
      if (showToast) {
        showToast(
          'Perangkat sedang offline. Seluruh perubahan tersimpan di IndexedDB dan akan disinkronkan otomatis saat internet kembali aktif.',
          'info'
        );
      }
      return;
    }

    const flushRes = await StorageService.flushOfflineQueue();
    const res = await StorageService.syncAllToSupabase();
    await StorageService.pullAllFromSupabase();
    if (showToast) {
      showToast(
        flushRes.flushedCount > 0 ? flushRes.message : res.message,
        'success'
      );
    }
  };

  const handleManualPull = async () => {
    if (!syncStatus.isOnline) {
      if (showToast) {
        showToast('Perangkat sedang offline. Tidak dapat menarik data dari Cloud.', 'info');
      }
      return;
    }
    const pullRes = await StorageService.pullAllFromSupabase();
    if (showToast) {
      showToast(pullRes.message, pullRes.status === 'connected' ? 'success' : 'info');
    }
  };

  const handleConfirmFreshReset = async () => {
    setIsResettingFresh(true);
    try {
      const res = await StorageService.resetToFreshEmptyData();
      setConfirmResetFresh(false);
      setShowSyncPopover(false);
      if (showToast) {
        showToast(res.message, 'success');
      }
      setTimeout(() => window.location.reload(), 800);
    } finally {
      setIsResettingFresh(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <header className="bg-white sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b-2 border-emerald-500 shrink-0 shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-[#d1fae5] border border-emerald-500 text-slate-900 hover:bg-emerald-200 transition-colors shrink-0"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold font-display text-slate-900 tracking-tight flex items-center gap-2 truncate">
            {title}
          </h1>
          <p className="text-[11px] text-slate-600 hidden sm:block truncate max-w-md font-medium">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 text-right shrink-0 relative">
        {/* Multi-Guru Quick Switcher styled like reference top-bar selector */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#d1fae5] border-2 border-emerald-500 text-xs">
          <span className="font-extrabold text-slate-900 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-[#065f46] shrink-0" />
            Guru:
          </span>
          <select
            value={activeTeacherId}
            onChange={e => handleHeaderTeacherSwitch(e.target.value)}
            className="bg-white border border-emerald-600 rounded-lg px-2.5 py-1 text-slate-900 font-bold text-xs focus:outline-none cursor-pointer"
            title="Ganti Guru Aktif"
          >
            {teachers.map(t => (
              <option key={t.id || t.fullName} value={t.id} className="bg-white text-slate-900">
                {t.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* PWA In-App Install Button */}
        <PWAInstallButton variant="compact" />

        {/* Offline-First IndexedDB <-> Supabase Status Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowSyncPopover(prev => !prev);
              setConfirmResetFresh(false);
            }}
            title={syncStatus.lastMessage}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              !syncStatus.isOnline
                ? 'bg-amber-100 border-amber-500 text-amber-900 hover:bg-amber-200'
                : syncStatus.syncState === 'syncing'
                ? 'bg-emerald-100 border-emerald-600 text-emerald-900'
                : 'bg-[#065f46] border-[#064e3b] text-white hover:bg-[#064e3b]'
            }`}
          >
            {!syncStatus.isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="hidden sm:inline">Offline</span>
              </>
            ) : syncStatus.syncState === 'syncing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin shrink-0" />
                <span className="hidden sm:inline">Sinkronisasi...</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="hidden sm:inline">Cloud &amp; Lokal</span>
                {syncStatus.pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-900 text-[10px] font-extrabold">
                    {syncStatus.pendingCount}
                  </span>
                )}
              </>
            )}
          </button>

          {showSyncPopover && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setShowSyncPopover(false);
                  setConfirmResetFresh(false);
                }}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border-2 border-emerald-500 shadow-2xl p-4 z-50 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#065f46]" />
                    <span className="text-xs font-extrabold text-slate-900">
                      Offline-First Sync Engine
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      syncStatus.isOnline
                        ? 'bg-[#a7f3d0] text-[#064e3b] border border-emerald-500'
                        : 'bg-amber-100 text-amber-800 border border-amber-400'
                    }`}
                  >
                    {syncStatus.isOnline ? '● Online' : '● Offline Mode'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {syncStatus.lastMessage}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-[#ecfdf5] border border-emerald-400">
                    <span className="text-[10px] text-slate-600 block">Cache IndexedDB</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                      {syncStatus.cachedKeysCount} Koleksi Data
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#ecfdf5] border border-emerald-400">
                    <span className="text-[10px] text-slate-600 block">Antrean Outbox</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {syncStatus.pendingCount} Tertunda
                    </span>
                  </div>
                </div>

                {syncStatus.lastSyncedAt && (
                  <div className="text-[10px] text-slate-600 flex items-center justify-between pt-1">
                    <span>Sinkronisasi Terakhir:</span>
                    <span className="text-slate-800 font-mono font-semibold">
                      {new Date(syncStatus.lastSyncedAt).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={syncStatus.syncState === 'syncing' || isResettingFresh}
                    onClick={handleManualSync}
                    className="w-full py-2 rounded-xl bg-[#065f46] hover:bg-[#064e3b] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        syncStatus.syncState === 'syncing' ? 'animate-spin' : ''
                      }`}
                    />
                    {syncStatus.isOnline
                      ? 'Sinkronkan Data Sekarang'
                      : 'Tersimpan di IndexedDB (Menunggu Internet)'}
                  </button>

                  {syncStatus.isOnline && (
                    <button
                      type="button"
                      disabled={syncStatus.syncState === 'syncing' || isResettingFresh}
                      onClick={handleManualPull}
                      className="w-full py-2 rounded-xl bg-[#d1fae5] hover:bg-emerald-200 border border-emerald-500 text-[#064e3b] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Ambil / Tarik Data Terbaru dari Perangkat Lain
                    </button>
                  )}
                </div>

                {/* Reset Data Cloud & IndexedDB (Fresh / Kosong) */}
                <div className="pt-2 border-t border-emerald-200">
                  {!confirmResetFresh ? (
                    <button
                      type="button"
                      onClick={() => setConfirmResetFresh(true)}
                      className="w-full py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-400 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Reset &amp; Kosongkan Data (Cloud &amp; IndexedDB)
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-400 space-y-2.5">
                      <p className="text-[11px] text-rose-900 font-medium leading-relaxed">
                        Yakin ingin mengosongkan seluruh data di <b>Cloud Server</b> &amp; <b>IndexedDB</b> hingga benar-benar fresh/kosong (0 data)?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isResettingFresh}
                          onClick={() => setConfirmResetFresh(false)}
                          className="flex-1 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-[11px] font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={isResettingFresh}
                          onClick={handleConfirmFreshReset}
                          className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow"
                        >
                          {isResettingFresh ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" /> Mereset...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3" /> Ya, Kosongkan
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* School Name & Date */}
        <div className="hidden xl:flex flex-col items-end">
          <span
            className="text-[10px] text-[#065f46] font-extrabold uppercase tracking-wider flex items-center gap-1 max-w-[180px] truncate"
            title={activeTeacher.schoolName}
          >
            <School className="w-3 h-3 shrink-0" /> {activeTeacher.schoolName || 'Satuan Pendidikan'}
          </span>
          <span className="text-[11px] text-slate-600 font-semibold flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3 text-[#065f46] shrink-0" /> {todayStr}
          </span>
        </div>
      </div>
    </header>
  );
};
