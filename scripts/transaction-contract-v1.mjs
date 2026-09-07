import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');
const moduleSource = readFileSync(
  join(process.cwd(), 'src/domain/transaction/receipt-contract.mjs'),
  'utf8'
).replace(/^export\s+/gm, '');

new Function(moduleSource);

const loadoutSource = readFileSync(join(process.cwd(), 'src/domain/hero/loadout.mjs'), 'utf8').replace(/^export\s+/gm, '');
const partyRuntime = readFileSync(join(process.cwd(), 'src/ui/party-command-runtime.js'), 'utf8');
new Function(loadoutSource + '\n' + partyRuntime);
const forgeSource = readFileSync(join(process.cwd(), 'src/domain/equipment/forge-commands.mjs'), 'utf8').replace(/^export\s+/gm, '');
const forgeRuntime = readFileSync(join(process.cwd(), 'src/ui/forge-command-runtime.js'), 'utf8');
new Function(forgeSource + '\n' + forgeRuntime);

const heroMarker = 'function levelUpHero(';
if (!html.includes(heroMarker)) throw new Error('Hero upgrade marker not found');
html = html.replace(
  heroMarker,
  moduleSource + '\n' + loadoutSource + '\n' + forgeSource + '\n/* Hồn Việt R07: local transaction receipts */\n' + heroMarker
);

const helper = `function hvReceiptForCommand(commandId){
  const receipt = getTransactionReceipt(P,commandId);
  return receipt ? {ok:receipt.status==='success',duplicate:true,receipt,result:receipt.result} : null;
}
function hvRunCommittedTransaction({commandId,cost={},balances={},source,reason,reward,applyRewardFn,mutate}){
  let before;
  try { before=JSON.stringify(P); } catch(e) {
    return {ok:false,code:'STATE_NOT_SERIALIZABLE',message:'Không thể chuẩn bị giao dịch.'};
  }
  const txOptions={state:P,commandId,expectedRevision:P?.revision,cost,balances,source,reason,mutate};
  const tx=reward
    ? settleRewardTransaction({...txOptions,reward,applyReward:applyRewardFn||applyReward})
    : executeLocalTransaction(txOptions);
  if(!tx.ok || tx.duplicate) return tx;
  if(typeof persist!=='function' || !persist()){
    try { P=JSON.parse(before); } catch(e) {}
    return {ok:false,code:'SAVE_WRITE_FAILED',message:'Không thể lưu giao dịch.'};
  }
  return tx;
}
window.HonVietTransaction=Object.freeze({commit:hvRunCommittedTransaction,execute:executeLocalTransaction,settleReward:settleRewardTransaction,read:getTransactionReceipt});
`;
const helperMarker = 'function hvReceiptForCommand(';
if (html.includes(helperMarker)) throw new Error('Transaction helper already installed');
html = html.replace(
  '/* Hồn Việt R07: local transaction receipts */',
  '/* Hồn Việt R07: local transaction receipts */\n' + helper
);

const levelPattern = /function levelUpHero\(id\)\{[\s\S]*?\nfunction starUpHero/;
if (!levelPattern.test(html)) throw new Error('Hero upgrade function shape not found');
const newLevel = `function levelUpHero(id,commandId){
  const commandKey=commandId || 'hero.level-up:'+id+':'+heroLevel(id);
  const duplicate=hvReceiptForCommand(commandKey);
  if(duplicate) return duplicate;
  const hero=P.heroes[id];
  if(!hero) return {ok:false,msg:'Không tìm thấy tướng.',code:'HERO_NOT_FOUND'};
  if(heroLevel(id)>=30) return {ok:false,msg:"Đã đạt cấp tối đa (30)",code:'HERO_MAX_LEVEL'};
  const c=levelCost(id);
  if(P.gold<c) return {ok:false,msg:"Không đủ vàng",code:'INSUFFICIENT_FUNDS'};
  const tx=hvRunCommittedTransaction({
    commandId:commandKey,cost:{gold:c},balances:{gold:P.gold},
    source:'hero.level-up',reason:'upgrade',
    mutate:()=>{ hero.level++; questProgress('level',1,false); return {ok:true,heroId:id,level:hero.level,questProgressed:true}; }
  });
  if(!tx.ok) return {ok:false,msg:tx.message||'Nâng tướng chưa hoàn tất.',code:tx.code,receipt:tx.receipt};
  return {ok:true,duplicate:Boolean(tx.duplicate),receipt:tx.receipt};
}
function starUpHero`;
html = html.replace(levelPattern, newLevel);
const levelButtonMarker = "document.getElementById('lvBtn').addEventListener('click',()=>{ const r=levelUpHero(id); if(r.ok)showProgressBurst('LÊN CẤP','Chỉ số của '+DATA.heroes[id].name+' đã tăng.'); else toast(r.msg); refreshResbar(); renderHeroDetail(id); });";
const levelButtonReplacement = "document.getElementById('lvBtn').addEventListener('click',()=>{ const button=document.getElementById('lvBtn'); if(button?.disabled)return; const commandId=button.dataset.hvCommandId || ('hero.level-up:'+id+':'+heroLevel(id)); button.dataset.hvCommandId=commandId; button.disabled=true; const r=levelUpHero(id,commandId); if(r.ok)showProgressBurst('LÊN CẤP','Chỉ số của '+DATA.heroes[id].name+' đã tăng.'); else toast(r.msg||'Nâng tướng chưa hoàn tất.'); refreshResbar(); renderHeroDetail(id); });";
if (!html.includes(levelButtonMarker)) throw new Error('Level-up button marker not found');
html = html.replace(levelButtonMarker, levelButtonReplacement);
const levelBatchMarker = "const r=levelUpHero(id); if(!r.ok){ msg=r.msg; break; }";
const levelBatchReplacement = "const r=levelUpHero(id,'hero.level-up:'+id+':'+heroLevel(id)); if(!r.ok){ msg=r.msg; break; }";
if (!html.includes(levelBatchMarker)) throw new Error('Level-up batch marker not found');
html = html.replace(levelBatchMarker, levelBatchReplacement);

const questPattern = /function claimQuest\(id\)\{[\s\S]*?\nfunction claimActMilestone/;
if (!questPattern.test(html)) throw new Error('Quest claim function shape not found');
const newQuest = `function claimQuest(id,commandId){
  const commandKey=commandId || 'quest.claim:'+id+':'+(P.revision||0);
  const duplicate=hvReceiptForCommand(commandKey);
  if(duplicate) return duplicate.ok;
  const q=P.daily.quests.find(x=>x.id===id), def=DATA.daily.quests.find(x=>x.id===id);
  if(!q||!def||q.claimed||q.progress<def.goal) return false;
  const tx=hvRunCommittedTransaction({
    commandId:commandKey,source:'quest.claim',reason:'reward',
    reward:def.reward,applyRewardFn:applyReward,
    mutate:()=>{
      q.claimed=true;
      P.daily.activityPoints=(P.daily.activityPoints||0)+def.pts;
      return {ok:true,questId:id};
    }
  });
  if(!tx.ok) return false;
  if(!tx.duplicate) clanAddXp(5);
  return true;
}
function claimActMilestone`;
html = html.replace(questPattern, newQuest);

const mailPattern = /function claimMail\(id\)\{[\s\S]*?\nfunction claimAllMail/;
if (!mailPattern.test(html)) throw new Error('Mail claim function shape not found');
const newMail = `function claimMail(id,commandId){
  const commandKey=commandId || 'mail.claim:'+id+':'+(P.revision||0);
  const duplicate=hvReceiptForCommand(commandKey);
  if(duplicate) return duplicate.ok;
  const m=P.mail.find(x=>x.id===id);
  if(!m||m.claimed) return false;
  const tx=hvRunCommittedTransaction({
    commandId:commandKey,source:'mail.claim',reason:'reward',
    reward:m.reward,applyRewardFn:applyReward,
    mutate:()=>{ m.claimed=true; return {ok:true,mailId:id}; }
  });
  if(!tx.ok) return false;
  refreshResbar();
  return true;
}
function claimAllMail`;
html = html.replace(mailPattern, newMail);

const equipStart = html.indexOf('function equipItem(');
const equipEnd = html.indexOf('function salvageItem(', equipStart);
if (equipStart < 0 || equipEnd < 0) throw new Error('Equipment command boundary not found');
html = html.slice(0, equipStart) + partyRuntime + '\n' + html.slice(equipEnd);

const teamStart = html.indexOf("document.getElementById('teamSave').addEventListener(");
const teamEnd = html.indexOf('/* ---------- HEROES + DETAIL', teamStart);
if (teamStart < 0 || teamEnd < 0) throw new Error('Formation handler boundary not found');
html = html.slice(0, teamStart) + `document.getElementById('teamSave').addEventListener('click',()=>{
  const button=document.getElementById('teamSave');
  if(button.disabled) return;
  button.disabled=true;
  const commandId=button.dataset.hvCommandId || ('formation.save:'+(P.revision||0));
  button.dataset.hvCommandId=commandId;
  const result=saveFormationCommand(teamPicks,commandId);
  if(!result.ok){ button.disabled=false; toast(result.message||'Chưa lưu được đội hình. Hãy thử lại.'); return; }
  teamPicks=P.squad.map(pick=>({...pick}));
  toast('Đã lưu đội hình không trùng tướng.');
  navTo('hub');
});
` + html.slice(teamEnd);
const renderTeamMarker = 'function renderTeam(){';
if (!html.includes(renderTeamMarker)) throw new Error('Formation render marker not found');
html = html.replace(renderTeamMarker, renderTeamMarker + `
  const saveButton=document.getElementById('teamSave');
  if(saveButton){saveButton.disabled=false;delete saveButton.dataset.hvCommandId;}
`);

const equipButton = '<button class="btn ghost sm eqp" data-u="${it.uid}">Trang bị</button>';
if (!html.includes(equipButton)) throw new Error('Forge equipment button marker not found');
html = html.replace(equipButton, equipButton + '${eb?`<button class="btn ghost sm uneqp" data-u="${it.uid}" data-h="${eb}">Tháo</button>`:""}');

function replaceOnce(before, after) {
  if (html.split(before).length !== 2) throw new Error('Forge patch expected one marker: ' + before.slice(0, 80));
  html = html.replace(before, () => after);
}
function replaceSection(startMarker, endMarker, content) {
  const start = html.indexOf(startMarker), end = html.indexOf(endMarker, start);
  if (start < 0 || end < start || html.indexOf(startMarker, start + 1) !== -1) throw new Error('Forge boundary not found: ' + startMarker);
  html = html.slice(0, start) + content + html.slice(end);
}

// Existing progress functions can now participate in an outer transaction.
// Their other callers keep the previous default of saving immediately.
replaceOnce('function weeklyProgress(type,amt=1){', 'function weeklyProgress(type,amt=1,save=true){');
const weeklyStart = html.indexOf('function weeklyProgress('), weeklyEnd = html.indexOf('function claimWeeklyQuest(', weeklyStart);
replaceOnce(html.slice(weeklyStart, weeklyEnd), html.slice(weeklyStart, weeklyEnd).replace('if(ch)persist();', 'if(ch&&save)persist();'));
replaceOnce('function questProgress(type,amt){', 'function questProgress(type,amt,save=true){');
replaceOnce('weeklyProgress(type,amt); if(ch)persist();', 'weeklyProgress(type,amt,save); if(ch&&save)persist();');

replaceSection('function setForgeMold(', 'function forgeMoldBonus(', '');
replaceSection('function startDualForge(', 'const RFAC=', '');
replaceSection('function craftItem(', 'function enhCost(', '');
replaceOnce('function enhCost(it){ return {gold:Math.round(80*(it.lvl+1)*RFAC[it.rar]), hoat:4*(it.lvl+1)}; }',
  'function enhCost(it){ return forgeEnhanceCost(it,RFAC); }');
replaceSection('function enhanceItem(', '/* Samkok E10/E11:', '');
replaceSection('function salvageItem(', 'function renderForge(', forgeRuntime + '\n');
replaceSection("  b.querySelectorAll('.moldbtn').forEach", '/* ===================== BỘ BẢO VẬT', '  bindForgeCommands(b);\n}\n');

const salvageButton = '<button class="btn ghost sm salv" data-u="${it.uid}" ${eb?\'disabled\':\'\'}>Phân giải</button>';
replaceOnce(salvageButton,
  '<button class="btn ghost sm itemlock" data-u="${it.uid}" data-locked="${isForgeItemLocked(it)}">${isForgeItemLocked(it)?"Mở khóa":"Khóa đồ"}</button>'
  + '<button class="btn ghost sm salv" data-u="${it.uid}" ${eb||isForgeItemLocked(it)?\'disabled\':\'\'}>Phân giải</button>');
replaceOnce('</head>', `<style id="samkok-forge-confirm-style">
.forge-salvage-dialog{box-sizing:border-box;width:min(92vw,420px);max-height:86dvh;overflow:auto;padding:24px;border:1px solid #b4975b;border-radius:18px;background:#171b2c;color:#f6edd7;font:16px/1.5 system-ui,sans-serif;box-shadow:0 18px 60px #0009}
.forge-salvage-dialog::backdrop{background:#060912bc}
.forge-salvage-dialog h3{margin:0 0 16px}.forge-salvage-dialog p{margin:12px 0}.forge-salvage-gain{font-weight:700;color:#ffd978}.forge-salvage-error{color:#ffb4a8}.forge-salvage-error:empty{display:none}
.forge-salvage-dialog .econ-actions{gap:10px;margin-top:20px}.forge-salvage-dialog button{min-height:44px;white-space:normal}
</style></head>`);

writeFileSync(p, html);
console.log('Transaction contract installed: receipts, loadout and forge commits with local ledger');
