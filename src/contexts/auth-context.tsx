'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/database'

interface AuthContextType {
  user: User | null
  company: { id: string; name: string } | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error: any }>
  register: (email: string, password: string, metadata: Record<string, unknown>) => Promise<{ error: any }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<{ id: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const refreshUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data: profile } = await supabase
        .from('users')
        .select('*, company:companies(*)')
        .eq('id', authUser.id)
        .single()
      
      if (profile) {
        setUser(profile)
        if (profile.company) {
          setCompany({ id: profile.company.id, name: profile.company.name })
        }
      }
    } else {
      setUser(null)
      setCompany(null)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      await refreshUser()
      setIsLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await refreshUser()
      } else {
        setUser(null)
        setCompany(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    console.log('Login attempt:', email)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    console.log('Login result:', { data, error })
    
    if (error) {
      console.error('Login error:', error)
      return { error }
    }
    
    if (data.user) {
      console.log('User logged in:', data.user.id)
      await refreshUser()
    }
    
    return { error: null }
  }

  const register = async (email: string, password: string, metadata: Record<string, unknown>) => {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
    
    if (authError) {
      return { error: authError }
    }
    
    // If registration successful, create company and user in database
    if (authData.user) {
      // Create company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: metadata.company_name as string || 'شركتي',
          email: email,
          phone: metadata.phone as string,
          status: 'trial',
          subscription_plan: 'starter',
          max_vehicles: 10,
          max_users: 5,
        })
        .select()
        .single()
      
      if (companyError) {
        console.error('Company creation error:', companyError)
      }
      
      // Create user record
      if (companyData) {
        await supabase.from('users').insert({
          id: authData.user.id,
          email: email,
          full_name: metadata.full_name as string || 'مستخدم',
          phone: metadata.phone as string,
          role: 'company_owner',
          company_id: companyData.id,
          is_active: true,
          is_verified: true,
        })
      }
    }
    
    return { error: null }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCompany(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      company,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}