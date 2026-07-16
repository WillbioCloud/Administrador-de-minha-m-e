import { useEffect, useState } from 'react'
import PatyHelp from './pages/PatyHelp'
import LoginPage from './pages/LoginPage'
import { supabase } from './supabaseClient'
import { Session } from '@supabase/supabase-js'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">Carregando...</div>
  }

  if (!session) {
    return <LoginPage />
  }

  return <PatyHelp />
}
