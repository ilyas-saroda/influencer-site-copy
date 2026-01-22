/**
 * Script to seed user_roles table
 * Run this script to ensure all roles are in the database
 * 
 * Usage: node scripts/seed-user-roles.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const roles = [
  {
    role_name: 'super_admin',
    display_name: 'Super Admin',
    permissions: ['all'],
    description: 'Full system access with ability to manage all settings and users'
  },
  {
    role_name: 'admin',
    display_name: 'Admin',
    permissions: ['users.manage', 'settings.manage', 'campaigns.manage', 'creators.manage', 'brands.manage'],
    description: 'Administrative access to manage users, settings, and business operations'
  },
  {
    role_name: 'manager',
    display_name: 'Manager',
    permissions: ['campaigns.manage', 'creators.view', 'brands.view', 'payments.view'],
    description: 'Can manage campaigns and view creator/brand information'
  },
  {
    role_name: 'user',
    display_name: 'User',
    permissions: ['campaigns.view', 'creators.view', 'brands.view'],
    description: 'Standard user with view access to campaigns, creators, and brands'
  },
  {
    role_name: 'viewer',
    display_name: 'Viewer',
    permissions: ['campaigns.view'],
    description: 'Read-only access to campaign information'
  }
];

async function seedRoles() {
  console.log('🔄 Seeding user_roles table...\n');

  for (const role of roles) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .upsert({
          role_name: role.role_name,
          display_name: role.display_name,
          permissions: role.permissions,
          description: role.description
        }, {
          onConflict: 'role_name'
        })
        .select();

      if (error) {
        console.error(`❌ Error seeding ${role.role_name}:`, error.message);
      } else {
        console.log(`✅ ${role.display_name} (${role.role_name}) - ${data?.[0]?.id || 'updated'}`);
      }
    } catch (err) {
      console.error(`❌ Exception seeding ${role.role_name}:`, err.message);
    }
  }

  // Verify roles
  console.log('\n🔍 Verifying roles...');
  const { data: allRoles, error: fetchError } = await supabase
    .from('user_roles')
    .select('*')
    .order('role_name');

  if (fetchError) {
    console.error('❌ Error fetching roles:', fetchError.message);
  } else {
    console.log(`\n✅ Found ${allRoles?.length || 0} roles in database:`);
    allRoles?.forEach(role => {
      console.log(`   - ${role.display_name} (${role.role_name})`);
    });
  }
}

seedRoles()
  .then(() => {
    console.log('\n✅ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });

