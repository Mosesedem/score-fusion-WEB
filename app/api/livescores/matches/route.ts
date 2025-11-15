import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { LiveScoreService } from "@/lib/livescores";
import { prisma } from "@/lib/db";
import { APIProviderManager } from "@/lib/api-providers/provider-manager";

// Query schema for matches
const matchesQuerySchema = z.object({
  sport: z.string().optional(),
  status: z
    .enum(["scheduled", "live", "finished", "postponed", "cancelled"])
    .optional(),
  league: z.string().optional(),
  team: z.string().optional(), // Search by team name
  search: z.string().optional(), // General search query
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("20"),
  featured: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  source: z.enum(["api", "database", "auto"]).default("auto"), // Data source preference
});

// Initialize services
const liveScoreService = LiveScoreService.getInstance();
const apiProviderManager = APIProviderManager.getInstance();

// Initialize API providers on module load
apiProviderManager.initialize();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    console.log("[MatchesAPI] GET request received", query);

    // Validate query parameters
    const validatedQuery = matchesQuerySchema.parse(query);
    console.log("[MatchesAPI] Validated query", validatedQuery);

    // Determine data source
    const useAPI =
      validatedQuery.source === "api" ||
      (validatedQuery.source === "auto" && validatedQuery.search);

    console.log("[MatchesAPI] Data source decision", {
      source: validatedQuery.source,
      useAPI,
      hasSearch: !!validatedQuery.search,
    });

    let result;

    if (useAPI) {
      // Fetch from external API with pagination and search
      const filters = {
        sport: validatedQuery.sport,
        league: validatedQuery.league,
        team: validatedQuery.team,
        status: validatedQuery.status,
        dateFrom: validatedQuery.dateFrom
          ? new Date(validatedQuery.dateFrom)
          : undefined,
        dateTo: validatedQuery.dateTo
          ? new Date(validatedQuery.dateTo)
          : undefined,
      };

      const pagination = {
        page: validatedQuery.page,
        limit: Math.min(validatedQuery.limit, 100), // Cap at 100
      };

      console.log("[MatchesAPI] API request params", { filters, pagination });

      try {
        if (validatedQuery.search) {
          // Search matches by query
          console.log("[MatchesAPI] Calling searchMatches");
          result = await apiProviderManager.searchMatches(
            validatedQuery.search,
            filters,
            pagination
          );
        } else if (validatedQuery.status === "live") {
          // Get live matches
          console.log("[MatchesAPI] Calling getLiveMatches");
          result = await apiProviderManager.getLiveMatches(filters, pagination);
        } else if (validatedQuery.status === "scheduled") {
          // Get scheduled matches
          console.log("[MatchesAPI] Calling getScheduledMatches");
          result = await apiProviderManager.getScheduledMatches(
            filters,
            pagination
          );
        } else if (validatedQuery.status === "finished") {
          // Get finished matches
          console.log("[MatchesAPI] Calling getFinishedMatches");
          result = await apiProviderManager.getFinishedMatches(
            filters,
            pagination
          );
        } else if (filters.dateFrom || filters.dateTo) {
          // When date filters are provided but no status, fetch all matches in range
          // This is typically from analytics page
          console.log(
            "[MatchesAPI] Date range provided, calling getScheduledMatches to get all matches in range"
          );
          result = await apiProviderManager.getScheduledMatches(
            filters,
            pagination
          );
        } else {
          // Default to scheduled matches for next 7 days
          console.log("[MatchesAPI] Defaulting to getScheduledMatches");
          result = await apiProviderManager.getScheduledMatches(
            filters,
            pagination
          );
        }
      } catch (apiError) {
        console.error("[MatchesAPI] API provider error:", apiError);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch matches from API provider",
            details:
              apiError instanceof Error ? apiError.message : "Unknown error",
          },
          { status: 500 }
        );
      }

      console.log("[MatchesAPI] API provider result", {
        matchCount: result.data.length,
        pagination: result.pagination,
      });

      // Format API response
      const formattedMatches = result.data.map((match) => ({
        id: match.externalId,
        sport: { name: match.sport, displayName: match.sport },
        league: {
          name: match.league,
          country: match.leagueCountry,
          logo: match.leagueLogo,
        },
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeTeamLogo: match.homeTeamLogo,
        awayTeamLogo: match.awayTeamLogo,
        homeTeamScore: match.homeScore,
        awayTeamScore: match.awayScore,
        venue: match.venue,
        scheduledAt: match.scheduledAt,
        status: match.status,
        period: match.period,
        minute: match.minute,
        odds: match.odds,
        statistics: match.statistics,
        lastUpdatedAt: new Date(),
        recentEvents: match.events,
        live: match.status === "live",
        canBet: ["scheduled", "live"].includes(match.status),
        timeUntilStart:
          match.status === "scheduled"
            ? Math.max(0, match.scheduledAt.getTime() - Date.now())
            : null,
      }));

      console.log(
        "[MatchesAPI] Returning success response with",
        formattedMatches.length,
        "matches"
      );

      return NextResponse.json({
        success: true,
        data: {
          matches: formattedMatches,
          filters: {
            sport: validatedQuery.sport,
            status: validatedQuery.status,
            league: validatedQuery.league,
            search: validatedQuery.search,
            featured: validatedQuery.featured,
          },
          pagination: result.pagination,
          source: "api",
        },
      });
    } else {
      // Fetch from database
      const where: Record<string, unknown> = {};

      if (validatedQuery.status) {
        where.status = validatedQuery.status;
      }

      // Get sport ID if sport name provided
      if (validatedQuery.sport) {
        const sport = await prisma.sport.findFirst({
          where: {
            OR: [
              {
                name: {
                  mode: "insensitive",
                  equals: validatedQuery.sport.toLowerCase(),
                },
              },
              {
                displayName: {
                  mode: "insensitive",
                  equals: validatedQuery.sport,
                },
              },
            ],
          },
        });

        if (sport) {
          where.sportId = sport.id;
        }
      }

      // Team search
      if (validatedQuery.team) {
        where.OR = [
          { homeTeam: { contains: validatedQuery.team, mode: "insensitive" } },
          { awayTeam: { contains: validatedQuery.team, mode: "insensitive" } },
        ];
      }

      // Date filters
      if (validatedQuery.dateFrom || validatedQuery.dateTo) {
        where.scheduledAt = {};
        if (validatedQuery.dateFrom) {
          (where.scheduledAt as Record<string, unknown>).gte = new Date(
            validatedQuery.dateFrom
          );
        }
        if (validatedQuery.dateTo) {
          (where.scheduledAt as Record<string, unknown>).lte = new Date(
            validatedQuery.dateTo
          );
        }
      }

      // Count total matches
      const total = await prisma.match.count({ where });

      // Fetch matches with pagination
      const matches = await prisma.match.findMany({
        where,
        include: {
          sport: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true,
            },
          },
          league: {
            select: {
              id: true,
              name: true,
              country: true,
              logo: true,
            },
          },
          events: {
            take: 5,
            orderBy: { minute: "desc" },
            select: {
              id: true,
              type: true,
              team: true,
              minute: true,
              player: true,
              description: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          scheduledAt: validatedQuery.status === "scheduled" ? "asc" : "desc",
        },
        skip: (validatedQuery.page - 1) * validatedQuery.limit,
        take: Math.min(validatedQuery.limit, 100),
      });

      // Format response
      type DBQueryMatch = (typeof matches)[number];
      const formattedMatches = matches.map((match: DBQueryMatch) => ({
        id: match.id,
        sport: match.sport,
        league: match.league,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeTeamLogo: match.homeTeamLogo,
        awayTeamLogo: match.awayTeamLogo,
        homeTeamScore: match.homeTeamScore,
        awayTeamScore: match.awayTeamScore,
        venue: match.venue,
        scheduledAt: match.scheduledAt,
        status: match.status,
        period: match.period,
        minute: match.minute,
        odds: match.odds,
        statistics: match.statistics,
        lastUpdatedAt: match.lastUpdatedAt,
        recentEvents: match.events,
        live: match.status === "live",
        canBet: ["scheduled", "live"].includes(match.status),
        timeUntilStart:
          match.status === "scheduled"
            ? Math.max(0, new Date(match.scheduledAt).getTime() - Date.now())
            : null,
      }));

      const totalPages = Math.ceil(total / validatedQuery.limit);

      return NextResponse.json({
        success: true,
        data: {
          matches: formattedMatches,
          filters: {
            sport: validatedQuery.sport,
            status: validatedQuery.status,
            league: validatedQuery.league,
            team: validatedQuery.team,
            featured: validatedQuery.featured,
          },
          pagination: {
            page: validatedQuery.page,
            limit: validatedQuery.limit,
            total,
            totalPages,
            hasMore: validatedQuery.page < totalPages,
          },
          source: "database",
        },
      });
    }
  } catch (error) {
    console.error("Live scores GET error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch live scores" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body for actions
    const { action } = body;

    switch (action) {
      case "refresh":
        await liveScoreService.updateAllMatches();
        return NextResponse.json({
          success: true,
          message: "Live scores refreshed successfully",
        });

      case "start":
        await liveScoreService.startUpdates();
        return NextResponse.json({
          success: true,
          message: "Live score updates started",
        });

      case "stop":
        await liveScoreService.stopUpdates();
        return NextResponse.json({
          success: true,
          message: "Live score updates stopped",
        });

      case "status": {
        // Get provider health status
        const healthStatus = await apiProviderManager.getHealthStatus();
        return NextResponse.json({
          success: true,
          data: {
            providers: healthStatus,
            lastUpdate: new Date().toISOString(),
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Live scores POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
