# 🚀 Guia de Deploy - OD Drive Gerador de Orçamentos

## 📋 Índice

1. [Preparação do Repositório GitHub](#preparação-do-repositório-github)
2. [Deploy Online (Web Version)](#deploy-online-web-version)
3. [Opções de Hospedagem](#opções-de-hospedagem)
4. [Configuração de Produção](#configuração-de-produção)

---

## 🔧 Preparação do Repositório GitHub

### 1. Criar Repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Nome do repositório: `oddrive_orcamento_online`
3. Defina como **Private** (projeto interno)
4. **NÃO** inicialize com README (já existe no projeto)
5. Clique em "Create repository"

### 2. Conectar Repositório Local ao GitHub

```bash
# Inicializar git (se ainda não foi feito)
git init

# Adicionar remote (substitua pelo seu SSH ou HTTPS)
git remote add origin git@github.com:pedromottanunes/oddrive_orcamento_online.git
# ou
git remote add origin https://github.com/pedromottanunes/oddrive_orcamento_online.git

# Verificar arquivos que serão commitados
git status

# Adicionar todos os arquivos
git add .

# Commit inicial
git commit -m "Initial commit: Gerador de Orçamentos OD Drive"

# Push para o GitHub
git push -u origin main
```

### 3. Verificar o que NÃO deve ir para o GitHub

Confirme que estes arquivos/pastas estão no `.gitignore`:

```
✅ .env                    # Credenciais sensíveis
✅ node_modules/          # Dependências
✅ dist/                  # Build artifacts
✅ tmp/                   # Arquivos temporários
✅ data/                  # Dados locais
✅ PARAMETROS SECRETOS/   # Pasta com credenciais
✅ package-lock.json      # Lock file (opcional)
```

---

## 🌐 Deploy Online (Web Version)

### ⚠️ IMPORTANTE: Adaptações Necessárias

Este projeto foi desenvolvido como **aplicação Electron desktop**. Para rodar online como web app, são necessárias modificações significativas:

### Diferenças Principais

| Recurso | Desktop (Electron) | Web (Online) |
|---------|-------------------|--------------|
| Armazenamento | electron-store (local) | Banco de dados (PostgreSQL, MongoDB) |
| Autenticação | Não necessária | Sistema de login obrigatório |
| IPC | Electron IPC | API REST/GraphQL |
| OAuth Redirect | localhost:8080 | dominio.com/callback |
| Arquivos locais | Sistema de arquivos | Cloud Storage (S3, GCS) |

---

## 🏗️ Arquitetura para Deploy Web

### Opção 1: Migração Completa (Recomendado)

```
Frontend (React/Vue)  →  API Node.js/Express  →  Google APIs
       ↓                        ↓
   Vercel/Netlify        Railway/Heroku      PostgreSQL
                               ↓
                         AWS S3 (PDFs)
```

### Opção 2: Electron como Servidor (Temporário)

Rodar o Electron em modo "headless" em um servidor, mas **não é recomendado** para produção.

---

## 🚀 Opções de Hospedagem

### 1. **Vercel** (Frontend + Serverless)

**Prós**: Deploy automático do GitHub, HTTPS grátis, CDN global  
**Contras**: Limite de 10s por função serverless, não ideal para processos longos

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy para produção
vercel --prod
```

Configurar `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/server.js" }
  ],
  "env": {
    "GOOGLE_CLIENT_ID": "@google_client_id",
    "GOOGLE_CLIENT_SECRET": "@google_client_secret"
  }
}
```

### 2. **Railway** (Full Stack)

**Prós**: Suporta processos longos, banco PostgreSQL incluso, fácil setup  
**Contras**: Custo após free tier

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Criar projeto
railway init

# Deploy
railway up

# Adicionar variáveis de ambiente
railway variables set GOOGLE_CLIENT_ID=seu_valor
```

### 3. **Heroku** (Full Stack)

**Prós**: Tradicional, muitos add-ons disponíveis  
**Contras**: Free tier foi descontinuado

```bash
# Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Criar app
heroku create oddrive-orcamento

# Configurar variáveis
heroku config:set GOOGLE_CLIENT_ID=seu_valor

# Deploy
git push heroku main
```

### 4. **AWS EC2 / Digital Ocean Droplet** (Controle Total)

**Prós**: Controle completo, sem limitações  
**Contras**: Requer gerenciamento de servidor

```bash
# No servidor (Ubuntu 22.04)
sudo apt update
sudo apt install -y nodejs npm nginx

# Clone do projeto
git clone https://github.com/pedromottanunes/oddrive_orcamento_online.git
cd oddrive_orcamento_online

# Instalar dependências
npm install --production

# Configurar variáveis de ambiente
nano .env

# Rodar com PM2
npm install -g pm2
pm2 start main.js --name oddrive
pm2 startup
pm2 save
```

---

## 🔐 Configuração de Produção

### 1. Variáveis de Ambiente

**Nunca** commite o arquivo `.env` real. Use secrets da plataforma:

```bash
# Railway
railway variables set GOOGLE_CLIENT_ID=...

# Vercel
vercel env add GOOGLE_CLIENT_ID production

# Heroku
heroku config:set GOOGLE_CLIENT_ID=...
```

### 2. OAuth Callback URL

Atualize no Google Cloud Console:

```
Desenvolvimento: http://127.0.0.1:8080/api/slides/oauth/callback
Produção:       https://seudominio.com/api/slides/oauth/callback
```

### 3. HTTPS Obrigatório

Google OAuth **exige HTTPS** em produção. Todas as plataformas mencionadas fornecem HTTPS automático.

### 4. Banco de Dados

Substituir `electron-store` por banco real:

```bash
# PostgreSQL (Railway/Heroku)
npm install pg

# MongoDB (Atlas)
npm install mongodb mongoose
```

Exemplo de migração:

```javascript
// Antes (electron-store)
const store = new Store();
store.set('proposals', proposals);

// Depois (PostgreSQL)
await db.query('INSERT INTO proposals VALUES ($1)', [proposals]);
```

---

## 📊 Monitoramento

### Logs

```bash
# Railway
railway logs

# Heroku
heroku logs --tail

# PM2 (VPS)
pm2 logs oddrive
```

### Health Check

Adicione endpoint de health check:

```javascript
// server.js
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

---

## 🔄 CI/CD (Deploy Automático)

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm i -g @railway/cli
          railway up
```

---

## 📞 Próximos Passos

1. ✅ Criar repositório no GitHub
2. ✅ Fazer push do código
3. ⬜ Escolher plataforma de hospedagem
4. ⬜ Configurar variáveis de ambiente
5. ⬜ Atualizar OAuth callback URL
6. ⬜ Fazer deploy
7. ⬜ Testar em produção

---

## 🆘 Problemas Comuns

### "Cannot find module 'electron'"
- Em ambiente web, remova imports do Electron ou use variáveis condicionais

### "OAuth redirect_uri_mismatch"
- Verifique se o callback URL no `.env` corresponde ao configurado no Google Cloud

### "Port already in use"
- Use variável `process.env.PORT` fornecida pela plataforma

### Timeout em geração de PDF
- Configure timeout maior nas funções serverless
- Considere processar em background com queue (Bull/BeeQueue)

---

**Dúvidas?** Consulte a documentação da plataforma escolhida ou entre em contato com o time de desenvolvimento.
