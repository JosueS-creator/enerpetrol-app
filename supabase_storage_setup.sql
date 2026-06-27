-- ============================================
-- PASO ADICIONAL: Almacenamiento de imagenes de facturas
-- ============================================

-- 1. Ve a la sección "Storage" en el menú izquierdo de Supabase
-- 2. Click en "New bucket"
-- 3. Nombre: facturas
-- 4. Marca la opción "Public bucket" (para que las imágenes se puedan ver con su URL)
-- 5. Click en "Create bucket"

-- Despues de crear el bucket, corre esto en el SQL Editor para permitir
-- que los usuarios autenticados suban sus propias imagenes:

create policy "usuarios_suben_su_factura"
on storage.objects for insert
to authenticated
with check (bucket_id = 'facturas');

create policy "cualquiera_ve_facturas"
on storage.objects for select
to public
using (bucket_id = 'facturas');
