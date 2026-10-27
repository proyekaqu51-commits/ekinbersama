import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================================================
// SERVER-SIDE PERSISTENT CLOUD STORE (CROSS-BROWSER & CROSS-DEVICE SYNC)
// ============================================================================
interface CloudStoreRow {
  store_key: string;
  store_data: any;
  updated_at: string;
}

const CLOUD_STORE_FILE = path.resolve(__dirname, '.lms_cloud_store.json');

function readServerCloudStore(): Record<string, CloudStoreRow> {
  try {
    if (fs.existsSync(CLOUD_STORE_FILE)) {
      const raw = fs.readFileSync(CLOUD_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Warning reading .lms_cloud_store.json:', err);
  }
  return {};
}

function writeServerCloudStore(store: Record<string, CloudStoreRow>): void {
  try {
    fs.writeFileSync(CLOUD_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Warning writing .lms_cloud_store.json:', err);
  }
}

// GET /api/cloud-store -> Ambil seluruh data tersinkron lintas perangkat/browser
app.get('/api/cloud-store', (_req, res) => {
  try {
    const store = readServerCloudStore();
    const rows = Object.values(store);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
      success: true,
      count: rows.length,
      rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to read cloud store' });
  }
});

// POST /api/cloud-store/upsert -> Simpan 1 atau banyak koleksi data lintas browser/perangkat
app.post('/api/cloud-store/upsert', (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ success: false, error: 'rows array required' });
    }
    const store = readServerCloudStore();
    const nowIso = new Date().toISOString();
    let upserted = 0;

    for (const item of rows) {
      if (item && typeof item.store_key === 'string' && item.store_data !== undefined) {
        store[item.store_key] = {
          store_key: item.store_key,
          store_data: item.store_data,
          updated_at: item.updated_at || nowIso
        };
        upserted++;
      }
    }

    writeServerCloudStore(store);
    return res.json({
      success: true,
      upserted,
      updatedAt: nowIso
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to upsert cloud store' });
  }
});

// POST /api/cloud-store/reset -> Kosongkan / Reset seluruh data lintas browser/perangkat
app.post('/api/cloud-store/reset', (req, res) => {
  try {
    const { emptyMap, isFreshEmpty = true } = req.body || {};
    const nowIso = new Date().toISOString();
    const newStore: Record<string, CloudStoreRow> = {
      lms_pai_is_fresh_empty: {
        store_key: 'lms_pai_is_fresh_empty',
        store_data: Boolean(isFreshEmpty),
        updated_at: nowIso
      }
    };

    if (emptyMap && typeof emptyMap === 'object') {
      for (const [k, v] of Object.entries(emptyMap)) {
        newStore[k] = {
          store_key: k,
          store_data: v,
          updated_at: nowIso
        };
      }
    }

    writeServerCloudStore(newStore);
    return res.json({
      success: true,
      resetCount: Object.keys(newStore).length,
      updatedAt: nowIso
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to reset cloud store' });
  }
});

// API: AI Question Generation with Kurikulum Merdeka, Pendekatan KBC, and Model TKA Berbasis Stimulus
app.post('/api/generate-questions', async (req, res) => {
  try {
    const {
      topic = 'Surah Al-Ma\'un & Kepedulian Sosial',
      grade = '5',
      semester = 'Ganjil',
      count = 5,
      schoolName = 'SDN Ciketing Udik 2 Bantargebang',
      questionType = 'all',
      typeCounts = undefined
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_'));

    if (hasValidKey && apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        let typeDistributionInstruction = '';
        let totalRequested = Number(count) || 5;
        if (typeCounts && typeof typeCounts === 'object') {
          const breakdown: string[] = [];
          let sum = 0;
          const labels: Record<string, string> = {
            pg_standar: 'Pilihan Ganda Standar (pg_standar)',
            pg_kompleks: 'Pilihan Ganda Kompleks / Lebih dari 1 jawaban benar (pg_kompleks)',
            benar_salah: 'Benar / Salah (benar_salah)',
            menjodohkan: 'Menjodohkan pasangan pernyataan kiri & kanan (menjodohkan)',
            isian_singkat: 'Isian Singkat dengan 1 kata/frasa kunci jawaban pasti (isian_singkat)',
            essay: 'Uraian / Essay penalaran (essay)'
          };
          Object.entries(typeCounts).forEach(([k, v]) => {
            const num = Number(v) || 0;
            if (num > 0) {
              sum += num;
              breakdown.push(`- ${num} butir soal tipe "${k}" (${labels[k] || k})`);
            }
          });
          if (sum > 0) {
            totalRequested = sum;
            typeDistributionInstruction = `\nKOMPOSISI JUMLAH SOAL PER JENIS (WAJIB DIIKUTI PERSIS TOTAL ${totalRequested} SOAL):\n${breakdown.join('\n')}`;
          }
        }

        const prompt = `Anda adalah Pakar Asesmen Kurikulum Merdeka Pendidikan Agama Islam (PAI) & Budi Pekerti Sekolah Dasar (SD) berlandaskan Keputusan Kepala BKPDM Nomor 020 Tahun 2026 dengan Pendekatan KBC (Kurikulum Berbasis Cinta / Kasih Sayang, Empati, dan Akhlak Mulia).

Susunlah ${totalRequested} butir soal Asesmen PAI model TKA (Tes Kemampuan Akademik / Asesmen Kompetensi Siswa SD) untuk:
- Sasaran: Siswa Kelas ${grade} SD (karakteristik anak usia SD, ramah anak, mudah dipahami, penuh hikmah).
- Semester: ${semester}
- Materi/Topik Pokok: ${topic}
- Nama Sekolah (wajib digunakan sebagai latar/setting cerita kontekstual): "${schoolName}"
- Tipe Soal: ${questionType === 'all' || questionType === 'per_type' ? 'Sesuai rincian jenis soal yang diminta' : questionType}${typeDistributionInstruction}

KETENTUAN KHUSUS & KETAT:
1. MODEL SOAL TKA BERBASIS STIMULUS:
   Setiap butir soal HARUS diawali "stimulus" berupa narasi cerita pendek, dialog, atau kasus nyata keseharian anak SD di "${schoolName}" atau di rumah.
2. PENDEKATAN KBC (KURIKULUM BERBASIS CINTA):
   Muatan soal dan stimulus harus menanamkan rasa cinta kepada Allah dan Rasul-Nya, cinta sesama teman, empati, tolong-menolong (ta'awun), dan budi pekerti.
3. KHAT NASKH ARABIK BERHARAKAT RAPI:
   Sertakan properti "arabicText" dengan tulisan Arab berharakat LENGKAP dan rapi jika relevan dengan materi.
4. ATURAN KHUSUS TIPE SOAL:
   - "pg_standar": "options" berisi 4 pilihan string, "correctAnswer" berisi 1 string pilihan yang benar.
   - "pg_kompleks": "options" berisi 4 pilihan string, "correctAnswer" berisi array 2 string pilihan yang benar.
   - "benar_salah": "options" berisi ["Benar", "Salah"], "correctAnswer" berisi "Benar" atau "Salah".
   - "menjodohkan": WAJIB menyertakan "matchingPairs" berupa array minimal 3 objek [{"left": "Pernyataan/Premis...", "right": "Pasangan Jawaban..."}], "options" berupa array ["left ➔ right"], dan "correctAnswer" berupa array ["left = right"].
   - "isian_singkat": "options" berupa [], "correctAnswer" berupa jawaban singkat yang jelas (bisa dipisahkan "/" jika ada sinonim, misal "Al-Amin / Dapat dipercaya").
   - "essay": "options" berupa [], "correctAnswer" berupa pedoman/kunci uraian.

Format output JSON murni (array of objects):
[
  {
    "questionType": "pg_standar" | "pg_kompleks" | "benar_salah" | "menjodohkan" | "isian_singkat" | "essay",
    "stimulus": "Narasi cerita kontekstual anak SD di ${schoolName}...",
    "arabicText": "Ayat/hadis/doa berharakat lengkap khat naskh",
    "question": "Kalimat pertanyaan pemantik pemahaman stimulus...",
    "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
    "matchingPairs": [{"left": "Pernyataan 1", "right": "Pasangan 1"}],
    "correctAnswer": "Jawaban benar atau array jawaban benar",
    "scoreWeight": 10,
    "classId": "${grade}",
    "className": "Tingkat Kelas ${grade}",
    "semester": "${semester}",
    "domain": "Elemen PAI (Al-Qur'an & Hadis / Akidah / Akhlak / Fikih / Sejarah Peradaban Islam)",
    "approach": "Kurikulum Berbasis Cinta (KBC)",
    "explanation": "Penjelasan sarat nilai kasih sayang mengapa jawaban tersebut benar."
  }
]`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = parsed.map((item: any, i: number) => {
            const qType = item.questionType || 'pg_standar';
            const pairs = Array.isArray(item.matchingPairs) && item.matchingPairs.length > 0
              ? item.matchingPairs
              : undefined;
            const opts =
              qType === 'menjodohkan' && pairs
                ? pairs.map((p: any) => `${p.left} ➔ ${p.right}`)
                : Array.isArray(item.options)
                ? item.options
                : [];
            const corr =
              qType === 'menjodohkan' && pairs
                ? pairs.map((p: any) => `${p.left} = ${p.right}`)
                : item.correctAnswer;

            return {
              id: 'q-ai-' + Date.now().toString(36) + '-' + i,
              questionType: qType,
              stimulus: item.stimulus || '',
              arabicText: item.arabicText || undefined,
              question: item.question,
              options: opts,
              matchingPairs: pairs,
              correctAnswer: corr,
              scoreWeight: Number(item.scoreWeight) || 10,
              classId: String(grade),
              className: `Tingkat Kelas ${grade}`,
              semester,
              domain: item.domain || 'PAI & Budi Pekerti',
              approach: 'Kurikulum Berbasis Cinta (KBC)',
              explanation: item.explanation || ''
            };
          });
          return res.json({ success: true, source: 'gemini', questions: formatted });
        }
      } catch (geminiError: any) {
        console.warn('Gemini generateContent error, delegating to internal KBC engine:', geminiError?.message);
      }
    }

    // Fallback: If no API key or Gemini had temporary rate limit, trigger internal KBC engine
    return res.json({
      success: false,
      useLocalFallback: true,
      message: 'GEMINI_API_KEY not active, fallback to internal KBC TKA engine'
    });
  } catch (err: any) {
    console.error('Server error generating questions:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// API: AI Teaching Documents (Perangkat Ajar Kurikulum Merdeka PAI & Budi Pekerti SD + Pendekatan KBC)
app.post('/api/generate-teaching-doc', async (req, res) => {
  try {
    const {
      docType = 'modul_ajar',
      grade = '5',
      semester = 'Ganjil',
      topic = 'Menyayangi Anak Yatim & Memahami Surah Al-Ma\'un',
      domain = 'Al-Qur\'an & Hadis',
      schoolName = 'SDN Ciketing Udik 2 Bantargebang',
      teacherName = 'H. Ahmad Syarif, S.Pd.I',
      principalName = 'Hj. Siti Aminah, M.Pd',
      academicYear = '2026/2027'
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_'));

    if (hasValidKey && apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const fase = (grade === '1' || grade === '2') ? 'Fase A' : (grade === '3' || grade === '4') ? 'Fase B' : 'Fase C';

        const prompt = `Anda adalah Pakar Kurikulum Merdeka Kementerian Agama dan Kemendikbudristek untuk jenjang Sekolah Dasar (SD) dalam bidang Pendidikan Agama Islam (PAI) & Budi Pekerti.
Pedoman regulasi resmi CP/ATP mengacu pada: Keputusan Kepala Badan Kebijakan Pendidikan Dasar dan Menengah (BKPDM) Nomor 020 Tahun 2026 dengan pendekatan KBC (Kurikulum Berbasis Cinta).
Anda juga merupakan pelopor "Pendekatan KBC (Kurikulum Berbasis Cinta)", yang menanamkan kecintaan kepada Allah SWT dan Rasulullah SAW, kasih sayang kepada sesama teman, adab mulia, empati, dan pengasuhan yang menyejukkan tanpa kekerasan.

Susunlah dokumen perangkat ajar resmi dan profesional tipe: "${docType.toUpperCase()}" untuk:
- Jenjang & Kelas: Kelas ${grade} SD (${fase})
- Semester: ${semester}
- Tahun Ajaran: ${academicYear}
- Elemen PAI: ${domain}
- Topik / Materi Pokok: ${topic}
- Nama Satuan Pendidikan: "${schoolName}"
- Guru PAI: ${teacherName}
- Kepala Sekolah: ${principalName}
- Dasar Hukum & Regulasi: Keputusan Kepala Badan Kebijakan Pendidikan Dasar dan Menengah (BKPDM) Nomor 020 Tahun 2026 dengan pendekatan KBC

Spesifikasi Berdasarkan Jenis Dokumen (${docType}):
1. Jika "cp_atp": Susunlah Capaian Pembelajaran Elemen ${domain} berlandaskan Keputusan Kepala BKPDM Nomor 020 Tahun 2026 dan Alur Tujuan Pembelajaran (ATP) terperinci dengan alokasi JP, dimensi Profil Pelajar Pancasila berpadu nilai KBC, dan indikator ketercapaian.
2. Jika "prota": Susunlah Program Tahunan mencakup semester Ganjil & Genap dengan tabel pembagian materi, alokasi JP (total 108/144 JP), dan tujuan pembelajaran.
3. Jika "promes": Susunlah Program Semester untuk semester ${semester} lengkap dengan matriks distribusi alokasi JP per pekan efektif (bulan Juli-Desember atau Januari-Juni) dan asesmen sumatif.
4. Jika "kktp": Susunlah Kriteria Ketercapaian Tujuan Pembelajaran dengan rubrik kategori 4 level (Perlu Bimbingan / 0-60, Cukup / 61-75, Baik / 76-88, Sangat Baik / 89-100) dan tindak lanjut intervensi berjiwa kasih sayang (KBC).
5. Jika "modul_ajar": Susunlah Modul Ajar (RPP Merdeka) lengkap: Identitas, Kompetensi Awal, Profil Pelajar Pancasila & Nilai KBC, Sarana Prasarana, Target & Model Belajar, Komponen Inti (Tujuan Pembelajaran, Pemahaman Bermakna, Pertanyaan Pemantik, Langkah Kegiatan Berdiferensiasi [Pendahuluan, Inti 5M, Penutup], Asesmen Awal/Formatif/Sumatif, Pengayaan & Remedial, Refleksi Guru & Siswa), dan Lampiran (Glosarium & Pustaka).
6. Jika "lkpd": Susunlah Lembar Kerja Peserta Didik ramah anak SD dengan stimulus cerita kontekstual di lingkungan "${schoolName}", ayat/hadis berhuruf Arab berharakat rapi (Khat Naskh), panduan aktivitas aktif dan refleksi kalbu KBC, serta rubrik apresiasi.

Output WAJIB berupa JSON murni dengan format persis:
{
  "title": "Judul resmi dokumen...",
  "summary": "Ringkasan esensial perangkat ajar ini...",
  "meta": {
    "fase": "${fase}",
    "elementDomain": "${domain}",
    "alokasiWaktuJP": 12,
    "targetBab": "${topic}",
    "pendekatan": "Kurikulum Berbasis Cinta (KBC)"
  },
  "contentData": {
    "capaianPembelajaran": "...",
    "alurTujuanPembelajaran": [
      {
        "no": 1,
        "tujuan": "...",
        "materi": "...",
        "elemen": "${domain}",
        "alokasiJP": 4,
        "profilPancasilaKBC": "Beriman & Kasih Sayang Ta'awun",
        "indikator": "..."
      }
    ],
    "protaItems": [
      {
        "no": 1,
        "semester": "Ganjil",
        "elemen": "${domain}",
        "materiPokok": "...",
        "tujuanPembelajaran": "...",
        "alokasiJP": 12,
        "keterangan": "..."
      }
    ],
    "totalJPGanjil": 54,
    "totalJPGenap": 54,
    "totalJPTahunan": 108,
    "promesItems": [
      {
        "no": 1,
        "materiPokok": "...",
        "tujuanPembelajaran": "...",
        "alokasiJP": 12,
        "distribusiBulan": [
          { "bulan": "Juli", "minggu": [4, 4] }
        ]
      }
    ],
    "kktpItems": [
      {
        "no": 1,
        "tujuanPembelajaran": "...",
        "indikatorKetuntasan": "...",
        "kriteria": {
          "perluBimbingan": "...",
          "cukup": "...",
          "baik": "...",
          "sangatBaik": "..."
        },
        "tindakLanjutKBC": "..."
      }
    ],
    "modulAjar": {
      "identitas": {
        "penyusun": "${teacherName}",
        "instansi": "${schoolName}",
        "faseKelas": "${fase} / Kelas ${grade}",
        "semester": "${semester}",
        "materiPokok": "${topic}",
        "alokasiWaktu": "3 Pertemuan (9 x 35 Menit)"
      },
      "kompetensiAwal": "...",
      "profilPelajarPancasilaKBC": ["Beriman, Bertakwa kepada Tuhan YME dan Berakhlak Mulia", "Cinta Kasih & Gotong Royong (Ta'awun)", "Mandiri & Berkeadaban"],
      "saranaPrasarana": ["Buku PAI Siswa", "LCD Proyektor / Gambar Cerita", "Mushaf Al-Qur'an Standar", "Kartu Ayat & Cermin Refleksi"],
      "targetPesertaDidik": "Peserta Didik Reguler (Tipikal) Kelas ${grade} SD",
      "modelPembelajaran": "Tatap Muka - Pembelajaran Berdiferensiasi & Problem Based Learning (PBL) Berbasis Cinta",
      "komponenInti": {
        "tujuanPembelajaran": ["..."],
        "pemahamanBermakna": "...",
        "pertanyaanPemantik": ["..."],
        "kegiatanPembelajaran": {
          "pendahuluan": ["Membuka pelajaran dengan salam hangat, doa bersama, dan pembiasaan senyum kasih sayang.", "..."],
          "kegiatanInti": ["Mengamati stimulus cerita...", "Berdiskusi santun...", "Menalar hikmah..."],
          "penutup": ["Menyimpulkan pelajaran bersama...", "Refleksi perasaan kalbu siswa...", "Doa kafaratul majlis."]
        },
        "asesmen": {
          "diagnostik": "Tanya jawab lisan awal tentang pengalaman anak...",
          "formatif": "Observasi sikap ta'awun dan keaktifan diskusi...",
          "sumatif": "Tes tertulis pemahaman konsep dan unjuk kerja praktik..."
        },
        "pengayaanRemedial": "Remedial berupa pendampingan penuh kelembutan (KBC); Pengayaan berupa tugas mandiri menjadi teladan kebaikan.",
        "refleksi": "Refleksi guru terhadap suasana kegembiraan dan kedalaman pemahaman anak."
      },
      "lampiran": {
        "bahanBacaan": "Ringkasan materi esensial guru dan murid...",
        "glosarium": "Daftar istilah penting...",
        "daftarPustaka": "Buku Guru dan Buku Siswa PAI Kelas ${grade} Kemendikbudristek/Kemenag 2024."
      }
    },
    "lkpd": {
      "judulAktivitas": "Lembar Kerja Ceria PAI Berbasis Cinta",
      "temaNilaiKBC": "Cinta Allah, Cinta Rasul, dan Kasih Sayang Sesama",
      "petunjukBelajar": [
        "Awali kegiatan dengan membaca Basmalah.",
        "Baca teks kisah dan perhatikan petunjuk dengan cermat.",
        "Diskusikan bersama teman kelompokmu dengan sopan dan saling menghargai."
      ],
      "stimulusCerita": "Kisah kontekstual anak di lingkungan ${schoolName}...",
      "arabicSnippet": {
        "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        "arti": "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang."
      },
      "langkahAktivitas": [
        "1. Amati cerita di atas.",
        "2. Tuliskan perbuatan baik apa yang dapat kamu contoh.",
        "3. Lakukan aksi kebaikan hari ini di kelas atau rumah."
      ],
      "tugasSiswa": [
        {
          "nomor": 1,
          "instruksi": "Jelaskan sikap kasih sayang yang ditunjukkan dalam cerita!",
          "tipe": "isian"
        },
        {
          "nomor": 2,
          "instruksi": "Manakah tindakan yang mencerminkan sifat ta'awun (tolong-menolong)?",
          "tipe": "pilihan",
          "opsi": ["Membantu teman yang terjatuh", "Membiarkan teman bersedih", "Mengejek saat teman keliru", "Menolak berbagi"]
        }
      ],
      "refleksiCinta": "Tuliskan satu hal baik yang membuat hatimu merasa bahagia hari ini karena telah membantu orang lain!",
      "rubrikNilai": "Kriteria penilaian: Sikap Kasih Sayang (40%), Pemahaman Konsep (40%), Kreativitas/Kerapian (20%)."
    },
    "catatanTambahan": "Dokumen siap diverifikasi dan ditandatangani secara resmi."
  }
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        return res.json({
          success: true,
          source: 'gemini',
          document: {
            id: 'doc-ai-' + Date.now().toString(36),
            docType,
            classGrade: String(grade),
            semester,
            academicYear,
            title: parsed.title || `Perangkat Ajar ${docType.toUpperCase()} Kelas ${grade}`,
            summary: parsed.summary || `Dokumen resmi ${docType.toUpperCase()} PAI Kurikulum Merdeka`,
            schoolName,
            teacherName,
            teacherNip: req.body.teacherNip || '198503152010011002',
            principalName,
            principalNip: req.body.principalNip || '197608201999032001',
            regulasi: 'Keputusan Kepala Badan Kebijakan Pendidikan Dasar dan Menengah (BKPDM) Nomor 020 Tahun 2026 dengan pendekatan KBC',
            meta: parsed.meta ? {
              ...parsed.meta,
              regulasi: 'Keputusan Kepala Badan Kebijakan Pendidikan Dasar dan Menengah (BKPDM) Nomor 020 Tahun 2026'
            } : {
              fase,
              elementDomain: domain,
              alokasiWaktuJP: 12,
              targetBab: topic,
              pendekatan: 'Kurikulum Berbasis Cinta (KBC)',
              regulasi: 'Keputusan Kepala Badan Kebijakan Pendidikan Dasar dan Menengah (BKPDM) Nomor 020 Tahun 2026'
            },
            contentData: parsed.contentData || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        });
      } catch (geminiError: any) {
        console.warn('Gemini generate teaching doc error, fallback to local engine:', geminiError?.message);
      }
    }

    return res.json({
      success: false,
      useLocalFallback: true,
      message: 'GEMINI_API_KEY not active, delegating to built-in KBC generator engine'
    });
  } catch (err: any) {
    console.error('Server error generating teaching doc:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// API: AI KKTP Analysis, Remedial Material & Special Assignment Recommendation (KBC - Kep. Kepala BKPDM No. 020 Tahun 2026)
app.post('/api/analyze-kktp-remedial', async (req, res) => {
  try {
    const {
      studentName = 'Siswa PAI',
      className = '5A',
      gradeLevel = '5',
      currentAvg = 65,
      kktpThreshold = 75,
      weakQuizzes = [],
      primaryDomain = 'Al-Qur\'an & Hadis',
      schoolName = 'SDN Ciketing Udik 2 Bantargebang'
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_'));

    if (hasValidKey && apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const weakListText = Array.isArray(weakQuizzes) && weakQuizzes.length > 0
          ? weakQuizzes.map((w: any) => `- ${w.quizTitle} (${w.domain}): Nilai ${w.score !== null && w.score !== undefined ? w.score : 'Belum Mengerjakan'}`).join('\n')
          : `- Evaluasi Elemen ${primaryDomain}: Nilai rata-rata ${currentAvg}`;

        const prompt = `Anda adalah Pakar Asesmen Diagnostik & Intervensi Remedial Pendidikan Agama Islam (PAI) dan Budi Pekerti Sekolah Dasar (SD) berlandaskan Keputusan Kepala Badan Kebijakan Pendidikan Dasar dan Menengah (BKPDM) Nomor 020 Tahun 2026 dengan Pendekatan KBC (Kurikulum Berbasis Cinta).

Analisis hasil capaian nilai siswa berikut yang belum mencapai Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) dan susunlah rekomendasi Materi Remedial serta Penugasan Khusus yang ramah anak, memotivasi, dan penuh kasih sayang:

Data Siswa:
- Nama Siswa: ${studentName}
- Kelas / Tingkat: Kelas ${className} (Tingkat ${gradeLevel} SD)
- Satuan Pendidikan: ${schoolName}
- Nilai Rata-rata Saat Ini: ${currentAvg}
- Standar KKTP Kelas: ${kktpThreshold} (Selisih/Defisit: ${Math.max(0, kktpThreshold - currentAvg)} poin)
- Elemen PAI Prioritas: ${primaryDomain}
- Rincian Evaluasi yang Belum Tuntas:
${weakListText}

Susunlah output JSON murni dengan struktur persis berikut:
{
  "diagnosticSummary": "Analisis diagnostik 2-3 kalimat yang menjelaskan letak kesulitan belajar ${studentName} secara empatik (pendekatan KBC) dan strategi bimbingan terbaik.",
  "remedialMaterial": {
    "title": "Judul Materi Remedial yang menarik dan menyentuh hati anak SD...",
    "domain": "${primaryDomain}",
    "summary": "Ringkasan materi suplemen remedial 2-3 paragraf singkat yang mudah dipahami siswa Kelas ${gradeLevel} di ${schoolName}...",
    "keyPoints": [
      "Poin inti pemahaman 1...",
      "Poin inti pemahaman 2...",
      "Poin inti pengamalan nyata 3..."
    ],
    "arabicVerse": "Teks ayat Al-Qur'an, hadis pendek, atau doa terkait lengkap dengan harakat Khat Naskh...",
    "arabicTranslation": "Terjemahan bahasa Indonesia dari teks Arab tersebut...",
    "kbcReflection": "Pesan penyemangat berbasis Kurikulum Berbasis Cinta untuk menguatkan rasa percaya diri ${studentName}..."
  },
  "specialAssignment": {
    "title": "Judul Penugasan Khusus / LKPD Remedial...",
    "type": "Praktik Ibadah & Pembiasaan" | "Lembar Kerja Terarah (LKPD Remedial)" | "Proyek Kasih Sayang (KBC) & Akhlak" | "Tadarus & Hafalan Terbimbing",
    "instructions": [
      "Langkah tugas 1 yang konkret dan menyenangkan...",
      "Langkah tugas 2...",
      "Langkah tugas 3..."
    ],
    "targetCompetency": "Indikator Tujuan Pembelajaran (ATP BKPDM No. 020/2026) yang akan tuntas melalui tugas ini...",
    "deadlineDays": 5,
    "parentGuidance": "Panduan singkat bagi orang tua di rumah untuk mendampingi ${studentName} dengan kasih sayang...",
    "evaluationRubric": "Kriteria ketuntasan remedial untuk mencapai nilai minimal KKTP (${kktpThreshold})..."
  }
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        if (parsed && parsed.diagnosticSummary && parsed.remedialMaterial && parsed.specialAssignment) {
          return res.json({
            success: true,
            source: 'gemini',
            analysis: parsed
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini remedial analysis error, delegating to internal KBC remedial engine:', geminiError?.message);
      }
    }

    return res.json({
      success: false,
      useLocalFallback: true,
      message: 'Delegating to internal KBC KKTP diagnostic & remedial engine'
    });
  } catch (err: any) {
    console.error('Server error in /api/analyze-kktp-remedial:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// API: AI Auto-Fill Output Kegiatan E-Kinerja Harian
app.post('/api/generate-ekinerja-output', async (req, res) => {
  try {
    const {
      rkhText = '',
      rencanaAksiText = '',
      tindakLanjutText = '',
      jabatan = 'Guru Pendidikan Agama Islam & Budi Pekerti',
      schoolName = 'SDN Ciketing Udik 2 Bantargebang'
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_'));

    if (hasValidKey && apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Anda adalah Pakar Penyusunan Laporan E-Kinerja ASN / Guru di lingkungan Kementerian Pendidikan dan Kementerian Agama.
Berdasarkan rincian pelaksanaan kegiatan harian berikut:
- Jabatan Pegawai: ${jabatan}
- Unit Kerja: ${schoolName}
- Rencana Hasil Kerja (RKH): ${rkhText || '-'}
- Jenis Kegiatan / Rencana Aksi Harian: ${rencanaAksiText || '-'}
- Tindak Lanjut yang Dilakukan: ${tindakLanjutText || '-'}

Susunlah deskripsi "Output" (Hasil Kerja / Bukti Fisik / Capaian Konkret Kegiatan Harian) yang terukur, padat, profesional, dan sesuai standar pelaporan E-Kinerja Harian Guru.
Kembalikan JSON murni dengan struktur berikut:
{
  "primaryOutput": "1 kalimat output utama yang padat, jelas, dan mencerminkan hasil/dokumen/bukti fisik dari kegiatan tersebut...",
  "alternatives": [
    "Alternatif rumusan output 1...",
    "Alternatif rumusan output 2...",
    "Alternatif rumusan output 3..."
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        if (parsed && parsed.primaryOutput) {
          return res.json({
            success: true,
            source: 'gemini',
            primaryOutput: parsed.primaryOutput,
            alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : []
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini E-Kinerja output generation fallback:', geminiError?.message);
      }
    }

    return res.json({
      success: false,
      useLocalFallback: true,
      message: 'Using smart local E-Kinerja AI Output generator'
    });
  } catch (err: any) {
    console.error('Server error in /api/generate-ekinerja-output:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// API: AI Assistant for Rencana Aksi, Tindak Lanjut, and Output E-Kinerja Guru
app.post('/api/generate-ekinerja-suggestions', async (req, res) => {
  try {
    const {
      type = 'rencana_aksi', // 'rencana_aksi' | 'tindak_lanjut' | 'output'
      rkhText = '',
      rencanaAksiText = '',
      tindakLanjutText = '',
      jabatan = 'Guru Pendidikan Agama Islam & Budi Pekerti',
      schoolName = 'SDN Ciketing Udik 2 Bantargebang'
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_'));

    if (hasValidKey && apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        let systemPrompt = '';
        if (type === 'rencana_aksi') {
          systemPrompt = `Anda adalah Pakar Penyusunan SKP & E-Kinerja ASN Guru di Indonesia (PermenPAN-RB No 6 Tahun 2022 / BKN).
Berdasarkan Rencana Hasil Kerja (RHK) berikut:
- Jabatan: ${jabatan}
- Satuan Pendidikan: ${schoolName}
- RHK yang Dituju: "${rkhText || 'Terlaksananya pembelajaran, asesmen, dan pembimbingan peserta didik'}"

Susunlah 4 sampai 5 butir "Rencana Aksi / Jenis Kegiatan Riil" yang operasional, jelas, konkret, dan lazim dilaksanakan oleh Guru di Sekolah Dasar.
Kembalikan JSON murni format:
{
  "suggestions": [
    "Contoh kalimat rencana aksi 1...",
    "Contoh kalimat rencana aksi 2...",
    "Contoh kalimat rencana aksi 3...",
    "Contoh kalimat rencana aksi 4..."
  ]
}`;
        } else if (type === 'tindak_lanjut') {
          systemPrompt = `Anda adalah Pakar Penyusunan SKP & E-Kinerja ASN Guru di Indonesia.
Berdasarkan pelaksanaan kegiatan berikut:
- Jabatan: ${jabatan}
- Satuan Pendidikan: ${schoolName}
- RHK: "${rkhText || '-'}"
- Rencana Aksi / Kegiatan: "${rencanaAksiText || '-'}"

Susunlah 4 sampai 5 butir rekomendasi "Tindak Lanjut" yang profesional (misalnya: koordinasi Kepala Sekolah, telaah instrumen di forum KKG, program perbaikan/pengayaan siswa, pendokumentasian portofolio digital, koordinasi wali murid).
Kembalikan JSON murni format:
{
  "suggestions": [
    "Tindak lanjut konkret 1...",
    "Tindak lanjut konkret 2...",
    "Tindak lanjut konkret 3...",
    "Tindak lanjut konkret 4..."
  ]
}`;
        } else {
          systemPrompt = `Anda adalah Pakar Penyusunan SKP & E-Kinerja ASN Guru di Indonesia.
Berdasarkan rincian kegiatan berikut:
- RHK: "${rkhText || '-'}"
- Rencana Aksi: "${rencanaAksiText || '-'}"
- Tindak Lanjut: "${tindakLanjutText || '-'}"

Susunlah 4 rumusan deskripsi "Output" (Bukti Fisik / Hasil Kerja Terukur E-Kinerja Guru) yang padat, berbobot, dan mencantumkan satuan hasil (misal: "1 Berkas Dokumen...", "1 Laporan...", "1 Paket...").
Kembalikan JSON murni format:
{
  "suggestions": [
    "Rumusan output 1...",
    "Rumusan output 2...",
    "Rumusan output 3..."
  ]
}`;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
          return res.json({
            success: true,
            source: 'gemini',
            suggestions: parsed.suggestions
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini suggestions fallback:', geminiError?.message);
      }
    }

    // Smart Local Fallback
    const localSuggestions: string[] = [];
    const lower = `${rkhText} ${rencanaAksiText}`.toLowerCase();

    if (type === 'rencana_aksi') {
      if (lower.includes('perencana') || lower.includes('modul') || lower.includes('perangkat')) {
        localSuggestions.push(
          'Menyusun Modul Ajar berdiferensiasi dan instrumen asesmen formatif-sumatif',
          'Menganalisis Capaian Pembelajaran (CP) dan Alur Tujuan Pembelajaran (ATP) semester berjalan',
          'Menyiapkan bahan ajar interaktif, presentasi digital, dan Lembar Kerja Peserta Didik (LKPD)',
          'Memvalidasi modul ajar bersama Kepala Sekolah sebelum pelaksanaan pembelajaran'
        );
      } else if (lower.includes('asesmen') || lower.includes('evaluasi') || lower.includes('nilai')) {
        localSuggestions.push(
          'Melaksanakan penilaian formatif harian dan sumatif lingkup materi sesuai kisi-kisi',
          'Memeriksa lembar kerja peserta didik dan mengolah nilai ke dalam buku nilai',
          'Melaksanakan analisis ketuntasan tujuan pembelajaran (KKTP) per peserta didik',
          'Menyelenggarakan program remedial dan pengayaan materi berdasarkan hasil analisis KKTP'
        );
      } else if (lower.includes('kkg') || lower.includes('pelatihan') || lower.includes('kompetensi')) {
        localSuggestions.push(
          'Mengikuti pertemuan rutin Kelompok Kerja Guru (KKG) PAI Kecamatan',
          'Menyelesaikan aksi nyata dan modul pelatihan mandiri Platform Merdeka Mengajar (PMM)',
          'Mengikuti seminar/webinar pengembangan keprofesian berkelanjutan (PKB) guru',
          'Mendiseminasikan praktik baik pembelajaran berdiferensiasi kepada rekan sejawat'
        );
      } else if (lower.includes('tugas tambahan') || lower.includes('ekstrakurikuler') || lower.includes('pembina')) {
        localSuggestions.push(
          'Melaksanakan tugas pembinaan kegiatan ekstrakurikuler keagamaan / tahsin quran',
          'Membimbing pembiasaan sholat dhuha dan dzuhur berjamaah di musholla sekolah',
          'Menyusun program kerja dan laporan bulanan tugas tambahan di sekolah'
        );
      } else {
        localSuggestions.push(
          'Melaksanakan pembelajaran berdiferensiasi interaktif berpusat pada murid',
          'Membimbing pembiasaan karakter akhlak mulia dan budaya positif di kelas',
          'Menggunakan media pembelajaran berbasis teknologi digital dan kuis interaktif',
          'Melakukan observasi dan pendampingan individu bagi peserta didik berkebutuhan khusus'
        );
      }
    } else if (type === 'tindak_lanjut') {
      if (lower.includes('asesmen') || lower.includes('nilai') || lower.includes('remedial')) {
        localSuggestions.push(
          'Memetakan butir soal yang belum dikuasai peserta didik untuk remidi terarah',
          'Menyampaikan laporan perkembangan nilai evaluasi belajar kepada orang tua / wali murid',
          'Menyusun catatan refleksi pembelajaran untuk perbaikan strategi pada siklus berikutnya'
        );
      } else if (lower.includes('perangkat') || lower.includes('modul')) {
        localSuggestions.push(
          'Mendiskusikan instrumen penilaian bersama rekan sejawat dalam forum KKG',
          'Mengonsultasikan draf modul ajar kepada Kepala Sekolah guna memperoleh validasi',
          'Mengarsipkan dokumen perangkat ajar ke dalam portofolio digital sekolah'
        );
      } else {
        localSuggestions.push(
          'Menelaah ketercapaian tujuan pembelajaran bersama Kepala Sekolah dalam sesi refleksi',
          'Melakukan koordinasi dengan wali kelas dan orang tua terkait pembiasaan ibadah di rumah',
          'Mendokumentasikan hasil karya peserta didik ke dalam portofolio kelas',
          'Mengikutsertakan peserta didik yang berprestasi dalam lomba keagamaan tingkat kecamatan'
        );
      }
    } else {
      localSuggestions.push(
        '1 Berkas Dokumen Laporan Pelaksanaan Kegiatan yang Diverifikasi Kepala Sekolah',
        '1 Paket Dokumentasi Foto Kegiatan dan Lembar Bukti Hasil Kerja Peserta Didik',
        '1 Berkas Rekapitulasi Data dan Catatan Refleksi Pembelajaran Guru'
      );
    }

    return res.json({
      success: true,
      source: 'local_engine',
      suggestions: localSuggestions
    });
  } catch (err: any) {
    console.error('Server error in /api/generate-ekinerja-suggestions:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Vite Middleware for Development / Static serving for Production
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const startListening = (retriesLeft = 10) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`E-KINERJA Server running on port ${port}`);
    });

    server.on('error', (err: any) => {
      if (err?.code === 'EADDRINUSE' && retriesLeft > 0) {
        console.warn(`Port ${port} in use, retrying in 300ms... (${retriesLeft} retries left)`);
        setTimeout(() => {
          server.close();
          startListening(retriesLeft - 1);
        }, 300);
      } else {
        console.error('Server listen error:', err);
      }
    });

    const shutdown = () => {
      server.close(() => {
        process.exit(0);
      });
      setTimeout(() => process.exit(0), 500);
    };

    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
  };

  startListening();
}

setupServer();
