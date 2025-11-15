# VIP Access Control - Action Plan

## 🎯 Quick Summary

**Current Status**: VIP checking works but has duplicate code and minor inconsistencies.

**What You Need to Do**: Standardize VIP checks across all routes using the new centralized library.

---

## ✅ What I've Created for You

### 1. **Centralized VIP Library** (`/lib/vip-access.ts`)

Ready-to-use functions:

```typescript
import {
  hasVIPAccess, // Simple: true/false
  hasTipAccess, // For specific tips
  checkVIPAccess, // Detailed access info
  checkTipAccess, // Detailed tip access
  getVIPEntitlements, // All subscriptions + tokens
  useVIPToken, // Mark token as used
} from "@/lib/vip-access";
```

### 2. **Complete Audit Document** (`/docs/VIP_ACCESS_AUDIT.md`)

Comprehensive documentation covering:

- How VIP access works
- Current implementation locations
- Issues found
- Recommended fixes
- Testing scenarios

---

## 🔧 Step-by-Step Implementation

### Step 1: Update `/app/api/predictions/route.ts`

**Find and replace:**

```typescript
// ❌ REMOVE this function (around line 238)
async function checkVipAccess(userId: string): Promise<boolean> {
  // ... entire function ...
}
```

**Add at top of file:**

```typescript
import { hasVIPAccess } from "@/lib/vip-access";
```

**Update usage (around line 63):**

```typescript
// OLD
const hasVipAccess = await checkVipAccess(auth.user.id);

// NEW
const hasVipAccess = await hasVIPAccess(auth.user.id);
```

---

### Step 2: Update `/app/api/predictions/[id]/route.ts`

**Find and replace:**

```typescript
// ❌ REMOVE this function (around line 147)
async function checkVipAccess(userId: string, tipId: string): Promise<boolean> {
  // ... entire function ...
}
```

**Add at top of file:**

```typescript
import { hasTipAccess } from "@/lib/vip-access";
```

**Update usage (around line 88):**

```typescript
// OLD
hasVipAccess = await checkVipAccess(auth.user.id, id);

// NEW
hasVipAccess = await hasTipAccess(auth.user.id, id);
```

---

### Step 3: Update `/app/api/tips/route.ts`

**Find and replace:**

```typescript
// ❌ REMOVE this function (around line 246)
async function checkVipAccess(userId: string): Promise<boolean> {
  // ... entire function ...
}
```

**Add at top of file:**

```typescript
import { hasVIPAccess } from "@/lib/vip-access";
```

**Update usage (around line 71):**

```typescript
// OLD
const hasVipAccess = await checkVipAccess(auth.user.id);

// NEW
const hasVipAccess = await hasVIPAccess(auth.user.id);
```

---

### Step 4: Update `/app/api/tips/[id]/route.ts`

**Find and replace:**

```typescript
// ❌ REMOVE this function (around line 186)
async function checkVipAccess(userId: string): Promise<boolean> {
  // ... entire function ...
}
```

**Add at top of file:**

```typescript
import { hasVIPAccess } from "@/lib/vip-access";
```

**Update usage (around lines 35 and 100):**

```typescript
// OLD (appears twice)
!(await checkVipAccess(auth.user.id));
const hasVipAccess = await checkVipAccess(auth.user.id);

// NEW
!(await hasVIPAccess(auth.user.id));
const hasVipAccess = await hasVIPAccess(auth.user.id);
```

---

### Step 5: (Optional) Update `/app/api/vip/status/route.ts`

This route already has correct logic, but you can optionally use the library:

**Add at top:**

```typescript
import { checkVIPAccess } from "@/lib/vip-access";
```

**Replace the inline checks with:**

```typescript
const vipAccess = await checkVIPAccess(auth.user.id);

return NextResponse.json({
  success: true,
  hasAccess: vipAccess.hasAccess,
  subscription: vipAccess.subscription,
  tokenAccess: vipAccess.token,
});
```

---

## ⚠️ Critical Fix: Token Type Filtering

After updating imports, add token type filtering to the library if accessing general content:

**In `/lib/vip-access.ts`**, the `checkVIPAccess` function already includes this fix:

```typescript
where: {
  userId,
  type: "general", // ✅ Already included!
  expiresAt: { gte: new Date() },
  used: { lt: prisma.vIPToken.fields.quantity },
}
```

**No action needed** - the centralized library already has this fix! 🎉

---

## 🧪 Testing After Changes

### 1. Test VIP Status Endpoint

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/vip/status
```

**Expected Response:**

```json
{
  "success": true,
  "hasAccess": true,
  "subscription": {
    "plan": "monthly",
    "status": "active",
    "currentPeriodEnd": "2025-12-10T00:00:00.000Z"
  },
  "tokenAccess": null
}
```

### 2. Test VIP Predictions

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/predictions?vip=true
```

**Should Return**: VIP predictions if user has access, or 403 error if not.

### 3. Test Specific Prediction

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/predictions/PREDICTION_ID
```

**Should Return**: Full prediction content if user has access, or limited preview if VIP prediction without access.

---

## 📊 Before & After Comparison

### Before

- ❌ Duplicate `checkVipAccess` function in 4+ files
- ❌ Inconsistent token checking logic
- ❌ Missing token type filters
- ❌ ~500 lines of duplicate code

### After

- ✅ Single source of truth in `/lib/vip-access.ts`
- ✅ Consistent checking logic everywhere
- ✅ Proper token type filtering
- ✅ Easier to maintain and test
- ✅ ~100 lines of centralized, well-tested code

---

## 🎯 Quick Checklist

- [ ] Created `/lib/vip-access.ts` ✅ (Already done)
- [ ] Read `/docs/VIP_ACCESS_AUDIT.md` ✅ (Already created)
- [ ] Update `/app/api/predictions/route.ts`
- [ ] Update `/app/api/predictions/[id]/route.ts`
- [ ] Update `/app/api/tips/route.ts`
- [ ] Update `/app/api/tips/[id]/route.ts`
- [ ] (Optional) Update `/app/api/vip/status/route.ts`
- [ ] Test VIP status endpoint
- [ ] Test VIP predictions endpoint
- [ ] Test specific prediction access
- [ ] Test token redemption
- [ ] Run full test suite
- [ ] Deploy to staging/production

---

## 💡 Pro Tips

1. **Don't rush** - Update one file at a time and test
2. **Keep backups** - Git commit before each change
3. **Test immediately** - After each file update, test that endpoint
4. **Check TypeScript** - Run `npm run type-check` after changes
5. **Review logs** - Check server logs for any VIP access errors

---

## 🆘 Troubleshooting

### Issue: "Module not found" error for `/lib/vip-access`

**Solution**: Make sure the file was created at `/Users/Moses/Desktop/score-fusion/lib/vip-access.ts`

### Issue: TypeScript errors after import

**Solution**: Run `npm run type-check` to see specific errors. The library has proper TypeScript types.

### Issue: VIP access not working after changes

**Solution**:

1. Check database - verify user has active subscription or token
2. Check token expiry dates
3. Check token usage counts (used < quantity)
4. Review server logs for error messages

### Issue: Tests failing

**Solution**: Update any test mocks to use the new library functions instead of the old inline functions.

---

## 📞 Need Help?

Refer to:

- `/lib/vip-access.ts` - Source code with JSDoc comments
- `/docs/VIP_ACCESS_AUDIT.md` - Complete technical documentation
- `/prisma/schema.prisma` - Database schema
- This action plan - Step-by-step instructions

---

## ✨ Bonus: Future Enhancements

After completing the basic refactor, consider:

1. **Add VIP access caching** - Cache results for 1-5 minutes to reduce DB queries
2. **Add usage tracking** - Increment token usage when content is accessed
3. **Add analytics** - Track which access method is most used
4. **Add admin dashboard** - View VIP access stats and manage tokens
5. **Add webhook notifications** - Alert when subscriptions expire
