export type UserRole = 'admin' | 'siswa';

export interface UserSession {
  userId: string;
  role: UserRole;
  fullName: string;
  username: string;
  classId: string;
  className: string;
  nis?: string;
}

export interface ClassItem {
  id: string;
  className: string;
  homeroom: string;
  academicYear: string;
  studentCount?: number;
}

export interface Student {
  id: string;
  nis: string;
  fullName: string;
  classId: string;
  className?: string;
  username: string;
  password?: string;
  avatarColor?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
  notes?: string;
}

export interface TeachingJournal {
  id: string;
  teacherId?: string;
  date: string; // YYYY-MM-DD
  classId: string;
  className: string;
  semester?: 'Ganjil' | 'Genap';
  academicYear?: string;
  jamKe?: string; // e.g. '1 - 4'
  alokasiWaktuJP?: number; // e.g. 4
  pertemuanKe?: number; // e.g. 1
  elemenDomain?: string; // Al-Qur'an & Hadis, Akidah, Akhlak, Fikih, Sejarah Peradaban Islam, Tematik, dll.
  topic: string;
  subTopic?: string;
  learningObjective: string;
  metodePembelajaran?: string;
  mediaSumberBelajar?: string;
  kegiatanPembelajaran?: {
    pendahuluan: string;
    inti: string;
    penutup: string;
  };
  asesmenPenilaian?: string;
  attendanceSummary?: {
    totalStudents: number;
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
  };
  absentStudents: string[];
  reflection: string;
  tindakLanjut: string;
  status: 'Tuntas' | 'Belum Tuntas';
  teacherName: string;
  teacherNip?: string;
  principalName?: string;
  principalNip?: string;
  schoolName: string;
  photos?: EKinerjaPhotoItem[];
  linkedEKinerjaActivityId?: string;
  linkedPeriodId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type QuestionType =
  | 'pg_standar'
  | 'pg_kompleks'
  | 'benar_salah'
  | 'menjodohkan'
  | 'isian_singkat'
  | 'essay';

export interface Question {
  id: string;
  quizId?: string;
  questionType: QuestionType;
  stimulus?: string; // TKA stimulus (cerita kontekstual, kasus keseharian anak SD di sekolah/rumah, atau ayat/hadis)
  question: string;
  arabicText?: string; // Khat Naskh berharakat lengkap
  options: string[];
  matchingPairs?: Array<{ left: string; right: string }>; // Pasangan pernyataan & jawaban untuk tipe soal menjodohkan
  correctAnswer: string | string[]; // For single or multiple correct answers
  scoreWeight: number;
  classId: string; // '1' - '6' or class uuid
  className?: string;
  semester: 'Ganjil' | 'Genap';
  domain?: string; // Elemen Kurikulum Merdeka (Al-Qur'an & Hadis, Akidah, Akhlak, Fikih, SPI)
  approach?: string; // e.g. "KBC (Kurikulum Berbasis Cinta)"
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  classId: string;
  className?: string;
  durationMinutes: number;
  deadline?: string;
  randomize: boolean;
  showScoreImmediately: boolean;
  totalQuestions: number;
  status: 'published' | 'draft' | 'closed';
  semester: 'Ganjil' | 'Genap';
  questionIds: string[];
  customQuestions?: Question[]; // For quizzes where questions are not saved to the global bank
  completed?: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName?: string;
  className?: string;
  answers: Record<string, any>;
  score: number;
  maxScore: number;
  percentage: number;
  startedAt: string;
  submittedAt: string;
  status: 'submitted' | 'timeout';
}

export interface ScoreItem {
  id: string;
  studentId: string;
  quizId: string;
  attemptId: string;
  rawScore: number;
  maxScore: number;
  percentage: number;
  graded: boolean;
  quizTitle?: string;
  createdAt: string;
}

export interface Material {
  id: string;
  title: string;
  contentType: 'text' | 'video' | 'link' | 'audio';
  contentText: string;
  fileUrl?: string;
  classId: string;
  className?: string;
  subject: string;
  semester: 'Ganjil' | 'Genap';
  createdBy?: string;
  createdAt: string;
}

export interface ReadingReference {
  id: string;
  title: string;
  refType: 'juz_amma' | 'doa' | 'kisah_nabi' | 'link';
  category: string;
  arabicSnippet?: string;
  content: string;
  translation?: string;
  classId?: string;
  semester?: string;
  externalUrl?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  target: 'all' | 'class_id';
  classId?: string;
  targetLabel?: string;
  createdBy: string;
  createdAt: string;
}

export interface TeacherProfile {
  id?: string;
  fullName: string;
  nip: string;
  pangkatGolongan?: string;
  jabatan?: string;
  schoolName: string;
  jamKerja?: string;
  subject?: string;
  signatureDataUrl?: string;
  principalName?: string;
  principalNip?: string;
  principalSignatureDataUrl?: string;
  schoolAddress?: string;
  academicYear?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppSettings {
  principalName: string;
  principalNip: string;
  schoolName?: string;
  appLogoUrl: string;
  schoolAddress: string;
  academicYear: string;
}

export interface ClassTopicItem {
  id: string;
  classGrade: string; // '1' - '6'
  semester: 'Ganjil' | 'Genap';
  chapterNo: number;
  chapterTitle: string;
  subTopics: string[];
  domain: string; // Al-Qur'an Hadis, Akidah, Akhlak, Fiqih, Sejarah Peradaban Islam
  learningObjective: string;
  timeAllocationJP: number; // e.g. 12 (JP)
  targetMonth?: string; // e.g. 'Juli - Agustus'
  status: 'Tuntas' | 'Sedang Berjalan' | 'Belum Terlaksana';
  learningResources?: string;
  notes?: string;
}

export type TeachingDocType = 'cp_atp' | 'prota' | 'promes' | 'kktp' | 'modul_ajar' | 'lkpd' | 'lainnya';

export interface TeachingDocMeta {
  fase: 'Fase A' | 'Fase B' | 'Fase C';
  elementDomain: string; // Al-Qur'an & Hadis, Akidah, Akhlak, Fikih, Sejarah Peradaban Islam
  alokasiWaktuJP?: number;
  targetBab?: string;
  pendekatan: string; // 'Kurikulum Berbasis Cinta (KBC)'
  regulasi?: string; // 'Keputusan Kepala Badan Kebijakan Pendidikan Dasar dan Menengah (BKPDM) Nomor 020 Tahun 2026'
}

export interface TeachingDocument {
  id: string;
  docType: TeachingDocType;
  classGrade: string; // '1' - '6'
  semester: 'Ganjil' | 'Genap' | 'Tahunan';
  academicYear: string; // e.g. '2026/2027'
  title: string;
  summary?: string;
  schoolName: string;
  teacherName: string;
  teacherNip: string;
  principalName: string;
  principalNip: string;
  regulasi?: string;
  meta: TeachingDocMeta;
  contentData: {
    capaianPembelajaran?: string;
    alurTujuanPembelajaran?: Array<{
      no?: number;
      tujuan: string;
      materi: string;
      elemen: string;
      alokasiJP: number;
      profilPancasilaKBC: string;
      indikator: string;
    }>;
    protaItems?: Array<{
      no: number;
      semester: 'Ganjil' | 'Genap';
      elemen: string;
      materiPokok: string;
      tujuanPembelajaran: string;
      alokasiJP: number;
      keterangan?: string;
    }>;
    totalJPGanjil?: number;
    totalJPGenap?: number;
    totalJPTahunan?: number;
    promesItems?: Array<{
      no: number;
      materiPokok: string;
      tujuanPembelajaran: string;
      alokasiJP: number;
      distribusiBulan: Array<{
        bulan: string;
        minggu: number[]; // e.g. 4, 4, 4
      }>;
    }>;
    kktpItems?: Array<{
      no: number;
      tujuanPembelajaran: string;
      indikatorKetuntasan: string;
      kriteria: {
        perluBimbingan: string; // 0-60
        cukup: string; // 61-75
        baik: string; // 76-88
        sangatBaik: string; // 89-100
      };
      tindakLanjutKBC: string;
    }>;
    modulAjar?: {
      identitas: {
        penyusun: string;
        instansi: string;
        faseKelas: string;
        semester: string;
        materiPokok: string;
        alokasiWaktu: string;
      };
      kompetensiAwal: string;
      profilPelajarPancasilaKBC: string[];
      saranaPrasarana: string[];
      targetPesertaDidik: string;
      modelPembelajaran: string;
      komponenInti: {
        tujuanPembelajaran: string[];
        pemahamanBermakna: string;
        pertanyaanPemantik: string[];
        kegiatanPembelajaran: {
          pendahuluan: string[];
          kegiatanInti: string[];
          penutup: string[];
        };
        asesmen: {
          diagnostik: string;
          formatif: string;
          sumatif: string;
        };
        pengayaanRemedial: string;
        refleksi: string;
      };
      lampiran: {
        bahanBacaan: string;
        glosarium: string;
        daftarPustaka: string;
      };
    };
    lkpd?: {
      judulAktivitas: string;
      temaNilaiKBC: string;
      petunjukBelajar: string[];
      stimulusCerita: string;
      arabicSnippet?: {
        text: string;
        arti: string;
      };
      langkahAktivitas: string[];
      tugasSiswa: Array<{
        nomor: number;
        instruksi: string;
        tipe: 'pilihan' | 'isian' | 'centang';
        opsi?: string[];
      }>;
      refleksiCinta: string;
      rubrikNilai: string;
    };
    dokumenLainnya?: {
      subKategori: string; // e.g. 'Silabus PAI', 'Kisi-Kisi Soal', 'Program Remedial & Pengayaan', dll.
      tujuanDokumen: string;
      uraianIsi: string;
      tabelBaris?: Array<{
        no: number;
        aspek: string;
        uraian: string;
        keterangan: string;
      }>;
      tautanBukti?: string;
      lampiranFile?: {
        fileName: string;
        fileType: string;
        dataUrl: string;
      };
    };
    sandaranAcuan?: {
      referenceId?: string;
      referenceTitle: string;
      fileName?: string;
      fileType?: string;
      dataUrl?: string;
      ringkasanAcuan?: string;
    };
    catatanTambahan?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeachingReferenceDoc {
  id: string;
  title: string;
  docType: TeachingDocType;
  classGrade: string; // 'all' | '1' - '6'
  semester: 'Ganjil' | 'Genap' | 'Tahunan';
  elementDomain: string;
  fileName: string;
  fileType: string;
  fileSizeKb: number;
  dataUrl?: string;
  extractedText: string;
  extractedRows?: Array<{
    no: number;
    col1: string;
    col2: string;
    col3: string;
    col4?: string;
  }>;
  notes?: string;
  uploadedAt: string;
}

export type CalendarEventCategory = 'agenda' | 'libur' | 'ujian' | 'kbc_ibadah';

export interface AcademicCalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  category: CalendarEventCategory;
  description: string;
  targetClass?: string; // '' for all classes or '1' - '6'
  createdBy: string;
  createdAt: string;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  xpReward: number;
  conditionType: 'xp' | 'quiz' | 'material' | 'reference' | 'forum';
  conditionCount: number;
}

export interface StudentGamification {
  studentId: string;
  studentName?: string;
  nis?: string;
  classId?: string;
  className?: string;
  avatarColor?: string;
  xpPoints: number;
  quizXp?: number;
  activityXp?: number;
  bonusBadgeXp?: number;
  avgQuizScore?: number;
  level: number;
  levelTitle?: string;
  streakDays: number;
  readMaterialIds: string[];
  readReferenceIds: string[];
  completedQuizIds: string[];
  forumPostCount: number;
  kbcActCount?: number;
  completedKbcActIds?: string[];
  earnedBadgeIds: string[];
  lastActivityAt: string;
}

export interface HomeroomTeacherProfile {
  id: string;
  classId: string;
  className: string;
  gradeLevel: string; // '1' - '6'
  teacherName: string;
  nip: string;
  phone: string;
  email?: string;
  academicYear: string;
  studentCount: number;
  uploadedDocTypes: TeachingDocType[];
  lastSyncedAt: string;
  notes?: string;
}

export interface ForumReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
  isTeacherVerified?: boolean;
}

export interface ForumThread {
  id: string;
  classId: string;
  className: string;
  topicCategory: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  isPinned?: boolean;
  isResolved?: boolean;
  likes: string[];
  replies: ForumReply[];
}

export interface RemedialWeakQuiz {
  quizId: string;
  quizTitle: string;
  score: number | null;
  domain: string;
}

export interface RemedialRecommendation {
  id: string;
  studentId: string;
  studentName: string;
  nis: string;
  classId: string;
  className: string;
  gradeLevel: string;
  currentAvg: number;
  kktpThreshold: number;
  gapPoints: number;
  kktpCategory: 'Perlu Bimbingan (0-60)' | 'Cukup / Mendekati KKTP (61-74)' | 'Belum Mengikuti Evaluasi';
  weakQuizzes: RemedialWeakQuiz[];
  primaryDomain: string;
  diagnosticSummary: string;
  remedialMaterial: {
    title: string;
    domain: string;
    summary: string;
    keyPoints: string[];
    arabicVerse: string;
    arabicTranslation: string;
    kbcReflection: string;
  };
  specialAssignment: {
    title: string;
    type: 'Praktik Ibadah & Pembiasaan' | 'Lembar Kerja Terarah (LKPD Remedial)' | 'Proyek Kasih Sayang (KBC) & Akhlak' | 'Tadarus & Hafalan Terbimbing';
    instructions: string[];
    targetCompetency: string;
    deadlineDays: number;
    parentGuidance: string;
    evaluationRubric: string;
  };
  status: 'recommended' | 'assigned' | 'completed';
  source: 'gemini' | 'engine-kbc';
  assignedAt?: string;
  assignedMaterialId?: string;
  createdAt: string;
}

export interface EKinerjaRKHItem {
  id: string;
  code?: string;
  title: string;
}

export interface EKinerjaRencanaAksiItem {
  id: string;
  rkhId?: string;
  title: string;
}

export interface EKinerjaTindakLanjutItem {
  id: string;
  title: string;
}

export interface EKinerjaPhotoItem {
  id: string;
  dataUrl: string;
  caption?: string;
  originalSizeKb?: number;
  compressedSizeKb?: number;
  uploadedAt: string;
}

export interface EKinerjaDocumentItem {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'word' | 'other';
  mimeType: string;
  fileSizeKb: number;
  dataUrl: string;
  uploadedAt: string;
}

export type EKinerjaBuktiFisikType =
  | 'Foto Kegiatan'
  | 'Dokumen'
  | 'Foto Kegiatan dan Dokumen';

export type EKinerjaWorkMode = 'WFA' | 'WFO' | 'WFH';

export interface EKinerjaDailyActivity {
  id: string;
  teacherId?: string;
  periodId: string;
  date: string; // YYYY-MM-DD
  workMode?: EKinerjaWorkMode; // WFA (Work From Anywhere) | WFO (Kantor/Sekolah) | WFH (Rumah)
  locationName?: string; // e.g. "Dinas Luar", "Rumah", "SDN Ciketing Udik 2"
  locationCoords?: { latitude: number; longitude: number; accuracy?: number };
  rkhId?: string;
  rkhText?: string;
  rencanaAksiId?: string;
  rencanaAksiText: string;
  tindakLanjutText: string;
  tindakLanjutList?: string[];
  outputText?: string;
  buktiFisikType?: EKinerjaBuktiFisikType;
  photos: EKinerjaPhotoItem[];
  documents?: EKinerjaDocumentItem[];
  createdAt: string;
}

export interface EKinerjaNotaDinasAspect {
  id: string;
  aspekText: string;
  buktiFisikUrl: string;
}

export interface EKinerjaNotaDinasConfig {
  teacherId?: string;
  kepadaYth: string;
  dari: string;
  nip: string;
  nomorSurat: string;
  tanggalSurat: string; // YYYY-MM-DD
  lampiran: string;
  singkatanJabatan: string;
  jabatanLengkap: string;
  periodeText?: string;
  aspects: EKinerjaNotaDinasAspect[];
  signatureDataUrl?: string;
  principalName?: string;
  principalNip?: string;
  principalSignatureDataUrl?: string;
  updatedAt?: string;
}

export interface EKinerjaPeriod {
  id: string;
  teacherId?: string;
  month: string; // 'Januari' .. 'Desember'
  year: string;  // '2026', '2027', dll.
  jamKerja?: string; // e.g. '07.00-15.30'
  rkhList: EKinerjaRKHItem[];
  rencanaAksiList: EKinerjaRencanaAksiItem[];
  tindakLanjutList: EKinerjaTindakLanjutItem[];
  notaDinas?: EKinerjaNotaDinasConfig;
  savedAt?: string;
  createdAt: string;
}

export interface EKinerjaMasterRencanaAksi {
  id: string;
  title: string;
  defaultTindakLanjut?: string[];
  defaultOutput?: string;
}

export interface EKinerjaMasterItem {
  id: string;
  teacherId?: string;
  code: string; // e.g. 'RHK 1', 'RHK 2'
  category: 'Utama' | 'Tambahan';
  title: string;
  aspek?: 'Kualitas' | 'Kuantitas' | 'Waktu' | 'Biaya';
  indikator?: string;
  target?: string;
  rencanaAksiList: EKinerjaMasterRencanaAksi[];
  tindakLanjutTemplates: string[];
  isCustom?: boolean;
  createdAt?: string;
}

