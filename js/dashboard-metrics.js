// ========================================
// CÁLCULOS DE MÉTRICAS DO DASHBOARD
// ========================================

/**
 * Calcula todas as métricas principais do dashboard
 * @param {Object} conversations - Objeto de conversas agrupadas por session_id
 * @param {Object} feedbacks - Objeto de feedbacks por session_id
 * @returns {Object} - Objeto com todas as métricas calculadas
 */
function calculateMetrics(conversations, feedbacks = {}) {
  const sessionIds = Object.keys(conversations);
  const totalConversations = sessionIds.length;
  
  if (totalConversations === 0) {
    return {
      totalConversations: 0,
      totalMessages: 0,
      averageMessagesPerConversation: 0,
      aiResponseRate: 0,
      feedbackRate: 0,
      averageRating: null,
      totalHumanMessages: 0,
      totalAIMessages: 0,
      conversationsWithFeedback: 0,
      ratingsCount: 0
    };
  }
  
  let totalMessages = 0;
  let totalHumanMessages = 0;
  let totalAIMessages = 0;
  let conversationsWithFeedback = 0;
  let totalRating = 0;
  let ratingsCount = 0;
  
  sessionIds.forEach(sessionId => {
    const messages = conversations[sessionId];
    totalMessages += messages.length;
    
    messages.forEach(msg => {
      if (msg.message.type === 'human') {
        totalHumanMessages++;
      } else if (msg.message.type === 'ai') {
        totalAIMessages++;
      }
    });
    
    // Verifica feedback
    const feedback = feedbacks[sessionId];
    if (feedback && (feedback.rating || feedback.comment)) {
      conversationsWithFeedback++;
      if (feedback.rating && feedback.rating >= 1 && feedback.rating <= 5) {
        totalRating += feedback.rating;
        ratingsCount++;
      }
    }
  });
  
  return {
    totalConversations,
    totalMessages,
    averageMessagesPerConversation: totalConversations > 0 
      ? parseFloat((totalMessages / totalConversations).toFixed(1))
      : 0,
    aiResponseRate: totalMessages > 0 
      ? parseFloat(((totalAIMessages / totalMessages) * 100).toFixed(1))
      : 0,
    feedbackRate: totalConversations > 0 
      ? parseFloat(((conversationsWithFeedback / totalConversations) * 100).toFixed(1))
      : 0,
    averageRating: ratingsCount > 0 
      ? parseFloat((totalRating / ratingsCount).toFixed(1))
      : null,
    totalHumanMessages,
    totalAIMessages,
    conversationsWithFeedback,
    ratingsCount
  };
}

/**
 * Agrupa conversas por período (dia, semana, mês)
 * @param {Object} conversations - Objeto de conversas agrupadas
 * @param {string} groupBy - 'day', 'week', 'month'
 * @returns {Object} - Objeto com datas como chave e arrays de sessionIds como valor
 */
function groupConversationsByPeriod(conversations, groupBy = 'day') {
  const grouped = {};
  
  Object.keys(conversations).forEach(sessionId => {
    const messages = conversations[sessionId];
    if (!messages || messages.length === 0) return;
    
    // Pega a data da última mensagem
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage.created_at) return;
    
    const date = new Date(lastMessage.created_at);
    let key;
    
    switch (groupBy) {
      case 'day':
        key = formatDateShort(date);
        break;
      case 'week':
        // Semana do ano
        const week = getWeekNumber(date);
        key = `${date.getFullYear()}-W${week}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = formatDateShort(date);
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(sessionId);
  });
  
  return grouped;
}

/**
 * Obtém número da semana do ano
 * @param {Date} date - Data
 * @returns {number} - Número da semana
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Agrupa mensagens por tipo (human/ai)
 * @param {Object} conversations - Objeto de conversas agrupadas
 * @returns {Object} - { human: number, ai: number }
 */
function groupMessagesByType(conversations) {
  let human = 0;
  let ai = 0;
  
  Object.values(conversations).forEach(messages => {
    messages.forEach(msg => {
      if (msg.message.type === 'human') {
        human++;
      } else if (msg.message.type === 'ai') {
        ai++;
      }
    });
  });
  
  return { human, ai };
}

/**
 * Agrupa mensagens por horário do dia
 * @param {Object} conversations - Objeto de conversas agrupadas
 * @returns {Object} - Objeto com horas (0-23) como chave e quantidade como valor
 */
function groupMessagesByHour(conversations) {
  const hourly = {};
  
  // Inicializa todas as horas com 0
  for (let i = 0; i < 24; i++) {
    hourly[i] = 0;
  }
  
  Object.values(conversations).forEach(messages => {
    messages.forEach(msg => {
      if (!msg.created_at) return;
      
      const date = new Date(msg.created_at);
      const hour = date.getHours();
      
      if (hourly[hour] !== undefined) {
        hourly[hour]++;
      }
    });
  });
  
  return hourly;
}

/**
 * Obtém distribuição de avaliações (ratings)
 * @param {Object} feedbacks - Objeto de feedbacks por session_id
 * @returns {Object} - Objeto com ratings (1-5) como chave e quantidade como valor
 */
function getRatingDistribution(feedbacks) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  Object.values(feedbacks).forEach(feedback => {
    if (feedback && feedback.rating && feedback.rating >= 1 && feedback.rating <= 5) {
      distribution[feedback.rating]++;
    }
  });
  
  return distribution;
}

/**
 * Obtém top N conversas mais ativas (por número de mensagens)
 * @param {Object} conversations - Objeto de conversas agrupadas
 * @param {number} limit - Número máximo de conversas a retornar
 * @returns {Array} - Array de objetos { sessionId, messageCount, lastMessageDate }
 */
function getTopActiveConversations(conversations, limit = 10) {
  const sessionIds = Object.keys(conversations);
  
  const conversationsData = sessionIds.map(sessionId => {
    const messages = conversations[sessionId];
    const lastMessage = messages[messages.length - 1];
    
    return {
      sessionId,
      messageCount: messages.length,
      lastMessageDate: lastMessage.created_at ? new Date(lastMessage.created_at) : null,
      preview: getConversationPreview(messages)
    };
  });
  
  // Ordena por número de mensagens (decrescente)
  conversationsData.sort((a, b) => b.messageCount - a.messageCount);
  
  return conversationsData.slice(0, limit);
}

/**
 * Obtém conversas mais recentes
 * @param {Object} conversations - Objeto de conversas agrupadas
 * @param {number} limit - Número máximo de conversas a retornar
 * @returns {Array} - Array de objetos { sessionId, lastMessageDate, preview }
 */
function getRecentConversations(conversations, limit = 10) {
  const sessionIds = Object.keys(conversations);
  
  const conversationsData = sessionIds.map(sessionId => {
    const messages = conversations[sessionId];
    const lastMessage = messages[messages.length - 1];
    
    return {
      sessionId,
      lastMessageDate: lastMessage.created_at ? new Date(lastMessage.created_at) : null,
      preview: getConversationPreview(messages),
      messageCount: messages.length
    };
  });
  
  // Filtra conversas sem data e ordena por data (mais recente primeiro)
  const withDates = conversationsData.filter(c => c.lastMessageDate !== null);
  const withoutDates = conversationsData.filter(c => c.lastMessageDate === null);
  
  withDates.sort((a, b) => b.lastMessageDate - a.lastMessageDate);
  
  // Retorna conversas com data primeiro, depois sem data
  return [...withDates, ...withoutDates].slice(0, limit);
}

/**
 * Filtra conversas por período para o dashboard
 * @param {Object} conversations - Objeto de conversas agrupadas
 * @param {Date} startDate - Data de início
 * @param {Date} endDate - Data de fim
 * @returns {Object} - Conversas filtradas
 */
function filterConversationsForDashboard(conversations, startDate, endDate) {
  if (!startDate || !endDate) {
    return conversations;
  }
  
  return filterConversationsByDate(conversations, startDate, endDate, 'last');
}

