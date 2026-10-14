import test from 'node:test';
import assert from 'node:assert/strict';
import { summonShowcase } from '../src/domain/summon/showcase.mjs';

test('showcase only presents available canonical roster art and wraps scene selection', () => {
 const catalog={linh_dong:{name:'Linh Đồng'},bach_dien:{name:'Bạch Diện'},thay_mo:{name:'Thầy Mo'},luc_anh:{name:'Lục Ảnh'}};
 const posters={linh_dong:'linh.webp',bach_dien:'bach.webp',thay_mo:'mo.webp',luc_anh:'anh.webp'};
 const before=JSON.stringify({catalog,posters});
 const a=summonShowcase(0,catalog,['linh_dong','bach_dien','luc_anh'],posters);
 assert.deepEqual(a.heroes.map(h=>h.id),['linh_dong','bach_dien']);
 assert.equal(summonShowcase(-1,catalog,Object.keys(catalog),posters).index,2);
 assert.equal(summonShowcase(3,catalog,Object.keys(catalog),posters).index,0);
 assert.equal(JSON.stringify({catalog,posters}),before);
});
test('missing art or catalog never produces placeholder heroes', () => {
 assert.deepEqual(summonShowcase(0,{linh_dong:{name:'Linh'}},['linh_dong'],{}).heroes,[]);
 assert.deepEqual(summonShowcase(0,{},[],{}).heroes,[]);
});
