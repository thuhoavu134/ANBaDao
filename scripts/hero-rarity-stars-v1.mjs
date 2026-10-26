import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const MARK = '/* HERO_RARITY_STARS_V1 */';
export function patchHeroRarityStars(html, domain) {
  if (html.includes(MARK)) return html;
  const once = (anchor, replacement) => {
    if (html.split(anchor).length !== 2) throw new Error('RARITY_STARS_ANCHOR: ' + anchor);
    html = html.replace(anchor, () => replacement);
  };
  once('const SAVE_KEY="mong_gioi_save_v1";', MARK + '\n' + domain.replace(/^export\s+/gm, '') + '\nconst SAVE_KEY="mong_gioi_save_v1";');
  once('const heroes={}; for(const id in DATA.heroes) heroes[id]={owned:false,level:1,stars:1};',
    'const heroes={}; for(const id in DATA.heroes) heroes[id]={owned:false,level:1,...initialHeroStars(DATA.heroes[id])};');
  once('for(const id in DATA.heroes) if(!p.heroes[id]) p.heroes[id]={owned:false,level:1,stars:1};',
    'for(const id in DATA.heroes) if(!p.heroes[id]) p.heroes[id]={owned:false,level:1,...initialHeroStars(DATA.heroes[id])};');
  once('  p.squad=normalizeSquad(p.squad,p,true);\n  return p; }',
    '  normalizeRarityStars(p,DATA.heroes);\n  p.squad=normalizeSquad(p.squad,p,true);\n  return p; }');
  once('function persist(){', 'function persist(){\n  normalizeRarityStars(P,DATA.heroes);');
  once('function heroStars(id){ return (P.heroes[id]&&P.heroes[id].stars)||1; }',
    'function heroStars(id){ return Math.max(rarityBaseStars(DATA.heroes[id]), (P.heroes[id]&&P.heroes[id].stars)||1); }');
  once('shards:10*S2*(S2-1)', 'shards:refundableHeroStarShards(P.heroes[id],DATA.heroes[id])');
  once('hh.level=1; hh.stars=1;', 'hh.level=1; hh.stars=rarityBaseStars(DATA.heroes[id]); if(hh.rarityStarsVersion===1)hh.legacyStarRefund=0;');
  once('P.heroes[id].stars++; persist(); return {ok:true};', 'P.heroes[id].stars=heroStars(id)+1; persist(); return {ok:true};');
  // The reward ceremony previously read the nonexistent singular .star field.
  once("'★'.repeat(P.heroes[id]?.star||1)", "'★'.repeat(heroStars(id))");
  return html;
}
export function installHeroRarityStars(root) {
  const path = join(root, 'dist/index.html');
  const domain = readFileSync(join(root, 'src/domain/hero/rarity-stars.mjs'), 'utf8');
  writeFileSync(path, patchHeroRarityStars(readFileSync(path, 'utf8'), domain));
}
