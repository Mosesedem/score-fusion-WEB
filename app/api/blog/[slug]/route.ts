import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find the published blog post by slug
    const blog = await prisma.blog.findFirst({
      where: {
        slug,
        status: "published",
        publishedAt: { not: null },
      },
    });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Increment view count (optional - could be done client-side)
    await prisma.blog.update({
      where: { id: blog.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      data: {
        blog: {
          ...blog,
          viewCount: blog.viewCount + 1, // Return updated count
        },
      },
    });
  } catch (error) {
    console.error("Blog post GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
