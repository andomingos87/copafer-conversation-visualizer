// ========================================
// COMPONENTE DE FEEDBACK
// ========================================

// Estado do feedback
const feedbackState = {
  currentSessionId: null,
  currentFeedback: null,
  isLoading: false
};

// Referências aos elementos do DOM
const feedbackElements = {
  modal: null,
  overlay: null,
  closeBtn: null,
  ratingContainer: null,
  commentTextarea: null,
  saveBtn: null,
  cancelBtn: null,
  loadingIndicator: null,
  errorMessage: null,
  stars: []
};

/**
 * Inicializa o componente de feedback
 */
function initFeedback() {
  // Cria elementos do modal se não existirem
  createFeedbackModal();
  
  // Captura referências
  feedbackElements.modal = document.getElementById('feedbackModal');
  feedbackElements.overlay = document.getElementById('feedbackOverlay');
  feedbackElements.closeBtn = document.getElementById('feedbackCloseBtn');
  feedbackElements.ratingContainer = document.getElementById('feedbackRating');
  feedbackElements.commentTextarea = document.getElementById('feedbackComment');
  feedbackElements.saveBtn = document.getElementById('feedbackSaveBtn');
  feedbackElements.cancelBtn = document.getElementById('feedbackCancelBtn');
  feedbackElements.loadingIndicator = document.getElementById('feedbackLoading');
  feedbackElements.errorMessage = document.getElementById('feedbackError');
  
  // Configura event listeners
  setupFeedbackListeners();
}

/**
 * Cria o modal de feedback no DOM
 */
function createFeedbackModal() {
  // Verifica se já existe
  if (document.getElementById('feedbackModal')) {
    return;
  }
  
  const modalHTML = `
    <div id="feedbackOverlay" class="feedback-overlay" style="display: none;">
      <div id="feedbackModal" class="feedback-modal">
        <div class="feedback-modal-header">
          <h2>Feedback da Conversa</h2>
          <button id="feedbackCloseBtn" class="feedback-close-btn" aria-label="Fechar">×</button>
        </div>
        
        <div class="feedback-modal-body">
          <div id="feedbackError" class="feedback-error" style="display: none;"></div>
          
          <div class="feedback-section">
            <label class="feedback-label">Avaliação (Estrelas)</label>
            <div id="feedbackRating" class="feedback-rating">
              ${Array.from({ length: 5 }, (_, i) => `
                <button 
                  type="button" 
                  class="feedback-star" 
                  data-rating="${i + 1}"
                  aria-label="${i + 1} estrela${i + 1 > 1 ? 's' : ''}"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>
              `).join('')}
            </div>
            <div class="feedback-rating-text">
              <span id="feedbackRatingText">Clique para avaliar</span>
            </div>
          </div>
          
          <div class="feedback-section">
            <label for="feedbackComment" class="feedback-label">Comentário</label>
            <textarea 
              id="feedbackComment" 
              class="feedback-comment"
              placeholder="Deixe seu comentário sobre esta conversa..."
              rows="4"
            ></textarea>
          </div>
        </div>
        
        <div class="feedback-modal-footer">
          <div id="feedbackLoading" class="feedback-loading" style="display: none;">
            <div class="spinner-small"></div>
            <span>Salvando...</span>
          </div>
          <div class="feedback-actions">
            <button id="feedbackCancelBtn" class="feedback-btn feedback-btn-secondary">Cancelar</button>
            <button id="feedbackSaveBtn" class="feedback-btn feedback-btn-primary">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Cria estrelas após inserir no DOM
  setTimeout(() => {
    feedbackElements.stars = Array.from(document.querySelectorAll('.feedback-star'));
    setupStarListeners();
  }, 0);
}

/**
 * Configura event listeners do feedback
 */
function setupFeedbackListeners() {
  // Fechar modal
  if (feedbackElements.closeBtn) {
    feedbackElements.closeBtn.addEventListener('click', closeFeedbackModal);
  }
  
  if (feedbackElements.cancelBtn) {
    feedbackElements.cancelBtn.addEventListener('click', closeFeedbackModal);
  }
  
  if (feedbackElements.overlay) {
    feedbackElements.overlay.addEventListener('click', (e) => {
      if (e.target === feedbackElements.overlay) {
        closeFeedbackModal();
      }
    });
  }
  
  // Salvar feedback
  if (feedbackElements.saveBtn) {
    feedbackElements.saveBtn.addEventListener('click', handleSaveFeedback);
  }
  
  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && feedbackElements.modal && feedbackElements.modal.parentElement.style.display !== 'none') {
      closeFeedbackModal();
    }
  });
}

/**
 * Configura listeners das estrelas
 */
function setupStarListeners() {
  feedbackElements.stars.forEach((star, index) => {
    const rating = index + 1;
    
    star.addEventListener('click', () => {
      setRating(rating);
    });
    
    star.addEventListener('mouseenter', () => {
      if (!feedbackState.isLoading) {
        highlightStars(rating);
      }
    });
  });
  
  // Remove highlight ao sair do container
  if (feedbackElements.ratingContainer) {
    feedbackElements.ratingContainer.addEventListener('mouseleave', () => {
      if (!feedbackState.isLoading) {
        const currentRating = feedbackState.currentFeedback?.rating || 0;
        highlightStars(currentRating);
      }
    });
  }
}

/**
 * Define a avaliação selecionada
 * @param {number} rating - Avaliação (1-5)
 */
function setRating(rating) {
  if (feedbackState.isLoading) return;
  
  if (!feedbackState.currentFeedback) {
    feedbackState.currentFeedback = {};
  }
  
  feedbackState.currentFeedback.rating = rating;
  highlightStars(rating);
  updateRatingText(rating);
}

/**
 * Destaca estrelas até o rating especificado
 * @param {number} rating - Rating até onde destacar
 */
function highlightStars(rating) {
  feedbackElements.stars.forEach((star, index) => {
    const starRating = index + 1;
    if (starRating <= rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

/**
 * Atualiza texto da avaliação
 * @param {number} rating - Rating selecionado
 */
function updateRatingText(rating) {
  const ratingTexts = {
    1: 'Péssimo',
    2: 'Ruim',
    3: 'Regular',
    4: 'Bom',
    5: 'Excelente'
  };
  
  const textEl = document.getElementById('feedbackRatingText');
  if (textEl) {
    textEl.textContent = ratingTexts[rating] || 'Clique para avaliar';
  }
}

/**
 * Abre o modal de feedback
 * @param {string} sessionId - ID da sessão
 */
async function openFeedbackModal(sessionId) {
  if (!sessionId) {
    console.error('Session ID é obrigatório');
    return;
  }
  
  feedbackState.currentSessionId = sessionId;
  feedbackState.isLoading = true;
  
  // Mostra modal
  if (feedbackElements.modal && feedbackElements.overlay) {
    feedbackElements.overlay.style.display = 'flex';
    feedbackElements.modal.classList.add('show');
  }
  
  // Limpa formulário
  resetFeedbackForm();
  
  // Mostra loading
  showFeedbackLoading(true);
  hideFeedbackError();
  
  try {
    // Busca feedback existente
    const feedback = await getFeedback(sessionId);
    
    if (feedback) {
      feedbackState.currentFeedback = feedback;
      
      // Preenche formulário
      if (feedback.rating) {
        setRating(feedback.rating);
      }
      
      if (feedback.comment) {
        feedbackElements.commentTextarea.value = feedback.comment;
      }
    } else {
      feedbackState.currentFeedback = {};
    }
    
  } catch (error) {
    console.error('Erro ao carregar feedback:', error);
    showFeedbackError('Erro ao carregar feedback. Tente novamente.');
  } finally {
    feedbackState.isLoading = false;
    showFeedbackLoading(false);
  }
}

/**
 * Fecha o modal de feedback
 */
function closeFeedbackModal() {
  if (feedbackElements.modal && feedbackElements.overlay) {
    feedbackElements.modal.classList.remove('show');
    setTimeout(() => {
      feedbackElements.overlay.style.display = 'none';
    }, 200);
  }
  
  // Limpa estado
  feedbackState.currentSessionId = null;
  feedbackState.currentFeedback = null;
  resetFeedbackForm();
  hideFeedbackError();
}

/**
 * Reseta o formulário de feedback
 */
function resetFeedbackForm() {
  // Limpa estrelas
  highlightStars(0);
  updateRatingText(0);
  
  // Limpa comentário
  if (feedbackElements.commentTextarea) {
    feedbackElements.commentTextarea.value = '';
  }
  
  // Reseta estado
  feedbackState.currentFeedback = {};
}

/**
 * Handler para salvar feedback
 */
async function handleSaveFeedback() {
  if (feedbackState.isLoading) return;
  
  const sessionId = feedbackState.currentSessionId;
  if (!sessionId) {
    showFeedbackError('Erro: Session ID não encontrado.');
    return;
  }
  
  // Obtém valores do formulário
  const rating = feedbackState.currentFeedback?.rating || null;
  const comment = feedbackElements.commentTextarea?.value?.trim() || null;
  
  // Validação
  if (!rating && !comment) {
    showFeedbackError('Por favor, preencha pelo menos a avaliação ou o comentário.');
    return;
  }
  
  // Mostra loading
  feedbackState.isLoading = true;
  showFeedbackLoading(true);
  hideFeedbackError();
  
  // Desabilita botão
  if (feedbackElements.saveBtn) {
    feedbackElements.saveBtn.disabled = true;
  }
  
  try {
    // Salva feedback
    const savedFeedback = await saveFeedback(sessionId, rating, comment);
    
    // Atualiza estado
    feedbackState.currentFeedback = savedFeedback;
    
    // Atualiza indicadores na UI
    updateFeedbackIndicators(sessionId, savedFeedback);
    
    // Fecha modal após um breve delay
    setTimeout(() => {
      closeFeedbackModal();
      
      // Mostra mensagem de sucesso (opcional)
      // Você pode adicionar um toast aqui se quiser
    }, 300);
    
  } catch (error) {
    console.error('Erro ao salvar feedback:', error);
    showFeedbackError(error.message || 'Erro ao salvar feedback. Tente novamente.');
  } finally {
    feedbackState.isLoading = false;
    showFeedbackLoading(false);
    
    // Reabilita botão
    if (feedbackElements.saveBtn) {
      feedbackElements.saveBtn.disabled = false;
    }
  }
}

/**
 * Mostra/esconde loading
 * @param {boolean} show - Se deve mostrar
 */
function showFeedbackLoading(show) {
  if (feedbackElements.loadingIndicator) {
    feedbackElements.loadingIndicator.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Mostra mensagem de erro
 * @param {string} message - Mensagem de erro
 */
function showFeedbackError(message) {
  if (feedbackElements.errorMessage) {
    feedbackElements.errorMessage.textContent = message;
    feedbackElements.errorMessage.style.display = 'block';
  }
}

/**
 * Esconde mensagem de erro
 */
function hideFeedbackError() {
  if (feedbackElements.errorMessage) {
    feedbackElements.errorMessage.style.display = 'none';
  }
}

/**
 * Atualiza indicadores visuais de feedback
 * @param {string} sessionId - ID da sessão
 * @param {Object} feedback - Objeto de feedback
 */
function updateFeedbackIndicators(sessionId, feedback) {
  // Atualiza indicador no header
  updateHeaderFeedbackIndicator(feedback);
  
  // Atualiza indicador na lista de conversas
  updateConversationListFeedbackIndicator(sessionId, feedback);
  
  // Atualiza estado global (se necessário)
  if (typeof state !== 'undefined' && state.feedbacks) {
    state.feedbacks[sessionId] = feedback;
  }
}

/**
 * Atualiza indicador no header
 * @param {Object} feedback - Objeto de feedback
 */
function updateHeaderFeedbackIndicator(feedback) {
  const feedbackBtn = document.getElementById('feedbackBtn');
  if (!feedbackBtn) return;
  
  const hasFeedback = feedback && (feedback.rating || feedback.comment);
  
  if (hasFeedback) {
    feedbackBtn.classList.add('has-feedback');
    feedbackBtn.title = 'Editar feedback';
  } else {
    feedbackBtn.classList.remove('has-feedback');
    feedbackBtn.title = 'Adicionar feedback';
  }
}

/**
 * Atualiza indicador na lista de conversas
 * @param {string} sessionId - ID da sessão
 * @param {Object} feedback - Objeto de feedback
 */
function updateConversationListFeedbackIndicator(sessionId, feedback) {
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
    indicator.innerHTML = feedback.rating 
      ? '⭐'.repeat(feedback.rating)
      : '💬';
    indicator.title = 'Esta conversa tem feedback';
    
    const meta = conversationItem.querySelector('.conversation-meta');
    if (meta) {
      meta.insertBefore(indicator, meta.firstChild);
    }
  }
}

