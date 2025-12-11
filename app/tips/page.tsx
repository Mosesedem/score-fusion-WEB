"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Lock, Target, Loader2, Crown } from "lucide-react";
import { useApiClient, ApiResponse } from "@/lib/api-client";

interface Tip {
  id: string;
  title: string;
  summary?: string;
  content: string;
  odds?: number;
  oddsSource?: string;
  sport: string;
  league?: string;
  matchDate?: string;
  homeTeam?: {
    id: string;
    name: string;
    shortName?: string;
    logoUrl?: string;
  };
  awayTeam?: {
    id: string;
    name: string;
    shortName?: string;
    logoUrl?: string;
  };
  predictionType?: string;
  predictedOutcome?: string;
  confidenceLevel?: number;
  ticketSnapshots: string[];
  isVIP: boolean;
  featured: boolean;
  status: string;
  result?: string;
  successRate?: number;
  category?: string;
  createdAt: string;
  authorName?: string;
  matchResult?: string;
  tipResult?: {
    id: string;
    settledAt: string;
    outcome: string;
    payout?: number;
    createdAt: string;
  };
}

interface PredictionsData {
  predictions: Tip[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [historyTips, setHistoryTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "free" | "vip">("all");
  const [viewMode, setViewMode] = useState<"current" | "history">("current");
  const [hasVIPAccess, setHasVIPAccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const api = useApiClient();

  useEffect(() => {
    const fetchTips = async () => {
      try {
        setLoading(true);
        // Fetch current predictions (non-VIP by default)
        const currentResponse = await api.get<PredictionsData>("/predictions");
        // Fetch historical predictions (all predictions including VIP)
        const historyResponse = await api.get<PredictionsData>(
          "/predictions?history=true"
        );

        if (
          currentResponse.success &&
          currentResponse.data &&
          historyResponse.success &&
          historyResponse.data
        ) {
          const currentPredictions = currentResponse.data.predictions || [];
          const allHistoryPredictions = historyResponse.data.predictions || [];

          const now = new Date();
          const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
          const isHistorical = (p: Tip) => {
            const hasResult = p.result && p.result !== "pending";
            const isPast = p.matchDate
              ? new Date(p.matchDate) < twoHoursAgo
              : false;
            return Boolean(hasResult || isPast);
          };

          // Filter current predictions to exclude historical ones
          const filteredCurrent = currentPredictions.filter(
            (p) => !isHistorical(p)
          );
          // Use all historical predictions from the history endpoint
          const filteredHistory = allHistoryPredictions;

          setTips(filteredCurrent);
          setHistoryTips(filteredHistory);
        }
      } catch (error) {
        console.error("Failed to fetch predictions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTips();
  }, [api]);

  useEffect(() => {
    const checkVIPAccess = async () => {
      try {
        const res = await api.get("/vip/status");
        if (res.success) {
          const data = res.data as { hasAccess: boolean };
          setHasVIPAccess(data.hasAccess);
        }
      } catch (error) {
        console.error("Failed to check VIP access:", error);
      }
    };

    checkVIPAccess();
  }, [api]);

  const filteredTips = useMemo(() => {
    const tipsToFilter = viewMode === "current" ? tips : historyTips;
    return tipsToFilter.filter((tip) => {
      if (filter === "all") return true;
      if (filter === "free") return !tip.isVIP;
      if (filter === "vip") return tip.isVIP;
      return true;
    });
  }, [tips, historyTips, filter, viewMode]);

  // Reset to page 1 when filter or viewMode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, viewMode]);

  const displayedTips = useMemo(() => {
    const arr = [...filteredTips];
    arr.sort((a, b) => {
      const aDate = a.matchDate ? new Date(a.matchDate).getTime() : -Infinity;
      const bDate = b.matchDate ? new Date(b.matchDate).getTime() : -Infinity;
      if (viewMode === "current") {
        const aVal = a.matchDate ? aDate : Infinity;
        const bVal = b.matchDate ? bDate : Infinity;
        return aVal - bVal;
      } else {
        return bDate - aDate;
      }
    });
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return arr.slice(startIndex, endIndex);
  }, [filteredTips, viewMode, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTips.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-3 md:px-4 py-6 md:py-8 lg:py-12">
          <div className="max-w-3xl">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3 lg:mb-4">
              Expert Sports Predictions
            </h1>
            <p className="text-sm md:text-base lg:text-xl text-muted-foreground">
              Data-driven analysis and predictions from professional analysts.
              Get free predictions and premium VIP tips.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 lg:py-6">
          <div className="grid grid-cols-3 gap-2 md:gap-4 lg:gap-6">
            <div className="text-center">
              <Target className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-primary mx-auto mb-1 md:mb-2" />
              <div className="text-base md:text-lg lg:text-xl font-bold">
                {tips.filter((t) => !t.isVIP).length}
              </div>
              <div className="text-[10px] md:text-xs lg:text-sm text-muted-foreground">
                Free Predictions
              </div>
            </div>
            <div className="text-center">
              <Lock className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-primary mx-auto mb-1 md:mb-2" />
              <div className="text-base md:text-lg lg:text-xl font-bold">
                {tips.filter((t) => t.isVIP).length}
              </div>
              <div className="text-[10px] md:text-xs lg:text-sm text-muted-foreground">
                VIP Predictions
              </div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-primary mx-auto mb-1 md:mb-2" />
              <div className="text-base md:text-lg lg:text-xl font-bold">
                {historyTips.filter((t) => t.result === "won").length}
              </div>
              <div className="text-[10px] md:text-xs lg:text-sm text-muted-foreground">
                Winning Predictions
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips List */}
      <section className="py-4 md:py-8 lg:py-12">
        <div className="container mx-auto px-3 md:px-4">
          {/* View Mode Tabs */}
          <div className="flex gap-1.5 md:gap-2 mb-4 md:mb-6">
            <Button
              variant={viewMode === "current" ? "default" : "outline"}
              onClick={() => setViewMode("current")}
              className="text-xs md:text-sm"
              size="sm"
            >
              Current Predictions ({tips.length})
            </Button>
            <Button
              variant={viewMode === "history" ? "default" : "outline"}
              onClick={() => setViewMode("history")}
              className="text-xs md:text-sm"
              size="sm"
            >
              History ({historyTips.length})
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-6 lg:mb-8">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className="text-xs md:text-sm"
              size="sm"
            >
              All Predictions
            </Button>
            <Button
              variant={filter === "free" ? "default" : "outline"}
              onClick={() => setFilter("free")}
              className="text-xs md:text-sm"
              size="sm"
            >
              Free Predictions
            </Button>
            <Button
              variant={filter === "vip" ? "default" : "outline"}
              onClick={() => setFilter("vip")}
              className="text-xs md:text-sm"
              size="sm"
            >
              <Lock className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              VIP Predictions
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
              <p className="text-sm">Loading tips...</p>
            </div>
          ) : viewMode === "current" && tips.length === 0 ? (
            filter === "vip" && !hasVIPAccess ? (
              <Card>
                <CardContent className="p-6 md:p-8 lg:p-12 text-center">
                  <p className="text-muted-foreground mb-4 text-xs md:text-sm lg:text-base">
                    Unlock premium tips by subscribing to VIP.
                  </p>
                  <Link href="/vip">
                    <Button size="sm" className="text-xs md:text-sm">
                      <Lock className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                      Get VIP Access
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 md:p-8 lg:p-12 text-center">
                  <p className="text-muted-foreground mb-4 text-xs md:text-sm lg:text-base">
                    No current predictions available at the moment. Check back
                    soon or view our history!
                  </p>
                  <Button size="sm" onClick={() => setViewMode("history")}>
                    View History
                  </Button>
                </CardContent>
              </Card>
            )
          ) : viewMode === "history" && historyTips.length === 0 ? (
            <Card>
              <CardContent className="p-6 md:p-8 lg:p-12 text-center">
                <p className="text-muted-foreground mb-4 text-xs md:text-sm lg:text-base">
                  No historical predictions yet. Check back after some
                  predictions are completed!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {displayedTips.map((tip) => (
                <Link key={tip.id} href={`/tips/${tip.id}`} className="block">
                  <Card className="hover:shadow-lg transition-all hover:border-primary/50">
                    <CardContent className="p-3 sm:p-4">
                      {/* Match Teams with Logos */}
                      {tip.homeTeam && tip.awayTeam ? (
                        <div className="mb-3">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {tip.homeTeam.logoUrl && (
                                <div className="relative h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                                  <img
                                    src={tip.homeTeam.logoUrl}
                                    alt={tip.homeTeam.name}
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              <span className="font-semibold text-sm sm:text-base truncate">
                                {tip.homeTeam.name}
                              </span>
                            </div>
                            <div className="px-2 py-1 bg-muted rounded text-xs font-bold">
                              VS
                            </div>
                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                              <span className="font-semibold text-sm sm:text-base truncate">
                                {tip.awayTeam.name}
                              </span>
                              {tip.awayTeam.logoUrl && (
                                <div className="relative h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                                  <img
                                    src={tip.awayTeam.logoUrl}
                                    alt={tip.awayTeam.name}
                                    className="object-contain"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <h3 className="font-semibold text-sm sm:text-base mb-2">
                          {tip.title}
                        </h3>
                      )}

                      {/* League & Sport */}
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mb-2">
                        <span className="px-2 py-0.5 bg-secondary rounded">
                          {tip.sport}
                        </span>
                        {tip.league && (
                          <span className="truncate">{tip.league}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-[14px] sm:text-xs text-muted-foreground mb-2">
                        {tip.matchDate && (
                          <span className="truncate">
                            {new Date(tip.matchDate).toLocaleString("en-US", {
                              weekday: "short",
                              timeZone: "UTC",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                        )}
                      </div>

                      {/* Prediction Summary */}
                      {tip.summary && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                          {tip.summary}
                        </p>
                      )}

                      {/* Tip Result Details for History */}
                      {viewMode === "history" && tip.tipResult && (
                        <details className="mb-3">
                          <summary className="text-[10px] md:text-xs lg:text-sm font-medium cursor-pointer text-primary hover:text-primary/80">
                            Tip Result Details
                          </summary>
                          <div className="mt-1 space-y-1 text-[10px] md:text-xs lg:text-sm pl-2 border-l-2 border-primary/20">
                            <div>
                              <span className="text-muted-foreground">
                                Settled At:{" "}
                              </span>
                              <span className="font-medium">
                                {new Date(
                                  tip.tipResult.settledAt
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Outcome:{" "}
                              </span>
                              <span className="font-medium capitalize">
                                {tip.tipResult.outcome}
                              </span>
                            </div>
                            {tip.tipResult.payout && (
                              <div>
                                <span className="text-muted-foreground">
                                  Payout:{" "}
                                </span>
                                <span className="font-medium">
                                  €{tip.tipResult.payout}
                                </span>
                              </div>
                            )}
                          </div>
                        </details>
                      )}

                      {/* Ticket Snapshots Indicator */}
                      {!tip.isVIP &&
                        tip.ticketSnapshots &&
                        tip.ticketSnapshots.length > 0 && (
                          <div className="mb-3 text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3" />
                            <span>
                              {tip.ticketSnapshots.length} ticket snapshot(s)
                              available
                            </span>
                          </div>
                        )}

                      {/* Footer - Odds & Prediction */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        {tip.predictedOutcome && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              Prediction:
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-primary">
                              {tip.predictedOutcome}
                            </span>
                          </div>
                        )}
                        {tip.odds && (
                          <div className="px-2 py-1 bg-primary/10 text-primary rounded font-bold text-xs sm:text-sm">
                            Odds: {Number(tip.odds).toFixed(2)}
                          </div>
                        )}
                        {tip.isVIP && (
                          <Crown className="h-4 w-4 text-amber-500" />
                        )}
                        {viewMode === "history" && tip.result === "won" && (
                          <div className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                            Won
                          </div>
                        )}
                        {viewMode === "history" && tip.result === "lost" && (
                          <div className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                            Lost
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 md:mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {!loading &&
            filteredTips.length === 0 &&
            (filter === "vip" && !hasVIPAccess ? (
              <Card>
                <CardContent className="p-6 md:p-8 lg:p-12 text-center">
                  <p className="text-muted-foreground mb-4 text-xs md:text-sm lg:text-base">
                    Unlock premium tips by subscribing to VIP.
                  </p>
                  <Link href="/vip">
                    <Button size="sm" className="text-xs md:text-sm">
                      <Lock className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                      Get VIP Access
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              (viewMode === "current"
                ? tips.length > 0
                : historyTips.length > 0) && (
                <Card>
                  <CardContent className="p-6 md:p-8 lg:p-12 text-center">
                    <p className="text-muted-foreground mb-4 text-xs md:text-sm lg:text-base">
                      No{" "}
                      {filter === "all"
                        ? ""
                        : filter === "free"
                        ? "free"
                        : "VIP"}{" "}
                      predictions match your filter.
                    </p>
                    <Button size="sm" onClick={() => setFilter("all")}>
                      Clear Filter
                    </Button>
                  </CardContent>
                </Card>
              )
            ))}
        </div>
      </section>

      {/* CTA Section */}
      {!hasVIPAccess && (
        <section className="border-t border-border bg-secondary py-6 md:py-8 lg:py-12">
          <div className="container mx-auto px-3 md:px-4 text-center">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3 lg:mb-4">
              Want Premium Predictions?
            </h2>
            <p className="text-sm md:text-base lg:text-xl text-muted-foreground mb-4 md:mb-6 px-2">
              Upgrade to VIP for exclusive expert analysis, ticket snapshots,
              and premium predictions
            </p>
            <Link href="/vip">
              <Button size="sm" className="text-xs md:text-sm">
                <Lock className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Get VIP Access
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
