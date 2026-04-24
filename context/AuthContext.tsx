'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { hashPassphrase, getStoredAuth, setStoredAuth, clearStoredAuth } from '@/lib/auth'

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  login: (passphrase: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const verify = useCallback(async (passphrase: string): Promise<boolean> => {
    const hash = await hashPassphrase(passphrase)
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('passphrase_hash', hash)
      .single()
    return !error && !!data
  }, [])

  useEffect(() => {
    const stored = getStoredAuth()
    if (!stored) {
      setIsLoading(false)
      return
    }
    verify(stored).then((ok) => {
      setIsAuthenticated(ok)
      if (!ok) clearStoredAuth()
      setIsLoading(false)
    })
  }, [verify])

  const login = useCallback(
    async (passphrase: string): Promise<boolean> => {
      const ok = await verify(passphrase)
      if (ok) {
        setStoredAuth(passphrase)
        setIsAuthenticated(true)
      }
      return ok
    },
    [verify]
  )

  const logout = useCallback(() => {
    clearStoredAuth()
    setIsAuthenticated(false)
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
