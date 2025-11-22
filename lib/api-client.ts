import { useSession } from "next-auth/react";
import { useMemo } from "react";

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
}

// API Client utility
class ApiClient {
  private baseUrl: string;
  private authToken: string | null;

  constructor(baseUrl: string = "/api", authToken: string | null = null) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 204) {
        // Handle no content
        return { success: true };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Request failed with status ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient();

export function useApiClient() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;

  return useMemo(() => {
    if (token) {
      return new ApiClient("/api", token);
    }
    return api; // Fallback to the unauthenticated client
  }, [token]);
}

// Predictions API (formerly Tips)
export interface Prediction {
  id: string;
  title: string;
  summary?: string;
  content: string;
  odds?: number;
  sport: string;
  league?: string;
  matchDate?: string;
  publishAt: string;
  isVIP: boolean;
  featured: boolean;
  authorName?: string;
  attachments: string[];
  tags: string[];
  viewCount: number;
  successRate?: number;
  result?: "won" | "lost" | "void" | "pending";
  createdAt: string;
  updatedAt: string;
}

export type Tip = Prediction; // Alias for backward compatibility

export interface PredictionsResponse {
  predictions: Prediction[];
  pagination: PaginationMeta;
}

// Backward compatibility for legacy code
export interface TipsResponse {
  tips: Prediction[];
  pagination: PaginationMeta;
}

export interface PredictionsQueryParams {
  page?: number;
  limit?: number;
  sport?: string;
  vip?: boolean;
  featured?: boolean;
  search?: string;
  tags?: string[];
  history?: boolean;
  today?: boolean;
  category?: "tip" | "update";
}

export type TipsQueryParams = PredictionsQueryParams;

export const predictionsApi = {
  getAll: (params: PredictionsQueryParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.sport) searchParams.append("sport", params.sport);
    if (params.vip !== undefined)
      searchParams.append("vip", params.vip.toString());
    if (params.featured !== undefined)
      searchParams.append("featured", params.featured.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.tags) searchParams.append("tags", params.tags.join(","));
    if (params.history !== undefined)
      searchParams.append("history", params.history.toString());
    if (params.today !== undefined)
      searchParams.append("today", params.today.toString());
    if (params.category) searchParams.append("category", params.category);

    return api.get<PredictionsResponse>(`/predictions?${searchParams.toString()}`);
  },

  getById: (id: string) => api.get<{ prediction: Prediction }>(`/predictions/${id}`),
};

// Legacy export
export const tipsApi = predictionsApi;

// Bets API
export interface Bet {
  id: string;
  tip?: {
    id: string;
    title: string;
    sport: string;
    league?: string;
    matchDate?: string;
    result?: string;
  };
  amount: number;
  odds?: number;
  stakeType: string;
  status: "pending" | "won" | "lost" | "void";
  payout?: number;
  placedAt: string;
  settledAt?: string;
  potentialPayout?: number;
}

export interface BetStatistics {
  totalBets: number;
  winRate: number;
  totalStaked: number;
  totalWon: number;
  totalLost: number;
  profit: number;
  roi: number;
  winCount: number;
  lossCount: number;
  pendingCount: number;
}

export interface BetsResponse {
  bets: Bet[];
  pagination: PaginationMeta;
  statistics: BetStatistics;
}

export interface PlaceBetData {
  tipId: string;
  amount: number;
  stakeType: "single" | "parlay" | "system";
  odds?: number;
}

export const betsApi = {
  getAll: (
    params: {
      page?: number;
      limit?: number;
      status?: string;
      sport?: string;
    } = {}
  ) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.status) searchParams.append("status", params.status);
    if (params.sport) searchParams.append("sport", params.sport);

    return api.get<BetsResponse>(`/bets?${searchParams.toString()}`);
  },

  place: (data: PlaceBetData) => api.post<{ bet: Bet }>("/bets", data),
};

// VIP API
export interface VIPEntitlement {
  hasActiveSubscription: boolean;
  hasVipAccess: boolean;
  subscriptions: Array<{
    id: string;
    plan: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  }>;
  availableTokens: Array<{
    id: string;
    type: string;
    quantity: number;
    used: number;
    remainingUses: number;
    expiresAt: string;
    tipId?: string;
    tip?: {
      id: string;
      title: string;
      sport: string;
      summary?: string;
    };
  }>;
}

export interface RedeemTokenResponse {
  tokenId: string;
  type: string;
  tipId?: string;
  remainingUses: number;
  expiresAt: string;
}

export const vipApi = {
  getEntitlements: () => api.get<VIPEntitlement>("/vip/tokens/redeem"),
  redeemToken: (token: string) =>
    api.post<RedeemTokenResponse>("/vip/tokens/redeem", { token }),
};

// Referral API
export interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  pendingReferrals: number;
  completedReferrals: number;
}

export interface ReferralEarning {
  id: string;
  type: string;
  amount: number;
  currency: string;
  tokens: number;
  status: string;
  description?: string;
  createdAt: string;
  confirmedAt?: string;
  referral: {
    referredUser: string;
  };
}

export interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: ReferralStats;
  recentReferrals: Array<{
    id: string;
    status: string;
    rewardAmount: number;
    createdAt: string;
    referredUser: {
      displayName?: string;
      email?: string;
      joinedAt: string;
    };
  }>;
  earnings: ReferralEarning[];
}

export const referralApi = {
  getData: () => api.get<ReferralData>("/referral"),
  applyCode: (referralCode: string) =>
    api.post<unknown>("/referral", { referralCode }),
};

// Earnings API
export interface WalletData {
  balance: number;
  currency: string;
  tokens: number;
  bonusTokens: number;
  totalEarned: number;
  totalWithdrawn: number;
}

export const earningsApi = {
  getWallet: () => api.get<WalletData>("/earnings"),
};
