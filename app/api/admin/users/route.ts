/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

// Query schemas
const usersQuerySchema = z.object({
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("20"),
  search: z.string().optional(),
  status: z.enum(["active", "banned", "self_excluded", "vip"]).optional(),
  sport: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "lastLoginAt", "totalEarned", "balance"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// User update schema
const updateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  isAdmin: z.boolean().optional(),
  status: z.enum(["active", "banned", "self_excluded"]).optional(),
  walletAdjustment: z
    .object({
      amount: z.number(),
      reason: z.string(),
      type: z.enum(["bonus", "penalty", "refund"]),
    })
    .optional(),
  profile: z
    .object({
      country: z.string().optional(),
      selfExclusionUntil: z.string().datetime().optional(),
      depositLimits: z
        .object({
          daily: z.number().optional(),
          weekly: z.number().optional(),
          monthly: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
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
    const query = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedQuery = usersQuerySchema.parse(query);

    // Build where clause
    const where: any = {
      guest: false,
      deletedAt: null,
    };

    if (validatedQuery.search) {
      where.OR = [
        {
          displayName: { mode: "insensitive", contains: validatedQuery.search },
        },
        { email: { mode: "insensitive", contains: validatedQuery.search } },
      ];
    }

    if (validatedQuery.status) {
      switch (validatedQuery.status) {
        case "banned":
          where.lockedUntil = { gt: new Date() };
          break;
        case "self_excluded":
          where.profile = {
            selfExclusionUntil: { gt: new Date() },
          };
          break;
        case "vip":
          where.subscriptions = {
            some: {
              status: "active",
              currentPeriodEnd: { gte: new Date() },
            },
          };
          break;
      }
    }

    // Get pagination info
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = Math.min(validatedQuery.limit, 100);

    // Build order by
    const orderBy: any = {};
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder;

    // Query users with detailed information
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          profile: {
            select: {
              country: true,
              selfExclusionUntil: true,
              marketingConsent: true,
              analyticsConsent: true,
            },
          },
          wallet: {
            select: {
              balance: true,
              tokens: true,
              bonusTokens: true,
              totalEarned: true,
              totalWithdrawn: true,
            },
          },
          subscriptions: {
            where: {
              status: "active",
              currentPeriodEnd: { gte: new Date() },
            },
            select: {
              plan: true,
              currentPeriodEnd: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          bets: {
            select: {
              amount: true,
              status: true,
            },
          },
          referralEarnings: {
            select: {
              amount: true,
              status: true,
            },
          },
          referredUsers: {
            select: {
              id: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              bets: true,
              referredUsers: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    console.log("Admin users query results:", {
      totalFound: total,
      usersReturned: users.length,
      where: JSON.stringify(where),
    });

    const hasMore = skip + users.length < total;

    // Calculate additional metrics for each user
    interface Bet {
      amount: number | { toNumber: () => number };
      status: string;
    }

    interface ReferralEarning {
      amount: number | string | { toNumber: () => number };
      status: string;
    }

    interface Subscription {
      plan: string;
      currentPeriodEnd: Date;
      createdAt?: Date;
    }

    interface UserCount {
      bets: number;
      referredUsers: number;
    }

    interface UserProfile {
      country?: string | null;
      selfExclusionUntil?: Date | null;
      marketingConsent?: boolean | null;
      analyticsConsent?: boolean | null;
    }

    interface Wallet {
      balance: number | string | { toNumber: () => number };
      tokens: number;
      bonusTokens?: number;
      totalEarned?: number | string | { toNumber: () => number };
      totalWithdrawn?: number | string | { toNumber: () => number };
    }

    interface UserDB {
      id: string;
      displayName?: string | null;
      email?: string | null;
      guest: boolean;
      deletedAt: Date | null;
      profile: UserProfile | null;
      wallet: Wallet | null;
      subscriptions: Subscription[];
      bets: Bet[];
      referralEarnings: ReferralEarning[];
      referredUsers: Array<{ id: string; createdAt: Date }>;
      _count: UserCount;
      [key: string]: any;
    }

    type UserWithMetrics = UserDB & {
      totalBets: number;
      totalReferrals: number;
      betWinRate: number;
      totalEarnings: number;
      vipStatus: boolean;
      subscriptionPlan: string | null;
    };

    const usersWithMetrics: UserWithMetrics[] = (
      users as unknown as UserDB[]
    ).map((user) => ({
      ...user,
      totalBets: user._count.bets,
      totalReferrals: user._count.referredUsers,
      betWinRate: calculateWinRate(user.bets),
      totalEarnings: user.referralEarnings
        .filter((e) => e.status === "confirmed")
        .reduce((sum, e) => sum + Number(e.amount), 0),
      vipStatus: user.subscriptions.length > 0,
      subscriptionPlan: user.subscriptions[0]?.plan || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithMetrics,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          hasMore,
          totalPages: Math.ceil(total / validatedQuery.limit),
        },
      },
    });
  } catch (error) {
    console.error("Admin users GET error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    // Determine the action based on request body
    const { action, userId, data } = body;

    if (action === "ban" && userId) {
      return banUser(userId, data.reason, session.user.id);
    }

    if (action === "unban" && userId) {
      return unbanUser(userId, session.user.id);
    }

    if (action === "update_wallet" && userId) {
      return updateUserWallet(userId, data, session.user.id);
    }

    if (action === "self_exclude" && userId) {
      return setSelfExclusion(userId, data.days, session.user.id);
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin users POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { userId, status, role } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    // Handle status changes
    if (status) {
      if (status === "BANNED") {
        updateData.status = "BANNED";
        updateData.lockedUntil = new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ); // 1 year
      } else if (status === "ACTIVE") {
        updateData.status = "ACTIVE";
        updateData.lockedUntil = null;
        updateData.loginAttempts = 0;
      }
    }

    // Handle role changes
    if (role) {
      updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: status
          ? status === "BANNED"
            ? "ban_user"
            : "unban_user"
          : "update_user_role",
        resource: userId,
        details: {
          changes: updateData,
          updatedBy: session.user.displayName || session.user.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    // Soft delete the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: "DELETED",
      },
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "delete_user",
        resource: userId,
        details: {
          deletedBy: session.user.displayName || session.user.name,
          deletedAt: new Date(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Admin users DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateUserSchema.parse(body);

    // Update user in transaction
    interface DepositLimits {
      daily?: number;
      weekly?: number;
      monthly?: number;
    }

    interface ProfileInput {
      country?: string | null;
      selfExclusionUntil?: string;
      depositLimits?: DepositLimits;
    }

    interface WalletAdjustmentInput {
      amount: number;
      reason: string;
      type: "bonus" | "penalty" | "refund";
    }

    interface WalletRecord {
      balance: number | string;
      tokens: number;
      bonusTokens?: number | null;
    }

    interface UpdatedUserResult {
      id: string;
      displayName?: string | null;
      email?: string | null;
      profile?: any;
      wallet?: WalletRecord | null;
      [key: string]: any;
    }

    const result = await prisma.$transaction(
      async (tx: any): Promise<UpdatedUserResult> => {
        // Narrow validatedData shape for local usage
        const vd = validatedData as {
          displayName?: string;
          email?: string;
          isAdmin?: boolean;
          status?: "banned" | "active" | "self_excluded" | "vip";
          profile?: ProfileInput;
          walletAdjustment?: WalletAdjustmentInput;
        };

        // Update basic user info
        const updateData: Partial<{
          displayName: string;
          email: string;
          isAdmin: boolean;
          lockedUntil: Date | null;
          loginAttempts?: number;
        }> = {};
        if (vd.displayName) updateData.displayName = vd.displayName;
        if (vd.email) updateData.email = vd.email.toLowerCase();
        if (vd.isAdmin !== undefined) updateData.isAdmin = vd.isAdmin;

        // Handle status changes
        if (vd.status) {
          switch (vd.status) {
            case "banned":
              updateData.lockedUntil = new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000
              ); // 1 year
              break;
            case "active":
              updateData.lockedUntil = null;
              break;
          }
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: updateData,
          include: {
            profile: true,
            wallet: true,
          },
        });

        // Update profile if provided
        if (vd.profile) {
          await tx.profile.upsert({
            where: { userId },
            update: vd.profile,
            create: {
              userId,
              ...vd.profile,
            },
          });
        }

        // Handle wallet adjustments
        if (vd.walletAdjustment) {
          const { amount, reason, type } = vd.walletAdjustment;

          const wallet = (await tx.wallet.findUnique({
            where: { userId },
          })) as WalletRecord | null;

          if (!wallet) {
            throw new Error("User wallet not found");
          }

          let newBalance = Number(wallet.balance);
          let newTokens = wallet.tokens;

          switch (type) {
            case "bonus":
              newBalance += amount;
              break;
            case "penalty":
              newBalance = Math.max(0, newBalance - Math.abs(amount));
              break;
            case "refund":
              newBalance += amount;
              newTokens += Math.floor(amount * 100); // Add tokens equivalent to amount
              break;
          }

          await tx.wallet.update({
            where: { userId },
            data: {
              balance: newBalance,
              tokens: newTokens,
            },
          });

          // Create earning record
          await tx.earning.create({
            data: {
              userId,
              type: `admin_${type}`,
              amount: type === "penalty" ? -Math.abs(amount) : amount,
              currency: "USD",
              tokens: type === "refund" ? Math.floor(amount * 100) : 0,
              status: "confirmed",
              description: `Admin ${type}: ${reason}`,
              confirmedAt: new Date(),
            },
          });
        }

        return updatedUser as UpdatedUserResult;
      }
    );

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        userId: session.user.id,
        action: "update_user",
        resource: userId,
        details: {
          updatedFields: Object.keys(validatedData),
          updatedBy: session.user.displayName || session.user.name,
        },
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: {
        user: result,
      },
    });
  } catch (error) {
    console.error("Admin users PUT error:", error);

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

// Helper functions
function calculateWinRate(bets: any[]): number {
  if (!bets || bets.length === 0) return 0;

  const wonBets = bets.filter((bet) => bet.status === "won").length;
  return (wonBets / bets.length) * 100;
}

async function banUser(
  userId: string,
  reason: string,
  adminId: string
): Promise<NextResponse> {
  interface UserUpdateData {
    lockedUntil: Date;
    loginAttempts: number;
  }

  interface AuditLogDetails {
    reason: string;
    bannedAt: Date;
  }

  interface AuditLogData {
    userId: string;
    action: string;
    resource: string;
    details: AuditLogDetails;
  }

  await prisma.$transaction(async (tx: any) => {
    // Lock user account
    await tx.user.update({
      where: { id: userId },
      data: {
        lockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        loginAttempts: 5,
      } as UserUpdateData,
    });

    // Revoke all active sessions
    // TODO: Implement session revocation

    // Create audit log
    await tx.adminAuditLog.create({
      data: {
        userId: adminId,
        action: "ban_user",
        resource: userId,
        details: {
          reason,
          bannedAt: new Date(),
        },
      } as AuditLogData,
    });
  });

  return NextResponse.json({
    success: true,
    message: "User banned successfully",
  });
}

async function unbanUser(
  userId: string,
  adminId: string
): Promise<NextResponse> {
  interface UserUnbanUpdateData {
    lockedUntil: null;
    loginAttempts: number;
  }

  interface UnbanAuditLogDetails {
    unbannedAt: Date;
  }

  interface UnbanAuditLogData {
    userId: string;
    action: string;
    resource: string;
    details: UnbanAuditLogDetails;
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        loginAttempts: 0,
      } as UserUnbanUpdateData,
    });

    await tx.adminAuditLog.create({
      data: {
        userId: adminId,
        action: "unban_user",
        resource: userId,
        details: {
          unbannedAt: new Date(),
        },
      } as UnbanAuditLogData,
    });
  });

  return NextResponse.json({
    success: true,
    message: "User unbanned successfully",
  });
}

async function updateUserWallet(
  userId: string,
  adjustment: any,
  adminId: string
): Promise<NextResponse> {
  const { amount, reason, type } = adjustment;

  interface Wallet {
    balance: number | string;
    [key: string]: any;
  }

  interface EarningData {
    userId: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
    confirmedAt: Date;
  }

  interface AuditLogDetails {
    amount: number;
    type: string;
    reason: string;
    newBalance: number;
  }

  interface AuditLogData {
    userId: string;
    action: string;
    resource: string;
    details: AuditLogDetails;
  }

  await prisma.$transaction(async (tx: any) => {
    const wallet = (await tx.wallet.findUnique({
      where: { userId },
    })) as Wallet | null;

    if (!wallet) {
      throw new Error("User wallet not found");
    }

    const newBalance = Number(wallet.balance) + amount;
    if (newBalance < 0) {
      throw new Error("Insufficient balance for penalty");
    }

    await tx.wallet.update({
      where: { userId },
      data: {
        balance: newBalance,
      },
    });

    await tx.earning.create({
      data: {
        userId,
        type: `admin_${type}`,
        amount,
        currency: "USD",
        status: "confirmed",
        description: `Admin ${type}: ${reason}`,
        confirmedAt: new Date(),
      } as EarningData,
    });

    await tx.adminAuditLog.create({
      data: {
        userId: adminId,
        action: "adjust_wallet",
        resource: userId,
        details: {
          amount,
          type,
          reason,
          newBalance,
        },
      } as AuditLogData,
    });
  });

  return NextResponse.json({
    success: true,
    message: "Wallet adjusted successfully",
  });
}

async function setSelfExclusion(
  userId: string,
  days: number,
  adminId: string
): Promise<NextResponse> {
  const exclusionDate = new Date();
  exclusionDate.setDate(exclusionDate.getDate() + days);

  interface SelfExclusionProfile {
    selfExclusionUntil: Date;
  }

  interface SelfExclusionAuditDetails {
    days: number;
    exclusionUntil: Date;
  }

  interface SelfExclusionAuditLogData {
    userId: string;
    action: string;
    resource: string;
    details: SelfExclusionAuditDetails;
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.profile.upsert({
      where: { userId },
      update: {
        selfExclusionUntil: exclusionDate,
      } as SelfExclusionProfile,
      create: {
        userId,
        selfExclusionUntil: exclusionDate,
      } as SelfExclusionProfile,
    });

    await tx.adminAuditLog.create({
      data: {
        userId: adminId,
        action: "self_exclude_user",
        resource: userId,
        details: {
          days,
          exclusionUntil: exclusionDate,
        },
      } as SelfExclusionAuditLogData,
    });
  });

  return NextResponse.json({
    success: true,
    message: `Self-exclusion set for ${days} days`,
  });
}
