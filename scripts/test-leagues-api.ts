/**
 * Test script to verify leagues API and provider integration
 */

import { SportMonksProvider } from "../lib/api-providers/sportmonks";

async function testLeaguesAPI() {
  console.log("🧪 Testing Leagues API Integration\n");
  console.log("=".repeat(60));

  const apiKey = process.env.SPORTMONKS_API_KEY;
  if (!apiKey) {
    console.error("❌ SPORTMONKS_API_KEY not found");
    process.exit(1);
  }

  const provider = new SportMonksProvider(apiKey);

  console.log("\n📋 TEST 1: Fetching leagues from provider");
  console.log("=".repeat(60));

  try {
    console.time("Provider getLeagues");
    const leagues = await provider.getLeagues("football");
    console.timeEnd("Provider getLeagues");

    console.log(`\n✅ Successfully fetched ${leagues.length} leagues`);

    // Show first 20 leagues
    console.log("\n📊 First 20 leagues:");
    leagues.slice(0, 20).forEach((l, idx) => {
      console.log(`${idx + 1}. ${l.name} ${l.country ? `(${l.country})` : ""}`);
    });

    // Count by country
    const byCountry = new Map<string, number>();
    for (const l of leagues) {
      const country = l.country || "Unknown";
      byCountry.set(country, (byCountry.get(country) || 0) + 1);
    }

    console.log(`\n🌍 Leagues by country (top 10):`);
    const sortedCountries = Array.from(byCountry.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sortedCountries.forEach(([country, count]) => {
      console.log(`   ${country}: ${count} leagues`);
    });
  } catch (error) {
    console.error("\n❌ Provider getLeagues failed:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
      console.error(
        "   Stack:",
        error.stack?.split("\n").slice(0, 3).join("\n")
      );
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Test complete");
}

testLeaguesAPI().catch(console.error);
