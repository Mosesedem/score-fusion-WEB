# Authentication System Migration Summary

## Problem Identified

The application had **two parallel authentication systems** running simultaneously:

1. **NextAuth.js** (`app/api/auth/[...nextauth]/route.ts`) - Used by the frontend

   - Login page uses `signIn()` from next-auth/react
   - Signup creates user then calls `signIn()`
   - Guest login calls `signIn()` with mode="guest"
   - Session managed via NextAuth JWT strategy

2. **Custom JWT Auth** (`lib/auth.ts`) - Used by most API routes
   - Has own JWT token generation
   - Uses Redis session store
   - Has `getAuthenticatedUser()` function that checks Authorization header

### The Core Issue

Users were logging in via NextAuth (creating NextAuth sessions), but most API routes were checking for custom JWT tokens in Authorization headers, causing authentication to fail even though users were logged in.

## Solution Implemented

### 1. Session Management Centralization (`lib/session.ts`)

We already had a unified session utility that wraps NextAuth:

```typescript
// ✅ Use this everywhere
import { getCurrentSession } from "@/lib/session";

const session = await getCurrentSession();
if (!session || !session.user) {
  // Not authenticated
}
```

### 2. Routes Migrated to NextAuth

#### ✅ **Completed Migrations:**

1. **VIP Status Route** (`app/api/vip/status/route.ts`)

   - Now uses `getCurrentSession()` instead of `getAuthenticatedUser(request)`
   - Properly checks for NextAuth session
   - Returns hasAccess based on subscription or tokens

2. **VIP Access Route** (`app/api/vip/access/route.ts`)

   - Updated to use NextAuth sessions
   - Checks for subscriptions and tokens correctly
   - Returns detailed access information

3. **VIP Token Redeem Route** (`app/api/vip/tokens/redeem/route.ts`)

   - Both GET and POST methods migrated
   - Token redemption now works with authenticated users
   - Entitlements check updated

4. **Tips Route** (`app/api/tips/route.ts`)

   - VIP access checks updated
   - Guest user limiting works correctly
   - Analytics tracking updated

5. **Predictions Route** (`app/api/predictions/route.ts`)
   - VIP content access fixed
   - Guest limitations applied
   - Analytics tracking corrected

#### ⏳ **Routes Still Using Old Auth System:**

The following routes still import from `lib/auth.ts` and need migration:

- `app/api/admin/analytics/route.ts` - Uses `requireAdmin` from old system
- `app/api/admin/config/route.ts` - Needs review
- `app/api/auth/logout/route.ts` - Should be removed (NextAuth handles this)
- `app/api/auth/me/route.ts` - Needs update to use getCurrentSession
- `app/api/bets/route.ts` - Needs migration
- `app/api/earnings/route.ts` - Needs migration
- `app/api/pay/checkout/route.ts` - Needs migration
- `app/api/predictions/[id]/route.ts` - Needs migration
- `app/api/realtime/subscribe/route.ts` - Needs migration
- `app/api/referral/route.ts` - Needs migration
- `app/api/tips/[id]/route.ts` - Needs migration
- `app/api/wallet/convert/route.ts` - Needs migration
- `app/api/wallet/withdraw/route.ts` - Needs migration

### 3. Admin Routes

Admin routes correctly use `requireAdmin()` from `lib/session.ts`:

```typescript
// ✅ Already correct pattern
import { requireAdmin } from "@/lib/session";

const { error, session } = await requireAdmin();
if (error || !session) {
  return error;
}
```

Files using correct admin auth:

- `app/api/admin/tokens/route.ts` ✅
- `app/api/admin/tokens/[id]/route.ts` ✅
- `app/api/admin/tokens/list/route.ts` ✅
- `app/api/admin/tips/route.ts` ✅
- `app/api/admin/teams/route.ts` ✅

## Migration Pattern

### Before (Old Auth):

```typescript
import { getAuthenticatedUser } from "@/lib/auth";

const auth = await getAuthenticatedUser(request);
if (!auth.user) {
  return error response
}
if (auth.user.guest) {
  // handle guest
}
// use auth.user.id
```

### After (NextAuth):

```typescript
import { getCurrentSession } from "@/lib/session";

const session = await getCurrentSession();
if (!session || !session.user) {
  return error response
}
if (session.user.guest) {
  // handle guest
}
// use session.user.id
```

## What Needs To Happen Next

### 1. Complete Remaining Migrations

Each of the remaining 13 routes needs to be updated to use `getCurrentSession()`.

### 2. Remove Old Auth Routes

These custom auth routes are no longer needed since NextAuth handles everything:

- `app/api/auth/login/route.ts` - DELETE (NextAuth handles)
- `app/api/auth/signup/route.ts` - KEEP but modify (needs to create user for NextAuth)
- `app/api/auth/guest/route.ts` - DELETE (NextAuth handles)
- `app/api/auth/logout/route.ts` - DELETE (NextAuth handles)

### 3. Update Frontend

The frontend (`contexts/auth-context.tsx`) already uses NextAuth correctly via:

- `useSession()` hook
- `signIn()` for login
- `signOut()` for logout

✅ Frontend is already correct!

### 4. Testing Checklist

After completing migrations:

- [ ] Login with regular user account
- [ ] Login as guest user
- [ ] Check VIP status as authenticated user ✅
- [ ] Access VIP tips with subscription
- [ ] Access VIP tips with token
- [ ] Redeem VIP token ✅
- [ ] View public tips ✅
- [ ] View VIP tips (authenticated) ✅
- [ ] View predictions ✅
- [ ] Make bet (needs migration)
- [ ] Wallet operations (needs migration)
- [ ] Admin operations ✅
- [ ] Referral system (needs migration)
- [ ] Real-time features (needs migration)

## Key Files

### Session Management

- `lib/session.ts` - ✅ Unified NextAuth wrapper (USE THIS)
- `lib/auth.ts` - ❌ Old custom JWT system (BEING PHASED OUT)

### Auth Configuration

- `app/api/auth/[...nextauth]/route.ts` - NextAuth configuration ✅
- `contexts/auth-context.tsx` - Frontend auth context ✅

### Environment Variables Required

```env
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

## Benefits of This Migration

1. **Single Source of Truth** - All auth goes through NextAuth
2. **Better Security** - NextAuth is battle-tested and maintained
3. **Simpler Code** - One auth system instead of two
4. **Better DX** - Frontend and backend use same session
5. **Standards Compliant** - Uses standard Next.js patterns

## Notes

- The old `lib/auth.ts` can be kept temporarily for reference but should not be imported by new code
- Redis session store from old system can be removed once migration is complete
- Guest users are handled by NextAuth by creating temporary user records with `guest: true`
