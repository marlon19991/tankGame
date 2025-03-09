class Minimap {
    constructor() {
        this.createMinimap();
    }
    
    createMinimap() {
        // Crear un canvas para el minimapa
        this.minimapSize = 200; // Tamaño del minimapa en píxeles
        this.mapScale = 0.5; // Escala del mapa (1 unidad de mundo = 0.5 píxeles en el minimapa)
        
        // Crear el canvas y obtener su contexto
        this.minimapCanvas = document.createElement('canvas');
        this.minimapCanvas.width = this.minimapSize;
        this.minimapCanvas.height = this.minimapSize;
        this.minimapContext = this.minimapCanvas.getContext('2d');
        
        // Estilizar el canvas
        this.minimapCanvas.style.position = 'absolute';
        this.minimapCanvas.style.bottom = '20px';
        this.minimapCanvas.style.right = '20px';
        this.minimapCanvas.style.border = '2px solid #333';
        this.minimapCanvas.style.borderRadius = '5px';
        this.minimapCanvas.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        
        // Añadir el canvas al DOM
        document.body.appendChild(this.minimapCanvas);
    }
    
    update(playerTank, enemyTanks, obstacles) {
        // Limpiar el canvas
        this.minimapContext.clearRect(0, 0, this.minimapSize, this.minimapSize);
        
        // Dibujar el fondo del minimapa (representando el terreno)
        this.minimapContext.fillStyle = '#4a6938'; // Color verde oscuro para el terreno
        this.minimapContext.fillRect(0, 0, this.minimapSize, this.minimapSize);
        
        // Calcular el centro del minimapa
        const centerX = this.minimapSize / 2;
        const centerY = this.minimapSize / 2;
        
        // Dibujar obstáculos
        if (obstacles && obstacles.length > 0) {
            this.minimapContext.fillStyle = '#777777'; // Color gris para los obstáculos
            obstacles.forEach(obstacle => {
                const obstacleX = centerX + obstacle.position.x * this.mapScale;
                const obstacleY = centerY + obstacle.position.z * this.mapScale;
                this.minimapContext.beginPath();
                this.minimapContext.arc(obstacleX, obstacleY, 3, 0, Math.PI * 2);
                this.minimapContext.fill();
            });
        }
        
        // Dibujar tanques enemigos
        if (enemyTanks && enemyTanks.length > 0) {
            this.minimapContext.fillStyle = '#ff0000'; // Color rojo para los enemigos
            enemyTanks.forEach(tank => {
                if (tank.active && tank.health > 0) {
                    const tankX = centerX + tank.tankGroup.position.x * this.mapScale;
                    const tankY = centerY + tank.tankGroup.position.z * this.mapScale;
                    this.minimapContext.beginPath();
                    this.minimapContext.arc(tankX, tankY, 4, 0, Math.PI * 2);
                    this.minimapContext.fill();
                }
            });
        }
        
        // Dibujar el tanque del jugador
        if (playerTank && playerTank.active) {
            const playerX = centerX + playerTank.tankGroup.position.x * this.mapScale;
            const playerY = centerY + playerTank.tankGroup.position.z * this.mapScale;
            
            // Dibujar un triángulo que representa la dirección del tanque
            this.minimapContext.fillStyle = '#00ff00'; // Color verde para el jugador
            this.minimapContext.save();
            this.minimapContext.translate(playerX, playerY);
            this.minimapContext.rotate(playerTank.tankGroup.rotation.y);
            this.minimapContext.beginPath();
            this.minimapContext.moveTo(0, -6); // Punta del triángulo
            this.minimapContext.lineTo(-4, 4); // Esquina inferior izquierda
            this.minimapContext.lineTo(4, 4); // Esquina inferior derecha
            this.minimapContext.closePath();
            this.minimapContext.fill();
            this.minimapContext.restore();
        }
    }
} 