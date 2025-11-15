# VIP Access Debugging Guide

## Summary

Added comprehensive console logging throughout the VIP access checking flow to diagnose why "VIP Access Required" is still showing for subscription users.

## Files Updated with Logging

### 1. `/app/api/vip/status/route.ts` (Backend API)

**Logs Added:**

- ✅ Auth check results (user ID, email, guest status)
- ✅ Active subscription query results
- ✅ VIP token query results (with details on each token)
- ✅ Final access decision with reasoning
- ✅ Complete response structure being sent

### 2. `/app/vip/page.tsx` (Frontend Page)

**Logs Added:**

- ✅ Component render state (hasVIPAccess, loading, user)
- ✅ API call initiation and response
- ✅ Parsed data from API response
- ✅ State changes (hasVIPAccess value)
- ✅ Which UI section is being rendered (Loading/Access Denied/VIP Content)

### 3. `/contexts/auth-context.tsx` (Auth Provider)

**Logs Added:**

- ✅ Session status and user computation
- ✅ Final computed user object

## How to Debug

### Step 1: Open Browser Console

1. Open your browser's Developer Tools (F12 or Cmd+Option+I)
2. Go to the Console tab
3. Clear the console (Ctrl+L or Cmd+K)

### Step 2: Navigate to VIP Page

Visit: `/vip`

### Step 3: Review Console Logs

You should see a sequence like this:

```
🔐 [Auth Context] Computing user from session: {...}
🔐 [Auth Context] Computed user: {...}
🎨 [VIP Page] RENDER - State: {...}
🔄 [VIP Page] User effect triggered. User: {...}
🔍 [VIP Page] Starting VIP access check...
🔍 [VIP Page] Calling /vip/status endpoint...
```

Then on the server (check terminal/logs):

```
=== VIP STATUS CHECK START ===
Auth result: {...}
Checking VIP access for user: xxx
Active subscription query result: {...}
VIP tokens query result: {...}
Valid token after filter: {...}
=== FINAL VIP ACCESS DECISION === {...}
Response being sent: {...}
=== VIP STATUS CHECK END ===
```

Back in browser:

```
🔍 [VIP Page] API Response: {...}
🔍 [VIP Page] Parsed data: {...}
🔍 [VIP Page] hasAccess value: true/false
✅ [VIP Page] VIP ACCESS GRANTED!  or  ❌ [VIP Page] VIP ACCESS DENIED
```

### Step 4: Check Database Directly

Run the helper script:

```bash
# Check specific user by email
npx tsx scripts/check-vip-status.ts user@example.com

# Or check most recent non-guest user
npx tsx scripts/check-vip-status.ts
```

This will show you:

- User details
- All subscriptions (active or not)
- All tokens (valid or not)
- Final VIP status determination

## Common Issues to Look For

### Issue 1: API Response Structure Mismatch

**Look for:**

```
🔍 [VIP Page] hasData: false
🔍 [VIP Page] dataKeys: []
```

**Problem:** API response doesn't have `data` property
**Fix:** Check if API is returning `{ success, data: { hasAccess } }` format

### Issue 2: Subscription Not Active

**Look for:**

```
Active subscription query result: { found: false }
```

**Problem:** No active subscription in database
**Check:**

- Is subscription status "active"?
- Is currentPeriodEnd in the future?
- Run the database check script

### Issue 3: Token Invalid

**Look for:**

```
VIP tokens query result: { totalTokens: 1, tokens: [{ isValid: false }] }
```

**Problem:** Token exists but used >= quantity or expired
**Check:**

- Token expiration date
- used vs quantity values

### Issue 4: User Not Authenticated

**Look for:**

```
🔐 [Auth Context] No authenticated user
Auth result: { hasUser: false }
```

**Problem:** User not logged in or session expired
**Fix:** User needs to log in again

### Issue 5: State Update Not Triggering Render

**Look for:**

```
🔍 [VIP Page] hasAccess value: true
...but still seeing...
🚫 [VIP Page] Rendering ACCESS DENIED state
```

**Problem:** State update race condition or useCallback dependency issue
**Check:** The dependency array in useCallback

## Quick Tests

### Test 1: Create a Test Subscription

```sql
-- Connect to your database and run:
INSERT INTO subscriptions (id, "userId", "stripeSubscriptionId", "stripeCustomerId", plan, status, "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'YOUR_USER_ID_HERE',
  'test_sub_' || gen_random_uuid(),
  'test_cus_' || gen_random_uuid(),
  'monthly',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
);
```

### Test 2: Create a Test Token

```sql
-- Connect to your database and run:
INSERT INTO vip_tokens (id, token, "userId", type, quantity, used, "expiresAt", "createdAt")
VALUES (
  gen_random_uuid(),
  'TEST-' || upper(substr(md5(random()::text), 1, 8)),
  'YOUR_USER_ID_HERE',
  'general',
  10,
  0,
  NOW() + INTERVAL '30 days',
  NOW()
);
```

## Next Steps

1. **Check Console Logs** - Look for the emoji-prefixed logs in browser and server
2. **Run Database Script** - Verify what's actually in the database
3. **Compare Values** - Ensure API response matches what frontend expects
4. **Look for Errors** - Check if any exceptions are being caught and suppressed

## Report Back

Please provide:

1. Complete console log output from browser
2. Complete server log output (terminal)
3. Output from `check-vip-status.ts` script
4. Your user's email address (so we can check that specific user)

This will help identify exactly where the flow is breaking!
