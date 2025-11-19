"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Lock, Calendar, Target } from "lucide-react";
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
  ticketSnapshots: string[];
  isVIP: boolean;
  featured: boolean;
  status: string;
  result?: string;
  successRate?: number;
  category?: string;
  createdAt: string;
  authorName?: string;
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
  const api = useApiClient();

  useEffect(() => {
    const fetchTips = async () => {
      try {
        setLoading(true);
        const response = await api.get<PredictionsData>("/predictions");
        if (response.success && response.data) {
          const allPredictions = response.data.predictions || [];

          const now = new Date();
          const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
          const isHistorical = (p: Tip) => {
            const hasResult = p.result && p.result !== "pending";
            const isPast = p.matchDate
              ? new Date(p.matchDate) < twoHoursAgo
              : false;
            return Boolean(hasResult || isPast);
          };
          const currentPredictions = allPredictions.filter(
            (p) => !isHistorical(p)
          );
          const historyPredictions = allPredictions.filter((p) =>
            isHistorical(p)
          );
          setTips(currentPredictions);
          setHistoryTips(historyPredictions);
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

  const isVIPLocked = (tip: Tip) => {
    if (!tip.isVIP) return false;
    if (hasVIPAccess) return false;
    if (!tip.matchDate) return true;
    const matchDate = new Date(tip.matchDate);
    const unlockTime = new Date(matchDate.getTime() + 8 * 60 * 60 * 1000);
    return new Date() < unlockTime;
  };

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
    return arr;
  }, [filteredTips, viewMode]);

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
            <div className="text-center py-8 md:py-12">
              <p className="text-muted-foreground text-xs md:text-sm lg:text-base">
                Loading predictions...
              </p>
            </div>
          ) : viewMode === "current" && tips.length === 0 ? (
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4 lg:gap-6">
              {displayedTips.map((tip) => (
                <Card
                  key={tip.id}
                  className={`border-2 ${
                    tip.isVIP ? "border-primary" : "border-border"
                  } hover:border-primary transition-colors`}
                >
                  <CardHeader className="pb-2 p-3 md:p-4 lg:p-6 lg:pb-3">
                    <div className="flex items-center justify-between mb-1.5 md:mb-2 gap-1.5 md:gap-2">
                      <Badge className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                        {tip.sport}
                      </Badge>
                      <div className="flex items-center gap-1 shrink-0 flex-wrap">
                        {tip.isVIP && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                            <Lock className="h-2 w-2 md:h-2.5 md:w-2.5 mr-0.5 md:mr-1" />
                            VIP
                          </Badge>
                        )}
                        {tip.featured && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                            Featured
                          </Badge>
                        )}
                        {tip.result && (
                          <Badge
                            className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 ${
                              tip.result === "won"
                                ? "bg-green-500 text-white"
                                : tip.result === "lost"
                                ? "bg-red-500 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {tip.result.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-sm md:text-base lg:text-lg line-clamp-2">
                      {tip.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 lg:p-6 lg:pt-0">
                    {/* Team Match Display */}
                    {(tip.homeTeam || tip.awayTeam) && (
                      <div className="flex items-center justify-between mb-3 md:mb-4 p-2 md:p-3 bg-secondary rounded-md">
                        <div className="flex-1 text-center min-w-0">
                          {tip.homeTeam && (
                            <>
                              {tip.homeTeam.logoUrl && (
                                <img
                                  src={tip.homeTeam.logoUrl}
                                  alt={tip.homeTeam.name}
                                  className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 mx-auto mb-1 object-contain"
                                />
                              )}
                              <p className="text-[10px] md:text-xs lg:text-sm font-medium line-clamp-1">
                                {tip.homeTeam.shortName || tip.homeTeam.name}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="px-2 md:px-3 text-muted-foreground font-bold text-[10px] md:text-xs lg:text-sm shrink-0">
                          VS
                        </div>
                        <div className="flex-1 text-center min-w-0">
                          {tip.awayTeam && (
                            <>
                              {tip.awayTeam.logoUrl && (
                                <img
                                  src={tip.awayTeam.logoUrl}
                                  alt={tip.awayTeam.name}
                                  className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 mx-auto mb-1 object-contain"
                                />
                              )}
                              <p className="text-[10px] md:text-xs lg:text-sm font-medium line-clamp-1">
                                {tip.awayTeam.shortName || tip.awayTeam.name}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Prediction Summary */}
                    <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-3">
                      {isVIPLocked(tip)
                        ? "🔒 Unlock VIP access to view full analysis and ticket snapshots"
                        : tip.summary || tip.content}
                    </p>

                    {/* Odds and Prediction */}
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div>
                        {tip.odds && (
                          <>
                            <div className="text-lg md:text-xl lg:text-2xl font-bold text-primary">
                              {tip.odds}
                            </div>
                            <div className="text-[10px] md:text-xs text-muted-foreground">
                              Odds
                            </div>
                          </>
                        )}
                      </div>
                      {tip.predictedOutcome && (
                        <div className="text-right">
                          <div className="text-xs md:text-sm font-bold line-clamp-1">
                            {tip.predictedOutcome}
                          </div>
                          <div className="text-[10px] md:text-xs text-muted-foreground">
                            Prediction
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground mb-3 md:mb-4 gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3 shrink-0" />
                        <span className="truncate">
                          {new Date(tip.createdAt).toLocaleString("en-NG", {
                            timeZone: "Africa/Lagos",
                          })}
                        </span>
                      </div>
                      {tip.authorName && (
                        <span className="truncate">By {tip.authorName}</span>
                      )}
                    </div>

                    {/* Ticket Snapshots Indicator */}
                    {!tip.isVIP &&
                      tip.ticketSnapshots &&
                      tip.ticketSnapshots.length > 0 && (
                        <div className="mb-3 md:mb-4 text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          <span>
                            {tip.ticketSnapshots.length} ticket snapshot(s)
                            available
                          </span>
                        </div>
                      )}

                    <Link href={`/tips/${tip.id}`}>
                      <Button
                        className="w-full text-[10px] md:text-xs lg:text-sm"
                        variant="outline"
                        size="sm"
                      >
                        {isVIPLocked(tip) ? (
                          <>
                            <Lock className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                            Unlock Full Analysis
                          </>
                        ) : (
                          "View Details"
                        )}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading &&
            filteredTips.length === 0 &&
            (viewMode === "current"
              ? tips.length > 0
              : historyTips.length > 0) && (
              <Card>
                <CardContent className="p-6 md:p-8 lg:p-12 text-center">
                  <p className="text-muted-foreground mb-4 text-xs md:text-sm lg:text-base">
                    No{" "}
                    {filter === "all" ? "" : filter === "free" ? "free" : "VIP"}{" "}
                    predictions match your filter.
                  </p>
                  <Button size="sm" onClick={() => setFilter("all")}>
                    Clear Filter
                  </Button>
                </CardContent>
              </Card>
            )}
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
