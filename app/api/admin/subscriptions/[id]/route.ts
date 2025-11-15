import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

// Schema for subscription updates
const updateSubscriptionSchema = z.object({
  plan: z.enum(["monthly", "yearly", "trial"]).optional(),
  status: z.enum(["active", "canceled", "past_due", "incomplete"]).optional(),
});

// Helper to safely unwrap dynamic route params (Next.js may provide a Promise)
async function unwrapParams<T extends Record<string, unknown>>(
  params: T | Promise<T>
): Promise<T> {
  return (params instanceof Promise ? await params : params) as T;
}

function isUUID(id: string | undefined): id is string {
  return !!id && /^[0-9a-fA-F-]{36}$/.test(id);
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
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

    const { id } = await unwrapParams(context.params);

    if (!isUUID(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription id" },
        { status: 400 }
      );
    }

    // Check if subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            displayName: true,
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Delete the subscription
    await prisma.subscription.delete({
      where: { id },
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "delete_subscription",
        resource: subscription.userId,
        details: {
          subscriptionId: id,
          plan: subscription.plan,
          status: subscription.status,
          deletedBy: session.user.displayName || session.user.name,
          userEmail: subscription.user.email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete subscription:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
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

    const { id } = await unwrapParams(context.params);

    if (!isUUID(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription id" },
        { status: 400 }
      );
    }

    // Fetch subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            name: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { subscription },
    });
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
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

    const { id } = await unwrapParams(context.params);

    if (!isUUID(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription id" },
        { status: 400 }
      );
    }
    const body = await request.json();

    // Validate input
    const validatedData = updateSubscriptionSchema.parse(body);

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
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
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (validatedData.plan) {
      updateData.plan = validatedData.plan;
    }

    if (validatedData.status) {
      updateData.status = validatedData.status;

      // If status is being set to canceled, set canceledAt
      if (
        validatedData.status === "canceled" &&
        !existingSubscription.canceledAt
      ) {
        updateData.canceledAt = new Date();
        updateData.cancelAtPeriodEnd = true;
      }
    }

    // Update the subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
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
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "update_subscription",
        resource: existingSubscription.userId,
        details: {
          subscriptionId: id,
          oldPlan: existingSubscription.plan,
          newPlan: validatedData.plan || existingSubscription.plan,
          oldStatus: existingSubscription.status,
          newStatus: validatedData.status || existingSubscription.status,
          updatedBy: session.user.displayName || session.user.name,
          userEmail: existingSubscription.user.email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      data: { subscription: updatedSubscription },
    });
  } catch (error) {
    console.error("Failed to update subscription:", error);

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
