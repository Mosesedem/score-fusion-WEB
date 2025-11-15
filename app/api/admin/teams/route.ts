import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

// Team create/update schema
const teamSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  shortName: z.string().optional(),
  sportId: z.string().uuid(),
  league: z.string().optional(),
  country: z.string().optional(),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  externalId: z.string().optional(),
  metadata: z.any().optional(),
});

const teamQuerySchema = z.object({
  sportId: z.string().uuid().optional(),
  league: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("50"),
});

// GET - List teams
export async function GET(request: NextRequest) {
  console.log("=== GET /api/teams - Request Started ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Request URL:", request.url);

  try {
    console.log("Checking admin authentication...");
    const { error, session } = await requireAdmin();

    if (error || !session) {
      console.log(
        "❌ Authentication failed:",
        error ? "Error returned" : "No session"
      );
      return error as NextResponse;
    }

    console.log("✅ Admin authenticated:", {
      userId: session.user.id,
      userEmail: session.user.email,
    });

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    console.log("Query parameters:", query);

    const validatedQuery = teamQuerySchema.parse(query);
    console.log("Validated query:", validatedQuery);

    const where: {
      sportId?: string;
      league?: { mode: "insensitive"; contains: string };
      OR?: Array<{
        name?: { mode: "insensitive"; contains: string };
        shortName?: { mode: "insensitive"; contains: string };
      }>;
    } = {};

    if (validatedQuery.sportId) {
      where.sportId = validatedQuery.sportId;
      console.log("Filtering by sportId:", validatedQuery.sportId);
    }

    if (validatedQuery.league) {
      where.league = { mode: "insensitive", contains: validatedQuery.league };
      console.log("Filtering by league:", validatedQuery.league);
    }

    if (validatedQuery.search) {
      where.OR = [
        { name: { mode: "insensitive", contains: validatedQuery.search } },
        { shortName: { mode: "insensitive", contains: validatedQuery.search } },
      ];
      console.log("Filtering by search term:", validatedQuery.search);
    }

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = validatedQuery.limit;
    console.log("Pagination:", {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      skip,
      take,
    });

    console.log(
      "Executing database query with where clause:",
      JSON.stringify(where, null, 2)
    );

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take,
        include: {
          sport: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
      }),
      prisma.team.count({ where }),
    ]);

    console.log("✅ Query successful:", {
      teamsFound: teams.length,
      totalCount: total,
      totalPages: Math.ceil(total / validatedQuery.limit),
    });

    console.log("=== GET /api/teams - Request Completed Successfully ===\n");

    return NextResponse.json({
      success: true,
      data: {
        teams,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages: Math.ceil(total / validatedQuery.limit),
        },
      },
    });
  } catch (error) {
    console.error("❌ Teams fetch error:", error);

    if (error instanceof z.ZodError) {
      console.error("Validation error details:", error.errors);
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error(
      "Unexpected error type:",
      error instanceof Error ? error.message : error
    );
    console.log("=== GET /api/teams - Request Failed ===\n");

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create team
export async function POST(request: NextRequest) {
  console.log("=== POST /api/teams - Request Started ===");
  console.log("Timestamp:", new Date().toISOString());

  try {
    console.log("Checking admin authentication...");
    const { error, session } = await requireAdmin();

    if (error || !session) {
      console.log("❌ Authentication failed");
      return error as NextResponse;
    }

    console.log("✅ Admin authenticated:", {
      userId: session.user.id,
      userEmail: session.user.email,
    });

    const body = await request.json();
    console.log("Request body received:", JSON.stringify(body, null, 2));

    const validatedData = teamSchema.parse(body);
    console.log("✅ Data validated successfully");

    console.log("Checking if sport exists:", validatedData.sportId);
    const sport = await prisma.sport.findUnique({
      where: { id: validatedData.sportId },
    });

    if (!sport) {
      console.log("❌ Sport not found:", validatedData.sportId);
      return NextResponse.json(
        { success: false, error: "Sport not found" },
        { status: 404 }
      );
    }

    console.log("✅ Sport found:", { id: sport.id, name: sport.name });

    console.log("Creating team with data:", {
      name: validatedData.name,
      shortName: validatedData.shortName,
      sportId: validatedData.sportId,
      league: validatedData.league,
      country: validatedData.country,
    });

    const team = await prisma.team.create({
      data: {
        name: validatedData.name,
        shortName: validatedData.shortName,
        sportId: validatedData.sportId,
        league: validatedData.league,
        country: validatedData.country,
        logoUrl: validatedData.logoUrl,
        isActive: validatedData.isActive,
        externalId: validatedData.externalId,
        metadata: validatedData.metadata,
      },
      include: {
        sport: true,
      },
    });

    console.log("✅ Team created successfully:", {
      teamId: team.id,
      teamName: team.name,
    });

    console.log("Creating audit log...");
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "create_team",
        resource: team.id,
        details: {
          teamName: team.name,
          sport: sport.name,
        },
      },
    });

    console.log("✅ Audit log created");
    console.log("=== POST /api/teams - Request Completed Successfully ===\n");

    return NextResponse.json({
      success: true,
      data: { team },
    });
  } catch (error) {
    console.error("❌ Team creation error:", error);

    if (error instanceof z.ZodError) {
      console.error("Validation error details:", error.errors);
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error(
      "Unexpected error type:",
      error instanceof Error ? error.message : error
    );
    console.log("=== POST /api/teams - Request Failed ===\n");

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update team
export async function PATCH(request: NextRequest) {
  console.log("=== PATCH /api/teams - Request Started ===");
  console.log("Timestamp:", new Date().toISOString());

  try {
    console.log("Checking admin authentication...");
    const { error, session } = await requireAdmin();

    if (error || !session) {
      console.log("❌ Authentication failed");
      return error as NextResponse;
    }

    console.log("✅ Admin authenticated:", {
      userId: session.user.id,
      userEmail: session.user.email,
    });

    const body = await request.json();
    console.log("Request body received:", JSON.stringify(body, null, 2));

    const validatedData = teamSchema.parse(body);
    console.log("✅ Data validated successfully");

    if (!validatedData.id) {
      console.log("❌ Team ID missing in request");
      return NextResponse.json(
        { success: false, error: "Team ID required for update" },
        { status: 400 }
      );
    }

    console.log("Checking if team exists:", validatedData.id);
    const existingTeam = await prisma.team.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingTeam) {
      console.log("❌ Team not found:", validatedData.id);
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    console.log("✅ Team found:", {
      teamId: existingTeam.id,
      currentName: existingTeam.name,
    });

    console.log("Updating team with data:", {
      name: validatedData.name,
      shortName: validatedData.shortName,
      sportId: validatedData.sportId,
      league: validatedData.league,
      country: validatedData.country,
      isActive: validatedData.isActive,
    });

    const team = await prisma.team.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        shortName: validatedData.shortName,
        sportId: validatedData.sportId,
        league: validatedData.league,
        country: validatedData.country,
        logoUrl: validatedData.logoUrl,
        isActive: validatedData.isActive,
        externalId: validatedData.externalId,
        metadata: validatedData.metadata,
      },
      include: {
        sport: true,
      },
    });

    console.log("✅ Team updated successfully:", {
      teamId: team.id,
      newName: team.name,
    });

    console.log("Creating audit log...");
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "update_team",
        resource: team.id,
        details: {
          teamName: team.name,
          changes: validatedData,
        },
      },
    });

    console.log("✅ Audit log created");
    console.log("=== PATCH /api/teams - Request Completed Successfully ===\n");

    return NextResponse.json({
      success: true,
      data: { team },
    });
  } catch (error) {
    console.error("❌ Team update error:", error);

    if (error instanceof z.ZodError) {
      console.error("Validation error details:", error.errors);
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error(
      "Unexpected error type:",
      error instanceof Error ? error.message : error
    );
    console.log("=== PATCH /api/teams - Request Failed ===\n");

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete team
export async function DELETE(request: NextRequest) {
  console.log("=== DELETE /api/teams - Request Started ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Request URL:", request.url);

  try {
    console.log("Checking admin authentication...");
    const { error, session } = await requireAdmin();

    if (error || !session) {
      console.log("❌ Authentication failed");
      return error as NextResponse;
    }

    console.log("✅ Admin authenticated:", {
      userId: session.user.id,
      userEmail: session.user.email,
    });

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("id");
    console.log("Team ID from query params:", teamId);

    if (!teamId) {
      console.log("❌ Team ID missing in query parameters");
      return NextResponse.json(
        { success: false, error: "Team ID required" },
        { status: 400 }
      );
    }

    console.log("Checking if team exists:", teamId);
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      console.log("❌ Team not found:", teamId);
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    console.log("✅ Team found:", {
      teamId: team.id,
      teamName: team.name,
    });

    console.log("Deleting team:", teamId);
    await prisma.team.delete({
      where: { id: teamId },
    });

    console.log("✅ Team deleted successfully");

    console.log("Creating audit log...");
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "delete_team",
        resource: teamId,
        details: {
          teamName: team.name,
        },
      },
    });

    console.log("✅ Audit log created");
    console.log("=== DELETE /api/teams - Request Completed Successfully ===\n");

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("❌ Team deletion error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.log("=== DELETE /api/teams - Request Failed ===\n");

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
