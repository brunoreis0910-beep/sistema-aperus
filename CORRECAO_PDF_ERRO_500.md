# CORREÇÃO: Erro 500 ao Gerar PDF de Vendas

## Problema
Ao tentar gerar um PDF de vendas via endpoint `/api/relatorios/vendas/pdf/`, o sistema retornava um erro HTTP 500:

```
{
  "message": "Request failed with status code 500",
  "name": "AxiosError",
  "code": "ERR_BAD_RESPONSE",
  "status": 500
}
```

## Causa Raiz
O erro estava no arquivo `api/services_pdf_fiscal.py` na função `gerar_pdf_vendas_completo()`, linha 433:

```python
# ANTES (INCORRETO):
from reportlab.lib.pagesizes import Letter
pagesize = Letter
```

O problema era que o ReportLab não possui um import chamado `Letter` (com capital L). Os nomes corretos disponíveis são:
- `letter` (minúsculas)
- `LETTER` (maiúsculas)
- `GOV_LETTER`
- `HALF_LETTER`

## Solução
Alterar a importação para usar o nome correto:

```python
# DEPOIS (CORRETO):
from reportlab.lib.pagesizes import letter
pagesize = letter
```

## Arquivo Modificado
- **Arquivo**: [api/services_pdf_fiscal.py](api/services_pdf_fiscal.py#L433)
- **Linha**: 433
- **Mudança**: `Letter` → `letter`

## Teste de Validação
Após a correção, o endpoint `/api/relatorios/vendas/pdf/` passou a funcionar corretamente:

```
GET /api/relatorios/vendas/pdf/?data_inicio=2026-05-01&data_fim=2026-05-08&status=todos&device=mobile

Status: 200 OK
Content-Type: application/pdf
Tamanho: 2019 bytes
```

## Observação Importante
A função `gerar_pdf_vendas_completo()` suporta o parâmetro `device`:
- **mobile**: Usa página Letter com margens reduzidas
- **desktop**: Usa página A4 padrão

Este bug afetava especificamente requisições com `device=mobile`.
