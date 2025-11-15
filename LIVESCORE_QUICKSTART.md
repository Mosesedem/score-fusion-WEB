# 🎯 Live Score API Integration - Complete Guide

## Overview

This implementation adds a production-ready live score fetching system to Score Fusion with:

- ✅ Multiple API provider support (API-Football, TheSportsDB)
- ✅ Built-in rate limiting per provider
- ✅ Search functionality across teams and leagues
- ✅ Full pagination support
- ✅ Automatic fallback between providers
- ✅ Health monitoring and status tracking

---

## 📁 Files Created

### Core Implementation

1. **`lib/rate-limiter.ts`** - Rate limiting system
2. **`lib/api-providers/base-provider.ts`** - Base provider interface
3. **`lib/api-providers/api-football.ts`** - API-Football integration
4. **`lib/api-providers/thesportsdb.ts`** - TheSportsDB integration
5. **`lib/api-providers/provider-manager.ts`** - Provider management

### Documentation

6. **`docs/LIVESCORE_API_GUIDE.md`** - Complete API documentation
7. **`docs/LIVESCORE_IMPLEMENTATION.md`** - Implementation summary
8. **`lib/examples/livescore-usage.ts`** - Code examples and React hooks
9. **`scripts/test-livescore-api.sh`** - API testing script

### Updated Files

10. **`app/api/livescores/matches/route.ts`** - Enhanced API routes
11. **`app/livescores/page.tsx`** - Frontend with search and pagination
12. **`.env.example`** - Environment variable template

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up API Keys

Add to your `.env` file:

```bash
# Recommended: API-Football (best for football/soccer)
API_FOOTBALL_KEY=your_key_from_rapidapi

# Optional: TheSportsDB (free tier available)
THESPORTSDB_API_KEY=3
```

**Get API Keys:**

- **API-Football**: https://rapidapi.com/api-sports/api/api-football
- **TheSportsDB**: https://www.thesportsdb.com/api.php (free tier uses key "3")

### 3. Run the Application

```bash
pnpm dev
```

### 4. Test the Implementation

**Visit the frontend:**

```
http://localhost:3000/livescores
```

**Test the API:**

```bash
# Run the test script
./scripts/test-livescore-api.sh

# Or test manually
curl "http://localhost:3000/api/livescores/matches?status=live"
```

---

## 📖 API Usage

### Search for Matches

```bash
GET /api/livescores/matches?search=Arsenal&source=api
```

### Get Live Matches with Pagination

```bash
GET /api/livescores/matches?status=live&page=1&limit=20
```

### Filter by Date Range

```bash
GET /api/livescores/matches?dateFrom=2025-01-01&dateTo=2025-01-31
```

### Get Provider Health Status

```bash
POST /api/livescores/matches
Content-Type: application/json

{
  "action": "status"
}
```

**Full API documentation:** See `docs/LIVESCORE_API_GUIDE.md`

---

## 💡 Frontend Usage

### Basic Usage

```typescript
// Fetch live matches
const response = await fetch("/api/livescores/matches?status=live");
const { data } = await response.json();
console.log(data.matches);
```

### Search Implementation

```typescript
const searchMatches = async (query: string) => {
  const response = await fetch(
    `/api/livescores/matches?search=${encodeURIComponent(query)}&source=api`
  );
  const { data } = await response.json();
  return data.matches;
};
```

### Pagination (Load More)

```typescript
const loadMore = async (page: number) => {
  const response = await fetch(`/api/livescores/matches?page=${page}&limit=20`);
  const { data } = await response.json();
  return {
    matches: data.matches,
    hasMore: data.pagination.hasMore,
  };
};
```

**Full examples:** See `lib/examples/livescore-usage.ts`

---

## 🎨 Frontend Features

The updated `/livescores` page includes:

1. **Search Bar**

   - Real-time search functionality
   - Clear search button
   - Search result indicators

2. **Filters**

   - All / Live / Scheduled / Finished
   - Visual filter buttons

3. **Pagination**

   - "Load More" button
   - Shows current count vs total
   - Automatic page management

4. **Auto-Refresh**

   - Toggle auto-refresh on/off
   - 30-second refresh interval
   - Pauses during search

5. **Status Indicators**
   - Live match counter
   - Upcoming matches counter
   - Finished matches counter

---

## 🔧 Configuration

### Rate Limits (Default)

**API-Football (Free Tier):**

- 10 requests per minute
- 100 requests per day

**TheSportsDB:**

- 30 requests per minute
- Unlimited (free tier)

### Adjusting Rate Limits

Edit the provider configuration:

```typescript
// In lib/api-providers/api-football.ts
super({
  name: "api-football",
  apiKey,
  apiUrl: "https://v3.football.api-sports.io",
  rateLimitRequests: 10, // Change this
  rateLimitWindowMs: 60000, // Change this
});
```

### Adding More Providers

1. Create a new provider file:

```typescript
// lib/api-providers/my-provider.ts
import { BaseAPIProvider } from "./base-provider";

export class MyProvider extends BaseAPIProvider {
  // Implement required methods
}
```

2. Register it in the manager:

```typescript
// In app/api/livescores/matches/route.ts
import { MyProvider } from "@/lib/api-providers/my-provider";

const myProvider = new MyProvider(process.env.MY_API_KEY!);
apiProviderManager.addProvider(myProvider);
```

---

## 🐛 Troubleshooting

### Problem: "Rate limit exceeded"

**Solution:**

1. Check status: `POST /api/livescores/matches {"action": "status"}`
2. Wait for rate limit reset (shown in response)
3. Or upgrade your API plan

### Problem: "No matches found"

**Solution:**

1. Verify API keys in `.env`
2. Check provider health: `POST /api/livescores/matches {"action": "status"}`
3. Try different date ranges
4. Test API directly with curl

### Problem: Search not working

**Solution:**

1. Ensure `source=api` is included in search requests
2. Check API key is valid
3. Verify rate limits haven't been exceeded
4. Check browser console for errors

### Problem: Slow responses

**Solution:**

1. Use `source=database` for cached data
2. Reduce page size (`limit=10`)
3. Implement client-side caching (React Query, SWR)
4. Add Redis for distributed caching

---

## 📊 Monitoring

### Check Provider Health

```bash
curl -X POST http://localhost:3000/api/livescores/matches \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}' | jq
```

**Response:**

```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "name": "api-football",
        "healthy": true,
        "rateLimitInfo": {
          "remaining": 8,
          "resetTime": 45000
        }
      }
    ]
  }
}
```

### Monitor API Usage

Track in your application:

```typescript
const status = await fetch("/api/livescores/matches", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "status" }),
}).then((r) => r.json());

console.log("Rate limit:", status.data.providers[0].rateLimitInfo);
```

---

## 🎯 Next Steps

### Recommended Enhancements

1. **Add Caching**

   - Implement Redis for distributed caching
   - Add service worker for offline support
   - Use React Query for automatic cache management

2. **Improve UI**

   - Add virtual scrolling for large lists
   - Implement real-time updates via WebSockets
   - Add match detail modals
   - Favorite teams/leagues functionality

3. **Analytics**

   - Track popular searches
   - Monitor API usage patterns
   - User engagement metrics

4. **Testing**

   - Unit tests for providers
   - Integration tests for routes
   - E2E tests for search functionality

5. **Performance**
   - Optimize database queries
   - Add CDN for static assets
   - Implement edge caching

---

## 📚 Resources

- [Full API Guide](./LIVESCORE_API_GUIDE.md)
- [Implementation Details](./LIVESCORE_IMPLEMENTATION.md)
- [Code Examples](../lib/examples/livescore-usage.ts)
- [API-Football Docs](https://www.api-football.com/documentation-v3)
- [TheSportsDB Docs](https://www.thesportsdb.com/api.php)

---

## ✅ Checklist

- [ ] API keys added to `.env`
- [ ] Dependencies installed (`pnpm install`)
- [ ] Dev server running (`pnpm dev`)
- [ ] Tested search functionality
- [ ] Tested pagination
- [ ] Checked provider health status
- [ ] Reviewed rate limits
- [ ] Read API documentation

---

## 💬 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the full documentation in `docs/`
3. Test with the provided script: `./scripts/test-livescore-api.sh`
4. Check browser console for errors
5. Verify API keys are correct

---

**Happy coding! 🚀**
