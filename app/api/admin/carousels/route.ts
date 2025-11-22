import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all carousels
export async function GET(request: Request) {
  try {
    // TODO: Verify admin auth

    const carousels = await prisma.carousel.findMany({
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

// POST create new carousel
export async function POST(request: Request) {
  try {
    // TODO: Verify admin auth

    const body = await request.json();
    const { title, imageUrl, altText, type, isActive, order } = body;

    if (!imageUrl || !type) {
      return NextResponse.json(
        { error: "Image URL and type are required" },
        { status: 400 }
      );
    }

    const carousel = await prisma.carousel.create({
      data: {
        title: title || null,
        imageUrl,
        altText: altText || null,
        type,
        isActive: isActive ?? true,
        order: order ?? 0,
      },
    });

    return NextResponse.json({ carousel }, { status: 201 });
  } catch (error) {
    console.error("Carousel creation error:", error);
    return NextResponse.json(
      { error: "Failed to create carousel" },
      { status: 500 }
    );
  }
}

// PATCH update carousel
export async function PATCH(request: Request) {
  try {
    // TODO: Verify admin auth

    const body = await request.json();
    const { id, title, imageUrl, altText, type, isActive, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Carousel ID is required" },
        { status: 400 }
      );
    }

    const carousel = await prisma.carousel.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(altText !== undefined && { altText }),
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({ carousel });
  } catch (error) {
    console.error("Carousel update error:", error);
    return NextResponse.json(
      { error: "Failed to update carousel" },
      { status: 500 }
    );
  }
}

// DELETE carousel
export async function DELETE(request: Request) {
  try {
    // TODO: Verify admin auth

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Carousel ID is required" },
        { status: 400 }
      );
    }

    await prisma.carousel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Carousel delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete carousel" },
      { status: 500 }
    );
  }
}
