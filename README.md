# Enerpetrol App

App real conectada a Supabase, con registro/login de clientes, mapa con geolocalización, tarjeta digital, sistema de puntos, alertas de canje, subida real de facturas, panel de administrador con seguridad por roles, separación por ciudad, instalación como app (PWA), e inicio de sesión con huella digital.

## Empieza aquí

Sigue **`GUIA_DESPLIEGUE.md`** — tiene los 7 pasos completos, en orden, desde cargar las gasolineras hasta instalar la app en tu celular.

## Desarrollo local (opcional)

Requiere tener Node.js instalado (https://nodejs.org).

```
npm install
npm run dev
```

Esto abre la app en `http://localhost:5173`

## Estructura del proyecto

- `src/supabaseClient.js` — conexión a tu base de datos
- `src/theme.js` — colores, ciudades, y constantes de marca
- `src/biometria.js` — lógica de huella digital / Face ID
- `src/components/` — Logo, TarjetaDigital, Medidor (reutilizables)
- `src/screens/` — las pantallas: Bienvenida, Login, Mapa, Cliente, Admin
- `src/App.jsx` — controla la sesión y qué pantalla mostrar
- `public/` — íconos y manifest para que la app sea instalable

