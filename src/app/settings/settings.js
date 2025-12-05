const isElectron = window.electronAPI && window.electronAPI.isElectron;

if (!isElectron) {
  alert('Esta página só funciona dentro do aplicativo desktop.');
}

const btnBack = document.getElementById('btn-back');
const btnConnect = document.getElementById('btn-connect-slides');
const btnDisconnect = document.getElementById('btn-disconnect-slides');
const btnRefresh = document.getElementById('btn-refresh-token');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const statusDetails = document.getElementById('status-details');
const detailStatus = document.getElementById('detail-status');
const detailConnected = document.getElementById('detail-connected');
const detailExpires = document.getElementById('detail-expires');

const configForm = document.getElementById('google-config-form');
const btnResetConfig = document.getElementById('btn-reset-config');
const CONFIG_FIELDS = [
  'templateOdInId',
  'templateOdVtId',
  'templateOdDropId',
  'templateOdFullId',
  'templateOdPackId',
  'presentationsFolderId',
  'assetsFolderId',
  'clientId',
  'clientSecret',
  'redirectUri'
];
const PUBLIC_SHARE_FIELD = 'publicShare';

let tokenInfo = null;
let storedGoogleConfig = {};

async function init() {
  btnBack.addEventListener('click', () => (window.location.href = '../index.html'));
  btnConnect.addEventListener('click', connectSlides);
  btnDisconnect.addEventListener('click', disconnectSlides);
  btnRefresh.addEventListener('click', refreshToken);
  if (configForm) {
    configForm.addEventListener('submit', saveGoogleConfig);
  }
  if (btnResetConfig) {
    btnResetConfig.addEventListener('click', resetGoogleConfig);
  }
  await checkStatus();
  await loadGoogleConfigForm();
}

async function checkStatus() {
  try {
    tokenInfo = await window.electronAPI.slides.getTokenInfo();
    if (tokenInfo?.accessToken) {
      statusDot.className = 'status-dot connected';
      statusText.textContent = '✔️ Conectado ao Google Slides';
      detailStatus.textContent = 'Conectado';

      if (tokenInfo.connectedAt) {
        detailConnected.textContent = new Date(tokenInfo.connectedAt).toLocaleString('pt-BR');
      } else {
        detailConnected.textContent = '---';
      }

      if (tokenInfo.expiresAt) {
        const expires = new Date(tokenInfo.expiresAt);
        detailExpires.textContent = expires.toLocaleString('pt-BR');
      } else {
        detailExpires.textContent = '---';
      }

      statusDetails.style.display = 'block';
      btnConnect.style.display = 'none';
      btnDisconnect.style.display = 'inline-flex';
      btnRefresh.style.display = 'inline-flex';
    } else {
      statusDot.className = 'status-dot disconnected';
      statusText.textContent = '⚠️ Não conectado';
      statusDetails.style.display = 'none';
      btnConnect.style.display = 'inline-flex';
      btnDisconnect.style.display = 'none';
      btnRefresh.style.display = 'none';
    }
  } catch (error) {
    console.error('[Settings] Erro ao obter status:', error);
    statusDot.className = 'status-dot disconnected';
    statusText.textContent = '⚠️ Erro ao obter status';
    statusDetails.style.display = 'none';
    btnConnect.style.display = 'inline-flex';
    btnDisconnect.style.display = 'none';
    btnRefresh.style.display = 'none';
  }
}

async function connectSlides() {
  try {
    btnConnect.disabled = true;
    btnConnect.textContent = '🌀 Conectando...';
    statusText.textContent = '🌀 Abrindo navegador...';

    const result = await window.electronAPI.slides.startOAuth();
    if (result?.success) {
      alert('✔️ Conectado ao Google Slides com sucesso!');
      await checkStatus();
    } else {
      alert('⚠️ Não foi possível conectar.\n\n' + (result?.error || 'Erro desconhecido'));
    }
  } catch (error) {
    alert('⚠️ Erro ao conectar:\n\n' + error.message);
  } finally {
    btnConnect.disabled = false;
    btnConnect.textContent = '🔗 Conectar com Google Slides';
  }
}

async function disconnectSlides() {
  const confirmed = confirm('Desconectar do Google Slides? Você precisará autorizar novamente para gerar novas apresentações.');
  if (!confirmed) return;

  try {
    btnDisconnect.disabled = true;
    await window.electronAPI.slides.disconnect();
    await checkStatus();
    alert('✔️ Conexão removida com sucesso.');
  } catch (error) {
    alert('⚠️ Erro ao desconectar:\n\n' + error.message);
  } finally {
    btnDisconnect.disabled = false;
  }
}

async function refreshToken() {
  try {
    btnRefresh.disabled = true;
    btnRefresh.textContent = '🌀 Renovando...';
    const result = await window.electronAPI.slides.startOAuth();
    if (result?.success) {
      alert('✔️ Token renovado.');
      await checkStatus();
    } else {
      alert('⚠️ Erro ao renovar token:\n\n' + (result?.error || 'Erro desconhecido'));
    }
  } catch (error) {
    alert('⚠️ Erro ao renovar token:\n\n' + error.message);
  } finally {
    btnRefresh.disabled = false;
    btnRefresh.textContent = '🌀 Renovar Token';
  }
}

async function loadGoogleConfigForm() {
  if (!configForm || !window.electronAPI?.settings) return;
  try {
    const response = await window.electronAPI.settings.getGoogleConfig();
    if (!response?.success) return;
    storedGoogleConfig = response.stored || {};
    const effective = response.effective || {};
    const effectiveFieldValues = {
      templateOdInId: effective.templateProductIds?.['od-in'] || effective.templateOdInId || '',
      templateOdVtId: effective.templateProductIds?.['od-vt'] || effective.templateOdVtId || '',
      templateOdDropId: effective.templateProductIds?.['od-drop'] || effective.templateOdDropId || '',
      templateOdFullId: effective.templateProductIds?.['od-full'] || effective.templateOdFullId || '',
      templateOdPackId: effective.templateProductIds?.['od-pack'] || effective.templateOdPackId || '',
      presentationsFolderId: effective.presentationsFolderId || '',
      assetsFolderId: effective.assetsFolderId || '',
      clientId: effective.clientId || '',
      clientSecret: effective.clientSecret || '',
      redirectUri: effective.redirectUri || ''
    };

    CONFIG_FIELDS.forEach((fieldId) => {
      const input = document.getElementById(fieldId);
      if (!input) return;
      const value = storedGoogleConfig[fieldId] ?? effectiveFieldValues[fieldId] ?? '';
      input.value = value;
    });

    const shareInput = document.getElementById(PUBLIC_SHARE_FIELD);
    if (shareInput) {
      if (Object.prototype.hasOwnProperty.call(storedGoogleConfig, PUBLIC_SHARE_FIELD)) {
        shareInput.checked = !!storedGoogleConfig[PUBLIC_SHARE_FIELD];
      } else {
        shareInput.checked = !!effective[PUBLIC_SHARE_FIELD];
      }
    }
  } catch (error) {
    console.error('[Settings] Erro ao carregar IDs do Google:', error);
  }
}

async function saveGoogleConfig(event) {
  event.preventDefault();
  if (!window.electronAPI?.settings) return;
  const payload = {};

  CONFIG_FIELDS.forEach((fieldId) => {
    const input = document.getElementById(fieldId);
    if (!input) return;
    const value = input.value.trim();
    if (value) {
      payload[fieldId] = value;
    }
  });

  const shareInput = document.getElementById(PUBLIC_SHARE_FIELD);
  if (shareInput) {
    payload[PUBLIC_SHARE_FIELD] = shareInput.checked;
  }

  try {
    await window.electronAPI.settings.saveGoogleConfig(payload);
    alert('IDs atualizados com sucesso!');
    await loadGoogleConfigForm();
  } catch (error) {
    alert('Erro ao salvar IDs:\n\n' + error.message);
  }
}

async function resetGoogleConfig() {
  if (!window.electronAPI?.settings) return;
  const confirmed = confirm('Deseja restaurar os valores padrão (definidos no código/.env)?');
  if (!confirmed) return;
  try {
    await window.electronAPI.settings.saveGoogleConfig({});
    await loadGoogleConfigForm();
    alert('Valores restaurados para o padrão.');
  } catch (error) {
    alert('Erro ao restaurar valores:\n\n' + error.message);
  }
}

init();
