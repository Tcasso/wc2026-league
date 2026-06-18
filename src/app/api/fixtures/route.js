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
    const type = searchParams.get("type") === "standings" ? "standings" : "matches";
    const r = await fetch(
      `https://api.football-data.org/v4/competitions/WC/${type}`,
      { headers: { "X-Auth-Token": key }, cache: "no-store" }
    );
    if (!r.ok) {
      const error =
        r.status === 403 ? "Invalid API key — check it in Admin."
        : r.status === 429 ? "Rate limited — wait a minute and try again."
        : r.status === 404 ? "World Cup data isn't live in the API yet — check back on matchdays."
        : `API error (${r.status}).`;
      return Response.json({ error }, { status: 200 });
    }
    const data = await r.json();
    if (type === "standings") {
      return Response.json({ standings: data.standings || [] }, { status: 200 });
    }
    return Response.json({ matches: data.matches || [] }, { status: 200 });
  } catch (e) {
    return Response.json(
      { error: "Couldn't reach the fixtures service. Add matches manually for now." },
      { status: 200 }
    );
  }
}
