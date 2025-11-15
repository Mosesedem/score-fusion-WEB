import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { userId, expirationDays, quantity, used, reason } = await req.json();
    const { id: tokenId } = await params;

    // Validate inputs
    if (quantity !== undefined && quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    if (used !== undefined && used < 0) {
      return NextResponse.json(
        { error: "Used count cannot be negative" },
        { status: 400 }
      );
    }

    if (quantity !== undefined && used !== undefined && used > quantity) {
      return NextResponse.json(
        { error: "Used count cannot exceed quantity" },
        { status: 400 }
      );
    }

    // Get existing token
    const existingToken = await prisma.vIPToken.findUnique({
      where: { id: tokenId },
    });

    if (!existingToken) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Calculate new expiration date if provided
    let newExpiresAt: Date | undefined;
    if (expirationDays !== undefined) {
      newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + expirationDays);
    }

    // Update metadata if reason is provided
    const metadata = (existingToken.metadata as Record<string, unknown>) || {};
    if (reason !== undefined) {
      metadata.reason = reason;
      metadata.lastEditedBy = session.user.name || session.user.email;
      metadata.lastEditedAt = new Date().toISOString();
    }

    const updatedToken = await prisma.vIPToken.update({
      where: { id: tokenId },
      data: {
        ...(userId !== undefined && { userId }),
        ...(newExpiresAt && { expiresAt: newExpiresAt }),
        ...(quantity !== undefined && { quantity }),
        ...(used !== undefined && { used }),
        ...(reason !== undefined && {
          metadata: metadata as Prisma.InputJsonValue,
        }),
      },
      include: {
        user: {
          select: {
            email: true,
            displayName: true,
            name: true,
          },
        },
      },
    });

    // Log the update in audit table
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "TOKEN_UPDATED",
        resource: updatedToken.id,
        details: {
          tokenId: updatedToken.id,
          token: updatedToken.token,
          changes: {
            ...(userId !== undefined && { userId }),
            ...(expirationDays !== undefined && { expirationDays }),
            ...(quantity !== undefined && { quantity }),
            ...(used !== undefined && { used }),
            ...(reason !== undefined && { reason }),
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { token: updatedToken },
    });
  } catch (error) {
    console.error("Token update error:", error);
    return NextResponse.json(
      { error: "Failed to update token" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: tokenId } = await params;

    // Get token before deleting for audit log
    const token = await prisma.vIPToken.findUnique({
      where: { id: tokenId },
    });

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Delete token
    await prisma.vIPToken.delete({
      where: { id: tokenId },
    });

    // Log the deletion
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "TOKEN_DELETED",
        resource: token.id,
        details: {
          tokenId: token.id,
          token: token.token,
          userId: token.userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Token deleted successfully",
    });
  } catch (error) {
    console.error("Token deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete token" },
      { status: 500 }
    );
  }
}
