-- Adicionar coluna de data/hora na tabela n8n_chat_histories
-- Esta coluna armazenará quando a mensagem foi criada

ALTER TABLE n8n_chat_histories
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Se preferir com timezone (recomendado):
-- ALTER TABLE n8n_chat_histories
-- ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Para criar um índice para melhorar performance em consultas por data:
CREATE INDEX idx_n8n_chat_histories_created_at ON n8n_chat_histories(created_at);

-- Para criar índice composto (session_id + created_at) para consultas agrupadas:
CREATE INDEX idx_n8n_chat_histories_session_created ON n8n_chat_histories(session_id, created_at);

