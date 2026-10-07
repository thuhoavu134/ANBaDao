// Presentation waits only. The existing turn/action/settlement owners still run.
const __hvSkipWaiters = new Set();
let __hvSkipSound = null, __hvSkipYieldCount = 0, __hvSkipLeaseSequence = 0;
function __hvIsSkipping() { return state.mode === 'battle' && state.instantSkip === state.battleId; }
function __hvSkipWait(ms, battleId) {
  const active = () => battleId === state.battleId;
  if (__hvIsSkipping()) {
    if (++__hvSkipYieldCount % 32) return Promise.resolve(active());
    return new Promise(resolve => setTimeout(() => resolve(active()), 0));
  }
  return new Promise(resolve => {
    let timer;
    const finish = () => { clearTimeout(timer); __hvSkipWaiters.delete(finish); resolve(active()); };
    __hvSkipWaiters.add(finish);
    timer = setTimeout(finish, Math.max(0, ms));
  });
}
function __hvSkipVisualAssets(prepare, battleId) {
  const empty = () => {
    const controller=new AbortController();
    return {taskId:`skip:${battleId}:${++__hvSkipLeaseSequence}`,signal:controller.signal,
      active:()=>!controller.signal.aborted&&state.battleId===battleId&&state.mode==='battle',
      release(){controller.abort();}};
  };
  if (__hvIsSkipping()) return Promise.resolve(empty());
  return new Promise((resolve,reject) => {
    let done = false;
    const skip = () => { if(done)return;done=true;__hvSkipWaiters.delete(skip);if(battleId!==state.battleId){reject(Object.assign(new Error("Battle changed"),{name:"AbortError"}));return;}resolve(empty()); };
    __hvSkipWaiters.add(skip);
    let pending;
    try{pending=prepare();}catch(error){__hvSkipWaiters.delete(skip);reject(error);return;}
    Promise.resolve(pending).then(lease => {
      __hvSkipWaiters.delete(skip);
      if(done){lease?.release?.();return;}
      done=true;resolve(lease);
    },error=>{__hvSkipWaiters.delete(skip);if(!done){done=true;reject(error);}});
  });
}
function __hvFinishSkip() {
  state.instantSkip = null;
  if(__hvSkipSound!==null){state.sound=__hvSkipSound;__hvSkipSound=null;}
  document.body.classList.remove('hv-skipping-battle');
  const button=document.getElementById('embeddedSkipButton');
  if(button){button.disabled=false;button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','Bỏ qua chiến đấu');button.title='Bỏ qua chiến đấu';}
  document.getElementById('hvSkipProgress')?.remove();
}
function __hvRequestBattleSkip() {
  if(state.mode!=='battle'||__hvIsSkipping())return false;
  state.instantSkip=state.battleId;state.skipAnimations=true;state.auto=true;
  __hvSkipSound=state.sound;state.sound=false;
  window.HonVietSfx?.stopCombat?.();
  if(typeof __hvCombatVoiceBus==='function')__hvCombatVoiceBus()?.stopCombat?.();
  document.body.classList.add('hv-skipping-battle');
  const button=document.getElementById('embeddedSkipButton');
  if(button){button.disabled=true;button.setAttribute('aria-pressed','true');}
  const progress=document.createElement('div');progress.id='hvSkipProgress';progress.setAttribute('role','status');progress.textContent='Đang tính kết quả…';
  progress.style.cssText='position:fixed;inset:0;z-index:200;display:grid;place-items:center;background:#102523;color:#f4dfaa;font:600 18px system-ui;';
  document.body.append(progress);
  for(const finish of [...__hvSkipWaiters])finish();
  // A paused manual turn has no pending scheduler continuation to wake.
  const actor=getUnit(state.currentId);
  if(!state.locked&&actor?.hp>0){state.locked=true;void __hvRunAiTurn(actor,state.battleId);}
  return true;
}
