# 🔧 Solução para Problema de CORS

## ❌ Problema Identificado

A API está bloqueando requisições do navegador devido à política CORS (Cross-Origin Resource Sharing).

**Erro no console:**
```
Access to fetch at 'https://...' from origin 'http://127.0.0.1:5500' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

---

## ✅ Soluções

### Opção 1: Configurar CORS no Backend (RECOMENDADO)

O backend precisa retornar os headers CORS corretos. No n8n ou no servidor da API, adicione:

**Headers de resposta necessários:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Accept, Content-Type
```

**Ou para permitir apenas origens específicas:**
```
Access-Control-Allow-Origin: http://127.0.0.1:5500
Access-Control-Allow-Origin: http://localhost:8080
```

**No n8n:**
- Adicione um nó "Set" antes de retornar a resposta
- Configure os headers acima

---

### Opção 2: Usar Proxy CORS (Desenvolvimento)

Para desenvolvimento local, você pode usar um proxy CORS público:

**Opção A: Usar cors-anywhere (temporário)**
```javascript
// Em config.js, altere BASE_URL para:
BASE_URL: 'https://cors-anywhere.herokuapp.com/https://primary-production-ef755.up.railway.app/webhook-test/gethistories'
```

⚠️ **Nota:** Serviços públicos de proxy podem ser instáveis. Use apenas para desenvolvimento.

**Opção B: Criar proxy local com Node.js**

Crie um arquivo `proxy.js`:
```javascript
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

app.get('/api/conversations', async (req, res) => {
  try {
    const response = await fetch('https://primary-production-ef755.up.railway.app/webhook-test/gethistories');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Proxy rodando em http://localhost:3000'));
```

Depois altere `config.js`:
```javascript
BASE_URL: 'http://localhost:3000/api/conversations'
```

---

### Opção 3: Desabilitar CORS no Navegador (APENAS DESENVOLVIMENTO)

⚠️ **ATENÇÃO:** Use apenas para desenvolvimento! Não é seguro para produção.

**Chrome:**
```bash
chrome.exe --user-data-dir="C:/Chrome dev session" --disable-web-security --disable-features=VizDisplayCompositor
```

**Ou use extensão:** "CORS Unblock" ou "Allow CORS"

---

### Opção 4: Usar Dados Mockup Temporariamente

O projeto já está configurado para usar dados mockup quando há erro de CORS:

1. Abra `js/config.js`
2. Certifique-se que `USE_MOCKUP_ON_ERROR: true`
3. Recarregue a página

Os dados de exemplo serão carregados automaticamente.

---

## 🔍 Como Verificar se CORS Está Configurado

1. Abra o DevTools (F12)
2. Vá na aba **Network**
3. Faça uma requisição à API
4. Clique na requisição
5. Verifique os **Response Headers**
6. Procure por `Access-Control-Allow-Origin`

Se não aparecer, o CORS não está configurado.

---

## 📝 Status Atual

- ✅ Código detecta erro de CORS automaticamente
- ✅ Mensagem de erro específica para CORS
- ✅ Fallback para dados mockup quando CORS falha
- ⚠️ Backend precisa configurar headers CORS

---

## 🚀 Próximos Passos

1. **Configure CORS no backend** (solução definitiva)
2. **Ou use proxy** para desenvolvimento
3. **Ou use dados mockup** temporariamente até CORS ser configurado

---

## 💡 Recomendação

Para produção, **configure CORS no backend**. É a solução mais segura e correta.

Para desenvolvimento rápido, use os dados mockup (já configurado) até o backend estar pronto.

