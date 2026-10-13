# Isla Bruma 3D — versión Android

Esta versión sustituye el lienzo 2D por una escena 3D WebGL usando Three.js. Los módulos de Three.js se empaquetan dentro de `www/game.js`, por lo que el juego no necesita descargar bibliotecas desde Internet durante la partida.

## Compilar sin PC
1. Sube estos archivos al repositorio GitHub de Isla Bruma, reemplazando `package.json`, `capacitor.config.json`, `README-ES.md` y `.github/workflows/build-apk.yml`; añade la carpeta `src` y reemplaza `www/index.html`.
2. Abre Actions y ejecuta `Build Isla Bruma 3D APK` (o espera a que empiece por el push a main).
3. Abre la ejecución verde y descarga el artefacto `Isla-Bruma-3D-APK`.
4. Extrae el ZIP descargado e instala `app-debug.apk`.

## Prototipo jugable
Incluye isla 3D procedural, cámara de tercera persona, joystick táctil, bosque, pantano, costa, zonas áridas y rocosas, recursos recolectables, criatura hostil, vida, energía, curación y refugio básico. Es un prototipo inicial y requiere pruebas en el dispositivo; no representa todavía un juego comercial final.
