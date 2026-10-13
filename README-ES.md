# Isla Bruma — paquete Android (sin PC)

Este paquete conserva el juego HTML offline existente y prepara una envoltura Android con Capacitor. **No contiene todavía una APK compilada**: la APK se genera en una compilación en la nube.

## Qué incluye
- `www/index.html`: juego actual completo.
- `package.json` y `capacitor.config.json`: configuración del proyecto.
- `.github/workflows/build-apk.yml`: flujo de GitHub Actions para compilar una APK de prueba.

## Cómo generar la APK usando solo el teléfono
1. Extrae este ZIP en el teléfono.
2. Crea un repositorio nuevo en GitHub desde el navegador.
3. Sube los archivos y carpetas del proyecto al repositorio, manteniendo la ruta `.github/workflows/build-apk.yml`.
4. Abre la pestaña **Actions** del repositorio y habilita los flujos si GitHub lo solicita.
5. Ejecuta **Build Isla Bruma APK** con **Run workflow**.
6. Cuando termine en verde, abre esa ejecución, baja a **Artifacts** y descarga `Isla-Bruma-APK`.
7. Extrae el archivo descargado y abre `app-debug.apk` en Android. Puede que Android pida autorizar la instalación desde el navegador o gestor de archivos.

## Notas
- La compilación requiere conexión a Internet; el juego empaquetado está pensado para jugar sin conexión una vez instalado.
- Esta es una APK de depuración para pruebas, no una versión firmada para publicar en Google Play.
- Si GitHub muestra un error en la compilación, comparte el texto o una captura del error para corregirlo.
