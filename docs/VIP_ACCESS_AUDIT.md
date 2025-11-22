# VIP Access Control - Complete Audit & Implementation Guide

## 📋 Overview

This document provides a comprehensive audit of VIP/subscription checking across the Score Fusion application and recommendations for standardization.

## ✅ How VIP Access Currently Works

### Access Methods (In Priority Order)

Users can access VIP content through **2 methods**, checked in this order:

1. **Active Subscription** (Stripe-based)

   - Status must be "active"
   - `currentPeriodEnd` must be in the future
   - Checked in `subscriptions` table

2. **VIP Tokens** (Promotional/One-time access)
   - Token must not be expired (`expiresAt >= now`)
   - Token must have remaining uses (`used < quantity`)
   - Can be:
     - **General tokens**: Grant access to ALL VIP content
     - **Specific tokens**: Grant access to ONE specific tip only

### Database Schema

```prisma
model Subscription {
  id                   String    @id @default(uuid())
  userId               String
  stripeSubscriptionId String    @unique
  stripeCustomerId     String
  plan                 String    // monthly, yearly, trial
  status               String    // active, past_due, canceled, incomplete
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime  // ⚠️ KEY: Must be >= now()
  trialEnd             DateTime?
  cancelAtPeriodEnd    Boolean   @default(false)
  // ...
}

model VIPToken {
  id        String    @id @default(uuid())
  token     String    @unique @db.VarChar(7) // short 6-7 char PIN
  userId    String?   // null = unassigned, assigned on redemption
  tipId     String?   // null = general access, specific = one tip
  type      String    @default("general") // general, single, bundle
  quantity  Int       @default(1)  // Total allowed uses
  used      Int       @default(0)  // Current usage count
  expiresAt DateTime  // ⚠️ KEY: Must be >= now()
  // ...
}
```

---

## 📍 Current Implementation Locations

### ✅ **Centralized Library (NEW)**

**`/lib/vip-access.ts`** - Created standardized utility functions:

```typescript
// Simple boolean checks
await hasVIPAccess(userId); // true/false
await hasTipAccess(userId, tipId); // true/false

// Detailed checks with access type info
await checkVIPAccess(userId); // Returns access details
await checkTipAccess(userId, tipId); // Returns access details

// Get all entitlements
await getVIPEntitlements(userId); // All subscriptions + tokens

// Increment token usage
await useVIPToken(tokenId); // Mark token as used
```

### ✅ **API Routes with VIP Checks**

#### 1. **`/api/vip/status` (GET)**

- **Purpose**: Official VIP status endpoint
- **Returns**: `hasAccess`, `subscription`, `tokenAccess`
- **Implementation**: ✅ Correct
- **Logic**:

  ```typescript
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
      currentPeriodEnd: { gte: new Date() },
    },
  });

  const validToken = await prisma.vIPToken.findFirst({
    where: {
      userId,
      expiresAt: { gte: new Date() },
      OR: [{ used: 0 }, { used: { lt: prisma.vIPToken.fields.quantity } }],
    },
  });

  const hasAccess = !!(activeSubscription || validToken);
  ```

#### 2. **`/api/predictions` (GET)**

- **Purpose**: List VIP predictions (requires `?vip=true`)
- **VIP Check**: ✅ Implemented
- **Logic**:
  - Requires authentication
  - Blocks guest users
  - Calls `checkVipAccess(userId)`
  - Returns 403 if no access

#### 3. **`/api/predictions/[id]` (GET)**

- **Purpose**: Single prediction details
- **VIP Check**: ✅ Implemented
- **Special Handling**:
  - Returns limited preview for non-VIP users
  - Hides `content` and `ticketSnapshots`
  - Shows "🔒 VIP content - Upgrade to unlock" message
- **Logic**: Calls `checkVipAccess(userId, tipId)` for tip-specific tokens

#### 4. **`/api/tips` (GET)**

- **Purpose**: List tips (supports `?vip=true`)
- **VIP Check**: ✅ Implemented
- **Logic**: Same as `/api/predictions`

#### 5. **`/api/tips/[id]` (GET)**

- **Purpose**: Single tip details
- **VIP Check**: ✅ Implemented
- **Logic**: Same as `/api/predictions/[id]`

#### 6. **`/api/vip/tokens/redeem` (POST)**

- **Purpose**: Redeem VIP token codes
- **VIP Check**: N/A (this creates access)
- **Implementation**: ✅ Correct
- **Features**:
  - Rate limited (5 attempts per 5 minutes per IP)
  - Transaction-safe (prevents race conditions)
  - Validates expiry and usage limits
  - Assigns token to user on first redemption

---

## ⚠️ **Issues & Inconsistencies Found**

### 1. **Duplicate `checkVipAccess` Functions**

- **Problem**: Same function duplicated in 4+ files
- **Files**:
  - `/app/api/predictions/route.ts`
  - `/app/api/predictions/[id]/route.ts`
  - `/app/api/tips/route.ts`
  - `/app/api/tips/[id]/route.ts`

**❌ Current State**: Each file has its own copy
**✅ Solution**: Use centralized `/lib/vip-access.ts`

### 2. **Inconsistent Token Query Logic**

Some routes check tokens differently:

**Inconsistency 1**: Some use `OR` clause

```typescript
// In predictions/route.ts
OR: [{ used: 0 }, { used: { lt: prisma.vIPToken.fields.quantity } }];
```

**Inconsistency 2**: Some check only `used < quantity`

```typescript
// In predictions/[id]/route.ts
used: {
  lt: prisma.vIPToken.fields.quantity;
}
```

**✅ Correct Logic**: `used < quantity` is sufficient (covers both cases)

### 3. **Missing Token Type Filter**

Some routes don't filter by token type:

**❌ Problem**: May incorrectly grant access with specific-tip tokens

```typescript
// Missing type filter - could match specific tokens!
const validToken = await prisma.vIPToken.findFirst({
  where: {
    userId,
    expiresAt: { gte: new Date() },
    // ❌ Missing: type: "general"
  },
});
```

**✅ Solution**: Always specify token type

```typescript
// For general VIP access checks
where: {
  userId,
  type: "general", // ✅ Explicitly check general tokens
  expiresAt: { gte: new Date() },
  used: { lt: prisma.vIPToken.fields.quantity },
}

// For specific tip access
where: {
  userId,
  tipId, // ✅ Check specific tip tokens
  expiresAt: { gte: new Date() },
  used: { lt: prisma.vIPToken.fields.quantity },
}
```

### 4. **Frontend VIP Checks**

Frontend pages check VIP status but don't always validate properly:

**Files Checking VIP Status**:

- `/app/vip/page.tsx` - ✅ Calls `/api/vip/status`
- `/app/history/page.tsx` - ✅ Fetches with `?vip=true`
- `/app/dashboard/page.tsx` - ✅ Calls `/api/vip/status`
- `/app/tips/page.tsx` - Shows VIP badge but doesn't block content
- `/app/page.tsx` (Landing) - Public, no VIP checks

**⚠️ Note**: Frontend checks are for UX only. Backend API routes enforce actual access control.

---

## 🔧 Recommended Actions

### Priority 1: Refactor to Use Centralized Library

**Replace all duplicate functions with library imports:**

```typescript
// ❌ OLD: Each file has its own function
async function checkVipAccess(userId: string): Promise<boolean> {
  // ... duplicate code
}

// ✅ NEW: Import from centralized library
import { hasVIPAccess } from "@/lib/vip-access";

// Usage
const hasAccess = await hasVIPAccess(userId);
```

**Files to Update**:

1. `/app/api/predictions/route.ts`
2. `/app/api/predictions/[id]/route.ts`
3. `/app/api/tips/route.ts`
4. `/app/api/tips/[id]/route.ts`
5. `/app/api/vip/status/route.ts` (optional, already correct)

### Priority 2: Add Token Type Filtering

**Update token queries to specify type:**

```typescript
// For general VIP content access
const validToken = await prisma.vIPToken.findFirst({
  where: {
    userId,
    type: "general", // ✅ ADD THIS
    expiresAt: { gte: new Date() },
    used: { lt: prisma.vIPToken.fields.quantity },
  },
});
```

### Priority 3: Implement Token Usage Tracking

**When VIP content is accessed via token, increment usage:**

```typescript
import { checkTipAccess, useVIPToken } from "@/lib/vip-access";

const access = await checkTipAccess(userId, tipId);

if (access.hasAccess && access.accessType === "specific_token") {
  // Increment token usage
  await useVIPToken(access.token!.id);
}
```

---

## 📊 Access Control Flow Diagram

```
User Requests VIP Content
         |
         v
  Is User Authenticated?
    NO → Return 401 Unauthorized
    YES ↓
         v
  Is User a Guest?
    YES → Return 403 Forbidden
    NO ↓
         v
  Check Active Subscription
    (status=active AND currentPeriodEnd >= now)
    FOUND → ✅ Grant Access (subscription)
    NOT FOUND ↓
         v
  Check General VIP Tokens
    (type=general AND expiresAt >= now AND used < quantity)
    FOUND → ✅ Grant Access (general_token)
    NOT FOUND ↓
         v
  Check Specific Tip Token (if applicable)
    (tipId=X AND expiresAt >= now AND used < quantity)
    FOUND → ✅ Grant Access (specific_token)
    NOT FOUND ↓
         v
  ❌ Return 403 VIP Required
```

---

## 🧪 Testing VIP Access

### Test Scenarios

1. **Active Subscription**

   ```sql
   -- Create active subscription
   INSERT INTO subscriptions (user_id, status, current_period_end)
   VALUES ('user-123', 'active', NOW() + INTERVAL '30 days');
   ```

2. **Expired Subscription**

   ```sql
   -- Create expired subscription
   INSERT INTO subscriptions (user_id, status, current_period_end)
   VALUES ('user-123', 'active', NOW() - INTERVAL '1 day');
   -- Should NOT grant access
   ```

3. **General VIP Token**

   ```sql
   -- Create general token
   INSERT INTO vip_tokens (user_id, type, quantity, used, expires_at)
   VALUES ('user-123', 'general', 5, 0, NOW() + INTERVAL '30 days');
   -- Should grant access to ALL VIP content
   ```

4. **Specific Tip Token**

   ```sql
   -- Create tip-specific token
   INSERT INTO vip_tokens (user_id, tip_id, type, quantity, used, expires_at)
   VALUES ('user-123', 'tip-456', 'single', 1, 0, NOW() + INTERVAL '7 days');
   -- Should grant access ONLY to tip-456
   ```

5. **Used-Up Token**
   ```sql
   -- Create fully used token
   INSERT INTO vip_tokens (user_id, type, quantity, used, expires_at)
   VALUES ('user-123', 'general', 5, 5, NOW() + INTERVAL '30 days');
   -- Should NOT grant access (used >= quantity)
   ```

### API Test Requests

```bash
# 1. Check VIP status
curl -H "Authorization: Bearer $TOKEN" \
  https://your-app.com/api/vip/status

# 2. List VIP predictions (requires access)
curl -H "Authorization: Bearer $TOKEN" \
  https://your-app.com/api/predictions?vip=true

# 3. Get specific VIP prediction
curl -H "Authorization: Bearer $TOKEN" \
  https://your-app.com/api/predictions/tip-id-123

# 4. Redeem VIP token
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"your-token-code"}' \
  https://your-app.com/api/vip/tokens/redeem
```

---

## 🎯 Summary

### ✅ What's Working Well

- VIP status endpoint (`/api/vip/status`) is correct
- All routes check authentication before VIP access
- Guest users are properly blocked from VIP content
- Token redemption is transaction-safe
- Frontend UX properly reflects VIP status

### ⚠️ What Needs Improvement

- **Duplicate code**: Same VIP check logic in 4+ files
- **Inconsistent token queries**: Some missing type filters
- **No token usage tracking**: Tokens not incremented on use
- **Type safety**: Some implicit `any` types in token handling

### 🚀 Next Steps

1. ✅ **Created** `/lib/vip-access.ts` - Centralized utility
2. ⏳ **TODO**: Update all routes to use centralized functions
3. ⏳ **TODO**: Add token type filtering everywhere
4. ⏳ **TODO**: Implement token usage increment on content access
5. ⏳ **TODO**: Add comprehensive VIP access tests

---

## 📝 Code Migration Example

### Before (Duplicated Logic)

```typescript
// In /app/api/predictions/route.ts
async function checkVipAccess(userId: string): Promise<boolean> {
  try {
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
        currentPeriodEnd: { gte: new Date() },
      },
    });
    if (activeSubscription) return true;

    const validToken = await prisma.vIPToken.findFirst({
      where: {
        userId,
        expiresAt: { gte: new Date() },
        OR: [{ used: 0 }, { used: { lt: prisma.vIPToken.fields.quantity } }],
      },
    });
    return !!validToken;
  } catch (error) {
    console.error("Error checking VIP access:", error);
    return false;
  }
}
```

### After (Centralized Library)

```typescript
// In /app/api/predictions/route.ts
import { hasVIPAccess } from "@/lib/vip-access";

// Simple usage
const hasAccess = await hasVIPAccess(auth.user.id);

// Or with details
import { checkVIPAccess } from "@/lib/vip-access";
const accessDetails = await checkVIPAccess(auth.user.id);
if (accessDetails.hasAccess) {
  console.log(`Access via: ${accessDetails.accessType}`);
}
```

---

## 🔐 Security Considerations

1. **Always check on backend** - Frontend checks are for UX only
2. **Verify user ownership** - Ensure tokens belong to the authenticated user
3. **Use transactions** - Prevent race conditions in token redemption
4. **Rate limit token redemption** - Prevent brute force attacks
5. **Log access attempts** - Track VIP content access for security audits
6. **Validate expiry dates** - Never trust expired subscriptions/tokens
7. **Check usage limits** - Ensure tokens haven't been fully consumed

---

## 📞 Questions?

If you need clarification on any VIP access logic or have questions about implementation, refer to:

- `/lib/vip-access.ts` - Source of truth for VIP checking
- `/prisma/schema.prisma` - Database schema definitions
- This document - Complete audit and guidelines
