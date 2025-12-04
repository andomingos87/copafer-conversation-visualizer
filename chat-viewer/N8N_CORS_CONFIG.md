# 🔧 Configuração de CORS no n8n

## ❌ Problema

Ainda está aparecendo erro de CORS mesmo após configurar headers no n8n.

## ✅ Solução: Configurar CORS Corretamente no n8n

### Opção 1: Usar nó "Respond to Webhook" com Headers

1. **No seu workflow n8n**, encontre o nó que retorna a resposta
2. **Adicione um nó "Set"** antes do nó de resposta
3. **Configure os seguintes headers:**

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Accept, Content-Type
Access-Control-Max-Age: 86400
```

### Opção 2: Configurar no nó HTTP Response

Se estiver usando **"Respond to Webhook"** ou **"HTTP Request"**:

1. Abra as configurações do nó
2. Vá em **"Response"** ou **"Options"**
3. Adicione os headers acima

### Opção 3: Tratar Método OPTIONS (Preflight)

O navegador faz uma requisição **OPTIONS** antes do GET. Você precisa tratar isso:

**No n8n, adicione uma condição:**

```
IF método = OPTIONS
  → Retornar headers CORS com status 200
ELSE
  → Processar requisição normal
```

**Exemplo de resposta para OPTIONS:**

```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Access-Control-Max-Age": "86400"
  },
  "body": ""
}
```

### Opção 4: Usar Express.js no n8n (Se disponível)

Se você tem acesso ao código do n8n ou pode criar um webhook customizado:

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Accept, Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

---

## 🔍 Como Verificar se CORS Está Funcionando

### 1. Teste Manual no Navegador

Abra o console e execute:

```javascript
fetch('https://primary-production-ef755.up.railway.app/webhook-test/gethistories', {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('✅ Sucesso:', data))
.catch(err => console.error('❌ Erro:', err));
```

### 2. Verificar Headers na Resposta

1. Abra **DevTools** (F12)
2. Vá em **Network**
3. Faça uma requisição
4. Clique na requisição
5. Veja **Response Headers**
6. Procure por `Access-Control-Allow-Origin`

### 3. Testar com curl

```bash
curl -H "Origin: http://127.0.0.1:5500" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Accept" \
     -X OPTIONS \
     https://primary-production-ef755.up.railway.app/webhook-test/gethistories \
     -v
```

Procure por `Access-Control-Allow-Origin` na resposta.

---

## 🚨 Problemas Comuns

### 1. Headers Não Estão Sendo Enviados

**Sintoma:** Headers configurados mas não aparecem na resposta

**Solução:** 
- Verifique se o nó está realmente retornando a resposta
- Certifique-se de que os headers estão no formato correto
- Use "Set" antes do nó de resposta

### 2. Método OPTIONS Não Tratado

**Sintoma:** Erro de CORS mesmo com headers configurados

**Solução:**
- Adicione tratamento para método OPTIONS
- Retorne status 200 com headers CORS para OPTIONS

### 3. Headers com Valores Incorretos

**Sintoma:** CORS ainda bloqueia mesmo com headers

**Solução:**
- Use `*` para desenvolvimento (ou origem específica para produção)
- Certifique-se de que não há espaços extras
- Use exatamente: `Access-Control-Allow-Origin` (case-sensitive)

---

## 📝 Checklist de Configuração

- [ ] Headers CORS adicionados no nó de resposta
- [ ] Método OPTIONS tratado (preflight)
- [ ] Headers aparecem na resposta (verificar no Network)
- [ ] Teste manual no console funciona
- [ ] Não há erros no console do navegador

---

## 💡 Solução Temporária

Enquanto o CORS não está 100% configurado, o projeto está usando dados mockup automaticamente (`USE_MOCKUP_ON_ERROR: true`).

Quando o CORS estiver funcionando:
1. Altere `USE_MOCKUP_ON_ERROR: false` em `config.js`
2. Recarregue a página
3. Os dados reais serão carregados

---

## 🆘 Ainda Não Funciona?

Se após seguir todos os passos ainda não funcionar:

1. **Verifique se o n8n está realmente retornando os headers**
   - Use Network tab no DevTools
   - Veja os Response Headers

2. **Teste com Postman ou Insomnia**
   - Se funcionar lá, é problema de CORS
   - Se não funcionar, pode ser problema na API

3. **Use um proxy temporário**
   - Veja `CORS_SOLUCAO.md` para opções de proxy

4. **Contate o administrador do n8n**
   - Pode ser necessário configurar no nível do servidor

