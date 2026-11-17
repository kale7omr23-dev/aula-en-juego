# Aula en juego
Prototipo conectado para docentes y estudiantes. Ejecutar con Node 20 o superior mediante `npm start` y abrir http://localhost:3001.

El docente crea una sala y comparte el código. Cada estudiante entra desde su navegador, vota y comunica su pulso. El docente cierra la votación. Los empates abren otra ronda. La misión elegida y el mural se sincronizan cada dos segundos. El cierre recoge reflexiones para el docente.

Las salas se conservan en memoria durante un máximo de 24 horas y se pierden al reiniciar el servidor. Los enlaces de invitación necesitan un servidor accesible desde los dispositivos de los participantes. En una red local, utilizar la IP del equipo y el puerto 3001. Para acceso por internet, desplegar en un alojamiento que ejecute Node. GitHub Pages por sí solo no ejecuta este servidor.

Los votos y pulsos se agregan sin mostrar nombres. Los aportes al mural son visibles para el curso y las reflexiones solo para el docente. Es un prototipo de clase con acceso mediante códigos y claves de sesión, sin cuentas institucionales.

El diagnóstico inicial y la actividad de empatía se usaron como contexto. Las estrategias y el nombre del prototipo son decisiones de diseño que deben validarse con participantes.
