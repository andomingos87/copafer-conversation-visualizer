# Documentação Técnica - Integração com API

## 📡 Endpoint da API

**URL:** `https://primary-production-ef755.up.railway.app/webhook-test/gethistories`  
**Método:** `GET`  
**Content-Type:** `application/json`

---

## 📋 Formato de Dados Esperado

A API deve retornar um **array JSON** com objetos no seguinte formato:

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
  },
  {
    "id": 5402,
    "session_id": "5511960620053",
    "message": {
      "type": "ai",
      "content": "Bom dia! Como posso ajudar?",
      "tool_calls": [],
      "additional_kwargs": {},
      "response_metadata": {},
      "invalid_tool_calls": []
    },
    "created_at": "2025-12-04T13:45:31.000Z"
  }
]
```

### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | integer | ID único da mensagem |
| `session_id` | string | Número do WhatsApp do cliente |
| `message` | object | Objeto com dados da mensagem |
| `message.type` | string | `"human"` ou `"ai"` |
| `message.content` | string | Texto da mensagem |
| `created_at` | string | Data/hora em formato ISO 8601 (opcional, mas recomendado) |

### Campos Opcionais

- `message.tool_calls` - Array de ferramentas usadas pelo agente
- `message.additional_kwargs` - Metadados adicionais
- `message.response_metadata` - Metadados de resposta
- `message.invalid_tool_calls` - Chamadas de ferramentas inválidas

---

## 🔄 Fluxo de Carregamento

```
1. Página carrega
   ↓
2. showLoading() - Exibe spinner
   ↓
3. fetch(API_URL) - Requisição HTTP
   ↓
4. Processa resposta JSON
   ↓
5. Valida formato (deve ser array)
   ↓
6. groupBySession() - Agrupa por session_id
   ↓
7. Ordena por created_at (ou id como fallback)
   ↓
8. Renderiza lista de conversas
   ↓
9. hideLoading() - Esconde spinner
```

---

## ⚠️ Tratamento de Erros

### Cenários de Erro Tratados

1. **Erro de Rede**
   - Timeout (30 segundos)
   - Falha de conexão
   - CORS bloqueado

2. **Erro HTTP**
   - Status 4xx (404, 403, etc)
   - Status 5xx (500, 503, etc)

3. **Erro de Formato**
   - Resposta não é JSON válido
   - Resposta não é um array
   - Campos obrigatórios ausentes

### Comportamento em Caso de Erro

1. **Se `USE_MOCKUP_ON_ERROR = true`**:
   - Usa dados mockup automaticamente
   - Log de aviso no console
   - Interface funciona normalmente

2. **Se `USE_MOCKUP_ON_ERROR = false`**:
   - Exibe tela de erro
   - Botão "Tentar novamente"
   - Botão "Usar dados de exemplo" (fallback manual)

---

## 🛠️ Configuração

### Arquivo: `js/config.js`

```javascript
const API_CONFIG = {
  BASE_URL: 'https://primary-production-ef755.up.railway.app/webhook-test/gethistories',
  TIMEOUT: 30000, // 30 segundos
  USE_MOCKUP_ON_ERROR: true
};
```

### Personalização

**Alterar URL da API:**
```javascript
BASE_URL: 'https://sua-api.com/endpoint'
```

**Ajustar timeout:**
```javascript
TIMEOUT: 60000 // 60 segundos
```

**Desabilitar fallback automático:**
```javascript
USE_MOCKUP_ON_ERROR: false
```

---

## 📊 Processamento de Dados

### Agrupamento por Session ID

A função `groupBySession()` agrupa mensagens por `session_id`:

```javascript
{
  "5511960620053": [
    { id: 5401, session_id: "5511960620053", message: {...} },
    { id: 5402, session_id: "5511960620053", message: {...} }
  ],
  "5511941239405": [
    { id: 5501, session_id: "5511941239405", message: {...} }
  ]
}
```

### Ordenação

As mensagens são ordenadas por:
1. **Prioridade**: `created_at` (se disponível)
2. **Fallback**: `id` (se `created_at` não estiver disponível)

Ordem: **Crescente** (mais antigas primeiro)

---

## 🔍 Validação de Dados

### Validações Realizadas

1. ✅ Resposta é um array
2. ✅ Cada item tem `id` e `session_id`
3. ✅ Cada item tem `message` com `type` e `content`
4. ✅ `created_at` é válido (se presente)

### Dados Invalidos Ignorados

- Itens sem `session_id` são ignorados
- Itens sem `message.content` são exibidos vazios
- `created_at` inválido usa `id` como fallback

---

## 🧪 Testes

### Testar com API Real

1. Abra o console do navegador (F12)
2. Verifique logs de requisição
3. Confirme que dados são carregados
4. Teste filtros e busca

### Testar Cenários de Erro

**Simular timeout:**
```javascript
// Em config.js, reduzir timeout
TIMEOUT: 100 // 100ms para forçar timeout
```

**Simular erro de rede:**
- Desconecte internet
- Recarregue a página

**Simular erro HTTP:**
- Altere URL da API para endpoint inválido
- Verifique mensagem de erro

---

## 📝 Logs e Debug

### Console Logs

- ✅ Sucesso: `"Conversas carregadas: X conversas"`
- ⚠️ Aviso: `"Usando dados mockup devido ao erro na API"`
- ❌ Erro: `"Erro ao carregar conversas: [detalhes]"`

### Informações Úteis

- Total de conversas carregadas
- Total de mensagens processadas
- Tempo de carregamento (via Network tab)

---

## 🔐 Segurança

### CORS

Se a API estiver em domínio diferente, o backend deve retornar headers CORS:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Content-Type
```

### Validação de Dados

- Todos os dados são validados antes de renderização
- HTML é escapado para prevenir XSS
- Apenas campos esperados são processados

---

## 🚀 Performance

### Otimizações Implementadas

1. **Debounce na busca**: 300ms de delay
2. **Timeout configurável**: Evita requisições infinitas
3. **Renderização eficiente**: Apenas elementos visíveis são renderizados
4. **Cache de dados**: Dados ficam em memória durante sessão

### Recomendações

- Se houver muitas mensagens (>1000), considere paginação
- Use `created_at` para ordenação (mais eficiente que `id`)
- Implemente cache no backend se possível

---

## 📞 Suporte

### Problemas Comuns

**API não responde:**
- Verifique URL em `config.js`
- Verifique conexão de internet
- Verifique logs do console

**Dados não aparecem:**
- Verifique formato da resposta da API
- Confirme que é um array JSON válido
- Verifique campos obrigatórios

**Erro de CORS:**
- Configure CORS no backend
- Ou use proxy no frontend

---

## 📄 Changelog

### v2.0.0 - Integração com API
- ✅ Integração com API real
- ✅ Tratamento de erros completo
- ✅ Loading e error states
- ✅ Ordenação por `created_at`
- ✅ Fallback para dados mockup

### v1.0.0 - MVP Inicial
- ✅ Visualização de conversas
- ✅ Filtros e busca
- ✅ Dados mockup

