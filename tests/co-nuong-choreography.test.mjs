import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../src/runtime/splus-battle-bridge.js',import.meta.url),'utf8');
function setup(){
 const draws=[],actor={id:'a',sourceId:'hero_splus_co_nuong',team:'player',x:100,y:400,hp:100},target={id:'t',team:'enemy',x:600,y:400,hp:100};let marks=[];
 const c=vm.createContext({console,innerWidth:1280,TEAM_ENEMY:'enemy',state:{speed:1,battleId:1},units:[actor,target],performance:{now:()=>0},__hvIsSkipping:()=>false,getUnit:id=>id==='a'?actor:target,battleCharacterBody:u=>({centerX:u.x,centerY:u.y-100,footY:u.y,height:200}),Image:class{complete=true;naturalWidth=2000;}});
 vm.runInContext(code,c);c.engine={hud:u=>u===target?marks:[]};vm.runInContext('splusCombat=()=>engine;',c);
 const ctx={save(){},restore(){},translate(...v){draws.push(['translate',...v]);},scale(...v){draws.push(['scale',...v]);},rotate(){},drawImage(...v){draws.push(['image',...v]);}};
 return {c,actor,target,draws,ctx,setMarks:m=>{marks=m;}};
}
test('three swords launch from harp with stagger and each completes two round trips',()=>{
 const {c,actor,target}=setup(),fx={actor,target,start:0,speed:1};
 assert.equal(typeof c.coNuongSwordPose,'function');
 for(let blade=0;blade<3;blade++){
  const lag=blade*120*.85;assert.equal(c.coNuongSwordPose(fx,lag-1,blade),null);
  const launch=c.coNuongSwordPose(fx,lag,blade);assert.ok(launch.x<200,'origin on caster harp');
  let sides=[];for(const age of [360,560,760,960,1160])sides.push(Math.sign(c.coNuongSwordPose(fx,lag+age*.85,blade).x-target.x));
  assert.deepEqual(sides,[-1,1,-1,1,-1]);
  assert.equal(c.coNuongSwordPose(fx,lag+1281*.85,blade),null);
 }
 const first=c.coNuongSwordPose(fx,240,0),last=c.coNuongSwordPose(fx,240,2);assert.ok(first.x>last.x,'swords follow one another');
 actor.team='enemy';actor.x=900;target.x=400;
 const mirrored=c.coNuongSwordPose(fx,360*.85,0);assert.ok(mirrored.x>target.x);
});
test('parasite smoke follows live status and target, survives 1.2s, stops on cleanse/death',()=>{
 const h=setup();assert.equal(typeof h.c.drawCoNuongParasites,'function');h.setMarks([{type:'parasite',sourceId:'a',stacks:3,remainingRounds:3}]);
 h.c.drawCoNuongParasites(h.ctx,5000);assert.ok(h.draws.some(d=>d[0]==='image'));h.draws.length=0;
 h.target.x=640;h.c.drawCoNuongParasites(h.ctx,10000);assert.ok(h.draws.some(d=>d[0]==='translate'&&d[1]===640));
 h.draws.length=0;h.setMarks([]);h.c.drawCoNuongParasites(h.ctx,10001);assert.equal(h.draws.length,0);
 h.setMarks([{type:'parasite',sourceId:'a',stacks:1}]);h.target.hp=0;h.c.drawCoNuongParasites(h.ctx,10002);assert.equal(h.draws.length,0);
});
test('ultimate uses projected target body height, not fixed viewport multiplier',()=>{
 const h=setup();vm.runInContext("coNuongImpacts.push({kind:'vfx-ultimate',target:units[1],start:0,duration:900,speed:1});",h.c);
 h.c.drawCoNuongImpactOverlay(h.ctx,100);
 assert.ok(h.draws.some(d=>d[0]==='scale'&&Math.abs(d[2]-200/324)<1e-8));
 assert.ok(h.draws.some(d=>d[0]==='translate'&&d[1]===600&&d[2]===300));
});

test('ATK reaches the final pulling frames by sword release',()=>{
 const {c}=setup();const spec=vm.runInContext('coNuongClips.basic',c);assert.equal(spec[5]*spec[1],720);assert.equal(Math.floor(600/spec[5]),15);
});
test('parasite uses dark falling-mist source with alpha compositing',()=>{
 const {c,ctx}=setup();c.coNuongAtlas(ctx,'vfx-parasite',0,0,100,1);assert.equal(ctx.globalCompositeOperation,'source-over');
 const meta=JSON.parse(readFileSync(new URL('../assets/vfx/co-nuong/vfx-parasite-smoke.source.json',import.meta.url),'utf8'));assert.equal(meta.code,'zgm_125_hmrx_a');
});

test('ultimate character completes its 18 poses in 2 seconds then returns idle',()=>{
 const h=setup();h.c.drawUnitHud=()=>{};
 vm.runInContext("coNuongMotion.set('a',{kind:'ultimate',start:0,duration:2000,speed:1});",h.c);
 h.c.coNuongRender(h.ctx,h.actor,1999);
 assert.equal(h.draws.find(d=>d[0]==='image')[2],5*480,'last source column');
 h.draws.length=0;h.c.coNuongRender(h.ctx,h.actor,2000);
 assert.equal(vm.runInContext("coNuongMotion.has('a')",h.c),false);
 assert.ok(h.draws.find(d=>d[0]==='image')[1].src.endsWith('/idle.webp'));
});
