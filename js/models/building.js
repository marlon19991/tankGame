class Building {
    constructor(scene, x, z, width, height, depth, color) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, height / 2, z);
        this.width = width || 10;
        this.height = height || 15;
        this.depth = depth || 10;
        this.color = color || 0x888888;
        this.active = true;
        
        this.createMesh();
    }
    
    createMesh() {
        // Crear geometría del edificio
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        
        // Crear material del edificio con color aleatorio si no se especificó
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            roughness: 0.7,
            metalness: 0.2
        });
        
        // Crear la malla del edificio
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Añadir propiedades de física para colisiones
        this.mesh.userData.physics = {
            type: 'building',
            boundingRadius: Math.max(this.width, this.depth) / 2,
            height: this.height,
            width: this.width,
            depth: this.depth,
            isSmall: false
        };
        
        // Añadir a la escena
        this.scene.add(this.mesh);
    }
    
    getMesh() {
        return this.mesh;
    }
    
    // Método para manejar el impacto de un proyectil
    hit() {
        // Por ahora los edificios son indestructibles
        // Podrías implementar daño a los edificios en el futuro
        return true;
    }
    
    // Método para destruir el edificio y liberar recursos
    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(material => material.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
            
            this.mesh = null;
        }
        
        this.active = false;
    }
}
