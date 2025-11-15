import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    // Check admin authentication
    const { error, session } = await requireAdmin();

    if (error || !session) {
      return (
        error ||
        NextResponse.json(
          { success: false, error: "Admin access required" },
          { status: 403 }
        )
      );
    }

    const now = new Date();

    // Get all stats in parallel
    const [
      total,
      active,
      canceled,
      pastDue,
      trial,
      monthlySubscriptions,
      yearlySubscriptions,
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({
        where: {
          status: "active",
          currentPeriodEnd: { gte: now },
        },
      }),
      prisma.subscription.count({
        where: { status: "canceled" },
      }),
      prisma.subscription.count({
        where: { status: "past_due" },
      }),
      prisma.subscription.count({
        where: {
          status: "active",
          trialEnd: { gte: now },
        },
      }),
      prisma.subscription.count({
        where: {
          status: "active",
          plan: "monthly",
          currentPeriodEnd: { gte: now },
        },
      }),
      prisma.subscription.count({
        where: {
          status: "active",
          plan: "yearly",
          currentPeriodEnd: { gte: now },
        },
      }),
    ]);

    // Calculate estimated revenue (these are just estimates, adjust based on your pricing)
    const monthlyPrice = 400; // Adjust to your actual monthly price
    const yearlyPrice = 1500; // Adjust to your actual yearly price

    const monthlyRevenue = monthlySubscriptions * monthlyPrice;
    const yearlyRevenue = yearlySubscriptions * (yearlyPrice / 12); // Monthly ARR

    return NextResponse.json({
      success: true,
      data: {
        total,
        active,
        canceled,
        pastDue,
        trial,
        monthlyRevenue,
        yearlyRevenue: yearlyRevenue * 12, // Annual revenue
      },
    });
  } catch (error) {
    console.error("Failed to fetch subscription stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
