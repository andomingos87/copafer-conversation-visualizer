# Proposta de Implementação - Dashboard de Métricas

## 📊 Visão Geral

Este documento apresenta sugestões para implementar uma sessão de dashboard na aplicação Copafer para exibir métricas importantes sobre as conversas.

## 🎯 Métricas Propostas

### 1. Métricas Principais (Cards no Topo)

#### 1.1 Total de Conversas
- **Descrição**: Número total de conversas únicas
- **Cálculo**: `Object.keys(conversations).length`
- **Ícone**: 💬
- **Variação**: Comparação com período anterior (se houver filtro de data)

#### 1.2 Total de Mensagens
- **Descrição**: Soma de todas as mensagens em todas as conversas
- **Cálculo**: `Object.values(conversations).reduce((sum, msgs) => sum + msgs.length, 0)`
- **Ícone**: 📨
- **Variação**: Comparação com período anterior

#### 1.3 Média de Mensagens por Conversa
- **Descrição**: Média aritmética de mensagens por conversa
- **Cálculo**: `totalMessages / totalConversations`
- **Ícone**: 📊
- **Formato**: Número com 1 casa decimal

#### 1.4 Taxa de Resposta da IA
- **Descrição**: Percentual de mensagens enviadas pela IA vs mensagens do cliente
- **Cálculo**: `(mensagensAI / totalMensagens) * 100`
- **Ícone**: 🤖
- **Formato**: Percentual com 1 casa decimal

#### 1.5 Taxa de Feedback
- **Descrição**: Percentual de conversas que possuem feedback
- **Cálculo**: `(conversasComFeedback / totalConversas) * 100`
- **Ícone**: ⭐
- **Formato**: Percentual com 1 casa decimal

#### 1.6 Média de Avaliação
- **Descrição**: Média das avaliações (rating) dos feedbacks
- **Cálculo**: `somaRatings / quantidadeFeedbacksComRating`
- **Ícone**: ⭐⭐⭐⭐⭐
- **Formato**: Número com 1 casa decimal (1-5)
- **Observação**: Só calcula se houver feedbacks com rating

### 2. Gráficos e Visualizações

#### 2.1 Distribuição de Conversas por Período
- **Tipo**: Gráfico de linha ou barras
- **Eixo X**: Dias/Semanas/Meses
- **Eixo Y**: Número de conversas
- **Dados**: Agrupa conversas por data da última mensagem
- **Biblioteca sugerida**: Chart.js ou ApexCharts

#### 2.2 Distribuição de Mensagens por Tipo
- **Tipo**: Gráfico de pizza ou donut
- **Dados**: 
  - Mensagens Human (cliente)
  - Mensagens AI (Copafer IA)
- **Biblioteca sugerida**: Chart.js

#### 2.3 Distribuição de Avaliações
- **Tipo**: Gráfico de barras horizontais
- **Eixo X**: Quantidade
- **Eixo Y**: Rating (1-5 estrelas)
- **Dados**: Conta quantos feedbacks têm cada rating
- **Observação**: Só mostra se houver feedbacks

#### 2.4 Horários de Pico
- **Tipo**: Gráfico de barras
- **Eixo X**: Horas do dia (0-23)
- **Eixo Y**: Número de mensagens
- **Dados**: Agrupa mensagens por hora do dia (usando `created_at`)
- **Observação**: Só funciona se as mensagens tiverem `created_at`

### 3. Tabelas e Listas

#### 3.1 Conversas Mais Ativas
- **Descrição**: Top 10 conversas com mais mensagens
- **Colunas**: 
  - Telefone (formatado)
  - Número de mensagens
  - Última mensagem (data/hora)
  - Feedback (se houver)
- **Ação**: Clicável para abrir a conversa

#### 3.2 Conversas Recentes
- **Descrição**: Últimas 10 conversas (por data da última mensagem)
- **Colunas**: 
  - Telefone (formatado)
  - Preview da última mensagem
  - Data/hora da última mensagem
  - Feedback (se houver)
- **Ação**: Clicável para abrir a conversa

## 🏗️ Estrutura de Implementação

### Opção 1: Aba/Segmento no Header (Recomendado)
- Adicionar um botão "Dashboard" no header ao lado do botão "Exportar"
- Ao clicar, alterna entre visualização de conversas e dashboard
- Mantém os filtros aplicados (ou permite filtrar o dashboard)

### Opção 2: Modal/Overlay
- Botão no header abre um modal com o dashboard
- Dashboard ocupa tela cheia ou grande parte da tela
- Pode ser fechado e volta para visualização normal

### Opção 3: Página Separada
- Dashboard em rota separada (`/dashboard.html` ou similar)
- Navegação via menu no header
- Pode compartilhar estado com a aplicação principal

**Recomendação**: Opção 1 (Aba/Segmento) - mais integrado e fácil de navegar

## 📁 Estrutura de Arquivos

```
conversation_history/
├── index.html (modificar para adicionar botão Dashboard)
├── css/
│   ├── style.css (adicionar estilos do dashboard)
│   └── dashboard.css (novo arquivo, opcional)
├── js/
│   ├── app.js (adicionar lógica de navegação)
│   ├── dashboard.js (novo arquivo - lógica do dashboard)
│   └── dashboard-metrics.js (novo arquivo - cálculos de métricas)
└── DASHBOARD_PROPOSAL.md (este arquivo)
```

## 🔧 Implementação Técnica

### 1. Estado da Aplicação
Adicionar ao `state` em `app.js`:
```javascript
const state = {
  // ... existente
  currentView: 'conversations', // 'conversations' ou 'dashboard'
  dashboardPeriod: 'all', // 'all', 'today', 'last7days', etc.
};
```

### 2. Funções de Cálculo de Métricas
Criar `js/dashboard-metrics.js` com funções para:
- Calcular total de conversas
- Calcular total de mensagens
- Calcular média de mensagens por conversa
- Calcular taxa de resposta da IA
- Calcular taxa de feedback
- Calcular média de avaliação
- Agrupar conversas por período
- Agrupar mensagens por tipo
- Agrupar mensagens por horário
- Obter top conversas mais ativas

### 3. Componente de Dashboard
Criar `js/dashboard.js` com:
- Função para renderizar o dashboard completo
- Função para renderizar cards de métricas
- Função para renderizar gráficos
- Função para renderizar tabelas
- Integração com biblioteca de gráficos (Chart.js recomendado)

### 4. Bibliotecas Necessárias
- **Chart.js** (ou ApexCharts): Para gráficos
  - CDN: `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`
- Opcional: **date-fns** para manipulação de datas (já temos funções próprias)

## 🎨 Design e UX

### Cards de Métricas
- Layout em grid responsivo (3 colunas desktop, 2 tablet, 1 mobile)
- Cards com:
  - Ícone grande
  - Valor principal grande e destacado
  - Label descritivo
  - Variação percentual (se aplicável)
  - Cor baseada no tipo de métrica

### Gráficos
- Altura mínima de 300px
- Responsivos
- Cores consistentes com o tema da aplicação
- Tooltips informativos

### Tabelas
- Estilo consistente com a lista de conversas
- Hover effect
- Clicável para abrir conversa
- Paginação se necessário

## 📱 Responsividade

- **Desktop**: Grid de 3 colunas para cards, gráficos lado a lado
- **Tablet**: Grid de 2 colunas para cards, gráficos empilhados
- **Mobile**: Grid de 1 coluna, gráficos empilhados, tabelas scrolláveis

## 🔄 Filtros e Interatividade

### Filtros do Dashboard
- **Período**: Mesmos filtros de data da visualização de conversas
- **Aplicar filtros**: Dashboard recalcula métricas baseado nos filtros
- **Sincronização**: Filtros aplicados na visualização de conversas podem ser mantidos no dashboard

### Interatividade
- Cards clicáveis podem filtrar dados
- Gráficos interativos (zoom, hover, etc.)
- Tabelas com ordenação e busca
- Botão "Atualizar" para recarregar dados

## 🚀 Fases de Implementação

### Fase 1: Estrutura Básica
1. Adicionar botão Dashboard no header
2. Criar estrutura HTML do dashboard
3. Implementar navegação entre views
4. Criar layout básico com cards

### Fase 2: Métricas Principais
1. Implementar cálculos de métricas básicas
2. Renderizar cards com valores
3. Adicionar formatação e ícones

### Fase 3: Gráficos
1. Integrar Chart.js
2. Implementar gráfico de distribuição por período
3. Implementar gráfico de mensagens por tipo
4. Implementar gráfico de avaliações

### Fase 4: Tabelas e Detalhes
1. Implementar tabela de conversas mais ativas
2. Implementar tabela de conversas recentes
3. Adicionar interatividade (clicar para abrir conversa)

### Fase 5: Polimento
1. Adicionar animações e transições
2. Melhorar responsividade
3. Adicionar loading states
4. Adicionar tratamento de erros

## 📊 Exemplo de Cálculo de Métricas

```javascript
// Exemplo de função para calcular métricas
function calculateMetrics(conversations, feedbacks = {}) {
  const sessionIds = Object.keys(conversations);
  const totalConversations = sessionIds.length;
  
  let totalMessages = 0;
  let totalHumanMessages = 0;
  let totalAIMessages = 0;
  let conversationsWithFeedback = 0;
  let totalRating = 0;
  let ratingsCount = 0;
  
  sessionIds.forEach(sessionId => {
    const messages = conversations[sessionId];
    totalMessages += messages.length;
    
    messages.forEach(msg => {
      if (msg.message.type === 'human') {
        totalHumanMessages++;
      } else {
        totalAIMessages++;
      }
    });
    
    // Verifica feedback
    const feedback = feedbacks[sessionId];
    if (feedback && (feedback.rating || feedback.comment)) {
      conversationsWithFeedback++;
      if (feedback.rating) {
        totalRating += feedback.rating;
        ratingsCount++;
      }
    }
  });
  
  return {
    totalConversations,
    totalMessages,
    averageMessagesPerConversation: totalConversations > 0 
      ? (totalMessages / totalConversations).toFixed(1) 
      : 0,
    aiResponseRate: totalMessages > 0 
      ? ((totalAIMessages / totalMessages) * 100).toFixed(1) 
      : 0,
    feedbackRate: totalConversations > 0 
      ? ((conversationsWithFeedback / totalConversations) * 100).toFixed(1) 
      : 0,
    averageRating: ratingsCount > 0 
      ? (totalRating / ratingsCount).toFixed(1) 
      : null
  };
}
```

## 🎯 Próximos Passos

1. **Revisar proposta** e validar métricas importantes
2. **Escolher opção de implementação** (Aba, Modal ou Página separada)
3. **Definir biblioteca de gráficos** (Chart.js recomendado)
4. **Implementar Fase 1** (estrutura básica)
5. **Iterar** sobre as fases seguintes

## 💡 Considerações Adicionais

- **Performance**: Para muitos dados, considerar paginação ou lazy loading
- **Cache**: Pode cachear cálculos de métricas para melhorar performance
- **Exportação**: Adicionar opção de exportar dashboard como PDF ou imagem
- **Atualização em tempo real**: Se houver WebSocket, atualizar dashboard automaticamente
- **Comparação temporal**: Mostrar variação percentual entre períodos

