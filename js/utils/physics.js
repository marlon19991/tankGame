// Clase de utilidad para cálculos físicos
class Physics {
    // Constantes físicas
    static GRAVITY = 9.8; // m/s²
    static AIR_RESISTANCE = 0.02;
    static GROUND_FRICTION = 0.1;
    
    // Detección de colisiones entre esferas
    static checkSphereCollision(obj1, obj2) {
        // Distancia entre los centros
        const dx = obj1.position.x - obj2.position.x;
        const dy = obj1.position.y - obj2.position.y;
        const dz = obj1.position.z - obj2.position.z;
        
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        // Suma de los radios
        const sumRadii = obj1.userData.physics.radius + obj2.userData.physics.radius;
        
        // Si la distancia es menor que la suma de los radios, hay colisión
        return distance < sumRadii;
    }
    
    // Detección de colisiones entre un punto y una esfera
    static checkPointSphereCollision(point, sphere) {
        const dx = point.x - sphere.position.x;
        const dy = point.y - sphere.position.y;
        const dz = point.z - sphere.position.z;
        
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        return distance < sphere.userData.physics.radius;
    }
    
    // Cálculo de la trayectoria balística
    static calculateBallisticTrajectory(initialPosition, initialVelocity, time) {
        const position = initialPosition.clone();
        
        position.x += initialVelocity.x * time;
        position.y += initialVelocity.y * time - 0.5 * this.GRAVITY * time * time;
        position.z += initialVelocity.z * time;
        
        return position;
    }
    
    // Aplicar fricción a la velocidad
    static applyFriction(velocity, friction, deltaTime) {
        const speed = velocity.length();
        
        if (speed > 0) {
            const frictionForce = friction * deltaTime;
            const newSpeed = Math.max(0, speed - frictionForce);
            
            if (newSpeed === 0) {
                velocity.set(0, 0, 0);
            } else {
                velocity.multiplyScalar(newSpeed / speed);
            }
        }
        
        return velocity;
    }
    
    // Cálculo de vector de rebote
    static calculateReflection(incidentVector, normal) {
        // v' = v - 2(v·n)n
        const dot = incidentVector.dot(normal);
        const reflection = incidentVector.clone().sub(
            normal.clone().multiplyScalar(2 * dot)
        );
        
        return reflection;
    }
    
    // Interpolación lineal (para animaciones y movimientos suaves)
    static lerp(start, end, alpha) {
        return start + (end - start) * alpha;
    }
    
    // Interpolación esférica (para rotaciones suaves)
    static slerp(startQuat, endQuat, alpha) {
        // Esta función requerirá utilizar THREE.Quaternion.slerp
        return startQuat.clone().slerp(endQuat, alpha);
    }
    
    // Amortiguación del movimiento
    static dampenValue(current, target, smoothFactor, deltaTime) {
        const t = 1.0 - Math.pow(smoothFactor, deltaTime);
        return current + (target - current) * t;
    }
    
    // Cálculo de fuerza centrípeta (para giros realistas)
    static calculateCentripetalForce(mass, velocity, radius) {
        const speed = velocity.length();
        // F = m * v² / r
        return (mass * speed * speed) / radius;
    }
}
