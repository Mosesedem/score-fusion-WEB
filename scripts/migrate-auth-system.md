# Auth System Migration Progress

## Problem

The application has two parallel authentication systems:

1. **NextAuth.js** - Used by frontend (login page, signup, guest login)
2. **Custom JWT Auth** (lib/auth.ts) - Used by most API routes

Users authenticate via NextAuth, but API routes check for custom JWT tokens, causing authentication failures.

## Solution

Migrate all API routes to use NextAuth session management from `lib/session.ts`.

## Migration Guide

### Changes Required:

1. Replace `import { getAuthenticatedUser } from "@/lib/auth"` with `import { getCurrentSession } from "@/lib/session"`
2. Replace `const auth = await getAuthenticatedUser(request)` with `const session = await getCurrentSession()`
3. Replace `auth.user` with `session?.user`
4. Update null/error checks to use `!session || !session.user`
5. For admin routes using `requireAdmin` from lib/auth, use the one from `lib/session.ts` instead

## Files Migrated:

- ✅ /app/api/vip/status/route.ts
- ✅ /app/api/vip/access/route.ts
- ✅ /app/api/vip/tokens/redeem/route.ts

## Files Remaining:

- ⏳ app/api/admin/analytics/route.ts
- ⏳ app/api/admin/config/route.ts
- ⏳ app/api/auth/logout/route.ts
- ⏳ app/api/auth/me/route.ts
- ⏳ app/api/bets/route.ts
- ⏳ app/api/earnings/route.ts
- ⏳ app/api/pay/checkout/route.ts
- ⏳ app/api/predictions/[id]/route.ts
- ⏳ app/api/predictions/route.ts
- ⏳ app/api/realtime/subscribe/route.ts
- ⏳ app/api/referral/route.ts
- ⏳ app/api/tips/[id]/route.ts
- ⏳ app/api/tips/route.ts
- ⏳ app/api/wallet/convert/route.ts
- ⏳ app/api/wallet/withdraw/route.ts

## Testing Checklist:

- [ ] Login with regular user account
- [ ] Login as guest
- [ ] Check VIP status as authenticated user
- [ ] Access VIP content with subscription
- [ ] Access VIP content with token
- [ ] Create/view tips
- [ ] Create/view predictions
- [ ] Wallet operations
- [ ] Admin operations
