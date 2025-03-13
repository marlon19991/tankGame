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
         * - Capacidad para absorber a otros tanques (directamente proporcional)
         */
        this.mass = 20; // Valor base de masa (aumentado de 10 a 20)
        this.scaleFactor = 1; // Factor de escala inicial
        this.normalizationFactor = 0.5; // Factor k de normalización para la escala (aumentado de 1/10 a 0.5)
        this.collisionRadius = 3; // Radio para detección de colisiones
        
        // Estado del auto-daño
        this.lastSelfDamageState = false;
        
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
        
        // Adaptar el tanque a la superficie del terreno
        if (gameController && gameController.terrain) {
            this.adaptToTerrain(gameController.terrain);
        }
    }
    
    adaptToTerrain(terrain) {
        // Obtener la posición actual del tanque
        const position = this.tankGroup.position;
        
        // Obtener la altura del terreno en la posición actual
        const terrainHeight = terrain.getHeightAt(position.x, position.z);
        
        // Comprobar si hay rocas pequeñas debajo del tanque
        const rockHeight = this.checkForRocksUnderTank(terrain);
        
        // Ajustar la altura del tanque para que esté sobre el terreno o la roca
        // Añadimos un pequeño offset para que las ruedas estén en contacto con el suelo
        const targetHeight = Math.max(terrainHeight, rockHeight) + 1.0;
        
        // Suavizar el movimiento vertical usando interpolación
        position.y += (targetHeight - position.y) * 0.1;
        
        // Calcular la normal del terreno para orientar el tanque
        // Obtenemos alturas en puntos cercanos para calcular la pendiente
        const stepSize = 1.0;
        const heightX1 = terrain.getHeightAt(position.x - stepSize, position.z);
        const heightX2 = terrain.getHeightAt(position.x + stepSize, position.z);
        const heightZ1 = terrain.getHeightAt(position.x, position.z - stepSize);
        const heightZ2 = terrain.getHeightAt(position.x, position.z + stepSize);
        
        // Calcular las pendientes en X y Z
        const slopeX = (heightX2 - heightX1) / (2 * stepSize);
        const slopeZ = (heightZ2 - heightZ1) / (2 * stepSize);
        
        // Crear un vector normal al terreno
        const normal = new THREE.Vector3(-slopeX, 1, -slopeZ).normalize();
        
        // Extraer la rotación actual en Y del tanque
        // Usamos un vector temporal para obtener la dirección actual
        const forward = new THREE.Vector3(0, 0, -1);
        const currentDirection = forward.clone().applyQuaternion(this.tankGroup.quaternion);
        const rotationY = Math.atan2(-currentDirection.x, -currentDirection.z);
        
        // Crear una matriz de rotación para alinear el tanque con la normal del terreno
        const upVector = new THREE.Vector3(0, 1, 0);
        
        // Solo aplicar inclinación si la pendiente es significativa
        if (Math.abs(slopeX) > 0.01 || Math.abs(slopeZ) > 0.01) {
            // Crear un quaternion para la rotación basada en la normal
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(upVector, normal);
            
            // Crear otro quaternion para la rotación en Y
            const yQuaternion = new THREE.Quaternion();
            yQuaternion.setFromAxisAngle(upVector, rotationY);
            
            // Combinar ambas rotaciones (primero alinear con la normal, luego rotar en Y)
            // Usamos slerp para una transición suave
            const targetQuaternion = new THREE.Quaternion().multiplyQuaternions(quaternion, yQuaternion);
            
            // Aplicar la rotación gradualmente para un movimiento más suave
            // Usamos un factor de interpolación más bajo para terrenos muy inclinados
            const slopeMagnitude = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);
            const interpolationFactor = Math.max(0.05, 0.1 / (1 + slopeMagnitude * 5));
            this.tankGroup.quaternion.slerp(targetQuaternion, interpolationFactor);
        } else {
            // Si el terreno es plano, solo mantener la rotación en Y
            const yQuaternion = new THREE.Quaternion();
            yQuaternion.setFromAxisAngle(upVector, rotationY);
            this.tankGroup.quaternion.slerp(yQuaternion, 0.1);
        }
    }
    
    checkForRocksUnderTank(terrain) {
        // Radio de detección para rocas bajo el tanque
        const detectionRadius = 2.5;
        const position = this.tankGroup.position;
        
        // Altura máxima encontrada
        let maxRockHeight = 0;
        
        // Comprobar todas las rocas en el terreno
        for (const rock of terrain.rocks) {
            // Verificar que la roca tiene propiedades de física
            if (!rock.userData.physics) continue;
            
            // Calcular distancia horizontal entre el tanque y la roca
            const dx = position.x - rock.position.x;
            const dz = position.z - rock.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Si la roca está dentro del radio de detección y es pequeña
            if (distance < detectionRadius && rock.userData.physics.isSmall) {
                // Calcular la altura de la roca (parte superior)
                const rockTopHeight = rock.position.y + rock.userData.physics.height / 2;
                
                // Actualizar la altura máxima si esta roca es más alta
                if (rockTopHeight > maxRockHeight) {
                    maxRockHeight = rockTopHeight;
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
        const currentPosition = this.tankGroup.position.clone();
        
        // Verificar si el tanque está atascado (no se mueve a pesar de tener velocidad)
        this.stuckCheckCounter += deltaTime;
        if (this.stuckCheckCounter >= 0.5) { // Comprobar cada medio segundo
            this.stuckCheckCounter = 0;
            
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
                    this.tankGroup.rotation.y += (Math.random() * 0.5 - 0.25); // Girar aleatoriamente
                    this.speed = (Math.random() > 0.5 ? 1 : -1) * this.maxSpeed * 0.3; // Velocidad aleatoria
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
            if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
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
            const yAxis = new THREE.Vector3(0, 1, 0);
            const rotationQuaternion = new THREE.Quaternion();
            rotationQuaternion.setFromAxisAngle(yAxis, rotationDelta);
            
            // Aplicar la rotación al quaternion actual del tanque
            this.tankGroup.quaternion.premultiply(rotationQuaternion);
        }
        
        // Calcular el movimiento basado en la rotación actual
        const direction = this.getDirection();
        
        // Verificar si hay un enfriamiento de colisión activo
        const speedMultiplier = this.collisionCooldown > 0 ? 0.3 : 1.0;
        
        // Aplicar movimiento en la dirección del tanque con posible reducción por colisión reciente
        const effectiveSpeed = this.speed * speedMultiplier;
        this.tankGroup.position.x += direction.x * effectiveSpeed * deltaTime;
        this.tankGroup.position.z += direction.z * effectiveSpeed * deltaTime;
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
        const muzzlePosition = new THREE.Vector3(0, 4, 0).applyMatrix4(this.cannon.matrixWorld);
        
        // Calcular la dirección del disparo correcta teniendo en cuenta la elevación del cañón
        const direction = new THREE.Vector3(0, 1, 0).applyQuaternion(this.cannon.getWorldQuaternion(new THREE.Quaternion()));
        
        // Crear un proyectil con la dirección correcta y la masa del tanque
        const projectile = new Projectile(this.scene, muzzlePosition, direction, this.mass);
        
        // Identificar el origen del proyectil
        projectile.sourceId = this instanceof EnemyTank ? 'enemy' : 'player';
        
        // Calcular el daño basado en la masa del tanque (más masa = más daño)
        // Usando una fórmula que da un daño base de 20 cuando la masa es 20
        projectile.damage = Math.max(5, Math.floor(this.mass));
        
        console.log(`Tanque dispara desde (${muzzlePosition.x.toFixed(1)}, ${muzzlePosition.y.toFixed(1)}, ${muzzlePosition.z.toFixed(1)})`);
        console.log(`Ángulo de elevación del cañón: ${(this.cannonAngle * 180 / Math.PI).toFixed(1)} grados`);
        console.log(`Masa del tanque: ${this.mass.toFixed(1)}, Tamaño del proyectil: ${Math.sqrt(this.mass / 20) * 0.3}`);
        console.log(`Origen del proyectil: ${projectile.sourceId}, Daño: ${projectile.damage}`);
        
        return projectile;
    }
    
    takeDamage(amount) {
        // Asegurarse de que amount es un número válido
        const damageAmount = Number(amount) || 20;
        
        // Aplicar el daño
        this.health = Math.max(0, this.health - damageAmount);
        console.log(`Tanque dañado con ${damageAmount}. Salud restante: ${this.health}`);
        
        // Reducir la masa proporcionalmente al daño recibido (10% del daño)
        const massReduction = damageAmount * 0.1;
        this.updateMass(Math.max(1, this.mass - massReduction)); // Mínimo de masa = 1
        
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
        // Crear material rojo brillante para el efecto de daño
        const damageMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 2.0
        });
        
        // Guardar los materiales originales y aplicar el material de daño
        const originalMaterials = [];
        this.tankGroup.traverse(child => {
            if (child.isMesh && child.material) {
                originalMaterials.push({
                    mesh: child,
                    material: child.material
                });
                child.material = damageMaterial;
            }
        });
        
        // Restaurar los materiales originales después de un breve tiempo
        setTimeout(() => {
            originalMaterials.forEach(item => {
                if (item.mesh) {
                    item.mesh.material = item.material;
                }
            });
            damageMaterial.dispose();
        }, 150); // Aumentado de 100ms a 150ms para que sea más visible
    }
    
    // Método para crear el efecto de destrucción
    createDestructionEffect(x, y, z) {
        // Crear una explosión grande y espectacular
        const explosionGeometry = new THREE.SphereGeometry(3, 32, 32);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff5500,
            transparent: true,
            opacity: 1
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.set(x, y, z);
        this.scene.add(explosion);
        
        // Añadir luz intensa a la explosión
        const explosionLight = new THREE.PointLight(0xff5500, 10, 30);
        explosionLight.position.set(x, y, z);
        this.scene.add(explosionLight);
        
        // Añadir una segunda luz para más efecto
        const secondaryLight = new THREE.PointLight(0xffff00, 8, 20);
        secondaryLight.position.set(x, y + 1, z);
        this.scene.add(secondaryLight);
        
        // Crear partículas para simular escombros
        const particleCount = 30;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.3 * Math.random() + 0.1, 8, 8);
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
        
        // Animar la explosión
        let scale = 1;
        const animate = () => {
            // Animar la explosión principal
            scale += 0.2;
            explosion.scale.set(scale, scale, scale);
            explosionMaterial.opacity -= 0.03;
            explosionLight.intensity *= 0.95;
            secondaryLight.intensity *= 0.95;
            
            // Animar las partículas
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
                if (particle.position.y < 0.3) {
                    particle.position.y = 0.3;
                    particle.velocity.y = -particle.velocity.y * 0.4; // Rebote con pérdida de energía
                }
            }
            
            if (explosionMaterial.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                // Limpiar recursos
                this.scene.remove(explosion);
                this.scene.remove(explosionLight);
                this.scene.remove(secondaryLight);
                explosionGeometry.dispose();
                explosionMaterial.dispose();
                
                // Limpiar partículas
                for (const particle of particles) {
                    this.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                }
            }
        };
        
        animate();
    }
    
    getMesh() {
        return this.tankGroup;
    }
    
    getDirection() {
        // Devolver la dirección a la que apunta el tanque (vector unitario)
        // Usamos un vector que apunta hacia adelante en el sistema de coordenadas local del tanque
        const forward = new THREE.Vector3(0, 0, -1);
        
        // Crear un vector temporal y aplicar la rotación del tanque usando el quaternion
        const direction = forward.clone();
        direction.applyQuaternion(this.tankGroup.quaternion);
        
        // Proyectar el vector en el plano XZ para mantener el movimiento horizontal
        // Esto evita que el tanque "escale" pendientes demasiado empinadas
        direction.y = 0;
        
        // Asegurarse de que el vector está normalizado (longitud = 1)
        direction.normalize();
        
        return direction;
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
     * Absorbe la masa de otro tanque
     * @param {Tank} otherTank - El tanque cuya masa será absorbida
     */
    absorbMass(otherTank) {
        // Solo absorber si este tanque tiene mayor masa que el otro
        if (this.mass > otherTank.mass) {
            // Calcular la cantidad de masa a absorber (50% de la masa del otro tanque)
            const absorbedMass = otherTank.mass * 0.5;
            
            // Actualizar la masa de ambos tanques
            this.updateMass(this.mass + absorbedMass);
            otherTank.updateMass(otherTank.mass - absorbedMass);
            
            console.log(`Tanque absorbió ${absorbedMass.toFixed(2)} de masa. Nueva masa: ${this.mass.toFixed(2)}`);
            
            // Si el otro tanque queda con muy poca masa, podría ser destruido
            if (otherTank.mass < 1) {
                otherTank.takeDamage(otherTank.health); // Destruir el tanque
            }
            
            return true; // Absorción exitosa
        }
        
        return false; // No se pudo absorber
    }
    
    handleCollision(otherTank = null) {
        // Registrar el tiempo de la colisión
        const currentTime = Date.now() / 1000; // Tiempo actual en segundos
        this.lastCollisionTime = currentTime;
        
        // Establecer un tiempo de enfriamiento para la colisión más largo
        // Esto ayudará a evitar el parpadeo al reducir temporalmente la velocidad
        this.collisionCooldown = 0.3; // 300 ms de enfriamiento
        
        // Si se proporciona otro tanque, intentar absorber su masa
        if (otherTank && otherTank instanceof Tank) {
            this.absorbMass(otherTank);
        }
        
        // Reducir la velocidad en colisiones
        if (Math.abs(this.speed) > 2) {
            this.speed *= 0.5; // Reducción más agresiva
        }
        
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
        
        // Actualizar el radio de colisión basado en la masa
        this.collisionRadius = 2 + (this.mass / 10); // Base de 2 unidades + factor proporcional a la masa
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
            
            // Actualizar el radio de colisión basado en la escala
            this.collisionRadius = 3 * this.scaleFactor;
            
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
}
