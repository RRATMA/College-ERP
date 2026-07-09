import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ybuzxovumbedczsvokbv.supabase'
const supabaseKey = 'eyeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidXp4b3Z1bWJlZGN6c3Zva2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTAzMDgsImV4cCI6MjA5OTE4NjMwOH0.GhIYPhTM6KCSkNjnS6u_i6CKYzKq0wkzJ2W-N8_bCPo'

export const supabase = createClient(supabaseUrl, supabaseKey)
