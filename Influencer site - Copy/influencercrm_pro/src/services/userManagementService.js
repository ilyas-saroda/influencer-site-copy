// src/services/userManagementService.js
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Create a separate Supabase client for admin operations using the service role key
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

// Helper function to convert camelCase to snake_case
const toSnakeCase = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
    }
  }
  return result;
};

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
    }
  }
  return result;
};

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  
  if (!accessToken) {
    throw new Error('No active session found. Please log in again.');
  }
  
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
};

// Fetch all users
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        userRoles:roleId (
          roleName,
          displayName
        )
      `)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: null, error };
  }
};

// Fetch all roles
export const getAllRoles = async () => {
  try {
    console.log('=== FETCHING ROLES ===');
    
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .order('role_name', { ascending: true });

    console.log('Supabase response - error:', error);
    console.log('Supabase response - data:', data);

    if (error) {
      console.error('Error fetching roles:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // If it's an RLS error, provide specific guidance
      if (error.message?.includes('permission denied') || error.code === '42501') {
        console.error(' RLS PERMISSION ERROR - Run the COMPREHENSIVE_ROLES_FIX.sql script in Supabase SQL Editor');
      }
      
      throw error;
    }
    
    console.log('Raw roles data:', data);
    const camelCaseData = data?.map(role => {
      const camelCaseRole = toCamelCase(role);
      // Ensure description field is properly mapped
      if (role.description && !camelCaseRole.description) {
        camelCaseRole.description = role.description;
      }
      return camelCaseRole;
    }) || [];
    console.log('Roles after conversion:', camelCaseData);
    
    return { data: camelCaseData, error: null };
  } catch (error) {
    console.error('Error fetching roles:', error);
    
    // Return fallback data on error
    console.log(' Returning fallback roles due to error');
    const fallbackRoles = [
      { id: '1', roleName: 'super_admin', displayName: 'Super Admin', permissions: '["all"]', description: 'Full system access' },
      { id: '2', roleName: 'admin', displayName: 'Admin', permissions: '["users.manage", "settings.manage"]', description: 'Administrative access' },
      { id: '3', roleName: 'manager', displayName: 'Manager', permissions: '["campaigns.manage"]', description: 'Campaign management' },
      { id: '4', roleName: 'user', displayName: 'User', permissions: '["campaigns.view"]', description: 'Standard user' },
      { id: '5', roleName: 'viewer', displayName: 'Viewer', permissions: '["campaigns.view"]', description: 'Read-only access' }
    ];
    return { data: fallbackRoles, error };
  }
};

// Check if user exists by email
export const checkUserExists = async (email) => {
  try {
    // First check in users table using admin client (bypasses RLS)
    const { data: dbUsers, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking database users:', dbError);
      // Don't return error, continue to auth check
    }
    
    if (dbUsers) {
      return { exists: true, source: 'database', userId: dbUsers.id };
    }
    
    // Check in auth.users using admin client
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error checking auth users:', authError);
      return { exists: false, error: authError };
    }
    
    const existingAuthUser = authUsers.users.find(user => user.email === email);
    
    if (existingAuthUser) {
      return { exists: true, source: 'auth', userId: existingAuthUser.id };
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return { exists: false, error };
  }
};

// Create user
export const createUser = async (userData) => {
  try {
    console.log('=== CREATING USER ===');
    console.log('User data:', userData);
    
    // Check if user already exists first
    const { exists, source, userId } = await checkUserExists(userData.email);
    if (exists) {
      const message = source === 'auth' 
        ? 'A user with this email address is already registered in the authentication system.'
        : 'A user with this email address already exists in the database.';
      return { data: null, error: { message } };
    }
    
    // Use admin client with service role key for user creation
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName,
      }
    });

    if (error) {
      console.error('Supabase auth error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Provide more specific error messages based on error codes
      if (error.message?.includes('A user with this email address has already been registered') || 
          error.message?.includes('User already registered') ||
          error.code === 'duplicate_key' ||
          error.code === '23505') {
        error.message = 'A user with this email address already exists. Please use a different email.';
      } else if (error.message?.includes('Password should be at least')) {
        error.message = 'Password is too weak. Please choose a stronger password.';
      } else if (error.message?.includes('weak password')) {
        error.message = 'Password is too weak. Please choose a stronger password.';
      } else if (error.message?.includes('Database error creating new user')) {
        error.message = 'Database error occurred. This might be due to a duplicate email or a database connection issue. Please try again.';
      }
      
      throw error;
    }

    console.log('✅ User created in auth:', data);

    // If user created successfully, add to users table using admin client (bypasses RLS)
    if (data?.user) {
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: data.user.id,
          email: userData.email,
          fullName: userData.fullName,
          roleId: userData.roleId,
          isActive: userData.isActive,
          created_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        console.error('Profile error details:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });
        
        // Check if it's a duplicate email error
        if (profileError.code === '23505' || 
            profileError.message?.includes('duplicate key') ||
            profileError.message?.includes('unique constraint') ||
            profileError.message?.includes('email')) {
          profileError.message = 'A user with this email address already exists in the database. Please use a different email.';
        }
        
        // Rollback: delete auth user
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        throw profileError;
      }

      // Fetch the complete user data with role
      const { data: completeUser, error: fetchError } = await supabase
        .from('users')
        .select(`
          *,
          userRoles:roleId (
            roleName,
            displayName
          )
        `)
        .eq('id', data.user.id)
        .single();

      if (fetchError) throw fetchError;

      console.log('✅ User created successfully:', completeUser);
      return { data: completeUser, error: null };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating user:', error);
    return { data: null, error };
  }
};

/**
 * Update user information
 */
export const updateUser = async (id, updates) => {
  try {
    const snakeCaseUpdates = toSnakeCase(updates);
    
    const { data, error } = await supabase
      .from('users')
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select(`
        *,
        user_roles (
          id,
          role_name,
          display_name,
          permissions
        )
      `)
      .single();

    if (error) throw error;
    return { data: toCamelCase(data), error: null };
  } catch (error) {
    console.error('Error updating user:', error);
    return { data: null, error };
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (id) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { error };
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (userId, roleId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role_id: roleId })
      .eq('id', userId)
      .select(`
        *,
        user_roles (
          id,
          role_name,
          display_name,
          permissions
        )
      `)
      .single();

    if (error) throw error;
    return { data: toCamelCase(data), error: null };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { data: null, error };
  }
};

/**
 * Toggle user active status
 */
export const toggleUserStatus = async (userId, isActive) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data: toCamelCase(data), error: null };
  } catch (error) {
    console.error('Error toggling user status:', error);
    return { data: null, error };
  }
};

/**
 * Fetch audit logs
 */
export const getAuditLogs = async (filters = {}) => {
  try {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        users (
          id,
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    // Apply filters
    if (filters?.userId) {
      query = query.eq('user_id', filters?.userId);
    }
    if (filters?.entityType) {
      query = query.eq('entity_type', filters?.entityType);
    }
    if (filters?.action) {
      query = query.eq('action', filters?.action);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data?.map(toCamelCase) || [], error: null };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return { data: null, error };
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_roles (
          id,
          role_name,
          display_name,
          permissions
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data: toCamelCase(data), error: null };
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return { data: null, error };
  }
};

/**
 * Create audit log entry
 */
export const createAuditLog = async (logData) => {
  try {
    const snakeCaseData = toSnakeCase(logData);
    
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([snakeCaseData])
      .select()
      .single();

    if (error) throw error;
    return { data: toCamelCase(data), error: null };
  } catch (error) {
    console.error('Error creating audit log:', error);
    return { data: null, error };
  }
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllRoles,
  updateUserRole,
  toggleUserStatus,
  getAuditLogs,
  createAuditLog,
  checkUserExists
};