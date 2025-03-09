class Projectile {
    constructor(scene, position, direction) {
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
        
        // Crear el modelo visual (inicialmente invisible)
        this.createProjectileModel();
        
        // Reproducir sonido de disparo
        this.playFireSound();
    }
    
    createProjectileModel() {
        // Geometría y material para el proyectil
        const geometry = new THREE.SphereGeometry(0.3, 12, 12); // Aumentar tamaño y resolución
        const material = new THREE.MeshStandardMaterial({
            color: 0xffcc00,
            emissive: 0xff8800,
            emissiveIntensity: 0.8, // Aumentar intensidad
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0 // Inicialmente invisible
        });
        
        // Crear la malla y posicionarla
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        
        // Añadir a la escena
        this.scene.add(this.mesh);
        
        // Crear la luz pero no añadirla a la escena todavía
        this.light = new THREE.PointLight(0xff8800, 2, 5); // Aumentar intensidad y rango
        this.light.position.copy(this.position);
        // No añadimos la luz a la escena todavía
        
        // Crear la estela pero hacerla invisible
        this.createTrail();
    }
    
    createTrail() {
        // Crear geometría para la estela
        const trailGeometry = new THREE.CylinderGeometry(0.1, 0.3, 1.5, 8); // Aumentar tamaño
        trailGeometry.translate(0, -0.75, 0); // Mover el origen al extremo
        
        // Material con transparencia para la estela
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0 // Inicialmente invisible
        });
        
        // Crear la malla de la estela
        this.trail = new THREE.Mesh(trailGeometry, trailMaterial);
        this.trail.rotation.x = Math.PI / 2; // Rotar para alinear con la dirección
        
        // Añadir la estela al proyectil
        this.mesh.add(this.trail);
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
        
        // Actualizar posición
        const moveX = this.direction.x * this.speed * deltaTime;
        const moveY = this.direction.y * this.speed * deltaTime;
        const moveZ = this.direction.z * this.speed * deltaTime;
        
        this.mesh.position.x += moveX;
        this.mesh.position.y += moveY;
        this.mesh.position.z += moveZ;
        
        // Hacer visible el proyectil después del retraso inicial y después de moverse
        if (!this.isVisible && this.timeAlive >= this.initialDelay) {
            // Aplicar un movimiento adicional antes de hacerlo visible
            // para asegurarnos de que está lejos de la posición inicial
            this.mesh.position.x += this.direction.x * 2;
            this.mesh.position.y += this.direction.y * 2;
            this.mesh.position.z += this.direction.z * 2;
            
            // Ahora hacerlo visible
            this.makeVisible();
        }
        
        // Actualizar la posición de la luz si ya es visible
        if (this.isVisible && this.light) {
            this.light.position.copy(this.mesh.position);
        }
        
        // Orientar el proyectil en la dirección del movimiento
        if (this.direction.length() > 0) {
            this.mesh.lookAt(
                this.mesh.position.x + this.direction.x,
                this.mesh.position.y + this.direction.y,
                this.mesh.position.z + this.direction.z
            );
        }
        
        // Actualizar la estela si ya es visible
        if (this.isVisible) {
            this.updateTrail();
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
        // Actualizar el tamaño y opacidad de la estela basado en la velocidad
        const trailScaleY = Math.min(2.0, this.speed * 0.05);
        this.trail.scale.y = trailScaleY;
        
        // Hacer que la estela sea más transparente cuanto más tiempo esté vivo el proyectil
        const opacity = Math.max(0, 0.7 * (1 - this.timeAlive / this.lifetime));
        this.trail.material.opacity = opacity;
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
        
        // Eliminar la estela (no es necesario eliminarla de la escena porque está adjunta al mesh)
        if (this.trail) {
            this.mesh.remove(this.trail);
            this.trail.geometry.dispose();
            this.trail.material.dispose();
            this.trail = null;
        }
        
        // No eliminamos el mesh aquí porque se hace en updateProjectiles del GameController
    }
    
    playFireSound() {
        // Aquí se implementaría la reproducción del sonido de disparo
        // Por ahora, lo simulamos con un console.log
        console.log("¡Disparo realizado!");
    }
}
