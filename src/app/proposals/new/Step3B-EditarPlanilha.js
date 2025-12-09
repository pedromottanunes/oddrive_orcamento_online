// ===== WIZARD STATE =====
let proposalData = {};

function getPersistableDraft() {
  if (window.uploadCache?.sanitizeProposalData) {
    return window.uploadCache.sanitizeProposalData(proposalData);
  }

  const clone = JSON.parse(JSON.stringify(proposalData || {}));
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


// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  loadDraftData();
  preencherDadosStep1();
  configurarEventListeners();
  calcularTudo();
});

// ===== CARREGAR RASCUNHO =====
function loadDraftData() {
  try {
    const savedData = localStorage.getItem('wizard_draft');
    if (savedData) {
      proposalData = JSON.parse(savedData);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar rascunho:', error);
  }
}

// ===== PRÉ-PREENCHER DADOS DO STEP 1 =====
function preencherDadosStep1() {
  const produtos = proposalData?.produtosSelecionados || [];
  const numeroCarros = proposalData?.comercial?.numeroCarros || 40;
  const prazoMeses = proposalData?.comercial?.tempoCampanhaDias ? Math.ceil(proposalData.comercial.tempoCampanhaDias / 30) : 1;
  const pracas = proposalData?.cliente?.pracas || '';
  
  // Gerar tabelas dinamicamente
  gerarTabelaVeiculacao(produtos, numeroCarros, prazoMeses);
  gerarTabelaProducao(produtos, numeroCarros);
  gerarTabelaPracas(pracas, numeroCarros);
}

// ===== GERAR TABELA VEICULAÇÃO DINÂMICA =====
function gerarTabelaVeiculacao(produtos, numeroCarros, prazoMeses) {
  const tbody = document.getElementById('veiculacao-body');
  tbody.innerHTML = '';
  
  // Mapear nomes de produtos
  const produtosNomes = {
    'od-drop': 'OD DROP',
    'od-vt': 'OD VT',
    'od-pack': 'OD PACK',
    'od-full': 'OD FULL',
    'od-in': 'OD IN',
    'od-light': 'OD LIGHT'
  };
  
  // Criar linha para cada produto (preço inicial ZERO)
  produtos.forEach((produto, index) => {
    const produtoNome = produtosNomes[produto.id] || produto.nome || produto.id.toUpperCase();
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="cell-input" type="text" id="tipo-anuncio-${index}" value="${produtoNome}" readonly></td>
      <td><input class="cell-input" type="number" id="prazo-${index}" value="${prazoMeses}" readonly style="text-align: center;"></td>
      <td>R$</td>
      <td><input class="cell-input" type="number" id="preco-unit-${index}" value="0" step="0.01" style="text-align: center;"></td>
      <td><input class="cell-input" type="number" id="qtde-carros-${index}" value="${numeroCarros}" readonly style="text-align: center;"></td>
      <td>R$</td>
      <td><input class="cell-input" type="text" id="valor-tabela-${index}" readonly style="text-align: center;"></td>
      <td><input class="cell-input destaque-vermelho" type="text" id="desconto-${index}" value="0%" style="text-align: center;"></td>
      <td>R$</td>
      <td><input class="cell-input destaque-vermelho" type="text" id="veic-negociado-${index}" readonly style="text-align: center;"></td>
    `;
    tbody.appendChild(tr);
  });
  
  // Linha de totais
  const trTotal = document.createElement('tr');
  trTotal.className = 'total-row';
  trTotal.innerHTML = `
    <td colspan="2"></td>
    <td>R$</td>
    <td><input class="cell-input" type="text" id="preco-unit-total" readonly style="text-align: center; font-weight: bold;"></td>
    <td></td>
    <td>R$</td>
    <td><input class="cell-input" type="text" id="valor-tabela-total" readonly style="text-align: center; font-weight: bold;"></td>
    <td><input class="cell-input destaque-vermelho" type="text" id="desconto-total" readonly style="text-align: center; font-weight: bold;"></td>
    <td>R$</td>
    <td><input class="cell-input" type="text" id="veic-negociado-total" readonly style="text-align: center; font-weight: bold;"></td>
  `;
  tbody.appendChild(trTotal);
}

// ===== GERAR TABELA PRODUÇÃO DINÂMICA =====
function gerarTabelaProducao(produtos, numeroCarros) {
  const tbody = document.getElementById('producao-body');
  tbody.innerHTML = '';
  
  const produtosNomes = {
    'od-drop': 'OD DROP',
    'od-vt': 'OD VT',
    'od-pack': 'OD PACK',
    'od-full': 'OD FULL',
    'od-in': 'OD IN',
    'od-light': 'OD LIGHT'
  };
  
  produtos.forEach((produto, index) => {
    const produtoNome = produtosNomes[produto.id] || produto.nome || produto.id.toUpperCase();
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="cell-input" type="text" id="tipo-plotagem-${index}" value="${produtoNome}" readonly></td>
      <td>R$</td>
      <td><input class="cell-input" type="text" id="valor-carro-${index}" readonly style="text-align: center;"></td>
      <td><input class="cell-input" type="number" id="qtde-prod-${index}" value="${numeroCarros}" readonly style="text-align: center;"></td>
      <td>R$</td>
      <td><input class="cell-input" type="text" id="total-prod-${index}" readonly style="text-align: center;"></td>
    `;
    tbody.appendChild(tr);
  });
  
  // Linha de totais
  const trTotal = document.createElement('tr');
  trTotal.className = 'total-row';
  trTotal.innerHTML = `
    <td></td>
    <td>R$</td>
    <td><input class="cell-input" type="text" id="valor-carro-total" readonly style="text-align: center; font-weight: bold;"></td>
    <td></td>
    <td>R$</td>
    <td><input class="cell-input" type="text" id="total-prod-total" readonly style="text-align: center; font-weight: bold;"></td>
  `;
  tbody.appendChild(trTotal);
}

// ===== GERAR TABELA PRAÇAS DINÂMICA =====
function gerarTabelaPracas(pracasString, numeroCarros) {
  const tbody = document.getElementById('estados-body');
  tbody.innerHTML = '';
  
  const pracasArray = pracasString ? pracasString.split(',').map(p => p.trim()).filter(p => p) : ['Cidade 1'];
  const qtdePorPraca = Math.floor(numeroCarros / pracasArray.length);
  
  pracasArray.forEach((praca, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="cell-input" type="text" id="estado-${index}" value="" placeholder="UF" style="text-align: center;"></td>
      <td><input class="cell-input" type="text" id="praca-${index}" value="${praca}" readonly></td>
      <td><input class="cell-input" type="number" id="qtde-estado-${index}" value="${qtdePorPraca}" style="text-align: center;"></td>
    `;
    tbody.appendChild(tr);
  });
  
  // Linha de totais
  const trTotal = document.createElement('tr');
  trTotal.className = 'total-row';
  trTotal.innerHTML = `
    <td colspan="2" style="text-align: center; font-weight: bold;">TOTAL</td>
    <td><input class="cell-input" type="text" id="qtde-estado-total" readonly style="text-align: center; font-weight: bold;"></td>
  `;
  tbody.appendChild(trTotal);
}

// ===== CONFIGURAR EVENT LISTENERS =====
function configurarEventListeners() {
  // Event delegation para inputs dinâmicos
  document.getElementById('planilha-container').addEventListener('input', (e) => {
    if (e.target.classList.contains('cell-input')) {
      calcularTudo();
    }
  });
  
  // Botões de navegação
  document.getElementById('btn-back').addEventListener('click', voltar);
  document.getElementById('btn-save-draft').addEventListener('click', salvarRascunho);
  document.getElementById('btn-next').addEventListener('click', capturarEContinuar);
}

// ===== FUNÇÕES DE CÁLCULO =====
function calcularTudo() {
  calcularVeiculacao();
  calcularProducao();
  calcularEstados();
  calcularResumo();
  calcularUnitarios();
}

function calcularVeiculacao() {
  const produtos = proposalData?.produtosSelecionados || [];
  let somaPrecos = 0;
  let somaValorTabela = 0;
  let somaVeicNegociado = 0;
  
  produtos.forEach((produto, index) => {
    const preco = parseFloat(document.getElementById(`preco-unit-${index}`)?.value) || 0;
    const qtde = parseFloat(document.getElementById(`qtde-carros-${index}`)?.value) || 0;
    const desconto = parseDesconto(document.getElementById(`desconto-${index}`)?.value);
    
    const valorTabela = preco * qtde;
    const descontoReais = valorTabela * (desconto / 100);
    const veicNegociado = valorTabela - descontoReais;
    
    // Atualizar campos calculados
    const valorTabelaEl = document.getElementById(`valor-tabela-${index}`);
    const veicNegociadoEl = document.getElementById(`veic-negociado-${index}`);
    
    if (valorTabelaEl) valorTabelaEl.value = formatarMoeda(valorTabela);
    if (veicNegociadoEl) veicNegociadoEl.value = formatarMoeda(veicNegociado);
    
    somaPrecos += preco;
    somaValorTabela += valorTabela;
    somaVeicNegociado += veicNegociado;
  });
  
  // Calcular desconto total percentual
  const descontoPercentualTotal = somaValorTabela > 0 ? ((somaValorTabela - somaVeicNegociado) / somaValorTabela) * 100 : 0;
  
  // Atualizar totais
  const precoTotalEl = document.getElementById('preco-unit-total');
  const valorTabelaTotalEl = document.getElementById('valor-tabela-total');
  const descontoTotalEl = document.getElementById('desconto-total');
  const veicNegociadoTotalEl = document.getElementById('veic-negociado-total');
  
  if (precoTotalEl) precoTotalEl.value = formatarMoeda(somaPrecos);
  if (valorTabelaTotalEl) valorTabelaTotalEl.value = formatarMoeda(somaValorTabela);
  if (descontoTotalEl) descontoTotalEl.value = `${descontoPercentualTotal.toFixed(2)}%`;
  if (veicNegociadoTotalEl) veicNegociadoTotalEl.value = formatarMoeda(somaVeicNegociado);
}

function calcularProducao() {
  const produtos = proposalData?.produtosSelecionados || [];
  let somaValorCarro = 0;
  let somaTotalProd = 0;
  
  produtos.forEach((produto, index) => {
    // Calcular valor por carro automaticamente baseado na veiculação negociada
    const veicNegociadoEl = document.getElementById(`veic-negociado-${index}`);
    const qtdeProdEl = document.getElementById(`qtde-prod-${index}`);
    
    const veicNegociado = veicNegociadoEl ? parseMoeda(veicNegociadoEl.value) : 0;
    const qtde = qtdeProdEl ? parseFloat(qtdeProdEl.value) : 0;
    
    // Valor por carro = Veiculação Negociada ÷ Quantidade de carros
    const valorCarro = qtde > 0 ? veicNegociado / qtde : 0;
    const totalProd = valorCarro * qtde;
    
    const valorCarroEl = document.getElementById(`valor-carro-${index}`);
    const totalProdEl = document.getElementById(`total-prod-${index}`);
    
    if (valorCarroEl) valorCarroEl.value = formatarMoeda(valorCarro);
    if (totalProdEl) totalProdEl.value = formatarMoeda(totalProd);
    
    somaValorCarro += valorCarro;
    somaTotalProd += totalProd;
  });
  
  // Atualizar totais
  const valorCarroTotalEl = document.getElementById('valor-carro-total');
  const totalProdTotalEl = document.getElementById('total-prod-total');
  
  if (valorCarroTotalEl) valorCarroTotalEl.value = formatarMoeda(somaValorCarro);
  if (totalProdTotalEl) totalProdTotalEl.value = formatarMoeda(somaTotalProd);
}

function calcularEstados() {
  const pracas = proposalData?.cliente?.pracas || '';
  const pracasArray = pracas ? pracas.split(',').map(p => p.trim()).filter(p => p) : ['Cidade 1'];
  let somaQtde = 0;
  
  pracasArray.forEach((praca, index) => {
    const qtde = parseFloat(document.getElementById(`qtde-estado-${index}`)?.value) || 0;
    somaQtde += qtde;
  });
  
  const qtdeTotalEl = document.getElementById('qtde-estado-total');
  if (qtdeTotalEl) qtdeTotalEl.value = somaQtde;
}

function calcularResumo() {
  const veiculacaoEl = document.getElementById('veic-negociado-total');
  const producaoEl = document.getElementById('total-prod-total');
  
  const veiculacao = veiculacaoEl ? parseMoeda(veiculacaoEl.value) : 0;
  const producao = producaoEl ? parseMoeda(producaoEl.value) : 0;
  const total = veiculacao + producao;
  
  const resumoVeicEl = document.getElementById('resumo-veiculacao');
  const resumoProdEl = document.getElementById('resumo-producao');
  const resumoTotalEl = document.getElementById('resumo-total');
  
  if (resumoVeicEl) resumoVeicEl.value = formatarMoeda(veiculacao);
  if (resumoProdEl) resumoProdEl.value = formatarMoeda(producao);
  if (resumoTotalEl) resumoTotalEl.value = formatarMoeda(total);
}

function calcularUnitarios() {
  const qtdeTotalEl = document.getElementById('qtde-estado-total');
  const qtdeCarros = qtdeTotalEl ? parseFloat(qtdeTotalEl.value) : 1;
  
  if (qtdeCarros === 0) return; // Evitar divisão por zero
  
  const resumoVeicEl = document.getElementById('resumo-veiculacao');
  const resumoProdEl = document.getElementById('resumo-producao');
  
  const veiculacao = resumoVeicEl ? parseMoeda(resumoVeicEl.value) : 0;
  const producao = resumoProdEl ? parseMoeda(resumoProdEl.value) : 0;
  const total = veiculacao + producao;
  
  const unitVeiculacao = veiculacao / qtdeCarros;
  const unitProducao = producao / qtdeCarros;
  const unitTotal = total / qtdeCarros;
  
  const unitVeicEl = document.getElementById('unit-veiculacao');
  const unitProdEl = document.getElementById('unit-producao');
  const unitTotalEl = document.getElementById('unit-total');
  
  if (unitVeicEl) unitVeicEl.value = formatarMoeda(unitVeiculacao);
  if (unitProdEl) unitProdEl.value = formatarMoeda(unitProducao);
  if (unitTotalEl) unitTotalEl.value = formatarMoeda(unitTotal);
}

// ===== FUNÇÕES AUXILIARES DE FORMATAÇÃO =====
function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMoeda(texto) {
  if (!texto) return 0;
  const limpo = texto.toString().replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(limpo) || 0;
}

function parseDesconto(texto) {
  if (!texto) return 0;
  const limpo = texto.toString().replace('%', '').replace(',', '.');
  return parseFloat(limpo) || 0;
}

// ===== CAPTURAR PLANILHA COMO IMAGEM =====
async function capturarEContinuar() {
  try {
    showNotification('⏳ Capturando planilha...', 'info');
    
    const container = document.getElementById('planilha-container');
    
    const imagemBase64 = await gerarImagemPlanilha(container);
    
    // Extrair apenas os dados base64 (sem o prefixo data:image/png;base64,)
    const base64Data = imagemBase64.split(',')[1];
    
    // Salvar no proposalData como se fosse upload, no formato esperado pelo generator
    if (!proposalData.uploads) {
      proposalData.uploads = {};
    }
    
    proposalData.uploads['planilha'] = {
      data: base64Data,
      name: 'planilha-orcamento.png',
      type: 'image/png',
      size: base64Data.length,
      timestamp: new Date().toISOString()
    };
    
    // Salvar todo o estado
    localStorage.setItem('wizard_draft', JSON.stringify(getPersistableDraft()));
    
    showNotification('✅ Planilha capturada com sucesso!', 'success');
    
    // Navegar para Step3 (Uploads) para completar envio de imagens
    setTimeout(() => {
      window.location.href = 'Step3Uploads.html';
    }, 500);
    
  } catch (error) {
    console.error('❌ Erro ao capturar planilha:', error);
    showNotification('❌ Erro ao capturar planilha', 'error');
  }
}

// ===== SALVAR RASCUNHO =====
function salvarRascunho() {
  try {
    // Já salvamos proposalData no localStorage automaticamente
    localStorage.setItem('wizard_draft', JSON.stringify(getPersistableDraft()));
    showNotification('💾 Rascunho salvo com sucesso!', 'success');
  } catch (error) {
    console.error('❌ Erro ao salvar rascunho:', error);
    showNotification('❌ Erro ao salvar rascunho', 'error');
  }
}

// ===== NAVEGAÇÃO =====
function voltar() {
  window.location.href = 'Step2Produtos.html';
}

// ===== NOTIFICAÇÕES =====
function showNotification(message, type = 'info') {
  if (window.Notifications && typeof window.Notifications.show === 'function') {
    window.Notifications.show(message, type);
  } else {
    // Fallback simples
    const notifEl = document.createElement('div');
    notifEl.textContent = message;
    notifEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
      color: white;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notifEl);
    setTimeout(() => notifEl.remove(), 3000);
  }
}

async function gerarImagemPlanilha(container) {
  const scale = 4;
  const rect = container.getBoundingClientRect();
  
  if (window.domtoimage) {
    return domtoimage.toPng(container, {
      cacheBust: true,
      bgcolor: '#ffffff',
      width: rect.width * scale,
      height: rect.height * scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        fontFamily: "'Arial', sans-serif",
        WebkitFontSmoothing: 'antialiased',
        fontSmooth: 'always',
        imageRendering: 'optimizeQuality'
      }
    });
  }

  const canvas = await html2canvas(container, {
    scale: Math.min(4, Math.max(2, window.devicePixelRatio || 1) * 2),
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    allowTaint: true,
    imageTimeout: 0,
    removeContainer: false
  });

  return canvas.toDataURL('image/png');
}
