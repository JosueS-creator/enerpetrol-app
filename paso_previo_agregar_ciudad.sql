-- Agregar la columna ciudad que faltaba en estaciones

alter table estaciones add column if not exists ciudad text not null default 'Tegucigalpa';

-- Agregar tambien en perfiles, por si tampoco quedo ahi
alter table perfiles add column if not exists ciudad text not null default 'Tegucigalpa';

-- Verificar que ya existe
select column_name, data_type
from information_schema.columns
where table_name = 'estaciones'
order by ordinal_position;
