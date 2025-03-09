# Tank Arena - Juego de Tanques

## Descripción
Tank Arena es un juego de tanques 3D desarrollado con Three.js. Esta versión implementa un modo de un solo jugador, estableciendo la base para futuras expansiones multijugador.

## Características Principales
- Entorno 3D inmersivo creado con Three.js
- Físicas realistas con aceleración, inercia y fricción
- Control preciso del tanque (movimiento y rotación independiente de la torreta)
- Sistema de disparo balístico con proyectiles
- Detección y respuesta a colisiones
- Retroalimentación visual y auditiva
- Terreno detallado con obstáculos y elementos decorativos

## Estructura del Proyecto
```
tankGame/
├── index.html          # Punto de entrada HTML
├── js/
│   ├── controllers/    # Controladores (juego, entrada, etc.)
│   ├── models/         # Modelos 3D y sus comportamientos
│   ├── utils/          # Funciones de utilidad
│   └── main.js         # Archivo principal JavaScript
└── assets/
    ├── models/         # Modelos 3D
    ├── textures/       # Texturas
    └── sounds/         # Efectos de sonido
```

## Controles
- **W**: Mover hacia adelante
- **S**: Mover hacia atrás
- **A**: Girar tanque a la izquierda
- **D**: Girar tanque a la derecha
- **Flecha Izquierda**: Rotar torreta a la izquierda
- **Flecha Derecha**: Rotar torreta a la derecha
- **Espacio**: Disparar

## Tecnologías Utilizadas
- **Three.js**: Motor gráfico 3D para navegadores
- **HTML5/JavaScript**: Para la estructura y lógica del juego
- **CSS3**: Estilos y diseño de la interfaz

## Planes Futuros
- Modo multijugador con WebSockets
- Personalización de tanques
- Más mapas y modos de juego
- Sistema de progresión y recompensas

## Cómo Ejecutar
Simplemente abre el archivo `index.html` en un navegador moderno, o configura un servidor web local y accede a través de él.

## Licencia
Este proyecto está bajo la Licencia MIT.
