import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/utils";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit.check(`login:ip:${ip}`, 20, 900000); // 20 per 15 min

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many login attempts. Please try again later.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
      include: { profile: true },
    });

    if (!user || !user.passwordHash) {
      // Track failed login attempt
      try {
        await prisma.analyticsEvent.create({
          data: {
            type: "login_failed",
            payload: {
              email: validatedData.email,
              error: "Invalid credentials",
              timestamp: new Date().toISOString(),
            },
            ipAddress: ip,
            userAgent: request.headers.get("user-agent") || undefined,
          },
        });
      } catch (error) {
        console.error("Failed to track failed login:", error);
      }

      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Account temporarily locked. Please try again later.",
        },
        { status: 423 }
      );
    }

    // Check if account is soft deleted
    if (user.deletedAt) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      // Increment failed attempts
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: { increment: 1 },
          lockedUntil:
            user.loginAttempts >= 4
              ? new Date(Date.now() + 15 * 60 * 1000)
              : undefined, // 15 min lock
        },
      });

      // Track failed login attempt
      try {
        await prisma.analyticsEvent.create({
          data: {
            type: "login_failed",
            payload: {
              email: validatedData.email,
              error: "Invalid password",
              timestamp: new Date().toISOString(),
            },
            ipAddress: ip,
            userAgent: request.headers.get("user-agent") || undefined,
          },
        });
      } catch (error) {
        console.error("Failed to track failed login:", error);
      }

      if (updatedUser.loginAttempts >= 5) {
        return NextResponse.json(
          {
            success: false,
            error: "Account locked due to too many failed attempts",
          },
          { status: 423 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Update last login and reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Track successful login analytics
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId: user.id,
          type: "login_success",
          payload: {
            email: validatedData.email,
            rememberMe: validatedData.rememberMe,
            timestamp: new Date().toISOString(),
          },
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      });
    } catch (error) {
      console.error("Failed to track login analytics:", error);
    }

    // Return success - NextAuth will handle session management
    // Client should call signIn from next-auth/react with these credentials
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.role === "ADMIN",
        profile: user.profile,
      },
      message: "Login successful. Please sign in with NextAuth.",
    });
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
