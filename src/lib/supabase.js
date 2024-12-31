import { createClient } from '@supabase/supabase-js'

// Your Supabase project URL and public anon key
const supabaseUrl = 'https://buxvivvabzzvmofttoen.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1eHZpdnZhYnp6dm1vZnR0b2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA0MTAsImV4cCI6MjA1MDYzNjQxMH0.JJDnt9V928PWhQB3vmT1Mi6tO9GQHjdHtVsfHI6kIn8'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Simple test function to check connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('count')
    
    if (error) {
      console.error('Database error:', error)
      return false
    }

    console.log('Connected to database successfully!')
    return true

  } catch (err) {
    console.error('Connection error:', err)
    return false
  }
}