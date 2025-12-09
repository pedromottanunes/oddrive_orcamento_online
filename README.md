# 📊 Gerador de Orçamentos — OD Drive

Aplicação desktop Electron para gerar propostas comerciais automatizadas em Google Slides e exportá-las em PDF. Sistema completo com wizard de 6 etapas, editor de planilha integrado e integração direta com Google Drive.

## 🚀 Stack Tecnológica

- **Electron** - Aplicação desktop cross-platform
- **Node.js** - Runtime backend
- **Google Slides/Drive API** - Integração para geração de apresentações
- **OAuth 2.0 PKCE** - Autenticação segura com Google
- **HTML/CSS/JS vanilla** - Interface do usuário
- **html2canvas** - Captura de planilhas
- **electron-store** - Persistência local
- **Axios** - Cliente HTTP para APIs Google

## 📁 Estrutura do Projeto

```
projeto/
├── main.js                   # Processo principal do Electron
├── preload.js                # Script de ponte segura entre main e renderer
├── package.json              # Dependências e scripts
├── .env                      # Configurações sensíveis (não versionado)
├── .env.example              # Template de configuração
│
├── src/
│   ├── app/                  # Páginas HTML do workspace e wizard
│   │   ├── index.html        # Tela principal (lista de propostas)
│   │   └── proposals/new/    # Wizard de 6 etapas
│   │       ├── Step1Dados.html           # Dados do cliente
│   │       ├── Step2Produtos.html        # Seleção de produtos
│   │       ├── Step3B-EditarPlanilha.*  # Editor de planilha inline
│   │       ├── Step3Uploads.html         # Upload de 9 imagens
│   │       ├── Step4Mapeamento.html      # Validação final
│   │       └── Step6Gerar.html           # Geração e export
│   │
│   ├── lib/
│   │   ├── google/           # Integração Google Slides/Drive
│   │   │   ├── oauth-manager.js  # Gerenciador OAuth PKCE
│   │   │   ├── generator.js      # Orquestrador de geração
│   │   │   └── client.js         # Cliente REST Google APIs
│   │   ├── store.ts          # Electron-store wrapper
│   │   └── notifications.js  # Sistema de notificações
│   │
│   └── styles/               # CSS global e temas
│
├── templates/
│   └── canva/                # Templates JSON dos slides (11 slides)
│
├── tmp/
│   └── exports/              # PDFs gerados localmente
│
└── docs/                     # Documentação técnica
    ├── arquitetura-desktop.md
    ├── fluxo.md
    └── canva-integracao.md
```

## 🛠️ Instalação e Configuração

### Pré-requisitos

- **Node.js 16+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Conta Google Cloud** com APIs ativadas

### 1. Clone o Repositório

```bash
git clone https://github.com/pedromottanunes/oddrive_orcamento_online.git
cd oddrive_orcamento_online
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

```bash
# Copie o template
cp .env.example .env
```

Edite o arquivo `.env` e preencha suas credenciais:

```env
# Google OAuth (obtenha em: https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8080/api/slides/oauth/callback

# IDs dos Templates do Google Slides
GOOGLE_TEMPLATE_ODIN_ID=1QMX_...seu_template_id
GOOGLE_TEMPLATE_OD_VT_ID=1Gdwo...seu_template_id
# ... outros templates

# IDs das Pastas do Google Drive
GOOGLE_PRESENTATIONS_FOLDER_ID=sua_pasta_apresentacoes
GOOGLE_DRIVE_ASSETS_FOLDER_ID=sua_pasta_uploads

# Configurações
PORT=8080
NODE_ENV=development
```

### 4. Configure o Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative as APIs:
   - Google Slides API
   - Google Drive API
4. Crie credenciais OAuth 2.0:
   - Tipo: **Aplicativo para desktop**
   - Adicione URI de redirecionamento: `http://127.0.0.1:8080/api/slides/oauth/callback`
5. Copie o **Client ID** e **Client Secret** para o `.env`

### 5. Execute o Aplicativo

```bash
# Modo desenvolvimento
npm run dev

# Compilar para produção
npm run build

# Rodar aplicativo compilado
npm start
```

## 📋 Fluxo de Uso

### Wizard de 6 Etapas

1. **Step 1 - Dados do Cliente**
   - Nome do anunciante e empresa
   - Praças (cidades)
   - Dados comerciais (pagamento, número de carros, datas, validade)

2. **Step 2 - Seleção de Produtos**
   - Escolha entre: ODIN, OD VT, OD Drop, OD Pack, OD Full
   - Define qual template será usado na geração

3. **Step 3B - Editar Planilha** (Opcional)
   - Editor inline com tabelas dinâmicas
   - Cálculos automáticos (veiculação, produção, praças)
   - Captura via html2canvas e salva como upload

4. **Step 3 - Uploads**
   - 9 slots de imagem: logo, mocks laterais, mapa, rotas, ODIM, traseiro, planilha, mockups
   - Validação de formato e tamanho
   - Armazenamento em base64

5. **Step 4 - Mapeamento e Validação**
   - Checklist automático de requisitos
   - Validação de campos obrigatórios
   - Preview dos dados antes da geração

6. **Step 6 - Geração Final**
   - Cria apresentação no Google Slides (duplica template)
   - Substitui placeholders de texto e imagem
   - Exporta PDF em alta qualidade
   - Botões para abrir PDF e pasta local

### Integração Google Slides

- **OAuth Flow**: PKCE com servidor HTTP local temporário
- **Geração**: 
  1. Copia template base do Google Slides
  2. Faz upload das imagens para o Google Drive
  3. Substitui tokens de texto (`{{cliente_nome}}`, etc.)
  4. Substitui tokens de imagem via `replaceImage` API
  5. Exporta PDF via Drive API
- **Armazenamento**: Tokens salvos em electron-store, propostas em localStorage

## 🔒 Segurança e Boas Práticas

- ✅ Arquivo `.env` nunca é versionado (incluído no `.gitignore`)
- ✅ Credenciais OAuth armazenadas localmente via electron-store
- ✅ Tokens de refresh automáticos com verificação de expiração
- ✅ IPC seguro entre main e renderer process (via `contextBridge`)
- ✅ CSP (Content Security Policy) configurada no Electron
- ⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env` real com suas credenciais

## 🚢 Deploy e Distribuição

### Build Local (Executável)

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Os executáveis serão gerados na pasta `dist/`.

### Deploy Online (Web Version)

**Nota**: Este projeto foi originalmente desenvolvido como aplicação Electron desktop. Para deploy web, são necessárias adaptações:

1. **Remover dependências Electron**:
   - Substituir `electron-store` por banco de dados (MongoDB, PostgreSQL)
   - Implementar autenticação de usuários
   - Migrar IPC para API REST endpoints

2. **Plataformas recomendadas**:
   - **Vercel/Netlify**: Para frontend estático + Serverless Functions
   - **Heroku/Railway**: Para aplicação Node.js completa
   - **AWS EC2/Digital Ocean**: Para controle total do servidor

3. **Modificações necessárias**:
   - Converter `main.js` para servidor Express
   - Implementar sessões e autenticação JWT
   - Configurar variáveis de ambiente na plataforma
   - Setup de HTTPS obrigatório para OAuth

4. **Exemplo de estrutura para deploy web**:

```bash
# Instalar dependências adicionais
npm install express express-session passport passport-google-oauth20

# Criar servidor Express
# (Ver documentação em docs/deploy-web.md para guia completo)
```


### Deploy on Render

1. Go to https://render.com and sign in with your GitHub account.
2. Click "New" → "Web Service".
3. Select the repository: `pedromottanunes/oddrive_orcamento_online` and branch `main`.
4. Render will auto-detect a Node.js project. Use the following settings if prompted:
    - Build Command: `npm install`
    - Start Command: `npm start`
5. Add the required environment variables (see list below) in Render's dashboard under the service settings.
6. Deploy — Render will build and start the `server/index.js` web service.

Notes:
- The project includes a `render.yaml` manifest to speed up creation of the Web Service.
- Keep your Google OAuth client secret and other sensitive values in Render's environment variables (do not commit them to the repo).

Environment variables required (set these in Render):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (if used; for PKCE the app uses the server callback URL)
- `GOOGLE_DRIVE_ASSETS_FOLDER_ID` (folder where uploads are stored)
- `EXPORTS_PATH` (optional; default `./tmp/exports`)
- Any other variables referenced in your local `.env`

### Deploy via Docker (Opcional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

```bash
docker build -t oddrive-orcamento .
docker run -p 8080:8080 --env-file .env oddrive-orcamento
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste as chaves:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://127.0.0.1:5173/api/slides/oauth/callback
GOOGLE_TEMPLATE_PRESENTATION_ID=
GOOGLE_PRESENTATIONS_FOLDER_ID=
GOOGLE_DRIVE_ASSETS_FOLDER_ID=
GOOGLE_SHARE_PRESENTATIONS=true
PORT=5173
```

> *Dica:* como a aplicação roda apenas localmente, não há problema em utilizar uma OAuth “Desktop” ou “Web” para testes, desde que o redirect esteja liberado.

## Próximos passos sugeridos

- [ ] Proteger o arquivo `server/data/app-data.json` com backup automático (Git, S3 etc.).
- [ ] Adicionar autenticação simples (Basic Auth) caso o servidor seja exposto fora da rede interna.
- [ ] Implementar SSE/websocket para feedback em tempo real durante a geração dos Slides.

---

Desenvolvido para uso interno da OD Drive. A nova base web elimina a dependência de instaladores (Windows/Mac) sem alterar o fluxo que já era utilizado pelo time.*** End Patch***"} to=functions.apply_patch
