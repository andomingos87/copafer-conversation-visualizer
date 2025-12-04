// Dados mockup de conversas do WhatsApp
// Baseado na estrutura do history_example.json

const mockData = [
  // Conversa 1: Cliente comprando materiais hidráulicos
  {
    id: 5401,
    session_id: "5511960620053",
    message: {
      type: "human",
      content: "BOM DIA",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5402,
    session_id: "5511960620053",
    message: {
      type: "ai",
      content: "Bom dia! Sou da Copafer, uma das maiores redes de materiais de construção do Brasil. Como posso auxiliar você hoje? Está procurando algum produto específico, orçamento ou ajuda com um projeto?",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5403,
    session_id: "5511960620053",
    message: {
      type: "human",
      content: "Joelho 90 Graus Soldável 25 mm - 22.15.026.0 - TIGRE",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5404,
    session_id: "5511960620053",
    message: {
      type: "ai",
      content: "*Joelho 90 Graus Soldável 25 mm TIGRE*\n\nConexão em PVC soldável para tubulações hidráulicas, ideal para instalações residenciais ou comerciais, com ângulo de 90 graus e diâmetro de 25 mm.\n\n*Preço:* R$ 0,89\n\n*Cód. Copafer:* 51705\n\nEsse é o produto exato que você mencionou (ref. TIGRE 22.15.026.0). Temos em estoque. Quantas unidades precisa? Posso adicionar ao carrinho e calcular o total para você.",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5405,
    session_id: "5511960620053",
    message: {
      type: "human",
      content: "01 unidade",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5406,
    session_id: "5511960620053",
    message: {
      type: "ai",
      content: "*PEDIDO* #PED20251118000070\nCliente: Marcelo de Tarso Vieira\n\n*Itens (1)*\n• Joelho 90 Graus Soldável 25 mm TIGRE | 1 x R$ 0,89 = R$ 0,89\n  Cód: 51705\n\n*Subtotal:* R$ 0,89\n\n*Frete:* R$ 0,00\n\n*Total:* R$ 0,89\n\nPedido atualizado. Deseja adicionar mais itens ou prosseguir para o cálculo de frete/retirada? Esse joelho é ótimo para tubulações PVC – quer que eu busque opções de tubos ou colas para solda que combinam com ele?",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5407,
    session_id: "5511960620053",
    message: {
      type: "human",
      content: "só isso",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5408,
    session_id: "5511960620053",
    message: {
      type: "ai",
      content: "Perfeito! Para finalizar seu pedido, preciso saber:\n\n*Como prefere receber?*\n1️⃣ *Retirada em loja* - Grátis\n2️⃣ *Entrega* - Calcularemos o frete\n\nQual sua preferência?",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5409,
    session_id: "5511960620053",
    message: {
      type: "human",
      content: "retirada",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5410,
    session_id: "5511960620053",
    message: {
      type: "ai",
      content: "Ótima escolha! Temos várias lojas disponíveis para retirada.\n\n*Selecione a loja mais próxima:*\n\n1️⃣ *Copafer Campinas Centro*\n   Av. Francisco Glicério, 1200\n\n2️⃣ *Copafer Campinas Barão*\n   Rua Barão de Jaguara, 800\n\n3️⃣ *Copafer Valinhos*\n   Av. Invernada, 500\n\nQual loja prefere?",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5411,
    session_id: "5511960620053",
    message: {
      type: "human",
      content: "1",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5412,
    session_id: "5511960620053",
    message: {
      type: "ai",
      content: "Perfeito! Seu pedido está confirmado para retirada.\n\n*RESUMO DO PEDIDO* #PED20251118000070\n\n📦 *Itens:*\n• 1x Joelho 90 Graus Soldável 25 mm TIGRE - R$ 0,89\n\n💰 *Total:* R$ 0,89\n\n📍 *Retirada em:*\nCopafer Campinas Centro\nAv. Francisco Glicério, 1200\n\n*Forma de pagamento:*\nPagamento na retirada (Pix, cartão ou dinheiro)\n\nSeu pedido estará disponível em até *2 horas*. Você receberá uma confirmação quando estiver pronto!\n\nObrigado por comprar na Copafer! 🧡",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },

  // Conversa 2: Cliente com dúvidas sobre pisos
  {
    id: 5501,
    session_id: "5511941239405",
    message: {
      type: "human",
      content: "Boa tarde",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5502,
    session_id: "5511941239405",
    message: {
      type: "ai",
      content: "Boa tarde! Bem-vindo à Copafer! Como posso ajudar você hoje? 😊",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5503,
    session_id: "5511941239405",
    message: {
      type: "human",
      content: "Piso",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5504,
    session_id: "5511941239405",
    message: {
      type: "ai",
      content: "Temos várias opções de piso! Para te ajudar melhor, me conta:\n\n*Qual tipo de piso você procura?*\n\n1️⃣ *Porcelanato* - Elegante e durável\n2️⃣ *Cerâmica* - Custo-benefício\n3️⃣ *Laminado* - Praticidade na instalação\n4️⃣ *Vinílico* - Conforto térmico\n5️⃣ *Piso Externo* - Antiderrapante\n\nOu se preferir, me diz o ambiente (sala, cozinha, área externa) que eu indico as melhores opções!",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5505,
    session_id: "5511941239405",
    message: {
      type: "human",
      content: "porcelanato para sala",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5506,
    session_id: "5511941239405",
    message: {
      type: "ai",
      content: "Excelente escolha! Porcelanato é perfeito para sala. Aqui estão algumas opções em destaque:\n\n*1. Porcelanato Polido Bege 60x60cm*\n   Marca: Eliane\n   R$ 59,90/m²\n   Cód: 78901\n\n*2. Porcelanato Acetinado Cinza 80x80cm*\n   Marca: Portobello\n   R$ 89,90/m²\n   Cód: 78902\n\n*3. Porcelanato Madeira Natural 20x120cm*\n   Marca: Ceusa\n   R$ 79,90/m²\n   Cód: 78903\n\nQual te interessa? Posso calcular a quantidade necessária se você me passar a metragem da sala!",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5507,
    session_id: "5511941239405",
    message: {
      type: "human",
      content: "o de madeira, minha sala tem 20m2",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5508,
    session_id: "5511941239405",
    message: {
      type: "ai",
      content: "Ótima escolha! O porcelanato com efeito madeira está super em alta e fica lindo em salas!\n\n*Cálculo para sua sala de 20m²:*\n\n📐 Área: 20m²\n📦 Recomendamos: 22m² (10% a mais para recortes)\n💰 Valor: 22 x R$ 79,90 = *R$ 1.757,80*\n\n*Porcelanato Madeira Natural 20x120cm - Ceusa*\nCód: 78903\n\n*Vai precisar também:*\n• Argamassa ACIII - R$ 32,90 (saco 20kg) - 3 sacos\n• Rejunte Flexível - R$ 24,90 - 2 unidades\n• Espaçadores 2mm - R$ 8,90\n\n*Kit completo: R$ 1.899,30*\n\nQuer que eu monte o pedido completo?",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5509,
    session_id: "5511941239405",
    message: {
      type: "human",
      content: "vocês entregam em Sumaré?",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5510,
    session_id: "5511941239405",
    message: {
      type: "ai",
      content: "Sim, entregamos em Sumaré! 🚚\n\n*Frete para Sumaré:*\n• Entrega padrão (3-5 dias úteis): R$ 89,00\n• Entrega expressa (1-2 dias úteis): R$ 149,00\n\nPara pedidos acima de R$ 2.000, o *frete padrão é grátis*!\n\nSeu pedido atual está em R$ 1.899,30. Adicionando mais R$ 100,70 em produtos, você ganha frete grátis! Posso sugerir alguns itens úteis para completar?",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5511,
    session_id: "5511941239405",
    message: {
      type: "human",
      content: "vou pensar e volto depois",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5512,
    session_id: "5511941239405",
    message: {
      type: "ai",
      content: "Sem problemas! Fico à disposição quando precisar. 😊\n\nSe quiser, posso salvar esse orçamento para você. Assim quando voltar, é só continuar de onde parou!\n\nTenha uma ótima tarde e até breve! 🧡",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },

  // Conversa 3: Cliente com problema em pedido
  {
    id: 5601,
    session_id: "5511987654321",
    message: {
      type: "human",
      content: "oi preciso de ajuda",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5602,
    session_id: "5511987654321",
    message: {
      type: "ai",
      content: "Olá! Claro, estou aqui para ajudar! O que você precisa? 😊",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5603,
    session_id: "5511987654321",
    message: {
      type: "human",
      content: "fiz um pedido semana passada e ainda nao chegou",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5604,
    session_id: "5511987654321",
    message: {
      type: "ai",
      content: "Entendo sua preocupação! Vou verificar o status do seu pedido.\n\nPode me informar o *número do pedido* ou o *CPF* cadastrado na compra?",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5605,
    session_id: "5511987654321",
    message: {
      type: "human",
      content: "PED20251110000045",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5606,
    session_id: "5511987654321",
    message: {
      type: "ai",
      content: "Encontrei seu pedido! Vou verificar...\n\n*Pedido:* #PED20251110000045\n*Status:* Em trânsito 🚚\n\n*Detalhes:*\n• Data do pedido: 10/11/2025\n• Previsão de entrega: 18/11/2025\n• Transportadora: Jadlog\n• Código de rastreio: JD123456789BR\n\n*Itens:*\n• 5x Saco de Cimento CP-II 50kg\n• 10x Tijolo Cerâmico 9 furos\n\nParece que o pedido está a caminho e deve chegar até amanhã! Você pode acompanhar pelo site dos Correios usando o código de rastreio.\n\nPosso ajudar com mais alguma coisa?",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5607,
    session_id: "5511987654321",
    message: {
      type: "human",
      content: "mas ja era pra ter chegado dia 15",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5608,
    session_id: "5511987654321",
    message: {
      type: "ai",
      content: "Você tem razão, peço desculpas pelo atraso! Realmente a previsão inicial era dia 15/11.\n\nVerifiquei aqui e houve um atraso na transportadora devido ao alto volume de entregas nesta semana.\n\n*O que posso fazer por você:*\n\n1️⃣ *Acompanhamento prioritário* - Vou sinalizar seu pedido como urgente\n2️⃣ *Cupom de desconto* - 10% OFF na próxima compra como pedido de desculpas\n3️⃣ *Falar com atendente* - Transferir para um especialista\n\nQual opção prefere?",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5609,
    session_id: "5511987654321",
    message: {
      type: "human",
      content: "quero o cupom",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5610,
    session_id: "5511987654321",
    message: {
      type: "ai",
      content: "Pronto! 🎉\n\n*Seu cupom de 10% de desconto:*\n\n🎟️ *DESCULPA10*\n\n*Válido até:* 30/11/2025\n*Desconto máximo:* R$ 100,00\n*Pedido mínimo:* R$ 50,00\n\nBasta informar o código no momento da compra!\n\nNovamente, peço desculpas pelo transtorno. Seu pedido deve chegar amanhã sem falta. Qualquer problema, é só me chamar!\n\nPosso ajudar com mais alguma coisa? 😊",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  },
  {
    id: 5611,
    session_id: "5511987654321",
    message: {
      type: "human",
      content: "ok obrigado",
      additional_kwargs: {},
      response_metadata: {}
    }
  },
  {
    id: 5612,
    session_id: "5511987654321",
    message: {
      type: "ai",
      content: "Por nada! 😊\n\nQualquer dúvida sobre o pedido ou se precisar de mais alguma coisa, é só chamar!\n\nTenha um ótimo dia! 🧡",
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  }
];

// Exporta os dados para uso no app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = mockData;
}

