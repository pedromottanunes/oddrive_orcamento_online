(function initWebBridge() {
  if (window.electronAPI) return;

  const API_BASE = window.__APP_API_BASE__ || '';
  const progressListeners = new Set();

  function emitProgress(data) {
    if (!data) return;
    progressListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.warn('[WebBridge] Falha ao notificar progresso:', error);
      }
    });
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}/api${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      credentials: 'same-origin',
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      // corpo vazio
    }

    if (!response.ok) {
      const message = data?.error || response.statusText || 'Erro na requisiÇõÇœo';
      const error = new Error(message);
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return data;
  }

  function selectFile(options = {}) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';

      if (options?.filters?.length) {
        const accepts = options.filters
          .flatMap((filter) => filter.extensions || [])
          .map((ext) => (ext.startsWith('.') ? ext : `.${ext}`))
          .join(',');
        if (accepts) {
          input.accept = accepts;
        }
      }

      document.body.appendChild(input);

      let settled = false;
      const cleanup = () => {
        input.removeEventListener('change', handleChange);
        input.removeEventListener('blur', handleBlur);
        if (input.parentNode) {
          document.body.removeChild(input);
        }
      };

      const handleBlur = () => {
        setTimeout(() => {
          if (!settled) {
            settled = true;
            cleanup();
            resolve(null);
          }
        }, 150);
      };

      const handleChange = () => {
        settled = true;
        const file = input.files?.[0];
        if (!file) {
          cleanup();
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          const base64 = typeof dataUrl === 'string' ? dataUrl.split(',')[1] : null;
          cleanup();
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            data: base64,
            dataUrl,
            path: file.name
          });
        };
        reader.onerror = (error) => {
          cleanup();
          reject(error);
        };
        reader.readAsDataURL(file);
      };

      input.addEventListener('change', handleChange);
      input.addEventListener('blur', handleBlur, { once: true });
      input.click();
    });
  }

  function downloadBase64({ data, fileName = 'arquivo.bin' }) {
    if (!data) {
      return { success: false, error: 'ConteÇõdo vazio.' };
    }

    const link = document.createElement('a');
    link.href = `data:application/octet-stream;base64,${data}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, path: null };
  }

  window.electronAPI = {
    isElectron: true,
    platform: 'web',
    proposals: {
      list: () => request('/proposals'),
      get: async (id) => {
        try {
          return await request(`/proposals/${id}`);
        } catch (error) {
          if (error.status === 404) {
            return null;
          }
          throw error;
        }
      },
      create: (proposal) => request('/proposals', { method: 'POST', body: proposal }),
      update: (id, updates) => request(`/proposals/${id}`, { method: 'PUT', body: updates }),
      delete: (id) => request(`/proposals/${id}`, { method: 'DELETE' })
    },
    files: {
      select: (options) => selectFile(options),
      save: (payload) => Promise.resolve(downloadBase64(payload || {}))
    },
    slides: {
      generate: async (proposalData, _accessToken, options) => {
const fallbackSteps = [
  { progress: 5, message: 'Iniciando geração no Google Slides...' },
  { progress: 15, message: 'Criando cópia da apresentação base...' },
  { progress: 25, message: 'Preparando placeholders...' },
  { progress: 40, message: 'Enviando imagens para o Google Drive...' },
  { progress: 55, message: 'Aplicando placeholders no Slides...' },
  { progress: 80, message: 'Finalizando geração...' }
];

        const timers = [];
        emitProgress({ progress: 1, message: 'Conectando ao servidor...' });
        fallbackSteps.forEach((step, index) => {
          const handle = setTimeout(() => emitProgress(step), 1200 * (index + 1));
          timers.push(handle);
        });

        try {
          const response = await request('/slides/generate', {
            method: 'POST',
            body: { proposalData, options }
          });

          timers.forEach(clearTimeout);
          if (Array.isArray(response?.progress)) {
            response.progress.forEach((step) => emitProgress(step));
          }
          emitProgress({ progress: 100, message: 'Proposta gerada com sucesso!' });
          return response;
        } catch (error) {
          timers.forEach(clearTimeout);
emitProgress({ progress: 0, message: 'Erro ao gerar apresentação.' });
          throw error;
        }
      },
      onProgress: (callback) => {
        if (typeof callback === 'function') {
          progressListeners.add(callback);
          return () => progressListeners.delete(callback);
        }
        return () => {};
      },
      startOAuth: () =>
        request('/slides/oauth/start', {
          method: 'POST'
        }),
      getTokenInfo: () => request('/slides/token-info'),
      disconnect: () =>
        request('/slides/disconnect', {
          method: 'POST'
        }),
      refreshToken: () =>
        request('/slides/refresh', {
          method: 'POST'
        }),
      exportPdf: (presentationId, proposalId) =>
        request('/slides/export-pdf', {
          method: 'POST',
          body: { presentationId, proposalId }
        })
    },
    settings: {
      getGoogleConfig: () => request('/settings/google'),
      saveGoogleConfig: (config) =>
        request('/settings/google', {
          method: 'POST',
          body: config
        })
    },
    shell: {
      openFile: () =>
        Promise.resolve({
          success: false,
          error: 'NÇœo disponÇðvel no modo web.'
        }),
      openFolder: () =>
        Promise.resolve({
          success: false,
          error: 'NÇœo disponÇðvel no modo web.'
        }),
      showItemInFolder: () =>
        Promise.resolve({
          success: false,
          error: 'NÇœo disponÇðvel no modo web.'
        })
    }
  };
})();
