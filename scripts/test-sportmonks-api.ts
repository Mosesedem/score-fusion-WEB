/**
 * Test script for Sportmonks API integration
 * Run with: npx tsx scripts/test-sportmonks-api.ts
 */

import { SportMonksProvider } from "../lib/api-providers/sportmonks";

async function testSportMonksAPI() {
  console.log("🏈 Testing Sportmonks API Integration\n");
  console.log("=".repeat(60));

  // Check for API key
  const apiKey = process.env.SPORTMONKS_API_KEY;
  if (!apiKey) {
    console.error("❌ SPORTMONKS_API_KEY not found in environment variables");
    process.exit(1);
  }

  console.log("✅ API Key found");
  console.log("🔗 Initializing SportMonks provider...\n");

  const provider = new SportMonksProvider(apiKey);

  // Test 1: Get Live Matches
  console.log("=".repeat(60));
  console.log("TEST 1: Fetching Live Matches");
  console.log("=".repeat(60));
  try {
    const liveMatches = await provider.getLiveMatches();
    console.log(`✅ Live matches fetched: ${liveMatches.data.length}`);
    if (liveMatches.data.length > 0) {
      const sample = liveMatches.data[0];
      console.log("\n📊 Sample live match:");
      console.log(`   ID: ${sample.externalId}`);
      console.log(`   League: ${sample.league} (${sample.leagueCountry})`);
      console.log(`   Match: ${sample.homeTeam} vs ${sample.awayTeam}`);
      console.log(`   Score: ${sample.homeScore} - ${sample.awayScore}`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Period: ${sample.period}`);
      console.log(`   Minute: ${sample.minute || "N/A"}`);
    } else {
      console.log("ℹ️  No live matches at the moment");
    }
  } catch (error) {
    console.error("❌ Failed to fetch live matches:", error);
  }

  // Test 2: Get Scheduled Matches
  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: Fetching Scheduled Matches (Today)");
  console.log("=".repeat(60));
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const scheduledMatches = await provider.getScheduledMatches({
      dateFrom: today,
      dateTo: tomorrow,
    });
    console.log(
      `✅ Scheduled matches fetched: ${scheduledMatches.data.length}`
    );
    if (scheduledMatches.data.length > 0) {
      const sample = scheduledMatches.data[0];
      console.log("\n📊 Sample scheduled match:");
      console.log(`   ID: ${sample.externalId}`);
      console.log(`   League: ${sample.league} (${sample.leagueCountry})`);
      console.log(`   Match: ${sample.homeTeam} vs ${sample.awayTeam}`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Scheduled: ${sample.scheduledAt.toLocaleString()}`);
      console.log(`   Venue: ${sample.venue || "N/A"}`);
    } else {
      console.log("ℹ️  No scheduled matches for today");
    }
  } catch (error) {
    console.error("❌ Failed to fetch scheduled matches:", error);
  }

  // Test 3: Get Finished Matches
  console.log("\n" + "=".repeat(60));
  console.log("TEST 3: Fetching Finished Matches (Last 2 days)");
  console.log("=".repeat(60));
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const finishedMatches = await provider.getFinishedMatches({
      dateFrom: twoDaysAgo,
      dateTo: yesterday,
    });
    console.log(`✅ Finished matches fetched: ${finishedMatches.data.length}`);
    if (finishedMatches.data.length > 0) {
      const sample = finishedMatches.data[0];
      console.log("\n📊 Sample finished match:");
      console.log(`   ID: ${sample.externalId}`);
      console.log(`   League: ${sample.league} (${sample.leagueCountry})`);
      console.log(`   Match: ${sample.homeTeam} vs ${sample.awayTeam}`);
      console.log(`   Score: ${sample.homeScore} - ${sample.awayScore}`);
      console.log(`   Status: ${sample.status}`);
      console.log(`   Scheduled: ${sample.scheduledAt.toLocaleString()}`);
    } else {
      console.log("ℹ️  No finished matches in the last 2 days");
    }
  } catch (error) {
    console.error("❌ Failed to fetch finished matches:", error);
  }

  // Test 4: Search Matches
  console.log("\n" + "=".repeat(60));
  console.log("TEST 4: Searching for 'Premier League' matches");
  console.log("=".repeat(60));
  try {
    const searchResults = await provider.searchMatches("Premier League", {
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dateTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    console.log(`✅ Search results: ${searchResults.data.length}`);
    if (searchResults.data.length > 0) {
      console.log("\n📊 Top 3 matches:");
      searchResults.data.slice(0, 3).forEach((match, index) => {
        console.log(
          `\n   ${index + 1}. ${match.homeTeam} vs ${match.awayTeam}`
        );
        console.log(`      League: ${match.league}`);
        console.log(`      Status: ${match.status}`);
        console.log(`      Time: ${match.scheduledAt.toLocaleString()}`);
      });
    } else {
      console.log("ℹ️  No Premier League matches found");
    }
  } catch (error) {
    console.error("❌ Failed to search matches:", error);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ Test Complete!");
  console.log("=".repeat(60));
}

// Run the test
testSportMonksAPI().catch(console.error);
