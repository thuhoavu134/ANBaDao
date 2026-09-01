import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'battle.html');
let s = readFileSync(p, 'utf8');

function optional(re,to,label){
  if(!re.test(s)){console.warn(`[Luc Anh local speed] skip ${label}`);return;}
  s=s.replace(re,to);
}

if(!s.includes('function lucAnhPlaybackRate(){')){
  const hook=/function lucAnhFrame\(key,elapsed,loop=false\)\{/;
  if(!hook.test(s)) throw new Error('Luc Anh local speed missing lucAnhFrame hook');
  s=s.replace(hook,`function lucAnhPlaybackRate(){const v=Number(state?.speed)||1;return v===2||v===3?v:1;}\n  function lucAnhDelayMs(ms){return Math.max(1,Math.round((Number(ms)||0)/lucAnhPlaybackRate()));}\n  function lucAnhFrame(key,elapsed,loop=false){`);
}

// Character animation: only Lục Ảnh elapsed time is scaled.
optional(
  /const meta=LUC_ANH_META\[key\],elapsed=key==="idle"\?time:Math\.max\(0,time-\(unit\.stateStarted\|\|time\)\),frame=lucAnhFrame\(key,elapsed,loop\);/,
  `const meta=LUC_ANH_META[key],rawElapsed=key==="idle"?time:Math.max(0,time-(unit.stateStarted||time)),elapsed=rawElapsed*lucAnhPlaybackRate(),frame=lucAnhFrame(key,elapsed,loop);`,
  'hero frame elapsed'
);

// VFX duration: shorten only Lục Ảnh VFX lifetime at x2/x3. The VFX renderer already maps
// elapsed/duration to the full authored frame count, so no frames are skipped from the source atlas.
optional(
  /function startLucAnhFx\(kind,actor,target=null,duration=1000\)\{lucAnhFx\.push\(\{kind,actorId:actor\?\.id,targetId:target\?\.id\|\|null,team:actor\?\.team,started:performance\.now\(\),duration\}\);\}/,
  `function startLucAnhFx(kind,actor,target=null,duration=1000){lucAnhFx.push({kind,actorId:actor?.id,targetId:target?.id||null,team:actor?.team,started:performance.now(),duration:lucAnhDelayMs(duration)});}`,
  'VFX duration'
);

// State lifetime follows the same local rate so attack/skill/ultimate does not snap back to idle
// before the authored animation reaches its final frame.
for(const key of ['attack','skill1','ultimate']){
  const re=new RegExp(`setUnitState\\(actor,"${key}",LUC_ANH_META\\.${key}\\.frames\\*LUC_ANH_META\\.${key}\\.ms\\)`,'g');
  if(re.test(s)) s=s.replace(re,`setUnitState(actor,"${key}",lucAnhDelayMs(LUC_ANH_META.${key}.frames*LUC_ANH_META.${key}.ms))`);
}

// Only replace waits inside the Lục Ảnh authored sequence. These are exact action-specific values,
// intentionally leaving every other hero and the core turn scheduler untouched.
const waits=[900,760,700,980,1050,260,1850,1650];
for(const ms of waits){
  const re=new RegExp(`sleepVisualMilliseconds\\(${ms},battleId\\)`,'g');
  if(re.test(s)) s=s.replace(re,`sleepVisualMilliseconds(lucAnhDelayMs(${ms}),battleId)`);
}

if(!s.includes('function lucAnhPlaybackRate(){')) throw new Error('Luc Anh local speed verification failed');
writeFileSync(p,s);
console.log('Luc Anh local x1/x2/x3 speed sync applied without global combat clock');
