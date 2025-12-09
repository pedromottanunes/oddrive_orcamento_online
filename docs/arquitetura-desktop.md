# Arquitetura Desktop (Resumo)

## Visão geral

```
┌─────────────┐    IPC    ┌───────────────┐
│ Renderer    │ <───────> │  Main Process │
│ (HTML/JS)   │           │ (Electron)    │
└─────────────┘           └───────────────┘
        │                         │
        │                         ├─ electron-store (proposals.json)
        │                         ├─ Google OAuth + Slides/Drive API
        │                         └─ File System (exports, uploads)
```

### Renderer

- Telas do wizard (`src/app/proposals/new/Step*.html/js`)
- Workspace e configurações (`src/app/index.html`, `src/app/settings`)
- Usa `window.electronAPI` (exposto em `preload.js`) para:
  - Listar/salvar propostas (`proposals:*`)
  - Abrir diálogos de arquivo (`files:select`)
  - Disparar geração via Google Slides (`slides:generate`)
  - Controlar o OAuth (`slides:startOAuth`, etc.)

### Main process (`main.js`)

- Carrega `.env`, cria janelas (splash + principal)
- Orquestra os IPC handlers:
  - `proposals:*` → electron-store
  - `files:*` → `dialog.showOpenDialog` / salvar em disco
  - `slides:*` → [`src/lib/google`](../src/lib/google/)
- Ao receber `slides:generate`, instancia `GoogleSlidesGenerator` e encaminha updates de progresso para o renderer.

### Módulos Google

`src/lib/google/` contém quatro responsabilidades:

1. **oauth-manager.js** – fluxo OAuth com PKCE + servidor local (`/api/slides/oauth/callback`)
2. **client.js** – chamadas REST (Drive copy/upload/permissions + Slides batchUpdate/export)
3. **placeholders.js** – lista de tokens (`{{logo_anunciante}}`, etc.)
4. **generator.js** – pipeline completo (copiar template → enviar imagens → substituir placeholders → exportar PDF)

Tokens e IDs necessários vêm das variáveis definidas no `.env`.

## Fluxo da geração

1. Renderer envia `slides:generate` com os dados completos da proposta.
2. Main verifica o token armazenado (ou dispara o OAuth).
3. `generator.js`:
   - Copia o template (`drive.files.copy`)
   - Sobe cada imagem para o Drive e torna o link público
   - Executa `presentations.batchUpdate` substituindo todos os tokens
   - Exporta o PDF (`drive.files.export`) e salva em `tmp/exports`
4. Renderer recebe `success`, atualiza os campos `googlePresentationId`, `googlePresentationUrl` e caminho do PDF.

## Armazenamento local

- As propostas ficam em `~\AppData\Roaming\od-drive-proposals\config.json`.
- Uploads selecionados no wizard são serializados em base64 e armazenados no draft (`wizard_draft` no `localStorage`) até a conclusão.
- PDFs ficam em `tmp/exports/` e podem ser abertos manualmente.

## Observações

- O `GOOGLE_REDIRECT_URI` precisa usar IP (ex.: `http://127.0.0.1:8080/api/slides/oauth/callback`).
- Para uso em produção, crie uma pasta específica no Drive para armazenar cópias do template e outra para os assets.
- Novos placeholders devem ser adicionados em `placeholders.js` e inseridos no template como `{{token}}`.
