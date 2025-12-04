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
│   ├── config.js       # Configuração da API ⭐ NOVO
│   ├── app.js          # Lógica principal da aplicação
│   ├── data.js         # Dados mockup (fallback)
│   └── utils.js        # Funções utilitárias
├── README.md           # Esta documentação
└── INTEGRACAO_API.md   # Documentação técnica da API ⭐ NOVO
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
  },
  "created_at": "2025-12-04T13:45:30.000Z" // Data/hora de criação ⭐ NOVO
}
```

## 🔌 Integração com API

O projeto já está configurado para consumir dados da API real!

### Configuração

A URL da API está configurada em `js/config.js`:

```javascript
const API_CONFIG = {
  BASE_URL: 'https://primary-production-ef755.up.railway.app/webhook-test/gethistories',
  TIMEOUT: 30000,
  USE_MOCKUP_ON_ERROR: true
};
```

### Como funciona

1. **Ao carregar a página**: O app tenta buscar dados da API
2. **Se a API responder**: Os dados são exibidos normalmente
3. **Se a API falhar**: 
   - Se `USE_MOCKUP_ON_ERROR` for `true`, usa dados mockup como fallback
   - Caso contrário, exibe mensagem de erro com opção de tentar novamente

### Estados da aplicação

- **Loading**: Spinner exibido durante carregamento
- **Sucesso**: Lista de conversas é renderizada
- **Erro**: Mensagem de erro com botões "Tentar novamente" e "Usar dados de exemplo"

### Troubleshooting

**Erro de CORS**: Se a API estiver em outro domínio, certifique-se de que o CORS está configurado no backend.

**Timeout**: O timeout padrão é de 30 segundos. Ajuste em `config.js` se necessário.

**Dados não aparecem**: Verifique o console do navegador (F12) para ver erros detalhados.

Para mais detalhes técnicos, consulte [INTEGRACAO_API.md](INTEGRACAO_API.md).

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
- As mensagens são ordenadas pelo campo `created_at` (ordem cronológica)
- Se `created_at` não estiver disponível, usa `id` como fallback
- O projeto suporta fallback automático para dados mockup em caso de erro na API

## 🐛 Problemas conhecidos

- Não salva estado entre sessões
- Não persiste avaliações

## 📄 Licença

Projeto interno Copafer - Todos os direitos reservados.

