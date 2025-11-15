import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

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
    const limit = parseInt(searchParams.get("limit") || "50");
    const userId = searchParams.get("userId");

    const where = userId ? { userId } : {};

    const tokens = await prisma.vIPToken.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        tokens,
        total: tokens.length,
      },
    });
  } catch (error) {
    console.error("Admin list tokens error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
