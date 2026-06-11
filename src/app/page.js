"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { createClient } from "@supabase/supabase-js";

/* ════════════════════════════════════════════════════════════════
   WORLD CUP 2026 — PRIVATE PREDICTION LEAGUE  (Vercel + Supabase)
   Daily picks · Underdog system · Final 8 draft · Live pot
   Shared league: all data lives in one Supabase row, so everyone
   sees the same game. Pick your player in the top bar.
   ════════════════════════════════════════════════════════════════ */

const STORE_KEY = "wc26-league-v1";

// Supabase: keys come from Vercel environment variables.
// Guarded so a bad/missing config shows an on-screen error instead of
// silently killing the whole page.
let supabase = null;
let supabaseInitError = "";
try {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
} catch (e) {
  supabaseInitError = "Database connection failed: " + (e?.message || "check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap');

:root{
  --pitch-green:#1a4a2e; --pitch-light:#2d6e47;
  --gold:#c9a84c; --gold-bright:#f0c93a;
  --night:#070d0a; --panel:#0f1f16; --panel-mid:#1c3427;
  --white:#ffffff; --muted:#8aaa96;
  --danger:#e63946; --sky:#4fc3f7;
}
*{box-sizing:border-box;margin:0;padding:0;}
.wc-app{
  min-height:100vh; color:var(--white); font-family:'Inter',sans-serif;
  background:
    radial-gradient(ellipse 60% 40% at 0% 0%, rgba(240,201,58,.10), transparent 60%),
    radial-gradient(ellipse 60% 40% at 100% 0%, rgba(240,201,58,.08), transparent 60%),
    repeating-linear-gradient(115deg, var(--night) 0px, var(--night) 90px, #0a130d 90px, #0a130d 180px);
  padding-bottom:90px;
}
.bebas{font-family:'Bebas Neue',sans-serif;letter-spacing:.06em;}
.barlow{font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;letter-spacing:.12em;}
.muted{color:var(--muted);}
.gold{color:var(--gold-bright);}

/* navbar */
.nav{display:flex;align-items:center;gap:12px;
  padding:10px 16px;background:rgba(7,13,10,.92);backdrop-filter:blur(8px);
  border-bottom:1px solid rgba(201,168,76,.25);}
.nav-title{font-size:22px;line-height:1;color:var(--white);}
.nav-title .grp{color:var(--gold-bright);}
.pot-badge{margin-left:auto;display:flex;align-items:center;gap:6px;background:linear-gradient(135deg,#2a2008,#1c3427);
  border:1px solid var(--gold);border-radius:999px;padding:5px 14px;font-family:'Bebas Neue';font-size:18px;color:var(--gold-bright);}
.who{background:var(--panel-mid);color:var(--white);border:1px solid rgba(138,170,150,.35);
  border-radius:8px;padding:6px 10px;font-family:'Barlow Condensed';font-size:15px;letter-spacing:.08em;text-transform:uppercase;}

/* tabs */
.tabs{position:fixed;bottom:0;left:0;right:0;z-index:50;display:flex;justify-content:space-around;
  background:rgba(7,13,10,.96);border-top:1px solid rgba(201,168,76,.3);padding:6px 4px calc(6px + env(safe-area-inset-bottom));}
.tab{flex:1;max-width:110px;background:none;border:none;color:var(--muted);cursor:pointer;
  font-family:'Barlow Condensed';font-size:12px;letter-spacing:.1em;text-transform:uppercase;
  display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px;border-radius:8px;}
.tab .ic{font-size:18px;}
.tab.on{color:var(--gold-bright);}
.tab:focus-visible{outline:2px solid var(--sky);}

.page{max-width:880px;margin:0 auto;padding:20px 16px;}
.h-sec{font-family:'Bebas Neue';font-size:26px;letter-spacing:.08em;margin:26px 0 12px;
  display:flex;align-items:center;gap:10px;}
.h-sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(201,168,76,.5),transparent);}

/* hero */
.hero{position:relative;text-align:center;padding:46px 16px 38px;border-radius:18px;overflow:hidden;
  background:
    radial-gradient(ellipse 70% 60% at 15% -10%, rgba(240,201,58,.22), transparent 55%),
    radial-gradient(ellipse 70% 60% at 85% -10%, rgba(240,201,58,.18), transparent 55%),
    repeating-linear-gradient(115deg, var(--pitch-green) 0 70px, var(--pitch-light) 70px 140px);
  border:1px solid rgba(201,168,76,.35);}
.hero h1{font-family:'Bebas Neue';font-size:clamp(46px,10vw,86px);line-height:.95;text-shadow:0 4px 24px rgba(0,0,0,.6);}
.hero .sub{font-family:'Barlow Condensed';letter-spacing:.3em;text-transform:uppercase;color:var(--gold-bright);font-size:14px;margin-top:4px;}
.hero .pot{margin-top:18px;display:inline-flex;align-items:center;gap:10px;background:rgba(7,13,10,.75);
  border:1px solid var(--gold);border-radius:12px;padding:10px 22px;}
.hero .pot .amt{font-family:'Bebas Neue';font-size:34px;color:var(--gold-bright);}

/* cards & panels */
.panel{background:var(--panel);border:1px solid rgba(138,170,150,.18);border-radius:14px;padding:16px;}
.btn{cursor:pointer;border:none;border-radius:9px;font-family:'Barlow Condensed';text-transform:uppercase;
  letter-spacing:.12em;font-size:14px;padding:10px 18px;transition:transform .12s, box-shadow .12s;}
.btn:active{transform:scale(.97);}
.btn-gold{background:linear-gradient(135deg,var(--gold),var(--gold-bright));color:#1a1405;font-weight:700;}
.btn-gold:hover{box-shadow:0 0 18px rgba(240,201,58,.45);}
.btn-ghost{background:var(--panel-mid);color:var(--white);border:1px solid rgba(138,170,150,.3);}
.btn-danger{background:var(--danger);color:#fff;}
.btn:disabled{opacity:.4;cursor:not-allowed;}
input,select{background:#0a1810;color:var(--white);border:1px solid rgba(138,170,150,.35);border-radius:8px;padding:9px 10px;font-family:'Inter';font-size:14px;}
input:focus,select:focus,.btn:focus-visible{outline:2px solid var(--sky);outline-offset:1px;}

/* match scoreboard card */
.match{background:linear-gradient(180deg,#0c1b12,#091309);border:1px solid rgba(138,170,150,.22);
  border-radius:14px;padding:14px;margin-bottom:14px;position:relative;}
.match .meta{display:flex;justify-content:space-between;align-items:center;font-family:'Barlow Condensed';
  font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;}
.live{display:inline-flex;align-items:center;gap:6px;color:var(--sky);font-weight:700;}
.live .dot{width:8px;height:8px;border-radius:50%;background:var(--danger);animation:pulse 1.1s infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.75)}}
.face{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;}
.team{display:flex;flex-direction:column;align-items:center;gap:4px;}
.team .fl{font-size:34px;line-height:1;}
.team .nm{font-family:'Bebas Neue';font-size:20px;letter-spacing:.06em;text-align:center;}
.score{font-family:'Bebas Neue';font-size:40px;color:var(--gold-bright);background:#050a06;
  border:1px solid rgba(201,168,76,.4);border-radius:10px;padding:2px 14px;min-width:96px;text-align:center;
  text-shadow:0 0 12px rgba(240,201,58,.5);}
.vs{font-family:'Bebas Neue';font-size:22px;color:var(--muted);}
.pickrow{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;}
.pickbtn{padding:10px 4px;border-radius:9px;border:1px solid rgba(138,170,150,.3);background:var(--panel-mid);
  color:var(--white);font-family:'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;font-size:13px;cursor:pointer;transition:all .12s;}
.pickbtn:hover{border-color:var(--gold);}
.pickbtn.sel{background:linear-gradient(135deg,var(--gold),var(--gold-bright));color:#1a1405;font-weight:700;box-shadow:0 0 14px rgba(240,201,58,.35);}
.pickbtn.win{background:rgba(45,110,71,.55);border-color:#3fae6c;color:#bdf3d2;}
.pickbtn.lose{background:rgba(230,57,70,.18);border-color:rgba(230,57,70,.5);color:#f1a0a7;}
.scoreline{display:flex;align-items:center;gap:8px;justify-content:center;margin-top:10px;}
.scoreline input{width:54px;text-align:center;font-family:'Bebas Neue';font-size:20px;}
.lockline{margin-top:10px;text-align:center;font-family:'Barlow Condensed';letter-spacing:.12em;font-size:13px;color:var(--gold-bright);text-transform:uppercase;}
.others{margin-top:12px;border-top:1px dashed rgba(138,170,150,.25);padding-top:10px;display:flex;flex-wrap:wrap;gap:6px;}
.chip{display:inline-flex;align-items:center;gap:5px;background:var(--panel-mid);border-radius:999px;
  padding:3px 10px;font-size:12px;border:1px solid rgba(138,170,150,.2);}
.chip.ok{border-color:#3fae6c;color:#bdf3d2;}
.chip.bad{border-color:rgba(230,57,70,.6);color:#f1a0a7;}

/* sticker player cards */
.sticker{position:relative;overflow:hidden;background:linear-gradient(160deg,#13261b,#0a150e);
  border:1px solid rgba(201,168,76,.45);border-radius:14px;padding:14px;}
.sticker::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .2s;
  background:radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(240,201,58,.28), rgba(79,195,247,.12) 35%, transparent 70%);}
.sticker:hover::before{opacity:1;}
.sticker .strip{position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,var(--gold),var(--pitch-light),var(--gold));}
.jersey{position:absolute;top:10px;right:12px;font-family:'Bebas Neue';font-size:30px;color:rgba(240,201,58,.35);}

/* leaderboard */
.lb-wrap{position:relative;}
.lb-watermark{position:absolute;inset:0;display:flex;justify-content:center;align-items:center;pointer-events:none;opacity:.08;}
.lb-row{display:grid;grid-template-columns:34px 1fr 52px 52px 52px 64px;gap:6px;align-items:center;
  background:var(--panel);border:1px solid rgba(138,170,150,.15);border-radius:10px;padding:10px 12px;margin-bottom:8px;
  cursor:pointer;transition:border-color .15s, transform .25s;}
.lb-row:hover{border-color:rgba(201,168,76,.5);}
.lb-row .rank{font-family:'Bebas Neue';font-size:22px;color:var(--gold-bright);}
.lb-row .tot{font-family:'Bebas Neue';font-size:24px;text-align:right;color:var(--gold-bright);}
.lb-head{display:grid;grid-template-columns:34px 1fr 52px 52px 52px 64px;gap:6px;padding:0 12px 6px;
  font-family:'Barlow Condensed';font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);}
.num{text-align:right;font-variant-numeric:tabular-nums;}
.subtab{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
.subtab button{flex:0 0 auto;}

/* underdog */
.ud-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;}
.ud-card{background:var(--panel);border:1px solid rgba(138,170,150,.2);border-radius:12px;padding:12px;text-align:center;position:relative;}
.ud-card .fl{font-size:32px;}
.ud-card .nm{font-family:'Bebas Neue';font-size:16px;margin-top:4px;}
.ud-card.taken{opacity:.65;border-style:dashed;}
.stamp{display:inline-block;font-family:'Barlow Condensed';font-weight:700;letter-spacing:.16em;color:var(--danger);
  border:2px solid var(--danger);border-radius:4px;padding:1px 8px;font-size:11px;transform:rotate(-4deg);}
.timeline{margin-top:12px;}
.tl-item{display:flex;gap:12px;align-items:flex-start;padding:6px 0;}
.tl-dot{width:14px;height:14px;border-radius:50%;border:2px solid var(--muted);margin-top:2px;flex:0 0 auto;}
.tl-item.hit .tl-dot{background:var(--gold-bright);border-color:var(--gold-bright);box-shadow:0 0 10px rgba(240,201,58,.6);}
.tl-item.hit .tl-lab{color:var(--white);}
.tl-lab{font-family:'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;font-size:14px;color:var(--muted);}

/* prizes */
.prize-row{display:flex;align-items:center;gap:12px;background:var(--panel);border:1px solid rgba(138,170,150,.18);
  border-radius:12px;padding:12px 14px;margin-bottom:10px;}
.prize-row .pct{font-family:'Bebas Neue';font-size:24px;color:var(--gold-bright);min-width:54px;}
.prize-row .amt{margin-left:auto;font-family:'Bebas Neue';font-size:26px;color:var(--gold-bright);text-shadow:0 0 10px rgba(240,201,58,.4);}

/* confetti */
.confetti{position:fixed;inset:0;pointer-events:none;z-index:99;overflow:hidden;}
.cpiece{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;animation:fall 2.4s ease-in forwards;}
@keyframes fall{0%{transform:translateY(-10px) rotate(0)}100%{transform:translateY(105vh) rotate(720deg);opacity:.2}}

.banner{background:linear-gradient(90deg,rgba(201,168,76,.2),rgba(79,195,247,.12));border:1px solid var(--gold);
  border-radius:12px;padding:12px 16px;font-family:'Bebas Neue';font-size:20px;letter-spacing:.08em;margin-bottom:16px;text-align:center;}
.note{font-size:13px;color:var(--muted);margin-top:8px;line-height:1.5;}
.fixstrip{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px;}
.fixstrip>*{scroll-snap-align:start;min-width:260px;flex:0 0 auto;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media(max-width:560px){.grid2{grid-template-columns:1fr;}}
/* ── casino juice ── */
@keyframes shineSweep{0%{transform:translateX(-160%) skewX(-20deg)}100%{transform:translateX(260%) skewX(-20deg)}}
.shine{position:relative;overflow:hidden;}
.shine::after{content:"";position:absolute;top:0;bottom:0;left:0;width:45%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent);transform:translateX(-160%) skewX(-20deg);animation:shineSweep 3.6s ease-in-out infinite;pointer-events:none;}
@keyframes goldPulse{0%,100%{text-shadow:0 0 8px rgba(240,201,58,.5)}50%{text-shadow:0 0 22px rgba(240,201,58,.95),0 0 44px rgba(240,201,58,.35)}}
.jackpot{animation:goldPulse 1.8s ease-in-out infinite;}
@keyframes btnGlow{0%,100%{box-shadow:0 0 8px rgba(240,201,58,.3)}50%{box-shadow:0 0 20px rgba(240,201,58,.7)}}
.btn-gold{animation:btnGlow 2.4s ease-in-out infinite;}
.pickbtn:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 4px 16px rgba(240,201,58,.25);}
.pickbtn.sel{animation:selPop .3s ease;}
@keyframes selPop{0%{transform:scale(.9)}60%{transform:scale(1.07)}100%{transform:scale(1)}}
.pickbtn.win{animation:winFlash 1.4s ease;}
@keyframes winFlash{0%{box-shadow:0 0 0 rgba(63,174,108,0)}40%{box-shadow:0 0 26px rgba(63,174,108,.95)}100%{box-shadow:0 0 8px rgba(63,174,108,.35)}}
.lb-row.top1{border-color:var(--gold);animation:goldBorder 2.2s ease-in-out infinite;}
@keyframes goldBorder{0%,100%{box-shadow:0 0 6px rgba(240,201,58,.2)}50%{box-shadow:0 0 18px rgba(240,201,58,.55)}}
.live .dot{box-shadow:0 0 12px rgba(230,57,70,.95);}
.toast{position:fixed;top:62px;left:50%;transform:translateX(-50%);z-index:200;background:linear-gradient(135deg,#2a2008,#1c3427);border:1px solid var(--gold-bright);color:var(--gold-bright);font-family:'Bebas Neue';font-size:22px;letter-spacing:.08em;padding:12px 28px;border-radius:12px;box-shadow:0 0 32px rgba(240,201,58,.55);animation:toastIn .4s ease, goldPulse 1.5s ease-in-out infinite;}
@keyframes toastIn{0%{opacity:0;transform:translateX(-50%) translateY(-18px) scale(.9)}100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
/* ── stadium atmosphere (always-on) ── */
.topwrap{position:sticky;top:0;z-index:50;}
.ticker{background:#050a06;border-bottom:1px solid rgba(201,168,76,.35);overflow:hidden;white-space:nowrap;}
.ticker-track{display:inline-flex;animation:tickerScroll 35s linear infinite;}
.ticker-track span{font-family:'Barlow Condensed';letter-spacing:.16em;font-size:13px;color:var(--gold-bright);padding:5px 0;text-transform:uppercase;}
@keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.beams{position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse 55% 38% at 18% 0%,rgba(240,201,58,.13),transparent 60%),radial-gradient(ellipse 55% 38% at 82% 0%,rgba(79,195,247,.07),transparent 60%);animation:beamPan 14s ease-in-out infinite alternate;}
@keyframes beamPan{0%{transform:translateX(-4%) }100%{transform:translateX(4%)}}
.particles{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;}
.particles i{position:absolute;bottom:-8px;border-radius:50%;background:var(--gold-bright);opacity:0;animation:floatUp linear infinite;}
@keyframes floatUp{0%{transform:translateY(0) translateX(0);opacity:0}8%{opacity:.65}85%{opacity:.3}100%{transform:translateY(-105vh) translateX(24px);opacity:0}}
.page{position:relative;z-index:1;animation:pageIn .35s ease;}
@keyframes pageIn{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
.hero h1{background:linear-gradient(100deg,#fff 25%,var(--gold-bright) 50%,#fff 75%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;animation:titleSheen 4.5s linear infinite;}
@keyframes titleSheen{0%{background-position:200% center}100%{background-position:0% center}}
.live-card{border-color:rgba(230,57,70,.55) !important;animation:liveGlow 1.6s ease-in-out infinite;}
@keyframes liveGlow{0%,100%{box-shadow:0 0 6px rgba(230,57,70,.25)}50%{box-shadow:0 0 22px rgba(230,57,70,.6)}}
.lb-row{animation:rowIn .45s ease both;}
@keyframes rowIn{0%{opacity:0;transform:translateX(-14px)}100%{opacity:1;transform:translateX(0)}}
.tab.on .ic{display:inline-block;animation:icBounce .5s ease;}
@keyframes icBounce{0%{transform:translateY(0)}40%{transform:translateY(-6px)}70%{transform:translateY(2px)}100%{transform:translateY(0)}}
.nav-trophy{display:inline-block;animation:trophySway 3.5s ease-in-out infinite;}
@keyframes trophySway{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
@media (prefers-reduced-motion: reduce){*{animation:none !important;transition:none !important;}}
`;

/* ── scoring tables ─────────────────────────────────────────── */
const STAGES = ["GROUP", "R32", "R16", "QF", "SF", "FINAL"];
const STAGE_LABEL = { GROUP: "Group Stage", R32: "Round of 32", R16: "Round of 16", QF: "Quarter-Final", SF: "Semi-Final", FINAL: "Final" };
const DAILY_PTS = { GROUP: [3, 2], R32: [5, 3], R16: [5, 3], QF: [8, 4], SF: [12, 5], FINAL: [15, 5] };
const UD_MILESTONES = [
  ["qualified", "Qualified from group", 10],
  ["r16", "Reached Round of 16", 15],
  ["qf", "Reached Quarter-Finals", 25],
  ["sf", "Reached Semi-Finals", 40],
  ["final", "Reached the Final", 55],
  ["won", "WON THE TOURNAMENT", 75],
];
const UD_VALUE = Object.fromEntries(UD_MILESTONES.map(([k, , v]) => [k, v]));
const UD_RANK = { none: 0, out: 0, qualified: 1, r16: 2, qf: 3, sf: 4, final: 5, won: 6 };
const F8_VALUE = { qf: 10, sf: 20, final: 35, won: 50 };
const PRIZES = [
  ["champion", "🥇", "Overall Champion", 0.40, "Highest total score"],
  ["group", "📊", "Group Stage", 0.15, "Most group-stage daily pts"],
  ["knockout", "⚔️", "Knockout", 0.20, "Knockout daily + Final 8 pts"],
  ["last", "🪦", "Last Place", 0.10, "Lowest total score"],
  ["underdog", "🐉", "Underdog", 0.15, "Underdog went furthest"],
];

/* Official WC2026 teams — real groups A–L. eligible = outside FIFA top 12 at tournament start (admin can toggle). */
const WC_TEAMS = {
  MEX:["Mexico","🇲🇽","A",1], RSA:["South Africa","🇿🇦","A",1], KOR:["South Korea","🇰🇷","A",1], CZE:["Czechia","🇨🇿","A",1],
  CAN:["Canada","🇨🇦","B",1], BIH:["Bosnia & Herzegovina","🇧🇦","B",1], QAT:["Qatar","🇶🇦","B",1], SUI:["Switzerland","🇨🇭","B",1],
  BRA:["Brazil","🇧🇷","C",0], MAR:["Morocco","🇲🇦","C",0], HAI:["Haiti","🇭🇹","C",1], SCO:["Scotland","🏴󠁧󠁢󠁳󠁣󠁴󠁿","C",1],
  USA:["USA","🇺🇸","D",1], PAR:["Paraguay","🇵🇾","D",1], AUS:["Australia","🇦🇺","D",1], TUR:["Türkiye","🇹🇷","D",1],
  GER:["Germany","🇩🇪","E",0], CUW:["Curaçao","🇨🇼","E",1], CIV:["Ivory Coast","🇨🇮","E",1], ECU:["Ecuador","🇪🇨","E",1],
  NED:["Netherlands","🇳🇱","F",0], JPN:["Japan","🇯🇵","F",1], SWE:["Sweden","🇸🇪","F",1], TUN:["Tunisia","🇹🇳","F",1],
  BEL:["Belgium","🇧🇪","G",0], EGY:["Egypt","🇪🇬","G",1], IRN:["Iran","🇮🇷","G",1], NZL:["New Zealand","🇳🇿","G",1],
  ESP:["Spain","🇪🇸","H",0], CPV:["Cape Verde","🇨🇻","H",1], KSA:["Saudi Arabia","🇸🇦","H",1], URU:["Uruguay","🇺🇾","H",1],
  FRA:["France","🇫🇷","I",0], SEN:["Senegal","🇸🇳","I",1], IRQ:["Iraq","🇮🇶","I",1], NOR:["Norway","🇳🇴","I",1],
  ARG:["Argentina","🇦🇷","J",0], ALG:["Algeria","🇩🇿","J",1], AUT:["Austria","🇦🇹","J",1], JOR:["Jordan","🇯🇴","J",1],
  POR:["Portugal","🇵🇹","K",0], COD:["DR Congo","🇨🇩","K",1], UZB:["Uzbekistan","🇺🇿","K",1], COL:["Colombia","🇨🇴","K",0],
  ENG:["England","🏴󠁧󠁢󠁥󠁮󠁧󠁿","L",0], CRO:["Croatia","🇭🇷","L",0], GHA:["Ghana","🇬🇭","L",1], PAN:["Panama","🇵🇦","L",1],
};
/* Official group-stage fixtures (June 11–27) — kickoffs in UTC, rendered in each viewer's local time. */
const WC_FIXTURES = [
  ["MEX","RSA","2026-06-11T19:00Z"],["KOR","CZE","2026-06-12T02:00Z"],
  ["CAN","BIH","2026-06-12T19:00Z"],["USA","PAR","2026-06-13T01:00Z"],
  ["QAT","SUI","2026-06-13T19:00Z"],["BRA","MAR","2026-06-13T22:00Z"],["HAI","SCO","2026-06-14T01:00Z"],["AUS","TUR","2026-06-14T04:00Z"],
  ["GER","CUW","2026-06-14T17:00Z"],["NED","JPN","2026-06-14T20:00Z"],["CIV","ECU","2026-06-14T23:00Z"],["SWE","TUN","2026-06-15T02:00Z"],
  ["ESP","CPV","2026-06-15T16:00Z"],["BEL","EGY","2026-06-15T19:00Z"],["KSA","URU","2026-06-15T22:00Z"],["IRN","NZL","2026-06-16T01:00Z"],
  ["FRA","SEN","2026-06-16T19:00Z"],["IRQ","NOR","2026-06-16T22:00Z"],["ARG","ALG","2026-06-17T01:00Z"],["AUT","JOR","2026-06-17T04:00Z"],
  ["POR","COD","2026-06-17T17:00Z"],["ENG","CRO","2026-06-17T20:00Z"],["GHA","PAN","2026-06-17T23:00Z"],["UZB","COL","2026-06-18T02:00Z"],
  ["CZE","RSA","2026-06-18T16:00Z"],["SUI","BIH","2026-06-18T19:00Z"],["CAN","QAT","2026-06-18T22:00Z"],["MEX","KOR","2026-06-19T01:00Z"],
  ["USA","AUS","2026-06-19T19:00Z"],["SCO","MAR","2026-06-19T22:00Z"],["BRA","HAI","2026-06-20T00:30Z"],["TUR","PAR","2026-06-20T03:00Z"],
  ["NED","SWE","2026-06-20T17:00Z"],["GER","CIV","2026-06-20T20:00Z"],["ECU","CUW","2026-06-21T00:00Z"],["TUN","JPN","2026-06-21T04:00Z"],
  ["ESP","KSA","2026-06-21T16:00Z"],["BEL","IRN","2026-06-21T19:00Z"],["URU","CPV","2026-06-21T22:00Z"],["NZL","EGY","2026-06-22T01:00Z"],
  ["ARG","AUT","2026-06-22T17:00Z"],["FRA","IRQ","2026-06-22T21:00Z"],["NOR","SEN","2026-06-23T00:00Z"],["JOR","ALG","2026-06-23T03:00Z"],
  ["POR","UZB","2026-06-23T17:00Z"],["ENG","GHA","2026-06-23T20:00Z"],["PAN","CRO","2026-06-23T23:00Z"],["COL","COD","2026-06-24T02:00Z"],
  ["SUI","CAN","2026-06-24T19:00Z"],["BIH","QAT","2026-06-24T19:00Z"],["SCO","BRA","2026-06-24T22:00Z"],["MAR","HAI","2026-06-24T22:00Z"],
  ["CZE","MEX","2026-06-25T01:00Z"],["RSA","KOR","2026-06-25T01:00Z"],
  ["ECU","GER","2026-06-25T20:00Z"],["CUW","CIV","2026-06-25T20:00Z"],["JPN","SWE","2026-06-25T23:00Z"],["TUN","NED","2026-06-25T23:00Z"],
  ["TUR","USA","2026-06-26T02:00Z"],["PAR","AUS","2026-06-26T02:00Z"],
  ["NOR","FRA","2026-06-26T19:00Z"],["SEN","IRQ","2026-06-26T19:00Z"],["CPV","KSA","2026-06-27T00:00Z"],["URU","ESP","2026-06-27T00:00Z"],
  ["EGY","IRN","2026-06-27T03:00Z"],["NZL","BEL","2026-06-27T03:00Z"],
  ["PAN","ENG","2026-06-27T21:00Z"],["CRO","GHA","2026-06-27T21:00Z"],["COL","POR","2026-06-27T23:30Z"],["COD","UZB","2026-06-27T23:30Z"],
  ["ALG","AUT","2026-06-28T02:00Z"],["JOR","ARG","2026-06-28T02:00Z"],
];

const DEFAULT_GAME = {
  config: { groupName: "PRIVATE LEAGUE", buyIn: 20, adminPass: "wc2026", final8Open: false, currency: "S$" },
  players: [], teams: [], matches: [], picks: {}, underdog: {}, final8: {},
};

const uid = () => Math.random().toString(36).slice(2, 9);
// Kickoffs are stored in UTC; this renders them in the viewer's own timezone.
const fmtTime = (iso) => new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
const money = (cur, n) => `${cur}${(Math.round(n * 100) / 100).toFixed(2)}`;
const stageTag = (m, tById) => m.stage === "GROUP" && tById?.[m.teamA]?.group ? `Group ${tById[m.teamA].group}` : STAGE_LABEL[m.stage];

/* ── storage (Supabase: one shared row holds the whole league) ──
   All writes are serialized through a queue so they can never
   overwrite each other. A failed read NEVER results in a write
   (that's what was wiping data). */
let writeChain = Promise.resolve();
let lastWriteAt = 0;
function enqueueWrite(job) {
  const p = writeChain.then(job, job);
  writeChain = p.catch(() => {});
  return p;
}
// Strict load: returns null on failure so callers can abort instead of
// accidentally writing an empty league over the real one. The failure
// reason is kept so the UI can display it.
let lastLoadError = "";
async function loadGameStrict() {
  if (!supabase) { lastLoadError = supabaseInitError || "No database client."; return null; }
  try {
    const { data, error } = await supabase
      .from("leagues").select("data").eq("id", STORE_KEY).maybeSingle();
    if (error) { lastLoadError = "Database error: " + (error.message || JSON.stringify(error)); return null; }
    lastLoadError = "";
    if (data && data.data) return { ...DEFAULT_GAME, ...data.data };
    // Row genuinely doesn't exist yet (fresh league) — safe to start clean.
    return JSON.parse(JSON.stringify(DEFAULT_GAME));
  } catch (e) { lastLoadError = "Can't reach Supabase: " + (e?.message || "network failure"); return null; }
}
async function persist(game) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("leagues").upsert({ id: STORE_KEY, data: game });
    if (error) throw error;
    return true;
  } catch (e) { console.error("Save failed", e); return false; }
}

/* ── live fixtures (football-data.org, free tier) ────────────── */
const FLAGS = {
  "Argentina":"🇦🇷","France":"🇫🇷","Spain":"🇪🇸","England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Brazil":"🇧🇷","Portugal":"🇵🇹",
  "Netherlands":"🇳🇱","Belgium":"🇧🇪","Germany":"🇩🇪","Croatia":"🇭🇷","Italy":"🇮🇹","Morocco":"🇲🇦",
  "USA":"🇺🇸","United States":"🇺🇸","Mexico":"🇲🇽","Canada":"🇨🇦","Japan":"🇯🇵","South Korea":"🇰🇷",
  "Korea Republic":"🇰🇷","Australia":"🇦🇺","Senegal":"🇸🇳","Ecuador":"🇪🇨","Uruguay":"🇺🇾","Colombia":"🇨🇴",
  "Switzerland":"🇨🇭","Denmark":"🇩🇰","Poland":"🇵🇱","Serbia":"🇷🇸","Ghana":"🇬🇭","Cameroon":"🇨🇲",
  "Tunisia":"🇹🇳","Saudi Arabia":"🇸🇦","Qatar":"🇶🇦","Norway":"🇳🇴","Sweden":"🇸🇪","Turkey":"🇹🇷",
  "Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Wales":"🏴󠁧󠁢󠁷󠁬󠁳󠁿","Paraguay":"🇵🇾","Peru":"🇵🇪","Costa Rica":"🇨🇷","Panama":"🇵🇦",
  "New Zealand":"🇳🇿","Ivory Coast":"🇨🇮","Nigeria":"🇳🇬","Algeria":"🇩🇿","Egypt":"🇪🇬","Cape Verde":"🇨🇻",
  "Jordan":"🇯🇴","Uzbekistan":"🇺🇿","IR Iran":"🇮🇷","Iran":"🇮🇷","Ukraine":"🇺🇦","Austria":"🇦🇹",
};
const flagFor = (name) => FLAGS[name] || "🏴";
function apiStage(s) {
  if (!s) return "GROUP";
  s = String(s).toUpperCase();
  if (s.includes("ROUND_OF_16")) return "R16";
  if (s.includes("QUARTER")) return "QF";
  if (s.includes("SEMI")) return "SF";
  if (s.includes("FINAL")) return "FINAL";
  return "GROUP";
}
// Pure fetch: gets today's fixtures via our server route. No writes here —
// merging into the league happens through the same safe queue as all edits.
async function fetchFixtureData(apiKey) {
  if (!apiKey) return { ok: false, error: "no-key" };
  try {
    const r = await fetch(`/api/fixtures?key=${encodeURIComponent(apiKey)}`);
    const payload = await r.json().catch(() => ({}));
    if (!r.ok || payload.error) {
      return { ok: false, error: payload.error || `API error (${r.status}).` };
    }
    return { ok: true, matches: payload.matches || [], error: "" };
  } catch (e) {
    return { ok: false, error: "Couldn't reach the fixtures service. Add matches manually for now." };
  }
}
// Merges fetched fixtures into the league object (mutates g in place).
function mergeFixtures(g, apiMatches) {
  for (const am of apiMatches) {
    // Knockout games with undecided teams come through blank — skip them.
    // They merge in automatically once the real teams are known.
    if (!am.homeTeam?.name || !am.awayTeam?.name) continue;
    const nameA = am.homeTeam.name, nameB = am.awayTeam.name;
    let tA = g.teams.find((t) => t.name === nameA);
    if (!tA) { tA = { id: uid(), name: nameA, flag: flagFor(nameA), eligible: true, furthest: "none", wonAll3: false }; g.teams.push(tA); }
    let tB = g.teams.find((t) => t.name === nameB);
    if (!tB) { tB = { id: uid(), name: nameB, flag: flagFor(nameB), eligible: true, furthest: "none", wonAll3: false }; g.teams.push(tB); }
    const stage = apiStage(am.stage);
    const status = am.status === "FINISHED" ? "finished"
      : (am.status === "IN_PLAY" || am.status === "PAUSED") ? "live" : "scheduled";
    const existing = g.matches.find((x) => x.apiId === String(am.id));
    if (existing) {
      existing.status = status === "live" ? "scheduled" : status;
      existing.live = status === "live";
      // carry the score for live AND finished matches (live = running score)
      if ((status === "finished" || status === "live") && am.score?.fullTime) {
        if (am.score.fullTime.home != null) existing.scoreA = am.score.fullTime.home;
        if (am.score.fullTime.away != null) existing.scoreB = am.score.fullTime.away;
      }
    } else {
      g.matches.push({ id: uid(), apiId: String(am.id), teamA: tA.id, teamB: tB.id,
        kickoff: am.utcDate, stage, status: status === "live" ? "scheduled" : status, live: status === "live",
        scoreA: am.score?.fullTime?.home ?? null, scoreB: am.score?.fullTime?.away ?? null });
    }
  }
  // Clean up any "TBA" placeholders created by earlier versions.
  const tbaIds = new Set(g.teams.filter((t) => t.name === "TBA").map((t) => t.id));
  if (tbaIds.size > 0) {
    g.matches = g.matches.filter((m) => !tbaIds.has(m.teamA) && !tbaIds.has(m.teamB));
    g.teams = g.teams.filter((t) => !tbaIds.has(t.id));
  }
}

/* ── scoring engine ─────────────────────────────────────────── */
function matchResult(m) {
  if (m.status !== "finished") return null;
  return m.scoreA > m.scoreB ? "A" : m.scoreA < m.scoreB ? "B" : "D";
}
function pickPoints(m, pick) {
  if (!pick || m.status !== "finished") return 0;
  const res = matchResult(m);
  const [base] = DAILY_PTS[m.stage] || [3];
  if (pick.pred !== res) return 0;
  return base; // flat points for a correct result — no scoreline bonus
}
function teamUdPts(t) { return (t.wonAll3 ? 5 : 0) + (UD_VALUE[t.furthest] || 0); }
function teamGroupUdPts(t) { return (t.wonAll3 ? 5 : 0) + (UD_RANK[t.furthest] >= 1 ? 10 : 0); }

function computeStandings(game) {
  const { players, matches, picks, underdog, final8, teams } = game;
  const tById = Object.fromEntries(teams.map((t) => [t.id, t]));
  return players.map((p) => {
    let daily = 0, groupDaily = 0, koDaily = 0;
    for (const m of matches) {
      const pk = picks[m.id]?.[p.id];
      const pts = pickPoints(m, pk);
      daily += pts;
      if (m.stage === "GROUP") groupDaily += pts; else koDaily += pts;
    }
    const udTeam = underdog[p.id] ? tById[underdog[p.id].teamId] : null;
    const udPts = udTeam ? teamUdPts(udTeam) : 0;
    const udGroupPts = udTeam ? teamGroupUdPts(udTeam) : 0;
    const f8Team = final8[p.id] ? tById[final8[p.id].teamId] : null;
    const f8Pts = f8Team ? (F8_VALUE[f8Team.furthest] || 0) : 0;
    return { p, daily, groupDaily, koDaily, udTeam, udPts, udGroupPts, f8Team, f8Pts,
      knockout: koDaily + f8Pts, total: daily + udPts + f8Pts };
  });
}
function pickOrder(game) {
  const rows = computeStandings(game);
  return rows.slice().sort((a, b) =>
    b.udGroupPts - a.udGroupPts ||
    ((game.underdog[a.p.id]?.at || Infinity) - (game.underdog[b.p.id]?.at || Infinity)));
}
function prizeLeaders(game) {
  const rows = computeStandings(game);
  if (!rows.length) return {};
  const by = (f, dir = -1) => rows.slice().sort((a, b) => dir * (f(a) - f(b)))[0];
  const udSorted = rows.filter((r) => r.udTeam).sort((a, b) =>
    UD_RANK[b.udTeam.furthest] - UD_RANK[a.udTeam.furthest] ||
    b.udGroupPts - a.udGroupPts ||
    (game.underdog[a.p.id].at - game.underdog[b.p.id].at));
  return {
    champion: by((r) => r.total), group: by((r) => r.groupDaily),
    knockout: by((r) => r.knockout), last: by((r) => r.total, 1),
    underdog: udSorted[0] || null,
  };
}

/* ── small bits ─────────────────────────────────────────────── */
const Trophy = ({ size = 200 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
    <path d="M30 12h40v8c8 0 14 2 14 10s-8 16-16 18c-3 8-8 13-13 15v9h10c3 0 5 2 5 5v6H30v-6c0-3 2-5 5-5h10v-9c-5-2-10-7-13-15-8-2-16-10-16-18s6-10 14-10v-8z"
      stroke="#c9a84c" strokeWidth="3" />
  </svg>
);
function useTick(active) {
  const [, setN] = useState(0);
  useEffect(() => { if (!active) return; const t = setInterval(() => setN((n) => n + 1), 1000); return () => clearInterval(t); }, [active]);
}
// Jackpot-style rolling number
function CountUp({ value, decimals = 0, duration = 900 }) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current, to = value;
    if (from === to) { setDisp(to); return; }
    prev.current = to;
    const t0 = performance.now();
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisp(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{Number(disp).toFixed(decimals)}</>;
}
// Current consecutive-correct-picks streak for a player
function streakFor(game, playerId) {
  const fin = game.matches.filter((m) => m.status === "finished")
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  let s = 0;
  for (let i = fin.length - 1; i >= 0; i--) {
    const pk = game.picks[fin[i].id]?.[playerId];
    if (!pk) continue;
    if (pk.pred === matchResult(fin[i])) s++; else break;
  }
  return s;
}
// Stadium LED ticker — endless scroll of pot, leaders, fixtures, streaks
function Ticker({ game }) {
  const rows = computeStandings(game).sort((a, b) => b.total - a.total);
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const items = [];
  const pot = game.config.buyIn * game.players.length;
  items.push(`💰 POT ${money(game.config.currency, pot)}`);
  if (rows[0] && rows[0].total > 0) items.push(`🥇 ${rows[0].p.name} leads on ${rows[0].total} pts`);
  const hot = rows.map((r) => ({ n: r.p.name, s: streakFor(game, r.p.id) })).sort((a, b) => b.s - a.s)[0];
  if (hot && hot.s >= 2) items.push(`🔥 ${hot.n} is on a ${hot.s}-pick heater`);
  const today = new Date().toDateString();
  for (const m of game.matches.filter((x) => x.status !== "void" && new Date(x.kickoff).toDateString() === today)
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))) {
    const a = tById[m.teamA], b = tById[m.teamB];
    if (!a || !b) continue;
    if (m.live && m.scoreA != null) items.push(`🔴 LIVE ${a.name} ${m.scoreA}–${m.scoreB} ${b.name}`);
    else if (m.status === "finished") items.push(`🏁 FT ${a.name} ${m.scoreA}–${m.scoreB} ${b.name}`);
    else items.push(`⚽ ${a.name} v ${b.name} ${new Date(m.kickoff).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`);
  }
  if (rows.length > 1 && rows[rows.length - 1].total > 0) items.push(`🪦 ${rows[rows.length - 1].p.name} holds the wooden spoon`);
  if (items.length < 3) items.push("World Cup 2026 — get your picks in before they lock");
  const line = items.join("   ●   ");
  return (
    <div className="ticker" aria-hidden>
      <div className="ticker-track"><span>{line}   ●   </span><span>{line}   ●   </span></div>
    </div>
  );
}
function Countdown({ to }) {
  useTick(true);
  const ms = new Date(to).getTime() - Date.now();
  if (ms <= 0) return <span>LOCKED</span>;
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return <span>Picks lock in {h > 0 ? `${h}:` : ""}{pad(m)}:{pad(s)} — don't sleep.</span>;
}
function Confetti({ burst }) {
  if (!burst) return null;
  const colors = ["#f0c93a", "#c9a84c", "#4fc3f7", "#2d6e47", "#ffffff", "#e63946"];
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 36 }).map((_, i) => (
        <span key={i} className="cpiece" style={{
          left: `${Math.random() * 100}%`, background: colors[i % colors.length],
          animationDelay: `${Math.random() * 0.6}s`, transform: `rotate(${Math.random() * 360}deg)`,
        }} />
      ))}
    </div>
  );
}
const Sticker = ({ children, style }) => {
  const ref = useRef(null);
  return (
    <div ref={ref} className="sticker shine" style={style}
      onMouseMove={(e) => {
        const r = ref.current.getBoundingClientRect();
        ref.current.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        ref.current.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      }}>
      <div className="strip" />{children}
    </div>
  );
};

/* ════════════════ PAGES ════════════════ */

function HomePage({ game, me, go, fxStatus, onRefresh }) {
  const rows = computeStandings(game).sort((a, b) => b.total - a.total);
  const now = Date.now();
  const upcoming = game.matches.filter((m) => m.status !== "void" && m.status !== "finished")
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff)).slice(0, 6);
  const recent = game.matches.filter((m) => m.status === "finished")
    .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff)).slice(0, 5);
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const pot = game.config.buyIn * game.players.length;
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="page">
      <div className="hero">
        <h1>WORLD CUP 2026</h1>
        <div className="sub">{game.config.groupName} · Private prediction league</div>
        <div className="pot shine"><span style={{ fontSize: 26 }}>🏆</span>
          <div><div className="barlow muted" style={{ fontSize: 11 }}>Total pot</div>
            <div className="amt jackpot">{game.config.currency}<CountUp value={pot} decimals={2} /></div></div>
        </div>
      </div>

      {!game.config.apiKey && (
        <div className="banner" style={{ marginTop: 16 }}>
          ⚙️ Add a free football-data.org API key in Admin to auto-load today's fixtures.
        </div>
      )}
      {fxStatus?.loading && <div className="lockline" style={{ marginTop: 12 }}>Pulling today's fixtures…</div>}
      {fxStatus?.error && <div className="panel" style={{ marginTop: 12, color: "var(--danger)" }}>{fxStatus.error}</div>}

      <div className="h-sec">Today & upcoming</div>
      {upcoming.length === 0 ? (
        <div className="panel muted">No fixtures scheduled yet. {me ? "Tell your admin to load the matchday." : ""}</div>
      ) : (
        <div className="fixstrip">
          {upcoming.map((m) => {
            const a = tById[m.teamA], b = tById[m.teamB];
            const ko = new Date(m.kickoff).getTime();
            const isLive = m.live || (now >= ko && now < ko + 2.2 * 3600000);
            return (
              <div className={`match ${isLive ? "live-card" : ""}`} key={m.id} style={{ marginBottom: 0 }}>
                <div className="meta"><span>{stageTag(m, tById)}</span>
                  {isLive ? <span className="live"><span className="dot" />LIVE</span> : <span>{fmtTime(m.kickoff)}</span>}
                </div>
                <div className="face">
                  <div className="team"><span className="fl">{a?.flag}</span><span className="nm">{a?.name}</span></div>
                  {isLive && m.scoreA != null && m.scoreB != null
                    ? <div className="score">{m.scoreA} – {m.scoreB}</div>
                    : <div className="vs">VS</div>}
                  <div className="team"><span className="fl">{b?.flag}</span><span className="nm">{b?.name}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 14, textAlign: "center" }}>
        <button className="btn btn-gold" onClick={() => go("picks")}>Make today's picks →</button>
      </div>

      <div className="h-sec">Top of the table</div>
      <div className="grid2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        {rows.slice(0, 3).map((r, i) => (
          <Sticker key={r.p.id}>
            <div className="jersey">#{String(i + 1).padStart(2, "0")}</div>
            <div style={{ fontSize: 30 }}>{medals[i]} {r.p.avatar}</div>
            <div className="bebas" style={{ fontSize: 22, marginTop: 4 }}>{r.p.name}</div>
            <div className="barlow muted" style={{ fontSize: 12 }}>{r.p.country || "—"}</div>
            <div className="bebas gold jackpot" style={{ fontSize: 28, marginTop: 6 }}><CountUp value={r.total} /> PTS{streakFor(game, r.p.id) >= 2 ? ` 🔥${streakFor(game, r.p.id)}` : ""}</div>
          </Sticker>
        ))}
        {rows.length === 0 && <div className="panel muted">No players yet — create your profile from the top bar.</div>}
      </div>

      <div className="h-sec">Latest results</div>
      {recent.length === 0 ? <div className="panel muted">No results in yet. The pitch is waiting.</div> :
        recent.map((m) => {
          const a = tById[m.teamA], b = tById[m.teamB];
          return (
            <div className="match" key={m.id}>
              <div className="meta"><span>{stageTag(m, tById)}</span><span>FULL TIME</span></div>
              <div className="face">
                <div className="team"><span className="fl">{a?.flag}</span><span className="nm">{a?.name}</span></div>
                <div className="score">{m.scoreA} – {m.scoreB}</div>
                <div className="team"><span className="fl">{b?.flag}</span><span className="nm">{b?.name}</span></div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function PicksPage({ game, me, mutate, fxStatus, onRefresh }) {
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const [stageTab, setStageTab] = useState("GROUP");
  useTick(true);
  const now = Date.now();
  const matches = game.matches.filter((m) => m.stage === stageTab)
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

  const setPick = (m, patch) => mutate((g) => {
    // hard guard: no pick changes within 1 min of kickoff, even if the UI lagged
    if (Date.now() >= new Date(m.kickoff).getTime() - 7200000) return;
    if (!g.picks[m.id]) g.picks[m.id] = {};
    const cur = g.picks[m.id][me.id] || { pred: null, sa: "", sb: "", at: Date.now() };
    g.picks[m.id][me.id] = { ...cur, ...patch, at: Date.now() };
  });

  return (
    <div className="page">
      <div className="h-sec">Daily picks</div>
      <div className="subtab">
        {STAGES.map((s) => (
          <button key={s} className={`btn ${stageTab === s ? "btn-gold" : "btn-ghost"}`} onClick={() => setStageTab(s)}>{STAGE_LABEL[s]}</button>
        ))}
      </div>
      {!me && <div className="banner">Select your player in the top bar to make picks.</div>}
      {matches.length === 0 && <div className="panel muted">No {STAGE_LABEL[stageTab]} fixtures yet.</div>}
      {matches.map((m) => {
        const a = tById[m.teamA], b = tById[m.teamB];
        const lockAt = new Date(m.kickoff).getTime() - 7200000; // locks 2 hours before kickoff
        const locked = now >= lockAt || m.status === "finished" || m.status === "void";
        const myPick = me ? game.picks[m.id]?.[me.id] : null;
        const res = matchResult(m);
        const ko = new Date(m.kickoff).getTime();
        const isLive = m.status !== "finished" && m.status !== "void" && (m.live || (now >= ko && now < ko + 2.2 * 3600000));
        const btnCls = (key) => {
          let c = "pickbtn";
          if (myPick?.pred === key) c += " sel";
          if (m.status === "finished" && myPick?.pred === key) c += res === key ? " win" : " lose";
          return c;
        };
        return (
          <div className="match" key={m.id}>
            <div className="meta">
              <span>{stageTag(m, tById)}</span>
              {m.status === "void" ? <span style={{ color: "var(--danger)" }}>VOID — picks refunded</span>
                : isLive ? <span className="live"><span className="dot" />LIVE</span>
                : m.status === "finished" ? <span>FULL TIME</span> : <span>{fmtTime(m.kickoff)}</span>}
            </div>
            <div className="face">
              <div className="team"><span className="fl">{a?.flag}</span><span className="nm">{a?.name}</span></div>
              {(m.status === "finished" || (isLive && m.scoreA != null && m.scoreB != null)) ? <div className="score">{m.scoreA} – {m.scoreB}</div> : <div className="vs">VS</div>}
              <div className="team"><span className="fl">{b?.flag}</span><span className="nm">{b?.name}</span></div>
            </div>
            <div className="pickrow">
              <button className={btnCls("A")} disabled={locked || !me} onClick={() => setPick(m, { pred: "A" })}>{a?.name} win</button>
              <button className={btnCls("D")} disabled={locked || !me} onClick={() => setPick(m, { pred: "D" })}>Draw</button>
              <button className={btnCls("B")} disabled={locked || !me} onClick={() => setPick(m, { pred: "B" })}>{b?.name} win</button>
            </div>
            {!locked && m.status !== "void" && <div className="lockline"><Countdown to={new Date(lockAt).toISOString()} /></div>}
            {locked && m.status !== "void" && (
              <div className="others">
                {game.players.map((p) => {
                  const pk = game.picks[m.id]?.[p.id];
                  const lab = pk ? (pk.pred === "A" ? a?.name : pk.pred === "B" ? b?.name : "Draw") : "—";
                  const pts = pickPoints(m, pk);
                  const cls = m.status === "finished" && pk ? (pk.pred === res ? "chip ok" : "chip bad") : "chip";
                  return <span key={p.id} className={cls}>{p.avatar} {p.name}: {lab}
                    {m.status === "finished" ? ` · +${pts}` : ""}</span>;
                })}
              </div>
            )}
          </div>
        );
      })}
      <div className="note">All kickoff times are shown in your own timezone, automatically. Scoring — Group 3 · R32/R16 5 · QF 8 · SF 12 · Final 15 for a correct result. Picks lock 2 hours before kickoff. Miss the window and it's 0 — no catch-up.</div>
    </div>
  );
}

function UnderdogPage({ game, me, mutate }) {
  const eligible = game.teams.filter((t) => t.eligible).sort((a, b) => (a.group || "").localeCompare(b.group || "") || a.name.localeCompare(b.name));
  const takenBy = {};
  for (const [pid, ud] of Object.entries(game.underdog)) takenBy[ud.teamId] = pid;
  const pById = Object.fromEntries(game.players.map((p) => [p.id, p]));
  const myUd = me ? game.underdog[me.id] : null;
  const myTeam = myUd ? game.teams.find((t) => t.id === myUd.teamId) : null;
  const order = pickOrder(game);

  const claim = (t) => {
    if (!me || myUd || takenBy[t.id]) return;
    mutate((g) => {
      if (g.underdog[me.id]) return;
      if (Object.values(g.underdog).some((u) => u.teamId === t.id)) return; // raced
      g.underdog[me.id] = { teamId: t.id, at: Date.now() };
    });
  };

  return (
    <div className="page">
      <div className="h-sec">Underdog hub</div>
      {myTeam ? (
        <Sticker style={{ marginBottom: 18 }}>
          <div className="jersey"><span className="stamp">UNDERDOG</span></div>
          <div style={{ fontSize: 40 }}>🐉 {myTeam.flag}</div>
          <div className="bebas" style={{ fontSize: 26 }}>{myTeam.name}</div>
          <div className="bebas gold" style={{ fontSize: 24 }}>{teamUdPts(myTeam)} PTS</div>
          {UD_RANK[myTeam.furthest] === 0 && myTeam.furthest === "out" &&
            <div className="barlow" style={{ color: "var(--danger)", marginTop: 4 }}>Your underdog went out swinging. Points locked.</div>}
          <div className="timeline">
            {myTeam.wonAll3 && <div className="tl-item hit"><span className="tl-dot" /><span className="tl-lab">Won all 3 group games · +5 bonus</span></div>}
            {UD_MILESTONES.map(([k, lab, v]) => (
              <div key={k} className={`tl-item ${UD_RANK[myTeam.furthest] >= UD_RANK[k] ? "hit" : ""}`}>
                <span className="tl-dot" /><span className="tl-lab">{lab} · {v} pts</span>
              </div>
            ))}
          </div>
        </Sticker>
      ) : me ? (
        <div className="banner">Pick ONE underdog below. Locked for the whole tournament — choose with your heart or your head, not both.</div>
      ) : <div className="banner">Select your player in the top bar first.</div>}

      <div className="h-sec">Available underdogs</div>
      {eligible.length === 0 && <div className="panel muted">Admin hasn't loaded the underdog-eligible team list yet.</div>}
      <div className="ud-grid">
        {eligible.map((t) => {
          const owner = takenBy[t.id] ? pById[takenBy[t.id]] : null;
          return (
            <div key={t.id} className={`ud-card ${owner ? "taken" : ""}`}>
              <div className="fl">{t.flag}</div>
              <div className="nm">{t.name}</div>
              {t.group && <div className="barlow muted" style={{ fontSize: 10 }}>Group {t.group}</div>}
              {owner ? (
                <div className="barlow muted" style={{ fontSize: 11, marginTop: 4 }}>🔒 {owner.avatar} {owner.name}</div>
              ) : (
                <button className="btn btn-ghost" style={{ marginTop: 6, padding: "5px 10px", fontSize: 12 }}
                  disabled={!me || !!myUd} onClick={() => claim(t)}>Claim</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-sec">Group-stage underdog table</div>
      <div className="note" style={{ marginTop: 0, marginBottom: 10 }}>This ranking decides the Final 8 pick order. Ties go to the earlier pick.</div>
      {order.map((r, i) => (
        <div key={r.p.id} className="lb-row" style={{ gridTemplateColumns: "34px 1fr 90px", cursor: "default" }}>
          <span className="rank">{i + 1}</span>
          <span>{r.p.avatar} {r.p.name} <span className="muted" style={{ fontSize: 12 }}>{r.udTeam ? `· ${r.udTeam.flag} ${r.udTeam.name}` : "· no pick"}</span></span>
          <span className="tot">{r.udGroupPts} pts</span>
        </div>
      ))}
    </div>
  );
}

function Final8Page({ game, me, mutate }) {
  const open = game.config.final8Open;
  const order = pickOrder(game);
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const alive = game.teams.filter((t) => UD_RANK[t.furthest] >= 1 && t.furthest !== "won" || t.furthest === "won");
  const remaining = game.teams.filter((t) => t.furthest !== "out" && t.furthest !== "none" ? true : t.furthest === "none");
  // candidate teams: anything not marked out
  const pickable = game.teams.filter((t) => t.furthest !== "out");
  const takenTeams = new Set(Object.values(game.final8).map((f) => f.teamId));
  const nextPicker = order.find((r) => !game.final8[r.p.id]);
  const myTurn = me && nextPicker && nextPicker.p.id === me.id;

  const choose = (t) => mutate((g) => {
    if (g.final8[me.id]) return;
    g.final8[me.id] = { teamId: t.id, at: Date.now() };
  });

  if (!open) return (
    <div className="page">
      <div className="h-sec">Final 8 picks</div>
      <div className="banner">🔒 LOCKED — opens when the group stage is done. Your underdog points buy you a better spot in the queue.</div>
    </div>
  );

  return (
    <div className="page">
      <div className="banner">GROUP STAGE COMPLETE. TIME TO BACK A WINNER.</div>
      <div className="h-sec">Pick order</div>
      {order.map((r, i) => {
        const f8 = game.final8[r.p.id];
        const team = f8 ? tById[f8.teamId] : null;
        const isNext = nextPicker && nextPicker.p.id === r.p.id;
        return (
          <div key={r.p.id} className="lb-row" style={{ gridTemplateColumns: "34px 1fr auto", cursor: "default", borderColor: isNext ? "var(--gold)" : undefined }}>
            <span className="rank">{i + 1}</span>
            <span>{r.p.avatar} {r.p.name} <span className="muted" style={{ fontSize: 12 }}>({r.udGroupPts} ud pts)</span></span>
            {team ? <span className="bebas gold" style={{ fontSize: 18 }}>{team.flag} {team.name} · {F8_VALUE[team.furthest] || 0} pts</span>
              : isNext ? <span className="stamp" style={{ transform: "none", borderColor: "var(--gold)", color: "var(--gold-bright)" }}>ON THE CLOCK</span>
              : <span className="muted barlow" style={{ fontSize: 12 }}>waiting</span>}
          </div>
        );
      })}

      {myTurn && (
        <>
          <div className="h-sec">Pick your winner</div>
          <div className="ud-grid">
            {pickable.filter((t) => !takenTeams.has(t.id)).map((t) => (
              <div key={t.id} className="ud-card">
                <div className="fl">{t.flag}</div><div className="nm">{t.name}</div>
                <button className="btn btn-gold" style={{ marginTop: 6, padding: "5px 10px", fontSize: 12 }} onClick={() => choose(t)}>Back them</button>
              </div>
            ))}
          </div>
          <div className="note">You're picking the team you think wins the whole thing. QF 10 · SF 20 · Final 35 · Champions 50.</div>
        </>
      )}
    </div>
  );
}

function LeaderboardPage({ game }) {
  const [tab, setTab] = useState("overall");
  const [openRow, setOpenRow] = useState(null);
  const leaders = prizeLeaders(game);
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  let rows = computeStandings(game);
  const sorters = {
    overall: (a, b) => b.total - a.total,
    group: (a, b) => b.groupDaily - a.groupDaily,
    knockout: (a, b) => b.knockout - a.knockout,
    underdog: (a, b) => b.udPts - a.udPts,
  };
  rows = rows.slice().sort(sorters[tab]);
  const contention = (r) => PRIZES.filter(([k]) => leaders[k] && leaders[k].p.id === r.p.id).map(([, ic]) => ic).join(" ");
  return (
    <div className="page lb-wrap">
      <div className="lb-watermark"><Trophy size={340} /></div>
      <div className="h-sec">Live standings</div>
      <div className="subtab">
        {[["overall", "Overall"], ["group", "Group stage"], ["knockout", "Knockout"], ["underdog", "Underdog"]].map(([k, lab]) => (
          <button key={k} className={`btn ${tab === k ? "btn-gold" : "btn-ghost"}`} onClick={() => setTab(k)}>{lab}</button>
        ))}
      </div>
      <div className="lb-head"><span>#</span><span>Player</span><span className="num">Daily</span><span className="num">Udog</span><span className="num">F8</span><span className="num">Total</span></div>
      {rows.map((r, i) => (
        <div key={r.p.id}>
          <div className={`lb-row ${i === 0 && tab === "overall" ? "top1" : ""}`} style={{ animationDelay: `${i * 60}ms` }} onClick={() => setOpenRow(openRow === r.p.id ? null : r.p.id)}>
            <span className="rank">{i + 1}</span>
            <span>{r.p.avatar} {r.p.name} <span style={{ fontSize: 13 }}>{contention(r)}</span>{streakFor(game, r.p.id) >= 2 && <span style={{ fontSize: 12 }}> 🔥{streakFor(game, r.p.id)}</span>}</span>
            <span className="num">{r.daily}</span>
            <span className="num">{r.udPts}</span>
            <span className="num">{r.f8Pts}</span>
            <span className="tot"><CountUp value={r.total} /></span>
          </div>
          {openRow === r.p.id && (
            <div className="panel" style={{ marginBottom: 8, fontSize: 13 }}>
              <div className="barlow gold" style={{ marginBottom: 6 }}>Pick history — {r.p.name}</div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Underdog: {r.udTeam ? `${r.udTeam.flag} ${r.udTeam.name} (${r.udPts} pts)` : "—"} ·
                Final 8: {r.f8Team ? ` ${r.f8Team.flag} ${r.f8Team.name} (${r.f8Pts} pts)` : " —"} ·
                Group daily: {r.groupDaily} · Knockout daily: {r.koDaily}
              </div>
              {game.matches.filter((m) => m.status === "finished" && game.picks[m.id]?.[r.p.id]).map((m) => {
                const pk = game.picks[m.id][r.p.id];
                const a = tById[m.teamA], b = tById[m.teamB];
                const lab = pk.pred === "A" ? a?.name : pk.pred === "B" ? b?.name : "Draw";
                const pts = pickPoints(m, pk);
                return <div key={m.id} style={{ padding: "3px 0", color: pts > 0 ? "#bdf3d2" : "#f1a0a7" }}>
                  {a?.flag} {m.scoreA}–{m.scoreB} {b?.flag} · picked {lab} · +{pts}
                </div>;
              })}
            </div>
          )}
        </div>
      ))}
      {rows.length === 0 && <div className="panel muted">No players yet.</div>}
      {rows.length > 0 && tab === "overall" && (
        <div className="note">🪦 {rows[rows.length - 1].p.name} is holding the wooden spoon... but at least they're getting paid.</div>
      )}
    </div>
  );
}

function PrizesPage({ game }) {
  const pot = game.config.buyIn * game.players.length;
  const leaders = prizeLeaders(game);
  const cur = game.config.currency;
  const data = PRIZES.map(([k, , lab, share]) => ({ name: lab, value: share * 100 }));
  const COLORS_ = ["#f0c93a", "#2d6e47", "#4fc3f7", "#8aaa96", "#c9a84c"];
  return (
    <div className="page">
      <div className="h-sec">The pot</div>
      <div className="panel" style={{ textAlign: "center" }}>
        <div className="barlow muted">Buy-in {money(cur, game.config.buyIn)} × {game.players.length} players</div>
        <div className="bebas gold jackpot" style={{ fontSize: 52 }}>{cur}<CountUp value={pot} decimals={2} /></div>
      </div>
      <div style={{ height: 230, marginTop: 8 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={62} outerRadius={92} paddingAngle={3} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={COLORS_[i]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      {PRIZES.map(([k, ic, lab, share, cond]) => {
        const l = leaders[k];
        return (
          <div className="prize-row" key={k}>
            <span style={{ fontSize: 22 }}>{ic}</span>
            <div>
              <div className="bebas" style={{ fontSize: 18 }}>{lab} <span className="muted barlow" style={{ fontSize: 11 }}>· {cond}</span></div>
              <div className="barlow muted" style={{ fontSize: 12 }}>Current leader: {l ? `${l.p.avatar} ${l.p.name}` : "—"}</div>
            </div>
            <span className="pct">{Math.round(share * 100)}%</span>
            <span className="amt jackpot">{cur}<CountUp value={pot * share} decimals={2} /></span>
          </div>
        );
      })}
    </div>
  );
}

function AdminPage({ game, mutate, isAdmin, setIsAdmin, fireConfetti, onRefresh, fxStatus }) {
  const [pw, setPw] = useState("");
  const [form, setForm] = useState({ teamA: "", teamB: "", kickoff: "", stage: "GROUP" });
  const [newPlayer, setNewPlayer] = useState({ name: "", avatar: "⚽", country: "" });
  const tSorted = game.teams.slice().sort((a, b) => a.name.localeCompare(b.name));

  if (!isAdmin) return (
    <div className="page">
      <div className="h-sec">Admin panel</div>
      <div className="panel" style={{ display: "flex", gap: 8 }}>
        <input type="password" placeholder="Admin password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ flex: 1 }} />
        <button className="btn btn-gold" onClick={() => { if (pw === game.config.adminPass) setIsAdmin(true); else alert("Wrong password."); }}>Unlock</button>
      </div>
      <div className="note">Default password is <b>wc2026</b> — change it once you're in.</div>
    </div>
  );

  const enterResult = (m, sa, sb) => {
    if (sa === "" || sb === "") return;
    mutate((g) => {
      const mm = g.matches.find((x) => x.id === m.id);
      mm.scoreA = Number(sa); mm.scoreB = Number(sb); mm.status = "finished";
    });
    fireConfetti();
  };

  return (
    <div className="page">
      <div className="h-sec">League setup</div>
      <div className="panel grid2">
        <label className="barlow muted" style={{ fontSize: 12 }}>Group name
          <input key={"gn" + game.config.groupName} style={{ width: "100%", marginTop: 4 }} defaultValue={game.config.groupName}
            onBlur={(e) => mutate((g) => { g.config.groupName = e.target.value; })} /></label>
        <label className="barlow muted" style={{ fontSize: 12 }}>Buy-in per player
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <input key={"cur" + game.config.currency} style={{ width: 64 }} defaultValue={game.config.currency} aria-label="currency symbol"
              onBlur={(e) => mutate((g) => { g.config.currency = e.target.value; })} />
            <input key={"buy" + game.config.buyIn} style={{ flex: 1 }} inputMode="decimal" defaultValue={game.config.buyIn}
              onBlur={(e) => mutate((g) => { g.config.buyIn = Number(e.target.value) || 0; })} />
          </div></label>
        <label className="barlow muted" style={{ fontSize: 12 }}>Admin password
          <input key={"pw" + game.config.adminPass} style={{ width: "100%", marginTop: 4 }} defaultValue={game.config.adminPass}
            onBlur={(e) => mutate((g) => { g.config.adminPass = e.target.value; })} /></label>
        <label className="barlow muted" style={{ fontSize: 12 }}>Final 8 picks
          <button className={`btn ${game.config.final8Open ? "btn-danger" : "btn-gold"}`} style={{ width: "100%", marginTop: 4 }}
            onClick={() => mutate((g) => { g.config.final8Open = !g.config.final8Open; })}>
            {game.config.final8Open ? "Close window" : "Open window (LOCKED → UNLOCKED)"}</button></label>
      </div>

      <div className="h-sec">Live fixtures (football-data.org)</div>
      <div className="panel">
        <label className="barlow muted" style={{ fontSize: 12 }}>Free API key
          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            <input style={{ flex: 1, minWidth: 180 }} type="password" placeholder="Paste your key" defaultValue={game.config.apiKey}
              onBlur={(e) => mutate((g) => { g.config.apiKey = e.target.value.trim(); })} />
            <button className="btn btn-ghost" onClick={onRefresh}>Refresh today's fixtures</button>
          </div>
        </label>
        {fxStatus?.loading && <div className="lockline">Pulling fixtures…</div>}
        {fxStatus?.error && <div className="note" style={{ color: "var(--danger)" }}>{fxStatus.error}</div>}
        <div className="note">Get a free key at football-data.org/client/register. Once saved, today's World Cup fixtures load automatically (and auto-update status every few minutes). Kickoff times show in each viewer's own timezone. The free tier doesn't push live scorelines — enter final scores below.</div>
      </div>

      <div className="h-sec">Players</div>
      <div className="panel">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="Name" value={newPlayer.name} onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })} />
          <input placeholder="Emoji" style={{ width: 64 }} value={newPlayer.avatar} onChange={(e) => setNewPlayer({ ...newPlayer, avatar: e.target.value })} />
          <input placeholder="Supporting (flavour)" value={newPlayer.country} onChange={(e) => setNewPlayer({ ...newPlayer, country: e.target.value })} />
          <button className="btn btn-gold" disabled={!newPlayer.name} onClick={() => {
            mutate((g) => { g.players.push({ id: uid(), ...newPlayer, createdAt: Date.now() }); });
            setNewPlayer({ name: "", avatar: "⚽", country: "" });
          }}>Add player</button>
        </div>
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {game.players.map((p) => (
            <span key={p.id} className="chip">{p.avatar} {p.name}{p.pin ? " 🔒" : ""}
              {p.pin && <button className="btn btn-ghost" style={{ padding: "0 6px", fontSize: 11 }}
                title="Reset PIN"
                onClick={() => { if (confirm(`Reset ${p.name}'s PIN? They'll set a new one next time they select their name.`)) mutate((g) => { const gp = g.players.find((x) => x.id === p.id); if (gp) delete gp.pin; }); }}>PIN↺</button>}
              <button className="btn btn-danger" style={{ padding: "0 6px", fontSize: 11 }}
                onClick={() => { if (confirm(`Remove ${p.name}?`)) mutate((g) => { g.players = g.players.filter((x) => x.id !== p.id); delete g.underdog[p.id]; delete g.final8[p.id]; }); }}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="h-sec">Teams</div>
      <div className="panel">
        {game.teams.length === 0 && (
          <button className="btn btn-gold" onClick={() => mutate((g) => {
            const byCode = {};
            g.teams = Object.entries(WC_TEAMS).map(([code, [name, flag, group, el]]) => {
              const t = { id: uid(), code, name, flag, group, eligible: !!el, furthest: "none", wonAll3: false };
              byCode[code] = t.id; return t;
            });
            g.matches = WC_FIXTURES.map(([a, b, ko]) => ({
              id: uid(), teamA: byCode[a], teamB: byCode[b],
              kickoff: new Date(ko).toISOString(), stage: "GROUP", scoreA: null, scoreB: null, status: "scheduled",
            }));
          })}>Load official WC2026 teams + all 72 group fixtures</button>
        )}
        {game.teams.length > 0 && <div className="note" style={{ marginTop: 0 }}>
          Toggle underdog eligibility, set each team's furthest stage (drives underdog + Final 8 points), and mark group sweeps.
        </div>}
        <div style={{ marginTop: 10, maxHeight: 340, overflowY: "auto" }}>
          {tSorted.map((t) => (
            <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: "1px dashed rgba(138,170,150,.15)", flexWrap: "wrap" }}>
              <span style={{ minWidth: 140 }}>{t.flag} {t.name}</span>
              <label style={{ fontSize: 12 }} className="muted"><input type="checkbox" checked={t.eligible}
                onChange={() => mutate((g) => { g.teams.find((x) => x.id === t.id).eligible = !t.eligible; })} /> underdog-eligible</label>
              <select value={t.furthest} onChange={(e) => mutate((g) => { g.teams.find((x) => x.id === t.id).furthest = e.target.value; })}>
                <option value="none">In group stage</option><option value="out">Out in groups</option>
                <option value="qualified">Qualified</option><option value="r16">Reached R16</option>
                <option value="qf">Reached QF</option><option value="sf">Reached SF</option>
                <option value="final">Reached Final</option><option value="won">CHAMPIONS</option>
              </select>
              <label style={{ fontSize: 12 }} className="muted"><input type="checkbox" checked={t.wonAll3}
                onChange={() => mutate((g) => { g.teams.find((x) => x.id === t.id).wonAll3 = !t.wonAll3; })} /> won all 3</label>
            </div>
          ))}
        </div>
      </div>

      <div className="h-sec">Add fixture</div>
      <div className="panel" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={form.teamA} onChange={(e) => setForm({ ...form, teamA: e.target.value })}>
          <option value="">Home team</option>{tSorted.map((t) => <option key={t.id} value={t.id}>{t.flag} {t.name}</option>)}</select>
        <select value={form.teamB} onChange={(e) => setForm({ ...form, teamB: e.target.value })}>
          <option value="">Away team</option>{tSorted.map((t) => <option key={t.id} value={t.id}>{t.flag} {t.name}</option>)}</select>
        <input type="datetime-local" value={form.kickoff} onChange={(e) => setForm({ ...form, kickoff: e.target.value })} />
        <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
          {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select>
        <button className="btn btn-gold" disabled={!form.teamA || !form.teamB || !form.kickoff || form.teamA === form.teamB}
          onClick={() => { mutate((g) => { g.matches.push({ id: uid(), teamA: form.teamA, teamB: form.teamB, kickoff: new Date(form.kickoff).toISOString(), stage: form.stage, scoreA: null, scoreB: null, status: "scheduled" }); }); setForm({ ...form, teamA: "", teamB: "", kickoff: "" }); }}>
          Add fixture</button>
      </div>

      <div className="h-sec">Results entry</div>
      {game.matches.slice().sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff)).map((m) => {
        const a = game.teams.find((t) => t.id === m.teamA), b = game.teams.find((t) => t.id === m.teamB);
        return <AdminResultRow key={m.id} m={m} a={a} b={b} onSave={enterResult}
          onVoid={() => mutate((g) => { const mm = g.matches.find((x) => x.id === m.id); mm.status = mm.status === "void" ? "scheduled" : "void"; })}
          onDelete={() => { if (confirm("Delete fixture?")) mutate((g) => { g.matches = g.matches.filter((x) => x.id !== m.id); delete g.picks[m.id]; }); }} />;
      })}

      <div className="h-sec">Danger zone</div>
      <button className="btn btn-danger" onClick={() => { if (confirm("Wipe the ENTIRE game? This cannot be undone.")) mutate((g) => { Object.assign(g, JSON.parse(JSON.stringify(DEFAULT_GAME))); }); }}>Reset whole league</button>
    </div>
  );
}
function AdminResultRow({ m, a, b, onSave, onVoid, onDelete }) {
  const [sa, setSa] = useState(m.scoreA ?? "");
  const [sb, setSb] = useState(m.scoreB ?? "");
  return (
    <div className="panel" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8, opacity: m.status === "void" ? 0.5 : 1 }}>
      <span style={{ minWidth: 180 }}>{a?.flag} {a?.name} v {b?.flag} {b?.name}</span>
      <span className="muted barlow" style={{ fontSize: 11 }}>{STAGE_LABEL[m.stage]} · {fmtTime(m.kickoff)}</span>
      <input style={{ width: 50, textAlign: "center" }} inputMode="numeric" value={sa} onChange={(e) => setSa(e.target.value.replace(/\D/g, ""))} aria-label="home score" />
      <span>–</span>
      <input style={{ width: 50, textAlign: "center" }} inputMode="numeric" value={sb} onChange={(e) => setSb(e.target.value.replace(/\D/g, ""))} aria-label="away score" />
      <button className="btn btn-gold" style={{ padding: "6px 12px" }} onClick={() => onSave(m, sa, sb)}>Save result</button>
      <button className="btn btn-ghost" style={{ padding: "6px 12px" }} onClick={onVoid}>{m.status === "void" ? "Unvoid" : "Void"}</button>
      <button className="btn btn-danger" style={{ padding: "6px 12px" }} onClick={onDelete}>Delete</button>
      {m.status === "finished" && <span className="chip ok">FT {m.scoreA}–{m.scoreB}</span>}
    </div>
  );
}

/* ════════════════ APP SHELL ════════════════ */
export default function App() {
  const [game, setGame] = useState(null);
  const [tab, setTab] = useState("home");
  const [meId, setMeIdRaw] = useState("");
  const [isAdmin, setIsAdminRaw] = useState(false);
  // Phones constantly discard and reload background tabs, which wipes
  // in-memory state — so identity and admin unlock are kept on-device.
  useEffect(() => {
    try {
      const v = localStorage.getItem("wc26-meId"); if (v) setMeIdRaw(v);
      if (sessionStorage.getItem("wc26-admin") === "1") setIsAdminRaw(true);
    } catch (e) {}
  }, []);
  const setMeId = (v) => { setMeIdRaw(v); try { localStorage.setItem("wc26-meId", v); } catch (e) {} };
  const setIsAdmin = (v) => { setIsAdminRaw(v); try { sessionStorage.setItem("wc26-admin", v ? "1" : "0"); } catch (e) {} };
  const [burst, setBurst] = useState(false);
  const [pageErrors, setPageErrors] = useState(supabaseInitError ? [supabaseInitError] : []);
  const [fxStatus, setFxStatus] = useState({ loading: false, error: "" });

  // On-screen error reporter: any JS error shows in a red banner so it can
  // be read and reported without opening developer tools.
  useEffect(() => {
    const onErr = (e) => setPageErrors((p) => [...p.slice(-4), String(e?.error?.message || e?.message || e?.reason?.message || e?.reason || "Unknown error")]);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onErr);
    return () => { window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onErr); };
  }, []);
  const lastFetchRef = useRef(0);
  const gameRef = useRef(null);
  gameRef.current = game;

  // Background sync: reads the shared league, but never right after a local
  // write (so it can't clobber what you just changed with a stale read).
  const refresh = useCallback(async () => {
    if (Date.now() - lastWriteAt < 6000) return;
    const g = await loadGameStrict();
    if (g) { setGame(g); setPageErrors((p) => p.filter((x) => !x.startsWith("Database") && !x.startsWith("Can't reach"))); }
    else if (lastLoadError) setPageErrors((p) => p.includes(lastLoadError) ? p : [...p.slice(-3), lastLoadError]);
  }, []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 20000); return () => clearInterval(t); }, [refresh]);

  // All writes go through one queue: fresh read → change → write. A failed
  // read aborts (never writes), so data can't be wiped by a network blip.
  const mutate = useCallback((fn) => enqueueWrite(async () => {
    const g = await loadGameStrict();
    if (!g) { alert("Couldn't reach the database — that change wasn't saved. Check your connection and try again."); return; }
    fn(g);
    lastWriteAt = Date.now();
    setGame({ ...g });
    const ok = await persist(g);
    lastWriteAt = Date.now();
    if (!ok) alert("Save failed — please try that again.");
  }), []);

  const pullFixtures = useCallback(async (force = false) => {
    const key = gameRef.current?.config?.apiKey;
    if (!key) return;
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 60000) return; // refresh at most once a minute (free tier allows 10/min)
    lastFetchRef.current = now;
    setFxStatus({ loading: true, error: "" });
    const res = await fetchFixtureData(key);
    if (!res.ok) {
      setFxStatus({ loading: false, error: res.error === "no-key" ? "" : res.error });
      return;
    }
    if (res.matches.length > 0) await mutate((g) => mergeFixtures(g, res.matches));
    setFxStatus({ loading: false, error: res.matches.length === 0 ? "No World Cup fixtures today (or the API doesn't have them yet)." : "" });
  }, [mutate]);

  // fetch on load and whenever the API key first appears
  useEffect(() => { if (game?.config?.apiKey) pullFixtures(false); }, [game?.config?.apiKey, pullFixtures]);

  // keep live scores fresh: poll every ~minute while watching Home or Picks
  useEffect(() => {
    if (tab !== "home" && tab !== "picks") return;
    const t = setInterval(() => pullFixtures(false), 65000);
    return () => clearInterval(t);
  }, [tab, pullFixtures]);

  const fireConfetti = () => { setBurst(false); requestAnimationFrame(() => setBurst(true)); setTimeout(() => setBurst(false), 2600); };

  // Dopamine hit: when your total has gone up since you last looked,
  // celebrate with a toast + confetti.
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!game || !meId) return;
    const row = computeStandings(game).find((r) => r.p.id === meId);
    if (!row) return;
    const key = "wc26-pts-" + meId;
    try {
      const prevPts = Number(localStorage.getItem(key));
      if (Number.isFinite(prevPts) && row.total > prevPts) {
        setToast(`+${row.total - prevPts} PTS BANKED 💰`);
        fireConfetti();
        setTimeout(() => setToast(""), 4200);
      }
      localStorage.setItem(key, String(row.total));
    } catch (e) {}
  }, [game, meId]);

  const errBanner = pageErrors.length > 0 && (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, background: "#7a1220", color: "#fff", padding: "8px 14px", fontSize: 13, fontFamily: "monospace" }}>
      <b>⚠ Page error — send this text to fix it:</b>
      {pageErrors.map((e, i) => <div key={i}>• {e}</div>)}
    </div>
  );

  if (!game) return <div className="wc-app"><style>{CSS}</style>{errBanner}<div className="page bebas" style={{ fontSize: 26, textAlign: "center", paddingTop: 80 }}>WARMING UP ON THE TOUCHLINE… <span style={{ fontSize: 14 }}>v14</span><div className="note" style={{ fontFamily: "Inter", letterSpacing: 0, marginTop: 12 }}>If this never goes away, the database connection is failing — check the red banner or Vercel env vars.</div></div></div>;

  const me = game.players.find((p) => p.id === meId) || null;
  const pot = game.config.buyIn * game.players.length;
  const particles = useMemo(() => Array.from({ length: 18 }, () => ({
    left: Math.random() * 100, dur: 8 + Math.random() * 10,
    delay: Math.random() * 10, size: 2 + Math.random() * 3,
  })), []);

  // PIN-protected player selection: first pick sets a 4-digit PIN,
  // after that switching to a player requires their PIN.
  const choosePlayer = (id) => {
    if (!id) { setMeId(""); return; }
    const p = game.players.find((x) => x.id === id);
    if (!p) return;
    if (!p.pin) {
      const pin = window.prompt(`First time as ${p.name}! Set a 4-digit PIN (you'll need it to make picks as ${p.name}):`);
      if (!pin || !/^\d{4}$/.test(pin.trim())) { alert("PIN must be exactly 4 digits — select your name and try again."); return; }
      mutate((g) => { const gp = g.players.find((x) => x.id === id); if (gp && !gp.pin) gp.pin = pin.trim(); });
      setMeId(id);
    } else {
      const pin = window.prompt(`Enter ${p.name}'s 4-digit PIN:`);
      if ((pin || "").trim() !== p.pin) { alert("Wrong PIN."); return; }
      setMeId(id);
    }
  };

  const TABS = [
    ["home", "🏟️", "Home"], ["picks", "✅", "Picks"], ["underdog", "🐉", "Underdog"],
    ["final8", "🎯", "Final 8"], ["board", "🏆", "Table"], ["prizes", "💰", "Prizes"], ["admin", "🛠️", "Admin"],
  ];

  return (
    <div className="wc-app">
      <style>{CSS}</style>
      {errBanner}
      {toast && <div className="toast">{toast}</div>}
      <Confetti burst={burst} />
      <div className="beams" aria-hidden />
      <div className="particles" aria-hidden>
        {particles.map((pt, i) => <i key={i} style={{ left: `${pt.left}%`, width: pt.size, height: pt.size, animationDuration: `${pt.dur}s`, animationDelay: `${pt.delay}s` }} />)}
      </div>
      <div className="topwrap">
      <nav className="nav">
        <span className="nav-trophy" style={{ fontSize: 22 }}>🏆</span>
        <div className="nav-title bebas">WC2026 · <span className="grp">{game.config.groupName}</span> <span className="muted" style={{ fontSize: 11 }}>v14</span></div>
        <span className="pot-badge shine">💰 {game.config.currency}<CountUp value={pot} decimals={2} /></span>
        <select className="who" value={meId} onChange={(e) => choosePlayer(e.target.value)} aria-label="select your player">
          <option value="">Who are you?</option>
          {game.players.map((p) => <option key={p.id} value={p.id}>{p.avatar} {p.name}{p.pin ? " 🔒" : ""}</option>)}
        </select>
      </nav>
      <Ticker game={game} />
      </div>

      {tab === "home" && <HomePage game={game} me={me} go={setTab} fxStatus={fxStatus} onRefresh={() => pullFixtures(true)} />}
      {tab === "picks" && <PicksPage game={game} me={me} mutate={mutate} fxStatus={fxStatus} onRefresh={() => pullFixtures(true)} />}
      {tab === "underdog" && <UnderdogPage game={game} me={me} mutate={mutate} />}
      {tab === "final8" && <Final8Page game={game} me={me} mutate={mutate} />}
      {tab === "board" && <LeaderboardPage game={game} />}
      {tab === "prizes" && <PrizesPage game={game} />}
      {tab === "admin" && <AdminPage game={game} mutate={mutate} isAdmin={isAdmin} setIsAdmin={setIsAdmin} fireConfetti={fireConfetti} onRefresh={() => pullFixtures(true)} fxStatus={fxStatus} />}

      <div className="tabs">
        {TABS.map(([k, ic, lab]) => (
          <button key={k} className={`tab ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); if (k === "home" || k === "picks") pullFixtures(false); }}>
            <span className="ic">{ic}</span>{lab}
          </button>
        ))}
      </div>
    </div>
  );
}
