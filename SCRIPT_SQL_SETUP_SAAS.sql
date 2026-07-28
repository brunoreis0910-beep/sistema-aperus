-- =====================================================
-- SCRIPT SQL: Criar Tabelas SaaS de Faturamento
-- =====================================================
-- Executar esse script no seu banco de dados antes de rodar as migrações Django
-- Data: 02/06/2026

-- 1. TABELA: licenca (Gerenciamento local de contingência offline)
CREATE TABLE IF NOT EXISTS licenca (
    id_licenca INT AUTO_INCREMENT PRIMARY KEY,
    chave_licenca VARCHAR(255) UNIQUE NOT NULL,
    data_validade DATE NOT NULL,
    data_validade_offline DATE,
    status VARCHAR(20) DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa', 'Bloqueada')),
    ultimo_check DATETIME,
    modo_offline BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_data_validade (data_validade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABELA: faturas (Controle de inadimplência)
CREATE TABLE IF NOT EXISTS faturas (
    id_fatura INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_emissao DATE DEFAULT CURDATE(),
    status VARCHAR(20) DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'ATRASADO', 'PAGA', 'CANCELADA')),
    pix_copia_e_cola LONGTEXT,
    link_boleto VARCHAR(500),
    nfse_numero VARCHAR(20),
    nfse_emitida BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    INDEX idx_cliente_status (cliente_id, status),
    INDEX idx_vencimento (data_vencimento),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. ALTERAÇÕES: Adicionar campos à tabela clientes
-- (Se sua tabela clientes já existir, essas colunas serão adicionadas)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS bloqueio_manual BOOLEAN DEFAULT 0 COMMENT 'Bloqueio manual por fim de contrato';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email_responsavel VARCHAR(100) COMMENT 'Email do responsável para notificações de fatura';

-- Criar índices adicionais na tabela clientes
ALTER TABLE clientes ADD INDEX IF NOT EXISTS idx_bloqueio_manual (bloqueio_manual);
ALTER TABLE clientes ADD INDEX IF NOT EXISTS idx_cpf_cnpj (cpf_cnpj);

-- 4. TABELA: licenca_historico (Auditoria de bloqueios)
CREATE TABLE IF NOT EXISTS licenca_historico (
    id_historico INT AUTO_INCREMENT PRIMARY KEY,
    licenca_id INT NOT NULL,
    status_anterior VARCHAR(20),
    status_novo VARCHAR(20),
    motivo VARCHAR(255),
    ip_requisicao VARCHAR(15),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (licenca_id) REFERENCES licenca(id_licenca) ON DELETE CASCADE,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABELA: fatura_pagamento (Histórico de pagamentos e tentativas)
CREATE TABLE IF NOT EXISTS fatura_pagamento (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    fatura_id INT NOT NULL,
    valor_pago DECIMAL(15, 2),
    data_pagamento DATETIME,
    metodo_pagamento VARCHAR(50), -- PIX, BOLETO, TRANSFERENCIA, etc
    referencia_pix VARCHAR(255),
    status_pagamento VARCHAR(20) DEFAULT 'PENDENTE', -- PENDENTE, CONFIRMADO, FALHO
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fatura_id) REFERENCES faturas(id_fatura) ON DELETE CASCADE,
    INDEX idx_fatura_status (fatura_id, status_pagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. VIEW: Status Financeiro Atual por Cliente
CREATE OR REPLACE VIEW v_status_financeiro_cliente AS
SELECT 
    c.id_cliente,
    c.cpf_cnpj,
    c.nome_razao_social,
    c.bloqueio_manual,
    COUNT(f.id_fatura) as total_faturas,
    SUM(CASE WHEN f.status = 'ATRASADO' THEN f.valor ELSE 0 END) as valor_atrasado,
    MAX(CASE WHEN f.status = 'ATRASADO' THEN DATEDIFF(CURDATE(), f.data_vencimento) ELSE 0 END) as max_dias_atraso,
    CASE 
        WHEN c.bloqueio_manual THEN 'BLOQUEADO_MANUAL'
        WHEN MAX(CASE WHEN f.status = 'ATRASADO' THEN DATEDIFF(CURDATE(), f.data_vencimento) ELSE 0 END) > 10 THEN 'BLOQUEADO_FINANCEIRO'
        WHEN MAX(CASE WHEN f.status = 'ATRASADO' THEN DATEDIFF(CURDATE(), f.data_vencimento) ELSE 0 END) > 5 THEN 'ALERTA_CRITICO'
        WHEN SUM(CASE WHEN f.status = 'ATRASADO' THEN 1 ELSE 0 END) > 0 THEN 'ALERTA_SUAVE'
        ELSE 'EM_DIA'
    END as status_atual
FROM clientes c
LEFT JOIN faturas f ON c.id_cliente = f.cliente_id
GROUP BY c.id_cliente;

-- 7. VIEW: Faturamento Mensal (Para Dashboard Gerencial)
CREATE OR REPLACE VIEW v_faturamento_mensal AS
SELECT 
    YEAR(f.data_emissao) as ano,
    MONTH(f.data_emissao) as mes,
    COUNT(*) as total_faturas,
    SUM(f.valor) as valor_total,
    SUM(CASE WHEN f.status = 'PAGA' THEN f.valor ELSE 0 END) as valor_pago,
    SUM(CASE WHEN f.status = 'ATRASADO' THEN f.valor ELSE 0 END) as valor_atrasado,
    SUM(CASE WHEN f.status = 'ABERTA' THEN f.valor ELSE 0 END) as valor_aberto
FROM faturas f
GROUP BY YEAR(f.data_emissao), MONTH(f.data_emissao);

-- 8. Inserir registro padrão de licença (ID 1)
INSERT IGNORE INTO licenca (id_licenca, chave_licenca, data_validade, status)
VALUES (1, 'APERUS_LOCAL_LICENSE_KEY', CURDATE(), 'Ativa');

-- Confirmação
SELECT '✅ Tabelas criadas com sucesso!' as status_instalacao;
SELECT COUNT(*) as total_tabelas_criadas FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('licenca', 'faturas', 'licenca_historico', 'fatura_pagamento');
