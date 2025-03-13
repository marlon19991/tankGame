class Radar {
    constructor(gameController) {
        this.gameController = gameController;
        this.radarSize = 150; // Tamaño del radar en píxeles
        this.radarRange = 300; // Aumentado el rango del radar para ver enemigos más lejanos
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
        // Crear un contenedor circular alrededor del radar para el indicador del norte
        const northIndicatorContainer = document.createElement('div');
        northIndicatorContainer.style.position = 'absolute';
        northIndicatorContainer.style.top = '0';
        northIndicatorContainer.style.left = '0';
        northIndicatorContainer.style.width = '100%';
        northIndicatorContainer.style.height = '100%';
        northIndicatorContainer.style.borderRadius = '50%';
        northIndicatorContainer.style.pointerEvents = 'none';
        northIndicatorContainer.style.zIndex = '1001';
        
        // Crear el indicador visual del norte (triángulo rojo)
        const northContainer = document.createElement('div');
        northContainer.style.position = 'absolute';
        northContainer.style.top = '-25px'; // Posicionarlo encima del radar
        northContainer.style.left = '50%';
        northContainer.style.width = '20px';
        northContainer.style.height = '20px';
        northContainer.style.transformOrigin = 'bottom center'; // Punto de origen para la rotación
        
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
        northIndicatorContainer.appendChild(northContainer);
        this.radarContainer.appendChild(northIndicatorContainer);
        
        // Guardar referencia para poder actualizarlo
        this.northContainer = northContainer;
    }
    
    update(playerTank, enemyTanks) {
        if (!playerTank) return;
        
        // Limpiar el canvas
        this.ctx.clearRect(0, 0, this.radarSize, this.radarSize);
        
        // Obtener la posición y rotación del jugador
        const playerPosition = playerTank.tankGroup.position;
        const playerRotation = playerTank.tankGroup.rotation.y;
        
        // Actualizar la posición del indicador del norte basado en la rotación del jugador
        // El norte siempre debe estar en la dirección correcta respecto a la rotación del jugador
        if (this.northContainer) {
            // Calcular el ángulo de rotación para el indicador del norte
            // Negativo porque queremos compensar la rotación del jugador
            const northAngle = -playerRotation;
            
            // Calcular la posición en coordenadas polares (rotación completa 360°)
            const radius = this.radarSize / 2; // Radio del radar
            
            // Calcular las coordenadas X e Y basadas en el ángulo
            const x = radius + Math.sin(northAngle) * radius;
            const y = radius - Math.cos(northAngle) * radius;
            
            // Convertir a porcentajes para posicionamiento CSS
            const xPercent = (x / this.radarSize) * 100;
            const yPercent = (y / this.radarSize) * 100;
            
            // Aplicar transformación para posicionar y rotar el indicador
            this.northContainer.style.top = `${yPercent}%`;
            this.northContainer.style.left = `${xPercent}%`;
            this.northContainer.style.transform = `translate(-50%, -100%) rotate(${northAngle}rad)`;
            
            // Ajustar la visibilidad basada en la posición
            // Esto asegura que el indicador sea visible incluso cuando está en la parte inferior del radar
            if (yPercent > 75) {
                // Si está en la parte inferior, ajustar el estilo para que sea visible
                this.northContainer.style.top = `${yPercent + 5}%`;
                this.northContainer.style.transform = `translate(-50%, 0%) rotate(${northAngle + Math.PI}rad)`;
            }
        }
        
        // Dibujar el punto del jugador en el centro
        this.ctx.fillStyle = 'rgba(100, 200, 255, 0.9)'; // Azul para el jugador
        this.ctx.beginPath();
        this.ctx.arc(this.radarSize / 2, this.radarSize / 2, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Dibujar los enemigos en el radar
        if (enemyTanks && enemyTanks.length > 0) {
            this.drawEnemies(playerPosition, playerRotation, enemyTanks);
        }
    }

    // Método para dibujar los enemigos en el radar
    drawEnemies(playerPosition, playerRotation, enemyTanks) {
        enemyTanks.forEach(enemyTank => {
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
                
                // Dibujar el punto del enemigo con un efecto pulsante
                const pulseSize = 3 + Math.sin(Date.now() * 0.01) * 1; // Efecto pulsante
                
                // Dibujar un círculo exterior para mejor visibilidad
                this.ctx.fillStyle = 'rgba(255, 50, 50, 0.4)'; // Rojo semi-transparente
                this.ctx.beginPath();
                this.ctx.arc(radarX, radarY, pulseSize + 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Dibujar el punto central del enemigo
                this.ctx.fillStyle = 'rgba(255, 50, 50, 0.9)'; // Rojo para los enemigos
                this.ctx.beginPath();
                this.ctx.arc(radarX, radarY, pulseSize, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Añadir un borde para mejor contraste
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.lineWidth = 0.5;
                this.ctx.stroke();
            }
        });
        
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
    }
}
