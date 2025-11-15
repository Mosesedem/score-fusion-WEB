import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { EmailService } from "@/lib/email";

// Schema for token generation
const tokenGenerationSchema = z.object({
  userId: z.string().uuid(),
  quantity: z.number().positive().int().max(100),
  type: z.enum(["general", "single", "bundle"]).default("general"),
  tipId: z.string().uuid().optional(),
  expirationDays: z.number().positive().int().default(30),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { error, session } = await requireAdmin();

    if (error || !session) {
      return (
        error ||
        NextResponse.json(
          { success: false, error: "Admin access required" },
          { status: 403 }
        )
      );
    }

    const body = await request.json();
    const validatedData = tokenGenerationSchema.parse(body);

    const { userId, quantity, type, tipId, expirationDays, reason } =
      validatedData;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // If type is single, verify tip exists
    if (type === "single" && tipId) {
      const tip = await prisma.tip.findUnique({
        where: { id: tipId },
      });

      if (!tip) {
        return NextResponse.json(
          { success: false, error: "Tip not found" },
          { status: 404 }
        );
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    const batchId = `admin_batch_${Date.now()}`;

    // Create tokens
    const tokens = await Promise.all(
      Array.from({ length: quantity }).map(() =>
        prisma.vIPToken.create({
          data: {
            userId,
            tipId: type === "single" ? tipId : null,
            type,
            quantity: 1,
            used: 0,
            expiresAt,
            batchId,
            metadata: {
              createdBy: session.user.id,
              createdByName: session.user.displayName || session.user.name,
              reason: reason || "Admin generated",
            },
          },
        })
      )
    );

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "generate_vip_tokens",
        resource: userId,
        details: {
          quantity,
          type,
          tipId,
          expirationDays,
          batchId,
          reason,
          tokenIds: tokens.map((t: { id: string }) => t.id),
          createdBy: session.user.displayName || session.user.name,
        },
      },
    });

    // Send email notification to user with tokens
    if (user.email) {
      try {
        await EmailService.sendVIPTokenEmail(
          user.email,
          user.displayName || user.name || "User",
          tokens.map((t: { token: string }) => t.token),
          expirationDays,
          reason || "Admin generated VIP access"
        );
      } catch (emailError) {
        console.error("Failed to send token email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${quantity} VIP token${
        quantity > 1 ? "s" : ""
      }`,
      data: {
        tokens,
        batchId,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName || user.name,
        },
      },
    });
  } catch (error) {
    console.error("Admin token generation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Get user's VIP tokens
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { error, session } = await requireAdmin();

    if (error || !session) {
      return (
        error ||
        NextResponse.json(
          { success: false, error: "Admin access required" },
          { status: 403 }
        )
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    const tokens = await prisma.vIPToken.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const stats = {
      total: tokens.length,
      active: tokens.filter(
        (t: { used: number; quantity: number; expiresAt: Date }) =>
          t.used < t.quantity && t.expiresAt > new Date()
      ).length,
      used: tokens.filter(
        (t: { used: number; quantity: number }) => t.used >= t.quantity
      ).length,
      expired: tokens.filter(
        (t: { expiresAt: Date; used: number; quantity: number }) =>
          t.expiresAt <= new Date() && t.used < t.quantity
      ).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        tokens,
        stats,
      },
    });
  } catch (error) {
    console.error("Admin get tokens error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
