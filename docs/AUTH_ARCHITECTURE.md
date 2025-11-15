# Authentication & Session Management Guide

## Overview

This application uses **NextAuth.js** as the primary authentication system. This provides a consistent, secure way to manage user sessions across both client and server components.

## Architecture

### Core Components

1. **NextAuth.js Configuration** (`app/api/auth/[...nextauth]/route.ts`)

   - Handles authentication logic
   - Manages JWT sessions
   - Supports credentials-based login and guest mode

2. **Session Utility** (`lib/session.ts`)

   - Unified interface for session management
   - Helper functions for common authentication tasks
   - Middleware for protecting API routes

3. **Auth Context** (`contexts/auth-context.tsx`)
   - React context for client-side authentication
   - Wraps NextAuth's `SessionProvider`
   - Provides convenient hooks like `useAuth()`

## Environment Variables

### Required Variables

```bash
# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"  # Your application URL

# Database
DATABASE_URL="your-database-connection-string"
```

⚠️ **Important**: The `NEXTAUTH_SECRET` is critical for JWT encryption. Without it, you'll encounter "decryption operation failed" errors.

## Usage Guide

### Server Components & API Routes

#### Getting the Current Session

```typescript
import { getCurrentSession } from "@/lib/session";

export async function MyServerComponent() {
  const session = await getCurrentSession();

  if (!session) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {session.user.displayName}</div>;
}
```

#### Protecting API Routes

**Option 1: Using Helper Functions**

```typescript
import { requireAuth, requireAdmin } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  // For regular authenticated routes
  const { error, session } = await requireAuth();
  if (error) return error;

  // Your logic here
  return NextResponse.json({ userId: session.user.id });
}
```

**Option 2: Using Middleware Wrappers**

```typescript
import { withAuth, withAdmin } from "@/lib/session";
import { NextResponse } from "next/server";

// Protected route
export const GET = withAuth(async (request, { session }) => {
  return NextResponse.json({
    message: "Authenticated!",
    userId: session.user.id,
  });
});

// Admin-only route
export const POST = withAdmin(async (request, { session }) => {
  return NextResponse.json({
    message: "Admin access granted!",
    adminId: session.user.id,
  });
});
```

### Client Components

#### Using the Auth Context

```typescript
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function MyComponent() {
  const { user, isLoading, login, logout } = useAuth();
  const router = useRouter();

  // Check authentication status
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in</div>;
  }

  // Access user information
  return (
    <div>
      <p>Welcome, {user.displayName}</p>
      <p>Email: {user.email}</p>
      {user.isAdmin && <p>You are an admin</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

#### Login Flow

```typescript
import { useAuth } from "@/contexts/auth-context";

export default function LoginForm() {
  const { login, guestLogin } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      // User will be redirected automatically based on their role
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await guestLogin();
      // Guest user created and redirected to dashboard
    } catch (error) {
      console.error("Guest login failed:", error);
    }
  };

  // Your form UI here
}
```

## Authentication Flow

### Regular User Login

1. User submits credentials via login form
2. Form calls `useAuth().login(email, password)`
3. NextAuth validates credentials against database
4. Session is created with JWT token
5. User is redirected to appropriate page (admin → `/admin`, user → `/dashboard`)

### Guest Login

1. User clicks "Continue as Guest"
2. Form calls `useAuth().guestLogin()`
3. NextAuth creates a temporary guest user in database
4. Session is created with `guest: true` flag
5. User is redirected to `/dashboard` with limited access

### Session Validation

- **Client-side**: React components use `useAuth()` hook
- **Server-side**: API routes use `getCurrentSession()` or middleware wrappers
- **Automatic refresh**: NextAuth handles token refresh automatically

## User Roles & Permissions

### Role Hierarchy

1. **Guest** (`guest: true`)

   - Temporary access
   - Limited features
   - No persistent data

2. **User** (`role: "USER"`)

   - Full account features
   - Can view tips, make predictions
   - Access to personal dashboard

3. **Admin** (`role: "ADMIN"` or `isAdmin: true`)
   - All user features
   - Access to admin dashboard
   - User management capabilities
   - System configuration

### Checking Permissions

```typescript
// Server-side
import { isAdmin, requireAdmin } from "@/lib/session";

const userIsAdmin = await isAdmin();

// Client-side
import { useAuth } from "@/contexts/auth-context";

const { user } = useAuth();
const userIsAdmin = user?.isAdmin || user?.role === "ADMIN";
```

## API Endpoints

### Authentication Endpoints

- `POST /api/auth/signin` - Login with credentials
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Get current session
- `GET /api/auth/csrf` - Get CSRF token
- `GET /api/auth/providers` - Get available auth providers

### Custom Endpoints

- `POST /api/auth/signup` - Create new user account
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

## Best Practices

### ✅ Do's

1. **Always use `NEXTAUTH_SECRET` in production**

   ```bash
   # Generate a secure secret
   openssl rand -base64 32
   ```

2. **Use the unified session utility**

   ```typescript
   import { requireAuth } from "@/lib/session";
   ```

3. **Check authentication on both client and server**

   - Client: For UI rendering
   - Server: For data access and security

4. **Handle loading states**

   ```typescript
   if (isLoading) return <LoadingSpinner />;
   ```

5. **Redirect unauthorized users**
   ```typescript
   if (!user) {
     router.push("/login");
     return null;
   }
   ```

### ❌ Don'ts

1. **Don't mix authentication systems**

   - Stick to NextAuth.js throughout the app
   - Don't use custom JWT alongside NextAuth

2. **Don't store sensitive data in client-side sessions**

   - Keep passwords, API keys, etc. server-side only

3. **Don't forget to validate sessions on the server**

   - Never trust client-side authentication alone

4. **Don't hardcode secrets**
   - Always use environment variables
   - Never commit `.env` files to git

## Troubleshooting

### "decryption operation failed" Error

**Cause**: Missing or invalid `NEXTAUTH_SECRET`

**Solution**:

```bash
# Add to .env file
NEXTAUTH_SECRET="your-secret-here"

# Generate a new secret
openssl rand -base64 32
```

### Session Not Persisting

**Cause**: Missing `NEXTAUTH_URL` or incorrect domain

**Solution**:

```bash
# Development
NEXTAUTH_URL="http://localhost:3000"

# Production
NEXTAUTH_URL="https://yourdomain.com"
```

### Unauthorized Access Errors

**Cause**: Session expired or user not logged in

**Solution**:

- Check if user is authenticated before making requests
- Implement proper error handling and redirect to login
- Verify admin role for protected routes

### CORS Issues with Sessions

**Cause**: Incorrect cookie settings or domain mismatch

**Solution**:

- Ensure `NEXTAUTH_URL` matches your domain
- Check `credentials: 'include'` in fetch requests
- Verify cookie settings in NextAuth config

## Migration from Custom JWT Auth

If you're migrating from a custom JWT authentication system:

1. ✅ Remove custom JWT token generation/verification
2. ✅ Replace `getAuthenticatedUser()` with `getCurrentSession()`
3. ✅ Update API routes to use session utilities
4. ✅ Update client components to use `useAuth()` hook
5. ✅ Remove Authorization header logic (cookies handle this)
6. ✅ Test all authentication flows thoroughly

## Security Considerations

1. **JWT Secret Rotation**: Periodically update `NEXTAUTH_SECRET`
2. **HTTPS Only**: Always use HTTPS in production
3. **Cookie Security**: NextAuth handles secure cookies automatically
4. **Rate Limiting**: Implement on login endpoints
5. **Session Timeout**: Configure appropriate JWT expiration times
6. **Audit Logs**: Track authentication events for security monitoring

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
