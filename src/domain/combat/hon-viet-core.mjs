// Single source of truth for the Hồn Việt combat rule core (HonVietCore).
// Relocated verbatim from battle.html script #1 (TKT-0161, 2026-09-28):
// battle.html no longer owns this text — the build injects it from here and
// fails when the inline copy drifts. Edit rules in THIS file only.
//
// UMD: in a browser the else-branch sets globalThis.HonVietCore; under the
// build/tests a module shim captures the api for direct ESM use.

const moduleShim = { exports: {} };
(function (module) {
// __HV_CORE_UMD_START
(function attachHonVietCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.HonVietCore = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createCore() {
  "use strict";

  const ACTION_COSTS = Object.freeze({ basic: 0, skill: 25, ultimate: 60 });
  const STANDARD_ROUND_LIMIT = 15;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function hpRatio(unit) {
    return unit.maxHp > 0 ? clamp(unit.hp / unit.maxHp, 0, 1) : 0;
  }

  function statusPower(unit, type, fallback = 0) {
    return (unit.statuses || []).filter((status) => status.type === type).reduce((sum, status) => sum + (Number(status.power) || fallback), 0);
  }

  function effectiveStat(unit, stat) {
    const base = Math.max(0, Number(unit?.[stat]) || 0);
    let multiplier = 1;
    for (const status of unit?.statuses || []) {
      if (status.type === `${stat}Up`) multiplier += Number(status.power) || 0;
      if (status.type === `${stat}Down`) multiplier -= Number(status.power) || 0;
    }
    if (stat === "def" && unit?.statuses?.some((status) => status.type === "armorBreak")) multiplier -= 0.32;
    return Math.max(stat === "atk" ? 1 : 0, base * Math.max(0.2, multiplier));
  }

  function statOrDefault(unit, name, fallback) {
    return unit?.[name] != null && Number.isFinite(Number(unit[name]))
      ? Math.max(0, effectiveStat(unit, name)) : fallback;
  }

  function hitChance(attacker, target) {
    const accuracy = statOrDefault(attacker, "accuracy", 100);
    const evasion = statOrDefault(target, "evasion", 5);
    const speedEdge = clamp(((Number(attacker?.speed)||0) - (Number(target?.speed)||0)) * 0.001, -0.06, 0.06);
    return clamp(0.82 + (accuracy - 100) * 0.0025 - evasion * 0.006 + speedEdge + (battlefieldZone(attacker).hit||0), 0.55, 0.98);
  }

  function critChance(attacker, target) {
    const crit = statOrDefault(attacker, "crit", 8);
    const resist = statOrDefault(target, "critRes", 5);
    return clamp((crit - resist) / 100 + (battlefieldZone(attacker).crit||0), 0.02, 0.72);
  }


  const ENEMY_ROLE_DEFS = Object.freeze({
    bulwark:{id:"bulwark",name:"HỘ VỆ",desc:"Giữ tuyến trước, ưu tiên bảo vệ đội hình."},
    hunter:{id:"hunter",name:"TRUY KÍCH",desc:"Săn mục tiêu yếu hoặc đang tích nhiều Nộ."},
    assassin:{id:"assassin",name:"XUYÊN TUYẾN",desc:"Tìm cách áp sát hậu tuyến bằng kỹ năng."},
    artillery:{id:"artillery",name:"HỎA LỰC",desc:"Ưu tiên mục tiêu hậu tuyến và mục tiêu giá trị cao."},
    controller:{id:"controller",name:"KHỐNG CHẾ",desc:"Ưu tiên mục tiêu nhiều Nộ hoặc đang chuẩn bị bùng nổ."},
    support:{id:"support",name:"HẬU CẦN",desc:"Giữ đồng minh chủ chốt sống lâu hơn."}
  });
  const ENEMY_FORMATIONS = Object.freeze({
    bastion:{id:"bastion",name:"THẾ THỦ THÀNH",desc:"Hộ vệ giữ tuyến, hậu cần ưu tiên cứu chủ lực."},
    spearhead:{id:"spearhead",name:"MŨI XUYÊN PHÁ",desc:"Truy kích và xuyên tuyến săn mục tiêu yếu."},
    suppression:{id:"suppression",name:"ÉP HẬU TUYẾN",desc:"Hỏa lực và khống chế ưu tiên Nộ cao/hậu tuyến."}
  });
  const ENEMY_ELITE_TRAITS = Object.freeze({
    mysticArmor:{id:"mysticArmor",name:"HUYỀN GIÁP",desc:"Đòn Kỹ năng/Tuyệt kỹ đầu tiên mỗi lượt nhận −18% sát thương, trừ khi đã bị Đánh thường phá giáp trước đó."},
    counterRhythm:{id:"counterRhythm",name:"PHẢN NHỊP",desc:"Hai đòn liên tiếp cùng loại hành động trong một lượt: từ đòn thứ hai giảm 12% sát thương; đổi loại hành động sẽ phá nhịp."},
    rageReservoir:{id:"rageReservoir",name:"TỤ NỘ",desc:"Đầu lượt nhận +8 Nộ; nếu đang bị Choáng/Sợ hãi thì không nhận và mất 6 Nộ thay vào đó."}
  });
  const ENEMY_ELITE_CYCLES = Object.freeze({
    eliminate:["mysticArmor","counterRhythm","rageReservoir"],
    priority:["mysticArmor","rageReservoir","counterRhythm"],
    survive:["rageReservoir","counterRhythm","mysticArmor"],
    protect:["rageReservoir","mysticArmor","counterRhythm"],
    ritual:["counterRhythm","mysticArmor","rageReservoir"]
  });
  function enemyEliteTraitDef(id){return ENEMY_ELITE_TRAITS[id]||null;}
  function enemyEliteCount(enemyCount){const n=Math.max(0,Math.floor(Number(enemyCount)||0));return n>=6?2:n>=4?1:0;}
  function assignEnemyEliteTraits(units=[],objectiveType="eliminate",bossId=null){
    const enemies=(units||[]).filter(u=>u&&u.team==="enemy"&&u.hp>0);
    for(const u of enemies){delete u.eliteTrait;delete u.eliteTraitState;}
    const count=enemyEliteCount(enemies.length);if(!count)return [];
    const candidates=enemies.filter(u=>String(u.id)!==String(bossId||"")).slice().sort((a,b)=>(Number(b.atk)||0)-(Number(a.atk)||0)||(Number(a.slot)||0)-(Number(b.slot)||0));
    const cycle=ENEMY_ELITE_CYCLES[objectiveType]||ENEMY_ELITE_CYCLES.eliminate;const out=[];
    for(let i=0;i<Math.min(count,candidates.length);i+=1){const unit=candidates[i],id=cycle[i%cycle.length];unit.eliteTrait=id;unit.eliteTraitState={brokenRound:-1,wardRound:-1,lastAction:null,lastActionRound:-1,turns:0,triggered:0};out.push({unitId:unit.id,traitId:id});}
    return out;
  }
  function enemyEliteDamageResponse(target,action="basic",round=0){
    const def=enemyEliteTraitDef(target?.eliteTrait);if(!def)return {multiplier:1,event:null,trait:null};
    const st=target.eliteTraitState||(target.eliteTraitState={brokenRound:-1,wardRound:-1,lastAction:null,lastActionRound:-1,turns:0,triggered:0});
    const r=Math.max(0,Number(round)||0),kind=["basic","skill","ultimate"].includes(String(action))?String(action):"basic";let mult=1,event=null;
    if(def.id==="mysticArmor"){
      if(kind==="basic"){if(st.brokenRound!==r){st.brokenRound=r;event="armor-broken";st.triggered+=1;}}
      else if(st.brokenRound!==r&&st.wardRound!==r){st.wardRound=r;mult=.82;event="armor-guard";st.triggered+=1;}
    }else if(def.id==="counterRhythm"){
      if(st.lastActionRound===r&&st.lastAction===kind){mult=.88;event="counter-rhythm";st.triggered+=1;}
      st.lastAction=kind;st.lastActionRound=r;
    }
    return {multiplier:mult,event,trait:def.id,name:def.name};
  }
  function enemyEliteTurnStart(unit){
    const def=enemyEliteTraitDef(unit?.eliteTrait);if(!def||def.id!=="rageReservoir"||!unit||unit.hp<=0)return {delta:0,event:null,trait:def?.id||null};
    const st=unit.eliteTraitState||(unit.eliteTraitState={brokenRound:-1,wardRound:-1,lastAction:null,lastActionRound:-1,turns:0,triggered:0});st.turns+=1;
    const controlled=(unit.statuses||[]).some(x=>["stun","fear"].includes(String(x?.type)));
    if(controlled){const loss=Math.min(6,Math.max(0,Number(unit.energy)||0));unit.energy=Math.max(0,(Number(unit.energy)||0)-loss);st.triggered+=1;return {delta:-loss,event:"reservoir-broken",trait:def.id};}
    const before=Math.max(0,Number(unit.energy)||0),after=clamp(before+8,0,100);unit.energy=after;const delta=after-before;if(delta>0)st.triggered+=1;return {delta,event:delta>0?"reservoir-gain":null,trait:def.id};
  }
  function enemyEliteTelemetry(units=[]){return (units||[]).filter(u=>u?.eliteTrait).map(u=>({unitId:u.id,traitId:u.eliteTrait,triggered:Number(u.eliteTraitState?.triggered)||0,turns:Number(u.eliteTraitState?.turns)||0}));}
  const REINFORCEMENT_WAVES = Object.freeze({
    eliminate:{id:"eliminate",name:"LÀN SÓNG VIỆN BINH",desc:"Khi đợt đầu bị quét sạch, lực lượng dự bị tiến vào một lần. Viện binh yếu hơn quân chủ lực và không mang Đặc Tính Tinh Anh.",hpScale:.72,atkScale:.88,defScale:.92,energy:18}
  });
  function reinforcementReserveCount(enemyCount,objectiveType="eliminate"){
    // v3.22.0: mỗi lần người chơi bấm tiếp là một encounter mới.
    // Không tái sinh quân địch thành wave thứ hai trong cùng một trận.
    return 0;
  }
  function createReinforcementWaveState(objectiveType="eliminate",enemyCount=0){
    const totalReserve=reinforcementReserveCount(enemyCount,objectiveType);
    return {enabled:totalReserve>0,objectiveType,totalReserve,reserve:totalReserve,wave:1,maxWave:totalReserve>0?2:1,pending:false,triggered:false,arrived:0,history:[]};
  }
  function canDeployReinforcementWave(state){return Boolean(state?.enabled&&!state.pending&&!state.triggered&&Number(state.reserve)>0);}
  function reinforcementWaveDef(objectiveType="eliminate"){return REINFORCEMENT_WAVES[objectiveType]||null;}

  function enemyRoleFor(unit){
    const a=String(unit?.archetype||"");
    if(a==="guardian") return "bulwark";
    if(a==="healer") return "support";
    if(a==="duelist") return "assassin";
    if(a==="ranger") return "artillery";
    if(a==="mystic") return "controller";
    return "hunter";
  }
  function enemyFormationForObjective(type){
    if(["survive","protect"].includes(type)) return "spearhead";
    if(["priority","ritual"].includes(type)) return "suppression";
    return "bastion";
  }
  function enemyRolePriorityTarget(actor, legal=[], formation="bastion"){
    const candidates=legal.filter(u=>u&&u.hp>0); if(!candidates.length)return null;
    const role=enemyRoleFor(actor), byWeak=(a,b)=>hpRatio(a)-hpRatio(b)||a.slot-b.slot;
    if(formation==="spearhead"&&["bulwark","hunter"].includes(role)){const anchors=candidates.filter(u=>heroTacticalRoleFor(u)==="protector"&&["vanguard","cover"].includes(battlefieldZone(u)?.id));if(anchors.length)return anchors.slice().sort(byWeak)[0];}
    if(role==="assassin"){const back=candidates.filter(u=>u.slot>=3); if(back.length)return back.slice().sort(byWeak)[0]; return candidates.slice().sort(byWeak)[0];}
    if(role==="artillery"){const back=candidates.filter(u=>u.slot>=3); const pool=back.length?back:candidates; return pool.slice().sort((a,b)=>(b.energy||0)-(a.energy||0)||byWeak(a,b))[0];}
    if(role==="controller")return candidates.slice().sort((a,b)=>(b.energy||0)-(a.energy||0)||byWeak(a,b))[0];
    if(role==="hunter")return candidates.slice().sort(byWeak)[0];
    if(role==="bulwark")return preferredOppositeTarget(actor,candidates,{ignoreFormation:true})||candidates[0];
    if(formation==="suppression")return candidates.slice().sort((a,b)=>(b.energy||0)-(a.energy||0)||byWeak(a,b))[0];
    return preferredOppositeTarget(actor,candidates,{ignoreFormation:true})||candidates[0];
  }

  const HERO_TACTICAL_ROLE_DEFS = Object.freeze({
    vanguard:{id:"vanguard",name:"TIÊN PHONG",desc:"Mở nhịp từ vị trí áp lực để tạo Thế Trận."},
    protector:{id:"protector",name:"HỘ VỆ",desc:"Che mục tiêu Hộ Tống khi đứng ở vùng phòng thủ phù hợp."},
    controller:{id:"controller",name:"KHỐNG CHẾ",desc:"Khống chế thành công làm giảm thêm Nộ mục tiêu."},
    enabler:{id:"enabler",name:"KIẾN TẠO",desc:"Hành động hỗ trợ truyền Nộ cho đồng đội đang thiếu nhất."},
    finisher:{id:"finisher",name:"KẾT LIỄU",desc:"Kỹ năng gây sát thương mạnh hơn lên mục tiêu dưới 35% HP."},
    breaker:{id:"breaker",name:"PHÁ TUYẾN",desc:"Skill/Tuyệt kỹ tăng hiệu quả khi đánh tuyến trước hoặc Hộ Vệ."}
  });
  function heroTacticalRoleFor(unit){
    const role=String(unit?.roleClass||unit?.archetype||"");
    if(role==="guardian")return "protector";
    if(role==="mystic")return "controller";
    if(role==="healer"||role==="support")return "enabler";
    if(role==="duelist")return "breaker";
    if(role==="ranger")return "vanguard";
    return "finisher";
  }
  function heroTacticalDamageMultiplier(actor,target,action="basic"){
    if(actor?.team!=="player"||!target)return 1;
    const role=heroTacticalRoleFor(actor), nonBasic=action!=="basic";
    if(role==="finisher"&&nonBasic&&hpRatio(target)<=0.35)return 1.15;
    if(role==="breaker"&&nonBasic&&(Number(target.slot)<3||String(target.roleClass||target.archetype)==="guardian"))return 1.12;
    return 1;
  }
  function heroProtectorMitigation(target,allies=[],objective=null){
    if(!target||target.team!=="player"||objective?.type!=="protect"||objective?.targetId!==target.id)return 1;
    const active=allies.some(u=>u&&u.hp>0&&heroTacticalRoleFor(u)==="protector"&&[0,4].includes(Number(u.slot)));
    if(!active)return 1;
    const safeZone=["cover","rear"].includes(battlefieldZone(target)?.id);
    return safeZone?0.80:0.85;
  }
  function objectiveFormationDamageMultiplier(actor,target,enemyAllies=[],objective=null,action="basic"){
    if(!actor||actor.team!=="player"||!target||target.team!=="enemy"||objective?.type!=="priority"||objective?.targetId!==target.id)return 1;
    const screen=(enemyAllies||[]).some(u=>u&&u.hp>0&&Number(u.slot)<3&&enemyRoleFor(u)==="bulwark");
    if(!screen)return 1;
    const breaker=heroTacticalRoleFor(actor)==="breaker"&&action!=="basic";
    return breaker?1:0.85;
  }
  function objectiveFormationRitualBonus(actor,target,action="basic",kind="",controlled=false){
    if(!actor||actor.team!=="player"||!["skill","ultimate"].includes(action))return 0;
    const role=heroTacticalRoleFor(actor);
    if(role==="controller"&&["stun","fear"].includes(String(kind))&&controlled)return 1;
    if(role==="breaker"&&target&&(Number(target.slot)<3||enemyRoleFor(target)==="bulwark"))return 1;
    return 0;
  }
  function objectiveFormationRule(type){
    if(type==="priority")return {id:"guard-screen",name:"VÒNG HỘ TƯỚNG",desc:"Hộ Vệ tuyến trước giảm 15% sát thương lên mục tiêu ưu tiên; PHÁ TUYẾN bằng Skill/Tuyệt kỹ xuyên lớp che chắn."};
    if(type==="protect")return {id:"escort-corridor",name:"HÀNH LANG HỘ TỐNG",desc:"Hộ Vệ ở Tiền Tuyến/Che Chắn giảm sát thương cho mục tiêu; mục tiêu ở Che Chắn/Hậu Tuyến tăng mức bảo hộ lên 20%."};
    if(type==="ritual")return {id:"ritual-opening",name:"KHE HỞ NGHI THỨC",desc:"KHỐNG CHẾ thành công hoặc PHÁ TUYẾN đúng tuyến bằng Skill/Tuyệt kỹ tạo thêm +1 Áp Lực."};
    if(type==="survive")return {id:"anchor-hunt",name:"SĂN ĐIỂM NEO",desc:"Mũi Xuyên Phá ưu tiên Hộ Vệ đang giữ Tiền Tuyến/Che Chắn trước khi truy kích mục tiêu yếu."};
    return {id:"open-field",name:"GIAO TRANH MỞ",desc:"Không có luật tương tác mục tiêu–đội hình bổ sung."};
  }
  function heroControllerEnergyDrain(actor,kind=""){
    if(actor?.team!=="player"||heroTacticalRoleFor(actor)!=="controller")return 0;
    return ["stun","fear"].includes(String(kind))?8:0;
  }
  function heroEnablerEnergyGrant(actor,action="basic",kind=""){
    if(actor?.team!=="player"||heroTacticalRoleFor(actor)!=="enabler"||action==="basic")return 0;
    return ["heal","healAll","cleanseGuard","guard","guardAll","taunt","buffAll","hasteAll"].includes(String(kind))?6:0;
  }
  function heroVanguardMomentumGain(actor,action="basic"){
    if(actor?.team!=="player"||heroTacticalRoleFor(actor)!=="vanguard")return 0;
    const zone=battlefieldZone(actor)?.id;
    return ["vanguard","flank","highground"].includes(zone)&&["basic","skill","ultimate"].includes(action)?4:0;
  }

  const BATTLEFIELD_ZONES = Object.freeze({
    0:{id:"vanguard",name:"TIỀN TUYẾN",desc:"Đỡ đòn trực diện.",outgoing:0.98,incoming:0.92,hit:0,crit:0,healOut:1,healIn:1},
    1:{id:"center",name:"TRUNG QUÂN",desc:"Vị trí cân bằng, giữ nhịp đội hình.",outgoing:1.02,incoming:0.98,hit:0.01,crit:0,healOut:1.02,healIn:1},
    2:{id:"flank",name:"SƯỜN CHIẾN",desc:"Đánh mạnh hơn nhưng dễ bị phản công.",outgoing:1.07,incoming:1.05,hit:0.01,crit:0.02,healOut:1,healIn:1},
    3:{id:"highground",name:"CAO ĐIỂM",desc:"Tăng độ chính xác và chí mạng.",outgoing:1.03,incoming:1,hit:0.05,crit:0.04,healOut:1,healIn:1},
    4:{id:"cover",name:"VÙNG CHE CHẮN",desc:"Giảm sát thương nhận và tăng hồi phục nhận.",outgoing:0.99,incoming:0.95,hit:0,crit:0,healOut:1,healIn:1.08},
    5:{id:"rear",name:"HẬU TUYẾN",desc:"Tăng hiệu quả hỗ trợ, đổi lại áp lực tấn công thấp hơn.",outgoing:0.96,incoming:1,hit:0,crit:0,healOut:1.10,healIn:1.03}
  });
  function battlefieldZone(unit){return BATTLEFIELD_ZONES[Number(unit?.slot)]||BATTLEFIELD_ZONES[1];}
  function zoneDamageOutgoing(unit){return battlefieldZone(unit).outgoing||1;}
  function zoneDamageIncoming(unit){return battlefieldZone(unit).incoming||1;}
  function zoneHealOutgoing(unit){return battlefieldZone(unit).healOut||1;}
  function zoneHealIncoming(unit){return battlefieldZone(unit).healIn||1;}

  function calculateDamageDetailed(attacker, target, multiplier = 1, rolls = {}) {
    const hitRoll = clamp(Number(rolls.hit ?? rolls.roll ?? 0.5), 0, 1);
    if (hitRoll > hitChance(attacker, target)) return { amount: 0, missed: true, critical: false };
    const attack = Math.max(1, effectiveStat(attacker, "atk"));
    const defense = Math.max(0, effectiveStat(target, "def")) * tacticDefenseMultiplier(target);
    const varianceRoll = clamp(Number(rolls.variance ?? rolls.roll ?? 0.5), 0, 1);
    const variance = 0.94 + varianceRoll * 0.12;
    const guarded = target.statuses?.some((status) => status.type === "guard") ? 0.68 : 1;
    const marked = target.statuses?.some((status) => status.type === "marked") ? 1 + statusPower(target, "marked", 0.18) : 1;
    const critRoll = clamp(Number(rolls.crit ?? 0.99), 0, 1);
    const critical = critRoll < critChance(attacker, target);
    const critMultiplier = critical ? Math.max(1.35, Number(attacker?.critDamage) || 1.55) : 1;
    const roleEdge = roleAdvantageMultiplier(attacker, target);
    const combo = comboMultiplier(attacker, target);
    const archetypeEdge = archetypeMatchupMultiplier(attacker, target);
    const burstFinish = attacker?.teamSynergy?.archetype?.mastered && attacker?.teamSynergy?.archetype?.id==="burst" && hpRatio(target)<=0.4 ? 1.08 : 1;
    const slotCombo = attacker?.slotComboReady ? 1.10 : 1;
    const nemViStacks = Math.max(0, Math.min(3, Number((attacker?.statuses||[]).find(status=>status.type==="nemVi")?.stacks)||0));
    const nemViOutgoing = nemViStacks >= 1 ? 0.95 : 1;
    const targetNemViStacks = Math.max(0, Math.min(3, Number((target?.statuses||[]).find(status=>status.type==="nemVi")?.stacks)||0));
    const ongPhoTasteEdge = attacker?.sourceId === "ong_hang_pho" && targetNemViStacks >= 2 ? 1.08 : 1;
    const raw = attack * multiplier * roleEdge * combo * archetypeEdge * burstFinish * slotCombo * nemViOutgoing * ongPhoTasteEdge * tacticDamageMultiplier(attacker) * zoneDamageOutgoing(attacker) * zoneDamageIncoming(target) * (100 / (100 + defense * 0.82));
    const COMBAT_LETHALITY_V3148 = 1.22;
    const amount = Math.max(12, Math.round(raw * variance * guarded * marked * critMultiplier * COMBAT_LETHALITY_V3148));
    return { amount, missed: false, critical };
  }

  function calculateDamage(attacker, target, multiplier = 1, roll = 0.5) {
    return calculateDamageDetailed(attacker, target, multiplier, { hit: 0, variance: roll, crit: 1 }).amount;
  }

  function calculateHeal(caster, target, multiplier = 1) {
    const power = Math.max(1, Number(caster.atk) || 1);
    const missing = Math.max(0, target.maxHp - target.hp);
    const sustain = caster?.teamSynergy?.archetype?.mastered && caster?.teamSynergy?.archetype?.id==="sustain" ? 1.10 : 1;
    const received = target?.statuses?.some((status)=>status.type === "healDown") ? Math.max(0.2, 1 - statusPower(target, "healDown", 0.35)) : 1;
    return Math.min(missing, Math.round((power * multiplier + target.maxHp * 0.08) * sustain * tacticSupportMultiplier(caster) * received * zoneHealOutgoing(caster) * zoneHealIncoming(target)));
  }

  const FORMATION_SLOTS = Object.freeze([0, 1, 2, 3, 4, 5]);

  function unitRage(unit) {
    const value = Number(unit?.energy ?? unit?.mp ?? unit?.rage ?? 0);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  function teamRage(units, team) {
    return units
      .filter((unit) => unit.hp > 0 && unit.team === team)
      .reduce((total, unit) => total + unitRage(unit), 0);
  }

  function teamPriority(team) {
    if (team === "player") return 0;
    if (team === "enemy") return 1;
    return 2;
  }

  function startingTeam(units) {
    const living = units.filter((unit) => unit.hp > 0);
    const teams = [...new Set(living.map((unit) => unit.team).filter(Boolean))]
      .sort((a, b) => teamPriority(a) - teamPriority(b) || String(a).localeCompare(String(b)));
    if (teams.length === 0) return null;
    return teams.slice(1).reduce((leader, team) => {
      const difference = teamRage(living, team) - teamRage(living, leader);
      return difference > 0 ? team : leader;
    }, teams[0]);
  }

  function buildTurnOrder(units) {
    const living = units.filter((unit) => unit.hp > 0);
    const firstTeam = startingTeam(living);
    if (!firstTeam) return [];
    const teams = [...new Set(living.map((unit) => unit.team).filter(Boolean))]
      .sort((a, b) => {
        if (a === firstTeam) return -1;
        if (b === firstTeam) return 1;
        return teamPriority(a) - teamPriority(b) || String(a).localeCompare(String(b));
      });
    const ordered = [];
    for (const slot of FORMATION_SLOTS) {
      for (const team of teams) {
        living
          .filter((unit) => unit.team === team && unit.slot === slot)
          .sort((a, b) => String(a.id).localeCompare(String(b.id)))
          .forEach((unit) => ordered.push(unit.id));
      }
    }
    living
      .filter((unit) => !FORMATION_SLOTS.includes(unit.slot))
      .sort((a, b) => teamPriority(a.team) - teamPriority(b.team) || String(a.id).localeCompare(String(b.id)))
      .forEach((unit) => ordered.push(unit.id));
    return ordered;
  }

  function dedupeTeamRoster(units) {
    const seenByTeam = new Map();
    return units.filter((unit) => {
      const team = String(unit?.team || "unknown");
      const identity = String(unit?.sourceId || unit?.heroId || unit?.id || "").trim();
      if (!identity) return true;
      if (!seenByTeam.has(team)) seenByTeam.set(team, new Set());
      const seen = seenByTeam.get(team);
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
  }

  const FACTION_LABELS = Object.freeze({
    pho_thuc:"Phố Thức", mong_dan:"Mộng Dân", dan_dem:"Dân Đêm", neutral:"Trung lập"
  });
  const ROLE_COUNTERS = Object.freeze({ guardian:"striker", striker:"ranger", ranger:"healer", healer:"support", support:"duelist", duelist:"mystic", mystic:"guardian" });
  const TEAM_ARCHETYPE_LABELS = Object.freeze({ burst:"Bùng Nổ", sustain:"Bền Bỉ", control:"Khống Chế", tempo:"Nhịp Độ", counter:"Phản Công", dot:"Bào Mòn" });
  const TACTIC_STANCES = Object.freeze({
    balanced:{id:"balanced",name:"Cân bằng",desc:"Không đổi công/thủ."},
    assault:{id:"assault",name:"Áp công",desc:"+8% sát thương, -5% hiệu quả phòng thủ."},
    guard:{id:"guard",name:"Thủ thế",desc:"+10% hiệu quả phòng thủ, -6% sát thương, +8% hồi/khiên."}
  });
  const TARGET_PRIORITIES = Object.freeze({
    opposite:{id:"opposite",name:"Đối diện",desc:"Giữ luật slot đối diện."},
    weakest:{id:"weakest",name:"Máu thấp",desc:"Kết liễu mục tiêu yếu nhất hợp lệ."},
    rage:{id:"rage",name:"Nộ cao",desc:"Khóa tướng địch sắp tung tuyệt kỹ."},
    backline:{id:"backline",name:"Hàng sau",desc:"Ưu tiên slot 4–6 khi kỹ năng cho phép."}
  });
  const RAGE_POLICIES = Object.freeze({
    spend:{id:"spend",name:"Xả nộ",desc:"Đủ 60 nộ là ưu tiên tuyệt kỹ."},
    balanced:{id:"balanced",name:"Linh hoạt",desc:"Thường chờ 70 nộ hoặc thời điểm tốt."},
    reserve:{id:"reserve",name:"Giữ nộ",desc:"Thường chờ 85 nộ, trừ tình huống khẩn cấp."}
  });
  const SLOT_COMBO_MODES = Object.freeze({
    linked:{id:"linked",name:"Liên kết",desc:"1↔4, 2↔5, 3↔6 cùng đánh một mục tiêu sẽ kích combo."},
    free:{id:"free",name:"Tự do",desc:"Không ép liên kết slot."}
  });
  const COMBAT_PLANS = Object.freeze({
    adaptive:{id:"adaptive",name:"Ứng Biến",reactionIds:[],primerKinds:[],triggerKinds:[],desc:"Không ép công thức; Auto chọn hành động tốt nhất theo tình huống."},
    detonate:{id:"detonate",name:"Đốt → Nổ",reactionIds:["detonate"],primerKinds:["burn","aoeBurn"],triggerKinds:["break","execute","stun"],desc:"Ưu tiên đặt Thiêu Đốt rồi giao đồng đội Phá Giáp/Kết Liễu/Choáng kích Bạo Hỏa."},
    expose:{id:"expose",name:"Phá Giáp → Kết Liễu",reactionIds:["expose"],primerKinds:["break"],triggerKinds:["double","multi","execute"],desc:"Giữ Phá Giáp làm mồi để đồng đội liên kích chuyển thành Điểm Yếu."},
    lockdown:{id:"lockdown",name:"Giảm Công → Khóa",reactionIds:["lockdown"],primerKinds:["aoeDebuff"],triggerKinds:["stun","fear"],desc:"Ưu tiên dựng Giảm Công rồi nối khống chế để kéo dài nhịp suy yếu."},
    nurture:{id:"nurture",name:"Tái Sinh → Hộ Thế",reactionIds:["nurture"],primerKinds:["heal","healAll"],triggerKinds:["guard","guardAll","cleanseGuard"],desc:"Nuôi Tái Sinh bằng Hộ Thể/Thanh Tâm để kéo sustain và tạo khiên phụ."}
  });
  const TACTICAL_SEQUENCES = Object.freeze({
    detonate:{planId:"detonate",label:"Châm Mồi → Kích Nổ → Kết Liễu",primerKinds:["burn","aoeBurn"],reactionIds:["detonate"],finisher:true},
    expose:{planId:"expose",label:"Phá Giáp → Phá Thế → Kết Liễu",primerKinds:["break"],reactionIds:["expose"],finisher:true},
    lockdown:{planId:"lockdown",label:"Giảm Công → Khóa Nhịp",primerKinds:["aoeDebuff"],reactionIds:["lockdown"],finisher:false},
    nurture:{planId:"nurture",label:"Tái Sinh → Hộ Thế",primerKinds:["heal","healAll"],reactionIds:["nurture"],finisher:false}
  });
  function createTacticalSequenceState(planId="adaptive"){ const id=normalizeCombatPlan(planId); return {planId:id,phase:id==="adaptive"?"idle":"prime",targetId:null,primerActorId:null,triggerActorId:null,startedAction:0,expiresAction:0,completed:0,broken:0,history:[]}; }
  function tacticalSequenceDef(planId){ return TACTICAL_SEQUENCES[normalizeCombatPlan(planId)]||null; }
  function tacticalSequencePhaseLabel(seq){ if(!seq||seq.phase==="idle")return "Ứng biến"; if(seq.phase==="prime")return "1/3 · Đặt mồi"; if(seq.phase==="trigger")return "2/3 · Kích phản ứng"; if(seq.phase==="finish")return "3/3 · Giữ đòn kết"; return "Hoàn tất"; }
  const PLAN_DISRUPTIONS = Object.freeze({
    unweave:{id:"unweave",name:"Bẻ Mồi",phase:"trigger",telegraph:"Địch đã nhận ra mục tiêu đang giữ mồi của chuỗi.",effect:"Ở nhịp kích hoạt, địch gỡ 1 trạng thái mồi liên quan trên mục tiêu khóa.",counter:"Kích phản ứng trước khi đối sách hoàn tất, hoặc chủ động bỏ chuỗi để đổi mục tiêu."},
    compress:{id:"compress",name:"Ép Nhịp",phase:"trigger",telegraph:"Địch đang ép ngắn cửa sổ phối hợp của đội ta.",effect:"Cửa sổ kích phản ứng bị rút ngắn 2 action.",counter:"Đoạt Nhịp hoặc kích phản ứng ngay khi còn cửa sổ."},
    fortify:{id:"fortify",name:"Khóa Đích",phase:"finish",telegraph:"Địch đang dựng phòng tuyến quanh mục tiêu kết liễu.",effect:"Mục tiêu khóa nhận Guard 1 lượt và khiên 8% HP tối đa.",counter:"Dùng đòn kết đúng thời điểm hoặc chuyển sang kế hoạch mới nếu phòng tuyến quá dày."}
  });
  function createPlanDisruptionState(){ return {pending:null,pendingEnemyTurns:0,targetId:null,phase:null,used:false,history:[]}; }
  function planDisruptionDef(id){ return PLAN_DISRUPTIONS[id]||null; }
  function sequencePrimerTypes(planId){ const plan=COMBAT_PLANS[normalizeCombatPlan(planId)]; const ids=new Set(plan.reactionIds||[]); return SKILL_REACTIONS.filter(x=>ids.has(x.id)).map(x=>x.primer); }
  function choosePlanDisruption(planId,phase,hasPrimer=true){ if(normalizeCombatPlan(planId)==="adaptive")return null; if(phase==="finish")return "fortify"; if(phase==="trigger")return hasPrimer?"unweave":"compress"; return null; }
  const PLAN_RECOVERIES = Object.freeze({
    rebuild:{id:"rebuild",name:"Tái Lập",costType:"order",cost:1,desc:"Dùng 1 Mệnh Lệnh để khôi phục phần setup vừa bị phá; không tạo thêm sát thương miễn phí."},
    force:{id:"force",name:"Cưỡng Nhịp",costType:"momentum",cost:20,desc:"Dùng 20 Thế Trận để giữ nguyên hướng đánh và hóa giải một phần đối sách."},
    pivot:{id:"pivot",name:"Đổi Phương Án / Rẽ Nhánh",costType:"tempo",cost:8,desc:"Mất 8 Thế Trận để bỏ chuỗi đã lộ và mở hai nhánh kế hoạch B/C trong 2 action."}
  });
  const PLAN_BRANCHES = Object.freeze({
    detonate:{sourcePlan:"detonate",choices:["expose","lockdown"]},
    expose:{sourcePlan:"expose",choices:["detonate","lockdown"]},
    lockdown:{sourcePlan:"lockdown",choices:["expose","nurture"]},
    nurture:{sourcePlan:"nurture",choices:["lockdown","detonate"]}
  });
  const PLAN_BRANCH_META = Object.freeze({
    detonate:{tag:"burst",branchName:"Bùng Nổ",why:"đổi sang áp lực sát thương khi mục tiêu đã lộ sơ hở"},
    expose:{tag:"pressure",branchName:"Phá Vỡ",why:"đổi sang Phá Giáp để tạo Điểm Yếu thay cho mồi cũ"},
    lockdown:{tag:"control",branchName:"Khóa Nhịp",why:"bỏ cuộc đua kết liễu, kéo đối thủ vào nhịp khống chế ngắn hơn"},
    nurture:{tag:"sustain",branchName:"Hộ Thế",why:"lùi nhịp để tái lập hồi phục và phòng tuyến"}
  });
  const ENEMY_COUNTER_BRANCHES = Object.freeze({
    detonate:{id:"quench",name:"Dập Mồi",planId:"detonate",telegraph:"Địch đã nhìn ra nhánh Bùng Nổ và đang chờ dập Thiêu Đốt trên mục tiêu khóa.",counter:"Kích Bạo Hỏa trước khi đối sách hoàn tất hoặc đổi mục tiêu.",effect:"Gỡ một Thiêu Đốt khỏi mục tiêu đang bị khóa."},
    expose:{id:"closearmor",name:"Khép Giáp",planId:"expose",telegraph:"Địch đang khép giáp quanh mục tiêu vừa bị Phá Giáp.",counter:"Kích Phá Thế sớm hoặc buộc đối thủ đổi mục tiêu phòng thủ.",effect:"Gỡ Phá Giáp và cho mục tiêu Guard 1 lượt."},
    lockdown:{id:"shakeoff",name:"Giũ Khóa",planId:"lockdown",telegraph:"Địch đã nhận ra chuỗi Giảm Công → Khóa và chuẩn bị giũ trạng thái suy yếu.",counter:"Khóa Nhịp trước khi đối sách hoàn tất hoặc chuyển mục tiêu.",effect:"Gỡ một Giảm Công trên mục tiêu khóa."},
    nurture:{id:"severaid",name:"Cắt Tiếp Tế",planId:"nurture",telegraph:"Địch đang đánh dấu mắt xích hồi phục của nhánh Hộ Thế.",counter:"Hoàn tất Dưỡng Thế sớm hoặc đổi người nhận mồi hồi phục.",effect:"Gắn Giảm Hồi 25% trong 2 lượt lên mục tiêu hồi phục."}
  });
  const PLAN_FEINTS = Object.freeze({
    detonate:["expose","lockdown"],
    expose:["detonate","lockdown"],
    lockdown:["expose","nurture"],
    nurture:["lockdown","detonate"]
  });
  const TACTICAL_MEMORY_VERSION=1;
  const TACTICAL_MEMORY_MAX_BATTLES=12;
  function createTacticalMemoryProfile(){const profile={version:TACTICAL_MEMORY_VERSION,battles:0,feints:{total:0,byDecoy:{}},readResponses:{hold:0,retarget:0,abandon:0},payoffChoices:{seize:0,reclaim:0,extend:0},integrity:{seedPressure:0,distrustBattles:0,alerts:0},updatedAt:0};profile.integrity.resetFogBattles=0;profile.integrity.resetAnchor=null;profile.integrity.resetCatches=0;profile.integrity.memoryAnchor=null;profile.integrity.anchorStrength=0;profile.integrity.anchorBreakProgress=0;profile.integrity.anchorCatches=0;profile.integrity.anchorCandidate=null;profile.integrity.anchorCandidateProgress=0;profile.integrity.anchorSwitches=0;profile.integrity.anchorConflict=null;profile.integrity.anchorConflictCount=0;profile.integrity.conflictResolutions={keep:0,switch:0,break:0};profile.integrity.conflictResolutionCount=0;profile.integrity.lastConflictResolution=null;profile.integrity.resolutionBaitProgress=0;profile.integrity.resolutionCounterplayArmed=false;profile.integrity.resolutionCounterplays=0;profile.integrity.lastResolutionCounterplay=null;profile.integrity.resolutionFogConflicts=0;profile.integrity.conflictPredictionAtOpen=null;profile.integrity.counterplaySuspicion=0;profile.integrity.counterplayDetectionAtOpen=0;profile.integrity.counterplayDetectionChecks=0;profile.integrity.lastCounterplayDetection=null;profile.integrity.counterplayDirections={keep:0,switch:0,break:0};profile.integrity.counterplayDirectionCount=0;profile.integrity.counterplaySuspicionTargetAtOpen=null;profile.integrity.lastSuspicionManipulation=null;profile.integrity.suspicionReversalMarks={keep:0,switch:0,break:0};profile.integrity.suspicionReversalCount=0;profile.integrity.suspicionReversalTargetAtOpen=null;profile.integrity.lastSuspicionReversal=null;profile.integrity.beliefStabilityScore=.5;profile.integrity.beliefStabilitySamples=0;profile.integrity.beliefLastResolution=null;profile.integrity.beliefStabilityAtOpen=null;profile.integrity.beliefStabilitySamplesAtOpen=0;profile.integrity.beliefRecoveryActive=false;profile.integrity.beliefRecoveryTarget=null;profile.integrity.beliefRecoveryProgress=0;profile.integrity.beliefRecoveries=0;profile.integrity.lastBeliefRecovery=null;profile.integrity.beliefEstablishedPattern=null;profile.integrity.beliefLegacyPattern=null;profile.integrity.beliefReplacementPattern=null;profile.integrity.beliefReplacementStrength=0;profile.integrity.beliefReplacementAtOpen=null;profile.integrity.beliefLegacyAtOpen=null;profile.integrity.beliefReplacementStrengthAtOpen=0;profile.integrity.beliefReplacements=0;profile.integrity.lastBeliefReplacement=null;profile.integrity.beliefReversionScore=.5;profile.integrity.beliefReversionSamples=0;profile.integrity.beliefReversionScoreAtOpen=null;profile.integrity.beliefReversionSamplesAtOpen=0;profile.integrity.lastBeliefReversion=null;profile.integrity.beliefReversionFeintEvidence=0;profile.integrity.beliefReversionFeintAtOpen=0;profile.integrity.lastBeliefReversionFeint=null;profile.integrity.beliefReversionCommitment=0;profile.integrity.beliefReversionCommitmentAtOpen=0;profile.integrity.lastBeliefReversionCommitment=null;profile.integrity.beliefCommitmentBreakEvidence=0;profile.integrity.beliefCommitmentBreakAtOpen=0;profile.integrity.lastBeliefCommitmentBreak=null;profile.integrity.beliefCommitmentTraps=0;profile.integrity.lastBeliefCommitmentTrap=null;profile.integrity.beliefCommitmentTrapMemory=0;profile.integrity.beliefCommitmentTrapMemoryAtOpen=0;return profile;}
  function sanitizeTacticalMemoryProfile(value={}){const base=createTacticalMemoryProfile(),v=value&&typeof value==='object'?value:{};base.battles=Math.max(0,Math.min(TACTICAL_MEMORY_MAX_BATTLES,Number(v.battles)||0));base.feints.total=Math.max(0,Number(v.feints?.total)||0);for(const id of Object.keys(COMBAT_PLANS)){if(id==='adaptive')continue;const n=Math.max(0,Number(v.feints?.byDecoy?.[id])||0);if(n)base.feints.byDecoy[id]=n;}for(const id of Object.keys(base.readResponses))base.readResponses[id]=Math.max(0,Number(v.readResponses?.[id])||0);for(const id of Object.keys(base.payoffChoices))base.payoffChoices[id]=Math.max(0,Number(v.payoffChoices?.[id])||0);base.integrity.seedPressure=Math.max(0,Math.min(4,Number(v.integrity?.seedPressure)||0));base.integrity.distrustBattles=Math.max(0,Math.min(2,Math.floor(Number(v.integrity?.distrustBattles)||0)));base.integrity.alerts=Math.max(0,Math.floor(Number(v.integrity?.alerts)||0));base.integrity.resetFogBattles=Math.max(0,Math.min(2,Math.floor(Number(v.integrity?.resetFogBattles)||0)));base.integrity.resetAnchor=['hold','retarget','abandon'].includes(v.integrity?.resetAnchor)?v.integrity.resetAnchor:null;base.integrity.resetCatches=Math.max(0,Math.floor(Number(v.integrity?.resetCatches)||0));base.integrity.memoryAnchor=['hold','retarget','abandon'].includes(v.integrity?.memoryAnchor)?v.integrity.memoryAnchor:null;base.integrity.anchorStrength=Math.max(0,Math.min(1,Number(v.integrity?.anchorStrength)||0));base.integrity.anchorBreakProgress=Math.max(0,Math.min(3,Math.floor(Number(v.integrity?.anchorBreakProgress)||0)));base.integrity.anchorCatches=Math.max(0,Math.floor(Number(v.integrity?.anchorCatches)||0));base.integrity.anchorCandidate=['hold','retarget','abandon'].includes(v.integrity?.anchorCandidate)?v.integrity.anchorCandidate:null;base.integrity.anchorCandidateProgress=Math.max(0,Math.min(3,Math.floor(Number(v.integrity?.anchorCandidateProgress)||0)));base.integrity.anchorSwitches=Math.max(0,Math.floor(Number(v.integrity?.anchorSwitches)||0));base.integrity.anchorConflict=['hold','retarget','abandon'].includes(v.integrity?.anchorConflict)?v.integrity.anchorConflict:null;base.integrity.anchorConflictCount=Math.max(0,Math.floor(Number(v.integrity?.anchorConflictCount)||0));for(const id of ['keep','switch','break'])base.integrity.conflictResolutions[id]=Math.max(0,Number(v.integrity?.conflictResolutions?.[id])||0);base.integrity.conflictResolutionCount=Math.max(0,Math.floor(Number(v.integrity?.conflictResolutionCount)||0));base.integrity.lastConflictResolution=['keep','switch','break'].includes(v.integrity?.lastConflictResolution)?v.integrity.lastConflictResolution:null;base.integrity.resolutionBaitProgress=Math.max(0,Math.min(2,Math.floor(Number(v.integrity?.resolutionBaitProgress)||0)));base.integrity.resolutionCounterplayArmed=v.integrity?.resolutionCounterplayArmed===true;base.integrity.resolutionCounterplays=Math.max(0,Math.floor(Number(v.integrity?.resolutionCounterplays)||0));base.integrity.lastResolutionCounterplay=['success','miss'].includes(v.integrity?.lastResolutionCounterplay)?v.integrity.lastResolutionCounterplay:null;base.integrity.resolutionFogConflicts=Math.max(0,Math.min(1,Math.floor(Number(v.integrity?.resolutionFogConflicts)||0)));base.integrity.conflictPredictionAtOpen=['keep','switch','break'].includes(v.integrity?.conflictPredictionAtOpen)?v.integrity.conflictPredictionAtOpen:null;base.integrity.counterplaySuspicion=Math.max(0,Math.min(2,Math.floor(Number(v.integrity?.counterplaySuspicion)||0)));base.integrity.counterplayDetectionAtOpen=Math.max(0,Math.min(2,Math.floor(Number(v.integrity?.counterplayDetectionAtOpen)||0)));base.integrity.counterplayDetectionChecks=Math.max(0,Math.floor(Number(v.integrity?.counterplayDetectionChecks)||0));base.integrity.lastCounterplayDetection=['confirmed','false-alarm'].includes(v.integrity?.lastCounterplayDetection)?v.integrity.lastCounterplayDetection:null;for(const id of ['keep','switch','break'])base.integrity.counterplayDirections[id]=Math.max(0,Number(v.integrity?.counterplayDirections?.[id])||0);base.integrity.counterplayDirectionCount=Math.max(0,Math.floor(Number(v.integrity?.counterplayDirectionCount)||0));base.integrity.counterplaySuspicionTargetAtOpen=['keep','switch','break'].includes(v.integrity?.counterplaySuspicionTargetAtOpen)?v.integrity.counterplaySuspicionTargetAtOpen:null;base.integrity.lastSuspicionManipulation=['read','fooled'].includes(v.integrity?.lastSuspicionManipulation)?v.integrity.lastSuspicionManipulation:null;for(const id of ['keep','switch','break'])base.integrity.suspicionReversalMarks[id]=Math.max(0,Number(v.integrity?.suspicionReversalMarks?.[id])||0);base.integrity.suspicionReversalCount=Math.max(0,Math.floor(Number(v.integrity?.suspicionReversalCount)||0));base.integrity.suspicionReversalTargetAtOpen=['keep','switch','break'].includes(v.integrity?.suspicionReversalTargetAtOpen)?v.integrity.suspicionReversalTargetAtOpen:null;base.integrity.lastSuspicionReversal=['confirmed','backfired'].includes(v.integrity?.lastSuspicionReversal)?v.integrity.lastSuspicionReversal:null;base.integrity.beliefStabilityScore=Math.max(0,Math.min(1,Number.isFinite(Number(v.integrity?.beliefStabilityScore))?Number(v.integrity.beliefStabilityScore):.5));base.integrity.beliefStabilitySamples=Math.max(0,Math.floor(Number(v.integrity?.beliefStabilitySamples)||0));base.integrity.beliefLastResolution=['keep','switch','break'].includes(v.integrity?.beliefLastResolution)?v.integrity.beliefLastResolution:null;base.integrity.beliefStabilityAtOpen=Number.isFinite(Number(v.integrity?.beliefStabilityAtOpen))?Math.max(0,Math.min(1,Number(v.integrity.beliefStabilityAtOpen))):null;base.integrity.beliefStabilitySamplesAtOpen=Math.max(0,Math.floor(Number(v.integrity?.beliefStabilitySamplesAtOpen)||0));base.integrity.beliefRecoveryActive=v.integrity?.beliefRecoveryActive===true;base.integrity.beliefRecoveryTarget=['keep','switch','break'].includes(v.integrity?.beliefRecoveryTarget)?v.integrity.beliefRecoveryTarget:null;base.integrity.beliefRecoveryProgress=Math.max(0,Math.min(3,Math.floor(Number(v.integrity?.beliefRecoveryProgress)||0)));base.integrity.beliefRecoveries=Math.max(0,Math.floor(Number(v.integrity?.beliefRecoveries)||0));base.integrity.lastBeliefRecovery=v.integrity?.lastBeliefRecovery==='restored'?'restored':null;base.integrity.beliefEstablishedPattern=['keep','switch','break'].includes(v.integrity?.beliefEstablishedPattern)?v.integrity.beliefEstablishedPattern:null;base.integrity.beliefLegacyPattern=['keep','switch','break'].includes(v.integrity?.beliefLegacyPattern)?v.integrity.beliefLegacyPattern:null;base.integrity.beliefReplacementPattern=['keep','switch','break'].includes(v.integrity?.beliefReplacementPattern)?v.integrity.beliefReplacementPattern:null;base.integrity.beliefReplacementStrength=Math.max(0,Math.min(1,Number(v.integrity?.beliefReplacementStrength)||0));base.integrity.beliefReplacementAtOpen=['keep','switch','break'].includes(v.integrity?.beliefReplacementAtOpen)?v.integrity.beliefReplacementAtOpen:null;base.integrity.beliefLegacyAtOpen=['keep','switch','break'].includes(v.integrity?.beliefLegacyAtOpen)?v.integrity.beliefLegacyAtOpen:null;base.integrity.beliefReplacementStrengthAtOpen=Math.max(0,Math.min(1,Number(v.integrity?.beliefReplacementStrengthAtOpen)||0));base.integrity.beliefReplacements=Math.max(0,Math.floor(Number(v.integrity?.beliefReplacements)||0));base.integrity.lastBeliefReplacement=['replaced','reinforced','reverted','eroded'].includes(v.integrity?.lastBeliefReplacement)?v.integrity.lastBeliefReplacement:null;base.integrity.beliefReversionScore=Math.max(0,Math.min(1,Number.isFinite(Number(v.integrity?.beliefReversionScore))?Number(v.integrity.beliefReversionScore):.5));base.integrity.beliefReversionSamples=Math.max(0,Math.floor(Number(v.integrity?.beliefReversionSamples)||0));base.integrity.beliefReversionScoreAtOpen=Number.isFinite(Number(v.integrity?.beliefReversionScoreAtOpen))?Math.max(0,Math.min(1,Number(v.integrity.beliefReversionScoreAtOpen))):null;base.integrity.beliefReversionSamplesAtOpen=Math.max(0,Math.floor(Number(v.integrity?.beliefReversionSamplesAtOpen)||0));base.integrity.lastBeliefReversion=['returned','persisted','diverged'].includes(v.integrity?.lastBeliefReversion)?v.integrity.lastBeliefReversion:null;base.integrity.beliefReversionFeintEvidence=Math.max(0,Math.min(2,Math.floor(Number(v.integrity?.beliefReversionFeintEvidence)||0)));base.integrity.beliefReversionFeintAtOpen=Math.max(0,Math.min(2,Math.floor(Number(v.integrity?.beliefReversionFeintAtOpen)||0)));base.integrity.lastBeliefReversionFeint=['confirmed','backfired','diverged'].includes(v.integrity?.lastBeliefReversionFeint)?v.integrity.lastBeliefReversionFeint:null;base.integrity.beliefReversionCommitment=Math.max(0,Math.min(2,Math.floor(Number(v.integrity?.beliefReversionCommitment)||0)));base.integrity.beliefReversionCommitmentAtOpen=Math.max(0,Math.min(2,Math.floor(Number(v.integrity?.beliefReversionCommitmentAtOpen)||0)));base.integrity.lastBeliefReversionCommitment=['confirmed','broken','eroded'].includes(v.integrity?.lastBeliefReversionCommitment)?v.integrity.lastBeliefReversionCommitment:null;base.integrity.beliefCommitmentBreakEvidence=Math.max(0,Math.min(4,Math.floor(Number(v.integrity?.beliefCommitmentBreakEvidence)||0)));base.integrity.beliefCommitmentBreakAtOpen=Math.max(0,Math.min(4,Math.floor(Number(v.integrity?.beliefCommitmentBreakAtOpen)||0)));base.integrity.lastBeliefCommitmentBreak=['confirmed','refuted','eroded'].includes(v.integrity?.lastBeliefCommitmentBreak)?v.integrity.lastBeliefCommitmentBreak:null;base.integrity.beliefCommitmentTraps=Math.max(0,Math.floor(Number(v.integrity?.beliefCommitmentTraps)||0));base.integrity.lastBeliefCommitmentTrap=v.integrity?.lastBeliefCommitmentTrap==='success'?'success':null;base.integrity.beliefCommitmentTrapMemory=Math.max(0,Math.min(2,Math.floor(Number(v.integrity?.beliefCommitmentTrapMemory)||0)));base.integrity.beliefCommitmentTrapMemoryAtOpen=Math.max(0,Math.min(2,Math.floor(Number(v.integrity?.beliefCommitmentTrapMemoryAtOpen)||0)));base.updatedAt=Math.max(0,Number(v.updatedAt)||0);return base;}
  function tacticalMemoryLeader(map={}){return Object.entries(map).map(([id,count])=>({id,count:Number(count)||0})).sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id))[0]||{id:null,count:0};}
  function tacticalResolutionPrior(profile={}){const m=sanitizeTacticalMemoryProfile(profile),entries=Object.entries(m.integrity?.conflictResolutions||{}).sort((a,b)=>b[1]-a[1]),lead=entries[0]||[null,0],second=entries[1]||[null,0],margin=Math.max(0,lead[1]-second[1]),prediction=m.integrity.conflictResolutionCount>=3&&margin>=.75?lead[0]:null,confidence=prediction?Math.min(.65,.35+margin*.10):0;return {prediction,confidence,margin};}
  function tacticalCounterplayDirection(profile={}){const m=sanitizeTacticalMemoryProfile(profile),entries=Object.entries(m.integrity?.counterplayDirections||{}).sort((a,b)=>b[1]-a[1]),lead=entries[0]||[null,0],second=entries[1]||[null,0],margin=Math.max(0,lead[1]-second[1]),prediction=m.integrity.counterplayDirectionCount>=2&&margin>=.75?lead[0]:null,confidence=prediction?Math.min(.65,.35+margin*.12):0;return {prediction,confidence,margin};}
  function tacticalSuspicionReversal(profile={}){const m=sanitizeTacticalMemoryProfile(profile),entries=Object.entries(m.integrity?.suspicionReversalMarks||{}).sort((a,b)=>b[1]-a[1]),lead=entries[0]||[null,0],second=entries[1]||[null,0],margin=Math.max(0,lead[1]-second[1]),prediction=m.integrity.suspicionReversalCount>=2&&margin>=.75?lead[0]:null,confidence=prediction?Math.min(.65,.35+margin*.12):0;return {prediction,confidence,margin};}
  function tacticalBeliefStability(profile={}){const m=sanitizeTacticalMemoryProfile(profile),score=Math.max(0,Math.min(1,Number(m.integrity?.beliefStabilityScore)??.5)),samples=Math.max(0,Number(m.integrity?.beliefStabilitySamples)||0),status=samples<3?'forming':score>=.70?'stable':score<=.35?'volatile':'mixed',trustScale=samples<3?1:status==='stable'?1:status==='volatile'?.5:.75;return {score,samples,status,trustScale};}
  function tacticalMemoryWarState(profile={}){const m=sanitizeTacticalMemoryProfile(profile),seedPressure=Math.max(0,Number(m.integrity?.seedPressure)||0),distrustBattles=Math.max(0,Number(m.integrity?.distrustBattles)||0),resetFogBattles=Math.max(0,Number(m.integrity?.resetFogBattles)||0),memoryAnchor=m.integrity?.memoryAnchor||null,stage=distrustBattles>0?'skeptical':seedPressure>=1.4?'watch':'stable';let trustFactor=stage==='skeptical'?.5:1;const warTrust=trustFactor,resetTrust=resetFogBattles>0?.65:1,anchoredResetTrust=resetFogBattles>0&&memoryAnchor?.80:resetTrust,anchorConflict=memoryAnchor?(m.integrity?.anchorConflict||null):null,anchorConflictActive=!!anchorConflict,prior=tacticalResolutionPrior(m),resolutionFogConflicts=Math.max(0,Number(m.integrity?.resolutionFogConflicts)||0),conflictPredictionAtOpen=m.integrity?.conflictPredictionAtOpen||null,resolutionPrediction=resolutionFogConflicts>0?null:(anchorConflictActive?conflictPredictionAtOpen:prior.prediction),resolutionConfidence=resolutionPrediction?prior.confidence:0,resolutionMargin=prior.margin,counterplaySuspicion=Math.max(0,Number(m.integrity?.counterplaySuspicion)||0),counterplayDetectionAtOpen=Math.max(0,Number(m.integrity?.counterplayDetectionAtOpen)||0),counterplayDetectionActive=anchorConflictActive&&!!resolutionPrediction&&counterplayDetectionAtOpen>=2,counterplaySuspicionTargetAtOpen=m.integrity?.counterplaySuspicionTargetAtOpen||null,counterplayDirectionActive=counterplayDetectionActive&&!!counterplaySuspicionTargetAtOpen,suspicionReversalTargetAtOpen=m.integrity?.suspicionReversalTargetAtOpen||null,suspicionReversalActive=counterplayDirectionActive&&!!suspicionReversalTargetAtOpen&&suspicionReversalTargetAtOpen===counterplaySuspicionTargetAtOpen,beliefLive=tacticalBeliefStability(m),beliefScoreAtOpen=anchorConflictActive&&m.integrity?.beliefStabilityAtOpen!==null?m.integrity.beliefStabilityAtOpen:beliefLive.score,beliefSamplesAtOpen=anchorConflictActive?Math.max(0,Number(m.integrity?.beliefStabilitySamplesAtOpen)||0):beliefLive.samples,beliefStatusAtOpen=beliefSamplesAtOpen<3?'forming':beliefScoreAtOpen>=.70?'stable':beliefScoreAtOpen<=.35?'volatile':'mixed',beliefTrustScale=beliefSamplesAtOpen<3?1:beliefStatusAtOpen==='stable'?1:beliefStatusAtOpen==='volatile'?.5:.75,beliefReplacementAtOpen=anchorConflictActive?(m.integrity?.beliefReplacementAtOpen||null):(m.integrity?.beliefReplacementPattern||null),beliefLegacyAtOpen=anchorConflictActive?(m.integrity?.beliefLegacyAtOpen||null):(m.integrity?.beliefLegacyPattern||null),beliefReplacementStrengthAtOpen=anchorConflictActive?Math.max(0,Number(m.integrity?.beliefReplacementStrengthAtOpen)||0):Math.max(0,Number(m.integrity?.beliefReplacementStrength)||0),beliefReplacementActive=!!beliefReplacementAtOpen&&!!beliefLegacyAtOpen&&beliefReplacementAtOpen!==beliefLegacyAtOpen&&beliefReplacementStrengthAtOpen>=.20,beliefReversionScoreAtOpen=anchorConflictActive&&m.integrity?.beliefReversionScoreAtOpen!==null?Math.max(0,Math.min(1,Number(m.integrity.beliefReversionScoreAtOpen)||0)):Math.max(0,Math.min(1,Number(m.integrity?.beliefReversionScore)||.5)),beliefReversionSamplesAtOpen=anchorConflictActive?Math.max(0,Number(m.integrity?.beliefReversionSamplesAtOpen)||0):Math.max(0,Number(m.integrity?.beliefReversionSamples)||0),beliefReversionActive=beliefReplacementActive&&beliefReversionSamplesAtOpen>=3&&beliefReversionScoreAtOpen>=.65,beliefReversionFeintAtOpen=anchorConflictActive?Math.max(0,Number(m.integrity?.beliefReversionFeintAtOpen)||0):Math.max(0,Number(m.integrity?.beliefReversionFeintEvidence)||0),beliefReversionFeintActive=beliefReversionActive&&beliefReversionFeintAtOpen>=2,beliefReversionCommitmentAtOpen=anchorConflictActive?Math.max(0,Number(m.integrity?.beliefReversionCommitmentAtOpen)||0):Math.max(0,Number(m.integrity?.beliefReversionCommitment)||0),beliefReversionCommitmentActive=beliefReplacementActive&&beliefReversionCommitmentAtOpen>=2,beliefCommitmentBreakAtOpen=anchorConflictActive?Math.max(0,Number(m.integrity?.beliefCommitmentBreakAtOpen)||0):Math.max(0,Number(m.integrity?.beliefCommitmentBreakEvidence)||0),beliefCommitmentTrapMemoryAtOpen=anchorConflictActive?Math.max(0,Math.min(2,Number(m.integrity?.beliefCommitmentTrapMemoryAtOpen)||0)):Math.max(0,Math.min(2,Number(m.integrity?.beliefCommitmentTrapMemory)||0)),beliefCommitmentBreakThreshold=2+beliefCommitmentTrapMemoryAtOpen,beliefCommitmentBreakActive=beliefReversionCommitmentActive&&beliefCommitmentBreakAtOpen>=beliefCommitmentBreakThreshold,beliefCommitmentTrapArmed=beliefCommitmentBreakActive,replacementPriorScale=beliefReplacementActive&&resolutionPrediction===beliefLegacyAtOpen?Math.max(.5,1-.5*beliefReplacementStrengthAtOpen):1,reversionPriorScale=beliefReversionActive&&resolutionPrediction===beliefReplacementAtOpen?(beliefCommitmentBreakActive?(beliefReversionFeintActive?.875:.75):beliefReversionCommitmentActive&&beliefReversionFeintActive?.75:beliefReversionCommitmentActive?.625:beliefReversionFeintActive?.875:.75):1,rawConflictTrust=anchorConflictActive?(resolutionPrediction==='keep'?.90:resolutionPrediction==='switch'?.80:.85):1,stabilityAdjustedConflictTrust=anchorConflictActive?.85+(rawConflictTrust-.85)*beliefTrustScale*replacementPriorScale*reversionPriorScale:rawConflictTrust,softenedConflictTrust=counterplayDetectionActive?.85+(stabilityAdjustedConflictTrust-.85)*.5:stabilityAdjustedConflictTrust,targetConflictTrust=counterplaySuspicionTargetAtOpen==='keep'?.90:counterplaySuspicionTargetAtOpen==='switch'?.80:.85,directionHedge=suspicionReversalActive?.125:.25,conflictTrust=counterplayDirectionActive?softenedConflictTrust+(targetConflictTrust-softenedConflictTrust)*directionHedge:softenedConflictTrust;trustFactor*=anchoredResetTrust*conflictTrust;return {stage,seedPressure,distrustBattles,trustFactor,warTrust,resetTrust:anchoredResetTrust,conflictTrust,rawConflictTrust,stabilityAdjustedConflictTrust,beliefStabilityScore:beliefLive.score,beliefStabilitySamples:beliefLive.samples,beliefStabilityStatus:beliefLive.status,beliefStabilityAtOpen:beliefScoreAtOpen,beliefStabilitySamplesAtOpen:beliefSamplesAtOpen,beliefStabilityStatusAtOpen:beliefStatusAtOpen,beliefTrustScale,beliefReplacementActive,beliefReplacementAtOpen,beliefLegacyAtOpen,beliefReplacementStrengthAtOpen,replacementPriorScale,beliefReversionScoreAtOpen,beliefReversionSamplesAtOpen,beliefReversionActive,beliefReversionFeintAtOpen,beliefReversionFeintActive,beliefReversionCommitmentAtOpen,beliefReversionCommitmentActive,beliefCommitmentBreakAtOpen,beliefCommitmentTrapMemoryAtOpen,beliefCommitmentBreakThreshold,beliefCommitmentBreakActive,beliefCommitmentTrapArmed,reversionPriorScale,beliefCommitmentBreakEvidence:Math.max(0,Number(m.integrity?.beliefCommitmentBreakEvidence)||0),lastBeliefCommitmentBreak:m.integrity?.lastBeliefCommitmentBreak||null,beliefCommitmentTraps:Math.max(0,Number(m.integrity?.beliefCommitmentTraps)||0),lastBeliefCommitmentTrap:m.integrity?.lastBeliefCommitmentTrap||null,beliefCommitmentTrapMemory:Math.max(0,Math.min(2,Number(m.integrity?.beliefCommitmentTrapMemory)||0)),beliefReversionFeintEvidence:Math.max(0,Number(m.integrity?.beliefReversionFeintEvidence)||0),lastBeliefReversionFeint:m.integrity?.lastBeliefReversionFeint||null,beliefReversionCommitment:Math.max(0,Number(m.integrity?.beliefReversionCommitment)||0),lastBeliefReversionCommitment:m.integrity?.lastBeliefReversionCommitment||null,beliefReversionScore:Math.max(0,Math.min(1,Number(m.integrity?.beliefReversionScore)||.5)),beliefReversionSamples:Math.max(0,Number(m.integrity?.beliefReversionSamples)||0),lastBeliefReversion:m.integrity?.lastBeliefReversion||null,beliefEstablishedPattern:m.integrity?.beliefEstablishedPattern||null,beliefLegacyPattern:m.integrity?.beliefLegacyPattern||null,beliefReplacementPattern:m.integrity?.beliefReplacementPattern||null,beliefReplacementStrength:Math.max(0,Number(m.integrity?.beliefReplacementStrength)||0),beliefReplacements:Math.max(0,Number(m.integrity?.beliefReplacements)||0),lastBeliefReplacement:m.integrity?.lastBeliefReplacement||null,beliefLastResolution:m.integrity?.beliefLastResolution||null,beliefRecoveryActive:m.integrity?.beliefRecoveryActive===true,beliefRecoveryTarget:m.integrity?.beliefRecoveryTarget||null,beliefRecoveryProgress:Math.max(0,Number(m.integrity?.beliefRecoveryProgress)||0),beliefRecoveries:Math.max(0,Number(m.integrity?.beliefRecoveries)||0),lastBeliefRecovery:m.integrity?.lastBeliefRecovery||null,resetFogBattles,resetAnchor:m.integrity?.resetAnchor||null,resetCatches:Math.max(0,Number(m.integrity?.resetCatches)||0),memoryAnchor,anchorStrength:Math.max(0,Number(m.integrity?.anchorStrength)||0),anchorBreakProgress:Math.max(0,Number(m.integrity?.anchorBreakProgress)||0),anchorCatches:Math.max(0,Number(m.integrity?.anchorCatches)||0),anchorCandidate:m.integrity?.anchorCandidate||null,anchorCandidateProgress:Math.max(0,Number(m.integrity?.anchorCandidateProgress)||0),anchorSwitches:Math.max(0,Number(m.integrity?.anchorSwitches)||0),anchorConflict,anchorConflictActive,anchorConflictCount:Math.max(0,Number(m.integrity?.anchorConflictCount)||0),conflictResolutions:{...m.integrity.conflictResolutions},conflictResolutionCount:Math.max(0,Number(m.integrity?.conflictResolutionCount)||0),lastConflictResolution:m.integrity?.lastConflictResolution||null,resolutionPrediction,resolutionConfidence,resolutionMargin,resolutionBaitProgress:Math.max(0,Number(m.integrity?.resolutionBaitProgress)||0),resolutionCounterplayArmed:m.integrity?.resolutionCounterplayArmed===true,resolutionCounterplays:Math.max(0,Number(m.integrity?.resolutionCounterplays)||0),lastResolutionCounterplay:m.integrity?.lastResolutionCounterplay||null,resolutionFogConflicts,conflictPredictionAtOpen,counterplaySuspicion,counterplayDetectionAtOpen,counterplayDetectionActive,counterplayDetectionChecks:Math.max(0,Number(m.integrity?.counterplayDetectionChecks)||0),lastCounterplayDetection:m.integrity?.lastCounterplayDetection||null,counterplayDirections:{...m.integrity.counterplayDirections},counterplayDirectionCount:Math.max(0,Number(m.integrity?.counterplayDirectionCount)||0),counterplaySuspicionTarget:tacticalCounterplayDirection(m).prediction,counterplaySuspicionTargetAtOpen:m.integrity?.counterplaySuspicionTargetAtOpen||null,counterplayDirectionActive:anchorConflictActive&&counterplayDetectionActive&&!!m.integrity?.counterplaySuspicionTargetAtOpen,lastSuspicionManipulation:m.integrity?.lastSuspicionManipulation||null,suspicionReversalMarks:{...m.integrity.suspicionReversalMarks},suspicionReversalCount:Math.max(0,Number(m.integrity?.suspicionReversalCount)||0),suspicionReversalTarget:tacticalSuspicionReversal(m).prediction,suspicionReversalTargetAtOpen:m.integrity?.suspicionReversalTargetAtOpen||null,suspicionReversalActive,lastSuspicionReversal:m.integrity?.lastSuspicionReversal||null,alerts:Math.max(0,Number(m.integrity?.alerts)||0)};}
  function tacticalMemorySnapshot(profile={}){const m=sanitizeTacticalMemoryProfile(profile),feint=tacticalMemoryLeader(m.feints.byDecoy),response=tacticalMemoryLeader(m.readResponses),payoff=tacticalMemoryLeader(m.payoffChoices),baseConfidence=Math.min(.20,m.battles*.025),memoryWar=tacticalMemoryWarState(m),confidence=baseConfidence*memoryWar.trustFactor;return {battles:m.battles,baseConfidence,confidence,memoryWar,feintPlan:feint.count>=1.5?feint.id:null,feintWeight:feint.count,response:response.count>=1.5?response.id:null,responseWeight:response.count,payoff:payoff.count>=1.5?payoff.id:null,payoffWeight:payoff.count};}
  function learnTacticalMemory(profile={},sample={}){const m=sanitizeTacticalMemoryProfile(profile),decay=.85,integrityDecay=.70,wasFog=Math.max(0,Number(m.integrity.resetFogBattles)||0),fogAnchor=m.integrity.resetAnchor,anchorBefore=m.integrity.memoryAnchor,conflictBefore=m.integrity.anchorConflict,predictionBefore=m.integrity.conflictPredictionAtOpen,counterplayArmedBefore=m.integrity.resolutionCounterplayArmed===true,detectionAtOpenBefore=Math.max(0,Number(m.integrity.counterplayDetectionAtOpen)||0),suspicionTargetAtOpenBefore=m.integrity.counterplaySuspicionTargetAtOpen||null,suspicionReversalAtOpenBefore=m.integrity.suspicionReversalTargetAtOpen||null,replacementAtOpenBefore=m.integrity.beliefReplacementAtOpen||null,legacyAtOpenBefore=m.integrity.beliefLegacyAtOpen||null,replacementStrengthAtOpenBefore=Math.max(0,Number(m.integrity.beliefReplacementStrengthAtOpen)||0),reversionScoreAtOpenBefore=Number.isFinite(Number(m.integrity.beliefReversionScoreAtOpen))?Math.max(0,Math.min(1,Number(m.integrity.beliefReversionScoreAtOpen))):Math.max(0,Math.min(1,Number(m.integrity.beliefReversionScore)||.5)),reversionSamplesAtOpenBefore=Math.max(0,Number(m.integrity.beliefReversionSamplesAtOpen)||0),reversionFeintAtOpenBefore=Math.max(0,Number(m.integrity.beliefReversionFeintAtOpen)||0),reversionCommitmentAtOpenBefore=Math.max(0,Number(m.integrity.beliefReversionCommitmentAtOpen)||0),commitmentBreakAtOpenBefore=Math.max(0,Number(m.integrity.beliefCommitmentBreakAtOpen)||0),commitmentTrapMemoryAtOpenBefore=Math.max(0,Math.min(2,Number(m.integrity.beliefCommitmentTrapMemoryAtOpen)||0)),commitmentBreakThresholdAtOpenBefore=2+commitmentTrapMemoryAtOpenBefore;m.battles=Math.min(TACTICAL_MEMORY_MAX_BATTLES,m.battles+1);m.feints.total*=decay;for(const id of Object.keys(m.feints.byDecoy))m.feints.byDecoy[id]*=decay;for(const id of Object.keys(m.readResponses))m.readResponses[id]*=decay;for(const id of Object.keys(m.payoffChoices))m.payoffChoices[id]*=decay;m.integrity.seedPressure*=integrityDecay;m.integrity.distrustBattles=Math.max(0,m.integrity.distrustBattles-1);m.integrity.resetFogBattles=Math.max(0,wasFog-1);const decoy=normalizeCombatPlan(sample.feintPlan);if(decoy!=='adaptive'){m.feints.total+=1;m.feints.byDecoy[decoy]=(m.feints.byDecoy[decoy]||0)+1;}if(Object.prototype.hasOwnProperty.call(m.readResponses,sample.readResponse))m.readResponses[sample.readResponse]+=1;if(wasFog>0&&fogAnchor&&sample.readResponse===fogAnchor){m.readResponses[fogAnchor]+=.5;m.integrity.resetCatches+=1;m.integrity.anchorCatches+=1;if(!m.integrity.memoryAnchor&&m.integrity.anchorCatches>=2){m.integrity.memoryAnchor=fogAnchor;m.integrity.anchorStrength=1;m.integrity.anchorBreakProgress=0;}}const liveAnchor=anchorBefore||m.integrity.memoryAnchor;if(liveAnchor){if(sample.readResponse===liveAnchor){m.integrity.anchorBreakProgress=0;m.integrity.anchorCandidate=null;m.integrity.anchorCandidateProgress=0;m.integrity.anchorConflict=null;}else if(['hold','retarget','abandon'].includes(sample.readResponse)){m.integrity.anchorBreakProgress=Math.min(3,m.integrity.anchorBreakProgress+1);if(m.integrity.anchorCandidate===sample.readResponse)m.integrity.anchorCandidateProgress=Math.min(3,m.integrity.anchorCandidateProgress+1);else{m.integrity.anchorCandidate=sample.readResponse;m.integrity.anchorCandidateProgress=1;}if(m.integrity.anchorCandidateProgress===2&&m.integrity.anchorConflict!==m.integrity.anchorCandidate){m.integrity.anchorConflict=m.integrity.anchorCandidate;m.integrity.anchorConflictCount+=1;const prior=tacticalResolutionPrior(m);m.integrity.conflictPredictionAtOpen=m.integrity.resolutionFogConflicts>0?null:prior.prediction;m.integrity.counterplayDetectionAtOpen=m.integrity.conflictPredictionAtOpen?m.integrity.counterplaySuspicion:0;const direction=tacticalCounterplayDirection(m);m.integrity.counterplaySuspicionTargetAtOpen=m.integrity.counterplayDetectionAtOpen>=2?direction.prediction:null;const reversal=tacticalSuspicionReversal(m);m.integrity.suspicionReversalTargetAtOpen=m.integrity.counterplaySuspicionTargetAtOpen&&reversal.prediction===m.integrity.counterplaySuspicionTargetAtOpen?reversal.prediction:null;const belief=tacticalBeliefStability(m);m.integrity.beliefStabilityAtOpen=belief.score;m.integrity.beliefStabilitySamplesAtOpen=belief.samples;m.integrity.beliefReplacementAtOpen=m.integrity.beliefReplacementPattern;m.integrity.beliefLegacyAtOpen=m.integrity.beliefLegacyPattern;m.integrity.beliefReplacementStrengthAtOpen=m.integrity.beliefReplacementStrength;m.integrity.beliefReversionScoreAtOpen=m.integrity.beliefReversionScore;m.integrity.beliefReversionSamplesAtOpen=m.integrity.beliefReversionSamples;m.integrity.beliefReversionFeintAtOpen=m.integrity.beliefReversionFeintEvidence;m.integrity.beliefReversionCommitmentAtOpen=m.integrity.beliefReversionCommitment;m.integrity.beliefCommitmentBreakAtOpen=m.integrity.beliefCommitmentBreakEvidence;m.integrity.beliefCommitmentTrapMemoryAtOpen=m.integrity.beliefCommitmentTrapMemory;}if(m.integrity.anchorCandidateProgress>=3){m.integrity.memoryAnchor=m.integrity.anchorCandidate;m.integrity.anchorStrength=1;m.integrity.anchorBreakProgress=0;m.integrity.anchorCatches=0;m.integrity.anchorCandidate=null;m.integrity.anchorCandidateProgress=0;m.integrity.anchorConflict=null;m.integrity.anchorSwitches+=1;}else if(m.integrity.anchorBreakProgress>=3){m.integrity.memoryAnchor=null;m.integrity.anchorStrength=0;m.integrity.anchorBreakProgress=0;m.integrity.anchorCatches=0;m.integrity.anchorCandidate=null;m.integrity.anchorCandidateProgress=0;m.integrity.anchorConflict=null;}}}if(conflictBefore){let resolution=null;if(sample.readResponse===anchorBefore)resolution='keep';else if(sample.readResponse===conflictBefore&&m.integrity.memoryAnchor===conflictBefore)resolution='switch';else if(['hold','retarget','abandon'].includes(sample.readResponse)&&sample.readResponse!==anchorBefore&&sample.readResponse!==conflictBefore&&!m.integrity.memoryAnchor)resolution='break';if(resolution){let counterplayResult=null;if(predictionBefore){if(counterplayArmedBefore){if(resolution!==predictionBefore){counterplayResult='success';for(const id of ['keep','switch','break'])m.integrity.conflictResolutions[id]*=.45;m.integrity.resolutionCounterplays+=1;m.integrity.resolutionFogConflicts=1;m.integrity.resolutionBaitProgress=0;m.integrity.resolutionCounterplayArmed=false;}else{counterplayResult='miss';m.integrity.resolutionBaitProgress=1;m.integrity.resolutionCounterplayArmed=false;}}else if(resolution===predictionBefore){m.integrity.resolutionBaitProgress=Math.min(2,m.integrity.resolutionBaitProgress+1);m.integrity.resolutionCounterplayArmed=m.integrity.resolutionBaitProgress>=2;if(m.integrity.resolutionCounterplayArmed)m.integrity.counterplaySuspicion=Math.min(2,m.integrity.counterplaySuspicion+1);}else{m.integrity.resolutionBaitProgress=0;m.integrity.resolutionCounterplayArmed=false;}}if(counterplayResult)m.integrity.lastResolutionCounterplay=counterplayResult;if(predictionBefore&&detectionAtOpenBefore>=2){m.integrity.counterplayDetectionChecks+=1;if(resolution!==predictionBefore){m.integrity.lastCounterplayDetection='confirmed';m.integrity.counterplaySuspicion=2;if(suspicionTargetAtOpenBefore){if(suspicionReversalAtOpenBefore){if(resolution===suspicionReversalAtOpenBefore){m.integrity.lastSuspicionReversal='backfired';m.integrity.suspicionReversalMarks[suspicionReversalAtOpenBefore]*=.25;}else{m.integrity.lastSuspicionReversal='confirmed';}}if(resolution===suspicionTargetAtOpenBefore){m.integrity.lastSuspicionManipulation='read';if(!suspicionReversalAtOpenBefore)m.integrity.suspicionReversalMarks[suspicionTargetAtOpenBefore]*=.65;}else{m.integrity.lastSuspicionManipulation='fooled';for(const id of ['keep','switch','break'])m.integrity.suspicionReversalMarks[id]*=.85;m.integrity.suspicionReversalMarks[suspicionTargetAtOpenBefore]+=1;m.integrity.suspicionReversalCount+=1;m.integrity.counterplayDirections[suspicionTargetAtOpenBefore]*=.20;m.integrity.counterplaySuspicion=Math.max(0,m.integrity.counterplaySuspicion-1);}}for(const id of ['keep','switch','break'])m.integrity.counterplayDirections[id]*=.85;m.integrity.counterplayDirections[resolution]+=1;m.integrity.counterplayDirectionCount+=1;}else{m.integrity.lastCounterplayDetection='false-alarm';m.integrity.counterplaySuspicion=Math.max(0,m.integrity.counterplaySuspicion-1);}}if(replacementAtOpenBefore&&legacyAtOpenBefore&&replacementAtOpenBefore!==legacyAtOpenBefore){const reversionWasActive=reversionSamplesAtOpenBefore>=3&&reversionScoreAtOpenBefore>=.65,reversionFeintWasActive=reversionWasActive&&reversionFeintAtOpenBefore>=2;m.integrity.beliefReversionSamples+=1;if(reversionWasActive){if(resolution===replacementAtOpenBefore){m.integrity.beliefReversionFeintEvidence=Math.min(2,m.integrity.beliefReversionFeintEvidence+1);if(reversionFeintWasActive)m.integrity.lastBeliefReversionFeint='confirmed';}else if(resolution===legacyAtOpenBefore){m.integrity.beliefReversionFeintEvidence=Math.max(0,m.integrity.beliefReversionFeintEvidence-1);if(reversionFeintWasActive)m.integrity.lastBeliefReversionFeint='backfired';}else{m.integrity.beliefReversionFeintEvidence=Math.max(0,m.integrity.beliefReversionFeintEvidence-1);if(reversionFeintWasActive)m.integrity.lastBeliefReversionFeint='diverged';}}if(resolution===legacyAtOpenBefore){m.integrity.beliefReversionScore=Math.min(1,reversionScoreAtOpenBefore+.30);m.integrity.lastBeliefReversion='returned';m.integrity.beliefReversionCommitment=Math.min(2,reversionCommitmentAtOpenBefore+1);if(reversionCommitmentAtOpenBefore>=2){m.integrity.lastBeliefReversionCommitment='confirmed';if(commitmentBreakAtOpenBefore>=commitmentBreakThresholdAtOpenBefore){m.integrity.beliefCommitmentBreakEvidence=0;m.integrity.lastBeliefCommitmentBreak='refuted';m.integrity.beliefCommitmentTraps+=1;m.integrity.beliefCommitmentTrapMemory=Math.min(2,m.integrity.beliefCommitmentTrapMemory+1);m.integrity.lastBeliefCommitmentTrap='success';}else m.integrity.beliefCommitmentBreakEvidence=Math.max(0,m.integrity.beliefCommitmentBreakEvidence-1);}}else if(resolution===replacementAtOpenBefore){m.integrity.beliefReversionScore=Math.max(0,reversionScoreAtOpenBefore-.20);m.integrity.lastBeliefReversion='persisted';m.integrity.beliefReversionCommitment=0;if(reversionCommitmentAtOpenBefore>=2){m.integrity.lastBeliefReversionCommitment='broken';m.integrity.beliefCommitmentBreakEvidence=Math.min(2+m.integrity.beliefCommitmentTrapMemory,m.integrity.beliefCommitmentBreakEvidence+1);if(commitmentBreakAtOpenBefore>=commitmentBreakThresholdAtOpenBefore)m.integrity.lastBeliefCommitmentBreak='confirmed';}}else{m.integrity.beliefReversionScore=Math.max(0,reversionScoreAtOpenBefore-.10);m.integrity.lastBeliefReversion='diverged';m.integrity.beliefReversionCommitment=Math.max(0,reversionCommitmentAtOpenBefore-1);if(reversionCommitmentAtOpenBefore>=2){m.integrity.lastBeliefReversionCommitment='eroded';m.integrity.beliefCommitmentBreakEvidence=Math.max(0,m.integrity.beliefCommitmentBreakEvidence-1);if(commitmentBreakAtOpenBefore>=commitmentBreakThresholdAtOpenBefore)m.integrity.lastBeliefCommitmentBreak='eroded';}}if(resolution===replacementAtOpenBefore){m.integrity.beliefReplacementStrength=Math.min(1,Math.max(m.integrity.beliefReplacementStrength,replacementStrengthAtOpenBefore)+.15);m.integrity.lastBeliefReplacement='reinforced';}else if(resolution===legacyAtOpenBefore){m.integrity.beliefReplacementStrength=Math.max(0,replacementStrengthAtOpenBefore*.35);m.integrity.lastBeliefReplacement='reverted';}else{m.integrity.beliefReplacementStrength=Math.max(0,replacementStrengthAtOpenBefore*.65);m.integrity.lastBeliefReplacement='eroded';}if(m.integrity.beliefReplacementStrength<.20)m.integrity.beliefReplacementPattern=null;}const recoveryWasActive=m.integrity.beliefRecoveryActive===true,beliefPrevious=m.integrity.beliefLastResolution;if(beliefPrevious){m.integrity.beliefStabilityScore=Math.max(0,Math.min(1,m.integrity.beliefStabilityScore+(beliefPrevious===resolution?.20:-.25)));}m.integrity.beliefStabilitySamples+=1;m.integrity.beliefLastResolution=resolution;if(recoveryWasActive){if(m.integrity.beliefRecoveryTarget===resolution)m.integrity.beliefRecoveryProgress=Math.min(3,m.integrity.beliefRecoveryProgress+1);else{m.integrity.beliefRecoveryTarget=resolution;m.integrity.beliefRecoveryProgress=1;}if(m.integrity.beliefRecoveryProgress>=3){const legacy=m.integrity.beliefLegacyPattern||m.integrity.beliefEstablishedPattern;m.integrity.beliefStabilityScore=Math.max(.70,m.integrity.beliefStabilityScore);m.integrity.beliefRecoveryActive=false;m.integrity.beliefRecoveryTarget=null;m.integrity.beliefRecoveryProgress=0;m.integrity.beliefRecoveries+=1;m.integrity.lastBeliefRecovery='restored';m.integrity.beliefEstablishedPattern=resolution;if(legacy&&legacy!==resolution){m.integrity.beliefLegacyPattern=legacy;m.integrity.beliefReplacementPattern=resolution;m.integrity.beliefReplacementStrength=1;m.integrity.beliefReplacements+=1;m.integrity.lastBeliefReplacement='replaced';}else{m.integrity.beliefLegacyPattern=resolution;m.integrity.beliefReplacementPattern=null;m.integrity.beliefReplacementStrength=0;}}}else if(m.integrity.beliefStabilitySamples>=3&&m.integrity.beliefStabilityScore<=.35){m.integrity.beliefRecoveryActive=true;m.integrity.beliefLegacyPattern=m.integrity.beliefEstablishedPattern||m.integrity.beliefLegacyPattern;m.integrity.beliefRecoveryTarget=resolution;m.integrity.beliefRecoveryProgress=1;}else if(m.integrity.beliefStabilitySamples>=3&&m.integrity.beliefStabilityScore>=.70){m.integrity.beliefEstablishedPattern=resolution;}for(const id of ['keep','switch','break'])m.integrity.conflictResolutions[id]*=.90;m.integrity.conflictResolutions[resolution]+=1;m.integrity.conflictResolutionCount+=1;m.integrity.lastConflictResolution=resolution;if(m.integrity.resolutionFogConflicts>0&&counterplayResult!=='success')m.integrity.resolutionFogConflicts=Math.max(0,m.integrity.resolutionFogConflicts-1);m.integrity.conflictPredictionAtOpen=null;m.integrity.counterplayDetectionAtOpen=0;m.integrity.counterplaySuspicionTargetAtOpen=null;m.integrity.suspicionReversalTargetAtOpen=null;m.integrity.beliefStabilityAtOpen=null;m.integrity.beliefStabilitySamplesAtOpen=0;m.integrity.beliefReplacementAtOpen=null;m.integrity.beliefLegacyAtOpen=null;m.integrity.beliefReplacementStrengthAtOpen=0;m.integrity.beliefReversionScoreAtOpen=null;m.integrity.beliefReversionSamplesAtOpen=0;m.integrity.beliefReversionFeintAtOpen=0;m.integrity.beliefReversionCommitmentAtOpen=0;m.integrity.beliefCommitmentBreakAtOpen=0;m.integrity.beliefCommitmentTrapMemoryAtOpen=0;}}const seed=['hold','retarget','abandon'].includes(sample.counterMemorySeed)?sample.counterMemorySeed:null,seedBonus=Math.max(0,Math.min(.75,Number(sample.counterMemoryBonus)||0));if(seed&&seed===sample.readResponse&&seedBonus>0){m.readResponses[seed]+=seedBonus;m.integrity.seedPressure=Math.min(4,m.integrity.seedPressure+1);if(m.integrity.seedPressure>=2.1){if(m.integrity.distrustBattles===0)m.integrity.alerts+=1;m.integrity.distrustBattles=2;}}if(Object.prototype.hasOwnProperty.call(m.payoffChoices,sample.payoffChoice))m.payoffChoices[sample.payoffChoice]+=1;if(sample.resetGambitArmed===true){m.integrity.resetFogBattles=2;m.integrity.resetAnchor=['hold','retarget','abandon'].includes(sample.resetAnchor)?sample.resetAnchor:(tacticalMemoryLeader(m.readResponses).id||null);}if(m.integrity.resetFogBattles===0&&!sample.resetGambitArmed)m.integrity.resetAnchor=null;m.updatedAt=Math.max(0,Number(sample.updatedAt)||Date.now());return m;}
  function tacticalMemoryFeintPrior(snapshot={},decoyPlan){const id=normalizeCombatPlan(decoyPlan),confidence=Math.max(0,Math.min(.20,Number(snapshot.confidence)||0)),familiar=Boolean(snapshot.feintPlan&&snapshot.feintPlan===id&&Number(snapshot.feintWeight||0)>=1.5&&confidence>=.075);return {familiar,confidence,planId:familiar?id:null};}
  function tacticalMemoryResponsePrior(snapshot={}){const confidence=Math.max(0,Math.min(.20,Number(snapshot.confidence)||0)),response=['hold','retarget','abandon'].includes(snapshot.response)?snapshot.response:null,weight=Math.max(0,Number(snapshot.responseWeight)||0),ready=Boolean(response&&weight>=1.5&&confidence>=.125);return {ready,confidence,response:ready?response:null,weight};}
  function createCounterMemoryState(){return {armed:false,used:false,seedResponse:null,confirmed:false,failed:false,costOrder:1,costMomentum:8,bonusWeight:.75,history:[]};}
  function canCounterMemory(st,response,resources={}){const c=st?.commitment||createReadCommitmentState(),cm=st?.counterMemory||(st.counterMemory=createCounterMemoryState());return Boolean(st?.armed&&!st.used&&!st.telegraphed&&c.locked&&!c.responded&&!cm.used&&!cm.armed&&!st?.memoryReset?.used&&!st?.memoryReset?.armed&&['hold','retarget','abandon'].includes(response)&&Number(resources.orderPoints||0)>=cm.costOrder&&Number(resources.momentum||0)>=cm.costMomentum);}
  function armCounterMemory(st,response,action=0){const cm=st?.counterMemory||(st.counterMemory=createCounterMemoryState());if(cm.used||cm.armed||!['hold','retarget','abandon'].includes(response))return false;cm.armed=true;cm.used=true;cm.seedResponse=response;cm.history.push({type:'counter-memory-armed',seedResponse:response,bonusWeight:cm.bonusWeight,action:Number(action)||0});st.history.push({type:'counter-memory-armed',seedResponse:response,action:Number(action)||0});return true;}
  function resolveCounterMemory(st,response,action=0){const cm=st?.counterMemory||createCounterMemoryState();if(!cm.armed||!['hold','retarget','abandon'].includes(response))return 'none';cm.armed=false;cm.confirmed=cm.seedResponse===response;cm.failed=!cm.confirmed;const outcome=cm.confirmed?'seeded':'wasted';cm.history.push({type:'counter-memory-resolved',seedResponse:cm.seedResponse,response,outcome,bonusWeight:cm.confirmed?cm.bonusWeight:0,action:Number(action)||0});st.history.push({type:'counter-memory-resolved',seedResponse:cm.seedResponse,response,outcome,action:Number(action)||0});return outcome;}
  function createMemoryResetGambitState(){return {armed:false,used:false,costOrder:1,costMomentum:14,fogBattles:2,anchor:null,forfeitPayoff:false,history:[]};}
  function canMemoryResetGambit(st,snapshot={},resources={}){const c=st?.commitment||createReadCommitmentState(),rg=st?.memoryReset||(st.memoryReset=createMemoryResetGambitState());return Boolean(st?.armed&&!st.used&&!st.telegraphed&&c.locked&&!c.responded&&!rg.used&&!rg.armed&&!st?.counterMemory?.used&&!st?.counterMemory?.armed&&Number(snapshot?.battles||0)>=3&&Number(snapshot?.baseConfidence||0)>=.075&&Number(resources.orderPoints||0)>=rg.costOrder&&Number(resources.momentum||0)>=rg.costMomentum);}
  function armMemoryResetGambit(st,snapshot={},action=0){const rg=st?.memoryReset||(st.memoryReset=createMemoryResetGambitState());if(rg.used||rg.armed)return false;rg.armed=true;rg.used=true;rg.forfeitPayoff=true;rg.anchor=['hold','retarget','abandon'].includes(snapshot?.response)?snapshot.response:null;rg.history.push({type:'memory-reset-armed',anchor:rg.anchor,fogBattles:rg.fogBattles,forfeitPayoff:true,action:Number(action)||0});st.history.push({type:'memory-reset-armed',anchor:rg.anchor,action:Number(action)||0});return true;}

  function createMemoryExploitState(){return {armed:false,used:false,prediction:null,confidence:0,matched:null,outcome:null,extraTelegraphDelay:0,payoffWindowActions:2,history:[]};}
  function armMemoryExploitation(st,snapshot={},action=0){const c=st?.commitment||createReadCommitmentState(),mx=st?.memoryExploit||(st.memoryExploit=createMemoryExploitState()),prior=tacticalMemoryResponsePrior(snapshot);if(!st?.armed||st.used||st.telegraphed||!c.locked||c.responded||mx.used||mx.armed||!prior.ready)return false;mx.armed=true;mx.prediction=prior.response;mx.confidence=prior.confidence;mx.history.push({type:'memory-exploit-armed',prediction:mx.prediction,confidence:mx.confidence,action:Number(action)||0});st.history.push({type:'memory-exploit-armed',prediction:mx.prediction,confidence:mx.confidence,action:Number(action)||0});return true;}
  function resolveMemoryExploitation(st,response,action=0){const mx=st?.memoryExploit||createMemoryExploitState();if(!mx.armed||mx.used||!['hold','retarget','abandon'].includes(response))return 'none';mx.armed=false;mx.used=true;mx.matched=mx.prediction===response;if(mx.matched){mx.outcome='matched';mx.payoffWindowActions=1;}else{mx.outcome='overfit';mx.extraTelegraphDelay=1;mx.payoffWindowActions=2;}mx.history.push({type:'memory-exploit-resolved',prediction:mx.prediction,response,matched:mx.matched,outcome:mx.outcome,extraTelegraphDelay:mx.extraTelegraphDelay,payoffWindowActions:mx.payoffWindowActions,action:Number(action)||0});st.history.push({type:'memory-exploit-resolved',prediction:mx.prediction,response,matched:mx.matched,outcome:mx.outcome,action:Number(action)||0});return mx.outcome;}
  function createPlanFeintState(){return {available:false,used:false,actualPlan:null,candidates:[],chosenPlan:null,history:[]};}
  function planFeintChoices(actualPlan){return [...(PLAN_FEINTS[normalizeCombatPlan(actualPlan)]||[])];}
  function canPlanFeint(counterState,feintState,decoyPlan,resources={}){const cb=counterState||createEnemyCounterBranchState(),fs=feintState||createPlanFeintState(),id=normalizeCombatPlan(decoyPlan);return Boolean(cb.armed&&!cb.used&&!cb.telegraphed&&!cb.commitment?.locked&&!fs.used&&fs.available&&fs.candidates.includes(id)&&id!==cb.branchPlan&&Number(resources.orderPoints||0)>=1);}
  function chooseAutoPlanFeint(actualPlan,context={}){const choices=planFeintChoices(actualPlan);if(!choices.length)return null;const hp=Number(context.playerHpRatio??1),enemyHp=Number(context.enemyHpRatio??1),momentum=Number(context.momentum||0);return choices.map((id,index)=>({id,index,score:planBranchScore(id,null,{playerHpRatio:enemyHp,enemyHpRatio:hp,momentum:-momentum})})).sort((a,b)=>b.score-a.score||a.index-b.index)[0].id;}
  function shouldAutoFeint(context={}){return Number(context.orderPoints||0)>=2&&(Number(context.playerHpRatio??1)<.58||Number(context.momentum||0)<15);}
  function createDoubleBluffState(){return {available:false,used:false,active:false,stage:'idle',startedAction:0,expiresAction:0,controlledEvidence:null,history:[]};}
  function createBluffDetectionState(){return {active:false,suspicion:0,verificationTurns:0,verificationResolved:false,detected:false,outcome:null,evidence:[],memoryCheckPending:false,memoryCheckUsed:false,history:[],doubleBluff:createDoubleBluffState()};}
  function bluffDetectionStage(st){const b=st?.bluff||createBluffDetectionState();if(!b.active)return 'idle';if(b.detected)return 'detected';if(b.doubleBluff?.active)return b.doubleBluff.stage==='armed'?'double-armed':'double-exposed';if(b.verificationResolved)return b.outcome==='unconfirmed'?'fooled':'verified';if(b.suspicion>0)return 'suspect';return 'masked';}
  function canDoubleBluff(st,resources={}){const b=st?.bluff||createBluffDetectionState(),db=b.doubleBluff||createDoubleBluffState();return Boolean(st?.armed&&!st.used&&!st.telegraphed&&!st?.commitment?.locked&&b.active&&!b.detected&&b.suspicion===1&&!db.used&&!db.active&&Number(resources.orderPoints||0)>=1&&Number(resources.momentum||0)>=10);}
  function armDoubleBluff(st,action=0){const b=st?.bluff;if(!b?.active||b.detected||b.suspicion!==1)return false;const db=b.doubleBluff||(b.doubleBluff=createDoubleBluffState());if(db.used||db.active)return false;db.available=false;db.used=true;db.active=true;db.stage='armed';db.startedAction=Number(action)||0;db.expiresAction=db.startedAction+2;db.history.push({type:'double-bluff-armed',action:db.startedAction,suspicion:b.suspicion,readPlan:st.readPlan,actualPlan:st.branchPlan});b.history.push({type:'double-bluff-armed',action:db.startedAction});return true;}
  function noteBluffContradiction(st,token){const b=st?.bluff;if(!b?.active||b.detected||!token||b.evidence.includes(token))return false;if(b.verificationResolved&&b.outcome!=='unconfirmed')return false;const db=b.doubleBluff||createDoubleBluffState();if(db.active&&db.stage==='armed'){b.evidence.push(token);db.controlledEvidence=token;db.stage='exposed';db.history.push({type:'controlled-truth',token,suspicionHeld:b.suspicion});b.history.push({type:'controlled-truth',token,suspicion:b.suspicion});return 'controlled';}if(b.verificationResolved&&b.outcome==='unconfirmed'){b.verificationResolved=false;b.history.push({type:'verify-reopen',token});}b.evidence.push(token);b.suspicion+=1;b.history.push({type:'contradiction',token,suspicion:b.suspicion});return true;}
  function advanceBluffVerification(st){const b=st?.bluff;if(!b?.active||b.detected)return 'none';if(b.memoryCheckPending&&!b.memoryCheckUsed&&b.suspicion<=0){b.memoryCheckPending=false;b.memoryCheckUsed=true;b.verificationTurns+=1;b.history.push({type:'memory-check',turn:b.verificationTurns,readPlan:st.readPlan,suspicion:b.suspicion});return 'memory-check';}if(b.verificationResolved||b.suspicion<=0)return 'none';const db=b.doubleBluff||createDoubleBluffState();b.verificationTurns+=1;b.history.push({type:'verify-turn',turn:b.verificationTurns,suspicion:b.suspicion,doubleStage:db.stage});if(db.active&&db.stage==='exposed'){db.active=false;db.stage='resolved';b.verificationResolved=true;b.outcome='unconfirmed';db.history.push({type:'double-bluff-held',turn:b.verificationTurns,readPlan:st.readPlan});b.history.push({type:'double-bluff-held',readPlan:st.readPlan});return 'double-held';}if(b.suspicion>=2){b.detected=true;b.verificationResolved=true;b.outcome='detected';st.readPlan=st.branchPlan;b.history.push({type:'detected',actualPlan:st.branchPlan});return 'detected';}b.verificationResolved=true;b.outcome='unconfirmed';b.history.push({type:'unconfirmed',readPlan:st.readPlan});return 'unconfirmed';}
  function expireDoubleBluff(st,action=0){const b=st?.bluff,db=b?.doubleBluff;if(!db?.active)return false;if(Number(action||0)<=Number(db.expiresAction||0))return false;db.active=false;db.stage='expired';db.history.push({type:'double-bluff-expired',action:Number(action)||0});b.history.push({type:'double-bluff-expired',action:Number(action)||0});return true;}
  function createCommitmentPayoffState(){return {resolved:false,accuracy:null,planCorrect:false,targetCorrect:false,strengthened:false,windowActive:false,expiresAction:0,used:false,choice:null,forfeited:false,history:[]};}
  function createReadCommitmentState(){return {locked:false,committedPlan:null,targetId:null,commitEnemyTurn:0,startedAction:0,responded:false,response:null,payoff:createCommitmentPayoffState(),history:[]};}
  function resolveCommitmentPayoff(st,actualPlan,actualTargetId,action=0){const c=st?.commitment;if(!c?.locked)return null;const po=c.payoff||(c.payoff=createCommitmentPayoffState());if(po.resolved)return po.accuracy;po.planCorrect=normalizeCombatPlan(actualPlan)===normalizeCombatPlan(c.committedPlan);po.targetCorrect=Boolean(c.targetId&&actualTargetId&&c.targetId===actualTargetId);po.accuracy=po.planCorrect&&po.targetCorrect?'correct':!po.planCorrect?'plan-miss':'target-miss';po.resolved=true;po.strengthened=po.accuracy==='correct';po.forfeited=Boolean(!po.strengthened&&st?.memoryReset?.forfeitPayoff);po.windowActive=!po.strengthened&&!po.forfeited;const memoryWindow=st?.memoryExploit?.matched===true?1:2;po.expiresAction=po.windowActive?(Number(action)||0)+memoryWindow:0;po.history.push({type:'commitment-payoff',accuracy:po.accuracy,committedPlan:c.committedPlan,actualPlan:normalizeCombatPlan(actualPlan),committedTarget:c.targetId,actualTarget:actualTargetId||null,strengthened:po.strengthened,forfeited:po.forfeited,memoryPrepared:st?.memoryExploit?.matched===true,windowActions:po.windowActive?memoryWindow:0,expiresAction:po.expiresAction,action:Number(action)||0});c.history.push({type:'commitment-payoff',accuracy:po.accuracy,strengthened:po.strengthened,forfeited:po.forfeited,memoryPrepared:st?.memoryExploit?.matched===true,expiresAction:po.expiresAction,action:Number(action)||0});return po.accuracy;}
  function commitmentPayoffWindowOpen(st,action=0){const po=st?.commitment?.payoff||createCommitmentPayoffState();return Boolean(po.resolved&&po.windowActive&&!po.used&&Number(action||0)<=Number(po.expiresAction||0));}
  function canCommitmentPayoffChoice(st,id,action=0){return commitmentPayoffWindowOpen(st,action)&&['seize','reclaim','extend'].includes(id);}
  function noteCommitmentPayoffChoice(st,id,action=0){if(!canCommitmentPayoffChoice(st,id,action))return false;const po=st.commitment.payoff;po.used=true;po.choice=id;po.windowActive=false;po.history.push({type:'payoff-choice',id,action:Number(action)||0});st.commitment.history.push({type:'payoff-choice',id,action:Number(action)||0});return true;}
  function expireCommitmentPayoff(st,action=0){const po=st?.commitment?.payoff;if(!po?.windowActive||po.used||Number(action||0)<=Number(po.expiresAction||0))return false;po.windowActive=false;po.history.push({type:'payoff-expired',action:Number(action)||0});st.commitment.history.push({type:'payoff-expired',action:Number(action)||0});return true;}
  function createEnemyCounterBranchState(){return {armed:false,used:false,sourcePlan:null,branchPlan:null,readPlan:null,targetId:null,signalCount:0,observedPhases:[],enemyTurns:0,telegraphed:false,resolveEnemyTurn:0,bluff:createBluffDetectionState(),commitment:createReadCommitmentState(),memoryExploit:createMemoryExploitState(),counterMemory:createCounterMemoryState(),memoryReset:createMemoryResetGambitState(),history:[]};}
  function enemyCounterReadPlan(st){return normalizeCombatPlan(st?.commitment?.locked?st.commitment.committedPlan:(st?.readPlan||st?.branchPlan||"adaptive"));}
  function enemyCounterBranchDef(planId){return ENEMY_COUNTER_BRANCHES[normalizeCombatPlan(planId)]||null;}
  function enemyReadCanCommit(st){const b=st?.bluff||createBluffDetectionState(),c=st?.commitment||createReadCommitmentState(),blocked=Boolean(b.active&&b.suspicion>0&&!b.verificationResolved);return Boolean(st?.armed&&!st.used&&!st.telegraphed&&!c.locked&&!blocked&&st.signalCount>=2&&st.enemyTurns>=2&&enemyCounterBranchDef(st.readPlan||st.branchPlan));}
  function commitEnemyRead(st,targetId=null,action=0){if(!enemyReadCanCommit(st))return false;const c=st.commitment||(st.commitment=createReadCommitmentState());c.locked=true;c.committedPlan=normalizeCombatPlan(st.readPlan||st.branchPlan);c.targetId=targetId||st.targetId||null;c.commitEnemyTurn=Number(st.enemyTurns||0);c.startedAction=Number(action)||0;c.history.push({type:'read-lock',planId:c.committedPlan,targetId:c.targetId,enemyTurn:c.commitEnemyTurn,action:c.startedAction});st.history.push({type:'read-lock',planId:c.committedPlan,targetId:c.targetId,enemyTurn:c.commitEnemyTurn,action:c.startedAction});return true;}
  function canReadLockResponse(st,id,resources={}){const c=st?.commitment||createReadCommitmentState();if(!c.locked||c.responded||st?.telegraphed||st?.used)return false;if(id==='hold')return true;if(id==='retarget')return Number(resources.orderPoints||0)>=1;if(id==='abandon')return Number(resources.momentum||0)>=12;return false;}
  function noteReadLockResponse(st,id,action=0){const c=st?.commitment;if(!c?.locked||c.responded||!['hold','retarget','abandon'].includes(id))return false;c.responded=true;c.response=id;c.history.push({type:'read-lock-response',id,action:Number(action)||0});st.history.push({type:'read-lock-response',id,action:Number(action)||0});return true;}
  function enemyCounterBranchCanTelegraph(st){const c=st?.commitment||createReadCommitmentState(),b=st?.bluff||createBluffDetectionState(),blocked=Boolean(b.active&&b.suspicion>0&&!b.verificationResolved);if(!c.locked)return Boolean(st?.armed&&!st.used&&!st.telegraphed&&!blocked&&st.signalCount>=2&&st.enemyTurns>=2&&enemyCounterBranchDef(enemyCounterReadPlan(st)));const memoryDelay=Math.max(0,Number(st?.memoryExploit?.extraTelegraphDelay)||0);return Boolean(st?.armed&&!st.used&&!st.telegraphed&&st.enemyTurns>=c.commitEnemyTurn+1+memoryDelay&&enemyCounterBranchDef(enemyCounterReadPlan(st)));}
  function enemyCounterBranchCanResolve(st){return Boolean(st?.armed&&!st.used&&st.telegraphed&&st.enemyTurns>=st.resolveEnemyTurn);}
  function createPlanRecoveryState(){ return {available:false,used:false,sourceDisruption:null,outcome:null,targetId:null,phase:null,expiresAction:0,snapshot:null,history:[]}; }
  function planRecoveryDef(id){ return PLAN_RECOVERIES[id]||null; }
  function canPlanRecover(recoveryState,id,resources={}){ const st=recoveryState||createPlanRecoveryState(),d=planRecoveryDef(id); if(!d||!st.available||st.used)return false; if(id==='rebuild')return Number(resources.orderPoints||0)>=1; if(id==='force')return Number(resources.momentum||0)>=20; return id==='pivot'; }
  function createPlanBranchState(){ return {available:false,used:false,sourcePlan:null,sourceDisruption:null,candidates:[],expiresAction:0,history:[]}; }
  function planBranchChoices(planId){ const row=PLAN_BRANCHES[normalizeCombatPlan(planId)]; return row?[...row.choices]:[]; }
  function canPlanBranch(branchState,planId){ const st=branchState||createPlanBranchState(); return Boolean(st.available&&!st.used&&st.candidates.includes(normalizeCombatPlan(planId))); }
  function planBranchScore(planId,sourceDisruption,context={}){ const id=normalizeCombatPlan(planId), meta=PLAN_BRANCH_META[id]||{}, hp=Number(context.playerHpRatio??1), enemyHp=Number(context.enemyHpRatio??1), momentum=Number(context.momentum||0); let score=10; if(sourceDisruption==='unweave'){if(id==='expose')score+=22;if(id==='detonate')score+=14;if(id==='lockdown')score+=8;} if(sourceDisruption==='compress'){if(id==='lockdown')score+=24;if(id==='nurture')score+=14;if(id==='detonate')score+=10;} if(sourceDisruption==='fortify'){if(id==='lockdown')score+=26;if(id==='expose')score+=20;if(id==='nurture')score+=8;} if(hp<.45){if(meta.tag==='sustain')score+=38;if(meta.tag==='control')score+=12;} if(enemyHp<.35){if(meta.tag==='burst')score+=28;if(meta.tag==='pressure')score+=18;} if(momentum>=40){if(meta.tag==='burst')score+=9;if(meta.tag==='pressure')score+=6;} if(momentum<=-20){if(meta.tag==='sustain')score+=14;if(meta.tag==='control')score+=9;} return score; }
  function choosePlanBranch(sourcePlan,sourceDisruption,context={}){ const choices=planBranchChoices(sourcePlan); if(!choices.length)return 'adaptive'; return choices.map((id,index)=>({id,index,score:planBranchScore(id,sourceDisruption,context)})).sort((a,b)=>b.score-a.score||a.index-b.index)[0].id; }
  function shouldAutoPivotPlan(sourcePlan,sourceDisruption,context={}){ if(!planBranchChoices(sourcePlan).length)return false; const hp=Number(context.playerHpRatio??1), enemyHp=Number(context.enemyHpRatio??1), momentum=Number(context.momentum||0); if(hp<.38)return true; if(sourceDisruption==='fortify'&&enemyHp>.45)return true; if(sourceDisruption==='compress'&&momentum<30)return true; return false; }
  function normalizeCombatPlan(id){ return COMBAT_PLANS[id]?id:"adaptive"; }
  function combatPlanScore(planId,actor,actionKindValue,reactionPreview){
    const plan=COMBAT_PLANS[normalizeCombatPlan(planId)]; if(plan.id==="adaptive")return reactionPreview?18:0;
    if(reactionPreview&&plan.reactionIds.includes(reactionPreview.id))return 100;
    if(plan.triggerKinds.includes(actionKindValue))return 28;
    if(plan.primerKinds.includes(actionKindValue))return 22;
    return reactionPreview?8:0;
  }
  const ADAPTIVE_ENEMY_RULES = Object.freeze({
    antiheal:{id:"antiheal",name:"Khóa Mạch",telegraph:"Địch nhận ra đội ta đang dựa nhiều vào hồi phục.",active:"Khóa Mạch: đòn địch gây Giảm Hồi Phục 35% trong 2 lượt.",counter:"Giảm nhịp hồi, dùng khiên/khống chế hoặc kết liễu trước khi đối sách phát huy."},
    ragehunt:{id:"ragehunt",name:"Săn Nộ",telegraph:"Địch đang đánh dấu các tướng giữ nhiều Nộ.",active:"Săn Nộ: địch ưu tiên mục tiêu Nộ cao và hút 12 Nộ khi đánh trúng.",counter:"Xả Nộ sớm, đổi sang Linh hoạt hoặc che mục tiêu bằng khiêu khích."},
    dotcleanse:{id:"dotcleanse",name:"Tẩy Mộng",telegraph:"Địch nhận ra đội ta đang chồng hiệu ứng Bào Mòn.",active:"Tẩy Mộng: đầu lượt địch tự gỡ 1 DOT và nhận +6 Nộ.",counter:"Rải DOT sang nhiều mục tiêu hoặc dồn sát thương trực tiếp trong nhịp tẩy."},
    focusguard:{id:"focusguard",name:"Chuyển Vệ",telegraph:"Địch nhận ra ta đang dồn đòn vào cùng một mục tiêu.",active:"Chuyển Vệ: mục tiêu bị tập trung được Hộ Thể tạm thời khi đối sách kích hoạt.",counter:"Đổi mục tiêu trong 1–2 lượt rồi quay lại sau khi Hộ Thể hết."}
  });
  function normalizeAdaptiveObservation(value={}){ return {healing:Math.max(0,Number(value.healing)||0),dotApplications:Math.max(0,Number(value.dotApplications)||0),focusHits:{...(value.focusHits||{})},highRageSeen:Math.max(0,Number(value.highRageSeen)||0)}; }
  function chooseAdaptiveEnemyRule(observation={}, context={}){
    const o=normalizeAdaptiveObservation(observation);
    if(o.healing>=Math.max(420,Number(context.playerTeamMaxHp||0)*0.16)) return "antiheal";
    if(o.highRageSeen>=2) return "ragehunt";
    if(o.dotApplications>=3) return "dotcleanse";
    const focus=Object.values(o.focusHits).reduce((m,v)=>Math.max(m,Number(v)||0),0);
    if(focus>=3) return "focusguard";
    return null;
  }
  function normalizeTactics(value={}){
    return { stance:TACTIC_STANCES[value.stance]?value.stance:"balanced", targetPriority:TARGET_PRIORITIES[value.targetPriority]?value.targetPriority:"opposite", ragePolicy:RAGE_POLICIES[value.ragePolicy]?value.ragePolicy:"balanced", slotCombo:SLOT_COMBO_MODES[value.slotCombo]?value.slotCombo:"linked", combatPlan:normalizeCombatPlan(value.combatPlan) };
  }
  function tacticDamageMultiplier(attacker){ const x=attacker?.teamTactics?.stance; return x==="assault"?1.08:x==="guard"?0.94:1; }
  function tacticDefenseMultiplier(target){ const x=target?.teamTactics?.stance; return x==="guard"?1.10:x==="assault"?0.95:1; }
  function tacticSupportMultiplier(unit){ return unit?.teamTactics?.stance==="guard"?1.08:1; }
  function tacticalPriorityTarget(actor, legal=[]){
    const candidates=legal.filter(u=>u&&u.hp>0); if(!candidates.length)return null;
    const priority=String(actor?.teamTactics?.targetPriority||"opposite");
    if(priority==="weakest") return candidates.slice().sort((a,b)=>hpRatio(a)-hpRatio(b)||a.slot-b.slot)[0]||null;
    if(priority==="rage") return candidates.slice().sort((a,b)=>(b.energy||0)-(a.energy||0)||hpRatio(a)-hpRatio(b))[0]||null;
    if(priority==="backline"){ const back=candidates.filter(u=>u.slot>=3); if(back.length)return back.slice().sort((a,b)=>a.slot-b.slot)[0]; }
    return preferredOppositeTarget(actor,candidates,{ignoreFormation:true});
  }
  function rageUltimateThreshold(policy){ return policy==="spend"?60:policy==="reserve"?85:70; }
  function linkedSlot(slot){ const n=Number(slot)||0; return n<3?n+3:n-3; }
  const TEAM_ARCHETYPE_COUNTERS = Object.freeze({ burst:"control", control:"sustain", sustain:"dot", dot:"counter", counter:"tempo", tempo:"burst" });
  const HERO_ARCHETYPE_TAGS = Object.freeze({
    ong_hang_pho:["sustain","control"], ong_chu_wifi:["tempo","control"], ca_tre_biet_buon:["dot","control"],
    thang_be_dieu_set:["burst","tempo"], nang_tien_ca_can:["control","dot"], robot_trong_rau:["sustain","counter"],
    meo_9_deadline:["burst","tempo"], ong_dia_lac_duong:["counter","sustain"], chi_ve_chai_thien_ha:["burst","counter"],
    hon_cay_bang:["sustain","control"], ky_lan_ca_phe:["tempo","sustain"], ong_ke_that_nghiep:["dot","control"]
  });
  const TEAM_ARCHETYPE_MODS = Object.freeze({
    burst:{atk:0.04,critFlat:4}, sustain:{hp:0.05,def:0.04}, control:{accuracyFlat:6,statusPower:0.05},
    tempo:{speed:0.04,energyFlat:5}, counter:{def:0.03,critResFlat:5}, dot:{atk:0.03,statusPower:0.07}
  });
  const BOND_RULES = Object.freeze([
    { id:"bep-vuon", name:"Bếp Ấm Vườn Xanh", members:["ong_hang_pho","robot_trong_rau"], tiers:[{count:2,mods:{hp:0.06,def:0.05},text:"2/2: +6% HP, +5% Thủ"}]},
    { id:"song-mo", name:"Sông Mơ Không Cạn", members:["ca_tre_biet_buon","nang_tien_ca_can"], tiers:[{count:2,mods:{atk:0.05,accuracyFlat:6},text:"2/2: +5% Công, +6 Chính xác"}]},
    { id:"ca-dem", name:"Ca Đêm Không Ngủ", members:["ong_chu_wifi","meo_9_deadline","ky_lan_ca_phe"], tiers:[{count:2,mods:{speed:0.05},text:"2/3: +5% Tốc"},{count:3,mods:{speed:0.08,energyFlat:6},text:"3/3: +8% Tốc, +6 Nộ"}]},
    { id:"tre-gap-ma", name:"Trẻ Con Gặp Ma", members:["thang_be_dieu_set","ong_ke_that_nghiep"], tiers:[{count:2,mods:{critFlat:5,accuracyFlat:5},text:"2/2: +5 Bạo kích, +5 Chính xác"}]}
  ]);

  function inferFaction(unit) {
    if (unit?.faction) return String(unit.faction);
    const id=String(unit?.sourceId||unit?.heroId||unit?.id||"");
    if (id && !id.startsWith("enemy-") && !id.startsWith("foe-") && !id.startsWith("gw_") && !id.startsWith("guild_boss_")) return "pho_thuc";
    return "neutral";
  }

  function addMods(base, extra) {
    for (const [key,value] of Object.entries(extra||{})) base[key]=(base[key]||0)+(Number(value)||0);
    return base;
  }

  function heroMasteryProfile(unit) {
    const p=progressionProfile(unit);
    const avgSkill=(Number(p.skillLevels?.basic||1)+Number(p.skillLevels?.skill||1)+Number(p.skillLevels?.ultimate||1))/3;
    const score=(p.level/20)+p.stars+avgSkill+(p.specialization?1:0);
    const level=score>=14?5:score>=11?4:score>=8?3:score>=6?2:score>=4?1:0;
    return { level, score:Number(score.toFixed(2)), primary:HERO_ARCHETYPE_TAGS[String(unit?.sourceId||unit?.id||"")]?.[0]||"", secondary:HERO_ARCHETYPE_TAGS[String(unit?.sourceId||unit?.id||"")]?.[1]||"" };
  }

  function teamArchetypeProfile(roster) {
    const scores={burst:0,sustain:0,control:0,tempo:0,counter:0,dot:0};
    for(const unit of roster){
      const tags=HERO_ARCHETYPE_TAGS[String(unit?.sourceId||unit?.heroId||unit?.id||"")]||[];
      const mastery=heroMasteryProfile(unit);
      if(tags[0]) scores[tags[0]]+=(2+(mastery.level>=3?0.5:0)+(mastery.level>=5?0.5:0));
      if(tags[1]) scores[tags[1]]+=1;
    }
    const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
    const [id,score]=ranked[0]||["",0];
    const second=ranked[1]||["",0];
    return {id,label:TEAM_ARCHETYPE_LABELS[id]||"Hỗn Hợp",score:Number(score.toFixed(1)),mastered:score>=8,active:score>=5,secondId:second[0],secondScore:Number(second[1].toFixed(1)),scores};
  }

  function buildTeamSynergy(units, team) {
    const roster=units.filter(u=>u.team===team);
    const factionCounts={}, roleCounts={};
    for (const u of roster) {
      const faction=inferFaction(u); factionCounts[faction]=(factionCounts[faction]||0)+1;
      const role=String(u.roleClass||u.archetype||"striker"); roleCounts[role]=(roleCounts[role]||0)+1;
    }
    const mods={}; const active=[];
    for (const [faction,count] of Object.entries(factionCounts)) {
      if (faction==="pho_thuc") { if(count>=2){addMods(mods,{hp:0.03,def:0.03});active.push("Phố Thức 2+: +3% HP, +3% Thủ");} if(count>=4){addMods(mods,{energyFlat:8});active.push("Phố Thức 4+: +8 Nộ khai trận");} }
      if (faction==="mong_dan") { if(count>=2){addMods(mods,{atk:0.04,accuracyFlat:4});active.push("Mộng Dân 2+: +4% Công, +4 Chính xác");} if(count>=4){addMods(mods,{critFlat:6});active.push("Mộng Dân 4+: +6 Bạo kích");} }
      if (faction==="dan_dem") { if(count>=2){addMods(mods,{speed:0.04,evasionFlat:2});active.push("Dân Đêm 2+: +4% Tốc, +2 Né");} if(count>=4){addMods(mods,{speed:0.07,critFlat:4});active.push("Dân Đêm 4+: +7% Tốc, +4 Bạo kích");} }
    }
    const frontliners=(roleCounts.guardian||0)+(roleCounts.support||0);
    const attackers=(roleCounts.striker||0)+(roleCounts.duelist||0)+(roleCounts.ranger||0);
    const sustain=(roleCounts.healer||0)+(roleCounts.support||0);
    if(frontliners>=2){addMods(mods,{def:0.06});active.push("Vững Trận: +6% Thủ");}
    if(attackers>=3){addMods(mods,{critFlat:6});active.push("Mũi Nhọn: +6 Bạo kích");}
    if(sustain>=2){addMods(mods,{hp:0.05,energyFlat:5});active.push("Hậu Cần: +5% HP, +5 Nộ");}
    if((roleCounts.mystic||0)>=2){addMods(mods,{atk:0.04,accuracyFlat:8});active.push("Pháp Trận: +4% Công, +8 Chính xác");}
    const ids=new Set(roster.map(u=>String(u.sourceId||u.heroId||u.id||"")));
    const bonds=[];
    for (const rule of BOND_RULES) {
      const count=rule.members.filter(id=>ids.has(id)).length;
      let tier=null; for (const t of rule.tiers) if(count>=t.count) tier=t;
      if(tier){addMods(mods,tier.mods);bonds.push({id:rule.id,name:rule.name,count,total:rule.members.length,text:tier.text});active.push(`${rule.name}: ${tier.text}`);}
    }
    const leader=roster.slice().sort((a,b)=>(a.slot??99)-(b.slot??99))[0]||null;
    let leaderAura="";
    if(leader){
      const role=String(leader.roleClass||leader.archetype||"striker");
      const auras={guardian:[{def:0.08},"Thành Đồng: +8% Thủ"],striker:[{atk:0.06},"Tiên Phong: +6% Công"],ranger:[{accuracyFlat:8},"Thần Xạ: +8 Chính xác"],healer:[{hp:0.07},"Nhân Tâm: +7% HP"],support:[{energyFlat:8},"Điều Phối: +8 Nộ"],duelist:[{critFlat:8},"Quyết Đấu: +8 Bạo kích"],mystic:[{speed:0.05,atk:0.03},"Huyền Trận: +5% Tốc, +3% Công"]};
      const aura=auras[role]; if(aura){addMods(mods,aura[0]);leaderAura=aura[1];active.push(`Chủ tướng ${leader.name}: ${leaderAura}`);}
    }
    const archetype=teamArchetypeProfile(roster);
    if(archetype.active){ addMods(mods,TEAM_ARCHETYPE_MODS[archetype.id]); active.push(`Lối đánh ${archetype.label}: ${archetype.mastered?"TINH THÔNG":"kích hoạt"}`); }
    return {team,mods,factionCounts,roleCounts,bonds,leaderId:leader?.id||null,leaderName:leader?.name||"",leaderAura,active,archetype};
  }

  function applyTeamSynergy(unit, synergy) {
    const m=synergy?.mods||{};
    return {...unit,
      faction:inferFaction(unit),
      hp:Math.max(1,Math.round((Number(unit.hp)||1)*(1+(m.hp||0)))),
      atk:Math.max(1,Math.round((Number(unit.atk)||1)*(1+(m.atk||0)))),
      def:Math.max(0,Math.round((Number(unit.def)||0)*(1+(m.def||0)))),
      speed:Math.max(1,Math.round((Number(unit.speed)||1)*(1+(m.speed||0)))),
      energy:clamp(Math.round((Number(unit.energy)||0)+(m.energyFlat||0)),0,100),
      accuracy:Math.max(0,(Number(unit.accuracy)||100)+(m.accuracyFlat||0)),
      evasion:Math.max(0,(Number(unit.evasion)||0)+(m.evasionFlat||0)),
      crit:Math.max(0,(Number(unit.crit)||0)+(m.critFlat||0)),
      critRes:Math.max(0,(Number(unit.critRes)||0)+(m.critResFlat||0)),
      statusPower:(Number(unit.statusPower)||0)+(m.statusPower||0),
      teamSynergy:synergy
    };
  }

  function roleAdvantageMultiplier(attacker,target) {
    const a=String(attacker?.roleClass||attacker?.archetype||"");
    const t=String(target?.roleClass||target?.archetype||"");
    if(ROLE_COUNTERS[a]===t) return 1.12;
    if(ROLE_COUNTERS[t]===a) return 0.92;
    return 1;
  }

  function archetypeMatchupMultiplier(attacker,target) {
    const a=String(attacker?.teamSynergy?.archetype?.id||"");
    const t=String(target?.teamSynergy?.archetype?.id||"");
    if(!a||!t||a===t) return 1;
    if(TEAM_ARCHETYPE_COUNTERS[a]===t) return 1.06;
    if(TEAM_ARCHETYPE_COUNTERS[t]===a) return 0.96;
    return 1;
  }

  function comboMultiplier(attacker,target) {
    const role=String(attacker?.roleClass||attacker?.archetype||"");
    let mult=1;
    if (target?.statuses?.some(s=>s.type==="bleed") && ["duelist","striker"].includes(role)) mult*=1.12;
    if (target?.statuses?.some(s=>s.type==="armorBreak") && ["ranger","striker"].includes(role)) mult*=1.10;
    if (target?.statuses?.some(s=>["stun","fear"].includes(s.type)) && role==="duelist") mult*=1.10;
    return mult;
  }

  const HERO_SIGNATURES = Object.freeze({
    ong_hang_pho:{passive1:"Nước Dùng Ấm",passive2:"Không Để Ai Đói",mods:{hp:0.03,energyFlat:5}},
    ong_chu_wifi:{passive1:"Full Vạch",passive2:"Tự Khôi Phục Kết Nối",mods:{speed:0.04,accuracyFlat:6}},
    ca_tre_biet_buon:{passive1:"Buồn Lây",passive2:"Nước Mắt Có Trọng Lượng",mods:{atk:0.04,statusPower:0.08}},
    thang_be_dieu_set:{passive1:"Gió Càng Lớn",passive2:"Sét Tìm Dây",mods:{critFlat:6,speed:0.03}},
    nang_tien_ca_can:{passive1:"Mắc Cạn Không Mắc Kẹt",passive2:"Mùi Nước Quen",mods:{accuracyFlat:8,critFlat:3}},
    robot_trong_rau:{passive1:"Rễ Sâu",passive2:"Ưu Tiên Mầm Sống",mods:{hp:0.05,def:0.05}},
    meo_9_deadline:{passive1:"Lách Deadline",passive2:"Chín Mạng Dự Phòng",mods:{speed:0.04,evasionFlat:5}},
    ong_dia_lac_duong:{passive1:"Lộc Đi Lạc",passive2:"Đường Nào Cũng Tới",mods:{energyFlat:6,critResFlat:5}},
    chi_ve_chai_thien_ha:{passive1:"Càng Tơi Càng Có Giá",passive2:"Không Bỏ Thứ Còn Dùng",mods:{atk:0.05,critFlat:4}},
    hon_cay_bang:{passive1:"Rễ Nhớ Tên",passive2:"Bóng Mát Cuối Cùng",mods:{hp:0.05,critResFlat:6}},
    ky_lan_ca_phe:{passive1:"Caffeine Trong Máu",passive2:"Shot Dự Phòng",mods:{speed:0.05,energyFlat:7}},
    ong_ke_that_nghiep:{passive1:"Sợ Bị Lãng Quên",passive2:"Hù Đúng Người",mods:{atk:0.03,statusPower:0.10}}
  });

  const BUILD_PRESETS = Object.freeze({
    assault:{id:"assault",name:"Công Phá",desc:"Dồn sát thương và kết liễu",mods:{atk:0.12,critFlat:8,critDamageFlat:0.12},talents:["Sắc Bén","Ép Nhịp","Trảm Kết"],ai:"aggressive"},
    bulwark:{id:"bulwark",name:"Kiên Thủ",desc:"Sống lâu, giữ tuyến, phản đòn",mods:{hp:0.13,def:0.14,critResFlat:8,startShieldPct:0.08},talents:["Da Đồng","Bất Khuất","Phản Chấn"],ai:"defensive"},
    tactician:{id:"tactician",name:"Điều Phối",desc:"Ra lượt sớm, khống chế, xoay nộ",mods:{speed:0.10,accuracyFlat:10,energyFlat:12,statusPower:0.12},talents:["Tiên Cơ","Định Tâm","Luân Chuyển"],ai:"control"}
  });

  function rarityTier(value){
    if(Number.isFinite(Number(value))) return clamp(Math.round(Number(value)),1,5);
    return ({b:1,a:2,s:3,ss:4,ssr:5,ur:5})[String(value||'').toLowerCase()]||3;
  }

  function progressionProfile(unit){
    const p=unit?.progression||{};
    const level=clamp(Math.round(Number(p.level||unit?.level||1)),1,60);
    const stars=clamp(Math.round(Number(p.stars||unit?.stars||1)),1,6);
    const rarity=rarityTier(p.rarity||unit?.rarity||3);
    const preset=BUILD_PRESETS[p.preset]||BUILD_PRESETS.assault;
    const talentPoints=clamp(Math.round(Number(p.talentPoints ?? Math.floor(level/5))),0,12);
    const skillLevels={basic:clamp(Math.round(Number(p.skillLevels?.basic||1)),1,5),skill:clamp(Math.round(Number(p.skillLevels?.skill||1)),1,5),ultimate:clamp(Math.round(Number(p.skillLevels?.ultimate||1)),1,5)};
    const equipment=Array.isArray(p.equipment)?p.equipment.slice(0,4):[]; const specialization=String(p.specialization||"");
    return {level,stars,rarity,preset:preset.id,presetData:preset,talentPoints,skillLevels,equipment,specialization};
  }

  function applyProgression(unit){
    const p=progressionProfile(unit); const m=p.presetData.mods||{}; const sig=HERO_SIGNATURES[String(unit?.sourceId||"")]||{mods:{}}; const sm=sig.mods||{};
    const starPower=1+(p.stars-1)*0.018; const qualityPower=1+(p.rarity-1)*0.012;
    const talentScale=Math.min(0.06,p.talentPoints*0.005);
    const out={...unit,
      hp:Math.max(1,Math.round((Number(unit.hp)||1)*starPower*qualityPower*(1+(m.hp||0)+(sm.hp||0)+talentScale*0.45))),
      atk:Math.max(1,Math.round((Number(unit.atk)||1)*starPower*qualityPower*(1+(m.atk||0)+(sm.atk||0)+talentScale))),
      def:Math.max(0,Math.round((Number(unit.def)||0)*starPower*(1+(m.def||0)+(sm.def||0)+talentScale*0.6))),
      speed:Math.max(1,Math.round((Number(unit.speed)||1)*(1+(m.speed||0)+(sm.speed||0)))),
      energy:clamp(Math.round((Number(unit.energy)||0)+(m.energyFlat||0)+(sm.energyFlat||0)+(p.stars>=5?6:0)),0,100),
      accuracy:Math.max(0,(Number(unit.accuracy)||100)+(m.accuracyFlat||0)+(sm.accuracyFlat||0)),
      evasion:Math.max(0,(Number(unit.evasion)||0)+(m.evasionFlat||0)+(sm.evasionFlat||0)),
      crit:Math.max(0,(Number(unit.crit)||0)+(m.critFlat||0)+(sm.critFlat||0)+(p.rarity>=5?3:0)),
      critRes:Math.max(0,(Number(unit.critRes)||0)+(m.critResFlat||0)+(sm.critResFlat||0)),
      critDamage:Math.max(1.35,(Number(unit.critDamage)||1.55)+(m.critDamageFlat||0)),
      progression:p, buildPreset:p.preset, buildAi:p.presetData.ai, statusPower:Number(m.statusPower||0)+Number(sm.statusPower||0), passive2:sig.passive2||""
    };
    out.maxHp=out.hp;
    out.startShield=Math.round(out.hp*(m.startShieldPct||0));
    return out;
  }

  function skillLevelMultiplier(unit, action){
    const p=unit?.progression?.skillLevels||progressionProfile(unit).skillLevels;
    const lvl=action==='ultimate'?p.ultimate:action==='skill'?p.skill:p.basic;
    return 1+(Math.max(1,lvl)-1)*0.06;
  }

  function progressionPowerScore(unit){
    const p=progressionProfile(unit);
    return Math.round(p.level*8+p.stars*55+p.rarity*35+p.talentPoints*18+(p.skillLevels.basic+p.skillLevels.skill+p.skillLevels.ultimate)*22);
  }

  function defeatAnimation(elapsedMs, hideAfterMs = 1000, fallDurationMs = 320) {
    const elapsed = Math.max(0, Number(elapsedMs) || 0);
    const hideAfter = Math.max(1, Number(hideAfterMs) || 1000);
    const fallDuration = Math.max(1, Math.min(hideAfter, Number(fallDurationMs) || 320));
    const fadeDuration = Math.min(180, hideAfter * 0.25);
    const fadeStart = hideAfter - fadeDuration;
    return {
      visible: elapsed < hideAfter,
      fallProgress: clamp(elapsed / fallDuration, 0, 1),
      alpha: elapsed <= fadeStart ? 1 : clamp((hideAfter - elapsed) / Math.max(1, fadeDuration), 0, 1)
    };
  }

  function lowestHealth(units) {
    return units
      .filter((unit) => unit.hp > 0)
      .slice()
      .sort((a, b) => hpRatio(a) - hpRatio(b) || a.hp - b.hp)[0] || null;
  }

  function isFront(unit) { return Number(unit?.slot) >= 0 && Number(unit?.slot) <= 2; }

  function legalEnemyTargets(actor, enemies, options = {}) {
    const livingEnemies = enemies.filter((unit) => unit.hp > 0);
    if (!livingEnemies.length) return [];
    if (options.ignoreFormation) return livingEnemies;
    const front = livingEnemies.filter(isFront);
    return front.length ? front : livingEnemies;
  }

  function preferredOppositeTarget(actor, enemies, options = {}) {
    const livingEnemies = legalEnemyTargets(actor, enemies, options);
    if (!livingEnemies.length) return null;
    // Slots 0..2 are the front column, 3..5 the back column, top to bottom.
    // Prefer the facing row in the first occupied column, then its lowest slot.
    const front = livingEnemies.filter(isFront);
    const column = (front.length ? front : livingEnemies).slice().sort((a, b) => a.slot - b.slot);
    const row = (Number(actor?.slot) || 0) % 3;
    return column.find(unit => Number(unit.slot) % 3 === row) || column[0] || null;
  }

  function selectAiIntent(actor, allies, enemies, randomValue = 0.5) {
    const livingAllies = allies.filter((unit) => unit.hp > 0);
    const livingEnemies = enemies.filter((unit) => unit.hp > 0);
    const weakestAlly = lowestHealth(livingAllies);
    const weakestEnemy = lowestHealth(livingEnemies);
    const preferredEnemy = preferredOppositeTarget(actor, livingEnemies);
    const canUltimate = actor.energy >= ACTION_COSTS.ultimate;
    const canSkill = actor.energy >= ACTION_COSTS.skill;

    if (!preferredEnemy) return null;

    if (actor.archetype === "healer" && weakestAlly && hpRatio(weakestAlly) < 0.58) {
      if (canUltimate && livingAllies.filter((unit) => hpRatio(unit) < 0.75).length >= 2) {
        return { action: "ultimate", targetId: weakestAlly.id };
      }
      if (canSkill) return { action: "skill", targetId: weakestAlly.id };
    }

    const build=String(actor.buildPreset||actor.progression?.preset||"assault");
    if(build==="bulwark" && canSkill && ["guardian","support"].includes(actor.archetype) && randomValue>0.08) return {action:"skill",targetId:preferredEnemy.id};
    if(build==="tactician" && canSkill && randomValue>0.08) return {action:"skill",targetId:preferredEnemy.id};
    if (canUltimate && (randomValue > (build==="assault"?0.18:0.33) || livingEnemies.length <= 3)) {
      return { action: "ultimate", targetId: preferredEnemy.id };
    }
    if (canSkill && randomValue > (build==="tactician"?0.08:0.2)) {
      return { action: "skill", targetId: preferredEnemy.id };
    }

    return { action: "basic", targetId: preferredEnemy.id };
  }

  function tickStatuses(unit) {
    const events = [];
    const next = [];
    for (const status of unit.statuses || []) {
      if (status.type === "regen" && unit.hp > 0) {
        const amount = Math.min(unit.maxHp - unit.hp, status.power || 45);
        unit.hp += amount;
        if (amount > 0) events.push({ type: "heal", amount, status: status.type });
      }
      if (["burn", "bleed", "poison"].includes(status.type) && unit.hp > 0) {
        const defaults = { burn: 35, bleed: 28, poison: 24 };
        const amount = Math.min(unit.hp, status.power || defaults[status.type]);
        unit.hp -= amount;
        events.push({ type: "damage", amount, status: status.type });
      }
      if (["stun", "fear"].includes(status.type)) events.push({ type: "control", status: status.type });
      if (status.type === "nemVi") {
        const remaining = Math.max(0, Number(status.turns ?? 3) - 1);
        if (remaining > 0) next.push({ ...status, turns: remaining });
        else events.push({ type: "expired", status: "nemVi" });
        continue;
      }
      if (status.type === "anTran") {
        const remaining = Math.max(0, Number(status.turns ?? 3) - 1);
        if (remaining > 0) next.push({ ...status, turns: remaining });
        else events.push({ type: "expired", status: "anTran" });
        continue;
      }
      const remaining = status.turns - 1;
      if (remaining > 0) next.push({ ...status, turns: remaining });
    }
    unit.statuses = next;
    return events;
  }

  function hasStatus(unit, type) { return Boolean(unit?.statuses?.some((status) => status.type === type)); }

  function actionCost(action) {
    return ACTION_COSTS[action] ?? Infinity;
  }

  function canUseAction(unit, action) {
    if(action === "skill" && unit?._talentSkillActive){
      if(unit.hp <= 0 || hasStatus(unit,"silence")) return false;
      return true;
    }
    if(unit.hp <= 0 || unit.energy < actionCost(action)) return false;
    if(action !== "basic" && hasStatus(unit, "silence")) return false;
    return true;
  }

  const BATTLE_ORDERS = Object.freeze({
    ward:{id:"ward",name:"Hộ Trận",desc:"Khiên 10% HP + Guard 1 lượt cho toàn đội."},
    surge:{id:"surge",name:"Chuyển Nộ",desc:"+14 Nộ cho toàn bộ đồng minh còn sống."},
    cleanse:{id:"cleanse",name:"Thanh Tâm",desc:"Gỡ 1 bất lợi nguy hiểm trên mỗi đồng minh."}
  });
  const ADAPTIVE_ORDER_COUNTERS = Object.freeze({
    antiheal:{orderId:"cleanse",name:"Tịnh Mạch",hint:"Thanh Tâm trước khi Khóa Mạch kích hoạt",effect:"Giảm Khóa Mạch còn 18% trong 1 lượt."},
    ragehunt:{orderId:"ward",name:"Ẩn Nộ",hint:"Hộ Trận để che nhịp Nộ trước Săn Nộ",effect:"Săn Nộ chỉ hút 6 Nộ mỗi đòn."},
    dotcleanse:{orderId:"surge",name:"Dồn Nhịp",hint:"Chuyển Nộ trước khi Tẩy Mộng kích hoạt",effect:"Tẩy Mộng vẫn gỡ DOT nhưng không nhận +6 Nộ."},
    focusguard:{orderId:"surge",name:"Phá Vệ",hint:"Chuyển Nộ để phá nhịp Chuyển Vệ",effect:"Chuyển Vệ chỉ tạo 6% khiên và Hộ Thể 1 lượt."}
  });
  const ADAPTIVE_COUNTER_CHAINS = Object.freeze({
    antiheal:{nextRuleId:"focusguard",name:"Ép Vệ",reason:"Hồi phục bị bảo toàn, địch chuyển sang kéo dài giao tranh bằng Hộ Thể."},
    ragehunt:{nextRuleId:"antiheal",name:"Bẻ Nhịp",reason:"Săn Nộ bị che, địch chuyển sang khóa khả năng hồi phục để ép tài nguyên."},
    dotcleanse:{nextRuleId:"ragehunt",name:"Truy Nộ",reason:"Tẩy DOT không tạo lợi thế Nộ, địch quay sang săn các tướng đang tích Nộ."},
    focusguard:{nextRuleId:"dotcleanse",name:"Rũ Bám",reason:"Chuyển Vệ bị phá nhịp, địch ưu tiên tẩy hiệu ứng bào mòn để kéo lại thế trận."}
  });
  function adaptiveOrderCounter(ruleId){ return ADAPTIVE_ORDER_COUNTERS[ruleId]||null; }
  function adaptiveCounterChain(ruleId){ return ADAPTIVE_COUNTER_CHAINS[ruleId]||null; }
  function isAdaptiveOrderCounter(ruleId,orderId){ const x=adaptiveOrderCounter(ruleId); return Boolean(x&&x.orderId===orderId); }
  const SKILL_REACTIONS = Object.freeze([
    {id:'detonate',name:'Bạo Hỏa',primer:'burn',triggers:['break','execute','stun'],mode:'consume-burst',maxHpPct:0.12,powerScale:1.8,follow:{type:'marked',turns:1,power:0.10},desc:'Đồng đội kích nổ Thiêu Đốt, đổi DOT còn lại thành sát thương tức thời và để lại Điểm Yếu.'},
    {id:'rupture',name:'Xé Vết',primer:'bleed',triggers:['double','multi','execute'],mode:'consume-burst',maxHpPct:0.10,powerScale:1.6,follow:{type:'marked',turns:1,power:0.08},desc:'Liên kích của đồng đội xé Chảy Máu thành sát thương tức thời và để lộ sơ hở.'},
    {id:'expose',name:'Phá Thế',primer:'armorBreak',triggers:['double','multi','execute'],mode:'convert',follow:{type:'marked',turns:2,power:0.12},desc:'Đồng đội chuyển Phá Giáp thành Điểm Yếu kéo dài, đổi lợi thế xuyên thủ thành cửa sổ dồn sát thương.'},
    {id:'lockdown',name:'Khóa Nhịp',primer:'atkDown',triggers:['stun','fear'],mode:'extend',maxTurns:3,desc:'Khống chế của đồng đội kéo dài nhịp Giảm Công thêm 1 lượt, tối đa 3.'},
    {id:'nurture',name:'Dưỡng Thế',primer:'regen',triggers:['guard','guardAll','cleanseGuard'],mode:'extend-shield',maxTurns:3,shieldPct:0.06,desc:'Hộ trận của đồng đội nuôi Tái Sinh thêm 1 lượt và dựng một lớp khiên phụ.'}
  ]);
  function reactionPrimer(target,reaction,actor){
    const list=Array.isArray(target?.statuses)?target.statuses:[];
    return list.find(x=>x?.type===reaction.primer && x.sourceId && String(x.sourceId)!==String(actor?.id||''))||null;
  }
  function previewSkillReaction(actor,triggerKind,target){
    if(!actor||!target||actor.team!==target.team&&['guard','guardAll','cleanseGuard'].includes(triggerKind)) return null;
    for(const reaction of SKILL_REACTIONS){
      if(!reaction.triggers.includes(triggerKind)) continue;
      const primer=reactionPrimer(target,reaction,actor);
      if(primer) return {id:reaction.id,name:reaction.name,primer:reaction.primer,desc:reaction.desc,sourceId:primer.sourceId};
    }
    return null;
  }
  function upsertReactionStatus(target,status){
    if(!target||!status)return; target.statuses=Array.isArray(target.statuses)?target.statuses:[];
    const existing=target.statuses.find(x=>x.type===status.type);
    if(existing){existing.turns=Math.max(Number(existing.turns)||0,Number(status.turns)||0);existing.power=Math.max(Number(existing.power)||0,Number(status.power)||0); if(status.sourceId)existing.sourceId=status.sourceId;}
    else target.statuses.push({...status});
  }
  function applySkillReaction(actor,triggerKind,target){
    const preview=previewSkillReaction(actor,triggerKind,target); if(!preview)return {triggered:false};
    const reaction=SKILL_REACTIONS.find(x=>x.id===preview.id), list=Array.isArray(target.statuses)?target.statuses:[];
    const idx=list.findIndex(x=>x.type===reaction.primer&&String(x.sourceId||'')===String(preview.sourceId||'')); if(idx<0)return {triggered:false};
    const primer=list[idx]; let bonusDamage=0,shield=0;
    if(reaction.mode==='consume-burst'){
      const stored=Math.max(0,Number(primer.power)||0)*Math.max(1,Number(primer.turns)||1);
      bonusDamage=Math.max(1,Math.min(Math.round((Number(target.maxHp)||Number(target.hp)||1)*reaction.maxHpPct),Math.round(stored*reaction.powerScale)));
      list.splice(idx,1);
      if(reaction.follow)upsertReactionStatus(target,{...reaction.follow,sourceId:actor.id,sourceHeroId:actor.sourceId||actor.id});
    }else if(reaction.mode==='convert'){
      list.splice(idx,1); if(reaction.follow)upsertReactionStatus(target,{...reaction.follow,sourceId:actor.id,sourceHeroId:actor.sourceId||actor.id});
    }else if(reaction.mode==='extend'){
      primer.turns=Math.min(reaction.maxTurns,Math.max(1,Number(primer.turns)||1)+1);
    }else if(reaction.mode==='extend-shield'){
      primer.turns=Math.min(reaction.maxTurns,Math.max(1,Number(primer.turns)||1)+1); shield=Math.max(1,Math.round((Number(target.maxHp)||Number(target.hp)||1)*reaction.shieldPct));
    }
    return {triggered:true,id:reaction.id,name:reaction.name,primer:reaction.primer,bonusDamage,shield,sourceId:preview.sourceId,desc:reaction.desc};
  }

  const BATTLE_MOMENTUM = Object.freeze({min:-100,max:100,advantage:60,pressure:-60,decayPerRound:8,breakCost:24});
  function createBattleMomentumState(){ return {value:0,peak:0,trough:0,playerBreakReady:false,enemyBreakReady:false,playerBreakUsed:false,enemyBreakUsed:false,history:[]}; }
  function momentumBand(value){ const v=Number(value)||0; return v>=BATTLE_MOMENTUM.advantage?'advantage':v<=BATTLE_MOMENTUM.pressure?'pressure':v>=25?'edge':v<=-25?'strained':'neutral'; }
  function applyBattleMomentum(momentumState,delta,reason='event',meta={}){
    const st=momentumState&&typeof momentumState==='object'?momentumState:createBattleMomentumState();
    st.value=clamp(Math.round(Number(st.value)||0),BATTLE_MOMENTUM.min,BATTLE_MOMENTUM.max); st.history=Array.isArray(st.history)?st.history:[];
    const before=st.value, change=clamp(Math.round(Number(delta)||0),-24,24); st.value=clamp(before+change,BATTLE_MOMENTUM.min,BATTLE_MOMENTUM.max);
    st.peak=Math.max(Number(st.peak)||0,st.value); st.trough=Math.min(Number(st.trough)||0,st.value);
    if(st.value>=BATTLE_MOMENTUM.advantage&&!st.playerBreakUsed) st.playerBreakReady=true;
    if(st.value<=BATTLE_MOMENTUM.pressure&&!st.enemyBreakUsed) st.enemyBreakReady=true;
    st.history.push({type:'momentum',reason,delta:st.value-before,before,after:st.value,...meta}); return {state:st,before,after:st.value,delta:st.value-before,band:momentumBand(st.value)};
  }
  function decayBattleMomentum(momentumState){ const st=momentumState&&typeof momentumState==='object'?momentumState:createBattleMomentumState(); const v=Number(st.value)||0; if(v===0)return {state:st,before:0,after:0,delta:0,band:'neutral'}; return applyBattleMomentum(st,v>0?-Math.min(BATTLE_MOMENTUM.decayPerRound,v):Math.min(BATTLE_MOMENTUM.decayPerRound,-v),'round-decay'); }
  function spendMomentumBreak(momentumState,team){ const st=momentumState&&typeof momentumState==='object'?momentumState:createBattleMomentumState(); const player=team==='player'; const ready=player?st.playerBreakReady:st.enemyBreakReady, used=player?st.playerBreakUsed:st.enemyBreakUsed; if(!ready||used)return {ok:false,state:st,reason:used?'used':'not-ready'}; if(player){st.playerBreakReady=false;st.playerBreakUsed=true;}else{st.enemyBreakReady=false;st.enemyBreakUsed=true;} const delta=player?-BATTLE_MOMENTUM.breakCost:BATTLE_MOMENTUM.breakCost; const r=applyBattleMomentum(st,delta,player?'player-break':'enemy-break',{team}); return {ok:true,state:st,...r}; }
  function createBattleOrderState(){ return {points:2,maxPoints:2,used:[]}; }
  function applyBattleOrder(orderId, allies, orderState, effects={}){
    const order=BATTLE_ORDERS[orderId];
    const st=orderState&&typeof orderState==='object'?orderState:createBattleOrderState();
    st.points=clamp(Math.round(Number(st.points??2)),0,2); st.maxPoints=2; st.used=Array.isArray(st.used)?st.used:[];
    if(!order) return {ok:false,reason:'unknown',state:st,affected:0};
    if(st.points<=0) return {ok:false,reason:'empty',state:st,affected:0};
    if(st.used.includes(orderId)) return {ok:false,reason:'used',state:st,affected:0};
    const living=(allies||[]).filter(x=>x&&x.hp>0); let affected=0,gain=0,waste=0,removed=0;
    if(orderId==='ward'){ living.forEach(u=>{u.statuses=Array.isArray(u.statuses)?u.statuses:[]; if(!effects.canBuff||effects.canBuff(u)){u.statuses=u.statuses.filter(x=>x.type!=='guard');u.statuses.push({type:'guard',turns:1,power:0});}const minimum=Math.round((Number(u.maxHp)||Number(u.hp)||1)*.10);if(effects.grantShield)effects.grantShield(u,minimum);else u.shield=Math.max(Number(u.shield)||0,minimum);affected++;}); }
    if(orderId==='surge'){ living.forEach(u=>{const before=clamp(Number(u.energy)||0,0,100),after=clamp(before+14,0,100);u.energy=after;gain+=after-before;waste+=14-(after-before);affected++;}); }
    if(orderId==='cleanse'){ const bad=['stun','fear','silence','healDown','atkDown','defDown','armorBreak','burn','bleed','poison']; living.forEach(u=>{u.statuses=Array.isArray(u.statuses)?u.statuses:[];const idx=u.statuses.findIndex(x=>bad.includes(x.type));if(idx>=0){u.statuses.splice(idx,1);removed++;affected++;}}); }
    st.points-=1; st.used.push(orderId);
    return {ok:true,orderId,state:st,affected,gain,waste,removed};
  }

  const COMBAT_RESOURCES = Object.freeze({
    maxWill:6,
    startWill:1,
    gains:Object.freeze({variety:1,reaction:1}),
    spends:Object.freeze({
      channel:{id:"channel",name:"DẪN KHÍ",cost:2,desc:"+18 Nộ cho tướng đang hành động."},
      rally:{id:"rally",name:"CHẤN THẾ",cost:3,desc:"+16 Thế Trận cho phe người chơi."},
      rescue:{id:"rescue",name:"CỨU VIỆN",cost:4,desc:"Tạo khiên 12% HP tối đa cho đồng minh yếu nhất."}
    })
  });
  function createCombatResourceState(){return {will:COMBAT_RESOURCES.startWill,maxWill:COMBAT_RESOURCES.maxWill,round:0,roundActions:[],varietyRound:0,reactionRound:0,spentRound:0,gained:0,spent:0,history:[]};}
  function beginCombatResourceRound(resourceState,round){const st=resourceState&&typeof resourceState==='object'?resourceState:createCombatResourceState();st.round=Math.max(0,Number(round)||0);st.roundActions=[];return st;}
  function gainCombatWill(resourceState,amount=1,reason='event',meta={}){const st=resourceState&&typeof resourceState==='object'?resourceState:createCombatResourceState();st.maxWill=COMBAT_RESOURCES.maxWill;st.will=clamp(Math.round(Number(st.will)||0),0,st.maxWill);st.history=Array.isArray(st.history)?st.history:[];const before=st.will;st.will=clamp(before+Math.max(0,Math.round(Number(amount)||0)),0,st.maxWill);const gained=st.will-before;if(gained>0)st.gained=(Number(st.gained)||0)+gained;st.history.push({type:'will-gain',reason,amount:gained,before,after:st.will,...meta});return {state:st,gained,before,after:st.will};}
  function noteCombatResourceAction(resourceState,action,round){const st=resourceState&&typeof resourceState==='object'?resourceState:createCombatResourceState();const r=Math.max(0,Number(round)||0);if(st.round!==r)beginCombatResourceRound(st,r);if(!['basic','skill','ultimate'].includes(action))return {state:st,gained:0};st.roundActions=Array.isArray(st.roundActions)?st.roundActions:[];if(!st.roundActions.includes(action))st.roundActions.push(action);if(st.roundActions.length>=2&&st.varietyRound!==r){st.varietyRound=r;return gainCombatWill(st,COMBAT_RESOURCES.gains.variety,'action-variety',{round:r,actions:[...st.roundActions]});}return {state:st,gained:0};}
  function noteCombatResourceReaction(resourceState,round,count=1){const st=resourceState&&typeof resourceState==='object'?resourceState:createCombatResourceState();const r=Math.max(0,Number(round)||0);if(Number(count)<=0||st.reactionRound===r)return {state:st,gained:0};st.reactionRound=r;return gainCombatWill(st,COMBAT_RESOURCES.gains.reaction,'skill-reaction',{round:r,count:Number(count)||1});}
  function combatResourceSpendDef(id){return COMBAT_RESOURCES.spends[id]||null;}
  function canSpendCombatWill(resourceState,id,round){const st=resourceState&&typeof resourceState==='object'?resourceState:createCombatResourceState(),def=combatResourceSpendDef(id);return Boolean(def&&Number(st.will||0)>=def.cost&&Number(st.spentRound||0)!==Number(round||0));}
  function spendCombatWill(resourceState,id,round,meta={}){const st=resourceState&&typeof resourceState==='object'?resourceState:createCombatResourceState(),def=combatResourceSpendDef(id);if(!def)return {ok:false,reason:'unknown',state:st};if(Number(st.spentRound||0)===Number(round||0))return {ok:false,reason:'round-used',state:st};if(Number(st.will||0)<def.cost)return {ok:false,reason:'empty',state:st};const before=Number(st.will)||0;st.will=before-def.cost;st.spentRound=Number(round)||0;st.spent=(Number(st.spent)||0)+def.cost;st.history=Array.isArray(st.history)?st.history:[];st.history.push({type:'will-spend',id,cost:def.cost,before,after:st.will,round:Number(round)||0,...meta});return {ok:true,id,cost:def.cost,state:st,before,after:st.will};}

  const TACTICAL_OPPORTUNITIES = Object.freeze({
    focus:{id:"focus",name:"HỢP KÍCH",desc:"Dùng 2 tướng khác nhau tấn công cùng một mục tiêu địch trước khi cơ hội kết thúc.",reward:"+1 Chiến Ý · +6 Thế Trận"},
    control:{id:"control",name:"KHÓA NHỊP",desc:"Gây tổng cộng 2 hiệu ứng Choáng/Sợ hãi trước khi cơ hội kết thúc.",reward:"+1 Chiến Ý · +8 Thế Trận"},
    hold:{id:"hold",name:"GIỮ TUYẾN",desc:"Kết thúc một lượt khi toàn đội còn sống và đồng minh yếu nhất còn ít nhất 45% HP.",reward:"Khiên 8% HP cho đồng minh yếu nhất · +6 Thế Trận"}
  });
  const TACTICAL_OPPORTUNITY_CYCLES = Object.freeze({eliminate:["focus","hold","control"],priority:["focus","control","hold"],ritual:["control","focus","hold"],survive:["hold","control","focus"],protect:["hold","focus","control"]});
  function createTacticalOpportunityState(objectiveType='eliminate'){return {objectiveType,armed:false,active:null,completed:0,missed:0,history:[]};}
  function armTacticalOpportunity(opportunityState,round){const st=opportunityState&&typeof opportunityState==='object'?opportunityState:createTacticalOpportunityState();const r=Math.max(0,Number(round)||0);if(st.armed||st.active||r<2)return null;const cycle=TACTICAL_OPPORTUNITY_CYCLES[st.objectiveType]||TACTICAL_OPPORTUNITY_CYCLES.eliminate;const id=cycle[(r+cycle.length)%cycle.length]||cycle[0];st.armed=true;st.active={id,startRound:r,expiresRound:r+1,progress:0,targetId:null,actors:[],controls:0};st.history.push({type:'opportunity-arm',id,round:r,expiresRound:r+1});return {...st.active};}
  function tacticalOpportunityDef(id){return TACTICAL_OPPORTUNITIES[id]||null;}
  function expireTacticalOpportunity(opportunityState,round){const st=opportunityState&&typeof opportunityState==='object'?opportunityState:createTacticalOpportunityState();if(!st.active)return null;const r=Math.max(0,Number(round)||0);if(r<=Number(st.active.expiresRound||0))return null;const expired={...st.active};st.active=null;st.missed=(Number(st.missed)||0)+1;st.history.push({type:'opportunity-miss',id:expired.id,round:r});return expired;}
  function noteTacticalOpportunityAction(opportunityState,actor,target,round,offensive=true){const st=opportunityState&&typeof opportunityState==='object'?opportunityState:createTacticalOpportunityState(),a=st.active;if(!a||a.id!=='focus'||!actor||actor.team!=='player'||!target||target.team!=='enemy'||!offensive)return {completed:false,state:st};const r=Math.max(0,Number(round)||0);if(r>Number(a.expiresRound||0))return {completed:false,state:st};if(a.targetId!==target.id){a.targetId=target.id;a.actors=[];}const id=String(actor.id);if(!a.actors.includes(id))a.actors.push(id);a.progress=a.actors.length;if(a.progress>=2){const done={...a,actors:[...a.actors]};st.active=null;st.completed=(Number(st.completed)||0)+1;st.history.push({type:'opportunity-complete',id:done.id,round:r,progress:done.progress});return {completed:true,id:done.id,state:st,detail:done};}return {completed:false,state:st,progress:a.progress};}
  function noteTacticalOpportunityControl(opportunityState,actor,round){const st=opportunityState&&typeof opportunityState==='object'?opportunityState:createTacticalOpportunityState(),a=st.active;if(!a||a.id!=='control'||!actor||actor.team!=='player')return {completed:false,state:st};const r=Math.max(0,Number(round)||0);if(r>Number(a.expiresRound||0))return {completed:false,state:st};a.controls=(Number(a.controls)||0)+1;a.progress=a.controls;if(a.controls>=2){const done={...a};st.active=null;st.completed=(Number(st.completed)||0)+1;st.history.push({type:'opportunity-complete',id:done.id,round:r,progress:done.controls});return {completed:true,id:done.id,state:st,detail:done};}return {completed:false,state:st,progress:a.controls};}
  function evaluateHoldOpportunity(opportunityState,allies,round){const st=opportunityState&&typeof opportunityState==='object'?opportunityState:createTacticalOpportunityState(),a=st.active;if(!a||a.id!=='hold')return {completed:false,state:st};const r=Math.max(0,Number(round)||0);if(r>Number(a.expiresRound||0))return {completed:false,state:st};const list=(allies||[]).filter(Boolean);if(!list.length||list.some(u=>u.hp<=0)||Math.min(...list.map(hpRatio))<.45)return {completed:false,state:st};const done={...a,progress:1};st.active=null;st.completed=(Number(st.completed)||0)+1;st.history.push({type:'opportunity-complete',id:done.id,round:r,progress:1});return {completed:true,id:done.id,state:st,detail:done};}

  const BATTLEFIELD_INTERACTABLES = Object.freeze({
    warDrum:{id:"warDrum",name:"TRỐNG TRẬN",desc:"Đánh trống lấy nhịp để giành thế chủ động.",effect:"+10 Thế Trận",zones:["vanguard","center","flank"]},
    supply:{id:"supply",name:"HÒM TIẾP TẾ",desc:"Rút dược hoàn và phù khí ngay giữa chiến tuyến.",effect:"+14 Nộ cho tướng hiện tại",zones:["highground","cover","rear"]},
    barricade:{id:"barricade",name:"KHIÊN MỘC",desc:"Dựng vật cản tạm thời trước đợt công kích kế tiếp.",effect:"Khiên 10% HP tối đa cho tướng hiện tại",zones:["vanguard","center","cover"]}
  });
  const INTERACTABLE_CYCLES = Object.freeze({
    eliminate:["warDrum","supply","barricade"], priority:["warDrum","supply","barricade"], ritual:["supply","warDrum","barricade"], survive:["barricade","supply","warDrum"], protect:["barricade","supply","warDrum"]
  });
  function createBattlefieldInteractableState(objectiveType='eliminate'){return {objectiveType,cycle:(INTERACTABLE_CYCLES[objectiveType]||INTERACTABLE_CYCLES.eliminate).slice(),cursor:0,active:null,used:0,expired:0,history:[]};}
  function armBattlefieldInteractable(interactableState,round){const st=interactableState&&typeof interactableState==='object'?interactableState:createBattlefieldInteractableState();const r=Math.max(0,Number(round)||0);st.history=Array.isArray(st.history)?st.history:[];if(st.active||r<2||r%2!==0)return null;const cycle=Array.isArray(st.cycle)&&st.cycle.length?st.cycle:INTERACTABLE_CYCLES.eliminate;const id=cycle[Number(st.cursor||0)%cycle.length]||'warDrum';st.cursor=(Number(st.cursor)||0)+1;st.active={id,armedRound:r,expiresRound:r+1};st.history.push({type:'interactable-arm',id,round:r,expiresRound:r+1});return {...st.active};}
  function expireBattlefieldInteractable(interactableState,round){const st=interactableState&&typeof interactableState==='object'?interactableState:createBattlefieldInteractableState();const r=Math.max(0,Number(round)||0);if(!st.active||r<=Number(st.active.expiresRound||0))return null;const old={...st.active};st.active=null;st.expired=(Number(st.expired)||0)+1;st.history.push({type:'interactable-expire',id:old.id,round:r,armedRound:old.armedRound});return old;}
  function battlefieldInteractableDef(id){return BATTLEFIELD_INTERACTABLES[id]||null;}
  function canUseBattlefieldInteractable(interactableState,actor,round){const st=interactableState&&typeof interactableState==='object'?interactableState:createBattlefieldInteractableState(),active=st.active,def=active?battlefieldInteractableDef(active.id):null;if(!active||!def||!actor||actor.team!=='player'||actor.hp<=0)return false;const r=Math.max(0,Number(round)||0);if(r>Number(active.expiresRound||0))return false;return def.zones.includes(battlefieldZone(actor).id);}
  function consumeBattlefieldInteractable(interactableState,actor,round,meta={}){const st=interactableState&&typeof interactableState==='object'?interactableState:createBattlefieldInteractableState();if(!canUseBattlefieldInteractable(st,actor,round))return {ok:false,state:st,reason:'unavailable'};const active={...st.active},def=battlefieldInteractableDef(active.id);st.active=null;st.used=(Number(st.used)||0)+1;st.history.push({type:'interactable-use',id:active.id,round:Number(round)||0,actorId:actor.id,zone:battlefieldZone(actor).id,...meta});return {ok:true,state:st,id:active.id,def,active};}

  const BATTLE_OBJECTIVES = Object.freeze({
    eliminate:{id:"eliminate",name:"TIÊU DIỆT",desc:"Đánh bại toàn bộ đội hình địch."},
    priority:{id:"priority",name:"TRẢM TƯỚNG",desc:"Hạ mục tiêu ưu tiên trước khi hết hạn."},
    survive:{id:"survive",name:"CẦM CỰ",desc:"Giữ ít nhất một chiến binh trụ vững đến hết thời hạn."},
    protect:{id:"protect",name:"HỘ TỐNG",desc:"Giữ mục tiêu hộ tống sống sót đến hết thời hạn."},
    ritual:{id:"ritual",name:"PHÁ NGHI THỨC",desc:"Dùng kỹ năng và tuyệt kỹ để tích đủ áp lực phá nghi thức trước hạn."},
    challenge:{id:"challenge",name:"KHIÊU CHIẾN 15 HIỆP",desc:"Một encounter duy nhất. Hết hiệp 15 phân xử theo tổng HP → tỉ lệ HP → số tướng sống; hòa tuyệt đối phe người chơi thắng."}
  });
  function normalizeBattleObjective(value={},units=[]){
    const raw=typeof value==='string'?{type:value}:(value&&typeof value==='object'?value:{});
    const type=BATTLE_OBJECTIVES[raw.type]?raw.type:'eliminate';
    const enemy=units.filter(u=>u.team==='enemy');
    const player=units.filter(u=>u.team==='player');
    const firstEnemy=enemy.find(u=>u.slot===0)||enemy[0]||null;
    const firstPlayer=player.find(u=>u.slot===0)||player[0]||null;
    const roundCap=Number(raw.maxRounds)>=60?60:STANDARD_ROUND_LIMIT;
    const maxRounds=Math.max(1,Math.min(roundCap,Math.floor(Number(raw.maxRounds)|| (type==='challenge'?STANDARD_ROUND_LIMIT:type==='survive'||type==='protect'?5:type==='priority'||type==='ritual'?6:STANDARD_ROUND_LIMIT))));
    const targetId=String(raw.targetId|| (type==='priority'?firstEnemy?.id:type==='protect'?firstPlayer?.id:'') ||'');
    const required=Math.max(1,Math.min(30,Math.floor(Number(raw.required)||8)));
    return {type,maxRounds,targetId,required,progress:0,started:false,resolved:false,winner:null,reason:null};
  }
  function battleObjectiveEvent(obj,event={}){
    if(!obj||obj.resolved)return obj;
    if(obj.type==='ritual'&&event.team==='player'&&['skill','ultimate'].includes(event.action)&&event.hit!==false){
      const base=event.action==='ultimate'?2:1, bonus=Math.max(0,Math.min(1,Number(event.interactionBonus)||0));
      obj.progress=Math.min(obj.required,obj.progress+base+bonus);
      obj.lastGain=base+bonus; obj.lastBonus=bonus;
    }
    return obj;
  }
  function evaluateBattleObjective(obj,ctx={}){
    if(!obj)return null;
    const players=ctx.players||[],enemies=ctx.enemies||[];
    const round=Math.max(0,Number(ctx.round)||0);
    if(players.length===0)return {winner:'enemy',reason:'party-wiped'};
    if(enemies.length===0)return {winner:'player',reason:'enemy-wiped'};
    if(obj.type==='challenge'){
      if(round>obj.maxRounds){
        const playerHp=players.reduce((sum,u)=>sum+Math.max(0,Number(u.hp)||0),0);
        const enemyHp=enemies.reduce((sum,u)=>sum+Math.max(0,Number(u.hp)||0),0);
        const playerMax=players.reduce((sum,u)=>sum+Math.max(1,Number(u.maxHp)||1),0);
        const enemyMax=enemies.reduce((sum,u)=>sum+Math.max(1,Number(u.maxHp)||1),0);
        const playerRatio=playerHp/Math.max(1,playerMax), enemyRatio=enemyHp/Math.max(1,enemyMax);
        if(playerHp!==enemyHp)return {winner:playerHp>enemyHp?'player':'enemy',reason:'round-limit-hp',playerHp,enemyHp,playerRatio,enemyRatio};
        if(Math.abs(playerRatio-enemyRatio)>1e-9)return {winner:playerRatio>enemyRatio?'player':'enemy',reason:'round-limit-ratio',playerHp,enemyHp,playerRatio,enemyRatio};
        if(players.length!==enemies.length)return {winner:players.length>enemies.length?'player':'enemy',reason:'round-limit-survivors',playerHp,enemyHp,playerRatio,enemyRatio};
        return {winner:'player',reason:'round-limit-tie',playerHp,enemyHp,playerRatio,enemyRatio};
      }
    }else if(obj.type==='priority'){
      const alive=enemies.some(u=>u.id===obj.targetId);
      if(!alive)return {winner:'player',reason:'priority-defeated'};
      if(round>obj.maxRounds)return {winner:'enemy',reason:'priority-escaped'};
    }else if(obj.type==='survive'){
      if(round>obj.maxRounds)return {winner:'player',reason:'survived'};
    }else if(obj.type==='protect'){
      const alive=players.some(u=>u.id===obj.targetId);
      if(!alive)return {winner:'enemy',reason:'protected-defeated'};
      if(round>obj.maxRounds)return {winner:'player',reason:'protected-survived'};
    }else if(obj.type==='ritual'){
      if(obj.progress>=obj.required)return {winner:'player',reason:'ritual-broken'};
      if(round>obj.maxRounds)return {winner:'enemy',reason:'ritual-completed'};
    }
    const roundCap=Math.max(STANDARD_ROUND_LIMIT,Math.min(60,Number(obj.maxRounds)||STANDARD_ROUND_LIMIT));
    if(round>roundCap){
      const playerHp=players.reduce((sum,u)=>sum+Math.max(0,Number(u.hp)||0),0);
      const enemyHp=enemies.reduce((sum,u)=>sum+Math.max(0,Number(u.hp)||0),0);
      if(playerHp!==enemyHp)return {winner:playerHp>enemyHp?'player':'enemy',reason:'round-limit-hp',playerHp,enemyHp};
      if(players.length!==enemies.length)return {winner:players.length>enemies.length?'player':'enemy',reason:'round-limit-survivors',playerHp,enemyHp};
      return {winner:'player',reason:'round-limit-tie',playerHp,enemyHp};
    }
    return null;
  }
  function battleObjectiveProgress(obj,ctx={}){
    if(!obj)return {value:0,max:1,label:'—',ratio:0,danger:false};
    const round=Math.max(0,Number(ctx.round)||0);
    if(obj.type==='eliminate'){const total=Math.max(1,Number(ctx.enemyTotal)||1),alive=(ctx.enemies||[]).length,reserve=Math.max(0,Number(ctx.enemyReserve)||0),defeated=Math.max(0,total-alive-reserve);return {value:defeated,max:total,label:`${defeated}/${total} địch bị hạ`,ratio:defeated/total,danger:false};}
    if(obj.type==='priority'){const alive=(ctx.enemies||[]).some(u=>u.id===obj.targetId),remain=Math.max(0,obj.maxRounds-round+1);return {value:alive?0:1,max:1,label:alive?`${remain} lượt còn lại`:'Mục tiêu đã bị hạ',ratio:alive?0:1,danger:alive&&remain<=2};}
    if(obj.type==='survive'||obj.type==='protect'){const done=Math.min(obj.maxRounds,Math.max(0,round-1));const remain=Math.max(0,obj.maxRounds-done);return {value:done,max:obj.maxRounds,label:remain?`Còn ${remain} lượt`:'Đã cầm cự đủ',ratio:done/obj.maxRounds,danger:remain<=1};}
    if(obj.type==='ritual')return {value:obj.progress,max:obj.required,label:`${obj.progress}/${obj.required} áp lực · hạn lượt ${obj.maxRounds}`,ratio:obj.progress/obj.required,danger:round>=obj.maxRounds&&obj.progress<obj.required};
    if(obj.type==='challenge'){
      const players=ctx.players||[],enemies=ctx.enemies||[];
      const playerHp=players.reduce((sum,u)=>sum+Math.max(0,Number(u.hp)||0),0), enemyHp=enemies.reduce((sum,u)=>sum+Math.max(0,Number(u.hp)||0),0);
      const remain=Math.max(0,obj.maxRounds-Math.min(obj.maxRounds,round));
      return {value:Math.min(obj.maxRounds,round),max:obj.maxRounds,label:`Hiệp ${Math.min(obj.maxRounds,round)}/${obj.maxRounds} · HP ${playerHp.toLocaleString('vi-VN')} · ${enemyHp.toLocaleString('vi-VN')}`,ratio:Math.min(1,round/obj.maxRounds),danger:remain<=2};
    }
    return {value:0,max:1,label:'—',ratio:0,danger:false};
  }

  const BOSS_PHASES = Object.freeze({
    1:{id:1,name:"THĂM DÒ",threshold:1,desc:"Boss giữ nhịp chiến đấu cơ bản.",effect:"Không có ưu tiên mục tiêu phase bổ sung."},
    2:{id:2,name:"PHÁ NHỊP",threshold:0.70,desc:"Boss đọc nguồn Nộ cao và tìm cách cắt nhịp bùng nổ.",effect:"Skill/Tuyệt kỹ ưu tiên Nộ cao; trúng đòn bào thêm 6 Nộ."},
    3:{id:3,name:"QUYẾT CHIẾN",threshold:0.35,desc:"Boss ép sâu vào hậu tuyến khi đã bị dồn tới giới hạn.",effect:"Skill/Tuyệt kỹ ưu tiên hậu tuyến yếu nhất và được xuyên tuyến."}
  });
  function createBossPhaseState(bossId=null){return {bossId,phase:1,pending:null,history:[]};}
  function bossPhaseForHp(unit){const r=hpRatio(unit);return r<=0.35?3:r<=0.70?2:1;}
  function inspectBossPhase(state,boss,round=1){
    if(!state||!boss||boss.id!==state.bossId||boss.hp<=0)return null;
    const desired=bossPhaseForHp(boss); if(desired<=state.phase||state.pending)return null;
    const nextPhase=Math.min(desired,state.phase+1);
    state.pending={phase:nextPhase,telegraphRound:round,activateRound:round+1};
    state.history.push({type:"telegraph",phase:desired,round}); return state.pending;
  }
  function activateBossPhase(state,round=1){
    if(!state?.pending||round<state.pending.activateRound)return null;
    state.phase=state.pending.phase; const activated={...state.pending,phase:state.phase}; state.pending=null;
    state.history.push({type:"activate",phase:state.phase,round}); return activated;
  }
  function bossPhaseTarget(phase,actor,legal=[],action="basic"){
    const pool=(legal||[]).filter(u=>u&&u.hp>0); if(!pool.length)return null;
    if(!["skill","ultimate"].includes(action)||phase<=1)return null;
    if(phase===2)return pool.slice().sort((a,b)=>(Number(b.energy)||0)-(Number(a.energy)||0)||hpRatio(a)-hpRatio(b))[0];
    const back=pool.filter(u=>Number(u.slot)>=3); const chosen=(back.length?back:pool).slice().sort((a,b)=>hpRatio(a)-hpRatio(b)||Number(b.slot)-Number(a.slot))[0]; return chosen||null;
  }
  function bossPhaseEnergyDrain(phase,actor,action="basic"){return phase===2&&actor?.team==="enemy"&&["skill","ultimate"].includes(action)?6:0;}
  function bossPhaseCanPierce(phase,actor,action="basic"){return phase>=3&&actor?.team==="enemy"&&["skill","ultimate"].includes(action);}

  const BATTLEFIELD_HAZARDS = Object.freeze({
    fireline:{id:'fireline',name:'HỎA TUYẾN',desc:'Một dải chiến trường bốc cháy ở lượt kế tiếp.',effect:'Unit còn đứng trong slot cảnh báo chịu 6% HP tối đa.',kind:'slots'},
    fog:{id:'fog',name:'SƯƠNG MÙ',desc:'Sương dày tràn vào các vị trí đã báo trước.',effect:'Unit trong slot cảnh báo nhận Giảm Chính Xác 12% trong 1 lượt.',kind:'slots'},
    rain:{id:'rain',name:'MƯA LỚN',desc:'Mưa quét toàn chiến trường ở lượt kế tiếp.',effect:'Cả hai phe được dập bớt Thiêu Đốt: −1 lượt và −35% sức đốt.',kind:'global'},
    fissure:{id:'fissure',name:'ĐỊA TẦNG NỨT',desc:'Mặt đất rạn dưới các vị trí đã báo trước.',effect:'Unit trong slot cảnh báo mất 12 Nộ khi địa tầng sụp.',kind:'slots'}
  });
  const HAZARD_CYCLES = Object.freeze({
    eliminate:['fog','fireline','fissure','rain'], priority:['fireline','fog','fissure','rain'], survive:['fissure','rain','fog','fireline'], protect:['fog','fissure','rain','fireline'], ritual:['rain','fog','fissure','fireline']
  });
  const HAZARD_SLOT_PATTERNS = Object.freeze([[0,3],[2,4],[1,5],[0,5],[1,4],[2,3]]);
  function createBattlefieldHazardState(objectiveType='eliminate'){
    const cycle=(HAZARD_CYCLES[objectiveType]||HAZARD_CYCLES.eliminate).slice();
    return {objectiveType,cycle,cursor:0,pending:null,lastResolved:null,history:[]};
  }
  function armBattlefieldHazard(st,currentRound=1){
    if(!st||st.pending)return null; const id=st.cycle[st.cursor%st.cycle.length]||'fog',def=BATTLEFIELD_HAZARDS[id]||BATTLEFIELD_HAZARDS.fog;
    const slots=def.kind==='slots'?HAZARD_SLOT_PATTERNS[st.cursor%HAZARD_SLOT_PATTERNS.length].slice():[];
    const pending={id,name:def.name,slots,armedRound:Math.max(1,Number(currentRound)||1),resolveRound:Math.max(2,(Number(currentRound)||1)+1)};
    st.pending=pending; st.cursor+=1; st.history.push({type:'telegraph',...pending}); return pending;
  }
  function battlefieldHazardAffects(unit,pending){return Boolean(unit&&pending&&(!pending.slots?.length||pending.slots.includes(Number(unit.slot))));}
  function resolveBattlefieldHazard(st,units=[],round=1){
    const pending=st?.pending;if(!pending||Number(round)<Number(pending.resolveRound))return {resolved:false,id:pending?.id||null,affected:[]};
    const affected=[]; for(const unit of units){if(!unit||unit.hp<=0||!battlefieldHazardAffects(unit,pending))continue;
      if(pending.id==='fireline'){const amount=Math.max(1,Math.round((Number(unit.maxHp)||1)*0.06));unit.hp=Math.max(0,unit.hp-amount);affected.push({id:unit.id,kind:'damage',amount});}
      else if(pending.id==='fog'){unit.statuses=Array.isArray(unit.statuses)?unit.statuses:[];unit.statuses.push({type:'accuracyDown',turns:1,power:0.12,sourceId:'hazard:fog'});affected.push({id:unit.id,kind:'accuracyDown',amount:0.12});}
      else if(pending.id==='fissure'){const before=Math.max(0,Number(unit.energy)||0);unit.energy=Math.max(0,before-12);affected.push({id:unit.id,kind:'energy',amount:before-unit.energy});}
      else if(pending.id==='rain'){let changed=0;for(const status of unit.statuses||[]){if(status.type==='burn'){status.turns=Math.max(0,(Number(status.turns)||1)-1);status.power=Math.max(1,Math.round((Number(status.power)||35)*0.65));changed++;}}unit.statuses=(unit.statuses||[]).filter(x=>(Number(x.turns)||0)>0);if(changed)affected.push({id:unit.id,kind:'douse',amount:changed});}
    }
    const result={resolved:true,id:pending.id,name:pending.name,slots:pending.slots.slice(),affected};st.lastResolved=result;st.history.push({type:'resolve',round,...result});st.pending=null;return result;
  }
  function battlefieldHazardLabel(pending){if(!pending)return '—';const def=BATTLEFIELD_HAZARDS[pending.id]||BATTLEFIELD_HAZARDS.fog;const slotText=pending.slots?.length?` · Slot ${pending.slots.map(x=>x+1).join(' & ')}`:' · Toàn chiến trường';return `${def.name}${slotText} · nổ ở lượt ${pending.resolveRound}`;}

  return Object.freeze({
    ACTION_COSTS,
    actionCost,
    buildTurnOrder,
    buildTeamSynergy,
    applyTeamSynergy,
    applyProgression,
    progressionProfile,
    progressionPowerScore,
    heroMasteryProfile,
    teamArchetypeProfile,
    TEAM_ARCHETYPE_LABELS,
    TEAM_ARCHETYPE_COUNTERS,
    HERO_ARCHETYPE_TAGS,
    TACTIC_STANCES,
    TARGET_PRIORITIES,
    RAGE_POLICIES,
    SLOT_COMBO_MODES,
    COMBAT_PLANS,
    TACTICAL_SEQUENCES,
    createTacticalSequenceState,
    tacticalSequenceDef,
    tacticalSequencePhaseLabel,
    normalizeCombatPlan,
    combatPlanScore,
    PLAN_DISRUPTIONS,
    createPlanDisruptionState,
    planDisruptionDef,
    sequencePrimerTypes,
    PLAN_RECOVERIES,
    createPlanRecoveryState,
    planRecoveryDef,
    canPlanRecover,
    PLAN_BRANCHES,
    PLAN_BRANCH_META,
    createPlanBranchState,
    planBranchChoices,
    canPlanBranch,
    planBranchScore,
    choosePlanBranch,
    shouldAutoPivotPlan,
    ENEMY_COUNTER_BRANCHES,
    PLAN_FEINTS,
    TACTICAL_MEMORY_VERSION,
    TACTICAL_MEMORY_MAX_BATTLES,
    createTacticalMemoryProfile,
    sanitizeTacticalMemoryProfile,
    tacticalMemorySnapshot,
    tacticalMemoryWarState,
    tacticalSuspicionReversal,
    tacticalBeliefStability,
    learnTacticalMemory,
    tacticalMemoryFeintPrior,
    tacticalMemoryResponsePrior,
    createCounterMemoryState,
    canCounterMemory,
    armCounterMemory,
    resolveCounterMemory,
    createMemoryResetGambitState,
    canMemoryResetGambit,
    armMemoryResetGambit,
    createMemoryExploitState,
    armMemoryExploitation,
    resolveMemoryExploitation,
    createPlanFeintState,
    planFeintChoices,
    canPlanFeint,
    chooseAutoPlanFeint,
    shouldAutoFeint,
    createDoubleBluffState,
    createBluffDetectionState,
    bluffDetectionStage,
    canDoubleBluff,
    armDoubleBluff,
    noteBluffContradiction,
    advanceBluffVerification,
    expireDoubleBluff,
    createCommitmentPayoffState,
    createReadCommitmentState,
    resolveCommitmentPayoff,
    commitmentPayoffWindowOpen,
    canCommitmentPayoffChoice,
    noteCommitmentPayoffChoice,
    expireCommitmentPayoff,
    createEnemyCounterBranchState,
    enemyCounterReadPlan,
    enemyReadCanCommit,
    commitEnemyRead,
    canReadLockResponse,
    noteReadLockResponse,
    enemyCounterBranchDef,
    enemyCounterBranchCanTelegraph,
    enemyCounterBranchCanResolve,
    choosePlanDisruption,
    ADAPTIVE_ENEMY_RULES,
    normalizeAdaptiveObservation,
    chooseAdaptiveEnemyRule,
    normalizeTactics,
    tacticalPriorityTarget,
    ENEMY_ROLE_DEFS,
    ENEMY_FORMATIONS,
    ENEMY_ELITE_TRAITS,
    enemyEliteTraitDef,
    enemyEliteCount,
    assignEnemyEliteTraits,
    enemyEliteDamageResponse,
    enemyEliteTurnStart,
    enemyEliteTelemetry,
    REINFORCEMENT_WAVES,
    reinforcementReserveCount,
    createReinforcementWaveState,
    canDeployReinforcementWave,
    reinforcementWaveDef,
    enemyRoleFor,
    enemyFormationForObjective,
    enemyRolePriorityTarget,
    HERO_TACTICAL_ROLE_DEFS,
    heroTacticalRoleFor,
    heroTacticalDamageMultiplier,
    heroProtectorMitigation,
    objectiveFormationDamageMultiplier,
    objectiveFormationRitualBonus,
    objectiveFormationRule,
    heroControllerEnergyDrain,
    heroEnablerEnergyGrant,
    heroVanguardMomentumGain,
    TEAM_ARCHETYPE_COUNTERS,
    rageUltimateThreshold,
    linkedSlot,
    skillLevelMultiplier,
    BUILD_PRESETS,
    FACTION_LABELS,
    inferFaction,
    roleAdvantageMultiplier,
    comboMultiplier,
    calculateDamage,
    calculateDamageDetailed,
    calculateHeal,
    canUseAction,
    BATTLE_ORDERS,
    ADAPTIVE_ORDER_COUNTERS,
    ADAPTIVE_COUNTER_CHAINS,
    adaptiveOrderCounter,
    adaptiveCounterChain,
    isAdaptiveOrderCounter,
    SKILL_REACTIONS,
    previewSkillReaction,
    applySkillReaction,
    BATTLE_MOMENTUM,
    createBattleMomentumState,
    momentumBand,
    applyBattleMomentum,
    decayBattleMomentum,
    spendMomentumBreak,
    createBattleOrderState,
    applyBattleOrder,
    COMBAT_RESOURCES,
    createCombatResourceState,
    beginCombatResourceRound,
    gainCombatWill,
    noteCombatResourceAction,
    noteCombatResourceReaction,
    combatResourceSpendDef,
    canSpendCombatWill,
    spendCombatWill,
    TACTICAL_OPPORTUNITIES,
    createTacticalOpportunityState,
    armTacticalOpportunity,
    expireTacticalOpportunity,
    tacticalOpportunityDef,
    noteTacticalOpportunityAction,
    noteTacticalOpportunityControl,
    evaluateHoldOpportunity,
    BATTLEFIELD_INTERACTABLES,
    createBattlefieldInteractableState,
    armBattlefieldInteractable,
    expireBattlefieldInteractable,
    battlefieldInteractableDef,
    canUseBattlefieldInteractable,
    consumeBattlefieldInteractable,
    critChance,
    effectiveStat,
    hasStatus,
    hitChance,
    isFront,
    legalEnemyTargets,
    clamp,
    dedupeTeamRoster,
    defeatAnimation,
    hpRatio,
    lowestHealth,
    preferredOppositeTarget,
    selectAiIntent,
    startingTeam,
    teamRage,
    tickStatuses,
    BATTLEFIELD_ZONES,
    battlefieldZone,
    zoneDamageOutgoing,
    zoneDamageIncoming,
    zoneHealOutgoing,
    zoneHealIncoming,
    BATTLE_OBJECTIVES,
    normalizeBattleObjective,
    battleObjectiveEvent,
    evaluateBattleObjective,
    battleObjectiveProgress,
    BOSS_PHASES,
    createBossPhaseState,
    bossPhaseForHp,
    inspectBossPhase,
    activateBossPhase,
    bossPhaseTarget,
    bossPhaseEnergyDrain,
    bossPhaseCanPierce,
    BATTLEFIELD_HAZARDS,
    createBattlefieldHazardState,
    armBattlefieldHazard,
    battlefieldHazardAffects,
    resolveBattlefieldHazard,
    battlefieldHazardLabel
  });
});
// __HV_CORE_UMD_END
})(moduleShim);

export const honVietCore = moduleShim.exports;
export default honVietCore;

