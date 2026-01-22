// Database schema discovery script
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration!');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function discoverSchema() {
  console.log('🔍 Discovering Supabase database schema...\n');
  
  try {
    // Get all tables in public schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_info');
    
    if (tablesError) {
      console.log('⚠️ RPC method not available, using alternative approach...');
      
      // Alternative: Query information_schema
      const { data: schemaTables, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .neq('table_name', '_pg_stat_statements');
      
      if (schemaError) {
        throw schemaError;
      }
      
      console.log('📋 Tables found:', schemaTables.map(t => t.table_name));
      return schemaTables.map(t => t.table_name);
    }
    
    console.log('📋 Tables found:', tables);
    return tables;
  } catch (error) {
    console.error('❌ Error discovering tables:', error);
    return [];
  }
}

async function getTableDetails(tableName) {
  console.log(`\n🔍 Analyzing table: ${tableName}`);
  
  try {
    // Get column information
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select(`
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      `)
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position');
    
    if (columnError) {
      console.error(`❌ Error fetching columns for ${tableName}:`, columnError);
      return null;
    }
    
    // Get primary key information
    const { data: primaryKeys, error: pkError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        constraint_type
      `)
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .eq('constraint_type', 'PRIMARY KEY');
    
    // Get foreign key information
    const { data: foreignKeys, error: fkError } = await supabase
      .from('information_schema.key_column_usage')
      .select(`
        column_name,
        constraint_name
      `)
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    // Get RLS policies
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', tableName);
    
    const tableInfo = {
      tableName,
      columns: columns || [],
      primaryKeys: primaryKeys || [],
      foreignKeys: foreignKeys || [],
      policies: policies || []
    };
    
    console.log(`✅ Table ${tableName} analysis complete`);
    return tableInfo;
  } catch (error) {
    console.error(`❌ Error analyzing table ${tableName}:`, error);
    return null;
  }
}

async function testTableOperations(tableName) {
  console.log(`\n🧪 Testing CRUD operations for: ${tableName}`);
  
  try {
    // Test SELECT
    const { data: selectData, error: selectError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.log(`❌ SELECT failed: ${selectError.message}`);
    } else {
      console.log(`✅ SELECT works - Sample data:`, selectData?.[0] ? 'Available' : 'Empty table');
    }
    
    // Test INSERT (if we have a sample record structure)
    if (selectData && selectData.length > 0) {
      const sampleRecord = { ...selectData[0] };
      delete sampleRecord.id;
      delete sampleRecord.created_at;
      delete sampleRecord.updated_at;
      
      // Set null values for required fields to test
      Object.keys(sampleRecord).forEach(key => {
        if (sampleRecord[key] !== null && sampleRecord[key] !== undefined) {
          sampleRecord[key] = null;
        }
      });
      
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(sampleRecord);
      
      if (insertError && !insertError.message.includes('not-null')) {
        console.log(`❌ INSERT failed: ${insertError.message}`);
      } else {
        console.log(`✅ INSERT permission check completed`);
      }
    }
    
    return {
      selectWorks: !selectError,
      selectError: selectError?.message
    };
  } catch (error) {
    console.error(`❌ Error testing operations for ${tableName}:`, error);
    return {
      selectWorks: false,
      selectError: error.message
    };
  }
}

async function main() {
  const tables = await discoverSchema();
  
  if (tables.length === 0) {
    console.log('❌ No tables found in database');
    return;
  }
  
  const schemaInfo = {};
  
  for (const table of tables) {
    const details = await getTableDetails(table);
    if (details) {
      schemaInfo[table] = details;
      await testTableOperations(table);
    }
  }
  
  // Save schema info to file
  const fs = await import('fs');
  fs.writeFileSync('./database_schema.json', JSON.stringify(schemaInfo, null, 2));
  
  console.log('\n📄 Schema analysis saved to: database_schema.json');
  console.log('\n📊 Summary:');
  console.log(`- Total tables analyzed: ${Object.keys(schemaInfo).length}`);
  
  // Count issues
  let issues = 0;
  for (const [tableName, info] of Object.entries(schemaInfo)) {
    if (info.columns.length === 0) issues++;
    if (info.primaryKeys.length === 0) {
      console.log(`⚠️ Table ${tableName} has no primary key`);
      issues++;
    }
  }
  
  console.log(`- Issues found: ${issues}`);
  
  if (issues > 0) {
    console.log('\n🔧 Some tables need fixes. Check database_schema.json for details.');
  } else {
    console.log('\n✅ All tables appear to be properly structured!');
  }
}

main().catch(console.error);
