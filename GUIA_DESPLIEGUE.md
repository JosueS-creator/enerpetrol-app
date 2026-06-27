# Guía para hacer Enerpetrol realidad — paso a paso

Sigue estos pasos en orden. No necesitas saber programar, solo ir copiando y pegando donde se indica.

---

## PASO 1 — Cargar la red completa de gasolineras

1. Entra a tu proyecto en Supabase → **SQL Editor**
2. Borra todo el contenido
3. Abre el archivo `cargar_red_completa.sql`, copia todo su contenido, y pégalo
4. Click **Run**
5. Al final deberías ver una tabla con el conteo de estaciones por ciudad, y luego el listado completo de las 35 gasolineras

---

## PASO 2 — Configurar el almacenamiento de fotos en Supabase

1. Menú izquierdo → **Storage**
2. Click en **"New bucket"**
3. Nombre: `facturas`
4. Activa la opción **"Public bucket"**
5. Click en **"Create bucket"**
6. Ve al **SQL Editor**, borra todo, pega el contenido de `supabase_storage_setup.sql` y dale **Run**

---

## PASO 3 — Crear cuenta en GitHub (si no tienes)

1. Ve a **github.com**
2. Click **"Sign up"**, crea tu cuenta gratis

---

## PASO 4 — Subir el proyecto a GitHub

1. En github.com, click el botón **"+"** arriba a la derecha → **"New repository"**
2. Nombre del repositorio: `enerpetrol-app`
3. Déjalo en **Public** o **Private** (cualquiera funciona con Vercel)
4. Click **"Create repository"**
5. En la página que aparece, busca el enlace **"uploading an existing file"**
6. Arrastra TODOS los archivos y carpetas del proyecto (descomprime el .zip primero en tu computadora, y arrastra el contenido de adentro, no la carpeta zip)
7. Abajo, click **"Commit changes"**

---

## PASO 5 — Desplegar en Vercel

1. Ve a **vercel.com**
2. Click **"Sign Up"** → elige **"Continue with GitHub"** (así quedan conectados automáticamente)
3. Una vez dentro, click **"Add New..."** → **"Project"**
4. Busca y selecciona el repositorio `enerpetrol-app`
5. Vercel debería detectar automáticamente que es un proyecto **Vite** — déjalo así
6. Click **"Deploy"**
7. Espera 1-2 minutos
8. Te va a dar una URL como `enerpetrol-app.vercel.app` — **esa es tu app real**, ya pública

---

## PASO 6 — Crear tu cuenta de administrador

1. Abre la URL que te dio Vercel (en tu navegador o celular)
2. Toca **"Comenzar"** en la pantalla de bienvenida
3. Toca **"Crear cuenta"**
4. Llena tu nombre, elige tu ciudad, tu correo y una contraseña
5. Toca **"Crear mi cuenta"**
6. Si te ofrece activar huella, decide si quieres activarla ahora o después
7. Ya estás dentro de la app, pero como cliente normal — el siguiente paso te hace administrador

8. Regresa a Supabase → **SQL Editor**
9. Borra todo, pega el contenido de `hacer_admin.sql`
10. **Reemplaza** `TU_CORREO_AQUI@gmail.com` por el correo real que usaste para registrarte
11. Dale **Run**
12. Verifica que la consulta final te muestre tu nombre con `rol: admin`

13. Vuelve a la app, **cierra sesión** y vuelve a entrar con tu correo y contraseña
14. Ahora deberías ver la pestaña **"Admin"** abajo, junto a "Estaciones" y "Mi cuenta"
15. En el panel admin, usa el menú desplegable de ciudad para revisar cada ciudad por separado

---

## PASO 7 — Instalar la app en tu celular

1. Abre la URL de tu app (`enerpetrol-app.vercel.app`) en **Chrome** (Android) o **Safari** (iPhone)
2. **En Android (Chrome):** te debería aparecer un banner abajo diciendo "Agregar a pantalla de inicio" o un ícono de instalar en la barra de direcciones. Tócalo.
3. **En iPhone (Safari):** toca el botón de **compartir** (el cuadrito con flecha hacia arriba) → desplázate y busca **"Agregar a pantalla de inicio"**
4. Confirma — el ícono de Enerpetrol debería aparecer en tu pantalla de inicio
5. Ábrela desde ahí — se va a abrir como una app normal, sin la barra del navegador

---

## Después de que esté funcionando

- **Para agregar más gasolineras:** usa `agregar_gasolineras.sql` como plantilla, o el Table Editor visual de Supabase (Storage → tabla `estaciones` → Insert row). No necesitas volver a desplegar nada — los cambios en la base de datos se ven al instante en la app.
- **Para agregar una ciudad nueva** (que no esté ya en la lista): hay que editar la lista `CIUDADES` en `src/theme.js` y la restricción de la base de datos, luego subir el cambio a GitHub (Vercel vuelve a desplegar automáticamente).

---

## Si algo falla

- Pégame el mensaje de error exacto (captura de pantalla si es posible) y lo resolvemos paso a paso, igual que hicimos con la base de datos.

