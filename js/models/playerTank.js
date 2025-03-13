class PlayerTank extends Tank {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        
        // Establecer la masa inicial del tanque del jugador
        this.mass = 25; // Masa inicial del jugador (aumentada de 10 a 25)
        
        // Velocidades base que serán ajustadas según la masa
        this.baseMovementSpeed = 80; // Velocidad base de movimiento (aumentada de 40 a 80)
        this.baseRotationSpeed = 6.0; // Velocidad base de rotación (aumentada de 3.5 a 6.0)
        
        // Actualizar la escala y velocidad según la masa inicial
        this.updateScale();
        this.updatePlayerSpeed();
        
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
    
    /**
     * Actualiza la velocidad del jugador basada en la masa actual
     * Aplica la fórmula v = v0/(m^0.1) a las velocidades específicas del jugador
     */
    updatePlayerSpeed() {
        // Aplicar la fórmula modificada para reducir drásticamente el impacto de la masa
        this.moveSpeed = this.baseMovementSpeed / Math.pow(this.mass, 0.1);
        this.rotationSpeed = this.baseRotationSpeed / Math.pow(this.mass, 0.1);
        
        // Establecer límites mínimos muy altos
        const minMoveSpeed = 40.0; // Velocidad mínima (aumentada de 15.0 a 40.0)
        const minRotationSpeed = 3.0; // Velocidad de rotación mínima (aumentada de 1.5 a 3.0)
        
        if (this.moveSpeed < minMoveSpeed) {
            this.moveSpeed = minMoveSpeed;
        }
        
        if (this.rotationSpeed < minRotationSpeed) {
            this.rotationSpeed = minRotationSpeed;
        }
    }
    
    // Sobrescribir el método updateMass para actualizar también la velocidad del jugador
    updateMass(newMass) {
        // Llamar al método de la clase padre
        super.updateMass(newMass);
        
        // Actualizar las velocidades específicas del jugador
        this.updatePlayerSpeed();
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