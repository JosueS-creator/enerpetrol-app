select policyname, cmd
from pg_policies
where tablename = 'objects' and schemaname = 'storage';
