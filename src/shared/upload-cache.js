(function initUploadCache() {
  if (window.uploadCache) return;

  const SUPPORTS_INDEXED_DB = typeof indexedDB !== 'undefined';
  const DB_NAME = 'wizardUploads';
  const STORE_NAME = 'uploads';
  let dbPromise = null;

  function openDb() {
    if (!SUPPORTS_INDEXED_DB) {
      return Promise.reject(new Error('IndexedDB is not supported'));
    }

    if (dbPromise) {
      return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => reject(request.error || new Error('Failed to open upload cache'));
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'slotId' });
        }
      };
      request.onsuccess = () => resolve(request.result);
    });

    return dbPromise;
  }

  function runTransaction(mode, handler) {
    return openDb().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, mode);
          const store = tx.objectStore(STORE_NAME);
          const request = handler(store);
          tx.oncomplete = () => resolve(request?.result);
          tx.onerror = () => reject(tx.error);
        })
    );
  }

  async function saveUpload(slotId, payload = {}) {
    if (!SUPPORTS_INDEXED_DB || !slotId || !payload) return;
    try {
      await runTransaction('readwrite', (store) => store.put({ slotId, ...payload, updatedAt: Date.now() }));
    } catch (error) {
      console.warn('[UploadCache] Falha ao salvar upload', error);
    }
  }

  async function removeUpload(slotId) {
    if (!SUPPORTS_INDEXED_DB || !slotId) return;
    try {
      await runTransaction('readwrite', (store) => store.delete(slotId));
    } catch (error) {
      console.warn('[UploadCache] Falha ao remover upload', error);
    }
  }

  async function getUpload(slotId) {
    if (!SUPPORTS_INDEXED_DB || !slotId) return null;
    try {
      return await runTransaction('readonly', (store) => store.get(slotId));
    } catch (error) {
      console.warn('[UploadCache] Falha ao obter upload', error);
      return null;
    }
  }

  async function hydrateUploads(uploads = {}) {
    if (!SUPPORTS_INDEXED_DB || !uploads) {
      return uploads || {};
    }

    const slotIds = Object.keys(uploads);
    if (!slotIds.length) {
      return uploads;
    }

    await Promise.all(
      slotIds.map(async (slotId) => {
        const cached = await getUpload(slotId);
        if (cached && uploads[slotId]) {
          uploads[slotId].data = cached.data || cached.base64 || null;
          uploads[slotId].dataUrl = cached.dataUrl || null;
          if (!uploads[slotId].previewUrl && cached.dataUrl) {
            uploads[slotId].previewUrl = cached.dataUrl;
          }
        }
      })
    );

    return uploads;
  }

  async function clearAll() {
    if (!SUPPORTS_INDEXED_DB) return;
    try {
      await runTransaction('readwrite', (store) => store.clear());
    } catch (error) {
      console.warn('[UploadCache] Falha ao limpar cache', error);
    }
  }

  function cloneWithoutHeavyUploads(data) {
    if (!data) return {};
    let clone;
    if (typeof structuredClone === 'function') {
      clone = structuredClone(data);
    } else {
      clone = JSON.parse(JSON.stringify(data));
    }

    if (!SUPPORTS_INDEXED_DB) {
      return clone;
    }

    if (clone.uploads) {
      Object.keys(clone.uploads).forEach((slotId) => {
        const entry = clone.uploads[slotId];
        if (!entry) return;
        delete entry.data;
        delete entry.dataUrl;
        delete entry.previewUrl;
      });
    }
    return clone;
  }

  window.uploadCache = {
    isSupported: SUPPORTS_INDEXED_DB,
    save: saveUpload,
    remove: removeUpload,
    hydrateUploads,
    sanitizeProposalData: cloneWithoutHeavyUploads,
    clearAll
  };
})();
