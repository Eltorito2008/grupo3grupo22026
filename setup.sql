-- =============================================
-- INSTALACIÓN RÁPIDA DE LA BASE DE DATOS
-- =============================================

-- 1. Verificar conexión
SELECT 'Conectado a MySQL' AS status, VERSION() AS version;

-- 2. Crear y seleccionar base de datos
DROP DATABASE IF EXISTS taskvibe_retro;
CREATE DATABASE taskvibe_retro;
USE taskvibe_retro;

-- 3. Crear tablas (ejecutar el script completo de arriba)
SOURCE database.sql;

-- 4. Verificar instalación
SHOW TABLES;
SELECT * FROM v_task_stats;

-- 5. Probar conexión de usuario
-- CREATE USER IF NOT EXISTS 'task_user'@'localhost' IDENTIFIED BY 'retro123';
-- GRANT ALL PRIVILEGES ON taskvibe_retro.* TO 'task_user'@'localhost';
-- FLUSH PRIVILEGES;

SELECT '✅ Instalación completada exitosamente' AS message;