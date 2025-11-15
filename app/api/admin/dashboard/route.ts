import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, getUserInfo } from "@/lib/session";

export async function GET() {
  try {
    // Check admin authentication using unified session utility
    const { error, session } = await requireAdmin();

    if (error || !session) {
      return error;
    }

    // Log authentication info for debugging
    const userInfo = getUserInfo(session);
    console.log("Admin dashboard accessed by:", userInfo);

    // Get comprehensive dashboard stats
    const [
      totalUsersCount,
      totalAdminsCount,
      tipStats,
      vipTipsCount,
      subscriptionStats,
      earningsStats,
      recentActivity,
      popularSports,
      conversionMetrics,
      systemHealth,
    ] = await Promise.all([
      // Total user count
      prisma.user.count({
        where: {
          guest: false,
          deletedAt: null,
        },
      }),

      // Total admin count
      prisma.user.count({
        where: {
          role: "ADMIN",
          deletedAt: null,
        },
      }),

      // Tip statistics
      prisma.tip.aggregate({
        _count: { id: true },
        _avg: { successRate: true },
        _sum: { viewCount: true },
        where: {
          status: "published",
        },
      }),

      // VIP tips count
      prisma.tip.count({
        where: {
          status: "published",
          isVIP: true,
        },
      }),

      // Active subscription count
      prisma.subscription.count({
        where: {
          status: "active",
          currentPeriodEnd: { gte: new Date() },
        },
      }),

      // Earnings statistics
      prisma.wallet.aggregate({
        _sum: { balance: true, totalEarned: true, totalWithdrawn: true },
        _avg: { balance: true },
      }),

      // Recent activity
      prisma.analyticsEvent.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          userId: true,
          createdAt: true,
          payload: true,
        },
      }),

      // Popular sports
      prisma.tip.groupBy({
        by: ["sport"],
        _count: { id: true },
        where: {
          status: "published",
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),

      // Conversion metrics
      Promise.all([
        prisma.user.aggregate({
          _count: { id: true },
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.subscription.aggregate({
          _count: { id: true },
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.vIPToken.aggregate({
          _sum: { quantity: true },
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]),

      // System health checks
      Promise.resolve({
        database: true, // We'll assume healthy if we get this far
        redis: true, // TODO: Add Redis health check
        storage: true, // TODO: Add storage health check
      }),
    ]);

    // Calculate conversion metrics
    const [newUsers, newSubscriptions, newTokens] = conversionMetrics;
    const conversionRate =
      newUsers._count.id > 0
        ? ((newSubscriptions._count.id / newUsers._count.id) * 100).toFixed(1)
        : "0";

    // Calculate revenue metrics
    const totalBalance = Number(earningsStats._sum.balance || 0);
    const totalEarned = Number(earningsStats._sum.totalEarned || 0);
    const totalWithdrawn = Number(earningsStats._sum.totalWithdrawn || 0);

    // Get recent revenue
    const recentRevenue = await prisma.referralEarning.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        status: "confirmed",
      },
    });

    const dashboardData = {
      overview: {
        totalUsers: totalUsersCount,
        totalAdmins: totalAdminsCount,
        totalTips: tipStats._count.id,
        totalVIPTips: vipTipsCount,
        activeSubscriptions: subscriptionStats,
        averageSuccessRate: Number(tipStats._avg.successRate || 0),
        totalViews: tipStats._sum.viewCount || 0,
      },
      financial: {
        totalBalance,
        totalEarned,
        totalWithdrawn,
        averageBalance: Number(earningsStats._avg.balance || 0),
        recentRevenue: Number(recentRevenue._sum.amount || 0),
        netRevenue: totalEarned - totalWithdrawn,
      },
      metrics: {
        weeklyNewUsers: newUsers._count.id,
        weeklyNewSubscriptions: newSubscriptions._count.id,
        weeklyNewTokens: newTokens._sum.quantity || 0,
        conversionRate: `${conversionRate}%`,
        avgSuccessRate: `${Number(tipStats._avg.successRate || 0).toFixed(1)}%`,
      },
      popularSports: popularSports.map(
        (sport: { sport: string; _count: { id: number } }) => ({
          sport: sport.sport,
          count: sport._count.id,
        })
      ),
      recentActivity: recentActivity.map(
        (activity: {
          id: string;
          type: string;
          userId: string | null;
          createdAt: Date;
          payload: unknown;
        }) => ({
          id: activity.id,
          type: activity.type,
          userId: activity.userId,
          timestamp: activity.createdAt,
          details: activity.payload,
        })
      ),
      systemHealth: {
        database: systemHealth.database ? "healthy" : "unhealthy",
        redis: systemHealth.redis ? "healthy" : "unhealthy",
        storage: systemHealth.storage ? "healthy" : "unhealthy",
      },
      alerts: [
        // TODO: Add actual alerts based on system conditions
        {
          type: "info",
          message: "System operating normally",
          timestamp: new Date(),
        },
      ],
    };

    // Log dashboard data for debugging
    console.log(
      "Admin Dashboard Data:",
      JSON.stringify(dashboardData, null, 2)
    );

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
