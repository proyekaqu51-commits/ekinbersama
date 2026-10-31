import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Clock,
  Users,
  Sparkles,
  FileText,
  ArrowRight,
  Search,
  Filter,
  Camera,
  X,
  Eye,
  Check,
  ShieldCheck,
  ClipboardCheck,
  Building2,
  UserCheck,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  TeachingJournal,
  TeacherProfile,
  ClassItem,
  ClassTopicItem,
  EKinerjaPeriod,
  EKinerjaPhotoItem,
  EKinerjaDocumentItem,
  AppSettings
} from '../../types';
import { StorageService } from '../../services/storageService';
import {
  DEFAULT_PRINCIPAL_SIGNATURE,
  DEFAULT_TEACHER_SIGNATURE
} from '../../data/initialData';

interface TeachingJournalViewProps {
  onNavigate?: (viewId: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const MONTHS_INDO = [
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

const DAYS_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const ELEMEN_OPTIONS = [
  "Al-Qur'an & Hadis",
  'Akidah',
  'Akhlak',
  'Fikih',
  'Sejarah Peradaban Islam',
  'Tematik / IPAS / Umum',
  'Projek Penguatan Profil Pelajar Pancasila (P5) & KBC'
];

const METODE_TEMPLATES = [
  'Demonstrasi Talaqqi, Tutor Sebaya (Peer Teaching), Diskusi Kontekstual KBC',
  'Discovery Learning, Mind Mapping (Peta Konsep), Tanya Jawab Interaktif',
  'Problem Based Learning (PBL), Studi Kasus Keseharian Anak SD, Refleksi Karakter',
  'Project Based Learning (PjBL), Praktik Ibadah Langsung, Observasi Berkelompok',
  'Cooperative Learning (Make a Match), Bercerita Kisah Teladan (Storytelling)'
];

const MEDIA_TEMPLATES = [
  "Mushaf Al-Qur'an Juz Amma, Poster Tajwid Interaktif, Proyektor Audio Murattal, Buku Teks PAI Kemendikdasmen",
  'Slide Presentasi Visual Interaktif, Lembar Kerja Peserta Didik (LKPD), Kartu Pasangan (Make a Match)',
  'Video Animasi Kisah Teladan Islami, Papan Tulis, Buku Paket Kurikulum Merdeka & Alat Peraga Ibadah',
  'Poster Tata Cara Wudhu & Shalat, LKPD Berdiferensiasi, Lingkungan Musholla Sekolah'
];

const GRADE_LEVELS = ['1', '2', '3', '4', '5', '6'];
const ROMBEL_LETTERS = ['A', 'B', 'C'];

const STANDARD_ROMBEL_CLASSES: Array<{
  id: string;
  className: string;
  grade: string;
  rombel: string;
  defaultStudents: number;
}> = GRADE_LEVELS.flatMap(grade =>
  ROMBEL_LETTERS.map(rombel => ({
    id: `c-${grade}${rombel.toLowerCase()}`,
    className: `${grade}${rombel}`,
    grade,
    rombel,
    defaultStudents: grade === '1' ? 28 : grade === '2' || grade === '6' ? 30 : 32
  }))
);

function formatHariTanggalIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return dateStr;
  const dayName = DAYS_INDO[d.getDay()];
  const monthName = MONTHS_INDO[d.getMonth()];
  return `${dayName}, ${Number(parts[2])} ${monthName} ${parts[0]}`;
}

function getMonthYearFromDate(dateStr: string): { month: string; year: string } {
  const parts = (dateStr || '').split('-');
  if (parts.length === 3) {
    const mIdx = Number(parts[1]) - 1;
    return {
      month: MONTHS_INDO[mIdx] || 'Oktober',
      year: parts[0] || '2026'
    };
  }
  const now = new Date();
  return {
    month: MONTHS_INDO[now.getMonth()],
    year: String(now.getFullYear())
  };
}

function buildOfficialJournalHtml(
  journal: TeachingJournal,
  teacher: TeacherProfile,
  appSettings: AppSettings,
  includeToolbar = true
): string {
  const schoolNameUpper = (journal.schoolName || teacher.schoolName || appSettings.schoolName || 'SDN CIKETING UDIK 2 BANTARGEBANG').toUpperCase();
  const schoolAddress = teacher.schoolAddress || appSettings.schoolAddress || 'Jl. Raya Ciketing Udik No. 2, Kecamatan Bantargebang, Kota Bekasi';
  const teacherName = journal.teacherName || teacher.fullName || 'Guru PAI';
  const teacherNip = journal.teacherNip || teacher.nip || '-';
  const teacherJabatan = teacher.jabatan || 'Guru PAI & Budi Pekerti';
  const teacherPangkat = teacher.pangkatGolongan || 'Penata / III/c';
  const principalName = journal.principalName || teacher.principalName || appSettings.principalName || 'Hj. Siti Rohmah, M.Pd.';
  const principalNip = journal.principalNip || teacher.principalNip || appSettings.principalNip || '197405101998022001';
  const teacherSig = teacher.signatureDataUrl || DEFAULT_TEACHER_SIGNATURE;
  const principalSig = teacher.principalSignatureDataUrl || DEFAULT_PRINCIPAL_SIGNATURE;

  const att = journal.attendanceSummary || {
    totalStudents: 30,
    hadir: Math.max(0, 30 - (journal.absentStudents?.length || 0)),
    sakit: journal.absentStudents?.length || 0,
    izin: 0,
    alpa: 0
  };

  const kegiatan = journal.kegiatanPembelajaran || {
    pendahuluan: 'Guru membuka pembelajaran dengan salam, doa belajar bersama, tadarus surat pendek, mengecek kehadiran siswa, dan menyampaikan apersepsi serta tujuan pembelajaran.',
    inti: `Guru menyampaikan materi "${journal.topic}" dengan pendekatan interaktif dan berdiferensiasi, memfasilitasi diskusi kelompok, tanya jawab, serta pembimbingan praktik/LKPD peserta didik.`,
    penutup: 'Siswa bersama guru menyimpulkan materi pembelajaran, melakukan refleksi pengamalan karakter mulia dalam keseharian, menyampaikan tindak lanjut, dan menutup dengan doa.'
  };

  const photosHtml =
    journal.photos && journal.photos.length > 0
      ? `
      <div style="margin-top: 16px; page-break-inside: avoid;">
        <div style="font-weight: 800; font-size: 11.5px; text-transform: uppercase; color: #0f172a; margin-bottom: 8px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">
          DOKUMENTASI FOTO PELAKSANAAN PEMBELAJARAN DI KELAS
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          ${journal.photos
            .slice(0, 4)
            .map(
              (p, i) => `
            <div style="border: 1px solid #94a3b8; border-radius: 6px; overflow: hidden; background: #f8fafc;">
              <img src="${p.dataUrl}" alt="Foto Mengajar ${i + 1}" style="width: 100%; height: 145px; object-fit: cover; display: block;" />
              <div style="padding: 5px 8px; font-size: 10px; color: #334155; font-weight: 600;">
                Foto ${i + 1}: Pelaksanaan KBM Kelas ${journal.className} — ${journal.topic}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
      : '';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>BUKTI FISIK JURNAL MENGAJAR - KELAS ${journal.className} - ${journal.date}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #0f172a;
      background: ${includeToolbar ? '#e2e8f0' : '#ffffff'};
      margin: 0;
      padding: ${includeToolbar ? '20px' : '0'};
      font-size: 11.5px;
      line-height: 1.45;
    }
    .toolbar {
      max-width: 210mm;
      margin: 0 auto 16px auto;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 10px;
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
      font-weight: 700;
      cursor: pointer;
      font-size: 12px;
    }
    .toolbar button.secondary {
      background: #334155;
    }
    .sheet {
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
      padding: ${includeToolbar ? '14mm 15mm' : '4mm 2mm'};
      box-shadow: ${includeToolbar ? '0 10px 30px rgba(0,0,0,0.12)' : 'none'};
      border-radius: 6px;
    }
    .kop-surat {
      text-align: center;
      border-bottom: 3.5px double #0f172a;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .kop-instansi {
      font-size: 12.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
    }
    .kop-sekolah {
      font-size: 17px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #0f172a;
      margin: 2px 0;
    }
    .kop-alamat {
      font-size: 10.5px;
      color: #475569;
    }
    .doc-banner {
      text-align: center;
      margin-bottom: 14px;
      background: #f8fafc;
      border: 1.5px solid #0f172a;
      padding: 8px 12px;
      border-radius: 6px;
    }
    .doc-banner h1 {
      margin: 0;
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .doc-banner p {
      margin: 3px 0 0 0;
      font-size: 10.5px;
      font-weight: 700;
      color: #047857;
      text-transform: uppercase;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .meta-table td {
      padding: 3px 4px;
      vertical-align: top;
    }
    .meta-table td.lbl {
      width: 125px;
      font-weight: 700;
      color: #1e293b;
    }
    .meta-table td.sep {
      width: 10px;
      font-weight: 700;
    }
    .section-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 11px;
    }
    .section-table th, .section-table td {
      border: 1px solid #1e293b;
      padding: 6px 9px;
      vertical-align: top;
      text-align: left;
    }
    .section-table th {
      background: #e2e8f0;
      color: #0f172a;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.3px;
      width: 185px;
    }
    .att-bar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .att-item {
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      font-size: 10.5px;
    }
    .sig-row {
      display: flex;
      justify-content: space-between;
      margin-top: 22px;
      page-break-inside: avoid;
      font-size: 11.5px;
    }
    .sig-col {
      width: 45%;
      text-align: center;
    }
    .sig-space {
      height: 62px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .toolbar { display: none !important; }
      .sheet { box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  ${
    includeToolbar
      ? `
    <div class="toolbar">
      <div>
        <strong>DOKUMEN BUKTI FISIK E-KINERJA — JURNAL PELAKSANAAN PEMBELAJARAN (JURNAL MENGAJAR)</strong>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
          Kelas ${journal.className} • ${formatHariTanggalIndo(journal.date)} • Materi: ${journal.topic}
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="window.print()">🖨️ Cetak / Simpan PDF Bukti Fisik</button>
        <button class="secondary" onclick="window.close()">Tutup</button>
      </div>
    </div>
  `
      : ''
  }

  <div class="sheet">
    <div class="kop-surat">
      <div class="kop-instansi">PEMERINTAH KOTA BEKASI • DINAS PENDIDIKAN</div>
      <div class="kop-sekolah">${schoolNameUpper}</div>
      <div class="kop-alamat">${schoolAddress}</div>
    </div>

    <div class="doc-banner">
      <h1>JURNAL PELAKSANAAN PEMBELAJARAN HARIAN (JURNAL MENGAJAR GURU)</h1>
      <p>DOKUMEN BUKTI FISIK PELAKSANAAN TUGAS POKOK E-KINERJA ASN / GURU • TAHUN AJARAN ${journal.academicYear || appSettings.academicYear || '2026/2027'}</p>
    </div>

    <div class="meta-grid">
      <table class="meta-table">
        <tr>
          <td class="lbl">Nama Pendidik</td>
          <td class="sep">:</td>
          <td><b>${teacherName}</b></td>
        </tr>
        <tr>
          <td class="lbl">NIP</td>
          <td class="sep">:</td>
          <td>${teacherNip}</td>
        </tr>
        <tr>
          <td class="lbl">Pangkat / Jabatan</td>
          <td class="sep">:</td>
          <td>${teacherPangkat} — ${teacherJabatan}</td>
        </tr>
        <tr>
          <td class="lbl">Mata Pelajaran</td>
          <td class="sep">:</td>
          <td><b>${teacher.subject || 'Pendidikan Agama Islam & Budi Pekerti'}</b></td>
        </tr>
      </table>

      <table class="meta-table">
        <tr>
          <td class="lbl">Hari / Tanggal</td>
          <td class="sep">:</td>
          <td><b>${formatHariTanggalIndo(journal.date)}</b></td>
        </tr>
        <tr>
          <td class="lbl">Kelas / Semester</td>
          <td class="sep">:</td>
          <td><b>Kelas ${journal.className}</b> / Semester ${journal.semester || 'Ganjil'}</td>
        </tr>
        <tr>
          <td class="lbl">Jam Ke / Alokasi</td>
          <td class="sep">:</td>
          <td>Jam ke-${journal.jamKe || '1 - 4'} (${journal.alokasiWaktuJP || 4} JP × 35 Menit) • Pertemuan ke-${journal.pertemuanKe || 1}</td>
        </tr>
        <tr>
          <td class="lbl">Status Ketercapaian</td>
          <td class="sep">:</td>
          <td><b style="color: ${journal.status === 'Tuntas' ? '#047857' : '#b45309'};">${journal.status.toUpperCase()}</b></td>
        </tr>
      </table>
    </div>

    <table class="section-table">
      <tr>
        <th>1. Elemen / Domain CP</th>
        <td><b>${journal.elemenDomain || "Al-Qur'an & Hadis / PAI & Budi Pekerti"}</b></td>
      </tr>
      <tr>
        <th>2. Materi Pokok &amp; Sub-Materi</th>
        <td>
          <div style="font-weight: 800; color: #0f172a; font-size: 11.5px;">${journal.topic}</div>
          ${journal.subTopic ? `<div style="color: #334155; margin-top: 2px;">Sub-Materi: ${journal.subTopic}</div>` : ''}
        </td>
      </tr>
      <tr>
        <th>3. Tujuan Pembelajaran (TP / ATP)</th>
        <td style="text-align: justify;">${journal.learningObjective}</td>
      </tr>
      <tr>
        <th>4. Metode &amp; Model Pembelajaran</th>
        <td>${journal.metodePembelajaran || 'Pembelajaran Berdiferensiasi, Diskusi Interaktif, & Penugasan Terbimbing (KBC)'}</td>
      </tr>
      <tr>
        <th>5. Media &amp; Sumber Belajar</th>
        <td>${journal.mediaSumberBelajar || 'Buku Teks Kemendikdasmen, Al-Qur\'an/Juz Amma, LKPD, & Media Visual'}</td>
      </tr>
      <tr>
        <th>6. Rincian Kegiatan Pembelajaran</th>
        <td>
          <div style="margin-bottom: 5px;"><b>a. Kegiatan Pendahuluan:</b><br/>${kegiatan.pendahuluan}</div>
          <div style="margin-bottom: 5px;"><b>b. Kegiatan Inti:</b><br/>${kegiatan.inti}</div>
          <div><b>c. Kegiatan Penutup:</b><br/>${kegiatan.penutup}</div>
        </td>
      </tr>
      <tr>
        <th>7. Asesmen &amp; Penilaian</th>
        <td>${journal.asesmenPenilaian || 'Asesmen Formatif (Observasi Sikap, Unjuk Kerja/Praktik, dan Tes Tertulis LKPD)'}</td>
      </tr>
      <tr>
        <th>8. Rekapitulasi Presensi Peserta Didik</th>
        <td>
          <div class="att-bar">
            <span class="att-item">Jumlah Siswa: ${att.totalStudents}</span>
            <span class="att-item" style="color:#047857;">Hadir: ${att.hadir}</span>
            <span class="att-item" style="color:#b45309;">Sakit: ${att.sakit}</span>
            <span class="att-item" style="color:#0369a1;">Izin: ${att.izin}</span>
            <span class="att-item" style="color:#be123c;">Alpa: ${att.alpa}</span>
          </div>
          <div>
            <b>Catatan Siswa Tidak Hadir:</b>
            ${
              journal.absentStudents && journal.absentStudents.length > 0
                ? journal.absentStudents.join(', ')
                : 'Nihil (Seluruh peserta didik hadir mengikuti pembelajaran dengan tertib)'
            }
          </div>
        </td>
      </tr>
      <tr>
        <th>9. Catatan Refleksi Pembelajaran</th>
        <td style="text-align: justify;">${journal.reflection}</td>
      </tr>
      <tr>
        <th>10. Rencana Tindak Lanjut (RTL)</th>
        <td style="text-align: justify; font-weight: 600; color: #047857;">
          ${journal.tindakLanjut || 'Melaksanakan pendampingan penguatan materi dan pencatatan perkembangan karakter peserta didik.'}
        </td>
      </tr>
    </table>

    ${photosHtml}

    <div class="sig-row">
      <div class="sig-col">
        <div>Mengetahui,<br/>Kepala ${journal.schoolName || teacher.schoolName || 'Sekolah'}</div>
        <div class="sig-space">
          ${principalSig ? `<img src="${principalSig}" alt="TTD Kepsek" style="max-height: 58px; max-width: 150px; object-fit: contain;" />` : ''}
        </div>
        <div style="font-weight: 800; text-decoration: underline;">${principalName}</div>
        <div>NIP. ${principalNip}</div>
      </div>

      <div class="sig-col">
        <div>Bekasi, ${formatHariTanggalIndo(journal.date).split(', ')[1] || journal.date}<br/>Guru Mata Pelajaran / Kelas</div>
        <div class="sig-space">
          ${teacherSig ? `<img src="${teacherSig}" alt="TTD Guru" style="max-height: 58px; max-width: 150px; object-fit: contain;" />` : ''}
        </div>
        <div style="font-weight: 800; text-decoration: underline;">${teacherName}</div>
        <div>NIP. ${teacherNip}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export const TeachingJournalView: React.FC<TeachingJournalViewProps> = ({
  onNavigate,
  showToast
}) => {
  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => StorageService.getTeachers());
  const [activeTeacherId, setActiveTeacherId] = useState<string>(() => StorageService.getActiveTeacherId());
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(() => StorageService.getTeacherProfile());
  const [journals, setJournals] = useState<TeachingJournal[]>(() =>
    StorageService.getJournals(StorageService.getActiveTeacherId())
  );
  const [classes] = useState<ClassItem[]>(() => StorageService.getClasses());
  const [classTopics] = useState<ClassTopicItem[]>(() => StorageService.getClassTopics());
  const [periods, setPeriods] = useState<EKinerjaPeriod[]>(() =>
    StorageService.getEKinerjaPeriods(StorageService.getActiveTeacherId())
  );

  const appSettings = StorageService.getAppSettings();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Tuntas' | 'Belum Tuntas'>('all');

  // Modal Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<TeachingJournal | null>(null);
  const [previewJournal, setPreviewJournal] = useState<TeachingJournal | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form fields
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formClassId, setFormClassId] = useState<string>('c-5a');
  const [formSemester, setFormSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [formJamKe, setFormJamKe] = useState<string>('1 - 4');
  const [formAlokasiJP, setFormAlokasiJP] = useState<number>(4);
  const [formPertemuanKe, setFormPertemuanKe] = useState<number>(1);
  const [formElemen, setFormElemen] = useState<string>("Al-Qur'an & Hadis");
  const [formTopic, setFormTopic] = useState<string>('');
  const [formSubTopic, setFormSubTopic] = useState<string>('');
  const [formLearningObjective, setFormLearningObjective] = useState<string>('');
  const [formMetode, setFormMetode] = useState<string>(METODE_TEMPLATES[0]);
  const [formMedia, setFormMedia] = useState<string>(MEDIA_TEMPLATES[0]);
  const [formPendahuluan, setFormPendahuluan] = useState<string>('');
  const [formInti, setFormInti] = useState<string>('');
  const [formPenutup, setFormPenutup] = useState<string>('');
  const [formAsesmen, setFormAsesmen] = useState<string>(
    'Asesmen Formatif: Observasi Sikap Karakter KBC, Unjuk Kerja Praktik, dan Penilaian LKPD'
  );
  const [formTotalStudents, setFormTotalStudents] = useState<number>(30);
  const [formSakit, setFormSakit] = useState<number>(0);
  const [formIzin, setFormIzin] = useState<number>(0);
  const [formAlpa, setFormAlpa] = useState<number>(0);
  const [formAbsentText, setFormAbsentText] = useState<string>('');
  const [formReflection, setFormReflection] = useState<string>('');
  const [formTindakLanjut, setFormTindakLanjut] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'Tuntas' | 'Belum Tuntas'>('Tuntas');
  const [formPhotos, setFormPhotos] = useState<EKinerjaPhotoItem[]>([]);
  const [autoSendToEKinerja, setAutoSendToEKinerja] = useState<boolean>(true);
  const [selectedRkhId, setSelectedRkhId] = useState<string>('');

  const refreshData = (tId?: string) => {
    const curId = tId || StorageService.getActiveTeacherId();
    setActiveTeacherId(curId);
    setTeachers(StorageService.getTeachers());
    setTeacherProfile(StorageService.getTeacherProfile(curId));
    setJournals(StorageService.getJournals(curId));
    setPeriods(StorageService.getEKinerjaPeriods(curId));
  };

  useEffect(() => {
    const handleTeacherChanged = () => refreshData();
    window.addEventListener('lms-teacher-changed', handleTeacherChanged);
    return () => window.removeEventListener('lms-teacher-changed', handleTeacherChanged);
  }, []);

  const handleSwitchTeacher = (id: string) => {
    StorageService.setActiveTeacherId(id);
    refreshData(id);
    const prof = StorageService.getTeacherProfile(id);
    showToast(`Beralih ke Jurnal Mengajar: ${prof.fullName}`, 'info');
  };

  // Gabungkan daftar Kelas 1-6 Rombel A, B, C dengan data kelas tersimpan agar seluruh 18 rombel (1A-6C) selalu tersedia
  const allClassOptions = useMemo<ClassItem[]>(() => {
    const mergedMap = new Map<string, ClassItem>();
    STANDARD_ROMBEL_CLASSES.forEach(std => {
      mergedMap.set(std.id, {
        id: std.id,
        className: std.className,
        homeroom: `Wali Kelas ${std.className}`,
        academicYear: '2026/2027',
        studentCount: std.defaultStudents
      });
    });
    classes.forEach(c => {
      const normalizedId = `c-${c.className.toLowerCase().replace(/\s+/g, '')}`;
      const targetKey = mergedMap.has(c.id) ? c.id : mergedMap.has(normalizedId) ? normalizedId : c.id;
      const existing = mergedMap.get(targetKey);
      mergedMap.set(targetKey, {
        ...existing,
        ...c,
        id: targetKey,
        studentCount: c.studentCount || existing?.studentCount || 30
      });
    });
    return Array.from(mergedMap.values());
  }, [classes]);

  // Filtered topics for the chosen class grade
  const matchingCurriculumTopics = useMemo(() => {
    const cls = allClassOptions.find(c => c.id === formClassId || c.className === formClassId);
    const grade = cls ? cls.className.replace(/\D/g, '') : formClassId.replace(/\D/g, '') || '5';
    return classTopics.filter(t => t.classGrade === grade && t.semester === formSemester);
  }, [classTopics, allClassOptions, formClassId, formSemester]);

  const handleApplyCurriculumTopic = (topicId: string) => {
    const found = matchingCurriculumTopics.find(t => t.id === topicId);
    if (!found) return;
    const cls = allClassOptions.find(c => c.id === formClassId || c.className === formClassId);
    const classNameLabel = cls ? cls.className : `${found.classGrade}A`;

    setFormElemen(found.domain);
    setFormTopic(`Bab ${found.chapterNo}: ${found.chapterTitle}`);
    setFormSubTopic(found.subTopics.join(', '));
    setFormLearningObjective(found.learningObjective);
    if (found.learningResources) {
      setFormMedia(found.learningResources);
    }
    setFormPendahuluan(
      `Guru membuka pembelajaran di Kelas ${classNameLabel} dengan salam, doa belajar bersama, tadarus surat pendek/doa harian, mengecek presensi & kesiapan belajar siswa, serta menyampaikan apersepsi materi "${found.chapterTitle}".`
    );
    setFormInti(
      `Peserta didik Kelas ${classNameLabel} menyimak penjelasan dan demonstrasi mengenai "${found.chapterTitle}" (${found.subTopics.slice(0, 2).join(' & ')}), berdiskusi secara kolaboratif dengan pendekatan Kurikulum Berbasis Cinta (KBC), serta mengerjakan aktivitas pada LKPD.`
    );
    setFormPenutup(
      `Peserta didik bersama guru menyimpulkan poin penting materi "${found.chapterTitle}", melaksanakan refleksi pengamalan akhlak/ibadah dalam keseharian, menyimak informasi materi pertemuan berikutnya, dan menutup pembelajaran dengan doa.`
    );
    setFormReflection(
      `Pembelajaran di Kelas ${classNameLabel} berlangsung aktif, tertib, dan menyenangkan. Peserta didik antusias mengikuti diskusi serta mampu memahami konsep utama "${found.chapterTitle}" sesuai indikator KKTP.`
    );
    setFormTindakLanjut(
      `Mencatat perkembangan keaktifan dan adab siswa pada buku nilai, serta memberikan bimbingan penguatan bagi siswa yang memerlukan pendampingan tambahan.`
    );
    showToast(`Materi & TP Bab ${found.chapterNo} diterapkan secara otomatis!`, 'success');
  };

  const handleSmartGenerateNarratives = () => {
    const cls = allClassOptions.find(c => c.id === formClassId || c.className === formClassId);
    const classNameLabel = cls ? cls.className : '5A';
    const topicTitle = formTopic.trim() || 'Materi Pembelajaran PAI & Budi Pekerti';

    if (!formLearningObjective.trim()) {
      setFormLearningObjective(
        `Melalui pembelajaran berdiferensiasi dan diskusi interaktif berbasis Kurikulum Berbasis Cinta (KBC) pada materi "${topicTitle}", peserta didik Kelas ${classNameLabel} mampu memahami konsep materi dengan benar, mempraktikkannya dalam kehidupan sehari-hari, serta menunjukkan sikap santun dan tanggung jawab.`
      );
    }

    setFormPendahuluan(
      `Guru membuka pelajaran di Kelas ${classNameLabel} dengan salam hangat, doa sebelum belajar, tadarus Juz Amma bersama, pemeriksaan kehadiran siswa, serta apersepsi mengaitkan materi "${topicTitle}" dengan kehidupan sehari-hari.`
    );
    setFormInti(
      `Guru memfasilitasi eksplorasi materi "${topicTitle}"${formSubTopic ? ` (${formSubTopic})` : ''} menggunakan metode ${formMetode}. Siswa berdiskusi aktif, melakukan tanya jawab, dan menyelesaikan lembar kerja/praktik terbimbing.`
    );
    setFormPenutup(
      `Siswa bersama guru menyusun kesimpulan pembelajaran "${topicTitle}", melakukan refleksi nilai karakter & ibadah harian, menyampaikan umpan balik formatif, dan menutup kelas dengan doa kafaratul majelis.`
    );
    setFormReflection(
      `Kegiatan belajar mengajar di Kelas ${classNameLabel} berjalan kondusif dan interaktif. Sebagian besar peserta didik (di atas 90%) telah mencapai ketuntasan tujuan pembelajaran pada materi "${topicTitle}".`
    );
    setFormTindakLanjut(
      `Melaksanakan pendampingan penguatan bagi siswa yang membutuhkan bimbingan tambahan serta mendokumentasikan hasil asesmen formatif dan jurnal mengajar sebagai bukti fisik E-Kinerja.`
    );
    showToast('Rincian kegiatan, TP, refleksi, & tindak lanjut berhasil disusun otomatis!', 'success');
  };

  const openCreateModal = () => {
    setEditingJournal(null);
    const today = new Date().toISOString().split('T')[0];
    setFormDate(today);
    const defaultCls =
      allClassOptions.find(c => c.id === 'c-5a') ||
      allClassOptions[0] || { id: 'c-5a', className: '5A', studentCount: 32 };
    setFormClassId(defaultCls.id);
    setFormSemester('Ganjil');
    setFormJamKe('1 - 4');
    setFormAlokasiJP(4);
    setFormPertemuanKe(journals.length + 1);
    setFormElemen("Al-Qur'an & Hadis");
    setFormTopic('');
    setFormSubTopic('');
    setFormLearningObjective('');
    setFormMetode(METODE_TEMPLATES[0]);
    setFormMedia(MEDIA_TEMPLATES[0]);
    setFormPendahuluan('');
    setFormInti('');
    setFormPenutup('');
    setFormAsesmen('Asesmen Formatif: Observasi Sikap Karakter KBC, Unjuk Kerja Praktik, dan Penilaian LKPD');
    setFormTotalStudents(defaultCls.studentCount || 30);
    setFormSakit(0);
    setFormIzin(0);
    setFormAlpa(0);
    setFormAbsentText('');
    setFormReflection('');
    setFormTindakLanjut('');
    setFormStatus('Tuntas');
    setFormPhotos([]);
    setAutoSendToEKinerja(true);
    const firstPeriod = periods[0];
    setSelectedRkhId(firstPeriod?.rkhList[0]?.id || '');
    setModalOpen(true);
  };

  const openEditModal = (jrn: TeachingJournal) => {
    setEditingJournal(jrn);
    setFormDate(jrn.date);
    setFormClassId(jrn.classId || 'c-5a');
    setFormSemester(jrn.semester || 'Ganjil');
    setFormJamKe(jrn.jamKe || '1 - 4');
    setFormAlokasiJP(jrn.alokasiWaktuJP || 4);
    setFormPertemuanKe(jrn.pertemuanKe || 1);
    setFormElemen(jrn.elemenDomain || "Al-Qur'an & Hadis");
    setFormTopic(jrn.topic);
    setFormSubTopic(jrn.subTopic || '');
    setFormLearningObjective(jrn.learningObjective);
    setFormMetode(jrn.metodePembelajaran || METODE_TEMPLATES[0]);
    setFormMedia(jrn.mediaSumberBelajar || MEDIA_TEMPLATES[0]);
    setFormPendahuluan(jrn.kegiatanPembelajaran?.pendahuluan || '');
    setFormInti(jrn.kegiatanPembelajaran?.inti || '');
    setFormPenutup(jrn.kegiatanPembelajaran?.penutup || '');
    setFormAsesmen(jrn.asesmenPenilaian || 'Asesmen Formatif: Observasi Sikap, Unjuk Kerja, & LKPD');
    setFormTotalStudents(jrn.attendanceSummary?.totalStudents || 30);
    setFormSakit(jrn.attendanceSummary?.sakit || 0);
    setFormIzin(jrn.attendanceSummary?.izin || 0);
    setFormAlpa(jrn.attendanceSummary?.alpa || 0);
    setFormAbsentText((jrn.absentStudents || []).join(', '));
    setFormReflection(jrn.reflection);
    setFormTindakLanjut(jrn.tindakLanjut || '');
    setFormStatus(jrn.status);
    setFormPhotos(jrn.photos || []);
    setAutoSendToEKinerja(Boolean(jrn.linkedEKinerjaActivityId));
    setModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const rawUrl = String(ev.target?.result || '');
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxW = 1100;
          const scale = img.width > maxW ? maxW / img.width : 1;
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.8);
            const newPhoto: EKinerjaPhotoItem = {
              id: 'jphoto-' + Math.random().toString(36).substring(2, 9),
              dataUrl: compressedUrl,
              caption: file.name,
              originalSizeKb: Math.round(file.size / 1024),
              compressedSizeKb: Math.round((compressedUrl.length * 0.75) / 1024),
              uploadedAt: new Date().toISOString()
            };
            setFormPhotos(prev => [...prev, newPhoto]);
          }
        };
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  /**
   * Mengintegrasikan Jurnal Mengajar sebagai Aktivitas + Dokumen Bukti Fisik Utuh (Lampiran 2)
   * pada laporan E-Kinerja Harian pegawai.
   */
  const syncJournalToEKinerja = (savedJournal: TeachingJournal): TeachingJournal => {
    const { month, year } = getMonthYearFromDate(savedJournal.date);
    const currentPeriods = StorageService.getEKinerjaPeriods(activeTeacherId);

    // Cari periode bulan & tahun yang sesuai atau buat periode baru
    let targetPeriod = currentPeriods.find(
      p => p.month.toLowerCase() === month.toLowerCase() && p.year === year
    );

    if (!targetPeriod) {
      const templatePeriod = currentPeriods[0];
      targetPeriod = StorageService.saveEKinerjaPeriod(
        {
          teacherId: activeTeacherId,
          month,
          year,
          rkhList: templatePeriod?.rkhList || [
            {
              id: `rkh-${Date.now()}`,
              code: 'RKH 1',
              title: `Terlaksananya perencanaan dan pelaksanaan pembelajaran ${teacherProfile.subject || 'PAI & Budi Pekerti'} di ${teacherProfile.schoolName}`
            }
          ],
          rencanaAksiList: templatePeriod?.rencanaAksiList || [],
          tindakLanjutList: templatePeriod?.tindakLanjutList || []
        },
        activeTeacherId
      );
    }

    const rkhObj =
      targetPeriod.rkhList.find(r => r.id === selectedRkhId) || targetPeriod.rkhList[0];

    // Buat dokumen bukti fisik HTML utuh siap cetak dalam bentuk DataURL sehingga muncul di Lampiran 2 E-Kinerja
    const officialHtml = buildOfficialJournalHtml(savedJournal, teacherProfile, appSettings, false);
    const base64Html = btoa(unescape(encodeURIComponent(officialHtml)));
    const docDataUrl = `data:text/html;base64,${base64Html}`;
    const safeFileName = `Jurnal_Mengajar_Kelas_${savedJournal.className}_${savedJournal.date}.html`;

    const journalDocItem: EKinerjaDocumentItem = {
      id: `doc-jrn-${savedJournal.id}`,
      fileName: safeFileName,
      fileType: 'other',
      mimeType: 'text/html',
      fileSizeKb: Math.max(4, Math.round(officialHtml.length / 1024)),
      dataUrl: docDataUrl,
      uploadedAt: new Date().toISOString()
    };

    const hasPhotos = savedJournal.photos && savedJournal.photos.length > 0;
    const buktiFisikType = hasPhotos ? 'Foto Kegiatan dan Dokumen' : 'Dokumen';

    const rencanaAksiText = `Melaksanakan kegiatan pembelajaran tatap muka Kelas ${savedJournal.className} pada materi "${savedJournal.topic}" (${savedJournal.alokasiWaktuJP || 4} JP) serta pengisian Jurnal Mengajar & Presensi Siswa`;
    const tindakLanjutText =
      savedJournal.tindakLanjut ||
      `Mencatat perkembangan kehadiran (${savedJournal.attendanceSummary?.hadir || 30}/${savedJournal.attendanceSummary?.totalStudents || 30} siswa hadir), keaktifan, dan refleksi pembelajaran pada Jurnal Mengajar Kelas ${savedJournal.className}`;
    const outputText = `1 Dokumen Bukti Fisik Jurnal Mengajar Harian Kelas ${savedJournal.className} (${savedJournal.topic}), Rekap Presensi Peserta Didik, dan Catatan Refleksi Pembelajaran yang Disahkan Kepala Sekolah`;

    const savedActivity = StorageService.saveEKinerjaActivity(
      {
        id: savedJournal.linkedEKinerjaActivityId,
        teacherId: activeTeacherId,
        periodId: targetPeriod.id,
        date: savedJournal.date,
        workMode: 'WFO',
        locationName: teacherProfile.schoolName || 'Satuan Pendidikan',
        rkhId: rkhObj?.id,
        rkhText: rkhObj?.title || '',
        rencanaAksiText,
        tindakLanjutText,
        tindakLanjutList: [tindakLanjutText],
        outputText,
        buktiFisikType,
        photos: savedJournal.photos || [],
        documents: [journalDocItem]
      },
      activeTeacherId
    );

    const updatedJournal = StorageService.saveJournal(
      {
        ...savedJournal,
        linkedEKinerjaActivityId: savedActivity.id,
        linkedPeriodId: targetPeriod.id
      },
      activeTeacherId
    );

    return updatedJournal;
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTopic.trim()) {
      showToast('Materi Pokok / Topik Pembelajaran wajib diisi!', 'error');
      return;
    }
    if (!formLearningObjective.trim()) {
      showToast('Tujuan Pembelajaran (TP) wajib diisi!', 'error');
      return;
    }

    const cls = allClassOptions.find(c => c.id === formClassId || c.className === formClassId);
    const className = cls ? cls.className : formClassId.replace(/^c-/i, '').toUpperCase() || '5A';
    const hadirCount = Math.max(0, formTotalStudents - formSakit - formIzin - formAlpa);
    const absentArray = formAbsentText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload: Omit<TeachingJournal, 'id'> & { id?: string } = {
      id: editingJournal?.id,
      teacherId: activeTeacherId,
      date: formDate,
      classId: formClassId,
      className,
      semester: formSemester,
      academicYear: teacherProfile.academicYear || appSettings.academicYear || '2026/2027',
      jamKe: formJamKe,
      alokasiWaktuJP: Number(formAlokasiJP) || 4,
      pertemuanKe: Number(formPertemuanKe) || 1,
      elemenDomain: formElemen,
      topic: formTopic.trim(),
      subTopic: formSubTopic.trim(),
      learningObjective: formLearningObjective.trim(),
      metodePembelajaran: formMetode.trim(),
      mediaSumberBelajar: formMedia.trim(),
      kegiatanPembelajaran: {
        pendahuluan:
          formPendahuluan.trim() ||
          `Guru membuka pelajaran di Kelas ${className} dengan salam, doa belajar, tadarus pendek, presensi kehadiran siswa, dan apersepsi materi "${formTopic.trim()}".`,
        inti:
          formInti.trim() ||
          `Peserta didik menyimak pemaparan materi "${formTopic.trim()}", berdiskusi kelompok, melakukan tanya jawab interaktif, dan mengerjakan LKPD terbimbing.`,
        penutup:
          formPenutup.trim() ||
          `Siswa bersama guru menyimpulkan pembelajaran, melakukan refleksi pengamalan karakter mulia, dan menutup kegiatan dengan doa.`
      },
      asesmenPenilaian: formAsesmen.trim(),
      attendanceSummary: {
        totalStudents: Number(formTotalStudents) || 30,
        hadir: hadirCount,
        sakit: Number(formSakit) || 0,
        izin: Number(formIzin) || 0,
        alpa: Number(formAlpa) || 0
      },
      absentStudents: absentArray,
      reflection:
        formReflection.trim() ||
        `Pembelajaran Kelas ${className} berjalan kondusif, interaktif, dan mencapai target ketuntasan tujuan pembelajaran.`,
      tindakLanjut:
        formTindakLanjut.trim() ||
        `Mencatat perkembangan kehadiran serta keaktifan siswa dan memberikan penguatan materi bagi siswa yang membutuhkan.`,
      status: formStatus,
      teacherName: teacherProfile.fullName,
      teacherNip: teacherProfile.nip,
      principalName: teacherProfile.principalName || appSettings.principalName,
      principalNip: teacherProfile.principalNip || appSettings.principalNip,
      schoolName: teacherProfile.schoolName || appSettings.schoolName || 'SDN Ciketing Udik 2',
      photos: formPhotos,
      linkedEKinerjaActivityId: editingJournal?.linkedEKinerjaActivityId,
      linkedPeriodId: editingJournal?.linkedPeriodId
    };

    let saved = StorageService.saveJournal(payload, activeTeacherId);

    if (autoSendToEKinerja) {
      saved = syncJournalToEKinerja(saved);
      showToast(
        `Jurnal Mengajar Kelas ${saved.className} berhasil disimpan & ditautkan otomatis sebagai Bukti Fisik E-Kinerja Harian!`,
        'success'
      );
    } else {
      showToast(`Jurnal Mengajar Kelas ${saved.className} berhasil disimpan!`, 'success');
    }

    setModalOpen(false);
    setEditingJournal(null);
    refreshData();
  };

  const handleManualSyncToEKinerja = (jrn: TeachingJournal) => {
    syncJournalToEKinerja(jrn);
    refreshData();
    showToast(
      `Jurnal Mengajar Kelas ${jrn.className} (${jrn.date}) berhasil dikirim ke Bukti Fisik E-Kinerja Harian!`,
      'success'
    );
  };

  const handleDeleteJournal = (id: string) => {
    StorageService.deleteJournal(id);
    setDeleteConfirmId(null);
    refreshData();
    showToast('Jurnal Mengajar berhasil dihapus.', 'info');
  };

  const handlePrintSingleJournal = (jrn: TeachingJournal) => {
    const html = buildOfficialJournalHtml(jrn, teacherProfile, appSettings, true);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const handlePrintMonthlyRecap = () => {
    if (filteredJournals.length === 0) {
      showToast('Tidak ada data Jurnal Mengajar untuk dicetak!', 'error');
      return;
    }

    const schoolNameUpper = (teacherProfile.schoolName || appSettings.schoolName || 'SDN CIKETING UDIK 2 BANTARGEBANG').toUpperCase();
    const schoolAddress = teacherProfile.schoolAddress || appSettings.schoolAddress || 'Jl. Raya Ciketing Udik No. 2, Kecamatan Bantargebang, Kota Bekasi';
    const principalName = teacherProfile.principalName || appSettings.principalName || 'Hj. Siti Rohmah, M.Pd.';
    const principalNip = teacherProfile.principalNip || appSettings.principalNip || '197405101998022001';
    const teacherSig = teacherProfile.signatureDataUrl || DEFAULT_TEACHER_SIGNATURE;
    const principalSig = teacherProfile.principalSignatureDataUrl || DEFAULT_PRINCIPAL_SIGNATURE;

    const sortedAsc = [...filteredJournals].sort((a, b) => a.date.localeCompare(b.date));

    const rowsHtml = sortedAsc
      .map((j, idx) => {
        const att = j.attendanceSummary || {
          totalStudents: 30,
          hadir: 30 - (j.absentStudents?.length || 0),
          sakit: j.absentStudents?.length || 0,
          izin: 0,
          alpa: 0
        };
        return `
          <tr>
            <td style="text-align:center; font-weight:700;">${idx + 1}</td>
            <td>
              <div style="font-weight:700;">${formatHariTanggalIndo(j.date)}</div>
              <div style="font-size:10px; color:#475569;">Jam ke-${j.jamKe || '1-4'} (${j.alokasiWaktuJP || 4} JP)</div>
            </td>
            <td style="text-align:center; font-weight:800;">Kelas ${j.className}</td>
            <td>
              <div style="font-size:10px; font-weight:700; color:#047857; text-transform:uppercase;">${j.elemenDomain || 'PAI & Budi Pekerti'}</div>
              <div style="font-weight:700; color:#0f172a; margin-top:2px;">${j.topic}</div>
              ${j.subTopic ? `<div style="font-size:10px; color:#334155; margin-top:2px;">Sub: ${j.subTopic}</div>` : ''}
            </td>
            <td style="font-size:10.5px;">${j.learningObjective}</td>
            <td style="font-size:10.5px;">
              <div><b>Metode:</b> ${j.metodePembelajaran || 'Diskusi & Demonstrasi'}</div>
              <div style="margin-top:3px;"><b>Presensi:</b> Hadir ${att.hadir}/${att.totalStudents} (S:${att.sakit}, I:${att.izin}, A:${att.alpa})</div>
              ${j.absentStudents && j.absentStudents.length > 0 ? `<div style="font-size:9.5px; color:#b45309;">Absen: ${j.absentStudents.join(', ')}</div>` : ''}
            </td>
            <td style="font-size:10.5px;">
              <div><b>Refleksi:</b> ${j.reflection}</div>
              ${j.tindakLanjut ? `<div style="margin-top:3px; color:#047857;"><b>RTL:</b> ${j.tindakLanjut}</div>` : ''}
            </td>
            <td style="text-align:center; font-weight:800; color:${j.status === 'Tuntas' ? '#047857' : '#b45309'};">
              ${j.status}
            </td>
          </tr>
        `;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>REKAPITULASI JURNAL MENGAJAR GURU - BUKTI FISIK E-KINERJA</title>
  <style>
    @page { size: A4 landscape; margin: 10mm 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #0f172a;
      background: #e2e8f0;
      margin: 0;
      padding: 20px;
      font-size: 11px;
    }
    .toolbar {
      max-width: 297mm;
      margin: 0 auto 14px auto;
      background: #0f172a;
      color: white;
      padding: 12px 18px;
      border-radius: 10px;
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
      font-weight: 700;
      cursor: pointer;
    }
    .sheet {
      max-width: 297mm;
      margin: 0 auto;
      background: white;
      padding: 12mm 14mm;
      border-radius: 6px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
    }
    .kop {
      text-align: center;
      border-bottom: 3px double #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .kop h2 { margin: 2px 0; font-size: 16px; font-weight: 900; text-transform: uppercase; }
    .kop p { margin: 0; font-size: 11px; color: #334155; }
    .identity-bar {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 11.5px;
    }
    table.recap {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    table.recap th, table.recap td {
      border: 1px solid #1e293b;
      padding: 6px 8px;
      vertical-align: top;
    }
    table.recap th {
      background: #e2e8f0;
      text-transform: uppercase;
      font-size: 10px;
      font-weight: 800;
    }
    .sig-row {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      page-break-inside: avoid;
    }
    .sig-box { width: 38%; text-align: center; }
    .sig-space { height: 60px; display: flex; align-items: center; justify-content: center; }
    @media print {
      body { background: white; padding: 0; }
      .toolbar { display: none !important; }
      .sheet { box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div>
      <strong>REKAPITULASI JURNAL MENGAJAR GURU — BUKTI FISIK PELAKSANAAN E-KINERJA (${sortedAsc.length} PERTEMUAN)</strong>
    </div>
    <div style="display:flex; gap:8px;">
      <button onclick="window.print()">🖨️ Cetak / Simpan PDF Rekap Jurnal (A4 Landscape)</button>
      <button style="background:#334155;" onclick="window.close()">Tutup</button>
    </div>
  </div>

  <div class="sheet">
    <div class="kop">
      <p style="font-weight:700; text-transform:uppercase;">PEMERINTAH KOTA BEKASI • DINAS PENDIDIKAN</p>
      <h2>REKAPITULASI JURNAL PELAKSANAAN PEMBELAJARAN (JURNAL MENGAJAR GURU)</h2>
      <p><b>${schoolNameUpper}</b> • ${schoolAddress}</p>
    </div>

    <div class="identity-bar">
      <div>
        <div><b>Nama Pendidik:</b> ${teacherProfile.fullName} (NIP. ${teacherProfile.nip || '-'})</div>
        <div><b>Jabatan / Pangkat:</b> ${teacherProfile.jabatan || 'Guru PAI'} (${teacherProfile.pangkatGolongan || '-'})</div>
      </div>
      <div style="text-align:right;">
        <div><b>Mata Pelajaran:</b> ${teacherProfile.subject || 'Pendidikan Agama Islam & Budi Pekerti'}</div>
        <div><b>Tahun Ajaran:</b> ${teacherProfile.academicYear || appSettings.academicYear || '2026/2027'} • <b>Total Pertemuan:</b> ${sortedAsc.length} Sesi</div>
      </div>
    </div>

    <table class="recap">
      <thead>
        <tr>
          <th style="width:32px;">No</th>
          <th style="width:125px;">Hari / Tanggal &amp; JP</th>
          <th style="width:65px;">Kelas</th>
          <th style="width:185px;">Elemen &amp; Materi Pokok</th>
          <th style="width:200px;">Tujuan Pembelajaran (TP)</th>
          <th style="width:170px;">Metode &amp; Presensi Siswa</th>
          <th>Refleksi &amp; Tindak Lanjut (RTL)</th>
          <th style="width:70px;">Ketuntasan</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="sig-row">
      <div class="sig-box">
        <div>Mengetahui,<br/>Kepala ${teacherProfile.schoolName || 'Sekolah'}</div>
        <div class="sig-space">
          ${principalSig ? `<img src="${principalSig}" alt="TTD" style="max-height:55px; max-width:150px; object-fit:contain;" />` : ''}
        </div>
        <div style="font-weight:800; text-decoration:underline;">${principalName}</div>
        <div>NIP. ${principalNip}</div>
      </div>

      <div class="sig-box">
        <div>Bekasi, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Mata Pelajaran / Kelas</div>
        <div class="sig-space">
          ${teacherSig ? `<img src="${teacherSig}" alt="TTD" style="max-height:55px; max-width:150px; object-fit:contain;" />` : ''}
        </div>
        <div style="font-weight:800; text-decoration:underline;">${teacherProfile.fullName}</div>
        <div>NIP. ${teacherProfile.nip || '-'}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const handleExportExcel = () => {
    if (filteredJournals.length === 0) {
      showToast('Belum ada data jurnal untuk diekspor ke Excel.', 'error');
      return;
    }

    const rows = filteredJournals.map((j, idx) => ({
      No: idx + 1,
      'Hari / Tanggal': formatHariTanggalIndo(j.date),
      Kelas: j.className,
      Semester: j.semester || 'Ganjil',
      'Jam Ke': j.jamKe || '1 - 4',
      'Alokasi JP': j.alokasiWaktuJP || 4,
      'Elemen CP': j.elemenDomain || 'PAI & Budi Pekerti',
      'Materi Pokok': j.topic,
      'Sub Materi': j.subTopic || '-',
      'Tujuan Pembelajaran': j.learningObjective,
      'Metode Pembelajaran': j.metodePembelajaran || '-',
      'Media & Sumber Belajar': j.mediaSumberBelajar || '-',
      'Total Siswa': j.attendanceSummary?.totalStudents || 30,
      Hadir: j.attendanceSummary?.hadir || 30,
      Sakit: j.attendanceSummary?.sakit || 0,
      Izin: j.attendanceSummary?.izin || 0,
      Alpa: j.attendanceSummary?.alpa || 0,
      'Siswa Tidak Hadir': (j.absentStudents || []).join(', ') || 'Nihil',
      'Refleksi Pembelajaran': j.reflection,
      'Tindak Lanjut (RTL)': j.tindakLanjut || '-',
      Status: j.status,
      'Bukti Fisik E-Kinerja': j.linkedEKinerjaActivityId ? 'Tersinkron ke E-Kinerja' : 'Belum'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jurnal Mengajar');
    XLSX.writeFile(
      wb,
      `Bukti_Fisik_Jurnal_Mengajar_${(teacherProfile.fullName || 'Guru').replace(/\s+/g, '_')}.xlsx`
    );
    showToast('File Excel Bukti Fisik Jurnal Mengajar berhasil diunduh!', 'success');
  };

  // Filtered list
  const filteredJournals = useMemo(() => {
    return journals
      .filter(j => {
        if (filterClass !== 'all' && j.classId !== filterClass && j.className !== filterClass) {
          return false;
        }
        if (filterStatus !== 'all' && j.status !== filterStatus) {
          return false;
        }
        if (filterMonth !== 'all') {
          const { month } = getMonthYearFromDate(j.date);
          if (month.toLowerCase() !== filterMonth.toLowerCase()) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTopic = j.topic.toLowerCase().includes(q);
          const matchSub = (j.subTopic || '').toLowerCase().includes(q);
          const matchTp = j.learningObjective.toLowerCase().includes(q);
          const matchCls = j.className.toLowerCase().includes(q);
          return matchTopic || matchSub || matchTp || matchCls;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [journals, filterClass, filterStatus, filterMonth, searchQuery]);

  // Statistics
  const totalJournals = journals.length;
  const totalJPTaught = journals.reduce((sum, j) => sum + (j.alokasiWaktuJP || 4), 0);
  const syncedEKinerjaCount = journals.filter(j => Boolean(j.linkedEKinerjaActivityId)).length;
  const tuntasCount = journals.filter(j => j.status === 'Tuntas').length;

  return (
    <div className="space-y-6">
      {/* ============================================================================
          HEADER BANNER: JURNAL MENGAJAR PROFESIONAL (BUKTI FISIK E-KINERJA)
         ============================================================================ */}
      <div className="relative overflow-hidden rounded-3xl glass-strong border border-emerald-500/25 p-5 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Instrumen Bukti Fisik Pelaksanaan Pembelajaran</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300">{teacherProfile.schoolName || 'SDN Ciketing Udik 2'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-300">Terintegrasi Lampiran 2 E-Kinerja</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-display text-white tracking-tight">
              Jurnal Mengajar Harian Guru
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Susun jurnal pelaksanaan pembelajaran harian lengkap dengan Capaian/Tujuan Pembelajaran (CP/TP), rincian kegiatan (Pendahuluan, Inti, Penutup), presensi siswa, refleksi, dan pengesahan Kepala Sekolah. Setiap jurnal dapat langsung dijadikan <b>Dokumen Bukti Fisik Utuh pada E-Kinerja Harian</b>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Jurnal Mengajar Baru</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintMonthlyRecap}
                className="flex-1 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cetak Rekap Bukti Fisik</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                <span>Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Teacher Bar */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Pendidik: {teacherProfile.fullName}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-300">NIP. {teacherProfile.nip || '-'}</span>
            <span aria-hidden="true">·</span>
            <span>Kepala Sekolah: <b className="text-white">{teacherProfile.principalName || appSettings.principalName}</b></span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="journal-teacher-select" className="text-slate-400 font-semibold">
              Pilih Guru:
            </label>
            <select
              id="journal-teacher-select"
              value={activeTeacherId}
              onChange={e => handleSwitchTeacher(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.schoolName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================================
          SUMMARY METRICS
         ============================================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass rounded-2xl p-4 sm:p-5 border border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Jurnal Mengajar
            </span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display text-white tabular-nums">
              {totalJournals}
            </p>
            <p className="text-[11px] text-emerald-400 mt-0.5">Pertemuan Tercatat</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 sm:p-5 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Jam Pelajaran
            </span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display text-white tabular-nums">
              {totalJPTaught} <span className="text-sm font-normal text-slate-400">JP</span>
            </p>
            <p className="text-[11px] text-cyan-300 mt-0.5">Beban Tatap Muka Terlaksana</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 sm:p-5 border border-teal-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Bukti Fisik E-Kinerja
            </span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display text-white tabular-nums">
              {syncedEKinerjaCount}
            </p>
            <p className="text-[11px] text-teal-300 mt-0.5">Tersinkron ke Laporan E-Kinerja</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 sm:p-5 border border-amber-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ketercapaian Materi
            </span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display text-white tabular-nums">
              {tuntasCount}/{totalJournals || 0}
            </p>
            <p className="text-[11px] text-amber-300 mt-0.5">Pertemuan Berstatus Tuntas</p>
          </div>
        </div>
      </div>

      {/* ============================================================================
          FILTER & SEARCH BAR
         ============================================================================ */}
      <div className="glass rounded-2xl p-4 border border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari materi pokok, sub-materi, tujuan pembelajaran, atau kelas..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Filter:</span>
          </div>

          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Kelas &amp; Rombel (1A - 6C)</option>
            {GRADE_LEVELS.map(grade => (
              <optgroup key={grade} label={`Tingkat Kelas ${grade}`}>
                {ROMBEL_LETTERS.map(rombel => {
                  const classId = `c-${grade}${rombel.toLowerCase()}`;
                  const className = `${grade}${rombel}`;
                  return (
                    <option key={classId} value={classId}>
                      Kelas {className} (Tingkat {grade} - Rombel {rombel})
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>

          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Bulan</option>
            {MONTHS_INDO.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="Tuntas">Tuntas</option>
            <option value="Belum Tuntas">Belum Tuntas</option>
          </select>

          {onNavigate && (
            <button
              onClick={() => onNavigate('e-kinerja')}
              className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Buka E-Kinerja Harian</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================================
          JOURNAL CARDS & TABLE LIST
         ============================================================================ */}
      {filteredJournals.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center border border-dashed border-white/15 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Belum Ada Jurnal Mengajar</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Buat jurnal mengajar harian pertama Anda. Jurnal yang dibuat akan otomatis memiliki format resmi Bukti Fisik E-Kinerja lengkap dengan pengesahan Kepala Sekolah.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Jurnal Mengajar Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJournals.map((jrn, index) => {
            const att = jrn.attendanceSummary || {
              totalStudents: 30,
              hadir: 30 - (jrn.absentStudents?.length || 0),
              sakit: jrn.absentStudents?.length || 0,
              izin: 0,
              alpa: 0
            };

            return (
              <div
                key={jrn.id}
                className="glass rounded-2xl p-5 border border-white/10 hover:border-emerald-500/35 transition-all space-y-4"
              >
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-bold text-emerald-300 font-mono">
                        #{filteredJournals.length - index}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-white">{formatHariTanggalIndo(jrn.date)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-cyan-300 font-bold">Kelas {jrn.className}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Jam ke-{jrn.jamKe || '1 - 4'} ({jrn.alokasiWaktuJP || 4} JP)
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-300">{jrn.elemenDomain || 'PAI & Budi Pekerti'}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-white font-display">
                      {jrn.topic}
                    </h3>
                    {jrn.subTopic && (
                      <p className="text-xs text-slate-300">Sub-Materi: {jrn.subTopic}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => setPreviewJournal(jrn)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Pratinjau</span>
                    </button>

                    <button
                      onClick={() => handlePrintSingleJournal(jrn)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Bukti Fisik</span>
                    </button>

                    <button
                      onClick={() => handleManualSyncToEKinerja(jrn)}
                      title="Kirim atau perbarui sebagai Bukti Fisik pada E-Kinerja Harian"
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        jrn.linkedEKinerjaActivityId
                          ? 'bg-teal-500/15 border-teal-500/30 text-teal-300 hover:bg-teal-500/25'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                      }`}
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>
                        {jrn.linkedEKinerjaActivityId
                          ? 'Tersinkron E-Kinerja'
                          : 'Jadikan Bukti E-Kinerja'}
                      </span>
                    </button>

                    <button
                      onClick={() => openEditModal(jrn)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                      title="Edit Jurnal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(jrn.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 cursor-pointer"
                      title="Hapus Jurnal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase block">
                        Tujuan Pembelajaran (TP)
                      </span>
                      <p className="text-slate-200 leading-relaxed mt-0.5">
                        {jrn.learningObjective}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase block">
                        Metode &amp; Media
                      </span>
                      <p className="text-slate-300 mt-0.5">
                        {jrn.metodePembelajaran || 'Pembelajaran Interaktif KBC'} •{' '}
                        {jrn.mediaSumberBelajar || 'Buku Teks & LKPD'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase block">
                        Refleksi Pembelajaran
                      </span>
                      <p className="text-slate-200 leading-relaxed mt-0.5">{jrn.reflection}</p>
                    </div>
                    {jrn.tindakLanjut && (
                      <div>
                        <span className="text-[11px] font-bold text-emerald-400 uppercase block">
                          Rencana Tindak Lanjut (RTL)
                        </span>
                        <p className="text-emerald-200/90 leading-relaxed mt-0.5">
                          {jrn.tindakLanjut}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">
                          Presensi Kelas {jrn.className}
                        </span>
                        <span
                          className={`text-[11px] font-bold ${
                            jrn.status === 'Tuntas' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          Status: {jrn.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold pt-1">
                        <span className="text-white">Total: {att.totalStudents}</span>
                        <span className="text-emerald-400">Hadir: {att.hadir}</span>
                        <span className="text-amber-400">Sakit: {att.sakit}</span>
                        <span className="text-cyan-400">Izin: {att.izin}</span>
                        <span className="text-rose-400">Alpa: {att.alpa}</span>
                      </div>

                      <p className="text-[11px] text-slate-400 pt-1">
                        Ketidakhadiran:{' '}
                        <span className="text-slate-200">
                          {jrn.absentStudents && jrn.absentStudents.length > 0
                            ? jrn.absentStudents.join(', ')
                            : 'Nihil (Hadir 100%)'}
                        </span>
                      </p>
                    </div>

                    {jrn.photos && jrn.photos.length > 0 && (
                      <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                        <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-[11px] text-amber-300 font-semibold">
                          {jrn.photos.length} Foto Dokumentasi Mengajar Terlampir
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================================
          MODAL CREATE / EDIT JURNAL MENGAJAR PROFESIONAL
         ============================================================================ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white font-display flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  <span>
                    {editingJournal
                      ? `Edit Jurnal Mengajar Kelas ${editingJournal.className}`
                      : 'Buat Jurnal Mengajar Profesional (Bukti Fisik E-Kinerja)'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dilengkapi asisten pengisian cepat CP/TP Kurikulum Merdeka &amp; integrasi otomatis ke Lampiran Bukti Fisik E-Kinerja
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveJournal} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
              {/* Row 1: Tanggal, Kelas, Semester, Jam Ke, Alokasi JP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tanggal Mengajar *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Kelas / Rombel *</label>
                  <select
                    value={formClassId}
                    onChange={e => {
                      const cId = e.target.value;
                      setFormClassId(cId);
                      const found = allClassOptions.find(c => c.id === cId || c.className === cId);
                      if (found && found.studentCount) {
                        setFormTotalStudents(found.studentCount);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    {GRADE_LEVELS.map(grade => (
                      <optgroup key={grade} label={`Tingkat Kelas ${grade}`}>
                        {ROMBEL_LETTERS.map(rombel => {
                          const classId = `c-${grade}${rombel.toLowerCase()}`;
                          const className = `${grade}${rombel}`;
                          const found = allClassOptions.find(
                            c => c.id === classId || c.className === className
                          );
                          const studentTotal = found?.studentCount || 30;
                          return (
                            <option key={classId} value={classId}>
                              Kelas {className} — Rombel {rombel} ({studentTotal} Siswa)
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Semester</label>
                  <select
                    value={formSemester}
                    onChange={e => setFormSemester(e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Jam Pelajaran Ke-</label>
                  <input
                    type="text"
                    value={formJamKe}
                    onChange={e => setFormJamKe(e.target.value)}
                    placeholder="Contoh: 1 - 4"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Alokasi (JP)</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={formAlokasiJP}
                      onChange={e => setFormAlokasiJP(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Pertemuan</label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={formPertemuanKe}
                      onChange={e => setFormPertemuanKe(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Auto-Fill from Curriculum Bank */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Pilih Cepat Materi &amp; TP dari Katalog Kurikulum Merdeka (Opsional):</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSmartGenerateNarratives}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all w-fit"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Susun Otomatis Narasi KBM &amp; Refleksi</span>
                  </button>
                </div>

                {matchingCurriculumTopics.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) handleApplyCurriculumTopic(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-white font-semibold focus:outline-none"
                  >
                    <option value="">
                      -- Klik untuk memilih Bab / Materi Pokok &amp; mengisi otomatis TP + Kegiatan --
                    </option>
                    {matchingCurriculumTopics.map(t => (
                      <option key={t.id} value={t.id}>
                        Bab {t.chapterNo}: {t.chapterTitle} ({t.domain} — {t.timeAllocationJP} JP)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Row 2: Elemen, Materi Pokok, Sub-Materi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Elemen / Domain CP *</label>
                  <select
                    value={formElemen}
                    onChange={e => setFormElemen(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    {ELEMEN_OPTIONS.map(el => (
                      <option key={el} value={el}>
                        {el}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 mb-1">
                    Materi Pokok / Topik Pembelajaran *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTopic}
                    onChange={e => setFormTopic(e.target.value)}
                    placeholder="Contoh: Membaca dan Menghafal Surah Al-Ma'un dengan Tajwid yang Benar"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Sub-Materi / Fokus Bahasan
                  </label>
                  <input
                    type="text"
                    value={formSubTopic}
                    onChange={e => setFormSubTopic(e.target.value)}
                    placeholder="Contoh: Lafaz Ayat 1-7, Hukum Mim Sukun, dan Sikap Peduli Anak Yatim"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Status Ketercapaian Pembelajaran
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'Tuntas' | 'Belum Tuntas')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Tuntas">Tuntas (Mencapai Target KKTP)</option>
                    <option value="Belum Tuntas">Belum Tuntas (Perlu Penguatan Lanjutan)</option>
                  </select>
                </div>
              </div>

              {/* Tujuan Pembelajaran */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Tujuan Pembelajaran (TP / Indikator Ketercapaian) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formLearningObjective}
                  onChange={e => setFormLearningObjective(e.target.value)}
                  placeholder="Uraikan tujuan pembelajaran yang ingin dicapai peserta didik pada pertemuan ini..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Metode & Media */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Metode / Model Pembelajaran
                  </label>
                  <input
                    type="text"
                    value={formMetode}
                    onChange={e => setFormMetode(e.target.value)}
                    list="metode-list"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <datalist id="metode-list">
                    {METODE_TEMPLATES.map(m => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Media, Alat &amp; Sumber Belajar
                  </label>
                  <input
                    type="text"
                    value={formMedia}
                    onChange={e => setFormMedia(e.target.value)}
                    list="media-list"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <datalist id="media-list">
                    {MEDIA_TEMPLATES.map(m => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Tahapan Kegiatan Pembelajaran */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  Rincian Tahapan Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">
                      1. Kegiatan Pendahuluan
                    </label>
                    <textarea
                      rows={3}
                      value={formPendahuluan}
                      onChange={e => setFormPendahuluan(e.target.value)}
                      placeholder="Salam, doa, tadarus, presensi, dan apersepsi..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">
                      2. Kegiatan Inti
                    </label>
                    <textarea
                      rows={3}
                      value={formInti}
                      onChange={e => setFormInti(e.target.value)}
                      placeholder="Eksplorasi materi, diskusi kelompok, praktik/LKPD..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">
                      3. Kegiatan Penutup
                    </label>
                    <textarea
                      rows={3}
                      value={formPenutup}
                      onChange={e => setFormPenutup(e.target.value)}
                      placeholder="Kesimpulan, refleksi karakter KBC, umpan balik, doa..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Rekap Presensi Peserta Didik */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Rekapitulasi Kehadiran Peserta Didik</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Total Siswa</label>
                    <input
                      type="number"
                      min={1}
                      value={formTotalStudents}
                      onChange={e => setFormTotalStudents(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-400 mb-1">Hadir (Otomatis)</label>
                    <input
                      type="number"
                      readOnly
                      value={Math.max(0, formTotalStudents - formSakit - formIzin - formAlpa)}
                      className="w-full px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-400 mb-1">Sakit (S)</label>
                    <input
                      type="number"
                      min={0}
                      value={formSakit}
                      onChange={e => setFormSakit(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-400 mb-1">Izin (I)</label>
                    <input
                      type="number"
                      min={0}
                      value={formIzin}
                      onChange={e => setFormIzin(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-rose-400 mb-1">Alpa (A)</label>
                    <input
                      type="number"
                      min={0}
                      value={formAlpa}
                      onChange={e => setFormAlpa(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Siswa Tidak Hadir &amp; Keterangan (pisahkan dengan koma, kosongkan jika hadir semua)
                  </label>
                  <input
                    type="text"
                    value={formAbsentText}
                    onChange={e => setFormAbsentText(e.target.value)}
                    placeholder="Contoh: Bilqis Humaira (Sakit), Ahmad Dani (Izin)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Asesmen, Refleksi, & Rencana Tindak Lanjut */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Asesmen / Penilaian Formatif
                  </label>
                  <textarea
                    rows={3}
                    value={formAsesmen}
                    onChange={e => setFormAsesmen(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Catatan Refleksi Pembelajaran *
                  </label>
                  <textarea
                    rows={3}
                    value={formReflection}
                    onChange={e => setFormReflection(e.target.value)}
                    placeholder="Evaluasi jalannya KBM dan respons peserta didik..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Rencana Tindak Lanjut (RTL) *
                  </label>
                  <textarea
                    rows={3}
                    value={formTindakLanjut}
                    onChange={e => setFormTindakLanjut(e.target.value)}
                    placeholder="Tindak lanjut remedial, pengayaan, atau pendampingan karakter..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dokumentasi Foto Mengajar */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>Foto Dokumentasi Pembelajaran di Kelas (Opsional)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Foto yang diunggah akan tampil pada lembar cetak Jurnal Mengajar sekaligus masuk ke Lampiran 1 E-Kinerja
                    </p>
                  </div>

                  <label className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer w-fit">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Tambah Foto KBM</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {formPhotos.map(p => (
                      <div
                        key={p.id}
                        className="relative rounded-xl overflow-hidden border border-white/15 bg-slate-900 group"
                      >
                        <img
                          src={p.dataUrl}
                          alt="Foto Mengajar"
                          className="w-full h-24 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormPhotos(prev => prev.filter(x => x.id !== p.id))}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 text-rose-300 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Opsi Integrasi Otomatis ke Bukti Fisik E-Kinerja Harian */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSendToEKinerja}
                    onChange={e => setAutoSendToEKinerja(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-emerald-300 text-xs sm:text-sm block">
                      Jadikan Bukti Fisik Otomatis pada Laporan E-Kinerja Harian
                    </span>
                    <span className="text-[11px] text-slate-300 block mt-0.5">
                      Saat dicentang, jurnal mengajar ini otomatis tercatat sebagai kegiatan harian di menu E-Kinerja dan melampirkan Dokumen Jurnal Mengajar Resmi ber-TTD pada Lampiran 2 Bukti Fisik.
                    </span>
                  </div>
                </label>

                {autoSendToEKinerja && periods[0]?.rkhList && periods[0].rkhList.length > 0 && (
                  <div className="pl-7">
                    <label className="block text-[11px] font-bold text-emerald-300 mb-1">
                      Tautkan pada Rencana Hasil Kerja (RKH) E-Kinerja:
                    </label>
                    <select
                      value={selectedRkhId}
                      onChange={e => setSelectedRkhId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-white text-xs font-semibold"
                    >
                      {periods[0].rkhList.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.code ? `${r.code}: ` : ''}
                          {r.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {autoSendToEKinerja
                      ? 'Simpan Jurnal & Kirim ke Bukti Fisik E-Kinerja'
                      : 'Simpan Jurnal Mengajar'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL PRATINJAU DOKUMEN RESMI BUKTI FISIK JURNAL MENGAJAR
         ============================================================================ */}
      {previewJournal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-slate-950">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>
                    Pratinjau Dokumen Bukti Fisik E-Kinerja — Jurnal Mengajar Kelas {previewJournal.className}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {formatHariTanggalIndo(previewJournal.date)} • {previewJournal.topic}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintSingleJournal(previewJournal)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Buka Tab Cetak / PDF</span>
                </button>
                <button
                  onClick={() => setPreviewJournal(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-200 overflow-hidden">
              <iframe
                title="Pratinjau Bukti Fisik Jurnal Mengajar"
                srcDoc={buildOfficialJournalHtml(previewJournal, teacherProfile, appSettings, false)}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          DELETE CONFIRMATION MODAL
         ============================================================================ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-white">Hapus Jurnal Mengajar?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan jurnal mengajar ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteJournal(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
