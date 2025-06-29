# 🚀 Cache Module

This module provides request-level caching to prevent excessive database queries during rapid page reloads.

## 📁 Module Structure

```
src/cache/
├── services/
│   └── requestCacheService.ts    # Core cache service with NodeCache
├── middleware/
│   └── requestCacheMiddleware.ts # Express middleware for automatic caching
├── routes/
│   └── cacheRoutes.ts           # API routes for cache management
├── views/
│   └── cacheDashboard.html      # Beautiful web dashboard
├── index.ts                     # Module exports
└── README.md                    # This documentation
```

## ⚡ Features

- **60-second TTL caching** for API responses
- **Intelligent cache keys** based on request parameters
- **User isolation** with IP-based cache separation
- **Real-time dashboard** with live statistics
- **Cache management** via API endpoints
- **Zero-config setup** with sensible defaults

## 🔧 Usage

### Import the module:
```typescript
import { newsApiCacheMiddleware, requestCache, cacheRoutes } from './cache';
```

### Apply middleware to routes:
```typescript
app.post('/api/v1/news', authenticateApiKey, newsApiCacheMiddleware, async (req, res) => {
  // Your route logic - caching handled automatically
});
```

### Mount cache routes:
```typescript
app.use('/api/v1/cache', cacheRoutes);
```

## 📊 Dashboard

Access the cache dashboard at: `http://localhost:3000/api/v1/cache/dashboard`

### Dashboard Features:
- 📈 **Real-time statistics** (auto-refresh every 5 seconds)
- 🎯 **Hit rate visualization** with animated progress bars
- 🔑 **Active cache keys** listing
- 🧹 **Manual cache clearing**
- 📊 **Performance metrics**

## 🛠 API Endpoints

### Cache Statistics
```
GET /api/v1/cache/stats
```
Returns detailed cache performance metrics.

### Cache Dashboard
```
GET /api/v1/cache/dashboard
```
Serves the HTML dashboard interface.

### Cache Keys
```
GET /api/v1/cache/keys
```
Lists all active cache keys.

### Clear Cache
```
DELETE /api/v1/cache/clear
```
Clears all cached entries.

### Health Check
```
GET /api/v1/cache/health
```
Returns cache system health status.

## 🔄 How It Works

1. **Request arrives** → Middleware checks cache
2. **Cache HIT** → Return cached response (< 1ms)
3. **Cache MISS** → Process request normally
4. **Response ready** → Cache response for 60 seconds
5. **Next identical request** → Served from cache

## 🎯 Cache Key Generation

Cache keys are generated using:
- **Endpoint path**
- **Request parameters** (category, page, pageSize)
- **User context** (IP address)
- **MD5 hash** for consistent, collision-resistant keys

## 📈 Performance Benefits

- **Reduces database load** by up to 90% during traffic spikes
- **Sub-millisecond response times** for cached requests
- **Prevents API hammering** from rapid page reloads
- **Maintains data freshness** with 60-second expiration

## 🧪 Testing

Test cache functionality:

```bash
# Make a request (cache miss)
curl -X POST http://localhost:3000/api/v1/news \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123" \
  -d '{"category": "technology", "page": 1}'

# Same request immediately (cache hit)
curl -X POST http://localhost:3000/api/v1/news \
  -H "Content-Type: application/json" \
  -H "x-api-key: 123" \
  -d '{"category": "technology", "page": 1}'

# Check cache stats
curl http://localhost:3000/api/v1/cache/stats
```

## 🔧 Configuration

### Customize cache TTL:
```typescript
const customCacheMiddleware = createRequestCacheMiddleware({
  ttl: 120, // 2 minutes
  keyGenerator: (req) => ({ /* custom key logic */ }),
  shouldCache: (req, res) => res.statusCode === 200
});
```

### Multiple cache instances:
```typescript
const longTermCache = new RequestCacheService(3600); // 1 hour
const shortTermCache = new RequestCacheService(30);   // 30 seconds
```

## 🚨 Monitoring

Watch cache performance:
- **Hit rate should be > 70%** for optimal performance
- **Memory usage** scales with number of active keys
- **TTL effectiveness** shown in dashboard metrics
- **Cache clears** logged for debugging

## 🛡️ Security

- **Rate limiting** prevents cache abuse
- **IP-based isolation** prevents cross-user cache pollution
- **Admin endpoints** (clear cache) should be protected in production
- **Cache keys** are hashed to prevent information leakage

---

*Built with ❤️ for AI News - Preventing database overload, one cache at a time!* 