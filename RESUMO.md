# 📋 RESUMO - Projeto Preparado para GitHub e Deploy

## 🩹 Atualização 2025-12-09 — Deduplicação de propostas

- Corrigido fluxo que gerava cartões duplicados (rascunho + gerado) quando a mesma proposta era salva novamente.
- `Step6Gerar.js`: `saveProposal` agora atualiza se já existir `proposalData.id` ou `editing_proposal_id`, evitando criar um segundo registro.
- `main.js`: Store deduplica por `id` ao listar e, no create, substitui qualquer entrada existente com o mesmo `id`, mantendo só a versão mais recente.

### 🩹 Atualização 2025-12-09 — Placeholder {{planilha}}

- Quando o usuário escolhe “criar/editar planilha”, o base64 da planilha agora fica preservado no draft (Step3B e Step3Uploads), garantindo que o generator receba `uploads.planilha.data` mesmo se o cache IndexedDB não estiver disponível.
- Esperado: o placeholder `{{planilha}}` passa a ser substituído pela imagem capturada no Slides.

### Como testar rapidamente (desktop/Electron)
1) Abrir o app → criar nova proposta → avançar até gerar slides (sem duplicar uploads).
2) Voltar ao início do app: deve aparecer apenas **1** cartão para essa proposta.
3) Exportar PDF a partir do Step6: confirmar que continua apenas **1** cartão.
4) Excluir pelo card: somente aquele item deve sumir; nenhum card “espelho” deve permanecer.
5) (Opcional) Reabrir o app: a lista permanece deduplicada.

Se ainda vir duplicados, envie um print e, se possível, o conteúdo do `config.json` do electron-store para inspeção.

## ✅ O que foi feito

### 1. Segurança e Versionamento
- [x] `.gitignore` atualizado (protege credenciais, node_modules, builds)
- [x] `.env.example` criado sem credenciais reais
- [x] Verificação de arquivos sensíveis (nenhum será commitado)

### 2. Documentação
- [x] `README.md` completo com:
  - Stack tecnológica
  - Estrutura do projeto
  - Guia de instalação
  - Configuração do Google Cloud
  - Fluxo de uso (wizard de 6 etapas)
- [x] `DEPLOY.md` - Guia geral de deploy (Vercel, Heroku, AWS, etc.)
- [x] `GITHUB-SETUP.md` - Instruções rápidas para primeiro push
- [x] `RAILWAY-DEPLOY.md` - Tutorial detalhado Railway (recomendado)

---

## 🎯 Próximos Passos (Você Faz Agora)

### PASSO 1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome: `oddrive_orcamento_online`
3. Visibilidade: **Private** (projeto interno)
4. **NÃO** marque "Initialize with README"
5. Clique "Create repository"

### PASSO 2: Fazer Push do Código

Abra o terminal PowerShell na pasta do projeto:

```powershell
cd "D:\Clientes Agentes\OD Drive\Gerador de orçamento\Principal\projeto"

# Verificar o que será enviado
git status

# Adicionar todos os arquivos
git add .

# Commit inicial
git commit -m "Initial commit: Gerador de Orçamentos OD Drive"

# Conectar ao GitHub (use o SSH ou HTTPS que o GitHub mostrar)
git remote add origin https://github.com/pedromottanunes/oddrive_orcamento_online.git

# Fazer push
git push -u origin main
```

**Se pedir autenticação:**
- Use seu **Personal Access Token** (não senha)
- Crie em: https://github.com/settings/tokens

### PASSO 3: Me Passar o Link do Repositório

Depois do push, me envie:
- Link do repositório (ex: `https://github.com/pedromottanunes/oddrive_orcamento_online`)
- Se preferir deploy imediato, me passe também acesso ao Railway ou plataforma escolhida

---

## 🚀 Opções de Deploy (Após GitHub)

### Opção A: Railway (Recomendado) ⭐

**Por quê?**
- Setup rápido (5 minutos)
- Suporta processos longos (geração de PDF)
- PostgreSQL incluso
- Deploy automático do GitHub
- $5 grátis/mês

**Como:**
1. Acesse [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Selecione seu repositório
4. Configure variáveis de ambiente (copie do seu `.env`)
5. **Tutorial completo:** `RAILWAY-DEPLOY.md`

**Custo estimado:** $10-20/mês (uso moderado)

---

### Opção B: Vercel (Só frontend + Serverless)

**Por quê?**
- Grátis para projetos pessoais
- Deploy instantâneo
- HTTPS automático

**Limitação:**
- Funções serverless têm timeout de 10s (não ideal para PDF)

**Como:**
```bash
npm i -g vercel
vercel login
vercel
```

---

### Opção C: VPS Próprio (Digital Ocean, AWS EC2)

**Por quê?**
- Controle total
- Sem limitações de tempo de execução
- Mais barato em escala

**Como:**
- Consulte seção "AWS EC2" em `DEPLOY.md`

---

## 🔒 Checklist de Segurança (IMPORTANTE)

Após o push, verifique no GitHub:

❌ **NÃO DEVE ESTAR VISÍVEL:**
- `.env` (suas credenciais)
- `node_modules/`
- `dist/` ou builds
- `tmp/` (PDFs gerados)
- `PARAMETROS SECRETOS/`

✅ **DEVE ESTAR VISÍVEL:**
- `.env.example` (sem credenciais)
- Todo código fonte (`src/`, `main.js`, etc.)
- Documentação (READMEs)
- `.gitignore`

**Se o .env foi commitado por acidente:**

```bash
git rm --cached .env
git commit -m "Remove .env"
git push -f origin main
```

---

## 📚 Arquivos de Referência

| Arquivo | Conteúdo |
|---------|----------|
| `README.md` | Documentação geral do projeto |
| `DEPLOY.md` | Comparação de plataformas de deploy |
| `GITHUB-SETUP.md` | Comandos para primeiro push |
| `RAILWAY-DEPLOY.md` | Tutorial completo Railway (recomendado) |
| `.env.example` | Template de configuração |
| `.gitignore` | Arquivos que NÃO vão para o GitHub |

---

## 🤔 Dúvidas Frequentes

**P: Posso usar este projeto como está online?**
R: Precisa de algumas adaptações. O projeto é Electron (desktop). Para web:
- Remover dependências Electron
- Substituir electron-store por banco de dados
- Implementar autenticação de usuários

**P: Quanto custa hospedar?**
R: 
- Railway: ~$10-20/mês (uso moderado)
- Vercel: Grátis (mas com limitações)
- VPS: ~$5-10/mês (Digital Ocean)

**P: Meus PDFs ficam salvos onde no deploy?**
R: Railway não tem storage persistente. Opções:
1. Salvar no Google Drive (já integrado)
2. Usar AWS S3 (~$0.03/GB)
3. Usar Railway Volumes

**P: O OAuth vai funcionar online?**
R: Sim, mas você precisa:
1. Atualizar o callback URL no Google Console
2. Usar HTTPS (Railway fornece automaticamente)

---

## 🎯 Resumo do Resumo

**Agora faça:**

1. ✅ Crie repositório no GitHub (private)
2. ✅ Execute os comandos git para fazer push
3. ✅ Me envie o link do repositório
4. ⏳ Escolha plataforma de deploy (Railway recomendado)
5. ⏳ Configure variáveis de ambiente na plataforma
6. ⏳ Atualize OAuth callback no Google Console
7. ⏳ Teste a aplicação online

**Depois me avise e eu te ajudo com os próximos passos! 🚀**

---

**Arquivos criados nesta sessão:**
- `.gitignore` (atualizado)
- `.env.example` (sem credenciais)
- `README.md` (completo)
- `DEPLOY.md` (guia geral)
- `GITHUB-SETUP.md` (instruções rápidas)
- `RAILWAY-DEPLOY.md` (tutorial detalhado)
- `RESUMO.md` (este arquivo)
