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

optional(
  /const meta=LUC_ANH_META\[key\],elapsed=key==="idle"\?time:Math\.max\(0,time-\(unit\.stateStarted\|\|time\)\),frame=lucAnhFrame\(key,elapsed,loop\);/,
  `const meta=LUC_ANH_META[key],rawElapsed=key==="idle"?time:Math.max(0,time-(unit.stateStarted||time)),elapsed=rawElapsed*lucAnhPlaybackRate(),frame=lucAnhFrame(key,elapsed,loop);`,
  'hero frame elapsed'
);

optional(
  /function startLucAnhFx\(kind,actor,target=null,duration=1000\)\{lucAnhFx\.push\(\{kind,actorId:actor\?\.id,targetId:target\?\.id\|\|null,team:actor\?\.team,started:performance\.now\(\),duration\}\);\}/,
  `function startLucAnhFx(kind,actor,target=null,duration=1000){lucAnhFx.push({kind,actorId:actor?.id,targetId:target?.id||null,team:actor?.team,started:performance.now(),duration:lucAnhDelayMs(duration)});}`,
  'VFX duration'
);

const start=s.indexOf('    if(usesLucAnh){');
if(start<0) throw new Error('Luc Anh local speed missing usesLucAnh action block');

// Stable boundary in the current runtime: after the entire authored Lục Ảnh branch,
// normal shared impact resolution resumes at this exact statement.
const endMarkers=[
  '\n    dom.phaseLabel.textContent = "Va chạm";',
  '\n    dom.phaseLabel.textContent="Va chạm";',
  '\n    actor.slotComboReady='
];
let end=-1;
for(const marker of endMarkers){
  const i=s.indexOf(marker,start);
  if(i>=0&&(end<0||i<end)) end=i;
}
if(end<0) throw new Error('Luc Anh local speed missing stable action block boundary');
let block=s.slice(start,end);

for(const key of ['attack','skill1','ultimate']){
  const re=new RegExp(`setUnitState\\(actor,"${key}",LUC_ANH_META\\.${key}\\.frames\\*LUC_ANH_META\\.${key}\\.ms\\)`,'g');
  block=block.replace(re,`setUnitState(actor,"${key}",lucAnhDelayMs(LUC_ANH_META.${key}.frames*LUC_ANH_META.${key}.ms))`);
}

const replacements=[
  [/sleepVisualMilliseconds\((?:lucAnhDelayMs\()?900\)?,battleId\)/g,'sleepVisualMilliseconds(lucAnhDelayMs(LUC_ANH_SPATIAL.timing.basic.castDelay),battleId)'],
  [/startLucAnhFx\("basicProjectile",actor,target,(?:lucAnhDelayMs\()?760\)?\)/g,'startLucAnhFx("basicProjectile",actor,target,LUC_ANH_SPATIAL.timing.basic.projectileTravel)'],
  [/sleepVisualMilliseconds\((?:lucAnhDelayMs\()?760\)?,battleId\)/g,'sleepVisualMilliseconds(lucAnhDelayMs(LUC_ANH_SPATIAL.timing.basic.projectileTravel),battleId)'],
  [/startLucAnhFx\("basicImpact",actor,target,(?:lucAnhDelayMs\()?720\)?\)/g,'startLucAnhFx("basicImpact",actor,target,LUC_ANH_SPATIAL.timing.basic.impactVfxDuration)'],
  [/startLucAnhFx\("skill1Vfx",actor,null,(?:lucAnhDelayMs\()?1650\)?\)/g,'startLucAnhFx("skill1Vfx",actor,null,LUC_ANH_SPATIAL.timing.skill1.vfxDuration)'],
  [/sleepVisualMilliseconds\((?:lucAnhDelayMs\()?700\)?,battleId\)/g,'sleepVisualMilliseconds(lucAnhDelayMs(LUC_ANH_SPATIAL.timing.skill1.settleDelay),battleId)'],
  [/sleepVisualMilliseconds\((?:lucAnhDelayMs\()?260\)?,battleId\)/g,'sleepVisualMilliseconds(lucAnhDelayMs(LUC_ANH_SPATIAL.timing.ultimate.voiceLead),battleId)'],
  [/startLucAnhFx\("ultimateVfx",actor,null,(?:lucAnhDelayMs\()?3200\)?\)/g,'startLucAnhFx("ultimateVfx",actor,null,LUC_ANH_SPATIAL.timing.ultimate.vfxDuration)'],
  [/sleepVisualMilliseconds\((?:lucAnhDelayMs\()?1850\)?,battleId\)/g,'sleepVisualMilliseconds(lucAnhDelayMs(LUC_ANH_SPATIAL.timing.ultimate.impactHold),battleId)']
];
for(const [re,to] of replacements) block=block.replace(re,to);

block=block.replace(/sleepVisualMilliseconds\((?:lucAnhDelayMs\()?980\)?,battleId\)/g,'sleepVisualMilliseconds(lucAnhDelayMs(980),battleId)');
block=block.replace(/sleepVisualMilliseconds\((?:lucAnhDelayMs\()?1050\)?,battleId\)/g,'sleepVisualMilliseconds(lucAnhDelayMs(1050),battleId)');

s=s.slice(0,start)+block+s.slice(end);

if(!s.includes('function lucAnhPlaybackRate(){')) throw new Error('Luc Anh local speed verification failed');
if(!block.includes('LUC_ANH_SPATIAL.timing')) throw new Error('Luc Anh local speed timing metadata was not wired');
writeFileSync(p,s);
console.log('Luc Anh local x1/x2/x3 + authored timing metadata applied with stable block boundary');
