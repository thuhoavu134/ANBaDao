const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

export function createBattlePresentationController(options={}) {
  const enabled=Boolean(options.enabled), maxEvents=Math.max(1,Number(options.maxEvents||300));
  const events=[]; const actions=new Map();
  const disabled=()=>({ok:false,code:'TRACE_DISABLED'});
  const push=event=>{if(!enabled)return;events.push({at:Date.now(),...clone(event)});if(events.length>maxEvents)events.shift();};
  function start(input={}){
    if(!enabled)return disabled();
    const actionId=String(input.actionId||'');if(!actionId)return {ok:false,code:'ACTION_ID_REQUIRED'};
    if(actions.has(actionId))return {ok:false,code:'ACTION_DUPLICATE'};
    const state={...clone(input),markers:new Map(),completed:false};actions.set(actionId,state);
    push({type:'action:start',actionId,roundId:input.roundId||null,actorId:input.actorId||null,targetIds:input.targetIds||[],skillId:input.skillId||null,position:input.position||null});
    return {ok:true,actionId};
  }
  function marker(kind,input={}){
    if(!enabled)return disabled();
    const actionId=String(input.actionId||''),state=actions.get(actionId);if(!state)return {ok:false,code:'ACTION_UNKNOWN'};
    const count=Number(state.markers.get(kind)||0)+1;state.markers.set(kind,count);
    if(kind==='impact'&&count>1){const previous=events.slice().reverse().find(e=>e.type==='marker:impact'&&e.actionId===actionId);if(previous)previous.duplicateCount=count-1;return {ok:false,code:'MARKER_DUPLICATE',duplicateCount:count-1};}
    push({type:`marker:${kind}`,actionId,targetId:input.targetId||null,position:input.position||null,duplicateCount:0});return {ok:true,actionId};
  }
  function complete(input={}){
    if(!enabled)return disabled();
    const actionId=String(input.actionId||''),state=actions.get(actionId);if(!state)return {ok:false,code:'ACTION_UNKNOWN'};
    if(state.completed)return {ok:false,code:'COMPLETION_DUPLICATE'};state.completed=true;push({type:'action:complete',actionId,position:input.position||null});return {ok:true,actionId};
  }
  function cancel(input={}){if(!enabled)return disabled();const actionId=String(input.actionId||''),state=actions.get(actionId);if(!state)return {ok:false,code:'ACTION_UNKNOWN'};state.cancelled=true;push({type:'action:cancel',actionId,reason:input.reason||'cancelled'});return {ok:true,actionId};}
  return {start,begin:start,marker,complete,cancel,events:()=>clone(events),snapshot:()=>({enabled,events:events.length,actions:[...actions.values()].map(a=>({actionId:a.actionId,completed:a.completed,cancelled:Boolean(a.cancelled),markers:Object.fromEntries(a.markers)}))})};
}
