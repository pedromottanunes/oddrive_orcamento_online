# Gerador de Orçamentos — OD Drive

Aplicativo desktop (Electron) usado pelo time comercial da OD Drive para gerar propostas em PDF a partir de um template no **Google Slides**. O sistema recebe os dados do cliente, imagens e mockups, duplica automaticamente o template, preenche os placeholders e exporta o PDF final.

## Stack

- **Electron** (main + renderer)
- **HTML/CSS/JS vanilla** nas telas do wizard
- **electron-store** para persistir as propostas localmente
- **Axios + Google Slides/Drive API** para duplicar o template e exportar o PDF
- **electron-builder** para empacotamento (NSIS)

## Pastas principais

```
projeto/
├── docs/                # Documentação (Google Slides, fluxo, arquitetura)
├── public/              # Ícone e assets estáticos
├── src/
│   ├── app/             # Páginas do wizard e workspace
│   ├── lib/google/      # Cliente/OAuth/Generator (Google Slides)
│   └── styles/          # Tema global
├── templates/           # (livre para armazenar PPTX/Slides de referência)
└── tmp/exports/         # PDFs gerados localmente
```

## Fluxo do usuário

1. **Workspace** – lista de propostas (criar, editar, excluir)
2. **Wizard** – 5 etapas:
   1. Dados do anunciante
   2. Seleção de produtos
   3. Uploads de imagens (logo, mockups, planilha, etc.)
   4. Checagem de requisitos
   5. **Gerar PDF** (integração com Google Slides)

Após a geração, o arquivo fica salvo em `tmp/exports/` e o ID da apresentação é armazenado junto à proposta.

## Integração Google Slides

O fluxo detalhado está em [`docs/GOOGLE-SLIDES.md`](./docs/GOOGLE-SLIDES.md), mas em resumo:

1. O usuário autoriza o app via OAuth (scopes `presentations` + `drive`).
2. O app duplica o template (`GOOGLE_TEMPLATE_PRESENTATION_ID`) para a pasta configurada.
3. Upload das imagens para o Drive, marcação como “anyone with the link”.
4. `batchUpdate` substituindo tokens de texto (`{{cliente_nome}}`) e imagem (`{{logo_anunciante}}`).
5. Exportação em PDF e gravação local.

Os placeholders de texto/imagem estão listados em [`src/lib/google/placeholders.js`](./src/lib/google/placeholders.js). Para adicionar novos campos basta editar esse arquivo e inserir o token correspondente no Slides.

## Como testar rapidamente

### 1. Script automático
```
TESTAR.bat   # ou TESTAR.ps1
```
Instala as dependências e abre o app em modo desenvolvimento (`npm run dev`).

### 2. Manual
```powershell
cd "D:\Clientes Agentes\OD Drive\Gerador de orçamento\Principal\projeto"
npm install
npm run dev
```

## Variáveis de ambiente

Veja `.env.example`. Principais chaves:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://127.0.0.1:8080/api/google/callback
GOOGLE_TEMPLATE_PRESENTATION_ID=
GOOGLE_PRESENTATIONS_FOLDER_ID=
GOOGLE_DRIVE_ASSETS_FOLDER_ID=
GOOGLE_SHARE_PRESENTATIONS=true
```

## Build

### Localmente

- **Windows:** `npm run build:win` (gera o instalador NSIS em `dist/*.exe`).
- **macOS:** `npm run build:mac` (gera `.dmg` e `.zip` em `dist/`). Precisa ser executado em um mac; o fluxo usa assinaturas desabilitadas (`CSC_IDENTITY_AUTO_DISCOVERY=false`), então basta arrastar o app para a pasta Aplicativos.

### GitHub Actions

O workflow [`build-desktop.yml`](.github/workflows/build-desktop.yml) executa automaticamente (`push` na `main`, tags `v*` ou manual via *workflow_dispatch*) e publica os artefatos:

1. **Windows job** (`windows-latest`) roda `npm ci` + `npm run build:win` e anexa o instalador `.exe`, `latest.yml` e `.blockmap` como artefato `od-drive-windows`.
2. **macOS job** (`macos-latest`) roda `npm ci` + `npm run build:mac` e envia `.dmg` + `.zip` como artefato `od-drive-macos`.

Basta abrir a aba *Actions* do GitHub, baixar o artefato correspondente e entregar ao cliente, sem depender do seu SO local.

## Documentação

- [`docs/GOOGLE-SLIDES.md`](./docs/GOOGLE-SLIDES.md) — fluxo completo da integração
- [`docs/fluxo.md`](./docs/fluxo.md) — passos do wizard e estados
- [`docs/arquitetura-desktop.md`](./docs/arquitetura-desktop.md) — visão do Electron + IPC
- [`COMO-TESTAR.md`](./COMO-TESTAR.md) — guia de QA/manual

---

> Desenvolvido para uso interno da OD Drive.


Textos:
{{cliente_nome}}
{{cliente_empresa}}
{{cliente_pracas}}
{{comercial_valor}}
{{comercial_data_inicio}}
{{comercial_tempo_dias}}
{{comercial_numero_carros}}


Imagens (coloque o token DENTRO da forma que será trocada):
{{logo_anunciante}} (upload key logo)
{{mock_lateral}} (upload key mock-lateral)
{{imagem_1}} (upload key imagem-1)
{{imagem_2}} (upload key imagem-2)
{{imagem_3}} (upload key imagem-3)
{{imagem_extra}} (upload key imagem-extra)
{{planilha}} (upload key planilha)
