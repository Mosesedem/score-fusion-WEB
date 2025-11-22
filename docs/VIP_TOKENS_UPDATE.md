# VIP Token format and admin workflow changes

## Summary

We changed how VIP tokens are issued and consumed to make admin workflows easier and to introduce a short PIN-style token format.

## What changed

- Token format: tokens are now short PINs (6 or 7 characters) composed of unambiguous alphanumeric characters (A-Z, 2-9). This keeps tokens short and easy to type.
- Admins can now generate tokens without assigning them to a specific user (generic/unassigned). These tokens become assigned to the user who redeems them.
- Admin token endpoint now accepts an optional `userId` and generates explicit 6-7 character tokens.
- Redeem endpoint now validates PINs (6-7 chars, alphanumeric) and normalizes them (trim + uppercase) before lookup.

## DB / Migration notes

- Schema change: `VIPToken.token` column was changed to `VARCHAR(7)` and uniqueness is kept.
- If you already have existing tokens longer than 7 characters, you'll need to decide how to migrate them. Options:
  - TRUNCATE/RECREATE older tokens / reissue new short tokens
  - Keep older tokens but migrate values to shorter codes and/or migrate user associations first

## Running migration (dev)

1. From the project root run:

```bash
pnpm exec prisma migrate dev --name vip_token_pin_length
```

2. Inspect generated migration and apply it to your database and environments.

## Important notes

- Admin-generated generic tokens are stored with `userId = NULL` until redeemed; redemption will then set `userId` to the redeemer's id.
- Admin email-sending is unchanged for tokens created for a specific user; generic tokens will not trigger an email.
- The `scripts/create-vip-user.ts` helper script was updated to generate a 6-char test PIN.

If you want, I can also add a migration script to re-map existing long tokens to new short PINs and notify users — tell me if you'd like that next.
