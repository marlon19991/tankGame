class EnemyTank extends Tank {
    constructor(scene, x, y, z) {
        super(scene, x, y, z);
        
        // Propiedades específicas del enemigo
        this.detectionRadius = 50; // Aumentar el radio de detección
        this.fireRadius = 30; // Aumentar el radio de disparo
        this.patrolRadius = 20; // Aumentar el radio de patrulla
        this.patrolSpeed = 5; // Aumentar la velocidad de patrulla
        this.chaseSpeed = 8; // Aumentar la velocidad de persecución
        this.turnSpeed = 2; // Aumentar la velocidad de giro
        this.fireRate = 1.5; // Disparos por segundo
        
        // Estado del enemigo
        this.state = 'patrol'; // patrol, chase, attack
        this.patrolPoint = new THREE.Vector3(x, y, z); // Punto central de patrulla
        this.targetPosition = new THREE.Vector3(); // Posición objetivo actual
        this.lastStateChange = 0; // Tiempo del último cambio de estado
        this.patrolWaitTime = 0; // Tiempo de espera en un punto de patrulla
        this.lastDebugTime = 0; // Para depuración
        
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
        
        // Posicionar la barra de vida sobre el tanque en la pantalla
        if (this.tankGroup) {
            // Crear un vector para la posición del tanque
            const position = new THREE.Vector3();
            // Obtener la posición del tanque y ajustarla para que esté sobre él
            position.setFromMatrixPosition(this.tankGroup.matrixWorld);
            position.y += 3; // Ajustar la altura
            
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
            if (distanceToPlayer < this.fireRadius) {
                if (this.state !== 'attack') {
                    console.log("Tanque enemigo cambia a modo ATAQUE");
                    this.state = 'attack';
                }
            } else if (distanceToPlayer < this.detectionRadius) {
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
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.patrolRadius;
        this.targetPosition = new THREE.Vector3(
            this.patrolPoint.x + Math.cos(angle) * radius,
            0, // La altura se ajustará con adaptToTerrain
            this.patrolPoint.z + Math.sin(angle) * radius
        );
        
        console.log(`Nuevo punto de patrulla: (${this.targetPosition.x.toFixed(1)}, ${this.targetPosition.z.toFixed(1)})`);
    }
    
    updatePatrol(deltaTime) {
        // Si estamos esperando en un punto de patrulla
        if (this.patrolWaitTime > 0) {
            this.patrolWaitTime -= deltaTime;
            // Girar lentamente mientras espera
            this.tankGroup.rotation.y += deltaTime * 0.5;
            return;
        }
        
        // Si no tenemos un punto objetivo o hemos llegado al actual
        const position = this.tankGroup.position;
        if (!this.targetPosition || position.distanceTo(this.targetPosition) < 1) {
            // Generar un nuevo punto de patrulla
            this.generatePatrolTarget();
            
            // Establecer un tiempo de espera aleatorio
            this.patrolWaitTime = 1 + Math.random() * 2;
            return;
        }
        
        // Moverse hacia el punto objetivo
        this.moveTowards(this.targetPosition, this.patrolSpeed, deltaTime);
    }
    
    updateChase(deltaTime, playerTank, gameController) {
        if (!playerTank || !gameController) return;
        
        // Perseguir al jugador
        const playerPosition = playerTank.getMesh().position;
        this.moveTowards(playerPosition, this.chaseSpeed, deltaTime);
        
        // Apuntar la torreta hacia el jugador mientras persigue
        this.aimAt(playerPosition, deltaTime);
        
        // Disparar ocasionalmente mientras persigue
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastFireTime > 2) { // Disparar cada 2 segundos durante la persecución
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
        
        // Moverse hacia el jugador pero mantener distancia
        const distanceToPlayer = this.tankGroup.position.distanceTo(playerPosition);
        if (distanceToPlayer < this.fireRadius * 0.6) {
            // Retroceder si está demasiado cerca
            this.moveAway(playerPosition, this.patrolSpeed * 1.2, deltaTime);
        } else if (distanceToPlayer > this.fireRadius * 0.8) {
            // Acercarse si está demasiado lejos
            this.moveTowards(playerPosition, this.patrolSpeed * 1.2, deltaTime);
        } else {
            // Mantener la posición y girar para apuntar al jugador
            this.turnTowards(playerPosition, deltaTime * 1.5);
        }
        
        // Apuntar la torreta hacia el jugador
        this.aimAt(playerPosition, deltaTime * 2);
        
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
        
        // Girar hacia el objetivo
        this.turnTowards(targetPosition, deltaTime);
        
        // Mover en la dirección del tanque
        const tankDirection = this.getDirection();
        const dot = tankDirection.dot(direction);
        
        // Solo avanzar si estamos mirando aproximadamente hacia el objetivo
        if (dot > 0.7) {
            this.tankGroup.position.x += tankDirection.x * speed * deltaTime;
            this.tankGroup.position.z += tankDirection.z * speed * deltaTime;
        }
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
} 