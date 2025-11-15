# Live Score API Integration Guide

This guide explains how to integrate external live score APIs with rate limiting, search, and pagination.

## Features

✅ **Multiple API Provider Support**

- SportMonks Football (high-fidelity fixtures, livescores, detailed stats)
- API-Football (comprehensive football/soccer data)
- TheSportsDB (multi-sport free tier)
- Easy to add more providers

✅ **Rate Limiting**

- Per-provider rate limiting with token bucket algorithm
- Automatic rate limit tracking and backoff
- Redis support for distributed rate limiting

✅ **Search & Filtering**

- Search by team name, league, or general query
- Filter by sport, status, date range
- Advanced filtering options

✅ **Pagination**

- Standard pagination with page/limit
- Total count and hasMore indicators
- Configurable page sizes (max 100)

✅ **Fallback Support**

- Automatic fallback to secondary providers
- Health check monitoring
- Graceful degradation

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```bash
# API-Football (RapidAPI)
# Get your key from: https://rapidapi.com/api-sports/api/api-football
API_FOOTBALL_KEY=your_api_football_key_here

# TheSportsDB (Optional - free tier available)
# Get your key from: https://www.thesportsdb.com/api.php
THESPORTSDB_API_KEY=your_thesportsdb_key_here

# SportMonks Football (Recommended for robust stats & logos)
# Get your key from: https://docs.sportmonks.com/football/
SPORTMONKS_API_KEY=your_sportmonks_api_key_here
SPORTMONKS_API_URL=https://api.sportmonks.com/v3/football

# Redis for production rate limiting (optional)
REDIS_URL=redis://localhost:6379
```

### 2. Install Dependencies

```bash
npm install # or pnpm install
```

### 3. API Provider Setup

The system automatically initializes configured providers on server start. If no API keys are provided, it falls back to TheSportsDB free tier.

## API Endpoints

### GET /api/livescores/matches

Fetch live scores with various options.

**Query Parameters:**

| Parameter  | Type    | Description               | Example                         |
| ---------- | ------- | ------------------------- | ------------------------------- |
| `status`   | enum    | Match status              | `live`, `scheduled`, `finished` |
| `sport`    | string  | Sport name                | `football`, `basketball`        |
| `league`   | string  | League name               | `Premier League`                |
| `team`     | string  | Team name search          | `Manchester`                    |
| `search`   | string  | General search query      | `Arsenal vs Chelsea`            |
| `page`     | number  | Page number (default: 1)  | `1`, `2`, `3`                   |
| `limit`    | number  | Items per page (max: 100) | `20`, `50`                      |
| `dateFrom` | string  | Start date (ISO 8601)     | `2025-01-01`                    |
| `dateTo`   | string  | End date (ISO 8601)       | `2025-01-31`                    |
| `source`   | enum    | Data source               | `api`, `database`, `auto`       |
| `featured` | boolean | Featured matches only     | `true`, `false`                 |

**Examples:**

```bash
# Get live matches
GET /api/livescores/matches?status=live

# Search for a specific team
GET /api/livescores/matches?search=Arsenal&source=api

# Get scheduled matches with pagination
GET /api/livescores/matches?status=scheduled&page=1&limit=20

# Filter by league and date range
GET /api/livescores/matches?league=Premier%20League&dateFrom=2025-01-01&dateTo=2025-01-31

# Get matches from API (force external API call)
GET /api/livescores/matches?source=api&status=live
```

**Response:**

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "12345",
        "sport": {
          "name": "football",
          "displayName": "Football"
        },
        "league": {
          "name": "Premier League",
          "country": "England",
          "logo": "https://..."
        },
        "homeTeam": "Arsenal",
        "awayTeam": "Chelsea",
        "homeTeamLogo": "https://...",
        "awayTeamLogo": "https://...",
        "homeTeamScore": 2,
        "awayTeamScore": 1,
        "status": "live",
        "minute": 67,
        "scheduledAt": "2025-01-15T15:00:00Z",
        "venue": "Emirates Stadium",
        "live": true,
        "canBet": true,
        "recentEvents": [
          {
            "type": "goal",
            "team": "home",
            "minute": 65,
            "player": "Bukayo Saka",
            "description": "Goal by Bukayo Saka"
          }
        ]
      }
    ],
    "filters": {
      "status": "live",
      "sport": "football"
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasMore": true
    },
    "source": "api"
  }
}
```

### POST /api/livescores/matches

Control live score updates and get system status.

**Actions:**

```bash
# Refresh live scores
POST /api/livescores/matches
{
  "action": "refresh"
}

# Start automatic updates
POST /api/livescores/matches
{
  "action": "start"
}

# Stop automatic updates
POST /api/livescores/matches
{
  "action": "stop"
}

# Get provider status and health
POST /api/livescores/matches
{
  "action": "status"
}
```

**Status Response:**

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

## Rate Limits

### API-Football (RapidAPI)

- **Free Tier:** 100 requests/day
- **Basic:** 10 requests/minute
- **Pro:** 30 requests/minute

### TheSportsDB

- **Free:** 30 requests/minute
- **Patreon:** Higher limits available

The system automatically enforces these limits and queues requests when limits are reached.

## Adding Custom Providers

Create a new provider by extending `BaseAPIProvider`:

```typescript
import {
  BaseAPIProvider,
  Match,
  SearchFilters,
  PaginationParams,
  PaginatedResponse,
} from "./base-provider";

export class CustomProvider extends BaseAPIProvider {
  constructor(apiKey: string) {
    super({
      name: "custom-provider",
      apiKey,
      apiUrl: "https://api.custom.com",
      rateLimitRequests: 10,
      rateLimitWindowMs: 60000,
    });
  }

  async getLiveMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    // Implement your logic
  }

  // Implement other required methods...
}
```

Then register it in the manager:

```typescript
import { CustomProvider } from "./custom-provider";

const customProvider = new CustomProvider(process.env.CUSTOM_API_KEY!);
apiProviderManager.addProvider(customProvider);
```

## Frontend Integration

Update your frontend to use search and pagination:

```typescript
// Search for matches
const searchMatches = async (query: string) => {
  const response = await fetch(
    `/api/livescores/matches?search=${encodeURIComponent(
      query
    )}&source=api&page=1&limit=20`
  );
  const data = await response.json();
  return data.data;
};

// Load more (pagination)
const loadMore = async (page: number) => {
  const response = await fetch(
    `/api/livescores/matches?status=live&page=${page}&limit=20`
  );
  const data = await response.json();
  return data.data;
};
```

## Best Practices

1. **Use Database for Frequent Queries**

   - Set `source=database` for cached data
   - Use `source=api` only when fresh data is needed

2. **Implement Caching**

   - Cache API responses for 30-60 seconds
   - Use Redis for distributed caching

3. **Handle Rate Limits**

   - Monitor rate limit info from status endpoint
   - Implement exponential backoff
   - Show user-friendly messages when rate limited

4. **Optimize Pagination**

   - Keep page size reasonable (20-50 items)
   - Use infinite scroll for better UX
   - Implement virtual scrolling for large lists

5. **Error Handling**
   - Always check `success` field in response
   - Provide fallback UI when API fails
   - Log errors for monitoring

## Monitoring

Monitor your API usage:

```bash
# Check provider health
curl -X POST http://localhost:3000/api/livescores/matches \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'
```

## Troubleshooting

**Issue:** Rate limit errors

- **Solution:** Wait for rate limit reset or upgrade API plan

**Issue:** No matches returned

- **Solution:** Check API keys, verify provider health, check date filters

**Issue:** Slow responses

- **Solution:** Use database source, implement caching, reduce page size

**Issue:** TypeScript errors

- **Solution:** Run `pnpm prisma generate` to update Prisma types

## Resources

- [API-Football Documentation](https://www.api-football.com/documentation-v3)
- [TheSportsDB API Docs](https://www.thesportsdb.com/api.php)
- [RapidAPI Hub](https://rapidapi.com/hub)
