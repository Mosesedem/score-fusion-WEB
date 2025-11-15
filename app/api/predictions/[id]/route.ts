import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(request);

    // Fetch the prediction
    const tip = await prisma.tip.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        odds: true,
        oddsSource: true,
        sport: true,
        league: true,
        matchId: true,
        matchDate: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: {
          select: { id: true, name: true, shortName: true, logoUrl: true },
        },
        awayTeam: {
          select: { id: true, name: true, shortName: true, logoUrl: true },
        },
        predictionType: true,
        predictedOutcome: true,
        confidenceLevel: true,
        ticketSnapshots: true,
        publishAt: true,
        isVIP: true,
        featured: true,
        authorName: true,
        status: true,
        attachments: true,
        tags: true,
        viewCount: true,
        successRate: true,
        result: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tip) {
      return NextResponse.json(
        { success: false, error: "Prediction not found" },
        { status: 404 }
      );
    }

    // Check if prediction is published
    if (tip.status !== "published" || tip.publishAt > new Date()) {
      return NextResponse.json(
        { success: false, error: "Prediction not available" },
        { status: 403 }
      );
    }

    // Increment view count
    await prisma.tip.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Track analytics
    if (auth.user) {
      try {
        await prisma.analyticsEvent.create({
          data: {
            userId: auth.user.guest ? undefined : auth.user.id,
            type: "prediction_viewed",
            payload: {
              tipId: id,
              isVIP: tip.isVIP,
              hasAccess: true,
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch (error) {
        console.error("Failed to track prediction view:", error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        prediction: tip,
        hasVipAccess: true,
      },
    });
  } catch (error) {
    console.error("Prediction fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
