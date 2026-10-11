export function patchAuthoredBattleSpeed(html) {
  function editFunction(name, next, edit) {
    const start=html.indexOf('function '+name+'('), end=html.indexOf('function '+next+'(',start+1);
    if(start<0||end<=start)throw new Error('Authored speed owner missing: '+name);
    html=html.slice(0,start)+edit(html.slice(start,end))+html.slice(end);
  }
  function once(body, from, to) {
    if(body.split(from).length!==2)throw new Error('Authored speed anchor missing or ambiguous: '+from);
    return body.replace(from,()=>to);
  }
  for(const hero of ['LinhDong','BachDien']){
    editFunction('begin'+hero+'Action','wait'+hero+'Marker',body=>once(body,'const info={','const info={playbackRate:(typeof QA_SLOW_MOTION!=="undefined"&&QA_SLOW_MOTION)?0.05:([1,2,3].includes(Number(state.speed))?Number(state.speed):1),'));
    editFunction('wait'+hero+'Marker','emit'+hero+'Release',body=>{
      body=once(body,'info.clock.advance(performance.now()-info.startedAt)','info.clock.advance(Math.max(0,performance.now()-info.startedAt)*(info.playbackRate||1))');
      return once(body,'Math.min(remaining,40)','Math.min(remaining/(info.playbackRate||1),40)');
    });
    editFunction('start'+hero+'Fx','draw'+hero+'Fx',body=>once(body,'startedAt:info?.startedAt||performance.now(),','startedAt:info?.startedAt??performance.now(),playbackRate:info?.playbackRate||1,'));
    // Both the actor and its VFX advance the same authored-time controller.
    // Markers remain in authored milliseconds; only wall time is scaled.
    const start=html.indexOf('function draw'+hero+'Fx(');
    const end=html.indexOf('\n}',start)+2;
    if(start<0||end<=start)throw new Error('Missing VFX speed owner: '+hero);
    const body=once(html.slice(start,end),'fx.clock.advance(Math.max(0,performance.now()-fx.startedAt))','fx.clock.advance(Math.max(0,performance.now()-fx.startedAt)*(fx.playbackRate||1))');
    html=html.slice(0,start)+body+html.slice(end);
  }
  return html;
}
