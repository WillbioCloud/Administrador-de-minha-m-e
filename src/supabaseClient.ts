import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    'Supabase não configurado. Crie o arquivo .env.local com:\n' +
    'VITE_SUPABASE_URL=https://hqarwygwxqmhnbgoxqvc.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=sua_chave_aqui'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnon)
