-- ========================================
-- CRIAÇÃO DA TABELA DE FEEDBACK (PostgreSQL)
-- ========================================

-- Cria a tabela
CREATE TABLE conversation_feedback (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (rating IS NOT NULL OR comment IS NOT NULL)
);

-- Cria índice para melhor performance
CREATE INDEX idx_session_id ON conversation_feedback(session_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger que executa a função antes de cada UPDATE
CREATE TRIGGER update_conversation_feedback_updated_at 
    BEFORE UPDATE ON conversation_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verifica se a tabela foi criada corretamente
SELECT * FROM conversation_feedback LIMIT 0;

