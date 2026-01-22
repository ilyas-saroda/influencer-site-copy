import { supabase } from '../lib/supabase';

export const brandService = {
  // Get all brands with contact count
  async getAll() {
    const { data, error } = await supabase?.from('brands')?.select(`
        *,
        contacts:contacts(count)
      `)?.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data?.map(row => ({
      id: row?.id,
      name: row?.name,
      category: row?.category,
      website: row?.website,
      logoUrl: row?.logo_url,
      description: row?.description,
      industry: row?.industry,
      headquarters: row?.headquarters,
      employeeCount: row?.employee_count,
      annualRevenue: row?.annual_revenue,
      socialMediaLinks: row?.social_media_links,
      notes: row?.notes,
      contactCount: row?.contacts?.[0]?.count || 0,
      createdBy: row?.created_by,
      createdAt: row?.created_at,
      updatedAt: row?.updated_at
    }));
  },

  // Get single brand with all details
  async getById(brandId) {
    const { data, error } = await supabase?.from('brands')?.select(`
        *,
        contacts(*),
        brand_campaigns(
          campaign_id,
          campaigns(*)
        )
      `)?.eq('id', brandId)?.single();
    
    if (error) throw error;
    
    return {
      id: data?.id,
      name: data?.name,
      category: data?.category,
      website: data?.website,
      logoUrl: data?.logo_url,
      description: data?.description,
      industry: data?.industry,
      headquarters: data?.headquarters,
      employeeCount: data?.employee_count,
      annualRevenue: data?.annual_revenue,
      socialMediaLinks: data?.social_media_links,
      notes: data?.notes,
      contacts: data?.contacts?.map(c => ({
        id: c?.id,
        fullName: c?.full_name,
        email: c?.email,
        phone: c?.phone,
        whatsapp: c?.whatsapp,
        designation: c?.designation,
        contactType: c?.contact_type,
        linkedinUrl: c?.linkedin_url,
        isPrimary: c?.is_primary,
        notes: c?.notes,
        createdAt: c?.created_at
      })),
      campaigns: data?.brand_campaigns?.map(bc => bc?.campaigns) || [],
      createdBy: data?.created_by,
      createdAt: data?.created_at,
      updatedAt: data?.updated_at
    };
  },

  // Create new brand
  async create(brand) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase?.from('brands')?.insert({
        name: brand?.name,
        category: brand?.category,
        website: brand?.website,
        logo_url: brand?.logoUrl,
        description: brand?.description,
        industry: brand?.industry,
        headquarters: brand?.headquarters,
        employee_count: brand?.employeeCount,
        annual_revenue: brand?.annualRevenue,
        social_media_links: brand?.socialMediaLinks || {},
        notes: brand?.notes,
        created_by: user?.id
      })?.select()?.single();
    
    if (error) throw error;
    
    return {
      id: data?.id,
      name: data?.name,
      category: data?.category,
      website: data?.website,
      logoUrl: data?.logo_url,
      createdAt: data?.created_at
    };
  },

  // Update brand
  async update(brandId, updates) {
    const { data, error } = await supabase?.from('brands')?.update({
        name: updates?.name,
        category: updates?.category,
        website: updates?.website,
        logo_url: updates?.logoUrl,
        description: updates?.description,
        industry: updates?.industry,
        headquarters: updates?.headquarters,
        employee_count: updates?.employeeCount,
        annual_revenue: updates?.annualRevenue,
        social_media_links: updates?.socialMediaLinks,
        notes: updates?.notes
      })?.eq('id', brandId)?.select()?.single();
    
    if (error) throw error;
    
    return {
      id: data?.id,
      name: data?.name,
      updatedAt: data?.updated_at
    };
  },

  // Delete brand
  async delete(brandId) {
    const { error } = await supabase?.from('brands')?.delete()?.eq('id', brandId);
    
    if (error) throw error;
  },

  // Search brands
  async search(query) {
    const { data, error } = await supabase?.from('brands')?.select('*')?.or(`name.ilike.%${query}%,industry.ilike.%${query}%,description.ilike.%${query}%`)?.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data?.map(row => ({
      id: row?.id,
      name: row?.name,
      category: row?.category,
      industry: row?.industry,
      headquarters: row?.headquarters,
      createdAt: row?.created_at
    }));
  }
};

export const contactService = {
  // Get all contacts for a brand
  async getByBrandId(brandId) {
    const { data, error } = await supabase?.from('contacts')?.select('*')?.eq('brand_id', brandId)?.order('is_primary', { ascending: false })?.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data?.map(row => ({
      id: row?.id,
      brandId: row?.brand_id,
      fullName: row?.full_name,
      email: row?.email,
      phone: row?.phone,
      whatsapp: row?.whatsapp,
      designation: row?.designation,
      contactType: row?.contact_type,
      linkedinUrl: row?.linkedin_url,
      isPrimary: row?.is_primary,
      notes: row?.notes,
      createdAt: row?.created_at
    }));
  },

  // Create new contact
  async create(contact) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase?.from('contacts')?.insert({
        brand_id: contact?.brandId,
        full_name: contact?.fullName,
        email: contact?.email,
        phone: contact?.phone,
        whatsapp: contact?.whatsapp,
        designation: contact?.designation,
        contact_type: contact?.contactType || 'primary',
        linkedin_url: contact?.linkedinUrl,
        is_primary: contact?.isPrimary || false,
        notes: contact?.notes,
        created_by: user?.id
      })?.select()?.single();
    
    if (error) throw error;
    
    return {
      id: data?.id,
      fullName: data?.full_name,
      email: data?.email,
      createdAt: data?.created_at
    };
  },

  // Update contact
  async update(contactId, updates) {
    const { data, error } = await supabase?.from('contacts')?.update({
        full_name: updates?.fullName,
        email: updates?.email,
        phone: updates?.phone,
        whatsapp: updates?.whatsapp,
        designation: updates?.designation,
        contact_type: updates?.contactType,
        linkedin_url: updates?.linkedinUrl,
        is_primary: updates?.isPrimary,
        notes: updates?.notes
      })?.eq('id', contactId)?.select()?.single();
    
    if (error) throw error;
    
    return {
      id: data?.id,
      fullName: data?.full_name,
      updatedAt: data?.updated_at
    };
  },

  // Delete contact
  async delete(contactId) {
    const { error } = await supabase?.from('contacts')?.delete()?.eq('id', contactId);
    
    if (error) throw error;
  },

  // Set primary contact for brand
  async setPrimary(brandId, contactId) {
    // First, unset all primary contacts for this brand
    await supabase?.from('contacts')?.update({ is_primary: false })?.eq('brand_id', brandId);
    
    // Then set the new primary
    const { data, error } = await supabase?.from('contacts')?.update({ is_primary: true })?.eq('id', contactId)?.select()?.single();
    
    if (error) throw error;
    
    return {
      id: data?.id,
      isPrimary: data?.is_primary
    };
  }
};