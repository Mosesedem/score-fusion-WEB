# Unified Sports Predictions System

## Overview

This document describes the unified prediction system that merges tips and predictions into a single, comprehensive platform for managing sports predictions with VIP access control.

## Architecture

### Database Schema

The system uses the existing `Tip` model (table: `tips`) with enhanced enums and indexes:

#### Enums

- **PredictionStatus**: `draft`, `scheduled`, `published`, `archived`
- **PredictionResult**: `won`, `lost`, `void`, `pending`
- **PredictionType**: `winner`, `over_under`, `both_teams_score`, `correct_score`, `handicap`, `other`
- **OddsSource**: `manual`, `api_auto`

#### Key Fields

- `title`: Prediction title
- `content`: Full analysis (markdown supported)
- `summary`: Short preview text
- `odds`: Betting odds (Decimal)
- `oddsSource`: Manual entry or API automatic
- `sport`: Sport type (e.g., FOOTBALL, BASKETBALL)
- `league`: Competition/league name
- `matchDate`: Scheduled match date/time
- `homeTeamId` / `awayTeamId`: Foreign keys to Team model
- `predictionType`: Type of prediction (winner, over/under, etc.)
- `predictedOutcome`: Predicted result (e.g., "Home Win", "Over 2.5")
- `ticketSnapshots`: Array of URLs to betting ticket images (max 10)
- `isVIP`: Boolean flag for VIP-only content
- `featured`: Boolean flag for featured predictions
- `status`: Publication status (draft/scheduled/published/archived)
- `result`: Final outcome (won/lost/void/pending)
- `publishAt`: Scheduled publication date
- `tags`: Array of string tags
- `viewCount`: Number of views
- `successRate`: Calculated win rate

#### Indexes

- `[status, publishAt]`: Fast filtering by status and date
- `[isVIP, publishAt]`: VIP content queries
- `[featured, publishAt]`: Featured content queries
- `[sport, publishAt]`: Sport-specific queries

### Team Management

Teams are stored in the `teams` table with:

- Integration with TheSportsDB public API for searching and importing teams
- Logo URLs from external API
- Support for multiple sports
- League and country information

## API Endpoints

### Public Endpoints

#### GET `/api/predictions`

Fetch published predictions (free or VIP based on `vip` query param).

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `sport`: Filter by sport (optional)
- `vip`: true/false - VIP predictions require authentication (default: false)
- `featured`: true/false - Filter featured predictions (optional)
- `search`: Search in title, content, summary, tags (optional)
- `tags`: Comma-separated tags (optional)

**Response:**

```json
{
  "success": true,
  "data": {
    "predictions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "hasMore": true,
      "totalPages": 3
    }
  }
}
```

### Admin Endpoints

#### GET `/api/admin/predictions`

Fetch all predictions with detailed information (admin only).

**Query Parameters:**

- `page`, `limit`: Pagination
- `search`: Search query
- `sport`, `status`, `isVIP`, `featured`: Filters
- `sortBy`: createdAt, publishAt, viewCount, successRate (default: createdAt)
- `sortOrder`: asc, desc (default: desc)

#### POST `/api/admin/predictions`

Create a new prediction (admin only).

**Request Body:**

```json
{
  "title": "Manchester United vs Liverpool - Match Winner",
  "content": "Detailed analysis...",
  "summary": "Brief preview",
  "odds": 2.5,
  "oddsSource": "manual",
  "sport": "FOOTBALL",
  "league": "Premier League",
  "matchDate": "2025-11-15T15:00:00Z",
  "homeTeamId": "uuid",
  "awayTeamId": "uuid",
  "predictionType": "winner",
  "predictedOutcome": "Home Win",
  "ticketSnapshots": ["https://..."],
  "isVIP": false,
  "featured": true,
  "status": "published",
  "publishAt": "2025-11-10T10:00:00Z",
  "tags": ["premier-league", "football"]
}
```

#### PUT `/api/admin/predictions?id=<uuid>`

Update an existing prediction (admin only).

#### DELETE `/api/admin/predictions?id=<uuid>`

Delete a prediction (admin only). Cannot delete if bets are placed.

#### GET `/api/admin/teams/search`

Search teams from TheSportsDB API (admin only).

**Query Parameters:**

- `query`: Team name search (min 2 chars)
- `sport`: Filter by sport (default: football)

**Response:**

```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "externalId": "133604",
        "name": "Manchester United",
        "shortName": "Man Utd",
        "logoUrl": "https://...",
        "sport": "Soccer",
        "league": "English Premier League",
        "country": "England",
        "metadata": {...}
      }
    ],
    "count": 20
  }
}
```

#### POST `/api/admin/teams/search`

Create a team from external API data in local database (admin only).

## User Interface

### Admin Pages

#### `/admin/predictions`

Comprehensive prediction management interface with:

- Create/edit/delete predictions
- Team search integration with TheSportsDB
- Ticket snapshot management (up to 10 images)
- Match result settlement (Won/Lost)
- Full form with all prediction fields
- Real-time team search with logo preview
- Sport, league, odds, prediction type configuration

#### `/admin/tips` (Deprecated)

Redirects to `/admin/predictions` for backward compatibility.

### Public Pages

#### `/tips`

User-facing predictions page with:

- Free vs VIP filter tabs
- Featured predictions
- Team logos and match information
- Odds and predicted outcomes
- Ticket snapshot indicators
- Result badges (Won/Lost)
- VIP lock states
- Responsive grid layout

#### `/vip`

VIP area with:

- VIP access gate (subscription or token)
- VIP predictions display
- Subscription plans
- Token redemption
- Premium prediction cards with full details

## Features

### Team Search Integration

Admins can search for teams using TheSportsDB public API:

1. Type team name in search box (min 2 characters)
2. View results with team logos and league info
3. Click "Set Home" or "Set Away" to add team to prediction
4. Team is automatically created in local database with logo

### VIP Access Control

VIP predictions are gated by:

- Active subscription (checked via `/api/vip/status`)
- Valid VIP token (redeemable via `/api/vip/tokens/redeem`)

Guest users cannot access VIP content.

### Ticket Snapshots

Admins can attach up to 10 betting ticket images to predictions:

- Provides social proof and transparency
- Visible to non-VIP users for free predictions
- Hidden behind VIP lock for premium predictions

### Result Settlement

Admins can mark predictions as Won/Lost:

- Updates `result` field
- Displayed with color-coded badges
- Used for calculating success rates

### Publishing Workflow

Predictions support full publishing lifecycle:

1. **Draft**: Work in progress, not visible
2. **Scheduled**: Set future `publishAt` date
3. **Published**: Live and visible to users
4. **Archived**: Historical, not actively displayed

## Migration Notes

### From Old Tips System

The unified system maintains backward compatibility:

- Old `/api/tips` endpoints still work (return `data.tips`)
- New `/api/predictions` returns `data.predictions`
- Admin UI redirects from `/admin/tips` to `/admin/predictions`
- Database table remains `tips` (no migration required)

### Enum Migration

Existing string values are compatible with new enums:

- Old: `status: "published"` → New: `status: PredictionStatus.published`
- Data migration not required; enums use same string values

## Best Practices

### For Admins

1. **Team Selection**: Always use team search to ensure consistent data and logos
2. **Ticket Snapshots**: Upload clear, readable betting ticket images
3. **VIP Content**: Set appropriate `isVIP` flag based on prediction quality
4. **Settlement**: Mark results promptly after matches complete
5. **Tags**: Use consistent tags for better filtering (e.g., "premier-league", "champions-league")

### For Developers

1. **API Calls**: Always handle pagination in responses
2. **VIP Check**: Verify VIP access before displaying sensitive content
3. **Error Handling**: Handle 401/403 errors for VIP endpoints
4. **Caching**: Public predictions are cached for 5 minutes
5. **Images**: Use `eslint-disable @next/next/no-img-element` for external team logos

## External APIs

### TheSportsDB

- **Base URL**: `https://www.thesportsdb.com/api/v1/json/3/`
- **Endpoint**: `searchteams.php?t={team_name}`
- **Rate Limit**: 2 requests/second (free tier)
- **No API Key**: Required for basic search

## Security

- All admin endpoints require `role: ADMIN`
- VIP endpoints require active subscription or valid token
- Guest users have limited access (10 predictions max)
- Admin actions are logged in `admin_audit_logs`

## Performance

- Indexes on frequently queried fields (status, isVIP, featured, sport)
- Redis caching for public predictions (5-minute TTL)
- Pagination for all list endpoints
- Optimized queries with Prisma includes

## Future Enhancements

- [ ] Automated odds fetching from odds API
- [ ] Push notifications for new predictions
- [ ] User prediction tracking and stats
- [ ] Social sharing of predictions
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Prediction performance reports

## Support

For issues or questions, refer to:

- API documentation: Check route files in `app/api/`
- Prisma schema: `prisma/schema.prisma`
- UI components: `app/admin/predictions/page.tsx`, `app/tips/page.tsx`
