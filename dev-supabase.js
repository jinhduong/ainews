#!/usr/bin/env node
require('dotenv').config();

// Force Supabase mode
delete process.env.USE_LOCAL_DB;
process.env.NODE_ENV = 'development';

console.log('☁️ Starting AI News in SUPABASE DEVELOPMENT mode');
console.log('');
console.log('🗄️ Using Supabase PostgreSQL database');
console.log('📁 Audio files served from Supabase Storage');
console.log('⚡ Hot reload enabled');
console.log('');
console.log('⚠️ This will use your production Supabase instance');
console.log('💡 Consider creating a separate dev Supabase project');
console.log('');

// Check for required credentials
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

// Start the TypeScript development server
const { spawn } = require('child_process');

const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env }
});

child.on('exit', (code) => {
  process.exit(code);
}); 