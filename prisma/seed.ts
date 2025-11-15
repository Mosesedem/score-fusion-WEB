import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create sports
  console.log("Creating sports...");
  const football = await prisma.sport.upsert({
    where: { name: "football" },
    update: {},
    create: {
      name: "football",
      displayName: "Football",
      isActive: true,
      sortOrder: 1,
    },
  });

  const basketball = await prisma.sport.upsert({
    where: { name: "basketball" },
    update: {},
    create: {
      name: "basketball",
      displayName: "Basketball",
      isActive: true,
      sortOrder: 2,
    },
  });

  const tennis = await prisma.sport.upsert({
    where: { name: "tennis" },
    update: {},
    create: {
      name: "tennis",
      displayName: "Tennis",
      isActive: true,
      sortOrder: 3,
    },
  });

  // Create admin user
  console.log("Creating admin user...");
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@scorefusion.com" },
    update: {},
    create: {
      email: "admin@scorefusion.com",
      passwordHash: adminPassword,
      displayName: "Admin User",
      role: "ADMIN",
      status: "ACTIVE",
      guest: false,
    },
  });

  // Create test VIP user
  console.log("Creating test VIP user...");
  const vipPassword = await hash("vip123", 12);
  const vipUser = await prisma.user.upsert({
    where: { email: "vip@test.com" },
    update: {},
    create: {
      email: "vip@test.com",
      passwordHash: vipPassword,
      displayName: "VIP Test User",
      role: "USER",
      status: "ACTIVE",
      guest: false,
    },
  });

  // Create VIP subscription for test user
  console.log("Creating VIP subscription...");
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: "test_sub_vip_user" },
    update: {},
    create: {
      userId: vipUser.id,
      stripeSubscriptionId: "test_sub_vip_user",
      stripeCustomerId: "test_cus_vip_user",
      plan: "monthly",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  // Create teams
  console.log("Creating teams...");
  const manCity = await prisma.team.upsert({
    where: { name_sportId: { name: "Manchester City", sportId: football.id } },
    update: {},
    create: {
      name: "Manchester City",
      shortName: "Man City",
      sportId: football.id,
      league: "Premier League",
      country: "England",
      logoUrl: "https://cdn.sportmonks.com/images/soccer/teams/7/39.png",
    },
  });

  const arsenal = await prisma.team.upsert({
    where: { name_sportId: { name: "Arsenal", sportId: football.id } },
    update: {},
    create: {
      name: "Arsenal",
      shortName: "Arsenal",
      sportId: football.id,
      league: "Premier League",
      country: "England",
      logoUrl: "https://cdn.sportmonks.com/images/soccer/teams/2/34.png",
    },
  });

  const liverpool = await prisma.team.upsert({
    where: { name_sportId: { name: "Liverpool", sportId: football.id } },
    update: {},
    create: {
      name: "Liverpool",
      shortName: "Liverpool",
      sportId: football.id,
      league: "Premier League",
      country: "England",
      logoUrl: "https://cdn.sportmonks.com/images/soccer/teams/14/46.png",
    },
  });

  const chelsea = await prisma.team.upsert({
    where: { name_sportId: { name: "Chelsea", sportId: football.id } },
    update: {},
    create: {
      name: "Chelsea",
      shortName: "Chelsea",
      sportId: football.id,
      league: "Premier League",
      country: "England",
      logoUrl: "https://cdn.sportmonks.com/images/soccer/teams/6/38.png",
    },
  });

  const manUtd = await prisma.team.upsert({
    where: { name_sportId: { name: "Manchester United", sportId: football.id } },
    update: {},
    create: {
      name: "Manchester United",
      shortName: "Man Utd",
      sportId: football.id,
      league: "Premier League",
      country: "England",
      logoUrl: "https://cdn.sportmonks.com/images/soccer/teams/1/33.png",
    },
  });

  const tottenham = await prisma.team.upsert({
    where: { name_sportId: { name: "Tottenham", sportId: football.id } },
    update: {},
    create: {
      name: "Tottenham Hotspur",
      shortName: "Tottenham",
      sportId: football.id,
      league: "Premier League",
      country: "England",
      logoUrl: "https://cdn.sportmonks.com/images/soccer/teams/10/42.png",
    },
  });

  // Create current predictions (free tips)
  console.log("Creating current free predictions...");
  
  const freeTip1 = await prisma.tip.create({
    data: {
      title: "Manchester City vs Arsenal - Home Win Expected",
      summary: "Man City's home form has been exceptional this season. Expect a dominant performance.",
      content: `# Match Analysis

## Team Form
Manchester City has won their last 5 home games, scoring an average of 3 goals per match. Arsenal has struggled away from home recently.

## Key Stats
- Man City: 85% possession average at home
- Arsenal: 2 away losses in last 3 games
- Head-to-head: Man City won last 3 meetings

## Prediction
We expect Manchester City to control the game and secure a comfortable home victory.`,
      odds: 1.75,
      oddsSource: "manual",
      sport: "Football",
      league: "Premier League",
      homeTeamId: manCity.id,
      awayTeamId: arsenal.id,
      predictionType: "winner",
      predictedOutcome: "home_win",
      confidenceLevel: 85,
      matchDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      publishAt: new Date(),
      isVIP: false,
      category: "tip",
      featured: true,
      status: "published",
      result: "pending",
      authorId: admin.id,
      authorName: admin.displayName,
      tags: ["Premier League", "Home Win", "High Confidence"],
      ticketSnapshots: [],
    },
  });

  const freeTip2 = await prisma.tip.create({
    data: {
      title: "Liverpool vs Chelsea - Over 2.5 Goals",
      summary: "Both teams have strong attacking records. Expect goals in this exciting matchup.",
      content: `# Match Analysis

## Attacking Power
Both Liverpool and Chelsea have been scoring freely this season. Their recent matches have been high-scoring affairs.

## Defensive Concerns
- Liverpool: Conceded in 4 of last 5 games
- Chelsea: Defensive injuries affecting stability

## Prediction
This match should produce over 2.5 goals given both teams' attacking prowess and defensive vulnerabilities.`,
      odds: 1.65,
      oddsSource: "manual",
      sport: "Football",
      league: "Premier League",
      homeTeamId: liverpool.id,
      awayTeamId: chelsea.id,
      predictionType: "over_under",
      predictedOutcome: "over_2.5",
      confidenceLevel: 75,
      matchDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      publishAt: new Date(),
      isVIP: false,
      category: "tip",
      featured: false,
      status: "published",
      result: "pending",
      authorId: admin.id,
      authorName: admin.displayName,
      tags: ["Premier League", "Over Goals", "Both Teams Score"],
      ticketSnapshots: [],
    },
  });

  // Create current VIP predictions
  console.log("Creating current VIP predictions...");
  
  const vipTip1 = await prisma.tip.create({
    data: {
      title: "Manchester United vs Tottenham - Correct Score 2-1",
      summary: "Premium analysis suggests a narrow home victory with this exact scoreline.",
      content: `# VIP Exclusive Analysis

## Deep Dive Statistics
Our advanced analytics model predicts a 2-1 home victory based on:
- xG differential analysis
- Historical scoring patterns
- Player availability and form

## Tactical Breakdown
Manchester United's counter-attacking style should exploit Tottenham's high defensive line. Expect United to score early and late.

## Betting Strategy
This is a high-value bet with odds of 9.00. Our model gives this a 15% probability, making it a positive EV bet.

## Ticket Snapshot
We've placed this bet ourselves - check the snapshot for proof of our confidence.`,
      odds: 9.0,
      oddsSource: "manual",
      sport: "Football",
      league: "Premier League",
      homeTeamId: manUtd.id,
      awayTeamId: tottenham.id,
      predictionType: "correct_score",
      predictedOutcome: "2-1",
      confidenceLevel: 70,
      matchDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      publishAt: new Date(),
      isVIP: true,
      category: "tip",
      featured: true,
      status: "published",
      result: "pending",
      authorId: admin.id,
      authorName: admin.displayName,
      tags: ["Premier League", "Correct Score", "High Odds", "VIP Exclusive"],
      ticketSnapshots: ["https://example.com/ticket1.jpg"],
    },
  });

  // Create VIP update
  console.log("Creating VIP updates...");
  
  const vipUpdate1 = await prisma.tip.create({
    data: {
      title: "🚨 DRAW ALERT: Chelsea vs Arsenal - Draw @ 3.50",
      summary: "Last-minute team news suggests this match is heading for a draw. Act fast!",
      content: `# VIP Update - Draw Alert

## Breaking News
- Chelsea's star striker ruled out
- Arsenal's key defender injured in training
- Both teams likely to play cautiously

## Updated Analysis
With key players missing on both sides, we're now predicting a tactical draw. This represents excellent value at 3.50 odds.

## Action Required
This is a time-sensitive update. Place your bets before the odds drop!`,
      odds: 3.5,
      oddsSource: "manual",
      sport: "Football",
      league: "Premier League",
      homeTeamId: chelsea.id,
      awayTeamId: arsenal.id,
      predictionType: "winner",
      predictedOutcome: "draw",
      confidenceLevel: 65,
      matchDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      publishAt: new Date(),
      isVIP: true,
      category: "update",
      featured: true,
      status: "published",
      result: "pending",
      authorId: admin.id,
      authorName: admin.displayName,
      tags: ["Premier League", "Draw Alert", "Breaking News", "VIP Update"],
      ticketSnapshots: [],
    },
  });

  // Create historical predictions (completed)
  console.log("Creating historical predictions...");
  
  const historyTip1 = await prisma.tip.create({
    data: {
      title: "Arsenal vs Liverpool - Home Win ✅",
      summary: "Arsenal dominated at home as predicted. Comfortable 3-1 victory.",
      content: `# Match Report

Arsenal delivered an impressive performance, winning 3-1 as we predicted. Our analysis was spot on regarding their home dominance.`,
      odds: 2.1,
      oddsSource: "manual",
      sport: "Football",
      league: "Premier League",
      homeTeamId: arsenal.id,
      awayTeamId: liverpool.id,
      predictionType: "winner",
      predictedOutcome: "home_win",
      confidenceLevel: 80,
      matchDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      publishAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      isVIP: false,
      category: "tip",
      featured: false,
      status: "published",
      result: "won",
      authorId: admin.id,
      authorName: admin.displayName,
      tags: ["Premier League", "Home Win", "Completed"],
      ticketSnapshots: [],
    },
  });

  const historyTip2 = await prisma.tip.create({
    data: {
      title: "Manchester City vs Chelsea - Over 2.5 Goals ✅",
      summary: "High-scoring thriller as predicted! 4-2 final score.",
      content: `# Match Report

An absolute goal fest! Manchester City won 4-2, giving us a comfortable win on the Over 2.5 goals bet.`,
      odds: 1.7,
      oddsSource: "manual",
      sport: "Football",
      league: "Premier League",
      homeTeamId: manCity.id,
      awayTeamId: chelsea.id,
      predictionType: "over_under",
      predictedOutcome: "over_2.5",
      confidenceLevel: 75,
      matchDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      publishAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      isVIP: false,
      category: "tip",
      featured: false,
      status: "published",
      result: "won",
      authorId: admin.id,
      authorName: admin.displayName,
      tags: ["Premier League", "Over Goals", "Completed"],
      ticketSnapshots: [],
    },
  });

  const historyTip3 = await prisma.tip.create({
    data: {
      title: "Tottenham vs Manchester United - Away Win ❌",
      summary: "Unexpected result. Tottenham won 2-0 at home.",
      content: `# Match Report

This one didn't go our way. Tottenham's home form proved stronger than anticipated. We'll analyze what went wrong.`,
      odds: 2.3,
      oddsSource: "manual",
      sport: "Football",
      league: "Premier League",
      homeTeamId: tottenham.id,
      awayTeamId: manUtd.id,
      predictionType: "winner",
      predictedOutcome: "away_win",
      confidenceLevel: 65,
      matchDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      publishAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      isVIP: false,
      category: "tip",
      featured: false,
      status: "published",
      result: "lost",
      authorId: admin.id,
      authorName: admin.displayName,
      tags: ["Premier League", "Away Win", "Completed"],
      ticketSnapshots: [],
    },
  });

  // Create VIP historical predictions
  const vipHistoryTip1 = await prisma.tip.create({
    data: {
      title: "Liverpool vs Arsenal - Correct Score 3-1 ✅",
      summary: "Perfect prediction! Liverpool won exactly 3-1 as forecasted.",
      content: `# VIP Match Report

Incredible accuracy! Our correct score prediction hit perfectly. Liverpool dominated with a 3-1 victory.

This was a high-odds bet (8.50) that paid off handsomely for our VIP members.`,
      odds: 8.5,
      oddsSource: "manual",
      sport: "Football",
      league: "Premier League",
      homeTeamId: liverpool.id,
      awayTeamId: arsenal.id,
      predictionType: "correct_score",
      predictedOutcome: "3-1",
      confidenceLevel: 70,
      matchDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      publishAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      isVIP: true,
      category: "tip",
      featured: true,
      status: "published",
      result: "won",
      authorId: admin.id,
      authorName: admin.displayName,
      tags: ["Premier League", "Correct Score", "VIP Exclusive", "Completed"],
      ticketSnapshots: ["https://example.com/winning-ticket1.jpg"],
    },
  });

  const vipHistoryUpdate1 = await prisma.tip.create({
    data: {
      title: "🚨 Chelsea vs Tottenham - Draw Alert ✅",
      summary: "Draw prediction was spot on! 1-1 final score.",
      content: `# VIP Update Report

Our last-minute draw alert proved accurate. The match ended 1-1, delivering excellent value at 3.40 odds.`,
      odds: 3.4,
      oddsSource: "manual",
      sport: "Football",
      league: "Premier League",
      homeTeamId: chelsea.id,
      awayTeamId: tottenham.id,
      predictionType: "winner",
      predictedOutcome: "draw",
      confidenceLevel: 68,
      matchDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      publishAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
      isVIP: true,
      category: "update",
      featured: false,
      status: "published",
      result: "won",
      authorId: admin.id,
      authorName: admin.displayName,
      tags: ["Premier League", "Draw Alert", "VIP Update", "Completed"],
      ticketSnapshots: [],
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("\n📊 Summary:");
  console.log(`- Sports created: 3 (Football, Basketball, Tennis)`);
  console.log(`- Teams created: 6 Premier League teams`);
  console.log(`- Admin user: admin@scorefusion.com (password: admin123)`);
  console.log(`- VIP user: vip@test.com (password: vip123)`);
  console.log(`- Current free tips: 2`);
  console.log(`- Current VIP tips: 1`);
  console.log(`- Current VIP updates: 1`);
  console.log(`- Historical free tips: 3`);
  console.log(`- Historical VIP tips: 2`);
  console.log("\n🎯 You can now test the application with realistic data!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
