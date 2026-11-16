import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {settleRewardTransaction} from '../src/domain/transaction/receipt-contract.mjs';
import * as xp from '../src/domain/campaign/player-progress.mjs';

const battle=readFileSync(new URL('../dist/battle.html',import.meta.url),'utf8');
const host=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const actions=readFileSync(new URL('../src/ui/result-actions-runtime.js',import.meta.url),'utf8');
function section(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,start);return text.slice(a,b);}
function run(source,env={}){const ctx=vm.createContext({console,URL,URLSearchParams,...env});vm.runInContext(source,ctx);return ctx;}
const result={sessionId:'regression',battleId:'stage-2',win:true,resultAction:'next',rewards:[{id:'gold',value:180}],units:[{team:'player',hp:100}]};
const lease={sessionId:'regression',battleId:'stage-2',mode:'campaign',chapterIdx:0,campaignBattleIndex:1};

function returnHarness({action='next',win=true,ready='loading',success=true,leaseOverride={},loginGate,startStage=1}={}){
 const pending={source:'hon-viet-battle',type:'battle-result',payload:{...result,win,resultAction:action}};
 const values=new Map([['hvBattleHostEvent',JSON.stringify(pending)],['hvBattleHostLease',JSON.stringify({...lease,...leaseOverride})]]);
 const calls=[],listeners=new Map(),P={campaignStages:{0:startStage}};
 let route=['stage-1']; // the early story route which caused false chapter completion
 const env={P,ST:{mode:null,chapterIdx:null,campaignBattleIndex:0},activeBattle:null,
  location:{search:'?hvBattleReturn=1',href:'https://game.test/index.html?hvBattleReturn=1'},history:{replaceState(...args){calls.push(['url',args[2]])}},window:{name:'config',HonVietLoginGate:loginGate},
  sessionStorage:{getItem:k=>values.get(k),removeItem:k=>values.delete(k)},
  document:{readyState:ready,addEventListener:(event,fn)=>listeners.set(event,fn)},
  navTo:route=>calls.push(['nav',route]),toast:()=>{},persist:()=>true,refreshResbar:()=>{},
  chapterBattleSequence:()=>route,setTimeout:fn=>fn(),startChapter:(idx)=>calls.push(['next',idx]),endChapter:()=>calls.push(['endChapter']),abortIntegratedBattle:()=>{},
  finishIntegratedBattle:payload=>{calls.push(['settle',env.ST.mode,env.ST.chapterIdx,env.ST.campaignBattleIndex]);if(success){ctx.activeBattle.onEnd(payload.win,payload.resultAction);return true;}return false;}};
 const ctx=run(section(host,'  async function consumeBattleReturn() {','\n})();'),env);
 return {ctx,calls,P,values,boot(){route=Array.from({length:18},(_,i)=>'stage-'+(i+1));return listeners.get('DOMContentLoaded')?.();}};
}

test('full-page result waits for the real 18-stage route, restores context, advances only to 1-3',()=>{
 const h=returnHarness();assert.deepEqual(h.calls,[]);h.boot();
 assert.deepEqual(h.calls.filter(x=>x[0]==='settle'),[['settle','campaign',0,1]]);
 assert.equal(h.P.campaignStages[0],2);assert.ok(h.calls.some(x=>x[0]==='next'));assert.ok(!h.calls.some(x=>x[0]==='endChapter'));
 assert.equal(h.values.size,0);
});
test('Confirm settles the same result but returns to campaign without starting another battle',()=>{
 const h=returnHarness({action:'confirm'});h.boot();assert.equal(h.P.campaignStages[0],2);assert.ok(h.calls.some(x=>x[0]==='nav'&&x[1]==='campaign'));assert.ok(!h.calls.some(x=>x[0]==='next'));
});
test('defeat returns without advancing the current stage',()=>{const h=returnHarness({win:false});h.boot();assert.equal(h.P.campaignStages[0],1);assert.ok(!h.calls.some(x=>x[0]==='next'));});
test('a mismatched return cannot claim a different stage',()=>{const h=returnHarness({leaseOverride:{campaignBattleIndex:5}});h.boot();assert.ok(!h.calls.some(x=>x[0]==='settle'));assert.equal(h.P.campaignStages[0],1);assert.equal(h.values.size,2);});
test('failed settlement retains the pending event, lease and retry URL',()=>{const h=returnHarness({success:false});h.boot();assert.equal(h.values.size,2);assert.ok(!h.calls.some(x=>x[0]==='url'));assert.equal(h.P.campaignStages[0],1);});

function transport(blocked=false,embedded=false){
 const sent=[],saved=[],nav=[],window={};let fail=blocked;
 const ctx=run(section(battle,'  function postToHonVietHost(type, payload)','  window.postToHonVietHost'),{window,parent:embedded?{postMessage:(...v)=>sent.push(v)}:window,
 location:{origin:'https://game.test',search:'',replace:u=>nav.push(u)},sessionStorage:{setItem:(k,v)=>{if(fail)throw new Error('QuotaExceeded');saved.push([k,JSON.parse(v)])}}});
 return {ctx,sent,saved,nav,unblock(){fail=false;}};
}
test('storage failure keeps full-page result in place and permits a successful retry',()=>{
 const t=transport(true);assert.throws(()=>t.ctx.postToHonVietHost('battle-result',result),/Chưa lưu/);assert.equal(t.nav.length,0);
 t.unblock();assert.equal(t.ctx.postToHonVietHost('battle-result',result),true);assert.equal(t.saved[0][1].payload.resultAction,'next');assert.deepEqual(t.nav,['index.html?hvBattleReturn=1']);
});
test('iframe result uses the annotated parent transport; Back uses the same full-page bridge',()=>{
 const t=transport(false,true);assert.equal(t.ctx.postToHonVietHost('battle-result',result),true);assert.equal(t.sent[0][0].schema,'hon-viet-battle/v1');assert.equal(t.nav.length,0);
 const page=transport();page.ctx.postToHonVietHost('battle-nav',{sessionId:'regression',target:'campaign'});assert.equal(page.saved[0][1].type,'battle-nav');assert.equal(page.nav.length,1);
});

function actionHarness(){
 const events={},messages={},sent=[],buttons=['confirm','next','back'].map(action=>({dataset:{resultAction:action},isConnected:true,disabled:false}));
 let status=null,fail=false;
 const root={contains:b=>buttons.includes(b),addEventListener:(e,f)=>events[e]=f,querySelectorAll:()=>buttons,querySelector:s=>s==='[data-result-status]'?status:{append:p=>{status=p;}}};
 const parent={},window={addEventListener:(e,f)=>messages[e]=f,__HV_BATTLE_RESULT_API:{embedded:()=>true,sessionId:()=>result.sessionId,publish:action=>{if(fail)return false;sent.push(action);return true;},retry(){sent.push('retry');}},postToHonVietHost:(...args)=>{sent.push(args);return true;}};
 run(actions,{window,parent,location:{origin:'https://game.test'},console:{error(){}},document:{getElementById:()=>root,createElement:()=>({dataset:{},setAttribute(){}})}});
 return{events,sent,buttons,window,click(i){events.click({target:{closest:()=>buttons[i]},preventDefault(){},stopPropagation(){}});},fail(v){fail=v;},status:()=>status,
 nack(){messages.message({source:parent,origin:'https://game.test',data:{source:'hon-viet-parent',type:'battle-settlement-error',payload:{sessionId:result.sessionId}}});}};
}
test('one click owner covers touch-generated clicks and double activation cannot publish twice',()=>{
 const a=actionHarness();assert.deepEqual(Object.keys(a.events),['click']);a.click(1);a.click(1);assert.deepEqual(a.sent,['next']);assert.ok(a.buttons.every(b=>b.disabled));
});
test('publish failure and host save rejection re-enable buttons with a visible retry message',()=>{
 const a=actionHarness();a.fail(true);a.click(0);assert.ok(a.buttons.every(b=>!b.disabled));assert.match(a.status().textContent,/bấm lại/i);
 a.fail(false);a.click(0);a.nack();assert.ok(a.buttons.every(b=>!b.disabled));a.click(0);assert.deepEqual(a.sent,['confirm','retry','confirm']);
});
test('defeat Back does not post to itself on a full-page battle',()=>{const a=actionHarness();a.click(2);assert.equal(a.sent[0][0],'battle-nav');assert.equal(a.sent[0][1].target,'campaign');});

function settlementHarness(){
 let player={gold:500,revision:0,squad:[{id:'hero'}],heroes:{hero:{owned:true}},mastery:{hero:{xp:98,battles:0,wins:0}},hvPlayerProgress:{version:1,xp:80,clears:['0:0'],afkRemainder:0}};
 let fail=false,saves=0;
 const context={...xp,P:player,ST:{mode:'campaign',chapterIdx:0,campaignBattleIndex:1},window:{},safeText:(a,b)=>String(a||b),toast:()=>{},refreshResbar:()=>{},masteryState:id=>player.mastery[id],masteryRank:()=>({name:'test'}),persist:()=>{saves++;return !fail;}};
 context.window.HonVietTransaction={commit:opts=>{
  const before=JSON.stringify(player),tx=settleRewardTransaction({...opts,state:player,expectedRevision:player.revision,applyReward:(reward)=>{player.gold+=reward.gold||0;}});
  if(tx.ok&&!tx.duplicate){saves++;if(fail){Object.keys(player).forEach(k=>delete player[k]);Object.assign(player,JSON.parse(before));return {ok:false};}}return tx;
 }};
 const code=section(host,'function masteryBattleProgress(','\nfunction ')+section(host,'function hvCampaignSettlementXp(','\nwindow.HonVietPlayerProgress')+section(host,'  function applyLegacyMetaWinHooks(','\n  function closeOverlay');
 const ctx=run(code,context);return {player,ctx,fail:v=>{fail=v;},saves:()=>saves};
}
test('gold, real first-clear XP and capped mastery commit once across repeated result messages',()=>{
 const h=settlementHarness(),first=h.ctx.applyLegacyMetaWinHooks(result),second=h.ctx.applyLegacyMetaWinHooks(result);
 assert.ok(first.ok);assert.ok(second.duplicate);assert.equal(h.player.gold,680);assert.equal(h.player.hvPlayerProgress.xp,168);assert.equal(h.player.mastery.hero.xp,100);assert.equal(h.player.mastery.hero.battles,1);assert.equal(h.saves(),1);
});
test('failed save rolls back gold, XP and mastery; retry grants the same reward once',()=>{
 const h=settlementHarness();h.fail(true);h.ctx.applyLegacyMetaWinHooks(result);assert.equal(h.player.gold,500);assert.equal(h.player.hvPlayerProgress.xp,80);assert.equal(h.player.mastery.hero.xp,98);
 h.fail(false);assert.ok(h.ctx.applyLegacyMetaWinHooks(result).ok);assert.equal(h.player.gold,680);assert.equal(h.player.hvPlayerProgress.xp,168);
});
test('loss grants no win gold or first-clear XP; participation is still recorded once',()=>{
 const h=settlementHarness();h.ctx.applyLegacyMetaWinHooks({...result,win:false});h.ctx.applyLegacyMetaWinHooks({...result,win:false});assert.equal(h.player.gold,500);assert.equal(h.player.hvPlayerProgress.xp,80);assert.equal(h.player.mastery.hero.battles,1);
});

test('visible reward rows use values and labels from the result, with no fictitious equipment',()=>{
 const code=section(battle,' function renderResultRewards(',' function show(victory,snap)');const ctx=run(code);
 const html=ctx.renderResultRewards({progression:{rewardDetails:[{id:'gold',name:'Vàng',value:180},{id:'playerXp',name:'EXP người chơi',value:88},{id:'mastery',name:'Tinh Thông',value:4},{id:'gems',name:'Ngọc',value:0}]}});
 assert.match(html,/\+180/);assert.match(html,/\+88/);assert.match(html,/EXP người chơi/);assert.doesNotMatch(html,/Trang bị|EXP tướng|data-reward-id="gems"/);
 const escaped=ctx.renderResultRewards({rewards:[{id:'gold',value:1,name:'<img onerror=bad>'}]});assert.doesNotMatch(escaped,/<img onerror/);
});
test('result idle uses verified Lục Ảnh RGBA and exact padded Thầy Mo cells/timing',()=>{
 const line=battle.match(/const MANIFEST=(\{[^\n]+\});/);assert.ok(line);const manifest=JSON.parse(line[1]);
 assert.match(manifest.luc_anh.idle.src,/idle-rgba-v1-battle/);const t=manifest.thay_mo;
 assert.equal(t.run.cellW,480);assert.equal(t.run.cellH,440);assert.equal(t.idle.cellW,235);assert.equal(t.idle.strideW,241);assert.equal(t.idle.pad,3);assert.equal(t.idle.durations.length,96);assert.equal(t.idle.durations.reduce((a,b)=>a+b),6000);
});
test('every generated inline script remains syntax valid',()=>{for(const html of [host,battle])for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))assert.doesNotThrow(()=>new Function(m[1]));});

test('failed payload transport does not latch resultPublished; a second tap can publish',async()=>{
 const {default:Core}=await import('../src/domain/combat/hon-viet-core.mjs');
 const stateCode=section(battle,'  const state = {','  state.tacticalMemory.snapshot');
 const publishCode=section(battle,'  function publishBattleResult(','  window.__HV_BATTLE_RESULT_API');
 let fail=true,sent=0;
 const ctx=run(stateCode+'\n'+publishCode+'\nstate.mode="result";state.result="player";globalThis.readState=()=>state;',{
  Core,EMBED_CONFIG:{sessionId:'regression',battleId:'stage-2'},EMBEDDED:true,TEAM_PLAYER:'player',window:{},units:[],loadTacticalMemory:()=>({}),loadTacticalPresets:()=>[],buildBattleIntelligence:()=>({}),postToHonVietHost:()=>{if(fail)throw Error('storage full');sent++;return true;}});
 assert.throws(()=>ctx.publishBattleResult('next'),/storage full/);assert.equal(ctx.readState().resultPublished,false);
 fail=false;assert.equal(ctx.publishBattleResult('next'),true);assert.equal(ctx.readState().resultPublished,true);assert.equal(ctx.publishBattleResult('next'),false);assert.equal(sent,1);
});

test('reward preview uses real first-clear XP and capped mastery without mutating the save or payload gold',()=>{
 const preview=section(host,'    const rewardDetails=rewardPreview.map','    return {\n      resultProgress:');
 const P={gold:500,squad:[{id:'a'},{id:'b'}],heroes:{a:{owned:true},b:{owned:true}},mastery:{a:{xp:98},b:{xp:100}},clearedChapters:[],hvPlayerProgress:{version:1,xp:80,clears:['0:0'],afkRemainder:0}};
 const before=JSON.stringify(P),rewardPreview=[{id:'gold',value:180},{id:'mastery',value:4}],ctx=run(preview+'\nglobalThis.rows=rewardDetails;',{
  ...xp,P,rewardPreview,ST:{mode:'campaign',chapterIdx:0,campaignBattleIndex:1},battleId:'stage-2',window:{__HV_MAIN_QUEST_RUNTIME_V1:{previewBattleReward:()=>({gold:135,gems:0})}},chapterBattleSequence:()=>Array(18),DATA:{chapters:[],heroes:{}}});
 assert.equal(ctx.rows.find(r=>r.id==='playerXp').value,88);assert.equal(ctx.rows.find(r=>r.id==='mastery').value,2);assert.equal(ctx.rows.find(r=>r.name==='Vàng chính tuyến').value,135);assert.equal(rewardPreview[0].value,180);assert.equal(JSON.stringify(P),before);
});

function motionHarness({holdIdle=false,reduced=false}={}){
 let clock=0,serial=0;const rafs=new Map(),timers=new Map(),jobs=[],images=[],draws=[];
 const classes=new Set(),canvases={};for(const kind of ['run','idle','fall'])canvases[kind]={width:480,height:270,isConnected:true,style:{},classList:{add(){}},getContext:()=>({clearRect(){},drawImage(image,sx,sy,w,h){assert.ok(sx>=0&&sy>=0&&sx+w<=image.naturalWidth&&sy+h<=image.naturalHeight);draws.push({kind,sx,sy,w,h});}})};
 const root={isConnected:true,dataset:{},classList:{add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x))},querySelector:s=>canvases[s.split('.').pop()]};
 class Image{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;images.push(this);}set src(value){this._src=value;if(!holdIdle||!value.includes('idle-rgba'))jobs.push(()=>this.load());}load(){this.complete=true;this.naturalWidth=10000;this.naturalHeight=10000;this.onload?.();}removeAttribute(){this._src='';this.complete=false;}get src(){return this._src;}}
 const window={__showIntegratedResultV6(){},__hideIntegratedResultV6(){},matchMedia:()=>({matches:reduced})};
 const script=battle.match(/<script id="hv-result-character-motion-v1">([\s\S]*?)<\/script>/)[1];
 run(script,{window,document:{getElementById:()=>root},Image,performance:{now:()=>clock},queueMicrotask:fn=>jobs.push(fn),
 requestAnimationFrame:fn=>{rafs.set(++serial,fn);return serial;},cancelAnimationFrame:id=>rafs.delete(id),setTimeout:(fn,ms)=>{timers.set(++serial,{fn,at:clock+ms});return serial;},clearTimeout:id=>timers.delete(id)});
 const flush=()=>{while(jobs.length)jobs.shift()();};
 return{window,classes,images,draws,rafs,timers,show(hero='thay_mo',victory=true){window.__showIntegratedResultV6(victory,{player:[{sourceId:hero,damage:100}]});flush();},step(ms){clock+=ms;flush();const pending=[...rafs];rafs.clear();pending.forEach(([,fn])=>fn(clock));for(const [id,item] of [...timers])if(item.at<=clock){timers.delete(id);item.fn();}flush();},state:()=>window.__HV_RESULT_MOTION_QA.state()};
}
test('Thầy Mo entrance draws real padded frames then switches to continuous idle and cleans up',()=>{
 const h=motionHarness();h.show();assert.ok(h.classes.has('irv-motion-run-active'));
 for(let i=0;i<100;i++)h.step(20);
 assert.equal(h.state().hero,'thay_mo');assert.equal(h.state().phase,'idle');assert.ok(h.state().runFrames>=8&&h.state().idleFrames>0);const runDraws=h.draws.filter(d=>d.kind==='run'),idleDraws=h.draws.filter(d=>d.kind==='idle');assert.ok(runDraws.length>0&&runDraws.every(d=>d.w===480&&d.h===440));assert.ok(idleDraws.length>0&&idleDraws.every(d=>d.w===235&&d.h===264&&d.sx%241===3&&d.sy%270===3),JSON.stringify(idleDraws.slice(0,24)));
 h.window.__hideIntegratedResultV6();assert.equal(h.rafs.size,0);assert.equal(h.timers.size,0);assert.ok(h.images.every(im=>im.src===''));
});
test('a delayed idle atlas keeps the entrance body visible until the first idle frame can be drawn',()=>{
 const h=motionHarness({holdIdle:true});h.show('luc_anh');for(let i=0;i<100;i++)h.step(20);assert.equal(h.state().phase,'run');assert.ok(!h.classes.has('irv-motion-idle'));assert.ok(h.state().runFrames>8);
 h.images.find(im=>im.src.includes('idle-rgba')).load();for(let i=0;i<8;i++)h.step(20);assert.equal(h.state().phase,'idle');assert.ok(h.state().idleFrames>0);
});
test('reduced-motion defeat paints its hold frame after the image is ready',()=>{
 const h=motionHarness({reduced:true});h.show('thay_mo',false);assert.equal(h.state().phase,'fall-hold');assert.equal(h.draws.length,1);assert.equal(h.draws[0].kind,'fall');
});

test('result snapshots carry the battle appearance and Lục Ảnh has no competing legacy painter',()=>{
 const snapshot=section(battle,'  function buildResultSnapshot(victory)','  function renderCinematicBattleResult');
 assert.equal((snapshot.match(/archetype:unit.archetype/g)||[]).length,2);
 const show=section(battle,' function show(victory,snap){',' window.__showIntegratedResultV6=show;');assert.doesNotMatch(show,/drawLucAnhIdle\(/);
 const h=motionHarness();assert.equal(h.window.__HV_RESULT_MOTION_CAN_DRAW({sourceId:'lac_yen',archetype:'ranger'}),true);assert.equal(h.window.__HV_RESULT_MOTION_CAN_DRAW({sourceId:'to_diep',archetype:'duelist'}),true);
});

test('full-page return awaits the account and shares one in-flight settlement',async()=>{
 let release;const h=returnHarness({loginGate:{resumeBattleReturn:()=>new Promise(resolve=>{release=resolve;})}});
 const pending=h.boot();assert.equal(h.P.campaignStages[0],1);assert.equal(h.values.size,2);
 assert.equal(h.ctx.window.__HV_RESUME_BATTLE_RETURN(),pending);
 release(true);assert.equal(await pending,true);assert.equal(h.P.campaignStages[0],2);
 assert.equal(h.calls.filter(x=>x[0]==='settle').length,1);assert.equal(h.values.size,0);
});
test('blocked login retains the result; Continue retries the same return',async()=>{
 let ready=false;const h=returnHarness({loginGate:{resumeBattleReturn:async()=>ready}});
 assert.equal(await h.boot(),false);assert.equal(h.values.size,2);assert.equal(h.P.campaignStages[0],1);
 ready=true;assert.equal(await h.ctx.window.__HV_RESUME_BATTLE_RETURN(),true);assert.equal(h.P.campaignStages[0],2);
});

test('late full-page results cannot roll a newer campaign checkpoint backwards',()=>{const h=returnHarness({startStage:5,action:'confirm'});h.boot();assert.equal(h.P.campaignStages[0],5);});
