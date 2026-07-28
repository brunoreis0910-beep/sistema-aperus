# Integração com a API do Mercado Pago (Boletos PF)

Esta documentação foi estruturada para guiar o desenvolvimento do fluxo de **criação de boleto** e do **retorno automático de pagamento (Webhook)** utilizando a API do Mercado Pago para conta Pessoa Física.

---

## 🛠️ Pré-requisitos & Credenciais

Antes de iniciar a integração, você precisa das suas credenciais de autenticação:

1. Acesse o **Mercado Pago Desenvolvedores** com a sua conta PF.
2. Crie uma nova "Aplicação" (ex: `MeuAplicativoCobrança`).
3. No menu da aplicação, vá em **Credenciais**. Você precisará de duas chaves:
   - **Public Key (Chave Pública):** Usada geralmente no front-end.
   - **Access Token (Token de Acesso):** Sua chave secreta de produção ou testes (começa com `APP_USR-...`). **Nunca a exponha no front-end.**

---

## 🚀 1. Geração de Boleto (Requisição API)

Para gerar o boleto, seu back-end deve fazer uma requisição HTTP do tipo `POST`. O Mercado Pago exige os dados completos do pagador (comprador) para registrar o boleto corretamente junto ao Banco Central.

- **Endpoint:** `https://api.mercadopago.com/v1/payments`
- **Método:** `POST`
- **Headers:**
  ```http
  Authorization: Bearer SEU_ACCESS_TOKEN_AQUI
  Content-Type: application/json
  ```

### Corpo da Requisição (Payload JSON)
No campo `payment_method_id`, usamos o valor `"bolbradesco"` para indicar a emissão de boleto bancário.

```json
{
  "transaction_amount": 150.00,
  "description": "Mensalidade do Serviço / Produto Exemplo",
  "payment_method_id": "bolbradesco",
  "payer": {
    "email": "cliente_exemplo@email.com",
    "first_name": "Nome do",
    "last_name": "Cliente",
    "identification": {
      "type": "CPF",
      "number": "12345678901"
    },
    "address": {
      "zip_code": "38740000",
      "street_name": "Av. Rui Barbosa",
      "street_number": "123",
      "neighborhood": "Centro",
      "city": "Patrocínio",
      "federal_unit": "MG"
    }
  }
}
```

### Resposta da API (Campos Essenciais)

Se a requisição for bem-sucedida (`201 Created`), a API retornará um JSON contendo as informações para exibição ou impressão. Os dados essenciais estão concentrados em `transaction_details` e `vouchers`:

```json
{
  "id": 9876543210,
  "status": "pending",
  "status_detail": "pending_waiting_payment",
  "transaction_details": {
    "digitable_line": "23790.50400 40963.225504 90000.633306 7 98760000015000",
    "verification_code": "9876543210",
    "barcode": {
      "content": "23797987600000150000504040963225509000063330"
    }
  },
  "vouchers": [
    {
      "display_info": {
        "pdf_url": "https://www.mercadopago.com.br/payments/9876543210/ticket"
      }
    }
  ]
}
```

> **O que mapear para a sua Interface:**
> - `id`: Armazene no seu banco de dados para conciliação futura.
> - `digitable_line`: Exiba na tela para o cliente copiar (Função "Copiar Código").
> - `vouchers[0].display_info.pdf_url`: Vincule a um botão "Imprimir/Visualizar Boleto" para abrir o PDF oficial do Mercado Pago.

---

## 🔄 2. Webhook (Baixa Automática no seu Sistema)

Para evitar que seu aplicativo precise ficar consultando a API de hora em hora para saber se o cliente pagou, configure um **Webhook (Notificação Web)** no painel do Mercado Pago apontando para uma URL do seu servidor (ex: `https://seuapp.com.br/api/webhooks/mercadopago`).

Quando o boleto é pago e compensado (o que leva de 1 a 2 dias úteis), o Mercado Pago faz um disparo `POST` para a sua URL enviando apenas o ID do evento.

### Payload recebido no seu Webhook:

```json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "9876543210"
  },
  "date_created": "2026-06-16T13:00:00Z",
  "id": 1122334455,
  "live_mode": true,
  "type": "payment"
}
```

### Fluxo de Tratamento no seu Código:

Ao receber essa requisição no seu endpoint de Webhook, seu sistema deve seguir estes passos:

```
[Recebe POST do Webhook]
        │
        ▼
[Responde imediatamente HTTP 200 ou 201] (Evita reenvios repetidos)
        │
        ▼
[Faz um GET na API do Mercado Pago usando o ID recebido]
`GET https://api.mercadopago.com/v1/payments/9876543210`
        │
        ▼
[Verifica se o status retornado é "approved"]
        │
  ┌─────┴─────┐
 SIM          NÃO
  │           │
  ▼           ▼
[Dá baixa no sistema e             [Ignora ou atualiza para
 libera o serviço/pedido]           outro status pendente]
```

---

## 🧪 3. Estratégia de Testes (Sandbox)

Antes de colocar em produção com dinheiro real, utilize as **Credenciais de Testes** (`TEST-...`).

- No ambiente de testes, a API aceita qualquer CPF simulado.
- Para testar o fluxo de pagamento e o funcionamento do seu Webhook sem gastar dinheiro, o Mercado Pago disponibiliza uma ferramenta de simulação dentro do painel do desenvolvedor, onde você cola o `ID` do pagamento pendente criado em Sandbox e força a alteração do status dele para "Aprovado".
