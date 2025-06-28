# 🏠 Local Development Guide

This guide shows you how to develop AI News locally without affecting production data.

## 🚀 Quick Start

### **Option 1: Local Development (Recommended)**
```bash
# Use local files only - completely safe
npm run dev:local
```

### **Option 2: Supabase Development**
```bash
# Use production Supabase instance
npm run dev:supabase
```

### **Check Current Status**
```bash
npm run dev:status
```

## 📊 Development Modes

### 🏠 **Local Mode** (`npm run dev:local`)
- ✅ **Completely safe** - no production impact
- ✅ Uses local JSON files (`data/articles/`)
- ✅ Serves audio from local disk (`data/audio/`)
- ✅ Fast startup and iteration
- ✅ Works offline
- ❌ Limited to existing local data

**Perfect for:**
- Frontend development
- API endpoint testing
- UI/UX changes
- New feature development

### ☁️ **Supabase Mode** (`npm run dev:supabase`)
- ⚠️ Uses **production Supabase** database
- ✅ Full feature testing
- ✅ Real data and audio
- ✅ Test migration features
- ❌ Could affect production data

**Perfect for:**
- Database schema testing
- Migration testing
- Production debugging

## 🔧 Environment Variables

### **Local Development** (.env.local)
```bash
# Force local mode
USE_LOCAL_DB=true
NODE_ENV=development

# Optional: Still needed for news collection
NEWS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

### **Supabase Development** (.env)
```bash
# Use production Supabase
# USE_LOCAL_DB=false  # or omit this line
NODE_ENV=development

# Required for Supabase mode
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

NEWS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

## 🎯 Best Practices

### **For New Features**
1. Start with `npm run dev:local`
2. Build and test your feature
3. Test with `npm run dev:supabase` 
4. Deploy to production

### **For Bug Fixes**
1. Reproduce with `npm run dev:supabase`
2. Fix and test locally
3. Verify fix works in both modes

### **For Database Changes**
1. Test schema changes on dev Supabase project
2. Run migrations on staging
3. Apply to production

## 🗄️ Supabase Local Alternatives

### **Option A: Separate Dev Project** (Recommended)
1. Create a new Supabase project for development
2. Run the database schema: `database-schema.sql`
3. Use dev project credentials in `.env.local`

### **Option B: Docker PostgreSQL**
```bash
# Run local PostgreSQL with Docker
docker run --name ainews-dev-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ainews \
  -p 5432:5432 \
  -d postgres:15

# Connect and run schema
psql -h localhost -p 5432 -U postgres -d ainews < database-schema.sql
```

### **Option C: File-Only Development**
```bash
# Always use local files (current setup)
export USE_LOCAL_DB=true
npm run dev:local
```

## 🔍 Debugging Development Issues

### **Check Configuration**
```bash
npm run dev:status
```

### **Common Issues**

**"Cannot find module" errors:**
```bash
npm install     # Ensure dependencies are installed
npm run build   # Rebuild TypeScript
```

**Audio not playing:**
- Local mode: Check `data/audio/` directory
- Supabase mode: Check Supabase Storage bucket

**Articles not loading:**
- Local mode: Check `data/articles/` JSON files  
- Supabase mode: Check database connection

**Environment not switching:**
```bash
# Force local mode
export USE_LOCAL_DB=true
npm run dev:local

# Force Supabase mode  
unset USE_LOCAL_DB
npm run dev:supabase
```

## 🎵 Audio Development

### **Local Audio**
- Files stored in: `data/audio/`
- Served at: `http://localhost:3000/api/v1/audio/:articleId`
- Generated during news collection

### **Supabase Audio** 
- Files in: Supabase Storage bucket `audio`
- CDN URLs: `https://project.supabase.co/storage/v1/object/public/audio/...`
- Same API endpoint, different backend

## 📝 Development Scripts

| Command | Purpose | Safety |
|---------|---------|---------|
| `npm run dev:local` | Local files only | ✅ Completely safe |
| `npm run dev:supabase` | Production Supabase | ⚠️ Affects production |
| `npm run dev:status` | Check configuration | ✅ Read-only |
| `npm run dev` | TypeScript development | ⚠️ Uses current config |
| `npm start` | Production mode | ⚠️ Production |

## 🚀 Deployment

### **From Local Development**
```bash
npm run build     # Build TypeScript
npm start         # Test production build
# Deploy to Vercel/production
```

### **Environment Variables for Production**
- Remove or set `USE_LOCAL_DB=false`
- Ensure Supabase credentials are set
- Set `NODE_ENV=production`

---

## 💡 Tips

- **Always start with local mode** for safety
- **Use separate Supabase projects** for dev/staging/prod
- **Test in both modes** before deploying
- **Check `npm run dev:status`** when debugging
- **Local mode is perfect** for 90% of development tasks 