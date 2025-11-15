# Quick Start Guide - Password Reset & Email Setup

## Prerequisites

- Node.js installed
- pnpm package manager
- PostgreSQL database running
- Redis running (for rate limiting)

## Step 1: Install Dependencies

Dependencies have already been installed:

```bash
✅ resend@6.4.2 - Email service
```

## Step 2: Configure Environment Variables

Create or update your `.env` file:

```bash
# Copy the example file
cp .env.example .env

# Then edit .env and add:
RESEND_API_KEY="re_your_api_key_here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Get Your Resend API Key:

1. Go to https://resend.com
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file

## Step 3: Update Database Schema

Run Prisma migration to add the `PasswordReset` table:

```bash
# Generate Prisma Client with new model
npx prisma generate

# Push schema to database
npx prisma db push

# Or create a migration (recommended for production)
npx prisma migrate dev --name add_password_reset_table
```

## Step 4: Configure Resend Domain (Production Only)

For production, you need to verify your domain in Resend:

1. Log into Resend dashboard
2. Go to Domains section
3. Add domain: `getscorefusion.com`
4. Follow DNS verification steps
5. Wait for verification (usually a few minutes)

**For development/testing**, you can use Resend's test mode without domain verification.

## Step 5: Start Development Server

```bash
pnpm dev
```

Your app should now be running at http://localhost:3000

## Step 6: Test the Features

### Test Password Reset Flow:

1. **Navigate to forgot password page:**

   ```
   http://localhost:3000/forgot-password
   ```

2. **Enter your email address** (use a real email you have access to)

3. **Check your email** for the reset code

4. **Click the link in email** or manually navigate to:

   ```
   http://localhost:3000/reset-password
   ```

5. **Enter the 6-digit code** (or it auto-fills from link)

6. **Set new password** and submit

7. **Check for confirmation email**

### Test Welcome Email on Signup:

1. **Navigate to signup page:**

   ```
   http://localhost:3000/signup
   ```

2. **Complete signup form** with a valid email

3. **Check your email** for the welcome message

## Troubleshooting

### Emails Not Sending

**Problem:** Not receiving emails

**Solutions:**

1. Check `RESEND_API_KEY` is correctly set in `.env`
2. Verify you're using a real email address
3. Check spam/junk folder
4. Check Resend dashboard for delivery logs
5. Review server console for error messages

### Database Errors

**Problem:** "Table `password_resets` does not exist"

**Solution:**

```bash
npx prisma generate
npx prisma db push
```

### Rate Limiting Issues

**Problem:** Getting "Too many requests" errors

**Solutions:**

1. Check Redis is running: `redis-cli ping` (should return PONG)
2. Restart Redis: `redis-server`
3. Wait for the rate limit window to expire (15 minutes)

### Reset Code Not Working

**Problem:** "Invalid or expired reset code"

**Causes:**

- Code expired (1 hour limit)
- Code already used
- Typo in code entry
- Database sync issue

**Solution:**
Request a new reset code

## API Endpoints Quick Reference

### Forgot Password

```bash
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
```

### Verify Reset Code

```bash
POST /api/auth/reset-password/verify
Body: { "token": "123456" }
```

### Reset Password

```bash
POST /api/auth/reset-password
Body: { "token": "123456", "password": "NewPassword123" }
```

## File Structure

```
score-fusion/
├── app/
│   ├── (auth)/
│   │   ├── forgot-password/
│   │   │   └── page.tsx          # Forgot password UI
│   │   └── reset-password/
│   │       └── page.tsx           # Reset password UI
│   └── api/
│       └── auth/
│           ├── forgot-password/
│           │   └── route.ts       # Request reset endpoint
│           ├── reset-password/
│           │   ├── route.ts       # Reset password endpoint
│           │   └── verify/
│           │       └── route.ts   # Verify code endpoint
│           └── signup/
│               └── route.ts       # Updated with welcome email
├── lib/
│   ├── email.ts                   # Email service & templates
│   └── utils.ts                   # Added getClientIp()
├── prisma/
│   └── schema.prisma              # Added PasswordReset model
├── docs/
│   ├── AUTH_SETUP.md              # Full documentation
│   └── PASSWORD_RESET_SUMMARY.md  # Implementation summary
└── .env.example                   # Environment variables template
```

## Testing Checklist

- [ ] Forgot password page loads
- [ ] Can submit email address
- [ ] Receive reset email
- [ ] Email contains 6-digit code
- [ ] Email link works
- [ ] Can verify code manually
- [ ] Can reset password
- [ ] Receive confirmation email
- [ ] Can login with new password
- [ ] Welcome email on signup
- [ ] All emails look good on mobile
- [ ] Rate limiting works

## Production Deployment

Before deploying to production:

1. **Update environment variables:**

   ```bash
   RESEND_API_KEY="re_live_..."  # Use production key
   NEXT_PUBLIC_APP_URL="https://getscorefusion.com"
   ```

2. **Verify domain in Resend**

3. **Run database migration:**

   ```bash
   npx prisma migrate deploy
   ```

4. **Test thoroughly in staging environment**

5. **Monitor email delivery** in Resend dashboard

## Support

- Full documentation: `/docs/AUTH_SETUP.md`
- Summary: `/docs/PASSWORD_RESET_SUMMARY.md`
- Resend docs: https://resend.com/docs
- Prisma docs: https://www.prisma.io/docs

## Success Indicators

You'll know everything is working when:

- ✅ Emails arrive within seconds
- ✅ Reset codes work on first try
- ✅ Emails look professional and branded
- ✅ No console errors
- ✅ Password reset succeeds
- ✅ Welcome email arrives for new signups
- ✅ Rate limiting prevents abuse

## Next Steps

After setup is complete:

1. Test all flows thoroughly
2. Customize email templates if needed
3. Set up email monitoring
4. Configure error tracking
5. Review analytics events
6. Set up alerts for email failures

---

**Need Help?** Check the full documentation in `/docs/AUTH_SETUP.md` or review the implementation summary in `/docs/PASSWORD_RESET_SUMMARY.md`
