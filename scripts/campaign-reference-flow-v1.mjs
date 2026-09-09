import { readFileSync, writeFileSync } from 'node:fs';

// Bounded changes inside the existing owners; no new router or result listener.
const patch = (text, from, to) => {
  if (text.split(from).length !== 2) throw new Error('Campaign reference boundary missing/ambiguous: ' + from.slice(0,80));
  return text.replace(from,to);
};
let html = readFileSync('dist/index.html','utf8');
// A valid nonempty selection is intentional, including one hero. Missing or
// wholly invalid legacy squads still receive the original recovery fill.
html = patch(html, '  if(fill){\n    const preferred=', '  if(fill && !out.length){\n    const preferred=');
html = patch(html, 'callback(Boolean(payload.win));', 'callback(Boolean(payload.win), payload.resultAction === "next" ? "next" : "confirm");');
const start = html.indexOf('function startChapter(idx,options={})');
const end = html.indexOf('function startTraining()',start);
if(start<0 || end<0) throw new Error('Campaign start owner missing');
let chapter = html.slice(start,end);
chapter = patch(chapter,'runBattle(battleId,(win)=>{','runBattle(battleId,(win,resultAction="confirm")=>{');
chapter = patch(chapter,'setTimeout(()=>startChapter(idx,{continuing:true}),360);','if(resultAction==="next") setTimeout(()=>startChapter(idx,{continuing:true}),360); else navTo("campaign");');
chapter = patch(chapter,'endChapter({referenceLoop:true,autoContinue:true});','endChapter({referenceLoop:true,autoContinue:resultAction==="next"});');
chapter = chapter.replace('đang tới nhiệm vụ kế tiếp.', 'đã mở nhiệm vụ kế tiếp.');
html = html.slice(0,start)+chapter+html.slice(end);
writeFileSync('dist/index.html',html);

let battle = readFileSync('dist/battle.html','utf8');
battle = patch(battle,'function publishBattleResult() {','function publishBattleResult(resultAction = "confirm") {');
battle = patch(battle,'      win: state.result === TEAM_PLAYER,','      resultAction: resultAction === "next" ? "next" : "confirm",\n      win: state.result === TEAM_PLAYER,');
battle = patch(battle,'publish:()=>{try{return publishBattleResult();}', 'publish:(action="confirm")=>{try{return publishBattleResult(action);}');
// M0/P0 already removed the older bridges. Keep its single result-action owner.
battle = patch(battle,"if(action==='confirm'||action==='next'){try{if(embedded){api?.publish?.();", "if(action==='confirm'||action==='next'){try{if(embedded){api?.publish?.(action);");
writeFileSync('dist/battle.html',battle);
console.log('Campaign reference flow: intentional partial squad, confirm to AFK, explicit next battle');
