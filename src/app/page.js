"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { createClient } from "@supabase/supabase-js";

/* ════════════════════════════════════════════════════════════════
   WORLD CUP 2026 — PRIVATE PREDICTION LEAGUE  (Vercel + Supabase)
   Daily picks · Underdog system · Final 4 & Golden Boot · Live pot
   Shared league: all data lives in one Supabase row, so everyone
   sees the same game. Pick your player in the top bar.
   ════════════════════════════════════════════════════════════════ */

const STORE_KEY = "wc26-league-v1";
const APP_VERSION = "v81";
const OWNER_NAME = "rosh";

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
  --pitch-green:#0d7a3f; --pitch-light:#16c264;
  --gold:#d4af37; --gold-bright:#ffd633;
  --night:#06140c; --panel:#0c2417; --panel-mid:#123a23;
  --white:#f2fbf5; --muted:#7fb99a;
  --danger:#ff4d6d; --sky:#33d6e0; --magenta:#ff5fa2;
}
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
button,.btn,.who,.date-chip,.pickbtn,.lb-row,.match{transition:transform .16s cubic-bezier(.2,.8,.3,1), background .2s ease, box-shadow .2s ease, border-color .2s ease;}
button:active,.btn:active,.pickbtn:active{transform:scale(.96);}
.wc-app{
  min-height:100vh; color:var(--white); font-family:'Inter',sans-serif;
  background:
    linear-gradient(180deg,
      rgba(6,20,12,0.88) 0%,
      rgba(6,20,12,0.84) 50%,
      rgba(6,20,12,0.94) 100%),
    url('/stadium-bg.jpg') center center / cover fixed no-repeat;
  padding-bottom:90px;
}
@media (max-width: 768px){
  .wc-app{ background-attachment: scroll; }
}
.bebas{font-family:'Bebas Neue',sans-serif;letter-spacing:.06em;}
.barlow{font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;letter-spacing:.12em;}
.muted{color:var(--muted);}
.gold{color:var(--gold-bright);}

/* navbar */
.nav{display:flex;flex-direction:column;gap:8px;
  padding:10px 12px;background:linear-gradient(180deg, rgba(9,26,16,.85), rgba(7,18,11,.4));backdrop-filter:blur(8px);
  border-bottom:1px solid rgba(22,194,100,.18);}
.nav-headline{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;}
.hype-title{flex:1;text-align:center;font-family:'Bebas Neue';font-size:clamp(20px,6vw,30px);letter-spacing:.05em;line-height:1;
  background:linear-gradient(100deg,#fff 10%,var(--gold-bright) 30%,#4fc3f7 50%,var(--gold-bright) 70%,#fff 90%);
  background-size:220% auto;-webkit-background-clip:text;background-clip:text;color:transparent;
  text-shadow:1px 1px 0 rgba(0,0,0,.5),2px 2px 0 rgba(0,0,0,.3),3px 3px 0 rgba(0,0,0,.15);
  animation:hypeSheen 3s linear infinite, hypePulse 2.2s ease-in-out infinite;}
@keyframes hypeSheen{0%{background-position:0% center}100%{background-position:220% center}}
@keyframes hypePulse{0%,100%{filter:drop-shadow(0 0 6px rgba(240,201,58,.5))}50%{filter:drop-shadow(0 0 16px rgba(240,201,58,.9)) drop-shadow(0 0 26px rgba(79,195,247,.5))}}
.hype-title .grp{-webkit-text-fill-color:initial;color:var(--gold-bright);}
.nav-controls{display:flex;align-items:stretch;gap:8px;width:100%;}
.nav-trophy{display:inline-block;font-size:22px;animation:trophyBounce 1.8s ease-in-out infinite;}
@keyframes trophyBounce{0%,100%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(-4px) rotate(8deg)}}
.nav-title{font-size:20px;line-height:1;color:var(--white);}
.nav-title .grp{color:var(--gold-bright);}
.pot-badge{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#2a2008,#1c3427);
  border:1px solid var(--gold);border-radius:10px;padding:6px 11px;font-family:'Bebas Neue';font-size:18px;color:var(--gold-bright);white-space:nowrap;}
.who{background:var(--panel-mid);color:var(--white);border:1px solid rgba(138,170,150,.35);
  border-radius:8px;padding:6px 9px;font-family:'Barlow Condensed';font-size:14px;letter-spacing:.06em;text-transform:uppercase;flex:1;}
.bell-btn{flex:0 0 auto;padding:6px 11px;font-size:16px;line-height:1;}
/* spinning 3D coin */
.coin{display:inline-block;width:20px;height:20px;position:relative;transform-style:preserve-3d;animation:coinSpin 2.6s linear infinite;vertical-align:middle;margin-right:2px;}
.coin .face{position:absolute;inset:0;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:900;color:#7a5c10;backface-visibility:hidden;
  background:radial-gradient(circle at 35% 30%, #ffe27a, #f0c93a 45%, #c9912a 100%);
  box-shadow:inset 0 0 0 2px rgba(255,255,255,.35), inset 0 -3px 4px rgba(122,74,10,.5);}
.coin .back{transform:rotateY(180deg);}
@keyframes coinSpin{0%{transform:rotateY(0)}100%{transform:rotateY(360deg)}}

/* bottom nav — primary section dock */
.bottom-nav{position:fixed;bottom:0;left:0;right:0;height:calc(64px + env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom);display:flex;
  background:rgba(6,20,12,0.97);backdrop-filter:blur(16px) saturate(1.3);-webkit-backdrop-filter:blur(16px) saturate(1.3);
  border-top:1px solid rgba(255,255,255,0.08);
  box-shadow:0 -1px 0 rgba(255,255,255,0.05) inset, 0 -8px 24px rgba(0,0,0,0.4);z-index:50;}
.bottom-nav-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;border:none;background:none;padding:8px 4px;position:relative;transition:opacity 0.15s ease;}
.bottom-nav-tab .tab-icon{font-size:22px;line-height:1;transition:transform 0.2s cubic-bezier(0.2,1.5,0.4,1);}
.bottom-nav-tab .tab-label{font-family:'Barlow Condensed';font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);transition:color 0.15s ease;}
.bottom-nav-tab.active .tab-icon{transform:translateY(-2px) scale(1.1);}
.bottom-nav-tab.active .tab-label{color:var(--section-colour);font-weight:700;}
.bottom-nav-tab:active{opacity:.7;}
.bottom-nav-tab:focus-visible{outline:2px solid var(--sky);outline-offset:-2px;}
.bottom-nav-tab.active::before{content:'';position:absolute;top:6px;left:50%;transform:translateX(-50%);width:20px;height:3px;border-radius:0 0 3px 3px;background:var(--section-colour);box-shadow:0 0 8px var(--section-colour);}

/* sub-nav — secondary page pills within a section */
.sub-nav{display:flex;gap:6px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:8px 12px;
  background:rgba(6,20,12,0.6);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,0.06);scrollbar-width:none;}
.sub-nav::-webkit-scrollbar{display:none;}
.sub-nav-pill{flex:0 0 auto;scroll-snap-align:start;padding:5px 14px;border-radius:999px;font-family:'Barlow Condensed';font-size:13px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;
  border:1px solid rgba(255,255,255,0.12);background:transparent;color:var(--muted);white-space:nowrap;transition:all 0.18s ease;}
.sub-nav-pill.active{background:var(--section-colour);border-color:var(--section-colour);color:#06140c;font-weight:700;box-shadow:0 0 12px color-mix(in srgb, var(--section-colour) 40%, transparent);}
.sub-nav-pill:active{transform:scale(.94);}
.sub-nav-pill:focus-visible{outline:2px solid var(--sky);}

.page{max-width:880px;margin:0 auto;padding:20px 16px calc(64px + env(safe-area-inset-bottom) + 16px);}
.ver-badge{position:fixed;bottom:calc(64px + env(safe-area-inset-bottom) + 6px);right:10px;font-size:10px;color:rgba(255,255,255,0.2);font-family:monospace;z-index:49;pointer-events:none;}
.h-sec{font-family:'Bebas Neue';font-size:26px;letter-spacing:.08em;margin:26px 0 12px;
  display:flex;align-items:center;gap:10px;
  text-shadow:1px 1px 0 rgba(0,0,0,.6),2px 2px 0 rgba(0,0,0,.4),3px 3px 0 rgba(0,0,0,.2),0 0 20px rgba(240,201,58,.3);}
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
.hero-grand{padding:34px 16px 30px;background:
  radial-gradient(ellipse 80% 70% at 50% 0%, rgba(240,201,58,.22), transparent 60%),
  repeating-linear-gradient(115deg, var(--pitch-green) 0 70px, var(--pitch-light) 70px 140px);
  border:1px solid rgba(201,168,76,.45);box-shadow:inset 0 0 60px rgba(0,0,0,.5),0 8px 30px rgba(0,0,0,.4);}
.hero-glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 10%, rgba(240,201,58,.3), transparent 55%);animation:auraPulse 3s ease-in-out infinite;pointer-events:none;}
.hero-kicker{position:relative;color:var(--gold-bright);font-size:12px;letter-spacing:.25em;text-transform:uppercase;margin-bottom:6px;opacity:.9;}
.hero-mega{position:relative;font-family:'Bebas Neue';font-size:clamp(44px,12vw,92px);line-height:.86;letter-spacing:.02em;
  background:linear-gradient(100deg,#fff 20%,var(--gold-bright) 45%,#fff 70%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:titleSheen 4s linear infinite;text-shadow:0 6px 30px rgba(0,0,0,.5);}
.hero-mega span{display:block;font-size:1.18em;color:var(--gold-bright);-webkit-text-fill-color:var(--gold-bright);filter:drop-shadow(0 0 18px rgba(240,201,58,.6));}
.hero-cards{position:relative;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px;}
.hero-pot,.hero-leader{background:rgba(7,13,10,.55);backdrop-filter:blur(4px);border:1px solid rgba(201,168,76,.4);border-radius:14px;padding:12px 16px;min-width:150px;}
.hero-pot-amt{font-family:'Bebas Neue';font-size:30px;color:var(--gold-bright);display:flex;align-items:center;gap:5px;justify-content:center;text-shadow:0 0 16px rgba(240,201,58,.5);}
.hero-leader{cursor:pointer;border-color:var(--gold);transition:transform .15s;}
.hero-leader:active{transform:scale(.97);}
.hl-crown{font-family:'Barlow Condensed';font-size:11px;letter-spacing:.15em;color:var(--gold-bright);margin-bottom:4px;}
.hl-body{display:flex;align-items:center;gap:8px;}
.hero .pot{margin-top:18px;display:inline-flex;align-items:center;gap:10px;background:rgba(7,13,10,.75);
  border:1px solid var(--gold);border-radius:12px;padding:10px 22px;}
.hero .pot .amt{font-family:'Bebas Neue';font-size:34px;color:var(--gold-bright);}

/* cards & panels */
.panel{background:linear-gradient(160deg,rgba(18,58,35,.88),rgba(9,26,16,.93)),url('/grass-texture.jpg') center / cover;backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:16px;box-shadow:0 8px 32px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.08);}
@property --hue{syntax:'<angle>';initial-value:0deg;inherits:false;}
@keyframes hueRotate{to{--hue:360deg}}
.panel:hover{border-color:hsl(var(--hue),55%,65%);animation:hueRotate 8s linear;}
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
.match{background:linear-gradient(180deg,rgba(16,52,31,.92),rgba(9,26,16,.95)),url('/grass-texture.jpg') center / cover;backdrop-filter:blur(6px);border:1px solid rgba(22,194,100,.24);
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
.score{font-family:'Bebas Neue';font-size:44px;color:var(--gold-bright);background:#050a06;
  border:1px solid rgba(201,168,76,.4);border-radius:10px;padding:2px 14px;min-width:96px;text-align:center;
  text-shadow:0 0 20px currentColor;animation:scorePop .34s cubic-bezier(.2,1.5,.4,1) both;}
@keyframes scorePop{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
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
.lb-row{display:grid;grid-template-columns:34px 1fr 52px 52px 52px 64px;gap:6px;align-items:center;backdrop-filter:blur(6px);
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
.confetti-canvas{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99;}

.banner{background:linear-gradient(90deg,rgba(201,168,76,.2),rgba(79,195,247,.12));border:1px solid var(--gold);
  border-radius:12px;padding:12px 16px;font-family:'Bebas Neue';font-size:20px;letter-spacing:.08em;margin-bottom:16px;text-align:center;}
.daily-hook{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;
  background:linear-gradient(100deg,rgba(22,194,100,.2),rgba(240,201,58,.12));border:1px solid rgba(22,194,100,.4);
  border-radius:13px;padding:12px 16px;margin-bottom:10px;font-family:'Bebas Neue';font-size:18px;letter-spacing:.04em;
  box-shadow:0 2px 12px rgba(0,0,0,.3);animation:hookGlow 3s ease-in-out infinite;}
@keyframes hookGlow{0%,100%{border-color:rgba(22,194,100,.4)}50%{border-color:rgba(240,201,58,.6)}}
.daily-hook .dh-arrow{font-size:24px;color:var(--gold-bright);}
.mover-strip{display:flex;align-items:center;gap:8px;cursor:pointer;background:rgba(12,36,23,.6);border:1px solid rgba(138,170,150,.2);
  border-radius:11px;padding:9px 14px;margin-bottom:12px;font-size:13px;}
.mover-strip b{color:var(--gold-bright);}
.h2h-score{display:flex;align-items:center;justify-content:center;gap:14px;background:rgba(12,36,23,.5);border:1px solid rgba(22,194,100,.25);border-radius:12px;padding:10px;}
.h2h-side{text-align:center;flex:1;}
.h2h-num{font-family:'Bebas Neue';font-size:38px;line-height:1;}
.h2h-lab{font-family:'Barlow Condensed';font-size:10px;letter-spacing:.1em;color:var(--muted);}
.h2h-mid{text-align:center;}
.h2h-vs{font-family:'Bebas Neue';font-size:20px;color:var(--muted);}
.h2h-ties{font-size:9px;color:var(--muted);}
.motd{cursor:pointer;background:
  radial-gradient(ellipse 80% 100% at 50% 0%, rgba(240,201,58,.15), transparent 70%),
  linear-gradient(160deg, rgba(18,58,35,.85), rgba(9,26,16,.9));
  border:1px solid var(--gold);border-radius:16px;padding:14px 16px;margin-top:20px;margin-bottom:14px;box-shadow:0 4px 20px rgba(0,0,0,.35);}
.motd-tag{font-family:'Barlow Condensed';font-size:11px;letter-spacing:.18em;color:var(--gold-bright);text-align:center;margin-bottom:8px;}
.motd-teams{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.motd-team{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;font-family:'Bebas Neue';font-size:16px;line-height:1;text-align:center;}
.motd-score{flex:0 0 auto;padding:0 6px;}
.motd-split{text-align:center;font-size:11px;color:var(--muted);margin-top:8px;letter-spacing:.03em;}
.motd-cta{text-align:center;font-family:'Barlow Condensed';font-size:11px;letter-spacing:.1em;color:var(--gold-bright);margin-top:8px;text-transform:uppercase;}
.warcard{background:linear-gradient(160deg,rgba(40,16,18,.95),rgba(18,9,10,.97)),url('/crowd-wc.jpg') center top / cover;border:1px solid rgba(230,57,70,.4);border-radius:16px;padding:14px;margin-bottom:14px;box-shadow:0 4px 20px rgba(0,0,0,.4);}
.war-live{display:inline-flex;align-items:center;gap:6px;font-family:'Barlow Condensed';font-size:11px;letter-spacing:.14em;color:#ff6b78;margin-bottom:8px;}
.war-score{display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;}
.war-team{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-family:'Bebas Neue';font-size:15px;text-align:center;line-height:1;}
.war-num{font-size:38px;line-height:1;}
.war-picks{display:flex;flex-wrap:wrap;gap:5px;margin-top:12px;}
.war-chip{font-size:11px;padding:3px 8px;border-radius:999px;cursor:pointer;border:1px solid;}
.war-chip.win{background:rgba(22,194,100,.18);border-color:rgba(22,194,100,.5);color:#7fe8a8;}
.war-chip.lose{background:rgba(230,57,70,.14);border-color:rgba(230,57,70,.4);color:#f1a0a7;}
.war-react{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;justify-content:center;}
.war-rbtn{position:relative;background:#1c1416;border:1px solid #3a2629;border-radius:10px;padding:6px 11px;font-size:18px;cursor:pointer;transition:transform .1s;}
.war-rbtn:active{transform:scale(1.2);}
.war-rcount{font-size:10px;color:var(--gold-bright);margin-left:3px;vertical-align:super;font-family:'Bebas Neue';}
.war-feed{margin-top:10px;border-top:1px dashed rgba(230,57,70,.25);padding-top:8px;max-height:130px;overflow-y:auto;}
.war-fitem{font-size:12px;padding:2px 0;animation:rowIn .3s ease;}
.war-femoji{font-size:14px;}
.brk-slot{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.brk-label{flex:0 0 120px;font-family:'Barlow Condensed';font-size:13px;letter-spacing:.05em;color:var(--white);}
.brk-select{flex:1;}
.brk-view{display:flex;align-items:center;justify-content:space-between;padding:8px 4px;border-bottom:1px dashed rgba(138,170,150,.15);}
.brk-vlabel{font-family:'Barlow Condensed';font-size:12px;color:var(--muted);letter-spacing:.05em;}
.brk-vteam{font-family:'Bebas Neue';font-size:16px;display:flex;align-items:center;gap:6px;}
.brk-view-big{background:rgba(240,201,58,.08);border-radius:8px;padding:10px 8px;border:1px solid rgba(240,201,58,.3);margin-bottom:4px;}
.brk-view-big .brk-vteam{font-size:22px;color:var(--gold-bright);}
.ovr-row{display:flex;flex-direction:column;gap:6px;padding:10px 0;border-bottom:1px dashed rgba(138,170,150,.15);}
.ovr-match{display:flex;flex-direction:column;gap:2px;font-family:'Barlow Condensed';font-size:14px;letter-spacing:.03em;}
.ovr-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.ovr-set{display:flex;gap:4px;margin-left:auto;}
.mv-ico{font-size:13px;font-weight:900;}
.mv-ico.up{color:#16c264;}.mv-ico.down{color:var(--danger);}
.form-trail{display:flex;align-items:center;gap:4px;margin-bottom:8px;font-family:'Barlow Condensed';font-size:12px;color:var(--muted);}
.ft-dot{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;font-size:10px;font-weight:800;color:#06140c;}
.ft-w{background:#16c264;}.ft-l{background:var(--danger);}
.picksplit{margin-top:10px;}
.ps-label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:3px;}
.ps-bar{display:flex;height:22px;border-radius:6px;overflow:hidden;background:#0a1a10;border:1px solid rgba(138,170,150,.2);}
.ps-seg{display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue';font-size:12px;color:#06140c;min-width:24px;transition:width .5s ease;}
.ps-a{background:#16c264;}.ps-d{background:#8aaa96;}.ps-b{background:var(--gold-bright);}
.ps-key{display:flex;justify-content:space-between;font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin-top:3px;}
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
.lb-row.top1{border-color:var(--gold);transform:translateY(-1px);position:relative;animation:goldBorder 2.2s ease-in-out infinite;}
.lb-row.top1::after{content:"";position:absolute;inset:0;border-radius:10px;background:radial-gradient(ellipse 100% 100% at 50% 50%,rgba(240,201,58,.15),transparent 70%);pointer-events:none;}
@keyframes goldBorder{0%,100%{box-shadow:0 2px 10px rgba(240,201,58,.2)}50%{box-shadow:0 4px 24px rgba(240,201,58,.55)}}
.live .dot{box-shadow:0 0 12px rgba(230,57,70,.95);}
.toast{position:fixed;top:62px;left:50%;transform:translateX(-50%);z-index:200;background:linear-gradient(135deg,#2a2008,#1c3427);border:1px solid var(--gold-bright);color:var(--gold-bright);font-family:'Bebas Neue';font-size:22px;letter-spacing:.08em;padding:12px 28px;border-radius:12px;box-shadow:0 0 32px rgba(240,201,58,.55);animation:toastIn .4s ease, goldPulse 1.5s ease-in-out infinite;}
@keyframes toastIn{0%{opacity:0;transform:translateX(-50%) translateY(-18px) scale(.9)}100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
/* ── stadium atmosphere (always-on) ── */
.topwrap{position:sticky;top:0;z-index:50;padding-top:env(safe-area-inset-top);background:#06140c;}
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
.live-card{border-color:rgba(230,57,70,.55) !important;animation:liveGlow 2s ease-in-out infinite;}
.live-card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;border-radius:14px 14px 0 0;background:linear-gradient(90deg,transparent,rgba(230,57,70,.9),transparent);animation:liveTopBorder 2s ease-in-out infinite;pointer-events:none;}
@keyframes liveTopBorder{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes liveGlow{0%,100%{box-shadow:0 0 0 rgba(230,57,70,0)}50%{box-shadow:0 0 28px rgba(230,57,70,.5)}}
.lb-row{animation:rowIn .45s ease both;}
@keyframes rowIn{0%{opacity:0;transform:translateX(-14px)}100%{opacity:1;transform:translateX(0)}}
.nav-trophy{display:inline-block;animation:trophySway 3.5s ease-in-out infinite;}
@keyframes trophySway{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
.calledit{margin-top:10px;text-align:center;font-family:'Bebas Neue';letter-spacing:.1em;font-size:19px;color:var(--gold-bright);animation:calledIn .6s cubic-bezier(.2,1.4,.4,1), goldPulse 2s ease-in-out infinite;}
@keyframes calledIn{0%{transform:translateY(10px) scale(.8);opacity:0}100%{transform:none;opacity:1}}
.payout{position:fixed;inset:0;z-index:300;background:linear-gradient(180deg,rgba(5,8,6,.92),rgba(5,8,6,.96)),url('/stadium-celebration.jpg') center / cover fixed;backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;animation:payIn .25s ease;cursor:pointer;}
@keyframes payIn{from{opacity:0}to{opacity:1}}
.payout-card{text-align:center;padding:32px 40px;animation:cardPop .5s cubic-bezier(.2,1.5,.4,1);}
@keyframes cardPop{0%{transform:scale(.65);opacity:0}100%{transform:scale(1);opacity:1}}
.payout-label{font-family:'Barlow Condensed';letter-spacing:.32em;color:var(--muted);font-size:14px;text-transform:uppercase;}
.payout-pts{font-family:'Bebas Neue';font-size:88px;line-height:1.05;color:var(--gold-bright);animation:goldPulse 1.4s ease-in-out infinite;}
.payout-win{font-size:14px;color:#bdf3d2;padding:3px 0;}
.payout-tap{margin-top:20px;font-size:11px;color:var(--muted);letter-spacing:.25em;text-transform:uppercase;}
.pickflash{position:fixed;inset:0;z-index:280;display:flex;align-items:center;justify-content:center;pointer-events:none;}
.pickflash .pf-inner{text-align:center;animation:pfPop 1.6s cubic-bezier(.2,1.5,.4,1) forwards;}
.pickflash .pf-flag{font-size:64px;line-height:1;display:block;}
.pickflash .pf-text{font-family:'Bebas Neue';font-size:clamp(40px,9vw,72px);letter-spacing:.08em;color:var(--gold-bright);text-shadow:0 0 30px rgba(240,201,58,.85),0 4px 18px rgba(0,0,0,.7);}
@keyframes pfPop{0%{opacity:0;transform:scale(.5)}10%{opacity:1;transform:scale(1.1)}18%{transform:scale(1)}82%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.04) translateY(-10px)}}
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
@media (prefers-reduced-motion: reduce){*{animation:none !important;transition:none !important;}}
/* group stage wind-down */
.rtk-panel{background:linear-gradient(180deg,rgba(13,50,28,.88),rgba(9,26,18,.9));border:1px solid rgba(22,194,100,.35);border-radius:16px;padding:14px 16px;margin-top:16px;margin-bottom:4px;}
.rtk-group{margin-bottom:12px;}
.rtk-group-hd{font-family:'Bebas Neue';font-size:16px;letter-spacing:.1em;color:var(--gold-bright);display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.rtk-live-badge{font-family:'Barlow Condensed';font-size:10px;letter-spacing:.1em;background:rgba(230,57,70,.2);border:1px solid rgba(230,57,70,.45);border-radius:999px;padding:2px 8px;color:#f1a0a7;}
.rtk-row{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:8px;margin-bottom:3px;font-size:13px;}
.rtk-row.qualified{background:rgba(45,110,71,.28);border:1px solid rgba(63,174,108,.35);}
.rtk-row.inrace{background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.3);}
.rtk-row.elim{opacity:.55;}
.rtk-pos{font-family:'Bebas Neue';font-size:16px;min-width:20px;color:var(--muted);}
.rtk-pos.q{color:#3fae6c;}.rtk-pos.a{color:var(--gold-bright);}
.rtk-pts{margin-left:auto;font-family:'Bebas Neue';font-size:15px;color:var(--gold-bright);}
.gs-done-banner{background:linear-gradient(135deg,rgba(240,201,58,.14),rgba(22,194,100,.16));border:1px solid var(--gold);border-radius:16px;padding:18px 16px;margin-top:16px;margin-bottom:4px;text-align:center;}
.gs-stat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;}
.gs-stat{background:rgba(6,20,12,.65);border:1px solid rgba(22,194,100,.22);border-radius:10px;padding:10px 6px;text-align:center;}
.gs-stat .sv{font-family:'Bebas Neue';font-size:17px;color:var(--gold-bright);line-height:1.15;word-break:break-word;}
.gs-stat .sl{font-family:'Barlow Condensed';font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:3px;}
.tbl-toggle{display:flex;background:#0a1810;border:1px solid rgba(22,194,100,.28);border-radius:10px;overflow:hidden;margin-bottom:14px;}
.tbl-toggle button{flex:1;padding:9px 4px;border:none;background:none;color:var(--muted);font-family:'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;font-size:13px;cursor:pointer;}
.tbl-toggle button.on{background:linear-gradient(135deg,rgba(240,201,58,.18),rgba(22,194,100,.1));color:var(--gold-bright);}
.ko-match{display:flex;align-items:center;gap:8px;background:rgba(10,28,18,.7);border:1px solid rgba(22,194,100,.18);border-radius:10px;padding:10px 12px;margin-bottom:8px;}
.ko-team{flex:1;display:flex;align-items:center;gap:6px;font-family:'Bebas Neue';font-size:14px;min-width:0;}
.ko-vs{font-family:'Bebas Neue';font-size:15px;color:var(--muted);flex:0 0 auto;}
.ko-time{font-family:'Barlow Condensed';font-size:11px;letter-spacing:.04em;color:var(--muted);white-space:nowrap;}
/* ── rich profile ── */
.prof-modal{background:linear-gradient(180deg,#10141a,#0a0d12);border-color:rgba(201,168,76,.4);}
.prof-hero{position:relative;padding:28px 20px 20px;border-radius:18px 18px 0 0;border-bottom:1px solid rgba(201,168,76,.2);overflow:hidden;text-align:center;}
.prof-hero .close{position:absolute;top:12px;right:14px;background:rgba(0,0,0,.35);border:none;color:#fff;font-size:20px;width:30px;height:30px;border-radius:50%;cursor:pointer;line-height:1;}
.prof-emoji{font-size:72px;line-height:1;display:block;margin-bottom:10px;filter:drop-shadow(0 4px 14px rgba(0,0,0,.5));}
.prof-name{font-family:'Bebas Neue';font-size:36px;letter-spacing:.05em;margin:4px 0;}
.prof-tagline{font-style:italic;color:#d8d4c6;font-size:14px;margin-top:4px;}
.prof-plays-like{display:inline-flex;align-items:center;gap:6px;margin-top:8px;background:rgba(240,201,58,.1);border:1px solid rgba(240,201,58,.3);border-radius:999px;padding:4px 12px;font-family:'Barlow Condensed';font-size:13px;letter-spacing:.08em;color:var(--gold-bright);}
.prof-rank-badge{display:inline-flex;align-items:center;gap:4px;margin-top:8px;background:rgba(0,0,0,.35);border:1px solid rgba(201,168,76,.4);border-radius:999px;padding:3px 12px;font-family:'Bebas Neue';font-size:16px;color:var(--gold-bright);}
.prof-bio{font-size:13px;color:var(--muted);margin:10px 0 0;line-height:1.5;font-style:italic;}
.prof-section{padding:14px 18px;border-top:1px solid rgba(255,255,255,.06);}
.prof-sec-label{font-family:'Barlow Condensed';letter-spacing:.15em;text-transform:uppercase;font-size:11px;color:var(--muted);margin-bottom:10px;}
/* accuracy ring */
.acc-ring-wrap{display:flex;flex-direction:column;align-items:center;gap:10px;}
.acc-ring{position:relative;width:110px;height:110px;border-radius:50%;}
.acc-ring-inner{position:absolute;inset:12px;border-radius:50%;background:#0a0d12;display:flex;align-items:center;justify-content:center;}
.acc-pct{font-family:'Bebas Neue';font-size:30px;color:var(--gold-bright);}
.acc-sub{font-family:'Barlow Condensed';font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);}
/* pick heatmap */
.heatmap{display:flex;flex-wrap:wrap;gap:4px;}
.hm-sq{width:18px;height:18px;border-radius:4px;cursor:pointer;transition:transform .1s;}
.hm-sq:hover{transform:scale(1.3);}
.hm-sq.hit{background:#16c264;box-shadow:0 0 6px rgba(22,194,100,.5);}
.hm-sq.miss{background:var(--danger);box-shadow:0 0 6px rgba(230,57,70,.3);}
.hm-sq.no-pick{background:#1a2e22;border:1px solid rgba(138,170,150,.2);}
.hm-tip{font-family:'Barlow Condensed';font-size:12px;color:var(--muted);margin-top:6px;letter-spacing:.03em;min-height:16px;}
/* signature win */
.sig-win{background:linear-gradient(135deg,rgba(212,175,55,.14),rgba(22,194,100,.1));border:1px solid rgba(212,175,55,.4);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:14px;}
.sig-trophy-ico{font-size:32px;}
.sig-teams{flex:1;}
.sig-matchup{font-family:'Bebas Neue';font-size:18px;letter-spacing:.04em;display:flex;align-items:center;gap:8px;}
.sig-pts{font-family:'Bebas Neue';font-size:22px;color:var(--gold-bright);}
/* badge cabinet */
.badge-row{display:flex;gap:8px;flex-wrap:wrap;}
.badge{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 10px 8px;border-radius:12px;border:1px solid;min-width:60px;text-align:center;}
.badge.earned{background:rgba(212,175,55,.12);border-color:rgba(212,175,55,.4);}
.badge.locked{background:rgba(20,30,24,.5);border-color:#232326;opacity:.5;filter:grayscale(.6);}
.badge-ico{font-size:24px;line-height:1;}
.badge-name{font-family:'Barlow Condensed';font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);}
/* H2H table */
.h2h-tbl{width:100%;border-collapse:collapse;font-size:13px;}
.h2h-tbl th{font-family:'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase;font-size:10px;color:var(--muted);text-align:right;padding:3px 6px;font-weight:600;}
.h2h-tbl th:first-child{text-align:left;}
.h2h-tbl td{padding:5px 6px;border-top:1px dashed rgba(138,170,150,.12);text-align:right;}
.h2h-tbl td:first-child{text-align:left;}
.h2h-tbl .h2h-w{color:#16c264;font-family:'Bebas Neue';font-size:15px;}
.h2h-tbl .h2h-l{color:var(--danger);font-family:'Bebas Neue';font-size:15px;}
.h2h-tbl .h2h-d{color:var(--muted);font-family:'Bebas Neue';font-size:15px;}
/* gap to next */
.gap-next{background:rgba(79,195,247,.08);border:1px solid rgba(79,195,247,.25);border-radius:10px;padding:10px 14px;font-family:'Barlow Condensed';letter-spacing:.06em;font-size:14px;color:var(--sky);text-align:center;}
/* form trail big */
.form-big{display:flex;gap:6px;align-items:center;flex-wrap:wrap;}
.fb-dot{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#06140c;}
/* profile page */
.prof-page{max-width:640px;margin:0 auto;padding:12px 16px 100px;}
/* emoji grid */
.emoji-grid{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;}
.emoji-opt{font-size:24px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:8px;border:2px solid transparent;cursor:pointer;background:#0a1810;transition:border-color .12s,background .12s;}
.emoji-opt.on{border-color:var(--gold-bright);background:rgba(240,201,58,.15);}
.emoji-opt:hover{border-color:rgba(201,168,76,.5);}
/* picks page — allow vertical scroll, capture horizontal swipe for date nav */
.picks-page{touch-action:pan-y;}
/* section picker bottom sheet */
.section-picker-bg{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);animation:fadeIn 0.2s ease;}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
.section-picker-sheet{position:fixed;bottom:0;left:0;right:0;background:linear-gradient(180deg,#0e2418,#08140c);border-radius:20px 20px 0 0;border-top:1px solid rgba(255,255,255,0.1);padding:12px 16px calc(24px + env(safe-area-inset-bottom));animation:slideUp 0.28s cubic-bezier(0.2,1.3,0.4,1);z-index:201;}
@keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
.sp-grip{width:36px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;margin:0 auto 14px;}
.sp-title{font-family:'Bebas Neue';font-size:22px;letter-spacing:.06em;text-align:center;margin-bottom:14px;}
.sp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;}
.sp-grid:has(.sp-tile:nth-child(2):last-child){grid-template-columns:repeat(2,1fr);max-width:240px;margin-left:auto;margin-right:auto;}
.sp-tile{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;border-radius:14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);cursor:pointer;transition:all 0.15s ease;position:relative;}
.sp-tile.active{background:color-mix(in srgb, var(--tile-colour) 20%, transparent);border-color:var(--tile-colour);box-shadow:0 0 16px color-mix(in srgb, var(--tile-colour) 30%, transparent);}
.sp-tile:active{transform:scale(0.95);}
.sp-tile-icon{font-size:26px;line-height:1;}
.sp-tile-label{font-family:'Barlow Condensed';font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--white);}
.sp-tile-dot{position:absolute;top:8px;right:8px;width:6px;height:6px;border-radius:50%;background:var(--tile-colour);}
.sp-cancel{width:100%;padding:12px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);font-family:'Barlow Condensed';font-size:14px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);cursor:pointer;}
/* page position dots — sits above bottom nav */
.page-dots{position:fixed;bottom:calc(64px + env(safe-area-inset-bottom) + 10px);left:50%;transform:translateX(-50%);display:flex;gap:6px;align-items:center;z-index:49;pointer-events:auto;}
.page-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.25);cursor:pointer;transition:all 0.2s ease;}
.page-dot.active{width:18px;border-radius:3px;background:var(--dot-colour);box-shadow:0 0 8px var(--dot-colour);}
/* hero ghost trophy */
.hero-trophy-img{position:absolute;right:-10px;bottom:0;height:90%;width:auto;object-fit:contain;opacity:0.10;pointer-events:none;
  mask-image:linear-gradient(to left, rgba(0,0,0,0.6), transparent);-webkit-mask-image:linear-gradient(to left, rgba(0,0,0,0.6), transparent);}
/* ── pitch-style match cards (Picks page) ── */
.match-card-pitch{position:relative;border-radius:14px;overflow:hidden;margin-bottom:12px;border:1px solid rgba(255,255,255,0.1);box-shadow:0 4px 20px rgba(0,0,0,0.4);min-height:130px;}
.pitch-bg{position:absolute;inset:0;display:flex;}
.pitch-bg::before{content:'';position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.38));pointer-events:none;}
.pitch-zone{flex:1;opacity:0.10;}
.pitch-zone-a{background:var(--team-colour, #16c264);opacity:0.10;}
.pitch-zone-b{background:var(--team-colour, #e63946);opacity:0.10;}
.pitch-centre-line{position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.25);transform:translateX(-50%);}
.pitch-centre-circle{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);background:transparent;}
.pitch-bg::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(0,0,0,0.06) 28px,rgba(0,0,0,0.06) 56px);}
.pitch-meta{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.14em;color:var(--muted);padding:10px 12px 0;}
.pitch-content{position:relative;z-index:1;display:flex;align-items:center;padding:14px 10px;gap:8px;}
.pitch-team{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;}
.pitch-team-name{font-family:'Bebas Neue';font-size:15px;letter-spacing:.04em;line-height:1;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.8);}
.match-card-pitch .pickbtn{padding:8px 18px;font-size:16px;}
.pitch-centre{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:64px;}
.pitch-score{font-size:28px;color:var(--gold-bright);line-height:1;text-shadow:0 0 12px rgba(240,201,58,0.5);}
.pitch-time{font-family:'Barlow Condensed';font-size:12px;letter-spacing:.1em;color:var(--muted);}
.pitch-lock{font-size:10px;color:var(--muted);letter-spacing:.1em;}
.pitch-extra{position:relative;z-index:1;padding:0 12px;}
.pitch-extra:empty{display:none;}
.pitch-calledit{text-align:center;padding:6px;margin:0 -12px;background:rgba(240,201,58,0.12);border-top:1px solid rgba(240,201,58,0.3);font-family:'Bebas Neue';font-size:14px;color:var(--gold-bright);letter-spacing:.08em;}
/* ── knockout stage theme ── */
.hero-stage-chip{position:relative;display:inline-flex;align-items:center;gap:7px;margin-top:12px;padding:6px 16px;border-radius:999px;
  background:rgba(7,13,10,.72);border:1px solid var(--gold);font-family:'Barlow Condensed';text-transform:uppercase;
  font-size:12px;letter-spacing:.22em;color:var(--gold-bright);animation:chipGlow 2.4s ease-in-out infinite;}
@keyframes chipGlow{0%,100%{box-shadow:0 0 6px rgba(240,201,58,.25)}50%{box-shadow:0 0 18px rgba(240,201,58,.6)}}
.stage-tracker{display:flex;align-items:center;justify-content:space-between;gap:2px;margin-top:14px;padding:14px 12px;border-radius:14px;
  background:linear-gradient(160deg,rgba(18,58,35,.85),rgba(9,26,16,.92));border:1px solid rgba(201,168,76,.25);overflow-x:auto;scrollbar-width:none;}
.stage-tracker::-webkit-scrollbar{display:none;}
.st-node{display:flex;flex-direction:column;align-items:center;gap:5px;flex:0 0 auto;}
.st-dot{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue';font-size:13px;
  background:#0a1810;border:1px solid rgba(138,170,150,.3);color:var(--muted);}
.st-lab{font-family:'Barlow Condensed';font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);white-space:nowrap;}
.st-node.done .st-dot{background:rgba(45,110,71,.5);border-color:#3fae6c;color:#bdf3d2;}
.st-node.done .st-lab{color:#7fb99a;}
.st-node.now .st-dot{background:linear-gradient(135deg,var(--gold),var(--gold-bright));border-color:var(--gold-bright);color:#1a1405;font-weight:700;
  animation:stNowPulse 1.8s ease-in-out infinite;}
.st-node.now .st-lab{color:var(--gold-bright);font-weight:700;}
@keyframes stNowPulse{0%,100%{box-shadow:0 0 8px rgba(240,201,58,.45)}50%{box-shadow:0 0 22px rgba(240,201,58,.9)}}
.st-link{flex:1;height:2px;min-width:8px;background:rgba(138,170,150,.25);border-radius:1px;}
.st-link.done{background:linear-gradient(90deg,#3fae6c,var(--gold));box-shadow:0 0 6px rgba(63,174,108,.4);}
/* round-of-16 countdown */
.r16-timer{position:relative;overflow:hidden;text-align:center;margin-top:14px;padding:16px 14px 14px;border-radius:16px;
  background:radial-gradient(ellipse 80% 90% at 50% 0%,rgba(240,201,58,.16),transparent 65%),linear-gradient(160deg,rgba(18,58,35,.9),rgba(9,26,16,.95));
  border:1px solid rgba(201,168,76,.45);box-shadow:0 4px 20px rgba(0,0,0,.35);}
.r16-timer-label{font-family:'Barlow Condensed';font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--gold-bright);margin-bottom:10px;}
.r16-boxes{display:flex;justify-content:center;gap:8px;}
.rt-box{background:#050a06;border:1px solid rgba(201,168,76,.4);border-radius:10px;padding:8px 0 6px;width:64px;}
.rt-num{font-family:'Bebas Neue';font-size:32px;line-height:1;color:var(--gold-bright);text-shadow:0 0 14px rgba(240,201,58,.5);font-variant-numeric:tabular-nums;}
.rt-lab{font-family:'Barlow Condensed';font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-top:3px;}
.r16-timer-sub{font-family:'Barlow Condensed';font-size:11px;letter-spacing:.08em;color:var(--muted);margin-top:9px;}
/* qualified-for-next-round table */
.qual-panel{margin-top:16px;padding:14px;border-radius:16px;background:linear-gradient(180deg,rgba(13,50,28,.88),rgba(9,26,18,.92));border:1px solid rgba(63,174,108,.35);}
.qual-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;}
.qual-title{font-family:'Bebas Neue';font-size:19px;letter-spacing:.07em;color:var(--white);}
.qual-count{font-family:'Bebas Neue';font-size:14px;color:var(--gold-bright);background:rgba(240,201,58,.1);border:1px solid rgba(240,201,58,.35);border-radius:999px;padding:2px 11px;white-space:nowrap;}
.qual-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:7px;}
.qual-chip{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:10px;background:rgba(45,110,71,.24);border:1px solid rgba(63,174,108,.4);animation:rowIn .4s ease both;}
.qual-chip .qc-name{font-family:'Bebas Neue';font-size:15px;letter-spacing:.04em;line-height:1;}
.qual-chip .qc-grp{margin-left:auto;font-family:'Barlow Condensed';font-size:9px;letter-spacing:.1em;color:var(--muted);text-transform:uppercase;}
.qual-chip.tbd{background:rgba(10,24,16,.5);border-style:dashed;border-color:rgba(138,170,150,.3);justify-content:center;}
.qual-chip.tbd .qc-name{color:var(--muted);}
`;

/* ── scoring tables ─────────────────────────────────────────── */
const STAGES = ["GROUP", "R32", "R16", "QF", "SF", "FINAL"];
const STAGE_LABEL = { GROUP: "Group Stage", R32: "Round of 32", R16: "Round of 16", QF: "Quarter-Final", SF: "Semi-Final", FINAL: "Final" };
const STAGE_PTS = { GROUP: 3, R32: 5, R16: 8, QF: 10, SF: 13, FINAL: 18 };
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
const FINAL4_TEAMS = ["France", "Argentina", "Spain", "England"];
const FINAL4_VALUE = { France: 5, Argentina: 10, Spain: 15, England: 20 };
const FINAL4_CONSOLATION = { France: 3, Argentina: 5, Spain: 8, England: 10 };
function gbValue(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("mbapp") || n.includes("messi")) return 8;
  if (n.includes("bellingham") || n.includes("kane")) return 12;
  return 20;
}
const gbNorm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
function gbMatches(pickName, winnerName) {
  if (!pickName || !winnerName) return false;
  const pt = gbNorm(pickName).split(/\s+/).filter(Boolean);
  const wt = gbNorm(winnerName).split(/\s+/).filter(Boolean);
  if (!pt.length || !wt.length) return false;
  // whole-token surname match in either direction ("Mbappé" ↔ "Kylian Mbappé")
  // — a raw substring check would let "Son" match inside "Jackson"
  return pt[pt.length - 1] === wt[wt.length - 1] ||
    wt.includes(pt[pt.length - 1]) || pt.includes(wt[wt.length - 1]);
}
const PRIZES = [
  ["champion", "🥇", "Overall Champion", 0.50, "Highest total score"],
  ["group", "📊", "Group Stage", 0.15, "Most group-stage daily pts"],
  ["knockout", "⚔️", "Knockout", 0.20, "Knockout pts incl. qualify + scoreline"],
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
  "Australia":["#00247D","#ffffff","#E4002B"],"Senegal":["#00853F","#FDEF42","#E31B23"],
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
  "Cape Verde":["#003893","#ffffff","#F7D116","#CF2027"],"Cabo Verde":["#003893","#ffffff","#F7D116","#CF2027"],"Ivory Coast":["#FF8200","#ffffff","#009A44"],
  "Bosnia & Herzegovina":["#002395","#FECB00","#ffffff"],"Bosnia and Herzegovina":["#002395","#FECB00","#ffffff"],"Bosnia":["#002395","#FECB00","#ffffff"],
  "Greece":["#0D5EAF","#ffffff"],"Romania":["#002B7F","#FCD116","#CE1126"],"Czech Republic":["#11457E","#ffffff","#D7141A"],
  "Czechia":["#11457E","#ffffff","#D7141A"],"Hungary":["#CD2A3E","#ffffff","#436F4D"],"Slovakia":["#0B4EA2","#ffffff","#EE1C25"],
  "Slovenia":["#005DA4","#ffffff","#ED1C24"],"Republic of Ireland":["#169B62","#ffffff","#FF883E"],"Ireland":["#169B62","#ffffff","#FF883E"],
  "Bolivia":["#D52B1E","#F9E300","#007934"],"Venezuela":["#FCD116","#00247D","#CF142B"],"Chile":["#0039A6","#ffffff","#D52B1E"],
  "South Africa":["#007A4D","#FFB915","#000000","#DE3831"],"Mali":["#14B53A","#FCD116","#CE1126"],"Burkina Faso":["#EF2B2D","#009E49","#FCD116"],
  "DR Congo":["#007FFF","#F7D618","#CE1021"],"Congo DR":["#007FFF","#F7D618","#CE1021"],"Angola":["#CE1126","#000000","#FFCB00"],
  "Iraq":["#CE1126","#ffffff","#000000","#007A3D"],"United Arab Emirates":["#00732F","#ffffff","#CE1126","#000000"],"UAE":["#00732F","#ffffff","#CE1126"],
  "Oman":["#DB161B","#ffffff","#008000"],"Bahrain":["#CE1126","#ffffff"],"China":["#DE2910","#FFDE00"],"China PR":["#DE2910","#FFDE00"],
  "Curacao":["#002B7F","#FCD116","#ffffff"],"Curaçao":["#002B7F","#FCD116","#ffffff"],"Haiti":["#00209F","#D21034","#ffffff"],
  "Honduras":["#0073CF","#ffffff"],"El Salvador":["#0F47AF","#ffffff"],"Guatemala":["#4997D0","#ffffff"],
  "Suriname":["#377E3F","#ffffff","#B40A2D","#ECC81D"],"Trinidad and Tobago":["#DA1A35","#ffffff","#000000"],"New Caledonia":["#009543","#ED4135","#0035AD"],
};
const HYPE = ["LET'S GO!", "HERE WE GO!", "LOCKED IN!", "BET PLACED!", "STAMPED!"];
// Resolve a nation's flag colours with normalization + fuzzy fallback.
const _ccNorm = (() => { const map = {}; for (const [k, v] of Object.entries(COUNTRY_COLORS)) map[(k || "").toLowerCase().replace(/[&.\-']/g, " ").replace(/\s+/g, " ").trim()] = v; return map; })();
function colorsFor(name) {
  if (!name) return ["#ffd633", "#16c264", "#ffffff"];
  const n = (name || "").toLowerCase().replace(/[&.\-']/g, " ").replace(/\s+/g, " ").trim();
  if (_ccNorm[n]) return _ccNorm[n];
  const fuzzy = [["bosnia", ["#002395", "#FECB00", "#ffffff"]], ["cabo verde", ["#003893", "#ffffff", "#F7D116", "#CF2027"]], ["cape verde", ["#003893", "#ffffff", "#F7D116", "#CF2027"]], ["ivory", ["#FF8200", "#ffffff", "#009A44"]], ["korea", ["#ffffff", "#CD2E3A", "#0047A0"]], ["iran", ["#239F40", "#ffffff", "#DA0000"]], ["czech", ["#11457E", "#ffffff", "#D7141A"]], ["united states", ["#B22234", "#ffffff", "#3C3B6E"]]];
  for (const [frag, cols] of fuzzy) if (n.includes(frag)) return cols;
  return ["#ffd633", "#16c264", "#ffffff"];
}

const DEFAULT_GAME = {
  config: { groupName: "PRIVATE LEAGUE", buyIn: 20, adminPass: "wc2026", currency: "S$" },
  players: [], teams: [], matches: [], picks: {}, underdog: {}, final8: {}, final4: {}, goldenBoot: {}, shame: {},
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

/* ── LEGEND MASCOTS (original characters, inline SVG) ───────────── */
const MASCOT_LIST = [
  { id: "magician", name: "The Magician", skin: "#9c6230", skinDark: "#7a4a22", hair: "#161616", kit: "#ffd633", kitDark: "#e0a800", accent: "#16c264" },
  { id: "machine", name: "The Machine", skin: "#e0ac69", skinDark: "#c2894a", hair: "#3a2a1a", kit: "#e63946", kitDark: "#b8202d", accent: "#ffffff" },
  { id: "wall", name: "The Wall", skin: "#c68642", skinDark: "#a06a30", hair: "#1c1c1c", kit: "#16c264", kitDark: "#0d8a45", accent: "#ffd633" },
  { id: "maestro", name: "The Maestro", skin: "#f1c27d", skinDark: "#d4a05a", hair: "#5a3a1a", kit: "#33b5e5", kitDark: "#1c87b5", accent: "#ffffff" },
  { id: "rocket", name: "The Rocket", skin: "#7a4a22", skinDark: "#5c3618", hair: "#0a0a0a", kit: "#ff5fa2", kitDark: "#d6377d", accent: "#ffd633" },
  { id: "general", name: "The General", skin: "#e0ac69", skinDark: "#c2894a", hair: "#2a2a2a", kit: "#9b59b6", kitDark: "#7a3f95", accent: "#ffd633" },
];
const MASCOT_BY = Object.fromEntries(MASCOT_LIST.map((m) => [m.id, m]));

// pose: idle | celebrate | despair | taunt
function Mascot({ id = "magician", pose = "idle", size = 64, noBall = false }) {
  const m = MASCOT_BY[id] || MASCOT_LIST[0];
  const armUp = pose === "celebrate" || pose === "taunt";
  const num = { magician: 10, machine: 9, wall: 1, maestro: 8, rocket: 7, general: 4 }[id] || 10;
  const dark = "#00000022";
  return (
    <div className={`mascot mascot-${pose}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 128" width={size} height={size * 1.28} style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id={`sk-${id}`} cx="42%" cy="35%" r="75%">
            <stop offset="0%" stopColor={m.skin} />
            <stop offset="100%" stopColor={m.skinDark || m.skin} />
          </radialGradient>
          <linearGradient id={`kt-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={m.kit} />
            <stop offset="100%" stopColor={m.kitDark || m.kit} />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="123" rx="26" ry="4.5" fill="rgba(0,0,0,.32)" />
        {/* ── legs ── */}
        <rect x="40" y="86" width="8" height="10" rx="3" fill={`url(#sk-${id})`} />
        <rect x="52" y="86" width="8" height="10" rx="3" fill={`url(#sk-${id})`} />
        {/* socks */}
        <rect x="39.5" y="95" width="9" height="14" rx="3.5" fill={m.accent} />
        <rect x="51.5" y="95" width="9" height="14" rx="3.5" fill={m.accent} />
        <rect x="39.5" y="96" width="9" height="3" fill="#ffffff" opacity=".75" />
        <rect x="51.5" y="96" width="9" height="3" fill="#ffffff" opacity=".75" />
        {/* boots */}
        <path d="M36 109 h13 q4 0 4 4 v1 q0 1 -1 1 h-18 q-1 0 -1 -1 v-1 q0 -4 3 -4 Z" fill="#161616" />
        <path d="M49 109 h13 q3 0 3 4 v1 q0 1 -1 1 h-18 q-1 0 -1 -1 v-1 q0 -4 4 -4 Z" fill="#161616" />
        <circle cx="40" cy="115" r=".9" fill="#666" /><circle cx="44" cy="115" r=".9" fill="#666" />
        <circle cx="56" cy="115" r=".9" fill="#666" /><circle cx="60" cy="115" r=".9" fill="#666" />
        {/* ── shorts ── */}
        <path d="M33 77 q17 5 34 0 l-1 8 q-7 4 -16 4 q-9 0 -16 -4 Z" fill="#f4f4f4" />
        <path d="M49.5 78 q.5 6 0 11" stroke={m.kit} strokeWidth="1.5" fill="none" opacity=".5" />
        {/* ── jersey ── */}
        <path d="M32 54 q18 -7 36 0 l2 24 q-20 6 -40 0 Z" fill={`url(#kt-${id})`} />
        {/* sleeves */}
        <g style={{ transformOrigin: "34px 58px" }}>
          <path d={armUp ? "M34 56 q-10 -10 -16 -18 l5 -4 q8 8 15 16 Z" : "M34 57 q-9 4 -12 18 l6 2 q4 -12 11 -15 Z"} fill={`url(#kt-${id})`} />
          <circle cx={armUp ? "19" : "23"} cy={armUp ? "35" : "78"} r="5" fill={`url(#sk-${id})`} />
          {id === "general" && <rect x={armUp ? "22" : "20"} y={armUp ? "44" : "66"} width="8" height="4" rx="1" fill="#ffd633" transform={armUp ? "rotate(-40 26 46)" : ""} />}
        </g>
        <g style={{ transformOrigin: "66px 58px" }}>
          <path d={armUp ? "M66 56 q10 -10 16 -18 l-5 -4 q-8 8 -15 16 Z" : "M66 57 q9 4 12 18 l-6 2 q-4 -12 -11 -15 Z"} fill={`url(#kt-${id})`} />
          <circle cx={armUp ? "81" : "77"} cy={armUp ? "35" : "78"} r="5" fill={`url(#sk-${id})`} />
        </g>
        {/* collar + number */}
        <path d="M43 54 q7 7 14 0 l-2 -4 q-5 4 -10 0 Z" fill={m.accent} />
        <path d="M33 55 l1.5 22 l3 .6 l-1.4 -22 Z" fill={m.accent} opacity=".55" />
        <path d="M67 55 l-1.5 22 l-3 .6 l1.4 -22 Z" fill={m.accent} opacity=".55" />
        <text x="50" y="73" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="14" fill={m.accent}>{num}</text>
        {/* ── head ── */}
        <circle cx="50" cy="35" r="20" fill={`url(#sk-${id})`} />
        {/* ears */}
        <circle cx="30" cy="36" r="3.5" fill={m.skin} /><circle cx="70" cy="36" r="3.5" fill={m.skin} />
        {/* hair / headgear per archetype */}
        {id === "magician" && <><circle cx="50" cy="20" r="16" fill={m.hair} /><circle cx="34" cy="27" r="8" fill={m.hair} /><circle cx="66" cy="27" r="8" fill={m.hair} /><circle cx="40" cy="18" r="7" fill={m.hair} /><circle cx="60" cy="18" r="7" fill={m.hair} /><rect x="32" y="25" width="36" height="5" rx="2.5" fill={m.accent} /></>}
        {id === "machine" && <path d="M32 28 Q50 6 68 28 Q66 17 50 14 Q34 17 32 28 Z" fill={m.hair} />}
        {id === "wall" && <><path d="M31 26 Q50 12 69 26 L69 20 Q50 14 31 20 Z" fill={m.hair} /><rect x="33" y="30" width="34" height="3" rx="1.5" fill="#222" opacity=".4" /></>}
        {id === "maestro" && <path d="M30 30 Q34 12 50 14 Q66 12 70 30 Q62 20 50 22 Q38 20 30 30 Z" fill={m.hair} />}
        {id === "rocket" && <><path d="M34 24 L42 10 L50 24 Z" fill={m.hair} /><path d="M50 24 L58 10 L66 24 Z" fill={m.hair} /><path d="M42 22 L50 11 L58 22 Z" fill={m.hair} /><rect x="32" y="22" width="36" height="6" rx="3" fill={m.hair} /></>}
        {id === "general" && <><path d="M31 25 Q50 14 69 25 L69 21 Q50 15 31 21 Z" fill={m.hair} /><path d="M40 17 q10 -5 20 0" stroke={m.hair} strokeWidth="4" fill="none" strokeLinecap="round" /></>}
        {/* ── face ── */}
        {pose === "despair" ? (
          <>
            <path d="M40 34 Q43.5 31 47 34" stroke="#2a1d12" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M53 34 Q56.5 31 60 34" stroke="#2a1d12" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="50" cy="45" rx="4" ry="5" fill="#2a1d12" />
            <path d="M43 38 L41 47" stroke="#5ad1ff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="41" cy="49" r="1.6" fill="#5ad1ff" />
          </>
        ) : (
          <>
            <circle cx="43" cy="36" r="3.2" fill="#1a1a1a" /><circle cx="57" cy="36" r="3.2" fill="#1a1a1a" />
            <circle cx="44.2" cy="34.8" r="1.1" fill="#fff" /><circle cx="58.2" cy="34.8" r="1.1" fill="#fff" />
            <path d="M39 30 Q43 28 47 30" stroke={m.hair} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M53 30 Q57 28 61 30" stroke={m.hair} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            {(pose === "celebrate" || pose === "taunt")
              ? <path d="M42 44 Q50 54 58 44 Q50 48 42 44 Z" fill="#7a1f1f" stroke="#2a1d12" strokeWidth="1.5" strokeLinejoin="round" />
              : <path d="M44 45 Q50 50 56 45" stroke="#2a1d12" strokeWidth="2.4" fill="none" strokeLinecap="round" />}
            {(pose === "celebrate") && <path d="M44 46 Q50 49 56 46" stroke="#fff" strokeWidth="1.5" fill="none" opacity=".6" />}
            {pose === "taunt" && <ellipse cx="50" cy="48" rx="3.5" ry="2.2" fill="#e63946" />}
          </>
        )}
        <circle cx="37" cy="42" r="3" fill="#ff5a5a" opacity=".22" />
        <circle cx="63" cy="42" r="3" fill="#ff5a5a" opacity=".22" />
        {/* ── football ── */}
        {noBall ? null : pose === "celebrate" ? (
          <g className="mascot-ball-air">
            <circle cx="82" cy="18" r="6.5" fill="#fff" stroke="#111" strokeWidth="1" />
            <path d="M82 13.5 l2.8 2.2 -1.1 3.4 h-3.4 L79.2 15.7 Z" fill="#111" />
          </g>
        ) : pose !== "despair" ? (
          <g className="mascot-ball">
            <circle cx="68" cy="113" r="6.5" fill="#fff" stroke="#111" strokeWidth="1" />
            <path d="M68 108.5 l2.8 2.2 -1.1 3.4 h-3.4 L65.2 110.7 Z" fill="#111" />
          </g>
        ) : null}
      </svg>
    </div>
  );
}

const MASCOT_CSS = `
.mascot{display:inline-block;position:relative;}
.mascot-idle{animation:mascotBob 2.2s ease-in-out infinite;}
@keyframes mascotBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.mascot-celebrate{animation:mascotJump .6s ease-in-out infinite;}
@keyframes mascotJump{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-12px) rotate(2deg)}}
.mascot-despair{animation:mascotShake 2.5s ease-in-out infinite;}
@keyframes mascotShake{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.mascot-taunt{animation:mascotTaunt 1s ease-in-out infinite;}
@keyframes mascotTaunt{0%,100%{transform:scale(1)}50%{transform:scale(1.08) rotate(-3deg)}}
.mascot-ball{animation:ballBounce 1.4s ease-in-out infinite;transform-origin:center;}
@keyframes ballBounce{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-5px) rotate(180deg)}}
.mascot-ball-air{animation:ballAir 1s ease-in-out infinite;}
@keyframes ballAir{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-7px) rotate(220deg)}}
.mascot-pick{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:4px;}
.mascot-opt{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 4px;background:#0e0e11;border:1px solid #232326;border-radius:10px;color:var(--muted);cursor:pointer;font-size:10px;font-family:'Barlow Condensed';text-transform:uppercase;letter-spacing:.05em;min-height:64px;justify-content:center;}
.mascot-opt.on{border-color:var(--gold);box-shadow:0 0 10px rgba(240,201,58,.4);color:var(--gold-bright);}
.mo-name{font-size:9px;}
.page-anim{animation:pageFade 200ms ease forwards;}
@keyframes pageFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.sound-btn{flex:0 0 auto;padding:6px 10px;font-size:15px;line-height:1;}
.mbadge{display:inline-block;font-size:13px;animation:badgePop .5s cubic-bezier(.2,1.6,.4,1) both;}
@keyframes badgePop{0%{transform:scale(0) rotate(-30deg);opacity:0}100%{transform:none;opacity:1}}
.leader-hero{position:relative;display:flex;align-items:center;gap:14px;padding:14px 18px;margin-bottom:12px;border-radius:16px;background:linear-gradient(120deg,rgba(240,201,58,.16),rgba(28,52,39,.4));border:1px solid var(--gold);overflow:hidden;}
.podium-hero{position:relative;padding:12px 14px 0;margin-bottom:12px;border-radius:16px;background:linear-gradient(160deg,rgba(240,201,58,.14),rgba(13,122,63,.28));border:1px solid var(--gold);overflow:hidden;}
.podium{position:relative;display:flex;align-items:flex-end;justify-content:center;gap:8px;}
.pod-col{flex:1;max-width:120px;display:flex;flex-direction:column;align-items:center;cursor:pointer;text-align:center;}
.pod-trophy{font-size:24px;animation:podTrophy 2s ease-in-out infinite;filter:drop-shadow(0 0 10px rgba(240,201,58,.8));}
@keyframes podTrophy{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-7px) rotate(5deg)}}
.pod-char{margin-top:2px;position:relative;}
.pod-prop{position:absolute;right:-2px;bottom:6px;font-size:18px;animation:propBob 2.2s ease-in-out infinite;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5));}
@keyframes propBob{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-3px) rotate(6deg)}}
.pod-name{font-size:15px;line-height:1.05;margin-top:2px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pod-block{width:100%;margin-top:6px;border-radius:6px 6px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:4px;background:linear-gradient(180deg,rgba(240,201,58,.5),rgba(240,201,58,.08));border:1px solid rgba(240,201,58,.4);border-bottom:none;}
.pod-block-1{height:42px;background:linear-gradient(180deg,rgba(255,214,51,.65),rgba(255,214,51,.12));}
.pod-block-2{height:30px;}
.pod-block-3{height:22px;}
.pod-rank{font-family:'Bebas Neue';font-size:18px;color:var(--gold-bright);}
.leader-aura{position:absolute;inset:0;background:radial-gradient(circle at 18% 50%, rgba(240,201,58,.35), transparent 60%);animation:auraPulse 2.4s ease-in-out infinite;}
@keyframes auraPulse{0%,100%{opacity:.5}50%{opacity:1}}
.rivalry{background:linear-gradient(180deg,#12141a,#0d0d10);border:1px solid rgba(79,195,247,.4);border-radius:14px;padding:12px 14px;margin-bottom:12px;}
.riv-row{display:flex;align-items:center;gap:8px;font-size:12px;padding:3px 0;}
.riv-row>span:first-child{width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.riv-row>span:last-child{width:38px;text-align:right;font-family:'Bebas Neue';color:var(--gold-bright);}
.riv-bar{flex:1;height:10px;background:#0a0a0b;border-radius:5px;overflow:hidden;}
.riv-fill{display:block;height:100%;border-radius:5px;animation:rivGrow 1s cubic-bezier(.2,.9,.3,1) both;}
.riv-fill.me{background:linear-gradient(90deg,#4fc3f7,#2d6e47);}
.riv-fill.up{background:linear-gradient(90deg,var(--gold-bright),#e63946);}
@keyframes rivGrow{0%{width:0 !important}}
.riv-gap{text-align:center;font-family:'Barlow Condensed';letter-spacing:.05em;color:#bdf3d2;font-size:12px;margin-top:6px;text-transform:uppercase;}
`;

/* ── SOUND ENGINE (Web Audio synth, no files) ───────────────── */
let _actx = null;
function actx() { try { if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)(); return _actx; } catch (e) { return null; } }
function soundOn() { try { return localStorage.getItem("wc26-sound") === "1"; } catch (e) { return false; } }
function tone(freq, dur, type = "sine", vol = 0.18, when = 0) {
  const ac = actx(); if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(ac.destination);
  const t = ac.currentTime + when;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.02);
}
const SFX = {
  click() { if (soundOn()) tone(420, 0.07, "triangle", 0.12); },
  pick() { if (!soundOn()) return; tone(660, 0.08, "square", 0.1); tone(990, 0.12, "square", 0.1, 0.06); },
  payout() { if (!soundOn()) return; [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, "triangle", 0.16, i * 0.1)); },
  roar() { if (!soundOn()) return; const ac = actx(); if (!ac) return; tone(180, 0.5, "sawtooth", 0.08); tone(240, 0.6, "sawtooth", 0.06, 0.05); },
};

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
    // Deep-clone the defaults: a shallow spread would hand out DEFAULT_GAME's
    // own nested objects, and the first write to a key the stored row lacks
    // (e.g. final4 on an old row) would mutate the shared default in place.
    if (data && data.data) return { ...JSON.parse(JSON.stringify(DEFAULT_GAME)), ...data.data };
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

// ISO-2 codes for flag images (flagcdn.com) — robust on every device,
// unlike emoji flags which render blank on Windows/desktop.
const ISO = {
  "Argentina":"ar","France":"fr","Spain":"es","England":"gb-eng","Brazil":"br","Portugal":"pt",
  "Netherlands":"nl","Belgium":"be","Germany":"de","Croatia":"hr","Italy":"it","Morocco":"ma",
  "USA":"us","United States":"us","Mexico":"mx","Canada":"ca","Japan":"jp","South Korea":"kr",
  "Korea Republic":"kr","Australia":"au","Senegal":"sn","Ecuador":"ec","Uruguay":"uy","Colombia":"co",
  "Switzerland":"ch","Denmark":"dk","Poland":"pl","Serbia":"rs","Ghana":"gh","Cameroon":"cm",
  "Tunisia":"tn","Saudi Arabia":"sa","Qatar":"qa","Norway":"no","Sweden":"se","Turkey":"tr",
  "Scotland":"gb-sct","Wales":"gb-wls","Paraguay":"py","Peru":"pe","Costa Rica":"cr","Panama":"pa",
  "New Zealand":"nz","Ivory Coast":"ci","Nigeria":"ng","Algeria":"dz","Egypt":"eg","Cape Verde":"cv",
  "Jordan":"jo","Uzbekistan":"uz","IR Iran":"ir","Iran":"ir","Ukraine":"ua","Austria":"at",
  "Bosnia & Herzegovina":"ba","Bosnia and Herzegovina":"ba","Bosnia":"ba",
  "Cabo Verde":"cv","Cape Verde Islands":"cv",
  "Greece":"gr","Romania":"ro","Czech Republic":"cz","Czechia":"cz","Hungary":"hu","Slovakia":"sk",
  "Slovenia":"si","Republic of Ireland":"ie","Ireland":"ie","Bolivia":"bo","Venezuela":"ve","Chile":"cl",
  "South Africa":"za","Mali":"ml","Burkina Faso":"bf","DR Congo":"cd","Congo DR":"cd","Angola":"ao",
  "Iraq":"iq","United Arab Emirates":"ae","UAE":"ae","Oman":"om","Bahrain":"bh","China":"cn","China PR":"cn",
  "Curacao":"cw","Curaçao":"cw","Haiti":"ht","Honduras":"hn","Jamaica":"jm","El Salvador":"sv","Guatemala":"gt",
  "Suriname":"sr","Trinidad and Tobago":"tt","New Caledonia":"nc",
};
const _normName = (s) => (s || "").toLowerCase().replace(/[&.\-']/g, " ").replace(/\s+/g, " ").trim();
const _isoNorm = (() => {
  const map = {};
  for (const [k, v] of Object.entries(ISO)) map[_normName(k)] = v;
  return map;
})();
// extra fuzzy keys for tricky names
const _isoFuzzy = [
  ["bosnia", "ba"], ["herzegovina", "ba"], ["cabo verde", "cv"], ["cape verde", "cv"],
  ["ivory", "ci"], ["côte", "ci"], ["cote d", "ci"], ["korea republic", "kr"], ["south korea", "kr"],
  ["czech", "cz"], ["iran", "ir"], ["united states", "us"], ["congo dr", "cd"], ["dr congo", "cd"],
  ["emirates", "ae"], ["trinidad", "tt"], ["new caledonia", "nc"], ["curacao", "cw"], ["curaçao", "cw"],
];
function isoFor(name) {
  if (!name) return null;
  const n = _normName(name);
  if (_isoNorm[n]) return _isoNorm[n];
  for (const [frag, code] of _isoFuzzy) if (n.includes(frag)) return code;
  return null;
}

function Flag({ name, size = 20, style }) {
  const code = isoFor(name);
  if (!code) return <span style={style}>{flagFor(name)}</span>;
  return (
    <img
      src={`https://flagcdn.com/h40/${code}.png`}
      srcSet={`https://flagcdn.com/h80/${code}.png 2x`}
      alt={name || "flag"}
      width={Math.round(size * 1.5)} height={size}
      loading="lazy"
      style={{ borderRadius: 3, objectFit: "cover", verticalAlign: "middle", boxShadow: "0 1px 3px rgba(0,0,0,.4)", ...style }}
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}
function apiStage(s) {
  if (!s) return "GROUP";
  s = String(s).toUpperCase();
  if (s.includes("ROUND_OF_32") || s.includes("LAST_32") || s === "R32") return "R32";
  if (s.includes("ROUND_OF_16") || s.includes("LAST_16")) return "R16";
  if (s.includes("QUARTER") || s.includes("LAST_8")) return "QF";
  if (s.includes("SEMI") || s.includes("LAST_4")) return "SF";
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
  // Re-derive every stored match's stage from its raw API stage, so matches
  // saved under an old/broken mapping (e.g. LAST_16 stored as GROUP) heal even
  // when they're outside the current API payload's date window.
  for (const m of g.matches) if (m.apiStage) m.stage = apiStage(m.apiStage);
  for (const am of apiMatches) {
    // Knockout games with undecided teams come through blank — skip them.
    // They merge in automatically once the real teams are known.
    if (!am.homeTeam?.name || !am.awayTeam?.name) continue;
    // The bronze final isn't part of the league — without this it would sync
    // as a 3-pt GROUP match and pollute the settled group-stage prize.
    if (String(am.stage || "").toUpperCase().includes("THIRD")) continue;
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
      // Preserve the raw API stage, and re-apply the mapped stage so matches
      // that synced under an old/broken mapping (e.g. R32 stored as GROUP) self-correct.
      existing.apiStage = am.stage;
      existing.stage = stage;
      // carry the score for live AND finished matches (live = running score).
      // Finished knockout games use the 90-minute score (regularTime) — that's
      // what result + exact-scoreline picks are judged on; extra time / pens
      // decide only the qualifier.
      const isKo = stage !== "GROUP";
      const src = status === "finished" && isKo && am.score?.regularTime ? am.score.regularTime : am.score?.fullTime;
      if ((status === "finished" || status === "live") && src) {
        if (src.home != null) existing.scoreA = src.home;
        if (src.away != null) existing.scoreB = src.away;
      }
      // only fill a missing qualifier — never overwrite an admin correction
      if (status === "finished" && isKo && existing.qualifier == null) {
        if (am.score?.winner === "HOME_TEAM") existing.qualifier = "A";
        else if (am.score?.winner === "AWAY_TEAM") existing.qualifier = "B";
      }
      advanceFurthestOnResult(g, existing);
    } else {
      const isKo = stage !== "GROUP";
      const src = status === "finished" && isKo && am.score?.regularTime ? am.score.regularTime : am.score?.fullTime;
      const nm = { id: uid(), apiId: String(am.id), teamA: tA.id, teamB: tB.id,
        kickoff: am.utcDate, stage, apiStage: am.stage, status: status === "live" ? "scheduled" : status, live: status === "live",
        scoreA: src?.home ?? null, scoreB: src?.away ?? null };
      if (status === "finished" && isKo) {
        if (am.score?.winner === "HOME_TEAM") nm.qualifier = "A";
        else if (am.score?.winner === "AWAY_TEAM") nm.qualifier = "B";
      }
      g.matches.push(nm);
      advanceFurthestOnResult(g, nm);
    }
  }
  // Clean up any "TBA" placeholders created by earlier versions.
  const tbaIds = new Set(g.teams.filter((t) => t.name === "TBA").map((t) => t.id));
  if (tbaIds.size > 0) {
    g.matches = g.matches.filter((m) => !tbaIds.has(m.teamA) && !tbaIds.has(m.teamB));
    g.teams = g.teams.filter((t) => !tbaIds.has(t.id));
  }
}

/* ── push notifications ─────────────────────────────────────── */
const VAPID_PUBLIC = "BIILJr7hvUmqFCgkbG1dFXEbLrZ5Z5xtf5k4DE_FTJ2Mm39GU6uNJ2zEPl8D-aJwB7KxLLqrzG4zdyNAydET8N8";
function urlB64ToUint8(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
async function enablePush(playerId, playerName) {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return { ok: false, msg: "This device doesn't support notifications." };
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, msg: "Notifications were blocked. Enable them in your phone settings." };
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(VAPID_PUBLIC) });
    }
    await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sub, playerId, playerName }) });
    return { ok: true, msg: "Notifications on! You'll get pick reminders and results." };
  } catch (e) {
    return { ok: false, msg: "Couldn't turn on notifications: " + (e?.message || e) };
  }
}

/* ── scoring engine ─────────────────────────────────────────── */
function matchResult(m) {
  if (m.status !== "finished") return null;
  if (m.stage !== "GROUP") {
    // Every knockout round is scored on WHO GOES THROUGH — draws don't exist.
    // A level 90-min score is undecidable (null) until the qualifier lands
    // (API winner or admin toggle); pens games pay the qualifier's backers.
    if (m.qualifier === "A" || m.qualifier === "B") return m.qualifier;
    return m.scoreA > m.scoreB ? "A" : m.scoreA < m.scoreB ? "B" : null;
  }
  return m.scoreA > m.scoreB ? "A" : m.scoreA < m.scoreB ? "B" : "D";
}
// SF/Final picks are one merged "who goes through" answer, but old picks may
// carry only pred or only qual — each falls back to the other. pred 'D' gets
// no fallback: it can never match a through-result and scores 0.
function koCallOf(pk) {
  if (!pk) return null;
  if (pk.pred === "A" || pk.pred === "B") return pk.pred;
  if (pk.pred === "D") return "D";
  return pk.qual === "A" || pk.qual === "B" ? pk.qual : null;
}
function pickPoints(m, pick) {
  if (!pick || m.status !== "finished") return 0;
  const res = matchResult(m);
  if (!res) return 0; // SF/Final level after 90 with no qualifier yet — undecided
  const pred = m.stage === "SF" || m.stage === "FINAL" ? koCallOf(pick) : pick.pred;
  if (pred !== res) return 0;
  return STAGE_PTS[m.stage] || 3; // flat points for a correct result — no scoreline bonus
}
function teamUdPts(t) { return (t.wonAll3 ? 5 : 0) + (UD_VALUE[t.furthest] || 0); }
function teamGroupUdPts(t) { return (t.wonAll3 ? 5 : 0) + (UD_RANK[t.furthest] >= 1 ? 10 : 0); }
// Appearing in a knockout match proves a team reached that round whatever the
// result — an R32 fixture alone means it qualified from its group. A win then
// moves it up one more milestone, the round it advanced INTO. Keys are match
// stages; values are the milestone keys UD_VALUE/UD_RANK use.
const KO_PLAY_MILESTONE = { R32: "qualified", R16: "r16", QF: "qf", SF: "sf", FINAL: "final" };
const KO_WIN_MILESTONE = { R32: "r16", R16: "qf", QF: "sf", SF: "final", FINAL: "won" };
function bumpFurthest(g, teamId, milestone) {
  const team = g.teams.find((t) => t.id === teamId);
  if (team && (UD_RANK[milestone] || 0) > (UD_RANK[team.furthest] || 0)) team.furthest = milestone;
}
// `furthest` only ever moves forward (UD_RANK guards against going backwards).
// A 90-minute draw uses m.qualifier (extra time / penalties winner) when set;
// without it the winner bump is skipped.
function advanceFurthestOnResult(g, m) {
  const inRound = KO_PLAY_MILESTONE[m.stage];
  if (!inRound) return;
  bumpFurthest(g, m.teamA, inRound);
  bumpFurthest(g, m.teamB, inRound);
  if (m.status !== "finished" || m.scoreA == null || m.scoreB == null) return;
  const winnerId = m.scoreA > m.scoreB ? m.teamA : m.scoreB > m.scoreA ? m.teamB
    : m.qualifier === "A" ? m.teamA : m.qualifier === "B" ? m.teamB : null;
  if (winnerId) bumpFurthest(g, winnerId, KO_WIN_MILESTONE[m.stage]);
}

// Champion / runner-up of the tournament, from the finished FINAL: decided by
// the 90-min score when not level, otherwise by the qualifier field (ET/pens).
function finalOutcome(game) {
  const finalMatch = game.matches.find((m) => m.stage === "FINAL" && m.status === "finished");
  if (!finalMatch) return null;
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const a = tById[finalMatch.teamA], b = tById[finalMatch.teamB];
  let champName = null, runnerName = null;
  if (finalMatch.scoreA !== finalMatch.scoreB) {
    champName = finalMatch.scoreA > finalMatch.scoreB ? a?.name : b?.name;
    runnerName = finalMatch.scoreA > finalMatch.scoreB ? b?.name : a?.name;
  } else if (finalMatch.qualifier) {
    champName = finalMatch.qualifier === "A" ? a?.name : b?.name;
    runnerName = finalMatch.qualifier === "A" ? b?.name : a?.name;
  }
  return { finalMatch, champName, runnerName };
}

// SF/FINAL pick extensions for one finished match: qualifier call (+8) and
// exact 90-min scoreline (+20). Stack on top of the result pick. A match with
// no through-result yet (level, qualifier unset) awards nothing until it's set.
function pickExtraPoints(m, pk) {
  if (!pk || m.status !== "finished" || (m.stage !== "SF" && m.stage !== "FINAL")) return { qualPts: 0, slPts: 0 };
  if (!matchResult(m)) return { qualPts: 0, slPts: 0 };
  let qualPts = 0, slPts = 0;
  const qual = pk.qual === "A" || pk.qual === "B" ? pk.qual : (pk.pred === "A" || pk.pred === "B" ? pk.pred : null);
  if (qual && m.qualifier && qual === m.qualifier) qualPts = 8;
  if (pk.sa !== "" && pk.sb !== "" && pk.sa != null && pk.sb != null &&
      Number(pk.sa) === m.scoreA && Number(pk.sb) === m.scoreB) slPts = 20;
  return { qualPts, slPts };
}

function computeStandings(game) {
  const { players, matches, picks, underdog, teams } = game;
  const tById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const fo = finalOutcome(game);
  const has = (n, k) => (n || "").toLowerCase().includes((k || "").toLowerCase());
  return players.map((p) => {
    let daily = 0, groupDaily = 0, koDaily = 0, qualPts = 0, slPts = 0;
    for (const m of matches) {
      const pk = picks[m.id]?.[p.id];
      const extra = pickExtraPoints(m, pk);
      qualPts += extra.qualPts; slPts += extra.slPts;
      // qual + scoreline points fold into the daily/knockout buckets so the
      // knockout prize keeps working — total must NOT add them again.
      const pts = pickPoints(m, pk) + extra.qualPts + extra.slPts;
      daily += pts;
      if (m.stage === "GROUP") groupDaily += pts; else koDaily += pts;
    }
    const udTeam = underdog[p.id] ? tById[underdog[p.id].teamId] : null;
    const udPts = udTeam ? teamUdPts(udTeam) : 0;
    const udGroupPts = udTeam ? teamGroupUdPts(udTeam) : 0;
    const f4 = game.final4?.[p.id] || null;
    let f4Pts = 0;
    if (f4 && fo) {
      if (fo.champName && has(fo.champName, f4.team)) f4Pts = FINAL4_VALUE[f4.team] || 0;
      else if (fo.runnerName && has(fo.runnerName, f4.team)) f4Pts = FINAL4_CONSOLATION[f4.team] || 0;
    }
    const gb = game.goldenBoot?.[p.id] || null;
    const gbPts = gb && game.goldenBootWinner && gbMatches(gb.player, game.goldenBootWinner) ? gbValue(gb.player) : 0;
    const adjust = Number(p.adjust) || 0; // manual admin points (late joiners, corrections)
    return { p, daily, groupDaily, koDaily, qualPts, slPts, udTeam, udPts, udGroupPts, f4, f4Pts, gb, gbPts, adjust,
      knockout: koDaily, total: daily + udPts + f4Pts + gbPts + adjust };
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
    knockout: by((r) => r.knockout),
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
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return "now";
  if (s < 60) return s + "s";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}
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
// Form trail: last N finished picks as W/L (does NOT affect scoring)
function formTrail(game, playerId, n = 5) {
  const fin = game.matches.filter((m) => m.status === "finished" && game.picks[m.id]?.[playerId]?.pred)
    .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff)).slice(0, n);
  return fin.map((m) => game.picks[m.id][playerId].pred === matchResult(m) ? "W" : "L").reverse();
}

// Biggest mover vs the stored rank snapshot. Pure presentation.
function biggestMover(game) {
  const rows = computeStandings(game).sort((a, b) => b.total - a.total);
  const curRank = {}; rows.forEach((r, i) => { curRank[r.p.id] = i + 1; });
  const prev = game.rankSnapshot || null;
  if (!prev) return null;
  let best = null;
  for (const r of rows) {
    const was = prev[r.p.id];
    if (was == null) continue;
    const delta = was - curRank[r.p.id]; // positive = climbed
    if (!best || Math.abs(delta) > Math.abs(best.delta)) best = { name: r.p.name, delta, id: r.p.id };
  }
  return best && best.delta !== 0 ? best : null;
}

// How the league split on a match. Pure read, no scoring.
// Head-to-head: across finished matches both players picked, who got more
// correct. Pure read, no scoring impact.
function headToHead(game, pidA, pidB) {
  let aWins = 0, bWins = 0, both = 0, ties = 0;
  for (const m of game.matches) {
    if (m.status !== "finished") continue;
    const pa = game.picks[m.id]?.[pidA], pb = game.picks[m.id]?.[pidB];
    if (!pa?.pred || !pb?.pred) continue;
    both++;
    const res = matchResult(m);
    const aRight = pa.pred === res, bRight = pb.pred === res;
    if (aRight && !bRight) aWins++;
    else if (bRight && !aRight) bWins++;
    else ties++;
  }
  return { aWins, bWins, ties, both };
}

// Match of the day: the most "interesting" fixture today — prefer live, then
// soonest upcoming, then most recently finished. Pure presentation.
function matchOfDay(game) {
  const todayStr = new Date().toDateString();
  const todays = game.matches.filter((m) => m.status !== "void" && new Date(m.kickoff).toDateString() === todayStr);
  if (!todays.length) return null;
  const live = todays.find((m) => m.live);
  if (live) return live;
  const now = Date.now();
  const upcoming = todays.filter((m) => m.status !== "finished" && new Date(m.kickoff).getTime() > now)
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  if (upcoming.length) return upcoming[0];
  const finished = todays.filter((m) => m.status === "finished")
    .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));
  return finished[0] || todays[0];
}

function pickSplit(game, m) {
  const picks = game.picks[m.id] || {};
  let A = 0, B = 0, D = 0, total = 0;
  for (const pid in picks) {
    const pr = picks[pid]?.pred;
    if (pr === "A") A++; else if (pr === "B") B++; else if (pr === "D") D++; else continue;
    total++;
  }
  return { A, B, D, total };
}

function streakFor(game, playerId) {
  const fin = game.matches.filter((m) => m.status === "finished")
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  let s = 0;
  for (let i = fin.length - 1; i >= 0; i--) {
    const pk = game.picks[fin[i].id]?.[playerId];
    if (!pk?.pred) continue;
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
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const pieces = useRef([]);

  useEffect(() => {
    if (!burst) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = cv.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
    const pal = (colors && colors.length) ? colors : ["#ffd633", "#16c264", "#ffffff", "#e63946"];

    // spawn pieces: two side cannons + a top sprinkle
    const N = reduce ? 40 : 150;
    pieces.current = Array.from({ length: N }, (_, i) => {
      const fromLeft = i % 2 === 0;
      const cannon = i < N * 0.6;
      return {
        x: cannon ? (fromLeft ? W * 0.08 : W * 0.92) : Math.random() * W,
        y: cannon ? H * 0.78 : -20,
        vx: cannon ? (fromLeft ? 3 + Math.random() * 5 : -(3 + Math.random() * 5)) : (Math.random() - 0.5) * 2,
        vy: cannon ? -(7 + Math.random() * 7) : 2 + Math.random() * 2,
        g: 0.22 + Math.random() * 0.08,          // gravity
        drag: 0.992,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        color: pal[i % pal.length],
        sway: Math.random() * Math.PI * 2,
        life: 0,
      };
    });

    let start = performance.now();
    let prev = start;
    const DURATION = 3800;
    const tick = (now) => {
      const elapsed = now - start;
      // delta normalized to 60fps units, capped so a hitch can't fling pieces
      let dt = (now - prev) / 16.667;
      if (dt > 2.5) dt = 2.5; if (dt < 0.1) dt = 0.1;
      prev = now;
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of pieces.current) {
        p.vy += p.g * dt;
        p.vx *= Math.pow(p.drag, dt); p.vy *= Math.pow(p.drag, dt);
        p.sway += 0.04 * dt;
        p.x += (p.vx + Math.sin(p.sway) * 0.6) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        const fade = elapsed > DURATION - 900 ? Math.max(0, 1 - (elapsed - (DURATION - 900)) / 900) : 1;
        if (p.y < H + 20 && fade > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = fade;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (0.6 + Math.abs(Math.sin(p.rot)) * 0.4));
          ctx.restore();
        }
      }
      if (alive && elapsed < DURATION) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [burst, colors]);

  if (!burst) return null;
  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden />;
}

function StadiumBg() {
  const cvRef = useRef(null);
  const tiltRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) drawScene(0);
    }

    // Layer 3 — gold particles (normalised 0..1 coords so they survive resize)
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 1.5 + Math.random(),
      vy: 0.0006 + Math.random() * 0.0011,
      drift: (Math.random() - 0.5) * 0.0005,
      op: 0.2 + Math.random() * 0.4,
      ph: Math.random() * Math.PI * 2,
    }));
    // Layer 2 — floodlight beams, each with its own phase so they pan independently
    const beams = [
      { ox: 0.07, ph: 0.0, sw: 0.075 },
      { ox: 0.93, ph: 1.7, sw: 0.075 },
      { ox: 0.23, ph: 3.3, sw: 0.06 },
      { ox: 0.77, ph: 4.9, sw: 0.06 },
    ];

    function drawScene(now) {
      const tx = tiltRef.current.x, ty = tiltRef.current.y;
      ctx.clearRect(0, 0, W, H);

      // Layer 4 — crowd band (top ~15%): warm noise suggestion
      const crowd = ctx.createLinearGradient(0, 0, 0, H * 0.15);
      crowd.addColorStop(0, "rgba(240,180,50,0.04)");
      crowd.addColorStop(1, "rgba(240,180,50,0)");
      ctx.fillStyle = crowd;
      ctx.fillRect(0, 0, W, H * 0.15);

      // Layer 2 — floodlight beams from the top corners
      for (const b of beams) {
        const ox = b.ox * W + tx;
        const tip = W * 0.5 + Math.sin(now * 0.0005 + b.ph) * W * b.sw + ty * 0.5;
        const tipY = H * 0.72;
        const g = ctx.createRadialGradient(ox, -H * 0.06, 0, tip, tipY, H * 0.95);
        g.addColorStop(0, "rgba(255,255,255,0.06)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(ox, -H * 0.06);
        ctx.lineTo(tip - W * 0.16, tipY);
        ctx.lineTo(tip + W * 0.16, tipY);
        ctx.closePath();
        ctx.fill();
      }

      // Layer 1 — perspective pitch grid (bottom third), static
      const gH = H * 0.34, top = H - gH, cx = W / 2, halfBase = W * 0.62;
      ctx.save();
      ctx.strokeStyle = "rgba(26,140,72,0.20)";
      ctx.lineWidth = 1;
      for (let i = -6; i <= 6; i++) {
        const bx = cx + (i / 6) * halfBase;
        ctx.beginPath();
        ctx.moveTo(cx + (bx - cx) * 0.12, top);
        ctx.lineTo(bx, H);
        ctx.stroke();
      }
      for (let j = 0; j <= 7; j++) {
        const p = Math.pow(j / 7, 1.8);
        const y = top + gH * p;
        const half = halfBase * (0.12 + p * 0.88);
        ctx.globalAlpha = 0.10 + p * 0.16;
        ctx.beginPath();
        ctx.moveTo(cx - half, y);
        ctx.lineTo(cx + half, y);
        ctx.stroke();
      }
      ctx.restore();

      // Layer 3 — gold particles drifting upward
      ctx.fillStyle = "#ffd24a";
      for (const p of particles) {
        ctx.globalAlpha = p.op * (0.7 + 0.3 * Math.sin(now * 0.002 + p.ph));
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    let rafId = 0;
    function step(now) {
      for (const p of particles) {
        p.y -= p.vy;
        p.x += p.drift + Math.sin(now * 0.001 + p.ph) * 0.00012;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < -0.05) p.x = 1.05; else if (p.x > 1.05) p.x = -0.05;
      }
      drawScene(now);
      rafId = requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);
    if (reduce) {
      drawScene(0); // single static frame, no loop — respects reduced-motion
    } else {
      rafId = requestAnimationFrame(step);
    }

    const onTilt = (e) => {
      const clamp = (v) => Math.max(-20, Math.min(20, v));
      tiltRef.current = {
        x: clamp((e.gamma || 0) * (20 / 45)),
        y: clamp(((e.beta || 0) - 45) * (20 / 45)),
      };
    };
    const onVis = () => {
      if (reduce) return;
      cancelAnimationFrame(rafId);
      if (!document.hidden) rafId = requestAnimationFrame(step);
    };
    if (!reduce) window.addEventListener("deviceorientation", onTilt);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("deviceorientation", onTilt);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return <canvas ref={cvRef} aria-hidden style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
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

function isGroupStageEnding(game) {
  const gms = game.matches.filter(m => m.stage === "GROUP" && m.status !== "void");
  if (!gms.length) return false;
  const done = gms.filter(m => m.status === "finished").length;
  const ratio = done / gms.length;
  return ratio >= 0.75 && ratio < 1;
}
function isGroupStageDone(game) {
  const gms = game.matches.filter(m => m.stage === "GROUP" && m.status !== "void");
  if (!gms.length) return false;
  return gms.every(m => m.status === "finished");
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
            <div className="team"><span className="fl"><Flag name={a?.name} size={22} /></span><span className="nm">{a?.name}</span></div>
            {(match.status === "finished" || match.live) && match.scoreA != null
              ? <div className="score" key={`sc${match.scoreA}-${match.scoreB}`}>{match.scoreA} – {match.scoreB}</div> : <div className="vs">VS</div>}
            <div className="team"><span className="fl"><Flag name={b?.name} size={22} /></span><span className="nm">{b?.name}</span></div>
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
        const lockAt = new Date(m.kickoff).getTime();
        const locked = now >= lockAt || m.status === "finished";
        const myPick = me ? game.picks[m.id]?.[me.id] : null;
        const myCall = m.stage === "SF" || m.stage === "FINAL" ? koCallOf(myPick) : myPick?.pred;
        const myLabel = myCall ? (myCall === "A" ? a?.name : myCall === "B" ? b?.name : "Draw") : null;
        const isLive = m.live || (m.status !== "finished" && now >= new Date(m.kickoff).getTime() && now < new Date(m.kickoff).getTime() + 2.2 * 3600000);
        return (
          <div className={`match tap-match ${isLive ? "live-card" : ""}`} key={m.id} onClick={() => openMatchDetail(m)}>
            <div className="meta">
              <span>{STAGE_LABEL[m.stage]}</span>
              {isLive ? <span className="live"><span className="dot" />LIVE</span>
                : m.status === "finished" ? <span>FULL TIME</span> : <span>{new Date(m.kickoff).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>}
            </div>
            <div className="face">
              <div className="team"><span className="fl"><Flag name={a?.name} size={22} /></span><span className="nm">{a?.name}</span></div>
              {(m.status === "finished" || (isLive && m.scoreA != null)) ? <div className="score" key={`sc${m.scoreA}-${m.scoreB}`}>{m.scoreA} – {m.scoreB}</div> : <div className="vs">VS</div>}
              <div className="team"><span className="fl"><Flag name={b?.name} size={22} /></span><span className="nm">{b?.name}</span></div>
            </div>
            <div className="lockline" style={{ marginTop: 8 }}>
              {myLabel ? <span style={{ color: "var(--gold-bright)" }}>Your pick: {myLabel}</span>
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

function StatsPage({ game, me, mutate }) {
  const [sub, setSub] = useState("stats");
  const [takeText, setTakeText] = useState("");
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const finishedMatches = game.matches.filter((m) => m.status === "finished");
  const standings = computeStandings(game).sort((a, b) => b.total - a.total);

  const teamPickCount = {};
  const teamApps = {};
  for (const m of game.matches) {
    if (m.teamA) teamApps[m.teamA] = (teamApps[m.teamA] || 0) + 1;
    if (m.teamB) teamApps[m.teamB] = (teamApps[m.teamB] || 0) + 1;
    const mPicks = game.picks[m.id] || {};
    for (const pid in mPicks) {
      const pred = mPicks[pid]?.pred;
      if (pred === "A") teamPickCount[m.teamA] = (teamPickCount[m.teamA] || 0) + 1;
      else if (pred === "B") teamPickCount[m.teamB] = (teamPickCount[m.teamB] || 0) + 1;
    }
  }
  const sortedByCount = Object.entries(teamPickCount).sort((a, b) => b[1] - a[1]);
  const mostBackedTeam = sortedByCount[0] ? tById[sortedByCount[0][0]] : null;
  const mostBackedCount = sortedByCount[0]?.[1] || 0;

  const bankerEntry = [...Object.entries(teamPickCount)].sort((a, b) =>
    (b[1] / (teamApps[b[0]] || 1)) - (a[1] / (teamApps[a[0]] || 1))
  )[0];
  const bankerTeam = bankerEntry ? tById[bankerEntry[0]] : null;
  const bankerPct = bankerEntry && teamApps[bankerEntry[0]] && game.players.length
    ? Math.round((bankerEntry[1] / teamApps[bankerEntry[0]]) / game.players.length * 100)
    : 0;

  let biggestUpset = null;
  let minCorrect = Infinity;
  for (const m of finishedMatches) {
    const res = matchResult(m);
    if (!res || res === "D") continue;
    const mPicks = game.picks[m.id] || {};
    let correct = 0, total = 0;
    for (const pid in mPicks) {
      const pred = mPicks[pid]?.pred;
      if (pred) { total++; if (pred === res) correct++; }
    }
    if (correct < minCorrect) { minCorrect = correct; biggestUpset = { m, correct, total }; }
  }
  const upsetRes = biggestUpset ? matchResult(biggestUpset.m) : null;
  const upsetWinner = upsetRes ? tById[upsetRes === "A" ? biggestUpset.m.teamA : biggestUpset.m.teamB] : null;
  const upsetLoser = upsetRes ? tById[upsetRes === "A" ? biggestUpset.m.teamB : biggestUpset.m.teamA] : null;

  const contrarian = {};
  for (const m of finishedMatches) {
    const res = matchResult(m);
    if (!res) continue;
    const sp = pickSplit(game, m);
    const majority = sp.A >= sp.B && sp.A >= sp.D ? "A" : sp.B >= sp.A && sp.B >= sp.D ? "B" : "D";
    const mPicks = game.picks[m.id] || {};
    for (const pid in mPicks) {
      const pred = mPicks[pid]?.pred;
      if (pred && pred !== majority && pred === res) contrarian[pid] = (contrarian[pid] || 0) + 1;
    }
  }
  const topContrarian = Object.entries(contrarian).sort((a, b) => b[1] - a[1])[0];
  const contrarianPlayer = topContrarian ? game.players.find((p) => p.id === topContrarian[0]) : null;

  function wrongStreak(pid) {
    const fin = game.matches.filter((m) => m.status === "finished")
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    let s = 0;
    for (let i = fin.length - 1; i >= 0; i--) {
      const pk = game.picks[fin[i].id]?.[pid];
      if (!pk?.pred) continue;
      if (pk.pred !== matchResult(fin[i])) s++; else break;
    }
    return s;
  }
  const coldRanked = game.players.map((p) => ({ p, streak: wrongStreak(p.id) })).sort((a, b) => b.streak - a.streak);
  const iceCold = coldRanked[0];

  let rivalA = null, rivalB = null, minDiff = Infinity;
  for (let i = 0; i < standings.length - 1; i++) {
    const diff = standings[i].total - standings[i + 1].total;
    if (diff < minDiff) { minDiff = diff; rivalA = standings[i]; rivalB = standings[i + 1]; }
  }
  function playerAccuracy(pid) {
    if (!finishedMatches.length) return 0;
    let correct = 0;
    for (const m of finishedMatches) {
      if (game.picks[m.id]?.[pid]?.pred === matchResult(m)) correct++;
    }
    return Math.round(correct / finishedMatches.length * 100);
  }

  const takes = (game.hottakes || []).slice().reverse();
  const totReactions = (t) => Object.values(t.reactions || {}).reduce((s, r) => s + Object.keys(r).length, 0);
  const topTake = takes.reduce((best, t) => (!best || totReactions(t) > totReactions(best) ? t : best), null);

  const postTake = () => {
    if (!me || !takeText.trim()) return;
    SFX.pick();
    mutate((g) => {
      if (!g.hottakes) g.hottakes = [];
      g.hottakes.push({ id: uid(), by: me.id, name: me.name, text: takeText.trim(), at: Date.now(), reactions: {} });
      if (g.hottakes.length > 50) g.hottakes = g.hottakes.slice(-50);
    });
    setTakeText("");
  };

  const reactTake = (takeId, emoji) => {
    if (!me) return;
    SFX.click();
    mutate((g) => {
      const take = (g.hottakes || []).find((t) => t.id === takeId);
      if (!take) return;
      if (!take.reactions) take.reactions = {};
      if (!take.reactions[emoji]) take.reactions[emoji] = {};
      if (take.reactions[emoji][me.id]) delete take.reactions[emoji][me.id];
      else take.reactions[emoji][me.id] = true;
    });
  };

  const receipts = [];
  for (const m of finishedMatches) {
    const res = matchResult(m);
    if (!res) continue;
    const mPicks = game.picks[m.id] || {};
    for (const pid in mPicks) {
      const pred = mPicks[pid]?.pred;
      if (!pred || pred === "D" || pred === res) continue;
      const player = game.players.find((p) => p.id === pid);
      const pickedTeam = tById[pred === "A" ? m.teamA : m.teamB];
      const winTeam = tById[res === "A" ? m.teamA : m.teamB];
      if (player && pickedTeam && winTeam) receipts.push({ player, pickedTeam, winTeam, m });
    }
  }
  receipts.sort((a, b) => new Date(b.m.kickoff) - new Date(a.m.kickoff));

  const TAKE_REACTIONS = ["🔥", "😂", "💀", "👀", "🤡"];
  const renderStatCard = (icon, headline, value, desc) => (
    <div className="panel" style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 26, lineHeight: 1.2, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="barlow" style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>{headline}</div>
          <div className="bebas" style={{ fontSize: 22, color: "var(--gold-bright)", lineHeight: 1.15, wordBreak: "break-word" }}>{value}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{desc}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="hero" style={{ padding: "22px 16px" }}>
        <h1 style={{ fontSize: "clamp(30px,7vw,50px)" }}>STATS & BANTER</h1>
        <div className="sub">🎯 Numbers don't lie · takes do</div>
      </div>

      <div className="subtab" style={{ margin: "14px 0 16px" }}>
        {[["stats", "📊 Stats"], ["banter", "🔥 Banter"]].map(([k, l]) => (
          <button key={k} className={`btn ${sub === k ? "btn-gold" : "btn-ghost"}`}
            onClick={() => { setSub(k); SFX.click(); }}>{l}</button>
        ))}
      </div>

      {sub === "stats" && (
        <>
          {!finishedMatches.length && <div className="note">No finished matches yet — check back once games start.</div>}
          {mostBackedTeam && renderStatCard(
            mostBackedTeam.flag, "MOST BACKED TEAM",
            `${mostBackedTeam.name} · ${mostBackedCount} picks`,
            "The fan favourite across all matches so far"
          )}
          {biggestUpset && upsetWinner && renderStatCard(
            "💥", "BIGGEST UPSET NO ONE CALLED",
            `${upsetWinner.flag} ${upsetWinner.name} beat ${upsetLoser?.flag || ""} ${upsetLoser?.name || "?"}`,
            `Only ${biggestUpset.correct}/${biggestUpset.total} called it`
          )}
          {bankerTeam && renderStatCard(
            bankerTeam.flag, "THE BANKER",
            bankerTeam.name,
            `Picked ${bankerPct}% of the time per match — everyone's automatic`
          )}
          {contrarianPlayer && renderStatCard(
            contrarianPlayer.avatar, "MOST CONTRARIAN",
            `${contrarianPlayer.name} · ${topContrarian[1]}x`,
            "Went against the crowd and was right"
          )}
          {iceCold && iceCold.streak > 0 && renderStatCard(
            "🧊", "ICE COLD",
            `${iceCold.p.name} · ${iceCold.streak} wrong in a row`,
            "Longest current losing streak"
          )}
          {rivalA && rivalB && (
            <div className="panel" style={{ marginBottom: 10 }}>
              <div className="barlow" style={{ fontSize: 10, color: "var(--muted)", marginBottom: 10 }}>RIVALRY OF THE WEEK</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{rivalA.p.avatar}</span>
                <span className="bebas" style={{ fontSize: 16, flex: 1 }}>{rivalA.p.name}</span>
                <span className="bebas" style={{ fontSize: 28, color: "var(--gold-bright)" }}>{rivalA.total}</span>
                <span className="bebas" style={{ fontSize: 13, color: "var(--muted)", padding: "0 6px" }}>VS</span>
                <span className="bebas" style={{ fontSize: 28, color: "var(--gold-bright)" }}>{rivalB.total}</span>
                <span className="bebas" style={{ fontSize: 16, flex: 1, textAlign: "right" }}>{rivalB.p.name}</span>
                <span style={{ fontSize: 22 }}>{rivalB.p.avatar}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>{rivalA.p.name}</div>
                  <div style={{ height: 8, borderRadius: 4, background: "#0a1a10", overflow: "hidden" }}>
                    <div style={{ width: `${playerAccuracy(rivalA.p.id)}%`, height: "100%", background: "var(--gold-bright)", borderRadius: 4, transition: "width .5s ease" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gold-bright)", marginTop: 2 }}>{playerAccuracy(rivalA.p.id)}% accurate</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>{rivalB.p.name}</div>
                  <div style={{ height: 8, borderRadius: 4, background: "#0a1a10", overflow: "hidden" }}>
                    <div style={{ width: `${playerAccuracy(rivalB.p.id)}%`, height: "100%", background: "var(--sky)", borderRadius: 4, transition: "width .5s ease" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--sky)", marginTop: 2 }}>{playerAccuracy(rivalB.p.id)}% accurate</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
                Separated by {minDiff} pt{minDiff !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </>
      )}

      {sub === "banter" && (
        <>
          {me ? (
            <div className="panel" style={{ marginBottom: 14 }}>
              <div className="barlow" style={{ fontSize: 10, color: "var(--muted)", marginBottom: 8 }}>POST A TAKE</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={takeText} onChange={(e) => setTakeText(e.target.value.slice(0, 120))}
                  placeholder="Drop your hot take..." style={{ flex: 1 }}
                  onKeyDown={(e) => e.key === "Enter" && postTake()} />
                <button className="btn btn-gold" onClick={postTake} disabled={!takeText.trim()}>Post</button>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, textAlign: "right" }}>{takeText.length}/120</div>
            </div>
          ) : (
            <div className="note" style={{ marginBottom: 14 }}>Select your player above to post takes.</div>
          )}

          {topTake && totReactions(topTake) > 0 && (
            <div style={{ background: "linear-gradient(135deg,rgba(240,201,58,.15),rgba(240,201,58,.06))", border: "1px solid var(--gold)", borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
              <div className="barlow" style={{ fontSize: 10, color: "var(--gold-bright)", marginBottom: 6, letterSpacing: ".15em" }}>🔥 TAKE OF THE DAY</div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{game.players.find((p) => p.id === topTake.by)?.avatar || "👤"}</span>
                <div>
                  <span style={{ fontSize: 13, color: "var(--gold-bright)", fontWeight: 600 }}>{topTake.name}</span>
                  <div style={{ fontSize: 14, margin: "4px 0" }}>{topTake.text}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{totReactions(topTake)} reactions · {timeAgo(topTake.at)}</div>
                </div>
              </div>
            </div>
          )}

          {takes.length === 0 && (
            <div className="note">No takes yet — be the first to say something questionable. 🎤</div>
          )}

          {takes.map((take) => {
            const author = game.players.find((p) => p.id === take.by);
            return (
              <div key={take.id} className="panel" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 22, lineHeight: 1.2 }}>{author?.avatar || "👤"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gold-bright)" }}>{take.name}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{timeAgo(take.at)}</span>
                    </div>
                    <div style={{ fontSize: 14, margin: "6px 0 10px", lineHeight: 1.5 }}>{take.text}</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {TAKE_REACTIONS.map((emoji) => {
                        const count = Object.keys(take.reactions?.[emoji] || {}).length;
                        const myReact = me && take.reactions?.[emoji]?.[me.id];
                        return (
                          <button key={emoji}
                            style={{ background: myReact ? "rgba(240,201,58,.18)" : "#0d1f14", border: `1px solid ${myReact ? "var(--gold)" : "rgba(138,170,150,.2)"}`, borderRadius: 999, padding: "4px 10px", fontSize: 15, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                            onClick={() => reactTake(take.id, emoji)}>
                            {emoji}{count > 0 && <span style={{ fontSize: 11, color: "var(--gold-bright)", fontFamily: "'Bebas Neue'" }}>{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {receipts.length > 0 && (
            <>
              <div className="h-sec">Aged badly 💀</div>
              {receipts.slice(0, 20).map((r, i) => (
                <div key={i} style={{ background: "rgba(230,57,70,.08)", border: "1px solid rgba(230,57,70,.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <span style={{ fontSize: 18 }}>{r.player.avatar}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: "var(--gold-bright)", fontWeight: 600 }}>{r.player.name}</span>{" "}
                    backed {r.pickedTeam.flag} <span style={{ color: "#f1a0a7" }}>{r.pickedTeam.name}</span>
                    <span style={{ color: "var(--muted)" }}> · lost to {r.winTeam.flag} {r.winTeam.name}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

function WarRoom({ game, me, mutate, onRefresh }) {
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  useTick(true);
  const now = Date.now();
  const live = game.matches.filter((m) => m.live && m.status !== "void")
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  const REACTIONS = ["🔥", "😱", "😂", "💀", "⚽", "🙌", "😭", "🤬"];

  const react = (matchId, emoji) => {
    if (!me) return;
    SFX.click();
    mutate((g) => {
      if (!g.warroom) g.warroom = {};
      if (!g.warroom[matchId]) g.warroom[matchId] = [];
      g.warroom[matchId].push({ by: me.id, name: me.name, emoji, at: Date.now() });
      // keep last 40 per match
      if (g.warroom[matchId].length > 40) g.warroom[matchId] = g.warroom[matchId].slice(-40);
    });
  };

  return (
    <div className="page">
      <div className="hero" style={{ padding: "22px 16px" }}>
        <h1 style={{ fontSize: "clamp(32px,8vw,54px)" }}>WAR ROOM</h1>
        <div className="sub">⚔️ Live matches · react together</div>
      </div>
      {live.length === 0 ? (
        <div className="panel muted" style={{ marginTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🛋️</div>
          No live matches right now. The War Room fires up the moment a game kicks off — come back then to watch it unfold with the league.
        </div>
      ) : live.map((m) => {
        const a = tById[m.teamA], b = tById[m.teamB];
        const feed = (game.warroom?.[m.id] || []).slice(-12).reverse();
        const counts = {};
        for (const r of (game.warroom?.[m.id] || [])) counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        return (
          <div className="warcard" key={m.id}>
            <div className="war-live"><span className="dot" />LIVE · {STAGE_LABEL[m.stage]}</div>
            <div className="war-score" onClick={() => openMatchDetail(m)}>
              <div className="war-team"><Flag name={a?.name} size={40} /><span>{a?.name}</span></div>
              <div className="war-num bebas">{m.scoreA ?? 0}<span style={{ opacity: .5 }}> – </span>{m.scoreB ?? 0}</div>
              <div className="war-team"><Flag name={b?.name} size={40} /><span>{b?.name}</span></div>
            </div>
            {/* who picked what */}
            <div className="war-picks">
              {game.players.map((p) => {
                const pk = game.picks[m.id]?.[p.id];
                if (!pk?.pred) return null;
                const res = matchResult(m);
                const winning = pk.pred === res;
                const lab = pk.pred === "A" ? a?.name : pk.pred === "B" ? b?.name : "Draw";
                return <span key={p.id} className={`war-chip ${winning ? "win" : "lose"}`} onClick={() => openProfile(p.id)}>{p.avatar} {p.name}: {lab} {winning ? "▲" : "▼"}</span>;
              })}
            </div>
            {/* reaction buttons */}
            <div className="war-react">
              {REACTIONS.map((e) => (
                <button key={e} className="war-rbtn" disabled={!me} onClick={() => react(m.id, e)}>
                  {e}{counts[e] ? <span className="war-rcount">{counts[e]}</span> : null}
                </button>
              ))}
            </div>
            {/* live feed */}
            {feed.length > 0 && (
              <div className="war-feed">
                {feed.map((r, i) => (
                  <div key={i} className="war-fitem"><span className="war-femoji">{r.emoji}</span> <b className="pname" onClick={() => openProfile(r.by)}>{r.name}</b> <span className="muted" style={{ fontSize: 10 }}>{timeAgo(r.at)}</span></div>
                ))}
              </div>
            )}
            {!me && <div className="note" style={{ textAlign: "center" }}>Pick your name up top to join the reactions.</div>}
          </div>
        );
      })}
      <div style={{ textAlign: "center", marginTop: 12 }}>
        <button className="btn btn-ghost" onClick={() => onRefresh && onRefresh()}>Refresh scores</button>
      </div>
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
                <div className="team"><span className="fl"><Flag name={a?.name} size={22} /></span><span className="nm">{a?.name}</span></div>
                <div className="score" key={`sc${m.scoreA ?? 0}-${m.scoreB ?? 0}`}>{m.scoreA ?? 0} – {m.scoreB ?? 0}</div>
                <div className="team"><span className="fl"><Flag name={b?.name} size={22} /></span><span className="nm">{b?.name}</span></div>
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
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><Flag name={row.team?.name} size={16} /> {row.team?.name}</span>
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
                  <div className="team"><span className="fl"><Flag name={a?.name} size={22} /></span><span className="nm">{a?.name}</span></div>
                  {(m.status === "finished" || (isLive && m.scoreA != null)) ? <div className="score" key={`sc${m.scoreA}-${m.scoreB}`}>{m.scoreA} – {m.scoreB}</div> : <div className="vs">VS</div>}
                  <div className="team"><span className="fl"><Flag name={b?.name} size={22} /></span><span className="nm">{b?.name}</span></div>
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

/* ── knockout stage widgets (presentational only) ── */
const STAGE_SHORT = { GROUP: "Groups", R32: "Rd of 32", R16: "Rd of 16", QF: "Quarters", SF: "Semis", FINAL: "Final" };
const STAGE_DOT = { GROUP: "G", R32: "32", R16: "16", QF: "8", SF: "4", FINAL: "🏆" };
function currentStage(game) {
  let last = "GROUP";
  for (const s of STAGES) {
    const ms = game.matches.filter((m) => m.stage === s && m.status !== "void");
    if (!ms.length) continue;
    if (ms.some((m) => m.status !== "finished")) return s;
    last = s;
  }
  return last;
}

function StageTracker({ game }) {
  const idx = STAGES.indexOf(currentStage(game));
  return (
    <div className="stage-tracker">
      {STAGES.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && <span className={`st-link ${i <= idx ? "done" : ""}`} />}
          <div className={`st-node ${i < idx ? "done" : i === idx ? "now" : ""}`}>
            <span className="st-dot">{i < idx ? "✓" : STAGE_DOT[s]}</span>
            <span className="st-lab">{STAGE_SHORT[s]}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// Shown until the first R16 kickoff; falls back to the official R16 start
// date if those fixtures haven't synced yet.
const R16_FALLBACK_KICKOFF = "2026-07-04T15:00:00Z";
function R16Countdown({ game }) {
  useTick(true);
  const first = game.matches.filter((m) => m.stage === "R16" && m.status !== "void")
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))[0];
  const target = new Date(first ? first.kickoff : R16_FALLBACK_KICKOFF).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return null;
  const pad = (n) => String(n).padStart(2, "0");
  const units = [
    [Math.floor(diff / 86400000), "Days"],
    [pad(Math.floor(diff / 3600000) % 24), "Hrs"],
    [pad(Math.floor(diff / 60000) % 60), "Min"],
    [pad(Math.floor(diff / 1000) % 60), "Sec"],
  ];
  return (
    <div className="r16-timer shine">
      <div className="r16-timer-label">⏳ Round of 16 kicks off in</div>
      <div className="r16-boxes">
        {units.map(([v, l]) => (
          <div className="rt-box" key={l}><div className="rt-num">{v}</div><div className="rt-lab">{l}</div></div>
        ))}
      </div>
      <div className="r16-timer-sub">
        First kickoff · {new Date(target).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        {first ? "" : " (provisional — updates when fixtures sync)"}
      </div>
    </div>
  );
}

const NEXT_ROUND_SLOTS = { r16: 16, qf: 8, sf: 4, final: 2, won: 1 };
function QualifiedTable({ game }) {
  const cur = currentStage(game);
  const milestone = KO_WIN_MILESTONE[cur];
  if (!milestone) return null;
  const nextStage = STAGES[STAGES.indexOf(cur) + 1];
  const title = cur === "FINAL" ? "🏆 World Champions" : `✅ Through to the ${STAGE_LABEL[nextStage]}`;
  const slots = NEXT_ROUND_SLOTS[milestone];
  const through = game.teams
    .filter((t) => (UD_RANK[t.furthest] || 0) >= UD_RANK[milestone])
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="qual-panel">
      <div className="qual-head">
        <div className="qual-title">{title}</div>
        <div className="qual-count">{Math.min(through.length, slots)} / {slots} CONFIRMED</div>
      </div>
      <div className="qual-grid">
        {through.map((t, i) => (
          <div className="qual-chip" key={t.id} style={{ animationDelay: `${i * 40}ms` }}>
            <Flag name={t.name} size={16} />
            <span className="qc-name">{t.name}</span>
            {t.group && <span className="qc-grp">Grp {t.group}</span>}
          </div>
        ))}
        {Array.from({ length: Math.max(0, slots - through.length) }, (_, i) => (
          <div className="qual-chip tbd" key={`tbd${i}`}><span className="qc-name">TBD</span></div>
        ))}
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
  const leader = rows[0];
  const todayStr = new Date().toDateString();
  const todays = game.matches.filter((m) => m.status !== "void" && new Date(m.kickoff).toDateString() === todayStr);
  const nextLock = todays.filter((m) => m.status !== "finished").map((m) => new Date(m.kickoff).getTime()).filter((t) => t > now).sort((a, b) => a - b)[0];
  const liveNow = game.matches.filter((m) => m.live).length;
  const mover = biggestMover(game);
  const curStage = currentStage(game);
  let hookText;
  if (liveNow > 0) hookText = `🔴 ${liveNow} match${liveNow > 1 ? "es" : ""} LIVE right now — watch it unfold`;
  else if (todays.length > 0) {
    const left = nextLock ? Math.round((nextLock - now) / 3600000) : null;
    hookText = `⚽ ${todays.length} match${todays.length > 1 ? "es" : ""} today${left != null && left >= 0 ? ` · picks lock in ~${left || "<1"}h` : ""}`;
  } else hookText = "😴 No matches today — check the table and plot your next move";
  return (
    <div className="page">
      <div className="daily-hook" onClick={() => go(todays.length ? "today" : "board")}>
        <span className="dh-text">{hookText}</span>
        <span className="dh-arrow">›</span>
      </div>
      {mover && (
        <div className="mover-strip" onClick={() => openProfile(mover.id)}>
          {mover.delta > 0
            ? <><span className="mv-ico up">▲</span><b>{mover.name}</b> rocketed up {mover.delta} {mover.delta === 1 ? "place" : "places"} 🚀</>
            : <><span className="mv-ico down">▼</span><b>{mover.name}</b> slipped {Math.abs(mover.delta)} {Math.abs(mover.delta) === 1 ? "place" : "places"} 📉</>}
        </div>
      )}
      <div className="hero hero-grand">
        <div className="hero-glow" aria-hidden />
        <img src="/trophy-hero.jpg" className="hero-trophy-img" alt="" aria-hidden />
        <div className="hero-kicker barlow">⚽ The Road to Glory ⚽</div>
        <h1 className="hero-mega">WORLD CUP<span>2026</span></h1>
        <div className="sub">{game.config.groupName} · Private Prediction League</div>
        {curStage !== "GROUP" && (
          <div className="hero-stage-chip">⚔️ Knockouts · {STAGE_LABEL[curStage]}</div>
        )}
        <div className="hero-cards">
          <div className="hero-pot">
            <div className="barlow muted" style={{ fontSize: 11, letterSpacing: ".2em" }}>Total Pot</div>
            <div className="hero-pot-amt"><span className="coin"><span className="face">$</span><span className="face back">$</span></span>{game.config.currency}<CountUp value={pot} decimals={2} /></div>
            <div className="barlow muted" style={{ fontSize: 10 }}>{game.players.length} players in the hunt</div>
          </div>
          {leader && (
            <div className="hero-leader" onClick={() => openProfile(leader.p.id)}>
              <div className="hl-crown">👑 CURRENT LEADER</div>
              <div className="hl-body">
                {leader.p.mascot ? <Mascot id={leader.p.mascot} pose="celebrate" size={54} /> : <span style={{ fontSize: 40 }}>{leader.p.avatar}</span>}
                <div>
                  <div className="bebas" style={{ fontSize: 24, lineHeight: 1 }}>{leader.p.name}</div>
                  <div className="hero-pot-amt" style={{ fontSize: 26 }}><CountUp value={leader.total} /> PTS</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <StageTracker game={game} />
      <R16Countdown game={game} />

      {(() => {
        const motd = matchOfDay(game);
        if (!motd) return null;
        const a = tById[motd.teamA], b = tById[motd.teamB];
        const ko = new Date(motd.kickoff).getTime();
        const sp = pickSplit(game, motd);
        const isLive = motd.live;
        const fin = motd.status === "finished";
        return (
          <div className="motd" onClick={() => openMatchDetail(motd)}>
            <div className="motd-tag">{isLive ? "🔴 MATCH OF THE DAY · LIVE" : fin ? "⭐ MATCH OF THE DAY · FULL TIME" : "⭐ MATCH OF THE DAY"}</div>
            <div className="motd-teams">
              <div className="motd-team"><Flag name={a?.name} size={34} /><span>{a?.name}</span></div>
              <div className="motd-score">{(isLive || fin) ? <span className="bebas" style={{ fontSize: 30 }}>{motd.scoreA ?? 0}–{motd.scoreB ?? 0}</span> : <span className="bebas" style={{ fontSize: 22, color: "var(--gold-bright)" }}>{new Date(ko).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>}</div>
              <div className="motd-team"><Flag name={b?.name} size={34} /><span>{b?.name}</span></div>
            </div>
            {sp.total > 0 && <div className="motd-split barlow">League: {Math.round(sp.A / sp.total * 100)}% {a?.name?.slice(0, 3)} · {Math.round(sp.D / sp.total * 100)}% draw · {Math.round(sp.B / sp.total * 100)}% {b?.name?.slice(0, 3)}</div>}
            <div className="motd-cta">Tap for line-ups & match centre ›</div>
          </div>
        );
      })()}

      {(() => {
        if (isGroupStageDone(game)) {
          const gmMs = game.matches.filter(m => m.stage === "GROUP" && m.status === "finished");
          const pcByPlayer = {};
          for (const m of gmMs) {
            const res = matchResult(m);
            for (const pid in (game.picks[m.id] || {})) {
              if (!pcByPlayer[pid]) pcByPlayer[pid] = { correct: 0, total: 0 };
              pcByPlayer[pid].total++;
              if (game.picks[m.id][pid].pred === res) pcByPlayer[pid].correct++;
            }
          }
          const topP = game.players.map(p => ({ p, ...(pcByPlayer[p.id] || { correct: 0, total: 0 }) }))
            .sort((a, b) => b.correct - a.correct)[0];
          let upset = null, upsetMin = Infinity;
          for (const m of gmMs) {
            const res = matchResult(m);
            if (!res || res === "D") continue;
            const pks = Object.values(game.picks[m.id] || {});
            if (!pks.length) continue;
            const cnt = pks.filter(pk => pk.pred === res).length;
            if (cnt < upsetMin) { upsetMin = cnt; upset = { m, cnt, total: pks.length }; }
          }
          const consP = game.players.map(p => {
            const s = pcByPlayer[p.id] || { correct: 0, total: 0 };
            return { p, acc: s.total >= 5 ? s.correct / s.total : 0, ...s };
          }).sort((a, b) => b.acc - a.acc)[0];
          const upsetWinner = upset ? tById[matchResult(upset.m) === "A" ? upset.m.teamA : upset.m.teamB] : null;
          return (
            <div className="gs-done-banner">
              <div className="bebas gold" style={{ fontSize: 28, letterSpacing: ".06em" }}>Group Stage Complete!</div>
              <div className="barlow muted" style={{ fontSize: 11, letterSpacing: ".2em", marginTop: 4 }}>The knockout round begins — who survives?</div>
              <div className="gs-stat-grid">
                {topP && <div className="gs-stat"><div className="sv">{topP.p.avatar} {topP.p.name}</div><div className="sl">Top predictor · {topP.correct} correct</div></div>}
                {upset && upsetWinner && <div className="gs-stat"><div className="sv"><Flag name={upsetWinner.name} size={16} /> {upsetWinner.name}</div><div className="sl">Biggest upset · {upsetMin}/{upset.total} predicted</div></div>}
                {consP && consP.acc > 0 && <div className="gs-stat"><div className="sv">{consP.p.avatar} {consP.p.name}</div><div className="sl">Most consistent · {Math.round(consP.acc * 100)}%</div></div>}
              </div>
            </div>
          );
        }
        if (isGroupStageEnding(game)) {
          const tables = computeGroupTables(game);
          return (
            <div className="rtk-panel">
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: ".06em", marginBottom: 12, color: "var(--gold-bright)" }}>🏁 Road to the Knockouts</div>
              <div className="grid2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
                {tables.map(({ group, rows: grpRows }) => {
                  const stillLive = grpRows.some(r => r.P < 3);
                  return (
                    <div key={group} className="rtk-group">
                      <div className="rtk-group-hd">
                        Group {group}
                        {stillLive && <span className="rtk-live-badge">🔥 Still live</span>}
                      </div>
                      {grpRows.map((r, i) => {
                        const cls = i < 2 ? "qualified" : i === 2 ? "inrace" : "elim";
                        const posClass = i < 2 ? "q" : i === 2 ? "a" : "";
                        return (
                          <div key={r.team?.id || i} className={`rtk-row ${cls}`}>
                            <span className={`rtk-pos ${posClass}`}>{i + 1}</span>
                            <Flag name={r.team?.name} size={13} />
                            <span>{r.team?.name}</span>
                            <span className="rtk-pts">{r.Pts}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return null;
      })()}

      <QualifiedTable game={game} />

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
                  <div className="team"><span className="fl"><Flag name={a?.name} size={22} /></span><span className="nm">{a?.name}</span></div>
                  {isLive && m.scoreA != null && m.scoreB != null
                    ? <div className="score" key={`sc${m.scoreA}-${m.scoreB}`}>{m.scoreA} – {m.scoreB}</div>
                    : <div className="vs">VS</div>}
                  <div className="team"><span className="fl"><Flag name={b?.name} size={22} /></span><span className="nm">{b?.name}</span></div>
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
                <div className="team"><span className="fl"><Flag name={a?.name} size={22} /></span><span className="nm">{a?.name}</span></div>
                <div className="score" key={`sc${m.scoreA}-${m.scoreB}`}>{m.scoreA} – {m.scoreB}</div>
                <div className="team"><span className="fl"><Flag name={b?.name} size={22} /></span><span className="nm">{b?.name}</span></div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function PicksPage({ game, me, mutate, fxStatus, onRefresh, onPickCelebrate, isAdmin }) {
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  useTick(true);
  const now = Date.now();
  // admin can grant a specific player an exception for a specific match
  const hasOverride = (mId, pId) => !!(game.overrides?.[mId]?.[pId]);
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

  const picksDragStart = useRef(null);
  const onPicksPointerDown = (e) => {
    picksDragStart.current = e.clientX;
  };
  const onPicksPointerUp = (e) => {
    if (picksDragStart.current === null) return;
    const delta = e.clientX - picksDragStart.current;
    picksDragStart.current = null;
    if (Math.abs(delta) < 40) return;
    const days = [...new Set(
      game.matches
        .filter((m) => m.status !== "void")
        .map((m) => new Date(m.kickoff).toDateString())
    )].sort((a, b) => new Date(a) - new Date(b));
    const currentIndex = days.indexOf(selDate);
    if (currentIndex === -1) return;
    if (delta < 0 && currentIndex < days.length - 1) {
      setSelDate(days[currentIndex + 1]);
    } else if (delta > 0 && currentIndex > 0) {
      setSelDate(days[currentIndex - 1]);
    }
  };

  // exact-scoreline inputs accept a single digit 0–9 ('' clears)
  const slDigit = (v) => { const d = String(v).replace(/\D/g, "").slice(-1); return d === "" ? "" : Number(d); };
  const setPick = (m, patch) => {
    const overridden = me && hasOverride(m.id, me.id);
    if (patch.pred && onPickCelebrate) {
      const t = patch.pred === "A" ? tById[m.teamA] : patch.pred === "B" ? tById[m.teamB] : null;
      onPickCelebrate(t);
    }
    return mutate((g) => {
    // hard guard: no pick changes after lock (kickoff) — UNLESS the admin
    // granted this player an explicit override for this match. The override
    // never changes the global deadline; it's a per-player, per-match exception.
    const allowed = !!(g.overrides?.[m.id]?.[me.id]);
    if (!allowed && Date.now() >= new Date(m.kickoff).getTime()) return;
    if (!g.picks[m.id]) g.picks[m.id] = {};
    const cur = g.picks[m.id][me.id] || { pred: null, sa: "", sb: "", at: Date.now() };
    g.picks[m.id][me.id] = { ...cur, ...patch, at: Date.now() };
  });
  };

  return (
    <div className="page picks-page" onPointerDown={onPicksPointerDown} onPointerUp={onPicksPointerUp}>
      <div className="h-sec">Daily picks</div>
      <DateStrip game={game} selected={selDate} onSelect={setSelDate} />
      {!me && <div className="banner">Select your player in the top bar to make picks.</div>}
      {matches.length === 0 && <div className="panel muted">No matches on this day — swipe the dates above.</div>}
      {matches.map((m) => {
        const a = tById[m.teamA], b = tById[m.teamB];
        const lockAt = new Date(m.kickoff).getTime(); // locks at kickoff
        const myOverride = me ? hasOverride(m.id, me.id) : false;
        const baseLocked = now >= lockAt || m.status === "finished" || m.status === "void";
        const locked = baseLocked && !myOverride; // admin-granted exception unlocks for this player only
        const myPick = me ? game.picks[m.id]?.[me.id] : null;
        const res = matchResult(m);
        const isKo = m.stage !== "GROUP"; // knockouts: no draw option, ever
        const isKoDecider = m.stage === "SF" || m.stage === "FINAL"; // merged through-call row
        const ko = new Date(m.kickoff).getTime();
        const isLive = m.status !== "finished" && m.status !== "void" && (m.live || (now >= ko && now < ko + 2.2 * 3600000));
        const teamColourA = (COUNTRY_COLORS[a?.name] || ["#16c264"])[0];
        const teamColourB = (COUNTRY_COLORS[b?.name] || ["#e63946"])[0];
        const showScore = locked || m.status === "finished";
        return (
          <div className="match-card-pitch" key={m.id}>
            <div className="pitch-meta barlow">
              <span>{stageTag(m, tById)}</span>
              {m.status === "void" ? <span style={{ color: "var(--danger)" }}>VOID — picks refunded</span>
                : isLive ? <span className="live"><span className="dot" />LIVE</span>
                : m.status === "finished" ? <span>FULL TIME</span> : <span>{fmtTime(m.kickoff)}</span>}
            </div>
            <div className="pitch-bg">
              <div className="pitch-zone pitch-zone-a" style={{ "--team-colour": teamColourA }} />
              <div className="pitch-centre-line" />
              <div className="pitch-centre-circle" />
              <div className="pitch-zone pitch-zone-b" style={{ "--team-colour": teamColourB }} />
            </div>
            <div className="pitch-content">
              <div className="pitch-team pitch-team-a">
                <Flag name={a?.name} size={38} />
                <span className="pitch-team-name">{a?.name}</span>
                {!isKoDecider && (
                  <button
                    className={`pickbtn ${myPick?.pred === "A" ? "sel" : ""}`}
                    disabled={locked || !me}
                    onClick={() => setPick(m, { pred: "A" })}
                  >
                    {myPick?.pred === "A" ? "✓ BACKED" : "BACK"}
                  </button>
                )}
              </div>
              <div className="pitch-centre">
                {showScore
                  ? <div className="pitch-score bebas">{m.scoreA ?? "–"} : {m.scoreB ?? "–"}</div>
                  : <div className="pitch-time barlow">{fmtTime(m.kickoff)}</div>}
                {!isKo && (
                  <button
                    className={`pickbtn ${myPick?.pred === "D" ? "sel" : ""}`}
                    disabled={locked || !me}
                    onClick={() => setPick(m, { pred: "D" })}
                  >
                    DRAW
                  </button>
                )}
                {locked && <div className="pitch-lock barlow">🔒 LOCKED</div>}
              </div>
              <div className="pitch-team pitch-team-b">
                <Flag name={b?.name} size={38} />
                <span className="pitch-team-name">{b?.name}</span>
                {!isKoDecider && (
                  <button
                    className={`pickbtn ${myPick?.pred === "B" ? "sel" : ""}`}
                    disabled={locked || !me}
                    onClick={() => setPick(m, { pred: "B" })}
                  >
                    {myPick?.pred === "B" ? "✓ BACKED" : "BACK"}
                  </button>
                )}
              </div>
            </div>
            <div className="pitch-extra">
            {isKoDecider && m.status !== "void" && (() => {
              const myCall = koCallOf(myPick);
              const callPts = (STAGE_PTS[m.stage] || 0) + 8;
              const hasSl = myPick && myPick.sa !== "" && myPick.sa != null && myPick.sb !== "" && myPick.sb != null;
              const ex = pickExtraPoints(m, myPick);
              return (
                <div style={{ marginTop: 10 }}>
                  <div className="ps-label barlow muted">WHO GOES THROUGH · {callPts} PTS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button className={`pickbtn ${myCall === "A" ? "sel" : ""}`} disabled={locked || !me}
                      onClick={() => setPick(m, { pred: "A", qual: "A" })}>{myCall === "A" ? "✓ " : ""}{a?.name} through</button>
                    <button className={`pickbtn ${myCall === "B" ? "sel" : ""}`} disabled={locked || !me}
                      onClick={() => setPick(m, { pred: "B", qual: "B" })}>{myCall === "B" ? "✓ " : ""}{b?.name} through</button>
                  </div>
                  {m.status === "finished" && myCall && !res && (
                    <div className="lockline" style={{ marginTop: 6, color: "var(--muted)" }}>LEVEL AFTER 90 — POINTS PENDING QUALIFIER</div>
                  )}
                  {m.status === "finished" && myCall && res && myCall !== res && (
                    <div className="lockline" style={{ marginTop: 6, color: "#f1a0a7" }}>✗ THROUGH-CALL MISSED · +0</div>
                  )}
                  <div className="ps-label barlow muted" style={{ marginTop: 10 }}>EXACT 90-MIN SCORE · 20 PTS</div>
                  <div className="scoreline" style={{ marginTop: 4 }}>
                    <input inputMode="numeric" disabled={locked || !me} value={myPick?.sa ?? ""}
                      aria-label={`${a?.name} exact score`} onChange={(e) => setPick(m, { sa: slDigit(e.target.value) })} />
                    <span className="vs">:</span>
                    <input inputMode="numeric" disabled={locked || !me} value={myPick?.sb ?? ""}
                      aria-label={`${b?.name} exact score`} onChange={(e) => setPick(m, { sb: slDigit(e.target.value) })} />
                    {m.status === "finished" && hasSl && res && (
                      <span className="bebas" style={{ fontSize: 17, color: ex.slPts > 0 ? "#bdf3d2" : "#f1a0a7" }}>
                        {ex.slPts > 0 ? "✓ +20" : "✗ +0"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
            {myOverride && baseLocked && <div className="lockline" style={{ color: "var(--gold-bright)" }}>🔓 Admin unlocked this for you — pick now</div>}
            {!locked && m.status !== "void" && !myOverride && <div className="lockline"><Countdown to={new Date(lockAt).toISOString()} /></div>}
            {m.status === "finished" && myPick && (() => {
              const ex = pickExtraPoints(m, myPick);
              const tot = pickPoints(m, myPick) + ex.qualPts + ex.slPts;
              return tot > 0 ? <div className="pitch-calledit">✓ CALLED IT · +{tot} PTS</div> : null;
            })()}
            {locked && m.status !== "void" && (() => {
              const sp = pickSplit(game, m);
              if (sp.total === 0) return null;
              const pct = (n) => Math.round((n / sp.total) * 100);
              return (
                <div className="picksplit">
                  <div className="ps-label barlow muted">How the league called it</div>
                  <div className="ps-bar">
                    {sp.A > 0 && <span className="ps-seg ps-a" style={{ width: `${pct(sp.A)}%` }} title={`${a?.name} ${pct(sp.A)}%`}>{pct(sp.A)}%</span>}
                    {sp.D > 0 && <span className="ps-seg ps-d" style={{ width: `${pct(sp.D)}%` }} title={`Draw ${pct(sp.D)}%`}>{pct(sp.D)}%</span>}
                    {sp.B > 0 && <span className="ps-seg ps-b" style={{ width: `${pct(sp.B)}%` }} title={`${b?.name} ${pct(sp.B)}%`}>{pct(sp.B)}%</span>}
                  </div>
                  <div className="ps-key barlow"><span>{a?.name}</span><span>{isKo ? "" : "Draw"}</span><span>{b?.name}</span></div>
                </div>
              );
            })()}
            {locked && m.status !== "void" && (
              <div className="others">
                {game.players.map((p) => {
                  const pk = game.picks[m.id]?.[p.id];
                  const call = isKoDecider ? koCallOf(pk) : pk?.pred;
                  const lab = call ? (call === "A" ? a?.name : call === "B" ? b?.name : "Draw") : "—";
                  const ex = pickExtraPoints(m, pk);
                  const pts = pickPoints(m, pk) + ex.qualPts + ex.slPts;
                  const cls = m.status === "finished" && call && res ? (call === res ? "chip ok" : "chip bad") : "chip";
                  return <span key={p.id} className={cls} style={{ cursor: "pointer" }} onClick={() => openProfile(p.id)}>{p.avatar} {p.name}: {lab}
                    {m.status === "finished" ? ` · +${pts}` : ""}</span>;
                })}
              </div>
            )}
            </div>
          </div>
        );
      })}
      <div className="note">All kickoff times are shown in your own timezone, automatically. Knockout picks = who goes through (pens count). No draws. Group games stay win/draw/lose. Points: Group 3 · R32 5 · R16 8 · QF 10 · SF 21 · Final 26 for the through-call, +20 for the exact 90-min score on SF/Final. Picks lock at kickoff. Miss the window and it's 0 — no catch-up.</div>
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
  const isAdminUnlocked = !!(me && game.underdogOverrides?.[me.id]);

  const claim = (t) => {
    if (!me || (myUd && !isAdminUnlocked) || (takenBy[t.id] && takenBy[t.id] !== me.id)) return;
    mutate((g) => {
      if (g.underdog[me.id] && !g.underdogOverrides?.[me.id]) return;
      const takenPid = Object.entries(g.underdog).find(([, u]) => u.teamId === t.id)?.[0];
      if (takenPid && takenPid !== me.id) return;
      g.underdog[me.id] = { teamId: t.id, at: Date.now() };
    });
  };

  return (
    <div className="page">
      <div className="h-sec">Underdog hub</div>
      {isAdminUnlocked && (
        <div className="banner" style={{ borderColor: "var(--gold-bright)", color: "var(--gold-bright)", marginBottom: 10 }}>
          🔓 Admin has unlocked your underdog pick — you can change it now
        </div>
      )}
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
          const takenByOther = owner && owner.id !== me?.id;
          return (
            <div key={t.id} className={`ud-card ${takenByOther ? "taken" : ""}`}>
              <div className="fl"><Flag name={t.name} size={26} /></div>
              <div className="nm">{t.name}</div>
              {t.group && <div className="barlow muted" style={{ fontSize: 10 }}>Group {t.group}</div>}
              {takenByOther ? (
                <div className="barlow muted" style={{ fontSize: 11, marginTop: 4 }}>🔒 {owner.avatar} {owner.name}</div>
              ) : (
                <button className="btn btn-ghost" style={{ marginTop: 6, padding: "5px 10px", fontSize: 12 }}
                  disabled={!me || (!!myUd && !isAdminUnlocked)} onClick={() => claim(t)}>
                  {owner?.id === me?.id ? "Your pick" : "Claim"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-sec">Group-stage underdog table</div>
      <div className="note" style={{ marginTop: 0, marginBottom: 10 }}>Group-stage underdog bragging rights. Ties go to the earlier pick.</div>
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

// New Final 4 picks close once any SF/Final result is in — after that a pick
// would be made with hindsight (a known finalist guarantees consolation points).
const final4Closed = (g) => g.matches.some((m) => (m.stage === "SF" || m.stage === "FINAL") && m.status === "finished");

function Final4Page({ game, me, mutate, onPickCelebrate }) {
  const [confirming, setConfirming] = useState(null);
  const myPick = me ? game.final4?.[me.id] : null;
  const fo = finalOutcome(game);
  const rows = computeStandings(game);
  const closed = final4Closed(game);

  const lock = (team) => {
    if (!me || myPick || closed) return;
    mutate((g) => {
      if (final4Closed(g)) return;
      if (!g.final4) g.final4 = {};
      if (g.final4[me.id]) return;
      g.final4[me.id] = { team, at: Date.now() };
    });
    if (onPickCelebrate) onPickCelebrate({ name: team, flag: flagFor(team) });
    setConfirming(null);
  };

  return (
    <div className="page">
      <div className="hero" style={{ padding: "26px 16px" }}>
        <h1 style={{ fontSize: "clamp(30px,7.5vw,54px)" }}>FINAL 4 — CALL THE CHAMPION</h1>
        <div className="sub">One pick. Locked forever. Full points if they lift it, half if they fall at the final.</div>
      </div>

      {fo?.champName && (
        <div className="banner" style={{ marginTop: 14 }}>🏆 {fo.champName} ARE WORLD CHAMPIONS</div>
      )}
      {!me && <div className="banner" style={{ marginTop: 14 }}>Select your player in the top bar first.</div>}
      {closed && !myPick && (
        <div className="banner" style={{ marginTop: 14, borderColor: "var(--danger)", color: "#f1a0a7" }}>
          🔒 Picks are closed — semi-final results are already in, so a pick now would be cheating.
        </div>
      )}

      {myPick && (
        <Sticker style={{ marginTop: 14 }}>
          <div className="jersey"><span className="stamp" style={{ borderColor: "var(--gold)", color: "var(--gold-bright)" }}>🔒 LOCKED</span></div>
          <div style={{ fontSize: 34 }}><Flag name={myPick.team} size={30} /></div>
          <div className="bebas" style={{ fontSize: 26 }}>{myPick.team}</div>
          <div className="barlow muted" style={{ fontSize: 12 }}>
            WINS = {FINAL4_VALUE[myPick.team]} PTS · FINALIST = {FINAL4_CONSOLATION[myPick.team]} PTS
          </div>
        </Sticker>
      )}

      <div className="h-sec">The contenders</div>
      <div className="ud-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}>
        {FINAL4_TEAMS.map((team) => {
          const mine = myPick?.team === team;
          return (
            <div key={team} className={`ud-card ${myPick && !mine ? "taken" : ""}`}
              style={mine ? { borderColor: "var(--gold)", boxShadow: "0 0 14px rgba(240,201,58,.35)" } : undefined}>
              <div className="fl"><Flag name={team} size={30} /></div>
              <div className="nm">{team}</div>
              <div className="barlow gold" style={{ fontSize: 12, marginTop: 4 }}>WINS = {FINAL4_VALUE[team]} PTS</div>
              <div className="barlow muted" style={{ fontSize: 11 }}>FINALIST = {FINAL4_CONSOLATION[team]} PTS</div>
              {mine && <div className="barlow" style={{ color: "var(--gold-bright)", fontSize: 12, marginTop: 6 }}>🔒 YOUR CALL</div>}
              {!myPick && !closed && confirming !== team && (
                <button className="btn btn-gold" style={{ marginTop: 8, padding: "5px 10px", fontSize: 12 }}
                  disabled={!me} onClick={() => setConfirming(team)}>Back them</button>
              )}
              {!myPick && !closed && confirming === team && (
                <div style={{ marginTop: 8 }}>
                  <div className="barlow" style={{ fontSize: 11, color: "var(--gold-bright)", marginBottom: 6 }}>
                    Lock in {team}? This cannot be changed.
                  </div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    <button className="btn btn-gold" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => lock(team)}>Lock it</button>
                    <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => setConfirming(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-sec">Everyone's calls</div>
      {game.players.map((p) => {
        const f4 = game.final4?.[p.id];
        const r = rows.find((x) => x.p.id === p.id);
        return (
          <div key={p.id} className="lb-row" style={{ gridTemplateColumns: "1fr auto", cursor: "default" }}>
            <span><span className="pname" onClick={() => openProfile(p.id)}>{p.avatar} {p.name}</span></span>
            <span className="bebas gold" style={{ fontSize: 17, display: "inline-flex", alignItems: "center", gap: 6 }}>
              {f4 ? <><Flag name={f4.team} size={15} /> {f4.team}{fo ? ` · +${r?.f4Pts ?? 0} pts` : ""}</> : "—"}
            </span>
          </div>
        );
      })}
      <div className="note">Overlap is fine — everyone can back the same nation. Champions: France 5 · Argentina 10 · Spain 15 · England 20. Beaten finalist: half points (3 · 5 · 8 · 10). Fat-fingered it? Only the admin can clear a locked pick.</div>
    </div>
  );
}

function GbSquadSection({ apiKey, team, canPick, onPick }) {
  const [open, setOpen] = useState(false);
  const [squad, setSquad] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [confirming, setConfirming] = useState(null);
  const load = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (squad || !team?.apiTeamId) return;
    setLoading(true); setErr("");
    try {
      const r = await fetch(`/api/fixtures?key=${encodeURIComponent(apiKey)}&type=squad&teamId=${encodeURIComponent(team.apiTeamId)}`);
      const pl = await r.json().catch(() => ({}));
      if (pl.error) setErr(pl.error); else setSquad(pl.team?.squad || []);
    } catch (e) { setErr("Couldn't load squad."); }
    setLoading(false);
  };
  if (!team?.apiTeamId) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <button className="btn btn-ghost" style={{ width: "100%", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={load}>
        {open ? "▲" : "▼"} <Flag name={team.name} size={16} /> {team.name}
      </button>
      {open && (
        <div className="panel" style={{ marginTop: 6, padding: 10 }}>
          {loading && <div className="lockline">Loading squad…</div>}
          {err && <div className="note" style={{ color: "var(--danger)" }}>{err}</div>}
          {squad && squad.length === 0 && <div className="note">No squad data for this team yet.</div>}
          {squad && squad.map((pl) => (
            <React.Fragment key={pl.id}>
              <div className="xi-p" style={{ cursor: canPick ? "pointer" : "default", padding: "6px 4px" }}
                onClick={() => canPick && setConfirming(confirming === pl.id ? null : pl.id)}>
                <span style={{ flex: 1 }}>{pl.name}</span>
                {pl.position && <span className="xi-pos">{pl.position}</span>}
                <span className="chip" style={{ borderColor: "rgba(240,201,58,.4)", color: "var(--gold-bright)", flex: "0 0 auto" }}>{gbValue(pl.name)} pts</span>
              </div>
              {canPick && confirming === pl.id && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px 8px", flexWrap: "wrap" }}>
                  <span className="barlow" style={{ fontSize: 11, color: "var(--gold-bright)" }}>Lock in {pl.name}? This cannot be changed.</span>
                  <button className="btn btn-gold" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => onPick(team, pl)}>Lock it</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setConfirming(null)}>Cancel</button>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// New Golden Boot picks close once the winner is named or the final is done —
// after that the pick would just copy a known answer.
const goldenBootClosed = (g) => !!g.goldenBootWinner || g.matches.some((m) => m.stage === "FINAL" && m.status === "finished");

function GoldenBootPage({ game, me, mutate }) {
  const myPick = me ? game.goldenBoot?.[me.id] : null;
  const winner = game.goldenBootWinner;
  const closed = goldenBootClosed(game);
  const rows = computeStandings(game);
  const aliveIds = new Set();
  for (const m of game.matches) {
    if (m.status === "finished" || m.status === "void") continue;
    if (m.teamA) aliveIds.add(m.teamA);
    if (m.teamB) aliveIds.add(m.teamB);
  }
  const aliveTeams = game.teams.filter((t) => aliveIds.has(t.id)).sort((a, b) => a.name.localeCompare(b.name));

  const pickPlayer = (team, pl) => {
    if (!me || myPick || closed) return;
    SFX.pick();
    mutate((g) => {
      if (goldenBootClosed(g)) return;
      if (!g.goldenBoot) g.goldenBoot = {};
      if (g.goldenBoot[me.id]) return;
      g.goldenBoot[me.id] = { player: pl.name, team: team.name, at: Date.now() };
    });
  };

  return (
    <div className="page">
      <div className="hero" style={{ padding: "26px 16px" }}>
        <h1 style={{ fontSize: "clamp(28px,7vw,52px)" }}>GOLDEN BOOT — WHO FINISHES TOP SCORER?</h1>
        <div className="sub">One pick. Locked. Favourites pay less, punts pay 20.</div>
      </div>

      {winner && (
        <div className="banner" style={{ marginTop: 14, borderColor: "var(--gold-bright)" }}>
          👟 GOLDEN BOOT WINNER: {winner}
        </div>
      )}
      {!me && <div className="banner" style={{ marginTop: 14 }}>Select your player in the top bar first.</div>}

      {myPick && (
        <Sticker style={{ marginTop: 14 }}>
          <div className="jersey"><span className="stamp" style={{ borderColor: "var(--gold)", color: "var(--gold-bright)" }}>🔒 LOCKED</span></div>
          <div style={{ fontSize: 30 }}>👟 <Flag name={myPick.team} size={24} /></div>
          <div className="bebas" style={{ fontSize: 26 }}>{myPick.player}</div>
          <div className="barlow muted" style={{ fontSize: 12 }}>{myPick.team} · WORTH {gbValue(myPick.player)} PTS</div>
        </Sticker>
      )}

      {!myPick && closed && (
        <div className="banner" style={{ marginTop: 14, borderColor: "var(--danger)", color: "#f1a0a7" }}>
          🔒 Picks are closed — the winner is already decided.
        </div>
      )}
      {!myPick && !closed && (
        <>
          <div className="h-sec">Pick your striker</div>
          <div className="note" style={{ marginTop: 0, marginBottom: 10 }}>Mbappé or Messi pay 8 · Bellingham or Kane pay 12 · anyone else pays 20. Tap a team to browse its squad.</div>
          {!game.config.apiKey && <div className="panel muted">Squads need the football-data.org API key (set in Admin).</div>}
          {aliveTeams.length === 0 && <div className="panel muted">No teams still alive — the tournament is done.</div>}
          {aliveTeams.map((t) => (
            <GbSquadSection key={t.id} apiKey={game.config.apiKey} team={t} canPick={!!me && !myPick} onPick={pickPlayer} />
          ))}
        </>
      )}

      <div className="h-sec">Everyone's picks</div>
      {game.players.map((p) => {
        const gb = game.goldenBoot?.[p.id];
        const r = rows.find((x) => x.p.id === p.id);
        return (
          <div key={p.id} className="lb-row" style={{ gridTemplateColumns: "1fr auto", cursor: "default" }}>
            <span><span className="pname" onClick={() => openProfile(p.id)}>{p.avatar} {p.name}</span>
              {gb && <span className="muted" style={{ fontSize: 12 }}> · {gb.team}</span>}</span>
            <span className="bebas gold" style={{ fontSize: 17 }}>
              {gb ? (winner ? `${gb.player} · +${r?.gbPts ?? 0} pts` : `${gb.player} · ${gbValue(gb.player)} pts`) : "—"}
            </span>
          </div>
        );
      })}
      <div className="note">Overlap is fine. The admin names the official winner once the tournament ends — that's when points land.</div>
    </div>
  );
}

function LeaderboardPage({ game, meId }) {
  const [tab, setTab] = useState("overall");
  const [openRow, setOpenRow] = useState(null);
  const [panelView, setPanelView] = useState("groups");
  const leaders = prizeLeaders(game);
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const groupDone = isGroupStageDone(game);
  let rows = computeStandings(game);
  const sorters = {
    overall: (a, b) => b.total - a.total,
    group: (a, b) => b.groupDaily - a.groupDaily,
    knockout: (a, b) => b.knockout - a.knockout,
    underdog: (a, b) => b.udPts - a.udPts,
  };
  rows = rows.slice().sort(sorters[tab]);
  const contention = (r) => PRIZES.filter(([k]) => leaders[k] && leaders[k].p.id === r.p.id).map(([, ic]) => ic).join(" ");
  const badgesFor = (r, idx) => {
    const b = [];
    if (idx === 0 && tab === "overall") b.push("👑");
    const sk = streakFor(game, r.p.id);
    if (sk >= 3) b.push("🔥");
    const played = game.matches.filter((m) => m.status === "finished" && game.picks[m.id]?.[r.p.id]?.pred).length;
    const correct = game.matches.filter((m) => m.status === "finished" && pickPoints(m, game.picks[m.id]?.[r.p.id]) > 0).length;
    const acc = played ? correct / played : 0;
    if (played >= 4 && acc >= 0.7) b.push("🎯");
    if (played >= 4 && acc < 0.35) b.push("🃏");
    if (r.udPts >= 10) b.push("🐉");
    return b;
  };
  const leaderRow = rows[0];
  return (
    <div className="page lb-wrap">
      <div className="lb-watermark"><Trophy size={340} /></div>
      {groupDone && (
        <div style={{ marginBottom: 8 }}>
          <div className="tbl-toggle">
            <button className={panelView === "groups" ? "on" : ""} onClick={() => setPanelView("groups")}>Group Tables</button>
            <button className={panelView === "bracket" ? "on" : ""} onClick={() => setPanelView("bracket")}>Bracket</button>
          </div>
          {panelView === "groups" && (() => {
            const tables = computeGroupTables(game);
            if (!tables.length) return <div className="panel muted">No group table data yet.</div>;
            return (
              <div className="grid2" style={{ marginBottom: 12 }}>
                {tables.map((g) => (
                  <div className="panel" style={{ padding: "8px 4px" }} key={g.group}>
                    <div className="gt-title">Group {g.group}</div>
                    <div className="gt-head"><span>#</span><span>Team</span><span className="num">P</span><span className="num">W</span><span className="num">D</span><span className="num">L</span><span className="num">GD</span><span className="num">Pts</span></div>
                    {g.rows.map((row, i) => {
                      const gd = row.GF - row.GA;
                      return (
                        <div className={`gt-row ${i < 2 ? "q" : ""}`} key={row.team?.id || i}>
                          <span className="pos">{i + 1}</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><Flag name={row.team?.name} size={14} /> {row.team?.name}</span>
                          <span className="num">{row.P}</span><span className="num">{row.W}</span><span className="num">{row.D}</span><span className="num">{row.L}</span>
                          <span className="num">{gd > 0 ? `+${gd}` : gd}</span>
                          <span className="pts">{row.Pts}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })()}
          {panelView === "bracket" && (() => {
            const koMs = game.matches
              .filter(m => (m.stage === "R32" || m.stage === "R16") && m.status !== "void")
              .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
            if (!koMs.length) return <div className="panel muted">Knockout fixtures not loaded yet.</div>;
            const byStage = {};
            for (const m of koMs) { if (!byStage[m.stage]) byStage[m.stage] = []; byStage[m.stage].push(m); }
            return (
              <div style={{ marginBottom: 12 }}>
                {["R32", "R16"].filter(s => byStage[s]).map(s => (
                  <div key={s}>
                    <div className="gt-title" style={{ padding: "6px 0 6px" }}>{STAGE_LABEL[s]}</div>
                    {byStage[s].map(m => {
                      const a = tById[m.teamA], b = tById[m.teamB];
                      const fin = m.status === "finished";
                      return (
                        <div key={m.id} className="ko-match">
                          <div className="ko-team"><Flag name={a?.name} size={14} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a?.name || "TBD"}</span></div>
                          {fin ? <span className="ko-vs bebas" style={{ fontSize: 16, color: "var(--gold-bright)" }}>{m.scoreA}–{m.scoreB}</span> : <span className="ko-vs">vs</span>}
                          <div className="ko-team" style={{ justifyContent: "flex-end" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b?.name || "TBD"}</span><Flag name={b?.name} size={14} /></div>
                          <div className="ko-time">{new Date(m.kickoff).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
      {tab === "overall" && leaderRow && (
        <div className="podium-hero">
          <div className="leader-aura" />
          <div className="barlow muted" style={{ fontSize: 11, letterSpacing: ".15em", textAlign: "center", marginBottom: 4 }}>CURRENT PODIUM 🏆</div>
          <div className="podium">
            {[1, 0, 2].map((idx) => {
              const r = rows[idx];
              if (!r) return <div key={idx} className="pod-col" />;
              const place = idx + 1;
              // deterministic "random" prop per player so it's stable
              const mascotId = r.p.mascot || MASCOT_LIST[(r.p.id.charCodeAt(1) || 0) % MASCOT_LIST.length].id;
              return (
                <div className={`pod-col pod-${place}`} key={r.p.id} onClick={() => openProfile(r.p.id)}>
                  {place === 1 && <div className="pod-trophy">🏆</div>}
                  <div className="pod-char">
                    <Mascot id={mascotId} pose={place === 1 ? "celebrate" : "idle"} size={place === 1 ? 56 : 44} noBall />
                  </div>
                  <div className="bebas pod-name" style={{ color: place === 1 ? "var(--gold-bright)" : "var(--white)" }}>{r.p.name}</div>
                  <div className="barlow" style={{ fontSize: 11, color: "var(--gold-bright)" }}>{r.total} pts</div>
                  <div className={`pod-block pod-block-${place}`}><span className="pod-rank">{place}</span></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="h-sec">Live standings</div>
      {(() => {
        if (tab !== "overall" || !meId) return null;
        const myIdx = rows.findIndex((r) => r.p.id === meId);
        if (myIdx <= 0) return null;
        const me_ = rows[myIdx], above = rows[myIdx - 1];
        const gap = above.total - me_.total;
        const accOf = (pid) => { const pl = game.matches.filter((m) => m.status === "finished" && game.picks[m.id]?.[pid]?.pred).length; const c = game.matches.filter((m) => m.status === "finished" && pickPoints(m, game.picks[m.id]?.[pid]) > 0).length; return pl ? Math.round(c / pl * 100) : 0; };
        const myAcc = accOf(meId), upAcc = accOf(above.p.id);
        return (
          <div className="rivalry">
            <div className="barlow muted" style={{ fontSize: 11, letterSpacing: ".15em", marginBottom: 6 }}>🎯 YOUR RIVALRY — catch {above.p.name}</div>
            <div className="riv-row"><span>{me_.p.name} (you)</span><span className="riv-bar"><span className="riv-fill me" style={{ width: `${Math.min(100, myAcc)}%` }} /></span><span>{myAcc}%</span></div>
            <div className="riv-row"><span>{above.p.name}</span><span className="riv-bar"><span className="riv-fill up" style={{ width: `${Math.min(100, upAcc)}%` }} /></span><span>{upAcc}%</span></div>
            <div className="riv-gap">{gap === 0 ? "Dead level — overtake them!" : `${gap} pts behind — one good night closes it.`}</div>
          </div>
        );
      })()}
      <div className="subtab">
        {[["overall", "Overall"], ["group", "Group stage"], ["knockout", "Knockout"], ["underdog", "Underdog"]].map(([k, lab]) => (
          <button key={k} className={`btn ${tab === k ? "btn-gold" : "btn-ghost"}`} onClick={() => setTab(k)}>{lab}</button>
        ))}
      </div>
      <div className="lb-head"><span>#</span><span>Player</span><span className="num">Daily</span><span className="num">Udog</span><span className="num">Bonus</span><span className="num">Total</span></div>
      {rows.map((r, i) => (
        <div key={r.p.id}>
          <div className={`lb-row ${i === 0 && tab === "overall" ? "top1" : ""}`} style={{ animationDelay: `${i * 60}ms` }} onClick={() => setOpenRow(openRow === r.p.id ? null : r.p.id)}>
            <span className="rank">{i + 1}</span>
            <span><span className="pname" onClick={(e) => { e.stopPropagation(); openProfile(r.p.id); }}>{r.p.avatar} {r.p.name}</span> <span style={{ fontSize: 13 }}>{contention(r)}</span> {badgesFor(r, i).map((bd, bi) => <span key={bi} className="mbadge" style={{ animationDelay: `${bi * 0.1}s` }}>{bd}</span>)}</span>
            <span className="num">{r.daily}</span>
            <span className="num">{r.udPts}</span>
            <span className="num">{r.f4Pts + r.gbPts}</span>
            <span className="tot"><CountUp value={r.total} /></span>
          </div>
          {openRow === r.p.id && (
            <div className="panel" style={{ marginBottom: 8, fontSize: 13 }}>
              <div className="barlow gold" style={{ marginBottom: 6 }}>Pick history — {r.p.name}</div>
              {(() => {
                const trail = formTrail(game, r.p.id, 6);
                if (!trail.length) return null;
                return <div className="form-trail">Form: {trail.map((t, ti) => <span key={ti} className={`ft-dot ${t === "W" ? "ft-w" : "ft-l"}`}>{t}</span>)} <span className="muted" style={{ fontSize: 11 }}>(recent → now)</span></div>;
              })()}
              <div className="muted" style={{ marginBottom: 6 }}>
                Underdog: {r.udTeam ? `${r.udTeam.flag} ${r.udTeam.name} (${r.udPts} pts)` : "—"} ·
                Final 4: {r.f4 ? `${r.f4.team} (${r.f4Pts} pts)` : "— (0 pts)"} ·
                Golden Boot: {r.gb ? `${r.gb.player} (${r.gbPts} pts)` : "— (0 pts)"}
              </div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Qualifies: +{r.qualPts} · Scorelines: +{r.slPts} ·
                Group daily: {r.groupDaily} · Knockout daily: {r.koDaily}{r.adjust ? ` · Bonus/adjust: ${r.adjust > 0 ? "+" : ""}${r.adjust}` : ""}
              </div>
              {game.matches.filter((m) => m.status === "finished" && game.picks[m.id]?.[r.p.id]).map((m) => {
                const pk = game.picks[m.id][r.p.id];
                const a = tById[m.teamA], b = tById[m.teamB];
                const call = m.stage === "SF" || m.stage === "FINAL" ? koCallOf(pk) : pk.pred;
                const lab = call === "A" ? a?.name : call === "B" ? b?.name : call === "D" ? "Draw" : "—";
                const ex = pickExtraPoints(m, pk);
                const pts = pickPoints(m, pk) + ex.qualPts + ex.slPts;
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
        <div className="note">🪦 {rows[rows.length - 1].p.name} is holding the wooden spoon... and no, it doesn't pay anymore.</div>
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

  const enterResult = (m, sa, sb, qual) => {
    if (sa === "" || sb === "") return;
    mutate((g) => {
      const mm = g.matches.find((x) => x.id === m.id);
      mm.scoreA = Number(sa); mm.scoreB = Number(sb); mm.status = "finished";
      if (mm.stage !== "GROUP") {
        // 90-min winner decides the qualifier automatically; a level score
        // needs the admin's A/B call (extra time / penalties).
        mm.qualifier = Number(sa) > Number(sb) ? "A" : Number(sb) > Number(sa) ? "B" : (qual || mm.qualifier || null);
      }
      advanceFurthestOnResult(g, mm);
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
                  onClick={() => { if (confirm(`Remove ${p.name}?`)) mutate((g) => { g.players = g.players.filter((x) => x.id !== p.id); delete g.underdog[p.id]; if (g.final8) delete g.final8[p.id]; if (g.final4) delete g.final4[p.id]; if (g.goldenBoot) delete g.goldenBoot[p.id]; }); }}>Remove</button>
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
          Toggle underdog eligibility, set each team's furthest stage (drives underdog points), and mark group sweeps.
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

      <div className="h-sec">Pick overrides (deadline exceptions)</div>
      <AdminOverridePanel game={game} mutate={mutate} />

      <div className="h-sec">Underdog exceptions</div>
      <AdminUnderdogOverridePanel game={game} mutate={mutate} />

      <div className="h-sec">Mega update — Final 4, Golden Boot & qualifiers</div>
      <AdminMegaPanel game={game} mutate={mutate} />

      <div className="h-sec">Danger zone</div>
      <button className="btn btn-danger" onClick={() => { if (confirm("Wipe the ENTIRE game? This cannot be undone.")) mutate((g) => { for (const k of Object.keys(g)) delete g[k]; Object.assign(g, JSON.parse(JSON.stringify(DEFAULT_GAME))); }); }}>Reset whole league</button>
    </div>
  );
}
function AdminOverridePanel({ game, mutate }) {
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const [pid, setPid] = useState(game.players[0]?.id || "");
  const now = Date.now();
  // matches that are past their lock (the only ones needing an exception),
  // most recent first, limited to keep it tidy
  const lockedMatches = game.matches.filter((m) => m.status !== "void" && now >= new Date(m.kickoff).getTime())
    .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff)).slice(0, 30);
  const player = game.players.find((p) => p.id === pid);

  const isUnlocked = (mId) => !!(game.overrides?.[mId]?.[pid]);
  const toggleUnlock = (mId) => mutate((g) => {
    if (!g.overrides) g.overrides = {};
    if (!g.overrides[mId]) g.overrides[mId] = {};
    if (g.overrides[mId][pid]) { delete g.overrides[mId][pid]; if (Object.keys(g.overrides[mId]).length === 0) delete g.overrides[mId]; }
    else g.overrides[mId][pid] = true;
  });
  const setTheirPick = (m, pred) => mutate((g) => {
    if (!g.picks[m.id]) g.picks[m.id] = {};
    const cur = g.picks[m.id][pid] || { sa: "", sb: "", at: Date.now() };
    g.picks[m.id][pid] = { ...cur, pred, at: Date.now() };
  });

  return (
    <div className="panel">
      <div className="note" style={{ marginTop: 0 }}>
        Grant a specific player a deadline exception, or set their pick yourself — for genuine "I had a reason" cases. This does <b>not</b> change the normal at-kickoff deadline for anyone else; it's a per-player, per-match override you control.
      </div>
      <label className="barlow muted" style={{ fontSize: 12 }}>Player
        <select style={{ width: "100%", marginTop: 4 }} value={pid} onChange={(e) => setPid(e.target.value)}>
          {game.players.map((p) => <option key={p.id} value={p.id}>{p.avatar} {p.name}</option>)}
        </select>
      </label>
      {lockedMatches.length === 0 && <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>No locked matches yet — exceptions only apply after a deadline has passed.</div>}
      <div style={{ marginTop: 10 }}>
        {lockedMatches.map((m) => {
          const a = tById[m.teamA], b = tById[m.teamB];
          const theirPick = game.picks[m.id]?.[pid];
          const lab = theirPick?.pred === "A" ? a?.name : theirPick?.pred === "B" ? b?.name : theirPick?.pred === "D" ? "Draw" : "no pick";
          const unlocked = isUnlocked(m.id);
          return (
            <div key={m.id} className="ovr-row">
              <div className="ovr-match">
                <span>{a?.name} v {b?.name}</span>
                <span className="muted" style={{ fontSize: 11 }}>{new Date(m.kickoff).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · {player?.name} picked: <b style={{ color: theirPick ? "var(--gold-bright)" : "var(--muted)" }}>{lab}</b></span>
              </div>
              <div className="ovr-actions">
                <button className={`btn ${unlocked ? "btn-gold" : "btn-ghost"}`} style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => toggleUnlock(m.id)}>
                  {unlocked ? "🔓 Unlocked" : "🔒 Unlock"}
                </button>
                <div className="ovr-set">
                  <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 6px" }} onClick={() => setTheirPick(m, "A")} title={`Set ${a?.name}`}>{a?.name?.slice(0, 3)}</button>
                  <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 6px" }} onClick={() => setTheirPick(m, "D")}>Drw</button>
                  <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 6px" }} onClick={() => setTheirPick(m, "B")} title={`Set ${b?.name}`}>{b?.name?.slice(0, 3)}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="note">"🔓 Unlock" lets <b>{player?.name || "the player"}</b> set their own pick from the Picks tab even though it's past the deadline. The team buttons set the pick directly on their behalf. Tap "🔓 Unlocked" again to re-lock.</div>
    </div>
  );
}

function AdminUnderdogOverridePanel({ game, mutate }) {
  const [pid, setPid] = useState(game.players[0]?.id || "");
  const [teamSel, setTeamSel] = useState("");
  const eligible = game.teams.filter((t) => t.eligible).sort((a, b) => (a.group || "").localeCompare(b.group || "") || a.name.localeCompare(b.name));
  const player = game.players.find((p) => p.id === pid);
  const myUd = pid ? game.underdog[pid] : null;
  const myTeam = myUd ? game.teams.find((t) => t.id === myUd.teamId) : null;
  const isUnlocked = !!(game.underdogOverrides?.[pid]);

  const toggleUnlock = () => mutate((g) => {
    if (!g.underdogOverrides) g.underdogOverrides = {};
    if (g.underdogOverrides[pid]) delete g.underdogOverrides[pid];
    else g.underdogOverrides[pid] = true;
  });

  const setTheirPick = () => {
    if (!teamSel || !pid) return;
    mutate((g) => { g.underdog[pid] = { teamId: teamSel, at: Date.now() }; });
    setTeamSel("");
  };

  return (
    <div className="panel">
      <div className="note" style={{ marginTop: 0 }}>
        Unlock a player's underdog pick so they can change it themselves, or set it directly on their behalf.
      </div>
      <label className="barlow muted" style={{ fontSize: 12 }}>Player
        <select style={{ width: "100%", marginTop: 4 }} value={pid} onChange={(e) => { setPid(e.target.value); setTeamSel(""); }}>
          {game.players.map((p) => <option key={p.id} value={p.id}>{p.avatar} {p.name}</option>)}
        </select>
      </label>
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="muted" style={{ fontSize: 13 }}>Current pick: <b style={{ color: myTeam ? "var(--gold-bright)" : "var(--muted)" }}>{myTeam ? `${myTeam.flag} ${myTeam.name}` : "none"}</b></span>
        <button className={`btn ${isUnlocked ? "btn-gold" : "btn-ghost"}`} style={{ fontSize: 11, padding: "4px 8px" }} onClick={toggleUnlock}>
          {isUnlocked ? "🔓 Unlocked" : "🔒 Locked"}
        </button>
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label className="barlow muted" style={{ fontSize: 12, flex: 1 }}>Set pick directly
          <select style={{ width: "100%", marginTop: 4 }} value={teamSel} onChange={(e) => setTeamSel(e.target.value)}>
            <option value="">— choose a team —</option>
            {eligible.map((t) => <option key={t.id} value={t.id}>{t.flag} {t.name}</option>)}
          </select>
        </label>
        <button className="btn btn-gold" style={{ fontSize: 12, padding: "6px 12px", alignSelf: "flex-end" }} disabled={!teamSel} onClick={setTheirPick}>Set</button>
      </div>
      <div className="note">Toggling "🔓 Unlocked" lets <b>{player?.name || "this player"}</b> change their own underdog from the Underdog tab. Use the team selector to override their pick directly. Tap "🔓 Unlocked" again to re-lock.</div>
    </div>
  );
}

function AdminMegaPanel({ game, mutate }) {
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const [gbWinner, setGbWinner] = useState(game.goldenBootWinner || "");
  const wouldScore = gbWinner.trim()
    ? game.players.filter((p) => gbMatches(game.goldenBoot?.[p.id]?.player, gbWinner.trim()))
    : [];
  const sfFinal = game.matches.filter((m) => m.stage !== "GROUP" && m.status !== "void")
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  const setQualifier = (mId, q) => mutate((g) => {
    const mm = g.matches.find((x) => x.id === mId);
    if (!mm) return;
    mm.qualifier = mm.qualifier === q ? null : q;
    if (mm.status === "finished") advanceFurthestOnResult(g, mm);
  });
  const clearF4 = (p) => { if (confirm(`Clear ${p.name}'s Final 4 pick? They can then pick again.`)) mutate((g) => { if (g.final4) delete g.final4[p.id]; }); };
  const clearGb = (p) => { if (confirm(`Clear ${p.name}'s Golden Boot pick? They can then pick again.`)) mutate((g) => { if (g.goldenBoot) delete g.goldenBoot[p.id]; }); };

  return (
    <>
      <div className="panel" style={{ marginBottom: 10 }}>
        <div className="barlow muted" style={{ fontSize: 12, marginBottom: 6 }}>Golden Boot winner</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ flex: 1, minWidth: 180 }} placeholder="e.g. Kylian Mbappé (blank clears)"
            value={gbWinner} onChange={(e) => setGbWinner(e.target.value)} />
          <button className="btn btn-gold" onClick={() => mutate((g) => {
            const v = gbWinner.trim();
            if (v) g.goldenBootWinner = v; else delete g.goldenBootWinner;
          })}>Save</button>
        </div>
        <div className="note">
          {gbWinner.trim()
            ? wouldScore.length
              ? <>Would score with this value: {wouldScore.map((p) => `${p.avatar} ${p.name} (+${gbValue(game.goldenBoot[p.id].player)})`).join(" · ")}</>
              : "No player's pick matches this value."
            : "Saving a blank clears the winner (nobody scores)."}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 10 }}>
        <div className="barlow muted" style={{ fontSize: 12, marginBottom: 6 }}>Mercy clears — the only way to change a locked pick</div>
        {game.players.map((p) => {
          const f4 = game.final4?.[p.id];
          const gb = game.goldenBoot?.[p.id];
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "6px 0", borderBottom: "1px dashed rgba(138,170,150,.15)" }}>
              <span style={{ minWidth: 120, fontSize: 13 }}>{p.avatar} {p.name}</span>
              <span className="muted" style={{ fontSize: 12, flex: 1 }}>
                🎯 {f4 ? f4.team : "—"} · 👟 {gb ? gb.player : "—"}
              </span>
              <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} disabled={!f4} onClick={() => clearF4(p)}>Clear Final 4</button>
              <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} disabled={!gb} onClick={() => clearGb(p)}>Clear Golden Boot</button>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <div className="barlow muted" style={{ fontSize: 12, marginBottom: 6 }}>Qualifier overrides — who went through (all knockouts)</div>
        {sfFinal.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No knockout fixtures loaded yet.</div>}
        {sfFinal.map((m) => {
          const a = tById[m.teamA], b = tById[m.teamB];
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "6px 0", borderBottom: "1px dashed rgba(138,170,150,.15)" }}>
              <span style={{ flex: 1, minWidth: 160, fontSize: 13 }}>{STAGE_LABEL[m.stage]} · {a?.name} v {b?.name}</span>
              <button className={`btn ${m.qualifier === "A" ? "btn-gold" : "btn-ghost"}`} style={{ padding: "4px 8px", fontSize: 11 }}
                onClick={() => setQualifier(m.id, "A")}>{a?.name?.slice(0, 3) || "A"} through</button>
              <button className={`btn ${m.qualifier === "B" ? "btn-gold" : "btn-ghost"}`} style={{ padding: "4px 8px", fontSize: 11 }}
                onClick={() => setQualifier(m.id, "B")}>{b?.name?.slice(0, 3) || "B"} through</button>
            </div>
          );
        })}
        <div className="note">The qualifier IS the knockout result — every knockout pick pays on who advances (pens count), and on the Final it also decides the Final 4 champion. Fixture syncs fill it from the API when it's empty; a value you set here is never overwritten by a sync. If you flip it after a result was saved, also double-check the team's "furthest stage" in the Teams panel — that only ever moves forward automatically.</div>
      </div>
    </>
  );
}

function AdminResultRow({ m, a, b, onSave, onVoid, onDelete }) {
  const [sa, setSa] = useState(m.scoreA ?? "");
  const [sb, setSb] = useState(m.scoreB ?? "");
  const [qual, setQual] = useState(m.qualifier || "");
  const isKoDecider = m.stage !== "GROUP";
  const level = sa !== "" && sb !== "" && Number(sa) === Number(sb);
  // auto-select the higher scorer; only a level 90-min score needs the toggle
  const effQual = !isKoDecider ? "" : sa !== "" && sb !== "" && !level ? (Number(sa) > Number(sb) ? "A" : "B") : qual;
  const needsQual = isKoDecider && level && !qual;
  return (
    <div className="panel" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8, opacity: m.status === "void" ? 0.5 : 1 }}>
      <span style={{ minWidth: 180 }}>{a?.flag} {a?.name} v {b?.flag} {b?.name}</span>
      <span className="muted barlow" style={{ fontSize: 11 }}>{STAGE_LABEL[m.stage]} · {fmtTime(m.kickoff)}</span>
      <input style={{ width: 50, textAlign: "center" }} inputMode="numeric" value={sa} onChange={(e) => setSa(e.target.value.replace(/\D/g, ""))} aria-label="home score" />
      <span>–</span>
      <input style={{ width: 50, textAlign: "center" }} inputMode="numeric" value={sb} onChange={(e) => setSb(e.target.value.replace(/\D/g, ""))} aria-label="away score" />
      {isKoDecider && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span className="muted barlow" style={{ fontSize: 11 }}>Who went through?</span>
          <button className={`btn ${effQual === "A" ? "btn-gold" : "btn-ghost"}`} style={{ padding: "4px 8px", fontSize: 11 }}
            disabled={!level && sa !== "" && sb !== ""} onClick={() => setQual("A")}>{a?.name?.slice(0, 3) || "A"}</button>
          <button className={`btn ${effQual === "B" ? "btn-gold" : "btn-ghost"}`} style={{ padding: "4px 8px", fontSize: 11 }}
            disabled={!level && sa !== "" && sb !== ""} onClick={() => setQual("B")}>{b?.name?.slice(0, 3) || "B"}</button>
        </span>
      )}
      <button className="btn btn-gold" style={{ padding: "6px 12px" }} disabled={needsQual} onClick={() => onSave(m, sa, sb, effQual)}>Save result</button>
      <button className="btn btn-ghost" style={{ padding: "6px 12px" }} onClick={onVoid}>{m.status === "void" ? "Unvoid" : "Void"}</button>
      <button className="btn btn-danger" style={{ padding: "6px 12px" }} onClick={onDelete}>Delete</button>
      {m.status === "finished" && <span className="chip ok">FT {m.scoreA}–{m.scoreB}{isKoDecider && m.qualifier ? ` · ${m.qualifier === "A" ? a?.name : b?.name} through` : ""}</span>}
      {isKoDecider && <div className="note" style={{ width: "100%", marginTop: 4 }}>Knockouts: enter the <b>90-minute</b> score. The winner auto-fills "who went through"; if the 90-min score is level you must set it yourself — knockout picks pay on who advances{m.stage === "SF" || m.stage === "FINAL" ? ", plus the exact-score pick" : ""}{m.stage === "FINAL" ? ", and it decides the Final 4 champion" : ""}.</div>}
    </div>
  );
}

function playerStats(game, pid) {
  const fin = game.matches.filter((m) => m.status === "finished" && game.picks[m.id]?.[pid]?.pred);
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
    total: row?.total || 0, daily: row?.daily || 0, udPts: row?.udPts || 0,
    bonusPts: (row?.f4Pts || 0) + (row?.gbPts || 0), f4: row?.f4 || null, gb: row?.gb || null,
    played: fin.length, correct, accuracy: fin.length ? Math.round((correct / fin.length) * 100) : 0,
    streak: streakFor(game, pid), udTeam: row?.udTeam, tById,
    best: bigWins.slice(0, 3).map((bw) => `${bw.tById?.[bw.m.teamA]?.name || tById[bw.m.teamA]?.name} ${bw.m.scoreA}–${bw.m.scoreB} ${tById[bw.m.teamB]?.name} · +${bw.pts}`),
  };
}

const CARD_COLORS = ["#c9a84c", "#4fc3f7", "#e63946", "#2d6e47", "#9b59b6", "#e67e22", "#ffffff", "#ff5fa2"];

const PICTURE_EMOJIS = [...'⚽🏆🥅🧤👟🎽🏅🎯🔥💪👑🌟💀🤡🎪🎭🎨🎬🔮🎲🃏🎰💎💰🤑💸🏦🎖️🎗️🎀🎊🎉🎈🎁🎠🎡🎢🎭'];

function computeBadges(game, pid, standings, st) {
  const rank = standings.findIndex((r) => r.p.id === pid) + 1;
  const streak = streakFor(game, pid);
  const finMatches = game.matches.filter((m) => m.status === "finished");
  let contrarianCount = 0;
  for (const m of finMatches) {
    const pk = game.picks[m.id]?.[pid];
    if (!pk || pk.pred !== matchResult(m)) continue;
    const split = pickSplit(game, m);
    if (split.total < 2) continue;
    const myCount = split[pk.pred] || 0;
    const otherMax = Math.max(...["A", "B", "D"].filter((x) => x !== pk.pred).map((x) => split[x] || 0));
    if (myCount < otherMax) contrarianCount++;
  }
  return [
    { emoji: "🔥", name: "Heater", earned: streak >= 3 },
    { emoji: "🎯", name: "Sniper", earned: st.accuracy >= 70 && st.played >= 5 },
    { emoji: "🃏", name: "Joker", earned: st.accuracy < 35 && st.played >= 5 },
    { emoji: "👑", name: "Leader", earned: rank === 1 },
    { emoji: "🐉", name: "Underdawg", earned: !!game.underdog[pid] },
    { emoji: "🎖️", name: "Veteran", earned: finMatches.length > 0 && (st.played / finMatches.length) >= 0.9 },
    { emoji: "💎", name: "Contrarian", earned: contrarianCount >= 3 },
  ];
}

function AccRing({ pct }) {
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    let raf;
    let start = null;
    const duration = 900;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisp(Math.round(pct * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [pct]);
  return (
    <div className="acc-ring" style={{ background: `conic-gradient(var(--gold) ${disp * 3.6}deg, #1a3025 0deg)` }}>
      <div className="acc-ring-inner">
        <div><div className="acc-pct">{pct}%</div><div className="acc-sub">accuracy</div></div>
      </div>
    </div>
  );
}

function ProfileBody({ game, pid, meId, onClose, mutate, isPage }) {
  const p = game.players.find((x) => x.id === pid);
  const [editing, setEditing] = useState(false);
  const [hmTip, setHmTip] = useState("");
  if (!p) return null;

  const st = playerStats(game, pid);
  const isMe = pid === meId;
  const accent = p.color || "#c9a84c";
  const standings = computeStandings(game).sort((a, b) => b.total - a.total);
  const rank = standings.findIndex((r) => r.p.id === pid) + 1;
  const tById = Object.fromEntries(game.teams.map((t) => [t.id, t]));
  const saveField = (field, val) => mutate((g) => { const gp = g.players.find((x) => x.id === pid); if (gp) gp[field] = val; });

  const finMatches = game.matches.filter((m) => m.status === "finished").sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

  const bigWins = [];
  for (const m of finMatches) {
    const pk = game.picks[m.id]?.[pid];
    if (!pk) continue;
    const pts = pickPoints(m, pk);
    if (pts > 0) bigWins.push({ m, pts });
  }
  bigWins.sort((a, b) => b.pts - a.pts);
  const sigWin = bigWins[0] || null;

  const badges = computeBadges(game, pid, standings, st);
  const form8 = formTrail(game, pid, 8);
  const nextRankRow = rank > 1 ? standings[rank - 2] : null;
  const myRow = standings[rank - 1];
  const gap = nextRankRow && myRow ? nextRankRow.total - myRow.total : 0;

  return (
    <>
      {/* HERO */}
      <div className="prof-hero" style={{ background: `linear-gradient(180deg, ${accent}22, transparent)`, ...(isPage ? { borderRadius: 14 } : {}) }}>
        {!isPage && <button className="close" onClick={onClose} aria-label="close">×</button>}
        <div className="prof-emoji">
          {p.pictureEmoji || (p.mascot ? <Mascot id={p.mascot} pose={rank === 1 ? "celebrate" : "idle"} size={72} /> : p.avatar)}
        </div>
        <div className="prof-name" style={{ color: accent }}>{p.name}</div>
        {p.tagline && <div className="prof-tagline">"{p.tagline}"</div>}
        {p.resembles && (
          <div className="prof-plays-like">Plays like: {p.resembles}&nbsp;<Flag name={p.resembles} size={14} /></div>
        )}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <span className="prof-rank-badge">#{rank || "—"}{rank === 1 ? " 👑" : rank === 2 ? " 🥈" : rank === 3 ? " 🥉" : ""}</span>
          <span className="prof-rank-badge" style={{ borderColor: "rgba(22,194,100,.4)", color: "#7fe8a8" }}>{st.total} pts</span>
        </div>
        {p.profileBio && <div className="prof-bio">{p.profileBio}</div>}
        {p.mascot && p.pictureEmoji && <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}><Mascot id={p.mascot} pose="idle" size={38} /></div>}
      </div>

      {/* ACCURACY RING + QUICK STATS */}
      <div className="prof-section">
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <AccRing pct={st.accuracy} />
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div className="stat-box"><div className="v">{st.streak}🔥</div><div className="l">Streak</div></div>
            <div className="stat-box"><div className="v">{st.correct}/{st.played}</div><div className="l">Correct</div></div>
            <div className="stat-box"><div className="v">{st.udPts}</div><div className="l">UD pts</div></div>
            <div className="stat-box"><div className="v">{st.bonusPts}</div><div className="l">Bonus pts</div></div>
          </div>
        </div>
      </div>

      {/* LOCKED CALLS — Final 4 + Golden Boot */}
      <div className="prof-section">
        <div className="prof-sec-label">Locked calls</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
          <div>🎯 Final 4: {st.f4 ? <b style={{ color: "var(--gold-bright)" }}><Flag name={st.f4.team} size={14} /> {st.f4.team}</b> : <span className="muted">no pick yet</span>}</div>
          <div>👟 Golden Boot: {st.gb ? <b style={{ color: "var(--gold-bright)" }}>{st.gb.player} ({st.gb.team})</b> : <span className="muted">no pick yet</span>}</div>
          <div>🐉 Underdog: {st.udTeam ? <b style={{ color: "var(--gold-bright)" }}>{st.udTeam.flag} {st.udTeam.name}</b> : <span className="muted">no pick</span>}</div>
        </div>
      </div>

      {/* FORM TRAIL — last 8 */}
      {form8.length > 0 && (
        <div className="prof-section">
          <div className="prof-sec-label">Form — last {form8.length}</div>
          <div className="form-big">
            {form8.map((r, i) => <span key={i} className={`fb-dot ${r === "W" ? "ft-w" : "ft-l"}`}>{r}</span>)}
          </div>
        </div>
      )}

      {/* PICK HEATMAP */}
      {finMatches.length > 0 && (
        <div className="prof-section">
          <div className="prof-sec-label">Tournament map — {finMatches.length} matches</div>
          <div className="heatmap">
            {finMatches.map((m) => {
              const pk = game.picks[m.id]?.[pid];
              const res = matchResult(m);
              const cls = !pk?.pred ? "no-pick" : pk.pred === res ? "hit" : "miss";
              const a = tById[m.teamA], b = tById[m.teamB];
              const lbl = a && b ? `${a.name} ${m.scoreA}–${m.scoreB} ${b.name}${pk?.pred ? (pk.pred === res ? " ✓" : " ✗") : " (no pick)"}` : "";
              return <span key={m.id} className={`hm-sq ${cls}`} onMouseEnter={() => setHmTip(lbl)} onMouseLeave={() => setHmTip("")} title={lbl} />;
            })}
          </div>
          <div className="hm-tip" style={{ minHeight: 16 }}>{hmTip}</div>
        </div>
      )}

      {/* SIGNATURE WIN */}
      {sigWin && (() => {
        const a = tById[sigWin.m.teamA], b = tById[sigWin.m.teamB];
        return (
          <div className="prof-section">
            <div className="prof-sec-label">Best call</div>
            <div className="sig-win">
              <span className="sig-trophy-ico">🏆</span>
              <div className="sig-teams">
                <div className="sig-matchup">
                  {a && <Flag name={a.name} size={16} />}
                  <span style={{ fontSize: 14 }}>{a?.name} {sigWin.m.scoreA}–{sigWin.m.scoreB} {b?.name}</span>
                  {b && <Flag name={b.name} size={16} />}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{STAGE_LABEL[sigWin.m.stage] || sigWin.m.stage}</div>
              </div>
              <div className="sig-pts">+{sigWin.pts}</div>
            </div>
          </div>
        );
      })()}

      {/* BADGE CABINET */}
      <div className="prof-section">
        <div className="prof-sec-label">Badge cabinet</div>
        <div className="badge-row">
          {badges.map((b) => (
            <div key={b.name} className={`badge ${b.earned ? "earned" : "locked"}`} title={b.earned ? `${b.name}: Earned!` : `${b.name}: Not yet`}>
              <span className="badge-ico">{b.emoji}</span>
              <span className="badge-name">{b.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* H2H TABLE */}
      <div className="prof-section">
        <div className="prof-sec-label">Head-to-head record</div>
        {game.players.filter((op) => op.id !== pid).length === 0 ? (
          <div className="note" style={{ marginTop: 0 }}>No opponents yet.</div>
        ) : (
          <table className="h2h-tbl">
            <thead><tr><th>vs</th><th>W</th><th>D</th><th>L</th><th>N</th></tr></thead>
            <tbody>
              {game.players.filter((op) => op.id !== pid).map((op) => {
                const h = headToHead(game, pid, op.id);
                if (h.both === 0) return (
                  <tr key={op.id}><td>{op.avatar} {op.name}</td><td colSpan={4} style={{ color: "var(--muted)", fontSize: 11 }}>—</td></tr>
                );
                return (
                  <tr key={op.id}>
                    <td>{op.avatar} {op.name}</td>
                    <td className="h2h-w">{h.aWins}</td>
                    <td className="h2h-d">{h.ties}</td>
                    <td className="h2h-l">{h.bWins}</td>
                    <td style={{ color: "var(--muted)", fontSize: 11 }}>{h.both}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* GAP TO NEXT RANK */}
      {rank > 1 && nextRankRow && gap > 0 && (
        <div className="prof-section">
          <div className="gap-next">+{gap} pts to overtake {nextRankRow.p.avatar} {nextRankRow.p.name}</div>
        </div>
      )}

      {/* EDIT */}
      {isMe && (
        <div style={{ borderTop: "1px solid #232326", paddingTop: 6 }}>
          {!editing ? (
            <div style={{ padding: "6px 18px 18px" }}>
              <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => setEditing(true)}>✎ Customise my profile</button>
            </div>
          ) : (
            <div className="edit-row" style={{ paddingBottom: 18 }}>
              <label>Profile picture emoji</label>
              <div className="emoji-grid">
                {PICTURE_EMOJIS.map((em) => (
                  <span key={em} className={`emoji-opt ${p.pictureEmoji === em ? "on" : ""}`} onClick={() => saveField("pictureEmoji", em)}>{em}</span>
                ))}
              </div>
              <label>Avatar emoji (fallback)</label>
              <input defaultValue={p.avatar} maxLength={4} onBlur={(e) => saveField("avatar", e.target.value || "⚽")} />
              <label>Backing (nation / flavour)</label>
              <input defaultValue={p.country || ""} onBlur={(e) => saveField("country", e.target.value)} />
              <label>Tagline / trash talk</label>
              <input defaultValue={p.tagline || ""} maxLength={80} placeholder="say something..." onBlur={(e) => saveField("tagline", e.target.value)} />
              <label>Extended bio (150 chars)</label>
              <input defaultValue={p.profileBio || ""} maxLength={150} placeholder="Tell us who you really are..." onBlur={(e) => saveField("profileBio", e.target.value)} />
              <label>Plays like (WC 2026 player name)</label>
              <input defaultValue={p.resembles || ""} maxLength={60} placeholder="e.g. Mbappé, De Bruyne..." onBlur={(e) => saveField("resembles", e.target.value)} />
              <label>Pick your legend mascot</label>
              <div className="mascot-pick">
                <button className={`mascot-opt ${!p.mascot ? "on" : ""}`} onClick={() => saveField("mascot", "")}>None<br/><span style={{ fontSize: 22 }}>{p.avatar}</span></button>
                {MASCOT_LIST.map((mc) => (
                  <button key={mc.id} className={`mascot-opt ${p.mascot === mc.id ? "on" : ""}`} onClick={() => saveField("mascot", mc.id)}>
                    <Mascot id={mc.id} pose="idle" size={40} />
                    <span className="mo-name">{mc.name.replace("The ", "")}</span>
                  </button>
                ))}
              </div>
              <label>Card colour</label>
              <div className="swatches">
                {CARD_COLORS.map((c) => <span key={c} className={`swatch ${(p.color || "#c9a84c") === c ? "on" : ""}`} style={{ background: c }} onClick={() => saveField("color", c)} />)}
              </div>
              <button className="btn btn-gold" style={{ width: "100%", marginTop: 12 }} onClick={() => setEditing(false)}>Done</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ProfileModal({ game, pid, meId, onClose, mutate }) {
  const p = game.players.find((x) => x.id === pid);
  if (!p) return null;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal prof-modal" onClick={(e) => e.stopPropagation()}>
        <ProfileBody game={game} pid={pid} meId={meId} onClose={onClose} mutate={mutate} isPage={false} />
      </div>
    </div>
  );
}

function ProfilePage({ game, me, mutate }) {
  if (!me) return (
    <div className="prof-page" style={{ textAlign: "center", paddingTop: 40 }}>
      <div style={{ fontSize: 48 }}>👤</div>
      <div className="bebas" style={{ fontSize: 24, marginTop: 12, color: "var(--gold-bright)" }}>Select your player above</div>
      <div className="note" style={{ marginTop: 8 }}>Pick your name from the dropdown at the top to see your full profile.</div>
    </div>
  );
  return (
    <div className="prof-page">
      <ProfileBody game={game} pid={me.id} meId={me.id} onClose={null} mutate={mutate} isPage />
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
    const fin = game.matches.filter((m) => m.status === "finished" && game.picks[m.id]?.[r.p.id]?.pred)
      .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));
    let cold = 0;
    for (const m of fin) { if (game.picks[m.id][r.p.id].pred !== matchResult(m)) cold++; else break; }
    if (cold >= 2) items.push({ id: "cold-" + r.p.id, pid: r.p.id, badge: `${cold} wrong in a row`, desc: `On a freezing run — ${cold} busted picks back to back. Someone check the pulse.` });
  }
  // Backed a team that got battered (lost by 3+) — most recent
  for (const r of rows) {
    const fin = game.matches.filter((m) => m.status === "finished" && game.picks[m.id]?.[r.p.id]?.pred)
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
        <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "6px 0" }}>
          <Mascot id="rocket" pose="despair" size={56} />
          <Mascot id="machine" pose="despair" size={56} />
        </div>
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
const SECTIONS = [
  { key: "home", icon: "🏟️", label: "Home", colour: "#16c264", defaultPage: "today", pages: ["today", "home", "scores"] },
  { key: "predict", icon: "✅", label: "Predict", colour: "#d4af37", defaultPage: "picks", pages: ["picks", "board", "underdog", "final4", "goldenboot", "prizes"] },
  { key: "social", icon: "⚔️", label: "Social", colour: "#9b59b6", defaultPage: "war", pages: ["war", "stats", "shame"] },
  { key: "me", icon: "👤", label: "Me", colour: "#e67e22", defaultPage: "profile", pages: ["profile", "admin"] },
];
const PAGE_LABELS = {
  today: "Today", home: "Dashboard", scores: "Scores",
  picks: "Picks", board: "Table", underdog: "Underdog", final4: "Final 4", goldenboot: "Golden Boot", prizes: "Prizes",
  war: "War Room", stats: "Stats", shame: "Shame",
  profile: "Profile", admin: "Admin",
};
const PAGE_ICONS = {
  today: "📅",
  home: "🏟️",
  scores: "📺",
  picks: "✅",
  board: "🏆",
  underdog: "🐉",
  final4: "🎯",
  goldenboot: "👟",
  prizes: "💰",
  war: "⚔️",
  stats: "🎯",
  shame: "💀",
  profile: "👤",
  admin: "🛠️",
};

export default function App() {
  const [game, setGame] = useState(null);
  const [tab, setTab] = useState("today");
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
  const [sectionPickerTarget, setSectionPickerTarget] = useState(null);
  const contentDragStart = useRef(null);
  const [meId, setMeIdRaw] = useState("");
  const [isAdmin, setIsAdminRaw] = useState(false);
  const [installHint, setInstallHint] = useState(false);
  const [soundTick, setSoundTick] = useState(0);
  // Register the service worker (enables install + push) and show a one-time
  // "add to home screen" hint on iPhones that haven't installed yet.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    try {
      const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;
      const dismissed = localStorage.getItem("wc26-install-hint") === "1";
      if (isiOS && !standalone && !dismissed) setInstallHint(true);
    } catch (e) {}
  }, []);
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

  // Once per day, snapshot the current ranks so "biggest mover" can compare
  // today vs yesterday. Read-only re: points — just stores rank positions.
  useEffect(() => {
    if (!game) return;
    const today = new Date().toDateString();
    if (game.rankSnapDate === today) return;
    const rows = computeStandings(game).sort((a, b) => b.total - a.total);
    const snap = {}; rows.forEach((r, i) => { snap[r.p.id] = i + 1; });
    const t = setTimeout(() => {
      mutate((g) => { g.rankSnapshot = snap; g.rankSnapDate = today; });
    }, 1500);
    return () => clearTimeout(t);
  }, [game && game.rankSnapDate]);

  // One-time self-heal: earlier syncs mis-stored Round-of-32 games as GROUP
  // before the API stage was mapped. Now that apiStage is preserved, relabel
  // any such match so live scoring picks up the correct 5-pt stage. Idempotent.
  useEffect(() => {
    if (!game) return;
    const isMisfiledR32 = (m) => m.stage === "GROUP" && m.apiStage && apiStage(m.apiStage) === "R32";
    if (!game.matches.some(isMisfiledR32)) return;
    const t = setTimeout(() => {
      mutate((g) => { g.matches.forEach((m) => { if (isMisfiledR32(m)) m.stage = "R32"; }); });
    }, 1500);
    return () => clearTimeout(t);
  }, [game && game.matches && game.matches.length]);

  // Trigger the notification check on app open and every few minutes while
  // open. With several people using the app through the day, this reliably
  // fires alerts without needing a paid frequent-cron plan.
  useEffect(() => {
    const ping = () => { fetch("/api/cron").catch(() => {}); };
    ping();
    const t = setInterval(ping, 5 * 60000);
    return () => clearInterval(t);
  }, []);

  // keep live scores fresh: poll every ~minute while watching Home or Picks
  useEffect(() => {
    if (tab !== "home" && tab !== "picks" && tab !== "scores" && tab !== "today" && tab !== "war") return;
    const t = setInterval(() => pullFixtures(false), 65000);
    return () => clearInterval(t);
  }, [tab, pullFixtures]);

  const [burstColors, setBurstColors] = useState(null);
  const [pickFlash, setPickFlash] = useState(null);
  const fireConfetti = (colors) => { setBurstColors(colors || null); setBurst(false); requestAnimationFrame(() => setBurst(true)); setTimeout(() => setBurst(false), 4000); };

  useEffect(() => {
    if (!game || !isGroupStageDone(game)) return;
    try {
      if (localStorage.getItem("wc26-groups-done-shown")) return;
      localStorage.setItem("wc26-groups-done-shown", "1");
    } catch (e) { return; }
    setBurstColors(["#ffd633", "#16c264", "#ffffff", "#4fc3f7"]);
    setBurst(false);
    requestAnimationFrame(() => setBurst(true));
    setTimeout(() => setBurst(false), 4000);
  }, [game]); // eslint-disable-line react-hooks/exhaustive-deps

  // THE PICK RUSH: full-screen "LET'S GO" + confetti in the country's colours
  const flashTimer = useRef(null);
  const celebratePick = (team) => {
    SFX.pick();
    const phrase = HYPE[Math.floor(Math.random() * HYPE.length)];
    const colors = team ? colorsFor(team.name) : ["#ffd633", "#16c264", "#ffffff"];
    setPickFlash({ name: team ? team.name : null, flag: team ? team.flag : "🤝", text: team ? `${team.name.toUpperCase()} — ${phrase}` : `DRAW — ${phrase}` });
    fireConfetti(colors);
    try { navigator.vibrate && navigator.vibrate([18, 30, 40]); } catch (e) {}
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setPickFlash(null), 1600);
  };

  // THE PAYOUT: when new results have landed since you last looked and your
  // picks came in — take over the screen: points, the wins, confetti, haptics.
  const [profileId, setProfileId] = useState(null);
  const [detailMatch, setDetailMatch] = useState(null);
  useEffect(() => { _openMatch = (m) => setDetailMatch(m); return () => { _openMatch = () => {}; }; }, []);
  useEffect(() => {
    const el = document.querySelector(".sub-nav-pill.active");
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
          const ex = pickExtraPoints(m, pk);
          const p = pickPoints(m, pk) + ex.qualPts + ex.slPts;
          if (p > 0) { pts += p; wins.push(`✓ ${tById[m.teamA]?.name} ${m.scoreA}–${m.scoreB} ${tById[m.teamB]?.name} · +${p}`); }
        }
        if (pts > 0) {
          setPayout({ pts, wins });
          SFX.payout();
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

  if (!game) return <div className="wc-app"><style>{CSS + MASCOT_CSS}</style>{errBanner}<div className="page bebas" style={{ fontSize: 26, textAlign: "center", paddingTop: 80 }}>WARMING UP ON THE TOUCHLINE… <span style={{ fontSize: 14 }}>{APP_VERSION}</span><div className="note" style={{ fontFamily: "Inter", letterSpacing: 0, marginTop: 12 }}>If this never goes away, the database connection is failing — check the red banner or Vercel env vars.</div></div></div>;

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

  const FX_TABS = new Set(["home", "picks", "scores", "today", "war"]);
  const goToPage = (k) => {
    setTab(k);
    SFX.click();
    try { navigator.vibrate && navigator.vibrate(8); } catch (e) {}
    if (FX_TABS.has(k)) pullFixtures(false);
  };
  const isOwner = (me?.name || "").toLowerCase() === OWNER_NAME;
  const visiblePagesFor = (section) => section.pages.filter((p) => (p === "admin" ? (isAdmin || isOwner) : true));
  const currentSection = SECTIONS.find((s) => s.pages.includes(tab)) || SECTIONS[0];
  const visiblePages = visiblePagesFor(currentSection);

  const handleTabTap = (section) => {
    setSectionPickerTarget(section);
    setSectionPickerOpen(true);
  };
  const handlePickerSelect = (pageKey) => {
    goToPage(pageKey);
    setSectionPickerOpen(false);
  };

  const onContentPointerDown = (e) => {
    if (tab === "picks") return;
    contentDragStart.current = e.clientX;
  };
  const onContentPointerUp = (e) => {
    if (contentDragStart.current === null || tab === "picks") return;
    const delta = e.clientX - contentDragStart.current;
    contentDragStart.current = null;
    if (Math.abs(delta) < 50) return;
    const section = SECTIONS.find((s) => s.pages.includes(tab));
    if (!section) return;
    const pages = visiblePagesFor(section);
    const currentIndex = pages.indexOf(tab);
    if (currentIndex === -1) return;
    if (delta < 0 && currentIndex < pages.length - 1) {
      setTab(pages[currentIndex + 1]);
      SFX.click();
    } else if (delta > 0 && currentIndex > 0) {
      setTab(pages[currentIndex - 1]);
      SFX.click();
    }
  };
  const pageIndex = visiblePages.indexOf(tab);

  return (
    <div className="wc-app" style={{ "--section-colour": currentSection.colour }}>
      <style>{CSS + MASCOT_CSS}</style>
      {errBanner}
      {installHint && (
        <div style={{ position: "fixed", bottom: 78, left: 12, right: 12, zIndex: 210, background: "linear-gradient(135deg,#2a2008,#1c3427)", border: "1px solid var(--gold)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 0 24px rgba(240,201,58,.4)" }}>
          <span style={{ fontSize: 22 }}>📲</span>
          <span style={{ fontSize: 13, flex: 1 }}>Install the app: tap <b>Share</b> then <b>"Add to Home Screen"</b> for fullscreen + alerts.</span>
          <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => { setInstallHint(false); try { localStorage.setItem("wc26-install-hint", "1"); } catch (e) {} }}>Got it</button>
        </div>
      )}
      {payout && (
        <div className="payout" onClick={() => setPayout(null)}>
          <div className="payout-card">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><Mascot id={me?.mascot || "magician"} pose="celebrate" size={84} /></div>
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
            <span className="pf-flag">{pickFlash.name ? <Flag name={pickFlash.name} size={56} /> : pickFlash.flag}</span>
            <span className="pf-text">{pickFlash.text}</span>
          </div>
        </div>
      )}
      <StadiumBg />
      <div className="topwrap">
      <nav className="nav">
        <div className="nav-headline">
          <span className="nav-trophy">🏆</span>
          <span className="hype-title">WC2026 · <span className="grp">{game.config.groupName}</span></span>
          <span className="nav-trophy" style={{ animationDirection: "reverse" }}>🏆</span>
        </div>
        <div className="nav-controls">
          <select className="who" value={meId} onChange={(e) => choosePlayer(e.target.value)} aria-label="select your player">
            <option value="">Who are you?</option>
            {game.players.map((p) => <option key={p.id} value={p.id}>{p.avatar} {p.name}{p.pin ? " 🔒" : ""}</option>)}
          </select>
          {me && <button className="who bell-btn" title="Enable notifications"
            onClick={async () => { const r = await enablePush(me.id, me.name); alert(r.msg); }}>🔔</button>}
          <button className="who sound-btn" title="Toggle sound"
            onClick={() => { const ns = !soundOn(); try { localStorage.setItem("wc26-sound", ns ? "1" : "0"); } catch (e) {} if (ns) { actx(); SFX.pick(); } setSoundTick((x) => x + 1); }}>{soundOn() ? "🔊" : "🔇"}</button>
          <span className="pot-badge shine"><span className="coin"><span className="face">$</span><span className="face back">$</span></span>{game.config.currency}<CountUp value={pot} decimals={2} /></span>
        </div>
      </nav>
      <Ticker game={game} />
      <div className="sub-nav">
        {visiblePages.map((p) => (
          <button key={p} className={`sub-nav-pill ${tab === p ? "active" : ""}`} onClick={() => goToPage(p)}>
            {PAGE_LABELS[p]}
          </button>
        ))}
      </div>
      </div>

      <div className="page-anim" key={tab} onPointerDown={onContentPointerDown} onPointerUp={onContentPointerUp} style={{ touchAction: "pan-y" }}>
      {tab === "home" && <HomePage game={game} me={me} go={setTab} fxStatus={fxStatus} onRefresh={() => pullFixtures(true)} />}
      {tab === "today" && <TodayPage game={game} me={me} go={setTab} />}
      {tab === "picks" && <PicksPage game={game} me={me} mutate={mutate} fxStatus={fxStatus} onRefresh={() => pullFixtures(true)} onPickCelebrate={celebratePick} isAdmin={isAdmin} />}
      {tab === "profile" && <ProfilePage game={game} me={me} mutate={mutate} />}
      {tab === "scores" && <LiveScoresPage game={game} onRefresh={() => pullFixtures(true)} />}
      {tab === "war" && <WarRoom game={game} me={me} mutate={mutate} onRefresh={() => pullFixtures(true)} />}
      {tab === "stats" && <StatsPage game={game} me={me} mutate={mutate} />}
      {tab === "underdog" && <UnderdogPage game={game} me={me} mutate={mutate} />}
      {tab === "final4" && <Final4Page game={game} me={me} mutate={mutate} onPickCelebrate={celebratePick} />}
      {tab === "goldenboot" && <GoldenBootPage game={game} me={me} mutate={mutate} />}
      {tab === "board" && <LeaderboardPage game={game} meId={meId} />}
      {tab === "shame" && <ShamePage game={game} me={me} mutate={mutate} />}
      {tab === "prizes" && <PrizesPage game={game} />}
      {tab === "admin" && <AdminPage game={game} mutate={mutate} isAdmin={isAdmin} setIsAdmin={setIsAdmin} fireConfetti={fireConfetti} onRefresh={() => pullFixtures(true)} fxStatus={fxStatus} />}
      </div>

      {visiblePages.length > 1 && (
        <div className="page-dots">
          {visiblePages.map((p, i) => (
            <span
              key={p}
              className={`page-dot ${i === pageIndex ? "active" : ""}`}
              style={{ "--dot-colour": currentSection.colour }}
              onClick={() => goToPage(p)}
            />
          ))}
        </div>
      )}

      <nav className="bottom-nav">
        {SECTIONS.map((s) => (
          <button key={s.key} className={`bottom-nav-tab ${currentSection.key === s.key ? "active" : ""}`} onClick={() => handleTabTap(s)}>
            <span className="tab-icon">{s.icon}</span>
            <span className="tab-label">{s.label}</span>
          </button>
        ))}
      </nav>

      {sectionPickerOpen && sectionPickerTarget && (
        <div className="section-picker-bg" onClick={() => setSectionPickerOpen(false)}>
          <div className="section-picker-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sp-grip" />
            <div className="sp-title" style={{ color: sectionPickerTarget.colour }}>
              {sectionPickerTarget.icon} {sectionPickerTarget.label}
            </div>
            <div className="sp-grid">
              {visiblePagesFor(sectionPickerTarget).map((pageKey) => (
                <button
                  key={pageKey}
                  className={`sp-tile ${tab === pageKey ? "active" : ""}`}
                  style={{ "--tile-colour": sectionPickerTarget.colour }}
                  onClick={() => handlePickerSelect(pageKey)}
                >
                  <span className="sp-tile-icon">{PAGE_ICONS[pageKey]}</span>
                  <span className="sp-tile-label">{PAGE_LABELS[pageKey]}</span>
                  {tab === pageKey && <span className="sp-tile-dot" />}
                </button>
              ))}
            </div>
            <button className="sp-cancel" onClick={() => setSectionPickerOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <span className="ver-badge">{APP_VERSION}</span>
    </div>
  );
}
