const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

export function createBattlePresentationTrace(options={}) {
  const enabled=Boolean(options.enabled);
  const maxEvents=Math.max(1,Number(options.maxEvents||300));
  const list=[]; const actions=new Map();
  const push=(event)=>{if(!enabled)return;list.push({at:Date.now(),...clone(event)});if(list.length>maxEvents)list.shift();};
  const disabled=()=>({ok:false,code:'TRACE_DISABLED'});
  function begin(input={}){
    if(!enabled)return disabled();
    const id=String(input.actionId||'');
    if(!id)return {ok:false,code:'ACTION_ID_REQUIRED'};
    if(actions.has(id))return {ok:false,code:'ACTION_DUPLICATE'};
    const state={...clone(input),markers:new Map(),completed:false};actions.set(id,state);
    push({type:'action:start',actionId:id,roundId:input.roundId||null,actorId:input.actorId||null,targetIds:input.targetIds||[],skillId:input.skillId||null,position:input.position||null});
    return {ok:true,actionId:id};
  }
  function marker(type,input={}){
    if(!enabled)return disabled();
    const id=String(input.actionId||'');const state=actions.get(id);
    if(!state)return {ok:false,code:'ACTION_UNKNOWN'};
    const key=String(type);const count=Number(state.markers.get(key)||0)+1;state.markers.set(key,count);
    if(key==='impact'&&count>1){
      const last=list.slice().reverse().find(e=>e.type==='marker:impact'&&e.actionId===id);
      if(last)last.duplicateCount=count-1;
      return {ok:false,code:'MARKER_DUPLICATE',duplicateCount:count-1};
    }
    push({type:`marker:${key}`,actionId:id,targetId:input.targetId||null,position:input.position||null,duplicateCount:0});
    return {ok:true,actionId:id};
  }
  function complete(input={}){
    if(!enabled)return disabled();
    const id=String(input.actionId||'');const state=actions.get(id);
    if(!state)return {ok:false,code:'ACTION_UNKNOWN'};
    if(state.completed)return {ok:false,code:'COMPLETION_DUPLICATE'};
    state.completed=true;push({type:'action:complete',actionId:id,position:input.position||null});return {ok:true,actionId:id};
  }
  return {begin,marker,complete,events:()=>clone(list),snapshot:()=>({enabled,events:list.length,actions:[...actions.values()].map(a=>({actionId:a.actionId,completed:a.completed,markers:Object.fromEntries(a.markers)}))})};
}
