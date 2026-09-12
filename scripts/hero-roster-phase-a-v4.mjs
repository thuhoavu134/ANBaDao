import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');

const css = `<style id="hero-roster-phase-a-v4-css">
#hvHeroRosterV4{position:fixed;inset:0;z-index:99999;display:none;flex-direction:column;background:linear-gradient(180deg,#bddce7 0 110px,#f7edd8 110px 100%);color:#2d251f;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;overflow:auto;-webkit-overflow-scrolling:touch;padding:env(safe-area-inset-top) 0 0;box-sizing:border-box}
#hvHeroRosterV4.is-open{display:flex}
#hvHeroRosterV4[hidden]{display:none!important}
#hvHeroRosterV4 .v4-top{position:relative;top:0;z-index:5;flex:0 0 auto;background:linear-gradient(180deg,rgba(188,220,231,.985),rgba(236,231,208,.985));border-bottom:1px solid #d7b883;box-shadow:0 2px 8px rgba(79,58,27,.14)}
#hvHeroRosterV4 .v4-profile{height:70px;display:grid;grid-template-columns:54px 1fr auto;gap:8px;align-items:center;padding:7px 10px}
#hvHeroRosterV4 .v4-avatar{width:52px;height:52px;border-radius:10px;background:linear-gradient(145deg,#4a6072,#1b222a);border:3px solid #e4b85d;color:#ffe9af;display:flex;align-items:center;justify-content:center;font-weight:1000;font-size:18px;box-shadow:0 2px 5px rgba(77,49,11,.28)}
#hvHeroRosterV4 .v4-name{font-size:15px;font-weight:950;line-height:1}.v4-sub{font-size:10px;color:#6d5941;margin-top:5px}.v4-total{font-size:17px;font-weight:1000;color:#d58a14;margin-top:2px}
#hvHeroRosterV4 .v4-res{display:grid;grid-template-columns:1fr 1fr;gap:5px}.v4-res span{min-width:58px;padding:5px 7px;border-radius:8px;background:rgba(66,109,121,.18);font-size:10px;font-weight:900;text-align:center}
#hvHeroRosterV4 .v4-tabs{height:40px;display:grid;grid-template-columns:repeat(5,1fr);gap:3px;padding:0 7px;align-items:end}
#hvHeroRosterV4 .v4-tab{height:33px;border:1px solid #b8844d;border-bottom:0;border-radius:7px 7px 0 0;background:linear-gradient(180deg,#956240,#75492f);color:#f5e1c5;font-size:9.5px;font-weight:900;display:flex;align-items:center;justify-content:center}
#hvHeroRosterV4 .v4-tab.active{height:39px;background:linear-gradient(180deg,#ffe8be,#f0c692);color:#9f5b35;box-shadow:inset 0 1px 0 #fff8e9}
#hvHeroRosterV4 .v4-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:8px 7px 16px;flex:1 1 auto;min-height:420px;min-width:0}
#hvHeroRosterV4 .v4-card{position:relative;aspect-ratio:.68;min-height:150px;border:2px solid #e8c56a;border-radius:10px;background:#c9a050;box-shadow:0 0 0 2px #7a4a14,inset 0 0 0 2px #fff4d0,0 4px 10px rgba(70,40,8,.3);overflow:hidden;padding:0;margin:0;color:inherit;min-width:0;touch-action:manipulation}
#hvHeroRosterV4 .v4-art{position:absolute;left:3px;right:3px;top:3px;bottom:3px;border-radius:7px;overflow:hidden;background:linear-gradient(180deg,#cde9df,#acd2c1);border:0}
#hvHeroRosterV4 .v4-art img{width:168%;max-width:none;height:130%;object-fit:cover;object-position:50% 8%;margin-left:-34%;margin-top:-2%;display:block}
#hvHeroRosterV4 .v4-grade{position:absolute;left:2px;top:2px;z-index:5;width:34px;height:34px;padding:0;border:0;background:none;box-shadow:none;display:block}
#hvHeroRosterV4 .v4-grade img{width:34px;height:34px;object-fit:contain;display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))}
#hvHeroRosterV4 .v4-card.r-splus .v4-grade,#hvHeroRosterV4 .v4-card.r-s .v4-grade,#hvHeroRosterV4 .v4-card.r-a .v4-grade,#hvHeroRosterV4 .v4-card.r-b .v4-grade{background:none}
#hvHeroRosterV4 .v4-level{position:absolute;right:6px;top:5px;z-index:5;color:#fff;font-size:10px;font-weight:1000;text-shadow:0 1px 3px #000,0 0 4px #000}
#hvHeroRosterV4 .v4-veil{position:absolute;left:3px;right:3px;bottom:3px;z-index:4;height:44%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 4px 7px;pointer-events:none;background:linear-gradient(180deg,rgba(255,240,210,0) 0%,rgba(255,228,176,.38) 32%,rgba(242,198,112,.78) 70%,rgba(230,176,78,.95) 100%)}
#hvHeroRosterV4 .v4-element{position:static;width:14px;height:14px;margin:0 0 1px;border-radius:50%;background:rgba(255,255,255,.88);display:flex;align-items:center;justify-content:center;font-size:8px;box-shadow:0 1px 2px rgba(0,0,0,.18)}
#hvHeroRosterV4 .v4-power,#hvHeroRosterV4 .v4-deployed{display:none}
#hvHeroRosterV4 .v4-stars{position:static;text-align:center;color:#ffd24a;font-size:10px;letter-spacing:0;line-height:1;text-shadow:0 1px 1px #8d5600}
#hvHeroRosterV4 .v4-stars i{font-style:normal;opacity:.28}
#hvHeroRosterV4 .v4-stars i.on{opacity:1}
#hvHeroRosterV4 .v4-cardname{position:static;text-align:center;color:#3a2414;font-size:10px;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 0 #fff0cc;line-height:1.15;max-width:100%}
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
/* Body overlay like #hvGearRoot. Overflow auto so iOS cannot clip the 12 cards. */
body.hero-roster-active{overflow:hidden}
body.hero-roster-active .hv-brandbar,body.hero-roster-active #resbar{display:none!important}
body.hero-roster-active #heroesScreen:before,body.hero-roster-active #heroesScreen:after{display:none!important}
#hvHeroRosterV4.is-open{display:flex}
#hvHeroRosterV4 .v4-top{position:relative;top:auto;min-width:0;flex:0 0 auto}
#hvHeroRosterV4 .v4-tabs{grid-template-columns:1fr 1fr 1.4fr}
#hvHeroRosterV4 .v4-sort{font-size:11px;align-self:center;text-align:right}
#hvHeroRosterV4 select{max-width:104px;background:#fff4df;border:1px solid #b8844d;border-radius:5px;font:inherit;padding:5px}
#hvHeroRosterV4 .v4-filter{position:static;height:46px;gap:8px;box-shadow:none}
#hvHeroRosterV4 .v4-filter button{min-width:32px;min-height:34px;cursor:pointer}
#hvHeroRosterV4 .v4-grid{flex:1 1 auto;min-height:420px;min-width:0;overflow:visible;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:minmax(150px,auto);padding:10px 7px 16px;align-content:start}
#hvHeroRosterV4 .v4-card{aspect-ratio:.68;min-height:150px;height:auto;cursor:pointer}
#hvHeroRosterV4 .v4-art{bottom:3px}
#hvHeroRosterV4 .v4-level{font-size:11px}
#hvHeroRosterV4 .is-locked .v4-art{filter:grayscale(1);opacity:.55}
#hvHeroRosterV4 .v4-empty{grid-column:1/-1;text-align:center;font-size:13px;padding:24px 12px}
#hvHeroRosterV4 .v4-dock{position:relative;bottom:auto;left:auto;transform:none;width:100%;flex:0 0 auto;display:grid;grid-template-columns:repeat(5,1fr);background:linear-gradient(180deg,#407e68,#113e36);padding:5px 4px calc(5px + env(safe-area-inset-bottom));box-sizing:border-box;z-index:6}
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
