/**
 * Script to create a test user with VIP subscription
 * Usage: npx tsx scripts/create-vip-user.ts
 */

import { prisma } from "../lib/db";
import bcrypt from "bcryptjs";

async function createVIPUser() {
  try {
    const email = "vip@test.com";
    const password = "password123";
    const displayName = "VIP Test User";

    console.log("=== CREATING VIP TEST USER ===\n");

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    let user;
    if (existing) {
      console.log("✅ User already exists:", email);
      user = existing;
    } else {
      console.log("Creating new user...");
      const passwordHash = await bcrypt.hash(password, 10);

      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName,
          role: "USER",
          guest: false,
        },
      });
      console.log("✅ User created:", email);
    }

    console.log("\nUser Details:");
    console.log("  Email:", email);
    console.log("  Password:", password);
    console.log("  ID:", user.id);

    // Create active subscription
    console.log("\nCreating VIP subscription...");
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeSubscriptionId: `test_sub_${Date.now()}`,
        stripeCustomerId: `test_cus_${Date.now()}`,
        plan: "monthly",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancelAtPeriodEnd: false,
      },
    });
    console.log("✅ Subscription created:", subscription.id);
    console.log("  Plan:", subscription.plan);
    console.log("  Status:", subscription.status);
    console.log("  Expires:", subscription.currentPeriodEnd.toISOString());

    // Create VIP token as well
    console.log("\nCreating VIP token...");
    const token = await prisma.vIPToken.create({
      data: {
        userId: user.id,
        token: `VIP-TEST-${Date.now()}`,
        type: "general",
        quantity: 10,
        used: 0,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      },
    });
    console.log("✅ VIP token created:", token.token);
    console.log("  Type:", token.type);
    console.log("  Uses:", `${token.used}/${token.quantity}`);
    console.log("  Expires:", token.expiresAt.toISOString());

    console.log("\n=== SUCCESS! ===");
    console.log("\nYou can now log in with:");
    console.log("  Email:", email);
    console.log("  Password:", password);
    console.log("\nLogin URL: http://localhost:3000/login");
    console.log(
      "\nAfter logging in, visit: http://localhost:3000/vip to see VIP content"
    );
  } catch (error) {
    console.error("❌ Error creating VIP user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createVIPUser();
