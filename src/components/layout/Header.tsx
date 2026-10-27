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
  UserCheck,
  Globe
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
  session,
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
    <header className="glass sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-white/10 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold font-display text-white tracking-tight flex items-center gap-2 truncate">
            {title}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-md">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 text-right shrink-0 relative">
        {/* WFA Mode Indicator Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-bold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <Globe className="w-3.5 h-3.5 text-teal-400" />
          <span>WFA Mode</span>
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
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              !syncStatus.isOnline
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                : syncStatus.syncState === 'syncing'
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : syncStatus.pendingCount > 0
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/25'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            {!syncStatus.isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Offline (IndexedDB)</span>
                {syncStatus.pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/30 text-amber-200 text-[10px]">
                    {syncStatus.pendingCount}
                  </span>
                )}
              </>
            ) : syncStatus.syncState === 'syncing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                <span className="hidden sm:inline">Sinkronisasi...</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Cloud &amp; IndexedDB</span>
                {syncStatus.pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/30 text-indigo-200 text-[10px]">
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
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl p-4 z-50 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">
                      Offline-First Sync Engine
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      syncStatus.isOnline
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {syncStatus.isOnline ? '● Online' : '● Offline Mode'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {syncStatus.lastMessage}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Cache IndexedDB</span>
                    <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {syncStatus.cachedKeysCount} Koleksi Data
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Antrean Outbox</span>
                    <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {syncStatus.pendingCount} Tertunda
                    </span>
                  </div>
                </div>

                {syncStatus.lastSyncedAt && (
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Sinkronisasi Terakhir:</span>
                    <span className="text-slate-300 font-mono">
                      {new Date(syncStatus.lastSyncedAt).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={syncStatus.syncState === 'syncing' || isResettingFresh}
                    onClick={handleManualSync}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
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
                      className="w-full py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Ambil / Tarik Data Terbaru dari Perangkat Lain
                    </button>
                  )}
                </div>

                {/* Reset Data Cloud & IndexedDB (Fresh / Kosong) */}
                <div className="pt-2 border-t border-white/10">
                  {!confirmResetFresh ? (
                    <button
                      type="button"
                      onClick={() => setConfirmResetFresh(true)}
                      className="w-full py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Reset &amp; Kosongkan Data (Cloud &amp; IndexedDB)
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 space-y-2.5">
                      <p className="text-[11px] text-rose-200 font-medium leading-relaxed">
                        Yakin ingin mengosongkan seluruh data di <b>Cloud Server</b> &amp; <b>IndexedDB</b> hingga benar-benar fresh/kosong (0 data)?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isResettingFresh}
                          onClick={() => setConfirmResetFresh(false)}
                          className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] font-bold cursor-pointer"
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

        {/* Multi-Guru Quick Switcher & School Name */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-white/10 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={activeTeacherId}
              onChange={e => handleHeaderTeacherSwitch(e.target.value)}
              className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer pr-1"
              title="Ganti Guru Aktif"
            >
              {teachers.map(t => (
                <option key={t.id || t.fullName} value={t.id} className="bg-slate-900 text-white">
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-end">
            <span
              className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 max-w-[200px] truncate"
              title={activeTeacher.schoolName}
            >
              <School className="w-3 h-3 shrink-0" /> {activeTeacher.schoolName || 'Satuan Pendidikan'}
            </span>
            <span className="text-xs text-slate-300 font-medium flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" /> {todayStr}
            </span>
          </div>
        </div>

        <div className="md:hidden text-right">
          <span className="text-[10px] text-emerald-400 font-bold block truncate max-w-[120px]" title={activeTeacher.fullName}>
            {activeTeacher.fullName}
          </span>
          <span className="text-[9px] text-slate-400 block truncate max-w-[120px]">
            {activeTeacher.schoolName}
          </span>
        </div>
      </div>
    </header>
  );
};
