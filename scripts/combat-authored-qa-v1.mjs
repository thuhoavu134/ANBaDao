import { readFileSync, writeFileSync } from 'node:fs';
const path = 'dist/battle.html';
let html = readFileSync(path,'utf8');
const anchor = '  globalThis.__HON_VIET__ = Object.freeze({';
if(html.split(anchor).length!==2)throw new Error('AUTHORED_QA_API_ANCHOR');
html=html.replace(anchor,anchor+`
    // Opt-in QA drives the same production owner, without presentation mocks.
    qaForceAuthoredAction: async(id,action='basic')=>{
      if(!new URLSearchParams(location.search).has('qaPhase01'))return false;
      const actor=getUnit(id),foes=actor?living(actor.team===TEAM_PLAYER?TEAM_ENEMY:TEAM_PLAYER):[];
      if(!actor||actor.hp<=0||!foes.length||state.mode!=='battle')return false;
      const target=Core.preferredOppositeTarget(actor,foes,{ignoreFormation:true})||foes[0];
      state.battleId+=1;state.locked=false;state.currentId=actor.id;state.auto=false;
      actor.energy=100;actor.accuracy=10000;
      if(action==='skill'&&!isLinhDong(actor)&&!isBachDien(actor))actor._talentSkillActive=true;
      updateActorHud(actor);await performAction(actor,action,target);return true;
    },
`);
writeFileSync(path,html);
