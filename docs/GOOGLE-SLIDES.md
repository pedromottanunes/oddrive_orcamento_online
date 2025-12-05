# Integração Google Slides / Drive

Este documento resume o fluxo utilizado pelo aplicativo desktop para gerar o orçamento final a partir de um template no **Google Slides**.

## 1. Pré-requisitos

- Projeto cadastrado no [Google Cloud](https://console.cloud.google.com/) com as APIs **Slides** e **Drive** habilitadas.
- Credenciais OAuth do tipo **Desktop** (`GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`).
- Template base no Google Slides (ID em `GOOGLE_TEMPLATE_PRESENTATION_ID`).
- Pastas no Drive para armazenar as apresentações copiadas e os assets enviados (`GOOGLE_PRESENTATIONS_FOLDER_ID`, `GOOGLE_DRIVE_ASSETS_FOLDER_ID`).

### Placeholders no Slides

No template, substitua tudo que for dinâmico por tokens de texto, por exemplo:

- `{{logo_anunciante}}`
- `{{mock_lateral}}`
- `{{cliente_nome}}`
- `{{comercial_valor}}`

O aplicativo procura esses tokens usando `ReplaceAllTextRequest` e `ReplaceAllShapesWithImageRequest`. Para imagens, basta inserir uma forma qualquer (retângulo) com o token dentro dela — ela será substituída pela imagem enviada pelo usuário.

## 2. Fluxo de geração

1. **Duplicar template**  
   - `POST https://www.googleapis.com/drive/v3/files/{templateId}/copy`  
   - Guarda o `presentationId` retornado e, se configurado, move o arquivo para `GOOGLE_PRESENTATIONS_FOLDER_ID`.

2. **Upload das imagens**  
   - Para cada placeholder de imagem, o app usa `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`.  
   - Após o upload, aplica `permissions.create` (`type=anyone`, `role=reader`) e monta a URL `https://drive.google.com/uc?export=view&id={fileId}`.

3. **Batch Update**  
   - `POST https://slides.googleapis.com/v1/presentations/{presentationId}:batchUpdate` com os requests:
     - `replaceAllText` para cada token de texto.
     - `replaceAllShapesWithImage` para cada token de imagem usando as URLs anteriores.

4. **Exportar PDF**  
   - `GET https://www.googleapis.com/drive/v3/files/{presentationId}/export?mimeType=application/pdf`  
   - Salva o binário em `tmp/exports/proposta-{id}.pdf`.

## 3. Escopos OAuth utilizados

```
https://www.googleapis.com/auth/presentations
https://www.googleapis.com/auth/drive
```

Esses escopos permitem copiar o template, criar arquivos em pastas específicas, atualizar slides e exportar o PDF.

## 4. Variáveis de ambiente

Veja `.env.example` para a lista completa:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://127.0.0.1:8080/api/google/callback
GOOGLE_TEMPLATE_PRESENTATION_ID=
GOOGLE_PRESENTATIONS_FOLDER_ID=
GOOGLE_DRIVE_ASSETS_FOLDER_ID=
GOOGLE_SHARE_PRESENTATIONS=true
```

## 5. Testes rápidos

1. Abra a tela **Configurações** e clique em “Conectar com Google Slides”.
2. Autorize o aplicativo no navegador.
3. Carregue um orçamento no wizard até a etapa 5 e clique em **Gerar PDF**.
4. Verifique o arquivo em `tmp/exports/` e a nova apresentação em `https://docs.google.com/presentation/d/{presentationId}/edit`.
