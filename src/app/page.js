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
.tabs{position:fixed;bottom:0;left:0;right:0;z-index:50;display:flex;gap:2px;overflow-x:auto;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;
  background:rgba(7,13,10,.97);border-top:1px solid rgba(201,168,76,.3);padding:6px 8px calc(6px + env(safe-area-inset-bottom));
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 14px,#000 calc(100% - 14px),transparent);mask-image:linear-gradient(90deg,transparent,#000 14px,#000 calc(100% - 14px),transparent);}
.tabs::-webkit-scrollbar{height:0;}
.tab{flex:0 0 auto;scroll-snap-align:center;min-width:62px;background:none;border:none;color:var(--muted);cursor:pointer;
  font-family:'Barlow Condensed';font-size:11px;letter-spacing:.08em;text-transform:uppercase;
  display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 8px;border-radius:10px;transition:background .15s;}
.tab .ic{font-size:19px;}
.tab.on{color:var(--gold-bright);background:rgba(240,201,58,.1);}
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
.pickbtn{position:relative;}
.pickbtn.sel{animation:stamp .28s cubic-bezier(.2,1.6,.4,1);}
@keyframes stamp{0%{transform:scale(1.18)}100%{transform:scale(1)}}
.pickbtn.sel::after{content:"";position:absolute;inset:-3px;border:2px solid var(--gold-bright);border-radius:11px;animation:ringOut .55s ease forwards;pointer-events:none;}
@keyframes ringOut{0%{opacity:.9;transform:scale(.95)}100%{opacity:0;transform:scale(1.28)}}
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
.calledit{margin-top:10px;text-align:center;font-family:'Bebas Neue';letter-spacing:.1em;font-size:19px;color:var(--gold-bright);animation:calledIn .6s cubic-bezier(.2,1.4,.4,1), goldPulse 2s ease-in-out infinite;}
@keyframes calledIn{0%{transform:translateY(10px) scale(.8);opacity:0}100%{transform:none;opacity:1}}
.payout{position:fixed;inset:0;z-index:300;background:rgba(5,8,6,.93);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;animation:payIn .25s ease;cursor:pointer;}
@keyframes payIn{from{opacity:0}to{opacity:1}}
.payout-card{text-align:center;padding:32px 40px;animation:cardPop .5s cubic-bezier(.2,1.5,.4,1);}
@keyframes cardPop{0%{transform:scale(.65);opacity:0}100%{transform:scale(1);opacity:1}}
.payout-label{font-family:'Barlow Condensed';letter-spacing:.32em;color:var(--muted);font-size:14px;text-transform:uppercase;}
.payout-pts{font-family:'Bebas Neue';font-size:88px;line-height:1.05;color:var(--gold-bright);animation:goldPulse 1.4s ease-in-out infinite;}
.payout-win{font-size:14px;color:#bdf3d2;padding:3px 0;}
.payout-tap{margin-top:20px;font-size:11px;color:var(--muted);letter-spacing:.25em;text-transform:uppercase;}
.pickflash{position:fixed;inset:0;z-index:280;display:flex;align-items:center;justify-content:center;pointer-events:none;}
.pickflash .pf-inner{text-align:center;animation:pfPop 1.15s cubic-bezier(.2,1.5,.4,1) forwards;}
.pickflash .pf-flag{font-size:64px;line-height:1;display:block;}
.pickflash .pf-text{font-family:'Bebas Neue';font-size:clamp(40px,9vw,72px);letter-spacing:.08em;color:var(--gold-bright);text-shadow:0 0 30px rgba(240,201,58,.85),0 4px 18px rgba(0,0,0,.7);}
@keyframes pfPop{0%{opacity:0;transform:scale(.5)}14%{opacity:1;transform:scale(1.08)}24%{transform:scale(1)}78%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.06) translateY(-12px)}}
.gt-head,.gt-row{display:grid;grid-template-columns:22px 1fr 26px 26px 26px 26px 34px 34px;gap:4px;align-items:center;padding:5px 10px;font-size:12px;}
.gt-head{font-family:'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-size:10px;padding-bottom:2px;}
.gt-row{border-top:1px dashed rgba(138,170,150,.15);}
.gt-row .pos{font-family:'Bebas Neue';color:var(--gold-bright);font-size:15px;}
.gt-row .pts{font-family:'Bebas Neue';font-size:16px;color:var(--gold-bright);text-align:right;}
.gt-row .num{text-align:right;color:var(--muted);font-variant-numeric:tabular-nums;}
.gt-row.q{background:rgba(45,110,71,.18);}
.gt-title{font-family:'Bebas Neue';font-size:18px;letter-spacing:.08em;padding:8px 10px 2px;color:var(--white);}
.pname{cursor:pointer;border-bottom:1px dotted rgba(201,168,76,.5);}
.modal-bg{position:fixed;inset:0;z-index:320;background:rgba(5,6,7,.86);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:18px;animation:payIn .2s ease;}
.modal{width:100%;max-width:440px;max-height:88vh;overflow-y:auto;background:linear-gradient(180deg,#141417,#0d0d10);border:1px solid rgba(201,168,76,.4);border-radius:18px;padding:0;animation:cardPop .4s cubic-bezier(.2,1.5,.4,1);}
.modal-hero{position:relative;padding:24px 20px 18px;border-radius:18px 18px 0 0;border-bottom:1px solid rgba(201,168,76,.25);overflow:hidden;}
.modal-hero .close{position:absolute;top:12px;right:14px;background:rgba(0,0,0,.35);border:none;color:#fff;font-size:20px;width:30px;height:30px;border-radius:50%;cursor:pointer;line-height:1;}
.modal-avatar{font-size:54px;line-height:1;}
.modal-name{font-family:'Bebas Neue';font-size:34px;letter-spacing:.05em;margin-top:6px;}
.modal-sub{font-family:'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-size:13px;}
.modal-tag{font-style:italic;color:#d8d4c6;margin-top:8px;font-size:14px;}
.stat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:16px 18px;}
.stat-box{background:#0e0e11;border:1px solid #232326;border-radius:10px;padding:10px;text-align:center;}
.stat-box .v{font-family:'Bebas Neue';font-size:26px;color:var(--gold-bright);}
.stat-box .l{font-family:'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;font-size:10px;color:var(--muted);}
.edit-row{padding:0 18px 8px;}
.edit-row label{display:block;font-family:'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;font-size:11px;color:var(--muted);margin:8px 0 3px;}
.edit-row input{width:100%;}
.swatches{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;}
.swatch{width:30px;height:30px;border-radius:50%;cursor:pointer;border:2px solid transparent;}
.swatch.on{border-color:#fff;}
.shame-card{background:linear-gradient(180deg,#1a1012,#120c0d);border:1px solid rgba(230,57,70,.4);border-radius:14px;padding:14px;margin-bottom:12px;}
.shame-card .who{display:flex;align-items:center;gap:8px;}
.shame-card .who .av{font-size:26px;}
.shame-card .who .nm{font-family:'Bebas Neue';font-size:20px;letter-spacing:.04em;}
.shame-badge{margin-left:auto;font-family:'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase;font-size:10px;color:#f1a0a7;border:1px solid rgba(230,57,70,.5);border-radius:999px;padding:2px 9px;}
.shame-desc{color:#e7c9cc;font-size:13px;margin:8px 0;line-height:1.5;}
.react-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px;}
.react-btn{background:#1c1416;border:1px solid #3a2629;border-radius:999px;padding:4px 10px;font-size:15px;cursor:pointer;transition:transform .1s;}
.react-btn:hover{transform:scale(1.15);}
.react-tally{background:rgba(230,57,70,.14);border:1px solid rgba(230,57,70,.45);border-radius:999px;padding:3px 9px;font-size:13px;}
.shame-comments{margin-top:10px;border-top:1px dashed rgba(230,57,70,.25);padding-top:8px;}
.shame-comment{font-size:13px;padding:3px 0;}
.shame-comment b{color:var(--gold-bright);}
.comment-box{display:flex;gap:6px;margin-top:8px;}
.comment-box input{flex:1;}
.more-bg{position:fixed;inset:0;z-index:60;background:rgba(5,6,7,.6);backdrop-filter:blur(3px);animation:payIn .2s ease;}
.more-sheet{position:fixed;bottom:0;left:0;right:0;z-index:61;background:linear-gradient(180deg,#141417,#0c0c0e);border-top:1px solid rgba(201,168,76,.35);border-radius:18px 18px 0 0;padding:10px 16px calc(18px + env(safe-area-inset-bottom));animation:sheetUp .28s cubic-bezier(.2,1.3,.4,1);}
@keyframes sheetUp{0%{transform:translateY(100%)}100%{transform:translateY(0)}}
.more-grip{width:40px;height:4px;border-radius:2px;background:rgba(255,255,255,.25);margin:2px auto 12px;}
.more-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.more-item{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 8px;background:#0e0e11;border:1px solid #232326;border-radius:12px;color:var(--muted);font-family:'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;font-size:13px;cursor:pointer;}
.more-item.on{border-color:var(--gold);color:var(--gold-bright);}
.more-ic{font-size:24px;}
.md-section{font-family:'Barlow Condensed';letter-spacing:.14em;text-transform:uppercase;font-size:12px;color:var(--muted);margin:16px 0 8px;}
.md-formation{display:flex;justify-content:space-between;font-family:'Bebas Neue';font-size:20px;color:var(--gold-bright);padding:0 4px;}
.lineup-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.xi-col{background:#0e0e11;border:1px solid #232326;border-radius:10px;padding:8px;}
.xi-team{font-family:'Bebas Neue';font-size:16px;letter-spacing:.04em;padding:2px 4px 6px;border-bottom:1px solid #232326;margin-bottom:4px;}
.xi-p{display:flex;align-items:center;gap:8px;font-size:12px;padding:3px 4px;}
.xi-num{font-family:'Barlow Condensed';color:var(--gold-bright);min-width:22px;text-align:center;font-size:13px;}
.xi-pos{margin-left:auto;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;}
.ev-row{display:flex;align-items:center;gap:8px;font-size:13px;padding:5px 6px;border-bottom:1px dashed rgba(138,170,150,.12);}
.ev-min{font-family:'Bebas Neue';color:var(--gold-bright);min-width:34px;}
.scorer-line{display:flex;gap:8px;align-items:center;background:#0e0e11;border:1px solid #232326;border-radius:8px;padding:7px 10px;margin-bottom:5px;font-size:13px;}
.scorer-rank{font-family:'Bebas Neue';color:var(--gold-bright);font-size:16px;min-width:22px;}
.scorer-goals{margin-left:auto;font-family:'Bebas Neue';color:var(--gold-bright);font-size:18px;}
.tap-match{cursor:pointer;}
.tap-match:active{transform:scale(.995);}
.date-strip{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 12px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;}
.date-strip::-webkit-scrollbar{height:0;}
.date-chip{flex:0 0 auto;scroll-snap-align:center;width:62px;padding:8px 4px;border-radius:12px;border:1px solid #232326;background:#121214;color:var(--muted);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;transition:all .15s;position:relative;}
.date-chip:hover{border-color:rgba(201,168,76,.5);}
.date-chip.on{background:linear-gradient(160deg,#2a2008,#1c1405);border-color:var(--gold);color:var(--gold-bright);box-shadow:0 0 14px rgba(240,201,58,.3);}
.dc-dow{font-family:'Barlow Condensed';letter-spacing:.1em;font-size:10px;text-transform:uppercase;}
.dc-day{font-family:'Bebas Neue';font-size:22px;line-height:1;}
.dc-mon{font-family:'Barlow Condensed';font-size:10px;text-transform:uppercase;letter-spacing:.08em;opacity:.8;}
.dc-cnt{position:absolute;top:-5px;right:-3px;background:var(--pitch-light);color:#fff;font-size:9px;font-weight:700;min-width:15px;height:15px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 3px;}
.date-chip.on .dc-cnt{background:var(--gold-bright);color:#1a1405;}
.tab-more{position:relative;}
.tab-more .more-glow{position:absolute;top:2px;right:14px;width:6px;height:6px;border-radius:50%;background:var(--gold-bright);box-shadow:0 0 8px var(--gold-bright);}
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

// Flag colours per country — used for pick-celebration confetti
const COUNTRY_COLORS = {
  "Argentina":["#75AADB","#ffffff","#F6B40E"],"France":["#0055A4","#ffffff","#EF4135"],
  "Spain":["#AA151B","#F1BF00"],"England":["#ffffff","#CE1124"],"Brazil":["#009C3B","#FFDF00","#002776"],
  "Portugal":["#046A38","#DA291C","#FFE900"],"Netherlands":["#FF7F00","#21468B","#ffffff"],
  "Belgium":["#2D2926","#FFCD00","#C8102E"],"Germany":["#000000","#DD0000","#FFCE00"],
  "Croatia":["#FF0000","#ffffff","#171796"],"Italy":["#008C45","#ffffff","#CD212A"],
  "Morocco":["#C1272D","#006233"],"USA":["#B22234","#ffffff","#3C3B6E"],"United States":["#B22234","#ffffff","#3C3B6E"],
  "Mexico":["#006847","#ffffff","#CE1126"],"Canada":["#FF0000","#ffffff"],"Japan":["#ffffff","#BC002D"],
  "South Korea":["#ffffff","#CD2E3A","#0047A0"],"Korea Republic":["#ffffff","#CD2E3A","#0047A0"],
  "Australia":["#00843D","#FFCD00"],"Senegal":["#00853F","#FDEF42","#E31B23"],
  "Ecuador":["#FFDD00","#034EA2","#ED1C24"],"Uruguay":["#7BAFD4","#ffffff","#FCD116"],
  "Colombia":["#FCD116","#003893","#CE1126"],"Switzerland":["#DA291C","#ffffff"],
  "Denmark":["#C8102E","#ffffff"],"Poland":["#ffffff","#DC143C"],"Serbia":["#C6363C","#0C4076","#ffffff"],
  "Ghana":["#CE1126","#FCD116","#006B3F"],"Cameroon":["#007A5E","#CE1126","#FCD116"],
  "Tunisia":["#E70013","#ffffff"],"Algeria":["#006233","#ffffff","#D21034"],
  "Egypt":["#CE1126","#ffffff","#000000"],"Nigeria":["#008751","#ffffff"],
  "Saudi Arabia":["#006C35","#ffffff"],"Qatar":["#8A1538","#ffffff"],
  "Iran":["#239F40","#ffffff","#DA0000"],"IR Iran":["#239F40","#ffffff","#DA0000"],
  "Norway":["#BA0C2F","#ffffff","#00205B"],"Sweden":["#006AA7","#FECC02"],
  "Austria":["#ED2939","#ffffff"],"Ukraine":["#0057B7","#FFD700"],"Turkey":["#E30A17","#ffffff"],
  "Scotland":["#0065BF","#ffffff"],"Wales":["#C8102E","#00B140","#ffffff"],
  "Paraguay":["#D52B1E","#ffffff","#0038A8"],"Peru":["#D91023","#ffffff"],
  "Costa Rica":["#CE1126","#ffffff","#002B7F"],"Panama":["#DA121A","#ffffff","#072357"],
  "Jamaica":["#009B3A","#FED100","#000000"],"New Zealand":["#000000","#ffffff"],
  "Uzbekistan":["#1EB53A","#0099B5","#ffffff"],"Jordan":["#007A3D","#ffffff","#CE1126","#000000"],
  "Cape Verde":["#003893","#ffffff","#F7D116","#CF2027"],"Ivory Coast":["#FF8200","#ffffff","#009A44"],
};
const HYPE = ["LET'S GO!", "HERE WE GO!", "LOCKED IN!", "BET PLACED!", "STAMPED!"];

const DEFAULT_GAME = {
  config: { groupName: "PRIVATE LEAGUE", buyIn: 20, adminPass: "wc2026", final8Open: false, currency: "S$" },
  players: [], teams: [], matches: [], picks: {}, underdog: {}, final8: {}, shame: {},
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
    if (am.homeTeam.id && !tA.apiTeamId) tA.apiTeamId = String(am.homeTeam.id);
    let tB = g.teams.find((t) => t.name === nameB);
    if (!tB) { tB = { id: uid(), name: nameB, flag: flagFor(nameB), eligible: true, furthest: "none", wonAll3: false }; g.teams.push(tB); }
    if (am.awayTeam.id && !tB.apiTeamId) tB.apiTeamId = String(am.awayTeam.id);
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
    const adjust = Number(p.adjust) || 0; // manual admin points (late joiners, corrections)
    return { p, daily, groupDaily, koDaily, udTeam, udPts, udGroupPts, f8Team, f8Pts, adjust,
      knockout: koDaily + f8Pts, total: daily + udPts + f8Pts + adjust };
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
function Confetti({ burst, colors }) {
  if (!burst) return null;
  if (!colors || !colors.length) colors = ["#f0c93a", "#c9a84c", "#4fc3f7", "#2d6e47", "#ffffff", "#e63946"];
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 52 }).map((_, i) => (
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

// name → group letter, derived from the built-in WC_TEAMS map
const TEAM_GROUP = Object.fromEntries(Object.values(WC_TEAMS).map(([name, , grp]) => [name, grp]));

// Compute group tables locally from finished group-stage results (no API needed).
function computeGroupTables(game) {
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const groupMatches = game.matches.filter((m) => m.stage === "GROUP" && m.status !== "void");
  const tbl = {}; // group letter -> { teamId -> row }
  const ensure = (grp, tid) => {
    if (!tbl[grp]) tbl[grp] = {};
    if (!tbl[grp][tid]) { const t = tById[tid]; tbl[grp][tid] = { team: t, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 }; }
    return tbl[grp][tid];
  };
  for (const m of groupMatches) {
    const a = tById[m.teamA], b = tById[m.teamB];
    if (!a || !b) continue;
    const grp = TEAM_GROUP[a.name] || TEAM_GROUP[b.name];
    if (!grp) continue;
    // register both teams even before they've played, so tables show full group
    const ra = ensure(grp, m.teamA), rb = ensure(grp, m.teamB);
    if (m.status !== "finished" || m.scoreA == null || m.scoreB == null) continue;
    ra.P++; rb.P++; ra.GF += m.scoreA; ra.GA += m.scoreB; rb.GF += m.scoreB; rb.GA += m.scoreA;
    if (m.scoreA > m.scoreB) { ra.W++; ra.Pts += 3; rb.L++; }
    else if (m.scoreA < m.scoreB) { rb.W++; rb.Pts += 3; ra.L++; }
    else { ra.D++; rb.D++; ra.Pts++; rb.Pts++; }
  }
  return Object.keys(tbl).sort().map((grp) => ({
    group: grp,
    rows: Object.values(tbl[grp]).sort((x, y) =>
      y.Pts - x.Pts || (y.GF - y.GA) - (x.GF - x.GA) || y.GF - x.GF || (x.team?.name || "").localeCompare(y.team?.name || "")),
  }));
}

function SquadView({ apiKey, team, flag }) {
  const [open, setOpen] = useState(false);
  const [squad, setSquad] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const load = async () => {
    if (squad || !team?.apiTeamId) { setOpen((o) => !o); return; }
    setOpen(true); setLoading(true); setErr("");
    try {
      const r = await fetch(`/api/fixtures?key=${encodeURIComponent(apiKey)}&type=squad&teamId=${encodeURIComponent(team.apiTeamId)}`);
      const pl = await r.json().catch(() => ({}));
      if (pl.error) setErr(pl.error); else setSquad(pl.team?.squad || []);
    } catch (e) { setErr("Couldn't load squad."); }
    setLoading(false);
  };
  if (!team?.apiTeamId) return null;
  const byPos = {};
  (squad || []).forEach((p) => { const pos = p.position || "Other"; (byPos[pos] = byPos[pos] || []).push(p); });
  return (
    <div style={{ marginTop: 8 }}>
      <button className="btn btn-ghost" style={{ width: "100%", fontSize: 12 }} onClick={load}>
        {open ? "▲ Hide" : "▼ View"} {flag} {team.name} squad
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          {loading && <div className="lockline">Loading squad…</div>}
          {err && <div className="note" style={{ color: "var(--danger)" }}>{err}</div>}
          {squad && Object.entries(byPos).map(([pos, players]) => (
            <div key={pos}>
              <div className="md-section" style={{ margin: "8px 0 4px" }}>{pos}</div>
              {players.map((pl) => (
                <div className="xi-p" key={pl.id}><span className="xi-num">{pl.shirtNumber ?? "–"}</span><span>{pl.name}</span><span className="xi-pos">{pl.nationality || ""}</span></div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchDetailModal({ game, match, onClose }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const a = tById[match.teamA], b = tById[match.teamB];

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!match.apiId || !game.config.apiKey) { setLoading(false); setErr("No live detail for manually-added matches."); return; }
      try {
        const r = await fetch(`/api/fixtures?key=${encodeURIComponent(game.config.apiKey)}&type=match&matchId=${encodeURIComponent(match.apiId)}`);
        const pl = await r.json().catch(() => ({}));
        if (!alive) return;
        if (pl.error) setErr(pl.error);
        else setData(pl.match);
      } catch (e) { if (alive) setErr("Couldn't load match detail."); }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [match, game.config.apiKey]);

  const ht = data?.homeTeam, at = data?.awayTeam;
  const goals = data?.goals || [];
  const bookings = data?.bookings || [];
  const subs = data?.substitutions || [];
  const events = [
    ...goals.map((g) => ({ min: g.minute, icon: "⚽", text: `${g.scorer?.name || "Goal"}${g.assist ? ` (assist ${g.assist.name})` : ""}`, team: g.team?.name })),
    ...bookings.map((bk) => ({ min: bk.minute, icon: bk.card === "RED" || bk.card === "RED_CARD" ? "🟥" : "🟨", text: bk.player?.name || "Booking", team: bk.team?.name })),
    ...subs.map((su) => ({ min: su.minute, icon: "🔁", text: `${su.playerIn?.name || "?"} for ${su.playerOut?.name || "?"}`, team: su.team?.name })),
  ].filter((e) => e.min != null).sort((x, y) => x.min - y.min);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hero">
          <button className="close" onClick={onClose} aria-label="close">×</button>
          <div className="face" style={{ marginTop: 6 }}>
            <div className="team"><span className="fl">{a?.flag}</span><span className="nm">{a?.name}</span></div>
            {(match.status === "finished" || match.live) && match.scoreA != null
              ? <div className="score">{match.scoreA} – {match.scoreB}</div> : <div className="vs">VS</div>}
            <div className="team"><span className="fl">{b?.flag}</span><span className="nm">{b?.name}</span></div>
          </div>
          <div className="modal-sub" style={{ textAlign: "center", marginTop: 6 }}>{STAGE_LABEL[match.stage]} · {match.live ? "LIVE" : match.status === "finished" ? "Full time" : fmtTime(match.kickoff)}</div>
        </div>

        <div style={{ padding: "4px 16px 18px" }}>
          {loading && <div className="lockline">Loading match centre…</div>}
          {err && <div className="note" style={{ color: "var(--danger)" }}>{err}</div>}

          {events.length > 0 && <>
            <div className="md-section">Match events</div>
            {events.map((e, i) => <div key={i} className="ev-row"><span className="ev-min">{e.min}'</span><span>{e.icon}</span><span>{e.text}</span><span className="xi-pos">{e.team}</span></div>)}
          </>}

          {(ht?.lineup?.length > 0 || at?.lineup?.length > 0) && <>
            <div className="md-section">Line-ups</div>
            <div className="md-formation"><span>{ht?.formation || ""}</span><span>{at?.formation || ""}</span></div>
            <div className="lineup-grid" style={{ marginTop: 6 }}>
              {[ht, at].map((tm, idx) => (
                <div className="xi-col" key={idx}>
                  <div className="xi-team">{(idx === 0 ? a?.flag : b?.flag)} {tm?.name || ""}</div>
                  {(tm?.lineup || []).map((pl) => (
                    <div className="xi-p" key={pl.id}><span className="xi-num">{pl.shirtNumber ?? "–"}</span><span>{pl.name}</span><span className="xi-pos">{(pl.position || "").slice(0, 3)}</span></div>
                  ))}
                  {(tm?.bench?.length > 0) && <>
                    <div className="xi-team" style={{ marginTop: 8, fontSize: 13 }}>Bench</div>
                    {tm.bench.slice(0, 9).map((pl) => <div className="xi-p" key={pl.id} style={{ opacity: .7 }}><span className="xi-num">{pl.shirtNumber ?? "–"}</span><span>{pl.name}</span></div>)}
                  </>}
                </div>
              ))}
            </div>
          </>}

          {!loading && !err && events.length === 0 && (!ht?.lineup?.length) && (
            <div className="note">Line-ups appear about an hour before kick-off. Events fill in as the match plays. Full squads below.</div>
          )}

          {game.config.apiKey && (
            <>
              <div className="md-section">Squads</div>
              <SquadView apiKey={game.config.apiKey} team={a} flag={a?.flag} />
              <SquadView apiKey={game.config.apiKey} team={b} flag={b?.flag} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TopScorers({ game }) {
  const [scorers, setScorers] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!game.config.apiKey) return;
      try {
        const r = await fetch(`/api/fixtures?key=${encodeURIComponent(game.config.apiKey)}&type=scorers`);
        const pl = await r.json().catch(() => ({}));
        if (!alive) return;
        if (pl.error) setErr(pl.error); else setScorers(pl.scorers || []);
      } catch (e) { if (alive) setErr("Couldn't load scorers."); }
    })();
    return () => { alive = false; };
  }, [game.config.apiKey]);

  if (!scorers || scorers.length === 0) return null;
  return (
    <>
      <div className="h-sec">Golden Boot race</div>
      {scorers.slice(0, 10).map((sc, i) => (
        <div className="scorer-line" key={i}>
          <span className="scorer-rank">{i + 1}</span>
          <span>{flagFor(sc.player?.nationality)} {sc.player?.name}</span>
          <span className="xi-pos">{sc.team?.name}</span>
          <span className="scorer-goals">{sc.goals}</span>
        </div>
      ))}
    </>
  );
}

// Horizontal scrollable date picker — every matchday with games
function DateStrip({ game, selected, onSelect }) {
  const days = useMemo(() => {
    const set = new Map();
    for (const m of game.matches) {
      if (m.status === "void") continue;
      const d = new Date(m.kickoff); const key = d.toDateString();
      if (!set.has(key)) set.set(key, { key, date: d, count: 0 });
      set.get(key).count++;
    }
    return [...set.values()].sort((a, b) => a.date - b.date);
  }, [game.matches]);
  const todayStr = new Date().toDateString();
  const ref = useRef(null);
  useEffect(() => {
    // auto-scroll the selected chip into view
    const el = ref.current?.querySelector(".date-chip.on");
    if (el) el.scrollIntoView({ inline: "center", block: "nearest" });
  }, [selected]);
  if (days.length === 0) return null;
  return (
    <div className="date-strip" ref={ref}>
      {days.map((d) => {
        const isToday = d.key === todayStr;
        return (
          <button key={d.key} className={`date-chip ${selected === d.key ? "on" : ""}`} onClick={() => onSelect(d.key)}>
            <span className="dc-dow">{isToday ? "TODAY" : d.date.toLocaleDateString(undefined, { weekday: "short" })}</span>
            <span className="dc-day">{d.date.getDate()}</span>
            <span className="dc-mon">{d.date.toLocaleDateString(undefined, { month: "short" })}</span>
            <span className="dc-cnt">{d.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function TodayPage({ game, me, go }) {
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  useTick(true);
  const now = Date.now();
  const [selDate, setSelDate] = useState(new Date().toDateString());
  const todays = game.matches.filter((m) => m.status !== "void" && new Date(m.kickoff).toDateString() === selDate)
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  const selObj = new Date(selDate);
  const isToday = selDate === new Date().toDateString();

  return (
    <div className="page">
      <div className="hero" style={{ padding: "20px 16px" }}>
        <h1 style={{ fontSize: "clamp(30px,7vw,52px)" }}>{isToday ? "TODAY" : selObj.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase()}</h1>
        <div className="sub">{selObj.toLocaleDateString(undefined, { day: "numeric", month: "long" })}</div>
      </div>
      <DateStrip game={game} selected={selDate} onSelect={setSelDate} />
      {todays.length === 0 ? (
        <div className="panel muted" style={{ marginTop: 8 }}>No matches on this day. Swipe the dates above to find fixtures.</div>
      ) : todays.map((m) => {
        const a = tById[m.teamA], b = tById[m.teamB];
        const lockAt = new Date(m.kickoff).getTime() - 7200000;
        const locked = now >= lockAt || m.status === "finished";
        const myPick = me ? game.picks[m.id]?.[me.id] : null;
        const myLabel = myPick ? (myPick.pred === "A" ? a?.name : myPick.pred === "B" ? b?.name : "Draw") : null;
        const isLive = m.live || (m.status !== "finished" && now >= new Date(m.kickoff).getTime() && now < new Date(m.kickoff).getTime() + 2.2 * 3600000);
        return (
          <div className={`match tap-match ${isLive ? "live-card" : ""}`} key={m.id} onClick={() => openMatchDetail(m)}>
            <div className="meta">
              <span>{STAGE_LABEL[m.stage]}</span>
              {isLive ? <span className="live"><span className="dot" />LIVE</span>
                : m.status === "finished" ? <span>FULL TIME</span> : <span>{new Date(m.kickoff).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>}
            </div>
            <div className="face">
              <div className="team"><span className="fl">{a?.flag}</span><span className="nm">{a?.name}</span></div>
              {(m.status === "finished" || (isLive && m.scoreA != null)) ? <div className="score">{m.scoreA} – {m.scoreB}</div> : <div className="vs">VS</div>}
              <div className="team"><span className="fl">{b?.flag}</span><span className="nm">{b?.name}</span></div>
            </div>
            <div className="lockline" style={{ marginTop: 8 }}>
              {myPick ? <span style={{ color: "var(--gold-bright)" }}>Your pick: {myLabel}</span>
                : locked ? <span style={{ color: "var(--danger)" }}>Picks locked — you didn't pick</span>
                : <span>Tap a match for line-ups · pick on the Picks tab</span>}
            </div>
          </div>
        );
      })}
      {todays.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button className="btn btn-gold" onClick={() => go("picks")}>Make today's picks →</button>
        </div>
      )}
    </div>
  );
}

function LiveScoresPage({ game, onRefresh }) {
  const key = game.config.apiKey;
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  useTick(true);
  const now = Date.now();
  const live = game.matches.filter((m) => m.live && m.status !== "void");
  const groupTables = computeGroupTables(game);
  const KO_ORDER = ["R32", "R16", "QF", "SF", "FINAL"];
  const ko = KO_ORDER.map((st) => [st, game.matches.filter((m) => m.stage === st && m.status !== "void")
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))]).filter(([, ms]) => ms.length > 0);

  return (
    <div className="page">
      {!key && <div className="banner">Add your football-data.org API key in Admin to power live scores and tables.</div>}
      <div className="h-sec">Live now</div>
      {live.length === 0 ? <div className="panel muted">No matches in play right now. The pitch rests.</div> :
        live.map((m) => {
          const a = tById[m.teamA], b = tById[m.teamB];
          return (
            <div className="match live-card tap-match" key={m.id} onClick={() => openMatchDetail(m)}>
              <div className="meta"><span>{STAGE_LABEL[m.stage]}</span><span className="live"><span className="dot" />LIVE</span></div>
              <div className="face">
                <div className="team"><span className="fl">{a?.flag}</span><span className="nm">{a?.name}</span></div>
                <div className="score">{m.scoreA ?? 0} – {m.scoreB ?? 0}</div>
                <div className="team"><span className="fl">{b?.flag}</span><span className="nm">{b?.name}</span></div>
              </div>
            </div>
          );
        })}

      <div className="h-sec">Group tables</div>
      {groupTables.length === 0 && <div className="panel muted">Tables build automatically as group-stage results come in.</div>}
      <div className="grid2">
        {groupTables.map((g) => (
          <div className="panel" style={{ padding: "8px 4px" }} key={g.group}>
            <div className="gt-title">Group {g.group}</div>
            <div className="gt-head"><span>#</span><span>Team</span><span className="num">P</span><span className="num">W</span><span className="num">D</span><span className="num">L</span><span className="num">GD</span><span className="num">Pts</span></div>
            {g.rows.map((row, i) => {
              const gd = row.GF - row.GA;
              return (
                <div className={`gt-row ${i < 2 ? "q" : ""}`} key={row.team?.id || i}>
                  <span className="pos">{i + 1}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.team?.flag} {row.team?.name}</span>
                  <span className="num">{row.P}</span>
                  <span className="num">{row.W}</span>
                  <span className="num">{row.D}</span>
                  <span className="num">{row.L}</span>
                  <span className="num">{gd > 0 ? `+${gd}` : gd}</span>
                  <span className="pts">{row.Pts}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {groupTables.length > 0 && <div className="note">Top two in each group (highlighted) plus the best third-placed teams advance. Sorted by points → goal difference → goals scored.</div>}

      <div className="h-sec">Knockout road</div>
      {ko.length === 0 && <div className="panel muted">Knockout fixtures land here once the group stage decides them.</div>}
      {ko.map(([st, ms]) => (
        <div key={st}>
          <div className="gt-title" style={{ padding: "8px 0 4px" }}>{STAGE_LABEL[st]}</div>
          {ms.map((m) => {
            const a = tById[m.teamA], b = tById[m.teamB];
            const isLive = m.live;
            return (
              <div className={`match tap-match ${isLive ? "live-card" : ""}`} key={m.id} onClick={() => openMatchDetail(m)}>
                <div className="meta"><span>{STAGE_LABEL[m.stage]}</span>
                  {isLive ? <span className="live"><span className="dot" />LIVE</span>
                    : m.status === "finished" ? <span>FULL TIME</span> : <span>{fmtTime(m.kickoff)}</span>}
                </div>
                <div className="face">
                  <div className="team"><span className="fl">{a?.flag}</span><span className="nm">{a?.name}</span></div>
                  {(m.status === "finished" || (isLive && m.scoreA != null)) ? <div className="score">{m.scoreA} – {m.scoreB}</div> : <div className="vs">VS</div>}
                  <div className="team"><span className="fl">{b?.flag}</span><span className="nm">{b?.name}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <TopScorers game={game} />
      <div className="note">Tap any match above for line-ups, formations and a full event timeline.</div>
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={() => onRefresh && onRefresh()}>Refresh scores & tables</button>
      </div>
    </div>
  );
}

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
            <div className="bebas pname" style={{ fontSize: 22, marginTop: 4 }} onClick={() => openProfile(r.p.id)}>{r.p.name}</div>
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

function PicksPage({ game, me, mutate, fxStatus, onRefresh, onPickCelebrate }) {
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  useTick(true);
  const now = Date.now();
  // default to today if it has games, else the next matchday
  const defaultDay = useMemo(() => {
    const t = new Date().toDateString();
    const future = game.matches.filter((m) => m.status !== "void" && new Date(m.kickoff) >= new Date(new Date().toDateString()))
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    const hasToday = game.matches.some((m) => m.status !== "void" && new Date(m.kickoff).toDateString() === t);
    return hasToday ? t : (future[0] ? new Date(future[0].kickoff).toDateString() : t);
  }, [game.matches]);
  const [selDate, setSelDate] = useState(defaultDay);
  const matches = game.matches.filter((m) => m.status !== "void" && new Date(m.kickoff).toDateString() === selDate)
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

  const setPick = (m, patch) => {
    if (patch.pred && onPickCelebrate) {
      const t = patch.pred === "A" ? tById[m.teamA] : patch.pred === "B" ? tById[m.teamB] : null;
      onPickCelebrate(t);
    }
    return mutate((g) => {
    // hard guard: no pick changes within 1 min of kickoff, even if the UI lagged
    if (Date.now() >= new Date(m.kickoff).getTime() - 7200000) return;
    if (!g.picks[m.id]) g.picks[m.id] = {};
    const cur = g.picks[m.id][me.id] || { pred: null, sa: "", sb: "", at: Date.now() };
    g.picks[m.id][me.id] = { ...cur, ...patch, at: Date.now() };
  });
  };

  return (
    <div className="page">
      <div className="h-sec">Daily picks</div>
      <DateStrip game={game} selected={selDate} onSelect={setSelDate} />
      {!me && <div className="banner">Select your player in the top bar to make picks.</div>}
      {matches.length === 0 && <div className="panel muted">No matches on this day — swipe the dates above.</div>}
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
            {m.status === "finished" && myPick && myPick.pred === res && (
              <div className="calledit">✓ CALLED IT · +{pickPoints(m, myPick)} PTS</div>
            )}
            {locked && m.status !== "void" && (
              <div className="others">
                {game.players.map((p) => {
                  const pk = game.picks[m.id]?.[p.id];
                  const lab = pk ? (pk.pred === "A" ? a?.name : pk.pred === "B" ? b?.name : "Draw") : "—";
                  const pts = pickPoints(m, pk);
                  const cls = m.status === "finished" && pk ? (pk.pred === res ? "chip ok" : "chip bad") : "chip";
                  return <span key={p.id} className={cls} style={{ cursor: "pointer" }} onClick={() => openProfile(p.id)}>{p.avatar} {p.name}: {lab}
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
          <span><span className="pname" onClick={() => openProfile(r.p.id)}>{r.p.avatar} {r.p.name}</span> <span className="muted" style={{ fontSize: 12 }}>{r.udTeam ? `· ${r.udTeam.flag} ${r.udTeam.name}` : "· no pick"}</span></span>
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
            <span><span className="pname" onClick={() => openProfile(r.p.id)}>{r.p.avatar} {r.p.name}</span> <span className="muted" style={{ fontSize: 12 }}>({r.udGroupPts} ud pts)</span></span>
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
            <span><span className="pname" onClick={(e) => { e.stopPropagation(); openProfile(r.p.id); }}>{r.p.avatar} {r.p.name}</span> <span style={{ fontSize: 13 }}>{contention(r)}</span>{streakFor(game, r.p.id) >= 2 && <span style={{ fontSize: 12 }}> 🔥{streakFor(game, r.p.id)}</span>}</span>
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
                Group daily: {r.groupDaily} · Knockout daily: {r.koDaily}{r.adjust ? ` · Bonus/adjust: ${r.adjust > 0 ? "+" : ""}${r.adjust}` : ""}
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
        <div style={{ marginTop: 12 }}>
          {game.players.map((p) => {
            const row = computeStandings(game).find((r) => r.p.id === p.id);
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "8px 0", borderBottom: "1px dashed rgba(138,170,150,.15)" }}>
                <span style={{ minWidth: 130, fontSize: 14 }}>{p.avatar} {p.name}{p.pin ? " 🔒" : ""}</span>
                <span className="muted barlow" style={{ fontSize: 11 }}>{row?.total ?? 0} pts total</span>
                <label className="barlow muted" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                  Bonus/adjust
                  <input style={{ width: 64 }} inputMode="numeric" defaultValue={p.adjust || 0}
                    onBlur={(e) => mutate((g) => { const gp = g.players.find((x) => x.id === p.id); if (gp) gp.adjust = Number(e.target.value) || 0; })} />
                </label>
                {p.pin && <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }}
                  onClick={() => { if (confirm(`Reset ${p.name}'s PIN? They'll set a new one next time they select their name.`)) mutate((g) => { const gp = g.players.find((x) => x.id === p.id); if (gp) delete gp.pin; }); }}>Reset PIN</button>}
                <button className="btn btn-danger" style={{ padding: "3px 8px", fontSize: 11 }}
                  onClick={() => { if (confirm(`Remove ${p.name}?`)) mutate((g) => { g.players = g.players.filter((x) => x.id !== p.id); delete g.underdog[p.id]; delete g.final8[p.id]; }); }}>Remove</button>
              </div>
            );
          })}
        </div>
        <div className="note">"Bonus/adjust" adds (or subtracts, with a minus sign) points to a player's total — handy for late joiners or corrections. Click away from the box to save.</div>
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

function playerStats(game, pid) {
  const fin = game.matches.filter((m) => m.status === "finished" && game.picks[m.id]?.[pid]);
  let correct = 0;
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const bigWins = [];
  for (const m of fin) {
    const pk = game.picks[m.id][pid];
    const pts = pickPoints(m, pk);
    if (pts > 0) { correct++; bigWins.push({ m, pts }); }
  }
  bigWins.sort((a, b) => b.pts - a.pts);
  const row = computeStandings(game).find((r) => r.p.id === pid);
  return {
    total: row?.total || 0, daily: row?.daily || 0, udPts: row?.up || 0, f8Pts: row?.fp || 0,
    played: fin.length, correct, accuracy: fin.length ? Math.round((correct / fin.length) * 100) : 0,
    streak: streakFor(game, pid), udTeam: row?.udT, f8Team: row?.f8T, tById,
    best: bigWins.slice(0, 3).map((bw) => `${bw.tById?.[bw.m.teamA]?.name || tById[bw.m.teamA]?.name} ${bw.m.scoreA}–${bw.m.scoreB} ${tById[bw.m.teamB]?.name} · +${bw.pts}`),
  };
}

const CARD_COLORS = ["#c9a84c", "#4fc3f7", "#e63946", "#2d6e47", "#9b59b6", "#e67e22", "#ffffff", "#ff5fa2"];

function ProfileModal({ game, pid, meId, onClose, mutate }) {
  const p = game.players.find((x) => x.id === pid);
  const [editing, setEditing] = useState(false);
  if (!p) return null;
  const st = playerStats(game, pid);
  const isMe = pid === meId;
  const accent = p.color || "#c9a84c";
  const rank = computeStandings(game).sort((a, b) => b.total - a.total).findIndex((r) => r.p.id === pid) + 1;

  const saveField = (field, val) => mutate((g) => { const gp = g.players.find((x) => x.id === pid); if (gp) gp[field] = val; });

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hero" style={{ background: `linear-gradient(180deg, ${accent}22, transparent)` }}>
          <button className="close" onClick={onClose} aria-label="close">×</button>
          <div className="modal-avatar">{p.avatar}</div>
          <div className="modal-name" style={{ color: accent }}>{p.name}</div>
          <div className="modal-sub">{p.country ? `Backing ${p.country}` : "World Cup 2026"} · Rank #{rank || "—"}</div>
          {p.tagline && <div className="modal-tag">“{p.tagline}”</div>}
        </div>

        <div className="stat-grid">
          <div className="stat-box"><div className="v">{st.total}</div><div className="l">Total pts</div></div>
          <div className="stat-box"><div className="v">{st.accuracy}%</div><div className="l">Accuracy</div></div>
          <div className="stat-box"><div className="v">{st.streak}🔥</div><div className="l">Streak</div></div>
          <div className="stat-box"><div className="v">{st.correct}/{st.played}</div><div className="l">Correct picks</div></div>
          <div className="stat-box"><div className="v">{st.udPts}</div><div className="l">Underdog pts</div></div>
          <div className="stat-box"><div className="v">{st.f8Pts}</div><div className="l">Final 8 pts</div></div>
        </div>

        <div style={{ padding: "0 18px 10px" }}>
          <div className="modal-sub" style={{ marginBottom: 4 }}>Picks</div>
          <div className="note" style={{ marginTop: 0 }}>
            Underdog: {st.udTeam ? `${st.udTeam.flag} ${st.udTeam.name}` : "—"} · Final 8: {st.f8Team ? `${st.f8Team.flag} ${st.f8Team.name}` : "—"}
          </div>
          {st.best.length > 0 && <>
            <div className="modal-sub" style={{ margin: "10px 0 4px" }}>Best calls</div>
            {st.best.map((b, i) => <div key={i} className="payout-win" style={{ textAlign: "left" }}>✓ {b}</div>)}
          </>}
        </div>

        {isMe && (
          <div style={{ borderTop: "1px solid #232326", paddingTop: 6 }}>
            {!editing ? (
              <div style={{ padding: "6px 18px 18px" }}>
                <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => setEditing(true)}>✎ Customise my profile</button>
              </div>
            ) : (
              <div className="edit-row" style={{ paddingBottom: 18 }}>
                <label>Avatar emoji</label>
                <input defaultValue={p.avatar} maxLength={4} onBlur={(e) => saveField("avatar", e.target.value || "⚽")} />
                <label>Backing (nation / flavour)</label>
                <input defaultValue={p.country || ""} onBlur={(e) => saveField("country", e.target.value)} />
                <label>Tagline / trash talk</label>
                <input defaultValue={p.tagline || ""} maxLength={80} placeholder="say something..." onBlur={(e) => saveField("tagline", e.target.value)} />
                <label>Card colour</label>
                <div className="swatches">
                  {CARD_COLORS.map((c) => <span key={c} className={`swatch ${(p.color || "#c9a84c") === c ? "on" : ""}`} style={{ background: c }} onClick={() => saveField("color", c)} />)}
                </div>
                <button className="btn btn-gold" style={{ width: "100%", marginTop: 12 }} onClick={() => setEditing(false)}>Done</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Bridge: lets any page open a profile modal without threading props everywhere.
let _openProfile = () => {};
function openProfile(pid) { _openProfile(pid); }
let _openMatch = () => {};
function openMatchDetail(m) { _openMatch(m); }

// Computes who deserves shaming today, with reasons.
function computeShame(game) {
  const rows = computeStandings(game).sort((a, b) => b.total - a.total);
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const items = [];
  // Last place
  if (rows.length > 1 && rows[rows.length - 1].played !== undefined) {
    const last = rows[rows.length - 1];
    items.push({ id: "last-" + last.p.id, pid: last.p.id, badge: "Wooden spoon", desc: `Dead last on ${last.total} pts. Holding the wooden spoon for all to see.` });
  }
  // Cold streaks: most recent finished picks all wrong
  for (const r of rows) {
    const fin = game.matches.filter((m) => m.status === "finished" && game.picks[m.id]?.[r.p.id])
      .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));
    let cold = 0;
    for (const m of fin) { if (game.picks[m.id][r.p.id].pred !== matchResult(m)) cold++; else break; }
    if (cold >= 2) items.push({ id: "cold-" + r.p.id, pid: r.p.id, badge: `${cold} wrong in a row`, desc: `On a freezing run — ${cold} busted picks back to back. Someone check the pulse.` });
  }
  // Backed a team that got battered (lost by 3+) — most recent
  for (const r of rows) {
    const fin = game.matches.filter((m) => m.status === "finished" && game.picks[m.id]?.[r.p.id])
      .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));
    for (const m of fin.slice(0, 4)) {
      const pk = game.picks[m.id][r.p.id];
      const res = matchResult(m);
      if (pk.pred !== res && pk.pred !== "D") {
        const margin = Math.abs(m.scoreA - m.scoreB);
        const backed = pk.pred === "A" ? tById[m.teamA] : tById[m.teamB];
        if (margin >= 3 && backed) { items.push({ id: "battered-" + m.id + "-" + r.p.id, pid: r.p.id, badge: "Backed a flop", desc: `Put faith in ${backed.flag} ${backed.name}, who lost ${m.scoreA}–${m.scoreB}. Brutal.` }); break; }
      }
    }
  }
  // Underdog eliminated in groups
  for (const r of rows) {
    if (r.udTeam && r.udTeam.furthest === "out") items.push({ id: "udout-" + r.p.id, pid: r.p.id, badge: "Underdog dumped out", desc: `Their underdog ${r.udTeam.flag} ${r.udTeam.name} crashed out in the groups. Bold pick, zero reward.` });
  }
  // de-dup by id, cap
  const seen = new Set();
  return items.filter((i) => !seen.has(i.id) && seen.add(i.id)).slice(0, 12);
}

const SHAME_EMOJIS = ["😂", "💀", "🤡", "🪦", "🧊", "👎", "🫵", "🤣"];

function ShamePage({ game, me, mutate }) {
  const items = computeShame(game);
  const pById = Object.fromEntries(game.players.map((p) => [p.id, p]));
  const [drafts, setDrafts] = useState({});

  const react = (itemId, emoji) => {
    if (!me) return;
    mutate((g) => {
      if (!g.shame) g.shame = {};
      if (!g.shame[itemId]) g.shame[itemId] = { reactions: {}, comments: [] };
      const rx = g.shame[itemId].reactions;
      if (!rx[emoji]) rx[emoji] = [];
      const i = rx[emoji].indexOf(me.id);
      if (i >= 0) rx[emoji].splice(i, 1); else rx[emoji].push(me.id); // toggle
    });
  };
  const comment = (itemId) => {
    const text = (drafts[itemId] || "").trim();
    if (!text || !me) return;
    mutate((g) => {
      if (!g.shame) g.shame = {};
      if (!g.shame[itemId]) g.shame[itemId] = { reactions: {}, comments: [] };
      g.shame[itemId].comments.push({ by: me.id, name: me.name, text, at: Date.now() });
    });
    setDrafts((d) => ({ ...d, [itemId]: "" }));
  };

  return (
    <div className="page">
      <div className="hero" style={{ padding: "26px 16px" }}>
        <h1 style={{ fontSize: "clamp(34px,8vw,60px)" }}>THE SHAME WALL</h1>
        <div className="sub">Where bad picks come to die 💀</div>
      </div>
      {!me && <div className="banner" style={{ marginTop: 14 }}>Pick your player up top to join the pile-on.</div>}
      {items.length === 0 ? (
        <div className="panel muted" style={{ marginTop: 16 }}>Nobody's embarrassed themselves yet. Give it time — the group stage is long.</div>
      ) : items.map((it) => {
        const p = pById[it.pid];
        if (!p) return null;
        const sh = game.shame?.[it.id] || { reactions: {}, comments: [] };
        return (
          <div className="shame-card" key={it.id}>
            <div className="who">
              <span className="av">{p.avatar}</span>
              <span className="nm pname" onClick={() => openProfile(p.id)}>{p.name}</span>
              <span className="shame-badge">{it.badge}</span>
            </div>
            <div className="shame-desc">{it.desc}</div>
            <div className="react-row">
              {SHAME_EMOJIS.map((e) => {
                const n = sh.reactions?.[e]?.length || 0;
                return <span key={e}>
                  {n > 0
                    ? <span className="react-tally" onClick={() => react(it.id, e)} style={{ cursor: "pointer" }}>{e} {n}</span>
                    : <button className="react-btn" onClick={() => react(it.id, e)} disabled={!me}>{e}</button>}
                </span>;
              })}
            </div>
            {(sh.comments?.length > 0) && (
              <div className="shame-comments">
                {sh.comments.map((c, i) => <div key={i} className="shame-comment"><b className="pname" onClick={() => openProfile(c.by)}>{c.name}</b>: {c.text}</div>)}
              </div>
            )}
            {me && (
              <div className="comment-box">
                <input placeholder="add some banter..." maxLength={140} value={drafts[it.id] || ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [it.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") comment(it.id); }} />
                <button className="btn btn-gold" onClick={() => comment(it.id)}>Post</button>
              </div>
            )}
          </div>
        );
      })}
      <div className="note">Shame is assigned automatically from results — last place, cold streaks, backing teams that got battered, and underdogs that flopped. All in good fun. Mostly.</div>
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
    if (tab !== "home" && tab !== "picks" && tab !== "scores" && tab !== "today") return;
    const t = setInterval(() => pullFixtures(false), 65000);
    return () => clearInterval(t);
  }, [tab, pullFixtures]);

  const [burstColors, setBurstColors] = useState(null);
  const [pickFlash, setPickFlash] = useState(null);
  const fireConfetti = (colors) => { setBurstColors(colors || null); setBurst(false); requestAnimationFrame(() => setBurst(true)); setTimeout(() => setBurst(false), 2600); };

  // THE PICK RUSH: full-screen "LET'S GO" + confetti in the country's colours
  const flashTimer = useRef(null);
  const celebratePick = (team) => {
    const phrase = HYPE[Math.floor(Math.random() * HYPE.length)];
    const colors = team ? (COUNTRY_COLORS[team.name] || ["#f0c93a", "#ffffff"]) : ["#f0c93a", "#ffffff", "#8aaa96"];
    setPickFlash({ flag: team ? team.flag : "🤝", text: team ? `${team.name.toUpperCase()} — ${phrase}` : `DRAW — ${phrase}` });
    fireConfetti(colors);
    try { navigator.vibrate && navigator.vibrate([18, 30, 40]); } catch (e) {}
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setPickFlash(null), 1150);
  };

  // THE PAYOUT: when new results have landed since you last looked and your
  // picks came in — take over the screen: points, the wins, confetti, haptics.
  const [profileId, setProfileId] = useState(null);
  const [detailMatch, setDetailMatch] = useState(null);
  useEffect(() => { _openMatch = (m) => setDetailMatch(m); return () => { _openMatch = () => {}; }; }, []);
  const tabsRef = useRef(null);
  useEffect(() => {
    const el = tabsRef.current?.querySelector(".tab.on");
    if (el) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [tab]);
  useEffect(() => { _openProfile = (pid) => setProfileId(pid); return () => { _openProfile = () => {}; }; }, []);
  const [payout, setPayout] = useState(null);
  useEffect(() => {
    if (!game || !meId) return;
    const finished = game.matches.filter((m) => m.status === "finished");
    const key = "wc26-seen-" + meId;
    try {
      const raw = localStorage.getItem(key);
      const seen = raw ? new Set(JSON.parse(raw)) : null;
      if (seen) {
        const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
        const wins = []; let pts = 0;
        for (const m of finished) {
          if (seen.has(m.id)) continue;
          const pk = game.picks[m.id]?.[meId];
          const p = pickPoints(m, pk);
          if (p > 0) { pts += p; wins.push(`✓ ${tById[m.teamA]?.name} ${m.scoreA}–${m.scoreB} ${tById[m.teamB]?.name} · +${p}`); }
        }
        if (pts > 0) {
          setPayout({ pts, wins });
          fireConfetti();
          try { navigator.vibrate && navigator.vibrate([35, 60, 35, 60, 70]); } catch (e) {}
          setTimeout(() => setPayout(null), 8000);
        }
      }
      localStorage.setItem(key, JSON.stringify(finished.map((m) => m.id)));
    } catch (e) {}
  }, [game, meId]);

  // (must be declared before the early return below — React hook rules)
  const particles = useMemo(() => Array.from({ length: 18 }, () => ({
    left: Math.random() * 100, dur: 8 + Math.random() * 10,
    delay: Math.random() * 10, size: 2 + Math.random() * 3,
  })), []);

  const errBanner = pageErrors.length > 0 && (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, background: "#7a1220", color: "#fff", padding: "8px 14px", fontSize: 13, fontFamily: "monospace" }}>
      <b>⚠ Page error — send this text to fix it:</b>
      {pageErrors.map((e, i) => <div key={i}>• {e}</div>)}
    </div>
  );

  if (!game) return <div className="wc-app"><style>{CSS}</style>{errBanner}<div className="page bebas" style={{ fontSize: 26, textAlign: "center", paddingTop: 80 }}>WARMING UP ON THE TOUCHLINE… <span style={{ fontSize: 14 }}>v28</span><div className="note" style={{ fontFamily: "Inter", letterSpacing: 0, marginTop: 12 }}>If this never goes away, the database connection is failing — check the red banner or Vercel env vars.</div></div></div>;

  const me = game.players.find((p) => p.id === meId) || null;
  const pot = game.config.buyIn * game.players.length;

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

  const ALL_TABS = [
    ["today", "📅", "Today"], ["picks", "✅", "Picks"], ["scores", "📺", "Scores"],
    ["board", "🏆", "Table"], ["shame", "💀", "Shame"], ["underdog", "🐉", "Underdog"],
    ["final8", "🎯", "Final 8"], ["prizes", "💰", "Prizes"], ["home", "🏟️", "Home"], ["admin", "🛠️", "Admin"],
  ];

  return (
    <div className="wc-app">
      <style>{CSS}</style>
      {errBanner}
      {payout && (
        <div className="payout" onClick={() => setPayout(null)}>
          <div className="payout-card">
            <div className="payout-label">Results are in</div>
            <div className="payout-pts">+<CountUp value={payout.pts} duration={1400} /> PTS</div>
            {payout.wins.map((w, i) => <div key={i} className="payout-win">{w}</div>)}
            <div className="payout-tap">tap anywhere to continue</div>
          </div>
        </div>
      )}
      <Confetti burst={burst} colors={burstColors} />
      {profileId && <ProfileModal game={game} pid={profileId} meId={meId} onClose={() => setProfileId(null)} mutate={mutate} />}
      {detailMatch && <MatchDetailModal game={game} match={detailMatch} onClose={() => setDetailMatch(null)} />}
      {pickFlash && (
        <div className="pickflash" aria-hidden>
          <div className="pf-inner">
            <span className="pf-flag">{pickFlash.flag}</span>
            <span className="pf-text">{pickFlash.text}</span>
          </div>
        </div>
      )}
      <div className="beams" aria-hidden />
      <div className="particles" aria-hidden>
        {particles.map((pt, i) => <i key={i} style={{ left: `${pt.left}%`, width: pt.size, height: pt.size, animationDuration: `${pt.dur}s`, animationDelay: `${pt.delay}s` }} />)}
      </div>
      <div className="topwrap">
      <nav className="nav">
        <span className="nav-trophy" style={{ fontSize: 22 }}>🏆</span>
        <div className="nav-title bebas">WC2026 · <span className="grp">{game.config.groupName}</span> <span className="muted" style={{ fontSize: 11 }}>v28</span></div>
        <span className="pot-badge shine">💰 {game.config.currency}<CountUp value={pot} decimals={2} /></span>
        <select className="who" value={meId} onChange={(e) => choosePlayer(e.target.value)} aria-label="select your player">
          <option value="">Who are you?</option>
          {game.players.map((p) => <option key={p.id} value={p.id}>{p.avatar} {p.name}{p.pin ? " 🔒" : ""}</option>)}
        </select>
      </nav>
      <Ticker game={game} />
      </div>

      {tab === "home" && <HomePage game={game} me={me} go={setTab} fxStatus={fxStatus} onRefresh={() => pullFixtures(true)} />}
      {tab === "today" && <TodayPage game={game} me={me} go={setTab} />}
      {tab === "picks" && <PicksPage game={game} me={me} mutate={mutate} fxStatus={fxStatus} onRefresh={() => pullFixtures(true)} onPickCelebrate={celebratePick} />}
      {tab === "scores" && <LiveScoresPage game={game} onRefresh={() => pullFixtures(true)} />}
      {tab === "underdog" && <UnderdogPage game={game} me={me} mutate={mutate} />}
      {tab === "final8" && <Final8Page game={game} me={me} mutate={mutate} />}
      {tab === "board" && <LeaderboardPage game={game} />}
      {tab === "shame" && <ShamePage game={game} me={me} mutate={mutate} />}
      {tab === "prizes" && <PrizesPage game={game} />}
      {tab === "admin" && <AdminPage game={game} mutate={mutate} isAdmin={isAdmin} setIsAdmin={setIsAdmin} fireConfetti={fireConfetti} onRefresh={() => pullFixtures(true)} fxStatus={fxStatus} />}

      <div className="tabs" ref={tabsRef}>
        {ALL_TABS.map(([k, ic, lab]) => (
          <button key={k} className={`tab ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); if (k === "home" || k === "picks" || k === "scores" || k === "today") pullFixtures(false); }}>
            <span className="ic">{ic}</span>{lab}
          </button>
        ))}
      </div>
    </div>
  );
}
