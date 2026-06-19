// Saves / removes a device's push subscription.
// Lives at: src/app/api/subscribe/route.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { sub, playerId, playerName } = body;
    if (!sub?.endpoint) return Response.json({ error: "no-sub" }, { status: 400 });
    const { error } = await supabase.from("push_subs").upsert({
      id: sub.endpoint,
      player_id: playerId || null,
      player_name: playerName || null,
      sub,
    });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 200 });
  }
}
