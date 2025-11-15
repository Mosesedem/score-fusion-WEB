import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Query schema for public blog listing
const blogsQuerySchema = z.object({
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("10"),
  tag: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["publishedAt", "viewCount", "createdAt"])
    .default("publishedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedQuery = blogsQuerySchema.parse(query);

    // Build where clause - only published blogs
    const where: Record<string, unknown> = {
      status: "published",
      publishedAt: { not: null },
    };

    if (validatedQuery.search) {
      where.OR = [
        { title: { mode: "insensitive", contains: validatedQuery.search } },
        { excerpt: { mode: "insensitive", contains: validatedQuery.search } },
        { content: { mode: "insensitive", contains: validatedQuery.search } },
      ];
    }

    if (validatedQuery.tag) {
      where.tags = { has: validatedQuery.tag };
    }

    // Get pagination info
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = Math.min(validatedQuery.limit, 50); // Limit for public API

    // Build order by
    const orderBy: Record<string, "asc" | "desc"> = {};
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder;

    // Query published blogs
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          authorName: true,
          headerImage: true,
          publishedAt: true,
          tags: true,
          viewCount: true,
          createdAt: true,
        },
      }),
      prisma.blog.count({ where }),
    ]);

    const hasMore = skip + blogs.length < total;

    return NextResponse.json({
      success: true,
      data: {
        blogs,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          hasMore,
          totalPages: Math.ceil(total / validatedQuery.limit),
        },
      },
    });
  } catch (error) {
    console.error("Public blogs GET error:", error);

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
