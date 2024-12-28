import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { supabase } from './lib/supabase'

// Monitor Supabase connection status
supabase.auth.onAuthStateChange((event, session) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase auth event:', event)
    console.log('Session status:', session ? 'authenticated' : 'unauthenticated')
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)