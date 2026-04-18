-- Migration para adicionar campo data_nascimento na tabela clientes
-- Execute este script no MySQL Workbench ou via linha de comando

-- Verificar se a coluna já existe antes de adicionar
SELECT COUNT(*) as coluna_existe
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'seu_database_name'  -- Substitua pelo nome do seu database
  AND TABLE_NAME = 'clientes'
  AND COLUMN_NAME = 'data_nascimento';

-- Se a coluna não existir (retornar 0), execute o comando abaixo:
ALTER TABLE clientes 
ADD COLUMN data_nascimento DATE NULL 
COMMENT 'Data de nascimento do cliente para envio de mensagens de aniversário';

-- Verificar se foi adicionada
DESCRIBE clientes;

-- Exemplo de como inserir data de nascimento para clientes existentes:
-- UPDATE clientes SET data_nascimento = '1985-05-15' WHERE id_cliente = 1;
-- UPDATE clientes SET data_nascimento = '1990-08-22' WHERE id_cliente = 2;

-- Para testar o sistema, adicione uma data de nascimento com o dia e mês de hoje:
-- UPDATE clientes 
-- SET data_nascimento = CONCAT(YEAR(CURDATE()) - 35, '-', LPAD(MONTH(CURDATE()), 2, '0'), '-', LPAD(DAY(CURDATE()), 2, '0'))
-- WHERE id_cliente = 1;  -- Substitua pelo ID de um cliente de teste
