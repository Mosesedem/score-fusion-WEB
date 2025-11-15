/**
 * Script to list all users in the database
 * Usage: npx tsx scripts/list-all-users.ts
 */

import { prisma } from "../lib/db";

async function listUsers() {
  try {
    console.log("=== ALL USERS IN DATABASE ===\n");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        guest: true,
        createdAt: true,
        _count: {
          select: {
            subscriptions: true,
            vipTokens: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (users.length === 0) {
      console.log("❌ No users found in database!");
      console.log("\nYou need to:");
      console.log("1. Sign up at http://localhost:3000/signup");
      console.log("2. Or create a user with: npm run create-admin");
      return;
    }

    console.log(`Found ${users.length} user(s):\n`);

    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.guest ? "👤 Guest" : "👨‍💼 User"}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email || "N/A"}`);
      console.log(`   Display Name: ${user.displayName || "N/A"}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Subscriptions: ${user._count.subscriptions}`);
      console.log(`   VIP Tokens: ${user._count.vipTokens}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log("");
    });

    // Find users with subscriptions
    const usersWithSubs = await prisma.user.findMany({
      where: {
        subscriptions: {
          some: {
            status: "active",
            currentPeriodEnd: { gte: new Date() },
          },
        },
      },
      select: {
        email: true,
        subscriptions: {
          where: {
            status: "active",
            currentPeriodEnd: { gte: new Date() },
          },
        },
      },
    });

    if (usersWithSubs.length > 0) {
      console.log("\n=== USERS WITH ACTIVE SUBSCRIPTIONS ===");
      usersWithSubs.forEach((user) => {
        console.log(`✅ ${user.email}`);
        user.subscriptions.forEach((sub) => {
          console.log(
            `   - ${sub.plan} (expires: ${sub.currentPeriodEnd.toISOString()})`
          );
        });
      });
    } else {
      console.log("\n⚠️  No users with active subscriptions found");
    }

    // Find users with tokens
    const usersWithTokens = await prisma.user.findMany({
      where: {
        vipTokens: {
          some: {
            expiresAt: { gte: new Date() },
          },
        },
      },
      select: {
        email: true,
        vipTokens: {
          where: {
            expiresAt: { gte: new Date() },
          },
        },
      },
    });

    if (usersWithTokens.length > 0) {
      console.log("\n=== USERS WITH VIP TOKENS ===");
      usersWithTokens.forEach((user) => {
        console.log(`🎟️  ${user.email}`);
        user.vipTokens.forEach((token) => {
          const available = token.quantity - token.used;
          console.log(
            `   - ${token.type} (${available}/${
              token.quantity
            } uses, expires: ${token.expiresAt.toISOString()})`
          );
        });
      });
    } else {
      console.log("\n⚠️  No users with VIP tokens found");
    }
  } catch (error) {
    console.error("Error listing users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
listUsers();
