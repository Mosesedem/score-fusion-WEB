# Authentication & Email Setup

This document describes the authentication endpoints and email functionality for Score Fusion.

## Environment Variables

Add the following to your `.env` file:

```env
# Resend API Key (get from https://resend.com)
RESEND_API_KEY=your_resend_api_key_here

# Application URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Or in production:
# NEXT_PUBLIC_APP_URL=https://getscorefusion.com

# JWT Secret (already configured)
JWT_SECRET=your-secret-key-change-in-production

# Database (already configured)
DATABASE_URL=your_database_url
```

## Email Configuration

**Email Sender:**

- Email: `noreply@getscorefusion.com`
- Name: `Score Fusion`

**Primary Brand Color:**

- Color: `#10b981` (Emerald-500)

### Setting up Resend

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain `getscorefusion.com`
3. Create an API key
4. Add the API key to your `.env` file

## Database Migration

Run the Prisma migration to add the password reset table:

```bash
# Push schema changes to database
npx prisma db push

# Or create a migration
npx prisma migrate dev --name add_password_reset_table

# Generate Prisma client
npx prisma generate
```

## API Endpoints

### 1. Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Description:** Request a password reset code via email

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "If an account matches that email, a reset link has been sent."
  }
}
```

**Error Responses:**

- `400` - Invalid email format
- `429` - Too many requests (rate limited)
- `500` - Internal server error

**Rate Limits:**

- 5 requests per 15 minutes per IP
- 3 requests per hour per email address

**Features:**

- Generates a 6-digit reset code
- Stores token in database with 1-hour expiration
- Sends HTML email with reset code and link
- Prevents email enumeration (always returns success)
- Tracks analytics events

---

### 2. Verify Reset Code

**Endpoint:** `POST /api/auth/reset-password/verify`

**Description:** Verify a password reset code before allowing password change

**Request Body:**

```json
{
  "token": "123456"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Reset code verified successfully",
    "valid": true
  }
}
```

**Error Responses:**

- `400` - Invalid or expired code
- `429` - Too many requests (rate limited)
- `500` - Internal server error

**Rate Limits:**

- 10 requests per 15 minutes per IP

**Features:**

- Validates 5-6 digit code format
- Checks token existence and expiration
- Prevents reuse of tokens

---

### 3. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Description:** Reset user password with verified code

**Request Body:**

```json
{
  "token": "123456",
  "password": "NewSecurePassword123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully. You can now log in with your new password."
  }
}
```

**Error Responses:**

- `400` - Invalid code, weak password, or validation error
- `404` - User not found
- `429` - Too many requests (rate limited)
- `500` - Internal server error

**Rate Limits:**

- 5 requests per 15 minutes per IP

**Password Requirements:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Features:**

- Validates password strength
- Marks token as used (prevents reuse)
- Updates password hash
- Resets login attempts counter
- Unlocks account if locked
- Sends confirmation email
- Tracks analytics events

---

### 4. Signup (Updated)

**Endpoint:** `POST /api/auth/signup`

**New Feature:** Now sends a welcome email upon successful registration

**Welcome Email Includes:**

- Personalized greeting
- Platform overview
- Feature highlights (Expert Tips, Live Scores, Earn Rewards)
- Call-to-action button to dashboard
- Branded HTML design matching primary colors

---

## Email Templates

### 1. Welcome Email

Sent automatically when a user signs up successfully.

**Subject:** "Welcome to Score Fusion! 🎉"

**Content:**

- Personalized greeting
- Platform overview
- Key features list
- CTA button to dashboard
- Help center link

### 2. Password Reset Email

Sent when a user requests a password reset.

**Subject:** "Reset Your Password"

**Content:**

- 6-digit reset code (highlighted)
- Reset link button
- Expiration warning (1 hour)
- Security notice
- Help information

### 3. Password Reset Confirmation

Sent after successful password reset.

**Subject:** "Your Password Has Been Reset"

**Content:**

- Success confirmation
- Login button
- Security warning (if not initiated by user)
- Support contact info

---

## Frontend Pages

### 1. Forgot Password Page

**Path:** `/forgot-password`

**Features:**

- Email input with validation
- Rate limiting feedback
- Success/error messages
- Link to login page

### 2. Reset Password Page

**Path:** `/reset-password`

**Features:**

- Auto-verify code from URL parameter
- Manual code entry option
- Two-step process (verify → reset)
- Password visibility toggle
- Password strength requirements display
- Confirmation password field
- Auto-redirect to login after success

---

## Security Features

### Rate Limiting

- IP-based rate limiting on all endpoints
- Email-based rate limiting on forgot password
- Prevents brute force attacks

### Token Management

- Cryptographically secure 6-digit codes
- 1-hour expiration
- Single-use tokens (marked as used)
- Database persistence

### Email Security

- No email enumeration (always returns success)
- Tokens can't be reused
- IP address logging for audit trail

### Password Security

- bcrypt hashing (12 rounds)
- Strong password requirements enforced
- Login attempts counter reset on password change
- Account unlocking on successful reset

---

## Testing

### Local Testing

1. **Start the development server:**

```bash
pnpm dev
```

2. **Test forgot password flow:**

- Navigate to `http://localhost:3000/forgot-password`
- Enter a valid email address
- Check email for reset code
- Click link or copy code

3. **Test reset password flow:**

- If from email link: auto-verify should happen
- If manual: enter 6-digit code
- Enter new password
- Confirm password
- Submit and verify redirect to login

### Email Testing with Resend

In development, Resend will send actual emails. For testing:

1. Use your own email for testing
2. Check spam folder if not received
3. Verify domain is properly configured in Resend dashboard

---

## Analytics Events

The following events are tracked:

1. **password_reset_requested**

   - Triggered: When user requests password reset
   - Includes: email, timestamp, IP, user agent

2. **password_reset_completed**

   - Triggered: When password is successfully reset
   - Includes: email, timestamp, IP, user agent

3. **signup** (updated)
   - Now triggers welcome email send

---

## Error Handling

All endpoints follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "message": "Error description here"
  }
}
```

Common error scenarios are handled gracefully:

- Email send failures don't block the main flow
- Analytics failures are logged but don't affect user experience
- Rate limits provide clear messaging

---

## Troubleshooting

### Emails not being sent

1. Check `RESEND_API_KEY` is set in `.env`
2. Verify domain is configured in Resend dashboard
3. Check Resend dashboard for delivery status
4. Review server logs for email errors

### Reset codes not working

1. Verify database migration ran successfully
2. Check code hasn't expired (1 hour limit)
3. Ensure code hasn't been used already
4. Check for typos in code entry

### Rate limiting issues

1. Check Redis is running (rate limiting uses Redis)
2. Verify Redis connection in `.env`
3. Rate limits reset automatically after time window

---

## Production Checklist

- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Configure production `RESEND_API_KEY`
- [ ] Verify domain in Resend dashboard
- [ ] Run database migration in production
- [ ] Test email delivery from production
- [ ] Set up email monitoring/alerts
- [ ] Configure proper CORS headers
- [ ] Enable HTTPS for all email links
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor rate limit thresholds

---

## Future Enhancements

Potential improvements:

- SMS-based password reset option
- 2FA integration
- Password reset history/audit log
- Suspicious activity detection
- Email templates customization UI
- Multi-language email support
- Password strength meter in UI
- Account recovery via security questions
