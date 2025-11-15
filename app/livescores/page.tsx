"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  RefreshCw,
  Filter,
  Clock,
  Trophy,
  Play,
  Pause,
  Search,
  X,
  ChevronDown,
  Users,
} from "lucide-react";

interface Match {
  id: string;
  sport?: {
    name: string;
    displayName: string;
    icon?: string;
  };
  league?: {
    name: string;
    country?: string;
    logo?: string;
  };
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeTeamScore: number | null;
  awayTeamScore: number | null;
  status: string;
  period?: string;
  minute?: number;
  scheduledAt: string;
  venue?: string;
  odds?: Record<string, number>;
  live: boolean;
  canBet: boolean;
  recentEvents?: MatchEvent[];
}

interface MatchEvent {
  id: string;
  type: string;
  team: string;
  minute: number;
  player?: string;
  description?: string;
  createdAt: string;
}

type FilterStatus = "all" | "live" | "scheduled" | "finished";

export default function LiveScoresPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<string>("all");
  const [availableLeagues, setAvailableLeagues] = useState<string[]>([]);
  const [fetchedLeagues, setFetchedLeagues] = useState<string[]>([]);
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);

  const fetchMatches = useCallback(
    async (status?: FilterStatus, page: number = 1, search?: string) => {
      try {
        let statusParam = "";
        let searchParam = "";
        const pageParam = `&page=${page}&limit=100`;
        const sourceParam = "&source=api&sport=football";

        if (status && status !== "all") {
          statusParam = `&status=${status}`;
        }

        if (search) {
          searchParam = `&search=${encodeURIComponent(search)}`;
        }

        let dateParams = "";
        if (!status || status === "all") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 3);
          const endDate = new Date(today);
          endDate.setDate(endDate.getDate() + 14);
          endDate.setHours(23, 59, 59, 999);
          dateParams = `&dateFrom=${startDate.toISOString()}&dateTo=${endDate.toISOString()}`;
        } else if (status === "live") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          dateParams = `&dateFrom=${today.toISOString()}&dateTo=${tomorrow.toISOString()}`;
        } else if (status === "scheduled") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const twoWeeks = new Date(today);
          twoWeeks.setDate(twoWeeks.getDate() + 14);
          dateParams = `&dateFrom=${today.toISOString()}&dateTo=${twoWeeks.toISOString()}`;
        } else if (status === "finished") {
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          const lastWeek = new Date(today);
          lastWeek.setDate(lastWeek.getDate() - 7);
          lastWeek.setHours(0, 0, 0, 0);
          dateParams = `&dateFrom=${lastWeek.toISOString()}&dateTo=${today.toISOString()}`;
        }

        const url = `/api/livescores/matches?${sourceParam}${statusParam}${searchParam}${pageParam}${dateParams}`;

        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.matches) {
            if (page === 1) {
              setMatches(data.data.matches);
            } else {
              setMatches((prev) => [...prev, ...data.data.matches]);
            }

            if (data.data.pagination) {
              setPagination({
                total: data.data.pagination.total,
                totalPages: data.data.pagination.totalPages,
                hasMore: data.data.pagination.hasMore,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsSearching(false);
      }
    },
    []
  );

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setCurrentPage(1);
    await fetchMatches(filterStatus, 1, searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
    setIsSearching(true);
    fetchMatches(filterStatus, 1);
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchMatches(filterStatus, nextPage, searchQuery || undefined);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await fetchMatches(filterStatus, 1, searchQuery || undefined);
  };

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    fetchMatches(filterStatus, 1, searchQuery || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, fetchMatches]);

  useEffect(() => {
    const leaguesFromMatches = Array.from(
      new Set(matches.map((m) => m.league?.name).filter(Boolean))
    ) as string[];
    const merged = Array.from(
      new Set([...(leaguesFromMatches || []), ...(fetchedLeagues || [])])
    ).sort();
    setAvailableLeagues(merged);
  }, [matches, fetchedLeagues]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(today);
    from.setDate(from.getDate() - 14);
    const to = new Date(today);
    to.setDate(to.getDate() + 60);

    const url = `/api/livescores/leagues?dateFrom=${from.toISOString()}&dateTo=${to.toISOString()}&maxPages=8&source=both`;

    let aborted = false;
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (!aborted && json?.success && json?.data?.leagues) {
          const names: string[] = json.data.leagues
            .map((l: { name?: string }) => l?.name)
            .filter(Boolean);
          setFetchedLeagues(Array.from(new Set(names)).sort());
        }
      })
      .catch((err) =>
        console.error("[LiveScores] Failed to fetch leagues", err)
      );

    return () => {
      aborted = true;
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("favoriteTeams");
    if (saved) {
      try {
        setFavoriteTeams(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse favorite teams", e);
      }
    }
  }, []);

  const toggleFavorite = (teamName: string) => {
    setFavoriteTeams((prev) => {
      const newFavorites = prev.includes(teamName)
        ? prev.filter((t) => t !== teamName)
        : [...prev, teamName];
      localStorage.setItem("favoriteTeams", JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  useEffect(() => {
    if (!autoRefresh || searchQuery) return;

    const interval = setInterval(() => {
      fetchMatches(filterStatus, 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, filterStatus, searchQuery, fetchMatches]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        variant: "default" | "destructive" | "outline" | "secondary";
        label: string;
      }
    > = {
      live: { variant: "destructive", label: "LIVE" },
      scheduled: { variant: "outline", label: "Scheduled" },
      finished: { variant: "secondary", label: "Finished" },
      postponed: { variant: "outline", label: "Postponed" },
      cancelled: { variant: "outline", label: "Cancelled" },
    };

    const config = statusConfig[status] || {
      variant: "outline",
      label: status,
    };
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const formatMatchTime = (
    scheduledAt: string,
    status: string,
    minute?: number
  ) => {
    if (status === "live" && minute) {
      return `${minute}'`;
    }
    if (status === "finished") {
      return "FT";
    }
    const date = new Date(scheduledAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const liveMatches = matches.filter((m) => m.status === "live");
  const scheduledMatches = matches.filter((m) => m.status === "scheduled");
  const finishedMatches = matches.filter((m) => m.status === "finished");

  const filteredMatches =
    selectedLeague === "all"
      ? matches
      : matches.filter((m) => m.league?.name === selectedLeague);

  const favoriteMatches = filteredMatches.filter(
    (m) =>
      favoriteTeams.includes(m.homeTeam) || favoriteTeams.includes(m.awayTeam)
  );
  const nonFavoriteMatches = filteredMatches.filter(
    (m) =>
      !favoriteTeams.includes(m.homeTeam) && !favoriteTeams.includes(m.awayTeam)
  );

  const displayMatches =
    favoriteMatches.length > 0
      ? [...favoriteMatches, ...nonFavoriteMatches]
      : filteredMatches;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              Live Scores
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Real-time match updates and scores
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="gap-2"
            >
              {autoRefresh ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span className="hidden sm:inline">Auto</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Auto</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-destructive">
                {liveMatches.length}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Activity className="h-3 w-3 md:h-4 md:w-4" />
                Live Now
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-primary">
                {scheduledMatches.length}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3 md:h-4 md:w-4" />
                Upcoming
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl font-bold">
                {finishedMatches.length}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Trophy className="h-3 w-3 md:h-4 md:w-4" />
                Finished
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            {(["all", "live", "scheduled", "finished"] as FilterStatus[]).map(
              (status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="capitalize shrink-0"
                >
                  {status}
                </Button>
              )
            )}
          </div>

          {availableLeagues.length > 0 && (
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium shrink-0">League:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0">
                    {selectedLeague === "all" ? "All Leagues" : selectedLeague}
                    <ChevronDown className="h-3 w-3 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[250px] max-h-[400px] overflow-y-auto"
                >
                  <DropdownMenuLabel>Select League</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedLeague("all")}>
                    <span className="font-medium">All Leagues</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {matches.length}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {availableLeagues.map((league) => {
                    const leagueMatchCount = matches.filter(
                      (m) => m.league?.name === league
                    ).length;
                    return (
                      <DropdownMenuItem
                        key={league}
                        onClick={() => setSelectedLeague(league)}
                      >
                        <span
                          className={
                            selectedLeague === league ? "font-semibold" : ""
                          }
                        >
                          {league}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {leagueMatchCount}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {favoriteTeams.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {favoriteTeams.length} favorite team
                {favoriteTeams.length !== 1 ? "s" : ""} tracked
              </span>
            </div>
          )}
        </div>

        {/* Search Bar */}
        {/* <div className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search teams, leagues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="shrink-0"
            >
              {isSearching ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div> */}

        {/* Matches List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading matches...</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {displayMatches.map((match) => {
              const isFavorite =
                favoriteTeams.includes(match.homeTeam) ||
                favoriteTeams.includes(match.awayTeam);

              return (
                <Card
                  key={match.id}
                  className={`${
                    match.live ? "border-destructive border-2" : ""
                  } ${
                    isFavorite ? "border-primary" : ""
                  } hover:shadow-lg transition-all`}
                >
                  <CardContent className="p-4">
                    {match.league && (
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border">
                        <div className="flex items-center gap-2">
                          {match.league.logo && (
                            <Image
                              src={match.league.logo}
                              alt={match.league.name}
                              width={16}
                              height={16}
                              className="h-4 w-4 object-contain"
                            />
                          )}
                          <span className="text-xs md:text-sm font-medium">
                            {match.league.name}
                          </span>
                          {match.league.country && (
                            <span className="text-xs text-muted-foreground">
                              • {match.league.country}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isFavorite && (
                            <Badge variant="default" className="text-xs">
                              ⭐ Favorite
                            </Badge>
                          )}
                          {getStatusBadge(match.status)}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            {match.homeTeamLogo && (
                              <Image
                                src={match.homeTeamLogo}
                                alt={match.homeTeam}
                                width={24}
                                height={24}
                                className="h-6 w-6 object-contain"
                              />
                            )}
                            <span className="font-medium text-sm md:text-base">
                              {match.homeTeam}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(match.homeTeam);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            {favoriteTeams.includes(match.homeTeam)
                              ? "⭐"
                              : "☆"}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            {match.awayTeamLogo && (
                              <Image
                                src={match.awayTeamLogo}
                                alt={match.awayTeam}
                                width={24}
                                height={24}
                                className="h-6 w-6 object-contain"
                              />
                            )}
                            <span className="font-medium text-sm md:text-base">
                              {match.awayTeam}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(match.awayTeam);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            {favoriteTeams.includes(match.awayTeam)
                              ? "⭐"
                              : "☆"}
                          </Button>
                        </div>
                      </div>

                      <div className="text-center min-w-20">
                        {match.status === "live" ||
                        match.status === "finished" ? (
                          <>
                            <div className="text-2xl md:text-3xl font-bold mb-1">
                              {match.homeTeamScore ?? 0}
                            </div>
                            <div className="text-2xl md:text-3xl font-bold">
                              {match.awayTeamScore ?? 0}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm md:text-base font-medium text-muted-foreground">
                            <Clock className="h-4 w-4 mx-auto mb-1" />
                            {formatMatchTime(
                              match.scheduledAt,
                              match.status,
                              match.minute
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right min-w-[60px]">
                        <div className="text-xs md:text-sm font-medium">
                          {formatMatchTime(
                            match.scheduledAt,
                            match.status,
                            match.minute
                          )}
                        </div>
                        {match.venue && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {match.venue}
                          </div>
                        )}
                      </div>
                    </div>

                    {match.live &&
                      match.recentEvents &&
                      match.recentEvents.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="text-xs text-muted-foreground mb-2">
                            Recent Events:
                          </div>
                          <div className="space-y-1">
                            {match.recentEvents.slice(0, 3).map((event) => (
                              <div
                                key={event.id}
                                className="text-xs flex items-center gap-2"
                              >
                                <span className="font-mono text-muted-foreground">
                                  {event.minute}&apos;
                                </span>
                                <span className="capitalize">{event.type}</span>
                                {event.player && (
                                  <span className="text-muted-foreground">
                                    - {event.player}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && matches.length > 0 && pagination.hasMore && (
          <div className="mt-6 text-center">
            <Button
              onClick={handleLoadMore}
              variant="outline"
              disabled={refreshing}
              className="w-full sm:w-auto"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More ({matches.length} of {pagination.total})
                </>
              )}
            </Button>
          </div>
        )}

        {/* Live Scores Feed - Integrated as dedicated section below matches */}
        <Card className="mt-8 mb-6">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Live Scores Feed
            </h2>
            <div className="rounded-md overflow-hidden border border-border">
              <iframe
                src="https://www.livescore.bz/webmasters.asp?lang=en&sport=football(soccer)&data-1=today&data-2=&word=livescore"
                marginHeight={0}
                marginWidth={0}
                scrolling="auto"
                height="600"
                width="100%"
                frameBorder="0"
                className="w-full block"
                style={{ minHeight: "600px" }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
