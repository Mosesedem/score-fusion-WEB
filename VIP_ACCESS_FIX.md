# VIP Access Fix - November 10, 2025

## Issue

VIP subscription users were still seeing "VIP Access Required" message even though they had active subscriptions.

## Root Cause

The issue was caused by invalid Prisma query syntax used throughout the codebase when checking for VIP tokens. The code was using:

```typescript
prisma.vIPToken.fields.quantity;
```

This is **not valid Prisma syntax** at runtime. Prisma doesn't support direct field-to-field comparisons in the `where` clause like `used: { lt: prisma.vIPToken.fields.quantity }`.

## Files Fixed

### 1. `/app/api/vip/status/route.ts`

- **Problem**: Invalid token query with `prisma.vIPToken.fields.quantity`
- **Solution**: Changed to fetch all unexpired tokens and filter in JavaScript where `used < quantity`
- **Additional Fix**: Updated response structure to wrap data in `data` property for consistency with API client pattern

### 2. `/lib/vip-access.ts`

- Fixed `checkVIPAccess()` function
- Fixed `checkTipAccess()` function
- Fixed `getVIPEntitlements()` function
- All functions now properly fetch tokens and filter where `used < quantity`

### 3. `/app/api/predictions/route.ts`

- Fixed `checkVipAccess()` helper function

### 4. `/app/api/predictions/[id]/route.ts`

- Fixed `checkVipAccess()` helper function

### 5. `/app/api/tips/[id]/route.ts`

- Fixed token checking logic

### 6. `/app/api/tips/route.ts`

- Fixed token checking logic

### 7. `/app/api/vip/tokens/redeem/route.ts`

- Fixed token availability checking

## Technical Details

### Before (Broken):

```typescript
const validToken = await prisma.vIPToken.findFirst({
  where: {
    userId: auth.user.id,
    expiresAt: { gte: new Date() },
    OR: [{ used: 0 }, { used: { lt: prisma.vIPToken.fields.quantity } }],
  },
});
```

### After (Working):

```typescript
const validTokens = await prisma.vIPToken.findMany({
  where: {
    userId: auth.user.id,
    expiresAt: { gte: new Date() },
  },
  orderBy: { expiresAt: "desc" },
});

const validToken = validTokens.find(
  (token: { used: number; quantity: number }) => token.used < token.quantity
);
```

## Why This Works

1. **Fetch tokens first**: Get all unexpired tokens for the user
2. **Filter in JavaScript**: Use JavaScript's `.find()` or `.filter()` to compare `used` and `quantity` fields
3. **Type-safe**: Added explicit types to avoid TypeScript errors
4. **Maintains order**: Still respects the `orderBy` clause for proper token selection

## API Response Structure

The `/api/vip/status` endpoint now returns:

```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "subscription": {
      "plan": "monthly",
      "status": "active",
      "currentPeriodEnd": "2025-12-10T00:00:00Z",
      "cancelAtPeriodEnd": false
    },
    "tokenAccess": null
  }
}
```

This matches the expected pattern used by the API client where data is wrapped in a `data` property.

## Testing Recommendations

1. **Test with active subscription**: User with active subscription should see VIP content
2. **Test with valid token**: User with unused VIP token should see VIP content
3. **Test with expired subscription**: User with expired subscription should see access required message
4. **Test with exhausted token**: User whose token has `used >= quantity` should not have access
5. **Test guest users**: Guest users should always see access required

## Performance Considerations

The new approach fetches multiple tokens (instead of just one) and filters in JavaScript. For most users, this is negligible:

- Most users have 0-3 tokens
- Query is already filtered by userId and expiresAt with index
- The `.find()` operation is O(n) where n is typically very small

If performance becomes an issue with users having many tokens, consider using Prisma's `queryRaw` with a direct SQL query comparing fields.

## Future Improvements

If Prisma adds support for field-to-field comparisons, or if performance becomes a concern, consider:

```typescript
// Using raw SQL for field comparison
const validTokens = await prisma.$queryRaw`
  SELECT * FROM vip_tokens 
  WHERE "userId" = ${userId} 
    AND "expiresAt" >= NOW() 
    AND used < quantity 
  ORDER BY "expiresAt" DESC 
  LIMIT 1
`;
```
