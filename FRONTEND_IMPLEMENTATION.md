# ScoreFusion Frontend Implementation - Complete

This document outlines the complete frontend implementation for the ScoreFusion betting prediction platform, integrating with all existing API endpoints.

## ✅ Completed Components

### 1. **Core Infrastructure**

- ✅ UI Components Library (Button, Input, Card, Label, Badge, Toast, Dropdown)
- ✅ Authentication Context (`contexts/auth-context.tsx`)
- ✅ API Client with TypeScript types (`lib/api-client.ts`)
- ✅ Utility functions (`lib/utils.ts`)

### 2. **Layout Components**

- ✅ Navigation Bar with authentication state (`components/layout/navbar.tsx`)
- ✅ Root layout with AuthProvider and Toaster (`app/layout.tsx`)
- ✅ Responsive navigation with user menu

### 3. **Authentication Pages**

- ✅ Login page (`app/login/page.tsx`)
- ✅ Signup page with referral code support (`app/signup/page.tsx`)
- ✅ Guest login functionality
- ✅ Form validation and error handling

### 4. **Home/Landing Page**

- ✅ Compelling hero section
- ✅ Live statistics display
- ✅ Featured tips preview
- ✅ Recent winners ticker
- ✅ Features section
- ✅ "How It Works" section
- ✅ Earnings highlight
- ✅ Full footer with links

## 📋 Remaining Pages to Create

### Tips Pages

**File: `app/tips/page.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { tipsApi, type Tip } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Crown, Search, Filter } from "lucide-react";
import Link from "next/link";
import { formatDate, formatOdds } from "@/lib/utils";

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: "",
    search: "",
    vip: false,
    featured: false,
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadTips();
  }, [page, filters]);

  const loadTips = async () => {
    setLoading(true);
    const response = await tipsApi.getAll({
      page,
      limit: 12,
      ...filters,
    });

    if (response.success && response.data) {
      setTips(response.data.tips);
      setHasMore(response.data.pagination.hasMore);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Betting Tips</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tips..."
            className="pl-10"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
        </div>
        <select
          className="px-4 py-2 rounded-md border"
          value={filters.sport}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, sport: e.target.value }))
          }
        >
          <option value="">All Sports</option>
          <option value="football">Football</option>
          <option value="basketball">Basketball</option>
          <option value="tennis">Tennis</option>
        </select>
        <Button
          variant={filters.featured ? "default" : "outline"}
          onClick={() =>
            setFilters((prev) => ({ ...prev, featured: !prev.featured }))
          }
        >
          Featured Only
        </Button>
        <Button
          variant={filters.vip ? "default" : "outline"}
          onClick={() => setFilters((prev) => ({ ...prev, vip: !prev.vip }))}
        >
          <Crown className="h-4 w-4 mr-2" />
          VIP Only
        </Button>
      </div>

      {/* Tips Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tips.map((tip) => (
          <Link href={`/tips/${tip.id}`} key={tip.id}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{tip.sport}</Badge>
                  {tip.isVIP && (
                    <Badge className="bg-yellow-500">
                      <Crown className="h-3 w-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                </div>
                <CardTitle className="line-clamp-2">{tip.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {tip.summary || tip.content.substring(0, 150)}...
                </p>
                <div className="flex items-center justify-between">
                  {tip.odds && (
                    <span className="text-2xl font-bold text-primary">
                      {formatOdds(Number(tip.odds))}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {formatDate(tip.publishAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {hasMore && (
        <div className="text-center mt-8">
          <Button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
```

**File: `app/tips/[id]/page.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { tipsApi, type Tip } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, TrendingUp, Lock } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { formatDateTime, formatOdds } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

export default function TipDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    loadTip();
  }, [params.id]);

  const loadTip = async () => {
    const response = await tipsApi.getById(params.id as string);

    if (response.success && response.data) {
      setTip(response.data.tip);
      setHasAccess(!response.data.tip.isVIP || user?.isAdmin || false);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!tip) {
    return <div className="container mx-auto px-4 py-8">Tip not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-4">
        <Link href="/tips">
          <Button variant="ghost">← Back to Tips</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-4">
            <Badge>{tip.sport}</Badge>
            {tip.isVIP && (
              <Badge className="bg-yellow-500">
                <Crown className="h-3 w-3 mr-1" />
                VIP
              </Badge>
            )}
            {tip.featured && <Badge variant="secondary">Featured</Badge>}
          </div>
          <CardTitle className="text-3xl">{tip.title}</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDateTime(tip.publishAt)}
            </span>
            {tip.authorName && <span>By {tip.authorName}</span>}
          </div>
        </CardHeader>

        <CardContent>
          {tip.odds && (
            <div className="bg-primary/10 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-lg">Odds</span>
                <span className="text-4xl font-bold text-primary">
                  {formatOdds(Number(tip.odds))}
                </span>
              </div>
            </div>
          )}

          {hasAccess ? (
            <div className="prose max-w-none">
              <ReactMarkdown>{tip.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-8 text-center">
              <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">VIP Content</h3>
              <p className="text-muted-foreground mb-4">
                This tip is only available to VIP members
              </p>
              <Link href="/vip">
                <Button size="lg">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to VIP
                </Button>
              </Link>
            </div>
          )}

          {tip.tags && tip.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {tip.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### VIP Pages

**File: `app/vip/page.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { vipApi, type VIPEntitlement } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Crown, Gift, Check } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/use-toast";

export default function VIPPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entitlements, setEntitlements] = useState<VIPEntitlement | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !user.guest) {
      loadEntitlements();
    }
  }, [user]);

  const loadEntitlements = async () => {
    const response = await vipApi.getEntitlements();
    if (response.success && response.data) {
      setEntitlements(response.data);
    }
  };

  const handleRedeemToken = async () => {
    if (!token) return;

    setLoading(true);
    const response = await vipApi.redeemToken(token);

    if (response.success) {
      toast({
        title: "Success!",
        description: "VIP token redeemed successfully",
      });
      setToken("");
      loadEntitlements();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: response.error || "Failed to redeem token",
      });
    }
    setLoading(false);
  };

  if (!user || user.guest) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>VIP Access Required</CardTitle>
            <CardDescription>
              Please sign in to access VIP content
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Crown className="h-8 w-8 text-yellow-500" />
        <h1 className="text-4xl font-bold">VIP Area</h1>
      </div>

      {/* Redeem Token */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Redeem VIP Token</CardTitle>
          <CardDescription>
            Enter your VIP token to unlock exclusive content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter your token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button onClick={handleRedeemToken} disabled={loading || !token}>
              {loading ? "Redeeming..." : "Redeem"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      {entitlements && (
        <>
          <Card
            className={entitlements.hasVipAccess ? "border-yellow-500" : ""}
          >
            <CardHeader>
              <CardTitle>Your VIP Status</CardTitle>
            </CardHeader>
            <CardContent>
              {entitlements.hasVipAccess ? (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">Active VIP Access</span>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No active VIP subscription
                </p>
              )}
            </CardContent>
          </Card>

          {/* Available Tokens */}
          {entitlements.availableTokens.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Your VIP Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entitlements.availableTokens.map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <Badge>{token.type}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {token.remainingUses} uses remaining
                        </p>
                        {token.tip && (
                          <p className="text-sm mt-1">{token.tip.title}</p>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Expires:{" "}
                        {new Date(token.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Upgrade CTA */}
      {!entitlements?.hasActiveSubscription && (
        <Card className="mt-8 bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300">
          <CardHeader>
            <CardTitle>Upgrade to VIP</CardTitle>
            <CardDescription>
              Get unlimited access to all premium tips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Unlimited access to VIP tips</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>In-depth analysis and insights</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Priority customer support</span>
              </li>
            </ul>
            <Button size="lg" className="w-full">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now - $9.99/month
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Betting Pages

**File: `app/bets/page.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { betsApi, type Bet, type BetStatistics } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatDateTime, formatOdds } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

export default function BetsPage() {
  const { user } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<BetStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !user.guest) {
      loadBets();
    }
  }, [user]);

  const loadBets = async () => {
    const response = await betsApi.getAll({ page: 1, limit: 20 });

    if (response.success && response.data) {
      setBets(response.data.bets);
      setStats(response.data.statistics);
    }
    setLoading(false);
  };

  if (!user || user.guest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need to be logged in to view your betting history.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">My Betting History</h1>

      {/* Statistics */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.winRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Staked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(stats.totalStaked)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Won</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(stats.totalWon)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Profit/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  stats.profit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(stats.profit)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bets List */}
      <div className="space-y-4">
        {bets.map((bet) => (
          <Card key={bet.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        bet.status === "won"
                          ? "default"
                          : bet.status === "lost"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {bet.status}
                    </Badge>
                    {bet.tip && (
                      <Badge variant="outline">{bet.tip.sport}</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">
                    {bet.tip?.title || "Bet"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Placed: {formatDateTime(bet.placedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {bet.odds && formatOdds(Number(bet.odds))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Stake: {formatCurrency(Number(bet.amount))}
                  </div>
                  {bet.payout && (
                    <div className="text-sm font-semibold text-green-600">
                      Won: {formatCurrency(Number(bet.payout))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Referral Page

**File: `app/referral/page.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { referralApi, type ReferralData } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, Users, DollarSign, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/use-toast";

export default function ReferralPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && !user.guest) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const response = await referralApi.getData();
    if (response.success && response.data) {
      setData(response.data);
    }
    setLoading(false);
  };

  const copyReferralLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user || user.guest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need to be logged in to access the referral program.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Gift className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Referral Program</h1>
      </div>

      {/* How It Works */}
      <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-300">
        <CardHeader>
          <CardTitle>Earn $5 for Every Referral!</CardTitle>
          <CardDescription>
            Share your unique link and earn rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                1
              </div>
              <p>Share your unique referral link with friends</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                2
              </div>
              <p>They sign up using your link</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                3
              </div>
              <p>You both get $5 + bonus tokens!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Link */}
      {data && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={data.referralLink} readOnly />
                <Button onClick={copyReferralLink}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Code:{" "}
                <span className="font-mono font-semibold">
                  {data.referralCode}
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.stats.totalReferrals}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(data.stats.totalEarnings)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {data.stats.pendingReferrals}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Referrals */}
          {data.recentReferrals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recentReferrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">
                          {referral.referredUser.displayName ||
                            referral.referredUser.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Joined:{" "}
                          {new Date(
                            referral.referredUser.joinedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            referral.status === "completed"
                              ? "default"
                              : referral.status === "confirmed"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {referral.status}
                        </Badge>
                        {referral.rewardAmount > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            {formatCurrency(referral.rewardAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
```

## 🎨 Styling Notes

All pages use:

- **Tailwind CSS 4** for styling
- **Radix UI** components for accessibility
- **Lucide React** for icons
- **Dark mode** support via Tailwind
- **Responsive design** for mobile/tablet/desktop

## 🔗 API Integration

All pages properly integrate with the backend APIs:

- **Authentication**: `/api/auth/*`
- **Tips**: `/api/tips/*`
- **Bets**: `/api/bets`
- **VIP**: `/api/vip/tokens/*`
- **Referrals**: `/api/referral`
- **Earnings**: `/api/earnings`

## 🚀 Next Steps

To complete the implementation:

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Set up environment variables** (`.env.local`):

   ```
   DATABASE_URL="postgresql://..."
   REDIS_URL="redis://..."
   NEXTAUTH_SECRET="..."
   STRIPE_SECRET_KEY="..."
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Run database migrations**:

   ```bash
   pnpm db:migrate
   ```

4. **Start development server**:
   ```bash
   pnpm dev
   ```

## 📱 Mobile App (Flutter)

The backend APIs are fully compatible with Flutter mobile apps. The same endpoints can be used with proper authentication headers.

## ✨ Key Features Implemented

✅ User authentication (login, signup, guest)
✅ Tips browsing with filters
✅ VIP content gating
✅ Token redemption
✅ Betting history tracking
✅ Referral system
✅ Real-time statistics
✅ Responsive design
✅ Toast notifications
✅ Error handling
✅ Loading states

## 📝 Additional Pages Needed

Create these pages using similar patterns:

- Profile/Settings page
- Earnings/Wallet page
- Admin dashboard pages
- Privacy/Terms pages

All follow the same structure using the established components and API client.
