import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/session";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export const GET = withAuth(async (_request, { session }) => {
  try {
    const userId = session.user.id;

    // Fetch basic aggregates in parallel
    const [userRecord, wallet, tipViewsCount, betStatusCounts, recentActivity] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { createdAt: true },
        }),
        prisma.wallet.findUnique({
          where: { userId },
          select: { totalEarned: true },
        }),
        prisma.analyticsEvent.count({
          where: { userId, type: "predictions_viewed" },
        }),
        prisma.bet.groupBy({
          by: ["status"],
          where: { userId },
          _count: { id: true },
        }),
        prisma.analyticsEvent.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 200, // last 200 events for streak calc
          select: { createdAt: true },
        }),
      ]);

    // Compute bets stats
    const totalBets = betStatusCounts.reduce(
      (acc, s) => acc + (s._count?.id || 0),
      0
    );
    const winCount =
      betStatusCounts.find((s) => s.status === "won")?._count.id || 0;
    const lossCount =
      betStatusCounts.find((s) => s.status === "lost")?._count.id || 0;

    const winRate = totalBets > 0 ? (winCount / totalBets) * 100 : 0;
    const correctPredictions = winCount;

    // Earnings from wallet totalEarned, fallback to sum of confirmed earnings
    let totalEarnings = wallet?.totalEarned ? Number(wallet.totalEarned) : 0;
    if (!totalEarnings) {
      const earningsSum = await prisma.earning.aggregate({
        where: { userId, status: "confirmed" },
        _sum: { amount: true },
      });
      totalEarnings = Number(earningsSum._sum.amount || 0);
    }

    // Streak calculation based on daily activity (any analytics event counts)
    const daySet = new Set<string>();
    for (const ev of recentActivity) {
      const d = startOfDay(ev.createdAt);
      daySet.add(d.toISOString());
    }
    let streakDays = 0;
    let cursor = startOfDay(new Date());
    while (daySet.has(cursor.toISOString())) {
      streakDays += 1;
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    }

    // Joined days ago
    const joinedDaysAgo = userRecord?.createdAt
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - userRecord.createdAt.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    const data = {
      totalTipsViewed: tipViewsCount,
      correctPredictions,
      winRate: Math.round(winRate * 10) / 10,
      totalEarnings,
      streakDays,
      joinedDaysAgo,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("/api/user/stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to compute user stats" },
      { status: 500 }
    );
  }
});
