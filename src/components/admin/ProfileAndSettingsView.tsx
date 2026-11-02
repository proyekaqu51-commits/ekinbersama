import React, { useState, useMemo } from 'react';
import {
  User,
  Settings,
  Building2,
  Save,
  RotateCcw,
  School,
  Image as ImageIcon,
  CheckCircle2,
  Cloud,
  RefreshCw,
  Monitor,
  Copy,
  Database,
  Trash2,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileJson,
  Upload,
  ShieldCheck,
  Terminal,
  Sparkles,
  Plus,
  UserCheck,
  Check,
  PenTool
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { StorageService } from '../../services/storageService';
import { SupabaseService } from '../../services/supabaseService';
import { IndexedDbService, OfflineSyncStatus } from '../../services/indexedDbService';
import { TeacherProfile, AppSettings } from '../../types';
import { DEFAULT_PRINCIPAL_SIGNATURE } from '../../data/initialData';

interface ProfileAndSettingsViewProps {
  mode: 'profile' | 'settings';
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onProfileUpdated?: (name: string) => void;
}

type BackupExportScope =
  | 'all'
  | 'nilai'
  | 'absensi'
  | 'jurnal'
  | 'siswa_kelas'
  | 'ekinerja';

export const ProfileAndSettingsView: React.FC<ProfileAndSettingsViewProps> = ({
  mode,
  showToast,
  onProfileUpdated
}) => {
  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => StorageService.getTeachers());
  const [activeTeacherId, setActiveTeacherId] = useState<string>(() => StorageService.getActiveTeacherId());
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => StorageService.getActiveTeacherId());
  const [profile, setProfile] = useState<TeacherProfile>(() => StorageService.getTeacherProfile());
  const [isAddingNewTeacher, setIsAddingNewTeacher] = useState(false);
  const [confirmDeleteTeacherId, setConfirmDeleteTeacherId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(StorageService.getAppSettings());
  const [resetModalMode, setResetModalMode] = useState<'fresh_empty' | 'demo_default' | null>(null);
  const [isResettingData, setIsResettingData] = useState(false);

  // State Fitur Ekspor Cadangan Lokal (JSON / Excel) sebelum Reset Total
  const [exportScope, setExportScope] = useState<BackupExportScope>('all');
  const [lastBackupStatus, setLastBackupStatus] = useState<{
    format: 'JSON' | 'Excel (.xlsx)';
    scopeLabel: string;
    timestamp: string;
  } | null>(null);

  const [supaConfig, setSupaConfig] = useState(() => SupabaseService.getConfig());
  const [isSyncingSupa, setIsSyncingSupa] = useState(false);
  const [isCleaningDemo, setIsCleaningDemo] = useState(false);
  const [idbStatus, setIdbStatus] = useState<OfflineSyncStatus>(() => IndexedDbService.getSyncStatus());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() =>
    SupabaseService.getLastSyncTime()
  );

  const handleCleanDemoDataNow = async () => {
    setIsCleaningDemo(true);
    try {
      const res = await StorageService.cleanDemoDataKeepRealData();
      setProfile(StorageService.getTeacherProfile());
      setSettings(StorageService.getAppSettings());
      setLastSyncTime(SupabaseService.getLastSyncTime());
      showToast(res.message, 'success');
    } finally {
      setIsCleaningDemo(false);
    }
  };

  const handleSyncSupabaseNow = async () => {
    setIsSyncingSupa(true);
    try {
      SupabaseService.saveConfig(supaConfig);
      await StorageService.flushOfflineQueue();
      const res = await StorageService.syncAllToSupabase();
      await StorageService.pullAllFromSupabase();
      setProfile(StorageService.getTeacherProfile());
      setSettings(StorageService.getAppSettings());
      setLastSyncTime(SupabaseService.getLastSyncTime());
      showToast(res.message, 'success');
    } finally {
      setIsSyncingSupa(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveAppSettings(settings);
    showToast('Pengaturan sistem berhasil disimpan!', 'success');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const dataUrl = evt.target?.result as string;
      const updated = { ...settings, appLogoUrl: dataUrl };
      setSettings(updated);
      StorageService.saveAppSettings(updated);
      showToast('Logo berhasil diperbarui!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const resetLogoToDefault = () => {
    const updated = {
      ...settings,
      appLogoUrl: 'https://jhlryjdhotxtndavacpd.supabase.co/storage/v1/object/public/logo/logo.png'
    };
    setSettings(updated);
    StorageService.saveAppSettings(updated);
    showToast('Logo dikembalikan ke default.', 'info');
  };

  const confirmResetDatabase = async () => {
    setIsResettingData(true);
    try {
      if (resetModalMode === 'fresh_empty') {
        const res = await StorageService.resetToFreshEmptyData();
        showToast(res.message, 'success');
      } else {
        const res = await StorageService.resetAllToDefaults();
        showToast(res.message, 'success');
      }
      setResetModalMode(null);
      setTimeout(() => window.location.reload(), 900);
    } catch (err: any) {
      showToast(err?.message || 'Gagal mereset database.', 'error');
    } finally {
      setIsResettingData(false);
    }
  };

  const backupSummary = useMemo(() => {
    const payload = StorageService.buildFullDatabaseBackupPayload();
    return payload.metadata.summaryCounts;
  }, [resetModalMode, lastBackupStatus]);

  const eKinerjaStats = useMemo(() => {
    const activities = StorageService.getEKinerjaActivities();
    const periods = StorageService.getEKinerjaPeriods();
    const masterRhk = StorageService.getMasterRhkList();
    const teacherList = StorageService.getTeachers();
    return {
      activitiesCount: activities.length,
      periodsCount: periods.length,
      masterRhkCount: masterRhk.length,
      teachersCount: teacherList.length
    };
  }, [resetModalMode, lastBackupStatus]);

  React.useEffect(() => {
    const unsub = IndexedDbService.subscribeSyncStatus(status => {
      setIdbStatus(status);
    });
    IndexedDbService.refreshCounts().catch(() => {});
    return unsub;
  }, []);

  React.useEffect(() => {
    const handleTeacherChanged = () => {
      const updatedTeachers = StorageService.getTeachers();
      const newActive = StorageService.getActiveTeacherId();
      setTeachers(updatedTeachers);
      setActiveTeacherId(newActive);
    };
    window.addEventListener('lms-teacher-changed', handleTeacherChanged);
    return () => window.removeEventListener('lms-teacher-changed', handleTeacherChanged);
  }, []);

  React.useEffect(() => {
    if (selectedTeacherId && !isAddingNewTeacher) {
      const match = StorageService.getTeacherProfile(selectedTeacherId);
      setProfile(match);
    }
  }, [selectedTeacherId, isAddingNewTeacher]);

  const getScopeLabel = (scope: BackupExportScope): string => {
    switch (scope) {
      case 'nilai':
        return 'Database Nilai Evaluasi Siswa';
      case 'absensi':
        return 'Database Absensi & Kehadiran Siswa';
      case 'jurnal':
        return 'Database Jurnal Mengajar Harian';
      case 'siswa_kelas':
        return 'Database Siswa & Rombel Kelas';
      case 'ekinerja':
        return 'Database Laporan E-Kinerja Harian';
      default:
        return 'Seluruh Database Lengkap (Nilai, Absensi, Jurnal, Siswa, Soal, E-Kinerja)';
    }
  };

  /**
   * Ekspor Cadangan Lokal ke Format File JSON (.json)
   */
  const handleExportBackupJson = (overrideScope?: BackupExportScope) => {
    const targetScope = overrideScope || exportScope;
    const fullPayload = StorageService.buildFullDatabaseBackupPayload();
    const dateStamp = new Date().toISOString().split('T')[0];

    let exportData: any = fullPayload;
    let fileSuffix = 'Lengkap';

    if (targetScope === 'nilai') {
      fileSuffix = 'Database_Nilai';
      exportData = {
        metadata: { ...fullPayload.metadata, exportScope: 'Database Nilai Siswa' },
        nilaiSiswa: fullPayload.enrichedViews.nilaiSiswa,
        rawStorageCollections: {
          lms_scores: fullPayload.rawStorageCollections.lms_scores,
          lms_quiz_attempts: fullPayload.rawStorageCollections.lms_quiz_attempts,
          lms_quizzes: fullPayload.rawStorageCollections.lms_quizzes
        }
      };
    } else if (targetScope === 'absensi') {
      fileSuffix = 'Database_Absensi';
      exportData = {
        metadata: { ...fullPayload.metadata, exportScope: 'Database Absensi & Kehadiran' },
        absensiKehadiran: fullPayload.enrichedViews.absensiKehadiran,
        rawStorageCollections: {
          lms_attendance: fullPayload.rawStorageCollections.lms_attendance,
          lms_teaching_journals: fullPayload.rawStorageCollections.lms_teaching_journals
        }
      };
    } else if (targetScope === 'jurnal') {
      fileSuffix = 'Database_Jurnal_Mengajar';
      exportData = {
        metadata: { ...fullPayload.metadata, exportScope: 'Database Jurnal Mengajar' },
        jurnalMengajar: fullPayload.enrichedViews.jurnalMengajar,
        rawStorageCollections: {
          lms_teaching_journals: fullPayload.rawStorageCollections.lms_teaching_journals
        }
      };
    } else if (targetScope === 'siswa_kelas') {
      fileSuffix = 'Database_Siswa_dan_Kelas';
      exportData = {
        metadata: { ...fullPayload.metadata, exportScope: 'Database Siswa & Kelas' },
        rawStorageCollections: {
          lms_classes: fullPayload.rawStorageCollections.lms_classes,
          lms_students: fullPayload.rawStorageCollections.lms_students
        }
      };
    } else if (targetScope === 'ekinerja') {
      fileSuffix = 'Database_EKinerja_Harian';
      exportData = {
        metadata: { ...fullPayload.metadata, exportScope: 'Database E-Kinerja Harian' },
        rawStorageCollections: {
          lms_e_kinerja_periods: fullPayload.rawStorageCollections.lms_e_kinerja_periods,
          lms_e_kinerja_activities: fullPayload.rawStorageCollections.lms_e_kinerja_activities
        }
      };
    }

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cadangan_LMS_PAI_${fileSuffix}_${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setLastBackupStatus({
      format: 'JSON',
      scopeLabel: getScopeLabel(targetScope),
      timestamp: nowStr
    });
    showToast(
      `Cadangan lokal (${getScopeLabel(targetScope)}) berhasil diekspor ke file JSON!`,
      'success'
    );
  };

  /**
   * Ekspor Cadangan Lokal ke Format File Excel (.xlsx)
   */
  const handleExportBackupExcel = (overrideScope?: BackupExportScope) => {
    const targetScope = overrideScope || exportScope;
    const fullPayload = StorageService.buildFullDatabaseBackupPayload();
    const dateStamp = new Date().toISOString().split('T')[0];
    const wb = XLSX.utils.book_new();

    const addNilaiSheet = () => {
      const rows = fullPayload.enrichedViews.nilaiSiswa.map(item => ({
        No: item.no,
        Tanggal: item.tanggal,
        NIS: item.nis,
        'Nama Siswa': item.namaSiswa,
        Kelas: item.kelas,
        'Judul Kuis / Evaluasi': item.judulEvaluasi,
        'Skor Mentah': item.skorMentah,
        'Skor Maksimal': item.skorMaksimal,
        'Nilai Akhir (0-100)': item.nilaiAkhir,
        'Status Ketuntasan KKTP': item.statusKKTP
      }));
      const ws =
        rows.length > 0
          ? XLSX.utils.json_to_sheet(rows)
          : XLSX.utils.aoa_to_sheet([
              [
                'No',
                'Tanggal',
                'NIS',
                'Nama Siswa',
                'Kelas',
                'Judul Kuis / Evaluasi',
                'Skor Mentah',
                'Skor Maksimal',
                'Nilai Akhir (0-100)',
                'Status Ketuntasan KKTP'
              ],
              ['-', '-', '-', 'Belum ada data nilai evaluasi', '-', '-', 0, 0, 0, '-']
            ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Database_Nilai');
    };

    const addAbsensiSheet = () => {
      const rows = fullPayload.enrichedViews.absensiKehadiran.map((item, idx) => ({
        No: idx + 1,
        Tanggal: item.tanggal,
        Kelas: item.kelas,
        NIS: item.nis,
        'Nama Siswa / Catatan Presensi': item.namaSiswa,
        'Status Kehadiran': item.statusKehadiran,
        Keterangan: item.keterangan,
        'Sumber Rekaman': item.sumberData
      }));
      const ws =
        rows.length > 0
          ? XLSX.utils.json_to_sheet(rows)
          : XLSX.utils.aoa_to_sheet([
              [
                'No',
                'Tanggal',
                'Kelas',
                'NIS',
                'Nama Siswa',
                'Status Kehadiran',
                'Keterangan',
                'Sumber Rekaman'
              ],
              ['-', '-', '-', '-', 'Belum ada rekaman absensi', '-', '-', '-']
            ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Database_Absensi');
    };

    const addJurnalSheet = () => {
      const rows = fullPayload.enrichedViews.jurnalMengajar.map((j, idx) => ({
        No: idx + 1,
        Tanggal: j.date,
        Kelas: j.className,
        'Topik / Materi Pokok': j.topic,
        'Tujuan Pembelajaran': j.learningObjective,
        'Refleksi & Tindak Lanjut': j.reflection,
        'Siswa Tidak Hadir':
          j.absentStudents && j.absentStudents.length > 0
            ? j.absentStudents.join(', ')
            : 'Nihil (Hadir Semua)',
        Status: j.status,
        'Nama Guru PAI': j.teacherName,
        'Satuan Pendidikan': j.schoolName
      }));
      const ws =
        rows.length > 0
          ? XLSX.utils.json_to_sheet(rows)
          : XLSX.utils.aoa_to_sheet([
              [
                'No',
                'Tanggal',
                'Kelas',
                'Topik / Materi Pokok',
                'Tujuan Pembelajaran',
                'Refleksi & Tindak Lanjut',
                'Siswa Tidak Hadir',
                'Status',
                'Nama Guru PAI',
                'Satuan Pendidikan'
              ],
              ['-', '-', '-', 'Belum ada jurnal mengajar', '-', '-', '-', '-', '-', '-']
            ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Jurnal_Mengajar');
    };

    const addSiswaKelasSheet = () => {
      const students = (fullPayload.rawStorageCollections.lms_students as any[]) || [];
      const classes = (fullPayload.rawStorageCollections.lms_classes as any[]) || [];
      const studentRows = students.map((s: any, idx: number) => ({
        No: idx + 1,
        NIS: s.nis,
        'Nama Lengkap Siswa': s.fullName,
        Kelas: s.className || '-',
        Username: s.username,
        Password: s.password || '-'
      }));
      const wsStudents =
        studentRows.length > 0
          ? XLSX.utils.json_to_sheet(studentRows)
          : XLSX.utils.aoa_to_sheet([
              ['No', 'NIS', 'Nama Lengkap Siswa', 'Kelas', 'Username', 'Password'],
              ['-', '-', 'Belum ada data siswa', '-', '-', '-']
            ]);
      XLSX.utils.book_append_sheet(wb, wsStudents, 'Data_Siswa');

      const classRows = classes.map((c: any, idx: number) => ({
        No: idx + 1,
        'Nama Kelas / Rombel': c.className,
        'Wali Kelas': c.homeroom,
        'Tahun Ajaran': c.academicYear,
        'Jumlah Siswa': c.studentCount || 0
      }));
      const wsClasses =
        classRows.length > 0
          ? XLSX.utils.json_to_sheet(classRows)
          : XLSX.utils.aoa_to_sheet([
              ['No', 'Nama Kelas / Rombel', 'Wali Kelas', 'Tahun Ajaran', 'Jumlah Siswa'],
              ['-', 'Belum ada data kelas', '-', '-', 0]
            ]);
      XLSX.utils.book_append_sheet(wb, wsClasses, 'Data_Kelas');
    };

    const addEKinerjaSheet = () => {
      const periods = (fullPayload.rawStorageCollections.lms_e_kinerja_periods as any[]) || [];
      const activities = (fullPayload.rawStorageCollections.lms_e_kinerja_activities as any[]) || [];
      const rows = activities.map((act: any, idx: number) => {
        const per = periods.find((p: any) => p.id === act.periodId);
        return {
          No: idx + 1,
          Periode: per ? `${per.month} ${per.year}` : '-',
          'Tanggal Kegiatan': act.date,
          'RKH Terkait': act.rkhText || '-',
          'Jenis Kegiatan (Rencana Aksi)': act.rencanaAksiText,
          'Tindak Lanjut':
            act.tindakLanjutList && act.tindakLanjutList.length > 0
              ? act.tindakLanjutList.join(' • ')
              : act.tindakLanjutText || '-',
          Output: act.outputText || '-',
          'Jumlah Foto': (act.photos || []).length,
          'Jumlah Dokumen Lampiran': (act.documents || []).length,
          'Nama Dokumen Lampiran':
            (act.documents || []).map((d: any) => d.fileName).join(', ') || '-'
        };
      });
      const ws =
        rows.length > 0
          ? XLSX.utils.json_to_sheet(rows)
          : XLSX.utils.aoa_to_sheet([
              [
                'No',
                'Periode',
                'Tanggal Kegiatan',
                'RKH Terkait',
                'Jenis Kegiatan (Rencana Aksi)',
                'Tindak Lanjut',
                'Output',
                'Jumlah Foto',
                'Jumlah Dokumen Lampiran'
              ],
              ['-', '-', '-', '-', 'Belum ada kegiatan E-Kinerja', '-', '-', 0, 0]
            ]);
      XLSX.utils.book_append_sheet(wb, ws, 'E_Kinerja_Harian');
    };

    const addBankSoalSheet = () => {
      const questions = (fullPayload.rawStorageCollections.lms_questions as any[]) || [];
      const rows = questions.map((q: any, idx: number) => ({
        No: idx + 1,
        'Tingkat Kelas': q.className || q.classId,
        Semester: q.semester,
        'Jenis Soal': q.questionType,
        'Elemen / Domain': q.domain || '-',
        Pertanyaan: q.question,
        'Kunci Jawaban': Array.isArray(q.correctAnswer)
          ? q.correctAnswer.join(', ')
          : String(q.correctAnswer || ''),
        'Bobot Skor': q.scoreWeight
      }));
      if (rows.length > 0) {
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Bank_Soal_PAI');
      }
    };

    let fileSuffix = 'Lengkap';
    if (targetScope === 'nilai') {
      fileSuffix = 'Database_Nilai';
      addNilaiSheet();
    } else if (targetScope === 'absensi') {
      fileSuffix = 'Database_Absensi';
      addAbsensiSheet();
    } else if (targetScope === 'jurnal') {
      fileSuffix = 'Database_Jurnal_Mengajar';
      addJurnalSheet();
    } else if (targetScope === 'siswa_kelas') {
      fileSuffix = 'Database_Siswa_Kelas';
      addSiswaKelasSheet();
    } else if (targetScope === 'ekinerja') {
      fileSuffix = 'Database_EKinerja';
      addEKinerjaSheet();
    } else {
      addNilaiSheet();
      addAbsensiSheet();
      addJurnalSheet();
      addSiswaKelasSheet();
      addEKinerjaSheet();
      addBankSoalSheet();
    }

    XLSX.writeFile(wb, `Cadangan_Database_LMS_PAI_${fileSuffix}_${dateStamp}.xlsx`);

    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setLastBackupStatus({
      format: 'Excel (.xlsx)',
      scopeLabel: getScopeLabel(targetScope),
      timestamp: nowStr
    });
    showToast(
      `Cadangan lokal (${getScopeLabel(targetScope)}) berhasil diekspor ke file Excel (.xlsx)!`,
      'success'
    );
  };

  /**
   * Pulihkan Database dari File Cadangan JSON (.json)
   */
  const handleRestoreFromJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const parsed = JSON.parse(String(evt.target?.result || '{}'));
        const res = await StorageService.restoreFromBackupPayload(parsed);
        setProfile(StorageService.getTeacherProfile());
        setSettings(StorageService.getAppSettings());
        showToast(res.message, 'success');
        setTimeout(() => window.location.reload(), 900);
      } catch (err: any) {
        showToast(err?.message || 'Gagal membaca file cadangan JSON.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSelectTeacher = (id: string) => {
    setIsAddingNewTeacher(false);
    setSelectedTeacherId(id);
    const match = StorageService.getTeacherProfile(id);
    setProfile(match);
  };

  const handleSetActiveTeacher = (id: string) => {
    StorageService.setActiveTeacherId(id);
    setActiveTeacherId(id);
    setSelectedTeacherId(id);
    setIsAddingNewTeacher(false);
    const updated = StorageService.getTeacherProfile(id);
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated.fullName);
    showToast(`Guru aktif berhasil dialihkan ke: ${updated.fullName}`, 'success');
  };

  const handleStartCreateNewTeacher = () => {
    setIsAddingNewTeacher(true);
    const currentPrincipalName = profile.principalName || settings.principalName || 'Hj. Siti Rohmah, M.Pd.';
    const currentPrincipalNip = profile.principalNip || settings.principalNip || '197405101998022001';
    const currentPrincipalSig = profile.principalSignatureDataUrl || DEFAULT_PRINCIPAL_SIGNATURE;
    const newEmptyTeacher: TeacherProfile = {
      id: `guru-${Date.now().toString(36)}`,
      fullName: '',
      nip: '',
      pangkatGolongan: '',
      jabatan: 'Guru Kelas / Ahli Pertama',
      schoolName: '',
      schoolAddress: '',
      subject: '',
      principalName: currentPrincipalName,
      principalNip: currentPrincipalNip,
      principalSignatureDataUrl: currentPrincipalSig,
      academicYear: '2026/2027'
    };
    setProfile(newEmptyTeacher);
  };

  const handleUploadTeacherTtd = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const dataUrl = evt.target?.result as string;
      setProfile(prev => {
        const next = { ...prev, signatureDataUrl: dataUrl };
        if (!isAddingNewTeacher && next.id && next.fullName.trim()) {
          StorageService.saveTeacherProfile(next);
          setTeachers(StorageService.getTeachers());
        }
        return next;
      });
      showToast('Gambar TTD Guru berhasil diunggah dan disimpan ke profil guru ini.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTeacherTtd = () => {
    setProfile(prev => {
      const next = { ...prev, signatureDataUrl: '' };
      if (!isAddingNewTeacher && next.id && next.fullName.trim()) {
        StorageService.saveTeacherProfile(next);
        setTeachers(StorageService.getTeachers());
      }
      return next;
    });
    showToast('Tanda tangan Guru dihapus.', 'info');
  };

  const handleUploadPrincipalTtd = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const dataUrl = evt.target?.result as string;
      setProfile(prev => {
        const next = { ...prev, principalSignatureDataUrl: dataUrl };
        if (!isAddingNewTeacher && next.id && next.fullName.trim()) {
          StorageService.saveTeacherProfile(next);
          setTeachers(StorageService.getTeachers());
        }
        return next;
      });
      showToast('Gambar TTD Kepala Sekolah berhasil diunggah dan disimpan ke profil guru ini.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePrincipalTtd = () => {
    setProfile(prev => {
      const next = { ...prev, principalSignatureDataUrl: '' };
      if (!isAddingNewTeacher && next.id && next.fullName.trim()) {
        StorageService.saveTeacherProfile(next);
        setTeachers(StorageService.getTeachers());
      }
      return next;
    });
    showToast('Tanda tangan Kepala Sekolah dihapus.', 'info');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.fullName.trim() || !profile.schoolName.trim()) {
      showToast('Nama Lengkap Guru dan Nama Sekolah wajib diisi!', 'error');
      return;
    }
    const saved = StorageService.saveTeacherProfile(profile);
    const updatedTeachers = StorageService.getTeachers();
    setTeachers(updatedTeachers);
    setSelectedTeacherId(saved.id || 'guru-1');
    setIsAddingNewTeacher(false);

    // If it's a new teacher and they're the only one, make them active
    if (updatedTeachers.length === 1 || saved.id === activeTeacherId) {
      StorageService.setActiveTeacherId(saved.id || 'guru-1');
      setActiveTeacherId(saved.id || 'guru-1');
    }

    if (onProfileUpdated) onProfileUpdated(saved.fullName);
    showToast(
      `Data Guru "${saved.fullName}", Kepala Sekolah & TTD berhasil disimpan!`,
      'success'
    );
  };

  const handleDeleteTeacherConfirmed = (id: string) => {
    const target = teachers.find(t => t.id === id);
    const ok = StorageService.deleteTeacher(id);
    if (ok) {
      const updated = StorageService.getTeachers();
      setTeachers(updated);
      const newActive = StorageService.getActiveTeacherId();
      setActiveTeacherId(newActive);
      setSelectedTeacherId(newActive);
      setProfile(StorageService.getTeacherProfile(newActive));
      setConfirmDeleteTeacherId(null);
      setIsAddingNewTeacher(false);
      showToast(`Profil guru "${target?.fullName || id}" berhasil dihapus.`, 'info');
    } else {
      showToast('Tidak dapat menghapus satu-satunya profil guru yang tersisa.', 'error');
    }
  };

  if (mode === 'profile') {
    const isCurrentActive = profile.id === activeTeacherId;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ====================================================================
            PANEL DAFTAR GURU & PEMILIH GURU AKTIF (MULTI-GURU)
           ==================================================================== */}
        <div className="glass rounded-3xl p-5 sm:p-6 border border-emerald-500/30 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white font-display flex items-center gap-2">
                  Daftar Pendidik / Guru ({teachers.length})
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Multi-Guru Aktif
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Pilih guru untuk melihat/mengubah profil, nama kepala sekolah, dan tanda tangan masing-masing guru
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartCreateNewTeacher}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> + Tambah Profil Guru Baru
            </button>
          </div>

          {/* Cards List of Teachers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teachers.map(t => {
              const isActive = t.id === activeTeacherId;
              const isSelected = t.id === selectedTeacherId && !isAddingNewTeacher;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTeacher(t.id || 'guru-1')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-400 shadow-md ring-1 ring-emerald-400'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-xs font-bold border border-white/10 shrink-0">
                      {(t.fullName || 'G').charAt(0).toUpperCase()}
                    </div>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Guru Aktif
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleSetActiveTeacher(t.id || 'guru-1');
                        }}
                        className="px-2 py-0.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold transition-all cursor-pointer"
                        title="Jadikan guru aktif untuk mengisi kinerja"
                      >
                        Pilih Aktif
                      </button>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-white truncate">{t.fullName || 'Belum ada nama'}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                    NIP: {t.nip || '-'}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-medium mt-1 truncate flex items-center gap-1">
                    <School className="w-3 h-3 shrink-0" />
                    {t.schoolName || 'Satuan Pendidikan belum diisi'}
                  </p>
                  <p className="text-[10px] text-amber-300/90 font-medium mt-0.5 truncate">
                    Kepsek: {t.principalName || 'Belum diisi'}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-white/10">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        t.signatureDataUrl
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}
                    >
                      {t.signatureDataUrl ? '✓ TTD Guru' : 'Belum TTD Guru'}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        t.principalSignatureDataUrl
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}
                    >
                      {t.principalSignatureDataUrl ? '✓ TTD Kepsek' : 'Belum TTD Kepsek'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Banner Status Guru Aktif */}
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-300 shrink-0" />
              <span className="text-slate-200">
                Sedang mengedit profil:{' '}
                <b className="text-white">
                  {isAddingNewTeacher ? 'Guru Baru (Belum Disimpan)' : profile.fullName || '-'}
                </b>
                {isCurrentActive && !isAddingNewTeacher && (
                  <span className="ml-2 text-emerald-400 font-bold">(Sedang Aktif Mengisi Kinerja)</span>
                )}
              </span>
            </div>
            {!isCurrentActive && !isAddingNewTeacher && profile.id && (
              <button
                type="button"
                onClick={() => handleSetActiveTeacher(profile.id || '')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto"
              >
                <Check className="w-3.5 h-3.5" /> Jadikan Guru Aktif Saat Ini
              </button>
            )}
          </div>
        </div>

        {/* ====================================================================
            FORM ISIAN PROFIL GURU TERPILIH (LENGKAP DENGAN IDENTITAS KEPALA SEKOLAH & UPLOAD TTD)
           ==================================================================== */}
        <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white font-display">
                {isAddingNewTeacher ? 'Formulir Profil Guru Baru' : `Pengaturan Profil: ${profile.fullName || 'Guru'}`}
              </h3>
              <p className="text-xs text-slate-400">
                Data guru, nama kepala sekolah, dan tanda tangan terhubung langsung ke E-Kinerja, Jurnal Mengajar, Nota Dinas, dan Lembar Cetak
              </p>
            </div>
            {teachers.length > 1 && !isAddingNewTeacher && profile.id && (
              <div>
                {confirmDeleteTeacherId !== profile.id ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteTeacherId(profile.id || null)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Guru Ini
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-rose-300 font-bold">Yakin hapus?</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeacherConfirmed(profile.id || '')}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteTeacherId(null)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* 1. IDENTITAS GURU */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider pb-1 border-b border-white/10">
                <User className="w-4 h-4" /> 1. Identitas Guru / Pegawai yang Dinilai
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Nama Lengkap &amp; Gelar Guru <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                    placeholder="Contoh: Drs. H. Ahmad Syarifuddin, M.Pd.I."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Nomor Induk Pegawai (NIP) Guru <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.nip}
                    onChange={e => setProfile({ ...profile, nip: e.target.value })}
                    placeholder="197908152006041008"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Pangkat / Golongan Ruang
                  </label>
                  <input
                    type="text"
                    value={profile.pangkatGolongan || ''}
                    onChange={e => setProfile({ ...profile, pangkatGolongan: e.target.value })}
                    placeholder="Contoh: Penata Tk. I / III/d"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Jabatan Pegawai
                  </label>
                  <input
                    type="text"
                    value={profile.jabatan || ''}
                    onChange={e => setProfile({ ...profile, jabatan: e.target.value })}
                    placeholder="Contoh: Guru Ahli Pertama / Guru Kelas"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Mata Pelajaran / Bidang
                  </label>
                  <input
                    type="text"
                    value={profile.subject || ''}
                    onChange={e => setProfile({ ...profile, subject: e.target.value })}
                    placeholder="Contoh: PAI & Budi Pekerti / Tematik"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. SATUAN PENDIDIKAN (NAMA SEKOLAH DINAMIS SESUAI GURU) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider pb-1 border-b border-white/10">
                <School className="w-4 h-4" /> 2. Satuan Pendidikan (Nama Sekolah)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Nama Satuan Pendidikan / Sekolah <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.schoolName}
                    onChange={e => setProfile({ ...profile, schoolName: e.target.value })}
                    placeholder="Contoh: SDN Ciketing Udik 2 Bantargebang"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nama sekolah akan otomatis berganti mengikuti guru yang aktif mengisi kinerja
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Alamat Satuan Pendidikan
                  </label>
                  <input
                    type="text"
                    value={profile.schoolAddress || ''}
                    onChange={e => setProfile({ ...profile, schoolAddress: e.target.value })}
                    placeholder="Jl. Raya Ciketing Udik No. 2, Bantargebang, Kota Bekasi"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. IDENTITAS KEPALA SEKOLAH PADA PROFIL MASING-MASING GURU */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider pb-1 border-b border-white/10">
                <UserCheck className="w-4 h-4" /> 3. Identitas Kepala Sekolah (Masing-Masing Guru)
              </div>
              <p className="text-xs text-slate-400">
                Isi nama lengkap beserta gelar dan NIP Kepala Sekolah untuk profil guru ini. Data ini otomatis tampil pada pengesahan Laporan Harian Kinerja Pegawai, Nota Dinas, dan Jurnal Mengajar.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Nama Lengkap &amp; Gelar Kepala Sekolah <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.principalName || ''}
                    onChange={e => setProfile({ ...profile, principalName: e.target.value })}
                    placeholder="Contoh: Hj. Siti Rohmah, M.Pd."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Nomor Induk Pegawai (NIP) Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={profile.principalNip || ''}
                    onChange={e => setProfile({ ...profile, principalNip: e.target.value })}
                    placeholder="Contoh: 197405101998022001"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 4. UNGGAH TANDA TANGAN GURU & KEPALA SEKOLAH */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider pb-1 border-b border-white/10">
                <PenTool className="w-4 h-4" /> 4. Unggah Tanda Tangan Guru &amp; Kepala Sekolah
              </div>
              <p className="text-xs text-slate-400">
                Unggah gambar tanda tangan (PNG transparan / JPG) untuk Guru dan Kepala Sekolah pada profil ini. Otomatis terintegrasi ke Laporan Harian Kinerja Pegawai, Nota Dinas, dan Jurnal Mengajar.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* TTD GURU */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-emerald-400" /> TTD Guru (Pegawai yang Dinilai)
                      </h4>
                      <p className="text-[11px] text-slate-400">Format PNG transparan / JPG</p>
                    </div>
                    <label className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{profile.signatureDataUrl ? 'Ganti TTD Guru' : 'Upload TTD Guru'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          handleUploadTeacherTtd(e.target.files);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {profile.signatureDataUrl ? (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/10 border border-emerald-500/30">
                      <div className="h-16 px-3 py-1 rounded-lg bg-white/90 flex items-center justify-center shrink-0">
                        <img
                          src={profile.signatureDataUrl}
                          alt="TTD Guru"
                          className="max-h-14 max-w-[140px] object-contain"
                        />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> TTD Guru Terpasang
                        </span>
                        <span className="text-[10px] text-slate-300 block truncate">
                          {profile.fullName || 'Guru'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveTeacherTtd}
                        className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 cursor-pointer shrink-0"
                        title="Hapus TTD Guru"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-white/15 text-center text-[11px] text-slate-400">
                      Belum ada gambar tanda tangan guru. Klik <b>Upload TTD Guru</b> di atas.
                    </div>
                  )}
                </div>

                {/* TTD KEPALA SEKOLAH */}
                <div className="p-4 rounded-2xl bg-white/5 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-amber-400" /> TTD Kepala Sekolah
                      </h4>
                      <p className="text-[11px] text-slate-400">Format PNG transparan / JPG</p>
                    </div>
                    <label className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{profile.principalSignatureDataUrl ? 'Ganti TTD Kepsek' : 'Upload TTD Kepsek'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          handleUploadPrincipalTtd(e.target.files);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {profile.principalSignatureDataUrl ? (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/10 border border-amber-500/30">
                      <div className="h-16 px-3 py-1 rounded-lg bg-white/90 flex items-center justify-center shrink-0">
                        <img
                          src={profile.principalSignatureDataUrl}
                          alt="TTD Kepala Sekolah"
                          className="max-h-14 max-w-[140px] object-contain"
                        />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> TTD Kepsek Terpasang
                        </span>
                        <span className="text-[10px] text-slate-300 block truncate">
                          {profile.principalName || 'Kepala Sekolah'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePrincipalTtd}
                        className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 cursor-pointer shrink-0"
                        title="Hapus TTD Kepala Sekolah"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-white/15 text-center text-[11px] text-slate-400">
                      Belum ada gambar tanda tangan Kepala Sekolah. Klik <b>Upload TTD Kepsek</b> di atas.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                {isAddingNewTeacher ? (
                  <span className="text-amber-300 font-semibold">
                    * Menyimpan data akan menambahkan guru baru ke daftar multi-guru.
                  </span>
                ) : (
                  <span>
                    Perubahan langsung terhubung ke dokumen cetak &amp; Nota Dinas guru ini.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isAddingNewTeacher && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewTeacher(false);
                      const current = StorageService.getTeacherProfile(activeTeacherId);
                      setSelectedTeacherId(activeTeacherId);
                      setProfile(current);
                    }}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs cursor-pointer transition-all"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" /> Simpan Data Guru &amp; TTD
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Panel Aksi Cepat Penyimpanan Data */}
      <div className="glass rounded-3xl p-4 sm:p-5 border border-emerald-500/25 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 flex-wrap">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              idbStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            } shrink-0`}
          />
          <Cloud className={`w-4 h-4 ${idbStatus.isOnline ? 'text-cyan-400' : 'text-amber-400'} shrink-0`} />
          <span className="text-slate-300 font-medium">
            Penyimpanan Aktif: Cloud Server &amp; Cache Offline-First (IndexedDB)
          </span>
          {lastSyncTime && (
            <span className="text-[11px] text-slate-400">
              &bull; Sinkron terakhir: {new Date(lastSyncTime).toLocaleTimeString('id-ID')}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCleanDemoDataNow}
            disabled={isCleaningDemo}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {isCleaningDemo ? 'Membersihkan...' : 'Bersihkan Sisa Data Demo'}
          </button>
          <button
            type="button"
            onClick={() => setResetModalMode('fresh_empty')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset / Kosongkan Data
          </button>
          <button
            type="button"
            onClick={handleSyncSupabaseNow}
            disabled={isSyncingSupa}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupa ? 'animate-spin' : ''}`} />
            {isSyncingSupa ? 'Menyinkronkan...' : 'Sinkronkan Data Sekarang'}
          </button>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-display">
              Pengaturan Sistem &amp; Cadangan Data
            </h3>
            <p className="text-xs text-slate-400">
              Cadangan Database (Backup), Impor Backup (Restore), dan Logo Aplikasi
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Card Dukungan WFA (Work From Anywhere) & PWA Mobile App */}
          <PWAInstallButton variant="card" />

          {/* Section 1: Backup & Impor Backup Data E-Kinerja */}
          <div className="space-y-4 pb-6 border-b border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 1. Backup &amp; Impor Cadangan Data E-Kinerja
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                Penyimpanan Lokal Aman (.json / .xlsx)
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Buat salinan cadangan (backup) seluruh data E-Kinerja meliputi Laporan Kegiatan Harian, Dokumentasi &amp; Bukti Fisik, Bank Master RHK, Periode Bulanan, dan Profil Guru ke dalam file JSON atau Excel, atau pulihkan (impor) data kembali melalui berkas cadangan JSON.
            </p>

            {/* Ringkasan Jumlah Data E-Kinerja Saat Ini */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Kegiatan E-Kinerja</div>
                <div className="text-sm font-extrabold text-teal-400">{eKinerjaStats.activitiesCount} Kegiatan</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Periode Kinerja</div>
                <div className="text-sm font-extrabold text-cyan-400">{eKinerjaStats.periodsCount} Bulan</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Master RHK</div>
                <div className="text-sm font-extrabold text-purple-400">{eKinerjaStats.masterRhkCount} Butir RHK</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Guru Pengisi</div>
                <div className="text-sm font-extrabold text-amber-400">{eKinerjaStats.teachersCount} Guru</div>
              </div>
            </div>

            {/* Tombol Backup dan Impor Backup */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Tombol Backup JSON */}
              <button
                type="button"
                onClick={() => handleExportBackupJson('all')}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Backup E-Kinerja (JSON)</span>
              </button>

              {/* Tombol Backup Excel */}
              <button
                type="button"
                onClick={() => handleExportBackupExcel('all')}
                className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                title="Cadangkan dalam format lembar kerja Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Backup E-Kinerja (Excel .xlsx)</span>
              </button>

              {/* Tombol Impor Backup JSON */}
              <label className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer transition-all active:scale-95">
                <Upload className="w-4 h-4" />
                <span>Impor Backup E-Kinerja</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreFromJsonFile}
                  className="hidden"
                />
              </label>
            </div>

            {lastBackupStatus && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Cadangan terakhir berhasil diunduh: <b>{lastBackupStatus.format}</b> ({lastBackupStatus.scopeLabel}) pada pukul {lastBackupStatus.timestamp} WIB
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Logo Sekolah */}
          <div className="space-y-3.5 pb-5 border-b border-white/10">
            <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-400">
              2. Logo Aplikasi & Dokumen Cetak
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <img
                src={settings.appLogoUrl || 'https://jhlryjdhotxtndavacpd.supabase.co/storage/v1/object/public/logo/logo.png'}
                alt="Logo Preview"
                className="w-16 h-16 object-contain rounded-xl bg-black/30 p-1 border border-white/10"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex-1 space-y-2 w-full">
                <label className="text-xs font-bold text-slate-300 uppercase block">
                  Pilih Berkas Gambar Logo Baru:
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={resetLogoToDefault}
                    className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold shrink-0 cursor-pointer transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" /> Simpan Pengaturan Sistem
            </button>
          </div>
        </form>

        {/* Section 3: Reset / Bersihkan Riwayat Kegiatan E-Kinerja */}
        <div className="pt-6 border-t border-white/10 space-y-3 text-xs">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-bold text-rose-300 text-sm flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-400" /> Kosongkan Riwayat Kegiatan E-Kinerja
              </p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Menghapus seluruh rekaman kegiatan harian, foto dokumentasi, dan berkas bukti fisik E-Kinerja jika Anda ingin memulai periode baru secara fresh. Pastikan Anda telah mengunduh <b>Backup E-Kinerja</b> di atas terlebih dahulu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setResetModalMode('fresh_empty')}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-rose-600/25 shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Kosongkan E-Kinerja
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-strong border border-rose-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30 shadow-lg shadow-rose-500/10">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white text-center font-display">
              Kosongkan Seluruh Riwayat Kegiatan E-Kinerja?
            </h3>
            <p className="text-xs text-slate-300 text-center leading-relaxed">
              Tindakan ini akan menghapus seluruh data kegiatan harian E-Kinerja, dokumentasi foto, dan dokumen bukti fisik sehingga tabel kembali bersih (0 kegiatan). Pastikan Anda telah mengunduh salinan <b>Backup E-Kinerja</b> terlebih dahulu.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isResettingData}
                onClick={() => setResetModalMode(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isResettingData}
                onClick={confirmResetDatabase}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isResettingData ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Ya, Kosongkan E-Kinerja
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
