/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getAuthRedirectUrl, isRecoveryHash, clearAuthHashFromUrl } from '../lib/authRedirect'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  configured: boolean
  isPasswordRecovery: boolean
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  clearPasswordRecovery: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function detectRecovery(event: AuthChangeEvent): boolean {
  return event === 'PASSWORD_RECOVERY' || isRecoveryHash()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(isRecoveryHash)

  const clearPasswordRecovery = () => {
    setIsPasswordRecovery(false)
    clearAuthHashFromUrl()
  }

  useEffect(() => {
    if (!supabase) {
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (isRecoveryHash()) setIsPasswordRecovery(true)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess)
      setUser(sess?.user ?? null)
      if (detectRecovery(event)) {
        setIsPasswordRecovery(true)
      }
      setLoading(false)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl('/reset-password'),
    })
    return { error: error?.message ?? null }
  }

  const updatePassword = async (password: string) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.updateUser({ password })
    if (!error) clearPasswordRecovery()
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    clearPasswordRecovery()
    if (supabase) await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        configured: isSupabaseConfigured,
        isPasswordRecovery,
        signUp,
        signIn,
        resetPassword,
        updatePassword,
        clearPasswordRecovery,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
