class EnemyTank extends Tank {
    constructor(scene, x, y, z, difficulty = 'normal') {
        super(scene, x, y, z);
        
        // Establecer la masa inicial del tanque enemigo según su dificultad
        switch(difficulty) {
            case 'easy':
                this.mass = 10; // Enemigos fáciles (aumentado de 3 a 10)
                break;
            case 'normal':
                this.mass = 15; // Masa estándar para enemigos normales (aumentado de 5 a 15)
                break;
            case 'hard':
                this.mass = 20; // Enemigos difíciles (aumentado de 8 a 20)
                break;
            case 'boss':
                this.mass = 35; // Jefes (aumentado de 15 a 35)
                break;
            default:
                this.mass = 15; // Valor por defecto (aumentado de 5 a 15)
        }
        
        // Velocidades base que serán ajustadas según la masa
        this.baseDetectionRadius = 120; // Aumentado aún más para detectar al jugador desde lejos
        this.baseFireRadius = 100; // Aumentado para que los enemigos disparen desde mayor distancia
        this.basePatrolRadius = 90;
        this.basePatrolSpeed = 15; // Reducido de 30 a 15 para que sean más lentos
        this.baseChaseSpeed = 20; // Reducido de 40 a 20 para que sean más lentos
        this.baseTurnSpeed = 3.0; // Reducido de 6.0 a 3.0 para que giren más lento
        this.fireRate = 2.0; // Reducido de 3.0 a 2.0 disparos por segundo
        
        // Actualizar la escala y velocidad según la masa inicial
        this.updateScale();
        this.updateEnemySpeed();
        
        // Estado del enemigo
        this.state = 'patrol'; // patrol, chase, attack
        this.patrolPoint = new THREE.Vector3(x, y, z); // Punto central de patrulla
        this.targetPosition = new THREE.Vector3(); // Posición objetivo actual
        this.lastStateChange = 0; // Tiempo del último cambio de estado
        this.patrolWaitTime = 0; // Tiempo de espera en un punto de patrulla
        this.lastDebugTime = 0; // Para depuración
        this.isMoving = true; // Asegurar que el tanque siempre esté en movimiento
        
        // Cambiar el color del tanque enemigo a rojo
        this.setColor(0xAA0000);
        
        // Crear barra de vida
        this.createHealthBar();
        
        // Iniciar comportamiento de patrulla
        this.generatePatrolTarget();
        
        console.log("Tanque enemigo creado en", x, z);
    }
    
    setColor(color) {
        // Cambiar el color del cuerpo y la torreta
        if (this.body) {
            this.body.material.color.setHex(color);
        }
        if (this.turret) {
            this.turret.material.color.setHex(color);
        }
    }
    
    createHealthBar() {
        // Crear contenedor para la barra de vida
        this.healthBarContainer = document.createElement('div');
        this.healthBarContainer.className = 'enemy-health-container';
        this.healthBarContainer.style.position = 'absolute';
        this.healthBarContainer.style.width = '50px';
        this.healthBarContainer.style.height = '8px';
        this.healthBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.healthBarContainer.style.border = '1px solid #000';
        this.healthBarContainer.style.borderRadius = '3px';
        this.healthBarContainer.style.pointerEvents = 'none'; // Evitar que interfiera con clics
        
        // Crear la barra de vida
        this.healthBarFill = document.createElement('div');
        this.healthBarFill.className = 'enemy-health-fill';
        this.healthBarFill.style.width = '100%';
        this.healthBarFill.style.height = '100%';
        this.healthBarFill.style.backgroundColor = '#ff0000';
        this.healthBarFill.style.borderRadius = '2px';
        this.healthBarFill.style.transition = 'width 0.3s';
        
        // Añadir la barra al contenedor
        this.healthBarContainer.appendChild(this.healthBarFill);
        
        // Añadir el contenedor al DOM
        document.body.appendChild(this.healthBarContainer);
    }
    
    updateHealthBar(camera, renderer) {
        if (!this.healthBarContainer) return;
        
        // Actualizar el porcentaje de vida
        const healthPercent = (this.health / 100) * 100;
        this.healthBarFill.style.width = `${healthPercent}%`;
        
        // Cambiar el color según la vida restante
        if (healthPercent > 60) {
            this.healthBarFill.style.backgroundColor = '#00cc00'; // Verde
        } else if (healthPercent > 30) {
            this.healthBarFill.style.backgroundColor = '#ffcc00'; // Amarillo
        } else {
            this.healthBarFill.style.backgroundColor = '#ff0000'; // Rojo
        }
        
        // Ajustar el tamaño de la barra de vida según la escala del tanque
        const barWidth = 50 * this.scaleFactor;
        this.healthBarContainer.style.width = `${barWidth}px`;
        
        // Posicionar la barra de vida sobre el tanque en la pantalla
        if (this.tankGroup) {
            // Crear un vector para la posición del tanque
            const position = new THREE.Vector3();
            // Obtener la posición del tanque y ajustarla para que esté sobre él
            position.setFromMatrixPosition(this.tankGroup.matrixWorld);
            position.y += 3 * this.scaleFactor; // Ajustar la altura según la escala
            
            // Proyectar la posición 3D a coordenadas 2D de la pantalla
            const screenPosition = position.clone();
            screenPosition.project(camera);
            
            // Convertir a coordenadas de píxeles
            const x = (screenPosition.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
            const y = (-(screenPosition.y * 0.5) + 0.5) * renderer.domElement.clientHeight;
            
            // Posicionar la barra de vida
            this.healthBarContainer.style.left = `${x - 25}px`; // Centrar (ancho = 50px)
            this.healthBarContainer.style.top = `${y - 30}px`; // Posicionar sobre el tanque
            
            // Mostrar u ocultar según si está en pantalla
            if (screenPosition.z > 1 || // Detrás de la cámara
                x < 0 || x > renderer.domElement.clientWidth || 
                y < 0 || y > renderer.domElement.clientHeight) {
                this.healthBarContainer.style.display = 'none';
            } else {
                this.healthBarContainer.style.display = 'block';
            }
        }
    }
    
    update(deltaTime, playerTank, gameController) {
        if (!this.active || this.health <= 0) return;
        
        // Forzar movimiento constante
        // Si el tanque ha estado en el mismo lugar por más de 2 segundos, generar un nuevo punto de patrulla
        if (!this._lastPosition) {
            this._lastPosition = this.tankGroup.position.clone();
            this._stationaryTime = 0;
        } else {
            const distance = this._lastPosition.distanceTo(this.tankGroup.position);
            if (distance < 0.5) { // Si apenas se ha movido
                this._stationaryTime += deltaTime;
                if (this._stationaryTime > 1) { // Reducido de 2 a 1 segundo para ser más reactivo
                    console.log("Tanque enemigo estancado, generando nuevo punto de patrulla");
                    this.generatePatrolTarget();
                    this._stationaryTime = 0;
                }
            } else {
                // Se ha movido, reiniciar contador
                this._stationaryTime = 0;
                this._lastPosition.copy(this.tankGroup.position);
            }
        }
        
        // Depuración periódica
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastDebugTime > 5) {
            this.lastDebugTime = currentTime;
            console.log(`Tanque enemigo en (${this.tankGroup.position.x.toFixed(1)}, ${this.tankGroup.position.z.toFixed(1)}), estado: ${this.state}`);
        }
        
        // Actualizar el comportamiento según el estado
        if (playerTank && playerTank.active) {
            const distanceToPlayer = this.tankGroup.position.distanceTo(playerTank.getMesh().position);
            
            // Cambiar de estado según la distancia al jugador
            // Asegurarse de que los tanques ataquen cuando estén cerca
            if (distanceToPlayer < this.fireRadius * 0.9) { // Reducido para que entren en modo ataque más fácilmente
                if (this.state !== 'attack') {
                    console.log("Tanque enemigo cambia a modo ATAQUE");
                    this.state = 'attack';
                }
            } else if (distanceToPlayer < this.detectionRadius) { // Sin multiplicador para que persigan cuando detecten
                if (this.state !== 'chase') {
                    console.log("Tanque enemigo cambia a modo PERSECUCIÓN");
                    this.state = 'chase';
                }
            } else {
                if (this.state !== 'patrol') {
                    console.log("Tanque enemigo cambia a modo PATRULLA");
                    this.state = 'patrol';
                }
            }
            
            // Ejecutar comportamiento según el estado
            switch (this.state) {
                case 'patrol':
                    this.updatePatrol(deltaTime);
                    break;
                case 'chase':
                    this.updateChase(deltaTime, playerTank, gameController);
                    break;
                case 'attack':
                    this.updateAttack(deltaTime, playerTank, gameController);
                    break;
            }
        } else {
            // Si no hay jugador, patrullar
            this.updatePatrol(deltaTime);
        }
        
        // Adaptar el tanque al terreno si hay un terreno
        if (gameController && gameController.terrain) {
            this.adaptToTerrain(gameController.terrain);
        }
    }
    
    generatePatrolTarget() {
        // Generar un nuevo punto aleatorio dentro del radio de patrulla
        // Usar un radio mínimo para asegurar que el tanque se mueva una distancia significativa
        const angle = Math.random() * Math.PI * 2;
        const minRadius = this.patrolRadius * 0.5; // Radio mínimo mayor para asegurar movimiento más notable
        const radius = minRadius + Math.random() * (this.patrolRadius - minRadius);
        
        // Generar un punto que esté significativamente lejos de la posición actual
        const currentPos = this.tankGroup.position;
        let attempts = 0;
        let foundGoodPoint = false;
        let newTarget;
        
        // Intentar encontrar un punto que esté a una distancia significativa
        while (!foundGoodPoint && attempts < 5) {
            const newAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5; // Variar el ángulo un poco
            const newRadius = minRadius + Math.random() * (this.patrolRadius - minRadius);
            
            newTarget = new THREE.Vector3(
                this.patrolPoint.x + Math.cos(newAngle) * newRadius,
                0, // La altura se ajustará con adaptToTerrain
                this.patrolPoint.z + Math.sin(newAngle) * newRadius
            );
            
            // Verificar si el punto está lo suficientemente lejos
            const distanceToNew = currentPos.distanceTo(newTarget);
            if (distanceToNew > this.patrolRadius * 0.4) {
                foundGoodPoint = true;
            }
            
            attempts++;
        }
        
        // Si no encontramos un buen punto, usar el último generado
        this.targetPosition = foundGoodPoint ? newTarget : new THREE.Vector3(
            this.patrolPoint.x + Math.cos(angle) * radius,
            0,
            this.patrolPoint.z + Math.sin(angle) * radius
        );
        
        // Actualizar el punto central de patrulla para que el tanque se mueva por el mapa
        // Esto hace que el tanque explore gradualmente diferentes áreas
        this.patrolPoint.x += (Math.random() - 0.5) * 10; // Mayor desplazamiento
        this.patrolPoint.z += (Math.random() - 0.5) * 10;
        
        console.log(`Nuevo punto de patrulla: (${this.targetPosition.x.toFixed(1)}, ${this.targetPosition.z.toFixed(1)})`);
    }
    
    updatePatrol(deltaTime) {
        // Eliminar completamente el tiempo de espera para mantener movimiento constante
        if (this.patrolWaitTime > 0) {
            this.patrolWaitTime = 0; // Forzar a que no espere
        }
        
        // Si no tenemos un punto objetivo o estamos cerca del actual
        const position = this.tankGroup.position;
        if (!this.targetPosition || position.distanceTo(this.targetPosition) < 2) {
            // Generar un nuevo punto de patrulla inmediatamente
            this.generatePatrolTarget();
            // No establecer tiempo de espera
            return;
        }
        
        // Moverse hacia el punto objetivo con velocidad constante
        // Usar una velocidad ligeramente mayor para asegurar movimiento visible
        this.moveTowards(this.targetPosition, this.patrolSpeed * 1.2, deltaTime);
        
        // Si el tanque no se ha movido significativamente durante un tiempo
        // (esto se maneja en el método update)
    }
    
    updateChase(deltaTime, playerTank, gameController) {
        if (!playerTank || !gameController) return;
        
        // Perseguir al jugador con velocidad reducida
        const playerPosition = playerTank.getMesh().position;
        
        // Comportamiento modificado: acercarse al jugador para atacar en vez de solo perseguir
        const distanceToPlayer = this.tankGroup.position.distanceTo(playerPosition);
        
        // Si está a buena distancia, moverse lateralmente para esquivar y atacar
        if (distanceToPlayer < this.fireRadius * 0.8) {
            // Crear un punto de movimiento perpendicular a la dirección jugador->enemigo
            const dirToPlayer = new THREE.Vector3().subVectors(this.tankGroup.position, playerPosition).normalize();
            // Vector perpendicular (rotar 90 grados)
            const perpendicular = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x);
            // Alternar dirección lateral cada cierto tiempo para movimiento zigzag
            const currentTime = Math.floor(Date.now() / 2000); // Cambiar cada 2 segundos
            if (currentTime % 2 === 0) {
                perpendicular.multiplyScalar(-1);
            }
            
            // Punto objetivo para movimiento lateral
            const lateralTarget = new THREE.Vector3().addVectors(
                this.tankGroup.position, 
                perpendicular.multiplyScalar(10)
            );
            
            this.moveTowards(lateralTarget, this.patrolSpeed, deltaTime);
        } else {
            // Perseguir al jugador si está lejos
            this.moveTowards(playerPosition, this.chaseSpeed, deltaTime);
        }
        
        // Apuntar la torreta hacia el jugador con mayor precisión
        this.aimAt(playerPosition, deltaTime * 2.5);
        
        // Disparar mientras persigue
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastFireTime > 1.5) { // Disparar cada 1.5 segundos durante la persecución
            this.lastFireTime = currentTime;
            const projectile = this.fire();
            if (projectile && gameController) {
                console.log("Tanque enemigo dispara durante persecución");
                gameController.addProjectile(projectile);
            }
        }
    }
    
    updateAttack(deltaTime, playerTank, gameController) {
        if (!playerTank || !gameController) return;
        
        // Obtener la posición del jugador
        const playerPosition = playerTank.getMesh().position;
        
        // Comportamiento más agresivo: mantener distancia óptima para disparar
        const distanceToPlayer = this.tankGroup.position.distanceTo(playerPosition);
        
        // Comportamiento modificado: mantener distancia óptima en vez de huir
        if (distanceToPlayer > this.fireRadius * 0.7) {
            // Acercarse al jugador si está demasiado lejos
            this.moveTowards(playerPosition, this.chaseSpeed * 0.8, deltaTime);
        } else if (distanceToPlayer < this.fireRadius * 0.4) {
            // Alejarse si está demasiado cerca
            const dirFromPlayer = new THREE.Vector3().subVectors(this.tankGroup.position, playerPosition).normalize();
            const retreatTarget = new THREE.Vector3().addVectors(
                this.tankGroup.position,
                dirFromPlayer.multiplyScalar(10)
            );
            this.moveTowards(retreatTarget, this.patrolSpeed, deltaTime);
        } else {
            // Si está a buena distancia, moverse lateralmente para esquivar
            // Crear un punto de movimiento perpendicular a la dirección jugador->enemigo
            const dirToPlayer = new THREE.Vector3().subVectors(this.tankGroup.position, playerPosition).normalize();
            // Vector perpendicular (rotar 90 grados)
            const perpendicular = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x);
            // Alternar dirección lateral cada cierto tiempo para movimiento zigzag
            const currentTime = Math.floor(Date.now() / 2000); // Cambiar cada 2 segundos
            if (currentTime % 2 === 0) {
                perpendicular.multiplyScalar(-1);
            }
            
            // Punto objetivo para movimiento lateral
            const lateralTarget = new THREE.Vector3().addVectors(
                this.tankGroup.position, 
                perpendicular.multiplyScalar(10)
            );
            
            this.moveTowards(lateralTarget, this.patrolSpeed * 0.7, deltaTime);
        }
        
        // Apuntar la torreta hacia el jugador con mayor precisión
        this.aimAt(playerPosition, deltaTime * 3);
        
        // Disparar con mayor frecuencia en modo ataque
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastFireTime > 1 / this.fireRate) {
            this.lastFireTime = currentTime;
            const projectile = this.fire();
            if (projectile && gameController) {
                console.log("Tanque enemigo dispara en modo ataque");
                gameController.addProjectile(projectile);
            }
        }
    }
    
    moveTowards(targetPosition, speed, deltaTime) {
        // Calcular dirección hacia el objetivo
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.tankGroup.position)
            .normalize();
        
        // Girar hacia el objetivo más rápidamente
        this.turnTowards(targetPosition, deltaTime * 1.5);
        
        // Mover en la dirección del tanque
        const tankDirection = this.getDirection();
        const dot = tankDirection.dot(direction);
        
        // Siempre moverse, incluso si no está perfectamente alineado
        if (dot > 0.3) { // Reducido aún más para permitir movimiento casi constante
            // Velocidad completa cuando está bien alineado
            this.tankGroup.position.x += tankDirection.x * speed * deltaTime;
            this.tankGroup.position.z += tankDirection.z * speed * deltaTime;
        } else {
            // Incluso con mala alineación, moverse a velocidad reducida
            this.tankGroup.position.x += tankDirection.x * speed * 0.5 * deltaTime;
            this.tankGroup.position.z += tankDirection.z * speed * 0.5 * deltaTime;
            
            // Aplicar un pequeño movimiento lateral para evitar obstaculizaciones
            const perpendicular = new THREE.Vector3(-tankDirection.z, 0, tankDirection.x);
            this.tankGroup.position.x += perpendicular.x * speed * 0.3 * deltaTime;
            this.tankGroup.position.z += perpendicular.z * speed * 0.3 * deltaTime;
        }
        
        // Registrar que el tanque se ha movido
        this._lastMoveTime = Date.now() / 1000;
    }
    
    moveAway(targetPosition, speed, deltaTime) {
        // Calcular dirección alejándose del objetivo
        const direction = new THREE.Vector3()
            .subVectors(this.tankGroup.position, targetPosition)
            .normalize();
        
        // Girar en dirección opuesta al objetivo
        this.turnTowards(
            new THREE.Vector3(
                this.tankGroup.position.x + direction.x * 10,
                this.tankGroup.position.y,
                this.tankGroup.position.z + direction.z * 10
            ), 
            deltaTime
        );
        
        // Mover en la dirección del tanque
        const tankDirection = this.getDirection();
        const dot = tankDirection.dot(direction);
        
        // Solo retroceder si estamos mirando aproximadamente en dirección opuesta al objetivo
        if (dot > 0.7) {
            this.tankGroup.position.x += tankDirection.x * speed * deltaTime;
            this.tankGroup.position.z += tankDirection.z * speed * deltaTime;
        }
    }
    
    turnTowards(targetPosition, deltaTime) {
        // Calcular dirección hacia el objetivo
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.tankGroup.position)
            .normalize();
        
        // Calcular el ángulo hacia el objetivo
        const targetAngle = Math.atan2(direction.x, direction.z);
        
        // Obtener la rotación actual del tanque
        const currentRotation = this.tankGroup.rotation.y;
        
        // Calcular la diferencia de ángulo (considerando el ciclo de 2π)
        let angleDiff = targetAngle - currentRotation;
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Girar hacia el objetivo con una velocidad limitada
        const turnAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.turnSpeed * deltaTime);
        this.tankGroup.rotation.y += turnAmount;
    }
    
    aimAt(targetPosition, deltaTime) {
        // Calcular dirección hacia el objetivo en el espacio local de la torreta
        const worldPos = new THREE.Vector3();
        this.turret.getWorldPosition(worldPos);
        
        const localDirection = new THREE.Vector3()
            .subVectors(targetPosition, worldPos)
            .normalize();
        
        // Convertir a coordenadas locales del tanque
        const tankDirection = new THREE.Vector3(0, 0, 1)
            .applyQuaternion(this.tankGroup.quaternion);
        
        // Calcular el ángulo entre la dirección del tanque y la dirección al objetivo
        const targetAngle = Math.atan2(
            localDirection.x * tankDirection.z - localDirection.z * tankDirection.x,
            localDirection.x * tankDirection.x + localDirection.z * tankDirection.z
        );
        
        // Ajustar la rotación de la torreta gradualmente
        const turnSpeed = 2.0; // Velocidad de giro de la torreta
        const turnAmount = Math.sign(targetAngle) * Math.min(Math.abs(targetAngle), turnSpeed * deltaTime);
        this.turretAngle += turnAmount;
        this.turret.rotation.y = this.turretAngle;
    }
    
    takeDamage(amount) {
        // Llamar al método de la clase padre que ya actualiza la masa
        super.takeDamage(amount);
        
        // Actualizar la barra de vida inmediatamente
        if (this.healthBarFill) {
            const healthPercent = Math.max(0, (this.health / 100) * 100);
            this.healthBarFill.style.width = `${healthPercent}%`;
            
            // Cambiar el color según la vida restante
            if (healthPercent > 60) {
                this.healthBarFill.style.backgroundColor = '#00cc00'; // Verde
            } else if (healthPercent > 30) {
                this.healthBarFill.style.backgroundColor = '#ffcc00'; // Amarillo
            } else {
                this.healthBarFill.style.backgroundColor = '#ff0000'; // Rojo
            }
            
            // Ajustar el tamaño de la barra de vida según la escala del tanque
            if (this.healthBarContainer) {
                const barWidth = 50 * this.scaleFactor; // Ajustar el ancho según la escala
                this.healthBarContainer.style.width = `${barWidth}px`;
            }
        }
        
        // Si la salud llega a cero, desactivar el tanque
        if (this.health <= 0) {
            this.deactivate();
        }
    }
    
    deactivate() {
        this.active = false;
        
        // Ocultar la barra de vida
        if (this.healthBarContainer) {
            this.healthBarContainer.style.display = 'none';
        }
        
        // Aquí se podría añadir una animación de destrucción
        console.log("Tanque enemigo destruido");
    }
    
    destroy() {
        // Eliminar la barra de vida del DOM
        if (this.healthBarContainer && this.healthBarContainer.parentNode) {
            this.healthBarContainer.parentNode.removeChild(this.healthBarContainer);
        }
        
        // Eliminar el tanque de la escena
        if (this.tankGroup && this.scene) {
            this.scene.remove(this.tankGroup);
        }
        
        // Liberar recursos
        this.disposeResources();
    }
    
    disposeResources() {
        // Liberar geometrías y materiales
        if (this.body) {
            this.body.geometry.dispose();
            this.body.material.dispose();
        }
        
        if (this.turret) {
            this.turret.geometry.dispose();
            this.turret.material.dispose();
        }
        
        if (this.cannon) {
            this.cannon.geometry.dispose();
            this.cannon.material.dispose();
        }
        
        if (this.leftTrack) {
            this.leftTrack.geometry.dispose();
            this.leftTrack.material.dispose();
        }
        
        if (this.rightTrack) {
            this.rightTrack.geometry.dispose();
            this.rightTrack.material.dispose();
        }
    }
    
    /**
     * Actualiza las velocidades del enemigo basadas en la masa actual
     * Aplica la fórmula v = v0/(m^0.1) a las velocidades específicas del enemigo
     */
    updateEnemySpeed() {
        // Aplicar la fórmula de velocidad basada en la masa
        // Usamos m^0.1 en lugar de m^0.25 para un impacto mínimo
        const massFactor = 1 / Math.pow(this.mass, 0.1);
        
        // Actualizar velocidades y radios según la masa
        this.detectionRadius = this.baseDetectionRadius * massFactor;
        this.fireRadius = this.baseFireRadius * massFactor;
        this.patrolRadius = this.basePatrolRadius * massFactor;
        this.patrolSpeed = this.basePatrolSpeed * massFactor;
        this.chaseSpeed = this.baseChaseSpeed * massFactor;
        this.turnSpeed = this.baseTurnSpeed * massFactor;
        
        // Establecer límites mínimos más bajos para que los tanques sean más lentos
        const minSpeed = 8.0; // Velocidad mínima (reducida de 15.0 a 8.0)
        if (this.patrolSpeed < minSpeed) this.patrolSpeed = minSpeed;
        if (this.chaseSpeed < minSpeed) this.chaseSpeed = minSpeed;
        if (this.turnSpeed < 1.5) this.turnSpeed = 1.5; // Reducido de 3.0 a 1.5
        
        // Los radios no deberían ser demasiado pequeños
        const minRadius = 40; // Mantener el radio de detección
        if (this.detectionRadius < minRadius) this.detectionRadius = minRadius;
        if (this.fireRadius < minRadius/1.5) this.fireRadius = minRadius/1.5;
        if (this.patrolRadius < minRadius) this.patrolRadius = minRadius;
    }
    
    // Sobrescribir el método updateMass para actualizar también las velocidades del enemigo
    updateMass(newMass) {
        // Llamar al método de la clase padre
        super.updateMass(newMass);
        
        // Actualizar las velocidades específicas del enemigo
        this.updateEnemySpeed();
    }
} 