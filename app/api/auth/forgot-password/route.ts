import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/redis";
import { EmailService } from "@/lib/email";
import { getClientIp } from "@/lib/utils";
import crypto from "crypto";

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Generate a 6-digit code
function generateResetCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit.check(
      `forgot-password:ip:${ip}`,
      5,
      900000
    ); // 5 per 15 min

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Too many password reset attempts. Please try again later.",
          },
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = forgotPasswordSchema.parse(body);

    // Rate limiting by email
    const emailRateLimit = await rateLimit.check(
      `forgot-password:email:${validatedData.email}`,
      3,
      3600000
    ); // 3 per hour
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Too many password reset attempts for this email. Please try again later.",
          },
        },
        { status: 429 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user || !user.passwordHash || user.deletedAt) {
      // Still return success but don't send email
      return NextResponse.json({
        success: true,
        data: {
          message:
            "If an account matches that email, a reset link has been sent.",
        },
      });
    }

    // Generate reset code
    const resetCode = generateResetCode();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetCode,
        expiresAt,
        ipAddress: ip,
      },
    });

    // Send password reset email
    try {
      await EmailService.sendPasswordResetEmail(
        user.email!,
        user.displayName || "User",
        resetCode
      );
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Failed to send reset email. Please try again later.",
          },
        },
        { status: 500 }
      );
    }

    // Track password reset request
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId: user.id,
          type: "password_reset_requested",
          payload: {
            email: user.email,
            timestamp: new Date().toISOString(),
          },
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      });
    } catch (error) {
      console.error("Failed to track password reset analytics:", error);
    }

    return NextResponse.json({
      success: true,
      data: {
        message:
          "If an account matches that email, a reset link has been sent.",
      },
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { message: error.errors[0].message },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { message: "Internal server error" },
      },
      { status: 500 }
    );
  }
}
