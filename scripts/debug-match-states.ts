/**
 * Debug script to check actual match states
 */

import { SportMonksProvider } from "../lib/api-providers/sportmonks";

async function debugMatchStates() {
  console.log("🔍 Debugging Match States\n");
  console.log("=".repeat(60));

  const apiKey = process.env.SPORTMONKS_API_KEY;
  if (!apiKey) {
    console.error("❌ SPORTMONKS_API_KEY not found");
    process.exit(1);
  }

  const provider = new SportMonksProvider(apiKey);

  // Fetch today's matches
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const scheduledMatches = await provider.getScheduledMatches({
    dateFrom: today,
    dateTo: tomorrow,
  });

  console.log(`\n📊 Found ${scheduledMatches.data.length} matches today\n`);
  console.log("=".repeat(60));

  scheduledMatches.data.forEach((match, index) => {
    console.log(`\n${index + 1}. ${match.homeTeam} vs ${match.awayTeam}`);
    console.log(`   League: ${match.league}`);
    console.log(`   Status: ${match.status}`);
    console.log(`   Period: ${match.period}`);
    console.log(`   Score: ${match.homeScore} - ${match.awayScore}`);
    console.log(`   Scheduled: ${match.scheduledAt.toLocaleString()}`);
    console.log(`   Is Live?: ${match.status === "live" ? "YES ✅" : "NO ❌"}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("\n📈 Status Breakdown:");
  const statusCount: Record<string, number> = {};
  scheduledMatches.data.forEach((m) => {
    statusCount[m.status] = (statusCount[m.status] || 0) + 1;
  });

  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
}

debugMatchStates().catch(console.error);
