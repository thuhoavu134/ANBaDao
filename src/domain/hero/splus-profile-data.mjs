import metal from './splus-profiles/metal.mjs';
import soul from './splus-profiles/soul.mjs';
import water from './splus-profiles/water.mjs';
import fire from './splus-profiles/fire.mjs';
import wood from './splus-profiles/wood.mjs';
import dream from './splus-profiles/dream.mjs';
export const SPLUS_PROFILE_VERSION='splus-profile/2026-09-08-v2';
export const SPLUS_PROFILE_DATA=Object.freeze([...metal,...soul,...water,...fire,...wood,...dream]);
export const SPLUS_PROFILE_BY_KEY=Object.freeze(Object.fromEntries(SPLUS_PROFILE_DATA.map(p=>[p.key,p])));
