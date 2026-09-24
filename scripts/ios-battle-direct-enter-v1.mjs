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

const to = `    // Keep iPhone/iPad combat in the host document so its unlocked audio context survives.
    // Only a nested preview uses full-page transport because another iframe stays blank.
    const __HV_IOS_DIRECT_BATTLE=(()=>{try{
      const n=navigator,ua=String(n?.userAgent||''),platform=String(n?.platform||''),touch=Number(n?.maxTouchPoints||0);
      return /iPad|iPhone|iPod/i.test(ua)||(platform==='MacIntel'&&touch>1);
    }catch(_){return false;}})();
    if (window.parent !== window) {
      window.name = \`hvBattleConfig:\${encodeURIComponent(serializedBattleConfig)}\`;
      location.assign(url);
      return;
    }`;

if (html.split(from).length !== 2) {
  throw new Error('iOS direct battle enter owner missing or ambiguous');
}
html = html.replace(from, to);

const watchdogFrom = `      activeBattle.loadWatchdog = setTimeout(() => {
        if (!activeBattle || activeBattle.sessionId !== sessionId || loading.hidden) return;
        loading.firstChild.textContent = "Chiến trường đang khởi tạo — vui lòng chờ thêm…";
      }, 12000);`;
const watchdogTo = [
  "      activeBattle.loadWatchdog = setTimeout(() => {",
  "        if (!activeBattle || activeBattle.sessionId !== sessionId || loading.hidden) return;",
  "        if (__HV_IOS_DIRECT_BATTLE) {",
  "          try {",
  "            window.name = `hvBattleConfig:${encodeURIComponent(serializedBattleConfig)}`;",
  "            location.assign(url);",
  "            return;",
  "          } catch (_) {}",
  "        }",
  "        loading.firstChild.textContent = \"Chiến trường đang khởi tạo — vui lòng chờ thêm…\";",
  "      }, 12000);"
].join("\n");
if (html.split(watchdogFrom).length !== 2) {
  throw new Error('iOS direct battle fallback watchdog owner missing or ambiguous');
}
html = html.replace(watchdogFrom, watchdogTo);
writeFileSync(target, html);
console.log('iOS battle stays in host frame for continuous audio; delayed direct fallback protects stalled entry');
