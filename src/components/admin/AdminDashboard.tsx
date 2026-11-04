import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Camera,
  CheckCircle2,
  ArrowRight,
  Plus,
  Printer,
  User,
  UserCheck,
  Settings,
  Cloud,
  RefreshCw,
  FileText,
  Building2,
  ChevronRight,
  ShieldCheck
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
    <div className="space-y-5">
      {/* ============================================================================
          HERO BANNER: DASHBOARD E-KINERJA HARIAN (Matching reference image card style)
         ============================================================================ */}
      <div className="bg-white rounded-2xl border-2 border-emerald-600 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#a7f3d0] border-2 border-emerald-700 text-[#064e3b] text-xs font-black uppercase tracking-wide">
                SIM E-KINERJA HARIAN PEGAWAI &bull; {teacherProfile.schoolName || 'SDN CIKETING UDIK 2'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black font-display text-slate-950 tracking-tight">
              Selamat Datang, {teacherProfile.fullName || 'Bapak/Ibu Guru'}
            </h1>

            <p className="text-slate-900 font-semibold text-xs sm:text-sm leading-relaxed">
              Sistem manajemen <b className="font-extrabold text-slate-950">E-Kinerja Harian Guru PAI</b> yang akurat, terukur, dan bermakna. Kelola Rencana Hasil Kerja (RHK), rencana aksi harian, tindak lanjut, jurnal mengajar, hingga penerbitan laporan resmi.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-900 font-bold">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#064e3b]" />
                <span className="text-slate-950 font-extrabold">{teacherProfile.fullName || 'Guru PAI'}</span>
              </span>
              <span>&bull;</span>
              <span>NIP: <span className="font-mono font-extrabold text-[#064e3b]">{teacherProfile.nip || '-'}</span></span>
              <span>&bull;</span>
              <span>Pangkat/Gol: <span className="text-slate-950 font-extrabold">{teacherProfile.pangkatGolongan || 'PNS / PPPK'}</span></span>
            </div>
          </div>

          {/* Right Action Buttons matching the reference image (Dark Green, Golden Amber, Outlined Mint) */}
          <div className="flex flex-col sm:flex-row xl:flex-col items-stretch sm:items-center xl:items-end gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onNavigate('e-kinerja')}
                className="px-4 py-2.5 rounded-xl bg-[#065f46] hover:bg-[#064e3b] text-white font-extrabold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Input Kinerja Baru</span>
              </button>

              <button
                onClick={() => onNavigate('jurnal-mengajar')}
                className="px-4 py-2.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] border-2 border-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <FileText className="w-4 h-4 text-slate-950" />
                <span>Buka Jurnal Guru</span>
              </button>

              <button
                onClick={() => onNavigate('e-kinerja')}
                className="px-4 py-2.5 rounded-xl bg-[#a7f3d0] hover:bg-emerald-300 border-2 border-[#064e3b] text-[#064e3b] font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4 text-[#064e3b]" />
                <span>Cetak Laporan</span>
              </button>
            </div>

            {/* Multi-Teacher Quick Picker */}
            <div className="flex items-center gap-2 bg-[#d1fae5] px-3 py-1.5 rounded-xl border-2 border-emerald-600 text-xs">
              <label htmlFor="dashboard-guru-select" className="font-black text-[#064e3b] flex items-center gap-1 shrink-0">
                <UserCheck className="w-3.5 h-3.5" /> Pilih Guru:
              </label>
              <select
                id="dashboard-guru-select"
                value={activeTeacherId}
                onChange={e => handleSwitchTeacher(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white border border-emerald-700 text-slate-950 text-xs font-extrabold focus:outline-none cursor-pointer"
              >
                {teachers.map(t => (
                  <option key={t.id || t.fullName} value={t.id}>
                    {t.fullName} ({t.schoolName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Database & Cloud Synchronization Ribbon */}
        <div className="pt-3 border-t border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-900 flex-wrap font-bold">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                supaConfig.url ? 'bg-emerald-600' : 'bg-amber-500'
              } shrink-0`}
            />
            <Cloud className="w-4 h-4 text-[#064e3b] shrink-0" />
            <span>
              {supaConfig.url ? (
                <>
                  Penyimpanan Cloud Supabase Terhubung:{' '}
                  <code className="text-[#064e3b] font-mono text-[11px] font-extrabold">{supaConfig.url}</code>
                </>
              ) : (
                <span>
                  Mode Penyimpanan Lokal Offline-First (IndexedDB Aman &amp; Aktif)
                </span>
              )}
            </span>
            {lastSyncTime && supaConfig.url && (
              <span className="text-[11px] text-slate-800 font-bold">
                &bull; Sinkron: {new Date(lastSyncTime).toLocaleTimeString('id-ID')}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncNow}
            className="px-3 py-1.5 rounded-xl bg-[#d1fae5] hover:bg-emerald-200 border-2 border-emerald-600 text-[#064e3b] font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-colors w-fit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================================
          KPI METRIC CARDS: INDIKATOR UTAMA E-KINERJA (Matching reference 4-card grid)
         ============================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Kegiatan */}
        <div className="bg-white rounded-2xl p-5 flex flex-col justify-between border-2 border-emerald-600 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs sm:text-sm font-black text-slate-950">
              Total Kegiatan
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#d1fae5] border-2 border-emerald-600 flex items-center justify-center text-[#064e3b]">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-display text-slate-950 tabular-nums">
                {totalActivities}
              </span>
              <span className="text-xs font-extrabold text-slate-900">
                kegiatan tercatat
              </span>
            </div>
            <p className="text-xs text-slate-800 font-semibold mt-1">
              Total aktivitas harian terinput
            </p>
          </div>
        </div>

        {/* Card 2: Periode Bulan */}
        <div className="bg-white rounded-2xl p-5 flex flex-col justify-between border-2 border-emerald-600 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs sm:text-sm font-black text-slate-950">
              Periode Aktif
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#d1fae5] border-2 border-emerald-600 flex items-center justify-center text-[#064e3b]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-display text-slate-950 truncate">
                {activePeriod ? `${activePeriod.month} ${activePeriod.year}` : 'Belum Ada'}
              </span>
            </div>
            <p className="text-xs text-slate-800 font-semibold mt-1">
              {periods.length} periode bulan terdaftar
            </p>
          </div>
        </div>

        {/* Card 3: Dokumentasi Foto (Amber accent like "Butuh Remedial" in reference image) */}
        <div className="bg-white rounded-2xl p-5 flex flex-col justify-between border-2 border-emerald-600 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs sm:text-sm font-black text-slate-950">
              Dokumentasi Foto
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-100 border-2 border-amber-600 flex items-center justify-center text-amber-900">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-display text-amber-900 tabular-nums">
                {withPhotosCount}
              </span>
              <span className="text-xs font-extrabold text-slate-900">
                kegiatan berfoto
              </span>
            </div>
            <p className="text-xs text-slate-800 font-semibold mt-1">
              Dilengkapi bukti fisik foto kegiatan
            </p>
          </div>
        </div>

        {/* Card 4: Kelengkapan Tindak Lanjut */}
        <div className="bg-white rounded-2xl p-5 flex flex-col justify-between border-2 border-emerald-600 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs sm:text-sm font-black text-slate-950">
              Kelengkapan Evaluasi
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#d1fae5] border-2 border-emerald-600 flex items-center justify-center text-[#064e3b]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-display text-slate-950 tabular-nums">
                {totalActivities > 0 ? Math.round((withTindakLanjutCount / totalActivities) * 100) : 0}%
              </span>
              <span className="text-xs font-extrabold text-slate-900">
                terinput
              </span>
            </div>
            <p className="text-xs text-slate-800 font-semibold mt-1">
              {withTindakLanjutCount} dari {totalActivities} entri tindak lanjut
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================================
          PINTASAN CEPAT MENU E-KINERJA
         ============================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('e-kinerja')}
          className="bg-white rounded-2xl p-5 border-2 border-emerald-600 hover:bg-[#ecfdf5] transition-all text-left group flex items-start gap-3.5 shadow-xs cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-[#d1fae5] border-2 border-emerald-600 text-[#064e3b] flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-950 group-hover:text-[#064e3b] transition-colors">
                Kelola E-Kinerja Harian
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-900 group-hover:text-[#064e3b] group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-slate-800 font-semibold mt-1 leading-relaxed">
              Input RHK harian, rencana aksi, tindak lanjut, dan unggah foto dokumentasi.
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('jurnal-mengajar')}
          className="bg-white rounded-2xl p-5 border-2 border-emerald-600 hover:bg-[#ecfdf5] transition-all text-left group flex items-start gap-3.5 shadow-xs cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-[#d1fae5] border-2 border-emerald-600 text-[#064e3b] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-950 group-hover:text-[#064e3b] transition-colors">
                Jurnal Mengajar Guru
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-900 group-hover:text-[#064e3b] group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-slate-800 font-semibold mt-1 leading-relaxed">
              Buat jurnal pelaksanaan KBM profesional, presensi siswa, refleksi &amp; cetak bukti fisik.
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className="bg-white rounded-2xl p-5 border-2 border-emerald-600 hover:bg-[#ecfdf5] transition-all text-left group flex items-start gap-3.5 shadow-xs cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-[#d1fae5] border-2 border-emerald-600 text-[#064e3b] flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-950 group-hover:text-[#064e3b] transition-colors">
                Profil &amp; Identitas Pegawai
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-900 group-hover:text-[#064e3b] group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-slate-800 font-semibold mt-1 leading-relaxed">
              Atur Nama Lengkap, NIP, Pangkat/Golongan, Kepala Sekolah, dan Tanda Tangan.
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className="bg-white rounded-2xl p-5 border-2 border-emerald-600 hover:bg-[#ecfdf5] transition-all text-left group flex items-start gap-3.5 shadow-xs cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-100 border-2 border-amber-600 text-amber-900 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-950 group-hover:text-amber-900 transition-colors">
                Pengaturan Sistem
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-900 group-hover:text-amber-900 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-slate-800 font-semibold mt-1 leading-relaxed">
              Konfigurasi data satuan pendidikan, logo aplikasi, cadangan &amp; sinkronisasi.
            </p>
          </div>
        </button>
      </div>

      {/* ============================================================================
          MAIN SECTION: AKTIVITAS E-KINERJA TERBARU & REKAP BULANAN
         ============================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Kolom 1 & 2: Daftar Aktivitas Terbaru */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border-2 border-emerald-600 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-300 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#064e3b]" />
                <h3 className="font-black text-base sm:text-lg text-slate-950 font-display">
                  Aktivitas E-Kinerja Harian Terbaru
                </h3>
              </div>
              <p className="text-xs text-slate-800 font-semibold mt-0.5">
                Riwayat catatan kegiatan, rencana aksi, dan tindak lanjut pelaksanaan tugas
              </p>
            </div>

            {/* Filter Periode */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <label className="text-xs text-slate-950 font-black">Periode:</label>
              <select
                value={selectedPeriodId}
                onChange={e => setSelectedPeriodId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#d1fae5] border-2 border-emerald-600 text-slate-950 text-xs font-extrabold focus:outline-none"
              >
                <option value="all">Semua Periode ({activities.length})</option>
                {periods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.month} {p.year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List Kegiatan */}
          {recentActivities.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-[#ecfdf5] border-2 border-dashed border-emerald-600 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#d1fae5] border-2 border-emerald-600 text-[#064e3b] flex items-center justify-center mx-auto">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-black text-slate-950">
                Belum ada aktivitas E-Kinerja pada periode ini
              </p>
              <p className="text-xs text-slate-800 font-semibold max-w-md mx-auto">
                Mulai catat pelaksanaan kinerja harian Anda melalui formulir E-Kinerja yang telah disediakan.
              </p>
              <button
                onClick={() => onNavigate('e-kinerja')}
                className="px-4 py-2 rounded-xl bg-[#065f46] hover:bg-[#064e3b] text-white font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Tambah Kegiatan Hari Ini</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map(act => (
                <div
                  key={act.id}
                  onClick={() => onNavigate('e-kinerja')}
                  className="p-4 rounded-xl bg-[#f0fdf4] hover:bg-[#d1fae5]/70 border-2 border-emerald-500 transition-all cursor-pointer group space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#a7f3d0] border border-emerald-700 text-[#064e3b] text-xs font-black font-mono">
                        {act.date}
                      </span>
                      {act.photos && act.photos.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-600 text-amber-950 text-[10px] font-extrabold">
                          <Camera className="w-3 h-3" /> {act.photos.length} Foto
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#064e3b] font-extrabold flex items-center gap-1">
                      <span>Buka di E-Kinerja</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>

                  {act.rkhText && (
                    <div className="text-xs font-extrabold text-[#064e3b] line-clamp-1">
                      RHK: {act.rkhText}
                    </div>
                  )}

                  <p className="text-xs sm:text-sm font-black text-slate-950 line-clamp-2">
                    {act.rencanaAksiText || 'Tidak ada rincian aksi'}
                  </p>

                  {act.tindakLanjutText && (
                    <p className="text-xs text-slate-900 font-semibold line-clamp-1">
                      <span className="text-slate-950 font-extrabold">Tindak Lanjut: </span>
                      {act.tindakLanjutText}
                    </p>
                  )}
                </div>
              ))}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-900 font-bold">
                  Menampilkan {recentActivities.length} dari {filteredCount} kegiatan
                </span>
                <button
                  onClick={() => onNavigate('e-kinerja')}
                  className="text-xs font-black text-[#064e3b] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Lihat Seluruh Aktivitas &amp; Cetak Laporan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Kolom 3: Rekap Periode & Informasi Pegawai */}
        <div className="space-y-5">
          {/* Rekap Kegiatan Per Periode Bulan */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-emerald-600 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-300 pb-3">
              <h3 className="font-black text-sm sm:text-base text-slate-950 font-display flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#064e3b]" /> Rekapitulasi per Periode
              </h3>
              <span className="text-xs font-extrabold text-slate-900">{periods.length} Bulan</span>
            </div>

            <div className="space-y-2.5">
              {periodDistribution.length === 0 ? (
                <p className="text-xs text-slate-800 font-semibold text-center py-4">
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
                    className="p-3 rounded-xl bg-[#f0fdf4] hover:bg-[#d1fae5] border-2 border-emerald-500 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-950">{item.label}</p>
                      <p className="text-[11px] text-slate-800 font-semibold mt-0.5">
                        {item.count > 0 ? `${item.count} hari kegiatan tercatat` : 'Belum ada kegiatan'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#a7f3d0] border border-emerald-700 text-[#064e3b] text-xs font-black font-mono">
                      {item.count} Keg
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onNavigate('e-kinerja')}
              className="w-full py-2.5 rounded-xl bg-[#065f46] hover:bg-[#064e3b] text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Cetak Laporan E-Kinerja Bulan Ini</span>
            </button>
          </div>

          {/* Informasi Satuan Pendidikan */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-emerald-600 shadow-xs space-y-3 text-xs">
            <h3 className="font-black text-sm text-slate-950 font-display flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#064e3b]" /> Informasi Satuan Pendidikan
            </h3>
            <div className="p-3.5 rounded-xl bg-[#f0fdf4] border-2 border-emerald-500 space-y-2">
              <div>
                <p className="text-[10px] text-slate-800 uppercase font-extrabold">Satuan Pendidikan</p>
                <p className="font-black text-[#064e3b] text-xs">{teacherProfile.schoolName || appSettings.schoolName || 'SDN Ciketing Udik 2'}</p>
                <p className="text-slate-900 font-semibold text-[11px] mt-0.5">{teacherProfile.schoolAddress || appSettings.schoolAddress || 'Jl. Raya Ciketing Udik No. 2, Bantargebang, Kota Bekasi'}</p>
              </div>
              <div className="pt-2 border-t border-emerald-300">
                <p className="text-[10px] text-slate-800 uppercase font-extrabold">Tahun Ajaran Aktif</p>
                <p className="font-black text-slate-950 text-xs">{appSettings.academicYear || '2026/2027'}</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs text-[#064e3b] hover:underline font-black flex items-center gap-1 cursor-pointer transition-colors"
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
