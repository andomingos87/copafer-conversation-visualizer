# Documentação da API de Feedback

Esta documentação descreve os endpoints que o backend precisa implementar para suportar a funcionalidade de feedback.

## Base URL

```
https://primary-production-ef755.up.railway.app/webhook
```

## Endpoints

### 1. Buscar Feedback de uma Conversa

**GET** `/getfeedback?session_id={session_id}`

Retorna o feedback de uma conversa específica.

#### Parâmetros de Query

- `session_id` (string, obrigatório): ID da sessão/conversa

#### Resposta de Sucesso (200)

```json
{
  "session_id": "5511960620053",
  "rating": 5,
  "comment": "Excelente atendimento!",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Resposta quando não existe feedback (404)

```json
{
  "error": "Feedback não encontrado"
}
```

#### Campos do Feedback

- `session_id` (string): ID da sessão/conversa
- `rating` (integer, nullable): Avaliação em estrelas (1-5) ou null
- `comment` (text, nullable): Comentário do usuário ou null
- `created_at` (datetime): Data de criação do feedback
- `updated_at` (datetime): Data da última atualização

**Nota:** Pelo menos um dos campos (`rating` ou `comment`) deve estar preenchido.

---

### 2. Salvar/Atualizar Feedback

**POST** `/savefeedback`

Salva um novo feedback ou atualiza um existente para uma conversa.

#### Body (JSON)

```json
{
  "session_id": "5511960620053",
  "rating": 5,
  "comment": "Excelente atendimento!"
}
```

#### Campos do Body

- `session_id` (string, obrigatório): ID da sessão/conversa
- `rating` (integer, nullable): Avaliação em estrelas (1-5) ou null
- `comment` (string, nullable): Comentário do usuário ou null

**Validações:**
- `session_id` é obrigatório
- Pelo menos um dos campos (`rating` ou `comment`) deve estar preenchido
- Se `rating` for fornecido, deve ser entre 1 e 5

#### Resposta de Sucesso (200)

```json
{
  "session_id": "5511960620053",
  "rating": 5,
  "comment": "Excelente atendimento!",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Resposta de Erro (400)

```json
{
  "error": "É necessário preencher pelo menos a avaliação ou o comentário"
}
```

ou

```json
{
  "error": "Avaliação deve ser entre 1 e 5 estrelas"
}
```

---

## Estrutura do Banco de Dados

### PostgreSQL (Recomendado)

```sql
CREATE TABLE conversation_feedback (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (rating IS NOT NULL OR comment IS NOT NULL)
);

CREATE INDEX idx_session_id ON conversation_feedback(session_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_feedback_updated_at 
    BEFORE UPDATE ON conversation_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### SQLite (Alternativa)

```sql
CREATE TABLE conversation_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (rating IS NOT NULL OR comment IS NOT NULL)
);

CREATE INDEX idx_session_id ON conversation_feedback(session_id);
```

**Notas:**
- `session_id` é único (um feedback por conversa)
- Pelo menos um dos campos (`rating` ou `comment`) deve estar preenchido
- `rating` deve estar entre 1 e 5 se fornecido
- `updated_at` deve ser atualizado automaticamente quando o registro for modificado
- **PostgreSQL**: Use `SERIAL` ao invés de `AUTOINCREMENT` e `TIMESTAMP` ao invés de `DATETIME`

---

## Comportamento Esperado

1. **Primeira vez salvando feedback:** Cria um novo registro
2. **Atualizando feedback existente:** Atualiza o registro existente (baseado em `session_id`)
3. **Removendo campos:** Se o usuário remover rating ou comment, o campo deve ser atualizado para `null` no banco
4. **Validação:** O backend deve garantir que pelo menos um campo (`rating` ou `comment`) esteja preenchido

---

## CORS

Os endpoints devem permitir requisições CORS do frontend. Certifique-se de que os headers apropriados estão configurados:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
```

---

## Exemplo de Implementação

### Python/Flask com PostgreSQL

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuração do banco de dados PostgreSQL
DB_CONFIG = {
    'host': 'localhost',
    'database': 'seu_banco',
    'user': 'seu_usuario',
    'password': 'sua_senha'
}

def get_db():
    conn = psycopg2.connect(**DB_CONFIG)
    return conn

@app.route('/webhook/getfeedback', methods=['GET'])
def get_feedback():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({'error': 'session_id é obrigatório'}), 400
    
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        'SELECT * FROM conversation_feedback WHERE session_id = %s',
        (session_id,)
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not row:
        return jsonify({'error': 'Feedback não encontrado'}), 404
    
    # Converte datetime para string ISO
    result = dict(row)
    if result.get('created_at'):
        result['created_at'] = result['created_at'].isoformat() + 'Z'
    if result.get('updated_at'):
        result['updated_at'] = result['updated_at'].isoformat() + 'Z'
    
    return jsonify(result), 200

@app.route('/webhook/savefeedback', methods=['POST'])
def save_feedback():
    data = request.get_json()
    session_id = data.get('session_id')
    rating = data.get('rating')
    comment = data.get('comment')
    
    if not session_id:
        return jsonify({'error': 'session_id é obrigatório'}), 400
    
    if not rating and not comment:
        return jsonify({'error': 'É necessário preencher pelo menos a avaliação ou o comentário'}), 400
    
    if rating is not None and (rating < 1 or rating > 5):
        return jsonify({'error': 'Avaliação deve ser entre 1 e 5 estrelas'}), 400
    
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Verifica se já existe
    cursor.execute(
        'SELECT id FROM conversation_feedback WHERE session_id = %s',
        (session_id,)
    )
    existing = cursor.fetchone()
    
    if existing:
        # Atualiza (updated_at será atualizado automaticamente pelo trigger)
        cursor.execute(
            '''UPDATE conversation_feedback 
               SET rating = %s, comment = %s
               WHERE session_id = %s''',
            (rating, comment, session_id)
        )
    else:
        # Cria novo (created_at e updated_at serão definidos automaticamente)
        cursor.execute(
            '''INSERT INTO conversation_feedback (session_id, rating, comment)
               VALUES (%s, %s, %s)''',
            (session_id, rating, comment)
        )
    
    conn.commit()
    
    # Retorna o feedback atualizado
    cursor.execute(
        'SELECT * FROM conversation_feedback WHERE session_id = %s',
        (session_id,)
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    
    # Converte datetime para string ISO
    result = dict(row)
    if result.get('created_at'):
        result['created_at'] = result['created_at'].isoformat() + 'Z'
    if result.get('updated_at'):
        result['updated_at'] = result['updated_at'].isoformat() + 'Z'
    
    return jsonify(result), 200
```

### Python/Flask com SQLite (Alternativa)

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

def get_db():
    conn = sqlite3.connect('feedback.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/webhook/getfeedback', methods=['GET'])
def get_feedback():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({'error': 'session_id é obrigatório'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM conversation_feedback WHERE session_id = ?',
        (session_id,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return jsonify({'error': 'Feedback não encontrado'}), 404
    
    return jsonify(dict(row)), 200

@app.route('/webhook/savefeedback', methods=['POST'])
def save_feedback():
    data = request.get_json()
    session_id = data.get('session_id')
    rating = data.get('rating')
    comment = data.get('comment')
    
    if not session_id:
        return jsonify({'error': 'session_id é obrigatório'}), 400
    
    if not rating and not comment:
        return jsonify({'error': 'É necessário preencher pelo menos a avaliação ou o comentário'}), 400
    
    if rating is not None and (rating < 1 or rating > 5):
        return jsonify({'error': 'Avaliação deve ser entre 1 e 5 estrelas'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Verifica se já existe
    cursor.execute(
        'SELECT id FROM conversation_feedback WHERE session_id = ?',
        (session_id,)
    )
    existing = cursor.fetchone()
    
    now = datetime.utcnow().isoformat() + 'Z'
    
    if existing:
        # Atualiza
        cursor.execute(
            '''UPDATE conversation_feedback 
               SET rating = ?, comment = ?, updated_at = ?
               WHERE session_id = ?''',
            (rating, comment, now, session_id)
        )
    else:
        # Cria novo
        cursor.execute(
            '''INSERT INTO conversation_feedback (session_id, rating, comment, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?)''',
            (session_id, rating, comment, now, now)
        )
    
    conn.commit()
    conn.close()
    
    # Retorna o feedback atualizado
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM conversation_feedback WHERE session_id = ?',
        (session_id,)
    )
    row = cursor.fetchone()
    conn.close()
    
    return jsonify(dict(row)), 200
```

---

## Testes

### Teste 1: Criar feedback com rating e comment
```bash
curl -X POST https://primary-production-ef755.up.railway.app/webhook/savefeedback \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "5511960620053",
    "rating": 5,
    "comment": "Excelente!"
  }'
```

### Teste 2: Buscar feedback
```bash
curl https://primary-production-ef755.up.railway.app/webhook/getfeedback?session_id=5511960620053
```

### Teste 3: Atualizar apenas rating
```bash
curl -X POST https://primary-production-ef755.up.railway.app/webhook/savefeedback \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "5511960620053",
    "rating": 4,
    "comment": null
  }'
```

### Teste 4: Atualizar apenas comment
```bash
curl -X POST https://primary-production-ef755.up.railway.app/webhook/savefeedback \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "5511960620053",
    "rating": null,
    "comment": "Novo comentário"
  }'
```

