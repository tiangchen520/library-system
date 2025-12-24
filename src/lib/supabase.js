import { createClient } from '@supabase/supabase-js'

// 这里使用 import.meta.env 读取你在 .env.local 里配置的密钥
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)