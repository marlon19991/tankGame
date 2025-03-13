class StatsDisplay {
    constructor() {
        // Crear el contenedor principal
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '10px';
        this.container.style.left = '10px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.container.style.color = '#ffffff';
        this.container.style.padding = '10px';
        this.container.style.fontFamily = 'monospace';
        this.container.style.fontSize = '12px';
        this.container.style.borderRadius = '5px';
        this.container.style.display = 'none';
        this.container.style.zIndex = '1000';
        
        // Crear elementos para cada estadística
        this.stats = {
            fps: this.createStatElement('FPS'),
            tankSpeed: this.createStatElement('Velocidad'),
            tankMass: this.createStatElement('Masa'),
            tankHealth: this.createStatElement('Salud'),
            position: this.createStatElement('Posición'),
            rotation: this.createStatElement('Rotación'),
            projectiles: this.createStatElement('Proyectiles'),
            enemies: this.createStatElement('Enemigos')
        };
        
        // Añadir al DOM
        document.body.appendChild(this.container);
        
        // Variables para el cálculo de FPS
        this.frames = 0;
        this.lastTime = performance.now();
        this.fps = 0;
    }
    
    createStatElement(label) {
        const element = document.createElement('div');
        element.style.marginBottom = '5px';
        element.innerHTML = `${label}: <span>-</span>`;
        this.container.appendChild(element);
        return element;
    }
    
    show() {
        this.container.style.display = 'block';
    }
    
    hide() {
        this.container.style.display = 'none';
    }
    
    update(gameController, deltaTime) {
        // Actualizar FPS
        this.frames++;
        const currentTime = performance.now();
        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round(this.frames * 1000 / (currentTime - this.lastTime));
            this.frames = 0;
            this.lastTime = currentTime;
        }
        
        // Actualizar estadísticas solo si hay un tanque del jugador
        if (gameController.playerTank) {
            const tank = gameController.playerTank;
            const position = tank.getMesh().position;
            const rotation = tank.getMesh().rotation;
            
            // Actualizar cada estadística
            this.updateStat(this.stats.fps, `FPS: ${this.fps}`);
            this.updateStat(this.stats.tankSpeed, `Velocidad: ${Math.abs(tank.speed).toFixed(2)} / ${tank.maxSpeed.toFixed(2)}`);
            this.updateStat(this.stats.tankMass, `Masa: ${tank.mass.toFixed(2)}`);
            this.updateStat(this.stats.tankHealth, `Salud: ${tank.health}`);
            this.updateStat(this.stats.position, `Posición: (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
            this.updateStat(this.stats.rotation, `Rotación: (${(rotation.x * 180 / Math.PI).toFixed(1)}°, ${(rotation.y * 180 / Math.PI).toFixed(1)}°, ${(rotation.z * 180 / Math.PI).toFixed(1)}°)`);
            this.updateStat(this.stats.projectiles, `Proyectiles activos: ${gameController.projectiles.length}`);
            this.updateStat(this.stats.enemies, `Enemigos restantes: ${gameController.enemyTanks.length}`);
        }
    }
    
    updateStat(element, text) {
        element.innerHTML = text;
    }
} 