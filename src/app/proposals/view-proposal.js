// view-proposal.js - Script para visualizar detalhes de uma proposta

let currentProposal = null;
let proposalId = null;

// Inicializar
async function init() {
  // Obter ID da proposta da URL
  const params = new URLSearchParams(window.location.search);
  proposalId = params.get('id');
  
  if (!proposalId) {
    notify.error('Erro', 'ID da proposta não fornecido');
    setTimeout(() => goBack(), 2000);
    return;
  }
  
  // Carregar proposta
  await loadProposal();
  
  // Event listeners
  document.getElementById('btn-edit').addEventListener('click', editProposal);
  document.getElementById('btn-download').addEventListener('click', downloadProposal);
  document.getElementById('btn-delete').addEventListener('click', deleteProposal);
}

// Carregar dados da proposta
async function loadProposal() {
  try {
    currentProposal = await window.electronAPI.proposals.get(proposalId);
    
    if (!currentProposal) {
      notify.error('Erro', 'Proposta não encontrada');
      setTimeout(() => goBack(), 2000);
      return;
    }
    
    renderProposal();
  } catch (error) {
    console.error('Erro ao carregar proposta:', error);
    notify.error('Erro', 'Não foi possível carregar a proposta');
  }
}

// Renderizar dados da proposta
function renderProposal() {
  const proposal = currentProposal;
  
  // Header
  const statusText = proposal.status === 'generated' ? 'Gerado' : 'Rascunho';
  const statusClass = proposal.status === 'generated' ? 'status-generated' : 'status-draft';
  
  document.getElementById('proposal-title').textContent = 
    `Proposta — ${proposal.cliente?.nomeAnunciante || 'Sem nome'}`;
  
  const statusEl = document.getElementById('proposal-status');
  statusEl.textContent = statusText;
  statusEl.className = `proposal-status ${statusClass}`;
  
  const createdDate = new Date(proposal.createdAt).toLocaleString('pt-BR');
  const updatedDate = new Date(proposal.updatedAt).toLocaleString('pt-BR');
  
  document.getElementById('proposal-meta').textContent = 
    `Criado em: ${createdDate} • Última atualização: ${updatedDate}`;
  
  // Mostrar botão de download apenas se a proposta foi gerada
  if (proposal.status === 'generated') {
    document.getElementById('btn-download').style.display = 'inline-flex';
  }
  
  // Dados do Cliente
  document.getElementById('nomeAnunciante').textContent = 
    proposal.cliente?.nomeAnunciante || '-';
  document.getElementById('nomeEmpresa').textContent = 
    proposal.cliente?.nomeEmpresa || '-';
  document.getElementById('pracas').textContent = 
    proposal.cliente?.pracas || '-';
  
  // Dados Comerciais
  document.getElementById('pagamento').textContent = 
    proposal.comercial?.pagamento || '-';
  document.getElementById('tempoCampanha').textContent = 
    proposal.comercial?.tempoCampanha || '-';
  document.getElementById('quantidadeCarros').textContent = 
    proposal.comercial?.quantidadeCarros || proposal.comercial?.numeroCarros || '-';
  
  if (proposal.comercial?.dataInicio) {
    const dataInicio = new Date(proposal.comercial.dataInicio).toLocaleDateString('pt-BR');
    document.getElementById('dataInicio').textContent = dataInicio;
  } else {
    document.getElementById('dataInicio').textContent = '-';
  }
  
  if (proposal.comercial?.validadeProposta) {
    const validadeProposta = new Date(proposal.comercial.validadeProposta).toLocaleDateString('pt-BR');
    document.getElementById('validadeProposta').textContent = validadeProposta;
  } else {
    document.getElementById('validadeProposta').textContent = '-';
  }
  
  // Produtos Selecionados
  const produtosList = document.getElementById('produtos-list');
  if (proposal.produtosSelecionados && proposal.produtosSelecionados.length > 0) {
    produtosList.innerHTML = '';
    proposal.produtosSelecionados.forEach(produto => {
      const chip = document.createElement('div');
      chip.className = 'produto-chip';
      chip.textContent = produto;
      produtosList.appendChild(chip);
    });
  } else {
    produtosList.innerHTML = '<div class="data-value empty">Nenhum produto selecionado</div>';
  }
  
  // Uploads
  const uploadsGrid = document.getElementById('uploads-grid');
  if (proposal.uploads && Object.keys(proposal.uploads).length > 0) {
    uploadsGrid.innerHTML = '';
    
    for (const [key, file] of Object.entries(proposal.uploads)) {
      const uploadItem = document.createElement('div');
      uploadItem.className = 'upload-item';
      
      const label = getUploadLabel(key);
      
      uploadItem.innerHTML = `
        <div class="upload-thumbnail">🖼️</div>
        <div class="upload-name">${file.name || 'arquivo'}</div>
        <div class="upload-label">${label}</div>
      `;
      
      uploadsGrid.appendChild(uploadItem);
    }
  } else {
    uploadsGrid.innerHTML = '<div class="data-value empty">Nenhum arquivo enviado</div>';
  }
}

// Obter label amigável para os uploads
function getUploadLabel(key) {
  const labels = {
    'logoMarcaAnunciante': 'Logo do Anunciante',
    'imagemRede': 'Imagem da Rede',
    'imagemEstabelecimento': 'Imagem do Estabelecimento',
    'imagemProduto1': 'Produto 1',
    'imagemProduto2': 'Produto 2',
    'imagemProduto3': 'Produto 3',
    'imagemProduto4': 'Produto 4',
    'imagemProduto5': 'Produto 5',
    'imagemProduto6': 'Produto 6'
  };
  
  return labels[key] || key;
}

// Editar proposta
function editProposal() {
  // Salvar ID no localStorage e redirecionar para wizard
  localStorage.setItem('editing_proposal_id', proposalId);
  window.location.href = 'new/Step1Dados.html?edit=' + proposalId;
}

// Baixar proposta (PDF)
async function downloadProposal() {
  notify.info('Em desenvolvimento', 'A integração com Google Slides para exportar PDF será implementada em breve.');
}

// Excluir proposta
async function deleteProposal() {
  const confirmed = await modal.confirm(
    'Excluir Proposta',
    'Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.'
  );
  
  if (confirmed) {
    try {
      await window.electronAPI.proposals.delete(proposalId);
      notify.success('Proposta excluída', 'A proposta foi removida com sucesso.');
      setTimeout(() => goBack(), 1500);
    } catch (error) {
      console.error('Erro ao deletar proposta:', error);
      notify.error('Erro', 'Não foi possível excluir a proposta.');
    }
  }
}

// Voltar para workspace
function goBack() {
  window.location.href = '../index.html';
}

// Modal helper (simples)
const modal = {
  confirm: async (title, message) => {
    return confirm(`${title}\n\n${message}`);
  }
};

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
