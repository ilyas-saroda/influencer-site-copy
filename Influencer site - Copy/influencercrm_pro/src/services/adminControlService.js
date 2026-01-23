// src/services/adminControlService.js
import { supabase } from '../lib/supabase';

// System Settings Management
export const getSystemSettings = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_system_settings_safe');

    if (error) {
      console.error('System Settings RPC Error:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return { data: null, error };
  }
};

export const updateSystemSetting = async (key, value) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .update({ 
        setting_value: value,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', key)
      .select()
      .single();

    if (error) {
      console.error('Update Setting Error:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error updating system setting:', error);
    return { data: null, error };
  }
};

// User Management Functions
export const getUserStatistics = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_statistics');

    if (error) {
      console.error('User Statistics RPC Error:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return { data: null, error };
  }
};

export const updateUserRole = async (userId, newRoleId) => {
  try {
    const { data, error } = await supabase
      .rpc('update_user_role_safely', {
        target_user_id: userId,
        new_role_id: newRoleId
      });

    if (error) {
      console.error('Update User Role RPC Error:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { data: null, error };
  }
};

export const deactivateUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Deactivate User Error:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error deactivating user:', error);
    return { data: null, error };
  }
};

// System Health Functions
export const getSystemHealth = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_system_health');

    if (error) {
      console.error('System Health RPC Error:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching system health:', error);
    return { data: null, error };
  }
};

export const forceLogoutAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .rpc('force_logout_all_users');

    if (error) {
      console.error('Force Logout RPC Error:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error forcing logout all users:', error);
    return { data: null, error };
  }
};

export const clearSystemCache = async () => {
  try {
    const { data, error } = await supabase
      .rpc('clear_system_cache');

    if (error) {
      console.error('Clear Cache RPC Error:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error clearing system cache:', error);
    return { data: null, error };
  }
};

// Get all users with enhanced information
export const getAllUsersEnhanced = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_users_enhanced_safe');

    if (error) {
      console.error('Get Users Enhanced RPC Error:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching enhanced users:', error);
    return { data: null, error };
  }
};

// Get all user roles
export const getAllUserRoles = async () => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('display_name');

    if (error) {
      console.error('Get User Roles Error:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return { data: null, error };
  }
};

// Check if current user has super admin permissions
export const checkSuperAdminPermission = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: false, error: 'No user found' };

    const { data, error } = await supabase
      .from('users')
      .select(`
        role_id,
        user_roles!inner (
          role_name
        )
      `)
      .eq('auth_id', user.id)
      .single();

    if (error) {
      console.error('Check Super Admin Permission Error:', error);
      throw error;
    }
    
    const isSuperAdmin = data?.user_roles?.role_name === 'super_admin';
    return { data: isSuperAdmin, error: null };
  } catch (error) {
    console.error('Error checking super admin permission:', error);
    return { data: false, error };
  }
};
