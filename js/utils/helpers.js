// Clase con funciones de utilidad general
class Helpers {
    // Convertir grados a radianes
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }
    
    // Convertir radianes a grados
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }
    
    // Generar un número aleatorio entre min y max
    static randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // Generar un entero aleatorio entre min y max (inclusive)
    static randomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Limitar un valor entre min y max
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    // Mapear un valor de un rango a otro
    static map(value, fromMin, fromMax, toMin, toMax) {
        return ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;
    }
    
    // Calcular la distancia entre dos puntos en 3D
    static distance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const dz = point2.z - point1.z;
        
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
    
    // Comprobar si un punto está dentro de un área rectangular
    static isPointInRect(point, rect) {
        return (
            point.x >= rect.x &&
            point.x <= rect.x + rect.width &&
            point.z >= rect.z &&
            point.z <= rect.z + rect.depth
        );
    }
    
    // Calcular el ángulo entre dos puntos (en radianes, desde el eje X positivo)
    static angleBetweenPoints(p1, p2) {
        return Math.atan2(p2.z - p1.z, p2.x - p1.x);
    }
    
    // Calcular la dirección de A a B como un vector normalizado
    static directionTo(from, to) {
        const direction = {
            x: to.x - from.x,
            y: to.y - from.y,
            z: to.z - from.z
        };
        
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        
        if (length > 0) {
            direction.x /= length;
            direction.y /= length;
            direction.z /= length;
        }
        
        return direction;
    }
    
    // Retornar un color en formato THREE.Color desde un valor hexadecimal
    static colorFromHex(hex) {
        return new THREE.Color(hex);
    }
    
    // Generar un identificador único
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // Comprobar si dos líneas se intersectan (2D, para el mapa)
    static doLinesIntersect(line1Start, line1End, line2Start, line2End) {
        const denom = ((line2End.z - line2Start.z) * (line1End.x - line1Start.x)) - 
                     ((line2End.x - line2Start.x) * (line1End.z - line1Start.z));
                     
        if (denom === 0) {
            return false; // Líneas paralelas
        }
        
        const ua = (((line2End.x - line2Start.x) * (line1Start.z - line2Start.z)) - 
                   ((line2End.z - line2Start.z) * (line1Start.x - line2Start.x))) / denom;
        
        const ub = (((line1End.x - line1Start.x) * (line1Start.z - line2Start.z)) - 
                   ((line1End.z - line1Start.z) * (line1Start.x - line2Start.x))) / denom;
        
        return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
    }
    
    // Formato de tiempo (para mostrar en la interfaz)
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Añadir efecto de sacudida de cámara
    static cameraShake(camera, intensity, duration) {
        const originalPosition = camera.position.clone();
        const startTime = Date.now();
        
        function updateShake() {
            const elapsed = Date.now() - startTime;
            const remaining = duration - elapsed;
            
            if (remaining <= 0) {
                camera.position.copy(originalPosition);
                return;
            }
            
            const percentComplete = elapsed / duration;
            const damper = 1 - percentComplete;
            
            const shakeIntensity = intensity * damper;
            
            camera.position.set(
                originalPosition.x + (Math.random() - 0.5) * shakeIntensity,
                originalPosition.y + (Math.random() - 0.5) * shakeIntensity,
                originalPosition.z + (Math.random() - 0.5) * shakeIntensity
            );
            
            requestAnimationFrame(updateShake);
        }
        
        updateShake();
    }
}
