import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p = join(process.cwd(), 'dist', 'index.html');
let s = readFileSync(p, 'utf8');

const oldTracks = "const BGM_TRACKS=Object.freeze({maincity:'assets/audio/bgm-lac-than-hub.mp3',combat:'assets/audio/bgm-combat.mp3',challenge:'assets/audio/bgm-challenge.mp3'});";
const newTracks = "const BGM_TRACKS=Object.freeze({maincity:'assets/audio/bgm-hub-new.mp3',hero:'assets/audio/bgm-hero-new.mp3',combat:'assets/audio/bgm-combat-new.mp3',challenge:'assets/audio/bgm-challenge-new.mp3'});const BGM_FALLBACKS=Object.freeze({maincity:'assets/audio/bgm-lac-than-hub.mp3',hero:'assets/audio/bgm_sanh.mp3',combat:'assets/audio/bgm-combat.mp3',challenge:'assets/audio/bgm-challenge.mp3'});";
if(!s.includes(oldTracks)) throw new Error('BGM patch: track table not found');
s=s.replace(oldTracks,newTracks);

const oldPlay = "function playBgm(track){\n  const src=BGM_TRACKS[track]||BGM_TRACKS.maincity;\n  if(bgmTrack!==src){ bgmTrack=src; bgmPlayer.src=src; bgmPlayer.currentTime=0; }\n  bgmPlayer.play().then(()=>{ bgmUnlocked=true; }).catch(()=>{});\n}";
const newPlay = "function playBgm(track){\n  const key=BGM_TRACKS[track]?track:'maincity';\n  const src=BGM_TRACKS[key];\n  const fallback=BGM_FALLBACKS[key]||BGM_FALLBACKS.maincity;\n  if(bgmTrack!==src){ bgmTrack=src; bgmPlayer.src=src; bgmPlayer.currentTime=0; }\n  bgmPlayer.onerror=()=>{if(bgmPlayer.src.includes(src)&&fallback&&fallback!==src){bgmTrack=fallback;bgmPlayer.src=fallback;bgmPlayer.currentTime=0;bgmPlayer.play().catch(()=>{});}};\n  bgmPlayer.play().then(()=>{ bgmUnlocked=true; }).catch(()=>{});\n}";
if(!s.includes(oldPlay)) throw new Error('BGM patch: playBgm not found');
s=s.replace(oldPlay,newPlay);

const oldDesired = "function desiredBgm(name){ if(name==='battle')return 'combat'; if(['tower','expedition','campaign','journey'].includes(name))return 'challenge'; return 'maincity'; }";
const newDesired = "function desiredBgm(name){ if(name==='battle')return 'combat'; if(['heroes','heroDetail'].includes(name))return 'hero'; if(['tower','expedition','campaign','journey'].includes(name))return 'challenge'; return 'maincity'; }";
if(!s.includes(oldDesired)) throw new Error('BGM patch: desiredBgm not found');
s=s.replace(oldDesired,newDesired);

writeFileSync(p,s);
console.log('BGM routing patch applied: hub / hero / combat / challenge');
