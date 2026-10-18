// Read the existing per-actor settlement ledger, never sum rendered text.
function beginActionDamageTotal(actor){
  const row=intelUnit(actor);
  return {battleId:state.battleId,actorId:actor.id,damage:Number(row?.damage)||0,healing:Number(row?.healing)||0};
}
function finishActionDamageTotal(before){
  if(!before||before.battleId!==state.battleId)return;
  const row=state.intelligence?.units?.[String(before.actorId)];
  showActionTotal((Number(row?.damage)||0)-before.damage,(Number(row?.healing)||0)-before.healing);
}
function resetActionDamageTotal(){
  clearTimeout(state.actionTotalTimer);
  if(dom.actionTotal)dom.actionTotal.hidden=true;
}
function showActionTotal(damage,healing){
  damage=Math.max(0,Math.round(Number(damage)||0));
  healing=Math.max(0,Math.round(Number(healing)||0));
  if(!dom.actionTotal)return;
  clearTimeout(state.actionTotalTimer);
  const healOnly=damage===0&&healing>0;
  dom.actionTotal.dataset.kind=healOnly?'heal':'damage';
  dom.actionTotal.dataset.damage=String(damage);
  dom.actionTotalLabel.textContent=healOnly?'Tổng trị liệu':'Tổng sát thương';
  dom.actionTotalValue.textContent=String(healOnly?healing:damage).padStart(3,'0');
  dom.actionTotal.hidden=false;
  const battleId=state.battleId;
  state.actionTotalTimer=setTimeout(()=>{
    if(state.battleId===battleId)dom.actionTotal.hidden=true;
  },1800);
}
