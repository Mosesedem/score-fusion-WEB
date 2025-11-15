import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

// Schema for subscription management
const subscriptionSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["create", "cancel", "extend"]),
  plan: z.enum(["monthly", "yearly", "trial"]).optional(),
  durationDays: z.number().positive().optional(),
});

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { displayName: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (status && status !== "all") {
      if (status === "trial") {
        where.AND = [{ status: "active" }, { trialEnd: { gte: new Date() } }];
      } else {
        where.status = status;
      }
    }

    // Fetch subscriptions
    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.subscription.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = subscriptionSchema.parse(body);

    const { userId, action, plan, durationDays } = validatedData;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: {
            status: "active",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    let result;

    switch (action) {
      case "create": {
        if (!plan) {
          return NextResponse.json(
            {
              success: false,
              error: "Plan is required for creating subscription",
            },
            { status: 400 }
          );
        }

        // Check if user already has an active subscription
        if (user.subscriptions.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: "User already has an active subscription",
            },
            { status: 400 }
          );
        }

        const now = new Date();
        const periodEnd = new Date();

        // Set period based on plan
        switch (plan) {
          case "monthly":
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            break;
          case "yearly":
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            break;
          case "trial":
            periodEnd.setDate(periodEnd.getDate() + 7); // 7 days trial
            break;
        }

        result = await prisma.subscription.create({
          data: {
            userId,
            stripeSubscriptionId: `admin_created_${Date.now()}`,
            stripeCustomerId: `admin_customer_${userId}`,
            plan,
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            trialEnd: plan === "trial" ? periodEnd : null,
          },
        });

        // Create audit log
        await prisma.adminAuditLog.create({
          data: {
            userId: session.user.id,
            action: "create_subscription",
            resource: userId,
            details: {
              plan,
              periodEnd: periodEnd.toISOString(),
              createdBy: session.user.displayName || session.user.name,
            },
          },
        });

        break;
      }

      case "cancel": {
        const activeSubscription = user.subscriptions[0];

        if (!activeSubscription) {
          return NextResponse.json(
            { success: false, error: "No active subscription found" },
            { status: 404 }
          );
        }

        result = await prisma.subscription.update({
          where: { id: activeSubscription.id },
          data: {
            status: "canceled",
            canceledAt: new Date(),
            cancelAtPeriodEnd: true,
          },
        });

        // Create audit log
        await prisma.adminAuditLog.create({
          data: {
            userId: session.user.id,
            action: "cancel_subscription",
            resource: userId,
            details: {
              subscriptionId: activeSubscription.id,
              canceledBy: session.user.displayName || session.user.name,
            },
          },
        });

        break;
      }

      case "extend": {
        const activeSubscription = user.subscriptions[0];

        if (!activeSubscription) {
          return NextResponse.json(
            { success: false, error: "No active subscription found" },
            { status: 404 }
          );
        }

        if (!durationDays) {
          return NextResponse.json(
            {
              success: false,
              error: "Duration in days is required for extending subscription",
            },
            { status: 400 }
          );
        }

        const newPeriodEnd = new Date(activeSubscription.currentPeriodEnd);
        newPeriodEnd.setDate(newPeriodEnd.getDate() + durationDays);

        result = await prisma.subscription.update({
          where: { id: activeSubscription.id },
          data: {
            currentPeriodEnd: newPeriodEnd,
          },
        });

        // Create audit log
        await prisma.adminAuditLog.create({
          data: {
            userId: session.user.id,
            action: "extend_subscription",
            resource: userId,
            details: {
              subscriptionId: activeSubscription.id,
              durationDays,
              newPeriodEnd: newPeriodEnd.toISOString(),
              extendedBy: session.user.displayName || session.user.name,
            },
          },
        });

        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Subscription ${action}d successfully`,
      data: { subscription: result },
    });
  } catch (error) {
    console.error("Admin subscription management error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
