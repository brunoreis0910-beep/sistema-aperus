-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: aperus_amerpusinformatica
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `agro_despesas`
--

DROP TABLE IF EXISTS `agro_despesas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agro_despesas` (
  `id_despesa` int NOT NULL AUTO_INCREMENT,
  `categoria` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_lancamento` date NOT NULL,
  `valor` decimal(14,2) NOT NULL,
  `quantidade` decimal(14,4) DEFAULT NULL,
  `unidade` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fornecedor` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_nota` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_safra_id` int NOT NULL,
  `id_talhao_id` int DEFAULT NULL,
  PRIMARY KEY (`id_despesa`),
  KEY `agro_despesas_id_safra_id_009d829e_fk_safras_id_safra` (`id_safra_id`),
  KEY `agro_despesas_id_talhao_id_53bde627_fk_agro_talhoes_id_talhao` (`id_talhao_id`),
  CONSTRAINT `agro_despesas_id_safra_id_009d829e_fk_safras_id_safra` FOREIGN KEY (`id_safra_id`) REFERENCES `safras` (`id_safra`),
  CONSTRAINT `agro_despesas_id_talhao_id_53bde627_fk_agro_talhoes_id_talhao` FOREIGN KEY (`id_talhao_id`) REFERENCES `agro_talhoes` (`id_talhao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agro_despesas`
--

LOCK TABLES `agro_despesas` WRITE;
/*!40000 ALTER TABLE `agro_despesas` DISABLE KEYS */;
/*!40000 ALTER TABLE `agro_despesas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agro_lancamentos_maquinario`
--

DROP TABLE IF EXISTS `agro_lancamentos_maquinario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agro_lancamentos_maquinario` (
  `id_lancamento_maq` int NOT NULL AUTO_INCREMENT,
  `operacao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_inicio` datetime(6) NOT NULL,
  `data_fim` datetime(6) DEFAULT NULL,
  `horas_trabalhadas` decimal(8,2) NOT NULL,
  `area_trabalhada_ha` decimal(10,4) DEFAULT NULL,
  `operador` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `combustivel_litros` decimal(10,2) DEFAULT NULL,
  `valor_total` decimal(14,2) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_safra_id` int NOT NULL,
  `id_maquinario_id` int NOT NULL,
  `id_talhao_id` int DEFAULT NULL,
  PRIMARY KEY (`id_lancamento_maq`),
  KEY `agro_lancamentos_maq_id_safra_id_18eae36f_fk_safras_id` (`id_safra_id`),
  KEY `agro_lancamentos_maq_id_maquinario_id_0d99afe5_fk_agro_maqu` (`id_maquinario_id`),
  KEY `agro_lancamentos_maq_id_talhao_id_50ae21ef_fk_agro_talh` (`id_talhao_id`),
  CONSTRAINT `agro_lancamentos_maq_id_maquinario_id_0d99afe5_fk_agro_maqu` FOREIGN KEY (`id_maquinario_id`) REFERENCES `agro_maquinarios` (`id_maquinario`),
  CONSTRAINT `agro_lancamentos_maq_id_safra_id_18eae36f_fk_safras_id` FOREIGN KEY (`id_safra_id`) REFERENCES `safras` (`id_safra`),
  CONSTRAINT `agro_lancamentos_maq_id_talhao_id_50ae21ef_fk_agro_talh` FOREIGN KEY (`id_talhao_id`) REFERENCES `agro_talhoes` (`id_talhao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agro_lancamentos_maquinario`
--

LOCK TABLES `agro_lancamentos_maquinario` WRITE;
/*!40000 ALTER TABLE `agro_lancamentos_maquinario` DISABLE KEYS */;
/*!40000 ALTER TABLE `agro_lancamentos_maquinario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agro_lancamentos_mdo`
--

DROP TABLE IF EXISTS `agro_lancamentos_mdo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agro_lancamentos_mdo` (
  `id_lancamento_mdo` int NOT NULL AUTO_INCREMENT,
  `nome_avulso` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `atividade` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` date NOT NULL,
  `quantidade` decimal(8,2) NOT NULL,
  `tipo_pagamento` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `valor_total` decimal(14,2) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_safra_id` int NOT NULL,
  `id_trabalhador_id` int DEFAULT NULL,
  `id_talhao_id` int DEFAULT NULL,
  PRIMARY KEY (`id_lancamento_mdo`),
  KEY `agro_lancamentos_mdo_id_safra_id_fe685004_fk_safras_id_safra` (`id_safra_id`),
  KEY `agro_lancamentos_mdo_id_trabalhador_id_1061272b_fk_agro_mao_` (`id_trabalhador_id`),
  KEY `agro_lancamentos_mdo_id_talhao_id_2f72561b_fk_agro_talh` (`id_talhao_id`),
  CONSTRAINT `agro_lancamentos_mdo_id_safra_id_fe685004_fk_safras_id_safra` FOREIGN KEY (`id_safra_id`) REFERENCES `safras` (`id_safra`),
  CONSTRAINT `agro_lancamentos_mdo_id_talhao_id_2f72561b_fk_agro_talh` FOREIGN KEY (`id_talhao_id`) REFERENCES `agro_talhoes` (`id_talhao`),
  CONSTRAINT `agro_lancamentos_mdo_id_trabalhador_id_1061272b_fk_agro_mao_` FOREIGN KEY (`id_trabalhador_id`) REFERENCES `agro_mao_de_obra` (`id_trabalhador`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agro_lancamentos_mdo`
--

LOCK TABLES `agro_lancamentos_mdo` WRITE;
/*!40000 ALTER TABLE `agro_lancamentos_mdo` DISABLE KEYS */;
/*!40000 ALTER TABLE `agro_lancamentos_mdo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agro_mao_de_obra`
--

DROP TABLE IF EXISTS `agro_mao_de_obra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agro_mao_de_obra` (
  `id_trabalhador` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `funcao` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cpf` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor_diaria` decimal(10,2) NOT NULL,
  `valor_hora` decimal(10,2) NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_trabalhador`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agro_mao_de_obra`
--

LOCK TABLES `agro_mao_de_obra` WRITE;
/*!40000 ALTER TABLE `agro_mao_de_obra` DISABLE KEYS */;
/*!40000 ALTER TABLE `agro_mao_de_obra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agro_maquinarios`
--

DROP TABLE IF EXISTS `agro_maquinarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agro_maquinarios` (
  `id_maquinario` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `marca` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ano_fabricacao` int DEFAULT NULL,
  `placa` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `horimetro_atual` decimal(10,1) NOT NULL,
  `valor_hora` decimal(10,2) NOT NULL,
  `capacidade` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_maquinario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agro_maquinarios`
--

LOCK TABLES `agro_maquinarios` WRITE;
/*!40000 ALTER TABLE `agro_maquinarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `agro_maquinarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agro_talhoes`
--

DROP TABLE IF EXISTS `agro_talhoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agro_talhoes` (
  `id_talhao` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cultura` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `variedade` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area_hectares` decimal(10,4) NOT NULL,
  `data_plantio` date DEFAULT NULL,
  `data_colheita_prevista` date DEFAULT NULL,
  `data_colheita_real` date DEFAULT NULL,
  `status` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `produtividade_prevista` decimal(10,2) DEFAULT NULL,
  `produtividade_real` decimal(10,2) DEFAULT NULL,
  `populacao_plantas` int DEFAULT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_safra_id` int NOT NULL,
  PRIMARY KEY (`id_talhao`),
  KEY `agro_talhoes_id_safra_id_c42a28e8_fk_safras_id_safra` (`id_safra_id`),
  CONSTRAINT `agro_talhoes_id_safra_id_c42a28e8_fk_safras_id_safra` FOREIGN KEY (`id_safra_id`) REFERENCES `safras` (`id_safra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agro_talhoes`
--

LOCK TABLES `agro_talhoes` WRITE;
/*!40000 ALTER TABLE `agro_talhoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `agro_talhoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alugueis`
--

DROP TABLE IF EXISTS `alugueis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alugueis` (
  `id_aluguel` int NOT NULL AUTO_INCREMENT,
  `numero_aluguel` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim_prevista` date NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `valor_multa` decimal(10,2) NOT NULL,
  `valor_desconto` decimal(10,2) NOT NULL,
  `valor_final` decimal(10,2) NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_cadastro` datetime(6) NOT NULL,
  `data_atualizacao` datetime(6) NOT NULL,
  `id_cliente` int NOT NULL,
  `id_usuario` int NOT NULL,
  PRIMARY KEY (`id_aluguel`),
  UNIQUE KEY `numero_aluguel` (`numero_aluguel`),
  KEY `alugueis_id_usuario_680de337_fk_auth_user_id` (`id_usuario`),
  KEY `alugueis_numero__1b43ed_idx` (`numero_aluguel`),
  KEY `alugueis_id_clie_5d31b4_idx` (`id_cliente`,`status`),
  KEY `alugueis_data_in_80b97d_idx` (`data_inicio`),
  KEY `alugueis_status_fdd2b8_idx` (`status`),
  CONSTRAINT `alugueis_id_cliente_f43da02e_fk_clientes_id_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `alugueis_id_usuario_680de337_fk_auth_user_id` FOREIGN KEY (`id_usuario`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alugueis`
--

LOCK TABLES `alugueis` WRITE;
/*!40000 ALTER TABLE `alugueis` DISABLE KEYS */;
/*!40000 ALTER TABLE `alugueis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alugueis_itens`
--

DROP TABLE IF EXISTS `alugueis_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alugueis_itens` (
  `id_item` int NOT NULL AUTO_INCREMENT,
  `data_devolucao_prevista` date NOT NULL,
  `data_devolucao_real` date DEFAULT NULL,
  `quantidade_dias` int NOT NULL,
  `valor_diaria` decimal(10,2) NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `valor_multa` decimal(10,2) NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_aluguel` int NOT NULL,
  `id_equipamento` int NOT NULL,
  PRIMARY KEY (`id_item`),
  KEY `alugueis_it_id_alug_df003d_idx` (`id_aluguel`),
  KEY `alugueis_it_id_equi_dadf05_idx` (`id_equipamento`,`status`),
  KEY `alugueis_it_data_de_e08e42_idx` (`data_devolucao_prevista`),
  CONSTRAINT `alugueis_itens_id_aluguel_c0e66c66_fk_alugueis_id_aluguel` FOREIGN KEY (`id_aluguel`) REFERENCES `alugueis` (`id_aluguel`),
  CONSTRAINT `alugueis_itens_id_equipamento_8920a293_fk_equipamen` FOREIGN KEY (`id_equipamento`) REFERENCES `equipamentos_aluguel` (`id_equipamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alugueis_itens`
--

LOCK TABLES `alugueis_itens` WRITE;
/*!40000 ALTER TABLE `alugueis_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `alugueis_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `animais`
--

DROP TABLE IF EXISTS `animais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `animais` (
  `id_animal` int NOT NULL AUTO_INCREMENT,
  `id_cliente_proprietario` int NOT NULL,
  `nome_animal` varchar(100) NOT NULL,
  `especie` varchar(50) DEFAULT NULL,
  `raca` varchar(50) DEFAULT NULL,
  `sexo` enum('Macho','Femea') DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `pelagem_cor` varchar(50) DEFAULT NULL,
  `observacoes` text,
  PRIMARY KEY (`id_animal`),
  KEY `fk_animais_cliente_idx` (`id_cliente_proprietario`),
  CONSTRAINT `fk_animais_cliente` FOREIGN KEY (`id_cliente_proprietario`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `animais`
--

LOCK TABLES `animais` WRITE;
/*!40000 ALTER TABLE `animais` DISABLE KEYS */;
/*!40000 ALTER TABLE `animais` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_catalogo`
--

DROP TABLE IF EXISTS `api_catalogo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_catalogo` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome_catalogo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ativo` tinyint(1) NOT NULL,
  `data_cadastro` datetime(6) NOT NULL,
  `data_atualizacao` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_catalogo`
--

LOCK TABLES `api_catalogo` WRITE;
/*!40000 ALTER TABLE `api_catalogo` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_catalogo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_catalogoitem`
--

DROP TABLE IF EXISTS `api_catalogoitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_catalogoitem` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `valor_catalogo` decimal(10,2) NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `ordem` int NOT NULL,
  `destaque` tinyint(1) NOT NULL,
  `data_cadastro` datetime(6) NOT NULL,
  `whatsapp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `data_atualizacao` datetime(6) NOT NULL,
  `catalogo_id` bigint DEFAULT NULL,
  `produto_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `api_catalogoitem_catalogo_id_d140c247_fk_api_catalogo_id` (`catalogo_id`),
  KEY `api_catalogoitem_produto_id_8704dc33_fk_produtos_id_produto` (`produto_id`),
  CONSTRAINT `api_catalogoitem_catalogo_id_d140c247_fk_api_catalogo_id` FOREIGN KEY (`catalogo_id`) REFERENCES `api_catalogo` (`id`),
  CONSTRAINT `api_catalogoitem_produto_id_8704dc33_fk_produtos_id_produto` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_catalogoitem`
--

LOCK TABLES `api_catalogoitem` WRITE;
/*!40000 ALTER TABLE `api_catalogoitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_catalogoitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_marketplaceconfig`
--

DROP TABLE IF EXISTS `api_marketplaceconfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_marketplaceconfig` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `plataforma` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `client_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_secret` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `access_token` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `refresh_token` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `expires_in` datetime(6) DEFAULT NULL,
  `config_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_marketplaceconfig`
--

LOCK TABLES `api_marketplaceconfig` WRITE;
/*!40000 ALTER TABLE `api_marketplaceconfig` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_marketplaceconfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_marketplaceproduto`
--

DROP TABLE IF EXISTS `api_marketplaceproduto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_marketplaceproduto` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `codigo_externo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `link_anuncio` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preco_plataforma` decimal(12,2) DEFAULT NULL,
  `estoque_plataforma` decimal(12,3) DEFAULT NULL,
  `status_sincronizacao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ultimo_erro` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ultima_sincronizacao` datetime(6) NOT NULL,
  `marketplace_id` bigint NOT NULL,
  `produto_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `api_marketplaceproduto_marketplace_id_produto_id_a4ef3cd7_uniq` (`marketplace_id`,`produto_id`),
  KEY `api_marketplaceprodu_produto_id_022fb69e_fk_produtos_` (`produto_id`),
  CONSTRAINT `api_marketplaceprodu_marketplace_id_73aa1db9_fk_api_marke` FOREIGN KEY (`marketplace_id`) REFERENCES `api_marketplaceconfig` (`id`),
  CONSTRAINT `api_marketplaceprodu_produto_id_022fb69e_fk_produtos_` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_marketplaceproduto`
--

LOCK TABLES `api_marketplaceproduto` WRITE;
/*!40000 ALTER TABLE `api_marketplaceproduto` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_marketplaceproduto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `atributos_variacao`
--

DROP TABLE IF EXISTS `atributos_variacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `atributos_variacao` (
  `id_atributo` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_atributo`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atributos_variacao`
--

LOCK TABLES `atributos_variacao` WRITE;
/*!40000 ALTER TABLE `atributos_variacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `atributos_variacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1405 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (685,'Can add log entry',172,'add_logentry'),(686,'Can change log entry',172,'change_logentry'),(687,'Can delete log entry',172,'delete_logentry'),(688,'Can view log entry',172,'view_logentry'),(689,'Can add permission',174,'add_permission'),(690,'Can change permission',174,'change_permission'),(691,'Can delete permission',174,'delete_permission'),(692,'Can view permission',174,'view_permission'),(693,'Can add group',173,'add_group'),(694,'Can change group',173,'change_group'),(695,'Can delete group',173,'delete_group'),(696,'Can view group',173,'view_group'),(697,'Can add user',175,'add_user'),(698,'Can change user',175,'change_user'),(699,'Can delete user',175,'delete_user'),(700,'Can view user',175,'view_user'),(701,'Can add content type',176,'add_contenttype'),(702,'Can change content type',176,'change_contenttype'),(703,'Can delete content type',176,'delete_contenttype'),(704,'Can view content type',176,'view_contenttype'),(705,'Can add session',177,'add_session'),(706,'Can change session',177,'change_session'),(707,'Can delete session',177,'delete_session'),(708,'Can view session',177,'view_session'),(709,'Can add cliente',193,'add_cliente'),(710,'Can change cliente',193,'change_cliente'),(711,'Can delete cliente',193,'delete_cliente'),(712,'Can view cliente',193,'view_cliente'),(713,'Can add grupo produto',244,'add_grupoproduto'),(714,'Can change grupo produto',244,'change_grupoproduto'),(715,'Can delete grupo produto',244,'delete_grupoproduto'),(716,'Can view grupo produto',244,'view_grupoproduto'),(717,'Can add produto',273,'add_produto'),(718,'Can change produto',273,'change_produto'),(719,'Can delete produto',273,'delete_produto'),(720,'Can view produto',273,'view_produto'),(721,'Can add financeiro conta',239,'add_financeiroconta'),(722,'Can change financeiro conta',239,'change_financeiroconta'),(723,'Can delete financeiro conta',239,'delete_financeiroconta'),(724,'Can view financeiro conta',239,'view_financeiroconta'),(725,'Can add centro custo',190,'add_centrocusto'),(726,'Can change centro custo',190,'change_centrocusto'),(727,'Can delete centro custo',190,'delete_centrocusto'),(728,'Can view centro custo',190,'view_centrocusto'),(729,'Can add Conta Bancária',210,'add_contabancaria'),(730,'Can change Conta Bancária',210,'change_contabancaria'),(731,'Can delete Conta Bancária',210,'delete_contabancaria'),(732,'Can view Conta Bancária',210,'view_contabancaria'),(733,'Can add departamento',222,'add_departamento'),(734,'Can change departamento',222,'change_departamento'),(735,'Can delete departamento',222,'delete_departamento'),(736,'Can view departamento',222,'view_departamento'),(737,'Can add operacao',261,'add_operacao'),(738,'Can change operacao',261,'change_operacao'),(739,'Can delete operacao',261,'delete_operacao'),(740,'Can view operacao',261,'view_operacao'),(741,'Can add empresa config',230,'add_empresaconfig'),(742,'Can change empresa config',230,'change_empresaconfig'),(743,'Can delete empresa config',230,'delete_empresaconfig'),(744,'Can view empresa config',230,'view_empresaconfig'),(745,'Can add funcao',242,'add_funcao'),(746,'Can change funcao',242,'change_funcao'),(747,'Can delete funcao',242,'delete_funcao'),(748,'Can view funcao',242,'view_funcao'),(749,'Can add vendedor',317,'add_vendedor'),(750,'Can change vendedor',317,'change_vendedor'),(751,'Can delete vendedor',317,'delete_vendedor'),(752,'Can view vendedor',317,'view_vendedor'),(753,'Can add vendedor funcoes',318,'add_vendedorfuncoes'),(754,'Can change vendedor funcoes',318,'change_vendedorfuncoes'),(755,'Can delete vendedor funcoes',318,'delete_vendedorfuncoes'),(756,'Can view vendedor funcoes',318,'view_vendedorfuncoes'),(757,'Can add user parametros',308,'add_userparametros'),(758,'Can change user parametros',308,'change_userparametros'),(759,'Can delete user parametros',308,'delete_userparametros'),(760,'Can view user parametros',308,'view_userparametros'),(761,'Can add user permissoes',309,'add_userpermissoes'),(762,'Can change user permissoes',309,'change_userpermissoes'),(763,'Can delete user permissoes',309,'delete_userpermissoes'),(764,'Can view user permissoes',309,'view_userpermissoes'),(765,'Can add solicitacao aprovacao',291,'add_solicitacaoaprovacao'),(766,'Can change solicitacao aprovacao',291,'change_solicitacaoaprovacao'),(767,'Can delete solicitacao aprovacao',291,'delete_solicitacaoaprovacao'),(768,'Can view solicitacao aprovacao',291,'view_solicitacaoaprovacao'),(769,'Can add Forma de Pagamento',240,'add_formapagamento'),(770,'Can change Forma de Pagamento',240,'change_formapagamento'),(771,'Can delete Forma de Pagamento',240,'delete_formapagamento'),(772,'Can view Forma de Pagamento',240,'view_formapagamento'),(773,'Can add fornecedor',241,'add_fornecedor'),(774,'Can change fornecedor',241,'change_fornecedor'),(775,'Can delete fornecedor',241,'delete_fornecedor'),(776,'Can view fornecedor',241,'view_fornecedor'),(777,'Can add compra',198,'add_compra'),(778,'Can change compra',198,'change_compra'),(779,'Can delete compra',198,'delete_compra'),(780,'Can view compra',198,'view_compra'),(781,'Can add compra item',199,'add_compraitem'),(782,'Can change compra item',199,'change_compraitem'),(783,'Can delete compra item',199,'delete_compraitem'),(784,'Can view compra item',199,'view_compraitem'),(785,'Can add venda',313,'add_venda'),(786,'Can change venda',313,'change_venda'),(787,'Can delete venda',313,'delete_venda'),(788,'Can view venda',313,'view_venda'),(789,'Can add venda item',315,'add_vendaitem'),(790,'Can change venda item',315,'change_vendaitem'),(791,'Can delete venda item',315,'delete_vendaitem'),(792,'Can view venda item',315,'view_vendaitem'),(793,'Can add Depósito',223,'add_deposito'),(794,'Can change Depósito',223,'change_deposito'),(795,'Can delete Depósito',223,'delete_deposito'),(796,'Can view Depósito',223,'view_deposito'),(797,'Can add Estoque',234,'add_estoque'),(798,'Can change Estoque',234,'change_estoque'),(799,'Can delete Estoque',234,'delete_estoque'),(800,'Can view Estoque',234,'view_estoque'),(801,'Can add Movimentação de Estoque',235,'add_estoquemovimentacao'),(802,'Can change Movimentação de Estoque',235,'change_estoquemovimentacao'),(803,'Can delete Movimentação de Estoque',235,'delete_estoquemovimentacao'),(804,'Can view Movimentação de Estoque',235,'view_estoquemovimentacao'),(805,'Can add Movimento Bancário',238,'add_financeirobancario'),(806,'Can change Movimento Bancário',238,'change_financeirobancario'),(807,'Can delete Movimento Bancário',238,'delete_financeirobancario'),(808,'Can view Movimento Bancário',238,'view_financeirobancario'),(809,'Can add Item do Catálogo',187,'add_catalogoitem'),(810,'Can change Item do Catálogo',187,'change_catalogoitem'),(811,'Can delete Item do Catálogo',187,'delete_catalogoitem'),(812,'Can view Item do Catálogo',187,'view_catalogoitem'),(813,'Can add Catálogo',186,'add_catalogo'),(814,'Can change Catálogo',186,'change_catalogo'),(815,'Can delete Catálogo',186,'delete_catalogo'),(816,'Can view Catálogo',186,'view_catalogo'),(817,'Can add Crédito de Cliente',220,'add_creditocliente'),(818,'Can change Crédito de Cliente',220,'change_creditocliente'),(819,'Can delete Crédito de Cliente',220,'delete_creditocliente'),(820,'Can view Crédito de Cliente',220,'view_creditocliente'),(821,'Can add Utilização de Crédito',221,'add_creditoutilizacao'),(822,'Can change Utilização de Crédito',221,'change_creditoutilizacao'),(823,'Can delete Utilização de Crédito',221,'delete_creditoutilizacao'),(824,'Can view Utilização de Crédito',221,'view_creditoutilizacao'),(825,'Can add Devolução',224,'add_devolucao'),(826,'Can change Devolução',224,'change_devolucao'),(827,'Can delete Devolução',224,'delete_devolucao'),(828,'Can view Devolução',224,'view_devolucao'),(829,'Can add Item de Devolução',225,'add_devolucaoitem'),(830,'Can change Item de Devolução',225,'change_devolucaoitem'),(831,'Can delete Item de Devolução',225,'delete_devolucaoitem'),(832,'Can view Item de Devolução',225,'view_devolucaoitem'),(833,'Can add Troca',304,'add_troca'),(834,'Can change Troca',304,'change_troca'),(835,'Can delete Troca',304,'delete_troca'),(836,'Can view Troca',304,'view_troca'),(837,'Can add Item de Troca',305,'add_trocaitem'),(838,'Can change Item de Troca',305,'change_trocaitem'),(839,'Can delete Item de Troca',305,'delete_trocaitem'),(840,'Can view Item de Troca',305,'view_trocaitem'),(841,'Can add cotacao',216,'add_cotacao'),(842,'Can change cotacao',216,'change_cotacao'),(843,'Can delete cotacao',216,'delete_cotacao'),(844,'Can view cotacao',216,'view_cotacao'),(845,'Can add cotacao fornecedor',217,'add_cotacaofornecedor'),(846,'Can change cotacao fornecedor',217,'change_cotacaofornecedor'),(847,'Can delete cotacao fornecedor',217,'delete_cotacaofornecedor'),(848,'Can view cotacao fornecedor',217,'view_cotacaofornecedor'),(849,'Can add cotacao item',218,'add_cotacaoitem'),(850,'Can change cotacao item',218,'change_cotacaoitem'),(851,'Can delete cotacao item',218,'delete_cotacaoitem'),(852,'Can view cotacao item',218,'view_cotacaoitem'),(853,'Can add cotacao resposta',219,'add_cotacaoresposta'),(854,'Can change cotacao resposta',219,'change_cotacaoresposta'),(855,'Can delete cotacao resposta',219,'delete_cotacaoresposta'),(856,'Can view cotacao resposta',219,'view_cotacaoresposta'),(857,'Can add Promoção',278,'add_promocao'),(858,'Can change Promoção',278,'change_promocao'),(859,'Can delete Promoção',278,'delete_promocao'),(860,'Can view Promoção',278,'view_promocao'),(861,'Can add Produto em Promoção',279,'add_promocaoproduto'),(862,'Can change Produto em Promoção',279,'change_promocaoproduto'),(863,'Can delete Produto em Promoção',279,'delete_promocaoproduto'),(864,'Can view Produto em Promoção',279,'view_promocaoproduto'),(865,'Can add tipo servico',299,'add_tiposervico'),(866,'Can change tipo servico',299,'change_tiposervico'),(867,'Can delete tipo servico',299,'delete_tiposervico'),(868,'Can view tipo servico',299,'view_tiposervico'),(869,'Can add agendamento',178,'add_agendamento'),(870,'Can change agendamento',178,'change_agendamento'),(871,'Can delete agendamento',178,'delete_agendamento'),(872,'Can view agendamento',178,'view_agendamento'),(873,'Can add avaliacao',183,'add_avaliacao'),(874,'Can change avaliacao',183,'change_avaliacao'),(875,'Can delete avaliacao',183,'delete_avaliacao'),(876,'Can view avaliacao',183,'view_avaliacao'),(877,'Can add pet',271,'add_pet'),(878,'Can change pet',271,'change_pet'),(879,'Can delete pet',271,'delete_pet'),(880,'Can view pet',271,'view_pet'),(881,'Can add sessao agendamento',290,'add_sessaoagendamento'),(882,'Can change sessao agendamento',290,'change_sessaoagendamento'),(883,'Can delete sessao agendamento',290,'delete_sessaoagendamento'),(884,'Can view sessao agendamento',290,'view_sessaoagendamento'),(885,'Can add log auditoria',249,'add_logauditoria'),(886,'Can change log auditoria',249,'change_logauditoria'),(887,'Can delete log auditoria',249,'delete_logauditoria'),(888,'Can view log auditoria',249,'view_logauditoria'),(889,'Can add cashback',185,'add_cashback'),(890,'Can change cashback',185,'change_cashback'),(891,'Can delete cashback',185,'delete_cashback'),(892,'Can view cashback',185,'view_cashback'),(893,'Can add ordem servico',264,'add_ordemservico'),(894,'Can change ordem servico',264,'change_ordemservico'),(895,'Can delete ordem servico',264,'delete_ordemservico'),(896,'Can view ordem servico',264,'view_ordemservico'),(897,'Can add os itens produto',268,'add_ositensproduto'),(898,'Can change os itens produto',268,'change_ositensproduto'),(899,'Can delete os itens produto',268,'delete_ositensproduto'),(900,'Can view os itens produto',268,'view_ositensproduto'),(901,'Can add os itens servico',269,'add_ositensservico'),(902,'Can change os itens servico',269,'change_ositensservico'),(903,'Can delete os itens servico',269,'delete_ositensservico'),(904,'Can view os itens servico',269,'view_ositensservico'),(905,'Can add Status de Ordem de Serviço',293,'add_statusordemservico'),(906,'Can change Status de Ordem de Serviço',293,'change_statusordemservico'),(907,'Can delete Status de Ordem de Serviço',293,'delete_statusordemservico'),(908,'Can view Status de Ordem de Serviço',293,'view_statusordemservico'),(909,'Can add tabela comercial',295,'add_tabelacomercial'),(910,'Can change tabela comercial',295,'change_tabelacomercial'),(911,'Can delete tabela comercial',295,'delete_tabelacomercial'),(912,'Can view tabela comercial',295,'view_tabelacomercial'),(913,'Can add tecnico',296,'add_tecnico'),(914,'Can change tecnico',296,'change_tecnico'),(915,'Can delete tecnico',296,'delete_tecnico'),(916,'Can view tecnico',296,'view_tecnico'),(917,'Can add Cheque',191,'add_cheque'),(918,'Can change Cheque',191,'change_cheque'),(919,'Can delete Cheque',191,'delete_cheque'),(920,'Can view Cheque',191,'view_cheque'),(921,'Can add equipamento',233,'add_equipamento'),(922,'Can change equipamento',233,'change_equipamento'),(923,'Can delete equipamento',233,'delete_equipamento'),(924,'Can view equipamento',233,'view_equipamento'),(925,'Can add aluguel',179,'add_aluguel'),(926,'Can change aluguel',179,'change_aluguel'),(927,'Can delete aluguel',179,'delete_aluguel'),(928,'Can view aluguel',179,'view_aluguel'),(929,'Can add aluguel item',180,'add_aluguelitem'),(930,'Can change aluguel item',180,'change_aluguelitem'),(931,'Can delete aluguel item',180,'delete_aluguelitem'),(932,'Can view aluguel item',180,'view_aluguelitem'),(933,'Can add Configuração de Contrato',202,'add_configuracaocontrato'),(934,'Can change Configuração de Contrato',202,'change_configuracaocontrato'),(935,'Can delete Configuração de Contrato',202,'delete_configuracaocontrato'),(936,'Can view Configuração de Contrato',202,'view_configuracaocontrato'),(937,'Can add tributacao produto',302,'add_tributacaoproduto'),(938,'Can change tributacao produto',302,'change_tributacaoproduto'),(939,'Can delete tributacao produto',302,'delete_tributacaoproduto'),(940,'Can view tributacao produto',302,'view_tributacaoproduto'),(941,'Can add veiculo',311,'add_veiculo'),(942,'Can change veiculo',311,'change_veiculo'),(943,'Can delete veiculo',311,'delete_veiculo'),(944,'Can view veiculo',311,'view_veiculo'),(945,'Can add atributo variacao',182,'add_atributovariacao'),(946,'Can change atributo variacao',182,'change_atributovariacao'),(947,'Can delete atributo variacao',182,'delete_atributovariacao'),(948,'Can view atributo variacao',182,'view_atributovariacao'),(949,'Can add safra',289,'add_safra'),(950,'Can change safra',289,'change_safra'),(951,'Can delete safra',289,'delete_safra'),(952,'Can view safra',289,'view_safra'),(953,'Can add contrato agricola',212,'add_contratoagricola'),(954,'Can change contrato agricola',212,'change_contratoagricola'),(955,'Can delete contrato agricola',212,'delete_contratoagricola'),(956,'Can view contrato agricola',212,'view_contratoagricola'),(957,'Can add conversao unidade',215,'add_conversaounidade'),(958,'Can change conversao unidade',215,'change_conversaounidade'),(959,'Can delete conversao unidade',215,'delete_conversaounidade'),(960,'Can view conversao unidade',215,'view_conversaounidade'),(961,'Can add produto variacao',276,'add_produtovariacao'),(962,'Can change produto variacao',276,'change_produtovariacao'),(963,'Can delete produto variacao',276,'delete_produtovariacao'),(964,'Can view produto variacao',276,'view_produtovariacao'),(965,'Can add valor atributo variacao',310,'add_valoratributovariacao'),(966,'Can change valor atributo variacao',310,'change_valoratributovariacao'),(967,'Can delete valor atributo variacao',310,'delete_valoratributovariacao'),(968,'Can view valor atributo variacao',310,'view_valoratributovariacao'),(969,'Can add produto variacao combinacao',277,'add_produtovariacaocombinacao'),(970,'Can change produto variacao combinacao',277,'change_produtovariacaocombinacao'),(971,'Can delete produto variacao combinacao',277,'delete_produtovariacaocombinacao'),(972,'Can view produto variacao combinacao',277,'view_produtovariacaocombinacao'),(973,'Can add Conjunto de Operação',208,'add_conjuntooperacao'),(974,'Can change Conjunto de Operação',208,'change_conjuntooperacao'),(975,'Can delete Conjunto de Operação',208,'delete_conjuntooperacao'),(976,'Can view Conjunto de Operação',208,'view_conjuntooperacao'),(977,'Can add Configuração de Produto',206,'add_configuracaoproduto'),(978,'Can change Configuração de Produto',206,'change_configuracaoproduto'),(979,'Can delete Configuração de Produto',206,'delete_configuracaoproduto'),(980,'Can view Configuração de Produto',206,'view_configuracaoproduto'),(981,'Can add Lote de Produto',251,'add_loteproduto'),(982,'Can change Lote de Produto',251,'change_loteproduto'),(983,'Can delete Lote de Produto',251,'delete_loteproduto'),(984,'Can view Lote de Produto',251,'view_loteproduto'),(985,'Can add controle caixa',214,'add_controlecaixa'),(986,'Can change controle caixa',214,'change_controlecaixa'),(987,'Can delete controle caixa',214,'delete_controlecaixa'),(988,'Can view controle caixa',214,'view_controlecaixa'),(989,'Can add movimentacao caixa',257,'add_movimentacaocaixa'),(990,'Can change movimentacao caixa',257,'change_movimentacaocaixa'),(991,'Can delete movimentacao caixa',257,'delete_movimentacaocaixa'),(992,'Can view movimentacao caixa',257,'view_movimentacaocaixa'),(993,'Can add Atalho de Usuário',307,'add_useratalho'),(994,'Can change Atalho de Usuário',307,'change_useratalho'),(995,'Can delete Atalho de Usuário',307,'delete_useratalho'),(996,'Can view Atalho de Usuário',307,'view_useratalho'),(997,'Can add Configuração WhatsApp',207,'add_configuracaowhatsapp'),(998,'Can change Configuração WhatsApp',207,'change_configuracaowhatsapp'),(999,'Can delete Configuração WhatsApp',207,'delete_configuracaowhatsapp'),(1000,'Can view Configuração WhatsApp',207,'view_configuracaowhatsapp'),(1001,'Can add Mensagem na Fila',237,'add_filawhatsapp'),(1002,'Can change Mensagem na Fila',237,'change_filawhatsapp'),(1003,'Can delete Mensagem na Fila',237,'delete_filawhatsapp'),(1004,'Can view Mensagem na Fila',237,'view_filawhatsapp'),(1005,'Can add Log WhatsApp',250,'add_logwhatsapp'),(1006,'Can change Log WhatsApp',250,'change_logwhatsapp'),(1007,'Can delete Log WhatsApp',250,'delete_logwhatsapp'),(1008,'Can view Log WhatsApp',250,'view_logwhatsapp'),(1009,'Can add Numeração de Operação',262,'add_operacaonumeracao'),(1010,'Can change Numeração de Operação',262,'change_operacaonumeracao'),(1011,'Can delete Numeração de Operação',262,'delete_operacaonumeracao'),(1012,'Can view Numeração de Operação',262,'view_operacaonumeracao'),(1013,'Can add Configuração Bancária',201,'add_configuracaobancaria'),(1014,'Can change Configuração Bancária',201,'change_configuracaobancaria'),(1015,'Can delete Configuração Bancária',201,'delete_configuracaobancaria'),(1016,'Can view Configuração Bancária',201,'view_configuracaobancaria'),(1017,'Can add Boleto Bancário',184,'add_boleto'),(1018,'Can change Boleto Bancário',184,'change_boleto'),(1019,'Can delete Boleto Bancário',184,'delete_boleto'),(1020,'Can view Boleto Bancário',184,'view_boleto'),(1021,'Can add Mapa de Carga',253,'add_mapacarga'),(1022,'Can change Mapa de Carga',253,'change_mapacarga'),(1023,'Can delete Mapa de Carga',253,'delete_mapacarga'),(1024,'Can view Mapa de Carga',253,'view_mapacarga'),(1025,'Can add Item do Mapa de Carga',254,'add_mapacargaitem'),(1026,'Can change Item do Mapa de Carga',254,'change_mapacargaitem'),(1027,'Can delete Item do Mapa de Carga',254,'delete_mapacargaitem'),(1028,'Can view Item do Mapa de Carga',254,'view_mapacargaitem'),(1029,'Can add Numeração',259,'add_numeracao'),(1030,'Can change Numeração',259,'change_numeracao'),(1031,'Can delete Numeração',259,'delete_numeracao'),(1032,'Can view Numeração',259,'view_numeracao'),(1033,'Can add Configuração Split Payment',292,'add_splitpaymentconfig'),(1034,'Can change Configuração Split Payment',292,'change_splitpaymentconfig'),(1035,'Can delete Configuração Split Payment',292,'delete_splitpaymentconfig'),(1036,'Can view Configuração Split Payment',292,'view_splitpaymentconfig'),(1037,'Can add Regra Fiscal Reforma 2026',284,'add_regrafiscalreforma'),(1038,'Can change Regra Fiscal Reforma 2026',284,'change_regrafiscalreforma'),(1039,'Can delete Regra Fiscal Reforma 2026',284,'delete_regrafiscalreforma'),(1040,'Can view Regra Fiscal Reforma 2026',284,'view_regrafiscalreforma'),(1041,'Can add Split Payment de Venda',316,'add_vendasplitpayment'),(1042,'Can change Split Payment de Venda',316,'change_vendasplitpayment'),(1043,'Can delete Split Payment de Venda',316,'delete_vendasplitpayment'),(1044,'Can view Split Payment de Venda',316,'view_vendasplitpayment'),(1045,'Can add Configuração de E-mail',227,'add_emailconfig'),(1046,'Can change Configuração de E-mail',227,'change_emailconfig'),(1047,'Can delete Configuração de E-mail',227,'delete_emailconfig'),(1048,'Can view Configuração de E-mail',227,'view_emailconfig'),(1049,'Can add Template de E-mail',229,'add_emailtemplate'),(1050,'Can change Template de E-mail',229,'change_emailtemplate'),(1051,'Can delete Template de E-mail',229,'delete_emailtemplate'),(1052,'Can view Template de E-mail',229,'view_emailtemplate'),(1053,'Can add Campanha de E-mail',226,'add_emailcampaign'),(1054,'Can change Campanha de E-mail',226,'change_emailcampaign'),(1055,'Can delete Campanha de E-mail',226,'delete_emailcampaign'),(1056,'Can view Campanha de E-mail',226,'view_emailcampaign'),(1057,'Can add Log de E-mail',228,'add_emaillog'),(1058,'Can change Log de E-mail',228,'change_emaillog'),(1059,'Can delete Log de E-mail',228,'delete_emaillog'),(1060,'Can view Log de E-mail',228,'view_emaillog'),(1061,'Can add Veículo Novo',312,'add_veiculonovo'),(1062,'Can change Veículo Novo',312,'change_veiculonovo'),(1063,'Can delete Veículo Novo',312,'delete_veiculonovo'),(1064,'Can view Veículo Novo',312,'view_veiculonovo'),(1065,'Can add Produto Complementar',274,'add_produtocomplementar'),(1066,'Can change Produto Complementar',274,'change_produtocomplementar'),(1067,'Can delete Produto Complementar',274,'delete_produtocomplementar'),(1068,'Can view Produto Complementar',274,'view_produtocomplementar'),(1069,'Can add sugestao cfop',294,'add_sugestaocfop'),(1070,'Can change sugestao cfop',294,'change_sugestaocfop'),(1071,'Can delete sugestao cfop',294,'delete_sugestaocfop'),(1072,'Can view sugestao cfop',294,'view_sugestaocfop'),(1073,'Can add nota fiscal referenciada',258,'add_notafiscalreferenciada'),(1074,'Can change nota fiscal referenciada',258,'change_notafiscalreferenciada'),(1075,'Can delete nota fiscal referenciada',258,'delete_notafiscalreferenciada'),(1076,'Can view nota fiscal referenciada',258,'view_notafiscalreferenciada'),(1077,'Can add conta servico',211,'add_contaservico'),(1078,'Can change conta servico',211,'change_contaservico'),(1079,'Can delete conta servico',211,'delete_contaservico'),(1080,'Can view conta servico',211,'view_contaservico'),(1081,'Can add Configuração de Marketplace',255,'add_marketplaceconfig'),(1082,'Can change Configuração de Marketplace',255,'change_marketplaceconfig'),(1083,'Can delete Configuração de Marketplace',255,'delete_marketplaceconfig'),(1084,'Can view Configuração de Marketplace',255,'view_marketplaceconfig'),(1085,'Can add Produto no Marketplace',256,'add_marketplaceproduto'),(1086,'Can change Produto no Marketplace',256,'change_marketplaceproduto'),(1087,'Can delete Produto no Marketplace',256,'delete_marketplaceproduto'),(1088,'Can view Produto no Marketplace',256,'view_marketplaceproduto'),(1089,'Can add Configuração de Impressão',203,'add_configuracaoimpressao'),(1090,'Can change Configuração de Impressão',203,'change_configuracaoimpressao'),(1091,'Can delete Configuração de Impressão',203,'delete_configuracaoimpressao'),(1092,'Can view Configuração de Impressão',203,'view_configuracaoimpressao'),(1093,'Can add Categoria Mercadológica',189,'add_categoriamercadologica'),(1094,'Can change Categoria Mercadológica',189,'change_categoriamercadologica'),(1095,'Can delete Categoria Mercadológica',189,'delete_categoriamercadologica'),(1096,'Can view Categoria Mercadológica',189,'view_categoriamercadologica'),(1097,'Can add Classificação IA',192,'add_classificacaoia'),(1098,'Can change Classificação IA',192,'change_classificacaoia'),(1099,'Can delete Classificação IA',192,'delete_classificacaoia'),(1100,'Can view Classificação IA',192,'view_classificacaoia'),(1101,'Can add Informação de Produto (API)',247,'add_informacaoprodutoapi'),(1102,'Can change Informação de Produto (API)',247,'change_informacaoprodutoapi'),(1103,'Can delete Informação de Produto (API)',247,'delete_informacaoprodutoapi'),(1104,'Can view Informação de Produto (API)',247,'view_informacaoprodutoapi'),(1105,'Can add Preço Concorrente',272,'add_precoconcorrente'),(1106,'Can change Preço Concorrente',272,'change_precoconcorrente'),(1107,'Can delete Preço Concorrente',272,'delete_precoconcorrente'),(1108,'Can view Preço Concorrente',272,'view_precoconcorrente'),(1109,'Can add manifestacao n fe',252,'add_manifestacaonfe'),(1110,'Can change manifestacao n fe',252,'change_manifestacaonfe'),(1111,'Can delete manifestacao n fe',252,'delete_manifestacaonfe'),(1112,'Can view manifestacao n fe',252,'view_manifestacaonfe'),(1113,'Can add categoria epi',188,'add_categoriaepi'),(1114,'Can change categoria epi',188,'change_categoriaepi'),(1115,'Can delete categoria epi',188,'delete_categoriaepi'),(1116,'Can view categoria epi',188,'view_categoriaepi'),(1117,'Can add Etapa do Pipeline',236,'add_etapapipeline'),(1118,'Can change Etapa do Pipeline',236,'change_etapapipeline'),(1119,'Can delete Etapa do Pipeline',236,'delete_etapapipeline'),(1120,'Can view Etapa do Pipeline',236,'view_etapapipeline'),(1121,'Can add Origem de Lead',265,'add_origemlead'),(1122,'Can change Origem de Lead',265,'change_origemlead'),(1123,'Can delete Origem de Lead',265,'delete_origemlead'),(1124,'Can view Origem de Lead',265,'view_origemlead'),(1125,'Can add Configuração Pix',205,'add_configuracaopix'),(1126,'Can change Configuração Pix',205,'change_configuracaopix'),(1127,'Can delete Configuração Pix',205,'delete_configuracaopix'),(1128,'Can view Configuração Pix',205,'view_configuracaopix'),(1129,'Can add Cobrança Pix',195,'add_cobrancapix'),(1130,'Can change Cobrança Pix',195,'change_cobrancapix'),(1131,'Can delete Cobrança Pix',195,'delete_cobrancapix'),(1132,'Can view Cobrança Pix',195,'view_cobrancapix'),(1133,'Can add Contrato de Recorrência',213,'add_contratorecorrencia'),(1134,'Can change Contrato de Recorrência',213,'change_contratorecorrencia'),(1135,'Can delete Contrato de Recorrência',213,'delete_contratorecorrencia'),(1136,'Can view Contrato de Recorrência',213,'view_contratorecorrencia'),(1137,'Can add EPI',232,'add_epi'),(1138,'Can change EPI',232,'change_epi'),(1139,'Can delete EPI',232,'delete_epi'),(1140,'Can view EPI',232,'view_epi'),(1141,'Can add Funcionário',243,'add_funcionario'),(1142,'Can change Funcionário',243,'change_funcionario'),(1143,'Can delete Funcionário',243,'delete_funcionario'),(1144,'Can view Funcionário',243,'view_funcionario'),(1145,'Can add Entrega de EPI',231,'add_entregaepi'),(1146,'Can change Entrega de EPI',231,'change_entregaepi'),(1147,'Can delete Entrega de EPI',231,'delete_entregaepi'),(1148,'Can view Entrega de EPI',231,'view_entregaepi'),(1149,'Can add Holerite',246,'add_holerite'),(1150,'Can change Holerite',246,'change_holerite'),(1151,'Can delete Holerite',246,'delete_holerite'),(1152,'Can view Holerite',246,'view_holerite'),(1153,'Can add Lead',248,'add_lead'),(1154,'Can change Lead',248,'change_lead'),(1155,'Can delete Lead',248,'delete_lead'),(1156,'Can view Lead',248,'view_lead'),(1157,'Can add Atividade de Lead',181,'add_atividadelead'),(1158,'Can change Atividade de Lead',181,'change_atividadelead'),(1159,'Can delete Atividade de Lead',181,'delete_atividadelead'),(1160,'Can view Atividade de Lead',181,'view_atividadelead'),(1161,'Can add Parcela de Recorrência',270,'add_parcelarecorrencia'),(1162,'Can change Parcela de Recorrência',270,'change_parcelarecorrencia'),(1163,'Can delete Parcela de Recorrência',270,'delete_parcelarecorrencia'),(1164,'Can view Parcela de Recorrência',270,'view_parcelarecorrencia'),(1165,'Can add Registro de Ponto',282,'add_registroponto'),(1166,'Can change Registro de Ponto',282,'change_registroponto'),(1167,'Can delete Registro de Ponto',282,'delete_registroponto'),(1168,'Can view Registro de Ponto',282,'view_registroponto'),(1169,'Can add webhook pix log',320,'add_webhookpixlog'),(1170,'Can change webhook pix log',320,'change_webhookpixlog'),(1171,'Can delete webhook pix log',320,'delete_webhookpixlog'),(1172,'Can view webhook pix log',320,'view_webhookpixlog'),(1173,'Can add Ocorrência',260,'add_ocorrenciafuncionario'),(1174,'Can change Ocorrência',260,'change_ocorrenciafuncionario'),(1175,'Can delete Ocorrência',260,'delete_ocorrenciafuncionario'),(1176,'Can view Ocorrência',260,'view_ocorrenciafuncionario'),(1177,'Can add Composição do Produto',197,'add_composicaoproduto'),(1178,'Can change Composição do Produto',197,'change_composicaoproduto'),(1179,'Can delete Composição do Produto',197,'delete_composicaoproduto'),(1180,'Can view Composição do Produto',197,'view_composicaoproduto'),(1181,'Can add Ordem de Produção',263,'add_ordemproducao'),(1182,'Can change Ordem de Produção',263,'change_ordemproducao'),(1183,'Can delete Ordem de Produção',263,'delete_ordemproducao'),(1184,'Can view Ordem de Produção',263,'view_ordemproducao'),(1185,'Can add Recebimento de Cartão',281,'add_recebimentocartao'),(1186,'Can change Recebimento de Cartão',281,'change_recebimentocartao'),(1187,'Can delete Recebimento de Cartão',281,'delete_recebimentocartao'),(1188,'Can view Recebimento de Cartão',281,'view_recebimentocartao'),(1189,'Can add Regra Fiscal ICMS',283,'add_regrafiscal'),(1190,'Can change Regra Fiscal ICMS',283,'change_regrafiscal'),(1191,'Can delete Regra Fiscal ICMS',283,'delete_regrafiscal'),(1192,'Can view Regra Fiscal ICMS',283,'view_regrafiscal'),(1193,'Can add Tipo de Tributação ICMS',300,'add_tipotributacao'),(1194,'Can change Tipo de Tributação ICMS',300,'change_tipotributacao'),(1195,'Can delete Tipo de Tributação ICMS',300,'delete_tipotributacao'),(1196,'Can view Tipo de Tributação ICMS',300,'view_tipotributacao'),(1197,'Can add Alíquota por UF',303,'add_tributacaouf'),(1198,'Can change Alíquota por UF',303,'change_tributacaouf'),(1199,'Can delete Alíquota por UF',303,'delete_tributacaouf'),(1200,'Can view Alíquota por UF',303,'view_tributacaouf'),(1201,'Can add Produto Similar',275,'add_produtosimilar'),(1202,'Can change Produto Similar',275,'change_produtosimilar'),(1203,'Can delete Produto Similar',275,'delete_produtosimilar'),(1204,'Can view Produto Similar',275,'view_produtosimilar'),(1205,'Can add os foto',267,'add_osfoto'),(1206,'Can change os foto',267,'change_osfoto'),(1207,'Can delete os foto',267,'delete_osfoto'),(1208,'Can view os foto',267,'view_osfoto'),(1209,'Can add os assinatura',266,'add_osassinatura'),(1210,'Can change os assinatura',266,'change_osassinatura'),(1211,'Can delete os assinatura',266,'delete_osassinatura'),(1212,'Can view os assinatura',266,'view_osassinatura'),(1213,'Can add venda entrega log',314,'add_vendaentregalog'),(1214,'Can change venda entrega log',314,'change_vendaentregalog'),(1215,'Can delete venda entrega log',314,'delete_vendaentregalog'),(1216,'Can view venda entrega log',314,'view_vendaentregalog'),(1217,'Can add Configuração Mercado Pago',204,'add_configuracaomercadopago'),(1218,'Can change Configuração Mercado Pago',204,'change_configuracaomercadopago'),(1219,'Can delete Configuração Mercado Pago',204,'delete_configuracaomercadopago'),(1220,'Can view Configuração Mercado Pago',204,'view_configuracaomercadopago'),(1221,'Can add Transação MP Point',301,'add_transacaomppoint'),(1222,'Can change Transação MP Point',301,'change_transacaomppoint'),(1223,'Can delete Transação MP Point',301,'delete_transacaomppoint'),(1224,'Can view Transação MP Point',301,'view_transacaomppoint'),(1225,'Can add cliente grupo excecao',194,'add_clientegrupoexcecao'),(1226,'Can change cliente grupo excecao',194,'change_clientegrupoexcecao'),(1227,'Can delete cliente grupo excecao',194,'delete_clientegrupoexcecao'),(1228,'Can view cliente grupo excecao',194,'view_clientegrupoexcecao'),(1229,'Can add Quarto',280,'add_quarto'),(1230,'Can change Quarto',280,'change_quarto'),(1231,'Can delete Quarto',280,'delete_quarto'),(1232,'Can view Quarto',280,'view_quarto'),(1233,'Can add Tipo de Quarto',298,'add_tipoquarto'),(1234,'Can change Tipo de Quarto',298,'change_tipoquarto'),(1235,'Can delete Tipo de Quarto',298,'delete_tipoquarto'),(1236,'Can view Tipo de Quarto',298,'view_tipoquarto'),(1237,'Can add Reserva',285,'add_reserva'),(1238,'Can change Reserva',285,'change_reserva'),(1239,'Can delete Reserva',285,'delete_reserva'),(1240,'Can view Reserva',285,'view_reserva'),(1241,'Can add Consumo de Quarto',209,'add_consumoquarto'),(1242,'Can change Consumo de Quarto',209,'change_consumoquarto'),(1243,'Can delete Consumo de Quarto',209,'delete_consumoquarto'),(1244,'Can view Consumo de Quarto',209,'view_consumoquarto'),(1245,'Can add Comodidade',196,'add_comodidade'),(1246,'Can change Comodidade',196,'change_comodidade'),(1247,'Can delete Comodidade',196,'delete_comodidade'),(1248,'Can view Comodidade',196,'view_comodidade'),(1249,'Can add TTS Audio Cache',306,'add_ttsaudiocache'),(1250,'Can change TTS Audio Cache',306,'change_ttsaudiocache'),(1251,'Can delete TTS Audio Cache',306,'delete_ttsaudiocache'),(1252,'Can view TTS Audio Cache',306,'view_ttsaudiocache'),(1253,'Can add SaaS Cliente',286,'add_saascliente'),(1254,'Can change SaaS Cliente',286,'change_saascliente'),(1255,'Can delete SaaS Cliente',286,'delete_saascliente'),(1256,'Can view SaaS Cliente',286,'view_saascliente'),(1257,'Can add SaaS Contrato',287,'add_saasclientecontrato'),(1258,'Can change SaaS Contrato',287,'change_saasclientecontrato'),(1259,'Can delete SaaS Contrato',287,'delete_saasclientecontrato'),(1260,'Can view SaaS Contrato',287,'view_saasclientecontrato'),(1261,'Can add SaaS Mensalidade',288,'add_saasclientemensalidade'),(1262,'Can change SaaS Mensalidade',288,'change_saasclientemensalidade'),(1263,'Can delete SaaS Mensalidade',288,'delete_saasclientemensalidade'),(1264,'Can view SaaS Mensalidade',288,'view_saasclientemensalidade'),(1265,'Can add Versão do Sistema',319,'add_versaosistema'),(1266,'Can change Versão do Sistema',319,'change_versaosistema'),(1267,'Can delete Versão do Sistema',319,'delete_versaosistema'),(1268,'Can view Versão do Sistema',319,'view_versaosistema'),(1269,'Can add Histórico de Atualização',245,'add_historicoatualizacao'),(1270,'Can change Histórico de Atualização',245,'change_historicoatualizacao'),(1271,'Can delete Histórico de Atualização',245,'delete_historicoatualizacao'),(1272,'Can view Histórico de Atualização',245,'view_historicoatualizacao'),(1273,'Can add Configuração de Agendamento',200,'add_configuracaoagendamento'),(1274,'Can change Configuração de Agendamento',200,'change_configuracaoagendamento'),(1275,'Can delete Configuração de Agendamento',200,'delete_configuracaoagendamento'),(1276,'Can view Configuração de Agendamento',200,'view_configuracaoagendamento'),(1277,'Can add SaaS Template Contrato',297,'add_templatecontrato'),(1278,'Can change SaaS Template Contrato',297,'change_templatecontrato'),(1279,'Can delete SaaS Template Contrato',297,'delete_templatecontrato'),(1280,'Can view SaaS Template Contrato',297,'view_templatecontrato'),(1281,'Can add Mesa',323,'add_mesa'),(1282,'Can change Mesa',323,'change_mesa'),(1283,'Can delete Mesa',323,'delete_mesa'),(1284,'Can view Mesa',323,'view_mesa'),(1285,'Can add Comanda',321,'add_comanda'),(1286,'Can change Comanda',321,'change_comanda'),(1287,'Can delete Comanda',321,'delete_comanda'),(1288,'Can view Comanda',321,'view_comanda'),(1289,'Can add Item da Comanda',322,'add_itemcomanda'),(1290,'Can change Item da Comanda',322,'change_itemcomanda'),(1291,'Can delete Item da Comanda',322,'delete_itemcomanda'),(1292,'Can view Item da Comanda',322,'view_itemcomanda'),(1293,'Can add TransferÃªncia de Mesa',325,'add_transferenciamesa'),(1294,'Can change TransferÃªncia de Mesa',325,'change_transferenciamesa'),(1295,'Can delete TransferÃªncia de Mesa',325,'delete_transferenciamesa'),(1296,'Can view TransferÃªncia de Mesa',325,'view_transferenciamesa'),(1297,'Can add Pagamento da Comanda',324,'add_pagamentocomanda'),(1298,'Can change Pagamento da Comanda',324,'change_pagamentocomanda'),(1299,'Can delete Pagamento da Comanda',324,'delete_pagamentocomanda'),(1300,'Can view Pagamento da Comanda',324,'view_pagamentocomanda'),(1301,'Can add Layout de Etiqueta',327,'add_layoutetiqueta'),(1302,'Can change Layout de Etiqueta',327,'change_layoutetiqueta'),(1303,'Can delete Layout de Etiqueta',327,'delete_layoutetiqueta'),(1304,'Can view Layout de Etiqueta',327,'view_layoutetiqueta'),(1305,'Can add Impressão de Etiqueta',326,'add_impressaoetiqueta'),(1306,'Can change Impressão de Etiqueta',326,'change_impressaoetiqueta'),(1307,'Can delete Impressão de Etiqueta',326,'delete_impressaoetiqueta'),(1308,'Can view Impressão de Etiqueta',326,'view_impressaoetiqueta'),(1309,'Can add Escritório de Contabilidade',329,'add_escritoriocontabilidade'),(1310,'Can change Escritório de Contabilidade',329,'change_escritoriocontabilidade'),(1311,'Can delete Escritório de Contabilidade',329,'delete_escritoriocontabilidade'),(1312,'Can view Escritório de Contabilidade',329,'view_escritoriocontabilidade'),(1313,'Can add Cliente',328,'add_cliente'),(1314,'Can change Cliente',328,'change_cliente'),(1315,'Can delete Cliente',328,'delete_cliente'),(1316,'Can view Cliente',328,'view_cliente'),(1317,'Can add conhecimento transporte',330,'add_conhecimentotransporte'),(1318,'Can change conhecimento transporte',330,'change_conhecimentotransporte'),(1319,'Can delete conhecimento transporte',330,'delete_conhecimentotransporte'),(1320,'Can view conhecimento transporte',330,'view_conhecimentotransporte'),(1321,'Can add c te componente valor',331,'add_ctecomponentevalor'),(1322,'Can change c te componente valor',331,'change_ctecomponentevalor'),(1323,'Can delete c te componente valor',331,'delete_ctecomponentevalor'),(1324,'Can view c te componente valor',331,'view_ctecomponentevalor'),(1325,'Can add c te documento originario',333,'add_ctedocumentooriginario'),(1326,'Can change c te documento originario',333,'change_ctedocumentooriginario'),(1327,'Can delete c te documento originario',333,'delete_ctedocumentooriginario'),(1328,'Can view c te documento originario',333,'view_ctedocumentooriginario'),(1329,'Can add c te documento',332,'add_ctedocumento'),(1330,'Can change c te documento',332,'change_ctedocumento'),(1331,'Can delete c te documento',332,'delete_ctedocumento'),(1332,'Can view c te documento',332,'view_ctedocumento'),(1333,'Can add MDF-e',334,'add_manifestoeletronico'),(1334,'Can change MDF-e',334,'change_manifestoeletronico'),(1335,'Can delete MDF-e',334,'delete_manifestoeletronico'),(1336,'Can view MDF-e',334,'view_manifestoeletronico'),(1337,'Can add Carregamento',335,'add_mdfecarregamento'),(1338,'Can change Carregamento',335,'change_mdfecarregamento'),(1339,'Can delete Carregamento',335,'delete_mdfecarregamento'),(1340,'Can view Carregamento',335,'view_mdfecarregamento'),(1341,'Can add Condutor Adicional',336,'add_mdfecondutor'),(1342,'Can change Condutor Adicional',336,'change_mdfecondutor'),(1343,'Can delete Condutor Adicional',336,'delete_mdfecondutor'),(1344,'Can view Condutor Adicional',336,'view_mdfecondutor'),(1345,'Can add Descarregamento',337,'add_mdfedescarregamento'),(1346,'Can change Descarregamento',337,'change_mdfedescarregamento'),(1347,'Can delete Descarregamento',337,'delete_mdfedescarregamento'),(1348,'Can view Descarregamento',337,'view_mdfedescarregamento'),(1349,'Can add Documento Vinculado',338,'add_mdfedocumentovinculado'),(1350,'Can change Documento Vinculado',338,'change_mdfedocumentovinculado'),(1351,'Can delete Documento Vinculado',338,'delete_mdfedocumentovinculado'),(1352,'Can view Documento Vinculado',338,'view_mdfedocumentovinculado'),(1353,'Can add Lacre',339,'add_mdfelacre'),(1354,'Can change Lacre',339,'change_mdfelacre'),(1355,'Can delete Lacre',339,'delete_mdfelacre'),(1356,'Can view Lacre',339,'view_mdfelacre'),(1357,'Can add Percurso',341,'add_mdfepercurso'),(1358,'Can change Percurso',341,'change_mdfepercurso'),(1359,'Can delete Percurso',341,'delete_mdfepercurso'),(1360,'Can view Percurso',341,'view_mdfepercurso'),(1361,'Can add Reboque',342,'add_mdfereboque'),(1362,'Can change Reboque',342,'change_mdfereboque'),(1363,'Can delete Reboque',342,'delete_mdfereboque'),(1364,'Can view Reboque',342,'view_mdfereboque'),(1365,'Can add Pagamento',340,'add_mdfepagamento'),(1366,'Can change Pagamento',340,'change_mdfepagamento'),(1367,'Can delete Pagamento',340,'delete_mdfepagamento'),(1368,'Can view Pagamento',340,'view_mdfepagamento'),(1369,'Can add Vale Pedágio',343,'add_mdfevalepedagio'),(1370,'Can change Vale Pedágio',343,'change_mdfevalepedagio'),(1371,'Can delete Vale Pedágio',343,'delete_mdfevalepedagio'),(1372,'Can view Vale Pedágio',343,'view_mdfevalepedagio'),(1373,'Can add cors model',344,'add_corsmodel'),(1374,'Can change cors model',344,'change_corsmodel'),(1375,'Can delete cors model',344,'delete_corsmodel'),(1376,'Can view cors model',344,'view_corsmodel'),(1377,'Can add Contrato Padrão',345,'add_contratopadrao'),(1378,'Can change Contrato Padrão',345,'change_contratopadrao'),(1379,'Can delete Contrato Padrão',345,'delete_contratopadrao'),(1380,'Can view Contrato Padrão',345,'view_contratopadrao'),(1381,'Can add Comunicado SaaS',346,'add_comunicadosaas'),(1382,'Can change Comunicado SaaS',346,'change_comunicadosaas'),(1383,'Can delete Comunicado SaaS',346,'delete_comunicadosaas'),(1384,'Can view Comunicado SaaS',346,'view_comunicadosaas'),(1385,'Can add Licença',347,'add_licenca'),(1386,'Can change Licença',347,'change_licenca'),(1387,'Can delete Licença',347,'delete_licenca'),(1388,'Can view Licença',347,'view_licenca'),(1389,'Can add Gabarito Customizado',348,'add_gabaritocustomizado'),(1390,'Can change Gabarito Customizado',348,'change_gabaritocustomizado'),(1391,'Can delete Gabarito Customizado',348,'delete_gabaritocustomizado'),(1392,'Can view Gabarito Customizado',348,'view_gabaritocustomizado'),(1393,'Can add Link Cadastro Remoto',349,'add_linkcadastroremoto'),(1394,'Can change Link Cadastro Remoto',349,'change_linkcadastroremoto'),(1395,'Can delete Link Cadastro Remoto',349,'delete_linkcadastroremoto'),(1396,'Can view Link Cadastro Remoto',349,'view_linkcadastroremoto'),(1397,'Can add Plano SaaS',350,'add_planosaas'),(1398,'Can change Plano SaaS',350,'change_planosaas'),(1399,'Can delete Plano SaaS',350,'delete_planosaas'),(1400,'Can view Plano SaaS',350,'view_planosaas'),(1401,'Can add Terminal Ativo',351,'add_terminalativo'),(1402,'Can change Terminal Ativo',351,'change_terminalativo'),(1403,'Can delete Terminal Ativo',351,'delete_terminalativo'),(1404,'Can view Terminal Ativo',351,'view_terminalativo');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
INSERT INTO `auth_user` VALUES (3,'pbkdf2_sha256$600000$XIfINmX5GDqos0JQj5gnJU$JAz5XzyCZ6K9bQhhnmw1h/M4Yir8/l8tdsqjCAVbSHA=',NULL,1,'ADMIN','','','',1,1,'2026-05-29 19:23:35.549324'),(4,'',NULL,0,'sistema_baixa_automatica','Sistema','Baixa Automática','',0,1,'2026-06-22 19:14:15.481709');
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_groups`
--

LOCK TABLES `auth_user_groups` WRITE;
/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_user_permissions`
--

LOCK TABLES `auth_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `boleto_configuracoes`
--

DROP TABLE IF EXISTS `boleto_configuracoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `boleto_configuracoes` (
  `id_config` int NOT NULL AUTO_INCREMENT,
  `banco` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ambiente` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_secret` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `agencia` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conta` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `convenio` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `carteira` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nosso_numero_atual` int NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  PRIMARY KEY (`id_config`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boleto_configuracoes`
--

LOCK TABLES `boleto_configuracoes` WRITE;
/*!40000 ALTER TABLE `boleto_configuracoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `boleto_configuracoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `boletos`
--

DROP TABLE IF EXISTS `boletos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `boletos` (
  `id_boleto` int NOT NULL AUTO_INCREMENT,
  `nosso_numero` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_documento` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo_barras` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linha_digitavel` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagador_nome` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pagador_cpf_cnpj` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pagador_endereco` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagador_cidade` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagador_uf` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagador_cep` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagador_codigo_ibge` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor_nominal` decimal(15,2) NOT NULL,
  `valor_multa` decimal(15,2) NOT NULL,
  `valor_juros` decimal(15,2) NOT NULL,
  `valor_desconto` decimal(15,2) NOT NULL,
  `valor_pago` decimal(15,2) DEFAULT NULL,
  `data_emissao` date NOT NULL,
  `data_vencimento` date NOT NULL,
  `data_pagamento` date DEFAULT NULL,
  `data_registro_banco` datetime(6) DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_boleto` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `baixado_via_api` tinyint(1) NOT NULL,
  `data_baixa_api` datetime(6) DEFAULT NULL,
  `pix_qr_code` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `pix_emv` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `pix_txid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mensagem_banco` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `dados_retorno_json` json DEFAULT NULL,
  `usuario_baixa_id` int DEFAULT NULL,
  `id_config_bancaria_id` int NOT NULL,
  `id_conta_id` int NOT NULL,
  `codigo_ibge_cidade` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_conta_bancaria` int DEFAULT NULL,
  `id_config` int DEFAULT NULL,
  `id_conta` int DEFAULT NULL,
  `resposta_banco` json DEFAULT NULL,
  `id_cliente` int DEFAULT NULL,
  `qrcode_pix` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `criado_em` datetime(6) NOT NULL,
  `url_boleto_pdf` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `baixa_via_api` tinyint(1) NOT NULL,
  `baixa_realizada_em` datetime(6) DEFAULT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `id_empresa` int DEFAULT NULL,
  PRIMARY KEY (`id_boleto`),
  UNIQUE KEY `nosso_numero` (`nosso_numero`),
  KEY `boletos_usuario_baixa_id_c702a4d6_fk_auth_user_id` (`usuario_baixa_id`),
  KEY `boletos_id_config_bancaria_i_30db3560_fk_configura` (`id_config_bancaria_id`),
  KEY `boletos_id_conta_id_99195374_fk_financeiro_contas_id_conta` (`id_conta_id`),
  KEY `fk_boletos_empresa` (`id_empresa`),
  CONSTRAINT `boletos_id_config_bancaria_i_30db3560_fk_configura` FOREIGN KEY (`id_config_bancaria_id`) REFERENCES `configuracoes_bancarias` (`id_config`),
  CONSTRAINT `boletos_id_conta_id_99195374_fk_financeiro_contas_id_conta` FOREIGN KEY (`id_conta_id`) REFERENCES `financeiro_contas` (`id_conta`),
  CONSTRAINT `boletos_usuario_baixa_id_c702a4d6_fk_auth_user_id` FOREIGN KEY (`usuario_baixa_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `fk_boletos_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa_config` (`id_empresa`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boletos`
--

LOCK TABLES `boletos` WRITE;
/*!40000 ALTER TABLE `boletos` DISABLE KEYS */;
/*!40000 ALTER TABLE `boletos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carta_correcao_nfe`
--

DROP TABLE IF EXISTS `carta_correcao_nfe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carta_correcao_nfe` (
  `id_carta_correcao` int NOT NULL AUTO_INCREMENT,
  `numero_sequencial` int NOT NULL,
  `texto_correcao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_envio` datetime(6) NOT NULL,
  `protocolo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `xml_evento` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensagem_retorno` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_venda` int NOT NULL,
  `usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`id_carta_correcao`),
  UNIQUE KEY `carta_correcao_nfe_id_venda_numero_sequencial_98066ad5_uniq` (`id_venda`,`numero_sequencial`),
  KEY `carta_correcao_nfe_usuario_id_55a0dab6_fk_auth_user_id` (`usuario_id`),
  CONSTRAINT `carta_correcao_nfe_id_venda_500b5f5e_fk_vendas_id_venda` FOREIGN KEY (`id_venda`) REFERENCES `vendas` (`id_venda`),
  CONSTRAINT `carta_correcao_nfe_usuario_id_55a0dab6_fk_auth_user_id` FOREIGN KEY (`usuario_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carta_correcao_nfe`
--

LOCK TABLES `carta_correcao_nfe` WRITE;
/*!40000 ALTER TABLE `carta_correcao_nfe` DISABLE KEYS */;
/*!40000 ALTER TABLE `carta_correcao_nfe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cashbacks`
--

DROP TABLE IF EXISTS `cashbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cashbacks` (
  `id_cashback` int NOT NULL AUTO_INCREMENT,
  `valor_gerado` decimal(12,2) NOT NULL,
  `valor_utilizado` decimal(12,2) NOT NULL,
  `saldo` decimal(12,2) NOT NULL,
  `data_geracao` datetime(6) NOT NULL,
  `data_validade` datetime(6) NOT NULL,
  `data_utilizacao` datetime(6) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL,
  `percentual_origem` decimal(5,2) DEFAULT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_cliente` int NOT NULL,
  `id_venda_origem` int DEFAULT NULL,
  `id_venda_utilizado` int DEFAULT NULL,
  PRIMARY KEY (`id_cashback`),
  KEY `cashbacks_id_venda_origem_c9965efe_fk_vendas_id_venda` (`id_venda_origem`),
  KEY `cashbacks_id_venda_utilizado_3628bb15_fk_vendas_id_venda` (`id_venda_utilizado`),
  KEY `cashbacks_id_clie_0f36d4_idx` (`id_cliente`,`ativo`),
  KEY `cashbacks_data_va_61ebf0_idx` (`data_validade`),
  CONSTRAINT `cashbacks_id_cliente_b12a1335_fk_clientes_id_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `cashbacks_id_venda_origem_c9965efe_fk_vendas_id_venda` FOREIGN KEY (`id_venda_origem`) REFERENCES `vendas` (`id_venda`),
  CONSTRAINT `cashbacks_id_venda_utilizado_3628bb15_fk_vendas_id_venda` FOREIGN KEY (`id_venda_utilizado`) REFERENCES `vendas` (`id_venda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cashbacks`
--

LOCK TABLES `cashbacks` WRITE;
/*!40000 ALTER TABLE `cashbacks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cashbacks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias_mercadologicas`
--

DROP TABLE IF EXISTS `categorias_mercadologicas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_mercadologicas` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nivel` int NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `ordem` int NOT NULL,
  `keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `pai_id` int DEFAULT NULL,
  PRIMARY KEY (`id_categoria`),
  KEY `categorias__nivel_58b301_idx` (`nivel`,`ativo`),
  KEY `categorias__pai_id_f8077b_idx` (`pai_id`,`nivel`),
  CONSTRAINT `categorias_mercadolo_pai_id_6c5456b0_fk_categoria` FOREIGN KEY (`pai_id`) REFERENCES `categorias_mercadologicas` (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias_mercadologicas`
--

LOCK TABLES `categorias_mercadologicas` WRITE;
/*!40000 ALTER TABLE `categorias_mercadologicas` DISABLE KEYS */;
/*!40000 ALTER TABLE `categorias_mercadologicas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `centro_custo`
--

DROP TABLE IF EXISTS `centro_custo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `centro_custo` (
  `id_centro_custo` int NOT NULL AUTO_INCREMENT,
  `nome_centro_custo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_centro_custo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `centro_custo`
--

LOCK TABLES `centro_custo` WRITE;
/*!40000 ALTER TABLE `centro_custo` DISABLE KEYS */;
/*!40000 ALTER TABLE `centro_custo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cheques`
--

DROP TABLE IF EXISTS `cheques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cheques` (
  `id_cheque` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'receber' COMMENT 'receber ou pagar',
  `numero_cheque` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `banco` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `agencia` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `conta` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `emitente` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nome de quem emitiu o cheque',
  `cpf_cnpj_emitente` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor` decimal(10,2) NOT NULL,
  `data_emissao` date NOT NULL,
  `data_vencimento` date NOT NULL COMMENT 'Data do bom para',
  `data_deposito` date DEFAULT NULL,
  `data_compensacao` date DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'custodia' COMMENT 'custodia, depositado, compensado, devolvido, repassado, cancelado',
  `id_cliente` int DEFAULT NULL,
  `id_fornecedor` int DEFAULT NULL,
  `id_conta_bancaria` int DEFAULT NULL COMMENT 'Conta onde ser├í depositado',
  `id_venda` int DEFAULT NULL,
  `id_compra` int DEFAULT NULL,
  `observacoes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `imagem_cheque` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL da foto do cheque',
  `data_cadastro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `usuario_cadastro_id` int DEFAULT NULL,
  PRIMARY KEY (`id_cheque`),
  KEY `idx_status_vencimento` (`status`,`data_vencimento`),
  KEY `idx_tipo_status` (`tipo`,`status`),
  KEY `idx_cliente` (`id_cliente`),
  KEY `idx_fornecedor` (`id_fornecedor`),
  KEY `idx_conta_bancaria` (`id_conta_bancaria`),
  KEY `idx_data_vencimento` (`data_vencimento`),
  KEY `fk_cheque_venda` (`id_venda`),
  KEY `fk_cheque_compra` (`id_compra`),
  KEY `fk_cheque_usuario` (`usuario_cadastro_id`),
  CONSTRAINT `fk_cheque_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE SET NULL,
  CONSTRAINT `fk_cheque_compra` FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id_compra`) ON DELETE SET NULL,
  CONSTRAINT `fk_cheque_conta_bancaria` FOREIGN KEY (`id_conta_bancaria`) REFERENCES `contas_bancarias` (`id_conta_bancaria`) ON DELETE SET NULL,
  CONSTRAINT `fk_cheque_fornecedor` FOREIGN KEY (`id_fornecedor`) REFERENCES `fornecedores` (`id_fornecedor`) ON DELETE SET NULL,
  CONSTRAINT `fk_cheque_usuario` FOREIGN KEY (`usuario_cadastro_id`) REFERENCES `auth_user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cheque_venda` FOREIGN KEY (`id_venda`) REFERENCES `vendas` (`id_venda`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Controle de Cheques - A Receber e A Pagar';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cheques`
--

LOCK TABLES `cheques` WRITE;
/*!40000 ALTER TABLE `cheques` DISABLE KEYS */;
/*!40000 ALTER TABLE `cheques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classificacoes_ia`
--

DROP TABLE IF EXISTS `classificacoes_ia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classificacoes_ia` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `confianca` decimal(3,2) NOT NULL,
  `aceita` tinyint(1) DEFAULT NULL,
  `data_classificacao` datetime(6) NOT NULL,
  `texto_analisado` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo_ia` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria_escolhida_usuario_id` int DEFAULT NULL,
  `categoria_sugerida_id` int DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `produto_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `classificacoes_ia_categoria_escolhida__8705431c_fk_categoria` (`categoria_escolhida_usuario_id`),
  KEY `classificacoes_ia_categoria_sugerida_i_0b52d0df_fk_categoria` (`categoria_sugerida_id`),
  KEY `classificacoes_ia_usuario_id_701aa47c_fk_auth_user_id` (`usuario_id`),
  KEY `classificacoes_ia_produto_id_1102f953_fk_produtos_id_produto` (`produto_id`),
  CONSTRAINT `classificacoes_ia_categoria_escolhida__8705431c_fk_categoria` FOREIGN KEY (`categoria_escolhida_usuario_id`) REFERENCES `categorias_mercadologicas` (`id_categoria`),
  CONSTRAINT `classificacoes_ia_categoria_sugerida_i_0b52d0df_fk_categoria` FOREIGN KEY (`categoria_sugerida_id`) REFERENCES `categorias_mercadologicas` (`id_categoria`),
  CONSTRAINT `classificacoes_ia_produto_id_1102f953_fk_produtos_id_produto` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id_produto`),
  CONSTRAINT `classificacoes_ia_usuario_id_701aa47c_fk_auth_user_id` FOREIGN KEY (`usuario_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classificacoes_ia`
--

LOCK TABLES `classificacoes_ia` WRITE;
/*!40000 ALTER TABLE `classificacoes_ia` DISABLE KEYS */;
/*!40000 ALTER TABLE `classificacoes_ia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente`
--

DROP TABLE IF EXISTS `cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `razao_social` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome_fantasia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cnpj` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inscricao_estadual` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endereco` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `complemento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bairro` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cidade` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cep` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `proprietario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `cpf` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefone` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `regime_tributario` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `escritorio_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cnpj` (`cnpj`),
  KEY `cliente_escritorio_id_e8925754_fk_escritorio_contabilidade_id` (`escritorio_id`),
  KEY `cliente_cnpj_87b524_idx` (`cnpj`),
  KEY `cliente_razao_s_0f2c51_idx` (`razao_social`),
  KEY `cliente_regime__3050a0_idx` (`regime_tributario`),
  CONSTRAINT `cliente_escritorio_id_e8925754_fk_escritorio_contabilidade_id` FOREIGN KEY (`escritorio_id`) REFERENCES `escritorio_contabilidade` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente`
--

LOCK TABLES `cliente` WRITE;
/*!40000 ALTER TABLE `cliente` DISABLE KEYS */;
/*!40000 ALTER TABLE `cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id_cliente` int NOT NULL AUTO_INCREMENT,
  `nome_razao_social` varchar(255) NOT NULL,
  `nome_fantasia` varchar(255) DEFAULT NULL,
  `cpf_cnpj` varchar(18) NOT NULL,
  `inscricao_estadual` varchar(20) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `numero` varchar(20) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `limite_credito` decimal(10,2) DEFAULT '0.00',
  `logo_url` varchar(500) DEFAULT NULL,
  `data_cadastro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_nascimento` date DEFAULT NULL COMMENT 'Data de nascimento do cliente para envio de mensagens de anivers├írio',
  `whatsapp` varchar(20) DEFAULT NULL COMMENT 'N├║mero de WhatsApp do cliente',
  `codigo_municipio_ibge` varchar(7) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `data_inativacao` datetime DEFAULT NULL,
  `motivo_inativacao` text,
  `sexo` varchar(1) DEFAULT NULL,
  `priorizar_desconto_cliente` tinyint(1) NOT NULL,
  `percentual_arredondamento` decimal(5,2) DEFAULT NULL,
  `tipo_desconto` varchar(10) DEFAULT NULL,
  `valor_desconto` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `cpf_cnpj_UNIQUE` (`cpf_cnpj`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (20,'AMERPUS INFORMATICA LTDA','AMERPUS INFORMATICA LTDA','16501387000108',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AMERPUS INFORMATICA','19965050031',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(21,'TESTE','TESTE','00000000002',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'TESTE','0019965050032',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(22,'AGROPECUARIA PARANA LTDA - ME','AGROPECUARIA PARANA LTDA - ME','10894393000188',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AGROPECUARIA PARANA','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(23,'CONSUMIDOR','CONSUMIDOR','00000000000',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'CONSUMIDOR','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(24,'TESTE DE CLIENTE','TESTE DE CLIENTE','35599782034',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'CLIENTE','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(25,'LEIDLAINE DE LOURDES PEREIRA','LEIDLAINE DE LOURDES PEREIRA','33735667000191',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ARTE FER FERRAGISTA','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(26,'SORVETERIA NEVES & SANTOS LTDA ME','SORVETERIA NEVES & SANTOS LTDA ME','26659226000192',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ATACADAO DE SORVETES','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(27,'ISABELA BASTOS SAHIUM','ISABELA BASTOS SAHIUM','05980449655',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'POEMA SEMI JOIAS II','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(28,'ALLAN AKIO SAKAGUTI','ALLAN AKIO SAKAGUTI','26577711000117',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ALIANCA BIKE','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(29,'CONSTANTINO DE OLIVEIRA FILHO','CONSTANTINO DE OLIVEIRA FILHO','10577347000155',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'SACOLAO PATROFRUTA','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(30,'VITORIA','VITORIA','00000000000052',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'VITORIA','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(31,'CARLOS ALBERTO DE FREITAS','CARLOS ALBERTO DE FREITAS','00931077656',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'CARLOS','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(32,'ELI MAURO GERMANO JUNIOR','ELI MAURO GERMANO JUNIOR','09812437622',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ELI','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(33,'GABRIEL SILVA ROCHA','GABRIEL SILVA ROCHA','06937258690',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'GABRIEL SILVA ROCHA','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(34,'VINICIUS RIBEIRO SANTOS','VINICIUS RIBEIRO SANTOS','05638133690',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'FAZENDA MACAUBAS','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(35,'PEDRO RIVELINI','PEDRO RIVELINI','38942666949',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'FAZENDA RECANTO','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(36,'MARIA','MARIA','00000000061',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MARIA','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(37,'LOJA DE VESTUARIO ADOLETA LTDA','LOJA DE VESTUARIO ADOLETA LTDA','36940402000113',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ADOLETA','003713449.00-41',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(38,'ROGERSON ARAUJO ROCHA - ME','ROGERSON ARAUJO ROCHA - ME','02702210000157',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AGRICOLA AUTO PECAS','667152979.00-53',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(39,'AGRO BIG BAG COMERCIO EIRELI','AGRO BIG BAG COMERCIO EIRELI','11460310000105',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'AGRO BIG BAG','001534508.00-62',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(40,'GUIGA BOWLS LTDA','GUIGA BOWLS LTDA','39263708000170',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'GUIGA BOWLS','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(41,'LEANDRO MAXIMO CAIXETA','LEANDRO MAXIMO CAIXETA','14065480000183',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MAXIMUS SORVETES','001816700.00-87',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(42,'RENATO EUSTAQUIO CARVALHO','RENATO EUSTAQUIO CARVALHO','13446600000120',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'DESIGNER EM JOIAS','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(43,'BERTR','BERTR','45789268000192',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'JEPGRT','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(44,'BRUNO DOS REIS','BRUNO DOS REIS','14267380643',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'BRUNO REIS','ISENTO',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(45,'ENIO ANTONIO SILVA','ENIO ANTONIO SILVA','30579896000176',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'EMPRESA SILVA','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(46,'52933813 LUCIANA MARIA DA SILVA','52933813 LUCIANA MARIA DA SILVA','52933813000138',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'BRASIL LUBRIFICANTE','0047628480063',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(47,'LM COMERCIO DE ROUPAS E ACESSORIOS LTDA','LM COMERCIO DE ROUPAS E ACESSORIOS LTDA','31869495000113',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'VILLA BELLA BOUTIQUE','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(48,'TESTE PARA CTE','TESTE PARA CTE','00000000063',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'TESTE PARA CTE','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(49,'SAMUEL HEISLER LTDA','SAMUEL HEISLER LTDA','53859455000123',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'SAMUEL HEISLER LTDA','0048189310046',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(50,'BRUNO','BRUNO','06247249000182',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'BRUNO','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(51,'53.558.934 WESLEY SILVA MOTA','53.558.934 WESLEY SILVA MOTA','53558934000100',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'WESLEY SILVA MOTA','',0.00,NULL,'2026-06-23 16:46:48',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(52,'53.575.297 ITALO BRUNO DE FARIA','53.575.297 ITALO BRUNO DE FARIA','53575297000180',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ITALO BRUNO DE FARIA','',0.00,NULL,'2026-06-23 16:46:49',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(53,'52.349.213 LEANDRO FRANCO DIAS','52.349.213 LEANDRO FRANCO DIAS','52349213000127',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ATACADAO BRASIEL','',0.00,NULL,'2026-06-23 16:46:49',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(54,'VIDRACARIA RODRIGUES & PAULA LTDA','VIDRACARIA RODRIGUES & PAULA LTDA','11162577000116',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'VIDRACARIA VIDROLAR','',0.00,NULL,'2026-06-23 16:46:49',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00),(55,'PALOMA CONRADO MENDES LTDA','PALOMA CONRADO MENDES LTDA','53349475000154',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ABSOLUTA INFORMATICA','',0.00,NULL,'2026-06-23 16:46:49',NULL,NULL,NULL,1,NULL,NULL,NULL,0,0.00,'PERCENTUAL',0.00);
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes_grupos_excecao`
--

DROP TABLE IF EXISTS `clientes_grupos_excecao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes_grupos_excecao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `grupoproduto_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cliente_grupo` (`cliente_id`,`grupoproduto_id`),
  KEY `grupoproduto_id` (`grupoproduto_id`),
  CONSTRAINT `clientes_grupos_excecao_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_cliente`) ON DELETE CASCADE,
  CONSTRAINT `clientes_grupos_excecao_ibfk_2` FOREIGN KEY (`grupoproduto_id`) REFERENCES `grupos_produto` (`id_grupo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes_grupos_excecao`
--

LOCK TABLES `clientes_grupos_excecao` WRITE;
/*!40000 ALTER TABLE `clientes_grupos_excecao` DISABLE KEYS */;
/*!40000 ALTER TABLE `clientes_grupos_excecao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comandas`
--

DROP TABLE IF EXISTS `comandas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comandas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `forma_pagamento` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_abertura` datetime(6) NOT NULL,
  `data_fechamento` datetime(6) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `desconto` decimal(10,2) NOT NULL,
  `taxa_servico` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `cliente_id` int DEFAULT NULL,
  `garcom_id` int DEFAULT NULL,
  `id_operacao_nfce_id` int DEFAULT NULL,
  `id_vendedor` int DEFAULT NULL,
  `mesa_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `comandas_cliente_id_4271f3c8_fk_clientes_id_cliente` (`cliente_id`),
  KEY `comandas_garcom_id_feb96595_fk_auth_user_id` (`garcom_id`),
  KEY `comandas_id_operacao_nfce_id_6de145b0_fk_operacoes_id_operacao` (`id_operacao_nfce_id`),
  KEY `comandas_id_vendedor_7d45e4be_fk_vendedores_id_vendedor` (`id_vendedor`),
  KEY `comandas_mesa_id_c450f5d9_fk_mesas_id` (`mesa_id`),
  CONSTRAINT `comandas_cliente_id_4271f3c8_fk_clientes_id_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `comandas_garcom_id_feb96595_fk_auth_user_id` FOREIGN KEY (`garcom_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `comandas_id_operacao_nfce_id_6de145b0_fk_operacoes_id_operacao` FOREIGN KEY (`id_operacao_nfce_id`) REFERENCES `operacoes` (`id_operacao`),
  CONSTRAINT `comandas_id_vendedor_7d45e4be_fk_vendedores_id_vendedor` FOREIGN KEY (`id_vendedor`) REFERENCES `vendedores` (`id_vendedor`),
  CONSTRAINT `comandas_mesa_id_c450f5d9_fk_mesas_id` FOREIGN KEY (`mesa_id`) REFERENCES `mesas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comandas`
--

LOCK TABLES `comandas` WRITE;
/*!40000 ALTER TABLE `comandas` DISABLE KEYS */;
/*!40000 ALTER TABLE `comandas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complemento_icms_nfe`
--

DROP TABLE IF EXISTS `complemento_icms_nfe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complemento_icms_nfe` (
  `id_complemento` int NOT NULL AUTO_INCREMENT,
  `tipo_complemento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_complemento` decimal(14,2) NOT NULL,
  `base_calculo` decimal(14,2) DEFAULT NULL,
  `aliquota` decimal(7,4) DEFAULT NULL,
  `motivo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_criacao` datetime(6) NOT NULL,
  `data_emissao` datetime(6) DEFAULT NULL,
  `id_venda_complemento` int DEFAULT NULL,
  `id_venda_referencia` int NOT NULL,
  `usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`id_complemento`),
  KEY `complemento_icms_nfe_id_venda_complemento_ea4db324_fk_vendas_id` (`id_venda_complemento`),
  KEY `complemento_icms_nfe_id_venda_referencia_bef57631_fk_vendas_id` (`id_venda_referencia`),
  KEY `complemento_icms_nfe_usuario_id_45ce2000_fk_auth_user_id` (`usuario_id`),
  CONSTRAINT `complemento_icms_nfe_id_venda_complemento_ea4db324_fk_vendas_id` FOREIGN KEY (`id_venda_complemento`) REFERENCES `vendas` (`id_venda`),
  CONSTRAINT `complemento_icms_nfe_id_venda_referencia_bef57631_fk_vendas_id` FOREIGN KEY (`id_venda_referencia`) REFERENCES `vendas` (`id_venda`),
  CONSTRAINT `complemento_icms_nfe_usuario_id_45ce2000_fk_auth_user_id` FOREIGN KEY (`usuario_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complemento_icms_nfe`
--

LOCK TABLES `complemento_icms_nfe` WRITE;
/*!40000 ALTER TABLE `complemento_icms_nfe` DISABLE KEYS */;
/*!40000 ALTER TABLE `complemento_icms_nfe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compra_itens`
--

DROP TABLE IF EXISTS `compra_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compra_itens` (
  `id_compra_item` int NOT NULL AUTO_INCREMENT,
  `id_compra` int NOT NULL,
  `id_produto` int NOT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `unidade` varchar(10) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `valor_desconto` decimal(10,2) DEFAULT NULL,
  `valor_frete_item` decimal(10,2) DEFAULT NULL,
  `valor_ipi` decimal(10,2) DEFAULT NULL,
  `valor_icms` decimal(10,2) DEFAULT NULL,
  `valor_pis` decimal(10,2) DEFAULT NULL,
  `valor_cofins` decimal(10,2) DEFAULT NULL,
  `quantidade_fracionada` decimal(10,3) DEFAULT NULL,
  `fracao_aplicada` decimal(15,6) DEFAULT NULL COMMENT 'Fra├º├úo aplicada (ex: 12.0 para caixa com 12 unidades)',
  PRIMARY KEY (`id_compra_item`),
  KEY `fk_compra_itens_compra_idx` (`id_compra`),
  KEY `fk_compra_itens_produto_idx` (`id_produto`),
  CONSTRAINT `fk_compra_itens_compra` FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id_compra`) ON DELETE CASCADE,
  CONSTRAINT `fk_compra_itens_produto` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB AUTO_INCREMENT=381 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compra_itens`
--

LOCK TABLES `compra_itens` WRITE;
/*!40000 ALTER TABLE `compra_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `compra_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compras`
--

DROP TABLE IF EXISTS `compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compras` (
  `id_compra` int NOT NULL AUTO_INCREMENT,
  `id_operacao` int NOT NULL,
  `id_fornecedor` int DEFAULT NULL,
  `chave_nfe` varchar(44) DEFAULT NULL,
  `numero_nota` varchar(20) NOT NULL,
  `serie_nota` varchar(5) DEFAULT NULL,
  `data_emissao_nfe` date DEFAULT NULL,
  `data_movimento_entrada` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `valor_total_produtos` decimal(10,2) NOT NULL DEFAULT '0.00',
  `valor_frete` decimal(10,2) DEFAULT '0.00',
  `valor_desconto` decimal(10,2) DEFAULT '0.00',
  `valor_impostos` decimal(10,2) DEFAULT '0.00',
  `valor_total_nota` decimal(10,2) NOT NULL,
  `manual` tinyint(1) NOT NULL DEFAULT '0',
  `id_cte` varchar(44) DEFAULT NULL,
  `gerou_financeiro` tinyint(1) NOT NULL DEFAULT '0',
  `data_entrada` date DEFAULT NULL COMMENT 'Data de entrada da mercadoria no estoque',
  `xml_conteudo` longtext,
  PRIMARY KEY (`id_compra`),
  UNIQUE KEY `chave_nfe_UNIQUE` (`chave_nfe`),
  KEY `fk_compras_operacao_idx` (`id_operacao`)
) ENGINE=InnoDB AUTO_INCREMENT=140 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
/*!40000 ALTER TABLE `compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config_whatsapp`
--

DROP TABLE IF EXISTS `config_whatsapp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `config_whatsapp` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome_instancia` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'URL da Evolution API',
  `api_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instancia_ativa` tinyint(1) DEFAULT '0',
  `qr_code` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'QR Code para conex├úo',
  `status_conexao` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'desconectado' COMMENT 'conectado, desconectado, qr_pendente',
  `telefone_conectado` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delay_entre_mensagens` int DEFAULT '15' COMMENT 'Segundos entre cada envio',
  `limite_envios_por_hora` int DEFAULT '20',
  `ativar_delay_randomico` tinyint(1) DEFAULT '1',
  `data_atualizacao` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cloud_token` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cloud_phone_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cloud_verify_token` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cloud_numero` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'N├║mero real do WhatsApp Cloud API (ex: 5511999999999)',
  `status_validacao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PENDENTE | VALIDADO',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome_instancia` (`nome_instancia`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config_whatsapp`
--

LOCK TABLES `config_whatsapp` WRITE;
/*!40000 ALTER TABLE `config_whatsapp` DISABLE KEYS */;
/*!40000 ALTER TABLE `config_whatsapp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracao_balanca`
--

DROP TABLE IF EXISTS `configuracao_balanca`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracao_balanca` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome_configuracao` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_balanca` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo_balanca` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `porta_serial` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `baud_rate` int NOT NULL,
  `ip_balanca` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `porta_rede` int DEFAULT NULL,
  `formato_exportacao` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo_inicial_plu` int NOT NULL,
  `usar_codigo_barras` tinyint(1) NOT NULL,
  `prefixo_codigo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tamanho_nome_produto` int NOT NULL,
  `incluir_validade` tinyint(1) NOT NULL,
  `dias_validade_padrao` int NOT NULL,
  `apenas_produtos_peso` tinyint(1) NOT NULL,
  `grupos_permitidos` json NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `usuario_criacao_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `configuracao_balanca_usuario_criacao_id_201f619c_fk_auth_user_id` (`usuario_criacao_id`),
  CONSTRAINT `configuracao_balanca_usuario_criacao_id_201f619c_fk_auth_user_id` FOREIGN KEY (`usuario_criacao_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracao_balanca`
--

LOCK TABLES `configuracao_balanca` WRITE;
/*!40000 ALTER TABLE `configuracao_balanca` DISABLE KEYS */;
/*!40000 ALTER TABLE `configuracao_balanca` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracao_contratos`
--

DROP TABLE IF EXISTS `configuracao_contratos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracao_contratos` (
  `id_configuracao` int NOT NULL AUTO_INCREMENT,
  `tipo_contrato` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_html` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `data_criacao` datetime(6) NOT NULL,
  `data_atualizacao` datetime(6) NOT NULL,
  PRIMARY KEY (`id_configuracao`),
  UNIQUE KEY `tipo_contrato` (`tipo_contrato`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracao_contratos`
--

LOCK TABLES `configuracao_contratos` WRITE;
/*!40000 ALTER TABLE `configuracao_contratos` DISABLE KEYS */;
/*!40000 ALTER TABLE `configuracao_contratos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracao_produto`
--

DROP TABLE IF EXISTS `configuracao_produto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracao_produto` (
  `id_config` int NOT NULL AUTO_INCREMENT,
  `tipo_geracao_codigo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `proximo_codigo` int NOT NULL,
  `prefixo_codigo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tamanho_codigo` int NOT NULL,
  `controlar_lote_validade` tinyint(1) NOT NULL,
  `produto_em_grade` tinyint(1) NOT NULL,
  `material_construcao` tinyint(1) NOT NULL,
  `trib_cfop` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trib_cst_icms` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trib_csosn` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trib_icms_aliquota` decimal(6,2) DEFAULT NULL,
  `trib_cst_ipi` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trib_ipi_aliquota` decimal(6,2) DEFAULT NULL,
  `trib_cst_pis_cofins` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trib_pis_aliquota` decimal(6,2) DEFAULT NULL,
  `trib_cofins_aliquota` decimal(6,2) DEFAULT NULL,
  `trib_classificacao_fiscal` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_criacao` datetime(6) NOT NULL,
  `data_modificacao` datetime(6) NOT NULL,
  PRIMARY KEY (`id_config`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracao_produto`
--

LOCK TABLES `configuracao_produto` WRITE;
/*!40000 ALTER TABLE `configuracao_produto` DISABLE KEYS */;
/*!40000 ALTER TABLE `configuracao_produto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracoes_bancarias`
--

DROP TABLE IF EXISTS `configuracoes_bancarias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracoes_bancarias` (
  `id_config` int NOT NULL AUTO_INCREMENT,
  `banco` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome_configuracao` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_secret` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_autenticacao` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_api_boletos` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo_banco` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `agencia` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `conta` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `digito_conta` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `convenio` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dias_protesto` int NOT NULL,
  `dias_baixa` int NOT NULL,
  `percentual_multa` decimal(5,2) NOT NULL,
  `percentual_juros_dia` decimal(5,4) NOT NULL,
  `baixa_automatica_api` tinyint(1) NOT NULL,
  `gerar_boleto_automatico` tinyint(1) NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `ambiente` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_cadastro` datetime(6) NOT NULL,
  `access_token` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `refresh_token` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `token_expira_em` datetime(6) DEFAULT NULL,
  `id_conta_bancaria_id` int NOT NULL,
  PRIMARY KEY (`id_config`),
  KEY `configuracoes_bancar_id_conta_bancaria_id_2098e449_fk_contas_ba` (`id_conta_bancaria_id`),
  CONSTRAINT `configuracoes_bancar_id_conta_bancaria_id_2098e449_fk_contas_ba` FOREIGN KEY (`id_conta_bancaria_id`) REFERENCES `contas_bancarias` (`id_conta_bancaria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracoes_bancarias`
--

LOCK TABLES `configuracoes_bancarias` WRITE;
/*!40000 ALTER TABLE `configuracoes_bancarias` DISABLE KEYS */;
/*!40000 ALTER TABLE `configuracoes_bancarias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracoes_impressao`
--

DROP TABLE IF EXISTS `configuracoes_impressao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracoes_impressao` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `modulo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_impressora` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `largura_termica` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `imprimir_automatico` tinyint(1) NOT NULL,
  `mostrar_logo` tinyint(1) NOT NULL,
  `copias` smallint unsigned NOT NULL,
  `observacao_rodape` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `gabarito_customizado_nome` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `modulo` (`modulo`),
  CONSTRAINT `configuracoes_impressao_chk_1` CHECK ((`copias` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracoes_impressao`
--

LOCK TABLES `configuracoes_impressao` WRITE;
/*!40000 ALTER TABLE `configuracoes_impressao` DISABLE KEYS */;
INSERT INTO `configuracoes_impressao` VALUES (2,'venda_rapida','termica','80mm',0,1,1,'','2026-06-03 20:24:46.897049',NULL),(3,'ordem_servico','termica','80mm',0,1,1,'','2026-06-22 18:18:43.290880',NULL);
/*!40000 ALTER TABLE `configuracoes_impressao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conjunto_operacoes`
--

DROP TABLE IF EXISTS `conjunto_operacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conjunto_operacoes` (
  `id_conjunto` int NOT NULL AUTO_INCREMENT,
  `nome_conjunto` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ativo` tinyint(1) NOT NULL,
  `data_criacao` datetime(6) NOT NULL,
  `data_modificacao` datetime(6) NOT NULL,
  PRIMARY KEY (`id_conjunto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conjunto_operacoes`
--

LOCK TABLES `conjunto_operacoes` WRITE;
/*!40000 ALTER TABLE `conjunto_operacoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `conjunto_operacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conjunto_operacoes_operacoes`
--

DROP TABLE IF EXISTS `conjunto_operacoes_operacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conjunto_operacoes_operacoes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conjuntooperacao_id` int NOT NULL,
  `operacao_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `conjunto_operacoes_opera_conjuntooperacao_id_oper_e37894a4_uniq` (`conjuntooperacao_id`,`operacao_id`),
  KEY `conjunto_operacoes_o_operacao_id_6d2af5bd_fk_operacoes` (`operacao_id`),
  CONSTRAINT `conjunto_operacoes_o_conjuntooperacao_id_eb7e5719_fk_conjunto_` FOREIGN KEY (`conjuntooperacao_id`) REFERENCES `conjunto_operacoes` (`id_conjunto`),
  CONSTRAINT `conjunto_operacoes_o_operacao_id_6d2af5bd_fk_operacoes` FOREIGN KEY (`operacao_id`) REFERENCES `operacoes` (`id_operacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conjunto_operacoes_operacoes`
--

LOCK TABLES `conjunto_operacoes_operacoes` WRITE;
/*!40000 ALTER TABLE `conjunto_operacoes_operacoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `conjunto_operacoes_operacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultas_veterinarias`
--

DROP TABLE IF EXISTS `consultas_veterinarias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultas_veterinarias` (
  `id_consulta` int NOT NULL AUTO_INCREMENT,
  `tipo_consulta` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_consulta` datetime(6) NOT NULL,
  `queixa_principal` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `historico_clinico` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `peso_consulta` decimal(5,2) DEFAULT NULL,
  `temperatura` decimal(4,1) DEFAULT NULL,
  `frequencia_cardiaca` int DEFAULT NULL,
  `frequencia_respiratoria` int DEFAULT NULL,
  `diagnostico` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tratamento` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `receituario` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `retorno_previsto` date DEFAULT NULL,
  `valor_consulta` decimal(10,2) NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_cadastro` datetime(6) NOT NULL,
  `data_modificacao` datetime(6) NOT NULL,
  `id_cliente` int NOT NULL,
  `id_pet` int NOT NULL,
  `id_veterinario` int DEFAULT NULL,
  PRIMARY KEY (`id_consulta`),
  KEY `consultas_v_id_pet_90b843_idx` (`id_pet`,`data_consulta`),
  KEY `consultas_v_id_vete_36d28f_idx` (`id_veterinario`,`status`),
  KEY `consultas_veterinari_id_cliente_ed4e36dd_fk_clientes_` (`id_cliente`),
  CONSTRAINT `consultas_veterinari_id_cliente_ed4e36dd_fk_clientes_` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `consultas_veterinari_id_veterinario_5f6f387d_fk_veterinar` FOREIGN KEY (`id_veterinario`) REFERENCES `veterinarios` (`id_veterinario`),
  CONSTRAINT `consultas_veterinarias_id_pet_53b0422b_fk_petshop_pets_id_pet` FOREIGN KEY (`id_pet`) REFERENCES `petshop_pets` (`id_pet`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultas_veterinarias`
--

LOCK TABLES `consultas_veterinarias` WRITE;
/*!40000 ALTER TABLE `consultas_veterinarias` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultas_veterinarias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contas_bancarias`
--

DROP TABLE IF EXISTS `contas_bancarias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contas_bancarias` (
  `id_conta_bancaria` int NOT NULL AUTO_INCREMENT,
  `nome_conta` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo_banco` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nome_banco` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agencia` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conta` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `digito` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_conta` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `saldo_inicial` decimal(15,2) NOT NULL,
  `obs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_criacao` datetime(6) DEFAULT NULL,
  `data_modificacao` datetime(6) NOT NULL,
  PRIMARY KEY (`id_conta_bancaria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contas_bancarias`
--

LOCK TABLES `contas_bancarias` WRITE;
/*!40000 ALTER TABLE `contas_bancarias` DISABLE KEYS */;
/*!40000 ALTER TABLE `contas_bancarias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contas_servicos`
--

DROP TABLE IF EXISTS `contas_servicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contas_servicos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tipo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fornecedor_nome` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnpj_fornecedor` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_documento` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `serie` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chave_acesso` varchar(44) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_emissao` date NOT NULL,
  `data_vencimento` date DEFAULT NULL,
  `data_pagamento` date DEFAULT NULL,
  `mes_competencia` int NOT NULL,
  `ano_competencia` int NOT NULL,
  `valor_total` decimal(15,2) NOT NULL,
  `valor_pis` decimal(15,2) NOT NULL,
  `aliq_pis` decimal(8,4) NOT NULL,
  `valor_cofins` decimal(15,2) NOT NULL,
  `aliq_cofins` decimal(8,4) NOT NULL,
  `valor_icms` decimal(15,2) NOT NULL,
  `aliq_icms` decimal(8,4) NOT NULL,
  `cfop` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cst_pis` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cst_cofins` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cst_icms` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contas_servicos`
--

LOCK TABLES `contas_servicos` WRITE;
/*!40000 ALTER TABLE `contas_servicos` DISABLE KEYS */;
/*!40000 ALTER TABLE `contas_servicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contratos_agricolas`
--

DROP TABLE IF EXISTS `contratos_agricolas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contratos_agricolas` (
  `id_contrato` int NOT NULL AUTO_INCREMENT,
  `numero_contrato` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantidade_negociada` decimal(15,3) NOT NULL,
  `unidade_medida` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_unitario` decimal(12,2) NOT NULL,
  `valor_total_contrato` decimal(15,2) NOT NULL,
  `data_emissao` date NOT NULL,
  `data_entrega` date NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_cliente_id` int NOT NULL,
  `id_produto_destino_id` int NOT NULL,
  `id_safra_id` int NOT NULL,
  PRIMARY KEY (`id_contrato`),
  UNIQUE KEY `numero_contrato` (`numero_contrato`),
  KEY `contratos_agricolas_id_cliente_id_3358db21_fk_clientes_` (`id_cliente_id`),
  KEY `contratos_agricolas_id_produto_destino_i_b7d54566_fk_produtos_` (`id_produto_destino_id`),
  KEY `contratos_agricolas_id_safra_id_438d5f89_fk_safras_id_safra` (`id_safra_id`),
  CONSTRAINT `contratos_agricolas_id_cliente_id_3358db21_fk_clientes_` FOREIGN KEY (`id_cliente_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `contratos_agricolas_id_produto_destino_i_b7d54566_fk_produtos_` FOREIGN KEY (`id_produto_destino_id`) REFERENCES `produtos` (`id_produto`),
  CONSTRAINT `contratos_agricolas_id_safra_id_438d5f89_fk_safras_id_safra` FOREIGN KEY (`id_safra_id`) REFERENCES `safras` (`id_safra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contratos_agricolas`
--

LOCK TABLES `contratos_agricolas` WRITE;
/*!40000 ALTER TABLE `contratos_agricolas` DISABLE KEYS */;
/*!40000 ALTER TABLE `contratos_agricolas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `controle_caixa`
--

DROP TABLE IF EXISTS `controle_caixa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `controle_caixa` (
  `id_caixa` int NOT NULL AUTO_INCREMENT,
  `data_abertura` datetime(6) NOT NULL,
  `valor_abertura` decimal(10,2) NOT NULL,
  `data_fechamento` datetime(6) DEFAULT NULL,
  `valor_fechamento` decimal(10,2) DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `operador_id` int DEFAULT NULL,
  PRIMARY KEY (`id_caixa`),
  KEY `controle_caixa_operador_id_6ff822bf_fk_auth_user_id` (`operador_id`),
  CONSTRAINT `controle_caixa_operador_id_6ff822bf_fk_auth_user_id` FOREIGN KEY (`operador_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `controle_caixa`
--

LOCK TABLES `controle_caixa` WRITE;
/*!40000 ALTER TABLE `controle_caixa` DISABLE KEYS */;
/*!40000 ALTER TABLE `controle_caixa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversoes_unidades`
--

DROP TABLE IF EXISTS `conversoes_unidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversoes_unidades` (
  `id_conversao` int NOT NULL AUTO_INCREMENT,
  `unidade_origem` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unidade_destino` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fator_conversao` decimal(12,4) NOT NULL,
  `operacao` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_produto_id` int DEFAULT NULL,
  PRIMARY KEY (`id_conversao`),
  KEY `conversoes_unidades_id_produto_id_9029c4cd_fk_produtos_` (`id_produto_id`),
  CONSTRAINT `conversoes_unidades_id_produto_id_9029c4cd_fk_produtos_` FOREIGN KEY (`id_produto_id`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversoes_unidades`
--

LOCK TABLES `conversoes_unidades` WRITE;
/*!40000 ALTER TABLE `conversoes_unidades` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversoes_unidades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `corsheaders_corsmodel`
--

DROP TABLE IF EXISTS `corsheaders_corsmodel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `corsheaders_corsmodel` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cors` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `corsheaders_corsmodel`
--

LOCK TABLES `corsheaders_corsmodel` WRITE;
/*!40000 ALTER TABLE `corsheaders_corsmodel` DISABLE KEYS */;
/*!40000 ALTER TABLE `corsheaders_corsmodel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotacao_fornecedores`
--

DROP TABLE IF EXISTS `cotacao_fornecedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotacao_fornecedores` (
  `id_cotacao_fornecedor` int NOT NULL AUTO_INCREMENT,
  `token_acesso` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_envio` datetime(6) DEFAULT NULL,
  `data_visualizacao` datetime(6) DEFAULT NULL,
  `data_resposta` datetime(6) DEFAULT NULL,
  `email_enviado` tinyint(1) NOT NULL,
  `whatsapp_enviado` tinyint(1) NOT NULL,
  `id_cotacao` int NOT NULL,
  `id_fornecedor` int NOT NULL,
  PRIMARY KEY (`id_cotacao_fornecedor`),
  UNIQUE KEY `token_acesso` (`token_acesso`),
  UNIQUE KEY `cotacao_fornecedores_id_cotacao_id_fornecedor_d1e502b4_uniq` (`id_cotacao`,`id_fornecedor`),
  KEY `cotacao_fornecedores_id_fornecedor_e78ad6df_fk_fornecedo` (`id_fornecedor`),
  CONSTRAINT `cotacao_fornecedores_id_cotacao_11dc409e_fk_cotacoes_id_cotacao` FOREIGN KEY (`id_cotacao`) REFERENCES `cotacoes` (`id_cotacao`),
  CONSTRAINT `cotacao_fornecedores_id_fornecedor_e78ad6df_fk_fornecedo` FOREIGN KEY (`id_fornecedor`) REFERENCES `fornecedores` (`id_fornecedor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotacao_fornecedores`
--

LOCK TABLES `cotacao_fornecedores` WRITE;
/*!40000 ALTER TABLE `cotacao_fornecedores` DISABLE KEYS */;
/*!40000 ALTER TABLE `cotacao_fornecedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotacao_itens`
--

DROP TABLE IF EXISTS `cotacao_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotacao_itens` (
  `id_cotacao_item` int NOT NULL AUTO_INCREMENT,
  `quantidade_solicitada` decimal(10,3) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `valor_vencedor` decimal(10,2) DEFAULT NULL,
  `fornecedor_vencedor` int DEFAULT NULL,
  `id_cotacao` int NOT NULL,
  `id_produto` int NOT NULL,
  PRIMARY KEY (`id_cotacao_item`),
  KEY `cotacao_itens_fornecedor_vencedor_11dc7a94_fk_fornecedo` (`fornecedor_vencedor`),
  KEY `cotacao_itens_id_cotacao_2396a245_fk_cotacoes_id_cotacao` (`id_cotacao`),
  KEY `cotacao_itens_id_produto_38c9de49_fk_produtos_id_produto` (`id_produto`),
  CONSTRAINT `cotacao_itens_fornecedor_vencedor_11dc7a94_fk_fornecedo` FOREIGN KEY (`fornecedor_vencedor`) REFERENCES `fornecedores` (`id_fornecedor`),
  CONSTRAINT `cotacao_itens_id_cotacao_2396a245_fk_cotacoes_id_cotacao` FOREIGN KEY (`id_cotacao`) REFERENCES `cotacoes` (`id_cotacao`),
  CONSTRAINT `cotacao_itens_id_produto_38c9de49_fk_produtos_id_produto` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotacao_itens`
--

LOCK TABLES `cotacao_itens` WRITE;
/*!40000 ALTER TABLE `cotacao_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `cotacao_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotacao_respostas`
--

DROP TABLE IF EXISTS `cotacao_respostas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotacao_respostas` (
  `id_cotacao_resposta` int NOT NULL AUTO_INCREMENT,
  `valor_unitario` decimal(10,2) NOT NULL,
  `prazo_entrega_dias` int DEFAULT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `valor_total` decimal(12,2) NOT NULL,
  `id_cotacao_fornecedor` int NOT NULL,
  `id_cotacao_item` int NOT NULL,
  PRIMARY KEY (`id_cotacao_resposta`),
  UNIQUE KEY `cotacao_respostas_id_cotacao_fornecedor_id_d6c5a1c6_uniq` (`id_cotacao_fornecedor`,`id_cotacao_item`),
  KEY `cotacao_respostas_id_cotacao_item_ddeb3288_fk_cotacao_i` (`id_cotacao_item`),
  CONSTRAINT `cotacao_respostas_id_cotacao_fornecedo_fef47b46_fk_cotacao_f` FOREIGN KEY (`id_cotacao_fornecedor`) REFERENCES `cotacao_fornecedores` (`id_cotacao_fornecedor`),
  CONSTRAINT `cotacao_respostas_id_cotacao_item_ddeb3288_fk_cotacao_i` FOREIGN KEY (`id_cotacao_item`) REFERENCES `cotacao_itens` (`id_cotacao_item`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotacao_respostas`
--

LOCK TABLES `cotacao_respostas` WRITE;
/*!40000 ALTER TABLE `cotacao_respostas` DISABLE KEYS */;
/*!40000 ALTER TABLE `cotacao_respostas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cotacoes`
--

DROP TABLE IF EXISTS `cotacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cotacoes` (
  `id_cotacao` int NOT NULL AUTO_INCREMENT,
  `numero_cotacao` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_cotacao` datetime(6) NOT NULL,
  `prazo_resposta` datetime(6) NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `criado_por` int DEFAULT NULL,
  PRIMARY KEY (`id_cotacao`),
  UNIQUE KEY `numero_cotacao` (`numero_cotacao`),
  KEY `cotacoes_criado_por_83084ffc_fk_auth_user_id` (`criado_por`),
  CONSTRAINT `cotacoes_criado_por_83084ffc_fk_auth_user_id` FOREIGN KEY (`criado_por`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cotacoes`
--

LOCK TABLES `cotacoes` WRITE;
/*!40000 ALTER TABLE `cotacoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `cotacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `credito_utilizacoes`
--

DROP TABLE IF EXISTS `credito_utilizacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `credito_utilizacoes` (
  `id_utilizacao` int NOT NULL AUTO_INCREMENT,
  `id_venda` int NOT NULL,
  `valor_utilizado` decimal(10,2) NOT NULL,
  `data_utilizacao` datetime(6) NOT NULL,
  `credito_id` int NOT NULL,
  `usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`id_utilizacao`),
  KEY `credito_utilizacoes_credito_id_41ec5caf_fk_creditos_` (`credito_id`),
  KEY `credito_utilizacoes_usuario_id_01df69b0_fk_auth_user_id` (`usuario_id`),
  KEY `credito_utilizacoes_id_venda_9fa7b3e4` (`id_venda`),
  CONSTRAINT `credito_utilizacoes_credito_id_41ec5caf_fk_creditos_` FOREIGN KEY (`credito_id`) REFERENCES `creditos_cliente` (`id_credito`),
  CONSTRAINT `credito_utilizacoes_usuario_id_01df69b0_fk_auth_user_id` FOREIGN KEY (`usuario_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `credito_utilizacoes`
--

LOCK TABLES `credito_utilizacoes` WRITE;
/*!40000 ALTER TABLE `credito_utilizacoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `credito_utilizacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `creditos_cliente`
--

DROP TABLE IF EXISTS `creditos_cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `creditos_cliente` (
  `id_credito` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `valor_credito` decimal(10,2) NOT NULL,
  `valor_utilizado` decimal(10,2) NOT NULL,
  `saldo` decimal(10,2) NOT NULL,
  `data_criacao` datetime(6) NOT NULL,
  `data_validade` date DEFAULT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `devolucao_id` int DEFAULT NULL,
  PRIMARY KEY (`id_credito`),
  KEY `creditos_cliente_devolucao_id_0e098ed8_fk_devolucoe` (`devolucao_id`),
  KEY `creditos_cliente_id_cliente_212bae27` (`id_cliente`),
  KEY `creditos_cl_id_clie_1bdb1e_idx` (`id_cliente`,`status`),
  CONSTRAINT `creditos_cliente_devolucao_id_0e098ed8_fk_devolucoe` FOREIGN KEY (`devolucao_id`) REFERENCES `devolucoes` (`id_devolucao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `creditos_cliente`
--

LOCK TABLES `creditos_cliente` WRITE;
/*!40000 ALTER TABLE `creditos_cliente` DISABLE KEYS */;
/*!40000 ALTER TABLE `creditos_cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crm_atividade_lead`
--

DROP TABLE IF EXISTS `crm_atividade_lead`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_atividade_lead` (
  `id_atividade` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_prevista` datetime(6) DEFAULT NULL,
  `data_realizada` datetime(6) DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `responsavel_id` int DEFAULT NULL,
  `lead_id` int NOT NULL,
  PRIMARY KEY (`id_atividade`),
  KEY `crm_atividade_lead_responsavel_id_85529b6a_fk_auth_user_id` (`responsavel_id`),
  KEY `crm_atividade_lead_lead_id_52dd77be_fk_crm_lead_id_lead` (`lead_id`),
  CONSTRAINT `crm_atividade_lead_lead_id_52dd77be_fk_crm_lead_id_lead` FOREIGN KEY (`lead_id`) REFERENCES `crm_lead` (`id_lead`),
  CONSTRAINT `crm_atividade_lead_responsavel_id_85529b6a_fk_auth_user_id` FOREIGN KEY (`responsavel_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crm_atividade_lead`
--

LOCK TABLES `crm_atividade_lead` WRITE;
/*!40000 ALTER TABLE `crm_atividade_lead` DISABLE KEYS */;
/*!40000 ALTER TABLE `crm_atividade_lead` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crm_etapa_pipeline`
--

DROP TABLE IF EXISTS `crm_etapa_pipeline`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_etapa_pipeline` (
  `id_etapa` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ordem` smallint unsigned NOT NULL,
  `cor` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `probabilidade` smallint unsigned NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  PRIMARY KEY (`id_etapa`),
  CONSTRAINT `crm_etapa_pipeline_chk_1` CHECK ((`ordem` >= 0)),
  CONSTRAINT `crm_etapa_pipeline_chk_2` CHECK ((`probabilidade` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crm_etapa_pipeline`
--

LOCK TABLES `crm_etapa_pipeline` WRITE;
/*!40000 ALTER TABLE `crm_etapa_pipeline` DISABLE KEYS */;
/*!40000 ALTER TABLE `crm_etapa_pipeline` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crm_lead`
--

DROP TABLE IF EXISTS `crm_lead`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_lead` (
  `id_lead` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `empresa` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cpf_cnpj` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cargo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_estimado` decimal(12,2) DEFAULT NULL,
  `data_fechamento_prevista` date DEFAULT NULL,
  `motivo_perda` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `produto_interesse` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `convertido_em` datetime(6) DEFAULT NULL,
  `cliente_convertido_id` int DEFAULT NULL,
  `criado_por_id` int DEFAULT NULL,
  `etapa_id` int DEFAULT NULL,
  `responsavel_id` int DEFAULT NULL,
  `origem_id` int DEFAULT NULL,
  PRIMARY KEY (`id_lead`),
  KEY `crm_lead_cliente_convertido_id_a7998cc3_fk_clientes_id_cliente` (`cliente_convertido_id`),
  KEY `crm_lead_criado_por_id_dd16018e_fk_auth_user_id` (`criado_por_id`),
  KEY `crm_lead_origem_id_20a3be12_fk_crm_origem_lead_id_origem` (`origem_id`),
  KEY `crm_lead_status_2c1bc7_idx` (`status`),
  KEY `crm_lead_etapa_i_7f693f_idx` (`etapa_id`),
  KEY `crm_lead_respons_6388f8_idx` (`responsavel_id`),
  CONSTRAINT `crm_lead_cliente_convertido_id_a7998cc3_fk_clientes_id_cliente` FOREIGN KEY (`cliente_convertido_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `crm_lead_criado_por_id_dd16018e_fk_auth_user_id` FOREIGN KEY (`criado_por_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `crm_lead_etapa_id_dcd40eeb_fk_crm_etapa_pipeline_id_etapa` FOREIGN KEY (`etapa_id`) REFERENCES `crm_etapa_pipeline` (`id_etapa`),
  CONSTRAINT `crm_lead_origem_id_20a3be12_fk_crm_origem_lead_id_origem` FOREIGN KEY (`origem_id`) REFERENCES `crm_origem_lead` (`id_origem`),
  CONSTRAINT `crm_lead_responsavel_id_fe337144_fk_auth_user_id` FOREIGN KEY (`responsavel_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crm_lead`
--

LOCK TABLES `crm_lead` WRITE;
/*!40000 ALTER TABLE `crm_lead` DISABLE KEYS */;
/*!40000 ALTER TABLE `crm_lead` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crm_origem_lead`
--

DROP TABLE IF EXISTS `crm_origem_lead`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_origem_lead` (
  `id_origem` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `canal` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  PRIMARY KEY (`id_origem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crm_origem_lead`
--

LOCK TABLES `crm_origem_lead` WRITE;
/*!40000 ALTER TABLE `crm_origem_lead` DISABLE KEYS */;
/*!40000 ALTER TABLE `crm_origem_lead` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cte_componentes_valor`
--

DROP TABLE IF EXISTS `cte_componentes_valor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cte_componentes_valor` (
  `id_componente` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` decimal(12,2) NOT NULL,
  `cte_id` int NOT NULL,
  PRIMARY KEY (`id_componente`),
  KEY `cte_componentes_valo_cte_id_51827aff_fk_cte_conhe` (`cte_id`),
  CONSTRAINT `cte_componentes_valo_cte_id_51827aff_fk_cte_conhe` FOREIGN KEY (`cte_id`) REFERENCES `cte_conhecimentos` (`id_cte`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cte_componentes_valor`
--

LOCK TABLES `cte_componentes_valor` WRITE;
/*!40000 ALTER TABLE `cte_componentes_valor` DISABLE KEYS */;
/*!40000 ALTER TABLE `cte_componentes_valor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cte_conhecimentos`
--

DROP TABLE IF EXISTS `cte_conhecimentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cte_conhecimentos` (
  `id_cte` int NOT NULL AUTO_INCREMENT,
  `chave_cte` varchar(44) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `protocolo_cte` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_cte` int DEFAULT NULL,
  `serie_cte` int NOT NULL,
  `status_cte` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `xml_cte` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `qrcode_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cstat` int DEFAULT NULL,
  `xmotivo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_emissao` datetime(6) NOT NULL,
  `cfop` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `natureza_operacao` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_cte` int NOT NULL,
  `tipo_servico` int NOT NULL,
  `modal` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tomador_servico` int NOT NULL,
  `produto_predominante` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_carga` decimal(12,2) NOT NULL,
  `peso_bruto` decimal(12,4) NOT NULL,
  `peso_liquido` decimal(12,4) NOT NULL,
  `volumes` int NOT NULL,
  `valor_total_servico` decimal(12,2) NOT NULL,
  `valor_receber` decimal(12,2) NOT NULL,
  `componente_frete_valor` decimal(12,2) NOT NULL,
  `componente_frete_peso` decimal(12,2) NOT NULL,
  `componente_sec_cat` decimal(12,2) NOT NULL,
  `componente_pedagio` decimal(12,2) NOT NULL,
  `componente_outros` decimal(12,2) NOT NULL,
  `cst_icms` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `p_icms` decimal(5,2) NOT NULL,
  `v_bc_icms` decimal(12,2) NOT NULL,
  `v_icms` decimal(12,2) NOT NULL,
  `resp_seguro` int NOT NULL,
  `nome_seguradora` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_apolice` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rntrc` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `placa_veiculo` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `veiculo_uf` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `veiculo_renavam` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `condutor_nome` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `condutor_cpf` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade_origem_nome` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade_origem_uf` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade_origem_ibge` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade_destino_nome` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade_destino_uf` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade_destino_ibge` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `criado_por_id` int DEFAULT NULL,
  `destinatario_id` int DEFAULT NULL,
  `expedidor_id` int DEFAULT NULL,
  `recebedor_id` int DEFAULT NULL,
  `remetente_id` int DEFAULT NULL,
  `tomador_outros_id` int DEFAULT NULL,
  `ciot` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ciot_cpf_cnpj` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_cte`),
  KEY `cte_conhecimentos_criado_por_id_956d2e52_fk_auth_user_id` (`criado_por_id`),
  KEY `cte_conhecimentos_destinatario_id_e0321653_fk_clientes_` (`destinatario_id`),
  KEY `cte_conhecimentos_expedidor_id_100e3d44_fk_clientes_id_cliente` (`expedidor_id`),
  KEY `cte_conhecimentos_recebedor_id_1e609be4_fk_clientes_id_cliente` (`recebedor_id`),
  KEY `cte_conhecimentos_remetente_id_b4ce6723_fk_clientes_id_cliente` (`remetente_id`),
  KEY `cte_conhecimentos_tomador_outros_id_67fd10eb_fk_clientes_` (`tomador_outros_id`),
  CONSTRAINT `cte_conhecimentos_criado_por_id_956d2e52_fk_auth_user_id` FOREIGN KEY (`criado_por_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `cte_conhecimentos_destinatario_id_e0321653_fk_clientes_` FOREIGN KEY (`destinatario_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `cte_conhecimentos_expedidor_id_100e3d44_fk_clientes_id_cliente` FOREIGN KEY (`expedidor_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `cte_conhecimentos_recebedor_id_1e609be4_fk_clientes_id_cliente` FOREIGN KEY (`recebedor_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `cte_conhecimentos_remetente_id_b4ce6723_fk_clientes_id_cliente` FOREIGN KEY (`remetente_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `cte_conhecimentos_tomador_outros_id_67fd10eb_fk_clientes_` FOREIGN KEY (`tomador_outros_id`) REFERENCES `clientes` (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cte_conhecimentos`
--

LOCK TABLES `cte_conhecimentos` WRITE;
/*!40000 ALTER TABLE `cte_conhecimentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `cte_conhecimentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cte_ctedocumento`
--

DROP TABLE IF EXISTS `cte_ctedocumento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cte_ctedocumento` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tipo_documento` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chave_nfe` varchar(44) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cte_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cte_ctedocumento_cte_id_f283477f_fk_cte_conhecimentos_id_cte` (`cte_id`),
  CONSTRAINT `cte_ctedocumento_cte_id_f283477f_fk_cte_conhecimentos_id_cte` FOREIGN KEY (`cte_id`) REFERENCES `cte_conhecimentos` (`id_cte`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cte_ctedocumento`
--

LOCK TABLES `cte_ctedocumento` WRITE;
/*!40000 ALTER TABLE `cte_ctedocumento` DISABLE KEYS */;
/*!40000 ALTER TABLE `cte_ctedocumento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cte_documentos_orig`
--

DROP TABLE IF EXISTS `cte_documentos_orig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cte_documentos_orig` (
  `id_doc` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chave_nfe` varchar(44) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cte_id` int NOT NULL,
  PRIMARY KEY (`id_doc`),
  KEY `cte_documentos_orig_cte_id_7998e9b9_fk_cte_conhecimentos_id_cte` (`cte_id`),
  CONSTRAINT `cte_documentos_orig_cte_id_7998e9b9_fk_cte_conhecimentos_id_cte` FOREIGN KEY (`cte_id`) REFERENCES `cte_conhecimentos` (`id_cte`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cte_documentos_orig`
--

LOCK TABLES `cte_documentos_orig` WRITE;
/*!40000 ALTER TABLE `cte_documentos_orig` DISABLE KEYS */;
/*!40000 ALTER TABLE `cte_documentos_orig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departamentos`
--

DROP TABLE IF EXISTS `departamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departamentos` (
  `id_departamento` int NOT NULL AUTO_INCREMENT,
  `nome_departamento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_departamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departamentos`
--

LOCK TABLES `departamentos` WRITE;
/*!40000 ALTER TABLE `departamentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `departamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deposito`
--

DROP TABLE IF EXISTS `deposito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deposito` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `descricao` text,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `estoque_baixo` int NOT NULL,
  `estoque_incremento` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3 COMMENT='Tabela para cadastrar os dep├│sitos/almoxarifados';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deposito`
--

LOCK TABLES `deposito` WRITE;
/*!40000 ALTER TABLE `deposito` DISABLE KEYS */;
/*!40000 ALTER TABLE `deposito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devolucao_itens`
--

DROP TABLE IF EXISTS `devolucao_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devolucao_itens` (
  `id_devolucao_item` int NOT NULL AUTO_INCREMENT,
  `id_produto` int NOT NULL,
  `nome_produto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo_produto` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantidade_devolvida` decimal(10,3) NOT NULL,
  `quantidade_original` decimal(10,3) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `motivo_item` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_venda_item` int DEFAULT NULL,
  `id_compra_item` int DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `devolucao_id` int NOT NULL,
  PRIMARY KEY (`id_devolucao_item`),
  KEY `devolucao_itens_devolucao_id_b0c509e7_fk_devolucoes_id_devolucao` (`devolucao_id`),
  CONSTRAINT `devolucao_itens_devolucao_id_b0c509e7_fk_devolucoes_id_devolucao` FOREIGN KEY (`devolucao_id`) REFERENCES `devolucoes` (`id_devolucao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devolucao_itens`
--

LOCK TABLES `devolucao_itens` WRITE;
/*!40000 ALTER TABLE `devolucao_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `devolucao_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devolucoes`
--

DROP TABLE IF EXISTS `devolucoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devolucoes` (
  `id_devolucao` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_venda` int DEFAULT NULL,
  `id_compra` int DEFAULT NULL,
  `id_cliente` int DEFAULT NULL,
  `id_fornecedor` int DEFAULT NULL,
  `id_operacao` int DEFAULT NULL,
  `data_devolucao` datetime(6) NOT NULL,
  `numero_devolucao` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `motivo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `gerar_credito` tinyint(1) NOT NULL,
  `valor_total_devolucao` decimal(10,2) NOT NULL,
  `chave_nfe_referenciada` varchar(44) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estoque_atualizado` tinyint(1) NOT NULL,
  `financeiro_gerado` tinyint(1) NOT NULL,
  `data_aprovacao` datetime(6) DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `aprovado_por_id` int DEFAULT NULL,
  `criado_por_id` int DEFAULT NULL,
  PRIMARY KEY (`id_devolucao`),
  UNIQUE KEY `numero_devolucao` (`numero_devolucao`),
  KEY `devolucoes_aprovado_por_id_acad9046_fk_auth_user_id` (`aprovado_por_id`),
  KEY `devolucoes_criado_por_id_f6a823a7_fk_auth_user_id` (`criado_por_id`),
  CONSTRAINT `devolucoes_aprovado_por_id_acad9046_fk_auth_user_id` FOREIGN KEY (`aprovado_por_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `devolucoes_criado_por_id_f6a823a7_fk_auth_user_id` FOREIGN KEY (`criado_por_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devolucoes`
--

LOCK TABLES `devolucoes` WRITE;
/*!40000 ALTER TABLE `devolucoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `devolucoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `object_repr` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=352 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (172,'admin','logentry'),(178,'api','agendamento'),(179,'api','aluguel'),(180,'api','aluguelitem'),(181,'api','atividadelead'),(182,'api','atributovariacao'),(183,'api','avaliacao'),(184,'api','boleto'),(185,'api','cashback'),(186,'api','catalogo'),(187,'api','catalogoitem'),(188,'api','categoriaepi'),(189,'api','categoriamercadologica'),(190,'api','centrocusto'),(191,'api','cheque'),(192,'api','classificacaoia'),(193,'api','cliente'),(194,'api','clientegrupoexcecao'),(195,'api','cobrancapix'),(196,'api','comodidade'),(197,'api','composicaoproduto'),(198,'api','compra'),(199,'api','compraitem'),(346,'api','comunicadosaas'),(200,'api','configuracaoagendamento'),(201,'api','configuracaobancaria'),(202,'api','configuracaocontrato'),(203,'api','configuracaoimpressao'),(204,'api','configuracaomercadopago'),(205,'api','configuracaopix'),(206,'api','configuracaoproduto'),(207,'api','configuracaowhatsapp'),(208,'api','conjuntooperacao'),(209,'api','consumoquarto'),(210,'api','contabancaria'),(211,'api','contaservico'),(212,'api','contratoagricola'),(345,'api','contratopadrao'),(213,'api','contratorecorrencia'),(214,'api','controlecaixa'),(215,'api','conversaounidade'),(216,'api','cotacao'),(217,'api','cotacaofornecedor'),(218,'api','cotacaoitem'),(219,'api','cotacaoresposta'),(220,'api','creditocliente'),(221,'api','creditoutilizacao'),(222,'api','departamento'),(223,'api','deposito'),(224,'api','devolucao'),(225,'api','devolucaoitem'),(226,'api','emailcampaign'),(227,'api','emailconfig'),(228,'api','emaillog'),(229,'api','emailtemplate'),(230,'api','empresaconfig'),(231,'api','entregaepi'),(232,'api','epi'),(233,'api','equipamento'),(234,'api','estoque'),(235,'api','estoquemovimentacao'),(236,'api','etapapipeline'),(237,'api','filawhatsapp'),(238,'api','financeirobancario'),(239,'api','financeiroconta'),(240,'api','formapagamento'),(241,'api','fornecedor'),(242,'api','funcao'),(243,'api','funcionario'),(348,'api','gabaritocustomizado'),(244,'api','grupoproduto'),(245,'api','historicoatualizacao'),(246,'api','holerite'),(247,'api','informacaoprodutoapi'),(248,'api','lead'),(347,'api','licenca'),(349,'api','linkcadastroremoto'),(249,'api','logauditoria'),(250,'api','logwhatsapp'),(251,'api','loteproduto'),(252,'api','manifestacaonfe'),(253,'api','mapacarga'),(254,'api','mapacargaitem'),(255,'api','marketplaceconfig'),(256,'api','marketplaceproduto'),(257,'api','movimentacaocaixa'),(258,'api','notafiscalreferenciada'),(259,'api','numeracao'),(260,'api','ocorrenciafuncionario'),(261,'api','operacao'),(262,'api','operacaonumeracao'),(263,'api','ordemproducao'),(264,'api','ordemservico'),(265,'api','origemlead'),(266,'api','osassinatura'),(267,'api','osfoto'),(268,'api','ositensproduto'),(269,'api','ositensservico'),(270,'api','parcelarecorrencia'),(271,'api','pet'),(350,'api','planosaas'),(272,'api','precoconcorrente'),(273,'api','produto'),(274,'api','produtocomplementar'),(275,'api','produtosimilar'),(276,'api','produtovariacao'),(277,'api','produtovariacaocombinacao'),(278,'api','promocao'),(279,'api','promocaoproduto'),(280,'api','quarto'),(281,'api','recebimentocartao'),(282,'api','registroponto'),(283,'api','regrafiscal'),(284,'api','regrafiscalreforma'),(285,'api','reserva'),(286,'api','saascliente'),(287,'api','saasclientecontrato'),(288,'api','saasclientemensalidade'),(289,'api','safra'),(290,'api','sessaoagendamento'),(291,'api','solicitacaoaprovacao'),(292,'api','splitpaymentconfig'),(293,'api','statusordemservico'),(294,'api','sugestaocfop'),(295,'api','tabelacomercial'),(296,'api','tecnico'),(297,'api','templatecontrato'),(351,'api','terminalativo'),(298,'api','tipoquarto'),(299,'api','tiposervico'),(300,'api','tipotributacao'),(301,'api','transacaomppoint'),(302,'api','tributacaoproduto'),(303,'api','tributacaouf'),(304,'api','troca'),(305,'api','trocaitem'),(306,'api','ttsaudiocache'),(307,'api','useratalho'),(308,'api','userparametros'),(309,'api','userpermissoes'),(310,'api','valoratributovariacao'),(311,'api','veiculo'),(312,'api','veiculonovo'),(313,'api','venda'),(314,'api','vendaentregalog'),(315,'api','vendaitem'),(316,'api','vendasplitpayment'),(317,'api','vendedor'),(318,'api','vendedorfuncoes'),(319,'api','versaosistema'),(320,'api','webhookpixlog'),(173,'auth','group'),(174,'auth','permission'),(175,'auth','user'),(328,'cadastro_clientes','cliente'),(329,'cadastro_clientes','escritoriocontabilidade'),(321,'comandas','comanda'),(322,'comandas','itemcomanda'),(323,'comandas','mesa'),(324,'comandas','pagamentocomanda'),(325,'comandas','transferenciamesa'),(176,'contenttypes','contenttype'),(344,'corsheaders','corsmodel'),(330,'cte','conhecimentotransporte'),(331,'cte','ctecomponentevalor'),(332,'cte','ctedocumento'),(333,'cte','ctedocumentooriginario'),(326,'etiquetas','impressaoetiqueta'),(327,'etiquetas','layoutetiqueta'),(334,'mdfe','manifestoeletronico'),(335,'mdfe','mdfecarregamento'),(336,'mdfe','mdfecondutor'),(337,'mdfe','mdfedescarregamento'),(338,'mdfe','mdfedocumentovinculado'),(339,'mdfe','mdfelacre'),(340,'mdfe','mdfepagamento'),(341,'mdfe','mdfepercurso'),(342,'mdfe','mdfereboque'),(343,'mdfe','mdfevalepedagio'),(177,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=491 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (237,'contenttypes','0001_initial','2026-05-25 11:09:29.176105'),(238,'auth','0001_initial','2026-05-25 11:09:30.159293'),(239,'admin','0001_initial','2026-05-25 11:09:30.364684'),(240,'admin','0002_logentry_remove_auto_add','2026-05-25 11:09:30.373482'),(241,'admin','0003_logentry_add_action_flag_choices','2026-05-25 11:09:30.384201'),(242,'api','0001_initial','2026-05-25 11:09:44.889160'),(243,'mdfe','0001_initial','2026-05-25 11:09:46.836301'),(244,'api','0002_initial','2026-05-25 11:10:05.632320'),(245,'contenttypes','0002_remove_content_type_name','2026-05-25 11:10:05.855119'),(246,'auth','0002_alter_permission_name_max_length','2026-05-25 11:10:06.014698'),(247,'auth','0003_alter_user_email_max_length','2026-05-25 11:10:06.201690'),(248,'auth','0004_alter_user_username_opts','2026-05-25 11:10:06.236002'),(249,'auth','0005_alter_user_last_login_null','2026-05-25 11:10:06.625651'),(250,'auth','0006_require_contenttypes_0002','2026-05-25 11:10:06.632216'),(251,'auth','0007_alter_validators_add_error_messages','2026-05-25 11:10:06.666335'),(252,'auth','0008_alter_user_username_max_length','2026-05-25 11:10:06.904897'),(253,'auth','0009_alter_user_last_name_max_length','2026-05-25 11:10:07.123671'),(254,'auth','0010_alter_group_name_max_length','2026-05-25 11:10:07.214877'),(255,'auth','0011_update_proxy_permissions','2026-05-25 11:10:07.300501'),(256,'auth','0012_alter_user_first_name_max_length','2026-05-25 11:10:07.595868'),(257,'cadastro_clientes','0001_initial','2026-05-25 11:10:07.832253'),(258,'comandas','0001_initial','2026-05-25 11:10:09.520270'),(259,'cte','0001_initial','2026-05-25 11:10:10.955140'),(260,'etiquetas','0001_initial','2026-05-25 11:10:11.614695'),(261,'sessions','0001_initial','2026-05-25 11:10:11.671467'),(262,'api','0001_add_tipo_estoque_incremento','2026-05-26 18:06:06.896372'),(263,'api','0002_financeiroconta','2026-05-26 18:06:06.898884'),(264,'api','0003_centrocusto_contabancaria_departamento_operacao','2026-05-26 18:06:06.901354'),(265,'api','0004_empresaconfig','2026-05-26 18:06:06.903668'),(266,'api','0005_funcao_vendedor_vendedorfuncoes','2026-05-26 18:06:06.906608'),(267,'api','0006_userparametros','2026-05-26 18:06:06.908578'),(268,'api','0007_userpermissoes','2026-05-26 18:06:06.910161'),(269,'api','0008_solicitacao','2026-05-26 18:06:06.912072'),(270,'api','0009_solicitacaoaprovacao_formapagamento_and_more','2026-05-26 18:06:06.913917'),(271,'api','0010_formapagamento_dias_vencimento_and_more','2026-05-26 18:06:06.915455'),(272,'api','0011_delete_formapagamento','2026-05-26 18:06:06.917222'),(273,'api','0012_formapagamento','2026-05-26 18:06:06.919277'),(274,'api','0013_merge','2026-05-26 18:06:06.921983'),(275,'api','0014_create_vendas','2026-05-26 18:06:06.923926'),(276,'api','0014_create_vendas_tables','2026-05-26 18:06:06.925889'),(277,'api','0015_saldo_movimentos_financeiro','2026-05-26 18:06:06.927640'),(278,'api','0016_merge','2026-05-26 18:06:06.929025'),(279,'api','0017_create_unmanaged_tables','2026-05-26 18:06:06.930773'),(280,'api','0018_add_fields_formapagamento','2026-05-26 18:06:06.932489'),(281,'api','0018_create_unmanaged_produtos','2026-05-26 18:06:06.934054'),(282,'api','0019_merge','2026-05-26 18:06:06.936483'),(283,'api','0020_add_operacoes_missing_columns','2026-05-26 18:06:06.938550'),(284,'api','0021_add_vendas_columns','2026-05-26 18:06:06.940572'),(285,'api','0022_add_operacao_incremento','2026-05-26 18:06:06.942665'),(286,'api','0022_merge_20251028_1116','2026-05-26 18:06:06.944546'),(287,'api','0023_create_fornecedores','2026-05-26 18:06:06.945992'),(288,'api','0024_create_compras','2026-05-26 18:06:06.947955'),(289,'api','0025_merge','2026-05-26 18:06:06.951704'),(290,'api','0026_add_id_deposito_baixa','2026-05-26 18:06:06.954394'),(291,'api','0027_alter_operacao_transacao','2026-05-26 18:06:06.957352'),(292,'api','0028_fornecedor_alter_centrocusto_options_and_more','2026-05-26 18:06:06.960711'),(293,'api','0029_safe_financeiro_run_sql','2026-05-26 18:06:06.963158'),(294,'api','0030_add_venda_id_financeiro','2026-05-26 18:06:06.964881'),(295,'api','0031_remover_campos_produto','2026-05-26 18:06:06.967120'),(296,'api','0032_criar_financeiro_bancario','2026-05-26 18:06:06.969377'),(297,'api','0033_catalogoitem','2026-05-26 18:06:06.971445'),(298,'api','0034_alter_catalogoitem_options_alter_catalogoitem_ativo_and_more','2026-05-26 18:06:06.973944'),(299,'api','0035_catalogo_alter_catalogoitem_produto_and_more','2026-05-26 18:06:06.976063'),(300,'api','0036_add_valor_catalogo_field','2026-05-26 18:06:06.978346'),(301,'api','0037_creditocliente_creditoutilizacao_devolucao_and_more','2026-05-26 18:06:06.980128'),(302,'api','0038_alter_creditocliente_devolucao','2026-05-26 18:06:06.982054'),(303,'api','0039_troca_catalogoitem_data_nascimento_and_more','2026-05-26 18:06:06.984596'),(304,'api','0040_alter_operacao_transacao','2026-05-26 18:06:06.986558'),(305,'api','0041_cotacao_cotacaofornecedor_cotacaoitem_and_more','2026-05-26 18:06:06.988743'),(306,'api','0042_add_taxa_entrega_venda','2026-05-26 18:06:06.990865'),(307,'api','0043_alter_contabancaria_options_and_more','2026-05-26 18:06:06.993420'),(308,'api','0044_alter_estoquemovimentacao_options','2026-05-26 18:06:06.995803'),(309,'api','0045_grupoproduto_descricao','2026-05-26 18:06:06.998063'),(310,'api','0046_add_promocao_models','2026-05-26 18:06:07.000748'),(311,'api','0047_promocaoproduto_valor_desconto_produto','2026-05-26 18:06:07.002999'),(312,'api','0048_tiposervico_agendamento_avaliacao_pet_and_more','2026-05-26 18:06:07.004947'),(313,'api','0049_agendamento_preco_total_pacote_and_more','2026-05-26 18:06:07.007339'),(314,'api','0050_add_permissions_fields','2026-05-26 18:06:07.009290'),(315,'api','0051_logauditoria','2026-05-26 18:06:07.011255'),(316,'api','0052_alter_compra_options_alter_compraitem_options_and_more','2026-05-26 18:06:07.013479'),(317,'api','0053_alter_produto_imagem_url','2026-05-26 18:06:07.015230'),(318,'api','0054_operacao_baixa_automatica_and_more','2026-05-26 18:06:07.017648'),(319,'api','0055_ordemservico_ordemservicoitem','2026-05-26 18:06:07.020070'),(320,'api','0056_ositensproduto_ositensservico_statusordemservico_and_more','2026-05-26 18:06:07.022229'),(321,'api','0057_compra_data_entrada','2026-05-26 18:06:07.024051'),(322,'api','0058_cheque_operacao_entrega_futura_and_more','2026-05-26 18:06:07.026489'),(323,'api','0059_equipamento_aluguel','2026-05-26 18:06:07.028674'),(324,'api','0060_rename_equipamento_codigo_4e0430_idx_equipamento_codigo_5c9cc6_idx_and_more','2026-05-26 18:06:07.030678'),(325,'api','0061_add_aluguel_origem_financeiro','2026-05-26 18:06:07.032463'),(326,'api','0062_aluguelitem_and_more','2026-05-26 18:06:07.035135'),(327,'api','0063_configuracaocontrato','2026-05-26 18:06:07.037450'),(328,'api','0064_alter_configuracaocontrato_options_and_more','2026-05-26 18:06:07.039450'),(329,'api','0065_alter_produto_classificacao','2026-05-26 18:06:07.041463'),(330,'api','0066_alter_produto_classificacao','2026-05-26 18:06:07.043945'),(331,'api','0067_alter_produto_classificacao','2026-05-26 18:06:07.045868'),(332,'api','0068_tributacaoproduto','2026-05-26 18:06:07.047424'),(333,'api','0069_add_qrcode_nfe','2026-05-26 18:06:07.049011'),(334,'api','0070_alter_financeiroconta_status_conta','2026-05-26 18:06:07.051328'),(335,'api','0071_venda_especie_volumes_venda_marca_volumes_and_more','2026-05-26 18:06:07.053460'),(336,'api','0072_venda_observacao_contribuinte','2026-05-26 18:06:07.056578'),(337,'api','0073_veiculo_atributovariacao_safra_and_more','2026-05-26 18:06:07.059984'),(338,'api','0074_conjuntooperacao','2026-05-26 18:06:07.063809'),(339,'api','0075_configuracaoproduto','2026-05-26 18:06:07.066643'),(340,'api','0076_configuracaoproduto_controlar_lote_validade_and_more','2026-05-26 18:06:07.069456'),(341,'api','0077_configuracaoproduto_produto_em_grade','2026-05-26 18:06:07.071738'),(342,'api','0078_venda_mensagem_nfe_controlecaixa','2026-05-26 18:06:07.074750'),(343,'api','0079_movimentacaocaixa_venda_mensagem_nfe','2026-05-26 18:06:07.077662'),(344,'api','0080_alter_empresaconfig_options','2026-05-26 18:06:07.080115'),(345,'api','0081_empresaconfig_ambiente_cte_and_more','2026-05-26 18:06:07.082208'),(346,'api','0082_add_sped_config_fields','2026-05-26 18:06:07.084110'),(347,'api','0083_add_sped_contribuicoes_fields','2026-05-26 18:06:07.086316'),(348,'api','0084_add_cfop_tributacao_produto','2026-05-26 18:06:07.088530'),(349,'api','0085_add_csosn_cfop_entrada_tributacao','2026-05-26 18:06:07.090945'),(350,'api','0086_add_regra_fiscal_matriz','2026-05-26 18:06:07.093296'),(351,'api','0087_add_regra_fiscal_split_tipocliente','2026-05-26 18:06:07.095919'),(352,'api','0088_add_fiscal_fields_venda_item','2026-05-26 18:06:07.098017'),(353,'api','0089_tributacaoproduto_add_csosn','2026-05-26 18:06:07.099975'),(354,'api','0090_tributacaoproduto_add_sn_fields','2026-05-26 18:06:07.102399'),(355,'api','0091_remove_tributacao_info_produto','2026-05-26 18:06:07.104612'),(356,'api','0092_fix_classificacao_fiscal_maxlength','2026-05-26 18:06:07.107064'),(357,'api','0093_produto_gtin','2026-05-26 18:06:07.109447'),(358,'api','0094_manifestacao_nfe','2026-05-26 18:06:07.112731'),(359,'api','0095_compra_xml_conteudo','2026-05-26 18:06:07.114788'),(360,'api','0096_add_tributacao_padrao_to_config_produto','2026-05-26 18:06:07.116764'),(361,'api','0097_add_clinica_veterinaria','2026-05-26 18:06:07.119403'),(362,'api','0098_add_agro_operacional','2026-05-26 18:06:07.121616'),(363,'api','0099_add_carta_correcao_nfe','2026-05-26 18:06:07.124130'),(364,'api','0100_produto_metragem_caixa_produto_peso_unitario_and_more','2026-05-26 18:06:07.126648'),(365,'api','0101_produto_metragem_caixa_produto_peso_unitario_and_more','2026-05-26 18:06:07.128696'),(366,'api','0102_useratalho','2026-05-26 18:06:07.130482'),(367,'api','0103_veterinario_pet_especie_pet_microchip_and_more','2026-05-26 18:06:07.131858'),(368,'api','0104_configuracaobalanca_exportacaobalanca_produtobalanca','2026-05-26 18:06:07.134460'),(369,'api','0105_add_xml_conteudo_to_compra','2026-05-26 18:06:07.136571'),(370,'api','0106_create_conta_servico','2026-05-26 18:06:07.138698'),(371,'api','0107_formapagamento_dias_repasse_and_more','2026-05-26 18:06:07.140958'),(372,'api','0108_venda_chave_nfe_referenciada','2026-05-26 18:06:07.143830'),(373,'api','0109_sequencial_nfe_e_chave_devolucao','2026-05-26 18:06:07.146180'),(374,'api','0110_reforma_tributaria_split_payment_completo','2026-05-26 18:06:07.147678'),(375,'api','0111_add_limite_desconto_percentual_operacao','2026-05-26 18:06:07.149976'),(376,'api','0112_add_whatsapp_supervisor_user_parametros','2026-05-26 18:06:07.152696'),(377,'api','0113_configuracaowhatsapp_filawhatsapp_logwhatsapp_and_more','2026-05-26 18:06:07.155249'),(378,'api','0114_modulos_mapa_carga_pcp_boletos','2026-05-26 18:06:07.157219'),(379,'api','0115_boleto_config_conta_bancaria','2026-05-26 18:06:07.159888'),(380,'api','0116_boleto_baixa_automatica_e_data_pagamento','2026-05-26 18:06:07.162286'),(381,'api','0117_boleto_rastreio_baixa_api','2026-05-26 18:06:07.164273'),(382,'api','0118_operacao_numeracao','2026-05-26 18:06:07.168002'),(383,'api','0119_restore_produto_fields','2026-05-26 18:06:07.171474'),(384,'api','0120_adicionar_campo_material_construcao','2026-05-26 18:06:07.174452'),(385,'api','0121_update_mapa_carga_schema','2026-05-26 18:06:07.177274'),(386,'api','0122_adicionar_campos_tributacao_config_produto','2026-05-26 18:06:07.179984'),(387,'api','0123_adicionar_campos_sn_tributacao_produto','2026-05-26 18:06:07.181641'),(388,'api','0124_add_chave_nfe_referenciada_to_venda','2026-05-26 18:06:07.183974'),(389,'api','0125_add_split_payment_to_venda_item','2026-05-26 18:06:07.186669'),(390,'api','0126_add_fiscal_fields_to_venda_item','2026-05-26 18:06:07.189191'),(391,'api','0127_add_numeracao_table','2026-05-26 18:06:07.191737'),(392,'api','0128_add_numeracao_fk_to_operacao','2026-05-26 18:06:07.196316'),(393,'api','0129_reforma_2026_split_payment','2026-05-26 18:06:07.199866'),(394,'api','0130_sistema_email_multi_provedor','2026-05-26 18:06:07.202623'),(395,'api','0131_venda_veiculo_novo_e_veiculonovo','2026-05-26 18:06:07.205029'),(396,'api','0132_produto_campos_argamassa','2026-05-26 18:06:07.207165'),(397,'api','0133_produto_complementar_m2m','2026-05-26 18:06:07.209601'),(398,'api','0134_add_categoria_produto','2026-05-26 18:06:07.212276'),(399,'api','0135_faturamento_avancado','2026-05-26 18:06:07.216130'),(400,'api','0136_operacao_tipo_faturamento','2026-05-26 18:06:07.219270'),(401,'api','0137_contaservico_and_more','2026-05-26 18:06:07.221971'),(402,'api','0138_alter_userpermissoes_options','2026-05-26 18:06:07.224458'),(403,'api','0139_add_faturamento_permissions','2026-05-26 18:06:07.227109'),(404,'api','0140_marketplaceconfig_alter_userpermissoes_options_and_more','2026-05-26 18:06:07.229820'),(405,'api','0141_configuracao_impressao','2026-05-26 18:06:07.233121'),(406,'api','0142_controla_lote_produto_id_lote_vendaitem','2026-05-26 18:06:07.235337'),(407,'api','0143_categoriamercadologica_classificacaoia_and_more','2026-05-26 18:06:07.237555'),(408,'api','0144_manifestacaonfe','2026-05-26 18:06:07.239835'),(409,'api','0145_novos_modulos','2026-05-26 18:06:07.241966'),(410,'api','0146_add_matricula_to_funcionario','2026-05-26 18:06:07.244036'),(411,'api','0147_add_ocorrencia_funcionario','2026-05-26 18:06:07.246533'),(412,'api','0148_pcp_modelos','2026-05-26 18:06:07.248690'),(413,'api','0149_add_performance_indexes','2026-05-26 18:06:07.250914'),(414,'api','0150_add_produto_search_indexes','2026-05-26 18:06:07.252815'),(415,'api','0151_cliente_ativo_inativacao','2026-05-26 18:06:07.254832'),(416,'api','0152_allow_blank_descricao_recorrencia','2026-05-26 18:06:07.256678'),(417,'api','0153_add_fcp_aliq_regra_fiscal','2026-05-26 18:06:07.259050'),(418,'api','0154_tipo_tributacao_uf','2026-05-26 18:06:07.261666'),(419,'api','0155_produto_similar','2026-05-26 18:06:07.263611'),(420,'api','0156_produto_cest','2026-05-26 18:06:07.265438'),(421,'api','0157_os_foto_assinatura','2026-05-26 18:06:07.267722'),(422,'api','0158_venda_entrega_log','2026-05-26 18:06:07.269937'),(423,'api','0159_add_conciliado_to_financeiro_bancario','2026-05-26 18:06:07.272041'),(424,'api','0160_mp_point_integracao','2026-05-26 18:06:07.273987'),(425,'api','0161_forma_pagamento_tipo_integracao','2026-05-26 18:06:07.276930'),(426,'api','0162_forma_pagamento_taxa_repasse','2026-05-26 18:06:07.279203'),(427,'api','0163_produto_genero','2026-05-26 18:06:07.280900'),(428,'api','0164_fornecedor_produto_fracao','2026-05-26 18:06:07.284090'),(429,'api','0165_adicionar_fracao_aplicada_compra_item','2026-05-26 18:06:07.287420'),(430,'api','0166_user_preferencia','2026-05-26 18:06:07.290666'),(431,'api','0167_add_a4_fotos_impressora','2026-05-26 18:06:07.293701'),(432,'api','0168_nfe_aproveitamento_icms','2026-05-26 18:06:07.295676'),(433,'api','0169_operacao_finalidade_emissao','2026-05-26 18:06:07.297662'),(434,'api','0170_operacao_tipo_desconto','2026-05-26 18:06:07.299867'),(435,'api','0171_cliente_novos_campos_desconto','2026-05-26 18:06:07.302364'),(436,'api','0172_alter_userpreferencia_unique_together_and_more','2026-05-26 18:06:07.304428'),(437,'api','0173_clientegrupoexcecao_produto_localizacao_and_more','2026-05-26 18:06:07.306926'),(438,'api','0174_quarto_tipoquarto_reserva_consumoquarto_quarto_tipo','2026-05-26 18:06:07.309514'),(439,'api','0175_comodidade_quarto_comodidades','2026-05-26 18:06:07.311881'),(440,'api','0176_venda_chave_nfse_venda_data_emissao_nfse_and_more','2026-05-26 18:06:07.313481'),(441,'api','0177_add_hotelaria_parametros','2026-05-26 18:06:07.315319'),(442,'api','0178_ttsaudiocache_venda_valor_desconto','2026-05-26 18:06:07.317841'),(443,'api','0179_saascliente_venda_valor_desconto_saasclientecontrato_and_more','2026-05-26 18:06:07.319800'),(444,'api','0180_merge_20260526_1050','2026-05-26 18:06:07.321855'),(445,'api','0181_saascliente_db_host_saascliente_db_port_and_more','2026-05-26 18:06:07.323801'),(446,'api','0182_saascliente_bairro_saascliente_cep_and_more','2026-05-26 18:06:07.326187'),(447,'api','0183_saascliente_fix_missing_0181_columns','2026-05-26 18:06:07.328281'),(448,'comandas','0009_adicionar_fracao_aplicada_compra_item','2026-05-26 18:08:17.821498'),(449,'comandas','0007_comanda_id_operacao_nfce','2026-05-26 18:08:17.828721'),(450,'comandas','0008_comanda_id_vendedor','2026-05-26 18:08:17.831983'),(451,'comandas','0002_initial_comandas','2026-05-26 18:08:17.835030'),(452,'comandas','0004_remove_unique_numero','2026-05-26 18:08:17.839541'),(453,'comandas','0005_alter_comanda_forma_pagamento','2026-05-26 18:08:17.843888'),(454,'comandas','0003_comanda_forma_pagamento','2026-05-26 18:08:17.848056'),(455,'comandas','0006_pagamentocomanda','2026-05-26 18:08:17.851446'),(456,'etiquetas','0002_impressaoetiqueta_cliente_id','2026-05-26 18:08:17.854051'),(457,'cadastro_clientes','0002_alter_cliente_cnpj_alter_cliente_cpf_and_more','2026-05-26 18:08:17.857176'),(458,'cte','0002_conhecimentotransporte_cidade_destino_ibge_and_more','2026-05-26 18:08:17.859416'),(459,'cte','0003_conhecimentotransporte_cst_icms_and_more','2026-05-26 18:08:17.861282'),(460,'cte','0005_ctedocumento','2026-05-26 18:08:17.863363'),(461,'cte','0006_conhecimentotransporte_tipo_servico','2026-05-26 18:08:17.865219'),(462,'cte','0007_conhecimentotransporte_qrcode_url','2026-05-26 18:08:17.867369'),(463,'cte','0004_conhecimentotransporte_componente_frete_peso_and_more','2026-05-26 18:08:17.869800'),(464,'mdfe','0004_mdfecarregamento_municipio_cep_and_more','2026-05-26 18:08:17.872258'),(465,'mdfe','0003_manifestoeletronico_averbacao_and_more','2026-05-26 18:08:17.874629'),(466,'mdfe','0002_adicionar_campos_moc_v3','2026-05-26 18:08:17.877072'),(467,'api','0184_versaosistema_historicoatualizacao','2026-05-26 18:14:00.226645'),(468,'api','0185_configuracaoagendamento','2026-05-27 12:42:51.292429'),(469,'api','0186_saascliente_banco_criado','2026-05-27 13:17:19.993960'),(470,'api','0187_add_saas_permissions','2026-05-27 13:17:20.389831'),(471,'cte','0008_conhecimentotransporte_ciot_and_more','2026-05-29 12:31:37.513891'),(472,'api','0188_templatecontrato','2026-05-31 12:21:53.520020'),(473,'api','0189_add_habilitar_central_saas','2026-05-31 12:21:53.660393'),(474,'api','0188_saascliente_contrato_pendente_and_more','2026-06-03 13:28:23.315135'),(475,'api','0189_contratopadrao','2026-06-03 13:28:23.352124'),(476,'api','0190_merge_20260530_1132','2026-06-03 13:28:23.360267'),(477,'corsheaders','0001_initial','2026-06-03 13:28:39.791368'),(478,'mdfe','0005_manifestoeletronico_ciot_cpf_cnpj_and_more','2026-06-03 13:28:40.337159'),(479,'api','0191_comunicadosaas_licenca_delete_templatecontrato','2026-06-22 19:39:19.540642'),(480,'api','0192_licenca_comunicadosaas_imagem','2026-06-22 19:39:19.588358'),(481,'api','0193_licenca_gabaritocustomizado','2026-06-22 19:39:19.703115'),(482,'api','0194_configuracaoimpressao_gabarito_customizado_nome_and_more','2026-06-22 19:39:19.749323'),(483,'api','0195_linkcadastroremoto','2026-06-22 19:39:19.805017'),(484,'api','0196_planosaas_licenca_recursos_planos_and_more','2026-06-22 19:39:20.558955'),(485,'api','0197_alter_configuracaobancaria_banco','2026-06-22 19:39:20.593373'),(486,'api','0198_saascliente_limite_maquinas_terminalativo','2026-06-22 19:39:20.984728'),(487,'api','0199_boleto_atualizado_em_boleto_criado_em_and_more','2026-06-22 19:39:21.261593'),(488,'api','0200_boleto_atualizado_em_boleto_criado_em_and_more','2026-06-22 19:40:54.826847'),(489,'api','0201_add_saascliente_link_acesso','2026-06-22 19:41:12.449927'),(490,'corsheaders','0002_alter_corsmodel_id','2026-06-22 19:41:12.562696');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_campaigns`
--

DROP TABLE IF EXISTS `email_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_campaigns` (
  `id_campanha` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `destinatarios_query` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `lista_emails` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `segmento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_agendamento` datetime(6) DEFAULT NULL,
  `data_inicio_envio` datetime(6) DEFAULT NULL,
  `data_fim_envio` datetime(6) DEFAULT NULL,
  `total_destinatarios` int NOT NULL,
  `total_enviados` int NOT NULL,
  `total_abertos` int NOT NULL,
  `total_cliques` int NOT NULL,
  `total_bounces` int NOT NULL,
  `total_cancelados` int NOT NULL,
  `is_ab_test` tinyint(1) NOT NULL,
  `ab_test_percentage` int NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `empresa_id` int NOT NULL,
  `usuario_criador_id` int DEFAULT NULL,
  `template_id` int NOT NULL,
  PRIMARY KEY (`id_campanha`),
  KEY `email_campaigns_template_id_fde1c227_fk_email_tem` (`template_id`),
  KEY `email_campaigns_empresa_id_ccea8eed_fk_empresa_config_id_empresa` (`empresa_id`),
  KEY `email_campaigns_usuario_criador_id_169d83ac_fk_auth_user_id` (`usuario_criador_id`),
  CONSTRAINT `email_campaigns_empresa_id_ccea8eed_fk_empresa_config_id_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresa_config` (`id_empresa`),
  CONSTRAINT `email_campaigns_template_id_fde1c227_fk_email_tem` FOREIGN KEY (`template_id`) REFERENCES `email_templates` (`id_template`),
  CONSTRAINT `email_campaigns_usuario_criador_id_169d83ac_fk_auth_user_id` FOREIGN KEY (`usuario_criador_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_campaigns`
--

LOCK TABLES `email_campaigns` WRITE;
/*!40000 ALTER TABLE `email_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_config`
--

DROP TABLE IF EXISTS `email_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_config` (
  `id_config` int NOT NULL AUTO_INCREMENT,
  `provider` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1) NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `smtp_host` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtp_port` int DEFAULT NULL,
  `smtp_username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtp_password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtp_use_tls` tinyint(1) NOT NULL,
  `smtp_use_ssl` tinyint(1) NOT NULL,
  `api_key` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `api_secret` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `api_region` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `api_domain` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reply_to_email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `daily_limit` int NOT NULL,
  `daily_sent_count` int NOT NULL,
  `last_reset_date` date NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `empresa_id` int NOT NULL,
  PRIMARY KEY (`id_config`),
  UNIQUE KEY `email_config_empresa_id_provider_from_email_867ec70d_uniq` (`empresa_id`,`provider`,`from_email`),
  CONSTRAINT `email_config_empresa_id_2adc5f7c_fk_empresa_config_id_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresa_config` (`id_empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_config`
--

LOCK TABLES `email_config` WRITE;
/*!40000 ALTER TABLE `email_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_logs`
--

DROP TABLE IF EXISTS `email_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_logs` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `destinatario_email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `destinatario_nome` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assunto` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `html_body` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `text_body` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `anexos` json DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_message_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `erro_mensagem` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tentativas_envio` int NOT NULL,
  `data_envio` datetime(6) DEFAULT NULL,
  `data_abertura` datetime(6) DEFAULT NULL,
  `total_aberturas` int NOT NULL,
  `data_primeiro_clique` datetime(6) DEFAULT NULL,
  `total_cliques` int NOT NULL,
  `user_agent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` char(39) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `campanha_id` int DEFAULT NULL,
  `cliente_id` int DEFAULT NULL,
  `config_id` int DEFAULT NULL,
  `empresa_id` int NOT NULL,
  `template_id` int DEFAULT NULL,
  PRIMARY KEY (`id_log`),
  KEY `email_logs_cliente_id_e6669abb_fk_clientes_id_cliente` (`cliente_id`),
  KEY `email_logs_config_id_87c7f9e5_fk_email_config_id_config` (`config_id`),
  KEY `email_logs_empresa_id_9c79390f_fk_empresa_config_id_empresa` (`empresa_id`),
  KEY `email_logs_template_id_95b198eb_fk_email_templates_id_template` (`template_id`),
  KEY `email_logs_destina_9214ea_idx` (`destinatario_email`,`status`),
  KEY `email_logs_campanh_4352a0_idx` (`campanha_id`,`status`),
  KEY `email_logs_provide_200de5_idx` (`provider_message_id`),
  CONSTRAINT `email_logs_campanha_id_e2b4a795_fk_email_campaigns_id_campanha` FOREIGN KEY (`campanha_id`) REFERENCES `email_campaigns` (`id_campanha`),
  CONSTRAINT `email_logs_cliente_id_e6669abb_fk_clientes_id_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `email_logs_config_id_87c7f9e5_fk_email_config_id_config` FOREIGN KEY (`config_id`) REFERENCES `email_config` (`id_config`),
  CONSTRAINT `email_logs_empresa_id_9c79390f_fk_empresa_config_id_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresa_config` (`id_empresa`),
  CONSTRAINT `email_logs_template_id_95b198eb_fk_email_templates_id_template` FOREIGN KEY (`template_id`) REFERENCES `email_templates` (`id_template`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_logs`
--

LOCK TABLES `email_logs` WRITE;
/*!40000 ALTER TABLE `email_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_templates`
--

DROP TABLE IF EXISTS `email_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_templates` (
  `id_template` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `assunto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `html_body` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `text_body` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `variaveis_disponiveis` json DEFAULT NULL,
  `preview_text` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `design_json` json DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `empresa_id` int NOT NULL,
  `usuario_criador_id` int DEFAULT NULL,
  PRIMARY KEY (`id_template`),
  UNIQUE KEY `email_templates_empresa_id_slug_9eb5c177_uniq` (`empresa_id`,`slug`),
  KEY `email_templates_usuario_criador_id_1fef27c9_fk_auth_user_id` (`usuario_criador_id`),
  KEY `email_templates_slug_fc55cdb6` (`slug`),
  CONSTRAINT `email_templates_empresa_id_2985f448_fk_empresa_config_id_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresa_config` (`id_empresa`),
  CONSTRAINT `email_templates_usuario_criador_id_1fef27c9_fk_auth_user_id` FOREIGN KEY (`usuario_criador_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_templates`
--

LOCK TABLES `email_templates` WRITE;
/*!40000 ALTER TABLE `email_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresa_config`
--

DROP TABLE IF EXISTS `empresa_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresa_config` (
  `id_empresa` int NOT NULL AUTO_INCREMENT,
  `nome_razao_social` varchar(255) NOT NULL,
  `nome_fantasia` varchar(255) DEFAULT NULL,
  `cpf_cnpj` varchar(18) NOT NULL,
  `inscricao_estadual` varchar(20) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `numero` varchar(20) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL COMMENT 'URL para o logotipo da empresa',
  `regime_tributario` varchar(20) DEFAULT 'SIMPLES',
  `certificado_digital` longtext,
  `senha_certificado` varchar(100) DEFAULT NULL,
  `csc_token_id` varchar(10) DEFAULT NULL,
  `csc_token_codigo` varchar(100) DEFAULT NULL,
  `ambiente_nfce` varchar(1) DEFAULT '2',
  `valor_maximo_nfce` decimal(10,2) DEFAULT '10000.00',
  `inscricao_municipal` varchar(20) DEFAULT NULL,
  `ambiente_nfe` varchar(1) DEFAULT '2',
  `ambiente_cte` varchar(1) DEFAULT '2',
  `ultimo_numero_dps` int DEFAULT '0',
  `serie_dps` varchar(5) DEFAULT '1',
  `ambiente_nfse` varchar(1) DEFAULT '2',
  `codigo_municipio_ibge` varchar(7) DEFAULT '3550308',
  `controle_de_caixa` tinyint(1) DEFAULT '0',
  `sped_aproveita_credito_icms` tinyint(1) NOT NULL,
  `sped_bloco_k_deposito` varchar(100) DEFAULT NULL,
  `sped_bloco_k_grupo` varchar(100) DEFAULT NULL,
  `sped_bloco_k_leiaute` varchar(100) DEFAULT NULL,
  `sped_bloco_k_preco` varchar(100) DEFAULT NULL,
  `sped_centro_custo_credito` varchar(100) DEFAULT NULL,
  `sped_centro_custo_debito` varchar(100) DEFAULT NULL,
  `sped_finalidade` varchar(1) NOT NULL,
  `sped_gerar_bloco_c` tinyint(1) NOT NULL,
  `sped_gerar_bloco_c_vazio` tinyint(1) NOT NULL,
  `sped_gerar_bloco_d` tinyint(1) NOT NULL,
  `sped_gerar_bloco_e` tinyint(1) NOT NULL,
  `sped_gerar_bloco_g` tinyint(1) NOT NULL,
  `sped_gerar_bloco_h` tinyint(1) NOT NULL,
  `sped_gerar_bloco_k` tinyint(1) NOT NULL,
  `sped_operacao_bloco_1` varchar(100) DEFAULT NULL,
  `sped_operacao_entrada_bloco_0` varchar(100) DEFAULT NULL,
  `sped_operacao_entrada_bloco_c` varchar(100) DEFAULT NULL,
  `sped_operacao_entrada_bloco_d` varchar(100) DEFAULT NULL,
  `sped_operacao_saida_bloco_0` varchar(100) DEFAULT NULL,
  `sped_operacao_saida_bloco_c` varchar(100) DEFAULT NULL,
  `sped_operacao_saida_bloco_d` varchar(100) DEFAULT NULL,
  `sped_verifica_contingencia` tinyint(1) NOT NULL,
  `sped_versao` varchar(3) NOT NULL,
  `sped_conjuntos_selecionados` varchar(500) DEFAULT NULL COMMENT 'IDs dos conjuntos de opera├º├úo separados por v├¡rgula',
  `sped_diretorio_saida` varchar(500) DEFAULT NULL COMMENT 'Caminho completo do diret├│rio para salvar arquivos SPED',
  `cpf_responsavel` varchar(14) DEFAULT NULL,
  `contador_nome` varchar(255) DEFAULT NULL,
  `contador_cpf` varchar(14) DEFAULT NULL,
  `contador_crc` varchar(15) DEFAULT NULL,
  `contador_cnpj` varchar(20) DEFAULT NULL,
  `contador_cep` varchar(10) DEFAULT NULL,
  `contador_endereco` varchar(255) DEFAULT NULL,
  `contador_numero` varchar(10) DEFAULT NULL,
  `contador_complemento` varchar(60) DEFAULT NULL,
  `contador_bairro` varchar(60) DEFAULT NULL,
  `contador_fone` varchar(15) DEFAULT NULL,
  `contador_fax` varchar(15) DEFAULT NULL,
  `contador_email` varchar(255) DEFAULT NULL,
  `contador_cod_mun` varchar(7) DEFAULT NULL,
  `codigo_receita_icms` varchar(10) DEFAULT NULL,
  `ind_perfil` varchar(1) DEFAULT 'A',
  `ind_atividade` varchar(1) DEFAULT '1',
  `natureza_juridica` varchar(10) DEFAULT '',
  `cnae` varchar(10) DEFAULT '',
  `ind_nat_pj` varchar(2) DEFAULT '05',
  `suframa` varchar(9) DEFAULT NULL,
  `crt` varchar(1) DEFAULT '1',
  `sped_contrib_conjuntos` varchar(500) DEFAULT NULL,
  `sped_contrib_diretorio` varchar(500) DEFAULT 'C:\\SPED\\CONTRIBUICOES\\',
  `sped_contrib_blocos` varchar(50) DEFAULT 'C,F,M',
  `regime_apuracao_pis_cofins` varchar(1) DEFAULT '2',
  `regime_cred_pis_cofins` varchar(1) DEFAULT '1',
  `aliquota_pis_padrao` decimal(5,2) DEFAULT '1.65',
  `aliquota_cofins_padrao` decimal(5,2) DEFAULT '7.60',
  `sped_contrib_versao` varchar(10) DEFAULT '135',
  `sped_icms_versao` varchar(10) DEFAULT '020',
  `sped_icms_exportar_xml` tinyint(1) DEFAULT '0',
  `sped_icms_gerar_relatorio` tinyint(1) DEFAULT '0',
  `sped_contrib_exportar_xml` tinyint(1) DEFAULT '0',
  `sped_contrib_gerar_relatorio` tinyint(1) DEFAULT '0',
  `sped_habilitar_icms` tinyint(1) DEFAULT '1',
  `sped_habilitar_contrib` tinyint(1) DEFAULT '1',
  `sped_gerar_contribuicoes_junto` tinyint(1) DEFAULT '0',
  `codigo_receita_pis` varchar(10) DEFAULT NULL,
  `codigo_receita_cofins` varchar(10) DEFAULT NULL,
  `ambiente_mdfe` varchar(1) DEFAULT '2' COMMENT 'Ambiente de emiss├úo MDF-e (Manifesto)',
  `rntrc_empresa` varchar(8) DEFAULT NULL COMMENT 'Registro Nacional de Transportadores (8 d├¡gitos)',
  `serie_mdfe` varchar(3) DEFAULT '1' COMMENT 'S├®rie padr├úo para emiss├úo de MDF-e',
  `ultimo_numero_mdfe` int DEFAULT '0' COMMENT '├Ültimo n├║mero de MDF-e emitido',
  `ultimo_numero_nfe` int NOT NULL DEFAULT '0' COMMENT '├Ültimo n├║mero de NF-e emitido (contador global por CNPJ/S├®rie)',
  `serie_nfe_padrao` varchar(3) NOT NULL DEFAULT '1' COMMENT 'S├®rie padr├úo para emiss├úo de NF-e',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `nfe_aproveitamento_icms_aliquota` decimal(7,4) DEFAULT NULL,
  `nfe_aproveitamento_icms_mensagem` longtext,
  `nfe_aproveitamento_icms_csosns` varchar(100) DEFAULT NULL,
  `nfe_aproveitamento_icms_ativo` tinyint(1) NOT NULL,
  `habilitar_central_saas` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id_empresa`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresa_config`
--

LOCK TABLES `empresa_config` WRITE;
/*!40000 ALTER TABLE `empresa_config` DISABLE KEYS */;
INSERT INTO `empresa_config` VALUES (8,'AMERPUS INFORMATICA LTDA','AMERPUS INFORMATICA','16501387000108',NULL,'AVENIDA PADRE MATIAS','1490','SAO CRISTOVAO','PATROCINIO','MG','38742220','(34) 3832-1282','escritoriojmferreira2@gmail.com',NULL,'SIMPLES',NULL,NULL,NULL,NULL,'2',10000.00,NULL,'2','2',0,'1','2','3550308',0,1,NULL,NULL,NULL,NULL,NULL,NULL,'0',1,0,0,1,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'020',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'A','1',NULL,NULL,'05',NULL,'1',NULL,'C:\\SPED\\CONTRIBUICOES\\','C,F,M','2','1',1.65,7.60,'135','020',0,0,0,0,1,1,0,NULL,NULL,'2',NULL,'1',0,0,'1',NULL,NULL,0.0000,NULL,NULL,0,0);
/*!40000 ALTER TABLE `empresa_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipamentos`
--

DROP TABLE IF EXISTS `equipamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipamentos` (
  `id_equipamento` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int DEFAULT NULL,
  `descricao_equipamento` varchar(255) NOT NULL,
  `marca` varchar(100) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `numero_serie` varchar(100) DEFAULT NULL,
  `data_aquisicao` date DEFAULT NULL,
  `localizacao` varchar(100) DEFAULT NULL,
  `observacoes` text,
  PRIMARY KEY (`id_equipamento`),
  UNIQUE KEY `numero_serie_UNIQUE` (`numero_serie`),
  KEY `fk_equipamentos_cliente_idx` (`id_cliente`),
  CONSTRAINT `fk_equipamentos_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipamentos`
--

LOCK TABLES `equipamentos` WRITE;
/*!40000 ALTER TABLE `equipamentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipamentos_aluguel`
--

DROP TABLE IF EXISTS `equipamentos_aluguel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipamentos_aluguel` (
  `id_equipamento` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `categoria` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marca` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_serie` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_diaria` decimal(10,2) NOT NULL,
  `valor_semanal` decimal(10,2) DEFAULT NULL,
  `valor_mensal` decimal(10,2) DEFAULT NULL,
  `imagem_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_cadastro` datetime(6) NOT NULL,
  `data_atualizacao` datetime(6) NOT NULL,
  PRIMARY KEY (`id_equipamento`),
  UNIQUE KEY `codigo` (`codigo`),
  UNIQUE KEY `numero_serie` (`numero_serie`),
  KEY `equipamento_codigo_5c9cc6_idx` (`codigo`),
  KEY `equipamento_status_a0834d_idx` (`status`),
  KEY `equipamento_categor_0bf4cf_idx` (`categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipamentos_aluguel`
--

LOCK TABLES `equipamentos_aluguel` WRITE;
/*!40000 ALTER TABLE `equipamentos_aluguel` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipamentos_aluguel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `escritorio_contabilidade`
--

DROP TABLE IF EXISTS `escritorio_contabilidade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `escritorio_contabilidade` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cnpj` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `razao_social` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contador` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cnpj` (`cnpj`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `escritorio_contabilidade`
--

LOCK TABLES `escritorio_contabilidade` WRITE;
/*!40000 ALTER TABLE `escritorio_contabilidade` DISABLE KEYS */;
/*!40000 ALTER TABLE `escritorio_contabilidade` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estoque`
--

DROP TABLE IF EXISTS `estoque`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estoque` (
  `id_estoque` int NOT NULL AUTO_INCREMENT,
  `quantidade` decimal(15,3) NOT NULL,
  `quantidade_minima` decimal(15,3) NOT NULL,
  `quantidade_maxima` decimal(15,3) DEFAULT NULL,
  `custo_medio` decimal(15,4) NOT NULL,
  `valor_total` decimal(15,2) NOT NULL,
  `valor_venda` decimal(15,2) NOT NULL,
  `valor_ultima_compra` decimal(15,2) NOT NULL,
  `data_ultima_entrada` datetime(6) DEFAULT NULL,
  `data_ultima_saida` datetime(6) DEFAULT NULL,
  `data_criacao` datetime(6) DEFAULT NULL,
  `data_modificacao` datetime(6) NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `id_deposito` int NOT NULL,
  `id_produto` int NOT NULL,
  `id_variacao` int DEFAULT NULL,
  PRIMARY KEY (`id_estoque`),
  UNIQUE KEY `estoque_id_produto_id_deposito_e149fcbf_uniq` (`id_produto`,`id_deposito`),
  KEY `estoque_id_deposito_d35a1061_fk_deposito_id` (`id_deposito`),
  KEY `estoque_id_variacao_fba2c662_fk_produtos_variacoes_id_variacao` (`id_variacao`),
  CONSTRAINT `estoque_id_deposito_d35a1061_fk_deposito_id` FOREIGN KEY (`id_deposito`) REFERENCES `deposito` (`id`),
  CONSTRAINT `estoque_id_produto_edda5563_fk_produtos_id_produto` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`),
  CONSTRAINT `estoque_id_variacao_fba2c662_fk_produtos_variacoes_id_variacao` FOREIGN KEY (`id_variacao`) REFERENCES `produtos_variacoes` (`id_variacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estoque`
--

LOCK TABLES `estoque` WRITE;
/*!40000 ALTER TABLE `estoque` DISABLE KEYS */;
/*!40000 ALTER TABLE `estoque` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estoque_movimentacoes`
--

DROP TABLE IF EXISTS `estoque_movimentacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estoque_movimentacoes` (
  `id_movimentacao` int NOT NULL AUTO_INCREMENT,
  `tipo_movimentacao` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantidade_anterior` decimal(15,3) NOT NULL,
  `quantidade_movimentada` decimal(15,3) NOT NULL,
  `quantidade_atual` decimal(15,3) NOT NULL,
  `custo_unitario` decimal(15,4) NOT NULL,
  `valor_total` decimal(15,2) NOT NULL,
  `documento_numero` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `documento_tipo` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_documento_origem` int DEFAULT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `usuario_responsavel` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_movimentacao` datetime(6) NOT NULL,
  `id_deposito` int NOT NULL,
  `id_estoque` int NOT NULL,
  `id_produto` int NOT NULL,
  PRIMARY KEY (`id_movimentacao`),
  KEY `estoque_movimentacoes_id_deposito_6d3e725b_fk_deposito_id` (`id_deposito`),
  KEY `estoque_movimentacoes_id_estoque_2574709e_fk_estoque_id_estoque` (`id_estoque`),
  KEY `estoque_movimentacoes_id_produto_844ce190_fk_produtos_id_produto` (`id_produto`),
  CONSTRAINT `estoque_movimentacoes_id_deposito_6d3e725b_fk_deposito_id` FOREIGN KEY (`id_deposito`) REFERENCES `deposito` (`id`),
  CONSTRAINT `estoque_movimentacoes_id_estoque_2574709e_fk_estoque_id_estoque` FOREIGN KEY (`id_estoque`) REFERENCES `estoque` (`id_estoque`),
  CONSTRAINT `estoque_movimentacoes_id_produto_844ce190_fk_produtos_id_produto` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estoque_movimentacoes`
--

LOCK TABLES `estoque_movimentacoes` WRITE;
/*!40000 ALTER TABLE `estoque_movimentacoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `estoque_movimentacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exames_laboratoriais`
--

DROP TABLE IF EXISTS `exames_laboratoriais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exames_laboratoriais` (
  `id_exame` int NOT NULL AUTO_INCREMENT,
  `tipo_exame` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_solicitacao` date NOT NULL,
  `data_resultado` date DEFAULT NULL,
  `laboratorio` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resultado` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `valor` decimal(10,2) NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_cadastro` datetime(6) NOT NULL,
  `id_consulta` int DEFAULT NULL,
  `id_pet` int NOT NULL,
  `id_veterinario` int DEFAULT NULL,
  PRIMARY KEY (`id_exame`),
  KEY `exames_laboratoriais_id_veterinario_45e80e5c_fk_veterinar` (`id_veterinario`),
  KEY `exames_labo_id_pet_8bcd51_idx` (`id_pet`,`status`),
  KEY `exames_labo_id_cons_6adbb0_idx` (`id_consulta`),
  CONSTRAINT `exames_laboratoriais_id_consulta_a24c7a85_fk_consultas` FOREIGN KEY (`id_consulta`) REFERENCES `consultas_veterinarias` (`id_consulta`),
  CONSTRAINT `exames_laboratoriais_id_pet_4de122d4_fk_petshop_pets_id_pet` FOREIGN KEY (`id_pet`) REFERENCES `petshop_pets` (`id_pet`),
  CONSTRAINT `exames_laboratoriais_id_veterinario_45e80e5c_fk_veterinar` FOREIGN KEY (`id_veterinario`) REFERENCES `veterinarios` (`id_veterinario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exames_laboratoriais`
--

LOCK TABLES `exames_laboratoriais` WRITE;
/*!40000 ALTER TABLE `exames_laboratoriais` DISABLE KEYS */;
/*!40000 ALTER TABLE `exames_laboratoriais` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exportacao_balanca`
--

DROP TABLE IF EXISTS `exportacao_balanca`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exportacao_balanca` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `arquivo_gerado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantidade_produtos` int NOT NULL,
  `formato` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `conteudo_arquivo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tamanho_bytes` int NOT NULL,
  `data_exportacao` datetime(6) NOT NULL,
  `configuracao_id` bigint NOT NULL,
  `usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `exportacao_balanca_configuracao_id_221b3e82_fk_configura` (`configuracao_id`),
  KEY `exportacao_balanca_usuario_id_e8ae97dc_fk_auth_user_id` (`usuario_id`),
  CONSTRAINT `exportacao_balanca_configuracao_id_221b3e82_fk_configura` FOREIGN KEY (`configuracao_id`) REFERENCES `configuracao_balanca` (`id`),
  CONSTRAINT `exportacao_balanca_usuario_id_e8ae97dc_fk_auth_user_id` FOREIGN KEY (`usuario_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exportacao_balanca`
--

LOCK TABLES `exportacao_balanca` WRITE;
/*!40000 ALTER TABLE `exportacao_balanca` DISABLE KEYS */;
/*!40000 ALTER TABLE `exportacao_balanca` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fila_whatsapp`
--

DROP TABLE IF EXISTS `fila_whatsapp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fila_whatsapp` (
  `id` int NOT NULL AUTO_INCREMENT,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensagem` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_envio` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'manual' COMMENT 'manual, agro_safra, nfe, nfce, cte, vendas, marketing',
  `id_relacionado` int DEFAULT NULL COMMENT 'ID do registro relacionado (safra, venda, nfe, etc)',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pendente' COMMENT 'pendente, enviado, falha, cancelado',
  `tentativas` int DEFAULT '0',
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_envio` datetime DEFAULT NULL,
  `erro_mensagem` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `prioridade` int DEFAULT '5' COMMENT '1=alta, 5=normal, 10=baixa',
  `nome_destinatario` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_usuario_criador` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_data_criacao` (`data_criacao`),
  KEY `idx_prioridade` (`prioridade`),
  KEY `idx_tipo_envio` (`tipo_envio`),
  KEY `id_usuario_criador` (`id_usuario_criador`),
  CONSTRAINT `fila_whatsapp_ibfk_1` FOREIGN KEY (`id_usuario_criador`) REFERENCES `auth_user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fila_whatsapp`
--

LOCK TABLES `fila_whatsapp` WRITE;
/*!40000 ALTER TABLE `fila_whatsapp` DISABLE KEYS */;
/*!40000 ALTER TABLE `fila_whatsapp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `financeiro_bancario`
--

DROP TABLE IF EXISTS `financeiro_bancario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `financeiro_bancario` (
  `id_movimento` int NOT NULL AUTO_INCREMENT,
  `tipo_movimento` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_pagamento` date NOT NULL,
  `valor_movimento` decimal(15,2) NOT NULL,
  `descricao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `documento_numero` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `forma_pagamento` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conciliado` tinyint(1) NOT NULL,
  `data_criacao` datetime(6) NOT NULL,
  `id_cliente_fornecedor` int DEFAULT NULL,
  `id_conta_bancaria` int NOT NULL,
  PRIMARY KEY (`id_movimento`),
  KEY `financeiro_bancario_id_cliente_fornecedo_a67e7360_fk_clientes_` (`id_cliente_fornecedor`),
  KEY `financeiro_bancario_id_conta_bancaria_9071007f_fk_contas_ba` (`id_conta_bancaria`),
  CONSTRAINT `financeiro_bancario_id_cliente_fornecedo_a67e7360_fk_clientes_` FOREIGN KEY (`id_cliente_fornecedor`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `financeiro_bancario_id_conta_bancaria_9071007f_fk_contas_ba` FOREIGN KEY (`id_conta_bancaria`) REFERENCES `contas_bancarias` (`id_conta_bancaria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financeiro_bancario`
--

LOCK TABLES `financeiro_bancario` WRITE;
/*!40000 ALTER TABLE `financeiro_bancario` DISABLE KEYS */;
/*!40000 ALTER TABLE `financeiro_bancario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `financeiro_cartoes`
--

DROP TABLE IF EXISTS `financeiro_cartoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `financeiro_cartoes` (
  `id_recebimento` int NOT NULL AUTO_INCREMENT,
  `data_venda` date NOT NULL,
  `valor_bruto` decimal(12,2) NOT NULL,
  `taxa_percentual` decimal(5,2) NOT NULL,
  `valor_taxa` decimal(12,2) NOT NULL,
  `valor_liquido` decimal(12,2) NOT NULL,
  `data_previsao` date NOT NULL,
  `data_pagamento` date DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bandeira` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_cartao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nsu` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codigo_autorizacao` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `id_financeiro` int DEFAULT NULL,
  `id_venda` int DEFAULT NULL,
  PRIMARY KEY (`id_recebimento`),
  KEY `financeiro_cartoes_id_financeiro_599ac3f0_fk_financeir` (`id_financeiro`),
  KEY `financeiro_cartoes_id_venda_2bcbec89_fk_vendas_id_venda` (`id_venda`),
  CONSTRAINT `financeiro_cartoes_id_financeiro_599ac3f0_fk_financeir` FOREIGN KEY (`id_financeiro`) REFERENCES `financeiro_contas` (`id_conta`),
  CONSTRAINT `financeiro_cartoes_id_venda_2bcbec89_fk_vendas_id_venda` FOREIGN KEY (`id_venda`) REFERENCES `vendas` (`id_venda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financeiro_cartoes`
--

LOCK TABLES `financeiro_cartoes` WRITE;
/*!40000 ALTER TABLE `financeiro_cartoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `financeiro_cartoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `financeiro_contas`
--

DROP TABLE IF EXISTS `financeiro_contas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `financeiro_contas` (
  `id_conta` int NOT NULL AUTO_INCREMENT,
  `tipo_conta` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_parcela` decimal(10,2) NOT NULL,
  `valor_liquidado` decimal(10,2) DEFAULT NULL,
  `valor_juros` decimal(10,2) DEFAULT NULL,
  `valor_multa` decimal(10,2) DEFAULT NULL,
  `valor_desconto` decimal(10,2) DEFAULT NULL,
  `data_emissao` date NOT NULL,
  `data_vencimento` date NOT NULL,
  `data_pagamento` date DEFAULT NULL,
  `status_conta` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `forma_pagamento` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_venda_origem` int DEFAULT NULL,
  `id_compra_origem` int DEFAULT NULL,
  `id_os_origem` int DEFAULT NULL,
  `documento_numero` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parcela_numero` int DEFAULT NULL,
  `parcela_total` int DEFAULT NULL,
  `id_aluguel_origem` int DEFAULT NULL,
  `gerencial` int DEFAULT NULL,
  `id_centro_custo` int DEFAULT NULL,
  `id_cliente_fornecedor` int DEFAULT NULL,
  `id_conta_baixa` int DEFAULT NULL,
  `id_conta_cobranca` int DEFAULT NULL,
  `id_contrato_agricola` int DEFAULT NULL,
  `id_departamento` int DEFAULT NULL,
  `id_operacao` int DEFAULT NULL,
  `id_safra` int DEFAULT NULL,
  PRIMARY KEY (`id_conta`),
  KEY `financeiro_contas_id_centro_custo_8a61a940_fk_centro_cu` (`id_centro_custo`),
  KEY `financeiro_contas_id_cliente_fornecedo_b392747c_fk_clientes_` (`id_cliente_fornecedor`),
  KEY `financeiro_contas_id_conta_baixa_d058831d_fk_contas_ba` (`id_conta_baixa`),
  KEY `financeiro_contas_id_conta_cobranca_f935050f_fk_contas_ba` (`id_conta_cobranca`),
  KEY `financeiro_contas_id_contrato_agricola_26528683_fk_contratos` (`id_contrato_agricola`),
  KEY `financeiro_contas_id_departamento_827d34d7_fk_departame` (`id_departamento`),
  KEY `financeiro_contas_id_operacao_fdd12515_fk_operacoes_id_operacao` (`id_operacao`),
  KEY `financeiro_contas_id_safra_27fd5d41_fk_safras_id_safra` (`id_safra`),
  CONSTRAINT `financeiro_contas_id_centro_custo_8a61a940_fk_centro_cu` FOREIGN KEY (`id_centro_custo`) REFERENCES `centro_custo` (`id_centro_custo`),
  CONSTRAINT `financeiro_contas_id_cliente_fornecedo_b392747c_fk_clientes_` FOREIGN KEY (`id_cliente_fornecedor`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `financeiro_contas_id_conta_baixa_d058831d_fk_contas_ba` FOREIGN KEY (`id_conta_baixa`) REFERENCES `contas_bancarias` (`id_conta_bancaria`),
  CONSTRAINT `financeiro_contas_id_conta_cobranca_f935050f_fk_contas_ba` FOREIGN KEY (`id_conta_cobranca`) REFERENCES `contas_bancarias` (`id_conta_bancaria`),
  CONSTRAINT `financeiro_contas_id_contrato_agricola_26528683_fk_contratos` FOREIGN KEY (`id_contrato_agricola`) REFERENCES `contratos_agricolas` (`id_contrato`),
  CONSTRAINT `financeiro_contas_id_departamento_827d34d7_fk_departame` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`),
  CONSTRAINT `financeiro_contas_id_operacao_fdd12515_fk_operacoes_id_operacao` FOREIGN KEY (`id_operacao`) REFERENCES `operacoes` (`id_operacao`),
  CONSTRAINT `financeiro_contas_id_safra_27fd5d41_fk_safras_id_safra` FOREIGN KEY (`id_safra`) REFERENCES `safras` (`id_safra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financeiro_contas`
--

LOCK TABLES `financeiro_contas` WRITE;
/*!40000 ALTER TABLE `financeiro_contas` DISABLE KEYS */;
/*!40000 ALTER TABLE `financeiro_contas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formas_pagamento`
--

DROP TABLE IF EXISTS `formas_pagamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formas_pagamento` (
  `id_forma_pagamento` int NOT NULL AUTO_INCREMENT,
  `nome_forma` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dias_vencimento` int DEFAULT NULL,
  `codigo_t_pag` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_integracao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `taxa_operadora` decimal(5,2) DEFAULT NULL,
  `dias_repasse` int DEFAULT NULL,
  `id_centro_custo` int DEFAULT NULL,
  `id_conta_padrao` int DEFAULT NULL,
  `id_departamento` int DEFAULT NULL,
  PRIMARY KEY (`id_forma_pagamento`),
  UNIQUE KEY `nome_forma` (`nome_forma`),
  KEY `formas_pagamento_id_centro_custo_660457a5_fk_centro_cu` (`id_centro_custo`),
  KEY `formas_pagamento_id_conta_padrao_5028467c_fk_contas_ba` (`id_conta_padrao`),
  KEY `formas_pagamento_id_departamento_e1ab57c1_fk_departame` (`id_departamento`),
  CONSTRAINT `formas_pagamento_id_centro_custo_660457a5_fk_centro_cu` FOREIGN KEY (`id_centro_custo`) REFERENCES `centro_custo` (`id_centro_custo`),
  CONSTRAINT `formas_pagamento_id_conta_padrao_5028467c_fk_contas_ba` FOREIGN KEY (`id_conta_padrao`) REFERENCES `contas_bancarias` (`id_conta_bancaria`),
  CONSTRAINT `formas_pagamento_id_departamento_e1ab57c1_fk_departame` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formas_pagamento`
--

LOCK TABLES `formas_pagamento` WRITE;
/*!40000 ALTER TABLE `formas_pagamento` DISABLE KEYS */;
/*!40000 ALTER TABLE `formas_pagamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fornecedores`
--

DROP TABLE IF EXISTS `fornecedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fornecedores` (
  `id_fornecedor` int NOT NULL AUTO_INCREMENT,
  `nome_razao_social` varchar(255) NOT NULL,
  `nome_fantasia` varchar(255) DEFAULT NULL,
  `cpf_cnpj` varchar(18) NOT NULL,
  `inscricao_estadual` varchar(20) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `numero` varchar(20) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `limite_credito` decimal(10,2) DEFAULT '0.00',
  `logo_url` varchar(500) DEFAULT NULL,
  `data_cadastro` datetime DEFAULT CURRENT_TIMESTAMP,
  `codigo_municipio_ibge` varchar(7) DEFAULT NULL,
  PRIMARY KEY (`id_fornecedor`),
  UNIQUE KEY `cpf_cnpj` (`cpf_cnpj`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fornecedores`
--

LOCK TABLES `fornecedores` WRITE;
/*!40000 ALTER TABLE `fornecedores` DISABLE KEYS */;
/*!40000 ALTER TABLE `fornecedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `funcoes`
--

DROP TABLE IF EXISTS `funcoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `funcoes` (
  `id_funcao` int NOT NULL AUTO_INCREMENT,
  `nome_funcao` varchar(100) NOT NULL,
  PRIMARY KEY (`id_funcao`),
  UNIQUE KEY `nome_funcao_UNIQUE` (`nome_funcao`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `funcoes`
--

LOCK TABLES `funcoes` WRITE;
/*!40000 ALTER TABLE `funcoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `funcoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grupos_produto`
--

DROP TABLE IF EXISTS `grupos_produto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grupos_produto` (
  `id_grupo` int NOT NULL AUTO_INCREMENT,
  `nome_grupo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_grupo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grupos_produto`
--

LOCK TABLES `grupos_produto` WRITE;
/*!40000 ALTER TABLE `grupos_produto` DISABLE KEYS */;
/*!40000 ALTER TABLE `grupos_produto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historico_whatsapp`
--

DROP TABLE IF EXISTS `historico_whatsapp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historico_whatsapp` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_fila` int NOT NULL,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensagem` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_envio` datetime DEFAULT CURRENT_TIMESTAMP,
  `tempo_resposta_ms` int DEFAULT NULL,
  `erro_detalhado` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_data_envio` (`data_envio`),
  KEY `idx_telefone` (`telefone`),
  KEY `id_fila` (`id_fila`),
  CONSTRAINT `historico_whatsapp_ibfk_1` FOREIGN KEY (`id_fila`) REFERENCES `fila_whatsapp` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico_whatsapp`
--

LOCK TABLES `historico_whatsapp` WRITE;
/*!40000 ALTER TABLE `historico_whatsapp` DISABLE KEYS */;
/*!40000 ALTER TABLE `historico_whatsapp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotel_comodidade`
--

DROP TABLE IF EXISTS `hotel_comodidade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotel_comodidade` (
  `id_comodidade` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_comodidade`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotel_comodidade`
--

LOCK TABLES `hotel_comodidade` WRITE;
/*!40000 ALTER TABLE `hotel_comodidade` DISABLE KEYS */;
/*!40000 ALTER TABLE `hotel_comodidade` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotel_consumo`
--

DROP TABLE IF EXISTS `hotel_consumo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotel_consumo` (
  `id_consumo` int NOT NULL AUTO_INCREMENT,
  `quantidade` decimal(10,3) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `valor_total` decimal(12,2) NOT NULL,
  `data_lancamento` datetime(6) NOT NULL,
  `observacao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `produto_id` int NOT NULL,
  `reserva_id` int NOT NULL,
  PRIMARY KEY (`id_consumo`),
  KEY `hotel_consumo_produto_id_7b9f6ead_fk_produtos_id_produto` (`produto_id`),
  KEY `hotel_consumo_reserva_id_77048467_fk_hotel_reserva_id_reserva` (`reserva_id`),
  CONSTRAINT `hotel_consumo_produto_id_7b9f6ead_fk_produtos_id_produto` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id_produto`),
  CONSTRAINT `hotel_consumo_reserva_id_77048467_fk_hotel_reserva_id_reserva` FOREIGN KEY (`reserva_id`) REFERENCES `hotel_reserva` (`id_reserva`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotel_consumo`
--

LOCK TABLES `hotel_consumo` WRITE;
/*!40000 ALTER TABLE `hotel_consumo` DISABLE KEYS */;
/*!40000 ALTER TABLE `hotel_consumo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotel_quarto`
--

DROP TABLE IF EXISTS `hotel_quarto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotel_quarto` (
  `id_quarto` int NOT NULL AUTO_INCREMENT,
  `numero_quarto` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_atual` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacidade_adultos` int unsigned NOT NULL,
  `capacidade_criancas` int unsigned NOT NULL,
  `tipo_id` int NOT NULL,
  PRIMARY KEY (`id_quarto`),
  UNIQUE KEY `numero_quarto` (`numero_quarto`),
  KEY `hotel_quarto_tipo_id_31515fd4_fk_hotel_tip` (`tipo_id`),
  CONSTRAINT `hotel_quarto_tipo_id_31515fd4_fk_hotel_tip` FOREIGN KEY (`tipo_id`) REFERENCES `hotel_tipo_quarto` (`id_tipo_quarto`),
  CONSTRAINT `hotel_quarto_chk_1` CHECK ((`capacidade_adultos` >= 0)),
  CONSTRAINT `hotel_quarto_chk_2` CHECK ((`capacidade_criancas` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotel_quarto`
--

LOCK TABLES `hotel_quarto` WRITE;
/*!40000 ALTER TABLE `hotel_quarto` DISABLE KEYS */;
INSERT INTO `hotel_quarto` VALUES (1,'101','disponivel',2,1,1),(2,'102','disponivel',2,1,1),(3,'103','sujo',2,1,1),(4,'201','ocupado',2,2,2),(5,'202','disponivel',2,2,2),(6,'301','disponivel',3,2,3),(7,'302','manutencao',3,2,3);
/*!40000 ALTER TABLE `hotel_quarto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotel_quarto_comodidade`
--

DROP TABLE IF EXISTS `hotel_quarto_comodidade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotel_quarto_comodidade` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quarto_id` int NOT NULL,
  `comodidade_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hotel_quarto_comodidade_quarto_id_comodidade_id_8b653618_uniq` (`quarto_id`,`comodidade_id`),
  KEY `hotel_quarto_comodid_comodidade_id_3882e608_fk_hotel_com` (`comodidade_id`),
  CONSTRAINT `hotel_quarto_comodid_comodidade_id_3882e608_fk_hotel_com` FOREIGN KEY (`comodidade_id`) REFERENCES `hotel_comodidade` (`id_comodidade`),
  CONSTRAINT `hotel_quarto_comodid_quarto_id_53728d8b_fk_hotel_qua` FOREIGN KEY (`quarto_id`) REFERENCES `hotel_quarto` (`id_quarto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotel_quarto_comodidade`
--

LOCK TABLES `hotel_quarto_comodidade` WRITE;
/*!40000 ALTER TABLE `hotel_quarto_comodidade` DISABLE KEYS */;
/*!40000 ALTER TABLE `hotel_quarto_comodidade` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotel_reserva`
--

DROP TABLE IF EXISTS `hotel_reserva`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotel_reserva` (
  `id_reserva` int NOT NULL AUTO_INCREMENT,
  `data_entrada_prevista` datetime(6) NOT NULL,
  `data_saida_prevista` datetime(6) NOT NULL,
  `data_checkin_real` datetime(6) DEFAULT NULL,
  `data_checkout_real` datetime(6) DEFAULT NULL,
  `status_reserva` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_diaria_aplicada` decimal(10,2) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_criacao` datetime(6) NOT NULL,
  `data_atualizacao` datetime(6) NOT NULL,
  `hospede_id` int NOT NULL,
  `quarto_id` int NOT NULL,
  `venda_id` int DEFAULT NULL,
  PRIMARY KEY (`id_reserva`),
  KEY `hotel_reserva_hospede_id_66917e78_fk_clientes_id_cliente` (`hospede_id`),
  KEY `hotel_reserva_quarto_id_38678c68_fk_hotel_quarto_id_quarto` (`quarto_id`),
  KEY `hotel_reserva_venda_id_11361b69_fk_vendas_id_venda` (`venda_id`),
  CONSTRAINT `hotel_reserva_hospede_id_66917e78_fk_clientes_id_cliente` FOREIGN KEY (`hospede_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `hotel_reserva_quarto_id_38678c68_fk_hotel_quarto_id_quarto` FOREIGN KEY (`quarto_id`) REFERENCES `hotel_quarto` (`id_quarto`),
  CONSTRAINT `hotel_reserva_venda_id_11361b69_fk_vendas_id_venda` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id_venda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotel_reserva`
--

LOCK TABLES `hotel_reserva` WRITE;
/*!40000 ALTER TABLE `hotel_reserva` DISABLE KEYS */;
/*!40000 ALTER TABLE `hotel_reserva` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotel_tipo_quarto`
--

DROP TABLE IF EXISTS `hotel_tipo_quarto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotel_tipo_quarto` (
  `id_tipo_quarto` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `valor_diaria_padrao` decimal(10,2) NOT NULL,
  `limite_adultos` int unsigned NOT NULL,
  `limite_criancas` int unsigned NOT NULL,
  PRIMARY KEY (`id_tipo_quarto`),
  UNIQUE KEY `nome` (`nome`),
  CONSTRAINT `hotel_tipo_quarto_chk_1` CHECK ((`limite_adultos` >= 0)),
  CONSTRAINT `hotel_tipo_quarto_chk_2` CHECK ((`limite_criancas` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotel_tipo_quarto`
--

LOCK TABLES `hotel_tipo_quarto` WRITE;
/*!40000 ALTER TABLE `hotel_tipo_quarto` DISABLE KEYS */;
INSERT INTO `hotel_tipo_quarto` VALUES (1,'Standard Casal','Quarto aconchegante com cama de casal, frigobar, ar condicionado e TV.',160.00,2,1),(2,'Deluxe Duplo','Quarto espaçoso com cama king, sacada, smart TV e frigobar cortesia.',260.00,2,2),(3,'Suíte Master Imperial','Suíte presidencial com banheira de hidromassagem, closet e sala de estar.',490.00,3,2);
/*!40000 ALTER TABLE `hotel_tipo_quarto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `impressoes_etiqueta`
--

DROP TABLE IF EXISTS `impressoes_etiqueta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `impressoes_etiqueta` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `produtos` json NOT NULL,
  `cliente_id` int DEFAULT NULL,
  `quantidade_total` int NOT NULL,
  `data_impressao` datetime(6) NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `layout_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `impressoes_etiqueta_usuario_id_504741f4_fk_auth_user_id` (`usuario_id`),
  KEY `impressoes_etiqueta_layout_id_b85843c3_fk_layouts_etiqueta_id` (`layout_id`),
  CONSTRAINT `impressoes_etiqueta_layout_id_b85843c3_fk_layouts_etiqueta_id` FOREIGN KEY (`layout_id`) REFERENCES `layouts_etiqueta` (`id`),
  CONSTRAINT `impressoes_etiqueta_usuario_id_504741f4_fk_auth_user_id` FOREIGN KEY (`usuario_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `impressoes_etiqueta`
--

LOCK TABLES `impressoes_etiqueta` WRITE;
/*!40000 ALTER TABLE `impressoes_etiqueta` DISABLE KEYS */;
/*!40000 ALTER TABLE `impressoes_etiqueta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `informacoes_produto_api`
--

DROP TABLE IF EXISTS `informacoes_produto_api`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `informacoes_produto_api` (
  `produto_id` int NOT NULL,
  `fonte_api` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dados_completos_json` json DEFAULT NULL,
  `imagem_url_externa` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descricao_api` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `marca_api` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria_sugerida` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_sincronizacao` datetime(6) NOT NULL,
  `data_criacao` datetime(6) NOT NULL,
  `confianca_dados` decimal(3,2) NOT NULL,
  `usuario_sincronizacao_id` int DEFAULT NULL,
  PRIMARY KEY (`produto_id`),
  KEY `informacoes_produto__usuario_sincronizaca_e4037eb8_fk_auth_user` (`usuario_sincronizacao_id`),
  CONSTRAINT `informacoes_produto__produto_id_df7fb33b_fk_produtos_` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id_produto`),
  CONSTRAINT `informacoes_produto__usuario_sincronizaca_e4037eb8_fk_auth_user` FOREIGN KEY (`usuario_sincronizacao_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `informacoes_produto_api`
--

LOCK TABLES `informacoes_produto_api` WRITE;
/*!40000 ALTER TABLE `informacoes_produto_api` DISABLE KEYS */;
/*!40000 ALTER TABLE `informacoes_produto_api` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internacoes`
--

DROP TABLE IF EXISTS `internacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internacoes` (
  `id_internacao` int NOT NULL AUTO_INCREMENT,
  `motivo` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao_motivo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_entrada` datetime(6) NOT NULL,
  `data_alta` datetime(6) DEFAULT NULL,
  `numero_baia` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dieta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `medicamentos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `valor_diaria` decimal(10,2) NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `data_cadastro` datetime(6) NOT NULL,
  `data_modificacao` datetime(6) NOT NULL,
  `id_cliente` int NOT NULL,
  `id_pet` int NOT NULL,
  `id_veterinario` int DEFAULT NULL,
  PRIMARY KEY (`id_internacao`),
  KEY `internacoes_id_cliente_1e0bacae_fk_clientes_id_cliente` (`id_cliente`),
  KEY `internacoes_id_veterinario_8bc280e3_fk_veterinar` (`id_veterinario`),
  KEY `internacoes_id_pet_fb8148_idx` (`id_pet`,`data_alta`),
  CONSTRAINT `internacoes_id_cliente_1e0bacae_fk_clientes_id_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `internacoes_id_pet_a28d6608_fk_petshop_pets_id_pet` FOREIGN KEY (`id_pet`) REFERENCES `petshop_pets` (`id_pet`),
  CONSTRAINT `internacoes_id_veterinario_8bc280e3_fk_veterinar` FOREIGN KEY (`id_veterinario`) REFERENCES `veterinarios` (`id_veterinario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internacoes`
--

LOCK TABLES `internacoes` WRITE;
/*!40000 ALTER TABLE `internacoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `internacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itens_comanda`
--

DROP TABLE IF EXISTS `itens_comanda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itens_comanda` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quantidade` decimal(10,3) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `comanda_id` bigint NOT NULL,
  `produto_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `itens_comanda_comanda_id_c86a234a_fk_comandas_id` (`comanda_id`),
  KEY `itens_comanda_produto_id_3893c68e_fk_produtos_id_produto` (`produto_id`),
  CONSTRAINT `itens_comanda_comanda_id_c86a234a_fk_comandas_id` FOREIGN KEY (`comanda_id`) REFERENCES `comandas` (`id`),
  CONSTRAINT `itens_comanda_produto_id_3893c68e_fk_produtos_id_produto` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itens_comanda`
--

LOCK TABLES `itens_comanda` WRITE;
/*!40000 ALTER TABLE `itens_comanda` DISABLE KEYS */;
/*!40000 ALTER TABLE `itens_comanda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `layouts_etiqueta`
--

DROP TABLE IF EXISTS `layouts_etiqueta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `layouts_etiqueta` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome_layout` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tamanho_papel` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `largura_papel` decimal(6,2) NOT NULL,
  `altura_papel` decimal(6,2) NOT NULL,
  `largura_etiqueta` decimal(6,2) NOT NULL,
  `altura_etiqueta` decimal(6,2) NOT NULL,
  `colunas` int NOT NULL,
  `linhas` int NOT NULL,
  `margem_superior` decimal(6,2) NOT NULL,
  `margem_inferior` decimal(6,2) NOT NULL,
  `margem_esquerda` decimal(6,2) NOT NULL,
  `margem_direita` decimal(6,2) NOT NULL,
  `espaco_horizontal` decimal(6,2) NOT NULL,
  `espaco_vertical` decimal(6,2) NOT NULL,
  `campos_visiveis` json NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `usuario_criacao_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `layouts_etiqueta_usuario_criacao_id_e3645008_fk_auth_user_id` (`usuario_criacao_id`),
  CONSTRAINT `layouts_etiqueta_usuario_criacao_id_e3645008_fk_auth_user_id` FOREIGN KEY (`usuario_criacao_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `layouts_etiqueta`
--

LOCK TABLES `layouts_etiqueta` WRITE;
/*!40000 ALTER TABLE `layouts_etiqueta` DISABLE KEYS */;
/*!40000 ALTER TABLE `layouts_etiqueta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `licenca`
--

DROP TABLE IF EXISTS `licenca`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `licenca` (
  `id_licenca` int NOT NULL AUTO_INCREMENT,
  `chave_licenca` varchar(255) NOT NULL,
  `data_validade` date NOT NULL,
  `ultimo_check` timestamp NULL DEFAULT NULL,
  `status` enum('Ativa','Vencida','Bloqueada') NOT NULL DEFAULT 'Ativa',
  `recursos_planos` json DEFAULT NULL,
  PRIMARY KEY (`id_licenca`),
  UNIQUE KEY `chave_licenca_UNIQUE` (`chave_licenca`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `licenca`
--

LOCK TABLES `licenca` WRITE;
/*!40000 ALTER TABLE `licenca` DISABLE KEYS */;
INSERT INTO `licenca` VALUES (1,'APERUS_LOCAL_LICENSE_KEY','2026-06-26','2026-06-23 17:09:22','Ativa','{\"limite_maquinas\": 5, \"modulos_liberados\": {\"pdv\": true, \"ciot\": false, \"producao\": false, \"transporte\": false, \"report_builder\": false, \"financeiro_avancado\": false}, \"terminais_autorizados\": [\"4C4C4544-0053-3710-8036-B2C04F593533\"]}');
/*!40000 ALTER TABLE `licenca` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_auditoria`
--

DROP TABLE IF EXISTS `log_auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_auditoria` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `usuario_nome` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_acao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modulo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tabela` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registro_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dados_anteriores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `dados_novos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_hora` datetime(6) NOT NULL,
  `id_user` int DEFAULT NULL,
  PRIMARY KEY (`id_log`),
  KEY `log_auditoria_data_hora_61f93e3d` (`data_hora`),
  KEY `log_auditor_data_ho_b3d8dc_idx` (`data_hora` DESC),
  KEY `log_auditor_id_user_8c5abb_idx` (`id_user`,`data_hora` DESC),
  KEY `log_auditor_modulo_ed306e_idx` (`modulo`,`data_hora` DESC),
  KEY `log_auditor_tipo_ac_bcca8c_idx` (`tipo_acao`,`data_hora` DESC),
  CONSTRAINT `log_auditoria_id_user_f0e66ae0_fk_auth_user_id` FOREIGN KEY (`id_user`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1568 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_auditoria`
--

LOCK TABLES `log_auditoria` WRITE;
/*!40000 ALTER TABLE `log_auditoria` DISABLE KEYS */;
INSERT INTO `log_auditoria` VALUES (36,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:31:27.958074',3),(37,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:31:57.807191',3),(38,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:32:28.598162',3),(39,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:32:59.604852',3),(40,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:33:30.380485',3),(41,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:34:01.184377',3),(42,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:34:31.875555',3),(43,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:35:02.707954',3),(44,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:35:33.426659',3),(45,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:36:04.157001',3),(46,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:36:34.804767',3),(47,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:37:05.588527',3),(48,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:37:36.495634',3),(49,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:38:07.327044',3),(50,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:38:38.071280',3),(51,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:39:08.946875',3),(52,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:39:39.548076',3),(53,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:40:10.450978',3),(54,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:40:41.156709',3),(55,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:41:11.929822',3),(56,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:41:42.631590',3),(57,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:42:12.645574',3),(58,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:42:36.979294',3),(59,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:43:06.905103',3),(60,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:43:36.929773',3),(61,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:44:07.410331',3),(62,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:44:38.174867',3),(63,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:45:08.813862',3),(64,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,'{\"nome\": \"Standard Casal\", \"descricao\": \"Quarto aconchegante com cama de casal, frigobar, ar condicionado e TV.\", \"valor_diaria_padrao\": 160, \"limite_adultos\": 2, \"limite_criancas\": 1}','38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:45:29.511194',3),(65,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,'{\"nome\": \"Deluxe Duplo\", \"descricao\": \"Quarto espaçoso com cama king, sacada, smart TV e frigobar cortesia.\", \"valor_diaria_padrao\": 260, \"limite_adultos\": 2, \"limite_criancas\": 2}','38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:45:29.577920',3),(66,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,'{\"nome\": \"Suíte Master Imperial\", \"descricao\": \"Suíte presidencial com banheira de hidromassagem, closet e sala de estar.\", \"valor_diaria_padrao\": 490, \"limite_adultos\": 3, \"limite_criancas\": 2}','38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:45:29.643067',3),(67,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,'{\"numero_quarto\": \"101\", \"tipo\": 1, \"status_atual\": \"disponivel\", \"capacidade_adultos\": 2, \"capacidade_criancas\": 1}','38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:45:29.720098',3),(68,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,'{\"numero_quarto\": \"102\", \"tipo\": 1, \"status_atual\": \"disponivel\", \"capacidade_adultos\": 2, \"capacidade_criancas\": 1}','38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:45:29.790932',3),(69,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,'{\"numero_quarto\": \"103\", \"tipo\": 1, \"status_atual\": \"sujo\", \"capacidade_adultos\": 2, \"capacidade_criancas\": 1}','38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:45:29.858740',3),(70,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,'{\"numero_quarto\": \"201\", \"tipo\": 2, \"status_atual\": \"ocupado\", \"capacidade_adultos\": 2, \"capacidade_criancas\": 2}','38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:45:29.926600',3),(71,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,'{\"numero_quarto\": \"202\", \"tipo\": 2, \"status_atual\": \"disponivel\", \"capacidade_adultos\": 2, \"capacidade_criancas\": 2}','38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:45:29.993217',3),(72,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,'{\"numero_quarto\": \"301\", \"tipo\": 3, \"status_atual\": \"disponivel\", \"capacidade_adultos\": 3, \"capacidade_criancas\": 2}','38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:45:30.060473',3),(73,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,'{\"numero_quarto\": \"302\", \"tipo\": 3, \"status_atual\": \"manutencao\", \"capacidade_adultos\": 3, \"capacidade_criancas\": 2}','38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:45:30.130064',3),(74,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:45:44.097830',3),(75,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:46:08.844958',3),(76,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:46:39.751956',3),(77,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:47:10.535449',3),(78,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:47:41.441841',3),(79,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:48:12.155125',3),(80,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:48:42.988902',3),(81,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:49:13.634389',3),(82,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:49:44.477806',3),(83,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:50:15.102298',3),(84,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:50:45.792319',3),(85,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:51:16.404860',3),(86,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:51:47.101786',3),(87,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:52:17.746201',3),(88,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:52:48.365746',3),(89,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:53:19.113329',3),(90,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:53:49.803245',3),(91,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:54:20.518654',3),(92,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:54:51.167277',3),(93,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:55:21.760022',3),(94,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:55:52.502506',3),(95,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:56:22.871068',3),(96,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:56:53.555445',3),(97,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:57:24.340265',3),(98,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:57:54.982523',3),(99,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:58:25.420202',3),(100,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:58:56.088088',3),(101,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:59:26.760030',3),(102,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 13:59:57.405991',3),(103,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:00:28.003622',3),(104,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:00:58.708690',3),(105,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:01:29.349387',3),(106,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:01:59.992911',3),(107,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:02:30.743149',3),(108,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:03:01.450286',3),(109,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:03:32.139560',3),(110,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:04:02.772913',3),(111,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:04:33.532172',3),(112,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:05:04.206570',3),(113,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:05:35.006872',3),(114,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:06:05.713964',3),(115,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:06:36.537184',3),(116,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:07:07.274658',3),(117,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:07:38.119635',3),(118,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:08:08.743739',3),(119,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:08:39.325834',3),(120,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:09:10.038290',3),(121,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:09:40.659500',3),(122,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:10:11.542984',3),(123,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:10:42.293493',3),(124,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:11:13.014135',3),(125,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:11:43.663274',3),(126,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:12:14.413671',3),(127,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:12:45.115704',3),(128,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:13:15.910317',3),(129,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:13:46.596276',3),(130,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:14:17.382134',3),(131,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:14:48.032157',3),(132,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:15:18.855981',3),(133,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:15:49.603967',3),(134,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:16:20.441405',3),(135,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:16:51.179781',3),(136,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:17:21.984392',3),(137,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:17:52.703875',3),(138,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:18:23.506115',3),(139,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:18:54.244131',3),(140,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:19:25.115939',3),(141,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:19:55.753284',3),(142,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:20:26.404277',3),(143,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:20:57.162272',3),(144,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:21:27.894012',3),(145,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:21:58.617478',3),(146,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:22:29.292161',3),(147,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:23:00.145245',3),(148,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:23:30.839518',3),(149,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:24:01.587417',3),(150,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:24:32.240034',3),(151,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:25:03.070890',3),(152,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:25:33.792209',3),(153,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:26:04.637878',3),(154,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:26:35.284094',3),(155,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:27:06.125728',3),(156,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:27:36.798650',3),(157,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:28:07.543914',3),(158,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:28:38.276606',3),(159,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:29:09.073216',3),(160,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:29:39.822185',3),(161,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:30:10.751553',3),(162,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:30:41.344512',3),(163,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:31:11.941606',3),(164,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:31:42.822190',3),(165,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:32:13.565407',3),(166,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:32:44.325649',3),(167,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:33:15.040792',3),(168,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:33:45.772619',3),(169,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:34:16.429902',3),(170,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:34:47.232348',3),(171,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:35:17.860348',3),(172,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:35:48.627928',3),(173,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:36:19.320385',3),(174,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:36:50.012161',3),(175,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:37:20.586819',3),(176,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:37:51.421981',3),(177,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:38:22.149110',3),(178,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:38:53.026295',3),(179,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:39:23.796342',3),(180,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:39:54.660139',3),(181,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:40:25.437834',3),(182,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:40:55.405401',3),(183,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:41:26.158477',3),(184,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:41:56.959489',3),(185,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:42:27.800010',3),(186,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:42:58.577855',3),(187,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:43:29.400627',3),(188,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:44:00.082605',3),(189,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:44:30.807746',3),(190,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:45:01.469373',3),(191,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:45:32.316699',3),(192,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:46:03.068573',3),(193,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:46:33.862399',3),(194,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:47:04.528920',3),(195,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:47:35.325596',3),(196,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:48:06.112310',3),(197,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:48:36.944756',3),(198,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:49:07.678827',3),(199,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:49:38.482304',3),(200,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:50:09.228899',3),(201,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:50:40.188965',3),(202,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:51:10.851647',3),(203,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:51:41.764512',3),(204,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:52:12.446447',3),(205,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:52:43.144367',3),(206,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:53:13.980289',3),(207,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:53:44.724762',3),(208,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:54:15.502738',3),(209,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:54:46.088775',3),(210,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:55:16.821164',3),(211,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:55:47.475954',3),(212,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:56:18.270711',3),(213,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:56:48.963510',3),(214,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:57:19.762545',3),(215,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:57:50.425898',3),(216,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:58:21.261940',3),(217,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:58:51.950526',3),(218,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:59:22.690516',3),(219,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 14:59:53.488385',3),(220,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:00:24.323750',3),(221,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:00:55.071117',3),(222,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:01:25.938214',3),(223,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:01:56.640399',3),(224,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:02:27.546326',3),(225,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:02:58.200987',3),(226,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:03:28.874713',3),(227,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:03:59.736757',3),(228,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:04:30.484026',3),(229,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:05:01.214261',3),(230,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:05:31.847062',3),(231,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:06:02.600988',3),(232,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:06:33.228567',3),(233,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:07:04.037009',3),(234,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:07:34.824977',3),(235,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:08:05.652398',3),(236,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:08:36.376109',3),(237,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:09:07.098419',3),(238,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:09:37.776201',3),(239,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:10:08.608920',3),(240,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:10:39.301463',3),(241,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:11:10.110201',3),(242,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:11:40.839927',3),(243,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:12:11.642204',3),(244,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:12:42.363359',3),(245,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:13:13.316877',3),(246,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:13:43.950582',3),(247,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:14:14.568980',3),(248,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:14:45.613846',3),(249,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:15:16.336697',3),(250,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:15:47.049458',3),(251,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:16:17.647873',3),(252,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:16:48.397243',3),(253,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:17:19.199824',3),(254,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:17:49.989492',3),(255,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:18:20.722859',3),(256,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:18:51.553029',3),(257,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:19:22.195015',3),(258,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:19:53.013319',3),(259,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:20:23.686208',3),(260,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:20:54.494760',3),(261,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:21:25.124407',3),(262,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:21:55.941514',3),(263,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:22:26.653220',3),(264,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:22:57.514274',3),(265,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:23:28.213569',3),(266,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:23:59.127763',3),(267,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:24:29.672662',3),(268,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:25:00.340670',3),(269,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:25:31.177803',3),(270,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:26:01.826630',3),(271,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:26:32.669082',3),(272,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:27:03.344072',3),(273,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:27:34.072140',3),(274,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:28:04.755669',3),(275,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:28:35.479748',3),(276,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:29:06.230640',3),(277,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:29:37.072929',3),(278,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:30:07.759908',3),(279,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:30:38.504741',3),(280,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:31:09.128513',3),(281,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:31:39.915211',3),(282,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:32:10.611416',3),(283,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:32:41.349022',3),(284,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:33:12.099587',3),(285,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:33:42.938172',3),(286,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:34:13.656665',3),(287,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:34:44.532371',3),(288,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:35:15.156381',3),(289,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:35:45.851860',3),(290,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:36:16.630397',3),(291,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:36:47.397031',3),(292,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:37:18.200918',3),(293,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:37:48.792778',3),(294,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:38:19.504949',3),(295,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:38:50.153048',3),(296,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:39:20.969565',3),(297,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:39:51.659350',3),(298,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:40:22.568992',3),(299,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:40:53.244500',3),(300,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:41:24.079342',3),(301,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:41:54.906973',3),(302,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:42:25.787420',3),(303,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:42:56.602748',3),(304,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:43:27.403000',3),(305,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:43:58.167961',3),(306,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:44:28.949280',3),(307,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:44:59.591572',3),(308,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:45:30.444847',3),(309,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:46:01.046109',3),(310,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:46:31.666601',3),(311,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:47:02.417067',3),(312,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:47:33.134231',3),(313,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:48:03.917977',3),(314,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:48:34.644260',3),(315,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:49:05.340810',3),(316,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:49:35.961739',3),(317,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:50:06.746117',3),(318,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:50:37.439305',3),(319,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:51:08.299967',3),(320,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:51:38.906710',3),(321,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:52:09.700671',3),(322,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:52:40.506113',3),(323,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:53:11.349462',3),(324,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:53:42.006323',3),(325,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:54:12.759257',3),(326,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:54:43.618217',3),(327,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:55:14.444324',3),(328,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:55:45.106295',3),(329,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:56:15.936035',3),(330,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:56:46.622967',3),(331,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:57:17.354707',3),(332,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:57:48.126564',3),(333,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:58:18.833948',3),(334,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:58:49.543705',3),(335,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:59:20.159619',3),(336,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 15:59:50.912623',3),(337,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:00:21.591688',3),(338,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:00:52.335079',3),(339,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:01:23.029819',3),(340,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:01:53.727745',3),(341,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:02:24.486863',3),(342,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:02:55.314882',3),(343,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:03:26.022715',3),(344,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:03:56.892519',3),(345,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:04:27.525968',3),(346,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:04:58.199601',3),(347,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:05:28.797069',3),(348,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:05:59.582513',3),(349,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:06:30.223113',3),(350,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:07:01.162605',3),(351,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:07:31.824852',3),(352,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:08:02.606371',3),(353,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:08:33.375131',3),(354,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:09:04.076737',3),(355,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:09:34.821435',3),(356,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:10:05.499178',3),(357,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-02 16:10:36.170288',3),(358,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:25:28.625025',3),(359,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:25:58.526301',3),(360,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:26:28.495123',3),(361,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:26:58.522420',3),(362,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:27:29.156915',3),(363,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:27:59.873816',3),(364,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:28:30.710748',3),(365,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:29:01.495895',3),(366,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:29:32.407059',3),(367,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:30:03.245772',3),(368,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:30:34.292139',3),(369,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:31:05.278594',3),(370,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:31:35.900904',3),(371,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:32:06.680615',3),(372,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:32:37.593288',3),(373,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:33:08.381310',3),(374,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:33:39.380876',3),(375,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:34:10.052821',3),(376,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:34:40.794546',3),(377,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:35:11.624599',3),(378,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:35:42.426844',3),(379,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:36:13.409046',3),(380,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:36:44.240115',3),(381,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:37:15.086075',3),(382,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:38:16.923561',3),(383,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:38:47.834945',3),(384,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:39:18.531756',3),(385,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:39:49.203286',3),(386,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:40:20.203461',3),(387,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:40:50.962622',3),(388,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:41:21.821086',3),(389,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:41:52.643969',3),(390,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:42:23.432982',3),(391,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:42:54.247290',3),(392,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:43:25.033742',3),(393,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:43:55.813111',3),(394,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:44:26.667788',3),(395,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:44:57.471265',3),(396,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:45:28.202607',3),(397,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:45:59.062709',3),(398,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:46:29.763995',3),(399,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:47:00.512916',3),(400,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 12:47:31.207120',3),(401,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:27:57.003350',3),(402,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:28:27.740462',3),(403,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:28:58.595686',3),(404,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:29:29.249829',3),(405,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:29:59.978409',3),(406,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:30:30.678882',3),(407,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:31:01.380252',3),(408,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:31:32.198940',3),(409,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:32:02.976582',3),(410,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:32:33.732824',3),(411,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:33:04.560607',3),(412,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:33:34.997878',3),(413,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:34:05.758189',3),(414,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:34:36.699368',3),(415,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:35:07.534213',3),(416,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:35:38.414835',3),(417,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:36:09.164115',3),(418,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:36:39.951347',3),(419,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:37:10.727614',3),(420,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 13:37:41.513576',3),(421,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:03:45.689208',3),(422,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:04:15.581305',3),(423,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:04:45.619098',3),(424,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:05:16.100326',3),(425,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:05:46.895189',3),(426,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:06:17.639229',3),(427,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:06:48.380810',3),(428,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:07:19.187696',3),(429,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:07:50.001460',3),(430,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:08:20.865772',3),(431,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:08:51.610735',3),(432,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:09:22.520670',3),(433,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:09:53.259083',3),(434,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:10:24.102177',3),(435,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:10:54.755176',3),(436,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:11:25.529521',3),(437,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:11:56.221540',3),(438,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:12:26.801584',3),(439,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:12:57.549473',3),(440,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:13:28.221011',3),(441,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:13:58.927303',3),(442,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:14:29.581276',3),(443,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:15:00.254356',3),(444,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:15:30.878752',3),(445,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:16:01.638689',3),(446,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:16:32.311638',3),(447,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:17:03.211614',3),(448,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:17:33.957937',3),(449,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:18:04.735218',3),(450,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:18:35.426649',3),(451,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:19:06.156102',3),(452,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:19:36.906861',3),(453,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:20:07.515798',3),(454,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:20:38.263703',3),(455,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 19:21:09.070533',3),(456,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:19:03.701879',3),(457,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:19:33.410449',3),(458,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:20:03.428447',3),(459,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:20:33.402219',3),(460,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,'{\"id_contrato\": 10, \"etapa\": \"validar_data\", \"data_nascimento\": \"2000-09-19\"}','38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:20:57.157373',3),(461,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:21:03.396745',3),(462,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:21:33.442971',3),(463,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:22:03.409089',3),(464,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:22:33.406956',3),(465,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,'{\"id_contrato\": 10, \"etapa\": \"validar_data\", \"data_nascimento\": \"2000-09-19\"}','38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:22:33.747240',3),(466,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:23:03.426269',3),(467,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:23:33.434811',3),(468,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:24:47.956208',3),(469,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:25:17.775638',3),(470,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:25:48.091336',3),(471,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:26:18.739683',3),(472,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:26:49.284468',3),(473,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:27:20.332235',3),(474,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:27:50.658859',3),(475,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:28:21.435421',3),(476,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:28:52.641689',3),(477,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:29:22.923934',3),(478,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-03 20:29:53.469389',3),(479,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 15:57:38.303033',3),(480,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 15:58:08.031235',3),(481,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 15:58:38.070912',3),(482,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 15:59:08.087203',3),(483,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 15:59:38.079900',3),(484,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:00:08.060421',3),(485,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:00:38.081605',3),(486,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:01:08.089165',3),(487,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:01:38.196139',3),(488,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:02:20.690580',3),(489,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:02:50.465907',3),(490,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:03:20.644436',3),(491,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:03:51.355834',3),(492,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:04:21.971582',3),(493,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:04:52.524384',3),(494,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:05:23.376178',3),(495,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:05:54.157016',3),(496,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:06:24.944355',3),(497,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:06:55.542052',3),(498,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:07:25.552038',3),(499,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:07:55.732531',3),(500,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:08:25.701907',3),(501,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:08:55.632880',3),(502,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:09:25.665255',3),(503,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:09:55.759710',3),(504,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:10:25.748102',3),(505,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:10:55.872276',3),(506,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:11:25.739444',3),(507,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:11:55.765713',3),(508,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:12:25.793758',3),(509,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:12:55.782601',3),(510,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:13:25.777523',3),(511,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:13:55.813624',3),(512,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:14:25.810584',3),(513,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:14:55.796860',3),(514,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:15:26.663296',3),(515,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:15:57.471644',3),(516,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:16:28.327240',3),(517,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:17:00.044181',3),(518,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:17:29.096067',3),(519,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:17:59.721140',3),(520,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:18:30.355163',3),(521,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:19:00.912027',3),(522,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:19:31.562042',3),(523,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:20:02.323839',3),(524,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:20:32.976387',3),(525,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:21:03.789660',3),(526,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:21:34.504218',3),(527,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:22:05.131514',3),(528,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:22:35.680862',3),(529,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:23:06.472965',3),(530,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:23:37.158386',3),(531,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:24:07.871337',3),(532,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:24:38.624395',3),(533,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:25:09.387368',3),(534,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:25:40.044387',3),(535,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:26:10.743361',3),(536,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:26:41.425775',3),(537,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:27:12.275046',3),(538,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:27:42.899951',3),(539,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:28:13.611815',3),(540,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:28:45.839851',3),(541,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:29:15.046645',3),(542,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:29:45.733769',3),(543,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:30:16.626692',3),(544,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:30:47.327247',3),(545,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:31:18.160992',3),(546,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:31:49.000570',3),(547,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:32:18.771161',3),(548,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:32:49.481013',3),(549,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:33:20.177046',3),(550,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:33:50.922093',3),(551,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:34:21.652279',3),(552,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:34:52.250439',3),(553,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:35:22.854178',3),(554,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:35:53.591272',3),(555,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:36:24.285140',3),(556,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:36:55.043821',3),(557,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:37:25.698776',3),(558,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:37:56.564623',3),(559,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:38:27.139647',3),(560,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:38:57.776702',3),(561,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:39:28.485679',3),(562,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:39:59.259740',3),(563,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:40:29.910941',3),(564,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:41:00.603454',3),(565,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:41:31.324353',3),(566,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:42:02.057439',3),(567,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:42:32.830419',3),(568,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:43:03.509539',3),(569,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:43:34.156102',3),(570,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:44:04.785711',3),(571,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:44:35.492784',3),(572,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:45:06.299543',3),(573,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:45:37.029866',3),(574,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:46:07.737359',3),(575,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:46:38.360401',3),(576,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:47:09.102143',3),(577,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:47:39.657618',3),(578,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:48:10.332777',3),(579,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:48:40.851305',3),(580,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:49:11.483606',3),(581,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:49:42.080849',3),(582,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:50:12.840849',3),(583,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:50:43.568376',3),(584,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:51:14.316958',3),(585,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:51:45.018386',3),(586,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:52:15.752621',3),(587,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:52:46.480732',3),(588,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:53:17.094940',3),(589,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:53:47.701211',3),(590,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:54:18.400102',3),(591,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:54:48.996883',3),(592,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:55:19.682756',3),(593,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:55:50.355139',3),(594,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:56:21.075165',3),(595,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:56:51.804135',3),(596,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:57:22.531357',3),(597,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:57:53.166160',3),(598,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:58:23.886473',3),(599,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:58:54.536688',3),(600,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:59:25.477066',3),(601,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 16:59:56.061074',3),(602,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:00:26.700648',3),(603,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:00:57.538431',3),(604,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:01:28.193302',3),(605,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:01:59.093162',3),(606,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:02:29.616122',3),(607,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:03:00.312375',3),(608,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:03:30.976740',3),(609,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:04:01.765427',3),(610,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:04:32.483576',3),(611,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:05:03.183299',3),(612,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:05:33.897215',3),(613,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:06:04.624434',3),(614,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:06:35.300845',3),(615,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:07:06.130598',3),(616,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:07:36.810178',3),(617,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:08:07.473052',3),(618,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:08:38.124004',3),(619,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:09:08.825517',3),(620,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:09:39.446711',3),(621,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:10:10.130063',3),(622,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:10:40.828896',3),(623,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:11:11.478154',3),(624,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:11:42.209329',3),(625,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:12:12.913954',3),(626,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:12:43.824290',3),(627,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:13:14.466477',3),(628,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:13:45.223340',3),(629,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:14:15.976667',3),(630,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:14:46.825931',3),(631,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:15:17.513828',3),(632,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:15:48.244180',3),(633,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:16:19.023943',3),(634,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:16:49.855974',3),(635,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:17:20.549701',3),(636,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:17:51.417599',3),(637,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:18:22.043323',3),(638,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:18:52.719592',3),(639,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:19:23.375459',3),(640,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:19:54.187122',3),(641,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:20:24.804001',3),(642,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:20:55.372527',3),(643,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:21:26.176359',3),(644,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:21:56.764703',3),(645,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:22:27.751223',3),(646,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:22:58.469913',3),(647,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:23:29.121134',3),(648,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:23:59.729770',3),(649,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:24:30.483628',3),(650,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:25:01.093291',3),(651,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:25:31.831771',3),(652,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:26:02.497935',3),(653,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:26:33.107793',3),(654,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:27:03.701840',3),(655,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:27:34.397549',3),(656,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:28:05.108071',3),(657,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:28:35.871781',3),(658,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:29:06.821625',3),(659,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:29:40.431950',3),(660,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:30:08.530463',3),(661,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:30:39.188638',3),(662,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:31:09.758396',3),(663,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:31:40.552476',3),(664,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:32:11.204597',3),(665,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:32:41.902758',3),(666,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:33:12.664114',3),(667,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:33:43.402574',3),(668,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:34:14.237481',3),(669,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:34:44.763753',3),(670,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:35:15.459971',3),(671,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:35:46.021736',3),(672,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:36:16.778539',3),(673,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:36:47.405503',3),(674,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:37:18.166453',3),(675,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:37:48.857607',3),(676,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:38:19.507499',3),(677,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:38:54.448220',3),(678,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:39:25.234017',3),(679,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:39:55.984901',3),(680,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:40:26.880496',3),(681,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:40:57.583045',3),(682,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:41:28.436768',3),(683,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:41:59.106745',3),(684,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:42:29.955298',3),(685,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:43:00.636536',3),(686,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:43:31.444738',3),(687,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:44:02.104847',3),(688,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:44:32.677103',3),(689,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:45:03.581699',3),(690,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:45:34.343189',3),(691,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:46:05.070302',3),(692,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:46:35.708658',3),(693,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:47:06.428383',3),(694,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:47:37.128313',3),(695,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:48:07.918172',3),(696,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:48:38.615104',3),(697,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:49:09.292216',3),(698,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:49:39.997209',3),(699,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:50:10.678269',3),(700,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:50:41.372939',3),(701,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:51:12.059193',3),(702,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:51:42.915999',3),(703,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:52:13.485338',3),(704,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:52:44.154086',3),(705,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:53:14.784205',3),(706,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:53:45.412141',3),(707,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:54:16.097036',3),(708,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:54:46.746441',3),(709,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:55:17.414728',3),(710,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:55:48.206083',3),(711,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:56:18.892175',3),(712,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:56:49.526907',3),(713,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:57:20.122732',3),(714,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:57:50.975897',3),(715,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:58:21.948295',3),(716,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:58:52.905552',3),(717,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:59:23.441115',3),(718,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 17:59:53.668870',3),(719,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:00:24.599338',3),(720,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:00:55.169987',3),(721,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:01:26.794827',3),(722,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:01:57.223022',3),(723,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:02:26.805977',3),(724,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:02:57.558077',3),(725,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:03:58.977337',3),(726,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:04:29.793354',3),(727,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:05:00.447344',3),(728,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:05:31.146717',3),(729,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:06:01.825683',3),(730,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:06:32.443323',3),(731,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:07:03.212154',3),(732,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:07:33.869757',3),(733,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:08:04.466595',3),(734,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:08:35.179597',3),(735,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:09:05.948493',3),(736,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:09:36.900235',3),(737,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:10:38.160347',3),(738,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:11:09.187623',3),(739,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:11:39.679918',3),(740,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:12:10.367111',3),(741,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:12:41.118674',3),(742,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:13:11.761529',3),(743,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:13:42.227635',3),(744,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:14:13.018537',3),(745,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:14:43.649184',3),(746,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:15:14.527581',3),(747,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:15:45.176682',3),(748,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:16:15.945199',3),(749,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:16:46.640270',3),(750,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:17:17.444861',3),(751,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:17:48.050604',3),(752,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:18:18.999849',3),(753,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:18:49.391141',3),(754,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:19:20.052957',3),(755,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:19:50.694143',3),(756,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:20:21.560485',3),(757,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:20:52.449235',3),(758,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:21:23.109291',3),(759,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:21:53.776664',3),(760,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:22:24.648237',3),(761,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:22:55.312389',3),(762,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:23:25.979033',3),(763,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:23:56.708377',3),(764,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:24:27.395096',3),(765,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:24:58.215029',3),(766,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:25:28.852628',3),(767,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:25:59.720766',3),(768,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:26:30.392889',3),(769,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:27:01.141351',3),(770,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:27:31.739621',3),(771,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:28:02.523360',3),(772,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:28:33.177844',3),(773,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:29:04.059192',3),(774,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:29:34.732107',3),(775,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:30:05.508972',3),(776,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:30:39.045364',3),(777,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:31:06.225931',3),(778,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:31:36.725099',3),(779,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:32:07.349818',3),(780,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:32:37.929331',3),(781,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:33:08.712663',3),(782,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:33:39.081785',3),(783,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:34:09.829118',3),(784,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:34:40.400014',3),(785,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:35:13.604879',3),(786,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:35:41.886256',3),(787,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:36:12.494826',3),(788,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:36:42.816602',3),(789,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:37:13.529743',3),(790,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:37:44.270731',3),(791,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:38:14.973769',3),(792,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:38:45.687109',3),(793,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:39:16.384296',3),(794,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:39:47.264830',3),(795,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:40:17.791657',3),(796,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:40:48.557112',3),(797,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:41:19.418402',3),(798,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:41:50.104315',3),(799,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:42:20.133603',3),(800,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:42:50.671339',3),(801,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:43:21.321361',3),(802,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:43:51.909890',3),(803,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:44:22.638306',3),(804,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:44:53.008562',3),(805,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:45:23.542198',3),(806,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:45:54.194467',3),(807,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:46:24.334459',3),(808,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:46:55.278642',3),(809,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:47:26.010242',3),(810,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:47:56.687604',3),(811,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:48:27.462551',3),(812,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:48:58.099961',3),(813,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:49:28.695419',3),(814,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:49:59.387527',3),(815,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:50:30.111877',3),(816,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:51:00.803330',3),(817,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:51:31.605968',3),(818,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:52:02.253524',3),(819,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:52:32.990948',3),(820,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:53:03.741814',3),(821,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:53:34.638944',3),(822,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:54:05.253918',3),(823,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:54:36.013842',3),(824,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:55:06.796841',3),(825,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:55:37.545508',3),(826,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:56:08.050372',3),(827,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:56:38.777812',3),(828,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:57:09.471462',3),(829,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:57:40.143149',3),(830,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:58:10.935422',3),(831,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:58:41.653586',3),(832,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:59:12.455237',3),(833,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 18:59:43.100597',3),(834,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:00:13.971479',3),(835,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:00:44.626501',3),(836,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:01:18.551374',3),(837,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:01:45.685243',3),(838,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:02:16.534042',3),(839,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:02:47.289801',3),(840,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:03:17.963029',3),(841,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:03:48.811713',3),(842,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:04:19.418698',3),(843,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:04:50.193158',3),(844,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:05:20.800252',3),(845,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:05:51.451728',3),(846,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:06:22.170562',3),(847,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:06:52.857863',3),(848,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:07:23.747393',3),(849,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:07:54.368907',3),(850,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:08:25.099065',3),(851,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:08:55.826594',3),(852,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:09:26.396653',3),(853,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:09:57.177673',3),(854,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:10:27.924285',3),(855,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:10:58.621746',3),(856,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:11:29.323460',3),(857,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:11:59.993283',3),(858,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:12:31.893028',3),(859,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:13:01.182595',3),(860,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:13:31.925312',3),(861,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:14:02.639432',3),(862,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:14:33.410542',3),(863,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:15:04.027926',3),(864,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:15:34.861922',3),(865,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:16:05.560580',3),(866,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:16:36.244547',3),(867,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:17:06.853732',3),(868,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:17:37.601295',3),(869,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:18:08.229991',3),(870,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:18:39.036035',3),(871,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:19:09.762230',3),(872,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:19:40.646713',3),(873,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:20:11.315690',3),(874,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:20:42.049404',3),(875,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:21:12.698085',3),(876,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:21:43.519511',3),(877,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:22:14.175861',3),(878,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:22:44.954336',3),(879,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:23:15.615268',3),(880,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:23:46.345147',3),(881,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:24:16.962779',3),(882,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:24:47.690745',3),(883,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:25:18.501457',3),(884,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:25:49.219710',3),(885,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:26:20.136526',3),(886,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:26:50.777818',3),(887,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:27:21.468655',3),(888,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:27:52.105651',3),(889,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:28:24.281827',3),(890,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:28:53.420747',3),(891,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:29:24.162141',3),(892,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:29:54.837057',3),(893,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:30:25.581814',3),(894,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:30:56.176857',3),(895,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:31:27.044966',3),(896,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:31:57.738060',3),(897,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:32:28.337888',3),(898,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:32:59.038596',3),(899,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:33:29.757072',3),(900,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:34:00.354016',3),(901,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:34:31.007530',3),(902,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:35:01.639341',3),(903,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:35:32.371772',3),(904,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:36:03.067734',3),(905,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:36:33.818662',3),(906,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:37:04.686229',3),(907,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:37:35.417410',3),(908,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:38:06.253810',3),(909,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:38:36.931639',3),(910,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:39:07.759322',3),(911,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:39:38.552875',3),(912,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:40:09.413500',3),(913,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:40:40.094693',3),(914,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:41:10.796282',3),(915,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:41:41.514200',3),(916,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:42:12.302700',3),(917,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:42:43.031151',3),(918,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:43:14.816236',3),(919,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:43:44.060648',3),(920,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:44:14.747318',3),(921,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:44:45.430782',3),(922,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:45:16.203559',3),(923,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:45:46.921030',3),(924,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:46:17.554575',3),(925,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:46:48.439941',3),(926,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:47:19.173921',3),(927,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:47:49.973563',3),(928,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:48:20.634737',3),(929,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:48:51.586067',3),(930,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:49:22.356847',3),(931,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:49:53.156518',3),(932,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:50:23.783295',3),(933,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:50:54.501496',3),(934,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:51:25.190876',3),(935,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:51:55.988202',3),(936,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:52:26.716678',3),(937,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:52:57.650323',3),(938,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:53:28.455257',3),(939,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:53:58.898616',3),(940,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:54:29.584620',3),(941,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:55:00.342988',3),(942,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:55:31.006059',3),(943,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:56:01.706446',3),(944,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:56:32.395277',3),(945,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:57:03.213481',3),(946,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:57:34.099279',3),(947,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:58:04.875304',3),(948,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:58:35.664768',3),(949,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:59:06.358686',3),(950,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 19:59:37.153639',3),(951,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:00:07.988164',3),(952,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:00:38.819700',3),(953,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:01:09.503603',3),(954,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:01:40.162853',3),(955,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:02:10.869283',3),(956,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:02:41.740517',3),(957,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:03:12.477991',3),(958,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:03:43.391183',3),(959,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:04:14.054759',3),(960,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:04:44.962697',3),(961,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:05:15.732688',3),(962,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:05:51.889753',3),(963,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:06:16.990169',3),(964,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:06:47.628609',3),(965,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:07:18.360313',3),(966,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:07:49.382225',3),(967,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:08:19.874410',3),(968,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:08:50.565021',3),(969,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:09:21.319232',3),(970,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:09:52.035994',3),(971,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:10:22.883283',3),(972,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:10:53.695574',3),(973,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:11:24.536088',3),(974,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:11:55.211356',3),(975,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:12:26.012407',3),(976,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:12:56.677774',3),(977,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:13:27.495183',3),(978,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:13:58.134926',3),(979,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:14:28.980562',3),(980,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:14:59.710321',3),(981,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:15:30.523269',3),(982,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:16:01.255273',3),(983,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:16:32.105179',3),(984,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:17:02.806279',3),(985,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:17:33.492255',3),(986,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:18:04.227279',3),(987,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:18:34.922774',3),(988,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:19:05.642559',3),(989,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:19:36.331542',3),(990,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:20:07.080802',3),(991,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:20:37.836364',3),(992,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:21:08.688865',3),(993,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:21:39.699303',3),(994,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:22:10.449932',3),(995,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:22:41.106442',3),(996,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:23:11.890347',3),(997,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:23:42.560258',3),(998,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:24:13.422319',3),(999,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:24:44.077776',3),(1000,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:25:14.700461',3),(1001,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:25:45.238369',3),(1002,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:26:16.114909',3),(1003,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:26:46.822264',3),(1004,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:27:17.649818',3),(1005,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:27:48.327440',3),(1006,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:28:19.171131',3),(1007,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:28:49.926901',3),(1008,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:29:20.652593',3),(1009,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:29:51.343029',3),(1010,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:30:22.998697',3),(1011,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:30:52.223737',3),(1012,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:31:22.865627',3),(1013,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:31:53.622540',3),(1014,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:32:24.268498',3),(1015,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:32:55.122975',3),(1016,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:33:25.710510',3),(1017,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:33:56.430532',3),(1018,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:34:27.000084',3),(1019,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:34:57.822575',3),(1020,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:35:28.554492',3),(1021,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:35:59.358965',3),(1022,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:36:30.505418',3),(1023,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:37:00.863283',3),(1024,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:37:31.567156',3),(1025,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:38:02.402698',3),(1026,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:38:33.085846',3),(1027,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:39:04.002791',3),(1028,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:39:34.877494',3),(1029,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:40:05.632233',3),(1030,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:40:36.382983',3),(1031,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:41:07.106746',3),(1032,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:41:37.944406',3),(1033,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:42:08.583361',3),(1034,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:42:39.346798',3),(1035,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:43:10.078488',3),(1036,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:43:40.900507',3),(1037,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:44:11.482259',3),(1038,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:44:42.236231',3),(1039,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:45:12.949411',3),(1040,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:45:43.876834',3),(1041,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:46:14.660550',3),(1042,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:46:45.258921',3),(1043,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:47:15.864098',3),(1044,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:47:46.686637',3),(1045,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:48:17.235814',3),(1046,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:48:47.883145',3),(1047,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:49:18.413724',3),(1048,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:49:49.363490',3),(1049,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:50:19.882771',3),(1050,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:50:50.552492',3),(1051,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:51:21.245828',3),(1052,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:51:51.939258',3),(1053,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:52:22.734453',3),(1054,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:52:53.386227',3),(1055,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:53:24.072364',3),(1056,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:53:54.780742',3),(1057,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:54:25.468412',3),(1058,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:54:56.025983',3),(1059,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:55:26.705044',3),(1060,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:55:57.393019',3),(1061,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:56:28.182698',3),(1062,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:56:58.735325',3),(1063,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0','2026-06-08 20:57:29.589156',3),(1064,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:44:54.979449',3),(1065,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:45:25.312337',3),(1066,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:45:55.568496',3),(1067,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:46:26.179801',3),(1068,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:46:56.733002',3),(1069,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:47:27.588449',3),(1070,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:47:58.296227',3),(1071,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:48:29.155239',3),(1072,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:48:59.597672',3),(1073,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:49:30.317488',3),(1074,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:50:00.977180',3),(1075,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:50:31.726309',3),(1076,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:51:05.894033',3),(1077,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:51:32.904631',3),(1078,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:52:05.216282',3),(1079,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:52:34.181930',3),(1080,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:53:04.843243',3),(1081,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:53:35.492856',3),(1082,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:54:06.442391',3),(1083,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:54:36.786227',3),(1084,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:55:38.352810',3),(1085,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:56:08.858261',3),(1086,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:56:39.461331',3),(1087,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:57:10.135239',3),(1088,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:57:40.804345',3),(1089,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:58:11.356609',3),(1090,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:58:41.989540',3),(1091,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:59:12.644095',3),(1092,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 16:59:43.222402',3),(1093,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:00:13.822923',3),(1094,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:00:44.398161',3),(1095,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:01:15.022035',3),(1096,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:01:45.623531',3),(1097,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:02:16.227890',3),(1098,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:02:46.750771',3),(1099,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:03:17.360938',3),(1100,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:03:48.096463',3),(1101,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:04:18.612626',3),(1102,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:04:49.205646',3),(1103,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:05:19.754510',3),(1104,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:05:50.535407',3),(1105,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:06:21.141158',3),(1106,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:06:51.907448',3),(1107,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:07:22.590777',3),(1108,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:07:53.629597',3),(1109,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:08:24.200021',3),(1110,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:08:54.677338',3),(1111,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:09:25.345203',3),(1112,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:09:56.176602',3),(1113,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:10:26.807591',3),(1114,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:10:57.557012',3),(1115,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:11:27.890253',3),(1116,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:11:58.465355',3),(1117,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:12:29.005006',3),(1118,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:12:59.835178',3),(1119,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:13:30.468481',3),(1120,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:14:01.171611',3),(1121,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:14:31.794922',3),(1122,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:15:02.504158',3),(1123,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:15:33.139579',3),(1124,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:16:03.792341',3),(1125,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:16:34.435907',3),(1126,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:17:05.184108',3),(1127,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:17:35.971367',3),(1128,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:18:06.686611',3),(1129,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:18:37.558697',3),(1130,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:19:08.152804',3),(1131,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:19:38.957544',3),(1132,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:20:09.585067',3),(1133,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:20:40.321989',3),(1134,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:21:10.989719',3),(1135,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:21:41.853992',3),(1136,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:22:12.474886',3),(1137,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:22:43.201648',3),(1138,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:23:13.982886',3),(1139,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:23:44.854041',3),(1140,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:24:15.559490',3),(1141,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:24:46.291320',3),(1142,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:25:16.923070',3),(1143,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:25:47.674660',3),(1144,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:26:18.319051',3),(1145,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:26:49.006230',3),(1146,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:27:19.694215',3),(1147,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:27:50.350843',3),(1148,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:28:21.031000',3),(1149,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:28:51.641151',3),(1150,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:29:22.571207',3),(1151,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:29:53.224243',3),(1152,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:30:24.021529',3),(1153,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:30:54.689129',3),(1154,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:31:25.490940',3),(1155,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:31:56.187471',3),(1156,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:32:27.007398',3),(1157,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:32:57.655568',3),(1158,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:33:28.421534',3),(1159,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:33:59.065118',3),(1160,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:34:29.943991',3),(1161,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:35:00.610365',3),(1162,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:35:31.355617',3),(1163,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:36:02.005944',3),(1164,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:36:32.789284',3),(1165,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:37:03.404365',3),(1166,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:37:34.274721',3),(1167,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:38:04.947187',3),(1168,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:38:35.555350',3),(1169,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:39:06.299984',3),(1170,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:39:37.079950',3),(1171,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:40:07.910919',3),(1172,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:40:38.536980',3),(1173,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:41:09.330445',3),(1174,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:41:39.883041',3),(1175,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:42:10.699276',3),(1176,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:42:41.292649',3),(1177,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:43:12.102115',3),(1178,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:43:42.699426',3),(1179,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:44:13.494431',3),(1180,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:44:44.179520',3),(1181,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:45:15.009200',3),(1182,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:45:45.619899',3),(1183,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:46:16.381507',3),(1184,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:46:46.981247',3),(1185,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:47:17.717495',3),(1186,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:47:48.316824',3),(1187,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:48:18.940099',3),(1188,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:48:49.677698',3),(1189,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:49:20.326471',3),(1190,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:49:51.077239',3),(1191,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:50:21.687121',3),(1192,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:50:52.490858',3),(1193,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:51:23.186514',3),(1194,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:51:53.370820',3),(1195,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:52:23.381221',3),(1196,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:52:53.869007',3),(1197,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:53:23.960337',3),(1198,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:53:54.037205',3),(1199,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:54:24.871719',3),(1200,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:54:55.770273',3),(1201,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:55:26.675179',3),(1202,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:55:57.479529',3),(1203,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:56:28.289796',3),(1204,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:56:59.010246',3),(1205,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:57:29.921421',3),(1206,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:58:00.570125',3),(1207,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:58:30.620690',3),(1208,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:59:01.415116',3),(1209,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 17:59:32.241013',3),(1210,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:00:03.048281',3),(1211,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:00:33.075001',3),(1212,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:01:03.862705',3),(1213,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:01:34.851063',3),(1214,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:02:05.670473',3),(1215,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:02:36.541569',3),(1216,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:03:07.370689',3),(1217,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:03:38.276782',3),(1218,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:04:08.939128',3),(1219,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:04:39.907069',3),(1220,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:05:10.608262',3),(1221,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:05:41.445746',3),(1222,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:06:12.243956',3),(1223,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:06:43.008114',3),(1224,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:07:13.883272',3),(1225,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:07:44.548028',3),(1226,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:08:14.578920',3),(1227,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:08:45.380635',3),(1228,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:09:16.354393',3),(1229,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:09:46.436548',3),(1230,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:10:17.592948',3),(1231,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:11:19.338203',3),(1232,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:11:49.556918',3),(1233,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:12:20.328604',3),(1234,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:12:50.979079',3),(1235,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:13:21.809993',3),(1236,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:13:52.420986',3),(1237,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:14:23.369803',3),(1238,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:14:54.139679',3),(1239,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:15:24.995983',3),(1240,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:15:55.732143',3),(1241,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:16:26.534577',3),(1242,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:16:59.095649',3),(1243,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:17:28.152449',3),(1244,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:17:58.141558',3),(1245,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:17:59.240371',3),(1246,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:18:01.974930',3),(1247,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:18:02.771015',3),(1248,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:18:31.299076',3),(1249,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 18:18:39.705058',3),(1250,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:39:43.565098',3),(1251,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:40:14.120472',3),(1252,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:40:44.779045',3),(1253,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:41:15.602418',3),(1254,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:41:45.855428',3),(1255,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:41:50.606750',3),(1256,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:41:55.186501',3),(1257,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:41:57.462343',3),(1258,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:41:59.331318',3),(1259,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:42:25.175191',3),(1260,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:43:22.630850',3),(1261,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:43:43.637227',3),(1262,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:43:45.185897',3),(1263,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:43:52.230725',3),(1264,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:44:23.033566',3),(1265,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:44:53.582890',3),(1266,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:45:24.279356',3),(1267,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:45:55.145746',3),(1268,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:46:02.460716',3),(1269,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:46:04.426003',3),(1270,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:46:05.605066',3),(1271,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:46:33.260987',3),(1272,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:47:03.721586',3),(1273,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:47:34.742681',3),(1274,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:48:05.577637',3),(1275,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:48:35.888074',3),(1276,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:49:05.851619',3),(1277,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:49:35.981261',3),(1278,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:50:06.060331',3),(1279,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:50:35.996961',3),(1280,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:51:06.010760',3),(1281,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:51:36.000407',3),(1282,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:52:05.975969',3),(1283,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:52:36.004425',3),(1284,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:53:06.007487',3),(1285,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:53:36.012421',3),(1286,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:54:06.023886',3),(1287,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:54:36.052753',3),(1288,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:55:06.387048',3),(1289,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:55:37.193234',3),(1290,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:56:07.763174',3),(1291,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:56:37.750594',3),(1292,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:57:07.800975',3),(1293,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:57:37.756681',3),(1294,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:58:07.768405',3),(1295,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:58:37.765209',3),(1296,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:59:07.786806',3),(1297,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 19:59:37.860315',3),(1298,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:00:07.902561',3),(1299,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:00:37.845862',3),(1300,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:01:07.864327',3),(1301,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:01:37.870783',3),(1302,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:02:07.908032',3),(1303,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:02:37.875029',3),(1304,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:03:07.847285',3),(1305,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:03:37.882675',3),(1306,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:04:07.901213',3),(1307,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:04:37.968249',3),(1308,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:05:07.937292',3),(1309,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:05:38.086882',3),(1310,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:06:08.063901',3),(1311,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:06:38.189869',3),(1312,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:07:08.810218',3),(1313,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:07:39.546919',3),(1314,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:08:10.189364',3),(1315,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:08:40.729452',3),(1316,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:09:11.502991',3),(1317,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:09:42.135526',3),(1318,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:10:12.870661',3),(1319,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:10:43.395628',3),(1320,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:11:13.960617',3),(1321,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:11:44.776549',3),(1322,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:12:15.351911',3),(1323,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:12:46.085158',3),(1324,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:13:16.839446',3),(1325,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:13:47.334597',3),(1326,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:14:17.878143',3),(1327,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:14:48.411540',3),(1328,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:15:19.047317',3),(1329,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:15:49.637276',3),(1330,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:16:20.227074',3),(1331,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:16:50.787740',3),(1332,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:17:21.685297',3),(1333,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:17:52.155865',3),(1334,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:18:22.822206',3),(1335,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:18:53.573316',3),(1336,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:19:24.132908',3),(1337,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:19:54.825000',3),(1338,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:20:25.509670',3),(1339,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:20:56.229237',3),(1340,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:21:26.755110',3),(1341,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:21:57.445811',3),(1342,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:22:28.081457',3),(1343,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:22:58.918950',3),(1344,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:23:29.563288',3),(1345,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:24:00.258156',3),(1346,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:24:30.858910',3),(1347,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:25:01.735307',3),(1348,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:25:32.333125',3),(1349,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:26:02.964866',3),(1350,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:26:33.534056',3),(1351,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:27:04.367069',3),(1352,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:27:34.910689',3),(1353,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:28:05.576567',3),(1354,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:28:36.118830',3),(1355,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:29:06.876098',3),(1356,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:29:37.649343',3),(1357,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:30:08.377002',3),(1358,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:30:39.022387',3),(1359,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:31:09.548786',3),(1360,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:31:40.212280',3),(1361,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:32:10.876978',3),(1362,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:32:41.567904',3),(1363,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:33:12.164242',3),(1364,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:33:42.880038',3),(1365,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:34:13.528114',3),(1366,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:34:44.185195',3),(1367,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:35:14.842173',3),(1368,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:35:45.674638',3),(1369,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:36:16.227658',3),(1370,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:36:46.921649',3),(1371,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:37:17.479508',3),(1372,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:37:48.234215',3),(1373,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:38:18.864000',3),(1374,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:38:49.391433',3),(1375,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:39:20.132172',3),(1376,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:39:50.734076',3),(1377,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:40:21.621661',3),(1378,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:40:52.323109',3),(1379,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:41:22.972876',3),(1380,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:41:53.564427',3),(1381,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:42:24.419523',3),(1382,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:42:54.992177',3),(1383,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:43:25.742661',3),(1384,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:43:56.310751',3),(1385,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:44:26.981662',3),(1386,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:44:57.526125',3),(1387,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:45:28.347926',3),(1388,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:45:58.986266',3),(1389,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:46:29.640955',3),(1390,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:47:00.202412',3),(1391,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:47:30.903683',3),(1392,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:48:01.476563',3),(1393,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:48:32.285500',3),(1394,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:49:02.842823',3),(1395,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:49:40.469836',3),(1396,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:50:03.530925',3),(1397,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:50:37.532459',3),(1398,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:51:04.839600',3),(1399,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:51:37.112722',3),(1400,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:52:06.378820',3),(1401,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:52:37.197626',3),(1402,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:53:07.665648',3),(1403,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:53:38.270580',3),(1404,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:54:09.043067',3),(1405,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:54:39.629949',3),(1406,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:55:10.316887',3),(1407,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:55:40.896959',3),(1408,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:56:11.655936',3),(1409,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:56:42.232298',3),(1410,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:57:12.955923',3),(1411,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:57:43.616660',3),(1412,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:58:14.304488',3),(1413,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:58:44.906421',3),(1414,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:59:15.591452',3),(1415,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 20:59:46.201529',3),(1416,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 21:00:16.898909',3),(1417,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-22 21:00:47.511059',3),(1418,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:53:12.110993',3),(1419,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:53:42.427446',3),(1420,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:54:13.354118',3),(1421,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:54:44.007556',3),(1422,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:55:14.768868',3),(1423,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:55:45.501712',3),(1424,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:56:16.150040',3),(1425,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:56:47.003205',3),(1426,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:57:17.508855',3),(1427,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:57:48.226807',3),(1428,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:58:18.903903',3),(1429,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:58:49.697737',3),(1430,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:59:20.258793',3),(1431,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 12:59:51.035863',3),(1432,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:00:21.611310',3),(1433,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:00:52.334160',3),(1434,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:01:22.957786',3),(1435,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:01:53.715192',3),(1436,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:02:24.371104',3),(1437,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:02:55.174794',3),(1438,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:03:25.860200',3),(1439,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:03:56.532041',3),(1440,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:04:27.143655',3),(1441,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:04:57.853953',3),(1442,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:05:28.412194',3),(1443,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:05:59.108714',3),(1444,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:06:29.619642',3),(1445,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:07:00.244863',3),(1446,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:07:31.037970',3),(1447,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:08:01.651607',3),(1448,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:08:32.401698',3),(1449,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:09:02.936326',3),(1450,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:09:33.699884',3),(1451,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:10:04.235389',3),(1452,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:10:34.740924',3),(1453,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:11:05.349283',3),(1454,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:11:36.199346',3),(1455,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:12:06.729762',3),(1456,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:12:37.607113',3),(1457,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:13:08.094168',3),(1458,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:13:38.883613',3),(1459,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:14:09.533196',3),(1460,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:14:40.121587',3),(1461,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:15:10.731854',3),(1462,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:15:41.382913',3),(1463,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:16:12.192722',3),(1464,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:16:42.464375',3),(1465,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:17:13.417863',3),(1466,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:17:43.897132',3),(1467,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:18:14.601454',3),(1468,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:18:45.218796',3),(1469,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:19:15.939534',3),(1470,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:19:46.424321',3),(1471,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:20:17.169006',3),(1472,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:20:47.767163',3),(1473,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:21:18.560452',3),(1474,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:21:49.222665',3),(1475,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:22:19.964524',3),(1476,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:22:50.596923',3),(1477,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:23:21.334815',3),(1478,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:23:51.926759',3),(1479,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:24:22.632727',3),(1480,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:24:53.232141',3),(1481,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:25:23.837379',3),(1482,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:25:54.475168',3),(1483,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:26:25.139783',3),(1484,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:26:55.687948',3),(1485,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:27:26.214513',3),(1486,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:27:56.984663',3),(1487,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:28:27.627657',3),(1488,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:28:58.363030',3),(1489,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:29:29.141377',3),(1490,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:29:59.900623',3),(1491,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:30:30.295010',3),(1492,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:31:00.999077',3),(1493,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:31:31.568200',3),(1494,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:31:36.979330',3),(1495,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:32:07.690123',3),(1496,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:32:38.447096',3),(1497,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:33:09.430449',3),(1498,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:33:39.993584',3),(1499,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:34:10.768657',3),(1500,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:34:41.378746',3),(1501,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:35:11.893158',3),(1502,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:35:42.470345',3),(1503,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:36:13.217476',3),(1504,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:36:43.813116',3),(1505,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:37:14.766605',3),(1506,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:37:45.330603',3),(1507,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:38:15.910570',3),(1508,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:38:46.464537',3),(1509,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:39:17.018928',3),(1510,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:39:47.580357',3),(1511,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:40:18.172257',3),(1512,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:40:48.732836',3),(1513,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:41:19.386043',3),(1514,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:41:49.982059',3),(1515,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:42:20.791897',3),(1516,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:42:51.373231',3),(1517,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:43:22.001752',3),(1518,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:43:52.619536',3),(1519,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:44:23.373799',3),(1520,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:44:53.973706',3),(1521,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:45:24.769104',3),(1522,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:45:55.217596',3),(1523,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:46:25.896795',3),(1524,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:46:56.491624',3),(1525,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:47:08.790353',3),(1526,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:47:38.545015',3),(1527,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:48:09.449641',3),(1528,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:48:40.009019',3),(1529,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:49:10.435366',3),(1530,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:49:40.961936',3),(1531,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:50:42.008984',3),(1532,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:51:43.552920',3),(1533,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:52:14.136238',3),(1534,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:52:44.778911',3),(1535,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:53:15.366418',3),(1536,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:53:46.057473',3),(1537,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:54:16.737824',3),(1538,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:54:46.767604',3),(1539,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:55:17.059617',3),(1540,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:55:47.110893',3),(1541,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:56:17.066399',3),(1542,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:56:47.089844',3),(1543,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:57:17.120515',3),(1544,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:57:47.101256',3),(1545,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:58:17.089686',3),(1546,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:58:47.090763',3),(1547,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:59:17.139465',3),(1548,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 13:59:47.139873',3),(1549,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:00:17.150023',3),(1550,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:00:47.144883',3),(1551,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:01:17.150698',3),(1552,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:01:47.145009',3),(1553,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:02:17.164173',3),(1554,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:02:47.173473',3),(1555,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:03:17.163154',3),(1556,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:03:47.159630',3),(1557,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:04:17.173666',3),(1558,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:04:47.368410',3),(1559,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:05:17.273133',3),(1560,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:05:48.184365',3),(1561,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:06:18.726732',3),(1562,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:06:49.286166',3),(1563,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:07:19.883337',3),(1564,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:07:50.602023',3),(1565,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:08:21.205459',3),(1566,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:08:51.942155',3),(1567,'ADMIN','CREATE','Sistema','criou registro em Sistema',NULL,NULL,NULL,NULL,'38.252.82.24','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0','2026-06-23 14:09:22.536644',3);
/*!40000 ALTER TABLE `log_auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lotes_produto`
--

DROP TABLE IF EXISTS `lotes_produto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lotes_produto` (
  `id_lote` int NOT NULL AUTO_INCREMENT,
  `numero_lote` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_fabricacao` date DEFAULT NULL,
  `data_validade` date NOT NULL,
  `quantidade` decimal(12,3) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ativo` tinyint(1) NOT NULL,
  `data_criacao` datetime(6) NOT NULL,
  `data_modificacao` datetime(6) NOT NULL,
  `id_produto` int NOT NULL,
  PRIMARY KEY (`id_lote`),
  KEY `lotes_produto_id_produto_5cc35f9d_fk_produtos_id_produto` (`id_produto`),
  CONSTRAINT `lotes_produto_id_produto_5cc35f9d_fk_produtos_id_produto` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lotes_produto`
--

LOCK TABLES `lotes_produto` WRITE;
/*!40000 ALTER TABLE `lotes_produto` DISABLE KEYS */;
/*!40000 ALTER TABLE `lotes_produto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `manifestacao_nfe`
--

DROP TABLE IF EXISTS `manifestacao_nfe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manifestacao_nfe` (
  `id_manifestacao` int NOT NULL AUTO_INCREMENT,
  `chave_nfe` varchar(44) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_nfe` int DEFAULT NULL,
  `serie` int DEFAULT NULL,
  `emitente_nome` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emitente_cnpj` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor_nfe` decimal(14,2) DEFAULT NULL,
  `data_emissao` date DEFAULT NULL,
  `tipo_evento` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `n_seq_evento` int NOT NULL,
  `justificativa` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `c_stat` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `x_motivo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `protocolo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dh_reg_evento` datetime(6) DEFAULT NULL,
  `xml_evento` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`id_manifestacao`),
  KEY `manifestacao_nfe_usuario_id_ce2d6981_fk_auth_user_id` (`usuario_id`),
  KEY `manifestaca_chave_n_542ad5_idx` (`chave_nfe`),
  KEY `manifestaca_status_f83233_idx` (`status`),
  KEY `manifestaca_tipo_ev_30694d_idx` (`tipo_evento`),
  CONSTRAINT `manifestacao_nfe_usuario_id_ce2d6981_fk_auth_user_id` FOREIGN KEY (`usuario_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manifestacao_nfe`
--

LOCK TABLES `manifestacao_nfe` WRITE;
/*!40000 ALTER TABLE `manifestacao_nfe` DISABLE KEYS */;
/*!40000 ALTER TABLE `manifestacao_nfe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mapa_carga`
--

DROP TABLE IF EXISTS `mapa_carga`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mapa_carga` (
  `id_mapa` int NOT NULL AUTO_INCREMENT,
  `numero_mapa` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_criacao` datetime(6) NOT NULL,
  `data_saida` datetime(6) DEFAULT NULL,
  `data_retorno` datetime(6) DEFAULT NULL,
  `peso_total_kg` decimal(10,2) NOT NULL,
  `valor_total_carga` decimal(15,2) NOT NULL,
  `quantidade_entregas` int NOT NULL,
  `distancia_total_km` decimal(10,2) NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_mdfe` int DEFAULT NULL,
  `id_motorista_id` int DEFAULT NULL,
  `id_veiculo` int DEFAULT NULL,
  `motorista_cpf` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_por` int DEFAULT NULL,
  `rota_descricao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motorista_nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_mapa`),
  UNIQUE KEY `numero_mapa` (`numero_mapa`),
  KEY `mapa_carga_id_mdfe_d8c16d71_fk_mdfe_manifestos_id_mdfe` (`id_mdfe`),
  KEY `mapa_carga_id_motorista_id_f6573980_fk_vendedores_id_vendedor` (`id_motorista_id`),
  KEY `mapa_carga_id_veiculo_885fde2b_fk_veiculos_id_veiculo` (`id_veiculo`),
  CONSTRAINT `mapa_carga_id_mdfe_d8c16d71_fk_mdfe_manifestos_id_mdfe` FOREIGN KEY (`id_mdfe`) REFERENCES `mdfe_manifestos` (`id_mdfe`),
  CONSTRAINT `mapa_carga_id_motorista_id_f6573980_fk_vendedores_id_vendedor` FOREIGN KEY (`id_motorista_id`) REFERENCES `vendedores` (`id_vendedor`),
  CONSTRAINT `mapa_carga_id_veiculo_885fde2b_fk_veiculos_id_veiculo` FOREIGN KEY (`id_veiculo`) REFERENCES `veiculos` (`id_veiculo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mapa_carga`
--

LOCK TABLES `mapa_carga` WRITE;
/*!40000 ALTER TABLE `mapa_carga` DISABLE KEYS */;
/*!40000 ALTER TABLE `mapa_carga` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mapa_carga_itens`
--

DROP TABLE IF EXISTS `mapa_carga_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mapa_carga_itens` (
  `id_item_mapa` int NOT NULL AUTO_INCREMENT,
  `ordem_entrega` int NOT NULL,
  `distancia_km` decimal(10,2) DEFAULT NULL,
  `data_entrega_prevista` datetime(6) DEFAULT NULL,
  `data_entrega_realizada` datetime(6) DEFAULT NULL,
  `status_entrega` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes_entrega` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_mapa` int NOT NULL,
  `id_venda` int NOT NULL,
  `bairro` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destinatario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entregue` tinyint(1) NOT NULL,
  `valor_venda` decimal(12,2) NOT NULL,
  `endereco_entrega` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `peso_kg` decimal(12,3) NOT NULL,
  `observacoes` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_item_mapa`),
  UNIQUE KEY `mapa_carga_itens_id_mapa_id_venda_5e48330f_uniq` (`id_mapa`,`id_venda`),
  KEY `mapa_carga_itens_id_venda_2abdde36_fk_vendas_id_venda` (`id_venda`),
  CONSTRAINT `mapa_carga_itens_id_mapa_f4cbb1d2_fk_mapa_carga_id_mapa` FOREIGN KEY (`id_mapa`) REFERENCES `mapa_carga` (`id_mapa`),
  CONSTRAINT `mapa_carga_itens_id_venda_2abdde36_fk_vendas_id_venda` FOREIGN KEY (`id_venda`) REFERENCES `vendas` (`id_venda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mapa_carga_itens`
--

LOCK TABLES `mapa_carga_itens` WRITE;
/*!40000 ALTER TABLE `mapa_carga_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `mapa_carga_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mdfe_carregamentos`
--

DROP TABLE IF EXISTS `mdfe_carregamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mdfe_carregamentos` (
  `id_carregamento` int NOT NULL AUTO_INCREMENT,
  `municipio_cep` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `municipio_nome` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `municipio_codigo_ibge` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uf` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mdfe_id` int NOT NULL,
  PRIMARY KEY (`id_carregamento`),
  KEY `mdfe_carregamentos_mdfe_id_d12e84a0_fk_mdfe_manifestos_id_mdfe` (`mdfe_id`),
  CONSTRAINT `mdfe_carregamentos_mdfe_id_d12e84a0_fk_mdfe_manifestos_id_mdfe` FOREIGN KEY (`mdfe_id`) REFERENCES `mdfe_manifestos` (`id_mdfe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mdfe_carregamentos`
--

LOCK TABLES `mdfe_carregamentos` WRITE;
/*!40000 ALTER TABLE `mdfe_carregamentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `mdfe_carregamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mdfe_condutores`
--

DROP TABLE IF EXISTS `mdfe_condutores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mdfe_condutores` (
  `id_condutor` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cpf` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mdfe_id` int NOT NULL,
  PRIMARY KEY (`id_condutor`),
  KEY `mdfe_condutores_mdfe_id_c5722777_fk_mdfe_manifestos_id_mdfe` (`mdfe_id`),
  CONSTRAINT `mdfe_condutores_mdfe_id_c5722777_fk_mdfe_manifestos_id_mdfe` FOREIGN KEY (`mdfe_id`) REFERENCES `mdfe_manifestos` (`id_mdfe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mdfe_condutores`
--

LOCK TABLES `mdfe_condutores` WRITE;
/*!40000 ALTER TABLE `mdfe_condutores` DISABLE KEYS */;
/*!40000 ALTER TABLE `mdfe_condutores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mdfe_descarregamentos`
--

DROP TABLE IF EXISTS `mdfe_descarregamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mdfe_descarregamentos` (
  `id_descarregamento` int NOT NULL AUTO_INCREMENT,
  `municipio_cep` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `municipio_nome` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `municipio_codigo_ibge` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uf` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mdfe_id` int NOT NULL,
  PRIMARY KEY (`id_descarregamento`),
  KEY `mdfe_descarregamento_mdfe_id_440b841c_fk_mdfe_mani` (`mdfe_id`),
  CONSTRAINT `mdfe_descarregamento_mdfe_id_440b841c_fk_mdfe_mani` FOREIGN KEY (`mdfe_id`) REFERENCES `mdfe_manifestos` (`id_mdfe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mdfe_descarregamentos`
--

LOCK TABLES `mdfe_descarregamentos` WRITE;
/*!40000 ALTER TABLE `mdfe_descarregamentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `mdfe_descarregamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mdfe_documentos_vinculados`
--

DROP TABLE IF EXISTS `mdfe_documentos_vinculados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mdfe_documentos_vinculados` (
  `id_doc` int NOT NULL AUTO_INCREMENT,
  `tipo_documento` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chave_acesso` varchar(44) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uf_percurso` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `municipio_carregamento` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `municipio_descarregamento` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mdfe_id` int NOT NULL,
  PRIMARY KEY (`id_doc`),
  KEY `mdfe_documentos_vinc_mdfe_id_195e66f3_fk_mdfe_mani` (`mdfe_id`),
  CONSTRAINT `mdfe_documentos_vinc_mdfe_id_195e66f3_fk_mdfe_mani` FOREIGN KEY (`mdfe_id`) REFERENCES `mdfe_manifestos` (`id_mdfe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mdfe_documentos_vinculados`
--

LOCK TABLES `mdfe_documentos_vinculados` WRITE;
/*!40000 ALTER TABLE `mdfe_documentos_vinculados` DISABLE KEYS */;
/*!40000 ALTER TABLE `mdfe_documentos_vinculados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mdfe_lacres`
--

DROP TABLE IF EXISTS `mdfe_lacres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mdfe_lacres` (
  `id_lacre` int NOT NULL AUTO_INCREMENT,
  `numero_lacre` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mdfe_id` int NOT NULL,
  PRIMARY KEY (`id_lacre`),
  KEY `mdfe_lacres_mdfe_id_06495ccc_fk_mdfe_manifestos_id_mdfe` (`mdfe_id`),
  CONSTRAINT `mdfe_lacres_mdfe_id_06495ccc_fk_mdfe_manifestos_id_mdfe` FOREIGN KEY (`mdfe_id`) REFERENCES `mdfe_manifestos` (`id_mdfe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mdfe_lacres`
--

LOCK TABLES `mdfe_lacres` WRITE;
/*!40000 ALTER TABLE `mdfe_lacres` DISABLE KEYS */;
/*!40000 ALTER TABLE `mdfe_lacres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mdfe_manifestos`
--

DROP TABLE IF EXISTS `mdfe_manifestos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mdfe_manifestos` (
  `id_mdfe` int NOT NULL AUTO_INCREMENT,
  `chave_mdfe` varchar(44) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `protocolo_mdfe` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_mdfe` int DEFAULT NULL,
  `serie_mdfe` int NOT NULL,
  `status_mdfe` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `xml_mdfe` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `qrcode_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cstat` int DEFAULT NULL,
  `xmotivo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_emissao` datetime(6) NOT NULL,
  `data_inicio_viagem` datetime(6) DEFAULT NULL,
  `data_saida` date DEFAULT NULL,
  `hora_saida` time(6) DEFAULT NULL,
  `cfop` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_emitente` int NOT NULL,
  `tipo_emissao` int NOT NULL,
  `tipo_transporte` int NOT NULL,
  `modal` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uf_inicio` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uf_fim` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rntrc_prestador` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contratante_rntrc` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contratante_cnpj` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tomador_servico` int DEFAULT NULL,
  `tomador_ind_ie` int DEFAULT NULL,
  `tomador_cpf_cnpj` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tomador_nome` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantidade_cte` int NOT NULL,
  `quantidade_nfe` int NOT NULL,
  `valor_total_carga` decimal(15,2) NOT NULL,
  `peso_total_kg` decimal(12,4) NOT NULL,
  `produto_predominante` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `produto_ncm` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_carga` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cep_carregamento` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cep_descarregamento` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `responsavel_seguro` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `responsavel_seguro_cpf_cnpj` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nome_seguradora` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_apolice` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `averbacao` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cnpj_seguradora` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `condutor_nome` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `condutor_cpf` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `placa_veiculo` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uf_veiculo` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rntrc_veiculo` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `veiculo_tipo_rodado` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `veiculo_tipo_carroceria` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `veiculo_tara_kg` int NOT NULL,
  `veiculo_capacidade_kg` int NOT NULL,
  `proprietario_veiculo_cpf_cnpj` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proprietario_veiculo_tipo` int NOT NULL,
  `proprietario_veiculo_nome` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `criado_por_id` int DEFAULT NULL,
  `tomador_cliente_id` int DEFAULT NULL,
  `ciot_cpf_cnpj` varchar(14) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `distancia_km` decimal(8,2) DEFAULT NULL,
  `numero_ciot` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_mdfe`),
  KEY `mdfe_manifestos_criado_por_id_793433bb_fk_auth_user_id` (`criado_por_id`),
  KEY `mdfe_manifestos_tomador_cliente_id_834707a0_fk_clientes_` (`tomador_cliente_id`),
  CONSTRAINT `mdfe_manifestos_criado_por_id_793433bb_fk_auth_user_id` FOREIGN KEY (`criado_por_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `mdfe_manifestos_tomador_cliente_id_834707a0_fk_clientes_` FOREIGN KEY (`tomador_cliente_id`) REFERENCES `clientes` (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mdfe_manifestos`
--

LOCK TABLES `mdfe_manifestos` WRITE;
/*!40000 ALTER TABLE `mdfe_manifestos` DISABLE KEYS */;
/*!40000 ALTER TABLE `mdfe_manifestos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mdfe_pagamento`
--

DROP TABLE IF EXISTS `mdfe_pagamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mdfe_pagamento` (
  `id_pagamento` int NOT NULL AUTO_INCREMENT,
  `tipo_pagamento` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `responsavel_pagamento` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `componente` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor` decimal(15,2) NOT NULL,
  `descricao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conta_bancaria` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chave_pix` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mdfe_id` int NOT NULL,
  PRIMARY KEY (`id_pagamento`),
  KEY `mdfe_pagamento_mdfe_id_21ba8050_fk_mdfe_manifestos_id_mdfe` (`mdfe_id`),
  CONSTRAINT `mdfe_pagamento_mdfe_id_21ba8050_fk_mdfe_manifestos_id_mdfe` FOREIGN KEY (`mdfe_id`) REFERENCES `mdfe_manifestos` (`id_mdfe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mdfe_pagamento`
--

LOCK TABLES `mdfe_pagamento` WRITE;
/*!40000 ALTER TABLE `mdfe_pagamento` DISABLE KEYS */;
/*!40000 ALTER TABLE `mdfe_pagamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mdfe_percursos`
--

DROP TABLE IF EXISTS `mdfe_percursos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mdfe_percursos` (
  `id_percurso` int NOT NULL AUTO_INCREMENT,
  `uf` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ordem` int NOT NULL,
  `mdfe_id` int NOT NULL,
  PRIMARY KEY (`id_percurso`),
  KEY `mdfe_percursos_mdfe_id_073d854e_fk_mdfe_manifestos_id_mdfe` (`mdfe_id`),
  CONSTRAINT `mdfe_percursos_mdfe_id_073d854e_fk_mdfe_manifestos_id_mdfe` FOREIGN KEY (`mdfe_id`) REFERENCES `mdfe_manifestos` (`id_mdfe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mdfe_percursos`
--

LOCK TABLES `mdfe_percursos` WRITE;
/*!40000 ALTER TABLE `mdfe_percursos` DISABLE KEYS */;
/*!40000 ALTER TABLE `mdfe_percursos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mdfe_reboques`
--

DROP TABLE IF EXISTS `mdfe_reboques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mdfe_reboques` (
  `id_reboque` int NOT NULL AUTO_INCREMENT,
  `placa` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uf` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rntrc` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tara_kg` int NOT NULL,
  `capacidade_kg` int NOT NULL,
  `tipo_carroceria` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mdfe_id` int NOT NULL,
  PRIMARY KEY (`id_reboque`),
  KEY `mdfe_reboques_mdfe_id_33f2a543_fk_mdfe_manifestos_id_mdfe` (`mdfe_id`),
  CONSTRAINT `mdfe_reboques_mdfe_id_33f2a543_fk_mdfe_manifestos_id_mdfe` FOREIGN KEY (`mdfe_id`) REFERENCES `mdfe_manifestos` (`id_mdfe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mdfe_reboques`
--

LOCK TABLES `mdfe_reboques` WRITE;
/*!40000 ALTER TABLE `mdfe_reboques` DISABLE KEYS */;
/*!40000 ALTER TABLE `mdfe_reboques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mdfe_vale_pedagio`
--

DROP TABLE IF EXISTS `mdfe_vale_pedagio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mdfe_vale_pedagio` (
  `id_vale_pedagio` int NOT NULL AUTO_INCREMENT,
  `categoria_veiculo` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_vale` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnpj_fornecedor` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cpf_cnpj_portador` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_comprovante` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor_pedagio` decimal(15,2) NOT NULL,
  `mdfe_id` int NOT NULL,
  PRIMARY KEY (`id_vale_pedagio`),
  KEY `mdfe_vale_pedagio_mdfe_id_12470a4e_fk_mdfe_manifestos_id_mdfe` (`mdfe_id`),
  CONSTRAINT `mdfe_vale_pedagio_mdfe_id_12470a4e_fk_mdfe_manifestos_id_mdfe` FOREIGN KEY (`mdfe_id`) REFERENCES `mdfe_manifestos` (`id_mdfe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mdfe_vale_pedagio`
--

LOCK TABLES `mdfe_vale_pedagio` WRITE;
/*!40000 ALTER TABLE `mdfe_vale_pedagio` DISABLE KEYS */;
/*!40000 ALTER TABLE `mdfe_vale_pedagio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mesas`
--

DROP TABLE IF EXISTS `mesas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mesas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `numero` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacidade` int NOT NULL,
  `localizacao` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativa` tinyint(1) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mesas`
--

LOCK TABLES `mesas` WRITE;
/*!40000 ALTER TABLE `mesas` DISABLE KEYS */;
/*!40000 ALTER TABLE `mesas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimentacao_caixa`
--

DROP TABLE IF EXISTS `movimentacao_caixa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimentacao_caixa` (
  `id_movimentacao` int NOT NULL AUTO_INCREMENT,
  `id_caixa` int NOT NULL,
  `tipo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SUPRIMENTO ou SANGRIA',
  `valor` decimal(10,2) NOT NULL,
  `data_movimentacao` datetime NOT NULL,
  `observacao` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`id_movimentacao`),
  KEY `id_caixa` (`id_caixa`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `movimentacao_caixa_ibfk_1` FOREIGN KEY (`id_caixa`) REFERENCES `controle_caixa` (`id_caixa`),
  CONSTRAINT `movimentacao_caixa_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimentacao_caixa`
--

LOCK TABLES `movimentacao_caixa` WRITE;
/*!40000 ALTER TABLE `movimentacao_caixa` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimentacao_caixa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimentos_estoque`
--

DROP TABLE IF EXISTS `movimentos_estoque`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimentos_estoque` (
  `id_mov` int NOT NULL AUTO_INCREMENT,
  `id_produto` int NOT NULL,
  `id_deposito` int DEFAULT NULL,
  `tipo` varchar(20) NOT NULL,
  `quantidade` decimal(14,3) NOT NULL DEFAULT '0.000',
  `antes` decimal(14,3) DEFAULT NULL,
  `depois` decimal(14,3) DEFAULT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_mov`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimentos_estoque`
--

LOCK TABLES `movimentos_estoque` WRITE;
/*!40000 ALTER TABLE `movimentos_estoque` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimentos_estoque` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mp_point_configuracao`
--

DROP TABLE IF EXISTS `mp_point_configuracao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mp_point_configuracao` (
  `id_config` int NOT NULL AUTO_INCREMENT,
  `access_token` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mp_user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ambiente` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `empresa_id` int NOT NULL,
  PRIMARY KEY (`id_config`),
  KEY `mp_point_configuraca_empresa_id_803b824c_fk_empresa_c` (`empresa_id`),
  CONSTRAINT `mp_point_configuraca_empresa_id_803b824c_fk_empresa_c` FOREIGN KEY (`empresa_id`) REFERENCES `empresa_config` (`id_empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mp_point_configuracao`
--

LOCK TABLES `mp_point_configuracao` WRITE;
/*!40000 ALTER TABLE `mp_point_configuracao` DISABLE KEYS */;
/*!40000 ALTER TABLE `mp_point_configuracao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mp_point_transacoes`
--

DROP TABLE IF EXISTS `mp_point_transacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mp_point_transacoes` (
  `id_transacao` int NOT NULL AUTO_INCREMENT,
  `uuid` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_intent_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor` decimal(12,2) NOT NULL,
  `descricao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalhe_status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_pagamento` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parcelas` int NOT NULL,
  `payload_webhook` json DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `config_id` int DEFAULT NULL,
  `criado_por_id` int DEFAULT NULL,
  `id_venda_id` int DEFAULT NULL,
  PRIMARY KEY (`id_transacao`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `mp_point_transacoes_payment_intent_id_5f93e86c` (`payment_intent_id`),
  KEY `mp_point_transacoes_config_id_72e77d7f_fk_mp_point_` (`config_id`),
  KEY `mp_point_transacoes_criado_por_id_b35be90d_fk_auth_user_id` (`criado_por_id`),
  KEY `mp_point_transacoes_id_venda_id_a7e633ba_fk_vendas_id_venda` (`id_venda_id`),
  CONSTRAINT `mp_point_transacoes_config_id_72e77d7f_fk_mp_point_` FOREIGN KEY (`config_id`) REFERENCES `mp_point_configuracao` (`id_config`),
  CONSTRAINT `mp_point_transacoes_criado_por_id_b35be90d_fk_auth_user_id` FOREIGN KEY (`criado_por_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `mp_point_transacoes_id_venda_id_a7e633ba_fk_vendas_id_venda` FOREIGN KEY (`id_venda_id`) REFERENCES `vendas` (`id_venda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mp_point_transacoes`
--

LOCK TABLES `mp_point_transacoes` WRITE;
/*!40000 ALTER TABLE `mp_point_transacoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `mp_point_transacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notas_fiscais_referenciadas`
--

DROP TABLE IF EXISTS `notas_fiscais_referenciadas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notas_fiscais_referenciadas` (
  `id_nota_referenciada` int NOT NULL AUTO_INCREMENT,
  `tipo_documento` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chave_acesso` varchar(44) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_documento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serie_documento` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_emissao` datetime(6) DEFAULT NULL,
  `valor_total` decimal(12,2) DEFAULT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_cadastro` datetime(6) NOT NULL,
  `id_venda` int NOT NULL,
  PRIMARY KEY (`id_nota_referenciada`),
  KEY `notas_fisca_id_vend_9a865c_idx` (`id_venda`),
  KEY `notas_fisca_chave_a_51c576_idx` (`chave_acesso`),
  CONSTRAINT `notas_fiscais_referenciadas_id_venda_ac20caab_fk_vendas_id_venda` FOREIGN KEY (`id_venda`) REFERENCES `vendas` (`id_venda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notas_fiscais_referenciadas`
--

LOCK TABLES `notas_fiscais_referenciadas` WRITE;
/*!40000 ALTER TABLE `notas_fiscais_referenciadas` DISABLE KEYS */;
/*!40000 ALTER TABLE `notas_fiscais_referenciadas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `numeracao`
--

DROP TABLE IF EXISTS `numeracao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `numeracao` (
  `id_numeracao` int NOT NULL AUTO_INCREMENT,
  `descricao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numeracao` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_numeracao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `numeracao`
--

LOCK TABLES `numeracao` WRITE;
/*!40000 ALTER TABLE `numeracao` DISABLE KEYS */;
/*!40000 ALTER TABLE `numeracao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operacao_numeracoes`
--

DROP TABLE IF EXISTS `operacao_numeracoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operacao_numeracoes` (
  `id_numeracao` int NOT NULL AUTO_INCREMENT,
  `serie` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ambiente` int NOT NULL,
  `numero_inicial` int NOT NULL,
  `numero_atual` int NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `id_operacao` int NOT NULL,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero` int NOT NULL,
  PRIMARY KEY (`id_numeracao`),
  KEY `operacao_numeracoes_id_operacao_7495ec21_fk_operacoes` (`id_operacao`),
  CONSTRAINT `operacao_numeracoes_id_operacao_7495ec21_fk_operacoes` FOREIGN KEY (`id_operacao`) REFERENCES `operacoes` (`id_operacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operacao_numeracoes`
--

LOCK TABLES `operacao_numeracoes` WRITE;
/*!40000 ALTER TABLE `operacao_numeracoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `operacao_numeracoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operacoes`
--

DROP TABLE IF EXISTS `operacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operacoes` (
  `id_operacao` int NOT NULL AUTO_INCREMENT,
  `nome_operacao` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abreviacao` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `empresa` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transacao` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo_documento` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emitente` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usa_auto_numeracao` int DEFAULT NULL,
  `serie_nf` int DEFAULT NULL,
  `proximo_numero_nf` int DEFAULT NULL,
  `tipo_estoque_baixa` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gera_financeiro` int DEFAULT NULL,
  `tipo_estoque_incremento` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `incrementar_estoque` int DEFAULT NULL,
  `id_deposito_incremento` int DEFAULT NULL,
  `id_deposito_baixa` int DEFAULT NULL,
  `validacao_limite_credito` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cashback_percentual` decimal(5,2) DEFAULT NULL,
  `cashback_validade_dias` int DEFAULT NULL,
  `baixa_automatica` tinyint(1) NOT NULL,
  `validar_atraso` tinyint(1) NOT NULL,
  `dias_atraso_tolerancia` int DEFAULT NULL,
  `acao_atraso` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `validar_estoque` tinyint(1) NOT NULL,
  `acao_estoque` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entrega_futura` tinyint(1) NOT NULL,
  `tipo_entrega_futura` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `limite_desconto_percentual` decimal(5,2) DEFAULT NULL,
  `venda_veiculo_novo` tinyint(1) NOT NULL,
  `ind_faturamento` tinyint(1) NOT NULL,
  `tipo_faturamento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `validar_estoque_fiscal` tinyint(1) NOT NULL,
  `id_numeracao` int DEFAULT NULL,
  `validar_valor_estoque` tinyint(1) DEFAULT NULL,
  `acao_valor_estoque` enum('nao_validar','alertar','bloquear','solicitar_senha') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_estoque_baixa` int DEFAULT NULL,
  PRIMARY KEY (`id_operacao`),
  KEY `operacoes_id_numeracao_30a1c824_fk_numeracao_id_numeracao` (`id_numeracao`),
  CONSTRAINT `operacoes_id_numeracao_30a1c824_fk_numeracao_id_numeracao` FOREIGN KEY (`id_numeracao`) REFERENCES `numeracao` (`id_numeracao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operacoes`
--

LOCK TABLES `operacoes` WRITE;
/*!40000 ALTER TABLE `operacoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `operacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordem_servico`
--

DROP TABLE IF EXISTS `ordem_servico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordem_servico` (
  `id_os` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `id_tecnico` int DEFAULT NULL,
  `id_veiculo` int DEFAULT NULL,
  `id_equipamento` int DEFAULT NULL,
  `id_animal` int DEFAULT NULL,
  `id_operacao` int DEFAULT NULL,
  `status_os` enum('Aberta','Em Andamento','Aguardando Pe├ºa','Finalizada','Cancelada') NOT NULL DEFAULT 'Aberta',
  `id_status` int DEFAULT NULL,
  `data_abertura` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_finalizacao` datetime DEFAULT NULL,
  `descricao_problema` text,
  `laudo_tecnico` text,
  `valor_total_produtos` decimal(10,2) DEFAULT '0.00',
  `valor_total_servicos` decimal(10,2) DEFAULT '0.00',
  `valor_desconto` decimal(10,2) DEFAULT '0.00',
  `valor_total_os` decimal(10,2) DEFAULT '0.00',
  `gera_financeiro` tinyint(1) NOT NULL DEFAULT '0',
  `desconto_produtos` decimal(10,2) DEFAULT '0.00' COMMENT 'Valor do desconto aplicado aos produtos',
  `tipo_desconto_produtos` enum('valor','porcentagem') DEFAULT 'valor' COMMENT 'Tipo do desconto de produtos: valor em R$ ou porcentagem',
  `desconto_servicos` decimal(10,2) DEFAULT '0.00' COMMENT 'Valor do desconto aplicado aos servi??os',
  `tipo_desconto_servicos` enum('valor','porcentagem') DEFAULT 'valor' COMMENT 'Tipo do desconto de servi??os: valor em R$ ou porcentagem',
  `solicitante` varchar(255) DEFAULT NULL COMMENT 'Nome do solicitante da ordem de servi??o',
  `numero_nfse` varchar(50) DEFAULT NULL,
  `chave_nfse` varchar(100) DEFAULT NULL,
  `status_nfse` varchar(20) DEFAULT NULL,
  `data_emissao_nfse` datetime DEFAULT NULL,
  `xml_url` text,
  `numero_dps` int DEFAULT NULL,
  `serie_dps` varchar(5) DEFAULT NULL,
  `tipo_emissao_dps` varchar(20) DEFAULT 'normal',
  PRIMARY KEY (`id_os`),
  KEY `fk_os_cliente_idx` (`id_cliente`),
  KEY `fk_os_tecnico_idx` (`id_tecnico`),
  KEY `fk_os_veiculo_idx` (`id_veiculo`),
  KEY `fk_os_equipamento_idx` (`id_equipamento`),
  KEY `fk_os_animal_idx` (`id_animal`),
  KEY `fk_os_operacao_idx` (`id_operacao`),
  KEY `fk_os_status` (`id_status`),
  CONSTRAINT `fk_os_animal` FOREIGN KEY (`id_animal`) REFERENCES `animais` (`id_animal`) ON DELETE SET NULL,
  CONSTRAINT `fk_os_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `fk_os_equipamento` FOREIGN KEY (`id_equipamento`) REFERENCES `equipamentos` (`id_equipamento`) ON DELETE SET NULL,
  CONSTRAINT `fk_os_operacao` FOREIGN KEY (`id_operacao`) REFERENCES `operacoes` (`id_operacao`) ON DELETE SET NULL,
  CONSTRAINT `fk_os_status` FOREIGN KEY (`id_status`) REFERENCES `status_ordem_servico` (`id_status`),
  CONSTRAINT `fk_os_tecnico` FOREIGN KEY (`id_tecnico`) REFERENCES `tecnicos` (`id_tecnico`) ON DELETE SET NULL,
  CONSTRAINT `fk_os_veiculo` FOREIGN KEY (`id_veiculo`) REFERENCES `veiculos` (`id_veiculo`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordem_servico`
--

LOCK TABLES `ordem_servico` WRITE;
/*!40000 ALTER TABLE `ordem_servico` DISABLE KEYS */;
/*!40000 ALTER TABLE `ordem_servico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `os_assinaturas`
--

DROP TABLE IF EXISTS `os_assinaturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `os_assinaturas` (
  `id_os_assinatura` int NOT NULL AUTO_INCREMENT,
  `nome_assinante` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assinatura_base64` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_assinatura` datetime(6) NOT NULL,
  `id_os` int NOT NULL,
  PRIMARY KEY (`id_os_assinatura`),
  UNIQUE KEY `id_os` (`id_os`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `os_assinaturas`
--

LOCK TABLES `os_assinaturas` WRITE;
/*!40000 ALTER TABLE `os_assinaturas` DISABLE KEYS */;
/*!40000 ALTER TABLE `os_assinaturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `os_fotos`
--

DROP TABLE IF EXISTS `os_fotos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `os_fotos` (
  `id_os_foto` int NOT NULL AUTO_INCREMENT,
  `nome_arquivo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `imagem_base64` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_criacao` datetime(6) NOT NULL,
  `id_os` int NOT NULL,
  PRIMARY KEY (`id_os_foto`),
  KEY `os_fotos_id_os_0b98ecd6` (`id_os`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `os_fotos`
--

LOCK TABLES `os_fotos` WRITE;
/*!40000 ALTER TABLE `os_fotos` DISABLE KEYS */;
/*!40000 ALTER TABLE `os_fotos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `os_itens_produtos`
--

DROP TABLE IF EXISTS `os_itens_produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `os_itens_produtos` (
  `id_os_item_produto` int NOT NULL AUTO_INCREMENT,
  `id_os` int NOT NULL,
  `id_produto` int NOT NULL,
  `quantidade` decimal(10,3) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `desconto` decimal(10,2) DEFAULT '0.00' COMMENT 'Desconto aplicado neste item',
  PRIMARY KEY (`id_os_item_produto`),
  KEY `fk_os_produtos_os_idx` (`id_os`),
  KEY `fk_os_produtos_produto_idx` (`id_produto`),
  CONSTRAINT `fk_os_produtos_os` FOREIGN KEY (`id_os`) REFERENCES `ordem_servico` (`id_os`) ON DELETE CASCADE,
  CONSTRAINT `fk_os_produtos_produto` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `os_itens_produtos`
--

LOCK TABLES `os_itens_produtos` WRITE;
/*!40000 ALTER TABLE `os_itens_produtos` DISABLE KEYS */;
/*!40000 ALTER TABLE `os_itens_produtos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `os_itens_servicos`
--

DROP TABLE IF EXISTS `os_itens_servicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `os_itens_servicos` (
  `id_os_item_servico` int NOT NULL AUTO_INCREMENT,
  `id_os` int NOT NULL,
  `id_tecnico_executante` int DEFAULT NULL,
  `descricao_servico` varchar(255) NOT NULL,
  `quantidade` decimal(10,2) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `desconto` decimal(10,2) DEFAULT '0.00' COMMENT 'Desconto aplicado neste item',
  PRIMARY KEY (`id_os_item_servico`),
  KEY `fk_os_servicos_os_idx` (`id_os`),
  KEY `fk_os_servicos_tecnico_idx` (`id_tecnico_executante`),
  CONSTRAINT `fk_os_servicos_os` FOREIGN KEY (`id_os`) REFERENCES `ordem_servico` (`id_os`) ON DELETE CASCADE,
  CONSTRAINT `fk_os_servicos_tecnico` FOREIGN KEY (`id_tecnico_executante`) REFERENCES `tecnicos` (`id_tecnico`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `os_itens_servicos`
--

LOCK TABLES `os_itens_servicos` WRITE;
/*!40000 ALTER TABLE `os_itens_servicos` DISABLE KEYS */;
/*!40000 ALTER TABLE `os_itens_servicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagamentos_comanda`
--

DROP TABLE IF EXISTS `pagamentos_comanda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagamentos_comanda` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `forma_pagamento` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `comanda_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pagamentos_comanda_comanda_id_f9bcd247_fk_comandas_id` (`comanda_id`),
  CONSTRAINT `pagamentos_comanda_comanda_id_f9bcd247_fk_comandas_id` FOREIGN KEY (`comanda_id`) REFERENCES `comandas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagamentos_comanda`
--

LOCK TABLES `pagamentos_comanda` WRITE;
/*!40000 ALTER TABLE `pagamentos_comanda` DISABLE KEYS */;
/*!40000 ALTER TABLE `pagamentos_comanda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pcp_composicao_produto`
--

DROP TABLE IF EXISTS `pcp_composicao_produto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pcp_composicao_produto` (
  `id_composicao` int NOT NULL AUTO_INCREMENT,
  `quantidade_necessaria` decimal(12,4) NOT NULL,
  `percentual_perda` decimal(5,2) NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `observacao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `id_insumo` int NOT NULL,
  `id_produto_acabado` int NOT NULL,
  PRIMARY KEY (`id_composicao`),
  UNIQUE KEY `pcp_composicao_produto_id_produto_acabado_id_in_b330ee7b_uniq` (`id_produto_acabado`,`id_insumo`),
  KEY `pcp_composicao_produto_id_insumo_b4735a28_fk_produtos_id_produto` (`id_insumo`),
  CONSTRAINT `pcp_composicao_produ_id_produto_acabado_69d0abc7_fk_produtos_` FOREIGN KEY (`id_produto_acabado`) REFERENCES `produtos` (`id_produto`),
  CONSTRAINT `pcp_composicao_produto_id_insumo_b4735a28_fk_produtos_id_produto` FOREIGN KEY (`id_insumo`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pcp_composicao_produto`
--

LOCK TABLES `pcp_composicao_produto` WRITE;
/*!40000 ALTER TABLE `pcp_composicao_produto` DISABLE KEYS */;
/*!40000 ALTER TABLE `pcp_composicao_produto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pcp_ficha_insumos`
--

DROP TABLE IF EXISTS `pcp_ficha_insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pcp_ficha_insumos` (
  `id_insumo` int NOT NULL AUTO_INCREMENT,
  `quantidade` decimal(12,4) NOT NULL,
  `unidade` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `perda_percentual` decimal(5,2) NOT NULL,
  `observacoes` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_ficha` int NOT NULL,
  `id_produto_insumo` int NOT NULL,
  PRIMARY KEY (`id_insumo`),
  KEY `pcp_ficha_insumos_id_ficha_c5d177a2_fk_pcp_ficha` (`id_ficha`),
  KEY `pcp_ficha_insumos_id_produto_insumo_78c8fd5d_fk_produtos_` (`id_produto_insumo`),
  CONSTRAINT `pcp_ficha_insumos_id_ficha_c5d177a2_fk_pcp_ficha` FOREIGN KEY (`id_ficha`) REFERENCES `pcp_ficha_tecnica` (`id_ficha`),
  CONSTRAINT `pcp_ficha_insumos_id_produto_insumo_78c8fd5d_fk_produtos_` FOREIGN KEY (`id_produto_insumo`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pcp_ficha_insumos`
--

LOCK TABLES `pcp_ficha_insumos` WRITE;
/*!40000 ALTER TABLE `pcp_ficha_insumos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pcp_ficha_insumos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pcp_ficha_tecnica`
--

DROP TABLE IF EXISTS `pcp_ficha_tecnica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pcp_ficha_tecnica` (
  `id_ficha` int NOT NULL AUTO_INCREMENT,
  `descricao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rendimento` decimal(10,3) NOT NULL,
  `tempo_producao_min` int DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `id_produto_acabado` int NOT NULL,
  PRIMARY KEY (`id_ficha`),
  KEY `pcp_ficha_tecnica_id_produto_acabado_e7dcfc1e_fk_produtos_` (`id_produto_acabado`),
  CONSTRAINT `pcp_ficha_tecnica_id_produto_acabado_e7dcfc1e_fk_produtos_` FOREIGN KEY (`id_produto_acabado`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pcp_ficha_tecnica`
--

LOCK TABLES `pcp_ficha_tecnica` WRITE;
/*!40000 ALTER TABLE `pcp_ficha_tecnica` DISABLE KEYS */;
/*!40000 ALTER TABLE `pcp_ficha_tecnica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pcp_op_consumos`
--

DROP TABLE IF EXISTS `pcp_op_consumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pcp_op_consumos` (
  `id_consumo` int NOT NULL AUTO_INCREMENT,
  `quantidade_planejada` decimal(12,4) NOT NULL,
  `quantidade_consumida` decimal(12,4) NOT NULL,
  `custo_unitario` decimal(12,4) NOT NULL,
  `custo_total` decimal(14,2) NOT NULL,
  `data_baixa` datetime(6) NOT NULL,
  `id_op` int NOT NULL,
  `id_produto_insumo` int NOT NULL,
  PRIMARY KEY (`id_consumo`),
  KEY `pcp_op_consumos_id_op_3d602c75_fk_pcp_ordens_producao_id_op` (`id_op`),
  KEY `pcp_op_consumos_id_produto_insumo_a071b4fd_fk_produtos_` (`id_produto_insumo`),
  CONSTRAINT `pcp_op_consumos_id_op_3d602c75_fk_pcp_ordens_producao_id_op` FOREIGN KEY (`id_op`) REFERENCES `pcp_ordens_producao` (`id_op`),
  CONSTRAINT `pcp_op_consumos_id_produto_insumo_a071b4fd_fk_produtos_` FOREIGN KEY (`id_produto_insumo`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pcp_op_consumos`
--

LOCK TABLES `pcp_op_consumos` WRITE;
/*!40000 ALTER TABLE `pcp_op_consumos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pcp_op_consumos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pcp_ordem_producao`
--

DROP TABLE IF EXISTS `pcp_ordem_producao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pcp_ordem_producao` (
  `id_op` int NOT NULL AUTO_INCREMENT,
  `quantidade_planejada` decimal(12,3) NOT NULL,
  `quantidade_produzida` decimal(12,3) NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `custo_total` decimal(15,2) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_abertura` datetime(6) NOT NULL,
  `data_inicio_producao` datetime(6) DEFAULT NULL,
  `data_finalizacao` datetime(6) DEFAULT NULL,
  `id_criado_por` int DEFAULT NULL,
  `id_deposito` int NOT NULL,
  `id_produto` int NOT NULL,
  PRIMARY KEY (`id_op`),
  KEY `pcp_ordem_producao_status_044726d5` (`status`),
  KEY `pcp_ordem_producao_id_criado_por_575c98d5_fk_auth_user_id` (`id_criado_por`),
  KEY `pcp_ordem_producao_id_deposito_c1457dfe_fk_deposito_id` (`id_deposito`),
  KEY `pcp_ordem_producao_id_produto_b267e389_fk_produtos_id_produto` (`id_produto`),
  CONSTRAINT `pcp_ordem_producao_id_criado_por_575c98d5_fk_auth_user_id` FOREIGN KEY (`id_criado_por`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `pcp_ordem_producao_id_deposito_c1457dfe_fk_deposito_id` FOREIGN KEY (`id_deposito`) REFERENCES `deposito` (`id`),
  CONSTRAINT `pcp_ordem_producao_id_produto_b267e389_fk_produtos_id_produto` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pcp_ordem_producao`
--

LOCK TABLES `pcp_ordem_producao` WRITE;
/*!40000 ALTER TABLE `pcp_ordem_producao` DISABLE KEYS */;
/*!40000 ALTER TABLE `pcp_ordem_producao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pcp_ordens_producao`
--

DROP TABLE IF EXISTS `pcp_ordens_producao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pcp_ordens_producao` (
  `id_op` int NOT NULL AUTO_INCREMENT,
  `numero_op` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantidade_planejada` decimal(12,3) NOT NULL,
  `quantidade_produzida` decimal(12,3) NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_abertura` datetime(6) NOT NULL,
  `data_previsao` date DEFAULT NULL,
  `data_inicio` datetime(6) DEFAULT NULL,
  `data_conclusao` datetime(6) DEFAULT NULL,
  `custo_total` decimal(14,2) NOT NULL,
  `mao_obra_valor` decimal(14,2) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `criado_por` int DEFAULT NULL,
  `id_ficha` int NOT NULL,
  PRIMARY KEY (`id_op`),
  UNIQUE KEY `numero_op` (`numero_op`),
  KEY `pcp_ordens_producao_criado_por_2490f0cb_fk_auth_user_id` (`criado_por`),
  KEY `pcp_ordens_producao_id_ficha_8f1e2ee4_fk_pcp_ficha` (`id_ficha`),
  CONSTRAINT `pcp_ordens_producao_criado_por_2490f0cb_fk_auth_user_id` FOREIGN KEY (`criado_por`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `pcp_ordens_producao_id_ficha_8f1e2ee4_fk_pcp_ficha` FOREIGN KEY (`id_ficha`) REFERENCES `pcp_ficha_tecnica` (`id_ficha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pcp_ordens_producao`
--

LOCK TABLES `pcp_ordens_producao` WRITE;
/*!40000 ALTER TABLE `pcp_ordens_producao` DISABLE KEYS */;
/*!40000 ALTER TABLE `pcp_ordens_producao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissoes_modulos`
--

DROP TABLE IF EXISTS `permissoes_modulos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissoes_modulos` (
  `id_permissao` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `nome_modulo` varchar(50) NOT NULL,
  `pode_acessar` tinyint(1) NOT NULL DEFAULT '0',
  `pode_criar` tinyint(1) NOT NULL DEFAULT '0',
  `pode_editar` tinyint(1) NOT NULL DEFAULT '0',
  `pode_excluir` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_permissao`),
  KEY `fk_permissoes_usuario_idx` (`id_usuario`),
  CONSTRAINT `fk_permissoes_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissoes_modulos`
--

LOCK TABLES `permissoes_modulos` WRITE;
/*!40000 ALTER TABLE `permissoes_modulos` DISABLE KEYS */;
/*!40000 ALTER TABLE `permissoes_modulos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petshop_agendamentos`
--

DROP TABLE IF EXISTS `petshop_agendamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `petshop_agendamentos` (
  `id_agendamento` int NOT NULL AUTO_INCREMENT,
  `tipo_agendamento` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantidade_sessoes` int NOT NULL,
  `data_agendamento` datetime(6) NOT NULL,
  `data_conclusao` datetime(6) DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `preco_servico` decimal(10,2) NOT NULL,
  `preco_total_pacote` decimal(10,2) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_criacao` datetime(6) NOT NULL,
  `data_modificacao` datetime(6) NOT NULL,
  `id_cliente` int NOT NULL,
  `id_pet` int NOT NULL,
  `id_tipo_servico` int DEFAULT NULL,
  PRIMARY KEY (`id_agendamento`),
  KEY `petshop_agendamentos_id_tipo_servico_318456f5_fk_petshop_t` (`id_tipo_servico`),
  KEY `petshop_age_id_clie_07d9a3_idx` (`id_cliente`,`data_agendamento`),
  KEY `petshop_age_id_pet_8eb8f7_idx` (`id_pet`,`status`),
  CONSTRAINT `petshop_agendamentos_id_cliente_2752ff0b_fk_clientes_id_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `petshop_agendamentos_id_pet_8d4d5d14_fk_petshop_pets_id_pet` FOREIGN KEY (`id_pet`) REFERENCES `petshop_pets` (`id_pet`),
  CONSTRAINT `petshop_agendamentos_id_tipo_servico_318456f5_fk_petshop_t` FOREIGN KEY (`id_tipo_servico`) REFERENCES `petshop_tipo_servicos` (`id_tipo_servico`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petshop_agendamentos`
--

LOCK TABLES `petshop_agendamentos` WRITE;
/*!40000 ALTER TABLE `petshop_agendamentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `petshop_agendamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petshop_avaliacoes`
--

DROP TABLE IF EXISTS `petshop_avaliacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `petshop_avaliacoes` (
  `id_avaliacao` int NOT NULL AUTO_INCREMENT,
  `nota` int NOT NULL,
  `comentario` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_avaliacao` datetime(6) NOT NULL,
  `id_agendamento` int NOT NULL,
  `id_cliente` int NOT NULL,
  PRIMARY KEY (`id_avaliacao`),
  KEY `petshop_avaliacoes_id_agendamento_8886cbe3_fk_petshop_a` (`id_agendamento`),
  KEY `petshop_avaliacoes_id_cliente_6e2d3dfc_fk_clientes_id_cliente` (`id_cliente`),
  CONSTRAINT `petshop_avaliacoes_id_agendamento_8886cbe3_fk_petshop_a` FOREIGN KEY (`id_agendamento`) REFERENCES `petshop_agendamentos` (`id_agendamento`),
  CONSTRAINT `petshop_avaliacoes_id_cliente_6e2d3dfc_fk_clientes_id_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petshop_avaliacoes`
--

LOCK TABLES `petshop_avaliacoes` WRITE;
/*!40000 ALTER TABLE `petshop_avaliacoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `petshop_avaliacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petshop_pets`
--

DROP TABLE IF EXISTS `petshop_pets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `petshop_pets` (
  `id_pet` int NOT NULL AUTO_INCREMENT,
  `nome_pet` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `raca` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sexo` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_nascimento` date DEFAULT NULL,
  `peso` decimal(5,2) DEFAULT NULL,
  `cor` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_cadastro` datetime(6) NOT NULL,
  `id_cliente` int NOT NULL,
  `microchip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `especie` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_pet`),
  KEY `petshop_pets_id_cliente_a53ad53e_fk_clientes_id_cliente` (`id_cliente`),
  CONSTRAINT `petshop_pets_id_cliente_a53ad53e_fk_clientes_id_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petshop_pets`
--

LOCK TABLES `petshop_pets` WRITE;
/*!40000 ALTER TABLE `petshop_pets` DISABLE KEYS */;
/*!40000 ALTER TABLE `petshop_pets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petshop_sessoes_agendamento`
--

DROP TABLE IF EXISTS `petshop_sessoes_agendamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `petshop_sessoes_agendamento` (
  `id_sessao` int NOT NULL AUTO_INCREMENT,
  `numero_sessao` int NOT NULL,
  `data_sessao` datetime(6) NOT NULL,
  `data_realizacao` datetime(6) DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_criacao` datetime(6) NOT NULL,
  `id_agendamento` int NOT NULL,
  PRIMARY KEY (`id_sessao`),
  UNIQUE KEY `petshop_sessoes_agendame_id_agendamento_numero_se_4a6f69f8_uniq` (`id_agendamento`,`numero_sessao`),
  CONSTRAINT `petshop_sessoes_agen_id_agendamento_650129cb_fk_petshop_a` FOREIGN KEY (`id_agendamento`) REFERENCES `petshop_agendamentos` (`id_agendamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petshop_sessoes_agendamento`
--

LOCK TABLES `petshop_sessoes_agendamento` WRITE;
/*!40000 ALTER TABLE `petshop_sessoes_agendamento` DISABLE KEYS */;
/*!40000 ALTER TABLE `petshop_sessoes_agendamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `petshop_tipo_servicos`
--

DROP TABLE IF EXISTS `petshop_tipo_servicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `petshop_tipo_servicos` (
  `id_tipo_servico` int NOT NULL AUTO_INCREMENT,
  `nome_servico` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `duracao_minutos` int NOT NULL,
  `preco_base` decimal(10,2) NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `data_criacao` datetime(6) NOT NULL,
  PRIMARY KEY (`id_tipo_servico`),
  UNIQUE KEY `nome_servico` (`nome_servico`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `petshop_tipo_servicos`
--

LOCK TABLES `petshop_tipo_servicos` WRITE;
/*!40000 ALTER TABLE `petshop_tipo_servicos` DISABLE KEYS */;
/*!40000 ALTER TABLE `petshop_tipo_servicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pix_cobranca`
--

DROP TABLE IF EXISTS `pix_cobranca`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pix_cobranca` (
  `id_cobranca` int NOT NULL AUTO_INCREMENT,
  `uuid` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` decimal(12,2) NOT NULL,
  `descricao` varchar(140) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `validade_segundos` int unsigned NOT NULL,
  `pagador_nome` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagador_cpf_cnpj` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_venda` int DEFAULT NULL,
  `referencia_externa` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `txid` varchar(35) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qr_code_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `qr_code_imagem_base64` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `link_visualizacao` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pago_em` datetime(6) DEFAULT NULL,
  `valor_pago` decimal(12,2) DEFAULT NULL,
  `end_to_end_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagador_nome_confirmado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagador_cpf_confirmado` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `infopagador` varchar(140) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_lancamento_financeiro` int DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `expira_em` datetime(6) DEFAULT NULL,
  `criado_por_id` int DEFAULT NULL,
  `config_pix_id` int DEFAULT NULL,
  PRIMARY KEY (`id_cobranca`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `pix_cobranca_criado_por_id_c07c7173_fk_auth_user_id` (`criado_por_id`),
  KEY `pix_cobranca_config_pix_id_d98d314f_fk_pix_confi` (`config_pix_id`),
  KEY `pix_cobranc_txid_ae9220_idx` (`txid`),
  KEY `pix_cobranc_status_4af061_idx` (`status`),
  KEY `pix_cobranc_id_vend_bee654_idx` (`id_venda`),
  CONSTRAINT `pix_cobranca_config_pix_id_d98d314f_fk_pix_confi` FOREIGN KEY (`config_pix_id`) REFERENCES `pix_configuracao` (`id_config`),
  CONSTRAINT `pix_cobranca_criado_por_id_c07c7173_fk_auth_user_id` FOREIGN KEY (`criado_por_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `pix_cobranca_chk_1` CHECK ((`validade_segundos` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pix_cobranca`
--

LOCK TABLES `pix_cobranca` WRITE;
/*!40000 ALTER TABLE `pix_cobranca` DISABLE KEYS */;
/*!40000 ALTER TABLE `pix_cobranca` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pix_configuracao`
--

DROP TABLE IF EXISTS `pix_configuracao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pix_configuracao` (
  `id_config` int NOT NULL AUTO_INCREMENT,
  `psp` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_chave` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chave_pix` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_secret` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certificado_base64` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `webhook_secret` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ambiente` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `empresa_id` int NOT NULL,
  PRIMARY KEY (`id_config`),
  KEY `pix_configuracao_empresa_id_83e89083_fk_empresa_c` (`empresa_id`),
  CONSTRAINT `pix_configuracao_empresa_id_83e89083_fk_empresa_c` FOREIGN KEY (`empresa_id`) REFERENCES `empresa_config` (`id_empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pix_configuracao`
--

LOCK TABLES `pix_configuracao` WRITE;
/*!40000 ALTER TABLE `pix_configuracao` DISABLE KEYS */;
/*!40000 ALTER TABLE `pix_configuracao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pix_webhook_log`
--

DROP TABLE IF EXISTS `pix_webhook_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pix_webhook_log` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `txid` varchar(35) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payload_raw` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_origem` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processado` tinyint(1) NOT NULL,
  `erro` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recebido_em` datetime(6) NOT NULL,
  `cobranca_id` int DEFAULT NULL,
  PRIMARY KEY (`id_log`),
  KEY `pix_webhook_log_cobranca_id_f5bb792a_fk_pix_cobranca_id_cobranca` (`cobranca_id`),
  CONSTRAINT `pix_webhook_log_cobranca_id_f5bb792a_fk_pix_cobranca_id_cobranca` FOREIGN KEY (`cobranca_id`) REFERENCES `pix_cobranca` (`id_cobranca`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pix_webhook_log`
--

LOCK TABLES `pix_webhook_log` WRITE;
/*!40000 ALTER TABLE `pix_webhook_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `pix_webhook_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `precos_concorrencia`
--

DROP TABLE IF EXISTS `precos_concorrencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `precos_concorrencia` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ean` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome_loja` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `distancia_km` decimal(6,2) DEFAULT NULL,
  `preco` decimal(10,2) NOT NULL,
  `data_coleta` datetime(6) NOT NULL,
  `fonte` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dados_origem_json` json DEFAULT NULL,
  `produto_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `precos_concorrencia_ean_4c163659` (`ean`),
  KEY `precos_concorrencia_data_coleta_68d368f3` (`data_coleta`),
  KEY `precos_conc_ean_750f35_idx` (`ean`,`data_coleta`),
  KEY `precos_conc_produto_092499_idx` (`produto_id`,`data_coleta`),
  CONSTRAINT `precos_concorrencia_produto_id_0dae85ec_fk_produtos_id_produto` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `precos_concorrencia`
--

LOCK TABLES `precos_concorrencia` WRITE;
/*!40000 ALTER TABLE `precos_concorrencia` DISABLE KEYS */;
/*!40000 ALTER TABLE `precos_concorrencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produto_balanca`
--

DROP TABLE IF EXISTS `produto_balanca`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produto_balanca` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `codigo_plu` int NOT NULL,
  `tara` decimal(10,3) NOT NULL,
  `validade_dias` int NOT NULL,
  `departamento` int NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `exportado_em` datetime(6) DEFAULT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `configuracao_id` bigint NOT NULL,
  `produto_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `produto_balanca_configuracao_id_codigo_plu_0ff60a8b_uniq` (`configuracao_id`,`codigo_plu`),
  UNIQUE KEY `produto_balanca_configuracao_id_produto_id_e176cd04_uniq` (`configuracao_id`,`produto_id`),
  KEY `produto_balanca_produto_id_8d8c992c_fk_produtos_id_produto` (`produto_id`),
  CONSTRAINT `produto_balanca_configuracao_id_71845fae_fk_configura` FOREIGN KEY (`configuracao_id`) REFERENCES `configuracao_balanca` (`id`),
  CONSTRAINT `produto_balanca_produto_id_8d8c992c_fk_produtos_id_produto` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produto_balanca`
--

LOCK TABLES `produto_balanca` WRITE;
/*!40000 ALTER TABLE `produto_balanca` DISABLE KEYS */;
/*!40000 ALTER TABLE `produto_balanca` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos` (
  `id_produto` int NOT NULL AUTO_INCREMENT,
  `codigo_produto` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome_produto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `unidade_medida` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marca` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `classificacao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ncm` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cest` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `imagem_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `disponivel_web` tinyint(1) NOT NULL,
  `preco_web` decimal(12,2) DEFAULT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gtin` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metragem_caixa` decimal(10,2) DEFAULT NULL,
  `rendimento_m2` decimal(10,2) DEFAULT NULL,
  `peso_unitario` decimal(10,3) DEFAULT NULL,
  `consumo_argamassa_m2` decimal(5,2) DEFAULT NULL,
  `peso_saco_argamassa` decimal(5,2) DEFAULT NULL,
  `tipo_aplicacao_argamassa` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `variacao` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `controla_lote` tinyint(1) NOT NULL,
  `genero` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `localizacao` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_grupo` int DEFAULT NULL,
  `id_produto_pai` int DEFAULT NULL,
  PRIMARY KEY (`id_produto`),
  UNIQUE KEY `codigo_produto` (`codigo_produto`),
  UNIQUE KEY `slug` (`slug`),
  KEY `produtos_id_grupo_fae13939_fk_grupos_produto_id_grupo` (`id_grupo`),
  KEY `produtos_id_produto_pai_1831716d_fk_produtos_id_produto` (`id_produto_pai`),
  CONSTRAINT `produtos_id_grupo_fae13939_fk_grupos_produto_id_grupo` FOREIGN KEY (`id_grupo`) REFERENCES `grupos_produto` (`id_grupo`),
  CONSTRAINT `produtos_id_produto_pai_1831716d_fk_produtos_id_produto` FOREIGN KEY (`id_produto_pai`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos`
--

LOCK TABLES `produtos` WRITE;
/*!40000 ALTER TABLE `produtos` DISABLE KEYS */;
/*!40000 ALTER TABLE `produtos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produtos_complementares`
--

DROP TABLE IF EXISTS `produtos_complementares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos_complementares` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ordem` int NOT NULL,
  `id_produto` int NOT NULL,
  `id_produto_complementar` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `produtos_complementares_id_produto_id_produto_co_d8784c6e_uniq` (`id_produto`,`id_produto_complementar`),
  KEY `produtos_complementa_id_produto_complemen_b71872e6_fk_produtos_` (`id_produto_complementar`),
  CONSTRAINT `produtos_complementa_id_produto_b6d059ac_fk_produtos_` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`),
  CONSTRAINT `produtos_complementa_id_produto_complemen_b71872e6_fk_produtos_` FOREIGN KEY (`id_produto_complementar`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos_complementares`
--

LOCK TABLES `produtos_complementares` WRITE;
/*!40000 ALTER TABLE `produtos_complementares` DISABLE KEYS */;
/*!40000 ALTER TABLE `produtos_complementares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produtos_similares`
--

DROP TABLE IF EXISTS `produtos_similares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos_similares` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ordem` int NOT NULL,
  `id_produto` int NOT NULL,
  `id_produto_similar` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `produtos_similares_id_produto_id_produto_similar_5c4a66b1_uniq` (`id_produto`,`id_produto_similar`),
  KEY `produtos_similares_id_produto_similar_ffbee5f8_fk_produtos_` (`id_produto_similar`),
  CONSTRAINT `produtos_similares_id_produto_cea86456_fk_produtos_id_produto` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`),
  CONSTRAINT `produtos_similares_id_produto_similar_ffbee5f8_fk_produtos_` FOREIGN KEY (`id_produto_similar`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos_similares`
--

LOCK TABLES `produtos_similares` WRITE;
/*!40000 ALTER TABLE `produtos_similares` DISABLE KEYS */;
/*!40000 ALTER TABLE `produtos_similares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produtos_variacoes`
--

DROP TABLE IF EXISTS `produtos_variacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos_variacoes` (
  `id_variacao` int NOT NULL AUTO_INCREMENT,
  `codigo_barras` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia_variacao` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preco_venda` decimal(12,2) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL,
  `imagem_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `id_produto_id` int NOT NULL,
  PRIMARY KEY (`id_variacao`),
  KEY `produtos_variacoes_id_produto_id_976e0e1e_fk_produtos_id_produto` (`id_produto_id`),
  CONSTRAINT `produtos_variacoes_id_produto_id_976e0e1e_fk_produtos_id_produto` FOREIGN KEY (`id_produto_id`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos_variacoes`
--

LOCK TABLES `produtos_variacoes` WRITE;
/*!40000 ALTER TABLE `produtos_variacoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `produtos_variacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produtos_variacoes_combinacao`
--

DROP TABLE IF EXISTS `produtos_variacoes_combinacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos_variacoes_combinacao` (
  `id_combinacao` int NOT NULL AUTO_INCREMENT,
  `id_variacao_id` int NOT NULL,
  `id_valor_id` int NOT NULL,
  PRIMARY KEY (`id_combinacao`),
  KEY `produtos_variacoes_c_id_variacao_id_ee7854ab_fk_produtos_` (`id_variacao_id`),
  KEY `produtos_variacoes_c_id_valor_id_dd9b44e7_fk_valores_a` (`id_valor_id`),
  CONSTRAINT `produtos_variacoes_c_id_valor_id_dd9b44e7_fk_valores_a` FOREIGN KEY (`id_valor_id`) REFERENCES `valores_atributo_variacao` (`id_valor`),
  CONSTRAINT `produtos_variacoes_c_id_variacao_id_ee7854ab_fk_produtos_` FOREIGN KEY (`id_variacao_id`) REFERENCES `produtos_variacoes` (`id_variacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos_variacoes_combinacao`
--

LOCK TABLES `produtos_variacoes_combinacao` WRITE;
/*!40000 ALTER TABLE `produtos_variacoes_combinacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `produtos_variacoes_combinacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promocao_produtos`
--

DROP TABLE IF EXISTS `promocao_produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promocao_produtos` (
  `id_promocao_produto` int NOT NULL AUTO_INCREMENT,
  `valor_minimo_venda` decimal(12,2) DEFAULT NULL,
  `quantidade_minima` decimal(12,3) DEFAULT NULL,
  `valor_desconto_produto` decimal(12,2) DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `id_produto` int NOT NULL,
  `id_promocao` int NOT NULL,
  PRIMARY KEY (`id_promocao_produto`),
  UNIQUE KEY `promocao_produtos_id_promocao_id_produto_d48017cd_uniq` (`id_promocao`,`id_produto`),
  KEY `promocao_produtos_id_produto_f9bec01e_fk_produtos_id_produto` (`id_produto`),
  CONSTRAINT `promocao_produtos_id_produto_f9bec01e_fk_produtos_id_produto` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`),
  CONSTRAINT `promocao_produtos_id_promocao_ede9f7ea_fk_promocoes_id_promocao` FOREIGN KEY (`id_promocao`) REFERENCES `promocoes` (`id_promocao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promocao_produtos`
--

LOCK TABLES `promocao_produtos` WRITE;
/*!40000 ALTER TABLE `promocao_produtos` DISABLE KEYS */;
/*!40000 ALTER TABLE `promocao_produtos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promocoes`
--

DROP TABLE IF EXISTS `promocoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promocoes` (
  `id_promocao` int NOT NULL AUTO_INCREMENT,
  `nome_promocao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_inicio` datetime(6) NOT NULL,
  `data_fim` datetime(6) NOT NULL,
  `tipo_desconto` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_desconto` decimal(12,2) NOT NULL,
  `tipo_criterio` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `criado_por` int DEFAULT NULL,
  PRIMARY KEY (`id_promocao`),
  KEY `promocoes_criado_por_705eb4c3_fk_auth_user_id` (`criado_por`),
  CONSTRAINT `promocoes_criado_por_705eb4c3_fk_auth_user_id` FOREIGN KEY (`criado_por`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promocoes`
--

LOCK TABLES `promocoes` WRITE;
/*!40000 ALTER TABLE `promocoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `promocoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recorrencia_contrato`
--

DROP TABLE IF EXISTS `recorrencia_contrato`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recorrencia_contrato` (
  `id_contrato` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `valor_mensal` decimal(12,2) NOT NULL,
  `dia_vencimento` smallint unsigned NOT NULL,
  `status` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date DEFAULT NULL,
  `periodicidade` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `indice_reajuste` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `percentual_reajuste_fixo` decimal(5,2) NOT NULL,
  `mes_aniversario` smallint unsigned DEFAULT NULL,
  `ultimo_reajuste` date DEFAULT NULL,
  `gerar_nfe` tinyint(1) NOT NULL,
  `gerar_nfse` tinyint(1) NOT NULL,
  `gerar_boleto` tinyint(1) NOT NULL,
  `gerar_pix` tinyint(1) NOT NULL,
  `ultimo_faturamento` date DEFAULT NULL,
  `proximo_faturamento` date DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `cliente_id` int NOT NULL,
  `criado_por_id` int DEFAULT NULL,
  `responsavel_id` int DEFAULT NULL,
  `operacao_id` int DEFAULT NULL,
  PRIMARY KEY (`id_contrato`),
  UNIQUE KEY `numero` (`numero`),
  KEY `recorrencia_contrato_cliente_id_7e21e858_fk_clientes_id_cliente` (`cliente_id`),
  KEY `recorrencia_contrato_criado_por_id_47f16636_fk_auth_user_id` (`criado_por_id`),
  KEY `recorrencia_contrato_responsavel_id_1f528ffd_fk_auth_user_id` (`responsavel_id`),
  KEY `recorrencia_contrato_operacao_id_9e3db72b_fk_operacoes` (`operacao_id`),
  CONSTRAINT `recorrencia_contrato_cliente_id_7e21e858_fk_clientes_id_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `recorrencia_contrato_criado_por_id_47f16636_fk_auth_user_id` FOREIGN KEY (`criado_por_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `recorrencia_contrato_operacao_id_9e3db72b_fk_operacoes` FOREIGN KEY (`operacao_id`) REFERENCES `operacoes` (`id_operacao`),
  CONSTRAINT `recorrencia_contrato_responsavel_id_1f528ffd_fk_auth_user_id` FOREIGN KEY (`responsavel_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `recorrencia_contrato_chk_1` CHECK ((`dia_vencimento` >= 0)),
  CONSTRAINT `recorrencia_contrato_chk_2` CHECK ((`mes_aniversario` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recorrencia_contrato`
--

LOCK TABLES `recorrencia_contrato` WRITE;
/*!40000 ALTER TABLE `recorrencia_contrato` DISABLE KEYS */;
/*!40000 ALTER TABLE `recorrencia_contrato` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recorrencia_parcela`
--

DROP TABLE IF EXISTS `recorrencia_parcela`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recorrencia_parcela` (
  `id_parcela` int NOT NULL AUTO_INCREMENT,
  `competencia` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` decimal(12,2) NOT NULL,
  `data_vencimento` date NOT NULL,
  `status` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_pagamento` date DEFAULT NULL,
  `valor_pago` decimal(12,2) DEFAULT NULL,
  `id_financeiro_conta` int DEFAULT NULL,
  `id_venda` int DEFAULT NULL,
  `id_cobranca_pix` int DEFAULT NULL,
  `numero_boleto` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `contrato_id` int NOT NULL,
  PRIMARY KEY (`id_parcela`),
  UNIQUE KEY `recorrencia_parcela_contrato_id_competencia_49d873b3_uniq` (`contrato_id`,`competencia`),
  CONSTRAINT `recorrencia_parcela_contrato_id_f43d69d7_fk_recorrenc` FOREIGN KEY (`contrato_id`) REFERENCES `recorrencia_contrato` (`id_contrato`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recorrencia_parcela`
--

LOCK TABLES `recorrencia_parcela` WRITE;
/*!40000 ALTER TABLE `recorrencia_parcela` DISABLE KEYS */;
/*!40000 ALTER TABLE `recorrencia_parcela` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regras_fiscais`
--

DROP TABLE IF EXISTS `regras_fiscais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regras_fiscais` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `regime_tributario` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ncm_codigo` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cest_codigo` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_operacao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uf_destino` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uf_origem` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_cliente` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cfop` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `c_benef` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `c_class_trib` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icms_cst_csosn` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icms_modalidade_bc` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icms_aliq` decimal(7,4) NOT NULL,
  `icms_reducao_bc_perc` decimal(7,4) NOT NULL,
  `icms_desonerado` decimal(10,2) NOT NULL,
  `icmsst_aliq` decimal(7,4) NOT NULL,
  `icmsst_mva_perc` decimal(7,4) NOT NULL,
  `icmsst_reducao_bc_perc` decimal(7,4) NOT NULL,
  `fcp_aliq` decimal(7,4) NOT NULL,
  `pis_cst` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pis_aliq` decimal(7,4) NOT NULL,
  `cofins_cst` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cofins_aliq` decimal(7,4) NOT NULL,
  `ipi_cst` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ipi_aliq` decimal(7,4) NOT NULL,
  `ipi_classe_enquadramento` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ibs_cst` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ibs_aliq` decimal(7,4) NOT NULL,
  `cbs_cst` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cbs_aliq` decimal(7,4) NOT NULL,
  `is_aliq` decimal(7,4) NOT NULL,
  `diferimento_icms_perc` decimal(7,4) NOT NULL,
  `funrural_aliq` decimal(7,4) NOT NULL,
  `senar_aliq` decimal(5,4) NOT NULL,
  `split_payment` tinyint(1) NOT NULL,
  `tipo_produto_reform` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `empresa_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `regras_fiscais_empresa_id_ncm_codigo_ti_d0a729f5_uniq` (`empresa_id`,`ncm_codigo`,`tipo_operacao`,`uf_destino`,`uf_origem`,`tipo_cliente`),
  KEY `regras_fisc_empresa_6ea746_idx` (`empresa_id`,`ncm_codigo`,`tipo_operacao`),
  KEY `regras_fisc_tipo_pr_981237_idx` (`tipo_produto_reform`),
  CONSTRAINT `regras_fiscais_empresa_id_1b78a191_fk_empresa_config_id_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresa_config` (`id_empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regras_fiscais`
--

LOCK TABLES `regras_fiscais` WRITE;
/*!40000 ALTER TABLE `regras_fiscais` DISABLE KEYS */;
/*!40000 ALTER TABLE `regras_fiscais` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regras_fiscais_reforma`
--

DROP TABLE IF EXISTS `regras_fiscais_reforma`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regras_fiscais_reforma` (
  `id_regra` int NOT NULL AUTO_INCREMENT,
  `descricao` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `ncm_prefixo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uf_destino` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_operacao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cst_ibs_cbs` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `aliquota_ibs` decimal(5,2) NOT NULL,
  `aliquota_cbs` decimal(5,2) NOT NULL,
  `aliquota_is` decimal(5,2) NOT NULL,
  `is_split_elegivel` tinyint(1) NOT NULL,
  `aliquota_ibs_estadual` decimal(5,2) NOT NULL,
  `aliquota_ibs_municipal` decimal(5,2) NOT NULL,
  `credito_presumido_perc` decimal(5,2) NOT NULL,
  `reducao_bc_perc` decimal(5,2) NOT NULL,
  `vigencia_fim` date DEFAULT NULL,
  `vigencia_inicio` date DEFAULT NULL,
  PRIMARY KEY (`id_regra`),
  KEY `regras_fiscais_reforma_ncm_prefixo_9becd165` (`ncm_prefixo`),
  KEY `regras_fisc_ncm_pre_f004b6_idx` (`ncm_prefixo`,`uf_destino`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regras_fiscais_reforma`
--

LOCK TABLES `regras_fiscais_reforma` WRITE;
/*!40000 ALTER TABLE `regras_fiscais_reforma` DISABLE KEYS */;
/*!40000 ALTER TABLE `regras_fiscais_reforma` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regras_fiscais_reforma_2026`
--

DROP TABLE IF EXISTS `regras_fiscais_reforma_2026`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regras_fiscais_reforma_2026` (
  `id_regra` int NOT NULL AUTO_INCREMENT,
  `ncm` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `aliquota_ibs_uf` decimal(5,2) NOT NULL,
  `aliquota_ibs_mun` decimal(5,2) NOT NULL,
  `aliquota_cbs` decimal(5,2) NOT NULL,
  `is_split_active` tinyint(1) NOT NULL,
  `agente_retentor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `aliquota_reduzida` tinyint(1) NOT NULL,
  `percentual_reducao` decimal(5,2) NOT NULL,
  `descricao_beneficio` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `vigencia_inicio` date NOT NULL,
  `vigencia_fim` date DEFAULT NULL,
  `uf_aplicacao` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `produto_id` int NOT NULL,
  `usuario_cadastro_id` int DEFAULT NULL,
  PRIMARY KEY (`id_regra`),
  KEY `regras_fiscais_refor_usuario_cadastro_id_6f508a6d_fk_auth_user` (`usuario_cadastro_id`),
  KEY `regras_fisc_ncm_d7881e_idx` (`ncm`,`vigencia_inicio`),
  KEY `regras_fisc_produto_0623bd_idx` (`produto_id`,`uf_aplicacao`),
  CONSTRAINT `regras_fiscais_refor_produto_id_8612c00a_fk_produtos_` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id_produto`),
  CONSTRAINT `regras_fiscais_refor_usuario_cadastro_id_6f508a6d_fk_auth_user` FOREIGN KEY (`usuario_cadastro_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regras_fiscais_reforma_2026`
--

LOCK TABLES `regras_fiscais_reforma_2026` WRITE;
/*!40000 ALTER TABLE `regras_fiscais_reforma_2026` DISABLE KEYS */;
/*!40000 ALTER TABLE `regras_fiscais_reforma_2026` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rh_categoria_epi`
--

DROP TABLE IF EXISTS `rh_categoria_epi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rh_categoria_epi` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rh_categoria_epi`
--

LOCK TABLES `rh_categoria_epi` WRITE;
/*!40000 ALTER TABLE `rh_categoria_epi` DISABLE KEYS */;
/*!40000 ALTER TABLE `rh_categoria_epi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rh_entrega_epi`
--

DROP TABLE IF EXISTS `rh_entrega_epi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rh_entrega_epi` (
  `id_entrega` int NOT NULL AUTO_INCREMENT,
  `quantidade` smallint unsigned NOT NULL,
  `data_entrega` date NOT NULL,
  `data_vencimento` date DEFAULT NULL,
  `data_devolucao` date DEFAULT NULL,
  `assinado` tinyint(1) NOT NULL,
  `observacao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `entregue_por_id` int DEFAULT NULL,
  `epi_id` int NOT NULL,
  `funcionario_id` int NOT NULL,
  PRIMARY KEY (`id_entrega`),
  KEY `rh_entrega_epi_entregue_por_id_386e9bff_fk_auth_user_id` (`entregue_por_id`),
  KEY `rh_entrega_epi_epi_id_b492338c_fk_rh_epi_id_epi` (`epi_id`),
  KEY `rh_entrega_epi_funcionario_id_fdf9139b_fk_rh_funcio` (`funcionario_id`),
  CONSTRAINT `rh_entrega_epi_entregue_por_id_386e9bff_fk_auth_user_id` FOREIGN KEY (`entregue_por_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `rh_entrega_epi_epi_id_b492338c_fk_rh_epi_id_epi` FOREIGN KEY (`epi_id`) REFERENCES `rh_epi` (`id_epi`),
  CONSTRAINT `rh_entrega_epi_funcionario_id_fdf9139b_fk_rh_funcio` FOREIGN KEY (`funcionario_id`) REFERENCES `rh_funcionario` (`id_funcionario`),
  CONSTRAINT `rh_entrega_epi_chk_1` CHECK ((`quantidade` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rh_entrega_epi`
--

LOCK TABLES `rh_entrega_epi` WRITE;
/*!40000 ALTER TABLE `rh_entrega_epi` DISABLE KEYS */;
/*!40000 ALTER TABLE `rh_entrega_epi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rh_epi`
--

DROP TABLE IF EXISTS `rh_epi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rh_epi` (
  `id_epi` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ca` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `validade_dias` int unsigned NOT NULL,
  `estoque_atual` int unsigned NOT NULL,
  `estoque_minimo` int unsigned NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `categoria_id` int DEFAULT NULL,
  PRIMARY KEY (`id_epi`),
  KEY `rh_epi_categoria_id_dd193c52_fk_rh_categoria_epi_id_categoria` (`categoria_id`),
  CONSTRAINT `rh_epi_categoria_id_dd193c52_fk_rh_categoria_epi_id_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `rh_categoria_epi` (`id_categoria`),
  CONSTRAINT `rh_epi_chk_1` CHECK ((`validade_dias` >= 0)),
  CONSTRAINT `rh_epi_chk_2` CHECK ((`estoque_atual` >= 0)),
  CONSTRAINT `rh_epi_chk_3` CHECK ((`estoque_minimo` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rh_epi`
--

LOCK TABLES `rh_epi` WRITE;
/*!40000 ALTER TABLE `rh_epi` DISABLE KEYS */;
/*!40000 ALTER TABLE `rh_epi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rh_funcionario`
--

DROP TABLE IF EXISTS `rh_funcionario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rh_funcionario` (
  `id_funcionario` int NOT NULL AUTO_INCREMENT,
  `nome_completo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `matricula` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cpf` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rg` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `genero` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_civil` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cep` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endereco` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bairro` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cargo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `departamento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_contrato` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_admissao` date NOT NULL,
  `data_demissao` date DEFAULT NULL,
  `salario_base` decimal(10,2) NOT NULL,
  `carga_horaria_semanal` smallint unsigned NOT NULL,
  `banco` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agencia` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conta` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_conta` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chave_pix` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pis_pasep` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctps` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `titulo_eleitor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL,
  `foto_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `usuario_sistema_id` int DEFAULT NULL,
  PRIMARY KEY (`id_funcionario`),
  UNIQUE KEY `cpf` (`cpf`),
  UNIQUE KEY `matricula` (`matricula`),
  UNIQUE KEY `usuario_sistema_id` (`usuario_sistema_id`),
  CONSTRAINT `rh_funcionario_usuario_sistema_id_606ef7df_fk_auth_user_id` FOREIGN KEY (`usuario_sistema_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `rh_funcionario_chk_1` CHECK ((`carga_horaria_semanal` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rh_funcionario`
--

LOCK TABLES `rh_funcionario` WRITE;
/*!40000 ALTER TABLE `rh_funcionario` DISABLE KEYS */;
/*!40000 ALTER TABLE `rh_funcionario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rh_holerite`
--

DROP TABLE IF EXISTS `rh_holerite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rh_holerite` (
  `id_holerite` int NOT NULL AUTO_INCREMENT,
  `competencia` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mes` smallint unsigned NOT NULL,
  `ano` smallint unsigned NOT NULL,
  `status` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `salario_base` decimal(10,2) NOT NULL,
  `horas_extras` decimal(10,2) NOT NULL,
  `adicional_noturno` decimal(10,2) NOT NULL,
  `comissao` decimal(10,2) NOT NULL,
  `outros_proventos` decimal(10,2) NOT NULL,
  `total_proventos` decimal(10,2) NOT NULL,
  `inss` decimal(10,2) NOT NULL,
  `irrf` decimal(10,2) NOT NULL,
  `fgts` decimal(10,2) NOT NULL,
  `vale_transporte` decimal(10,2) NOT NULL,
  `vale_refeicao` decimal(10,2) NOT NULL,
  `plano_saude` decimal(10,2) NOT NULL,
  `outros_descontos` decimal(10,2) NOT NULL,
  `total_descontos` decimal(10,2) NOT NULL,
  `salario_liquido` decimal(10,2) NOT NULL,
  `dias_trabalhados` smallint unsigned NOT NULL,
  `horas_trabalhadas` decimal(6,2) NOT NULL,
  `horas_extras_valor` decimal(10,2) NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_pagamento` date DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `aprovado_por_id` int DEFAULT NULL,
  `funcionario_id` int NOT NULL,
  PRIMARY KEY (`id_holerite`),
  UNIQUE KEY `rh_holerite_funcionario_id_mes_ano_8c3ede45_uniq` (`funcionario_id`,`mes`,`ano`),
  KEY `rh_holerite_aprovado_por_id_80ada91a_fk_auth_user_id` (`aprovado_por_id`),
  CONSTRAINT `rh_holerite_aprovado_por_id_80ada91a_fk_auth_user_id` FOREIGN KEY (`aprovado_por_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `rh_holerite_funcionario_id_dfa3a518_fk_rh_funcio` FOREIGN KEY (`funcionario_id`) REFERENCES `rh_funcionario` (`id_funcionario`),
  CONSTRAINT `rh_holerite_chk_1` CHECK ((`mes` >= 0)),
  CONSTRAINT `rh_holerite_chk_2` CHECK ((`ano` >= 0)),
  CONSTRAINT `rh_holerite_chk_3` CHECK ((`dias_trabalhados` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rh_holerite`
--

LOCK TABLES `rh_holerite` WRITE;
/*!40000 ALTER TABLE `rh_holerite` DISABLE KEYS */;
/*!40000 ALTER TABLE `rh_holerite` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rh_ocorrencia_funcionario`
--

DROP TABLE IF EXISTS `rh_ocorrencia_funcionario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rh_ocorrencia_funcionario` (
  `id_ocorrencia` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  `dias` smallint unsigned NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `desconta_salario` tinyint(1) NOT NULL,
  `status` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `arquivo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `funcionario_id` int NOT NULL,
  `registrado_por_id` int DEFAULT NULL,
  PRIMARY KEY (`id_ocorrencia`),
  KEY `rh_ocorrencia_funcio_registrado_por_id_e40791f9_fk_auth_user` (`registrado_por_id`),
  KEY `rh_ocorrenc_funcion_9d9af3_idx` (`funcionario_id`,`data_inicio`),
  CONSTRAINT `rh_ocorrencia_funcio_funcionario_id_b13cad48_fk_rh_funcio` FOREIGN KEY (`funcionario_id`) REFERENCES `rh_funcionario` (`id_funcionario`),
  CONSTRAINT `rh_ocorrencia_funcio_registrado_por_id_e40791f9_fk_auth_user` FOREIGN KEY (`registrado_por_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `rh_ocorrencia_funcionario_chk_1` CHECK ((`dias` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rh_ocorrencia_funcionario`
--

LOCK TABLES `rh_ocorrencia_funcionario` WRITE;
/*!40000 ALTER TABLE `rh_ocorrencia_funcionario` DISABLE KEYS */;
/*!40000 ALTER TABLE `rh_ocorrencia_funcionario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rh_registro_ponto`
--

DROP TABLE IF EXISTS `rh_registro_ponto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rh_registro_ponto` (
  `id_ponto` int NOT NULL AUTO_INCREMENT,
  `data_hora` datetime(6) NOT NULL,
  `tipo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `observacao` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `funcionario_id` int NOT NULL,
  `registrado_por_id` int DEFAULT NULL,
  PRIMARY KEY (`id_ponto`),
  KEY `rh_registro_ponto_registrado_por_id_b021047a_fk_auth_user_id` (`registrado_por_id`),
  KEY `rh_registro_funcion_9c9aa9_idx` (`funcionario_id`,`data_hora`),
  CONSTRAINT `rh_registro_ponto_funcionario_id_ab43ada0_fk_rh_funcio` FOREIGN KEY (`funcionario_id`) REFERENCES `rh_funcionario` (`id_funcionario`),
  CONSTRAINT `rh_registro_ponto_registrado_por_id_b021047a_fk_auth_user_id` FOREIGN KEY (`registrado_por_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rh_registro_ponto`
--

LOCK TABLES `rh_registro_ponto` WRITE;
/*!40000 ALTER TABLE `rh_registro_ponto` DISABLE KEYS */;
/*!40000 ALTER TABLE `rh_registro_ponto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saas_cliente`
--

DROP TABLE IF EXISTS `saas_cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_cliente` (
  `id_saas_cliente` int NOT NULL AUTO_INCREMENT,
  `cnpj` varchar(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `razao_social` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dia_vencimento` int NOT NULL,
  `valor_mensalidade` decimal(10,2) NOT NULL,
  `emite_nota` tinyint(1) NOT NULL,
  `status_licenca` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_reajuste` date DEFAULT NULL,
  `data_cadastro` datetime(6) NOT NULL,
  `schema_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'central',
  `db_host` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'localhost',
  `db_port` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '8005',
  `is_test_environment` tinyint(1) NOT NULL DEFAULT '0',
  `bairro` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cep` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complemento` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endereco` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inscricao_estadual` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nome_fantasia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proprietario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendedor` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `banco_criado` tinyint(1) NOT NULL,
  `contrato_pendente` tinyint(1) NOT NULL,
  `data_nascimento_responsavel` date DEFAULT NULL,
  `email_responsavel` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plano_id` bigint DEFAULT NULL,
  `upgrade_solicitado_id` bigint DEFAULT NULL,
  `limite_maquinas` int NOT NULL,
  `link_acesso` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_saas_cliente`),
  UNIQUE KEY `cnpj` (`cnpj`),
  UNIQUE KEY `schema_name` (`schema_name`),
  UNIQUE KEY `schema_name_2` (`schema_name`),
  UNIQUE KEY `schema_name_3` (`schema_name`),
  UNIQUE KEY `schema_name_4` (`schema_name`),
  KEY `saas_cliente_plano_id_b7d279d2_fk_saas_plano_id` (`plano_id`),
  KEY `saas_cliente_upgrade_solicitado_id_79c86176_fk_saas_plano_id` (`upgrade_solicitado_id`),
  CONSTRAINT `saas_cliente_plano_id_b7d279d2_fk_saas_plano_id` FOREIGN KEY (`plano_id`) REFERENCES `saas_plano` (`id`),
  CONSTRAINT `saas_cliente_upgrade_solicitado_id_79c86176_fk_saas_plano_id` FOREIGN KEY (`upgrade_solicitado_id`) REFERENCES `saas_plano` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_cliente`
--

LOCK TABLES `saas_cliente` WRITE;
/*!40000 ALTER TABLE `saas_cliente` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saas_cliente_contrato`
--

DROP TABLE IF EXISTS `saas_cliente_contrato`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_cliente_contrato` (
  `id_contrato` int NOT NULL AUTO_INCREMENT,
  `texto_contrato` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_geracao` datetime(6) NOT NULL,
  `assinado` tinyint(1) NOT NULL,
  `data_assinatura` datetime(6) DEFAULT NULL,
  `ip_assinatura` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuario_assinou` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `saas_cliente_id` int NOT NULL,
  `assinado_em` datetime(6) DEFAULT NULL,
  `token_expira_em` datetime(6) DEFAULT NULL,
  `token_validacao` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_contrato`),
  KEY `saas_cliente_contrat_saas_cliente_id_ff380a38_fk_saas_clie` (`saas_cliente_id`),
  CONSTRAINT `saas_cliente_contrat_saas_cliente_id_ff380a38_fk_saas_clie` FOREIGN KEY (`saas_cliente_id`) REFERENCES `saas_cliente` (`id_saas_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_cliente_contrato`
--

LOCK TABLES `saas_cliente_contrato` WRITE;
/*!40000 ALTER TABLE `saas_cliente_contrato` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_cliente_contrato` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saas_cliente_mensalidade`
--

DROP TABLE IF EXISTS `saas_cliente_mensalidade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_cliente_mensalidade` (
  `id_mensalidade` int NOT NULL AUTO_INCREMENT,
  `nosso_numero` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_emissao` date NOT NULL,
  `data_vencimento` date NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `status_pagamento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_boleto` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linha_digitavel` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pix_copia_cola` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_pagamento` date DEFAULT NULL,
  `saas_cliente_id` int NOT NULL,
  `id_config_bancaria` int DEFAULT NULL,
  PRIMARY KEY (`id_mensalidade`),
  KEY `saas_cliente_mensali_saas_cliente_id_f12366de_fk_saas_clie` (`saas_cliente_id`),
  KEY `saas_cliente_mensali_id_config_bancaria_ad91b885_fk_configura` (`id_config_bancaria`),
  CONSTRAINT `saas_cliente_mensali_id_config_bancaria_ad91b885_fk_configura` FOREIGN KEY (`id_config_bancaria`) REFERENCES `configuracoes_bancarias` (`id_config`),
  CONSTRAINT `saas_cliente_mensali_saas_cliente_id_f12366de_fk_saas_clie` FOREIGN KEY (`saas_cliente_id`) REFERENCES `saas_cliente` (`id_saas_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_cliente_mensalidade`
--

LOCK TABLES `saas_cliente_mensalidade` WRITE;
/*!40000 ALTER TABLE `saas_cliente_mensalidade` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_cliente_mensalidade` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saas_comunicado`
--

DROP TABLE IF EXISTS `saas_comunicado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_comunicado` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `conteudo_texto` longtext COLLATE utf8mb4_unicode_ci,
  `url_midia` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `imagem` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_comunicado`
--

LOCK TABLES `saas_comunicado` WRITE;
/*!40000 ALTER TABLE `saas_comunicado` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_comunicado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saas_configuracao_agendamento`
--

DROP TABLE IF EXISTS `saas_configuracao_agendamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_configuracao_agendamento` (
  `id_config` int NOT NULL AUTO_INCREMENT,
  `horario_execucao` time(6) NOT NULL,
  `dias_da_semana` varchar(50) NOT NULL,
  `agendamento_ativo` tinyint(1) NOT NULL,
  PRIMARY KEY (`id_config`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_configuracao_agendamento`
--

LOCK TABLES `saas_configuracao_agendamento` WRITE;
/*!40000 ALTER TABLE `saas_configuracao_agendamento` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_configuracao_agendamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saas_contrato_padrao`
--

DROP TABLE IF EXISTS `saas_contrato_padrao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_contrato_padrao` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `versao` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `conteudo_html` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_contrato_padrao`
--

LOCK TABLES `saas_contrato_padrao` WRITE;
/*!40000 ALTER TABLE `saas_contrato_padrao` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_contrato_padrao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saas_gabarito_customizado`
--

DROP TABLE IF EXISTS `saas_gabarito_customizado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_gabarito_customizado` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome_relatorio` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_gabarito` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `layout_json` json NOT NULL,
  `largura_gabarito_mm` int NOT NULL,
  `altura_gabarito_mm` int NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `cliente_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `saas_gabarito_custom_cliente_id_a46cd644_fk_saas_clie` (`cliente_id`),
  CONSTRAINT `saas_gabarito_custom_cliente_id_a46cd644_fk_saas_clie` FOREIGN KEY (`cliente_id`) REFERENCES `saas_cliente` (`id_saas_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_gabarito_customizado`
--

LOCK TABLES `saas_gabarito_customizado` WRITE;
/*!40000 ALTER TABLE `saas_gabarito_customizado` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_gabarito_customizado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saas_historico_atualizacao`
--

DROP TABLE IF EXISTS `saas_historico_atualizacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_historico_atualizacao` (
  `id_historico` int NOT NULL AUTO_INCREMENT,
  `data_atualizacao` datetime(6) NOT NULL,
  `status` varchar(20) NOT NULL,
  `log_erro` longtext,
  `saas_cliente_id` int NOT NULL,
  `versao_id` int NOT NULL,
  PRIMARY KEY (`id_historico`),
  KEY `saas_historico_atual_saas_cliente_id_a76686d0_fk_saas_clie` (`saas_cliente_id`),
  KEY `saas_historico_atual_versao_id_0fd4a316_fk_saas_vers` (`versao_id`),
  CONSTRAINT `saas_historico_atual_saas_cliente_id_a76686d0_fk_saas_clie` FOREIGN KEY (`saas_cliente_id`) REFERENCES `saas_cliente` (`id_saas_cliente`),
  CONSTRAINT `saas_historico_atual_versao_id_0fd4a316_fk_saas_vers` FOREIGN KEY (`versao_id`) REFERENCES `saas_versao_sistema` (`id_versao`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_historico_atualizacao`
--

LOCK TABLES `saas_historico_atualizacao` WRITE;
/*!40000 ALTER TABLE `saas_historico_atualizacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_historico_atualizacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saas_link_cadastro_remoto`
--

DROP TABLE IF EXISTS `saas_link_cadastro_remoto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_link_cadastro_remoto` (
  `id_token` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `whatsapp_cliente` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usado` tinyint(1) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `expira_em` datetime(6) NOT NULL,
  `dia_vencimento` int NOT NULL,
  `valor_mensalidade` decimal(10,2) NOT NULL,
  `emite_nota` tinyint(1) NOT NULL,
  `vendedor` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_licenca` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `schema_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `db_host` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `db_port` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_test_environment` tinyint(1) NOT NULL,
  `plano_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id_token`),
  KEY `saas_link_cadastro_remoto_schema_name_23ff866d` (`schema_name`),
  KEY `saas_link_cadastro_remoto_plano_id_9d85318b_fk_saas_plano_id` (`plano_id`),
  CONSTRAINT `saas_link_cadastro_remoto_plano_id_9d85318b_fk_saas_plano_id` FOREIGN KEY (`plano_id`) REFERENCES `saas_plano` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_link_cadastro_remoto`
--

LOCK TABLES `saas_link_cadastro_remoto` WRITE;
/*!40000 ALTER TABLE `saas_link_cadastro_remoto` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_link_cadastro_remoto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saas_plano`
--

DROP TABLE IF EXISTS `saas_plano`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_plano` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_mensalidade` decimal(10,2) NOT NULL,
  `modulo_pdv` tinyint(1) NOT NULL,
  `modulo_financeiro_avancado` tinyint(1) NOT NULL,
  `modulo_producao_industria` tinyint(1) NOT NULL,
  `modulo_transporte_cte` tinyint(1) NOT NULL,
  `modulo_ciot_automatico` tinyint(1) NOT NULL,
  `modulo_report_builder` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_plano`
--

LOCK TABLES `saas_plano` WRITE;
/*!40000 ALTER TABLE `saas_plano` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_plano` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saas_terminal_ativo`
--

DROP TABLE IF EXISTS `saas_terminal_ativo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_terminal_ativo` (
  `id_terminal` int NOT NULL AUTO_INCREMENT,
  `hardware_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome_computador` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativado_em` datetime(6) NOT NULL,
  `ultimo_acesso` datetime(6) NOT NULL,
  `saas_cliente_id` int NOT NULL,
  PRIMARY KEY (`id_terminal`),
  UNIQUE KEY `hardware_id` (`hardware_id`),
  KEY `saas_terminal_ativo_saas_cliente_id_361d8357_fk_saas_clie` (`saas_cliente_id`),
  CONSTRAINT `saas_terminal_ativo_saas_cliente_id_361d8357_fk_saas_clie` FOREIGN KEY (`saas_cliente_id`) REFERENCES `saas_cliente` (`id_saas_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_terminal_ativo`
--

LOCK TABLES `saas_terminal_ativo` WRITE;
/*!40000 ALTER TABLE `saas_terminal_ativo` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_terminal_ativo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saas_versao_sistema`
--

DROP TABLE IF EXISTS `saas_versao_sistema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_versao_sistema` (
  `id_versao` int NOT NULL AUTO_INCREMENT,
  `versao` varchar(20) NOT NULL,
  `descricao` longtext,
  `data_lancamento` datetime(6) NOT NULL,
  PRIMARY KEY (`id_versao`),
  UNIQUE KEY `versao` (`versao`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_versao_sistema`
--

LOCK TABLES `saas_versao_sistema` WRITE;
/*!40000 ALTER TABLE `saas_versao_sistema` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_versao_sistema` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `safras`
--

DROP TABLE IF EXISTS `safras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `safras` (
  `id_safra` int NOT NULL AUTO_INCREMENT,
  `descricao` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  PRIMARY KEY (`id_safra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safras`
--

LOCK TABLES `safras` WRITE;
/*!40000 ALTER TABLE `safras` DISABLE KEYS */;
/*!40000 ALTER TABLE `safras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saldo_deposito`
--

DROP TABLE IF EXISTS `saldo_deposito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saldo_deposito` (
  `id_saldo` int NOT NULL AUTO_INCREMENT,
  `id_deposito` int NOT NULL,
  `id_produto` int NOT NULL,
  `quantidade` decimal(14,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id_saldo`),
  UNIQUE KEY `uniq_dep_prod` (`id_deposito`,`id_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saldo_deposito`
--

LOCK TABLES `saldo_deposito` WRITE;
/*!40000 ALTER TABLE `saldo_deposito` DISABLE KEYS */;
/*!40000 ALTER TABLE `saldo_deposito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitacoes`
--

DROP TABLE IF EXISTS `solicitacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitacoes` (
  `id_solicitacao` int NOT NULL AUTO_INCREMENT,
  `id_usuario_solicitante` int NOT NULL COMMENT 'FK para auth_user.id',
  `id_usuario_supervisor` int NOT NULL COMMENT 'FK para auth_user.id (o admin que vai aprovar)',
  `tipo_solicitacao` varchar(100) NOT NULL COMMENT 'Ex: EXCLUIR_CLIENTE, DAR_DESCONTO',
  `id_registro` int DEFAULT NULL COMMENT 'ID do cliente/produto/venda (opcional)',
  `dados_solicitacao` text COMMENT 'JSON com dados (ex: valor do desconto)',
  `observacao_solicitante` text COMMENT 'Justificativa do usu├írio',
  `observacao_supervisor` text COMMENT 'Resposta do supervisor',
  `status` enum('Pendente','Aprovada','Rejeitada') NOT NULL DEFAULT 'Pendente',
  `data_solicitacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_aprovacao` datetime DEFAULT NULL,
  PRIMARY KEY (`id_solicitacao`),
  KEY `fk_solicitacao_user_solicitante_idx` (`id_usuario_solicitante`),
  KEY `fk_solicitacao_user_supervisor_idx` (`id_usuario_supervisor`),
  CONSTRAINT `fk_solicitacao_user_solicitante` FOREIGN KEY (`id_usuario_solicitante`) REFERENCES `auth_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_solicitacao_user_supervisor` FOREIGN KEY (`id_usuario_supervisor`) REFERENCES `auth_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=251 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitacoes`
--

LOCK TABLES `solicitacoes` WRITE;
/*!40000 ALTER TABLE `solicitacoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `split_payment_config`
--

DROP TABLE IF EXISTS `split_payment_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `split_payment_config` (
  `id_config` int NOT NULL AUTO_INCREMENT,
  `adquirente` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_secret` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `split_automatico` tinyint(1) NOT NULL,
  `percentual_alerta` decimal(5,2) NOT NULL,
  `conta_ibs_uf` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conta_ibs_mun` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conta_cbs` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ambiente` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `empresa_id` int NOT NULL,
  `chave_pix_destino` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codigo_banco_tef` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `percentual_split` decimal(5,2) NOT NULL,
  `tipo_ente` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnpj_ente_destino` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `regra_fiscal_id` int NOT NULL,
  `meio_pagamento` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_config`),
  UNIQUE KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `split_payment_config_empresa_id_01bd5c69_fk_empresa_c` FOREIGN KEY (`empresa_id`) REFERENCES `empresa_config` (`id_empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `split_payment_config`
--

LOCK TABLES `split_payment_config` WRITE;
/*!40000 ALTER TABLE `split_payment_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `split_payment_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `status_ordem_servico`
--

DROP TABLE IF EXISTS `status_ordem_servico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `status_ordem_servico` (
  `id_status` int NOT NULL AUTO_INCREMENT,
  `nome_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'blue',
  `ordem` int DEFAULT '0',
  `ativo` tinyint(1) DEFAULT '1',
  `padrao` tinyint(1) DEFAULT '0',
  `gera_financeiro` tinyint(1) DEFAULT '0',
  `permite_editar` tinyint(1) DEFAULT '1',
  `permite_excluir` tinyint(1) DEFAULT '1',
  `data_criacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_status`),
  UNIQUE KEY `uk_nome_status` (`nome_status`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Status dispon├¡veis para Ordem de Servi├ºo';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `status_ordem_servico`
--

LOCK TABLES `status_ordem_servico` WRITE;
/*!40000 ALTER TABLE `status_ordem_servico` DISABLE KEYS */;
/*!40000 ALTER TABLE `status_ordem_servico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sugestao_cfop`
--

DROP TABLE IF EXISTS `sugestao_cfop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sugestao_cfop` (
  `id_sugestao_cfop` int NOT NULL AUTO_INCREMENT,
  `tipo_destino` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cfop_sugerido` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL,
  `id_operacao` int NOT NULL,
  PRIMARY KEY (`id_sugestao_cfop`),
  UNIQUE KEY `sugestao_cfop_id_operacao_tipo_destino_8159a8a9_uniq` (`id_operacao`,`tipo_destino`),
  CONSTRAINT `sugestao_cfop_id_operacao_180056e3_fk_operacoes_id_operacao` FOREIGN KEY (`id_operacao`) REFERENCES `operacoes` (`id_operacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sugestao_cfop`
--

LOCK TABLES `sugestao_cfop` WRITE;
/*!40000 ALTER TABLE `sugestao_cfop` DISABLE KEYS */;
/*!40000 ALTER TABLE `sugestao_cfop` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tabelas_comerciais`
--

DROP TABLE IF EXISTS `tabelas_comerciais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabelas_comerciais` (
  `id_tabela_comercial` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `percentual` decimal(5,2) NOT NULL DEFAULT '0.00',
  `ativo` tinyint(1) DEFAULT '1',
  `padrao` tinyint(1) DEFAULT '0',
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `perguntar_ao_vender` tinyint(1) DEFAULT '0' COMMENT 'Se marcado, pergunta ao adicionar produto e ao gerar financeiro na venda r├ípida',
  PRIMARY KEY (`id_tabela_comercial`),
  KEY `idx_ativo` (`ativo`),
  KEY `idx_padrao` (`padrao`),
  KEY `idx_nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tabelas_comerciais`
--

LOCK TABLES `tabelas_comerciais` WRITE;
/*!40000 ALTER TABLE `tabelas_comerciais` DISABLE KEYS */;
/*!40000 ALTER TABLE `tabelas_comerciais` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tecnicos`
--

DROP TABLE IF EXISTS `tecnicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tecnicos` (
  `id_tecnico` int NOT NULL AUTO_INCREMENT,
  `nome_tecnico` varchar(255) NOT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `percentual_comissao` decimal(5,2) DEFAULT '0.00',
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_tecnico`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tecnicos`
--

LOCK TABLES `tecnicos` WRITE;
/*!40000 ALTER TABLE `tecnicos` DISABLE KEYS */;
/*!40000 ALTER TABLE `tecnicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transferencias_mesa`
--

DROP TABLE IF EXISTS `transferencias_mesa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transferencias_mesa` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `data_transferencia` datetime(6) NOT NULL,
  `motivo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `comanda_id` bigint NOT NULL,
  `mesa_destino_id` bigint DEFAULT NULL,
  `mesa_origem_id` bigint DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transferencias_mesa_comanda_id_44a75af6_fk_comandas_id` (`comanda_id`),
  KEY `transferencias_mesa_mesa_destino_id_3991c9db_fk_mesas_id` (`mesa_destino_id`),
  KEY `transferencias_mesa_mesa_origem_id_367e6dd9_fk_mesas_id` (`mesa_origem_id`),
  KEY `transferencias_mesa_usuario_id_85ef1362_fk_auth_user_id` (`usuario_id`),
  CONSTRAINT `transferencias_mesa_comanda_id_44a75af6_fk_comandas_id` FOREIGN KEY (`comanda_id`) REFERENCES `comandas` (`id`),
  CONSTRAINT `transferencias_mesa_mesa_destino_id_3991c9db_fk_mesas_id` FOREIGN KEY (`mesa_destino_id`) REFERENCES `mesas` (`id`),
  CONSTRAINT `transferencias_mesa_mesa_origem_id_367e6dd9_fk_mesas_id` FOREIGN KEY (`mesa_origem_id`) REFERENCES `mesas` (`id`),
  CONSTRAINT `transferencias_mesa_usuario_id_85ef1362_fk_auth_user_id` FOREIGN KEY (`usuario_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transferencias_mesa`
--

LOCK TABLES `transferencias_mesa` WRITE;
/*!40000 ALTER TABLE `transferencias_mesa` DISABLE KEYS */;
/*!40000 ALTER TABLE `transferencias_mesa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tributacao_produto`
--

DROP TABLE IF EXISTS `tributacao_produto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tributacao_produto` (
  `id_tributacao` int NOT NULL AUTO_INCREMENT,
  `classificacao_fiscal` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cst_pis_cofins` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cst_icms` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cst_ipi` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `csosn` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cfop` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icms_aliquota` decimal(5,2) NOT NULL,
  `marketing_icms` decimal(5,2) NOT NULL,
  `pis_aliquota` decimal(5,2) NOT NULL,
  `cofins_aliquota` decimal(5,2) NOT NULL,
  `ipi_aliquota` decimal(5,2) NOT NULL,
  `cst_ipi_sn` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ipi_aliquota_sn` decimal(5,2) NOT NULL,
  `cst_pis_sn` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pis_aliquota_sn` decimal(5,2) NOT NULL,
  `cst_cofins_sn` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cofins_aliquota_sn` decimal(5,2) NOT NULL,
  `ibs_aliquota` decimal(5,2) NOT NULL,
  `cbs_aliquota` decimal(5,2) NOT NULL,
  `imposto_seletivo_aliquota` decimal(5,2) NOT NULL,
  `cst_ibs_cbs` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fonte_info` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `produto_id` int NOT NULL,
  PRIMARY KEY (`id_tributacao`),
  UNIQUE KEY `produto_id` (`produto_id`),
  CONSTRAINT `tributacao_produto_produto_id_79827c5b_fk_produtos_id_produto` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id_produto`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tributacao_produto`
--

LOCK TABLES `tributacao_produto` WRITE;
/*!40000 ALTER TABLE `tributacao_produto` DISABLE KEYS */;
/*!40000 ALTER TABLE `tributacao_produto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tributacao_tipos`
--

DROP TABLE IF EXISTS `tributacao_tipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tributacao_tipos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icms_cst_csosn` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icms_modalidade_bc` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cfop_padrao` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cfop_devolucao` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icmsst_modalidade_bc` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `antecipacao_tributaria` decimal(7,4) NOT NULL,
  `considera_sintegra` tinyint(1) NOT NULL,
  `observacao_nfe` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ativo` tinyint(1) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `empresa_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tributacao_tipos_empresa_id_nome_56854c5d_uniq` (`empresa_id`,`nome`),
  CONSTRAINT `tributacao_tipos_empresa_id_af2fd842_fk_empresa_c` FOREIGN KEY (`empresa_id`) REFERENCES `empresa_config` (`id_empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tributacao_tipos`
--

LOCK TABLES `tributacao_tipos` WRITE;
/*!40000 ALTER TABLE `tributacao_tipos` DISABLE KEYS */;
/*!40000 ALTER TABLE `tributacao_tipos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tributacao_uf`
--

DROP TABLE IF EXISTS `tributacao_uf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tributacao_uf` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `uf_destino` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cfop_saida` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icms_aliq` decimal(7,4) NOT NULL,
  `reducao_bc_perc` decimal(7,4) NOT NULL,
  `icmsst_aliq` decimal(7,4) NOT NULL,
  `icmsst_mva_perc` decimal(7,4) NOT NULL,
  `reducao_bc_st_perc` decimal(7,4) NOT NULL,
  `frete_perc` decimal(7,4) NOT NULL,
  `seguro_perc` decimal(7,4) NOT NULL,
  `outras_despesas_perc` decimal(7,4) NOT NULL,
  `fcp_aliq` decimal(7,4) NOT NULL,
  `tipo_tributacao_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tributacao_uf_tipo_tributacao_id_uf_destino_f655c170_uniq` (`tipo_tributacao_id`,`uf_destino`),
  CONSTRAINT `tributacao_uf_tipo_tributacao_id_ca7dfbf2_fk_tributacao_tipos_id` FOREIGN KEY (`tipo_tributacao_id`) REFERENCES `tributacao_tipos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tributacao_uf`
--

LOCK TABLES `tributacao_uf` WRITE;
/*!40000 ALTER TABLE `tributacao_uf` DISABLE KEYS */;
/*!40000 ALTER TABLE `tributacao_uf` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `troca_itens`
--

DROP TABLE IF EXISTS `troca_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `troca_itens` (
  `id_troca_item` int NOT NULL AUTO_INCREMENT,
  `id_venda_item_original` bigint DEFAULT NULL,
  `id_produto_retorno` bigint DEFAULT NULL,
  `quantidade_retorno` decimal(12,3) NOT NULL,
  `valor_unit_retorno` decimal(12,2) NOT NULL,
  `valor_total_retorno` decimal(12,2) NOT NULL,
  `id_produto_substituicao` bigint DEFAULT NULL,
  `quantidade_substituicao` decimal(12,3) NOT NULL,
  `valor_unit_substituicao` decimal(12,2) NOT NULL,
  `valor_total_substituicao` decimal(12,2) NOT NULL,
  `id_troca` int NOT NULL,
  PRIMARY KEY (`id_troca_item`),
  KEY `troca_itens_id_troca_4f4d0610_fk_trocas_id_troca` (`id_troca`),
  CONSTRAINT `troca_itens_id_troca_4f4d0610_fk_trocas_id_troca` FOREIGN KEY (`id_troca`) REFERENCES `trocas` (`id_troca`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `troca_itens`
--

LOCK TABLES `troca_itens` WRITE;
/*!40000 ALTER TABLE `troca_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `troca_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trocas`
--

DROP TABLE IF EXISTS `trocas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trocas` (
  `id_troca` int NOT NULL AUTO_INCREMENT,
  `id_venda_original` bigint NOT NULL,
  `id_cliente` bigint DEFAULT NULL,
  `data_troca` datetime(6) NOT NULL,
  `valor_total_retorno` decimal(12,2) NOT NULL,
  `valor_total_substituicao` decimal(12,2) NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `criado_por` bigint DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `id_financeiro` bigint DEFAULT NULL,
  PRIMARY KEY (`id_troca`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trocas`
--

LOCK TABLES `trocas` WRITE;
/*!40000 ALTER TABLE `trocas` DISABLE KEYS */;
/*!40000 ALTER TABLE `trocas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tts_audio_cache`
--

DROP TABLE IF EXISTS `tts_audio_cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tts_audio_cache` (
  `id_cache` int NOT NULL AUTO_INCREMENT,
  `text_hash` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `audio_file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `audio_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `voice` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `velocidade` decimal(3,2) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id_cache`),
  UNIQUE KEY `text_hash` (`text_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tts_audio_cache`
--

LOCK TABLES `tts_audio_cache` WRITE;
/*!40000 ALTER TABLE `tts_audio_cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `tts_audio_cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_atalhos`
--

DROP TABLE IF EXISTS `user_atalhos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_atalhos` (
  `id_atalho` int NOT NULL AUTO_INCREMENT,
  `tecla` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `caminho` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `id_user` int NOT NULL,
  PRIMARY KEY (`id_atalho`),
  UNIQUE KEY `user_atalhos_id_user_tecla_436f8a65_uniq` (`id_user`,`tecla`),
  CONSTRAINT `user_atalhos_id_user_633b6dae_fk_auth_user_id` FOREIGN KEY (`id_user`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_atalhos`
--

LOCK TABLES `user_atalhos` WRITE;
/*!40000 ALTER TABLE `user_atalhos` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_atalhos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_parametros`
--

DROP TABLE IF EXISTS `user_parametros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_parametros` (
  `id_parametro` int NOT NULL AUTO_INCREMENT,
  `id_user` int NOT NULL,
  `id_cliente_padrao` int DEFAULT NULL,
  `id_operacao_padrao` int DEFAULT NULL,
  `id_vendedor_padrao` int DEFAULT NULL,
  `id_grupo_padrao` int DEFAULT NULL,
  `id_tabela_comercial` int DEFAULT NULL COMMENT 'ID da tabela comercial padr├úo do usu├írio',
  `id_vendedor_venda` int DEFAULT NULL COMMENT 'Vendedor padr├úo para Vendas',
  `id_operacao_venda` int DEFAULT NULL COMMENT 'Opera├º├úo padr├úo para Vendas',
  `id_vendedor_os` int DEFAULT NULL COMMENT 'Vendedor padr├úo para Ordem de Servi├ºo',
  `id_operacao_os` int DEFAULT NULL COMMENT 'Opera├º├úo padr├úo para Ordem de Servi├ºo',
  `id_vendedor_nfce` int DEFAULT NULL,
  `id_cliente_nfce` int DEFAULT NULL,
  `id_operacao_nfce` int DEFAULT NULL,
  `controle_de_caixa` tinyint(1) DEFAULT '0',
  `mostrar_lucratividade` int DEFAULT '0',
  `habilitar_calc_revestimento` tinyint(1) DEFAULT '0' COMMENT 'Habilita calculadora de m┬▓ para revestimentos',
  `habilitar_calc_tinta` tinyint(1) DEFAULT '0' COMMENT 'Habilita calculadora de rendimento para tintas',
  `habilitar_controle_peso` tinyint(1) DEFAULT '0' COMMENT 'Habilita controle de peso total na venda',
  `habilitar_produto_variacao` tinyint(1) DEFAULT '0' COMMENT 'Habilita grade de varia├º├Áes de produtos',
  `margem_quebra_padrao` decimal(5,2) DEFAULT '10.00' COMMENT 'Margem padr├úo de quebra/desperd├¡cio em %',
  `whatsapp_supervisor` varchar(20) DEFAULT '',
  `id_operacao_hotel` int DEFAULT NULL,
  `perguntar_operacao_checkout` tinyint(1) DEFAULT NULL,
  `id_operacao_hotel_checkout` int DEFAULT NULL,
  `id_operacao_hotel_nfce` int DEFAULT NULL,
  PRIMARY KEY (`id_parametro`),
  UNIQUE KEY `id_user_UNIQUE` (`id_user`),
  KEY `fk_param_cliente_idx` (`id_cliente_padrao`),
  KEY `fk_param_operacao_idx` (`id_operacao_padrao`),
  KEY `fk_param_vendedor_idx` (`id_vendedor_padrao`),
  KEY `fk_param_grupo_idx` (`id_grupo_padrao`),
  KEY `fk_user_parametros_vendedor_venda` (`id_vendedor_venda`),
  KEY `fk_user_parametros_operacao_venda` (`id_operacao_venda`),
  KEY `fk_user_parametros_vendedor_os` (`id_vendedor_os`),
  KEY `fk_user_parametros_operacao_os` (`id_operacao_os`),
  KEY `fk_user_param_vendedor_nfce` (`id_vendedor_nfce`),
  KEY `fk_user_param_cliente_nfce` (`id_cliente_nfce`),
  KEY `fk_user_param_operacao_nfce` (`id_operacao_nfce`),
  CONSTRAINT `fk_param_cliente` FOREIGN KEY (`id_cliente_padrao`) REFERENCES `clientes` (`id_cliente`) ON DELETE SET NULL,
  CONSTRAINT `fk_param_grupo` FOREIGN KEY (`id_grupo_padrao`) REFERENCES `grupos_produto` (`id_grupo`) ON DELETE SET NULL,
  CONSTRAINT `fk_param_operacao` FOREIGN KEY (`id_operacao_padrao`) REFERENCES `operacoes` (`id_operacao`) ON DELETE SET NULL,
  CONSTRAINT `fk_param_user` FOREIGN KEY (`id_user`) REFERENCES `auth_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_param_vendedor` FOREIGN KEY (`id_vendedor_padrao`) REFERENCES `vendedores` (`id_vendedor`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_param_cliente_nfce` FOREIGN KEY (`id_cliente_nfce`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `fk_user_param_operacao_nfce` FOREIGN KEY (`id_operacao_nfce`) REFERENCES `operacoes` (`id_operacao`),
  CONSTRAINT `fk_user_param_vendedor_nfce` FOREIGN KEY (`id_vendedor_nfce`) REFERENCES `vendedores` (`id_vendedor`),
  CONSTRAINT `fk_user_parametros_operacao_os` FOREIGN KEY (`id_operacao_os`) REFERENCES `operacoes` (`id_operacao`),
  CONSTRAINT `fk_user_parametros_operacao_venda` FOREIGN KEY (`id_operacao_venda`) REFERENCES `operacoes` (`id_operacao`),
  CONSTRAINT `fk_user_parametros_vendedor_os` FOREIGN KEY (`id_vendedor_os`) REFERENCES `vendedores` (`id_vendedor`),
  CONSTRAINT `fk_user_parametros_vendedor_venda` FOREIGN KEY (`id_vendedor_venda`) REFERENCES `vendedores` (`id_vendedor`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_parametros`
--

LOCK TABLES `user_parametros` WRITE;
/*!40000 ALTER TABLE `user_parametros` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_parametros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permissoes`
--

DROP TABLE IF EXISTS `user_permissoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permissoes` (
  `id_permissao` int NOT NULL AUTO_INCREMENT,
  `id_user` int NOT NULL,
  `clientes_acessar` tinyint(1) DEFAULT '0',
  `clientes_criar` tinyint(1) DEFAULT '0',
  `clientes_editar` tinyint(1) DEFAULT '0',
  `clientes_excluir` tinyint(1) DEFAULT '0',
  `produtos_acessar` tinyint(1) DEFAULT '0',
  `produtos_criar` tinyint(1) DEFAULT '0',
  `produtos_editar` tinyint(1) DEFAULT '0',
  `produtos_excluir` tinyint(1) DEFAULT '0',
  `financeiro_acessar` tinyint(1) DEFAULT '0',
  `financeiro_criar` tinyint(1) DEFAULT '0',
  `financeiro_editar` tinyint(1) DEFAULT '0',
  `financeiro_excluir` tinyint(1) DEFAULT '0',
  `financeiro_baixar` tinyint(1) DEFAULT '0',
  `config_acessar` tinyint(1) DEFAULT '0',
  `config_empresa_editar` tinyint(1) DEFAULT '0',
  `config_usuarios_acessar` tinyint(1) DEFAULT '0',
  `config_usuarios_criar` tinyint(1) DEFAULT '0',
  `config_usuarios_editar` tinyint(1) DEFAULT '0',
  `config_usuarios_excluir` tinyint(1) DEFAULT '0',
  `config_vendedores_acessar` tinyint(1) DEFAULT '0',
  `config_vendedores_criar` tinyint(1) DEFAULT '0',
  `config_vendedores_editar` tinyint(1) DEFAULT '0',
  `config_vendedores_excluir` tinyint(1) DEFAULT '0',
  `config_operacoes_acessar` tinyint(1) DEFAULT '0',
  `config_operacoes_criar` tinyint(1) DEFAULT '0',
  `config_operacoes_editar` tinyint(1) DEFAULT '0',
  `config_operacoes_excluir` tinyint(1) DEFAULT '0',
  `config_apoio_acessar` tinyint(1) DEFAULT '0',
  `config_apoio_criar` tinyint(1) DEFAULT '0',
  `config_apoio_editar` tinyint(1) DEFAULT '0',
  `config_apoio_excluir` tinyint(1) DEFAULT '0',
  `vendas_acessar` tinyint(1) DEFAULT '0',
  `vendas_criar` tinyint(1) DEFAULT '0',
  `vendas_editar` tinyint(1) DEFAULT '0',
  `vendas_excluir` tinyint(1) DEFAULT '0',
  `vendas_cancelar` tinyint(1) DEFAULT '0',
  `aut_desconto` tinyint(1) DEFAULT '0',
  `aut_cancelar_venda` tinyint(1) DEFAULT '0',
  `compras_acessar` int DEFAULT '0',
  `compras_criar` int DEFAULT '0',
  `compras_editar` int DEFAULT '0',
  `compras_excluir` int DEFAULT '0',
  `trocas_acessar` int DEFAULT '0',
  `trocas_criar` int DEFAULT '0',
  `trocas_editar` int DEFAULT '0',
  `trocas_excluir` int DEFAULT '0',
  `ordens_acessar` int DEFAULT '0',
  `ordens_criar` int DEFAULT '0',
  `ordens_editar` int DEFAULT '0',
  `ordens_excluir` int DEFAULT '0',
  `cotacoes_acessar` int DEFAULT '0',
  `cotacoes_criar` int DEFAULT '0',
  `cotacoes_editar` int DEFAULT '0',
  `cotacoes_excluir` int DEFAULT '0',
  `devolucoes_acessar` int DEFAULT '0',
  `devolucoes_criar` int DEFAULT '0',
  `devolucoes_editar` int DEFAULT '0',
  `devolucoes_excluir` int DEFAULT '0',
  `comandas_acessar` int DEFAULT '0',
  `comandas_criar` int DEFAULT '0',
  `comandas_editar` int DEFAULT '0',
  `comandas_excluir` int DEFAULT '0',
  `petshop_acessar` int DEFAULT '0',
  `petshop_criar` int DEFAULT '0',
  `petshop_editar` int DEFAULT '0',
  `petshop_excluir` int DEFAULT '0',
  `catalogo_acessar` int DEFAULT '0',
  `catalogo_editar` int DEFAULT '0',
  `etiquetas_acessar` int DEFAULT '0',
  `etiquetas_criar` int DEFAULT '0',
  `etiquetas_editar` int DEFAULT '0',
  `etiquetas_excluir` int DEFAULT '0',
  `relatorios_acessar` int DEFAULT '0',
  `relatorios_exportar` int DEFAULT '0',
  `graficos_acessar` int DEFAULT '0',
  `mapa_promocao_acessar` int DEFAULT '0',
  `mapa_promocao_criar` int DEFAULT '0',
  `mapa_promocao_editar` int DEFAULT '0',
  `mapa_promocao_excluir` int DEFAULT '0',
  `venda_rapida_acessar` int DEFAULT '0',
  `fornecedores_acessar` int DEFAULT '0',
  `fornecedores_criar` int DEFAULT '0',
  `fornecedores_editar` int DEFAULT '0',
  `fornecedores_excluir` int DEFAULT '0',
  `veiculos_acessar` int DEFAULT '0',
  `veiculos_criar` int DEFAULT '0',
  `veiculos_editar` int DEFAULT '0',
  `veiculos_excluir` int DEFAULT '0',
  `equipamentos_acessar` int DEFAULT '0',
  `equipamentos_criar` int DEFAULT '0',
  `equipamentos_editar` int DEFAULT '0',
  `equipamentos_excluir` int DEFAULT '0',
  `alugueis_acessar` int DEFAULT '0',
  `alugueis_criar` int DEFAULT '0',
  `alugueis_editar` int DEFAULT '0',
  `alugueis_excluir` int DEFAULT '0',
  `cheques_acessar` int DEFAULT '0',
  `cheques_criar` int DEFAULT '0',
  `cheques_editar` int DEFAULT '0',
  `cheques_excluir` int DEFAULT '0',
  `bancario_acessar` int DEFAULT '0',
  `bancario_criar` int DEFAULT '0',
  `bancario_editar` int DEFAULT '0',
  `bancario_excluir` int DEFAULT '0',
  `estoque_acessar` int DEFAULT '0',
  `estoque_ajustar` int DEFAULT '0',
  `estoque_transferir` int DEFAULT '0',
  `estoque_inventariar` int DEFAULT '0',
  `tabela_comercial_acessar` int DEFAULT '0',
  `tabela_comercial_criar` int DEFAULT '0',
  `tabela_comercial_editar` int DEFAULT '0',
  `tabela_comercial_excluir` int DEFAULT '0',
  `clinica_veterinaria_acessar` int DEFAULT '0',
  `clinica_veterinaria_criar` int DEFAULT '0',
  `clinica_veterinaria_editar` int DEFAULT '0',
  `clinica_veterinaria_excluir` int DEFAULT '0',
  `documentos_fiscais_acessar` int DEFAULT '0',
  `documentos_fiscais_visualizar` int DEFAULT '0',
  `documentos_fiscais_cancelar` int DEFAULT '0',
  `documentos_fiscais_inutilizar` int DEFAULT '0',
  `nfce_acessar` int DEFAULT '0',
  `nfce_emitir` int DEFAULT '0',
  `nfce_cancelar` int DEFAULT '0',
  `nfce_visualizar` int DEFAULT '0',
  `nfe_acessar` int DEFAULT '0',
  `nfe_emitir` int DEFAULT '0',
  `nfe_cancelar` int DEFAULT '0',
  `nfe_visualizar` int DEFAULT '0',
  `nfe_inutilizar` int DEFAULT '0',
  `cte_acessar` int DEFAULT '0',
  `cte_emitir` int DEFAULT '0',
  `cte_cancelar` int DEFAULT '0',
  `cte_visualizar` int DEFAULT '0',
  `manifestacao_acessar` int DEFAULT '0',
  `manifestacao_manifestar` int DEFAULT '0',
  `manifestacao_visualizar` int DEFAULT '0',
  `sped_acessar` int DEFAULT '0',
  `sped_gerar` int DEFAULT '0',
  `sped_exportar` int DEFAULT '0',
  `sped_visualizar` int DEFAULT '0',
  `sped_contribuicoes_acessar` int DEFAULT '0',
  `sped_contribuicoes_gerar` int DEFAULT '0',
  `sped_contribuicoes_exportar` int DEFAULT '0',
  `sped_contribuicoes_visualizar` int DEFAULT '0',
  `aprovacoes_acessar` int DEFAULT '0',
  `aprovacoes_aprovar` int DEFAULT '0',
  `aprovacoes_rejeitar` int DEFAULT '0',
  `aprovacoes_visualizar` int DEFAULT '0',
  `backup_acessar` int DEFAULT '0',
  `backup_criar` int DEFAULT '0',
  `backup_restaurar` int DEFAULT '0',
  `backup_agendar` int DEFAULT '0',
  `agro_acessar` int DEFAULT '0',
  `agro_safras_acessar` int DEFAULT '0',
  `agro_safras_criar` int DEFAULT '0',
  `agro_safras_editar` int DEFAULT '0',
  `agro_safras_excluir` int DEFAULT '0',
  `agro_contratos_acessar` int DEFAULT '0',
  `agro_contratos_criar` int DEFAULT '0',
  `agro_contratos_editar` int DEFAULT '0',
  `agro_contratos_excluir` int DEFAULT '0',
  `agro_conversoes_acessar` int DEFAULT '0',
  `agro_conversoes_criar` int DEFAULT '0',
  `agro_conversoes_editar` int DEFAULT '0',
  `agro_conversoes_excluir` int DEFAULT '0',
  `agro_operacional_acessar` int DEFAULT '0',
  `agro_operacional_criar` int DEFAULT '0',
  `agro_operacional_editar` int DEFAULT '0',
  `agro_operacional_excluir` int DEFAULT '0',
  `dashboard_acessar` int DEFAULT '0',
  `ver_valores_reais` int DEFAULT '0',
  `ver_custos` int DEFAULT '0',
  `alterar_preco_venda` int DEFAULT '0',
  `perm_auditoria_acessar` int DEFAULT '0',
  `perm_auditoria_visualizar` int DEFAULT '0',
  `perm_auditoria_exportar` int DEFAULT '0',
  `perm_auditoria_excluir` int DEFAULT '0',
  `estoque_editar` int DEFAULT '0',
  `fiscal_acessar` int DEFAULT '0',
  `boletos_acessar` int DEFAULT '0',
  `whatsapp_acessar` int DEFAULT '0',
  `mapa_carga_acessar` int DEFAULT '0',
  `producao_acessar` int DEFAULT '0',
  `agenda_acessar` int DEFAULT '0',
  `nfce_criar` int DEFAULT '0',
  `nfce_editar` int DEFAULT '0',
  `nfce_excluir` int DEFAULT '0',
  `nfe_criar` int DEFAULT '0',
  `nfe_editar` int DEFAULT '0',
  `nfe_excluir` int DEFAULT '0',
  `cte_criar` int DEFAULT '0',
  `cte_editar` int DEFAULT '0',
  `cte_excluir` int DEFAULT '0',
  `mdfe_acessar` int DEFAULT '0',
  `mdfe_criar` int DEFAULT '0',
  `mdfe_editar` int DEFAULT '0',
  `mdfe_excluir` int DEFAULT '0',
  `agro_criar` int DEFAULT '0',
  `agro_editar` int DEFAULT '0',
  `agro_excluir` int DEFAULT '0',
  `boletos_criar` int DEFAULT '0',
  `boletos_editar` int DEFAULT '0',
  `mapa_carga_criar` int DEFAULT '0',
  `mapa_carga_editar` int DEFAULT '0',
  `producao_criar` int DEFAULT '0',
  `producao_editar` int DEFAULT '0',
  `comissoes_acessar` int DEFAULT '0',
  `conciliacao_acessar` int DEFAULT '0',
  `cartoes_acessar` int DEFAULT '0',
  `agenda_criar` int DEFAULT '0',
  `agenda_editar` int DEFAULT '0',
  `balancas_acessar` int DEFAULT '0',
  `contas_servicos_acessar` int DEFAULT '0',
  `faturamento_acessar` int DEFAULT NULL,
  `faturamento_multi_cliente` int DEFAULT NULL,
  `pode_atualizar_cliente` int DEFAULT '0',
  `pode_criar_banco` int DEFAULT '0',
  `pode_gerenciar_agendamento` int DEFAULT '0',
  `pode_cadastrar_financeiro_saas` int DEFAULT '0',
  PRIMARY KEY (`id_permissao`),
  UNIQUE KEY `id_user_UNIQUE` (`id_user`),
  CONSTRAINT `fk_permissoes_user` FOREIGN KEY (`id_user`) REFERENCES `auth_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissoes`
--

LOCK TABLES `user_permissoes` WRITE;
/*!40000 ALTER TABLE `user_permissoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_permissoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nome_usuario` varchar(100) NOT NULL,
  `login` varchar(50) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `login_UNIQUE` (`login`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'ADMIN','ADMIN','6aca5e0e9574a463568b6f2194c6a97c','',1);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vacinas_aplicadas`
--

DROP TABLE IF EXISTS `vacinas_aplicadas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vacinas_aplicadas` (
  `id_vacina` int NOT NULL AUTO_INCREMENT,
  `nome_vacina` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fabricante` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lote` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_aplicacao` date NOT NULL,
  `proxima_dose` date DEFAULT NULL,
  `via_aplicacao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_cadastro` datetime(6) NOT NULL,
  `id_pet` int NOT NULL,
  `id_veterinario` int DEFAULT NULL,
  PRIMARY KEY (`id_vacina`),
  KEY `vacinas_aplicadas_id_veterinario_5615414d_fk_veterinar` (`id_veterinario`),
  KEY `vacinas_apl_id_pet_683b91_idx` (`id_pet`,`proxima_dose`),
  CONSTRAINT `vacinas_aplicadas_id_pet_e24f62c7_fk_petshop_pets_id_pet` FOREIGN KEY (`id_pet`) REFERENCES `petshop_pets` (`id_pet`),
  CONSTRAINT `vacinas_aplicadas_id_veterinario_5615414d_fk_veterinar` FOREIGN KEY (`id_veterinario`) REFERENCES `veterinarios` (`id_veterinario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vacinas_aplicadas`
--

LOCK TABLES `vacinas_aplicadas` WRITE;
/*!40000 ALTER TABLE `vacinas_aplicadas` DISABLE KEYS */;
/*!40000 ALTER TABLE `vacinas_aplicadas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `valores_atributo_variacao`
--

DROP TABLE IF EXISTS `valores_atributo_variacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `valores_atributo_variacao` (
  `id_valor` int NOT NULL AUTO_INCREMENT,
  `valor` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_atributo_id` int NOT NULL,
  PRIMARY KEY (`id_valor`),
  KEY `valores_atributo_var_id_atributo_id_83b1e1be_fk_atributos` (`id_atributo_id`),
  CONSTRAINT `valores_atributo_var_id_atributo_id_83b1e1be_fk_atributos` FOREIGN KEY (`id_atributo_id`) REFERENCES `atributos_variacao` (`id_atributo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `valores_atributo_variacao`
--

LOCK TABLES `valores_atributo_variacao` WRITE;
/*!40000 ALTER TABLE `valores_atributo_variacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `valores_atributo_variacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `veiculos`
--

DROP TABLE IF EXISTS `veiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `veiculos` (
  `id_veiculo` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int DEFAULT NULL,
  `placa` varchar(10) NOT NULL,
  `marca` varchar(100) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `ano` int DEFAULT NULL,
  `cor` varchar(50) DEFAULT NULL,
  `chassi` varchar(50) DEFAULT NULL,
  `observacoes` text,
  `uf` varchar(2) DEFAULT NULL,
  `rntrc` varchar(20) DEFAULT NULL,
  `tipo_rodado` varchar(2) DEFAULT NULL COMMENT '01-Truck, 02-Toco, 03-Cavalo, 04-VAN, 05-Utilit├írio, 06-Outros',
  `tipo_carroceria` varchar(2) DEFAULT NULL COMMENT '00-N├úo aplic├ível, 01-Aberta, 02-Fechada/Ba├║, 03-Graneleira, 04-Porta Container, 05-Sider',
  `tara_kg` int DEFAULT NULL COMMENT 'Tara do ve├¡culo em KG (peso vazio)',
  `capacidade_kg` int DEFAULT NULL COMMENT 'Capacidade de carga do ve├¡culo em KG',
  `tipo_propriedade` int DEFAULT NULL COMMENT '0-TAC Agregado, 1-TAC Independente, 2-Outros',
  PRIMARY KEY (`id_veiculo`),
  UNIQUE KEY `placa_UNIQUE` (`placa`),
  KEY `fk_veiculos_cliente_idx` (`id_cliente`),
  CONSTRAINT `fk_veiculos_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `veiculos`
--

LOCK TABLES `veiculos` WRITE;
/*!40000 ALTER TABLE `veiculos` DISABLE KEYS */;
/*!40000 ALTER TABLE `veiculos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `veiculos_novos`
--

DROP TABLE IF EXISTS `veiculos_novos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `veiculos_novos` (
  `id_veiculo_novo` int NOT NULL AUTO_INCREMENT,
  `tp_op` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chassi` varchar(17) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `c_cor` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `x_cor` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pot` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cilin` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `peso_l` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `peso_b` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `n_serie` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tp_comb` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `n_motor` varchar(21) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cmt` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dist` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ano_mod` int NOT NULL,
  `ano_fab` int NOT NULL,
  `tp_pint` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tp_veic` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `esp_veic` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `vin` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cond_veic` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `c_mod` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `c_cor_denatran` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `lota` int NOT NULL,
  `tp_rest` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_cadastro` datetime(6) NOT NULL,
  `data_atualizacao` datetime(6) NOT NULL,
  `id_venda_item` int NOT NULL,
  PRIMARY KEY (`id_veiculo_novo`),
  UNIQUE KEY `id_venda_item` (`id_venda_item`),
  CONSTRAINT `veiculos_novos_id_venda_item_bb2da625_fk_venda_ite` FOREIGN KEY (`id_venda_item`) REFERENCES `venda_itens` (`id_venda_item`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `veiculos_novos`
--

LOCK TABLES `veiculos_novos` WRITE;
/*!40000 ALTER TABLE `veiculos_novos` DISABLE KEYS */;
/*!40000 ALTER TABLE `veiculos_novos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venda_entrega_logs`
--

DROP TABLE IF EXISTS `venda_entrega_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venda_entrega_logs` (
  `id_entrega_log` int NOT NULL AUTO_INCREMENT,
  `status_anterior` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_novo` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_log` datetime(6) NOT NULL,
  `recebedor_nome` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recebedor_documento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_venda` int NOT NULL,
  `id_usuario` int DEFAULT NULL,
  PRIMARY KEY (`id_entrega_log`),
  KEY `venda_entrega_logs_id_venda_a44c6561_fk_vendas_id_venda` (`id_venda`),
  KEY `venda_entrega_logs_id_usuario_2f6e46e4_fk_auth_user_id` (`id_usuario`),
  CONSTRAINT `venda_entrega_logs_id_usuario_2f6e46e4_fk_auth_user_id` FOREIGN KEY (`id_usuario`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `venda_entrega_logs_id_venda_a44c6561_fk_vendas_id_venda` FOREIGN KEY (`id_venda`) REFERENCES `vendas` (`id_venda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venda_entrega_logs`
--

LOCK TABLES `venda_entrega_logs` WRITE;
/*!40000 ALTER TABLE `venda_entrega_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `venda_entrega_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venda_itens`
--

DROP TABLE IF EXISTS `venda_itens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venda_itens` (
  `id_venda_item` int NOT NULL AUTO_INCREMENT,
  `quantidade` decimal(12,3) NOT NULL,
  `valor_unitario` decimal(12,2) NOT NULL,
  `valor_desconto` decimal(12,2) DEFAULT NULL,
  `valor_total` decimal(12,2) NOT NULL,
  `quantidade_entregue` decimal(12,3) NOT NULL,
  `split_payment` tinyint(1) NOT NULL,
  `ncm_codigo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cest_codigo` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cfop` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `c_benef` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `c_class_trib` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nivel_tributacao` smallint DEFAULT NULL,
  `icms_cst_csosn` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icms_modalidade_bc` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icms_reducao_bc_perc` decimal(7,4) DEFAULT NULL,
  `icms_bc` decimal(14,2) DEFAULT NULL,
  `icms_aliq` decimal(7,4) DEFAULT NULL,
  `valor_icms` decimal(14,2) DEFAULT NULL,
  `icmsst_bc` decimal(14,2) DEFAULT NULL,
  `icmsst_aliq` decimal(7,4) DEFAULT NULL,
  `valor_icms_st` decimal(14,2) DEFAULT NULL,
  `pis_cst` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pis_aliq` decimal(7,4) DEFAULT NULL,
  `pis_bc` decimal(14,2) DEFAULT NULL,
  `valor_pis` decimal(14,2) DEFAULT NULL,
  `cofins_cst` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cofins_aliq` decimal(7,4) DEFAULT NULL,
  `cofins_bc` decimal(14,2) DEFAULT NULL,
  `valor_cofins` decimal(14,2) DEFAULT NULL,
  `ipi_cst` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ipi_aliq` decimal(7,4) DEFAULT NULL,
  `ipi_bc` decimal(14,2) DEFAULT NULL,
  `valor_ipi` decimal(14,2) DEFAULT NULL,
  `ibs_cst` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ibs_aliq` decimal(7,4) DEFAULT NULL,
  `ibs_bc` decimal(14,2) DEFAULT NULL,
  `valor_ibs` decimal(14,2) DEFAULT NULL,
  `cbs_cst` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cbs_aliq` decimal(7,4) DEFAULT NULL,
  `cbs_bc` decimal(14,2) DEFAULT NULL,
  `valor_cbs` decimal(14,2) DEFAULT NULL,
  `is_aliq` decimal(7,4) DEFAULT NULL,
  `valor_is` decimal(14,2) DEFAULT NULL,
  `tipo_produto_reform` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ibs_aliq_estadual` decimal(7,4) DEFAULT NULL,
  `ibs_aliq_municipal` decimal(7,4) DEFAULT NULL,
  `ibs_valor_estadual` decimal(14,2) DEFAULT NULL,
  `ibs_valor_municipal` decimal(14,2) DEFAULT NULL,
  `reducao_bc_cbs_perc` decimal(5,2) DEFAULT NULL,
  `reducao_bc_ibs_perc` decimal(5,2) DEFAULT NULL,
  `id_regra_reforma_aplicada` int DEFAULT NULL,
  `valor_total_tributos` decimal(14,2) DEFAULT NULL,
  `carga_tributaria_perc` decimal(7,4) DEFAULT NULL,
  `id_lote` int DEFAULT NULL,
  `id_produto` int DEFAULT NULL,
  `id_variacao` int DEFAULT NULL,
  `id_venda` int NOT NULL,
  PRIMARY KEY (`id_venda_item`),
  KEY `venda_itens_id_lote_3b8e00c1_fk_lotes_produto_id_lote` (`id_lote`),
  KEY `venda_itens_id_produto_3903c33c_fk_produtos_id_produto` (`id_produto`),
  KEY `venda_itens_id_variacao_ebf5a827_fk_produtos_` (`id_variacao`),
  KEY `venda_itens_id_venda_84818560_fk_vendas_id_venda` (`id_venda`),
  CONSTRAINT `venda_itens_id_lote_3b8e00c1_fk_lotes_produto_id_lote` FOREIGN KEY (`id_lote`) REFERENCES `lotes_produto` (`id_lote`),
  CONSTRAINT `venda_itens_id_produto_3903c33c_fk_produtos_id_produto` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`),
  CONSTRAINT `venda_itens_id_variacao_ebf5a827_fk_produtos_` FOREIGN KEY (`id_variacao`) REFERENCES `produtos_variacoes` (`id_variacao`),
  CONSTRAINT `venda_itens_id_venda_84818560_fk_vendas_id_venda` FOREIGN KEY (`id_venda`) REFERENCES `vendas` (`id_venda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venda_itens`
--

LOCK TABLES `venda_itens` WRITE;
/*!40000 ALTER TABLE `venda_itens` DISABLE KEYS */;
/*!40000 ALTER TABLE `venda_itens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendas`
--

DROP TABLE IF EXISTS `vendas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendas` (
  `id_venda` int NOT NULL AUTO_INCREMENT,
  `numero_documento` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_documento` datetime(6) NOT NULL,
  `valor_total` decimal(12,2) NOT NULL,
  `taxa_entrega` decimal(12,2) DEFAULT NULL,
  `valor_desconto` decimal(10,2) DEFAULT NULL,
  `gerou_financeiro` int DEFAULT NULL,
  `vista` int DEFAULT NULL,
  `origem_venda` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_pagamento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_logistica` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chave_nfe` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chave_nfe_referenciada` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `protocolo_nfe` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `xml_nfe` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status_nfe` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_nfe` int DEFAULT NULL,
  `serie_nfe` int NOT NULL,
  `qrcode_nfe` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `mensagem_nfe` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `numero_nfse` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chave_nfse` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_nfse` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_emissao_nfse` datetime(6) DEFAULT NULL,
  `xml_url_nfse` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `numero_dps` int DEFAULT NULL,
  `serie_dps` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_emissao_dps` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_frete` int NOT NULL,
  `placa_veiculo` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uf_veiculo` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rntrc` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantidade_volumes` int NOT NULL,
  `especie_volumes` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marca_volumes` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `peso_liquido` decimal(12,3) NOT NULL,
  `peso_bruto` decimal(12,3) NOT NULL,
  `observacao_fisco` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `observacao_contribuinte` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `endereco_entrega` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_prevista_entrega` date DEFAULT NULL,
  `responsavel_entrega` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacao_entrega` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `criado_por` int DEFAULT NULL,
  `id_cliente` int DEFAULT NULL,
  `id_operacao` int DEFAULT NULL,
  `id_venda_faturamento` int DEFAULT NULL,
  `id_vendedor1` int DEFAULT NULL,
  `id_vendedor2` int DEFAULT NULL,
  `id_transportadora` int DEFAULT NULL,
  `venda_futura_destino` int DEFAULT NULL,
  `venda_futura_origem` int DEFAULT NULL,
  `valor_total_venda` decimal(10,2) DEFAULT NULL,
  `status_venda` enum('Digitacao','Faturada','Cancelada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `gera_financeiro` tinyint(1) NOT NULL,
  `numero_nf` int DEFAULT NULL,
  `valor_frete` decimal(10,2) DEFAULT NULL,
  `id_vendedor` int DEFAULT NULL,
  `id_financeiro_id` int DEFAULT NULL,
  `data_venda` timestamp NOT NULL,
  `valor_total_produtos` decimal(10,2) DEFAULT NULL,
  `serie_nf` int DEFAULT NULL,
  PRIMARY KEY (`id_venda`),
  KEY `vendas_criado_por_a2a2be5c_fk_auth_user_id` (`criado_por`),
  KEY `vendas_id_cliente_f60b82d3_fk_clientes_id_cliente` (`id_cliente`),
  KEY `vendas_id_operacao_a25a17ab_fk_operacoes_id_operacao` (`id_operacao`),
  KEY `vendas_id_venda_faturamento_8d7e8bc4_fk_vendas_id_venda` (`id_venda_faturamento`),
  KEY `vendas_id_vendedor1_18ac7888_fk_vendedores_id_vendedor` (`id_vendedor1`),
  KEY `vendas_id_vendedor2_14779415_fk_vendedores_id_vendedor` (`id_vendedor2`),
  KEY `vendas_id_transportadora_318b8a46_fk_clientes_id_cliente` (`id_transportadora`),
  KEY `vendas_venda_futura_destino_4415c131_fk_vendas_id_venda` (`venda_futura_destino`),
  KEY `vendas_venda_futura_origem_179f149a_fk_vendas_id_venda` (`venda_futura_origem`),
  CONSTRAINT `vendas_criado_por_a2a2be5c_fk_auth_user_id` FOREIGN KEY (`criado_por`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `vendas_id_cliente_f60b82d3_fk_clientes_id_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `vendas_id_operacao_a25a17ab_fk_operacoes_id_operacao` FOREIGN KEY (`id_operacao`) REFERENCES `operacoes` (`id_operacao`),
  CONSTRAINT `vendas_id_transportadora_318b8a46_fk_clientes_id_cliente` FOREIGN KEY (`id_transportadora`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `vendas_id_venda_faturamento_8d7e8bc4_fk_vendas_id_venda` FOREIGN KEY (`id_venda_faturamento`) REFERENCES `vendas` (`id_venda`),
  CONSTRAINT `vendas_id_vendedor1_18ac7888_fk_vendedores_id_vendedor` FOREIGN KEY (`id_vendedor1`) REFERENCES `vendedores` (`id_vendedor`),
  CONSTRAINT `vendas_id_vendedor2_14779415_fk_vendedores_id_vendedor` FOREIGN KEY (`id_vendedor2`) REFERENCES `vendedores` (`id_vendedor`),
  CONSTRAINT `vendas_venda_futura_destino_4415c131_fk_vendas_id_venda` FOREIGN KEY (`venda_futura_destino`) REFERENCES `vendas` (`id_venda`),
  CONSTRAINT `vendas_venda_futura_origem_179f149a_fk_vendas_id_venda` FOREIGN KEY (`venda_futura_origem`) REFERENCES `vendas` (`id_venda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendas`
--

LOCK TABLES `vendas` WRITE;
/*!40000 ALTER TABLE `vendas` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendas_split_payment`
--

DROP TABLE IF EXISTS `vendas_split_payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendas_split_payment` (
  `id_split` int NOT NULL AUTO_INCREMENT,
  `valor_liquido_empresa` decimal(15,2) NOT NULL,
  `valor_ibs_uf` decimal(15,2) NOT NULL,
  `valor_ibs_mun` decimal(15,2) NOT NULL,
  `valor_cbs` decimal(15,2) NOT NULL,
  `valor_total_retido` decimal(15,2) NOT NULL,
  `percentual_retencao` decimal(5,2) NOT NULL,
  `split_realizado` tinyint(1) NOT NULL,
  `split_data_hora` datetime(6) DEFAULT NULL,
  `split_transaction_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `split_response` json DEFAULT NULL,
  `requer_aprovacao_supervisor` tinyint(1) NOT NULL,
  `motivo_excecao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `detalhamento_itens` json DEFAULT NULL,
  `criado_em` datetime(6) NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  `aprovacao_id` int DEFAULT NULL,
  `venda_id` int NOT NULL,
  PRIMARY KEY (`id_split`),
  UNIQUE KEY `venda_id` (`venda_id`),
  KEY `vendas_split_payment_aprovacao_id_87c6ab7b_fk_solicitac` (`aprovacao_id`),
  KEY `vendas_spli_venda_i_4f0623_idx` (`venda_id`,`split_realizado`),
  KEY `vendas_spli_split_d_9ebcc4_idx` (`split_data_hora`),
  CONSTRAINT `vendas_split_payment_aprovacao_id_87c6ab7b_fk_solicitac` FOREIGN KEY (`aprovacao_id`) REFERENCES `solicitacoes` (`id_solicitacao`),
  CONSTRAINT `vendas_split_payment_venda_id_ec2c3b4a_fk_vendas_id_venda` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id_venda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendas_split_payment`
--

LOCK TABLES `vendas_split_payment` WRITE;
/*!40000 ALTER TABLE `vendas_split_payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendas_split_payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendedor_funcoes`
--

DROP TABLE IF EXISTS `vendedor_funcoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendedor_funcoes` (
  `id_vendedor_funcao` int NOT NULL AUTO_INCREMENT,
  `id_vendedor` int NOT NULL,
  `id_funcao` int NOT NULL,
  PRIMARY KEY (`id_vendedor_funcao`),
  UNIQUE KEY `idx_vendedor_funcao_unique` (`id_vendedor`,`id_funcao`),
  KEY `fk_vendedor_idx` (`id_vendedor`),
  KEY `fk_funcao_idx` (`id_funcao`),
  CONSTRAINT `fk_vendedor_funcao_funcao` FOREIGN KEY (`id_funcao`) REFERENCES `funcoes` (`id_funcao`) ON DELETE CASCADE,
  CONSTRAINT `fk_vendedor_funcao_vendedor` FOREIGN KEY (`id_vendedor`) REFERENCES `vendedores` (`id_vendedor`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendedor_funcoes`
--

LOCK TABLES `vendedor_funcoes` WRITE;
/*!40000 ALTER TABLE `vendedor_funcoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendedor_funcoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendedores`
--

DROP TABLE IF EXISTS `vendedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendedores` (
  `id_vendedor` int NOT NULL AUTO_INCREMENT,
  `cpf` varchar(14) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `nome_reduzido` varchar(100) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `logradouro` varchar(255) DEFAULT NULL,
  `numero` varchar(20) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `percentual_comissao` decimal(5,2) DEFAULT '0.00' COMMENT 'Ex: 10.50 para 10.5%',
  `id_user` int DEFAULT NULL COMMENT 'Link para a tabela auth_user',
  PRIMARY KEY (`id_vendedor`),
  UNIQUE KEY `cpf_UNIQUE` (`cpf`),
  UNIQUE KEY `id_user` (`id_user`),
  KEY `fk_vendedor_user_idx` (`id_user`),
  CONSTRAINT `fk_vendedor_user` FOREIGN KEY (`id_user`) REFERENCES `auth_user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendedores`
--

LOCK TABLES `vendedores` WRITE;
/*!40000 ALTER TABLE `vendedores` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `veterinarios`
--

DROP TABLE IF EXISTS `veterinarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `veterinarios` (
  `id_veterinario` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `crmv` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `especialidade` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL,
  `data_cadastro` datetime(6) NOT NULL,
  PRIMARY KEY (`id_veterinario`),
  UNIQUE KEY `crmv` (`crmv`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `veterinarios`
--

LOCK TABLES `veterinarios` WRITE;
/*!40000 ALTER TABLE `veterinarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `veterinarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `whatsapp_configuracao`
--

DROP TABLE IF EXISTS `whatsapp_configuracao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `whatsapp_configuracao` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `delay_entre_mensagens` int NOT NULL,
  `limite_envios_por_vez` int NOT NULL,
  `telefone_conectado` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_conexao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `qr_code` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_ultima_conexao` datetime(6) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whatsapp_configuracao`
--

LOCK TABLES `whatsapp_configuracao` WRITE;
/*!40000 ALTER TABLE `whatsapp_configuracao` DISABLE KEYS */;
/*!40000 ALTER TABLE `whatsapp_configuracao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `whatsapp_fila`
--

DROP TABLE IF EXISTS `whatsapp_fila`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `whatsapp_fila` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `telefone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome_destinatario` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mensagem` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_envio` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prioridade` int NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tentativas` int NOT NULL,
  `erro_mensagem` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_criacao` datetime(6) NOT NULL,
  `data_envio` datetime(6) DEFAULT NULL,
  `agendar_para` datetime(6) DEFAULT NULL,
  `cliente_id` int DEFAULT NULL,
  `criado_por_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `whatsapp_fila_cliente_id_cffe65e8_fk_clientes_id_cliente` (`cliente_id`),
  KEY `whatsapp_fila_criado_por_id_c23e5fb6_fk_auth_user_id` (`criado_por_id`),
  KEY `whatsapp_fi_status_0022e0_idx` (`status`,`prioridade`),
  KEY `whatsapp_fi_data_cr_57412a_idx` (`data_criacao`),
  CONSTRAINT `whatsapp_fila_cliente_id_cffe65e8_fk_clientes_id_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `whatsapp_fila_criado_por_id_c23e5fb6_fk_auth_user_id` FOREIGN KEY (`criado_por_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whatsapp_fila`
--

LOCK TABLES `whatsapp_fila` WRITE;
/*!40000 ALTER TABLE `whatsapp_fila` DISABLE KEYS */;
/*!40000 ALTER TABLE `whatsapp_fila` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `whatsapp_logs`
--

DROP TABLE IF EXISTS `whatsapp_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `whatsapp_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tipo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensagem` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalhes` json DEFAULT NULL,
  `data_hora` datetime(6) NOT NULL,
  `fila_mensagem_id` bigint DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `whatsapp_logs_fila_mensagem_id_328f6ea4_fk_whatsapp_fila_id` (`fila_mensagem_id`),
  KEY `whatsapp_logs_usuario_id_445b3280_fk_auth_user_id` (`usuario_id`),
  CONSTRAINT `whatsapp_logs_fila_mensagem_id_328f6ea4_fk_whatsapp_fila_id` FOREIGN KEY (`fila_mensagem_id`) REFERENCES `whatsapp_fila` (`id`),
  CONSTRAINT `whatsapp_logs_usuario_id_445b3280_fk_auth_user_id` FOREIGN KEY (`usuario_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whatsapp_logs`
--

LOCK TABLES `whatsapp_logs` WRITE;
/*!40000 ALTER TABLE `whatsapp_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `whatsapp_logs` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-23 11:09:43
