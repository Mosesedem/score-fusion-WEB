/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Live Score API Usage Examples
 *
 * These examples show how to use the live score API
 * from your frontend or other parts of the application.
 */

// ==============================================
// Example 1: Fetch live matches
// ==============================================
export async function fetchLiveMatches() {
  const response = await fetch("/api/livescores/matches?status=live&limit=20");
  const data = await response.json();

  if (data.success) {
    console.log("Live matches:", data.data.matches);
    console.log("Pagination:", data.data.pagination);
    return data.data;
  }

  throw new Error(data.error || "Failed to fetch matches");
}

// ==============================================
// Example 2: Search for matches
// ==============================================
export async function searchMatches(query: string) {
  const response = await fetch(
    `/api/livescores/matches?search=${encodeURIComponent(
      query
    )}&source=api&limit=20`
  );
  const data = await response.json();

  if (data.success) {
    return {
      matches: data.data.matches,
      total: data.data.pagination.total,
    };
  }

  throw new Error(data.error || "Search failed");
}

// ==============================================
// Example 3: Paginated match loading
// ==============================================
export async function loadMatchesWithPagination(
  page: number = 1,
  status: "live" | "scheduled" | "finished" = "live"
) {
  const response = await fetch(
    `/api/livescores/matches?status=${status}&page=${page}&limit=20`
  );
  const data = await response.json();

  if (data.success) {
    return {
      matches: data.data.matches,
      pagination: data.data.pagination,
      hasMore: data.data.pagination.hasMore,
    };
  }

  throw new Error(data.error || "Failed to load matches");
}

// ==============================================
// Example 4: Filter matches by date range
// ==============================================
export async function getMatchesByDateRange(
  dateFrom: Date,
  dateTo: Date,
  sport?: string
) {
  const params = new URLSearchParams({
    dateFrom: dateFrom.toISOString().split("T")[0],
    dateTo: dateTo.toISOString().split("T")[0],
    limit: "50",
  });

  if (sport) {
    params.append("sport", sport);
  }

  const response = await fetch(`/api/livescores/matches?${params}`);
  const data = await response.json();

  if (data.success) {
    return data.data.matches;
  }

  throw new Error(data.error || "Failed to fetch matches");
}

// ==============================================
// Example 5: Get provider health status
// ==============================================
export async function getProviderStatus() {
  const response = await fetch("/api/livescores/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "status" }),
  });

  const data = await response.json();

  if (data.success) {
    return data.data.providers;
  }

  throw new Error(data.error || "Failed to get status");
}

// ==============================================
// Example 6: Refresh live scores
// ==============================================
export async function refreshLiveScores() {
  const response = await fetch("/api/livescores/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "refresh" }),
  });

  const data = await response.json();
  return data.success;
}

// ==============================================
// Example 7: React Hook for live matches
// ==============================================
import { useState, useEffect } from "react";

export function useLiveMatches(autoRefresh = true) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true);
        const data = await fetchLiveMatches();
        setMatches(data.matches);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load matches");
      } finally {
        setLoading(false);
      }
    }

    loadMatches();

    if (autoRefresh) {
      const interval = setInterval(loadMatches, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return { matches, loading, error };
}

// ==============================================
// Example 8: React Hook for search with debounce
// ==============================================
export function useMatchSearch(query: string, delay = 500) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchMatches(query);
        setResults(data.matches);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [query, delay]);

  return { results, loading, error };
}

// ==============================================
// Example 9: React Hook for infinite scroll
// ==============================================
export function useInfiniteMatches(status: "live" | "scheduled" | "finished") {
  const [matches, setMatches] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const data = await loadMatchesWithPagination(page, status);

      setMatches((prev) => [...prev, ...data.matches]);
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    } catch (err) {
      console.error("Failed to load more matches:", err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setPage(1);
    setMatches([]);
    setHasMore(true);

    try {
      setLoading(true);
      const data = await loadMatchesWithPagination(1, status);

      setMatches(data.matches);
      setHasMore(data.hasMore);
      setPage(2);
    } catch (err) {
      console.error("Failed to refresh matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMore();
  }, []); // Load initial data

  return { matches, loading, hasMore, loadMore, refresh };
}

// ==============================================
// Example 10: Component usage
// ==============================================
/*
// In your React component:

import { useLiveMatches, useMatchSearch } from '@/lib/examples/livescore-usage';

export function LiveScoresComponent() {
  const { matches, loading, error } = useLiveMatches(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { results, loading: searchLoading } = useMatchSearch(searchQuery);
  
  const displayMatches = searchQuery ? results : matches;
  
  return (
    <div>
      <input 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search matches..."
      />
      
      {(loading || searchLoading) && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      
      <div>
        {displayMatches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
*/
