// Wizard - Etapa 3: Upload de Imagens

const isElectron = window.electronAPI && window.electronAPI.isElectron;

if (!isElectron) {
  if (window.notify) {
    window.notify.warning('Ambiente inválido', 'Esta página deve ser executada dentro do aplicativo desktop.');
  }
}

// Estado do wizard
let proposalData = {
  cliente: {},
  comercial: {},
  produtosSelecionados: [],
  impacto: {},
  uploads: {},
  status: 'draft'
};

// Slots de upload base
const BASE_SLOTS = [
  { id: 'logo', label: 'Logo do Anunciante', icon: '?Y??', required: true },
  { id: 'mock-lateral', label: 'Mock Lateral (Carro)', icon: '?Ys-', required: true },
  { id: 'mock-mapa', label: 'Mock Frontal', icon: '?Y-????', required: true },
  { id: 'odim', label: 'OD IN', icon: '?Y-????', required: true },
  { id: 'mock-traseiro', label: 'Mock Traseiro', icon: '?Ys-', required: true },
  { id: 'planilha', label: 'Planilha de Or?amento', icon: '?Y"S', required: false } // Opcional se modo editar
];

let totalSlots = BASE_SLOTS.length;

// Carregar dados salvos
function loadDraftData() {
  const draft = localStorage.getItem('wizard_draft');
  if (draft) {
    try {
      proposalData = JSON.parse(draft);
      
      // Verificar se planilha já foi editada no Step3B
      if (proposalData.tipoPlanilha === 'editar' && proposalData.uploads?.['planilha']) {
        marcarPlanilhaCompleta();
      }
      
      // Restaurar uploads
      populateUploads();
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
    }
  }
}

// Marcar card de planilha como completa (já editada no Step3B)
function marcarPlanilhaCompleta() {
  const cardPlanilha = document.querySelector('[data-slot="planilha"]');
  if (cardPlanilha) {
    cardPlanilha.classList.add('has-file', 'from-editor');
    
    const filename = cardPlanilha.querySelector('.upload-card-filename');
    if (filename) {
      filename.textContent = '✅ Editada no programa';
    }
    
    // Desabilitar clique para alterar (opcional)
    cardPlanilha.style.cursor = 'default';
    cardPlanilha.style.opacity = '0.8';
    
    // Adicionar badge
    const badge = document.createElement('div');
    badge.className = 'editor-badge';
    badge.textContent = 'Editada';
    badge.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: #4caf50;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    `;
    cardPlanilha.appendChild(badge);
  }
}

// Gerar slots para produtos selecionados
function generateProductSlots() {
  const produtos = proposalData.produtosSelecionados || [];
  const grid = document.getElementById('uploads-grid');
  
  produtos.forEach(produto => {
    const slotId = `produto-${produto.id}`;
    totalSlots++;
    
    const card = document.createElement('div');
    card.className = 'upload-card';
    card.dataset.slot = slotId;
    card.innerHTML = `
      <div class="upload-card-remove" title="Remover">×</div>
      <img class="upload-card-preview" alt="Preview">
      <div class="upload-card-icon">📦</div>
      <div class="upload-card-label">Mockup ${produto.name}</div>
      <div class="upload-card-hint">PNG ou JPG</div>
      <div class="upload-card-filename"></div>
    `;
    
    grid.appendChild(card);
  // Events will be attached once in DOMContentLoaded to avoid duplicate listeners
  });
  
  updateUploadInfo();
}

// Popular uploads salvos
function populateUploads() {
  if (!proposalData.uploads) return;
  
  Object.keys(proposalData.uploads).forEach(slotId => {
    const upload = proposalData.uploads[slotId];
    const card = document.querySelector(`[data-slot="${slotId}"]`);
    
    if (card && upload) {
      displayUpload(card, upload);
    }
  });
}

// Exibir upload em um card
function displayUpload(card, upload) {
  card.classList.add('has-file');
  
  const preview = card.querySelector('.upload-card-preview');
  const filename = card.querySelector('.upload-card-filename');
  
  // Prefer dataUrl (constructed from base64 data) for img.src
  if (preview) {
    if (upload.dataUrl) {
      preview.src = upload.dataUrl;
    } else if (upload.base64) {
      // legacy fallback
      preview.src = `data:image/png;base64,${upload.base64}`;
    } else if (upload.data) {
      preview.src = `data:image/png;base64,${upload.data}`;
    }
  }
  
  if (filename) {
    filename.textContent = upload.name;
  }
}

// Selecionar arquivo
async function selectFile(slotId) {
  if (!isElectron) {
    notify.error('Erro', 'Funcionalidade disponível apenas no app desktop.');
    return;
  }
  
  try {
    const result = await window.electronAPI.files.select({
      filters: [
        { name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'svg'] }
      ],
      properties: ['openFile']
    });
    
    if (result && result.path) {
      // Construir data URL a partir do base64 retornado (campo 'data' no main)
      const fileName = result.name || '';
      const ext = (fileName.split('.').pop() || '').toLowerCase();
      const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', svg: 'svg+xml' };
      const mime = mimeMap[ext] || 'png';
      const dataBase64 = result.data || result.base64 || result.data || null;

      const dataUrl = dataBase64 ? `data:image/${mime};base64,${dataBase64}` : null;

      // Salvar upload
      proposalData.uploads[slotId] = {
        name: fileName,
        path: result.path,
        data: dataBase64,
        dataUrl: dataUrl
      };

      // Atualizar UI
      const card = document.querySelector(`[data-slot="${slotId}"]`);
      displayUpload(card, proposalData.uploads[slotId]);

      updateUploadInfo();
      notify.success('Upload realizado', `${fileName} enviado com sucesso.`);
    }
  } catch (error) {
    console.error('Erro ao selecionar arquivo:', error);
    notify.error('Erro', 'Não foi possível selecionar o arquivo.');
  }
}

// Remover upload
function removeUpload(slotId) {
  if (proposalData.uploads[slotId]) {
    delete proposalData.uploads[slotId];
    
    const card = document.querySelector(`[data-slot="${slotId}"]`);
    card.classList.remove('has-file');
    
    const preview = card.querySelector('.upload-card-preview');
    const filename = card.querySelector('.upload-card-filename');
    
    if (preview) preview.src = '';
    if (filename) filename.textContent = '';
    
    updateUploadInfo();
    notify.info('Upload removido', 'Imagem removida com sucesso.');
  }
}

// Atualizar informação de uploads
function updateUploadInfo() {
  const count = Object.keys(proposalData.uploads || {}).length;
  const infoEl = document.getElementById('upload-info');
  
  if (infoEl) {
    infoEl.innerHTML = `<strong>${count}</strong> / ${totalSlots} imagens enviadas`;
  }
}

// Configurar eventos de um card
function setupCardEvents(card) {
  const slotId = card.dataset.slot;
  
  // Click no card
  card.addEventListener('click', (e) => {
    if (e.target.classList.contains('upload-card-remove')) {
      e.stopPropagation();
      removeUpload(slotId);
    } else {
      selectFile(slotId);
    }
  });
}

// Salvar rascunho
function saveDraft() {
  localStorage.setItem('wizard_draft', JSON.stringify(proposalData));
  const count = Object.keys(proposalData.uploads || {}).length;
  notify.success('Rascunho salvo', `${count} imagem(ns) salva(s).`);
}

// Próxima etapa
function nextStep() {
  localStorage.setItem('wizard_draft', JSON.stringify(proposalData));
  
  // Sempre ir para Step4 (Checagem)
  // A edição da planilha já aconteceu antes (Step2 → Step3B → Step3)
  window.location.href = 'Step4Mapeamento.html';
}

// Voltar
function goBack() {
  localStorage.setItem('wizard_draft', JSON.stringify(proposalData));
  window.location.href = 'Step2Produtos.html';
}

// Atualizar barra de progresso
function updateProgressBar() {
  const progress = document.querySelector('.wizard-steps-progress');
  // Etapa 3 = 50% (3/5 concluídos)
  progress.style.width = '50%';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadDraftData();
  updateProgressBar();
  
  // Ocultar card de planilha se modo for "editar"
  if (proposalData.tipoPlanilha === 'editar') {
    const planilhaCard = document.querySelector('[data-slot="planilha"]');
    if (planilhaCard) {
      planilhaCard.style.display = 'none';
    }
  }
  
  // Configurar cards base
  document.querySelectorAll('.upload-card').forEach(card => {
    setupCardEvents(card);
  });
  
  // Botões de navegação
  document.getElementById('btn-next').addEventListener('click', nextStep);
  document.getElementById('btn-save-draft').addEventListener('click', saveDraft);
  document.getElementById('btn-back').addEventListener('click', goBack);
  
  // Atalhos de teclado
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveDraft();
    }
  });
});
