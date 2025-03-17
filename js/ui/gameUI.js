class GameUI {
    constructor() {
        // Crear el contenedor principal
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none'; // Permite que los eventos del mouse pasen a través
        document.body.appendChild(this.container);

        // Crear el hub de información
        this.hub = document.createElement('div');
        this.hub.style.position = 'fixed';
        this.hub.style.top = '20px';
        this.hub.style.left = '50%';
        this.hub.style.transform = 'translateX(-50%)';
        this.hub.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.hub.style.padding = '10px 20px';
        this.hub.style.borderRadius = '5px';
        this.hub.style.color = 'white';
        this.hub.style.fontFamily = 'Arial, sans-serif';
        this.hub.style.fontSize = '16px';
        this.hub.style.zIndex = '1000';
        this.hub.style.display = 'none'; // Inicialmente oculto
        this.container.appendChild(this.hub);

        // Crear el contenedor de estadísticas
        this.statsContainer = document.createElement('div');
        this.statsContainer.style.position = 'fixed';
        this.statsContainer.style.top = '20px';
        this.statsContainer.style.left = '20px';
        this.statsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.statsContainer.style.padding = '10px';
        this.statsContainer.style.borderRadius = '5px';
        this.statsContainer.style.color = 'white';
        this.statsContainer.style.fontFamily = 'Arial, sans-serif';
        this.statsContainer.style.fontSize = '14px';
        this.statsContainer.style.zIndex = '1000';
        this.statsContainer.style.display = 'none'; // Inicialmente oculto
        this.container.appendChild(this.statsContainer);

        // Crear el contenedor de controles
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.style.position = 'fixed';
        this.controlsContainer.style.bottom = '20px';
        this.controlsContainer.style.left = '20px';
        this.controlsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.controlsContainer.style.padding = '10px';
        this.controlsContainer.style.borderRadius = '5px';
        this.controlsContainer.style.color = 'white';
        this.controlsContainer.style.fontFamily = 'Arial, sans-serif';
        this.controlsContainer.style.fontSize = '14px';
        this.controlsContainer.style.zIndex = '1000';
        this.controlsContainer.style.display = 'none'; // Inicialmente oculto
        this.container.appendChild(this.controlsContainer);

        // Crear el contenedor de mensajes
        this.messageContainer = document.createElement('div');
        this.messageContainer.style.position = 'fixed';
        this.messageContainer.style.top = '50%';
        this.messageContainer.style.left = '50%';
        this.messageContainer.style.transform = 'translate(-50%, -50%)';
        this.messageContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.messageContainer.style.padding = '20px';
        this.messageContainer.style.borderRadius = '10px';
        this.messageContainer.style.color = 'white';
        this.messageContainer.style.fontFamily = 'Arial, sans-serif';
        this.messageContainer.style.fontSize = '24px';
        this.messageContainer.style.zIndex = '1000';
        this.messageContainer.style.display = 'none'; // Inicialmente oculto
        this.messageContainer.style.textAlign = 'center';
        this.container.appendChild(this.messageContainer);

        // Crear el contenedor de mensajes de retroalimentación
        this.feedbackContainer = document.createElement('div');
        this.feedbackContainer.style.position = 'fixed';
        this.feedbackContainer.style.top = '20px';
        this.feedbackContainer.style.left = '50%';
        this.feedbackContainer.style.transform = 'translateX(-50%)';
        this.feedbackContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.feedbackContainer.style.padding = '10px 20px';
        this.feedbackContainer.style.borderRadius = '5px';
        this.feedbackContainer.style.color = 'white';
        this.feedbackContainer.style.fontFamily = 'Arial, sans-serif';
        this.feedbackContainer.style.fontSize = '16px';
        this.feedbackContainer.style.zIndex = '1000';
        this.feedbackContainer.style.display = 'none'; // Inicialmente oculto
        this.container.appendChild(this.feedbackContainer);

        // Crear el contenedor de mensajes de estado
        this.statusContainer = document.createElement('div');
        this.statusContainer.style.position = 'fixed';
        this.statusContainer.style.top = '20px';
        this.statusContainer.style.left = '50%';
        this.statusContainer.style.transform = 'translateX(-50%)';
        this.statusContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.statusContainer.style.padding = '10px 20px';
        this.statusContainer.style.borderRadius = '5px';
        this.statusContainer.style.color = 'white';
        this.statusContainer.style.fontFamily = 'Arial, sans-serif';
        this.statusContainer.style.fontSize = '16px';
        this.statusContainer.style.zIndex = '1000';
        this.statusContainer.style.display = 'none'; // Inicialmente oculto
        this.container.appendChild(this.statusContainer);

        // Crear el contenedor de mensajes de estado de la embestida
        this.rammingStatusContainer = document.createElement('div');
        this.rammingStatusContainer.style.position = 'fixed';
        this.rammingStatusContainer.style.top = '20px';
        this.rammingStatusContainer.style.left = '50%';
        this.rammingStatusContainer.style.transform = 'translateX(-50%)';
        this.rammingStatusContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        this.rammingStatusContainer.style.padding = '10px 20px';
        this.rammingStatusContainer.style.borderRadius = '5px';
        this.rammingStatusContainer.style.color = 'white';
        this.rammingStatusContainer.style.fontFamily = 'Arial, sans-serif';
        this.rammingStatusContainer.style.fontSize = '20px';
        this.rammingStatusContainer.style.fontWeight = 'bold';
        this.rammingStatusContainer.style.zIndex = '1000';
        this.rammingStatusContainer.style.display = 'none'; // Inicialmente oculto
        this.container.appendChild(this.rammingStatusContainer);

        // Crear el contenedor de mensajes de estado de la embestida
        this.rammingCooldownContainer = document.createElement('div');
        this.rammingCooldownContainer.style.position = 'fixed';
        this.rammingCooldownContainer.style.top = '60px';
        this.rammingCooldownContainer.style.left = '50%';
        this.rammingCooldownContainer.style.transform = 'translateX(-50%)';
        this.rammingCooldownContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.rammingCooldownContainer.style.padding = '10px 20px';
        this.rammingCooldownContainer.style.borderRadius = '5px';
        this.rammingCooldownContainer.style.color = 'white';
        this.rammingCooldownContainer.style.fontFamily = 'Arial, sans-serif';
        this.rammingCooldownContainer.style.fontSize = '16px';
        this.rammingCooldownContainer.style.zIndex = '1000';
        this.rammingCooldownContainer.style.display = 'none'; // Inicialmente oculto
        this.container.appendChild(this.rammingCooldownContainer);

        // Crear el contenedor de mensajes de estado de la embestida
        this.rammingTimerContainer = document.createElement('div');
        this.rammingTimerContainer.style.position = 'fixed';
        this.rammingTimerContainer.style.top = '100px';
        this.rammingTimerContainer.style.left = '50%';
        this.rammingTimerContainer.style.transform = 'translateX(-50%)';
        this.rammingTimerContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.rammingTimerContainer.style.padding = '10px 20px';
        this.rammingTimerContainer.style.borderRadius = '5px';
        this.rammingTimerContainer.style.color = 'white';
        this.rammingTimerContainer.style.fontFamily = 'Arial, sans-serif';
        this.rammingTimerContainer.style.fontSize = '16px';
        this.rammingTimerContainer.style.zIndex = '1000';
        this.rammingTimerContainer.style.display = 'none'; // Inicialmente oculto
        this.container.appendChild(this.rammingTimerContainer);
    }

    /**
     * Actualiza el estado de la embestida en la UI
     * @param {boolean} isRamming - Si la embestida está activa
     * @param {number} duration - Duración restante de la embestida
     * @param {number} cooldown - Tiempo de enfriamiento restante
     */
    updateRammingStatus(isRamming, duration, cooldown) {
        // Actualizar el mensaje de estado de la embestida
        if (isRamming) {
            this.rammingStatusContainer.textContent = '¡EMBESTIDA ACTIVA!';
            this.rammingStatusContainer.style.display = 'block';
            
            // Mostrar y actualizar el temporizador
            this.rammingTimerContainer.textContent = `Duración: ${duration.toFixed(1)}s`;
            this.rammingTimerContainer.style.display = 'block';
        } else {
            this.rammingStatusContainer.style.display = 'none';
            this.rammingTimerContainer.style.display = 'none';
        }
        
        // Actualizar el mensaje de enfriamiento
        if (cooldown > 0) {
            this.rammingCooldownContainer.textContent = `Enfriamiento: ${cooldown.toFixed(1)}s`;
            this.rammingCooldownContainer.style.display = 'block';
        } else {
            this.rammingCooldownContainer.style.display = 'none';
        }
    }
} 