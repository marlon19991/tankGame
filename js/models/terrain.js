class Terrain {
    constructor(scene) {
        this.scene = scene;
        
        // Dimensiones del terreno (4 veces más grande)
        this.width = 200;
        this.height = 200;
        this.resolution = 1; // Resolución de la malla
        
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
            displacementBias: -0.2
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
        
        // Crear algunas colinas y valles usando funciones de ruido
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // Evitar elevar el terreno en el centro (zona de inicio) - área más grande
            const distanceFromCenter = Math.sqrt(x * x + z * z);
            if (distanceFromCenter < 30) {
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
        }
        
        // Actualizar la geometría
        geometry.attributes.position.needsUpdate = true;
        
        // Recalcular normales para iluminación correcta
        geometry.computeVertexNormals();
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
        
        // Rellenar el fondo de color verde (hierba)
        context.fillStyle = '#4D8E53';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Añadir variaciones de color para simular terreno natural
        this.addTextureVariations(context, canvas.width, canvas.height);
        
        // Crear la textura de Three.js
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8); // Repetir la textura más veces
        
        return texture;
    }
    
    addTextureVariations(context, width, height) {
        // Añadir variaciones aleatorias en la textura (más para el mapa grande)
        for (let i = 0; i < 4000; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = 2 + Math.random() * 10;
            const color = Math.random() < 0.5 ? '#3E7542' : '#5EA066';
            
            context.beginPath();
            context.fillStyle = color;
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }
        
        // Añadir algunas "manchas" de tierra (más para el mapa grande)
        for (let i = 0; i < 800; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = 5 + Math.random() * 15;
            const color = Math.random() < 0.5 ? '#8B4513' : '#A0522D';
            
            context.beginPath();
            context.fillStyle = color;
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }
    }
    
    addTerrainDetails() {
        // Añadir hierba
        this.addGrass();
        
        // Añadir rocas
        this.addRocks();
    }
    
    addGrass() {
        // Simulamos hierba con pequeños cilindros verdes (más para el mapa grande)
        const grassCount = 2000;
        
        for (let i = 0; i < grassCount; i++) {
            // Posición aleatoria dentro del terreno
            const x = (Math.random() - 0.5) * this.width;
            const z = (Math.random() - 0.5) * this.height;
            
            // Comprobar si está cerca del centro (evitar hierba en el área inicial)
            const distanceFromCenter = Math.sqrt(x * x + z * z);
            if (distanceFromCenter < 15) continue;
            
            // Obtener la altura del terreno en esta posición
            const terrainHeight = this.getHeightAt(x, z);
            
            // Crear un cilindro para representar la hierba
            const height = 0.3 + Math.random() * 0.5;
            const geometry = new THREE.CylinderGeometry(0.05, 0, height, 4, 1);
            
            // Color de la hierba con ligera variación
            const hue = 0.3 + (Math.random() * 0.1 - 0.05); // Verde con variación
            const saturation = 0.7 + (Math.random() * 0.3 - 0.15);
            const lightness = 0.4 + (Math.random() * 0.2 - 0.1);
            
            const color = new THREE.Color().setHSL(hue, saturation, lightness);
            const material = new THREE.MeshStandardMaterial({ color: color });
            
            const grass = new THREE.Mesh(geometry, material);
            
            // Posicionar la hierba sobre el terreno
            grass.position.set(x, terrainHeight + height / 2, z);
            
            // Rotación aleatoria para variedad
            grass.rotation.y = Math.random() * Math.PI * 2;
            grass.rotation.x = Math.random() * 0.2;
            grass.rotation.z = Math.random() * 0.2;
            
            // Añadir a la escena
            this.scene.add(grass);
        }
    }
    
    addRocks() {
        // Añadir rocas al terreno (más para el mapa grande)
        const rockCount = 120;
        this.rocks = []; // Array para almacenar las rocas
        
        for (let i = 0; i < rockCount; i++) {
            // Posición aleatoria dentro del terreno
            const x = (Math.random() - 0.5) * this.width;
            const z = (Math.random() - 0.5) * this.height;
            
            // Comprobar si está cerca del centro (evitar rocas en el área inicial)
            const distanceFromCenter = Math.sqrt(x * x + z * z);
            if (distanceFromCenter < 20) continue;
            
            // Obtener la altura del terreno en esta posición
            const terrainHeight = this.getHeightAt(x, z);
            
            // Determinar si es una roca grande o pequeña
            const isSmall = Math.random() < 0.7; // 70% de probabilidad de ser pequeña
            
            // Crear geometría para la roca
            let geometry;
            if (isSmall) {
                // Roca pequeña (más simple)
                geometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5, 0);
            } else {
                // Roca grande (más compleja)
                geometry = new THREE.DodecahedronGeometry(1 + Math.random() * 2, 1);
            }
            
            // Deformar ligeramente la geometría para hacerla más natural
            const vertices = geometry.attributes.position.array;
            for (let j = 0; j < vertices.length; j += 3) {
                vertices[j] += (Math.random() - 0.5) * 0.2;
                vertices[j + 1] += (Math.random() - 0.5) * 0.2;
                vertices[j + 2] += (Math.random() - 0.5) * 0.2;
            }
            geometry.attributes.position.needsUpdate = true;
            geometry.computeVertexNormals();
            
            // Material de la roca
            const color = 0x808080 + Math.floor(Math.random() * 0x202020);
            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.8,
                metalness: 0.2
            });
            
            const rock = new THREE.Mesh(geometry, material);
            
            // Posicionar la roca sobre el terreno
            rock.position.set(x, terrainHeight + (isSmall ? 0.25 : 1), z);
            
            // Rotación aleatoria
            rock.rotation.x = Math.random() * Math.PI;
            rock.rotation.y = Math.random() * Math.PI;
            rock.rotation.z = Math.random() * Math.PI;
            
            // Escala aleatoria
            const scale = isSmall ? 0.5 + Math.random() * 0.5 : 1 + Math.random() * 1.5;
            rock.scale.set(scale, scale, scale);
            
            // Configurar sombras
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            // Añadir física a la roca
            const boundingRadius = isSmall ? scale * 0.5 : scale * 1.5;
            rock.userData.physics = {
                type: 'rock',
                boundingRadius: boundingRadius,
                isSmall: isSmall,
                height: isSmall ? scale : scale * 2
            };
            
            // Añadir a la escena y al array de rocas
            this.scene.add(rock);
            this.rocks.push(rock);
        }
    }
}
