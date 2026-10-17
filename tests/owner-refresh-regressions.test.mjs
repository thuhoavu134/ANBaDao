import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import * as owner from '../scripts/owner-refresh-20261018.mjs';
const runtime=()=>readFileSync(new URL('../src/runtime/owner-visual-review.js',import.meta.url),'utf8');
test('protect selects a living teammate even when caster is weakest; solo falls back to caster',()=>{
 const c={Core:{lowestHealth:xs=>xs.slice().sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]}};vm.createContext(c);vm.runInContext(runtime(),c);
 const actor={id:'d',team:'player',hp:1,maxHp:100},ally={id:'a',team:'player',hp:50,maxHp:100},dead={id:'z',team:'player',hp:0,maxHp:100};
 assert.equal(c.ownerDinhProtectedAlly(actor,actor,[actor,dead,ally]),ally);
 assert.equal(c.ownerDinhProtectedAlly(actor,null,[actor]),actor);
});
test('ultimate keeps landscape pixels instead of reducing them into a portrait cell',()=>{
 for(const p of owner.makeReplacementPlan().filter(p=>p.source==='dinh-fx-vfx-ultimate'))assert.deepEqual([p.w,p.h],[480,270]);
});
test('continuous ATK phases use the same transform, no second moving trajectory',()=>{
 const calls=[];const ctx={save(){},restore(){},translate(...x){calls.push(['pos',...x]);},scale(){},drawImage(...x){calls.push(['draw',...x]);}};
 const c={battleVfxMirror:()=>false,battleCharacterBody:u=>({centerX:u.x,centerY:u.y})};vm.createContext(c);vm.runInContext(runtime(),c);
 const actor={x:100,y:200},target={x:600,y:300},image={complete:true,naturalWidth:3840,naturalHeight:2160};
 c.drawOwnerDinhAttack(ctx,image,20,actor,target);c.drawOwnerDinhAttack(ctx,image,0,actor,target);
 assert.deepEqual(calls[0],calls[2]);assert.deepEqual(calls[1].slice(-4),calls[3].slice(-4));
});
test('new bytes get a new immutable URL in both host audio and battle image consumers',()=>{
 const root=mkdtempSync(join(tmpdir(),'owner-cache-'));mkdirSync(join(root,'dist/assets/characters/thay-mo'),{recursive:true});mkdirSync(join(root,'dist/assets/audio/sfx/thay-mo'),{recursive:true});
 const img='assets/characters/thay-mo/ultimate-vfx-v3212-atlas.png',snd='assets/audio/sfx/thay-mo/ultimate.m4a';
 writeFileSync(join(root,'dist',img),'new-art');writeFileSync(join(root,'dist',snd),'new-audio');
 for(const file of ['index.html','battle.html'])writeFileSync(join(root,'dist',file),`${img} thay-mo/ultimate.m4a`);
 const map=owner.fingerprintOwnerAssets(root,[img,snd]);
 assert.notEqual(map[img],img);assert.ok(existsSync(join(root,'dist',map[img])));
 for(const f of ['index.html','battle.html']){const s=readFileSync(join(root,'dist',f),'utf8');assert.ok(s.includes(map[img]));assert.ok(s.includes(map[snd].replace('assets/audio/sfx/','')));}
});
test('new ultimate SFX routes all production Thay Mo aliases and Dinh actions',()=>{
 const c={};vm.createContext(c);vm.runInContext(runtime(),c);
 for(const id of ['thay_mo','thay-mo','hero_thay_mo'])assert.equal(c.ownerRefreshSoundEvent({sourceId:id},'ultimate'),'thay-mo-ultimate');
 for(const [a,e] of [['basic','atk'],['skill','skill'],['ultimate','ultimate']])assert.equal(c.ownerRefreshSoundEvent({sourceId:'dinh_loi'},a),'dinh-loi-'+e);
 assert.equal(c.ownerRefreshSoundEvent({sourceId:'linh_dong'},'ultimate'),null);
});
test('real legacy resolver gives skill guard to caster plus teammate, ultimate to all living friends',()=>{
 const battle=readFileSync(new URL('../battle.html',import.meta.url),'utf8');
 const start=battle.indexOf('  function resolveAction(actor, action, target) {');
 const end=battle.indexOf('\n  function ',start+5);
 const resolver=battle.slice(start,end).replace('const protectedAlly=target&&target.team===actor.team?target:Core.lowestHealth(friends)||actor;','const protectedAlly=ownerDinhProtectedAlly(actor,target,friends);');
 for(const team of ['player','enemy'])for(const action of ['skill','ultimate']){
  const a={id:'d',name:'d',sourceId:'dinh_loi',team,hp:1,maxHp:100,shield:0,statuses:[],ultimateMultiplier:1,skillMultiplier:1};
  const friend={id:'f',name:'f',team,hp:50,maxHp:100,shield:0,statuses:[]},dead={id:'dead',team,hp:0,maxHp:100,shield:0,statuses:[]};const roster=[a,friend,dead];
  const c={state:{resolvedActionIds:new Set()},TEAM_PLAYER:'player',TEAM_ENEMY:'enemy',DINH_LOI_ID:'dinh_loi',Core:{skillLevelMultiplier:()=>1,lowestHealth:xs=>xs.sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]},living:t=>roster.filter(u=>u.team===t&&u.hp>0),actionKind:()=> 'guard',isVersionedBasic:()=>false,isVersionedSkillKit:()=>false,isOngPhoCarry:()=>false,isLucAnh:()=>false,isLinhDong:()=>false,isDinhLoi:()=>true,addStatus:(u,s)=>u.statuses.push(s),addFloater(){},addLog(){},applyDamage(){throw Error('no enemies in fixture');}};
  vm.createContext(c);vm.runInContext(runtime()+'\n'+resolver,c);c.resolveAction(a,action,a);
  assert.equal(a.shield,action==='skill'?20:28);assert.equal(friend.shield,a.shield);assert.equal(dead.shield,0);
  assert.equal(friend.statuses[0].sourceHeroId,'dinh_loi');
 }
});
