import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const lore=readFileSync('src/ui/lore-luc-than-runtime.js','utf8');
const a=lore.indexOf('  const SEAL_STAGES'),b=lore.indexOf('  function pickShardHero',a);
function campaign(templates){const DATA={encounters:{fallback:[{id:'fallback',stats:{hp:500,atk:90,def:40}}],luyen_tap:[{id:'train',stats:{hp:500,atk:90,def:40}}]},heroes:{}};templates.forEach((v,i)=>DATA.encounters['t'+i]=v);const c=vm.createContext({DATA,CHAPTERS:Array(6),window:{},chapterBattleSequence:()=>templates.map((_,i)=>'t'+i)});vm.runInContext(lore.slice(a,b),c);c.expandSeals();return c;}
const wave=(hp,atk)=>[{id:'unit',stats:{hp,atk,def:40,spd:90},row:'front'}];
test('all six chapters reserve the boss template for stages 6, 12, 18',()=>{
 const c=campaign([wave(560,96),wave(5200,150)]);
 for(let ch=0;ch<6;ch++){const ids=c.chapterBattleSequence(ch);assert.equal(ids.length,18);for(let s=0;s<18;s++){const boss=(s+1)%6===0,m=1+ch*.22+s*.05;assert.equal(c.DATA.encounters[ids[s]][0].stats.hp,Math.round((boss?5200:560)*m),`chapter ${ch+1} stage ${s+1}`);}}
});
test('multiple regular waves retain variety without inserting the final boss',()=>{
 const c=campaign([wave(560,96),wave(880,128),wave(9500,225)]),ids=c.chapterBattleSequence(1);
 const normal=new Set();ids.forEach((id,s)=>{if((s+1)%6!==0){const hp=c.DATA.encounters[id][0].stats.hp;assert.ok(hp<9500);normal.add(Math.round(hp/(1+.22+s*.05)));}});assert.ok(normal.has(560));assert.ok(normal.has(880));
});
test('single-template and missing-template chapters remain playable and generation stays stable',()=>{
 for(const templates of [[wave(600,100)],[]]){const c=campaign(templates),ids=c.chapterBattleSequence(0);assert.equal(ids.length,18);assert.ok(ids.every(id=>c.DATA.encounters[id].length));const before=JSON.stringify(c.DATA.encounters);c.chapterBattleSequence(0);assert.equal(JSON.stringify(c.DATA.encounters),before);}
});
test('dynamic mirror boss resolves current squad before generating boss checkpoints',()=>{let calls=0;const c=campaign([wave(560,96),()=>{calls++;return wave(4200,190);}]);const ids=c.chapterBattleSequence(4);assert.equal(calls,1);for(const stage of [5,11,17])assert.equal(c.DATA.encounters[ids[stage]][0].stats.hp,Math.round(4200*(1+4*.22+stage*.05)));assert.ok(c.DATA.encounters[ids[0]][0].stats.hp<4200);c.chapterBattleSequence(4);assert.equal(calls,1);});
