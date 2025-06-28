#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');

function checkFileExists(path) {
  try {
    return fs.existsSync(path);
  } catch {
    return false;
  }
}

function getFileCount(pattern) {
  try {
    const files = fs.readdirSync('data/articles/');
    return files.filter(f => f.endsWith('.json')).length;
  } catch {
    return 0;
  }
}

function getAudioCount() {
  try {
    const files = fs.readdirSync('data/audio/');
    return files.filter(f => f.endsWith('.mp3')).length;
  } catch {
    return 0;
  }
}

console.log('🔧 AI News Development Status');
console.log(''.padEnd(50, '='));

// Environment Check
const useLocal = process.env.USE_LOCAL_DB === 'true';
const nodeEnv = process.env.NODE_ENV || 'production';
const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

console.log(`📊 Current Configuration:`);
console.log(`   Environment: ${nodeEnv}`);
console.log(`   Mode: ${useLocal ? '🏠 LOCAL' : '☁️ SUPABASE'}`);
console.log(`   Supabase Credentials: ${hasSupabase ? '✅' : '❌'}`);
console.log('');

// Local Files Check
console.log(`📁 Local Development Data:`);
console.log(`   Article files: ${getFileCount()}`);
console.log(`   Audio files: ${getAudioCount()}`);
console.log(`   Config exists: ${checkFileExists('.env') ? '✅' : '❌'}`);
console.log('');

// Available Commands
console.log(`🚀 Available Development Commands:`);
console.log(`   npm run dev:local     - Local files only (safe)`);
console.log(`   npm run dev:supabase  - Use Supabase (production data)`);
console.log(`   npm run dev:status    - Show this status`);
console.log(`   npm start             - Normal production mode`);
console.log('');

// Recommendations
if (!hasSupabase) {
  console.log(`💡 Recommendation: Use LOCAL mode`);
  console.log(`   → npm run dev:local`);
} else if (useLocal) {
  console.log(`💡 Current: LOCAL development mode`);
  console.log(`   Switch to Supabase: npm run dev:supabase`);
} else {
  console.log(`💡 Current: SUPABASE mode`);
  console.log(`   Switch to local: npm run dev:local`);
}

console.log(''); 