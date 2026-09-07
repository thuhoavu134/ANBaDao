import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');

const css = `<style id="hero-roster-phase-a-v4-css">
#hvHeroRosterV4{position:fixed;inset:0 0 74px;z-index:99999;background:linear-gradient(180deg,#bddce7 0 110px,#f7edd8 110px 100%);color:#2d251f;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;overflow:auto;-webkit-overflow-scrolling:touch}
#hvHeroRosterV4[hidden]{display:none!important}
#hvHeroRosterV4 .v4-top{position:relative;top:0;z-index:5;background:linear-gradient(180deg,rgba(188,220,231,.985),rgba(236,231,208,.985));border-bottom:1px solid #d7b883;box-shadow:0 2px 8px rgba(79,58,27,.14)}
#hvHeroRosterV4 .v4-profile{height:70px;display:grid;grid-template-columns:54px 1fr auto;gap:8px;align-items:center;padding:7px 10px}
#hvHeroRosterV4 .v4-avatar{width:52px;height:52px;border-radius:10px;background:linear-gradient(145deg,#4a6072,#1b222a);border:3px solid #e4b85d;color:#ffe9af;display:flex;align-items:center;justify-content:center;font-weight:1000;font-size:18px;box-shadow:0 2px 5px rgba(77,49,11,.28)}
#hvHeroRosterV4 .v4-name{font-size:15px;font-weight:950;line-height:1}.v4-sub{font-size:10px;color:#6d5941;margin-top:5px}.v4-total{font-size:17px;font-weight:1000;color:#d58a14;margin-top:2px}
#hvHeroRosterV4 .v4-res{display:grid;grid-template-columns:1fr 1fr;gap:5px}.v4-res span{min-width:58px;padding:5px 7px;border-radius:8px;background:rgba(66,109,121,.18);font-size:10px;font-weight:900;text-align:center}
#hvHeroRosterV4 .v4-tabs{height:40px;display:grid;grid-template-columns:repeat(5,1fr);gap:3px;padding:0 7px;align-items:end}
#hvHeroRosterV4 .v4-tab{height:33px;border:1px solid #b8844d;border-bottom:0;border-radius:7px 7px 0 0;background:linear-gradient(180deg,#956240,#75492f);color:#f5e1c5;font-size:9.5px;font-weight:900;display:flex;align-items:center;justify-content:center}
#hvHeroRosterV4 .v4-tab.active{height:39px;background:linear-gradient(180deg,#ffe8be,#f0c692);color:#9f5b35;box-shadow:inset 0 1px 0 #fff8e9}
#hvHeroRosterV4 .v4-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:8px 7px 58px}
#hvHeroRosterV4 .v4-card{position:relative;aspect-ratio:.68;border:3px solid #d88d17;border-radius:6px;background:linear-gradient(180deg,#fff7df,#f3c97d);box-shadow:0 2px 5px rgba(89,54,10,.25),inset 0 0 0 1px rgba(255,255,255,.8);overflow:hidden;padding:0;margin:0;color:inherit;min-width:0;touch-action:manipulation}
#hvHeroRosterV4 .v4-art{position:absolute;left:3px;right:3px;top:3px;bottom:31px;border-radius:4px;overflow:hidden;background:linear-gradient(180deg,#cde9df,#acd2c1);border:1px solid rgba(255,255,255,.9)}
#hvHeroRosterV4 .v4-art img{width:100%;height:100%;object-fit:contain;object-position:center bottom;display:block}
#hvHeroRosterV4 .v4-grade{position:absolute;left:2px;top:2px;z-index:3;min-width:24px;height:24px;padding:0 4px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#be2830;border:2px solid #ffe2a5;color:#fff6da;font-size:9.5px;font-weight:1000}
#hvHeroRosterV4 .v4-level{position:absolute;right:4px;top:3px;z-index:3;color:white;font-size:9px;font-weight:1000;text-shadow:0 1px 2px #000,0 0 2px #000}
#hvHeroRosterV4 .v4-element{position:absolute;left:4px;top:29px;z-index:3;width:21px;height:21px;border-radius:50%;background:rgba(255,255,255,.94);display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 1px 2px rgba(0,0,0,.2)}
#hvHeroRosterV4 .v4-power{position:absolute;left:50%;bottom:27px;transform:translateX(-50%);z-index:4;min-width:53px;padding:3px 6px;border-radius:12px;background:linear-gradient(180deg,#ffe38e,#efad2a);border:1px solid #b6740f;color:#3d2b13;font-size:8.5px;font-weight:1000;text-align:center;box-shadow:0 1px 3px rgba(72,42,0,.25)}
#hvHeroRosterV4 .v4-stars{position:absolute;left:2px;right:2px;bottom:15px;text-align:center;color:#ffd43d;font-size:9px;letter-spacing:-1px;text-shadow:0 1px 1px #8d5600;line-height:1}
#hvHeroRosterV4 .v4-cardname{position:absolute;left:3px;right:3px;bottom:3px;text-align:center;color:#2c241e;font-size:8px;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 0 #fff0cc;line-height:1.1}
#hvHeroRosterV4 .v4-filter{position:static;z-index:6;height:50px;display:flex;align-items:center;justify-content:center;gap:6px;background:rgba(248,237,212,.98);border-top:1px solid #d7b37b;box-shadow:0 -3px 10px rgba(72,49,20,.14)}
#hvHeroRosterV4 .v4-filter button{width:31px;height:31px;border-radius:50%;border:1px solid #cda45f;background:#fff6df;font-size:13px}.v4-filter button.active{outline:2px solid #df9f27;background:#f7d477}
</style>`;

const planSource = readFileSync(join(process.cwd(), 'src/domain/hero/roster-plan.mjs'), 'utf8').replace(/^export\s+/gm, '');
const moduleSource = planSource + '\n' + readFileSync(join(process.cwd(), 'src/domain/hero/roster-view.mjs'), 'utf8')
  .replace("import { summarizeRosterCapacity } from './roster-plan.mjs';", '')
  .replace(/^export\s+/gm, '');
const runtimeSource = readFileSync(join(process.cwd(), 'src/ui/hero-roster-runtime.js'), 'utf8');
const jsBody = '(()=>{\n' + moduleSource + '\n' + runtimeSource + '\n})();';
new Function(jsBody);
const cssState = `<style id="hero-roster-state-v1-css">
/* The roster is a body-level viewport, outside legacy screen paint layers.
   Only the card grid scrolls. Header and dock remain ordinary grid rows. */
body.hero-roster-active{overflow:hidden}
body.hero-roster-active .hv-brandbar,body.hero-roster-active #resbar{display:none!important}
body.hero-roster-active #heroesScreen{display:none!important}
#hvHeroRosterV4{position:fixed;inset:0;width:100%;height:100vh!important;height:100dvh!important;min-height:0!important;max-height:none!important;max-width:680px;margin:0 auto;z-index:99999;display:grid;grid-template-rows:auto minmax(0,1fr) auto;overflow:hidden;padding:env(safe-area-inset-top) 0 0;box-sizing:border-box;isolation:isolate;-webkit-overflow-scrolling:auto}
#hvHeroRosterV4 .v4-top{position:relative;top:auto;min-width:0}
#hvHeroRosterV4 .v4-tabs{grid-template-columns:1fr 1fr 1.4fr}
#hvHeroRosterV4 .v4-sort{font-size:11px;align-self:center;text-align:right}
#hvHeroRosterV4 select{max-width:104px;background:#fff4df;border:1px solid #b8844d;border-radius:5px;font:inherit;padding:5px}
#hvHeroRosterV4 .v4-filter{position:static;height:46px;gap:8px;box-shadow:none}
#hvHeroRosterV4 .v4-filter button{min-width:32px;min-height:34px;cursor:pointer}
#hvHeroRosterV4 .v4-grid{min-height:0;min-width:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:clamp(150px,39vw,258px);padding:10px 7px 16px;align-content:start}
#hvHeroRosterV4 .v4-card{aspect-ratio:auto;height:100%;cursor:pointer}
#hvHeroRosterV4 .v4-art{bottom:42px}
#hvHeroRosterV4 .v4-power{bottom:36px;font-size:10px}
#hvHeroRosterV4 .v4-stars{bottom:24px;font-size:12px}
#hvHeroRosterV4 .v4-cardname{bottom:5px;font-size:10px;line-height:1.2}
#hvHeroRosterV4 .v4-level{font-size:11px}
#hvHeroRosterV4 .v4-deployed{position:absolute;right:3px;top:30px;background:#216f5f;color:#fff6d8;font-size:8px;border-radius:3px;padding:2px 3px}
#hvHeroRosterV4 .is-locked .v4-art{filter:grayscale(1);opacity:.55}
#hvHeroRosterV4 .v4-empty{grid-column:1/-1;text-align:center;font-size:13px;padding:24px 12px}
#hvHeroRosterV4 .v4-dock{position:relative;bottom:auto;left:auto;transform:none;width:100%;display:grid;grid-template-columns:repeat(5,1fr);background:linear-gradient(180deg,#407e68,#113e36);padding:5px 4px calc(5px + env(safe-area-inset-bottom));box-sizing:border-box;z-index:6}
#hvHeroRosterV4 .v4-dock button{background:none;border:0;color:#eee7d0;font-size:10px;min-width:0;padding:0;display:grid;justify-items:center;cursor:pointer}
#hvHeroRosterV4 .v4-dock img{height:42px;width:48px;object-fit:contain}
#hvHeroRosterV4 .v4-dock [aria-current]{color:#ffe191;font-weight:900}
#hvHeroRosterV4 button:focus-visible,#hvHeroRosterV4 select:focus-visible{outline:3px solid #257c91;outline-offset:2px}
#heroDetailScreen button.back{background:transparent;border:0;color:inherit;font:inherit;font-size:30px;min-width:44px;min-height:44px;cursor:pointer}
</style>`;
const js = '<script id="hero-roster-state-v1-js">' + jsBody + '</script>';
html = html.replace('</head>', css + '\n' + cssState + '\n</head>');
const bodyEnd = html.lastIndexOf('</body>');
if (bodyEnd < 0) throw new Error('Roster shell body end missing');
html = html.slice(0, bodyEnd) + js + '\n' + html.slice(bodyEnd);
writeFileSync(p, html);
console.log('State-backed roster installed: official identities, live stats, one route owner');
