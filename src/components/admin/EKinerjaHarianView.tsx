import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ClipboardCheck,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Camera,
  Image as ImageIcon,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  X,
  UserCheck,
  Building2,
  Layers,
  ListChecks,
  ArrowRightCircle,
  Sparkles,
  ExternalLink,
  Save,
  Eye,
  FolderPlus,
  FileText,
  Paperclip,
  Download,
  Upload,
  Link2,
  BookOpen,
  Zap,
  BookMarked,
  Copy,
  Check,
  Search,
  Filter,
  RotateCcw,
  Globe,
  MapPin,
  Building,
  Home,
  Navigation
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  EKinerjaPeriod,
  EKinerjaDailyActivity,
  EKinerjaWorkMode,
  EKinerjaBuktiFisikType,
  EKinerjaRKHItem,
  EKinerjaRencanaAksiItem,
  EKinerjaTindakLanjutItem,
  EKinerjaPhotoItem,
  EKinerjaDocumentItem,
  EKinerjaNotaDinasAspect,
  EKinerjaNotaDinasConfig,
  TeacherProfile,
  AppSettings,
  EKinerjaMasterItem,
  EKinerjaMasterRencanaAksi
} from '../../types';
import { StorageService } from '../../services/storageService';
import {
  DEFAULT_PRINCIPAL_SIGNATURE,
  DEFAULT_TEACHER_SIGNATURE
} from '../../data/initialData';

interface EKinerjaHarianViewProps {
  initialTab?: 'harian' | 'master_rhk' | 'nota_dinas';
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onProfileUpdated?: (name: string) => void;
}

const MONTHS_LIST = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const YEARS_LIST = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

const BUKTI_FISIK_OPTIONS: EKinerjaBuktiFisikType[] = [
  'Foto Kegiatan',
  'Dokumen',
  'Foto Kegiatan dan Dokumen'
];

interface DraftActivityEntry {
  tempId: string;
  workMode?: EKinerjaWorkMode;
  locationName?: string;
  locationCoords?: { latitude: number; longitude: number; accuracy?: number };
  rkhId: string;
  rencanaAksiId: string;
  customRencanaAksi: string;
  selectedTindakLanjut: string[];
  customTindakLanjut: string;
  outputText: string;
  buktiFisikType: EKinerjaBuktiFisikType;
  aiSuggestions?: string[];
  isGeneratingOutput?: boolean;
  aiRaSuggestions?: string[];
  isGeneratingRa?: boolean;
  aiTlSuggestions?: string[];
  isGeneratingTl?: boolean;
  photos: EKinerjaPhotoItem[];
  documents: EKinerjaDocumentItem[];
}

interface CompressedImageResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  savedPercent: number;
}

/**
 * Smart Local Fallback AI Engine untuk menyusun Output Kegiatan Harian E-Kinerja
 * berdasarkan konteks RKH, Jenis Kegiatan (Rencana Aksi), dan Tindak Lanjut.
 */
function buildSmartLocalOutput(params: {
  rkhText: string;
  rencanaAksiText: string;
  tindakLanjutText: string;
}): { primaryOutput: string; alternatives: string[] } {
  const combined = `${params.rencanaAksiText} ${params.tindakLanjutText} ${params.rkhText}`.toLowerCase();

  if (
    combined.includes('modul ajar') ||
    combined.includes('perangkat') ||
    combined.includes('lkpd') ||
    combined.includes('rpp') ||
    combined.includes('prota') ||
    combined.includes('promes') ||
    combined.includes('atp')
  ) {
    return {
      primaryOutput:
        '1 Dokumen Perangkat Ajar (Modul Ajar, ATP, & LKPD PAI Kurikulum Merdeka Berbasis Cinta) yang telah divalidasi dan disahkan Kepala Sekolah',
      alternatives: [
        'Tersusunnya Dokumen Modul Ajar & Bahan Tayang Pembelajaran PAI yang siap digunakan di kelas',
        '1 Bundel Instrumen LKPD & Modul Ajar PAI sesuai Keputusan Kepala BKPDM Nomor 020 Tahun 2026',
        'Berita Acara Koordinasi & Pengesahan Perangkat Pembelajaran PAI Semester Berjalan'
      ]
    };
  }

  if (
    combined.includes('dhuha') ||
    combined.includes('tadarus') ||
    combined.includes('juz amma') ||
    combined.includes('pembiasaan') ||
    combined.includes('ibadah') ||
    combined.includes('sholat') ||
    combined.includes('shalat') ||
    combined.includes('akhlak')
  ) {
    return {
      primaryOutput:
        'Terlaksananya Bimbingan Pembiasaan Ibadah (Shalat Dhuha & Tadarus Juz Amma) beserta Jurnal Pembinaan Akhlak Mulia dan Dokumentasi Kegiatan',
      alternatives: [
        '1 Laporan Jurnal Pembiasaan Ibadah Harian Siswa & Rekap Capaian Hafalan Surah Pendek Juz Amma',
        'Dokumentasi Kegiatan Pembiasaan Pagi & Catatan Perkembangan Karakter Kurikulum Berbasis Cinta (KBC)',
        'Daftar Hadir & Lembar Monitoring Pembiasaan Shalat Berjamaah dan Tadarus Al-Qur\'an Peserta Didik'
      ]
    };
  }

  if (
    combined.includes('penilaian') ||
    combined.includes('evaluasi') ||
    combined.includes('kuis') ||
    combined.includes('asesmen') ||
    combined.includes('remedial') ||
    combined.includes('kktp') ||
    combined.includes('ulangan') ||
    combined.includes('nilai')
  ) {
    return {
      primaryOutput:
        '1 Dokumen Daftar Nilai Asesmen Formatif/Sumatif Siswa, Analisis Ketuntasan KKTP, serta Laporan Pelaksanaan Bimbingan Remedial PAI',
      alternatives: [
        'Rekapitulasi Hasil Evaluasi Belajar Peserta Didik & Lembar Kerja Tindak Lanjut Remedial KKTP',
        '1 Paket Instrumen Soal Evaluasi PAI, Kunci Jawaban, dan Daftar Nilai Hasil Belajar Siswa',
        'Laporan Analisis Capaian Pembelajaran Siswa & Dokumentasi Pendampingan Remedial Terbimbing'
      ]
    };
  }

  if (
    combined.includes('tatap muka') ||
    combined.includes('mengajar') ||
    combined.includes('jurnal') ||
    combined.includes('presensi') ||
    combined.includes('pembelajaran') ||
    combined.includes('kelas')
  ) {
    return {
      primaryOutput:
        'Terlaksananya Kegiatan Pembelajaran Tatap Muka PAI di Kelas disertai 1 Dokumen Jurnal Mengajar Harian, Rekap Presensi Siswa, dan Dokumentasi Pembelajaran',
      alternatives: [
        '1 Dokumen Jurnal Mengajar Harian Guru PAI, Daftar Hadir Peserta Didik, dan Catatan Refleksi Kelas',
        'Laporan Pelaksanaan Pembelajaran PAI & Budi Pekerti serta Dokumentasi Keaktifan Peserta Didik',
        'Rekap Presensi Kehadiran Siswa & Catatan Perkembangan Belajar Harian pada Jurnal Guru PAI'
      ]
    };
  }

  const cleanAction = params.rencanaAksiText.trim() || 'Kegiatan Harian Guru PAI';
  const cleanTl = params.tindakLanjutText.trim();

  return {
    primaryOutput: cleanTl
      ? `Terlaksananya ${cleanAction} dengan bukti fisik berupa Laporan ${cleanTl} serta Dokumentasi Kegiatan Harian`
      : `1 Dokumen Laporan Pelaksanaan "${cleanAction}" beserta Bukti Fisik & Dokumentasi Kegiatan`,
    alternatives: [
      `Laporan Capaian Harian: ${cleanAction} yang telah diverifikasi beserta foto dokumentasi`,
      `1 Berkas Bukti Fisik Pelaksanaan Kegiatan (${cleanAction}) dan Catatan Tindak Lanjut Harian`,
      `Terwujudnya hasil kerja harian pada kegiatan ${cleanAction} sesuai target RKH periode berjalan`
    ]
  };
}

export const EKinerjaHarianView: React.FC<EKinerjaHarianViewProps> = ({
  initialTab = 'harian',
  showToast,
  onProfileUpdated
}) => {
  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => StorageService.getTeachers());
  const [activeTeacherId, setActiveTeacherId] = useState<string>(() => StorageService.getActiveTeacherId());
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(() =>
    StorageService.getTeacherProfile()
  );
  const [appSettings] = useState<AppSettings>(() => StorageService.getAppSettings());

  const [periods, setPeriods] = useState<EKinerjaPeriod[]>(() =>
    StorageService.getEKinerjaPeriods()
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    const list = StorageService.getEKinerjaPeriods();
    return list[0]?.id || '';
  });

  const [activities, setActivities] = useState<EKinerjaDailyActivity[]>(() =>
    StorageService.getEKinerjaActivities()
  );

  const handleSwitchTeacher = (newTeacherId: string) => {
    StorageService.setActiveTeacherId(newTeacherId);
    setActiveTeacherId(newTeacherId);
    const newProf = StorageService.getTeacherProfile(newTeacherId);
    setTeacherProfile(newProf);
    const teacherPeriods = StorageService.getEKinerjaPeriods(newTeacherId);
    setPeriods(teacherPeriods);
    setSelectedPeriodId(teacherPeriods[0]?.id || '');
    const teacherActs = StorageService.getEKinerjaActivities(undefined, newTeacherId);
    setActivities(teacherActs);
    setMasterRhkList(StorageService.getMasterRhkList());
    if (onProfileUpdated) onProfileUpdated(newProf.fullName);
    showToast(`Mengisi E-Kinerja untuk: ${newProf.fullName} (Master RHK berlaku untuk semua guru)`, 'success');
  };

  useEffect(() => {
    const onTeacherChanged = () => {
      const curActive = StorageService.getActiveTeacherId();
      setActiveTeacherId(curActive);
      setTeachers(StorageService.getTeachers());
      const updatedProf = StorageService.getTeacherProfile(curActive);
      setTeacherProfile(updatedProf);
      const pers = StorageService.getEKinerjaPeriods(curActive);
      setPeriods(pers);
      setSelectedPeriodId(prev => (pers.some(p => p.id === prev) ? prev : pers[0]?.id || ''));
      setActivities(StorageService.getEKinerjaActivities(undefined, curActive));
      setMasterRhkList(StorageService.getMasterRhkList());
    };
    window.addEventListener('lms-teacher-changed', onTeacherChanged);
    return () => window.removeEventListener('lms-teacher-changed', onTeacherChanged);
  }, []);

  // Quick Edit Identitas Modal (if user wants to adjust automatic identity directly)
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState<TeacherProfile>(() =>
    StorageService.getTeacherProfile()
  );

  // Add Period State (Bulan & Tahun dibuat terpisah)
  const [newPeriodMonth, setNewPeriodMonth] = useState<string>(() => {
    const mIdx = new Date().getMonth();
    return MONTHS_LIST[mIdx] || 'Oktober';
  });
  const [newPeriodYear, setNewPeriodYear] = useState<string>(() =>
    String(new Date().getFullYear())
  );
  const [copyMasterFromCurrent, setCopyMasterFromCurrent] = useState<boolean>(true);
  const [periodModalOpen, setPeriodModalOpen] = useState<boolean>(false);

  // Master Inputs for RKH, Rencana Aksi, Tindak Lanjut (Manual & bisa lebih dari 1)
  const [selectedMasterRhkDropdown, setSelectedMasterRhkDropdown] = useState<string>('');
  const [newRkhTitle, setNewRkhTitle] = useState('');
  const [editingRkhId, setEditingRkhId] = useState<string | null>(null);

  const [newRaTitle, setNewRaTitle] = useState('');
  const [newRaRkhId, setNewRaRkhId] = useState('');
  const [editingRaId, setEditingRaId] = useState<string | null>(null);
  const [aiRaLoading, setAiRaLoading] = useState(false);
  const [aiRaSuggestions, setAiRaSuggestions] = useState<string[]>([]);

  const [newTlTitle, setNewTlTitle] = useState('');
  const [editingTlId, setEditingTlId] = useState<string | null>(null);
  const [aiTlLoading, setAiTlLoading] = useState(false);
  const [aiTlSuggestions, setAiTlSuggestions] = useState<string[]>([]);

  // Daily Activity Modal (Setiap hari bisa mengisi lebih dari 1 kegiatan / Rencana Aksi)
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<EKinerjaDailyActivity | null>(null);
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [draftEntries, setDraftEntries] = useState<DraftActivityEntry[]>([]);

  // Photo Lightbox Preview Modal
  const [previewPhotosModal, setPreviewPhotosModal] = useState<{
    title: string;
    dateLabel: string;
    photos: EKinerjaPhotoItem[];
    activeIndex: number;
  } | null>(null);

  // Document (PDF / Word) Preview Modal
  const [previewDocumentModal, setPreviewDocumentModal] = useState<{
    activityTitle: string;
    dateLabel: string;
    doc: EKinerjaDocumentItem;
  } | null>(null);

  // Delete Confirmation State
  const [deleteActivityConfirmId, setDeleteActivityConfirmId] = useState<string | null>(null);

  // Active Period Object
  const activePeriod = useMemo(
    () => periods.find(p => p.id === selectedPeriodId) || periods[0] || null,
    [periods, selectedPeriodId]
  );

  // Filtered Activities for Active Period
  const periodActivities = useMemo(() => {
    if (!activePeriod) return [];
    return activities
      .filter(a => a.periodId === activePeriod.id)
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        if (cmp !== 0) return cmp;
        return a.createdAt.localeCompare(b.createdAt);
      });
  }, [activities, activePeriod]);

  // WFA Filter & Geotagging State
  const [workModeFilter, setWorkModeFilter] = useState<'all' | 'WFA' | 'WFO' | 'WFH'>('all');
  const [isLocatingId, setIsLocatingId] = useState<string | null>(null);

  const displayedActivities = useMemo(() => {
    if (workModeFilter === 'all') return periodActivities;
    return periodActivities.filter(a => (a.workMode || 'WFA') === workModeFilter);
  }, [periodActivities, workModeFilter]);

  const wfaCount = useMemo(
    () => periodActivities.filter(a => (a.workMode || 'WFA') === 'WFA').length,
    [periodActivities]
  );
  const wfoCount = useMemo(
    () => periodActivities.filter(a => a.workMode === 'WFO').length,
    [periodActivities]
  );
  const wfhCount = useMemo(
    () => periodActivities.filter(a => a.workMode === 'WFH').length,
    [periodActivities]
  );

  // ============================================================================
  // MASTER RHK, RENCANA AKSI & TINDAK LANJUT STATE & HANDLERS
  // ============================================================================
  const [activeMainTab, setActiveMainTab] = useState<'harian' | 'master_rhk' | 'nota_dinas'>(() => initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab]);

  const [masterRhkList, setMasterRhkList] = useState<EKinerjaMasterItem[]>(() =>
    StorageService.getMasterRhkList()
  );

  useEffect(() => {
    setMasterRhkList(StorageService.getMasterRhkList());
  }, [activeTeacherId]);

  const [masterFilterCategory, setMasterFilterCategory] = useState<'all' | 'Utama' | 'Tambahan'>('all');
  const [masterOwnershipFilter, setMasterOwnershipFilter] = useState<'all' | 'custom' | 'shared'>('all');
  const [masterSearchQuery, setMasterSearchQuery] = useState('');

  // RHK Import Modal (for selecting master RHK into active period)
  const [rhkImportModalOpen, setRhkImportModalOpen] = useState(false);
  const [selectedMasterIdsToImport, setSelectedMasterIdsToImport] = useState<string[]>([]);

  // Picker Modal State (for taking RHK, Rencana Aksi, Tindak Lanjut into daily activity)
  const [masterPickerModalOpen, setMasterPickerModalOpen] = useState(false);
  const [masterPickerTargetDraftId, setMasterPickerTargetDraftId] = useState<string | null>(null);

  // Create / Edit Master RHK Modal
  const [createMasterModalOpen, setCreateMasterModalOpen] = useState(false);
  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);
  const [masterForm, setMasterForm] = useState<{
    code: string;
    category: 'Utama' | 'Tambahan';
    targetTeacherScope: 'current' | 'all';
    title: string;
    aspek: 'Kualitas' | 'Kuantitas' | 'Waktu' | 'Biaya';
    indikator: string;
    target: string;
    rencanaAksiTextRaw: string;
    tindakLanjutRaw: string;
  }>({
    code: 'RHK Baru',
    category: 'Utama',
    targetTeacherScope: 'current',
    title: '',
    aspek: 'Kualitas',
    indikator: '',
    target: '100% / 12 Dokumen',
    rencanaAksiTextRaw: '',
    tindakLanjutRaw: ''
  });

  const handleOpenMasterPickerForDraft = (draftTempId: string) => {
    setMasterPickerTargetDraftId(draftTempId);
    setMasterPickerModalOpen(true);
  };

  const handleApplyMasterToDraft = (
    masterRhk: EKinerjaMasterItem,
    ra: EKinerjaMasterRencanaAksi,
    draftTempId: string
  ) => {
    const curActivePeriod = activePeriod || ensureActivePeriod();

    // 1. Ensure RHK exists in activePeriod or match by title
    let targetRkhId = '';
    const matchedRkh = curActivePeriod.rkhList.find(
      r => r.title.trim().toLowerCase() === masterRhk.title.trim().toLowerCase()
    );

    let nextPeriodRkhList = [...curActivePeriod.rkhList];
    if (matchedRkh) {
      targetRkhId = matchedRkh.id;
    } else {
      const newRkh: EKinerjaRKHItem = {
        id: `rkh-${curActivePeriod.id}-${Date.now().toString(36)}`,
        code: masterRhk.code || `RHK ${curActivePeriod.rkhList.length + 1}`,
        title: masterRhk.title
      };
      nextPeriodRkhList.push(newRkh);
      targetRkhId = newRkh.id;
    }

    // 2. Ensure Rencana Aksi exists in activePeriod
    let nextPeriodRaList = [...curActivePeriod.rencanaAksiList];
    const matchedRa = nextPeriodRaList.find(
      r => r.title.trim().toLowerCase() === ra.title.trim().toLowerCase()
    );

    let targetRaId = '__custom__';
    let customRaText = ra.title;

    if (matchedRa) {
      targetRaId = matchedRa.id;
      customRaText = '';
    } else {
      const newRa: EKinerjaRencanaAksiItem = {
        id: `ra-${curActivePeriod.id}-${targetRkhId}-${Date.now().toString(36)}`,
        rkhId: targetRkhId,
        title: ra.title
      };
      nextPeriodRaList.push(newRa);
      targetRaId = newRa.id;
      customRaText = '';
    }

    // 3. Ensure Tindak Lanjut templates are added to activePeriod
    const tindakLanjutToApply =
      ra.defaultTindakLanjut && ra.defaultTindakLanjut.length > 0
        ? ra.defaultTindakLanjut
        : masterRhk.tindakLanjutTemplates.slice(0, 2);

    let nextPeriodTlList = [...curActivePeriod.tindakLanjutList];
    const existingTlTitles = new Set(nextPeriodTlList.map(t => t.title.trim().toLowerCase()));
    tindakLanjutToApply.forEach((tl, tlIdx) => {
      if (!existingTlTitles.has(tl.trim().toLowerCase())) {
        nextPeriodTlList.push({
          id: `tl-${curActivePeriod.id}-${Date.now().toString(36)}-${tlIdx}`,
          title: tl
        });
        existingTlTitles.add(tl.trim().toLowerCase());
      }
    });

    // Save updated activePeriod
    const updatedPeriod: EKinerjaPeriod = {
      ...curActivePeriod,
      rkhList: nextPeriodRkhList,
      rencanaAksiList: nextPeriodRaList,
      tindakLanjutList: nextPeriodTlList
    };
    StorageService.saveEKinerjaPeriod(updatedPeriod, activeTeacherId);
    setPeriods(StorageService.getEKinerjaPeriods(activeTeacherId));

    // 4. Update the draft entry in the activity modal
    const finalOutput =
      ra.defaultOutput ||
      buildSmartLocalOutput({
        rkhText: masterRhk.title,
        rencanaAksiText: ra.title,
        tindakLanjutText: tindakLanjutToApply.join('; ')
      }).primaryOutput;

    updateDraftEntry(draftTempId, {
      rkhId: targetRkhId,
      rencanaAksiId: targetRaId,
      customRencanaAksi: customRaText,
      selectedTindakLanjut: tindakLanjutToApply,
      outputText: finalOutput
    });

    setMasterPickerModalOpen(false);
    setMasterPickerTargetDraftId(null);
    showToast(
      `Berhasil mengambil RHK & Rencana Aksi: "${ra.title}" beserta Tindak Lanjut & Output!`,
      'success'
    );
  };

  const handleImportAllMasterToActivePeriod = () => {
    if (!activePeriod) {
      showToast('Pilih atau buat periode terlebih dahulu!', 'error');
      return;
    }
    const res = StorageService.importMasterRhkToPeriod(activePeriod.id, undefined, activeTeacherId);
    if (res) {
      setPeriods(StorageService.getEKinerjaPeriods(activeTeacherId));
      refreshData();
      showToast(
        `Seluruh daftar Bank Master RHK, Rencana Aksi, dan Tindak Lanjut berhasil diterapkan ke periode ${res.month} ${res.year}!`,
        'success'
      );
    }
  };

  const handleImportSingleMasterToActivePeriod = (masterId: string) => {
    if (!activePeriod) {
      showToast('Pilih atau buat periode terlebih dahulu!', 'error');
      return;
    }
    const res = StorageService.importMasterRhkToPeriod(activePeriod.id, [masterId], activeTeacherId);
    if (res) {
      setPeriods(StorageService.getEKinerjaPeriods(activeTeacherId));
      refreshData();
      const m = masterRhkList.find(x => x.id === masterId);
      showToast(
        `RHK "${m?.code || 'Pilihan'}" beserta Rencana Aksi berhasil diimpor ke periode ${res.month} ${res.year}!`,
        'success'
      );
    }
  };

  const handleResetMasterRhkToStandard = () => {
    const res = StorageService.resetMasterRhkToDefaults();
    setMasterRhkList(res);
    showToast('Katalog Bank Master RHK berhasil dipulihkan ke Standar Nasional PermenPAN-RB.', 'info');
  };

  const handleOpenCreateMasterModal = (itemToEdit?: EKinerjaMasterItem) => {
    if (itemToEdit) {
      setEditingMasterId(itemToEdit.id);
      setMasterForm({
        code: itemToEdit.code,
        category: itemToEdit.category,
        targetTeacherScope: 'all',
        title: itemToEdit.title,
        aspek: itemToEdit.aspek || 'Kualitas',
        indikator: itemToEdit.indikator || '',
        target: itemToEdit.target || '100% / 12 Dokumen',
        rencanaAksiTextRaw: itemToEdit.rencanaAksiList.map(r => r.title).join('\n'),
        tindakLanjutRaw: itemToEdit.tindakLanjutTemplates.join('\n')
      });
    } else {
      setEditingMasterId(null);
      setMasterForm({
        code: `RHK ${masterRhkList.length + 1}`,
        category: 'Utama',
        targetTeacherScope: 'all',
        title: '',
        aspek: 'Kualitas',
        indikator: 'Persentase keterlaksanaan kegiatan yang diverifikasi Kepala Sekolah',
        target: '100% / 12 Dokumen',
        rencanaAksiTextRaw: '',
        tindakLanjutRaw: ''
      });
    }
    setCreateMasterModalOpen(true);
  };

  const handleDuplicateMasterToTeacher = (item: EKinerjaMasterItem) => {
    const copyItem: EKinerjaMasterItem = {
      ...item,
      id: `m-rhk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      code: `${item.code} (Salinan)`,
      title: item.title,
      isCustom: true,
      teacherId: undefined,
      createdAt: new Date().toISOString()
    };
    StorageService.saveMasterRhkItem(copyItem);
    setMasterRhkList(StorageService.getMasterRhkList());
    showToast(`RHK "${item.code}" berhasil diduplikat untuk semua guru!`, 'success');
  };

  const handleSaveMasterItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterForm.title.trim()) {
      showToast('Judul RHK wajib diisi!', 'error');
      return;
    }

    const raLines = masterForm.rencanaAksiTextRaw
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const tlLines = masterForm.tindakLanjutRaw
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const rencanaAksiList: EKinerjaMasterRencanaAksi[] =
      raLines.length > 0
        ? raLines.map((line, idx) => ({
            id: `ra-custom-${Date.now().toString(36)}-${idx}`,
            title: line,
            defaultTindakLanjut: tlLines.slice(0, 2),
            defaultOutput: `1 Berkas Laporan Pelaksanaan "${line}" yang telah divalidasi`
          }))
        : [
            {
              id: `ra-custom-${Date.now().toString(36)}-0`,
              title: `Melaksanakan kegiatan ${masterForm.title.slice(0, 60)}...`,
              defaultTindakLanjut: tlLines,
              defaultOutput: `1 Dokumen Laporan Pelaksanaan ${masterForm.title.slice(0, 50)}`
            }
          ];

    const newItem: EKinerjaMasterItem = {
      id: editingMasterId || `m-rhk-${Date.now().toString(36)}`,
      code: masterForm.code.trim() || `RHK ${masterRhkList.length + 1}`,
      category: masterForm.category,
      title: masterForm.title.trim(),
      aspek: masterForm.aspek,
      indikator: masterForm.indikator.trim(),
      target: masterForm.target.trim(),
      rencanaAksiList,
      tindakLanjutTemplates: tlLines,
      isCustom: true,
      teacherId: undefined
    };

    StorageService.saveMasterRhkItem(newItem);
    setMasterRhkList(StorageService.getMasterRhkList());
    setCreateMasterModalOpen(false);
    showToast(
      editingMasterId
        ? 'Master RHK berhasil diperbarui (berlaku untuk semua guru)!'
        : 'Master RHK baru berhasil disimpan (berlaku untuk semua guru)!',
      'success'
    );
  };

  const handleDeleteMasterItem = (id: string) => {
    StorageService.deleteMasterRhkItem(id);
    setMasterRhkList(StorageService.getMasterRhkList());
    showToast('Item RHK berhasil dihapus dari Bank Master.', 'info');
  };

  const handleCreateActivityFromMaster = (mItem: EKinerjaMasterItem, ra: EKinerjaMasterRencanaAksi) => {
    setActiveMainTab('harian');
    const targetPeriod = ensureActivePeriod();
    const blank = createBlankDraftEntry(targetPeriod);
    setEditingActivity(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setDraftEntries([blank]);
    setActivityModalOpen(true);

    setTimeout(() => {
      handleApplyMasterToDraft(mItem, ra, blank.tempId);
    }, 60);
  };

  // Filtered Master Items (Berlaku untuk semua guru tanpa filter teacherId)
  const filteredMasterRhk = useMemo(() => {
    return masterRhkList.filter(item => {
      if (masterFilterCategory !== 'all' && item.category !== masterFilterCategory) {
        return false;
      }
      if (masterSearchQuery.trim()) {
        const q = masterSearchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inCode = item.code.toLowerCase().includes(q);
        const inRa = item.rencanaAksiList.some(r => r.title.toLowerCase().includes(q));
        const inTl = item.tindakLanjutTemplates.some(t => t.toLowerCase().includes(q));
        return inTitle || inCode || inRa || inTl;
      }
      return true;
    });
  }, [masterRhkList, masterFilterCategory, masterSearchQuery]);

  // Automatic Identity Fields (#1, #2, #3, #4)
  const autoNamaPegawai = teacherProfile.fullName || '-';
  const autoNip = teacherProfile.nip || '-';
  const autoJabatan =
    teacherProfile.jabatan ||
    (teacherProfile.subject
      ? `Guru ${teacherProfile.subject}`
      : 'Guru Pendidikan Agama Islam & Budi Pekerti');
  const autoUnitKerja = teacherProfile.schoolName || appSettings.schoolName || '-';

  const notaDinasSectionRef = useRef<HTMLDivElement | null>(null);

  const buildDefaultNotaDinasConfig = (
    period: EKinerjaPeriod | null,
    profile: TeacherProfile,
    settings: AppSettings
  ): EKinerjaNotaDinasConfig => {
    const saved = period?.notaDinas;
    const unitKerjaName =
      profile.schoolName || settings.schoolName || 'SD Negeri Ciketing Udik 2';
    const defaultKepada = unitKerjaName.toLowerCase().startsWith('kepala')
      ? unitKerjaName
      : `Kepala ${unitKerjaName}`;
    const defaultDari = profile.fullName || 'Suhendri';
    const defaultNip = profile.nip || '198001122024211002';
    const defaultKepsek =
      (profile.principalName && profile.principalName.trim() !== '' && profile.principalName !== 'Kepala Sekolah'
        ? profile.principalName
        : settings.principalName && settings.principalName.trim() !== ''
        ? settings.principalName
        : 'Hj. Siti Rohmah, M.Pd.').trim();
    const defaultKepsekNip =
      (profile.principalNip && profile.principalNip.trim() !== '' && profile.principalNip !== '-'
        ? profile.principalNip
        : settings.principalNip && settings.principalNip.trim() !== ''
        ? settings.principalNip
        : '197405101998022001').trim();
    const yearStr = period?.year || String(new Date().getFullYear());
    const defaultNomor = `421.2/     -SD/${yearStr}`;
    const defaultTanggal = new Date().toISOString().split('T')[0];
    const defaultAspects: EKinerjaNotaDinasAspect[] =
      saved?.aspects && saved.aspects.length > 0
        ? saved.aspects
        : period && period.rkhList.length > 0
        ? period.rkhList.map((r, idx) => ({
            id: `nd-asp-${idx + 1}`,
            aspekText: r.title,
            buktiFisikUrl: ''
          }))
        : [
            {
              id: 'nd-asp-1',
              aspekText:
                'Terlaksananya pembelajaran/pembimbingan dalam mewujudkan pembelajaran yang bermutu untuk semua',
              buktiFisikUrl: ''
            }
          ];

    return {
      teacherId: profile.id,
      kepadaYth: saved?.kepadaYth || defaultKepada,
      dari: saved?.dari || defaultDari,
      nip: saved?.nip || defaultNip,
      principalName:
        (saved?.principalName && saved.principalName.trim() !== '' && saved.principalName !== 'Kepala Sekolah'
          ? saved.principalName
          : defaultKepsek).trim(),
      principalNip:
        (saved?.principalNip && saved.principalNip.trim() !== '' && saved.principalNip !== '-'
          ? saved.principalNip
          : defaultKepsekNip).trim(),
      nomorSurat: saved?.nomorSurat || defaultNomor,
      tanggalSurat: saved?.tanggalSurat || defaultTanggal,
      lampiran: saved?.lampiran || '1 (Satu) Berkas',
      singkatanJabatan:
        saved?.singkatanJabatan ||
        (profile.subject ? `Guru ${profile.subject}` : 'Guru PAI'),
      jabatanLengkap:
        saved?.jabatanLengkap ||
        profile.jabatan ||
        'Guru Pendidikan Agama Islam dan Budi Pekerti',
      periodeText:
        saved?.periodeText ||
        `${period?.month || 'Oktober'} ${period?.year || '2026'}`,
      aspects: defaultAspects,
      signatureDataUrl:
        saved?.signatureDataUrl || profile.signatureDataUrl || DEFAULT_TEACHER_SIGNATURE,
      principalSignatureDataUrl:
        saved?.principalSignatureDataUrl || profile.principalSignatureDataUrl || DEFAULT_PRINCIPAL_SIGNATURE
    };
  };

  const [notaDinasForm, setNotaDinasForm] = useState<EKinerjaNotaDinasConfig>(() =>
    buildDefaultNotaDinasConfig(activePeriod, teacherProfile, appSettings)
  );

  // Sync Nota Dinas form whenever activePeriod ID or teacherProfile changes
  useEffect(() => {
    setNotaDinasForm(
      buildDefaultNotaDinasConfig(activePeriod, teacherProfile, appSettings)
    );
  }, [
    activePeriod?.id,
    teacherProfile.fullName,
    teacherProfile.nip,
    teacherProfile.schoolName,
    teacherProfile.principalName,
    teacherProfile.principalNip,
    teacherProfile.signatureDataUrl,
    teacherProfile.principalSignatureDataUrl
  ]);

  const formatTanggalSuratIndo = (dateStr: string): string => {
    if (!dateStr) return '-';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      return dt.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const refreshData = () => {
    const updatedPeriods = StorageService.getEKinerjaPeriods();
    setPeriods(updatedPeriods);
    setActivities(StorageService.getEKinerjaActivities());
    setTeacherProfile(StorageService.getTeacherProfile());
  };

  const formatHariTanggalIndo = (dateStr: string): string => {
    if (!dateStr) return '-';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      return dt.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  /**
   * Resolves the Output text for a daily activity (with a smart fallback if an older record
   * was created before Tindak Lanjut and Output were separated).
   */
  const resolveActivityOutput = (act: EKinerjaDailyActivity): string => {
    if (act.outputText && act.outputText.trim()) {
      return act.outputText.trim();
    }
    return buildSmartLocalOutput({
      rkhText: act.rkhText || '',
      rencanaAksiText: act.rencanaAksiText || '',
      tindakLanjutText: act.tindakLanjutText || ''
    }).primaryOutput;
  };

  /**
   * Resolves the Bukti Fisik dropdown value ('Foto Kegiatan' | 'Dokumen' | 'Foto Kegiatan dan Dokumen')
   */
  const resolveBuktiFisikType = (act: EKinerjaDailyActivity): EKinerjaBuktiFisikType => {
    if (
      act.buktiFisikType === 'Foto Kegiatan' ||
      act.buktiFisikType === 'Dokumen' ||
      act.buktiFisikType === 'Foto Kegiatan dan Dokumen'
    ) {
      return act.buktiFisikType;
    }
    const hasPhotos = (act.photos?.length || 0) > 0;
    const hasDocs = (act.documents?.length || 0) > 0;
    if (hasPhotos && hasDocs) return 'Foto Kegiatan dan Dokumen';
    if (hasDocs) return 'Dokumen';
    return 'Foto Kegiatan';
  };

  /**
   * Kompresi otomatis ukuran foto saat di-upload agar tajam saat diperbesar di Lampiran 1
   * (2 foto per halaman A4) namun tetap hemat memori penyimpanan.
   */
  const compressImageFile = (file: File): Promise<CompressedImageResult> => {
    const originalSizeKb = Math.max(1, Math.round(file.size / 1024));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIMENSION = 1080;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIMENSION) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            const rawUrl = e.target?.result as string;
            resolve({
              dataUrl: rawUrl,
              originalSizeKb,
              compressedSizeKb: originalSizeKb,
              savedPercent: 0
            });
            return;
          }

          // Background putih bersih untuk gambar transparan sebelum kompresi JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Kompresi bertahap: target <= 110 KB agar tajam saat diperbesar di Lampiran 1
          const qualities = [0.74, 0.64, 0.54, 0.45];
          let compressedDataUrl = canvas.toDataURL('image/jpeg', qualities[0]);
          let compressedSizeKb = Math.max(1, Math.round((compressedDataUrl.length * 3) / 4 / 1024));

          for (let i = 1; i < qualities.length; i++) {
            if (compressedSizeKb <= 110) break;
            compressedDataUrl = canvas.toDataURL('image/jpeg', qualities[i]);
            compressedSizeKb = Math.max(1, Math.round((compressedDataUrl.length * 3) / 4 / 1024));
          }

          // Jika masih cukup besar, perkecil dimensi 80% sekali lagi
          if (compressedSizeKb > 140) {
            const smallCanvas = document.createElement('canvas');
            smallCanvas.width = Math.round(width * 0.8);
            smallCanvas.height = Math.round(height * 0.8);
            const sCtx = smallCanvas.getContext('2d');
            if (sCtx) {
              sCtx.fillStyle = '#ffffff';
              sCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
              sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
              compressedDataUrl = smallCanvas.toDataURL('image/jpeg', 0.6);
              compressedSizeKb = Math.max(
                1,
                Math.round((compressedDataUrl.length * 3) / 4 / 1024)
              );
            }
          }

          const savedPercent =
            originalSizeKb > compressedSizeKb
              ? Math.min(99, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100))
              : 0;

          resolve({
            dataUrl: compressedDataUrl,
            originalSizeKb,
            compressedSizeKb,
            savedPercent
          });
        };
        img.onerror = err => reject(err);
        img.src = e.target?.result as string;
      };
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  };

  /**
   * Membaca berkas dokumen (PDF / Word: .pdf, .doc, .docx) menjadi EKinerjaDocumentItem
   * untuk disimpan dan dijadikan Lampiran Bukti Fisik pada Versi Cetak E-Kinerja.
   */
  const readDocumentFile = (file: File, indexOffset = 0): Promise<EKinerjaDocumentItem> => {
    const fileSizeKb = Math.max(1, Math.round(file.size / 1024));
    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf') || file.type === 'application/pdf';
    const isWord =
      lowerName.endsWith('.doc') ||
      lowerName.endsWith('.docx') ||
      file.type.includes('word') ||
      file.type.includes('officedocument.wordprocessingml');

    const fileType: 'pdf' | 'word' | 'other' = isPdf ? 'pdf' : isWord ? 'word' : 'other';

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = String(e.target?.result || '');
        resolve({
          id: 'doc-ek-' + Math.random().toString(36).substring(2, 9) + '-' + indexOffset,
          fileName: file.name,
          fileType,
          mimeType:
            file.type ||
            (isPdf
              ? 'application/pdf'
              : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
          fileSizeKb,
          dataUrl,
          uploadedAt: new Date().toISOString()
        });
      };
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // ============================================================================
  // 1-4. UPDATE IDENTITAS OTOMATIS (SINKRON DENGAN PROFIL GURU PAI)
  // ============================================================================
  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfileForm.fullName.trim() || !editProfileForm.schoolName.trim()) {
      showToast('Nama Pegawai dan Unit Kerja wajib diisi!', 'error');
      return;
    }
    const updated = StorageService.saveTeacherProfile(editProfileForm);
    setTeacherProfile(updated);
    if (onProfileUpdated) onProfileUpdated(editProfileForm.fullName);
    setIdentityModalOpen(false);
    showToast('Identitas Pegawai berhasil diperbarui!', 'success');
  };

  // ============================================================================
  // 5. TAMBAH PERIODE (BULAN DAN TAHUN TERPISAH)
  // ============================================================================
  const handleAddPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodMonth || !newPeriodYear.trim()) {
      showToast('Pilih Bulan dan masukkan Tahun periode terlebih dahulu!', 'error');
      return;
    }

    const existing = periods.find(
      p =>
        p.month.toLowerCase() === newPeriodMonth.toLowerCase() &&
        p.year.trim() === newPeriodYear.trim()
    );
    if (existing) {
      setSelectedPeriodId(existing.id);
      setPeriodModalOpen(false);
      showToast(`Periode ${newPeriodMonth} ${newPeriodYear} sudah ada dan diaktifkan.`, 'info');
      return;
    }

    const rkhCopy: EKinerjaRKHItem[] =
      copyMasterFromCurrent && activePeriod
        ? activePeriod.rkhList.map(r => ({ ...r }))
        : [];
    const raCopy: EKinerjaRencanaAksiItem[] =
      copyMasterFromCurrent && activePeriod
        ? activePeriod.rencanaAksiList.map(ra => ({ ...ra }))
        : [];
    const tlCopy: EKinerjaTindakLanjutItem[] =
      copyMasterFromCurrent && activePeriod
        ? activePeriod.tindakLanjutList.map(tl => ({ ...tl }))
        : [];

    const created = StorageService.saveEKinerjaPeriod({
      month: newPeriodMonth,
      year: newPeriodYear.trim(),
      rkhList: rkhCopy,
      rencanaAksiList: raCopy,
      tindakLanjutList: tlCopy
    });

    refreshData();
    setSelectedPeriodId(created.id);
    setPeriodModalOpen(false);
    showToast(`Periode E-Kinerja Bulan ${created.month} Tahun ${created.year} berhasil dibuat!`, 'success');
  };

  const handleUpdatePeriodMonthYear = (month: string, year: string) => {
    if (!activePeriod) return;
    const updated = StorageService.saveEKinerjaPeriod({
      ...activePeriod,
      month,
      year
    });
    refreshData();
    setSelectedPeriodId(updated.id);
    showToast(`Periode diperbarui menjadi Bulan ${month} Tahun ${year}.`, 'success');
  };

  const handleDeleteCurrentPeriod = () => {
    if (!activePeriod) return;
    StorageService.deleteEKinerjaPeriod(activePeriod.id);
    const remaining = StorageService.getEKinerjaPeriods();
    setPeriods(remaining);
    setSelectedPeriodId(remaining[0]?.id || '');
    setActivities(StorageService.getEKinerjaActivities());
    showToast(`Periode ${activePeriod.month} ${activePeriod.year} dihapus.`, 'info');
  };

  // Ensure an active period exists before adding RKH/Rencana Aksi/Tindak Lanjut
  const ensureActivePeriod = (): EKinerjaPeriod => {
    if (activePeriod) return activePeriod;
    const created = StorageService.saveEKinerjaPeriod({
      month: newPeriodMonth || 'Oktober',
      year: newPeriodYear || String(new Date().getFullYear()),
      rkhList: [],
      rencanaAksiList: [],
      tindakLanjutList: []
    });
    setPeriods(StorageService.getEKinerjaPeriods());
    setSelectedPeriodId(created.id);
    return created;
  };

  // ============================================================================
  // 6. PENENTUAN RKH (MANUAL DAN BISA LEBIH DARI 1)
  // ============================================================================
  const handleAddOrUpdateRkh = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRkhTitle.trim()) {
      showToast('Ketik isi Rencana Hasil Kerja (RKH) terlebih dahulu!', 'error');
      return;
    }
    const targetPeriod = ensureActivePeriod();
    let updatedList = [...targetPeriod.rkhList];
    const cleanTitle = newRkhTitle.trim();

    if (editingRkhId) {
      updatedList = updatedList.map(item =>
        item.id === editingRkhId ? { ...item, title: cleanTitle } : item
      );
      showToast('Butir RKH berhasil diperbarui (berlaku untuk semua guru)!', 'success');
    } else {
      const nextNum = updatedList.length + 1;
      updatedList.push({
        id: 'rkh-' + Math.random().toString(36).substring(2, 8),
        code: `RKH ${nextNum}`,
        title: cleanTitle
      });
      // Simpan juga ke Bank Master RHK jika belum ada, agar berlaku untuk semua guru
      const currentMaster = StorageService.getMasterRhkList();
      const existsInMaster = currentMaster.some(
        m => m.title.trim().toLowerCase() === cleanTitle.toLowerCase()
      );
      if (!existsInMaster) {
        StorageService.saveMasterRhkItem({
          id: '',
          code: `RHK ${currentMaster.length + 1}`,
          category: 'Utama',
          title: cleanTitle,
          aspek: 'Kualitas',
          indikator: 'Persentase keterlaksanaan kegiatan yang diverifikasi Kepala Sekolah',
          target: '100% / 12 Dokumen',
          rencanaAksiList: [
            {
              id: `ra-custom-${Date.now().toString(36)}`,
              title: `Melaksanakan kegiatan ${cleanTitle.slice(0, 60)}`,
              defaultTindakLanjut: ['Melakukan koordinasi dan telaah dokumen bersama Kepala Sekolah'],
              defaultOutput: `1 Dokumen Laporan Pelaksanaan ${cleanTitle.slice(0, 50)}`
            }
          ],
          tindakLanjutTemplates: ['Melakukan koordinasi dan telaah dokumen bersama Kepala Sekolah'],
          isCustom: true
        });
        setMasterRhkList(StorageService.getMasterRhkList());
      }
      showToast('RKH baru berhasil ditambahkan & disimpan untuk semua guru!', 'success');
    }

    StorageService.saveEKinerjaPeriod({
      ...targetPeriod,
      rkhList: updatedList
    });
    setNewRkhTitle('');
    setEditingRkhId(null);
    refreshData();
  };

  const handleDeleteRkh = (id: string) => {
    if (!activePeriod) return;
    const updatedList = activePeriod.rkhList
      .filter(r => r.id !== id)
      .map((r, idx) => ({ ...r, code: `RKH ${idx + 1}` }));
    StorageService.saveEKinerjaPeriod({
      ...activePeriod,
      rkhList: updatedList
    });
    refreshData();
    showToast('Butir RKH dihapus.', 'info');
  };

  // ============================================================================
  // 7. RENCANA AKSI (MANUAL DAN BISA LEBIH DARI 1)
  // ============================================================================
  const handleAddOrUpdateRencanaAksi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRaTitle.trim()) {
      showToast('Ketik isi Rencana Aksi terlebih dahulu!', 'error');
      return;
    }
    const targetPeriod = ensureActivePeriod();
    let updatedList = [...targetPeriod.rencanaAksiList];

    if (editingRaId) {
      updatedList = updatedList.map(item =>
        item.id === editingRaId
          ? { ...item, title: newRaTitle.trim(), rkhId: newRaRkhId || undefined }
          : item
      );
      showToast('Rencana Aksi berhasil diperbarui!', 'success');
    } else {
      updatedList.push({
        id: 'ra-' + Math.random().toString(36).substring(2, 8),
        rkhId: newRaRkhId || targetPeriod.rkhList[0]?.id || undefined,
        title: newRaTitle.trim()
      });
      showToast('Rencana Aksi baru berhasil ditambahkan!', 'success');
    }

    StorageService.saveEKinerjaPeriod({
      ...targetPeriod,
      rencanaAksiList: updatedList
    });
    setNewRaTitle('');
    setEditingRaId(null);
    refreshData();
  };

  const handleDeleteRencanaAksi = (id: string) => {
    if (!activePeriod) return;
    const updatedList = activePeriod.rencanaAksiList.filter(r => r.id !== id);
    StorageService.saveEKinerjaPeriod({
      ...activePeriod,
      rencanaAksiList: updatedList
    });
    refreshData();
    showToast('Rencana Aksi dihapus.', 'info');
  };

  // ============================================================================
  // 8. TINDAK LANJUT (DIPISAHKAN DARI OUTPUT — OUTPUT HANYA DIISI SAAT KEGIATAN HARIAN)
  // ============================================================================
  const handleAddOrUpdateTindakLanjut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTlTitle.trim()) {
      showToast('Ketik isi Tindak Lanjut terlebih dahulu!', 'error');
      return;
    }
    const targetPeriod = ensureActivePeriod();
    let updatedList = [...targetPeriod.tindakLanjutList];

    if (editingTlId) {
      updatedList = updatedList.map(item =>
        item.id === editingTlId ? { ...item, title: newTlTitle.trim() } : item
      );
      showToast('Tindak Lanjut berhasil diperbarui!', 'success');
    } else {
      updatedList.push({
        id: 'tl-' + Math.random().toString(36).substring(2, 8),
        title: newTlTitle.trim()
      });
      showToast('Tindak Lanjut baru berhasil ditambahkan!', 'success');
    }

    StorageService.saveEKinerjaPeriod({
      ...targetPeriod,
      tindakLanjutList: updatedList
    });
    setNewTlTitle('');
    setEditingTlId(null);
    refreshData();
  };

  const handleDeleteTindakLanjut = (id: string) => {
    if (!activePeriod) return;
    const updatedList = activePeriod.tindakLanjutList.filter(t => t.id !== id);
    StorageService.saveEKinerjaPeriod({
      ...activePeriod,
      tindakLanjutList: updatedList
    });
    refreshData();
    showToast('Tindak Lanjut dihapus.', 'info');
  };

  // ============================================================================
  // DROPDOWN MASTER RHK & BANTU DENGAN AI (RENCANA AKSI & TINDAK LANJUT)
  // ============================================================================
  const handleSelectMasterRhkDropdown = (masterId: string) => {
    setSelectedMasterRhkDropdown(masterId);
    if (!masterId) return;
    if (masterId === '__manual__') {
      setNewRkhTitle('');
      return;
    }
    const item = masterRhkList.find(m => m.id === masterId);
    if (item) {
      setNewRkhTitle(item.title);
    }
  };

  const handleApplySelectedMasterRhkToPeriod = () => {
    if (!selectedMasterRhkDropdown || selectedMasterRhkDropdown === '__manual__') {
      if (newRkhTitle.trim()) {
        handleAddOrUpdateRkh({ preventDefault: () => {} } as any);
      } else {
        showToast('Pilih RHK dari Data Master atau ketik judul RHK!', 'error');
      }
      return;
    }
    const m = masterRhkList.find(x => x.id === selectedMasterRhkDropdown);
    if (!m) return;
    const targetPeriod = ensureActivePeriod();

    const exists = targetPeriod.rkhList.some(
      r => r.title.trim().toLowerCase() === m.title.trim().toLowerCase()
    );
    if (exists) {
      showToast(`RHK "${m.code}" sudah ada dalam periode ini!`, 'info');
      return;
    }

    const nextNum = targetPeriod.rkhList.length + 1;
    const newRkhItem: EKinerjaRKHItem = {
      id: 'rkh-' + Math.random().toString(36).substring(2, 8),
      code: m.code || `RKH ${nextNum}`,
      title: m.title
    };

    const newRaItems: EKinerjaRencanaAksiItem[] = (m.rencanaAksiList || []).map(ra => ({
      id: 'ra-' + Math.random().toString(36).substring(2, 8),
      rkhId: newRkhItem.id,
      title: ra.title
    }));

    const currentTlTitles = new Set(targetPeriod.tindakLanjutList.map(t => t.title.trim().toLowerCase()));
    const newTlItems: EKinerjaTindakLanjutItem[] = [];
    (m.tindakLanjutTemplates || []).forEach(t => {
      if (!currentTlTitles.has(t.trim().toLowerCase())) {
        newTlItems.push({
          id: 'tl-' + Math.random().toString(36).substring(2, 8),
          title: t
        });
        currentTlTitles.add(t.trim().toLowerCase());
      }
    });

    const updatedPeriod: EKinerjaPeriod = {
      ...targetPeriod,
      rkhList: [...targetPeriod.rkhList, newRkhItem],
      rencanaAksiList: [...targetPeriod.rencanaAksiList, ...newRaItems],
      tindakLanjutList: [...targetPeriod.tindakLanjutList, ...newTlItems]
    };

    StorageService.saveEKinerjaPeriod(updatedPeriod, activeTeacherId);
    setPeriods(StorageService.getEKinerjaPeriods(activeTeacherId));
    refreshData();
    setSelectedMasterRhkDropdown('');
    setNewRkhTitle('');
    showToast(
      `RHK "${m.code}" beserta ${newRaItems.length} Rencana Aksi berhasil ditambahkan dari Data Master!`,
      'success'
    );
  };

  const handleGenerateAiRencanaAksi = async () => {
    setAiRaLoading(true);
    const selectedRkh = activePeriod?.rkhList.find(r => r.id === newRaRkhId) || activePeriod?.rkhList[0];
    const rkhContext = selectedRkh?.title || newRkhTitle || 'Melaksanakan tugas pokok dan fungsi guru';

    try {
      const res = await fetch('/api/generate-ekinerja-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rencana_aksi',
          rkhText: rkhContext,
          jabatan: autoJabatan,
          schoolName: autoUnitKerja
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setAiRaSuggestions(data.suggestions);
          showToast('Rekomendasi Rencana Aksi dari AI berhasil dimuat!', 'success');
          setAiRaLoading(false);
          return;
        }
      }
    } catch {
      // fallback
    }

    setAiRaSuggestions([
      `Menyusun Modul Ajar dan instrumen asesmen pembelajaran ${rkhContext.slice(0, 45)}`,
      `Melaksanakan kegiatan pembelajaran tatap muka dan bimbingan aktif peserta didik`,
      `Melakukan analisis ketercapaian KKTP dan menyusun laporan pelaksanaan kegiatan`
    ]);
    setAiRaLoading(false);
    showToast('Rekomendasi Rencana Aksi dari AI siap digunakan!', 'success');
  };

  const handleGenerateAiTindakLanjut = async () => {
    setAiTlLoading(true);
    const selectedRkh = activePeriod?.rkhList[0];
    const selectedRa = activePeriod?.rencanaAksiList[0];
    const rkhContext = selectedRkh?.title || '';
    const raContext = selectedRa?.title || newRaTitle || '';

    try {
      const res = await fetch('/api/generate-ekinerja-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tindak_lanjut',
          rkhText: rkhContext,
          rencanaAksiText: raContext,
          jabatan: autoJabatan,
          schoolName: autoUnitKerja
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setAiTlSuggestions(data.suggestions);
          showToast('Rekomendasi Tindak Lanjut dari AI berhasil dimuat!', 'success');
          setAiTlLoading(false);
          return;
        }
      }
    } catch {
      // fallback
    }

    setAiTlSuggestions([
      'Tersedianya Dokumen Modul Ajar dan Rekap Jurnal Pembelajaran Terverifikasi',
      'Terlaksananya Monitoring dan Evaluasi Perkembangan Belajar Siswa',
      'Tersusunnya Lembar Kerja Evaluasi dan Refleksi Guru PAI'
    ]);
    setAiTlLoading(false);
    showToast('Rekomendasi Tindak Lanjut dari AI siap digunakan!', 'success');
  };

  const handleGenerateAiRaForDraft = async (tempId: string) => {
    const entry = draftEntries.find(d => d.tempId === tempId);
    if (!entry) return;
    const linkedRkh = activePeriod?.rkhList.find(r => r.id === entry.rkhId) || activePeriod?.rkhList[0];
    const rkhContext = linkedRkh?.title || 'Tugas pokok dan fungsi guru';

    updateDraftEntry(tempId, { isGeneratingRa: true });
    try {
      const res = await fetch('/api/generate-ekinerja-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rencana_aksi',
          rkhText: rkhContext,
          jabatan: autoJabatan,
          schoolName: autoUnitKerja
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          updateDraftEntry(tempId, {
            aiRaSuggestions: data.suggestions,
            isGeneratingRa: false
          });
          showToast('Rekomendasi Rencana Aksi AI berhasil dimuat!', 'success');
          return;
        }
      }
    } catch {
      // fallback
    }

    updateDraftEntry(tempId, {
      aiRaSuggestions: [
        `Melaksanakan pembelajaran dan pembiasaan ibadah ${rkhContext.slice(0, 35)}`,
        `Menyusun perangkat ajar, LKPD, dan media pembelajaran interaktif`,
        `Melakukan evaluasi formatif dan pembinaan akhlak peserta didik`
      ],
      isGeneratingRa: false
    });
    showToast('Rekomendasi Rencana Aksi AI siap!', 'success');
  };

  const handleGenerateAiTlForDraft = async (tempId: string) => {
    const entry = draftEntries.find(d => d.tempId === tempId);
    if (!entry) return;
    const selectedRaObj = activePeriod?.rencanaAksiList.find(r => r.id === entry.rencanaAksiId);
    const raText = entry.rencanaAksiId === '__custom__' || !selectedRaObj ? entry.customRencanaAksi : selectedRaObj.title;
    const linkedRkh = activePeriod?.rkhList.find(r => r.id === entry.rkhId) || activePeriod?.rkhList[0];

    updateDraftEntry(tempId, { isGeneratingTl: true });
    try {
      const res = await fetch('/api/generate-ekinerja-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tindak_lanjut',
          rkhText: linkedRkh?.title || '',
          rencanaAksiText: raText || '',
          jabatan: autoJabatan,
          schoolName: autoUnitKerja
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          updateDraftEntry(tempId, {
            aiTlSuggestions: data.suggestions,
            isGeneratingTl: false
          });
          showToast('Rekomendasi Tindak Lanjut AI berhasil dimuat!', 'success');
          return;
        }
      }
    } catch {
      // fallback
    }

    updateDraftEntry(tempId, {
      aiTlSuggestions: [
        'Tersusunnya Lembar Kerja & Rekap Perkembangan Siswa',
        'Dokumen Jurnal Pembelajaran dan Absensi Harian Terverifikasi',
        'Laporan Hasil Evaluasi dan Catatan Refleksi Guru'
      ],
      isGeneratingTl: false
    });
    showToast('Rekomendasi Tindak Lanjut AI siap!', 'success');
  };

  // ============================================================================
  // 9 & 10. KEGIATAN HARIAN + PEMISAHAN TINDAK LANJUT & OUTPUT + UPLOAD FOTO & DOKUMEN (PDF/WORD)
  // ============================================================================
  const createBlankDraftEntry = (period: EKinerjaPeriod | null): DraftActivityEntry => {
    const firstRa = period?.rencanaAksiList[0];
    const firstTl = period?.tindakLanjutList[0];
    const firstRkh =
      period?.rkhList.find(r => r.id === firstRa?.rkhId) || period?.rkhList[0];

    const initialOutput = buildSmartLocalOutput({
      rkhText: firstRkh?.title || '',
      rencanaAksiText: firstRa?.title || '',
      tindakLanjutText: firstTl?.title || ''
    });

    return {
      tempId: 'draft-' + Math.random().toString(36).substring(2, 8),
      workMode: 'WFA',
      locationName: '',
      locationCoords: undefined,
      rkhId: firstRa?.rkhId || period?.rkhList[0]?.id || '',
      rencanaAksiId: firstRa?.id || '',
      customRencanaAksi: '',
      selectedTindakLanjut: firstTl ? [firstTl.title] : [],
      customTindakLanjut: '',
      outputText: '',
      buktiFisikType: 'Foto Kegiatan',
      aiSuggestions: [initialOutput.primaryOutput, ...initialOutput.alternatives],
      isGeneratingOutput: false,
      photos: [],
      documents: []
    };
  };

  const openAddDailyActivityModal = (presetDate?: string) => {
    const targetPeriod = ensureActivePeriod();
    setEditingActivity(null);
    setFormDate(presetDate || new Date().toISOString().split('T')[0]);
    setDraftEntries([createBlankDraftEntry(targetPeriod)]);
    setActivityModalOpen(true);
  };

  const openEditDailyActivityModal = (act: EKinerjaDailyActivity) => {
    setEditingActivity(act);
    setFormDate(act.date);
    const matchingRa = activePeriod?.rencanaAksiList.find(
      r => r.id === act.rencanaAksiId || r.title === act.rencanaAksiText
    );
    const presetTls =
      act.tindakLanjutList && act.tindakLanjutList.length > 0
        ? act.tindakLanjutList
        : act.tindakLanjutText
        ? act.tindakLanjutText.split(' • ').filter(Boolean)
        : [];

    const knownTlTitles = new Set((activePeriod?.tindakLanjutList || []).map(t => t.title));
    const selectedFromKnown = presetTls.filter(t => knownTlTitles.has(t));
    const customLeftover = presetTls.filter(t => !knownTlTitles.has(t)).join('; ');

    const localSug = buildSmartLocalOutput({
      rkhText: act.rkhText || '',
      rencanaAksiText: act.rencanaAksiText || '',
      tindakLanjutText: act.tindakLanjutText || ''
    });

    setDraftEntries([
      {
        tempId: act.id,
        workMode: act.workMode || 'WFA',
        locationName: act.locationName || '',
        locationCoords: act.locationCoords,
        rkhId: act.rkhId || matchingRa?.rkhId || '',
        rencanaAksiId: matchingRa ? matchingRa.id : '__custom__',
        customRencanaAksi: matchingRa ? '' : act.rencanaAksiText,
        selectedTindakLanjut: selectedFromKnown,
        customTindakLanjut: customLeftover,
        outputText: resolveActivityOutput(act),
        buktiFisikType: resolveBuktiFisikType(act),
        aiSuggestions: [localSug.primaryOutput, ...localSug.alternatives],
        isGeneratingOutput: false,
        photos: [...(act.photos || [])],
        documents: [...(act.documents || [])]
      }
    ]);
    setActivityModalOpen(true);
  };

  const handleAddDraftRow = () => {
    setDraftEntries(prev => [...prev, createBlankDraftEntry(activePeriod)]);
  };

  const handleRemoveDraftRow = (tempId: string) => {
    if (draftEntries.length <= 1) return;
    setDraftEntries(prev => prev.filter(d => d.tempId !== tempId));
  };

  const updateDraftEntry = (tempId: string, patch: Partial<DraftActivityEntry>) => {
    setDraftEntries(prev =>
      prev.map(d => (d.tempId === tempId ? { ...d, ...patch } : d))
    );
  };

  const handleGetGpsLocation = (tempId: string) => {
    if (!navigator.geolocation) {
      showToast('Perangkat atau browser tidak mendukung fitur Geolocation GPS.', 'error');
      return;
    }
    setIsLocatingId(tempId);
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;
        updateDraftEntry(tempId, {
          workMode: 'WFA',
          locationCoords: { latitude: lat, longitude: lng, accuracy: acc },
          locationName:
            draftEntries.find(d => d.tempId === tempId)?.locationName ||
            `WFA (GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)})`
        });
        setIsLocatingId(null);
        showToast(`Titik GPS WFA berhasil diambil (Akurasi: ±${Math.round(acc)}m)`, 'success');
      },
      error => {
        setIsLocatingId(null);
        showToast('Gagal mendeteksi lokasi GPS: ' + (error.message || 'Izin lokasi tidak diberikan'), 'info');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const toggleDraftTindakLanjut = (tempId: string, tlTitle: string) => {
    setDraftEntries(prev =>
      prev.map(d => {
        if (d.tempId !== tempId) return d;
        const exists = d.selectedTindakLanjut.includes(tlTitle);
        const nextList = exists
          ? d.selectedTindakLanjut.filter(t => t !== tlTitle)
          : [...d.selectedTindakLanjut, tlTitle];
        return { ...d, selectedTindakLanjut: nextList };
      })
    );
  };

  /**
   * Fitur Isi Otomatis Output dengan AI (pada saat mengisi kegiatan harian)
   */
  const handleGenerateAiOutputForEntry = async (tempId: string) => {
    const entry = draftEntries.find(d => d.tempId === tempId);
    if (!entry) return;

    const selectedRaObj = activePeriod?.rencanaAksiList.find(
      r => r.id === entry.rencanaAksiId
    );
    const rencanaAksiText =
      entry.rencanaAksiId === '__custom__' || !selectedRaObj
        ? entry.customRencanaAksi.trim()
        : selectedRaObj.title;

    const linkedRkhId = entry.rkhId || selectedRaObj?.rkhId || activePeriod?.rkhList[0]?.id;
    const rkhText = activePeriod?.rkhList.find(r => r.id === linkedRkhId)?.title || '';

    const combinedTlList = [...entry.selectedTindakLanjut];
    if (entry.customTindakLanjut.trim()) {
      combinedTlList.push(entry.customTindakLanjut.trim());
    }
    const tindakLanjutText = combinedTlList.join(' • ');

    updateDraftEntry(tempId, { isGeneratingOutput: true });

    try {
      const res = await fetch('/api/generate-ekinerja-output', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rkhText,
          rencanaAksiText,
          tindakLanjutText,
          jabatan: autoJabatan,
          schoolName: autoUnitKerja
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.primaryOutput) {
          const allSuggestions = [
            data.primaryOutput,
            ...(Array.isArray(data.alternatives) ? data.alternatives : [])
          ];
          updateDraftEntry(tempId, {
            outputText: data.primaryOutput,
            aiSuggestions: allSuggestions,
            isGeneratingOutput: false
          });
          showToast('Output Kegiatan berhasil diisi otomatis oleh AI!', 'success');
          return;
        }
      }
    } catch {
      // Fallback ke Smart Local AI Generator
    }

    const fallback = buildSmartLocalOutput({
      rkhText,
      rencanaAksiText,
      tindakLanjutText
    });

    updateDraftEntry(tempId, {
      outputText: fallback.primaryOutput,
      aiSuggestions: [fallback.primaryOutput, ...fallback.alternatives],
      isGeneratingOutput: false
    });
    showToast('Output Kegiatan berhasil diisi otomatis dengan AI!', 'success');
  };

  /**
   * Isi Otomatis dengan AI untuk seluruh baris kegiatan pada modal sekaligus
   */
  const handleGenerateAllAiOutputsInModal = async () => {
    for (const entry of draftEntries) {
      await handleGenerateAiOutputForEntry(entry.tempId);
    }
  };

  const handleUploadPhotosToDraft = async (
    tempId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploaded: EKinerjaPhotoItem[] = [];
    let totalOrigKb = 0;
    let totalCompKb = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImageFile(files[i]);
        totalOrigKb += compressed.originalSizeKb;
        totalCompKb += compressed.compressedSizeKb;
        uploaded.push({
          id: 'pho-' + Math.random().toString(36).substring(2, 9) + '-' + i,
          dataUrl: compressed.dataUrl,
          caption: files[i].name.replace(/\.[^/.]+$/, ''),
          originalSizeKb: compressed.originalSizeKb,
          compressedSizeKb: compressed.compressedSizeKb,
          uploadedAt: new Date().toISOString()
        });
      } catch {
        // ignore invalid file
      }
    }

    if (uploaded.length > 0) {
      setDraftEntries(prev =>
        prev.map(d => {
          if (d.tempId !== tempId) return d;
          const nextPhotos = [...d.photos, ...uploaded];
          const autoType: EKinerjaBuktiFisikType =
            d.documents.length > 0 || d.buktiFisikType === 'Dokumen' || d.buktiFisikType === 'Foto Kegiatan dan Dokumen'
              ? d.documents.length > 0
                ? 'Foto Kegiatan dan Dokumen'
                : d.buktiFisikType
              : 'Foto Kegiatan';
          return { ...d, photos: nextPhotos, buktiFisikType: autoType };
        })
      );
      const savedRatio =
        totalOrigKb > totalCompKb
          ? Math.round(((totalOrigKb - totalCompKb) / totalOrigKb) * 100)
          : 0;
      showToast(
        `${uploaded.length} foto dikompresi otomatis (${totalOrigKb} KB ➔ ${totalCompKb} KB${
          savedRatio > 0 ? ` • Hemat ${savedRatio}% memori` : ''
        })!`,
        'success'
      );
    }
    e.target.value = '';
  };

  // Ubah Dropdown Bukti Fisik langsung di baris Tabel E-Kinerja Harian
  const handleChangeActivityBuktiFisikType = (
    activity: EKinerjaDailyActivity,
    nextType: EKinerjaBuktiFisikType
  ) => {
    StorageService.saveEKinerjaActivity({
      ...activity,
      buktiFisikType: nextType
    });
    refreshData();
    showToast(`Kolom Bukti Fisik diubah menjadi "${nextType}".`, 'success');
  };

  // Direct Multi-Photo Upload from Table Row (#9: menu upload foto kegiatan bisa lebih dari satu + kompresi otomatis)
  const handleDirectUploadPhotosToActivity = async (
    activity: EKinerjaDailyActivity,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: EKinerjaPhotoItem[] = [];
    let totalOrigKb = 0;
    let totalCompKb = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImageFile(files[i]);
        totalOrigKb += compressed.originalSizeKb;
        totalCompKb += compressed.compressedSizeKb;
        newPhotos.push({
          id: 'pho-' + Math.random().toString(36).substring(2, 9) + '-' + i,
          dataUrl: compressed.dataUrl,
          caption: files[i].name.replace(/\.[^/.]+$/, ''),
          originalSizeKb: compressed.originalSizeKb,
          compressedSizeKb: compressed.compressedSizeKb,
          uploadedAt: new Date().toISOString()
        });
      } catch {
        // ignore invalid file
      }
    }

    if (newPhotos.length > 0) {
      const hasDocs = (activity.documents || []).length > 0;
      const nextBuktiType: EKinerjaBuktiFisikType = hasDocs
        ? 'Foto Kegiatan dan Dokumen'
        : activity.buktiFisikType === 'Foto Kegiatan dan Dokumen'
        ? 'Foto Kegiatan dan Dokumen'
        : 'Foto Kegiatan';

      StorageService.saveEKinerjaActivity({
        ...activity,
        buktiFisikType: nextBuktiType,
        photos: [...(activity.photos || []), ...newPhotos]
      });
      refreshData();
      const savedRatio =
        totalOrigKb > totalCompKb
          ? Math.round(((totalOrigKb - totalCompKb) / totalOrigKb) * 100)
          : 0;
      showToast(
        `${newPhotos.length} foto berhasil dikompresi otomatis (${totalOrigKb} KB ➔ ${totalCompKb} KB${
          savedRatio > 0 ? ` • Hemat ${savedRatio}% memori` : ''
        }) & masuk ke Lampiran 1!`,
        'success'
      );
    }
    e.target.value = '';
  };

  const handleRemovePhotoFromActivity = (activity: EKinerjaDailyActivity, photoId: string) => {
    StorageService.saveEKinerjaActivity({
      ...activity,
      photos: (activity.photos || []).filter(p => p.id !== photoId)
    });
    refreshData();
    showToast('Foto dokumentasi dihapus.', 'info');
  };

  /**
   * Upload Dokumen (PDF / Word: .pdf, .doc, .docx) ke Draft Modal Input Kegiatan
   */
  const handleUploadDocumentsToDraft = async (
    tempId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedDocs: EKinerjaDocumentItem[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const docItem = await readDocumentFile(files[i], i);
        uploadedDocs.push(docItem);
      } catch {
        // ignore invalid file
      }
    }

    if (uploadedDocs.length > 0) {
      setDraftEntries(prev =>
        prev.map(d => {
          if (d.tempId !== tempId) return d;
          const nextDocs = [...d.documents, ...uploadedDocs];
          const autoType: EKinerjaBuktiFisikType =
            d.photos.length > 0 ? 'Foto Kegiatan dan Dokumen' : 'Dokumen';
          return { ...d, documents: nextDocs, buktiFisikType: autoType };
        })
      );
      showToast(
        `${uploadedDocs.length} dokumen (${uploadedDocs
          .map(d => d.fileType.toUpperCase())
          .join(', ')}) berhasil dilampirkan ke Lampiran 2 (Dokumen Utuh)!`,
        'success'
      );
    }
    e.target.value = '';
  };

  /**
   * Upload Dokumen (PDF / Word) Langsung dari Baris Tabel E-Kinerja Harian
   */
  const handleDirectUploadDocumentsToActivity = async (
    activity: EKinerjaDailyActivity,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: EKinerjaDocumentItem[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const docItem = await readDocumentFile(files[i], i);
        newDocs.push(docItem);
      } catch {
        // ignore invalid file
      }
    }

    if (newDocs.length > 0) {
      const hasPhotos = (activity.photos || []).length > 0;
      const nextBuktiType: EKinerjaBuktiFisikType = hasPhotos
        ? 'Foto Kegiatan dan Dokumen'
        : activity.buktiFisikType === 'Foto Kegiatan dan Dokumen'
        ? 'Foto Kegiatan dan Dokumen'
        : 'Dokumen';

      StorageService.saveEKinerjaActivity({
        ...activity,
        buktiFisikType: nextBuktiType,
        documents: [...(activity.documents || []), ...newDocs]
      });
      refreshData();
      showToast(
        `${newDocs.length} dokumen (${newDocs
          .map(d => d.fileType.toUpperCase())
          .join(', ')}) berhasil diunggah & dijadikan Lampiran 2 (Dokumen Utuh)!`,
        'success'
      );
    }
    e.target.value = '';
  };

  const handleRemoveDocumentFromActivity = (
    activity: EKinerjaDailyActivity,
    docId: string
  ) => {
    StorageService.saveEKinerjaActivity({
      ...activity,
      documents: (activity.documents || []).filter(d => d.id !== docId)
    });
    refreshData();
    showToast('Dokumen lampiran bukti fisik dihapus.', 'info');
  };

  const handleDownloadDocument = (doc: EKinerjaDocumentItem) => {
    const link = document.createElement('a');
    link.href = doc.dataUrl;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveDailyActivities = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) {
      showToast('Pilih Hari / Tanggal terlebih dahulu!', 'error');
      return;
    }
    const targetPeriod = ensureActivePeriod();

    const preparedPayloads: Array<
      Omit<EKinerjaDailyActivity, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
    > = [];

    for (let i = 0; i < draftEntries.length; i++) {
      const entry = draftEntries[i];
      const selectedRaObj = targetPeriod.rencanaAksiList.find(
        r => r.id === entry.rencanaAksiId
      );
      const finalRaText =
        entry.rencanaAksiId === '__custom__' || !selectedRaObj
          ? entry.customRencanaAksi.trim()
          : selectedRaObj.title;

      if (!finalRaText) {
        showToast(
          `Pilih atau ketik Jenis Kegiatan (Rencana Aksi) pada baris kegiatan ke-${i + 1}!`,
          'error'
        );
        return;
      }

      const combinedTlList = [...entry.selectedTindakLanjut];
      if (entry.customTindakLanjut.trim()) {
        combinedTlList.push(entry.customTindakLanjut.trim());
      }

      if (combinedTlList.length === 0) {
        showToast(
          `Pilih atau ketik minimal 1 Tindak Lanjut pada kegiatan ke-${i + 1}!`,
          'error'
        );
        return;
      }

      const linkedRkhId = entry.rkhId || selectedRaObj?.rkhId || targetPeriod.rkhList[0]?.id;
      const linkedRkhObj = targetPeriod.rkhList.find(r => r.id === linkedRkhId);

      // Pastikan Output terisi (jika belum diketik, otomatis gunakan rumusan AI kontekstual)
      const finalOutputText =
        entry.outputText.trim() ||
        buildSmartLocalOutput({
          rkhText: linkedRkhObj?.title || '',
          rencanaAksiText: finalRaText,
          tindakLanjutText: combinedTlList.join(' • ')
        }).primaryOutput;

      preparedPayloads.push({
        id: editingActivity ? editingActivity.id : undefined,
        periodId: targetPeriod.id,
        date: formDate,
        workMode: entry.workMode || 'WFA',
        locationName: entry.locationName || '',
        locationCoords: entry.locationCoords,
        rkhId: linkedRkhId,
        rkhText: linkedRkhObj?.title || '',
        rencanaAksiId: selectedRaObj?.id,
        rencanaAksiText: finalRaText,
        tindakLanjutText: combinedTlList.join(' • '),
        tindakLanjutList: combinedTlList,
        outputText: finalOutputText,
        buktiFisikType: entry.buktiFisikType || 'Foto Kegiatan',
        photos: entry.photos,
        documents: entry.documents,
        createdAt: editingActivity ? editingActivity.createdAt : undefined
      });
    }

    if (editingActivity && preparedPayloads.length === 1) {
      StorageService.saveEKinerjaActivity(preparedPayloads[0]);
      showToast('Kegiatan E-Kinerja Harian berhasil diperbarui!', 'success');
    } else {
      StorageService.saveBulkEKinerjaActivities(preparedPayloads);
      showToast(
        `${preparedPayloads.length} Kegiatan (Rencana Aksi) pada ${formatHariTanggalIndo(
          formDate
        )} berhasil disimpan!`,
        'success'
      );
    }

    setActivityModalOpen(false);
    setEditingActivity(null);
    refreshData();
  };

  const confirmDeleteActivity = () => {
    if (!deleteActivityConfirmId) return;
    StorageService.deleteEKinerjaActivity(deleteActivityConfirmId);
    setDeleteActivityConfirmId(null);
    refreshData();
    showToast('Baris kegiatan E-Kinerja berhasil dihapus.', 'info');
  };

  // ============================================================================
  // SIMPAN LAPORAN E-KINERJA HARIAN (PERSIST KE LOKAL, INDEXEDDB & SUPABASE)
  // ============================================================================
  const handleSaveEKinerjaReport = async () => {
    const targetPeriod = ensureActivePeriod();
    const nowIso = new Date().toISOString();

    const savedPeriod = StorageService.saveEKinerjaPeriod({
      ...targetPeriod,
      savedAt: nowIso
    });

    // Pastikan seluruh aktivitas pada periode ini ikut tersimpan & tersinkronisasi
    periodActivities.forEach(act => {
      StorageService.saveEKinerjaActivity({
        ...act,
        outputText: resolveActivityOutput(act)
      });
    });

    StorageService.saveTeacherProfile(teacherProfile);
    refreshData();
    setSelectedPeriodId(savedPeriod.id);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await StorageService.flushOfflineQueue();
      } catch {
        // tetap aman di IndexedDB jika offline/gagal
      }
    }

    showToast(
      `Laporan E-Kinerja Harian Periode Bulan ${savedPeriod.month} Tahun ${savedPeriod.year} (${periodActivities.length} kegiatan) berhasil disimpan!`,
      'success'
    );
  };

  // ============================================================================
  // CETAK LAPORAN E-KINERJA HARIAN DI TAB BARU:
  // - Kolom Tabel Utama: "Bukti Fisik" (Foto Kegiatan / Dokumen / Foto Kegiatan dan Dokumen)
  // - LAMPIRAN 1: Dokumentasi Foto Kegiatan (Ukuran Foto Diperbesar, 1 Halaman Memuat 2 Foto)
  // - LAMPIRAN 2: Dokumen Bukti Fisik (Dokumen Utuh 1 Halaman Penuh per Dokumen)
  // ============================================================================
  const handlePrintEKinerjaNewTab = () => {
    if (!activePeriod) {
      showToast('Belum ada periode E-Kinerja yang aktif!', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up diblokir browser. Izinkan tab baru untuk mencetak.', 'error');
      return;
    }

    const schoolNameUpper = (autoUnitKerja || '-').toUpperCase();

    const resolvedPrincipalName = (
      (notaDinasForm.principalName && notaDinasForm.principalName.trim() !== '' && notaDinasForm.principalName !== 'Kepala Sekolah'
        ? notaDinasForm.principalName
        : teacherProfile.principalName && teacherProfile.principalName.trim() !== ''
        ? teacherProfile.principalName
        : appSettings.principalName && appSettings.principalName.trim() !== ''
        ? appSettings.principalName
        : 'Hj. Siti Rohmah, M.Pd.')
    ).trim();

    const resolvedPrincipalNip = (
      (notaDinasForm.principalNip && notaDinasForm.principalNip.trim() !== '' && notaDinasForm.principalNip !== '-'
        ? notaDinasForm.principalNip
        : teacherProfile.principalNip && teacherProfile.principalNip.trim() !== ''
        ? teacherProfile.principalNip
        : appSettings.principalNip && appSettings.principalNip.trim() !== ''
        ? appSettings.principalNip
        : '197405101998022001')
    ).trim();

    const resolvedPrincipalSigUrl =
      notaDinasForm.principalSignatureDataUrl ||
      teacherProfile.principalSignatureDataUrl ||
      DEFAULT_PRINCIPAL_SIGNATURE;

    const resolvedTeacherSigUrl =
      notaDinasForm.signatureDataUrl ||
      teacherProfile.signatureDataUrl ||
      DEFAULT_TEACHER_SIGNATURE;

    const rkhHtmlList =
      activePeriod.rkhList.length > 0
        ? `<ol style="margin:0; padding-left:18px;">${activePeriod.rkhList
            .map(r => `<li style="margin-bottom:3px;">${r.title}</li>`)
            .join('')}</ol>`
        : '-';

    // 1. Kumpulkan seluruh Foto Kegiatan untuk LAMPIRAN 1 (2 Foto Diperbesar per Halaman)
    const allAttachedPhotos: Array<{
      photoNo: number;
      activityNo: number;
      dateFormatted: string;
      rkhText: string;
      rencanaAksiText: string;
      tindakLanjutText: string;
      outputText: string;
      photo: EKinerjaPhotoItem;
    }> = [];

    let runningPhotoNo = 1;
    periodActivities.forEach((act, idx) => {
      const photos = act.photos || [];
      const tlJoined =
        act.tindakLanjutList && act.tindakLanjutList.length > 0
          ? act.tindakLanjutList.join(' • ')
          : act.tindakLanjutText || '-';
      photos.forEach(p => {
        allAttachedPhotos.push({
          photoNo: runningPhotoNo++,
          activityNo: idx + 1,
          dateFormatted: formatHariTanggalIndo(act.date),
          rkhText: act.rkhText || '-',
          rencanaAksiText: act.rencanaAksiText,
          tindakLanjutText: tlJoined,
          outputText: resolveActivityOutput(act),
          photo: p
        });
      });
    });

    // Bagi foto menjadi per 2 foto per halaman untuk Lampiran 1
    const photoPages: Array<typeof allAttachedPhotos> = [];
    for (let i = 0; i < allAttachedPhotos.length; i += 2) {
      photoPages.push(allAttachedPhotos.slice(i, i + 2));
    }

    // 2. Kumpulkan seluruh Dokumen (PDF/Word) untuk LAMPIRAN 2 (Dokumen Utuh)
    const allAttachedDocs: Array<{
      attachmentNo: number;
      activityNo: number;
      dateFormatted: string;
      rkhText: string;
      rencanaAksiText: string;
      tindakLanjutText: string;
      outputText: string;
      doc: EKinerjaDocumentItem;
    }> = [];

    let runningAttachmentNo = 1;
    periodActivities.forEach((act, idx) => {
      const docs = act.documents || [];
      const tlJoined =
        act.tindakLanjutList && act.tindakLanjutList.length > 0
          ? act.tindakLanjutList.join(' • ')
          : act.tindakLanjutText || '-';
      docs.forEach(d => {
        allAttachedDocs.push({
          attachmentNo: runningAttachmentNo++,
          activityNo: idx + 1,
          dateFormatted: formatHariTanggalIndo(act.date),
          rkhText: act.rkhText || '-',
          rencanaAksiText: act.rencanaAksiText,
          tindakLanjutText: tlJoined,
          outputText: resolveActivityOutput(act),
          doc: d
        });
      });
    });

    // Baris Tabel Utama: Kolom ke-6 adalah "Bukti Fisik" (isi Dropdown: Foto Kegiatan / Dokumen / Foto Kegiatan dan Dokumen)
    const rowsHtml =
      periodActivities.length > 0
        ? periodActivities
            .map((act, idx) => {
              const tlItems =
                act.tindakLanjutList && act.tindakLanjutList.length > 0
                  ? act.tindakLanjutList
                  : [act.tindakLanjutText];
              const tlFormatted =
                tlItems.length > 1
                  ? `<ul style="margin:0; padding-left:16px;">${tlItems
                      .map(t => `<li style="margin-bottom:2px;">${t}</li>`)
                      .join('')}</ul>`
                  : tlItems[0] || '-';

              const outputFormatted = resolveActivityOutput(act);
              const buktiFisikLabel = resolveBuktiFisikType(act);
              const lampiranRefText =
                buktiFisikLabel === 'Foto Kegiatan dan Dokumen'
                  ? '(Lampiran 1 &amp; Lampiran 2)'
                  : buktiFisikLabel === 'Dokumen'
                  ? '(Lampiran 2)'
                  : '(Lampiran 1)';

              return `
                <tr>
                  <td style="text-align:center; font-weight:bold;">${idx + 1}</td>
                  <td>
                    <div style="font-weight:600; color:#0f172a;">${formatHariTanggalIndo(act.date)}</div>
                    ${
                      act.workMode
                        ? `<div style="margin-top:4px; font-size:10px; font-weight:700; color:${act.workMode === 'WFA' ? '#0d9488' : act.workMode === 'WFO' ? '#2563eb' : '#7c3aed'};">
                            <span>[${act.workMode}]</span> ${act.locationName ? `<span style="font-weight:normal; color:#475569;">${act.locationName}</span>` : ''}
                          </div>`
                        : ''
                    }
                  </td>
                  <td>
                    <div style="font-weight:600; color:#0f172a;">${act.rencanaAksiText}</div>
                    ${
                      act.rkhText
                        ? `<div style="font-size:10.5px; color:#047857; margin-top:3px;"><b>RKH:</b> ${act.rkhText}</div>`
                        : ''
                    }
                  </td>
                  <td>${tlFormatted}</td>
                  <td>${outputFormatted}</td>
                  <td style="text-align:center; vertical-align:middle;">
                    <div style="font-weight:700; color:#0f172a; font-size:11.5px;">${buktiFisikLabel}</div>
                    <div style="font-size:10px; color:#475569; margin-top:2px;">${lampiranRefText}</div>
                  </td>
                </tr>
              `;
            })
            .join('')
        : `<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748b;">Belum ada kegiatan harian pada periode ini.</td></tr>`;

    // Susun Halaman LAMPIRAN 1: DOKUMENTASI FOTO KEGIATAN (2 Foto Diperbesar per Halaman)
    const lampiran1PagesHtml =
      photoPages.length > 0
        ? photoPages
            .map((pair, pageIdx) => {
              const photosPairHtml = pair
                .map(
                  item => `
                  <div class="lampiran1-photo-box">
                    <div class="lampiran1-photo-header">
                      <span>FOTO KEGIATAN #${item.photoNo} — KEGIATAN NO. ${item.activityNo}</span>
                      <span>${item.dateFormatted}</span>
                    </div>
                    <div class="lampiran1-photo-frame">
                      <img src="${item.photo.dataUrl}" alt="Foto Kegiatan ${item.photoNo}" class="lampiran1-img" />
                    </div>
                    <div class="lampiran1-photo-caption">
                      <div><b>Jenis Kegiatan (Rencana Aksi):</b> ${item.rencanaAksiText}</div>
                      <div style="margin-top:2px; color:#047857;"><b>Output:</b> ${item.outputText}</div>
                    </div>
                  </div>
                `
                )
                .join('');

              return `
                <div class="page attachment-page lampiran1-page">
                  <div class="lampiran-banner">
                    <div>
                      <div class="lampiran-banner-title">LAMPIRAN 1 : DOKUMENTASI FOTO KEGIATAN</div>
                      <div class="lampiran-banner-sub">${schoolNameUpper} • Periode Bulan ${activePeriod.month} Tahun ${activePeriod.year} • Pegawai: ${autoNamaPegawai}</div>
                    </div>
                    <div class="lampiran-banner-page">
                      Halaman ${pageIdx + 1} dari ${photoPages.length}
                    </div>
                  </div>

                  <div class="lampiran1-two-photos-grid">
                    ${photosPairHtml}
                  </div>
                </div>
              `;
            })
            .join('')
        : `
          <div class="page attachment-page lampiran1-page">
            <div class="lampiran-banner">
              <div>
                <div class="lampiran-banner-title">LAMPIRAN 1 : DOKUMENTASI FOTO KEGIATAN</div>
                <div class="lampiran-banner-sub">${schoolNameUpper} • Periode Bulan ${activePeriod.month} Tahun ${activePeriod.year} • Pegawai: ${autoNamaPegawai}</div>
              </div>
              <div class="lampiran-banner-page">Halaman 1 dari 1</div>
            </div>
            <div class="lampiran1-two-photos-grid">
              <div class="lampiran1-photo-box">
                <div class="lampiran1-photo-header">
                  <span>FOTO KEGIATAN #1</span>
                  <span>Periode ${activePeriod.month} ${activePeriod.year}</span>
                </div>
                <div class="lampiran1-photo-frame" style="color:#64748b; font-size:13px;">
                  Belum ada foto kegiatan yang diunggah (Ukuran Bingkai Foto Diperbesar 1/2 Halaman A4)
                </div>
                <div class="lampiran1-photo-caption">
                  <b>Keterangan:</b> Unggah foto kegiatan pada kolom Bukti Fisik di tabel E-Kinerja Harian.
                </div>
              </div>
              <div class="lampiran1-photo-box">
                <div class="lampiran1-photo-header">
                  <span>FOTO KEGIATAN #2</span>
                  <span>Periode ${activePeriod.month} ${activePeriod.year}</span>
                </div>
                <div class="lampiran1-photo-frame" style="color:#64748b; font-size:13px;">
                  Belum ada foto kegiatan yang diunggah (Ukuran Bingkai Foto Diperbesar 1/2 Halaman A4)
                </div>
                <div class="lampiran1-photo-caption">
                  <b>Keterangan:</b> Setiap lembar Lampiran 1 memuat 2 foto kegiatan berukuran besar.
                </div>
              </div>
            </div>
          </div>
        `;

    // Susun Halaman LAMPIRAN 2: DOKUMEN BUKTI FISIK (DOKUMEN UTUH)
    const lampiran2PagesHtml =
      allAttachedDocs.length > 0
        ? allAttachedDocs
            .map(item => {
              const isPdf = item.doc.fileType === 'pdf';
              const isHtmlDoc =
                item.doc.mimeType === 'text/html' ||
                item.doc.fileName.toLowerCase().endsWith('.html') ||
                item.doc.dataUrl.startsWith('data:text/html');
              return `
                <div class="page attachment-page lampiran2-page">
                  <div class="lampiran-banner">
                    <div>
                      <div class="lampiran-banner-title">LAMPIRAN 2 : DOKUMEN BUKTI FISIK (DOKUMEN UTUH #${item.attachmentNo})</div>
                      <div class="lampiran-banner-sub">
                        Kegiatan No. ${item.activityNo} (${item.dateFormatted}) — ${item.rencanaAksiText} • Berkas: <b>${item.doc.fileName}</b>
                      </div>
                    </div>
                    <div class="no-print" style="display:flex; align-items:center; gap:8px;">
                      <a href="${item.doc.dataUrl}" download="${item.doc.fileName}" class="download-doc-btn">
                        📥 Unduh Dokumen Asli
                      </a>
                    </div>
                  </div>

                  ${
                    isPdf || isHtmlDoc
                      ? `
                        <div class="lampiran2-full-doc-frame">
                          <iframe src="${item.doc.dataUrl}${isPdf ? '#toolbar=0&navpanes=0&scrollbar=0&view=FitH' : ''}" title="${item.doc.fileName}" class="lampiran2-full-iframe"></iframe>
                        </div>
                      `
                      : `
                        <div class="lampiran2-full-doc-sheet">
                          <div>
                            <div style="text-align:center; border-bottom:2px solid #0f172a; padding-bottom:12px; margin-bottom:18px;">
                              <div style="font-size:15px; font-weight:800; text-transform:uppercase; color:#0f172a;">
                                DOKUMEN BUKTI FISIK PELAKSANAAN E-KINERJA HARIAN
                              </div>
                              <div style="font-size:13px; font-weight:700; color:#334155; margin-top:4px;">
                                ${schoolNameUpper} — PERIODE BULAN ${activePeriod.month.toUpperCase()} TAHUN ${activePeriod.year}
                              </div>
                            </div>

                            <table class="identity-table" style="margin-bottom:18px;">
                              <tr>
                                <td class="label">Nama Berkas Dokumen</td>
                                <td class="colon">:</td>
                                <td><b>${item.doc.fileName}</b> (${item.doc.fileType.toUpperCase()} • ${item.doc.fileSizeKb} KB)</td>
                              </tr>
                              <tr>
                                <td class="label">Nama Pegawai / NIP</td>
                                <td class="colon">:</td>
                                <td><b>${autoNamaPegawai}</b> / ${autoNip}</td>
                              </tr>
                              <tr>
                                <td class="label">Jabatan &amp; Unit Kerja</td>
                                <td class="colon">:</td>
                                <td>${autoJabatan} — ${autoUnitKerja}</td>
                              </tr>
                              <tr>
                                <td class="label">Hari / Tanggal Kegiatan</td>
                                <td class="colon">:</td>
                                <td><b>Kegiatan No. ${item.activityNo} — ${item.dateFormatted}</b></td>
                              </tr>
                              <tr>
                                <td class="label">Rencana Hasil Kerja (RKH)</td>
                                <td class="colon">:</td>
                                <td>${item.rkhText}</td>
                              </tr>
                              <tr>
                                <td class="label">Jenis Kegiatan (Rencana Aksi)</td>
                                <td class="colon">:</td>
                                <td><b>${item.rencanaAksiText}</b></td>
                              </tr>
                              <tr>
                                <td class="label">Tindak Lanjut Pelaksanaan</td>
                                <td class="colon">:</td>
                                <td>${item.tindakLanjutText}</td>
                              </tr>
                              <tr>
                                <td class="label">Output Kegiatan Harian</td>
                                <td class="colon">:</td>
                                <td><b style="color:#047857;">${item.outputText}</b></td>
                              </tr>
                            </table>

                            <div style="padding:18px; border:1.5px solid #cbd5e1; border-radius:8px; background:#f8fafc; min-height:95mm;">
                              <div style="font-weight:800; font-size:12.5px; color:#0f172a; text-transform:uppercase; margin-bottom:8px;">
                                Naskah Utuh Bukti Fisik Dokumen (${item.doc.fileName})
                              </div>
                              <p style="font-size:12.5px; line-height:1.65; color:#1e293b; text-align:justify; margin:0 0 12px 0;">
                                Dokumen <b>${item.doc.fileName}</b> ini merupakan bagian utuh yang tidak terpisahkan dari Laporan Pelaksanaan Tugas Pokok dan Fungsi (E-Kinerja Harian) <b>${autoNamaPegawai}</b> (NIP. ${autoNip}) selaku <b>${autoJabatan}</b> pada <b>${autoUnitKerja}</b> untuk pelaksanaan kegiatan <b>"${item.rencanaAksiText}"</b> pada hari <b>${item.dateFormatted}</b>.
                              </p>
                              <p style="font-size:12.5px; line-height:1.65; color:#1e293b; text-align:justify; margin:0;">
                                Tindak lanjut kegiatan telah dilaksanakan melalui: <b>${item.tindakLanjutText}</b>, dengan menghasilkan output nyata berupa: <b>${item.outputText}</b>.
                              </p>
                            </div>
                          </div>

                          <div class="signature-grid" style="margin-top:24px; justify-content:flex-end;">
                            <div class="sig-box">
                              <div>Bekasi, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Pegawai / Guru PAI</div>
                              <div class="sig-space" style="display:flex; align-items:center; justify-content:center;">
                                ${
                                  resolvedTeacherSigUrl
                                    ? `<img src="${resolvedTeacherSigUrl}" alt="TTD" style="max-height:60px; max-width:160px; object-fit:contain;" />`
                                    : ''
                                }
                              </div>
                              <div style="font-weight:bold; text-decoration:underline;">${autoNamaPegawai}</div>
                              <div>NIP. ${autoNip}</div>
                            </div>
                          </div>
                        </div>
                      `
                  }
                </div>
              `;
            })
            .join('')
        : `
          <div class="page attachment-page lampiran2-page">
            <div class="lampiran-banner">
              <div>
                <div class="lampiran-banner-title">LAMPIRAN 2 : DOKUMEN BUKTI FISIK (DOKUMEN UTUH)</div>
                <div class="lampiran-banner-sub">${schoolNameUpper} • Periode Bulan ${activePeriod.month} Tahun ${activePeriod.year} • Pegawai: ${autoNamaPegawai}</div>
              </div>
              <div class="lampiran-banner-page">Lampiran 2</div>
            </div>
            <div class="lampiran2-full-doc-sheet" style="justify-content:center; align-items:center; text-align:center; color:#64748b;">
              <div>
                <div style="font-size:15px; font-weight:800; color:#0f172a; margin-bottom:6px;">
                  BELUM ADA DOKUMEN BUKTI FISIK (PDF / WORD) YANG DIUNGGAH
                </div>
                <div style="font-size:12.5px;">
                  Unggah berkas dokumen (.pdf / .doc / .docx) pada kolom <b>Bukti Fisik</b> di tabel E-Kinerja Harian untuk menampilkan Dokumen Utuh pada Lampiran 2 ini.
                </div>
              </div>
            </div>
          </div>
        `;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>LAPORAN E-KINERJA HARIAN - ${schoolNameUpper} - ${activePeriod.month} ${activePeriod.year}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm 12mm; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #0f172a;
            background: #f1f5f9;
            margin: 0;
            padding: 20px;
          }
          .toolbar {
            max-width: 210mm;
            margin: 0 auto 16px auto;
            background: #0f172a;
            color: white;
            padding: 12px 18px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
          }
          .toolbar button {
            background: #10b981;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-size: 12.5px;
          }
          .toolbar button.secondary {
            background: #334155;
            border: 1px solid #475569;
          }
          .page {
            max-width: 210mm;
            margin: 0 auto 24px auto;
            background: white;
            padding: 14mm 12mm;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border-radius: 8px;
          }
          .attachment-page {
            page-break-before: always;
          }
          .header-title {
            text-align: center;
            border-bottom: 3px double #0f172a;
            padding-bottom: 10px;
            margin-bottom: 16px;
          }
          .header-title h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #0f172a;
          }
          .header-title p {
            margin: 4px 0 0 0;
            font-size: 13.5px;
            color: #0f172a;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }
          .identity-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 12.5px;
          }
          .identity-table td {
            padding: 4px 6px;
            vertical-align: top;
          }
          .identity-table td.label {
            width: 180px;
            font-weight: bold;
            color: #1e293b;
          }
          .identity-table td.colon {
            width: 14px;
            font-weight: bold;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11.5px;
            margin-top: 6px;
          }
          .data-table th, .data-table td {
            border: 1px solid #334155;
            padding: 7px 9px;
            vertical-align: top;
          }
          .data-table th {
            background: #e2e8f0;
            color: #0f172a;
            text-transform: uppercase;
            font-size: 10.5px;
            letter-spacing: 0.4px;
          }
          .signature-grid {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            font-size: 12.5px;
            page-break-inside: avoid;
          }
          .sig-box {
            width: 45%;
            text-align: center;
          }
          .sig-space {
            height: 66px;
          }

          /* LAMPIRAN 1 & LAMPIRAN 2 BANNER */
          .lampiran-banner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            border-bottom: 2.5px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .lampiran-banner-title {
            font-size: 15px;
            font-weight: 800;
            text-transform: uppercase;
            color: #0f172a;
            letter-spacing: 0.4px;
          }
          .lampiran-banner-sub {
            font-size: 11.5px;
            color: #334155;
            margin-top: 2px;
          }
          .lampiran-banner-page {
            font-size: 11px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 6px;
            background: #e2e8f0;
            color: #0f172a;
            white-space: nowrap;
          }

          /* LAMPIRAN 1: 2 FOTO DIPERBESAR PER HALAMAN A4 */
          .lampiran1-two-photos-grid {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .lampiran1-photo-box {
            border: 1.5px solid #1e293b;
            border-radius: 8px;
            overflow: hidden;
            background: #ffffff;
            page-break-inside: avoid;
          }
          .lampiran1-photo-header {
            background: #0f172a;
            color: #ffffff;
            padding: 6px 12px;
            font-size: 11px;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: space-between;
            letter-spacing: 0.3px;
          }
          .lampiran1-photo-frame {
            width: 100%;
            height: 98mm;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .lampiran1-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          body.contain-photo-mode .lampiran1-img {
            object-fit: contain !important;
            background: #ffffff;
          }
          .lampiran1-photo-caption {
            padding: 7px 12px;
            background: #f1f5f9;
            border-top: 1px solid #cbd5e1;
            font-size: 11.5px;
            line-height: 1.4;
          }

          /* LAMPIRAN 2: DOKUMEN BUKTI FISIK UTUH (1 HALAMAN PENUH PER DOKUMEN) */
          .lampiran2-full-doc-frame {
            width: 100%;
            height: 244mm;
            border: 1.5px solid #1e293b;
            border-radius: 6px;
            overflow: hidden;
            background: #ffffff;
          }
          .lampiran2-full-iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
          }
          .lampiran2-full-doc-sheet {
            width: 100%;
            min-height: 242mm;
            border: 1.5px solid #1e293b;
            border-radius: 6px;
            padding: 14mm 12mm;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .download-doc-btn {
            display: inline-block;
            background: #0f172a;
            color: #ffffff;
            text-decoration: none;
            font-size: 11px;
            font-weight: bold;
            padding: 6px 12px;
            border-radius: 6px;
          }
          @media print {
            body { background: white; padding: 0; }
            .toolbar, .no-print { display: none !important; }
            .page { box-shadow: none; padding: 4mm 2mm; max-width: 100%; margin: 0; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <div>
            <strong>Pratinjau Cetak Laporan E-Kinerja Harian + Lampiran 1 (2 Foto Besar/Halaman) &amp; Lampiran 2 (Dokumen Utuh)</strong>
            <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">
              Periode: ${activePeriod.month} ${activePeriod.year} • Lampiran 1: ${allAttachedPhotos.length} Foto (${Math.max(1, photoPages.length)} Halaman) • Lampiran 2: ${allAttachedDocs.length} Dokumen Utuh
            </div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="secondary" onclick="document.body.classList.toggle('contain-photo-mode')">
              🖼️ Sesuaikan Mode Foto (Penuh Bingkai / Proporsi Utuh)
            </button>
            <button onclick="window.print()">🖨️ Cetak / Unduh PDF (Laporan &amp; Lampiran 1 - 2)</button>
            <button class="secondary" onclick="window.close()">Tutup Tab</button>
          </div>
        </div>

        <!-- HALAMAN UTAMA: LAPORAN E-KINERJA HARIAN -->
        <div class="page">
          <div class="header-title">
            <h2>LAPORAN E-KINERJA HARIAN</h2>
            <p>${schoolNameUpper}</p>
          </div>

          <table class="identity-table">
            <tr>
              <td class="label">Nama Pegawai</td>
              <td class="colon">:</td>
              <td><b>${autoNamaPegawai}</b></td>
            </tr>
            <tr>
              <td class="label">NIP</td>
              <td class="colon">:</td>
              <td>${autoNip}</td>
            </tr>
            <tr>
              <td class="label">Jabatan</td>
              <td class="colon">:</td>
              <td>${autoJabatan}</td>
            </tr>
            <tr>
              <td class="label">Unit Kerja</td>
              <td class="colon">:</td>
              <td>${autoUnitKerja}</td>
            </tr>
            <tr>
              <td class="label">Periode Bulan &amp; Tahun</td>
              <td class="colon">:</td>
              <td><b>Bulan ${activePeriod.month} — Tahun ${activePeriod.year}</b></td>
            </tr>
            <tr>
              <td class="label">Rencana Hasil Kerja (RKH)</td>
              <td class="colon">:</td>
              <td>${rkhHtmlList}</td>
            </tr>
          </table>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width:36px;">No</th>
                <th style="width:130px;">Hari / Tanggal</th>
                <th>Jenis Kegiatan (Rencana Aksi)</th>
                <th>Tindak Lanjut</th>
                <th>Output</th>
                <th style="width:170px;">Bukti Fisik</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="signature-grid" style="justify-content:flex-end;">
            <div class="sig-box">
              <div>Bekasi, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Pegawai / Guru PAI</div>
              <div class="sig-space" style="display:flex; align-items:center; justify-content:center;">
                ${
                  resolvedTeacherSigUrl
                    ? `<img src="${resolvedTeacherSigUrl}" alt="TTD" style="max-height:64px; max-width:170px; object-fit:contain;" />`
                    : ''
                }
              </div>
              <div style="font-weight:bold; text-decoration:underline;">${autoNamaPegawai}</div>
              <div>NIP. ${autoNip}</div>
            </div>
          </div>
        </div>

        <!-- LAMPIRAN 1: DOKUMENTASI FOTO KEGIATAN (DIPERBESAR, 1 HALAMAN MEMUAT 2 FOTO) -->
        ${lampiran1PagesHtml}

        <!-- LAMPIRAN 2: DOKUMEN BUKTI FISIK (DOKUMEN UTUH) -->
        ${lampiran2PagesHtml}
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ============================================================================
  // INSTRUMEN NOTA DINAS & MENU UPLOAD GAMBAR TTD + CETAK NOTA DINAS
  // ============================================================================
  const persistNotaDinasConfig = (nextConfig: EKinerjaNotaDinasConfig, showNotification = false) => {
    setNotaDinasForm(nextConfig);
    const targetPeriod = ensureActivePeriod();
    const currentTeacherId = teacherProfile.id || activeTeacherId;
    StorageService.saveEKinerjaPeriod({
      ...targetPeriod,
      teacherId: currentTeacherId,
      notaDinas: {
        ...nextConfig,
        teacherId: currentTeacherId,
        updatedAt: new Date().toISOString()
      }
    }, currentTeacherId);

    let updatedProfile: TeacherProfile = { ...teacherProfile };
    let hasProfileUpdate = false;
    if (nextConfig.signatureDataUrl !== undefined && nextConfig.signatureDataUrl !== teacherProfile.signatureDataUrl) {
      updatedProfile.signatureDataUrl = nextConfig.signatureDataUrl;
      hasProfileUpdate = true;
    }
    if (nextConfig.principalSignatureDataUrl !== undefined && nextConfig.principalSignatureDataUrl !== teacherProfile.principalSignatureDataUrl) {
      updatedProfile.principalSignatureDataUrl = nextConfig.principalSignatureDataUrl;
      hasProfileUpdate = true;
    }
    if (nextConfig.principalName && nextConfig.principalName.trim() !== '' && nextConfig.principalName !== teacherProfile.principalName) {
      updatedProfile.principalName = nextConfig.principalName.trim();
      hasProfileUpdate = true;
    }
    if (nextConfig.principalNip && nextConfig.principalNip.trim() !== '' && nextConfig.principalNip !== teacherProfile.principalNip) {
      updatedProfile.principalNip = nextConfig.principalNip.trim();
      hasProfileUpdate = true;
    }
    if (hasProfileUpdate) {
      StorageService.saveTeacherProfile(updatedProfile);
      setTeacherProfile(updatedProfile);
      if (updatedProfile.principalName) {
        StorageService.saveAppSettings({
          ...StorageService.getAppSettings(),
          principalName: updatedProfile.principalName,
          principalNip: updatedProfile.principalNip || ''
        });
      }
    }

    setPeriods(StorageService.getEKinerjaPeriods(currentTeacherId));
    if (showNotification) {
      showToast('Instrumen Nota Dinas & TTD berhasil disimpan!', 'success');
    }
  };

  const handleUpdateNotaDinasField = <K extends keyof EKinerjaNotaDinasConfig>(
    key: K,
    value: EKinerjaNotaDinasConfig[K]
  ) => {
    setNotaDinasForm(prev => {
      const next = { ...prev, [key]: value };
      return next;
    });
  };

  const handleAddNotaDinasAspect = () => {
    setNotaDinasForm(prev => {
      const rkhItems = activePeriod?.rkhList || [];
      const nextRkhTitle =
        rkhItems[prev.aspects.length]?.title ||
        rkhItems[0]?.title ||
        '';
      return {
        ...prev,
        aspects: [
          ...prev.aspects,
          {
            id: 'nd-asp-' + Math.random().toString(36).substring(2, 8),
            aspekText: nextRkhTitle,
            buktiFisikUrl: ''
          }
        ]
      };
    });
  };

  const handleUpdateNotaDinasAspect = (
    id: string,
    field: 'aspekText' | 'buktiFisikUrl',
    value: string
  ) => {
    setNotaDinasForm(prev => ({
      ...prev,
      aspects: prev.aspects.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleDeleteNotaDinasAspect = (id: string) => {
    setNotaDinasForm(prev => {
      if (prev.aspects.length <= 1) return prev;
      return {
        ...prev,
        aspects: prev.aspects.filter(item => item.id !== id)
      };
    });
  };

  const handleSyncNotaDinasAspectsFromRkh = () => {
    if (!activePeriod || activePeriod.rkhList.length === 0) {
      showToast('Belum ada butir RKH pada periode ini untuk disinkronkan.', 'info');
      return;
    }
    const syncedAspects: EKinerjaNotaDinasAspect[] = activePeriod.rkhList.map((r, idx) => {
      const existing = notaDinasForm.aspects[idx];
      return {
        id: existing?.id || `nd-asp-${idx + 1}`,
        aspekText: r.title,
        buktiFisikUrl: existing?.buktiFisikUrl || ''
      };
    });
    const nextConfig = {
      ...notaDinasForm,
      aspects: syncedAspects
    };
    persistNotaDinasConfig(nextConfig, false);
    showToast(
      `${syncedAspects.length} Aspek Nota Dinas berhasil disinkronkan dari daftar RKH!`,
      'success'
    );
  };

  /**
   * Upload Gambar TTD Guru (Pegawai yang Dinilai)
   */
  const handleUploadSignatureTtd = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      showToast('Pilih file gambar (PNG / JPG / WEBP) untuk Tanda Tangan (TTD) Guru!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 520;
        const MAX_HEIGHT = 240;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawUrl = String(e.target?.result || '');
          const next = { ...notaDinasForm, signatureDataUrl: rawUrl };
          persistNotaDinasConfig(next, false);
          showToast('Gambar TTD Guru berhasil diunggah!', 'success');
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const pngDataUrl = canvas.toDataURL('image/png');
        const next = { ...notaDinasForm, signatureDataUrl: pngDataUrl };
        persistNotaDinasConfig(next, false);
        showToast('Gambar Tanda Tangan (TTD) Guru berhasil diunggah & disimpan!', 'success');
      };
      img.src = String(e.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignatureTtd = () => {
    const next = { ...notaDinasForm, signatureDataUrl: '' };
    persistNotaDinasConfig(next, false);
    showToast('Gambar TTD Guru dihapus.', 'info');
  };

  /**
   * Upload Gambar TTD Kepala Sekolah (Pejabat Penilai Kinerja)
   */
  const handleUploadPrincipalSignatureTtd = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      showToast('Pilih file gambar (PNG / JPG / WEBP) untuk TTD Kepala Sekolah!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 520;
        const MAX_HEIGHT = 240;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawUrl = String(e.target?.result || '');
          const next = { ...notaDinasForm, principalSignatureDataUrl: rawUrl };
          persistNotaDinasConfig(next, false);
          showToast('Gambar TTD Kepala Sekolah berhasil diunggah!', 'success');
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const pngDataUrl = canvas.toDataURL('image/png');
        const next = { ...notaDinasForm, principalSignatureDataUrl: pngDataUrl };
        persistNotaDinasConfig(next, false);
        showToast('Gambar TTD Kepala Sekolah berhasil diunggah & disimpan!', 'success');
      };
      img.src = String(e.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePrincipalSignatureTtd = () => {
    const next = { ...notaDinasForm, principalSignatureDataUrl: '' };
    persistNotaDinasConfig(next, false);
    showToast('Gambar TTD Kepala Sekolah dihapus.', 'info');
  };

  const handlePrintNotaDinasNewTab = () => {
    persistNotaDinasConfig(notaDinasForm, false);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Izinkan pop-up browser untuk membuka jendela Cetak Nota Dinas.', 'error');
      return;
    }

    const periodeLabel =
      notaDinasForm.periodeText && notaDinasForm.periodeText.trim()
        ? notaDinasForm.periodeText.trim()
        : `${activePeriod?.month || 'Oktober'} ${activePeriod?.year || '2026'}`;

    const tanggalFormatted = formatTanggalSuratIndo(notaDinasForm.tanggalSurat);
    const namaUpper = (notaDinasForm.dari || autoNamaPegawai || 'SUHENDRI').toUpperCase();
    const nipText = notaDinasForm.nip || autoNip || '-';
    const singkatan = notaDinasForm.singkatanJabatan || 'Guru PAI';
    const jabatanLengkap =
      notaDinasForm.jabatanLengkap || 'Guru Pendidikan Agama Islam dan Budi Pekerti';
    const unitKerjaName = teacherProfile.schoolName || appSettings.schoolName || 'SD Negeri';
    const principalNameUpper = (
      (notaDinasForm.principalName && notaDinasForm.principalName.trim() !== '' && notaDinasForm.principalName !== 'Kepala Sekolah'
        ? notaDinasForm.principalName
        : teacherProfile.principalName && teacherProfile.principalName.trim() !== ''
        ? teacherProfile.principalName
        : appSettings.principalName && appSettings.principalName.trim() !== ''
        ? appSettings.principalName
        : 'Hj. Siti Rohmah, M.Pd.')
    ).toUpperCase();
    const principalNipText =
      (notaDinasForm.principalNip && notaDinasForm.principalNip.trim() !== '' && notaDinasForm.principalNip !== '-'
        ? notaDinasForm.principalNip
        : teacherProfile.principalNip && teacherProfile.principalNip.trim() !== ''
        ? teacherProfile.principalNip
        : appSettings.principalNip && appSettings.principalNip.trim() !== ''
        ? appSettings.principalNip
        : '197405101998022001');

    const aspectsListHtml = (notaDinasForm.aspects || [])
      .filter(a => a.aspekText.trim().length > 0)
      .map((item, idx) => {
        const safeText = item.aspekText.trim();
        const url = (item.buktiFisikUrl || '').trim();
        const contentHtml = url
          ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="dynamic-red aspect-link">${safeText}</a>`
          : `<span class="dynamic-red">${safeText}</span>`;
        return `
          <tr>
            <td style="width:24px; vertical-align:top; font-weight:bold; padding-bottom:6px;" class="dynamic-red">${idx + 1}.</td>
            <td style="vertical-align:top; font-weight:bold; padding-bottom:6px; text-align:justify;">
              ${contentHtml}
            </td>
          </tr>
        `;
      })
      .join('');

    const signatureImgHtml = (notaDinasForm.signatureDataUrl || teacherProfile.signatureDataUrl || DEFAULT_TEACHER_SIGNATURE)
      ? `<div class="ttd-img-wrap"><img src="${notaDinasForm.signatureDataUrl || teacherProfile.signatureDataUrl || DEFAULT_TEACHER_SIGNATURE}" alt="Tanda Tangan Guru" class="ttd-img" /></div>`
      : `<div class="ttd-empty-space"></div>`;

    const principalSigImgHtml = (notaDinasForm.principalSignatureDataUrl || teacherProfile.principalSignatureDataUrl || DEFAULT_PRINCIPAL_SIGNATURE)
      ? `<div class="ttd-img-wrap"><img src="${notaDinasForm.principalSignatureDataUrl || teacherProfile.principalSignatureDataUrl || DEFAULT_PRINCIPAL_SIGNATURE}" alt="Tanda Tangan Kepala Sekolah" class="ttd-img" /></div>`
      : `<div class="ttd-empty-space"></div>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Nota Dinas - ${notaDinasForm.dari} - ${periodeLabel}</title>
        <style>
          @page { size: A4 portrait; margin: 18mm 20mm; }
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #111827;
            background: #e5e7eb;
            margin: 0;
            padding: 24px;
            font-size: 12pt;
            line-height: 1.5;
          }
          .no-print-bar {
            max-width: 780px;
            margin: 0 auto 18px auto;
            background: #0f172a;
            color: #f8fafc;
            padding: 12px 18px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            font-family: 'Segoe UI', Arial, sans-serif;
            box-shadow: 0 10px 25px rgba(0,0,0,0.18);
          }
          .bar-actions {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .btn-print {
            background: #1d4ed8;
            color: #ffffff;
            border: none;
            padding: 9px 18px;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            font-size: 13px;
          }
          .btn-print:hover { background: #1e40af; }
          .btn-toggle-color {
            background: #334155;
            color: #e2e8f0;
            border: 1px solid #475569;
            padding: 8px 14px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 12px;
          }
          .paper {
            max-width: 780px;
            margin: 0 auto;
            background: #ffffff;
            padding: 42px 54px;
            box-shadow: 0 6px 24px rgba(0,0,0,0.12);
            box-sizing: border-box;
          }
          .title-nota {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            letter-spacing: 3px;
            margin: 0 0 26px 0;
            text-transform: uppercase;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 12pt;
          }
          .meta-table td {
            padding: 2.5px 4px;
            vertical-align: top;
          }
          .meta-label {
            width: 120px;
          }
          .meta-colon {
            width: 14px;
            text-align: center;
          }
          .divider-line {
            border: none;
            border-top: 1.8px solid #111827;
            margin: 14px 0 22px 0;
          }
          .paragraph-indent {
            text-indent: 38px;
            text-align: justify;
            margin: 0 0 14px 0;
          }
          .aspects-table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0 18px 0;
          }
          .dynamic-red {
            color: #d93025;
            font-weight: bold;
          }
          body.black-mode .dynamic-red {
            color: #111827 !important;
          }
          .aspect-link {
            text-decoration: none;
          }
          .aspect-link:hover {
            text-decoration: underline;
          }
          .sig-container {
            margin-top: 36px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
          }
          .sig-block {
            width: 310px;
            text-align: left;
            font-size: 11.5pt;
          }
          .sig-jabatan {
            font-weight: bold;
            margin-bottom: 4px;
          }
          .ttd-img-wrap {
            min-height: 76px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 4px 0;
          }
          .ttd-img {
            max-height: 80px;
            max-width: 210px;
            object-fit: contain;
          }
          .ttd-empty-space {
            height: 72px;
          }
          .sig-name {
            font-weight: bold;
            text-decoration: underline;
            text-transform: uppercase;
          }
          @media print {
            body { background: #ffffff; padding: 0; }
            .no-print-bar { display: none !important; }
            .paper { box-shadow: none; padding: 0; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <div>
            <strong>Pratinjau Cetak Nota Dinas E-Kinerja</strong>
            <div style="font-size:12px; color:#94a3b8; margin-top:2px;">
              Periode Bulan ${periodeLabel} • ${notaDinasForm.dari} (${unitKerjaName})
            </div>
          </div>
          <div class="bar-actions">
            <button class="btn-toggle-color" onclick="document.body.classList.toggle('black-mode')">
              🎨 Ubah Warna Teks (Merah / Hitam)
            </button>
            <button class="btn-print" onclick="window.print()">
              🖨️ Cetak Nota Dinas / Simpan PDF
            </button>
          </div>
        </div>

        <div class="paper">
          <div class="title-nota">N O T A - D I N A S</div>

          <table class="meta-table">
            <tr>
              <td class="meta-label">Kepada Yth</td>
              <td class="meta-colon">:</td>
              <td>${notaDinasForm.kepadaYth || '-'}</td>
            </tr>
            <tr>
              <td class="meta-label">Dari</td>
              <td class="meta-colon">:</td>
              <td>${notaDinasForm.dari || '-'}</td>
            </tr>
            <tr>
              <td class="meta-label">Nomor</td>
              <td class="meta-colon">:</td>
              <td>${notaDinasForm.nomorSurat || '-'}</td>
            </tr>
            <tr>
              <td class="meta-label">Tanggal</td>
              <td class="meta-colon">:</td>
              <td>${tanggalFormatted}</td>
            </tr>
            <tr>
              <td class="meta-label">Lampiran</td>
              <td class="meta-colon">:</td>
              <td>${notaDinasForm.lampiran || '-'}</td>
            </tr>
            <tr>
              <td class="meta-label">Hal</td>
              <td class="meta-colon">:</td>
              <td style="text-align:justify;">
                Laporan Pelaksanaan Tugas Pokok dan Fungsi <span class="dynamic-red">${singkatan}</span>
                Periode Bulan <span class="dynamic-red">${periodeLabel}</span>
              </td>
            </tr>
          </table>

          <hr class="divider-line" />

          <p class="paragraph-indent">
            Berdasarkan tugas Pokok dan Fungsi dari <b>${jabatanLengkap}</b> untuk Mencapai Tujuan Organisasi, Bersama ini disampaikan laporan hasil pelaksanaan kegiatan dimaksud meliputi aspek-aspek sebagai berikut :
          </p>

          <table class="aspects-table">
            <tbody>
              ${
                aspectsListHtml ||
                `<tr><td style="width:24px;" class="dynamic-red">1.</td><td class="dynamic-red">Terlaksananya pembelajaran/pembimbingan dalam mewujudkan pembelajaran yang bermutu untuk semua</td></tr>`
              }
            </tbody>
          </table>

          <p class="paragraph-indent">
            Demikian Laporan Pelaksanaan Tugas Pokok dan Fungsi <span class="dynamic-red">${singkatan}</span> Periode Bulan <span class="dynamic-red">${periodeLabel}</span> ini dibuat dan mohon arahan lebih lanjut.
          </p>

          <div class="sig-container" style="justify-content: flex-end;">
            <div class="sig-block" style="text-align: left;">
              <div class="sig-jabatan">${jabatanLengkap}</div>
              ${signatureImgHtml}
              <div class="sig-name">${namaUpper}</div>
              <div>NIP. ${nipText}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    if (!activePeriod) return;
    const rows: any[][] = [
      ['LAPORAN E-KINERJA HARIAN'],
      [(autoUnitKerja || '-').toUpperCase()],
      [],
      ['Nama Pegawai', ':', autoNamaPegawai],
      ['NIP', ':', autoNip],
      ['Jabatan', ':', autoJabatan],
      ['Unit Kerja', ':', autoUnitKerja],
      ['Periode Bulan', ':', activePeriod.month],
      ['Periode Tahun', ':', activePeriod.year],
      [
        'RKH Periode Ini',
        ':',
        activePeriod.rkhList.map((r, i) => `${i + 1}. ${r.title}`).join(' | ') || '-'
      ],
      [],
      [
        'No',
        'Hari / Tanggal',
        'Mode Kerja',
        'Lokasi / Geotag GPS',
        'RKH Terkait',
        'Jenis Kegiatan (Rencana Aksi)',
        'Tindak Lanjut',
        'Output',
        'Bukti Fisik',
        'Lampiran 1 (Foto Kegiatan)',
        'Lampiran 2 (Dokumen Utuh)'
      ]
    ];

    periodActivities.forEach((act, idx) => {
      const docNames =
        act.documents && act.documents.length > 0
          ? act.documents.map(d => `${d.fileName} (${d.fileType.toUpperCase()})`).join(' | ')
          : '-';
      const locText =
        act.locationName ||
        (act.workMode === 'WFO'
          ? 'SDN Ciketing Udik 2'
          : act.locationCoords
          ? `GPS: ${act.locationCoords.latitude.toFixed(5)}, ${act.locationCoords.longitude.toFixed(5)}`
          : 'WFA Fleksibel');
      rows.push([
        idx + 1,
        formatHariTanggalIndo(act.date),
        act.workMode || 'WFA',
        locText,
        act.rkhText || '-',
        act.rencanaAksiText,
        act.tindakLanjutList && act.tindakLanjutList.length > 0
          ? act.tindakLanjutList.join(' • ')
          : act.tindakLanjutText,
        resolveActivityOutput(act),
        resolveBuktiFisikType(act),
        `${(act.photos || []).length} Foto`,
        docNames
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `EKinerja_${activePeriod.month}_${activePeriod.year}`);
    XLSX.writeFile(wb, `E-Kinerja_Harian_${activePeriod.month}_${activePeriod.year}.xlsx`);
    showToast('File Excel E-Kinerja Harian berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Multi-Guru Switcher Bar (Tampil di semua tab termasuk Daftar Master RHK; Master RHK tetap sama untuk semua guru) */}
      <div className="glass rounded-3xl p-5 sm:p-6 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900/60 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25 shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Guru Pengisi Kinerja Aktif
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-semibold border border-cyan-500/30">
                  Master RHK Berlaku untuk Semua Guru
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-semibold border border-blue-500/30">
                  {teacherProfile.pangkatGolongan || 'PNS / ASN'}
                </span>
              </div>
              <h3 className="font-display font-extrabold text-lg sm:text-xl text-white mt-0.5">
                {teacherProfile.fullName}
              </h3>
              <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span>NIP: <strong className="text-white">{teacherProfile.nip || '-'}</strong></span>
                <span>•</span>
                <span>Satuan Pendidikan: <strong className="text-emerald-300 font-semibold">{teacherProfile.schoolName || 'SD Negeri'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-white/10 flex flex-col gap-1">
              <label htmlFor="guru-select-ekinerja" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Ganti Guru Pengisi:
              </label>
              <select
                id="guru-select-ekinerja"
                value={activeTeacherId}
                onChange={e => handleSwitchTeacher(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-emerald-500/40 text-white text-xs font-bold focus:ring-2 focus:ring-emerald-400 focus:outline-none cursor-pointer"
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
      </div>

      {/* Tab Navigasi Menu E-Kinerja */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveMainTab('harian')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMainTab === 'harian'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Pengisian Kinerja Harian</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('master_rhk')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMainTab === 'master_rhk'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-4 h-4 text-cyan-300" />
          <span>Data Master RHK</span>
          <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] text-emerald-300 border border-emerald-400/30">
            {masterRhkList.length} RHK
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('nota_dinas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeMainTab === 'nota_dinas'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-300" />
          <span>Instrumen &amp; Nota Dinas</span>
        </button>
      </div>

      {/* ========================================================================
          TAB 1: PENGISIAN & LAPORAN KINERJA HARIAN
         ======================================================================== */}
      {activeMainTab === 'harian' && (
        <div className="space-y-6">
          {/* Top Action Bar */}
          <div className="glass rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-white">
                E-Kinerja Harian Pegawai / Guru PAI
              </h2>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                Multi-RKH • Multi-Rencana Aksi • Output AI • Kompresi Foto Otomatis
              </span>
              {activePeriod?.savedAt && (
                <span className="px-2.5 py-0.5 rounded-md bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Tersimpan:{' '}
                  {new Date(activePeriod.savedAt).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Identitas pegawai otomatis, periode bulan & tahun terpisah, Tindak Lanjut & Output terpisah (Output dilengkapi fitur Isi Otomatis dengan AI), serta kompresi foto otomatis.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSaveEKinerjaReport}
            title="Simpan Laporan E-Kinerja Harian"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" /> Simpan Laporan
          </button>
          <button
            onClick={() => openAddDailyActivityModal()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Input Kegiatan Harian
          </button>
          <button
            onClick={() =>
              notaDinasSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            className="px-4 py-2.5 rounded-xl bg-blue-600/25 hover:bg-blue-600/35 border border-blue-400/40 text-blue-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
          >
            <FileText className="w-4 h-4 text-blue-300" /> Instrumen &amp; Cetak Nota Dinas
          </button>
          <button
            onClick={handlePrintEKinerjaNewTab}
            className="px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" /> Cetak E-Kinerja (Tab Baru)
            <ExternalLink className="w-3.5 h-3.5 opacity-75" />
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Excel
          </button>
        </div>
      </div>

      {/* ========================================================================
          BAGIAN PENGATURAN PERIODE & MASTER RKH, RENCANA AKSI, TINDAK LANJUT
         ======================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Panel Periode Bulan dan Tahun (Dibuat Terpisah) */}
        <div className="lg:col-span-4 glass rounded-3xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Periode E-Kinerja</h3>
                <p className="text-[11px] text-slate-400">Bulan & Tahun dibuat terpisah</p>
              </div>
            </div>
            <button
              onClick={() => setPeriodModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <FolderPlus className="w-3.5 h-3.5" /> + Tambah Periode
            </button>
          </div>

          {/* Daftar Periode Tersimpan */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
              Pilih Periode Aktif
            </label>
            {periods.length > 0 ? (
              <div className="flex items-center gap-2">
                <select
                  value={activePeriod?.id || ''}
                  onChange={e => setSelectedPeriodId(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  {periods.map(p => (
                    <option key={p.id} value={p.id}>
                      Bulan {p.month} — Tahun {p.year} {p.savedAt ? '✓ (Tersimpan)' : ''}
                    </option>
                  ))}
                </select>
                {periods.length > 1 && (
                  <button
                    onClick={handleDeleteCurrentPeriod}
                    title="Hapus Periode Ini"
                    className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                Belum ada periode. Silakan pilih Bulan & Tahun di bawah atau klik <b>+ Tambah Periode</b>.
              </div>
            )}
          </div>

          {/* Pemilih Bulan dan Tahun Terpisah */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                Periode Bulan
              </label>
              <select
                value={activePeriod ? activePeriod.month : newPeriodMonth}
                onChange={e => {
                  const val = e.target.value;
                  setNewPeriodMonth(val);
                  if (activePeriod) {
                    handleUpdatePeriodMonthYear(val, activePeriod.year);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                {MONTHS_LIST.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                Periode Tahun
              </label>
              <input
                type="number"
                min={2020}
                max={2040}
                value={activePeriod ? activePeriod.year : newPeriodYear}
                onChange={e => {
                  const val = e.target.value;
                  setNewPeriodYear(val);
                  if (activePeriod && val.length === 4) {
                    handleUpdatePeriodMonthYear(activePeriod.month, val);
                  }
                }}
                placeholder="2026"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-semibold font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Ringkasan Statistik Periode */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-base font-extrabold text-emerald-400">
                {activePeriod?.rkhList.length || 0}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">Total RKH</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-base font-extrabold text-cyan-400">
                {activePeriod?.rencanaAksiList.length || 0}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">Rencana Aksi</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-base font-extrabold text-amber-400">
                {periodActivities.length}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">Kegiatan Harian</div>
            </div>
          </div>
        </div>

        {/* Panel Master Input: Penentuan RKH, Rencana Aksi, dan Tindak Lanjut (Manual & Bisa Lebih dari 1) */}
        <div className="lg:col-span-8 glass rounded-3xl p-5 border border-white/10 space-y-5">
          <div className="border-b border-white/10 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Master Input RKH, Rencana Aksi, & Tindak Lanjut (Manual & Bisa Lebih dari 1)
              </h3>
              <p className="text-[11px] text-slate-400">
                Tambahkan 1 atau lebih RKH (muncul otomatis pada versi cetak), Rencana Aksi, dan Tindak Lanjut untuk digunakan pada pengisian tabel harian.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Penentuan RKH (Dropdown dari Data Master + Manual & > 1) */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                    Penentuan RKH
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMasterIdsToImport(masterRhkList.map(m => m.id));
                        setRhkImportModalOpen(true);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                      title="Pilih banyak sekaligus dari Data Master RHK"
                    >
                      <BookOpen className="w-3 h-3 text-cyan-400" />
                      Pilih Banyak
                    </button>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                      {activePeriod?.rkhList.length || 0} Item
                    </span>
                  </div>
                </div>

                {/* Dropdown RHK yang bersumber dari Data Master */}
                <div className="p-2.5 rounded-xl bg-slate-900/95 border border-emerald-500/30 space-y-2 shadow-sm">
                  <label className="text-[11px] font-bold text-emerald-300 block flex items-center justify-between">
                    <span>📋 Dropdown RHK dari Data Master:</span>
                    <span className="text-[10px] text-slate-400 font-normal">{masterRhkList.length} RHK tersedia</span>
                  </label>
                  <select
                    value={selectedMasterRhkDropdown}
                    onChange={e => handleSelectMasterRhkDropdown(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-white/20 text-white text-xs focus:outline-none focus:border-emerald-400"
                  >
                    <option value="">-- Pilih RHK dari Data Master --</option>
                    {masterRhkList.map(m => (
                      <option key={m.id} value={m.id}>
                        [{m.category}] {m.code}: {m.title.slice(0, 50)}...
                      </option>
                    ))}
                    <option value="__manual__">✍️ + Ketik RHK Manual Sendiri</option>
                  </select>

                  {selectedMasterRhkDropdown && selectedMasterRhkDropdown !== '__manual__' && (
                    <button
                      type="button"
                      onClick={handleApplySelectedMasterRhkToPeriod}
                      className="w-full py-2 px-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      + Tambahkan RHK Ini ke Periode
                    </button>
                  )}
                </div>

                {/* Form Input RKH Manual */}
                <form onSubmit={handleAddOrUpdateRkh} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newRkhTitle}
                    onChange={e => setNewRkhTitle(e.target.value)}
                    placeholder="Ketik Rencana Hasil Kerja (RKH) manual atau pilih dari dropdown di atas..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15 text-white text-xs focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {editingRkhId ? 'Simpan Edit RKH' : 'Tambah RKH Manual'}
                    </button>
                    {editingRkhId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRkhId(null);
                          setNewRkhTitle('');
                        }}
                        className="px-2.5 py-2 rounded-xl bg-white/10 text-slate-300 text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                  {(activePeriod?.rkhList || []).map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-xs flex items-start justify-between gap-2 group"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-emerald-400 mr-1.5">#{idx + 1}</span>
                        <span className="text-slate-200 break-words">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRkhId(item.id);
                            setNewRkhTitle(item.title);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300 cursor-pointer"
                          title="Edit RKH"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRkh(item.id)}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-rose-400 cursor-pointer"
                          title="Hapus RKH"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!activePeriod || activePeriod.rkhList.length === 0) && (
                    <p className="text-[11px] text-slate-500 italic text-center py-3">
                      Belum ada RKH. Pilih dari dropdown atau ketik manual di atas.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Rencana Aksi (Manual & Bantu dengan AI) */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">
                    Rencana Aksi
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={aiRaLoading}
                      onClick={handleGenerateAiRencanaAksi}
                      className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm disabled:opacity-50"
                      title="Bantu rumuskan Rencana Aksi dengan AI"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-300" />
                      {aiRaLoading ? 'Menyusun...' : 'Bantu AI'}
                    </button>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold">
                      {activePeriod?.rencanaAksiList.length || 0} Item
                    </span>
                  </div>
                </div>

                <form onSubmit={handleAddOrUpdateRencanaAksi} className="space-y-2">
                  {activePeriod && activePeriod.rkhList.length > 0 && (
                    <select
                      value={newRaRkhId}
                      onChange={e => setNewRaRkhId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-slate-300 text-[11px] focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Kaitkan ke RKH (Opsional) --</option>
                      {activePeriod.rkhList.map((r, i) => (
                        <option key={r.id} value={r.id}>
                          RKH {i + 1}: {r.title.slice(0, 45)}...
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Rekomendasi Chip AI untuk Rencana Aksi */}
                  {aiRaSuggestions.length > 0 && (
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 space-y-1.5">
                      <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Rekomendasi AI (Klik untuk Mengisi):
                      </span>
                      <div className="flex flex-col gap-1 max-h-28 overflow-y-auto scrollbar-thin">
                        {aiRaSuggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => setNewRaTitle(sug)}
                            className="text-left text-[11px] p-1.5 rounded-lg bg-slate-950/80 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-slate-200 hover:text-white transition-all cursor-pointer leading-snug"
                          >
                            ✨ {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={newRaTitle}
                    onChange={e => setNewRaTitle(e.target.value)}
                    placeholder="Ketik Rencana Aksi manual atau klik 'Bantu AI' di atas..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-500 resize-none"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {editingRaId ? 'Simpan Edit Aksi' : 'Tambah Rencana Aksi'}
                    </button>
                    {editingRaId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRaId(null);
                          setNewRaTitle('');
                        }}
                        className="px-2.5 py-2 rounded-xl bg-white/10 text-slate-300 text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                  {(activePeriod?.rencanaAksiList || []).map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-xs flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-cyan-400 mr-1.5">#{idx + 1}</span>
                        <span className="text-slate-200 break-words">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRaId(item.id);
                            setNewRaTitle(item.title);
                            setNewRaRkhId(item.rkhId || '');
                          }}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300 cursor-pointer"
                          title="Edit Rencana Aksi"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRencanaAksi(item.id)}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-rose-400 cursor-pointer"
                          title="Hapus Rencana Aksi"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!activePeriod || activePeriod.rencanaAksiList.length === 0) && (
                    <p className="text-[11px] text-slate-500 italic text-center py-3">
                      Belum ada Rencana Aksi. Ketik manual atau klik Bantu AI di atas.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tindak Lanjut (Manual & Bantu dengan AI, Dipisahkan dari Output) */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                    Tindak Lanjut
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={aiTlLoading}
                      onClick={handleGenerateAiTindakLanjut}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm disabled:opacity-50"
                      title="Bantu rumuskan Tindak Lanjut dengan AI"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      {aiTlLoading ? 'Menyusun...' : 'Bantu AI'}
                    </button>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold">
                      {activePeriod?.tindakLanjutList.length || 0} Item
                    </span>
                  </div>
                </div>

                <form onSubmit={handleAddOrUpdateTindakLanjut} className="space-y-2">
                  {/* Rekomendasi Chip AI untuk Tindak Lanjut */}
                  {aiTlSuggestions.length > 0 && (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Rekomendasi AI (Klik untuk Mengisi):
                      </span>
                      <div className="flex flex-col gap-1 max-h-28 overflow-y-auto scrollbar-thin">
                        {aiTlSuggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => setNewTlTitle(sug)}
                            className="text-left text-[11px] p-1.5 rounded-lg bg-slate-950/80 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 text-slate-200 hover:text-white transition-all cursor-pointer leading-snug"
                          >
                            ✨ {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={newTlTitle}
                    onChange={e => setNewTlTitle(e.target.value)}
                    placeholder="Ketik Tindak Lanjut manual atau klik 'Bantu AI' di atas..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {editingTlId ? 'Simpan Edit' : 'Tambah Tindak Lanjut'}
                    </button>
                    {editingTlId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTlId(null);
                          setNewTlTitle('');
                        }}
                        className="px-2.5 py-2 rounded-xl bg-white/10 text-slate-300 text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                  {(activePeriod?.tindakLanjutList || []).map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-xs flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-amber-400 mr-1.5">#{idx + 1}</span>
                        <span className="text-slate-200 break-words">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTlId(item.id);
                            setNewTlTitle(item.title);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300 cursor-pointer"
                          title="Edit Tindak Lanjut"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTindakLanjut(item.id)}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-rose-400 cursor-pointer"
                          title="Hapus Tindak Lanjut"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!activePeriod || activePeriod.tindakLanjutList.length === 0) && (
                    <p className="text-[11px] text-slate-500 italic text-center py-3">
                      Belum ada Tindak Lanjut. Ketik manual atau klik Bantu AI di atas.
                    </p>
                  )}
                </div>

                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-200 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>
                    <b>Output</b> dipisahkan dari Tindak Lanjut &amp; hanya diisi saat mengisi{' '}
                    <b>Kegiatan Harian</b> (tersedia opsi <b>Isi Otomatis dengan AI</b>).
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================
          LEMBAR UTAMA: IDENTITAS (POIN 1-5) DISUSUN VERTIKAL RAPI + TABEL E-KINERJA HARIAN DI BAWAHNYA
          (Catatan: Poin 6-8 tidak ditampilkan di blok vertikal ini, namun Poin 6 RKH muncul pada Versi Cetak)
         ======================================================================== */}
      <div className="glass rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl space-y-6">
        {/* BAGIAN ATAS: IDENTITAS PEGAWAI DISUSUN VERTIKAL DENGAN SUSUNAN RAPI (POIN 1-5) */}
        <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-white/10">
            <div>
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white uppercase tracking-wide">
                Identitas Pegawai & Ringkasan Periode E-Kinerja Harian
              </h3>
              <p className="text-[11px] text-slate-400">
                Terisi otomatis dari Profil Guru PAI (Poin 6 RKH ditampilkan otomatis pada Versi Cetak)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveEKinerjaReport}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Simpan Laporan E-Kinerja Periode Ini"
              >
                <Save className="w-3.5 h-3.5" /> Simpan Laporan
              </button>
              <button
                onClick={() => {
                  setEditProfileForm(StorageService.getTeacherProfile());
                  setIdentityModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" /> Sesuaikan Identitas Otomatis
              </button>
            </div>
          </div>

          {/* Susunan Vertikal Rapi (Hanya Poin 1 s/d 5 di layar menu; Poin 6 RKH muncul di Versi Cetak) */}
          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 py-1.5 border-b border-white/5">
              <div className="sm:col-span-3 font-bold text-slate-300 flex items-center justify-between">
                <span>1. Nama Pegawai</span>
                <span className="hidden sm:inline">:</span>
              </div>
              <div className="sm:col-span-9 font-extrabold text-white flex items-center gap-2">
                <span>{autoNamaPegawai}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold">
                  Otomatis
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 py-1.5 border-b border-white/5">
              <div className="sm:col-span-3 font-bold text-slate-300 flex items-center justify-between">
                <span>2. NIP</span>
                <span className="hidden sm:inline">:</span>
              </div>
              <div className="sm:col-span-9 font-mono font-semibold text-slate-100 flex items-center gap-2">
                <span>{autoNip}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-sans font-semibold">
                  Otomatis
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 py-1.5 border-b border-white/5">
              <div className="sm:col-span-3 font-bold text-slate-300 flex items-center justify-between">
                <span>3. Jabatan</span>
                <span className="hidden sm:inline">:</span>
              </div>
              <div className="sm:col-span-9 font-semibold text-slate-100 flex items-center gap-2">
                <span>{autoJabatan}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold">
                  Otomatis
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 py-1.5 border-b border-white/5">
              <div className="sm:col-span-3 font-bold text-slate-300 flex items-center justify-between">
                <span>4. Unit Kerja</span>
                <span className="hidden sm:inline">:</span>
              </div>
              <div className="sm:col-span-9 font-semibold text-slate-100 flex items-center gap-2">
                <span>{autoUnitKerja}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold">
                  Otomatis
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 py-1.5">
              <div className="sm:col-span-3 font-bold text-slate-300 flex items-center justify-between">
                <span>5. Periode Kinerja</span>
                <span className="hidden sm:inline">:</span>
              </div>
              <div className="sm:col-span-9 font-bold text-emerald-300 flex flex-wrap items-center gap-2">
                <span>
                  {activePeriod
                    ? `Bulan ${activePeriod.month} — Tahun ${activePeriod.year}`
                    : `Bulan ${newPeriodMonth} — Tahun ${newPeriodYear}`}
                </span>
                {activePeriod?.savedAt && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/15 border border-teal-500/30 text-teal-300 font-semibold">
                    Laporan Tersimpan
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN BAWAH: TABEL E-KINERJA HARIAN (#9 & #10) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-400" />
                Tabel Pelaksanaan E-Kinerja Harian
              </h4>
              <p className="text-xs text-slate-400">
                Kolom Tindak Lanjut dan Output terpisah. Dilengkapi Upload Foto (kompresi otomatis) &amp; Upload Dokumen (PDF/Word) yang otomatis menjadi Lampiran Bukti Fisik pada Versi Cetak.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleSaveEKinerjaReport}
                title="Simpan Laporan E-Kinerja Harian"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" /> Simpan Laporan
              </button>
              <button
                onClick={() => openAddDailyActivityModal()}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" /> + Tambah Kegiatan Harian
              </button>
            </div>
          </div>

          {/* Filter Mode Kerja (WFA / WFO / WFH) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Globe className="w-4 h-4 text-teal-400" /> Mode Kerja:
              </span>
              <button
                type="button"
                onClick={() => setWorkModeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  workModeFilter === 'all'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                Semua ({periodActivities.length})
              </button>
              <button
                type="button"
                onClick={() => setWorkModeFilter('WFA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  workModeFilter === 'WFA'
                    ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/30'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> WFA ({wfaCount})
              </button>
              <button
                type="button"
                onClick={() => setWorkModeFilter('WFO')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  workModeFilter === 'WFO'
                    ? 'bg-blue-600 text-white shadow-md font-extrabold'
                    : 'bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/30'
                }`}
              >
                <Building className="w-3.5 h-3.5" /> WFO ({wfoCount})
              </button>
              <button
                type="button"
                onClick={() => setWorkModeFilter('WFH')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  workModeFilter === 'WFH'
                    ? 'bg-purple-600 text-white shadow-md font-extrabold'
                    : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30'
                }`}
              >
                <Home className="w-3.5 h-3.5" /> WFH ({wfhCount})
              </button>
            </div>
            <div className="text-[11px] text-slate-400">
              Menampilkan <span className="font-bold text-white">{displayedActivities.length}</span> kegiatan
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/15 bg-slate-950/60">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-white/15 text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                  <th className="py-3.5 px-3 w-12 text-center border-r border-white/10">No</th>
                  <th className="py-3.5 px-4 w-52 border-r border-white/10">Hari / Tanggal</th>
                  <th className="py-3.5 px-4 border-r border-white/10">
                    Jenis Kegiatan (Rencana Aksi)
                  </th>
                  <th className="py-3.5 px-4 border-r border-white/10">
                    Tindak Lanjut
                  </th>
                  <th className="py-3.5 px-4 border-r border-white/10">
                    Output
                  </th>
                  <th className="py-3.5 px-4 w-76 border-r border-white/10 text-center">
                    Bukti Fisik
                  </th>
                  <th className="py-3.5 px-3 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
                {displayedActivities.length > 0 ? (
                  displayedActivities.map((act, index) => {
                    const sameDateCount = displayedActivities.filter(
                      a => a.date === act.date
                    ).length;
                    const sameDateIndex =
                      displayedActivities
                        .filter(a => a.date === act.date)
                        .findIndex(a => a.id === act.id) + 1;

                    const tlItems =
                      act.tindakLanjutList && act.tindakLanjutList.length > 0
                        ? act.tindakLanjutList
                        : act.tindakLanjutText
                        ? [act.tindakLanjutText]
                        : [];

                    const resolvedOutput = resolveActivityOutput(act);
                    const selectedBuktiType = resolveBuktiFisikType(act);

                    return (
                      <tr
                        key={act.id}
                        className="hover:bg-white/[0.02] transition-colors align-top"
                      >
                        {/* Kolom 1: Nomor */}
                        <td className="py-4 px-3 text-center font-bold text-slate-300 border-r border-white/10">
                          {index + 1}
                        </td>

                        {/* Kolom 2: Hari / Tanggal + Mode WFA / WFO / WFH */}
                        <td className="py-4 px-4 border-r border-white/10">
                          <div className="font-bold text-white">
                            {formatHariTanggalIndo(act.date)}
                          </div>
                          {/* Badge Mode Kerja (WFA / WFO / WFH) */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {(act.workMode || 'WFA') === 'WFA' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[10px] font-bold">
                                <Globe className="w-3 h-3 text-teal-400" /> WFA
                              </span>
                            ) : act.workMode === 'WFO' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-bold">
                                <Building className="w-3 h-3 text-blue-400" /> WFO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
                                <Home className="w-3 h-3 text-purple-400" /> WFH
                              </span>
                            )}

                            {act.locationName && (
                              <span className="text-[10px] text-slate-300 truncate max-w-[140px]" title={act.locationName}>
                                {act.locationName}
                              </span>
                            )}
                          </div>

                          {act.locationCoords && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-teal-400/90 font-mono">
                              <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
                              <span>{act.locationCoords.latitude.toFixed(4)}, {act.locationCoords.longitude.toFixed(4)}</span>
                            </div>
                          )}

                          {sameDateCount > 1 && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                              Kegiatan ke-{sameDateIndex} dari {sameDateCount} di hari ini
                            </span>
                          )}
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => openAddDailyActivityModal(act.date)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="Tambah kegiatan (Rencana Aksi) lain pada tanggal ini"
                            >
                              <Plus className="w-3 h-3" /> + Kegiatan di Hari Ini
                            </button>
                          </div>
                        </td>

                        {/* Kolom 3: Jenis Kegiatan (Rencana Aksi yang sudah dibuat) */}
                        <td className="py-4 px-4 border-r border-white/10">
                          <div className="font-semibold text-slate-100 leading-relaxed">
                            {act.rencanaAksiText}
                          </div>
                          {act.rkhText && (
                            <div className="mt-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                              <span className="font-bold">RKH:</span> {act.rkhText}
                            </div>
                          )}
                        </td>

                        {/* Kolom 4: Tindak Lanjut (Terpisah dari Output) */}
                        <td className="py-4 px-4 border-r border-white/10">
                          {tlItems.length > 1 ? (
                            <ul className="list-disc list-inside space-y-1 text-slate-200">
                              {tlItems.map((tl, idx) => (
                                <li key={idx} className="leading-relaxed">
                                  {tl}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-slate-200 leading-relaxed">
                              {tlItems[0] || '-'}
                            </div>
                          )}
                        </td>

                        {/* Kolom 5: Output (Terpisah dari Tindak Lanjut) */}
                        <td className="py-4 px-4 border-r border-white/10">
                          <div className="text-slate-100 leading-relaxed font-medium">
                            {resolvedOutput}
                          </div>
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-semibold">
                            <Sparkles className="w-2.5 h-2.5" /> Output Kegiatan Harian
                          </span>
                        </td>

                        {/* Kolom 6: Bukti Fisik (Dropdown: Foto Kegiatan / Dokumen / Foto Kegiatan dan Dokumen) + Lampiran 1 & 2 */}
                        <td className="py-4 px-4 border-r border-white/10">
                          <div className="flex flex-col items-center gap-3">
                            {/* Dropdown Pilihan Bukti Fisik */}
                            <div className="w-full space-y-1">
                              <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 block text-left">
                                Pilih Bukti Fisik:
                              </label>
                              <select
                                value={selectedBuktiType}
                                onChange={e =>
                                  handleChangeActivityBuktiFisikType(
                                    act,
                                    e.target.value as EKinerjaBuktiFisikType
                                  )
                                }
                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-white text-xs font-bold focus:outline-none focus:border-emerald-400 cursor-pointer"
                              >
                                {BUKTI_FISIK_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Lampiran 1: Foto Kegiatan (Diperbesar • 2 Foto per Halaman) */}
                            <div className="w-full pt-2 border-t border-white/10 flex flex-col items-center gap-2">
                              <div className="w-full flex items-center justify-between text-[10px]">
                                <span className="font-extrabold text-cyan-300 uppercase">
                                  Lampiran 1: Foto Kegiatan
                                </span>
                                <span className="text-slate-400">2 Foto Besar/Hal</span>
                              </div>

                              {act.photos && act.photos.length > 0 ? (
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                  {act.photos.map((pho, pIdx) => (
                                    <div
                                      key={pho.id}
                                      className="relative group w-16 h-16 rounded-xl overflow-hidden border border-white/20 bg-slate-900 shadow"
                                    >
                                      <img
                                        src={pho.dataUrl}
                                        alt={pho.caption || 'Foto Kegiatan'}
                                        onClick={() =>
                                          setPreviewPhotosModal({
                                            title: act.rencanaAksiText,
                                            dateLabel: formatHariTanggalIndo(act.date),
                                            photos: act.photos,
                                            activeIndex: pIdx
                                          })
                                        }
                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                      />
                                      {pho.compressedSizeKb && (
                                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-emerald-300 text-center font-mono py-0.5 pointer-events-none">
                                          {pho.compressedSizeKb} KB
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleRemovePhotoFromActivity(act, pho.id)}
                                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        title="Hapus Foto"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10.5px] text-slate-500 italic">
                                  Belum ada foto (Lampiran 1)
                                </span>
                              )}

                              <label className="w-full justify-center px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                                <Camera className="w-3.5 h-3.5" />
                                <span>
                                  {act.photos && act.photos.length > 0
                                    ? `+ Foto Lampiran 1 (${act.photos.length})`
                                    : 'Upload Foto (Lampiran 1)'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={e => handleDirectUploadPhotosToActivity(act, e)}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {/* Lampiran 2: Dokumen Utuh (PDF / Word) */}
                            <div className="w-full pt-2 border-t border-white/10 flex flex-col items-center gap-2">
                              <div className="w-full flex items-center justify-between text-[10px]">
                                <span className="font-extrabold text-amber-300 uppercase">
                                  Lampiran 2: Dokumen Utuh
                                </span>
                                <span className="text-slate-400">PDF / Word</span>
                              </div>

                              {act.documents && act.documents.length > 0 ? (
                                <div className="w-full space-y-1.5">
                                  {act.documents.map(docItem => (
                                    <div
                                      key={docItem.id}
                                      className="p-2 rounded-xl bg-slate-900/90 border border-white/15 flex items-center justify-between gap-2 text-left"
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreviewDocumentModal({
                                            activityTitle: act.rencanaAksiText,
                                            dateLabel: formatHariTanggalIndo(act.date),
                                            doc: docItem
                                          })
                                        }
                                        className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group"
                                        title="Klik untuk lihat / unduh dokumen bukti fisik"
                                      >
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                                            docItem.fileType === 'pdf'
                                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                          }`}
                                        >
                                          {docItem.fileType === 'pdf' ? 'PDF' : 'WORD'}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <div className="text-[11px] font-semibold text-slate-200 group-hover:text-amber-300 truncate">
                                            {docItem.fileName}
                                          </div>
                                          <div className="text-[9.5px] text-slate-400 font-mono">
                                            {docItem.fileSizeKb} KB • Lampiran 2 Utuh
                                          </div>
                                        </div>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveDocumentFromActivity(act, docItem.id)
                                        }
                                        className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 shrink-0 cursor-pointer"
                                        title="Hapus Dokumen"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10.5px] text-slate-500 italic">
                                  Belum ada dokumen (Lampiran 2)
                                </span>
                              )}

                              <label className="w-full justify-center px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>
                                  {act.documents && act.documents.length > 0
                                    ? `+ Dokumen Lampiran 2 (${act.documents.length})`
                                    : 'Upload Dokumen (Lampiran 2)'}
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                  multiple
                                  onChange={e => handleDirectUploadDocumentsToActivity(act, e)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </td>

                        {/* Kolom 7: Aksi */}
                        <td className="py-4 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditDailyActivityModal(act)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 text-slate-300 hover:text-cyan-300 cursor-pointer transition-all"
                              title="Edit Kegiatan & Output"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteActivityConfirmId(act.id)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-slate-300 hover:text-rose-300 cursor-pointer transition-all"
                              title="Hapus Kegiatan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                          <ClipboardCheck className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-white">
                          Belum Ada Catatan Kegiatan E-Kinerja Harian pada Periode Ini
                        </p>
                        <p className="text-xs text-slate-400">
                          Klik tombol <b>+ Tambah Kegiatan Harian</b> untuk memilih tanggal, memilih Rencana Aksi, Tindak Lanjut, mengisi <b>Output (bisa Isi Otomatis dengan AI)</b>, serta mengunggah foto kegiatan dan dokumen bukti fisik (PDF/Word).
                        </p>
                        <button
                          onClick={() => openAddDailyActivityModal()}
                          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Isi Kegiatan Harian Sekarang
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Bar Simpan & Cetak Laporan */}
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {activePeriod?.savedAt ? (
                  <>
                    Laporan Periode <b>Bulan {activePeriod.month} Tahun {activePeriod.year}</b> terakhir disimpan pada{' '}
                    <b className="text-emerald-300">
                      {new Date(activePeriod.savedAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </b>
                    .
                  </>
                ) : (
                  <>
                    Klik tombol <b>Simpan Laporan</b> untuk menyimpan laporan E-Kinerja periode{' '}
                    <b>
                      {activePeriod ? `${activePeriod.month} ${activePeriod.year}` : `${newPeriodMonth} ${newPeriodYear}`}
                    </b>
                    .
                  </>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveEKinerjaReport}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" /> Simpan Laporan E-Kinerja
              </button>
              <button
                type="button"
                onClick={handlePrintNotaDinasNewTab}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" /> Cetak Nota Dinas
              </button>
              <button
                type="button"
                onClick={handlePrintEKinerjaNewTab}
                className="px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" /> Cetak E-Kinerja &amp; Lampiran Bukti Fisik (Tab Baru)
              </button>
            </div>
          </div>
        </div>
        </div>
        </div>
      )}

      {/* ========================================================================
          TAB 2: DAFTAR MASTER RHK, RENCANA AKSI & TINDAK LANJUT (BANK MASTER)
         ======================================================================== */}
      {/* ========================================================================
          TAB 2: DAFTAR MASTER RHK (DATA MASTER RHK MURNI MANUAL)
         ======================================================================== */}
      {activeMainTab === 'master_rhk' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Panel Data Master RHK */}
          <div className="glass rounded-3xl p-5 sm:p-6 border border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-cyan-950/20 to-slate-900/90 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display font-extrabold text-lg sm:text-xl text-white">
                      Data Master RHK (Rencana Hasil Kerja)
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold">
                      Katalog Standar Acuan
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                    Daftar Rencana Hasil Kerja (RHK) acuan yang diisi dan dikelola secara manual. Butir RHK pada data master ini otomatis muncul pada dropdown saat guru menyusun kinerja bulanan.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenCreateMasterModal()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" /> Tambah RHK Baru
                </button>
                <button
                  type="button"
                  onClick={handleImportAllMasterToActivePeriod}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                  title="Terapkan semua RHK di katalog ini ke periode aktif saat ini"
                >
                  <Download className="w-4 h-4" /> Terapkan ke Periode Aktif
                </button>
                <button
                  type="button"
                  onClick={handleResetMasterRhkToStandard}
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Pulihkan seluruh RHK bawaan ke Standar Nasional PermenPAN-RB"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" /> Pulihkan Standar
                </button>
              </div>
            </div>

            {/* Statistik Ringkas Data Master RHK (Tanpa Nama Guru) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-4 border-t border-white/10 text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Master RHK</span>
                <span className="text-lg font-extrabold text-white mt-0.5 block">{masterRhkList.length} RHK</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] text-emerald-400 uppercase font-bold block">Kategori Utama</span>
                <span className="text-lg font-extrabold text-emerald-400 mt-0.5 block">
                  {masterRhkList.filter(m => m.category === 'Utama').length} RHK
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] text-indigo-400 uppercase font-bold block">Kategori Tambahan</span>
                <span className="text-lg font-extrabold text-indigo-300 mt-0.5 block">
                  {masterRhkList.filter(m => m.category === 'Tambahan').length} RHK
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] text-cyan-400 uppercase font-bold block">Status Acuan</span>
                <span className="text-lg font-extrabold text-cyan-300 mt-0.5 block">
                  Standar &amp; Mandiri
                </span>
              </div>
            </div>
          </div>

          {/* Bar Filter & Pencarian (Tanpa Filter Guru) */}
          <div className="glass rounded-3xl p-4 sm:p-5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={masterSearchQuery}
                onChange={e => setMasterSearchQuery(e.target.value)}
                placeholder="Cari RHK, Rencana Aksi, atau Tindak Lanjut..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-cyan-400" /> Kategori:
              </span>
              {(['all', 'Utama', 'Tambahan'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMasterFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    masterFilterCategory === cat
                      ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {cat === 'all' ? 'Semua' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Daftar Kartu Master RHK (Bebas dari Nama Guru) */}
          <div className="space-y-4">
            {filteredMasterRhk.map((item, idx) => {
              return (
                <div
                  key={item.id}
                  className="glass rounded-3xl p-5 sm:p-6 border border-white/10 hover:border-white/20 transition-all space-y-4 shadow-xl"
                >
                  {/* Header Bar Kartu RHK */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-xl bg-black/40 text-cyan-300 border border-white/15 shadow-inner">
                        {item.code || `RHK ${idx + 1}`}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                          item.category === 'Utama'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        Kategori {item.category}
                      </span>
                      {item.aspek && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                          Aspek: {item.aspek}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleImportSingleMasterToActivePeriod(item.id)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                        title="Terapkan RHK ini ke Periode E-Kinerja Aktif"
                      >
                        <Download className="w-3.5 h-3.5" /> Terapkan ke Periode
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateMasterModal(item)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                        title="Edit RHK ini"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMasterItem(item.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        title="Hapus RHK ini dari Data Master"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Judul RHK */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
                      {item.indikator && (
                        <span>
                          Indikator Kinerja: <strong className="text-slate-300">{item.indikator}</strong>
                        </span>
                      )}
                      {item.target && (
                        <span>
                          Target: <strong className="text-emerald-300">{item.target}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Daftar Rencana Aksi */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" /> Daftar Rencana Aksi ({item.rencanaAksiList.length} Item)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {item.rencanaAksiList.map((ra, raIdx) => (
                        <div
                          key={ra.id}
                          className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white">
                              <span className="text-cyan-400 font-bold mr-1.5">#{raIdx + 1}</span>
                              {ra.title}
                            </p>
                            {ra.defaultOutput && (
                              <p className="text-[11px] text-slate-400">
                                Output Standar: <span className="text-slate-300">{ra.defaultOutput}</span>
                              </p>
                            )}
                            {ra.defaultTindakLanjut && ra.defaultTindakLanjut.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {ra.defaultTindakLanjut.map((tl, tlIdx) => (
                                  <span
                                    key={tlIdx}
                                    className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[10px] border border-amber-500/20"
                                  >
                                    TL: {tl}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCreateActivityFromMaster(item, ra)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" /> Input Kinerja dari Aksi Ini
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Template Tindak Lanjut RHK */}
                  {item.tindakLanjutTemplates.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Template Rekomendasi Tindak Lanjut ({item.tindakLanjutTemplates.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                        {item.tindakLanjutTemplates.map((tl, tlIdx) => (
                          <div
                            key={tlIdx}
                            className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2"
                          >
                            <span className="text-amber-400 font-bold shrink-0">•</span>
                            <span className="text-[11px] leading-relaxed">{tl}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredMasterRhk.length === 0 && (
              <div className="glass rounded-3xl p-12 text-center text-slate-400 space-y-3 border border-white/10">
                <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">Tidak Ada Master RHK</h4>
                <p className="text-xs max-w-sm mx-auto">
                  Belum ada RHK yang sesuai dengan pencarian atau filter Anda. Klik tombol <b>+ Tambah RHK Baru</b> atau <b>Pulihkan Standar</b>.
                </p>
                <button
                  type="button"
                  onClick={handleResetMasterRhkToStandard}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold cursor-pointer"
                >
                  Pulihkan Standar Nasional
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
          TAB 3: INSTRUMEN NOTA DINAS & PRATINJAU DOKUMEN (N O T A - D I N A S) + MENU UPLOAD GAMBAR TTD
         ======================================================================== */}
      {activeMainTab === 'nota_dinas' && (
        <div
          ref={notaDinasSectionRef}
          className="rounded-3xl bg-[#eef2f6] text-slate-800 p-4 sm:p-6 border border-slate-300 shadow-2xl space-y-4"
        >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-300 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-700 text-white text-[11px] font-extrabold uppercase tracking-wider">
                NOTA DINAS E-KINERJA
              </span>
              <h3 className="font-display font-extrabold text-base sm:text-lg text-slate-900">
                Instrumen &amp; Cetak Nota Dinas Laporan Pelaksanaan Tupoksi
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Format sesuai standar Nota Dinas beserta Daftar Aspek &amp; Link Bukti Fisik dan Menu Upload Gambar TTD (Tanda Tangan).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => persistNotaDinasConfig(notaDinasForm, true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" /> Simpan Nota Dinas
            </button>
            <button
              type="button"
              onClick={handlePrintNotaDinasNewTab}
              className="px-4 py-2 rounded-xl bg-[#0b5ed7] hover:bg-[#0a53be] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Printer className="w-4 h-4" /> 🖨️ Cetak Nota Dinas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI: INSTRUMEN NOTA DINAS */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-200 space-y-4">
            <div className="border-b-2 border-[#0b5ed7] pb-2.5">
              <h4 className="font-extrabold text-base sm:text-lg text-[#0b5ed7]">
                Instrumen Nota Dinas
              </h4>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kepada Yth
                </label>
                <input
                  type="text"
                  value={notaDinasForm.kepadaYth}
                  onChange={e => handleUpdateNotaDinasField('kepadaYth', e.target.value)}
                  placeholder="Kepala SD Negeri Ciketing Udik 2"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Dari (Nama Pegawai)
                  </label>
                  <input
                    type="text"
                    value={notaDinasForm.dari}
                    onChange={e => handleUpdateNotaDinasField('dari', e.target.value)}
                    placeholder="Suhendri"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    NIP Penandatangan
                  </label>
                  <input
                    type="text"
                    value={notaDinasForm.nip}
                    onChange={e => handleUpdateNotaDinasField('nip', e.target.value)}
                    placeholder="198001122024211002"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nomor
                </label>
                <input
                  type="text"
                  value={notaDinasForm.nomorSurat}
                  onChange={e => handleUpdateNotaDinasField('nomorSurat', e.target.value)}
                  placeholder="421.2/     -SD/2026"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tanggal Surat
                  </label>
                  <input
                    type="date"
                    value={notaDinasForm.tanggalSurat}
                    onChange={e => handleUpdateNotaDinasField('tanggalSurat', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Periode Bulan &amp; Tahun
                  </label>
                  <input
                    type="text"
                    value={
                      notaDinasForm.periodeText ??
                      `${activePeriod?.month || 'Oktober'} ${activePeriod?.year || '2026'}`
                    }
                    onChange={e => handleUpdateNotaDinasField('periodeText', e.target.value)}
                    placeholder="Oktober 2026"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lampiran
                </label>
                <input
                  type="text"
                  value={notaDinasForm.lampiran}
                  onChange={e => handleUpdateNotaDinasField('lampiran', e.target.value)}
                  placeholder="1 (Satu) Berkas"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Singkatan Jabatan/Mapel (Untuk perihal)
                </label>
                <input
                  type="text"
                  value={notaDinasForm.singkatanJabatan}
                  onChange={e => handleUpdateNotaDinasField('singkatanJabatan', e.target.value)}
                  placeholder="Guru PAI"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Jabatan Lengkap (Untuk isi kalimat)
                </label>
                <input
                  type="text"
                  value={notaDinasForm.jabatanLengkap}
                  onChange={e => handleUpdateNotaDinasField('jabatanLengkap', e.target.value)}
                  placeholder="Guru Pendidikan Agama Islam dan Budi Pekerti"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* DAFTAR ASPEK & BUKTI FISIK */}
              <div className="p-3.5 rounded-xl bg-[#f0f7ff] border border-blue-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#0b5ed7]">
                    Daftar Aspek &amp; Bukti Fisik
                  </span>
                  {activePeriod && activePeriod.rkhList.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSyncNotaDinasAspectsFromRkh}
                      className="px-2.5 py-1 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-bold cursor-pointer transition-all"
                      title="Muat seluruh butir RKH periode ini menjadi daftar aspek"
                    >
                      ↻ Muat Semua RKH ({activePeriod.rkhList.length})
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {notaDinasForm.aspects.map((item, idx) => {
                    const rkhOptions = activePeriod?.rkhList || [];
                    const hasMatchingRkh = rkhOptions.some(r => r.title === item.aspekText);
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-white border border-slate-200 border-l-4 border-l-[#0b5ed7] space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">
                            Aspek Ke-{idx + 1}
                          </span>
                          {notaDinasForm.aspects.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteNotaDinasAspect(item.id)}
                              className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Hapus
                            </button>
                          )}
                        </div>

                        {/* 1. Dropdown Data dari RKH yang dibuat di E-Kinerja */}
                        <select
                          value={item.aspekText}
                          onChange={e =>
                            handleUpdateNotaDinasAspect(item.id, 'aspekText', e.target.value)
                          }
                          className="w-full px-2.5 py-2 rounded-md bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600 cursor-pointer"
                        >
                          <option value="">
                            -- Pilih Aspek dari Data RKH E-Kinerja --
                          </option>
                          {rkhOptions.map((rkh, rIdx) => (
                            <option key={rkh.id} value={rkh.title}>
                              {rIdx + 1}. {rkh.title}
                            </option>
                          ))}
                          {!hasMatchingRkh && item.aspekText && (
                            <option value={item.aspekText}>
                              {item.aspekText}
                            </option>
                          )}
                        </select>

                        {/* 2. Input Manual Link Penyimpanan Bukti Fisik */}
                        <div className="relative">
                          <input
                            type="text"
                            value={item.buktiFisikUrl}
                            onChange={e =>
                              handleUpdateNotaDinasAspect(item.id, 'buktiFisikUrl', e.target.value)
                            }
                            placeholder="Tempel Link Penyimpanan Bukti Fisik (Google Drive, dll)..."
                            className="w-full px-2.5 py-2 rounded-md bg-slate-50 border border-slate-300 text-slate-700 text-xs focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddNotaDinasAspect}
                  className="w-full py-2 px-3 rounded-lg border border-dashed border-emerald-600 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> + Tambah Aspek &amp; Bukti Fisik Lainnya
                </button>
              </div>

              {/* MENU UPLOAD GAMBAR TTD GURU & KEPALA SEKOLAH */}
              <div className="space-y-3">
                {/* Upload TTD Guru */}
                <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-extrabold text-amber-900 block flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" /> TTD Guru (Pegawai yang Dinilai)
                      </label>
                      <p className="text-[11px] text-amber-800">
                        {notaDinasForm.dari || teacherProfile.fullName}
                      </p>
                    </div>
                    <label className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{notaDinasForm.signatureDataUrl || teacherProfile.signatureDataUrl ? 'Ganti TTD' : 'Upload TTD'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          handleUploadSignatureTtd(e.target.files);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {notaDinasForm.signatureDataUrl || teacherProfile.signatureDataUrl ? (
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white border border-amber-200">
                      <div className="flex items-center gap-3">
                        <div className="h-14 px-3 py-1 rounded border border-slate-200 bg-slate-50 flex items-center justify-center">
                          <img
                            src={notaDinasForm.signatureDataUrl || teacherProfile.signatureDataUrl}
                            alt="Pratinjau TTD Guru"
                            className="max-h-12 max-w-[140px] object-contain"
                          />
                        </div>
                        <div className="text-xs">
                          <div className="font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> TTD Guru Aktif
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Tampil pada Nota Dinas &amp; Berkas Cetak
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveSignatureTtd}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-white/80 border border-dashed border-amber-300 text-center text-[11px] text-slate-500">
                      Belum ada gambar tanda tangan guru. Klik <b>Upload TTD</b> (PNG/JPG).
                    </div>
                  )}
                </div>

                {/* Informasi Format Tanda Tangan */}
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-slate-700 text-xs flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-blue-900">Format Laporan Mandiri Guru</div>
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Sesuai tata kelola administrasi kinerja, dokumen dicetak dengan tanda tangan tunggal guru/pegawai yang bersangkutan di sebelah kanan bawah (tanpa kolom tanda tangan kepala sekolah).
                    </div>
                  </div>
                </div>
              </div>

              {/* TOMBOL CETAK NOTA DINAS */}
              <button
                type="button"
                onClick={handlePrintNotaDinasNewTab}
                className="w-full py-3 px-4 rounded-xl bg-[#0b5ed7] hover:bg-[#0a53be] text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" /> 🖨️ Cetak Nota Dinas
              </button>
            </div>
          </div>

          {/* KOLOM KANAN: PRATINJAU DOKUMEN NOTA DINAS */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="text-center text-xs font-extrabold uppercase tracking-widest text-slate-500">
              PRATINJAU DOKUMEN
            </div>

            <div
              className="bg-white rounded-xl shadow-xl border border-slate-300 p-6 sm:p-12 text-slate-900 mx-auto"
              style={{ fontFamily: "'Times New Roman', Times, serif", lineHeight: 1.55 }}
            >
              {/* Judul N O T A - D I N A S */}
              <div className="text-center font-bold text-base sm:text-lg tracking-[0.28em] mb-6 uppercase">
                N O T A - D I N A S
              </div>

              {/* Tabel Kepala Nota Dinas */}
              <table className="w-full text-xs sm:text-[15px] mb-3 border-collapse">
                <tbody>
                  <tr>
                    <td className="py-0.5 w-28 sm:w-32 align-top">Kepada Yth</td>
                    <td className="py-0.5 w-4 text-center align-top">:</td>
                    <td className="py-0.5 align-top">{notaDinasForm.kepadaYth || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">Dari</td>
                    <td className="py-0.5 text-center align-top">:</td>
                    <td className="py-0.5 align-top">{notaDinasForm.dari || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">Nomor</td>
                    <td className="py-0.5 text-center align-top">:</td>
                    <td className="py-0.5 align-top">{notaDinasForm.nomorSurat || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">Tanggal</td>
                    <td className="py-0.5 text-center align-top">:</td>
                    <td className="py-0.5 align-top">
                      {formatTanggalSuratIndo(notaDinasForm.tanggalSurat)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">Lampiran</td>
                    <td className="py-0.5 text-center align-top">:</td>
                    <td className="py-0.5 align-top">{notaDinasForm.lampiran || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">Hal</td>
                    <td className="py-0.5 text-center align-top">:</td>
                    <td className="py-0.5 align-top text-justify">
                      Laporan Pelaksanaan Tugas Pokok dan Fungsi{' '}
                      <span className="font-bold text-[#d93025]">
                        {notaDinasForm.singkatanJabatan || 'Guru PAI'}
                      </span>{' '}
                      Periode Bulan{' '}
                      <span className="font-bold text-[#d93025]">
                        {notaDinasForm.periodeText && notaDinasForm.periodeText.trim()
                          ? notaDinasForm.periodeText.trim()
                          : `${activePeriod?.month || 'Oktober'} ${activePeriod?.year || '2026'}`}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <hr className="border-t-2 border-slate-900 my-4" />

              {/* Paragraf Pembuka */}
              <p
                className="text-xs sm:text-[15px] text-justify mb-3.5"
                style={{ textIndent: '36px' }}
              >
                Berdasarkan tugas Pokok dan Fungsi dari{' '}
                <span className="font-bold">
                  {notaDinasForm.jabatanLengkap ||
                    'Guru Pendidikan Agama Islam dan Budi Pekerti'}
                </span>{' '}
                untuk Mencapai Tujuan Organisasi, Bersama ini disampaikan laporan hasil
                pelaksanaan kegiatan dimaksud meliputi aspek-aspek sebagai berikut :
              </p>

              {/* Daftar Nomor Aspek */}
              <div className="space-y-1.5 mb-4 pl-1 text-xs sm:text-[15px]">
                {notaDinasForm.aspects.map((item, idx) => {
                  const text =
                    item.aspekText.trim() ||
                    'Terlaksananya pembelajaran/pembimbingan dalam mewujudkan pembelajaran yang bermutu untuk semua';
                  const hasUrl = Boolean(item.buktiFisikUrl && item.buktiFisikUrl.trim());
                  return (
                    <div key={item.id} className="flex items-start gap-2 font-bold text-[#d93025]">
                      <span className="shrink-0 w-5">{idx + 1}.</span>
                      <div className="flex-1 text-justify">
                        {hasUrl ? (
                          <a
                            href={item.buktiFisikUrl.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-[#d93025]/60 hover:text-red-700 inline-flex items-center gap-1"
                            title={`Buka Link Bukti Fisik: ${item.buktiFisikUrl}`}
                          >
                            <span>{text}</span>
                            <Link2 className="w-3.5 h-3.5 inline shrink-0" />
                          </a>
                        ) : (
                          <span>{text}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paragraf Penutup */}
              <p
                className="text-xs sm:text-[15px] text-justify mb-8"
                style={{ textIndent: '36px' }}
              >
                Demikian Laporan Pelaksanaan Tugas Pokok dan Fungsi{' '}
                <span className="font-bold text-[#d93025]">
                  {notaDinasForm.singkatanJabatan || 'Guru PAI'}
                </span>{' '}
                Periode Bulan{' '}
                <span className="font-bold text-[#d93025]">
                  {notaDinasForm.periodeText && notaDinasForm.periodeText.trim()
                    ? notaDinasForm.periodeText.trim()
                    : `${activePeriod?.month || 'Oktober'} ${activePeriod?.year || '2026'}`}
                </span>{' '}
                ini dibuat dan mohon arahan lebih lanjut.
              </p>

              {/* Blok Tanda Tangan: Guru / Pegawai */}
              <div className="flex justify-end mt-8 pt-4">
                <div className="text-left text-xs sm:text-[15px] w-64">
                  <div className="font-bold mb-1">
                    {notaDinasForm.jabatanLengkap ||
                      'Guru Pendidikan Agama Islam dan Budi Pekerti'}
                  </div>

                  <div className="min-h-[76px] py-1 flex items-center justify-start">
                    {notaDinasForm.signatureDataUrl || teacherProfile.signatureDataUrl || DEFAULT_TEACHER_SIGNATURE ? (
                      <img
                        src={notaDinasForm.signatureDataUrl || teacherProfile.signatureDataUrl || DEFAULT_TEACHER_SIGNATURE}
                        alt="Tanda Tangan Guru"
                        className="max-h-20 max-w-[200px] object-contain"
                      />
                    ) : (
                      <div className="h-16" />
                    )}
                  </div>

                  <div className="font-bold underline uppercase">
                    {(notaDinasForm.dari || autoNamaPegawai || teacherProfile.fullName || 'GURU').toUpperCase()}
                  </div>
                  <div>NIP. {notaDinasForm.nip || autoNip || teacherProfile.nip || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ========================================================================
          MODAL TAMBAH PERIODE BARU (BULAN & TAHUN TERPISAH)
         ======================================================================== */}
      {periodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl max-w-md w-full p-6 border border-white/15 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-400" />
                Tambah Periode E-Kinerja Baru
              </h3>
              <button
                onClick={() => setPeriodModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPeriod} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Pilih Bulan
                  </label>
                  <select
                    value={newPeriodMonth}
                    onChange={e => setNewPeriodMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    {MONTHS_LIST.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Pilih / Ketik Tahun
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2040}
                    value={newPeriodYear}
                    onChange={e => setNewPeriodYear(e.target.value)}
                    list="ekinerja-years-datalist"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <datalist id="ekinerja-years-datalist">
                    {YEARS_LIST.map(y => (
                      <option key={y} value={y} />
                    ))}
                  </datalist>
                </div>
              </div>

              {activePeriod && (
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyMasterFromCurrent}
                    onChange={e => setCopyMasterFromCurrent(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span>
                    Salin daftar RKH, Rencana Aksi, dan Tindak Lanjut dari periode{' '}
                    <b>
                      {activePeriod.month} {activePeriod.year}
                    </b>
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPeriodModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold cursor-pointer"
                >
                  Simpan Periode Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL INPUT / EDIT KEGIATAN HARIAN (TINDAK LANJUT & OUTPUT TERPISAH + AI OUTPUT + UPLOAD FOTO & DOKUMEN PDF/WORD)
         ======================================================================== */}
      {activityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="glass-strong rounded-3xl max-w-4xl w-full p-5 sm:p-7 border border-white/15 space-y-5 my-auto max-h-[92vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display font-extrabold text-base sm:text-lg text-white">
                  {editingActivity
                    ? 'Edit Kegiatan E-Kinerja Harian'
                    : 'Input Kegiatan E-Kinerja Harian (Bisa > 1 Kegiatan per Hari)'}
                </h3>
                <p className="text-xs text-slate-400">
                  Periode Aktif: Bulan {activePeriod?.month} Tahun {activePeriod?.year} • Output diisi pada kegiatan harian (Tersedia Isi Otomatis dengan AI) &amp; Upload Dokumen PDF/Word
                </p>
              </div>
              <button
                onClick={() => setActivityModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDailyActivities} className="space-y-5">
              {/* Pemilihan Hari / Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/80 border border-white/10">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                    Pilih Tanggal Kegiatan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Tampilan Hari &amp; Tanggal di Tabel:
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-400 mt-1">
                    {formatHariTanggalIndo(formDate)}
                  </span>
                </div>
              </div>

              {/* Daftar Kegiatan (Rencana Aksi) pada Hari Ini */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                    Daftar Kegiatan (Rencana Aksi) pada Tanggal Ini ({draftEntries.length} Kegiatan)
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {draftEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={handleGenerateAllAiOutputsInModal}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" /> Isi Semua Output Otomatis dengan AI
                      </button>
                    )}
                    {!editingActivity && (
                      <button
                        type="button"
                        onClick={handleAddDraftRow}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> + Tambah Kegiatan Lain di Tanggal Ini
                      </button>
                    )}
                  </div>
                </div>

                {draftEntries.map((entry, idx) => (
                  <div
                    key={entry.tempId}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/15 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <span className="text-xs font-extrabold text-emerald-400 uppercase">
                        Kegiatan #{idx + 1} — {formatHariTanggalIndo(formDate)}
                      </span>
                      {draftEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftRow(entry.tempId)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus Baris Ini
                        </button>
                      )}
                    </div>

                    {/* Mode Kerja & Lokasi (WFA / WFO / WFH) */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-teal-500/30 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-extrabold text-teal-300 uppercase tracking-wide flex items-center gap-1.5">
                            <Globe className="w-4 h-4 text-teal-400" /> Mode Pelaksanaan Kerja:
                          </label>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-500/30 font-bold">
                            Bisa WFA
                          </span>
                        </div>
                        <div className="inline-flex rounded-xl p-1 bg-slate-900 border border-white/10 gap-1">
                          <button
                            type="button"
                            onClick={() => updateDraftEntry(entry.tempId, { workMode: 'WFA' })}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              (entry.workMode || 'WFA') === 'WFA'
                                ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" /> WFA (Fleksibel / Luar)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateDraftEntry(entry.tempId, { workMode: 'WFO', locationName: 'SDN Ciketing Udik 2' })}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              entry.workMode === 'WFO'
                                ? 'bg-blue-600 text-white shadow-md font-extrabold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Building className="w-3.5 h-3.5" /> WFO (Sekolah)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateDraftEntry(entry.tempId, { workMode: 'WFH', locationName: 'Rumah' })}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                              entry.workMode === 'WFH'
                                ? 'bg-purple-600 text-white shadow-md font-extrabold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Home className="w-3.5 h-3.5" /> WFH (Rumah)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-8">
                          <input
                            type="text"
                            value={entry.locationName || ''}
                            onChange={e => updateDraftEntry(entry.tempId, { locationName: e.target.value })}
                            placeholder={
                              (entry.workMode || 'WFA') === 'WFA'
                                ? 'Keterangan Lokasi WFA (misal: Ruang Rapat Dinas Pendidikan / KKG / Tempat Diklat)'
                                : entry.workMode === 'WFH'
                                ? 'Rumah Kediaman'
                                : 'SDN Ciketing Udik 2'
                            }
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <button
                            type="button"
                            onClick={() => handleGetGpsLocation(entry.tempId)}
                            disabled={isLocatingId === entry.tempId}
                            className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500/25 to-emerald-500/25 hover:from-teal-500/35 hover:to-emerald-500/35 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                          >
                            <MapPin className="w-3.5 h-3.5 text-teal-400" />
                            {isLocatingId === entry.tempId ? 'Mendeteksi GPS...' : '📍 Deteksi GPS WFA'}
                          </button>
                        </div>
                      </div>

                      {entry.locationCoords && (
                        <div className="flex items-center justify-between text-[11px] text-teal-300 font-mono bg-teal-950/60 px-3 py-1.5 rounded-lg border border-teal-500/30">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-teal-400" />
                            Koordinat GPS: {entry.locationCoords.latitude.toFixed(6)}, {entry.locationCoords.longitude.toFixed(6)} {entry.locationCoords.accuracy ? `(±${Math.round(entry.locationCoords.accuracy)}m)` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateDraftEntry(entry.tempId, { locationCoords: undefined })}
                            className="text-slate-400 hover:text-rose-400 text-xs font-bold"
                            title="Hapus titik GPS"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Pilih RKH Terkait (Bisa dari Periode Aktif maupun Dropdown Data Master RHK) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-300">
                          Penentuan RKH Terkait
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenMasterPickerForDraft(entry.tempId)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Pilih Cepat dari Master RHK</span>
                        </button>
                      </div>
                      <select
                        value={entry.rkhId}
                        onChange={e => {
                          const val = e.target.value;
                          if (val.startsWith('master:')) {
                            const masterId = val.replace('master:', '');
                            const m = masterRhkList.find(x => x.id === masterId);
                            if (m) {
                              const targetPeriod = ensureActivePeriod();
                              const existingRkh = targetPeriod.rkhList.find(
                                r => r.title.trim().toLowerCase() === m.title.trim().toLowerCase()
                              );
                              if (existingRkh) {
                                updateDraftEntry(entry.tempId, { rkhId: existingRkh.id });
                              } else {
                                const newRkh: EKinerjaRKHItem = {
                                  id: 'rkh-' + Math.random().toString(36).substring(2, 8),
                                  code: m.code || `RKH ${targetPeriod.rkhList.length + 1}`,
                                  title: m.title
                                };
                                const updatedPeriod: EKinerjaPeriod = {
                                  ...targetPeriod,
                                  rkhList: [...targetPeriod.rkhList, newRkh]
                                };
                                StorageService.saveEKinerjaPeriod(updatedPeriod, activeTeacherId);
                                setPeriods(StorageService.getEKinerjaPeriods(activeTeacherId));
                                updateDraftEntry(entry.tempId, { rkhId: newRkh.id });
                                showToast(`RHK "${m.code}" ditambahkan ke periode ini!`, 'success');
                              }
                            }
                          } else {
                            updateDraftEntry(entry.tempId, { rkhId: val });
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Pilih RKH (Opsional) --</option>
                        {activePeriod && activePeriod.rkhList.length > 0 && (
                          <optgroup label="📋 RKH Periode Aktif Guru">
                            {activePeriod.rkhList.map((r, rIdx) => (
                              <option key={r.id} value={r.id}>
                                RKH {rIdx + 1}: {r.title}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="🏛️ Sumber Data Master RHK">
                          {masterRhkList.map(m => (
                            <option key={m.id} value={`master:${m.id}`}>
                              Data Master: [{m.category}] {m.code}: {m.title.slice(0, 50)}...
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Pilih Jenis Kegiatan (Rencana Aksi: Pilihan, Manual, & Bantu AI) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 block">
                          Jenis Kegiatan (Rencana Aksi) <span className="text-rose-400">*</span>
                        </label>
                        <button
                          type="button"
                          disabled={entry.isGeneratingRa}
                          onClick={() => handleGenerateAiRaForDraft(entry.tempId)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3 text-cyan-300" />
                          {entry.isGeneratingRa ? 'Menyusun...' : 'Bantu AI'}
                        </button>
                      </div>

                      <select
                        value={entry.rencanaAksiId}
                        onChange={e => {
                          const val = e.target.value;
                          const matchedRa = activePeriod?.rencanaAksiList.find(r => r.id === val);
                          updateDraftEntry(entry.tempId, {
                            rencanaAksiId: val,
                            rkhId: matchedRa?.rkhId || entry.rkhId
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                      >
                        {(activePeriod?.rencanaAksiList || []).map((ra, raIdx) => (
                          <option key={ra.id} value={ra.id}>
                            {raIdx + 1}. {ra.title}
                          </option>
                        ))}
                        <option value="__custom__">
                          ✍️ + Ketik Jenis Kegiatan / Rencana Aksi Sendiri (Manual)
                        </option>
                      </select>

                      {/* Chip Rekomendasi AI untuk Rencana Aksi Draft */}
                      {entry.aiRaSuggestions && entry.aiRaSuggestions.length > 0 && (
                        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 space-y-1.5">
                          <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                            Pilihan Cepat Rencana Aksi AI:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.aiRaSuggestions.map((sug, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() =>
                                  updateDraftEntry(entry.tempId, {
                                    rencanaAksiId: '__custom__',
                                    customRencanaAksi: sug
                                  })
                                }
                                className={`text-left text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                  entry.customRencanaAksi === sug
                                    ? 'bg-cyan-500/30 border-cyan-400 text-white font-semibold'
                                    : 'bg-slate-950/70 border-white/10 text-slate-300 hover:bg-cyan-500/20'
                                }`}
                              >
                                ✨ {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(entry.rencanaAksiId === '__custom__' ||
                        !activePeriod ||
                        activePeriod.rencanaAksiList.length === 0) && (
                        <input
                          type="text"
                          value={entry.customRencanaAksi}
                          onChange={e =>
                            updateDraftEntry(entry.tempId, {
                              customRencanaAksi: e.target.value
                            })
                          }
                          placeholder="Ketik detail Jenis Kegiatan / Rencana Aksi..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                        />
                      )}
                    </div>

                    {/* Pilih Tindak Lanjut (Pilihan, Manual, & Bantu AI) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 block">
                          Tindak Lanjut (Bisa Pilih &gt; 1) <span className="text-rose-400">*</span>
                        </label>
                        <button
                          type="button"
                          disabled={entry.isGeneratingTl}
                          onClick={() => handleGenerateAiTlForDraft(entry.tempId)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          {entry.isGeneratingTl ? 'Menyusun...' : 'Bantu AI'}
                        </button>
                      </div>

                      {/* Chip Rekomendasi AI untuk Tindak Lanjut Draft */}
                      {entry.aiTlSuggestions && entry.aiTlSuggestions.length > 0 && (
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                            Pilihan Cepat Tindak Lanjut AI:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.aiTlSuggestions.map((sug, sIdx) => {
                              const isChecked = entry.selectedTindakLanjut.includes(sug);
                              return (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => toggleDraftTindakLanjut(entry.tempId, sug)}
                                  className={`text-left text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                    isChecked
                                      ? 'bg-amber-500/30 border-amber-400 text-white font-semibold'
                                      : 'bg-slate-950/70 border-white/10 text-slate-300 hover:bg-amber-500/20'
                                  }`}
                                >
                                  ✨ {sug} {isChecked ? '✓' : '+'}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {activePeriod && activePeriod.tindakLanjutList.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/70 border border-white/10">
                          {activePeriod.tindakLanjutList.map(tl => {
                            const checked = entry.selectedTindakLanjut.includes(tl.title);
                            return (
                              <label
                                key={tl.id}
                                className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                  checked
                                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                                    : 'bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/5'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleDraftTindakLanjut(entry.tempId, tl.title)}
                                  className="mt-0.5 accent-amber-500"
                                />
                                <span className="leading-snug">{tl.title}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      <input
                        type="text"
                        value={entry.customTindakLanjut}
                        onChange={e =>
                          updateDraftEntry(entry.tempId, {
                            customTindakLanjut: e.target.value
                          })
                        }
                        placeholder="Ketik tambahan Tindak Lanjut lainnya (opsional)..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* OUTPUT KEGIATAN HARIAN (DIPISAHKAN DARI TINDAK LANJUT & DILENGKAPI OPSI ISI OTOMATIS DENGAN AI) */}
                    <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-extrabold text-purple-200 uppercase tracking-wide flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            Output Kegiatan Harian <span className="text-rose-400">*</span>
                          </label>
                          <p className="text-[11px] text-slate-400">
                            Diisi khusus saat mengisi kegiatan harian (ketik manual atau klik tombol Isi Otomatis dengan AI)
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={entry.isGeneratingOutput}
                          onClick={() => handleGenerateAiOutputForEntry(entry.tempId)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-60 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {entry.isGeneratingOutput
                            ? 'Menyusun Output AI...'
                            : 'Isi Otomatis dengan AI'}
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={entry.outputText}
                        onChange={e =>
                          updateDraftEntry(entry.tempId, { outputText: e.target.value })
                        }
                        placeholder="Ketik hasil/output kegiatan harian atau klik 'Isi Otomatis dengan AI' di kanan atas..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-purple-500/40 text-white text-xs sm:text-sm focus:outline-none focus:border-purple-400 resize-none"
                      />

                      {entry.aiSuggestions && entry.aiSuggestions.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                            Pilihan Cepat Rekomendasi Output AI (Klik untuk Menggunakan):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.aiSuggestions.map((sug, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() =>
                                  updateDraftEntry(entry.tempId, { outputText: sug })
                                }
                                className={`text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                  entry.outputText === sug
                                    ? 'bg-purple-500/30 border-purple-400 text-white font-semibold'
                                    : 'bg-slate-950/70 border-white/10 text-slate-300 hover:bg-purple-500/15 hover:border-purple-500/30'
                                }`}
                              >
                                ✨ {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PILIHAN DROPDOWN KOLOM BUKTI FISIK */}
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                      <label className="text-xs font-extrabold text-emerald-300 uppercase tracking-wide block">
                        Kolom Bukti Fisik (Dropdown Tabel Laporan) <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={entry.buktiFisikType}
                        onChange={e =>
                          updateDraftEntry(entry.tempId, {
                            buktiFisikType: e.target.value as EKinerjaBuktiFisikType
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-emerald-400 cursor-pointer"
                      >
                        {BUKTI_FISIK_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Foto kegiatan otomatis dijadikan <b>Lampiran 1</b> (diperbesar 2 foto per halaman) dan dokumen dijadikan <b>Lampiran 2</b> (dokumen utuh).
                      </p>
                    </div>

                    {/* Grid Lampiran 1 (Foto Kegiatan Diperbesar) & Lampiran 2 (Dokumen Utuh) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* 1. Lampiran 1: Upload Foto Kegiatan (Diperbesar • 2 Foto per Halaman) */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5" />
                            Lampiran 1: Foto Kegiatan (Bisa &gt; 1)
                          </label>
                          <span className="text-[9.5px] px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                            2 Foto Besar / Halaman
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 leading-snug">
                          Foto kegiatan diperbesar dan disusun <b>2 foto per halaman</b> pada <b>Lampiran 1</b>.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all">
                            <Camera className="w-4 h-4" />
                            <span>Pilih Foto Kegiatan</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={e => handleUploadPhotosToDraft(entry.tempId, e)}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[11px] text-slate-400">
                            {entry.photos.length} foto
                          </span>
                        </div>

                        {entry.photos.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {entry.photos.map(pho => (
                              <div
                                key={pho.id}
                                className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 bg-slate-950"
                              >
                                <img
                                  src={pho.dataUrl}
                                  alt={pho.caption || 'Foto'}
                                  className="w-full h-full object-cover"
                                />
                                {pho.compressedSizeKb && (
                                  <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8.5px] text-emerald-300 text-center font-mono py-0.5">
                                    {pho.compressedSizeKb} KB
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDraftEntry(entry.tempId, {
                                      photos: entry.photos.filter(p => p.id !== pho.id)
                                    })
                                  }
                                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center cursor-pointer"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2. Lampiran 2: Upload Dokumen Bukti Fisik Utuh (PDF / Word) */}
                      <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Lampiran 2: Dokumen Utuh (PDF / Word)
                          </label>
                          <span className="text-[9.5px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                            Dokumen Utuh
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 leading-snug">
                          Unggah berkas <b>.pdf</b>, <b>.doc</b>, atau <b>.docx</b>. Otomatis dicetak sebagai <b>Lampiran 2 (Dokumen Utuh)</b> pada laporan E-Kinerja.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all">
                            <Paperclip className="w-4 h-4" />
                            <span>Pilih Dokumen (PDF / Word)</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              multiple
                              onChange={e => handleUploadDocumentsToDraft(entry.tempId, e)}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[11px] text-slate-400">
                            {entry.documents.length} dokumen
                          </span>
                        </div>

                        {entry.documents.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {entry.documents.map(docItem => (
                              <div
                                key={docItem.id}
                                className="p-2 rounded-xl bg-slate-950/90 border border-white/15 flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                                      docItem.fileType === 'pdf'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    }`}
                                  >
                                    {docItem.fileType === 'pdf' ? 'PDF' : 'WORD'}
                                  </span>
                                  <span className="text-xs text-slate-200 truncate font-medium">
                                    {docItem.fileName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                    ({docItem.fileSizeKb} KB)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDraftEntry(entry.tempId, {
                                      documents: entry.documents.filter(
                                        d => d.id !== docItem.id
                                      )
                                    })
                                  }
                                  className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer shrink-0"
                                  title="Hapus Dokumen"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                {!editingActivity ? (
                  <button
                    type="button"
                    onClick={handleAddDraftRow}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> + Tambah Kegiatan Lain di Hari Ini
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActivityModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Simpan ke Tabel E-Kinerja
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL SESUAIKAN IDENTITAS OTOMATIS PEGAWAI
         ======================================================================== */}
      {identityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl max-w-lg w-full p-6 border border-white/15 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-base text-white">
                Identitas Pegawai (Otomatis Terhubung ke Profil Guru)
              </h3>
              <button
                onClick={() => setIdentityModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIdentity} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  1. Nama Pegawai
                </label>
                <input
                  type="text"
                  value={editProfileForm.fullName}
                  onChange={e =>
                    setEditProfileForm({ ...editProfileForm, fullName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  2. NIP
                </label>
                <input
                  type="text"
                  value={editProfileForm.nip}
                  onChange={e => setEditProfileForm({ ...editProfileForm, nip: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  3. Jabatan
                </label>
                <input
                  type="text"
                  value={editProfileForm.jabatan || ''}
                  onChange={e =>
                    setEditProfileForm({ ...editProfileForm, jabatan: e.target.value })
                  }
                  placeholder="Guru Ahli Pertama / Guru PAI & Budi Pekerti"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  4. Unit Kerja
                </label>
                <input
                  type="text"
                  value={editProfileForm.schoolName}
                  onChange={e =>
                    setEditProfileForm({ ...editProfileForm, schoolName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIdentityModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Simpan &amp; Perbarui Otomatis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL LIGHTBOX PRATINJAU FOTO KEGIATAN
         ======================================================================== */}
      {previewPhotosModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl max-w-2xl w-full p-5 border border-white/15 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="font-bold text-sm text-white">{previewPhotosModal.title}</h4>
                <p className="text-xs text-emerald-400">{previewPhotosModal.dateLabel}</p>
              </div>
              <button
                onClick={() => setPreviewPhotosModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center max-h-[60vh]">
              <img
                src={previewPhotosModal.photos[previewPhotosModal.activeIndex]?.dataUrl}
                alt="Dokumentasi Kegiatan"
                className="max-h-[58vh] w-auto object-contain"
              />
            </div>

            {previewPhotosModal.photos.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                {previewPhotosModal.photos.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() =>
                      setPreviewPhotosModal({ ...previewPhotosModal, activeIndex: idx })
                    }
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      idx === previewPhotosModal.activeIndex
                        ? 'border-emerald-400 scale-105'
                        : 'border-white/15 opacity-60'
                    }`}
                  >
                    <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL PRATINJAU & UNDUH DOKUMEN BUKTI FISIK (PDF / WORD)
         ======================================================================== */}
      {previewDocumentModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl max-w-3xl w-full p-5 sm:p-6 border border-white/15 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      previewDocumentModal.doc.fileType === 'pdf'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {previewDocumentModal.doc.fileType === 'pdf' ? 'DOKUMEN PDF' : 'DOKUMEN WORD'}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base text-white truncate">
                    {previewDocumentModal.doc.fileName}
                  </h4>
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  Kegiatan: {previewDocumentModal.activityTitle} • {previewDocumentModal.dateLabel}
                </p>
              </div>
              <button
                onClick={() => setPreviewDocumentModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewDocumentModal.doc.fileType === 'pdf' ? (
              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-white/15 h-[62vh]">
                <iframe
                  src={previewDocumentModal.doc.dataUrl}
                  title={previewDocumentModal.doc.fileName}
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center justify-center mx-auto">
                  <FileText className="w-7 h-7" />
                </div>
                <h5 className="font-bold text-white text-sm">
                  {previewDocumentModal.doc.fileName}
                </h5>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Dokumen Microsoft Word ({previewDocumentModal.doc.fileSizeKb} KB) telah tersimpan sebagai <b>Lampiran Bukti Fisik</b> pada Laporan E-Kinerja Harian. Klik tombol di bawah untuk mengunduh/membuka berkas asli.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
              <span className="text-xs text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Tercantum otomatis pada halaman Lampiran Bukti Fisik saat Cetak E-Kinerja
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(previewDocumentModal.doc)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Unduh Dokumen ({previewDocumentModal.doc.fileSizeKb} KB)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocumentModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL KONFIRMASI HAPUS KEGIATAN
         ======================================================================== */}
      {deleteActivityConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl max-w-sm w-full p-6 border border-white/15 text-center space-y-4">
            <h4 className="font-bold text-base text-white">Hapus Kegiatan Harian?</h4>
            <p className="text-xs text-slate-400">
              Data kegiatan beserta foto dokumentasi dan dokumen bukti fisik pada baris ini akan dihapus dari tabel E-Kinerja.
            </p>
            <div className="flex justify-center gap-2.5">
              <button
                onClick={() => setDeleteActivityConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteActivity}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================
          MODAL PILIH RHK DARI MASTER UNTUK PERIODE AKTIF
         ======================================================================== */}
      {rhkImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl max-w-2xl w-full p-6 border border-white/20 shadow-2xl flex flex-col max-h-[90vh] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Pilih RHK dari Bank Master
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih RHK, Rencana Aksi, dan Tindak Lanjut untuk diterapkan pada periode Bulan {activePeriod?.month} {activePeriod?.year}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRhkImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-300">
                Pilih RHK yang ingin digunakan untuk guru <b>{teacherProfile.fullName}</b>:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMasterIdsToImport(masterRhkList.map(m => m.id))}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-[11px] font-bold cursor-pointer"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMasterIdsToImport([])}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-[11px] font-bold cursor-pointer"
                >
                  Hapus Pilihan
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {masterRhkList.map((item, idx) => {
                const isSelected = selectedMasterIdsToImport.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedMasterIdsToImport(prev => prev.filter(id => id !== item.id));
                      } else {
                        setSelectedMasterIdsToImport(prev => [...prev, item.id]);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white shadow-md'
                        : 'bg-slate-900/80 border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-400 text-white'
                              : 'border-white/30 bg-black/30'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-black/40 text-cyan-300 border border-white/10">
                            {item.code || `RHK ${idx + 1}`}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              item.category === 'Utama'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {item.category}
                          </span>
                          {item.teacherId && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Khusus Guru
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-medium">
                            • {item.rencanaAksiList.length} Rencana Aksi
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                          {item.title}
                        </p>
                        <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-white/5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-300">Rencana Aksi:</span>
                            <span className="truncate">
                              {item.rencanaAksiList.map(r => r.title).slice(0, 2).join('; ')}
                              {item.rencanaAksiList.length > 2 ? ' ...' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
              <span className="text-xs text-slate-400">
                Terpilih: <strong className="text-white">{selectedMasterIdsToImport.length}</strong> dari {masterRhkList.length} RHK
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRhkImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={selectedMasterIdsToImport.length === 0}
                  onClick={() => {
                    const curActivePeriod = activePeriod || ensureActivePeriod();
                    const res = StorageService.importMasterRhkToPeriod(
                      curActivePeriod.id,
                      selectedMasterIdsToImport,
                      activeTeacherId
                    );
                    if (res) {
                      setPeriods(StorageService.getEKinerjaPeriods(activeTeacherId));
                      refreshData();
                      setRhkImportModalOpen(false);
                      showToast(
                        `Berhasil menerapkan ${selectedMasterIdsToImport.length} RHK beserta Rencana Aksi ke periode ${res.month} ${res.year}!`,
                        'success'
                      );
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" /> Terapkan ke Periode Ini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL PEMILIHAN RHK & RENCANA AKSI DARI BANK MASTER UNTUK KEGIATAN HARIAN
         ======================================================================== */}
      {masterPickerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl max-w-3xl w-full p-6 border border-white/20 shadow-2xl flex flex-col max-h-[90vh] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Zap className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Pilih RHK &amp; Rencana Aksi Kegiatan
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih dari Bank Master untuk mengisi otomatis RKH, Rencana Aksi, Tindak Lanjut, dan Output
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMasterPickerModalOpen(false);
                  setMasterPickerTargetDraftId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Pencarian */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={masterSearchQuery}
                  onChange={e => setMasterSearchQuery(e.target.value)}
                  placeholder="Cari RHK, Rencana Aksi, atau Tindak Lanjut..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {(['all', 'Utama', 'Tambahan'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMasterFilterCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      masterFilterCategory === cat
                        ? 'bg-emerald-500 text-slate-950 font-extrabold shadow'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {cat === 'all' ? 'Semua Kategori' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List Master RHK Items */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {filteredMasterRhk.map((mItem, mIdx) => (
                <div
                  key={mItem.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/40 text-cyan-300 border border-white/10">
                        {mItem.code || `RHK ${mIdx + 1}`}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          mItem.category === 'Utama'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {mItem.category}
                      </span>
                      {mItem.teacherId && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Khusus {teacherProfile.fullName}
                        </span>
                      )}
                    </div>
                    {mItem.target && (
                      <span className="text-[11px] text-slate-400">
                        Target: <strong className="text-slate-300">{mItem.target}</strong>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                    {mItem.title}
                  </p>

                  {/* Sub-list Rencana Aksi */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pilih Salah Satu Rencana Aksi:
                    </span>
                    <div className="space-y-1.5">
                      {mItem.rencanaAksiList.map((ra, raIdx) => (
                        <div
                          key={ra.id}
                          className="p-3 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all group"
                        >
                          <div className="space-y-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                              <span className="text-cyan-400 font-bold mr-1.5">#{raIdx + 1}</span>
                              {ra.title}
                            </p>
                            {ra.defaultOutput && (
                              <p className="text-[11px] text-slate-400 truncate">
                                Output: <span className="text-slate-300">{ra.defaultOutput}</span>
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (masterPickerTargetDraftId) {
                                handleApplyMasterToDraft(mItem, ra, masterPickerTargetDraftId);
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 shrink-0 self-end sm:self-center cursor-pointer transition-all"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            Gunakan Aksi Ini
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {filteredMasterRhk.length === 0 && (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs font-semibold">Tidak ada RHK yang sesuai pencarian atau filter.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-xs text-slate-400">
                Menampilkan {filteredMasterRhk.length} RHK dari total {masterRhkList.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMasterPickerModalOpen(false);
                  setMasterPickerTargetDraftId(null);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL TAMBAH / EDIT MASTER RHK
         ======================================================================== */}
      {createMasterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl max-w-xl w-full p-6 border border-white/20 shadow-2xl flex flex-col max-h-[92vh] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingMasterId ? 'Edit Master RHK' : 'Tambah Master RHK Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Definisikan Rencana Hasil Kerja, Rencana Aksi, dan Tindak Lanjut
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateMasterModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMasterItemSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Kode RHK
                  </label>
                  <input
                    type="text"
                    value={masterForm.code}
                    onChange={e => setMasterForm({ ...masterForm, code: e.target.value })}
                    placeholder="misal: RHK 1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    Kategori RHK
                  </label>
                  <select
                    value={masterForm.category}
                    onChange={e => setMasterForm({ ...masterForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Utama">Utama</option>
                    <option value="Tambahan">Tambahan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Judul Rencana Hasil Kerja (RHK) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={masterForm.title}
                  onChange={e => setMasterForm({ ...masterForm, title: e.target.value })}
                  placeholder="Ketik rumusan RHK lengkap..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">
                    Aspek
                  </label>
                  <select
                    value={masterForm.aspek}
                    onChange={e => setMasterForm({ ...masterForm, aspek: e.target.value as any })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Kualitas">Kualitas</option>
                    <option value="Kuantitas">Kuantitas</option>
                    <option value="Waktu">Waktu</option>
                    <option value="Biaya">Biaya</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">
                    Target
                  </label>
                  <input
                    type="text"
                    value={masterForm.target}
                    onChange={e => setMasterForm({ ...masterForm, target: e.target.value })}
                    placeholder="misal: 100% / 12 Dokumen"
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                  Indikator Kinerja Individu
                </label>
                <input
                  type="text"
                  value={masterForm.indikator}
                  onChange={e => setMasterForm({ ...masterForm, indikator: e.target.value })}
                  placeholder="Persentase keterlaksanaan kegiatan..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-cyan-400 uppercase">
                    Daftar Rencana Aksi (1 baris per rencana aksi)
                  </label>
                  <span className="text-[10px] text-slate-400">Tekan Enter untuk baris baru</span>
                </div>
                <textarea
                  rows={3}
                  value={masterForm.rencanaAksiTextRaw}
                  onChange={e => setMasterForm({ ...masterForm, rencanaAksiTextRaw: e.target.value })}
                  placeholder="Menyusun perangkat modul ajar...&#10;Melaksanakan pembelajaran tatap muka...&#10;Melaksanakan asesmen formatif..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-500 resize-none font-mono text-[11px] leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-amber-400 uppercase">
                    Template Tindak Lanjut (1 baris per tindak lanjut)
                  </label>
                  <span className="text-[10px] text-slate-400">Tekan Enter untuk baris baru</span>
                </div>
                <textarea
                  rows={3}
                  value={masterForm.tindakLanjutRaw}
                  onChange={e => setMasterForm({ ...masterForm, tindakLanjutRaw: e.target.value })}
                  placeholder="Menelaah modul ajar bersama Kepala Sekolah...&#10;Mendiskusikan instrumen penilaian dalam KKG..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-500 resize-none font-mono text-[11px] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCreateMasterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Simpan ke Bank Master RHK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
