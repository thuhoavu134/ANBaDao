import { readFileSync, writeFileSync } from 'node:fs';
import { createHeroVisibilityCache } from '../src/render/hero-visibility-cache.mjs';

export function patchBattleCharacterVisibility(input) {
  if (input.includes('/* HV_HERO_VISIBILITY_CACHE_V1 */')) return input;
  let html = input;
  const once = (from, to) => {
    if (html.split(from).length !== 2) throw new Error('Character visibility anchor: ' + from.slice(0, 100));
    html = html.replace(from, () => to);
  };
  once('  function drawUnit(context, unit, time) {', `/* HV_HERO_VISIBILITY_CACHE_V1 */
  const __hvHeroVisibility=(${createHeroVisibilityCache.toString()})({maxEntries:6});
  window.addEventListener('pagehide',()=>__hvHeroVisibility.clear(),{once:true});
  /* HV_HERO_VISIBILITY_CACHE_END */
  function drawUnit(context, unit, time) {`);
  for (const [hero, title] of [['linh-dong', 'LinhDong'], ['bach-dien', 'BachDien']]) {
    const start = html.indexOf('function draw' + title + 'Hero(');
    const end = html.indexOf('\nlet ', start);
    if (start < 0 || end < start) throw new Error('Missing hero renderer: ' + title);
    const source = html.slice(start, end);
    const result = source.replace('context.restore();return !!drawn;',
      `context.restore();return __hvHeroVisibility.finish(context,'${hero}',unit,time,drawn,draw${title}Hero,true);`);
    if (result === source) throw new Error('Missing paint result: ' + title);
    html = html.slice(0, start) + result + html.slice(end);
  }
  once('drawLucAnhAtlas(context,key,frame,0,0,lucAnhVisualSize,lucAnhVisualSize,{baseline:lucAnhBaseline});context.restore();return true;',
    "const drawn=drawLucAnhAtlas(context,key,frame,0,0,lucAnhVisualSize,lucAnhVisualSize,{baseline:lucAnhBaseline});context.restore();return __hvHeroVisibility.finish(context,'luc-anh',unit,time,drawn,drawLucAnhHero);");
  once('drawDinhLoiAtlasFrame(context,DINH_LOI_IMAGES[key],frame,0,0,620,348,{baseline:42});context.restore();return true;',
    "const drawn=drawDinhLoiAtlasFrame(context,DINH_LOI_IMAGES[key],frame,0,0,620,348,{baseline:42});context.restore();return __hvHeroVisibility.finish(context,'dinh-loi',unit,time,drawn,drawDinhLoiHero);");
  // A cold authored slot must never fall through to another hero's generic art.
  once('drawBachDienHero(context,unit,time) || drawThayMoAuthoredHero(context,unit,time)',
    'drawBachDienHero(context,unit,time) || isLinhDong(unit) || isBachDien(unit) || isLucAnh(unit) || isDinhLoi(unit) || drawThayMoAuthoredHero(context,unit,time)');
  return html;
}

if (process.argv[1]?.endsWith('battle-character-visibility-v1.mjs')) {
  const path = 'dist/battle.html';
  writeFileSync(path, patchBattleCharacterVisibility(readFileSync(path, 'utf8')));
}

