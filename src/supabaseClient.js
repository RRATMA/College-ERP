import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ekyrogykmmaxzhkpwzow.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreXJvZ3lrbW1heHpoa3B3em93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDE2MjEsImV4cCI6MjA4MjMxNzYyMX0.SwidujcACRM-0yiPEULLlyKmMIFWvT9Md26p5kCRQrA'

export const supabase = createClient(supabaseUrl, supabaseKey)