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

/**
 * Formata data curta para exibição (DD/MM/YYYY)
 * @param {Date} date - Objeto Date
 * @returns {string} - Data formatada
 */
function formatDateShort(date) {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Retorna o início do dia (00:00:00)
 * @param {Date} date - Data base
 * @returns {Date} - Data no início do dia
 */
function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Retorna o fim do dia (23:59:59.999)
 * @param {Date} date - Data base
 * @returns {Date} - Data no fim do dia
 */
function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Calcula período baseado em atalhos
 * @param {string} period - Identificador do período (today, yesterday, last7days, etc.)
 * @returns {Object} - { startDate: Date, endDate: Date }
 */
function getDatePeriod(period) {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      break;

    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = startOfDay(yesterday);
      endDate = endOfDay(yesterday);
      break;

    case 'last7days':
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      startDate = startOfDay(sevenDaysAgo);
      endDate = endOfDay(now);
      break;

    case 'last30days':
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      startDate = startOfDay(thirtyDaysAgo);
      endDate = endOfDay(now);
      break;

    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = startOfDay(startDate);
      endDate = endOfDay(now);
      break;

    default:
      return null;
  }

  return { startDate, endDate };
}

/**
 * Obtém o nome amigável do período
 * @param {string} period - Identificador do período
 * @returns {string} - Nome amigável
 */
function getPeriodLabel(period) {
  const labels = {
    'today': 'Hoje',
    'yesterday': 'Ontem',
    'last7days': 'Últimos 7 dias',
    'last30days': 'Últimos 30 dias',
    'thisMonth': 'Este mês',
    'custom': 'Período personalizado'
  };
  return labels[period] || period;
}

/**
 * Obtém a data de uma mensagem (created_at ou simulada)
 * @param {Object} msg - Objeto da mensagem
 * @param {number} index - Índice da mensagem (para simulação)
 * @returns {Date|null} - Data da mensagem
 */
function getMessageDate(msg, index = 0) {
  if (msg.created_at) {
    return new Date(msg.created_at);
  }
  // Para dados mockup sem created_at, retorna null
  // (não podemos filtrar por data sem dados reais)
  return null;
}

/**
 * Verifica se uma data está dentro de um período
 * @param {Date} date - Data a verificar
 * @param {Date} startDate - Início do período
 * @param {Date} endDate - Fim do período
 * @returns {boolean}
 */
function isDateInRange(date, startDate, endDate) {
  if (!date) return false;
  return date >= startDate && date <= endDate;
}

/**
 * Filtra conversas por período de data
 * @param {Object} conversations - Objeto de conversas agrupadas
 * @param {Date} startDate - Data de início do período
 * @param {Date} endDate - Data de fim do período
 * @param {string} criteria - Critério: 'first', 'last' ou 'any'
 * @returns {Object} - Conversas filtradas
 */
function filterConversationsByDate(conversations, startDate, endDate, criteria = 'last') {
  if (!startDate || !endDate) return conversations;

  const filtered = {};

  Object.keys(conversations).forEach(sessionId => {
    const messages = conversations[sessionId];
    
    // Verifica se as mensagens têm created_at
    const messagesWithDates = messages.filter(msg => msg.created_at);
    
    // Se não há mensagens com data, inclui a conversa (não podemos filtrar)
    if (messagesWithDates.length === 0) {
      filtered[sessionId] = messages;
      return;
    }

    let includeConversation = false;

    switch (criteria) {
      case 'first':
        // Considera a data da primeira mensagem
        const firstMsg = messagesWithDates[0];
        const firstDate = getMessageDate(firstMsg);
        includeConversation = isDateInRange(firstDate, startDate, endDate);
        break;

      case 'last':
        // Considera a data da última mensagem
        const lastMsg = messagesWithDates[messagesWithDates.length - 1];
        const lastDate = getMessageDate(lastMsg);
        includeConversation = isDateInRange(lastDate, startDate, endDate);
        break;

      case 'any':
        // Considera se qualquer mensagem está no período
        includeConversation = messagesWithDates.some(msg => {
          const msgDate = getMessageDate(msg);
          return isDateInRange(msgDate, startDate, endDate);
        });
        break;

      default:
        includeConversation = true;
    }

    if (includeConversation) {
      filtered[sessionId] = messages;
    }
  });

  return filtered;
}

/**
 * Formata apenas o horário para exibição (HH:mm:ss)
 * @param {string} dateString - Data em formato ISO string
 * @returns {string} - Horário formatado (HH:mm:ss)
 */
function formatTime(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  } catch (error) {
    return '';
  }
}

// ========================================
// FUNÇÕES DE EXPORTAÇÃO
// ========================================

/**
 * Gera nome de arquivo para exportação
 * @param {string|null} sessionId - ID da sessão (null para todas)
 * @param {string} format - Formato do arquivo (json, txt, csv)
 * @returns {string} - Nome do arquivo gerado
 */
function generateExportFilename(sessionId, format) {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  
  if (sessionId) {
    return `copafer-conversa-${sessionId}-${date}-${time}.${format}`;
  }
  return `copafer-todas-conversas-${date}-${time}.${format}`;
}

/**
 * Faz download de um arquivo
 * @param {string} content - Conteúdo do arquivo
 * @param {string} filename - Nome do arquivo
 * @param {string} mimeType - Tipo MIME do arquivo
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Libera a URL do blob
  URL.revokeObjectURL(url);
}

/**
 * Obtém horário formatado para exportação
 * @param {Object} msg - Objeto da mensagem
 * @param {number} index - Índice da mensagem
 * @returns {string} - Horário formatado
 */
function getMessageTimeForExport(msg, index) {
  if (msg.created_at) {
    return formatTime(msg.created_at);
  }
  // Gera horário simulado para dados mockup
  const baseDate = new Date();
  baseDate.setHours(9, 0, 0);
  baseDate.setSeconds(baseDate.getSeconds() + (index * 30));
  return formatTime(baseDate.toISOString());
}

/**
 * Exporta conversas para JSON
 * @param {Object} conversations - Objeto de conversas agrupadas
 * @param {string|null} sessionId - ID da sessão (null para todas)
 */
function exportToJSON(conversations, sessionId = null) {
  const exportData = {
    exportedAt: new Date().toISOString(),
    exportedAtFormatted: formatDate(new Date().toISOString()),
    totalConversations: Object.keys(conversations).length,
    totalMessages: Object.values(conversations).reduce((sum, msgs) => sum + msgs.length, 0),
    conversations: conversations
  };
  
  const content = JSON.stringify(exportData, null, 2);
  const filename = generateExportFilename(sessionId, 'json');
  
  downloadFile(content, filename, 'application/json');
}

/**
 * Exporta conversas para TXT
 * @param {Object} conversations - Objeto de conversas agrupadas
 * @param {string|null} sessionId - ID da sessão (null para todas)
 */
function exportToTXT(conversations, sessionId = null) {
  const lines = [];
  const exportDate = formatDate(new Date().toISOString());
  const totalConversations = Object.keys(conversations).length;
  const totalMessages = Object.values(conversations).reduce((sum, msgs) => sum + msgs.length, 0);
  
  // Cabeçalho
  lines.push('='.repeat(50));
  lines.push('COPAFER - EXPORTAÇÃO DE CONVERSAS');
  lines.push('='.repeat(50));
  lines.push('');
  lines.push(`Data da exportação: ${exportDate}`);
  lines.push(`Total de conversas: ${totalConversations}`);
  lines.push(`Total de mensagens: ${totalMessages}`);
  lines.push('');
  
  // Cada conversa
  Object.keys(conversations).forEach(sessId => {
    const messages = conversations[sessId];
    
    lines.push('='.repeat(50));
    lines.push(`CONVERSA: ${formatPhoneNumber(sessId)}`);
    lines.push(`Session ID: ${sessId}`);
    lines.push(`Total de mensagens: ${messages.length}`);
    lines.push('='.repeat(50));
    lines.push('');
    
    // Cada mensagem
    messages.forEach((msg, index) => {
      const type = msg.message.type;
      const content = msg.message.content || '';
      const time = getMessageTimeForExport(msg, index);
      const sender = type === 'human' ? '👤 Cliente' : '🤖 Copafer IA';
      
      lines.push(`[${time}] ${sender}`);
      lines.push(content);
      lines.push('');
    });
    
    lines.push('-'.repeat(50));
    lines.push('');
  });
  
  // Rodapé
  lines.push('');
  lines.push('='.repeat(50));
  lines.push('FIM DA EXPORTAÇÃO');
  lines.push('='.repeat(50));
  
  const contentText = lines.join('\n');
  const filename = generateExportFilename(sessionId, 'txt');
  
  downloadFile(contentText, filename, 'text/plain;charset=utf-8');
}

/**
 * Escapa valor para CSV (aspas duplas e vírgulas)
 * @param {string} value - Valor a escapar
 * @returns {string} - Valor escapado
 */
function escapeCSV(value) {
  if (!value) return '';
  // Se contém vírgula, aspas ou quebra de linha, envolve em aspas
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    // Escapa aspas duplas dobrando-as
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Exporta conversas para CSV
 * @param {Object} conversations - Objeto de conversas agrupadas
 * @param {string|null} sessionId - ID da sessão (null para todas)
 */
function exportToCSV(conversations, sessionId = null) {
  const rows = [];
  
  // Cabeçalho
  rows.push(['Data/Hora', 'Remetente', 'Tipo', 'Conteúdo', 'Session ID', 'Telefone Formatado'].join(','));
  
  // Cada conversa
  Object.keys(conversations).forEach(sessId => {
    const messages = conversations[sessId];
    const phoneFormatted = formatPhoneNumber(sessId);
    
    // Cada mensagem
    messages.forEach((msg, index) => {
      const type = msg.message.type;
      const content = msg.message.content || '';
      const time = getMessageTimeForExport(msg, index);
      const sender = type === 'human' ? 'Cliente' : 'Copafer IA';
      
      const row = [
        escapeCSV(time),
        escapeCSV(sender),
        escapeCSV(type),
        escapeCSV(content),
        escapeCSV(sessId),
        escapeCSV(phoneFormatted)
      ];
      
      rows.push(row.join(','));
    });
  });
  
  // BOM para UTF-8 no Excel
  const BOM = '\uFEFF';
  const content = BOM + rows.join('\n');
  const filename = generateExportFilename(sessionId, 'csv');
  
  downloadFile(content, filename, 'text/csv;charset=utf-8');
}

