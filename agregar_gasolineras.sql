-- ============================================
-- Agregar mas gasolineras (Tegucigalpa y/o San Pedro Sula)
-- ============================================
-- Instrucciones:
-- 1. Por cada gasolinera, copia una linea del bloque "insert into" de abajo
-- 2. Reemplaza el nombre, direccion, las coordenadas (lat, lng) y la ciudad
-- 3. Las coordenadas las sacas manteniendo presionado el pin en Google Maps
--    (desde la PC, click derecho sobre el pin y copia los numeros que aparecen)
-- 4. Ciudad debe ser exactamente: 'Tegucigalpa' o 'San Pedro Sula'
-- 5. Corre todo el bloque junto en el SQL Editor de Supabase

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('NOMBRE_GASOLINERA_1', 'DIRECCION_1', 0.0000, -0.0000, 'Tegucigalpa'),
  ('NOMBRE_GASOLINERA_2', 'DIRECCION_2', 0.0000, -0.0000, 'Tegucigalpa'),
  ('NOMBRE_GASOLINERA_3', 'DIRECCION_3', 0.0000, -0.0000, 'San Pedro Sula');

-- Verificar que se agregaron correctamente:
select nombre, direccion, ciudad from estaciones order by ciudad, nombre;
