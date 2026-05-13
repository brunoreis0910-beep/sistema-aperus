# 🧪 Teste Rápido - Módulo de Descontos Inteligentes

## ⚡ Pré-requisitos

1. Backend Django rodando: `python manage.py runserver 0.0.0.0:8005`
2. Token de autenticação (obter em `/api/token-auth/`)
3. Cliente existente no banco de dados (id_cliente)
4. Produto existente no banco de dados (id_produto)

## 📝 Script de Teste (Python)

```python
import requests
import json

# Configuração
BASE_URL = "http://localhost:8005/api"
TOKEN = "seu_token_aqui"  # Obter do login

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# ============================================
# TESTE 1: Simular Desconto de Cliente
# ============================================
print("\n📊 TESTE 1: Simular Desconto")
print("=" * 50)

response = requests.post(
    f"{BASE_URL}/descontos/simular/",
    headers=headers,
    json={
        "id_cliente": 1,
        "id_produto": 1,
        "valor_tabela": 100.00
    }
)

print(f"Status: {response.status_code}")
print(f"Resposta:\n{json.dumps(response.json(), indent=2, ensure_ascii=False)}")

if response.json().get('success'):
    preco_final = response.json().get('preco')
    desconto = response.json().get('desconto_aplicado')
    print(f"\n✅ Preço final: R$ {preco_final}")
    print(f"💰 Desconto: R$ {desconto}")
    print(f"🔒 Travado: {response.json().get('travado')}")
else:
    print("❌ Erro na simulação")


# ============================================
# TESTE 2: Validar Desconto Proposto
# ============================================
print("\n\n✅ TESTE 2: Validar Desconto Proposto")
print("=" * 50)

response = requests.post(
    f"{BASE_URL}/descontos/validar/",
    headers=headers,
    json={
        "id_cliente": 1,
        "id_produto": 1,
        "desconto_proposto": 15.00
    }
)

print(f"Status: {response.status_code}")
print(f"Resposta:\n{json.dumps(response.json(), indent=2, ensure_ascii=False)}")

if response.json().get('permitido'):
    print("✅ Desconto PERMITIDO")
    if response.json().get('requer_aprovacao'):
        print("⚠️ Requer aprovação de supervisor")
else:
    print("❌ Desconto NÃO PERMITIDO")


# ============================================
# TESTE 3: Obter Config do Cliente
# ============================================
print("\n\n📋 TESTE 3: Obter Configuração de Desconto do Cliente")
print("=" * 50)

response = requests.get(
    f"{BASE_URL}/descontos/cliente/1/",
    headers=headers
)

print(f"Status: {response.status_code}")
print(f"Resposta:\n{json.dumps(response.json(), indent=2, ensure_ascii=False)}")

if response.json().get('success'):
    config = response.json()
    if config.get('tem_desconto'):
        print(f"\n✅ Cliente tem desconto de {config.get('valor')}{config.get('tipo', 'N/A')}")
        print(f"📌 Descrição: {config.get('descricao')}")
    else:
        print("❌ Cliente sem desconto configurado")


# ============================================
# TESTE 4: Listar Clientes com Desconto
# ============================================
print("\n\n👥 TESTE 4: Listar Clientes com Desconto")
print("=" * 50)

response = requests.get(
    f"{BASE_URL}/descontos/clientes-com-desconto/?ativo=true&tipo_desconto=PERCENTUAL",
    headers=headers
)

print(f"Status: {response.status_code}")
data = response.json()
print(f"Total de clientes com desconto: {data.get('total')}")

for cliente in data.get('clientes', []):
    print(f"\n  • {cliente['nome']} - {cliente['valor_desconto']} {cliente['tipo_desconto']}")
    if cliente.get('grupos_excecao_count', 0) > 0:
        print(f"    └─ {cliente['grupos_excecao_count']} grupos em exceção")

```

## 🧵 Script de Teste (JavaScript/Fetch)

```javascript
const BASE_URL = "http://localhost:8005/api";
const TOKEN = localStorage.getItem('token'); // Obter do login

const headers = {
    "Authorization": `Bearer ${TOKEN}`,
    "Content-Type": "application/json"
};

// ============================================
// TESTE 1: Simular Desconto
// ============================================
async function testeSimularDesconto() {
    console.log("📊 TESTE 1: Simular Desconto");
    
    try {
        const response = await fetch(`${BASE_URL}/descontos/simular/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                id_cliente: 1,
                id_produto: 1,
                valor_tabela: 100.00
            })
        });
        
        const data = await response.json();
        console.log("✅ Resposta:", data);
        
        if (data.success) {
            console.log(`💰 Preço final: R$ ${data.preco}`);
            console.log(`🔒 Travado: ${data.travado}`);
        }
    } catch (err) {
        console.error("❌ Erro:", err);
    }
}

// ============================================
// TESTE 2: Validar Desconto
// ============================================
async function testeValidarDesconto() {
    console.log("\n✅ TESTE 2: Validar Desconto Proposto");
    
    try {
        const response = await fetch(`${BASE_URL}/descontos/validar/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                id_cliente: 1,
                id_produto: 1,
                desconto_proposto: 15.00
            })
        });
        
        const data = await response.json();
        console.log("✅ Resposta:", data);
        console.log(`Permitido: ${data.permitido ? '✅ SIM' : '❌ NÃO'}`);
        if (data.requer_aprovacao) {
            console.log("⚠️ Requer aprovação!");
        }
    } catch (err) {
        console.error("❌ Erro:", err);
    }
}

// ============================================
// TESTE 3: Obter Config do Cliente
// ============================================
async function testeObterConfigCliente() {
    console.log("\n📋 TESTE 3: Obter Config do Cliente");
    
    try {
        const response = await fetch(`${BASE_URL}/descontos/cliente/1/`, {
            headers
        });
        
        const data = await response.json();
        console.log("✅ Resposta:", data);
        console.log(`Descrição: ${data.descricao}`);
    } catch (err) {
        console.error("❌ Erro:", err);
    }
}

// Executar testes
console.clear();
console.log("🚀 Iniciando testes...\n");
testeSimularDesconto();
testeValidarDesconto();
testeObterConfigCliente();
```

## 📮 Request Collection (Postman/Insomnia)

### Teste 1: Simular Desconto
```
POST http://localhost:8005/api/descontos/simular/

Headers:
- Authorization: Bearer {seu_token}
- Content-Type: application/json

Body (JSON):
{
  "id_cliente": 1,
  "id_produto": 1,
  "valor_tabela": 100.00
}

Respostas esperadas:
- Status 200: Simulação realizada com sucesso
- Status 404: Cliente ou Produto não encontrado
- Status 500: Erro interno
```

### Teste 2: Validar Desconto
```
POST http://localhost:8005/api/descontos/validar/

Headers:
- Authorization: Bearer {seu_token}
- Content-Type: application/json

Body (JSON):
{
  "id_cliente": 1,
  "id_produto": 1,
  "desconto_proposto": 15.00
}
```

### Teste 3: Obter Config do Cliente
```
GET http://localhost:8005/api/descontos/cliente/1/

Headers:
- Authorization: Bearer {seu_token}
```

### Teste 4: Listar Clientes com Desconto
```
GET http://localhost:8005/api/descontos/clientes-com-desconto/?ativo=true&tipo_desconto=PERCENTUAL

Headers:
- Authorization: Bearer {seu_token}

Query Params (opcionais):
- ativo: true/false
- tipo_desconto: FIXO/PERCENTUAL
- com_excecao: true/false
```

## 🔧 Como Obter Token

### Via cURL
```bash
curl -X POST http://localhost:8005/api/token-auth/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "seu_usuario",
    "password": "sua_senha"
  }'
```

### Via Python Requests
```python
import requests

response = requests.post(
    "http://localhost:8005/api/token-auth/",
    json={
        "username": "seu_usuario",
        "password": "sua_senha"
    }
)

token = response.json().get('token')
print(f"Token: {token}")
```

### Via JavaScript Fetch
```javascript
async function obterToken() {
    const response = await fetch('http://localhost:8005/api/token-auth/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'seu_usuario',
            password: 'sua_senha'
        })
    });
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    console.log('✅ Token salvo em localStorage');
}
```

## ✅ Exemplos de Resposta

### Cenário 1: Cliente com Desconto Percentual
```json
{
  "success": true,
  "preco": 90.00,
  "desconto_aplicado": 10.00,
  "desconto_percentual": 10.0,
  "travado": true,
  "motivo": "Desconto de Cliente: PERCENTUAL - 10",
  "mensagem_tooltip": "Desconto de 10% aplicado automaticamente para este cliente - Campo travado",
  "cliente_nome": "Empresa XYZ",
  "produto_nome": "Produto ABC"
}
```

### Cenário 2: Produto em Grupo de Exceção
```json
{
  "success": true,
  "preco": 100.00,
  "desconto_aplicado": 0.00,
  "desconto_percentual": 0.0,
  "travado": false,
  "motivo": "Produto em grupo de exceção: Ferramentas",
  "grupo_excecao": "Ferramentas",
  "cliente_nome": "Empresa XYZ",
  "produto_nome": "Ferramenta Premium"
}
```

### Cenário 3: Sem Desconto Configurado
```json
{
  "success": true,
  "preco": 100.00,
  "desconto_aplicado": 0.00,
  "desconto_percentual": 0.0,
  "travado": false,
  "motivo": "Nenhuma regra aplicada - Preço de Tabela",
  "cliente_nome": "Novo Cliente",
  "produto_nome": "Produto ABC"
}
```

## 🐛 Troubleshooting

### "Token inválido ou expirado"
- Gerar novo token
- Verificar se o Authorization header está correto

### "Cliente não encontrado"
- Verificar ID do cliente existe no banco
- Query: `SELECT * FROM clientes WHERE id_cliente = 1;`

### "Erro 500"
- Verificar logs do Django: `tail -f /var/log/django.log`
- Verificar console do servidor: `python manage.py runserver --debug`

### Response vazia
- Garantir que `Accept: application/json` está no header
- Verificar firewall/proxy

## 📊 Dados para Teste

### Inserir Cliente com Desconto (SQL)
```sql
UPDATE clientes 
SET 
  tipo_desconto = 'PERCENTUAL',
  valor_desconto = 10.00,
  percentual_arredondamento = 0.50,
  priorizar_desconto_cliente = true
WHERE id_cliente = 1;
```

### Listar Clientes com Desconto
```sql
SELECT 
  id_cliente, 
  nome_razao_social, 
  tipo_desconto, 
  valor_desconto,
  priorizar_desconto_cliente
FROM clientes 
WHERE valor_desconto > 0;
```

---

**Dúvidas?** Consultar logs ou solicitar ajuda ao suporte.
