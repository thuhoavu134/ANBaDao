import test from 'node:test';import assert from 'node:assert/strict';import vm from'node:vm';import{readFileSync}from'node:fs';
import{patchSplusBattleHtml}from'../scripts/splus-runtime-v1.mjs';import{patchBeAnBattle,patchBeAnHost,beAnCampaignDescriptor,beAnIdlePages}from'../scripts/be-an-integration.mjs';
import{patchKyVanHost}from'../scripts/ky-van-runtime-v1.mjs';import{patchTieuPhongHost}from'../scripts/tieu-phong-runtime-v1.mjs';import{patchTichDaoHost}from'../scripts/tich-dao-runtime-v1.mjs';import{patchHongThuongHost}from'../scripts/hong-thuong-runtime-v1.mjs';import{patchCoNuongMainIndex}from'../scripts/co-nuong-main-integration.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'),meta=JSON.parse(read('assets/characters/be-an/runtime-meta.json'));
test('real base battle + S+ + Bé An installer parse and retain one scheduler',()=>{
 const base=patchSplusBattleHtml(read('battle.html')),s=patchBeAnBattle(base,read('src/runtime/be-an.js'),meta);
 for(const match of s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 assert.equal((s.match(/async function advanceTurn\(/g)||[]).length,1);assert.equal(patchBeAnBattle(s,'',meta),s);
 assert.match(s,/if\(isBeAn\(actor\)\)return performBeAnAction/);assert.match(s,/if\(isBeAn\(unit\)\)return drawBeAnHero/);
 assert.match(s,/const authoredFallMs=isBeAn\(unit\)\?4000/);
 // The later shared total installer still sees exactly its two existing recovery anchors.
 assert.equal(s.split("setUnitState(actor,'idle',800);state.currentId=null;state.locked=false;").length,3);
});
test('host composes after all authored hero owners; migration grants once without resetting player',()=>{
 let s=read('index.html')+'\n'+read('src/ui/campaign-scene.js');
 for(const [slug,fn]of[['ky-van',patchKyVanHost],['tieu-phong',patchTieuPhongHost],['tich-dao',patchTichDaoHost],['hong-thuong',patchHongThuongHost]])s=fn(s,JSON.parse(read('assets/characters/'+slug+'/runtime-meta.json')),read('src/ui/'+slug+'-detail.js'));
 s=patchBeAnHost(patchCoNuongMainIndex(s),meta);
 const registration=s.slice(s.indexOf('/* BE_AN_HOST_V1 */'),s.indexOf('let P=null, MEMORY_ONLY=false;'));
 const c={DATA:{heroes:{}},CHARACTER_MANIFEST:{}};vm.runInNewContext(registration,c);assert.equal(c.DATA.heroes.be_an.name,'Bé An');assert.equal(c.CHARACTER_MANIFEST.be_an.assets.avatar,'assets/characters/be-an/avatar.webp');
 assert.match(s,/"co_nuong","be_an"\]/);assert.match(s,/Object.assign\(runSpecs,\{be_an:/);
 assert.match(s,/Object.assign\(preparationIdlePacks,\{be_an:/);
 assert.match(s,/width:600px/);assert.match(s,/aspect-ratio:1056\/672/);assert.match(s,/Object.assign\(farmAttackSpecs,\{be_an:/);
 const migration=s.match(/if\(!p.flags\?\.beAnStarter20261018\)\{.*?p.flags.beAnStarter20261018=true;\}/)[0];const p={heroes:{be_an:{owned:false},co_nuong:{level:7}},gold:100,squad:[{id:'co_nuong'}]};vm.runInNewContext(migration,{p});assert.equal(p.heroes.be_an.owned,true);assert.equal(p.gold,100);assert.equal(p.heroes.co_nuong.level,7);p.heroes.be_an.owned=false;vm.runInNewContext(migration,{p});assert.equal(p.heroes.be_an.owned,false);
});

test('Bé An formation uses native paged idle cells instead of half-resolution campaign atlas',()=>{
 const desc=beAnCampaignDescriptor(meta,'idle'),pack=beAnIdlePages(meta);
 assert.equal(desc.cellW,1056);assert.equal(desc.cellH,672);assert.equal(desc.body,480);
 assert.equal(pack.pageFrames,24);assert.equal(pack.pages.length,4);assert.equal(pack.pages[0].src,'assets/characters/be-an/idle-0.webp');
 assert.equal(pack.pages[3].cellW,1056);assert.equal(pack.pages[3].cellH,672);
 assert.equal(pack.poster,null);
});

test('Bé An full hi-res metadata, impact timing and untouched Kiếm Thế shield survive conversion',()=>{const required=['idle','run','basic','ultimate','hit','fall-die','special','vfx-basic','vfx-ultimate','shield'];for(const k of required)assert.ok(meta.clips[k],`missing ${k}`);for(const k of required.slice(0,7)){assert.equal(meta.clips[k].cellW,1056);assert.equal(meta.clips[k].cellH,672);assert.equal(meta.clips[k].body,480);}assert.equal(meta.clips.shield.cellW,224);assert.equal(meta.clips.shield.sourceInfo.frames.length,25);assert.equal(meta.timeline.basic.hits.length,2);assert.equal(meta.timeline.ultimate.hits.length,3);});
