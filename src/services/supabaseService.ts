import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IndexedDbService } from './indexedDbService';

export const DEFAULT_SUPABASE_URL = '';
export const DEFAULT_SUPABASE_ANON_KEY = '';

const CONFIG_STORAGE_KEY = 'lms_supabase_config';
const LAST_SYNC_STORAGE_KEY = 'lms_supabase_last_sync';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

interface CloudRow {
  store_key: string;
  store_data: any;
  updated_at: string;
}

let supabaseInstance: SupabaseClient | null = null;
let isFlushingOutbox = false;

/**
 * Mengirimkan baris data ke Server Cloud Store (/api/cloud-store/upsert)
 * agar lintas browser & lintas perangkat selalu membaca database terpusat yang sama
 * meskipun tabel SQL eksternal belum diinisialisasi.
 */
async function pushRowsToServerStore(rows: CloudRow[]): Promise<boolean> {
  if (typeof window === 'undefined' || rows.length === 0) return false;
  try {
    const res = await fetch('/api/cloud-store/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows })
    });
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json && json.success);
  } catch {
    return false;
  }
}

/**
 * Mengambil seluruh baris data dari Server Cloud Store (/api/cloud-store)
 */
async function fetchRowsFromServerStore(): Promise<CloudRow[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/cloud-store', {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (json && json.success && Array.isArray(json.rows)) {
      return json.rows;
    }
  } catch {
    // ignore network error
  }
  return [];
}

/**
 * Mereset Server Cloud Store (/api/cloud-store/reset)
 */
async function resetServerStore(
  emptyMap: Record<string, any>,
  isFreshEmpty = true
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/cloud-store/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emptyMap, isFreshEmpty })
    });
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json && json.success);
  } catch {
    return false;
  }
}

export const SupabaseService = {
  getConfig: (): SupabaseConfig => {
    try {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Hapus otomatis jika masih menyimpan koneksi database bawaan lama
        if (parsed.url && parsed.url.includes('ejqtnvqrgnksczmaoxof')) {
          localStorage.removeItem(CONFIG_STORAGE_KEY);
        } else if (parsed.url && parsed.anonKey) {
          return {
            url: parsed.url.trim(),
            anonKey: parsed.anonKey.trim(),
            enabled: parsed.enabled !== false
          };
        }
      }
    } catch {
      // ignore
    }
    return {
      url: '',
      anonKey: '',
      enabled: false
    };
  },

  saveConfig: (config: SupabaseConfig): void => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    supabaseInstance = null; // force re-init
  },

  getClient: (): SupabaseClient | null => {
    const cfg = SupabaseService.getConfig();
    if (!cfg.url || !cfg.anonKey || !cfg.enabled) {
      return null;
    }
    if (!supabaseInstance) {
      try {
        supabaseInstance = createClient(
          cfg.url,
          cfg.anonKey,
          {
            auth: {
              persistSession: false
            }
          }
        );
      } catch (err) {
        console.warn('Gagal menginisialisasi Supabase client:', err);
        return null;
      }
    }
    return supabaseInstance;
  },

  getLastSyncTime: (): string | null => {
    return localStorage.getItem(LAST_SYNC_STORAGE_KEY);
  },

  setLastSyncTime: (iso: string): void => {
    localStorage.setItem(LAST_SYNC_STORAGE_KEY, iso);
    IndexedDbService.updateSyncStatus({ lastSyncedAt: iso });
  },

  /**
   * Memberitahu seluruh komponen React yang sedang terbuka bahwa data di localStorage
   * telah diperbarui dari Cloud / Supabase sehingga UI langsung merender data terbaru.
   */
  notifyCloudDataUpdated: (changedKeys: number): void => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('lms-cloud-synced', {
          detail: { changedKeys, timestamp: new Date().toISOString() }
        })
      );
    }
  },

  /**
   * Menyimpan pasangan key-value JSON ke IndexedDB Cache terlebih dahulu (Offline-First),
   * kemudian menyinkronkan ke Server Cloud Store (/api/cloud-store) DAN tabel `lms_cloud_store`
   * di Supabase jika internet tersedia.
   */
  pushKeyToCloud: async (key: string, payload: any): Promise<boolean> => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const cfg = SupabaseService.getConfig();

    if (!isOnline || !cfg.enabled) {
      await IndexedDbService.enqueueOutbox(
        key,
        payload,
        !isOnline ? 'Koneksi internet terputus (Offline)' : 'Sinkronisasi Cloud dinonaktifkan'
      );
      return false;
    }

    await IndexedDbService.putCache(key, payload, false);

    try {
      IndexedDbService.updateSyncStatus({
        isOnline: true,
        syncState: 'syncing',
        lastMessage: `Menyinkronkan ${key.replace('lms_pai_', '')} ke Cloud & Supabase...`
      });

      const nowIso = new Date().toISOString();
      const row: CloudRow = {
        store_key: key,
        store_data: payload,
        updated_at: nowIso
      };

      // 1. Kirim ke Server Cloud Store (/api/cloud-store/upsert) untuk sinkronisasi lintas browser/perangkat
      const serverOk = await pushRowsToServerStore([row]);

      // 2. Kirim juga ke tabel `lms_cloud_store` di Supabase jika terkonfigurasi
      let supaOk = false;
      try {
        const client = SupabaseService.getClient();
        if (client) {
          const { error } = await client
            .from('lms_cloud_store')
            .upsert(row, { onConflict: 'store_key' });
          supaOk = !error;
        }
      } catch {
        supaOk = false;
      }

      if (serverOk || supaOk) {
        SupabaseService.setLastSyncTime(nowIso);
        await IndexedDbService.removeOutboxItem(key);
        await IndexedDbService.putCache(key, payload, true);
        IndexedDbService.updateSyncStatus({
          isOnline: true,
          syncState: 'synced',
          lastSyncedAt: nowIso,
          lastMessage: 'Data Tersinkronisasi Lintas Browser/Perangkat (Cloud)'
        });
        return true;
      }

      await IndexedDbService.enqueueOutbox(
        key,
        payload,
        'Menunggu koneksi ke Server Cloud'
      );
      return false;
    } catch (err: any) {
      await IndexedDbService.enqueueOutbox(
        key,
        payload,
        err?.message || 'Gagal menghubungi server Cloud'
      );
      IndexedDbService.updateSyncStatus({
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
        syncState: 'offline_cached',
        lastMessage: 'Koneksi terputus — Perubahan diamankan di antrean IndexedDB'
      });
      return false;
    }
  },

  /**
   * Memproses seluruh antrean perubahan di IndexedDB Outbox dan mengirimkannya ke Server Cloud & Supabase
   */
  flushOutboxToCloud: async (): Promise<{
    flushedCount: number;
    remainingCount: number;
    message: string;
  }> => {
    if (isFlushingOutbox) {
      const pending = await IndexedDbService.getOutboxItems();
      return {
        flushedCount: 0,
        remainingCount: pending.length,
        message: 'Sinkronisasi antrean sedang berlangsung...'
      };
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      const pending = await IndexedDbService.getOutboxItems();
      IndexedDbService.updateSyncStatus({
        isOnline: false,
        syncState: 'offline_cached',
        pendingCount: pending.length,
        lastMessage: `Offline — ${pending.length} item menunggu koneksi internet di IndexedDB`
      });
      return {
        flushedCount: 0,
        remainingCount: pending.length,
        message: 'Perangkat masih offline. Data aman di IndexedDB.'
      };
    }

    const outboxItems = await IndexedDbService.getOutboxItems();
    if (outboxItems.length === 0) {
      await IndexedDbService.refreshCounts();
      return {
        flushedCount: 0,
        remainingCount: 0,
        message: 'Tidak ada antrean tertunda di IndexedDB.'
      };
    }

    isFlushingOutbox = true;
    IndexedDbService.updateSyncStatus({
      isOnline: true,
      syncState: 'syncing',
      pendingCount: outboxItems.length,
      lastMessage: `Menyinkronkan ${outboxItems.length} antrean ke Cloud & Supabase...`
    });

    let flushedCount = 0;
    const nowIso = new Date().toISOString();

    try {
      const rows: CloudRow[] = outboxItems.map(item => ({
        store_key: item.key,
        store_data: item.payload,
        updated_at: item.queuedAt || nowIso
      }));

      const serverOk = await pushRowsToServerStore(rows);

      let supaOk = false;
      try {
        const client = SupabaseService.getClient();
        if (client) {
          const { error } = await client
            .from('lms_cloud_store')
            .upsert(rows, { onConflict: 'store_key' });
          supaOk = !error;
        }
      } catch {
        supaOk = false;
      }

      if (serverOk || supaOk) {
        for (const item of outboxItems) {
          await IndexedDbService.removeOutboxItem(item.key);
          flushedCount++;
        }

        SupabaseService.setLastSyncTime(nowIso);
        await IndexedDbService.refreshCounts();
        IndexedDbService.updateSyncStatus({
          isOnline: true,
          syncState: 'synced',
          pendingCount: 0,
          lastSyncedAt: nowIso,
          lastMessage: `Berhasil menyinkronkan ${flushedCount} antrean ke Cloud!`
        });

        return {
          flushedCount,
          remainingCount: 0,
          message: `Berhasil menyinkronkan ${flushedCount} perubahan ke Cloud.`
        };
      }

      const remaining = await IndexedDbService.getOutboxItems();
      return {
        flushedCount: 0,
        remainingCount: remaining.length,
        message: 'Sebagian data masih tersimpan di antrean IndexedDB.'
      };
    } catch {
      const remaining = await IndexedDbService.getOutboxItems();
      IndexedDbService.updateSyncStatus({
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
        syncState: 'pending_outbox',
        pendingCount: remaining.length,
        lastMessage: `${remaining.length} antrean IndexedDB menunggu koneksi stabil`
      });
      return {
        flushedCount,
        remainingCount: remaining.length,
        message: 'Sebagian data masih tersimpan di antrean IndexedDB.'
      };
    } finally {
      isFlushingOutbox = false;
    }
  },

  /**
   * Mengambil seluruh data terbaru dari Server Cloud Store (/api/cloud-store) DAN
   * tabel `lms_cloud_store` di Supabase, menggabungkannya berdasarkan `updated_at` terbaru,
   * lalu memperbarui localStorage, IndexedDB, serta me-refresh komponen React yang aktif.
   */
  pullAllFromCloud: async (): Promise<{
    syncedKeys: number;
    changedKeys: number;
    status: 'connected' | 'local_ready';
    message: string;
  }> => {
    const cfg = SupabaseService.getConfig();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (!cfg.enabled || !isOnline) {
      await IndexedDbService.refreshCounts();
      return {
        syncedKeys: 0,
        changedKeys: 0,
        status: 'local_ready',
        message: !isOnline
          ? 'Mode Offline Aktif — Memuat data dari cache lokal IndexedDB.'
          : 'Sinkronisasi Cloud dinonaktifkan.'
      };
    }

    // 1. Kirim terlebih dahulu antrean perubahan offline (Outbox)
    await SupabaseService.flushOutboxToCloud();

    try {
      IndexedDbService.updateSyncStatus({
        isOnline: true,
        syncState: 'syncing',
        lastMessage: 'Memeriksa pembaruan data lintas perangkat dari Cloud & Supabase...'
      });

      // 2. Ambil data dari Server Cloud Store DAN dari Supabase secara paralel
      const [serverRows, supaResult] = await Promise.all([
        fetchRowsFromServerStore(),
        (async (): Promise<CloudRow[]> => {
          try {
            const client = SupabaseService.getClient();
            if (client) {
              const { data, error } = await client
                .from('lms_cloud_store')
                .select('store_key, store_data, updated_at');
              if (!error && Array.isArray(data)) {
                return data as CloudRow[];
              }
            }
          } catch {
            // ignore
          }
          return [];
        })()
      ]);

      // 3. Gabungkan baris dari kedua sumber berdasarkan `updated_at` paling mutakhir
      const mergedMap = new Map<string, CloudRow>();

      for (const row of supaResult) {
        if (row && row.store_key && row.store_data !== undefined) {
          mergedMap.set(row.store_key, row);
        }
      }

      for (const row of serverRows) {
        if (row && row.store_key && row.store_data !== undefined) {
          const existing = mergedMap.get(row.store_key);
          if (!existing) {
            mergedMap.set(row.store_key, row);
          } else {
            const tServer = new Date(row.updated_at || 0).getTime();
            const tSupa = new Date(existing.updated_at || 0).getTime();
            if (tServer >= tSupa) {
              mergedMap.set(row.store_key, row);
            }
          }
        }
      }

      const mergedRows = Array.from(mergedMap.values());

      // Jika di Supabase ada data yang belum ada di Server Store, salin ke Server Store
      if (supaResult.length > 0 && serverRows.length === 0) {
        await pushRowsToServerStore(mergedRows);
      }

      const nowIso = new Date().toISOString();
      SupabaseService.setLastSyncTime(nowIso);

      // Ambil daftar key yang masih ada di outbox lokal agar tidak tertimpa
      const pendingOutbox = await IndexedDbService.getOutboxItems();
      const pendingKeys = new Set(pendingOutbox.map(item => item.key));

      let count = 0;
      let changedCount = 0;

      if (mergedRows.length > 0) {
        const cloudResetFlag = mergedMap.get('lms_pai_is_fresh_empty');
        if (cloudResetFlag) {
          const prevFresh = localStorage.getItem('lms_pai_is_fresh_empty');
          const nextFresh = cloudResetFlag.store_data === true ? 'true' : 'false';
          if (nextFresh === 'true') {
            if (prevFresh !== 'true') {
              localStorage.setItem('lms_pai_is_fresh_empty', 'true');
              changedCount++;
            }
          } else if (prevFresh === 'true') {
            localStorage.removeItem('lms_pai_is_fresh_empty');
            changedCount++;
          }
        }

        for (const row of mergedRows) {
          if (row.store_key === 'lms_pai_is_fresh_empty') {
            continue;
          }
          if (row.store_key && row.store_data !== undefined && !pendingKeys.has(row.store_key)) {
            const nextJson = JSON.stringify(row.store_data);
            const currentJson = localStorage.getItem(row.store_key);
            if (currentJson !== nextJson) {
              localStorage.setItem(row.store_key, nextJson);
              changedCount++;
            }
            await IndexedDbService.putCache(row.store_key, row.store_data, true);
            count++;
          }
        }
      }

      await IndexedDbService.refreshCounts();
      IndexedDbService.updateSyncStatus({
        isOnline: true,
        syncState: 'synced',
        lastSyncedAt: nowIso,
        lastMessage:
          count > 0
            ? `Tersinkronisasi (${count} koleksi data lintas perangkat/browser)`
            : 'Terhubung ke Cloud Database'
      });

      if (changedCount > 0) {
        SupabaseService.notifyCloudDataUpdated(changedCount);
      }

      return {
        syncedKeys: count,
        changedKeys: changedCount,
        status: 'connected',
        message:
          count > 0
            ? `Berhasil menyinkronkan ${count} koleksi data dari Cloud ke perangkat ini!`
            : 'Terhubung ke Cloud. Seluruh data telah mutakhir.'
      };
    } catch {
      await IndexedDbService.refreshCounts();
      return {
        syncedKeys: 0,
        changedKeys: 0,
        status: 'local_ready',
        message: 'Mode Offline-First IndexedDB Aktif.'
      };
    }
  },

  /**
   * Mengunggah seluruh state lokal (localStorage & IndexedDB) ke Server Cloud Store DAN Supabase
   * sehingga ketika dibuka di browser atau perangkat berbeda, datanya 100% identik.
   */
  pushAllLocalToCloud: async (
    keys: string[]
  ): Promise<{ uploadedCount: number; message: string }> => {
    const cfg = SupabaseService.getConfig();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const nowIso = new Date().toISOString();
    const isFreshEmpty = localStorage.getItem('lms_pai_is_fresh_empty') === 'true';
    const rows: CloudRow[] = [
      {
        store_key: 'lms_pai_is_fresh_empty',
        store_data: isFreshEmpty,
        updated_at: nowIso
      }
    ];

    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          rows.push({
            store_key: k,
            store_data: parsed,
            updated_at: nowIso
          });
          await IndexedDbService.putCache(k, parsed, isOnline);
        }
      } catch {
        // ignore
      }
    }

    if (!isOnline) {
      for (const r of rows) {
        await IndexedDbService.enqueueOutbox(
          r.store_key,
          r.store_data,
          'Disimpan saat offline — menunggu koneksi internet'
        );
      }
      return {
        uploadedCount: rows.length,
        message: `Perangkat sedang Offline. ${rows.length} koleksi data telah diamankan di IndexedDB dan akan disinkronkan otomatis saat internet kembali menyala.`
      };
    }

    if (!cfg.enabled) {
      return { uploadedCount: 0, message: 'Sinkronisasi Cloud sedang nonaktif.' };
    }

    try {
      IndexedDbService.updateSyncStatus({
        isOnline: true,
        syncState: 'syncing',
        lastMessage: `Mengunggah ${rows.length} koleksi ke Cloud & Supabase...`
      });

      // 1. Unggah ke Server Cloud Store (/api/cloud-store/upsert)
      const serverOk = await pushRowsToServerStore(rows);

      // 2. Unggah ke tabel `lms_cloud_store` di Supabase
      let supaOk = false;
      try {
        const client = SupabaseService.getClient();
        if (client && rows.length > 0) {
          const { error } = await client
            .from('lms_cloud_store')
            .upsert(rows, { onConflict: 'store_key' });
          supaOk = !error;
        }
      } catch {
        supaOk = false;
      }

      if (serverOk || supaOk) {
        for (const r of rows) {
          await IndexedDbService.removeOutboxItem(r.store_key);
        }
        SupabaseService.setLastSyncTime(nowIso);
        await IndexedDbService.refreshCounts();
        IndexedDbService.updateSyncStatus({
          isOnline: true,
          syncState: 'synced',
          pendingCount: 0,
          lastSyncedAt: nowIso,
          lastMessage: 'Tersinkronisasi Lintas Browser & Perangkat (Cloud)'
        });

        return {
          uploadedCount: rows.length,
          message: `Berhasil menyinkronkan ${rows.length} koleksi data ke Cloud! Seluruh browser/perangkat lain kini menampilkan data yang sama.`
        };
      }

      throw new Error('Gagal mengunggah ke Cloud');
    } catch {
      for (const r of rows) {
        await IndexedDbService.enqueueOutbox(
          r.store_key,
          r.store_data,
          'Gagal terhubung ke Cloud — masuk antrean IndexedDB'
        );
      }
      return {
        uploadedCount: rows.length,
        message: `Data diamankan pada cache IndexedDB (${rows.length} koleksi) dan akan disinkronkan otomatis saat jaringan stabil.`
      };
    }
  },

  /**
   * Menghapus & mengosongkan seluruh data di Server Cloud Store, tabel `lms_cloud_store` Supabase,
   * serta IndexedDB sehingga seluruh browser/perangkat benar-benar fresh/kosong (0 data).
   */
  resetAllCloudData: async (
    emptyMap: Record<string, any>
  ): Promise<{ success: boolean; message: string }> => {
    const cfg = SupabaseService.getConfig();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const nowIso = new Date().toISOString();

    await IndexedDbService.clearAll();

    const keys = Object.keys(emptyMap);
    for (const k of keys) {
      await IndexedDbService.putCache(k, emptyMap[k], isOnline);
    }

    if (!isOnline || !cfg.enabled) {
      for (const k of keys) {
        await IndexedDbService.enqueueOutbox(
          k,
          emptyMap[k],
          'Reset data kosong saat offline — akan dikosongkan di Cloud saat online'
        );
      }
      await IndexedDbService.refreshCounts();
      return {
        success: true,
        message:
          'Data lokal & IndexedDB berhasil dikosongkan (Fresh)! Perubahan akan disinkronkan ke Cloud saat online.'
      };
    }

    try {
      IndexedDbService.updateSyncStatus({
        isOnline: true,
        syncState: 'syncing',
        lastMessage: 'Mengosongkan seluruh data di Cloud, Supabase & IndexedDB...'
      });

      // 1. Reset di Server Cloud Store (/api/cloud-store/reset)
      await resetServerStore(emptyMap, true);

      // 2. Reset di tabel `lms_cloud_store` Supabase jika terkonfigurasi
      try {
        const client = SupabaseService.getClient();
        if (client) {
          await client.from('lms_cloud_store').delete().neq('store_key', '__reset_all__');

          const emptyRows: CloudRow[] = keys.map(k => ({
            store_key: k,
            store_data: emptyMap[k],
            updated_at: nowIso
          }));
          if (emptyRows.length > 0) {
            await client.from('lms_cloud_store').upsert(emptyRows, { onConflict: 'store_key' });
          }
        }
      } catch {
        // ignore if external SQL table not initialized
      }

      SupabaseService.setLastSyncTime(nowIso);
      await IndexedDbService.refreshCounts();
      IndexedDbService.updateSyncStatus({
        isOnline: true,
        syncState: 'synced',
        pendingCount: 0,
        lastSyncedAt: nowIso,
        lastMessage: 'Database Cloud & IndexedDB Berhasil Dikosongkan (Fresh)'
      });

      SupabaseService.notifyCloudDataUpdated(keys.length);

      return {
        success: true,
        message:
          'Seluruh data di Cloud, IndexedDB, dan penyimpanan lokal berhasil direset menjadi kosong/fresh di semua perangkat!'
      };
    } catch {
      for (const k of keys) {
        await IndexedDbService.enqueueOutbox(
          k,
          emptyMap[k],
          'Menunggu koneksi untuk mengosongkan tabel Cloud'
        );
      }
      await IndexedDbService.refreshCounts();
      return {
        success: true,
        message:
          'Data di IndexedDB & penyimpanan lokal telah dikosongkan (Fresh) dan dijadwalkan ke Cloud.'
      };
    }
  },

  getSqlSetupScript: (): string => {
    return `-- ============================================================================
-- SKRIP 1: TABEL UTAMA SINKRONISASI CLOUD LINTAS PERANGKAT (WAJIB DIJALANKAN)
-- Jalankan di SQL Editor Supabase: https://supabase.com/dashboard/project/ejqtnvqrgnksczmaoxof/sql/new
-- ============================================================================

-- 1. Buat tabel penyimpanan utama Key-Value JSONB untuk seluruh modul LMS PAI & E-Kinerja
CREATE TABLE IF NOT EXISTS public.lms_cloud_store (
  store_key TEXT PRIMARY KEY,
  store_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Buat indeks waktu update untuk mempercepat sinkronisasi lintas browser/perangkat
CREATE INDEX IF NOT EXISTS idx_lms_cloud_store_updated_at
  ON public.lms_cloud_store (updated_at DESC);

-- 3. Aktifkan Row Level Security (RLS) dan berikan akses baca/tulis penuh untuk Anon Key aplikasi
ALTER TABLE public.lms_cloud_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public anon read-write LMS PAI" ON public.lms_cloud_store;

CREATE POLICY "Allow public anon read-write LMS PAI"
  ON public.lms_cloud_store
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 4. Berikan hak akses tabel ke role anon & authenticated
GRANT ALL ON TABLE public.lms_cloud_store TO anon, authenticated, service_role;

-- 5. Otomatis perbarui kolom updated_at setiap ada perubahan data
CREATE OR REPLACE FUNCTION public.update_lms_cloud_store_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lms_cloud_store_updated_at ON public.lms_cloud_store;

CREATE TRIGGER trg_lms_cloud_store_updated_at
BEFORE UPDATE ON public.lms_cloud_store
FOR EACH ROW
EXECUTE FUNCTION public.update_lms_cloud_store_timestamp();`;
  },

  getRelationalTablesSqlScript: (): string => {
    return `-- ============================================================================
-- SKRIP 2: SKEMA LENGKAP TABEL RELASIONAL LMS PAI & E-KINERJA HARIAN
-- (Opsional jika ingin memiliki tabel SQL terpisah selain lms_cloud_store)
-- ============================================================================

-- 1. Pastikan tabel utama sinkronisasi aplikasi tersedia
CREATE TABLE IF NOT EXISTS public.lms_cloud_store (
  store_key TEXT PRIMARY KEY,
  store_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lms_cloud_store ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public anon read-write LMS PAI" ON public.lms_cloud_store;
CREATE POLICY "Allow public anon read-write LMS PAI"
  ON public.lms_cloud_store FOR ALL TO anon, authenticated, service_role
  USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.lms_cloud_store TO anon, authenticated, service_role;

-- 2. Tabel Rombongan Belajar (Kelas)
CREATE TABLE IF NOT EXISTS public.lms_classes (
  id TEXT PRIMARY KEY,
  class_name TEXT NOT NULL,
  homeroom TEXT DEFAULT '',
  academic_year TEXT DEFAULT '2026/2027',
  student_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Data Siswa & Akun Login
CREATE TABLE IF NOT EXISTS public.lms_students (
  id TEXT PRIMARY KEY,
  nis TEXT NOT NULL,
  full_name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  class_name TEXT DEFAULT '',
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#10b981',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Rekap Nilai Evaluasi Siswa
CREATE TABLE IF NOT EXISTS public.lms_scores (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  attempt_id TEXT DEFAULT '',
  raw_score NUMERIC DEFAULT 0,
  max_score NUMERIC DEFAULT 100,
  percentage NUMERIC DEFAULT 0,
  graded BOOLEAN DEFAULT true,
  quiz_title TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Presensi / Absensi Harian Siswa
CREATE TABLE IF NOT EXISTS public.lms_attendance (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Jurnal Mengajar Guru PAI
CREATE TABLE IF NOT EXISTS public.lms_teaching_journals (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  class_id TEXT NOT NULL,
  class_name TEXT DEFAULT '',
  topic TEXT NOT NULL,
  learning_objective TEXT DEFAULT '',
  reflection TEXT DEFAULT '',
  absent_students JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Tuntas',
  teacher_name TEXT DEFAULT '',
  school_name TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Periode E-Kinerja Harian & Nota Dinas
CREATE TABLE IF NOT EXISTS public.lms_e_kinerja_periods (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  year TEXT NOT NULL,
  rkh_list JSONB DEFAULT '[]'::jsonb,
  rencana_aksi_list JSONB DEFAULT '[]'::jsonb,
  tindak_lanjut_list JSONB DEFAULT '[]'::jsonb,
  nota_dinas JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel Kegiatan Harian E-Kinerja (Multi-Foto & Lampiran Bukti Fisik)
CREATE TABLE IF NOT EXISTS public.lms_e_kinerja_activities (
  id TEXT PRIMARY KEY,
  period_id TEXT NOT NULL,
  date TEXT NOT NULL,
  rkh_id TEXT DEFAULT '',
  rkh_text TEXT DEFAULT '',
  rencana_aksi_id TEXT DEFAULT '',
  rencana_aksi_text TEXT DEFAULT '',
  tindak_lanjut_text TEXT DEFAULT '',
  tindak_lanjut_list JSONB DEFAULT '[]'::jsonb,
  output_text TEXT DEFAULT '',
  photos JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan RLS & Izin Akses untuk seluruh tabel
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'lms_classes', 'lms_students', 'lms_scores',
    'lms_attendance', 'lms_teaching_journals',
    'lms_e_kinerja_periods', 'lms_e_kinerja_activities'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public access %I" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "Allow public access %I" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);', t, t);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated, service_role;', t);
  END LOOP;
END $$;`;
  },

  getCleanDemoDataSqlScript: (): string => {
    return `-- ============================================================================
-- SKRIP 3: BERSIHKAN DATA NILAI / DEMO DI SUPABASE (PERTAHANKAN KELAS & SISWA ASLI)
-- Jalankan di SQL Editor Supabase jika ingin mereset nilai/kuis/jurnal demo menjadi kosong (0)
-- ============================================================================

-- Kosongkan koleksi nilai, percobaan kuis, dan rekomendasi remedial di lms_cloud_store
INSERT INTO public.lms_cloud_store (store_key, store_data, updated_at)
VALUES
  ('lms_scores', '[]'::jsonb, NOW()),
  ('lms_quiz_attempts', '[]'::jsonb, NOW()),
  ('lms_remedial_plans', '[]'::jsonb, NOW())
ON CONFLICT (store_key)
DO UPDATE SET
  store_data = EXCLUDED.store_data,
  updated_at = NOW();

-- (Opsional) Jika ingin mengosongkan SELURUH data di Supabase hingga benar-benar kosong (0 data):
-- TRUNCATE TABLE public.lms_cloud_store;`;
  },

  generateInsertCurrentDataSqlScript: (keys: string[]): string => {
    const nowIso = new Date().toISOString();
    const valueLines: string[] = [];

    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw !== null) {
          const escapedJson = raw.replace(/'/g, "''");
          valueLines.push(`  ('${k}', '${escapedJson}'::jsonb, '${nowIso}')`);
        }
      } catch {
        // ignore
      }
    }

    if (valueLines.length === 0) {
      return `-- Belum ada data lokal untuk diekspor ke perintah INSERT SQL.\n${SupabaseService.getSqlSetupScript()}`;
    }

    return `-- ============================================================================
-- SKRIP 4: EKSPOR DATA LOKAL SAAT INI KE PERINTAH INSERT/UPSERT SQL SUPABASE
-- Dihasilkan otomatis pada: ${new Date().toLocaleString('id-ID')}
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lms_cloud_store (
  store_key TEXT PRIMARY KEY,
  store_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.lms_cloud_store (store_key, store_data, updated_at)
VALUES
${valueLines.join(',\n')}
ON CONFLICT (store_key)
DO UPDATE SET
  store_data = EXCLUDED.store_data,
  updated_at = EXCLUDED.updated_at;`;
  },

  inspectCloudStoreStatus: async (): Promise<{
    supabaseConnected: boolean;
    supabaseTableReady: boolean;
    supabaseError?: string;
    supabaseRowCount: number;
    serverStoreRowCount: number;
    rowsSummary: Array<{ key: string; itemCount: string; updatedAt: string; source: string }>;
  }> => {
    const serverRows = await fetchRowsFromServerStore();
    let supabaseConnected = false;
    let supabaseTableReady = false;
    let supabaseError: string | undefined;
    let supaRows: CloudRow[] = [];

    try {
      const client = SupabaseService.getClient();
      if (!client) {
        supabaseConnected = false;
        supabaseTableReady = false;
        supabaseError = 'URL atau Anon Key Supabase belum diisi. Masukkan database Supabase baru di formulir pengaturan.';
      } else {
        const { data, error } = await client
          .from('lms_cloud_store')
          .select('store_key, store_data, updated_at')
          .order('updated_at', { ascending: false });

        if (error) {
          supabaseConnected = true;
          supabaseTableReady = false;
          supabaseError = error.message;
        } else {
          supabaseConnected = true;
          supabaseTableReady = true;
          supaRows = Array.isArray(data) ? (data as CloudRow[]) : [];
        }
      }
    } catch (e: any) {
      supabaseConnected = false;
      supabaseTableReady = false;
      supabaseError = e?.message || 'Tidak dapat terhubung ke endpoint Supabase';
    }

    const mergedMap = new Map<string, { row: CloudRow; source: string }>();
    for (const r of serverRows) {
      if (r && r.store_key) {
        mergedMap.set(r.store_key, { row: r, source: 'Server Cloud' });
      }
    }
    for (const r of supaRows) {
      if (r && r.store_key) {
        const existing = mergedMap.get(r.store_key);
        if (!existing) {
          mergedMap.set(r.store_key, { row: r, source: 'Supabase SQL' });
        } else {
          mergedMap.set(r.store_key, {
            row:
              new Date(r.updated_at || 0).getTime() >=
              new Date(existing.row.updated_at || 0).getTime()
                ? r
                : existing.row,
            source: 'Supabase SQL + Server Cloud'
          });
        }
      }
    }

    const rowsSummary = Array.from(mergedMap.values()).map(({ row, source }) => {
      let itemCount = 'Objek';
      if (Array.isArray(row.store_data)) {
        itemCount = `${row.store_data.length} data`;
      } else if (typeof row.store_data === 'boolean') {
        itemCount = String(row.store_data);
      } else if (row.store_data && typeof row.store_data === 'object') {
        itemCount = `${Object.keys(row.store_data).length} properti`;
      }
      return {
        key: row.store_key,
        itemCount,
        updatedAt: row.updated_at,
        source
      };
    });

    return {
      supabaseConnected,
      supabaseTableReady,
      supabaseError,
      supabaseRowCount: supaRows.length,
      serverStoreRowCount: serverRows.length,
      rowsSummary
    };
  }
};

