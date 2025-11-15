import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/redis";
import { PasswordManager } from "@/lib/auth";
import { EmailService } from "@/lib/email";
import { getClientIp } from "@/lib/utils";

// Validation schema
const resetPasswordSchema = z.object({
  token: z.string().regex(/^\d{5,6}$/, "Invalid reset code format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit.check(
      `reset-password:ip:${ip}`,
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
    const validatedData = resetPasswordSchema.parse(body);

    // Validate password strength
    const passwordValidation = PasswordManager.validateStrength(
      validatedData.password
    );
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: { message: passwordValidation.errors.join(", ") },
        },
        { status: 400 }
      );
    }

    // Check if token exists and is valid in database
    const resetToken = await prisma.passwordReset.findUnique({
      where: {
        token: validatedData.token,
      },
      include: {
        user: true,
      },
    });

    if (!resetToken || resetToken.usedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid or expired reset code" },
        },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Reset code has expired. Please request a new one.",
          },
        },
        { status: 400 }
      );
    }

    const user = resetToken.user;

    if (user.deletedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "User not found" },
        },
        { status: 404 }
      );
    }

    // Hash new password
    const newPasswordHash = await PasswordManager.hash(validatedData.password);

    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          loginAttempts: 0, // Reset failed login attempts
          lockedUntil: null, // Unlock account if it was locked
        },
      }),
      prisma.passwordReset.update({
        where: { token: validatedData.token },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    // Send confirmation email
    try {
      await EmailService.sendPasswordResetConfirmation(
        user.email!,
        user.displayName || "User"
      );
    } catch (emailError) {
      console.error(
        "Failed to send password reset confirmation email:",
        emailError
      );
      // Don't fail the request if email fails
    }

    // Track password reset completion
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId: user.id,
          type: "password_reset_completed",
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
          "Password reset successfully. You can now log in with your new password.",
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);

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
