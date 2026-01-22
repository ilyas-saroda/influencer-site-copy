import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // Isolated async operations - never called from auth callbacks
  const profileOperations = {
    async load(userId) {
      if (!userId) return
      setProfileLoading(true)
      try {
        // Use maybeSingle() so we don't get a 406 when the row doesn't exist.
        const { data, error } = await supabase?.from('profiles')?.select('*')?.eq('id', userId)?.maybeSingle()

        if (error) {
          // Non-fatal: set null and continue
          console.warn('Profile load warning:', error)
          setUserProfile(null)
        } else {
          // data may be null when profile row is missing
          setUserProfile(data ?? null)
        }
      } catch (error) {
        console.error('Profile load error:', error)
      } finally {
        setProfileLoading(false)
      }
    },

    clear() {
      setUserProfile(null)
      setProfileLoading(false)
    }
  }

  // Auth state handlers - PROTECTED from async modification
  const authStateHandlers = {
    // This handler MUST remain synchronous - Supabase requirement
    onChange: (event, session) => {
      console.log('🔄 Auth state changed:', { event, hasUser: !!session?.user, userEmail: session?.user?.email })
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (session?.user) {
        profileOperations?.load(session?.user?.id) // Fire-and-forget
      } else {
        profileOperations?.clear()
      }
    }
  }

  useEffect(() => {
    console.log('🔵 AuthProvider: Initializing auth state...')
    
    // Verify Supabase connection
    if (!supabase) {
      console.error('❌ Supabase client not initialized!')
      setLoading(false)
      return
    }

    // Initial session check - this handles page refresh
    supabase?.auth?.getSession()?.then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting session:', error)
      }
      console.log('🔵 Initial session check:', { hasSession: !!session, userEmail: session?.user?.email })
      authStateHandlers?.onChange(null, session)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      authStateHandlers?.onChange
    )

    return () => {
      console.log('🔵 AuthProvider: Cleaning up subscription')
      subscription?.unsubscribe()
    }
  }, [])

  // Auth methods
  const signIn = async (email, password) => {
    console.log('🔵 signIn called:', { email, hasPassword: !!password })
    
    if (!email || !password) {
      console.error('❌ Missing email or password')
      return { 
        data: null, 
        error: { message: 'Email and password are required' } 
      }
    }

    try {
      console.log('🟡 Calling supabase.auth.signInWithPassword...')
      
      const { data, error } = await supabase?.auth?.signInWithPassword({ email, password })
      
      console.log('🟡 signInWithPassword response:', { 
        hasData: !!data, 
        hasError: !!error,
        errorCode: error?.status,
        errorMessage: error?.message 
      })
      
      if (error) {
        console.error('❌ Supabase auth error:', error)
        
        // Provide better error messages for common auth issues
        if (error?.message?.includes('Invalid login credentials') || 
            error?.message?.includes('Invalid login') ||
            error?.status === 400) {
          return { 
            data: null, 
            error: { 
              message: 'Invalid email or password. Please verify your credentials.\n\n⚠️ Make sure:\n• Email matches exactly (case-sensitive)\n• Password is correct\n• User exists in Supabase Dashboard\n• "Auto Confirm User" is enabled' 
            } 
          }
        }
        
        if (error?.message?.includes('Email not confirmed')) {
          return {
            data: null,
            error: {
              message: 'Email not confirmed. Please check the "Auto Confirm User" option when creating users in Supabase Dashboard.'
            }
          }
        }

        if (error?.message?.includes('JWT')) {
          return {
            data: null,
            error: {
              message: 'Authentication configuration error. Please check your Supabase project URL and anon key in .env file.'
            }
          }
        }
        
        return { data: null, error }
      }
      
      console.log('✅ SignIn successful!', { userId: data?.user?.id, email: data?.user?.email })
      
      // Session is automatically stored by Supabase
      // The onAuthStateChange listener will update the user state
      return { data, error: null }
    } catch (error) {
      console.error('❌ Sign in exception:', error)
      return { 
        data: null, 
        error: { 
          message: `Network error: ${error?.message || 'Please check your connection and try again.'}` 
        } 
      }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase?.auth?.signOut()
      if (!error) {
        setUser(null)
        profileOperations?.clear()
      }
      return { error }
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: { message: 'No user logged in' } }
    
    try {
      const { data, error } = await supabase?.from('profiles')?.update(updates)?.eq('id', user?.id)?.select()?.maybeSingle()
      if (!error) setUserProfile(data ?? null)
      return { data, error }
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    profileLoading,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}