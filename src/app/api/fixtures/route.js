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
    const today = new Date().toISOString().slice(0, 10);
    const r = await fetch(
      `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${today}&dateTo=${today}`,
      { headers: { "X-Auth-Token": key }, cache: "no-store" }
    );
    if (!r.ok) {
      const error =
        r.status === 403 ? "Invalid API key — check it in Admin."
        : r.status === 429 ? "Rate limited — wait a minute and try again."
        : r.status === 404 ? "World Cup fixtures aren't live in the API yet — add them manually for now."
        : `API error (${r.status}).`;
      return Response.json({ error }, { status: 200 });
    }
    const data = await r.json();
    return Response.json({ matches: data.matches || [] }, { status: 200 });
  } catch (e) {
    return Response.json(
      { error: "Couldn't reach the fixtures service. Add matches manually for now." },
      { status: 200 }
    );
  }
}
