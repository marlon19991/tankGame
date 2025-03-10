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
            cameraToggle: false  // Tecla para cambiar la cámara
        };
        
        // Estado para controlar el cambio de cámara
        this.cameraMode = 0; // 0: vista normal, 1: zoom cercano, 2: primera persona
        
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
                    // Solo cambiamos al presionar la tecla, no al mantenerla
                    this.cameraMode = (this.cameraMode + 1) % 3; // Rotar entre 0, 1 y 2
                    console.log(`Modo de cámara cambiado a: ${this.cameraMode}`);
                }
                this.keys.cameraToggle = isPressed;
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
}
