# Copafer - Visualizador de Conversas WhatsApp

Interface web para visualização e avaliação de conversas entre o agente de IA da Copafer e clientes via WhatsApp.

## 📋 Funcionalidades

- **Lista de conversas**: Visualiza todas as conversas agrupadas por cliente (número do WhatsApp)
- **Visualização em chat**: Exibe mensagens em formato de bolhas estilo WhatsApp
- **Filtro por cliente**: Dropdown para filtrar conversas de um cliente específico
- **Busca por texto**: Busca mensagens que contêm produtos ou termos específicos
- **Highlight**: Destaca termos buscados nas mensagens
- **Formatação markdown**: Renderiza texto em negrito (*texto*)

## 🚀 Como usar

### Opção 1: Abrir diretamente no navegador

1. Navegue até a pasta `chat-viewer`
2. Abra o arquivo `index.html` no navegador (duplo clique ou arrastar para o navegador)

### Opção 2: Usar um servidor local

```bash
# Com Python 3
cd chat-viewer
python -m http.server 8080

# Com Node.js (npx)
cd chat-viewer
npx serve

# Com VS Code
# Instale a extensão "Live Server" e clique em "Go Live"
```

Acesse: `http://localhost:8080`

## 📁 Estrutura do projeto

```
chat-viewer/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos visuais
├── js/
│   ├── app.js          # Lógica principal da aplicação
│   ├── data.js         # Dados mockup (conversas)
│   └── utils.js        # Funções utilitárias
└── README.md           # Esta documentação
```

## 📊 Estrutura dos dados

Cada mensagem segue o formato:

```javascript
{
  "id": 5401,                    // ID único da mensagem
  "session_id": "5511960620053", // Número do WhatsApp do cliente
  "message": {
    "type": "human",             // "human" = cliente, "ai" = agente
    "content": "Texto da mensagem",
    "tool_calls": [],            // Ferramentas usadas pelo agente
    "additional_kwargs": {},
    "response_metadata": {},
    "invalid_tool_calls": []
  }
}
```

## 🔌 Conectando com API real

Para substituir os dados mockup por dados reais da API:

### 1. Modifique o arquivo `js/data.js`

Substitua o conteúdo por:

```javascript
// Dados serão carregados da API
let mockData = [];
```

### 2. Modifique a função `loadData()` em `js/app.js`

```javascript
async function loadData() {
  try {
    // Substitua pela URL da sua API
    const response = await fetch('https://sua-api.com/api/conversations');
    const data = await response.json();
    
    // Se a API retorna array plano (como o mockup)
    mockData = data;
    
    // Se a API retorna já agrupado
    // state.conversations = data.conversations;
    
    state.conversations = groupBySession(mockData);
    state.filteredConversations = { ...state.conversations };
    
    populateClientFilter();
    renderConversationList();
  } catch (error) {
    console.error('Erro ao carregar conversas:', error);
    // Trate o erro conforme necessário
  }
}
```

### 3. Ajuste o CORS se necessário

Se a API estiver em outro domínio, certifique-se de que o CORS está configurado corretamente no backend.

## 🎨 Personalização

### Cores

As cores podem ser alteradas no arquivo `css/style.css` nas variáveis CSS:

```css
:root {
  --color-primary: #E65100;      /* Cor principal (laranja Copafer) */
  --bg-dark: #0a0a0f;            /* Fundo escuro */
  --bubble-human: #1a1a2e;       /* Bolha do cliente */
  --bubble-ai: #1e3a2f;          /* Bolha da IA */
  /* ... outras variáveis */
}
```

### Tema claro

Para um tema claro, inverta as cores de fundo e texto nas variáveis CSS.

## 🛠️ Tecnologias

- **HTML5**: Estrutura semântica
- **CSS3**: Flexbox, variáveis CSS, animações
- **JavaScript ES6+**: Vanilla JS, sem dependências
- **Fonte**: DM Sans (Google Fonts)

## 📝 Notas

- Os dados mockup simulam 3 conversas diferentes com cenários variados
- As mensagens são ordenadas pelo campo `id` (assumindo ordem cronológica)
- O campo de data/timestamp não está presente no formato atual

## 🐛 Problemas conhecidos

- Sem suporte a timestamps (ordenação por ID)
- Não salva estado entre sessões
- Não persiste avaliações

## 📄 Licença

Projeto interno Copafer - Todos os direitos reservados.

