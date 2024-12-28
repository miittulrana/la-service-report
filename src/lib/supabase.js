import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://buxvivvabzzvmofttoen.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eHZpdnZhYnp6dm1vZnR0b2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA0MTAsImV4cCI6MjA1MDYzNjQxMH0.JJDnt9V928PWhQB3vmT1Mi6tO9GQHjdHtVsfHI6kIn8'

export const supabase = createClient(supabaseUrl, supabaseKey)