import {
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
  ScoreItem,
  ClassTopicItem,
  EKinerjaMasterItem
} from '../types';

export const INITIAL_CLASSES: ClassItem[] = [
  { id: 'c-1a', className: '1A', homeroom: 'Ibu Nurlaila, S.Pd.I.', academicYear: '2026/2027', studentCount: 28 },
  { id: 'c-2a', className: '2A', homeroom: 'Ibu Fatimah, S.Pd.', academicYear: '2026/2027', studentCount: 30 },
  { id: 'c-3a', className: '3A', homeroom: 'Bapak Ahmad Fauzi, S.Pd.', academicYear: '2026/2027', studentCount: 32 },
  { id: 'c-4a', className: '4A', homeroom: 'Ibu Siti Rahmawati, S.Pd.I.', academicYear: '2026/2027', studentCount: 32 },
  { id: 'c-5a', className: '5A', homeroom: 'Bapak Muhammad Hasan, S.Pd.I.', academicYear: '2026/2027', studentCount: 32 },
  { id: 'c-6a', className: '6A', homeroom: 'Ibu Dra. Hj. Maryam', academicYear: '2026/2027', studentCount: 30 }
];

export const INITIAL_STUDENTS: Student[] = [
  { id: 's-5a01', nis: '2021001', fullName: 'Achmad Dani Pratama', classId: 'c-5a', className: '5A', username: '5A01', password: 'DAN782', avatarColor: '#10b981' },
  { id: 's-5a02', nis: '2021002', fullName: 'Aisyah Putri Azzahra', classId: 'c-5a', className: '5A', username: '5A02', password: 'AIS931', avatarColor: '#06b6d4' },
  { id: 's-5a03', nis: '2021003', fullName: 'Alif Kurniawan Santoso', classId: 'c-5a', className: '5A', username: '5A03', password: 'ALF442', avatarColor: '#8b5cf6' },
  { id: 's-5a04', nis: '2021004', fullName: 'Bilqis Humaira Zahrani', classId: 'c-5a', className: '5A', username: '5A04', password: 'BLQ519', avatarColor: '#ec4899' },
  { id: 's-5a05', nis: '2021005', fullName: 'Fadhil Rizqi Ramadhan', classId: 'c-5a', className: '5A', username: '5A05', password: 'FDH671', avatarColor: '#f59e0b' },
  { id: 's-5a06', nis: '2021006', fullName: 'Hafizhah Nuha Maulida', classId: 'c-5a', className: '5A', username: '5A06', password: 'HFZ803', avatarColor: '#10b981' },
  { id: 's-5a07', nis: '2021007', fullName: 'Ibrahim Faris Maulana', classId: 'c-5a', className: '5A', username: '5A07', password: 'IBR229', avatarColor: '#3b82f6' },
  { id: 's-5a08', nis: '2021008', fullName: 'Zaskia Adya Mecca Siregar', classId: 'c-5a', className: '5A', username: '5A08', password: 'ZSK914', avatarColor: '#a855f7' },
  { id: 's-5a09', nis: '2021009', fullName: 'Rizky Pratama Hidayatullah', classId: 'c-5a', className: '5A', username: '5A09', password: 'RZK615', avatarColor: '#14b8a6' },
  { id: 's-5a10', nis: '2021010', fullName: 'Syifa Khairunnisa Zahra', classId: 'c-5a', className: '5A', username: '5A10', password: 'SYF402', avatarColor: '#f43f5e' },
  { id: 's-6a01', nis: '2020004', fullName: 'Muhammad Zaidan Al-Fatih', classId: 'c-6a', className: '6A', username: '6A01', password: 'ZDN771', avatarColor: '#0ea5e9' },
  { id: 's-6a02', nis: '2020008', fullName: 'Khadijah Nurul Izzah', classId: 'c-6a', className: '6A', username: '6A02', password: 'KHD553', avatarColor: '#eab308' },
  { id: 's-4a01', nis: '2022015', fullName: 'Muhammad Rayhan Al-Ghifari', classId: 'c-4a', className: '4A', username: '4A01', password: 'RAY124', avatarColor: '#10b981' },
  { id: 's-4a02', nis: '2022016', fullName: 'Nabila Syakirah Azzahra', classId: 'c-4a', className: '4A', username: '4A02', password: 'NAB332', avatarColor: '#06b6d4' },
  { id: 's-3a01', nis: '2023021', fullName: 'Sulaiman Malik Al-Farisi', classId: 'c-3a', className: '3A', username: '3A01', password: 'SLM881', avatarColor: '#f59e0b' }
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q-101',
    questionType: 'pg_standar',
    stimulus: 'Pada kegiatan pembiasaan literasi Al-Qur\'an pagi di SDN Ciketing Udik 2, guru PAI membacakan ayat pertama Surah Al-Ma\'un dan mengajak siswa merenungkan bentuk kasih sayang kepada sesama manusia yang membutuhkan bantuan.',
    question: 'Berdasarkan Surah Al-Ma\'un ayat 1, siapakah orang yang mendustakan agama?',
    arabicText: 'أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ',
    options: [
      'Orang yang rajin bersedekah',
      'Orang yang menghardik anak yatim dan enggan menolong fakir miskin',
      'Orang yang menuntut ilmu ke masjid',
      'Orang yang berpuasa di bulan Ramadhan'
    ],
    correctAnswer: 'Orang yang menghardik anak yatim dan enggan menolong fakir miskin',
    scoreWeight: 10,
    classId: '5',
    className: 'Tingkat Kelas 5',
    semester: 'Ganjil',
    domain: 'Al-Qur\'an & Hadis',
    approach: 'Kurikulum Berbasis Cinta (KBC)',
    explanation: 'Surah Al-Ma\'un menerangkan bahwa pendusta agama antara lain orang yang menghardik anak yatim dan tidak menganjurkan memberi makan orang miskin.'
  },
  {
    id: 'q-102',
    questionType: 'pg_standar',
    stimulus: 'Siswa kelas 5 SDN Ciketing Udik 2 sedang mempelajari mushaf Al-Qur\'an Juz 30 dan mengenali asal-usul turunnya surah-surah pendek dalam periode dakwah Rasulullah SAW.',
    question: 'Berapakah jumlah ayat dalam Surah Al-Ma\'un dan diturunkan di kota mana?',
    arabicText: 'سُوْرَةُ الْمَاعُوْنِ',
    options: [
      '5 ayat, Madinah',
      '7 ayat, Mekkah (Makkiyah)',
      '6 ayat, Madinah (Madaniyah)',
      '8 ayat, Mekkah'
    ],
    correctAnswer: '7 ayat, Mekkah (Makkiyah)',
    scoreWeight: 10,
    classId: '5',
    className: 'Tingkat Kelas 5',
    semester: 'Ganjil',
    domain: 'Al-Qur\'an & Hadis',
    approach: 'Kurikulum Berbasis Cinta (KBC)',
    explanation: 'Surah Al-Ma\'un terdiri dari 7 ayat dan termasuk golongan surah Makkiyah karena diturunkan sebelum Nabi hijrah.'
  },
  {
    id: 'q-103',
    questionType: 'pg_kompleks',
    stimulus: 'Saat shalat berjamaah di musholla SDN Ciketing Udik 2, anak-anak diajarkan untuk merapatkan shaf, meluruskan barisan, dan meniatkan ibadah tulus hanya mengharap ridha Allah SWT tanpa ingin dipuji oleh kawan sebaya.',
    question: 'Pilihlah DUA ciri-ciri orang celaka dalam shalat menurut Surah Al-Ma\'un ayat 4-6!',
    arabicText: 'فَوَيْلٌ لِّلْمُصَلِّينَ ۝ الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ ۝ الَّذِينَ هُمْ يُرَاءُونَ',
    options: [
      'Orang yang lalai dari waktu dan kekhusyukan shalatnya',
      'Orang yang gemar berbuat riya (pamer amal shalih)',
      'Orang yang selalu shalat berjamaah tepat waktu',
      'Orang yang membaca dzikir setelah shalat'
    ],
    correctAnswer: [
      'Orang yang lalai dari waktu dan kekhusyukan shalatnya',
      'Orang yang gemar berbuat riya (pamer amal shalih)'
    ],
    scoreWeight: 15,
    classId: '5',
    className: 'Tingkat Kelas 5',
    semester: 'Ganjil',
    domain: 'Al-Qur\'an & Hadis',
    approach: 'Kurikulum Berbasis Cinta (KBC)',
    explanation: 'Dalam ayat 4-6 dijelaskan kecelakaan bagi mushallin yang lalai dari shalatnya (sahūn) dan berbuat riya (yura\'ūn).'
  },
  {
    id: 'q-104',
    questionType: 'benar_salah',
    stimulus: 'Saat jam istirahat di teras kelas SDN Ciketing Udik 2, Salman dengan tulus meminjamkan pensil warnanya kepada Ahmad yang tertinggal alat tulisnya di rumah tanpa meminta imbalan.',
    question: 'Arti dari lafaz "Al-Ma\'un" secara bahasa adalah barang-barang yang berguna / bantuan.',
    arabicText: 'الْمَاعُوْنَ',
    options: ['Benar', 'Salah'],
    correctAnswer: 'Benar',
    scoreWeight: 10,
    classId: '5',
    className: 'Tingkat Kelas 5',
    semester: 'Ganjil',
    domain: 'Al-Qur\'an & Hadis',
    approach: 'Kurikulum Berbasis Cinta (KBC)',
    explanation: 'Al-Ma\'un secara harfiah berarti bantuan atau barang-barang yang bermanfaat untuk dipinjamkan kepada orang yang membutuhkan.'
  },
  {
    id: 'q-105',
    questionType: 'essay',
    stimulus: 'Sebagai sekolah ramah anak dan berkarakter islami, SDN Ciketing Udik 2 senantiasa membiasakan gerakan peduli kawan dan berbagi kasih sayang kepada sesama.',
    question: 'Jelaskan 3 contoh perbuatan terpuji dalam kehidupan sehari-hari di lingkungan sekolah SDN Ciketing Udik 2 sebagai bentuk pengamalan Surah Al-Ma\'un!',
    options: [],
    correctAnswer: 'Menyayangi dan membantu teman yang yatim/kurang mampu, meminjamkan alat tulis bila teman tidak membawa, dan ikhlas berinfaq tanpa riya.',
    scoreWeight: 20,
    classId: '5',
    className: 'Tingkat Kelas 5',
    semester: 'Ganjil',
    domain: 'Akhlak',
    approach: 'Kurikulum Berbasis Cinta (KBC)',
    explanation: 'Perilaku nyata: peduli teman, suka berbagi bekal, infaq jumat, tidak meremehkan anak yatim.'
  },
  {
    id: 'q-201',
    questionType: 'pg_standar',
    stimulus: 'Ketika mengamati peredaran tata surya dan keteraturan alam semesta di ruang sains SDN Ciketing Udik 2, para siswa menyadari betapa agungnya kekuasaan Allah yang memelihara seluruh ciptaan-Nya tanpa pernah merasa lelah.',
    question: 'Asmaul Husna "Al-Qawiyyu" memiliki arti bahwa Allah Subhanahu wa Ta\'ala Maha...',
    arabicText: 'الْقَوِيُّ',
    options: ['Maha Kuat', 'Maha Mendengar', 'Maha Pengasih', 'Maha Mengetahui'],
    correctAnswer: 'Maha Kuat',
    scoreWeight: 10,
    classId: '5',
    className: 'Tingkat Kelas 5',
    semester: 'Ganjil',
    domain: 'Akidah',
    approach: 'Kurikulum Berbasis Cinta (KBC)',
    explanation: 'Al-Qawiyyu adalah nama Allah yang Maha Kuat dan tidak terkalahkan oleh kekuatan apa pun.'
  },
  {
    id: 'q-202',
    questionType: 'pg_standar',
    stimulus: 'Guru PAI di kelas 5 SDN Ciketing Udik 2 menyampaikan bahwa setiap perbuatan baik dan kasih sayang kita di dunia akan mendapatkan balasan surga yang penuh kenikmatan di Hari Pembalasan.',
    question: 'Iman kepada Hari Akhir (Hari Kiamat) merupakan rukun iman yang ke-...',
    options: ['Ketiga', 'Keempat', 'Kelima', 'Keenam'],
    correctAnswer: 'Kelima',
    scoreWeight: 10,
    classId: '5',
    className: 'Tingkat Kelas 5',
    semester: 'Ganjil',
    domain: 'Akidah',
    approach: 'Kurikulum Berbasis Cinta (KBC)',
    explanation: 'Rukun Iman: 1. Iman kepada Allah, 2. Malaikat, 3. Kitab-kitab, 4. Rasul, 5. Hari Akhir, 6. Qadha dan Qadar.'
  },
  {
    id: 'q-301',
    questionType: 'pg_standar',
    stimulus: 'Saat bel tanda masuk berbunyi di SDN Ciketing Udik 2 bertepatan dengan adzan Dzuhur, siswa kelas 3 bergegas antre berwudhu dengan tertib untuk menegakkan tiang agama.',
    question: 'Rukun Islam yang kedua yang wajib didirikan setiap muslim lima waktu dalam sehari semalam adalah...',
    arabicText: 'الصَّلَاةُ',
    options: ['Mengucapkan Syahadat', 'Mendirikan Shalat', 'Menunaikan Zakat', 'Melaksanakan Haji'],
    correctAnswer: 'Mendirikan Shalat',
    scoreWeight: 10,
    classId: '3',
    className: 'Tingkat Kelas 3',
    semester: 'Ganjil',
    domain: 'Fikih',
    approach: 'Kurikulum Berbasis Cinta (KBC)',
    explanation: 'Shalat fardhu 5 waktu merupakan tiang agama dan rukun Islam yang kedua.'
  }
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz-01',
    title: 'Penilaian Harian PAI Bab 1: Meneladani Surah Al-Ma\'un',
    description: 'Ujian pemahaman makna, tajwid, dan penerapan nilai kemanusiaan Surah Al-Ma\'un untuk Kelas 5.',
    classId: 'c-5a',
    className: '5A',
    durationMinutes: 30,
    deadline: '2026-11-10T23:59:00',
    randomize: true,
    showScoreImmediately: true,
    totalQuestions: 5,
    status: 'published',
    semester: 'Ganjil',
    questionIds: ['q-101', 'q-102', 'q-103', 'q-104', 'q-105']
  },
  {
    id: 'quiz-02',
    title: 'Asesmen Sumatif PAI Bab 2: Mengenal Asmaul Husna & Hari Akhir',
    description: 'Evaluasi akidah akhlak mengenai keagungan Asmaul Husna dan tanda-tanda beriman kepada hari akhir.',
    classId: 'c-5a',
    className: '5A',
    durationMinutes: 25,
    deadline: '2026-11-20T23:59:00',
    randomize: false,
    showScoreImmediately: true,
    totalQuestions: 2,
    status: 'published',
    semester: 'Ganjil',
    questionIds: ['q-201', 'q-202']
  },
  {
    id: 'quiz-03',
    title: 'Kuis Ceria PAI: Rukun Islam & Pembiasaan Shalat Fardhu',
    description: 'Kuis pemahaman shalat lima waktu untuk melatih kedisiplinan beribadah sejak dini.',
    classId: 'c-3a',
    className: '3A',
    durationMinutes: 20,
    deadline: '2026-11-25T23:59:00',
    randomize: true,
    showScoreImmediately: true,
    totalQuestions: 1,
    status: 'published',
    semester: 'Ganjil',
    questionIds: ['q-301']
  }
];

export const INITIAL_MATERIALS: Material[] = [
  {
    id: 'mat-01',
    title: 'Memahami Makna & Menghafal Surah Al-Ma\'un',
    contentType: 'text',
    contentText: `
      <h2><strong>Surah Al-Ma'un (Barang-barang yang Berguna)</strong></h2>
      <p>Surah Al-Ma'un merupakan surah ke-107 dalam Al-Qur'an yang terdiri dari 7 ayat. Surah ini diturunkan di kota Mekkah sehingga digolongkan sebagai surah Makkiyah.</p>
      
      <div style="background-color: #f8fafc; color:#0f172a; padding: 18px; border-radius: 12px; margin: 16px 0; border: 1px solid #cbd5e1;">
        <h4 style="margin-top:0; color:#047857; font-weight:bold;">Teks Lengkap Surah Al-Ma'un:</h4>
        <p dir="rtl" style="font-family: 'Amiri', serif; font-size: 1.45rem; line-height: 2.3; text-align: right; margin-bottom: 8px;">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ<br>
          ١. أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ<br>
          ٢. فَذَٰلِكَ الَّذِي يَدُعُّ الْيَتِيمَ<br>
          ٣. وَلَا يَحُضُّ عَلَىٰ طَعَامِ الْمِسْكِينِ<br>
          ٤. فَوَيْلٌ لِّلْمُصَلِّينَ<br>
          ٥. الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ<br>
          ٦. الَّذِينَ هُمْ يُرَاءُونَ<br>
          ٧. وَيَمْنَعُونَ الْمَاعُونَ
        </p>
      </div>

      <h3><strong>Kandungan Pokok Surah Al-Ma'un:</strong></h3>
      <ul>
        <li><strong>Larangan Menghardik Anak Yatim:</strong> Islam mengajarkan umatnya agar memuliakan dan mengasihi anak yatim, bukan membentak atau menzalimi hak-hak mereka.</li>
        <li><strong>Kepedulian terhadap Fakir Miskin:</strong> Setiap muslim didorong untuk memiliki kepekaan sosial dengan suka berbagi makanan atau rizki kepada sesama yang membutuhkan.</li>
        <li><strong>Peringatan bagi Orang yang Lalai dalam Shalat:</strong> Shalat bukan sekadar gerakan fisik, melainkan ibadah yang menuntut keikhlasan dan ketepatan waktu.</li>
        <li><strong>Menghindari Sikap Riya (Pamer):</strong> Segala amal kebajikan wajib diniatkan tulus lillahi ta'ala.</li>
        <li><strong>Suka Menolong dengan Barang Berguna:</strong> Tidak kikir meminjamkan barang yang bermanfaat bagi tetangga dan kawan.</li>
      </ul>
    `,
    classId: '5',
    className: 'Tingkat Kelas 5',
    subject: 'PAI & Budi Pekerti',
    semester: 'Ganjil',
    createdAt: '2026-10-20T08:00:00'
  },
  {
    id: 'mat-02',
    title: 'Tata Cara Berwudhu yang Sempurna Sesuai Tuntunan Sunnah',
    contentType: 'text',
    contentText: `
      <h2><strong>Panduan Praktis Bersuci (Wudhu) untuk Anak Shalih</strong></h2>
      <p>Wudhu adalah syarat sah shalat. Shalat seorang hamba tidak akan diterima tanpa bersuci yang benar.</p>
      
      <p dir="rtl" style="font-family: 'Amiri', serif; font-size: 1.4rem; text-align: right;">
        نَوَيْتُ الْوُضُوْءَ لِرَفْعِ الْحَدَثِ الْأَصْغَرِ فَرْضًا لِلَّهِ تَعَالَى
      </p>
      <p><em>"Nawaitul wudhu'a liraf'il hadatsil ashghari fardhal lillahi ta'ala."</em></p>
      <p>Artinya: "Aku berniat wudhu untuk menghilangkan hadas kecil, fardhu karena Allah Ta'ala."</p>

      <h3>Urutan Gerakan Wudhu:</h3>
      <ol>
        <li>Membaca Basmalah dan mencuci kedua telapak tangan hingga sela-sela jari.</li>
        <li>Berkumur-kumur sebanyak 3 kali secara merata.</li>
        <li>Menghirup air ke hidung lalu mengeluarkannya (istinsyaq & istintsar) 3 kali.</li>
        <li>Membasuh seluruh permukaan wajah dari batas tumbuhnya rambut hingga dagu 3 kali.</li>
        <li>Membasuh kedua tangan hingga siku-siku (dahulukan tangan kanan lalu kiri) 3 kali.</li>
        <li>Mengusap sebagian atau seluruh kepala dan membasuh kedua telinga 3 kali.</li>
        <li>Membasuh kedua kaki hingga mata kaki (dahulukan kanan lalu kiri) 3 kali.</li>
        <li>Tertib (berurutan) dan membaca doa setelah berwudhu.</li>
      </ol>
    `,
    classId: '3',
    className: 'Tingkat Kelas 3',
    subject: 'Fiqih Ibadah',
    semester: 'Ganjil',
    createdAt: '2026-10-18T09:30:00'
  }
];

export const INITIAL_REFERENCES: ReadingReference[] = [
  {
    id: 'ref-01',
    title: 'Surah Al-Fatihah (Pembuka Al-Qur\'an)',
    refType: 'juz_amma',
    category: 'Juz Amma',
    arabicSnippet: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    content: 'Surah Al-Fatihah (7 Ayat) adalah Ummul Qur\'an yang wajib dibaca dalam setiap rakaat shalat.',
    translation: '1. Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. 2. Segala puji bagi Allah, Tuhan seluruh alam. 3. Yang Maha Pengasih, Maha Penyayang. 4. Pemilik hari pembalasan. 5. Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami memohon pertolongan. 6. Tunjukilah kami jalan yang lurus. 7. (yaitu) jalan orang-orang yang telah Engkau beri nikmat kepadanya; bukan (jalan) mereka yang dimurkai, dan bukan (pula jalan) mereka yang sesat.'
  },
  {
    id: 'ref-02',
    title: 'Surah Al-Ikhlas (Kemurnian Keesaan Allah)',
    refType: 'juz_amma',
    category: 'Juz Amma',
    arabicSnippet: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
    content: 'Surah Al-Ikhlas (4 Ayat) menegaskan ketauhidan murni bahwa Allah itu Esa, tempat bergantung segala makhluk, tidak beranak dan tidak diperanakkan.',
    translation: '1. Katakanlah (Muhammad), "Dialah Allah, Yang Maha Esa." 2. Allah tempat meminta segala sesuatu. 3. (Allah) tidak beranak dan tidak pula diperanakkan. 4. Dan tidak ada sesuatu yang setara dengan Dia.'
  },
  {
    id: 'ref-03',
    title: 'Doa untuk Kedua Orang Tua (Ayah & Ibu)',
    refType: 'doa',
    category: 'Doa Harian',
    arabicSnippet: 'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    content: 'Rabbighfir lii waliwaalidayya warhamhumaa kamaa rabbayaanii shaghiiraa.',
    translation: 'Wahai Tuhanku! Ampunilah aku dan kedua orang tuaku, dan kasihanilah keduanya sebagaimana mereka telah mendidik aku di waktu kecil.'
  },
  {
    id: 'ref-04',
    title: 'Doa Sebelum dan Sesudah Belajar',
    refType: 'doa',
    category: 'Doa Harian',
    arabicSnippet: 'رَبِّ زِدْنِي عِلْمًا وَارْزُقْنِي فَهْمًا',
    content: 'Rabbi zidnii \'ilman warzuqnii fahmaa.',
    translation: 'Ya Allah, tambahkanlah kepadaku ilmu pengetahuan dan berilah aku rezeki pemahaman yang baik.'
  },
  {
    id: 'ref-05',
    title: 'Kisah Teladan Nabi Muhammad SAW: Gelar Al-Amin',
    refType: 'kisah_nabi',
    category: 'Kisah 25 Nabi',
    content: 'Nabi Muhammad SAW sejak masa muda dikenal di seluruh kota Mekkah sebagai sosok yang sangat jujur, dapat dipercaya, dan berbudi luhur tinggi, sehingga kaum Quraisy memberinya julukan terhormat "Al-Amin" (Yang Dapat Dipercaya). Beliau tidak pernah berdusta sedikit pun dalam berniaga maupun bergaul.'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-01',
    title: 'Pelaksanaan Penilaian Harian PAI Bab 1 (Surah Al-Ma\'un)',
    body: 'Assalamu\'alaikum wr. wb. Diumumkan kepada seluruh peserta didik Kelas 5A bahwa Penilaian Harian PAI Bab 1 akan dilaksanakan secara daring melalui LMS ini. Silakan pelajari materi dan buka menu Tugas & Kuis tepat waktu.',
    target: 'class_id',
    classId: 'c-5a',
    targetLabel: 'Kelas 5A',
    createdBy: 'Guru PAI',
    createdAt: '2026-10-22T08:00:00'
  },
  {
    id: 'ann-02',
    title: 'Pembiasaan Shalat Dhuha & Gerakan Infaq Jumat Berkah',
    body: 'Kepada seluruh siswa-siswi SDN Ciketing Udik 2 Bantargebang, jangan lupa membiasakan shalat Dhuha berjamaah dan menyisihkan sebagian uang saku untuk infaq yatim & dhuafa setiap hari Jumat pagi.',
    target: 'all',
    targetLabel: 'Semua Siswa',
    createdBy: 'Guru PAI',
    createdAt: '2026-10-15T07:30:00'
  }
];

export const INITIAL_TEACHING_JOURNALS: TeachingJournal[] = [
  {
    id: 'jrn-01',
    date: '2026-10-23',
    classId: 'c-5a',
    className: '5A',
    topic: 'Membaca dan Menghafal Surah Al-Ma\'un dengan Tajwid yang Benar',
    learningObjective: 'Melalui kegiatan demonstrasi lafaz dan tutor sebaya pada materi "Membaca Surah Al-Ma\'un", peserta didik kelas 5A mampu melafalkan ayat 1-7 dengan makharijul huruf yang fasih, menunjukkan rasa tanggung jawab, serta membiasakan tadarus Al-Qur\'an secara rutin.',
    reflection: 'Pembelajaran berjalan interaktif dan kondusif. Mayoritas siswa telah mampu menghafal ayat 1-4 dengan baik. Terdapat 3 siswa yang perlu bimbingan khusus pada bacaan mad thabi\'i. Tindak lanjut: pendampingan talaqqi mandiri sebelum waktu istirahat.',
    absentStudents: ['Bilqis Humaira Zahrani (Sakit)'],
    status: 'Tuntas',
    teacherName: 'Guru PAI',
    schoolName: 'SDN Ciketing Udik 2 Bantargebang'
  },
  {
    id: 'jrn-02',
    date: '2026-10-21',
    classId: 'c-4a',
    className: '4A',
    topic: 'Mengenal Rukun Iman dan Hikmah Beriman kepada Malaikat Allah',
    learningObjective: 'Setelah menyimak tayangan kisah dan peta konsep malaikat Allah, peserta didik kelas 4A dapat menyebutkan nama-nama 10 malaikat beserta tugasnya dengan benar serta meneladani sifat taat malaikat dalam kehidupan sehari-hari.',
    reflection: 'Peserta didik antusias membuat lagu/tepuk 10 malaikat. Seluruh siswa aktif bertanya mengenai tugas Malaikat Raqib dan Atid. Evaluasi lisan menunjukkan pemahaman materi mencapai 92%.',
    absentStudents: [],
    status: 'Tuntas',
    teacherName: 'Guru PAI',
    schoolName: 'SDN Ciketing Udik 2 Bantargebang'
  }
];

export const DEFAULT_PRINCIPAL_SIGNATURE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNjAgMTEwIiB3aWR0aD0iMjYwIiBoZWlnaHQ9IjExMCI+CiAgPGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMGQzYjY2IiBzdHJva2Utd2lkdGg9IjIuNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICAgIDxwYXRoIGQ9Ik0gMzAsNjUgQyA0MCwzNSA1MiwyMiA2NCwzOCBDIDc2LDU0IDgwLDgyIDk1LDQ4IEMgMTA4LDE4IDExNiw2MiAxMzIsNDYgQyAxNDgsMzAgMTYyLDU2IDE4Miw0MiBDIDE5NiwzMiAyMTIsNDYgMjMwLDM2IiAvPgogICAgPHBhdGggZD0iTSA0NSw3NCBDIDk1LDc4IDE2NSw3MiAyMzUsNjIiIHN0cm9rZS13aWR0aD0iMi4yIiAvPgogICAgPHBhdGggZD0iTSA3NSwzMiBDIDkwLDIwIDExMCwyMiAxMDUsNDAiIHN0cm9rZS13aWR0aD0iMS44IiAvPgogIDwvZz4KPC9zdmc+';

export const DEFAULT_TEACHER_SIGNATURE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNjAgMTEwIiB3aWR0aD0iMjYwIiBoZWlnaHQ9IjExMCI+CiAgPGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTAyYTQzIiBzdHJva2Utd2lkdGg9IjIuNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICAgIDxwYXRoIGQ9Ik0gMjgsNTggQyA0MiwyOCA1NCwyMCA2Niw0MiBDIDc4LDY0IDg2LDc4IDk4LDQ0IEMgMTEyLDEyIDEyMCw1NCAxMzYsNDAgQyAxNTAsMjggMTY4LDQ4IDE5MCwzNSBDIDIwNSwyNSAyMTgsNDAgMjMyLDMyIiAvPgogICAgPHBhdGggZD0iTSAzOCw3MCBDIDg4LDc0IDE1OCw2OCAyMjgsNTgiIHN0cm9rZS13aWR0aD0iMi4yIiAvPgogICAgPHBhdGggZD0iTSA2OCwzNiBDIDgyLDI0IDEwMCwyNiA5NSw0NCIgc3Ryb2tlLXdpZHRoPSIxLjgiIC8+CiAgPC9nPgo8L3N2Zz4=';

export const INITIAL_TEACHER_PROFILE: TeacherProfile = {
  id: 'guru-1',
  fullName: 'Drs. H. Ahmad Syarifuddin, M.Pd.I.',
  nip: '197908152006041008',
  pangkatGolongan: 'Penata Tk. I / III/d',
  jabatan: 'Guru Ahli Muda / Guru PAI & Budi Pekerti',
  schoolName: 'SDN Ciketing Udik 2 Bantargebang',
  schoolAddress: 'Jl. Raya Ciketing Udik No. 2, Bantargebang, Kota Bekasi',
  subject: 'Pendidikan Agama Islam & Budi Pekerti',
  principalName: 'Hj. Siti Rohmah, M.Pd.',
  principalNip: '197405101998022001',
  signatureDataUrl: DEFAULT_TEACHER_SIGNATURE,
  principalSignatureDataUrl: DEFAULT_PRINCIPAL_SIGNATURE,
  academicYear: '2026/2027',
  isDefault: true
};

export const INITIAL_TEACHERS: TeacherProfile[] = [
  {
    id: 'guru-1',
    fullName: 'Drs. H. Ahmad Syarifuddin, M.Pd.I.',
    nip: '197908152006041008',
    pangkatGolongan: 'Penata Tk. I / III/d',
    jabatan: 'Guru Ahli Muda / Guru PAI & Budi Pekerti',
    schoolName: 'SDN Ciketing Udik 2 Bantargebang',
    schoolAddress: 'Jl. Raya Ciketing Udik No. 2, Bantargebang, Kota Bekasi',
    subject: 'Pendidikan Agama Islam & Budi Pekerti',
    principalName: 'Hj. Siti Rohmah, M.Pd.',
    principalNip: '197405101998022001',
    signatureDataUrl: DEFAULT_TEACHER_SIGNATURE,
    principalSignatureDataUrl: DEFAULT_PRINCIPAL_SIGNATURE,
    academicYear: '2026/2027',
    isDefault: true
  },
  {
    id: 'guru-2',
    fullName: 'Siti Nurhaliza, S.Pd.SD.',
    nip: '198804122011012015',
    pangkatGolongan: 'Penata / III/c',
    jabatan: 'Guru Kelas / Ahli Pertama',
    schoolName: 'SDN Bantargebang 03',
    schoolAddress: 'Jl. Narogong Sakti No. 15, Bantargebang, Kota Bekasi',
    subject: 'Guru Kelas / Tematik & IPAS',
    principalName: 'Drs. H. Subur, M.Pd.',
    principalNip: '196903141994031005',
    signatureDataUrl: DEFAULT_TEACHER_SIGNATURE,
    principalSignatureDataUrl: DEFAULT_PRINCIPAL_SIGNATURE,
    academicYear: '2026/2027',
    isDefault: false
  }
];

export const INITIAL_APP_SETTINGS: AppSettings = {
  principalName: 'Hj. Siti Rohmah, M.Pd.',
  principalNip: '197405101998022001',
  appLogoUrl: 'https://jhlryjdhotxtndavacpd.supabase.co/storage/v1/object/public/logo/logo.png',
  schoolAddress: 'Jl. Raya Ciketing Udik No. 2, Bantargebang, Kota Bekasi',
  academicYear: '2026/2027'
};

export const INITIAL_SCORES: ScoreItem[] = [
  {
    id: 'sc-01',
    studentId: 's-5a01',
    quizId: 'quiz-01',
    attemptId: 'att-01',
    rawScore: 55,
    maxScore: 65,
    percentage: 85,
    graded: true,
    quizTitle: 'Penilaian Harian PAI Bab 1: Meneladani Surah Al-Ma\'un',
    createdAt: '2026-10-22T10:15:00'
  },
  {
    id: 'sc-02',
    studentId: 's-5a02',
    quizId: 'quiz-01',
    attemptId: 'att-02',
    rawScore: 65,
    maxScore: 65,
    percentage: 100,
    graded: true,
    quizTitle: 'Penilaian Harian PAI Bab 1: Meneladani Surah Al-Ma\'un',
    createdAt: '2026-10-22T10:20:00'
  },
  {
    id: 'sc-03',
    studentId: 's-5a03',
    quizId: 'quiz-01',
    attemptId: 'att-03',
    rawScore: 50,
    maxScore: 65,
    percentage: 77,
    graded: true,
    quizTitle: 'Penilaian Harian PAI Bab 1: Meneladani Surah Al-Ma\'un',
    createdAt: '2026-10-22T10:30:00'
  },
  {
    id: 'sc-04',
    studentId: 's-5a04',
    quizId: 'quiz-01',
    attemptId: 'att-04',
    rawScore: 60,
    maxScore: 65,
    percentage: 92,
    graded: true,
    quizTitle: 'Penilaian Harian PAI Bab 1: Meneladani Surah Al-Ma\'un',
    createdAt: '2026-10-22T10:35:00'
  },
  {
    id: 'sc-05',
    studentId: 's-5a05',
    quizId: 'quiz-01',
    attemptId: 'att-05',
    rawScore: 44,
    maxScore: 65,
    percentage: 68,
    graded: true,
    quizTitle: 'Penilaian Harian PAI Bab 1: Meneladani Surah Al-Ma\'un',
    createdAt: '2026-10-22T10:40:00'
  },
  {
    id: 'sc-06',
    studentId: 's-5a06',
    quizId: 'quiz-01',
    attemptId: 'att-06',
    rawScore: 62,
    maxScore: 65,
    percentage: 95,
    graded: true,
    quizTitle: 'Penilaian Harian PAI Bab 1: Meneladani Surah Al-Ma\'un',
    createdAt: '2026-10-22T10:45:00'
  },
  {
    id: 'sc-07',
    studentId: 's-5a07',
    quizId: 'quiz-01',
    attemptId: 'att-07',
    rawScore: 52,
    maxScore: 65,
    percentage: 80,
    graded: true,
    quizTitle: 'Penilaian Harian PAI Bab 1: Meneladani Surah Al-Ma\'un',
    createdAt: '2026-10-22T10:50:00'
  },
  {
    id: 'sc-08',
    studentId: 's-5a08',
    quizId: 'quiz-01',
    attemptId: 'att-08',
    rawScore: 58,
    maxScore: 65,
    percentage: 89,
    graded: true,
    quizTitle: 'Penilaian Harian PAI Bab 1: Meneladani Surah Al-Ma\'un',
    createdAt: '2026-10-22T10:55:00'
  },
  {
    id: 'sc-09',
    studentId: 's-6a01',
    quizId: 'quiz-01',
    attemptId: 'att-09',
    rawScore: 64,
    maxScore: 65,
    percentage: 98,
    graded: true,
    quizTitle: 'Penilaian Harian PAI Bab 1: Meneladani Surah Al-Ma\'un',
    createdAt: '2026-10-22T11:00:00'
  },
  {
    id: 'sc-10',
    studentId: 's-4a01',
    quizId: 'quiz-01',
    attemptId: 'att-10',
    rawScore: 59,
    maxScore: 65,
    percentage: 91,
    graded: true,
    quizTitle: 'Penilaian Harian PAI Bab 1: Meneladani Surah Al-Ma\'un',
    createdAt: '2026-10-22T11:05:00'
  }
];

export const INITIAL_CLASS_TOPICS: ClassTopicItem[] = [
  // KELAS 5 - SEMESTER GANJIL
  {
    id: 'top-5-g1',
    classGrade: '5',
    semester: 'Ganjil',
    chapterNo: 1,
    chapterTitle: 'Menyayangi Anak Yatim (Kajian Surah Al-Ma\'un)',
    subTopics: [
      'Membaca Surah Al-Ma\'un dengan Tartil',
      'Menghafal Surah Al-Ma\'un Ayat 1-7',
      'Memahami Makna & Kandungan Surah Al-Ma\'un',
      'Perilaku Menyayangi Yatim & Peduli Dhuafa'
    ],
    domain: 'Al-Qur\'an & Hadis',
    learningObjective: 'Peserta didik mampu membaca, menghafal, dan memahami pesan pokok Surah Al-Ma\'un dengan baik, serta membiasakan perilaku peduli terhadap anak yatim dan fakir miskin.',
    timeAllocationJP: 12,
    targetMonth: 'Juli - Agustus',
    status: 'Tuntas',
    learningResources: 'Buku Siswa PAI Kelas 5 Kemdikbud, Juz Amma, Video Pembelajaran PAI'
  },
  {
    id: 'top-5-g2',
    classGrade: '5',
    semester: 'Ganjil',
    chapterNo: 2,
    chapterTitle: 'Lebih Dekat dengan Nama-Nama Allah (Asmaul Husna)',
    subTopics: [
      'Mengenal Makna Al-Qawiyyu (Maha Kuat)',
      'Mengenal Makna Al-Qayyum (Maha Mandiri)',
      'Mengenal Makna Al-Muhyi & Al-Mumit (Maha Menghidupkan & Mematikan)',
      'Mengenal Makna Al-Ba\'its (Maha Membangkitkan)'
    ],
    domain: 'Akidah',
    learningObjective: 'Peserta didik mampu meneladani makna Asmaul Husna Al-Qawiyyu, Al-Qayyum, Al-Muhyi, Al-Mumit, dan Al-Ba\'its dalam memupuk kemandirian dan keteguhan iman.',
    timeAllocationJP: 12,
    targetMonth: 'Agustus - September',
    status: 'Tuntas',
    learningResources: 'Buku Siswa PAI Kelas 5, Poster Kaligrafi Asmaul Husna'
  },
  {
    id: 'top-5-g3',
    classGrade: '5',
    semester: 'Ganjil',
    chapterNo: 3,
    chapterTitle: 'Aku Anak Saleh (Menghargai Perbedaan & Hidup Rukun)',
    subTopics: [
      'Manusia Diciptakan Bersuku-suku dan Berbangsa-bangsa',
      'Toleransi dalam Keragaman Agama dan Budaya',
      'Membiasakan Musyawarah dan Menghargai Pendapat Teman'
    ],
    domain: 'Akhlak',
    learningObjective: 'Peserta didik mampu menjelaskan konsep keragaman sebagai sunnatullah, serta membiasakan hidup rukun, saling menghargai perbedaan, dan berakhlak mulia di lingkungan sekolah.',
    timeAllocationJP: 9,
    targetMonth: 'Oktober',
    status: 'Sedang Berjalan',
    learningResources: 'Buku Siswa PAI Kelas 5, Lembar Studi Kasus Teman Sebaya'
  },
  {
    id: 'top-5-g4',
    classGrade: '5',
    semester: 'Ganjil',
    chapterNo: 4,
    chapterTitle: 'Hidup Lapang dengan Berbagi (Zakat, Infak, Sedekah, Hadiah)',
    subTopics: [
      'Makna Zakat Fitrah dan Zakat Mal',
      'Perbedaan Infak, Sedekah, dan Hadiah',
      'Hikmah dan Manfaat Gemar Berinfaq bagi Sesama'
    ],
    domain: 'Fiqih',
    learningObjective: 'Peserta didik mampu membedakan ketentuan zakat, infak, sedekah, dan hadiah, serta termotivasi membiasakan infak jumat berkah secara ikhlas.',
    timeAllocationJP: 12,
    targetMonth: 'November',
    status: 'Belum Terlaksana',
    learningResources: 'Buku Siswa PAI Kelas 5, Kotak Infaq Sekolah'
  },
  {
    id: 'top-5-g5',
    classGrade: '5',
    semester: 'Ganjil',
    chapterNo: 5,
    chapterTitle: 'Meneladani Perjuangan Rasulullah SAW (Fathu Makkah)',
    subTopics: [
      'Latar Belakang Peristiwa Pembebasan Kota Mekkah',
      'Sikap Pemaaf dan Kasih Sayang Rasulullah SAW',
      'Peristiwa Haji Wada\' dan Pesan Terakhir Rasulullah'
    ],
    domain: 'Sejarah Peradaban Islam',
    learningObjective: 'Peserta didik mampu menceritakan kembali peristiwa Fathu Makkah dan Haji Wada\' serta meneladani sifat pemaaf dan cinta damai Rasulullah SAW.',
    timeAllocationJP: 12,
    targetMonth: 'Desember',
    status: 'Belum Terlaksana',
    learningResources: 'Buku Siswa PAI Kelas 5, Peta Hijrah Rasulullah'
  },

  // KELAS 5 - SEMESTER GENAP
  {
    id: 'top-5-gn1',
    classGrade: '5',
    semester: 'Genap',
    chapterNo: 6,
    chapterTitle: 'Hidup Damai dalam Kebersamaan (Surah Ali Imran Ayat 64)',
    subTopics: [
      'Membaca Surah Ali Imran Ayat 64 dengan Makharijul Huruf',
      'Kandungan Kalimat Sawa\' (Titik Temu Kebaikan)',
      'Kerukunan Antarumat Beragama di Indonesia'
    ],
    domain: 'Al-Qur\'an & Hadis',
    learningObjective: 'Peserta didik mampu melafalkan Surah Ali Imran ayat 64 dengan fasih dan mengamalkan nilai-nilai persaudaraan dalam masyarakat majemuk.',
    timeAllocationJP: 12,
    targetMonth: 'Januari - Februari',
    status: 'Belum Terlaksana',
    learningResources: 'Buku Siswa PAI Kelas 5, Mushaf Al-Qur\'an'
  },
  {
    id: 'top-5-gn2',
    classGrade: '5',
    semester: 'Genap',
    chapterNo: 7,
    chapterTitle: 'Ketika Kehidupan Telah Berhenti (Iman kepada Hari Akhir)',
    subTopics: [
      'Makna dan Hakikat Hari Kiamat',
      'Tanda-Tanda Datangnya Hari Kiamat',
      'Peristiwa Setelah Kiamat (Ba\'ats, Mahsyar, Hisab, Mizan, Jaza\')',
      'Hikmah Beriman kepada Hari Kiamat'
    ],
    domain: 'Akidah',
    learningObjective: 'Peserta didik mampu meyakini adanya hari akhir, menjelaskan tahapan peristiwa hari akhir, dan termotivasi memperbanyak amal shalih.',
    timeAllocationJP: 12,
    targetMonth: 'Februari - Maret',
    status: 'Belum Terlaksana',
    learningResources: 'Buku Siswa PAI Kelas 5, Bagan Alur Yaumul Akhir'
  },

  // KELAS 4 - SEMESTER GANJIL
  {
    id: 'top-4-g1',
    classGrade: '4',
    semester: 'Ganjil',
    chapterNo: 1,
    chapterTitle: 'Mari Mengaji Surah Al-Hujurat Ayat 13 (Keragaman Manusia)',
    subTopics: [
      'Membaca Surah Al-Hujurat: 13 dengan Tajwid Gunnah dan Mad',
      'Menulis Teks Ayat dengan Kaidah Hijaiah Rapi',
      'Memahami Pesan Manusia Diciptakan Bersuku-suku untuk Saling Mengenal'
    ],
    domain: 'Al-Qur\'an & Hadis',
    learningObjective: 'Peserta didik membaca dengan tartil Surah Al-Hujurat: 13 dan memahami tujuan Allah menciptakan manusia beragam untuk berta\'aruf.',
    timeAllocationJP: 12,
    targetMonth: 'Juli - Agustus',
    status: 'Tuntas',
    learningResources: 'Buku PAI Kelas 4, Juz Amma'
  },
  {
    id: 'top-4-g2',
    classGrade: '4',
    semester: 'Ganjil',
    chapterNo: 2,
    chapterTitle: 'Teladan Mulia Asmaul Husna (Al-Malik, Al-Quddus, As-Salam)',
    subTopics: [
      'Menghafal 5 Asmaul Husna Pilihan',
      'Al-Malik (Maha Maharaja)',
      'Al-Quddus (Maha Suci)',
      'As-Salam (Maha Sejahtera)',
      'Al-Mu\'min & Al-\'Aziz'
    ],
    domain: 'Akidah',
    learningObjective: 'Peserta didik mampu meneladani 5 Asmaul Husna dalam menjaga kebersihan hati, tutur kata, dan perilaku terpuji.',
    timeAllocationJP: 12,
    targetMonth: 'September - Oktober',
    status: 'Sedang Berjalan',
    learningResources: 'Buku PAI Kelas 4'
  },

  // KELAS 3 - SEMESTER GANJIL
  {
    id: 'top-3-g1',
    classGrade: '3',
    semester: 'Ganjil',
    chapterNo: 1,
    chapterTitle: 'Mari Mengenal Surah Al-Ikhlas dan Al-Falaq',
    subTopics: [
      'Membaca dan Menghafal Surah Al-Ikhlas',
      'Membaca dan Menghafal Surah Al-Falaq',
      'Memohon Perlindungan kepada Allah dari Kejahatan'
    ],
    domain: 'Al-Qur\'an & Hadis',
    learningObjective: 'Peserta didik mampu melafalkan dan menghafal Surah Al-Ikhlas dan Al-Falaq dengan fasih serta mengamalkannya sebelum tidur.',
    timeAllocationJP: 12,
    targetMonth: 'Juli - Agustus',
    status: 'Tuntas',
    learningResources: 'Buku PAI Kelas 3, Juz Amma'
  },
  {
    id: 'top-3-g2',
    classGrade: '3',
    semester: 'Ganjil',
    chapterNo: 2,
    chapterTitle: 'Ibadah Shalat Fardhu 5 Waktu',
    subTopics: [
      'Nama dan Rakaat Shalat Fardhu',
      'Syarat Wajib dan Syarat Sah Shalat',
      'Praktik Bacaan dan Gerakan Shalat yang Benar'
    ],
    domain: 'Fiqih',
    learningObjective: 'Peserta didik mampu mempraktikkan gerakan dan bacaan shalat fardhu secara tertib dan tuma\'ninah.',
    timeAllocationJP: 15,
    targetMonth: 'September - Oktober',
    status: 'Sedang Berjalan',
    learningResources: 'Buku PAI Kelas 3, Sajadah, Panduan Shalat'
  }
];

export const INITIAL_MASTER_RHK: EKinerjaMasterItem[] = [
  {
    id: 'm-rhk-1',
    code: 'RHK 1',
    category: 'Utama',
    title: 'Terlaksananya perencanaan pembelajaran, penyusunan perangkat ajar (Modul Ajar/RPP), dan instrumen asesmen yang bermutu dan berdiferensiasi',
    aspek: 'Kualitas',
    indikator: 'Persentase kelengkapan dan kesesuaian dokumen perangkat pembelajaran yang diverifikasi Kepala Sekolah',
    target: '100% / 12 Dokumen',
    rencanaAksiList: [
      {
        id: 'ra-m-1',
        title: 'Menyusun Analisis Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), dan Alur Tujuan Pembelajaran (ATP) semester berjalan',
        defaultTindakLanjut: [
          'Menelaah kesesuaian alur kompetensi bersama rekan pendidik dalam pertemuan KKG',
          'Mengintegrasikan pembiasaan Profil Pelajar Pancasila ke dalam rumusan tujuan pembelajaran',
          'Mendokumentasikan berkas ATP ke dalam arsip kurikulum sekolah'
        ],
        defaultOutput: '1 Berkas Dokumen Analisis CP, TP, dan ATP yang telah disahkan Kepala Sekolah'
      },
      {
        id: 'ra-m-2',
        title: 'Menyusun Modul Ajar / RPP berdiferensiasi dan instrumen asesmen diagnostik, formatif, serta sumatif',
        defaultTindakLanjut: [
          'Mengonsultasikan draf modul ajar kepada Kepala Sekolah guna memperoleh arahan dan validasi',
          'Menyesuaikan strategi diferensiasi konten, proses, dan produk dengan kesiapan belajar murid',
          'Menyiapkan rubrik ketercapaian tujuan pembelajaran (KKTP) per lingkup materi'
        ],
        defaultOutput: '1 Berkas Dokumen Modul Ajar / RPP Berdiferensiasi lengkap dengan Rubrik KKTP dan Asesmen'
      },
      {
        id: 'ra-m-3',
        title: 'Menyiapkan Bahan Ajar, Media Pembelajaran Interaktif/Digital, dan Lembar Kerja Peserta Didik (LKPD)',
        defaultTindakLanjut: [
          'Membuat media bahan tayang interaktif berbasis presentasi digital dan video pembelajaran',
          'Menyusun LKPD kontekstual yang merangsang kreativitas dan daya nalar kritis siswa',
          'Mengevaluasi keterbacaan materi ajar sebelum dibagikan kepada peserta didik'
        ],
        defaultOutput: '1 Paket Media Pembelajaran Interaktif, Bahan Tayang Digital, dan Lembar LKPD Murid'
      }
    ],
    tindakLanjutTemplates: [
      'Menelaah kesesuaian modul ajar bersama Kepala Sekolah sebelum pelaksanaan pembelajaran',
      'Mendiskusikan instrumen penilaian bersama rekan guru dalam forum KKG',
      'Menyempurnakan alur tujuan pembelajaran berdasarkan hasil evaluasi materi sebelumnya',
      'Mengarsipkan seluruh perangkat pembelajaran ke dalam portofolio digital guru'
    ]
  },
  {
    id: 'm-rhk-2',
    code: 'RHK 2',
    category: 'Utama',
    title: 'Terlaksananya kegiatan pembelajaran yang interaktif, berpusat pada peserta didik, serta pembimbingan pembiasaan ibadah dan akhlak budi pekerti',
    aspek: 'Kuantitas',
    indikator: 'Jumlah pelaksanaan kegiatan pembelajaran tatap muka dan pembiasaan adab siswa yang terdokumentasi',
    target: '100% / 24 Kali per Bulan',
    rencanaAksiList: [
      {
        id: 'ra-m-4',
        title: 'Melaksanakan kegiatan pembelajaran intrakurikuler tatap muka di kelas secara interaktif dan menyenangkan',
        defaultTindakLanjut: [
          'Mencatat perkembangan respon dan keaktifan peserta didik pada Jurnal Pembelajaran Harian',
          'Memberikan bimbingan terarah bagi peserta didik yang memerlukan perhatian khusus',
          'Menghubungkan materi pokok pembelajaran dengan keteladanan budi pekerti sehari-hari'
        ],
        defaultOutput: '1 Dokumen Jurnal Mengajar Harian beserta Rekap Presensi Siswa dan Dokumentasi Foto Pembelajaran'
      },
      {
        id: 'ra-m-5',
        title: 'Membimbing pembiasaan ibadah harian, sholat dhuha/dzuhur berjamaah, tadarus Al-Qur\'an, dan literasi pagi',
        defaultTindakLanjut: [
          'Memonitor dan menandatangani lembar kontrol pembiasaan ibadah harian murid',
          'Membimbing hafalan surat pendek dan tahsin tajwid bagi siswa secara bergiliran',
          'Menanamkan budaya antre, salam, senyum, dan kerapian diri sebelum masuk kelas'
        ],
        defaultOutput: '1 Rekapitulasi Pembiasaan Ibadah Harian, Buku Kontrol Karakter, dan Foto Kegiatan Keagamaan'
      },
      {
        id: 'ra-m-6',
        title: 'Melaksanakan pembelajaran kontekstual berbasis proyek atau studi kasus kelompok murid',
        defaultTindakLanjut: [
          'Memfasilitasi diskusi kelompok dan presentasi hasil temuan peserta didik',
          'Memberikan apresiasi dan penguatan positif terhadap hasil karya kelompok murid',
          'Mencatat lembar observasi kolaborasi dan Profil Pelajar Pancasila'
        ],
        defaultOutput: '1 Laporan Pelaksanaan Pembelajaran Berbasis Proyek dan Lembar Observasi Karakter Murid'
      }
    ],
    tindakLanjutTemplates: [
      'Mencatat perkembangan kehadiran, keaktifan, dan pembiasaan adab siswa pada Jurnal Harian',
      'Memberikan bimbingan individual bagi peserta didik yang lambat belajar',
      'Melakukan koordinasi dengan orang tua siswa terkait pembiasaan ibadah di rumah',
      'Mengevaluasi suasana belajar kelas agar senantiasa inklusif, tertib, dan kondusif'
    ]
  },
  {
    id: 'm-rhk-3',
    code: 'RHK 3',
    category: 'Utama',
    title: 'Terlaksananya asesmen hasil belajar, pengolahan nilai evaluasi, analisis ketuntasan KKTP, serta penyelenggaraan program remedial dan pengayaan',
    aspek: 'Kualitas',
    indikator: 'Laporan hasil asesmen, analisis daya serap siswa, dan berkas pelaksanaan remedial/pengayaan',
    target: '100% / Laporan Bulanan',
    rencanaAksiList: [
      {
        id: 'ra-m-7',
        title: 'Melaksanakan asesmen formatif harian dan sumatif lingkup materi sesuai kisi-kisi instrumen',
        defaultTindakLanjut: [
          'Memeriksa lembar jawaban peserta didik dan menghitung nilai perolehan secara teliti',
          'Menganalisis tingkat kesukaran dan daya pembeda butir soal evaluasi',
          'Menginput nilai ke dalam aplikasi buku nilai dan ledger evaluasi kelas'
        ],
        defaultOutput: '1 Berkas Hasil Asesmen Peserta Didik, Kisi-Kisi, Naskah Soal, dan Daftar Nilai Harian'
      },
      {
        id: 'ra-m-8',
        title: 'Melaksanakan program bimbingan remedial bagi siswa di bawah KKTP dan pengayaan bagi siswa tuntas',
        defaultTindakLanjut: [
          'Memberikan penjelasan ulang konsep materi esensial secara tatap muka terbimbing',
          'Memberikan naskah asesmen perbaikan nilai kepada peserta didik remedial',
          'Memberikan tugas proyek pengayaan dan literasi pendalaman materi kepada siswa tuntas'
        ],
        defaultOutput: '1 Berkas Dokumen Pelaksanaan Remedial dan Pengayaan beserta Daftar Nilai Perbaikan Siswa'
      }
    ],
    tindakLanjutTemplates: [
      'Memetakan butir soal yang belum dikuasai mayoritas peserta didik untuk remidi materi',
      'Menyampaikan laporan perkembangan hasil evaluasi belajar kepada wali murid',
      'Menyusun catatan refleksi pedagogik untuk perbaikan strategi pengajaran periode berikutnya',
      'Merekap persentase ketuntasan belajar siswa kelas sebagai bahan evaluasi mutu sekolah'
    ]
  },
  {
    id: 'm-rhk-4',
    code: 'RHK 4',
    category: 'Tambahan',
    title: 'Meningkatnya kompetensi pedagogik, profesional, kepribadian, dan sosial guru melalui keikutsertaan dalam Pengembangan Keprofesian Berkelanjutan (PKB)',
    aspek: 'Waktu',
    indikator: 'Jumlah keikutsertaan seminar, webinar, diklat fungsional, dan kegiatan kolektif guru (KKG)',
    target: '2 Sertifikat / 100%',
    rencanaAksiList: [
      {
        id: 'ra-m-9',
        title: 'Mengikuti kegiatan kolektif guru dalam wadah KKG Gugus / Kecamatan / MGMP',
        defaultTindakLanjut: [
          'Menyusun resume hasil pembahasan materi KKG dan berdiskusi dengan rekan sejawat di sekolah',
          'Menerapkan metode pembelajaran baru yang diperoleh dari pertemuan KKG ke dalam kelas'
        ],
        defaultOutput: '1 Surat Tugas, Daftar Hadir, dan Resume Laporan Hasil Pertemuan KKG'
      },
      {
        id: 'ra-m-10',
        title: 'Mengikuti pelatihan daring/luring, webinar nasional, dan menyelesaikan Aksi Nyata Platform Merdeka Mengajar (PMM)',
        defaultTindakLanjut: [
          'Menyelesaikan post-test topik pelatihan mandiri hingga mendapatkan umpan balik',
          'Mengunggah dokumen aksi nyata ke PMM dan membagikan tautan karya kepada komunitas belajar'
        ],
        defaultOutput: '1 Sertifikat Diklat / Bukti Karya Aksi Nyata PMM dan Ringkasan Laporan Pengembangan Diri'
      }
    ],
    tindakLanjutTemplates: [
      'Mendesiminasikan hasil pelatihan kepada sesama rekan guru di sekolah',
      'Mendokumentasikan sertifikat dan surat tugas ke dalam arsip portofolio keprofesian',
      'Mengimplementasikan inovasi media dan model pembelajaran di ruang kelas'
    ]
  },
  {
    id: 'm-rhk-5',
    code: 'RHK 5',
    category: 'Tambahan',
    title: 'Terlaksananya tugas tambahan yang mendukung kemajuan manajemen mutu sekolah, ekstrakurikuler, dan kepanitiaan kegiatan keagamaan / nasional',
    aspek: 'Kualitas',
    indikator: 'Laporan pelaksanaan tugas tambahan dan surat keputusan (SK) penugasan Kepala Sekolah',
    target: '1 SK / 1 Laporan Periode',
    rencanaAksiList: [
      {
        id: 'ra-m-11',
        title: 'Melaksanakan tugas sebagai Pembina Kegiatan Ekstrakurikuler Keagamaan / Rohis / Pramuka / UKS',
        defaultTindakLanjut: [
          'Menyusun program kerja ekstrakurikuler semesteran dan jadwal latihan rutin mingguan',
          'Mencatat presensi kehadiran siswa serta memantau perkembangan minat dan bakat peserta didik',
          'Menyiapkan peserta didik dalam ajang perlombaan keagamaan / seni islami antar sekolah'
        ],
        defaultOutput: '1 Laporan Pembinaan Ekstrakurikuler, Daftar Hadir Anggota, dan Dokumentasi Kegiatan'
      },
      {
        id: 'ra-m-12',
        title: 'Melaksanakan tugas kepanitiaan kegiatan sekolah (Peringatan Hari Besar Islam / Pesantren Kilat / Tim Literasi)',
        defaultTindakLanjut: [
          'Mengikuti rapat pembentukan panitia dan menyusun proposal teknis kegiatan',
          'Mengkoordinasikan kelancaran susunan acara kegiatan di lingkungan sekolah',
          'Menyusun laporan pertanggungjawaban (LPJ) kegiatan kepada Kepala Sekolah'
        ],
        defaultOutput: '1 Surat Keputusan (SK) Panitia Kepala Sekolah, Notula Rapat, dan Laporan Dokumentasi Acara'
      }
    ],
    tindakLanjutTemplates: [
      'Melakukan koordinasi berkala bersama Kepala Sekolah dan tim panitia',
      'Menyusun laporan pertanggungjawaban kegiatan secara tepat waktu',
      'Mengevaluasi efektivitas kegiatan ekstrakurikuler demi peningkatan mutu di masa mendatang'
    ]
  }
];

