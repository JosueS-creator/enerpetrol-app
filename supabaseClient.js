import { createClient } from '@supabase/supabase-js'

// Credenciales de tu proyecto Enerpetrol en Supabase.
// La "Publishable key" es segura para usar aquí porque ya tienes
// Row Level Security (RLS) activado en tus tablas.
const SUPABASE_URL = 'https://toyqwvyzdjvfomfomwdl.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_pHiXCGJGadzvjV-uPGXDiw_yEqdcjGf'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
