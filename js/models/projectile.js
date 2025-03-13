class Projectile {
    constructor(scene, position, direction, tankMass = 20) {
        this.scene = scene;
        this.position = position.clone();
        this.direction = direction.normalize();
        
        // Propiedades físicas
        this.speed = 40; // Velocidad del proyectil
        this.lifetime = 3; // Tiempo de vida en segundos
        this.damage = 20; // Daño que causa
        this.active = true; // Si está activo
        this.timeAlive = 0; // Tiempo que lleva activo
        this.initialDelay = 0.02; // Tiempo antes de que el proyectil sea visible
        this.isVisible = false; // Controla si el proyectil es visible
        
        // Guardar la masa del tanque para calcular el tamaño del proyectil
        this.tankMass = tankMass;
        
        // Calcular el daño basado en la masa del tanque
        this.damage = Math.round(this.tankMass);
        
        // Crear el modelo visual (inicialmente invisible)
        this.createProjectileModel();
        
        // Reproducir sonido de disparo
        this.playFireSound();
    }
    
    createProjectileModel() {
        // Calcular el tamaño del proyectil basado en la masa del tanque
        // Fórmula: tamaño base (0.3) * factor de escala basado en la masa
        const massScale = Math.sqrt(this.tankMass / 20); // Raíz cuadrada para que no crezca demasiado rápido
        const projectileSize = 0.3 * massScale;
        
        // Geometría y material para el proyectil - Usar geometría más simple
        const geometry = new THREE.SphereGeometry(projectileSize, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            emissive: 0xff8800,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0 // Inicialmente invisible
        });
        
        // Crear la malla y posicionarla
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = false; // Desactivar sombras para mejorar rendimiento
        this.mesh.receiveShadow = false;
        
        // Añadir a la escena
        this.scene.add(this.mesh);
        
        // Luz opcional - Solo activarla si hay pocos proyectiles (lo controlaremos en update)
        this.light = null; // No crear luz por defecto
        
        // Crear la estela pero hacerla más simple
        this.createTrail(projectileSize);
    }
    
    createTrail(projectileSize) {
        // Usar una geometría más simple para la estela
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        
        // Crear menos puntos para la estela (5 en lugar de 10)
        for (let i = 0; i < 5; i++) {
            vertices.push(this.position.x, this.position.y, this.position.z);
        }
        
        // Crear el buffer de vértices
        const positionAttribute = new THREE.Float32BufferAttribute(vertices, 3);
        geometry.setAttribute('position', positionAttribute);
        
        // Material más simple y menos intensivo
        const material = new THREE.LineBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0 // Inicialmente invisible
        });
        
        // Crear la línea
        this.trail = {
            mesh: new THREE.Line(geometry, material),
            positionAttribute: positionAttribute,
            maxPoints: 5, // Usar menos puntos
            updateInterval: 0.05, // Actualizar con menos frecuencia
            material: material // Guardar referencia al material
        };
        
        // Añadir a la escena
        this.scene.add(this.trail.mesh);
    }
    
    update(deltaTime) {
        if (!this.active) return false;
        
        // Incrementar el tiempo vivo
        this.timeAlive += deltaTime;
        
        // Comprobar si ha expirado
        if (this.timeAlive >= this.lifetime) {
            this.deactivate();
            return false;
        }
        
        // Si el proyectil no está visible pero ha pasado el tiempo de retraso inicial, hacerlo visible
        if (!this.isVisible && this.timeAlive >= this.initialDelay) {
            this.makeVisible();
        }
        
        // Calcular nueva posición solo si el proyectil es visible
        if (this.isVisible) {
            // Actualizar posición según la dirección y velocidad
            this.position.add(this.direction.clone().multiplyScalar(this.speed * deltaTime));
            this.mesh.position.copy(this.position);
            
            // Actualizar la posición de la luz si existe
            if (this.light) {
                this.light.position.copy(this.position);
            }
            
            // Actualizar la estela solo cada cierto intervalo para reducir carga
            if (this.trail) {
                this.updateTrail();
            }
        }
        
        return true;
    }
    
    makeVisible() {
        // Hacer visible el proyectil
        this.isVisible = true;
        
        // Hacer visible la malla
        this.mesh.material.opacity = 1;
        
        // Hacer visible la estela
        if (this.trail) {
            this.trail.material.opacity = 0.8; // Aumentar opacidad
        }
        
        // Añadir la luz a la escena
        if (this.light) {
            this.scene.add(this.light);
        }
        
        console.log("Proyectil ahora visible");
    }
    
    updateTrail() {
        // Actualizar la estela con la posición actual
        if (!this.trail || !this.trail.positionAttribute) return;
        
        // Desplazar todos los puntos de la estela hacia adelante
        const positions = this.trail.positionAttribute.array;
        
        // Mover cada punto a la posición del punto anterior
        for (let i = positions.length - 3; i >= 3; i -= 3) {
            positions[i] = positions[i - 3];
            positions[i + 1] = positions[i - 2];
            positions[i + 2] = positions[i - 1];
        }
        
        // El primer punto es la posición actual del proyectil
        positions[0] = this.position.x;
        positions[1] = this.position.y;
        positions[2] = this.position.z;
        
        // Marcar el atributo como necesitado de actualización
        this.trail.positionAttribute.needsUpdate = true;
        
        // Actualizar la opacidad según el tiempo de vida
        const lifeRatio = this.timeAlive / this.lifetime;
        const opacity = 1.0 - lifeRatio;
        
        if (this.trail.material) {
            this.trail.material.opacity = opacity * 0.7; // Reducir la opacidad general
            
            // Si la opacidad es muy baja, hacer invisible la estela
            if (opacity < 0.1) {
                this.trail.material.visible = false;
            }
        }
    }
    
    hit() {
        this.deactivate();
        // Aquí se podría añadir lógica de daño, efectos visuales, etc.
    }
    
    deactivate() {
        if (!this.active) return; // Evitar desactivar dos veces
        
        this.active = false;
        
        // Eliminar la luz
        if (this.light && this.isVisible) {
            this.scene.remove(this.light);
            this.light = null;
        }
        
        // Eliminar la estela correctamente
        if (this.trail) {
            this.scene.remove(this.trail.mesh);
            this.trail.mesh.geometry.dispose();
            this.trail.material.dispose();
            this.trail = null;
        }
        
        // Eliminar el mesh del proyectil
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        
        // No eliminamos el mesh aquí porque se hace en updateProjectiles del GameController
    }
    
    playFireSound() {
        // Aquí se implementaría la reproducción del sonido de disparo
        // Por ahora, lo simulamos con un console.log
        console.log("¡Disparo realizado!");
    }
}
