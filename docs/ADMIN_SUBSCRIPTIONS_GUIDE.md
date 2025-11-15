# Admin Subscriptions Management System

## Overview

A comprehensive subscription management system for administrators to create, manage, update, and delete user subscriptions directly from the admin panel.

## Files Created/Modified

### 1. Admin Subscriptions Page

**File:** `/app/admin/subscriptions/page.tsx`

A full-featured subscription management interface with:

- **Real-time Statistics Dashboard**

  - Total subscriptions
  - Active subscriptions
  - Trial users
  - Canceled subscriptions
  - Past due payments
  - Monthly Recurring Revenue (MRR)
  - Annual Recurring Revenue (ARR)

- **Advanced Features**
  - Search by user email or name
  - Filter by status (all, active, trial, past_due, canceled)
  - Pagination support
  - Create new subscriptions for users
  - Extend existing subscriptions
  - Cancel subscriptions
  - Delete subscription records
  - User search with autocomplete
  - Visual status badges

### 2. API Routes

#### GET `/api/admin/subscriptions`

**File:** `/app/api/admin/subscriptions/route.ts`

Fetch subscriptions with:

- Pagination support
- Search functionality
- Status filtering
- User details included

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search query for user email/name
- `status` - Filter by status (all, active, trial, past_due, canceled)

#### POST `/api/admin/subscriptions`

**File:** `/app/admin/subscriptions/route.ts`

Manage subscriptions with three actions:

**1. Create Subscription**

```json
{
  "userId": "user-uuid",
  "action": "create",
  "plan": "monthly" | "yearly" | "trial"
}
```

**2. Extend Subscription**

```json
{
  "userId": "user-uuid",
  "action": "extend",
  "durationDays": 30
}
```

**3. Cancel Subscription**

```json
{
  "userId": "user-uuid",
  "action": "cancel"
}
```

#### GET `/api/admin/subscriptions/stats`

**File:** `/app/api/admin/subscriptions/stats/route.ts`

Returns subscription statistics:

```json
{
  "total": 150,
  "active": 120,
  "canceled": 20,
  "pastDue": 5,
  "trial": 15,
  "monthlyRevenue": 1199.88,
  "yearlyRevenue": 9599.04
}
```

#### DELETE `/api/admin/subscriptions/[id]`

**File:** `/app/api/admin/subscriptions/[id]/route.ts`

Delete a subscription record permanently.

#### GET `/api/admin/subscriptions/[id]`

**File:** `/app/api/admin/subscriptions/[id]/route.ts`

Fetch a single subscription with user details.

### 3. Admin Sidebar Update

**File:** `/components/layout/admin-sidebar.tsx`

Added "Subscriptions" menu item with CreditCard icon between "Users" and "Tips Management".

## Features

### Dashboard Statistics

- **Total Subscriptions** - Complete count of all subscriptions
- **Active** - Currently active subscriptions with valid periods
- **Trial** - Users on trial period
- **Canceled** - Subscriptions that have been canceled
- **Past Due** - Subscriptions with payment issues
- **Monthly MRR** - Estimated monthly recurring revenue
- **Yearly ARR** - Estimated annual recurring revenue

### Subscription Management

#### Create Subscription

1. Click "Create Subscription" button
2. Search for a user by email or name
3. Select user from dropdown
4. Choose plan:
   - **Trial** - 7 days trial period
   - **Monthly** - 30 days subscription
   - **Yearly** - 365 days subscription
5. Confirm to create

#### Extend Subscription

1. Find active subscription
2. Click "Extend" button
3. Enter number of days to extend
4. Preview shows new end date
5. Confirm to extend

#### Cancel Subscription

1. Find active subscription
2. Click "Cancel" button
3. Review cancellation details
4. User retains access until current period ends
5. Confirm to cancel

#### Delete Subscription

1. Find subscription
2. Click "Delete" button
3. Warning: Permanent deletion
4. User loses immediate access
5. Confirm to delete

### Visual Status Indicators

- 🟢 **Active** - Green badge with checkmark
- 🔵 **Trial** - Blue badge with clock icon
- 🟡 **Canceling** - Yellow badge (cancelAtPeriodEnd)
- 🟠 **Past Due** - Orange badge with alert icon
- 🔴 **Canceled/Expired** - Red badge with X icon

### Plan Badges

- 🔵 **Monthly** - Blue badge
- 🟣 **Yearly** - Purple badge
- ⚫ **Trial** - Gray badge

## Security

### Admin Authentication

All endpoints use `requireAdmin()` from `/lib/session.ts`:

- Validates session token
- Verifies ADMIN role
- Returns 403 Forbidden if unauthorized

### Audit Logging

All actions are logged to `admin_audit_logs` table:

- Create subscription
- Extend subscription
- Cancel subscription
- Delete subscription

**Audit Log Details:**

```typescript
{
  userId: adminId,
  action: "create_subscription",
  resource: targetUserId,
  details: {
    plan: "monthly",
    periodEnd: "2025-12-10",
    createdBy: "Admin Name"
  }
}
```

## Database Schema Reference

### Subscription Model

```prisma
model Subscription {
  id                   String   @id @default(uuid())
  userId               String
  stripeSubscriptionId String   @unique
  stripeCustomerId     String
  plan                 String   // monthly, yearly, trial
  status               String   // active, past_due, canceled, incomplete
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  trialEnd             DateTime?
  cancelAtPeriodEnd    Boolean  @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  canceledAt           DateTime?
  user                 User     @relation(...)
}
```

## Revenue Calculation

The system estimates revenue based on:

```typescript
// Configure in: /app/api/admin/subscriptions/stats/route.ts
const monthlyPrice = 9.99; // Your monthly subscription price
const yearlyPrice = 99.99; // Your yearly subscription price

// MRR = Active Monthly Subscriptions × Monthly Price
monthlyRevenue = monthlySubscriptions * monthlyPrice;

// ARR = (Active Yearly Subscriptions × Yearly Price)
yearlyRevenue = yearlySubscriptions * yearlyPrice;
```

**Note:** Update these values to match your actual pricing.

## Usage Examples

### Create a Trial Subscription

```typescript
POST /api/admin/subscriptions
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "action": "create",
  "plan": "trial"
}
```

### Extend Subscription by 30 Days

```typescript
POST /api/admin/subscriptions
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "action": "extend",
  "durationDays": 30
}
```

### Get All Active Subscriptions

```
GET /api/admin/subscriptions?status=active&page=1&limit=20
```

### Search Subscriptions

```
GET /api/admin/subscriptions?search=john@example.com
```

## Pagination

Responses include pagination metadata:

```json
{
  "data": {
    "subscriptions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasMore": true
    }
  }
}
```

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message"
}
```

**Common Errors:**

- `403` - Admin access required
- `404` - User/Subscription not found
- `400` - Validation error (Zod schema)
- `500` - Internal server error

## Navigation

Access the subscriptions page:

1. Login as admin
2. Navigate to `/admin/subscriptions`
3. Or click "Subscriptions" in admin sidebar

## Responsive Design

The interface is fully responsive:

- **Desktop** - Multi-column layout with sidebar
- **Tablet** - Adjusted grid columns
- **Mobile** - Stacked layout, bottom sheet navigation

## Next Steps

### Optional Enhancements

1. **Export Functionality**

   - Add CSV/Excel export for subscriptions
   - Filter and export specific date ranges

2. **Email Notifications**

   - Notify users when subscription is created/extended
   - Send cancellation confirmations

3. **Subscription Analytics**

   - Churn rate calculation
   - Lifetime value (LTV) metrics
   - Conversion funnel from trial to paid

4. **Bulk Operations**

   - Bulk extend subscriptions
   - Bulk cancel/delete
   - Import subscriptions from CSV

5. **Payment Integration**

   - Link to Stripe dashboard
   - View payment history
   - Handle failed payments

6. **Subscription Templates**
   - Create custom plans
   - Promotional pricing
   - Coupon codes

## Testing

### Manual Testing Checklist

- [ ] Create subscription for user without subscription
- [ ] Try creating subscription for user with active subscription (should fail)
- [ ] Extend subscription and verify new end date
- [ ] Cancel subscription and verify cancelAtPeriodEnd flag
- [ ] Delete subscription and verify removal
- [ ] Search subscriptions by email
- [ ] Search subscriptions by name
- [ ] Filter by each status
- [ ] Verify pagination works
- [ ] Check stats dashboard updates after actions
- [ ] Verify audit logs are created
- [ ] Test non-admin access (should be denied)

## Support

For issues or questions:

1. Check admin audit logs for action history
2. Review subscription status in database
3. Verify user permissions
4. Check API response errors

## Updates Log

**Version 1.0 - November 10, 2025**

- Initial implementation
- Full CRUD operations
- Statistics dashboard
- Audit logging
- User search
- Status filtering
- Responsive UI
