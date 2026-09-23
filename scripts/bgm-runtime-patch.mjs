import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let s = readFileSync(p, 'utf8');

const oldTracks = "const BGM_TRACKS=Object.freeze({maincity:'assets/audio/bgm-lac-than-hub.mp3',combat:'assets/audio/bgm-combat.mp3',challenge:'assets/audio/bgm-challenge.mp3'});";
const newTracks = "const BGM_TRACKS=Object.freeze({maincity:'assets/audio/bgm-hub-new.mp3',hero:'assets/audio/bgm-hero-new.mp3',combat:'assets/audio/bgm-combat-new.mp3',challenge:'assets/audio/bgm-challenge-new.mp3'});const BGM_FALLBACKS=Object.freeze({maincity:'assets/audio/bgm-lac-than-hub.mp3',hero:'assets/audio/bgm_sanh.mp3',combat:'assets/audio/bgm-combat.mp3',challenge:'assets/audio/bgm-challenge.mp3'});";
if(!s.includes(oldTracks)) throw new Error('BGM patch: track table not found');
s=s.replace(oldTracks,newTracks);

const oldPlay = "function playBgm(track){\n  const src=BGM_TRACKS[track]||BGM_TRACKS.maincity;\n  if(bgmTrack!==src){ bgmTrack=src; bgmPlayer.src=src; bgmPlayer.currentTime=0; }\n  bgmPlayer.play().then(()=>{ bgmUnlocked=true; }).catch(()=>{});\n}";
const newPlay = "function playBgm(track){\n  const key=BGM_TRACKS[track]?track:'maincity';\n  const src=BGM_TRACKS[key];\n  const fallback=BGM_FALLBACKS[key]||BGM_FALLBACKS.maincity;\n  window.__HV_BGM_TRACK_KEY=key;\n  if(window.HonVietAudio?.playMusic){\n    window.HonVietAudio.setMusicVolume?.(bgmPlayer.volume);\n    const request=window.__HV_BGM_REQUEST=(window.__HV_BGM_REQUEST||0)+1;\n    window.HonVietAudio.playMusic(src,{loop:true,volume:bgmPlayer.volume,category:'bgm'}).then(async ok=>{\n      if(request!==window.__HV_BGM_REQUEST)return;\n      if(ok){bgmTrack=src;bgmUnlocked=true;try{bgmPlayer.pause();}catch(_e){}return;}\n      const context=window.HonVietAudio.context?.();\n      if(context&&context.state!=='running')return;\n      if(!context){bgmTrack=src;bgmPlayer.src=src;bgmPlayer.play().then(()=>{if(request===window.__HV_BGM_REQUEST)bgmUnlocked=true;}).catch(()=>{});return;}\n      if(fallback&&fallback!==src){const fallbackOk=await window.HonVietAudio.playMusic(fallback,{loop:true,volume:bgmPlayer.volume,category:'bgm'});if(request===window.__HV_BGM_REQUEST&&fallbackOk){bgmTrack=fallback;bgmUnlocked=true;}}\n    }).catch(()=>{});\n    return;\n  }\n  if(bgmTrack!==src){ bgmTrack=src; bgmPlayer.src=src; bgmPlayer.currentTime=0; }\n  bgmPlayer.onerror=()=>{if(bgmPlayer.src.includes(src)&&fallback&&fallback!==src){bgmTrack=fallback;bgmPlayer.src=fallback;bgmPlayer.currentTime=0;bgmPlayer.play().catch(()=>{});}};\n  bgmPlayer.play().then(()=>{ bgmUnlocked=true; }).catch(()=>{});\n}";
if(!s.includes(oldPlay)) throw new Error('BGM patch: playBgm not found');
s=s.replace(oldPlay,newPlay);

const oldDesired = "function desiredBgm(name){ if(name==='battle')return 'combat'; if(['tower','expedition','campaign','journey'].includes(name))return 'challenge'; return 'maincity'; }";
const newDesired = "function desiredBgm(name){ if(name==='battle')return 'combat'; if(['heroes','heroDetail'].includes(name))return 'hero'; if(['tower','expedition','campaign','journey'].includes(name))return 'challenge'; return 'maincity'; }";
if(!s.includes(oldDesired)) throw new Error('BGM patch: desiredBgm not found');
s=s.replace(oldDesired,newDesired);

s=s.replace('window.__MG_BGM={player:bgmPlayer,tracks:BGM_TRACKS,play:playBgm};','window.__MG_BGM={player:bgmPlayer,tracks:BGM_TRACKS,play:playBgm};window.__HV_BGM_RETRY=()=>playBgm(window.__HV_BGM_TRACK_KEY||desiredBgm(ST.screen));');
if(!s.includes('window.__HV_BGM_RETRY=')) throw new Error('BGM patch: retry hook not installed');
writeFileSync(p,s);
console.log('BGM routing patch applied: hub / hero / combat / challenge');
