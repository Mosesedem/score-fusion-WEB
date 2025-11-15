import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get analytics data
    const [
      totalUsers,
      totalPredictions,
      totalTips,
      totalSubscriptions,
      activeSubscriptions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.tip.count(),
      prisma.tip.count(),
      prisma.subscription.count(),
      prisma.subscription.count({
        where: {
          status: "ACTIVE",
        },
      }),
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [newUsers, newPredictions, newTips, newSubscriptions] =
      await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        }),
        prisma.tip.count({
          where: {
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        }),
        prisma.tip.count({
          where: {
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        }),
        prisma.subscription.count({
          where: {
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        }),
      ]);

    return NextResponse.json({
      totals: {
        users: totalUsers,
        predictions: totalPredictions,
        tips: totalTips,
        subscriptions: totalSubscriptions,
        activeSubscriptions,
      },
      recent: {
        users: newUsers,
        predictions: newPredictions,
        tips: newTips,
        subscriptions: newSubscriptions,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
