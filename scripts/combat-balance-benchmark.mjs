import {createSplusCombat} from '../src/domain/combat/splus-mechanics.mjs';
import {SPLUS_HEROES} from '../src/domain/hero/splus-catalog.mjs';
import Core from '../src/domain/combat/hon-viet-core.mjs';
import {pathToFileURL} from 'node:url';
export const BENCHMARK_TEAMS={
 balanced:['cuong_dong','giang_quan','tam_nuong','linh_dong','lac_an','mien_nuong'],
 offense:['hac_pha','tieu_hon','da_xoa','cuu_tinh','hoa_bai','cuu_trieu'],
 sustain:['thiet_lanh','tram_chau','thach_mong','thiem_ngan','thuy_co','tue_y']
};
const byKey=new Map(SPLUS_HEROES.map(h=>[h.key,h]));
function random(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
export function simulateMatch({player='balanced',enemy='balanced',level=1,enemyScale=1,seed=1}={}){
 if(!BENCHMARK_TEAMS[player]||!BENCHMARK_TEAMS[enemy])throw new Error('Unknown benchmark team');
 if(!Number.isInteger(level)||level<1||level>30||!Number.isFinite(enemyScale)||enemyScale<=0)throw new Error('Invalid benchmark progression');
 const scale=1+.08*(level-1),rng=random(seed),units=[];
 for(const [team,keys,m]of [['player',BENCHMARK_TEAMS[player],scale],['enemy',BENCHMARK_TEAMS[enemy],enemyScale]])keys.forEach((key,slot)=>{const h=byKey.get(key);units.push({id:team+':'+slot,sourceId:h.id,team,slot,archetype:h.role,hp:Math.round(2000*m),maxHp:Math.round(2000*m),atk:Math.round(180*m),def:Math.round(50*m),energy:35,accuracy:100,evasion:0,crit:10,critRes:0,critDamage:1.55,statuses:[]});});
 let queue=[],actions=0;
 const engine=createSplusCombat({units,mutate:true,rng,onEvent:e=>{if(e.type==='extraTurn')queue.unshift(e.sourceId);if(e.type==='actionDelay'){const i=queue.indexOf(e.targetId);if(i>=0)queue.push(...queue.splice(i,1));}}});engine.start();
 const objective=Core.normalizeBattleObjective({type:'challenge',maxRounds:15});
 const evaluate=round=>Core.evaluateBattleObjective(objective,{round,players:units.filter(u=>u.team==='player'&&u.hp>0),enemies:units.filter(u=>u.team==='enemy'&&u.hp>0)});
 for(let round=1;round<=15;round++){
  engine.beginRound(round);queue=Core.buildTurnOrder(units).slice();let roundActions=0;
  while(queue.length){if(++roundActions>300)throw new Error('Extra-turn loop exceeded benchmark guard');const id=queue.shift(),u=engine.unit(id);if(!u||u.hp<=0)continue;engine.beginTurn(id);const action=engine.chooseAction(id);if(action){const target=engine.targets(id,action)[0];if(target){engine.act(id,action,target.id);actions++;}}const end=evaluate(round);if(end)return{...end,round,actions};}
  engine.finishRound();const end=evaluate(round);if(end)return{...end,round,actions};
 }
 return{...evaluate(16),round:15,actions};
}
export function benchmark(seeds=12){
 const rows=[];
 for(const player of Object.keys(BENCHMARK_TEAMS))for(const enemy of Object.keys(BENCHMARK_TEAMS))for(const level of [1,5,10]){
  let wins=0,rounds=0,caps=0;for(let seed=1;seed<=seeds;seed++){const result=simulateMatch({player,enemy,level,seed});wins+=result.winner==='player';rounds+=result.round;caps+=result.reason?.startsWith('round-limit')?1:0;}
  rows.push({player,enemy,level,seeds,wins,winRate:wins/seeds,averageRounds:Number((rounds/seeds).toFixed(2)),roundLimit:caps});
 }
 return{scope:'Controlled S+ mechanics benchmark; equal base stats 2000 HP / 180 ATK / 50 DEF, level scaling only. Not a production campaign simulator: no legacy kits, gear, account bonuses, formations, art, audio or device timing.',rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(benchmark(),null,2));
