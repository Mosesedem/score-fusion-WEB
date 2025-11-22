"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  TrendingUp,
  Activity,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
  Percent,
  Award,
  Clock,
} from "lucide-react";

interface Prediction {
  id: string;
  title: string;
  sport: string;
  result?: "won" | "lost" | "void" | "pending";
  successRate?: number;
  odds?: number;
  league: string;
  matchDate: string;
  homeTeam: {
    name: string;
  };
  awayTeam: {
    name: string;
  };
  predictedOutcome: string;
}

interface Analytics {
  totalPredictions: number;
  pendingPredictions: number;
  completedPredictions: number;
  tipPerformance: {
    total: number;
    won: number;
    lost: number;
    pending: number;
    successRate: number;
  };
  leagueStats: {
    league: string;
    predictions: number;
    successRate: number;
  }[];
  trendingTeams: {
    team: string;
    correct: number;
    total: number;
    successRate: number;
  }[];
}

export default function AnalyticsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalPredictions: 0,
    pendingPredictions: 0,
    completedPredictions: 0,
    tipPerformance: {
      total: 0,
      won: 0,
      lost: 0,
      pending: 0,
      successRate: 0,
    },
    leagueStats: [],
    trendingTeams: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch real-time data
  const fetchData = async () => {
    try {
      setLoading(true);
      console.groupCollapsed(`[Analytics] fetchData (${selectedPeriod})`);
      console.time("[Analytics] fetchData time");

      // Determine date range based on selected period
      const now = new Date();
      const start = new Date(now);
      const end = new Date(now);

      if (selectedPeriod === "today") {
        start.setHours(0, 0, 0, 0);
      } else if (selectedPeriod === "week") {
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
      } else if (selectedPeriod === "month") {
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
      }
      end.setHours(23, 59, 59, 999);

      // Fetch predictions
      const predictionsUrl = `/api/predictions?history=true&limit=1000`;

      console.log("[Analytics] Fetching URL", predictionsUrl);

      const predictionsRes = await fetch(predictionsUrl);

      console.log("[Analytics] Response status", {
        ok: predictionsRes.ok,
        status: predictionsRes.status,
      });

      let allPredictions: Prediction[] = [];

      // Process predictions response
      try {
        const predictionsData = await predictionsRes.json().catch(() => null);
        console.log("[Analytics] predictions json", predictionsData);
        if (!predictionsRes.ok) {
          console.error(
            "[Analytics] predictions fetch failed",
            predictionsRes.status
          );
        } else if (!predictionsData?.success) {
          console.warn(
            "[Analytics] predictions success=false",
            predictionsData?.error
          );
        } else if (!predictionsData?.data?.predictions) {
          console.warn("[Analytics] predictions missing data.predictions");
        } else {
          allPredictions = predictionsData.data.predictions as Prediction[];
        }
      } catch (e) {
        console.error("[Analytics] predictions parse error", e);
      }

      console.log("[Analytics] predictions count", allPredictions.length);

      setPredictions(allPredictions);

      // Calculate analytics
      console.time("[Analytics] calculateAnalytics time");
      calculateAnalytics(allPredictions, start, end);
      console.timeEnd("[Analytics] calculateAnalytics time");
      setLastUpdate(new Date());
      console.timeEnd("[Analytics] fetchData time");
      console.groupEnd();
    } catch (error) {
      console.error("[Analytics] Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (
    allPredictions: Prediction[],
    start: Date,
    end: Date
  ) => {
    console.groupCollapsed("[Analytics] calculateAnalytics details");
    console.log("[Analytics] input sizes", {
      allPredictions: allPredictions.length,
    });

    // Filter predictions by date range
    const filteredPredictions = allPredictions.filter((p) => {
      const matchDate = new Date(p.matchDate);
      return matchDate >= start && matchDate <= end;
    });

    console.log("[Analytics] filtered predictions", filteredPredictions.length);

    // Prediction analytics
    const totalPredictions = filteredPredictions.length;
    const pendingPredictions = filteredPredictions.filter(
      (p) => p.result === "pending"
    ).length;
    const completedPredictions = totalPredictions - pendingPredictions;

    // Tip performance
    const wonTips = filteredPredictions.filter(
      (t) => t.result === "won"
    ).length;
    const lostTips = filteredPredictions.filter(
      (t) => t.result === "lost"
    ).length;
    const pendingTips = filteredPredictions.filter(
      (t) => t.result === "pending"
    ).length;
    const totalTips = filteredPredictions.length;
    const successRate =
      wonTips + lostTips > 0 ? (wonTips / (wonTips + lostTips)) * 100 : 0;

    // League statistics
    const leagueMap = new Map<
      string,
      { predictions: number; won: number; lost: number }
    >();
    filteredPredictions.forEach((prediction) => {
      const league = prediction.league;
      const existing = leagueMap.get(league) || {
        predictions: 0,
        won: 0,
        lost: 0,
      };
      existing.predictions += 1;
      if (prediction.result === "won") existing.won += 1;
      else if (prediction.result === "lost") existing.lost += 1;
      leagueMap.set(league, existing);
    });

    const leagueStats = Array.from(leagueMap.entries())
      .map(([league, data]) => ({
        league,
        predictions: data.predictions,
        successRate:
          data.won + data.lost > 0
            ? (data.won / (data.won + data.lost)) * 100
            : 0,
      }))
      .sort((a, b) => b.predictions - a.predictions)
      .slice(0, 5);

    // Team form analysis (based on correct predictions)
    const teamMap = new Map<string, { correct: number; total: number }>();

    filteredPredictions.forEach((p) => {
      if (p.result === "won" || p.result === "lost") {
        let team: string | null = null;
        if (p.predictedOutcome === "home_win") team = p.homeTeam.name;
        else if (p.predictedOutcome === "away_win") team = p.awayTeam.name;
        // Add more cases if needed

        if (team) {
          const existing = teamMap.get(team) || { correct: 0, total: 0 };
          existing.total += 1;
          if (p.result === "won") existing.correct += 1;
          teamMap.set(team, existing);
        }
      }
    });

    const trendingTeams = Array.from(teamMap.entries())
      .map(([team, agg]) => ({
        team,
        correct: agg.correct,
        total: agg.total,
        successRate: agg.total > 0 ? (agg.correct / agg.total) * 100 : 0,
      }))
      .filter((t) => t.total > 0)
      .sort((a, b) => b.correct - a.correct)
      .slice(0, 5);

    setAnalytics({
      totalPredictions,
      pendingPredictions,
      completedPredictions,
      tipPerformance: {
        total: totalTips,
        won: wonTips,
        lost: lostTips,
        pending: pendingTips,
        successRate,
      },
      leagueStats,
      trendingTeams,
    });
    console.log("[Analytics] analytics computed", {
      totals: {
        predictions: totalPredictions,
        pending: pendingPredictions,
        completed: completedPredictions,
      },
      leagueStatsCount: leagueStats.length,
      trendingTeamsCount: trendingTeams.length,
    });
    console.groupEnd();
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const getFormColor = (result: string) => {
    switch (result) {
      case "W":
        return "bg-green-500";
      case "D":
        return "bg-yellow-500";
      case "L":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Prediction Analytics</h1>
              <p className="text-muted-foreground">
                Real-time prediction statistics, performance metrics, and
                insights
              </p>
            </div>
            <Button
              onClick={fetchData}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {/* Filters and Last Update */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === "today" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("today")}
                size="sm"
              >
                Today
              </Button>
              <Button
                variant={selectedPeriod === "week" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("week")}
                size="sm"
              >
                This Week
              </Button>
              <Button
                variant={selectedPeriod === "month" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("month")}
                size="sm"
              >
                This Month
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Predictions
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalPredictions}
              </div>
              <p className="text-xs text-muted-foreground">
                For {selectedPeriod}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Predictions
              </CardTitle>
              <Activity className="h-4 w-4 text-primary animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {analytics.pendingPredictions}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting results</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Predictions
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.completedPredictions}
              </div>
              <p className="text-xs text-muted-foreground">Results available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tip Success Rate
              </CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {analytics.tipPerformance.successRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.tipPerformance.won}W /{" "}
                {analytics.tipPerformance.lost}L
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Predictions */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary animate-pulse" />
                  Recent Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading recent predictions...
                  </div>
                ) : predictions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No predictions available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {predictions.slice(0, 10).map((prediction) => (
                      <div
                        key={prediction.id}
                        className="border border-border rounded-lg p-4 hover:border-primary transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">
                            {prediction.title}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              prediction.result === "won"
                                ? "bg-green-500 text-white"
                                : prediction.result === "lost"
                                ? "bg-red-500 text-white"
                                : "bg-yellow-500 text-white"
                            }`}
                          >
                            {prediction.result?.toUpperCase() || "PENDING"}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.league} • {prediction.homeTeam.name} vs{" "}
                          {prediction.awayTeam.name}
                        </div>
                        <div className="text-sm">
                          Predicted: {prediction.predictedOutcome} • Odds:{" "}
                          {prediction.odds}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* League Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  League Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.leagueStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No league data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics.leagueStats.map((league, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{league.league}</span>
                          <span className="text-sm text-muted-foreground">
                            {league.predictions} predictions
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{
                                width: `${league.successRate}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-16 text-right">
                            {league.successRate.toFixed(1)}% success
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tip Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Tip Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Won</span>
                    <span className="font-semibold text-green-500">
                      {analytics.tipPerformance.won}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lost</span>
                    <span className="font-semibold text-red-500">
                      {analytics.tipPerformance.lost}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-semibold text-yellow-500">
                      {analytics.tipPerformance.pending}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {analytics.tipPerformance.successRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Success Rate
                    </div>
                  </div>
                </div>

                <Link href="/tips">
                  <Button className="w-full" variant="outline">
                    View All Tips
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Trending Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Performing Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.trendingTeams.map((team, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Award
                            className={`h-4 w-4 ${
                              index === 0
                                ? "text-yellow-500"
                                : index === 1
                                ? "text-gray-400"
                                : index === 2
                                ? "text-orange-600"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="font-medium text-sm">
                            {team.team}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {team.correct} correct / {team.total} predictions
                        </div>
                        <span className="text-sm font-semibold">
                          {team.successRate.toFixed(1)}% success
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/tips?sport=football">
                  <Button className="w-full justify-start" variant="outline">
                    <Target className="h-4 w-4 mr-2" />
                    Football Tips
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    My Dashboard
                  </Button>
                </Link>
                <Link href="/vip">
                  <Button className="w-full justify-start" variant="outline">
                    <Trophy className="h-4 w-4 mr-2" />
                    VIP Access
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Predictions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading predictions...
              </div>
            ) : predictions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No predictions available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        League
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Match
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                        Prediction
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                        Odds
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.slice(0, 15).map((prediction) => (
                      <tr
                        key={prediction.id}
                        className="border-b border-border hover:bg-secondary/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm">
                          {new Date(prediction.matchDate).toLocaleDateString(
                            "en-US",
                            {
                              timeZone: "UTC",
                              month: "short",
                              day: "numeric",
                              weekday: "short",
                            }
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {prediction.league}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            {prediction.homeTeam.name}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-2">
                            {prediction.awayTeam.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-sm">
                          {prediction.predictedOutcome}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold">
                          {prediction.odds}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              prediction.result === "won"
                                ? "bg-green-500 text-white"
                                : prediction.result === "lost"
                                ? "bg-red-500 text-white"
                                : prediction.result === "void"
                                ? "bg-gray-500 text-white"
                                : "bg-yellow-500 text-white"
                            }`}
                          >
                            {prediction.result?.toUpperCase() || "PENDING"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
