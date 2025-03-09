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
            fire: false
        };
        
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
                // Opcional: Podría elevar el cañón si se implementa
                break;
            case 'ArrowDown':
                // Opcional: Podría bajar el cañón si se implementa
                break;
                
            // Disparo
            case 'Space':
                this.keys.fire = isPressed;
                // Eliminamos la llamada directa a fireProjectile para evitar disparos duplicados
                // El disparo se manejará a través del método checkFiring del tanque
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
    
    isFirePressed() {
        return this.keys.fire;
    }
}
