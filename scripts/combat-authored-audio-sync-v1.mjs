import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const path=join(process.cwd(),'dist','battle.html');
let html=readFileSync(path,'utf8');
const MARKER='/* HV_COMBAT_AUTHORED_AUDIO_SYNC_V1 */';
if(html.includes(MARKER))throw new Error('Authored audio sync patch applied twice');
if(!html.includes('AUTHORED_COMBAT_AUDIO_SYNC_V1')||!html.includes('__hvScheduleAuthoredSfx'))throw new Error('Authored audio scheduler source helper missing');

const diagnostics=[];
function replaceOne(from,to,label){
  const count=html.split(from).length-1;
  diagnostics.push({label,count});
  if(count!==1)throw new Error('AUTHORED_AUDIO_SYNC_ANCHOR:'+label+':'+count);
  html=html.replace(from,to);
}

// Lục Ảnh: audible onset follows the actual release/VFX start; Ultimate voice stays independent.
replaceOne('setUnitState(actor,"attack",LUC_ANH_META.attack.frames*LUC_ANH_META.attack.ms);playActionSound(actor,action);',
  'setUnitState(actor,"attack",LUC_ANH_META.attack.frames*LUC_ANH_META.attack.ms);void __hvScheduleAuthoredSfx(actor,action,performance.now()+900,"release:first-projectile",phase1ActionId,__hvActionAssets?.signal||null,"onset");',
  'luc-anh-basic');
replaceOne('setUnitState(actor,"skill1",LUC_ANH_META.skill1.frames*LUC_ANH_META.skill1.ms);playActionSound(actor,action);',
  'setUnitState(actor,"skill1",LUC_ANH_META.skill1.frames*LUC_ANH_META.skill1.ms);void __hvScheduleAuthoredSfx(actor,action,performance.now()+900,"release:first-vfx",phase1ActionId,__hvActionAssets?.signal||null,"onset");',
  'luc-anh-skill');
replaceOne('setUnitState(actor,"ultimate",LUC_ANH_META.ultimate.frames*LUC_ANH_META.ultimate.ms);playLucAnhUltimateVoice();',
  'setUnitState(actor,"ultimate",LUC_ANH_META.ultimate.frames*LUC_ANH_META.ultimate.ms);playLucAnhUltimateVoice();void __hvScheduleAuthoredSfx(actor,action,performance.now()+980,"release:first-vfx",phase1ActionId,__hvActionAssets?.signal||null,"onset");',
  'luc-anh-ultimate');

// Đình Lôi: first authored projectile/wave/VFX frame is the release cue.
replaceOne('setUnitState(actor,"attack",DINH_LOI_ACTION_MS);playActionSound(actor,action);',
  'setUnitState(actor,"attack",DINH_LOI_ACTION_MS);void __hvScheduleAuthoredSfx(actor,action,performance.now()+1550,"release:first-projectile",phase1ActionId,__hvActionAssets?.signal||null,"onset");',
  'dinh-loi-basic');
replaceOne('setUnitState(actor,"skill1",DINH_LOI_ACTION_MS);playActionSound(actor,action);',
  'setUnitState(actor,"skill1",DINH_LOI_ACTION_MS);void __hvScheduleAuthoredSfx(actor,action,performance.now()+1500,"release:first-wave",phase1ActionId,__hvActionAssets?.signal||null,"onset");',
  'dinh-loi-skill');
replaceOne('setUnitState(actor,"ultimate",DINH_LOI_ACTION_MS);playActionSound(actor,action);',
  'setUnitState(actor,"ultimate",DINH_LOI_ACTION_MS);void __hvScheduleAuthoredSfx(actor,action,performance.now()+1250,"release:first-vfx",phase1ActionId,__hvActionAssets?.signal||null,"onset");',
  'dinh-loi-ultimate');

// Ông Phở: effect is in the authored sheet. Align the strongest sound cue to the sheet contact frame.
replaceOne(
  'setUnitState(actor, "skill1", ONG_PHO_SKILL1_MS); playActionSound(actor, action);\n        const dashDelay=ongPhoSkill1FrameTime(ONG_PHO_SKILL1_DASH_START_FRAME);\n        const dashMs=ongPhoSkill1FrameTime(ONG_PHO_SKILL1_DASH_END_FRAME)-dashDelay;\n        const impactAt=ongPhoSkill1FrameTime(ONG_PHO_SKILL1_IMPACT_FRAME);',
  'setUnitState(actor, "skill1", ONG_PHO_SKILL1_MS);\n        const dashDelay=ongPhoSkill1FrameTime(ONG_PHO_SKILL1_DASH_START_FRAME);\n        const dashMs=ongPhoSkill1FrameTime(ONG_PHO_SKILL1_DASH_END_FRAME)-dashDelay;\n        const impactAt=ongPhoSkill1FrameTime(ONG_PHO_SKILL1_IMPACT_FRAME);\n        const __hvOngPhoSkillAudioStart=performance.now();\n        void __hvScheduleAuthoredSfx(actor,action,__hvOngPhoSkillAudioStart+dashDelay+motionDuration(dashMs)+Math.max(0,impactAt-dashDelay-dashMs),"contact:sheet-frame-"+ONG_PHO_SKILL1_IMPACT_FRAME,phase1ActionId,__hvActionAssets?.signal||null,"dominant");',
  'ong-pho-skill');
replaceOne(
  'setUnitState(actor, "ultimate", ONG_PHO_ULTIMATE_MS); playActionSound(actor, action);\n        const dashStartAt = ongPhoUltimateFrameTime(ONG_PHO_ULTIMATE_DASH_START_FRAME);\n        const dashEndAt = ongPhoUltimateFrameTime(ONG_PHO_ULTIMATE_DASH_END_FRAME);\n        const impactAt = ongPhoUltimateFrameTime(ONG_PHO_ULTIMATE_IMPACT_FRAME);',
  'setUnitState(actor, "ultimate", ONG_PHO_ULTIMATE_MS);\n        const dashStartAt = ongPhoUltimateFrameTime(ONG_PHO_ULTIMATE_DASH_START_FRAME);\n        const dashEndAt = ongPhoUltimateFrameTime(ONG_PHO_ULTIMATE_DASH_END_FRAME);\n        const impactAt = ongPhoUltimateFrameTime(ONG_PHO_ULTIMATE_IMPACT_FRAME);\n        const __hvOngPhoUltAudioStart=performance.now();\n        void __hvScheduleAuthoredSfx(actor,action,__hvOngPhoUltAudioStart+dashStartAt+motionDuration(dashEndAt-dashStartAt)+Math.max(0,impactAt-dashEndAt),"contact:sheet-frame-"+ONG_PHO_ULTIMATE_IMPACT_FRAME,phase1ActionId,__hvActionAssets?.signal||null,"dominant");',
  'ong-pho-ultimate');
replaceOne(
  'setUnitState(actor,"attack",ONG_PHO_ATTACK_MS+ONG_PHO_ENTRY_BLEND_MS+ONG_PHO_ENTRY_HOLD_MS); playActionSound(actor,action);\n        const dashDelay=ongPhoFrameTime(ONG_PHO_DASH_START_FRAME); const dashMs=ongPhoFrameTime(ONG_PHO_DASH_END_FRAME)-dashDelay;',
  'setUnitState(actor,"attack",ONG_PHO_ATTACK_MS+ONG_PHO_ENTRY_BLEND_MS+ONG_PHO_ENTRY_HOLD_MS);\n        const dashDelay=ongPhoFrameTime(ONG_PHO_DASH_START_FRAME); const dashMs=ongPhoFrameTime(ONG_PHO_DASH_END_FRAME)-dashDelay;\n        const __hvOngPhoBasicAudioStart=performance.now();\n        void __hvScheduleAuthoredSfx(actor,action,__hvOngPhoBasicAudioStart+dashDelay+motionDuration(dashMs)+Math.max(0,ONG_PHO_IMPACT_MS-dashDelay-dashMs),"contact:sheet-frame-"+ONG_PHO_IMPACT_FRAME,phase1ActionId,__hvActionAssets?.signal||null,"dominant");',
  'ong-pho-basic');
replaceOne(
  'setUnitState(actor,"attack",ONG_PHO_ATTACK_MS+ONG_PHO_ENTRY_BLEND_MS+ONG_PHO_ENTRY_HOLD_MS);\n        playActionSound(actor,"basic");\n        const dashDelay=ongPhoFrameTime(ONG_PHO_DASH_START_FRAME);\n        const dashMs=ongPhoFrameTime(ONG_PHO_DASH_END_FRAME)-dashDelay;',
  'setUnitState(actor,"attack",ONG_PHO_ATTACK_MS+ONG_PHO_ENTRY_BLEND_MS+ONG_PHO_ENTRY_HOLD_MS);\n        const dashDelay=ongPhoFrameTime(ONG_PHO_DASH_START_FRAME);\n        const dashMs=ongPhoFrameTime(ONG_PHO_DASH_END_FRAME)-dashDelay;\n        const __hvOngPhoSecondAudioStart=performance.now();\n        void __hvScheduleAuthoredSfx(actor,"basic",__hvOngPhoSecondAudioStart+dashDelay+motionDuration(dashMs)+Math.max(0,ONG_PHO_IMPACT_MS-dashDelay-dashMs),"contact:sheet-frame-"+ONG_PHO_IMPACT_FRAME,phase1ActionId+":chain2",__hvActionAssets?.signal||null,"dominant");',
  'ong-pho-basic-chain2');

// Thầy Mo production keeps its authored Skill1 mapping for Basic/Skill; schedule before release to offset file lead-in.
replaceOne(
  "      setUnitState(actor,action==='ultimate'?'ultimate':'skill1',thayMoAction.totalMs);\n      if(!await waitThayMoAuthoredMarker(thayMoAction,'release',battleId))return;\n      phase1Trace?.marker('release',{actionId:phase1ActionId,position:{x:actor.x,y:actor.y}});\n      playActionSound(actor,action);\n      if(!await waitThayMoAuthoredMarker(thayMoAction,'impact',battleId))return;",
  "      setUnitState(actor,action==='ultimate'?'ultimate':'skill1',thayMoAction.totalMs);\n      void __hvScheduleAuthoredSfx(actor,action,thayMoAction.started+thayMoAction.releaseAt,'release:authored-marker',phase1ActionId,__hvActionAssets?.signal||null,'onset');\n      if(!await waitThayMoAuthoredMarker(thayMoAction,'release',battleId))return;\n      phase1Trace?.marker('release',{actionId:phase1ActionId,position:{x:actor.x,y:actor.y}});\n      if(!await waitThayMoAuthoredMarker(thayMoAction,'impact',battleId))return;",
  'thay-mo-release');



function bindSplusAudioClock({title,hero,cap}){
  replaceOne(
    `function begin${title}Action(actor,action,target,battleId){`,
    `function begin${title}Action(actor,action,target,battleId,actionId=null){`,
    hero+'-begin-signature'
  );
  replaceOne(
    'const info={action:normalized,actorId:actor.id,targetId:target?.id||null,battleId,startedAt:performance.now(),releasePlayed:false,impactResolved:false,clock:null};',
    'const info={action:normalized,actorId:actor.id,targetId:target?.id||null,battleId,actionId,startedAt:performance.now(),releasePlayed:false,impactResolved:false,clock:null};',
    hero+'-action-id'
  );
  replaceOne(
    `info.assetSignal=actor._hvAssetLease?.signal;
  info.clock=create${title}TimelineController(normalized,`,
    `info.assetSignal=actor._hvAssetLease?.signal;
  void play${title}Sfx(normalized,info);
  info.clock=create${title}TimelineController(normalized,`,
    hero+'-pre-schedule'
  );
  replaceOne(
    `function play${title}Sfx(action,info){
  const normalized=normalize${title}Action(action);
  if(!normalized)return Promise.resolve(false);
  return __hvBattleAssets.playSfx(info||{battleId:state.battleId},normalized==='ultimate'?'${hero}-ult':'${hero}-atk');
}`,
    `function play${title}Sfx(action,info){
  const normalized=normalize${title}Action(action);
  if(!normalized)return Promise.resolve(false);
  const timeline=${cap}_TIMELINE[normalized];
  const item=info||{battleId:state.battleId,startedAt:performance.now(),actionId:null};
  const cuePerformanceMs=(Number(item.startedAt)||performance.now())+(Number(timeline?.releaseMs)||0);
  return __hvBattleAssets.playSfx(item,normalized==='ultimate'?'${hero}-ult':'${hero}-atk',{actionId:item.actionId||null,cue:'release:authored-marker',cuePerformanceMs,sampleCue:'onset'});
}`,
    hero+'-timed-play-owner'
  );
  replaceOne(
    `info.releasePlayed=true;info.clock.advance(${cap}_TIMELINE[info.action].releaseMs);start${title}Fx(info.action,getUnit(info.actorId),getUnit(info.targetId),info);play${title}Sfx(info.action,info);return true;`,
    `info.releasePlayed=true;info.clock.advance(${cap}_TIMELINE[info.action].releaseMs);start${title}Fx(info.action,getUnit(info.actorId),getUnit(info.targetId),info);return true;`,
    hero+'-release-no-replay'
  );
}

bindSplusAudioClock({title:'LinhDong',hero:'linh-dong',cap:'LINH_DONG'});
bindSplusAudioClock({title:'BachDien',hero:'bach-dien',cap:'BACH_DIEN'});

replaceOne(
  'const linhAction=beginLinhDongAction(actor,action,target,battleId);',
  'const linhAction=beginLinhDongAction(actor,action,target,battleId,phase1ActionId);',
  'linh-dong-canonical-action-id'
);
replaceOne(
  "const linhAction=linh&&typeof beginLinhDongAction==='function'?beginLinhDongAction(actor,action,target,battleId):null;",
  "const linhAction=linh&&typeof beginLinhDongAction==='function'?beginLinhDongAction(actor,action,target,battleId,presentationId):null;",
  'linh-dong-splus-action-id'
);
replaceOne(
  'const bachAction=beginBachDienAction(actor,action,target,battleId);',
  'const bachAction=beginBachDienAction(actor,action,target,battleId,phase1ActionId);',
  'bach-dien-canonical-action-id'
);
replaceOne(
  "const bachAction=!linhAction&&bach&&typeof beginBachDienAction==='function'?beginBachDienAction(actor,action,target,battleId):null;",
  "const bachAction=!linhAction&&bach&&typeof beginBachDienAction==='function'?beginBachDienAction(actor,action,target,battleId,presentationId):null;",
  'bach-dien-splus-action-id'
);

// Remove only the legacy injected Lục Ảnh ultimate SFX if an earlier audio patch added it next to the guaranteed voice call.
html=html.replace('window.__playLucAnhUltimateVoiceGuaranteed?.();playActionSound(actor,"ultimate");','window.__playLucAnhUltimateVoiceGuaranteed?.();');

const validation={
  lucImmediate:/LUC_ANH_META\.attack\.frames\*LUC_ANH_META\.attack\.ms\);playActionSound/.test(html),
  dinhImmediate:/DINH_LOI_ACTION_MS\);playActionSound/.test(html),
  ongImmediate:/ONG_PHO_SKILL1_MS\); playActionSound/.test(html),
  splusReleaseReplay:/start(?:LinhDong|BachDien)Fx\([^;]+;play(?:LinhDong|BachDien)Sfx/.test(html),
  splusTimedOwners:['linh-dong-atk','linh-dong-ult','bach-dien-atk','bach-dien-ult'].every(event=>html.includes(event)) &&
    html.includes("cue:'release:authored-marker'"),
  contactCue:html.includes('contact:sheet-frame-'),
  releaseCue:html.includes('release:authored-marker')
};
if(validation.lucImmediate||validation.dinhImmediate||validation.ongImmediate||validation.splusReleaseReplay||!validation.splusTimedOwners||!validation.contactCue||!validation.releaseCue){
  throw new Error('AUTHORED_AUDIO_SYNC_VALIDATION:'+JSON.stringify(validation));
}
const diagnosticMarker='<!-- HV_AUDIO_SYNC_DIAGNOSTICS '+encodeURIComponent(JSON.stringify({diagnostics,validation}))+' -->';
html=html.replace('</body>',MARKER+'\n'+diagnosticMarker+'\n</body>');
writeFileSync(path,html);
console.log('Authored combat SFX synchronized to release/contact cues with decoded lead-in compensation.');
