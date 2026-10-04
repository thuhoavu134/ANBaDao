import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
export function patchCampaignChapterSettlement(html,runtime){
  if(html.includes('/* HV_CHAPTER_SETTLEMENT_ATOMIC_V1 */'))return html;
  const once=(from,to)=>{if(html.split(from).length!==2)throw new Error('Chapter settlement anchor: '+from.slice(0,100));html=html.replace(from,to);};
  once('function endChapter(options={}){ const idx=ST.chapterIdx, ch=DATA.chapters[idx];',
    '/* HV_CHAPTER_SETTLEMENT_ATOMIC_V1 */\n'+runtime+'\nfunction endChapter(options={}){ const idx=ST.chapterIdx, ch=DATA.chapters[idx];\n  if(options?.referenceLoop===true&&ST.chapterSettlement?.idx===idx){hvShowCommittedChapterResult(ST.chapterSettlement,options);return;}');
  once('win:Boolean(payload.win),sealLoot,mainQuest:', 'win:Boolean(payload.win),sealLoot,chapter:typeof hvApplyCampaignChapterSettlement===\"function\"?hvApplyCampaignChapterSettlement(player,payload):null,mainQuest:');
  once('    if (payload.win && !transaction.duplicate) {', '    ST.chapterSettlement=transaction.result?.chapter||null;\n    if (payload.win && !transaction.duplicate) {');
  once('delete P.campaignStages[idx]; persist(); endChapter({referenceLoop:true,',
    'if(!ST.chapterSettlement){delete P.campaignStages[idx];persist();} endChapter({referenceLoop:true,');
  once('            delete P.campaignStages[idx]; persist();',
    '            if(!ST.chapterSettlement){delete P.campaignStages[idx];persist();}');
  return html;
}
export function installCampaignChapterSettlement(root){
  const p=join(root,'dist','index.html');
  writeFileSync(p,patchCampaignChapterSettlement(readFileSync(p,'utf8'),readFileSync(join(root,'src/ui/campaign-chapter-settlement-runtime.js'),'utf8')));
}
