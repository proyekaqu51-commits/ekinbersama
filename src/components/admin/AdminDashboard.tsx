import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Printer,
  User,
  UserCheck,
  Settings,
  Sparkles,
  Cloud,
  RefreshCw,
  FileText,
  Building2,
  Layers,
  Award,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { SupabaseService } from '../../services/supabaseService';
import {
  EKinerjaPeriod,
  EKinerjaDailyActivity,
  TeacherProfile,
  AppSettings
} from '../../types';

interface AdminDashboardProps {
  onNavigate: (viewId: string) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, showToast }) => {
  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => StorageService.getTeachers());
  const [activeTeacherId, setActiveTeacherId] = useState<string>(() => StorageService.getActiveTeacherId());
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(() => StorageService.getTeacherProfile());

  const [periods, setPeriods] = useState<EKinerjaPeriod[]>(() =>
    StorageService.getEKinerjaPeriods(StorageService.getActiveTeacherId())
  );
  const [activities, setActivities] = useState<EKinerjaDailyActivity[]>(() =>
    StorageService.getEKinerjaActivities(undefined, StorageService.getActiveTeacherId())
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const appSettings: AppSettings = StorageService.getAppSettings();
  const supaConfig = SupabaseService.getConfig();
  const lastSyncTime = SupabaseService.getLastSyncTime();

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (showToast) showToast(msg, type);
  };

  const handleSwitchTeacher = (id: string) => {
    StorageService.setActiveTeacherId(id);
    setActiveTeacherId(id);
    const newProf = StorageService.getTeacherProfile(id);
    setTeacherProfile(newProf);
    setPeriods(StorageService.getEKinerjaPeriods(id));
    setActivities(StorageService.getEKinerjaActivities(undefined, id));
    notify(`Beralih ke guru: ${newProf.fullName} (${newProf.schoolName})`, 'success');
  };

  useEffect(() => {
    const handleTeacherChanged = () => {
      const curId = StorageService.getActiveTeacherId();
      setActiveTeacherId(curId);
      setTeachers(StorageService.getTeachers());
      setTeacherProfile(StorageService.getTeacherProfile(curId));
      setPeriods(StorageService.getEKinerjaPeriods(curId));
      setActivities(StorageService.getEKinerjaActivities(undefined, curId));
    };
    window.addEventListener('lms-teacher-changed', handleTeacherChanged);
    return () => window.removeEventListener('lms-teacher-changed', handleTeacherChanged);
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await StorageService.flushOfflineQueue();
      const res = await StorageService.syncAllToSupabase();
      await StorageService.pullAllFromSupabase();
      setPeriods(StorageService.getEKinerjaPeriods(activeTeacherId));
      setActivities(StorageService.getEKinerjaActivities(undefined, activeTeacherId));
      notify(res.message, 'success');
    } catch {
      notify('Data E-Kinerja diamankan di penyimpanan lokal (IndexedDB)', 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter activities based on selected period
  const filteredActivities = useMemo(() => {
    if (selectedPeriodId === 'all') {
      return activities;
    }
    return activities.filter(a => a.periodId === selectedPeriodId);
  }, [activities, selectedPeriodId]);

  // Statistics calculation
  const totalActivities = activities.length;
  const filteredCount = filteredActivities.length;
  const withPhotosCount = activities.filter(a => a.photos && a.photos.length > 0).length;
  const withTindakLanjutCount = activities.filter(
    a => (a.tindakLanjutText && a.tindakLanjutText.trim().length > 0) || (a.tindakLanjutList && a.tindakLanjutList.length > 0)
  ).length;

  // Active period name
  const activePeriod = useMemo(() => {
    if (selectedPeriodId === 'all') {
      return periods[0] || null;
    }
    return periods.find(p => p.id === selectedPeriodId) || periods[0] || null;
  }, [periods, selectedPeriodId]);

  // Recent 8 activities
  const recentActivities = useMemo(() => {
    return [...filteredActivities]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }, [filteredActivities]);

  // Period activity distribution
  const periodDistribution = useMemo(() => {
    return periods.map(p => {
      const count = activities.filter(a => a.periodId === p.id).length;
      return {
        id: p.id,
        label: `${p.month} ${p.year}`,
        count
      };
    });
  }, [periods, activities]);

  return (
    <div className="space-y-6">
      {/* ============================================================================
          HERO BANNER: DASHBOARD E-KINERJA HARIAN
         ============================================================================ */}
      <div className="relative overflow-hidden rounded-3xl glass-strong border border-emerald-500/25 p-5 sm:p-7 shadow-xl space-y-4">
        {/* Glow ambient decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <ClipboardCheck className="w-3.5 h-3.5" /> Dashboard E-Kinerja Harian Pegawai
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold">
                <Building2 className="w-3 h-3" /> {teacherProfile.schoolName || 'Satuan Pendidikan'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                ⚖️ PermenPAN-RB No. 6 Th 2022
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[11px] font-bold">
                <Globe className="w-3 h-3 text-teal-400" /> Support WFA &amp; PWA
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-display text-white tracking-tight">
                  Assalamu'alaikum, {teacherProfile.fullName || 'Bapak/Ibu Guru'}
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed mt-1">
                  Sistem manajemen <b>E-Kinerja Multi-Guru</b>. Pilih guru aktif untuk melihat dan mengisi RKH, rencana aksi, bukti fisik, serta Nota Dinas masing-masing.
                </p>
              </div>

              {/* Multi-Teacher Quick Picker in Dashboard */}
              <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-emerald-500/30 shrink-0">
                <label htmlFor="dashboard-guru-select" className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Guru Aktif Saat Ini:
                </label>
                <select
                  id="dashboard-guru-select"
                  value={activeTeacherId}
                  onChange={e => handleSwitchTeacher(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-emerald-500/40 text-white text-xs font-bold focus:ring-2 focus:ring-emerald-400 focus:outline-none cursor-pointer"
                >
                  {teachers.map(t => (
                    <option key={t.id || t.fullName} value={t.id}>
                      {t.fullName} ({t.schoolName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-200 font-semibold">{teacherProfile.fullName || 'Guru PAI'}</span>
              </span>
              <span>&bull;</span>
              <span>NIP: <span className="font-mono text-cyan-300">{teacherProfile.nip || '-'}</span></span>
              <span>&bull;</span>
              <span>Pangkat/Gol: <span className="text-slate-200">{teacherProfile.pangkatGolongan || 'PNS / PPPK'}</span></span>
            </div>
          </div>

          {/* Quick Actions in Banner */}
          <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0 relative z-10">
            <button
              onClick={() => onNavigate('e-kinerja')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 text-emerald-100" />
              <span>Input Kegiatan Baru</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('profile')}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Profil Guru</span>
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pengaturan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Database & Cloud Synchronization Ribbon */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 flex-wrap">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                supaConfig.url ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              } shrink-0`}
            />
            <Cloud className={`w-4 h-4 ${supaConfig.url ? 'text-cyan-400' : 'text-amber-400'} shrink-0`} />
            <span>
              {supaConfig.url ? (
                <>
                  Penyimpanan Cloud Supabase Terhubung:{' '}
                  <code className="text-cyan-300 font-mono text-[11px]">{supaConfig.url}</code>
                </>
              ) : (
                <span className="text-slate-300">
                  Mode Penyimpanan Lokal Offline-First (IndexedDB Aman &amp; Aktif)
                </span>
              )}
            </span>
            {lastSyncTime && supaConfig.url && (
              <span className="text-[11px] text-slate-400">
                &bull; Sinkron: {new Date(lastSyncTime).toLocaleTimeString('id-ID')}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncNow}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 hover:text-cyan-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors w-fit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================================
          KPI METRIC CARDS: INDIKATOR UTAMA E-KINERJA
         ============================================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Aktivitas E-Kinerja */}
        <div className="glass rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Kegiatan
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display text-white tabular-nums">
              {totalActivities}
            </p>
            <p className="text-[11px] text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Aktivitas Harian Terinput</span>
            </p>
          </div>
        </div>

        {/* Periode Aktif */}
        <div className="glass rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-cyan-500/20 hover:border-cyan-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Periode Bulan
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold font-display text-white truncate">
              {activePeriod ? `${activePeriod.month} ${activePeriod.year}` : 'Belum Ada'}
            </p>
            <p className="text-[11px] text-cyan-300 mt-0.5">
              {periods.length} Periode Bulan Terdaftar
            </p>
          </div>
        </div>

        {/* Kelengkapan Bukti Foto */}
        <div className="glass rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Dokumentasi Foto
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display text-white tabular-nums">
              {withPhotosCount}
            </p>
            <p className="text-[11px] text-amber-300 mt-0.5">
              Kegiatan Dilengkapi Bukti Fisik
            </p>
          </div>
        </div>

        {/* Status Tindak Lanjut */}
        <div className="glass rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-indigo-500/20 hover:border-indigo-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tindak Lanjut
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display text-white tabular-nums">
              {withTindakLanjutCount}
            </p>
            <p className="text-[11px] text-indigo-300 mt-0.5">
              Aktivitas Ber-Evaluasi Lengkap
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================================
          PINTASAN CEPAT MENU E-KINERJA
         ============================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('e-kinerja')}
          className="glass rounded-2xl p-5 border border-emerald-500/30 hover:border-emerald-400/60 transition-all text-left group flex items-start gap-4 shadow-lg hover:bg-emerald-500/5 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                Kelola E-Kinerja Harian
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Input RKH harian, uraian kegiatan, rencana aksi, tindak lanjut, dan unggah foto dokumentasi kegiatan.
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className="glass rounded-2xl p-5 border border-cyan-500/30 hover:border-cyan-400/60 transition-all text-left group flex items-start gap-4 shadow-lg hover:bg-cyan-500/5 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                Profil &amp; Identitas Pegawai
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Atur Nama Lengkap, NIP, Golongan/Pangkat, Tanda Tangan Digital, dan data satuan pendidikan.
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className="glass rounded-2xl p-5 border border-amber-500/30 hover:border-amber-400/60 transition-all text-left group flex items-start gap-4 shadow-lg hover:bg-amber-500/5 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Settings className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                Pengaturan Sistem &amp; Profil
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Konfigurasi data satuan pendidikan, logo aplikasi, dan pengaturan sistem.
            </p>
          </div>
        </button>
      </div>

      {/* ============================================================================
          MAIN SECTION: AKTIVITAS E-KINERJA TERBARU & REKAP BULANAN
         ============================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1 & 2: Daftar Aktivitas Terbaru */}
        <div className="lg:col-span-2 glass rounded-3xl p-5 sm:p-6 border border-emerald-500/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base sm:text-lg text-white font-display">
                  Aktivitas E-Kinerja Harian Terbaru
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Riwayat catatan kegiatan, rencana aksi, dan tindak lanjut pelaksanaan tugas
              </p>
            </div>

            {/* Filter Periode */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <label className="text-xs text-slate-400 font-medium">Periode:</label>
              <select
                value={selectedPeriodId}
                onChange={e => setSelectedPeriodId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-emerald-300 text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="all" className="bg-slate-900 text-white">Semua Periode ({activities.length})</option>
                {periods.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.month} {p.year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List Kegiatan */}
          {recentActivities.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-white/5 border border-dashed border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-300">
                Belum ada aktivitas E-Kinerja pada periode ini
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Mulai catat pelaksanaan kinerja harian Anda melalui formulir E-Kinerja yang telah disediakan.
              </p>
              <button
                onClick={() => onNavigate('e-kinerja')}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kegiatan Hari Ini</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map(act => (
                <div
                  key={act.id}
                  onClick={() => onNavigate('e-kinerja')}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer group space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                        {act.date}
                      </span>
                      {act.photos && act.photos.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                          <Camera className="w-3 h-3" /> {act.photos.length} Foto
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
                      <span>Buka di E-Kinerja</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>

                  {act.rkhText && (
                    <div className="text-xs font-semibold text-cyan-300 line-clamp-1">
                      RKH: {act.rkhText}
                    </div>
                  )}

                  <p className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-200 transition-colors line-clamp-2">
                    {act.rencanaAksiText || 'Tidak ada rincian aksi'}
                  </p>

                  {act.tindakLanjutText && (
                    <p className="text-xs text-slate-300 line-clamp-1">
                      <span className="text-slate-400 font-medium">Tindak Lanjut: </span>
                      {act.tindakLanjutText}
                    </p>
                  )}
                </div>
              ))}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Menampilkan {recentActivities.length} dari {filteredCount} kegiatan
                </span>
                <button
                  onClick={() => onNavigate('e-kinerja')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Lihat Seluruh Aktivitas &amp; Cetak Laporan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Kolom 3: Rekap Periode & Informasi Pegawai */}
        <div className="space-y-6">
          {/* Rekap Kegiatan Per Periode Bulan */}
          <div className="glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm sm:text-base text-white font-display flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" /> Rekapitulasi per Periode
              </h3>
              <span className="text-xs text-slate-400">{periods.length} Bulan</span>
            </div>

            <div className="space-y-3">
              {periodDistribution.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  Belum ada periode yang dibuat
                </p>
              ) : (
                periodDistribution.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedPeriodId(item.id);
                      onNavigate('e-kinerja');
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{item.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.count > 0 ? `${item.count} hari kegiatan tercatat` : 'Belum ada kegiatan'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                      {item.count} RKH
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onNavigate('e-kinerja')}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak Laporan E-Kinerja Bulan Ini</span>
            </button>
          </div>

          {/* Informasi Satuan Pendidikan */}
          <div className="glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-3 text-xs">
            <h3 className="font-bold text-sm text-white font-display flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" /> Informasi Satuan Pendidikan
            </h3>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Satuan Pendidikan</p>
                <p className="font-bold text-emerald-300 text-xs">{appSettings.schoolName || 'SDN Ciketing Udik 2 Bantargebang'}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{appSettings.schoolAddress || 'Jl. Raya Ciketing Udik No. 2, Bantargebang, Kota Bekasi'}</p>
              </div>
              <div className="pt-2 border-t border-white/10">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Tahun Ajaran Aktif</p>
                <p className="font-bold text-white text-xs">{appSettings.academicYear || '2026/2027'}</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Ubah data di Pengaturan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
