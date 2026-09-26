import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Controller unit tests, NOT production 6v6 or asset/render certification.
// Execute the actual, unmodified inline page script with a controlled iframe
// API and deterministic timers. No source replacement or copied controller.
const html = readFileSync(new URL('../skill-test.html', import.meta.url), 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'skill-test controller must exist');
const flush = async () => { for (let i=0;i<40;i++) await Promise.resolve(); };

function fixture() {
  let now=0, nextTimer=0, pendingUrl='', runtime=null;
  const timers=new Map(), storage=new Map(), forced=[];
  const state={ autoNavigate:true, completeActions:true, storageFails:false, forceError:null };
  const element=(dataset={})=>({
    dataset, disabled:false, textContent:'', attributes:{}, listeners:{},
    setAttribute(name,value){this.attributes[name]=value;},
    addEventListener(name,callback){this.listeners[name]=callback;},
    click(){if(!this.disabled)this.listeners.click?.();}
  });
  const tabs=['luc-anh','dinh-loi','ong-pho'].map(heroTab=>element({heroTab}));
  const actions=['basic','skill','ultimate'].map(action=>element({action}));
  const status=element(), strong=element(), detail=element(), reset=element(), frame=element();
  status.querySelector=()=>strong;
  function navigate() {
    const config=JSON.parse(frame.dataset.config);
    const units=config.heroes.map(unit=>({...unit,x:0,y:0,baseX:0,baseY:0}));
    const events=[];
    const emit=(type,id,actorId)=>events.push({type,actionId:id,actorId,at:now});
    const api={getUnits:()=>units.map(unit=>({...unit})),getState:()=>({mode:'battle'})};
    const ids={qaForceLucAnhAction:'qa-luc-anh',qaForceDinhLoiAction:'qa-dinh-loi',qaForceOngPhoAction:'ong-pho-gif-test'};
    for(const [hook,actorId] of Object.entries(ids))api[hook]=action=>{
      const id='action-'+(forced.length+1);
      forced.push({action,actorId,id});
      if(state.forceError)return Promise.reject(state.forceError);
      emit('action:start',id,actorId);
      if(state.completeActions){emit('marker:impact',id,actorId);emit('action:complete',id,actorId);}
      return Promise.resolve(true);
    };
    runtime={units,events,emit,api,lastUrl:pendingUrl};
    frame.contentWindow={
      location:{href:new URL(pendingUrl,'https://fixture.invalid/').href},
      __HON_VIET__:api,
      __HV_BATTLE_PHASE1_TRACE:{events:()=>events.slice()}
    };
    frame.contentDocument={URL:frame.contentWindow.location.href,querySelector:()=>null};
  }
  Object.defineProperty(frame,'src',{get:()=>pendingUrl,set:value=>{pendingUrl=value;if(state.autoNavigate)navigate();}});
  const elements={battleFrame:frame,status,statusDetail:detail,resetBattle:reset,qaViewport:element()};
  const document={
    getElementById:id=>elements[id],
    querySelectorAll:selector=>({'[data-hero-tab]':tabs,'[data-action]':actions})[selector]||[]
  };
  const window={};
  const context=vm.createContext({window,document,URL,URLSearchParams,console,
    performance:{now:()=>now},
    sessionStorage:{
      setItem(key,value){if(state.storageFails)throw new Error('fixture storage denied');storage.set(key,value);},
      removeItem(key){storage.delete(key);}
    },
    setTimeout(callback,ms=0){const id=++nextTimer;timers.set(id,{at:now+ms,callback});return id;},
    clearTimeout(id){timers.delete(id);}
  });
  vm.runInContext(script,context,{filename:'skill-test.html:inline'});
  async function tick(ms) {
    const end=now+ms;
    await flush();
    for(let steps=0;steps<10000;steps++){
      const due=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
      if(!due){now=end;await flush();return;}
      now=due[1].at;timers.delete(due[0]);due[1].callback();await flush();
    }
    throw new Error('Timer fixture exceeded bound');
  }
  return {state,window,frame,status,strong,detail,reset,tabs,actions,forced,storage,tick,navigate,
    get qa(){return window.__SKILL_TEST_QA__;},get runtime(){return runtime;},
    finish(){const call=forced.at(-1);runtime.emit('marker:impact',call.id,call.actorId);runtime.emit('action:complete',call.id,call.actorId);}
  };
}
function observe(promise){const result={settled:false};promise.then(value=>Object.assign(result,{settled:true,value}),error=>Object.assign(result,{settled:true,error}));return result;}
async function ready(){const h=fixture();await flush();assert.equal(h.qa.ready,true);return h;}

for(const hero of ['luc-anh','dinh-loi','ong-pho'])for(const action of ['basic','skill','ultimate']){
  test(`controller preserves ${hero} ${action} start/impact/complete flow`,async()=>{
    const h=await ready();h.tabs.find(button=>button.dataset.heroTab===hero).click();
    const result=observe(h.qa.runAction(action));await h.tick(600);
    assert.equal(result.error,undefined);assert.equal(result.value,true);
    assert.equal(h.qa.lastRun.hero,hero);assert.equal(h.qa.lastRun.action,action);
    assert.equal(h.qa.lastRun.started,true);assert.equal(h.qa.lastRun.impact,true);assert.equal(h.qa.lastRun.complete,true);
    assert.equal(h.forced.length,1);assert.equal(h.qa.errors.length,0);
    assert.ok(h.actions.every(button=>!button.disabled));
  });
}

test('R1: prior completion cannot unlock the next in-flight action',async()=>{
  const h=await ready();const first=observe(h.qa.runAction('basic'));await flush();
  assert.equal(h.qa.lastRun.complete,true);
  h.state.completeActions=false;
  const second=observe(h.qa.runAction('skill'));await flush();
  assert.equal(h.qa.lastRun.started,true);assert.equal(h.qa.lastRun.complete,false);
  await h.tick(600);
  assert.equal(first.value,true);
  assert.ok(h.actions.every(button=>button.disabled),'old finally must not unlock newer action');
  assert.equal(await h.qa.runAction('ultimate'),false,'third action must be rejected while second owns controls');
  assert.equal(h.forced.length,2);
  h.finish();await h.tick(700);assert.equal(second.value,true);
});

test('R1: delayed ready label cannot overwrite a later hero selection',async()=>{
  const h=await ready();observe(h.qa.runAction('basic'));await flush();
  h.tabs[1].click();const selectedDetail=h.detail.textContent;
  await h.tick(600);
  assert.equal(h.qa.selectedHero,'dinh-loi');assert.equal(h.detail.textContent,selectedDetail);
});

test('snap-only action needs no movement override hook',async()=>{
  const h=await ready();
  assert.equal(h.frame.contentWindow.__HV_SKILL_MOVEMENT_QA,undefined);
  const result=observe(h.qa.runAction('basic'));await h.tick(600);
  assert.equal(result.error,undefined);assert.equal(result.value,true);
  assert.equal(h.qa.lastRun.movement,'snap');assert.equal(h.qa.errors.length,0);
});

for(const failure of ['trace','actor','hook']){
  test(`R2: ${failure} preflight failure is caught and can be retried`,async()=>{
    const h=await ready();const actor=h.runtime.units.find(unit=>unit.id==='qa-luc-anh');
    const hook=h.runtime.api.qaForceLucAnhAction;
    const trace=h.frame.contentWindow.__HV_BATTLE_PHASE1_TRACE;
    if(failure==='trace')h.frame.contentWindow.__HV_BATTLE_PHASE1_TRACE=null;
    if(failure==='actor')actor.hp=0;
    if(failure==='hook')delete h.runtime.api.qaForceLucAnhAction;
    const failed=observe(h.qa.runAction('basic'));await h.tick(90);
    assert.equal(failed.error,undefined,'UI handler must not reject outside its error boundary');
    assert.equal(failed.value,false);assert.equal(h.status.dataset.phase,'error');
    assert.equal(h.qa.errors.length,1);assert.equal(h.reset.disabled,false);
    h.frame.contentWindow.__HV_BATTLE_PHASE1_TRACE=trace;actor.hp=500000;h.runtime.api.qaForceLucAnhAction=hook;
    const retry=observe(h.qa.runAction('basic'));await h.tick(600);
    assert.equal(retry.value,true);
  });
}

test('R2: rejected runtime promise reports once without waiting for a trace timeout',async()=>{
  const h=await ready();h.state.forceError=new Error('fixture runtime rejection');
  const result=observe(h.qa.runAction('basic'));await h.tick(90);
  assert.equal(result.error,undefined);assert.equal(result.value,false);
  assert.equal(h.status.dataset.phase,'error');assert.equal(h.qa.errors.length,1);
  assert.match(h.qa.errors[0],/fixture runtime rejection/);assert.equal(h.reset.disabled,false);
});

test('R2: unknown action is rejected without invoking the runtime',async()=>{
  const h=await ready();const result=observe(h.qa.runAction(null));await h.tick(90);
  assert.equal(result.error,undefined);assert.equal(result.value,false);assert.equal(h.forced.length,0);
  assert.ok(h.actions.every(button=>!button.disabled));
});

test('R3: storage failure enables Reset and a subsequent retry recovers',async()=>{
  const h=await ready();h.state.storageFails=true;
  const result=observe(h.qa.reset());await flush();
  assert.equal(result.error,undefined,'load setup must be inside the error boundary');
  assert.equal(h.qa.ready,false);assert.equal(h.status.dataset.phase,'error');
  assert.equal(h.reset.disabled,false);assert.equal(h.qa.errors.length,1);
  h.state.storageFails=false;observe(h.qa.reset());await flush();
  assert.equal(h.qa.ready,true);assert.equal(h.status.dataset.phase,'ready');
});

test('R4: Reset waits for its new iframe rather than reusing the old runtime',async()=>{
  const h=await ready();h.state.autoNavigate=false;observe(h.qa.reset());await flush();
  assert.equal(h.qa.ready,false,'old iframe must not satisfy readiness of the replacement session');
  assert.equal(h.status.dataset.phase,'loading');
  h.navigate();await h.tick(100);
  assert.equal(h.qa.ready,true);assert.equal(h.status.dataset.phase,'ready');
});

test('R4: reset during an action prevents stale timeout/error and control writes',async()=>{
  const h=await ready();h.state.completeActions=false;
  const old=observe(h.qa.runAction('basic'));await flush();
  observe(h.qa.reset());await flush();
  assert.equal(h.qa.ready,true);assert.equal(h.qa.lastRun,null);
  await h.tick(20000);
  assert.equal(old.error,undefined);assert.equal(old.value,false);
  assert.equal(h.qa.errors.length,0);assert.equal(h.status.dataset.phase,'ready');
  assert.ok(h.actions.every(button=>!button.disabled));
});

test('R4: old completion does not unlock or relabel a replacement still loading',async()=>{
  const h=await ready();observe(h.qa.runAction('basic'));await flush();
  h.state.autoNavigate=false;observe(h.qa.reset());await flush();await h.tick(600);
  assert.equal(h.qa.ready,false);assert.equal(h.status.dataset.phase,'loading');
  assert.equal(h.reset.disabled,true,'old completion cannot take the loading lock');
  h.navigate();await h.tick(100);assert.equal(h.qa.ready,true);
});
