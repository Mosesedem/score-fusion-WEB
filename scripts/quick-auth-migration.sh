#!/bin/bash

# Quick migration script for auth system
# This script updates API routes to use NextAuth instead of custom JWT auth

echo "🔄 Starting auth system migration..."

# Files to update
files=(
  "app/api/predictions/route.ts"
  "app/api/predictions/[id]/route.ts"
  "app/api/wallet/convert/route.ts"
  "app/api/wallet/withdraw/route.ts"
  "app/api/earnings/route.ts"
  "app/api/referral/route.ts"
  "app/api/bets/route.ts"
  "app/api/pay/checkout/route.ts"
  "app/api/realtime/subscribe/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Processing $file..."
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Replace import statement
    sed -i.tmp 's/import { getAuthenticatedUser } from "@\/lib\/auth"/import { getCurrentSession } from "@\/lib\/session"/g' "$file"
    
    # Replace function calls
    sed -i.tmp 's/const auth = await getAuthenticatedUser(request)/const session = await getCurrentSession()/g' "$file"
    
    # Replace user checks
    sed -i.tmp 's/auth\.user/session?.user/g' "$file"
    sed -i.tmp 's/if (!auth\.user)/if (!session \|\| !session.user)/g' "$file"
    
    # Clean up temp files
    rm -f "$file.tmp"
    
    echo "✅ Updated $file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "✨ Migration complete! Please review the changes and test thoroughly."
echo "💡 Backup files created with .backup extension"
