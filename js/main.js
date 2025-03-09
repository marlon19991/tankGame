// Configuración principal de Three.js
let scene, camera, renderer;
let gameController;
let lastTime = 0;

// Inicialización del juego
function init() {
    // Configurar escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Cielo azul claro
    
    // Configurar cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
    
    // Configurar renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // Iluminación
    setupLighting();
    
    // Inicializar controlador de juego
    gameController = new GameController(scene, camera);
    
    // Proporcionar el renderizador al controlador del juego para las barras de vida
    gameController.setRenderer(renderer);
    
    // Manejar redimensionamiento de la ventana
    window.addEventListener('resize', onWindowResize, false);
    
    // Iniciar bucle de animación
    animate(0);
}

// Configuración de iluminación
function setupLighting() {
    // Luz ambiental para iluminación general
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Luz direccional principal (simula el sol)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    
    // Configurar área de sombras para cubrir el mapa más grande
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    
    // Mejorar calidad de sombras
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    
    scene.add(directionalLight);
    
    // Añadir ayudante visual para la luz direccional (solo para desarrollo)
    // const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add(helper);
}

// Redimensionar la ventana
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Bucle de animación
function animate(time) {
    requestAnimationFrame(animate);
    
    // Calcular delta de tiempo para animaciones suaves
    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;
    
    // Actualizar lógica del juego
    if (gameController && deltaTime < 0.2) { // Evitar deltas muy grandes (por ejemplo al cambiar de pestaña)
        gameController.update(deltaTime);
    }
    
    // Renderizar la escena
    renderer.render(scene, camera);
}

// Iniciar el juego cuando el DOM haya cargado
document.addEventListener('DOMContentLoaded', init);
