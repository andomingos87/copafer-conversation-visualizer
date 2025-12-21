// ========================================
// COMPONENTE IMAGEM EXISTE
// ========================================

// Referências aos elementos do DOM
const imagemExisteElements = {
  overlay: null,
  modal: null,
  closeBtn: null,
  input: null,
  buscarBtn: null,
  buscarText: null,
  buscarSpinner: null,
  resultado: null,
  fecharBtn: null
};

// URL da API
const IMAGEM_EXISTE_API_URL = 'https://primary-production-ef755.up.railway.app/webhook/se-imagem-existe';

/**
 * Inicializa o componente Imagem Existe
 */
function initImagemExiste() {
  // Captura referências dos elementos
  imagemExisteElements.overlay = document.getElementById('imagemExisteOverlay');
  imagemExisteElements.modal = document.getElementById('imagemExisteModal');
  imagemExisteElements.closeBtn = document.getElementById('imagemExisteCloseBtn');
  imagemExisteElements.input = document.getElementById('imagemExisteInput');
  imagemExisteElements.buscarBtn = document.getElementById('imagemExisteBuscarBtn');
  imagemExisteElements.buscarText = document.querySelector('#imagemExisteBuscarBtn .buscar-text');
  imagemExisteElements.buscarSpinner = document.querySelector('#imagemExisteBuscarBtn .buscar-spinner');
  imagemExisteElements.resultado = document.getElementById('imagemExisteResultado');
  imagemExisteElements.fecharBtn = document.getElementById('imagemExisteFechaBtn');
  
  // Botão de abrir no header
  const openBtn = document.getElementById('imagemExisteBtn');
  
  // Configura event listeners
  if (openBtn) {
    openBtn.addEventListener('click', openImagemExistePopup);
  }
  
  if (imagemExisteElements.closeBtn) {
    imagemExisteElements.closeBtn.addEventListener('click', closeImagemExistePopup);
  }
  
  if (imagemExisteElements.fecharBtn) {
    imagemExisteElements.fecharBtn.addEventListener('click', closeImagemExistePopup);
  }
  
  if (imagemExisteElements.overlay) {
    imagemExisteElements.overlay.addEventListener('click', (e) => {
      if (e.target === imagemExisteElements.overlay) {
        closeImagemExistePopup();
      }
    });
  }
  
  if (imagemExisteElements.buscarBtn) {
    imagemExisteElements.buscarBtn.addEventListener('click', buscarImagem);
  }
  
  if (imagemExisteElements.input) {
    imagemExisteElements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        buscarImagem();
      }
    });
  }
  
  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imagemExisteElements.overlay?.style.display !== 'none') {
      closeImagemExistePopup();
    }
  });
}

/**
 * Abre o popup de verificação de imagem
 */
function openImagemExistePopup() {
  if (!imagemExisteElements.overlay || !imagemExisteElements.modal) return;
  
  // Limpa estado anterior
  resetImagemExisteForm();
  
  // Mostra overlay
  imagemExisteElements.overlay.style.display = 'flex';
  
  // Anima modal
  requestAnimationFrame(() => {
    imagemExisteElements.modal.classList.add('show');
  });
  
  // Foca no input
  setTimeout(() => {
    imagemExisteElements.input?.focus();
  }, 100);
}

/**
 * Fecha o popup
 */
function closeImagemExistePopup() {
  if (!imagemExisteElements.overlay || !imagemExisteElements.modal) return;
  
  // Remove animação
  imagemExisteElements.modal.classList.remove('show');
  
  // Esconde overlay após animação
  setTimeout(() => {
    imagemExisteElements.overlay.style.display = 'none';
  }, 200);
}

/**
 * Reseta o formulário
 */
function resetImagemExisteForm() {
  if (imagemExisteElements.input) {
    imagemExisteElements.input.value = '';
    imagemExisteElements.input.disabled = false;
  }
  
  if (imagemExisteElements.resultado) {
    imagemExisteElements.resultado.style.display = 'none';
    imagemExisteElements.resultado.className = 'imagem-existe-resultado';
  }
  
  setImagemExisteLoading(false);
}

/**
 * Mostra/esconde loading
 */
function setImagemExisteLoading(isLoading) {
  if (imagemExisteElements.buscarBtn) {
    imagemExisteElements.buscarBtn.disabled = isLoading;
  }
  
  if (imagemExisteElements.input) {
    imagemExisteElements.input.disabled = isLoading;
  }
  
  if (imagemExisteElements.buscarText) {
    imagemExisteElements.buscarText.style.display = isLoading ? 'none' : 'inline';
  }
  
  if (imagemExisteElements.buscarSpinner) {
    imagemExisteElements.buscarSpinner.style.display = isLoading ? 'flex' : 'none';
  }
}

/**
 * Mostra o resultado da busca
 */
function showImagemExisteResultado(existe, erro = false) {
  if (!imagemExisteElements.resultado) return;
  
  const iconEl = imagemExisteElements.resultado.querySelector('.resultado-icon');
  const textoEl = imagemExisteElements.resultado.querySelector('.resultado-texto');
  
  imagemExisteElements.resultado.style.display = 'flex';
  
  if (erro) {
    imagemExisteElements.resultado.className = 'imagem-existe-resultado erro';
    if (iconEl) iconEl.textContent = '⚠️';
    if (textoEl) textoEl.textContent = typeof existe === 'string' ? existe : 'Erro ao verificar imagem';
  } else if (existe) {
    imagemExisteElements.resultado.className = 'imagem-existe-resultado sucesso';
    if (iconEl) iconEl.textContent = '✅';
    if (textoEl) textoEl.textContent = 'Imagem existe';
  } else {
    imagemExisteElements.resultado.className = 'imagem-existe-resultado erro';
    if (iconEl) iconEl.textContent = '❌';
    if (textoEl) textoEl.textContent = 'Imagem não existe';
  }
}

/**
 * Faz a busca na API
 */
async function buscarImagem() {
  const codigoProduto = imagemExisteElements.input?.value?.trim();
  
  // Validação
  if (!codigoProduto) {
    imagemExisteElements.input?.focus();
    return;
  }
  
  // Esconde resultado anterior
  if (imagemExisteElements.resultado) {
    imagemExisteElements.resultado.style.display = 'none';
  }
  
  // Mostra loading
  setImagemExisteLoading(true);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout
    
    const response = await fetch(IMAGEM_EXISTE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ idProduto: codigoProduto }]),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    // Primeiro, tenta ler como texto
    const responseText = await response.text();
    
    // Se a resposta estiver vazia
    if (!responseText || responseText.trim() === '') {
      throw new Error('Resposta vazia da API');
    }
    
    let existe = false;
    
    // Tenta interpretar a resposta
    const trimmedResponse = responseText.trim().toLowerCase();
    
    // Verifica se é um boolean como texto
    if (trimmedResponse === 'true') {
      existe = true;
    } else if (trimmedResponse === 'false') {
      existe = false;
    } else {
      // Tenta parsear como JSON
      try {
        const data = JSON.parse(responseText);
        
        if (typeof data === 'boolean') {
          existe = data;
        } else if (typeof data === 'string') {
          existe = data.toLowerCase() === 'true';
        } else if (Array.isArray(data) && data.length > 0) {
          const firstItem = data[0];
          if (typeof firstItem === 'boolean') {
            existe = firstItem;
          } else if (typeof firstItem === 'string') {
            existe = firstItem.toLowerCase() === 'true';
          } else if (firstItem && typeof firstItem === 'object') {
            // Verifica qualquer campo que possa indicar existência de forma flexível
            const keys = Object.keys(firstItem);
            const isExistKey = keys.find(k => k.toLowerCase() === 'isimageexist' || k.toLowerCase() === 'existe' || k.toLowerCase() === 'exists');
            
            if (isExistKey) {
              const val = firstItem[isExistKey];
              existe = val === true || val === 'true' || String(val).toLowerCase() === 'true';
            } else {
              // Fallback para outros campos comuns
              existe = firstItem.result === true || firstItem.success === true || false;
            }
          }
        } else if (data && typeof data === 'object') {
          // Verifica também se retornar apenas um objeto em vez de array
          const keys = Object.keys(data);
          const isExistKey = keys.find(k => k.toLowerCase() === 'isimageexist' || k.toLowerCase() === 'existe' || k.toLowerCase() === 'exists');
          
          if (isExistKey) {
            const val = data[isExistKey];
            existe = val === true || val === 'true' || String(val).toLowerCase() === 'true';
          } else {
            existe = data.result === true || data.success === true || false;
          }
        }
      } catch (parseError) {
        // Se não for JSON válido, tenta interpretar o texto
        existe = trimmedResponse.includes('true') || trimmedResponse.includes('sim') || trimmedResponse.includes('yes');
      }
    }
    
    showImagemExisteResultado(existe);
    
  } catch (error) {
    let mensagemErro = 'Erro ao verificar imagem';
    
    if (error.name === 'AbortError') {
      mensagemErro = 'Tempo limite excedido';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      mensagemErro = 'Erro de conexão';
    }
    
    showImagemExisteResultado(mensagemErro, true);
  } finally {
    setImagemExisteLoading(false);
  }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initImagemExiste);

