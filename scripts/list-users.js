#!/usr/bin/env node

/**
 * Script to list all users in the database
 * Usage: node scripts/list-users.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        guest: false,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (users.length === 0) {
      console.log("\n📭 No users found in the database\n");
      process.exit(0);
    }

    console.log(`\n👥 Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.role === "ADMIN" ? "👑" : "👤"} ${user.email}`
      );
      console.log(`   Name: ${user.displayName || "N/A"}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log("");
    });

    const adminCount = users.filter((u) => u.role === "ADMIN").length;
    console.log(
      `📊 Summary: ${adminCount} admin(s), ${
        users.length - adminCount
      } regular user(s)\n`
    );
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
