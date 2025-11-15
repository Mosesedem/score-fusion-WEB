/**
 * SportMonks Football Provider (v3)
 * Docs: https://docs.sportmonks.com/football/
 */

import {
  BaseAPIProvider,
  Match,
  SearchFilters,
  PaginationParams,
  PaginatedResponse,
} from "./base-provider";

interface SMTimeStatus {
  status?: string;
  minute?: number | null;
}

interface SMState {
  id?: number;
  state?: string;
  name?: string;
  short_name?: string;
}

interface SMLeague {
  id: number;
  name: string;
  country_id?: number;
  country?: {
    id?: number;
    name?: string;
  };
  image_path?: string;
}

interface SMParticipantMeta {
  location?: "home" | "away";
}

interface SMParticipant {
  id: number;
  name: string;
  image_path?: string;
  meta?: SMParticipantMeta;
}

interface SMVenue {
  name?: string;
}

interface SMScore {
  id?: number;
  fixture_id?: number;
  type_id?: number;
  participant_id?: number;
  score?: {
    goals?: number;
    participant?: string;
  };
  description?: string;
}

interface SMEvent {
  minute?: number | null;
  type?: string;
  result?: string;
  participant?: {
    id: number;
    name?: string;
  };
}

interface SMTeamStatsValue {
  home?: number | null;
  away?: number | null;
}

interface SMStatistics {
  corners?: SMTeamStatsValue;
  shots_total?: SMTeamStatsValue;
  shots_on_target?: SMTeamStatsValue;
  possessiontime?: SMTeamStatsValue;
  yellowcards?: SMTeamStatsValue;
  redcards?: SMTeamStatsValue;
}

interface SMFixture {
  id: number;
  name?: string;
  league?: SMLeague;
  participants?: SMParticipant[];
  venue?: SMVenue;
  state?: SMState;
  time?: SMTimeStatus;
  scores?: SMScore[];
  events?: SMEvent[];
  statistics?: SMStatistics;
  date?: {
    date?: string;
  };
  starting_at?: string;
}

interface SMResponse {
  data: SMFixture[];
  meta?: {
    pagination?: {
      count: number;
      per_page: number;
      current_page: number;
      total: number;
      total_pages: number;
    };
  };
}

interface SMLeaguesResponse {
  data: SMLeague[];
  meta?: {
    pagination?: {
      count: number;
      per_page: number;
      current_page: number;
      total: number;
      total_pages: number;
    };
  };
}

export class SportMonksProvider extends BaseAPIProvider {
  private readonly baseUrl: string;

  constructor(
    apiKey: string,
    apiUrl = "https://api.sportmonks.com/v3/football"
  ) {
    super({
      name: "sportmonks-football",
      apiKey,
      apiUrl,
      rateLimitRequests: 60, // typical plan: per minute
      rateLimitWindowMs: 60000,
      timeout: 15000,
    });
    this.baseUrl = apiUrl;
  }

  private buildUrl(
    path: string,
    query: Record<string, string | number | undefined> = {},
    skipDefaultIncludes = false
  ): string {
    const params = new URLSearchParams();
    params.set("api_token", this.config.apiKey);

    // According to Sportmonks API v3 documentation, the correct includes are:
    // For fixtures: state, league, participants, venue, etc.
    // Use semicolons to separate includes
    // Skip default includes for non-fixture endpoints (like /leagues)
    if (!skipDefaultIncludes && !("include" in query)) {
      params.set("include", "state;league.country;participants;venue;scores");
    }

    for (const [k, v] of Object.entries(query)) {
      if (typeof v !== "undefined") params.set(k, String(v));
    }

    const url = `${this.baseUrl}${path}?${params.toString()}`;
    console.log(
      `[SportMonks] Building URL: ${url.replace(
        this.config.apiKey,
        "API_KEY_HIDDEN"
      )}`
    );
    return url;
  }

  private mapStatus(state?: SMState): Match["status"] {
    // According to Sportmonks API v3, the state object contains the match status
    const stateId = state?.id;
    const stateName =
      state?.short_name?.toUpperCase() || state?.state?.toUpperCase() || "";

    // State IDs according to Sportmonks API v3:
    // 1 = NS (Not Started)
    // 2 = LIVE (Live/In Progress)
    // 3 = HT (Half Time)
    // 5 = FT (Full Time) - THIS IS THE FINISHED STATE!
    // 6 = FT_PEN (Full Time after Penalties)
    // 7 = BREAK (Break)
    // 8 = CANC (Cancelled)
    // 9 = SUSP (Suspended)
    // 10 = INT (Interrupted)
    // 11 = POSTP (Postponed)
    // 12 = ABANDN (Abandoned)
    // 13 = DELAYED (Delayed)
    // 14 = TBA (To Be Announced)
    // 15 = WO (Walkover)
    // 16 = AU (Awaiting Updates)
    // 17 = AET (After Extra Time)

    // Map by ID first for accuracy
    if (stateId) {
      switch (stateId) {
        case 1: // NS
        case 11: // POSTP
        case 13: // DELAYED
        case 14: // TBA
        case 16: // AU
          return "scheduled";
        case 2: // LIVE
        case 3: // HT
        case 7: // BREAK
        case 10: // INT
          return "live";
        case 5: // FT - FULL TIME (FINISHED!)
        case 6: // FT_PEN
        case 17: // AET
          return "finished";
        case 8: // CANC
        case 9: // SUSP
        case 12: // ABANDN
        case 15: // WO
          return "cancelled";
        default:
          // Fall through to name-based mapping
          break;
      }
    }

    // Fallback to name-based mapping for older API responses
    switch (stateName) {
      case "NS":
      case "TBD":
      case "POSTP":
      case "DELAYED":
        return "scheduled";
      case "LIVE":
      case "1H":
      case "HT":
      case "2H":
      case "ET":
      case "PEN":
      case "INT":
      case "BREAK":
        return "live";
      case "FT":
      case "AET":
      case "FT_PEN":
        return "finished";
      case "CANCL":
      case "CANC":
      case "ABD":
      case "ABAN":
      case "WO":
      case "SUSP":
        return "cancelled";
      default:
        return "scheduled";
    }
  }

  private selectTeam(
    participants: SMParticipant[] | undefined,
    location: "home" | "away"
  ): SMParticipant | undefined {
    if (!participants || participants.length === 0) return undefined;
    const loc = participants.find((p) => p.meta?.location === location);
    if (loc) return loc;
    // fallback heuristic: assume first is home, second is away
    return location === "home" ? participants[0] : participants[1];
  }

  private extractScore(
    scores: SMScore[] | undefined,
    participantId: number | undefined
  ): number {
    if (!scores || !participantId) return 0;

    // Find the "current" score for the participant
    // Type ID 1525 is typically the current/full-time score
    const currentScore = scores.find(
      (s) =>
        s.participant_id === participantId &&
        (s.type_id === 1525 || s.description === "CURRENT")
    );

    if (currentScore?.score?.goals !== undefined) {
      return currentScore.score.goals;
    }

    // Fallback: find any score for this participant
    const anyScore = scores.find((s) => s.participant_id === participantId);
    return anyScore?.score?.goals ?? 0;
  }

  private transformFixture(f: SMFixture): Match {
    const home = this.selectTeam(f.participants, "home");
    const away = this.selectTeam(f.participants, "away");

    const stats = f.statistics;
    const possessionHome = stats?.possessiontime?.home ?? null;
    const possessionAway = stats?.possessiontime?.away ?? null;

    return {
      externalId: String(f.id),
      sport: "football",
      league: f.league?.name || "Football",
      leagueCountry: f.league?.country?.name,
      leagueLogo: f.league?.image_path,
      homeTeam: home?.name || "Home",
      awayTeam: away?.name || "Away",
      homeTeamLogo: home?.image_path,
      awayTeamLogo: away?.image_path,
      homeScore: this.extractScore(f.scores, home?.id),
      awayScore: this.extractScore(f.scores, away?.id),
      status: this.mapStatus(f.state),
      scheduledAt: new Date(
        f.starting_at || f.date?.date || new Date().toISOString()
      ),
      venue: f.venue?.name,
      minute: f.time?.minute ?? undefined,
      period: f.state?.short_name || f.state?.state,
      statistics:
        possessionHome !== null || possessionAway !== null
          ? {
              possession: {
                home: possessionHome || 0,
                away: possessionAway || 0,
              },
              shots: {
                home: stats?.shots_total?.home || 0,
                away: stats?.shots_total?.away || 0,
              },
              shotsOnTarget: {
                home: stats?.shots_on_target?.home || 0,
                away: stats?.shots_on_target?.away || 0,
              },
              corners: {
                home: stats?.corners?.home || 0,
                away: stats?.corners?.away || 0,
              },
              yellowCards: {
                home: stats?.yellowcards?.home || 0,
                away: stats?.yellowcards?.away || 0,
              },
              redCards: {
                home: stats?.redcards?.home || 0,
                away: stats?.redcards?.away || 0,
              },
            }
          : undefined,
      events: (f.events || []).slice(0, 20).map((e) => ({
        type: (e.type || "event").toLowerCase(),
        team: e.participant?.id === home?.id ? "home" : "away",
        minute: e.minute || undefined,
        player: e.participant?.name,
        description: e.result,
      })),
    };
  }

  private paginate<T>(
    items: T[],
    pagination?: PaginationParams
  ): PaginatedResponse<T> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const slice = items.slice(startIndex, endIndex);
    return {
      data: slice,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
        hasMore: endIndex < items.length,
      },
    };
  }

  async getLiveMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    console.log("[SportMonks] getLiveMatches called", { filters, pagination });

    // Try the inplay endpoint first, then fall back to today's fixtures filtered by live state
    let url = this.buildUrl("/livescores/inplay");
    console.time("[SportMonks] getLiveMatches API call");

    try {
      const json = await this.fetchWithRateLimit<SMResponse>(url);
      console.timeEnd("[SportMonks] getLiveMatches API call");
      console.log("[SportMonks] getLiveMatches raw response", {
        dataCount: json.data?.length || 0,
        meta: json.meta,
        firstFixture: json.data?.[0],
      });

      let matches = (json.data || []).map((f) => this.transformFixture(f));

      // If no results from inplay, try fetching today's matches and filter by live status
      if (matches.length === 0) {
        console.log(
          "[SportMonks] No matches from /inplay, trying today's fixtures filtered by live state"
        );
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        url = this.buildUrl(
          `/fixtures/between/${today.toISOString().slice(0, 10)}/${tomorrow
            .toISOString()
            .slice(0, 10)}`
        );
        const todayJson = await this.fetchWithRateLimit<SMResponse>(url);

        const allTodayMatches = (todayJson.data || []).map((f) =>
          this.transformFixture(f)
        );
        matches = allTodayMatches.filter((m) => m.status === "live");

        console.log("[SportMonks] Filtered today's fixtures for live matches", {
          totalToday: allTodayMatches.length,
          liveMatches: matches.length,
        });
      }

      // optional filters
      if (filters?.league) {
        const q = filters.league.toLowerCase();
        matches = matches.filter((m) => m.league.toLowerCase().includes(q));
      }
      if (filters?.team) {
        const q = filters.team.toLowerCase();
        matches = matches.filter(
          (m) =>
            m.homeTeam.toLowerCase().includes(q) ||
            m.awayTeam.toLowerCase().includes(q)
        );
      }

      console.log("[SportMonks] getLiveMatches after filters", {
        matchCount: matches.length,
      });
      return this.paginate(matches, pagination);
    } catch (error) {
      console.error("[SportMonks] getLiveMatches error:", error);
      throw error;
    }
  }
  async getScheduledMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    console.log("[SportMonks] getScheduledMatches called", {
      filters,
      pagination,
    });
    const from = (filters?.dateFrom || new Date()).toISOString().slice(0, 10);
    const to = (
      filters?.dateTo || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    )
      .toISOString()
      .slice(0, 10);

    console.log("[SportMonks] Date range for scheduled", { from, to });
    const url = this.buildUrl(`/fixtures/between/${from}/${to}`);
    console.time("[SportMonks] getScheduledMatches API call");

    try {
      const json = await this.fetchWithRateLimit<SMResponse>(url);
      console.timeEnd("[SportMonks] getScheduledMatches API call");
      console.log("[SportMonks] getScheduledMatches raw response", {
        dataCount: json.data?.length || 0,
        meta: json.meta,
        firstFixture: json.data?.[0],
      });

      // Transform all fixtures
      let matches = (json.data || []).map((f) => this.transformFixture(f));

      // Only filter by status if explicitly requested
      if (filters?.status === "scheduled") {
        matches = matches.filter((m) => m.status === "scheduled");
      }

      if (filters?.league) {
        const q = filters.league.toLowerCase();
        matches = matches.filter((m) => m.league.toLowerCase().includes(q));
      }

      console.log("[SportMonks] getScheduledMatches after filters", {
        matchCount: matches.length,
        statusBreakdown: {
          live: matches.filter((m) => m.status === "live").length,
          scheduled: matches.filter((m) => m.status === "scheduled").length,
          finished: matches.filter((m) => m.status === "finished").length,
        },
      });
      return this.paginate(matches, pagination);
    } catch (error) {
      console.error("[SportMonks] getScheduledMatches error:", error);
      throw error;
    }
  }

  async getFinishedMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    console.log("[SportMonks] getFinishedMatches called", {
      filters,
      pagination,
    });
    const from = (
      filters?.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )
      .toISOString()
      .slice(0, 10);
    const to = (filters?.dateTo || new Date()).toISOString().slice(0, 10);

    console.log("[SportMonks] Date range for finished", { from, to });
    const url = this.buildUrl(`/fixtures/between/${from}/${to}`);
    console.time("[SportMonks] getFinishedMatches API call");

    try {
      const json = await this.fetchWithRateLimit<SMResponse>(url);
      console.timeEnd("[SportMonks] getFinishedMatches API call");
      console.log("[SportMonks] getFinishedMatches raw response", {
        dataCount: json.data?.length || 0,
        meta: json.meta,
        firstFixture: json.data?.[0],
      });

      // Transform all fixtures
      let matches = (json.data || []).map((f) => this.transformFixture(f));

      // Only filter by status if explicitly requested
      if (filters?.status === "finished") {
        matches = matches.filter((m) => m.status === "finished");
      }

      if (filters?.league) {
        const q = filters.league.toLowerCase();
        matches = matches.filter((m) => m.league.toLowerCase().includes(q));
      }

      console.log("[SportMonks] getFinishedMatches after filters", {
        matchCount: matches.length,
        statusBreakdown: {
          live: matches.filter((m) => m.status === "live").length,
          scheduled: matches.filter((m) => m.status === "scheduled").length,
          finished: matches.filter((m) => m.status === "finished").length,
        },
      });
      return this.paginate(matches, pagination);
    } catch (error) {
      console.error("[SportMonks] getFinishedMatches error:", error);
      throw error;
    }
  }

  async getMatchById(externalId: string): Promise<Match | null> {
    const url = this.buildUrl(`/fixtures/${externalId}`);
    const json = await this.fetchWithRateLimit<SMResponse>(url);
    const f = json.data?.[0];
    return f ? this.transformFixture(f) : null;
  }

  async searchMatches(
    query: string,
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    // SportMonks v3 does not expose a universal fixture search endpoint; fetch a window and filter
    const dateFrom =
      filters?.dateFrom || new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const dateTo =
      filters?.dateTo || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const from = dateFrom.toISOString().slice(0, 10);
    const to = dateTo.toISOString().slice(0, 10);

    const url = this.buildUrl(`/fixtures/between/${from}/${to}`);
    const json = await this.fetchWithRateLimit<SMResponse>(url);

    const q = query.toLowerCase();
    let matches = (json.data || [])
      .map((f) => this.transformFixture(f))
      .filter(
        (m) =>
          m.homeTeam.toLowerCase().includes(q) ||
          m.awayTeam.toLowerCase().includes(q) ||
          m.league.toLowerCase().includes(q)
      );

    if (filters?.status) {
      matches = matches.filter((m) => m.status === filters.status);
    }

    return this.paginate(matches, pagination);
  }

  async getSports(): Promise<Array<{ id: string; name: string }>> {
    return [{ id: "football", name: "Football" }];
  }

  async getLeagues(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _sport: string
  ): Promise<Array<{ id: string; name: string; country?: string }>> {
    // Fetch leagues directly from SportMonks v3 with pagination
    // Use country include for leagues endpoint (not fixture includes)
    const perPage = 100;
    let page = 1;
    const maxPages = 10; // safety cap
    const leagues: Array<{ id: string; name: string; country?: string }> = [];

    console.log("[SportMonks] getLeagues called");

    while (page <= maxPages) {
      // Use skipDefaultIncludes and explicitly set league-specific includes
      const url = this.buildUrl(
        "/leagues",
        { page, per_page: perPage, include: "country" },
        true
      );
      const json = await this.fetchWithRateLimit<SMLeaguesResponse>(url);

      for (const l of json.data || []) {
        leagues.push({
          id: String(l.id),
          name: l.name,
          country: l.country?.name,
        });
      }

      const totalPages = json.meta?.pagination?.total_pages || 1;
      console.log(
        `[SportMonks] getLeagues page ${page}/${totalPages}, fetched ${
          json.data?.length || 0
        } leagues`
      );

      if (page >= totalPages) break;
      page += 1;
    }

    // Deduplicate by id just in case
    const unique = new Map<
      string,
      { id: string; name: string; country?: string }
    >();
    for (const l of leagues) {
      if (!unique.has(l.id)) unique.set(l.id, l);
    }

    const result = Array.from(unique.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    console.log(
      `[SportMonks] getLeagues returning ${result.length} unique leagues`
    );
    return result;
  }
}
