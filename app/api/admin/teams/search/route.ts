// Unified team search & create route
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

// -------- Types --------
type UISport = "FOOTBALL" | "BASKETBALL" | "TENNIS" | "CRICKET" | "OTHER";

interface ExternalTeamResult {
  name: string;
  shortName?: string | null;
  league?: string;
  country?: string;
  logoUrl?: string | null;
  externalId?: string;
  sport?: string; // uppercase UI sport value
}

// Map UI sport to DB canonical name
function toDbSportName(sport?: string): string {
  switch ((sport || "").toUpperCase()) {
    case "FOOTBALL":
      return "football";
    case "BASKETBALL":
      return "basketball";
    case "CRICKET":
      return "cricket";
    case "TENNIS":
      return "tennis";
    default:
      return "other";
  }
}

// -------- Provider: API-Football --------
interface APIFootballResponseItem {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string | null;
    logo: string | null;
  };
}

async function searchApiFootball(query: string): Promise<ExternalTeamResult[]> {
  // Prefer direct API-Sports key first, fallback to RapidAPI if available
  const directKey = process.env.API_FOOTBALL_KEY;
  if (directKey) {
    try {
      const url = `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(
        query
      )}`;
      const res = await fetch(url, {
        headers: { "x-apisports-key": directKey },
        cache: "no-store",
      });
      if (!res.ok) return [];
      const json = await res.json();
      const items: APIFootballResponseItem[] = json?.response || [];
      return items.map((i) => ({
        name: i.team.name,
        shortName: i.team.code,
        country: i.team.country || undefined,
        logoUrl: i.team.logo,
        externalId: `api-football-${i.team.id}`,
        sport: "FOOTBALL",
      }));
    } catch {
      return [];
    }
  }

  const rapidKey = process.env.RAPIDAPI_KEY;
  if (!rapidKey) return [];
  try {
    const url = `https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": rapidKey,
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items: APIFootballResponseItem[] = json?.response || [];
    return items.map((i) => ({
      name: i.team.name,
      shortName: i.team.code,
      country: i.team.country || undefined,
      logoUrl: i.team.logo,
      externalId: `api-football-${i.team.id}`,
      sport: "FOOTBALL",
    }));
  } catch {
    return [];
  }
}

// -------- Provider: TheSportsDB --------
interface SportsDbTeamRaw {
  idTeam?: string;
  strTeam?: string;
  strTeamShort?: string;
  strLeague?: string;
  strCountry?: string;
  strTeamBadge?: string;
  strSport?: string;
}

async function searchSportsDb(query: string): Promise<ExternalTeamResult[]> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    const raw: SportsDbTeamRaw[] = json?.teams || [];
    return raw.map((t) => ({
      name: t.strTeam || "",
      shortName: t.strTeamShort || undefined,
      league: t.strLeague || undefined,
      country: t.strCountry || undefined,
      logoUrl: t.strTeamBadge || undefined,
      externalId: t.idTeam ? `tsdb-${t.idTeam}` : undefined,
      sport: (t.strSport || "").toUpperCase() || undefined,
    }));
  } catch {
    return [];
  }
}

// -------- Provider: ESPN (subset leagues) --------
interface ESPNLeagueDef {
  sportPath: string;
  leaguePath: string;
  name: string;
}
const ESPN_LEAGUES: Record<string, ESPNLeagueDef[]> = {
  football: [
    { sportPath: "soccer", leaguePath: "eng.1", name: "Premier League" },
    { sportPath: "soccer", leaguePath: "esp.1", name: "La Liga" },
    { sportPath: "soccer", leaguePath: "ita.1", name: "Serie A" },
    { sportPath: "soccer", leaguePath: "ger.1", name: "Bundesliga" },
    { sportPath: "soccer", leaguePath: "fra.1", name: "Ligue 1" },
  ],
  basketball: [{ sportPath: "basketball", leaguePath: "nba", name: "NBA" }],
};

async function fetchEspnLeagueTeams(
  def: ESPNLeagueDef
): Promise<ExternalTeamResult[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${def.sportPath}/${def.leaguePath}/teams`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    const teams = json?.sports?.[0]?.leagues?.[0]?.teams || [];
    interface ESPNTeamWrapper {
      team?: {
        id: string;
        displayName?: string;
        name?: string;
        abbreviation?: string;
        shortDisplayName?: string;
        logos?: { href: string }[];
      };
    }
    const mapped: ExternalTeamResult[] = (teams as ESPNTeamWrapper[])
      .map((wrapper) => wrapper?.team)
      .filter((t): t is NonNullable<ESPNTeamWrapper["team"]> => !!t)
      .map((team) => ({
        name: team.displayName || team.name || "",
        shortName: team.abbreviation || team.shortDisplayName || undefined,
        league: def.name,
        logoUrl: team.logos?.[0]?.href || undefined,
        externalId: `espn-${team.id}`,
        sport: def.sportPath === "basketball" ? "BASKETBALL" : "FOOTBALL",
      }));
    return mapped.filter((t) => t.name);
  } catch {
    return [];
  }
}

async function searchEspn(sportDbName: string): Promise<ExternalTeamResult[]> {
  const leagues = ESPN_LEAGUES[sportDbName] || [];
  const all: ExternalTeamResult[] = [];
  await Promise.all(
    leagues.map(async (l) => {
      const teams = await fetchEspnLeagueTeams(l);
      all.push(...teams);
    })
  );
  return all;
}

// -------- Normalization & Dedup --------
function normalizeAndDedup(
  list: ExternalTeamResult[],
  sportDbName: string
): ExternalTeamResult[] {
  const seen = new Set<string>();
  const out: ExternalTeamResult[] = [];
  for (const t of list) {
    const key = `${(t.name || "").toLowerCase()}__${(
      t.league || ""
    ).toLowerCase()}`;
    if (seen.has(key) || !t.name) continue;
    seen.add(key);
    out.push({
      name: t.name,
      shortName: t.shortName || undefined,
      league: t.league || undefined,
      country: t.country || undefined,
      logoUrl: t.logoUrl || undefined,
      externalId: t.externalId || undefined,
      sport: t.sport || sportDbName.toUpperCase(),
    });
  }
  return out;
}

// -------- GET (search) --------
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error as NextResponse;

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("query") || "").trim();
    const uiSport = (searchParams.get("sport") || "FOOTBALL") as UISport;

    if (query.length < 2) {
      return NextResponse.json({ success: true, data: { teams: [] } });
    }

    const dbSportName = toDbSportName(uiSport);
    const providers: Promise<ExternalTeamResult[]>[] = [];
    if (dbSportName === "football") {
      providers.push(searchApiFootball(query));
      providers.push(searchSportsDb(query));
      providers.push(searchEspn("football"));
    } else if (dbSportName === "basketball") {
      providers.push(searchEspn("basketball"));
      providers.push(searchSportsDb(query));
    } else {
      providers.push(searchSportsDb(query));
    }

    const raw = (await Promise.all(providers)).flat();
    // Narrow results to those matching query text (case-insensitive)
    const qLower = query.toLowerCase();
    const filtered = raw.filter((t) => t.name.toLowerCase().includes(qLower));
    const normalized = normalizeAndDedup(filtered, dbSportName).slice(0, 20);

    return NextResponse.json({ success: true, data: { teams: normalized } });
  } catch (err) {
    console.error("/api/admin/teams/search GET error", err);
    return NextResponse.json(
      { success: false, error: "Failed to search teams" },
      { status: 500 }
    );
  }
}

// -------- POST (create) --------
interface CreateBody {
  name: string;
  logoUrl?: string | null;
  league?: string;
  country?: string;
  externalId?: string;
  sport?: string; // UI sport (FOOTBALL etc.)
  shortName?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireAdmin();
    if (error || !session) return error as NextResponse;
    const body: CreateBody = await req.json();

    const name = (body.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const dbSportName = toDbSportName(body.sport);

    // Ensure sport exists
    const sport = await prisma.sport.upsert({
      where: { name: dbSportName },
      update: {},
      create: {
        name: dbSportName,
        displayName: dbSportName.charAt(0).toUpperCase() + dbSportName.slice(1),
        isActive: true,
      },
    });

    // Try find existing by (name + sportId) or externalId
    const existing = await prisma.team.findFirst({
      where: {
        OR: [
          { name: { mode: "insensitive", equals: name }, sportId: sport.id },
          ...(body.externalId ? [{ externalId: body.externalId }] : []),
        ],
      },
    });

    let team;
    if (existing) {
      team = await prisma.team.update({
        where: { id: existing.id },
        data: {
          logoUrl: body.logoUrl ?? existing.logoUrl,
          league: body.league ?? existing.league,
          country: body.country ?? existing.country,
          externalId: body.externalId ?? existing.externalId,
        },
        include: { sport: true },
      });
    } else {
      team = await prisma.team.create({
        data: {
          name,
          shortName: body.shortName || name.substring(0, 3).toUpperCase(),
          sportId: sport.id,
          league: body.league,
          country: body.country,
          logoUrl: body.logoUrl || undefined,
          isActive: true,
          externalId: body.externalId,
          metadata: {},
        },
        include: { sport: true },
      });
    }

    // Audit log (best effort)
    try {
      await prisma.adminAuditLog.create({
        data: {
          userId: session.user.id,
          action: existing ? "update_team" : "create_team",
          resource: team.id,
          details: {
            teamName: team.name,
            sport: sport.displayName,
            source: "admin_search_create",
          },
        },
      });
    } catch {}

    return NextResponse.json({ success: true, data: { team } });
  } catch (err) {
    console.error("/api/admin/teams/search POST error", err);
    return NextResponse.json(
      { success: false, error: "Failed to create team" },
      { status: 500 }
    );
  }
}
