/**
 * IndexedDB 轻量封装 — 替代 localStorage 存储 base64 图片等大数据
 *
 * localStorage 上限 5-10MB，IndexedDB 通常可存 50MB-1GB+（Chrome 最高 60% 磁盘空间）
 * API 设计为 async get/set，使用 Promise 而非回调
 */

const DB_NAME = 'pet-learning-system';
const DB_VERSION = 1;

/** 已注册的 object store 名称 */
export const STORES = {
  QUESTION_BANKS: 'question-banks',
  CUSTOM_PETS: 'custom-pets',
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

/** 打开/创建数据库（单例，失败后可重试） */
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      // 为每个 store 创建（如果不存在）
      for (const name of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name); // key-path 由调用方指定
        }
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      // 失败时重置 promise，允许下次重试（如隐私模式退出后）
      dbPromise = null;
      reject(req.error);
    };
  });

  return dbPromise;
}

/**
 * 异步读取一个 store 的全部数据
 * 约定：每个 store 只存一条记录，key = 'data'
 */
export async function idbGet<T>(store: StoreName): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get('data');
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    console.error(`[idbGet] 读取 ${store} 失败`);
    return null;
  }
}

/**
 * 异步写入一个 store 的全部数据
 * 约定：每个 store 只存一条记录，key = 'data'
 */
export async function idbSet<T>(store: StoreName, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, 'data');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * 清空一个 store
 */
export async function idbClear(store: StoreName): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * 尝试从 localStorage 迁移数据到 IndexedDB（仅执行一次）
 * 返回迁移到的数据（如果有），否则返回 null
 */
export async function migrateFromLocalStorage<T>(
  store: StoreName,
  localStorageKey: string,
): Promise<T | null> {
  try {
    const raw = localStorage.getItem(localStorageKey);
    if (!raw) return null;

    const data = JSON.parse(raw) as T;

    // 写入 IndexedDB
    await idbSet(store, data);

    // 写入成功后清除 localStorage（释放空间）
    localStorage.removeItem(localStorageKey);
    console.log(`[migrate] ${localStorageKey} → ${store} 迁移完成`);
    return data;
  } catch {
    console.warn(`[migrate] ${localStorageKey} 迁移失败，保留 localStorage 数据`);
    return null;
  }
}
