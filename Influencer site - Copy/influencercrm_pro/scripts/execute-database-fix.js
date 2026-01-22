// Execute comprehensive database fix
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFix() {
  console.log('🔧 Executing comprehensive database fix...\n');
  
  try {
    // Read the SQL file
    const sqlContent = readFileSync('./COMPREHENSIVE_DATABASE_FIX.sql', 'utf8');
    
    // Split into individual statements (simple approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip pure comments and empty statements
      if (statement.startsWith('--') || statement.length < 10) continue;
      
      try {
        console.log(`\n[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { sql_statement: statement });
        
        if (error) {
          // Try direct SQL for DDL statements
          console.log('⚠️ RPC failed, trying direct approach...');
          
          // For DDL, we need to use the SQL editor directly
          console.log(`📝 Statement ${i + 1}: Please run this manually in Supabase SQL Editor:`);
          console.log(statement + ';');
          console.log('---');
        } else {
          console.log('✅ Success');
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Execution Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Manual execution needed: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error reading SQL file:', error);
  }
}

async function verifyFix() {
  console.log('\n🔍 Verifying database fix...\n');
  
  const tables = ['brands', 'contacts', 'campaigns', 'users', 'user_roles', 'audit_logs', 'creators'];
  
  for (const tableName of tables) {
    try {
      console.log(`📋 Checking ${tableName}...`);
      
      // Test basic SELECT
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: ${count} records`);
        
        // Get column info for sample tables
        if (['brands', 'contacts', 'campaigns', 'users'].includes(tableName) && count > 0) {
          const { data: sampleData } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (sampleData && sampleData.length > 0) {
            const columns = Object.keys(sampleData[0]);
            console.log(`   Columns: ${columns.join(', ')}`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
    }
  }
  
  // Test relationships
  console.log('\n🔗 Testing relationships...');
  
  try {
    // Test brand-contacts
    const { data: brandContacts, error: brandError } = await supabase
      .from('brands')
      .select(`
        id,
        name,
        contacts (id, full_name, email)
      `)
      .limit(1);
    
    if (brandError) {
      console.log(`❌ Brand-contacts relationship: ${brandError.message}`);
    } else {
      console.log('✅ Brand-contacts relationship works');
    }
    
    // Test campaign-creators
    const { data: campaignCreators, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        creators (id, name, instagram_link)
      `)
      .limit(1);
    
    if (campaignError) {
      console.log(`❌ Campaign-creators relationship: ${campaignError.message}`);
    } else {
      console.log('✅ Campaign-creators relationship works');
    }
    
  } catch (error) {
    console.log(`❌ Relationship test failed: ${error.message}`);
  }
  
  // Test RLS policies
  console.log('\n🔐 Testing RLS policies...');
  
  const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
  
  for (const tableName of ['brands', 'contacts', 'campaigns']) {
    try {
      const { data, error } = await anonClient
        .from(tableName)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`🔒 ${tableName}: RLS blocking anon (good)`);
      } else {
        console.log(`⚠️ ${tableName}: Accessible to anon (check if intended)`);
      }
    } catch (error) {
      console.log(`❌ RLS test failed for ${tableName}: ${error.message}`);
    }
  }
}

async function generateFrontendTest() {
  console.log('\n🧪 Generating frontend compatibility test...');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tables: {},
    relationships: {},
    rls: {}
  };
  
  // Test each table
  const tables = ['brands', 'contacts', 'campaigns', 'users', 'creators'];
  
  for (const tableName of tables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      testResults.tables[tableName] = {
        exists: !error,
        recordCount: count || 0,
        error: error?.message || null
      };
      
      if (data && data.length > 0) {
        testResults.tables[tableName].columns = Object.keys(data[0]);
      }
    } catch (error) {
      testResults.tables[tableName] = {
        exists: false,
        error: error.message
      };
    }
  }
  
  // Save test results
  const fs = await import('fs');
  fs.writeFileSync('./frontend-compatibility-test.json', JSON.stringify(testResults, null, 2));
  
  console.log('📄 Frontend compatibility test saved to: frontend-compatibility-test.json');
}

async function main() {
  console.log('🚀 Starting database fix process...\n');
  
  await executeSQLFix();
  await verifyFix();
  await generateFrontendTest();
  
  console.log('\n🎉 Database fix process completed!');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Run the COMPREHENSIVE_DATABASE_FIX.sql script in Supabase SQL Editor');
  console.log('2. Verify all tables are working in the Supabase Table Editor');
  console.log('3. Test frontend functionality');
  console.log('4. Check frontend-compatibility-test.json for detailed results');
}

main().catch(console.error);
