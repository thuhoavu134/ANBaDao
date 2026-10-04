import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';
import { rosterEnemy } from '../src/domain/combat/roster-enemies.mjs';
import { poseRegistration, patchRosterBattle } from '../scripts/roster-enemies-size-v1.mjs';
import { heroVisualScale } from '../scripts/battle-formation-scale-v1.mjs';

const roster={a:{name:'A',archetype:'ranger',skill:{name:'A attack'},ultimate:{name:'A ult'}},b:{name:'B',archetype:'guardian',skill:{name:'B attack'}}};
test('generated foes use roster identity and skills while encounter stats own difficulty',()=>{
 const old={id:'old_monster_2',name:'Old monster',row:'back',slot:4,huntForm:'crystal',stats:{hp:5000,atk:120,def:44,spd:90},skill:{name:'old'}};
 const foe=rosterEnemy(old,roster);
 assert.ok(roster[foe.sourceHeroId]);assert.equal(foe.skill,roster[foe.sourceHeroId].skill);
 assert.deepEqual(foe.stats,old.stats);assert.notEqual(foe.stats,old.stats);
 assert.equal(foe.row,'back');assert.equal(foe.slot,4);assert.equal(foe.huntForm,null);
 assert.deepEqual(rosterEnemy(old,roster),foe);assert.equal(old.huntForm,'crystal');
 assert.equal(rosterEnemy({sourceHeroId:'a'},roster).sourceHeroId,'a');
});
test('build registrations support fractional legacy cells and all poses match 310 standing pixels',async()=>{
 const image=await sharp({create:{width:14,height:9,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer();
 const raw=await sharp(image).raw().toBuffer();
 for(let c=0;c<4;c++)for(let y=1;y<4;y++)raw[(y*14+Math.ceil(c*3.5)+1)*4+3]=255;
 const bytes=await sharp(raw,{raw:{width:14,height:9,channels:4}}).png().toBuffer();
 const pack=await poseRegistration(bytes);assert.equal(pack.cellW,3.5);
 for(const pose of pack.poses)assert.equal(pose.body*310/pose.body,310);
});
test('renderer uses same registered roster row for both teams and duplicate roles',()=>{
 const stub='  function drawGeneratedHero(context, unit, time, progress) { old(); }\n  function drawUnit(context, unit, time) { if (unit && typeof honVietDrawHuntUnit === "function") { } }';
 const pack={cellW:100,cellH:120,poses:[{body:80,foot:100},{body:100,foot:110},{body:60,foot:100},{body:90,foot:115}]};
 const patched=patchRosterBattle(stub,{ranger:pack});assert.equal(patchRosterBattle(patched,{ranger:pack}),patched);
 const context={globalAlpha:1,save(){},restore(){},drawImage(...args){this.draws.push(args)},draws:[]};
 const sandbox={POSE_ATLASES:{ranger:{complete:true,naturalWidth:400}},Core:{clamp:(x,min,max)=>Math.max(min,Math.min(max,x))}};
 vm.createContext(sandbox);vm.runInContext(patched,sandbox);
 for(const team of ['player','enemy'])for(const slot of [0,1,5])for(const state of ['idle','run','attack','ultimate']){
  context.draws=[];sandbox.drawGeneratedHero(context,{archetype:'ranger',team,slot,state},0,.7);
  assert.ok(context.draws.length);for(const d of context.draws){assert.equal(d[2],0);const col=d[1]/100;assert.ok(Math.abs(d[8]*pack.poses[col].body/pack.poses[col].foot-310)<1e-9);assert.ok(Math.abs(d[6]+pack.poses[col].foot*310/pack.poses[col].body)<1e-9);}
 }
 assert.doesNotMatch(patched,/HERO_ATLASES|sameAppearanceBefore/);
});
test('authored standing bodies share roster height without changing frame clocks',()=>{
 assert.ok(Math.abs(heroVisualScale('luc_anh')*330*199/240-310)<1e-9);
 assert.ok(Math.abs(heroVisualScale('thay_mo')*348*250/264-310)<1e-9);
});
test('generated host scripts parse with roster mapping wired before combat and preparation',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.match(html,/if\(side==='foe'\)def=gameRosterEnemy\(def\)/);
 assert.match(html,/encounter\.map\(\(enemy,index\) => gameRosterEnemy\(enemy\)\)/);
 assert.match(html,/combatant\.rosterEnemy \? null : heroBattleProgression/);
 for(const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(script[1].trim()&&!script[0].includes('application/json'))new Function(script[1]);
});
