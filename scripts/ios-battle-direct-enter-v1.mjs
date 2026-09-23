import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(target, 'utf8');

const from = `    // Grok/iOS preview is itself an iframe; a nested battle iframe stays blank.
    // Open combat as the preview document so the player actually sees the fight.
    if (window.parent !== window) {
      window.name = \`hvBattleConfig:\${encodeURIComponent(serializedBattleConfig)}\`;
      location.assign(url);
      return;
    }`;

const to = `    // iPhone/iPad WebKit can stall the large battle document inside the host
    // iframe under six-hero memory pressure. Reuse the already-supported full-page
    // transport on constrained Apple mobile devices so combat no longer depends on
    // the iframe battle-ready handshake. Desktop keeps the iframe path.
    const __HV_IOS_DIRECT_BATTLE=(()=>{try{
      const n=navigator,ua=String(n?.userAgent||''),platform=String(n?.platform||''),touch=Number(n?.maxTouchPoints||0);
      return /iPad|iPhone|iPod/i.test(ua)||(platform==='MacIntel'&&touch>1);
    }catch(_){return false;}})();
    if (window.parent !== window || __HV_IOS_DIRECT_BATTLE) {
      window.name = \`hvBattleConfig:\${encodeURIComponent(serializedBattleConfig)}\`;
      location.assign(url);
      return;
    }`;

if (html.split(from).length !== 2) {
  throw new Error('iOS direct battle enter owner missing or ambiguous');
}
html = html.replace(from, to);
writeFileSync(target, html);
console.log('iOS/iPadOS battle enter uses full-page transport; desktop keeps iframe handshake');
