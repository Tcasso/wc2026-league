// Cron sender — runs on a schedule, sends the three alert types.
// Lives at: src/app/api/cron/route.js
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = "force-dynamic";
const STORE_KEY = "wc26-league-v1";

webpush.setVapidDetails(
  "mailto:league@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function loadGame() {
  const { data } = await supabase.from("leagues").select("data").eq("id", STORE_KEY).maybeSingle();
  return data?.data || null;
}
async function alreadySent(id) {
  const { data } = await supabase.from("push_sent").select("id").eq("id", id).maybeSingle();
  return !!data;
}
async function markSent(id) { await supabase.from("push_sent").upsert({ id }); }

async function sendToAll(title, body, url) {
  const { data: subs } = await supabase.from("push_subs").select("*");
  if (!subs?.length) return 0;
  let ok = 0;
  for (const row of subs) {
    try {
      await webpush.sendNotification(row.sub, JSON.stringify({ title, body, url: url || "/" }));
      ok++;
    } catch (e) {
      // 410/404 = subscription dead; clean it up
      if (e?.statusCode === 410 || e?.statusCode === 404) {
        await supabase.from("push_subs").delete().eq("id", row.id);
      }
    }
  }
  return ok;
}

export async function GET() {
  const game = await loadGame();
  if (!game) return Response.json({ ok: true, note: "no game" });
  const now = Date.now();
  const tById = Object.fromEntries((game.teams || []).map((t) => [t.id, t]));
  const results = { locks: 0, finals: 0, shame: 0 };

  // 1) PICKS LOCKING SOON — picks lock AT kickoff; remind within the last
  // hour before kickoff, not already alerted.
  for (const m of game.matches || []) {
    if (m.status === "void" || m.status === "finished") continue;
    const ko = new Date(m.kickoff).getTime();
    const minsToLock = (ko - now) / 60000;
    if (minsToLock > 0 && minsToLock <= 60) {
      const id = "lock:" + m.id;
      if (!(await alreadySent(id))) {
        const a = tById[m.teamA]?.name || "TBA", b = tById[m.teamB]?.name || "TBA";
        await sendToAll("⏰ Picks lock at kickoff!", `${a} v ${b} — get your pick in before the whistle.`, "/picks");
        await markSent(id);
        results.locks++;
      }
    }
  }

  // 2) RESULTS ARE IN — match just finished, not already alerted.
  for (const m of game.matches || []) {
    if (m.status !== "finished") continue;
    const id = "result:" + m.id + ":" + m.scoreA + "-" + m.scoreB;
    if (!(await alreadySent(id))) {
      const a = tById[m.teamA]?.name || "TBA", b = tById[m.teamB]?.name || "TBA";
      await sendToAll("🏁 Full time!", `${a} ${m.scoreA}–${m.scoreB} ${b} — check if you called it.`, "/board");
      await markSent(id);
      results.finals++;
    }
  }

  return Response.json({ ok: true, ...results });
}
