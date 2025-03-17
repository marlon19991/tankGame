class Tank {
    constructor(scene, x, y, z) {
        this.scene = scene;
        
        // Propiedades físicas
        this.speed = 0;
        this.maxSpeed = 10; // Será recalculado según la masa
        this.acceleration = 5;
        this.deceleration = 7;
        this.angularSpeed = 0;
        this.maxAngularSpeed = 2; // Será recalculado según la masa
        this.angularAcceleration = 4;
        this.angularDeceleration = 6;
        
        /**
         * Masa del tanque - Propiedad central que determina:
         * - Tamaño visual del tanque
         * - Velocidad de movimiento (inversamente proporcional)
         */
        this.mass = 20; // Valor base de masa (aumentado de 10 a 20)
        this.scaleFactor = 1; // Factor de escala inicial
        this.normalizationFactor = 0.5; // Factor k de normalización para la escala (aumentado de 1/10 a 0.5)
        this.collisionRadius = 3; // Radio para detección de colisiones
        
        // Estado del auto-daño
        this.lastSelfDamageState = false;
        
        // Propiedades de embestida
        this.isRamming = false;
        this.rammingCooldown = 0;
        this.rammingDuration = 5.0; // Duración de la embestida en segundos (aumentado a 5 segundos)
        this.rammingBoost = 1.8;    // Multiplicador de velocidad durante la embestida
        this.rammingCooldownTime = 10.0; // Tiempo de enfriamiento en segundos (aumentado a 10 segundos)
        this.lastRammingState = false;
        this.isInvulnerable = false; // Nueva propiedad para la invulnerabilidad durante la embestida
        
        // Propiedades de la torreta
        this.turretAngle = 0;
        this.turretRotationSpeed = 1.5;
        
        // Propiedades del cañón (elevación vertical)
        this.cannonAngle = 0; // Ángulo de elevación del cañón en radianes
        this.cannonMinAngle = -Math.PI / 9; // Límite inferior (-20 grados para arriba)
        this.cannonMaxAngle = Math.PI / 36; // Límite superior (5 grados para abajo)
        this.cannonRotationSpeed = 1.0; // Velocidad de rotación vertical
        
        // Estado del tanque
        this.health = 100;
        this.lastFireTime = 0;
        this.fireRate = 1; // disparos por segundo
        this.active = true; // Indica si el tanque está activo
        
        // Variables para el manejo de colisiones
        this.collisionCooldown = 0;
        this.lastCollisionTime = 0;
        this.isStuck = false;
        this.stuckCheckCounter = 0;
        this.lastPosition = new THREE.Vector3();
        
        // Crear el modelo del tanque
        this.createTankModel(x, y, z);
        
        // Aplicar la escala inicial basada en la masa
        this.updateScale();
        
        // Calcular la velocidad inicial basada en la masa
        this.updateSpeed();
    }
    
    createTankModel(x, y, z) {
        // Grupo principal del tanque
        this.tankGroup = new THREE.Group();
        this.tankGroup.position.set(x, y, z);
        
        // Crear el cuerpo del tanque
        const bodyGeometry = new THREE.BoxGeometry(4, 1.5, 6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x556B2F, // Verde oliva militar
            roughness: 0.7
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.castShadow = true;
        this.body.receiveShadow = true;
        this.tankGroup.add(this.body);
        
        // Crear la torreta
        const turretGeometry = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
        const turretMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x556B2F, 
            roughness: 0.6
        });
        this.turret = new THREE.Mesh(turretGeometry, turretMaterial);
        this.turret.position.y = 1.25;
        this.turret.castShadow = true;
        this.turret.receiveShadow = true;
        this.tankGroup.add(this.turret);
        
        // Añadir una base para el cañón que se integre mejor con la torreta
        const cannonBaseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
        const cannonBaseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x556B2F, 
            roughness: 0.6
        });
        this.cannonBase = new THREE.Mesh(cannonBaseGeometry, cannonBaseMaterial);
        this.cannonBase.position.z = 0.8;
        this.cannonBase.rotation.x = Math.PI / 2;
        this.turret.add(this.cannonBase);
        
        // Crear el cañón
        const cannonGeometry = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
        // Trasladar el origen de la geometría para que el cañón se extienda hacia adelante desde su base
        cannonGeometry.translate(0, 2, 0);
        const cannonMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            roughness: 0.5
        });
        this.cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
        this.cannon.rotation.x = Math.PI / 2; // Posición inicial horizontal
        this.cannon.position.z = 1.5; // Acercar el cañón a la torreta
        this.cannon.castShadow = true;
        this.cannon.receiveShadow = true;
        
        // Añadir detalles al cañón para que se vea más integrado
        const cannonEndGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 8);
        cannonEndGeometry.translate(0, 3.9, 0); // Colocarlo en el extremo del cañón
        const cannonEndMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222, 
            roughness: 0.4
        });
        const cannonEnd = new THREE.Mesh(cannonEndGeometry, cannonEndMaterial);
        this.cannon.add(cannonEnd);
        
        // Crear un grupo para el cañón que nos permita rotarlo verticalmente
        this.cannonGroup = new THREE.Group();
        this.cannonGroup.add(this.cannon);
        this.turret.add(this.cannonGroup);
        
        // Crear las orugas
        this.createTracks();
        
        // Añadir el tanque a la escena
        this.scene.add(this.tankGroup);
    }
    
    createTracks() {
        const trackGeometry = new THREE.BoxGeometry(1, 0.8, 6);
        const trackMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222, 
            roughness: 0.9
        });
        
        // Oruga izquierda
        this.leftTrack = new THREE.Mesh(trackGeometry, trackMaterial);
        this.leftTrack.position.set(-2, -0.4, 0);
        this.leftTrack.castShadow = true;
        this.leftTrack.receiveShadow = true;
        this.tankGroup.add(this.leftTrack);
        
        // Oruga derecha
        this.rightTrack = new THREE.Mesh(trackGeometry, trackMaterial);
        this.rightTrack.position.set(2, -0.4, 0);
        this.rightTrack.castShadow = true;
        this.rightTrack.receiveShadow = true;
        this.tankGroup.add(this.rightTrack);
    }
    
    update(deltaTime, inputController, gameController) {
        // Actualizar la física del movimiento
        this.updateMovement(deltaTime, inputController);
        
        // Actualizar la rotación de la torreta
        this.updateTurretRotation(deltaTime, inputController);
        
        // Comprobar el disparo
        this.checkFiring(inputController, gameController);
        
        // Variable para rastrear el estado anterior de la tecla de auto-daño
        if (!this.lastSelfDamageState && inputController.isSelfDamagePressed()) {
            // Aplicar daño solo cuando se presiona la tecla (no mientras se mantiene)
            this.takeDamage(10);
            console.log("Auto-daño aplicado. Masa actual:", this.mass.toFixed(2), "Velocidad máxima:", this.maxSpeed.toFixed(2));
        }
        this.lastSelfDamageState = inputController.isSelfDamagePressed();
        
        // Manejar la embestida
        this.updateRamming(deltaTime, inputController);
        
        // Verificar colisiones con otros tanques
        if (gameController && gameController.enemyTanks) {
            // Para el tanque del jugador, verificar colisiones con tanques enemigos
            if (this === gameController.playerTank) {
                this.checkEnemyTankCollisions(gameController.enemyTanks);
            } 
            // Para tanques enemigos, verificar colisiones con el tanque del jugador y otros enemigos
            else {
                const allTanks = [gameController.playerTank, ...gameController.enemyTanks.filter(tank => tank !== this)];
                this.checkEnemyTankCollisions(allTanks);
            }
        }
        
        // Adaptar el tanque a la superficie del terreno
        if (gameController && gameController.terrain) {
            this.adaptToTerrain(gameController.terrain);
        }
    }
    
    /**
     * Actualiza el estado de la embestida
     * @param {number} deltaTime - Tiempo transcurrido desde el último frame
     * @param {InputController} inputController - Controlador de entrada
     */
    updateRamming(deltaTime, inputController) {
        // Actualizar el tiempo de enfriamiento de la embestida
        if (this.rammingCooldown > 0) {
            this.rammingCooldown -= deltaTime;
            // Reducir la frecuencia de los mensajes de log
            if (this.rammingCooldown <= 0) {
                console.log("¡Embestida lista para usar!");
            }
        }
        
        // Verificar si se puede activar la embestida
        if (!this.lastRammingState && inputController.isRammingPressed() && this.rammingCooldown <= 0 && !this.isRamming) {
            // Activar la embestida
            this.isRamming = true;
            this.isInvulnerable = true; // Activar invulnerabilidad
            this.rammingDuration = 5.0; // Reiniciar la duración a 5 segundos
            console.log("¡Embestida activada! Velocidad aumentada temporalmente y modo invulnerable.");
            
            // Efecto visual de inicio de embestida
            this.createRammingStartEffect();
            
            // Efecto visual de invulnerabilidad
            this.createInvulnerabilityEffect();
        }
        
        // Actualizar el estado de la embestida
        if (this.isRamming) {
            this.rammingDuration -= deltaTime;
            
            // Actualizar la UI solo cada 0.25 segundos para reducir la carga
            if (!this.lastUIUpdate || Date.now() - this.lastUIUpdate > 250) {
                // Notificar al GameController para actualizar la UI
                if (this.scene && this.scene.gameController && this.scene.gameController.ui) {
                    this.scene.gameController.ui.updateRammingStatus(true, this.rammingDuration, 0);
                    this.lastUIUpdate = Date.now();
                }
            }
            
            if (this.rammingDuration <= 0) {
                // Desactivar la embestida cuando se acaba el tiempo
                this.isRamming = false;
                this.isInvulnerable = false;
                this.rammingCooldown = this.rammingCooldownTime;
                console.log("Embestida finalizada. Enfriamiento:", this.rammingCooldown.toFixed(1), "segundos");
                
                // Remover efecto visual de invulnerabilidad
                this.removeInvulnerabilityEffect();
                
                // Notificar al GameController para actualizar la UI
                if (this.scene && this.scene.gameController && this.scene.gameController.ui) {
                    this.scene.gameController.ui.updateRammingStatus(false, 0, this.rammingCooldown);
                }
            }
        }
        
        // Actualizar el estado anterior
        this.lastRammingState = inputController.isRammingPressed();
    }
    
    /**
     * Crea un efecto visual al iniciar la embestida
     */
    createRammingStartEffect() {
        // Crear un efecto de estela detrás del tanque
        const position = this.getPosition();
        const direction = this.getDirection().negate(); // Dirección opuesta a la que mira el tanque
        
        // Crear partículas que salen desde la parte trasera del tanque
        // Reducir aún más el número de partículas para mejorar el rendimiento
        const particleCount = 6; // Reducido de 10 a 6
        const particles = [];
        
        // Reutilizar geometrías para todas las partículas
        const particleGeometry = new THREE.SphereGeometry(0.2, 4, 4);
        
        for (let i = 0; i < particleCount; i++) {
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xff3300,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Posicionar la partícula detrás del tanque
            const offset = direction.clone().multiplyScalar(3 + Math.random() * 2);
            particle.position.copy(position).add(offset);
            particle.position.y += 1 + Math.random() * 0.5;
            
            // Dar a la partícula una velocidad basada en la dirección del tanque
            const spreadFactor = 1.5;
            particle.velocity = direction.clone().multiplyScalar(5 + Math.random() * 3);
            particle.velocity.x += (Math.random() - 0.5) * spreadFactor;
            particle.velocity.y += Math.random() * spreadFactor;
            particle.velocity.z += (Math.random() - 0.5) * spreadFactor;
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // Animar las partículas con menos pasos de animación
        const duration = 0.5; // Reducido de 0.6
        let elapsed = 0;
        let lastTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            const deltaTime = Math.min(0.05, (currentTime - lastTime) / 1000); // Limitar deltaTime a 50ms máximo
            lastTime = currentTime;
            
            elapsed += deltaTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Animar las partículas
                for (const particle of particles) {
                    // Actualizar posición
                    particle.position.x += particle.velocity.x * deltaTime;
                    particle.position.y += particle.velocity.y * deltaTime;
                    particle.position.z += particle.velocity.z * deltaTime;
                    
                    // Reducir velocidad
                    particle.velocity.multiplyScalar(0.95);
                    
                    // Reducir opacidad
                    particle.material.opacity -= deltaTime / duration;
                    
                    // Reducir tamaño
                    const scale = 1 - progress * 0.8;
                    particle.scale.set(scale, scale, scale);
                }
                
                // Continuar la animación con menos frecuencia (aproximadamente 20 FPS)
                setTimeout(() => requestAnimationFrame(animate), 50);
            } else {
                // Limpiar partículas
                for (const particle of particles) {
                    this.scene.remove(particle);
                    particle.material.dispose();
                }
                // Limpiar la geometría compartida al final
                particleGeometry.dispose();
            }
        };
        
        // Iniciar la animación
        animate();
    }
    
    /**
     * Crea un efecto visual para la invulnerabilidad
     */
    createInvulnerabilityEffect() {
        // Crear un material brillante para el efecto de invulnerabilidad
        // Reutilizar el material si ya existe a nivel de clase
        if (!this.constructor.invulnerabilityMaterial) {
            this.constructor.invulnerabilityMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.3,
                wireframe: true
            });
        }
        
        // Guardar el material original solo de las partes principales del tanque
        // en lugar de recorrer todos los meshes
        this.originalMaterials = [];
        const mainParts = [this.body, this.turret, this.leftTrack, this.rightTrack];
        
        for (const part of mainParts) {
            if (part && part.material) {
                this.originalMaterials.push({
                    mesh: part,
                    material: part.material
                });
                part.material = this.constructor.invulnerabilityMaterial;
            }
        }
        
        // Añadir un efecto de pulso sutil para la invulnerabilidad
        // que no requiera crear nuevos objetos
        if (!this.invulnerabilityPulse) {
            this.invulnerabilityPulse = {
                active: true,
                intensity: 0.3,
                direction: 0.01,
                update: (deltaTime) => {
                    if (!this.constructor.invulnerabilityMaterial || !this.isInvulnerable) return;
                    
                    // Actualizar la opacidad para crear un efecto de pulso
                    this.constructor.invulnerabilityMaterial.opacity += this.invulnerabilityPulse.direction * deltaTime;
                    
                    // Cambiar la dirección cuando alcanza los límites
                    if (this.constructor.invulnerabilityMaterial.opacity > 0.4) {
                        this.constructor.invulnerabilityMaterial.opacity = 0.4;
                        this.invulnerabilityPulse.direction = -0.01;
                    } else if (this.constructor.invulnerabilityMaterial.opacity < 0.2) {
                        this.constructor.invulnerabilityMaterial.opacity = 0.2;
                        this.invulnerabilityPulse.direction = 0.01;
                    }
                }
            };
            
            // Añadir el actualizador de pulso al bucle de actualización principal
            if (this.scene && this.scene.gameController) {
                this.scene.gameController.addUpdateCallback(this.invulnerabilityPulse.update.bind(this));
            }
        }
    }
    
    /**
     * Remueve el efecto visual de invulnerabilidad
     */
    removeInvulnerabilityEffect() {
        // Restaurar los materiales originales
        if (this.originalMaterials) {
            this.originalMaterials.forEach(item => {
                if (item.mesh) {
                    item.mesh.material = item.material;
                }
            });
            this.originalMaterials = [];
        }
        
        // Desactivar el efecto de pulso
        if (this.invulnerabilityPulse) {
            this.invulnerabilityPulse.active = false;
            
            // Eliminar el callback de actualización si es posible
            if (this.scene && this.scene.gameController) {
                this.scene.gameController.removeUpdateCallback(this.invulnerabilityPulse.update.bind(this));
            }
        }
    }
    
    adaptToTerrain(terrain) {
        // Limitar la frecuencia de adaptación al terreno
        if (!this.lastTerrainUpdate) {
            this.lastTerrainUpdate = 0;
        }
        
        // Solo actualizar cada 50ms (20 veces por segundo) para mejorar rendimiento pero mantener fluidez
        const currentTime = Date.now();
        if (currentTime - this.lastTerrainUpdate < 50) {
            return;
        }
        this.lastTerrainUpdate = currentTime;
        
        // Obtener la posición actual del tanque
        const position = this.tankGroup.position;
        
        // Obtener la altura del terreno en la posición actual
        const terrainHeight = terrain.getHeightAt(position.x, position.z);
        
        // Comprobar si hay rocas pequeñas debajo del tanque
        let rockHeight = 0;
        if (terrain.rocks && terrain.rocks.length > 0) {
            rockHeight = this.checkForRocksUnderTank(terrain);
        }
        
        // Ajustar la altura del tanque para que esté sobre el terreno o la roca
        // Añadimos un pequeño offset para que las ruedas estén en contacto con el suelo
        const targetHeight = Math.max(terrainHeight, rockHeight) + 1.0;
        
        // Verificar si hay un cambio significativo en la altura
        const heightDifference = targetHeight - position.y;
        
        // Ajustar el factor de interpolación según la magnitud del cambio de altura
        // Para cambios grandes, usar un factor más alto para respuesta más rápida
        let interpolationFactor = 0.1; // Factor base
        
        if (Math.abs(heightDifference) > 2.0) {
            // Para cambios grandes de altura, respuesta más rápida
            interpolationFactor = 0.3;
        } else if (Math.abs(heightDifference) > 1.0) {
            // Para cambios medianos, respuesta intermedia
            interpolationFactor = 0.2;
        }
        
        // Suavizar el movimiento vertical usando interpolación con el factor ajustado
        position.y += heightDifference * interpolationFactor;
        
        // Calcular la normal del terreno para orientar el tanque
        // Siempre calcular la normal para terrenos irregulares, no solo cuando se mueve
        // Obtenemos alturas en puntos cercanos para calcular la pendiente
        const stepSize = 1.0;
        const heightX1 = terrain.getHeightAt(position.x - stepSize, position.z);
        const heightX2 = terrain.getHeightAt(position.x + stepSize, position.z);
        const heightZ1 = terrain.getHeightAt(position.x, position.z - stepSize);
        const heightZ2 = terrain.getHeightAt(position.x, position.z + stepSize);
        
        // Calcular las pendientes en X y Z
        const slopeX = (heightX2 - heightX1) / (2 * stepSize);
        const slopeZ = (heightZ2 - heightZ1) / (2 * stepSize);
        
        // Calcular la magnitud de la pendiente
        const slopeMagnitude = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);
        
        // Aplicar inclinación si la pendiente es significativa o si hay un cambio de altura
        if (Math.abs(slopeX) > 0.01 || Math.abs(slopeZ) > 0.01 || Math.abs(heightDifference) > 0.1) {
            // Crear un vector normal al terreno
            const normal = new THREE.Vector3(-slopeX, 1, -slopeZ).normalize();
            
            // Extraer la rotación actual en Y del tanque
            const forward = new THREE.Vector3(0, 0, -1);
            const currentDirection = forward.clone().applyQuaternion(this.tankGroup.quaternion);
            const rotationY = Math.atan2(-currentDirection.x, -currentDirection.z);
            
            // Crear quaternion para la rotación basada en la normal
            const upVector = new THREE.Vector3(0, 1, 0);
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(upVector, normal);
            
            // Crear quaternion para la rotación en Y
            const yQuaternion = new THREE.Quaternion();
            yQuaternion.setFromAxisAngle(upVector, rotationY);
            
            // Combinar ambas rotaciones
            const targetQuaternion = new THREE.Quaternion().multiplyQuaternions(quaternion, yQuaternion);
            
            // Ajustar el factor de interpolación para la rotación según la pendiente
            // Pendientes más pronunciadas requieren una adaptación más rápida
            let rotationFactor = Math.max(0.05, 0.15 / (1 + slopeMagnitude * 3));
            
            // Si el tanque está en movimiento, aumentar la velocidad de adaptación
            if (Math.abs(this.speed) > 1.0) {
                rotationFactor *= 1.5;
            }
            
            // Aplicar la rotación gradualmente
            this.tankGroup.quaternion.slerp(targetQuaternion, rotationFactor);
        } else if (!this.isRamming) {
            // Si el terreno es plano y el tanque no está en modo embestida, solo mantener la rotación en Y
            const forward = new THREE.Vector3(0, 0, -1);
            const currentDirection = forward.clone().applyQuaternion(this.tankGroup.quaternion);
            const rotationY = Math.atan2(-currentDirection.x, -currentDirection.z);
            
            const upVector = new THREE.Vector3(0, 1, 0);
            const yQuaternion = new THREE.Quaternion();
            yQuaternion.setFromAxisAngle(upVector, rotationY);
            this.tankGroup.quaternion.slerp(yQuaternion, 0.1);
        }
        
        // Guardar la altura actual para la próxima comparación
        this.lastHeight = position.y;
    }
    
    checkForRocksUnderTank(terrain) {
        // Radio de detección para rocas bajo el tanque
        // Aumentar el radio de detección para capturar mejor las rocas
        const detectionRadius = 3.5; // Aumentado de 2.5 a 3.5
        const position = this.tankGroup.position;
        
        // Altura máxima encontrada
        let maxRockHeight = 0;
        
        // Optimización: Usar distancia al cuadrado para evitar cálculos de raíz cuadrada
        const detectionRadiusSquared = detectionRadius * detectionRadius;
        
        // Comprobar todas las rocas en el terreno
        for (const rock of terrain.rocks) {
            // Verificar que la roca tiene propiedades de física
            if (!rock.userData.physics) continue;
            
            // Considerar tanto rocas pequeñas como medianas
            // Eliminamos la restricción de solo rocas pequeñas
            
            // Calcular distancia horizontal entre el tanque y la roca usando distancia al cuadrado
            const dx = position.x - rock.position.x;
            const dz = position.z - rock.position.z;
            const distanceSquared = dx * dx + dz * dz;
            
            // Si la roca está dentro del radio de detección
            if (distanceSquared < detectionRadiusSquared) {
                // Calcular la altura de la roca (parte superior)
                // Usar la altura real de la roca si está disponible, o un valor estimado
                let rockTopHeight;
                
                if (rock.userData.physics.height) {
                    rockTopHeight = rock.position.y + rock.userData.physics.height / 2;
                } else {
                    // Si no hay altura definida, estimar basado en la escala del objeto
                    const scale = rock.scale.y || 1;
                    rockTopHeight = rock.position.y + scale * 0.5;
                }
                
                // Ajustar la altura según la distancia al centro de la roca
                // Las rocas más cercanas al centro del tanque tienen más influencia
                const distanceFactor = 1 - (distanceSquared / detectionRadiusSquared);
                const effectiveHeight = rockTopHeight * distanceFactor;
                
                // Actualizar la altura máxima si esta roca es más alta
                if (effectiveHeight > maxRockHeight) {
                    maxRockHeight = effectiveHeight;
                }
            }
        }
        
        return maxRockHeight;
    }
    
    updateMovement(deltaTime, inputController) {
        // Actualizar el tiempo de enfriamiento de colisiones
        if (this.collisionCooldown > 0) {
            this.collisionCooldown -= deltaTime;
        }
        
        // Guardar la posición actual para detectar si estamos atascados
        // Optimización: Reducir la frecuencia de comprobación de atasco
        this.stuckCheckCounter += deltaTime;
        if (this.stuckCheckCounter >= 0.5) { // Comprobar cada medio segundo
            this.stuckCheckCounter = 0;
            
            // Guardar la posición actual solo cuando sea necesario
            const currentPosition = this.tankGroup.position.clone();
            
            const movementDistance = currentPosition.distanceTo(this.lastPosition);
            const shouldBeMoving = Math.abs(this.speed) > 0.5;
            
            // Si debería estar moviéndose pero no lo hace, puede estar atascado
            if (shouldBeMoving && movementDistance < 0.05) {
                if (!this.isStuck) {
                    this.isStuck = true;
                    console.log("El tanque parece estar atascado, intentando liberarlo...");
                    
                    // Intentar liberarlo cambiando la dirección
                    this.speed = -this.speed * 0.5; // Invertir dirección con menos velocidad
                } else {
                    // Si ya está marcado como atascado, intentar una maniobra más drástica
                    // Optimización: Usar una rotación fija en lugar de aleatoria
                    this.tankGroup.rotation.y += (this.isStuck % 2 === 0) ? 0.2 : -0.2;
                    this.speed = (this.isStuck % 2 === 0 ? 1 : -1) * this.maxSpeed * 0.3;
                    this.isStuck++; // Incrementar para alternar la dirección
                }
            } else if (this.isStuck && movementDistance > 0.1) {
                // Si ya no está atascado, restablecer el estado
                this.isStuck = false;
            }
            
            // Actualizar la última posición conocida
            this.lastPosition.copy(currentPosition);
        }
        
        // Acelerar/decelerar
        if (inputController.isMovingForward()) {
            this.speed += this.acceleration * deltaTime;
            
            // Aplicar impulso adicional si está en modo embestida
            const maxSpeedMultiplier = this.isRamming ? this.rammingBoost : 1.0;
            const effectiveMaxSpeed = this.maxSpeed * maxSpeedMultiplier;
            
            if (this.speed > effectiveMaxSpeed) this.speed = effectiveMaxSpeed;
        } else if (inputController.isMovingBackward()) {
            this.speed -= this.acceleration * deltaTime;
            if (this.speed < -this.maxSpeed / 1.5) this.speed = -this.maxSpeed / 1.5;
        } else {
            // Decelerar si no hay input
            if (this.speed > 0) {
                this.speed -= this.deceleration * deltaTime;
                if (this.speed < 0) this.speed = 0;
            } else if (this.speed < 0) {
                this.speed += this.deceleration * deltaTime;
                if (this.speed > 0) this.speed = 0;
            }
        }
        
        // Rotar izquierda/derecha
        if (inputController.isTurningLeft()) {
            this.angularSpeed += this.angularAcceleration * deltaTime;
            if (this.angularSpeed > this.maxAngularSpeed) this.angularSpeed = this.maxAngularSpeed;
        } else if (inputController.isTurningRight()) {
            this.angularSpeed -= this.angularAcceleration * deltaTime;
            if (this.angularSpeed < -this.maxAngularSpeed) this.angularSpeed = -this.maxAngularSpeed;
        } else {
            // Decelerar la rotación si no hay input
            if (this.angularSpeed > 0) {
                this.angularSpeed -= this.angularDeceleration * deltaTime;
                if (this.angularSpeed < 0) this.angularSpeed = 0;
            } else if (this.angularSpeed < 0) {
                this.angularSpeed += this.angularDeceleration * deltaTime;
                if (this.angularSpeed > 0) this.angularSpeed = 0;
            }
        }
        
        // Aplicar rotación usando quaternions en lugar de modificar directamente rotation.y
        // Esto permite que la rotación funcione correctamente incluso en terrenos irregulares
        if (this.angularSpeed !== 0) {
            // Crear un quaternion para la rotación en Y
            const rotationDelta = this.angularSpeed * deltaTime;
            
            // Optimización: Reutilizar el vector del eje Y
            if (!this.yAxis) {
                this.yAxis = new THREE.Vector3(0, 1, 0);
            }
            
            // Optimización: Reutilizar el quaternion
            if (!this.rotationQuaternion) {
                this.rotationQuaternion = new THREE.Quaternion();
            }
            
            this.rotationQuaternion.setFromAxisAngle(this.yAxis, rotationDelta);
            
            // Aplicar la rotación al quaternion actual del tanque
            this.tankGroup.quaternion.premultiply(this.rotationQuaternion);
        }
        
        // Calcular el movimiento basado en la rotación actual
        // Optimización: Calcular la dirección solo si es necesario
        if (this.speed !== 0) {
            const direction = this.getDirection();
            
            // Verificar si hay un enfriamiento de colisión activo
            const speedMultiplier = this.collisionCooldown > 0 ? 0.3 : 1.0;
            
            // Aplicar movimiento en la dirección del tanque con posible reducción por colisión reciente
            const effectiveSpeed = this.speed * speedMultiplier;
            
            // Obtener la posición actual
            const currentPosition = this.tankGroup.position.clone();
            
            // Calcular la nueva posición
            const newPosition = currentPosition.clone().add(
                direction.clone().multiplyScalar(effectiveSpeed * deltaTime)
            );
            
            // Verificar si hay terreno disponible
            if (this.scene && this.scene.gameController && this.scene.gameController.terrain) {
                const terrain = this.scene.gameController.terrain;
                
                // Obtener la altura del terreno en la nueva posición
                const terrainHeight = terrain.getHeightAt(newPosition.x, newPosition.z);
                
                // Comprobar si hay rocas en la nueva posición
                let rockHeight = 0;
                if (terrain.rocks && terrain.rocks.length > 0) {
                    // Crear una posición temporal para verificar rocas
                    const tempPosition = this.tankGroup.position.clone();
                    tempPosition.x = newPosition.x;
                    tempPosition.z = newPosition.z;
                    
                    // Guardar la posición original
                    const originalPosition = this.tankGroup.position.clone();
                    
                    // Temporalmente mover el tanque a la nueva posición para verificar rocas
                    this.tankGroup.position.copy(tempPosition);
                    rockHeight = this.checkForRocksUnderTank(terrain);
                    
                    // Restaurar la posición original
                    this.tankGroup.position.copy(originalPosition);
                }
                
                // Calcular la altura máxima del terreno o rocas
                const targetHeight = Math.max(terrainHeight, rockHeight) + 1.0;
                
                // Calcular la diferencia de altura
                const heightDifference = targetHeight - currentPosition.y;
                
                // Verificar si la pendiente es demasiado empinada para subir
                // Limitar la pendiente máxima que el tanque puede subir
                const horizontalDistance = Math.sqrt(
                    Math.pow(newPosition.x - currentPosition.x, 2) +
                    Math.pow(newPosition.z - currentPosition.z, 2)
                );
                
                // Calcular el ángulo de la pendiente en radianes
                const slopeAngle = Math.atan2(heightDifference, horizontalDistance);
                const slopeAngleDegrees = slopeAngle * (180 / Math.PI);
                
                // Definir el ángulo máximo que el tanque puede subir (en grados)
                // Ajustar según la masa del tanque - tanques más pesados tienen más dificultad
                const maxClimbAngle = 35 - (this.mass / 20) * 5; // Entre 30° y 35° dependiendo de la masa
                
                // Si la pendiente es demasiado empinada, reducir la velocidad o detener el movimiento
                if (Math.abs(slopeAngleDegrees) > maxClimbAngle && heightDifference > 0) {
                    // Pendiente demasiado empinada para subir - reducir velocidad significativamente
                    const reductionFactor = Math.max(0.1, 1 - (Math.abs(slopeAngleDegrees) - maxClimbAngle) / 10);
                    
                    // Aplicar movimiento con velocidad reducida
                    this.tankGroup.position.x += direction.x * effectiveSpeed * deltaTime * reductionFactor;
                    this.tankGroup.position.z += direction.z * effectiveSpeed * deltaTime * reductionFactor;
                    
                    // Si la pendiente es extremadamente empinada, detener el tanque
                    if (Math.abs(slopeAngleDegrees) > maxClimbAngle + 15) {
                        this.speed *= 0.8; // Reducir velocidad rápidamente
                    }
                } else {
                    // Pendiente normal - aplicar movimiento completo
                    this.tankGroup.position.x += direction.x * effectiveSpeed * deltaTime;
                    this.tankGroup.position.z += direction.z * effectiveSpeed * deltaTime;
                    
                    // Permitir que el componente Y de la dirección afecte ligeramente la altura
                    // Esto ayuda a subir/bajar pendientes más suavemente
                    if (direction.y !== 0) {
                        this.tankGroup.position.y += direction.y * effectiveSpeed * deltaTime * 0.3;
                    }
                }
            } else {
                // Si no hay terreno disponible, usar el comportamiento original
                this.tankGroup.position.x += direction.x * effectiveSpeed * deltaTime;
                this.tankGroup.position.z += direction.z * effectiveSpeed * deltaTime;
            }
        }
        
        // Crear efecto de estela durante la embestida
        // Optimización: Solo crear efectos si la velocidad es significativa
        if (this.isRamming && Math.abs(this.speed) > this.maxSpeed * 0.7) {
            this.createRammingTrailEffect(deltaTime);
        }
    }
    
    /**
     * Crea un efecto de estela durante la embestida
     * @param {number} deltaTime - Tiempo transcurrido desde el último frame
     */
    createRammingTrailEffect(deltaTime) {
        // Reducir la frecuencia de creación de partículas
        // Solo crear partículas cada cierto tiempo para mejorar el rendimiento
        if (!this.lastTrailEffect) {
            this.lastTrailEffect = 0;
        }
        
        this.lastTrailEffect += deltaTime;
        // Crear partículas solo cada 0.2 segundos (5 veces por segundo)
        if (this.lastTrailEffect < 0.2) return;
        this.lastTrailEffect = 0;
        
        const position = this.getPosition();
        const direction = this.getDirection().negate(); // Dirección opuesta a la que mira el tanque
        
        // Crear una partícula de estela
        const particleGeometry = new THREE.SphereGeometry(0.15, 4, 4); // Reducido de 8,8 a 4,4
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.6
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Posicionar la partícula detrás del tanque
        const offset = direction.clone().multiplyScalar(3);
        offset.x += (Math.random() - 0.5) * 1.5;
        offset.z += (Math.random() - 0.5) * 1.5;
        particle.position.copy(position).add(offset);
        particle.position.y += 0.5 + Math.random() * 0.5;
        
        this.scene.add(particle);
        
        // Animar la partícula con menos pasos de animación
        const duration = 0.4; // Reducido de 0.5
        let elapsed = 0;
        
        const animate = (dt) => {
            elapsed += dt;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Reducir opacidad
                particle.material.opacity = 0.6 * (1 - progress);
                
                // Reducir tamaño
                const scale = 1 - progress * 0.7;
                particle.scale.set(scale, scale, scale);
                
                // Continuar la animación con menos frecuencia
                requestAnimationFrame(() => animate(Math.min(1/30, dt))); // Reducido de 1/60 a 1/30
            } else {
                // Limpiar la partícula
                this.scene.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
            }
        };
        
        // Iniciar la animación
        animate(1/30); // Reducido de deltaTime a 1/30
    }
    
    updateTurretRotation(deltaTime, inputController) {
        // Rotar la torreta horizontalmente
        if (inputController.isTurretTurningLeft()) {
            this.turretAngle += this.turretRotationSpeed * deltaTime;
        } else if (inputController.isTurretTurningRight()) {
            this.turretAngle -= this.turretRotationSpeed * deltaTime;
        }
        
        // Aplicar la rotación horizontal de la torreta
        this.turret.rotation.y = this.turretAngle;
        
        // Mover el cañón verticalmente
        if (inputController.isCannonMovingUp()) {
            // Elevar el cañón (reducir el ángulo en X porque el cañón apunta hacia adelante)
            this.cannonAngle -= this.cannonRotationSpeed * deltaTime;
            // Limitar el ángulo máximo de elevación
            if (this.cannonAngle < this.cannonMinAngle) {
                this.cannonAngle = this.cannonMinAngle;
            }
        } else if (inputController.isCannonMovingDown()) {
            // Bajar el cañón (aumentar el ángulo en X)
            this.cannonAngle += this.cannonRotationSpeed * deltaTime;
            // Limitar el ángulo máximo de descenso
            if (this.cannonAngle > this.cannonMaxAngle) {
                this.cannonAngle = this.cannonMaxAngle;
            }
        }
        
        // Aplicar la rotación vertical al cañón
        this.cannonGroup.rotation.x = this.cannonAngle;
    }
    
    checkFiring(inputController, gameController) {
        const currentTime = Date.now() / 1000; // Tiempo actual en segundos
        
        // Comprobar si ha pasado suficiente tiempo desde el último disparo
        if (inputController.isFirePressed() && (currentTime - this.lastFireTime > 1 / this.fireRate)) {
            this.lastFireTime = currentTime;
            
            // Crear un nuevo proyectil y añadirlo al controlador del juego
            const projectile = this.fire();
            if (projectile && gameController) {
                gameController.addProjectile(projectile);
                
                // Reproducir sonido de disparo (opcional)
                // this.playFireSound();
            }
        }
    }
    
    fire() {
        // Verificar si el tanque está activo
        if (!this.active) return null;
        
        // Crear un nuevo proyectil
        // Reutilizar vectores temporales para reducir la creación de objetos
        if (!this._tempMuzzlePosition) {
            this._tempMuzzlePosition = new THREE.Vector3();
            this._tempDirection = new THREE.Vector3(0, 1, 0);
            this._tempQuaternion = new THREE.Quaternion();
        }
        
        // Obtener la posición del cañón
        this._tempMuzzlePosition.set(0, 4, 0).applyMatrix4(this.cannon.matrixWorld);
        
        // Calcular la dirección del disparo correcta teniendo en cuenta la elevación del cañón
        this.cannon.getWorldQuaternion(this._tempQuaternion);
        this._tempDirection.set(0, 1, 0).applyQuaternion(this._tempQuaternion);
        
        // Crear un proyectil con la dirección correcta y la masa del tanque
        const projectile = new Projectile(
            this.scene, 
            this._tempMuzzlePosition.clone(), // Necesitamos clonar para que el proyectil tenga su propia posición
            this._tempDirection.clone(),      // Necesitamos clonar para que el proyectil tenga su propia dirección
            this.mass
        );
        
        // Identificar el origen del proyectil
        projectile.sourceId = this instanceof EnemyTank ? 'enemy' : 'player';
        
        // Calcular el daño basado en la masa del tanque (más masa = más daño)
        // Usando una fórmula que da un daño base de 20 cuando la masa es 20
        projectile.damage = Math.max(5, Math.floor(this.mass));
        
        // Reducir la cantidad de logs para mejorar el rendimiento
        // Solo mostrar logs cada 5 disparos o cuando hay cambios significativos
        if (!this._fireCount) this._fireCount = 0;
        this._fireCount++;
        
        if (this._fireCount % 5 === 0 || Math.abs(this._lastMass - this.mass) > 5) {
            console.log(`Tanque dispara desde (${this._tempMuzzlePosition.x.toFixed(1)}, ${this._tempMuzzlePosition.y.toFixed(1)}, ${this._tempMuzzlePosition.z.toFixed(1)})`);
            console.log(`Ángulo de elevación del cañón: ${(this.cannonAngle * 180 / Math.PI).toFixed(1)} grados`);
            console.log(`Masa del tanque: ${this.mass.toFixed(1)}, Tamaño del proyectil: ${Math.sqrt(this.mass / 20) * 0.3}`);
            console.log(`Origen del proyectil: ${projectile.sourceId}, Daño: ${projectile.damage}`);
            
            this._lastMass = this.mass;
        }
        
        return projectile;
    }
    
    /**
     * Genera pellets en el punto de colisión con la masa perdida
     * @param {THREE.Vector3} position - Posición donde generar los pellets
     * @param {number} totalMass - Masa total a distribuir en pellets
     */
    generatePellets(position, totalMass) {
        // Si la masa es muy pequeña, no generar pellets
        if (totalMass < 0.5) return;
        
        // Limitar la cantidad máxima de pellets para mejorar el rendimiento
        // Calcular cuántos pellets generar (1 pellet por cada 3 unidades de masa)
        const numPellets = Math.min(4, Math.max(1, Math.floor(totalMass / 3))); // Máximo 4 pellets
        const massPerPellet = totalMass / numPellets;
        
        // Generar los pellets
        for (let i = 0; i < numPellets; i++) {
            // Calcular una posición aleatoria alrededor del punto de colisión
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1.5; // Radio máximo reducido de 2 a 1.5 unidades
            
            const pelletPosition = new THREE.Vector3(
                position.x + Math.cos(angle) * radius,
                position.y + 0.5, // Elevar ligeramente sobre el suelo
                position.z + Math.sin(angle) * radius
            );
            
            // Crear el pellet con la masa calculada
            const pellet = new Pellet(this.scene, pelletPosition, massPerPellet);
            
            // Añadir el pellet al controlador del juego si está disponible
            if (this.scene.gameController) {
                this.scene.gameController.addPellet(pellet);
            }
            
            // Reducir la cantidad de logs para mejorar el rendimiento
            if (i === 0) { // Solo registrar el primer pellet
                console.log(`Pellets generados: ${numPellets}, Masa total: ${totalMass.toFixed(2)}, Masa por pellet: ${massPerPellet.toFixed(2)}`);
            }
        }
    }

    takeDamage(amount) {
        // Si el tanque está en modo embestida, no recibir daño
        if (this.isInvulnerable) {
            console.log("Tanque invulnerable durante la embestida - No recibe daño");
            return;
        }
        
        // Asegurarse de que amount es un número válido
        const damageAmount = Number(amount) || 20;
        
        // Aplicar el daño
        this.health = Math.max(0, this.health - damageAmount);
        console.log(`Tanque dañado con ${damageAmount}. Salud restante: ${this.health}`);
        
        // Reducir la masa proporcionalmente al daño recibido (10% del daño)
        const massReduction = damageAmount * 0.1;
        const oldMass = this.mass;
        this.updateMass(Math.max(1, this.mass - massReduction)); // Mínimo de masa = 1
        
        // Registrar la pérdida de masa
        console.log(`Masa reducida de ${oldMass.toFixed(2)} a ${this.mass.toFixed(2)} (pérdida: ${massReduction.toFixed(2)})`);
        
        // Efecto visual de daño (parpadeo rojo más intenso)
        this.flashDamage();
        
        // Si la salud llega a 0, destruir el tanque
        if (this.health <= 0) {
            console.log("¡Tanque destruido!");
            this.active = false;
            // Crear una explosión grande al ser destruido
            if (this.scene) {
                const position = this.tankGroup.position;
                this.createDestructionEffect(position.x, position.y, position.z);
            }
        }
    }
    
    // Método para crear un efecto visual de daño (parpadeo rojo más intenso)
    flashDamage() {
        // Evitar múltiples efectos de daño simultáneos
        if (this.isFlashingDamage) return;
        this.isFlashingDamage = true;
        
        // Crear material rojo brillante para el efecto de daño
        // Reutilizar el material si ya existe
        if (!this.constructor.damageMaterial) {
            this.constructor.damageMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 2.0
            });
        }
        
        // Guardar los materiales originales y aplicar el material de daño
        // Optimización: solo aplicar a las partes principales del tanque
        const originalMaterials = [];
        const mainParts = [this.body, this.turret, this.leftTrack, this.rightTrack];
        
        for (const part of mainParts) {
            if (part && part.material) {
                originalMaterials.push({
                    mesh: part,
                    material: part.material
                });
                part.material = this.constructor.damageMaterial;
            }
        }
        
        // Restaurar los materiales originales después de un breve tiempo
        setTimeout(() => {
            originalMaterials.forEach(item => {
                if (item.mesh) {
                    item.mesh.material = item.material;
                }
            });
            this.isFlashingDamage = false;
        }, 150); // Aumentado de 100ms a 150ms para que sea más visible
    }
    
    // Método para crear el efecto de destrucción
    createDestructionEffect(x, y, z) {
        // Reducir la complejidad de la geometría para mejorar el rendimiento
        const explosionGeometry = new THREE.SphereGeometry(3, 16, 16); // Reducido de 32,32 a 16,16
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff5500,
            transparent: true,
            opacity: 1
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.set(x, y, z);
        this.scene.add(explosion);
        
        // Añadir luz intensa a la explosión
        // Usar una sola luz más intensa en lugar de dos luces
        const explosionLight = new THREE.PointLight(0xff7700, 15, 30);
        explosionLight.position.set(x, y + 0.5, z);
        this.scene.add(explosionLight);
        
        // Crear partículas para simular escombros
        // Reducir el número de partículas para mejorar el rendimiento
        const particleCount = 15; // Reducido de 30 a 15
        const particles = [];
        
        // Reutilizar geometrías para ahorrar memoria
        const smallParticleGeometry = new THREE.SphereGeometry(0.2, 4, 4); // Geometría pequeña simplificada
        const mediumParticleGeometry = new THREE.SphereGeometry(0.3, 4, 4); // Geometría mediana simplificada
        
        for (let i = 0; i < particleCount; i++) {
            // Alternar entre dos tamaños de geometría en lugar de crear una nueva cada vez
            const particleGeometry = i % 2 === 0 ? smallParticleGeometry : mediumParticleGeometry;
            
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xff5500 : 0x333333,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(x, y, z);
            
            // Velocidad y dirección aleatorias para cada partícula
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 15,
                (Math.random() - 0.5) * 10
            );
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // Animar la explosión con menos pasos de animación
        let scale = 1;
        let lastTime = 0;
        
        const animate = () => {
            // Calcular el tiempo transcurrido
            const currentTime = Date.now();
            const deltaTime = (currentTime - lastTime) / 1000; // Convertir a segundos
            lastTime = currentTime;
            
            // Limitar la tasa de actualización para mejorar el rendimiento
            // Expandir la explosión principal
            scale += 0.2;
            explosion.scale.set(scale, scale, scale);
            explosionMaterial.opacity -= 0.03;
            explosionLight.intensity *= 0.95;
            
            // Animar las partículas con menos cálculos
            for (const particle of particles) {
                // Aplicar gravedad
                particle.velocity.y -= 0.4;
                
                // Actualizar posición
                particle.position.x += particle.velocity.x * 0.05;
                particle.position.y += particle.velocity.y * 0.05;
                particle.position.z += particle.velocity.z * 0.05;
                
                // Reducir opacidad
                particle.material.opacity -= 0.02;
                
                // Si la partícula toca el suelo, rebotar con pérdida de energía
                // Solo comprobar si está cerca del suelo para reducir cálculos
                if (particle.position.y < 0.5) {
                    particle.position.y = 0.3;
                    particle.velocity.y = -particle.velocity.y * 0.4; // Rebote con pérdida de energía
                }
            }
            
            if (explosionMaterial.opacity > 0) {
                // Usar setTimeout en lugar de requestAnimationFrame para reducir la tasa de actualización
                setTimeout(animate, 33); // Aproximadamente 30 FPS
            } else {
                // Limpiar recursos
                this.scene.remove(explosion);
                this.scene.remove(explosionLight);
                explosionGeometry.dispose();
                explosionMaterial.dispose();
                
                // Limpiar partículas
                for (const particle of particles) {
                    this.scene.remove(particle);
                    particle.material.dispose();
                }
                
                // Limpiar geometrías compartidas
                smallParticleGeometry.dispose();
                mediumParticleGeometry.dispose();
            }
        };
        
        // Iniciar la animación
        lastTime = Date.now();
        animate();
    }
    
    getMesh() {
        return this.tankGroup;
    }
    
    getDirection(targetVector) {
        // Crear un vector temporal si no se proporciona uno
        const result = targetVector || new THREE.Vector3();
        
        // Vector que apunta hacia adelante en el sistema de coordenadas local del tanque
        const forward = new THREE.Vector3(0, 0, -1);
        
        // Crear un vector temporal y aplicar la rotación del tanque usando el quaternion
        result.copy(forward);
        result.applyQuaternion(this.tankGroup.quaternion);
        
        // Obtener la normal del terreno en la posición actual (si está disponible)
        let terrainNormal = null;
        if (this.scene && this.scene.gameController && this.scene.gameController.terrain) {
            const terrain = this.scene.gameController.terrain;
            const position = this.tankGroup.position;
            
            // Calcular la normal del terreno usando alturas en puntos cercanos
            const stepSize = 1.0;
            const heightX1 = terrain.getHeightAt(position.x - stepSize, position.z);
            const heightX2 = terrain.getHeightAt(position.x + stepSize, position.z);
            const heightZ1 = terrain.getHeightAt(position.x, position.z - stepSize);
            const heightZ2 = terrain.getHeightAt(position.x, position.z + stepSize);
            
            // Calcular las pendientes en X y Z
            const slopeX = (heightX2 - heightX1) / (2 * stepSize);
            const slopeZ = (heightZ2 - heightZ1) / (2 * stepSize);
            
            // Si la pendiente es significativa, ajustar la dirección
            if (Math.abs(slopeX) > 0.05 || Math.abs(slopeZ) > 0.05) {
                // Crear un vector normal al terreno
                if (!this._terrainNormal) {
                    this._terrainNormal = new THREE.Vector3();
                    this._projectedDirection = new THREE.Vector3();
                }
                
                this._terrainNormal.set(-slopeX, 1, -slopeZ).normalize();
                
                // Proyectar la dirección en el plano definido por la normal del terreno
                // Esto permite que el tanque siga la pendiente del terreno
                const dot = result.dot(this._terrainNormal);
                this._projectedDirection.copy(result).sub(
                    this._terrainNormal.clone().multiplyScalar(dot * 0.5) // Factor 0.5 para suavizar el efecto
                );
                
                // Normalizar la dirección proyectada
                this._projectedDirection.normalize();
                
                // Mezclar la dirección original con la proyectada según la pendiente
                const slopeMagnitude = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);
                const blendFactor = Math.min(0.7, slopeMagnitude * 5); // Máximo 70% de influencia
                
                result.lerp(this._projectedDirection, blendFactor);
                result.normalize();
                
                // Permitir un componente vertical pequeño para subir/bajar pendientes
                result.y = Math.max(-0.3, Math.min(0.3, -slopeZ * 0.5 - slopeX * 0.5));
                
                // Renormalizar después de ajustar el componente Y
                result.normalize();
                
                return result;
            }
        }
        
        // Si no hay pendiente significativa o no hay terreno disponible,
        // usar el comportamiento original pero permitir un pequeño componente vertical
        // para que el tanque pueda subir pequeñas pendientes
        result.y = Math.max(-0.1, Math.min(0.1, result.y));
        
        // Asegurarse de que el vector está normalizado (longitud = 1)
        result.normalize();
        
        return result;
    }
    
    getCannonDirection() {
        // Devolver la dirección a la que apunta el cañón
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(this.cannon.getWorldQuaternion(new THREE.Quaternion()));
        return direction;
    }
    
    reduceSpeed(factor) {
        // Reducir la velocidad del tanque por un factor
        this.speed *= factor;
        this.angularSpeed *= factor;
    }
    
    /**
     * Maneja la colisión del tanque con otros objetos
     * @param {number} relativeSpeed - Velocidad relativa de la colisión (opcional)
     * @param {THREE.Vector3} collisionNormal - Vector normal de la colisión (opcional)
     */
    handleCollision(relativeSpeed = 0, collisionNormal = null) {
        // Si el tanque está en modo embestida, no recibir daño de choque
        if (this.isInvulnerable) {
            console.log("Tanque invulnerable durante la embestida - No recibe daño de choque");
            return;
        }
        
        // Registrar el tiempo de la colisión
        const currentTime = Date.now() / 1000; // Tiempo actual en segundos
        this.lastCollisionTime = currentTime;
        
        // Establecer un tiempo de enfriamiento para la colisión
        this.collisionCooldown = 0.3; // 300 ms de enfriamiento
        
        // Factor de reducción de velocidad basado en la velocidad relativa
        // A mayor velocidad relativa, mayor reducción
        let reductionFactor = 0.5; // Valor por defecto
        
        if (relativeSpeed > 0) {
            // Ajustar el factor de reducción según la velocidad relativa
            // Fórmula: 0.3 + 0.4 * (relativeSpeed / 20)
            // Esto da un rango de 0.3 (colisión suave) a 0.7 (colisión fuerte)
            reductionFactor = Math.min(0.7, 0.3 + 0.4 * (relativeSpeed / 20));
            
            // Log para depuración
            console.log(`Colisión con velocidad relativa: ${relativeSpeed.toFixed(2)}, Factor de reducción: ${reductionFactor.toFixed(2)}`);
        }
        
        // Reducir la velocidad en colisiones
        if (Math.abs(this.speed) > 2) {
            this.speed *= (1 - reductionFactor);
        }
        
        // Si tenemos un vector normal de colisión, usarlo para calcular la reflexión
        if (collisionNormal && Math.abs(this.speed) > 1) {
            // Obtener el vector de velocidad actual
            const velocityVector = this.getVelocityVector();
            
            // Calcular el vector de reflexión: v' = v - 2(v·n)n
            // Donde v es el vector de velocidad, n es el vector normal de la colisión
            const dot = velocityVector.dot(collisionNormal);
            
            // Solo aplicar reflexión si el tanque se está moviendo hacia el objeto
            if (dot < 0) {
                // Calcular el vector de reflexión
                const reflection = velocityVector.clone().sub(
                    collisionNormal.clone().multiplyScalar(2 * dot)
                );
                
                // Obtener la dirección de reflexión
                reflection.normalize();
                
                // Aplicar una rotación suave hacia la dirección de reflexión
                const currentDirection = this.getDirection();
                const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 0, -1),
                    reflection
                );
                
                // Interpolar suavemente hacia la nueva dirección
                this.tankGroup.quaternion.slerp(targetQuaternion, 0.3);
                
                // Reducir la velocidad después de la reflexión
                this.speed *= 0.7;
            }
        } else {
            // Si no tenemos un vector normal, usar el comportamiento anterior
            // Añadir una pequeña rotación aleatoria para ayudar a desbloquear el tanque
            if (Math.abs(this.speed) > 0.5) {
                // Crear un quaternion para una pequeña rotación aleatoria
                const randomRotation = (Math.random() * 0.2 - 0.1); // Rotación aleatoria entre -0.1 y 0.1 radianes
                const yAxis = new THREE.Vector3(0, 1, 0);
                const rotationQuaternion = new THREE.Quaternion();
                rotationQuaternion.setFromAxisAngle(yAxis, randomRotation);
                
                // Aplicar la rotación al quaternion actual del tanque
                this.tankGroup.quaternion.premultiply(rotationQuaternion);
            }
            
            // Invertir ligeramente la dirección si la velocidad es alta
            if (Math.abs(this.speed) > 5) {
                this.speed = -this.speed * 0.3;
            }
        }
    }
    
    /**
     * Actualiza la masa del tanque y todas las propiedades relacionadas
     * @param {number} newMass - Nueva masa del tanque
     */
    updateMass(newMass) {
        // Actualizar el valor de la masa
        this.mass = newMass;
        
        // Actualizar la escala visual
        this.updateScale();
        
        // Actualizar la velocidad según la nueva masa
        this.updateSpeed();
    }
    
    /**
     * Actualiza la escala visual del tanque basada en la masa
     * Fórmula: s = k * m^(1/3), donde k es el factor de normalización
     */
    updateScale() {
        // Calcular el nuevo factor de escala basado en la fórmula física
        this.scaleFactor = this.normalizationFactor * Math.pow(this.mass, 1/3);
        
        // Establecer una escala mínima para evitar tanques demasiado pequeños
        const minScale = 0.8;
        if (this.scaleFactor < minScale) {
            this.scaleFactor = minScale;
        }
        
        // Aplicar la escala al modelo del tanque
        if (this.tankGroup) {
            this.tankGroup.scale.set(this.scaleFactor, this.scaleFactor, this.scaleFactor);
            
            // Actualizar el radio de colisión basado en la fórmula r = k_s * m^(1/3)
            // Usamos un factor k_s ligeramente mayor que el factor de escala visual
            // para asegurar que las colisiones se detecten correctamente
            const k_s = 2.5; // Factor de escala para el radio de colisión
            this.collisionRadius = k_s * Math.pow(this.mass, 1/3);
            
            // Log para depuración
            console.log(`Tanque actualizado: Masa=${this.mass.toFixed(2)}, Escala=${this.scaleFactor.toFixed(2)}, Radio=${this.collisionRadius.toFixed(2)}`);
        }
    }
    
    /**
     * Actualiza la velocidad del tanque basada en la masa actual
     * Fórmula: v = v0/m^factor, donde v0 es la velocidad base
     */
    updateSpeed() {
        const baseSpeed = 50; // Velocidad base v0 (aumentada drásticamente de 20 a 50)
        const baseAngularSpeed = 8; // Velocidad angular base (aumentada de 4 a 8)
        
        // Aplicar una fórmula que reduce mucho más el impacto de la masa
        // Usamos m^0.1 en lugar de m^0.25 para un impacto mínimo
        this.maxSpeed = baseSpeed / Math.pow(this.mass, 0.1);
        this.maxAngularSpeed = baseAngularSpeed / Math.pow(this.mass, 0.1);
        
        // Aumentar significativamente los límites mínimos
        const minSpeed = 15.0; // Velocidad mínima permitida (aumentada de 5.0 a 15.0)
        if (this.maxSpeed < minSpeed) {
            this.maxSpeed = minSpeed;
        }
        
        // Limitar la velocidad angular mínima
        const minAngularSpeed = 3.0; // Velocidad angular mínima (aumentada de 1.0 a 3.0)
        if (this.maxAngularSpeed < minAngularSpeed) {
            this.maxAngularSpeed = minAngularSpeed;
        }
    }
    
    // Método para aumentar la masa del tanque al recoger un pellet
    increaseMass(amount) {
        // Aumentar la masa
        const newMass = this.mass + amount;
        
        // Actualizar la masa y propiedades relacionadas
        this.updateMass(newMass);
        
        // Efecto visual de crecimiento
        this.playGrowthEffect(amount);
        
        console.log(`Tanque aumentó su masa en ${amount}. Nueva masa: ${this.mass}`);
        
        return this.mass;
    }
    
    // Efecto visual al aumentar la masa
    playGrowthEffect(amount) {
        // Guardar escala actual
        const currentScale = this.body.scale.x;
        
        // Crear animación de "pulso" al crecer
        const timeline = gsap.timeline();
        
        // Escala ligeramente más grande que la final
        const overshoot = 0.1 * (amount / 10);
        
        timeline.to(this.body.scale, {
            x: currentScale + overshoot,
            y: currentScale + overshoot,
            z: currentScale + overshoot,
            duration: 0.2,
            ease: "power2.out"
        }).to(this.body.scale, {
            x: currentScale,
            y: currentScale,
            z: currentScale,
            duration: 0.15,
            ease: "power2.in"
        });
        
        // Efecto de brillo
        const originalEmissive = this.body.material.emissive.clone();
        const glowColor = new THREE.Color(0xFFD700); // Color dorado
        
        timeline.to(this.body.material.emissive, {
            r: glowColor.r,
            g: glowColor.g,
            b: glowColor.b,
            duration: 0.2,
            ease: "power2.out",
            onComplete: () => {
                // Restaurar color original
                this.body.material.emissive.copy(originalEmissive);
            }
        }, 0); // Ejecutar en paralelo con la primera animación
    }
    
    /**
     * Obtiene la posición de la torreta del tanque
     * @returns {THREE.Vector3} Posición de la torreta
     */
    getTurretPosition() {
        // Crear un vector para la posición de la torreta
        const turretPosition = new THREE.Vector3();
        
        // Obtener la posición mundial de la torreta
        this.turret.getWorldPosition(turretPosition);
        
        return turretPosition;
    }
    
    /**
     * Obtiene la dirección a la que apunta la torreta
     * @returns {THREE.Vector3} Dirección normalizada de la torreta
     */
    getTurretDirection() {
        // Vector que apunta hacia adelante en el sistema de coordenadas local de la torreta
        const forward = new THREE.Vector3(0, 0, 1);
        
        // Aplicar la rotación de la torreta
        const direction = forward.clone();
        direction.applyQuaternion(this.turret.getWorldQuaternion(new THREE.Quaternion()));
        
        // Normalizar el vector
        direction.normalize();
        
        return direction;
    }
    
    /**
     * Obtiene el vector de velocidad actual del tanque
     * @param {THREE.Vector3} [targetVector] - Vector opcional donde almacenar el resultado
     * @returns {THREE.Vector3} Vector de velocidad en unidades por segundo
     */
    getVelocityVector(targetVector) {
        // Crear un vector temporal si no se proporciona uno
        const result = targetVector || new THREE.Vector3();
        
        // Obtener la dirección actual del tanque
        if (!this._tempDirection) {
            this._tempDirection = new THREE.Vector3();
        }
        
        // Obtener la dirección y multiplicarla por la velocidad
        this.getDirection(this._tempDirection);
        result.copy(this._tempDirection).multiplyScalar(this.speed);
        
        return result;
    }
    
    /**
     * Verifica colisiones con otros tanques enemigos
     * @param {Array} enemyTanks - Lista de tanques enemigos
     */
    checkEnemyTankCollisions(enemyTanks) {
        if (!enemyTanks || enemyTanks.length === 0 || !this.active) return;
        
        // Inicializar vectores temporales si no existen
        if (!this._collisionVectors) {
            this._collisionVectors = {
                myPosition: new THREE.Vector3(),
                enemyPosition: new THREE.Vector3(),
                collisionNormal: new THREE.Vector3(),
                myVelocity: new THREE.Vector3(),
                enemyVelocity: new THREE.Vector3(),
                relativeVelocity: new THREE.Vector3(),
                displacementVector: new THREE.Vector3(),
                myDisplacement: new THREE.Vector3(),
                enemyDisplacement: new THREE.Vector3(),
                collisionPoint: new THREE.Vector3()
            };
        }
        
        // Obtener la posición actual del tanque
        const position = this.getPosition();
        const vectors = this._collisionVectors;
        vectors.myPosition.copy(position);
        
        // Limitar la frecuencia de comprobación de colisiones
        const currentTime = Date.now();
        if (!this._lastCollisionCheck) this._lastCollisionCheck = 0;
        
        // Solo comprobar colisiones cada 50ms (20 veces por segundo)
        if (currentTime - this._lastCollisionCheck < 50) return;
        this._lastCollisionCheck = currentTime;
        
        // Verificar colisiones con cada tanque enemigo
        for (const enemyTank of enemyTanks) {
            // Evitar verificar colisión consigo mismo o con tanques inactivos
            if (enemyTank === this || !enemyTank.active) continue;
            
            // Obtener la posición del tanque enemigo
            const enemyPosition = enemyTank.getPosition();
            vectors.enemyPosition.copy(enemyPosition);
            
            // Optimización: Verificación rápida de distancia usando distancia al cuadrado
            // Evita calcular raíz cuadrada innecesariamente
            const dx = position.x - enemyPosition.x;
            const dz = position.z - enemyPosition.z;
            const distanceSquared = dx * dx + dz * dz;
            
            // Calcular la suma de los radios de colisión
            const sumOfRadii = this.collisionRadius + enemyTank.collisionRadius;
            const sumOfRadiiSquared = sumOfRadii * sumOfRadii;
            
            // Verificar si hay colisión usando distancia al cuadrado
            if (distanceSquared < sumOfRadiiSquared) {
                // Calcular la distancia real solo si hay colisión
                const distance = Math.sqrt(distanceSquared);
                
                // Calcular la velocidad relativa entre los tanques
                this.getVelocityVector(vectors.myVelocity);
                enemyTank.getVelocityVector(vectors.enemyVelocity);
                
                // Calcular el vector de velocidad relativa: v_rel = v1 - v2
                vectors.relativeVelocity.copy(vectors.myVelocity).sub(vectors.enemyVelocity);
                
                // Magnitud de la velocidad relativa
                const relativeSpeed = vectors.relativeVelocity.length();
                
                // Calcular el vector normal de la colisión (desde el enemigo hacia este tanque)
                vectors.collisionNormal.set(dx, 0, dz).normalize();
                
                // Calcular la proporción de masa para determinar el desplazamiento
                const totalMass = this.mass + enemyTank.mass;
                const myMassProportion = enemyTank.mass / totalMass;
                const enemyMassProportion = this.mass / totalMass;
                
                // Calcular el vector de desplazamiento
                const overlap = sumOfRadii - distance;
                vectors.displacementVector.copy(vectors.collisionNormal).multiplyScalar(overlap);
                
                // Aplicar el desplazamiento proporcional a la masa
                vectors.myDisplacement.copy(vectors.displacementVector).multiplyScalar(myMassProportion);
                vectors.enemyDisplacement.copy(vectors.displacementVector).multiplyScalar(-enemyMassProportion);
                
                // Actualizar posiciones
                this.tankGroup.position.add(vectors.myDisplacement);
                enemyTank.tankGroup.position.add(vectors.enemyDisplacement);
                
                // Manejar la colisión para ambos tanques con la velocidad relativa
                this.handleCollision(relativeSpeed, vectors.collisionNormal);
                
                // Crear un vector temporal para la normal invertida
                const negatedNormal = vectors.collisionNormal.clone().negate();
                enemyTank.handleCollision(relativeSpeed, negatedNormal);
                
                // Calcular el punto medio de la colisión para generar pellets
                vectors.collisionPoint.addVectors(position, enemyPosition).multiplyScalar(0.5);
                
                // Verificar si alguno de los tanques tiene embestida activa
                if (this.isRamming || enemyTank.isRamming) {
                    // Determinar cuál tanque está embistiendo
                    const rammingTank = this.isRamming ? this : enemyTank;
                    const targetTank = this.isRamming ? enemyTank : this;
                    
                    // Calcular el daño por embestida usando la fórmula:
                    // D_emb = k_e * (m_embistidor / m_objetivo) * v_rel^2
                    const k_e = 0.2; // Factor específico para embestida
                    
                    // Calcular el daño por embestida
                    const rammingDamage = k_e * (rammingTank.mass / targetTank.mass) * (relativeSpeed * relativeSpeed);
                    
                    // Limitar el daño al 15% de la vida total del objetivo
                    const maxDamage = 0.15 * 100; // Asumiendo que la vida total es 100
                    const finalDamage = Math.min(rammingDamage, maxDamage);
                    
                    // Aplicar el daño redondeado a entero
                    const roundedDamage = Math.round(finalDamage);
                    
                    if (roundedDamage > 0) {
                        // Calcular la pérdida de masa del tanque impactado
                        const massLoss = roundedDamage * 0.1; // 10% del daño se convierte en pérdida de masa
                        
                        // Actualizar la masa del tanque objetivo
                        const newMass = Math.max(1, targetTank.mass - massLoss);
                        targetTank.updateMass(newMass);
                        
                        // Aplicar daño solo al tanque objetivo
                        targetTank.takeDamage(roundedDamage);
                        
                        // Generar pellets con la masa perdida
                        this.generatePellets(vectors.collisionPoint, massLoss);
                        
                        // Crear un efecto visual más intenso para la embestida
                        const effectIntensity = Math.min(1.0, relativeSpeed / 15.0);
                        this.createCollisionEffect(vectors.collisionPoint, effectIntensity + 0.3);
                        
                        // Reducir la frecuencia de logs para mejorar el rendimiento
                        if (!this._rammingLogCount) this._rammingLogCount = 0;
                        this._rammingLogCount++;
                        
                        if (this._rammingLogCount % 3 === 0) {
                            console.log(`¡EMBESTIDA! Daño: ${roundedDamage.toFixed(0)}, Velocidad: ${relativeSpeed.toFixed(2)}`);
                            console.log(`  - Tanque embistiendo: Masa=${rammingTank.mass.toFixed(2)}`);
                            console.log(`  - Tanque objetivo: Masa=${targetTank.mass.toFixed(2)}, Salud restante=${targetTank.health}`);
                            console.log(`  - Masa perdida: ${massLoss.toFixed(2)}`);
                        }
                    }
                } 
                // Si ninguno tiene embestida activa, no aplicar daño por colisión
                else {
                    // Solo crear un efecto visual de colisión sin daño
                    const effectIntensity = Math.min(1.0, relativeSpeed / 20.0);
                    this.createCollisionEffect(vectors.collisionPoint, effectIntensity);
                    
                    // Reducir la frecuencia de logs para mejorar el rendimiento
                    if (!this._collisionLogCount) this._collisionLogCount = 0;
                    this._collisionLogCount++;
                    
                    if (this._collisionLogCount % 5 === 0) {
                        console.log(`Colisión sin daño: Velocidad relativa=${relativeSpeed.toFixed(2)}`);
                        console.log(`  - Tanque 1: Masa=${this.mass.toFixed(2)}, Velocidad=${this.speed.toFixed(2)}`);
                        console.log(`  - Tanque 2: Masa=${enemyTank.mass.toFixed(2)}, Velocidad=${enemyTank.speed.toFixed(2)}`);
                    }
                }
            }
        }
    }
    
    /**
     * Obtiene la posición actual del tanque
     * @returns {THREE.Vector3} Posición del tanque
     */
    getPosition() {
        // Devolver una copia de la posición del grupo del tanque
        return this.tankGroup.position.clone();
    }
    
    /**
     * Crea un efecto visual para la colisión en la posición especificada
     * @param {THREE.Vector3} position - Posición de la colisión
     * @param {number} intensity - Intensidad de la colisión (0-1)
     */
    createCollisionEffect(position, intensity = 0.5) {
        // Limitar la intensidad entre 0 y 1
        intensity = Math.max(0, Math.min(1, intensity));
        
        // Limitar la frecuencia de efectos de colisión
        const currentTime = Date.now();
        if (!this._lastCollisionEffect) this._lastCollisionEffect = 0;
        
        // Solo crear efectos cada 200ms para mejorar el rendimiento
        if (currentTime - this._lastCollisionEffect < 200) return;
        this._lastCollisionEffect = currentTime;
        
        // Reducir la complejidad de los efectos en función del rendimiento
        // Usar menos partículas y geometrías más simples
        const segments = 6; // Reducido de 8 a 6
        const radius = 1 + intensity * 2;
        
        // Reutilizar geometrías si ya existen
        if (!this.constructor.shockwaveGeometry) {
            this.constructor.shockwaveGeometry = {};
        }
        
        // Usar una clave basada en el radio y segmentos para reutilizar geometrías similares
        const geometryKey = `${Math.round(radius)}_${segments}`;
        if (!this.constructor.shockwaveGeometry[geometryKey]) {
            this.constructor.shockwaveGeometry[geometryKey] = new THREE.SphereGeometry(radius, segments, segments);
        }
        
        const shockwaveGeometry = this.constructor.shockwaveGeometry[geometryKey];
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            transparent: true,
            opacity: 0.7 * intensity,
            wireframe: true
        });
        
        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.position.copy(position);
        this.scene.add(shockwave);
        
        // Reducir el número de partículas según la intensidad
        // Menos partículas = mejor rendimiento
        const sparkCount = Math.min(3, Math.floor(3 * intensity) + 1); // Reducido significativamente
        const sparks = [];
        
        // Reutilizar geometría para todas las chispas
        if (!this.constructor.sparkGeometry) {
            this.constructor.sparkGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        }
        
        for (let i = 0; i < sparkCount; i++) {
            const sparkMaterial = new THREE.MeshBasicMaterial({
                color: 0xff5500,
                transparent: true,
                opacity: 1
            });
            
            const spark = new THREE.Mesh(this.constructor.sparkGeometry, sparkMaterial);
            
            // Posicionar la chispa en el punto de colisión
            spark.position.copy(position);
            
            // Dar a la chispa una velocidad y dirección aleatorias
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI - Math.PI / 2;
            const speed = 2 + Math.random() * 3 * intensity;
            
            spark.velocity = new THREE.Vector3(
                Math.cos(angle) * Math.cos(elevation) * speed,
                Math.sin(elevation) * speed,
                Math.sin(angle) * Math.cos(elevation) * speed
            );
            
            this.scene.add(spark);
            sparks.push(spark);
        }
        
        // Animar el efecto con menos pasos de animación
        let scale = 1;
        const duration = 0.25 + intensity * 0.25; // Reducido de 0.3 + intensity * 0.3
        let elapsed = 0;
        let lastTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            const deltaTime = Math.min(0.05, (currentTime - lastTime) / 1000); // Limitar deltaTime a 50ms máximo
            lastTime = currentTime;
            
            elapsed += deltaTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Expandir la onda expansiva
                scale = 1 + progress * 2;
                shockwave.scale.set(scale, scale, scale);
                shockwaveMaterial.opacity = 0.7 * (1 - progress) * intensity;
                
                // Animar las chispas
                for (const spark of sparks) {
                    // Aplicar gravedad
                    spark.velocity.y -= 9.8 * deltaTime;
                    
                    // Actualizar posición
                    spark.position.x += spark.velocity.x * deltaTime;
                    spark.position.y += spark.velocity.y * deltaTime;
                    spark.position.z += spark.velocity.z * deltaTime;
                    
                    // Reducir opacidad
                    spark.material.opacity -= deltaTime / duration;
                    
                    // Reducir tamaño
                    const sparkScale = 1 - progress * 0.8;
                    spark.scale.set(sparkScale, sparkScale, sparkScale);
                }
                
                // Continuar la animación con menos frecuencia (aproximadamente 20 FPS)
                setTimeout(() => requestAnimationFrame(animate), 50);
            } else {
                // Limpiar recursos
                this.scene.remove(shockwave);
                shockwaveMaterial.dispose();
                
                // Limpiar chispas
                for (const spark of sparks) {
                    this.scene.remove(spark);
                    spark.material.dispose();
                }
            }
        };
        
        // Iniciar la animación
        animate();
    }
}
