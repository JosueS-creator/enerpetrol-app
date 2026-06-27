create policy "usuarios_suben_su_factura"
on storage.objects for insert
to authenticated
with check (bucket_id = 'facturas');

create policy "cualquiera_ve_facturas"
on storage.objects for select
to public
using (bucket_id = 'facturas');
