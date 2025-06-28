// Migration script to move data from files to Supabase
// Run with: node migrate.js

require('dotenv').config();

const { migrateAllToSupabase, backupFileData } = require('./dist/services/migrationService');

async function runMigration() {
  console.log('🚀 Starting migration to Supabase...\n');

  try {
    // Step 1: Create backup
    console.log('💾 Step 1: Creating backup of current data...');
    const backupResult = await backupFileData();
    
    if (backupResult.success) {
      console.log(`✅ Backup created at: ${backupResult.backupPath}\n`);
    } else {
      console.log(`❌ Backup failed: ${backupResult.error}\n`);
      return;
    }

    // Step 2: Migrate data
    console.log('🔄 Step 2: Migrating data to Supabase...');
    const migrationResult = await migrateAllToSupabase();

    // Report results
    console.log('\n📊 Migration Results:');
    console.log(`📄 Articles: ${migrationResult.articles.totalMigrated} migrated`);
    console.log(`🎵 Audio: ${migrationResult.audio.totalMigrated} migrated`);
    
    if (migrationResult.articles.errors.length > 0) {
      console.log('\n❌ Article Migration Errors:');
      migrationResult.articles.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (migrationResult.audio.errors.length > 0) {
      console.log('\n❌ Audio Migration Errors:');
      migrationResult.audio.errors.forEach(error => console.log(`  • ${error}`));
    }

    if (migrationResult.success) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('You can now switch to using Supabase instead of file storage.');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Check the logs above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

runMigration(); 