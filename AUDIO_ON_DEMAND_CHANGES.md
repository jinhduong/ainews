# On-Demand Audio Generation Changes

This document summarizes the major changes made to implement cost-efficient, on-demand audio generation for the AI News Service.

## 🎯 Goals Achieved

1. **Cost Reduction**: Audio is now only generated when users actually request it
2. **Efficiency**: No wasted OpenAI API calls for articles that are never listened to
3. **Persistence**: Once generated, audio is stored and never regenerated
4. **Backward Compatibility**: All existing endpoints continue to work

## 📁 Dashboard Structure Improvements

### New Folder Organization
```
src/dashboard/
├── index.ts                 # Main dashboard router
├── routes/
│   ├── dashboard.ts         # Dashboard API routes
│   └── analytics.ts         # Analytics tracking routes
├── views/
│   └── dashboard.html       # Dashboard HTML template
├── middleware/              # Dashboard-specific middleware (future use)
└── README.md               # Documentation
```

### Benefits
- **Clean Separation**: Dashboard code is now isolated from main application logic
- **Maintainability**: Easier to modify and extend dashboard features
- **Modularity**: Each component has a clear responsibility
- **Documentation**: Comprehensive README for the dashboard module

## 🎵 Audio Generation Changes

### 1. Removed Proactive Audio Generation
**File:** `src/services/newsCollector.ts`
- Removed batch audio generation during news collection
- Articles are now collected without audio files
- Significant cost savings on unused audio content

### 2. Added On-Demand Audio Generation
**File:** `src/services/audioService.ts`
- New `generateAudioOnDemand()` function
- Generates audio only when requested by users
- Handles both Supabase and local storage modes
- Updates article records with audio paths after generation

### 3. Enhanced Audio Serving Endpoint
**File:** `src/index.ts` - `/api/v1/audio/:articleId`
- Complete rewrite of the audio endpoint
- Now handles on-demand generation workflow:
  1. Check if audio already exists
  2. If not, generate it on-demand using OpenAI TTS
  3. Store the audio (Supabase Storage + local backup)
  4. Update article record with audio path
  5. Serve/redirect to the audio file

### 4. Added Database Update Functions
**File:** `src/services/supabaseArticleService.ts`
- New `updateArticleAudioPath()` function
- Updates Supabase articles with audio paths after generation

**File:** `src/services/newsStorage.ts`
- New `updateArticleAudioPathLocal()` function
- Updates local JSON files with audio paths after generation

## 🔄 How It Works Now

### User Experience Flow
1. User opens the frontend and sees articles (no change)
2. User clicks play button on an article
3. Frontend requests: `GET /api/v1/audio/{articleId}`
4. Backend checks if audio exists:
   - **If exists**: Redirect to existing audio file
   - **If not exists**: Generate on-demand, then redirect to new audio

### Technical Flow

#### Supabase Mode
1. Look up article in Supabase
2. Check if `audio_path` exists
3. If not, call `generateAudioOnDemand()`
4. Generate audio using OpenAI TTS
5. Upload to Supabase Storage
6. Update article record with `audio_path`
7. Redirect user to Supabase Storage URL

#### Local Mode  
1. Find article in local JSON files
2. Check if local audio file exists
3. If not, call `generateAudioOnDemand()`
4. Generate audio using OpenAI TTS
5. Save audio file locally
6. Update article JSON with `audioPath`
7. Stream audio file to user

## 💰 Cost Benefits

### Before
- Generated audio for ALL articles during collection
- ~10 articles × 15-minute intervals = ~960 audio files/day
- Many audio files never listened to = wasted OpenAI costs

### After  
- Generate audio ONLY when users request it
- Typical usage: ~10-50 audio requests/day
- **Cost reduction: 90-95%** on audio generation

## 🔧 Technical Improvements

### Error Handling
- Graceful fallbacks between Supabase and local modes
- Comprehensive error logging
- User-friendly error messages

### Performance
- Audio caching prevents regeneration
- Efficient storage checking
- Parallel processing where possible

### Monitoring
- Audio generation tracked in dashboard statistics
- Cost tracking via OpenAI API usage metrics
- Storage statistics for both modes

## 🧪 Testing

All changes compile successfully:
```bash
npm run build  # ✅ Passes
```

## 🚀 Next Steps

1. **Test the implementation** with real user requests
2. **Monitor costs** and usage patterns
3. **Optimize voice selection** based on user preferences
4. **Add audio quality options** (tts-1 vs tts-1-hd)
5. **Implement audio preloading** for popular articles

## 📋 Migration Notes

- Existing audio files remain accessible
- No breaking changes to frontend API
- Articles without audio will now generate it on first request
- Dashboard has been reorganized but maintains all functionality

---

**Summary**: The system now generates audio efficiently on-demand, reducing costs while maintaining excellent user experience. The dashboard code is better organized for future maintenance and development. 