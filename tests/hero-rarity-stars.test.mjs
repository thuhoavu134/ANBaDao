import test from 'node:test';
import assert from 'node:assert/strict';
import {initialHeroStars,normalizeRarityStars,rarityBaseStars,refundableHeroStarShards} from '../src/domain/hero/rarity-stars.mjs';
const defs={ssr:{rarity:'ssr'},six:{rarity:'SSR'},sr:{rarity:'sr'}};
test('new SSR starts at five real stars with no refundable free investment',()=>{
 const hero={owned:true,level:1,...initialHeroStars(defs.ssr)};
 assert.equal(hero.stars,5);assert.equal(refundableHeroStarShards(hero,defs.ssr),0);
 assert.equal(initialHeroStars(defs.sr).stars,1);
});
test('legacy SSR migration preserves paid shards exactly once and leaves SR untouched',()=>{
 for(let n=1;n<=6;n++){
  const player={heroes:{ssr:{owned:true,level:8,stars:n},sr:{owned:true,stars:2}},gold:123,shards:{ssr:7}};
  const oldRefund=10*n*(n-1);
  normalizeRarityStars(player,defs);
  assert.equal(player.heroes.ssr.stars,Math.max(5,n));
  assert.equal(refundableHeroStarShards(player.heroes.ssr,defs.ssr),oldRefund);
  const snapshot=JSON.stringify(player);normalizeRarityStars(player,defs);assert.equal(JSON.stringify(player),snapshot);
  assert.equal(player.gold,123);assert.equal(player.shards.ssr,7);assert.deepEqual(player.heroes.sr,{owned:true,stars:2});
 }
});
test('locked SSR does not gain ownership or paid-refund credit',()=>{
 const p={heroes:{ssr:{owned:false,stars:1}}};normalizeRarityStars(p,defs);
 assert.equal(p.heroes.ssr.owned,false);assert.equal(p.heroes.ssr.stars,5);assert.equal(p.heroes.ssr.legacyStarRefund,0);
});
test('five-to-six costs 100 shards; reset cannot refund free base stars repeatedly',()=>{
 const hero={owned:true,...initialHeroStars(defs.ssr)};
 const spent=20*hero.stars;hero.stars++;
 assert.equal(spent,100);assert.equal(refundableHeroStarShards(hero,defs.ssr),spent);
 hero.stars=rarityBaseStars(defs.ssr);hero.legacyStarRefund=0;
 normalizeRarityStars({heroes:{ssr:hero}},defs);
 assert.equal(refundableHeroStarShards(hero,defs.ssr),0);
});
