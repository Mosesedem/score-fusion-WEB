"use client";
/* eslint-disable @next/next/no-img-element */

import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Lock,
  Star,
  TrendingUp,
  CheckCircle,
  Target,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function VIPAreaPage() {
  const { user } = useAuth();
  const api = useApiClient();
  const [hasVIPAccess, setHasVIPAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenCode, setTokenCode] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [vipPredictions, setVipPredictions] = useState<
    Array<{
      id: string;
      title: string;
      summary?: string;
      content: string;
      odds?: number;
      sport: string;
      league?: string;
      homeTeam?: { name: string; logoUrl?: string };
      awayTeam?: { name: string; logoUrl?: string };
      predictedOutcome?: string;
      ticketSnapshots: string[];
      result?: string;
      matchDate?: string;
      createdAt: string;
      category: "tip" | "update";
    }>
  >([]);
  const [vipUpdates, setVipUpdates] = useState<
    Array<{
      id: string;
      title: string;
      summary?: string;
      content: string;
      odds?: number;
      sport: string;
      league?: string;
      homeTeam?: { name: string; logoUrl?: string };
      awayTeam?: { name: string; logoUrl?: string };
      predictedOutcome?: string;
      ticketSnapshots: string[];
      result?: string;
      matchDate?: string;
      createdAt: string;
      category: "tip" | "update";
    }>
  >([]);
  const [historyPredictions, setHistoryPredictions] = useState<
    typeof vipPredictions
  >([]);
  const [historyUpdates, setHistoryUpdates] = useState<typeof vipUpdates>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const router = useRouter();
  const checkVIPAccess = useCallback(async () => {
    console.log("🔍 [VIP Page] Starting VIP access check...");
    console.log("🔍 [VIP Page] Current user:", user);

    try {
      // Check if user has active subscription or valid token
      console.log("🔍 [VIP Page] Calling /vip/status endpoint...");
      const res = await api.get("/vip/status");

      console.log("🔍 [VIP Page] API Response:", {
        success: res.success,
        fullResponse: res,
        hasData: !!res.data,
        dataKeys: res.data ? Object.keys(res.data) : [],
      });

      if (res.success) {
        const data = res.data as { hasAccess: boolean };
        console.log("🔍 [VIP Page] Parsed data:", data);
        console.log("🔍 [VIP Page] hasAccess value:", data.hasAccess);

        setHasVIPAccess(data.hasAccess);

        if (data.hasAccess) {
          console.log("✅ [VIP Page] VIP ACCESS GRANTED!");
        } else {
          console.log("❌ [VIP Page] VIP ACCESS DENIED");
        }
      } else {
        console.log("❌ [VIP Page] API call failed:", res.error);
      }
    } catch (error) {
      console.error("❌ [VIP Page] Error checking VIP access:", error);
    } finally {
      setLoading(false);
      console.log(
        "🔍 [VIP Page] VIP access check complete. hasVIPAccess =",
        hasVIPAccess
      );
    }
  }, [api, user, hasVIPAccess]);

  const fetchVIPPredictions = useCallback(async () => {
    setLoadingPredictions(true);
    setLoadingUpdates(true);
    try {
      const res = await api.get("/predictions?vip=true");
      if (res.success) {
        const data = res.data as { predictions: typeof vipPredictions };
        const predictions = data.predictions || [];

        // Separate tips and updates
        const tips = predictions.filter((p) => p.category === "tip");
        const updates = predictions.filter((p) => p.category === "update");

        // Separate current from history based on match date and result
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        const currentTips = tips.filter((p) => {
          if (!p.matchDate) return true; // No match date, show as current
          const matchDate = new Date(p.matchDate);
          return matchDate >= twoHoursAgo && p.result === "pending";
        });

        const historyTips = tips.filter((p) => {
          if (!p.matchDate) return false;
          const matchDate = new Date(p.matchDate);
          return matchDate < twoHoursAgo || p.result !== "pending";
        });

        const currentUpdates = updates.filter((p) => {
          if (!p.matchDate) return true;
          const matchDate = new Date(p.matchDate);
          return matchDate >= twoHoursAgo && p.result === "pending";
        });

        const historyUpdates = updates.filter((p) => {
          if (!p.matchDate) return false;
          const matchDate = new Date(p.matchDate);
          return matchDate < twoHoursAgo || p.result !== "pending";
        });

        setVipPredictions(currentTips);
        setVipUpdates(currentUpdates);
        setHistoryPredictions(historyTips);
        setHistoryUpdates(historyUpdates);
      }
    } catch (error) {
      console.error("Failed to fetch VIP predictions:", error);
    } finally {
      setLoadingPredictions(false);
      setLoadingUpdates(false);
    }
  }, [api]);

  useEffect(() => {
    console.log("🔄 [VIP Page] User effect triggered. User:", user);
    checkVIPAccess();
  }, [user, checkVIPAccess]);

  useEffect(() => {
    console.log("🔄 [VIP Page] hasVIPAccess changed to:", hasVIPAccess);
    if (hasVIPAccess) {
      console.log("🔄 [VIP Page] Fetching VIP predictions...");
      fetchVIPPredictions();
    }
  }, [hasVIPAccess, fetchVIPPredictions]);

  // Add logging on every render
  console.log("🎨 [VIP Page] RENDER - State:", {
    hasVIPAccess,
    loading,
    user: user?.email || "no user",
    isGuest: user?.guest,
  });

  const handleTokenRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError("");

    try {
      const res = await api.post("/vip/tokens/redeem", {
        token: tokenCode,
      });

      if (res.success) {
        setHasVIPAccess(true);
        setTokenCode("");
      } else {
        setTokenError(res.error || "Invalid token code");
      }
    } catch {
      setTokenError("Failed to redeem token. Please try again.");
    }
  };

  if (loading) {
    console.log("⏳ [VIP Page] Rendering LOADING state");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (!hasVIPAccess) {
    console.log(
      "🚫 [VIP Page] Rendering ACCESS DENIED state (hasVIPAccess is false)"
    );
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary">
              <CardHeader className="text-center p-4 md:p-6">
                <div className="flex justify-center mb-4">
                  <Lock className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                </div>
                <CardTitle className="text-2xl md:text-3xl mb-2">
                  VIP Access Required
                </CardTitle>
                <p className="text-sm md:text-base text-muted-foreground">
                  Unlock premium betting tips and exclusive correct score
                  predictions with proven success rates
                </p>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-center">
                  <div className="p-3 md:p-4 border border-border">
                    <Crown className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-bold text-sm md:text-base mb-1">
                      VIP Tips & Updates
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Premium predictions and exclusive correct score updates
                    </p>
                  </div>
                  <div className="p-3 md:p-4 border border-border">
                    <Star className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-bold text-sm md:text-base mb-1">
                      Higher Success
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Average 75%+ win rate on VIP tips
                    </p>
                  </div>
                  <div className="p-3 md:p-4 border border-border">
                    <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-bold text-sm md:text-base mb-1">
                      Advanced Analytics
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Deep insights and trend analysis
                    </p>
                  </div>
                </div>

                {user && (
                  <div className="bg-secondary p-4 md:p-6 space-y-4">
                    <div className="flex justify-between">
                      <h3 className="font-bold text-base md:text-lg">
                        Subscription Plans
                      </h3>
                      <div
                        className="text-sm md:text-base text-muted-foreground hover:underline cursor-pointer"
                        onClick={() => router.push("/subscriptions")}
                      >
                        See All Plans
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div className="border-2 border-border p-3 md:p-4 space-y-2">
                        <h4 className="font-bold text-sm md:text-base">
                          Monthly
                        </h4>
                        <p className="text-xl md:text-2xl font-bold text-primary">
                          € 100.00/week
                        </p>
                        <ul className="text-xs md:text-sm space-y-1">
                          <li>✓ All VIP tips & updates</li>
                          <li>✓ Correct score predictions</li>
                          <li>✓ Priority support</li>
                          <li>✓ Cancel anytime</li>
                        </ul>
                        <Button className="w-full mt-4 h-10 text-sm md:text-base">
                          Subscribe Weekly
                        </Button>
                      </div>
                      <div className="border-2 border-primary p-3 md:p-4 space-y-2">
                        <div className="inline-block bg-primary text-primary-foreground text-xs px-2 py-1 mb-2">
                          BEST VALUE
                        </div>
                        <h4 className="font-bold text-sm md:text-base">
                          Yearly
                        </h4>
                        <p className="text-xl md:text-2xl font-bold text-primary">
                          € 400.00/month
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Save € 400 per Month
                        </p>
                        <ul className="text-xs md:text-sm space-y-1">
                          <li>✓ All VIP tips & updates</li>
                          <li>✓ Correct score predictions</li>
                          <li>✓ Priority support</li>
                          <li>✓ 2 months free</li>
                        </ul>
                        <Button className="w-full mt-4 h-10 text-sm md:text-base">
                          Subscribe Monthly
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {!user && (
                  <Card className="border-2 border-primary">
                    <CardContent className="p-4 md:p-6 text-center">
                      <h3 className="font-bold text-base md:text-lg mb-2">
                        Sign up or log in to subscribe
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground mb-4">
                        Create an account to access VIP features
                      </p>
                      <Button
                        className="h-10"
                        onClick={() => (window.location.href = "/login")}
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <div className="border-2 border-border p-4 md:p-6">
                  <h3 className="font-bold text-base md:text-lg mb-4 text-center">
                    Have a VIP Token?
                  </h3>
                  <form onSubmit={handleTokenRedeem} className="space-y-4">
                    <div>
                      <Input
                        placeholder="Enter your VIP token code"
                        value={tokenCode}
                        onChange={(e) => setTokenCode(e.target.value)}
                        className="text-center font-mono h-11 md:h-10 text-base"
                        required
                      />
                      {tokenError && (
                        <p className="text-xs md:text-sm text-destructive mt-2">
                          {tokenError}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-10 text-sm md:text-base"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Redeem Token
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Tokens provide instant VIP access without subscription
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // VIP content (shown when user has access)
  console.log("✅ [VIP Page] Rendering VIP CONTENT (hasVIPAccess is TRUE)");
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">VIP Predictions Area</h1>
          </div>
          <p className="text-muted-foreground">
            Premium predictions with exclusive analysis and ticket snapshots
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current VIP Predictions</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Active VIP predictions with detailed analysis, team insights, and
              winning ticket snapshots
            </p>
          </CardHeader>
          <CardContent>
            {loadingPredictions ? (
              <div className="text-center py-12 text-muted-foreground">
                <Crown className="h-16 w-16 mx-auto mb-4 opacity-50 animate-pulse" />
                <p className="text-lg">Loading VIP predictions...</p>
              </div>
            ) : vipPredictions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Crown className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No VIP predictions available yet</p>
                <p className="text-sm mt-2">
                  Check back soon for premium sports predictions
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {vipPredictions.map((prediction) => (
                  <Card key={prediction.id} className="border-2 border-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-2 flex-wrap">
                        <Badge className=" text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                          {prediction.sport}
                        </Badge>
                        {prediction.league && (
                          <Badge className=" text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                            {prediction.league}
                          </Badge>
                        )}
                        {prediction.result && (
                          <Badge
                            className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 ${
                              prediction.result === "won"
                                ? "bg-green-500 text-white"
                                : prediction.result === "lost"
                                ? "bg-red-500 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {prediction.result.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-sm md:text-base mb-3 line-clamp-2">
                        {prediction.title}
                      </h3>
                      {(prediction.homeTeam || prediction.awayTeam) && (
                        <div className="flex items-center justify-between mb-3 p-2 bg-secondary rounded">
                          <div className="text-center flex-1">
                            {prediction.homeTeam?.logoUrl && (
                              <img
                                src={prediction.homeTeam.logoUrl}
                                alt={prediction.homeTeam.name}
                                className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-1 object-contain"
                              />
                            )}
                            <p className="text-[10px] md:text-xs font-medium line-clamp-1">
                              {prediction.homeTeam?.name}
                            </p>
                          </div>
                          <div className="px-3 font-bold text-muted-foreground text-xs md:text-sm">
                            VS
                          </div>
                          <div className="text-center flex-1">
                            {prediction.awayTeam?.logoUrl && (
                              <img
                                src={prediction.awayTeam.logoUrl}
                                alt={prediction.awayTeam.name}
                                className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-1 object-contain"
                              />
                            )}
                            <p className="text-[10px] md:text-xs font-medium line-clamp-1">
                              {prediction.awayTeam?.name}
                            </p>
                          </div>
                        </div>
                      )}
                      <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">
                        {prediction.summary || prediction.content}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        {prediction.odds && (
                          <div>
                            <div className="text-lg md:text-xl font-bold text-primary">
                              {prediction.odds}
                            </div>
                            <div className="text-[10px] md:text-xs text-muted-foreground">
                              Odds
                            </div>
                          </div>
                        )}
                        {prediction.predictedOutcome && (
                          <div className="text-right">
                            <div className="text-xs md:text-sm font-bold line-clamp-1">
                              {prediction.predictedOutcome}
                            </div>
                            <div className="text-[10px] md:text-xs text-muted-foreground">
                              Prediction
                            </div>
                          </div>
                        )}
                      </div>
                      {prediction.ticketSnapshots.length > 0 && (
                        <div className="mb-3 text-[10px] md:text-xs text-muted-foreground">
                          📊 {prediction.ticketSnapshots.length} ticket
                          snapshot(s)
                        </div>
                      )}
                      <Link href={`/tips/${prediction.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-[10px] md:text-xs"
                        >
                          <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* VIP Updates Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              VIP Updates
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Exclusive correct score predictions and draw alerts with real-time
              updates
            </p>
          </CardHeader>
          <CardContent>
            {loadingUpdates ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50 animate-pulse" />
                <p className="text-lg">Loading VIP updates...</p>
              </div>
            ) : vipUpdates.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {vipUpdates.map((update) => (
                  <Card key={update.id} className="border-2 border-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-2 flex-wrap">
                        <Badge className="bg-purple-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                          UPDATE
                        </Badge>
                        <Badge className=" text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                          {update.sport}
                        </Badge>
                        {update.league && (
                          <Badge className=" text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                            {update.league}
                          </Badge>
                        )}
                        {update.result && (
                          <Badge
                            className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 ${
                              update.result === "won"
                                ? "bg-green-500 text-white"
                                : update.result === "lost"
                                ? "bg-red-500 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {update.result.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-sm md:text-base mb-3 line-clamp-2">
                        {update.title}
                      </h3>
                      {(update.homeTeam || update.awayTeam) && (
                        <div className="flex items-center justify-between mb-3 p-2 bg-secondary rounded">
                          <div className="text-center flex-1">
                            {update.homeTeam?.logoUrl && (
                              <img
                                src={update.homeTeam.logoUrl}
                                alt={update.homeTeam.name}
                                className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-1 object-contain"
                              />
                            )}
                            <p className="text-[10px] md:text-xs font-medium line-clamp-1">
                              {update.homeTeam?.name}
                            </p>
                          </div>
                          <div className="px-3 font-bold text-muted-foreground text-xs md:text-sm">
                            VS
                          </div>
                          <div className="text-center flex-1">
                            {update.awayTeam?.logoUrl && (
                              <img
                                src={update.awayTeam.logoUrl}
                                alt={update.awayTeam.name}
                                className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-1 object-contain"
                              />
                            )}
                            <p className="text-[10px] md:text-xs font-medium line-clamp-1">
                              {update.awayTeam?.name}
                            </p>
                          </div>
                        </div>
                      )}
                      <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">
                        {update.summary || update.content}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        {update.odds && (
                          <div>
                            <div className="text-lg md:text-xl font-bold text-primary">
                              {update.odds}
                            </div>
                            <div className="text-[10px] md:text-xs text-muted-foreground">
                              Odds
                            </div>
                          </div>
                        )}
                        {update.predictedOutcome && (
                          <div className="text-right">
                            <div className="text-xs md:text-sm font-bold line-clamp-1">
                              {update.predictedOutcome}
                            </div>
                            <div className="text-[10px] md:text-xs text-muted-foreground">
                              Prediction
                            </div>
                          </div>
                        )}
                      </div>
                      {update.ticketSnapshots.length > 0 && (
                        <div className="mb-3 text-[10px] md:text-xs text-muted-foreground">
                          📊 {update.ticketSnapshots.length} ticket snapshot(s)
                        </div>
                      )}
                      <Link href={`/tips/${update.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-[10px] md:text-xs"
                        >
                          <Target className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                          View Update
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No VIP updates available yet</p>
                <p className="text-sm mt-2">
                  Check back soon for exclusive correct score predictions and
                  draw alerts
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Section */}
        {(historyPredictions.length > 0 || historyUpdates.length > 0) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Past Results & History
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                View our track record and past predictions with results
              </p>
            </CardHeader>
            <CardContent>
              {historyPredictions.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-base mb-4">Past VIP Tips</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {historyPredictions.map((prediction) => (
                      <Card
                        key={prediction.id}
                        className="border-2 border-border"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-1.5 md:gap-2 mb-2 flex-wrap">
                            <Badge className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                              {prediction.sport}
                            </Badge>
                            {prediction.league && (
                              <Badge className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                                {prediction.league}
                              </Badge>
                            )}
                            {prediction.result && (
                              <Badge
                                className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 ${
                                  prediction.result === "won"
                                    ? "bg-green-500 text-white"
                                    : prediction.result === "lost"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-500 text-white"
                                }`}
                              >
                                {prediction.result.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-sm md:text-base mb-3 line-clamp-2">
                            {prediction.title}
                          </h3>
                          {(prediction.homeTeam || prediction.awayTeam) && (
                            <div className="flex items-center justify-between mb-3 p-2 bg-secondary rounded">
                              <div className="text-center flex-1">
                                {prediction.homeTeam?.logoUrl && (
                                  <img
                                    src={prediction.homeTeam.logoUrl}
                                    alt={prediction.homeTeam.name}
                                    className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-1 object-contain"
                                  />
                                )}
                                <p className="text-[10px] md:text-xs font-medium line-clamp-1">
                                  {prediction.homeTeam?.name}
                                </p>
                              </div>
                              <div className="px-3 font-bold text-muted-foreground text-xs md:text-sm">
                                VS
                              </div>
                              <div className="text-center flex-1">
                                {prediction.awayTeam?.logoUrl && (
                                  <img
                                    src={prediction.awayTeam.logoUrl}
                                    alt={prediction.awayTeam.name}
                                    className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-1 object-contain"
                                  />
                                )}
                                <p className="text-[10px] md:text-xs font-medium line-clamp-1">
                                  {prediction.awayTeam?.name}
                                </p>
                              </div>
                            </div>
                          )}
                          <Link href={`/tips/${prediction.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-[10px] md:text-xs"
                            >
                              View Details
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {historyUpdates.length > 0 && (
                <div>
                  <h3 className="font-bold text-base mb-4">Past VIP Updates</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {historyUpdates.map((update) => (
                      <Card key={update.id} className="border-2 border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-1.5 md:gap-2 mb-2 flex-wrap">
                            <Badge className="bg-purple-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                              UPDATE
                            </Badge>
                            <Badge className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                              {update.sport}
                            </Badge>
                            {update.result && (
                              <Badge
                                className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 ${
                                  update.result === "won"
                                    ? "bg-green-500 text-white"
                                    : update.result === "lost"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-500 text-white"
                                }`}
                              >
                                {update.result.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-sm md:text-base mb-3 line-clamp-2">
                            {update.title}
                          </h3>
                          <Link href={`/tips/${update.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-[10px] md:text-xs"
                            >
                              View Details
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold mb-2">VIP Updates</h3>
              <p className="text-sm text-muted-foreground">
                Exclusive correct score predictions and draw alerts with
                real-time updates
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold mb-2">Ticket Snapshots</h3>
              <p className="text-sm text-muted-foreground">
                View real betting tickets to track our success and build
                confidence
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold mb-2">Higher Success Rate</h3>
              <p className="text-sm text-muted-foreground">
                Premium predictions with proven track record and transparency
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
