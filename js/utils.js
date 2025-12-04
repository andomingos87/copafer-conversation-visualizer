// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Converte markdown básico (*texto*) para HTML (<strong>)
 * @param {string} text - Texto com markdown
 * @returns {string} - Texto com HTML
 */
function parseMarkdown(text) {
  if (!text) return '';
  
  // Converte *texto* para <strong>texto</strong>
  // Usa regex que encontra texto entre asteriscos
  return text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
}

/**
 * Destaca termos de busca no texto
 * @param {string} text - Texto original
 * @param {string} searchTerm - Termo a destacar
 * @returns {string} - Texto com highlights
 */
function highlightText(text, searchTerm) {
  if (!searchTerm || !text) return text;
  
  // Escapa caracteres especiais de regex
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Cria regex case-insensitive
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  
  // Substitui matches por spans com classe highlight
  return text.replace(regex, '<span class="highlight">$1</span>');
}

/**
 * Formata número de telefone para exibição
 * @param {string} phone - Número do telefone (ex: 5511960620053)
 * @returns {string} - Número formatado (ex: +55 11 96062-0053)
 */
function formatPhoneNumber(phone) {
  if (!phone || phone.length < 10) return phone;
  
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Formato brasileiro: +55 (XX) XXXXX-XXXX
  if (cleaned.length === 13) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  
  // Formato com 12 dígitos: +55 (XX) XXXX-XXXX
  if (cleaned.length === 12) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  }
  
  return phone;
}

/**
 * Agrupa mensagens por session_id
 * @param {Array} messages - Array de mensagens
 * @returns {Object} - Objeto com session_ids como chaves
 */
function groupBySession(messages) {
  const grouped = {};
  
  messages.forEach(msg => {
    const sessionId = msg.session_id;
    
    if (!grouped[sessionId]) {
      grouped[sessionId] = [];
    }
    
    grouped[sessionId].push(msg);
  });
  
  // Ordena mensagens de cada sessão por created_at (ou id como fallback)
  Object.keys(grouped).forEach(sessionId => {
    grouped[sessionId].sort((a, b) => {
      // Prioriza created_at se disponível, senão usa id
      if (a.created_at && b.created_at) {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateA - dateB;
      }
      // Fallback para id se created_at não estiver disponível
      return (a.id || 0) - (b.id || 0);
    });
  });
  
  return grouped;
}

/**
 * Obtém preview da conversa (última mensagem ou primeira)
 * @param {Array} messages - Array de mensagens da conversa
 * @returns {string} - Preview truncado
 */
function getConversationPreview(messages) {
  if (!messages || messages.length === 0) return 'Sem mensagens';
  
  // Pega a última mensagem
  const lastMessage = messages[messages.length - 1];
  const content = lastMessage.message.content || '';
  
  // Trunca se muito longo
  const maxLength = 40;
  if (content.length > maxLength) {
    return content.substring(0, maxLength) + '...';
  }
  
  return content;
}

/**
 * Filtra conversas que contêm o termo de busca
 * @param {Object} conversations - Objeto de conversas agrupadas
 * @param {string} searchTerm - Termo de busca
 * @returns {Object} - Conversas filtradas
 */
function filterConversationsBySearch(conversations, searchTerm) {
  if (!searchTerm) return conversations;
  
  const filtered = {};
  const term = searchTerm.toLowerCase();
  
  Object.keys(conversations).forEach(sessionId => {
    const messages = conversations[sessionId];
    
    // Verifica se alguma mensagem contém o termo
    const hasMatch = messages.some(msg => {
      const content = msg.message.content || '';
      return content.toLowerCase().includes(term);
    });
    
    if (hasMatch) {
      filtered[sessionId] = messages;
    }
  });
  
  return filtered;
}

/**
 * Debounce function para otimizar eventos de input
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} - Função com debounce
 */
function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Formata data para exibição
 * @param {string} dateString - Data em formato ISO string
 * @returns {string} - Data formatada (DD/MM/YYYY HH:mm)
 */
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    return dateString;
  }
}

