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
  autocompleteHighlightedIndex: -1, // Índice da opção destacada no autocomplete
  feedbacks: {},           // Feedbacks por session_id
  // Filtro de data
  dateFilter: {
    active: false,          // Se o filtro de data está ativo
    startDate: null,        // Data de início (Date object)
    endDate: null,          // Data de fim (Date object)
    criteria: 'last',       // Critério: 'first', 'last', 'any'
    period: null            // Período selecionado (today, yesterday, etc.) ou 'custom'
  }
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
  sidebarOverlay: null,
  // Elementos de exportação
  exportAllBtn: null,
  exportAllDropdown: null,
  exportCurrentWrapper: null,
  exportCurrentBtn: null,
  exportCurrentDropdown: null,
  // Elementos do filtro de data
  dateFilterClear: null,
  dateCriteriaInputs: null,
  dateShortcutBtns: null,
  dateFrom: null,
  dateTo: null,
  dateFilterActive: null,
  dateFilterActiveText: null,
  // Elementos de feedback
  feedbackBtn: null
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
  // Elementos de exportação
  elements.exportAllBtn = document.getElementById('exportAllBtn');
  elements.exportAllDropdown = document.getElementById('exportAllDropdown');
  elements.exportCurrentWrapper = document.getElementById('exportCurrentWrapper');
  elements.exportCurrentBtn = document.getElementById('exportCurrentBtn');
  elements.exportCurrentDropdown = document.getElementById('exportCurrentDropdown');
  // Elementos do filtro de data (dropdown compacto)
  elements.dateFilterToggle = document.getElementById('dateFilterToggle');
  elements.dateFilterLabel = document.getElementById('dateFilterLabel');
  elements.dateFilterDropdown = document.getElementById('dateFilterDropdown');
  elements.dateFilterClear = document.getElementById('dateFilterClear');
  elements.dateCriteriaSelect = document.getElementById('dateCriteriaSelect');
  elements.dateOptionBtns = document.querySelectorAll('.date-badge');
  elements.dateFrom = document.getElementById('dateFrom');
  elements.dateTo = document.getElementById('dateTo');
  
  // Carrega e processa os dados
  loadData();
  
  // Configura event listeners
  setupEventListeners();
  
  // Inicializa componente de feedback
  if (typeof initFeedback === 'function') {
    initFeedback();
  }
  
  // Captura referência do botão de feedback
  elements.feedbackBtn = document.getElementById('feedbackBtn');
  if (elements.feedbackBtn) {
    elements.feedbackBtn.addEventListener('click', handleFeedbackClick);
  }
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
    
    // Carrega feedbacks de todas as conversas (assíncrono, atualiza depois)
    loadAllFeedbacks().then(() => {
      updateConversationListFeedbackIndicators();
    });

    // Verifica se há conversa na URL para abrir automaticamente
    openConversationFromUrl();

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
  
  // Carrega feedbacks mesmo com dados mockup (assíncrono, atualiza depois)
  loadAllFeedbacks().then(() => {
    updateConversationListFeedbackIndicators();
  });

  // Verifica se há conversa na URL para abrir automaticamente
  openConversationFromUrl();

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
    // Fecha dropdowns de exportação ao clicar fora
    if (!e.target.closest('.export-wrapper')) {
      hideAllExportDropdowns();
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

  // Navegação do histórico (botão voltar/avançar do navegador)
  window.addEventListener('popstate', handlePopState);

  // Configura exportação
  setupExportListeners();

  // Configura filtro de data
  setupDateFilterListeners();
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
 * Obtém a data da última mensagem de uma conversa para ordenação
 * @param {Array} messages - Array de mensagens da conversa
 * @returns {Date|null} - Data da última mensagem ou null
 */
function getLastMessageDate(messages) {
  if (!messages || messages.length === 0) return null;
  
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.created_at) {
    return new Date(lastMessage.created_at);
  }
  
  return null;
}

/**
 * Renderiza a lista de conversas na sidebar
 */
function renderConversationList() {
  const conversations = state.filteredConversations;
  let sessions = Object.keys(conversations);
  
  // Ordena conversas pela data da última mensagem (mais recente primeiro)
  sessions.sort((sessionIdA, sessionIdB) => {
    const messagesA = conversations[sessionIdA];
    const messagesB = conversations[sessionIdB];
    
    const dateA = getLastMessageDate(messagesA);
    const dateB = getLastMessageDate(messagesB);
    
    // Se ambas têm data, ordena por data (mais recente primeiro)
    if (dateA && dateB) {
      return dateB - dateA; // Ordem decrescente (mais recente primeiro)
    }
    
    // Se apenas uma tem data, ela vem primeiro
    if (dateA && !dateB) return -1;
    if (!dateA && dateB) return 1;
    
    // Se nenhuma tem data, mantém ordem original
    return 0;
  });
  
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
    
    // Obtém a data da última mensagem da conversa
    let conversationDate = '';
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.created_at) {
      conversationDate = formatDateOnly(lastMessage.created_at);
    }
    
    const item = document.createElement('div');
    item.className = `conversation-item${isActive ? ' active' : ''}`;
    item.dataset.sessionId = sessionId;
    
    item.innerHTML = `
      <div class="conversation-avatar">📱</div>
      <div class="conversation-info">
        <div class="conversation-number">${formatPhoneNumber(sessionId)}</div>
        <div class="conversation-preview">${escapeHtml(preview)}</div>
        ${conversationDate ? `<div class="conversation-date">${conversationDate}</div>` : ''}
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
  
  // Mostra botão de exportar conversa atual
  toggleExportCurrentButton(true);
  
  // Mostra botão de feedback
  if (elements.feedbackBtn) {
    elements.feedbackBtn.style.display = 'flex';
  }
  
  // Carrega e atualiza feedback da conversa
  loadConversationFeedback(sessionId);
  
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
    
    // Obtém o horário e data da mensagem
    let messageTime = '';
    let messageDate = '';
    if (msg.created_at) {
      messageTime = formatTime(msg.created_at);
      messageDate = formatDateOnly(msg.created_at);
    } else {
      // Se não houver created_at, gera um horário baseado no índice (para dados mockup)
      // Simula horários incrementais para visualização
      const baseDate = new Date();
      baseDate.setHours(9, 0, 0); // Começa às 09:00:00
      baseDate.setSeconds(baseDate.getSeconds() + (index * 30)); // Incrementa 30 segundos por mensagem
      messageTime = formatTime(baseDate.toISOString());
      messageDate = formatDateOnly(baseDate.toISOString());
    }
    
    // Se ainda não tiver horário, usa horário atual
    if (!messageTime) {
      const now = new Date();
      messageTime = formatTime(now.toISOString());
      messageDate = formatDateOnly(now.toISOString());
    }
    
    // Formata data e horário juntos
    const dateTimeDisplay = messageDate ? `${messageDate} ${messageTime}` : messageTime;
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.style.animationDelay = `${index * 0.05}s`;
    
    const senderLabel = type === 'human' ? '👤 Cliente' : '🤖 Copafer IA';
    
    messageEl.innerHTML = `
      <div class="message-header">
        <div class="message-sender">${senderLabel}</div>
        <div class="message-time">${dateTimeDisplay}</div>
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
 * @param {boolean} [updateUrl=true] - Se deve atualizar a URL
 */
function selectConversation(sessionId, updateUrl = true) {
  state.selectedSession = sessionId;

  // Atualiza visual da lista
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.classList.toggle('active', item.dataset.sessionId === sessionId);
  });

  // Renderiza mensagens
  renderMessages(sessionId);

  // Atualiza a URL com o parâmetro da conversa
  if (updateUrl) {
    updateUrlWithConversation(sessionId);
  }

  // Fecha sidebar em mobile após selecionar conversa
  if (isMobileView()) {
    closeSidebar();
  }
}

/**
 * Atualiza a URL com o ID da conversa selecionada
 * @param {string} sessionId - ID da sessão
 */
function updateUrlWithConversation(sessionId) {
  const url = new URL(window.location);
  url.searchParams.set('conversation', sessionId);
  window.history.pushState({ sessionId }, '', url);
}

/**
 * Remove o parâmetro de conversa da URL
 */
function clearUrlConversation() {
  const url = new URL(window.location);
  url.searchParams.delete('conversation');
  window.history.pushState({}, '', url);
}

/**
 * Obtém o ID da conversa da URL
 * @returns {string|null} - ID da conversa ou null
 */
function getConversationFromUrl() {
  const url = new URL(window.location);
  return url.searchParams.get('conversation');
}

// ========================================
// URL PARAMETERS - FILTROS
// ========================================

/**
 * Atualiza a URL com todos os filtros ativos
 * Não adiciona ao histórico (usa replaceState)
 */
function updateUrlWithFilters() {
  const url = new URL(window.location);

  // Filtro de cliente
  if (state.clientFilter) {
    url.searchParams.set('client', state.clientFilter);
  } else {
    url.searchParams.delete('client');
  }

  // Filtro de busca
  if (state.searchTerm) {
    url.searchParams.set('search', state.searchTerm);
  } else {
    url.searchParams.delete('search');
  }

  // Filtro de data
  if (state.dateFilter.active && state.dateFilter.startDate && state.dateFilter.endDate) {
    url.searchParams.set('dateFrom', formatDateForInput(state.dateFilter.startDate));
    url.searchParams.set('dateTo', formatDateForInput(state.dateFilter.endDate));
    url.searchParams.set('dateCriteria', state.dateFilter.criteria);
    if (state.dateFilter.period) {
      url.searchParams.set('datePeriod', state.dateFilter.period);
    }
  } else {
    url.searchParams.delete('dateFrom');
    url.searchParams.delete('dateTo');
    url.searchParams.delete('dateCriteria');
    url.searchParams.delete('datePeriod');
  }

  // Usa replaceState para não poluir o histórico
  window.history.replaceState(window.history.state, '', url);
}

/**
 * Obtém os filtros da URL
 * @returns {Object} - Objeto com os filtros da URL
 */
function getFiltersFromUrl() {
  const url = new URL(window.location);

  return {
    client: url.searchParams.get('client'),
    search: url.searchParams.get('search'),
    dateFrom: url.searchParams.get('dateFrom'),
    dateTo: url.searchParams.get('dateTo'),
    dateCriteria: url.searchParams.get('dateCriteria') || 'last',
    datePeriod: url.searchParams.get('datePeriod')
  };
}

/**
 * Restaura os filtros a partir dos parâmetros da URL
 */
function restoreFiltersFromUrl() {
  const filters = getFiltersFromUrl();
  let hasFilters = false;

  // Restaura filtro de cliente
  if (filters.client && state.conversations[filters.client]) {
    state.clientFilter = filters.client;
    const client = state.availableClients.find(c => c.sessionId === filters.client);
    if (client && elements.clientFilter) {
      elements.clientFilter.value = client.displayText;
      elements.clientFilterClear.style.display = 'flex';
    }
    hasFilters = true;
  }

  // Restaura filtro de busca
  if (filters.search) {
    state.searchTerm = filters.search;
    if (elements.searchInput) {
      elements.searchInput.value = filters.search;
      elements.clearSearch.classList.add('visible');
    }
    hasFilters = true;
  }

  // Restaura filtro de data
  if (filters.dateFrom && filters.dateTo) {
    const startDate = startOfDay(new Date(filters.dateFrom + 'T00:00:00'));
    const endDate = endOfDay(new Date(filters.dateTo + 'T00:00:00'));

    // Valida se as datas são válidas
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      state.dateFilter.active = true;
      state.dateFilter.startDate = startDate;
      state.dateFilter.endDate = endDate;
      state.dateFilter.criteria = filters.dateCriteria;
      state.dateFilter.period = filters.datePeriod || 'custom';

      // Atualiza UI dos filtros de data
      if (elements.dateFrom) {
        elements.dateFrom.value = filters.dateFrom;
      }
      if (elements.dateTo) {
        elements.dateTo.value = filters.dateTo;
      }
      if (elements.dateCriteriaSelect) {
        elements.dateCriteriaSelect.value = filters.dateCriteria;
      }

      // Marca o botão de período se aplicável
      if (filters.datePeriod && filters.datePeriod !== 'custom') {
        elements.dateOptionBtns.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.period === filters.datePeriod);
        });
      }

      // Atualiza label do toggle
      updateDateFilterLabel(state.dateFilter.period, startDate, endDate);

      hasFilters = true;
    }
  }

  // Se houver filtros, aplica-os (sem atualizar URL novamente)
  if (hasFilters) {
    applyFilters(false);
  }
}

/**
 * Limpa todos os parâmetros de filtro da URL (exceto conversation)
 */
function clearUrlFilters() {
  const url = new URL(window.location);
  url.searchParams.delete('client');
  url.searchParams.delete('search');
  url.searchParams.delete('dateFrom');
  url.searchParams.delete('dateTo');
  url.searchParams.delete('dateCriteria');
  url.searchParams.delete('datePeriod');
  window.history.replaceState(window.history.state, '', url);
}

/**
 * Abre a conversa especificada na URL (se existir)
 * E restaura os filtros da URL
 */
function openConversationFromUrl() {
  // Primeiro restaura os filtros (sem atualizar URL novamente)
  restoreFiltersFromUrl();

  // Depois abre a conversa se especificada
  const conversationId = getConversationFromUrl();

  if (conversationId && state.filteredConversations[conversationId]) {
    // Usa updateUrl=false para não duplicar o histórico
    selectConversation(conversationId, false);
  } else if (conversationId && state.conversations[conversationId]) {
    // Se a conversa existe mas não está nos filtros, limpa os filtros e abre
    selectConversation(conversationId, false);
  }
}

/**
 * Handler para navegação do histórico (botão voltar/avançar)
 * @param {PopStateEvent} event - Evento popstate
 */
function handlePopState(event) {
  const conversationId = getConversationFromUrl();

  if (conversationId && state.filteredConversations[conversationId]) {
    // Seleciona a conversa sem atualizar a URL novamente
    selectConversation(conversationId, false);
  } else {
    // Se não há conversa na URL, limpa a seleção
    state.selectedSession = null;
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.classList.remove('active');
    });
    elements.chatMessages.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📱</div>
        <p>Selecione uma conversa na lista ao lado para visualizar as mensagens</p>
      </div>
    `;
    elements.chatTitle.textContent = 'Selecione uma conversa';
    elements.messageCount.textContent = '';
    toggleExportCurrentButton(false);
    if (elements.feedbackBtn) {
      elements.feedbackBtn.style.display = 'none';
    }
  }
}

/**
 * Handler para clique no botão de feedback
 */
function handleFeedbackClick() {
  if (!state.selectedSession) {
    return;
  }
  
  if (typeof openFeedbackModal === 'function') {
    openFeedbackModal(state.selectedSession);
  }
}

/**
 * Carrega feedback de uma conversa
 * @param {string} sessionId - ID da sessão
 */
async function loadConversationFeedback(sessionId) {
  if (!sessionId || typeof getFeedback !== 'function') {
    return;
  }
  
  try {
    const feedback = await getFeedback(sessionId);
    
    if (feedback) {
      state.feedbacks[sessionId] = feedback;
      
      // Atualiza indicador no header
      if (elements.feedbackBtn) {
        elements.feedbackBtn.classList.add('has-feedback');
        elements.feedbackBtn.title = 'Editar feedback';
      }
    } else {
      // Remove feedback do estado se não existir
      delete state.feedbacks[sessionId];
      
      // Remove indicador do header
      if (elements.feedbackBtn) {
        elements.feedbackBtn.classList.remove('has-feedback');
        elements.feedbackBtn.title = 'Adicionar feedback';
      }
    }
  } catch (error) {
    console.warn('Erro ao carregar feedback:', error);
    // Não quebra a aplicação se houver erro
  }
}

/**
 * Carrega feedbacks de todas as conversas visíveis
 */
async function loadAllFeedbacks() {
  const sessionIds = Object.keys(state.filteredConversations);
  
  if (sessionIds.length === 0 || typeof getAllFeedbacks !== 'function') {
    return;
  }
  
  try {
    const feedbacks = await getAllFeedbacks(sessionIds);
    state.feedbacks = { ...state.feedbacks, ...feedbacks };
    
    // Atualiza indicadores na lista
    updateConversationListFeedbackIndicators();
  } catch (error) {
    console.warn('Erro ao carregar feedbacks:', error);
  }
}

/**
 * Atualiza indicadores de feedback na lista de conversas
 */
function updateConversationListFeedbackIndicators() {
  Object.keys(state.feedbacks).forEach(sessionId => {
    const feedback = state.feedbacks[sessionId];
    const conversationItem = document.querySelector(`[data-session-id="${sessionId}"]`);
    
    if (!conversationItem) return;
    
    const hasFeedback = feedback && (feedback.rating || feedback.comment);
    
    // Remove indicador existente
    const existingIndicator = conversationItem.querySelector('.conversation-feedback-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    // Adiciona indicador se houver feedback
    if (hasFeedback) {
      const indicator = document.createElement('div');
      indicator.className = 'conversation-feedback-indicator';
      
      if (feedback.rating) {
        indicator.innerHTML = '⭐'.repeat(feedback.rating);
        indicator.title = `Avaliação: ${feedback.rating} estrela${feedback.rating > 1 ? 's' : ''}${feedback.comment ? ' | Tem comentário' : ''}`;
      } else {
        indicator.innerHTML = '💬';
        indicator.title = 'Tem comentário';
      }
      
      const meta = conversationItem.querySelector('.conversation-meta');
      if (meta) {
        meta.insertBefore(indicator, meta.firstChild);
      }
    }
  });
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
 * @param {boolean} [updateUrl=true] - Se deve atualizar a URL com os filtros
 */
function applyFilters(updateUrl = true) {
  let filtered = { ...state.conversations };

  // Aplica filtro de cliente
  if (state.clientFilter) {
    filtered = {
      [state.clientFilter]: filtered[state.clientFilter]
    };
  }

  // Aplica filtro de data
  if (state.dateFilter.active && state.dateFilter.startDate && state.dateFilter.endDate) {
    filtered = filterConversationsByDate(
      filtered,
      state.dateFilter.startDate,
      state.dateFilter.endDate,
      state.dateFilter.criteria
    );
  }

  // Aplica filtro de busca
  if (state.searchTerm) {
    filtered = filterConversationsBySearch(filtered, state.searchTerm);
  }

  state.filteredConversations = filtered;

  // Atualiza a URL com os filtros
  if (updateUrl) {
    updateUrlWithFilters();
  }

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
    toggleExportCurrentButton(false);
    
    // Esconde botão de feedback
    if (elements.feedbackBtn) {
      elements.feedbackBtn.style.display = 'none';
    }
  }
}

// ========================================
// FILTRO DE DATA - DROPDOWN COMPACTO
// ========================================

/**
 * Configura listeners para o filtro de data
 */
function setupDateFilterListeners() {
  // Toggle do dropdown
  if (elements.dateFilterToggle) {
    elements.dateFilterToggle.addEventListener('click', toggleDateFilterDropdown);
  }
  
  // Fechar dropdown ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.date-filter-dropdown-wrapper')) {
      closeDateFilterDropdown();
    }
  });
  
  // Botão limpar filtro de data
  if (elements.dateFilterClear) {
    elements.dateFilterClear.addEventListener('click', clearDateFilter);
  }
  
  // Critério de data (select)
  if (elements.dateCriteriaSelect) {
    elements.dateCriteriaSelect.addEventListener('change', handleDateCriteriaChange);
  }
  
  // Opções de período
  if (elements.dateOptionBtns) {
    elements.dateOptionBtns.forEach(btn => {
      btn.addEventListener('click', handleDateOptionClick);
    });
  }
  
  // Campos de data personalizada
  if (elements.dateFrom) {
    elements.dateFrom.addEventListener('change', handleCustomDateChange);
  }
  if (elements.dateTo) {
    elements.dateTo.addEventListener('change', handleCustomDateChange);
  }
}

/**
 * Abre/fecha o dropdown do filtro de data
 */
function toggleDateFilterDropdown(e) {
  e.stopPropagation();
  
  const isOpen = elements.dateFilterDropdown.classList.contains('show');
  
  if (isOpen) {
    closeDateFilterDropdown();
  } else {
    openDateFilterDropdown();
  }
}

/**
 * Abre o dropdown do filtro de data
 */
function openDateFilterDropdown() {
  elements.dateFilterDropdown.classList.add('show');
  elements.dateFilterToggle.classList.add('active');
}

/**
 * Fecha o dropdown do filtro de data
 */
function closeDateFilterDropdown() {
  if (elements.dateFilterDropdown) {
    elements.dateFilterDropdown.classList.remove('show');
  }
  if (elements.dateFilterToggle) {
    elements.dateFilterToggle.classList.remove('active');
  }
}

/**
 * Handler para mudança no critério de data
 */
function handleDateCriteriaChange(e) {
  state.dateFilter.criteria = e.target.value;
  
  // Se já houver um filtro ativo, reaplica com novo critério
  if (state.dateFilter.active) {
    applyFilters();
  }
}

/**
 * Handler para clique nas opções de período
 */
function handleDateOptionClick(e) {
  const btn = e.currentTarget;
  const period = btn.dataset.period;
  
  // Remove classe active de todos os botões
  elements.dateOptionBtns.forEach(b => b.classList.remove('active'));
  
  // Adiciona classe active ao botão clicado
  btn.classList.add('active');
  
  // Obtém o período
  const dateRange = getDatePeriod(period);
  
  if (dateRange) {
    // Atualiza estado
    state.dateFilter.active = true;
    state.dateFilter.startDate = dateRange.startDate;
    state.dateFilter.endDate = dateRange.endDate;
    state.dateFilter.period = period;
    
    // Atualiza campos de data personalizada para refletir o período
    updateCustomDateInputs(dateRange.startDate, dateRange.endDate);
    
    // Atualiza label do toggle
    updateDateFilterLabel(period);
    
    // Aplica filtros
    applyFilters();
    
    // Fecha dropdown após selecionar
    closeDateFilterDropdown();
  }
}

/**
 * Handler para mudança nos campos de data personalizada
 */
function handleCustomDateChange() {
  const fromValue = elements.dateFrom.value;
  const toValue = elements.dateTo.value;
  
  // Remove classe active das opções de período
  elements.dateOptionBtns.forEach(btn => btn.classList.remove('active'));
  
  // Se ambas as datas estiverem preenchidas
  if (fromValue && toValue) {
    const startDate = startOfDay(new Date(fromValue + 'T00:00:00'));
    const endDate = endOfDay(new Date(toValue + 'T00:00:00'));
    
    // Valida se a data inicial é menor ou igual à final
    if (startDate > endDate) {
      // Troca as datas se estiverem invertidas
      state.dateFilter.startDate = endDate;
      state.dateFilter.endDate = startDate;
      
      // Atualiza os inputs
      elements.dateFrom.value = formatDateForInput(endDate);
      elements.dateTo.value = formatDateForInput(startDate);
    } else {
      state.dateFilter.startDate = startDate;
      state.dateFilter.endDate = endDate;
    }
    
    state.dateFilter.active = true;
    state.dateFilter.period = 'custom';
    
    // Atualiza label do toggle
    updateDateFilterLabel('custom', state.dateFilter.startDate, state.dateFilter.endDate);
    
    // Aplica filtros
    applyFilters();
  } else if (!fromValue && !toValue) {
    // Se ambas estiverem vazias, desativa o filtro
    state.dateFilter.active = false;
    state.dateFilter.startDate = null;
    state.dateFilter.endDate = null;
    state.dateFilter.period = null;
    updateDateFilterLabel(null);
    applyFilters();
  }
}

/**
 * Atualiza os campos de data personalizada
 * @param {Date} startDate - Data de início
 * @param {Date} endDate - Data de fim
 */
function updateCustomDateInputs(startDate, endDate) {
  if (elements.dateFrom && startDate) {
    elements.dateFrom.value = formatDateForInput(startDate);
  }
  if (elements.dateTo && endDate) {
    elements.dateTo.value = formatDateForInput(endDate);
  }
}

/**
 * Formata data para input type="date" (YYYY-MM-DD)
 * @param {Date} date - Data a formatar
 * @returns {string} - Data formatada
 */
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Atualiza o label do botão toggle do filtro
 * @param {string|null} period - Período selecionado
 * @param {Date} [startDate] - Data de início (para período custom)
 * @param {Date} [endDate] - Data de fim (para período custom)
 */
function updateDateFilterLabel(period, startDate, endDate) {
  if (!elements.dateFilterLabel || !elements.dateFilterToggle) return;
  
  if (!period) {
    elements.dateFilterLabel.textContent = 'Selecione o período...';
    elements.dateFilterToggle.classList.remove('has-filter');
    return;
  }
  
  let text = getPeriodLabel(period);
  
  if (period === 'custom' && startDate && endDate) {
    text = `${formatDateShort(startDate)} a ${formatDateShort(endDate)}`;
  }
  
  elements.dateFilterLabel.textContent = text;
  elements.dateFilterToggle.classList.add('has-filter');
}

/**
 * Limpa o filtro de data
 */
function clearDateFilter() {
  // Reseta estado
  state.dateFilter.active = false;
  state.dateFilter.startDate = null;
  state.dateFilter.endDate = null;
  state.dateFilter.period = null;
  
  // Remove classe active das opções
  elements.dateOptionBtns.forEach(btn => btn.classList.remove('active'));
  
  // Limpa campos de data
  if (elements.dateFrom) elements.dateFrom.value = '';
  if (elements.dateTo) elements.dateTo.value = '';
  
  // Reseta critério para padrão
  if (elements.dateCriteriaSelect) {
    elements.dateCriteriaSelect.value = 'last';
    state.dateFilter.criteria = 'last';
  }
  
  // Atualiza label
  updateDateFilterLabel(null);
  
  // Fecha dropdown
  closeDateFilterDropdown();
  
  // Reaplica filtros
  applyFilters();
}

// ========================================
// EXPORTAÇÃO
// ========================================

/**
 * Configura listeners para exportação
 */
function setupExportListeners() {
  // Botão exportar todas conversas
  if (elements.exportAllBtn) {
    elements.exportAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleExportDropdown(elements.exportAllDropdown);
    });
  }
  
  // Opções do dropdown de exportar todas
  if (elements.exportAllDropdown) {
    elements.exportAllDropdown.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const format = btn.dataset.format;
        handleExportAll(format);
        hideAllExportDropdowns();
      });
    });
  }
  
  // Botão exportar conversa atual
  if (elements.exportCurrentBtn) {
    elements.exportCurrentBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleExportDropdown(elements.exportCurrentDropdown);
    });
  }
  
  // Opções do dropdown de exportar conversa atual
  if (elements.exportCurrentDropdown) {
    elements.exportCurrentDropdown.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const format = btn.dataset.format;
        handleExportCurrent(format);
        hideAllExportDropdowns();
      });
    });
  }
}

/**
 * Alterna visibilidade do dropdown de exportação
 * @param {HTMLElement} dropdown - Elemento do dropdown
 */
function toggleExportDropdown(dropdown) {
  if (!dropdown) return;
  
  // Fecha outros dropdowns primeiro
  const allDropdowns = document.querySelectorAll('.export-dropdown');
  allDropdowns.forEach(d => {
    if (d !== dropdown) {
      d.classList.remove('show');
    }
  });
  
  // Alterna o dropdown atual
  dropdown.classList.toggle('show');
}

/**
 * Esconde todos os dropdowns de exportação
 */
function hideAllExportDropdowns() {
  const allDropdowns = document.querySelectorAll('.export-dropdown');
  allDropdowns.forEach(d => d.classList.remove('show'));
}

/**
 * Exporta todas as conversas filtradas
 * @param {string} format - Formato de exportação (json, txt, csv)
 */
function handleExportAll(format) {
  const conversations = state.filteredConversations;
  
  if (Object.keys(conversations).length === 0) {
    alert('Não há conversas para exportar.');
    return;
  }
  
  switch (format) {
    case 'json':
      exportToJSON(conversations, null);
      break;
    case 'txt':
      exportToTXT(conversations, null);
      break;
    case 'csv':
      exportToCSV(conversations, null);
      break;
    default:
      console.error('Formato de exportação não suportado:', format);
  }
}

/**
 * Exporta a conversa selecionada
 * @param {string} format - Formato de exportação (json, txt, csv)
 */
function handleExportCurrent(format) {
  if (!state.selectedSession) {
    alert('Nenhuma conversa selecionada.');
    return;
  }
  
  const conversations = {
    [state.selectedSession]: state.filteredConversations[state.selectedSession]
  };
  
  if (!conversations[state.selectedSession]) {
    alert('Conversa não encontrada.');
    return;
  }
  
  switch (format) {
    case 'json':
      exportToJSON(conversations, state.selectedSession);
      break;
    case 'txt':
      exportToTXT(conversations, state.selectedSession);
      break;
    case 'csv':
      exportToCSV(conversations, state.selectedSession);
      break;
    default:
      console.error('Formato de exportação não suportado:', format);
  }
}

/**
 * Mostra ou esconde o botão de exportar conversa atual
 * @param {boolean} show - Se deve mostrar ou esconder
 */
function toggleExportCurrentButton(show) {
  if (elements.exportCurrentWrapper) {
    elements.exportCurrentWrapper.style.display = show ? 'inline-flex' : 'none';
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

