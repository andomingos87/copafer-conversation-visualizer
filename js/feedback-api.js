// ========================================
// API DE FEEDBACK
// ========================================

const FEEDBACK_API_CONFIG = {
  // URL base da API (mesma base do gethistories)
  BASE_URL: 'https://primary-production-ef755.up.railway.app/webhook',
  
  // Timeout para requisições
  TIMEOUT: 10000 // 10 segundos
};

/**
 * Busca feedback de uma conversa
 * @param {string} sessionId - ID da sessão
 * @returns {Promise<Object|null>} - Feedback ou null se não existir
 */
async function getFeedback(sessionId) {
  if (!sessionId) return null;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FEEDBACK_API_CONFIG.TIMEOUT);
    
    const response = await fetch(
      `${FEEDBACK_API_CONFIG.BASE_URL}/getfeedback?session_id=${encodeURIComponent(sessionId)}`,
      {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // Se não encontrou (404), retorna null (sem feedback ainda)
      if (response.status === 404) {
        return null;
      }
      
      // Tenta ler mensagem de erro se disponível
      try {
        const errorData = await response.json();
        if (errorData.message) {
          console.warn('Erro do servidor:', errorData.message);
        }
      } catch (e) {
        // Ignora erro ao ler JSON
      }
      
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Se retornar array, pega o primeiro elemento
    // Se retornar objeto, usa diretamente
    let feedback = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
    
    // Verifica se o feedback é válido
    // Se não existe, ou se session_id está vazio, ou se é um objeto vazio
    if (!feedback || 
        !feedback.session_id || 
        feedback.session_id === '' ||
        (Object.keys(feedback).length === 1 && feedback.session_id === '')) {
      return null;
    }
    
    // Retorna o feedback
    return feedback;
    
  } catch (error) {
    // Se for erro de rede ou abort, retorna null (não quebra a aplicação)
    if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
      console.warn('Erro ao buscar feedback:', error.message);
      return null;
    }
    
    console.error('Erro ao buscar feedback:', error);
    return null;
  }
}

/**
 * Salva ou atualiza feedback de uma conversa
 * @param {string} sessionId - ID da sessão
 * @param {number|null} rating - Avaliação em estrelas (1-5) ou null
 * @param {string|null} comment - Comentário ou null
 * @returns {Promise<Object>} - Feedback salvo
 */
async function saveFeedback(sessionId, rating, comment) {
  if (!sessionId) {
    throw new Error('Session ID é obrigatório');
  }
  
  // Valida que pelo menos um campo foi preenchido
  if (rating === null && (!comment || comment.trim() === '')) {
    throw new Error('É necessário preencher pelo menos a avaliação ou o comentário');
  }
  
  // Valida rating se fornecido
  if (rating !== null && (rating < 1 || rating > 5)) {
    throw new Error('Avaliação deve ser entre 1 e 5 estrelas');
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FEEDBACK_API_CONFIG.TIMEOUT);
    
    const payload = {
      session_id: sessionId,
      rating: rating || null,
      comment: comment && comment.trim() ? comment.trim() : null
    };
    
    const response = await fetch(
      `${FEEDBACK_API_CONFIG.BASE_URL}/savefeedback`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(payload)
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorMessage = `Erro HTTP ${response.status}`;
      
      // Lê o body como texto primeiro (só pode ser lido uma vez)
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            // Tenta fazer parse do JSON
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            } else {
              errorMessage = errorText.substring(0, 200);
            }
          } catch (e) {
            // Se não for JSON, usa o texto diretamente
            errorMessage = errorText.substring(0, 200);
          }
        }
      } catch (e) {
        // Se não conseguir ler, usa a mensagem padrão
        console.error('Erro ao ler resposta de erro:', e);
      }
      
      throw new Error(errorMessage);
    }
    
    // Log informações da resposta para debug
    console.log('Status da resposta:', response.status, response.statusText);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    // Lê o body como texto primeiro (só pode ser lido uma vez)
    const text = await response.text();
    
    // Verifica se a resposta está vazia
    if (!text || text.trim() === '') {
      console.warn('Servidor retornou resposta vazia. Status:', response.status);
      
      // Se o status for 200/201 mas a resposta estiver vazia, tenta buscar o feedback
      if (response.status === 200 || response.status === 201) {
        console.warn('Status OK mas resposta vazia. Tentando buscar feedback...');
        try {
          const fetchedFeedback = await getFeedback(sessionId);
          if (fetchedFeedback && fetchedFeedback.session_id) {
            console.log('Feedback encontrado após buscar:', fetchedFeedback);
            return fetchedFeedback;
          }
        } catch (e) {
          console.error('Erro ao buscar feedback após salvar:', e);
        }
      }
      
      throw new Error('O servidor retornou uma resposta vazia. Verifique a configuração do endpoint no n8n para retornar os dados do feedback após salvar.');
    }
    
    let data;
    try {
      // Tenta fazer parse do JSON
      data = JSON.parse(text);
    } catch (e) {
      // Se não conseguir parsear JSON, mostra o texto recebido
      console.error('Resposta do servidor não é JSON válido. Texto recebido:', text);
      console.error('Erro de parse:', e);
      throw new Error(`Resposta inválida do servidor (não é JSON válido): ${text.substring(0, 200)}`);
    }
    
    // Log para debug
    console.log('Resposta do servidor (saveFeedback):', data);
    
    // Se retornar array, pega o primeiro elemento
    // Se retornar objeto, usa diretamente
    const feedback = Array.isArray(data) ? data[0] : data;
    
    // Valida se o feedback foi salvo corretamente
    if (!feedback || !feedback.session_id) {
      console.error('Resposta inválida - dados recebidos:', feedback);
      console.error('Tipo de dados:', typeof feedback);
      console.error('É array?', Array.isArray(data));
      
      // Verifica se retornou apenas {"success":true} ou similar
      if (feedback && feedback.success && !feedback.session_id) {
        // Se retornou apenas success, tenta buscar o feedback novamente
        console.warn('Servidor retornou apenas success. Tentando buscar feedback...');
        try {
          const fetchedFeedback = await getFeedback(sessionId);
          if (fetchedFeedback && fetchedFeedback.session_id) {
            console.log('Feedback encontrado após buscar:', fetchedFeedback);
            return fetchedFeedback;
          }
        } catch (e) {
          console.error('Erro ao buscar feedback após salvar:', e);
        }
        
        throw new Error('O servidor retornou apenas {"success":true}, mas não retornou os dados do feedback. Verifique a configuração do endpoint no n8n para retornar o objeto completo do feedback após salvar.');
      }
      
      // Mensagem de erro mais descritiva
      const errorMsg = feedback 
        ? `Resposta inválida do servidor: falta campo 'session_id'. Dados recebidos: ${JSON.stringify(feedback)}`
        : `Resposta inválida do servidor: resposta vazia ou null`;
      
      throw new Error(errorMsg);
    }
    
    return feedback;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout ao salvar feedback. Tente novamente.');
    }
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }
    
    throw error;
  }
}

/**
 * Busca todos os feedbacks (para exportação)
 * @param {Array<string>} sessionIds - Array de session IDs
 * @returns {Promise<Object>} - Objeto com session_id como chave e feedback como valor
 */
async function getAllFeedbacks(sessionIds) {
  if (!sessionIds || sessionIds.length === 0) {
    return {};
  }
  
  // Busca feedbacks em paralelo
  const feedbackPromises = sessionIds.map(async (sessionId) => {
    const feedback = await getFeedback(sessionId);
    return { sessionId, feedback };
  });
  
  const results = await Promise.all(feedbackPromises);
  
  // Converte para objeto
  const feedbacks = {};
  results.forEach(({ sessionId, feedback }) => {
    if (feedback) {
      feedbacks[sessionId] = feedback;
    }
  });
  
  return feedbacks;
}

