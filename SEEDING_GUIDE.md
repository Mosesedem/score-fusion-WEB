# Database Seeding Guide

## Overview
This guide explains how to seed your database with realistic prediction data for testing and development.

## What Gets Seeded

### Users
- **Admin User**
  - Email: `admin@scorefusion.com`
  - Password: `admin123`
  - Role: ADMIN
  
- **VIP Test User**
  - Email: `vip@test.com`
  - Password: `vip123`
  - Role: USER
  - Has active VIP subscription (30 days)

### Sports
- Football (Premier League focus)
- Basketball
- Tennis

### Teams
6 Premier League teams with logos:
- Manchester City
- Arsenal
- Liverpool
- Chelsea
- Manchester United
- Tottenham Hotspur

### Predictions

#### Current Free Tips (2)
1. **Manchester City vs Arsenal** - Home Win
   - Match in 2 days
   - Featured prediction
   - Odds: 1.75
   - Status: Published, Pending

2. **Liverpool vs Chelsea** - Over 2.5 Goals
   - Match in 3 days
   - Odds: 1.65
   - Status: Published, Pending

#### Current VIP Tips (1)
1. **Manchester United vs Tottenham** - Correct Score 2-1
   - Match in 4 days
   - Featured VIP prediction
   - High odds: 9.00
   - Includes ticket snapshot
   - Status: Published, Pending

#### Current VIP Updates (1)
1. **🚨 Chelsea vs Arsenal - Draw Alert**
   - Match in 1 day
   - Breaking news update
   - Odds: 3.50
   - Status: Published, Pending

#### Historical Free Tips (3)
1. **Arsenal vs Liverpool** - Home Win ✅
   - Completed 5 days ago
   - Result: WON
   
2. **Manchester City vs Chelsea** - Over 2.5 Goals ✅
   - Completed 7 days ago
   - Result: WON
   
3. **Tottenham vs Manchester United** - Away Win ❌
   - Completed 10 days ago
   - Result: LOST

#### Historical VIP Tips (2)
1. **Liverpool vs Arsenal** - Correct Score 3-1 ✅
   - Completed 12 days ago
   - High odds: 8.50
   - Result: WON
   - Includes winning ticket snapshot

2. **🚨 Chelsea vs Tottenham - Draw Alert ✅**
   - Completed 15 days ago
   - VIP Update
   - Result: WON

## How to Seed

### Prerequisites
Make sure you have:
- PostgreSQL database running
- `.env` file configured with `DATABASE_URL`
- Prisma migrations applied

### Step 1: Apply Migrations (if needed)
```bash
npm run db:push
# or
npm run db:migrate
```

### Step 2: Run Seed Script
```bash
npm run db:seed
```

### Expected Output
```
🌱 Starting database seed...
Creating sports...
Creating admin user...
Creating test VIP user...
Creating VIP subscription...
Creating teams...
Creating current free predictions...
Creating current VIP predictions...
Creating VIP updates...
Creating historical predictions...
✅ Database seeded successfully!

📊 Summary:
- Sports created: 3 (Football, Basketball, Tennis)
- Teams created: 6 Premier League teams
- Admin user: admin@scorefusion.com (password: admin123)
- VIP user: vip@test.com (password: vip123)
- Current free tips: 2
- Current VIP tips: 1
- Current VIP updates: 1
- Historical free tips: 3
- Historical VIP tips: 2

🎯 You can now test the application with realistic data!
```

## Testing After Seeding

### 1. Test as Guest User
- Visit `/tips` - Should see 2 current free predictions
- Click "History" tab - Should see 3 completed predictions
- Try to access VIP content - Should be blocked

### 2. Test as VIP User
- Login with `vip@test.com` / `vip123`
- Visit `/vip` - Should see:
  - 1 current VIP prediction
  - 1 current VIP update
  - 2 historical VIP predictions in history section
- Visit `/tips` - Should see all free predictions

### 3. Test as Admin
- Login with `admin@scorefusion.com` / `admin123`
- Visit `/admin/predictions` - Should see all 9 predictions
- Test filters:
  - Status: Published (all)
  - Result: Pending (4), Won (4), Lost (1)
  - Category: Tips (7), Updates (2)
- Test settling results:
  - Click "Won" or "Lost" on pending predictions
  - Verify they move to history

### 4. Test History Display
- **Current Predictions:**
  - Match date is in the future
  - Result is "pending"
  - Shows in "Current" tab

- **History:**
  - Match date is past (2+ hours ago)
  - OR Result is won/lost/void
  - Shows in "History" tab

## Re-seeding

### Clear and Re-seed
If you want to start fresh:

```bash
# Option 1: Reset database (WARNING: Deletes ALL data)
npm run db:push -- --force-reset

# Then re-seed
npm run db:seed
```

### Upsert Behavior
The seed script uses `upsert` for most data, so running it multiple times:
- ✅ Won't create duplicate sports/teams
- ✅ Won't create duplicate users (by email)
- ⚠️ Will create duplicate predictions (new IDs each time)

To avoid duplicate predictions, reset the database first.

## Customizing Seed Data

Edit `/prisma/seed.ts` to:
- Add more teams
- Create different predictions
- Adjust match dates
- Change odds and confidence levels
- Add more sports

## Troubleshooting

### Error: "Unique constraint failed"
- User with that email already exists
- Run with `--force-reset` or use different emails

### Error: "Foreign key constraint failed"
- Make sure migrations are applied: `npm run db:push`
- Check that sports are created before teams

### No data showing in app
- Check that predictions have `status: "published"`
- Verify `publishAt` date is in the past
- Check `matchDate` is set correctly

### VIP predictions not showing
- Make sure you're logged in as VIP user
- Check subscription is active (30 days from seed)
- Verify `isVIP: true` on predictions

## Production Warning

⚠️ **DO NOT run seed script in production!**

This script is for development and testing only. It:
- Creates test users with known passwords
- Uses example data
- May conflict with real user data

For production, create predictions through the admin interface.

## Next Steps

After seeding:
1. Read the [Admin How-To Guide](/admin/how-to)
2. Create your own predictions
3. Test the full workflow
4. Settle results after matches
5. Monitor history display

## Support

If you encounter issues:
1. Check database connection
2. Verify Prisma schema is up to date
3. Review seed script logs
4. Check `.env` configuration
