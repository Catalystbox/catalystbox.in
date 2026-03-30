import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xuxgzrxbwstnlkuejuhj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGd6cnhid3N0bmxrdWVqdWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDczOTIsImV4cCI6MjA4ODc4MzM5Mn0.Xu3Dn1934H5DUJMRvKc3yF9i1slAtHAMFRRvNC2cgkw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
