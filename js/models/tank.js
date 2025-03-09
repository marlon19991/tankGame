class Tank {
    constructor(scene, x, y, z) {
        this.scene = scene;
        
        // Propiedades físicas
        this.speed = 0;
        this.maxSpeed = 10;
        this.acceleration = 5;
        this.deceleration = 7;
        this.angularSpeed = 0;
        this.maxAngularSpeed = 2;
        this.angularAcceleration = 4;
        this.angularDeceleration = 6;
        
        // Propiedades de la torreta
        this.turretAngle = 0;
        this.turretRotationSpeed = 1.5;
        
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
        
        // Crear el cañón
        const cannonGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
        // Trasladar el origen de la geometría para que el cañón se extienda hacia adelante desde su base
        cannonGeometry.translate(0, 2, 0);
        const cannonMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            roughness: 0.5
        });
        this.cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
        this.cannon.rotation.x = Math.PI / 2;
        this.cannon.position.z = 2;
        this.cannon.castShadow = true;
        this.cannon.receiveShadow = true;
        this.turret.add(this.cannon);
        
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
        // Rotar la torreta independientemente del cuerpo
        if (inputController.isTurretTurningLeft()) {
            this.turretAngle += this.turretRotationSpeed * deltaTime;
        } else if (inputController.isTurretTurningRight()) {
            this.turretAngle -= this.turretRotationSpeed * deltaTime;
        }
        
        // Aplicar la rotación en Y (rotación horizontal) en lugar de Z
        this.turret.rotation.y = this.turretAngle;
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
        // Ahora que hemos trasladado la geometría del cañón, la punta está en (0, 4, 0) en el espacio local del cañón
        const muzzlePosition = new THREE.Vector3(0, 4, 0).applyMatrix4(this.cannon.matrixWorld);
        
        // Calcular la dirección del disparo correcta
        // Como hemos rotado el cañón en el eje X (Math.PI/2), necesitamos un vector que apunte en la dirección correcta
        // Usamos un vector que apunta "hacia adelante" en el sistema local del cañón rotado
        const direction = new THREE.Vector3(0, 1, 0).applyQuaternion(this.cannon.getWorldQuaternion(new THREE.Quaternion()));
        
        // Crear un proyectil con la dirección correcta
        const projectile = new Projectile(this.scene, muzzlePosition, direction);
        
        // Reproducir sonido de disparo (opcional)
        // this.playFireSound();
        
        console.log(`Tanque dispara desde (${muzzlePosition.x.toFixed(1)}, ${muzzlePosition.y.toFixed(1)}, ${muzzlePosition.z.toFixed(1)})`);
        
        return projectile;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        console.log("Tanque dañado. Salud restante:", this.health);
        
        // Efecto visual de daño (parpadeo rojo)
        this.flashDamage();
        
        if (this.health <= 0) {
            console.log("¡Tanque destruido!");
            this.active = false;
            // Aquí se añadiría la lógica de destrucción/reinicio
        }
    }
    
    flashDamage() {
        // Guardar los colores originales
        const bodyColor = this.body.material.color.clone();
        const turretColor = this.turret.material.color.clone();
        
        // Cambiar a color rojo
        this.body.material.color.setHex(0xff0000);
        this.turret.material.color.setHex(0xff0000);
        
        // Volver al color original después de un breve tiempo
        setTimeout(() => {
            if (this.body && this.turret) {
                this.body.material.color.copy(bodyColor);
                this.turret.material.color.copy(turretColor);
            }
        }, 150);
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
    
    handleCollision() {
        // Registrar el tiempo de la colisión
        const currentTime = Date.now() / 1000; // Tiempo actual en segundos
        this.lastCollisionTime = currentTime;
        
        // Establecer un tiempo de enfriamiento para la colisión más largo
        // Esto ayudará a evitar el parpadeo al reducir temporalmente la velocidad
        this.collisionCooldown = 0.3; // 300 ms de enfriamiento
        
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
}
