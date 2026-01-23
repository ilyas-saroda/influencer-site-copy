import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// User roles and permissions
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  MANAGER: 'manager',
  USER: 'user'
};

export const PERMISSIONS = {
  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Campaign management
  MANAGE_CAMPAIGNS: 'manage_campaigns',
  VIEW_CAMPAIGNS: 'view_campaigns',
  DELETE_CAMPAIGNS: 'delete_campaigns',
  
  // Creator management
  MANAGE_CREATORS: 'manage_creators',
  VIEW_CREATORS: 'view_creators',
  DELETE_CREATORS: 'delete_creators',
  
  // Analytics and reports
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
  
  // System settings
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  
  // Import/Export
  IMPORT_DATA: 'import_data',
  BULK_OPERATIONS: 'bulk_operations'
};

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.VIEW_CAMPAIGNS,
    PERMISSIONS.DELETE_CAMPAIGNS,
    PERMISSIONS.MANAGE_CREATORS,
    PERMISSIONS.VIEW_CREATORS,
    PERMISSIONS.DELETE_CREATORS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.IMPORT_DATA,
    PERMISSIONS.BULK_OPERATIONS,
    PERMISSIONS.VIEW_AUDIT_LOGS
  ],
  [USER_ROLES.MANAGER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.VIEW_CAMPAIGNS,
    PERMISSIONS.MANAGE_CREATORS,
    PERMISSIONS.VIEW_CREATORS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.IMPORT_DATA
  ],
  [USER_ROLES.USER]: [
    PERMISSIONS.VIEW_CAMPAIGNS,
    PERMISSIONS.VIEW_CREATORS,
    PERMISSIONS.VIEW_ANALYTICS
  ]
};

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
        console.log('🔍 Loading profile for user:', userId)
        
        // Use maybeSingle() so we don't get a 406 when the row doesn't exist.
        const { data, error } = await supabase?.from('profiles')?.select('*')?.eq('id', userId)?.maybeSingle()

        console.log('🔍 Profile query result:', { data, error })

        if (error) {
          // Enhanced error logging for debugging
          console.error('❌ Profile load error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            userId: userId
          })
          
          // Check for specific RLS-related errors
          if (error.code === '42501' || error.message?.includes('permission denied')) {
            console.error('🚨 RLS Permission Error - This usually means:')
            console.error('   1. RLS policies are missing on the profiles table')
            console.error('   2. The user does not have a profile record')
            console.error('   3. The RLS policy does not allow the user to read their own profile')
            console.error('   SOLUTION: Run FIX_LOGIN_RLS_POLICIES.sql in Supabase SQL Editor')
          }
          
          setUserProfile(null)
        } else {
          // data may be null when profile row is missing
          if (!data) {
            console.warn('⚠️ No profile found for user:', userId)
            console.log('🔧 Attempting to create profile for existing user...')
            
            // Try to create profile for existing user
            try {
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: userId,
                  email: user?.email || 'unknown@example.com',
                  full_name: user?.user_metadata?.full_name || user?.email || 'Unknown User'
                })
                .select()
                .single()
              
              if (createError) {
                console.error('❌ Failed to create profile:', createError)
              } else {
                console.log('✅ Created profile for existing user:', newProfile)
                setUserProfile(newProfile)
              }
            } catch (createErr) {
              console.error('❌ Exception creating profile:', createErr)
            }
          } else {
            console.log('✅ Profile loaded successfully:', data)
            setUserProfile(data)
          }
        }
      } catch (error) {
        console.error('❌ Profile load exception:', error)
        setUserProfile(null)
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

  // Permission checking methods
  const getUserRole = () => {
    return userProfile?.role || USER_ROLES.USER;
  };

  const hasPermission = (permission) => {
    const userRole = getUserRole();
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };

  const isSuperAdmin = () => getUserRole() === USER_ROLES.SUPER_ADMIN;
  const isAdmin = () => getUserRole() === USER_ROLES.ADMIN;
  const isManager = () => getUserRole() === USER_ROLES.MANAGER;
  const isUser = () => getUserRole() === USER_ROLES.USER;

  // Server-side RLS helper
  const createRLSPolicy = (table, operation, userRole) => {
    // This would be used in database migrations/policies
    const policies = {
      [USER_ROLES.SUPER_ADMIN]: true, // Full access
      [USER_ROLES.ADMIN]: {
        read: true,
        write: 'user_id = auth.uid() OR role = admin',
        delete: 'created_by = auth.uid()'
      },
      [USER_ROLES.MANAGER]: {
        read: 'team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())',
        write: 'created_by = auth.uid()',
        delete: false
      },
      [USER_ROLES.USER]: {
        read: 'assigned_to = auth.uid() OR created_by = auth.uid()',
        write: false,
        delete: false
      }
    };
    
    return policies[userRole]?.[operation] || false;
  };

  const value = {
    user,
    userProfile,
    loading,
    profileLoading,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    // Permission methods
    getUserRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isAdmin,
    isManager,
    isUser,
    // Constants
    USER_ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}