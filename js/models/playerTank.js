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
    
    // Método para obtener la dirección a la que apunta la torreta
    // Necesario para el modo de cámara en primera persona
    getTurretDirection() {
        // Obtener la dirección base del tanque
        const tankDirection = this.getDirection();
        
        // Crear un quaternion para la rotación de la torreta
        const turretQuaternion = new THREE.Quaternion();
        turretQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.turretAngle);
        
        // Aplicar la rotación de la torreta a la dirección del tanque
        const turretDirection = tankDirection.clone();
        turretDirection.applyQuaternion(turretQuaternion);
        
        return turretDirection;
    }
    
    // Método para obtener la posición de la torreta
    // Necesario para colocar la cámara en primera persona
    getTurretPosition() {
        // Obtener la posición del tanque
        const tankPosition = this.tankGroup.position.clone();
        
        // Calcular la posición de la torreta en el mundo
        const turretWorldPosition = new THREE.Vector3();
        this.turret.getWorldPosition(turretWorldPosition);
        
        // Añadir un pequeño offset vertical para colocar la cámara en la parte superior de la torreta
        turretWorldPosition.y += 0.5;
        
        return turretWorldPosition;
    }
    
    // Aquí irían los demás métodos de la clase PlayerTank
} 