import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(p, 'utf8');
const moduleSource = readFileSync(
  join(process.cwd(), 'src/domain/transaction/receipt-contract.mjs'),
  'utf8'
).replace(/^export\s+/gm, '');

new Function(moduleSource);

const heroMarker = 'function levelUpHero(';
if (!html.includes(heroMarker)) throw new Error('Hero upgrade marker not found');
html = html.replace(
  heroMarker,
  moduleSource + '\n/* Hồn Việt R07: local transaction receipts */\n' + heroMarker
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
  const commandKey=commandId || 'hero.level-up:'+id+':'+(P.revision||0);
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
    mutate:()=>{ hero.level++; return {ok:true,heroId:id,level:hero.level}; }
  });
  if(!tx.ok) return {ok:false,msg:tx.message||'Nâng tướng chưa hoàn tất.',code:tx.code,receipt:tx.receipt};
  if(!tx.duplicate) questProgress('level',1);
  return {ok:true,duplicate:Boolean(tx.duplicate),receipt:tx.receipt};
}
function starUpHero`;
html = html.replace(levelPattern, newLevel);

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

writeFileSync(p, html);
console.log('Transaction contract installed: receipts, idempotent upgrade/mail commits and local ledger');
