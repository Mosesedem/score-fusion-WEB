import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all feature flags
export async function GET(request: Request) {
  try {
    // TODO: Verify admin auth

    const flags = await prisma.featureFlag.findMany({
      orderBy: { key: "asc" },
    });

    return NextResponse.json({ flags });
  } catch (error) {
    console.error("Feature flags fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature flags" },
      { status: 500 }
    );
  }
}

// POST create new feature flag
export async function POST(request: Request) {
  try {
    // TODO: Verify admin auth

    const body = await request.json();
    const { key, enabled, variant, rollout } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Flag key is required" },
        { status: 400 }
      );
    }

    const flag = await prisma.featureFlag.create({
      data: {
        key,
        enabled: enabled ?? false,
        variant: variant || null,
        rollout: rollout ?? 0,
      },
    });

    return NextResponse.json({ flag }, { status: 201 });
  } catch (error) {
    console.error("Feature flag creation error:", error);
    return NextResponse.json(
      { error: "Failed to create feature flag" },
      { status: 500 }
    );
  }
}

// PATCH update feature flag
export async function PATCH(request: Request) {
  try {
    // TODO: Verify admin auth

    const body = await request.json();
    const { id, enabled, variant, rollout } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Flag ID is required" },
        { status: 400 }
      );
    }

    const flag = await prisma.featureFlag.update({
      where: { id },
      data: {
        ...(enabled !== undefined && { enabled }),
        ...(variant !== undefined && { variant }),
        ...(rollout !== undefined && { rollout }),
      },
    });

    return NextResponse.json({ flag });
  } catch (error) {
    console.error("Feature flag update error:", error);
    return NextResponse.json(
      { error: "Failed to update feature flag" },
      { status: 500 }
    );
  }
}
