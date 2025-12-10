// ========================================
// APLICAÇÃO PRINCIPAL - CHAT VIEWER
// ========================================

// Estado da aplicação
const state = {
  conversations: {},        // Conversas agrupadas por session_id
  filteredConversations: {}, // Conversas após filtros
  selectedSession: null,    // Session ID selecionada
  searchTerm: '',           // Termo de busca atual
  clientFilter: '',         // Filtro de cliente atual
  availableClients: [],     // Lista de clientes disponíveis para autocomplete
  autocompleteHighlightedIndex: -1 // Índice da opção destacada no autocomplete
};

// Referências aos elementos do DOM
const elements = {
  searchInput: null,
  clearSearch: null,
  clientFilter: null,
  clientFilterDropdown: null,
  clientFilterClear: null,
  conversationList: null,
  conversationCount: null,
  chatTitle: null,
  messageCount: null,
  chatMessages: null,
  loadingState: null,
  errorState: null,
  errorText: null,
  retryButton: null,
  useMockupButton: null,
  // Elementos responsivos
  menuToggle: null,
  sidebar: null,
  sidebarClose: null,
  sidebarOverlay: null
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
  elements.clientFilterDropdown = document.getElementById('clientFilterDropdown');
  elements.clientFilterClear = document.getElementById('clientFilterClear');
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
  // Elementos responsivos
  elements.menuToggle = document.getElementById('menuToggle');
  elements.sidebar = document.getElementById('sidebar');
  elements.sidebarClose = document.getElementById('sidebarClose');
  elements.sidebarOverlay = document.getElementById('sidebarOverlay');
  
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
  
  // Autocomplete de cliente
  elements.clientFilter.addEventListener('input', handleClientFilterInput);
  elements.clientFilter.addEventListener('focus', handleClientFilterFocus);
  elements.clientFilter.addEventListener('keydown', handleClientFilterKeydown);
  elements.clientFilterClear.addEventListener('click', clearClientFilter);
  
  // Fechar dropdown ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-wrapper')) {
      hideClientFilterDropdown();
    }
  });
  
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
  
  // Menu hambúrguer (responsivo)
  if (elements.menuToggle) {
    elements.menuToggle.addEventListener('click', openSidebar);
  }
  
  // Botão fechar sidebar
  if (elements.sidebarClose) {
    elements.sidebarClose.addEventListener('click', closeSidebar);
  }
  
  // Overlay da sidebar
  if (elements.sidebarOverlay) {
    elements.sidebarOverlay.addEventListener('click', closeSidebar);
  }
  
  // Fechar sidebar com tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.sidebar && elements.sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });
  
  // Detectar mudança de tamanho da tela
  window.addEventListener('resize', debounce(handleResize, 150));
}

// ========================================
// RENDERIZAÇÃO
// ========================================

/**
 * Popula a lista de clientes disponíveis para autocomplete
 */
function populateClientFilter() {
  const sessions = Object.keys(state.conversations);
  
  // Cria array de clientes com session_id e número formatado
  state.availableClients = sessions.map(sessionId => ({
    sessionId: sessionId,
    displayText: formatPhoneNumber(sessionId),
    rawNumber: sessionId.replace(/\D/g, '') // Número sem formatação para busca
  }));
  
  // Ordena por número
  state.availableClients.sort((a, b) => a.sessionId.localeCompare(b.sessionId));
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
    
    // Obtém o horário da mensagem
    let messageTime = '';
    if (msg.created_at) {
      messageTime = formatTime(msg.created_at);
    } else {
      // Se não houver created_at, gera um horário baseado no índice (para dados mockup)
      // Simula horários incrementais para visualização
      const baseDate = new Date();
      baseDate.setHours(9, 0, 0); // Começa às 09:00:00
      baseDate.setSeconds(baseDate.getSeconds() + (index * 30)); // Incrementa 30 segundos por mensagem
      messageTime = formatTime(baseDate.toISOString());
    }
    
    // Se ainda não tiver horário, usa horário atual
    if (!messageTime) {
      messageTime = formatTime(new Date().toISOString());
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.style.animationDelay = `${index * 0.05}s`;
    
    const senderLabel = type === 'human' ? '👤 Cliente' : '🤖 Copafer IA';
    
    messageEl.innerHTML = `
      <div class="message-header">
        <div class="message-sender">${senderLabel}</div>
        <div class="message-time">${messageTime}</div>
      </div>
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
  
  // Fecha sidebar em mobile após selecionar conversa
  if (isMobileView()) {
    closeSidebar();
  }
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
 * Handler para input do filtro de cliente (autocomplete)
 */
function handleClientFilterInput() {
  const value = elements.clientFilter.value.trim();
  state.autocompleteHighlightedIndex = -1;
  
  // Mostra/esconde botão limpar
  elements.clientFilterClear.style.display = value.length > 0 ? 'flex' : 'none';
  
  if (value.length === 0) {
    // Se vazio, limpa filtro
    state.clientFilter = '';
    hideClientFilterDropdown();
    applyFilters();
    return;
  }
  
  // Filtra clientes que correspondem ao termo digitado
  const filtered = filterClients(value);
  
  // Mostra dropdown com resultados
  renderClientFilterDropdown(filtered);
  
  // Tenta encontrar correspondência exata
  const exactMatch = findExactClientMatch(value);
  if (exactMatch) {
    // Se encontrar correspondência exata, aplica o filtro automaticamente
    state.clientFilter = exactMatch.sessionId;
    applyFilters();
  } else if (filtered.length === 1) {
    // Se houver apenas uma opção filtrada, aplica automaticamente
    state.clientFilter = filtered[0].sessionId;
    applyFilters();
  } else {
    // Se não houver correspondência exata ou única, limpa filtro
    // O usuário precisa selecionar uma opção do dropdown
    state.clientFilter = '';
    applyFilters();
  }
}

/**
 * Handler para quando o campo recebe foco
 */
function handleClientFilterFocus() {
  const value = elements.clientFilter.value.trim();
  if (value.length > 0) {
    const filtered = filterClients(value);
    renderClientFilterDropdown(filtered);
  } else {
    // Se vazio, mostra todos os clientes
    renderClientFilterDropdown(state.availableClients);
  }
}

/**
 * Handler para teclas no campo de filtro de cliente
 */
function handleClientFilterKeydown(e) {
  const dropdown = elements.clientFilterDropdown;
  const options = dropdown.querySelectorAll('.autocomplete-option');
  
  if (!dropdown.classList.contains('show') || options.length === 0) {
    if (e.key === 'Enter') {
      e.preventDefault();
      return;
    }
    return;
  }
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      state.autocompleteHighlightedIndex = Math.min(
        state.autocompleteHighlightedIndex + 1,
        options.length - 1
      );
      updateHighlightedOption(options);
      break;
      
    case 'ArrowUp':
      e.preventDefault();
      state.autocompleteHighlightedIndex = Math.max(
        state.autocompleteHighlightedIndex - 1,
        -1
      );
      updateHighlightedOption(options);
      break;
      
    case 'Enter':
      e.preventDefault();
      if (state.autocompleteHighlightedIndex >= 0 && options[state.autocompleteHighlightedIndex]) {
        selectClientFromDropdown(options[state.autocompleteHighlightedIndex]);
      } else if (options.length === 1) {
        // Se só há uma opção, seleciona ela
        selectClientFromDropdown(options[0]);
      }
      break;
      
    case 'Escape':
      e.preventDefault();
      hideClientFilterDropdown();
      elements.clientFilter.blur();
      break;
  }
}

/**
 * Filtra clientes baseado no termo de busca
 */
function filterClients(searchTerm) {
  if (!searchTerm) return state.availableClients;
  
  const term = searchTerm.toLowerCase().replace(/\D/g, ''); // Remove não-numéricos e converte para lowercase
  
  return state.availableClients.filter(client => {
    // Busca no número formatado
    const displayMatch = client.displayText.toLowerCase().includes(searchTerm.toLowerCase());
    // Busca no número sem formatação
    const rawMatch = client.rawNumber.includes(term);
    // Busca no session_id original
    const sessionMatch = client.sessionId.includes(searchTerm);
    
    return displayMatch || rawMatch || sessionMatch;
  });
}

/**
 * Encontra correspondência exata de cliente
 */
function findExactClientMatch(searchTerm) {
  const term = searchTerm.replace(/\D/g, ''); // Remove não-numéricos
  
  return state.availableClients.find(client => {
    return client.sessionId === searchTerm || 
           client.rawNumber === term ||
           client.sessionId.replace(/\D/g, '') === term;
  });
}

/**
 * Renderiza o dropdown do autocomplete
 */
function renderClientFilterDropdown(clients) {
  const dropdown = elements.clientFilterDropdown;
  
  if (clients.length === 0) {
    dropdown.innerHTML = '<div class="autocomplete-empty">Nenhum cliente encontrado</div>';
    dropdown.classList.add('show');
    return;
  }
  
  dropdown.innerHTML = '';
  
  clients.forEach((client, index) => {
    const option = document.createElement('div');
    option.className = 'autocomplete-option';
    option.dataset.sessionId = client.sessionId;
    option.textContent = client.displayText;
    
    // Adiciona highlight se corresponder ao texto digitado
    const searchTerm = elements.clientFilter.value.trim();
    if (searchTerm) {
      const highlighted = highlightClientOption(client.displayText, searchTerm);
      option.innerHTML = highlighted;
    } else {
      option.textContent = client.displayText;
    }
    
    option.addEventListener('click', () => selectClientFromDropdown(option));
    dropdown.appendChild(option);
  });
  
  dropdown.classList.add('show');
  state.autocompleteHighlightedIndex = -1;
}

/**
 * Destaca parte do texto da opção que corresponde à busca
 */
function highlightClientOption(text, searchTerm) {
  const term = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<strong>$1</strong>');
}

/**
 * Atualiza a opção destacada no dropdown
 */
function updateHighlightedOption(options) {
  options.forEach((option, index) => {
    option.classList.toggle('highlighted', index === state.autocompleteHighlightedIndex);
  });
  
  // Scroll para a opção destacada
  if (state.autocompleteHighlightedIndex >= 0 && options[state.autocompleteHighlightedIndex]) {
    options[state.autocompleteHighlightedIndex].scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
  }
}

/**
 * Seleciona um cliente do dropdown
 */
function selectClientFromDropdown(optionElement) {
  const sessionId = optionElement.dataset.sessionId;
  
  if (sessionId) {
    const client = state.availableClients.find(c => c.sessionId === sessionId);
    if (client) {
      elements.clientFilter.value = client.displayText;
      state.clientFilter = sessionId;
      hideClientFilterDropdown();
      applyFilters();
    }
  }
}

/**
 * Esconde o dropdown do autocomplete
 */
function hideClientFilterDropdown() {
  elements.clientFilterDropdown.classList.remove('show');
  state.autocompleteHighlightedIndex = -1;
}

/**
 * Limpa o filtro de cliente
 */
function clearClientFilter() {
  elements.clientFilter.value = '';
  state.clientFilter = '';
  elements.clientFilterClear.style.display = 'none';
  hideClientFilterDropdown();
  applyFilters();
  elements.clientFilter.focus();
}

/**
 * Handler para filtro de cliente (mantido para compatibilidade)
 */
function handleClientFilter() {
  // Esta função não é mais usada, mas mantida para evitar erros
  // O filtro agora é gerenciado por handleClientFilterInput
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
// SIDEBAR RESPONSIVA
// ========================================

/**
 * Verifica se está em modo mobile
 * @returns {boolean}
 */
function isMobileView() {
  return window.innerWidth <= 768;
}

/**
 * Abre a sidebar (mobile)
 */
function openSidebar() {
  if (elements.sidebar) {
    elements.sidebar.classList.add('open');
    document.body.style.overflow = 'hidden'; // Previne scroll do body
  }
  if (elements.sidebarOverlay) {
    elements.sidebarOverlay.classList.add('visible');
  }
}

/**
 * Fecha a sidebar (mobile)
 */
function closeSidebar() {
  if (elements.sidebar) {
    elements.sidebar.classList.remove('open');
    document.body.style.overflow = ''; // Restaura scroll do body
  }
  if (elements.sidebarOverlay) {
    elements.sidebarOverlay.classList.remove('visible');
  }
}

/**
 * Handler para redimensionamento da tela
 */
function handleResize() {
  // Se passou para desktop, fecha sidebar e remove classes
  if (!isMobileView()) {
    closeSidebar();
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

