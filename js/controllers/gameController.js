class GameController {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Referencias a elementos del juego
        this.playerTank = null;
        this.terrain = null;
        this.projectiles = [];
        this.obstacles = [];
        this.enemyTanks = []; // Array para almacenar tanques enemigos
        this.buildings = []; // Array para almacenar edificios
        this.radar = null; // Radar para mostrar enemigos cercanos
        this.pellets = []; // Array para almacenar pellets de masa
        
        // Límites para proyectiles para mejorar rendimiento
        this.maxProjectiles = 50; // Máximo número de proyectiles permitidos simultáneamente
        this.projectileCount = 0; // Contador de proyectiles activos
        
        // Configuración de pellets
        this.maxPellets = 30; // Máximo número de pellets en el mapa
        this.minPellets = 15; // Umbral mínimo de pellets en el mapa
        this.pelletSpawnInterval = 5000; // Intervalo de generación en ms
        this.lastPelletSpawnTime = 0; // Último tiempo de generación
        this.pelletRegenerationInterval = 10000; // Intervalo para regenerar pellets hasta el umbral mínimo
        this.lastPelletRegenerationTime = 0; // Último tiempo de regeneración
        
        // Estado del juego
        this.score = 0;
        this.gameOver = false;
        
        // Controlador de entrada
        this.inputController = new InputController();
        
        // Sistema de estadísticas
        this.statsDisplay = new StatsDisplay();
        
        // Inicializar componentes del juego
        this.init();
    }
    
    init() {
        // Crear terreno
        this.terrain = new Terrain(this.scene);
        
        // Crear tanque del jugador
        this.playerTank = new Tank(this.scene, 0, 1, 0);
        
        // Crear barra de vida del jugador
        this.playerHealthBar = new HealthBar();
        
        // Crear el radar
        this.radar = new Radar(this);
        
        // Configurar cámara para seguir al tanque
        this.setupCamera();
        
        // Crear edificios
        this.createBuildings();
        
        // Crear pellets iniciales
        this.createInitialPellets();
        
        // Crear tanques enemigos
        this.createEnemyTanks();
        
        // Obtener las rocas del terreno para la detección de colisiones
        this.rocks = this.terrain.rocks || [];
        
        console.log("Juego inicializado correctamente");
    }
    
    setupCamera() {
        // Configurar la cámara para seguir al tanque desde atrás y ligeramente elevada
        // Definir diferentes offsets para los distintos modos de cámara
        this.cameraOffsets = [
            new THREE.Vector3(0, 30, 50),   // Modo 0: Vista normal (alejada)
            new THREE.Vector3(0, 15, 25),   // Modo 1: Zoom cercano
            new THREE.Vector3(0, 4, 0)      // Modo 2: Primera persona (desde la torreta, más elevada)
        ];
        this.cameraOffset = this.cameraOffsets[0]; // Iniciar con modo normal
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
    }
    
    createObstacles() {
        // Función vacía - obstáculos eliminados
        this.obstacles = [];
        console.log("No se crearán obstáculos");
    }
    
    createBuildings() {
        // Crear edificios distribuidos por el mapa
        const buildingCount = 30;
        this.buildings = [];
        
        // Definir diferentes tipos de edificios (ancho, alto, profundidad, color)
        const buildingTypes = [
            { width: 15, height: 30, depth: 15, color: 0x888888 }, // Edificio alto gris
            { width: 20, height: 15, depth: 20, color: 0x775544 }, // Edificio ancho marrón
            { width: 10, height: 25, depth: 10, color: 0x998877 }, // Edificio mediano beige
            { width: 12, height: 18, depth: 12, color: 0x555555 }, // Edificio mediano gris oscuro
            { width: 8, height: 12, depth: 8, color: 0xAA9988 }   // Edificio pequeño beige claro
        ];
        
        // Crear edificios en diferentes áreas del mapa
        for (let i = 0; i < buildingCount; i++) {
            // Distribuir edificios en círculos concéntricos alrededor del centro
            // pero evitando la zona central donde comienza el jugador
            const angle = (i / buildingCount) * Math.PI * 2;
            const ring = Math.floor(i / 10) + 1; // Distribuir en anillos
            const distance = 100 + ring * 150; // Distancia desde el centro
            
            // Añadir un poco de variación aleatoria a la posición
            const randomOffset = 30;
            const x = Math.cos(angle) * distance + (Math.random() - 0.5) * randomOffset;
            const z = Math.sin(angle) * distance + (Math.random() - 0.5) * randomOffset;
            
            // Seleccionar un tipo de edificio aleatorio
            const typeIndex = Math.floor(Math.random() * buildingTypes.length);
            const type = buildingTypes[typeIndex];
            
            // Crear el edificio
            const building = new Building(
                this.scene, 
                x, 
                z, 
                type.width, 
                type.height, 
                type.depth, 
                type.color
            );
            
            this.buildings.push(building);
        }
        
        console.log(`Creados ${this.buildings.length} edificios`);
    }
    
    createEnemyTanks() {
        // Crear más tanques enemigos distribuidos por el mapa mucho más grande
        const enemyCount = 20; // Más enemigos para el mapa gigante
        this.enemyTanks = [];
        
        for (let i = 0; i < enemyCount; i++) {
            // Distribuir los tanques en círculos concéntricos alrededor del centro
            const angle = (i / enemyCount) * Math.PI * 2;
            const distance = 200 + (i % 5) * 150; // Distribuir en diferentes anillos mucho más amplios
            
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Asignar diferentes niveles de dificultad a los tanques
            let difficulty;
            if (i < 10) {
                difficulty = 'easy'; // La mitad de los tanques serán fáciles
            } else if (i < 18) {
                difficulty = 'normal'; // 8 tanques normales
            } else {
                difficulty = 'hard'; // 2 tanques difíciles
            }
            
            const enemyTank = new EnemyTank(this.scene, x, 1, z, difficulty);
            this.enemyTanks.push(enemyTank);
        }
        
        console.log(`Creados ${this.enemyTanks.length} tanques enemigos`);
    }
    
    // Método para crear pellets iniciales
    createInitialPellets() {
        console.log("Generando pellets iniciales...");
        
        // Número base de pellets iniciales
        const numInitialPellets = Math.floor(this.maxPellets / 2);
        
        // Generar pellets aleatorios distribuidos por el mapa
        for (let i = 0; i < numInitialPellets * 0.7; i++) {
            this.spawnPellet();
        }
        
        // Generar algunos patrones de pellets para hacer el juego más interesante
        this.generatePelletPatterns();
        
        console.log(`Generados ${this.pellets.length} pellets iniciales`);
    }
    
    // Método para generar patrones de pellets
    generatePelletPatterns() {
        // Definir los límites del terreno
        const X_MIN = -this.terrain.width / 2;
        const X_MAX = this.terrain.width / 2;
        const Z_MIN = -this.terrain.height / 2;
        const Z_MAX = this.terrain.height / 2;
        
        // Generar un patrón circular de pellets
        this.generateCirclePattern();
        
        // Generar un patrón en línea recta
        this.generateLinePattern();
        
        // Generar un patrón en zigzag
        this.generateZigzagPattern();
    }
    
    // Método para generar un patrón circular de pellets
    generateCirclePattern() {
        // Elegir un punto aleatorio para el centro del círculo
        const centerX = Math.random() * 800 - 400; // Dentro de ±400 unidades
        const centerZ = Math.random() * 800 - 400;
        const radius = 30 + Math.random() * 20; // Radio entre 30 y 50 unidades
        const numPellets = 8; // Número de pellets en el círculo
        
        for (let i = 0; i < numPellets; i++) {
            // Calcular posición en el círculo
            const angle = (i / numPellets) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const z = centerZ + Math.sin(angle) * radius;
            
            // Verificar que la posición sea válida
            let validPosition = true;
            
            // Comprobar edificios y obstáculos
            for (const building of this.buildings) {
                if (!building.position) continue;
                
                const distance = Math.sqrt(
                    Math.pow(x - building.position.x, 2) + 
                    Math.pow(z - building.position.z, 2)
                );
                
                const buildingSize = building.size || 5;
                if (distance < buildingSize + 5) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                for (const obstacle of this.obstacles) {
                    if (!obstacle.position) continue;
                    
                    const distance = Math.sqrt(
                        Math.pow(x - obstacle.position.x, 2) + 
                        Math.pow(z - obstacle.position.z, 2)
                    );
                    
                    if (distance < 5) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            if (validPosition) {
                // Obtener altura del terreno
                const y = this.terrain.getHeightAt(x, z) + 0.5;
                
                // Crear pellet con valor de masa 2 (valor medio)
                const position = new THREE.Vector3(x, y, z);
                const pellet = new Pellet(this.scene, position, 2);
                
                // Añadir a la lista
                this.pellets.push(pellet);
            }
        }
    }
    
    // Método para generar un patrón en línea recta
    generateLinePattern() {
        // Elegir un punto de inicio aleatorio
        const startX = Math.random() * 800 - 400;
        const startZ = Math.random() * 800 - 400;
        
        // Elegir una dirección aleatoria
        const angle = Math.random() * Math.PI * 2;
        const dirX = Math.cos(angle);
        const dirZ = Math.sin(angle);
        
        // Longitud de la línea y espaciado entre pellets
        const length = 60 + Math.random() * 40; // Entre 60 y 100 unidades
        const spacing = 10; // Espaciado entre pellets
        
        // Número de pellets en la línea
        const numPellets = Math.floor(length / spacing);
        
        for (let i = 0; i < numPellets; i++) {
            // Calcular posición en la línea
            const x = startX + dirX * i * spacing;
            const z = startZ + dirZ * i * spacing;
            
            // Verificar que la posición sea válida
            let validPosition = true;
            
            // Comprobar edificios y obstáculos (código similar al anterior)
            for (const building of this.buildings) {
                if (!building.position) continue;
                
                const distance = Math.sqrt(
                    Math.pow(x - building.position.x, 2) + 
                    Math.pow(z - building.position.z, 2)
                );
                
                const buildingSize = building.size || 5;
                if (distance < buildingSize + 5) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                for (const obstacle of this.obstacles) {
                    if (!obstacle.position) continue;
                    
                    const distance = Math.sqrt(
                        Math.pow(x - obstacle.position.x, 2) + 
                        Math.pow(z - obstacle.position.z, 2)
                    );
                    
                    if (distance < 5) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            if (validPosition) {
                // Obtener altura del terreno
                const y = this.terrain.getHeightAt(x, z) + 0.5;
                
                // Crear pellet con valor de masa 1 (valor bajo)
                const position = new THREE.Vector3(x, y, z);
                const pellet = new Pellet(this.scene, position, 1);
                
                // Añadir a la lista
                this.pellets.push(pellet);
            }
        }
    }
    
    // Método para generar un patrón en zigzag
    generateZigzagPattern() {
        // Elegir un punto de inicio aleatorio
        const startX = Math.random() * 800 - 400;
        const startZ = Math.random() * 800 - 400;
        
        // Elegir una dirección principal aleatoria
        const mainAngle = Math.random() * Math.PI * 2;
        const mainDirX = Math.cos(mainAngle);
        const mainDirZ = Math.sin(mainAngle);
        
        // Dirección perpendicular para el zigzag
        const perpDirX = -mainDirZ;
        const perpDirZ = mainDirX;
        
        // Parámetros del zigzag
        const numSegments = 5; // Número de segmentos del zigzag
        const segmentLength = 20; // Longitud de cada segmento
        const zigzagWidth = 15; // Amplitud del zigzag
        const spacing = 5; // Espaciado entre pellets
        
        // Número de pellets por segmento
        const pelletsPerSegment = Math.floor(segmentLength / spacing);
        
        for (let segment = 0; segment < numSegments; segment++) {
            // Alternar dirección del zigzag
            const zigzagDir = segment % 2 === 0 ? 1 : -1;
            
            for (let i = 0; i < pelletsPerSegment; i++) {
                // Calcular posición en el zigzag
                const segmentProgress = i / pelletsPerSegment;
                const x = startX + 
                          (segment * segmentLength * mainDirX) + 
                          (i * spacing * mainDirX) + 
                          (zigzagDir * zigzagWidth * perpDirX * segmentProgress);
                const z = startZ + 
                          (segment * segmentLength * mainDirZ) + 
                          (i * spacing * mainDirZ) + 
                          (zigzagDir * zigzagWidth * perpDirZ * segmentProgress);
                
                // Verificar que la posición sea válida
                let validPosition = true;
                
                // Comprobar edificios y obstáculos (código similar al anterior)
                for (const building of this.buildings) {
                    if (!building.position) continue;
                    
                    const distance = Math.sqrt(
                        Math.pow(x - building.position.x, 2) + 
                        Math.pow(z - building.position.z, 2)
                    );
                    
                    const buildingSize = building.size || 5;
                    if (distance < buildingSize + 5) {
                        validPosition = false;
                        break;
                    }
                }
                
                if (validPosition) {
                    for (const obstacle of this.obstacles) {
                        if (!obstacle.position) continue;
                        
                        const distance = Math.sqrt(
                            Math.pow(x - obstacle.position.x, 2) + 
                            Math.pow(z - obstacle.position.z, 2)
                        );
                        
                        if (distance < 5) {
                            validPosition = false;
                            break;
                        }
                    }
                }
                
                if (validPosition) {
                    // Obtener altura del terreno
                    const y = this.terrain.getHeightAt(x, z) + 0.5;
                    
                    // Crear pellet con valor de masa 3 (valor alto)
                    const position = new THREE.Vector3(x, y, z);
                    const pellet = new Pellet(this.scene, position, 3);
                    
                    // Añadir a la lista
                    this.pellets.push(pellet);
                }
            }
        }
    }
    
    // Método para generar un nuevo pellet en una posición aleatoria
    spawnPellet() {
        if (this.pellets.length >= this.maxPellets) return;
        
        // Definir los límites del terreno
        const X_MIN = -this.terrain.width / 2;
        const X_MAX = this.terrain.width / 2;
        const Z_MIN = -this.terrain.height / 2;
        const Z_MAX = this.terrain.height / 2;
        
        // Margen desde el borde para evitar que los pellets aparezcan fuera del terreno visible
        const margin = 50;
        
        let x, z;
        let validPosition = false;
        let attempts = 0;
        const maxAttempts = 30; // Aumentamos el número de intentos para encontrar una posición válida
        
        // Intentar encontrar una posición válida (no dentro de edificios u obstáculos)
        while (!validPosition && attempts < maxAttempts) {
            // Generar posición aleatoria con distribución uniforme
            // x = X_min + (X_max - X_min) * U1
            // z = Z_min + (Z_max - Z_min) * U2
            const U1 = Math.random();
            const U2 = Math.random();
            
            x = X_MIN + margin + (X_MAX - X_MIN - 2 * margin) * U1;
            z = Z_MIN + margin + (Z_MAX - Z_MIN - 2 * margin) * U2;
            
            // Verificar que no esté dentro de un edificio u obstáculo
            validPosition = true;
            
            // Comprobar edificios
            for (const building of this.buildings) {
                if (!building.position) continue;
                
                const distance = Math.sqrt(
                    Math.pow(x - building.position.x, 2) + 
                    Math.pow(z - building.position.z, 2)
                );
                
                // Usar el tamaño del edificio o un valor por defecto
                const buildingSize = building.size || 5;
                
                if (distance < buildingSize + 5) { // Aumentamos el margen para evitar pellets muy cerca de edificios
                    validPosition = false;
                    break;
                }
            }
            
            // Comprobar obstáculos
            if (validPosition) {
                for (const obstacle of this.obstacles) {
                    if (!obstacle.position) continue;
                    
                    const distance = Math.sqrt(
                        Math.pow(x - obstacle.position.x, 2) + 
                        Math.pow(z - obstacle.position.z, 2)
                    );
                    
                    if (distance < 5) { // Aumentamos el margen para evitar pellets muy cerca de obstáculos
                        validPosition = false;
                        break;
                    }
                }
            }
            
            // Comprobar que no esté demasiado cerca de otros pellets (para evitar agrupaciones)
            if (validPosition) {
                for (const pellet of this.pellets) {
                    const distance = Math.sqrt(
                        Math.pow(x - pellet.position.x, 2) + 
                        Math.pow(z - pellet.position.z, 2)
                    );
                    
                    if (distance < 10) { // Mantener una distancia mínima entre pellets
                        validPosition = false;
                        break;
                    }
                }
            }
            
            attempts++;
        }
        
        if (validPosition) {
            // Obtener altura del terreno en esa posición
            const y = this.terrain.getHeightAt(x, z) + 0.5; // Ligeramente por encima del terreno
            
            // Crear nuevo pellet con valor de masa aleatorio entre 1 y 3
            const valorMasa = Math.floor(Math.random() * 3) + 1;
            const position = new THREE.Vector3(x, y, z);
            const pellet = new Pellet(this.scene, position, valorMasa);
            
            // Añadir a la lista
            this.pellets.push(pellet);
            
            // Log para depuración
            console.log(`Pellet generado en (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}) con masa ${valorMasa}`);
        } else {
            // Si no se pudo encontrar una posición válida después de varios intentos, intentar de nuevo más tarde
            console.warn("No se pudo encontrar una posición válida para el pellet después de", maxAttempts, "intentos");
        }
    }
    
    // Método para actualizar los pellets
    updatePellets(deltaTime) {
        // Actualizar pellets existentes
        for (let i = this.pellets.length - 1; i >= 0; i--) {
            const pellet = this.pellets[i];
            
            // Actualizar animación
            pellet.update(deltaTime);
            
            // Comprobar colisión con el tanque del jugador
            if (pellet.checkCollision(this.playerTank)) {
                // Recoger el pellet
                const valorMasa = pellet.collect();
                
                // Aumentar la masa del tanque
                this.playerTank.increaseMass(valorMasa);
                
                // Eliminar de la lista
                this.pellets.splice(i, 1);
                
                // Actualizar puntuación
                this.score += valorMasa * 10;
                
                // Efecto de sonido (si está disponible)
                // this.playCollectSound();
            }
        }
        
        const currentTime = performance.now();
        
        // Generar nuevos pellets periódicamente (hasta el máximo)
        if (currentTime - this.lastPelletSpawnTime > this.pelletSpawnInterval && 
            this.pellets.length < this.maxPellets) {
            this.spawnPellet();
            this.lastPelletSpawnTime = currentTime;
        }
        
        // Regenerar pellets si estamos por debajo del umbral mínimo
        if (currentTime - this.lastPelletRegenerationTime > this.pelletRegenerationInterval && 
            this.pellets.length < this.minPellets) {
            
            // Calcular cuántos pellets necesitamos generar para alcanzar el umbral mínimo
            const pelletsToGenerate = Math.min(
                this.minPellets - this.pellets.length,  // Pellets necesarios para alcanzar el umbral
                3  // Máximo de pellets a generar por ciclo (para evitar generación masiva)
            );
            
            console.log(`Regenerando ${pelletsToGenerate} pellets para mantener el umbral mínimo de ${this.minPellets}`);
            
            // Generar los pellets necesarios
            for (let i = 0; i < pelletsToGenerate; i++) {
                this.spawnPellet();
            }
            
            // Actualizar el tiempo de regeneración
            this.lastPelletRegenerationTime = currentTime;
        }
    }
    
    update(deltaTime) {
        if (this.gameOver) return;
        
        // Actualizar tanque del jugador
        this.playerTank.update(deltaTime, this.inputController, this);
        
        // Actualizar barra de vida
        this.playerHealthBar.updateHealth(this.playerTank.health);
        
        // Actualizar radar
        this.radar.update(this.playerTank, this.enemyTanks);
        
        // Actualizar pellets
        this.updatePellets(deltaTime);
        
        // Actualizar proyectiles
        this.updateProjectiles(deltaTime);
        
        // Comprobar colisiones del tanque con obstáculos y edificios
        this.checkTankCollisions();
        
        // Actualizar tanques enemigos
        this.updateEnemyTanks(deltaTime);
        
        // Actualizar cámara
        this.updateCamera();
        
        // Comprobar si el jugador ha perdido
        if (this.playerTank.health <= 0) {
            this.showGameOver();
        }
        
        // Comprobar si el jugador ha ganado
        if (this.enemyTanks.length === 0) {
            this.gameComplete();
        }
        
        // Actualizar estadísticas si están visibles
        if (this.inputController.shouldShowStats()) {
            this.statsDisplay.show();
            this.statsDisplay.update(this, deltaTime);
        } else {
            this.statsDisplay.hide();
        }
    }
    
    updateCamera() {
        if (!this.playerTank) return;
        
        // Obtener el modo de cámara actual del controlador de entrada
        const cameraMode = this.inputController.getCameraMode();
        
        // Actualizar el offset de la cámara según el modo seleccionado
        this.cameraOffset = this.cameraOffsets[cameraMode];
        
        // Obtener la dirección a la que mira el tanque
        const tankDirection = this.playerTank.getDirection();
        
        // Obtener la dirección de la torreta (para modo primera persona)
        const turretDirection = this.playerTank.getTurretDirection ? 
                              this.playerTank.getTurretDirection() : 
                              tankDirection.clone();
        
        // Calcular posición de la cámara basada en la posición del tanque
        const tankPos = this.playerTank.getMesh().position;
        const turretPos = this.playerTank.getTurretPosition ? 
                         this.playerTank.getTurretPosition() : 
                         new THREE.Vector3().copy(tankPos).add(new THREE.Vector3(0, 3, 0));
        
        // Calcular el ángulo de rotación en Y basado en la dirección del tanque o torreta
        const rotationY = cameraMode === 2 ? 
                        Math.atan2(turretDirection.x, turretDirection.z) : 
                        Math.atan2(tankDirection.x, tankDirection.z);
        
        // Ajustar el offset basado en la dirección del tanque o torreta
        const rotatedOffset = this.cameraOffset.clone();
        rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
        
        // Calcular la nueva posición de la cámara según el modo
        let targetCameraPosition;
        let targetLookAt;
        
        if (cameraMode === 2) {
            // Modo primera persona: cámara en la torreta mirando hacia adelante
            targetCameraPosition = new THREE.Vector3().copy(turretPos);
            
            // Ajustar la altura de la cámara proporcionalmente al tamaño del tanque
            // Obtener el factor de escala actual del tanque
            const tankScale = this.playerTank.scaleFactor;
            
            // Calcular la altura adicional basada en el tamaño del tanque
            // Más grande el tanque, más alta debe estar la cámara para ver por encima del cuerpo
            const heightAdjustment = 1.5 * tankScale;
            
            // Aplicar el ajuste de altura
            targetCameraPosition.y += heightAdjustment;
            
            // Calcular un punto adelante de la torreta para mirar
            // Ajustar la distancia de mirada según el tamaño del tanque
            const lookDistance = 100 + (tankScale - 1) * 50; // Aumentar la distancia con el tamaño
            
            targetLookAt = new THREE.Vector3().copy(turretPos).add(
                new THREE.Vector3(
                    turretDirection.x * lookDistance,
                    turretDirection.y * lookDistance - 10, // Ajustar componente vertical
                    turretDirection.z * lookDistance
                )
            );
        } else {
            // Modos normal y zoom: cámara detrás del tanque
            // Ajustar el offset según el tamaño del tanque
            const tankScale = this.playerTank.scaleFactor;
            const adjustedOffset = rotatedOffset.clone().multiplyScalar(1 + (tankScale - 1) * 0.5);
            
            targetCameraPosition = new THREE.Vector3().copy(tankPos).add(adjustedOffset);
            // La cámara mira ligeramente por encima del tanque
            targetLookAt = new THREE.Vector3().copy(tankPos).add(new THREE.Vector3(0, 2 * tankScale, 0));
        }
        
        // Interpolar suavemente entre la posición actual y la nueva posición
        this.camera.position.lerp(targetCameraPosition, 0.1);
        
        // Actualizar el punto al que mira la cámara
        this.cameraTarget.copy(targetLookAt);
        this.camera.lookAt(this.cameraTarget);
    }
    
    fireProjectile() {
        if (!this.playerTank) return;
        
        const projectile = this.playerTank.fire();
        if (projectile) {
            projectile.sourceId = 'player'; // Identificar el proyectil como del jugador
            this.projectiles.push(projectile);
        }
    }
    
    addProjectile(projectile) {
        // Verificar si ya hay demasiados proyectiles activos
        if (this.projectiles.length >= this.maxProjectiles) {
            const oldestProjectile = this.projectiles.shift();
            this.cleanupProjectile(oldestProjectile);
        }
        
        // Si el proyectil viene de un tanque enemigo, marcar su origen
        if (projectile.sourceId === undefined) {
            projectile.sourceId = 'enemy';
        }
        
        this.projectiles.push(projectile);
        this.projectileCount++;
    }
    
    // Método para limpiar recursos de un proyectil
    cleanupProjectile(projectile) {
        // Asegurarse de que el proyectil está desactivado
        if (projectile.active) {
            projectile.deactivate();
        }
        
        // Eliminar el proyectil de la escena si aún no se ha hecho
        if (projectile.mesh && projectile.mesh.parent) {
            this.scene.remove(projectile.mesh);
            projectile.mesh.geometry.dispose();
            projectile.mesh.material.dispose();
            projectile.mesh = null;
        }
        
        // Eliminar la estela si aún existe
        if (projectile.trail && projectile.trail.mesh && projectile.trail.mesh.parent) {
            this.scene.remove(projectile.trail.mesh);
            projectile.trail.mesh.geometry.dispose();
            projectile.trail.material.dispose();
            projectile.trail = null;
        }
        
        // Eliminar la luz si aún existe
        if (projectile.light && projectile.light.parent) {
            this.scene.remove(projectile.light);
            projectile.light = null;
        }
        
        // Decrementar el contador de proyectiles
        this.projectileCount--;
    }
    
    updateProjectiles(deltaTime) {
        // Actualizar cada proyectil
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Si el proyectil ya no está activo, eliminarlo
            if (!projectile.active) {
                this.cleanupProjectile(projectile);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Actualizar el proyectil
            const isActive = projectile.update(deltaTime);
            
            // Si el proyectil ya no está activo después de la actualización, marcarlo para eliminación
            if (!isActive) {
                this.cleanupProjectile(projectile);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Comprobar colisiones
            this.checkProjectileCollisions(projectile);
        }
    }
    
    checkTankCollisions() {
        if (!this.playerTank) return;
        
        // Obtener la malla del tanque y su posición
        const tankMesh = this.playerTank.getMesh();
        const tankPosition = tankMesh.position.clone();
        
        // Aumentar ligeramente el radio de colisión del tanque para evitar penetraciones
        const tankRadius = 2.2; // Radio de colisión del tanque aumentado
        
        // Guardar la posición original antes de resolver colisiones
        const originalPosition = tankPosition.clone();
        
        // Vector acumulativo para la resolución de colisiones
        const totalDisplacement = new THREE.Vector3(0, 0, 0);
        let collisionDetected = false;
        
        // Usar rocas y edificios para colisiones
        const collidableObjects = [...this.rocks, ...this.buildings.map(building => building.getMesh())];
        
        // Comprobar colisiones con todos los objetos colisionables
        for (const object of collidableObjects) {
            // Verificar que el objeto tiene propiedades de física definidas
            if (!object.userData.physics || !object.userData.physics.boundingRadius) continue;
            
            const objectPosition = object.position;
            const objectRadius = object.userData.physics.boundingRadius;
            
            // Comprobar si el tanque puede pasar por encima del obstáculo
            const canPassOver = this.canTankPassOverObject(object, tankPosition.y);
            
            // Si el tanque puede pasar por encima, ignorar la colisión
            if (canPassOver) {
                continue;
            }
            
            // Distancia entre el tanque y el objeto (solo en X y Z)
            const dx = tankPosition.x - objectPosition.x;
            const dz = tankPosition.z - objectPosition.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            const minDistance = tankRadius + objectRadius;
            
            // Si hay colisión
            if (distance < minDistance) {
                collisionDetected = true;
                
                // Crear un vector de dirección desde el objeto al tanque
                const collisionNormal = new THREE.Vector3(dx, 0, dz);
                
                // Normalizar solo si la distancia no es cero
                if (distance > 0.001) {
                    collisionNormal.normalize();
                } else {
                    // Si están exactamente en el mismo lugar, mover en una dirección aleatoria
                    collisionNormal.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
                }
                
                // Calcular la distancia de penetración con un margen adicional más grande
                // Esto evitará que el tanque atraviese parcialmente los obstáculos
                const penetrationDepth = (minDistance - distance) + 0.2;
                
                // Acumular el desplazamiento total con un factor de peso basado en el tipo de objeto
                // Las rocas tienen menos "fuerza" de empuje que los obstáculos grandes
                const pushFactor = object.userData.physics.type === 'rock' ? 1.0 : 1.2;
                totalDisplacement.x += collisionNormal.x * penetrationDepth * pushFactor;
                totalDisplacement.z += collisionNormal.z * penetrationDepth * pushFactor;
            }
        }
        
        // Aplicar el desplazamiento total acumulado de todas las colisiones
        if (collisionDetected) {
            // Aplicar el desplazamiento total
            tankMesh.position.x += totalDisplacement.x;
            tankMesh.position.z += totalDisplacement.z;
            
            // Reducir la velocidad del tanque (más si choca con obstáculos grandes)
            this.playerTank.reduceSpeed(0.15);
            
            // Calcular si el tanque estaba moviéndose hacia algún obstáculo
            if (this.playerTank.speed !== 0) {
                const tankDirection = this.playerTank.getDirection();
                const movementDirection = new THREE.Vector3(
                    tankMesh.position.x - originalPosition.x,
                    0,
                    tankMesh.position.z - originalPosition.z
                );
                
                // Solo normalizar si hay un desplazamiento significativo
                if (movementDirection.length() > 0.001) {
                    movementDirection.normalize();
                    
                    const dotProduct = tankDirection.dot(movementDirection);
                    
                    // Si el tanque se estaba moviendo hacia el obstáculo, invertir parcialmente su velocidad
                    if (dotProduct < -0.3 && Math.abs(this.playerTank.speed) > 0.5) {
                        // Rebote con pérdida de energía, pero no demasiado fuerte
                        this.playerTank.speed *= -0.2;
                        
                        // Limitar la velocidad de rebote para evitar rebotes excesivos
                        if (Math.abs(this.playerTank.speed) < 0.8) {
                            this.playerTank.speed = 0;
                        }
                    }
                }
            }
            
            // Marcar que hubo una colisión para que el tanque lo sepa
            this.playerTank.handleCollision();
        }
    }
    
    canTankPassOverObject(object, tankHeight) {
        // Verificar si el objeto es un obstáculo pequeño o una roca pequeña
        if (!object.userData.physics) return false;
        
        // Para obstáculos
        if (object.userData.physics.type === 'obstacle') {
            // Si está marcado como pequeño y el tanque está lo suficientemente elevado
            if (object.userData.physics.isSmall) {
                // Reducir el umbral para pasar por encima de obstáculos pequeños
                // El tanque solo necesita estar un poco más alto que la parte superior del obstáculo
                const objectTopHeight = object.position.y + object.userData.physics.height / 2;
                if (tankHeight > objectTopHeight - 0.3) { // Permitir un poco de tolerancia
                    return true;
                }
            }
        }
        
        // Para rocas
        if (object.userData.physics.type === 'rock') {
            // Si la roca tiene la propiedad isSmall o su radio es pequeño
            if (object.userData.physics.isSmall || object.userData.physics.boundingRadius < 1) {
                // Calcular la altura de la parte superior de la roca
                let rockTopHeight;
                
                if (object.userData.physics.height) {
                    // Si la roca tiene una altura definida, usarla
                    rockTopHeight = object.position.y + object.userData.physics.height / 2;
                } else {
                    // Si no, usar el radio como aproximación
                    rockTopHeight = object.position.y + object.userData.physics.boundingRadius;
                }
                
                // El tanque puede pasar por encima si está un poco más alto que la roca
                if (tankHeight > rockTopHeight - 0.5) { // Mayor tolerancia para rocas
                    return true;
                }
            }
        }
        
        return false;
    }
    
    updateEnemyTanks(deltaTime) {
        // Actualizar cada tanque enemigo
        for (let i = this.enemyTanks.length - 1; i >= 0; i--) {
            const enemyTank = this.enemyTanks[i];
            
            if (enemyTank.active) {
                // Actualizar el tanque enemigo
                enemyTank.update(deltaTime, this.playerTank, this);
                
                // Actualizar la barra de vida
                if (this.renderer) {
                    enemyTank.updateHealthBar(this.camera, this.renderer);
                }
                
                // Comprobar colisiones con otros tanques y obstáculos
                this.checkEnemyTankCollisions(enemyTank);
            } else {
                // Si el tanque enemigo ha sido destruido, eliminarlo
                console.log("Eliminando tanque enemigo destruido");
                enemyTank.destroy();
                this.enemyTanks.splice(i, 1);
                
                // Aumentar la puntuación
                this.score += 100;
                console.log("Puntuación actual:", this.score);
            }
        }
        
        // Si no quedan enemigos, mostrar victoria
        if (this.enemyTanks.length === 0 && !this.gameOver) {
            this.gameComplete();
        }
    }
    
    checkEnemyTankCollisions(enemyTank) {
        // Obtener la malla del tanque enemigo y su posición
        const tankMesh = enemyTank.getMesh();
        const tankPosition = tankMesh.position.clone();
        
        // Radio de colisión del tanque
        const tankRadius = 2.2;
        
        // Comprobar colisiones con rocas y edificios
        const collidableObjects = [...this.rocks, ...this.buildings.map(building => building.getMesh())];
        
        for (const object of collidableObjects) {
            // Verificar que el objeto tiene propiedades de física
            if (!object.userData.physics || !object.userData.physics.boundingRadius) continue;
            
            // Calcular distancia entre el tanque y el objeto
            const objectPosition = object.position;
            const dx = tankPosition.x - objectPosition.x;
            const dz = tankPosition.z - objectPosition.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Comprobar si hay colisión
            const minDistance = tankRadius + object.userData.physics.boundingRadius;
            if (distance < minDistance) {
                // Calcular vector de desplazamiento
                const overlap = minDistance - distance;
                const direction = new THREE.Vector3(dx, 0, dz).normalize();
                
                // Desplazar el tanque fuera del objeto
                tankMesh.position.x += direction.x * overlap * 0.5;
                tankMesh.position.z += direction.z * overlap * 0.5;
                
                // Reducir la velocidad del tanque
                enemyTank.reduceSpeed(0.5);
            }
        }
        
        // Comprobar colisiones con el tanque del jugador
        if (this.playerTank && this.playerTank.active) {
            const playerPosition = this.playerTank.getMesh().position;
            const dx = tankPosition.x - playerPosition.x;
            const dz = tankPosition.z - playerPosition.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Comprobar si hay colisión
            const minDistance = tankRadius + 2.2; // Radio del tanque del jugador
            if (distance < minDistance) {
                // Calcular vector de desplazamiento
                const overlap = minDistance - distance;
                const direction = new THREE.Vector3(dx, 0, dz).normalize();
                
                // Desplazar ambos tanques
                tankMesh.position.x += direction.x * overlap * 0.5;
                tankMesh.position.z += direction.z * overlap * 0.5;
                
                this.playerTank.getMesh().position.x -= direction.x * overlap * 0.5;
                this.playerTank.getMesh().position.z -= direction.z * overlap * 0.5;
                
                // Reducir la velocidad de ambos tanques
                enemyTank.reduceSpeed(0.5);
                this.playerTank.reduceSpeed(0.5);
            }
        }
    }
    
    checkProjectileCollisions(projectile) {
        if (!projectile.active) return;

        const projectilePosition = projectile.mesh.position;
        const projectileRadius = projectile.mesh.geometry.parameters.radius || 1.5;
        const explosionScale = projectileRadius * 3;

        // Comprobar colisiones con el terreno
        if (this.terrain) {
            const terrainHeight = this.terrain.getHeightAt(projectilePosition.x, projectilePosition.z);
            if (projectilePosition.y < terrainHeight) {
                console.log("Proyectil impacta con el terreno");
                this.createExplosion(projectilePosition.x, terrainHeight, projectilePosition.z, explosionScale);
                projectile.hit();
                return;
            }
        }
        
        // Comprobar colisiones con edificios
        for (const building of this.buildings) {
            if (!building.mesh) continue;
            
            const buildingBox = new THREE.Box3().setFromObject(building.mesh);
            const projectileSphere = new THREE.Sphere(projectilePosition.clone(), projectileRadius);
            
            if (buildingBox.intersectsSphere(projectileSphere)) {
                console.log("Proyectil impacta con un edificio");
                this.createExplosion(
                    projectilePosition.x,
                    projectilePosition.y,
                    projectilePosition.z,
                    explosionScale * 1.5
                );
                projectile.hit();
                return;
            }
        }

        // Comprobar colisión con el tanque del jugador solo si el proyectil no es del jugador
        if (this.playerTank && this.playerTank.active && projectile.sourceId !== 'player') {
            const playerBox = new THREE.Box3().setFromObject(this.playerTank.getMesh());
            const projectileSphere = new THREE.Sphere(projectilePosition.clone(), projectileRadius);
            
            if (playerBox.intersectsSphere(projectileSphere)) {
                console.log("¡Impacto directo en el jugador!");
                this.createExplosion(
                    projectilePosition.x,
                    projectilePosition.y,
                    projectilePosition.z,
                    explosionScale * 1.8
                );
                const damage = projectile.damage || 20;
                this.playerTank.takeDamage(damage);
                projectile.hit();
                return;
            }
        }

        // Comprobar colisiones con tanques enemigos solo si el proyectil es del jugador
        if (projectile.sourceId === 'player') {
            for (const enemyTank of this.enemyTanks) {
                if (!enemyTank.active) continue;

                const enemyBox = new THREE.Box3().setFromObject(enemyTank.tankGroup);
                const projectileSphere = new THREE.Sphere(projectilePosition.clone(), projectileRadius);
                
                if (enemyBox.intersectsSphere(projectileSphere)) {
                    console.log("¡Impacto directo en enemigo!");
                    this.createExplosion(
                        projectilePosition.x,
                        projectilePosition.y,
                        projectilePosition.z,
                        explosionScale * 1.8
                    );
                    const damage = projectile.damage || 20;
                    enemyTank.takeDamage(damage);
                    projectile.hit();
                    return;
                }
            }
        }
    }
    
    createExplosion(x, y, z, size = 1) {
        // Aumentar el tamaño base de la explosión
        const baseSize = 1.5; // Aumentado de 0.5 a 1.5
        
        // Crear una explosión más grande y vistosa
        const explosionGeometry = new THREE.SphereGeometry(baseSize * size, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff9500,
            transparent: true,
            opacity: 1
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.set(x, y, z);
        this.scene.add(explosion);
        
        // Añadir luz más intensa a la explosión
        const explosionLight = new THREE.PointLight(0xff5500, 8, 15 * size); // Intensidad aumentada de 5 a 8, rango de 10 a 15
        explosionLight.position.set(x, y, z);
        this.scene.add(explosionLight);
        
        // Añadir una segunda luz para más efecto
        const secondaryLight = new THREE.PointLight(0xffff00, 5, 10 * size);
        secondaryLight.position.set(x, y, z);
        this.scene.add(secondaryLight);
        
        // Animar la explosión
        const startTime = Date.now();
        const duration = 1200; // duración en milisegundos (aumentada de 1000 a 1200)
        const maxScale = 4 * size; // Tamaño máximo de la explosión (aumentado de 3 a 4)
        
        const animateExplosion = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Escalar la explosión con una curva más dinámica
            const scale = maxScale * Math.sin(progress * Math.PI * 0.5);
            explosion.scale.set(scale, scale, scale);
            
            // Reducir la opacidad gradualmente con una curva más suave
            explosionMaterial.opacity = 1 - (progress * progress);
            
            // Reducir la intensidad de las luces
            explosionLight.intensity = 8 * (1 - progress);
            secondaryLight.intensity = 5 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animateExplosion);
            } else {
                // Eliminar la explosión y las luces cuando termina la animación
                this.scene.remove(explosion);
                this.scene.remove(explosionLight);
                this.scene.remove(secondaryLight);
                explosionGeometry.dispose();
                explosionMaterial.dispose();
            }
        };
        
        // Iniciar la animación
        animateExplosion();
    }
    
    showGameOver() {
        // Crear un elemento para mostrar el mensaje de Game Over
        const gameOverElement = document.createElement('div');
        gameOverElement.style.position = 'absolute';
        gameOverElement.style.top = '50%';
        gameOverElement.style.left = '50%';
        gameOverElement.style.transform = 'translate(-50%, -50%)';
        gameOverElement.style.color = '#ff0000';
        gameOverElement.style.fontSize = '48px';
        gameOverElement.style.fontWeight = 'bold';
        gameOverElement.style.textShadow = '2px 2px 4px #000';
        gameOverElement.style.fontFamily = 'Arial, sans-serif';
        gameOverElement.style.zIndex = '1000';
        gameOverElement.textContent = '¡GAME OVER!';
        
        // Añadir al DOM
        document.body.appendChild(gameOverElement);
        
        // Ocultar la barra de vida del jugador
        if (this.playerHealthBar) {
            this.playerHealthBar.hide();
        }
        
        // Ocultar el radar
        if (this.radar && this.radar.radarContainer) {
            this.radar.radarContainer.style.display = 'none';
        }
    }
    
    gameComplete() {
        // Crear un elemento para mostrar el mensaje de Victoria
        const victoryElement = document.createElement('div');
        victoryElement.style.position = 'absolute';
        victoryElement.style.top = '50%';
        victoryElement.style.left = '50%';
        victoryElement.style.transform = 'translate(-50%, -50%)';
        victoryElement.style.color = '#00ff00';
        victoryElement.style.fontSize = '48px';
        victoryElement.style.fontWeight = 'bold';
        victoryElement.style.textShadow = '2px 2px 4px #000';
        victoryElement.style.fontFamily = 'Arial, sans-serif';
        victoryElement.style.zIndex = '1000';
        victoryElement.textContent = '¡VICTORIA!';
        
        // Añadir al DOM
        document.body.appendChild(victoryElement);
        
        // Mostrar la puntuación
        const scoreElement = document.createElement('div');
        scoreElement.style.position = 'absolute';
        scoreElement.style.top = '60%';
        scoreElement.style.left = '50%';
        scoreElement.style.transform = 'translate(-50%, -50%)';
        scoreElement.style.color = '#ffffff';
        scoreElement.style.fontSize = '24px';
        scoreElement.style.fontWeight = 'bold';
        scoreElement.style.textShadow = '2px 2px 4px #000';
        scoreElement.style.fontFamily = 'Arial, sans-serif';
        scoreElement.style.zIndex = '1000';
        scoreElement.textContent = `Puntuación: ${this.score}`;
        
        // Añadir al DOM
        document.body.appendChild(scoreElement);
        
        // Ocultar el radar
        if (this.radar && this.radar.radarContainer) {
            this.radar.radarContainer.style.display = 'none';
        }
        
        // Marcar el juego como completado
        this.gameOver = true;
    }
    
    setRenderer(renderer) {
        this.renderer = renderer;
    }
    
    // Método para limpiar recursos al reiniciar o finalizar el juego
    cleanup() {
        // Limpiar pellets
        for (const pellet of this.pellets) {
            pellet.dispose();
        }
        this.pellets = [];
        
        // ... existing cleanup code ...
    }
}

