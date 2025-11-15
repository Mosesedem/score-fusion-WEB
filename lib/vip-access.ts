/**
 * VIP Access Control Library
 *
 * Centralized VIP subscription and token checking logic
 * Use these functions across all API routes to ensure consistent VIP access control
 */

import { prisma } from "./db";

export interface VIPAccessResult {
  hasAccess: boolean;
  accessType?: "subscription" | "general_token" | "specific_token" | null;
  subscription?: {
    id: string;
    plan: string;
    status: string;
    expiresAt: Date;
  } | null;
  token?: {
    id: string;
    type: string;
    remaining: number;
    expiresAt: Date;
  } | null;
}

/**
 * Check if a user has VIP access (subscription or general tokens)
 * Use this for general VIP content access checks
 */
export async function checkVIPAccess(userId: string): Promise<VIPAccessResult> {
  try {
    // Check for active subscription first (most common)
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
        currentPeriodEnd: { gte: new Date() },
      },
      orderBy: { currentPeriodEnd: "desc" },
    });

    if (activeSubscription) {
      return {
        hasAccess: true,
        accessType: "subscription",
        subscription: {
          id: activeSubscription.id,
          plan: activeSubscription.plan,
          status: activeSubscription.status,
          expiresAt: activeSubscription.currentPeriodEnd,
        },
        token: null,
      };
    }

    // Check for valid general VIP tokens
    // Note: Prisma doesn't support direct field-to-field comparison, so we fetch and filter
    const generalTokens = await prisma.vIPToken.findMany({
      where: {
        userId,
        type: "general", // Only general tokens for overall VIP access
        expiresAt: { gte: new Date() },
      },
      orderBy: { expiresAt: "desc" },
    });

    const validGeneralToken = generalTokens.find(
      (token: { used: number; quantity: number }) => token.used < token.quantity
    );

    if (validGeneralToken) {
      return {
        hasAccess: true,
        accessType: "general_token",
        subscription: null,
        token: {
          id: validGeneralToken.id,
          type: validGeneralToken.type,
          remaining: validGeneralToken.quantity - validGeneralToken.used,
          expiresAt: validGeneralToken.expiresAt,
        },
      };
    }

    return {
      hasAccess: false,
      accessType: null,
      subscription: null,
      token: null,
    };
  } catch (error) {
    console.error("Error checking VIP access:", error);
    return {
      hasAccess: false,
      accessType: null,
      subscription: null,
      token: null,
    };
  }
}

/**
 * Check if a user has access to a specific VIP tip/prediction
 * Checks: 1) Active subscription, 2) General VIP tokens, 3) Specific tip tokens
 */
export async function checkTipAccess(
  userId: string,
  tipId: string
): Promise<VIPAccessResult> {
  try {
    // First check general VIP access (subscription or general tokens)
    const generalAccess = await checkVIPAccess(userId);
    if (generalAccess.hasAccess) {
      return generalAccess;
    }

    // If no general access, check for specific tip token
    const specificTokens = await prisma.vIPToken.findMany({
      where: {
        userId,
        tipId,
        expiresAt: { gte: new Date() },
      },
      orderBy: { expiresAt: "desc" },
    });

    const specificToken = specificTokens.find(
      (token: { used: number; quantity: number }) => token.used < token.quantity
    );

    if (specificToken) {
      return {
        hasAccess: true,
        accessType: "specific_token",
        subscription: null,
        token: {
          id: specificToken.id,
          type: specificToken.type,
          remaining: specificToken.quantity - specificToken.used,
          expiresAt: specificToken.expiresAt,
        },
      };
    }

    return {
      hasAccess: false,
      accessType: null,
      subscription: null,
      token: null,
    };
  } catch (error) {
    console.error("Error checking tip access:", error);
    return {
      hasAccess: false,
      accessType: null,
      subscription: null,
      token: null,
    };
  }
}

/**
 * Simple boolean check for VIP access
 * Use when you only need a yes/no answer without details
 */
export async function hasVIPAccess(userId: string): Promise<boolean> {
  const result = await checkVIPAccess(userId);
  return result.hasAccess;
}

/**
 * Simple boolean check for specific tip access
 */
export async function hasTipAccess(
  userId: string,
  tipId: string
): Promise<boolean> {
  const result = await checkTipAccess(userId, tipId);
  return result.hasAccess;
}

/**
 * Get all active VIP entitlements for a user
 * Returns subscriptions and tokens with full details
 */
export async function getVIPEntitlements(userId: string) {
  try {
    const [activeSubscriptions, allTokens] = await Promise.all([
      // Active subscriptions
      prisma.subscription.findMany({
        where: {
          userId,
          status: "active",
          currentPeriodEnd: { gte: new Date() },
        },
        orderBy: { currentPeriodEnd: "desc" },
      }),
      // Available VIP tokens
      prisma.vIPToken.findMany({
        where: {
          userId,
          expiresAt: { gte: new Date() },
        },
        include: {
          tip: {
            select: {
              id: true,
              title: true,
              sport: true,
              summary: true,
            },
          },
        },
        orderBy: { expiresAt: "asc" },
      }),
    ]);

    // Filter tokens where used < quantity
    const availableTokens = allTokens.filter(
      (token: { used: number; quantity: number }) => token.used < token.quantity
    );

    const hasActiveSubscription = activeSubscriptions.length > 0;
    const hasAvailableTokens = availableTokens.length > 0;

    return {
      hasAccess: hasActiveSubscription || hasAvailableTokens,
      subscriptions: activeSubscriptions.map(
        (sub: {
          id: string;
          plan: string;
          status: string;
          currentPeriodStart: Date;
          currentPeriodEnd: Date;
          cancelAtPeriodEnd: boolean;
        }) => ({
          id: sub.id,
          plan: sub.plan,
          status: sub.status,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        })
      ),
      tokens: availableTokens.map((token) => ({
        id: token.id,
        type: token.type,
        quantity: token.quantity,
        used: token.used,
        remaining: token.quantity - token.used,
        expiresAt: token.expiresAt,
        tipId: token.tipId,
        tip: token.tip,
      })),
    };
  } catch (error) {
    console.error("Error getting VIP entitlements:", error);
    return {
      hasAccess: false,
      subscriptions: [],
      tokens: [],
    };
  }
}

/**
 * Increment usage count for a VIP token when accessing VIP content
 * Call this when a user views VIP content using a token
 */
export async function useVIPToken(tokenId: string): Promise<boolean> {
  try {
    const token = await prisma.vIPToken.findUnique({
      where: { id: tokenId },
    });

    if (!token || token.used >= token.quantity) {
      return false;
    }

    await prisma.vIPToken.update({
      where: { id: tokenId },
      data: {
        used: { increment: 1 },
        usedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error("Error using VIP token:", error);
    return false;
  }
}
