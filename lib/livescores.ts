import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export interface LiveScoreMatch {
  id: string;
  externalId: string | null;
  sportId: string;
  leagueId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  homeTeamScore: number;
  awayTeamScore: number;
  venue?: string | null;
  scheduledAt: Date;
  status: string;
  period?: string | null;
  minute?: number | null;
  odds?: {
    homeWin?: number;
    draw?: number;
    awayWin?: number;
    [key: string]: number | undefined;
  };
  statistics?: {
    shots?: number;
    corners?: number;
    yellowCards?: number;
    redCards?: number;
    [key: string]: number | undefined;
  };
  lastUpdatedAt: Date;
}

export interface LiveScoreEvent {
  type: string;
  team: "home" | "away";
  minute?: number;
  player?: string;
  description?: string;
}

export interface LiveScoreProvider {
  id?: string;
  name: string;
  displayName: string;
  apiKey?: string | null;
  apiUrl?: string | null;
  isActive: boolean;
  rateLimitMs: number;
  config?: unknown | null;
}

// Minimal shapes for external API payloads we actually use
interface ApiFootballMatchData {
  sport?: { name?: string };
  league?: { name?: string };
  fixture?: {
    id?: number | string;
    venue?: { name?: string };
    date?: string;
    status?: { short?: string; period?: string; elapsed?: number };
  };
  teams?: {
    home?: { name?: string; logo?: string };
    away?: { name?: string; logo?: string };
  };
  goals?: { home?: number; away?: number };
  odds?: {
    predictions?: {
      win_home?: { odds?: number };
      draw?: { odds?: number };
      win_away?: { odds?: number };
    };
  };
  statistics?: {
    Shots?: { total?: Array<number | undefined> };
    Corners?: { total?: Array<number | undefined> };
    YellowCards?: { total?: Array<number | undefined> };
    RedCards?: { total?: Array<number | undefined> };
  };
  events?: Array<{
    type?: string;
    detail?: string;
    team?: "home" | "away" | string;
    time?: { elapsed?: number };
    player?: { name?: string };
  }>;
}

interface TheSportsDBEventData {
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: number;
  intAwayScore?: number;
  dateEvent?: string;
  strStatus?: string;
  idEvent?: number | string;
}

type LiveScoreMatchFull = LiveScoreMatch & {
  sport: { id: string; name: string; displayName: string };
  league: { id: string; name: string; country: string };
  events: Array<LiveScoreEvent & { id?: string }>;
};

export class LiveScoreService {
  private static instance: LiveScoreService;
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): LiveScoreService {
    if (!LiveScoreService.instance) {
      LiveScoreService.instance = new LiveScoreService();
    }
    return LiveScoreService.instance;
  }

  async initialize(): Promise<void> {
    console.log("Initializing Live Score Service...");

    // Create default sports if they don't exist
    await this.createDefaultSports();

    // Create default providers if they don't exist
    await this.createDefaultProviders();

    // Start the update process
    await this.startUpdates();
  }

  async createDefaultSports(): Promise<void> {
    const defaultSports = [
      { name: "football", displayName: "Football", sortOrder: 1, icon: "⚽" },
      {
        name: "basketball",
        displayName: "Basketball",
        sortOrder: 2,
        icon: "🏀",
      },
      { name: "tennis", displayName: "Tennis", sortOrder: 3, icon: "🎾" },
      { name: "baseball", displayName: "Baseball", sortOrder: 4, icon: "⚾" },
      { name: "hockey", displayName: "Hockey", sortOrder: 5, icon: "🏒" },
      { name: "cricket", displayName: "Cricket", sortOrder: 6, icon: "🏏" },
      { name: "rugby", displayName: "Rugby", sortOrder: 7, icon: "🏉" },
      { name: "mma", displayName: "MMA", sortOrder: 8, icon: "🥊" },
      { name: "boxing", displayName: "Boxing", sortOrder: 9, icon: "🥊" },
      {
        name: "volleyball",
        displayName: "Volleyball",
        sortOrder: 10,
        icon: "🏐",
      },
    ];

    for (const sport of defaultSports) {
      await prisma.sport.upsert({
        where: { name: sport.name },
        update: sport,
        create: sport,
      });
    }
  }

  async createDefaultProviders(): Promise<void> {
    const defaultProviders = [
      {
        name: "api_football",
        displayName: "API-Football",
        apiUrl: "https://v3.football.api-sports.io",
        rateLimitMs: 1000,
        config: {
          sports: ["football"],
          coverage: "all",
        },
      },
      {
        name: "the_sports_db",
        displayName: "TheSportsDB",
        apiUrl: "https://www.thesportsdb.com/api/v1/json/3",
        rateLimitMs: 2000,
        config: {
          apiKey: process.env.THESPORTSDB_API_KEY,
        },
      },
    ];

    for (const provider of defaultProviders) {
      await prisma.liveScoreProvider.upsert({
        where: { name: provider.name },
        update: provider,
        create: provider,
      });
    }
  }

  async startUpdates(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log("Starting live score updates...");

    // Update every 30 seconds
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateAllMatches();
      } catch (error) {
        console.error("Error updating live scores:", error);
      }
    }, 30000);

    // Initial update
    await this.updateAllMatches();
  }

  async stopUpdates(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log("Stopped live score updates");
  }

  async updateAllMatches(): Promise<void> {
    console.log("Updating live scores...");

    // Get active providers
    const providers = await prisma.liveScoreProvider.findMany({
      where: { isActive: true },
    });

    for (const provider of providers) {
      try {
        await this.updateMatchesFromProvider(provider);
      } catch (error) {
        console.error(`Error updating from provider ${provider.name}:`, error);
      }
    }
  }

  private async updateMatchesFromProvider(
    provider: LiveScoreProvider
  ): Promise<void> {
    switch (provider.name) {
      case "api_football":
        await this.updateFromApiFootball(provider);
        break;
      case "the_sports_db":
        await this.updateFromTheSportsDB(provider);
        break;
      default:
        console.log(
          `No update method implemented for provider: ${provider.name}`
        );
    }
  }

  private async updateFromApiFootball(
    provider: LiveScoreProvider
  ): Promise<void> {
    const config =
      provider && typeof provider.config === "object" && provider.config
        ? (provider.config as Record<string, unknown>)
        : undefined;
    const sportsVal = config ? config["sports"] : undefined;
    const sports = Array.isArray(sportsVal)
      ? (sportsVal as string[])
      : undefined;
    if (!sports || sports.length === 0) {
      return;
    }

    const apiUrl = provider.apiUrl;
    const apiKeyVal = config ? config["apiKey"] : undefined;
    const apiKey = typeof apiKeyVal === "string" ? apiKeyVal : undefined;

    for (const sportCode of sports) {
      try {
        // Get live matches for the sport
        const response = await fetch(
          `${apiUrl}/fixtures?live=all&sport=${sportCode}`,
          {
            headers: apiKey ? { "x-apisports-key": apiKey } : undefined,
          }
        );

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const matches = data.response || [];

        for (const matchData of matches) {
          await this.processApiFootballMatch(matchData as ApiFootballMatchData);
        }

        // Add rate limiting
        await this.sleep(provider.rateLimitMs);
      } catch (error) {
        console.error(`Error fetching ${sportCode} matches:`, error);
      }
    }
  }

  private async processApiFootballMatch(
    matchData: ApiFootballMatchData
  ): Promise<void> {
    try {
      const sport = await this.getSportByCode(matchData.sport?.name);
      if (!sport) return;

      const leagueName = matchData.league?.name ?? "Unknown League";
      const league = await this.getOrCreateLeague(leagueName, sport.id);
      if (!league) return;

      // Find or create the match
      const existingMatch = await prisma.match.findFirst({
        where: {
          externalId: matchData.fixture?.id?.toString(),
        },
      });

      const matchUpdateData = {
        sportId: sport.id,
        leagueId: league.id,
        homeTeam: matchData.teams?.home?.name || "Unknown",
        awayTeam: matchData.teams?.away?.name || "Unknown",
        homeTeamLogo: matchData.teams?.home?.logo,
        awayTeamLogo: matchData.teams?.away?.logo,
        homeTeamScore: matchData.goals?.home || 0,
        awayTeamScore: matchData.goals?.away || 0,
        venue: matchData.fixture?.venue?.name,
        scheduledAt: new Date(matchData.fixture?.date ?? Date.now()),
        status: this.mapApiFootballStatus(matchData.fixture?.status?.short),
        period: matchData.fixture?.status?.period,
        minute: this.getCurrentMinute(matchData.fixture?.status?.elapsed),
        odds: {
          homeWin: matchData.odds?.predictions?.win_home?.odds,
          draw: matchData.odds?.predictions?.draw?.odds,
          awayWin: matchData.odds?.predictions?.win_away?.odds,
        },
        statistics: {
          shots: matchData.statistics?.Shots?.total?.[0],
          corners: matchData.statistics?.Corners?.total?.[0],
          yellowCards: matchData.statistics?.YellowCards?.total?.[0],
          redCards: matchData.statistics?.RedCards?.total?.[0],
        },
        lastUpdatedAt: new Date(),
      };

      if (existingMatch) {
        // Update existing match
        await prisma.match.update({
          where: { id: existingMatch.id },
          data: matchUpdateData,
        });

        // Process events if match is live
        if (matchUpdateData.status === "live") {
          await this.processMatchEvents(existingMatch.id, matchData);
        }
      } else {
        // Create new match
        await prisma.match.create({
          data: {
            ...matchUpdateData,
            externalId: matchData.fixture?.id?.toString(),
            createdAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error("Error processing API Football match:", error);
    }
  }

  private async updateFromTheSportsDB(
    provider: LiveScoreProvider
  ): Promise<void> {
    // TheSportsDB has limited free endpoints
    // We'll use their event search for live events
    const apiUrl = provider.apiUrl;
    const cfg =
      provider && typeof provider.config === "object" && provider.config
        ? (provider.config as Record<string, unknown>)
        : undefined;
    const apiKeyCandidate = cfg ? cfg["apiKey"] : undefined;
    const apiKey =
      typeof apiKeyCandidate === "string" ? apiKeyCandidate : undefined;

    try {
      // Search for recent events (this is a workaround since TheSportsDB doesn't have a great free tier for live scores)
      const sports = [
        "Football",
        "Basketball",
        "Tennis",
        "Baseball",
        "Hockey",
        "MMA",
        "Boxing",
      ];

      for (const sportName of sports) {
        const response = await fetch(
          `${apiUrl}/searchseason.php?s=${sportName}`,
          {
            headers: apiKey
              ? ({ apikey: apiKey } as Record<string, string>)
              : undefined,
          }
        );

        if (!response.ok) {
          throw new Error(`TheSportsDB request failed: ${response.status}`);
        }

        const data = await response.json();
        const seasons = data.countries || [];

        // For each country, get recent events
        for (const country of seasons.slice(0, 3)) {
          // Limit to avoid rate limits
          const countrySeasons = country.seasons || [];
          if (countrySeasons.length > 0) {
            const latestSeason = countrySeasons[countrySeasons.length - 1];

            const eventsResponse = await fetch(
              `${apiUrl}/eventsseason.php?id=${latestSeason.season_id}&l=English`,
              {
                headers: apiKey
                  ? ({ apikey: apiKey } as Record<string, string>)
                  : undefined,
              }
            );

            if (eventsResponse.ok) {
              const eventsData = await eventsResponse.json();
              const events = eventsData.events || [];

              for (const eventData of events.slice(0, 10)) {
                // Limit events per sport
                await this.processTheSportsDBEvent(
                  eventData as TheSportsDBEventData,
                  sportName
                );
              }
            }
          }
        }

        // Rate limiting
        await this.sleep(provider.rateLimitMs);
      }
    } catch (error) {
      console.error("Error updating from TheSportsDB:", error);
    }
  }

  private async processTheSportsDBEvent(
    eventData: TheSportsDBEventData,
    sportName: string
  ): Promise<void> {
    try {
      const sport = await this.getSportByName(sportName);
      if (!sport) return;

      // Create a simple league entry
      const leagueName = `${sportName} League`;
      const league = await this.getOrCreateLeague(leagueName, sport.id);
      if (!league) return;

      const matchUpdateData = {
        sportId: sport.id,
        leagueId: league.id,
        homeTeam: eventData.strHomeTeam || "Unknown",
        awayTeam: eventData.strAwayTeam || "Unknown",
        homeTeamScore: eventData.intHomeScore || 0,
        awayTeamScore: eventData.intAwayScore || 0,
        scheduledAt: eventData.dateEvent
          ? new Date(eventData.dateEvent)
          : new Date(),
        status: this.mapTheSportsDBStatus(eventData.strStatus),
        lastUpdatedAt: new Date(),
      };

      const existingMatch = await prisma.match.findFirst({
        where: {
          externalId: eventData.idEvent?.toString(),
        },
      });

      if (existingMatch) {
        await prisma.match.update({
          where: { id: existingMatch.id },
          data: matchUpdateData,
        });
      } else {
        await prisma.match.create({
          data: {
            ...matchUpdateData,
            externalId: eventData.idEvent?.toString(),
            createdAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error("Error processing TheSportsDB event:", error);
    }
  }

  private async processMatchEvents(
    matchId: string,
    matchData: ApiFootballMatchData
  ): Promise<void> {
    try {
      // This is a simplified event processing
      // In a real implementation, you'd want to track events more carefully
      const events = matchData.events || [];

      for (const eventData of events) {
        if (eventData.type === "Goal") {
          await prisma.matchEvent.create({
            data: {
              matchId,
              type: "goal",
              team: eventData.team === "home" ? "home" : "away",
              minute: eventData.time?.elapsed,
              player: eventData.player?.name,
              description: `Goal by ${eventData.player?.name}`,
              createdAt: new Date(),
            },
          });
        } else if (eventData.type === "Card") {
          await prisma.matchEvent.create({
            data: {
              matchId,
              type:
                eventData.detail === "Yellow Card" ? "yellow_card" : "red_card",
              team: eventData.team === "home" ? "home" : "away",
              minute: eventData.time?.elapsed,
              player: eventData.player?.name,
              description: `${eventData.detail} for ${eventData.player?.name}`,
              createdAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      console.error("Error processing match events:", error);
    }
  }

  private async getSportByCode(code?: string): Promise<{ id: string } | null> {
    if (!code) return null;
    return prisma.sport.findFirst({
      where: {
        OR: [
          { name: { mode: "insensitive", equals: code.toLowerCase() } },
          { displayName: { mode: "insensitive", equals: code } },
        ],
      },
    });
  }

  private async getSportByName(name: string): Promise<{ id: string } | null> {
    return prisma.sport.findFirst({
      where: {
        OR: [
          { name: { mode: "insensitive", equals: name.toLowerCase() } },
          { displayName: { mode: "insensitive", equals: name } },
        ],
      },
    });
  }

  private async getOrCreateLeague(
    leagueName: string,
    sportId: string
  ): Promise<{ id: string }> {
    const existing = await prisma.league.findFirst({
      where: { name: leagueName, sportId },
    });
    if (existing) return existing;
    return prisma.league.create({
      data: {
        name: leagueName,
        sportId,
        country: "Unknown",
        isActive: true,
      },
    });
  }

  private mapApiFootballStatus(status?: string): string {
    switch (status) {
      case "NS":
        return "scheduled";
      case "LIVE":
        return "live";
      case "FT":
      case "AET":
      case "PEN":
        return "finished";
      case "POSTPONED":
      case "SUSP":
        return "postponed";
      case "CANCELLED":
      case "ABD":
        return "cancelled";
      default:
        return "unknown";
    }
  }

  private mapTheSportsDBStatus(status?: string): string {
    switch (status?.toLowerCase()) {
      case "scheduled":
      case "not started":
        return "scheduled";
      case "live":
      case "in progress":
        return "live";
      case "finished":
      case "ended":
      case "complete":
        return "finished";
      case "postponed":
      case "delayed":
        return "postponed";
      case "cancelled":
        return "cancelled";
      default:
        return "unknown";
    }
  }

  private getCurrentMinute(elapsed?: number): number | undefined {
    return elapsed ?? undefined;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Public methods for getting live scores
  async getLiveMatches(sportId?: string): Promise<LiveScoreMatch[]> {
    const where: Prisma.MatchWhereInput = {
      status: "live",
    };

    if (sportId) {
      where.sportId = sportId;
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        sport: true,
        league: true,
      },
      orderBy: { lastUpdatedAt: "desc" },
    });

    // Map to the public LiveScoreMatch shape
    return matches.map((m) => ({
      id: m.id,
      externalId: m.externalId ?? null,
      sportId: m.sportId,
      leagueId: m.leagueId,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeTeamLogo: m.homeTeamLogo ?? undefined,
      awayTeamLogo: m.awayTeamLogo ?? undefined,
      homeTeamScore: m.homeTeamScore,
      awayTeamScore: m.awayTeamScore,
      venue: m.venue ?? undefined,
      scheduledAt: m.scheduledAt,
      status: m.status,
      period: m.period ?? undefined,
      minute: m.minute ?? undefined,
      odds: (m.odds as LiveScoreMatch["odds"]) ?? undefined,
      statistics: (m.statistics as LiveScoreMatch["statistics"]) ?? undefined,
      lastUpdatedAt: m.lastUpdatedAt,
    }));
  }

  async getMatchById(matchId: string): Promise<LiveScoreMatchFull | null> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        sport: true,
        league: true,
        events: {
          orderBy: { minute: "asc" },
        },
      },
    });

    if (!match) return null;

    return {
      id: match.id,
      externalId: match.externalId ?? null,
      sportId: match.sportId,
      leagueId: match.leagueId,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeTeamLogo: match.homeTeamLogo ?? null,
      awayTeamLogo: match.awayTeamLogo ?? null,
      homeTeamScore: match.homeTeamScore,
      awayTeamScore: match.awayTeamScore,
      venue: match.venue ?? null,
      scheduledAt: match.scheduledAt,
      status: match.status,
      period: match.period ?? null,
      minute: match.minute ?? null,
      odds: (match.odds as LiveScoreMatch["odds"]) ?? undefined,
      statistics:
        (match.statistics as LiveScoreMatch["statistics"]) ?? undefined,
      lastUpdatedAt: match.lastUpdatedAt,
      sport: {
        id: match.sport.id,
        name: match.sport.name,
        displayName: match.sport.displayName,
      },
      league: {
        id: match.league.id,
        name: match.league.name,
        country: match.league.country,
      },
      events: match.events.map((e) => ({
        id: e.id,
        type: e.type,
        team: e.team === "home" ? "home" : "away",
        minute: e.minute ?? undefined,
        player: e.player ?? undefined,
        description: e.description ?? undefined,
      })),
    };
  }

  async getMatchEvents(matchId: string): Promise<LiveScoreEvent[]> {
    const events = await prisma.matchEvent.findMany({
      where: { matchId },
      orderBy: { minute: "asc" },
    });
    return events.map((e) => ({
      type: e.type,
      team: e.team === "home" ? "home" : "away",
      minute: e.minute ?? undefined,
      player: e.player ?? undefined,
      description: e.description ?? undefined,
    }));
  }
}
