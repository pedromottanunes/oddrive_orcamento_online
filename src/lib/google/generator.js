const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const GoogleSlidesClient = require('./client');
const { textPlaceholders, imagePlaceholders } = require('./placeholders');
const { calculateImpactMetrics } = require('../impactMetrics');
const {
  INTERNAL_PRODUCT_ID,
  EXTERNAL_PRODUCT_IDS,
  ALLOWED_PRODUCT_IDS,
  buildGoogleConfig
} = require('./config');

const EXTERNAL_PRODUCT_PLACEHOLDERS = [
  { id: 'od-vt', token: '{{produto2}}' },
  { id: 'od-drop', token: '{{produto3}}' },
  { id: 'od-pack', token: '{{produto4}}' },
  { id: 'od-full', token: '{{produto5}}' }
];

const STATIC_IMAGE_PATHS = {
  productHighlight: path.join(__dirname, '..', '..', 'assets', 'static', 'produto-destaque.png'),
  productTransparent: path.join(__dirname, '..', '..', 'assets', 'static', 'produto-transparente.png')
};

class GoogleSlidesGenerator {
  constructor(accessToken, configOverrides = {}) {
    this.client = new GoogleSlidesClient(accessToken);
    this.staticAssetCache = {};
    this.config = buildGoogleConfig(configOverrides);
  }

  async generateProposal(proposalData, onProgress = null, options = {}) {
    const { exportPdf = true } = options || {};
    const report = (progress, message) => {
      if (onProgress) onProgress(progress, message);
    };

    const templateId = this.resolveTemplateId(proposalData);
    if (!templateId) {
      throw new Error('Nenhum template do Google Slides foi configurado para esta seleção de produtos.');
    }

    try {
      report(5, 'Iniciando geração no Google Slides...');

      // 1. Copiar apresentação base
      report(15, 'Criando cópia da apresentação base...');
      const title = this.buildTitle(proposalData);
      const copy = await this.client.copyPresentation(
        templateId,
        title,
        this.config.presentationsFolderId
      );
      const presentationId = copy.id;

      if (!presentationId) {
        throw new Error('Falha ao criar cópia da apresentação template.');
      }

      if (this.config.publicShare) {
        await this.client.shareFilePublicly(presentationId);
      }

      report(25, 'Preparando placeholders...');
      this.ensureImpactMetrics(proposalData);
      this.ensureCurrentDateMetadata(proposalData);

      // 2. Construir requests de texto
      const requests = [];
      textPlaceholders.forEach((placeholder) => {
        const value = this.resolveTextValue(placeholder.source, proposalData);
        if (!value) return;
        requests.push({
          replaceAllText: {
            containsText: {
              text: placeholder.token,
              matchCase: false
            },
            replaceText: value
          }
        });
      });

      // 3. Upload de imagens
      const imageUploads = proposalData.uploads || {};
      if (imagePlaceholders.length) {
        report(40, 'Enviando imagens para o Google Drive...');
      }

      for (const placeholder of imagePlaceholders) {
        const uploadData = imageUploads[placeholder.uploadKey];
        if (!uploadData || !uploadData.data) {
          console.warn(`[Google Slides] Upload não encontrado para ${placeholder.uploadKey}`);
          continue;
        }

        try {
          let buffer = Buffer.from(uploadData.data, 'base64');

          if (placeholder.opacity !== undefined && placeholder.opacity < 1) {
            buffer = await this.applyOpacity(buffer, placeholder.opacity);
          }

          const filename = this.buildImageFilename(uploadData.name, placeholder);
            const driveFile = await this.client.uploadImage(
              buffer,
              filename,
              this.config.assetsFolderId
            );
          await this.client.shareFilePublicly(driveFile.id);
          const imageUrl = `https://drive.google.com/uc?export=view&id=${driveFile.id}`;

          requests.push({
            replaceAllShapesWithImage: {
              containsText: {
                text: placeholder.token,
                matchCase: false
              },
              imageUrl,
              imageReplaceMethod: 'CENTER_INSIDE'
            }
          });
        } catch (error) {
          console.error(`[Google Slides] Erro ao processar ${placeholder.uploadKey}:`, error.message);
        }
      }

      await this.applyProductPlaceholders(proposalData, requests);

      // 4. Aplicar atualizações
      report(55, 'Aplicando placeholders no Slides...');
      await this.client.batchUpdate(presentationId, requests);

      let localPdfPath = null;
      if (exportPdf) {
        report(80, 'Exportando PDF...');
        const pdfBuffer = await this.client.exportPresentationPdf(presentationId);
        localPdfPath = await this.savePdf(pdfBuffer, proposalData.id);
      } else {
        report(80, 'Apresentação pronta no Google Slides.');
      }

      report(95, 'Finalizando geração...');

      const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
      const result = {
        designId: presentationId,
        pdfUrl: null,
        localPdfPath,
        title,
        presentationUrl
      };

      report(100, 'Proposta gerada com sucesso!');
      return result;
    } catch (error) {
      console.error('[Google Slides] Erro ao gerar proposta:', error);
      throw error;
    }
  }

  buildTitle(proposalData) {
    const cliente = proposalData?.cliente?.nomeAnunciante || 'Cliente';
    const date = new Date().toISOString().split('T')[0];
    return `Proposta - ${cliente} - ${date}`;
  }

  resolveTextValue(source, proposalData) {
    if (!source) return null;
    const parts = source.split('.');
    let value = proposalData;
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined || value === null) {
        return null;
      }
    }
    return value.toString();
  }

  async savePdf(buffer, proposalId) {
    const outputDir = path.join(__dirname, '../../../tmp/exports');
    await fs.mkdir(outputDir, { recursive: true });
    const filename = `proposta-${proposalId || Date.now()}.pdf`;
    const outputPath = path.join(outputDir, filename);
    await fs.writeFile(outputPath, buffer);
    return outputPath;
  }

  resolveTemplateId(proposalData) {
    const selection = this.normalizeProductSelection(proposalData?.produtosSelecionados || []);
    const scenario = proposalData?.templateSelection || this.determineSelectionScenario(proposalData?.produtosSelecionados);
    const specificTemplate = this.resolveProductSpecificTemplate(selection);
    if (specificTemplate) {
      return specificTemplate;
    }

    if (scenario === 'external-only' && this.config.templateExternalFallbackId) {
      return this.config.templateExternalFallbackId;
    }

    if (scenario === 'combo' && this.config.templateComboFallbackId) {
      return this.config.templateComboFallbackId;
    }

    if (scenario === 'od-in-only') {
      const odinTemplate = this.config.templateProductIds?.[INTERNAL_PRODUCT_ID];
      if (odinTemplate) {
        return odinTemplate;
      }
    }

    return this.config.templatePresentationId;
  }

  resolveProductSpecificTemplate(selection) {
    if (!selection || !selection.length) return null;
    const templateMap = this.config.templateProductIds || {};
    const externalSelected = selection.find((id) => EXTERNAL_PRODUCT_IDS.includes(id));

    if (externalSelected && templateMap[externalSelected]) {
      return templateMap[externalSelected];
    }

    if (selection.length === 1 && selection[0] === INTERNAL_PRODUCT_ID) {
      return templateMap[INTERNAL_PRODUCT_ID] || null;
    }

    return null;
  }

  determineSelectionScenario(produtosSelecionados) {
    const ids = this.normalizeProductSelection(produtosSelecionados);
    if (!ids.length) return 'default';
    const hasInternal = ids.includes(INTERNAL_PRODUCT_ID);
    const externalCount = ids.filter(id => EXTERNAL_PRODUCT_IDS.includes(id)).length;

    if (hasInternal && ids.length === 1) return 'od-in-only';
    if (!hasInternal && ids.length === 1 && externalCount === 1) return 'external-only';
    if (hasInternal && externalCount === 1 && ids.length === 2) return 'combo';
    if (!hasInternal && externalCount >= 1) return 'external-only';

    return 'default';
  }

  normalizeProductSelection(produtosSelecionados) {
    if (!Array.isArray(produtosSelecionados)) return [];
    const normalized = [];

    produtosSelecionados.forEach(item => {
      if (!item) return;
      const id = typeof item === 'string' ? item : item.id;
      if (!id || !ALLOWED_PRODUCT_IDS.includes(id)) return;
      if (normalized.includes(id)) return;
      if (normalized.length >= 2) return;
      normalized.push(id);
    });

    return normalized;
  }

  async applyProductPlaceholders(proposalData, requests) {
    if (!Array.isArray(requests)) return;
    const selection = this.normalizeProductSelection(proposalData?.produtosSelecionados || []);
    const selectedExternal = new Set(selection.filter(id => EXTERNAL_PRODUCT_IDS.includes(id)));
    const transparentUrl = await this.getStaticAssetUrl('productTransparent', STATIC_IMAGE_PATHS.productTransparent);
    let highlightUrl = null;

    if (selectedExternal.size) {
      highlightUrl = await this.getStaticAssetUrl('productHighlight', STATIC_IMAGE_PATHS.productHighlight);
    }

    if (!transparentUrl) return;

    for (const mapping of EXTERNAL_PRODUCT_PLACEHOLDERS) {
      const imageUrl = (selectedExternal.has(mapping.id) && highlightUrl) ? highlightUrl : transparentUrl;
      requests.push({
        replaceAllShapesWithImage: {
          containsText: {
            text: mapping.token,
            matchCase: false
          },
          imageUrl,
          imageReplaceMethod: 'CENTER_INSIDE'
        }
      });
    }
  }

  async getStaticAssetUrl(cacheKey, filePath) {
    if (this.staticAssetCache[cacheKey]) {
      return this.staticAssetCache[cacheKey];
    }

    try {
      const buffer = await fs.readFile(filePath);
      const filename = path.basename(filePath);
      const driveFile = await this.client.uploadImage(
        buffer,
        filename,
        this.config.assetsFolderId
      );
      await this.client.shareFilePublicly(driveFile.id);
      const imageUrl = `https://drive.google.com/uc?export=view&id=${driveFile.id}`;
      this.staticAssetCache[cacheKey] = imageUrl;
      return imageUrl;
    } catch (error) {
      console.error(`[Google Slides] Falha ao enviar ativo estático (${cacheKey}):`, error.message);
      return null;
    }
  }

  buildImageFilename(originalName, placeholder) {
    const parsed = originalName ? path.parse(originalName) : null;
    const baseName = parsed?.name || placeholder.uploadKey || 'imagem';
    const suffix = (placeholder.opacity !== undefined && placeholder.opacity < 1) ? '-transparente' : '';
    return `${baseName}${suffix}.png`;
  }

  async applyOpacity(buffer, opacityValue) {
    const opacity = Math.max(0, Math.min(1, opacityValue));
    if (opacity >= 0.999) {
      return buffer;
    }

    return sharp(buffer)
      .ensureAlpha()
      .linear([1, 1, 1, opacity], [0, 0, 0, 0])
      .png()
      .toBuffer();
  }

  ensureImpactMetrics(proposalData) {
    const dias = proposalData?.comercial?.tempoCampanhaDias || 0;
    const carros = proposalData?.comercial?.numeroCarros || 0;
    proposalData.impacto = calculateImpactMetrics(dias, carros);
  }

  async exportExistingPdf(presentationId) {
    if (!presentationId) {
      throw new Error('ID da apresentação não informado.');
    }
    return this.client.exportPresentationPdf(presentationId);
  }

  ensureCurrentDateMetadata(proposalData) {
    if (!proposalData) return;
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const today = new Date();
    const dia = today.getDate();
    const mes = months[today.getMonth()] || '';
    proposalData.metadata = proposalData.metadata || {};
    proposalData.metadata.dataHojeFormatada = `${dia} de ${mes}`;
  }
}

module.exports = GoogleSlidesGenerator;
