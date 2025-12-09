# ☁️ Deploy Railway - Guia Passo a Passo

**Railway é a opção mais simples para este projeto** - suporta processos longos, PostgreSQL incluso, e deploy automático do GitHub.

---

## 🚀 Setup Rápido (5 minutos)

### 1. Criar Conta no Railway

1. Acesse [railway.app](https://railway.app/)
2. Clique em "Start a New Project"
3. Login com GitHub (recomendado)

### 2. Criar Novo Projeto

```bash
# Opção A: Via Interface Web
1. Dashboard → "New Project"
2. Escolha "Deploy from GitHub repo"
3. Selecione: pedromottanunes/oddrive_orcamento_online
4. Railway detecta automaticamente que é Node.js

# Opção B: Via CLI
npm install -g @railway/cli
railway login
railway init
railway link
```

### 3. Configurar Variáveis de Ambiente

No dashboard do Railway:

```
Settings → Variables → Raw Editor → Cole:
```

```env
NODE_ENV=production
PORT=8080

# Google OAuth
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URI=https://seu-projeto.up.railway.app/api/slides/oauth/callback

# Template IDs
GOOGLE_TEMPLATE_ODIN_ID=1QMX_...
GOOGLE_TEMPLATE_OD_VT_ID=1Gdwo...
GOOGLE_TEMPLATE_OD_DROP_ID=1qPkc...
GOOGLE_TEMPLATE_OD_PACK_ID=1SsX-...
GOOGLE_TEMPLATE_OD_FULL_ID=1Yzu...

# Google Drive Folders
GOOGLE_PRESENTATIONS_FOLDER_ID=1d0PfCcye...
GOOGLE_DRIVE_ASSETS_FOLDER_ID=10_v5oRGm...
GOOGLE_SHARE_PRESENTATIONS=true

# App Config
APP_NAME=OD Drive - Gerador de Orçamentos
APP_VERSION=1.0.0

# Paths (Railway provisiona automaticamente)
STORAGE_PATH=/app/data/proposals
EXPORTS_PATH=/app/tmp/exports
UPLOADS_PATH=/app/tmp/uploads
```

### 4. Adicionar Banco de Dados (Opcional)

Se você migrar de electron-store para banco real:

```bash
# No dashboard Railway
1. Clique em "+ New"
2. Escolha "Database" → "PostgreSQL"
3. Railway gera automaticamente DATABASE_URL
4. Instale no projeto:
   npm install pg
```

### 5. Configurar Build

Railway detecta `package.json` automaticamente, mas você pode customizar:

```
Settings → Build Command:
npm install

Settings → Start Command:
npm start
```

### 6. Obter URL do Deploy

Após o deploy:

```
Settings → Domains → Generate Domain
```

Sua URL será algo como: `https://oddrive-orcamento-production.up.railway.app`

### 7. Atualizar Google OAuth Callback

No [Google Cloud Console](https://console.cloud.google.com/):

```
APIs & Services → Credentials → Seu OAuth Client
Adicione URL de redirecionamento:
https://oddrive-orcamento-production.up.railway.app/api/slides/oauth/callback
```

---

## 📁 Estrutura de Arquivos para Deploy

Crie `railway.json` (opcional, para configurações avançadas):

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Crie `Procfile` (se quiser usar Heroku-style):

```
web: node main.js
```

---

## 🔄 Deploy Automático

Após configurar:

```bash
# Qualquer push para main dispara deploy automático
git add .
git commit -m "Update feature X"
git push origin main

# Railway detecta, builda e deploya automaticamente
```

---

## 📊 Monitoramento

### Ver Logs em Tempo Real

```bash
# Via CLI
railway logs

# Via Web
Dashboard → Deployments → View Logs
```

### Métricas

```
Dashboard → Metrics
- CPU Usage
- Memory Usage
- Network Traffic
```

---

## 💾 Persistência de Arquivos

**PROBLEMA:** Railway não tem storage persistente por padrão!

### Soluções:

**Opção 1: Usar Volume Persistente (Railway Volumes)**

```bash
railway volume create --name pdfs --mount-path /app/tmp/exports
```

**Opção 2: Usar AWS S3 / Google Cloud Storage**

```bash
npm install @aws-sdk/client-s3

# Adicionar variáveis
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=oddrive-pdfs
AWS_REGION=us-east-1
```

Código de exemplo:

```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({ region: process.env.AWS_REGION });

async function uploadPdfToS3(pdfBuffer, fileName) {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `pdfs/${fileName}`,
    Body: pdfBuffer,
    ContentType: 'application/pdf'
  }));
}
```

**Opção 3: Armazenar no Google Drive**

(Já tem integração - aproveite!)

---

## 🔧 Modificações Necessárias no Código

### 1. Substituir electron-store

**Antes:**

```javascript
const Store = require('electron-store');
const store = new Store();
store.set('proposals', data);
```

**Depois (PostgreSQL):**

```javascript
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(
  'INSERT INTO proposals (id, data) VALUES ($1, $2)',
  [id, JSON.stringify(data)]
);
```

### 2. Remover Dependências Electron

No `package.json`, mova electron para devDependencies:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "electron": "^28.0.0"
  }
}
```

### 3. Criar Servidor Express

Crie `server.js`:

```javascript
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('src/app'));
app.use(express.json({ limit: '50mb' }));

// Importar rotas existentes
// ... suas rotas aqui

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Atualizar `package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

---

## 💰 Custos

Railway oferece:

- **$5 grátis por mês** (uso pessoal)
- **$0.000231/GB-hora** para recursos adicionais
- **$0.20/GB** de saída de rede

Estimativa para este projeto:
- **~$10-20/mês** (uso moderado)
- **~$50-100/mês** (uso intenso com muitas gerações)

---

## 🆘 Troubleshooting Railway

### Deploy falha com "Module not found"

```bash
# Certifique-se que package.json tem todas as dependências
npm install --save axios express form-data

# Commite e push
git add package.json package-lock.json
git commit -m "Fix dependencies"
git push
```

### Timeout ao gerar PDF

```javascript
// Aumentar timeout do Express
app.use(timeout('300s')); // 5 minutos
```

### Memória insuficiente

```
Settings → Resources
- Upgrade para plan com mais RAM
- Ou otimize imagens antes do upload
```

### OAuth redirect não funciona

```
Verifique:
1. GOOGLE_REDIRECT_URI no Railway
2. URL autorizada no Google Console
3. HTTPS está ativo (Railway fornece automaticamente)
```

---

## ✅ Checklist Final

Antes de ir para produção:

- [ ] Variáveis de ambiente configuradas
- [ ] OAuth callback atualizado no Google
- [ ] Banco de dados configurado (se necessário)
- [ ] Storage de arquivos definido (S3/GCS/Volume)
- [ ] Logs monitorados
- [ ] Testes de geração de PDF realizados
- [ ] Backup configurado
- [ ] Domínio customizado (opcional)

---

## 🌐 Domínio Customizado

```bash
# Compre domínio (Namecheap, GoDaddy, etc.)
# No Railway:
Settings → Domains → Custom Domain
Digite: orcamentos.oddrive.com

# No seu provedor DNS:
CNAME orcamentos → seu-projeto.up.railway.app
```

---

**Deploy concluído? Teste em:** https://seu-projeto.up.railway.app

🎉 **Parabéns! Aplicação online e funcionando!**
