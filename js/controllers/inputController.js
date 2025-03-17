class InputController {
    constructor() {
        // Estado de las teclas
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            turretLeft: false,
            turretRight: false,
            cannonUp: false,    // Nueva tecla para elevar el cañón
            cannonDown: false,  // Nueva tecla para bajar el cañón
            fire: false,
            cameraToggle: false,  // Tecla para cambiar la cámara
            selfDamage: false,    // Nueva tecla para auto-daño
            statsToggle: false,   // Nueva tecla para mostrar estadísticas
            ramming: false        // Nueva tecla para activar la embestida
        };
        
        // Estado para controlar el cambio de cámara
        this.cameraMode = 0; // 0: vista normal, 1: zoom cercano, 2: primera persona
        
        // Estado para las estadísticas
        this.showStats = false;
        
        // Configuración
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Eventos de teclado
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Eventos táctiles/mouse para dispositivos móviles (podría ser implementado más adelante)
    }
    
    onKeyDown(event) {
        this.updateKeyState(event.code, true);
    }
    
    onKeyUp(event) {
        this.updateKeyState(event.code, false);
    }
    
    updateKeyState(code, isPressed) {
        switch(code) {
            // Movimiento del tanque (WASD)
            case 'KeyW':
                this.keys.forward = isPressed;
                break;
            case 'KeyS':
                this.keys.backward = isPressed;
                break;
            case 'KeyA':
                this.keys.left = isPressed;
                break;
            case 'KeyD':
                this.keys.right = isPressed;
                break;
                
            // Rotación de la torreta (Flechas)
            case 'ArrowLeft':
                this.keys.turretLeft = isPressed;
                break;
            case 'ArrowRight':
                this.keys.turretRight = isPressed;
                break;
            case 'ArrowUp':
                this.keys.cannonUp = isPressed;
                break;
            case 'ArrowDown':
                this.keys.cannonDown = isPressed;
                break;
                
            // Disparo
            case 'Space':
                this.keys.fire = isPressed;
                // Eliminamos la llamada directa a fireProjectile para evitar disparos duplicados
                // El disparo se manejará a través del método checkFiring del tanque
                break;
                
            // Cambio de cámara con la tecla 2
            case 'Digit2':
                if (isPressed && !this.keys.cameraToggle) {
                    this.cameraMode = (this.cameraMode + 1) % 3;
                    console.log(`Modo de cámara cambiado a: ${this.cameraMode}`);
                }
                this.keys.cameraToggle = isPressed;
                break;
                
            // Auto-daño con la tecla 3
            case 'Digit3':
                this.keys.selfDamage = isPressed;
                break;
                
            // Mostrar/ocultar estadísticas con la tecla 1
            case 'Digit1':
                if (isPressed && !this.keys.statsToggle) {
                    this.showStats = !this.showStats;
                    console.log(`Estadísticas ${this.showStats ? 'activadas' : 'desactivadas'}`);
                }
                this.keys.statsToggle = isPressed;
                break;
                
            // Embestida con la tecla 4
            case 'Digit4':
                this.keys.ramming = isPressed;
                if (isPressed) {
                    console.log("¡Embestida activada!");
                }
                break;
        }
    }
    
    // Métodos para obtener el estado de entrada
    update() {
        // Se podría añadir lógica adicional aquí si fuera necesario
    }
    
    isMovingForward() {
        return this.keys.backward;
    }
    
    isMovingBackward() {
        return this.keys.forward;
    }
    
    isTurningLeft() {
        return this.keys.left;
    }
    
    isTurningRight() {
        return this.keys.right;
    }
    
    isTurretTurningLeft() {
        return this.keys.turretLeft;
    }
    
    isTurretTurningRight() {
        return this.keys.turretRight;
    }
    
    isCannonMovingUp() {
        return this.keys.cannonUp;
    }
    
    isCannonMovingDown() {
        return this.keys.cannonDown;
    }
    
    isFirePressed() {
        return this.keys.fire;
    }
    
    // Método para obtener el modo de cámara actual
    getCameraMode() {
        return this.cameraMode;
    }
    
    // Nuevo método para verificar si se presiona la tecla de auto-daño
    isSelfDamagePressed() {
        return this.keys.selfDamage;
    }
    
    // Nuevo método para verificar si las estadísticas deben mostrarse
    shouldShowStats() {
        return this.showStats;
    }
    
    /**
     * Verifica si la tecla de embestida está presionada
     * @returns {boolean} true si la tecla de embestida está presionada
     */
    isRammingPressed() {
        return this.keys.ramming;
    }
}
