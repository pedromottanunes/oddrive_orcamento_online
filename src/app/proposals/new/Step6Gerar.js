// Wizard - Etapa Final: geração da apresentação e PDF

const isElectron = window.electronAPI && window.electronAPI.isElectron;

if (!isElectron) {
  if (window.notify) {
    window.notify.warning('Ambiente inválido', 'Esta página deve ser executada dentro do aplicativo desktop.');
  }
}

let proposalData = {
  cliente: {},
  comercial: {},
  produtosSelecionados: [],
  impacto: {},
  uploads: {},
  status: 'draft'
};

let isGenerating = false;
let pdfGenerating = false;
let progressListenerAttached = false;

const ui = {
  icon: () => document.getElementById('generate-icon'),
  title: () => document.getElementById('generate-title'),
  subtitle: () => document.getElementById('generate-subtitle'),
  progressWrapper: () => document.getElementById('generate-progress'),
  progressBar: () => document.getElementById('progress-bar'),
  status: () => document.getElementById('generate-status'),
  presentationLinks: () => document.getElementById('presentation-links'),
  presentationViewLink: () => document.getElementById('presentation-view-link'),
  btnGenerate: () => document.getElementById('btn-generate'),
  btnGeneratePdf: () => document.getElementById('btn-generate-pdf'),
  pdfActions: () => document.getElementById('pdf-actions'),
  btnFinish: () => document.getElementById('btn-finish')
};

function attachProgressListener() {
  if (progressListenerAttached) return;
  progressListenerAttached = true;
  window.electronAPI.slides.onProgress((data) => {
    if (!data) return;
    ui.progressBar().style.width = `${data.progress}%`;
    ui.status().textContent = data.message;
  });
}

function loadDraftData() {
  const draft = localStorage.getItem('wizard_draft');
  if (draft) {
    try {
      proposalData = JSON.parse(draft);
      updateImpactMetrics();
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
    }
  }
}

function updateImpactMetrics() {
  const dias = proposalData?.comercial?.tempoCampanhaDias || 0;
  const carros = proposalData?.comercial?.numeroCarros || 0;

  if (window.impactMetrics && typeof window.impactMetrics.calculateImpactMetrics === 'function') {
    proposalData.impacto = window.impactMetrics.calculateImpactMetrics(dias, carros);
  }
}

async function generatePresentation() {
  if (isGenerating) return;

  isGenerating = true;
  updateImpactMetrics();
  hidePdfActions();

  const iconEl = ui.icon();
  const titleEl = ui.title();
  const subtitleEl = ui.subtitle();
  const progressWrapper = ui.progressWrapper();
  const btnGenerate = ui.btnGenerate();
  const btnGeneratePdf = ui.btnGeneratePdf();

  iconEl.textContent = '🚧';
  titleEl.textContent = 'Gerando apresentação...';
  subtitleEl.textContent = 'Duplicando o template e preenchendo os dados no Google Slides.';
  progressWrapper.style.display = 'block';
  btnGenerate.disabled = true;
  btnGeneratePdf.style.display = 'none';

  attachProgressListener();

  try {
    const result = await window.electronAPI.slides.generate(proposalData, null, { exportPdf: false });
    if (!result?.success) {
      throw new Error(result?.error || 'Erro ao gerar a apresentação.');
    }

    proposalData.status = 'slides-ready';
    proposalData.generatedAt = new Date().toISOString();
    proposalData.generatedPdfPath = null;
    proposalData.googlePresentationId = result.designId;
    proposalData.googlePresentationUrl = result.presentationUrl;

    await saveProposal({ silent: true });

    iconEl.textContent = '✅';
    titleEl.textContent = 'Apresentação criada com sucesso!';
    subtitleEl.textContent = 'Use o link abaixo para visualizar ou baixar diretamente do Google Slides.';
    showPresentationLink(result.presentationUrl);
    btnGeneratePdf.style.display = 'inline-flex';
    btnGeneratePdf.disabled = false;
    ui.btnFinish().style.display = 'inline-flex';
    notify.success('Apresentação criada', 'Link disponível para visualização/download.');
  } catch (error) {
    console.error('Erro ao gerar apresentação:', error);
    iconEl.textContent = '⚠️';
    titleEl.textContent = 'Falha ao gerar apresentação';
    subtitleEl.textContent = error.message || 'Tente novamente e verifique sua conexão.';
    btnGenerate.disabled = false;
    notify.error('Erro', error.message || 'Não foi possível gerar a apresentação.');
  } finally {
    isGenerating = false;
    ui.btnGenerate().disabled = false;
  }
}

function showPresentationLink(url) {
  const links = ui.presentationLinks();
  const linkEl = ui.presentationViewLink();
  if (!links || !linkEl) return;
  linkEl.href = url;
  links.style.display = url ? 'block' : 'none';
}

function hidePdfActions() {
  const pdfContainer = ui.pdfActions();
  if (pdfContainer) {
    pdfContainer.style.display = 'none';
  }
}

function showPdfActions() {
  const pdfContainer = ui.pdfActions();
  if (pdfContainer) {
    pdfContainer.style.display = 'flex';
  }
  ui.btnFinish().style.display = 'inline-flex';
}

async function generateFinalPdf() {
  if (pdfGenerating) return;
  if (!proposalData.googlePresentationId) {
    notify.warning('Gere a apresentação primeiro', 'Crie a apresentação antes de exportar o PDF.');
    return;
  }

  pdfGenerating = true;
  const btnGeneratePdf = ui.btnGeneratePdf();
  btnGeneratePdf.disabled = true;
  ui.status().textContent = 'Exportando PDF em alta qualidade...';

  try {
    const response = await window.electronAPI.slides.exportPdf(proposalData.googlePresentationId, proposalData.id);
    if (!response?.success) {
      throw new Error(response?.error || 'Falha ao exportar o PDF.');
    }

    const saveResult = await window.electronAPI.files.save({
      data: response.base64,
      fileName: response.fileName
    });

    if (!saveResult) {
      notify.info('Operação cancelada', 'Seleção de local cancelada.');
      return;
    }

    proposalData.generatedPdfPath = saveResult.path;
    proposalData.status = 'completed';
    proposalData.generatedAt = new Date().toISOString();

    await saveProposal({ silent: true });
    showPdfActions();
    ui.status().textContent = 'PDF salvo com sucesso.';
    notify.success('PDF salvo', 'Arquivo salvo com sucesso.');
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    notify.error('Erro', error.message || 'Não foi possível exportar o PDF.');
  } finally {
    pdfGenerating = false;
    ui.btnGeneratePdf().disabled = false;
  }
}

async function saveProposal(options = {}) {
  const { silent = false } = options || {};
  if (!isElectron) return;

  try {
    const editId = localStorage.getItem('editing_proposal_id');
    let saved;

    if (editId) {
      saved = await window.electronAPI.proposals.update(editId, proposalData);
      localStorage.removeItem('editing_proposal_id');
      if (!silent) {
        notify.success('Proposta atualizada', 'As alterações foram salvas com sucesso.');
      }
    } else {
      saved = await window.electronAPI.proposals.create(proposalData);
      if (!silent) {
        notify.success('Proposta criada', 'Nova proposta registrada com sucesso.');
      }
    }

    if (saved) {
      if (saved.id) {
        proposalData.id = saved.id;
      }
      localStorage.removeItem('wizard_draft');
    }

    return saved;
  } catch (error) {
    console.error('Erro ao salvar proposta:', error);
    throw error;
  }
}

async function openPDF() {
  try {
    if (!proposalData.generatedPdfPath) {
      notify.warning('Arquivo não encontrado', 'Gere e salve o PDF antes de abrir.');
      return;
    }

    const result = await window.electronAPI.shell.openFile(proposalData.generatedPdfPath);
    if (!result.success) {
      notify.error('Erro', 'Não foi possível abrir o PDF: ' + result.error);
    }
  } catch (error) {
    console.error('Erro ao abrir PDF:', error);
    notify.error('Erro', 'Não foi possível abrir o PDF.');
  }
}

async function openFolder() {
  try {
    const pdfPath = proposalData.generatedPdfPath;
    if (!pdfPath) {
      notify.warning('Arquivo não encontrado', 'Gere e salve o PDF antes de abrir a pasta.');
      return;
    }

    const separatorIndex = Math.max(pdfPath.lastIndexOf('/'), pdfPath.lastIndexOf('\\'));
    const folderPath = separatorIndex > -1 ? pdfPath.substring(0, separatorIndex) : pdfPath;
    const result = await window.electronAPI.shell.openFolder(folderPath);
    if (!result.success) {
      notify.error('Erro', 'Não foi possível abrir a pasta: ' + result.error);
    }
  } catch (error) {
    console.error('Erro ao abrir pasta:', error);
    notify.error('Erro', 'Não foi possível abrir a pasta.');
  }
}

function newProposal() {
  localStorage.removeItem('wizard_draft');
  window.location.href = 'Step1Dados.html';
}

function finish() {
  localStorage.removeItem('wizard_draft');
  window.location.href = '../../index.html';
}

function goBack() {
  window.location.href = 'Step4Mapeamento.html';
}

function updateProgressBar() {
  const progress = document.querySelector('.wizard-steps-progress');
  progress.style.width = '100%';
}

document.addEventListener('DOMContentLoaded', () => {
  loadDraftData();
  updateProgressBar();
  attachProgressListener();

  document.getElementById('btn-generate').addEventListener('click', generatePresentation);
  document.getElementById('btn-generate-pdf').addEventListener('click', generateFinalPdf);
  document.getElementById('btn-open-pdf').addEventListener('click', openPDF);
  document.getElementById('btn-open-folder').addEventListener('click', openFolder);
  document.getElementById('btn-new-proposal').addEventListener('click', newProposal);

  document.getElementById('btn-back').addEventListener('click', goBack);
  document.getElementById('btn-finish').addEventListener('click', finish);

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter' && !isGenerating) {
      generatePresentation();
    }
  });
});
