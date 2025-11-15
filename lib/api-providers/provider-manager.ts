/**
 * API Provider Manager
 * Manages multiple API providers with fallback support
 */

import {
  BaseAPIProvider,
  Match,
  SearchFilters,
  PaginationParams,
  PaginatedResponse,
} from "./base-provider";
import { ApiFootballProvider } from "./api-football";
import { TheSportsDBProvider } from "./thesportsdb";
import { SportMonksProvider } from "./sportmonks";

export interface ProviderHealthStatus {
  name: string;
  healthy: boolean;
  rateLimitInfo: {
    remaining: number;
    resetTime: number;
  };
}

export class APIProviderManager {
  private static instance: APIProviderManager;
  private providers: BaseAPIProvider[] = [];
  private primaryProvider?: BaseAPIProvider;

  private constructor() {}

  static getInstance(): APIProviderManager {
    if (!APIProviderManager.instance) {
      APIProviderManager.instance = new APIProviderManager();
    }
    return APIProviderManager.instance;
  }

  /**
   * Initialize providers from environment variables
   */
  initialize(): void {
    console.log("[ProviderManager] Initializing API providers...");
    console.log("[ProviderManager] Environment check:", {
      hasSportMonks: !!process.env.SPORTMONKS_API_KEY,
      hasApiFootball: !!process.env.API_FOOTBALL_KEY,
      hasTheSportsDB: !!process.env.THESPORTSDB_API_KEY,
    });

    // Add SportMonks provider if configured
    if (process.env.SPORTMONKS_API_KEY) {
      console.log("[ProviderManager] Adding SportMonks provider");
      const sportMonks = new SportMonksProvider(
        process.env.SPORTMONKS_API_KEY,
        process.env.SPORTMONKS_API_URL ||
          "https://api.sportmonks.com/v3/football"
      );
      this.providers.push(sportMonks);
      if (!this.primaryProvider) {
        this.primaryProvider = sportMonks;
        console.log("[ProviderManager] SportMonks set as PRIMARY provider");
      }
    }

    // Add API-Football provider if configured
    if (process.env.API_FOOTBALL_KEY) {
      console.log("[ProviderManager] Adding API-Football provider");
      const apiFootball = new ApiFootballProvider(process.env.API_FOOTBALL_KEY);
      this.providers.push(apiFootball);
      if (!this.primaryProvider) {
        this.primaryProvider = apiFootball;
        console.log("[ProviderManager] API-Football set as PRIMARY provider");
      }
    }

    // Add TheSportsDB provider if configured
    if (process.env.THESPORTSDB_API_KEY) {
      console.log("[ProviderManager] Adding TheSportsDB provider");
      const theSportsDB = new TheSportsDBProvider(
        process.env.THESPORTSDB_API_KEY
      );
      this.providers.push(theSportsDB);
      if (!this.primaryProvider) {
        this.primaryProvider = theSportsDB;
        console.log("[ProviderManager] TheSportsDB set as PRIMARY provider");
      }
    }

    // Use TheSportsDB free tier as fallback
    if (this.providers.length === 0) {
      console.warn(
        "[ProviderManager] No API keys found, using TheSportsDB free tier as fallback"
      );
      const fallbackProvider = new TheSportsDBProvider("3");
      this.providers.push(fallbackProvider);
      this.primaryProvider = fallbackProvider;
    }

    console.log(
      `[ProviderManager] Initialized ${this.providers.length} API provider(s)`
    );
    const primaryName = this.primaryProvider ? "set" : "none";
    console.log(`[ProviderManager] Primary provider: ${primaryName}`);
  }

  /**
   * Add a custom provider
   */
  addProvider(provider: BaseAPIProvider, isPrimary: boolean = false): void {
    this.providers.push(provider);
    if (isPrimary || !this.primaryProvider) {
      this.primaryProvider = provider;
    }
  }

  /**
   * Get health status of all providers
   */
  async getHealthStatus(): Promise<ProviderHealthStatus[]> {
    const statuses = await Promise.all(
      this.providers.map(async (provider) => {
        const healthy = await provider.checkHealth();
        const rateLimitInfo = provider.getRateLimitInfo();
        return {
          name: (provider as unknown as { config: { name: string } }).config
            .name,
          healthy,
          rateLimitInfo,
        };
      })
    );
    return statuses;
  }

  /**
   * Execute a provider method with fallback support
   */
  private async executeWithFallback<T>(
    method: (provider: BaseAPIProvider) => Promise<T>,
    defaultValue: T
  ): Promise<T> {
    console.log("[ProviderManager] executeWithFallback - starting");
    // Try primary provider first
    if (this.primaryProvider) {
      try {
        console.log("[ProviderManager] Trying primary provider");
        const result = await method(this.primaryProvider);
        console.log("[ProviderManager] Primary provider succeeded");
        return result;
      } catch (error) {
        console.error("[ProviderManager] Primary provider failed:", error);
      }
    } else {
      console.warn("[ProviderManager] No primary provider available");
    }

    // Try other providers
    for (const provider of this.providers) {
      if (provider === this.primaryProvider) continue;

      try {
        const providerName = (
          provider as unknown as { config: { name: string } }
        ).config.name;
        console.log(
          `[ProviderManager] Trying fallback provider: ${providerName}`
        );
        const result = await method(provider);
        console.log(
          `[ProviderManager] Fallback provider ${providerName} succeeded`
        );
        return result;
      } catch (error) {
        const providerName = (
          provider as unknown as { config: { name: string } }
        ).config.name;
        console.error(
          `[ProviderManager] Provider ${providerName} failed:`,
          error
        );
      }
    }

    console.error(
      "[ProviderManager] All providers failed, returning default value"
    );
    return defaultValue;
  }

  /**
   * Get live matches with fallback
   */
  async getLiveMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    return this.executeWithFallback(
      (provider) => provider.getLiveMatches(filters, pagination),
      {
        data: [],
        pagination: {
          page: 1,
          limit: pagination?.limit || 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      }
    );
  }

  /**
   * Get scheduled matches with fallback
   */
  async getScheduledMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    return this.executeWithFallback(
      (provider) => provider.getScheduledMatches(filters, pagination),
      {
        data: [],
        pagination: {
          page: 1,
          limit: pagination?.limit || 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      }
    );
  }

  /**
   * Get finished matches with fallback
   */
  async getFinishedMatches(
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    return this.executeWithFallback(
      (provider) => provider.getFinishedMatches(filters, pagination),
      {
        data: [],
        pagination: {
          page: 1,
          limit: pagination?.limit || 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      }
    );
  }

  /**
   * Get match by ID with fallback
   */
  async getMatchById(externalId: string): Promise<Match | null> {
    return this.executeWithFallback(
      (provider) => provider.getMatchById(externalId),
      null
    );
  }

  /**
   * Search matches with fallback
   */
  async searchMatches(
    query: string,
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Match>> {
    return this.executeWithFallback(
      (provider) => provider.searchMatches(query, filters, pagination),
      {
        data: [],
        pagination: {
          page: 1,
          limit: pagination?.limit || 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      }
    );
  }

  /**
   * Get available sports
   */
  async getSports(): Promise<Array<{ id: string; name: string }>> {
    return this.executeWithFallback((provider) => provider.getSports(), []);
  }

  /**
   * Get available leagues for a sport
   */
  async getLeagues(
    sport: string
  ): Promise<Array<{ id: string; name: string; country?: string }>> {
    return this.executeWithFallback(
      (provider) => provider.getLeagues(sport),
      []
    );
  }
}
