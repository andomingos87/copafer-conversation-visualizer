// ========================================
// CONFIGURAÇÃO DA API
// ========================================

const API_CONFIG = {
  // URL do endpoint da API
  BASE_URL: 'https://primary-production-ef755.up.railway.app/webhook/gethistories',
  
  // Timeout para requisições (em milissegundos)
  TIMEOUT: 30000, // 30 segundos
  
  // Tentar usar dados mockup se API falhar
  // Temporariamente true até CORS estar 100% configurado
  USE_MOCKUP_ON_ERROR: true // Ativado temporariamente - CORS ainda precisa ser verificado
};

