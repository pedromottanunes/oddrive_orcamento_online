# Fluxo do Wizard

```
[Splash] → [Workspace] → [Wizard Etapas 1–5] → [Google Slides] → [PDF salvo]
```

## Wizard

1. **Dados do anunciante**  
   - Campos obrigatórios: nome, empresa, praças, contatos.
   - Persistidos no `localStorage` enquanto o usuário navega.

2. **Produtos**  
   - Seleção de pacotes (OD Drop, OD VT, etc.).
   - As escolhas definem textos e imagens exibidos nas próximas etapas.

3. **Uploads**  
   - Slots fixos (`logo`, `mock-lateral`, `imagem-1`, etc.) + slots dinâmicos por produto.
   - Cada slot guarda `{ name, path, data(base64) }`.

4. **Checagem**  
   - Checklist de requisitos (todos os campos preenchidos? todos os uploads obrigatórios?).
   - Só habilita o botão “Gerar PDF” quando tudo estiver verde.

5. **Gerar PDF**  
   - Dispara `slides:generate` no main process.
   - Mostra barra de progresso e ações finais (abrir pasta, iniciar nova proposta).

## Placeholders suportados

Definidos em [`src/lib/google/placeholders.js`](../src/lib/google/placeholders.js).  
Use os tokens exatos no template do Google Slides:

| Tipo | Token | Fonte |
|------|-------|-------|
| Texto | `{{cliente_nome}}` | `proposalData.cliente.nomeAnunciante` |
| Texto | `{{comercial_valor}}` | `proposalData.comercial.valor` |
| Imagem | `{{logo_anunciante}}` | slot `logo` |
| Imagem | `{{mock_lateral}}` | slot `mock-lateral` |
| ... | ... | ... |

É possível adicionar novos tokens editando o arquivo de placeholders e atualizando o template.

## Resultado

- **PDF local**: `tmp/exports/proposta-{id}.pdf`
- **Apresentação duplicada**: `https://docs.google.com/presentation/d/{googlePresentationId}/edit`
- **Registro da proposta**: `googlePresentationId`, `googlePresentationUrl`, `pdfPath`, `status=completed`.
