import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/utils";
import { prisma } from "@/lib/db";

// Validation schema
const verifyTokenSchema = z.object({
  token: z.string().regex(/^\d{5,6}$/, "Invalid reset code format"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit.check(
      `verify-reset:ip:${ip}`,
      10,
      900000
    ); // 10 per 15 min

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Too many verification attempts. Please try again later.",
          },
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = verifyTokenSchema.parse(body);

    // Check if token exists in database
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

    return NextResponse.json({
      success: true,
      data: {
        message: "Reset code verified successfully",
        valid: true,
      },
    });
  } catch (error) {
    console.error("Verify reset token error:", error);

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
