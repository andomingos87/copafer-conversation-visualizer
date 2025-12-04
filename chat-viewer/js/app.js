// ========================================
// APLICAÇÃO PRINCIPAL - CHAT VIEWER
// ========================================

// Estado da aplicação
const state = {
  conversations: {},        // Conversas agrupadas por session_id
  filteredConversations: {}, // Conversas após filtros
  selectedSession: null,    // Session ID selecionada
  searchTerm: '',           // Termo de busca atual
  clientFilter: ''          // Filtro de cliente atual
};

// Referências aos elementos do DOM
const elements = {
  searchInput: null,
  clearSearch: null,
  clientFilter: null,
  conversationList: null,
  conversationCount: null,
  chatTitle: null,
  messageCount: null,
  chatMessages: null
};

// ========================================
// INICIALIZAÇÃO
// ========================================

/**
 * Inicializa a aplicação
 */
function init() {
  // Captura referências dos elementos
  elements.searchInput = document.getElementById('searchInput');
  elements.clearSearch = document.getElementById('clearSearch');
  elements.clientFilter = document.getElementById('clientFilter');
  elements.conversationList = document.getElementById('conversationList');
  elements.conversationCount = document.getElementById('conversationCount');
  elements.chatTitle = document.getElementById('chatTitle');
  elements.messageCount = document.getElementById('messageCount');
  elements.chatMessages = document.getElementById('chatMessages');
  
  // Carrega e processa os dados
  loadData();
  
  // Configura event listeners
  setupEventListeners();
}

/**
 * Carrega os dados mockup e processa
 */
function loadData() {
  // Agrupa mensagens por session_id
  state.conversations = groupBySession(mockData);
  state.filteredConversations = { ...state.conversations };
  
  // Popula o dropdown de clientes
  populateClientFilter();
  
  // Renderiza a lista de conversas
  renderConversationList();
}

/**
 * Configura os event listeners
 */
function setupEventListeners() {
  // Busca com debounce
  elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
  
  // Botão limpar busca
  elements.clearSearch.addEventListener('click', clearSearch);
  
  // Filtro de cliente
  elements.clientFilter.addEventListener('change', handleClientFilter);
  
  // Tecla Enter no campo de busca
  elements.searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  });
}

// ========================================
// RENDERIZAÇÃO
// ========================================

/**
 * Popula o dropdown de filtro de clientes
 */
function populateClientFilter() {
  const sessions = Object.keys(state.conversations);
  
  // Limpa opções existentes (exceto a primeira)
  elements.clientFilter.innerHTML = '<option value="">Todos os clientes</option>';
  
  // Adiciona uma opção para cada session_id
  sessions.forEach(sessionId => {
    const option = document.createElement('option');
    option.value = sessionId;
    option.textContent = formatPhoneNumber(sessionId);
    elements.clientFilter.appendChild(option);
  });
}

/**
 * Renderiza a lista de conversas na sidebar
 */
function renderConversationList() {
  const conversations = state.filteredConversations;
  const sessions = Object.keys(conversations);
  
  // Atualiza contador
  elements.conversationCount.textContent = sessions.length;
  
  // Limpa lista atual
  elements.conversationList.innerHTML = '';
  
  // Se não houver conversas
  if (sessions.length === 0) {
    elements.conversationList.innerHTML = `
      <div class="empty-state" style="padding: 40px 20px;">
        <p style="color: var(--text-muted);">Nenhuma conversa encontrada</p>
      </div>
    `;
    return;
  }
  
  // Renderiza cada conversa
  sessions.forEach(sessionId => {
    const messages = conversations[sessionId];
    const preview = getConversationPreview(messages);
    const isActive = state.selectedSession === sessionId;
    
    const item = document.createElement('div');
    item.className = `conversation-item${isActive ? ' active' : ''}`;
    item.dataset.sessionId = sessionId;
    
    item.innerHTML = `
      <div class="conversation-avatar">📱</div>
      <div class="conversation-info">
        <div class="conversation-number">${formatPhoneNumber(sessionId)}</div>
        <div class="conversation-preview">${escapeHtml(preview)}</div>
      </div>
      <div class="conversation-meta">
        <span class="conversation-count">${messages.length} msgs</span>
      </div>
    `;
    
    // Event listener para seleção
    item.addEventListener('click', () => selectConversation(sessionId));
    
    elements.conversationList.appendChild(item);
  });
}

/**
 * Renderiza as mensagens de uma conversa
 * @param {string} sessionId - ID da sessão
 */
function renderMessages(sessionId) {
  const messages = state.filteredConversations[sessionId];
  
  if (!messages) {
    elements.chatMessages.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <p>Conversa não encontrada</p>
      </div>
    `;
    return;
  }
  
  // Atualiza header do chat
  elements.chatTitle.textContent = formatPhoneNumber(sessionId);
  elements.messageCount.textContent = `${messages.length} mensagens`;
  
  // Limpa mensagens anteriores
  elements.chatMessages.innerHTML = '';
  
  // Renderiza cada mensagem
  messages.forEach((msg, index) => {
    const type = msg.message.type; // 'human' ou 'ai'
    let content = msg.message.content || '';
    
    // Aplica parsing de markdown
    content = parseMarkdown(content);
    
    // Aplica highlight se houver busca
    if (state.searchTerm) {
      content = highlightText(content, state.searchTerm);
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.style.animationDelay = `${index * 0.05}s`;
    
    const senderLabel = type === 'human' ? '👤 Cliente' : '🤖 Copafer IA';
    
    messageEl.innerHTML = `
      <div class="message-sender">${senderLabel}</div>
      <div class="message-bubble">
        <div class="message-content">${content}</div>
      </div>
    `;
    
    elements.chatMessages.appendChild(messageEl);
  });
  
  // Scroll para o topo
  elements.chatMessages.scrollTop = 0;
}

// ========================================
// HANDLERS DE EVENTOS
// ========================================

/**
 * Seleciona uma conversa
 * @param {string} sessionId - ID da sessão
 */
function selectConversation(sessionId) {
  state.selectedSession = sessionId;
  
  // Atualiza visual da lista
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.classList.toggle('active', item.dataset.sessionId === sessionId);
  });
  
  // Renderiza mensagens
  renderMessages(sessionId);
}

/**
 * Handler para busca
 */
function handleSearch() {
  const term = elements.searchInput.value.trim();
  state.searchTerm = term;
  
  // Mostra/esconde botão limpar
  elements.clearSearch.classList.toggle('visible', term.length > 0);
  
  // Aplica filtros
  applyFilters();
}

/**
 * Limpa a busca
 */
function clearSearch() {
  elements.searchInput.value = '';
  state.searchTerm = '';
  elements.clearSearch.classList.remove('visible');
  
  applyFilters();
  
  // Foca no campo de busca
  elements.searchInput.focus();
}

/**
 * Handler para filtro de cliente
 */
function handleClientFilter() {
  state.clientFilter = elements.clientFilter.value;
  applyFilters();
}

/**
 * Aplica todos os filtros ativos
 */
function applyFilters() {
  let filtered = { ...state.conversations };
  
  // Aplica filtro de cliente
  if (state.clientFilter) {
    filtered = {
      [state.clientFilter]: filtered[state.clientFilter]
    };
  }
  
  // Aplica filtro de busca
  if (state.searchTerm) {
    filtered = filterConversationsBySearch(filtered, state.searchTerm);
  }
  
  state.filteredConversations = filtered;
  
  // Re-renderiza lista
  renderConversationList();
  
  // Se a conversa selecionada ainda existe nos filtros, atualiza
  if (state.selectedSession && filtered[state.selectedSession]) {
    renderMessages(state.selectedSession);
  } else if (state.selectedSession) {
    // Se não existe mais, mostra estado vazio
    elements.chatMessages.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>A conversa selecionada não corresponde aos filtros atuais</p>
      </div>
    `;
    elements.chatTitle.textContent = 'Selecione uma conversa';
    elements.messageCount.textContent = '';
  }
}

// ========================================
// UTILITÁRIOS
// ========================================

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========================================
// INICIALIZAÇÃO
// ========================================

// Aguarda o DOM carregar
document.addEventListener('DOMContentLoaded', init);

