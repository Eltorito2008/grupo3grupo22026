-- =============================================
-- GESTOR DE TAREAS RETRO - BASE DE DATOS
-- =============================================

-- 1. CREAR LA BASE DE DATOS
-- =============================================
DROP DATABASE IF EXISTS taskvibe_retro;
CREATE DATABASE taskvibe_retro;
USE taskvibe_retro;

-- =============================================
-- 2. TABLA PRINCIPAL: TAREAS
-- =============================================
CREATE TABLE tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    text VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    priority ENUM('baja', 'media', 'alta') DEFAULT 'media',
    category VARCHAR(50) DEFAULT 'General',
    due_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_completed (completed),
    INDEX idx_category (category),
    INDEX idx_due_date (due_date),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. TABLA: CATEGORÍAS
-- =============================================
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#d6a16e',
    icon VARCHAR(10) DEFAULT '📁',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 4. TABLA: HISTORIAL DE CAMBIOS (Auditoría)
-- =============================================
CREATE TABLE task_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_text VARCHAR(255) NULL,
    new_text VARCHAR(255) NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 5. DATOS DE EJEMPLO (Tareas Vintage)
-- =============================================
INSERT INTO tasks (text, completed, priority, category, due_date) VALUES
(' Rebobinar cinta VHS', FALSE, 'media', 'Entretenimiento', '2026-06-05'),
(' Jugar al Tetris 15 minutos', TRUE, 'baja', 'Ocio', '2026-06-01'),
(' Añadir efecto CRT al CSS', FALSE, 'alta', 'Desarrollo', '2026-06-10'),
(' Escuchar cassette de los 80', FALSE, 'media', 'Música', '2026-06-12'),
('Arreglar joystick retro', TRUE, 'alta', 'Hardware', '2026-05-28'),
(' Calibrar monitor de tubo', FALSE, 'media', 'Hardware', '2026-06-15'),
('Grabar mix en cinta', FALSE, 'baja', 'Música', '2026-06-20'),
(' Rescatar datos de disquete', FALSE, 'alta', 'Hardware', '2026-06-08'),
(' Configurar impresora matricial', FALSE, 'media', 'Hardware', '2026-06-18'),
(' Afinar sintetizador analógico', FALSE, 'alta', 'Música', '2026-06-25');

-- =============================================
-- 6. DATOS DE CATEGORÍAS
-- =============================================
INSERT INTO categories (name, color, icon) VALUES
('General', '#d6a16e', '📌'),
('Desarrollo', '#5d8c48', '💻'),
('Hardware', '#b3412e', '🔧'),
('Música', '#4a6fa5', '🎵'),
('Ocio', '#c79a3e', '🎮'),
('Entretenimiento', '#8b6d42', '📺'),
('Trabajo', '#2c3e50', '💼'),
('Estudio', '#e67e22', '📚');

-- =============================================
-- 7. VISTAS ÚTILES
-- =============================================

-- Vista: Tareas completadas
CREATE VIEW v_completed_tasks AS
SELECT id, text, priority, category, due_date, 
       DATE_FORMAT(created_at, '%d/%m/%Y') as created_date
FROM tasks
WHERE completed = TRUE
ORDER BY updated_at DESC;

-- Vista: Tareas pendientes
CREATE VIEW v_pending_tasks AS
SELECT id, text, priority, category, due_date,
       DATEDIFF(due_date, CURDATE()) as days_left,
       CASE 
           WHEN due_date < CURDATE() THEN 'Vencida'
           WHEN due_date = CURDATE() THEN 'Hoy'
           WHEN due_date <= DATE_ADD(CURDATE(), INTERVAL 2 DAY) THEN 'Próxima'
           ELSE 'Normal'
       END as status
FROM tasks
WHERE completed = FALSE
ORDER BY 
    CASE priority 
        WHEN 'alta' THEN 1
        WHEN 'media' THEN 2
        WHEN 'baja' THEN 3
    END,
    due_date ASC;

-- Vista: Estadísticas generales
CREATE VIEW v_task_stats AS
SELECT 
    COUNT(*) AS total_tasks,
    SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) AS completed_tasks,
    SUM(CASE WHEN completed = FALSE THEN 1 ELSE 0 END) AS pending_tasks,
    ROUND(SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS completion_percentage,
    COUNT(DISTINCT category) AS total_categories,
    COUNT(DISTINCT priority) AS total_priorities
FROM tasks;

-- Vista: Tareas por prioridad
CREATE VIEW v_tasks_by_priority AS
SELECT 
    priority,
    COUNT(*) AS total,
    SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN completed = FALSE THEN 1 ELSE 0 END) AS pending,
    ROUND(SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS completion_rate
FROM tasks
GROUP BY priority
ORDER BY FIELD(priority, 'alta', 'media', 'baja');

-- Vista: Tareas por categoría
CREATE VIEW v_tasks_by_category AS
SELECT 
    c.name AS category,
    c.color,
    c.icon,
    COUNT(t.id) AS total_tasks,
    SUM(CASE WHEN t.completed THEN 1 ELSE 0 END) AS completed_tasks,
    SUM(CASE WHEN t.completed = FALSE THEN 1 ELSE 0 END) AS pending_tasks,
    ROUND(SUM(CASE WHEN t.completed THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(t.id), 0), 2) AS completion_rate
FROM categories c
LEFT JOIN tasks t ON c.name = t.category
GROUP BY c.id, c.name, c.color, c.icon
ORDER BY total_tasks DESC;

-- Vista: Actividad reciente (últimos 7 días)
CREATE VIEW v_recent_activity AS
SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS tasks_created,
    SUM(CASE WHEN completed THEN 1 ELSE 0 END) AS tasks_completed,
    COUNT(DISTINCT category) AS categories_used
FROM tasks
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =============================================
-- 8. FUNCIONES
-- =============================================

-- Función: Contar tareas por categoría
DELIMITER //
CREATE FUNCTION count_tasks_by_category(cat_name VARCHAR(50))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE task_count INT;
    SELECT COUNT(*) INTO task_count
    FROM tasks
    WHERE category = cat_name;
    RETURN task_count;
END //
DELIMITER ;

-- Función: Obtener tareas vencidas
DELIMITER //
CREATE FUNCTION get_overdue_tasks()
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE overdue_count INT;
    SELECT COUNT(*) INTO overdue_count
    FROM tasks
    WHERE due_date < CURDATE() AND completed = FALSE;
    RETURN overdue_count;
END //
DELIMITER ;

-- Función: Calcular días hasta vencimiento
DELIMITER //
CREATE FUNCTION days_until_due(task_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE days_left INT;
    SELECT DATEDIFF(due_date, CURDATE()) INTO days_left
    FROM tasks
    WHERE id = task_id;
    RETURN IFNULL(days_left, NULL);
END //
DELIMITER ;

-- =============================================
-- 9. PROCEDIMIENTOS ALMACENADOS
-- =============================================

-- Procedimiento: Agregar tarea con historial
DELIMITER //
CREATE PROCEDURE sp_add_task(
    IN p_text VARCHAR(255),
    IN p_priority VARCHAR(10),
    IN p_category VARCHAR(50),
    IN p_due_date DATE
)
BEGIN
    DECLARE new_id INT;
    
    INSERT INTO tasks (text, priority, category, due_date)
    VALUES (p_text, p_priority, p_category, p_due_date);
    
    SET new_id = LAST_INSERT_ID();
    
    INSERT INTO task_history (task_id, action, new_text)
    VALUES (new_id, 'created', p_text);
    
    SELECT new_id AS task_id, 'Tarea agregada exitosamente' AS message;
END //
DELIMITER ;

-- Procedimiento: Completar tarea
DELIMITER //
CREATE PROCEDURE sp_complete_task(IN p_task_id INT)
BEGIN
    DECLARE task_text VARCHAR(255);
    DECLARE task_exists INT;
    
    SELECT COUNT(*) INTO task_exists FROM tasks WHERE id = p_task_id;
    
    IF task_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La tarea no existe';
    END IF;
    
    SELECT text INTO task_text FROM tasks WHERE id = p_task_id;
    
    UPDATE tasks 
    SET completed = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_task_id;
    
    INSERT INTO task_history (task_id, action, old_text, new_text)
    VALUES (p_task_id, 'completed', task_text, CONCAT('✅ ', task_text));
    
    SELECT 'Tarea completada exitosamente' AS message;
END //
DELIMITER ;

-- Procedimiento: Editar tarea
DELIMITER //
CREATE PROCEDURE sp_edit_task(
    IN p_task_id INT,
    IN p_new_text VARCHAR(255),
    IN p_priority VARCHAR(10),
    IN p_category VARCHAR(50),
    IN p_due_date DATE
)
BEGIN
    DECLARE old_text VARCHAR(255);
    DECLARE task_exists INT;
    
    SELECT COUNT(*) INTO task_exists FROM tasks WHERE id = p_task_id;
    
    IF task_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La tarea no existe';
    END IF;
    
    SELECT text INTO old_text FROM tasks WHERE id = p_task_id;
    
    UPDATE tasks 
    SET 
        text = p_new_text,
        priority = p_priority,
        category = p_category,
        due_date = p_due_date,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_task_id;
    
    INSERT INTO task_history (task_id, action, old_text, new_text)
    VALUES (p_task_id, 'updated', old_text, p_new_text);
    
    SELECT 'Tarea actualizada exitosamente' AS message;
END //
DELIMITER ;

-- Procedimiento: Eliminar tarea (con historial)
DELIMITER //
CREATE PROCEDURE sp_delete_task(IN p_task_id INT)
BEGIN
    DECLARE task_text VARCHAR(255);
    DECLARE task_exists INT;
    
    SELECT COUNT(*) INTO task_exists FROM tasks WHERE id = p_task_id;
    
    IF task_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La tarea no existe';
    END IF;
    
    SELECT text INTO task_text FROM tasks WHERE id = p_task_id;
    
    INSERT INTO task_history (task_id, action, old_text)
    VALUES (p_task_id, 'deleted', task_text);
    
    DELETE FROM tasks WHERE id = p_task_id;
    
    SELECT 'Tarea eliminada exitosamente' AS message;
END //
DELIMITER ;

-- Procedimiento: Limpiar tareas completadas antiguas
DELIMITER //
CREATE PROCEDURE sp_clean_completed_tasks(IN days_old INT)
BEGIN
    DECLARE deleted_count INT DEFAULT 0;
    DECLARE task_id INT;
    DECLARE task_text VARCHAR(255);
    DECLARE done INT DEFAULT FALSE;
    DECLARE cur CURSOR FOR 
        SELECT id, text FROM tasks
        WHERE completed = TRUE 
        AND updated_at < DATE_SUB(CURDATE(), INTERVAL days_old DAY);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO task_id, task_text;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO task_history (task_id, action, old_text)
        VALUES (task_id, 'cleaned', task_text);
        
        DELETE FROM tasks WHERE id = task_id;
        SET deleted_count = deleted_count + 1;
    END LOOP;
    
    CLOSE cur;
    
    SELECT deleted_count AS tasks_deleted, 
           CONCAT('Se eliminaron ', deleted_count, ' tareas completadas antiguas') AS message;
END //
DELIMITER ;

-- Procedimiento: Obtener tareas con filtros
DELIMITER //
CREATE PROCEDURE sp_get_tasks(
    IN p_completed BOOLEAN,
    IN p_category VARCHAR(50),
    IN p_priority VARCHAR(10),
    IN p_search VARCHAR(100)
)
BEGIN
    SELECT 
        id, text, completed, priority, category, due_date,
        DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') as created_date,
        CASE 
            WHEN due_date < CURDATE() AND completed = FALSE THEN 'Vencida'
            WHEN due_date = CURDATE() AND completed = FALSE THEN 'Hoy'
            ELSE 'Normal'
        END as status
    FROM tasks
    WHERE (p_completed IS NULL OR completed = p_completed)
    AND (p_category IS NULL OR category = p_category)
    AND (p_priority IS NULL OR priority = p_priority)
    AND (p_search IS NULL OR text LIKE CONCAT('%', p_search, '%'))
    ORDER BY 
        CASE priority 
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
        END,
        due_date ASC;
END //
DELIMITER ;

-- =============================================
-- 10. TRIGGERS (Auditoría Automática)
-- =============================================

-- Trigger: Registrar cuando se completa una tarea
DELIMITER //
CREATE TRIGGER trg_task_completed
BEFORE UPDATE ON tasks
FOR EACH ROW
BEGIN
    IF OLD.completed = FALSE AND NEW.completed = TRUE THEN
        INSERT INTO task_history (task_id, action, old_text, new_text)
        VALUES (NEW.id, 'completed', OLD.text, CONCAT('✅ ', NEW.text));
    END IF;
END //
DELIMITER ;

-- Trigger: Registrar eliminación de tarea
DELIMITER //
CREATE TRIGGER trg_task_deleted
BEFORE DELETE ON tasks
FOR EACH ROW
BEGIN
    INSERT INTO task_history (task_id, action, old_text)
    VALUES (OLD.id, 'deleted', OLD.text);
END //
DELIMITER ;

-- Trigger: Registrar cambios en texto de tarea
DELIMITER //
CREATE TRIGGER trg_task_updated
BEFORE UPDATE ON tasks
FOR EACH ROW
BEGIN
    IF OLD.text != NEW.text THEN
        INSERT INTO task_history (task_id, action, old_text, new_text)
        VALUES (NEW.id, 'updated', OLD.text, NEW.text);
    END IF;
END //
DELIMITER ;

-- =============================================
-- 11. CONSULTAS ÚTILES DE EJEMPLO
-- =============================================

-- 11.1 Obtener todas las tareas pendientes
SELECT * FROM v_pending_tasks;

-- 11.2 Obtener tareas por categoría
SELECT * FROM v_tasks_by_category;

-- 11.3 Obtener estadísticas generales
SELECT * FROM v_task_stats;

-- 11.4 Obtener tareas vencidas
SELECT id, text, due_date, priority, category 
FROM tasks
WHERE due_date < CURDATE() AND completed = FALSE
ORDER BY due_date ASC;

-- 11.5 Obtener tareas de hoy
SELECT id, text, priority, category
FROM tasks
WHERE due_date = CURDATE() AND completed = FALSE;

-- 11.6 Obtener tareas de esta semana
SELECT id, text, due_date, priority, category
FROM tasks
WHERE due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
AND completed = FALSE
ORDER BY due_date ASC;

-- 11.7 Obtener top 5 categorías con más tareas
SELECT category, COUNT(*) as total
FROM tasks
GROUP BY category
ORDER BY total DESC
LIMIT 5;

-- 11.8 Obtener historial completo de una tarea
SELECT * FROM task_history 
WHERE task_id = 1 
ORDER BY changed_at DESC;

-- 11.9 Obtener progreso diario (últimos 7 días)
SELECT * FROM v_recent_activity;

-- 11.10 Obtener tareas por prioridad
SELECT * FROM v_tasks_by_priority;

-- =============================================
-- 12. USUARIOS Y PERMISOS
-- =============================================
CREATE USER IF NOT EXISTS 'task_user'@'localhost' IDENTIFIED BY 'retro123';
GRANT SELECT, INSERT, UPDATE, DELETE ON taskvibe_retro.* TO 'task_user'@'localhost';
GRANT EXECUTE ON PROCEDURE taskvibe_retro.sp_add_task TO 'task_user'@'localhost';
GRANT EXECUTE ON PROCEDURE taskvibe_retro.sp_complete_task TO 'task_user'@'localhost';
GRANT EXECUTE ON PROCEDURE taskvibe_retro.sp_edit_task TO 'task_user'@'localhost';
GRANT EXECUTE ON PROCEDURE taskvibe_retro.sp_delete_task TO 'task_user'@'localhost';
FLUSH PRIVILEGES;

-- =============================================
-- 13. EJEMPLOS DE USO DE PROCEDIMIENTOS
-- =============================================

/*
-- Agregar nueva tarea
CALL sp_add_task('🎮 Configurar emulador de SNES', 'alta', 'Ocio', '2026-06-15');

-- Completar tarea (ID 1)
CALL sp_complete_task(1);

-- Editar tarea
CALL sp_edit_task(5, '🕹️ Reparar joystick retro (completado)', 'baja', 'Hardware', '2026-06-10');

-- Eliminar tarea (ID 7)
CALL sp_delete_task(7);

-- Limpiar tareas completadas de hace más de 30 días
CALL sp_clean_completed_tasks(30);

-- Obtener tareas filtradas
CALL sp_get_tasks(NULL, 'Hardware', 'alta', 'rep');
*/

-- =============================================
-- 14. ÍNDICES ADICIONALES PARA PERFORMANCE
-- =============================================
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_completed_priority ON tasks(completed, priority);
CREATE INDEX idx_tasks_category_completed ON tasks(category, completed);
CREATE INDEX idx_history_task_action ON task_history(task_id, action);

-- =============================================
-- 15. INFORMACIÓN DEL ESQUEMA
-- =============================================
SELECT 'Base de datos creada exitosamente' AS status;
SELECT COUNT(*) AS total_tasks FROM tasks;
SELECT COUNT(*) AS total_categories FROM categories;
SELECT COUNT(*) AS total_history FROM task_history;