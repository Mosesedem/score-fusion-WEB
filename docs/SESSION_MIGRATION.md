# Session Management Migration Guide

## Quick Start

This guide helps you migrate API routes to use the unified session management system.

## Before & After Examples

### Example 1: Simple Protected Route

#### ❌ Old Way (Custom JWT)

```typescript
import { getAuthenticatedUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser(request);

  if (error || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    userId: user.id,
  });
}
```

#### ✅ New Way (NextAuth Session)

```typescript
import { requireAuth } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, session } = await requireAuth();

  if (error) return error;

  return NextResponse.json({
    success: true,
    userId: session.user.id,
  });
}
```

Or using middleware wrapper:

```typescript
import { withAuth } from "@/lib/session";
import { NextResponse } from "next/server";

export const GET = withAuth(async (request, { session }) => {
  return NextResponse.json({
    success: true,
    userId: session.user.id,
  });
});
```

### Example 2: Admin-Only Route

#### ❌ Old Way (Custom JWT)

```typescript
import { requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin(request);

  if (error || !user) {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 }
    );
  }

  // Admin logic here
  return NextResponse.json({ success: true });
}
```

#### ✅ New Way (NextAuth Session)

```typescript
import { requireAdmin } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  const { error, session } = await requireAdmin();

  if (error) return error;

  // Admin logic here
  return NextResponse.json({ success: true });
}
```

Or using middleware wrapper:

```typescript
import { withAdmin } from "@/lib/session";
import { NextResponse } from "next/server";

export const POST = withAdmin(async (request, { session }) => {
  // Admin logic here
  return NextResponse.json({ success: true });
});
```

### Example 3: Optional Authentication

#### ❌ Old Way

```typescript
import { getAuthenticatedUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { user } = await getAuthenticatedUser(request);

  // Different response based on auth status
  if (user) {
    return NextResponse.json({
      authenticated: true,
      userId: user.id,
    });
  }

  return NextResponse.json({
    authenticated: false,
  });
}
```

#### ✅ New Way

```typescript
import { getCurrentSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getCurrentSession();

  // Different response based on auth status
  if (session) {
    return NextResponse.json({
      authenticated: true,
      userId: session.user.id,
    });
  }

  return NextResponse.json({
    authenticated: false,
  });
}
```

## Migration Checklist

### For Each API Route:

- [ ] Remove `import { getAuthenticatedUser, requireAdmin } from "@/lib/auth"`
- [ ] Add `import { getCurrentSession, requireAuth, requireAdmin } from "@/lib/session"`
- [ ] Remove `NextRequest` parameter if only used for auth
- [ ] Replace custom auth checks with session utilities
- [ ] Remove `Authorization` header reading logic
- [ ] Update error handling to use returned error responses
- [ ] Test the route thoroughly

### Client-Side Changes:

- [ ] Remove manual `Authorization` header in fetch calls
- [ ] Add `credentials: 'include'` to fetch options (for cookies)
- [ ] Use `useAuth()` hook instead of managing tokens manually
- [ ] Remove localStorage token management
- [ ] Update login/logout flows to use NextAuth

## Common Patterns

### Pattern 1: Public Data with Optional User Context

```typescript
import { getCurrentSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getCurrentSession();
  const userId = session?.user.id;

  // Fetch data with optional user filtering
  const data = await prisma.someModel.findMany({
    where: userId ? { userId } : {},
  });

  return NextResponse.json({ success: true, data });
}
```

### Pattern 2: Role-Based Access Control

```typescript
import { requireAuth } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const isAdmin = session.user.isAdmin || session.user.role === "ADMIN";
  const body = await request.json();

  // Different logic based on role
  if (isAdmin) {
    // Admin can do anything
    return NextResponse.json({ success: true, message: "Admin action" });
  }

  // Regular users have restrictions
  if (body.sensitiveField) {
    return NextResponse.json(
      { success: false, error: "Permission denied" },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, message: "User action" });
}
```

### Pattern 3: User-Specific Data Access

```typescript
import { requireAuth } from "@/lib/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  // Ensure users can only access their own data
  const userProfile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (!userProfile) {
    return NextResponse.json(
      { success: false, error: "Profile not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, profile: userProfile });
}
```

## Client-Side Fetch Examples

### ❌ Old Way (JWT in Headers)

```typescript
const token = localStorage.getItem("token");

const response = await fetch("/api/protected", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### ✅ New Way (Session Cookies)

```typescript
// Cookies are automatically included with credentials: 'include'
const response = await fetch("/api/protected", {
  credentials: "include",
});
```

## Testing Your Migration

### 1. Test Authentication Flow

```bash
# Clear cookies and local storage
# Visit /login
# Log in with valid credentials
# Verify redirect to dashboard or admin
```

### 2. Test Protected Routes

```bash
# Try accessing protected API route without login
curl http://localhost:3000/api/protected
# Should return 401

# Log in, then try again
# Should return data
```

### 3. Test Admin Routes

```bash
# Log in as regular user
# Try accessing admin route
# Should return 403

# Log in as admin
# Try accessing admin route
# Should return data
```

## Rollback Plan

If you need to rollback:

1. Keep the old `lib/auth.ts` file (rename it to `lib/auth.backup.ts`)
2. Revert API route changes
3. Re-add Authorization header logic to client
4. Restore token management in frontend

## Need Help?

Common issues and solutions:

1. **"No authorization header"** → You're using old client code, update to use cookies
2. **"Session not found"** → Ensure NextAuth is configured correctly, check NEXTAUTH_SECRET
3. **CORS errors** → Add `credentials: 'include'` to fetch calls
4. **Admin check failing** → Verify user role is set correctly in database and JWT callback

## Next Steps

After migrating all routes:

1. Remove old auth utilities from `lib/auth.ts`
2. Update all client components to use `useAuth()` hook
3. Remove any token management code
4. Test the entire application thoroughly
5. Update documentation and team
