import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        { error: "Type parameter is required" },
        { status: 400 }
      );
    }

    const carousels = await prisma.carousel.findMany({
      where: {
        type: type as any,
        isActive: true,
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ carousels });
  } catch (error) {
    console.error("Carousels fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch carousels" },
      { status: 500 }
    );
  }
}
