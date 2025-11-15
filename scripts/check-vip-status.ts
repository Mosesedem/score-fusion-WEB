/**
 * Script to check VIP status for users
 * Usage: npx tsx scripts/check-vip-status.ts [email]
 */

import { prisma } from "../lib/db";

async function checkVIPStatus(email?: string) {
  try {
    console.log("=== VIP STATUS CHECKER ===\n");

    // Find user
    const user = email
      ? await prisma.user.findUnique({ where: { email } })
      : await prisma.user.findFirst({
          where: { guest: false },
          orderBy: { createdAt: "desc" },
        });

    if (!user) {
      console.log("❌ No user found");
      return;
    }

    console.log("👤 User:", {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      guest: user.guest,
      role: user.role,
    });

    console.log("\n📊 Checking subscriptions...");
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${subscriptions.length} subscription(s):`);
    subscriptions.forEach((sub, i) => {
      const isActive =
        sub.status === "active" && sub.currentPeriodEnd >= new Date();
      console.log(`  ${i + 1}. ${isActive ? "✅" : "❌"} Subscription:`, {
        id: sub.id,
        plan: sub.plan,
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
        isActive,
        isExpired: sub.currentPeriodEnd < new Date(),
      });
    });

    console.log("\n🎟️  Checking VIP tokens...");
    const tokens = await prisma.vIPToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${tokens.length} token(s):`);
    tokens.forEach((token, i) => {
      const isValid =
        token.expiresAt >= new Date() && token.used < token.quantity;
      console.log(`  ${i + 1}. ${isValid ? "✅" : "❌"} Token:`, {
        id: token.id,
        type: token.type,
        used: token.used,
        quantity: token.quantity,
        remaining: token.quantity - token.used,
        expiresAt: token.expiresAt.toISOString(),
        isExpired: token.expiresAt < new Date(),
        isExhausted: token.used >= token.quantity,
        isValid,
      });
    });

    // Final determination
    const activeSubscription = subscriptions.find(
      (sub) => sub.status === "active" && sub.currentPeriodEnd >= new Date()
    );
    const validToken = tokens.find(
      (token) => token.expiresAt >= new Date() && token.used < token.quantity
    );

    console.log("\n=== FINAL VIP STATUS ===");
    console.log(
      `Has VIP Access: ${activeSubscription || validToken ? "✅ YES" : "❌ NO"}`
    );
    if (activeSubscription) {
      console.log(`Reason: Active ${activeSubscription.plan} subscription`);
    } else if (validToken) {
      console.log(
        `Reason: Valid ${validToken.type} token (${
          validToken.quantity - validToken.used
        } uses remaining)`
      );
    } else {
      console.log("Reason: No active subscription or valid token");
    }
  } catch (error) {
    console.error("Error checking VIP status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
const email = process.argv[2];
checkVIPStatus(email);
