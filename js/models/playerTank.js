class PlayerTank extends Tank {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        
        // Aumentar la velocidad para el mapa más grande
        this.moveSpeed = 25; // Velocidad aumentada (era 15)
        this.rotationSpeed = 2.0;
        
        // Aumentar el rango de la cámara
        this.minZoom = 10;
        this.maxZoom = 40; // Mayor zoom out para ver más del mapa grande
        this.currentZoom = 20;
        this.zoomSpeed = 2;
        
        // Crear el tanque del jugador con un color distintivo
        this.createTankModel(0x2288ff);
        
        // Configurar controles
        this.setupControls();
        
        // Inicializar variables de control
        this.moveForward = false;
        this.moveBackward = false;
        this.rotateLeft = false;
        this.rotateRight = false;
        this.cannonUp = false;
        this.cannonDown = false;
        
        // Tiempo de recarga
        this.reloadTime = 0.5; // Tiempo de recarga en segundos
        this.timeSinceLastShot = this.reloadTime;
    }
    
    // Aquí irían los demás métodos de la clase PlayerTank
} 