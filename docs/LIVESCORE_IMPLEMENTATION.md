# Live Score API Implementation - Summary

This implementation adds comprehensive live score fetching capabilities with search, rate limiting, and pagination to your Score Fusion platform.

## 🎯 What Was Implemented

### 1. **Rate Limiting System** (`lib/rate-limiter.ts`)

- Token bucket algorithm for API rate limiting
- Per-provider rate limit tracking
- Redis-based rate limiter for production use
- Automatic request queuing and retry logic

### 2. **Base API Provider Interface** (`lib/api-providers/base-provider.ts`)

- Abstract base class for all API providers
- Standardized interface for match fetching
- Built-in rate limiting for all providers
- Search and filter capabilities
- Pagination support

### 3. **API-Football Provider** (`lib/api-providers/api-football.ts`)

- Integration with API-Football (RapidAPI)
- Comprehensive football/soccer data
- Live matches, scheduled matches, finished matches
- Search by team, league, or match details
- Rate limit: 10 requests/minute (free tier)

### 3a. **SportMonks Football Provider (v3)** (`lib/api-providers/sportmonks.ts`)

- Prioritized when `SPORTMONKS_API_KEY` is present (set first in manager)
- Rich data set: participants, league info, venue, events, statistics
- Team & league logos via `participants.image` and `league.image_path`
- Live, scheduled (date window), and finished fixtures
- Statistics mapped (possession, shots, shots on target, corners, cards)
- Events normalized (minute, type, player) for recent event display
- Internal status mapping from SportMonks codes (NS, LIVE, FT, etc.)
- Local pagination applied to fetched window responses
- Recommended for analytics visuals (logos + stat bars)

### 4. **TheSportsDB Provider** (`lib/api-providers/thesportsdb.ts`)

- Integration with TheSportsDB
- Multi-sport support (free tier available)
- Basic live score functionality
- Search capabilities
- Rate limit: 30 requests/minute

### 5. **Provider Manager** (`lib/api-providers/provider-manager.ts`)

- Manages multiple API providers
- Automatic fallback between providers
- Health monitoring for all providers
- Rate limit tracking across providers
- Single interface for all live score operations

### 6. **Updated API Routes** (`app/api/livescores/matches/route.ts`)

- Enhanced GET endpoint with:
  - Search by team, league, or general query
  - Filter by sport, status, date range
  - Pagination (page/limit)
  - Source selection (API vs database)
  - Total count and hasMore indicators
- Enhanced POST endpoint with:
  - Provider health status
  - Rate limit information
  - System status monitoring

### 7. **Updated Frontend** (`app/livescores/page.tsx`)

- Search bar for finding matches
- Real-time search functionality
- "Load More" pagination button
- Clear search functionality
- Search result indicators
- Improved user experience

## 📋 Features

### ✅ Search & Filtering

```typescript
// Search by team name
/api/livescores/matches?search=Arsenal&source=api

// Filter by status
/api/livescores/matches?status=live

// Filter by league
/api/livescores/matches?league=Premier%20League

// Date range filtering
/api/livescores/matches?dateFrom=2025-01-01&dateTo=2025-01-31
```

### ✅ Rate Limiting

- Automatic rate limit enforcement
- Per-provider rate tracking
- Request queuing when limits reached
- Rate limit info in API responses

### ✅ Pagination

```typescript
// Page 1, 20 items
/api/livescores/matches?page=1&limit=20

// Load more
/api/livescores/matches?page=2&limit=20

// Response includes:
{
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5,
    hasMore: true
  }
}
```

### ✅ Multiple Data Sources

```typescript
// Fetch from external API
/api/livescores/matches?source=api

// Fetch from database (cached)
/api/livescores/matches?source=database

// Auto-detect (API for searches, DB for filters)
/api/livescores/matches?source=auto
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

```bash
# Add to .env
API_FOOTBALL_KEY=your_api_football_key_here
THESPORTSDB_API_KEY=your_thesportsdb_key_here
SPORTMONKS_API_KEY=your_sportmonks_key_here
SPORTMONKS_API_URL=https://api.sportmonks.com/v3/football
```

### 3. Get API Keys

**API-Football (Recommended for Football/Soccer if SportMonks unavailable):**

1. Go to [RapidAPI API-Football](https://rapidapi.com/api-sports/api/api-football)
2. Sign up and subscribe to a plan
3. Copy your API key
4. Add to `.env` as `API_FOOTBALL_KEY`

**TheSportsDB (Free Tier Available / fallback):**
**SportMonks (Rich Data & Logos):**

1. Visit [SportMonks](https://www.sportmonks.com/) and create an account.
2. Generate your API token.
3. Add `SPORTMONKS_API_KEY` to `.env`.
4. (Optional) Override base URL with `SPORTMONKS_API_URL` if using a proxy.
5. Confirm provider initialization via POST status action.

SportMonks is prioritized automatically when configured, providing enhanced event & statistics detail for analytics dashboards.

1. Go to [TheSportsDB](https://www.thesportsdb.com/api.php)
2. Free tier uses API key `3` (no signup needed)
3. For higher limits, become a Patreon supporter
4. Add to `.env` as `THESPORTSDB_API_KEY`

### 4. Test the Implementation

```bash
# Start the dev server
pnpm dev

# Visit the livescores page
http://localhost:3000/livescores

# Test the API directly
curl "http://localhost:3000/api/livescores/matches?status=live"

# Test search
curl "http://localhost:3000/api/livescores/matches?search=Arsenal&source=api"

# Test pagination
curl "http://localhost:3000/api/livescores/matches?page=1&limit=10"

# Check provider health
curl -X POST http://localhost:3000/api/livescores/matches \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'
```

## 📊 API Endpoints

### GET /api/livescores/matches

**Query Parameters:**

- `status`: Match status (live, scheduled, finished, postponed, cancelled)
- `sport`: Sport name (football, basketball, etc.)
- `league`: League name
- `team`: Team name (partial match)
- `search`: General search query
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `dateFrom`: Start date (ISO 8601)
- `dateTo`: End date (ISO 8601)
- `source`: Data source (api, database, auto)
- `featured`: Featured matches only (true/false)

**Response:**

```json
{
  "success": true,
  "data": {
    "matches": [...],
    "filters": {...},
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasMore": true
    },
    "source": "api"
  }
}
```

### POST /api/livescores/matches

**Actions:**

- `refresh`: Refresh live scores
- `start`: Start automatic updates
- `stop`: Stop automatic updates
- `status`: Get provider health status

**Request:**

```json
{
  "action": "status"
}
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
    ],
    "lastUpdate": "2025-01-15T14:30:00Z"
  }
}
```

## 🔧 Configuration

### Rate Limits

Each provider has configurable rate limits:

```typescript
// SportMonks (example plan)
rateLimitRequests: 60;
rateLimitWindowMs: 60000;

// API-Football
rateLimitRequests: 10;
rateLimitWindowMs: 60000;

// TheSportsDB
rateLimitRequests: 30;
rateLimitWindowMs: 60000;
```

### Adding Custom Providers

Create a new provider class:

```typescript
// lib/api-providers/custom-provider.ts
import { BaseAPIProvider } from "./base-provider";

export class CustomProvider extends BaseAPIProvider {
  constructor(apiKey: string) {
    super({
      name: "custom-provider",
      apiKey,
      apiUrl: "https://api.custom.com",
      rateLimitRequests: 20,
      rateLimitWindowMs: 60000,
    });
  }

  async getLiveMatches(filters, pagination) {
    // Implementation
  }

  // Implement other required methods...
}
```

Register it in the manager:

```typescript
// In route.ts or initialization file
import { CustomProvider } from "@/lib/api-providers/custom-provider";

const customProvider = new CustomProvider(process.env.CUSTOM_API_KEY!);
apiProviderManager.addProvider(customProvider, true); // true = primary
```

## 📈 Performance Optimization

### Caching Strategy

1. **Database Caching**

   - Live matches: 30 seconds
   - Scheduled matches: 5 minutes
   - Finished matches: 1 hour

2. **API Request Optimization**

   - Use `source=database` for non-critical requests
   - Use `source=api` only for searches or fresh data
   - Implement client-side caching (React Query, SWR)

3. **Pagination Best Practices**
   - Default to 20 items per page
   - Maximum 100 items per page
   - Use infinite scroll for better UX

### Redis Caching (Production)

For production, use Redis-based rate limiting:

```typescript
import { RedisRateLimiter } from "@/lib/rate-limiter";
import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });
const rateLimiter = new RedisRateLimiter(redis, {
  provider: "api-football",
  maxRequests: 10,
  windowMs: 60000,
});
```

## 🐛 Troubleshooting

### Issue: Rate limit exceeded

**Solution:**

- Check rate limit status: `POST /api/livescores/matches {"action": "status"}`
- Wait for rate limit reset
- Upgrade API plan
- Switch to database source

### Issue: No matches returned

**Solution:**

- Verify API keys in `.env`
- Check provider health status
- Test API directly with curl
- Check date filters (may be filtering out all matches)

### Issue: Search not working

**Solution:**

- Ensure `source=api` is set when searching
- Check API provider supports search
- Verify search query is encoded properly
- Check API rate limits

### Issue: Slow responses

**Solution:**

- Use `source=database` for cached data
- Reduce page size (`limit=10`)
- Implement client-side caching
- Add Redis for distributed caching

## 📚 Documentation

- [Full API Guide](./LIVESCORE_API_GUIDE.md)
- [API-Football Docs](https://www.api-football.com/documentation-v3)
- [TheSportsDB Docs](https://www.thesportsdb.com/api.php)
- [SportMonks Football Docs](https://docs.sportmonks.com/football/)

## 🎉 Next Steps

1. **Add more providers:**

   - Sportradar
   - Odds API
   - Custom scrapers

2. **Enhance caching:**

   - Redis integration
   - Service worker caching
   - GraphQL with automatic caching

3. **Improve UI:**

   - Virtual scrolling for large lists
   - Real-time updates via WebSockets
   - Match detail modals
   - Favorite teams/leagues

4. **Analytics:**

   - Track search queries
   - Monitor API usage
   - User engagement metrics

5. **Testing:**
   - Unit tests for providers
   - Integration tests for routes
   - E2E tests for search functionality

## 📝 License

This implementation is part of the Score Fusion project.
