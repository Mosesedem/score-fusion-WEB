/**
 * API-Football Provider
 * https://www.api-football.com/
 * One of the most comprehensive football (soccer) APIs
 */

import {
  BaseAPIProvider,
  Match,
  SearchFilters,
  PaginationParams,
  PaginatedResponse,
} from "./base-provider";

interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    venue?: { name?: string };
    status: { short: string; elapsed?: number };
  };
  league: {
    name: string;
    country?: string;
    logo?: string;
  };
  teams: {
    home: { id: number; name: string; logo?: string };
    away: { id: number; name: string; logo?: string };
  };
  goals: { home: number | null; away: number | null };
  events?: Array<{
    time: { elapsed: number };
    team: { id: number; name: string };
    player: { id: number; name: string };
    assist?: { id: number; name: string };
    type: string;
    detail: string;
  }>;
}

interface ApiFootballResponse {
  response: ApiFootballFixture[];
  paging?: {
    current: number;
    total: number;
  };
  results?: number;
}

export class ApiFootballProvider extends BaseAPIProvider {
  private readonly baseUrl = "https://v3.football.api-sports.io";

  constructor(apiKey: string) {
    super({
      name: "api-football",
      apiKey,
      apiUrl: "https://v3.football.api-sports.io",
      rateLimitRequests: 10, // Free tier: 10 requests per minute
      rateLimitWindowMs: 60000, // 1 minute
      timeout: 15000,
    });
  }

  private getHeaders() {
    return {
      "x-rapidapi-key": this.config.apiKey,
      "x-rapidapi-host": "v3.football.api-sports.io",
    };
  }

  private mapStatus(status: string): Match["status"] {
    const statusMap: Record<string, Match["status"]> = {
      TBD: "scheduled",
      NS: "scheduled",
      "1H": "live",
      HT: "live",
      "2H": "live",
      ET: "live",
      BT: "live",
      P: "live",
      SUSP: "live",
      INT: "live",
      FT: "finished",
      AET: "finished",
      PEN: "finished",
      PST: "postponed",
      CANC: "cancelled",
      ABD: "cancelled",
      AWD: "finished",
      WO: "finished",
    };
    return statusMap[status] || "scheduled";
  }

  private transformFixture(fixture: ApiFootballFixture): Match {
    return {
      externalId: fixture.fixture.id.toString(),
      sport: "football",
      league: fixture.league.name,
      leagueCountry: fixture.league.country,
      leagueLogo: fixture.league.logo,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeTeamLogo: fixture.teams.home.logo,
      awayTeamLogo: fixture.teams.away.logo,
      homeScore: fixture.goals.home ?? 0,
      awayScore: fixture.goals.away ?? 0,
      status: this.mapStatus(fixture.fixture.status.short),
      scheduledAt: new Date(fixture.fixture.date),
      venue: fixture.fixture.venue?.name,
      minute: fixture.fixture.status.elapsed ?? undefined,
      period: fixture.fixture.status.short,
      events: fixture.events?.map((event) => ({
        type: event.type.toLowerCase(),
        team: event.team.name === fixture.teams.home.name ? "home" : "away",
        minute: event.time.elapsed,
        player: event.player.name,
        description: event.detail,
      })),
    };
  }

  async getLiveMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    console.log("[API-Football] getLiveMatches called", {
      filters,
      pagination,
    });
    const params = new URLSearchParams({ live: "all" });

    if (filters?.league) {
      params.append("league", filters.league);
    }

    const url = `${this.baseUrl}/fixtures?${params.toString()}`;
    console.log("[API-Football] Fetching live matches from:", url);
    console.time("[API-Football] getLiveMatches API call");
    const data = await this.fetchWithRateLimit<ApiFootballResponse>(url, {
      headers: this.getHeaders(),
    });
    console.timeEnd("[API-Football] getLiveMatches API call");
    console.log("[API-Football] Raw response", {
      fixtureCount: data.response?.length || 0,
      results: data.results,
      paging: data.paging,
      firstFixture: data.response?.[0],
    });

    const matches = data.response.map((f) => this.transformFixture(f));
    console.log("[API-Football] Transformed matches", {
      count: matches.length,
    });

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMatches = matches.slice(startIndex, endIndex);

    console.log("[API-Football] getLiveMatches result", {
      totalMatches: matches.length,
      returnedMatches: paginatedMatches.length,
    });

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
  }

  async getScheduledMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    const params = new URLSearchParams();

    const dateFrom = filters?.dateFrom || new Date();
    const dateTo =
      filters?.dateTo || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    params.append("from", dateFrom.toISOString().split("T")[0]);
    params.append("to", dateTo.toISOString().split("T")[0]);
    params.append("status", "NS-TBD");

    if (filters?.league) {
      params.append("league", filters.league);
    }

    const url = `${this.baseUrl}/fixtures?${params.toString()}`;
    const data = await this.fetchWithRateLimit<ApiFootballResponse>(url, {
      headers: this.getHeaders(),
    });

    const matches = data.response.map((f) => this.transformFixture(f));

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
  }

  async getFinishedMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    const params = new URLSearchParams();

    const dateFrom =
      filters?.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dateTo = filters?.dateTo || new Date();

    params.append("from", dateFrom.toISOString().split("T")[0]);
    params.append("to", dateTo.toISOString().split("T")[0]);
    params.append("status", "FT");

    if (filters?.league) {
      params.append("league", filters.league);
    }

    const url = `${this.baseUrl}/fixtures?${params.toString()}`;
    const data = await this.fetchWithRateLimit<ApiFootballResponse>(url, {
      headers: this.getHeaders(),
    });

    const matches = data.response.map((f) => this.transformFixture(f));

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
  }

  async getMatchById(externalId: string): Promise<Match | null> {
    const url = `${this.baseUrl}/fixtures?id=${externalId}`;
    const data = await this.fetchWithRateLimit<ApiFootballResponse>(url, {
      headers: this.getHeaders(),
    });

    if (data.response.length === 0) {
      return null;
    }

    return this.transformFixture(data.response[0]);
  }

  async searchMatches(
    query: string,
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    // API-Football doesn't have a direct search endpoint
    // We'll fetch matches and filter locally
    const params = new URLSearchParams();

    const dateFrom =
      filters?.dateFrom || new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const dateTo =
      filters?.dateTo || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    params.append("from", dateFrom.toISOString().split("T")[0]);
    params.append("to", dateTo.toISOString().split("T")[0]);

    const url = `${this.baseUrl}/fixtures?${params.toString()}`;
    const data = await this.fetchWithRateLimit<ApiFootballResponse>(url, {
      headers: this.getHeaders(),
    });

    // Filter matches by search query
    const queryLower = query.toLowerCase();
    const filteredFixtures = data.response.filter(
      (f) =>
        f.teams.home.name.toLowerCase().includes(queryLower) ||
        f.teams.away.name.toLowerCase().includes(queryLower) ||
        f.league.name.toLowerCase().includes(queryLower)
    );

    const matches = filteredFixtures.map((f) => this.transformFixture(f));

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
  }

  async getSports(): Promise<Array<{ id: string; name: string }>> {
    // API-Football is football-only
    return [{ id: "football", name: "Football" }];
  }

  async getLeagues(): Promise<
    Array<{ id: string; name: string; country?: string }>
  > {
    const url = `${this.baseUrl}/leagues`;
    const data = await this.fetchWithRateLimit<{
      response: Array<{
        league: { id: number; name: string };
        country: { name: string };
      }>;
    }>(url, {
      headers: this.getHeaders(),
    });

    return data.response.map((item) => ({
      id: item.league.id.toString(),
      name: item.league.name,
      country: item.country.name,
    }));
  }
}
