-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: aperus_11111111111111
-- ------------------------------------------------------
-- Server version	8.0.44

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
) ENGINE=InnoDB AUTO_INCREMENT=685 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
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
INSERT INTO `auth_user` VALUES (4,'pbkdf2_sha256$1200000$ZvzfN1k7uKF5eLXDYPZNds$UiCqX2YeplrURhTAJLoqH8/9S2/tGw8wwq4C/h1wmIw=',NULL,1,'ADMIN','','','',1,1,'2026-05-27 13:08:14.351553');
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
  PRIMARY KEY (`id_boleto`),
  UNIQUE KEY `nosso_numero` (`nosso_numero`),
  KEY `boletos_usuario_baixa_id_c702a4d6_fk_auth_user_id` (`usuario_baixa_id`),
  KEY `boletos_id_config_bancaria_i_30db3560_fk_configura` (`id_config_bancaria_id`),
  KEY `boletos_id_conta_id_99195374_fk_financeiro_contas_id_conta` (`id_conta_id`),
  CONSTRAINT `boletos_id_config_bancaria_i_30db3560_fk_configura` FOREIGN KEY (`id_config_bancaria_id`) REFERENCES `configuracoes_bancarias` (`id_config`),
  CONSTRAINT `boletos_id_conta_id_99195374_fk_financeiro_contas_id_conta` FOREIGN KEY (`id_conta_id`) REFERENCES `financeiro_contas` (`id_conta`),
  CONSTRAINT `boletos_usuario_baixa_id_c702a4d6_fk_auth_user_id` FOREIGN KEY (`usuario_baixa_id`) REFERENCES `auth_user` (`id`)
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
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `cpf_cnpj_UNIQUE` (`cpf_cnpj`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
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
  `tipo_impressora` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `largura_termica` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `imprimir_automatico` tinyint(1) NOT NULL,
  `mostrar_logo` tinyint(1) NOT NULL,
  `copias` smallint unsigned NOT NULL,
  `observacao_rodape` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `atualizado_em` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `modulo` (`modulo`),
  CONSTRAINT `configuracoes_impressao_chk_1` CHECK ((`copias` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracoes_impressao`
--

LOCK TABLES `configuracoes_impressao` WRITE;
/*!40000 ALTER TABLE `configuracoes_impressao` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=172 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=240 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
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
  `nfe_aproveitamento_icms_ativo` tinyint(1) NOT NULL DEFAULT '0',
  `nfe_aproveitamento_icms_aliquota` decimal(7,4) DEFAULT '0.0000',
  `nfe_aproveitamento_icms_mensagem` longtext,
  `nfe_aproveitamento_icms_csosns` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_empresa`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresa_config`
--

LOCK TABLES `empresa_config` WRITE;
/*!40000 ALTER TABLE `empresa_config` DISABLE KEYS */;
INSERT INTO `empresa_config` VALUES (8,'Cliente de Permissao Ltda','Perm Cliente','11111111111111',NULL,'','','','','','','','',NULL,'SIMPLES',NULL,NULL,NULL,NULL,'2',10000.00,NULL,'2','2',0,'1','2','3550308',0,1,NULL,NULL,NULL,NULL,NULL,NULL,'0',1,0,0,1,0,0,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'020',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'A','1',NULL,NULL,'05',NULL,'1',NULL,'C:\\SPED\\CONTRIBUICOES\\','C,F,M','2','1',1.65,7.60,'135','020',0,0,0,0,1,1,0,NULL,NULL,'2',NULL,'1',0,0,'1',NULL,NULL,0,0.0000,NULL,NULL);
/*!40000 ALTER TABLE `empresa_config` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotel_quarto`
--

LOCK TABLES `hotel_quarto` WRITE;
/*!40000 ALTER TABLE `hotel_quarto` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotel_tipo_quarto`
--

LOCK TABLES `hotel_tipo_quarto` WRITE;
/*!40000 ALTER TABLE `hotel_tipo_quarto` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_auditoria`
--

LOCK TABLES `log_auditoria` WRITE;
/*!40000 ALTER TABLE `log_auditoria` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
  `cnpj` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `razao_social` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dia_vencimento` int NOT NULL,
  `valor_mensalidade` decimal(10,2) NOT NULL,
  `emite_nota` tinyint(1) NOT NULL,
  `status_licenca` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_reajuste` date DEFAULT NULL,
  `data_cadastro` datetime(6) NOT NULL,
  `db_host` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `db_port` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_test_environment` tinyint(1) NOT NULL,
  `schema_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
  PRIMARY KEY (`id_saas_cliente`),
  UNIQUE KEY `schema_name` (`schema_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
  PRIMARY KEY (`id_mensalidade`),
  KEY `saas_cliente_mensali_saas_cliente_id_f12366de_fk_saas_clie` (`saas_cliente_id`),
  CONSTRAINT `saas_cliente_mensali_saas_cliente_id_f12366de_fk_saas_clie` FOREIGN KEY (`saas_cliente_id`) REFERENCES `saas_cliente` (`id_saas_cliente`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_cliente_mensalidade`
--

LOCK TABLES `saas_cliente_mensalidade` WRITE;
/*!40000 ALTER TABLE `saas_cliente_mensalidade` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_cliente_mensalidade` ENABLE KEYS */;
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
  `dias_da_semana` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `agendamento_ativo` tinyint(1) NOT NULL,
  PRIMARY KEY (`id_config`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_configuracao_agendamento`
--

LOCK TABLES `saas_configuracao_agendamento` WRITE;
/*!40000 ALTER TABLE `saas_configuracao_agendamento` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_configuracao_agendamento` ENABLE KEYS */;
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
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `log_erro` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `saas_cliente_id` int NOT NULL,
  `versao_id` int NOT NULL,
  PRIMARY KEY (`id_historico`),
  KEY `saas_historico_atual_saas_cliente_id_a76686d0_fk_saas_clie` (`saas_cliente_id`),
  KEY `saas_historico_atual_versao_id_0fd4a316_fk_saas_vers` (`versao_id`),
  CONSTRAINT `saas_historico_atual_saas_cliente_id_a76686d0_fk_saas_clie` FOREIGN KEY (`saas_cliente_id`) REFERENCES `saas_cliente` (`id_saas_cliente`),
  CONSTRAINT `saas_historico_atual_versao_id_0fd4a316_fk_saas_vers` FOREIGN KEY (`versao_id`) REFERENCES `saas_versao_sistema` (`id_versao`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saas_historico_atualizacao`
--

LOCK TABLES `saas_historico_atualizacao` WRITE;
/*!40000 ALTER TABLE `saas_historico_atualizacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_historico_atualizacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saas_versao_sistema`
--

DROP TABLE IF EXISTS `saas_versao_sistema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_versao_sistema` (
  `id_versao` int NOT NULL AUTO_INCREMENT,
  `versao` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `data_lancamento` datetime(6) NOT NULL,
  PRIMARY KEY (`id_versao`),
  UNIQUE KEY `versao` (`versao`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3;
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissoes`
--

LOCK TABLES `user_permissoes` WRITE;
/*!40000 ALTER TABLE `user_permissoes` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_permissoes` ENABLE KEYS */;
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

-- Dump completed on 2026-05-27 10:08:16
