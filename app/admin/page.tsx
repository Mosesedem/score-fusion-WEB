"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Trophy,
  Crown,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

interface DashboardData {
  overview: {
    totalUsers: number;
    totalAdmins: number;
    totalTips: number;
    totalVIPTips: number;
    activeSubscriptions: number;
    averageSuccessRate: number;
    totalViews: number;
  };
  financial: {
    totalBalance: number;
    totalEarned: number;
    totalWithdrawn: number;
    averageBalance: number;
    recentRevenue: number;
    netRevenue: number;
  };
  metrics: {
    weeklyNewUsers: number;
    weeklyNewSubscriptions: number;
    weeklyNewTokens: number;
    conversionRate: string;
    avgSuccessRate: string;
  };
  popularSports: Array<{
    sport: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    userId: string | null;
    timestamp: string;
    details: Record<string, unknown> | null;
  }>;
  systemHealth: {
    database: string;
    redis: string;
    storage: string;
  };
  alerts: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (!authLoading && user && !user.isAdmin) {
      router.push("/dashboard");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Using NextAuth session - no need for Authorization header
        // NextAuth automatically includes session cookie
        const response = await fetch("/api/admin/dashboard", {
          credentials: "include", // Include cookies
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError("Unauthorized access. Admin privileges required.");
            return;
          }
          throw new Error("Failed to fetch dashboard data");
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load dashboard data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user?.isAdmin) {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{data.metrics.weeklyNewUsers} new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Tips
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalTips.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.overview.totalVIPTips} VIP tips
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VIP Subscribers
            </CardTitle>
            <Crown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.activeSubscriptions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{data.metrics.weeklyNewSubscriptions} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {data.financial.recentRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.metrics.avgSuccessRate}
            </div>
            <p className="text-xs text-muted-foreground">
              Average tip accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All-time tip views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.metrics.conversionRate}
            </div>
            <p className="text-xs text-muted-foreground">
              Users to subscribers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Sports */}
      {data.popularSports.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Popular Sports (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.popularSports.map((sport, index) => (
                <div
                  key={sport.sport}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{sport.sport}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {sport.count} tips
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Management Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/tips">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Tips Management
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Create, edit, and manage betting tips
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              View and manage user accounts
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/vip-tokens">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                VIP Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Generate and manage VIP access tokens
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/feature-flags">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Feature Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Control feature rollouts and A/B tests
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Real-time Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium capitalize">
                      {activity.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.userId ? `User: ${activity.userId}` : "System"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm mt-2">
                User actions and events will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                  data.systemHealth.database === "healthy"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                <Activity className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Database</p>
              <p
                className={`text-xs ${
                  data.systemHealth.database === "healthy"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {data.systemHealth.database}
              </p>
            </div>
            <div className="text-center">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                  data.systemHealth.redis === "healthy"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                <Activity className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Redis</p>
              <p
                className={`text-xs ${
                  data.systemHealth.redis === "healthy"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {data.systemHealth.redis}
              </p>
            </div>
            <div className="text-center">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                  data.systemHealth.storage === "healthy"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                <Activity className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Storage</p>
              <p
                className={`text-xs ${
                  data.systemHealth.storage === "healthy"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {data.systemHealth.storage}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
