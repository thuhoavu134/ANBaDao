import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target=join(process.cwd(),'dist','battle.html');
let html=readFileSync(target,'utf8');

function replaceOne(source,from,to,label){
  if(source.split(from).length!==2)throw new Error('P0 battle entry missing/ambiguous '+label);
  return source.replace(from,()=>to);
}

html=replaceOne(
  html,
  '  const ctx = dom.canvas.getContext("2d", { alpha: false, desynchronized: true });',
  `  function __hvCreateBattleContext(canvas) {
    // Present the complete background + heroes + VFX together. A desynchronized
    // desktop canvas can expose the background before the heroes finish drawing.
    const attempts = [{ alpha: false }, null];
    for (const options of attempts) {
      try {
        const context = options ? canvas.getContext("2d", options) : canvas.getContext("2d");
        if (context) return context;
      } catch (error) {
        console.warn("Canvas 2D option rejected; retrying with a safer profile.", error);
      }
    }
    return null;
  }
  const ctx = __hvCreateBattleContext(dom.canvas);`,
  'WebKit-safe Canvas 2D startup'
);

html=replaceOne(
  html,
  `  function beginBattle() {
    initAudio();
    window.HonVietAudio?.unlock?.();
    window.HonVietSfx?.unlock?.();
`,
  `  function beginBattle() {
    if (state.mode === "battle" && dom.introPanel?.hidden) return;
    try {
      initAudio();
      window.HonVietAudio?.unlock?.();
      window.HonVietSfx?.unlock?.();
    } catch (error) {
      console.warn("Battle audio init skipped; combat continues.", error);
    }
`,
  'audio fail-open'
);

html=replaceOne(
  html,
  '    if (EMBED_CONFIG.autoStart || EMBEDDED) setTimeout(beginBattle, 250);',
  `    if (EMBED_CONFIG.autoStart || EMBEDDED) {
      const __hvAutoStartBattle=()=>{
        if (STATUS_ICON_QA) return;
        if (state.mode !== "intro" && dom.introPanel?.hidden) return;
        try { beginBattle(); }
        catch (error) { console.error("Battle autostart retry failed.", error); }
      };
      [50,400,1200,2500].forEach(delay=>setTimeout(__hvAutoStartBattle,delay));
    }`,
  'embedded autostart'
);

writeFileSync(target,html);
console.log('P0 battle entry: WebKit-safe canvas + deferred fail-open autostart installed');
