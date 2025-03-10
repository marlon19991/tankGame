class Radar {
    constructor(gameController) {
        this.gameController = gameController;
        this.radarSize = 150; // Tamaño del radar en píxeles
        this.radarRange = 100; // Rango del radar en unidades del juego
        this.createRadarElement();
    }

    createRadarElement() {
        // Crear el elemento principal del radar
        this.radarContainer = document.createElement('div');
        this.radarContainer.id = 'radar-container';
        this.radarContainer.style.position = 'absolute';
        this.radarContainer.style.bottom = '20px';
        this.radarContainer.style.right = '20px';
        this.radarContainer.style.width = `${this.radarSize}px`;
        this.radarContainer.style.height = `${this.radarSize}px`;
        this.radarContainer.style.borderRadius = '50%';
        this.radarContainer.style.backgroundColor = 'rgba(35, 60, 35, 0.7)'; // Verde militar semi-transparente
        this.radarContainer.style.border = '2px solid rgba(100, 160, 100, 0.8)';
        this.radarContainer.style.boxShadow = '0 0 10px rgba(100, 255, 100, 0.3)';
        this.radarContainer.style.overflow = 'hidden';
        this.radarContainer.style.zIndex = '1000';
        
        // Crear el canvas para dibujar los elementos del radar
        this.radarCanvas = document.createElement('canvas');
        this.radarCanvas.width = this.radarSize;
        this.radarCanvas.height = this.radarSize;
        this.radarCanvas.style.position = 'absolute';
        this.radarCanvas.style.top = '0';
        this.radarCanvas.style.left = '0';
        
        // Crear los círculos concéntricos
        this.createRadarCircles();
        
        // Crear el indicador del norte
        this.createNorthIndicator();
        
        // Añadir el canvas al contenedor
        this.radarContainer.appendChild(this.radarCanvas);
        
        // Añadir el contenedor al documento
        document.body.appendChild(this.radarContainer);
        
        // Obtener el contexto del canvas para dibujar
        this.ctx = this.radarCanvas.getContext('2d');
    }
    
    createRadarCircles() {
        // Crear círculos concéntricos para el radar
        const circlesContainer = document.createElement('div');
        circlesContainer.style.position = 'absolute';
        circlesContainer.style.top = '0';
        circlesContainer.style.left = '0';
        circlesContainer.style.width = '100%';
        circlesContainer.style.height = '100%';
        circlesContainer.style.pointerEvents = 'none';
        
        // Crear 3 círculos concéntricos
        for (let i = 1; i <= 3; i++) {
            const circle = document.createElement('div');
            const size = (i / 3) * 100;
            circle.style.position = 'absolute';
            circle.style.top = `${50 - size / 2}%`;
            circle.style.left = `${50 - size / 2}%`;
            circle.style.width = `${size}%`;
            circle.style.height = `${size}%`;
            circle.style.borderRadius = '50%';
            circle.style.border = '1px solid rgba(100, 200, 100, 0.4)';
            circlesContainer.appendChild(circle);
        }
        
        // Crear líneas cruzadas
        const horizontalLine = document.createElement('div');
        horizontalLine.style.position = 'absolute';
        horizontalLine.style.top = '50%';
        horizontalLine.style.left = '0';
        horizontalLine.style.width = '100%';
        horizontalLine.style.height = '1px';
        horizontalLine.style.backgroundColor = 'rgba(100, 200, 100, 0.4)';
        
        const verticalLine = document.createElement('div');
        verticalLine.style.position = 'absolute';
        verticalLine.style.top = '0';
        verticalLine.style.left = '50%';
        verticalLine.style.width = '1px';
        verticalLine.style.height = '100%';
        verticalLine.style.backgroundColor = 'rgba(100, 200, 100, 0.4)';
        
        circlesContainer.appendChild(horizontalLine);
        circlesContainer.appendChild(verticalLine);
        
        this.radarContainer.appendChild(circlesContainer);
    }
    
    createNorthIndicator() {
        // Crear un contenedor para el indicador del norte que estará fuera del radar
        const northContainer = document.createElement('div');
        northContainer.style.position = 'absolute';
        northContainer.style.top = '-25px'; // Posicionarlo encima del radar
        northContainer.style.left = '50%';
        northContainer.style.transform = 'translateX(-50%)';
        northContainer.style.width = '20px';
        northContainer.style.height = '20px';
        northContainer.style.zIndex = '1001';
        
        // Crear el indicador visual del norte (triángulo rojo)
        const northTriangle = document.createElement('div');
        northTriangle.style.position = 'absolute';
        northTriangle.style.bottom = '0';
        northTriangle.style.left = '50%';
        northTriangle.style.transform = 'translateX(-50%)';
        northTriangle.style.width = '0';
        northTriangle.style.height = '0';
        northTriangle.style.borderLeft = '8px solid transparent';
        northTriangle.style.borderRight = '8px solid transparent';
        northTriangle.style.borderTop = '10px solid rgba(200, 50, 50, 0.9)';
        
        // Añadir la etiqueta "N" para el norte
        const northLabel = document.createElement('div');
        northLabel.textContent = 'N';
        northLabel.style.position = 'absolute';
        northLabel.style.top = '-5px';
        northLabel.style.left = '50%';
        northLabel.style.transform = 'translateX(-50%)';
        northLabel.style.color = 'rgba(200, 50, 50, 0.9)';
        northLabel.style.fontSize = '14px';
        northLabel.style.fontWeight = 'bold';
        northLabel.style.fontFamily = 'Arial, sans-serif';
        northLabel.style.textShadow = '0px 0px 2px rgba(0, 0, 0, 0.5)';
        
        // Añadir los elementos al contenedor
        northContainer.appendChild(northTriangle);
        northContainer.appendChild(northLabel);
        
        // Añadir el contenedor al radar
        this.radarContainer.appendChild(northContainer);
        
        // Guardar referencia para poder actualizarlo
        this.northContainer = northContainer;
    }
    
    update() {
        if (!this.gameController || !this.gameController.playerTank) return;
        
        // Limpiar el canvas
        this.ctx.clearRect(0, 0, this.radarSize, this.radarSize);
        
        // Obtener la posición y rotación del jugador
        const playerPosition = this.gameController.playerTank.tankGroup.position;
        const playerRotation = this.gameController.playerTank.tankGroup.rotation.y;
        
        // Actualizar la posición del indicador del norte basado en la rotación del jugador
        // El norte siempre debe estar en la dirección correcta respecto a la rotación del jugador
        if (this.northContainer) {
            // Calcular la posición del norte en el borde del radar
            const northAngle = -playerRotation; // Negativo porque queremos compensar la rotación del jugador
            
            // El norte siempre está en la parte superior, solo ajustamos su posición horizontal
            // basada en la rotación del jugador para que siempre apunte al norte real
            const northX = 50 + Math.sin(northAngle) * 50; // 50% + desplazamiento basado en rotación
            
            // Limitar la posición para que no se salga demasiado del radar
            const clampedX = Math.max(10, Math.min(90, northX));
            
            // Aplicar la nueva posición
            this.northContainer.style.left = `${clampedX}%`;
        }
        
        // Dibujar el punto del jugador en el centro
        this.ctx.fillStyle = 'rgba(100, 200, 255, 0.9)'; // Azul para el jugador
        this.ctx.beginPath();
        this.ctx.arc(this.radarSize / 2, this.radarSize / 2, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Dibujar una pequeña flecha para indicar la dirección del jugador
        this.ctx.save();
        this.ctx.translate(this.radarSize / 2, this.radarSize / 2);
        this.ctx.rotate(-playerRotation); // Negativo porque el eje Y está invertido en el canvas
        this.ctx.beginPath();
        this.ctx.moveTo(0, -8);
        this.ctx.lineTo(-4, 0);
        this.ctx.lineTo(4, 0);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(100, 200, 255, 0.9)';
        this.ctx.fill();
        this.ctx.restore();
        
        // Dibujar los tanques enemigos
        if (this.gameController.enemyTanks) {
            this.gameController.enemyTanks.forEach(enemyTank => {
                if (!enemyTank.active) return;
                
                // Calcular la posición relativa al jugador
                const dx = enemyTank.tankGroup.position.x - playerPosition.x;
                const dz = enemyTank.tankGroup.position.z - playerPosition.z;
                
                // Calcular la distancia
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // Solo mostrar enemigos dentro del rango del radar
                if (distance <= this.radarRange) {
                    // Calcular la posición en el radar (rotar según la orientación del jugador)
                    const angle = Math.atan2(dz, dx) - playerRotation;
                    const radarX = this.radarSize / 2 + Math.cos(angle) * (distance / this.radarRange) * (this.radarSize / 2);
                    const radarY = this.radarSize / 2 + Math.sin(angle) * (distance / this.radarRange) * (this.radarSize / 2);
                    
                    // Dibujar el punto del enemigo
                    this.ctx.fillStyle = 'rgba(255, 50, 50, 0.9)'; // Rojo para los enemigos
                    this.ctx.beginPath();
                    this.ctx.arc(radarX, radarY, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            });
        }
        
        // Dibujar los edificios
        if (this.gameController.buildings) {
            this.gameController.buildings.forEach(building => {
                // Calcular la posición relativa al jugador
                const dx = building.mesh.position.x - playerPosition.x;
                const dz = building.mesh.position.z - playerPosition.z;
                
                // Calcular la distancia
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // Solo mostrar edificios dentro del rango del radar
                if (distance <= this.radarRange) {
                    // Calcular la posición en el radar (rotar según la orientación del jugador)
                    const angle = Math.atan2(dz, dx) - playerRotation;
                    const radarX = this.radarSize / 2 + Math.cos(angle) * (distance / this.radarRange) * (this.radarSize / 2);
                    const radarY = this.radarSize / 2 + Math.sin(angle) * (distance / this.radarRange) * (this.radarSize / 2);
                    
                    // Dibujar el punto del edificio
                    this.ctx.fillStyle = 'rgba(200, 200, 200, 0.7)'; // Gris para los edificios
                    this.ctx.beginPath();
                    this.ctx.rect(radarX - 2, radarY - 2, 4, 4);
                    this.ctx.fill();
                }
            });
        }
    }
}
