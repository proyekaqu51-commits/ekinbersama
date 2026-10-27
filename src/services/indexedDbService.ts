export interface OfflineSyncStatus {
  isOnline: boolean;
  syncState: 'synced' | 'syncing' | 'offline_cached' | 'pending_outbox' | 'error';
  pendingCount: number;
  cachedKeysCount: number;
  lastSyncedAt: string | null;
  lastMessage: string;
}

export interface OutboxItem {
  key: string;
  payload: any;
  queuedAt: string;
  reason?: string;
}

const DB_NAME = 'lms_pai_offline_db';
const DB_VERSION = 1;
const STORE_CACHE = 'kv_cache';
const STORE_OUTBOX = 'sync_outbox';

let currentStatus: OfflineSyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncState: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline_cached' : 'synced',
  pendingCount: 0,
  cachedKeysCount: 0,
  lastSyncedAt: typeof localStorage !== 'undefined' ? localStorage.getItem('lms_supabase_last_sync') : null,
  lastMessage: 'Penyimpanan Offline-First IndexedDB siap digunakan.'
};

const listeners = new Set<(status: OfflineSyncStatus) => void>();

function notifyListeners() {
  const snapshot = { ...currentStatus };
  listeners.forEach(cb => {
    try {
      cb(snapshot);
    } catch {
      // ignore listener error
    }
  });
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise(resolve => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_CACHE)) {
          db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          db.createObjectStore(STORE_OUTBOX, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export const IndexedDbService = {
  getSyncStatus: (): OfflineSyncStatus => {
    return { ...currentStatus };
  },

  updateSyncStatus: (partial: Partial<OfflineSyncStatus>): void => {
    currentStatus = {
      ...currentStatus,
      ...partial
    };
    notifyListeners();
  },

  subscribeSyncStatus: (callback: (status: OfflineSyncStatus) => void): (() => void) => {
    listeners.add(callback);
    callback({ ...currentStatus });
    return () => {
      listeners.delete(callback);
    };
  },

  putCache: async (key: string, payload: any, synced = true): Promise<void> => {
    const db = await openDb();
    if (!db) return;
    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE_CACHE, 'readwrite');
        const store = tx.objectStore(STORE_CACHE);
        store.put({
          key,
          payload,
          synced,
          updatedAt: new Date().toISOString()
        });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          resolve();
        };
      } catch {
        db.close();
        resolve();
      }
    });
  },

  getCacheItem: async (key: string): Promise<any | undefined> => {
    const db = await openDb();
    if (!db) return undefined;
    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE_CACHE, 'readonly');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.get(key);
        req.onsuccess = () => {
          db.close();
          resolve(req.result ? req.result.payload : undefined);
        };
        req.onerror = () => {
          db.close();
          resolve(undefined);
        };
      } catch {
        db.close();
        resolve(undefined);
      }
    });
  },

  enqueueOutbox: async (key: string, payload: any, reason?: string): Promise<void> => {
    await IndexedDbService.putCache(key, payload, false);
    const db = await openDb();
    if (!db) return;
    await new Promise<void>(resolve => {
      try {
        const tx = db.transaction(STORE_OUTBOX, 'readwrite');
        const store = tx.objectStore(STORE_OUTBOX);
        store.put({
          key,
          payload,
          queuedAt: new Date().toISOString(),
          reason: reason || 'Menunggu sinkronisasi Cloud'
        });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          resolve();
        };
      } catch {
        db.close();
        resolve();
      }
    });
    await IndexedDbService.refreshCounts();
    if (reason) {
      IndexedDbService.updateSyncStatus({ lastMessage: reason });
    }
  },

  getOutboxItems: async (): Promise<OutboxItem[]> => {
    const db = await openDb();
    if (!db) return [];
    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE_OUTBOX, 'readonly');
        const store = tx.objectStore(STORE_OUTBOX);
        const req = store.getAll();
        req.onsuccess = () => {
          db.close();
          resolve(Array.isArray(req.result) ? req.result : []);
        };
        req.onerror = () => {
          db.close();
          resolve([]);
        };
      } catch {
        db.close();
        resolve([]);
      }
    });
  },

  removeOutboxItem: async (key: string): Promise<void> => {
    const db = await openDb();
    if (!db) return;
    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE_OUTBOX, 'readwrite');
        const store = tx.objectStore(STORE_OUTBOX);
        store.delete(key);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          resolve();
        };
      } catch {
        db.close();
        resolve();
      }
    });
  },

  refreshCounts: async (): Promise<{ cachedKeysCount: number; pendingCount: number }> => {
    const db = await openDb();
    if (!db) {
      return { cachedKeysCount: 0, pendingCount: 0 };
    }
    return new Promise(resolve => {
      try {
        const tx = db.transaction([STORE_CACHE, STORE_OUTBOX], 'readonly');
        const cacheReq = tx.objectStore(STORE_CACHE).count();
        const outboxReq = tx.objectStore(STORE_OUTBOX).count();
        let cachedKeysCount = 0;
        let pendingCount = 0;

        cacheReq.onsuccess = () => {
          cachedKeysCount = cacheReq.result || 0;
        };
        outboxReq.onsuccess = () => {
          pendingCount = outboxReq.result || 0;
        };
        tx.oncomplete = () => {
          db.close();
          IndexedDbService.updateSyncStatus({
            cachedKeysCount,
            pendingCount,
            isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
          });
          resolve({ cachedKeysCount, pendingCount });
        };
        tx.onerror = () => {
          db.close();
          resolve({ cachedKeysCount: 0, pendingCount: 0 });
        };
      } catch {
        db.close();
        resolve({ cachedKeysCount: 0, pendingCount: 0 });
      }
    });
  },

  clearAll: async (): Promise<void> => {
    const db = await openDb();
    if (!db) return;
    await new Promise<void>(resolve => {
      try {
        const tx = db.transaction([STORE_CACHE, STORE_OUTBOX], 'readwrite');
        tx.objectStore(STORE_CACHE).clear();
        tx.objectStore(STORE_OUTBOX).clear();
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          resolve();
        };
      } catch {
        db.close();
        resolve();
      }
    });
    await IndexedDbService.refreshCounts();
  },

  hydrateAndMirrorLocalStorage: async (
    keys: string[]
  ): Promise<{ restoredFromIdb: number; mirroredToIdb: number }> => {
    let restoredFromIdb = 0;
    let mirroredToIdb = 0;

    for (const key of keys) {
      try {
        const rawLocal = localStorage.getItem(key);
        if (rawLocal === null) {
          const cached = await IndexedDbService.getCacheItem(key);
          if (cached !== undefined) {
            localStorage.setItem(key, JSON.stringify(cached));
            restoredFromIdb++;
          }
        } else {
          const parsed = JSON.parse(rawLocal);
          await IndexedDbService.putCache(key, parsed, true);
          mirroredToIdb++;
        }
      } catch {
        // ignore individual key error
      }
    }

    await IndexedDbService.refreshCounts();
    return { restoredFromIdb, mirroredToIdb };
  }
};
