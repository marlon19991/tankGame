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
        
        // Estado del juego
        this.score = 0;
        this.gameOver = false;
        
        // Controlador de entrada
        this.inputController = new InputController();
        
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
        
        // Configurar cámara para seguir al tanque
        this.setupCamera();
        
        // Crear obstáculos
        this.createObstacles();
        
        // Crear tanques enemigos
        this.createEnemyTanks();
        
        // Obtener las rocas del terreno para la detección de colisiones
        this.rocks = this.terrain.rocks || [];
        
        console.log("Juego inicializado correctamente");
    }
    
    setupCamera() {
        // Configurar la cámara para seguir al tanque desde atrás y ligeramente elevada
        // Aumentar la altura y distancia para el mapa más grande
        this.cameraOffset = new THREE.Vector3(0, 12, 20);
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
    }
    
    createObstacles() {
        // Crear obstáculos distribuidos por el mapa más grande
        const obstacleCount = 30; // Más obstáculos para el mapa grande
        
        for (let i = 0; i < obstacleCount; i++) {
            // Posición aleatoria dentro del mapa
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 80; // Distribuir entre 20 y 100 unidades del centro
            
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            const obstacle = this.createObstacle(x, z);
            this.obstacles.push(obstacle);
        }
        
        console.log(`Creados ${this.obstacles.length} obstáculos`);
    }
    
    createObstacle(x, z) {
        // Determinar aleatoriamente si es un obstáculo grande o pequeño
        const isSmall = Math.random() < 0.4; // 40% de probabilidad de ser pequeño
        
        // Dimensiones basadas en el tamaño
        const width = isSmall ? 2 : 3;
        const height = isSmall ? 1 : 3;
        const depth = isSmall ? 2 : 3;
        
        // Obtener la altura del terreno en esta posición
        const terrainHeight = this.terrain.getHeightAt(x, z);
        
        // Crear geometría del obstáculo
        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        // Color basado en el tamaño
        const color = isSmall ? 0xA0522D : 0x8B4513; // Más claro para los pequeños
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8
        });
        
        const obstacle = new THREE.Mesh(geometry, material);
        
        // Posicionar el obstáculo sobre el terreno con desniveles
        obstacle.position.set(x, terrainHeight + height/2, z);
        
        // Adaptar la rotación del obstáculo a la pendiente del terreno
        if (!isSmall) { // Solo adaptar los obstáculos grandes a la pendiente
            // Obtener alturas en puntos cercanos para calcular la pendiente
            const stepSize = 1.0;
            const heightX1 = this.terrain.getHeightAt(x - stepSize, z);
            const heightX2 = this.terrain.getHeightAt(x + stepSize, z);
            const heightZ1 = this.terrain.getHeightAt(x, z - stepSize);
            const heightZ2 = this.terrain.getHeightAt(x, z + stepSize);
            
            // Calcular las pendientes en X y Z
            const slopeX = (heightX2 - heightX1) / (2 * stepSize);
            const slopeZ = (heightZ2 - heightZ1) / (2 * stepSize);
            
            // Aplicar rotación basada en la pendiente si es significativa
            if (Math.abs(slopeX) > 0.05 || Math.abs(slopeZ) > 0.05) {
                obstacle.rotation.x = Math.atan(slopeZ);
                obstacle.rotation.z = -Math.atan(slopeX);
            }
        } else {
            // Para obstáculos pequeños, añadir una ligera rotación aleatoria
            obstacle.rotation.y = Math.random() * Math.PI * 2;
        }
        
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        
        // Añadir física al obstáculo
        obstacle.userData.physics = {
            type: 'obstacle',
            boundingRadius: Math.max(width, depth) / 2, // Radio basado en las dimensiones
            isSmall: isSmall, // Marcar si es pequeño
            height: height // Guardar la altura para comprobar si el tanque puede pasar por encima
        };
        
        this.scene.add(obstacle);
        return obstacle;
    }
    
    createEnemyTanks() {
        // Crear más tanques enemigos distribuidos por el mapa más grande
        const enemyCount = 8; // Más enemigos para el mapa grande
        this.enemyTanks = [];
        
        for (let i = 0; i < enemyCount; i++) {
            // Distribuir los tanques en círculos concéntricos alrededor del centro
            const angle = (i / enemyCount) * Math.PI * 2;
            const distance = 40 + (i % 3) * 30; // Distribuir en diferentes anillos
            
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            const enemyTank = new EnemyTank(this.scene, x, 1, z);
            this.enemyTanks.push(enemyTank);
        }
        
        console.log(`Creados ${this.enemyTanks.length} tanques enemigos`);
    }
    
    update(deltaTime) {
        if (this.gameOver) return;
        
        // Actualizar entrada del usuario
        this.inputController.update();
        
        // Actualizar tanque del jugador
        if (this.playerTank && this.playerTank.active) {
            this.playerTank.update(deltaTime, this.inputController, this);
            
            // Comprobar colisiones del tanque con obstáculos
            this.checkTankCollisions();
            
            // Actualizar la barra de vida del jugador
            this.playerHealthBar.updateHealth(this.playerTank.health);
        } else if (this.playerTank && !this.playerTank.active) {
            // Si el jugador ha sido destruido, mostrar game over
            this.gameOver = true;
            this.showGameOver();
        }
        
        // Actualizar tanques enemigos
        this.updateEnemyTanks(deltaTime);
        
        // Actualizar proyectiles
        this.updateProjectiles(deltaTime);
        
        // Actualizar posición de la cámara para seguir al tanque
        this.updateCamera();
        
        // Depuración
        if (Math.random() < 0.01) { // Aproximadamente cada 100 frames
            console.log(`Estado del juego: ${this.enemyTanks.length} enemigos, ${this.projectiles.length} proyectiles`);
        }
    }
    
    updateCamera() {
        if (!this.playerTank) return;
        
        // Obtener la dirección a la que mira el tanque
        const tankDirection = this.playerTank.getDirection();
        
        // Calcular posición de la cámara basada en la posición del tanque
        const tankPos = this.playerTank.getMesh().position;
        
        // Calcular el ángulo de rotación en Y basado en la dirección del tanque
        const rotationY = Math.atan2(tankDirection.x, tankDirection.z);
        
        // Ajustar el offset basado en la dirección del tanque
        const rotatedOffset = this.cameraOffset.clone();
        rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
        
        // Suavizar el movimiento de la cámara para evitar cambios bruscos
        // Calcular la nueva posición de la cámara
        const targetCameraPosition = new THREE.Vector3().copy(tankPos).add(rotatedOffset);
        
        // Interpolar suavemente entre la posición actual y la nueva posición
        this.camera.position.lerp(targetCameraPosition, 0.1);
        
        // La cámara mira ligeramente por encima del tanque
        this.cameraTarget.copy(tankPos).add(new THREE.Vector3(0, 2, 0));
        this.camera.lookAt(this.cameraTarget);
    }
    
    fireProjectile() {
        if (!this.playerTank) return;
        
        const projectile = this.playerTank.fire();
        if (projectile) {
            this.projectiles.push(projectile);
        }
    }
    
    addProjectile(projectile) {
        if (projectile) {
            this.projectiles.push(projectile);
        }
    }
    
    updateProjectiles(deltaTime) {
        // Recorrer el array de proyectiles en orden inverso para poder eliminar elementos
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Actualizar la posición del proyectil
            const isAlive = projectile.update(deltaTime);
            
            // Comprobar colisiones si el proyectil sigue activo
            if (isAlive) {
                this.checkProjectileCollisions(projectile);
            }
            
            // Si el proyectil ya no está activo (por tiempo o colisión), eliminarlo
            if (!projectile.active) {
                // Asegurarse de que el mesh se elimina de la escena
                if (projectile.mesh) {
                    this.scene.remove(projectile.mesh);
                    
                    // Liberar recursos
                    if (projectile.mesh.geometry) {
                        projectile.mesh.geometry.dispose();
                    }
                    
                    if (projectile.mesh.material) {
                        if (Array.isArray(projectile.mesh.material)) {
                            projectile.mesh.material.forEach(material => material.dispose());
                        } else {
                            projectile.mesh.material.dispose();
                        }
                    }
                }
                
                // Eliminar el proyectil del array
                this.projectiles.splice(i, 1);
            }
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
        
        // Combinar obstáculos y rocas en un solo array para procesar
        const collidableObjects = [...this.obstacles, ...this.rocks];
        
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
        
        // Comprobar colisiones con obstáculos y rocas
        const collidableObjects = [...this.obstacles, ...this.rocks];
        
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
        const projectileRadius = 0.3; // Aumentar el radio de colisión del proyectil
        
        // Comprobar colisiones con obstáculos
        for (const obstacle of this.obstacles) {
            const obstaclePosition = obstacle.position;
            const obstacleRadius = obstacle.userData.physics.boundingRadius;
            
            // Calcular distancia
            const dx = obstaclePosition.x - projectilePosition.x;
            const dy = obstaclePosition.y - projectilePosition.y;
            const dz = obstaclePosition.z - projectilePosition.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Si hay colisión
            if (distance < (projectileRadius + obstacleRadius)) {
                projectile.hit();
                this.createExplosion(projectilePosition.x, projectilePosition.y, projectilePosition.z);
                console.log("Proyectil impacta con obstáculo");
                return; // Salir después de la primera colisión
            }
        }
        
        // Comprobar colisiones con tanques enemigos
        for (const enemyTank of this.enemyTanks) {
            if (!enemyTank.active) continue;
            
            const tankPosition = enemyTank.getMesh().position;
            const tankRadius = 2.5; // Aumentar el radio de colisión del tanque
            
            // Calcular distancia
            const dx = tankPosition.x - projectilePosition.x;
            const dy = tankPosition.y - projectilePosition.y;
            const dz = tankPosition.z - projectilePosition.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Si hay colisión
            if (distance < (projectileRadius + tankRadius)) {
                projectile.hit();
                this.createExplosion(projectilePosition.x, projectilePosition.y, projectilePosition.z);
                
                // Infligir daño al tanque enemigo
                enemyTank.takeDamage(20);
                console.log("Proyectil impacta con tanque enemigo. Salud restante:", enemyTank.health);
                return; // Salir después de la primera colisión
            }
        }
        
        // Comprobar colisiones con el tanque del jugador
        if (this.playerTank && this.playerTank.active) {
            const tankPosition = this.playerTank.getMesh().position;
            const tankRadius = 2.5; // Aumentar el radio de colisión del tanque
            
            // Calcular distancia
            const dx = tankPosition.x - projectilePosition.x;
            const dy = tankPosition.y - projectilePosition.y;
            const dz = tankPosition.z - projectilePosition.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Si hay colisión
            if (distance < (projectileRadius + tankRadius)) {
                projectile.hit();
                this.createExplosion(projectilePosition.x, projectilePosition.y, projectilePosition.z);
                
                // Infligir daño al tanque del jugador
                this.playerTank.takeDamage(10);
                console.log("Proyectil impacta con tanque del jugador. Salud restante:", this.playerTank.health);
                return; // Salir después de la primera colisión
            }
        }
    }
    
    createExplosion(x, y, z) {
        // Crear una explosión más grande y vistosa
        const explosionGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff9500,
            transparent: true,
            opacity: 1
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.set(x, y, z);
        this.scene.add(explosion);
        
        // Añadir luz a la explosión
        const explosionLight = new THREE.PointLight(0xff5500, 5, 10);
        explosionLight.position.set(x, y, z);
        this.scene.add(explosionLight);
        
        // Animar la explosión
        const startTime = Date.now();
        const duration = 1000; // duración en milisegundos
        const maxScale = 5; // tamaño máximo de la explosión
        
        const animateExplosion = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Escalar la explosión
            const scale = maxScale * progress;
            explosion.scale.set(scale, scale, scale);
            
            // Reducir la opacidad gradualmente
            explosionMaterial.opacity = 1 - progress;
            
            // Reducir la intensidad de la luz
            explosionLight.intensity = 5 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animateExplosion);
            } else {
                // Eliminar la explosión y la luz cuando termina la animación
                this.scene.remove(explosion);
                this.scene.remove(explosionLight);
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
        
        // Marcar el juego como completado
        this.gameOver = true;
    }
    
    setRenderer(renderer) {
        this.renderer = renderer;
    }
}
