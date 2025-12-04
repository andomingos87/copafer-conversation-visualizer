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
  chatMessages: null,
  loadingState: null,
  errorState: null,
  errorText: null,
  retryButton: null,
  useMockupButton: null
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
  elements.loadingState = document.getElementById('loadingState');
  elements.errorState = document.getElementById('errorState');
  elements.errorText = document.getElementById('errorText');
  elements.retryButton = document.getElementById('retryButton');
  elements.useMockupButton = document.getElementById('useMockupButton');
  
  // Carrega e processa os dados
  loadData();
  
  // Configura event listeners
  setupEventListeners();
}

/**
 * Carrega os dados da API ou mockup
 */
async function loadData() {
  showLoading();
  hideError();
  
  try {
    // Cria um timeout para a requisição
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    // Faz requisição à API
    const response = await fetch(API_CONFIG.BASE_URL, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors' // CORS configurado no backend
    });
    
    clearTimeout(timeoutId);
    
    // Verifica se a resposta é OK
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
    }
    
    // Processa os dados JSON
    const responseData = await response.json();
    
    // Tenta extrair array se estiver dentro de um objeto
    let data = responseData;
    
    // Se não é array direto, tenta encontrar array dentro do objeto
    if (!Array.isArray(responseData)) {
      // Verifica se é um objeto com propriedade que contém array
      if (typeof responseData === 'object' && responseData !== null) {
        // Tenta propriedades comuns que podem conter arrays
        if (Array.isArray(responseData.data)) {
          data = responseData.data;
        } else if (Array.isArray(responseData.results)) {
          data = responseData.results;
        } else if (Array.isArray(responseData.items)) {
          data = responseData.items;
        } else if (Array.isArray(responseData.messages)) {
          data = responseData.messages;
        } else {
          // Se não encontrou array, verifica se é um objeto único de mensagem
          // (caso onde n8n retorna apenas um registro ao invés de array)
          if (responseData.id && responseData.session_id && responseData.message) {
            // É um objeto único de mensagem - converte para array
            data = [responseData];
          } else {
            // Tenta pegar primeira propriedade que seja array
            const arrayKey = Object.keys(responseData).find(key => Array.isArray(responseData[key]));
            if (arrayKey) {
              data = responseData[arrayKey];
            } else {
              throw new Error(`Resposta da API não é um array válido. Tipo recebido: ${typeof responseData}. Estrutura: ${JSON.stringify(responseData).substring(0, 200)}`);
            }
          }
        }
      } else {
        throw new Error(`Resposta da API não é um array válido. Tipo recebido: ${typeof responseData}`);
      }
    }
    
    // Valida se agora é um array
    if (!Array.isArray(data)) {
      throw new Error('Não foi possível extrair um array da resposta da API');
    }
    
    // Se array vazio, não usa fallback automático
    if (data.length === 0) {
      state.conversations = {};
      state.filteredConversations = {};
      populateClientFilter();
      renderConversationList();
      hideLoading();
      return;
    }
    
    // Processa os dados
    state.conversations = groupBySession(data);
    state.filteredConversations = { ...state.conversations };
    
    // Popula o dropdown de clientes
    populateClientFilter();
    
    // Renderiza a lista de conversas
    renderConversationList();
    
    hideLoading();
    
  } catch (error) {
    hideLoading();
    
    // Detecta erro de CORS
    const isCorsError = error.message.includes('Failed to fetch') || 
                       error.message.includes('CORS') ||
                       error.name === 'TypeError';
    
    if (isCorsError) {
      const corsMessage = `Erro de CORS: A API não permite requisições do navegador.\n\n` +
                         `Soluções:\n` +
                         `1. Configure CORS no backend da API\n` +
                         `2. Use um proxy CORS\n` +
                         `3. Use dados de exemplo temporariamente`;
      
      // Se configurado para usar mockup em caso de erro
      if (API_CONFIG.USE_MOCKUP_ON_ERROR && typeof mockData !== 'undefined') {
        useMockupData();
      } else {
        showError(corsMessage);
      }
    } else {
      // Outros erros
      if (API_CONFIG.USE_MOCKUP_ON_ERROR && typeof mockData !== 'undefined') {
        useMockupData();
      } else {
        showError(error.message || 'Não foi possível carregar as conversas. Verifique sua conexão e tente novamente.');
      }
    }
  }
}

/**
 * Usa dados mockup como fallback
 */
function useMockupData() {
  state.conversations = groupBySession(mockData);
  state.filteredConversations = { ...state.conversations };
  
  populateClientFilter();
  renderConversationList();
  
  hideError();
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
  
  // Botão tentar novamente (retry)
  if (elements.retryButton) {
    elements.retryButton.addEventListener('click', () => {
      loadData();
    });
  }
  
  // Botão usar dados mockup
  if (elements.useMockupButton) {
    elements.useMockupButton.addEventListener('click', () => {
      useMockupData();
    });
  }
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

/**
 * Mostra o estado de loading
 */
function showLoading() {
  if (elements.loadingState) {
    elements.loadingState.style.display = 'flex';
  }
}

/**
 * Esconde o estado de loading
 */
function hideLoading() {
  if (elements.loadingState) {
    elements.loadingState.style.display = 'none';
  }
}

/**
 * Mostra o estado de erro
 * @param {string} message - Mensagem de erro
 */
function showError(message) {
  if (elements.errorState && elements.errorText) {
    elements.errorText.textContent = message;
    elements.errorState.style.display = 'flex';
  }
}

/**
 * Esconde o estado de erro
 */
function hideError() {
  if (elements.errorState) {
    elements.errorState.style.display = 'none';
  }
}

// ========================================
// INICIALIZAÇÃO
// ========================================

// Aguarda o DOM carregar
document.addEventListener('DOMContentLoaded', init);

