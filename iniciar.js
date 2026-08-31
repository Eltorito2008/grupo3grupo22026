function inicializarApp() {
    inicializarMaterias();
    cargarTareas();
    renderizarMaterias();
    renderizarTareas();
    
    // ... (todo el código existente) ...
    
    // Inicializar personalizador de fondo
    inicializarPersonalizadorFondo();
    
    console.log('✅ App con materias y personalización inicializada correctamente');
}