#!/usr/bin/env node

/**
 * Script to create an admin user for testing
 * Usage: node scripts/create-admin-user.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdminUser() {
  try {
    console.log("\n🔐 Admin User Creation\n");

    const email = await question("Enter admin email: ");
    const displayName = await question("Enter display name: ");
    const password = await question(
      "Enter password (min 8 chars, 1 uppercase, 1 lowercase, 1 number): "
    );

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email address");
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Validate password
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      throw new Error("Password must contain at least one lowercase letter");
    }
    if (!/\d/.test(password)) {
      throw new Error("Password must contain at least one number");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        displayName,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        profile: {
          create: {},
        },
      },
      include: {
        profile: true,
      },
    });

    console.log("\n✅ Admin user created successfully!");
    console.log("\nUser Details:");
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Display Name: ${user.displayName}`);
    console.log(`  Role: ${user.role}`);
    console.log(`\n🎉 You can now login at /login with these credentials\n`);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdminUser();
