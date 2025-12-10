# Guia de Troubleshooting - API de Feedback

## Problemas Comuns e Soluções

### 1. Endpoint POST retorna 404 "webhook is not registered for POST requests"

**Problema:** O webhook no n8n não está configurado para aceitar requisições POST.

**Solução:**
1. No n8n, abra o workflow do endpoint `savefeedback`
2. No node **Webhook**, verifique se o método HTTP está configurado como **POST**
3. Certifique-se de que o path está correto: `/webhook/savefeedback`
4. Salve e ative o workflow

### 2. Endpoint retorna array vazio `[{"session_id":""}]`

**Problema:** O endpoint está retornando um array com objeto vazio quando não há feedback.

**Solução:** Isso é esperado quando não há feedback. O frontend já trata isso corretamente.

**Para testar se está funcionando:**
1. Tente salvar um feedback primeiro via POST
2. Depois busque via GET para verificar se retorna os dados

### 3. Erro de CORS

**Problema:** Requisições do frontend são bloqueadas por CORS.

**Solução no n8n:**
1. No node **Respond to Webhook**, adicione headers CORS:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type, Accept`

2. Ou adicione um node **Set** antes do **Respond to Webhook**:
   ```
   Headers:
   - Access-Control-Allow-Origin: *
   - Access-Control-Allow-Methods: GET, POST, OPTIONS
   - Access-Control-Allow-Headers: Content-Type, Accept
   ```

### 4. Erro ao salvar feedback - "É necessário preencher pelo menos..."

**Problema:** Validação no frontend está funcionando, mas o backend também precisa validar.

**Solução:** Certifique-se de que o workflow no n8n valida:
- `session_id` não pode estar vazio
- Pelo menos `rating` OU `comment` deve estar preenchido
- Se `rating` for fornecido, deve estar entre 1 e 5

### 5. Feedback não aparece após salvar

**Problema:** Feedback foi salvo mas não aparece na interface.

**Solução:**
1. Verifique no console do navegador (F12) se há erros
2. Verifique se o endpoint GET está retornando os dados corretamente
3. Recarregue a página para forçar atualização

### 6. Estrutura de resposta diferente do esperado

**Problema:** O backend retorna dados em formato diferente.

**Formato esperado pelo frontend:**

**GET `/getfeedback`:**
```json
{
  "session_id": "5511960620053",
  "rating": 5,
  "comment": "Excelente!",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**POST `/savefeedback`:**
```json
{
  "session_id": "5511960620053",
  "rating": 5,
  "comment": "Excelente!",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Nota:** Se o backend retornar arrays, o frontend já trata isso automaticamente.

### 7. Erro ao fazer INSERT teste no n8n - "Insert rows in a table"

**Problema:** Ao tentar inserir dados diretamente no n8n usando o node "Insert rows in a table", o insert não funciona.

**Problemas comuns e soluções:**

#### ❌ **Problema 1: Tentando inserir o campo `id` manualmente**

**Erro:** O campo `id` é `SERIAL PRIMARY KEY` (auto-incremento), não deve ser inserido manualmente.

**Solução:**
- **REMOVA** o campo `id` do mapeamento de colunas
- Ou deixe o campo `id` vazio/null (será gerado automaticamente)

#### ❌ **Problema 2: Formato incorreto de data/timestamp**

**Erro:** Campos `created_at` e `updated_at` têm `DEFAULT CURRENT_TIMESTAMP`, mas você está tentando inserir valores manuais.

**Solução:**
- **OPÇÃO 1 (Recomendada):** **REMOVA** os campos `created_at` e `updated_at` do mapeamento
  - Eles serão preenchidos automaticamente pelo banco de dados
- **OPÇÃO 2:** Se precisar inserir datas manualmente, use o formato correto:
  - Formato PostgreSQL: `2025-12-10 12:03:03` (sem o 'T')
  - Ou use expressão: `{{ $now }}` para data atual

#### ✅ **Configuração Correta para INSERT Teste:**

No node **"Insert rows in a table"**, mapeie apenas estes campos:

| Coluna | Valor | Tipo |
|--------|-------|------|
| **session_id** | `5511960620053` | Fixed |
| **rating** | `{{ 5 }}` | Expression |
| **comment** | `teste` | Fixed |

**Campos que NÃO devem ser mapeados:**
- ❌ `id` - Será gerado automaticamente (SERIAL)
- ❌ `created_at` - Será gerado automaticamente (DEFAULT CURRENT_TIMESTAMP)
- ❌ `updated_at` - Será gerado automaticamente (DEFAULT CURRENT_TIMESTAMP)

#### ✅ **Exemplo de INSERT SQL correto:**

Se quiser testar diretamente no PostgreSQL:

```sql
INSERT INTO conversation_feedback (session_id, rating, comment)
VALUES ('5511960620053', 5, 'teste');
```

**Nota:** Os campos `id`, `created_at` e `updated_at` serão preenchidos automaticamente.

#### ✅ **Exemplo de UPDATE SQL correto:**

Para atualizar o mesmo registro após o INSERT, você pode atualizar os campos em um único comando:

```sql
-- Atualizar rating e comment em um único UPDATE

```

**Nota:** O campo `updated_at` será atualizado automaticamente pelo trigger `update_conversation_feedback_updated_at`, então você não precisa incluí-lo no SET.

**Exemplos alternativos (caso precise atualizar apenas um campo):**

```sql
-- Atualizar apenas o rating
UPDATE conversation_feedback
SET rating = 3
WHERE session_id = '5511960620053';

-- Atualizar apenas o comment
UPDATE conversation_feedback
SET comment = 'Novo comentário'
WHERE session_id = '5511960620053';
```

#### ⚠️ **Validações importantes:**

1. **session_id** deve ser único (UNIQUE constraint)
   - Se já existir um registro com o mesmo `session_id`, o INSERT falhará
   - Use um `session_id` diferente para cada teste

2. **Pelo menos um campo obrigatório:**
   - Deve ter pelo menos `rating` OU `comment` preenchido
   - Se ambos forem NULL, o INSERT falhará

3. **Rating deve estar entre 1 e 5:**
   - Se fornecido, `rating` deve ser >= 1 e <= 5

## Testando os Endpoints

### Teste 1: Buscar feedback (quando não existe)
```bash
curl "https://primary-production-ef755.up.railway.app/webhook/getfeedback?session_id=5511960620053"
```
**Esperado:** Array vazio ou objeto com `session_id` vazio

### Teste 2: Salvar feedback
```bash
curl -X POST "https://primary-production-ef755.up.railway.app/webhook/savefeedback" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "5511960620053",
    "rating": 5,
    "comment": "Teste de feedback"
  }'
```
**Esperado:** Objeto com os dados salvos

### Teste 3: Buscar feedback (após salvar)
```bash
curl "https://primary-production-ef755.up.railway.app/webhook/getfeedback?session_id=5511960620053"
```
**Esperado:** Objeto com os dados salvos anteriormente

## Checklist de Configuração no n8n

### Endpoint GET `/getfeedback`
- [ ] Webhook configurado com método **GET**
- [ ] Path: `/webhook/getfeedback`
- [ ] Extrai `session_id` do query parameter
- [ ] Executa SELECT no PostgreSQL
- [ ] Retorna 404 se não encontrar
- [ ] Retorna 200 com JSON se encontrar
- [ ] Headers CORS configurados

### Endpoint POST `/savefeedback`
- [ ] Webhook configurado com método **POST**
- [ ] Path: `/webhook/savefeedback`
- [ ] Extrai body JSON (`session_id`, `rating`, `comment`)
- [ ] Valida dados (pelo menos um campo preenchido)
- [ ] Valida rating (1-5 se fornecido)
- [ ] Verifica se feedback existe (SELECT)
- [ ] Se existe: UPDATE
- [ ] Se não existe: INSERT
- [ ] Retorna feedback salvo
- [ ] Headers CORS configurados

## Verificando Logs

No n8n, você pode verificar os logs de execução:
1. Abra o workflow
2. Clique em "Executions" (Execuções)
3. Veja os logs de cada execução
4. Verifique se há erros nos nodes

## Contato e Suporte

Se os problemas persistirem:
1. Verifique os logs do n8n
2. Verifique o console do navegador (F12)
3. Teste os endpoints diretamente com curl
4. Verifique se a tabela `conversation_feedback` existe e tem dados

