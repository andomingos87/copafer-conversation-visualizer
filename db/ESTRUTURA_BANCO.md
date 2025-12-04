# Estrutura do Banco de Dados - Copafer Chat Viewer

## Tabelas Encontradas

1. `carrinho`
2. `error_logs`
3. `leads`
4. `n8n_chat_histories` ⭐ (tabela principal para conversas)
5. `n8n_vectors`

## Estrutura da Tabela `n8n_chat_histories`

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | integer | NO | auto-increment | ID único da mensagem |
| `session_id` | varchar | NO | - | Número do WhatsApp do cliente |
| `message` | jsonb | NO | - | Objeto JSON com os dados da mensagem |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP | Data e hora de criação da mensagem ⭐ NOVO |

## Formato Esperado do Campo `message` (JSONB)

Baseado no arquivo `history_example.json`, o formato deve ser:

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

## Status Atual

- **Total de registros**: 0 (tabela vazia no momento)
- **Estrutura**: Confirmada e compatível com o formato do mockup
- **Coluna created_at**: A ser adicionada

## Migração: Adicionar Coluna de Timestamp

Execute o arquivo `4_adicionar_coluna_timestamp.sql` para adicionar a coluna `created_at`.

## Queries Úteis

### Buscar todas as conversas ordenadas por data
```sql
SELECT id, session_id, message, created_at
FROM n8n_chat_histories
ORDER BY created_at DESC;
```

### Agrupar por cliente com data da última mensagem
```sql
SELECT 
  session_id, 
  COUNT(*) as total_mensagens,
  MAX(created_at) as ultima_mensagem
FROM n8n_chat_histories
GROUP BY session_id
ORDER BY ultima_mensagem DESC;
```

### Buscar mensagens de um cliente específico ordenadas por data
```sql
SELECT id, session_id, message, created_at
FROM n8n_chat_histories
WHERE session_id = '5511960620053'
ORDER BY created_at ASC;
```

### Buscar mensagens que contêm um termo
```sql
SELECT id, session_id, message, created_at
FROM n8n_chat_histories
WHERE message->>'content' ILIKE '%porcelanato%'
ORDER BY created_at DESC;
```

### Filtrar conversas por período
```sql
SELECT session_id, COUNT(*) as total_mensagens
FROM n8n_chat_histories
WHERE created_at >= '2025-11-01' 
  AND created_at < '2025-12-01'
GROUP BY session_id;
```
