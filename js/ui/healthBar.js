class HealthBar {
    constructor() {
        this.createHealthBar();
    }
    
    createHealthBar() {
        // Crear el contenedor principal
        this.container = document.createElement('div');
        this.container.className = 'health-bar-container';
        this.container.style.position = 'absolute';
        this.container.style.bottom = '20px';
        this.container.style.left = '20px';
        this.container.style.width = '200px';
        this.container.style.height = '20px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.container.style.border = '2px solid #333';
        this.container.style.borderRadius = '5px';
        this.container.style.overflow = 'hidden';
        this.container.style.zIndex = '1000';
        
        // Crear la barra de vida
        this.healthBar = document.createElement('div');
        this.healthBar.className = 'health-bar';
        this.healthBar.style.width = '100%';
        this.healthBar.style.height = '100%';
        this.healthBar.style.backgroundColor = '#00cc00';
        this.healthBar.style.transition = 'width 0.3s, background-color 0.3s';
        
        // Crear el texto de vida
        this.healthText = document.createElement('div');
        this.healthText.className = 'health-text';
        this.healthText.style.position = 'absolute';
        this.healthText.style.top = '0';
        this.healthText.style.left = '0';
        this.healthText.style.width = '100%';
        this.healthText.style.height = '100%';
        this.healthText.style.display = 'flex';
        this.healthText.style.justifyContent = 'center';
        this.healthText.style.alignItems = 'center';
        this.healthText.style.color = '#fff';
        this.healthText.style.fontFamily = 'Arial, sans-serif';
        this.healthText.style.fontWeight = 'bold';
        this.healthText.style.textShadow = '1px 1px 2px #000';
        this.healthText.textContent = '100%';
        
        // Añadir elementos al DOM
        this.container.appendChild(this.healthBar);
        this.container.appendChild(this.healthText);
        document.body.appendChild(this.container);
    }
    
    updateHealth(health) {
        // Calcular el porcentaje de vida
        const healthPercent = Math.max(0, Math.min(100, health));
        
        // Actualizar el ancho de la barra
        this.healthBar.style.width = `${healthPercent}%`;
        
        // Actualizar el texto
        this.healthText.textContent = `${Math.round(healthPercent)}%`;
        
        // Cambiar el color según la vida restante
        if (healthPercent > 60) {
            this.healthBar.style.backgroundColor = '#00cc00'; // Verde
        } else if (healthPercent > 30) {
            this.healthBar.style.backgroundColor = '#ffcc00'; // Amarillo
        } else {
            this.healthBar.style.backgroundColor = '#ff0000'; // Rojo
        }
    }
    
    show() {
        this.container.style.display = 'block';
    }
    
    hide() {
        this.container.style.display = 'none';
    }
    
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
} 