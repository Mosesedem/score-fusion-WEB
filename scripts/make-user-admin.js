#!/usr/bin/env node

/**
 * Script to promote an existing user to admin
 * Usage: node scripts/make-user-admin.js <email>
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function makeUserAdmin() {
  try {
    const email = process.argv[2];

    if (!email) {
      console.error("\n❌ Please provide an email address");
      console.log("Usage: node scripts/make-user-admin.js <email>\n");
      process.exit(1);
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.error(`\n❌ User with email "${email}" not found\n`);
      process.exit(1);
    }

    if (user.role === "ADMIN") {
      console.log(`\n✅ User "${email}" is already an admin\n`);
      process.exit(0);
    }

    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role: "ADMIN" },
    });

    console.log("\n✅ User promoted to admin successfully!");
    console.log("\nUser Details:");
    console.log(`  ID: ${updatedUser.id}`);
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Display Name: ${updatedUser.displayName}`);
    console.log(`  Role: ${updatedUser.role}`);
    console.log(
      `\n🎉 Please log out and log back in for changes to take effect\n`
    );
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeUserAdmin();
