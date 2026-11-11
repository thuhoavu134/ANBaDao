// QA qaUlti=1 (owner 11/11): boss co clip VFX luon tung tuyet ky de xem VFX.
// Chay SAU cac patch khac (auto-skill-cadence, ai-progress) vi chung neo vao cung dong decideAi.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
export function installHvQaUltiFinal(root) {
  const file = join(root, 'dist/battle.html');
  let html = readFileSync(file, 'utf8');
  // battle-ai-progress boc decideAi: "const intent=__hvResolveAiIntent(actor,decideAi(actor),{"
  const anchor = 'decideAi(actor),{';
  if (!html.includes(anchor)) throw new Error('hv-qa-ulti: decideAi anchor missing');
  const inject = '__hvQaUltiIntent(actor,decideAi(actor)),{';
  const helper = 'function __hvQaUltiIntent(actor,intent){ try { let __qf = window.__HVQaFlags; if (!__qf) { const __s = [location.search]; try { __s.push(sessionStorage.getItem("hvQaQuery") || ""); } catch (e) {} try { __s.push(window.parent.location.search); } catch (e) {} const __j = __s.join("&"); __qf = window.__HVQaFlags = { boss: /qaBoss=/.test(__j), ulti: /qaUlti=1/.test(__j) && /qaBoss=/.test(__j), god: /qaGod=1/.test(__j) && /qaBoss=/.test(__j) }; } if (intent && __qf && __qf.ulti && actor && actor.team !== TEAM_PLAYER && typeof honVietHuntSkipFx === "function" && honVietHuntSkipFx(actor)) { actor.energy = Math.max(100, Number(actor.energy) || 0); intent.action = "ultimate"; } } catch (e) {} return intent; }\n  ';
  html = html.split(anchor).join(inject);
  const fnAnchor = 'function decideAi(actor){';
  if (!html.includes(fnAnchor)) throw new Error('hv-qa-ulti: decideAi fn missing');
  html = html.replace(fnAnchor, helper + fnAnchor);
  writeFileSync(file, html);
  console.log('hv-qa-ulti: installed');
}
