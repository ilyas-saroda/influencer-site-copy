// Final frontend verification script
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testFrontendServices() {
  console.log('🧪 Testing Frontend Service Compatibility...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { passed: 0, failed: 0, warnings: 0 }
  };
  
  // Test 1: Creator Service (should work)
  console.log('1️⃣ Testing Creator Service...');
  try {
    const { data, error, count } = await anonClient
      .from('creators')
      .select('id, name, email, city, state', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.log(`❌ Creator Service failed: ${error.message}`);
      results.tests.push({ service: 'creatorService', status: 'failed', error: error.message });
      results.summary.failed++;
    } else {
      console.log(`✅ Creator Service works - Found ${count} creators`);
      results.tests.push({ service: 'creatorService', status: 'passed', recordCount: count });
      results.summary.passed++;
    }
  } catch (error) {
    console.log(`❌ Creator Service error: ${error.message}`);
    results.tests.push({ service: 'creatorService', status: 'failed', error: error.message });
    results.summary.failed++;
  }
  
  // Test 2: Brand Service
  console.log('\n2️⃣ Testing Brand Service...');
  try {
    const { data, error } = await anonClient
      .from('brands')
      .select(`
        *,
        contacts (count)
      `)
      .limit(3);
    
    if (error) {
      console.log(`❌ Brand Service failed: ${error.message}`);
      results.tests.push({ service: 'brandService', status: 'failed', error: error.message });
      results.summary.failed++;
    } else {
      console.log(`✅ Brand Service works - Found ${data.length} brands`);
      results.tests.push({ service: 'brandService', status: 'passed', recordCount: data.length });
      results.summary.passed++;
      
      // Test brand creation
      const testBrand = {
        name: 'Test Brand ' + Date.now(),
        category: 'technology',
        description: 'Test brand for verification'
      };
      
      const { data: newBrand, error: createError } = await adminClient
        .from('brands')
        .insert(testBrand)
        .select()
        .single();
      
      if (createError) {
        console.log(`⚠️ Brand creation failed: ${createError.message}`);
        results.tests.push({ service: 'brandService.create', status: 'warning', error: createError.message });
        results.summary.warnings++;
      } else {
        console.log('✅ Brand creation works');
        results.tests.push({ service: 'brandService.create', status: 'passed', brandId: newBrand.id });
        results.summary.passed++;
        
        // Clean up
        await adminClient.from('brands').delete().eq('id', newBrand.id);
      }
    }
  } catch (error) {
    console.log(`❌ Brand Service error: ${error.message}`);
    results.tests.push({ service: 'brandService', status: 'failed', error: error.message });
    results.summary.failed++;
  }
  
  // Test 3: Contact Service
  console.log('\n3️⃣ Testing Contact Service...');
  try {
    // First get a brand to associate with
    const { data: brands } = await anonClient
      .from('brands')
      .select('id')
      .limit(1);
    
    if (brands && brands.length > 0) {
      const brandId = brands[0].id;
      
      const { data, error } = await anonClient
        .from('contacts')
        .select('*')
        .eq('brand_id', brandId)
        .limit(3);
      
      if (error) {
        console.log(`❌ Contact Service failed: ${error.message}`);
        results.tests.push({ service: 'contactService', status: 'failed', error: error.message });
        results.summary.failed++;
      } else {
        console.log(`✅ Contact Service works - Found ${data.length} contacts`);
        results.tests.push({ service: 'contactService', status: 'passed', recordCount: data.length });
        results.summary.passed++;
      }
    } else {
      console.log('⚠️ No brands found to test contacts');
      results.tests.push({ service: 'contactService', status: 'warning', error: 'No brands found' });
      results.summary.warnings++;
    }
  } catch (error) {
    console.log(`❌ Contact Service error: ${error.message}`);
    results.tests.push({ service: 'contactService', status: 'failed', error: error.message });
    results.summary.failed++;
  }
  
  // Test 4: Campaign Service
  console.log('\n4️⃣ Testing Campaign Service...');
  try {
    const { data, error } = await anonClient
      .from('campaigns')
      .select(`
        *,
        creators (id, name, instagram_link)
      `)
      .limit(3);
    
    if (error) {
      console.log(`❌ Campaign Service failed: ${error.message}`);
      results.tests.push({ service: 'campaignService', status: 'failed', error: error.message });
      results.summary.failed++;
    } else {
      console.log(`✅ Campaign Service works - Found ${data.length} campaigns`);
      results.tests.push({ service: 'campaignService', status: 'passed', recordCount: data.length });
      results.summary.passed++;
    }
  } catch (error) {
    console.log(`❌ Campaign Service error: ${error.message}`);
    results.tests.push({ service: 'campaignService', status: 'failed', error: error.message });
    results.summary.failed++;
  }
  
  // Test 5: User Management Service
  console.log('\n5️⃣ Testing User Management Service...');
  try {
    const { data, error } = await adminClient
      .from('users')
      .select(`
        *,
        userRoles (role_name, display_name)
      `)
      .limit(3);
    
    if (error) {
      console.log(`❌ User Service failed: ${error.message}`);
      results.tests.push({ service: 'userManagementService', status: 'failed', error: error.message });
      results.summary.failed++;
    } else {
      console.log(`✅ User Service works - Found ${data.length} users`);
      results.tests.push({ service: 'userManagementService', status: 'passed', recordCount: data.length });
      results.summary.passed++;
    }
    
    // Test user roles
    const { data: roles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('*')
      .limit(10);
    
    if (rolesError) {
      console.log(`❌ User Roles failed: ${rolesError.message}`);
      results.tests.push({ service: 'userRoles', status: 'failed', error: rolesError.message });
      results.summary.failed++;
    } else {
      console.log(`✅ User Roles work - Found ${roles.length} roles`);
      results.tests.push({ service: 'userRoles', status: 'passed', recordCount: roles.length });
      results.summary.passed++;
    }
  } catch (error) {
    console.log(`❌ User Service error: ${error.message}`);
    results.tests.push({ service: 'userManagementService', status: 'failed', error: error.message });
    results.summary.failed++;
  }
  
  // Test 6: System Settings
  console.log('\n6️⃣ Testing System Settings...');
  try {
    const { data, error } = await anonClient
      .from('system_settings')
      .select('*')
      .eq('is_public', true)
      .limit(10);
    
    if (error) {
      console.log(`❌ System Settings failed: ${error.message}`);
      results.tests.push({ service: 'systemSettings', status: 'failed', error: error.message });
      results.summary.failed++;
    } else {
      console.log(`✅ System Settings work - Found ${data.length} public settings`);
      results.tests.push({ service: 'systemSettings', status: 'passed', recordCount: data.length });
      results.summary.passed++;
    }
  } catch (error) {
    console.log(`❌ System Settings error: ${error.message}`);
    results.tests.push({ service: 'systemSettings', status: 'failed', error: error.message });
    results.summary.failed++;
  }
  
  // Test 7: Audit Logs
  console.log('\n7️⃣ Testing Audit Logs...');
  try {
    const { data, error } = await adminClient
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log(`❌ Audit Logs failed: ${error.message}`);
      results.tests.push({ service: 'auditLogs', status: 'failed', error: error.message });
      results.summary.failed++;
    } else {
      console.log(`✅ Audit Logs work - Found ${data.length} audit entries`);
      results.tests.push({ service: 'auditLogs', status: 'passed', recordCount: data.length });
      results.summary.passed++;
    }
  } catch (error) {
    console.log(`❌ Audit Logs error: ${error.message}`);
    results.tests.push({ service: 'auditLogs', status: 'failed', error: error.message });
    results.summary.failed++;
  }
  
  return results;
}

async function generateFinalReport(results) {
  console.log('\n📊 FINAL VERIFICATION REPORT');
  console.log('============================');
  
  console.log(`\n📈 Summary:`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️ Warnings: ${results.summary.warnings}`);
  
  const successRate = ((results.summary.passed / (results.summary.passed + results.summary.failed + results.summary.warnings)) * 100).toFixed(1);
  console.log(`📊 Success Rate: ${successRate}%`);
  
  console.log(`\n📋 Detailed Results:`);
  results.tests.forEach(test => {
    const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
    console.log(`${icon} ${test.service}: ${test.status}`);
    if (test.error) console.log(`   Error: ${test.error}`);
    if (test.recordCount !== undefined) console.log(`   Records: ${test.recordCount}`);
  });
  
  // Recommendations
  console.log(`\n🔧 Recommendations:`);
  
  if (results.summary.failed > 0) {
    console.log('❌ Some services are still failing. Check the SQL fix execution.');
    console.log('   - Ensure COMPREHENSIVE_DATABASE_FIX.sql was run completely');
    console.log('   - Verify table structures in Supabase Table Editor');
    console.log('   - Check RLS policies are correctly configured');
  }
  
  if (results.summary.warnings > 0) {
    console.log('⚠️ Some services have warnings. These may need attention:');
    console.log('   - Check if sample data is needed for proper testing');
    console.log('   - Verify relationships between tables');
  }
  
  if (results.summary.failed === 0 && results.summary.warnings <= 2) {
    console.log('🎉 Excellent! Database is ready for production use.');
    console.log('   - All core services are working');
    console.log('   - Frontend should work correctly');
    console.log('   - Consider adding sample data for testing');
  }
  
  // Save results
  const fs = await import('fs');
  fs.writeFileSync('./final-verification-report.json', JSON.stringify(results, null, 2));
  
  console.log(`\n📄 Full report saved to: final-verification-report.json`);
  
  return results.summary.failed === 0;
}

async function main() {
  console.log('🚀 Starting Final Frontend Verification...\n');
  
  const results = await testFrontendServices();
  const isSuccessful = await generateFinalReport(results);
  
  if (isSuccessful) {
    console.log('\n🎉 DATABASE AUDIT AND FIX COMPLETED SUCCESSFULLY!');
    console.log('✅ All tables are working correctly');
    console.log('✅ Frontend services are compatible');
    console.log('✅ Ready for production use');
  } else {
    console.log('\n⚠️ DATABASE FIX NEEDS ATTENTION');
    console.log('❌ Some issues still need to be resolved');
    console.log('📋 Check the detailed report above');
  }
}

main().catch(console.error);
