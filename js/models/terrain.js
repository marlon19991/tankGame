class Terrain {
    constructor(scene) {
        this.scene = scene;
        
        // Dimensiones del terreno (40 veces más grande que el original)
        this.width = 2000;
        this.height = 2000;
        this.resolution = 2; // Aumentamos la resolución de la malla para optimizar rendimiento
        
        // Crear el terreno
        this.createTerrain();
    }
    
    createTerrain() {
        // Crear geometría del plano con mayor resolución para los desniveles
        const geometry = new THREE.PlaneGeometry(
            this.width, 
            this.height, 
            this.width / this.resolution * 2, // Mayor resolución para desniveles
            this.height / this.resolution * 2
        );
        
        // Rotar el plano para que sea horizontal
        geometry.rotateX(-Math.PI / 2);
        
        // Crear desniveles en el terreno
        this.createTerrainElevation(geometry);
        
        // Crear textura del terreno
        const texture = this.createTerrainTexture();
        
        // Material del terreno
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide,
            // Habilitar el mapa de desplazamiento para más detalle visual
            displacementScale: 0.5,
            displacementBias: -0.2,
            // Habilitar colores de vértices para zonas de asfalto y tierra
            vertexColors: true
        });
        
        // Crear la malla del terreno
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        
        // Guardar la geometría para acceder a ella más tarde
        this.geometry = geometry;
        
        // Crear y guardar el mapa de alturas para consultas
        this.heightMap = this.generateHeightMap();
        
        // Añadir a la escena
        this.scene.add(this.mesh);
        
        // Añadir detalles al terreno
        this.addTerrainDetails();
    }
    
    createTerrainElevation(geometry) {
        // Obtener los vértices de la geometría
        const vertices = geometry.attributes.position.array;
        
        // Crear un array para almacenar la altura de cada vértice para usarlo en la textura
        this.vertexHeights = [];
        
        // Crear algunas colinas y valles usando funciones de ruido
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // Evitar elevar el terreno en el centro (zona de inicio) - área más grande
            const distanceFromCenter = Math.sqrt(x * x + z * z);
            if (distanceFromCenter < 30) {
                this.vertexHeights.push(0); // Altura 0 para zona plana central
                continue;
            }
            
            // Usar funciones de ruido para crear elevaciones naturales
            // Combinamos varias frecuencias para obtener un terreno más interesante
            let elevation = 0;
            
            // Colinas grandes y suaves (ajustadas para el mapa más grande)
            elevation += Math.sin(x * 0.025) * Math.cos(z * 0.025) * 3;
            
            // Colinas medianas
            elevation += Math.sin(x * 0.05 + 0.5) * Math.sin(z * 0.05) * 2;
            
            // Pequeñas variaciones
            elevation += Math.sin(x * 0.1 + 1.5) * Math.cos(z * 0.1 + 1) * 1;
            
            // Ruido aleatorio para más naturalidad
            elevation += (Math.random() - 0.5) * 0.8;
            
            // Limitar la altura máxima
            elevation = Math.min(Math.max(elevation, 0), 6);
            
            // Aplicar la elevación
            vertices[i + 1] = elevation;
            
            // Guardar la altura para usarla en la textura
            this.vertexHeights.push(elevation);
        }
        
        // Actualizar la geometría
        geometry.attributes.position.needsUpdate = true;
        
        // Recalcular normales para iluminación correcta
        geometry.computeVertexNormals();
        
        // Crear un atributo de color para los vértices basado en la altura
        this.addVertexColors(geometry);
    }
    
    generateHeightMap() {
        // Crear un mapa de alturas para consultas rápidas
        const heightMap = new Map();
        const vertices = this.geometry.attributes.position.array;
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = Math.round(vertices[i]);
            const y = vertices[i + 1]; // La altura
            const z = Math.round(vertices[i + 2]);
            
            // Usar una clave basada en la posición x,z
            const key = `${x},${z}`;
            heightMap.set(key, y);
        }
        
        return heightMap;
    }
    
    // Método para obtener la altura del terreno en una posición dada
    getHeightAt(x, z) {
        // Redondear a las coordenadas más cercanas que tenemos en el mapa
        const roundedX = Math.round(x);
        const roundedZ = Math.round(z);
        
        // Buscar en el mapa de alturas
        const key = `${roundedX},${roundedZ}`;
        const height = this.heightMap.get(key);
        
        // Si no encontramos la altura exacta, interpolar con los puntos cercanos
        if (height !== undefined) {
            return height;
        } else {
            // Buscar los puntos más cercanos y hacer una interpolación simple
            let totalHeight = 0;
            let count = 0;
            
            // Buscar en un radio de 2 unidades
            for (let dx = -2; dx <= 2; dx++) {
                for (let dz = -2; dz <= 2; dz++) {
                    const nearKey = `${roundedX + dx},${roundedZ + dz}`;
                    const nearHeight = this.heightMap.get(nearKey);
                    
                    if (nearHeight !== undefined) {
                        // Ponderar por la distancia inversa
                        const distance = Math.sqrt(dx * dx + dz * dz);
                        const weight = 1 / (1 + distance);
                        
                        totalHeight += nearHeight * weight;
                        count += weight;
                    }
                }
            }
            
            // Si encontramos al menos un punto cercano, devolver la altura interpolada
            if (count > 0) {
                return totalHeight / count;
            }
            
            // Si no encontramos ningún punto cercano, devolver 0 (nivel del suelo)
            return 0;
        }
    }
    
    createTerrainTexture() {
        // Crear un canvas para la textura
        const canvas = document.createElement('canvas');
        canvas.width = 2048; // Mayor resolución para el mapa más grande
        canvas.height = 2048;
        const context = canvas.getContext('2d');
        
        // Rellenar el fondo de color gris oscuro (asfalto)
        context.fillStyle = '#333333';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Añadir variaciones de color para simular asfalto
        this.addAsphaltTexture(context, canvas.width, canvas.height);
        
        // Crear la textura de Three.js
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(16, 16); // Repetir la textura más veces para mayor detalle
        
        return texture;
    }
    
    addAsphaltTexture(context, width, height) {
        // Añadir variaciones aleatorias en la textura para simular asfalto
        for (let i = 0; i < 15000; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = 1 + Math.random() * 3; // Puntos más pequeños para textura de asfalto
            
            // Variaciones de gris para simular asfalto
            const grayValue = 40 + Math.floor(Math.random() * 30);
            const color = `rgb(${grayValue}, ${grayValue}, ${grayValue + Math.floor(Math.random() * 10)})`;
            
            context.beginPath();
            context.fillStyle = color;
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }
        
        // Ya no añadimos líneas de carretera
    }
    
    // Este método ya no se utiliza
    addRoadLines(context, width, height) {
        // Método vacío, ya no añadimos líneas de carretera
    }
    
    addVertexColors(geometry) {
        // Crear un array para almacenar los colores de los vértices
        const colors = [];
        const vertices = geometry.attributes.position.array;
        
        // Asignar colores basados en la altura
        for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
            const height = vertices[i + 1];
            
            if (height < 0.5) {
                // Asfalto para zonas planas (gris oscuro)
                colors.push(0.2, 0.2, 0.2);
            } else if (height < 2) {
                // Transición a tierra (mezcla de asfalto y tierra)
                const ratio = (height - 0.5) / 1.5;
                const asphaltRatio = 1 - ratio;
                colors.push(
                    0.2 * asphaltRatio + 0.55 * ratio, // R: de gris a marrón
                    0.2 * asphaltRatio + 0.27 * ratio, // G: de gris a marrón
                    0.2 * asphaltRatio + 0.07 * ratio  // B: de gris a marrón
                );
            } else {
                // Tierra para zonas elevadas (marrón)
                // Variación de marrón según la altura
                const brownVariation = Math.min((height - 2) / 4, 1) * 0.2;
                colors.push(
                    0.55 - brownVariation, // R: marrón más oscuro en las partes más altas
                    0.27 - brownVariation, // G
                    0.07                    // B
                );
            }
        }
        
        // Añadir el atributo de color a la geometría
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
    
    addTerrainDetails() {
        // No añadimos detalles al terreno
        console.log("No se añadirán detalles al terreno (hierba ni rocas)");
        
        // Inicializar el array de rocas vacío para evitar errores
        this.rocks = [];
    }
    
    addGrass() {
        // Método vacío - no se añade hierba
    }
    
    addRocks() {
        // Método vacío - no se añaden rocas
        this.rocks = []; // Inicializar el array vacío para evitar errores
    }
}
