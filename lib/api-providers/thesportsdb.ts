/**
 * TheSportsDB Provider
 * https://www.thesportsdb.com/
 * Free API for multiple sports
 */

import {
  BaseAPIProvider,
  Match,
  SearchFilters,
  PaginationParams,
  PaginatedResponse,
} from "./base-provider";

interface TheSportsDBEvent {
  idEvent: string;
  strEvent: string;
  strFilename?: string;
  strSport: string;
  idLeague: string;
  strLeague: string;
  strSeason?: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  dateEvent: string;
  strTime?: string;
  strVenue?: string;
  strStatus?: string;
  strThumb?: string;
  strSquare?: string;
  idHomeTeam: string;
  idAwayTeam: string;
  strTimestamp?: string;
}

interface TheSportsDBResponse {
  events: TheSportsDBEvent[] | null;
}

export class TheSportsDBProvider extends BaseAPIProvider {
  private readonly baseUrl = "https://www.thesportsdb.com/api/v1/json";

  constructor(apiKey: string = "3") {
    super({
      name: "thesportsdb",
      apiKey,
      apiUrl: "https://www.thesportsdb.com/api/v1/json",
      rateLimitRequests: 30, // Free tier allows reasonable requests
      rateLimitWindowMs: 60000,
      timeout: 10000,
    });
  }

  private mapStatus(status?: string): Match["status"] {
    if (!status) return "scheduled";

    const statusLower = status.toLowerCase();
    if (
      statusLower.includes("not started") ||
      statusLower.includes("scheduled")
    ) {
      return "scheduled";
    }
    if (statusLower.includes("live") || statusLower.includes("progress")) {
      return "live";
    }
    if (statusLower.includes("finished") || statusLower.includes("complete")) {
      return "finished";
    }
    if (statusLower.includes("postponed") || statusLower.includes("delayed")) {
      return "postponed";
    }
    if (
      statusLower.includes("cancelled") ||
      statusLower.includes("abandoned")
    ) {
      return "cancelled";
    }
    return "scheduled";
  }

  private mapSportName(sport: string): string {
    const sportMap: Record<string, string> = {
      soccer: "football",
      "american football": "american_football",
    };
    return (
      sportMap[sport.toLowerCase()] || sport.toLowerCase().replace(/\s+/g, "_")
    );
  }

  private transformEvent(event: TheSportsDBEvent): Match {
    const scheduledDate = new Date(
      `${event.dateEvent}${event.strTime ? `T${event.strTime}` : ""}`
    );

    return {
      externalId: event.idEvent,
      sport: this.mapSportName(event.strSport),
      league: event.strLeague,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeScore: parseInt(event.intHomeScore || "0"),
      awayScore: parseInt(event.intAwayScore || "0"),
      status: this.mapStatus(event.strStatus),
      scheduledAt: scheduledDate,
      venue: event.strVenue,
    };
  }

  async getLiveMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    // TheSportsDB free API has limited live score support
    // We'll try to get events from the next 15 league
    const url = `${this.baseUrl}/${this.config.apiKey}/eventsnextleague.php?id=4328`;

    try {
      const data = await this.fetchWithRateLimit<TheSportsDBResponse>(url);

      if (!data.events) {
        return {
          data: [],
          pagination: {
            page: 1,
            limit: pagination?.limit || 20,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        };
      }

      // Filter for live matches (approximate)
      const now = Date.now();
      const liveMatches = data.events
        .map((e) => this.transformEvent(e))
        .filter((match) => {
          const matchTime = match.scheduledAt.getTime();
          // Consider matches live if they started within the last 2 hours
          return now - matchTime < 2 * 60 * 60 * 1000 && now > matchTime;
        });

      // Apply pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMatches = liveMatches.slice(startIndex, endIndex);

      return {
        data: paginatedMatches,
        pagination: {
          page,
          limit,
          total: liveMatches.length,
          totalPages: Math.ceil(liveMatches.length / limit),
          hasMore: endIndex < liveMatches.length,
        },
      };
    } catch (error) {
      console.error("TheSportsDB getLiveMatches error:", error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: pagination?.limit || 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }
  }

  async getScheduledMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    // Get next 15 events from a league (example with English Premier League)
    const url = `${this.baseUrl}/${this.config.apiKey}/eventsnextleague.php?id=4328`;

    try {
      const data = await this.fetchWithRateLimit<TheSportsDBResponse>(url);

      if (!data.events) {
        return {
          data: [],
          pagination: {
            page: 1,
            limit: pagination?.limit || 20,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        };
      }

      const matches = data.events
        .map((e) => this.transformEvent(e))
        .filter((match) => match.status === "scheduled");

      // Apply pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMatches = matches.slice(startIndex, endIndex);

      return {
        data: paginatedMatches,
        pagination: {
          page,
          limit,
          total: matches.length,
          totalPages: Math.ceil(matches.length / limit),
          hasMore: endIndex < matches.length,
        },
      };
    } catch (error) {
      console.error("TheSportsDB getScheduledMatches error:", error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: pagination?.limit || 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }
  }

  async getFinishedMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    // Get last 15 events from a league
    const url = `${this.baseUrl}/${this.config.apiKey}/eventspastleague.php?id=4328`;

    try {
      const data = await this.fetchWithRateLimit<TheSportsDBResponse>(url);

      if (!data.events) {
        return {
          data: [],
          pagination: {
            page: 1,
            limit: pagination?.limit || 20,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        };
      }

      const matches = data.events.map((e) => this.transformEvent(e));

      // Apply pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMatches = matches.slice(startIndex, endIndex);

      return {
        data: paginatedMatches,
        pagination: {
          page,
          limit,
          total: matches.length,
          totalPages: Math.ceil(matches.length / limit),
          hasMore: endIndex < matches.length,
        },
      };
    } catch (error) {
      console.error("TheSportsDB getFinishedMatches error:", error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: pagination?.limit || 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }
  }

  async getMatchById(externalId: string): Promise<Match | null> {
    const url = `${this.baseUrl}/${this.config.apiKey}/lookupevent.php?id=${externalId}`;

    try {
      const data = await this.fetchWithRateLimit<TheSportsDBResponse>(url);

      if (!data.events || data.events.length === 0) {
        return null;
      }

      return this.transformEvent(data.events[0]);
    } catch (error) {
      console.error("TheSportsDB getMatchById error:", error);
      return null;
    }
  }

  async searchMatches(
    query: string,
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    const url = `${this.baseUrl}/${
      this.config.apiKey
    }/searchevents.php?e=${encodeURIComponent(query)}`;

    try {
      const data = await this.fetchWithRateLimit<TheSportsDBResponse>(url);

      if (!data.events) {
        return {
          data: [],
          pagination: {
            page: 1,
            limit: pagination?.limit || 20,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        };
      }

      let matches = data.events.map((e) => this.transformEvent(e));

      // Apply filters
      if (filters?.status) {
        matches = matches.filter((m) => m.status === filters.status);
      }
      if (filters?.sport) {
        matches = matches.filter((m) => m.sport === filters.sport);
      }

      // Apply pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMatches = matches.slice(startIndex, endIndex);

      return {
        data: paginatedMatches,
        pagination: {
          page,
          limit,
          total: matches.length,
          totalPages: Math.ceil(matches.length / limit),
          hasMore: endIndex < matches.length,
        },
      };
    } catch (error) {
      console.error("TheSportsDB searchMatches error:", error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: pagination?.limit || 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }
  }

  async getSports(): Promise<Array<{ id: string; name: string }>> {
    const url = `${this.baseUrl}/${this.config.apiKey}/all_sports.php`;

    try {
      const data = await this.fetchWithRateLimit<{
        sports: Array<{ idSport: string; strSport: string }>;
      }>(url);

      return data.sports.map((sport) => ({
        id: sport.idSport,
        name: sport.strSport,
      }));
    } catch (error) {
      console.error("TheSportsDB getSports error:", error);
      return [];
    }
  }

  async getLeagues(
    _sport: string
  ): Promise<Array<{ id: string; name: string; country?: string }>> {
    const url = `${this.baseUrl}/${this.config.apiKey}/all_leagues.php`;

    try {
      const data = await this.fetchWithRateLimit<{
        leagues: Array<{
          idLeague: string;
          strLeague: string;
          strCountry?: string;
        }>;
      }>(url);

      return data.leagues.map((league) => ({
        id: league.idLeague,
        name: league.strLeague,
        country: league.strCountry,
      }));
    } catch (error) {
      console.error("TheSportsDB getLeagues error:", error);
      return [];
    }
  }
}
