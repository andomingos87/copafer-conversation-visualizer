# Plano de Desenvolvimento - MVP Visualizador de Conversas

## 📦 Escopo do MVP

**O que FAZ:**
- Exibe lista de conversas agrupadas por cliente (session_id)
- Visualiza conversa em formato de chat (bolhas)
- Filtra por número do cliente
- Busca por texto/produto nas mensagens

**O que NÃO FAZ:**
- Dashboard/métricas
- Salvar avaliações
- Exportar dados
- Responsivo mobile

---

## 🏗️ Arquitetura Simples

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   index.html    │ ←──→ │    app.js       │ ←──→ │   Sua API       │
│   style.css     │      │  (fetch dados)  │      │  (PostgreSQL)   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

**Arquivos:**
```
/copafer-chat-viewer
├── index.html      # Estrutura da página
├── style.css       # Estilos visuais
├── app.js          # Lógica e fetch da API
└── README.md       # Instruções
```

---

## 📐 Layout Proposto

```
┌────────────────────────────────────────────────────────────────────┐
│  🏪 Copafer - Visualizador de Conversas                            │
├────────────────────────────────────────────────────────────────────┤
│  [🔍 Buscar por produto/texto...        ] [Filtrar cliente ▼]      │
├──────────────────────┬─────────────────────────────────────────────┤
│                      │                                             │
│  📱 Conversas (30)   │   📞 5511960620053                          │
│  ──────────────────  │   ─────────────────────────────────────     │
│                      │                                             │
│  ● 5511960620053     │   👤 BOM DIA                                │
│    8 mensagens       │                                             │
│                      │              Bom dia! Sou da Copafer... 🤖  │
│  ○ 5511941239405     │                                             │
│    2 mensagens       │   👤 Joelho 90 Graus Soldável...            │
│                      │                                             │
│  ○ 5511987654321     │              *Joelho 90 Graus...*      🤖   │
│    15 mensagens      │              Preço: R$ 0,89                 │
│                      │                                             │
│                      │   👤 01 unidade                             │
│                      │                                             │
└──────────────────────┴─────────────────────────────────────────────┘
```

---

## 📋 Plano de Desenvolvimento (4 etapas)

### **Etapa 1: Estrutura HTML** (30 min)
- [ ] Layout base com sidebar + área de chat
- [ ] Campo de busca
- [ ] Dropdown de filtro por cliente
- [ ] Lista de conversas (sidebar)
- [ ] Área de exibição do chat

### **Etapa 2: Estilos CSS** (45 min)
- [ ] Layout flexbox (sidebar + main)
- [ ] Estilo de bolhas de chat (cliente vs IA)
- [ ] Lista de conversas com hover/seleção
- [ ] Renderização de markdown básico (*negrito*)
- [ ] Cores e tipografia agradáveis

### **Etapa 3: Lógica JavaScript** (1h)
- [ ] Função para buscar dados da API (ou mock JSON)
- [ ] Agrupar mensagens por `session_id`
- [ ] Renderizar lista de conversas na sidebar
- [ ] Ao clicar numa conversa, exibir mensagens
- [ ] Ordenar mensagens por `id` (já que não há timestamp)

### **Etapa 4: Filtros e Busca** (45 min)
- [ ] Filtro por cliente (dropdown)
- [ ] Busca por texto nas mensagens
- [ ] Highlight do termo buscado nas mensagens

---

## ⚠️ Questões Pendentes

### Sobre a Data
O JSON atual não tem campo de data/timestamp.

**Opções:**
1. A API vai adicionar esse campo?
2. Ignoramos filtro por data no MVP?
3. Usamos o `id` como proxy de ordem cronológica?

### Sobre a API
- Qual o endpoint da API?
- Ou começamos com mock local usando `history_example.json`?

---

## 🔌 Contrato da API (sugestão)

Para o front funcionar, a API precisaria retornar algo assim:

```javascript
// GET /api/conversations
{
  "conversations": [
    {
      "session_id": "5511960620053",
      "messages": [
        { "id": 5401, "type": "human", "content": "BOM DIA" },
        { "id": 5402, "type": "ai", "content": "Bom dia! Sou da Copafer..." },
        // ...
      ]
    },
    // ...
  ]
}
```

Ou podemos trabalhar com o formato atual (array plano) e agrupar no front-end.

---

## ⏱️ Estimativa Total

| Etapa | Tempo |
|-------|-------|
| HTML | 30 min |
| CSS | 45 min |
| JavaScript | 1h |
| Filtros/Busca | 45 min |
| **Total** | **~3 horas** |

---

## 📊 Estrutura de Dados (atual)

```json
{
  "id": 5431,
  "session_id": "5511960620053",
  "message": {
    "type": "human",        // "human" = cliente, "ai" = agente
    "content": "boa tarde",
    "tool_calls": [],
    "additional_kwargs": {},
    "response_metadata": {},
    "invalid_tool_calls": []
  }
}
```

---

## ✅ Checklist para Iniciar

- [ ] Definir se haverá campo de data
- [ ] Definir endpoint da API ou usar mock
- [ ] Aprovar layout proposto
- [ ] Iniciar desenvolvimento

