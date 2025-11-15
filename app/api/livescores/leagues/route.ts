import { NextRequest, NextResponse } from "next/server";
import { APIProviderManager } from "@/lib/api-providers/provider-manager";

const apiProviderManager = APIProviderManager.getInstance();
apiProviderManager.initialize();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse optional date range; default: last 14 days to next 60 days for broader coverage
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");
    const maxPagesParam = Number(searchParams.get("maxPages") || "8");
    const source = (searchParams.get("source") || "both").toLowerCase(); // provider | fixtures | both
    const withGroups =
      (searchParams.get("group") || "false").toLowerCase() === "true";

    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 14); // Last 14 days
    defaultFrom.setHours(0, 0, 0, 0);
    const defaultTo = new Date(now);
    defaultTo.setDate(defaultTo.getDate() + 60); // Next 60 days
    defaultTo.setHours(23, 59, 59, 999);

    const dateFrom = dateFromParam ? new Date(dateFromParam) : defaultFrom;
    const dateTo = dateToParam ? new Date(dateToParam) : defaultTo;

    // Collect from selected sources
    const leaguesMap = new Map<
      string,
      { id?: string; name: string; country?: string; logo?: string }
    >();

    // 1) Provider leagues (broad catalog)
    if (source === "provider" || source === "both") {
      try {
        console.log("[LeaguesAPI] Fetching provider leagues catalog");
        const providerLeagues = await apiProviderManager.getLeagues("football");
        console.log(
          `[LeaguesAPI] Provider returned ${providerLeagues.length} leagues`
        );
        for (const l of providerLeagues) {
          const key = `${l.name}::${l.country || ""}`;
          if (!leaguesMap.has(key)) {
            leaguesMap.set(key, { id: l.id, name: l.name, country: l.country });
          }
        }
      } catch (e) {
        console.error(
          "[LeaguesAPI] Provider leagues fetch failed, continuing with fixtures",
          e
        );
      }
    }

    // 2) Fixture-derived leagues (guaranteed active in date window)
    if (source === "fixtures" || source === "both") {
      console.log(
        `[LeaguesAPI] Scanning fixtures from ${dateFrom.toISOString()} to ${dateTo.toISOString()}`
      );
      const filters = { dateFrom, dateTo } as const;
      let page = 1;
      const limit = 200;
      let hasMore = true;
      let pagesFetched = 0;
      while (hasMore && pagesFetched < maxPagesParam) {
        const result = await apiProviderManager.getScheduledMatches(filters, {
          page,
          limit,
        });
        console.log(
          `[LeaguesAPI] Fixtures page ${page}: ${result.data.length} matches`
        );
        for (const m of result.data) {
          const key = `${m.league}::${m.leagueCountry || ""}`;
          if (!leaguesMap.has(key)) {
            leaguesMap.set(key, {
              name: m.league,
              country: m.leagueCountry,
              logo: m.leagueLogo,
            });
          }
        }
        hasMore = result.pagination.hasMore;
        page += 1;
        pagesFetched += 1;
      }
      console.log(
        `[LeaguesAPI] Fixtures scan complete: ${pagesFetched} pages fetched`
      );
    }

    const leagues = Array.from(leaguesMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    console.log(
      `[LeaguesAPI] Returning ${leagues.length} total unique leagues (source: ${source})`
    );

    // Optional grouping for UI convenience
    let groups:
      | Record<
          string,
          { id?: string; name: string; country?: string; logo?: string }[]
        >
      | undefined;
    if (withGroups) {
      const isTopEurope = (name: string, country?: string) => {
        const topCountries = new Set([
          "England",
          "Spain",
          "Italy",
          "Germany",
          "France",
        ]);
        const topByName = new Set([
          "Premier League",
          "La Liga",
          "Serie A",
          "Bundesliga",
          "Ligue 1",
        ]);
        return topCountries.has(country || "") || topByName.has(name);
      };
      const isInternational = (name: string) => {
        const tokens = [
          "Champions League",
          "Europa League",
          "Conference League",
          "UEFA Nations League",
          "World Cup",
          "Euro",
          "CAF",
          "AFC",
          "CONMEBOL",
          "CONCACAF",
        ];
        return tokens.some((t) => name.toLowerCase().includes(t.toLowerCase()));
      };

      const topEurope: typeof leagues = [];
      const international: typeof leagues = [];
      const domestic: typeof leagues = [];

      for (const l of leagues) {
        if (isInternational(l.name)) international.push(l);
        else if (isTopEurope(l.name, l.country)) topEurope.push(l);
        else domestic.push(l);
      }

      groups = { topEurope, international, domestic };
    }

    return NextResponse.json({
      success: true,
      data: { leagues, count: leagues.length, groups, source },
    });
  } catch (error) {
    console.error("[LeaguesAPI] GET error", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leagues" },
      { status: 500 }
    );
  }
}
