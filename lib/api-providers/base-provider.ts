/**
 * Base API Provider Interface
 * All live score API providers must implement this interface
 */

import { RateLimiter } from "../rate-limiter";

export interface ProviderConfig {
  name: string;
  apiKey: string;
  apiUrl: string;
  rateLimitRequests: number;
  rateLimitWindowMs: number;
  timeout?: number;
}

export interface Match {
  externalId: string;
  sport: string;
  league: string;
  leagueCountry?: string;
  leagueLogo?: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  scheduledAt: Date;
  venue?: string;
  minute?: number;
  period?: string;
  odds?: {
    homeWin?: number;
    draw?: number;
    awayWin?: number;
    [key: string]: number | undefined;
  };
  statistics?: Record<string, unknown>;
  events?: MatchEvent[];
}

export interface MatchEvent {
  type: string;
  team: "home" | "away";
  minute?: number;
  player?: string;
  description?: string;
}

export interface SearchFilters {
  sport?: string;
  league?: string;
  team?: string;
  status?: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export abstract class BaseAPIProvider {
  protected config: ProviderConfig;
  protected rateLimiter: RateLimiter;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.rateLimiter = RateLimiter.getInstance(
      config.name,
      config.rateLimitRequests,
      config.rateLimitWindowMs
    );
  }

  /**
   * Fetch matches with rate limiting
   */
  protected async fetchWithRateLimit<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    // Wait for rate limit slot
    await this.rateLimiter.waitForSlot();

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeout || 10000
    );

    try {
      console.log(`[${this.config.name}] Fetching URL...`);
      console.time(`[${this.config.name}] Fetch time`);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options?.headers,
          "User-Agent": "ScoreFusion/1.0",
        },
      });
      console.timeEnd(`[${this.config.name}] Fetch time`);

      clearTimeout(timeout);

      console.log(
        `[${this.config.name}] Response status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => "Unable to read error response");
        console.error(`[${this.config.name}] API request failed:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 500),
        });
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log(`[${this.config.name}] Response parsed successfully`);
      return data;
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === "AbortError") {
        console.error(
          `[${this.config.name}] Request timeout after ${
            this.config.timeout || 10000
          }ms`
        );
        throw new Error("Request timeout");
      }
      console.error(`[${this.config.name}] Fetch error:`, error);
      throw error;
    }
  }

  /**
   * Get live matches
   */
  abstract getLiveMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>>;

  /**
   * Get scheduled matches
   */
  abstract getScheduledMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>>;

  /**
   * Get finished matches
   */
  abstract getFinishedMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>>;

  /**
   * Get match by ID
   */
  abstract getMatchById(externalId: string): Promise<Match | null>;

  /**
   * Search matches
   */
  abstract searchMatches(
    query: string,
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>>;

  /**
   * Get available sports
   */
  abstract getSports(): Promise<Array<{ id: string; name: string }>>;

  /**
   * Get available leagues for a sport
   */
  abstract getLeagues(
    sport: string
  ): Promise<Array<{ id: string; name: string; country?: string }>>;

  /**
   * Check provider health
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.getSports();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get rate limit info
   */
  getRateLimitInfo(): {
    remaining: number;
    resetTime: number;
  } {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      resetTime: this.rateLimiter.getResetTime(),
    };
  }
}
