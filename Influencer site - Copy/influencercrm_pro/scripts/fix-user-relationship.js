// ============================================================
// FIX USER-USERROLES RELATIONSHIP SCRIPT
// ============================================================
// This script specifically fixes the user-userRoles relationship issue

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserRelationship() {
  console.log('🔧 Fixing User-UserRoles Relationship...');
  
  try {
    // Check if users table has role_id column
    console.log('📋 Checking users table structure...');
    
    const { data: columns, error: columnError } = await adminClient
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'users')
      .eq('table_schema', 'public');
    
    if (columnError) {
      console.log('❌ Error checking columns:', columnError.message);
      return;
    }
    
    console.log('📋 Current users table columns:');
    columns?.forEach(col => console.log(`   - ${col.column_name}: ${col.data_type}`));
    
    // Check if role_id exists
    const hasRoleId = columns?.some(col => col.column_name === 'role_id');
    
    if (!hasRoleId) {
      console.log('➕ Adding role_id column to users table...');
      
      // Add role_id column
      const { error: alterError } = await adminClient.rpc('exec_sql', {
        sql_query: `ALTER TABLE users ADD COLUMN role_id UUID REFERENCES user_roles(id);`
      });
      
      if (alterError) {
        console.log('⚠️  Could not add column via client. Manual SQL execution required.');
        console.log('   Run this in Supabase SQL Editor:');
        console.log('   ALTER TABLE users ADD COLUMN role_id UUID REFERENCES user_roles(id);');
      } else {
        console.log('✅ role_id column added successfully');
      }
    } else {
      console.log('✅ role_id column already exists');
    }
    
    // Create index for performance
    console.log('📋 Creating index for role_id...');
    
    const { error: indexError } = await adminClient.rpc('exec_sql', {
      sql_query: `CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);`
    });
    
    if (indexError) {
      console.log('⚠️  Could not create index via client. Manual SQL execution required.');
      console.log('   Run this in Supabase SQL Editor:');
      console.log('   CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);');
    } else {
      console.log('✅ Index created successfully');
    }
    
    // Test the relationship
    console.log('🧪 Testing user-userRoles relationship...');
    
    const { data: testData, error: testError } = await adminClient
      .from('users')
      .select(`
        id,
        email,
        user_roles (
          id,
          name
        )
      `)
      .limit(1);
    
    if (testError) {
      console.log('❌ Relationship test failed:', testError.message);
      
      // Try to refresh schema cache
      console.log('🔄 Refreshing schema cache...');
      
      const { error: refreshError } = await adminClient.rpc('exec_sql', {
        sql_query: `NOTIFY pgrst, 'reload schema';`
      });
      
      if (refreshError) {
        console.log('⚠️  Could not refresh schema via client');
      } else {
        console.log('✅ Schema cache refreshed');
      }
    } else {
      console.log('✅ User-UserRoles relationship working!');
      console.log('📋 Test data:', testData);
    }
    
    // Add sample admin user if users table is empty
    console.log('📋 Checking if sample admin user exists...');
    
    const { data: userCount, error: countError } = await adminClient
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Error checking user count:', countError.message);
    } else if (userCount === 0) {
      console.log('➕ Adding sample admin user...');
      
      const { data: adminRole, error: roleError } = await adminClient
        .from('user_roles')
        .select('id')
        .eq('name', 'admin')
        .single();
      
      if (roleError) {
        console.log('❌ Error finding admin role:', roleError.message);
      } else {
        const { error: insertError } = await adminClient
          .from('users')
          .insert({
            email: 'admin@influencercrm.com',
            full_name: 'System Administrator',
            role_id: adminRole.id,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.log('❌ Error adding admin user:', insertError.message);
        } else {
          console.log('✅ Sample admin user added successfully');
        }
      }
    } else {
      console.log(`✅ Users table has ${userCount} records`);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Run the fix
fixUserRelationship()
  .then(() => {
    console.log('\n🎉 User relationship fix completed!');
    console.log('📋 Next steps:');
    console.log('   1. Run final-verification.js to check results');
    console.log('   2. If issues persist, run SQL manually in Supabase SQL Editor');
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
