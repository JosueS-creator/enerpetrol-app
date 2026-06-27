-- Borrar las políticas viejas que apuntaban al nombre incorrecto
drop policy if exists "usuarios_suben_su_factura" on storage.objects;
drop policy if exists "cualquiera_ve_facturas" on storage.objects;

-- Crear las políticas correctas usando el nombre real del bucket: Facturas

create policy "usuarios_suben_su_factura"
on storage.objects for insert
to authenticated
with check (bucket_id = 'Facturas');

create policy "cualquiera_ve_facturas"
on storage.objects for select
to public
using (bucket_id = 'Facturas');

-- Verificar
select policyname, cmd from pg_policies where tablename = 'objects' and schemaname = 'storage';
