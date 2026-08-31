// ==========================================
// GESTOR DE TAREAS POR MATERIAS
// ==========================================

// Estado de la aplicación
const tareas = [];
const materias = [];
let materiaSeleccionada = null;
let timeoutBusqueda = null;

// Elementos del DOM
const inputTarea = document.getElementById('inputTarea');
const btnAgregar = document.getElementById('btnAgregar');
const listaTareas = document.getElementById('listaTareas');
const totalTareasEl = document.getElementById('totalTareas');
const tareasPendientesEl = document.getElementById('tareasPendientes');
const buscadorInput = document.getElementById('buscadorInput');
const buscadorWrapper = document.getElementById('buscadorWrapper');
const buscadorSpinner = document.getElementById('buscadorSpinner');
const mensajeBuscando = document.getElementById('mensajeBuscando');
const resultadosBusqueda = document.getElementById('resultadosBusqueda');
const listaResultados = document.getElementById('listaResultados');
const listaMaterias = document.getElementById('listaMaterias');
const inputMateria = document.getElementById('inputMateria');
const btnAgregarMateria = document.getElementById('btnAgregarMateria');
const tituloMateria = document.getElementById('tituloMateria');
const subtituloMateria = document.getElementById('subtituloMateria');
const btnVolver = document.getElementById('btnVolver');
const btnToggleSidebar = document.getElementById('btnToggleSidebar');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// ==========================================
// MATERIAS PREDEFINIDAS
// ==========================================

const materiasPredefinidas = [
    { id: 1001, nombre: 'Ciencias Básicas', icono: '🔬', colorClass: 'materia-basicas', color: '#e8d5b7' },
    { id: 1002, nombre: 'Ciencias Sociales', icono: '🌍', colorClass: 'materia-sociales', color: '#c9b8a8' },
    { id: 1003, nombre: 'Matemáticas', icono: '📐', colorClass: 'materia-matematica', color: '#d4c3b3' },
    { id: 1004, nombre: 'Ciencias Naturales', icono: '🧬', colorClass: 'materia-ciencias', color: '#bfd8bd' },
    { id: 1005, nombre: 'Lenguaje', icono: '📖', colorClass: 'materia-lenguaje', color: '#d8c8b8' }
];

// ==========================================
// INICIALIZACIÓN DE DATOS
// ==========================================

function inicializarMaterias() {
    const guardadas = localStorage.getItem('materias_app');
    if (guardadas) {
        try {
            const parsed = JSON.parse(guardadas);
            materias.push(...parsed);
        } catch (e) {
            materias.push(...materiasPredefinidas);
        }
    } else {
        materias.push(...materiasPredefinidas);
        guardarMaterias();
    }
}

function guardarMaterias() {
    localStorage.setItem('materias_app', JSON.stringify(materias));
}

function cargarTareas() {
    const guardadas = localStorage.getItem('tareas_app');
    if (guardadas) {
        try {
            const parsed = JSON.parse(guardadas);
            tareas.push(...parsed);
        } catch (e) {
            console.error('Error al cargar tareas:', e);
        }
    }
}

function guardarTareas() {
    localStorage.setItem('tareas_app', JSON.stringify(tareas));
}

// ==========================================
// FUNCIONES DE MATERIAS
// ==========================================

function renderizarMaterias() {
    listaMaterias.innerHTML = '';
    
    const liTodas = document.createElement('li');
    liTodas.className = `materia-item ${materiaSeleccionada === null ? 'activa' : ''}`;
    liTodas.innerHTML = `
        <div class="materia-icono materia-default">📋</div>
        <span class="materia-nombre">Todas las tareas</span>
        <span class="materia-contador">${tareas.length}</span>
    `;
    liTodas.addEventListener('click', () => seleccionarMateria(null));
    listaMaterias.appendChild(liTodas);
    
    materias.forEach(materia => {
        const li = document.createElement('li');
        li.className = `materia-item ${materiaSeleccionada === materia.id ? 'activa' : ''}`;
        
        const tareasMateria = tareas.filter(t => t.materiaId === materia.id);
        
        li.innerHTML = `
            <div class="materia-icono ${materia.colorClass || 'materia-default'}">${materia.icono || '📚'}</div>
            <span class="materia-nombre">${escaparHTML(materia.nombre)}</span>
            <span class="materia-contador">${tareasMateria.length}</span>
            <button class="btn-eliminar-materia" title="Eliminar materia">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        
        li.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-eliminar-materia')) {
                seleccionarMateria(materia.id);
            }
        });
        
        const btnEliminar = li.querySelector('.btn-eliminar-materia');
        btnEliminar.addEventListener('click', (e) => {
            e.stopPropagation();
            eliminarMateria(materia.id);
        });
        
        listaMaterias.appendChild(li);
    });
}

function seleccionarMateria(id) {
    materiaSeleccionada = id;
    
    if (id === null) {
        tituloMateria.textContent = '📋 Todas las Tareas';
        subtituloMateria.textContent = 'Selecciona una materia para filtrar';
        btnVolver.style.display = 'none';
    } else {
        const materia = materias.find(m => m.id === id);
        if (materia) {
            tituloMateria.textContent = `${materia.icono || '📚'} ${materia.nombre}`;
            subtituloMateria.textContent = 'Agrega tareas para esta materia';
            btnVolver.style.display = 'block';
        }
    }
    
    renderizarMaterias();
    
    if (buscadorInput.value.trim()) {
        ejecutarBusqueda(buscadorInput.value.trim());
    } else {
        renderizarTareas();
    }
    
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('abierto');
        sidebarOverlay.classList.remove('activo');
    }
}

function agregarMateria(nombre) {
    if (!nombre || !nombre.trim()) return;
    
    const nombreNormalizado = nombre.trim().toLowerCase();
    if (materias.some(m => m.nombre.toLowerCase() === nombreNormalizado)) {
        mostrarError('⚠️ Ya existe una materia con ese nombre');
        return;
    }
    
    const nuevaMateria = {
        id: Date.now(),
        nombre: nombre.trim(),
        icono: '📚',
        colorClass: 'materia-default',
        color: '#e0d5c5'
    };
    
    materias.push(nuevaMateria);
    guardarMaterias();
    renderizarMaterias();
    inputMateria.value = '';
}

function eliminarMateria(id) {
    if (!confirm('¿Eliminar esta materia? Las tareas asociadas NO se eliminarán, quedarán sin materia.')) return;
    
    const index = materias.findIndex(m => m.id === id);
    if (index === -1) return;
    
    tareas.forEach(t => {
        if (t.materiaId === id) t.materiaId = null;
    });
    
    materias.splice(index, 1);
    guardarMaterias();
    guardarTareas();
    
    if (materiaSeleccionada === id) {
        seleccionarMateria(null);
    } else {
        renderizarMaterias();
        renderizarTareas();
    }
}

// ==========================================
// FUNCIONES DE UI
// ==========================================

function actualizarContadores() {
    let tareasFiltradas = obtenerTareasFiltradas();
    totalTareasEl.textContent = tareasFiltradas.length;
    tareasPendientesEl.textContent = tareasFiltradas.filter(t => !t.completada).length;
}

function obtenerTareasFiltradas() {
    return materiaSeleccionada === null ? [...tareas] : tareas.filter(t => t.materiaId === materiaSeleccionada);
}

function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function mostrarError(mensaje) {
    document.querySelectorAll('.mensaje-error').forEach(el => el.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'mensaje-error';
    errorDiv.textContent = mensaje;
    
    const formTarea = document.querySelector('.form-tarea');
    formTarea.parentNode.insertBefore(errorDiv, formTarea);
    
    setTimeout(() => {
        errorDiv.style.animation = 'eliminarError 0.3s ease forwards';
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}

function renderizarTareas(tareasAMostrar = null) {
    let tareasRender = tareasAMostrar !== null ? tareasAMostrar : obtenerTareasFiltradas();
    listaTareas.innerHTML = '';

    if (tareasRender.length === 0) {
        const mensaje = materiaSeleccionada ? 'No hay tareas para esta materia. ¡Añade una!' : 'No hay tareas aún. ¡Añade una!';
        listaTareas.innerHTML = `
            <li class="sin-tareas">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <p>${mensaje}</p>
            </li>`;
        actualizarContadores();
        renderizarMaterias();
        return;
    }

    tareasRender.forEach(tarea => {
        const materia = materias.find(m => m.id === tarea.materiaId);
        const li = document.createElement('li');
        li.className = `tarea-item ${tarea.completada ? 'completada' : ''}`;
        li.setAttribute('data-id', tarea.id);

        const tagMateria = materia ? 
            `<span class="materia-tag" style="background-color: ${materia.color || '#e0d5c5'}; color: #4a3f35;">
                ${materia.icono || '📚'} ${escaparHTML(materia.nombre)}
            </span>` : '';

        li.innerHTML = `
            <input type="checkbox" class="checkbox-tarea" ${tarea.completada ? 'checked' : ''}>
            <span class="texto-tarea">${escaparHTML(tarea.texto)}</span>
            ${tagMateria}
            <button class="btn-eliminar" title="Eliminar tarea">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        `;

        const checkbox = li.querySelector('.checkbox-tarea');
        checkbox.addEventListener('change', () => toggleTarea(tarea.id));

        const btnEliminar = li.querySelector('.btn-eliminar');
        btnEliminar.addEventListener('click', () => eliminarTarea(tarea.id, li));

        listaTareas.appendChild(li);
    });

    actualizarContadores();
    renderizarMaterias();
}

function mostrarSpinner() {
    buscadorWrapper.classList.add('buscando');
    buscadorSpinner.classList.add('activo');
    mensajeBuscando.classList.add('visible');
}

function ocultarSpinner() {
    buscadorWrapper.classList.remove('buscando');
    buscadorSpinner.classList.remove('activo');
    mensajeBuscando.classList.remove('visible');
}

function ocultarResultados() {
    resultadosBusqueda.classList.remove('activo');
    listaResultados.innerHTML = '';
}

// ==========================================
// FUNCIONES CRUD DE TAREAS
// ==========================================

function tareaDuplicada(texto) {
    const textoNormalizado = texto.trim().toLowerCase();
    const tareasMateria = obtenerTareasFiltradas();
    return tareasMateria.some(tarea => tarea.texto.trim().toLowerCase() === textoNormalizado);
}

function validarTarea(texto) {
    if (!texto || !texto.trim()) return { valido: false, mensaje: '❌ La tarea no puede estar vacía' };
    if (texto.trim().length < 3) return { valido: false, mensaje: '❌ La tarea debe tener al menos 3 caracteres' };
    if (tareaDuplicada(texto)) return { valido: false, mensaje: '⚠️ Ya existe una tarea con ese nombre en esta materia' };
    return { valido: true, mensaje: '✅ Tarea válida' };
}

function agregarTarea(texto) {
    const validacion = validarTarea(texto);
    
    if (!validacion.valido) {
        mostrarError(validacion.mensaje);
        inputTarea.style.borderColor = '#d4867a';
        inputTarea.style.backgroundColor = '#fff5f5';
        setTimeout(() => {
            inputTarea.style.borderColor = '';
            inputTarea.style.backgroundColor = '';
        }, 2000);
        return;
    }

    const nuevaTarea = {
        id: Date.now(),
        texto: texto.trim(),
        completada: false,
        materiaId: materiaSeleccionada,
        fechaCreacion: new Date().toISOString()
    };

    tareas.unshift(nuevaTarea);
    guardarTareas();
    renderizarTareas();
    
    inputTarea.value = '';
    inputTarea.focus();

    if (buscadorInput.value.trim()) {
        buscadorInput.value = '';
        ocultarResultados();
    }
}

function toggleTarea(id) {
    const tarea = tareas.find(t => t.id === id);
    if (tarea) {
        tarea.completada = !tarea.completada;
        guardarTareas();
        
        if (buscadorInput.value.trim()) {
            ejecutarBusqueda(buscadorInput.value.trim());
        } else {
            renderizarTareas();
        }
    }
}

function eliminarTarea(id, elementoLi) {
    const index = tareas.findIndex(t => t.id === id);
    if (index === -1) return;

    elementoLi.classList.add('eliminando');

    setTimeout(() => {
        tareas.splice(index, 1);
        guardarTareas();
        
        if (buscadorInput.value.trim()) {
            ejecutarBusqueda(buscadorInput.value.trim());
        } else {
            renderizarTareas();
        }
    }, 350);
}

// ==========================================
// FUNCIONES DE BÚSQUEDA
// ==========================================

function buscarTareas(termino) {
    const tareasFiltradas = obtenerTareasFiltradas();
    if (!termino || !termino.trim()) return tareasFiltradas;
    
    const term = termino.toLowerCase().trim();
    return tareasFiltradas.filter(t => t.texto.toLowerCase().includes(term));
}

function ejecutarBusqueda(termino) {
    const resultados = buscarTareas(termino);
    
    listaResultados.innerHTML = '';
    
    if (termino && termino.trim()) {
        if (resultados.length > 0) {
            resultadosBusqueda.classList.add('activo');
            resultados.forEach(t => {
                const div = document.createElement('div');
                div.className = 'resultado-item';
                const materia = materias.find(m => m.id === t.materiaId);
                div.textContent = materia ? `${materia.icono || '📚'} ${t.texto} (${materia.nombre})` : t.texto;
                div.addEventListener('click', () => {
                    if (t.materiaId !== materiaSeleccionada) seleccionarMateria(t.materiaId);
                    setTimeout(() => {
                        const elemento = document.querySelector(`[data-id="${t.id}"]`);
                        if (elemento) {
                            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            elemento.style.backgroundColor = '#fdf0d5';
                            setTimeout(() => { elemento.style.backgroundColor = ''; }, 2000);
                        }
                    }, 100);
                });
                listaResultados.appendChild(div);
            });
        } else {
            resultadosBusqueda.classList.add('activo');
            listaResultados.innerHTML = '<div class="resultado-item">No se encontraron tareas</div>';
        }
    } else {
        ocultarResultados();
    }

    renderizarTareas(resultados);
}

// ==========================================
// PERSONALIZADOR DE FONDO (MODAL)
// ==========================================

let fondoActual = {
    tipo: 'color',
    valor: '#f5f0e8',
    direccion: 'to right',
    imagenData: null
};

function cargarFondo() {
    const guardado = localStorage.getItem('fondo_personalizado');
    if (guardado) {
        try {
            const parsed = JSON.parse(guardado);
            fondoActual = { ...fondoActual, ...parsed };
            aplicarFondo();
        } catch (e) {
            console.error('Error al cargar fondo:', e);
        }
    }
    
    const imagenGuardada = sessionStorage.getItem('fondo_imagen');
    if (imagenGuardada && fondoActual.tipo === 'imagen') {
        fondoActual.imagenData = imagenGuardada;
        aplicarFondo();
    }
}

function guardarFondo() {
    const fondoAGuardar = {
        tipo: fondoActual.tipo,
        valor: fondoActual.tipo === 'imagen' ? '#f5f0e8' : fondoActual.valor,
        direccion: fondoActual.direccion
    };
    localStorage.setItem('fondo_personalizado', JSON.stringify(fondoAGuardar));
    
    if (fondoActual.tipo === 'imagen' && fondoActual.imagenData) {
        sessionStorage.setItem('fondo_imagen', fondoActual.imagenData);
    }
}

function aplicarFondo() {
    const body = document.body;
    body.classList.remove('fondo-imagen');
    body.style.backgroundImage = '';
    body.style.backgroundColor = '';
    
    switch (fondoActual.tipo) {
        case 'color':
            body.style.backgroundColor = fondoActual.valor;
            body.style.backgroundImage = `
                radial-gradient(ellipse at 15% 30%, rgba(200, 180, 150, 0.15) 0%, transparent 55%),
                radial-gradient(ellipse at 80% 25%, rgba(180, 160, 130, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 75%, rgba(210, 190, 160, 0.12) 0%, transparent 50%),
                radial-gradient(ellipse at 25% 85%, rgba(195, 175, 145, 0.1) 0%, transparent 45%)
            `;
            break;
        case 'degradado':
            const [color1, color2] = fondoActual.valor.split(',');
            body.style.backgroundImage = `linear-gradient(${fondoActual.direccion}, ${color1}, ${color2})`;
            body.style.backgroundColor = color1;
            break;
        case 'imagen':
            if (fondoActual.imagenData) {
                body.classList.add('fondo-imagen');
                body.style.setProperty('--bg-imagen', `url(${fondoActual.imagenData})`);
            }
            break;
    }
}

function abrirModal() {
    document.getElementById('modalOverlay').classList.add('activo');
    document.getElementById('modalFondo').classList.add('activo');
    document.body.style.overflow = 'hidden';
    sincronizarUI();
}

function cerrarModal() {
    document.getElementById('modalOverlay').classList.remove('activo');
    document.getElementById('modalFondo').classList.remove('activo');
    document.body.style.overflow = '';
}

function sincronizarUI() {
    document.querySelectorAll('.tab-fondo').forEach(tab => {
        tab.classList.remove('activo');
        const tabName = fondoActual.tipo === 'color' ? 'colores' : fondoActual.tipo === 'degradado' ? 'degradados' : 'imagen';
        if (tab.dataset.tab === tabName) tab.classList.add('activo');
    });
    
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('activo'));
    const panelId = fondoActual.tipo === 'color' ? 'tabColores' : fondoActual.tipo === 'degradado' ? 'tabDegradados' : 'tabImagen';
    document.getElementById(panelId)?.classList.add('activo');
    
    if (fondoActual.tipo === 'color') {
        document.getElementById('inputColorPersonalizado').value = fondoActual.valor;
        document.getElementById('colorHexValue').textContent = fondoActual.valor;
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.classList.remove('seleccionado');
            if (btn.dataset.color === fondoActual.valor) btn.classList.add('seleccionado');
        });
    }
    
    if (fondoActual.tipo === 'degradado') {
        const [c1, c2] = fondoActual.valor.split(',');
        document.getElementById('degradadoColor1').value = c1 || '#f5f0e8';
        document.getElementById('degradadoColor2').value = c2 || '#e8dcc8';
        document.getElementById('direccionDegradado').value = fondoActual.direccion;
        document.getElementById('previewDegradado').style.background = 
            `linear-gradient(${fondoActual.direccion}, ${c1 || '#f5f0e8'}, ${c2 || '#e8dcc8'})`;
    }
    
    if (fondoActual.tipo === 'imagen' && fondoActual.imagenData) {
        document.getElementById('previewImagen').src = fondoActual.imagenData;
        document.getElementById('previewContainer').style.display = 'block';
        document.getElementById('uploadArea').style.display = 'none';
    }
}

function inicializarPersonalizadorFondo() {
    cargarFondo();
    
    document.getElementById('btnPersonalizarFondo').addEventListener('click', abrirModal);
    document.getElementById('btnCerrarModal').addEventListener('click', cerrarModal);
    document.getElementById('modalOverlay').addEventListener('click', cerrarModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('modalFondo').classList.contains('activo')) {
            cerrarModal();
        }
    });
    
    // Tabs
    document.querySelectorAll('.tab-fondo').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-fondo').forEach(t => t.classList.remove('activo'));
            tab.classList.add('activo');
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('activo'));
            document.getElementById(tab.dataset.tab === 'colores' ? 'tabColores' : tab.dataset.tab === 'degradados' ? 'tabDegradados' : 'tabImagen').classList.add('activo');
            fondoActual.tipo = tab.dataset.tab === 'colores' ? 'color' : tab.dataset.tab === 'degradados' ? 'degradado' : 'imagen';
        });
    });
    
    // Colores
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
            fondoActual.tipo = 'color';
            fondoActual.valor = btn.dataset.color;
            document.getElementById('inputColorPersonalizado').value = btn.dataset.color;
            document.getElementById('colorHexValue').textContent = btn.dataset.color;
            document.querySelectorAll('.color-option').forEach(b => b.classList.remove('seleccionado'));
            btn.classList.add('seleccionado');
        });
    });
    
    document.getElementById('inputColorPersonalizado').addEventListener('input', (e) => {
        fondoActual.tipo = 'color';
        fondoActual.valor = e.target.value;
        document.getElementById('colorHexValue').textContent = e.target.value;
        document.querySelectorAll('.color-option').forEach(b => b.classList.remove('seleccionado'));
    });
    
    // Degradados
    document.querySelectorAll('.degradado-option').forEach(btn => {
        btn.addEventListener('click', () => {
            fondoActual.tipo = 'degradado';
            fondoActual.valor = btn.dataset.colors;
            fondoActual.direccion = btn.dataset.direction;
            const [c1, c2] = btn.dataset.colors.split(',');
            document.getElementById('degradadoColor1').value = c1;
            document.getElementById('degradadoColor2').value = c2;
            document.getElementById('direccionDegradado').value = btn.dataset.direction;
            document.getElementById('previewDegradado').style.background = `linear-gradient(${btn.dataset.direction}, ${c1}, ${c2})`;
            document.querySelectorAll('.degradado-option').forEach(b => b.classList.remove('seleccionado'));
            btn.classList.add('seleccionado');
        });
    });
    
    document.getElementById('degradadoColor1').addEventListener('input', () => {
        fondoActual.tipo = 'degradado';
        const c1 = document.getElementById('degradadoColor1').value;
        const c2 = document.getElementById('degradadoColor2').value;
        fondoActual.valor = `${c1},${c2}`;
        document.getElementById('previewDegradado').style.background = 
            `linear-gradient(${document.getElementById('direccionDegradado').value}, ${c1}, ${c2})`;
        document.querySelectorAll('.degradado-option').forEach(b => b.classList.remove('seleccionado'));
    });
    
    document.getElementById('degradadoColor2').addEventListener('input', () => {
        fondoActual.tipo = 'degradado';
        const c1 = document.getElementById('degradadoColor1').value;
        const c2 = document.getElementById('degradadoColor2').value;
        fondoActual.valor = `${c1},${c2}`;
        document.getElementById('previewDegradado').style.background = 
            `linear-gradient(${document.getElementById('direccionDegradado').value}, ${c1}, ${c2})`;
        document.querySelectorAll('.degradado-option').forEach(b => b.classList.remove('seleccionado'));
    });
    
    document.getElementById('direccionDegradado').addEventListener('change', (e) => {
        fondoActual.direccion = e.target.value;
        const c1 = document.getElementById('degradadoColor1').value;
        const c2 = document.getElementById('degradadoColor2').value;
        document.getElementById('previewDegradado').style.background = `linear-gradient(${e.target.value}, ${c1}, ${c2})`;
    });
    
    // Imagen
    document.getElementById('uploadArea').addEventListener('click', () => {
        document.getElementById('inputImagen').click();
    });
    
    document.getElementById('inputImagen').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('Por favor selecciona una imagen válida'); return; }
        if (file.size > 5 * 1024 * 1024) { alert('La imagen es demasiado grande. Máximo 5MB'); return; }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            fondoActual.imagenData = e.target.result;
            document.getElementById('previewImagen').src = e.target.result;
            document.getElementById('previewContainer').style.display = 'block';
            document.getElementById('uploadArea').style.display = 'none';
        };
        reader.readAsDataURL(file);
    });
    
    document.getElementById('btnQuitarImagen').addEventListener('click', () => {
        fondoActual.imagenData = null;
        document.getElementById('previewContainer').style.display = 'none';
        document.getElementById('uploadArea').style.display = '';
        document.getElementById('inputImagen').value = '';
    });
    
    // Botones de acción
    document.getElementById('btnAplicarFondo').addEventListener('click', () => {
        if (fondoActual.tipo === 'color') {
            fondoActual.valor = document.getElementById('inputColorPersonalizado').value;
        } else if (fondoActual.tipo === 'degradado') {
            fondoActual.valor = `${document.getElementById('degradadoColor1').value},${document.getElementById('degradadoColor2').value}`;
            fondoActual.direccion = document.getElementById('direccionDegradado').value;
        }
        aplicarFondo();
        guardarFondo();
        cerrarModal();
    });
    
    document.getElementById('btnRestaurarFondo').addEventListener('click', () => {
        fondoActual = { tipo: 'color', valor: '#f5f0e8', direccion: 'to right', imagenData: null };
        sessionStorage.removeItem('fondo_imagen');
        aplicarFondo();
        guardarFondo();
        sincronizarUI();
    });
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

function inicializarApp() {
    inicializarMaterias();
    cargarTareas();
    renderizarMaterias();
    renderizarTareas();
    inicializarPersonalizadorFondo();
    
    btnAgregar.addEventListener('click', () => agregarTarea(inputTarea.value));
    inputTarea.addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarTarea(inputTarea.value); });
    inputTarea.addEventListener('input', () => { inputTarea.style.borderColor = ''; inputTarea.style.backgroundColor = ''; });
    
    btnVolver.addEventListener('click', () => seleccionarMateria(null));
    btnAgregarMateria.addEventListener('click', () => agregarMateria(inputMateria.value));
    inputMateria.addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarMateria(inputMateria.value); });
    
    buscadorInput.addEventListener('input', () => {
        mostrarSpinner();
        if (timeoutBusqueda) clearTimeout(timeoutBusqueda);
        timeoutBusqueda = setTimeout(() => { ejecutarBusqueda(buscadorInput.value); ocultarSpinner(); }, 500);
    });
    
    btnToggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('abierto');
        sidebarOverlay.classList.toggle('activo');
    });
    
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('abierto');
        sidebarOverlay.classList.remove('activo');
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('abierto');
            sidebarOverlay.classList.remove('activo');
        }
    });
    
    console.log('✅ App inicializada correctamente');
}

document.addEventListener('DOMContentLoaded', inicializarApp);