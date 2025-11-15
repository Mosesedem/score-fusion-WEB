"use client";

import { useSession } from "next-auth/react";
import { useApiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

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
  createdAt: string;
  authorName?: string;
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const api = useApiClient();
  const [vipPredictions, setVipPredictions] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVIPHistory = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch VIP predictions that have ended (older than 2 hours from match date)
      const response = await api.get<{ predictions: Tip[] }>(
        "/predictions?vip=true"
      );
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Filter VIP predictions that are older than 2 hours from match date
      const historicalVIP = (response.data?.predictions || []).filter(
        (tip: Tip) => {
          if (!tip.matchDate) return false;
          const matchDate = new Date(tip.matchDate);
          return matchDate < twoHoursAgo;
        }
      );

      setVipPredictions(historicalVIP);
    } catch (error) {
      console.error("Failed to fetch VIP history:", error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (session) {
      fetchVIPHistory();
    } else {
      setLoading(false);
    }
  }, [session, fetchVIPHistory]);

  const getResultBadge = (result?: string) => {
    if (!result) return null;
    const colors = {
      won: "bg-green-500 text-white",
      lost: "bg-red-500 text-white",
      void: "bg-gray-500 text-white",
      pending: "bg-blue-500 text-white",
    };
    return (
      <Badge
        className={`${
          colors[result.toLowerCase() as keyof typeof colors] || colors.pending
        } text-[10px] md:text-xs px-1.5 md:px-2 py-0.5`}
      >
        {result.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
            {session ? "VIP Predictions History" : "VIP Predictions"}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-8">
            {session
              ? "View all completed VIP predictions and their outcomes"
              : "Sign in to access VIP predictions history"}
          </p>

          {!session && (
            <Card className="mb-4 md:mb-8 border-2 border-primary">
              <CardContent className="p-4 md:p-6 lg:p-8 text-center">
                <Lock className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 text-primary" />
                <h3 className="text-base md:text-lg lg:text-xl font-bold mb-2">
                  Sign in to view VIP predictions history
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                  Create an account or log in to access completed VIP
                  predictions
                </p>
                <Link href="/login">
                  <Button size="sm" className="text-xs md:text-sm">
                    Log In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {session && (
            <Card>
              <CardHeader className="p-3 md:p-4 lg:p-6">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Lock className="h-4 w-4 md:h-5 md:w-5" />
                  Completed VIP Predictions
                </CardTitle>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                  VIP predictions that have concluded (2+ hours after match
                  time)
                </p>
              </CardHeader>
              <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                {loading ? (
                  <div className="text-center py-8 md:py-12 text-muted-foreground text-xs md:text-sm">
                    Loading VIP history...
                  </div>
                ) : vipPredictions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                    {vipPredictions.map((tip) => (
                      <div
                        key={tip.id}
                        className="border-2 border-primary/50 rounded-lg p-3 md:p-4 hover:border-primary transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 md:gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 flex-wrap">
                              {/* <Badge className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                                {tip.sport}
                              </Badge> */}
                              {tip.league && (
                                <Badge className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                                  {tip.league}
                                </Badge>
                              )}
                              {tip.featured && (
                                <Badge className="bg-yellow-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                                  Featured
                                </Badge>
                              )}
                              {tip.result && getResultBadge(tip.result)}
                            </div>
                            <h4 className="text-muted-foreground text-sm md:text-base mb-1 md:mb-2 line-clamp-2">
                              {tip.title}
                            </h4>
                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground mb-2">
                              <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                              <span>
                                {tip.matchDate
                                  ? new Date(tip.matchDate).toLocaleString()
                                  : "N/A"}
                              </span>
                            </div>
                            {(tip.homeTeam || tip.awayTeam) && (
                              <div className="flex items-center gap-2 text-sm md:text-base font-bold mb-2">
                                {tip.homeTeam && (
                                  <div className="flex items-center gap-1">
                                    {tip.homeTeam.logoUrl && (
                                      <img
                                        src={tip.homeTeam.logoUrl}
                                        alt={tip.homeTeam.name}
                                        className="h-4 w-4 md:h-5 md:w-5 object-contain"
                                      />
                                    )}
                                    <span>
                                      {tip.homeTeam.shortName ||
                                        tip.homeTeam.name}
                                    </span>
                                  </div>
                                )}
                                <span className="text-muted-foreground font-normal text-sm md:text-base">
                                  vs
                                </span>
                                {tip.awayTeam && (
                                  <div className="flex items-center gap-1">
                                    {tip.awayTeam.logoUrl && (
                                      <img
                                        src={tip.awayTeam.logoUrl}
                                        alt={tip.awayTeam.name}
                                        className="h-4 w-4 md:h-5 md:w-5 object-contain"
                                      />
                                    )}
                                    <span>
                                      {tip.awayTeam.shortName ||
                                        tip.awayTeam.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            {tip.predictedOutcome && (
                              <div className="text-[10px] md:text-xs">
                                <span className="text-muted-foreground">
                                  Prediction:{" "}
                                </span>
                                <span className="font-medium">
                                  {tip.predictedOutcome}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {tip.odds && (
                              <>
                                <div className="text-base md:text-lg lg:text-xl font-bold text-primary">
                                  {tip.odds}
                                </div>
                                <div className="text-[10px] md:text-xs text-muted-foreground">
                                  Odds
                                </div>
                                {/* {tip.oddsSource && (
                                  <div className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5">
                                    {tip.oddsSource}
                                  </div>
                                )} */}
                              </>
                            )}
                          </div>
                        </div>
                        <Link href={`/tips/${tip.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[10px] md:text-xs"
                          >
                            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12 text-muted-foreground">
                    <Lock className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 opacity-50" />
                    <p className="text-sm md:text-base lg:text-lg">
                      No completed VIP predictions yet
                    </p>
                    <p className="text-xs md:text-sm mt-2">
                      Completed VIP predictions will appear here after matches
                      conclude
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
