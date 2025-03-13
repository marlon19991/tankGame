class Pellet {
    constructor(scene, position, valorMasa = Math.floor(Math.random() * 3) + 1) {
        this.scene = scene;
        this.position = position;
        this.valorMasa = valorMasa;
        this.radio = valorMasa / 5; // Radio para colisiones basado en el valor de masa
        this.active = true; // Indica si el pellet está activo o ya fue recogido
        
        // Crear representación visual
        this.createMesh();
        
        // Añadir animación de flotación
        this.initialY = position.y;
        this.floatAmplitude = 0.1; // Amplitud de la flotación
        this.floatSpeed = 2; // Velocidad de la flotación
        this.floatOffset = Math.random() * Math.PI * 2; // Offset aleatorio para que no todos floten igual
    }
    
    createMesh() {
        // Geometría: esfera con radio proporcional al valor de masa
        const geometry = new THREE.SphereGeometry(this.radio * 2, 8, 8);
        
        // Material: amarillo brillante con brillo
        const material = new THREE.MeshStandardMaterial({
            color: 0xFFD700, // Color dorado
            emissive: 0x996515, // Emisión suave para que brille
            metalness: 0.7,
            roughness: 0.3,
        });
        
        // Crear mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Añadir al escenario
        this.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Animación de flotación
        const floatY = Math.sin((performance.now() / 1000 * this.floatSpeed) + this.floatOffset) * this.floatAmplitude;
        this.mesh.position.y = this.initialY + floatY;
        
        // Rotación suave
        this.mesh.rotation.y += deltaTime * 1.5;
    }
    
    /**
     * Comprueba si hay colisión entre el pellet y un tanque
     * Usa la fórmula: distancia² ≤ (r_tanque + r_pellet)²
     * @param {Tank} tank - El tanque a comprobar
     * @returns {boolean} - true si hay colisión, false en caso contrario
     */
    checkCollision(tank) {
        // Si el pellet no está activo, no hay colisión
        if (!this.active) return false;
        
        // Verificar que el tanque existe y tiene la propiedad tankGroup
        if (!tank || !tank.tankGroup) return false;
        
        // Obtener las posiciones
        const tankPos = tank.tankGroup.position;
        const pelletPos = this.position;
        
        // Calcular el cuadrado de la distancia (más eficiente que calcular la raíz cuadrada)
        const dx = tankPos.x - pelletPos.x;
        const dz = tankPos.z - pelletPos.z;
        const distanceSquared = dx * dx + dz * dz;
        
        // Usar un radio de colisión fijo si no está definido en el tanque
        const tankRadius = tank.collisionRadius || 3;
        
        // Calcular el cuadrado de la suma de los radios
        const sumRadiiSquared = Math.pow(tankRadius + this.radio, 2);
        
        // Si distancia² ≤ (r_tanque + r_pellet)², hay colisión
        return distanceSquared <= sumRadiiSquared;
    }
    
    collect() {
        if (!this.active) return;
        
        // Marcar como inactivo
        this.active = false;
        
        // Animación de recolección
        this.playCollectAnimation();
        
        return this.valorMasa;
    }
    
    playCollectAnimation() {
        // Animación simple de desaparición
        const timeline = gsap.timeline();
        
        timeline.to(this.mesh.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.3,
            ease: "back.in",
            onComplete: () => {
                // Eliminar del escenario cuando termine la animación
                this.scene.remove(this.mesh);
                this.mesh.geometry.dispose();
                this.mesh.material.dispose();
            }
        });
    }
    
    // Método para eliminar el pellet y liberar recursos
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
        }
    }
} 