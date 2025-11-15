import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Configuration schema
const configSchema = z.object({
  key: z.string(),
  value: z.any(),
  description: z.string().optional(),
  category: z.string().default("general"),
});

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const auth = await requireAdmin(request);

    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Admin access required" },
        { status: auth.error ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const key = searchParams.get("key");

    // Build where clause
    const where: { category?: string; key?: string } = {};
    if (category) where.category = category;
    if (key) where.key = key;

    const configs = await prisma.adminConfig.findMany({
      where,
      orderBy: { category: "asc", key: "asc" },
    });

    // Group configs by category
    const groupedConfigs: Record<string, typeof configs> = {};
    configs.forEach((config) => {
      if (!groupedConfigs[config.category]) {
        groupedConfigs[config.category] = [];
      }
      groupedConfigs[config.category].push(config);
    });

    return NextResponse.json({
      success: true,
      data: {
        configs: groupedConfigs,
        categories: Object.keys(groupedConfigs),
      },
    });
  } catch (error) {
    console.error("Admin config GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const auth = await requireAdmin(request);

    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Admin access required" },
        { status: auth.error ? 401 : 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = configSchema.parse(body);

    // Create or update configuration
    const config = await prisma.adminConfig.upsert({
      where: { key: validatedData.key },
      update: {
        value: validatedData.value,
        description: validatedData.description,
        category: validatedData.category,
        updatedBy: auth.user.id,
        updatedAt: new Date(),
      },
      create: {
        key: validatedData.key,
        value: validatedData.value,
        description: validatedData.description,
        category: validatedData.category,
        updatedBy: auth.user.id,
      },
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: auth.user.id,
        action: "update_config",
        resource: config.id,
        details: {
          key: validatedData.key,
          category: validatedData.category,
          oldValue: null, // TODO: Track previous value if updating
          newValue: validatedData.value,
        },
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0] ||
          request.headers.get("x-real-ip") ||
          undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configuration updated successfully",
      data: { config },
    });
  } catch (error) {
    console.error("Admin config POST error:", error);

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
    const auth = await requireAdmin(request);

    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Admin access required" },
        { status: auth.error ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("id");

    if (!key) {
      return NextResponse.json(
        { success: false, error: "Configuration key required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Get old config for audit log
    const oldConfig = await prisma.adminConfig.findUnique({
      where: { key },
    });

    if (!oldConfig) {
      return NextResponse.json(
        { success: false, error: "Configuration not found" },
        { status: 404 }
      );
    }

    // Validate input
    const validatedData = configSchema.partial().parse(body);

    // Update configuration
    const config = await prisma.adminConfig.update({
      where: { key },
      data: {
        ...validatedData,
        updatedBy: auth.user.id,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: auth.user.id,
        action: "update_config",
        resource: config.id,
        details: {
          key: config.key,
          oldValue: oldConfig.value,
          newValue: validatedData.value || oldConfig.value,
        },
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0] ||
          request.headers.get("x-real-ip") ||
          undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configuration updated successfully",
      data: { config },
    });
  } catch (error) {
    console.error("Admin config PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const auth = await requireAdmin(request);

    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Admin access required" },
        { status: auth.error ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("id");

    if (!key) {
      return NextResponse.json(
        { success: false, error: "Configuration key required" },
        { status: 400 }
      );
    }

    // Get old config for audit log
    const oldConfig = await prisma.adminConfig.findUnique({
      where: { key },
    });

    if (!oldConfig) {
      return NextResponse.json(
        { success: false, error: "Configuration not found" },
        { status: 404 }
      );
    }

    // Delete configuration
    await prisma.adminConfig.delete({
      where: { key },
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: auth.user.id,
        action: "delete_config",
        resource: oldConfig.id,
        details: {
          key: oldConfig.key,
          oldValue: oldConfig.value,
          category: oldConfig.category,
        },
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0] ||
          request.headers.get("x-real-ip") ||
          undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configuration deleted successfully",
    });
  } catch (error) {
    console.error("Admin config DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
