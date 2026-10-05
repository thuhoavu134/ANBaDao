import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
const {battleFormationForViewport,battleCharacterScaleForViewport}=await import(process.env.HV_VISUAL_BASELINE?pathToFileURL(process.env.HV_VISUAL_BASELINE+'/scripts/battle-formation-scale-v1.mjs'):new URL('../scripts/battle-formation-scale-v1.mjs',import.meta.url));
import {patchBattleVfxDirection} from '../scripts/battle-vfx-direction-v1.mjs';
const read=p=>readFileSync(process.env.HV_VISUAL_BASELINE?process.env.HV_VISUAL_BASELINE+'/'+p:new URL('../'+p,import.meta.url),'utf8');
const scene=read('src/ui/campaign-scene.js');
function campaign(){return vm.runInNewContext(scene.slice(0,scene.indexOf('function currentCheckpoint()'))+'\n({specs:spriteSpecs,attacks:farmAttackSpecs,runs:runSpecs,id:typeof campaignActorArtId==="function"?campaignActorArtId:null});',{window:{matchMedia:()=>({matches:false})},Image:class{},LUC_ANH_IDLE_1080:{frames:96,cols:8},AFK_THAY_MO_IDLE_DURATIONS:[60]});}
test('canonical and alias S+ IDs resolve full-body campaign idle/run/attack',()=>{const api=campaign();assert.equal(typeof api.id,'function');for(const id of ['hero_splus_linh_dong','hero_splus_bach_dien']){const key=api.id(id);assert.ok(api.specs[key]);assert.ok(api.runs[key]);assert.ok(api.attacks[key]);assert.match(api.attacks[key].src,/basic-atlas/);}});
test('portrait fronts separate more with smaller consistent stature; desktop unchanged',()=>{for(const [w,h]of [[390,739],[393,747],[430,827]]){const f=battleFormationForViewport(w,h);assert.ok(f.enemy[0].x-f.player[0].x>=200);assert.ok(battleCharacterScaleForViewport('dinh_loi',w,h)<=.42);}assert.equal(battleCharacterScaleForViewport('dinh_loi',1280,528),.74);});
test('managed HUD stops suppressing semantic icon art or displaying source hero number',()=>{const s=read('scripts/splus-runtime-v1.mjs');assert.ok(!/icon=status\.iconId\?null|const number=globalThis\.SPLUS42\.catalog\.find/.test(s),'S+ HUD suppresses icons and substitutes hero numbers');});
test('Dinh Loi enemy projectile and wave blitters mirror at the draw owner',()=>{const bach=read('scripts/bach-dien-canvas-runtime-v1.mjs');const raw=read('battle.html')+'\n'+bach.slice(bach.indexOf('function drawBachDienFx('),bach.indexOf('window.drawBachDienHero='));const source=read('scripts/build-static.mjs').includes('installBattleVfxDirection(root)')?patchBattleVfxDirection(raw):raw;if(!process.env.HV_VISUAL_BASELINE)assert.equal(patchBattleVfxDirection(source),source);const body=source.slice(source.indexOf('  function drawDinhLoiFx('),source.indexOf('  const LUC_ANH_ID',source.indexOf('  function drawDinhLoiFx(')));assert.match(body,/basicProjectile[^\n]*flip:actor.team===TEAM_ENEMY/);assert.match(body,/skill1Wave[^\n]*flip:actor.team===TEAM_ENEMY/);});
test('AFK renderer uses attack pose/mob approach and authored VFX instead of token line',()=>{assert.ok(/function campaignFarmActorPose\(/.test(scene),'AFK approach/cast/return owner missing');assert.match(scene,/function drawCampaignBasicVfx\(/);assert.doesNotMatch(scene,/t-\.13/);assert.match(scene,/const farmAttackPacks =/);assert.match(scene,/campaignFarmActorPose\(pick/);});

test('canonical semantic shield/debuff icons retain effect identity',async()=>{const {combatStatusIconType}=await import('../src/render/combat-status-presentation.mjs');for(const [a,b]of [['worldSubstitute','guard'],['armorDown','defDown'],['attackDown','atkDown'],['hardSilence','silence']])assert.equal(combatStatusIconType(a),b);assert.equal(combatStatusIconType('joyMask'),'joyMask');});

test('AFK approach reaches its mob and returns without modifying sparse squad slots',()=>{
 const api=vm.runInNewContext(scene.slice(scene.indexOf('const HOME_SLOT'),scene.indexOf('function drawCampaignFarm('))+'\n({sampleCampaignFarm,campaignFarmActorPose,homePartyPose});');
 const squad=[{id:'hero_splus_linh_dong',slot:4,row:'back'}],before=JSON.stringify(squad),specs=campaign().attacks;
 const poseAt=t=>{const farm=api.sampleCampaignFarm(t,squad,false,specs);return {home:api.homePartyPose(squad[0],390,696,farm),pose:api.campaignFarmActorPose(squad[0],390,696,farm)};};
 const start=poseAt(6200),cast=poseAt(7200),end=poseAt(8395);
 assert.equal(start.pose.x,start.home.x);assert.ok(Math.hypot(cast.pose.x-cast.home.x,cast.pose.y-cast.home.y)>10);assert.ok(cast.pose.castTime>=0);assert.ok(Math.hypot(end.pose.x-end.home.x,end.pose.y-end.home.y)<1);assert.equal(JSON.stringify(squad),before);
});
test('actual Dinh Loi projectile travels enemy-to-player and mirrors once',()=>{
 const bach=read('scripts/bach-dien-canvas-runtime-v1.mjs');const input=read('battle.html')+'\n'+bach.slice(bach.indexOf('function drawBachDienFx('),bach.indexOf('window.drawBachDienHero='));const patched=patchBattleVfxDirection(input);
 const code=patched.slice(patched.indexOf('function drawDinhLoiFx('),patched.indexOf('function drawDinhLoiPersistentShields('));
 const calls=[],actor={id:'a',team:'enemy',x:900,y:520},target={id:'t',team:'player',x:600,y:520};
 const context=vm.createContext({TEAM_ENEMY:'enemy',TEAM_PLAYER:'player',dinhLoiFx:{kind:'basicProjectile',actorId:'a',targetId:'t',started:0,duration:1000},getUnit:id=>id==='a'?actor:target,DINH_LOI_ACTION_MS:4000,DINH_LOI_IMAGES:{basicProjectile:{}},dinhLoiFrame:()=>0,drawDinhLoiAtlasFrame:(...args)=>calls.push(args)});
 vm.runInContext(code,context);context.drawDinhLoiFx({},100);context.drawDinhLoiFx({},800);assert.ok(calls[1][3]<calls[0][3]);assert.equal(calls[0][7].flip,true);
});

test('browser fixture extracts the current hook despite intervening validation statement',async()=>{
 const {rawRenderHook,renderDeclaration}=await import('../scripts/qa-render-source.mjs');
 const hook=rawRenderHook(read('scripts/qa-battle-formation-scale.mjs'));assert.match(hook,/__HV_LAYOUT_MEASURE/);assert.ok(hook.endsWith('\n'));
 assert.equal(renderDeclaration('const x = { /* semi;colon */ value: 1 }; next();','x'),'const x = { /* semi;colon */ value: 1 };');
});
