# ✅ Como Testar o Aplicativo (Desktop)

## 1. Script automático

### `TESTAR.bat`
1. Navegue até a pasta do projeto.
2. Dê **duplo clique** em `TESTAR.bat`.
3. O script instala dependências e executa `npm run dev`.

### `TESTAR.ps1`
1. Clique com o botão direito no arquivo e escolha **Executar com PowerShell**.
2. Caso o Windows bloqueie scripts, rode (apenas uma vez):
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```

## 2. Fluxo manual

```powershell
cd "D:\Clientes Agentes\OD Drive\Gerador de orçamento\Principal\projeto"
npm install
npm run dev
```

### Gerar instalador
```
npm run build:win
```
O instalador será criado em `dist/OD Drive - Gerador de Orçamentos Setup.exe`.

---

## Requisitos

- **Windows 10/11 (64 bits)**
- **Node.js 18+**
- Conexão com a internet (para autenticar no Google Slides/Drive)

---

## Funcionalidades disponíveis

- Workspace com cards de propostas
- CRUD completo (criar, editar, duplicar, excluir)
- Wizard com 5 etapas (dados → produtos → uploads → checagem → geração)
- Integração **Google Slides** para duplicar o template e exportar o PDF

---

## Passos de QA sugeridos

1. Abrir o app `npm run dev`.
2. Na tela **Configurações**, clicar em **“Conectar com Google Slides”** e autorizar.
3. Criar uma proposta via wizard (envie imagens fictícias para todos os slots).
4. No passo 5, clicar em **Gerar PDF** e aguardar o download.
5. Confirmar:
   - PDF salvo em `tmp/exports/`.
   - Registro da proposta atualizado com `googlePresentationId`.
   - Apresentação duplicada disponível em `https://docs.google.com/presentation/d/{id}/edit`.

---

## Solução de problemas

| Erro | Como resolver |
|------|---------------|
| `Node.js não encontrado` | Instale via https://nodejs.org/ |
| `npm install` falha | Verifique internet / rode `npm cache clean --force` |
| OAuth abre página em branco | Confirme se o redirect de `.env` é `http://127.0.0.1:8080/api/slides/oauth/callback` |
| Export trava em 401 | Refazer a conexão na tela Configurações |

---

## Documentação útil

- [Integração Google Slides](./docs/GOOGLE-SLIDES.md)
- [Fluxo completo do wizard](./docs/fluxo.md)
- [Arquitetura Electron](./docs/arquitetura-desktop.md)
