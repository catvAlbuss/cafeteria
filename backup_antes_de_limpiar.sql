-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: cafeteria
-- ------------------------------------------------------
-- Server version	8.4.3

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
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cajas`
--

DROP TABLE IF EXISTS `cajas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cajas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned DEFAULT NULL,
  `caja` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Caja 01',
  `empleado` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `closed_by` bigint unsigned DEFAULT NULL,
  `turno` enum('Todo el día','Mañana','Tarde','Noche') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Todo el día',
  `monto_inicial` decimal(10,2) NOT NULL DEFAULT '0.00',
  `origen_fondo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `justificacion_apertura` text COLLATE utf8mb4_unicode_ci,
  `fecha_apertura` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monto_final` decimal(10,2) DEFAULT NULL,
  `efectivo_esperado` decimal(12,2) DEFAULT NULL,
  `diferencia_cierre` decimal(12,2) DEFAULT NULL,
  `ventas_dia` decimal(10,2) DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  `estado` enum('Abierta','Cerrada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Abierta',
  `total_ventas_caja` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_deliverys` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_pedidos_mesa` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_pedidos` int NOT NULL DEFAULT '0',
  `contador_pedidos` bigint unsigned NOT NULL DEFAULT '0',
  `detalle_pedidos` json DEFAULT NULL,
  `resumen_cierre` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cajas_team_id_index` (`team_id`),
  KEY `cajas_user_id_foreign` (`user_id`),
  KEY `cajas_closed_by_foreign` (`closed_by`),
  KEY `cajas_team_estado_index` (`team_id`,`estado`),
  KEY `cajas_estado_index` (`estado`),
  KEY `cajas_team_id_estado_index` (`team_id`,`estado`),
  CONSTRAINT `cajas_closed_by_foreign` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `cajas_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cajas_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cajas`
--

LOCK TABLES `cajas` WRITE;
/*!40000 ALTER TABLE `cajas` DISABLE KEYS */;
INSERT INTO `cajas` VALUES (1,1,'Caja 01',NULL,1,NULL,'Todo el día',200.00,'manual',NULL,'2026-07-24 01:58:57',NULL,NULL,NULL,NULL,NULL,NULL,'Abierta',1639.39,0.00,0.00,52,20,NULL,NULL,'2026-07-24 01:58:57','2026-09-24 16:58:38');
/*!40000 ALTER TABLE `cajas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned NOT NULL,
  `tipo_documento` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `documento` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('inactivo','activo','vip') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'inactivo',
  `ultima_visita` datetime DEFAULT NULL,
  `pedidos_total` int unsigned NOT NULL DEFAULT '0',
  `pedidos_30d` int unsigned NOT NULL DEFAULT '0',
  `total_gastado_30d` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_gastado` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clientes_documento_unique` (`team_id`,`tipo_documento`,`documento`),
  KEY `clientes_team_id_estado_index` (`team_id`,`estado`),
  CONSTRAINT `clientes_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,1,'dni','75423544','fio',NULL,NULL,NULL,'activo','2026-09-24 11:37:07',9,9,186.50,186.50,'2026-09-24 15:07:24','2026-09-24 16:37:26');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `correlativos_control`
--

DROP TABLE IF EXISTS `correlativos_control`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `correlativos_control` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `serie` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ultimo_correlativo` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `correlativos_control_serie_unique` (`serie`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `correlativos_control`
--

LOCK TABLES `correlativos_control` WRITE;
/*!40000 ALTER TABLE `correlativos_control` DISABLE KEYS */;
INSERT INTO `correlativos_control` VALUES (4,'B001',15,'2026-09-22 21:38:08','2026-09-24 16:37:24'),(5,'F001',7,'2026-09-22 21:49:16','2026-09-24 16:58:59');
/*!40000 ALTER TABLE `correlativos_control` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `covers`
--

DROP TABLE IF EXISTS `covers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `covers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned DEFAULT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('promocion','evento','festividad','temporada') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('activo','programado','finalizado','pausado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'programado',
  `imagen` longtext COLLATE utf8mb4_unicode_ci,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `clicks` int unsigned NOT NULL DEFAULT '0',
  `categoria` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `covers_team_id_estado_index` (`team_id`,`estado`),
  CONSTRAINT `covers_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `covers`
--

LOCK TABLES `covers` WRITE;
/*!40000 ALTER TABLE `covers` DISABLE KEYS */;
INSERT INTO `covers` VALUES (1,1,'Happy Hour Cafe','2x1 en bebidas seleccionadas de 5pm a 7pm.','promocion','activo','data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"300\" viewBox=\"0 0 600 300\"><rect width=\"600\" height=\"300\" rx=\"18\" fill=\"%238A5A2B\"/><text x=\"50%25\" y=\"52%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"%23FFFFFF\" font-family=\"Arial\" font-size=\"28\" font-weight=\"700\">Happy Hour Cafe</text></svg>','2026-07-01','2026-07-31',420,'Bebidas','2026-07-24 01:57:24','2026-07-24 01:57:24'),(2,1,'Postre de la Semana','Cheesecake y brownie con descuento especial.','promocion','activo','data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"300\" viewBox=\"0 0 600 300\"><rect width=\"600\" height=\"300\" rx=\"18\" fill=\"%23B45309\"/><text x=\"50%25\" y=\"52%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"%23FFFFFF\" font-family=\"Arial\" font-size=\"28\" font-weight=\"700\">Postre de la Semana</text></svg>','2026-07-10','2026-07-20',260,'Postres','2026-07-24 01:57:24','2026-07-24 01:57:24'),(3,1,'Brunch Familiar','Combos para mesas familiares durante el fin de semana.','evento','programado','/storage/covers/cover_1789050628_lafk7puT.png','2026-08-01','2026-08-31',155,'Familiar','2026-07-24 01:57:24','2026-09-10 19:30:28'),(4,1,'Temporada de Invierno','Bebidas calientes y panes artesanales.','temporada','activo','data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"300\" viewBox=\"0 0 600 300\"><rect width=\"600\" height=\"300\" rx=\"18\" fill=\"%231D4ED8\"/><text x=\"50%25\" y=\"52%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"%23FFFFFF\" font-family=\"Arial\" font-size=\"28\" font-weight=\"700\">Temporada de Invierno</text></svg>','2026-06-01','2026-08-31',312,'Temporada','2026-07-24 01:57:24','2026-07-24 01:57:24'),(5,1,'Fiestas Patrias','Menu especial de celebracion para grupos.','festividad','programado','/storage/covers/cover_1789050638_eZelX0e2.png','2026-07-25','2026-07-29',198,'Festivo','2026-07-24 01:57:24','2026-09-10 19:30:38'),(6,1,'Cafe para Llevar','Promocion de cafe y croissant para delivery.','promocion','pausado','data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"300\" viewBox=\"0 0 600 300\"><rect width=\"600\" height=\"300\" rx=\"18\" fill=\"%237C3AED\"/><text x=\"50%25\" y=\"52%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"%23FFFFFF\" font-family=\"Arial\" font-size=\"28\" font-weight=\"700\">Cafe para Llevar</text></svg>','2026-07-01','2026-07-15',86,'Delivery','2026-07-24 01:57:24','2026-07-24 01:57:24'),(7,1,'dia de la mujer','kgtuy','promocion','programado','/storage/covers/cover_1790196676_Xya2ql90.png','2026-07-01','2026-07-05',0,NULL,'2026-07-24 21:34:35','2026-09-23 20:51:16');
/*!40000 ALTER TABLE `covers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deliveries`
--

DROP TABLE IF EXISTS `deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deliveries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned DEFAULT NULL,
  `codigo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productos` json NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('pendiente','pagado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `estado_delivery` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `repartidor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deliveries_codigo_unique` (`codigo`),
  KEY `deliveries_team_id_index` (`team_id`),
  KEY `deliveries_user_id_foreign` (`user_id`),
  CONSTRAINT `deliveries_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `deliveries_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliveries`
--

LOCK TABLES `deliveries` WRITE;
/*!40000 ALTER TABLE `deliveries` DISABLE KEYS */;
INSERT INTO `deliveries` VALUES (1,1,'D-001','maria','65485215258','hjkklkll','[{\"nombre\": \"Matcha Latte\", \"precio\": 16, \"cantidad\": 1, \"subtotal\": 16}]',18.88,NULL,'pendiente','pendiente',NULL,NULL,'2026-09-10 19:15:47','2026-09-10 19:15:47');
/*!40000 ALTER TABLE `deliveries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `idfactura` bigint unsigned NOT NULL AUTO_INCREMENT,
  `serie` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correlativo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendedor` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `montototal` decimal(10,2) NOT NULL,
  `fecha_emitido` datetime NOT NULL,
  `Cliente` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `factura` tinyint(1) NOT NULL DEFAULT '0',
  `boleta` tinyint(1) NOT NULL DEFAULT '0',
  `documento` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resumen_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resumen_ticket` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_sunat` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_sunat` text COLLATE utf8mb4_unicode_ci,
  `codigo_sunat` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idfactura`),
  UNIQUE KEY `facturas_serie_correlativo_unique` (`serie`,`correlativo`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
INSERT INTO `facturas` VALUES (26,'B001','1','Administrador',0.00,'2026-09-22 16:44:34','CLIENTES VARIOS',0,0,'12345678',NULL,NULL,'error_tecnico','Ya existe un comprobante emitido con el nombre 20000000001-03-B001-1. Posible correlativo duplicado.',NULL,NULL,NULL),(27,'B001','2','Administrador',17.49,'2026-09-22 16:47:49','CLIENTES VARIOS',0,0,'20000000001-03-B001-2.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(28,'F001','1','Administrador',41.00,'2026-09-22 16:49:16','jr bolivar',0,0,'20000000001-01-F001-1.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(29,'B001','3','Administrador',23.49,'2026-09-22 11:52:15','CLIENTES VARIOS',0,0,'20000000001-03-B001-3.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(30,'B001','4','Administrador',23.50,'2026-09-22 15:56:10','CLIENTES VARIOS',0,0,'20000000001-03-B001-4.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(31,'F001','2','Administrador',37.00,'2026-09-22 16:05:46','jr bolivar',0,0,'20000000001-01-F001-2.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(32,'B001','5','Administrador',43.00,'2026-09-23 09:10:09','CLIENTES VARIOS',0,0,'20000000001-03-B001-5.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(33,'B001','6','Administrador',18.50,'2026-09-23 16:55:23','CLIENTES VARIOS',0,0,'20000000001-03-B001-6.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(34,'B001','7','Administrador',33.00,'2026-09-24 09:21:56','CLIENTES VARIOS',0,0,'20000000001-03-B001-7.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(35,'B001','8','Administrador',33.00,'2026-09-24 09:23:15','CLIENTES VARIOS',0,0,'20000000001-03-B001-8.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(36,'B001','9','Administrador',26.00,'2026-09-24 09:29:24','CLIENTES VARIOS',0,0,'20000000001-03-B001-9.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(37,'B001','10','Administrador',21.50,'2026-09-24 09:49:49','CLIENTES VARIOS',0,0,'20000000001-03-B001-10.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(38,'B001','11','Administrador',23.00,'2026-09-24 10:06:46','CLIENTES VARIOS',0,0,'20000000001-03-B001-11.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(39,'B001','12','Administrador',27.00,'2026-09-24 10:07:23','CLIENTES VARIOS',0,0,'20000000001-03-B001-12.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(40,'F001','3','Administrador',32.00,'2026-09-24 10:59:35','12345678',0,0,'20000000001-01-F001-3.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(41,'B001','13','Administrador',20.00,'2026-09-24 11:00:52','CLIENTES VARIOS',0,0,'20000000001-03-B001-13.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(42,'F001','4','Administrador',13.00,'2026-09-24 11:09:33','vklsnvklms',0,0,'20000000001-01-F001-4.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(43,'F001','5','Administrador',53.00,'2026-09-24 11:10:15','JVKLDFNGVLNFSÑ',0,0,'20000000001-01-F001-5.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(44,'B001','14','Administrador',32.50,'2026-09-24 11:11:49','CLIENTES VARIOS',0,0,'20000000001-03-B001-14.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(45,'B001','15','Administrador',29.50,'2026-09-24 11:37:24','CLIENTES VARIOS',0,0,'20000000001-03-B001-15.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(46,'F001','6','Administrador',29.50,'2026-09-24 11:41:33','cdacdsc',0,0,'20000000001-01-F001-6.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL),(47,'F001','7','Administrador',21.00,'2026-09-24 11:58:59','gkgbhkijhnl',0,0,'20000000001-01-F001-7.pdf',NULL,NULL,'aceptado',NULL,'0',NULL,NULL);
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insumos`
--

DROP TABLE IF EXISTS `insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insumos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area` enum('cocina','bar') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cocina',
  `unidad` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `stock_minimo` decimal(10,2) NOT NULL DEFAULT '5.00',
  `fecha_vencimiento` date DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `proveedor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `insumos_team_id_fecha_vencimiento_index` (`team_id`,`fecha_vencimiento`),
  KEY `insumos_team_id_area_activo_index` (`team_id`,`area`,`activo`),
  CONSTRAINT `insumos_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insumos`
--

LOCK TABLES `insumos` WRITE;
/*!40000 ALTER TABLE `insumos` DISABLE KEYS */;
INSERT INTO `insumos` VALUES (1,1,'cafe molido','cafe','cocina','kg',10.00,5.00,'2027-07-23',1.00,'fvdsgvdbvdf',1,'2026-08-01 05:36:34','2026-08-01 05:36:34'),(2,1,'manzana','frutas','cocina','kg',3.00,5.00,'2026-08-03',3.00,'vafca',1,'2026-08-01 05:40:51','2026-08-01 05:42:16'),(3,1,'chin chin','dulce','cocina','kg',6.00,5.00,'2026-09-20',1.00,'vdfed',0,'2026-08-03 19:07:44','2026-08-03 20:55:28'),(4,1,'fresa','frutas','cocina','kg',4.00,5.00,'2026-08-06',3.00,'mjgkymg',1,'2026-08-03 19:38:25','2026-08-03 19:38:25');
/*!40000 ALTER TABLE `insumos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mesas`
--

DROP TABLE IF EXISTS `mesas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mesas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned DEFAULT NULL,
  `numero` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacidad` int NOT NULL DEFAULT '4',
  `sillas` int NOT NULL DEFAULT '4',
  `estado` enum('libre','pendiente','ocupada','reserva','listo_cobrar') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'libre',
  `pedido_listo` tinyint(1) NOT NULL DEFAULT '0',
  `cliente` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `personas` int DEFAULT NULL,
  `mesero` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mesas_numero_unique` (`numero`),
  KEY `mesas_user_id_foreign` (`user_id`),
  KEY `mesas_team_id_index` (`team_id`),
  KEY `mesas_estado_index` (`estado`),
  CONSTRAINT `mesas_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `mesas_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mesas`
--

LOCK TABLES `mesas` WRITE;
/*!40000 ALTER TABLE `mesas` DISABLE KEYS */;
INSERT INTO `mesas` VALUES (1,1,'01',2,2,'libre',0,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-09-16 22:13:19'),(2,1,'02',2,2,'libre',0,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-09-22 20:56:10'),(3,1,'03',4,4,'libre',0,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-09-10 14:24:10'),(4,1,'04',4,4,'libre',0,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-09-24 14:23:15'),(5,1,'05',4,4,'libre',0,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-09-16 22:54:39'),(6,1,'06',6,6,'libre',0,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-09-17 19:32:18'),(7,1,'07',6,6,'libre',0,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-09-24 14:49:49'),(8,1,'08',8,8,'libre',0,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-09-24 16:48:23'),(9,1,'09',4,4,'libre',0,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-09-16 22:04:46'),(10,1,'10',2,2,'libre',0,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-09-16 22:59:22'),(11,1,'11',6,6,'libre',0,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-09-16 20:30:03'),(12,1,'12',8,8,'libre',0,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-09-16 21:10:46');
/*!40000 ALTER TABLE `mesas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2024_01_01_000000_create_passkeys_table',1),(5,'2025_08_14_170933_add_two_factor_columns_to_users_table',1),(6,'2026_01_27_000001_create_teams_table',1),(7,'2026_01_27_000002_add_current_team_id_to_users_table',1),(8,'2026_07_07_163012_create_platos_table',1),(9,'2026_07_08_141155_create_mesas_table',1),(10,'2026_07_08_143449_create_pedidos_table',1),(11,'2026_07_08_174301_add_pedido_listo_to_mesas_table',1),(12,'2026_07_09_161221_add_mesero_to_mesas_table',1),(13,'2026_07_11_004411_add_caja_fields_to_pedidos_table',1),(14,'2026_07_11_004545_create_cajas_table',1),(15,'2026_07_13_005836_create_deliveries_table',1),(16,'2026_07_14_164330_create_permission_tables',1),(17,'2026_07_14_210341_add_team_id_to_business_tables',1),(18,'2026_07_14_213700_add_sales_fields_to_pedidos_table',1),(19,'2026_07_14_230000_create_covers_table',1),(20,'2026_07_15_034931_add_area_to_pedidos_table',1),(21,'2026_07_15_144940_add_usuario_to_users_table',1),(22,'2026_07_16_164400_create_movimientos_inventario_table',1),(23,'2026_07_16_175116_create_insumos_table',1),(24,'2026_07_16_175219_create_recetas_table',1),(25,'2026_07_16_230455_add_alert_fields_to_insumos_table',1),(26,'2026_07_16_231731_add_area_to_insumos_table',1),(27,'2026_07_17_000001_add_cash_session_reconciliation',1),(28,'2026_07_17_205702_add_all_day_shift_to_cajas_table',1),(29,'2026_07_17_210000_add_performance_indexes',1),(30,'2026_07_20_010816_add_submotivo_to_movimientos_inventario_table',1),(31,'2026_07_23_213603_add_indexes_to_cajas_table',2),(32,'2026_07_26_231200_add_venta_grupo_to_pedidos_table',3),(33,'2026_07_24_003513_add_delivery_id_to_pedidos_table',4),(34,'2026_07_24_003514_change_imagen_to_long_text_on_covers_table',4),(35,'2026_09_15_213059_create_facturas_table',5),(36,'2026_09_22_161812_create_correlativos_control_table',6),(37,'2026_09_22_161830_add_unique_constraint_to_facturas_table',7),(38,'2026_09_16_234502_add_stock_descontado_to_pedidos',8),(39,'2026_09_17_162014_create_clientes_table',8),(40,'2026_09_17_162015_add_documento_cliente_to_pedidos_table',8),(41,'2026_09_17_162017_add_clientes_min_compras_to_teams_table',8),(42,'2026_09_21_153209_add_numero_pedido_to_pedidos_and_contador_to_cajas',8),(43,'2026_09_22_145114_add_factura_fields_to_pedidos_table',8);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_permissions`
--

DROP TABLE IF EXISTS `model_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `model_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  `team_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`team_id`,`permission_id`,`model_id`,`model_type`),
  KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`),
  KEY `model_has_permissions_permission_id_foreign` (`permission_id`),
  KEY `model_has_permissions_team_foreign_key_index` (`team_id`),
  CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_permissions`
--

LOCK TABLES `model_has_permissions` WRITE;
/*!40000 ALTER TABLE `model_has_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `model_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_roles`
--

DROP TABLE IF EXISTS `model_has_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model_has_roles` (
  `role_id` bigint unsigned NOT NULL,
  `model_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  `team_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`team_id`,`role_id`,`model_id`,`model_type`),
  KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`),
  KEY `model_has_roles_role_id_foreign` (`role_id`),
  KEY `model_has_roles_team_foreign_key_index` (`team_id`),
  CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_roles`
--

LOCK TABLES `model_has_roles` WRITE;
/*!40000 ALTER TABLE `model_has_roles` DISABLE KEYS */;
INSERT INTO `model_has_roles` VALUES (1,'App\\Models\\User',2,1),(1,'App\\Models\\User',3,1),(1,'App\\Models\\User',4,1),(1,'App\\Models\\User',5,1),(2,'App\\Models\\User',6,1),(3,'App\\Models\\User',7,1),(4,'App\\Models\\User',8,1),(6,'App\\Models\\User',1,1);
/*!40000 ALTER TABLE `model_has_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_caja`
--

DROP TABLE IF EXISTS `movimientos_caja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_caja` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned NOT NULL,
  `caja_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `tipo` enum('ingreso','egreso','retiro','aporte') COLLATE utf8mb4_unicode_ci NOT NULL,
  `concepto` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `movimientos_caja_team_id_foreign` (`team_id`),
  KEY `movimientos_caja_user_id_foreign` (`user_id`),
  KEY `movimientos_caja_caja_id_tipo_index` (`caja_id`,`tipo`),
  CONSTRAINT `movimientos_caja_caja_id_foreign` FOREIGN KEY (`caja_id`) REFERENCES `cajas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `movimientos_caja_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `movimientos_caja_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_caja`
--

LOCK TABLES `movimientos_caja` WRITE;
/*!40000 ALTER TABLE `movimientos_caja` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimientos_caja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_inventario`
--

DROP TABLE IF EXISTS `movimientos_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_inventario` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned NOT NULL,
  `item_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_id` bigint unsigned NOT NULL,
  `tipo` enum('entrada','salida') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `stock_resultante` decimal(10,2) NOT NULL,
  `motivo` enum('venta','merma','compra','ajuste','produccion') COLLATE utf8mb4_unicode_ci NOT NULL,
  `submotivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia_id` bigint unsigned DEFAULT NULL,
  `proveedor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `movimientos_inventario_user_id_foreign` (`user_id`),
  KEY `movimientos_inventario_team_id_item_type_item_id_index` (`team_id`,`item_type`,`item_id`),
  KEY `movimientos_inventario_team_id_created_at_index` (`team_id`,`created_at`),
  CONSTRAINT `movimientos_inventario_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `movimientos_inventario_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
INSERT INTO `movimientos_inventario` VALUES (1,1,'insumo',1,'entrada',10.00,10.00,'compra',NULL,NULL,NULL,NULL,1,'Stock inicial','2026-08-01 05:36:34','2026-08-01 05:36:34'),(2,1,'insumo',2,'entrada',5.00,5.00,'compra',NULL,NULL,NULL,NULL,1,'Stock inicial','2026-08-01 05:40:51','2026-08-01 05:40:51'),(3,1,'insumo',2,'salida',2.00,3.00,'merma','caducado','merma',NULL,NULL,1,'vsca','2026-08-01 05:42:16','2026-08-01 05:42:16'),(4,1,'insumo',3,'entrada',6.00,6.00,'compra',NULL,NULL,NULL,NULL,1,'Stock inicial','2026-08-03 19:07:44','2026-08-03 19:07:44'),(5,1,'insumo',4,'entrada',4.00,4.00,'compra',NULL,NULL,NULL,NULL,1,'Stock inicial','2026-08-03 19:38:25','2026-08-03 19:38:25'),(6,1,'plato',7,'salida',1.00,10.00,'venta',NULL,'pedido',126,NULL,1,'Venta ##0126','2026-09-22 20:59:07','2026-09-22 20:59:07'),(7,1,'plato',9,'salida',1.00,14.00,'venta',NULL,'pedido',126,NULL,1,'Venta ##0126','2026-09-22 20:59:07','2026-09-22 20:59:07'),(8,1,'plato',7,'entrada',1.00,11.00,'ajuste',NULL,'pedido',126,NULL,1,'Anulación de venta ##0126','2026-09-22 21:07:28','2026-09-22 21:07:28'),(9,1,'plato',9,'entrada',1.00,15.00,'ajuste',NULL,'pedido',126,NULL,1,'Anulación de venta ##0126','2026-09-22 21:07:28','2026-09-22 21:07:28'),(10,1,'plato',8,'salida',1.00,5.00,'venta',NULL,'pedido',127,NULL,1,'Venta ##0127','2026-09-23 14:09:51','2026-09-23 14:09:51'),(11,1,'plato',7,'salida',1.00,10.00,'venta',NULL,'pedido',127,NULL,1,'Venta ##0127','2026-09-23 14:09:51','2026-09-23 14:09:51'),(12,1,'plato',8,'entrada',1.00,6.00,'ajuste',NULL,'pedido',127,NULL,1,'Anulación de venta ##0127','2026-09-23 14:24:29','2026-09-23 14:24:29'),(13,1,'plato',7,'entrada',1.00,11.00,'ajuste',NULL,'pedido',127,NULL,1,'Anulación de venta ##0127','2026-09-23 14:24:29','2026-09-23 14:24:29'),(14,1,'plato',14,'salida',1.00,5.00,'venta',NULL,'pedido',128,NULL,1,'Venta ##0128','2026-09-23 21:27:20','2026-09-23 21:27:20'),(15,1,'plato',15,'salida',1.00,9.00,'venta',NULL,'pedido',128,NULL,1,'Venta ##0128','2026-09-23 21:27:20','2026-09-23 21:27:20'),(16,1,'plato',8,'salida',1.00,5.00,'venta',NULL,'pedido',129,NULL,1,'Venta ##0129','2026-09-23 21:32:17','2026-09-23 21:32:17'),(17,1,'plato',12,'salida',1.00,28.00,'venta',NULL,'pedido',129,NULL,1,'Venta ##0129','2026-09-23 21:32:17','2026-09-23 21:32:17'),(18,1,'plato',8,'entrada',1.00,6.00,'ajuste',NULL,'pedido',129,NULL,1,'Anulación de venta ##0129','2026-09-23 21:32:37','2026-09-23 21:32:37'),(19,1,'plato',12,'entrada',1.00,29.00,'ajuste',NULL,'pedido',129,NULL,1,'Anulación de venta ##0129','2026-09-23 21:32:37','2026-09-23 21:32:37'),(20,1,'plato',10,'salida',1.00,20.00,'venta',NULL,'pedido',130,NULL,1,'Venta ##0130','2026-09-23 21:32:42','2026-09-23 21:32:42'),(21,1,'plato',7,'salida',1.00,10.00,'venta',NULL,'pedido',131,NULL,1,'Venta ##0131','2026-09-23 21:42:08','2026-09-23 21:42:08'),(22,1,'plato',12,'salida',1.00,28.00,'venta',NULL,'pedido',131,NULL,1,'Venta ##0131','2026-09-23 21:42:08','2026-09-23 21:42:08'),(23,1,'plato',7,'entrada',1.00,11.00,'ajuste',NULL,'pedido',131,NULL,1,'Anulación de venta ##0131','2026-09-23 21:51:18','2026-09-23 21:51:18'),(24,1,'plato',12,'entrada',1.00,29.00,'ajuste',NULL,'pedido',131,NULL,1,'Anulación de venta ##0131','2026-09-23 21:51:18','2026-09-23 21:51:18'),(25,1,'plato',10,'salida',1.00,19.00,'venta',NULL,'pedido',132,NULL,1,'Venta ##0132','2026-09-23 21:55:10','2026-09-23 21:55:10'),(26,1,'plato',12,'salida',1.00,28.00,'venta',NULL,'pedido',132,NULL,1,'Venta ##0132','2026-09-23 21:55:10','2026-09-23 21:55:10'),(27,1,'plato',2,'salida',1.00,34.00,'venta',NULL,'pedido',135,NULL,1,'Venta ##0135','2026-09-24 14:28:00','2026-09-24 14:28:00'),(28,1,'plato',3,'salida',1.00,33.00,'venta',NULL,'pedido',135,NULL,1,'Venta ##0135','2026-09-24 14:28:00','2026-09-24 14:28:00'),(29,1,'plato',2,'entrada',1.00,35.00,'ajuste',NULL,'pedido',135,NULL,1,'Anulación de venta ##0135','2026-09-24 14:28:16','2026-09-24 14:28:16'),(30,1,'plato',3,'entrada',1.00,34.00,'ajuste',NULL,'pedido',135,NULL,1,'Anulación de venta ##0135','2026-09-24 14:28:16','2026-09-24 14:28:16'),(31,1,'plato',5,'salida',1.00,27.00,'venta',NULL,'pedido',136,NULL,1,'Venta ##0136','2026-09-24 14:29:08','2026-09-24 14:29:08'),(32,1,'plato',6,'salida',1.00,17.00,'venta',NULL,'pedido',136,NULL,1,'Venta ##0136','2026-09-24 14:29:08','2026-09-24 14:29:08'),(33,1,'plato',4,'salida',1.00,24.00,'venta',NULL,'pedido',139,NULL,1,'Venta ##0139','2026-09-24 15:06:18','2026-09-24 15:06:18'),(34,1,'plato',5,'salida',1.00,26.00,'venta',NULL,'pedido',139,NULL,1,'Venta ##0139','2026-09-24 15:06:18','2026-09-24 15:06:18'),(35,1,'plato',11,'salida',1.00,4.00,'venta',NULL,'pedido',140,NULL,1,'Venta ##0140','2026-09-24 15:07:07','2026-09-24 15:07:07'),(36,1,'plato',9,'salida',1.00,14.00,'venta',NULL,'pedido',140,NULL,1,'Venta ##0140','2026-09-24 15:07:08','2026-09-24 15:07:08'),(37,1,'plato',7,'salida',1.00,10.00,'venta',NULL,'pedido',141,NULL,1,'Venta ##0141','2026-09-24 15:59:10','2026-09-24 15:59:10'),(38,1,'plato',8,'salida',1.00,5.00,'venta',NULL,'pedido',141,NULL,1,'Venta ##0141','2026-09-24 15:59:10','2026-09-24 15:59:10'),(39,1,'plato',13,'salida',1.00,7.00,'venta',NULL,'pedido',142,NULL,1,'Venta ##0142','2026-09-24 16:00:32','2026-09-24 16:00:32'),(40,1,'plato',14,'salida',1.00,4.00,'venta',NULL,'pedido',142,NULL,1,'Venta ##0142','2026-09-24 16:00:32','2026-09-24 16:00:32'),(41,1,'plato',7,'salida',1.00,9.00,'venta',NULL,'pedido',143,NULL,1,'Venta ##0143','2026-09-24 16:09:11','2026-09-24 16:09:11'),(42,1,'plato',11,'salida',1.00,3.00,'venta',NULL,'pedido',144,NULL,1,'Venta ##0144','2026-09-24 16:09:58','2026-09-24 16:09:58'),(43,1,'plato',8,'salida',1.00,4.00,'venta',NULL,'pedido',144,NULL,1,'Venta ##0144','2026-09-24 16:09:58','2026-09-24 16:09:58'),(44,1,'plato',2,'salida',2.00,33.00,'venta',NULL,'pedido',144,NULL,1,'Venta ##0144','2026-09-24 16:09:58','2026-09-24 16:09:58'),(45,1,'plato',10,'salida',1.00,18.00,'venta',NULL,'pedido',145,NULL,1,'Venta ##0145','2026-09-24 16:11:27','2026-09-24 16:11:27'),(46,1,'plato',11,'salida',1.00,2.00,'venta',NULL,'pedido',145,NULL,1,'Venta ##0145','2026-09-24 16:11:27','2026-09-24 16:11:27'),(47,1,'plato',12,'salida',1.00,27.00,'venta',NULL,'pedido',145,NULL,1,'Venta ##0145','2026-09-24 16:11:27','2026-09-24 16:11:27'),(48,1,'plato',1,'salida',1.00,51.00,'venta',NULL,'pedido',146,NULL,1,'Venta ##0146','2026-09-24 16:37:07','2026-09-24 16:37:07'),(49,1,'plato',2,'salida',1.00,32.00,'venta',NULL,'pedido',146,NULL,1,'Venta ##0146','2026-09-24 16:37:07','2026-09-24 16:37:07'),(50,1,'plato',3,'salida',1.00,33.00,'venta',NULL,'pedido',146,NULL,1,'Venta ##0146','2026-09-24 16:37:07','2026-09-24 16:37:07'),(51,1,'plato',13,'salida',1.00,6.00,'venta',NULL,'pedido',147,NULL,1,'Venta ##0147','2026-09-24 16:41:07','2026-09-24 16:41:07'),(52,1,'plato',10,'salida',1.00,17.00,'venta',NULL,'pedido',147,NULL,1,'Venta ##0147','2026-09-24 16:41:07','2026-09-24 16:41:07'),(53,1,'plato',15,'salida',1.00,8.00,'venta',NULL,'pedido',147,NULL,1,'Venta ##0147','2026-09-24 16:41:07','2026-09-24 16:41:07'),(54,1,'plato',13,'salida',1.00,5.00,'venta',NULL,'pedido',150,NULL,1,'Venta ##0150','2026-09-24 16:58:22','2026-09-24 16:58:22'),(55,1,'plato',10,'salida',1.00,16.00,'venta',NULL,'pedido',150,NULL,1,'Venta ##0150','2026-09-24 16:58:22','2026-09-24 16:58:22'),(56,1,'plato',13,'entrada',1.00,6.00,'ajuste',NULL,'pedido',150,NULL,1,'Anulación de venta ##0150','2026-09-24 16:58:34','2026-09-24 16:58:34'),(57,1,'plato',10,'entrada',1.00,17.00,'ajuste',NULL,'pedido',150,NULL,1,'Anulación de venta ##0150','2026-09-24 16:58:34','2026-09-24 16:58:34'),(58,1,'plato',14,'salida',1.00,3.00,'venta',NULL,'pedido',151,NULL,1,'Venta ##0151','2026-09-24 16:58:38','2026-09-24 16:58:38'),(59,1,'plato',12,'salida',1.00,26.00,'venta',NULL,'pedido',151,NULL,1,'Venta ##0151','2026-09-24 16:58:38','2026-09-24 16:58:38');
/*!40000 ALTER TABLE `movimientos_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notas_credito`
--

DROP TABLE IF EXISTS `notas_credito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notas_credito` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `factura_id` bigint unsigned NOT NULL,
  `serie` varchar(10) NOT NULL,
  `correlativo` varchar(20) NOT NULL,
  `tipo_documento` varchar(2) NOT NULL,
  `motivo_codigo` varchar(2) NOT NULL,
  `motivo_descripcion` varchar(255) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `cliente` varchar(255) NOT NULL,
  `cliente_documento` varchar(11) NOT NULL,
  `estado_sunat` varchar(50) DEFAULT NULL,
  `codigo_sunat` varchar(20) DEFAULT NULL,
  `error_sunat` text,
  `documento` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `factura_id` (`factura_id`),
  CONSTRAINT `notas_credito_ibfk_1` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`idfactura`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notas_credito`
--

LOCK TABLES `notas_credito` WRITE;
/*!40000 ALTER TABLE `notas_credito` DISABLE KEYS */;
/*!40000 ALTER TABLE `notas_credito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `passkeys`
--

DROP TABLE IF EXISTS `passkeys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `passkeys` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credential_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credential` json NOT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `passkeys_credential_id_unique` (`credential_id`),
  KEY `passkeys_user_id_index` (`user_id`),
  CONSTRAINT `passkeys_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `passkeys`
--

LOCK TABLES `passkeys` WRITE;
/*!40000 ALTER TABLE `passkeys` DISABLE KEYS */;
/*!40000 ALTER TABLE `passkeys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned DEFAULT NULL,
  `numero` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_pedido` bigint unsigned DEFAULT NULL,
  `mesa_id` bigint unsigned DEFAULT NULL,
  `delivery_id` bigint unsigned DEFAULT NULL,
  `mesa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `cliente` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_documento` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `documento_cliente` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre_cliente` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cliente_documento` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cliente_direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'mesa',
  `metodo_pago` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `factura_estado` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `factura_numero` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `factura_pdf_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `factura_xml_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `factura_cdr_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `factura_respuesta` text COLLATE utf8mb4_unicode_ci,
  `error_sunat` text COLLATE utf8mb4_unicode_ci,
  `productos` json NOT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `igv` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `caja_id` bigint unsigned DEFAULT NULL,
  `venta_grupo` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock_descontado` tinyint(1) NOT NULL DEFAULT '0',
  `estado` enum('pendiente','preparando','listo','entregado','pagado','cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `area` enum('cocina','bar','horno','postres') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hora_pedido` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `hora_entrega` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pedidos_numero_unique` (`numero`),
  KEY `pedidos_team_id_index` (`team_id`),
  KEY `pedidos_user_id_foreign` (`user_id`),
  KEY `pedidos_tipo_index` (`tipo`),
  KEY `pedidos_area_estado_index` (`area`,`estado`),
  KEY `pedidos_estado_index` (`estado`),
  KEY `pedidos_mesa_id_estado_index` (`mesa_id`,`estado`),
  KEY `pedidos_caja_id_estado_index` (`caja_id`,`estado`),
  KEY `pedidos_venta_grupo_index` (`venta_grupo`),
  KEY `pedidos_delivery_id_foreign` (`delivery_id`),
  KEY `pedidos_documento_cliente_tipo_documento_index` (`documento_cliente`,`tipo_documento`),
  CONSTRAINT `pedidos_caja_id_foreign` FOREIGN KEY (`caja_id`) REFERENCES `cajas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pedidos_delivery_id_foreign` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pedidos_mesa_id_foreign` FOREIGN KEY (`mesa_id`) REFERENCES `mesas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pedidos_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pedidos_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES (124,1,'#0001',NULL,2,NULL,NULL,1,'Anónimo','03','12345678','juan',NULL,NULL,'mesa','tarjeta','aceptado','20000000001-03-B001-4','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-4','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-4','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-4','La Boleta numero B001-4, ha sido aceptada',NULL,'[{\"id\": 10, \"nombre\": \"Brownie Chocolate\", \"precio\": 9.5, \"cantidad\": 1, \"subtotal\": 9.5, \"categoria\": \"Postres\"}]',8.05,1.45,9.50,1,NULL,0,'pagado','postres',NULL,'2026-09-22 20:54:56','2026-09-22 20:55:30','2026-09-22 20:54:56','2026-09-22 20:56:12'),(125,1,'#0125',NULL,2,NULL,NULL,1,'Anónimo','03','12345678','juan',NULL,NULL,'mesa','tarjeta','aceptado','20000000001-03-B001-4','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-4','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-4','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-4','La Boleta numero B001-4, ha sido aceptada',NULL,'[{\"id\": 11, \"nombre\": \"Tiramisu\", \"precio\": 14, \"cantidad\": 1, \"subtotal\": 14, \"categoria\": \"Postres\"}]',11.86,2.14,14.00,1,NULL,0,'pagado','postres',NULL,'2026-09-22 20:54:56','2026-09-22 20:55:35','2026-09-22 20:54:56','2026-09-22 20:56:12'),(126,1,'#0126',1,NULL,NULL,NULL,1,'Anónimo','01','12345678952','jr bolivar',NULL,NULL,'llevar','yape','aceptado','20000000001-01-F001-2','http://127.0.0.1:8000/facturacion/pdf/20000000001-01-F001-2','http://127.0.0.1:8000/facturacion/xml/20000000001-01-F001-2','http://127.0.0.1:8000/facturacion/cdr/20000000001-01-F001-2','La Factura numero F001-2, ha sido aceptada',NULL,'\"[{\\\"id\\\":7,\\\"nombre\\\":\\\"Hamburguesa Cafe\\\",\\\"cantidad\\\":1,\\\"precio\\\":24,\\\"subtotal\\\":24},{\\\"id\\\":9,\\\"nombre\\\":\\\"Cheesecake de Fresa\\\",\\\"cantidad\\\":1,\\\"precio\\\":13,\\\"subtotal\\\":13}]\"',31.36,5.64,37.00,1,NULL,0,'cancelado',NULL,NULL,'2026-09-22 20:59:07',NULL,'2026-09-22 20:59:07','2026-09-22 21:07:28'),(127,1,'#0127',2,NULL,NULL,NULL,1,'Anónimo','03','75423544','fio',NULL,NULL,'llevar','tarjeta','aceptado','20000000001-03-B001-5','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-5','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-5','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-5','La Boleta numero B001-5, ha sido aceptada',NULL,'\"[{\\\"id\\\":8,\\\"nombre\\\":\\\"Waffles con Fruta\\\",\\\"cantidad\\\":1,\\\"precio\\\":19,\\\"subtotal\\\":19},{\\\"id\\\":7,\\\"nombre\\\":\\\"Hamburguesa Cafe\\\",\\\"cantidad\\\":1,\\\"precio\\\":24,\\\"subtotal\\\":24}]\"',36.44,6.56,43.00,1,NULL,0,'cancelado',NULL,NULL,'2026-09-23 14:09:51',NULL,'2026-09-23 14:09:51','2026-09-23 14:24:29'),(128,1,'#0128',3,NULL,NULL,NULL,1,'Anónimo',NULL,NULL,NULL,NULL,NULL,'llevar',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'\"[{\\\"id\\\":14,\\\"nombre\\\":\\\"Tostadas gourmet\\\",\\\"cantidad\\\":1,\\\"precio\\\":12,\\\"subtotal\\\":12},{\\\"id\\\":15,\\\"nombre\\\":\\\"frape de oreo\\\",\\\"cantidad\\\":1,\\\"precio\\\":12,\\\"subtotal\\\":12}]\"',20.34,3.66,24.00,1,NULL,1,'pagado',NULL,NULL,'2026-09-23 21:27:20',NULL,'2026-09-23 21:27:20','2026-09-23 21:27:20'),(129,1,'#0129',4,NULL,NULL,NULL,1,'Anónimo',NULL,NULL,NULL,NULL,NULL,'llevar',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'\"[{\\\"id\\\":8,\\\"nombre\\\":\\\"Waffles con Fruta\\\",\\\"cantidad\\\":1,\\\"precio\\\":19,\\\"subtotal\\\":19},{\\\"id\\\":12,\\\"nombre\\\":\\\"Jugo de Naranja\\\",\\\"cantidad\\\":1,\\\"precio\\\":9,\\\"subtotal\\\":9}]\"',23.73,4.27,28.00,1,NULL,0,'cancelado',NULL,NULL,'2026-09-23 21:32:17',NULL,'2026-09-23 21:32:17','2026-09-23 21:32:37'),(130,1,'#0130',5,NULL,NULL,NULL,1,'Anónimo',NULL,NULL,NULL,NULL,NULL,'llevar',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'\"[{\\\"id\\\":10,\\\"nombre\\\":\\\"Brownie Chocolate\\\",\\\"cantidad\\\":1,\\\"precio\\\":9.5,\\\"subtotal\\\":9.5}]\"',8.05,1.45,9.50,1,NULL,1,'pagado',NULL,NULL,'2026-09-23 21:32:42',NULL,'2026-09-23 21:32:42','2026-09-23 21:32:42'),(131,1,'#0131',6,NULL,NULL,NULL,1,'Anónimo',NULL,NULL,NULL,NULL,NULL,'llevar',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'\"[{\\\"id\\\":7,\\\"nombre\\\":\\\"Frappe frutales\\\",\\\"cantidad\\\":1,\\\"precio\\\":13,\\\"subtotal\\\":13},{\\\"id\\\":12,\\\"nombre\\\":\\\"Jugo de Naranja\\\",\\\"cantidad\\\":1,\\\"precio\\\":9,\\\"subtotal\\\":9}]\"',18.64,3.36,22.00,1,NULL,0,'cancelado',NULL,NULL,'2026-09-23 21:42:08',NULL,'2026-09-23 21:42:08','2026-09-23 21:51:18'),(132,1,'#0132',7,NULL,NULL,NULL,1,'Anónimo','03','41531321','fio',NULL,NULL,'llevar','tarjeta','aceptado','20000000001-03-B001-6','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-6','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-6','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-6','La Boleta numero B001-6, ha sido aceptada',NULL,'\"[{\\\"id\\\":10,\\\"nombre\\\":\\\"Brownie Chocolate\\\",\\\"cantidad\\\":1,\\\"precio\\\":9.5,\\\"subtotal\\\":9.5},{\\\"id\\\":12,\\\"nombre\\\":\\\"Jugo de Naranja\\\",\\\"cantidad\\\":1,\\\"precio\\\":9,\\\"subtotal\\\":9}]\"',15.68,2.82,18.50,1,NULL,1,'pagado',NULL,NULL,'2026-09-23 21:55:10',NULL,'2026-09-23 21:55:10','2026-09-23 21:55:25'),(133,1,'#0133',NULL,4,NULL,NULL,1,'Anónimo','03','75423544','juan',NULL,NULL,'mesa','efectivo','aceptado','20000000001-03-B001-8','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-8','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-8','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-8','La Boleta numero B001-8, ha sido aceptada',NULL,'[{\"id\": 8, \"nombre\": \"Waffles con Fruta\", \"precio\": 19, \"cantidad\": 1, \"subtotal\": 19, \"categoria\": \"Comida\"}]',16.10,2.90,19.00,1,NULL,0,'pagado','cocina',NULL,'2026-09-24 14:18:30','2026-09-24 14:19:27','2026-09-24 14:18:30','2026-09-24 14:23:16'),(134,1,'#0134',NULL,4,NULL,NULL,1,'Anónimo','03','75423544','juan',NULL,NULL,'mesa','efectivo','aceptado','20000000001-03-B001-8','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-8','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-8','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-8','La Boleta numero B001-8, ha sido aceptada',NULL,'[{\"id\": 11, \"nombre\": \"Tiramisu\", \"precio\": 14, \"cantidad\": 1, \"subtotal\": 14, \"categoria\": \"Postres\"}]',11.86,2.14,14.00,1,NULL,0,'pagado','postres',NULL,'2026-09-24 14:18:30','2026-09-24 14:19:33','2026-09-24 14:18:30','2026-09-24 14:23:16'),(135,1,'#0135',8,NULL,NULL,NULL,1,'Anónimo',NULL,NULL,NULL,NULL,NULL,'llevar',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'\"[{\\\"id\\\":2,\\\"nombre\\\":\\\"Cappuccino Clasico\\\",\\\"cantidad\\\":1,\\\"precio\\\":10,\\\"subtotal\\\":10},{\\\"id\\\":3,\\\"nombre\\\":\\\"Latte Vainilla\\\",\\\"cantidad\\\":1,\\\"precio\\\":12,\\\"subtotal\\\":12}]\"',18.64,3.36,22.00,1,NULL,0,'cancelado',NULL,NULL,'2026-09-24 14:28:00',NULL,'2026-09-24 14:28:00','2026-09-24 14:28:16'),(136,1,'#0136',9,NULL,NULL,NULL,1,'Anónimo','03','45698732','juan',NULL,NULL,'llevar','tarjeta','aceptado','20000000001-03-B001-9','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-9','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-9','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-9','La Boleta numero B001-9, ha sido aceptada',NULL,'\"[{\\\"id\\\":5,\\\"nombre\\\":\\\"Croissant Mantequilla\\\",\\\"cantidad\\\":1,\\\"precio\\\":8,\\\"subtotal\\\":8},{\\\"id\\\":6,\\\"nombre\\\":\\\"Sandwich de Pollo\\\",\\\"cantidad\\\":1,\\\"precio\\\":18,\\\"subtotal\\\":18}]\"',22.03,3.97,26.00,1,NULL,1,'pagado',NULL,NULL,'2026-09-24 14:29:08',NULL,'2026-09-24 14:29:08','2026-09-24 14:29:25'),(137,1,'#0137',NULL,7,NULL,NULL,1,'Anónimo','03','75423544','fio',NULL,NULL,'mesa','yape','aceptado','20000000001-03-B001-10','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-10','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-10','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-10','La Boleta numero B001-10, ha sido aceptada',NULL,'[{\"id\": 10, \"nombre\": \"Brownie Chocolate\", \"precio\": 9.5, \"cantidad\": 1, \"subtotal\": 9.5, \"categoria\": \"Postres\"}]',8.05,1.45,9.50,1,'mesa-7-20260924094951',0,'pagado','postres',NULL,'2026-09-24 14:48:18','2026-09-24 14:49:07','2026-09-24 14:48:18','2026-09-24 14:49:51'),(138,1,'#0138',NULL,7,NULL,NULL,1,'Anónimo','03','75423544','fio',NULL,NULL,'mesa','yape','aceptado','20000000001-03-B001-10','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-10','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-10','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-10','La Boleta numero B001-10, ha sido aceptada',NULL,'[{\"id\": 14, \"nombre\": \"Tostadas gourmet\", \"precio\": 12, \"cantidad\": 1, \"subtotal\": 12, \"categoria\": \"Desayunos\"}]',10.17,1.83,12.00,1,'mesa-7-20260924094951',0,'pagado','cocina',NULL,'2026-09-24 14:48:18','2026-09-24 14:49:12','2026-09-24 14:48:18','2026-09-24 14:49:51'),(139,1,'#0139',10,NULL,NULL,NULL,1,'Anónimo','03','75423544','kjbgvkdjfv',NULL,NULL,'llevar','tarjeta','aceptado','20000000001-03-B001-11','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-11','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-11','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-11','La Boleta numero B001-11, ha sido aceptada',NULL,'\"[{\\\"id\\\":4,\\\"nombre\\\":\\\"Frappuccino Mocha\\\",\\\"cantidad\\\":1,\\\"precio\\\":15,\\\"subtotal\\\":15},{\\\"id\\\":5,\\\"nombre\\\":\\\"Croissant Mantequilla\\\",\\\"cantidad\\\":1,\\\"precio\\\":8,\\\"subtotal\\\":8}]\"',19.49,3.51,23.00,1,'caja-20260924100647-6ab53c871331d',1,'pagado',NULL,NULL,'2026-09-24 15:06:18',NULL,'2026-09-24 15:06:18','2026-09-24 15:06:47'),(140,1,'#0140',11,NULL,NULL,NULL,1,'Anónimo','03','75423544','uigbkjbk',NULL,NULL,'llevar','yape','aceptado','20000000001-03-B001-12','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-12','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-12','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-12','La Boleta numero B001-12, ha sido aceptada',NULL,'\"[{\\\"id\\\":11,\\\"nombre\\\":\\\"Tiramisu\\\",\\\"cantidad\\\":1,\\\"precio\\\":14,\\\"subtotal\\\":14},{\\\"id\\\":9,\\\"nombre\\\":\\\"Cheesecake de Fresa\\\",\\\"cantidad\\\":1,\\\"precio\\\":13,\\\"subtotal\\\":13}]\"',22.88,4.12,27.00,1,'caja-20260924100724-6ab53cac665ce',1,'pagado',NULL,NULL,'2026-09-24 15:07:07',NULL,'2026-09-24 15:07:07','2026-09-24 15:07:24'),(141,1,'#0141',12,NULL,NULL,NULL,1,'Anónimo','01','78945612325','12345678',NULL,NULL,'llevar','tarjeta','aceptado','20000000001-01-F001-3','http://127.0.0.1:8000/facturacion/pdf/20000000001-01-F001-3','http://127.0.0.1:8000/facturacion/xml/20000000001-01-F001-3','http://127.0.0.1:8000/facturacion/cdr/20000000001-01-F001-3','La Factura numero F001-3, ha sido aceptada',NULL,'\"[{\\\"id\\\":7,\\\"nombre\\\":\\\"Frappe frutales\\\",\\\"cantidad\\\":1,\\\"precio\\\":13,\\\"subtotal\\\":13},{\\\"id\\\":8,\\\"nombre\\\":\\\"Waffles con Fruta\\\",\\\"cantidad\\\":1,\\\"precio\\\":19,\\\"subtotal\\\":19}]\"',27.12,4.88,32.00,1,'caja-20260924105937-6ab548e9043f9',1,'pagado',NULL,NULL,'2026-09-24 15:59:10',NULL,'2026-09-24 15:59:10','2026-09-24 15:59:37'),(142,1,'#0142',13,NULL,NULL,NULL,1,'Anónimo','03','75423544','fio',NULL,NULL,'llevar','yape','aceptado','20000000001-03-B001-13','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-13','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-13','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-13','La Boleta numero B001-13, ha sido aceptada',NULL,'\"[{\\\"id\\\":13,\\\"nombre\\\":\\\"Galletas artesanales\\\",\\\"cantidad\\\":1,\\\"precio\\\":8,\\\"subtotal\\\":8},{\\\"id\\\":14,\\\"nombre\\\":\\\"Tostadas gourmet\\\",\\\"cantidad\\\":1,\\\"precio\\\":12,\\\"subtotal\\\":12}]\"',16.95,3.05,20.00,1,'caja-20260924110053-6ab54935836c4',1,'pagado',NULL,NULL,'2026-09-24 16:00:32',NULL,'2026-09-24 16:00:32','2026-09-24 16:00:53'),(143,1,'#0143',14,NULL,NULL,NULL,1,'Anónimo','01','12345567895','vklsnvklms',NULL,NULL,'llevar','tarjeta','aceptado','20000000001-01-F001-4','http://127.0.0.1:8000/facturacion/pdf/20000000001-01-F001-4','http://127.0.0.1:8000/facturacion/xml/20000000001-01-F001-4','http://127.0.0.1:8000/facturacion/cdr/20000000001-01-F001-4','La Factura numero F001-4, ha sido aceptada',NULL,'\"[{\\\"id\\\":7,\\\"nombre\\\":\\\"Frappe frutales\\\",\\\"cantidad\\\":1,\\\"precio\\\":13,\\\"subtotal\\\":13}]\"',11.02,1.98,13.00,1,'caja-20260924110934-6ab54b3e83185',1,'pagado',NULL,NULL,'2026-09-24 16:09:11',NULL,'2026-09-24 16:09:11','2026-09-24 16:09:34'),(144,1,'#0144',15,NULL,NULL,NULL,1,'Anónimo','01','78945612345','JVKLDFNGVLNFSÑ',NULL,NULL,'llevar','yape','aceptado','20000000001-01-F001-5','http://127.0.0.1:8000/facturacion/pdf/20000000001-01-F001-5','http://127.0.0.1:8000/facturacion/xml/20000000001-01-F001-5','http://127.0.0.1:8000/facturacion/cdr/20000000001-01-F001-5','La Factura numero F001-5, ha sido aceptada',NULL,'\"[{\\\"id\\\":11,\\\"nombre\\\":\\\"Tiramisu\\\",\\\"cantidad\\\":1,\\\"precio\\\":14,\\\"subtotal\\\":14},{\\\"id\\\":8,\\\"nombre\\\":\\\"Waffles con Fruta\\\",\\\"cantidad\\\":1,\\\"precio\\\":19,\\\"subtotal\\\":19},{\\\"id\\\":2,\\\"nombre\\\":\\\"Cappuccino Clasico\\\",\\\"cantidad\\\":2,\\\"precio\\\":10,\\\"subtotal\\\":20}]\"',44.92,8.08,53.00,1,'caja-20260924111016-6ab54b68932ff',1,'pagado',NULL,NULL,'2026-09-24 16:09:58',NULL,'2026-09-24 16:09:58','2026-09-24 16:10:16'),(145,1,'#0145',16,NULL,NULL,NULL,1,'Anónimo','03','75423544','fio',NULL,NULL,'llevar','efectivo','aceptado','20000000001-03-B001-14','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-14','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-14','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-14','La Boleta numero B001-14, ha sido aceptada',NULL,'\"[{\\\"id\\\":10,\\\"nombre\\\":\\\"Brownie Chocolate\\\",\\\"cantidad\\\":1,\\\"precio\\\":9.5,\\\"subtotal\\\":9.5},{\\\"id\\\":11,\\\"nombre\\\":\\\"Tiramisu\\\",\\\"cantidad\\\":1,\\\"precio\\\":14,\\\"subtotal\\\":14},{\\\"id\\\":12,\\\"nombre\\\":\\\"Jugo de Naranja\\\",\\\"cantidad\\\":1,\\\"precio\\\":9,\\\"subtotal\\\":9}]\"',27.54,4.96,32.50,1,'caja-20260924111150-6ab54bc6a54f4',1,'pagado',NULL,NULL,'2026-09-24 16:11:27',NULL,'2026-09-24 16:11:27','2026-09-24 16:11:50'),(146,1,'#0146',17,NULL,NULL,NULL,1,'Anónimo','03','75423544','fio',NULL,NULL,'llevar','efectivo','aceptado','20000000001-03-B001-15','http://127.0.0.1:8000/facturacion/pdf/20000000001-03-B001-15','http://127.0.0.1:8000/facturacion/xml/20000000001-03-B001-15','http://127.0.0.1:8000/facturacion/cdr/20000000001-03-B001-15','La Boleta numero B001-15, ha sido aceptada',NULL,'\"[{\\\"id\\\":1,\\\"nombre\\\":\\\"Cafe Americano\\\",\\\"cantidad\\\":1,\\\"precio\\\":7.5,\\\"subtotal\\\":7.5},{\\\"id\\\":2,\\\"nombre\\\":\\\"Cappuccino Clasico\\\",\\\"cantidad\\\":1,\\\"precio\\\":10,\\\"subtotal\\\":10},{\\\"id\\\":3,\\\"nombre\\\":\\\"Latte Vainilla\\\",\\\"cantidad\\\":1,\\\"precio\\\":12,\\\"subtotal\\\":12}]\"',25.00,4.50,29.50,1,'caja-20260924113726-6ab551c6135a6',1,'pagado',NULL,NULL,'2026-09-24 16:37:07',NULL,'2026-09-24 16:37:07','2026-09-24 16:37:26'),(147,1,'#0147',18,NULL,NULL,NULL,1,'Anónimo','01','12345678985','cdacdsc',NULL,NULL,'llevar','tarjeta','aceptado','20000000001-01-F001-6','http://127.0.0.1:8000/facturacion/pdf/20000000001-01-F001-6','http://127.0.0.1:8000/facturacion/xml/20000000001-01-F001-6','http://127.0.0.1:8000/facturacion/cdr/20000000001-01-F001-6','La Factura numero F001-6, ha sido aceptada',NULL,'\"[{\\\"id\\\":13,\\\"nombre\\\":\\\"Galletas artesanales\\\",\\\"cantidad\\\":1,\\\"precio\\\":8,\\\"subtotal\\\":8},{\\\"id\\\":10,\\\"nombre\\\":\\\"Brownie Chocolate\\\",\\\"cantidad\\\":1,\\\"precio\\\":9.5,\\\"subtotal\\\":9.5},{\\\"id\\\":15,\\\"nombre\\\":\\\"frape de oreo\\\",\\\"cantidad\\\":1,\\\"precio\\\":12,\\\"subtotal\\\":12}]\"',25.00,4.50,29.50,1,'caja-20260924114135-6ab552bf29ebd',1,'pagado',NULL,NULL,'2026-09-24 16:41:07',NULL,'2026-09-24 16:41:07','2026-09-24 16:41:35'),(148,1,'#0148',NULL,8,NULL,NULL,1,'Anónimo',NULL,NULL,NULL,NULL,NULL,'mesa','efectivo',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[{\"id\": 13, \"nombre\": \"Galletas artesanales\", \"precio\": 8, \"cantidad\": 1, \"subtotal\": 8, \"categoria\": \"Postres\"}]',6.78,1.22,8.00,1,'mesa-8-20260924114823',0,'pagado','postres',NULL,'2026-09-24 16:46:34','2026-09-24 16:47:47','2026-09-24 16:46:34','2026-09-24 16:48:23'),(149,1,'#0149',NULL,8,NULL,NULL,1,'Anónimo',NULL,NULL,NULL,NULL,NULL,'mesa','efectivo',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[{\"id\": 10, \"nombre\": \"Brownie Chocolate\", \"precio\": 9.5, \"cantidad\": 1, \"subtotal\": 9.5, \"categoria\": \"Postres\"}]',8.05,1.45,9.50,1,'mesa-8-20260924114823',0,'pagado','postres',NULL,'2026-09-24 16:46:34','2026-09-24 16:47:51','2026-09-24 16:46:34','2026-09-24 16:48:23'),(150,1,'#0150',19,NULL,NULL,NULL,1,'Anónimo',NULL,NULL,NULL,NULL,NULL,'llevar',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'\"[{\\\"id\\\":13,\\\"nombre\\\":\\\"Galletas artesanales\\\",\\\"cantidad\\\":1,\\\"precio\\\":8,\\\"subtotal\\\":8},{\\\"id\\\":10,\\\"nombre\\\":\\\"Brownie Chocolate\\\",\\\"cantidad\\\":1,\\\"precio\\\":9.5,\\\"subtotal\\\":9.5}]\"',14.83,2.67,17.50,1,NULL,0,'cancelado',NULL,NULL,'2026-09-24 16:58:21',NULL,'2026-09-24 16:58:21','2026-09-24 16:58:34'),(151,1,'#0151',20,NULL,NULL,NULL,1,'Anónimo','01','78945612335','gkgbhkijhnl',NULL,NULL,'llevar','yape','aceptado','20000000001-01-F001-7','http://127.0.0.1:8000/facturacion/pdf/20000000001-01-F001-7','http://127.0.0.1:8000/facturacion/xml/20000000001-01-F001-7','http://127.0.0.1:8000/facturacion/cdr/20000000001-01-F001-7','La Factura numero F001-7, ha sido aceptada',NULL,'\"[{\\\"id\\\":14,\\\"nombre\\\":\\\"Tostadas gourmet\\\",\\\"cantidad\\\":1,\\\"precio\\\":12,\\\"subtotal\\\":12},{\\\"id\\\":12,\\\"nombre\\\":\\\"Jugo de Naranja\\\",\\\"cantidad\\\":1,\\\"precio\\\":9,\\\"subtotal\\\":9}]\"',17.80,3.20,21.00,1,'caja-20260924115901-6ab556d545d5a',1,'pagado',NULL,NULL,'2026-09-24 16:58:38',NULL,'2026-09-24 16:58:38','2026-09-24 16:59:01');
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'crear pedidos','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(2,'modificar pedidos','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(3,'asignar mesas','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(4,'cambiar mesas','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(5,'dividir cuentas','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(6,'imprimir precuenta','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(7,'procesar pagos','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(8,'apertura caja','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(9,'cierre caja','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(10,'aplicar descuentos','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(11,'reimprimir tickets','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(12,'visualizar comandas','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(13,'marcar pedido listo','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(14,'alertar falta insumos','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(15,'autorizar cancelaciones','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(16,'modificar precios emergencia','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(17,'visualizar reportes diarios','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(18,'reabrir mesas','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(19,'gestionar mesas','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(20,'gestion inventarios','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(21,'configuracion sistema','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(22,'reportes financieros','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(23,'ver mesas','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(24,'ver ventas','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(25,'ver caja','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(26,'ver contador','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(27,'ver reportes','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(28,'ver platos','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(29,'ver covers','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(30,'ver produccion','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(31,'ver cocina','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(32,'ver bar','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(33,'ver cardex','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(34,'ver mermas','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(35,'ver clientes','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(36,'ver delivery','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(37,'ver configuracion','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(38,'ver insumos','web','2026-07-24 01:57:22','2026-07-24 01:57:22');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platos`
--

DROP TABLE IF EXISTS `platos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `platos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned DEFAULT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `precio` decimal(8,2) NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `vendidos` int NOT NULL DEFAULT '0',
  `imagen` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disponible` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `platos_team_id_index` (`team_id`),
  CONSTRAINT `platos_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platos`
--

LOCK TABLES `platos` WRITE;
/*!40000 ALTER TABLE `platos` DISABLE KEYS */;
INSERT INTO `platos` VALUES (1,1,'Cafe Americano','Bebidas','Cafe negro intenso para servicio rapido.',7.50,51,35,'/img/productos/cafe_americano.png',1,'2026-07-24 01:57:24','2026-09-24 16:37:07'),(2,1,'Cappuccino Clasico','Bebidas','Espresso con leche vaporizada y espuma.',10.00,32,52,'/storage/platos/96298fa3-7f0f-4043-b85b-8f31cc6cd501.webp',1,'2026-07-24 01:57:24','2026-09-24 16:37:07'),(3,1,'Latte Vainilla','Bebidas','Latte suave con jarabe de vainilla.',12.00,33,28,'/img/productos/latte.jpg',1,'2026-07-24 01:57:24','2026-09-24 16:37:07'),(4,1,'Frappuccino Mocha','Bebidas','Bebida fria con cafe, chocolate y crema.',15.00,24,18,'/img/productos/mocha.png',1,'2026-07-24 01:57:24','2026-09-24 15:06:18'),(5,1,'Croissant Mantequilla','Panaderia','Croissant hojaldrado recien horneado.',8.00,26,44,'/img/productos/Croissant.png',1,'2026-07-24 01:57:24','2026-09-24 15:06:18'),(6,1,'Sandwich de Pollo','Comida','Pan artesanal, pollo, lechuga y salsa de casa.',18.00,17,31,'/img/productos/SandwichDePollo.png',1,'2026-07-24 01:57:24','2026-09-24 14:29:08'),(7,1,'Frappe frutales','Comida',NULL,13.00,9,21,'/storage/platos/95b088e4-9ca3-470f-8ce4-37c0368c3cb4.webp',1,'2026-07-24 01:57:24','2026-09-24 16:09:11'),(8,1,'Waffles con Fruta','Comida','Waffles con miel, fresas y platano.',19.00,4,16,'/storage/platos/8e6bd3e2-de00-4a01-a5e3-a6fda6a44624.webp',1,'2026-07-24 01:57:24','2026-09-24 16:09:58'),(9,1,'Cheesecake de Fresa','Postres','Porcion de cheesecake con salsa de fresa.',13.00,14,37,'/img/productos/Cheesecake.png',1,'2026-07-24 01:57:24','2026-09-24 15:07:08'),(10,1,'Brownie Chocolate','Postres','Brownie humedo con chocolate bitter.',9.50,17,49,'/storage/platos/ef54346c-9434-4e97-a0f9-38dc9f4d1495.webp',1,'2026-07-24 01:57:24','2026-09-24 16:58:34'),(11,1,'Tiramisu','Postres','Postre frio con cafe y mascarpone.',14.00,2,14,'/storage/platos/2331aa32-e358-45bc-b0f7-730fed9eca5c.webp',1,'2026-07-24 01:57:24','2026-09-24 16:11:27'),(12,1,'Jugo de Naranja','Bebidas','Jugo natural recien exprimido.',9.00,26,20,'/storage/platos/ec498576-747d-4929-8e47-ebb4f6181595.webp',1,'2026-07-24 01:57:24','2026-09-24 16:58:38'),(13,1,'Galletas artesanales','Postres','Ofrecer galletas únicas y personalizadas, como con chispas de chocolate o avena, da un toque casero y exclusivo al menú',8.00,6,0,'/storage/platos/f85b35d4-b0c4-43a5-9020-061fb0d1b199.webp',1,'2026-09-23 16:07:09','2026-09-24 16:58:34'),(14,1,'Tostadas gourmet','Desayunos','Una tendencia creciente en cafeterías incluye tostadas con aguacate, tomate y huevo, o versiones más atrevidas',12.00,3,0,'/storage/platos/85b091c3-d6f9-4ca2-8b4c-b7c0c9b06bfc.webp',1,'2026-09-23 16:09:57','2026-09-24 16:58:38'),(15,1,'frape de oreo','Bebidas',NULL,12.00,8,0,'/storage/platos/44e5ac4f-fe43-4df3-ae30-13e4a030818c.webp',1,'2026-09-23 16:14:16','2026-09-24 16:41:07');
/*!40000 ALTER TABLE `platos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recetas`
--

DROP TABLE IF EXISTS `recetas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recetas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned NOT NULL,
  `plato_id` bigint unsigned NOT NULL,
  `insumo_id` bigint unsigned NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `recetas_plato_id_insumo_id_unique` (`plato_id`,`insumo_id`),
  KEY `recetas_team_id_foreign` (`team_id`),
  KEY `recetas_insumo_id_foreign` (`insumo_id`),
  CONSTRAINT `recetas_insumo_id_foreign` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recetas_plato_id_foreign` FOREIGN KEY (`plato_id`) REFERENCES `platos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recetas_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recetas`
--

LOCK TABLES `recetas` WRITE;
/*!40000 ALTER TABLE `recetas` DISABLE KEYS */;
/*!40000 ALTER TABLE `recetas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_has_permissions`
--

DROP TABLE IF EXISTS `role_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`),
  CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_has_permissions`
--

LOCK TABLES `role_has_permissions` WRITE;
/*!40000 ALTER TABLE `role_has_permissions` DISABLE KEYS */;
INSERT INTO `role_has_permissions` VALUES (1,1),(2,1),(3,1),(4,1),(5,1),(6,1),(7,1),(23,1),(24,1),(29,1),(7,2),(8,2),(9,2),(10,2),(11,2),(23,2),(24,2),(25,2),(26,2),(12,3),(13,3),(14,3),(30,3),(31,3),(38,3),(12,4),(13,4),(14,4),(30,4),(32,4),(38,4),(15,5),(16,5),(17,5),(18,5),(19,5),(23,5),(24,5),(25,5),(26,5),(27,5),(28,5),(29,5),(30,5),(31,5),(32,5),(33,5),(34,5),(35,5),(36,5),(38,5),(1,6),(2,6),(3,6),(4,6),(5,6),(6,6),(7,6),(8,6),(9,6),(10,6),(11,6),(12,6),(13,6),(14,6),(15,6),(16,6),(17,6),(18,6),(19,6),(20,6),(21,6),(22,6),(23,6),(24,6),(25,6),(26,6),(27,6),(28,6),(29,6),(30,6),(31,6),(32,6),(33,6),(34,6),(35,6),(36,6),(37,6),(38,6);
/*!40000 ALTER TABLE `role_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_team_id_name_guard_name_unique` (`team_id`,`name`,`guard_name`),
  KEY `roles_team_foreign_key_index` (`team_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,1,'Mesero','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(2,1,'Cajero','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(3,1,'Cocinero','web','2026-07-24 01:57:22','2026-07-24 01:57:22'),(4,1,'Bar','web','2026-07-24 01:57:23','2026-07-24 01:57:23'),(5,1,'Supervisor','web','2026-07-24 01:57:23','2026-07-24 01:57:23'),(6,1,'Gerente','web','2026-07-24 01:57:23','2026-07-24 01:57:23');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('u2nsBMh5KTRzLVd3C5TTnERBvl2slY0xm1Fgs6h5',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','eyJfdG9rZW4iOiJrMEY5bVlReUF4VEUyMzV0b2JxR1pjcTVmb21rRllmdzduS0hnZzN0IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwXC92ZW50YXM/bWVzYT0wOCIsInJvdXRlIjoidmVudGFzIn0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfSwibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiOjF9',1790269704);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_invitations`
--

DROP TABLE IF EXISTS `team_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_invitations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_id` bigint unsigned NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invited_by` bigint unsigned NOT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `team_invitations_code_unique` (`code`),
  KEY `team_invitations_team_id_foreign` (`team_id`),
  KEY `team_invitations_invited_by_foreign` (`invited_by`),
  CONSTRAINT `team_invitations_invited_by_foreign` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_invitations_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_invitations`
--

LOCK TABLES `team_invitations` WRITE;
/*!40000 ALTER TABLE `team_invitations` DISABLE KEYS */;
/*!40000 ALTER TABLE `team_invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_members`
--

DROP TABLE IF EXISTS `team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `team_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `team_members_team_id_user_id_unique` (`team_id`,`user_id`),
  KEY `team_members_user_id_foreign` (`user_id`),
  CONSTRAINT `team_members_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_members_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_members`
--

LOCK TABLES `team_members` WRITE;
/*!40000 ALTER TABLE `team_members` DISABLE KEYS */;
INSERT INTO `team_members` VALUES (1,1,1,'owner','2026-07-24 01:57:23','2026-07-24 01:57:23'),(2,1,2,'member','2026-07-24 01:57:23','2026-07-24 01:57:23'),(3,1,3,'member','2026-07-24 01:57:23','2026-07-24 01:57:23'),(4,1,4,'member','2026-07-24 01:57:23','2026-07-24 01:57:23'),(5,1,5,'member','2026-07-24 01:57:24','2026-07-24 01:57:24'),(6,1,6,'member','2026-07-24 01:57:24','2026-07-24 01:57:24'),(7,1,7,'member','2026-07-24 01:57:24','2026-07-24 01:57:24'),(8,1,8,'member','2026-07-24 01:57:24','2026-07-24 01:57:24');
/*!40000 ALTER TABLE `team_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_personal` tinyint(1) NOT NULL DEFAULT '0',
  `clientes_min_compras` int unsigned NOT NULL DEFAULT '6',
  `hora_apertura` time NOT NULL DEFAULT '07:00:00',
  `hora_cierre` time NOT NULL DEFAULT '23:00:00',
  `zona_horaria` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'America/Lima',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teams_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (1,'Sede Principal','sede-principal',0,6,'07:00:00','23:00:00','America/Lima','2026-07-24 01:57:22','2026-07-24 01:57:22',NULL);
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `usuario` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dni` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nro_hijos` int DEFAULT NULL,
  `afiliado` enum('ONP','AFP') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asegurado` enum('ESSALUD','SIS') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modalidad_trabajo` enum('part_time','full_time','online') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `retencion` decimal(10,2) DEFAULT NULL,
  `ingreso_panilla` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `fecha_cese` date DEFAULT NULL,
  `modalidad_pago` enum('semanal','quincenal','mensual') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salario` decimal(10,2) DEFAULT NULL,
  `foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '0',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pin` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_team_id` bigint unsigned DEFAULT NULL,
  `two_factor_secret` text COLLATE utf8mb4_unicode_ci,
  `two_factor_recovery_codes` text COLLATE utf8mb4_unicode_ci,
  `two_factor_confirmed_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_usuario_unique` (`usuario`),
  UNIQUE KEY `users_dni_unique` (`dni`),
  UNIQUE KEY `users_pin_unique` (`pin`),
  KEY `users_current_team_id_foreign` (`current_team_id`),
  CONSTRAINT `users_current_team_id_foreign` FOREIGN KEY (`current_team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Administrador','admin@cafeteria.test',NULL,'admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'$2y$12$36MeWb/AY2JNt3HZTP9NhunrXsFTDXHzHylksCMyJjjDav29tNGrO','0000',1,NULL,NULL,NULL,NULL,'2026-07-24 01:57:23','2026-07-24 01:57:23',1,NULL),(2,'Mesero Demo','mesero@cafeteria.test',NULL,'mesero',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'$2y$12$20vhp9PKSdbnMhpR7dz2vOgXXrkt3UNarnyMLOQSmX561LuQV5J4C','1234',1,NULL,NULL,NULL,NULL,'2026-07-24 01:57:23','2026-07-24 01:57:23',1,NULL),(3,'Ana Torres','ana.mesera@cafeteria.test',NULL,'mesera.ana',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'$2y$12$oA7LANnce7gjcNfY3ygleey75VGZxE/7ge70CLs/8gbURDCsiTIaq','1235',1,NULL,NULL,NULL,NULL,'2026-07-24 01:57:23','2026-07-24 01:57:23',1,NULL),(4,'Carlos Ruiz','carlos.mesero@cafeteria.test',NULL,'mesero.carlos',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'$2y$12$MZ6ojiW7gOps47jUKIZBYeQHcgwWqSs6jRGGiuTPY082NXeZ4eknS','1236',1,NULL,NULL,NULL,NULL,'2026-07-24 01:57:23','2026-07-24 01:57:23',1,NULL),(5,'Luis Perez','luis.mesero@cafeteria.test',NULL,'mesero.luis',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'$2y$12$TwbC.1bJkgrnJaZh8GNrc.t3BS3gClwN3YqsbVAr9vPEeA5PYfZ62','1237',1,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-07-24 01:57:24',1,NULL),(6,'Cajero Demo','cajero@cafeteria.test',NULL,'cajero',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'$2y$12$bnAsvSWlveu0nVCS6SR31OOpGCx1ntvSDsoamEkn84glLVVczFAES','5678',1,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-07-24 01:57:24',1,NULL),(7,'Cocinero Demo','cocinero@cafeteria.test',NULL,'cocinero',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'$2y$12$DmJ7T4t5hVv4wL5dV2D.tOWB3uQMg5bX/bzX2b/m3olsQAnc24WGm','9012',1,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-07-24 01:57:24',1,NULL),(8,'Bar Demo','bar@cafeteria.test',NULL,'bar',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'$2y$12$6RhKukMdWplqpyy3SlE83eB/v/nzqEYDD49Uo7.XhGe7dW6UWkrTi','3456',1,NULL,NULL,NULL,NULL,'2026-07-24 01:57:24','2026-07-24 01:57:24',1,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-25  9:31:11
