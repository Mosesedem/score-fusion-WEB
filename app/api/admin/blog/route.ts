import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

// Blog creation/update schema
const blogSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  content: z.string().min(10, "Content must be at least 10 characters"),
  excerpt: z.string().optional(),
  headerImage: z.string().url().optional().or(z.literal("")),
  images: z.array(z.string().url()).default([]),
  authorId: z.string().uuid().optional(),
  authorName: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

// Query schema
const blogsQuerySchema = z.object({
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("20"),
  search: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  authorId: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "publishedAt", "viewCount", "title"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedQuery = blogsQuerySchema.parse(query);

    // Build where clause
    const where: Record<string, unknown> = {};

    if (validatedQuery.search) {
      where.OR = [
        { title: { mode: "insensitive", contains: validatedQuery.search } },
        { content: { mode: "insensitive", contains: validatedQuery.search } },
        { excerpt: { mode: "insensitive", contains: validatedQuery.search } },
      ];
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    if (validatedQuery.authorId) {
      where.authorId = validatedQuery.authorId;
    }

    // Get pagination info
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = Math.min(validatedQuery.limit, 100);

    // Build order by
    const orderBy: Record<string, "asc" | "desc"> = {};
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder;

    // Query blogs
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take,
        orderBy,
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
    console.error("Admin blogs GET error:", error);

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

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const body = await request.json();

    // Validate input
    const validatedData = blogSchema.parse(body);

    // Check if slug is unique
    const existingBlog = await prisma.blog.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingBlog) {
      return NextResponse.json(
        { success: false, error: "Blog with this slug already exists" },
        { status: 400 }
      );
    }

    // Create blog
    const blog = await prisma.blog.create({
      data: {
        ...validatedData,
        excerpt: validatedData.excerpt || "",
        publishedAt: validatedData.publishedAt
          ? new Date(validatedData.publishedAt)
          : validatedData.status === "published"
          ? new Date()
          : null,
        authorId: validatedData.authorId || session.user.id,
        authorName: validatedData.authorName || session.user.displayName,
      },
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "create_blog",
        resource: blog.id,
        details: {
          title: blog.title,
          slug: blog.slug,
          status: blog.status,
        },
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Blog post created successfully",
      data: { blog },
    });
  } catch (error) {
    console.error("Admin blogs POST error:", error);

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

export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("id");

    if (!blogId) {
      return NextResponse.json(
        { success: false, error: "Blog ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = blogSchema.parse(body);

    // Check if slug is unique (excluding current blog)
    const existingBlog = await prisma.blog.findFirst({
      where: {
        slug: validatedData.slug,
        id: { not: blogId },
      },
    });

    if (existingBlog) {
      return NextResponse.json(
        { success: false, error: "Blog with this slug already exists" },
        { status: 400 }
      );
    }

    // Update blog
    const blog = await prisma.blog.update({
      where: { id: blogId },
      data: {
        ...validatedData,
        publishedAt: validatedData.publishedAt
          ? new Date(validatedData.publishedAt)
          : validatedData.status === "published" && !validatedData.publishedAt
          ? new Date()
          : undefined,
      },
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "update_blog",
        resource: blog.id,
        details: {
          title: blog.title,
          slug: blog.slug,
          updatedFields: Object.keys(validatedData),
        },
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Blog post updated successfully",
      data: { blog },
    });
  } catch (error) {
    console.error("Admin blogs PUT error:", error);

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

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;

    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("id");

    if (!blogId) {
      return NextResponse.json(
        { success: false, error: "Blog ID required" },
        { status: 400 }
      );
    }

    // Get blog details for audit log
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Delete blog
    await prisma.blog.delete({
      where: { id: blogId },
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "delete_blog",
        resource: blogId,
        details: {
          title: blog.title,
          slug: blog.slug,
        },
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    console.error("Admin blogs DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
