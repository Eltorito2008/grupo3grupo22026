DOCUMENTACIÓN - GESTOR DE TAREAS POR MATERIAS

1. Descripción General
2. Instalación y Uso
3. Estructura del Proyecto
4. Estructuras de Datos
5. Sistema de Tareas
6. Sistema de Búsqueda
7. Almacenamiento
8. Funciones JavaScript
9. Flujo de datos

1 DESCRIPCIÓN GENERAL

Aplicación web sin dependencias externas para gestionar tareas organizadas por materias académicas. Incluye buscador con animación, panel lateral de materias y personalización de fondo mediante un botón flotante que abre un modal.

Tecnologías: HTML, CSS, JavaScript |
Almacenamiento: localStorage + sessionStorage
Navegadores: Chrome, Firefox, Safari, Edge


 2.  INSTALACIÓN Y USO

1. Guarda los 3 archivos en la misma carpeta:
   - index.html
   - styles.css
   - app.js
2. Abre index.html en cualquier navegador
3. No requiere servidor ni instalación



## 3.ESTRUCTURA DEL PROYECTO

proyecto/
├── index.html      → Estructura HTML + modal de personalización
├── styles.css      → Estilos, animaciones, responsive
├── app.js          → Lógica, CRUD, búsqueda, personalización
└── README.md       → Documentación

---

## 4.ESTRUCTURAS DE DATOS

### Objeto Tarea
{
  id: Number,              // Timestamp único
  texto: String,           // Contenido de la tarea
  completada: Boolean,     // true = completada
  materiaId: Number|null,  // ID de materia o null
  fechaCreacion: String    // Fecha ISO
}

Ejemplo:
{
  id: 1719000000000,
  texto: "Estudiar álgebra",
  completada: false,
  materiaId: 1003,
  fechaCreacion: "2024-06-22T10:30:00.000Z"
}

###Objeto Materia
{
  id: Number,          // Identificador único
  nombre: String,      // Nombre descriptivo
  icono: String,       // Emoji
  colorClass: String,  // Clase CSS para color
  color: String        // Código hexadecimal
}

###Materias Predefinidas
| ID   | Nombre             | Color     |
|------|--------------------|-----------|
| 1001 | Ciencias Básicas   | #e8d5b7   |
| 1002 | Ciencias Sociales  | #c9b8a8   |
| 1003 | Matemáticas        | #d4c3b3   |
| 1004 | Ciencias Naturales | #bfd8bd   |
| 1005 | Lenguaje           | #d8c8b8   |


---


## 5.SISTEMA DE TAREAS

###CRUD de Tareas

CREAR:
- Input de texto + botón "Agregar"
- Validación: no vacío, mínimo 3 caracteres
- No permite duplicados (case insensitive)
- Se asigna a la materia seleccionada

LEER:
- Lista scrollable (max-height: 400px)
- Muestra texto, checkbox, tag de materia, botón eliminar

ACTUALIZAR:
- Checkbox → cambia estado completada
- Efecto visual: tachado y opacidad reducida

ELIMINAR:
- Animación de salida (0.4s)
- Se remueve del array y localStorage

###Validaciones
-  Vacío: "La tarea no puede estar vacía"
- Muy corto: "La tarea debe tener al menos 3 caracteres"
- Duplicado: "Ya existe una tarea con ese nombre en esta materia"

---

## 6.SISTEMA DE BÚSQUEDA

### Componentes del Buscador
- Input central redondeado (max-width: 500px)
- Icono de lupa (SVG)
- Spinner circular animado
- Mensaje "Buscando tareas..."
- Panel de resultados

### Funcionamiento
1. Usuario escribe → se activa spinner
2. Efecto pulso en borde del input
3. Debounce de 500ms
4. Búsqueda case insensitive
5. Resultados en panel + lista filtrada
6. Click en resultado → scroll a la tarea

### Animaciones del Buscador
- SPINNER: Giro circular infinito (0.8s)
- PULSO: Brillo intermitente en borde (1.5s)
- ICONO: Se oculta durante búsqueda

---

## 7.SISTEMA DE ALMACENAMIENTO

###localStorage (Persistente)

| Clave                 | Tipo   | Contenido                  |
|-----------------------|--------|----------------------------|
| tareas_app            | JSON   | Array de objetos tarea     |
| materias_app          | JSON   | Array de objetos materia   |
| fondo_personalizado   | JSON   | Configuración de fondo     |

###sessionStorage (Sesión)

| Clave          | Tipo   | Contenido         |
|----------------|--------|-------------------|
| fondo_imagen   | string | Imagen en base64  |

### Notas
- Capacidad: ~5-10MB por dominio
- Imágenes en sessionStorage (se pierden al cerrar)
- Datos persistentes al recargar página

---

## 8.FUNCIONES JAVASCRIPT

### Gestión de Tareas
agregarTarea(texto)        → Crea y valida nueva tarea
toggleTarea(id)            → Cambia estado completada
eliminarTarea(id, li)      → Elimina con animación
validarTarea(texto)        → Retorna {valido, mensaje}
tareaDuplicada(texto)      → Verifica duplicados
obtenerTareasFiltradas()   → Según materia activa

###Gestión de Materias
seleccionarMateria(id)     → Filtra tareas
agregarMateria(nombre)     → Crea materia
eliminarMateria(id)        → Elimina materia
renderizarMaterias()       → Actualiza sidebar

### Búsqueda
buscarTareas(termino)      → Filtra por texto
ejecutarBusqueda(termino)  → Actualiza UI
mostrarSpinner()           → Activa carga
ocultarSpinner()           → Desactiva carga

### Personalización
aplicarFondo()             → Aplica estilo al body
guardarFondo()             → Persiste configuración
cargarFondo()              → Recupera configuración
abrirModal()               → Muestra modal
cerrarModal()              → Oculta modal
sincronizarUI()            → Actualiza controles del modal

### Utilidades
escaparHTML(texto)         → Previene XSS
mostrarError(mensaje)      → Error temporal
actualizarContadores()     → Total y pendientes
renderizarTareas(arr)      → Renderiza lista

---

## 9 FLUJO DE DATOS

Usuario → Agregar Tarea → validarTarea() → ¿Válida?
                                              ├─ Sí → tareas.unshift() → guardarTareas() → renderizarTareas()
                                              └─ No → mostrarError()

Usuario → Seleccionar Materia → materiaSeleccionada = id → renderizarTareas() → Filtrar por materiaId

Usuario → Buscar → Spinner → Debounce 500ms → buscarTareas() → ejecutarBusqueda() → Actualizar UI

Usuario → Personalizar → Botón flotante → Modal → Seleccionar/Aplicar → aplicarFondo() → guardarFondo()

---

## SEGURIDAD

- Función escaparHTML() previene inyección XSS
- Validación de longitud mínima (3 caracteres)
- Detección de duplicados case-insensitive
- Límite de tamaño en imágenes (5MB)
- Validación de tipo de archivo (solo imágenes)

---

## NOTAS ADICIONALES

- El proyecto no usa frameworks ni librerías externas
- Totalmente funcional sin conexión a internet
- Los datos persisten al cerrar el navegador
- Las imágenes de fondo se pierden al cerrar sesión
- Compatible con lectores de pantalla básicos
- Scroll suave en navegadores modernos

---

**Versión:** 1.0.0
**Última actualización:** Junio 2024
**Licencia:** Uso libre educativo/personal
