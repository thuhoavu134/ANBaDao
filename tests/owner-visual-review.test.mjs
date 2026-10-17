import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=()=>readFileSync(new URL('../src/runtime/owner-visual-review.js',import.meta.url),'utf8');
test('shield follows each recipient body, not fixed caster/world dimensions',()=>{
 const draws=[];const ctx={};const c={battleCharacterBody:u=>u.body,__hvPersistentPages:{draw(...a){draws.push(a);}},battleVfxMirror:u=>u.team==='enemy'};vm.createContext(c);vm.runInContext(source(),c);
 for(const height of [90,180])c.drawOwnerDinhShield(ctx,{team:'enemy',body:{centerX:700,centerY:500,height}},4);
 assert.equal(draws[0][3],700);assert.equal(draws[0][4],500);assert.equal(draws[1][6]/draws[0][6],2);assert.ok(draws[0][7].flip);assert.ok(draws[0][6]<130);
});
test('Dinh ultimate uses authored landscape dimensions and mirrors once',()=>{
 for(const enemy of [false,true]){const calls=[];const ctx={save(){},restore(){},translate(...a){calls.push(['translate',...a]);},scale(...a){calls.push(['scale',...a]);},drawImage(...a){calls.push(['draw',...a]);}};
 const c={PORTRAIT_FORMATION:{rows:[340,520,700]},WORLD:{width:1600},battleVfxMirror:()=>enemy};vm.createContext(c);vm.runInContext(source(),c);c.drawOwnerDinhUltimate(ctx,{},0,0,240,135,{});
 const d=calls.find(x=>x[0]==='draw');assert.equal(d[7],-135);assert.equal(d[9],270);assert.equal(d[8],480);assert.deepEqual(calls.find(x=>x[0]==='scale'),['scale',enemy?-1:1,1]);}
});

test('default VFX mirror follows team, explicit facing, and source orientation',async()=>{
 const {battleVfxMirror}=await import('../scripts/battle-vfx-direction-v1.mjs');
 assert.equal(battleVfxMirror({team:'player'}),false);
 assert.equal(battleVfxMirror({team:'enemy'}),true);
 assert.equal(battleVfxMirror({team:'enemy',visualFacing:'right'}),false);
 assert.equal(battleVfxMirror({team:'player',visualFacing:-1}),true);
 assert.equal(battleVfxMirror({team:'enemy'},-1),false);
});

