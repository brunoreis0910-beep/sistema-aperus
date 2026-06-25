# 📚 APERUS — Documentação Completa do Sistema

> **Sistema de Gestão Empresarial (ERP)** — Multi-tenant, multi-módulo
> Versão analisada em: **2026-06-17**
> Stack: Django 5.x (Python) + React/Vite (JSX) + MySQL + Capacitor (Android)

---

## 🏗️ Arquitetura Geral

```
C:\APERUS\
├── aperus_mae\          # Servidor Central (SaaS Master)
│   └── (mesmo código que SistemaAperus — porta 8006)
├── SistemaAperus\       # Instância Principal (porta padrão)
│   ├── projeto_gerencial\  # Configurações Django
│   ├── api\               # App principal (models, views, services)
│   ├── frontend\          # React + Vite (SPA)
│   ├── comandas\          # App Django — Módulo de Comandas
│   ├── cte\               # App Django — CT-e
│   ├── mdfe\              # App Django — MDF-e
│   ├── etiquetas\         # App Django — Impressão de Etiquetas
│   └── cadastro_clientes\ # App Django — Cadastro auxiliar
├── arquivos_clientes\   # Dados por tenant (ex: aperus_bruno\)
└── Banco de Dados\      # Backups e dumps SQL
```

### Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django 5.x + Django REST Framework |
| Autenticação | JWT (SimpleJWT) — tokens de 8h / refresh 7 dias |
| Banco de Dados | MySQL (produção) / SQLite (executável) |
| Frontend | React 18 + Vite + JSX |
| Mobile | Capacitor (Android APK nativo) |
| IA | Google Gemini API |
| WhatsApp | Evolution API / Playwright (Web Scraping) |
| PDF | WeasyPrint / ReportLab |
| Multi-tenancy | Custom `TenantMiddleware` + `TenantRouter` |
| Deploy | Windows Server + Cloudflare Tunnel |

---

## 🗄️ Multi-Tenancy

O sistema suporta múltiplos tenants (filiais) via:

- **`TenantMiddleware`** — identifica o banco do tenant via header HTTP ou token JWT
- **`TenantRouter`** — roteador de banco de dados Django; modelos "centrais" (SaaS) vão para o banco `aperus_central`, demais para o banco do tenant
- **Modelos Centrais** (banco compartilhado): `saascliente`, `saasclientemensalidade`, `saasclientecontrato`, `versaosistema`, `historicoatualizacao`, `configuracaoagendamento`, `templatecontrato`
- **`IS_CENTRAL`** — flag nas settings que identifica se a instância é o servidor mãe

---

## 📦 MÓDULOS DO BACKEND

### 1. 🛒 Vendas (`views_vendas.py` — 154 KB)

O módulo mais central do sistema. Gerencia todo o ciclo de venda.

**Funcionalidades:**
- Criar/editar/excluir vendas (pedidos, orçamentos, venda rápida)
- Emissão de **NF-e** (Nota Fiscal Eletrônica) via SEFAZ
- Emissão de **NFC-e** (Nota Fiscal Consumidor Eletrônico)
- Emissão de **NFS-e** (Nota de Serviço)
- **Carta de Correção** (CC-e) — emissão, download XML, impressão
- **Complemento ICMS** para NF-e
- Inutilização de numeração NF-e / NFC-e
- Cancelamento de NF-e / NFC-e
- Download de XML individual ou em lote
- Impressão de DANFE
- Controle de entregas por venda
- Salvar/listar vendas PDV NFC-e
- Atualização de impostos por item
- Próximo número de venda

**Endpoints principais:**
```
GET/POST   /api/vendas/
GET/PUT    /api/vendas/<id>/
POST       /api/vendas/<id>/emitir_nfe/
POST       /api/vendas/<id>/cancelar_nfe/
POST       /api/vendas/<id>/emitir_nfce/
POST       /api/vendas/<id>/cancelar_nfce/
GET        /api/vendas/<id>/download_xml/
GET        /api/vendas/<id>/imprimir_danfe/
POST       /api/vendas/<id>/carta_correcao/
POST       /api/vendas/download_lote_xml/
```

---

### 2. 💰 Financeiro (`views.py` + `FinancePage.jsx`)

**Funcionalidades:**
- Contas a pagar e receber (`FinanceiroConta`)
- Lançamentos e baixas manuais
- **Baixa automática** por vencimento (`services_baixa_automatica.py`)
- Operações financeiras (débito/crédito)
- Centro de custo e departamentos
- Contas bancárias
- **Conciliação Bancária** (importação OFX — `views_conciliacao.py`)
- **DRE** — Demonstrativo de Resultado do Exercício (`views_dre.py`)
- Gestão de cheques (`views_cheques.py`)
- Recebimentos por cartão (`views_cartoes.py`)
- Boletos bancários (`tasks_boleto.py`, `signals_boleto.py`)
- Movimentações bancárias (`views_movimentacao_bancaria.py`)

---

### 3. 🛍️ Compras (`views_compra.py` — 69 KB)

**Funcionalidades:**
- CRUD completo de compras (pedidos de compra)
- Importação de XML de NF-e de compras
- Atualização automática de estoque na entrada
- Geração de contas a pagar
- Comparação de preços
- Histórico de compras por fornecedor

---

### 4. 📦 Produtos (`views_produto.py` — 124 KB)

**Funcionalidades:**
- Cadastro completo de produtos
- Grupos de produto com hierarquia
- Controle de **variações** (tamanho, cor, etc.)
- Gestão de **lotes** (`LoteProdutoViewSet`)
- Controle de estoque por depósito
- Movimentações de estoque
- **Precificação** (custo, margem, preço de venda)
- Tabelas comerciais por cliente/grupo
- **Cadastro Turbo** (EAN + IA + preços regionais — `views_produto_turbo.py`)
- Classificação por IA (`classificar_produto_ia`)
- Pesquisa de preços por região (`pesquisar_precos_regiao`)
- Cadastro via importação de XML
- Invalidação de cache EAN
- Categorias mercadológicas

---

### 5. 🧾 Faturamento (`views_faturamento.py` — 62 KB)

**Funcionalidades:**
- Conversão de pedidos em notas fiscais
- Validação de estoque fiscal antes da emissão
- Ajuste de itens de faturamento
- Conversão de cupom NFC-e para NF-e
- Listagem de vendas com filtros avançados
- Operações fiscais por tipo de operação

---

### 6. 👤 Clientes (`views.py` — `ClienteViewSet`)

**Funcionalidades:**
- CRUD completo de clientes (PF e PJ)
- Consulta de CNPJ externo (Receita Federal)
- Verificação de limite de crédito
- Validação de clientes em atraso
- **Descontos inteligentes** por cliente/grupo (`views_descontos.py`)
- Grupos de exceção de desconto
- Dados cadastrais completos (endereço, IE, contatos)
- Integração com WhatsApp
- Aniversariantes (`views_aniversario.py`)
- **Fichas completas** por cliente

---

### 7. 💸 Descontos Inteligentes (`views_descontos.py`, `logic/descontos.py`)

**Funcionalidades:**
- Simulação de desconto por cliente/produto/grupo
- Validação de desconto proposto vs. política
- Aprovação de descontos via **WhatsApp** (supervisor aprova por link)
- Configuração de desconto por tipo (percentual, fixo)
- Grupos de exceção (produto/grupo com desconto diferenciado)
- **TTS** (Text-to-Speech) para alertas de aprovação (`signals_tts_aprovacao.py`)

---

### 8. 📄 Documentos Fiscais

#### 8a. NF-e (`services/nfe_service.py` — 799 linhas, `services/nfe_xml_builder.py` — 82 KB)

Implementação **100% nativa Python** (sem ACBr), comunicação SOAP direta à SEFAZ.

| Função | Descrição |
|--------|----------|
| `emitir_nfe(venda_obj)` | Orquestrador: valida PAA (NT 2026.001), BA02-35, série, e dispara emissão nativa |
| `cancelar_nfe(venda_obj, justificativa)` | Envia evento de cancelamento (tpEvento=110111) via SOAP assinado |
| `inutilizar_numeracao(...)` | Inutiliza faixa via NFeInutilizacao4 (cStat=102) |
| `enviar_carta_correcao(...)` | Emite CC-e (tpEvento=110110) com auto-recuperação de sequência (erro 594) |
| `_chamar_sefaz_soap(...)` | Envia envelope SOAP com certificado mTLS ao web service da SEFAZ |

> Smart retry: evita mudança de `dhEmi` em reenvios de XML já assinado. Suporte a séries PAA 970-979 para CPF.

#### 8b. NFC-e (`services/nfce_service.py` — 634 linhas)

| Função | Descrição |
|--------|----------|
| `emitir_nfce(venda_obj, empresa_obj)` | Valida valor máximo sem CPF, gera e emite NFC-e |
| `cancelar_nfce(...)` | Envia cancelamento (tpEvento=110111) |
| `inutilizar_numeracao(...)` | Inutiliza numeração modelo 65 via SOAP |

> Limite sem CPF configurável via `EmpresaConfig.valor_maximo_nfce`. Mapa UF→código IBGE para roteamento.

#### 8c. CT-e (`cte/` + `services/cte_service.py` — 821 linhas)

Suporte a GZIP+Base64 (formato MG). Fallback de assinatura em cascata (Java → PythonV2 → CTeSignerNative).

| Função | Descrição |
|--------|----------|
| `emitir_cte(cte_obj)` | Pipeline: gerar XML → assinar → comprimir GZIP+Base64 → enviar SOAP → protocolar |
| `_gerar_chave(cte)` | Chave de 44 dígitos com DV módulo 11 |
| `_gerar_xml_cte(cte)` | XML com emitente, remetente, destinatário, carga e modal rodoviário (lxml) |
| `_processar_retorno_soap(...)` | Parseia retorno SEFAZ e monta `<cteProc>` de distribuição |

> XMLs de debug salvos em `C:\XML_CTE\Debug`. Homologação substitui razão social (Rej. 646/649).

#### 8d. MDF-e (`mdfe/` + `services/mdfe_service.py` — 1.303 linhas)

Maior serviço fiscal do sistema. Autorizador: SVRS (RS) como nacional.

| Função | Descrição |
|--------|----------|
| `emitir_mdfe(mdfe)` | Gerar número/chave → gerar XML → assinar → SEFAZ → salvar protocolo e QR Code |
| `encerrar_mdfe(mdfe, dados)` | Evento de encerramento (tpEvento=110112) |
| `cancelar_mdfe(mdfe, justificativa)` | Evento de cancelamento (tpEvento=110111) |
| `gerar_damdfe(mdfe)` | PDF do DAMDFE com ReportLab, QR Code e dados do veículo |

#### 8e. SPED Fiscal (`services/sped_service.py` — 927 linhas)

Geração de EFD no formato texto com pipe `|`. Blocos: 0, B, C, D, E, G, H, K, 1 e 9.

| Função | Descrição |
|--------|----------|
| `generate()` | Gera arquivo SPED completo como string `\r\n` |
| `generate_block_c()` | Bloco C: NF-e saída (C100/C170/C190) |
| `generate_block_d()` | Bloco D: CT-e (D100/D190) |
| `generate_block_e()` | Bloco E: Apuração ICMS (E110, E116) |
| `generate_block_9()` | Encerramento com contagem de registros por tipo |

> Geração seletiva de blocos. Suporte a versões de layout 019 e 020.

#### 8f. Manifestação do Destinatário (`views_manifestacao.py`)
- Consulta de NF-es recebidas pela empresa (NSU)
- Manifestação: ciência, confirmação, desconhecimento, operação não realizada
- Consulta ao último NSU processado

---

### 9. 🏨 Hotel PMS (`views_hotel.py` — 52 KB, `models_hotel.py`)

**Funcionalidades:**
- Gestão de quartos por tipo
- Reservas com check-in/check-out
- Consumo de produtos/serviços pelo quarto
- Status de limpeza e manutenção
- Comodidades por quarto
- **Assistente IA** para comandos de voz ("Quarto 10 está limpo", "Reservar quarto para amanhã")
- Relatório hoteleiro

---

### 10. 🐾 PetShop / Clínica Veterinária

**Funcionalidades:**
- Cadastro de pets por cliente (`PetViewSet`)
- Agendamentos de serviços (`AgendamentoViewSet`)
- Sessões de agendamento (`SessaoAgendamentoViewSet`)
- Tipos de serviço (`TipoServicoViewSet`)
- Avaliações de atendimento (`AvaliacaoViewSet`)
- **Pacotes de serviços** (ex: banho + tosa)
- Prontuário veterinário (`ClinicaVeterinariaPage.jsx`)
- Histórico de atendimentos

---

### 11. 🍽️ Comandas (`comandas/` — App Django separado)

Sistema completo de **comandas para bares/restaurantes**.

**Models** (5 models — tabelas: `mesas`, `comandas`, `itens_comanda`, `transferencias_mesa`, `pagamentos_comanda`):

| Model | Campos-chave |
|-------|------|
| `Mesa` | numero, capacidade, localizacao, status (Livre/Ocupada/Reservada/Limpeza) |
| `Comanda` | FK mesa, FK cliente, FK garçom, FK vendedor, FK operacao_nfce, forma_pagamento, subtotal, desconto, taxa_servico, total |
| `ItemComanda` | FK comanda, FK produto, quantidade, valor_unitario, subtotal, status (Pendente/Preparando/Pronto/Entregue/Cancelado) |
| `TransferenciaMesa` | FK comanda, FK mesa_origem, FK mesa_destino, FK usuario, motivo |
| `PagamentoComanda` | FK comanda, forma_pagamento, valor |

**Endpoints:**
```
GET/POST   /api/comandas/mesas/
GET/POST   /api/comandas/comandas/
GET/POST   /api/comandas/itens-comanda/
GET/POST   /api/comandas/transferencias/
GET/POST   /api/comandas/backups/
POST       /api/comandas/backups/scheduler/now/
```

**Funcionalidades:**
- Abrir/fechar mesas com status visual
- Lançar itens por produto com status de preparação (cozinha)
- Transferência de mesas com histórico
- Unir mesas
- Pagamentos múltiplos por comanda (Dinheiro, Cartão, PIX, Vale Refeição, Cortesia, Fiado)
- Integração com NFC-e ao fechar comanda
- **Backup automático** integrado (`backup_scheduler.py`, `backup_utils.py`)

---

### 12. 📋 Ordem de Serviço (`views_ordem_servico.py` — 20 KB)

**Funcionalidades:**
- CRUD de OS com status customizável (`StatusOrdemServicoViewSet`)
- Itens de produto e serviço na OS
- Fotos da OS (`OsFotoViewSet`)
- Assinatura digital (`OsAssinaturaViewSet`)
- Técnicos responsáveis (`TecnicoViewSet`)
- **Dashboard BI** de OS (`views_bi_os.py`)
- Relatórios de desempenho de OS

---

### 13. 🤖 Inteligência Artificial (`views_ai_chat.py` — 28 KB, `services/ai_service.py` — 86 KB)

**Funcionalidades:**
- **Chat IA** conversacional com contexto empresarial
- **Transcrição de voz** (Speech-to-Text)
- **Análise de negócio** com dados reais do ERP
- **Análise de vendas** com sugestões de IA
- **TTS** — geração de áudio para alertas e aprovações
- **Assistente Hotel** (`ai_dispatcher.py`) — comanda via voz
- Geração de relatórios PDF via IA
- Classificação de produtos via IA
- Análise de churn de clientes
- Consultor de negócios (`ConsultorNegociosPage.jsx`)

---

### 14. 📱 WhatsApp (`whatsapp_views.py` — 24 KB, `whatsapp_playwright_service.py` — 35 KB)

**Funcionalidades:**
- Envio de mensagens via **Evolution API** (WhatsApp Business)
- Envio via **Playwright** (Web Scraping WhatsApp Web)
- Fila de mensagens com prioridade
- QR Code para conectar sessão
- Webhook para receber respostas
- **Aprovação de descontos** por WhatsApp (link curto)
- Catálogo de produtos via WhatsApp (`CatalogoPage.jsx`)
- Envio de DANFE/boletos por WhatsApp
- Mensagens de aniversariantes
- Notificações automáticas

---

### 15. 💳 Pagamentos

#### Pix (`models_pix.py`, `views_pix.py`, `services/pix_service.py`)
- Geração de QR Code Pix dinâmico
- Webhook de confirmação de pagamento
- Histórico de cobranças

#### Mercado Pago Point (`views_mp_point.py`, `models_mp_point.py`)
- Integração com terminais físicos Point (Tap to Pay)
- Cobrança, status, cancelamento
- Webhook de pagamento

#### Boletos (`tasks_boleto.py`, `signals_boleto.py`)
- Geração de boletos bancários
- Webhook Mercado Pago
- Remessa/retorno bancário

#### Cartões (`views_cartoes.py`, `serializers_cartoes.py`)
- Registro de recebimentos via cartão
- Conciliação de cartões

#### Split Payment (`views_split_payment.py`)
- Simulação e processamento Split Payment IBS/CBS
- Reforma Tributária 2026

---

### 16. 🌾 Agro (`views_agro.py`, `views_agro_operacional.py`)

**Funcionalidades:**
- Gestão de **safras**
- **Contratos agrícolas**
- **Conversões de unidades** (ex: sacas para kg)
- **Veículos** agrícolas
- **Talhões** (areas de plantio)
- **Maquinário** e lançamentos de uso
- **Mão de obra** e lançamentos
- **Despesas** agrícolas
- WhatsApp específico para agro

---

### 17. 👥 RH — Recursos Humanos (`views_rh.py`, `models_rh.py`)

**Funcionalidades:**
- Cadastro de funcionários
- **Registro de ponto** (entrada/saída)
- **Holerites**
- **EPI** — Equipamentos de Proteção Individual
  - Categorias de EPI
  - Cadastro e entregas
- **Ocorrências** de funcionários
- Ponto eletrônico (`PontoPage.jsx`)

---

### 18. 🔄 CRM — Pipeline de Vendas (`views_crm.py`, `models_crm.py`)

**Funcionalidades:**
- Cadastro de **Leads** com pipeline visual
- **Etapas do pipeline** customizáveis
- **Origens de leads** (fonte de captação)
- **Atividades** por lead (ligação, reunião, e-mail)
- Análise de churn (`views_churn.py`, `services/churn_service.py`)
- Análise RFM (Recência, Frequência, Monetário)

---

### 19. 🏭 PCP — Planejamento e Controle de Produção (`views_pcp.py`, `models_pcp.py`)

**Funcionalidades:**
- **Ordens de Produção** com status
- **Composição de produtos** (lista de materiais / BOM)
- Controle de insumos e quantidade produzida
- Integração com estoque

---

### 20. 🔁 Recorrência (`views_recorrencia.py`, `models_recorrencia.py`)

**Funcionalidades:**
- **Contratos recorrentes** (mensalidades, assinaturas)
- Geração automática de parcelas
- Controle de faturamento periódico

---

### 21. 🏠 Aluguel de Equipamentos

**Funcionalidades:**
- Cadastro de **equipamentos** para locação
- **Contratos de aluguel** com período
- Templates de contrato (`ConfiguracaoContratoViewSet`)
- Controle de devolução

---

### 22. 📊 Relatórios

#### Relatórios de Clientes (`views_relatorios_cliente.py` — 40 KB)
- Total de pagamentos por cliente
- Extrato do cliente
- Total gasto histórico
- Vendas dos últimos 12 meses
- Desempenho do cliente
- Tipo de cliente
- Características dos clientes
- Débito em conta
- Crédito do cliente
- Contratos do cliente
- Indicações
- Dados completos

#### Relatórios de Produtos (`views_relatorios_produto.py` — 34 KB)
- Nível de estoque
- Custo do estoque
- Estoque mínimo/máximo
- Lista de preços com estoque
- Devoluções
- Valor de produtos em vendas
- PIS/COFINS por produto
- Entradas e saídas
- Por grupo de produto
- Vencimento de estoque
- Lucro por estoque
- Valor total do estoque
- Baixa rotatividade
- Mais vendidos
- Produtos alterados

#### Relatórios de Vendas (`views_relatorios_venda.py` — 42 KB)
- Histórico de vendas
- Lucro por vendas
- Agrupado por dia
- Agrupado por dia com descrição
- Recibos gerados
- Pedidos por data
- Total de vendas/quantidade
- Pedidos abertos
- Cobranças pendentes
- Vendas por cliente
- Vendas por cidade/vendedor
- Lucro por vendedor
- Por característica do produto
- Última compra do cliente
- Custo venda cartão
- Relatório de frete

#### Relatórios Gerais (`views_relatorios.py` — 269 KB)
- Dashboard BI de OS
- Relatórios fiscais (SPED, CT-e, MDF-e)
- Relatório hoteleiro
- Inventário
- Lucratividade
- DRE (Demonstrativo de Resultado)
- Comissões de vendedores
- Margem de produtos

---

### 23. 💬 E-mail Marketing (`views_email.py` — 36 KB)

**Funcionalidades:**
- Configuração de SMTP (`EmailConfigViewSet`)
- Templates de e-mail (`EmailTemplateViewSet`)
- Campanhas de e-mail marketing (`EmailCampaignViewSet`)
- Envio transacional (NF-e, boleto, documentos)
- Webhook SendGrid / Mailgun
- Log de envios (`EmailLogViewSet`)

---

### 24. 🏪 Marketplace (`views_marketplace.py`, `models_marketplace.py`)

**Funcionalidades:**
- Configuração de integração com marketplaces
- Catálogo de produtos para publicação
- Serviço de integração (`services/marketplace_service.py`)

---

### 25. 💰 Cashback (`views_cashback.py`, `viewsets_cashback.py`)

**Funcionalidades:**
- Geração de cashback por venda
- Saldo de cashback por cliente
- Utilização do cashback em novas compras
- Expiração automática
- Relatório de cashback
- Notificação de cashbacks vencendo

---

### 26. 🔄 Devoluções e Trocas

#### Devoluções (`views_devolucao.py`, `views_devolucao_custom.py`)
- Devolução de venda (total/parcial)
- Devolução de compra
- Geração de crédito do cliente (`CreditoClienteViewSet`)
- Estorno financeiro

#### Trocas (`views_troca.py` — 29 KB, `urls_troca.py`)
- Troca de produto por produto
- Crédito em troca
- Histórico de trocas

---

### 27. 🏷️ Promoções (`views_promocao.py` — 31 KB)

**Funcionalidades:**
- Cadastro de promoções por período
- Promoções por produto/grupo/cliente
- Mapa visual de promoções (`MapaPromocaoPage.jsx`)
- Alerta de promo na venda (`AlertaPromoVenda.jsx`)
- Configuração de regras de preço

---

### 28. 📦 Logística — Mapa de Carga

**Funcionalidades:**
- Criação de mapas de carga para entrega (`MapaCargaViewSet`)
- Itens por mapa de carga
- Controle de status de entrega (`EntregasPage.jsx`)

---

### 29. ⚖️ Balança (`views_balanca.py`, `models_balanca.py`, `services_balanca.py`)

**Funcionalidades:**
- Integração com balanças Toledo e similares
- Leitura de peso via porta serial/rede
- Cálculo de preço por peso na venda

---

### 30. 📋 Cotações (`views_cotacao.py`, `models_cotacao.py`)

**Funcionalidades:**
- Criação de cotações para fornecedores
- Resposta pública de cotação (link externo sem login — `CotacaoRespostaPublica.jsx`)
- Comparativo de preços de fornecedores
- Conversão de cotação em pedido de compra

---

### 31. 🔒 SaaS / Licenciamento (`licenciamento_service.py`)

**Funcionalidades:**
- Verificação de licença (`saas_verificar_licenca`)
- Gestão de clientes SaaS (`SaaSClienteViewSet`)
- Mensalidades (`SaaSClienteMensalidadeViewSet`)
- Contratos SaaS (`SaaSClienteContratoViewSet`)
- **Gabaritos customizados** — templates por cliente
- Versões do sistema (`VersaoSistemaViewSet`)
- Histórico de atualizações
- Agendamento de atualizações por cliente
- Status financeiro SaaS
- **Bloqueio automático** por inadimplência
- Solicitação de upgrade de plano
- Painel Admin SaaS (`SaaSAdminPage.jsx`)

---

### 32. 📊 Gráficos e BI (`views_graficos.py` — 24 KB)

**Funcionalidades:**
- Gráficos comparativos de vendas
- Dashboard principal (`DashboardHome.jsx`)
- Dashboard BI (`DashboardBI.jsx`)
- Dashboard BI de OS (`DashboardBIOS.jsx`)
- Análise de margem (`views_margem.py`)

---

### 33. 🧮 Calculadoras (`views_calculadoras.py` — 19 KB)

**Funcionalidades:**
- Calculadora de revestimento (m²)
- Calculadora de argamassa
- Calculadora de tinta
- Calculadora de peso de venda
- Variações de produto para venda pesada
- Calculadora tributária (`views_tributacao.py`)
- **Split Payment** IBS/CBS (Reforma Tributária)

---

### 34. 🏦 Fiscal e Tributação

- **Regras fiscais** por operação/UF (`RegraFiscalViewSet`)
- **Perfis de tributação** (`TipoTributacaoViewSet`)
- **Alíquotas por UF** (`TributacaoUFViewSet`)
- **Tributador automático** (`services/tributador.py` — 47 KB)
- Validação de NCM
- Reforma Tributária (Split Payment IBS/CBS)

---

### 35. 🖨️ Impressão e Etiquetas

- Configuração de impressão por módulo (`ConfiguracaoImpressaoViewSet`)
- Etiquetas de produto (`etiquetas/`, `EtiquetasPage.jsx`)
- Impressão de cupom 80mm
- DANFE / DACTE PDF
- Suporte a impressoras Zebra e térmicas

---

### 36. 🔔 Notificações (`views_notificacoes.py` — 22 KB)

**Funcionalidades:**
- Cashbacks vencendo
- Inadimplência detalhada
- Estoque crítico (abaixo do mínimo)
- Fornecedores com estoque crítico
- Comunicados ativos por filial (SaaS)
- Sino de notificações no frontend (`NotificationBell.jsx`)

---

### 37. 🔐 Segurança e Auditoria

- **JWT Authentication** — tokens de 8 horas
- **Middleware de Auditoria** (`middleware_auditoria.py` — 19 KB) — registra todas as operações
- **Logs de Auditoria** (`LogAuditoriaViewSet`)
- **Permissões por usuário** (`permissions.py` — 12 KB)
- Controle de acesso por módulo (`AdvancedProtectedRoute.jsx`)
- Verificação de senha supervisor
- Solicitações de aprovação (`SolicitacaoAprovacaoViewSet`)

---

### 38. 💾 Backup (`services/backup_service.py`, `management/commands/backup_database.py`)

**Funcionalidades:**
- Backup automático do banco de dados
- Backup manual via interface (`BackupPage.jsx`)
- Armazenamento por data

---

## 🎨 FRONTEND — React/Vite

### Estrutura Principal

```
frontend/src/
├── App.jsx              # Roteamento principal (React Router)
├── pages/               # Páginas da aplicação (116 arquivos)
├── components/          # Componentes reutilizáveis (120 arquivos)
├── context/             # Context API (Auth, etc.)
├── hooks/               # Custom hooks
├── services/            # Serviços de API
├── utils/               # Funções utilitárias
└── theme/               # Sistema de design
```

### Páginas Principais

| Página | Arquivo | Tamanho | Descrição |
|--------|---------|---------|-----------|
| Venda Rápida | `VendaRapidaPage.jsx` | 258 KB | PDV completo para vendas rápidas |
| Compras | `CompraPage.jsx` | 253 KB | Gestão completa de compras |
| Ordem de Serviço | `OrdemServicoPage.jsx` | 251 KB | OS com fotos, assinatura, etc. |
| Vendas | `Vendas.jsx` (componente) | 383 KB | Motor principal de vendas |
| Hotel PMS | `HotelPMSPage.jsx` | 136 KB | Sistema hoteleiro |
| SaaS Admin | `SaaSAdminPage.jsx` | 134 KB | Painel de administração SaaS |
| NFC-e (PDV) | `NFCePage.jsx` | 84 KB | PDV com emissão NFC-e |
| Faturamento | `FaturamentoPage.jsx` | 84 KB | Faturamento em lote |
| Financeiro | `FinancePage.jsx` | 82 KB | Contas a pagar/receber |
| MDF-e | `MDFePage.jsx` | 87 KB | Manifesto Eletrônico |
| PetShop | `PetShopPage.jsx` | 77 KB | Gestão de pets e agendamentos |
| Clínica Vet. | `ClinicaVeterinariaPage.jsx` | 74 KB | Prontuário veterinário |
| Comandas | `ComandasPage.jsx` | 109 KB | Bar/Restaurante |
| Produtos | `ProdutoPageResponsive.jsx` | 219 KB | Cadastro de produtos |
| Agenda | `AgendaPage.jsx` | 25 KB | Agenda de atendimentos |
| Balancas | `BalancasPage.jsx` | 41 KB | Integração com balanças |
| RH | `RHPage.jsx` | 43 KB | Recursos Humanos |
| Gráficos | `GraficosPage.jsx` | 56 KB | BI e gráficos |
| CT-e | `CTePage.jsx` | 30 KB | CT-e emissão e gestão |
| Etiquetas | `EtiquetasPage.jsx` | 49 KB | Impressão de etiquetas |
| Cheques | `ChequesPage.jsx` | 27 KB | Gestão de cheques |
| Cotação | `CotacaoPage.jsx` | 20 KB | Cotações de compra |
| CRM | `CRMPage.jsx` | 15 KB | Pipeline de vendas |
| Churn | `ChurnPage.jsx` | 10 KB | Análise de churn |
| Agro Operacional | `AgroOperacionalPage.jsx` | 72 KB | Gestão agrícola |
| Promoções | `MapaPromocaoPage.jsx` | 57 KB | Mapa visual de promoções |

### Componentes Chave

| Componente | Descrição |
|-----------|-----------|
| `DashboardLayoutClean.jsx` | Layout principal com sidebar e navegação |
| `Sidebar.jsx` | Menu lateral com módulos |
| `OperacoesConfig.jsx` | Configuração de operações fiscais |
| `EmpresaConfig.jsx` | Configuração da empresa |
| `UsuariosConfig.jsx` | Gestão de usuários e permissões |
| `UserDialog.jsx` | Diálogo de criação/edição de usuário |
| `AIChat.jsx` | Chat com Assistente IA |
| `GlobalSearch.jsx` | Busca global no sistema |
| `NotificationBell.jsx` | Sino de notificações |
| `ReportBuilderDialog.jsx` | Builder visual de relatórios |
| `WhatsAppQuickSend.jsx` | Envio rápido via WhatsApp |
| `GerenciadorBloqueioSaaS.jsx` | Bloqueio por inadimplência SaaS |
| `CadastroTurboProduto.jsx` | Cadastro IA de produtos |
| `TributacaoConfig.jsx` | Configuração tributária |

---

## ⚙️ CONFIGURAÇÕES DO SISTEMA

### Apps Django Instalados
- `api` — App principal
- `comandas` — Comandas bar/restaurante
- `etiquetas` — Impressão de etiquetas
- `cadastro_clientes` — Cadastro auxiliar
- `cte` — CT-e
- `mdfe` — MDF-e

### Banco de Dados
- **Padrão**: MySQL 8.x
- **Alternativo**: SQLite (para executável standalone)
- **Multi-DB**: Banco central (`aperus_central`) + banco por tenant

### Autenticação
- JWT com 8h de acesso e 7 dias de refresh
- `rest_framework_simplejwt`

### Middlewares (em ordem)
1. `CorsMiddleware` — CORS
2. `SecurityMiddleware` — HTTPS
3. **`TenantMiddleware`** — Multi-tenancy
4. `WhiteNoiseMiddleware` — Arquivos estáticos
5. `SessionMiddleware`
6. `CommonMiddleware`
7. `DebugMiddleware` — Debug requests
8. `XHTTPMethodOverrideMiddleware` — Method Override
9. `AuthenticationMiddleware`
10. **`AuditoriaMiddleware`** — Auditoria de operações

---

## 🛠️ MANAGEMENT COMMANDS (Django)

| Comando | Descrição |
|---------|-----------|
| `backup_database` | Backup completo do banco |
| `add_data_nascimento` | Preenche data de nascimento dos clientes |
| `add_data_entrada` | Preenche data de entrada de funcionários |
| `add_whatsapp` | Migração de campo WhatsApp |
| `processar_whatsapp` | Processamento da fila de WhatsApp |
| `repair_venda_financeiro` | Repara vínculos financeiros de vendas |
| `fix_encoding` | Corrige encoding no banco de dados |
| `gerar_recebimento_cartao` | Gera recebimentos de cartão |
| `run_venda_test` | Executa testes de venda |
| `reproduce_depositos` | Corrige/replica depósitos de estoque |

---

## 🔗 SERVIÇOS EXTERNOS INTEGRADOS

| Serviço | Finalidade |
|---------|-----------|
| **SEFAZ** | Autorização NF-e, NFC-e, cancelamento, inutilização |
| **Google Gemini AI** | IA conversacional, análise de negócio, TTS |
| **Evolution API** | WhatsApp Business API |
| **Playwright** | WhatsApp Web (fallback) |
| **Mercado Pago** | Boletos, Point (Tap to Pay), PIX |
| **SendGrid / Mailgun** | E-mail transacional e marketing |
| **Cloudflare Tunnel** | Exposição HTTPS em produção |
| **GitHub** | Deploy automático via webhook |
| **Receita Federal** | Consulta CNPJ |
| **SimpliSS** | NFSe (Nota de Serviço) |

---

## 🚀 SCRIPTS DE DEPLOY E MANUTENÇÃO

| Script | Descrição |
|--------|-----------|
| `INICIAR.bat` | Inicia o servidor Django localmente |
| `ATUALIZAR.ps1` | Atualiza o servidor do GitHub (git pull + restart) |
| `DEPLOY.ps1` | Deploy completo (backend + frontend build) |
| `DEPLOY_FRONTEND.ps1` | Build e deploy apenas do frontend |
| `GERAR_APK.ps1` | Gera APK Android via Capacitor |
| `GIT_SYNC.ps1` | Sincroniza com GitHub |
| `GIT_ATUALIZAR_SERVIDOR.ps1` | Atualiza servidor remoto |
| `INICIAR_PRODUCAO.ps1` | Inicia modo produção (Gunicorn/Waitress) |
| `SERVIDOR_AUTO_UPDATE.ps1` | Auto-update automático |
| `COLLECTSTATIC.ps1` | Coleta arquivos estáticos |
| `CONFIGURAR_GEMINI.ps1` | Configura API Key do Gemini |
| `ENVIAR.ps1` | Envio de arquivos para servidor |

---

## 📱 APLICATIVO ANDROID

- **Tecnologia**: Capacitor (wrapper nativo)
- **Arquivo**: `APERUS.apk` (~14 MB)
- **Pasta de build**: `frontend/android/`
- **URL**: conecta na instância Django via URL configurável
- **Funcionalidades offline**: Cache Service Worker

---

## 📁 ESTRUTURA DE DADOS POR TENANT

```
C:\APERUS\arquivos_clientes\
├── aperus_bruno\       # Tenant "Bruno"
│   └── (XMLs, PDFs, certificados)
└── aperus_amerpusinformatica\  # Tenant "Amerpos"
```

---

## 🗄️ MAPA COMPLETO DE DADOS (Django Models)

> **~123 models** distribuídos em 14 arquivos de models

### Resumo por Módulo

| Módulo (arquivo) | Models | Tabelas principais |
|---|---|---|
| `models.py` (principal) | ~80 | clientes, produtos, vendas, compras, financeiro... |
| `models_rh.py` | 7 | rh_funcionario, rh_registro_ponto, rh_holerite... |
| `models_hotel.py` | 5 | hotel_quarto, hotel_reserva, hotel_consumo... |
| `models_crm.py` | 4 | crm_lead, crm_etapa_pipeline, crm_atividade_lead... |
| `models_devolucao.py` | 4 | devolucoes, creditos_cliente, credito_utilizacoes... |
| `models_cotacao.py` | 4 | cotacoes, cotacao_itens, cotacao_fornecedores... |
| `models_mercadologico.py` | 4 | categorias_mercadologicas, precos_concorrencia... |
| `models_pix.py` | 3 | pix_configuracao, pix_cobranca, pix_webhook_log |
| `models_balanca.py` | 3 | configuracao_balanca, produto_balanca, exportacao_balanca |
| `models_pcp.py` | 2 | pcp_composicao_produto, pcp_ordem_producao |
| `models_recorrencia.py` | 2 | recorrencia_contrato, recorrencia_parcela |
| `models_mp_point.py` | 2 | mp_point_configuracao, mp_point_transacoes |
| `models_marketplace.py` | 2 | marketplace config e produtos |
| `models_status_os.py` | 1 | status_ordem_servico |

### Relações Principais entre Entidades

```
EmpresaConfig ──► ConfiguracaoPix, ConfiguracaoMercadoPago, SplitPaymentConfig, EmailConfig
Cliente ──► Venda, OrdemServico, Reserva, Pet, Lead, ContratoRecorrencia, Aluguel, Cheque
Produto ──► Estoque, VendaItem, CompraItem, CatalogoItem, ProdutoBalanca, ComposicaoProduto
Venda ──► VendaItem, VendaSplitPayment, MapaCargaItem, Cashback, CobrancaPix
FinanceiroConta ──► Boleto (via ConfiguracaoBancaria)
Funcionario ──► RegistroPonto, Holerite, EntregaEPI, OcorrenciaFuncionario
Lead ──► AtividadeLead (CRM Pipeline)
Reserva ──► ConsumoQuarto (Hotel PMS)
Agendamento ──► SessaoAgendamento (PetShop)
```

### Models-Chave com Campos Fiscais (Reforma Tributária)

- **`VendaItem`** — ibs_cst, ibs_aliq, cbs_cst, cbs_aliq, is_aliq
- **`TributacaoProduto`** — ibs_aliquota, cbs_aliquota, cst_ibs_cbs, imposto_seletivo_aliquota
- **`RegraFiscal`** — ibs_cst, ibs_aliq, cbs_cst, cbs_aliq, is_aliq, fcp_aliq
- **`RegraFiscalReforma2026`** — aliquota_ibs_uf, aliquota_ibs_mun, aliquota_cbs
- **`VendaSplitPayment`** — valor_ibs_uf, valor_ibs_mun, valor_cbs, valor_total_retido

### Models dos Apps Separados

#### Comandas (`comandas/models.py` — 5 models)
- `Mesa` — numero, capacidade, status (Livre/Ocupada/Reservada/Limpeza)
- `Comanda` — FK mesa/cliente/garçom/vendedor, forma_pagamento, subtotal, taxa_servico
- `ItemComanda` — FK comanda/produto, quantidade, status de preparo
- `TransferenciaMesa` — FK comanda/mesa_origem/mesa_destino, histórico
- `PagamentoComanda` — FK comanda, formas de pagamento múltiplas

#### CT-e (`cte/models.py` — 4 models)
- `ConhecimentoTransporte` — chave_cte(44), status, FK remetente/destinatário/expedidor/recebedor, carga, frete, ICMS, veículo/condutor, CIOT, cidades origem/destino
- `CTeDocumento` — FK cte, tipo_documento (NFE/NF/OUTROS), chave_nfe(44)
- `CTeComponenteValor` — FK cte, nome (Frete Peso, Sec/Cat, Pedágio), valor
- `CTeDocumentoOriginario` — FK cte, tipo, chave_nfe(44)

#### MDF-e (`mdfe/models.py` — 10 models)
- `ManifestoEletronico` — chave/protocolo/número/série/status, uf_inicio/uf_fim, veículo/condutor, carga, seguro, CIOT, tomador
- `MDFeDocumentoVinculado` — FK mdfe, tipo (CTE/NFE), chave_acesso(44)
- `MDFePercurso` — UFs do trajeto em ordem
- `MDFeCarregamento` — município/IBGE de carregamento
- `MDFeDescarregamento` — município/IBGE de descarregamento
- `MDFeCondutor` — condutores adicionais
- `MDFeReboque` — carretas/reboques (placa, tara, capacidade, carroceria)
- `MDFeLacre` — lacres aplicados
- `MDFeValePedagio` — vales pedágio (TAG/OBU, cupom, eletrônico)
- `MDFePagamento` — pagamentos de frete (Dinheiro/PIX/Cartão/Boleto/Pedágio)

#### Etiquetas (`etiquetas/models.py` — 2 models)
- `LayoutEtiqueta` — configuração de layout personalizado (papel, margens, colunas, linhas, campos JSON)
- `ImpressaoEtiqueta` — histórico de impressões (produtos JSON, quantidades)

#### Cadastro Clientes (`cadastro_clientes/models.py` — 2 models)
- `EscritorioContabilidade` — cnpj, razao_social, contador, email (auto-uppercase)
- `Cliente` (modelo auxiliar) — dados completos com regime tributário, FK escritório, validadores regex

### Models SaaS / Multi-tenant (Banco Central)

- **`SaaSCliente`** — cnpj, schema_name, db_host, status_licenca, valor_mensalidade
- **`SaaSClienteMensalidade`** — data_vencimento, status_pagamento, url_boleto, pix_copia_cola
- **`SaaSClienteContrato`** — texto_contrato, assinado, ip_assinatura, token_validacao
- **`VersaoSistema`** — versao, data_lancamento
- **`HistoricoAtualizacao`** — FK cliente, FK versao, status (SUCESSO/FALHA/PROCESSANDO)
- **`GabaritoCustomizado`** — layout_json, tipo (ETIQUETA/A4/RECIBO)

---

## ⚙️ MOTOR DE TRIBUTAÇÃO (`services/tributador.py` — 1.017 linhas)

Padrão **Strategy + Fallback em cascata** com **6 níveis** de prioridade:

```
Nível 1: empresa + UF_origem + UF_destino + tipo_operação + NCM
Nível 2: empresa + UF_destino + tipo_operação + NCM
Nível 3: empresa + NCM
Nível 4: global + UF_destino + NCM
Nível 5: global + NCM
Nível 6: empresa padrão (sem regra específica)
```

**Tributos calculados:** ICMS, ICMS-ST (com MVA ajustado), DIFAL, FCP, PIS, COFINS, IPI, FUNRURAL, SENAR
**Reforma 2026:** IBS (estadual + municipal), CBS, Imposto Seletivo (IS)

| Função | Descrição |
|--------|----------|
| `Tributador.tributar(vu, qt)` | Retorna `ResultadoTributacao` completo |
| `aliquota_interestadual(uf_o, uf_d, origem)` | 4%, 7% ou 12% (Res. Senado 22/89) |
| `calcular_mva_ajustado(mva, alq_inter, alq_intra)` | MVA ajustado para ST (Conv. ICMS 35/2011) |
| `sugerir_cfop(...)` | Sugere CFOP pela matriz de enquadramento |
| `ResultadoTributacao.to_nfe_dict()` | Serializa para tags NF-e 4.0 |

---



> [!NOTE]
> O sistema tem **dois repositórios/instâncias** do mesmo código: `aperus_mae` (servidor central SaaS) e `SistemaAperus` (instância de produção/desenvolvimento). São sincronizados via Git.

> [!TIP]
> O arquivo `models.py` principal tem **267 KB / 6.124 linhas** — é o maior arquivo do sistema. Contém todos os modelos principais do ERP.

> [!IMPORTANT]
> O arquivo `views.py` tem **300 KB** e `views_vendas.py` tem **154 KB**. O módulo de relatórios `views_relatorios.py` tem **269 KB**. São os arquivos mais críticos do backend.

> [!WARNING]
> `CORS_ALLOW_ALL_ORIGINS = True` está ativo no código. Em produção, isso deve ser restringido via variável de ambiente.

---

*Documentação gerada automaticamente por análise estática do código-fonte em 2026-06-17.*
