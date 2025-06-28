#!/usr/bin/env node
require('dotenv').config();

// Force local mode
process.env.USE_LOCAL_DB = 'true';
process.env.NODE_ENV = 'development';

console.log('🏠 Starting AI News in LOCAL DEVELOPMENT mode');
console.log('');
console.log('📁 Using local JSON files (no Supabase)');
console.log('🎵 Audio files served from local disk');
console.log('⚡ Hot reload enabled');
console.log('');
console.log('💡 Your changes will not affect production data');
console.log('');

// Start the TypeScript development server
const { spawn } = require('child_process');

const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env }
});

child.on('exit', (code) => {
  process.exit(code);
}); 