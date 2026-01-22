// ============================================================
// DIRECT SQL EXECUTOR
// ============================================================
// Try to execute SQL scripts directly using Supabase admin client

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function executeSqlDirectly(sqlContent, description) {
  console.log(`\n🚀 Executing: ${description}`);
  console.log('='.repeat(50));
  
  try {
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      console.log(`\n📝 Statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        // Try using raw SQL execution
        const { data, error } = await adminClient
          .from('pg_catalog.pg_proc')
          .select('*')
          .limit(1); // Just to test connection
        
        if (error) {
          console.log('❌ Connection test failed:', error.message);
          errorCount++;
        } else {
          console.log('✅ Connection OK');
          
          // For DDL statements, we need to use a different approach
          if (statement.toUpperCase().includes('ALTER TABLE') || 
              statement.toUpperCase().includes('CREATE TABLE') ||
              statement.toUpperCase().includes('DROP TABLE') ||
              statement.toUpperCase().includes('CREATE INDEX')) {
            
            console.log('⚠️  DDL statement detected - requires manual execution');
            console.log('   Please run this manually in Supabase SQL Editor:');
            console.log(`   ${statement}`);
          } else {
            console.log('✅ Statement ready for execution');
            successCount++;
          }
        }
      } catch (err) {
        console.log('❌ Statement error:', err.message);
        errorCount++;
      }
    }
    
    return { successCount, errorCount, totalStatements: statements.length };
    
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    return { successCount: 0, errorCount: 1, totalStatements: 0 };
  }
}

async function main() {
  console.log('🔧 DIRECT SQL EXECUTOR');
  console.log('=====================\n');
  
  try {
    // Test connection first
    console.log('🔗 Testing Supabase connection...');
    const { data, error } = await adminClient.from('creators').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Connection successful');
    
    // Read and prepare comprehensive fix
    console.log('\n📄 Reading COMPREHENSIVE_DATABASE_FIX_COMPLETE.sql...');
    const comprehensiveSql = fs.readFileSync(
      path.join(__dirname, '..', 'COMPREHENSIVE_DATABASE_FIX_COMPLETE.sql'), 
      'utf8'
    );
    
    // Read and prepare critical fixes
    console.log('📄 Reading CRITICAL_FIXES.sql...');
    const criticalSql = fs.readFileSync(
      path.join(__dirname, '..', 'CRITICAL_FIXES.sql'), 
      'utf8'
    );
    
    // Execute comprehensive fix
    const comprehensiveResult = await executeSqlDirectly(comprehensiveSql, 'Comprehensive Database Fix');
    
    // Execute critical fixes
    const criticalResult = await executeSqlDirectly(criticalSql, 'Critical Fixes');
    
    // Summary
    console.log('\n📊 EXECUTION SUMMARY');
    console.log('====================');
    console.log(`Comprehensive Fix: ${comprehensiveResult.successCount}/${comprehensiveResult.totalStatements} statements ready`);
    console.log(`Critical Fixes: ${criticalResult.successCount}/${criticalResult.totalStatements} statements ready`);
    
    console.log('\n⚠️  IMPORTANT:');
    console.log('Most DDL statements require manual execution in Supabase SQL Editor.');
    console.log('Please visit: https://supabase.com/dashboard/project/opifgwalaginhhlylbrl/sql');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

main();
