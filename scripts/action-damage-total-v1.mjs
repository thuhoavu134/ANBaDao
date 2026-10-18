import {readFileSync} from 'node:fs';
import {join} from 'node:path';
export function patchActionDamageTotal(html,runtime,css){
  if(html.includes('/* HV_ACTION_DAMAGE_TOTAL_V1 */'))return html;
  const once=(from,to)=>{
    if(html.split(from).length!==2)throw Error('Action damage anchor missing/ambiguous: '+from);
    html=html.replace(from,()=>to);
  };
  const start=html.indexOf('  function showActionTotal(damage, healing) {');
  const end=html.indexOf('\n  function updateTeamCounters()',start);
  if(start<0||end<0)throw Error('Existing action total owner missing');
  // Legacy already calls this owner at recovery. Add equivalent S+ hooks below.
  html=html.slice(0,start)+'/* HV_ACTION_DAMAGE_TOTAL_V1 */\n'+runtime+'\n'+html.slice(end);
  once('    state.round = 0;','    resetActionDamageTotal();\n    state.round = 0;');
  for(const signature of ['async function performSplusAction(actor, action, target) {','async function performCoNuongAction(actor,action,target,e,battleId){']){
    once(signature,signature+'\n  const actionDamageBefore=beginActionDamageTotal(actor);');
  }
  const completion="setUnitState(actor,'idle',800);state.currentId=null;state.locked=false;";
  if(html.split(completion).length!==3)throw Error('Expected both authored S+ recovery owners');
  html=html.split(completion).join('finishActionDamageTotal(actionDamageBefore);\n  '+completion);
  once('</head>','<style id="action-damage-total-style">'+css+'</style></head>');
  return html;
}
export function actionDamageTotalSources(root){
  return [readFileSync(join(root,'src/runtime/action-damage-total.js'),'utf8'),readFileSync(join(root,'src/ui/action-damage-total.css'),'utf8')];
}
