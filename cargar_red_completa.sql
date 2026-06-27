-- ============================================
-- ENERPETROL — Carga completa de la red de gasolineras
-- 35 estaciones en 13 ciudades
-- Correr una sola vez en el SQL Editor de Supabase
-- ============================================

-- 1. Ampliar las ciudades permitidas en las tablas
alter table estaciones drop constraint if exists estaciones_ciudad_check;
alter table perfiles drop constraint if exists perfiles_ciudad_check;

alter table estaciones add constraint estaciones_ciudad_check
  check (ciudad in ('Tegucigalpa', 'San Pedro Sula', 'Puerto Cortes', 'Choloma', 'La Ceiba', 'Yoro', 'La Esperanza', 'Choluteca', 'Danli', 'El Paraiso', 'San Marcos de Colon', 'Trojes', 'Patuca'));

alter table perfiles add constraint perfiles_ciudad_check
  check (ciudad in ('Tegucigalpa', 'San Pedro Sula', 'Puerto Cortes', 'Choloma', 'La Ceiba', 'Yoro', 'La Esperanza', 'Choluteca', 'Danli', 'El Paraiso', 'San Marcos de Colon', 'Trojes', 'Patuca'));

-- 2. Actualizar coordenadas exactas de las 2 estaciones originales

update estaciones set lat = 14.072259416720643, lng = -87.21375102698505 where nombre = 'Puma Camosa';
update estaciones set lat = 14.100716075429153, lng = -87.18021209050562 where nombre = 'Uno Montecarlo';

-- 3. Agregar el resto de gasolineras de Tegucigalpa (Texaco Triangulo ya existe, se omite)

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('Uno Prados Universitarios', 'Prados Universitarios, Tegucigalpa', 14.086961598322544, -87.15755299460609, 'Tegucigalpa'),
  ('Uno El Dorado', 'El Dorado, Tegucigalpa', 14.100213065783455, -87.1812372096276, 'Tegucigalpa'),
  ('Uno Cedros', 'Cedros, Tegucigalpa', 14.084341987388614, -87.24449443468515, 'Tegucigalpa'),
  ('Shell Millenium', 'Millenium, Tegucigalpa', 14.08611575997093, -87.15788215419954, 'Tegucigalpa');

-- 4. San Pedro Sula

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('Texaco Expocentro', 'San Pedro Sula', 15.520730276057426, -88.01678016564973, 'San Pedro Sula'),
  ('Texaco David', 'San Pedro Sula', 15.499564766529998, -88.01816117301493, 'San Pedro Sula'),
  ('Texaco Metropolitana', 'San Pedro Sula', 15.480160773780849, -88.03392365769058, 'San Pedro Sula'),
  ('Texaco Villa Olimpica', 'San Pedro Sula', 15.48436470964761, -88.0063455288458, 'San Pedro Sula'),
  ('Texaco Estrella Este', 'San Pedro Sula', 15.4533111964947, -87.94886009999999, 'San Pedro Sula'),
  ('Texaco Aeropuerto', 'San Pedro Sula', 15.447085001774704, -87.94314947301493, 'San Pedro Sula'),
  ('Uno Las Acacias', 'San Pedro Sula', 15.514067496616567, -88.02497282883581, 'San Pedro Sula'),
  ('Uno Expocentro', 'San Pedro Sula', 15.53045713090031, -88.01429911534329, 'San Pedro Sula');

-- 5. Puerto Cortes

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('Puma Hercules', 'Puerto Cortes', 15.827480026676437, -87.91822496518377, 'Puerto Cortes'),
  ('Puma La Terminal', 'Puerto Cortes', 15.827383888124201, -87.90861209907467, 'Puerto Cortes'),
  ('Texaco La Curva', 'Puerto Cortes', 15.84188696961915, -87.93294019999999, 'Puerto Cortes');

-- 6. Choloma

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('Texaco Victoria', 'Choloma', 15.57282780475142, -87.95462286472804, 'Choloma');

-- 7. Yoro

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('Texaco Toyos', 'Yoro', 15.535267045053793, -87.65261248031733, 'Yoro');

-- 8. La Ceiba

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('Puma El Sauce', 'La Ceiba', 15.772920796752883, -86.78695572883585, 'La Ceiba'),
  ('Puma San Jose Kawas', 'La Ceiba', 15.783045513905046, -86.79177218650746, 'La Ceiba');

-- 9. La Esperanza

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('Puma La Esperanza', 'La Esperanza', 14.310749526518359, -88.16491875767164, 'La Esperanza');

-- 10. Choluteca

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('Uno Choluteca', 'Choluteca', 13.309401613514822, -87.18798515767163, 'Choluteca');

-- 11. San Marcos de Colon

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('Puma San Marcos de Colon', 'San Marcos de Colon', 13.43332180024946, -86.81837902883584, 'San Marcos de Colon');

-- 12. Danli (incluye Valle de Jamastran)

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('Puma Danli', 'Danli', 14.029462867427949, -86.57118788650746, 'Danli'),
  ('Puma Pinares Terminal', 'Danli', 14.022496955170178, -86.59564999999999, 'Danli'),
  ('Puma Mangos Terminal', 'Danli', 14.046376120642599, -86.56191000000001, 'Danli'),
  ('Puma San Diego', 'Danli', 14.053406462218064, -86.44314562883582, 'Danli'),
  ('Puma Obraje Valle de Jamastran', 'Valle de Jamastran, Danli', 14.007708962784628, -86.43081066352296, 'Danli'),
  ('Puma Jamastran El Empalme', 'El Empalme, Jamastran, Danli', 14.059789802313107, -86.39736638145393, 'Danli');

-- 13. El Paraiso

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('Puma El Paraiso', 'El Paraiso', 13.867083158248416, -86.56408961349254, 'El Paraiso');

-- 14. Trojes

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('Puma Trojes', 'Trojes', 14.080863658249433, -86.00940667725362, 'Trojes'),
  ('Puma Trojes Circunvalacion', 'Trojes', 14.080863658249433, -86.00940667725362, 'Trojes');

-- 15. Patuca

insert into estaciones (nombre, direccion, lat, lng, ciudad) values
  ('Puma Patuca', 'Patuca', 14.351353880723547, -85.88780927116417, 'Patuca');

-- 16. Verificar el resultado completo

select ciudad, count(*) as total_estaciones from estaciones group by ciudad order by ciudad;
select ciudad, nombre, lat, lng from estaciones order by ciudad, nombre;
