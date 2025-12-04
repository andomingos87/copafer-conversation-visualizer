# Plano de Adaptação - Integração com API

## 📊 Estado Atual do Projeto

### ✅ O que já temos funcionando:

#### 1. **Frontend Completo**
- **Estrutura HTML** (`chat-viewer/index.html`)
  - Layout com sidebar + área de chat
  - Campo de busca
  - Dropdown de filtro por cliente
  - Área de renderização de mensagens

- **Estilos CSS** (`chat-viewer/css/style.css`)
  - Tema escuro moderno
  - Bolhas de chat estilo WhatsApp
  - Layout responsivo (flexbox)
  - Animações e transições

- **Lógica JavaScript** (`chat-viewer/js/app.js`)
  - Sistema de estado da aplicação
  - Agrupamento de mensagens por `session_id`
  - Renderização de lista de conversas
  - Renderização de mensagens em bolhas
  - Sistema de filtros (cliente + busca)
  - Highlight de termos buscados

- **Funções Utilitárias** (`chat-viewer/js/utils.js`)
  - `parseMarkdown()` - Converte `*texto*` para `<strong>`
  - `highlightText()` - Destaca termos de busca
  - `formatPhoneNumber()` - Formata números brasileiros
  - `groupBySession()` - Agrupa mensagens por session_id
  - `getConversationPreview()` - Preview da última mensagem
  - `filterConversationsBySearch()` - Filtra por termo
  - `debounce()` - Otimiza eventos de input

- **Dados Mockup** (`chat-viewer/js/data.js`)
  - 3 conversas de exemplo
  - Formato compatível com estrutura do banco
  - Total de ~36 mensagens

#### 2. **Estrutura do Banco de Dados**

**Tabela:** `n8n_chat_histories`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | integer | ID único (auto-increment) |
| `session_id` | varchar | Número do WhatsApp do cliente |
| `message` | jsonb | Objeto JSON com dados da mensagem |
| `created_at` | timestamp | Data/hora de criação (DEFAULT CURRENT_TIMESTAMP) |

**Formato do campo `message` (JSONB):**
```json
{
  "type": "human" | "ai",
  "content": "Texto da mensagem",
  "tool_calls": [],
  "additional_kwargs": {},
  "response_metadata": {},
  "invalid_tool_calls": []
}
```

#### 3. **Formato de Dados Esperado**

O frontend espera receber um **array de objetos** no formato:

```javascript
[
  {
    id: 5401,
    session_id: "5511960620053",
    message: {
      type: "human",
      content: "BOM DIA",
      // ... outros campos opcionais
    }
  },
  {
    id: 5402,
    session_id: "5511960620053",
    message: {
      type: "ai",
      content: "Bom dia! Como posso ajudar?",
      // ...
    }
  }
]
```

---

## 🔧 O que precisa ser feito

### 1. **Criar Endpoint da API**

#### Endpoint: `GET /api/conversations`

**Resposta esperada:**
```json
[
  {
    "id": 5401,
    "session_id": "5511960620053",
    "message": {
      "type": "human",
      "content": "BOM DIA",
      "additional_kwargs": {},
      "response_metadata": {}
    },
    "created_at": "2025-12-04T13:45:30.000Z"
  }
]
```

**Query SQL sugerida:**
```sql
SELECT id, session_id, message, created_at
FROM n8n_chat_histories
ORDER BY created_at ASC;
```

**Considerações:**
- Retornar array plano (não agrupado)
- Incluir campo `created_at` (novo)
- Ordenar por `created_at` ASC (mais antigas primeiro)
- Formato JSON padrão

### 2. **Adaptar Frontend para Consumir API**

#### Arquivo: `chat-viewer/js/app.js`

**Mudanças necessárias:**

1. **Substituir `loadData()` para fazer fetch da API**
   ```javascript
   async function loadData() {
     try {
       const response = await fetch('https://primary-production-ef755.up.railway.app/webhook-test/gethistories');
       const data = await response.json();
       
       // Processa os dados
       state.conversations = groupBySession(data);
       state.filteredConversations = { ...state.conversations };
       
       populateClientFilter();
       renderConversationList();
     } catch (error) {
       console.error('Erro ao carregar conversas:', error);
       // Mostrar mensagem de erro ao usuário
     }
   }
   ```

2. **Atualizar ordenação para usar `created_at`**
   - Modificar `groupBySession()` em `utils.js` para ordenar por `created_at` ao invés de `id`
   - Ou criar nova função `groupBySessionWithDate()`

3. **Adicionar tratamento de erros**
   - Loading state (mostrar spinner enquanto carrega)
   - Error state (mostrar mensagem se API falhar)
   - Empty state (já existe, mas pode melhorar)

4. **Adicionar configuração de URL da API**
   - Criar arquivo `js/config.js` com URL da API
   - Ou usar variável de ambiente/config

#### Arquivo: `chat-viewer/js/utils.js`

**Mudanças necessárias:**

1. **Atualizar `groupBySession()` para ordenar por `created_at`**
   ```javascript
   function groupBySession(messages) {
     const grouped = {};
     
     messages.forEach(msg => {
       const sessionId = msg.session_id;
       if (!grouped[sessionId]) {
         grouped[sessionId] = [];
       }
       grouped[sessionId].push(msg);
     });
     
     // Ordena por created_at ao invés de id
     Object.keys(grouped).forEach(sessionId => {
       grouped[sessionId].sort((a, b) => {
         const dateA = new Date(a.created_at || 0);
         const dateB = new Date(b.created_at || 0);
         return dateA - dateB;
       });
     });
     
     return grouped;
   }
   ```

2. **Adicionar função para formatar data (opcional)**
   ```javascript
   function formatDate(dateString) {
     // Formatar created_at para exibição
   }
   ```

#### Arquivo: `chat-viewer/js/data.js`

**Mudanças necessárias:**

- **Opção 1:** Manter como fallback (se API falhar, usa mockup)
- **Opção 2:** Remover completamente e usar apenas API
- **Recomendação:** Manter como fallback para desenvolvimento

#### Arquivo: `chat-viewer/index.html`

**Mudanças necessárias:**

- Adicionar elemento para loading state
- Adicionar elemento para error state
- (Opcional) Adicionar botão "Recarregar" se API falhar

---

## 📋 Checklist de Implementação

### Backend (API)
- [ ] Criar endpoint `GET /api/conversations`
- [ ] Query SQL retornando todos os campos necessários
- [ ] Retornar formato JSON compatível
- [ ] Tratar erros e retornar status codes apropriados
- [ ] (Opcional) Adicionar CORS headers se necessário
- [ ] (Opcional) Adicionar paginação se houver muitos registros

### Frontend
- [ ] Criar arquivo `js/config.js` com URL da API
- [ ] Modificar `loadData()` para usar `fetch()`
- [ ] Adicionar tratamento de erros
- [ ] Adicionar loading state
- [ ] Atualizar `groupBySession()` para ordenar por `created_at`
- [ ] Testar com dados reais da API
- [ ] Manter `data.js` como fallback (opcional)

### Testes
- [ ] Testar com API retornando dados
- [ ] Testar com API retornando array vazio
- [ ] Testar com API retornando erro
- [ ] Testar filtros com dados reais
- [ ] Testar busca com dados reais

---

## 🎯 Estrutura de Arquivos Final

```
chat-viewer/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js          ⭐ NOVO - Configuração da API
│   ├── app.js             🔧 MODIFICAR - Adicionar fetch
│   ├── utils.js           🔧 MODIFICAR - Ordenar por created_at
│   └── data.js            ⚠️ OPCIONAL - Manter como fallback
└── README.md
```

---

## 🔍 Pontos de Atenção

1. **CORS**: Se API estiver em domínio diferente, configurar CORS no backend
2. **Performance**: Se houver muitas mensagens, considerar paginação
3. **Ordenação**: Usar `created_at` ao invés de `id` para ordem cronológica correta
4. **Timezone**: `created_at` vem do banco, garantir formato ISO para JavaScript
5. **Fallback**: Manter dados mockup para desenvolvimento offline

---

## 📝 Próximos Passos

1. **Definir URL da API** (ex: `http://localhost:3000/api/conversations`)
2. **Criar endpoint no backend** (n8n ou outro)
3. **Adaptar frontend** conforme checklist acima
4. **Testar integração** com dados reais
5. **Ajustar conforme necessário**

---

## 💡 Observações

- O formato de dados do banco é **compatível** com o mockup atual
- A coluna `created_at` foi adicionada e será preenchida automaticamente
- O frontend já está preparado para receber dados nesse formato
- A principal mudança é substituir `mockData` por `fetch()` da API
- Filtros e busca funcionam no frontend, não precisam de backend

