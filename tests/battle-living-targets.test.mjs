import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html=readFileSync('dist/battle.html','utf8');
function section(start,end){const a=html.indexOf(start),b=html.indexOf(end,a);assert.ok(a>=0&&b>a,start);return html.slice(a,b);}
function fxHarness(team='player'){
 const actor={id:'actor',team,hp:100,x:10,y:20};
 const foes=Array.from({length:6},(_,slot)=>({id:'foe'+slot,team:team==='player'?'enemy':'player',hp:100,slot,x:100+slot*20,y:200+slot*10}));
 const env={TEAM_PLAYER:'player',TEAM_ENEMY:'enemy',WORLD:{width:1600,height:870},LUC_ANH_META:{skill1Vfx:{frames:10,ms:100},ultimateVfx:{frames:10,ms:100}},LUC_ANH_SPATIAL:{vfxScale:{skill1Vfx:1}},units:[actor,...foes],lucAnhFx:[],getUnit:id=>env.units.find(u=>u.id===id),lucAnhFrame:()=>0,lucAnhAnchor:u=>({x:u.x,y:u.y}),drawLucAnhAtlas:(...args)=>draws.push(args),draws:[]};
 const draws=env.draws;const c=vm.createContext(env);const mirror=section('function battleVfxMirror(actor,sourceFacing=1){','  // Geometry is in world coordinates');const source=section('  function drawLucAnhFx(context,time){','    return true;});}')+'    return true;});}';vm.runInContext(mirror+'\n'+source,c);
 const context={save(){},restore(){}};
 return {c,foes,draws,paint(kind,time=100){c.lucAnhFx=[{kind,actorId:'actor',started:0,duration:1000}];c.drawLucAnhFx(context,time);},tick(time){c.drawLucAnhFx(context,time);}};
}
for(const team of ['player','enemy'])test(`${team}: six-target VFX excludes dead slots and updates after another target dies`,()=>{
 const h=fxHarness(team);h.foes[1].hp=0;h.foes[4].hp=0;h.paint('skill1Vfx');assert.equal(h.draws.length,4);
 assert.deepEqual(h.draws.map(d=>d[3]),[100,140,160,200]);h.draws.length=0;h.foes[2].hp=0;h.tick(200);assert.equal(h.draws.length,3);
});
test('area VFX anchors to a living target, stays stable on death, stops when nobody remains',()=>{
 const h=fxHarness();h.foes[1].hp=0;h.paint('ultimateVfx');const x=h.draws[0][3],y=h.draws[0][4];assert.notEqual(x,h.foes[1].x);
 h.foes.find(u=>u.x===x).hp=0;h.draws.length=0;h.tick(200);assert.equal(h.draws[0][3],x);assert.equal(h.draws[0][4],y);
 h.foes.forEach(u=>u.hp=0);h.draws.length=0;h.tick(300);assert.equal(h.draws.length,0);assert.equal(h.c.lucAnhFx.length,0);
});
test('a killing hit cannot attach a follow-up debuff to a dead target; revived targets work',()=>{
 const c=vm.createContext({});vm.runInContext(section('  function __hvAddStatus3qAdapter(unit, status) {','  function addFloater('),c);
 const target={hp:0,statuses:[]};c.__hvAddStatus3qAdapter(target,{type:'burn',turns:2,power:12});assert.equal(target.statuses.length,0);
 target.hp=50;c.__hvAddStatus3qAdapter(target,{type:'burn',turns:2,power:12});assert.equal(target.statuses.length,1);
});
