import { supabase } from '../lib/supabase';

/**
 * System Settings Service
 * Handles all system configuration operations
 */

// Convert snake_case to camelCase
const toCamelCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj?.map(toCamelCase);
  
  return Object.keys(obj)?.reduce((acc, key) => {
    const camelKey = key?.replace(/_([a-z])/g, (_, letter) => letter?.toUpperCase());
    acc[camelKey] = typeof obj?.[key] === 'object' ? toCamelCase(obj?.[key]) : obj?.[key];
    return acc;
  }, {});
};

// Convert camelCase to snake_case
const toSnakeCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj?.map(toSnakeCase);
  
  return Object.keys(obj)?.reduce((acc, key) => {
    const snakeKey = key?.replace(/[A-Z]/g, letter => `_${letter?.toLowerCase()}`);
    acc[snakeKey] = typeof obj?.[key] === 'object' ? toSnakeCase(obj?.[key]) : obj?.[key];
    return acc;
  }, {});
};

/**
 * Fetch all system settings
 */
export const getAllSettings = async () => {
  try {
    const { data, error } = await supabase?.from('system_settings')?.select('*')?.order('setting_category', { ascending: true });

    if (error) throw error;
    return { data: data?.map(toCamelCase) || [], error: null };
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return { data: null, error };
  }
};

/**
 * Fetch settings by category
 */
export const getSettingsByCategory = async (category) => {
  try {
    const { data, error } = await supabase?.from('system_settings')?.select('*')?.eq('setting_category', category)?.order('setting_key', { ascending: true });

    if (error) throw error;
    return { data: data?.map(toCamelCase) || [], error: null };
  } catch (error) {
    console.error(`Error fetching settings for category ${category}:`, error);
    return { data: null, error };
  }
};

/**
 * Get a specific setting by key
 */
export const getSettingByKey = async (key) => {
  try {
    const { data, error } = await supabase?.from('system_settings')?.select('*')?.eq('setting_key', key)?.single();

    if (error) throw error;
    return { data: toCamelCase(data), error: null };
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return { data: null, error };
  }
};

/**
 * Update a system setting
 */
export const updateSetting = async (id, updates) => {
  try {
    const snakeCaseUpdates = toSnakeCase(updates);
    
    const { data, error } = await supabase?.from('system_settings')?.update(snakeCaseUpdates)?.eq('id', id)?.select()?.single();

    if (error) throw error;
    return { data: toCamelCase(data), error: null };
  } catch (error) {
    console.error('Error updating system setting:', error);
    return { data: null, error };
  }
};

/**
 * Create a new system setting
 */
export const createSetting = async (setting) => {
  try {
    const snakeCaseSetting = toSnakeCase(setting);
    
    const { data, error } = await supabase?.from('system_settings')?.insert([snakeCaseSetting])?.select()?.single();

    if (error) throw error;
    return { data: toCamelCase(data), error: null };
  } catch (error) {
    console.error('Error creating system setting:', error);
    return { data: null, error };
  }
};

/**
 * Delete a system setting
 */
export const deleteSetting = async (id) => {
  try {
    const { error } = await supabase?.from('system_settings')?.delete()?.eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting system setting:', error);
    return { error };
  }
};

export default {
  getAllSettings,
  getSettingsByCategory,
  getSettingByKey,
  updateSetting,
  createSetting,
  deleteSetting
};