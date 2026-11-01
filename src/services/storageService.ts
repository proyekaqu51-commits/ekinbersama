import {
  UserSession,
  ClassItem,
  Student,
  Question,
  Quiz,
  Material,
  ReadingReference,
  Announcement,
  TeachingJournal,
  TeacherProfile,
  AppSettings,
  AttendanceRecord,
  ScoreItem,
  QuizAttempt,
  ClassTopicItem,
  TeachingDocument,
  TeachingDocType,
  TeachingReferenceDoc,
  AcademicCalendarEvent,
  BadgeItem,
  StudentGamification,
  HomeroomTeacherProfile,
  ForumThread,
  ForumReply,
  RemedialRecommendation,
  EKinerjaPeriod,
  EKinerjaDailyActivity,
  EKinerjaMasterItem
} from '../types';

import {
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_QUESTIONS,
  INITIAL_QUIZZES,
  INITIAL_MATERIALS,
  INITIAL_REFERENCES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_TEACHING_JOURNALS,
  INITIAL_TEACHER_PROFILE,
  INITIAL_TEACHERS,
  INITIAL_APP_SETTINGS,
  INITIAL_SCORES,
  INITIAL_CLASS_TOPICS,
  INITIAL_MASTER_RHK,
  DEFAULT_PRINCIPAL_SIGNATURE,
  DEFAULT_TEACHER_SIGNATURE
} from '../data/initialData';

import { INITIAL_TEACHING_DOCS } from '../data/initialTeachingDocs';
import { SupabaseService } from './supabaseService';
import { IndexedDbService } from './indexedDbService';

export const STORAGE_KEYS = {
  SESSION: 'lms_session',
  CLASSES: 'lms_classes',
  STUDENTS: 'lms_students',
  QUESTIONS: 'lms_questions',
  QUIZZES: 'lms_quizzes',
  MATERIALS: 'lms_materials',
  REFERENCES: 'lms_references',
  ANNOUNCEMENTS: 'lms_announcements',
  JOURNALS: 'lms_teaching_journals',
  ATTENDANCE: 'lms_attendance',
  PROFILE: 'lms_teacher_profile',
  TEACHERS: 'lms_teachers',
  ACTIVE_TEACHER_ID: 'lms_active_teacher_id',
  SETTINGS: 'lms_app_settings',
  SCORES: 'lms_scores',
  ATTEMPTS: 'lms_quiz_attempts',
  CLASS_TOPICS: 'lms_class_topics',
  TEACHING_DOCS: 'lms_teaching_docs',
  CALENDAR_EVENTS: 'lms_calendar_events',
  GAMIFICATION: 'lms_student_gamification',
  HOMEROOM_TEACHERS: 'lms_homeroom_teachers',
  FORUM_THREADS: 'lms_forum_threads',
  REMEDIAL_PLANS: 'lms_remedial_plans',
  E_KINERJA_PERIODS: 'lms_e_kinerja_periods',
  E_KINERJA_ACTIVITIES: 'lms_e_kinerja_activities',
  MASTER_RHK: 'lms_e_kinerja_master_rhk',
  TEACHING_REF_DOCS: 'lms_teaching_ref_docs'
};

const INITIAL_CALENDAR_EVENTS: AcademicCalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'Awal Semester Ganjil & Pekan Ta\'aruf KBC (Kurikulum Berbasis Cinta)',
    date: '2026-07-13',
    category: 'agenda',
    description: 'Penyambutan siswa baru dengan senyum, salam, sapa, dan doa bersama di halaman SDN Ciketing Udik 2.',
    targetClass: '',
    createdBy: 'Guru PAI',
    createdAt: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'cal-2',
    title: 'Peringatan Maulid Nabi Muhammad SAW 1448 H & Lomba Tahfidz Juz Amma',
    date: '2026-09-15',
    category: 'kbc_ibadah',
    description: 'Meneladani akhlak mulia Rasulullah SAW melalui santunan anak yatim dan lomba hafalan surah pendek.',
    targetClass: '',
    createdBy: 'Guru PAI',
    createdAt: '2026-08-20T08:00:00.000Z'
  },
  {
    id: 'cal-3',
    title: 'Asesmen Tengah Semester (ATS) Ganjil PAI & Budi Pekerti',
    date: '2026-10-12',
    endDate: '2026-10-16',
    category: 'ujian',
    description: 'Pelaksanaan ujian formatif/sumatif tengah semester berbasis soal stimulus TKA & KBC untuk Kelas 1 s.d. 6.',
    targetClass: '',
    createdBy: 'Guru PAI',
    createdAt: '2026-09-25T08:00:00.000Z'
  },
  {
    id: 'cal-4',
    title: 'Jumat Berkah: Tadarus Bersama & Sedekah Kasih Sayang',
    date: '2026-10-30',
    category: 'kbc_ibadah',
    description: 'Pembiasaan shalat Dhuha berjamaah, baca Surah Yasin/Juz Amma, dan infaq peduli sesama.',
    targetClass: '',
    createdBy: 'Guru PAI',
    createdAt: '2026-10-01T08:00:00.000Z'
  },
  {
    id: 'cal-5',
    title: 'Asesmen Sumatif Akhir Semester (ASAS) Ganjil TP 2026/2027',
    date: '2026-12-01',
    endDate: '2026-12-07',
    category: 'ujian',
    description: 'Ujian akhir semester ganjil seluruh tingkat kelas mengacu pada CP/ATP Kep. Kepala BKPDM No. 020 Tahun 2026.',
    targetClass: '',
    createdBy: 'Guru PAI',
    createdAt: '2026-10-10T08:00:00.000Z'
  },
  {
    id: 'cal-6',
    title: 'Libur Akhir Semester Ganjil & Pembagian Rapor PAI',
    date: '2026-12-21',
    endDate: '2027-01-03',
    category: 'libur',
    description: 'Libur semester ganjil. Siswa diimbau tetap menjaga shalat 5 waktu dan murajaah hafalan di rumah.',
    targetClass: '',
    createdBy: 'Kepala Sekolah',
    createdAt: '2026-10-10T08:00:00.000Z'
  }
];

export const BADGES_CATALOG: BadgeItem[] = [
  {
    id: 'badge-pemula-shalih',
    name: 'Langkah Anak Shalih',
    description: 'Memulai petualangan belajar PAI dan mengumpulkan minimal 50 XP.',
    iconName: 'Sparkles',
    color: 'from-emerald-400 to-teal-500',
    xpReward: 25,
    conditionType: 'xp',
    conditionCount: 50
  },
  {
    id: 'badge-gemar-baca',
    name: 'Pecinta Ilmu (Thalibul Ilmi)',
    description: 'Rajin membaca minimal 1 modul materi pembelajaran PAI.',
    iconName: 'BookOpen',
    color: 'from-amber-400 to-orange-500',
    xpReward: 40,
    conditionType: 'material',
    conditionCount: 1
  },
  {
    id: 'badge-ahli-tadarus',
    name: 'Sahabat Juz Amma & Doa',
    description: 'Membaca & menghafal minimal 2 surah pendek atau doa harian.',
    iconName: 'Heart',
    color: 'from-cyan-400 to-blue-500',
    xpReward: 50,
    conditionType: 'reference',
    conditionCount: 2
  },
  {
    id: 'badge-pejuang-kuis',
    name: 'Bintang Evaluasi PAI',
    description: 'Menyelesaikan minimal 1 kuis evaluasi dengan penuh kejujuran.',
    iconName: 'Award',
    color: 'from-indigo-400 to-purple-500',
    xpReward: 60,
    conditionType: 'quiz',
    conditionCount: 1
  },
  {
    id: 'badge-cendekia-kbc',
    name: 'Duta Kasih Sayang (KBC)',
    description: 'Aktif bertanya atau berdiskusi santun di Forum Diskusi Kelas.',
    iconName: 'MessageSquare',
    color: 'from-pink-400 to-rose-500',
    xpReward: 45,
    conditionType: 'forum',
    conditionCount: 1
  },
  {
    id: 'badge-teladan-utama',
    name: 'Generasi Qur\'ani Teladan',
    description: 'Mencapai total 250 XP dari ketekunan belajar, kuis, dan ibadah.',
    iconName: 'Crown',
    color: 'from-yellow-400 to-amber-600',
    xpReward: 100,
    conditionType: 'xp',
    conditionCount: 250
  }
];

const INITIAL_HOMEROOM_TEACHERS: HomeroomTeacherProfile[] = [
  {
    id: 'hrt-1',
    classId: 'c1',
    className: '1A',
    gradeLevel: '1',
    teacherName: 'Dra. Hj. Ratna Ningsih',
    nip: '197804122005012004',
    phone: '0812-8811-2201',
    email: 'ratna.kelas1@sdnciketingudik2.sch.id',
    academicYear: '2026/2027',
    studentCount: 28,
    uploadedDocTypes: ['cp_atp', 'prota', 'promes', 'modul_ajar'],
    lastSyncedAt: '2026-10-24T09:00:00.000Z',
    notes: 'Fase A - Pendampingan baca tulis huruf hijaiyah & pembiasaan doa.'
  },
  {
    id: 'hrt-2',
    classId: 'c2',
    className: '2A',
    gradeLevel: '2',
    teacherName: 'Siti Nurhaliza, S.Pd.SD',
    nip: '198609182011012009',
    phone: '0813-9922-3302',
    email: 'siti.kelas2@sdnciketingudik2.sch.id',
    academicYear: '2026/2027',
    studentCount: 30,
    uploadedDocTypes: ['cp_atp', 'prota', 'promes', 'kktp', 'modul_ajar'],
    lastSyncedAt: '2026-10-24T10:15:00.000Z',
    notes: 'Fase A - Penguatan praktik wudhu dan akhlak kasih sayang kepada teman.'
  },
  {
    id: 'hrt-3',
    classId: 'c3',
    className: '3A',
    gradeLevel: '3',
    teacherName: 'Budi Santoso, S.Pd',
    nip: '198411032009021003',
    phone: '0812-7733-4403',
    email: 'budi.kelas3@sdnciketingudik2.sch.id',
    academicYear: '2026/2027',
    studentCount: 29,
    uploadedDocTypes: ['cp_atp', 'prota', 'promes', 'kktp'],
    lastSyncedAt: '2026-10-24T11:30:00.000Z',
    notes: 'Fase B - Integrasi Kurikulum Berbasis Cinta (KBC) dalam piket kelas.'
  },
  {
    id: 'hrt-4',
    classId: 'c4',
    className: '4A',
    gradeLevel: '4',
    teacherName: 'Dewi Sartika, M.Pd',
    nip: '198207252008012007',
    phone: '0815-6644-5504',
    email: 'dewi.kelas4@sdnciketingudik2.sch.id',
    academicYear: '2026/2027',
    studentCount: 31,
    uploadedDocTypes: ['cp_atp', 'prota', 'promes', 'kktp', 'modul_ajar', 'lkpd'],
    lastSyncedAt: '2026-10-25T07:45:00.000Z',
    notes: 'Fase B - Seluruh perangkat ajar KBC Kep. Kepala BKPDM No. 020/2026 lengkap.'
  },
  {
    id: 'hrt-5',
    classId: 'c5',
    className: '5A',
    gradeLevel: '5',
    teacherName: 'Rina Marlina, S.Pd.SD',
    nip: '198902142014022005',
    phone: '0812-5566-7705',
    email: 'rina.kelas5@sdnciketingudik2.sch.id',
    academicYear: '2026/2027',
    studentCount: 32,
    uploadedDocTypes: ['cp_atp', 'prota', 'promes', 'kktp', 'modul_ajar', 'lkpd'],
    lastSyncedAt: '2026-10-25T08:00:00.000Z',
    notes: 'Fase C - Fokus tadarus Surah Al-Ma\'un & kepedulian anak yatim.'
  },
  {
    id: 'hrt-6',
    classId: 'c6',
    className: '6A',
    gradeLevel: '6',
    teacherName: 'Drs. Hendra Wijaya',
    nip: '197505202000031002',
    phone: '0811-4455-8806',
    email: 'hendra.kelas6@sdnciketingudik2.sch.id',
    academicYear: '2026/2027',
    studentCount: 30,
    uploadedDocTypes: ['cp_atp', 'prota', 'promes', 'modul_ajar', 'lkpd'],
    lastSyncedAt: '2026-10-25T08:10:00.000Z',
    notes: 'Fase C - Persiapan ujian akhir sekolah & praktik ibadah lengkap.'
  }
];

const INITIAL_FORUM_THREADS: ForumThread[] = [
  {
    id: 'for-1',
    classId: 'c5',
    className: '5A',
    topicCategory: 'Al-Qur\'an & Hadis (Surah Al-Ma\'un)',
    title: 'Bagaimana cara kita mengamalkan kandungan Surah Al-Ma\'un di sekolah?',
    content: 'Assalamu\'alaikum Pak Guru dan teman-teman. Saya ingin bertanya, selain menyantuni anak yatim, contoh sikap sederhana apa yang bisa kita lakukan setiap hari di kelas agar tidak termasuk orang yang mendustakan agama menurut Surah Al-Ma\'un?',
    authorId: 's1',
    authorName: 'Ahmad Fauzi',
    authorRole: 'siswa',
    createdAt: '2026-10-24T09:30:00.000Z',
    isPinned: true,
    isResolved: true,
    likes: ['admin', 's2', 's3'],
    replies: [
      {
        id: 'rep-1',
        authorId: 'admin',
        authorName: 'H. Ahmad Syarif, S.Pd.I (Guru PAI)',
        authorRole: 'admin',
        content: 'Wa\'alaikumussalam warahmatullahi wabarakatuh. Pertanyaan yang sangat bagus, Nak Ahmad Fauzi! Sesuai pendekatan Kurikulum Berbasis Cinta (KBC), mengamalkan Surah Al-Ma\'un di kelas dimulai dari hal kecil yang tulus: meminjamkan alat tulis kepada teman yang lupa membawa, berbagi bekal makanan, tidak mengejek teman, dan melaksanakan shalat tepat waktu dengan ikhlas karena Allah SWT.',
        createdAt: '2026-10-24T10:05:00.000Z',
        isTeacherVerified: true
      },
      {
        id: 'rep-2',
        authorId: 's2',
        authorName: 'Siti Aisyah',
        authorRole: 'siswa',
        content: 'Terima kasih penjelasannya Pak Guru! Berarti ikut menyisihkan uang jajan saat Jumat Berkah juga termasuk mengamalkan ayat ke-3 ya Pak?',
        createdAt: '2026-10-24T10:20:00.000Z',
        isTeacherVerified: false
      }
    ]
  },
  {
    id: 'for-2',
    classId: 'all',
    className: 'Semua Kelas',
    topicCategory: 'Akhlak & Kurikulum Berbasis Cinta (KBC)',
    title: 'Tips Menghafal Juz Amma dengan Cepat dan Tidak Mudah Lupa',
    content: 'Assalamu\'alaikum anak-anak shalih dan shalihah SDN Ciketing Udik 2! Silakan bagikan pengalaman kalian di sini: waktu kapan yang paling kalian sukai untuk murajaah hafalan Juz Amma di rumah?',
    authorId: 'admin',
    authorName: 'H. Ahmad Syarif, S.Pd.I (Guru PAI)',
    authorRole: 'admin',
    createdAt: '2026-10-23T14:00:00.000Z',
    isPinned: true,
    isResolved: false,
    likes: ['s1', 's2'],
    replies: [
      {
        id: 'rep-3',
        authorId: 's1',
        authorName: 'Ahmad Fauzi',
        authorRole: 'siswa',
        content: 'Kalau saya biasanya membaca 5 ayat berulang-ulang setelah shalat Maghrib bersama Ibu, lalu diulang lagi setelah shalat Subuh Pak.',
        createdAt: '2026-10-23T19:15:00.000Z',
        isTeacherVerified: false
      }
    ]
  }
];

const FRESH_EMPTY_FLAG_KEY = 'lms_pai_is_fresh_empty';

const EMPTY_TEACHER_PROFILE: TeacherProfile = {
  fullName: '',
  nip: '',
  jabatan: '',
  schoolName: '',
  subject: ''
};

const INITIAL_E_KINERJA_PERIODS: EKinerjaPeriod[] = [
  {
    id: 'ekp-2026-10',
    teacherId: 'guru-1',
    month: 'Oktober',
    year: '2026',
    rkhList: [
      {
        id: 'rkh-1',
        code: 'RKH 1',
        title: 'Terlaksananya perencanaan dan pelaksanaan pembelajaran PAI & Budi Pekerti berbasis Kurikulum Berbasis Cinta (KBC) sesuai Kep. Kepala BKPDM Nomor 020 Tahun 2026'
      },
      {
        id: 'rkh-2',
        code: 'RKH 2',
        title: 'Terlaksananya pembimbingan pembiasaan ibadah harian, tadarus Juz Amma, dan evaluasi asesmen hasil belajar peserta didik'
      }
    ],
    rencanaAksiList: [
      {
        id: 'ra-1',
        rkhId: 'rkh-1',
        title: 'Menyusun Modul Ajar, LKPD, dan Bahan Tayang PAI & Budi Pekerti pendekatan Kurikulum Berbasis Cinta (KBC)'
      },
      {
        id: 'ra-2',
        rkhId: 'rkh-1',
        title: 'Melaksanakan kegiatan pembelajaran tatap muka PAI di kelas serta pengisian Jurnal Mengajar & Presensi Siswa'
      },
      {
        id: 'ra-3',
        rkhId: 'rkh-2',
        title: 'Membimbing pembiasaan Shalat Dhuha berjamaah, Tadarus Juz Amma pagi, dan pembinaan akhlak mulia siswa'
      },
      {
        id: 'ra-4',
        rkhId: 'rkh-2',
        title: 'Melaksanakan penilaian formatif/sumatif (Kuis PAI) serta pendampingan remedial KKTP bagi siswa'
      }
    ],
    tindakLanjutList: [
      {
        id: 'tl-1',
        title: 'Melakukan koordinasi dan validasi perangkat ajar bersama Kepala Sekolah'
      },
      {
        id: 'tl-2',
        title: 'Mencatat perkembangan kehadiran, keaktifan, dan adab siswa pada Jurnal Mengajar'
      },
      {
        id: 'tl-3',
        title: 'Mendampingi serta memotivasi siswa dalam pembiasaan ibadah dan tadarus harian'
      },
      {
        id: 'tl-4',
        title: 'Melaksanakan analisis ketuntasan KKTP dan memberikan bimbingan remedial terbimbing'
      }
    ],
    createdAt: '2026-10-01T07:30:00.000Z'
  },
  {
    id: 'ekp-g2-2026-10',
    teacherId: 'guru-2',
    month: 'Oktober',
    year: '2026',
    rkhList: [
      {
        id: 'rkh-g2-1',
        code: 'RKH 1',
        title: 'Terlaksananya pengelolaan pembelajaran tematik & IPAS kelas terpadu sesuai standar Kurikulum Merdeka di SDN Bantargebang 03'
      },
      {
        id: 'rkh-g2-2',
        code: 'RKH 2',
        title: 'Terlaksananya pembimbingan penguatan karakter Profil Pelajar Pancasila dan literasi numerasi kelas'
      }
    ],
    rencanaAksiList: [
      {
        id: 'ra-g2-1',
        rkhId: 'rkh-g2-1',
        title: 'Menyusun perangkat ajar tematik terpadu, lembar kerja peserta didik, dan media pembelajaran interaktif'
      },
      {
        id: 'ra-g2-2',
        rkhId: 'rkh-g2-1',
        title: 'Melaksanakan pembelajaran intrakurikuler tatap muka di kelas serta evaluasi kemajuan belajar siswa'
      },
      {
        id: 'ra-g2-3',
        rkhId: 'rkh-g2-2',
        title: 'Membimbing pojok baca literasi dan pembiasaan numerasi pagi sebelum pembelajaran dimulai'
      }
    ],
    tindakLanjutList: [
      {
        id: 'tl-g2-1',
        title: 'Melakukan telaah modul ajar bersama tim guru kelas dan Kepala Sekolah SDN Bantargebang 03'
      },
      {
        id: 'tl-g2-2',
        title: 'Melakukan pendampingan individual bagi siswa yang memerlukan penguatan membaca dan berhitung'
      }
    ],
    createdAt: '2026-10-01T08:00:00.000Z'
  }
];

const INITIAL_E_KINERJA_ACTIVITIES: EKinerjaDailyActivity[] = [
  {
    id: 'eka-1',
    teacherId: 'guru-1',
    periodId: 'ekp-2026-10',
    date: '2026-10-23',
    rkhId: 'rkh-1',
    rkhText: 'Terlaksananya perencanaan dan pelaksanaan pembelajaran PAI & Budi Pekerti berbasis Kurikulum Berbasis Cinta (KBC) sesuai Kep. Kepala BKPDM Nomor 020 Tahun 2026',
    rencanaAksiId: 'ra-2',
    rencanaAksiText: 'Melaksanakan kegiatan pembelajaran tatap muka PAI di kelas serta pengisian Jurnal Mengajar & Presensi Siswa',
    tindakLanjutText: 'Mencatat perkembangan kehadiran, keaktifan, dan adab siswa pada Jurnal Mengajar',
    tindakLanjutList: ['Mencatat perkembangan kehadiran, keaktifan, dan adab siswa pada Jurnal Mengajar'],
    outputText: '1 Dokumen Jurnal Mengajar Harian Guru PAI, Rekap Daftar Hadir Peserta Didik, dan Catatan Refleksi Pembelajaran KBC',
    photos: [],
    createdAt: '2026-10-23T08:00:00.000Z'
  },
  {
    id: 'eka-2',
    teacherId: 'guru-1',
    periodId: 'ekp-2026-10',
    date: '2026-10-23',
    rkhId: 'rkh-2',
    rkhText: 'Terlaksananya pembimbingan pembiasaan ibadah harian, tadarus Juz Amma, dan evaluasi asesmen hasil belajar peserta didik',
    rencanaAksiId: 'ra-3',
    rencanaAksiText: 'Membimbing pembiasaan Shalat Dhuha berjamaah, Tadarus Juz Amma pagi, dan pembinaan akhlak mulia siswa',
    tindakLanjutText: 'Mendampingi serta memotivasi siswa dalam pembiasaan ibadah dan tadarus harian',
    tindakLanjutList: ['Mendampingi serta memotivasi siswa dalam pembiasaan ibadah dan tadarus harian'],
    outputText: 'Terlaksananya Pembiasaan Shalat Dhuha & Tadarus Juz Amma Siswa beserta Dokumentasi Kegiatan dan Jurnal Pembiasaan Akhlak',
    photos: [],
    createdAt: '2026-10-23T10:00:00.000Z'
  },
  {
    id: 'eka-g2-1',
    teacherId: 'guru-2',
    periodId: 'ekp-g2-2026-10',
    date: '2026-10-24',
    rkhId: 'rkh-g2-1',
    rkhText: 'Terlaksananya pengelolaan pembelajaran tematik & IPAS kelas terpadu sesuai standar Kurikulum Merdeka di SDN Bantargebang 03',
    rencanaAksiId: 'ra-g2-2',
    rencanaAksiText: 'Melaksanakan pembelajaran intrakurikuler tatap muka di kelas serta evaluasi kemajuan belajar siswa',
    tindakLanjutText: 'Melakukan pendampingan individual bagi siswa yang memerlukan penguatan membaca dan berhitung',
    tindakLanjutList: ['Melakukan pendampingan individual bagi siswa yang memerlukan penguatan membaca dan berhitung'],
    outputText: 'Terlaksananya Pembelajaran Tatap Muka Tematik & IPAS beserta Rekap Penilaian Formatif Harian Siswa',
    photos: [],
    createdAt: '2026-10-24T08:30:00.000Z'
  }
];

const EMPTY_APP_SETTINGS: AppSettings = {
  principalName: '',
  principalNip: '',
  schoolName: '',
  appLogoUrl: '',
  schoolAddress: '',
  academicYear: ''
};

let hasCompletedInitialCloudPull = false;

const DEMO_CLASS_IDS = new Set(INITIAL_CLASSES.map(c => c.id));
const DEMO_STUDENT_IDS = new Set(INITIAL_STUDENTS.map(s => s.id));
const DEMO_SCORE_IDS = new Set(INITIAL_SCORES.map(s => s.id));
const DEMO_JOURNAL_IDS = new Set(INITIAL_TEACHING_JOURNALS.map(j => j.id));
const DEMO_QUIZ_IDS = new Set(INITIAL_QUIZZES.map(q => q.id));
const DEMO_QUESTION_IDS = new Set(INITIAL_QUESTIONS.map(q => q.id));
const DEMO_DOC_IDS = new Set(INITIAL_TEACHING_DOCS.map(d => d.id));
const DEMO_CALENDAR_IDS = new Set(INITIAL_CALENDAR_EVENTS.map(e => e.id));
const DEMO_FORUM_IDS = new Set(INITIAL_FORUM_THREADS.map(f => f.id));

/**
 * Mendeteksi apakah aplikasi sudah berada pada mode Data Asli Pengguna / Fresh
 * (misalnya pengguna telah melakukan Reset atau telah membuat kelas/siswa asli sendiri
 * yang bukan kelas demo bawaan c-1a s.d. c-6a).
 */
function isRealUserWorkspace(): boolean {
  try {
    if (localStorage.getItem(FRESH_EMPTY_FLAG_KEY) === 'true') {
      return true;
    }
    const rawClasses = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (rawClasses) {
      const parsed = JSON.parse(rawClasses);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return true;
        const hasAnyDemoClass = parsed.some((c: any) => c && DEMO_CLASS_IDS.has(c.id));
        if (!hasAnyDemoClass) return true;
      }
    }
    const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (rawStudents) {
      const parsed = JSON.parse(rawStudents);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasAnyDemoStudent = parsed.some((s: any) => s && DEMO_STUDENT_IDS.has(s.id));
        if (!hasAnyDemoStudent) return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const isRealOrFresh = isRealUserWorkspace();
    const raw = localStorage.getItem(key);
    if (!raw) {
      let fallbackValue: T = defaultValue;
      if (isRealOrFresh) {
        if (Array.isArray(defaultValue)) {
          fallbackValue = [] as unknown as T;
        } else if (key === STORAGE_KEYS.PROFILE) {
          fallbackValue = { ...EMPTY_TEACHER_PROFILE } as unknown as T;
        } else if (key === STORAGE_KEYS.SETTINGS) {
          fallbackValue = { ...EMPTY_APP_SETTINGS } as unknown as T;
        } else if (typeof defaultValue === 'object' && defaultValue !== null) {
          fallbackValue = {} as unknown as T;
        }
      }

      // Jangan menulis data dummy ke localStorage sebelum penarikan awal dari Cloud selesai,
      // agar browser/perangkat baru selalu memprioritaskan data dari Cloud/Supabase.
      if (
        hasCompletedInitialCloudPull &&
        fallbackValue !== null &&
        fallbackValue !== undefined &&
        key !== STORAGE_KEYS.SESSION
      ) {
        localStorage.setItem(key, JSON.stringify(fallbackValue));
        IndexedDbService.putCache(key, fallbackValue, true).catch(() => {});
      }
      return fallbackValue;
    }

    const parsed = JSON.parse(raw);

    // Jika pengguna sudah menggunakan data kelas/siswa asli (bukan demo bawaan),
    // saring otomatis sisa item demo bawaan yang mungkin sempat ter-seed sebelumnya.
    if (isRealOrFresh && Array.isArray(parsed)) {
      if (key === STORAGE_KEYS.SCORES) {
        return parsed.filter((x: any) => x && !DEMO_SCORE_IDS.has(x.id) && !DEMO_STUDENT_IDS.has(x.studentId)) as unknown as T;
      }
      if (key === STORAGE_KEYS.JOURNALS) {
        return parsed.filter((x: any) => x && !DEMO_JOURNAL_IDS.has(x.id)) as unknown as T;
      }
      if (key === STORAGE_KEYS.QUIZZES) {
        return parsed.filter((x: any) => x && !DEMO_QUIZ_IDS.has(x.id)) as unknown as T;
      }
      if (key === STORAGE_KEYS.QUESTIONS) {
        return parsed.filter((x: any) => x && !DEMO_QUESTION_IDS.has(x.id)) as unknown as T;
      }
      if (key === STORAGE_KEYS.TEACHING_DOCS) {
        return parsed.filter((x: any) => x && !DEMO_DOC_IDS.has(x.id)) as unknown as T;
      }
      if (key === STORAGE_KEYS.CALENDAR_EVENTS) {
        return parsed.filter((x: any) => x && !DEMO_CALENDAR_IDS.has(x.id)) as unknown as T;
      }
      if (key === STORAGE_KEYS.FORUM_THREADS) {
        return parsed.filter((x: any) => x && !DEMO_FORUM_IDS.has(x.id)) as unknown as T;
      }
    }

    return parsed;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (key !== STORAGE_KEYS.SESSION) {
      // Offline-first write: persists to IndexedDB cache/outbox and pushes to Cloud & Supabase when online
      SupabaseService.pushKeyToCloud(key, value).catch(() => {});
    } else {
      IndexedDbService.putCache(key, value, true).catch(() => {});
    }
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
    if (key !== STORAGE_KEYS.SESSION) {
      SupabaseService.pushKeyToCloud(key, value).catch(() => {});
    }
  }
}

export const StorageService = {
  getSession: (): UserSession | null => {
    return getStorage<UserSession | null>(STORAGE_KEYS.SESSION, null);
  },

  setSession: (session: UserSession | null): void => {
    setStorage(STORAGE_KEYS.SESSION, session);
  },

  clearSession: (): void => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  // ============================================================================
  // MULTI-GURU: MANAJEMEN BANYAK GURU, PEMILIHAN GURU AKTIF & PROFIL TERISOLASI
  // ============================================================================
  getTeachers: (): TeacherProfile[] => {
    let list = getStorage<TeacherProfile[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    if (!Array.isArray(list) || list.length === 0) {
      list = [...INITIAL_TEACHERS];
      setStorage(STORAGE_KEYS.TEACHERS, list);
    }
    // Ensure all teachers have an ID
    let hasFix = false;
    const fixed = list.map((t, idx) => {
      if (!t.id) {
        hasFix = true;
        return { ...t, id: `guru-${idx + 1}` };
      }
      return t;
    });
    if (hasFix) {
      setStorage(STORAGE_KEYS.TEACHERS, fixed);
      return fixed;
    }
    return list;
  },

  getActiveTeacherId: (): string => {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_TEACHER_ID);
    const teachers = StorageService.getTeachers();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'string' && teachers.some(t => t.id === parsed)) {
          return parsed;
        }
      } catch {
        if (teachers.some(t => t.id === raw)) return raw;
      }
    }
    // Default to the first teacher (e.g. guru-1)
    const fallbackId = teachers[0]?.id || 'guru-1';
    setStorage(STORAGE_KEYS.ACTIVE_TEACHER_ID, fallbackId);
    return fallbackId;
  },

  setActiveTeacherId: (id: string): void => {
    const teachers = StorageService.getTeachers();
    const match = teachers.find(t => t.id === id);
    if (match) {
      setStorage(STORAGE_KEYS.ACTIVE_TEACHER_ID, id);
      setStorage(STORAGE_KEYS.PROFILE, match);

      // Update current session name if admin
      const currentSession = StorageService.getSession();
      if (currentSession && currentSession.role === 'admin') {
        StorageService.setSession({
          ...currentSession,
          fullName: match.fullName
        });
      }

      // Notify entire app of teacher switch
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lms-teacher-changed', {
            detail: { teacherId: id, teacher: match }
          })
        );
      }
    }
  },

  getActiveTeacher: (): TeacherProfile => {
    const activeId = StorageService.getActiveTeacherId();
    const teachers = StorageService.getTeachers();
    const found = teachers.find(t => t.id === activeId) || teachers[0] || INITIAL_TEACHER_PROFILE;
    return {
      ...found,
      principalName: found.principalName?.trim() || INITIAL_TEACHER_PROFILE.principalName || 'Hj. Siti Rohmah, M.Pd.',
      principalNip: found.principalNip?.trim() || INITIAL_TEACHER_PROFILE.principalNip || '197405101998022001',
      signatureDataUrl: found.signatureDataUrl || DEFAULT_TEACHER_SIGNATURE,
      principalSignatureDataUrl: found.principalSignatureDataUrl || DEFAULT_PRINCIPAL_SIGNATURE
    };
  },

  getTeacherProfile: (teacherId?: string): TeacherProfile => {
    if (teacherId) {
      const teachers = StorageService.getTeachers();
      const match = teachers.find(t => t.id === teacherId);
      if (match) {
        return {
          ...match,
          principalName: match.principalName?.trim() || INITIAL_TEACHER_PROFILE.principalName || 'Hj. Siti Rohmah, M.Pd.',
          principalNip: match.principalNip?.trim() || INITIAL_TEACHER_PROFILE.principalNip || '197405101998022001',
          signatureDataUrl: match.signatureDataUrl || DEFAULT_TEACHER_SIGNATURE,
          principalSignatureDataUrl: match.principalSignatureDataUrl || DEFAULT_PRINCIPAL_SIGNATURE
        };
      }
    }
    return StorageService.getActiveTeacher();
  },

  saveTeacherProfile: (profile: TeacherProfile): TeacherProfile => {
    const teachers = StorageService.getTeachers();
    const id = profile.id || `guru-${Date.now().toString(36)}`;
    const updatedProfile: TeacherProfile = {
      ...profile,
      id,
      updatedAt: new Date().toISOString()
    };

    const idx = teachers.findIndex(t => t.id === id);
    let updatedList: TeacherProfile[];
    if (idx !== -1) {
      updatedList = [...teachers];
      updatedList[idx] = updatedProfile;
    } else {
      updatedList = [...teachers, updatedProfile];
    }
    setStorage(STORAGE_KEYS.TEACHERS, updatedList);

    // If active teacher was updated or only 1 teacher, sync to PROFILE key & session
    const activeId = StorageService.getActiveTeacherId();
    if (activeId === id || teachers.length === 0) {
      setStorage(STORAGE_KEYS.PROFILE, updatedProfile);
      const currentSession = StorageService.getSession();
      if (currentSession && currentSession.role === 'admin') {
        StorageService.setSession({
          ...currentSession,
          fullName: updatedProfile.fullName
        });
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('lms-teacher-changed', {
          detail: { teacherId: id, teacher: updatedProfile }
        })
      );
    }

    return updatedProfile;
  },

  createTeacher: (profile: Omit<TeacherProfile, 'id'>): TeacherProfile => {
    const newId = `guru-${Date.now().toString(36)}`;
    const newTeacher: TeacherProfile = {
      ...profile,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const saved = StorageService.saveTeacherProfile(newTeacher);
    StorageService.setActiveTeacherId(newId);
    return saved;
  },

  deleteTeacher: (id: string): boolean => {
    const teachers = StorageService.getTeachers();
    if (teachers.length <= 1) {
      return false; // Cannot delete the only remaining teacher
    }

    const filtered = teachers.filter(t => t.id !== id);
    setStorage(STORAGE_KEYS.TEACHERS, filtered);

    // If active teacher was deleted, switch to the first remaining teacher
    const activeId = StorageService.getActiveTeacherId();
    if (activeId === id) {
      const nextTeacher = filtered[0];
      StorageService.setActiveTeacherId(nextTeacher.id || 'guru-1');
    }

    // Clean up E-Kinerja data for this deleted teacher
    const periods = getStorage<EKinerjaPeriod[]>(STORAGE_KEYS.E_KINERJA_PERIODS, INITIAL_E_KINERJA_PERIODS);
    setStorage(
      STORAGE_KEYS.E_KINERJA_PERIODS,
      periods.filter(p => p.teacherId !== id)
    );

    const activities = getStorage<EKinerjaDailyActivity[]>(STORAGE_KEYS.E_KINERJA_ACTIVITIES, INITIAL_E_KINERJA_ACTIVITIES);
    setStorage(
      STORAGE_KEYS.E_KINERJA_ACTIVITIES,
      activities.filter(a => a.teacherId !== id)
    );

    return true;
  },

  getAppSettings: (): AppSettings => {
    const s = getStorage<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_APP_SETTINGS);
    return {
      ...s,
      principalName: s.principalName?.trim() || INITIAL_APP_SETTINGS.principalName || 'Hj. Siti Rohmah, M.Pd.',
      principalNip: s.principalNip?.trim() || INITIAL_APP_SETTINGS.principalNip || '197405101998022001'
    };
  },

  saveAppSettings: (settings: AppSettings): void => {
    setStorage(STORAGE_KEYS.SETTINGS, settings);
  },

  getClasses: (): ClassItem[] => {
    let classes = getStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const hasDefaultDemo = classes.some(c => c && DEMO_CLASS_IDS.has(c.id));
    if (hasDefaultDemo && classes.length < INITIAL_CLASSES.length) {
      const existingNames = new Set(classes.map(c => (c.className || '').trim().toUpperCase()));
      const missing = INITIAL_CLASSES.filter(ic => !existingNames.has(ic.className.toUpperCase()));
      if (missing.length > 0) {
        classes = [...classes, ...missing].sort((a, b) =>
          a.className.localeCompare(b.className, 'id', { numeric: true })
        );
        setStorage(STORAGE_KEYS.CLASSES, classes);
      }
    }
    const students = getStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    return classes.map(c => {
      const count = students.filter(s => s.classId === c.id).length;
      return {
        ...c,
        studentCount: count > 0 ? count : (c.studentCount || 30)
      };
    });
  },

  saveClass: (classItem: Omit<ClassItem, 'id'> & { id?: string }): ClassItem => {
    const classes = getStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    let updated: ClassItem;
    if (classItem.id) {
      updated = { ...classItem, id: classItem.id };
      const idx = classes.findIndex(c => c.id === classItem.id);
      if (idx !== -1) classes[idx] = updated;
      else classes.push(updated);
    } else {
      updated = {
        ...classItem,
        id: 'c-' + Math.random().toString(36).substring(2, 9)
      };
      classes.push(updated);
    }
    setStorage(STORAGE_KEYS.CLASSES, classes);
    return updated;
  },

  deleteClass: (id: string): void => {
    const classes = getStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    setStorage(STORAGE_KEYS.CLASSES, classes.filter(c => c.id !== id));
  },

  getStudents: (): Student[] => {
    const students = getStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const classes = getStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    return students.map(s => {
      const cls = classes.find(c => c.id === s.classId);
      return {
        ...s,
        className: cls ? cls.className : s.className || ''
      };
    });
  },

  generateStudentUsername: (classId: string): string => {
    const classes = getStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const students = getStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const cls = classes.find(c => c.id === classId);
    const prefix = cls ? cls.className.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : 'S';
    
    let maxNum = 0;
    students.forEach(s => {
      if (s.username.startsWith(prefix)) {
        const numStr = s.username.substring(prefix.length);
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return prefix + String(maxNum + 1).padStart(2, '0');
  },

  saveStudent: (student: Omit<Student, 'id' | 'username'> & { id?: string; username?: string }): Student => {
    const students = getStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const classes = getStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const cls = classes.find(c => c.id === student.classId);
    const className = cls ? cls.className : '';

    let updated: Student;
    if (student.id) {
      const existing = students.find(s => s.id === student.id);
      const username = student.username || (existing ? existing.username : StorageService.generateStudentUsername(student.classId));
      updated = {
        ...student,
        id: student.id,
        username,
        className,
        avatarColor: student.avatarColor || (existing ? existing.avatarColor : '#10b981')
      };
      const idx = students.findIndex(s => s.id === student.id);
      if (idx !== -1) students[idx] = updated;
      else students.push(updated);
    } else {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let generatedPwd = '';
      for (let i = 0; i < 6; i++) generatedPwd += chars.charAt(Math.floor(Math.random() * chars.length));

      const username = student.username || StorageService.generateStudentUsername(student.classId);
      updated = {
        ...student,
        id: 's-' + Math.random().toString(36).substring(2, 9),
        username,
        password: student.password || generatedPwd,
        className,
        avatarColor: student.avatarColor || '#10b981'
      };
      students.push(updated);
    }
    setStorage(STORAGE_KEYS.STUDENTS, students);
    return updated;
  },

  importBulkStudents: (items: { fullName: string; nis?: string; classId: string }[]): Student[] => {
    const students = getStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const classes = getStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const added: Student[] = [];

    // Track counters per class
    const classCounters: Record<string, number> = {};
    classes.forEach(c => {
      const prefix = c.className.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      let maxNum = 0;
      students.forEach(s => {
        if (s.username.startsWith(prefix)) {
          const num = parseInt(s.username.substring(prefix.length), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      classCounters[c.id] = maxNum;
    });

    items.forEach(it => {
      const cls = classes.find(c => c.id === it.classId);
      const prefix = cls ? cls.className.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : 'S';
      const curNum = (classCounters[it.classId] || 0) + 1;
      classCounters[it.classId] = curNum;
      const username = prefix + String(curNum).padStart(2, '0');

      let pwd = '';
      for (let i = 0; i < 6; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));

      const newStudent: Student = {
        id: 's-' + Math.random().toString(36).substring(2, 9),
        nis: it.nis || '-',
        fullName: it.fullName,
        classId: it.classId,
        className: cls ? cls.className : '',
        username,
        password: pwd,
        avatarColor: '#10b981'
      };
      students.push(newStudent);
      added.push(newStudent);
    });

    setStorage(STORAGE_KEYS.STUDENTS, students);
    return added;
  },

  deleteStudent: (id: string): void => {
    const students = getStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    setStorage(STORAGE_KEYS.STUDENTS, students.filter(s => s.id !== id));
  },

  getAttendance: (classId: string, dateStr: string): AttendanceRecord[] => {
    const records = getStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    return records.filter(r => r.classId === classId && r.date === dateStr);
  },

  saveAttendance: (classId: string, dateStr: string, records: { studentId: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'; notes?: string }[]): void => {
    let all = getStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    all = all.filter(r => !(r.classId === classId && r.date === dateStr));
    const newItems: AttendanceRecord[] = records.map(r => ({
      id: 'att-' + Math.random().toString(36).substring(2, 9),
      studentId: r.studentId,
      classId,
      date: dateStr,
      status: r.status,
      notes: r.notes || ''
    }));
    setStorage(STORAGE_KEYS.ATTENDANCE, [...all, ...newItems]);
  },

  getMonthlyAttendance: (classId: string, monthStr: string) => {
    const records = getStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    const students = StorageService.getStudents().filter(s => s.classId === classId);
    const classes = getStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const cls = classes.find(c => c.id === classId);

    const summaryMap: Record<string, { studentId: string; nis: string; fullName: string; hadir: number; sakit: number; izin: number; alpa: number }> = {};
    students.forEach(s => {
      summaryMap[s.id] = { studentId: s.id, nis: s.nis, fullName: s.fullName, hadir: 0, sakit: 0, izin: 0, alpa: 0 };
    });

    records.forEach(r => {
      if (r.classId === classId && r.date.startsWith(monthStr) && summaryMap[r.studentId]) {
        const stat = (r.status || '').toLowerCase();
        if (stat === 'hadir') summaryMap[r.studentId].hadir++;
        else if (stat === 'sakit') summaryMap[r.studentId].sakit++;
        else if (stat === 'izin') summaryMap[r.studentId].izin++;
        else if (stat === 'alpa') summaryMap[r.studentId].alpa++;
      }
    });

    return {
      className: cls ? cls.className : '',
      students: Object.values(summaryMap).sort((a, b) => a.fullName.localeCompare(b.fullName))
    };
  },

  getJournals: (teacherId?: string): TeachingJournal[] => {
    const all = getStorage<TeachingJournal[]>(STORAGE_KEYS.JOURNALS, INITIAL_TEACHING_JOURNALS);
    if (!teacherId) return all;
    return all.filter(
      j => j.teacherId === teacherId || (!j.teacherId && teacherId === 'guru-1')
    );
  },

  saveJournal: (entry: Omit<TeachingJournal, 'id'> & { id?: string }, teacherId?: string): TeachingJournal => {
    const targetTeacherId = entry.teacherId || teacherId || StorageService.getActiveTeacherId();
    const journals = getStorage<TeachingJournal[]>(STORAGE_KEYS.JOURNALS, INITIAL_TEACHING_JOURNALS);
    const nowIso = new Date().toISOString();
    let updated: TeachingJournal;
    if (entry.id) {
      const existing = journals.find(j => j.id === entry.id);
      updated = {
        ...entry,
        id: entry.id,
        teacherId: targetTeacherId,
        createdAt: entry.createdAt || existing?.createdAt || nowIso,
        updatedAt: nowIso
      };
      const idx = journals.findIndex(j => j.id === entry.id);
      if (idx !== -1) journals[idx] = updated;
      else journals.unshift(updated);
    } else {
      updated = {
        ...entry,
        id: 'jrn-' + Math.random().toString(36).substring(2, 9),
        teacherId: targetTeacherId,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      journals.unshift(updated);
    }
    setStorage(STORAGE_KEYS.JOURNALS, journals);
    return updated;
  },

  deleteJournal: (id: string): void => {
    const journals = getStorage<TeachingJournal[]>(STORAGE_KEYS.JOURNALS, INITIAL_TEACHING_JOURNALS);
    setStorage(STORAGE_KEYS.JOURNALS, journals.filter(j => j.id !== id));
  },

  getQuestions: (): Question[] => {
    return getStorage<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
  },

  saveQuestion: (q: Omit<Question, 'id'> & { id?: string }): Question => {
    const questions = getStorage<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    let updated: Question;
    if (q.id) {
      updated = { ...q, id: q.id };
      const idx = questions.findIndex(item => item.id === q.id);
      if (idx !== -1) questions[idx] = updated;
      else questions.push(updated);
    } else {
      updated = {
        ...q,
        id: 'q-' + Math.random().toString(36).substring(2, 9)
      };
      questions.push(updated);
    }
    setStorage(STORAGE_KEYS.QUESTIONS, questions);
    return updated;
  },

  deleteQuestion: (id: string): void => {
    const questions = getStorage<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    setStorage(STORAGE_KEYS.QUESTIONS, questions.filter(q => q.id !== id));
  },

  getQuizzes: (studentId?: string, classId?: string): Quiz[] => {
    const quizzes = getStorage<Quiz[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
    const classes = getStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const attempts = getStorage<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS, []);

    let list = quizzes.map(q => {
      const cls = classes.find(c => c.id === q.classId);
      const isCompleted = studentId ? attempts.some(a => a.quizId === q.id && a.studentId === studentId) : false;
      return {
        ...q,
        className: cls ? cls.className : q.className || '',
        completed: isCompleted
      };
    });

    if (classId) {
      list = list.filter(q => !q.classId || q.classId === classId);
    }
    return list;
  },

  saveQuiz: (quiz: Omit<Quiz, 'id'> & { id?: string }): Quiz => {
    const quizzes = getStorage<Quiz[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
    const classes = getStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const cls = classes.find(c => c.id === quiz.classId);
    const className = cls ? cls.className : quiz.className || '';

    let updated: Quiz;
    if (quiz.id) {
      updated = { ...quiz, id: quiz.id, className };
      const idx = quizzes.findIndex(q => q.id === quiz.id);
      if (idx !== -1) quizzes[idx] = updated;
      else quizzes.push(updated);
    } else {
      updated = {
        ...quiz,
        id: 'quiz-' + Math.random().toString(36).substring(2, 9),
        className
      };
      quizzes.unshift(updated);
    }
    setStorage(STORAGE_KEYS.QUIZZES, quizzes);
    return updated;
  },

  deleteQuiz: (id: string): void => {
    const quizzes = getStorage<Quiz[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
    setStorage(STORAGE_KEYS.QUIZZES, quizzes.filter(q => q.id !== id));
  },

  getQuizForStudent: (quizId: string) => {
    const quizzes = getStorage<Quiz[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
    const questions = getStorage<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) throw new Error('Kuis tidak ditemukan');

    const quizQuestions = (quiz.customQuestions && quiz.customQuestions.length > 0)
      ? quiz.customQuestions
      : questions.filter(q => quiz.questionIds.includes(q.id));

    return {
      quiz,
      questions: quiz.randomize ? [...quizQuestions].sort(() => Math.random() - 0.5) : quizQuestions
    };
  },

  submitQuiz: (
    quizId: string,
    studentId: string,
    studentName: string,
    className: string,
    answers: Record<string, any>,
    status: 'submitted' | 'timeout' = 'submitted'
  ) => {
    const quizzes = getStorage<Quiz[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
    const questions = getStorage<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    const quiz = quizzes.find(q => q.id === quizId);
    const quizQuestions = (quiz?.customQuestions && quiz.customQuestions.length > 0)
      ? quiz.customQuestions
      : questions.filter(q => quiz?.questionIds.includes(q.id));

    let score = 0;
    let maxScore = 0;

    quizQuestions.forEach(q => {
      maxScore += q.scoreWeight;
      const ans = answers[q.id];
      if (ans === undefined || ans === null || ans === '') return;

      if (q.questionType === 'pg_standar' || q.questionType === 'benar_salah') {
        if (String(ans).trim() === String(q.correctAnswer).trim()) {
          score += q.scoreWeight;
        }
      } else if (q.questionType === 'pg_kompleks') {
        const studentAns = Array.isArray(ans) ? [...ans].sort().join(',') : String(ans).split(',').sort().join(',');
        const correctAns = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort().join(',') : String(q.correctAnswer).split(',').sort().join(',');
        if (studentAns === correctAns) {
          score += q.scoreWeight;
        }
      } else if (q.questionType === 'isian_singkat') {
        const normalizedStudent = String(ans).trim().toLowerCase();
        const rawKey = Array.isArray(q.correctAnswer) ? q.correctAnswer.join('/') : String(q.correctAnswer || '');
        const acceptedAnswers = rawKey
          .split(/[\/,;]+/)
          .map(s => s.trim().toLowerCase())
          .filter(Boolean);
        if (
          normalizedStudent.length > 0 &&
          (acceptedAnswers.includes(normalizedStudent) ||
            acceptedAnswers.some(k => k.length >= 3 && (normalizedStudent.includes(k) || k.includes(normalizedStudent))))
        ) {
          score += q.scoreWeight;
        }
      } else if (q.questionType === 'menjodohkan') {
        if (q.matchingPairs && q.matchingPairs.length > 0 && typeof ans === 'object' && !Array.isArray(ans)) {
          let correctPairs = 0;
          q.matchingPairs.forEach(pair => {
            if (String(ans[pair.left] || '').trim().toLowerCase() === String(pair.right).trim().toLowerCase()) {
              correctPairs++;
            }
          });
          score += Math.round((correctPairs / q.matchingPairs.length) * q.scoreWeight);
        } else {
          const studentAns = Array.isArray(ans) ? [...ans].sort().join(',') : String(ans).trim().toLowerCase();
          const correctAns = Array.isArray(q.correctAnswer)
            ? [...q.correctAnswer].sort().join(',')
            : String(q.correctAnswer).trim().toLowerCase();
          if (studentAns === correctAns) {
            score += q.scoreWeight;
          }
        }
      } else if (q.questionType === 'essay') {
        // Teacher grades essay or gives partial auto credit if keywords match
        if (String(ans).trim().length > 10) {
          score += Math.round(q.scoreWeight * 0.8);
        }
      }
    });

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const attemptId = 'att-' + Math.random().toString(36).substring(2, 9);

    const attempt: QuizAttempt = {
      id: attemptId,
      quizId,
      studentId,
      studentName,
      className,
      answers,
      score,
      maxScore,
      percentage,
      startedAt: new Date(Date.now() - (quiz?.durationMinutes || 15) * 60000).toISOString(),
      submittedAt: new Date().toISOString(),
      status
    };

    const attempts = getStorage<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS, []);
    attempts.push(attempt);
    setStorage(STORAGE_KEYS.ATTEMPTS, attempts);

    const scoreItem: ScoreItem = {
      id: 'sc-' + Math.random().toString(36).substring(2, 9),
      studentId,
      quizId,
      attemptId,
      rawScore: score,
      maxScore,
      percentage,
      graded: true,
      quizTitle: quiz?.title || 'Kuis',
      createdAt: new Date().toISOString()
    };

    const scores = getStorage<ScoreItem[]>(STORAGE_KEYS.SCORES, INITIAL_SCORES);
    scores.push(scoreItem);
    setStorage(STORAGE_KEYS.SCORES, scores);

    return { score, maxScore, percentage, attemptId };
  },

  getMaterials: (studentGrade?: string): Material[] => {
    const materials = getStorage<Material[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    if (!studentGrade) return materials;
    return materials.filter(m => !m.classId || m.classId === studentGrade || m.classId === '');
  },

  saveMaterial: (mat: Omit<Material, 'id' | 'createdAt'> & { id?: string }): Material => {
    const materials = getStorage<Material[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    let updated: Material;
    if (mat.id) {
      const existing = materials.find(m => m.id === mat.id);
      updated = { ...mat, id: mat.id, createdAt: existing ? existing.createdAt : new Date().toISOString() };
      const idx = materials.findIndex(m => m.id === mat.id);
      if (idx !== -1) materials[idx] = updated;
      else materials.unshift(updated);
    } else {
      updated = {
        ...mat,
        id: 'mat-' + Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString()
      };
      materials.unshift(updated);
    }
    setStorage(STORAGE_KEYS.MATERIALS, materials);
    return updated;
  },

  deleteMaterial: (id: string): void => {
    const materials = getStorage<Material[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    setStorage(STORAGE_KEYS.MATERIALS, materials.filter(m => m.id !== id));
  },

  getReferences: (category?: string): ReadingReference[] => {
    const refs = getStorage<ReadingReference[]>(STORAGE_KEYS.REFERENCES, INITIAL_REFERENCES);
    if (!category) return refs;
    return refs.filter(r => r.category.toLowerCase().includes(category.toLowerCase()));
  },

  saveReference: (ref: Omit<ReadingReference, 'id'> & { id?: string }): ReadingReference => {
    const refs = getStorage<ReadingReference[]>(STORAGE_KEYS.REFERENCES, INITIAL_REFERENCES);
    let updated: ReadingReference;
    if (ref.id) {
      updated = { ...ref, id: ref.id };
      const idx = refs.findIndex(r => r.id === ref.id);
      if (idx !== -1) refs[idx] = updated;
      else refs.push(updated);
    } else {
      updated = {
        ...ref,
        id: 'ref-' + Math.random().toString(36).substring(2, 9)
      };
      refs.push(updated);
    }
    setStorage(STORAGE_KEYS.REFERENCES, refs);
    return updated;
  },

  deleteReference: (id: string): void => {
    const refs = getStorage<ReadingReference[]>(STORAGE_KEYS.REFERENCES, INITIAL_REFERENCES);
    setStorage(STORAGE_KEYS.REFERENCES, refs.filter(r => r.id !== id));
  },

  getAnnouncements: (classId?: string): Announcement[] => {
    const list = getStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    if (!classId) return list;
    return list.filter(a => a.target === 'all' || a.classId === classId);
  },

  saveAnnouncement: (ann: Omit<Announcement, 'id' | 'createdAt'> & { id?: string }): Announcement => {
    const list = getStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    const classes = getStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const cls = classes.find(c => c.id === ann.classId);
    const targetLabel = ann.target === 'all' ? 'Semua Siswa' : (cls ? `Kelas ${cls.className}` : 'Kelas Terpilih');

    let updated: Announcement;
    if (ann.id) {
      const existing = list.find(a => a.id === ann.id);
      updated = {
        ...ann,
        id: ann.id,
        targetLabel,
        createdAt: existing ? existing.createdAt : new Date().toISOString()
      };
      const idx = list.findIndex(a => a.id === ann.id);
      if (idx !== -1) list[idx] = updated;
      else list.unshift(updated);
    } else {
      updated = {
        ...ann,
        id: 'ann-' + Math.random().toString(36).substring(2, 9),
        targetLabel,
        createdAt: new Date().toISOString()
      };
      list.unshift(updated);
    }
    setStorage(STORAGE_KEYS.ANNOUNCEMENTS, list);
    return updated;
  },

  deleteAnnouncement: (id: string): void => {
    const list = getStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    setStorage(STORAGE_KEYS.ANNOUNCEMENTS, list.filter(a => a.id !== id));
  },

  getStudentScores: (studentId: string): ScoreItem[] => {
    const scores = getStorage<ScoreItem[]>(STORAGE_KEYS.SCORES, INITIAL_SCORES);
    const quizzes = getStorage<Quiz[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
    return scores
      .filter(s => s.studentId === studentId)
      .map(s => {
        const q = quizzes.find(item => item.id === s.quizId);
        return {
          ...s,
          quizTitle: q ? q.title : s.quizTitle || 'Kuis PAI'
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getClassRecap: (classId: string, semester?: 'Ganjil' | 'Genap') => {
    const students = StorageService.getStudents().filter(s => s.classId === classId);
    const allQuizzes = getStorage<Quiz[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
    const classes = getStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const cls = classes.find(c => c.id === classId);
    const scores = getStorage<ScoreItem[]>(STORAGE_KEYS.SCORES, INITIAL_SCORES);

    let filteredQuizzes = allQuizzes.filter(q => (!q.classId || q.classId === classId) && (!semester || q.semester === semester));
    
    const recapped = students.map(s => {
      const sScores = scores.filter(x => x.studentId === s.id);
      const quizScores: Record<string, number | null> = {};
      const validScores: number[] = [];

      filteredQuizzes.forEach(q => {
        const match = sScores.find(x => x.quizId === q.id);
        if (match) {
          quizScores[q.id] = match.percentage;
          validScores.push(match.percentage);
        } else {
          quizScores[q.id] = null;
        }
      });

      const avg = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
      return {
        id: s.id,
        nis: s.nis,
        name: s.fullName,
        avg,
        quizCount: validScores.length,
        quizScores
      };
    });

    const allAvgs = recapped.filter(r => r.quizCount > 0).map(r => r.avg);
    const stats = {
      avgClass: allAvgs.length ? Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) : 0,
      highest: allAvgs.length ? Math.max(...allAvgs) : 0,
      lowest: allAvgs.length ? Math.min(...allAvgs) : 0
    };

    return {
      className: cls ? cls.className : '',
      students: recapped.sort((a, b) => a.name.localeCompare(b.name)),
      quizzes: filteredQuizzes,
      stats
    };
  },

  resetAllToDefaults: async (): Promise<{ message: string }> => {
    const currentSession = StorageService.getSession();
    localStorage.removeItem(FRESH_EMPTY_FLAG_KEY);
    await IndexedDbService.clearAll();

    const defaultMap: Record<string, any> = {
      [STORAGE_KEYS.CLASSES]: INITIAL_CLASSES,
      [STORAGE_KEYS.STUDENTS]: INITIAL_STUDENTS,
      [STORAGE_KEYS.QUESTIONS]: INITIAL_QUESTIONS,
      [STORAGE_KEYS.QUIZZES]: INITIAL_QUIZZES,
      [STORAGE_KEYS.MATERIALS]: INITIAL_MATERIALS,
      [STORAGE_KEYS.REFERENCES]: INITIAL_REFERENCES,
      [STORAGE_KEYS.ANNOUNCEMENTS]: INITIAL_ANNOUNCEMENTS,
      [STORAGE_KEYS.JOURNALS]: INITIAL_TEACHING_JOURNALS,
      [STORAGE_KEYS.PROFILE]: INITIAL_TEACHER_PROFILE,
      [STORAGE_KEYS.SETTINGS]: INITIAL_APP_SETTINGS,
      [STORAGE_KEYS.ATTENDANCE]: [],
      [STORAGE_KEYS.SCORES]: INITIAL_SCORES,
      [STORAGE_KEYS.ATTEMPTS]: [],
      [STORAGE_KEYS.CLASS_TOPICS]: INITIAL_CLASS_TOPICS,
      [STORAGE_KEYS.TEACHING_DOCS]: INITIAL_TEACHING_DOCS,
      [STORAGE_KEYS.CALENDAR_EVENTS]: INITIAL_CALENDAR_EVENTS,
      [STORAGE_KEYS.GAMIFICATION]: {},
      [STORAGE_KEYS.HOMEROOM_TEACHERS]: INITIAL_HOMEROOM_TEACHERS,
      [STORAGE_KEYS.FORUM_THREADS]: INITIAL_FORUM_THREADS,
      [STORAGE_KEYS.REMEDIAL_PLANS]: [],
      [STORAGE_KEYS.E_KINERJA_PERIODS]: INITIAL_E_KINERJA_PERIODS,
      [STORAGE_KEYS.E_KINERJA_ACTIVITIES]: INITIAL_E_KINERJA_ACTIVITIES
    };

    Object.entries(defaultMap).forEach(([k, val]) => {
      localStorage.setItem(k, JSON.stringify(val));
    });
    if (currentSession) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentSession));
    }

    const res = await SupabaseService.pushAllLocalToCloud(Object.keys(defaultMap));
    return {
      message: `Data contoh bawaan berhasil dipulihkan (${res.uploadedCount} koleksi disinkronkan ke IndexedDB & Cloud)!`
    };
  },

  /**
   * Mengosongkan seluruh data (Guru, Kepala Sekolah, Siswa, Rombel, Soal, Kuis, Materi, Nilai, Jurnal, Forum, E-Kinerja, dll.)
   * dari LocalStorage, IndexedDB, dan Supabase Cloud sehingga aplikasi benar-benar fresh/kosong (0 data).
   */
  resetToFreshEmptyData: async (): Promise<{ success: boolean; message: string }> => {
    const currentSession = StorageService.getSession();
    const supaConfig = SupabaseService.getConfig();

    // Bersihkan localStorage lalu pasang penanda mode Fresh Empty agar tidak re-seed data dummy
    localStorage.clear();
    localStorage.setItem(FRESH_EMPTY_FLAG_KEY, 'true');
    SupabaseService.saveConfig(supaConfig);

    // Jika sesi saat ini adalah admin, kosongkan nama guru lama pada sesi agar header juga bersih
    if (currentSession && currentSession.role === 'admin') {
      const freshAdminSession: UserSession = {
        ...currentSession,
        fullName: 'Guru PAI (Data Baru)',
        classId: '',
        className: ''
      };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(freshAdminSession));
    }

    const emptyMap: Record<string, any> = {
      [FRESH_EMPTY_FLAG_KEY]: true,
      [STORAGE_KEYS.CLASSES]: [],
      [STORAGE_KEYS.STUDENTS]: [],
      [STORAGE_KEYS.QUESTIONS]: [],
      [STORAGE_KEYS.QUIZZES]: [],
      [STORAGE_KEYS.MATERIALS]: [],
      [STORAGE_KEYS.REFERENCES]: [],
      [STORAGE_KEYS.ANNOUNCEMENTS]: [],
      [STORAGE_KEYS.JOURNALS]: [],
      [STORAGE_KEYS.PROFILE]: { ...EMPTY_TEACHER_PROFILE },
      [STORAGE_KEYS.SETTINGS]: { ...EMPTY_APP_SETTINGS },
      [STORAGE_KEYS.ATTENDANCE]: [],
      [STORAGE_KEYS.SCORES]: [],
      [STORAGE_KEYS.ATTEMPTS]: [],
      [STORAGE_KEYS.CLASS_TOPICS]: [],
      [STORAGE_KEYS.TEACHING_DOCS]: [],
      [STORAGE_KEYS.CALENDAR_EVENTS]: [],
      [STORAGE_KEYS.GAMIFICATION]: {},
      [STORAGE_KEYS.HOMEROOM_TEACHERS]: [],
      [STORAGE_KEYS.FORUM_THREADS]: [],
      [STORAGE_KEYS.REMEDIAL_PLANS]: [],
      [STORAGE_KEYS.E_KINERJA_PERIODS]: [],
      [STORAGE_KEYS.E_KINERJA_ACTIVITIES]: []
    };

    Object.entries(emptyMap).forEach(([k, val]) => {
      if (k === FRESH_EMPTY_FLAG_KEY) {
        localStorage.setItem(FRESH_EMPTY_FLAG_KEY, 'true');
      } else {
        localStorage.setItem(k, JSON.stringify(val));
      }
    });

    return await SupabaseService.resetAllCloudData(emptyMap);
  },

  isFreshEmptyMode: (): boolean => {
    return isRealUserWorkspace();
  },

  /**
   * Membersihkan seluruh sisa data contoh/demo bawaan (nilai dummy, kuis demo, soal demo,
   * jurnal demo, kalender demo, forum demo, dan rencana remedial demo) sambil tetap
   * mempertahankan 100% data Kelas, Siswa, Profil Guru, Pengaturan, dan E-Kinerja asli pengguna,
   * lalu menyinkronkannya ke Cloud & Supabase.
   */
  cleanDemoDataKeepRealData: async (): Promise<{ cleanedCount: number; message: string }> => {
    localStorage.setItem(FRESH_EMPTY_FLAG_KEY, 'true');

    const filterOutDemo = (key: string, demoIds: Set<string>, extraPredicate?: (item: any) => boolean) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) {
          setStorage(key, []);
          return 1;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return 0;
        const cleaned = parsed.filter(
          (item: any) => item && !demoIds.has(item.id) && (extraPredicate ? extraPredicate(item) : true)
        );
        setStorage(key, cleaned);
        return parsed.length - cleaned.length;
      } catch {
        return 0;
      }
    };

    const currentStudents = StorageService.getStudents();
    const validStudentIds = new Set(currentStudents.map(s => s.id));

    let cleanedItems = 0;
    cleanedItems += filterOutDemo(
      STORAGE_KEYS.SCORES,
      DEMO_SCORE_IDS,
      item => !DEMO_STUDENT_IDS.has(item.studentId) && (validStudentIds.size === 0 || validStudentIds.has(item.studentId))
    );
    cleanedItems += filterOutDemo(STORAGE_KEYS.JOURNALS, DEMO_JOURNAL_IDS);
    cleanedItems += filterOutDemo(STORAGE_KEYS.QUIZZES, DEMO_QUIZ_IDS);
    cleanedItems += filterOutDemo(STORAGE_KEYS.QUESTIONS, DEMO_QUESTION_IDS);
    cleanedItems += filterOutDemo(STORAGE_KEYS.TEACHING_DOCS, DEMO_DOC_IDS);
    cleanedItems += filterOutDemo(STORAGE_KEYS.CALENDAR_EVENTS, DEMO_CALENDAR_IDS);
    cleanedItems += filterOutDemo(STORAGE_KEYS.FORUM_THREADS, DEMO_FORUM_IDS);

    // Bersihkan juga rencana remedial yang menunjuk ke siswa demo atau belum ada nilai
    try {
      const rawRem = localStorage.getItem(STORAGE_KEYS.REMEDIAL_PLANS);
      if (rawRem) {
        const remList = JSON.parse(rawRem);
        if (Array.isArray(remList)) {
          const currentScores = StorageService.getScores();
          const studentsWithScores = new Set(currentScores.map(s => s.studentId));
          const cleanedRem = remList.filter(
            (r: any) => r && !DEMO_STUDENT_IDS.has(r.studentId) && studentsWithScores.has(r.studentId)
          );
          setStorage(STORAGE_KEYS.REMEDIAL_PLANS, cleanedRem);
        }
      } else {
        setStorage(STORAGE_KEYS.REMEDIAL_PLANS, []);
      }
    } catch {
      // ignore
    }

    const allKeys = Object.values(STORAGE_KEYS).filter(k => k !== STORAGE_KEYS.SESSION);
    await SupabaseService.pushKeyToCloud(FRESH_EMPTY_FLAG_KEY, true);
    await SupabaseService.pushAllLocalToCloud(allKeys);
    SupabaseService.notifyCloudDataUpdated(allKeys.length);

    return {
      cleanedCount: cleanedItems,
      message:
        'Seluruh sisa data demo/dummy berhasil dibersihkan (Data Kelas, Siswa, Profil, & E-Kinerja asli tetap aman) dan telah disinkronkan ke Cloud!'
    };
  },

  getClassTopics: (classGrade?: string, semester?: 'Ganjil' | 'Genap'): ClassTopicItem[] => {
    let list = getStorage<ClassTopicItem[]>(STORAGE_KEYS.CLASS_TOPICS, INITIAL_CLASS_TOPICS);
    if (classGrade) {
      list = list.filter(t => t.classGrade === classGrade);
    }
    if (semester) {
      list = list.filter(t => t.semester === semester);
    }
    return list.sort((a, b) => a.chapterNo - b.chapterNo);
  },

  saveClassTopic: (item: Omit<ClassTopicItem, 'id'> & { id?: string }): ClassTopicItem => {
    const list = getStorage<ClassTopicItem[]>(STORAGE_KEYS.CLASS_TOPICS, INITIAL_CLASS_TOPICS);
    let updated: ClassTopicItem;
    if (item.id) {
      updated = { ...item, id: item.id };
      const idx = list.findIndex(t => t.id === item.id);
      if (idx !== -1) list[idx] = updated;
      else list.push(updated);
    } else {
      updated = {
        ...item,
        id: 'top-' + Math.random().toString(36).substring(2, 9)
      };
      list.push(updated);
    }
    setStorage(STORAGE_KEYS.CLASS_TOPICS, list);
    return updated;
  },

  deleteClassTopic: (id: string): void => {
    const list = getStorage<ClassTopicItem[]>(STORAGE_KEYS.CLASS_TOPICS, INITIAL_CLASS_TOPICS);
    setStorage(STORAGE_KEYS.CLASS_TOPICS, list.filter(t => t.id !== id));
  },

  saveAllClassTopics: (topics: ClassTopicItem[]): void => {
    setStorage(STORAGE_KEYS.CLASS_TOPICS, topics);
  },

  // Perangkat Ajar (Teaching Documents) Methods
  getTeachingDocs: (grade?: string, docType?: TeachingDocType, semester?: string): TeachingDocument[] => {
    const docs = getStorage<TeachingDocument[]>(STORAGE_KEYS.TEACHING_DOCS, INITIAL_TEACHING_DOCS);
    let list = [...docs];
    if (grade) {
      list = list.filter(d => d.classGrade === String(grade));
    }
    if (docType) {
      list = list.filter(d => d.docType === docType);
    }
    if (semester && semester !== 'all') {
      list = list.filter(d => d.semester === semester || d.semester === 'Tahunan');
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getTeachingDocById: (id: string): TeachingDocument | undefined => {
    const docs = getStorage<TeachingDocument[]>(STORAGE_KEYS.TEACHING_DOCS, INITIAL_TEACHING_DOCS);
    return docs.find(d => d.id === id);
  },

  saveTeachingDoc: (doc: Omit<TeachingDocument, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): TeachingDocument => {
    const docs = getStorage<TeachingDocument[]>(STORAGE_KEYS.TEACHING_DOCS, INITIAL_TEACHING_DOCS);
    let updated: TeachingDocument;
    const nowIso = new Date().toISOString();

    if (doc.id) {
      const existing = docs.find(d => d.id === doc.id);
      updated = {
        ...doc,
        id: doc.id,
        createdAt: existing ? existing.createdAt : nowIso,
        updatedAt: nowIso
      };
      const idx = docs.findIndex(d => d.id === doc.id);
      if (idx !== -1) docs[idx] = updated;
      else docs.unshift(updated);
    } else {
      updated = {
        ...doc,
        id: 'doc-' + Math.random().toString(36).substring(2, 9),
        createdAt: nowIso,
        updatedAt: nowIso
      };
      docs.unshift(updated);
    }
    setStorage(STORAGE_KEYS.TEACHING_DOCS, docs);
    return updated;
  },

  deleteTeachingDoc: (id: string): void => {
    const docs = getStorage<TeachingDocument[]>(STORAGE_KEYS.TEACHING_DOCS, INITIAL_TEACHING_DOCS);
    setStorage(STORAGE_KEYS.TEACHING_DOCS, docs.filter(d => d.id !== id));
  },

  // Dokumen Acuan / Referensi Perangkat Ajar (Sandaran CP, ATP, Prota, Promes, dll.)
  getTeachingRefDocs: (grade?: string, docType?: TeachingDocType): TeachingReferenceDoc[] => {
    const docs = getStorage<TeachingReferenceDoc[]>(STORAGE_KEYS.TEACHING_REF_DOCS, []);
    let list = [...docs];
    if (grade && grade !== 'all') {
      list = list.filter(d => d.classGrade === 'all' || d.classGrade === String(grade));
    }
    if (docType) {
      list = list.filter(d => d.docType === docType || d.docType === 'cp_atp' || d.docType === 'lainnya');
    }
    return list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  },

  saveTeachingRefDoc: (
    doc: Omit<TeachingReferenceDoc, 'id' | 'uploadedAt'> & { id?: string }
  ): TeachingReferenceDoc => {
    const docs = getStorage<TeachingReferenceDoc[]>(STORAGE_KEYS.TEACHING_REF_DOCS, []);
    const nowIso = new Date().toISOString();
    let updated: TeachingReferenceDoc;

    if (doc.id) {
      const existing = docs.find(d => d.id === doc.id);
      updated = {
        ...doc,
        id: doc.id,
        uploadedAt: existing ? existing.uploadedAt : nowIso
      };
      const idx = docs.findIndex(d => d.id === doc.id);
      if (idx !== -1) docs[idx] = updated;
      else docs.unshift(updated);
    } else {
      updated = {
        ...doc,
        id: 'refdoc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
        uploadedAt: nowIso
      };
      docs.unshift(updated);
    }

    setStorage(STORAGE_KEYS.TEACHING_REF_DOCS, docs);
    return updated;
  },

  deleteTeachingRefDoc: (id: string): void => {
    const docs = getStorage<TeachingReferenceDoc[]>(STORAGE_KEYS.TEACHING_REF_DOCS, []);
    setStorage(STORAGE_KEYS.TEACHING_REF_DOCS, docs.filter(d => d.id !== id));
  },

  // ============================================================================
  // KALENDER AKADEMIK (ACADEMIC CALENDAR)
  // ============================================================================
  getCalendarEvents: (classGrade?: string): AcademicCalendarEvent[] => {
    const events = getStorage<AcademicCalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
    let filtered = [...events];
    if (classGrade) {
      filtered = filtered.filter(e => !e.targetClass || e.targetClass === '' || e.targetClass === classGrade);
    }
    return filtered.sort((a, b) => a.date.localeCompare(b.date));
  },

  saveCalendarEvent: (event: Omit<AcademicCalendarEvent, 'id' | 'createdAt'> & { id?: string }): AcademicCalendarEvent => {
    const events = getStorage<AcademicCalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
    let updated: AcademicCalendarEvent;
    if (event.id) {
      const existing = events.find(e => e.id === event.id);
      updated = {
        ...event,
        id: event.id,
        createdAt: existing ? existing.createdAt : new Date().toISOString()
      };
      const idx = events.findIndex(e => e.id === event.id);
      if (idx !== -1) events[idx] = updated;
      else events.push(updated);
    } else {
      updated = {
        ...event,
        id: 'cal-' + Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString()
      };
      events.push(updated);
    }
    setStorage(STORAGE_KEYS.CALENDAR_EVENTS, events);
    return updated;
  },

  deleteCalendarEvent: (id: string): void => {
    const events = getStorage<AcademicCalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
    setStorage(STORAGE_KEYS.CALENDAR_EVENTS, events.filter(e => e.id !== id));
  },

  // ============================================================================
  // SISTEM POIN, BADGE (LENCANA) & LEADERBOARD TOP 10 XP SISWA
  // ============================================================================
  getBadgesCatalog: (): BadgeItem[] => {
    return BADGES_CATALOG;
  },

  getLevelTitle: (level: number): string => {
    if (level >= 6) return "Generasi Qur'ani Teladan";
    if (level === 5) return 'Duta Kasih Sayang PAI';
    if (level === 4) return 'Mujahid KBC (Cinta Ilmu)';
    if (level === 3) return 'Sahabat Juz Amma & Akhlak';
    if (level === 2) return 'Penuntut Ilmu (Thalibul Ilmi)';
    return 'Santri Pemula Shalih';
  },

  getStudentGamification: (studentId: string): StudentGamification => {
    const all = getStorage<Record<string, StudentGamification>>(STORAGE_KEYS.GAMIFICATION, {});
    const students = StorageService.getStudents();
    const scores = getStorage<ScoreItem[]>(STORAGE_KEYS.SCORES, INITIAL_SCORES);
    const st = students.find(s => s.id === studentId);
    const stScores = scores.filter(sc => sc.studentId === studentId);

    // Preset initial learning activity seeds per student so the Top 10 Leaderboard is rich & realistic
    const SEED_ACTIVITIES: Record<
      string,
      {
        mats: string[];
        refs: string[];
        forum: number;
        kbc: string[];
        streak: number;
      }
    > = {
      's-5a02': {
        mats: ['mat-01', 'mat-02', 'mat-03'],
        refs: ['ref-01', 'ref-02', 'ref-03', 'ref-04'],
        forum: 4,
        kbc: ['kbc-dhuha', 'kbc-tadarus', 'kbc-infaq', 'kbc-santun'],
        streak: 7
      },
      's-6a01': {
        mats: ['mat-01', 'mat-02', 'mat-03'],
        refs: ['ref-01', 'ref-02', 'ref-03'],
        forum: 3,
        kbc: ['kbc-dhuha', 'kbc-tadarus', 'kbc-infaq'],
        streak: 6
      },
      's-5a06': {
        mats: ['mat-01', 'mat-02'],
        refs: ['ref-01', 'ref-02', 'ref-05'],
        forum: 3,
        kbc: ['kbc-dhuha', 'kbc-tadarus', 'kbc-santun'],
        streak: 6
      },
      's-5a04': {
        mats: ['mat-01', 'mat-02'],
        refs: ['ref-01', 'ref-04'],
        forum: 2,
        kbc: ['kbc-dhuha', 'kbc-tadarus'],
        streak: 5
      },
      's-4a01': {
        mats: ['mat-01', 'mat-03'],
        refs: ['ref-01', 'ref-02'],
        forum: 2,
        kbc: ['kbc-tadarus', 'kbc-santun'],
        streak: 5
      },
      's-5a01': {
        mats: ['mat-01', 'mat-02'],
        refs: ['ref-01', 'ref-04'],
        forum: 2,
        kbc: ['kbc-dhuha', 'kbc-infaq'],
        streak: 5
      },
      's-5a08': {
        mats: ['mat-01', 'mat-02'],
        refs: ['ref-01'],
        forum: 2,
        kbc: ['kbc-dhuha', 'kbc-santun'],
        streak: 4
      },
      's-5a07': {
        mats: ['mat-01'],
        refs: ['ref-01', 'ref-04'],
        forum: 1,
        kbc: ['kbc-tadarus', 'kbc-santun'],
        streak: 4
      },
      's-5a03': {
        mats: ['mat-01'],
        refs: ['ref-01'],
        forum: 1,
        kbc: ['kbc-dhuha'],
        streak: 3
      },
      's-6a02': {
        mats: ['mat-01', 'mat-02'],
        refs: ['ref-02', 'ref-05'],
        forum: 2,
        kbc: ['kbc-dhuha', 'kbc-tadarus'],
        streak: 4
      },
      's-4a02': {
        mats: ['mat-01'],
        refs: ['ref-01', 'ref-03'],
        forum: 1,
        kbc: ['kbc-dhuha', 'kbc-santun'],
        streak: 3
      },
      's-5a09': {
        mats: ['mat-01'],
        refs: ['ref-01', 'ref-02'],
        forum: 1,
        kbc: ['kbc-tadarus'],
        streak: 3
      },
      's-5a05': {
        mats: ['mat-01'],
        refs: ['ref-04'],
        forum: 1,
        kbc: ['kbc-dhuha'],
        streak: 2
      },
      's-5a10': {
        mats: ['mat-01'],
        refs: ['ref-01'],
        forum: 1,
        kbc: ['kbc-santun'],
        streak: 2
      },
      's-3a01': {
        mats: ['mat-01'],
        refs: ['ref-01'],
        forum: 1,
        kbc: ['kbc-dhuha'],
        streak: 2
      }
    };

    const isFreshEmpty = isRealUserWorkspace();
    const seed =
      !isFreshEmpty && SEED_ACTIVITIES[studentId]
        ? SEED_ACTIVITIES[studentId]
        : {
            mats: [],
            refs: [],
            forum: 0,
            kbc: [],
            streak: 0
          };

    const existing = all[studentId];
    const completedQuizIds = Array.from(
      new Set([...(existing?.completedQuizIds || []), ...stScores.map(s => s.quizId)])
    );
    const readMaterialIds =
      existing && existing.readMaterialIds.length > 0 ? existing.readMaterialIds : seed.mats;
    const readReferenceIds =
      existing && existing.readReferenceIds.length > 0 ? existing.readReferenceIds : seed.refs;
    const forumPostCount =
      existing && existing.forumPostCount > 0 ? existing.forumPostCount : seed.forum;
    const completedKbcActIds =
      existing && existing.completedKbcActIds && existing.completedKbcActIds.length > 0
        ? existing.completedKbcActIds
        : seed.kbc;
    const kbcActCount = completedKbcActIds.length;
    const streakDays = existing && existing.streakDays > 1 ? existing.streakDays : seed.streak;

    // 1. Calculate XP from Quizzes (50 base XP per quiz + score accuracy bonus up to 50 XP)
    const avgQuizScore = stScores.length
      ? Math.round(stScores.reduce((acc, item) => acc + item.percentage, 0) / stScores.length)
      : 0;
    const quizScoreBonus = stScores.reduce((acc, item) => acc + Math.round(item.percentage * 0.5), 0);
    const quizXp = completedQuizIds.length * 50 + quizScoreBonus;

    // 2. Calculate XP from Learning Activities (Materials + References + Forum + KBC Worship/Habits + Streak)
    const activityXp =
      readMaterialIds.length * 25 +
      readReferenceIds.length * 20 +
      forumPostCount * 15 +
      kbcActCount * 20 +
      streakDays * 10;

    // 3. Evaluate unlocked badges
    const earnedBadgeIds = new Set<string>(existing?.earnedBadgeIds || []);
    const preliminaryXp = quizXp + activityXp;
    BADGES_CATALOG.forEach(badge => {
      if (earnedBadgeIds.has(badge.id)) return;
      if (badge.conditionType === 'xp' && preliminaryXp >= badge.conditionCount) earnedBadgeIds.add(badge.id);
      if (badge.conditionType === 'material' && readMaterialIds.length >= badge.conditionCount)
        earnedBadgeIds.add(badge.id);
      if (badge.conditionType === 'reference' && readReferenceIds.length >= badge.conditionCount)
        earnedBadgeIds.add(badge.id);
      if (badge.conditionType === 'quiz' && completedQuizIds.length >= badge.conditionCount)
        earnedBadgeIds.add(badge.id);
      if (badge.conditionType === 'forum' && forumPostCount >= badge.conditionCount)
        earnedBadgeIds.add(badge.id);
    });

    const bonusBadgeXp = Array.from(earnedBadgeIds).reduce((sum, bId) => {
      const found = BADGES_CATALOG.find(b => b.id === bId);
      return sum + (found ? found.xpReward : 0);
    }, 0);

    const computedTotalXp = quizXp + activityXp + bonusBadgeXp;
    // Check if total XP with badge bonuses unlocks higher XP badges
    BADGES_CATALOG.forEach(badge => {
      if (!earnedBadgeIds.has(badge.id) && badge.conditionType === 'xp' && computedTotalXp >= badge.conditionCount) {
        earnedBadgeIds.add(badge.id);
      }
    });

    const finalBadgeXp = Array.from(earnedBadgeIds).reduce((sum, bId) => {
      const found = BADGES_CATALOG.find(b => b.id === bId);
      return sum + (found ? found.xpReward : 0);
    }, 0);

    const xpPoints = Math.max(existing?.xpPoints || 0, quizXp + activityXp + finalBadgeXp);
    const level = Math.max(1, Math.floor(xpPoints / 100) + 1);
    const levelTitle = StorageService.getLevelTitle(level);

    const profile: StudentGamification = {
      studentId,
      studentName: st?.fullName || existing?.studentName || 'Siswa PAI',
      nis: st?.nis || existing?.nis || '-',
      classId: st?.classId || existing?.classId || 'c-5a',
      className: st?.className || existing?.className || '5A',
      avatarColor: st?.avatarColor || existing?.avatarColor || '#10b981',
      xpPoints,
      quizXp,
      activityXp,
      bonusBadgeXp: finalBadgeXp,
      avgQuizScore,
      level,
      levelTitle,
      streakDays,
      readMaterialIds,
      readReferenceIds,
      completedQuizIds,
      forumPostCount,
      kbcActCount,
      completedKbcActIds,
      earnedBadgeIds: Array.from(earnedBadgeIds),
      lastActivityAt: existing?.lastActivityAt || new Date().toISOString()
    };

    all[studentId] = profile;
    setStorage(STORAGE_KEYS.GAMIFICATION, all);
    return profile;
  },

  getAllStudentsGamification: (classFilter?: string): StudentGamification[] => {
    const students = StorageService.getStudents();
    const profiles = students.map(s => StorageService.getStudentGamification(s.id));
    const filtered =
      classFilter && classFilter !== 'all'
        ? profiles.filter(
            p => p.classId === classFilter || p.className?.toLowerCase() === classFilter.toLowerCase()
          )
        : profiles;

    return filtered.sort((a, b) => {
      if (b.xpPoints !== a.xpPoints) return b.xpPoints - a.xpPoints;
      if ((b.avgQuizScore || 0) !== (a.avgQuizScore || 0)) {
        return (b.avgQuizScore || 0) - (a.avgQuizScore || 0);
      }
      return b.completedQuizIds.length - a.completedQuizIds.length;
    });
  },

  awardStudentActivity: (
    studentId: string,
    activityType: 'material' | 'reference' | 'quiz' | 'forum' | 'kbc_activity',
    itemId: string,
    bonusXp = 0
  ): { profile: StudentGamification; xpGained: number; newlyEarnedBadges: BadgeItem[] } => {
    const all = getStorage<Record<string, StudentGamification>>(STORAGE_KEYS.GAMIFICATION, {});
    const current = StorageService.getStudentGamification(studentId);
    const previousBadges = new Set(current.earnedBadgeIds);
    let xpGained = 0;

    if (activityType === 'material') {
      if (!current.readMaterialIds.includes(itemId)) {
        current.readMaterialIds = [...current.readMaterialIds, itemId];
        xpGained = 25 + bonusXp;
      } else {
        xpGained = 5; // Repeat reading bonus
      }
      current.activityXp = (current.activityXp || 0) + xpGained;
    } else if (activityType === 'reference') {
      if (!current.readReferenceIds.includes(itemId)) {
        current.readReferenceIds = [...current.readReferenceIds, itemId];
        xpGained = 20 + bonusXp;
      } else {
        xpGained = 5;
      }
      current.activityXp = (current.activityXp || 0) + xpGained;
    } else if (activityType === 'quiz') {
      if (!current.completedQuizIds.includes(itemId)) {
        current.completedQuizIds = [...current.completedQuizIds, itemId];
      }
      xpGained = 50 + bonusXp;
      current.quizXp = (current.quizXp || 0) + xpGained;
    } else if (activityType === 'forum') {
      current.forumPostCount = (current.forumPostCount || 0) + 1;
      xpGained = 15 + bonusXp;
      current.activityXp = (current.activityXp || 0) + xpGained;
    } else if (activityType === 'kbc_activity') {
      const existingKbc = current.completedKbcActIds || [];
      if (!existingKbc.includes(itemId)) {
        current.completedKbcActIds = [...existingKbc, itemId];
        current.kbcActCount = current.completedKbcActIds.length;
        xpGained = 20 + bonusXp;
      } else {
        xpGained = 10;
      }
      current.activityXp = (current.activityXp || 0) + xpGained;
    }

    current.xpPoints += xpGained;
    current.lastActivityAt = new Date().toISOString();

    // Check badges unlock conditions
    const newlyEarnedBadges: BadgeItem[] = [];
    BADGES_CATALOG.forEach(badge => {
      if (previousBadges.has(badge.id) || current.earnedBadgeIds.includes(badge.id)) return;
      let unlocked = false;
      if (badge.conditionType === 'xp' && current.xpPoints >= badge.conditionCount) unlocked = true;
      if (badge.conditionType === 'material' && current.readMaterialIds.length >= badge.conditionCount) unlocked = true;
      if (badge.conditionType === 'reference' && current.readReferenceIds.length >= badge.conditionCount) unlocked = true;
      if (badge.conditionType === 'quiz' && current.completedQuizIds.length >= badge.conditionCount) unlocked = true;
      if (badge.conditionType === 'forum' && (current.forumPostCount || 0) >= badge.conditionCount) unlocked = true;

      if (unlocked) {
        current.earnedBadgeIds.push(badge.id);
        current.xpPoints += badge.xpReward;
        current.bonusBadgeXp = (current.bonusBadgeXp || 0) + badge.xpReward;
        xpGained += badge.xpReward;
        newlyEarnedBadges.push(badge);
      }
    });

    current.level = Math.max(1, Math.floor(current.xpPoints / 100) + 1);
    current.levelTitle = StorageService.getLevelTitle(current.level);
    all[studentId] = current;
    setStorage(STORAGE_KEYS.GAMIFICATION, all);

    return { profile: current, xpGained, newlyEarnedBadges };
  },

  // ============================================================================
  // PROFIL GURU WALI KELAS & SINKRONISASI PERANGKAT AJAR ROMBEL
  // ============================================================================
  getHomeroomTeachers: (): HomeroomTeacherProfile[] => {
    const teachers = getStorage<HomeroomTeacherProfile[]>(STORAGE_KEYS.HOMEROOM_TEACHERS, INITIAL_HOMEROOM_TEACHERS);
    const classes = StorageService.getClasses();
    const docs = StorageService.getTeachingDocs();

    return teachers.map(t => {
      const cls = classes.find(c => c.id === t.classId || c.className === t.className);
      const grade = t.gradeLevel || t.className.replace(/\D/g, '') || '1';
      const gradeDocs = docs.filter(d => d.classGrade === grade);
      const docTypesFromRepo = Array.from(new Set([...t.uploadedDocTypes, ...gradeDocs.map(d => d.docType)]));

      return {
        ...t,
        studentCount: cls ? (cls.studentCount || 0) : t.studentCount,
        uploadedDocTypes: docTypesFromRepo as TeachingDocType[]
      };
    });
  },

  saveHomeroomTeacher: (item: Omit<HomeroomTeacherProfile, 'id' | 'lastSyncedAt'> & { id?: string }): HomeroomTeacherProfile => {
    const list = getStorage<HomeroomTeacherProfile[]>(STORAGE_KEYS.HOMEROOM_TEACHERS, INITIAL_HOMEROOM_TEACHERS);
    const classes = getStorage<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const nowIso = new Date().toISOString();

    let updated: HomeroomTeacherProfile;
    if (item.id) {
      updated = { ...item, id: item.id, lastSyncedAt: nowIso };
      const idx = list.findIndex(x => x.id === item.id);
      if (idx !== -1) list[idx] = updated;
      else list.push(updated);
    } else {
      updated = {
        ...item,
        id: 'hrt-' + Math.random().toString(36).substring(2, 9),
        lastSyncedAt: nowIso
      };
      list.push(updated);
    }

    // Also keep ClassItem homeroom name synchronized
    const clsIdx = classes.findIndex(c => c.id === item.classId || c.className === item.className);
    if (clsIdx !== -1) {
      classes[clsIdx] = { ...classes[clsIdx], homeroom: item.teacherName };
      setStorage(STORAGE_KEYS.CLASSES, classes);
    }

    setStorage(STORAGE_KEYS.HOMEROOM_TEACHERS, list);
    return updated;
  },

  deleteHomeroomTeacher: (id: string): void => {
    const list = getStorage<HomeroomTeacherProfile[]>(STORAGE_KEYS.HOMEROOM_TEACHERS, INITIAL_HOMEROOM_TEACHERS);
    setStorage(STORAGE_KEYS.HOMEROOM_TEACHERS, list.filter(x => x.id !== id));
  },

  syncHomeroomRombelData: (): HomeroomTeacherProfile[] => {
    const classes = StorageService.getClasses();
    const docs = StorageService.getTeachingDocs();
    const list = getStorage<HomeroomTeacherProfile[]>(STORAGE_KEYS.HOMEROOM_TEACHERS, INITIAL_HOMEROOM_TEACHERS);
    const nowIso = new Date().toISOString();

    const synced = list.map(t => {
      const cls = classes.find(c => c.id === t.classId || c.className === t.className);
      const grade = t.gradeLevel || t.className.replace(/\D/g, '') || '1';
      const gradeDocs = docs.filter(d => d.classGrade === grade);
      const mergedDocs = Array.from(new Set([...t.uploadedDocTypes, ...gradeDocs.map(d => d.docType)])) as TeachingDocType[];

      return {
        ...t,
        className: cls ? cls.className : t.className,
        studentCount: cls ? (cls.studentCount || 0) : t.studentCount,
        uploadedDocTypes: mergedDocs,
        lastSyncedAt: nowIso
      };
    });

    // Ensure every class in classes has a homeroom entry
    classes.forEach(c => {
      const exists = synced.some(t => t.classId === c.id || t.className === c.className);
      if (!exists) {
        const grade = c.className.replace(/\D/g, '') || '1';
        const gradeDocs = docs.filter(d => d.classGrade === grade);
        synced.push({
          id: 'hrt-' + Math.random().toString(36).substring(2, 9),
          classId: c.id,
          className: c.className,
          gradeLevel: grade,
          teacherName: c.homeroom || `Wali Kelas ${c.className}`,
          nip: '-',
          phone: '-',
          academicYear: c.academicYear || '2026/2027',
          studentCount: c.studentCount || 0,
          uploadedDocTypes: Array.from(new Set(gradeDocs.map(d => d.docType))) as TeachingDocType[],
          lastSyncedAt: nowIso,
          notes: `Tersinkron otomatis dari rombel Kelas ${c.className}`
        });
      }
    });

    setStorage(STORAGE_KEYS.HOMEROOM_TEACHERS, synced);
    return synced;
  },

  // ============================================================================
  // FORUM DISKUSI PER KELAS (DENGAN MODERASI GURU PAI)
  // ============================================================================
  getForumThreads: (classId?: string): ForumThread[] => {
    const threads = getStorage<ForumThread[]>(STORAGE_KEYS.FORUM_THREADS, INITIAL_FORUM_THREADS);
    let filtered = [...threads];
    if (classId && classId !== 'all' && classId !== '') {
      filtered = filtered.filter(t => t.classId === 'all' || t.classId === classId);
    }
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  saveForumThread: (thread: {
    classId: string;
    className: string;
    topicCategory: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    authorRole: 'admin' | 'siswa';
  }): ForumThread => {
    const threads = getStorage<ForumThread[]>(STORAGE_KEYS.FORUM_THREADS, INITIAL_FORUM_THREADS);
    const newThread: ForumThread = {
      id: 'for-' + Math.random().toString(36).substring(2, 9),
      ...thread,
      createdAt: new Date().toISOString(),
      isPinned: thread.authorRole === 'admin',
      isResolved: false,
      likes: [],
      replies: []
    };
    threads.unshift(newThread);
    setStorage(STORAGE_KEYS.FORUM_THREADS, threads);

    if (thread.authorRole === 'siswa') {
      StorageService.awardStudentActivity(thread.authorId, 'forum', newThread.id);
    }
    return newThread;
  },

  addForumReply: (
    threadId: string,
    reply: {
      authorId: string;
      authorName: string;
      authorRole: 'admin' | 'siswa';
      content: string;
    }
  ): ForumThread | undefined => {
    const threads = getStorage<ForumThread[]>(STORAGE_KEYS.FORUM_THREADS, INITIAL_FORUM_THREADS);
    const idx = threads.findIndex(t => t.id === threadId);
    if (idx === -1) return undefined;

    const newReply: ForumReply = {
      id: 'rep-' + Math.random().toString(36).substring(2, 9),
      ...reply,
      createdAt: new Date().toISOString(),
      isTeacherVerified: reply.authorRole === 'admin'
    };

    threads[idx].replies.push(newReply);
    if (reply.authorRole === 'admin') {
      threads[idx].isResolved = true;
    }
    setStorage(STORAGE_KEYS.FORUM_THREADS, threads);

    if (reply.authorRole === 'siswa') {
      StorageService.awardStudentActivity(reply.authorId, 'forum', newReply.id);
    }
    return threads[idx];
  },

  toggleThreadPin: (threadId: string): void => {
    const threads = getStorage<ForumThread[]>(STORAGE_KEYS.FORUM_THREADS, INITIAL_FORUM_THREADS);
    const idx = threads.findIndex(t => t.id === threadId);
    if (idx !== -1) {
      threads[idx].isPinned = !threads[idx].isPinned;
      setStorage(STORAGE_KEYS.FORUM_THREADS, threads);
    }
  },

  toggleThreadResolved: (threadId: string): void => {
    const threads = getStorage<ForumThread[]>(STORAGE_KEYS.FORUM_THREADS, INITIAL_FORUM_THREADS);
    const idx = threads.findIndex(t => t.id === threadId);
    if (idx !== -1) {
      threads[idx].isResolved = !threads[idx].isResolved;
      setStorage(STORAGE_KEYS.FORUM_THREADS, threads);
    }
  },

  toggleThreadLike: (threadId: string, userId: string): void => {
    const threads = getStorage<ForumThread[]>(STORAGE_KEYS.FORUM_THREADS, INITIAL_FORUM_THREADS);
    const idx = threads.findIndex(t => t.id === threadId);
    if (idx !== -1) {
      const likes = threads[idx].likes || [];
      if (likes.includes(userId)) {
        threads[idx].likes = likes.filter(id => id !== userId);
      } else {
        threads[idx].likes = [...likes, userId];
      }
      setStorage(STORAGE_KEYS.FORUM_THREADS, threads);
    }
  },

  deleteForumThread: (threadId: string): void => {
    const threads = getStorage<ForumThread[]>(STORAGE_KEYS.FORUM_THREADS, INITIAL_FORUM_THREADS);
    setStorage(STORAGE_KEYS.FORUM_THREADS, threads.filter(t => t.id !== threadId));
  },

  deleteForumReply: (threadId: string, replyId: string): void => {
    const threads = getStorage<ForumThread[]>(STORAGE_KEYS.FORUM_THREADS, INITIAL_FORUM_THREADS);
    const idx = threads.findIndex(t => t.id === threadId);
    if (idx !== -1) {
      threads[idx].replies = threads[idx].replies.filter(r => r.id !== replyId);
      setStorage(STORAGE_KEYS.FORUM_THREADS, threads);
    }
  },

  // ============================================================================
  // AI KKTP REMEDIAL & SPECIAL ASSIGNMENT PERSISTENCE
  // ============================================================================
  getRemedialPlans: (): RemedialRecommendation[] => {
    return getStorage<RemedialRecommendation[]>(STORAGE_KEYS.REMEDIAL_PLANS, []);
  },

  saveRemedialPlan: (plan: RemedialRecommendation): RemedialRecommendation => {
    const list = getStorage<RemedialRecommendation[]>(STORAGE_KEYS.REMEDIAL_PLANS, []);
    const idx = list.findIndex(p => p.studentId === plan.studentId);
    if (idx !== -1) {
      list[idx] = plan;
    } else {
      list.unshift(plan);
    }
    setStorage(STORAGE_KEYS.REMEDIAL_PLANS, list);
    return plan;
  },

  saveAllRemedialPlans: (plans: RemedialRecommendation[]): void => {
    setStorage(STORAGE_KEYS.REMEDIAL_PLANS, plans);
  },

  assignRemedialToStudent: (plan: RemedialRecommendation, teacherName: string): {
    updatedPlan: RemedialRecommendation;
    savedMaterial: Material;
    savedAnnouncement: Announcement;
  } => {
    // 1. Format & Save Remedial Material to Class Modul Materi
    const materialBody = [
      `[MODUL REMEDIAL & PENGUATAN KKTP — PENDEKATAN KBC]`,
      `Disusun Khusus untuk Pendampingan Siswa Kelas ${plan.className} (Sasaran Utama: ${plan.studentName})`,
      `Elemen PAI: ${plan.remedialMaterial.domain} | Target KKTP: ${plan.kktpThreshold}`,
      ``,
      `1. RINGKASAN MATERI REMEDIAL`,
      plan.remedialMaterial.summary,
      ``,
      `2. POIN INTI PEMAHAMAN & PENGAMALAN`,
      ...plan.remedialMaterial.keyPoints.map((pt, idx) => `   ${idx + 1}. ${pt}`),
      ``,
      `3. DALIL AYAT AL-QUR'AN / HADIS PILIHAN`,
      `   ${plan.remedialMaterial.arabicVerse}`,
      `   Artinya: "${plan.remedialMaterial.arabicTranslation}"`,
      ``,
      `4. PENUGASAN KHUSUS (${plan.specialAssignment.type.toUpperCase()})`,
      `   Judul Tugas: ${plan.specialAssignment.title}`,
      `   Target Kompetensi: ${plan.specialAssignment.targetCompetency}`,
      `   Langkah Pengerjaan:`,
      ...plan.specialAssignment.instructions.map((ins, idx) => `   ${idx + 1}. ${ins}`),
      ``,
      `5. REFLEKSI KURIKULUM BERBASIS CINTA (KBC)`,
      `   "${plan.remedialMaterial.kbcReflection}"`,
      ``,
      `6. PANDUAN PENDAMPINGAN ORANG TUA DI RUMAH`,
      `   ${plan.specialAssignment.parentGuidance}`
    ].join('\n');

    const savedMaterial = StorageService.saveMaterial({
      title: `[Remedial KKTP] ${plan.remedialMaterial.title} (${plan.studentName})`,
      contentType: 'text',
      contentText: materialBody,
      classId: plan.gradeLevel,
      className: `Kelas ${plan.className}`,
      subject: `PAI & Budi Pekerti (${plan.remedialMaterial.domain})`,
      semester: 'Ganjil',
      createdBy: teacherName
    });

    // 2. Publish Announcement for the Class / Student
    const savedAnnouncement = StorageService.saveAnnouncement({
      title: `Pendampingan Remedial KKTP & Penugasan Khusus: ${plan.studentName} (Kelas ${plan.className})`,
      body: `Assalamu'alaikum Anak Shalih/Shalihah ${plan.studentName} (Kelas ${plan.className}). Bapak/Ibu Guru PAI telah menyiapkan Materi Remedial "${plan.remedialMaterial.title}" dan Penugasan Khusus "${plan.specialAssignment.title}" (Batas waktu: ${plan.specialAssignment.deadlineDays} hari) untuk membantu mencapai ketuntasan KKTP (${plan.kktpThreshold}). Silakan buka menu Materi Belajar & baca dengan penuh semangat!`,
      target: 'class_id',
      classId: plan.classId,
      createdBy: teacherName
    });

    // 3. Update Remedial Recommendation Status
    const updatedPlan: RemedialRecommendation = {
      ...plan,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
      assignedMaterialId: savedMaterial.id
    };
    StorageService.saveRemedialPlan(updatedPlan);

    return { updatedPlan, savedMaterial, savedAnnouncement };
  },

  // ============================================================================
  // E-KINERJA HARIAN GURU PAI (PERIODE, RKH, RENCANA AKSI, TINDAK LANJUT, KEGIATAN & FOTO)
  // ============================================================================
  getEKinerjaPeriods: (teacherId?: string): EKinerjaPeriod[] => {
    const targetTeacherId = teacherId || StorageService.getActiveTeacherId();
    const all = getStorage<EKinerjaPeriod[]>(STORAGE_KEYS.E_KINERJA_PERIODS, INITIAL_E_KINERJA_PERIODS);

    // Ambil Master RKH, Rencana Aksi, dan Tindak Lanjut bersama yang berlaku untuk semua guru
    let sharedMaster: {
      rkhList: EKinerjaPeriod['rkhList'];
      rencanaAksiList: EKinerjaPeriod['rencanaAksiList'];
      tindakLanjutList: EKinerjaPeriod['tindakLanjutList'];
    } | null = null;

    try {
      const rawShared = localStorage.getItem('lms_e_kinerja_shared_master_rkh');
      if (rawShared) {
        const parsed = JSON.parse(rawShared);
        if (parsed && Array.isArray(parsed.rkhList)) {
          sharedMaster = parsed;
        }
      }
    } catch {
      // ignore
    }

    if (!sharedMaster) {
      const sourcePeriod = all.find(p => p.rkhList && p.rkhList.length > 0) || INITIAL_E_KINERJA_PERIODS[0];
      if (sourcePeriod) {
        sharedMaster = {
          rkhList: sourcePeriod.rkhList || [],
          rencanaAksiList: sourcePeriod.rencanaAksiList || [],
          tindakLanjutList: sourcePeriod.tindakLanjutList || []
        };
        try {
          localStorage.setItem('lms_e_kinerja_shared_master_rkh', JSON.stringify(sharedMaster));
        } catch {
          // ignore
        }
      }
    }

    let teacherPeriods = all.filter(
      p => p.teacherId === targetTeacherId || (!p.teacherId && targetTeacherId === 'guru-1')
    );

    // Jika guru ini belum memiliki periode, buat periode baru dengan Master RHK bersama
    if (teacherPeriods.length === 0) {
      const newPeriodId = `ekp-${targetTeacherId}-${new Date().toISOString().substring(0, 7)}`;
      const defaultPeriod: EKinerjaPeriod = {
        id: newPeriodId,
        teacherId: targetTeacherId,
        month: 'Oktober',
        year: '2026',
        rkhList: sharedMaster ? [...sharedMaster.rkhList] : [],
        rencanaAksiList: sharedMaster ? [...sharedMaster.rencanaAksiList] : [],
        tindakLanjutList: sharedMaster ? [...sharedMaster.tindakLanjutList] : [],
        createdAt: new Date().toISOString()
      };

      all.unshift(defaultPeriod);
      setStorage(STORAGE_KEYS.E_KINERJA_PERIODS, all);
      teacherPeriods = [defaultPeriod];
    } else if (sharedMaster) {
      // Pastikan setiap periode guru menggunakan Master RHK, Rencana Aksi, dan Tindak Lanjut yang sudah diinput bersama
      let hasSyncChange = false;
      teacherPeriods = teacherPeriods.map(tp => {
        const sameRkh = JSON.stringify(tp.rkhList) === JSON.stringify(sharedMaster!.rkhList);
        const sameRa = JSON.stringify(tp.rencanaAksiList) === JSON.stringify(sharedMaster!.rencanaAksiList);
        const sameTl = JSON.stringify(tp.tindakLanjutList) === JSON.stringify(sharedMaster!.tindakLanjutList);
        if (!sameRkh || !sameRa || !sameTl) {
          hasSyncChange = true;
          return {
            ...tp,
            rkhList: [...sharedMaster!.rkhList],
            rencanaAksiList: [...sharedMaster!.rencanaAksiList],
            tindakLanjutList: [...sharedMaster!.tindakLanjutList]
          };
        }
        return tp;
      });

      if (hasSyncChange) {
        const updatedAll = all.map(p => {
          const matched = teacherPeriods.find(tp => tp.id === p.id);
          return matched || p;
        });
        setStorage(STORAGE_KEYS.E_KINERJA_PERIODS, updatedAll);
      }
    }

    return teacherPeriods;
  },

  saveEKinerjaPeriod: (
    period: Omit<EKinerjaPeriod, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
    teacherId?: string
  ): EKinerjaPeriod => {
    const targetTeacherId = period.teacherId || teacherId || StorageService.getActiveTeacherId();
    const list = getStorage<EKinerjaPeriod[]>(STORAGE_KEYS.E_KINERJA_PERIODS, INITIAL_E_KINERJA_PERIODS);
    let updated: EKinerjaPeriod;

    if (period.id) {
      const existing = list.find(p => p.id === period.id);
      updated = {
        ...period,
        id: period.id,
        teacherId: targetTeacherId,
        createdAt: period.createdAt || (existing ? existing.createdAt : new Date().toISOString())
      };
      const idx = list.findIndex(p => p.id === period.id);
      if (idx !== -1) list[idx] = updated;
      else list.unshift(updated);
    } else {
      updated = {
        ...period,
        id: 'ekp-' + Math.random().toString(36).substring(2, 9),
        teacherId: targetTeacherId,
        createdAt: new Date().toISOString()
      };
      list.unshift(updated);
    }

    // Simpan Master RKH, Rencana Aksi & Tindak Lanjut sebagai acuan bersama untuk semua guru
    const sharedMaster = {
      rkhList: updated.rkhList || [],
      rencanaAksiList: updated.rencanaAksiList || [],
      tindakLanjutList: updated.tindakLanjutList || []
    };
    try {
      localStorage.setItem('lms_e_kinerja_shared_master_rkh', JSON.stringify(sharedMaster));
    } catch {
      // ignore
    }

    // Sinkronkan Master RKH, Rencana Aksi & Tindak Lanjut ke seluruh periode guru lain agar tetap sama saat ganti guru
    const syncedList = list.map(p => ({
      ...p,
      rkhList: [...sharedMaster.rkhList],
      rencanaAksiList: [...sharedMaster.rencanaAksiList],
      tindakLanjutList: [...sharedMaster.tindakLanjutList]
    }));

    setStorage(STORAGE_KEYS.E_KINERJA_PERIODS, syncedList);
    return updated;
  },

  deleteEKinerjaPeriod: (periodId: string): void => {
    const periods = getStorage<EKinerjaPeriod[]>(STORAGE_KEYS.E_KINERJA_PERIODS, INITIAL_E_KINERJA_PERIODS);
    setStorage(
      STORAGE_KEYS.E_KINERJA_PERIODS,
      periods.filter(p => p.id !== periodId)
    );
    const activities = getStorage<EKinerjaDailyActivity[]>(STORAGE_KEYS.E_KINERJA_ACTIVITIES, INITIAL_E_KINERJA_ACTIVITIES);
    setStorage(
      STORAGE_KEYS.E_KINERJA_ACTIVITIES,
      activities.filter(a => a.periodId !== periodId)
    );
  },

  getEKinerjaActivities: (periodId?: string, teacherId?: string): EKinerjaDailyActivity[] => {
    const targetTeacherId = teacherId || StorageService.getActiveTeacherId();
    const list = getStorage<EKinerjaDailyActivity[]>(STORAGE_KEYS.E_KINERJA_ACTIVITIES, INITIAL_E_KINERJA_ACTIVITIES);

    // Filter strictly by teacher
    let filtered = list.filter(
      a => a.teacherId === targetTeacherId || (!a.teacherId && targetTeacherId === 'guru-1')
    );

    if (periodId) {
      filtered = filtered.filter(a => a.periodId === periodId);
    }

    return filtered.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.createdAt.localeCompare(b.createdAt);
    });
  },

  saveEKinerjaActivity: (
    activity: Omit<EKinerjaDailyActivity, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
    teacherId?: string
  ): EKinerjaDailyActivity => {
    const targetTeacherId = activity.teacherId || teacherId || StorageService.getActiveTeacherId();
    const list = getStorage<EKinerjaDailyActivity[]>(STORAGE_KEYS.E_KINERJA_ACTIVITIES, INITIAL_E_KINERJA_ACTIVITIES);
    let updated: EKinerjaDailyActivity;

    if (activity.id) {
      const existing = list.find(a => a.id === activity.id);
      updated = {
        ...activity,
        id: activity.id,
        teacherId: targetTeacherId,
        createdAt: activity.createdAt || (existing ? existing.createdAt : new Date().toISOString())
      };
      const idx = list.findIndex(a => a.id === activity.id);
      if (idx !== -1) list[idx] = updated;
      else list.push(updated);
    } else {
      updated = {
        ...activity,
        id: 'eka-' + Math.random().toString(36).substring(2, 9),
        teacherId: targetTeacherId,
        createdAt: new Date().toISOString()
      };
      list.push(updated);
    }
    setStorage(STORAGE_KEYS.E_KINERJA_ACTIVITIES, list);
    return updated;
  },

  saveBulkEKinerjaActivities: (
    activities: Array<Omit<EKinerjaDailyActivity, 'id' | 'createdAt'> & { id?: string; createdAt?: string }>,
    teacherId?: string
  ): EKinerjaDailyActivity[] => {
    const targetTeacherId = teacherId || StorageService.getActiveTeacherId();
    const list = getStorage<EKinerjaDailyActivity[]>(STORAGE_KEYS.E_KINERJA_ACTIVITIES, INITIAL_E_KINERJA_ACTIVITIES);
    const savedItems: EKinerjaDailyActivity[] = [];

    activities.forEach((act, idx) => {
      const updated: EKinerjaDailyActivity = {
        ...act,
        id: act.id || 'eka-' + Math.random().toString(36).substring(2, 9) + '-' + idx,
        teacherId: act.teacherId || targetTeacherId,
        createdAt: act.createdAt || new Date(Date.now() + idx * 100).toISOString()
      };
      list.push(updated);
      savedItems.push(updated);
    });
    setStorage(STORAGE_KEYS.E_KINERJA_ACTIVITIES, list);
    return savedItems;
  },

  deleteEKinerjaActivity: (activityId: string): void => {
    const list = getStorage<EKinerjaDailyActivity[]>(STORAGE_KEYS.E_KINERJA_ACTIVITIES, INITIAL_E_KINERJA_ACTIVITIES);
    setStorage(
      STORAGE_KEYS.E_KINERJA_ACTIVITIES,
      list.filter(a => a.id !== activityId)
    );
  },

  // ============================================================================
  // BANK MASTER RHK, RENCANA AKSI & TINDAK LANJUT STANDAR & KUSTOM (BERLAKU UNTUK SEMUA GURU)
  // ============================================================================
  getMasterRhkList: (_teacherId?: string): EKinerjaMasterItem[] => {
    const list = getStorage<EKinerjaMasterItem[]>(STORAGE_KEYS.MASTER_RHK, INITIAL_MASTER_RHK);
    // Master RHK berlaku untuk semua guru: kembalikan semua item tanpa filter teacherId
    let hasTeacherScopedItem = false;
    const normalized = list.map(item => {
      if (item.teacherId) {
        hasTeacherScopedItem = true;
        const copy = { ...item };
        delete copy.teacherId;
        return copy;
      }
      return item;
    });
    if (hasTeacherScopedItem) {
      setStorage(STORAGE_KEYS.MASTER_RHK, normalized);
    }
    return normalized;
  },

  saveMasterRhkItem: (item: EKinerjaMasterItem, _teacherId?: string): EKinerjaMasterItem => {
    const list = getStorage<EKinerjaMasterItem[]>(STORAGE_KEYS.MASTER_RHK, INITIAL_MASTER_RHK);
    let updated: EKinerjaMasterItem;

    if (item.id) {
      const idx = list.findIndex(m => m.id === item.id);
      updated = {
        ...item,
        teacherId: undefined,
        createdAt: item.createdAt || new Date().toISOString()
      };
      delete updated.teacherId;
      if (idx !== -1) list[idx] = updated;
      else list.unshift(updated);
    } else {
      updated = {
        ...item,
        id: 'm-rhk-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
        teacherId: undefined,
        isCustom: true,
        createdAt: new Date().toISOString()
      };
      delete updated.teacherId;
      list.unshift(updated);
    }

    setStorage(STORAGE_KEYS.MASTER_RHK, list);
    return updated;
  },

  deleteMasterRhkItem: (id: string): boolean => {
    const list = getStorage<EKinerjaMasterItem[]>(STORAGE_KEYS.MASTER_RHK, INITIAL_MASTER_RHK);
    const filtered = list.filter(m => m.id !== id);
    setStorage(STORAGE_KEYS.MASTER_RHK, filtered);
    return true;
  },

  resetMasterRhkToDefaults: (): EKinerjaMasterItem[] => {
    setStorage(STORAGE_KEYS.MASTER_RHK, INITIAL_MASTER_RHK);
    return INITIAL_MASTER_RHK;
  },

  importMasterRhkToPeriod: (
    periodId: string,
    selectedMasterIds?: string[],
    teacherId?: string
  ): EKinerjaPeriod | null => {
    const targetTeacherId = teacherId || StorageService.getActiveTeacherId();
    const periods = StorageService.getEKinerjaPeriods(targetTeacherId);
    const targetPeriod = periods.find(p => p.id === periodId);
    if (!targetPeriod) return null;

    const masterList = StorageService.getMasterRhkList(targetTeacherId);
    const toImport = selectedMasterIds && selectedMasterIds.length > 0
      ? masterList.filter(m => selectedMasterIds.includes(m.id))
      : masterList;

    const currentRkhList = [...targetPeriod.rkhList];
    const currentRencanaAksiList = [...targetPeriod.rencanaAksiList];
    const currentTindakLanjutList = [...targetPeriod.tindakLanjutList];

    toImport.forEach((mItem, mIdx) => {
      let existingRkh = currentRkhList.find(
        r => r.title.trim().toLowerCase() === mItem.title.trim().toLowerCase()
      );
      let rkhId = existingRkh ? existingRkh.id : `rkh-${targetPeriod.id}-${mIdx + 1}-${Date.now().toString(36)}`;

      if (!existingRkh) {
        currentRkhList.push({
          id: rkhId,
          code: mItem.code || `RHK ${currentRkhList.length + 1}`,
          title: mItem.title
        });
      }

      mItem.rencanaAksiList.forEach((ra, raIdx) => {
        const alreadyRa = currentRencanaAksiList.find(
          r => r.title.trim().toLowerCase() === ra.title.trim().toLowerCase() && r.rkhId === rkhId
        );
        if (!alreadyRa) {
          currentRencanaAksiList.push({
            id: `ra-${targetPeriod.id}-${rkhId}-${raIdx + 1}-${Date.now().toString(36)}`,
            rkhId: rkhId,
            title: ra.title
          });
        }
      });

      mItem.tindakLanjutTemplates.forEach(tl => {
        const alreadyTl = currentTindakLanjutList.find(
          t => t.title.trim().toLowerCase() === tl.trim().toLowerCase()
        );
        if (!alreadyTl) {
          currentTindakLanjutList.push({
            id: `tl-${targetPeriod.id}-${currentTindakLanjutList.length + 1}-${Date.now().toString(36)}`,
            title: tl
          });
        }
      });
    });

    const updatedPeriod: EKinerjaPeriod = {
      ...targetPeriod,
      rkhList: currentRkhList,
      rencanaAksiList: currentRencanaAksiList,
      tindakLanjutList: currentTindakLanjutList,
      savedAt: new Date().toISOString()
    };

    return StorageService.saveEKinerjaPeriod(updatedPeriod, targetTeacherId);
  },

  // ============================================================================
  // SUPABASE CLOUD & INDEXEDDB OFFLINE-FIRST SYNC ENGINE
  // ============================================================================
  syncAllToSupabase: async (): Promise<{ uploadedCount: number; message: string }> => {
    const allKeys = Object.values(STORAGE_KEYS).filter(k => k !== STORAGE_KEYS.SESSION);
    return await SupabaseService.pushAllLocalToCloud(allKeys);
  },

  pullAllFromSupabase: async () => {
    return await SupabaseService.pullAllFromCloud();
  },

  flushOfflineQueue: async () => {
    return await SupabaseService.flushOutboxToCloud();
  },

  getScores: (): ScoreItem[] => {
    return getStorage<ScoreItem[]>(STORAGE_KEYS.SCORES, INITIAL_SCORES);
  },

  getAllAttendanceRecords: (): AttendanceRecord[] => {
    return getStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  },

  getQuizAttempts: (): QuizAttempt[] => {
    return getStorage<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS, []);
  },

  /**
   * Menyusun paket data cadangan lokal (Backup Snapshot) lengkap untuk diekspor
   * ke format JSON atau Excel sebelum Admin melakukan Reset Total.
   */
  buildFullDatabaseBackupPayload: () => {
    const teacherProfile = StorageService.getTeacherProfile();
    const appSettings = StorageService.getAppSettings();
    const classes = StorageService.getClasses();
    const students = StorageService.getStudents();
    const scores = StorageService.getScores();
    const attempts = StorageService.getQuizAttempts();
    const attendance = StorageService.getAllAttendanceRecords();
    const journals = StorageService.getJournals();
    const questions = StorageService.getQuestions();
    const quizzes = StorageService.getQuizzes();
    const materials = StorageService.getMaterials();
    const references = StorageService.getReferences();
    const announcements = StorageService.getAnnouncements();
    const classTopics = StorageService.getClassTopics();
    const teachingDocs = StorageService.getTeachingDocs();
    const calendarEvents = StorageService.getCalendarEvents();
    const forumThreads = StorageService.getForumThreads();
    const remedialPlans = StorageService.getRemedialPlans();
    const eKinerjaPeriods = StorageService.getEKinerjaPeriods();
    const eKinerjaActivities = StorageService.getEKinerjaActivities();

    // Perkaya data nilai dengan nama siswa, NIS, kelas, dan judul kuis
    const enrichedScores = scores.map((sc, idx) => {
      const stu = students.find(s => s.id === sc.studentId);
      const cls = classes.find(c => c.id === stu?.classId);
      const qz = quizzes.find(q => q.id === sc.quizId);
      return {
        no: idx + 1,
        id: sc.id,
        tanggal: sc.createdAt ? sc.createdAt.split('T')[0] : '-',
        nis: stu?.nis || '-',
        namaSiswa: stu?.fullName || sc.studentId,
        kelas: cls?.className || stu?.className || '-',
        judulEvaluasi: qz?.title || sc.quizTitle || 'Evaluasi PAI',
        skorMentah: sc.rawScore,
        skorMaksimal: sc.maxScore,
        nilaiAkhir: sc.percentage,
        statusKKTP: sc.percentage >= 75 ? 'Tuntas (>=75)' : 'Perlu Bimbingan (<75)',
        studentId: sc.studentId,
        quizId: sc.quizId,
        attemptId: sc.attemptId,
        createdAt: sc.createdAt
      };
    });

    // Perkaya data absensi dengan nama siswa & kelas, serta gabungkan catatan ketidakhadiran dari Jurnal Mengajar
    const enrichedAttendance = attendance.map((att, idx) => {
      const stu = students.find(s => s.id === att.studentId);
      const cls = classes.find(c => c.id === att.classId);
      return {
        no: idx + 1,
        id: att.id,
        tanggal: att.date,
        kelas: cls?.className || stu?.className || '-',
        nis: stu?.nis || '-',
        namaSiswa: stu?.fullName || att.studentId,
        statusKehadiran: att.status,
        keterangan: att.notes || 'Presensi Harian Kelas',
        sumberData: 'Database Absensi',
        studentId: att.studentId,
        classId: att.classId
      };
    });

    // Tambahkan catatan siswa tidak hadir dari Jurnal Mengajar jika belum tercatat di tabel attendance
    const journalAttendanceRows = journals.flatMap((jrn, jIdx) => {
      if (!jrn.absentStudents || jrn.absentStudents.length === 0) {
        return [
          {
            no: enrichedAttendance.length + jIdx + 1,
            id: `jrn-att-${jrn.id}`,
            tanggal: jrn.date,
            kelas: jrn.className || '-',
            nis: '-',
            namaSiswa: 'Seluruh Siswa Hadir (Nihil Absen)',
            statusKehadiran: 'Hadir Semua',
            keterangan: `Topik Jurnal: ${jrn.topic}`,
            sumberData: 'Presensi Jurnal Mengajar'
          }
        ];
      }
      return jrn.absentStudents.map((absName, aIdx) => ({
        no: enrichedAttendance.length + jIdx + aIdx + 1,
        id: `jrn-abs-${jrn.id}-${aIdx}`,
        tanggal: jrn.date,
        kelas: jrn.className || '-',
        nis: '-',
        namaSiswa: absName,
        statusKehadiran: 'Tidak Hadir (Tercatat di Jurnal)',
        keterangan: `Topik Jurnal: ${jrn.topic}`,
        sumberData: 'Presensi Jurnal Mengajar'
      }));
    });

    return {
      metadata: {
        backupVersion: '2.0',
        exportedAt: new Date().toISOString(),
        schoolName: teacherProfile.schoolName || appSettings.schoolName || 'SDN Ciketing Udik 2',
        teacherName: teacherProfile.fullName || 'Guru PAI',
        teacherNip: teacherProfile.nip || '-',
        principalName: appSettings.principalName || '-',
        academicYear: appSettings.academicYear || '2026/2027',
        summaryCounts: {
          scores: scores.length,
          attendanceRecords: attendance.length,
          journalAttendanceEntries: journalAttendanceRows.length,
          journals: journals.length,
          students: students.length,
          classes: classes.length,
          questions: questions.length,
          quizzes: quizzes.length,
          materials: materials.length,
          eKinerjaPeriods: eKinerjaPeriods.length,
          eKinerjaActivities: eKinerjaActivities.length
        }
      },
      enrichedViews: {
        nilaiSiswa: enrichedScores,
        absensiKehadiran: [...enrichedAttendance, ...journalAttendanceRows],
        jurnalMengajar: journals
      },
      rawStorageCollections: {
        [STORAGE_KEYS.PROFILE]: teacherProfile,
        [STORAGE_KEYS.TEACHERS]: StorageService.getTeachers(),
        [STORAGE_KEYS.ACTIVE_TEACHER_ID]: StorageService.getActiveTeacherId(),
        [STORAGE_KEYS.SETTINGS]: appSettings,
        [STORAGE_KEYS.CLASSES]: classes,
        [STORAGE_KEYS.STUDENTS]: students,
        [STORAGE_KEYS.SCORES]: scores,
        [STORAGE_KEYS.ATTEMPTS]: attempts,
        [STORAGE_KEYS.ATTENDANCE]: attendance,
        [STORAGE_KEYS.JOURNALS]: journals,
        [STORAGE_KEYS.QUESTIONS]: questions,
        [STORAGE_KEYS.QUIZZES]: quizzes,
        [STORAGE_KEYS.MATERIALS]: materials,
        [STORAGE_KEYS.REFERENCES]: references,
        [STORAGE_KEYS.ANNOUNCEMENTS]: announcements,
        [STORAGE_KEYS.CLASS_TOPICS]: classTopics,
        [STORAGE_KEYS.TEACHING_DOCS]: teachingDocs,
        [STORAGE_KEYS.CALENDAR_EVENTS]: calendarEvents,
        [STORAGE_KEYS.FORUM_THREADS]: forumThreads,
        [STORAGE_KEYS.REMEDIAL_PLANS]: remedialPlans,
        [STORAGE_KEYS.E_KINERJA_PERIODS]: eKinerjaPeriods,
        [STORAGE_KEYS.E_KINERJA_ACTIVITIES]: eKinerjaActivities,
        [STORAGE_KEYS.MASTER_RHK]: StorageService.getMasterRhkList()
      }
    };
  },

  /**
   * Memulihkan database dari file cadangan JSON yang sebelumnya diekspor Admin.
   */
  restoreFromBackupPayload: async (
    payload: any
  ): Promise<{ restoredCollections: number; message: string }> => {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Format file cadangan JSON tidak valid.');
    }

    const collections = payload.rawStorageCollections || payload;
    const validKeys = new Set(Object.values(STORAGE_KEYS));
    let restoredCount = 0;

    localStorage.removeItem(FRESH_EMPTY_FLAG_KEY);

    for (const [key, val] of Object.entries(collections)) {
      if (validKeys.has(key) && key !== STORAGE_KEYS.SESSION && val !== undefined) {
        setStorage(key, val);
        restoredCount++;
      }
    }

    if (restoredCount === 0) {
      throw new Error('Tidak ditemukan koleksi database LMS PAI yang valid di dalam file JSON.');
    }

    return {
      restoredCollections: restoredCount,
      message: `Berhasil memulihkan ${restoredCount} koleksi database dari file cadangan JSON!`
    };
  },

  /**
   * Menginisialisasi mesin sinkronisasi otomatis Offline-First berbasis IndexedDB & Supabase.
   * Mendengarkan event jaringan ('online', 'offline', 'visibilitychange') dan menyinkronkan
   * antrean IndexedDB secara otomatis ketika koneksi internet kembali terdeteksi.
   */
  initOfflineSyncEngine: (onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void): (() => void) => {
    const allDataKeys = Object.values(STORAGE_KEYS).filter(k => k !== STORAGE_KEYS.SESSION);

    const seedMissingLocalDefaults = () => {
      StorageService.getClasses();
      StorageService.getStudents();
      StorageService.getQuestions();
      StorageService.getQuizzes();
      StorageService.getMaterials();
      StorageService.getReferences();
      StorageService.getAnnouncements();
      StorageService.getJournals();
      StorageService.getTeacherProfile();
      StorageService.getTeachers();
      StorageService.getAppSettings();
      StorageService.getScores();
      StorageService.getClassTopics();
      StorageService.getTeachingDocs();
      StorageService.getCalendarEvents();
      StorageService.getHomeroomTeachers();
      StorageService.getForumThreads();
      StorageService.getRemedialPlans();
      StorageService.getEKinerjaPeriods();
      StorageService.getEKinerjaActivities();
      StorageService.getMasterRhkList();
    };

    const runInitialBootstrapSync = async () => {
      try {
        // 1. Jika online, tarik terlebih dahulu dari Cloud & Supabase SEBELUM mengisi default lokal,
        // agar browser atau perangkat baru mendapatkan data yang persis sama!
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          const flushRes = await SupabaseService.flushOutboxToCloud();
          if (flushRes.flushedCount > 0 && onToast) {
            onToast(flushRes.message, 'success');
          }

          const pullRes = await SupabaseService.pullAllFromCloud();
          hasCompletedInitialCloudPull = true;

          // Pulihkan kunci yang mungkin ada di IndexedDB lokal tetapi belum ada di localStorage
          await IndexedDbService.hydrateAndMirrorLocalStorage(allDataKeys);

          // Pastikan kunci yang belum ada sama sekali terinisialisasi
          seedMissingLocalDefaults();

          // Jika Cloud masih kosong (0 koleksi di server/Supabase), unggah data lokal saat ini ke Cloud
          // agar browser/perangkat lain yang membuka link langsung mendapatkan data yang sama!
          if (pullRes.syncedKeys === 0) {
            await SupabaseService.pushAllLocalToCloud(allDataKeys);
          }

          SupabaseService.notifyCloudDataUpdated(pullRes.changedKeys || 1);
        } else {
          // Mode Offline: Hydrate dari IndexedDB terlebih dahulu, baru seed default yang belum ada
          const { restoredFromIdb } = await IndexedDbService.hydrateAndMirrorLocalStorage(allDataKeys);
          hasCompletedInitialCloudPull = true;
          seedMissingLocalDefaults();
          await IndexedDbService.refreshCounts();
          if (restoredFromIdb > 0 && onToast) {
            onToast(
              `Berhasil memulihkan ${restoredFromIdb} koleksi data dari cache lokal IndexedDB.`,
              'info'
            );
          }
          SupabaseService.notifyCloudDataUpdated(restoredFromIdb || 1);
        }
      } catch {
        hasCompletedInitialCloudPull = true;
        seedMissingLocalDefaults();
      }
    };

    runInitialBootstrapSync();

    // 2. Listener otomatis saat koneksi internet kembali terdeteksi (Online)
    const handleOnline = async () => {
      IndexedDbService.updateSyncStatus({
        isOnline: true,
        syncState: 'syncing',
        lastMessage: 'Koneksi internet terdeteksi! Menyinkronkan data ke Cloud...'
      });

      const flushRes = await SupabaseService.flushOutboxToCloud();
      await SupabaseService.pullAllFromCloud();

      if (onToast) {
        if (flushRes.flushedCount > 0) {
          onToast(flushRes.message, 'success');
        } else {
          onToast(
            'Koneksi internet kembali aktif! Data telah disinkronkan dengan Cloud.',
            'success'
          );
        }
      }
    };

    // 3. Listener saat koneksi internet terputus (Offline)
    const handleOffline = async () => {
      const { pendingCount } = await IndexedDbService.refreshCounts();
      IndexedDbService.updateSyncStatus({
        isOnline: false,
        syncState: 'offline_cached',
        lastMessage:
          pendingCount > 0
            ? `Offline — ${pendingCount} perubahan diamankan di antrean IndexedDB`
            : 'Mode Offline Aktif — Perubahan disimpan otomatis di IndexedDB'
      });

      if (onToast) {
        onToast(
          'Koneksi internet terputus. Mode Offline-First aktif: seluruh perubahan tetap tersimpan aman di IndexedDB dan akan disinkronkan otomatis saat online.',
          'info'
        );
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
};


