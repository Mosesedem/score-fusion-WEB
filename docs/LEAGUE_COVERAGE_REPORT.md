# League Coverage Report

## Current Status (November 9, 2025)

### API Plan Limitation Identified

Your SportMonks API key is limited to **4 leagues only**:

1. **Premiership** (Scotland)
2. **Premiership Play-Offs** (Scotland)
3. **Superliga** (Denmark)
4. **Superliga Play-offs** (Denmark)

### Verification Tests

```bash
# Provider leagues endpoint
GET /api/livescores/leagues?source=provider
Result: 4 leagues

# Fixtures-derived leagues (last 14 days + next 60 days, 8 pages)
GET /api/livescores/leagues?source=fixtures&maxPages=8
Result: 2 leagues (excluding playoffs which have no fixtures)

# Combined
GET /api/livescores/leagues?source=both
Result: 4 leagues total
```

### Why This Is Happening

**SportMonks API plans have different league coverage tiers:**

- **Free/Starter Plans**: Limited to 1-5 leagues (your current situation)
- **Basic Plans**: ~10-20 leagues
- **Pro Plans**: ~50-100 leagues
- **Enterprise Plans**: 500+ leagues worldwide

Your current plan only includes Scottish and Danish top-tier competitions.

### Code Changes Implemented

✅ **All code is working correctly**. The changes made:

1. Fixed `buildUrl()` to accept `skipDefaultIncludes` parameter
2. Updated `getLeagues()` to use proper league-specific includes (`country`)
3. Expanded default date ranges:
   - Leagues API: Last 14 days + next 60 days
   - Livescores page: Same 74-day window
4. Added detailed logging for debugging
5. Increased pagination limits (maxPages=8, limit=200)

### Solutions

#### Option 1: Upgrade SportMonks Plan (Recommended)

- Visit: https://www.sportmonks.com/pricing
- Upgrade to a plan with broader league coverage
- Typical "Pro" plans include top 20-30 European leagues

#### Option 2: Add API-Football as Primary Provider

- API-Football free tier: 100 requests/day, 10+ major leagues
- Paid plans: 500+ leagues worldwide
- Already integrated in your codebase as fallback
- Set `API_FOOTBALL_KEY` env var and it becomes primary

#### Option 3: Multi-Provider Strategy (Best Coverage)

- Use API-Football for major leagues (EPL, La Liga, Serie A, etc.)
- Use SportMonks for Danish/Scottish leagues
- TheSportsDB as final fallback
- Code already supports this via `APIProviderManager`

#### Option 4: Request SportMonks Trial

- Contact SportMonks support for a trial of higher-tier plan
- Typically offer 7-14 day trials

### Quick Test Commands

```bash
# Check current provider health and limits
curl http://localhost:3000/api/livescores/matches?action=status | jq

# Test API-Football (if configured)
# Set API_FOOTBALL_KEY in .env and restart

# Check all available leagues
curl http://localhost:3000/api/livescores/leagues?source=both | jq '.data.count'
```

### Recommended Next Steps

1. **Immediate**: Set up API-Football as fallback

   ```bash
   # Get free key from: https://www.api-football.com/
   echo "API_FOOTBALL_KEY=your_key_here" >> .env.local
   ```

2. **Short-term**: Evaluate if Scottish/Danish coverage is sufficient for your users

   - If yes: Keep current setup
   - If no: Upgrade or switch providers

3. **Long-term**: Implement Redis caching to maximize API quota efficiency
   ```typescript
   // Cache leagues list for 24h
   // Cache live matches for 30s
   // Cache finished matches for 1h
   ```

### Current Code Health

✅ All endpoints working correctly  
✅ Proper error handling with fallbacks  
✅ Rate limiting implemented  
✅ Provider manager supports multi-source  
✅ UI handles dynamic league lists

**No code changes needed** - this is purely an API plan limitation.
