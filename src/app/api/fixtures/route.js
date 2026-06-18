// Server-side proxy for football-data.org so the browser never calls it
// directly (avoids CORS) and the page can't crash on a failed fetch.
// Lives at: src/app/api/fixtures/route.js

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) {
    return Response.json({ error: "no-key" }, { status: 400 });
  }
  try {
    const type = searchParams.get("type") || "matches";
    let url;
    if (type === "standings") {
      url = `https://api.football-data.org/v4/competitions/WC/standings`;
    } else if (type === "scorers") {
      url = `https://api.football-data.org/v4/competitions/WC/scorers?limit=15`;
    } else if (type === "match") {
      const matchId = searchParams.get("matchId");
      if (!matchId) return Response.json({ error: "no-match-id" }, { status: 400 });
      url = `https://api.football-data.org/v4/matches/${encodeURIComponent(matchId)}`;
    } else {
      url = `https://api.football-data.org/v4/competitions/WC/matches`;
    }
    const r = await fetch(url, { headers: { "X-Auth-Token": key }, cache: "no-store" });
    if (!r.ok) {
      const error =
        r.status === 403 ? "Invalid API key — Deep Data tier needed for this. Check Admin."
        : r.status === 429 ? "Rate limited — wait a minute and try again."
        : r.status === 404 ? "World Cup data isn't live in the API yet — check back on matchdays."
        : `API error (${r.status}).`;
      return Response.json({ error }, { status: 200 });
    }
    const data = await r.json();
    if (type === "standings") return Response.json({ standings: data.standings || [] }, { status: 200 });
    if (type === "scorers") return Response.json({ scorers: data.scorers || [] }, { status: 200 });
    if (type === "match") return Response.json({ match: data }, { status: 200 });
    return Response.json({ matches: data.matches || [] }, { status: 200 });
  } catch (e) {
    return Response.json(
      { error: "Couldn't reach the fixtures service. Add matches manually for now." },
      { status: 200 }
    );
  }
}
