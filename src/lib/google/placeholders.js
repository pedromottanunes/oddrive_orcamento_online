module.exports = {
  textPlaceholders: [
    { token: '{{cliente_nome}}', source: 'cliente.nomeAnunciante', description: 'Nome do anunciante' },
    { token: '{{cliente_empresa}}', source: 'cliente.nomeEmpresa', description: 'Nome da empresa/agência' },
    { token: '{{cliente_pracas}}', source: 'cliente.pracas', description: 'Lista de praças' },
    { token: '{{comercial_valor}}', source: 'comercial.valor', description: 'Valor total negociado' },
    { token: '{{comercial_data_inicio}}', source: 'comercial.dataInicio', description: 'Data de início da campanha' },
    { token: '{{comercial_tempo_dias}}', source: 'comercial.tempoCampanhaDias', description: 'Duração da campanha em dias' },
    { token: '{{comercial_numero_carros}}', source: 'comercial.numeroCarros', description: 'Quantidade de carros' },
    { token: '{{corridas}}', source: 'impacto.corridasFormatado', description: 'Total estimado de corridas' },
    { token: '{{passageiros_transportados}}', source: 'impacto.passageirosTransportadosFormatado', description: 'Passageiros impactados' },
    { token: '{{km_percorridos}}', source: 'impacto.kmPercorridosFormatado', description: 'Quilômetros percorridos' },
    { token: '{{impactos_possiveis}}', source: 'impacto.impactosPossiveisFormatado', description: 'Impactos possíveis estimados' },
    { token: '{{datadehoje}}', source: 'metadata.dataHojeFormatada', description: 'Data atual no formato “5 de dezembro”' }
  ],
  imagePlaceholders: [
    { token: '{{logo_anunciante}}', uploadKey: 'logo', description: 'Logo do anunciante' },
    { token: '{{mock_lateral}}', uploadKey: 'mock-lateral', description: 'Mock lateral (carro)' },
    { token: '{{mock_lateral_transparente}}', uploadKey: 'mock-lateral', description: 'Mock lateral como marca d\'agua', opacity: 0.2 },
    { token: '{{mock_mapa}}', uploadKey: 'mock-mapa', description: 'Mock Mapa' },
    { token: '{{mock_mapa_transparente}}', uploadKey: 'mock-mapa', description: 'Mock mapa como marca d\'agua', opacity: 0.2 },
    { token: '{{rotas}}', uploadKey: 'rotas', description: 'Rotas' },
    { token: '{{odim}}', uploadKey: 'odim', description: 'ODIM' },
    { token: '{{mock_traseiro}}', uploadKey: 'mock-traseiro', description: 'Mock Traseiro' },
    { token: '{{planilha}}', uploadKey: 'planilha', description: 'Planilha de Orçamento' },
    { token: '{{mockup_od_vt}}', uploadKey: 'mockup-od-vt', description: 'Mockup OD V/T' },
    { token: '{{mockup_od_in}}', uploadKey: 'mockup-od-in', description: 'Mockup OD In' }
  ]
};
