-- ============================================
-- Convertir tu propia cuenta en ADMINISTRADOR
-- ============================================
-- 1. Primero registra tu cuenta normalmente desde la app (boton "Crear cuenta")
-- 2. Despues, corre esto reemplazando el correo por el tuyo:

update perfiles
set rol = 'admin'
where id = (select id from auth.users where email = 'TU_CORREO_AQUI@gmail.com');

-- 3. Verifica que funciono:
select nombre, numero_tarjeta, rol from perfiles where rol = 'admin';
