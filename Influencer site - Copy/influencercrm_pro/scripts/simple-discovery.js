// Simple database discovery using direct queries
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Common table names based on the services we found
const expectedTables = [
  'creators',
  'brands', 
  'contacts',
  'campaigns',
  'brand_campaigns',
  'campaign_deliverables',
  'users',
  'user_roles',
  'audit_logs',
  'cities',
  'states',
  'system_settings',
  'export_logs'
];

async function testTable(tableName) {
  console.log(`🔍 Testing table: ${tableName}`);
  
  try {
    // Test basic SELECT
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ Table ${tableName} error: ${error.message}`);
      return {
        exists: false,
        error: error.message,
        errorDetails: error
      };
    }
    
    console.log(`✅ Table ${tableName} exists - ${count} records`);
    
    // Get sample data to understand columns
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log(`⚠️ Could not get sample data: ${sampleError.message}`);
    } else {
      console.log(`📋 Columns: ${sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]).join(', ') : 'No data'}`);
    }
    
    return {
      exists: true,
      recordCount: count,
      columns: sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
      sampleData: sampleData
    };
    
  } catch (error) {
    console.log(`❌ Unexpected error for ${tableName}: ${error.message}`);
    return {
      exists: false,
      error: error.message
    };
  }
}

async function testRelationships() {
  console.log('\n🔗 Testing table relationships...');
  
  // Test brand-contacts relationship
  try {
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select(`
        id,
        name,
        contacts (id, full_name, email)
      `)
      .limit(1);
    
    if (brandError) {
      console.log(`❌ Brand-contacts relationship error: ${brandError.message}`);
    } else {
      console.log(`✅ Brand-contacts relationship works`);
    }
  } catch (error) {
    console.log(`❌ Brand-contacts test failed: ${error.message}`);
  }
  
  // Test campaign-creators relationship
  try {
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        creators (id, name, instagram_link)
      `)
      .limit(1);
    
    if (campaignError) {
      console.log(`❌ Campaign-creators relationship error: ${campaignError.message}`);
    } else {
      console.log(`✅ Campaign-creators relationship works`);
    }
  } catch (error) {
    console.log(`❌ Campaign-creators test failed: ${error.message}`);
  }
}

async function testRLSPolicies() {
  console.log('\n🔐 Testing RLS policies...');
  
  // Test with anon key (should be restricted)
  const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
  
  for (const tableName of ['creators', 'brands', 'campaigns']) {
    try {
      const { data, error } = await anonClient
        .from(tableName)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`🔒 Table ${tableName} - RLS blocking anon access (good)`);
      } else {
        console.log(`⚠️ Table ${tableName} - Accessible to anon (check if intended)`);
      }
    } catch (error) {
      console.log(`❌ RLS test failed for ${tableName}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🔍 Starting database discovery...\n');
  
  const results = {};
  
  // Test all expected tables
  for (const tableName of expectedTables) {
    results[tableName] = await testTable(tableName);
  }
  
  // Test relationships
  await testRelationships();
  
  // Test RLS policies
  await testRLSPolicies();
  
  // Summary
  console.log('\n📊 DISCOVERY SUMMARY');
  console.log('====================');
  
  const existingTables = Object.entries(results)
    .filter(([_, info]) => info.exists)
    .map(([name, _]) => name);
  
  const missingTables = Object.entries(results)
    .filter(([_, info]) => !info.exists)
    .map(([name, _]) => name);
  
  console.log(`✅ Existing tables: ${existingTables.length}`);
  existingTables.forEach(name => {
    const info = results[name];
    console.log(`  - ${name}: ${info.recordCount} records, ${info.columns.length} columns`);
  });
  
  if (missingTables.length > 0) {
    console.log(`❌ Missing tables: ${missingTables.length}`);
    missingTables.forEach(name => {
      console.log(`  - ${name}: ${results[name].error}`);
    });
  }
  
  // Save results
  const fs = await import('fs');
  fs.writeFileSync('./db-discovery-results.json', JSON.stringify(results, null, 2));
  
  console.log('\n📄 Results saved to: db-discovery-results.json');
  
  // Generate recommendations
  console.log('\n🔧 RECOMMENDATIONS');
  console.log('==================');
  
  if (missingTables.includes('creators')) {
    console.log('❌ CREATES TABLE NEEDED - Core functionality broken');
  }
  
  if (missingTables.includes('brands')) {
    console.log('❌ BRANDS TABLE NEEDED - Brand management broken');
  }
  
  if (missingTables.includes('campaigns')) {
    console.log('❌ CAMPAIGNS TABLE NEEDED - Campaign management broken');
  }
  
  if (existingTables.length > 0) {
    console.log('✅ Some tables exist - focus on missing ones first');
  }
}

main().catch(console.error);
